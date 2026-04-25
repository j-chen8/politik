/**
 * Holt für jeden Bundestag-MdB:
 *  - qid_wikidata via abgeordnetenwatch (gebatched)
 *  - Homepage (P856), Twitter-Handle (P2002), Instagram-Handle (P2003)
 *    aus Wikidata via SPARQL VALUES-Query
 *
 * Schreibt nach politicians.{qid_wikidata, homepage_url, twitter_handle, instagram_handle}.
 *
 * Run: npx tsx scripts/seed-homepages.ts [--all]
 *      --all = nicht nur Bundestag, sondern alle Politiker mit Mandat
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const AW_BASE = "https://www.abgeordnetenwatch.de/api/v2";
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const AW_BATCH = 50;
const AW_DELAY_MS = 250;
const SPARQL_BATCH = 200;

const ALL_PARLIAMENTS = process.argv.includes("--all");

// ── Helpers ──

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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2000);
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Schema Migration ──

function ensureColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  for (const col of ["qid_wikidata", "homepage_url", "twitter_handle", "instagram_handle"]) {
    if (!have.has(col)) {
      db.exec(`ALTER TABLE politicians ADD COLUMN ${col} TEXT`);
      console.log(`→ ${col} Spalte angelegt`);
    }
  }
}

// ── Step 1: QIDs via abgeordnetenwatch ──

async function fetchQids(ids: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  for (let i = 0; i < ids.length; i += AW_BATCH) {
    const batch = ids.slice(i, i + AW_BATCH);
    const url = `${AW_BASE}/politicians?id[in]=${encodeURIComponent(`[${batch.join(",")}]`)}&range_end=${batch.length}`;
    try {
      const data = await fetchJson(url);
      for (const p of data.data ?? []) {
        if (p.qid_wikidata) out.set(p.id, p.qid_wikidata);
      }
    } catch (e: any) {
      console.log(`\n  ✗ Batch ${i}/${ids.length}: ${e.message}`);
    }
    process.stdout.write(`\r  [${Math.min(i + AW_BATCH, ids.length)}/${ids.length}] qids=${out.size}`);
    if (i + AW_BATCH < ids.length) await sleep(AW_DELAY_MS);
  }
  process.stdout.write("\n");
  return out;
}

// ── Step 2: Homepage/Social via SPARQL ──

interface WdLinks {
  homepage?: string;
  twitter?: string;
  instagram?: string;
}

async function fetchWikidataLinks(qids: string[]): Promise<Map<string, WdLinks>> {
  const out = new Map<string, WdLinks>();
  for (let i = 0; i < qids.length; i += SPARQL_BATCH) {
    const batch = qids.slice(i, i + SPARQL_BATCH);
    const values = batch.map((q) => `wd:${q}`).join(" ");
    const query = `
      SELECT ?p ?website ?twitter ?instagram WHERE {
        VALUES ?p { ${values} }
        OPTIONAL { ?p wdt:P856 ?website }
        OPTIONAL { ?p wdt:P2002 ?twitter }
        OPTIONAL { ?p wdt:P2003 ?instagram }
      }`;
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
    try {
      const data = await fetchJson(url);
      for (const b of data.results.bindings) {
        const qid = b.p.value.split("/").pop()!;
        const cur = out.get(qid) ?? {};
        // Erste gefundene URL pro Person nehmen (manchmal mehrere)
        if (b.website && !cur.homepage) cur.homepage = b.website.value;
        if (b.twitter && !cur.twitter) cur.twitter = b.twitter.value;
        if (b.instagram && !cur.instagram) cur.instagram = b.instagram.value;
        out.set(qid, cur);
      }
    } catch (e: any) {
      console.log(`\n  ✗ SPARQL-Batch ${i}: ${e.message}`);
    }
    process.stdout.write(`\r  [${Math.min(i + SPARQL_BATCH, qids.length)}/${qids.length}] gefunden=${out.size}`);
    if (i + SPARQL_BATCH < qids.length) await sleep(500);
  }
  process.stdout.write("\n");
  return out;
}

// ── Main ──

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureColumns(db);

  // Hole IDs der Politiker mit Mandat (default: nur Bundestag)
  const localPoliticians = ALL_PARLIAMENTS
    ? (db
        .prepare(
          `SELECT DISTINCT p.id FROM politicians p
           JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'`
        )
        .all() as { id: number }[])
    : (db
        .prepare(
          `SELECT DISTINCT p.id FROM politicians p
           JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
           JOIN parliament_periods pp ON m.parliament_period_id = pp.id
           JOIN parliaments par ON pp.parliament_id = par.id
           WHERE par.type = 'bundestag'`
        )
        .all() as { id: number }[]);

  const ids = localPoliticians.map((p) => p.id);
  console.log(`\n${ids.length} Politiker (${ALL_PARLIAMENTS ? "alle" : "nur Bundestag"})`);

  console.log(`\n→ Step 1/2: QIDs aus abgeordnetenwatch holen…`);
  const qidMap = await fetchQids(ids);
  console.log(`  ${qidMap.size}/${ids.length} mit Wikidata-QID`);

  // QIDs in DB schreiben
  const updateQid = db.prepare("UPDATE politicians SET qid_wikidata = ? WHERE id = ?");
  const tx1 = db.transaction(() => {
    for (const [pid, qid] of qidMap) updateQid.run(qid, pid);
  });
  tx1();

  console.log(`\n→ Step 2/2: Homepage/Twitter/Instagram aus Wikidata…`);
  const qids = Array.from(new Set(qidMap.values()));
  const linkMap = await fetchWikidataLinks(qids);
  let withHomepage = 0, withTwitter = 0, withInstagram = 0;
  for (const v of linkMap.values()) {
    if (v.homepage) withHomepage++;
    if (v.twitter) withTwitter++;
    if (v.instagram) withInstagram++;
  }
  console.log(`  Homepage: ${withHomepage}, Twitter: ${withTwitter}, Instagram: ${withInstagram}`);

  // Links in DB schreiben
  const updateLinks = db.prepare(
    "UPDATE politicians SET homepage_url = ?, twitter_handle = ?, instagram_handle = ? WHERE id = ?"
  );
  let updated = 0;
  const tx2 = db.transaction(() => {
    for (const [pid, qid] of qidMap) {
      const links = linkMap.get(qid);
      if (!links) continue;
      updateLinks.run(links.homepage ?? null, links.twitter ?? null, links.instagram ?? null, pid);
      if (links.homepage || links.twitter || links.instagram) updated++;
    }
  });
  tx2();

  console.log(`\n=== Fertig ===`);
  console.log(`  QIDs gespeichert: ${qidMap.size}`);
  console.log(`  Politiker mit min. einem Link: ${updated}`);
  console.log(`  Homepages: ${withHomepage}`);
  console.log(`  Twitter:   ${withTwitter}`);
  console.log(`  Instagram: ${withInstagram}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
