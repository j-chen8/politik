/**
 * Schema für bundestag_votes — Plenum-Handzeichen-Abstimmungs-Events aus
 * Bundestag-XML-Plenarprotokollen.
 *
 * Separater Track von `votes` (= individuelle MdB-Stimmen bei namentlichen
 * Abstimmungen). Diese Tabelle ist auf Fraktions-Level für Standard-Handzeichen.
 *
 * Run: npx tsx scripts/init-bundestag-votes-schema.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bundestag_votes (
  vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Lokalisierung
  xml_source TEXT NOT NULL,                 -- z.B. "21001.xml"
  snippet_offset INTEGER NOT NULL,
  sitzung_nr INTEGER,
  wahlperiode INTEGER,
  datum TEXT,
  -- Was wurde abgestimmt
  drucksache_nrn_json TEXT,                 -- ["21/0001"] oder ["20/15060"] (mit WP-Prefix)
  -- Wie wurde abgestimmt
  vote_type TEXT NOT NULL,                  -- handzeichen | namentlich | hammelsprung | unklar
  outcome TEXT NOT NULL,                    -- annahme | annahme_geaendert | ablehnung | vertagung | ueberweisung | kein_vote
  modus TEXT,                               -- einstimmig | mehrheitlich | knapp | unklar
  -- Fraktions-Vote-Matrix (21. WP: CDU/CSU, SPD, GRÜNE, LINKE, AfD — keine FDP mehr)
  fraktion_votes_json TEXT,                 -- {"CDU/CSU":"ja", "SPD":"ja", "GRÜNE":"nein", "LINKE":"nein", "AfD":"enthaltung"}
  stimmen_zahlen_json TEXT,                 -- bei namentlicher: {"ja":120,"nein":25,"enthaltungen":1}
  -- Audit
  raw_snippet TEXT,
  raw_tool_input_json TEXT,
  model TEXT,
  prompt_version TEXT,
  batch_id TEXT,
  input_tokens INTEGER,
  cache_read_input_tokens INTEGER,
  cache_creation_input_tokens INTEGER,
  output_tokens INTEGER,
  stop_reason TEXT,
  error_type TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(xml_source, snippet_offset)
);

CREATE INDEX IF NOT EXISTS idx_btv_datum ON bundestag_votes(datum);
CREATE INDEX IF NOT EXISTS idx_btv_sitzung ON bundestag_votes(sitzung_nr);
CREATE INDEX IF NOT EXISTS idx_btv_outcome ON bundestag_votes(outcome);
CREATE INDEX IF NOT EXISTS idx_btv_xml ON bundestag_votes(xml_source);
CREATE INDEX IF NOT EXISTS idx_btv_batch ON bundestag_votes(batch_id);
`;

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);

  const cols = db.prepare(`PRAGMA table_info(bundestag_votes)`).all() as Array<{ name: string; type: string }>;
  console.log(`✓ Tabelle bundestag_votes (${cols.length} Spalten)`);
  const idx = db.prepare(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='bundestag_votes' AND name NOT LIKE 'sqlite_%'`).all() as { name: string }[];
  console.log(`✓ ${idx.length} Indices: ${idx.map((i) => i.name).join(", ")}`);
  db.close();
}

main();
