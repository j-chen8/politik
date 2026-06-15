/**
 * Backfill `drucksache_analyses.dokumenttyp` aus dem amtlichen DIP-Typ
 * (`dip_ds_titles.drucksachetyp`).
 *
 * WURZELFIX (2026-06-15): `batch_class` ist ein Längen-/Verarbeitungs-Tier
 * (klein/mittel/gross/antwort/administrativ/regierung), KEIN Dokumenttyp.
 * `batch_class='klein'` enthält ~600 Anträge + ~95 Entschließungs-/Änderungsanträge,
 * die in der UI fälschlich als „Kleine Anfrage" erschienen, weil `dokumenttyp`
 * fast immer leer war (6358/6379) und die UI dann auf den batch_class-Default fiel.
 * DIP liefert den amtlichen Typ pro Drucksache (Kleine Anfrage / Antrag / Gesetz-
 * entwurf / Unterrichtung / Beschlussempfehlung / Wahlvorschlag / …).
 *
 * Idempotent + re-runbar (z. B. nach seed-dip-ds-titles-all.ts). DIP ist
 * autoritativ und überschreibt auch die ~21 alten LLM-dokumenttyp-Werte.
 *
 *   npx tsx scripts/backfill-drucksache-dokumenttyp.ts          (dry-run)
 *   npx tsx scripts/backfill-drucksache-dokumenttyp.ts --apply  (Backup + Write)
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DO_APPLY = process.argv.includes("--apply");
const db = new Database(DB_PATH);

const rows = db.prepare(`
  SELECT da.drucksache_nr, da.batch_class, da.dokumenttyp AS alt, t.drucksachetyp AS neu
  FROM drucksache_analyses da
  JOIN dip_ds_titles t ON t.drucksache_nr = da.drucksache_nr
  WHERE da.analyze_error IS NULL
    AND t.drucksachetyp IS NOT NULL AND trim(t.drucksachetyp) <> ''
    AND IFNULL(da.dokumenttyp,'') <> t.drucksachetyp
`).all() as { drucksache_nr: string; batch_class: string; alt: string | null; neu: string }[];

console.log(`Zu setzen/ändern: ${rows.length} Analysen\n`);
// Vorschau: was sich an Anzeige-Typen ändert, gruppiert
const grp = new Map<string, number>();
for (const r of rows) {
  const key = `${r.batch_class} | "${r.alt ?? ""}" → "${r.neu}"`;
  grp.set(key, (grp.get(key) ?? 0) + 1);
}
[...grp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, n]) => console.log(`  ${n.toString().padStart(4)}  ${k}`));

if (!rows.length) { console.log("✓ Nichts zu tun."); db.close(); process.exit(0); }
if (!DO_APPLY) { console.log("\n(dry-run — mit --apply schreiben)"); db.close(); process.exit(0); }

db.exec(`DROP TABLE IF EXISTS drucksache_analyses_pre_dokumenttyp_fix`);
db.exec(`CREATE TABLE drucksache_analyses_pre_dokumenttyp_fix AS SELECT * FROM drucksache_analyses`);
const upd = db.prepare(`UPDATE drucksache_analyses SET dokumenttyp = ? WHERE drucksache_nr = ?`);
const tx = db.transaction((rs: typeof rows) => { for (const r of rs) upd.run(r.neu, r.drucksache_nr); });
tx(rows);
console.log(`\n✓ ${rows.length} dokumenttyp gesetzt. Backup: drucksache_analyses_pre_dokumenttyp_fix`);
db.close();
