/**
 * Re-Verifikation (kein LLM, gratis): prüft die bereits gespeicherten Beleg-Zitate
 * mit dem gehärteten Normalisierer (NFKD + nur alphanumerisch) erneut gegen die
 * Programm-Seiten und schreibt seite/verifiziert in belege_json zurück.
 *
 * Holt formatierungsbedingte Falsch-Negative zurück (Aufzählung ▪/•, Gender-Stern,
 * Soft-Hyphen, (Kapitel)-Querverweise). Echte Wortlaut-Abweichungen bleiben unverifiziert.
 *
 *   npx tsx scripts/wahlprogramm-reverify.ts          # Vorschau (zeigt nur Diffs)
 *   npx tsx scripts/wahlprogramm-reverify.ts --write   # schreibt in die DB
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const WRITE = process.argv.includes("--write");
const db = new Database(path.join(process.cwd(), "politik.db"));
const KEY: Record<string, string> = {
  "CDU/CSU": "cdu_csu", SPD: "spd", "GRÜNE": "gruene", LINKE: "linke", AfD: "afd",
};
const cache: Record<string, { page: number; text: string }[]> = {};
const pages = (k: string) =>
  (cache[k] ??= JSON.parse(fs.readFileSync(path.join("data", "wahlprogramme", `${k}.pages.json`), "utf8")));
const norm = (s: string) => s.normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

function verify(key: string, zitat: string): number | null {
  const z = norm(zitat).slice(0, 70);
  if (z.length < 30) return null;
  for (const pg of pages(key)) if (norm(pg.text).includes(z)) return pg.page;
  return null;
}

const rows = db.prepare(`SELECT partei, feld, belege_json FROM partei_themenfeld_position WHERE belege_json IS NOT NULL`)
  .all() as { partei: string; feld: string; belege_json: string }[];
const upd = db.prepare(`UPDATE partei_themenfeld_position SET belege_json=? WHERE partei=? AND feld=?`);

let recovered = 0, stillUnverified = 0, changedRows = 0;
const tx = db.transaction(() => {
  for (const r of rows) {
    const key = KEY[r.partei]; if (!key) continue;
    const belege = JSON.parse(r.belege_json) as { zitat: string; seite: number | null; verifiziert: boolean }[];
    let changed = false;
    for (const b of belege) {
      const wasVer = !!b.verifiziert;
      const seite = verify(key, b.zitat);
      const nowVer = seite !== null;
      if (nowVer !== wasVer || (nowVer && b.seite !== seite)) { b.seite = seite; b.verifiziert = nowVer; changed = true; }
      if (!wasVer && nowVer) recovered++;
      if (!nowVer) stillUnverified++;
    }
    if (changed) { changedRows++; if (WRITE) upd.run(JSON.stringify(belege), r.partei, r.feld); }
  }
});
tx();

console.log(`${WRITE ? "GESCHRIEBEN" : "VORSCHAU"}: ${rows.length} Positionen geprüft`);
console.log(`  zurückgewonnen (war unverifiziert → jetzt verifiziert): ${recovered}`);
console.log(`  bleibt unverifiziert (echte Wortlaut-Abweichung):       ${stillUnverified}`);
console.log(`  Positionen mit geänderten Belegen:                      ${changedRows}`);
if (!WRITE) console.log(`\n→ mit --write in die DB schreiben`);
db.close();
