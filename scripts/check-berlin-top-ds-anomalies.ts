/**
 * Anomalie-Check für TOP↔Drucksachen-Zuordnung (Berlin).
 *
 * Methodik: Der seed-Region-Sammler kann fremde DS auf einen TOP kleben
 * (alle im Redebereich erwähnten DS). fix-berlin-top-markers korrigiert das
 * via Header-Fenster. Dieser Check ist die Sicherheitsstufe darüber:
 *
 *  - HARD-FLAG: TOPs mit >6 DS → fast immer Inflations-Bug, Pflicht-Review.
 *    (Legitime Bündel/Haushalt deckeln empirisch bei 6.)
 *  - REVIEW-TABELLE: alle TOPs mit ≥4 DS für einen einmaligen manuellen Scan.
 *    Spalte `bases` = distinkte Basis-DS-Nummern (ohne -N-Suffix). Viele
 *    distinkte Basen bei wenig erkennbarem Bündel = verdächtig; gleiche Basis
 *    + -1/-2/-3 (Änderungsanträge) oder 2–3 Basen (Antrag+Beschlussempfehlung)
 *    = legitime „Gemeinsame Beratung".
 *
 * Als Run-Check nach jedem seed/fix-Lauf gedacht (auch Regressions-Detektor).
 *
 * Run: npx tsx scripts/check-berlin-top-ds-anomalies.ts [--min=4] [--hard=6]
 */
import Database from "better-sqlite3";
import path from "path";

const arg = (k: string, d: number) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? parseInt(a.split("=")[1], 10) : d;
};
const MIN = arg("min", 4);
const HARD = arg("hard", 6);

const db = new Database(path.join(process.cwd(), "politik.db"));

const rows = db.prepare(`
  WITH top_ds AS (
    SELECT sitzung_nr, top_marker, top_titel, drucksache_nrn,
           json_array_length(drucksache_nrn) AS n,
           ROW_NUMBER() OVER (PARTITION BY sitzung_nr, top_marker, top_titel ORDER BY speech_id) AS rn
    FROM berlin_speeches
    WHERE drucksache_nrn IS NOT NULL AND drucksache_nrn != '[]' AND top_titel IS NOT NULL AND top_titel != ''
  )
  SELECT sitzung_nr, top_marker, top_titel, drucksache_nrn, n
  FROM top_ds WHERE rn = 1 AND n >= ? ORDER BY n DESC, sitzung_nr
`).all(MIN) as { sitzung_nr: number; top_marker: string; top_titel: string; drucksache_nrn: string; n: number }[];

function baseCount(dsJson: string): number {
  try {
    const arr = JSON.parse(dsJson) as string[];
    const bases = new Set(arr.map((d) => d.replace(/-\d+$/, "")));
    return bases.size;
  } catch { return 0; }
}

const hard = rows.filter((r) => r.n > HARD);
console.log(`\n=== HARD-FLAG: TOPs mit >${HARD} DS (Pflicht-Review) — ${hard.length} ===`);
if (hard.length === 0) console.log("  ✓ keine");
for (const r of hard) {
  console.log(`  ⚠ S${r.sitzung_nr} TOP${r.top_marker} · ${r.n} DS (${baseCount(r.drucksache_nrn)} Basen) · ${r.top_titel.slice(0, 40)}`);
  console.log(`     ${r.drucksache_nrn}`);
}

console.log(`\n=== REVIEW-TABELLE: TOPs mit ≥${MIN} DS (einmaliger manueller Scan) — ${rows.length} ===`);
console.log(`  ${"S/TOP".padEnd(11)} ${"n".padEnd(3)} ${"Basen".padEnd(6)} Titel / DS`);
for (const r of rows) {
  const bc = baseCount(r.drucksache_nrn);
  const flag = r.n > HARD ? "⚠" : bc >= 5 ? "?" : " ";
  console.log(`  ${flag} S${r.sitzung_nr}/T${r.top_marker}`.padEnd(13) + ` ${String(r.n).padEnd(3)} ${String(bc).padEnd(6)} ${r.top_titel.slice(0, 34)}`);
  console.log(`        ${r.drucksache_nrn}`);
}
console.log(`\nLegende: ⚠ = >${HARD} DS (Pflicht-Review) · ? = ≥5 distinkte Basen (genauer ansehen) · sonst wahrsch. legitim`);
db.close();
