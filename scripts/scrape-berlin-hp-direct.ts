/**
 * Direkter Homepage-Text-Scrape: fetcht NUR die homepage_url selbst (ein Fetch,
 * kein findAboutPage-Subseiten-Crawl) und reinigt mit cleanBioHtml. Robust in
 * flaky-Netz-Umgebungen, wo findAboutPages Mehrfach-Fetch-Sequenz hängt.
 * Googlebot-UA-Fallback bei 403. Schreibt cv_homepage_text/cv_homepage_url.
 *
 * Run: npx tsx scripts/scrape-berlin-hp-direct.ts <id> <id> ...
 */
import Database from "better-sqlite3";
import path from "path";
import { cleanBioHtml } from "./_lib/html-clean";

const DB_PATH = path.join(process.cwd(), "politik.db");
const MAX_TEXT_CHARS = 8000;
const MIN_TEXT_CHARS = 800;
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];
const ids = process.argv.slice(2).map((s) => parseInt(s, 10)).filter(Boolean);
if (!ids.length) { console.error("Keine IDs"); process.exit(1); }

async function fetchHtml(url: string, ua: string): Promise<{ status: number; html?: string; finalUrl?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": ua, "Accept": "text/html,*/*;q=0.8", "Accept-Language": "de-DE,de;q=0.9" } });
    if (!r.ok) return { status: r.status };
    return { status: 200, html: await r.text(), finalUrl: r.url };
  } catch { return { status: 0 }; } finally { clearTimeout(t); }
}

(async () => {
  const db = new Database(DB_PATH);
  const get = db.prepare(`SELECT id, first_name, last_name, homepage_url FROM politicians WHERE id = ?`);
  const upd = db.prepare(`UPDATE politicians SET cv_homepage_text = ?, cv_homepage_url = ? WHERE id = ?`);
  let ok = 0, miss = 0;
  for (const id of ids) {
    const p = get.get(id) as any;
    if (!p?.homepage_url) { console.log(`  ? ${id} keine URL`); miss++; continue; }
    const name = `${p.first_name} ${p.last_name}`;
    let res = await fetchHtml(p.homepage_url, UAS[0]);
    if (!res.html) res = await fetchHtml(p.homepage_url, UAS[1]); // Googlebot-Fallback
    if (!res.html) { console.log(`  ✗ ${name.padEnd(24)} HTTP ${res.status}`); miss++; continue; }
    const clean = cleanBioHtml(res.html);
    if (clean.text.length >= MIN_TEXT_CHARS) {
      const text = clean.text.slice(0, MAX_TEXT_CHARS);
      upd.run(text, res.finalUrl ?? p.homepage_url, p.id);
      ok++;
      console.log(`  ✓ ${name.padEnd(24)} ${String(text.length).padStart(5)}z${clean.suspicious ? " ⚠susp" : ""}  ${res.finalUrl}`);
    } else {
      miss++;
      console.log(`  ✗ ${name.padEnd(24)} nur ${clean.text.length}z (<${MIN_TEXT_CHARS}, JS-gerendert?)  ${p.homepage_url}`);
    }
  }
  db.close();
  console.log(`\nFertig: ${ok} mit Text, ${miss} ohne.`);
})();
