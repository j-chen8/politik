/**
 * Schema für berlin_votes — Plenum-Abstimmungs-Events aus Plenarprotokollen.
 *
 * 1 Row pro Vote-Event (kann mehrere Drucksachen referenzieren — Block-Vote).
 *
 * Run: npx tsx scripts/init-berlin-votes-schema.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS berlin_votes (
  vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Lokalisierung
  plpr_lok_url TEXT NOT NULL,
  snippet_offset INTEGER NOT NULL,         -- Position des Vote-Events im PlPr-Volltext (für Dedup)
  sitzung_nr INTEGER,                       -- z.B. 83 für PlPr 19/83
  datum TEXT,                               -- ISO-Datum der Sitzung
  -- Was wurde abgestimmt
  drucksache_nrn_json TEXT,                 -- JSON-Array: ["19/0771"] oder ["19/X", "19/Y"] bei Block-Votes
  drucksache_dbids_json TEXT,               -- JSON-Array der berlin_documents.dbid (resolved via dok_nr)
  -- Wie wurde abgestimmt
  vote_type TEXT NOT NULL,                  -- handzeichen | namentlich | hammelsprung | unklar
  outcome TEXT NOT NULL,                    -- annahme | annahme_geaendert | ablehnung | vertagung | ueberweisung | kein_vote
  modus TEXT,                               -- einstimmig | mehrheitlich | knapp | unklar
  -- Fraktions-Vote-Matrix
  fraktion_votes_json TEXT,                 -- JSON-Object: {"CDU":"ja", "SPD":"ja", "GRÜNE":"nein", "LINKE":"nein", "AfD":"nein", "FDP":"enthaltung"}
  -- Bei namentlicher Abstimmung
  stimmen_zahlen_json TEXT,                 -- JSON-Object: {"ja":120, "nein":25, "enthaltungen":1}
  -- Audit
  raw_snippet TEXT,                         -- Original-Snippet aus PlPr (für Reproduzierbarkeit)
  raw_tool_input_json TEXT,                 -- Vollständige LLM-Tool-Use-Response
  model TEXT,                               -- claude-haiku-4-5
  prompt_version TEXT,                      -- berlin-votes-v1
  batch_id TEXT,
  input_tokens INTEGER,
  cache_read_input_tokens INTEGER,
  cache_creation_input_tokens INTEGER,
  output_tokens INTEGER,
  stop_reason TEXT,
  error_type TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Idempotenz: pro PlPr-URL + Offset eindeutig
  UNIQUE(plpr_lok_url, snippet_offset)
);

CREATE INDEX IF NOT EXISTS idx_bv_datum ON berlin_votes(datum);
CREATE INDEX IF NOT EXISTS idx_bv_sitzung ON berlin_votes(sitzung_nr);
CREATE INDEX IF NOT EXISTS idx_bv_outcome ON berlin_votes(outcome);
CREATE INDEX IF NOT EXISTS idx_bv_vote_type ON berlin_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_bv_batch ON berlin_votes(batch_id);
CREATE INDEX IF NOT EXISTS idx_bv_plpr ON berlin_votes(plpr_lok_url);
`;

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  console.log("Erstelle berlin_votes Schema...");
  db.exec(SCHEMA);

  const cols = db.prepare(`PRAGMA table_info(berlin_votes)`).all() as Array<{ name: string; type: string; notnull: number; pk: number }>;
  console.log(`\n✓ Tabelle berlin_votes (${cols.length} Spalten):`);
  for (const c of cols) {
    console.log(`  ${c.name.padEnd(28)} ${c.type.padEnd(10)} ${c.notnull ? "NOT NULL" : ""}${c.pk ? " PK" : ""}`);
  }

  const indices = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='berlin_votes' AND name NOT LIKE 'sqlite_%'`).all() as { name: string }[];
  console.log(`\n✓ ${indices.length} Indices:`);
  for (const i of indices) console.log(`  ${i.name}`);

  db.close();
}

main();
