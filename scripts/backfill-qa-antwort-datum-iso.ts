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

const APPLY = process.argv.includes("--apply");

const MONTHS: Record<string, number> = {
  januar: 1, februar: 2, "märz": 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
};

/** "29. Juli 2025" → "2025-07-29". Toleriert fehlenden Punkt/Leerzeichen. NULL bei fehlendem Jahr/OCR-Müll. */
function parseGermanDate(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.trim().toLowerCase().replace(/\s+/g, " ");
  t = t.replace(/([a-zä])(\d{4})/, "$1 $2"); // "november2025" → "november 2025"
  const m = t.match(/^(\d{1,2})\.?\s+([a-zä]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = MONTHS[m[2]];
  const year = parseInt(m[3], 10);
  if (!mon || !year || year < 2020 || year > 2030 || day < 1 || day > 31) return null;
  return `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

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
