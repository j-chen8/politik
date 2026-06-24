/**
 * Verifikation der Datenschicht für das Berlin Themen-Aktivitätsprofil
 * (Regierungsbilanz Produkt 1). Gibt pro Thema die rollen-getrennten Instrumente
 * aus — zum Review, bevor eine UI gebaut wird.
 *
 *   npx tsx scripts/verify-berlin-themen-aktivitaet.ts [Thema ...]
 *   (Default: Wohnen, plus 2 weitere zum Beleg der Generizität)
 */
import { getBerlinThemenAktivitaet } from "../src/lib/db";

const themen = process.argv.slice(2);
const ziele = themen.length ? themen : ["Wohnen", "Klimaschutz", "Mobilität"];

for (const thema of ziele) {
  const r = getBerlinThemenAktivitaet(thema);
  console.log(`\n══════ THEMA: ${r.thema}  (ab ${r.vonDatum}, Regierung = ${r.regierung.join("+")}) ══════`);
  for (const ins of r.instrumente) {
    if (!ins.total) { console.log(`\n  ${ins.label} (${ins.rolle}): —`); continue; }
    console.log(`\n  ${ins.label} (${ins.rolle}) — ${ins.total} gesamt:`);
    for (const p of ins.byPartei) {
      const tag = p.regierung ? "[Reg]" : "[Opp]";
      const bar = "█".repeat(Math.max(1, Math.round((p.n / ins.byPartei[0].n) * 24)));
      console.log(`    ${tag} ${p.partei.padEnd(13)} ${String(p.n).padStart(4)}  ${bar}`);
    }
  }
}
console.log("");
