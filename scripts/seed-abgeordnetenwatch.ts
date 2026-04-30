/**
 * Seed script: fetches votes, sidejobs, and committee memberships
 * from the Abgeordnetenwatch API and stores them locally in SQLite.
 *
 * This ensures all data displayed on the site is backed up locally.
 *
 * Run with: npx tsx scripts/seed-abgeordnetenwatch.ts
 * Options:  --all  (process all mandates, not just Bundestag)
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const BASE_URL = "https://www.abgeordnetenwatch.de/api/v2";
const DELAY_MS = 300;
const MAX_RETRIES = 3;

// ── API helpers ──

async function fetchApi(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.log(`  Rate limited, waiting 10s...`);
        await sleep(10000);
        continue;
      }
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (e: any) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables if not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL,
      politician_id INTEGER NOT NULL,
      poll_id INTEGER NOT NULL,
      poll_label TEXT,
      poll_url TEXT,
      poll_date TEXT,
      vote TEXT NOT NULL,
      reason_no_show TEXT,
      fraction_id INTEGER,
      fraction_label TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_votes_politician ON votes(politician_id);
    CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);

    CREATE TABLE IF NOT EXISTS sidejobs (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL,
      politician_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      income_level TEXT,
      income INTEGER,
      income_total INTEGER,
      interval TEXT,
      created INTEGER,
      organization TEXT,
      additional_information TEXT,
      category TEXT,
      data_change_date TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sidejobs_politician ON sidejobs(politician_id);

    CREATE TABLE IF NOT EXISTS committee_memberships (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL,
      politician_id INTEGER NOT NULL,
      committee_id INTEGER NOT NULL,
      committee_label TEXT NOT NULL,
      committee_role TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_committee_memberships_politician ON committee_memberships(politician_id);
  `);

  // Get mandates — default: only Bundestag (parliament type)
  const allMandates = process.argv.includes("--all");
  const mandates: { id: number; politician_id: number }[] = allMandates
    ? db.prepare("SELECT id, politician_id FROM mandates WHERE type = 'mandate'").all() as any[]
    : db.prepare(`
        SELECT m.id, m.politician_id FROM mandates m
        JOIN parliament_periods pp ON m.parliament_period_id = pp.id
        JOIN parliaments p ON pp.parliament_id = p.id
        WHERE m.type = 'mandate' AND p.type = 'bundestag'
      `).all() as any[];

  console.log(`\n=== Seed Abgeordnetenwatch Data ===`);
  console.log(`${mandates.length} Mandate (${allMandates ? "alle" : "nur Bundestag"})\n`);

  // Check what we already have
  const existingVotes = (db.prepare("SELECT COUNT(*) as c FROM votes").get() as any).c;
  const existingSidejobs = (db.prepare("SELECT COUNT(*) as c FROM sidejobs").get() as any).c;
  const existingCommittees = (db.prepare("SELECT COUNT(*) as c FROM committee_memberships").get() as any).c;
  console.log(`Bereits vorhanden: ${existingVotes} Votes, ${existingSidejobs} Sidejobs, ${existingCommittees} Ausschüsse\n`);

  // Prepared statements
  const insertVote = db.prepare(`
    INSERT OR IGNORE INTO votes (id, mandate_id, politician_id, poll_id, poll_label, poll_url, poll_date, vote, reason_no_show, fraction_id, fraction_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSidejob = db.prepare(`
    INSERT OR IGNORE INTO sidejobs (id, mandate_id, politician_id, label, income_level, income, income_total, interval, created, organization, additional_information, category, data_change_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertCommittee = db.prepare(`
    INSERT OR IGNORE INTO committee_memberships (id, mandate_id, politician_id, committee_id, committee_label, committee_role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let totalVotes = 0, totalSidejobs = 0, totalCommittees = 0;
  let errors = 0;

  for (let i = 0; i < mandates.length; i++) {
    const m = mandates[i];
    if (i % 20 === 0) {
      process.stdout.write(`\r  [${i + 1}/${mandates.length}] `);
    }

    try {
      // Fetch all three in parallel
      const [votesRes, sidejobsRes, committeesRes] = await Promise.all([
        fetchApi(`${BASE_URL}/votes?mandate=${m.id}&range_end=500`),
        fetchApi(`${BASE_URL}/sidejobs?mandates=${m.id}&range_end=100`),
        fetchApi(`${BASE_URL}/committee-memberships?candidacy_mandate=${m.id}&range_end=50`),
      ]);

      // Insert in a transaction for speed
      const insertAll = db.transaction(() => {
        for (const v of (votesRes.data || [])) {
          // Achtung: /votes liefert poll nur reduziert (kein field_poll_date).
          // Datum wird in scripts/backfill-vote-dates.ts pro poll_id nachgeholt.
          insertVote.run(
            v.id, m.id, m.politician_id,
            v.poll?.id ?? null, v.poll?.label ?? null, v.poll?.abgeordnetenwatch_url ?? null, null,
            v.vote, v.reason_no_show ?? null,
            v.fraction?.id ?? null, v.fraction?.label ?? null
          );
          totalVotes++;
        }

        for (const s of (sidejobsRes.data || [])) {
          // income_total ist in der API ein Objekt {date, value} bei manchen Sidejobs.
          // Better-sqlite3 wirft "Too few parameter values" wenn ein Objekt durchgereicht wird.
          const incomeTotal = (typeof s.income_total === "object" && s.income_total !== null)
            ? Number(s.income_total.value) || null
            : (s.income_total ?? null);
          insertSidejob.run(
            s.id, m.id, m.politician_id,
            s.label ?? "", s.income_level ?? null, s.income ?? null, incomeTotal,
            s.interval ?? null, s.created ?? null,
            s.sidejob_organization?.label ?? null,
            s.additional_information ?? null, s.category ?? null, s.data_change_date ?? null
          );
          totalSidejobs++;
        }

        for (const c of (committeesRes.data || [])) {
          insertCommittee.run(
            c.id, m.id, m.politician_id,
            c.committee?.id ?? 0, c.committee?.label ?? "Unbekannt", c.committee_role ?? null
          );
          totalCommittees++;
        }
      });
      insertAll();

      await sleep(DELAY_MS);
    } catch (e: any) {
      errors++;
      if (errors <= 5) console.log(`\n  Fehler bei Mandat ${m.id}: ${e.message}`);
    }
  }

  console.log(`\r  [${mandates.length}/${mandates.length}] fertig!`);
  console.log(`\n=== Ergebnis ===`);
  console.log(`  ${totalVotes} Votes`);
  console.log(`  ${totalSidejobs} Sidejobs`);
  console.log(`  ${totalCommittees} Ausschuss-Mitgliedschaften`);
  if (errors > 0) console.log(`  ${errors} Fehler`);
  console.log("");

  db.close();
}

main().catch(console.error);
