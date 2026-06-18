/**
 * Lädt die hand-verdichteten Stichpunkte (scripts/data/partei-kompakt.ts) in
 * partei_themenfeld_position.kompakt_json. Idempotent (UPDATE je Partei×Feld).
 *
 *   npx tsx scripts/load-partei-kompakt.ts
 */
import Database from "better-sqlite3";
import { KOMPAKT } from "./data/partei-kompakt";

const db = new Database("politik.db");

// Spalte idempotent anlegen (falls noch nicht vorhanden) — macht das Skript self-contained.
try {
  db.exec(`ALTER TABLE partei_themenfeld_position ADD COLUMN kompakt_json TEXT`);
} catch {
  /* Spalte existiert bereits */
}

const upd = db.prepare(
  `UPDATE partei_themenfeld_position SET kompakt_json = ? WHERE partei = ? AND feld = ?`,
);

let ok = 0;
let miss = 0;
for (const [feld, perPartei] of Object.entries(KOMPAKT)) {
  for (const [partei, bullets] of Object.entries(perPartei)) {
    const r = upd.run(JSON.stringify(bullets), partei, feld);
    if (r.changes === 1) ok++;
    else {
      miss++;
      console.warn(`  ⚠ kein Treffer: ${partei} / ${feld}`);
    }
  }
}

console.log(`✓ ${ok} Felder geladen, ${miss} ohne Treffer.`);
db.close();
