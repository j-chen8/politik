import Database from "better-sqlite3";
const APPLY = process.argv.includes("--apply");
const db = new Database("politik.db");
const DG = "[–—-]";
const WM = new RegExp(`Vorabfassung\\s*${DG}\\s*wird durch die lektorierte (?:Version|Fassung) ersetzt\\.?`, "g");
const strip = (s: string | null) => s == null ? s : s.replace(WM, " ").replace(/\s+/g, " ").trim();
const rows = db.prepare(`SELECT id, frage_text, antwort_text FROM drucksache_qa_paare`).all() as any[];
let chF = 0, chA = 0;
const upd = db.prepare(`UPDATE drucksache_qa_paare SET frage_text=?, antwort_text=? WHERE id=?`);
const tx = db.transaction((rs: any[]) => {
  for (const r of rs) {
    const nf = strip(r.frage_text), na = strip(r.antwort_text);
    if (nf !== r.frage_text) chF++;
    if (na !== r.antwort_text) chA++;
    if (APPLY && (nf !== r.frage_text || na !== r.antwort_text)) upd.run(nf, na, r.id);
  }
});
tx(rows);
console.log(`${APPLY ? "ANGEWENDET" : "DRY"}: Fragen geändert ${chF}, Antworten geändert ${chA}`);
// Verbleibende Treffer prüfen
if (APPLY) {
  const rest = db.prepare(`SELECT COUNT(*) c FROM drucksache_qa_paare WHERE frage_text LIKE '%Vorabfassung%' OR antwort_text LIKE '%Vorabfassung%'`).get() as any;
  console.log(`Rest mit "Vorabfassung": ${rest.c}`);
}
db.close();
