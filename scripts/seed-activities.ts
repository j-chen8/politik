/**
 * Seed script: fetches all Bundestag activities from DIP API
 * and links them to politicians in the local database.
 *
 * Splits by month to avoid the 10k start offset limit.
 *
 * Run with: npx tsx scripts/seed-activities.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DIP_API_KEY = "SbGXhWA.3cpnNdb8rkht7iWpvSgTP8XIG88LoCrGd4";
const SEARCH_BASE = "https://search.dip.bundestag.de/search-api/v1/default/search";
const ROWS_PER_REQUEST = 200;
const DELAY_MS = 250;
const MAX_RETRIES = 3;

interface DipActivity {
  id: string;
  aktivitaetsart: string;
  typ: string;
  wahlperiode: number;
  titel: string;
  datum: string;
  basisdatum: string;
  dokumentart?: string;
  vorgangstyp?: string;
  vorgangsbezug?: {
    vorgangsposition: string;
    vorgangstyp: string;
    titel: string;
    id: string;
  }[];
  fundstelle?: {
    pdf_url?: string;
    dokumentnummer?: string;
    datum?: string;
    dokumentart?: string;
    drucksachetyp?: string;
    herausgeber?: string;
    urheber?: string[];
  };
}

async function fetchActivities(start: number, rows: number, dateFrom?: string, dateTo?: string): Promise<{ documents: DipActivity[]; numFound: number }> {
  const url = new URL(SEARCH_BASE);
  url.searchParams.set("apikey", DIP_API_KEY);
  url.searchParams.set("f.typ", "Aktivität");
  url.searchParams.set("f.wahlperiode", "21");
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("start", String(start));
  url.searchParams.set("sort", "basisdatum_ab");
  if (dateFrom) url.searchParams.set("f.datum.start", dateFrom);
  if (dateTo) url.searchParams.set("f.datum.end", dateTo);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url.toString(), {
      headers: {
        Origin: "https://dip.bundestag.de",
        Referer: "https://dip.bundestag.de/",
      },
    });

    if (res.ok) {
      const data = await res.json();
      return { documents: data.documents || [], numFound: data.numFound };
    }

    if (res.status === 400 && start >= 10000) {
      // Hit the start offset limit - return empty
      return { documents: [], numFound: 0 };
    }

    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  throw new Error(`DIP API failed after ${MAX_RETRIES} retries`);
}

function parseDipTitle(titel: string): { firstName: string; lastName: string } {
  const name = titel.split(",")[0].trim();
  const cleaned = name
    .replace(/^(Prof\.\s*)?Dr\.\s*/i, "")
    .replace(/^Freiherr\s+/i, "")
    .replace(/^Freifrau\s+/i, "")
    .trim();

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return { firstName: "", lastName: parts[0] || "" };

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

// Generate month ranges from Bundestag start to now
function getMonthRanges(): string[] {
  const ranges: string[] = [];
  const start = new Date(2025, 2, 1); // March 2025
  const now = new Date();

  let current = new Date(start);
  while (current <= now) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const from = firstDay.toISOString().split("T")[0];
    const to = lastDay.toISOString().split("T")[0];
    ranges.push(`${from};${to}`);

    current = new Date(year, month + 1, 1);
  }
  return ranges;
}

