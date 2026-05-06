#!/usr/bin/env npx tsx
/**
 * Auswertung des Bias-Korrektur-Re-Batches.
 *
 * 1. Konfidenz-Verteilung (Haikus Self-Check)
 * 2. Wortliste-Filter auf neue Summaries — welche der 400 haben TROTZ v2.1
 *    immer noch ein wertendes Wort drin? (Doppel-Validierung gegen
 *    Self-Bias-Confirmation)
 * 3. Vorher/Nachher-Vergleich (v1-Original vs v2.1-Korrektur)
 * 4. Markdown-Report für manuellen Review
 *
 * Output: bias-corrections-review.md
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

const DB_PATH = 'politik.db';
const OUT_PATH = 'bias-corrections-review.md';

// Gleiche Tier-A-Wortliste wie im Audit
const TIER_A_VERB_STEMS = ['skandalisier', 'polemisier', 'diffamier', 'denunzier', 'verdamm', 'fabulier'];
const TIER_A_NOUNS = ['Heuchelei', 'Doppelmoral', 'Stimmungsmache', 'Abgesang'];

function findTierAWord(text: string): string | null {
  if (!text) return null;
  for (const stem of TIER_A_VERB_STEMS) {
    const re = new RegExp('\\b' + stem + '\\w*', 'i');
    const m = text.match(re);
    if (m) return m[0];
  }
  for (const noun of TIER_A_NOUNS) {
    const re = new RegExp('\\b' + noun + '\\b');
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

interface CorrectionRow {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  konfidenz: string | null;
  wertende_woerter_eigene_count: number;
  v21_summary: string | null;
  v21_self_check: string | null;
  v1_summary: string | null;
  original_text: string;
  v1_matched_word: string;
  llama_classification: string;
}

function loadV1AuditMatches(): Map<string, { word: string; class: string }> {
  const map = new Map<string, { word: string; class: string }>();
  if (!fs.existsSync('bias-audit-tier-a-only.jsonl')) return map;
  for (const line of fs.readFileSync('bias-audit-tier-a-only.jsonl', 'utf-8').split('\n').filter(Boolean)) {
    try {
      const r = JSON.parse(line);
      const k = `${r.rede_id}_${r.segment_index}`;
      map.set(k, { word: r.matched_word, class: r.classification });
    } catch {}
  }
  return map;
}

function main() {
  const db = new Database(DB_PATH, { readonly: true });

  const tableCheck = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='speech_analyses_v2_corrections'"
  ).get();
  if (!tableCheck) {
    console.error('Tabelle speech_analyses_v2_corrections existiert nicht.');
    console.error('Erst: npx tsx scripts/batch-retrieve-corrections.ts --apply');
    process.exit(1);
  }

  const v1Audit = loadV1AuditMatches();

  // Join: corrections + plenar_speeches + originale v2-Summary
  const rows = db.prepare(`
    SELECT
      c.rede_id, c.segment_index,
      ps.speaker, ps.party, ps.original_text,
      c.konfidenz, c.wertende_woerter_eigene_count,
      c.zusammenfassung_2_saetze AS v21_summary,
      c.neutralitaets_self_check_json AS v21_self_check,
      v2.zusammenfassung_2_saetze AS v1_summary
    FROM speech_analyses_v2_corrections c
    JOIN plenar_speeches ps ON c.speech_id = ps.id
    LEFT JOIN speech_analyses_v2 v2 ON v2.rede_id = c.rede_id AND v2.segment_index = c.segment_index
    WHERE c.error_type IS NULL
    ORDER BY c.rede_id, c.segment_index
  `).all() as any[];

  console.log(`Korrektur-Resultate: ${rows.length}`);

  // 1. Konfidenz-Verteilung
  const konfDist: Record<string, number> = { hoch: 0, mittel: 0, niedrig: 0, null: 0 };
  for (const r of rows) konfDist[r.konfidenz || 'null']++;
  console.log('\n=== Haiku-Self-Check Konfidenz ===');
  for (const [k, n] of Object.entries(konfDist)) {
    if (n === 0) continue;
    console.log(`  ${k.padEnd(10)} ${n}  (${((100 * n) / rows.length).toFixed(0)}%)`);
  }

  // 2. Wortliste-Filter auf neue Summaries (unabhängige Validierung)
  let stillBiased = 0;
  const stillBiasedRows: any[] = [];
  for (const r of rows) {
    const newWord = findTierAWord(r.v21_summary || '');
    if (newWord) {
      stillBiased++;
      stillBiasedRows.push({ ...r, v21_matched: newWord });
    }
  }
  console.log(`\n=== Wortliste auf v2.1-Output ===`);
  console.log(`  Reden mit Tier-A-Wort in v2.1-Summary: ${stillBiased} / ${rows.length} (${((100 * stillBiased) / rows.length).toFixed(1)}%)`);
  console.log(`  → Reduktion: 400 (v1) → ${stillBiased} (v2.1)`);

  // 3. Manuelle Review-Liste
  // Kriterium: konfidenz ≠ "hoch" ODER Tier-A-Wort in v2.1-Summary
  const reviewList = rows.filter((r) => {
    const lowConf = r.konfidenz !== 'hoch';
    const stillHasWord = !!findTierAWord(r.v21_summary || '');
    return lowConf || stillHasWord;
  });
  console.log(`\n=== Manuelle Review-Liste ===`);
  console.log(`  Reden zum Lesen: ${reviewList.length}`);

  // 4. Markdown-Report
  const lines: string[] = [];
  lines.push(`# Bias-Korrektur Review — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`## Übersicht`);
  lines.push('');
  lines.push(`- v1-Audit identifizierte: **400 Reden** mit Tier-A-Wort als LLM-Editorialisierung`);
  lines.push(`- v2.1-Re-Batch: **${rows.length} Resultate**`);
  lines.push(`- Self-Check Konfidenz: ${konfDist.hoch || 0} hoch / ${konfDist.mittel || 0} mittel / ${konfDist.niedrig || 0} niedrig`);
  lines.push(`- Trotz v2.1 noch Tier-A-Wort in Summary: **${stillBiased}** (${((100 * stillBiased) / rows.length).toFixed(1)}%)`);
  lines.push(`- Manueller Review nötig: **${reviewList.length}** (Konfidenz nicht "hoch" ODER Wortliste-Treffer)`);
  lines.push('');
  lines.push(`## Methodik`);
  lines.push('');
  lines.push(`Reden werden manuell geprüft, falls eine der zwei unabhängigen Indikatoren anschlägt:`);
  lines.push(`1. **Haiku-Self-Check** (subjektiv, durch v2.1-H10): konfidenz = "mittel" oder "niedrig"`);
  lines.push(`2. **Externe Wortliste** (objektiv, gleiche Liste wie v1-Audit): Tier-A-Wort in v2.1-Summary`);
  lines.push('');

  // Group: konfidenz=niedrig zuerst, dann konfidenz=mittel, dann nur-wortliste-flag
  const groups = {
    'Konfidenz: niedrig': reviewList.filter(r => r.konfidenz === 'niedrig'),
    'Konfidenz: mittel': reviewList.filter(r => r.konfidenz === 'mittel'),
    'Konfidenz: hoch + Wortliste-Flag': reviewList.filter(r => r.konfidenz === 'hoch' && findTierAWord(r.v21_summary || '')),
    'Konfidenz: null/error': reviewList.filter(r => !r.konfidenz || (r.konfidenz !== 'hoch' && r.konfidenz !== 'mittel' && r.konfidenz !== 'niedrig')),
  };

  for (const [groupName, groupRows] of Object.entries(groups)) {
    if (groupRows.length === 0) continue;
    lines.push(`---`);
    lines.push('');
    lines.push(`## ${groupName} (${groupRows.length} Reden)`);
    lines.push('');
    let i = 0;
    for (const r of groupRows) {
      i++;
      const audit = v1Audit.get(`${r.rede_id}_${r.segment_index}`);
      const v21Word = findTierAWord(r.v21_summary || '');
      lines.push(`### ${i}. ${r.speaker} (${r.party || '(Reg)'}) — ${r.rede_id}`);
      lines.push('');
      lines.push(`- **v1-flagged Wort:** \`${audit?.word || '?'}\``);
      if (v21Word) lines.push(`- **v2.1 enthält noch:** \`${v21Word}\``);
      lines.push(`- **Self-Check:** konfidenz=\`${r.konfidenz}\`, count_eigene=${r.wertende_woerter_eigene_count}`);
      if (r.v21_self_check) {
        try {
          const sc = JSON.parse(r.v21_self_check);
          if (sc.wertende_woerter_eigene && sc.wertende_woerter_eigene.length > 0) {
            lines.push(`  - Wörter (laut Haiku selbst): ${sc.wertende_woerter_eigene.map((w: string) => `\`${w}\``).join(', ')}`);
          }
          if (sc.begruendung_falls_unsicher) {
            lines.push(`  - Begründung: ${sc.begruendung_falls_unsicher}`);
          }
        } catch {}
      }
      lines.push('');
      lines.push(`**v1-Summary (alt):**`);
      lines.push(`> ${(r.v1_summary || '(fehlt)').replace(/\n/g, ' ')}`);
      lines.push('');
      lines.push(`**v2.1-Summary (neu):**`);
      lines.push(`> ${(r.v21_summary || '(fehlt)').replace(/\n/g, ' ')}`);
      lines.push('');
      lines.push(`**Original-Auszug (Mitte, ~600 chars):**`);
      const ot = r.original_text || '';
      const mid = Math.floor(ot.length / 2);
      const excerpt = ot.slice(Math.max(0, mid - 300), mid + 300);
      lines.push('```');
      lines.push((mid > 300 ? '…' : '') + excerpt + (mid + 300 < ot.length ? '…' : ''));
      lines.push('```');
      lines.push('');
      lines.push(`**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten`);
      lines.push('');
    }
  }

  fs.writeFileSync(OUT_PATH, lines.join('\n'));
  console.log(`\n✓ Review-Report: ${OUT_PATH}`);

  // 5. Quote-Validation Vergleich
  const qv = db.prepare(`
    SELECT
      SUM(quote_valid_count) AS valid,
      SUM(quote_total_count) AS total
    FROM speech_analyses_v2_corrections
    WHERE error_type IS NULL
  `).get() as any;
  if (qv?.total) {
    console.log(`\nQuote-Validation: ${qv.valid}/${qv.total} = ${((100 * qv.valid) / qv.total).toFixed(1)}%`);
  }

  db.close();
}

main();
