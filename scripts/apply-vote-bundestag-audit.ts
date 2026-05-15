/**
 * Apply: ersetzt alle drucksache_polls-Einträge durch die autoritative
 * Bundestag.de-Drucksachen-Liste pro Poll.
 *
 * Quelle der Poll→BT-ID-Mapping: manuelle Topic-Match-Prüfung am 2026-05-13
 * über audit_bundestag_polls (siehe scripts/audit-vote-drucksache-mapping.ts +
 * Konversation mit Claude Opus 4.7).
 *
 * Strategie:
 *   1. DB-Snapshot vorab
 *   2. Vorhandene drucksache_polls-Einträge in einen Backup-Tabellen-Spalte sichern (drucksache_polls_pre_bt_audit)
 *   3. Pro Poll: alle DS aus audit_bundestag_polls.drucksachen_json einfügen
 *      mit matched_via = 'bundestag_de_audit'
 *
 * Run: npx tsx scripts/apply-vote-bundestag-audit.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";
import { POLL_TO_BT_ID } from "../src/lib/poll-bt-mapping";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DRY_RUN = process.argv.includes("--dry-run");

function main() {
  const db = new Database(DB_PATH);

  // Sicherheits-Checks
  const totalPolls = (db.prepare(`SELECT COUNT(DISTINCT poll_id) AS n FROM votes`).get() as { n: number }).n;
  const mappingCount = Object.keys(POLL_TO_BT_ID).length;
  if (mappingCount !== totalPolls) {
    console.error(`❌ Mapping zählt ${mappingCount}, DB hat ${totalPolls} distinkte Polls — Abbruch`);
    process.exit(1);
  }

  console.log(`\n🔧 Apply: ${mappingCount} Poll→Bundestag-ID-Mappings → drucksache_polls neu schreiben`);
  console.log(`Mode: ${DRY_RUN ? "DRY-RUN (keine Änderungen)" : "LIVE"}\n`);

  if (!DRY_RUN) {
    // 1. Backup-Tabelle für die alten Mappings
    db.exec(`
      CREATE TABLE IF NOT EXISTS drucksache_polls_pre_bt_audit AS
      SELECT *, datetime('now') AS archived_at FROM drucksache_polls WHERE 0;
    `);
    // Falls schon befüllt: nicht erneut backupen
    const backupCount = (db.prepare(`SELECT COUNT(*) AS n FROM drucksache_polls_pre_bt_audit`).get() as { n: number }).n;
    if (backupCount === 0) {
      db.exec(`
        INSERT INTO drucksache_polls_pre_bt_audit (drucksache_nr, poll_id, match_score, matched_via, archived_at)
        SELECT drucksache_nr, poll_id, match_score, matched_via, datetime('now') FROM drucksache_polls;
      `);
      const archived = (db.prepare(`SELECT COUNT(*) AS n FROM drucksache_polls_pre_bt_audit`).get() as { n: number }).n;
      console.log(`📦 ${archived} alte Mappings archiviert in drucksache_polls_pre_bt_audit\n`);
    } else {
      console.log(`📦 Backup-Tabelle hat bereits ${backupCount} Einträge — wird nicht überschrieben\n`);
    }

    // 2. drucksache_polls komplett leeren
    db.exec(`DELETE FROM drucksache_polls`);
  }

  // 3. Neu befüllen aus audit_bundestag_polls
  const getBt = db.prepare(
    `SELECT bundestag_id, drucksachen_json, topic FROM audit_bundestag_polls WHERE bundestag_id = ?`
  );
  const checkDs = db.prepare(
    `SELECT 1 FROM drucksache_analyses WHERE drucksache_nr = ? AND analyze_error IS NULL LIMIT 1`
  );
  const insert = db.prepare(
    `INSERT OR IGNORE INTO drucksache_polls (drucksache_nr, poll_id, match_score, matched_via) VALUES (?, ?, ?, ?)`
  );

  let pollsOk = 0;
  let dsInserted = 0;
  let dsSkippedNoAnalysis = 0;

  for (const [pollIdStr, btId] of Object.entries(POLL_TO_BT_ID)) {
    const pollId = parseInt(pollIdStr, 10);
    const bt = getBt.get(btId) as { bundestag_id: number; drucksachen_json: string; topic: string | null } | undefined;
    if (!bt) {
      console.error(`❌ Poll ${pollId}: Bundestag-id ${btId} nicht in audit_bundestag_polls — übersprungen`);
      continue;
    }
    let drucksachen: string[];
    try { drucksachen = JSON.parse(bt.drucksachen_json); } catch { drucksachen = []; }

    let inserted = 0;
    let skipped = 0;
    for (const ds of drucksachen) {
      const exists = checkDs.get(ds);
      if (!exists) {
        skipped++;
        continue;
      }
      if (!DRY_RUN) {
        const result = insert.run(ds, pollId, 1.0, "bundestag_de_audit");
        if (result.changes > 0) inserted++;
      } else {
        inserted++;
      }
    }
    dsInserted += inserted;
    dsSkippedNoAnalysis += skipped;
    pollsOk++;

    const tag = inserted > 0 ? "✓" : "·";
    console.log(`  ${tag} Poll ${pollId} → BT-id ${btId} · ${(bt.topic || "").slice(0, 50)} · ${inserted} DS eingefügt${skipped > 0 ? ` (${skipped} ohne Analyse übersprungen)` : ""}`);
  }

  console.log(`\n✅ Fertig: ${pollsOk} Polls verarbeitet · ${dsInserted} DS-Links neu · ${dsSkippedNoAnalysis} DS ohne Analyse übersprungen`);

  if (!DRY_RUN) {
    const final = db
      .prepare(
        `SELECT (SELECT COUNT(DISTINCT poll_id) FROM votes) AS total_polls,
                (SELECT COUNT(DISTINCT poll_id) FROM drucksache_polls) AS polls_with_link,
                (SELECT COUNT(*) FROM drucksache_polls) AS total_links`
      )
      .get() as { total_polls: number; polls_with_link: number; total_links: number };
    console.log(`\nCoverage: ${final.polls_with_link} / ${final.total_polls} Polls mit ≥ 1 DS-Link · Gesamt ${final.total_links} Links`);
  }
}

main();
