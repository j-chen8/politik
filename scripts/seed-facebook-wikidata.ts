/**
 * Holt Facebook-Handles für MdBs aus Wikidata (Property P2013).
 *
 * Match-Logik identisch zu seed-photos-wikidata.ts.
 *
 * Run: npx tsx scripts/seed-facebook-wikidata.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";

const BUNDESTAG_TERM_QID = "Q124661964";
const BUNDESTAG_PARLIAMENT_ID_LOCAL = 5;

const DRY_RUN = process.argv.includes("--dry-run");

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTitle(name: string): string {
  name = name.replace(/[„""''‚'«»][^„""''‚'«»]*[""''‚'«»]/g, " ");
  return name
    .replace(/\b(Dr\.|Prof\.|Dipl\.|Mag\.|h\.c\.|jur\.|med\.|rer\.|nat\.|phil\.|MdB|MdL|MdEP)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url.slice(0, 100)}`);
  return res.json();
}

interface WdPerson {
  qid: string;
  label: string;
  facebook: string;
}

async function runSparql(query: string): Promise<WdPerson[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const data = await fetchJson(url);
  const people: WdPerson[] = [];
  for (const b of data.results.bindings) {
    people.push({
      qid: b.person.value.split("/").pop()!,
      label: b.personLabel?.value ?? "",
      facebook: b.facebook.value,
    });
  }
  return people;
}

async function fetchBundestagFacebook(): Promise<WdPerson[]> {
  const q1 = `
    SELECT ?person ?personLabel ?facebook WHERE {
      ?person p:P39 ?stmt .
      ?stmt ps:P39 wd:Q1939555 .
      ?stmt pq:P2937 wd:${BUNDESTAG_TERM_QID} .
      ?person wdt:P2013 ?facebook .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en" }
    }`;
  const q2 = `
    SELECT ?person ?personLabel ?facebook WHERE {
      ?person p:P39 ?stmt .
      ?stmt ps:P39 wd:Q1939555 .
      ?person wdt:P2013 ?facebook .
      FILTER NOT EXISTS { ?stmt pq:P582 ?endDate . FILTER(?endDate < NOW()) }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en" }
    }`;
  const r1 = await runSparql(q1);
  await new Promise((r) => setTimeout(r, 1500));
  const r2 = await runSparql(q2);
  const merged = new Map<string, WdPerson>();
  for (const p of [...r1, ...r2]) {
    if (!merged.has(p.qid)) merged.set(p.qid, p);
  }
  return Array.from(merged.values());
}

interface LocalPolitician {
  id: number;
  first_name: string;
  last_name: string;
  qid_wikidata: string | null;
}

function matchPoliticians(
  locals: LocalPolitician[],
  wd: WdPerson[]
): { matches: Map<number, WdPerson>; unmatched: LocalPolitician[] } {
  const byQid = new Map<string, WdPerson>();
  const byFullName = new Map<string, WdPerson[]>();
  const byLastWord = new Map<string, WdPerson[]>();

  for (const p of wd) {
    byQid.set(p.qid, p);
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
    // 1. Direkt-Match über lokal gespeicherte qid_wikidata (zuverlässigster Pfad)
    if (loc.qid_wikidata && byQid.has(loc.qid_wikidata) && !usedQids.has(loc.qid_wikidata)) {
      const hit = byQid.get(loc.qid_wikidata)!;
      matches.set(loc.id, hit);
      usedQids.add(hit.qid);
      continue;
    }

    const cleanFirst = normalize(stripTitle(loc.first_name));
    const cleanLast = normalize(stripTitle(loc.last_name));
    const fullKey = `${cleanFirst} ${cleanLast}`.replace(/\s+/g, " ").trim();

    let candidates: WdPerson[] = (byFullName.get(fullKey) ?? []).filter(
      (c) => !usedQids.has(c.qid)
    );

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
    } else {
      unmatched.push(loc);
    }
  }

  return { matches, unmatched };
}

function cleanFacebookHandle(raw: string): string {
  // Wikidata speichert manchmal volle URLs, manchmal nur den Handle
  let h = raw.trim();
  h = h.replace(/^https?:\/\/(www\.)?facebook\.com\//, "");
  h = h.replace(/\/$/, "");
  h = h.replace(/\?.*$/, "");
  return h;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("facebook_handle")) {
    if (DRY_RUN) {
      console.log("[DRY] würde Spalte facebook_handle anlegen");
    } else {
      db.exec("ALTER TABLE politicians ADD COLUMN facebook_handle TEXT");
      console.log("→ Spalte facebook_handle angelegt");
    }
  }

  const locals = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.qid_wikidata
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ?`
    )
    .all(BUNDESTAG_PARLIAMENT_ID_LOCAL) as LocalPolitician[];
  console.log(`${locals.length} lokale MdBs (21. Bundestag)`);

  console.log("→ SPARQL an Wikidata…");
  const wd = await fetchBundestagFacebook();
  console.log(`  ${wd.length} Wikidata-MdBs mit Facebook-ID gefunden`);

  const { matches, unmatched } = matchPoliticians(locals, wd);
  console.log(`\n→ Matching: ${matches.size}/${locals.length} gematcht (${unmatched.length} ohne Treffer)`);

  // Sample
  console.log("\n── Erste 10 Treffer (Sample) ──");
  let n = 0;
  for (const [localId, person] of matches) {
    if (n++ >= 10) break;
    const local = locals.find((l) => l.id === localId)!;
    console.log(`  ${local.first_name} ${local.last_name} → ${cleanFacebookHandle(person.facebook)}`);
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] kein DB-Update. Würde ${matches.size} facebook_handle setzen.`);
    db.close();
    return;
  }

  const update = db.prepare("UPDATE politicians SET facebook_handle = ? WHERE id = ?");
  let updated = 0;
  const tx = db.transaction(() => {
    for (const [localId, person] of matches) {
      update.run(cleanFacebookHandle(person.facebook), localId);
      updated++;
    }
  });
  tx();
  console.log(`\n→ ${updated} Politiker aktualisiert.`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
