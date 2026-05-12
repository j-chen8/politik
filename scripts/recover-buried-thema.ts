/**
 * Recovers `thema` from XML-embedded values in raw_llm_response for records
 * that ended up with thema="Sonstiges" due to XML-leak.
 */
import Database from "better-sqlite3";
import path from "path";
import { TOPIC_TAGS } from "../src/lib/drucksachen-prompts";

const ENUM = new Set<string>([...TOPIC_TAGS]);
const db = new Database(path.join(process.cwd(), "politik.db"));

const rows = db.prepare(`
  SELECT drucksache_nr, raw_llm_response, topic_drift_audit
  FROM drucksache_analyses
  WHERE analyze_error IS NULL AND thema='Sonstiges' AND raw_llm_response LIKE '%thema%'
`).all() as any[];

console.log(`📋 ${rows.length} Records mit verstecktem thema`);

const upd = db.prepare(`
  UPDATE drucksache_analyses
  SET thema=?, topic_drift_audit=?
  WHERE drucksache_nr=?
`);

for (const r of rows) {
  let j: any;
  try { j = JSON.parse(r.raw_llm_response); }
  catch { console.log(`  ✖ ${r.drucksache_nr}: parse fail`); continue; }

  // Suche `<parameter name="thema">VALUE` in irgendeinem string-Feld
  let themaArr: string[] | null = null;
  for (const [k, v] of Object.entries(j)) {
    if (typeof v !== "string") continue;
    const m = v.match(/<parameter\s+name="thema"\s*>\s*(\[[^\]]+\])/);
    if (m) {
      try { themaArr = JSON.parse(m[1]); break; } catch {}
    }
  }
  if (!themaArr) { console.log(`  · ${r.drucksache_nr}: thema-Marker da, aber Parse fail`); continue; }

  // Validate
  const accepted: string[] = []; const drift: string[] = [];
  for (const t of themaArr) {
    if (ENUM.has(t)) accepted.push(t); else drift.push(t);
  }
  if (accepted.length === 0) { console.log(`  · ${r.drucksache_nr}: kein Enum-Hit, drift=[${drift.join(",")}]`); continue; }

  // Bestehender drift_audit + neuer drift mergen
  let existingDrift: string[] = [];
  if (r.topic_drift_audit) {
    try { existingDrift = JSON.parse(r.topic_drift_audit); if (!Array.isArray(existingDrift)) existingDrift = []; } catch {}
  }
  const allDrift = [...new Set([...existingDrift, ...drift])];

  upd.run(
    accepted.slice(0, 3).join(", "),
    allDrift.length > 0 ? JSON.stringify(allDrift) : null,
    r.drucksache_nr,
  );
  console.log(`✓ ${r.drucksache_nr}: thema=[${accepted.join(",")}]${allDrift.length ? ` drift=[${allDrift.join(",")}]` : ""}`);
}
