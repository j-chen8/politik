/**
 * Retrieve-Skript für Reden-Vollauf via Anthropic Batch API.
 *
 * Liest .batch-state.json (geschrieben von batch-submit-reden.ts), prüft
 * für jeden Batch den Status. Wenn alle ended/canceled: holt Resultate,
 * schreibt sie in Tabelle speech_analyses_v2 (wird beim ersten Lauf erstellt).
 *
 * Run:
 *   npx tsx scripts/batch-retrieve-reden.ts          # Status zeigen
 *   npx tsx scripts/batch-retrieve-reden.ts --apply  # Resultate in DB schreiben
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_PATH = path.join(process.cwd(), ".batch-state.json");

interface BatchEntry {
  batch_id: string;
  status: string;
  n_requests: number;
  submitted_at: string;
}

interface BatchState {
  submitted_at: string;
  n_requests_total: number;
  n_batches: number;
  estimated_cost_batch_usd: number;
  model: string;
  tool_name: string;
  methodology_path: string;
  methodology_sha: string;
  batches: BatchEntry[];
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS speech_analyses_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rede_id TEXT NOT NULL,
      segment_index INTEGER NOT NULL,
      speech_id INTEGER REFERENCES plenar_speeches(id),
      reden_typ TEXT,
      tonalitaet TEXT,
      forderungen_json TEXT,
      woertliche_zitate_json TEXT,
      framing_marker_json TEXT,
      rhetorische_mittel_json TEXT,
      konkrete_zahlen_json TEXT,
      anti_hallucination_flags_json TEXT,
      zusammenfassung_2_saetze TEXT,
      quote_valid_count INTEGER,
      quote_total_count INTEGER,
      raw_tool_input_json TEXT,
      model TEXT,
      methodology_sha TEXT,
      batch_id TEXT,
      input_tokens INTEGER,
      cache_read_input_tokens INTEGER,
      cache_creation_input_tokens INTEGER,
      output_tokens INTEGER,
      stop_reason TEXT,
      error_type TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (rede_id, segment_index)
    );
    CREATE INDEX IF NOT EXISTS idx_speech_analyses_v2_rede ON speech_analyses_v2(rede_id, segment_index);
    CREATE INDEX IF NOT EXISTS idx_speech_analyses_v2_tonalitaet ON speech_analyses_v2(tonalitaet);
    CREATE INDEX IF NOT EXISTS idx_speech_analyses_v2_typ ON speech_analyses_v2(reden_typ);
  `);
}

function validateQuotes(quotes: string[] | undefined, originalText: string): { valid: number; total: number } {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const haystack = norm(originalText);
  let valid = 0;
  for (const q of quotes || []) if (haystack.includes(norm(q))) valid++;
  return { valid, total: (quotes || []).length };
}

async function main() {
  const args = process.argv.slice(2);
  const doApply = args.includes("--apply");

  if (!fs.existsSync(STATE_PATH)) {
    console.error(`Kein ${STATE_PATH} gefunden — wurde batch-submit-reden.ts ausgeführt?`);
    process.exit(1);
  }
  const state: BatchState = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));

  console.log(`=== Reden-Batch-Retrieve ===`);
  console.log(`Submitted: ${state.submitted_at}`);
  console.log(`Total Requests: ${state.n_requests_total} (${state.n_batches} Sub-Batches)`);
  console.log(`Methodology-SHA: ${state.methodology_sha}`);
  console.log(``);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");
  const client = new Anthropic({ apiKey });

  // Status-Check für alle Batches
  const live = await Promise.all(
    state.batches.map((b) => client.messages.batches.retrieve(b.batch_id)),
  );
  let allEnded = true;
  for (let i = 0; i < live.length; i++) {
    const b = live[i];
    const counts = b.request_counts;
    console.log(
      `  [${i + 1}/${live.length}] ${b.id} · ${b.processing_status}` +
        ` · ${counts.processing}/${counts.succeeded}/${counts.errored}/${counts.canceled}/${counts.expired}` +
        ` (proc/ok/err/cancel/exp)`,
    );
    if (b.processing_status !== "ended") allEnded = false;
  }
  console.log("");

  if (!allEnded) {
    console.log(`Noch nicht alle Batches abgeschlossen — später nochmal aufrufen.`);
    console.log(`Anthropic SLA: max 24h, Median deutlich kürzer.`);
    return;
  }

  console.log(`Alle Batches ended.`);
  if (!doApply) {
    console.log(`Status-Only. Mit \`--apply\` schreiben wir 9.913 Resultate in DB.`);
    return;
  }

  // Apply: alle Resultate holen und in DB schreiben
  const db = new Database(DB_PATH);
  ensureSchema(db);

  // rede_id+segment_index → speech_id mapping
  const speechIdMap = new Map<string, number>();
  db.prepare(
    "SELECT id, rede_id, segment_index FROM plenar_speeches WHERE rede_id IS NOT NULL",
  )
    .all()
    .forEach((r: any) => speechIdMap.set(`${r.rede_id}_${r.segment_index}`, r.id));

  // Original-Texte für Quote-Validation
  const origMap = new Map<string, string>();
  db.prepare("SELECT rede_id, segment_index, original_text FROM plenar_speeches")
    .all()
    .forEach((r: any) => origMap.set(`${r.rede_id}_${r.segment_index}`, r.original_text || ""));

  const insertStmt = db.prepare(`
    INSERT INTO speech_analyses_v2 (
      rede_id, segment_index, speech_id, reden_typ, tonalitaet,
      forderungen_json, woertliche_zitate_json, framing_marker_json,
      rhetorische_mittel_json, konkrete_zahlen_json, anti_hallucination_flags_json,
      zusammenfassung_2_saetze, quote_valid_count, quote_total_count,
      raw_tool_input_json, model, methodology_sha, batch_id,
      input_tokens, cache_read_input_tokens, cache_creation_input_tokens,
      output_tokens, stop_reason, error_type, error_message
    ) VALUES (
      @rede_id, @segment_index, @speech_id, @reden_typ, @tonalitaet,
      @forderungen_json, @woertliche_zitate_json, @framing_marker_json,
      @rhetorische_mittel_json, @konkrete_zahlen_json, @anti_hallucination_flags_json,
      @zusammenfassung_2_saetze, @quote_valid_count, @quote_total_count,
      @raw_tool_input_json, @model, @methodology_sha, @batch_id,
      @input_tokens, @cache_read_input_tokens, @cache_creation_input_tokens,
      @output_tokens, @stop_reason, @error_type, @error_message
    )
    ON CONFLICT (rede_id, segment_index) DO UPDATE SET
      reden_typ = excluded.reden_typ,
      tonalitaet = excluded.tonalitaet,
      forderungen_json = excluded.forderungen_json,
      woertliche_zitate_json = excluded.woertliche_zitate_json,
      framing_marker_json = excluded.framing_marker_json,
      rhetorische_mittel_json = excluded.rhetorische_mittel_json,
      konkrete_zahlen_json = excluded.konkrete_zahlen_json,
      anti_hallucination_flags_json = excluded.anti_hallucination_flags_json,
      zusammenfassung_2_saetze = excluded.zusammenfassung_2_saetze,
      quote_valid_count = excluded.quote_valid_count,
      quote_total_count = excluded.quote_total_count,
      raw_tool_input_json = excluded.raw_tool_input_json,
      batch_id = excluded.batch_id,
      input_tokens = excluded.input_tokens,
      cache_read_input_tokens = excluded.cache_read_input_tokens,
      cache_creation_input_tokens = excluded.cache_creation_input_tokens,
      output_tokens = excluded.output_tokens,
      stop_reason = excluded.stop_reason,
      error_type = excluded.error_type,
      error_message = excluded.error_message,
      created_at = CURRENT_TIMESTAMP
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const r of rows) insertStmt.run(r);
  });

  let totalOk = 0;
  let totalErr = 0;
  let totalIn = 0;
  let totalCacheR = 0;
  let totalCacheW = 0;
  let totalOut = 0;

  for (let bi = 0; bi < live.length; bi++) {
    const b = live[bi];
    console.log(`Hole Resultate Batch ${bi + 1}/${live.length} (${b.id})...`);
    const buffer: any[] = [];
    const results = await client.messages.batches.results(b.id);
    for await (const item of results) {
      const customId = item.custom_id;
      const lastUnderscore = customId.lastIndexOf("_");
      const rede_id = customId.slice(0, lastUnderscore);
      const segment_index = parseInt(customId.slice(lastUnderscore + 1), 10);
      const speech_id = speechIdMap.get(customId) ?? null;
      const origText = origMap.get(customId) || "";

      let row: any = {
        rede_id,
        segment_index,
        speech_id,
        reden_typ: null,
        tonalitaet: null,
        forderungen_json: null,
        woertliche_zitate_json: null,
        framing_marker_json: null,
        rhetorische_mittel_json: null,
        konkrete_zahlen_json: null,
        anti_hallucination_flags_json: null,
        zusammenfassung_2_saetze: null,
        quote_valid_count: 0,
        quote_total_count: 0,
        raw_tool_input_json: null,
        model: state.model,
        methodology_sha: state.methodology_sha,
        batch_id: b.id,
        input_tokens: null,
        cache_read_input_tokens: null,
        cache_creation_input_tokens: null,
        output_tokens: null,
        stop_reason: null,
        error_type: null,
        error_message: null,
      };

      if (item.result.type === "succeeded") {
        const msg = item.result.message;
        const u: any = msg.usage;
        row.input_tokens = u.input_tokens;
        row.cache_read_input_tokens = u.cache_read_input_tokens || 0;
        row.cache_creation_input_tokens = u.cache_creation_input_tokens || 0;
        row.output_tokens = u.output_tokens;
        row.stop_reason = msg.stop_reason;
        totalIn += u.input_tokens;
        totalCacheR += u.cache_read_input_tokens || 0;
        totalCacheW += u.cache_creation_input_tokens || 0;
        totalOut += u.output_tokens;

        const toolBlock = msg.content.find((b: any) => b.type === "tool_use");
        if (toolBlock && toolBlock.type === "tool_use") {
          const t = toolBlock.input as any;
          row.reden_typ = t.reden_typ ?? null;
          row.tonalitaet = t.tonalitaet ?? null;
          row.forderungen_json = JSON.stringify(t.forderungen ?? []);
          row.woertliche_zitate_json = JSON.stringify(t.woertliche_zitate ?? []);
          row.framing_marker_json = JSON.stringify(t.framing_marker ?? []);
          row.rhetorische_mittel_json = JSON.stringify(t.rhetorische_mittel ?? []);
          row.konkrete_zahlen_json = JSON.stringify(t.konkrete_zahlen ?? []);
          row.anti_hallucination_flags_json = JSON.stringify(t.anti_hallucination_flags ?? []);
          row.zusammenfassung_2_saetze = t.zusammenfassung_2_saetze ?? null;
          row.raw_tool_input_json = JSON.stringify(t);
          const v = validateQuotes(t.woertliche_zitate, origText);
          row.quote_valid_count = v.valid;
          row.quote_total_count = v.total;
          totalOk++;
        } else {
          row.error_type = "no_tool_use";
          row.error_message = `stop_reason=${msg.stop_reason}, kein tool_use-Block`;
          totalErr++;
        }
      } else if (item.result.type === "errored") {
        row.error_type = item.result.error.type;
        row.error_message = JSON.stringify(item.result.error);
        totalErr++;
      } else {
        row.error_type = item.result.type;
        row.error_message = `unexpected result type: ${item.result.type}`;
        totalErr++;
      }
      buffer.push(row);

      if (buffer.length >= 500) {
        insertMany(buffer);
        process.stdout.write(`  …${totalOk} ok / ${totalErr} err\r`);
        buffer.length = 0;
      }
    }
    if (buffer.length > 0) insertMany(buffer);
    console.log(`  Batch ${bi + 1} fertig: ${totalOk} ok kumuliert, ${totalErr} err kumuliert`);
  }

  // Cost summary aus realer Token-Nutzung
  const cost =
    (totalIn * 0.5) / 1_000_000 +
    (totalCacheR * 0.05) / 1_000_000 +
    (totalCacheW * 0.625) / 1_000_000 +
    (totalOut * 2.5) / 1_000_000;

  console.log(`\n========== ZUSAMMENFASSUNG ==========`);
  console.log(`OK: ${totalOk}, Errors: ${totalErr}, Total: ${totalOk + totalErr}`);
  console.log(`Tokens: in=${totalIn}, cache_read=${totalCacheR}, cache_write=${totalCacheW}, out=${totalOut}`);
  console.log(`Tatsächliche Cost (Batch-Pricing): $${cost.toFixed(2)}`);
  console.log(`Geschrieben in: speech_analyses_v2`);
  console.log(`\nNext: Quote-Validation-Stats prüfen, optional Inspector-Pass.`);

  db.close();
}

main().catch((e) => {
  console.error("FEHLER:", e);
  process.exit(1);
});
