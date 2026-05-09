/**
 * BUILD CV-DEDUP — schreibt cv_json_dedup + cv_homepage_json_dedup pro Politiker
 *
 * Liest cv_duplicate_candidates und droppt Duplikate aus den Original-JSONs:
 *   - Default (KONSENS_DUP, KONFLIKT-reklassifiziert, Subset, KEEP_MORE_DETAILED_DATE, KEEP_RICHER_ENTRY):
 *     drop W (Wikipedia-Eintrag), Homepage gewinnt — konsistent zur PoliticianCV.tsx Frontend-Priorität
 *   - claude_code_merge_action='KEEP_W': drop H (Homepage-Eintrag) statt W
 *   - claude_code_merge_action='KEEP_H': drop W (= Default)
 *
 * NICHT gemergt: NO_MERGE, NO_MERGE_WITH_NOTE, lenient_keep_separate, lenient_reclassify_review.
 *
 * Originale cv_json + cv_homepage_json bleiben unangetastet (Quellentreue).
 *
 * Run:
 *   npx tsx scripts/build-cv-dedup.ts                # Pre-Flight (zeigt Stats)
 *   npx tsx scripts/build-cv-dedup.ts --apply        # Schreibt in DB
 *   npx tsx scripts/build-cv-dedup.ts --apply --politician-id 79150  # Nur ein MdB (Test)
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const POLITICIAN_FILTER = args.includes("--politician-id")
  ? parseInt(args[args.indexOf("--politician-id") + 1], 10)
  : null;

interface CVEntry { jahr: string; text: string }
interface CV {
  ausbildung?: CVEntry[];
  beruflicher_werdegang?: CVEntry[];
  politische_stationen?: CVEntry[];
  sonstiges?: CVEntry[];
}

interface Directive {
  id: number;
  politician_id: number;
  section: keyof CV;
  jahr_a: string; text_a: string;   // Wikipedia
  jahr_b: string; text_b: string;   // Homepage
  consensus: string | null;
  claude_code_verdict: string | null;
  claude_code_merge_action: string | null;
  claude_code_purpose: string | null;
}

interface SourceConflict {
  section: string;
  jahr: string;
  final_verdict?: string;
}

function shouldMerge(d: Directive): boolean {
  if (d.consensus === "KONSENS_DUP") return true;
  if (d.claude_code_purpose === "lenient_reclassify_konflikt") return true;
  if (d.claude_code_purpose === "lenient_reclassify_subset") return true;
  if (d.claude_code_purpose === "user_review" && d.claude_code_verdict === "DUPLIKAT") return true;
  return false;
}

/** Welche Seite wird gedroppt? "w" = Wikipedia, "h" = Homepage */
function dropSide(d: Directive): "w" | "h" {
  if (d.claude_code_merge_action === "KEEP_W") return "h";
  // Default + KEEP_H + KEEP_MORE_DETAILED_DATE + KEEP_RICHER_ENTRY → drop W
  return "w";
}

function ensureSchema(db: Database.Database) {
  // Spalten
  const cols = db.prepare("SELECT name FROM pragma_table_info('politicians')").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("cv_json_dedup")) {
    db.exec(`ALTER TABLE politicians ADD COLUMN cv_json_dedup TEXT`);
    console.log("→ Spalte cv_json_dedup hinzugefügt");
  }
  if (!colNames.has("cv_homepage_json_dedup")) {
    db.exec(`ALTER TABLE politicians ADD COLUMN cv_homepage_json_dedup TEXT`);
    console.log("→ Spalte cv_homepage_json_dedup hinzugefügt");
  }
  if (!colNames.has("cv_dedup_at")) {
    db.exec(`ALTER TABLE politicians ADD COLUMN cv_dedup_at TEXT`);
    console.log("→ Spalte cv_dedup_at hinzugefügt");
  }
  // Audit-Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS cv_merge_drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      section TEXT NOT NULL,
      candidate_id INTEGER REFERENCES cv_duplicate_candidates(id),
      dropped_source TEXT NOT NULL,    -- 'wikipedia' | 'homepage'
      dropped_jahr TEXT,
      dropped_text TEXT,
      kept_jahr TEXT,
      kept_text TEXT,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function tryParse(s: string | null): CV | null {
  if (!s) return null;
  try { return JSON.parse(s) as CV; } catch { return null; }
}

