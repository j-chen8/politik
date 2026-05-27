/**
 * Holt für alle Polls (aus `votes`) die `field_topics` + `field_committees`
 * aus der abgeordnetenwatch-API (gratis, idempotent).
 *
 * Run: npx tsx scripts/fetch-poll-aw-topics.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const API_BASE = "https://www.abgeordnetenwatch.de/api/v2/polls";

interface AwPoll {
  data: {
    id: number;
    field_topics?: Array<{ label: string }>;
    field_committees?: Array<{ label: string }>;
  };
}

async function main() {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS poll_aw_topics (
      poll_id INTEGER PRIMARY KEY,
      topics_json TEXT NOT NULL DEFAULT '[]',
      committees_json TEXT NOT NULL DEFAULT '[]',
      fetched_at TEXT NOT NULL
    )
  `);

  const pollIds = (db.prepare(`
    SELECT DISTINCT poll_id FROM votes
    WHERE poll_id NOT IN (SELECT poll_id FROM poll_aw_topics)
    ORDER BY poll_id DESC
  `).all() as Array<{ poll_id: number }>).map((r) => r.poll_id);

  console.log(`=== Fetch aw field_topics für ${pollIds.length} Polls ===\n`);
  if (pollIds.length === 0) {
    console.log("Alle Polls haben bereits Topics — nichts zu tun.");
    db.close();
    return;
  }

  const insert = db.prepare(`
    INSERT INTO poll_aw_topics (poll_id, topics_json, committees_json, fetched_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(poll_id) DO UPDATE SET
      topics_json = excluded.topics_json,
      committees_json = excluded.committees_json,
      fetched_at = excluded.fetched_at
  `);

  let okCount = 0;
  let errCount = 0;
  // Exponential backoff bei 429 — aw drosselt teilweise hart.
  let throttleMs = 600;
  for (const pollId of pollIds) {
    let attempts = 0;
    let lastErr = "";
    while (attempts < 5) {
      attempts += 1;
      try {
        const res = await fetch(`${API_BASE}/${pollId}`);
        if (res.status === 429) {
          throttleMs = Math.min(throttleMs * 2, 8000);
          console.log(`  poll=${pollId}: 429, backoff ${throttleMs}ms (Versuch ${attempts}/5)`);
          await new Promise((r) => setTimeout(r, throttleMs));
          continue;
        }
        if (!res.ok) {
          lastErr = `HTTP ${res.status}`;
          break;
        }
        const json = (await res.json()) as AwPoll;
        const topics = (json.data.field_topics ?? []).map((t) => t.label).filter(Boolean);
        const committees = (json.data.field_committees ?? []).map((c) => c.label).filter(Boolean);
        insert.run(
          pollId,
          JSON.stringify(topics),
          JSON.stringify(committees),
          new Date().toISOString(),
        );
        okCount += 1;
        console.log(`  poll=${pollId}: [${topics.join(", ")}] · ${committees.join(", ")}`);
        // Sanftes Ramp-Down nach Erfolg.
        throttleMs = Math.max(600, Math.floor(throttleMs * 0.9));
        await new Promise((r) => setTimeout(r, throttleMs));
        lastErr = "";
        break;
      } catch (e) {
        lastErr = String(e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (lastErr) {
      console.log(`  poll=${pollId}: GIVEUP ${lastErr}`);
      errCount += 1;
    }
  }

  console.log(`\n=== Fertig: ${okCount} OK, ${errCount} Fehler ===`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
