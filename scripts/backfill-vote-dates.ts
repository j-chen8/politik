/**
 * Backfill: poll_date für alle votes nachholen.
 *
 * Bug im seed-abgeordnetenwatch.ts: die /votes-API liefert nur ein reduziertes
 * poll-Objekt ohne field_poll_date. Wir müssen pro distinct poll_id einmal
 * /polls/{id} fetchen.
 */

import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
const BASE = "https://www.abgeordnetenwatch.de/api/v2";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const polls = db.prepare(`SELECT DISTINCT poll_id FROM votes WHERE poll_id IS NOT NULL AND poll_date IS NULL`).all() as { poll_id: number }[];
  console.log(`${polls.length} polls ohne Datum`);
  if (polls.length === 0) return;

  const update = db.prepare(`UPDATE votes SET poll_date = ? WHERE poll_id = ?`);
  let ok = 0, fail = 0;

  for (let i = 0; i < polls.length; i++) {
    const id = polls[i].poll_id;
    try {
      const res = await fetch(`${BASE}/polls/${id}`, { headers: { "User-Agent": "politik-radar/1.0" } });
      if (!res.ok) { fail++; continue; }
      const data = (await res.json()) as any;
      const date = data?.data?.field_poll_date ?? null;
      if (date) {
        update.run(date, id);
        ok++;
      } else {
        fail++;
      }
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r  [${i + 1}/${polls.length}] ok=${ok} fail=${fail}   `);
      }
      await sleep(150);
    } catch (e: any) {
      fail++;
    }
  }

  console.log(`\n\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Fehler:      ${fail}`);

  const newest = db.prepare(`SELECT MAX(poll_date) AS d FROM votes`).get() as { d: string };
  console.log(`  Neuestes Vote-Datum jetzt: ${newest.d}`);
  db.close();
}

main();
