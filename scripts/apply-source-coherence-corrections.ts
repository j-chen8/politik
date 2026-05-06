/**
 * Wendet vorbereitete Korrekturen aus data/source-coherence-corrections.jsonl
 * auf cv_json bzw. cv_homepage_json an. Audit-Trail in cv_repair_log.
 *
 * Default = Dry-Run. Nur HIGH-Confidence-Korrekturen mit explizitem
 * target ("cv_json" / "cv_homepage_json") werden angewandt.
 * NEEDS_RESEARCH-Einträge werden übersprungen mit Hinweis.
 *
 * Run:
 *   npx tsx scripts/apply-source-coherence-corrections.ts             # Dry-Run
 *   npx tsx scripts/apply-source-coherence-corrections.ts --apply     # tatsächlich
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const CORRECTIONS = path.join(process.cwd(), "data/source-coherence-corrections.jsonl");
const APPLY = process.argv.includes("--apply");
const VERSION = "source-coherence-corrections-v1";

interface Correction {
  politicianId: number;
  name: string;
  section: string;
  jahr: string;
  target: "cv_json" | "cv_homepage_json" | "NEEDS_RESEARCH";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  old_text?: string;
  new_text?: string;
  note?: string;
  reason?: string;
  sourceUrl?: string;
}

const corrections: Correction[] = fs.readFileSync(CORRECTIONS, "utf-8")
  .split("\n").filter(l => l.trim()).map(l => JSON.parse(l));

const db = new Database(DB_PATH);

// cv_repair_log existiert bereits aus Stage 4. Schema:
// id, politician_id, applied_at, repair_version, action, section,
// target_index, source_indices, original_entry, original_entries_b,
// new_entry, reason, audit
const insertLog = db.prepare(`
  INSERT INTO cv_repair_log (politician_id, applied_at, repair_version, action,
    section, target_index, original_entry, new_entry, reason, audit)
  VALUES (?, ?, ?, 'set_text', ?, ?, ?, ?, ?, ?)
`);

let applied = 0, skipped = 0, dryRun = 0;

for (const c of corrections) {
  if (c.target === "NEEDS_RESEARCH") {
    console.log(`⏭  ${c.name} (${c.section}/${c.jahr}) — ${c.confidence} confidence: ${c.note}`);
    skipped += 1;
    continue;
  }

  if (c.confidence !== "HIGH") {
    console.log(`⚠  ${c.name} (${c.section}/${c.jahr}) — confidence ${c.confidence} — manuell prüfen`);
    skipped += 1;
    continue;
  }

  const col = c.target;
  const row = db.prepare(`SELECT ${col} FROM politicians WHERE id = ?`).get(c.politicianId) as
    | Record<string, string | null>
    | undefined;
  if (!row || !row[col]) {
    console.log(`✗ ${c.name}: ${col} nicht gefunden`);
    skipped += 1;
    continue;
  }

  const cv = JSON.parse(row[col]!) as { jahr: string; text: string }[] | Record<string, { jahr: string; text: string }[]>;
  const sectionArr = Array.isArray(cv) ? cv : (cv as any)[c.section];
  if (!Array.isArray(sectionArr)) {
    console.log(`✗ ${c.name}: Sektion ${c.section} fehlt`);
    skipped += 1;
    continue;
  }

  const idx = sectionArr.findIndex(e => e.jahr === c.jahr && e.text === c.old_text);
  if (idx < 0) {
    console.log(`✗ ${c.name}: Eintrag ${c.jahr} / "${c.old_text?.slice(0, 50)}..." nicht gefunden`);
    skipped += 1;
    continue;
  }

  const original = sectionArr[idx];

  if (APPLY) {
    sectionArr[idx] = { jahr: c.jahr, text: c.new_text! };
    db.prepare(`UPDATE politicians SET ${col} = ? WHERE id = ?`)
      .run(JSON.stringify(cv), c.politicianId);
    insertLog.run(
      c.politicianId, new Date().toISOString(), VERSION,
      c.section, idx,
      JSON.stringify(original),
      JSON.stringify({ jahr: c.jahr, text: c.new_text }),
      c.reason ?? "source-coherence ECHT-Korrektur",
      JSON.stringify({ source: "source-coherence-corrections-v1", target: col, sourceUrl: c.sourceUrl })
    );
    console.log(`✓ ${c.name} (${c.section}/${c.jahr}) APPLIED [${col}]`);
    console.log(`    old: "${c.old_text?.slice(0, 80)}"`);
    console.log(`    new: "${c.new_text?.slice(0, 80)}"`);
    applied += 1;
  } else {
    console.log(`[dry-run] ${c.name} (${c.section}/${c.jahr}) [${col}]`);
    console.log(`    old: "${c.old_text?.slice(0, 80)}"`);
    console.log(`    new: "${c.new_text?.slice(0, 80)}"`);
    dryRun += 1;
  }
}

db.close();

console.log("");
if (APPLY) console.log(`Applied: ${applied}`);
else console.log(`Würde anwenden: ${dryRun}`);
console.log(`Skipped (NEEDS_RESEARCH oder Lower-Confidence): ${skipped}`);
console.log(APPLY ? "" : "\n→ Mit --apply tatsächlich anwenden");
