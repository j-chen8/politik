/**
 * Schema für berlin_drucksachen_analyses (analog Bundes drucksache_analyses
 * + Reden-Pipeline berlin_speech_analyses).
 *
 * Strategie: EINE breite Tabelle mit allen möglichen Feldern (manche NULL je
 * nach Klasse). Vorteil: einfache Queries für FTS / UI / Statistik.
 * Nachteil: viele NULL-Spalten — aber das ist OK weil SQLite NULL effizient
 * speichert (NULL = 1 Byte).
 *
 * Run: npx tsx scripts/init-berlin-drucksachen-analyses-schema.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS berlin_drucksachen_analyses (
  -- Primary Key + Referenz
  dbid TEXT PRIMARY KEY,
  klasse TEXT NOT NULL,                         -- anfrage_antwort | antrag | gesetzentwurf | vorlage_senat | beschlussempfehlung_regex

  -- ─── Common Output-Felder (alle Klassen außer Regex-Label) ─────────────
  zusammenfassung TEXT,                         -- 3-5 Sätze Prose
  thema_json TEXT,                              -- JSON-Array von BERLIN_TOPIC_TAGS
  tonalitaet TEXT,                              -- klassen-spezifischer Enum (sachlich/fordernd/kritisch/etc.)

  -- ─── kerninhalt: 3 Varianten je nach Klasse ─────────────────────────────
  -- antrag/gesetzentwurf/vorlage_senat nutzen kerninhalt_json
  kerninhalt_json TEXT,                         -- JSON-Array von Strings
  -- anfrage_antwort nutzt _frage + _antwort separat
  kerninhalt_frage_json TEXT,                   -- JSON-Array von Strings
  kerninhalt_antwort_json TEXT,                 -- JSON-Array von Strings

  -- ─── Klassen-spezifische Felder ─────────────────────────────────────────
  -- anfrage_antwort:
  antwort_charakter TEXT,                       -- substantiell | teilantwortend | ausweichend
  bezirk_bezug TEXT,                            -- falls Anfrage konkret einen Berliner Bezirk betrifft

  -- antrag/gesetzentwurf/anfrage_antwort:
  fraktion TEXT,                                -- initiierende Fraktion

  -- antrag:
  adressat TEXT,                                -- Senat | Bezirksamt X | Bundesregierung | etc.

  -- gesetzentwurf:
  regelung TEXT,                                -- 2-4 Sätze: was wird konkret geregelt
  begruendung TEXT,                             -- 2-4 Sätze: offizielle Begründung
  auswirkung TEXT,                              -- 2-4 Sätze: Folgen/Kosten/betroffene Gruppen
  betroffene_gruppen TEXT,                      -- konkrete Gruppen
  einbringer TEXT,                              -- Senat | Fraktion

  -- vorlage_senat:
  dokumenttyp TEXT,                             -- Bericht | Verordnung | Mitteilung | Zwischenbericht

  -- vorlage_senat/anfrage_antwort:
  senatsverwaltung TEXT,                        -- antwortende/vorlegende Senatsverwaltung

  -- beschlussempfehlung_regex (kein LLM, deterministisch):
  regex_label TEXT,                             -- annahme | ablehnung | vertagung | etc.

  -- ─── Drift-Audit (analog Bundes topic_drift_audit) ──────────────────────
  topic_drift_json TEXT,                        -- LLM-Tags die NICHT in BERLIN_TOPIC_TAGS sind — für v2-Kuration sammeln
  tonalitaet_drift TEXT,                        -- wenn LLM tonalitaet außerhalb klassen-spez. Enum → hier speichern

  -- ─── Audit-Trail (analog Reden-Pipeline) ────────────────────────────────
  raw_tool_input_json TEXT,                     -- vollständige Tool-Use-Response für Re-Parse
  model TEXT,                                   -- claude-haiku-4-5
  prompt_version TEXT,                          -- berlin-v1.1
  batch_id TEXT,                                -- msgbatch_...
  batch_stage INTEGER,                          -- 1|2|3|4 bei progressivem Batch-Modell
  input_tokens INTEGER,
  cache_read_input_tokens INTEGER,
  cache_creation_input_tokens INTEGER,
  output_tokens INTEGER,
  stop_reason TEXT,

  -- Fehler-Tracking
  error_type TEXT,                              -- NULL bei Erfolg
  error_message TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (dbid) REFERENCES berlin_documents(dbid)
);

-- Indices für UI/Statistik-Queries
CREATE INDEX IF NOT EXISTS idx_bdaa_klasse ON berlin_drucksachen_analyses(klasse);
CREATE INDEX IF NOT EXISTS idx_bdaa_tonalitaet ON berlin_drucksachen_analyses(tonalitaet);
CREATE INDEX IF NOT EXISTS idx_bdaa_fraktion ON berlin_drucksachen_analyses(fraktion);
CREATE INDEX IF NOT EXISTS idx_bdaa_senatsverwaltung ON berlin_drucksachen_analyses(senatsverwaltung);
CREATE INDEX IF NOT EXISTS idx_bdaa_batch ON berlin_drucksachen_analyses(batch_id);
CREATE INDEX IF NOT EXISTS idx_bdaa_error ON berlin_drucksachen_analyses(error_type) WHERE error_type IS NOT NULL;
`;

// ALTER COLUMN ist separat, weil SQLite kein 'ADD COLUMN IF NOT EXISTS' hat
// — wird try-catched in main(). Index für topic_drift_json folgt NACH ALTER.
const ALTER_COLS = [
  "ALTER TABLE berlin_drucksachen_analyses ADD COLUMN topic_drift_json TEXT",
  "ALTER TABLE berlin_drucksachen_analyses ADD COLUMN tonalitaet_drift TEXT",
];

const POST_ALTER_INDICES = [
  "CREATE INDEX IF NOT EXISTS idx_bdaa_topic_drift ON berlin_drucksachen_analyses(topic_drift_json) WHERE topic_drift_json IS NOT NULL",
];

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  console.log("Erstelle berlin_drucksachen_analyses Schema...");
  db.exec(SCHEMA);

  // ALTER COLUMN für Bestands-Tabelle (idempotent)
  for (const alter of ALTER_COLS) {
    try {
      db.exec(alter);
      console.log(`  + ${alter}`);
    } catch (e: any) {
      if (!/duplicate column/i.test(e.message)) throw e;
    }
  }
  // Indices NACH ALTER (sonst Reference auf fehlende Spalte)
  for (const idx of POST_ALTER_INDICES) db.exec(idx);

  // Verify
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='berlin_drucksachen_analyses'`).get();
  if (!tables) throw new Error("Tabelle wurde nicht erstellt!");

  const cols = db.prepare(`PRAGMA table_info(berlin_drucksachen_analyses)`).all() as any[];
  console.log(`\n✓ Tabelle berlin_drucksachen_analyses erstellt mit ${cols.length} Spalten:\n`);
  for (const c of cols) {
    console.log(`  ${c.name.padEnd(35)} ${c.type.padEnd(10)} ${c.notnull ? "NOT NULL" : ""}${c.pk ? " PRIMARY KEY" : ""}${c.dflt_value ? ` DEFAULT ${c.dflt_value}` : ""}`);
  }

  const indices = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='berlin_drucksachen_analyses' AND name NOT LIKE 'sqlite_%'`).all() as {name: string}[];
  console.log(`\n✓ ${indices.length} Indices erstellt:`);
  for (const i of indices) console.log(`  ${i.name}`);

  db.close();
  console.log("\nFertig.");
}

main();
