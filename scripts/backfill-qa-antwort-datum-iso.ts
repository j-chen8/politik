/**
 * Normalisiert drucksache_qa_paare.antwort_datum ("29. Juli 2025") zu ISO
 * (antwort_datum_iso = "2025-07-29") als sortierbare Datumsquelle. Das
 * Antwortdatum ist pro Paar erfasst (98,2 % Coverage) und füllt die 609
 * Paare, deren Sammeldrucksache kein publication_date hat — darunter die
 * 4 neuesten Docs, die sonst (NULL-Datum) bei "alt→neu" fälschlich oben
 * landeten.
 *
 *   (ohne Flag)  Dry-Run: zeigt Coverage + nicht-parsebare Werte
 *   --apply      Spalte anlegen (falls fehlt) + backfillen
 */
import Database from "better-sqlite3";
import { parseGermanDate } from "./_lib/german-date";

const APPLY = process.argv.includes("--apply");

const db = new Database("politik.db");

if (APPLY) {
  const cols = db.prepare(`PRAGMA table_info(drucksache_qa_paare)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === "antwort_datum_iso")) {
    db.exec(`ALTER TABLE drucksache_qa_paare ADD COLUMN antwort_datum_iso TEXT`);
    console.log("Spalte antwort_datum_iso angelegt.");
  }
}

// publication_date je Doc (Invariante: Antwortdatum kann nie NACH der Veröffentlichung liegen).
const pubByDoc = new Map<string, string | null>();
for (const r of db.prepare(`SELECT drucksache_nr, publication_date FROM drucksache_texts`).all() as { drucksache_nr: string; publication_date: string | null }[])
  pubByDoc.set(r.drucksache_nr, r.publication_date);

const rows = db.prepare(`SELECT id, drucksache_nr, antwort_datum FROM drucksache_qa_paare`).all() as { id: number; drucksache_nr: string; antwort_datum: string | null }[];
let ok = 0, bad = 0, empty = 0, future = 0;
const badVals = new Set<string>();
const upd = db.prepare(`UPDATE drucksache_qa_paare SET antwort_datum_iso=? WHERE id=?`);
const tx = db.transaction((rs: typeof rows) => {
  for (const r of rs) {
    if (!r.antwort_datum || !r.antwort_datum.trim()) { empty++; if (APPLY) upd.run(null, r.id); continue; }
    const iso = parseGermanDate(r.antwort_datum);
    if (!iso) { bad++; badVals.add(r.antwort_datum.trim()); if (APPLY) upd.run(null, r.id); continue; }
    const pub = pubByDoc.get(r.drucksache_nr);
    if (pub && iso > pub) { future++; if (APPLY) upd.run(null, r.id); continue; } // Quell-Typo → publication_date-Fallback
    ok++; if (APPLY) upd.run(iso, r.id);
  }
});
tx(rows);

console.log(`${APPLY ? "ANGEWENDET" : "DRY"}: ${ok} parsebar, ${bad} nicht parsebar, ${future} > publication_date verworfen, ${empty} leer (von ${rows.length})`);
if (badVals.size) console.log("Nicht-parsebar:", [...badVals].slice(0, 15).map((v) => `«${v}»`).join(", "));
db.close();
