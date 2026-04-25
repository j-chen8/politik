/**
 * Holt Politiker-Fotos aus Wikidata/Wikimedia Commons.
 *
 * Stufe 1: 21. Bundestag (Q124661964). Lizenz auf Commons ist CC-BY-SA / CC0
 * — wir speichern Attribution mit ab.
 *
 * Run: npx tsx scripts/seed-photos-wikidata.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const THUMB_WIDTH = 400;
const CONCURRENCY = 1;          // Wikimedia Commons rate-limited stark
const BATCH_DELAY_MS = 350;     // ~3 req/s
const RETRY_429_DELAY_MS = 8000;

// Welcher Bundestag/Welche Wahlperiode? Q124661964 = 21. Deutscher Bundestag.
const BUNDESTAG_TERM_QID = "Q124661964";
const BUNDESTAG_PARLIAMENT_ID_LOCAL = 5; // par.id in unserer DB

const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ──

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")          // Akzente weg
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")            // Smart-Quotes
    .replace(/[-‐‑‒–—]/g, " ")               // alle Bindestriche → space
    .replace(/[^a-z0-9 ]/g, "")              // Rest Sonderzeichen weg
    .replace(/\s+/g, " ")
    .trim();
}

function stripTitle(name: string): string {
  // Spitznamen in Anführungszeichen: Michael „Moses" Arndt → Michael Arndt
  name = name.replace(/[„""''‚'«»][^„""''‚'«»]*[""''‚'«»]/g, " ");
  return name
    .replace(/\b(Dr\.|Prof\.|Dipl\.|Mag\.|h\.c\.|jur\.|med\.|rer\.|nat\.|phil\.|MdB|MdL|MdEP)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url.slice(0, 100)}`);
  return res.json();
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Wikidata-Query ──

interface WdPerson {
  qid: string;
  label: string;
  firstName?: string;
  lastName?: string;
  imageUrl: string;
  imageFilename: string;
  party?: string;
}

async function runSparql(query: string): Promise<WdPerson[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const data = await fetchJson(url);
  const people: WdPerson[] = [];
  for (const b of data.results.bindings) {
    const imageUrl: string = b.image.value;
    const filename = decodeURIComponent(imageUrl.split("/").pop() || "");
    people.push({
      qid: b.person.value.split("/").pop()!,
      label: b.personLabel?.value ?? "",
      firstName: b.firstName?.value,
      lastName: b.lastName?.value,
      imageUrl,
      imageFilename: filename,
      party: b.partyLabel?.value,
    });
  }
  return people;
}

async function fetchBundestagPhotos(): Promise<WdPerson[]> {
  // Query 1: explizit als 21. Bundestag getaggt
  const q1 = `
    SELECT ?person ?personLabel ?firstName ?lastName ?image ?partyLabel WHERE {
      ?person p:P39 ?stmt .
      ?stmt ps:P39 wd:Q1939555 .
      ?stmt pq:P2937 wd:${BUNDESTAG_TERM_QID} .
      ?person wdt:P18 ?image .
      OPTIONAL { ?person wdt:P735 ?fn . ?fn rdfs:label ?firstName . FILTER(LANG(?firstName) = "de") }
      OPTIONAL { ?person wdt:P734 ?ln . ?ln rdfs:label ?lastName . FILTER(LANG(?lastName) = "de") }
      OPTIONAL { ?person wdt:P102 ?party . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en" }
    }`;
  // Query 2: aktives Mandat (P39=Q1939555 ohne end date P582 ODER end date in Zukunft)
  const q2 = `
    SELECT ?person ?personLabel ?firstName ?lastName ?image ?partyLabel WHERE {
      ?person p:P39 ?stmt .
      ?stmt ps:P39 wd:Q1939555 .
      ?person wdt:P18 ?image .
      FILTER NOT EXISTS { ?stmt pq:P582 ?endDate . FILTER(?endDate < NOW()) }
      OPTIONAL { ?person wdt:P735 ?fn . ?fn rdfs:label ?firstName . FILTER(LANG(?firstName) = "de") }
      OPTIONAL { ?person wdt:P734 ?ln . ?ln rdfs:label ?lastName . FILTER(LANG(?lastName) = "de") }
      OPTIONAL { ?person wdt:P102 ?party . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en" }
    }`;

  const [r1, r2] = await Promise.all([runSparql(q1), runSparql(q2)]);
  const merged = new Map<string, WdPerson>();
  for (const p of [...r1, ...r2]) {
    if (!merged.has(p.qid)) merged.set(p.qid, p);
  }
  return Array.from(merged.values());
}

// ── Matching ──

interface LocalPolitician {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  party_label: string | null;
}

function matchPoliticians(
  locals: LocalPolitician[],
  wd: WdPerson[]
): { matches: Map<number, WdPerson>; unmatched: LocalPolitician[] } {
  // Wikidata: index by full normalized label, plus fallback by last "word" of label
  const byFullName = new Map<string, WdPerson[]>();
  const byLastWord = new Map<string, WdPerson[]>();

  for (const p of wd) {
    const labelKey = normalize(stripTitle(p.label));
    if (!labelKey) continue;
    (byFullName.get(labelKey) ?? byFullName.set(labelKey, []).get(labelKey)!).push(p);
    const lastWord = labelKey.split(" ").slice(-1)[0];
    (byLastWord.get(lastWord) ?? byLastWord.set(lastWord, []).get(lastWord)!).push(p);
  }

  const matches = new Map<number, WdPerson>();
  const unmatched: LocalPolitician[] = [];
  const usedQids = new Set<string>();

  for (const loc of locals) {
    const cleanFirst = normalize(stripTitle(loc.first_name));
    const cleanLast = normalize(stripTitle(loc.last_name));
    const fullKey = `${cleanFirst} ${cleanLast}`.replace(/\s+/g, " ").trim();

    let candidates: WdPerson[] = [];

    // 1. Exakter Voll-Name
    candidates = (byFullName.get(fullKey) ?? []).filter((c) => !usedQids.has(c.qid));

    // 2. Letztes Wort von DB-lastname matched letztes Wort von Wikidata-Label, plus Vornamen-Prefix
    if (candidates.length === 0) {
      const lastWordOfLast = cleanLast.split(" ").slice(-1)[0];
      const firstWordOfFirst = cleanFirst.split(" ")[0];
      candidates = (byLastWord.get(lastWordOfLast) ?? []).filter((c) => {
        if (usedQids.has(c.qid)) return false;
        const labelNorm = normalize(stripTitle(c.label));
        return labelNorm.startsWith(firstWordOfFirst + " ") || labelNorm === firstWordOfFirst;
      });
    }

    if (candidates.length >= 1) {
      matches.set(loc.id, candidates[0]);
      usedQids.add(candidates[0].qid);
      if (DRY_RUN && candidates.length > 1) {
        console.log(`  ⚠️  ${loc.first_name} ${loc.last_name}: ${candidates.length} Treffer, nehme ${candidates[0].qid} (${candidates[0].label})`);
      }
    } else {
      unmatched.push(loc);
    }
  }

  return { matches, unmatched };
}

// ── Download mit Concurrency-Limit ──

async function downloadOne(localId: number, person: WdPerson): Promise<boolean> {
  const target = path.join(PHOTOS_DIR, `${localId}.jpg`);
  const url = `${person.imageUrl}?width=${THUMB_WIDTH}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const buf = await fetchBuffer(url);
      fs.writeFileSync(target, buf);
      return true;
    } catch (e: any) {
      if (e.message?.includes("429") && attempt === 0) {
        await sleep(RETRY_429_DELAY_MS);
        continue;
      }
      console.log(`\n  ✗ ${person.label} (${person.qid}): ${e.message}`);
      return false;
    }
  }
  return false;
}

async function downloadAll(
  jobs: { localId: number; person: WdPerson }[]
): Promise<{ ok: number; fail: number; skipped: number }> {
  let ok = 0, fail = 0, skipped = 0, done = 0;
  for (const { localId, person } of jobs) {
    done++;
    const target = path.join(PHOTOS_DIR, `${localId}.jpg`);
    if (fs.existsSync(target) && fs.statSync(target).size > 1000) {
      skipped++;
      process.stdout.write(`\r  [${done}/${jobs.length}] ok=${ok} fail=${fail} skip=${skipped}`);
      continue;
    }
    const success = await downloadOne(localId, person);
    if (success) ok++; else fail++;
    process.stdout.write(`\r  [${done}/${jobs.length}] ok=${ok} fail=${fail} skip=${skipped}`);
    await sleep(BATCH_DELAY_MS);
  }
  process.stdout.write("\n");
  return { ok, fail, skipped };
}

// ── Main ──

async function main() {
  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Schema-Migration: Spalten ergänzen falls fehlen
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("photo_source")) {
    db.exec("ALTER TABLE politicians ADD COLUMN photo_source TEXT");
    console.log("→ photo_source Spalte angelegt");
  }
  if (!colNames.has("photo_attribution")) {
    db.exec("ALTER TABLE politicians ADD COLUMN photo_attribution TEXT");
    console.log("→ photo_attribution Spalte angelegt");
  }

  // Lokale MdBs des 21. Bundestags
  const locals = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.title, pa.label AS party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ?`
    )
    .all(BUNDESTAG_PARLIAMENT_ID_LOCAL) as LocalPolitician[];
  console.log(`\n${locals.length} lokale MdBs (21. Bundestag)`);

  console.log("→ SPARQL-Query an Wikidata…");
  const wd = await fetchBundestagPhotos();
  console.log(`  ${wd.length} Wikidata-MdBs mit Foto gefunden`);

  const { matches, unmatched } = matchPoliticians(locals, wd);
  console.log(`\n→ Matching: ${matches.size}/${locals.length} gematcht (${unmatched.length} ohne Wikidata-Treffer)`);

  if (DRY_RUN) {
    console.log("\n── Erste 20 Unmatched ──");
    for (const u of unmatched.slice(0, 20)) {
      console.log(`  ${u.first_name} ${u.last_name} (${u.party_label ?? "?"})`);
    }
    console.log("\n[DRY RUN] keine Downloads, kein DB-Update.");
    db.close();
    return;
  }

  // Download
  console.log(`\n→ Download von ${matches.size} Bildern (${THUMB_WIDTH}px Thumbnail)…`);
  const jobs = Array.from(matches, ([localId, person]) => ({ localId, person }));
  const { ok, fail, skipped } = await downloadAll(jobs);
  console.log(`  ${ok} neu geladen, ${skipped} übersprungen (existiert), ${fail} fehlgeschlagen`);

  // DB-Update
  console.log("\n→ DB-Update…");
  const update = db.prepare(
    `UPDATE politicians SET photo_url = ?, photo_source = 'wikimedia_commons', photo_attribution = ? WHERE id = ?`
  );
  let updated = 0;
  const tx = db.transaction(() => {
    for (const { localId, person } of jobs) {
      const target = path.join(PHOTOS_DIR, `${localId}.jpg`);
      if (!fs.existsSync(target)) continue;
      const attribution = `Wikimedia Commons: ${person.imageFilename}`;
      update.run(`/photos/${localId}.jpg`, attribution, localId);
      updated++;
    }
  });
  tx();
  console.log(`  ${updated} Politiker aktualisiert`);

  // Summary
  console.log("\n=== Fertig ===");
  console.log(`  ${ok} Bilder geladen`);
  console.log(`  ${unmatched.length} MdBs ohne Wikidata-Match (Fallback nötig)`);
  console.log(`  → /public/photos/<id>.jpg`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
