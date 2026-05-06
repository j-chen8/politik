#!/usr/bin/env npx tsx
/**
 * fix-tonalitaet-drift.ts
 *
 * Repariert die ~33 Reden in speech_analyses_v2 deren tonalitaet außerhalb
 * des 11-Werte-Enums liegt (entstanden trotz Tool-Use-Schema-Lock im
 * Vollauf-Batch 2026-05-01).
 *
 * - Snapshot DB vor Änderung
 * - Fügt Spalte tonalitaet_original hinzu (NULL für unveränderte Reden)
 * - Schreibt JSONL-Audit aller Änderungen
 * - Wendet Updates in einer Transaktion an
 * - Verifiziert: keine Werte mehr außerhalb des Enums
 *
 * Mapping-Begründung dokumentiert in der Konversation 2026-05-05;
 * Methodology-Definitionen jetzt neutralisiert (v2).
 *
 * Reversibel: tonalitaet_original kann jederzeit zurückgespielt werden via
 *   UPDATE speech_analyses_v2 SET tonalitaet = tonalitaet_original
 *   WHERE tonalitaet_original IS NOT NULL;
 */

import Database from 'better-sqlite3';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

const DB_PATH = 'politik.db';

const ENUM_VALUES = new Set([
  'sachlich',
  'polemisch',
  'polemisch_sachlich',
  'emotional_persoenlich',
  'konfrontativ_belegend',
  'ironisch_jugendlich',
  'bilanzierend_werbend',
  'staatsmaennisch',
  'defensiv_pragmatisch',
  'sozial_anklagend',
  'mahnend',
]);

// 1) Typo-Klasse: bulk update by tonalitaet-string
const BULK_MAPPINGS: Array<{ from: string; to: string; reason: string }> = [
  { from: 'defensive_pragmatisch', to: 'defensiv_pragmatisch', reason: 'englischer Stem statt deutschem' },
  { from: 'social_anklagend',      to: 'sozial_anklagend',     reason: 'englischer Stem statt deutschem' },
  { from: 'staatsmännisch',        to: 'staatsmaennisch',      reason: 'Umlaut statt ASCII-Schreibung' },
  { from: 'staatmaennisch',        to: 'staatsmaennisch',      reason: 'fehlendes "s" — Tippfehler' },
  { from: 'staats­maennisch', to: 'staatsmaennisch',      reason: 'unsichtbares Soft-Hyphen' },
  { from: 'sachl',                 to: 'sachlich',             reason: 'abgeschnittener Wert' },
];

