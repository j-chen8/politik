/**
 * Wendet die 3 von GPT-4o-mini bestätigten Korrekturen aus dem
 * Tiebreak-Bericht direkt in der DB an.
 *
 * Nicht generisch — explizit gepflegte Liste, weil jede Korrektur
 * von einem dritten LLM mit Quellbeleg bestätigt wurde.
 */

import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

interface Patch {
  politicianId: number;
  name: string;
  cvField: "cv_json" | "cv_homepage_json";
  section: keyof CV;
  /** Wir suchen nach diesem Substring in entry.text und ersetzen den ganzen Eintrag */
  matchSubstring: string;
  newJahr: string;
  newText: string;
  reason: string;
}

const PATCHES: Patch[] = [
  {
    politicianId: 78863,
    name: "Jürgen Hardt",
    cvField: "cv_homepage_json",
    section: "ausbildung",
    matchSubstring: "High-School",
    newJahr: "1982",
    newText: "Abitur in Hofheim am Taunus",
    reason: "Llama übernahm fälschlich US-Begriff aus englischem Quelltext (high-school graduation). Quelle: Homepage-Text.",
  },
  {
    politicianId: 78944,
    name: "Julia Verlinden",
    cvField: "cv_homepage_json",
    section: "ausbildung",
    matchSubstring: "Energieeffizienzpolitik als Beitrag zum Klimaschutz",
    newJahr: "2008-2012",
    newText: "Promotion zum Dr. phil. an der Universität Lüneburg mit Schwerpunkt Energieeffizienzpolitik",
    reason: "Llama hatte detaillierten Promotions-Titel erfunden, der so nicht im Quelltext stand.",
  },
  {
    politicianId: 175409,
    name: "Carmen Wegge",
    cvField: "cv_homepage_json",
    section: "ausbildung",
    matchSubstring: "zweites juristisches Staatsexamen",
    newJahr: "2018",
    newText: "Zweites juristisches Staatsexamen abgeschlossen",
    reason: "Llama+Mistral schrieben \"seit 2018\". Quelltext sagt \"2018 beendete ich\" — einmaliges Ereignis, kein Zeitraum.",
  },
];

function applyPatch(p: Patch) {
  const row = db.prepare(`SELECT ${p.cvField} AS json FROM politicians WHERE id = ?`).get(p.politicianId) as { json: string | null } | undefined;
  if (!row || !row.json) {
    console.log(`  ✗ ${p.name}: ${p.cvField} ist leer`);
    return;
  }
  let cv: CV;
  try { cv = JSON.parse(row.json) as CV; } catch { console.log(`  ✗ ${p.name}: ungültiges JSON`); return; }

  const entries = cv[p.section] ?? [];
  let changed = false;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].text.includes(p.matchSubstring)) {
      const before = `${entries[i].jahr} — ${entries[i].text.slice(0, 80)}`;
      entries[i] = { jahr: p.newJahr, text: p.newText };
      const after = `${p.newJahr} — ${p.newText.slice(0, 80)}`;
      console.log(`  ✓ ${p.name} [${p.section}]`);
      console.log(`      vorher: ${before}`);
      console.log(`      nachher: ${after}`);
      console.log(`      grund: ${p.reason}`);
      changed = true;
      break;
    }
  }
  if (!changed) {
    console.log(`  ⤵  ${p.name}: kein Match für "${p.matchSubstring}" in ${p.section} — schon gefixt?`);
    return;
  }

  db.prepare(`UPDATE politicians SET ${p.cvField} = ? WHERE id = ?`).run(JSON.stringify(cv), p.politicianId);
}

console.log(`Wende ${PATCHES.length} Tiebreak-Patches an...\n`);
for (const p of PATCHES) applyPatch(p);
console.log(`\nFertig.`);
db.close();
