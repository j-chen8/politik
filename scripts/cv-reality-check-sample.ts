/**
 * Reality-Check Sample-Selector für CV-Pipeline.
 * Zieht 10 deterministisch-zufällige Bundestag-MdBs und schreibt
 * cv_json + bio_full_text als JSON-Output für manuelle Review.
 *
 * Run: npx tsx scripts/cv-reality-check-sample.ts > cv-reality-check-sample.json
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const SEED = "post-stage4-2026-05-01";
const SAMPLE_SIZE = 10;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const db = new Database(DB_PATH, { readonly: true });

const rows = db
  .prepare(
    `SELECT DISTINCT p.id, p.first_name, p.last_name, p.bio_url, p.cv_json, p.bio_full_text
     FROM politicians p
     JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     JOIN parliaments par ON pp.parliament_id = par.id
     WHERE par.type = 'bundestag'
       AND p.cv_json IS NOT NULL
       AND p.bio_full_text IS NOT NULL`,
  )
  .all() as {
  id: number;
  first_name: string;
  last_name: string;
  bio_url: string | null;
  cv_json: string;
  bio_full_text: string;
}[];

const sorted = rows
  .map((r) => ({ ...r, score: hash(`${SEED}|${r.id}`) }))
  .sort((a, b) => a.score - b.score)
  .slice(0, SAMPLE_SIZE);

console.log(
  JSON.stringify(
    sorted.map((r) => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      bio_url: r.bio_url,
      cv_json: JSON.parse(r.cv_json),
      bio_full_text: r.bio_full_text,
    })),
    null,
    2,
  ),
);
