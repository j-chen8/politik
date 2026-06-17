/**
 * Analyse des Fehlermusters anhand der Hand-Ground-Truth (80 DS) — KEIN LLM.
 * Verknüpft Wahrheits-Labels mit der DB: wo sitzen korrekt/grenzfall/falsch?
 *   - Querschnitt-Felder vs. Sachfelder
 *   - primäres/einziges Feld vs. sekundäres Feld
 * Plus DB-weit: wie oft ist jedes Querschnitt-Feld einziges vs. Zusatz-Feld.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const CROSS = new Set(["Transparenz & Open Data", "Verwaltung & Digitales", "Bezirksbezug", "Finanzen & Haushalt"]);
const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

// Ground truth
const gt = fs.readFileSync(path.join(process.cwd(), "scripts/_data/unterthemen-groundtruth.tsv"), "utf-8")
  .split("\n").filter(Boolean).map((l) => { const [dbid, feld, ut, verdict] = l.split("\t"); return { dbid, feld, ut, verdict }; });

// Felder pro DS (aus echter DB) → primär/sekundär bestimmen
const feldCount = new Map<string, number>();
for (const g of gt) feldCount.set(g.dbid, 0);
for (const dbid of feldCount.keys()) {
  const n = (db.prepare(`SELECT COUNT(*) c FROM berlin_ds_unterthemen WHERE dbid=?`).get(dbid) as { c: number }).c;
  feldCount.set(dbid, n);
}

function tally(rows: typeof gt) {
  const t = { korrekt: 0, grenzfall: 0, falsch: 0 };
  for (const r of rows) (t as any)[r.verdict]++;
  const tot = t.korrekt + t.grenzfall + t.falsch || 1;
  return `korrekt ${t.korrekt} (${(100 * t.korrekt / tot).toFixed(0)}%)  grenzfall ${t.grenzfall} (${(100 * t.grenzfall / tot).toFixed(0)}%)  falsch ${t.falsch} (${(100 * t.falsch / tot).toFixed(0)}%)   [n=${tot}]`;
}

const cross = gt.filter((g) => CROSS.has(g.feld));
const sach = gt.filter((g) => !CROSS.has(g.feld));
const crossSekundaer = cross.filter((g) => (feldCount.get(g.dbid) ?? 1) >= 2);
const sachSekundaer = sach.filter((g) => (feldCount.get(g.dbid) ?? 1) >= 2);

console.log("═".repeat(74));
console.log(`GROUND-TRUTH FEHLERVERTEILUNG (80 DS, ${gt.length} Hand-Urteile)`);
console.log("─".repeat(74));
console.log(`ALLE:                       ${tally(gt)}`);
console.log(`SACHFELDER:                 ${tally(sach)}`);
console.log(`QUERSCHNITT-Felder:         ${tally(cross)}`);
console.log(`QUERSCHNITT nur sekundär:   ${tally(crossSekundaer)}`);
console.log(`SACHFELD nur sekundär:      ${tally(sachSekundaer)}`);
console.log("─".repeat(74));
console.log("Querschnitt-Felder einzeln (alle Vorkommen in GT):");
for (const f of CROSS) {
  const rows = cross.filter((g) => g.feld === f);
  if (rows.length) console.log(`  ${f.padEnd(26)} ${tally(rows)}`);
}
console.log("═".repeat(74));

// DB-weit: Querschnitt-Feld einziges vs. zusätzliches Feld
console.log("\nDB-WEIT: ist das Querschnitt-Feld das EINZIGE Feld der DS oder ein Zusatz?");
for (const f of CROSS) {
  const sole = (db.prepare(`
    SELECT COUNT(*) c FROM berlin_ds_unterthemen u
    WHERE u.feld=? AND (SELECT COUNT(*) FROM berlin_ds_unterthemen u2 WHERE u2.dbid=u.dbid)=1`).get(f) as { c: number }).c;
  const total = (db.prepare(`SELECT COUNT(*) c FROM berlin_ds_unterthemen WHERE feld=?`).get(f) as { c: number }).c;
  console.log(`  ${f.padEnd(26)} einziges Feld: ${sole}/${total} (${(100 * sole / total).toFixed(0)}%)  → als Zusatz: ${total - sole}`);
}
