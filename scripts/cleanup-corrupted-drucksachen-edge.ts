/**
 * Edge-Case-Cleanup nach `cleanup-corrupted-drucksachen.ts`:
 * 3 Records, bei denen das XML-Leak NICHT in zusammenfassung sondern in
 * tonalitaet / auswirkung lag. Hier reicht trailing-XML-Strip.
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

function stripTrailingXml(s: string | null): string | null {
  if (!s) return s;
  const m = s.match(/^([\s\S]*?)(?=<\/[a-z_]+>|<parameter\s+name=)/i);
  return m ? m[1].trim() : s;
}

const rows = db.prepare(`
  SELECT drucksache_nr, zusammenfassung, tonalitaet,
         betroffene_gruppen, fraktion, regelung, begruendung, auswirkung
  FROM drucksache_analyses
  WHERE prompt_version IN ('v1','v1.1') AND analyze_error IS NULL
    AND (zusammenfassung LIKE '%</%' OR zusammenfassung LIKE '%<parameter%'
         OR thema LIKE '%<%' OR tonalitaet LIKE '%<%'
         OR regelung LIKE '%<%' OR begruendung LIKE '%<%' OR auswirkung LIKE '%<%')
`).all() as any[];

console.log(`📋 ${rows.length} Edge-Case-Records`);

const upd = db.prepare(`
  UPDATE drucksache_analyses
  SET zusammenfassung=?, tonalitaet=?, regelung=?, begruendung=?, auswirkung=?,
      betroffene_gruppen=?, fraktion=?
  WHERE drucksache_nr=? AND prompt_version IN ('v1','v1.1')
`);

for (const r of rows) {
  upd.run(
    stripTrailingXml(r.zusammenfassung),
    stripTrailingXml(r.tonalitaet),
    stripTrailingXml(r.regelung),
    stripTrailingXml(r.begruendung),
    stripTrailingXml(r.auswirkung),
    stripTrailingXml(r.betroffene_gruppen),
    stripTrailingXml(r.fraktion),
    r.drucksache_nr,
  );
  console.log(`✓ ${r.drucksache_nr}`);
}
console.log("Done.");
