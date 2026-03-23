/**
 * Seed script: fetches all politicians from all current German parliaments
 * (Bundestag, 16 Landtage, EU-Parlament) via abgeordnetenwatch.de API
 *
 * Run with: npx tsx scripts/seed.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const BASE_URL = "https://www.abgeordnetenwatch.de/api/v2";

// Current legislature period IDs (abgeordnetenwatch)
const CURRENT_PERIODS: { periodId: number; parliamentId: number; label: string }[] = [
  { periodId: 161, parliamentId: 5, label: "Bundestag 2025-2029" },
  { periodId: 155, parliamentId: 1, label: "EU-Parlament 2024-2029" },
  { periodId: 162, parliamentId: 3, label: "Hamburg 2025-2029" },
  { periodId: 158, parliamentId: 16, label: "Brandenburg 2024-2029" },
  { periodId: 157, parliamentId: 17, label: "Sachsen 2024-2029" },
  { periodId: 156, parliamentId: 15, label: "Thüringen 2024-2029" },
  { periodId: 150, parliamentId: 11, label: "Hessen 2024-2029" },
  { periodId: 149, parliamentId: 13, label: "Bayern 2023-2028" },
  { periodId: 146, parliamentId: 10, label: "Bremen 2023-2027" },
  { periodId: 143, parliamentId: 12, label: "Niedersachsen 2022-2027" },
  { periodId: 139, parliamentId: 4, label: "NRW 2022-2027" },
  { periodId: 138, parliamentId: 18, label: "Schleswig-Holstein 2022-2027" },
  { periodId: 137, parliamentId: 14, label: "Saarland 2022-2027" },
  { periodId: 134, parliamentId: 9, label: "Mecklenburg-Vorpommern 2021-2026" },
  { periodId: 133, parliamentId: 2, label: "Berlin 2021-2026" },
  { periodId: 131, parliamentId: 8, label: "Sachsen-Anhalt 2021-2026" },
  { periodId: 127, parliamentId: 7, label: "Rheinland-Pfalz 2021-2026" },
  { periodId: 126, parliamentId: 6, label: "Baden-Württemberg 2021-2026" },
];

interface ApiResponse<T> {
  meta: {
    abgeordnetenwatch_api: { version: string };
    status: string;
    result: { count: number; total: number; range_start: number; range_end: number };
  };
  data: T;
}

async function fetchApi<T>(path: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

async function fetchAllPages<T>(path: string, params: Record<string, string | number> = {}): Promise<T[]> {
  const all: T[] = [];
  let start = 0;
  const pageSize = 100;

  while (true) {
    const res = await fetchApi<T[]>(path, { ...params, range_start: start, range_end: start + pageSize - 1 });
    if (!res.data || res.data.length === 0) break;
    all.push(...res.data);
    if (all.length >= res.meta.result.total) break;
    start += pageSize;
  }
  return all;
}

// ── Main ──

async function main() {
  console.log("🏛️  Politik-Radar Seed Script");
  console.log("═".repeat(50));

  // Init DB
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    DROP TABLE IF EXISTS mandates;
    DROP TABLE IF EXISTS politicians;
    DROP TABLE IF EXISTS parties;
    DROP TABLE IF EXISTS parliament_periods;
    DROP TABLE IF EXISTS parliaments;

    CREATE TABLE parliaments (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      label_external TEXT,
      type TEXT NOT NULL DEFAULT 'landtag',
      api_url TEXT
    );

    CREATE TABLE parliament_periods (
      id INTEGER PRIMARY KEY,
      parliament_id INTEGER NOT NULL REFERENCES parliaments(id),
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'legislature',
      start_date TEXT,
      end_date TEXT,
      api_url TEXT
    );

    CREATE TABLE parties (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE
    );

    CREATE TABLE politicians (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      title TEXT,
      sex TEXT,
      year_of_birth INTEGER,
      education TEXT,
      occupation TEXT,
      residence TEXT,
      photo_url TEXT,
      party_id INTEGER REFERENCES parties(id),
      abgeordnetenwatch_url TEXT,
      api_url TEXT
    );

    CREATE TABLE mandates (
      id INTEGER PRIMARY KEY,
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      parliament_period_id INTEGER NOT NULL REFERENCES parliament_periods(id),
      label TEXT,
      type TEXT,
      start_date TEXT,
      end_date TEXT,
      constituency TEXT,
      list_position INTEGER,
      mandate_won TEXT,
      fraction TEXT,
      fraction_role TEXT,
      api_url TEXT
    );

    CREATE INDEX idx_mandates_politician ON mandates(politician_id);
    CREATE INDEX idx_mandates_period ON mandates(parliament_period_id);
    CREATE INDEX idx_politicians_party ON politicians(party_id);
    CREATE INDEX idx_politicians_name ON politicians(last_name, first_name);
  `);

  // Prepared statements
  const insertParliament = db.prepare(
    `INSERT OR IGNORE INTO parliaments (id, label, label_external, type, api_url)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertPeriod = db.prepare(
    `INSERT OR IGNORE INTO parliament_periods (id, parliament_id, label, type, start_date, end_date, api_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertParty = db.prepare(
    `INSERT OR IGNORE INTO parties (id, label) VALUES (?, ?)`
  );
  const insertPolitician = db.prepare(
    `INSERT OR IGNORE INTO politicians (id, first_name, last_name, title, sex, year_of_birth, education, occupation, residence, photo_url, party_id, abgeordnetenwatch_url, api_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertMandate = db.prepare(
    `INSERT OR IGNORE INTO mandates (id, politician_id, parliament_period_id, label, type, start_date, end_date, constituency, list_position, mandate_won, fraction, fraction_role, api_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Step 1: Fetch parliaments
  console.log("\n📋 Fetching parliaments...");
  const parliamentsRes = await fetchApi<any[]>("/parliaments", { range_end: 50 });
  const parliamentTypeMap: Record<number, string> = {
    5: "bundestag",
    1: "eu",
  };
  for (const p of parliamentsRes.data) {
    const type = parliamentTypeMap[p.id] || "landtag";
    insertParliament.run(p.id, p.label, p.label_long || p.label, type, p.api_url);
  }
  console.log(`   ✓ ${parliamentsRes.data.length} Parlamente`);

  // Step 2: Fetch all current periods and their mandates
  let totalPoliticians = 0;
  let totalMandates = 0;

  for (const period of CURRENT_PERIODS) {
    console.log(`\n🏛️  ${period.label} (Period ${period.periodId})`);

    // Fetch period details
    try {
      const periodRes = await fetchApi<any>(`/parliament-periods/${period.periodId}`);
      const pd = periodRes.data;
      insertPeriod.run(pd.id, period.parliamentId, pd.label, pd.type || "legislature", pd.start_date_period, pd.end_date_period, pd.api_url);
    } catch {
      // Insert basic info if API fails
      insertPeriod.run(period.periodId, period.parliamentId, period.label, "legislature", null, null, null);
    }

    // Fetch mandates for this period
    console.log("   Fetching mandates...");
    let mandates: any[];
    try {
      mandates = await fetchAllPages<any>("/candidacies-mandates", {
        parliament_period: period.periodId,
        type: "mandate",
      });
    } catch (e) {
      console.log(`   ⚠ Error fetching mandates: ${e}`);
      continue;
    }

    console.log(`   Found ${mandates.length} mandates`);

    let periodPoliticians = 0;

    const insertBatch = db.transaction((mandateList: any[]) => {
      for (const m of mandateList) {
        // Upsert politician
        if (m.politician) {
          const pol = m.politician;

          // Fetch full politician data if we have an API URL
          // We'll batch this separately to avoid too many requests

          // Insert party if exists
          // Party info is in the politician's full data, but mandate has fraction
          const fraction = m.fraction_membership?.[0]?.fraction;

          // Insert politician with basic info from mandate
          insertPolitician.run(
            pol.id,
            pol.label?.split(" ").slice(0, -1).join(" ") || pol.label || "",
            pol.label?.split(" ").slice(-1)[0] || "",
            null, // title
            null, // sex
            null, // year_of_birth
            null, // education
            null, // occupation
            null, // residence
            null, // photo_url
            null, // party_id (filled later)
            pol.abgeordnetenwatch_url || null,
            pol.api_url || null
          );
          periodPoliticians++;
        }

        // Insert mandate
        const constituency = m.electoral_data?.constituency?.label || null;
        const fraction = m.fraction_membership?.[0]?.fraction?.label || null;

        insertMandate.run(
          m.id,
          m.politician?.id || 0,
          period.periodId,
          m.label,
          m.type,
          m.start_date || null,
          m.end_date || null,
          constituency,
          m.electoral_data?.list_position || null,
          m.electoral_data?.mandate_won || null,
          fraction,
          null,
          m.api_url
        );
        totalMandates++;
      }
    });

    insertBatch(mandates);

    totalPoliticians += periodPoliticians;
    console.log(`   ✓ ${periodPoliticians} Politiker, ${mandates.length} Mandate`);
  }

  // Step 3: Enrich politician data with full details
  console.log("\n\n📊 Enriching politician data...");
  const allPoliticianIds = db
    .prepare("SELECT DISTINCT id, api_url FROM politicians WHERE api_url IS NOT NULL AND first_name = last_name")
    .all() as { id: number; api_url: string }[];

  // Also get all politicians that need enrichment (no party, no details)
  const needsEnrichment = db
    .prepare("SELECT id, api_url FROM politicians WHERE party_id IS NULL AND api_url IS NOT NULL")
    .all() as { id: number; api_url: string }[];

  console.log(`   ${needsEnrichment.length} Politiker brauchen Details...`);

  const updatePolitician = db.prepare(
    `UPDATE politicians SET
      first_name = ?, last_name = ?, title = ?, sex = ?,
      year_of_birth = ?, education = ?, occupation = ?,
      residence = ?, party_id = ?
     WHERE id = ?`
  );

  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 20;
  const DELAY_MS = 500;

  for (let i = 0; i < needsEnrichment.length; i += BATCH_SIZE) {
    const batch = needsEnrichment.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (p) => {
        try {
          const res = await fetch(p.api_url);
          if (!res.ok) return null;
          const data = await res.json();
          return { id: p.id, data: data.data };
        } catch {
          return null;
        }
      })
    );

    const updateBatch = db.transaction((items: typeof results) => {
      for (const item of items) {
        if (!item?.data) continue;
        const d = item.data;

        // Insert party
        if (d.party) {
          insertParty.run(d.party.id, d.party.label);
        }

        updatePolitician.run(
          d.first_name || "",
          d.last_name || "",
          d.field_title || null,
          d.sex || null,
          d.year_of_birth || null,
          d.education || null,
          d.occupation || null,
          d.residence || null,
          d.party?.id || null,
          item.id
        );
      }
    });

    updateBatch(results);

    const progress = Math.min(i + BATCH_SIZE, needsEnrichment.length);
    process.stdout.write(`\r   ${progress}/${needsEnrichment.length} enriched`);

    if (i + BATCH_SIZE < needsEnrichment.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  // Also update fraction as fallback party for those without party data
  db.exec(`
    UPDATE politicians SET party_id = (
      SELECT pa.id FROM parties pa
      WHERE pa.label = (
        SELECT m.fraction FROM mandates m WHERE m.politician_id = politicians.id AND m.fraction IS NOT NULL LIMIT 1
      )
    ) WHERE party_id IS NULL
  `);

  // Final stats
  const stats = {
    politicians: (db.prepare("SELECT COUNT(*) as c FROM politicians").get() as any).c,
    mandates: (db.prepare("SELECT COUNT(*) as c FROM mandates").get() as any).c,
    parties: (db.prepare("SELECT COUNT(*) as c FROM parties").get() as any).c,
    parliaments: (db.prepare("SELECT COUNT(*) as c FROM parliaments").get() as any).c,
    periods: (db.prepare("SELECT COUNT(*) as c FROM parliament_periods").get() as any).c,
  };

  console.log("\n\n" + "═".repeat(50));
  console.log("✅ Seed complete!");
  console.log(`   ${stats.politicians} Politiker`);
  console.log(`   ${stats.mandates} Mandate`);
  console.log(`   ${stats.parties} Parteien`);
  console.log(`   ${stats.parliaments} Parlamente`);
  console.log(`   ${stats.periods} Legislaturperioden`);
  console.log(`\n   Database: ${DB_PATH}`);

  // Show breakdown by parliament
  console.log("\n📊 Breakdown by parliament:");
  const breakdown = db
    .prepare(
      `SELECT par.label, par.type, COUNT(DISTINCT m.politician_id) as count
       FROM mandates m
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE m.type = 'mandate'
       GROUP BY par.id
       ORDER BY count DESC`
    )
    .all() as { label: string; type: string; count: number }[];

  for (const row of breakdown) {
    const typeEmoji = row.type === "bundestag" ? "🇩🇪" : row.type === "eu" ? "🇪🇺" : "🏛️";
    console.log(`   ${typeEmoji} ${row.label}: ${row.count} Politiker`);
  }

  db.close();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
