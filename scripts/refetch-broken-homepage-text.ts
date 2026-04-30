/**
 * Re-Fetch von kaputten cv_homepage_text-Einträgen (identifiziert durch
 * scripts/check-rohtext-quality.ts). Nutzt den verbesserten Cleaner aus
 * scripts/_lib/html-clean.ts.
 *
 * Run: npx tsx scripts/refetch-broken-homepage-text.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { cleanBioHtml } from "./_lib/html-clean";

const DB_PATH = path.join(process.cwd(), "politik.db");
const UA = "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/120";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, "Accept-Language": "de-DE,de;q=0.9,en;q=0.5" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Kandidaten finden: alle cv_homepage_text die als verdächtig gelten
  // (gleiche Heuristiken wie check-rohtext-quality.ts, integriert über cleanBioHtml)
  const rows = db
    .prepare(
      `SELECT p.id, p.first_name, p.last_name, p.cv_homepage_url, p.cv_homepage_text
       FROM politicians p
       WHERE p.cv_homepage_url IS NOT NULL AND p.cv_homepage_text IS NOT NULL`
    )
    .all() as { id: number; first_name: string; last_name: string; cv_homepage_url: string; cv_homepage_text: string }[];

  // Re-classify mit unserem neuen Cleaner — wenn der gespeicherte Text suspicious wäre,
  // ist er es vermutlich noch immer. Aber wir wollen ja nur die schon-bekannten kaputten.
  // Pragmatisch: Liste der 20 IDs aus dem letzten Quality-Check.
  const BROKEN_IDS = new Set([
    29084, 73300, 78958, 79226, 79237, 108585, 108605, 110038, 110102, 118790,
    130301, 145876, 145877, 175503, 175831, 175852, 175862, 175894, 182839, 182848,
  ]);
  const candidates = rows.filter((r) => BROKEN_IDS.has(r.id));
  console.log(`${candidates.length} kaputte cv_homepage_text zum Re-Fetch`);

  const update = db.prepare(
    "UPDATE politicians SET cv_homepage_text = ? WHERE id = ?"
  );
  const setNull = db.prepare(
    "UPDATE politicians SET cv_homepage_text = NULL WHERE id = ?"
  );

  let fixed = 0,
    stillBroken = 0,
    fetchFail = 0;

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const html = await fetchPage(c.cv_homepage_url);
    if (!html) {
      console.log(`  ✗ ${c.first_name} ${c.last_name}: Fetch fehlgeschlagen — text → NULL`);
      setNull.run(c.id);
      fetchFail++;
      continue;
    }
    const cleaned = cleanBioHtml(html);
    const before = c.cv_homepage_text.length;
    const after = cleaned.text.length;

    if (cleaned.suspicious) {
      console.log(`  ⚠ ${c.first_name} ${c.last_name}: weiter kaputt (${cleaned.reason}) — text → NULL`);
      setNull.run(c.id);
      stillBroken++;
    } else {
      update.run(cleaned.text, c.id);
      console.log(`  ✓ ${c.first_name} ${c.last_name}: ${before} → ${after} chars`);
      fixed++;
    }
    await sleep(800);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  ✓ Repariert (Cleaner verbessert): ${fixed}`);
  console.log(`  ⚠ Weiter kaputt → NULL gesetzt:    ${stillBroken}`);
  console.log(`  ✗ Fetch fehlgeschlagen → NULL:    ${fetchFail}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
