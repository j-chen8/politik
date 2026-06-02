/**
 * Wendet die in verify-duplicates.partial.jsonl bestätigten (merge:true) Berlin-
 * Doubletten auf cv_json_dedup an — direkt, ohne den cv_duplicate_candidates-
 * Review-Layer (der existiert nur für den Bundestag-Bestand).
 *
 * Pro Politiker kumulativ: Start = cv_json (Quellentreue, Original bleibt), je Merge
 * werden original_a + original_b per Content-Match entfernt und merged_entry eingefügt.
 * Audit-Trail in cv_merge_drops (dropped_source='wikipedia').
 *
 * Run: npx tsx scripts/apply-berlin-dedup.ts [--apply]   (ohne --apply = Dry-Run)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const INPUT = path.join(process.cwd(), "verify-duplicates.partial.jsonl");
const APPLY = process.argv.includes("--apply");

interface Entry { jahr: string; text: string }
interface Merge {
  politician_id: number; name: string; section: string;
  original_a: Entry; original_b: Entry; merged_entry: Entry; reason: string;
}

const eq = (a: Entry, b: Entry) => a?.jahr === b?.jahr && a?.text === b?.text;

function main() {
  if (!fs.existsSync(INPUT)) { console.error(`${INPUT} fehlt — erst verify-duplicates laufen lassen`); process.exit(1); }
  const merges: Merge[] = fs.readFileSync(INPUT, "utf-8").split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .filter((d) => d.merge === true);

  // Pro Politiker gruppieren
  const byPol = new Map<number, Merge[]>();
  for (const m of merges) {
    if (!byPol.has(m.politician_id)) byPol.set(m.politician_id, []);
    byPol.get(m.politician_id)!.push(m);
  }

  const db = new Database(DB_PATH);
  const getCv = db.prepare("SELECT cv_json FROM politicians WHERE id = ?");
  const updCv = db.prepare("UPDATE politicians SET cv_json_dedup = ?, cv_dedup_at = ? WHERE id = ?");
  const clearDrops = db.prepare("DELETE FROM cv_merge_drops WHERE politician_id = ? AND dropped_source = 'wikipedia'");
  const insDrop = db.prepare(`INSERT INTO cv_merge_drops
    (politician_id, section, candidate_id, dropped_source, dropped_jahr, dropped_text, kept_jahr, kept_text, reason)
    VALUES (?, ?, NULL, 'wikipedia', ?, ?, ?, ?, ?)`);

  let polDone = 0, dropsDone = 0;
  for (const [pid, ms] of byPol) {
    const row = getCv.get(pid) as { cv_json: string } | undefined;
    if (!row?.cv_json) { console.log(`  ! id ${pid}: kein cv_json`); continue; }
    const cv = JSON.parse(row.cv_json) as Record<string, Entry[]>;
    const drops: { section: string; dropped: Entry; kept: Entry; reason: string }[] = [];

    for (const m of ms) {
      const arr = cv[m.section];
      if (!Array.isArray(arr)) { console.log(`  ! ${m.name}: Sektion ${m.section} kein Array`); continue; }
      const ia = arr.findIndex((e) => eq(e, m.original_a));
      const ib = arr.findIndex((e) => eq(e, m.original_b));
      if (ia < 0 || ib < 0) { console.log(`  ! ${m.name}: Eintrag nicht gefunden (a=${ia} b=${ib}) — evtl. schon gemergt`); continue; }
      // Beide entfernen (höheren Index zuerst), merged_entry an Position des kleineren einfügen
      // Faktentreue: NUR anwenden, wenn merged_entry wörtlich einem der Originale
      // entspricht (echter "pick"). Synthetisierte Merges (neuer Text/neue Datums-
      // spanne) werden übersprungen — beide Einträge bleiben, keine Erfindung.
      const keepsA = eq(m.merged_entry, m.original_a);
      const keepsB = eq(m.merged_entry, m.original_b);
      if (!keepsA && !keepsB) {
        console.log(`  ⊘ ${m.name}: SYNTH-Merge übersprungen (merged != beide Originale) — [${m.merged_entry.jahr}] ${m.merged_entry.text.slice(0,50)}`);
        continue;
      }
      const dropIdx = keepsB ? ia : ib; // das NICHT-behaltene Original droppen
      const dropped = arr[dropIdx];
      arr.splice(dropIdx, 1);
      drops.push({ section: m.section, dropped, kept: m.merged_entry, reason: m.reason });
    }

    console.log(`  ✓ ${ms[0].name} (id ${pid}): ${drops.length} Eintrag/Einträge gedroppt`);
    polDone++; dropsDone += drops.length;

    if (APPLY) {
      updCv.run(JSON.stringify(cv), new Date().toISOString(), pid);
      clearDrops.run(pid);
      for (const d of drops) insDrop.run(pid, d.section, d.dropped.jahr, d.dropped.text, d.kept.jahr, d.kept.text, d.reason);
    }
  }

  console.log(`\n${APPLY ? "GESCHRIEBEN" : "DRY-RUN"}: ${polDone} Politiker, ${dropsDone} Drops`);
  db.close();
}

main();
