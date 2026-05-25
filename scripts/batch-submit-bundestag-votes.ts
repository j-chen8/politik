/**
 * Bundestag-Votes Batch-Submit aus XML-Plenarprotokollen (21. WP).
 *
 * Run:
 *   npx tsx scripts/batch-submit-bundestag-votes.ts             (Pre-Flight)
 *   npx tsx scripts/batch-submit-bundestag-votes.ts --confirm   (Submit)
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPT_VERSION, MODEL, VOTE_TOOL, buildSystemPrompt,
  extractVoteEvents, extractSessionMeta, xmlToText,
} from "../src/lib/bundestag-votes-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");
const STATE_DIR = path.join(process.cwd(), ".batch-state-bundestag-votes");
const MAX_TOKENS = 1024;

interface VoteEventMeta {
  xml_source: string;
  offset: number;
  wahlperiode: number | null;
  sitzung_nr: number | null;
  datum: string | null;
  snippet: string;
  drucksache_nrn_prefiltered: string[];
}

function customId(xml_source: string, offset: number): string {
  const slug = xml_source.replace(/\.xml$/, "");
  return `bt_${slug}__${offset}`;
}

async function main() {
  const doSubmit = process.argv.includes("--confirm");
  console.log("=== Bundestag-Votes Batch-Submit ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const stateFile = path.join(STATE_DIR, "batch-1.json");
  if (fs.existsSync(stateFile)) {
    const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    console.log(`⚠ Bestehender Batch: ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) { console.log(`Lösche zuerst ${stateFile}`); process.exit(1); }
  }

  // Existing votes für Idempotenz
  const db = new Database(DB_PATH, { readonly: true });
  const alreadyDone = new Set<string>();
  try {
    const rows = db.prepare(`SELECT xml_source, snippet_offset FROM bundestag_votes WHERE error_type IS NULL`).all() as Array<{ xml_source: string; snippet_offset: number }>;
    for (const r of rows) alreadyDone.add(`${r.xml_source}__${r.snippet_offset}`);
  } catch { /* table evt. noch leer */ }
  db.close();

  const xmlFiles = fs.readdirSync(XML_DIR).filter((f) => f.endsWith(".xml")).sort();
  const events: VoteEventMeta[] = [];
  for (const f of xmlFiles) {
    const xml = fs.readFileSync(path.join(XML_DIR, f), "utf-8");
    const meta = extractSessionMeta(xml);
    const text = xmlToText(xml);
    for (const e of extractVoteEvents(text)) {
      const key = `${f}__${e.offset}`;
      if (alreadyDone.has(key)) continue;
      events.push({
        xml_source: f,
        offset: e.offset,
        wahlperiode: meta.wahlperiode,
        sitzung_nr: meta.sitzung_nr,
        datum: meta.datum,
        snippet: e.snippet,
        drucksache_nrn_prefiltered: e.drucksache_nrn_prefiltered,
      });
    }
  }

  console.log(`XML-Files:           ${xmlFiles.length}`);
  console.log(`Bereits analysiert:  ${alreadyDone.size}`);
  console.log(`Neue Vote-Events:    ${events.length}\n`);
  if (events.length === 0) { console.log("Nichts zu tun."); return; }

  const systemPrompt = buildSystemPrompt();
  const requests = events.map((e) => ({
    _meta: { xml_source: e.xml_source, offset: e.offset, wahlperiode: e.wahlperiode, sitzung_nr: e.sitzung_nr, datum: e.datum, snippet: e.snippet },
    custom_id: customId(e.xml_source, e.offset),
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
      tools: [VOTE_TOOL] as any,
      tool_choice: { type: "tool" as const, name: VOTE_TOOL.name } as any,
      messages: [{
        role: "user" as const,
        content: `KONTEXT: WP=${e.wahlperiode}, Sitzung=${e.sitzung_nr}, Datum=${e.datum ?? "?"}. Im Snippet gefundene DS-Refs: ${JSON.stringify(e.drucksache_nrn_prefiltered)}.\n\nSNIPPET:\n${e.snippet}`,
      }],
    },
  }));

  const inputChars = events.reduce((a, e) => a + e.snippet.length, 0);
  const inputTokens = Math.ceil(inputChars / 4);
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost  = (sysTokens * (requests.length - 1) * 0.05) / 1_000_000;
  const inputCost      = (inputTokens * 1) / 1_000_000;
  const outputCost     = (requests.length * 150 * 5) / 1_000_000;
  const totalLive = cacheWriteCost + cacheReadCost + inputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  console.log(`System-Prompt: ${sysTokens} Tokens`);
  console.log(`Σ Snippet-Input: ${inputChars.toLocaleString("de-DE")} Z. (~${(inputTokens/1000).toFixed(0)}k Tokens)`);
  console.log(`Cost-Estimate Live:  $${totalLive.toFixed(2)}`);
  console.log(`Cost-Estimate Batch: $${totalBatch.toFixed(2)}`);

  if (!doSubmit) { console.log(`\nPre-Flight only. --confirm für Submit.`); return; }

  console.log(`\n→ Submitting...`);
  const client = new Anthropic({ apiKey });
  const t0 = Date.now();
  const batch = await client.messages.batches.create({
    requests: requests.map((r) => ({ custom_id: r.custom_id, params: r.params })) as any,
  });
  console.log(`✓ batch_id: ${batch.id} status: ${batch.processing_status} (${Date.now()-t0}ms)`);

  const state = {
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    prompt_version: PROMPT_VERSION,
    request_count: requests.length,
    estimated_cost_batch: Number(totalBatch.toFixed(3)),
    custom_id_to_meta: Object.fromEntries(requests.map((r) => [r.custom_id, r._meta])),
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`✓ State: ${stateFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
