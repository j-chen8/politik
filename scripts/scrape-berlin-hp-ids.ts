/**
 * ID-gezielter Homepage-Text-Scrape (nutzt dieselbe findAboutPage-Discovery wie
 * scrape-berlin-homepage-text.ts). Für gezieltes Nachholen einzelner MdL im
 * Vordergrund (umgeht Auto-Background-Sandbox + ORDER-BY-Limit-Reihenfolge).
 *
 * Run: npx tsx scripts/scrape-berlin-hp-ids.ts <id> <id> ...
 */
import Database from "better-sqlite3";
import path from "path";
import { findAboutPage } from "./_lib/homepage-discovery";

const DB_PATH = path.join(process.cwd(), "politik.db");
const MAX_TEXT_CHARS = 8000;
const ids = process.argv.slice(2).map((s) => parseInt(s, 10)).filter(Boolean);
if (!ids.length) { console.error("Keine IDs angegeben"); process.exit(1); }

(async () => {
  const db = new Database(DB_PATH);
  const get = db.prepare(`SELECT id, first_name, last_name, homepage_url FROM politicians WHERE id = ?`);
  const upd = db.prepare(`UPDATE politicians SET cv_homepage_text = ?, cv_homepage_url = ? WHERE id = ?`);
  let ok = 0, miss = 0;
  for (const id of ids) {
    const p = get.get(id) as any;
    if (!p || !p.homepage_url) { console.log(`  ? ${id} keine homepage_url`); miss++; continue; }
    const name = `${p.first_name} ${p.last_name}`;
    try {
      const hit = await findAboutPage(p.homepage_url);
      if (hit && hit.text.length >= 300) {
        const text = hit.text.slice(0, MAX_TEXT_CHARS);
        upd.run(text, hit.url, p.id);
        ok++;
        console.log(`  ✓ ${name.padEnd(26)} ${String(text.length).padStart(5)}z  ${hit.url}`);
      } else {
        miss++;
        console.log(`  ✗ ${name.padEnd(26)} ${hit ? hit.text.length + "z (<300)" : "kein Treffer"}  (${p.homepage_url})`);
      }
    } catch (e) {
      miss++;
      console.log(`  ✗ ${name.padEnd(26)} Fehler: ${(e as Error).message}`);
    }
  }
  db.close();
  console.log(`\nFertig: ${ok} mit Text, ${miss} ohne.`);
})();
