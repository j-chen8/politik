/**
 * Holt cv_homepage_text für Berliner MdL, die eine homepage_url haben aber noch
 * keinen cv_homepage_text. Nutzt findAboutPage (Discovery, KEIN LLM) und speichert
 * Text + entdeckte Unterseiten-URL (cv_homepage_url).
 *
 * Berlin-Set: agh_bio_url IS NOT NULL ODER homepage_source='brave_search_verified'.
 *
 * Run:  npx tsx scripts/scrape-berlin-homepage-text.ts [--limit N] [--refresh] [--dry-run]
 *   --refresh  auch MdL mit bereits vorhandenem cv_homepage_text neu holen
 *   --dry-run  nichts in die DB schreiben, nur Report
 */

import Database from "better-sqlite3";
import path from "path";
import { findAboutPage } from "./_lib/homepage-discovery";

const DB_PATH = path.join(process.cwd(), "politik.db");
const CONCURRENCY = 4;
const MAX_TEXT_CHARS = 8000;

const REFRESH = process.argv.includes("--refresh");
const DRY = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

async function main() {
  const db = new Database(DB_PATH);

  const where = REFRESH
    ? "AND homepage_url IS NOT NULL"
    : "AND homepage_url IS NOT NULL AND cv_homepage_text IS NULL";
  const rows = db.prepare(
    `SELECT id, first_name, last_name, homepage_url
       FROM politicians
      WHERE (agh_bio_url IS NOT NULL OR homepage_source='brave_search_verified')
      ${where}
      ORDER BY last_name`
  ).all() as { id: number; first_name: string; last_name: string; homepage_url: string }[];

  const todo = LIMIT > 0 ? rows.slice(0, LIMIT) : rows;
  console.log(`${todo.length} Berliner MdL zu verarbeiten${DRY ? " (DRY-RUN)" : ""}\n`);

  const update = db.prepare(
    `UPDATE politicians SET cv_homepage_text = ?, cv_homepage_url = ? WHERE id = ?`
  );

  let ok = 0, miss = 0, idx = 0;
  const stats: { name: string; url: string; chars: number; from: string }[] = [];

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= todo.length) return;
      const p = todo[i];
      const name = `${p.first_name} ${p.last_name}`;
      try {
        const hit = await findAboutPage(p.homepage_url);
        if (hit && hit.text.length >= 300) {
          const text = hit.text.slice(0, MAX_TEXT_CHARS);
          if (!DRY) update.run(text, hit.url, p.id);
          ok++;
          stats.push({ name, url: hit.url, chars: text.length, from: p.homepage_url });
          console.log(`  ✓ ${name.padEnd(28)} ${text.length}z  ${hit.url}`);
        } else {
          miss++;
          console.log(`  ✗ ${name.padEnd(28)} kein Text  (${p.homepage_url})`);
        }
      } catch (e) {
        miss++;
        console.log(`  ✗ ${name.padEnd(28)} Fehler: ${(e as Error).message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  db.close();
  console.log(`\nFertig: ${ok} mit Text, ${miss} ohne.`);
  if (stats.length) {
    const avg = Math.round(stats.reduce((s, r) => s + r.chars, 0) / stats.length);
    const onePager = stats.filter((r) => r.url === r.from).length;
    console.log(`Ø ${avg} Zeichen · ${onePager} One-Pager (Homepage selbst) · ${stats.length - onePager} echte Unterseite`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
