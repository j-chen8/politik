/**
 * Berlin-Beschlussempfehlungen LLM-Batch-Submit.
 *
 * Hintergrund: Bis Stage 4 wurden alle 935 Beschlussempfehlungen nur per Regex
 * auf das Outcome („wird angenommen / abgelehnt") gelabelt. Inhaltliche Synthese
 * (welche Änderungen empfiehlt der Ausschuss?) fehlt — sichtbar bei DS wie
 * 19/1350 (180 S. Haushalt-Auflagen, UI zeigt nur „annahme_geaendert").
 *
 * Run:
 *   npx tsx scripts/batch-submit-berlin-beschlussempfehlungen.ts            # Pre-Flight
 *   npx tsx scripts/batch-submit-berlin-beschlussempfehlungen.ts --confirm  # Submit
 *
 * Längenverteilung (Stand 2026-05-28, 935 mit PDF-Text):
 *   709 Stempel-DS (<1k Z., reines „Antrag X abgelehnt")
 *   199 mit 1-5 Änderungs-Bullets (1k-5k Z.)
 *    24 mit echtem Empfehlungs-Text (5k-100k Z.)
 *     3 Haushalt-Monster (>300k Z.)
 *
 * Idempotent: überspringt DS, die schon klasse='beschlussempfehlung' (nicht _regex) haben.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, PROMPT_VERSION,
  buildSystemPrompt, stripBoilerplate, capText,
} from "../src/lib/berlin-drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const METHOD_PATH = path.join(process.cwd(), "docs/summarization-methodology-berlin-drucksachen.md");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin-ds");
const MIN_CHARS = 300;  // niedriger als Hauptskript (500) — Stempel-DS sind ~600 Z.
const MAX_TOKENS = 2000;
const MODEL = "claude-haiku-4-5";

function customId(dbid: string): string {
  return `be-${dbid.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

interface DSCandidate {
  dbid: string;
  titel: string | null;
  full_text: string;
  chars: number;
}

function selectCandidates(db: Database.Database): DSCandidate[] {
  // Skip DS, die schon LLM-Analyse haben (klasse='beschlussempfehlung', nicht _regex)
  const alreadyDone = new Set(
    (db.prepare(`
      SELECT dbid FROM berlin_drucksachen_analyses
      WHERE klasse = 'beschlussempfehlung' AND error_type IS NULL
    `).all() as { dbid: string }[]).map((r) => r.dbid)
  );

  const rows = db.prepare(`
    SELECT d.dbid, d.titel, t.full_text, t.chars
      FROM berlin_documents d
      JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
     WHERE d.dok_typ_label = 'Beschlussempfehlung'
       AND t.chars >= ?
  `).all(MIN_CHARS) as DSCandidate[];

  return rows.filter((r) => !alreadyDone.has(r.dbid));
}

async function main() {
  const args = process.argv.slice(2);
  const doSubmit = args.includes("--confirm");

  console.log(`=== Berlin-Beschlussempfehlungen LLM-Submit ===\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in .env");
  if (!fs.existsSync(METHOD_PATH)) throw new Error(`Methodology missing: ${METHOD_PATH}`);

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const stateFile = path.join(STATE_DIR, `batch-beschlussempfehlungen.json`);
  if (fs.existsSync(stateFile)) {
    const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    console.log(`⚠ Bestehender Batch: ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) {
      console.log(`  Lösche zuerst ${stateFile} wenn das ein neuer Submit sein soll.`);
      process.exit(1);
    }
  }

  const methodology = fs.readFileSync(METHOD_PATH, "utf-8");
  const methodologySha = crypto.createHash("sha256").update(methodology).digest("hex").slice(0, 16);
  console.log(`Methodology-SHA: ${methodologySha} · Prompt-Version: ${PROMPT_VERSION}`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  const candidates = selectCandidates(db);
  db.close();

  console.log(`\n${candidates.length} Beschlussempfehlungen für LLM-Analyse`);
  if (candidates.length === 0) return;

  // Build Requests
  const cfg = PROMPTS_BY_CLASS.beschlussempfehlung;
  const systemPrompt = buildSystemPrompt();
  const requests = candidates.map((c) => {
    const stripped = stripBoilerplate(c.full_text);
    const { text, truncated } = capText(stripped, cfg.cap_chars);
    const userContent = `${cfg.instruction}\n\nDRUCKSACHEN-TEXT (Doc-Typ: Beschlussempfehlung${truncated ? `, gekürzt auf ${cfg.cap_chars} Z.` : ""}):\n\n${text}`;
    return {
      _meta: { dbid: c.dbid, chars_in: text.length },
      custom_id: customId(c.dbid),
      params: {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
        tools: [cfg.tool] as any,
        tool_choice: { type: "tool" as const, name: cfg.tool.name } as any,
        messages: [{ role: "user" as const, content: userContent }],
      },
    };
  });

  // Cost-Estimate
  const totalChars = requests.reduce((a, r) => a + r._meta.chars_in, 0);
  const userTokens = Math.ceil(totalChars / 4);
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  // Cache: 1× write, n-1× read
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost = (sysTokens * (requests.length - 1) * 0.05) / 1_000_000;
  const userInputCost = (userTokens * 1) / 1_000_000;  // Haiku 4.5 input $1/M
  const outputTokensExpected = requests.length * 600;  // Beschlussempfehlungen kürzer als Anträge
  const outputCost = (outputTokensExpected * 5) / 1_000_000;
  const totalLive = cacheWriteCost + cacheReadCost + userInputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  const payloadSize = JSON.stringify(requests.map((r) => ({ custom_id: r.custom_id, params: r.params }))).length;
  console.log(`\nΣ User-Input: ${totalChars.toLocaleString("de-DE")} Z. (~${(userTokens / 1000).toFixed(0)}k Tokens)`);
  console.log(`System-Prompt: ~${(sysTokens / 1000).toFixed(1)}k Tokens (1× cache-write, ${requests.length - 1}× cache-read)`);
  console.log(`Payload-Größe: ${(payloadSize / 1_000_000).toFixed(1)} MB (Limit 256 MB)`);
  console.log(`Cost-Estimate Live:  $${totalLive.toFixed(2)}`);
  console.log(`Cost-Estimate Batch: $${totalBatch.toFixed(2)} (50% off)`);

  if (!doSubmit) {
    console.log(`\nPre-Flight only. --confirm für Submit.`);
    return;
  }

  console.log(`\n→ Submitting Batch...`);
  const client = new Anthropic({ apiKey });
  const t0 = Date.now();
  const batch = await client.messages.batches.create({
    requests: requests.map((r) => ({ custom_id: r.custom_id, params: r.params })) as any,
  });
  console.log(`✓ batch_id: ${batch.id} · status: ${batch.processing_status} · ${Date.now() - t0}ms`);

  const state = {
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    prompt_version: PROMPT_VERSION,
    methodology_sha: methodologySha,
    request_count: requests.length,
    custom_id_to_dbid: Object.fromEntries(requests.map((r) => [r.custom_id, r._meta.dbid])),
    estimated_cost_batch: Number(totalBatch.toFixed(2)),
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`✓ State: ${stateFile}`);
  console.log(`\nNext: npx tsx scripts/batch-retrieve-berlin-beschlussempfehlungen.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
