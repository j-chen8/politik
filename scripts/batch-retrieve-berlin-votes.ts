/**
 * Berlin-Votes Batch-Retrieve mit Polling + INSERT.
 *
 * Run: npx tsx scripts/batch-retrieve-berlin-votes.ts
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { PROMPT_VERSION } from "../src/lib/berlin-votes-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin-votes");
const POLL_INTERVAL_S = 20;
const MAX_POLLS = 360; // 2h max

interface StateFile {
  batch_id: string;
  submitted_at: string;
  prompt_version: string;
  request_count: number;
  estimated_cost_batch: number;
  custom_id_to_meta: Record<string, {
    plpr_lok_url: string; offset: number; sitzung_nr: number | null; datum: string | null; snippet: string;
  }>;
}

function asJson(v: unknown): string | null {
  return v === null || v === undefined ? null : JSON.stringify(v);
}

async function main() {
  const stateFile = path.join(STATE_DIR, "batch-1.json");
  if (!fs.existsSync(stateFile)) {
    console.error(`State-Datei fehlt: ${stateFile}`);
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(stateFile, "utf-8")) as StateFile;
  console.log(`=== Berlin-Votes Retrieve (${state.batch_id}) ===`);
  console.log(`Submitted: ${state.submitted_at} | Requests: ${state.request_count}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");
  const client = new Anthropic({ apiKey });

  let batch = await client.messages.batches.retrieve(state.batch_id);
  let polled = 0;
  while (batch.processing_status !== "ended") {
    if (polled >= MAX_POLLS) { console.log(`\n⚠ Timeout`); return; }
    const c = batch.request_counts;
    process.stdout.write(`  [${polled * POLL_INTERVAL_S}s] ${batch.processing_status} | proc=${c.processing} ok=${c.succeeded} err=${c.errored}\r`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_S * 1000));
    polled++;
    batch = await client.messages.batches.retrieve(state.batch_id);
  }
  console.log(`\n✓ Batch ended nach ${polled * POLL_INTERVAL_S}s`);
  console.log(`  succeeded=${batch.request_counts.succeeded} errored=${batch.request_counts.errored}`);

  // DB-Resolver für DS-Nrn → dbid
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");
  const resolveDokNrStmt = db.prepare(`SELECT dbid FROM berlin_documents WHERE dok_nr = ?`);
  function resolveDsDbids(nrn: string[]): string[] {
    const out: string[] = [];
    for (const nr of nrn) {
      const row = resolveDokNrStmt.get(nr) as { dbid: string } | undefined;
      if (row) out.push(row.dbid);
    }
    return out;
  }

  const insert = db.prepare(`
    INSERT OR REPLACE INTO berlin_votes (
      plpr_lok_url, snippet_offset, sitzung_nr, datum,
      drucksache_nrn_json, drucksache_dbids_json,
      vote_type, outcome, modus, fraktion_votes_json, stimmen_zahlen_json,
      raw_snippet, raw_tool_input_json, model, prompt_version, batch_id,
      input_tokens, cache_read_input_tokens, cache_creation_input_tokens, output_tokens,
      stop_reason, error_type, error_message
    ) VALUES (
      @plpr_lok_url, @snippet_offset, @sitzung_nr, @datum,
      @drucksache_nrn_json, @drucksache_dbids_json,
      @vote_type, @outcome, @modus, @fraktion_votes_json, @stimmen_zahlen_json,
      @raw_snippet, @raw_tool_input_json, @model, @prompt_version, @batch_id,
      @input_tokens, @cache_read_input_tokens, @cache_creation_input_tokens, @output_tokens,
      @stop_reason, @error_type, @error_message
    )
  `);

  let nInserted = 0, nErrored = 0;
  const outcomeTally = new Map<string, number>();
  const modusTally = new Map<string, number>();
  const voteTypeTally = new Map<string, number>();
  let cacheReadTotal = 0, cacheWriteTotal = 0, costReal = 0;

  for await (const entry of await client.messages.batches.results(state.batch_id)) {
    const meta = state.custom_id_to_meta[entry.custom_id];
    if (!meta) { console.log(`⚠ Unknown custom_id: ${entry.custom_id}`); continue; }

    if (entry.result.type !== "succeeded") {
      nErrored++;
      insert.run({
        plpr_lok_url: meta.plpr_lok_url, snippet_offset: meta.offset,
        sitzung_nr: meta.sitzung_nr, datum: meta.datum,
        drucksache_nrn_json: null, drucksache_dbids_json: null,
        vote_type: "unklar", outcome: "kein_vote", modus: null,
        fraktion_votes_json: null, stimmen_zahlen_json: null,
        raw_snippet: meta.snippet, raw_tool_input_json: null,
        model: null, prompt_version: state.prompt_version, batch_id: state.batch_id,
        input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0,
        stop_reason: null, error_type: entry.result.type, error_message: JSON.stringify(entry.result).slice(0, 1000),
      });
      continue;
    }

    const msg: any = entry.result.message;
    const toolUse = msg.content.find((c: any) => c.type === "tool_use");
    const analysis = toolUse?.input as Record<string, unknown> | undefined;
    if (!analysis) { nErrored++; continue; }

    const drucksache_nrn = Array.isArray(analysis.drucksache_nrn) ? (analysis.drucksache_nrn as unknown[]).filter((x): x is string => typeof x === "string") : [];
    const drucksache_dbids = resolveDsDbids(drucksache_nrn);
    const outcome = typeof analysis.outcome === "string" ? analysis.outcome : "kein_vote";
    const modus = typeof analysis.modus === "string" ? analysis.modus : null;
    const voteType = typeof analysis.vote_type === "string" ? analysis.vote_type : "unklar";
    outcomeTally.set(outcome, (outcomeTally.get(outcome) ?? 0) + 1);
    if (modus) modusTally.set(modus, (modusTally.get(modus) ?? 0) + 1);
    voteTypeTally.set(voteType, (voteTypeTally.get(voteType) ?? 0) + 1);

    const cr = msg.usage.cache_read_input_tokens ?? 0;
    const cw = msg.usage.cache_creation_input_tokens ?? 0;
    const inp = msg.usage.input_tokens ?? 0;
    const out = msg.usage.output_tokens ?? 0;
    cacheReadTotal += cr;
    cacheWriteTotal += cw;
    costReal += inp * 0.5e-6 + cr * 0.025e-6 + cw * 0.625e-6 + out * 2.5e-6;

    insert.run({
      plpr_lok_url: meta.plpr_lok_url, snippet_offset: meta.offset,
      sitzung_nr: meta.sitzung_nr, datum: meta.datum,
      drucksache_nrn_json: drucksache_nrn.length ? JSON.stringify(drucksache_nrn) : null,
      drucksache_dbids_json: drucksache_dbids.length ? JSON.stringify(drucksache_dbids) : null,
      vote_type: voteType, outcome, modus,
      fraktion_votes_json: asJson(analysis.fraktion_votes),
      stimmen_zahlen_json: asJson(analysis.stimmen_zahlen),
      raw_snippet: meta.snippet, raw_tool_input_json: JSON.stringify(analysis),
      model: msg.model ?? "claude-haiku-4-5", prompt_version: state.prompt_version, batch_id: state.batch_id,
      input_tokens: inp, cache_read_input_tokens: cr, cache_creation_input_tokens: cw, output_tokens: out,
      stop_reason: msg.stop_reason, error_type: null, error_message: null,
    });
    nInserted++;
  }
  db.close();

  console.log(`\n✓ ${nInserted} eingefügt, ${nErrored} Fehler\n`);
  console.log(`=== Stats ===`);
  console.log(`  Outcome:    ${[...outcomeTally.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  console.log(`  Modus:      ${[...modusTally.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  console.log(`  Vote-Type:  ${[...voteTypeTally.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  const cacheHit = (cacheReadTotal + cacheWriteTotal) > 0 ? cacheReadTotal / (cacheReadTotal + cacheWriteTotal) * 100 : 0;
  console.log(`  Real-Cost (Batch): $${costReal.toFixed(2)} (estimate war $${state.estimated_cost_batch})`);
  console.log(`  Cache-Hit-Rate: ${cacheHit.toFixed(0)}%`);
}

main().catch((e) => { console.error(e); process.exit(1); });
