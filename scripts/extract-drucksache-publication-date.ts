/**
 * Extrahiert Veröffentlichungsdatum aus dem PDF-Header jeder Drucksache.
 * Pattern: "21. Wahlperiode 30.06.2025" oder ähnlich in den ersten ~300 Zeichen.
 * Persistiert in neuer Spalte drucksache_texts.publication_date (ISO YYYY-MM-DD).
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

try { db.exec(`ALTER TABLE drucksache_texts ADD COLUMN publication_date TEXT`); } catch {}

const rows = db.prepare(`
  SELECT drucksache_nr, substr(full_text, 1, 400) AS head
  FROM drucksache_texts WHERE full_text IS NOT NULL
`).all() as Array<{ drucksache_nr: string; head: string }>;

console.log(`📋 ${rows.length} DS scannen`);

const upd = db.prepare(`UPDATE drucksache_texts SET publication_date=? WHERE drucksache_nr=?`);
// "21. Wahlperiode 30.06.2025" oder "Wahlperiode 02.10.2025"
const re = /(?:Wahlperiode|Wahlper\.|Wahlperiode\s*\n)\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/;

let found = 0;
for (const r of rows) {
  const m = r.head.match(re);
  if (!m) continue;
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  const yyyy = m[3];
  const iso = `${yyyy}-${mm}-${dd}`;
  upd.run(iso, r.drucksache_nr);
  found++;
}

console.log(`✓ ${found} Daten extrahiert (${((found / rows.length) * 100).toFixed(1)}%)`);