async function main() {
  console.log("🏛️  DIP Aktivitäten Seed Script");
  console.log("═".repeat(50));

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      politician_id INTEGER REFERENCES politicians(id),
      aktivitaetsart TEXT NOT NULL,
      typ TEXT,
      wahlperiode INTEGER,
      titel TEXT NOT NULL,
      thema TEXT,
      datum TEXT,
      dokumentart TEXT,
      vorgangstyp TEXT,
      drucksache_nr TEXT,
      drucksache_typ TEXT,
      pdf_url TEXT,
      herausgeber TEXT,
      urheber TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_activities_politician ON activities(politician_id);
    CREATE INDEX IF NOT EXISTS idx_activities_datum ON activities(datum);
    CREATE INDEX IF NOT EXISTS idx_activities_art ON activities(aktivitaetsart);
  `);

  db.exec("DELETE FROM activities");

  // Build politician name index
  console.log("\n📋 Building politician name index...");
  const allPoliticians = db
    .prepare(
      `SELECT p.id, p.first_name, p.last_name, p.title as field_title, pa.label as party
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id`
    )
    .all() as { id: number; first_name: string; last_name: string; field_title: string | null; party: string | null }[];

  const byLastName = new Map<string, typeof allPoliticians>();
  for (const p of allPoliticians) {
    const key = p.last_name.toLowerCase();
    if (!byLastName.has(key)) byLastName.set(key, []);
    byLastName.get(key)!.push(p);
  }
  console.log(`   ${allPoliticians.length} Politiker indexiert`);

  function matchPolitician(titel: string): number | null {
    const parsed = parseDipTitle(titel);
    if (!parsed.lastName) return null;

    const candidates = byLastName.get(parsed.lastName.toLowerCase());
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0].id;

    if (parsed.firstName) {
      const fnLower = parsed.firstName.toLowerCase();
      const match = candidates.find((c) => {
        const cfn = c.first_name.toLowerCase();
        return cfn === fnLower || cfn.startsWith(fnLower) || fnLower.startsWith(cfn);
      });
      if (match) return match.id;
    }

    // Try party from title
    const titleParts = titel.split(",").map((s) => s.trim());
    if (titleParts.length >= 3) {
      const party = titleParts[titleParts.length - 1];
      const partyMatch = candidates.find((c) => c.party && c.party.includes(party));
      if (partyMatch) return partyMatch.id;
    }

    return candidates[0].id;
  }

  const insertActivity = db.prepare(
    `INSERT OR IGNORE INTO activities (id, politician_id, aktivitaetsart, typ, wahlperiode, titel, thema, datum, dokumentart, vorgangstyp, drucksache_nr, drucksache_typ, pdf_url, herausgeber, urheber)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batchInsert = db.transaction((activities: DipActivity[]) => {
    let batchMatched = 0;
    for (const a of activities) {
      const politicianId = matchPolitician(a.titel);
      if (politicianId) batchMatched++;

      const thema = a.vorgangsbezug?.[0]?.titel || null;
      const f = a.fundstelle;

      insertActivity.run(
        a.id, politicianId, a.aktivitaetsart, a.typ, a.wahlperiode,
        a.titel, thema, a.datum, f?.dokumentart || a.dokumentart || null,
        a.vorgangstyp || null, f?.dokumentnummer || null,
        f?.drucksachetyp || null, f?.pdf_url || null,
        f?.herausgeber || null, f?.urheber?.join(", ") || null
      );
    }
    return batchMatched;
  });

  // Fetch by month to stay under 10k offset limit
  const monthRanges = getMonthRanges();
  console.log(`\n📥 Fetching activities by month (${monthRanges.length} months)...`);

  let totalFetched = 0;
  let totalMatched = 0;

  for (const range of monthRanges) {
    const [from] = range.split(";");
    const monthLabel = from.substring(0, 7);
    process.stdout.write(`\n   📅 ${monthLabel}: `);

    // First get count for this month
    const [fromDate, toDate] = range.split(";");
    const probe = await fetchActivities(0, 1, fromDate, toDate);
    const monthTotal = probe.numFound;
    process.stdout.write(`${monthTotal} Aktivitäten `);

    if (monthTotal === 0) {
      console.log("(skip)");
      continue;
    }

    let monthFetched = 0;
    let monthMatched = 0;

    while (monthFetched < monthTotal && monthFetched < 10000) {
      const batch = await fetchActivities(monthFetched, ROWS_PER_REQUEST, fromDate, toDate);
      if (!batch.documents || batch.documents.length === 0) break;

      const m = batchInsert(batch.documents);
      monthMatched += m;
      monthFetched += batch.documents.length;

      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    totalFetched += monthFetched;
    totalMatched += monthMatched;
    process.stdout.write(`→ ${monthFetched} geholt, ${monthMatched} zugeordnet`);
  }

  // Final stats
  const stats = {
    total: (db.prepare("SELECT COUNT(*) as c FROM activities").get() as { c: number }).c,
    matched: (db.prepare("SELECT COUNT(*) as c FROM activities WHERE politician_id IS NOT NULL").get() as { c: number }).c,
    unmatched: (db.prepare("SELECT COUNT(*) as c FROM activities WHERE politician_id IS NULL").get() as { c: number }).c,
  };

  const topByArt = db
    .prepare(
      `SELECT aktivitaetsart, COUNT(*) as count FROM activities GROUP BY aktivitaetsart ORDER BY count DESC LIMIT 10`
    )
    .all() as { aktivitaetsart: string; count: number }[];

  const topPoliticians = db
    .prepare(
      `SELECT p.first_name, p.last_name, pa.label as party, COUNT(a.id) as count
       FROM activities a
       JOIN politicians p ON a.politician_id = p.id
       LEFT JOIN parties pa ON p.party_id = pa.id
       GROUP BY a.politician_id ORDER BY count DESC LIMIT 15`
    )
    .all() as { first_name: string; last_name: string; party: string | null; count: number }[];

  console.log("\n\n" + "═".repeat(50));
  console.log("✅ Aktivitäten-Seed complete!");
  console.log(`   ${stats.total.toLocaleString("de-DE")} Aktivitäten gespeichert`);
  console.log(`   ${stats.matched.toLocaleString("de-DE")} zugeordnet (${((stats.matched / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ${stats.unmatched.toLocaleString("de-DE")} nicht zugeordnet`);

  console.log("\n📊 Nach Aktivitätsart:");
  for (const row of topByArt) {
    console.log(`   ${row.aktivitaetsart}: ${row.count.toLocaleString("de-DE")}`);
  }

  console.log("\n🏆 Top 15 aktivste Politiker:");
  for (const row of topPoliticians) {
    console.log(`   ${row.first_name} ${row.last_name} (${row.party || "?"}): ${row.count}`);
  }

  db.close();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