// 2) Inventions-Klasse: per (rede_id, original_value)
const PER_REDE_MAPPINGS: Array<{
  rede_id: string;
  from: string | null;
  to: string;
  reason: string;
}> = [
  { rede_id: 'ID212115800', from: 'konstruktiv_kritisch', to: 'mahnend',
    reason: 'Göring-Eckardt mahnt mehr Nachhaltigkeit bei Kriegsgräberpflege an' },
  { rede_id: 'ID217309100', from: 'nachfragend',          to: 'konfrontativ_belegend',
    reason: 'Vriesema belegt Kanzleramt-Doppelmoral (Aussage vs. Tat)' },
  { rede_id: 'ID212706600', from: 'nachfragend_kritisch', to: 'konfrontativ_belegend',
    reason: 'Nanni stellt kritische Faktenfrage zu Verteidigungsausschuss' },
  { rede_id: 'ID212115500', from: 'persoenlich_mahnend',  to: 'mahnend',
    reason: 'Hose-Anekdote ist fremde (Schüler), Gedenkrede-Kontext dominiert' },
  { rede_id: 'ID212010200', from: 'pointiert',            to: 'polemisch',
    reason: 'Gebhard nennt Frage "abenteuerlich" = Angriff auf Kompetenz' },
  { rede_id: 'ID215814300', from: 'pointiert_defensiv',   to: 'konfrontativ_belegend',
    reason: 'Demuth belegt mit SWR-Triell, ironischer Stil ist Modifier' },
  { rede_id: 'ID212011000', from: 'pointiert_nachhakend', to: 'konfrontativ_belegend',
    reason: 'Paul (AfD) konfrontiert Minister mit eigener Soldatenerfahrung als Beleg' },
  { rede_id: 'ID216809000', from: 'pointiert_nachhakend', to: 'konfrontativ_belegend',
    reason: 'Piechotta verlangt klare Zusage statt vager CDU-Formulierung' },
  { rede_id: 'ID216409200', from: 'pointiert_pragmatisch', to: 'sachlich',
    reason: 'Al-Wazir stellt sachliche Folgefrage zum Tempolimit' },
  { rede_id: 'ID212113300', from: 'pointiert_rhetorical',  to: 'konfrontativ_belegend',
    reason: 'Slawik belegt Grünen-Anteil am Deutschlandticket' },
  { rede_id: 'ID212018100', from: 'pointiert_sachlich',    to: 'sachlich',
    reason: 'Schäfer-Rechnung 320×84M ist numerische Widerlegung, kein AfD-Frame' },
  { rede_id: 'ID214703900', from: 'pointiert_sueffisant',  to: 'sozial_anklagend',
    reason: 'Görke "Rechnung ohne die Bürger" = Bürger-vs-Eliten-Frame' },
  { rede_id: 'ID215212100', from: null,                    to: 'konfrontativ_belegend',
    reason: 'Kaminski belegt UN-Rhetorik vs. Sparmaßnahmen-Widerspruch' },
];

function snapshotDb(): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '').replace('T', '-').slice(0, 15);
  const path = `${DB_PATH}.snapshot-pre-tonalitaet-fix-${ts}`;
  execSync(`cp ${DB_PATH} ${path}`);
  return path;
}

function ensureAuditColumn(db: Database.Database): void {
  const cols = db.prepare(`PRAGMA table_info(speech_analyses_v2)`).all() as any[];
  const hasCol = cols.some((c) => c.name === 'tonalitaet_original');
  if (!hasCol) {
    db.exec(`ALTER TABLE speech_analyses_v2 ADD COLUMN tonalitaet_original TEXT`);
    console.log('  + Spalte tonalitaet_original hinzugefügt');
  } else {
    console.log('  · Spalte tonalitaet_original existiert bereits');
  }
}

function captureBeforeState(db: Database.Database): any[] {
  const stmt = db.prepare(`
    SELECT rede_id, segment_index, tonalitaet, substr(zusammenfassung_2_saetze, 1, 200) AS zus_preview
    FROM speech_analyses_v2
    WHERE tonalitaet IS NULL OR tonalitaet NOT IN (
      'sachlich','polemisch','polemisch_sachlich','emotional_persoenlich',
      'konfrontativ_belegend','ironisch_jugendlich','bilanzierend_werbend',
      'staatsmaennisch','defensiv_pragmatisch','sozial_anklagend','mahnend'
    )
  `);
  return stmt.all() as any[];
}

function writeAuditJsonl(beforeRows: any[], appliedMappings: any[], path: string): void {
  const entries = appliedMappings.map((m) => {
    const before = beforeRows.find(
      (r) => r.rede_id === m.rede_id && (r.tonalitaet === m.from || (r.tonalitaet === null && m.from === null))
    );
    return {
      timestamp: new Date().toISOString(),
      rede_id: m.rede_id,
      segment_index: before?.segment_index,
      tonalitaet_original: m.from,
      tonalitaet_neu: m.to,
      mapping_class: m.kind,
      reason: m.reason,
      zus_preview: before?.zus_preview,
    };
  });
  fs.writeFileSync(path, entries.map((e) => JSON.stringify(e)).join('\n') + '\n');
}