function entriesEqual(a: CVEntry, b: { jahr: string; text: string }): boolean {
  return a.jahr === b.jahr && a.text === b.text;
}

function dropEntry(cv: CV | null, section: keyof CV, target: { jahr: string; text: string }): boolean {
  if (!cv) return false;
  const arr = cv[section];
  if (!Array.isArray(arr)) return false;
  const idx = arr.findIndex((e) => entriesEqual(e, target));
  if (idx < 0) return false;
  arr.splice(idx, 1);
  return true;
}

function main() {
  const db = new Database(DB_PATH);

  ensureSchema(db);

  // Hole alle Mergeable Directives
  const directives = db.prepare(`
    SELECT id, politician_id, section, jahr_a, text_a, jahr_b, text_b,
           consensus, claude_code_verdict, claude_code_merge_action, claude_code_purpose
    FROM cv_duplicate_candidates
    WHERE
      consensus = 'KONSENS_DUP'
      OR claude_code_purpose IN ('lenient_reclassify_konflikt', 'lenient_reclassify_subset')
      OR (claude_code_purpose = 'user_review' AND claude_code_verdict = 'DUPLIKAT')
    ${POLITICIAN_FILTER ? "AND politician_id = ?" : ""}
  `).all(...(POLITICIAN_FILTER ? [POLITICIAN_FILTER] : [])) as Directive[];

  // Source-Conflicts (Stage 5) haben Vorrang: wenn ein Paar bereits als ECHT klassifiziert ist,
  // NICHT droppen — die source-coherence-Pipeline hat schon entschieden, dass beide Versionen real sind.
  const sourceConflictsByPolitician = new Map<number, Set<string>>();
  const conflictRows = db.prepare(`SELECT id, source_conflicts FROM politicians WHERE source_conflicts IS NOT NULL`).all() as { id: number; source_conflicts: string }[];
  for (const row of conflictRows) {
    try {
      const arr = JSON.parse(row.source_conflicts) as SourceConflict[];
      if (!Array.isArray(arr)) continue;
      const set = new Set<string>();
      for (const c of arr) {
        if (c.final_verdict === "ECHT") {
          set.add(`${c.section}|${c.jahr}`);
        }
      }
      if (set.size > 0) sourceConflictsByPolitician.set(row.id, set);
    } catch {
      // ignore
    }
  }

  // Filter directives die mit einem ECHT-Source-Conflict kollidieren
  const filteredDirectives = directives.filter((d) => {
    const set = sourceConflictsByPolitician.get(d.politician_id);
    if (!set) return true;
    // Skip wenn entweder W- oder H-Jahr in den Source-Conflicts steckt
    if (set.has(`${d.section}|${d.jahr_a}`) || set.has(`${d.section}|${d.jahr_b}`)) {
      return false;
    }
    return true;
  });
  const skippedByConflict = directives.length - filteredDirectives.length;
  console.log(`Source-Conflict-Vorrang: ${skippedByConflict} Directives übersprungen (ECHT-Konflikt schon dokumentiert)`);

  console.log(`\n=== Pre-Flight ===`);
  console.log(`Directives total: ${directives.length}, nach Source-Conflict-Filter: ${filteredDirectives.length}`);
  const buckets: Record<string, number> = {};
  for (const d of filteredDirectives) {
    const k = d.consensus === "KONSENS_DUP" ? "KONSENS_DUP" : (d.claude_code_purpose ?? "?");
    buckets[k] = (buckets[k] ?? 0) + 1;
  }
  for (const [k, n] of Object.entries(buckets)) console.log(`  ${k}: ${n}`);

  const dropDirSummary: Record<string, number> = { drop_w: 0, drop_h: 0 };
  for (const d of filteredDirectives) dropDirSummary["drop_" + dropSide(d)]++;
  console.log(`Drop-Direction: W=${dropDirSummary.drop_w}, H=${dropDirSummary.drop_h}`);

  // Gruppiere nach Politiker
  const byPolitician = new Map<number, Directive[]>();
  for (const d of filteredDirectives) {
    if (!byPolitician.has(d.politician_id)) byPolitician.set(d.politician_id, []);
    byPolitician.get(d.politician_id)!.push(d);
  }
  console.log(`Betroffene Politiker: ${byPolitician.size}`);

  if (!APPLY) {
    console.log(`\n→ Pre-Flight done. Mit --apply schreiben.`);
    db.close();
    return;
  }

  // Apply
  const getPolStmt = db.prepare(`SELECT cv_json, cv_homepage_json FROM politicians WHERE id = ?`);
  const updPolStmt = db.prepare(`
    UPDATE politicians SET
      cv_json_dedup = ?,
      cv_homepage_json_dedup = ?,
      cv_dedup_at = datetime('now')
    WHERE id = ?
  `);
  const insDropStmt = db.prepare(`
    INSERT INTO cv_merge_drops
      (politician_id, section, candidate_id, dropped_source, dropped_jahr, dropped_text, kept_jahr, kept_text, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const clearDropsStmt = db.prepare(`DELETE FROM cv_merge_drops WHERE politician_id = ?`);

  // Auch alle Politiker bekommen cv_json_dedup = cv_json (auch ohne Directives, damit
  // UI-Loader konsistent _dedup nutzen kann)
  const allPolStmt = db.prepare(POLITICIAN_FILTER
    ? `SELECT id, cv_json, cv_homepage_json FROM politicians WHERE id = ?`
    : `SELECT id, cv_json, cv_homepage_json FROM politicians`);
  const initStmt = db.prepare(`
    UPDATE politicians SET cv_json_dedup = cv_json, cv_homepage_json_dedup = cv_homepage_json, cv_dedup_at = datetime('now') WHERE id = ?
  `);

  console.log(`\n=== Apply ===`);
  let initCount = 0;
  for (const row of allPolStmt.all(...(POLITICIAN_FILTER ? [POLITICIAN_FILTER] : [])) as { id: number }[]) {
    initStmt.run(row.id);
    initCount++;
  }
  console.log(`Initialisiert (Original kopiert): ${initCount} Politiker`);

  let droppedW = 0, droppedH = 0, missedMatch = 0, applied = 0;

  const applyTxn = db.transaction(() => {
    for (const [pid, dirs] of byPolitician) {
      const pol = getPolStmt.get(pid) as { cv_json: string | null; cv_homepage_json: string | null } | undefined;
      if (!pol) continue;
      const cvW = tryParse(pol.cv_json);
      const cvH = tryParse(pol.cv_homepage_json);
      if (!cvW && !cvH) continue;
      clearDropsStmt.run(pid);

      for (const d of dirs) {
        const side = dropSide(d);
        if (side === "w") {
          const hit = dropEntry(cvW, d.section, { jahr: d.jahr_a, text: d.text_a });
          if (hit) {
            droppedW++;
            insDropStmt.run(
              pid, d.section, d.id, "wikipedia",
              d.jahr_a, d.text_a, d.jahr_b, d.text_b,
              `Default-drop (Homepage-Priority); ${d.consensus ?? d.claude_code_purpose}`,
            );
          } else {
            missedMatch++;
          }
        } else {
          const hit = dropEntry(cvH, d.section, { jahr: d.jahr_b, text: d.text_b });
          if (hit) {
            droppedH++;
            insDropStmt.run(
              pid, d.section, d.id, "homepage",
              d.jahr_b, d.text_b, d.jahr_a, d.text_a,
              `Explicit KEEP_W; ${d.claude_code_purpose}`,
            );
          } else {
            missedMatch++;
          }
        }
      }

      updPolStmt.run(
        cvW ? JSON.stringify(cvW) : pol.cv_json,
        cvH ? JSON.stringify(cvH) : pol.cv_homepage_json,
        pid,
      );
      applied++;
    }
  });
  applyTxn();

  console.log(`\nFertig.`);
  console.log(`  Politiker bearbeitet: ${applied}`);
  console.log(`  W-Einträge gedroppt: ${droppedW}`);
  console.log(`  H-Einträge gedroppt: ${droppedH}`);
  console.log(`  Match-Misses (Eintrag nicht im JSON gefunden): ${missedMatch}`);

  db.close();
}

main();
