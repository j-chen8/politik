/**
 * Berlin-Drucksachen Batch-Retrieve mit Polling + INSERT + Quality-Gates.
 *
 * Klassen-spezifische Validation:
 *   - validateTonalitaet(klasse, …) → tonalitaet/tonalitaet_drift Split
 *   - validateThemen(…)             → thema_json/topic_drift_json Split
 *
 * Klassen-spezifische Felder werden je nach Klasse ge-NULLed/befüllt:
 *   - anfrage_antwort: kerninhalt_frage/antwort, antwort_charakter, bezirk_bezug
 *   - antrag:          kerninhalt, adressat
 *   - gesetzentwurf:   kerninhalt, regelung, begruendung, auswirkung, betroffene_gruppen, einbringer
 *   - vorlage_senat:   kerninhalt, dokumenttyp
 *
 * Quality-Gates (Stop-Conditions vor nächstem Stage):
 *   Success-Rate     ≥ 99 %
 *   Tonality-Drift   ≤ 1 %
 *   Topic-Glossar    ≥ 90 % (bekannt 96 % aus Smoke-Test)
 *   Array-Bugs       = 0 (Smoke-Test v1.1 hatte 0)
 *
 * Run:  npx tsx scripts/batch-retrieve-berlin-drucksachen.ts --batch=N
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import {
  BerlinBatchClass,
  validateTonalitaet, validateThemen, safeParseArray, normalizeFraktion,
  extractHeaderMeta, applyTagDriftFix,
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
const MAX_POLLS = 240; // 2 h Maximum

interface StateFile {
  batch_stage: number;
  batch_id: string;
  submitted_at: string;
  prompt_version: string;
  methodology_sha: string;
  request_count: number;
  klasse_breakdown: Record<string, number>;
  custom_id_to_dbid: Record<string, string>;
  custom_id_to_klasse: Record<string, BerlinBatchClass>;
  estimated_cost_batch: number;
}

function asJson(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return JSON.stringify(v);
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

async function main() {
  const args = process.argv.slice(2);
  const rest = args.includes("--rest");
  const batchArg = args.find((a) => a.startsWith("--batch="));
  if (!batchArg && !rest) {
    console.error("Usage: --batch=1|2|3|4  |  --rest");
    process.exit(1);
  }
  const stageLabel = rest ? "rest" : batchArg!.split("=")[1];
  const batchStage = rest ? 4 : parseInt(stageLabel, 10); // batch_stage-Spalte: 4 als Sammel-Marker

  const stateFile = path.join(STATE_DIR, `batch-${stageLabel}.json`);
  if (!fs.existsSync(stateFile)) {
    console.error(`State-Datei fehlt: ${stateFile}`);
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(stateFile, "utf-8")) as StateFile;
  console.log(`=== Berlin-DS Batch ${batchStage} Retrieve (${state.batch_id}) ===\n`);
  console.log(`Submitted: ${state.submitted_at}`);
  console.log(`Requests:  ${state.request_count}`);
  console.log(`Klassen:   ${JSON.stringify(state.klasse_breakdown)}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");
  const client = new Anthropic({ apiKey });

  // Polling
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

  // INSERT
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  // Fallback-Query: full_text + titel für Header-Re-Extract, falls LLM die Fraktion
  // trotz Header-Hint im Schema-Feld leer gelassen hat (v1.2-Empirie: ~3 % Aussetzer).
  const fetchTextStmt = db.prepare(`
    SELECT t.full_text, d.titel FROM berlin_documents d
    JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
    WHERE d.dbid = ?
  `);
  let fraktionFallbackHits = 0;
  function rescueFraktion(dbid: string, klasse: BerlinBatchClass, llmFraktion: string | null): string | null {
    if (llmFraktion) return llmFraktion;
    if (klasse !== "anfrage_antwort" && klasse !== "antrag") return null;
    const row = fetchTextStmt.get(dbid) as { full_text: string; titel: string | null } | undefined;
    if (!row) return null;
    const meta = extractHeaderMeta(row.full_text, row.titel);
    if (meta.fraktion) fraktionFallbackHits++;
    return meta.fraktion;
  }

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
      @dbid, @klasse,
      @zusammenfassung, @thema_json, @tonalitaet,
      @kerninhalt_json, @kerninhalt_frage_json, @kerninhalt_antwort_json,
      @antwort_charakter, @bezirk_bezug,
      @fraktion, @adressat,
      @regelung, @begruendung, @auswirkung, @betroffene_gruppen, @einbringer,
      @dokumenttyp, @senatsverwaltung,
      @topic_drift_json, @tonalitaet_drift,
      @raw_tool_input_json, @model, @prompt_version, @batch_id, @batch_stage,
      @input_tokens, @cache_read_input_tokens, @cache_creation_input_tokens, @output_tokens,
      @stop_reason, @error_type, @error_message,
      NULL
    )
  `);

  let nInserted = 0, nErrored = 0;
  let tonalDriftCount = 0, themenDriftCount = 0, arrayBugCount = 0;
  let xmlDriftCleanedTotal = 0, xmlDriftRescuedTotal = 0;
  const themenDriftBag: string[] = [];
  const klasseTally = new Map<string, number>();
  const tonTally = new Map<string, number>();
  let costRealBatch = 0;
  let cacheReadsTotal = 0, cacheWritesTotal = 0;

  for await (const entry of await client.messages.batches.results(state.batch_id)) {
    const dbid = state.custom_id_to_dbid[entry.custom_id];
    const klasse = state.custom_id_to_klasse[entry.custom_id];
    if (!dbid || !klasse) {
      console.log(`  ⚠ Unknown custom_id: ${entry.custom_id}`);
      continue;
    }

    // Fehler-Case
    if (entry.result.type !== "succeeded") {
      nErrored++;
      insertStmt.run({
        dbid, klasse,
        zusammenfassung: null, thema_json: null, tonalitaet: null,
        kerninhalt_json: null, kerninhalt_frage_json: null, kerninhalt_antwort_json: null,
        antwort_charakter: null, bezirk_bezug: null,
        fraktion: null, adressat: null,
        regelung: null, begruendung: null, auswirkung: null, betroffene_gruppen: null, einbringer: null,
        dokumenttyp: null, senatsverwaltung: null,
        topic_drift_json: null, tonalitaet_drift: null,
        raw_tool_input_json: null, model: null, prompt_version: state.prompt_version,
        batch_id: state.batch_id, batch_stage: batchStage,
        input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0,
        stop_reason: null, error_type: entry.result.type, error_message: JSON.stringify(entry.result).slice(0, 1000),
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

    // XML-Tag-Drift-Fix: ~10 % der antrag/gesetzentwurf/vorlage_senat-Outputs
    // haben "</field>\n<parameter name=...>"-Suffix; Folge-Feld bleibt sonst leer.
    const drift = applyTagDriftFix(analysis);
    xmlDriftCleanedTotal += drift.cleaned;
    xmlDriftRescuedTotal += drift.rescued;

    // Validation
    const tVal = validateTonalitaet(klasse, analysis);
    if (tVal.drift) tonalDriftCount++;
    if (tVal.value) tonTally.set(tVal.value, (tonTally.get(tVal.value) ?? 0) + 1);

    const thVal = validateThemen(analysis);
    if (thVal.drift.length) {
      themenDriftCount++;
      themenDriftBag.push(...thVal.drift);
    }

    // Array-Schema-Bugs zählen (kerninhalt/_frage/_antwort sollten Array sein)
    // safeParseArray rettet stringifiziertes JSON-Array (häufiger LLM-Drift); nur isHardBug zählt.
    const ki    = safeParseArray(analysis.kerninhalt);
    const kif   = safeParseArray(analysis.kerninhalt_frage);
    const kia   = safeParseArray(analysis.kerninhalt_antwort);
    for (const r of [ki, kif, kia]) if (r.isHardBug) arrayBugCount++;

    klasseTally.set(klasse, (klasseTally.get(klasse) ?? 0) + 1);

    // Cost tracken (real)
    const inp = msg.usage.input_tokens ?? 0;
    const cr  = msg.usage.cache_read_input_tokens ?? 0;
    const cw  = msg.usage.cache_creation_input_tokens ?? 0;
    const out = msg.usage.output_tokens ?? 0;
    cacheReadsTotal += cr;
    cacheWritesTotal += cw;
    // Batch-Preise: 0.5/0.025/0.625/2.5 pro Mio
    costRealBatch += inp * 0.5e-6 + cr * 0.025e-6 + cw * 0.625e-6 + out * 2.5e-6;

    insertStmt.run({
      dbid, klasse,
      zusammenfassung: strOrNull(analysis.zusammenfassung),
      thema_json: thVal.themen.length ? JSON.stringify(thVal.themen) : null,
      tonalitaet: tVal.value,
      // Klassen-spez kerninhalt-Varianten (mit safeParseArray gegen stringifizierte Arrays)
      kerninhalt_json: klasse !== "anfrage_antwort" && ki.items.length
        ? JSON.stringify(ki.items) : null,
      kerninhalt_frage_json: klasse === "anfrage_antwort" && kif.items.length
        ? JSON.stringify(kif.items) : null,
      kerninhalt_antwort_json: klasse === "anfrage_antwort" && kia.items.length
        ? JSON.stringify(kia.items) : null,
      // anfrage_antwort spez
      antwort_charakter: klasse === "anfrage_antwort" ? tVal.value : null,
      bezirk_bezug: klasse === "anfrage_antwort" ? strOrNull(analysis.bezirk_bezug) : null,
      // antrag/gesetzentwurf/anfrage_antwort — normalisieren + Regex-Fallback wenn LLM-Aussetzer
      fraktion: rescueFraktion(dbid, klasse, normalizeFraktion(strOrNull(analysis.fraktion))),
      adressat: klasse === "antrag" ? strOrNull(analysis.adressat) : null,
      // gesetzentwurf spez
      regelung: klasse === "gesetzentwurf" ? strOrNull(analysis.regelung) : null,
      begruendung: klasse === "gesetzentwurf" ? strOrNull(analysis.begruendung) : null,
      auswirkung: klasse === "gesetzentwurf" ? strOrNull(analysis.auswirkung) : null,
      betroffene_gruppen: klasse === "gesetzentwurf" ? strOrNull(analysis.betroffene_gruppen) : null,
      einbringer: klasse === "gesetzentwurf" ? strOrNull(analysis.einbringer) : null,
      // vorlage_senat spez
      dokumenttyp: klasse === "vorlage_senat" ? strOrNull(analysis.dokumenttyp) : null,
      // vorlage_senat + anfrage_antwort
      senatsverwaltung: (klasse === "vorlage_senat" || klasse === "anfrage_antwort")
        ? strOrNull(analysis.senatsverwaltung) : null,
      // Drift
      topic_drift_json: thVal.drift.length ? JSON.stringify(thVal.drift) : null,
      tonalitaet_drift: tVal.drift,
      // Audit
      raw_tool_input_json: JSON.stringify(analysis),
      model: msg.model ?? "claude-haiku-4-5",
      prompt_version: state.prompt_version,
      batch_id: state.batch_id,
      batch_stage: batchStage,
      input_tokens: inp, cache_read_input_tokens: cr, cache_creation_input_tokens: cw, output_tokens: out,
      stop_reason: msg.stop_reason,
      error_type: null, error_message: null,
    });
    nInserted++;
  }

  db.close();

  console.log(`\n  ✓ ${nInserted} eingefügt, ${nErrored} Fehler\n`);

  // Quality-Gates
  console.log(`=== Quality-Gates (Stage ${batchStage}) ===`);
  const total = nInserted + nErrored;
  const successPct = (nInserted / Math.max(1, total)) * 100;
  const tonalDriftPct = (tonalDriftCount / Math.max(1, nInserted)) * 100;
  const themenDriftPct = (themenDriftCount / Math.max(1, nInserted)) * 100;

  const fmt = (cond: boolean, ok = "✓", bad = "✗") => cond ? ok : bad;
  console.log(`  Success-Rate:     ${successPct.toFixed(1)}%      ${fmt(successPct >= 99)}`);
  console.log(`  Tonality-Drift:   ${tonalDriftPct.toFixed(2)}%     ${fmt(tonalDriftPct <= 1)}`);
  console.log(`  Themen-Drift:     ${themenDriftPct.toFixed(1)}%     ${fmt(themenDriftPct <= 10)}`);
  console.log(`  Array-Bugs:       ${arrayBugCount}        ${fmt(arrayBugCount === 0)}`);
  console.log(`  Fraktion-Rescue:  ${fraktionFallbackHits}        (Regex-Fallback wo LLM-Output leer war)`);
  console.log(`  XML-Tag-Drift:    cleaned=${xmlDriftCleanedTotal}, rescued=${xmlDriftRescuedTotal} (LLM-Suffix-Aufräumung)`);

  // Drift-Tags-Histogramm
  if (themenDriftBag.length) {
    const driftCount = new Map<string, number>();
    for (const t of themenDriftBag) driftCount.set(t, (driftCount.get(t) ?? 0) + 1);
    console.log(`\n  Top Drift-Tags (für v2-Kuration):`);
    [...driftCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .forEach(([t, c]) => console.log(`    ${t.padEnd(30)} ${c}×`));
  }

  console.log(`\n  Klassen-Verteilung (eingefügt):`);
  for (const [k, c] of [...klasseTally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(18)} ${c.toString().padStart(5)}`);
  }
  console.log(`\n  Tonality-Verteilung:`);
  for (const [t, c] of [...tonTally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(18)} ${c.toString().padStart(5)}`);
  }

  const cacheHitRate = (cacheReadsTotal + cacheWritesTotal) > 0
    ? cacheReadsTotal / (cacheReadsTotal + cacheWritesTotal) * 100 : 0;
  console.log(`\n  Real-Cost (Batch): $${costRealBatch.toFixed(2)}  (estimate war $${state.estimated_cost_batch})`);
  console.log(`  Cache-Hit-Rate:    ${cacheHitRate.toFixed(0)}% (${(cacheReadsTotal/1000).toFixed(0)}k read / ${(cacheWritesTotal/1000).toFixed(0)}k write Tokens)`);

  const allGatesOk = successPct >= 99 && tonalDriftPct <= 1 && themenDriftPct <= 10 && arrayBugCount === 0;
  console.log(`\n${allGatesOk ? "✅ Alle Quality-Gates erfüllt — Stage " + (batchStage+1) + " freigegeben" : "⚠ Quality-Gate-Warnung — vor nächstem Stage prüfen"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
