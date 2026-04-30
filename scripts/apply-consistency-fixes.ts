/**
 * Wendet die Fixes aus check-cv-consistency.ts auf die DB an:
 *  - CV-Einträge mit Jahr < year_of_birth werden gelöscht
 *  - CV-Einträge die wegen Personenverwechslung kompletter Müll sind: manuell hier eingetragen
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

// 1. Personenverwechslungen — kompletter CV löschen
const WRONG_PERSON_IDS = [108390]; // Andreas Schwarz (Grüne BW) hatte SPD-Bamberg-CV

for (const id of WRONG_PERSON_IDS) {
  const r = db.prepare("SELECT first_name, last_name FROM politicians WHERE id=?").get(id) as { first_name: string; last_name: string } | undefined;
  if (!r) continue;
  db.prepare(
    `UPDATE politicians SET cv_json = NULL, cv_homepage_json = NULL, cv_summary = NULL,
      cv_homepage_text = NULL, cv_homepage_url = NULL, cv_homepage_generated_at = NULL,
      cv_generated_at = NULL, cv_summary_generated_at = NULL,
      cv_model = NULL, cv_homepage_model = NULL, cv_summary_model = NULL,
      cv_prompt_version = NULL, cv_homepage_prompt_version = NULL, cv_summary_prompt_version = NULL,
      cv_raw_llm_response = NULL, cv_homepage_raw_llm_response = NULL, cv_summary_raw_llm_response = NULL
    WHERE id = ?`
  ).run(id);
  console.log(`  ✗ ${r.first_name} ${r.last_name} (id=${id}) — kompletten CV gelöscht (Personenverwechslung)`);
}

// 2. Jahr-vor-Geburt-Einträge entfernen
const rows = db.prepare(`
  SELECT id, first_name, last_name, year_of_birth, cv_json, cv_homepage_json
  FROM politicians
  WHERE year_of_birth IS NOT NULL AND (cv_json IS NOT NULL OR cv_homepage_json IS NOT NULL)
`).all() as { id: number; first_name: string; last_name: string; year_of_birth: number; cv_json: string | null; cv_homepage_json: string | null }[];

const update = db.prepare("UPDATE politicians SET cv_json = ?, cv_homepage_json = ? WHERE id = ?");

let removed = 0;
const sections: (keyof CV)[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];

for (const r of rows) {
  let changed = false;
  let cv1 = r.cv_json;
  let cv2 = r.cv_homepage_json;

  function clean(json: string | null): string | null {
    if (!json) return null;
    try {
      const cv = JSON.parse(json) as CV;
      let touched = false;
      for (const sec of sections) {
        const before = (cv[sec] ?? []).length;
        cv[sec] = (cv[sec] ?? []).filter((e) => {
          const m = e.jahr.match(/(\d{4})/);
          if (!m) return true;
          const yr = parseInt(m[1], 10);
          if (yr < r.year_of_birth) {
            console.log(`  ✗ ${r.first_name} ${r.last_name} — ${sec}: "${e.text.slice(0, 60)}" Jahr ${yr} vor Geburt ${r.year_of_birth}`);
            removed++;
            touched = true;
            return false;
          }
          return true;
        });
        if (cv[sec].length !== before) touched = true;
      }
      return touched ? JSON.stringify(cv) : json;
    } catch {
      return json;
    }
  }

  const newCv1 = clean(cv1);
  const newCv2 = clean(cv2);
  if (newCv1 !== cv1 || newCv2 !== cv2) {
    update.run(newCv1, newCv2, r.id);
    changed = true;
  }
}

console.log(`\n=== Fertig ===`);
console.log(`  Personenverwechslung gelöscht: ${WRONG_PERSON_IDS.length}`);
console.log(`  Jahr-vor-Geburt-Einträge entfernt: ${removed}`);
db.close();
