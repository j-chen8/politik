#!/usr/bin/env npx tsx
/**
 * Schreibt die 51 finalen Bias-Fixes in die DB.
 *
 * Strategie:
 *   - Neue Spalte `zusammenfassung_2_saetze_final` in speech_analyses_v2_corrections
 *   - Originaler v2.1-Output bleibt in `zusammenfassung_2_saetze`
 *   - Original v1-Output in speech_analyses_v2 unangetastet
 *   - UI/Konsumenten nutzen COALESCE(final, v2.1, v1) für Anzeige
 *
 * Run:
 *   npx tsx scripts/apply-final-fixes-to-db.ts          # Pre-Flight
 *   npx tsx scripts/apply-final-fixes-to-db.ts --apply  # commit
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

const DB_PATH = 'politik.db';
const FIXES_PATH = 'bias-fixes-final.jsonl';

interface Fix {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  sitzung: number;
  v21_summary_clean: string;
  final_summary: string;
  source: 'mapping' | 'manual_override';
  matched_words_v21: string[];
}

function ensureColumns(db: Database.Database) {
  // Prüfe ob neue Spalten existieren
  const cols = db.prepare(`PRAGMA table_info(speech_analyses_v2_corrections)`).all() as any[];
  const has = (n: string) => cols.some(c => c.name === n);

  if (!has('zusammenfassung_2_saetze_final')) {
    db.exec(`ALTER TABLE speech_analyses_v2_corrections ADD COLUMN zusammenfassung_2_saetze_final TEXT`);
    console.log('  + Spalte zusammenfassung_2_saetze_final hinzugefügt');
  }
  if (!has('fix_source')) {
    db.exec(`ALTER TABLE speech_analyses_v2_corrections ADD COLUMN fix_source TEXT`);
    console.log('  + Spalte fix_source hinzugefügt');
  }
  if (!has('fix_applied_at')) {
    db.exec(`ALTER TABLE speech_analyses_v2_corrections ADD COLUMN fix_applied_at TEXT`);
    console.log('  + Spalte fix_applied_at hinzugefügt');
  }
}

function main() {
  const args = process.argv.slice(2);
  const doApply = args.includes('--apply');

  if (!fs.existsSync(FIXES_PATH)) {
    console.error('bias-fixes-final.jsonl nicht gefunden — erst build-final-bias-fixes.ts laufen lassen');
    process.exit(1);
  }

  const fixes: Fix[] = fs.readFileSync(FIXES_PATH, 'utf-8').split('\n').filter(Boolean).map(l => JSON.parse(l));

  console.log(`=== Apply Final Bias-Fixes ===`);
  console.log(`Total: ${fixes.length}`);
  console.log(`  Mechanisch: ${fixes.filter(f => f.source === 'mapping').length}`);
  console.log(`  Manuell:    ${fixes.filter(f => f.source === 'manual_override').length}`);
  console.log('');

  if (!doApply) {
    console.log('Pre-Flight only. Mit --apply schreiben.\n');
    console.log('Sample (erste 3):');
    for (const f of fixes.slice(0, 3)) {
      console.log(`  ${f.rede_id}_${f.segment_index} (${f.source}): "${f.final_summary.slice(0, 100)}…"`);
    }
    return;
  }

  const db = new Database(DB_PATH);
  ensureColumns(db);

  const updateStmt = db.prepare(`
    UPDATE speech_analyses_v2_corrections
    SET zusammenfassung_2_saetze_final = @final,
        fix_source = @source,
        fix_applied_at = @ts
    WHERE rede_id = @rede_id AND segment_index = @segment_index
  `);

  const ts = new Date().toISOString();
  let updated = 0, missing = 0;
  const tx = db.transaction((rows: Fix[]) => {
    for (const f of rows) {
      const result = updateStmt.run({
        final: f.final_summary,
        source: f.source,
        ts,
        rede_id: f.rede_id,
        segment_index: f.segment_index,
      });
      if (result.changes === 1) updated++;
      else missing++;
    }
  });

  tx(fixes);

  console.log(`✓ ${updated} Reden aktualisiert`);
  if (missing > 0) console.log(`⚠ ${missing} Reden nicht gefunden in DB`);

  // Quick-Stats
  const stats = db.prepare(`
    SELECT fix_source, COUNT(*) AS n FROM speech_analyses_v2_corrections WHERE fix_source IS NOT NULL GROUP BY fix_source
  `).all();
  console.log('\nFinal-Spalte Stats:', stats);

  console.log('\nUI-Konsum: COALESCE(c.zusammenfassung_2_saetze_final, c.zusammenfassung_2_saetze, v2.zusammenfassung_2_saetze)');
  db.close();
}

main();
