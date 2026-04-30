/**
 * Holt für jeden Politiker mit bio_url den vollständigen Wikipedia-Artikel
 * (Plain Text). Speichert nach politicians.bio_full_text.
 *
 * Quelle: https://de.wikipedia.org/w/api.php (action=query, prop=extracts,
 *         explaintext=true) — kostenfrei, kein Auth.
 *
 * Rate-Limit: ~5 req/s sicher unter Wikipedia-Limits.
 *
 * Run: npx tsx scripts/fetch-wikipedia-fulltext.ts [--all] [--refresh]
 *      --all     : auch Politiker ohne aktives Mandat
 *      --refresh : auch Einträge mit existierendem bio_full_text neu holen
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const WP_API = "https://de.wikipedia.org/w/api.php";
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const DELAY_MS = 150; // ~6-7 req/s, well below Wikipedia rate limits
// HINWEIS: Wikipedia erlaubt bei prop=extracts + explaintext=true nur 1 Titel
// pro Request (exlimit auto-clamped auf 1). Daher kein echtes Batching möglich.

const ALL = process.argv.includes("--all");
const REFRESH = process.argv.includes("--refresh");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Row {
  id: number;
  first_name: string;
  last_name: string;
  bio_url: string;
}

/** Wikipedia-Artikel-Titel aus Wikipedia-URL extrahieren */
function titleFromUrl(url: string): string | null {
  const m = url.match(/wikipedia\.org\/wiki\/(.+?)(?:#.*)?$/);
  if (!m) return null;
  return decodeURIComponent(m[1].replace(/_/g, " "));
}

/** Wikipedia API: Plain-Text-Volltext für 1 Titel */
async function fetchExtract(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "true",
    redirects: "1",
    titles: title,
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const res = await fetch(`${WP_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Wikipedia API HTTP ${res.status}`);
  const data = (await res.json()) as {
    query?: { pages?: { title: string; extract?: string; missing?: boolean }[] };
  };
  const page = data.query?.pages?.[0];
  if (!page || page.missing || !page.extract || page.extract.length < 100) return null;
  return page.extract;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const skipExisting = REFRESH ? "" : "AND (p.bio_full_text IS NULL OR length(p.bio_full_text) < 200)";

  const sql = ALL
    ? `SELECT p.id, p.first_name, p.last_name, p.bio_url
       FROM politicians p
       WHERE p.bio_url IS NOT NULL ${skipExisting}`
    : `SELECT DISTINCT p.id, p.first_name, p.last_name, p.bio_url
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE p.bio_url IS NOT NULL AND par.type = 'bundestag' ${skipExisting}`;

  const rows = db.prepare(sql).all() as Row[];
  console.log(`${rows.length} Politiker mit bio_url zu verarbeiten`);
  if (rows.length === 0) {
    db.close();
    return;
  }

  const update = db.prepare(
    "UPDATE politicians SET bio_full_text = ?, bio_full_text_fetched_at = ? WHERE id = ?"
  );

  let ok = 0,
    miss = 0,
    fail = 0;
  const start = Date.now();

  // Pro Request 1 Titel — Wikipedia limitiert exlimit bei Volltext auf 1.
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const title = titleFromUrl(r.bio_url);
    if (!title) {
      fail++;
      continue;
    }
    try {
      const extract = await fetchExtract(title);
      if (!extract) {
        miss++;
      } else {
        update.run(extract, new Date().toISOString(), r.id);
        ok++;
      }
    } catch (e: any) {
      fail++;
      if (fail < 5) console.error(`  ✗ ${r.first_name} ${r.last_name}: ${e.message?.slice(0, 80)}`);
    }

    if ((i + 1) % 25 === 0 || i === rows.length - 1) {
      const pct = (((i + 1) / rows.length) * 100).toFixed(0);
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`  [${i + 1}/${rows.length}] ${pct}% · ok=${ok} miss=${miss} fail=${fail} · ${elapsed}s`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Nicht gefunden / leer: ${miss}`);
  console.log(`  Fehler: ${fail}`);

  // Coverage check
  const cov = db
    .prepare(
      `SELECT
        SUM(CASE WHEN bio_full_text IS NOT NULL AND length(bio_full_text) > 200 THEN 1 ELSE 0 END) AS hat_volltext,
        COUNT(*) AS total
       FROM politicians p
       WHERE p.id IN (SELECT DISTINCT politician_id FROM mandates m
         JOIN parliament_periods pp ON m.parliament_period_id = pp.id
         JOIN parliaments par ON pp.parliament_id = par.id
         WHERE par.type = 'bundestag')`
    )
    .get() as { hat_volltext: number; total: number };
  console.log(`  Coverage Bundestag: ${cov.hat_volltext}/${cov.total}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
