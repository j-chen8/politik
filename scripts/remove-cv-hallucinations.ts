/**
 * Entfernt eindeutig halluzinierte CV-Einträge aus cv_json und cv_homepage_json.
 *
 * Marker: Schema-Beispiele aus dem ursprünglichen Prompt, die das LLM als
 * "Fakten" übernommen hat:
 *   - "Titel des Buches"  → Demo-Buchtitel
 *   - "(Suhrkamp)"        → Demo-Verlag
 *
 * Diese Strings tauchen bei Politiker:innen auf, die GAR KEINE Bücher
 * geschrieben haben — eindeutige Halluzination.
 *
 * Run: npx tsx scripts/remove-cv-hallucinations.ts [--dry]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DRY = process.argv.includes("--dry");

const HALLUCINATION_PATTERNS = [
  /Titel des Buches/i,
  /\(Suhrkamp\)/i,
  // SPD Ortsverein Köln-Mülheim — Schema-Beispiel
  /Ortsverein.*Köln-Mülheim/i,
  /Mülheim.*Ortsverein/i,
  // Wissenschaftlicher Mitarbeiter Lehrstuhl Verfassungsrecht Bonn — Schema-Beispiel
  /Lehrstuhl\s+für\s+Verfassungsrecht.*Universität\s+Bonn/i,
  /wissenschaftliche\w*\s+Mitarbeiter\w*\s+am\s+Lehrstuhl\s+für\s+Verfassungsrecht/i,
];

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

function isHallucination(text: string): boolean {
  return HALLUCINATION_PATTERNS.some((re) => re.test(text));
}

function cleanCv(cv: CV): { cv: CV; removed: number } {
  let removed = 0;
  const out: CV = {
    ausbildung: cv.ausbildung ?? [],
    beruflicher_werdegang: cv.beruflicher_werdegang ?? [],
    politische_stationen: cv.politische_stationen ?? [],
    sonstiges: cv.sonstiges ?? [],
  };
  for (const sec of ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"] as const) {
    const before = out[sec].length;
    out[sec] = out[sec].filter((e) => !isHallucination(e.text ?? ""));
    removed += before - out[sec].length;
  }
  return { cv: out, removed };
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Wir scannen alle CVs — der eigentliche Filter passiert in cleanCv() per Regex.
  const rows = db.prepare(`
    SELECT id, first_name, last_name, cv_json, cv_homepage_json
    FROM politicians
    WHERE cv_json IS NOT NULL OR cv_homepage_json IS NOT NULL
  `).all() as { id: number; first_name: string; last_name: string; cv_json: string | null; cv_homepage_json: string | null }[];

  console.log(`${rows.length} Politiker mit Halluzinations-Markern\n`);
  if (rows.length === 0) return;

  const update = db.prepare(`UPDATE politicians SET cv_json = ?, cv_homepage_json = ? WHERE id = ?`);
  let totalRemoved = 0;
  let politicianCount = 0;

  for (const r of rows) {
    let cv1 = r.cv_json;
    let cv2 = r.cv_homepage_json;
    let removedHere = 0;

    if (cv1) {
      try {
        const parsed = JSON.parse(cv1) as CV;
        const cleaned = cleanCv(parsed);
        if (cleaned.removed > 0) {
          cv1 = JSON.stringify(cleaned.cv);
          removedHere += cleaned.removed;
        }
      } catch {}
    }
    if (cv2) {
      try {
        const parsed = JSON.parse(cv2) as CV;
        const cleaned = cleanCv(parsed);
        if (cleaned.removed > 0) {
          cv2 = JSON.stringify(cleaned.cv);
          removedHere += cleaned.removed;
        }
      } catch {}
    }

    if (removedHere > 0) {
      if (!DRY) update.run(cv1, cv2, r.id);
      totalRemoved += removedHere;
      politicianCount++;
      if (politicianCount <= 5) console.log(`  ${r.first_name} ${r.last_name} (id=${r.id}): -${removedHere} Einträge`);
    }
  }
  if (politicianCount > 5) console.log(`  ... und ${politicianCount - 5} weitere Politiker:innen`);

  console.log(`\n=== Fertig${DRY ? " (DRY-RUN)" : ""} ===`);
  console.log(`  Politiker:innen verändert: ${politicianCount}`);
  console.log(`  Halluzinations-Einträge entfernt: ${totalRemoved}`);
  db.close();
}

main();
