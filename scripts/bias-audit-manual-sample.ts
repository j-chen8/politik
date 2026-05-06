#!/usr/bin/env npx tsx
/**
 * bias-audit-manual-sample.ts
 *
 * Zieht 15 stratifizierte Reden für manuelle Bias-Validierung.
 *
 * Strategie: 3 Reden pro Partei × 5 Parteien, mit jeweils einem typischen
 * wertenden Verb. Pro Rede: Summary + Originaltext-Excerpt + Hinweis
 * ob der wertende Verb-Stamm auch im Originaltext vorkommt (Heuristik:
 * wenn ja, hat der Sprecher es selbst verwendet → eher legitim;
 * wenn nein, hat das LLM editorialisiert → eher Bias).
 *
 * Output: bias-audit-manual-sample-2026-05-05.md zum gemeinsamen Lesen.
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

const DB_PATH = 'politik.db';

interface Selection {
  party: string;
  partyMatch: string;        // SQL LIKE pattern
  targetVerb: string;        // exakte Form im Summary
  verbStem: string;          // für Originaltext-Suche (Wortstamm)
  count: number;             // wieviele Reden ziehen
}

const SELECTIONS: Selection[] = [
  { party: 'AfD',     partyMatch: 'AfD',                targetVerb: 'skandalisiert',     verbStem: 'skandal',         count: 3 },
  { party: 'SPD',     partyMatch: 'SPD',                targetVerb: 'entlarvt',          verbStem: 'entlarv',         count: 3 },
  { party: 'Linke',   partyMatch: 'Die Linke',          targetVerb: 'entlarvt',          verbStem: 'entlarv',         count: 3 },
  { party: 'CDU/CSU', partyMatch: 'CDU/CSU',            targetVerb: 'entlarvt',          verbStem: 'entlarv',         count: 3 },
  { party: 'Grüne',   partyMatch: 'GRÜNEN',             targetVerb: 'entlarvt',          verbStem: 'entlarv',         count: 3 },
];

interface Row {
  rede_id: string;
  speaker: string;
  party: string;
  zusammenfassung_2_saetze: string;
  tonalitaet: string;
  original_text: string;
}

function findVerbInOriginal(originalText: string, stem: string): { found: boolean; excerpt: string | null } {
  const lc = originalText.toLowerCase();
  const idx = lc.indexOf(stem.toLowerCase());
  if (idx === -1) return { found: false, excerpt: null };
  // Excerpt: 80 chars vor + 200 chars nach
  const start = Math.max(0, idx - 80);
  const end = Math.min(originalText.length, idx + stem.length + 200);
  return { found: true, excerpt: '…' + originalText.slice(start, end) + '…' };
}

function findVerbInSummary(summary: string, verb: string): string | null {
  const re = new RegExp('.{0,80}\\b' + verb + '\\b.{0,120}', 'i');
  const m = summary.match(re);
  return m ? m[0] : null;
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function originalExcerptAroundVerb(originalText: string, stem: string, fullLen: number = 1200): string {
  const lc = originalText.toLowerCase();
  const idx = lc.indexOf(stem.toLowerCase());
  if (idx === -1) {
    // Verb nicht im Original — zeige Mitte des Texts
    const mid = Math.floor(originalText.length / 2);
    return originalText.slice(Math.max(0, mid - fullLen / 2), Math.min(originalText.length, mid + fullLen / 2));
  }
  const start = Math.max(0, idx - fullLen / 2);
  const end = Math.min(originalText.length, idx + fullLen / 2);
  return (start > 0 ? '…' : '') + originalText.slice(start, end) + (end < originalText.length ? '…' : '');
}

function main() {
  const db = new Database(DB_PATH, { readonly: true });

  const allSelected: Array<{ row: Row; selection: Selection }> = [];

  for (const sel of SELECTIONS) {
    const rows = db.prepare(`
      SELECT s.rede_id, ps.speaker, ps.party, s.zusammenfassung_2_saetze, s.tonalitaet,
             ps.original_text
      FROM speech_analyses_v2 s
      JOIN plenar_speeches ps ON s.speech_id = ps.id
      WHERE ps.party LIKE ?
        AND s.zusammenfassung_2_saetze LIKE ?
      ORDER BY s.rede_id
      LIMIT ?
    `).all(`%${sel.partyMatch}%`, `%${sel.targetVerb}%`, sel.count) as Row[];

    if (rows.length < sel.count) {
      console.log(`⚠ Partei ${sel.party} nur ${rows.length}/${sel.count} Reden mit "${sel.targetVerb}" gefunden`);
    }
    for (const r of rows) allSelected.push({ row: r, selection: sel });
  }

  // Markdown-Report bauen
  const ts = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# Bias-Audit Manual Sample — ${ts}`);
  lines.push('');
  lines.push(`**Zweck:** Validierung der wertende-Verben-Metrik aus Schicht 1.`);
  lines.push(`**Sample:** 15 Reden, je 3 pro Partei, mit dem dominanten wertenden Verb der Partei.`);
  lines.push('');
  lines.push(`## Bewertungs-Schema pro Rede`);
  lines.push('');
  lines.push(`Für jede Rede: ist das wertende Verb in der Zusammenfassung **echter Bias** (LLM editorialisiert) oder **legitim** (Sprecher nutzt das Wort selbst)?`);
  lines.push('');
  lines.push(`- ✅ **legitim**: Sprecher verwendet das Verb (oder klare Synonyme) selbst im Originaltext`);
  lines.push(`- ⚠️ **Grenzfall**: Sprecher nutzt das Verb nicht, aber die Beschreibung ist sachlich-akkurat ohne politische Färbung`);
  lines.push(`- ❌ **echter Bias**: Sprecher nutzt das Verb nicht, und das Verb färbt die Wiedergabe in eine Wertung (positiv/negativ)`);
  lines.push('');
  lines.push(`## Heuristik-Vorab-Markierung`);
  lines.push('');
  lines.push(`Pro Rede ist unter "Verb-Stamm im Original" markiert, ob der Wortstamm auch im Original-Text vorkommt.`);
  lines.push(`- ✓ ja → Sprecher hat ähnliches gesagt → eher legitim`);
  lines.push(`- ✗ nein → LLM hat das Verb hinzugefügt → eher Bias`);
  lines.push('');
  lines.push(`Diese Heuristik ist nicht perfekt — Synonyme zählen mit, aber nicht alle. Bitte trotzdem den Original-Auszug lesen.`);
  lines.push('');

  // Sortierung: nach Partei
  allSelected.sort((a, b) => {
    if (a.selection.party !== b.selection.party) return a.selection.party.localeCompare(b.selection.party);
    return a.row.rede_id.localeCompare(b.row.rede_id);
  });

  let i = 0;
  for (const { row, selection } of allSelected) {
    i++;
    const verbCheck = findVerbInOriginal(row.original_text || '', selection.verbStem);
    const summarySnippet = findVerbInSummary(row.zusammenfassung_2_saetze || '', selection.targetVerb);
    const excerpt = originalExcerptAroundVerb(row.original_text || '', selection.verbStem, 1500);

    lines.push(`---`);
    lines.push('');
    lines.push(`## ${i}. ${row.speaker} (${row.party}) — Rede ${row.rede_id}`);
    lines.push('');
    lines.push(`- **Tonalität:** ${row.tonalitaet}`);
    lines.push(`- **Wertendes Verb in Summary:** \`${selection.targetVerb}\``);
    lines.push(`- **Verb-Stamm im Original:** ${verbCheck.found ? `✓ JA — Excerpt: ${verbCheck.excerpt}` : '✗ NEIN — Sprecher nutzt diesen Wortstamm nicht'}`);
    lines.push('');
    lines.push(`### Zusammenfassung (LLM-generiert)`);
    lines.push('');
    lines.push(`> ${row.zusammenfassung_2_saetze.replace(/\n/g, ' ')}`);
    lines.push('');
    if (summarySnippet) {
      lines.push(`**Highlighted snippet:** "...${summarySnippet}..."`);
      lines.push('');
    }
    lines.push(`### Originaltext (Auszug, ${row.original_text.length} Zeichen total)`);
    lines.push('');
    lines.push('```');
    lines.push(excerpt);
    lines.push('```');
    lines.push('');
    lines.push(`### Bewertung`);
    lines.push('');
    lines.push(`☐ legitim    ☐ Grenzfall    ☐ echter Bias`);
    lines.push('');
    lines.push(`Begründung:`);
    lines.push('');
  }

  // Auswertungs-Vorlage
  lines.push(`---`);
  lines.push('');
  lines.push(`## Auswertung`);
  lines.push('');
  lines.push(`| Rate | Anzahl von 15 |`);
  lines.push(`|---|---:|`);
  lines.push(`| ✅ legitim | _ |`);
  lines.push(`| ⚠️ Grenzfall | _ |`);
  lines.push(`| ❌ echter Bias | _ |`);
  lines.push('');
  lines.push(`**Direction-Pattern:**`);
  lines.push('- AfD-`skandalisiert`: _ legitim / _ Grenzfall / _ Bias');
  lines.push('- SPD/Linke/Grüne/CDU-`entlarvt`: _ legitim / _ Grenzfall / _ Bias');
  lines.push('');
  lines.push(`**Schluss:**`);
  lines.push('');

  const outPath = `bias-audit-manual-sample-${ts}.md`;
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`✓ ${outPath} geschrieben (${i} Reden)`);

  db.close();
}

main();
