/**
 * Gezielter Rebuild der Berlin-Drucksachen-FTS (berlin_drucksachen_fts) — nötig nach
 * Schema-Änderung: neue indexierte Spalte `dok_nr` (Drs.-Nummer suchbar) + `titel`
 * fällt jetzt auf `derived_titel` zurück (KI-Titel suchbar). Andere FTS unangetastet.
 *
 * Lauf: npx tsx scripts/rebuild-berlin-drucksachen-fts.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { ensureSearchFTS } from "../src/lib/search-fts";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const before = (db.prepare("SELECT COUNT(*) AS n FROM berlin_drucksachen_fts").get() as { n: number }).n;

db.exec(`
  DROP TRIGGER IF EXISTS berlin_drucksachen_analyses_ai;
  DROP TRIGGER IF EXISTS berlin_drucksachen_analyses_au;
  DROP TRIGGER IF EXISTS berlin_drucksachen_analyses_ad;
  DROP TABLE IF EXISTS berlin_drucksachen_fts;
`);

ensureSearchFTS(db);

const after = (db.prepare("SELECT COUNT(*) AS n FROM berlin_drucksachen_fts").get() as { n: number }).n;
console.log(`berlin_drucksachen_fts neu aufgebaut: ${before.toLocaleString("de-DE")} → ${after.toLocaleString("de-DE")} Zeilen`);

db.close();
