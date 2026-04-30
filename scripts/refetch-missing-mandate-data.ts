/**
 * Holt votes/sidejobs/committees für Mandate, die im seed-abgeordnetenwatch.ts-Run
 * leer geblieben sind. Sequentielle Calls (kein Promise.all), längerer Delay.
 */

import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
const BASE = "https://www.abgeordnetenwatch.de/api/v2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchApi(url: string): Promise<any> {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) { await sleep(15000); continue; }
      if (!res.ok) throw new Error(`API ${res.status}`);
      return await res.json();
    } catch (e: any) {
      if (i === 4) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

async function main() {
  // Mandate, die weder Votes noch Sidejobs haben (also definitiv im ersten Run gescheitert)
  const targets = db.prepare(`
    SELECT m.id, m.politician_id, p.first_name || ' ' || p.last_name AS name
    FROM mandates m
    JOIN politicians p ON p.id = m.politician_id
    JOIN parliament_periods pp ON m.parliament_period_id=pp.id
    JOIN parliaments par ON pp.parliament_id=par.id
    WHERE m.type='mandate' AND par.type='bundestag'
      AND m.id NOT IN (SELECT DISTINCT mandate_id FROM votes)
      AND m.id NOT IN (SELECT DISTINCT mandate_id FROM sidejobs)
    ORDER BY m.id
  `).all() as { id: number; politician_id: number; name: string }[];

  console.log(`${targets.length} Mandate ohne votes UND sidejobs zu refetchen\n`);

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

  let okCount = 0, failCount = 0;
  let totalV = 0, totalS = 0, totalC = 0;

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    process.stdout.write(`\r  [${i + 1}/${targets.length}] ${t.name.padEnd(40)} `);
    try {
      // Sequentiell — kein Promise.all
      const v = await fetchApi(`${BASE}/votes?mandate=${t.id}&range_end=500`);
      await sleep(200);
      const s = await fetchApi(`${BASE}/sidejobs?mandates=${t.id}&range_end=100`);
      await sleep(200);
      const c = await fetchApi(`${BASE}/committee-memberships?candidacy_mandate=${t.id}&range_end=50`);

      for (const x of v.data ?? []) {
        try {
          insertVote.run(
            x.id ?? null, t.id, t.politician_id,
            x.poll?.id ?? null, x.poll?.label ?? null, x.poll?.abgeordnetenwatch_url ?? null, null,
            x.vote ?? null, x.reason_no_show ?? null,
            x.fraction?.id ?? null, x.fraction?.label ?? null,
          );
          totalV++;
        } catch (e: any) {
          if (totalV < 3) console.log(`\n  vote-insert err: ${e.message} | x.id=${x?.id} fraction=${typeof x?.fraction}`);
        }
      }
      for (const x of s.data ?? []) {
        try {
          // income_total kann ein Objekt {date, value} sein — value extrahieren
          const incomeTotal = (typeof x.income_total === "object" && x.income_total !== null)
            ? Number(x.income_total.value) || null
            : (x.income_total ?? null);
          insertSidejob.run(
            x.id ?? null, t.id, t.politician_id,
            x.label ?? "", x.income_level ?? null, x.income ?? null, incomeTotal,
            x.interval ?? null, x.created ?? null,
            x.sidejob_organization?.label ?? null,
            x.additional_information ?? null, x.category ?? null, x.data_change_date ?? null,
          );
          totalS++;
        } catch (e: any) {
          if (totalS < 3) console.log(`\n  sj-insert err: ${e.message} | x.id=${x?.id}`);
        }
      }
      for (const x of c.data ?? []) {
        try {
          insertCommittee.run(
            x.id ?? null, t.id, t.politician_id,
            x.committee?.id ?? 0, x.committee?.label ?? "Unbekannt", x.committee_role ?? null,
          );
          totalC++;
        } catch (e: any) {
          if (totalC < 3) console.log(`\n  cm-insert err: ${e.message} | x.id=${x?.id}`);
        }
      }

      okCount++;
      await sleep(400);
    } catch (e: any) {
      failCount++;
      console.log(`\n  ✗ ${t.name}: ${e.message?.slice(0, 80)}`);
    }
  }

  console.log(`\n\n=== Fertig ===`);
  console.log(`  OK:           ${okCount}`);
  console.log(`  Fehler:       ${failCount}`);
  console.log(`  Inserted: ${totalV} votes, ${totalS} sidejobs, ${totalC} committees`);
  db.close();
}

main();
