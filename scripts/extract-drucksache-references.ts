/**
 * Extrahiert für jede Antwort-Drucksache die referenzierte ursprüngliche Anfrage.
 * Pattern: "– Drucksache 21/XXX –" oder "Drucksache 21/XXX" im Header der ersten ~500 Zeichen.
 *
 * Persistiert in neuer Spalte drucksache_texts.referenced_drucksache_nr.
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

try { db.exec(`ALTER TABLE drucksache_texts ADD COLUMN referenced_drucksache_nr TEXT`); } catch {}

const rows = db.prepare(`
  SELECT drucksache_nr, batch_class, substr(full_text, 1, 800) AS head
  FROM drucksache_texts
  WHERE batch_class IN ('antwort','regierung') AND full_text IS NOT NULL
`).all() as Array<{ drucksache_nr: string; batch_class: string; head: string }>;

console.log(`📋 ${rows.length} antwort/regierung-Records scannen`);

const upd = db.prepare(`UPDATE drucksache_texts SET referenced_drucksache_nr=? WHERE drucksache_nr=?`);
const re = /Drucksache\s+(\d+\s*\/\s*\d+)/g;

let found = 0;
for (const r of rows) {
  const matches = [...r.head.matchAll(re)].map((m) => m[1].replace(/\s/g, ""));
  // Eigene Nummer ausschließen
  const candidates = matches.filter((nr) => nr !== r.drucksache_nr);
  if (candidates.length === 0) continue;
  // Erste Referenz nehmen (sollte die ursprüngliche Anfrage sein)
  upd.run(candidates[0], r.drucksache_nr);
  found++;
}

console.log(`✓ ${found} Referenzen extrahiert (${((found / rows.length) * 100).toFixed(1)}%)`);
