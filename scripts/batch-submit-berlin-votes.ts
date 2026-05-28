/**
 * Berlin-Votes Batch-Submit via Anthropic Batch API.
 *
 * Extract all "bitte ich ... um das Handzeichen"-Events from Berlin-Plenarprotokollen,
 * sende jeden Snippet an Haiku 4.5 zur Fraktions-Vote-Extraktion.
 *
 * Run:
 *   npx tsx scripts/batch-submit-berlin-votes.ts             (Pre-Flight)
 *   npx tsx scripts/batch-submit-berlin-votes.ts --confirm   (Submit)
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPT_VERSION, MODEL, VOTE_TOOL, buildSystemPrompt,
  extractVoteEvents, extractSitzungNr, extractSitzungDatum,
} from "../src/lib/berlin-votes-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin-votes");
const MAX_TOKENS = 1024;

interface VoteEventMeta {
  plpr_lok_url: string;
  offset: number;
  sitzung_nr: number | null;
  datum: string | null;
  snippet: string;
  drucksache_nrn_prefiltered: string[];
}

function customId(plpr_url: string, offset: number): string {
  const slug = plpr_url.split("/").pop()?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "plpr";
  return `${slug}__${offset}`;
}

async function main() {
  const args = process.argv.slice(2);
  const doSubmit = args.includes("--confirm");

  console.log("=== Berlin-Votes Batch-Submit ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const stateFile = path.join(STATE_DIR, "batch-1.json");
  if (fs.existsSync(stateFile)) {
    const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    console.log(`⚠ Bestehender Batch: ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) { console.log(`Lösche zuerst ${stateFile}`); process.exit(1); }
  }

  const db = new Database(DB_PATH, { readonly: true });
  // Quelle: direkt aus berlin_pdf_texts (vorher: JOIN berlin_documents — gefährdete
  // 5 nachträglich geseedete Sitzungen 11/17/46/47/52, die in berlin_documents fehlen).
  const plpr = db.prepare(`
    SELECT DISTINCT t.lok_url, t.full_text, t.pdf_filename
    FROM berlin_pdf_texts t
    WHERE t.dok_art = 'Plenarprotokoll'
      AND t.pdf_filename LIKE '%-wp.pdf'
      AND t.full_text IS NOT NULL AND t.full_text != ''
    ORDER BY t.lok_url
  `).all() as Array<{ lok_url: string; full_text: string; pdf_filename: string }>;

  // Existing votes: skip wenn schon analysiert
  const alreadyDone = new Set<string>();
  try {
    const rows = db.prepare(`SELECT plpr_lok_url, snippet_offset FROM berlin_votes WHERE error_type IS NULL`).all() as Array<{ plpr_lok_url: string; snippet_offset: number }>;
    for (const r of rows) alreadyDone.add(`${r.plpr_lok_url}__${r.snippet_offset}`);
  } catch { /* table evt. noch leer */ }
  db.close();

  // Events extrahieren
  const events: VoteEventMeta[] = [];
  for (const p of plpr) {
    const sitzungNr = extractSitzungNr(p.full_text);
    const datum = extractSitzungDatum(p.full_text);
    for (const e of extractVoteEvents(p.full_text)) {
      const key = `${p.lok_url}__${e.offset}`;
      if (alreadyDone.has(key)) continue;
      events.push({
        plpr_lok_url: p.lok_url,
        offset: e.offset,
        sitzung_nr: sitzungNr,
        datum,
        snippet: e.snippet,
        drucksache_nrn_prefiltered: e.drucksache_nrn_prefiltered,
      });
    }
  }

  console.log(`Plenarprotokolle:    ${plpr.length}`);
  console.log(`Bereits analysiert:  ${alreadyDone.size}`);
  console.log(`Neue Vote-Events:    ${events.length}\n`);
  if (events.length === 0) { console.log("Nichts zu tun."); return; }

  // Build Requests
  const systemPrompt = buildSystemPrompt();
  const requests = events.map((e) => ({
    _meta: { plpr_lok_url: e.plpr_lok_url, offset: e.offset, sitzung_nr: e.sitzung_nr, datum: e.datum, snippet: e.snippet },
    custom_id: customId(e.plpr_lok_url, e.offset),
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
      tools: [VOTE_TOOL] as any,
      tool_choice: { type: "tool" as const, name: VOTE_TOOL.name } as any,
      messages: [{
        role: "user" as const,
        content: `KONTEXT-HINWEIS: Im Snippet vorgefundene Drucksachen-Referenzen: ${JSON.stringify(e.drucksache_nrn_prefiltered)}. Datum der Sitzung: ${e.datum ?? "unbekannt"}.\n\nSNIPPET:\n${e.snippet}`,
      }],
    },
  }));

  // Cost-Estimate
  const inputChars = events.reduce((a, e) => a + e.snippet.length, 0);
  const inputTokens = Math.ceil(inputChars / 4);
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost  = (sysTokens * (requests.length - 1) * 0.05) / 1_000_000;
  const inputCost      = (inputTokens * 1) / 1_000_000;
  const outputCost     = (requests.length * 150 * 5) / 1_000_000;
  const totalLive  = cacheWriteCost + cacheReadCost + inputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  console.log(`System-Prompt: ${sysTokens} Tokens (Cache-target ≥2048)`);
  console.log(`Σ Snippet-Input: ${inputChars.toLocaleString("de-DE")} Z. (~${(inputTokens/1000).toFixed(0)}k Tokens)`);
  console.log(`Cost-Estimate Live:  $${totalLive.toFixed(2)}`);
  console.log(`Cost-Estimate Batch: $${totalBatch.toFixed(2)} (50 % off)`);

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
  console.log(`\nNext: npx tsx scripts/batch-retrieve-berlin-votes.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
