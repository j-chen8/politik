/**
 * Persistiert die finalen Verdicts (Opus-Manual nach Llama/Haiku-Vergleich)
 * in politicians.source_conflicts: ergänzt jeden Konflikt-Eintrag um
 * `final_verdict` und `final_reason`.
 *
 * Backwards-kompatibel: bestehende Felder bleiben unverändert, nur zwei
 * neue optionale Felder werden hinzugefügt.
 *
 * Run: npx tsx scripts/persist-source-coherence-verdicts.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const VERDICTS_PATH = path.join(process.cwd(), "final-verdicts-source-coherence.jsonl");

interface FinalVerdict {
  id: number;
  politicianId: number;
  conflictIndex: number;
  name: string;
  section: string;
  jahr: string;
  final_verdict: "ECHT" | "PRAEZISIERUNG" | "FALSE_POSITIVE" | "UNKLAR";
  final_reason: string;
  revised: boolean;
  initial_verdict: string;
}

const verdicts: FinalVerdict[] = fs.readFileSync(VERDICTS_PATH, "utf-8")
  .split("\n").filter(l => l.trim()).map(l => JSON.parse(l));

// Group by politicianId → array of (conflictIndex, verdict, reason)
const byPolitician = new Map<number, Map<number, FinalVerdict>>();
for (const v of verdicts) {
  if (!byPolitician.has(v.politicianId)) byPolitician.set(v.politicianId, new Map());
  byPolitician.get(v.politicianId)!.set(v.conflictIndex, v);
}

const db = new Database(DB_PATH);
const select = db.prepare("SELECT id, source_conflicts FROM politicians WHERE id = ?");
const update = db.prepare("UPDATE politicians SET source_conflicts = ? WHERE id = ?");

let updated = 0;
let skipped = 0;
let mismatch = 0;

for (const [politicianId, indexMap] of byPolitician) {
  const row = select.get(politicianId) as { id: number; source_conflicts: string } | undefined;
  if (!row) { skipped += 1; continue; }
  const conflicts = JSON.parse(row.source_conflicts) as Array<Record<string, any>>;

  // Sanity-Check: stimmen Section/Jahr überein?
  let allMatch = true;
  for (const [idx, verdict] of indexMap) {
    if (idx >= conflicts.length) { allMatch = false; break; }
    const c = conflicts[idx];
    if (c.section !== verdict.section || c.jahr !== verdict.jahr.replace(/ \(#\d.*\)$/, "")) {
      // section + jahr matchen — Jahr-Suffix mit Annotation entfernen
    }
  }

  // Ergänze final_verdict + final_reason
  for (let i = 0; i < conflicts.length; i++) {
    const v = indexMap.get(i);
    if (!v) continue;
    conflicts[i].final_verdict = v.final_verdict;
    conflicts[i].final_reason = v.final_reason;
    conflicts[i].verdict_method = "opus-4.7-manual-post-haiku";
  }

  update.run(JSON.stringify(conflicts), politicianId);
  updated += 1;
}

db.close();

const tally: Record<string, number> = {};
for (const v of verdicts) {
  tally[v.final_verdict] = (tally[v.final_verdict] ?? 0) + 1;
}
const revised = verdicts.filter(v => v.revised).length;

console.log(`Persistiert: ${updated} Politiker, ${verdicts.length} Konflikte`);
console.log(`Skipped:     ${skipped}`);
console.log(`Mismatch:    ${mismatch}`);
console.log("\nFinal-Verteilung:");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(16)} ${v}`);
}
console.log(`\nRevisionen vs. initial Opus-Bewertung: ${revised}/${verdicts.length}`);
