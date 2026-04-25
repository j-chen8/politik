/**
 * Holt für jeden Politiker mit qid_wikidata den Einleitungs-Absatz (extract)
 * der deutschen Wikipedia.
 *
 * Pipeline: qid_wikidata → wbgetentities (sitelinks) → article title →
 *           de.wikipedia REST summary
 *
 * Schreibt nach politicians.{bio_summary, bio_url, bio_source}.
 *
 * Run: npx tsx scripts/seed-bios.ts [--all] [--refresh]
 *      --all     : nicht nur Bundestag (default), sondern alle mit Mandat
 *      --refresh : auch Politiker mit existierender bio neu holen
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const WD_API = "https://www.wikidata.org/w/api.php";
const WP_REST = "https://de.wikipedia.org/api/rest_v1/page/summary";
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const WD_BATCH = 50;
const WP_DELAY_MS = 150; // ~6-7 req/s, well below rate limit

const ALL = process.argv.includes("--all");
const REFRESH = process.argv.includes("--refresh");

async function fetchJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.status === 429) {
        await sleep(5000);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(1500);
    }
  }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function ensureColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  for (const col of ["bio_summary", "bio_url", "bio_source"]) {
    if (!have.has(col)) {
      db.exec(`ALTER TABLE politicians ADD COLUMN ${col} TEXT`);
      console.log(`→ ${col} Spalte angelegt`);
    }
  }
}

// ── Step 1: QIDs → Wikipedia-Artikel-Title ──

async function fetchSitelinks(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < qids.length; i += WD_BATCH) {
    const batch = qids.slice(i, i + WD_BATCH);
    const url = `${WD_API}?action=wbgetentities&ids=${batch.join("|")}&props=sitelinks&sitefilter=dewiki&format=json`;
    try {
      const data = await fetchJson(url);
      for (const [qid, ent] of Object.entries<any>(data?.entities ?? {})) {
        const title = ent?.sitelinks?.dewiki?.title;
        if (title) out.set(qid, title);
      }
    } catch (e: any) {
      console.log(`\n  ✗ Batch ${i}: ${e.message}`);
    }
    process.stdout.write(`\r  [${Math.min(i + WD_BATCH, qids.length)}/${qids.length}] mit dewiki=${out.size}`);
    if (i + WD_BATCH < qids.length) await sleep(300);
  }
  process.stdout.write("\n");
  return out;
}

// ── Step 2: Title → Extract ──

async function fetchSummary(title: string): Promise<{ extract: string; url: string } | null> {
  const url = `${WP_REST}/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const data = await fetchJson(url);
  if (!data || !data.extract) return null;
  return {
    extract: data.extract,
    url: data.content_urls?.desktop?.page ?? `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

// ── Main ──

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureColumns(db);

  const where = ALL
    ? `WHERE p.qid_wikidata IS NOT NULL`
    : `WHERE p.qid_wikidata IS NOT NULL AND par.type = 'bundestag'`;
  const skipExisting = REFRESH ? "" : "AND p.bio_summary IS NULL";

  const rows = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.qid_wikidata
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       ${where} ${skipExisting}`
    )
    .all() as { id: number; first_name: string; last_name: string; qid_wikidata: string }[];

  console.log(`\n${rows.length} Politiker zu verarbeiten (${ALL ? "alle" : "nur Bundestag"}${REFRESH ? ", inkl. refresh" : ", nur ohne bio"})`);
  if (rows.length === 0) {
    console.log("Nichts zu tun.");
    db.close();
    return;
  }

  // QID → politician map (für die spätere Zuordnung)
  const byQid = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byQid.get(r.qid_wikidata) ?? [];
    list.push(r);
    byQid.set(r.qid_wikidata, list);
  }

  console.log(`\n→ Step 1/2: dewiki-Sitelinks holen…`);
  const titleMap = await fetchSitelinks(Array.from(byQid.keys()));
  console.log(`  ${titleMap.size}/${byQid.size} mit deutschem Wikipedia-Artikel`);

  console.log(`\n→ Step 2/2: Wikipedia-Extracts holen…`);
  const update = db.prepare(
    "UPDATE politicians SET bio_summary = ?, bio_url = ?, bio_source = 'wikipedia_de' WHERE id = ?"
  );

  let ok = 0, fail = 0, done = 0;
  const total = titleMap.size;

  for (const [qid, title] of titleMap) {
    done++;
    try {
      const result = await fetchSummary(title);
      if (!result) {
        fail++;
      } else {
        const tx = db.transaction(() => {
          for (const pol of byQid.get(qid) ?? []) {
            update.run(result.extract, result.url, pol.id);
          }
        });
        tx();
        ok++;
      }
    } catch (e: any) {
      fail++;
      console.log(`\n  ✗ ${title} (${qid}): ${e.message}`);
    }
    if (done % 25 === 0 || done === total) {
      process.stdout.write(`\r  [${done}/${total}] ok=${ok} fail=${fail}`);
    }
    await sleep(WP_DELAY_MS);
  }
  process.stdout.write("\n");

  console.log(`\n=== Fertig ===`);
  console.log(`  Bios geladen:    ${ok}`);
  console.log(`  Fehler/leer:     ${fail}`);
  console.log(`  Ohne Wikipedia:  ${byQid.size - titleMap.size}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