function main() {
  console.log('=== Tonalität-Drift-Fix ===');

  const snapshotPath = snapshotDb();
  console.log(`✓ DB-Snapshot: ${snapshotPath}`);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  ensureAuditColumn(db);

  const beforeRows = captureBeforeState(db);
  console.log(`  · Drift-Reden vor Fix: ${beforeRows.length}`);

  if (beforeRows.length === 0) {
    console.log('Nichts zu tun.');
    db.close();
    return;
  }

  // Sammle alle anzuwendenden Mappings (für Audit-Log)
  const appliedMappings: any[] = [];

  // Validierung: jede `to`-Klasse muss im Enum sein
  for (const m of [...BULK_MAPPINGS, ...PER_REDE_MAPPINGS]) {
    if (!ENUM_VALUES.has(m.to)) {
      throw new Error(`Mapping-Ziel "${m.to}" nicht im Enum`);
    }
  }

  const tx = db.transaction(() => {
    // 1) Bulk: typo-class
    for (const m of BULK_MAPPINGS) {
      const matchedRows = db.prepare(
        `SELECT rede_id FROM speech_analyses_v2 WHERE tonalitaet = ?`
      ).all(m.from) as any[];

      if (matchedRows.length === 0) continue;

      const upd = db.prepare(`
        UPDATE speech_analyses_v2
        SET tonalitaet_original = tonalitaet, tonalitaet = ?
        WHERE tonalitaet = ?
      `).run(m.to, m.from);

      for (const r of matchedRows) {
        appliedMappings.push({
          rede_id: r.rede_id,
          from: m.from,
          to: m.to,
          reason: m.reason,
          kind: 'typo',
        });
      }
      console.log(`  → bulk: ${m.from.padEnd(28)} → ${m.to.padEnd(22)} (${upd.changes} Reden)`);
    }

    // 2) Per-Rede: invention-class
    for (const m of PER_REDE_MAPPINGS) {
      const whereTon = m.from === null ? 'tonalitaet IS NULL' : 'tonalitaet = ?';
      const params = m.from === null ? [m.to, m.rede_id] : [m.to, m.rede_id, m.from];

      const upd = db.prepare(`
        UPDATE speech_analyses_v2
        SET tonalitaet_original = tonalitaet, tonalitaet = ?
        WHERE rede_id = ? AND ${whereTon}
      `).run(...params);

      if (upd.changes > 0) {
        appliedMappings.push({
          rede_id: m.rede_id,
          from: m.from,
          to: m.to,
          reason: m.reason,
          kind: 'invention',
        });
        console.log(`  → rede:  ${m.rede_id} ${String(m.from).padEnd(24)} → ${m.to}`);
      } else {
        console.log(`  ! rede:  ${m.rede_id} (${m.from}) — keine Zeile betroffen, prüfen!`);
      }
    }
  });

  tx();

  // Audit
  const auditPath = `tonalitaet-drift-fix-${new Date().toISOString().slice(0, 10)}.jsonl`;
  writeAuditJsonl(beforeRows, appliedMappings, auditPath);
  console.log(`✓ Audit-JSONL: ${auditPath} (${appliedMappings.length} Einträge)`);

  // Verify
  const afterRows = captureBeforeState(db);
  console.log(`\n=== Verify ===`);
  console.log(`  Drift-Reden nach Fix: ${afterRows.length}`);
  if (afterRows.length > 0) {
    console.log('  ⚠ Übrige Drift-Werte:');
    for (const r of afterRows) {
      console.log(`    ${r.rede_id} (segment ${r.segment_index}): ${r.tonalitaet}`);
    }
  } else {
    console.log('  ✓ Alle Tonalitäten jetzt im Enum');
  }

  // Stats
  const total = db.prepare(`SELECT COUNT(*) AS n FROM speech_analyses_v2`).get() as any;
  const changed = db.prepare(
    `SELECT COUNT(*) AS n FROM speech_analyses_v2 WHERE tonalitaet_original IS NOT NULL`
  ).get() as any;
  console.log(`\n  Total Rows:        ${total.n}`);
  console.log(`  Geänderte Rows:    ${changed.n}`);
  console.log(`  Snapshot:          ${snapshotPath}`);

  db.close();
}

main();
