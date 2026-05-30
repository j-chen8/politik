/**
 * Gezielter Rebuild NUR der Berlin-Reden-FTS (berlin_speeches_fts) mit der
 * gestrippten snippet-Logik (führende Redner-Bezeichnung raus, s. berlinSnippetExpr).
 * Bundestag-FTS + Berlin-Drucksachen-FTS bleiben unangetastet.
 *
 * Lauf: npx tsx scripts/rebuild-berlin-speech-fts.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { ensureSearchFTS } from "../src/lib/search-fts";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const before = (db.prepare("SELECT COUNT(*) AS n FROM berlin_speeches_fts").get() as { n: number }).n;

// Tabelle + die beiden Berlin-Reden-Trigger droppen → ensureSearchFTS baut beide
// mit den aktualisierten Bodies (berlinSnippetExpr) neu auf. Andere FTS-Tabellen
// haben count>0 und werden von ensureSearchFTS NICHT angefasst.
db.exec(`
  DROP TRIGGER IF EXISTS berlin_speech_analyses_ai;
  DROP TRIGGER IF EXISTS berlin_speech_analyses_au;
  DROP TABLE IF EXISTS berlin_speeches_fts;
`);

ensureSearchFTS(db);

const after = (db.prepare("SELECT COUNT(*) AS n FROM berlin_speeches_fts").get() as { n: number }).n;
console.log(`berlin_speeches_fts neu aufgebaut: ${before.toLocaleString("de-DE")} → ${after.toLocaleString("de-DE")} Zeilen`);

// Stichprobe: Gaebler-Snippets dürfen nicht mehr mit der Ressort-Zeile beginnen.
const sample = db
  .prepare(
    `SELECT substr(f.snippet,1,90) AS s FROM berlin_speeches_fts f
     JOIN berlin_speeches bs ON bs.speech_id=f.speech_id
     WHERE bs.speaker_name LIKE '%Gaebler%' AND f.snippet IS NOT NULL AND f.snippet<>'' LIMIT 3`
  )
  .all() as { s: string }[];
console.log("Gaebler-Stichprobe:");
sample.forEach((r) => console.log("  ·", r.s));

db.close();
