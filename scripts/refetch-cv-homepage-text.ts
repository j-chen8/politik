/**
 * Holt cv_homepage_text für MdBs nach, die zwar cv_homepage_json + cv_homepage_url
 * haben, aber keinen gespeicherten Roh-Text (Bestand vor 2026-04-28).
 *
 * Re-fetcht direkt cv_homepage_url, kein Discovery, kein LLM.
 *
 * Run: npx tsx scripts/refetch-cv-homepage-text.ts [--limit N]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PER_DOMAIN_DELAY_MS = 1000;
const CONCURRENCY = 4;

const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const lastFetchAt = new Map<string, number>();
async function politeFetch(url: string, timeoutMs = 12000): Promise<Response | null> {
  const host = new URL(url).hostname;
  const last = lastFetchAt.get(host) ?? 0;
  const wait = Math.max(0, last + PER_DOMAIN_DELAY_MS - Date.now());
  if (wait > 0) await sleep(wait);
  lastFetchAt.set(host, Date.now());

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

import { cleanBioHtml } from "./_lib/html-clean";

function htmlToText(html: string): string {
  return cleanBioHtml(html).text;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  let rows = db.prepare(
    `SELECT p.id, p.first_name, p.last_name, p.cv_homepage_url
     FROM politicians p
     WHERE p.cv_homepage_url IS NOT NULL
       AND p.cv_homepage_text IS NULL`
  ).all() as { id: number; first_name: string; last_name: string; cv_homepage_url: string }[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} MdBs ohne cv_homepage_text`);
  if (rows.length === 0) { db.close(); return; }

  const update = db.prepare(`UPDATE politicians SET cv_homepage_text = ? WHERE id = ?`);

  let ok = 0, fail = 0, done = 0;
  const start = Date.now();

  async function processOne(p: typeof rows[0]) {
    const name = `${p.first_name} ${p.last_name}`;
    try {
      const res = await politeFetch(p.cv_homepage_url);
      if (!res?.ok) { fail++; console.log(`\n  ✗ ${name}: HTTP ${res?.status ?? "fetch"}`); return; }
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("text/html")) { fail++; console.log(`\n  ✗ ${name}: non-html (${ct})`); return; }
      const html = await res.text();
      const text = htmlToText(html);
      if (text.length < 200) { fail++; console.log(`\n  ✗ ${name}: text too short (${text.length})`); return; }
      update.run(text, p.id);
      ok++;
    } catch (e: any) {
      fail++;
      console.log(`\n  ✗ ${name}: ${e.message?.slice(0, 100)}`);
    } finally {
      done++;
      const elapsed = (Date.now() - start) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((rows.length - done) / Math.max(rate, 0.01));
      process.stdout.write(`\r  [${done}/${rows.length}] ok=${ok} fail=${fail} ${rate.toFixed(1)}/s ETA ${eta}s   `);
    }
  }

  let nextIdx = 0;
  async function worker() {
    while (nextIdx < rows.length) {
      const i = nextIdx++;
      await processOne(rows[i]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write("\n");

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Fehler:      ${fail}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
