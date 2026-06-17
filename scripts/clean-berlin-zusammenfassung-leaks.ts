/**
 * Berlin-Reden §3-Cleaner: strippt Tool-Output-Drift aus zusammenfassung_2_saetze.
 *
 * Haiku 4.5 schreibt regelmäßig (~1/4 der Outputs) Tool-Use-XML-Tags direkt in den
 * Feldwert, z.B. "…Zustimmung im Plenum.</zusammenfassung_2_saetze> <parameter
 * name=\"neutralitaets_self_check\">{…". Wir schneiden vor dem ERSTEN Drift-Marker ab.
 *
 * Idempotent: saubere Zeilen bleiben unberührt; Re-Run findet 0.
 * Rekonstruiert nach Verlust des ursprünglichen _clean-berlin-zusammenfassung-leaks.ts
 * (uncommittet → Track-Reset). Siehe docs/berlin-sitzungs-pipeline.md §3.
 *
 * Run:
 *   npx tsx scripts/clean-berlin-zusammenfassung-leaks.ts            # Dry-Run
 *   npx tsx scripts/clean-berlin-zusammenfassung-leaks.ts --apply    # schreibt
 */
import Database from "better-sqlite3";
import path from "path";

const APPLY = process.argv.includes("--apply");

// Erster auftretender Marker beendet den echten Text. Varianten:
//  </zusammenfassung_2_saetze> bzw. <zusammenfassung_2_saetze>, <parameter …>,
//  </parameter>, neutralitaets_self_check, sowie Tool-Use-Rahmen-Tags.
const MARKER = /<\/?zusammenfassung_2_saetze|<\/?parameter\b|neutralitaets_self_check|<function_calls|<\/antml:|<invoke\b/i;

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 30000");

const rows = db
  .prepare(`SELECT id, zusammenfassung_2_saetze AS z FROM berlin_speech_analyses WHERE zusammenfassung_2_saetze IS NOT NULL`)
  .all() as { id: number; z: string }[];

const upd = db.prepare(`UPDATE berlin_speech_analyses SET zusammenfassung_2_saetze=? WHERE id=?`);
let fixed = 0;
const samples: string[] = [];

const tx = db.transaction(() => {
  for (const r of rows) {
    const m = r.z.match(MARKER);
    if (!m || m.index === undefined) continue;
    // vor dem Marker abschneiden + Trailing-Müll (Whitespace, ", ', ,, dangling <) trimmen
    const cleaned = r.z.slice(0, m.index).replace(/["',\s<]+$/, "").trim();
    if (cleaned === r.z) continue;
    fixed++;
    if (samples.length < 5) samples.push(`#${r.id}: …${r.z.slice(Math.max(0, m.index - 40), m.index)} ⟪CUT⟫ ${r.z.slice(m.index, m.index + 30)}`);
    if (APPLY) upd.run(cleaned, r.id);
  }
});
tx();

console.log(`${fixed} Reden mit Tool-Output-Leak ${APPLY ? "bereinigt" : "gefunden (Dry-Run — --apply zum Schreiben)"}`);
for (const s of samples) console.log("  " + s);
db.close();
