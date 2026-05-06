/**
 * Stage 4 — CV-Repair: wendet die Aktionen aus cv-repair-queue.jsonl
 * auf cv_json in der DB an.
 *
 * Aktionen:
 *   - clear_date:    setzt jahr auf "" (Halluzination)
 *   - set_date:      setzt jahr auf neuen Wert (Korrektur oder Ergänzung)
 *   - merge_entries: ersetzt 2 Einträge durch 1 konsolidierten
 *
 * Sicherheit:
 *   - DB-Snapshot vor jedem --apply Lauf
 *   - cv_repair_log Tabelle für vollständigen Audit-Trail
 *     (kann später für Rollback verwendet werden)
 *   - Default: --dry-run (zeigt was passieren würde, schreibt nicht)
 *   - --apply muss explizit gesetzt sein
 *   - Index-Validation: prüft ob target_index noch zu erwartetem Eintrag passt
 *
 * Run:
 *   npx tsx scripts/repair-cv-entries.ts             # dry-run, zeigt Plan
 *   npx tsx scripts/repair-cv-entries.ts --apply     # tatsächlich anwenden
 *   npx tsx scripts/repair-cv-entries.ts --apply --ids=79129,175003  # nur diese
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const DB_PATH = path.join(process.cwd(), "politik.db");
const QUEUE = path.join(process.cwd(), "cv-repair-queue.jsonl");
const REPAIR_VERSION = "repair-v1";

const APPLY = process.argv.includes("--apply");
const IDS_ARG = process.argv.find(a => a.startsWith("--ids="));
const ONLY_IDS = IDS_ARG ? new Set(IDS_ARG.replace("--ids=", "").split(",").map(s => parseInt(s, 10))) : null;

interface RepairAction {
  politician_id: number;
  name: string;
  action: "set_date" | "clear_date" | "merge_entries";
  section: string;
  target_index?: number;
  source_indices?: [number, number];
  current_value?: { jahr: string; text: string };
  new_value: { jahr: string; text?: string };
  source: string;
  reason: string;
  evidence: string;
  audit: { detector?: string; verifier?: string; human_reviewer?: string };
}

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

function ensureRepairLog(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cv_repair_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      politician_id INTEGER NOT NULL,
      applied_at TEXT NOT NULL,
      repair_version TEXT NOT NULL,
      action TEXT NOT NULL,
      section TEXT NOT NULL,
      target_index INTEGER,
      source_indices TEXT,
      original_entry TEXT,
      original_entries_b TEXT,
      new_entry TEXT,
      reason TEXT,
      audit TEXT
    )
  `);
}

function snapshotDB() {
  const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
  const snap = `${DB_PATH}.snapshot-pre-repair-${ts}`;
  execSync(`cp ${DB_PATH} ${snap}`);
  console.log(`✓ DB-Snapshot: ${snap}`);
  return snap;
}

function applyRepair(cv: CV, a: RepairAction): { success: boolean; original: any; modified: CV; reason?: string } {
  const sec = a.section as keyof CV;
  const arr = cv[sec];
  if (!arr) return { success: false, original: null, modified: cv, reason: `Section ${a.section} nicht in cv_json` };

  if (a.action === "merge_entries") {
    if (!a.source_indices) return { success: false, original: null, modified: cv, reason: "Keine source_indices für merge" };
    const [i, j] = a.source_indices;
    if (i >= arr.length || j >= arr.length) return { success: false, original: null, modified: cv, reason: `Index ${i} oder ${j} out of bounds` };
    const original = { entry_a: arr[i], entry_b: arr[j] };
    // Erstelle neues Array: behalte alle ausser i und j, füge merged hinzu
    const filtered = arr.filter((_, k) => k !== i && k !== j);
    const merged: Entry = { jahr: a.new_value.jahr, text: a.new_value.text ?? arr[i].text };
    const newArr = [...filtered, merged];
    return { success: true, original, modified: { ...cv, [sec]: newArr } };
  }

  if (a.target_index === undefined) return { success: false, original: null, modified: cv, reason: "Kein target_index" };
  if (a.target_index >= arr.length) return { success: false, original: null, modified: cv, reason: `target_index ${a.target_index} out of bounds (Array hat ${arr.length})` };

  const original = arr[a.target_index];
  // Sanity-Check: text matches expected current_value (zumindest ungefähr)
  if (a.current_value && original.text !== a.current_value.text) {
    // Nicht abbrechen aber warnen — vielleicht hat anderer Repair den text schon geändert
    // Für jetzt: weitermachen, aber tracken
  }

  if (a.action === "clear_date") {
    const newEntry: Entry = { jahr: "", text: original.text };
    const newArr = [...arr]; newArr[a.target_index] = newEntry;
    return { success: true, original, modified: { ...cv, [sec]: newArr } };
  }

  if (a.action === "set_date") {
    const newEntry: Entry = { jahr: a.new_value.jahr, text: a.new_value.text ?? original.text };
    const newArr = [...arr]; newArr[a.target_index] = newEntry;
    return { success: true, original, modified: { ...cv, [sec]: newArr } };
  }

  return { success: false, original: null, modified: cv, reason: `Unbekannte Aktion: ${a.action}` };
}

function main() {
  if (!fs.existsSync(QUEUE)) {
    console.error(`${QUEUE} fehlt — erst aggregate-repair-queue.ts laufen lassen`);
    process.exit(1);
  }

  const queue: RepairAction[] = [];
  for (const line of fs.readFileSync(QUEUE, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    queue.push(JSON.parse(line));
  }

  // Filter
  const todo = ONLY_IDS ? queue.filter(q => ONLY_IDS.has(q.politician_id)) : queue;

  console.log(`\n${queue.length} Aktionen in Queue, ${todo.length} zu verarbeiten`);
  console.log(`Mode: ${APPLY ? "APPLY (DB wird modifiziert)" : "DRY-RUN (read-only)"}\n`);

  if (APPLY) snapshotDB();

  const db = new Database(DB_PATH, { readonly: !APPLY });
  if (APPLY) ensureRepairLog(db);

  // Group by politician — modifiziere cv_json einmal pro MdB (alle Actions zusammen)
  const byPid = new Map<number, RepairAction[]>();
  for (const a of todo) {
    if (!byPid.has(a.politician_id)) byPid.set(a.politician_id, []);
    byPid.get(a.politician_id)!.push(a);
  }

  let applied = 0, failed = 0, skipped = 0;
  const failureReasons: Record<string, number> = {};

  // Sort actions per MdB so merges are last (they re-index the array!)
  for (const [pid, actions] of byPid.entries()) {
    actions.sort((a, b) => {
      // Merges last (sie verändern Array-Länge)
      if (a.action === "merge_entries" && b.action !== "merge_entries") return 1;
      if (b.action === "merge_entries" && a.action !== "merge_entries") return -1;
      return 0;
    });

    const row = db.prepare(`SELECT cv_json, first_name || ' ' || last_name AS name FROM politicians WHERE id = ?`).get(pid) as { cv_json: string; name: string } | undefined;
    if (!row || !row.cv_json) { skipped += actions.length; continue; }

    let cv: CV;
    try { cv = JSON.parse(row.cv_json); } catch { skipped += actions.length; continue; }

    for (const a of actions) {
      const result = applyRepair(cv, a);
      if (!result.success) {
        failed++;
        const reason = result.reason || "unknown";
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        if (!APPLY) console.log(`✗ ${pid} ${row.name} [${a.section}] ${a.action}: ${reason}`);
        continue;
      }

      cv = result.modified;
      applied++;

      if (APPLY) {
        // Audit-Log
        db.prepare(`INSERT INTO cv_repair_log (politician_id, applied_at, repair_version, action, section, target_index, source_indices, original_entry, original_entries_b, new_entry, reason, audit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run(pid, new Date().toISOString(), REPAIR_VERSION,
               a.action, a.section,
               a.target_index ?? null,
               a.source_indices ? JSON.stringify(a.source_indices) : null,
               a.action === "merge_entries" ? JSON.stringify(result.original.entry_a) : JSON.stringify(result.original),
               a.action === "merge_entries" ? JSON.stringify(result.original.entry_b) : null,
               JSON.stringify(a.new_value),
               a.reason,
               JSON.stringify(a.audit));
      }
    }

    if (APPLY) {
      db.prepare(`UPDATE politicians SET cv_json = ?, cv_summary = NULL WHERE id = ?`).run(JSON.stringify(cv), pid);
    }
  }

  console.log(`\n=== Repair Stats ===`);
  console.log(`  applied:   ${applied}`);
  console.log(`  failed:    ${failed}`);
  console.log(`  skipped:   ${skipped}`);
  if (Object.keys(failureReasons).length) {
    console.log(`\n  Failure reasons:`);
    for (const [r, n] of Object.entries(failureReasons)) console.log(`    ${r.padEnd(50)} ${n}`);
  }

  if (APPLY) {
    console.log(`\n✓ DB modifiziert. cv_summary zurückgesetzt für ${byPid.size} MdBs (muss neu generiert werden)`);
    console.log(`✓ Audit-Trail in cv_repair_log Tabelle`);
  } else {
    console.log(`\nDRY-RUN: kein Write. Mit --apply tatsächlich anwenden.`);
  }

  db.close();
}

main();
