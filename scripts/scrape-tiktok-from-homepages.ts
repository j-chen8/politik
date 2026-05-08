/**
 * Roh-Scrape der MdB-Homepages, nur um TikTok-Profil-URLs zu finden.
 *
 * Kein LLM. Holt HTML, regex auf tiktok.com/@handle. Schreibt in
 * politicians.tiktok_handle.
 *
 * Run: npx tsx scripts/scrape-tiktok-from-homepages.ts [--limit N] [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const USER_AGENT =
  "Mozilla/5.0 (compatible; politik-radar/1.0; +https://github.com/opoi1/politik)";
const FETCH_TIMEOUT_MS = 15000;
const DELAY_MS = 800; // höflich gegenüber den MdB-Servern

const argLimit = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = argLimit ? parseInt(argLimit.split("=")[1], 10) : 0;
const DRY_RUN = process.argv.includes("--dry-run");

interface Row {
  id: number;
  first_name: string;
  last_name: string;
  url: string;
}

async function fetchHtml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    const txt = await res.text();
    return txt;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Match: tiktok.com/@handle  oder  tiktok.com/handle  (vor Whitespace/Anführungszeichen/Slash-Ende)
const TIKTOK_RE = /tiktok\.com\/@?([A-Za-z0-9_.-]{2,40})/gi;

// Häufige Phantom-Treffer aus Cookie-Bannern, Tracking, generischen Links
const BLACKLIST = new Set([
  "embed",
  "share",
  "trending",
  "discover",
  "music",
  "tag",
  "explore",
  "login",
  "signup",
  "foryou",
  "live",
  "search",
  "node_modules",
  "static",
  "tiktok",
]);

function extractTiktok(html: string): string | null {
  const seen = new Map<string, number>();
  let m: RegExpExecArray | null;
  TIKTOK_RE.lastIndex = 0;
  while ((m = TIKTOK_RE.exec(html))) {
    const handle = m[1].toLowerCase().replace(/[.-]+$/, "");
    if (handle.length < 3) continue;
    if (BLACKLIST.has(handle)) continue;
    if (/^v\d/.test(handle)) continue; // tiktok.com/v123… short-share-IDs
    if (handle === "www") continue;
    seen.set(handle, (seen.get(handle) ?? 0) + 1);
  }
  if (seen.size === 0) return null;
  // Häufigster Treffer gewinnt (Fußzeilen-Icon ist typischerweise der Profillink)
  return [...seen.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("tiktok_handle")) {
    if (!DRY_RUN) {
      db.exec("ALTER TABLE politicians ADD COLUMN tiktok_handle TEXT");
      console.log("→ Spalte tiktok_handle angelegt");
    } else {
      console.log("[DRY] würde Spalte tiktok_handle anlegen");
    }
  }

  const limitClause = LIMIT > 0 ? `LIMIT ${LIMIT}` : "";
  const rows = db
    .prepare(
      `SELECT p.id, p.first_name, p.last_name,
              COALESCE(p.cv_homepage_url, p.homepage_url) AS url
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = 5
         AND COALESCE(p.cv_homepage_url, p.homepage_url) IS NOT NULL
       ORDER BY p.id
       ${limitClause}`
    )
    .all() as Row[];

  console.log(`${rows.length} MdBs mit Homepage zu prüfen${LIMIT ? ` (limit=${LIMIT})` : ""}`);

  const update = DRY_RUN
    ? null
    : db.prepare("UPDATE politicians SET tiktok_handle = ? WHERE id = ?");
  let hits = 0;
  let fail = 0;
  let done = 0;
  const sample: { name: string; handle: string; url: string }[] = [];

  for (const r of rows) {
    done++;
    const html = await fetchHtml(r.url);
    if (!html) {
      fail++;
      process.stdout.write(`\r  [${done}/${rows.length}] hits=${hits} fail=${fail}`);
      await sleep(DELAY_MS);
      continue;
    }
    const handle = extractTiktok(html);
    if (handle) {
      hits++;
      sample.push({ name: `${r.first_name} ${r.last_name}`, handle, url: r.url });
      if (update) update.run(handle, r.id);
    }
    process.stdout.write(`\r  [${done}/${rows.length}] hits=${hits} fail=${fail}`);
    await sleep(DELAY_MS);
  }
  process.stdout.write("\n");

  console.log(`\n=== Ergebnis ===`);
  console.log(`  ${hits} TikTok-Handles gefunden`);
  console.log(`  ${fail} Homepages nicht erreichbar`);
  console.log(`  ${rows.length - hits - fail} ohne TikTok-Erwähnung`);

  console.log(`\n── Erste 20 Treffer ──`);
  for (const s of sample.slice(0, 20)) {
    console.log(`  ${s.name} → @${s.handle}  (${new URL(s.url).hostname})`);
  }

  if (DRY_RUN) console.log(`\n[DRY RUN] keine DB-Updates.`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
