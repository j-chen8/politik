/**
 * Berlin-Beschlussempfehlungen LLM-Batch-Retrieve mit Polling + UPSERT.
 *
 * Schreibt klasse='beschlussempfehlung' (überschreibt klasse='beschlussempfehlung_regex'
 * via INSERT OR REPLACE). Behält regex_label-Spalte für historische Outcome-Spur.
 *
 * Run:  npx tsx scripts/batch-retrieve-berlin-beschlussempfehlungen.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import {
  validateTonalitaet, validateThemen, safeParseArray, applyTagDriftFix,
} from "../src/lib/berlin-drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin-ds");
const POLL_INTERVAL_S = 30;
const MAX_POLLS = 240;

interface StateFile {
  batch_id: string;
  submitted_at: string;
  prompt_version: string;
  methodology_sha: string;
  request_count: number;
  custom_id_to_dbid: Record<string, string>;
  estimated_cost_batch: number;
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

async function main() {
  const stateFile = path.join(STATE_DIR, `batch-beschlussempfehlungen.json`);
  if (!fs.existsSync(stateFile)) {
    console.error(`State-Datei fehlt: ${stateFile}`);
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(stateFile, "utf-8")) as StateFile;
  console.log(`=== Beschlussempfehlungen Retrieve (${state.batch_id}) ===\n`);
  console.log(`Submitted: ${state.submitted_at}`);
  console.log(`Requests:  ${state.request_count}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");
  const client = new Anthropic({ apiKey });

  let batch = await client.messages.batches.retrieve(state.batch_id);
  let polled = 0;
  while (batch.processing_status !== "ended") {
    if (polled >= MAX_POLLS) {
      console.log(`\n⚠ Timeout nach ${polled * POLL_INTERVAL_S}s — Skript später neu starten.`);
      return;
    }
    const c = batch.request_counts;
    process.stdout.write(`  [${polled * POLL_INTERVAL_S}s] ${batch.processing_status} | processing=${c.processing} succeeded=${c.succeeded} errored=${c.errored}\r`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_S * 1000));
    polled++;
    batch = await client.messages.batches.retrieve(state.batch_id);
  }
  console.log(`\n✓ Batch ended nach ${polled * POLL_INTERVAL_S}s`);
  console.log(`  Final: succeeded=${batch.request_counts.succeeded} errored=${batch.request_counts.errored} canceled=${batch.request_counts.canceled} expired=${batch.request_counts.expired}`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  // Behalte bisheriges regex_label, falls vorhanden (= Outcome aus Regex-Pipeline)
  const fetchRegexLabelStmt = db.prepare(`
    SELECT regex_label FROM berlin_drucksachen_analyses WHERE dbid = ?
  `);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO berlin_drucksachen_analyses (
      dbid, klasse,
      zusammenfassung, thema_json, tonalitaet,
      kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json,
      antwort_charakter, bezirk_bezug,
      fraktion, adressat,
      regelung, begruendung, auswirkung, betroffene_gruppen, einbringer,
      dokumenttyp, senatsverwaltung,
      topic_drift_json, tonalitaet_drift,
      raw_tool_input_json, model, prompt_version, batch_id, batch_stage,
      input_tokens, cache_read_input_tokens, cache_creation_input_tokens, output_tokens,
      stop_reason, error_type, error_message,
      regex_label
    ) VALUES (
      @dbid, 'beschlussempfehlung',
      @zusammenfassung, @thema_json, @tonalitaet,
      @kerninhalt_json, NULL, NULL,
      NULL, NULL,
      NULL, NULL,
      NULL, NULL, NULL, NULL, NULL,
      NULL, NULL,
      @topic_drift_json, @tonalitaet_drift,
      @raw_tool_input_json, @model, @prompt_version, @batch_id, NULL,
      @input_tokens, @cache_read_input_tokens, @cache_creation_input_tokens, @output_tokens,
      @stop_reason, @error_type, @error_message,
      @regex_label
    )
  `);

  let nInserted = 0, nErrored = 0;
  let tonalDriftCount = 0, themenDriftCount = 0, arrayBugCount = 0;
  let xmlDriftCleanedTotal = 0, xmlDriftRescuedTotal = 0;
  const themenDriftBag: string[] = [];
  const haltungTally = new Map<string, number>();
  let costRealBatch = 0;
  let cacheReadsTotal = 0, cacheWritesTotal = 0;

  for await (const entry of await client.messages.batches.results(state.batch_id)) {
    const dbid = state.custom_id_to_dbid[entry.custom_id];
    if (!dbid) {
      console.log(`  ⚠ Unknown custom_id: ${entry.custom_id}`);
      continue;
    }

    const existingLabel = (fetchRegexLabelStmt.get(dbid) as { regex_label: string | null } | undefined)?.regex_label ?? null;

    if (entry.result.type !== "succeeded") {
      nErrored++;
      insertStmt.run({
        dbid,
        zusammenfassung: null, thema_json: null, tonalitaet: null,
        kerninhalt_json: null,
        topic_drift_json: null, tonalitaet_drift: null,
        raw_tool_input_json: null, model: null, prompt_version: state.prompt_version,
        batch_id: state.batch_id,
        input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0,
        stop_reason: null, error_type: entry.result.type, error_message: JSON.stringify(entry.result).slice(0, 1000),
        regex_label: existingLabel,
      });
      continue;
    }

    const msg: any = entry.result.message;
    const toolUse = msg.content.find((c: any) => c.type === "tool_use");
    const analysis = toolUse?.input as Record<string, unknown> | undefined;
    if (!analysis) {
      nErrored++;
      continue;
    }

    const drift = applyTagDriftFix(analysis);
    xmlDriftCleanedTotal += drift.cleaned;
    xmlDriftRescuedTotal += drift.rescued;

    const tVal = validateTonalitaet("beschlussempfehlung", analysis);
    if (tVal.drift) tonalDriftCount++;
    if (tVal.value) haltungTally.set(tVal.value, (haltungTally.get(tVal.value) ?? 0) + 1);

    const thVal = validateThemen(analysis);
    if (thVal.drift.length) {
      themenDriftCount++;
      themenDriftBag.push(...thVal.drift);
    }

    const ki = safeParseArray(analysis.kerninhalt);
    if (ki.isHardBug) arrayBugCount++;

    const inp = msg.usage.input_tokens ?? 0;
    const cr = msg.usage.cache_read_input_tokens ?? 0;
    const cw = msg.usage.cache_creation_input_tokens ?? 0;
    const out = msg.usage.output_tokens ?? 0;
    cacheReadsTotal += cr;
    cacheWritesTotal += cw;
    costRealBatch += inp * 0.5e-6 + cr * 0.025e-6 + cw * 0.625e-6 + out * 2.5e-6;

    insertStmt.run({
      dbid,
      zusammenfassung: strOrNull(analysis.zusammenfassung),
      thema_json: thVal.themen.length ? JSON.stringify(thVal.themen) : null,
      tonalitaet: tVal.value,
      kerninhalt_json: ki.items.length ? JSON.stringify(ki.items) : null,
      topic_drift_json: thVal.drift.length ? JSON.stringify(thVal.drift) : null,
      tonalitaet_drift: tVal.drift,
      raw_tool_input_json: JSON.stringify(analysis),
      model: msg.model ?? "claude-haiku-4-5",
      prompt_version: state.prompt_version,
      batch_id: state.batch_id,
      input_tokens: inp, cache_read_input_tokens: cr, cache_creation_input_tokens: cw, output_tokens: out,
      stop_reason: msg.stop_reason,
      error_type: null, error_message: null,
      regex_label: existingLabel,
    });
    nInserted++;
  }

  db.close();

  console.log(`\n  ✓ ${nInserted} eingefügt, ${nErrored} Fehler\n`);
  console.log(`=== Quality-Gates ===`);
  const total = nInserted + nErrored;
  const successPct = (nInserted / Math.max(1, total)) * 100;
  const tonalDriftPct = (tonalDriftCount / Math.max(1, nInserted)) * 100;
  const themenDriftPct = (themenDriftCount / Math.max(1, nInserted)) * 100;

  const fmt = (cond: boolean) => cond ? "✓" : "✗";
  console.log(`  Success-Rate:     ${successPct.toFixed(1)}%   ${fmt(successPct >= 99)}`);
  console.log(`  Tonality-Drift:   ${tonalDriftPct.toFixed(2)}%   ${fmt(tonalDriftPct <= 1)}`);
  console.log(`  Themen-Drift:     ${themenDriftPct.toFixed(1)}%   ${fmt(themenDriftPct <= 10)}`);
  console.log(`  Array-Bugs:       ${arrayBugCount}    ${fmt(arrayBugCount === 0)}`);
  console.log(`  XML-Tag-Drift:    cleaned=${xmlDriftCleanedTotal}, rescued=${xmlDriftRescuedTotal}`);

  if (themenDriftBag.length) {
    const driftCount = new Map<string, number>();
    for (const t of themenDriftBag) driftCount.set(t, (driftCount.get(t) ?? 0) + 1);
    console.log(`\n  Top Drift-Tags:`);
    [...driftCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .forEach(([t, c]) => console.log(`    ${t.padEnd(30)} ${c}×`));
  }

  console.log(`\n  Ausschuss-Haltung-Verteilung:`);
  for (const [h, c] of [...haltungTally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${h.padEnd(40)} ${c.toString().padStart(5)}`);
  }

  const cacheHitRate = (cacheReadsTotal + cacheWritesTotal) > 0
    ? cacheReadsTotal / (cacheReadsTotal + cacheWritesTotal) * 100 : 0;
  console.log(`\n  Real-Cost (Batch): $${costRealBatch.toFixed(2)}  (estimate war $${state.estimated_cost_batch})`);
  console.log(`  Cache-Hit-Rate:    ${cacheHitRate.toFixed(0)}%`);
}

main().catch((e) => { console.error(e); process.exit(1); });
