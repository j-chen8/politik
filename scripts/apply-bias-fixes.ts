#!/usr/bin/env npx tsx
/**
 * Wendet deterministische Mappings auf die 51 Reden an, deren v2.1-Summary
 * ein Tier-A-Wort enthält, das NICHT im Original-Text steht (also klare
 * LLM-Editorialisierung).
 *
 * Mappings sind kontextfrei einfache Substitutionen. Output wird in eine
 * Review-Markdown geschrieben — Claude (Opus) prüft danach pro Rede, ob das
 * Replacement passt oder ob manueller Rewrite nötig ist.
 *
 * Output:
 *   bias-fixes-proposed.jsonl  — pro Rede: original + proposed_new_summary
 *   bias-fixes-review.md       — Markdown für Sichtprüfung
 */

import * as fs from 'node:fs';

// Mappings — kontextarme Default-Substitutionen
// Jedes Mapping ist ein Tupel [Pattern, Replacement]
// Pattern wird mit \b...\b (case-insensitive für Wörter) gematcht
const MAPPINGS: Array<{ pattern: RegExp; replacement: string; note: string }> = [
  // Substantive (case-sensitive)
  { pattern: /\bHeuchelei\b/g, replacement: 'Inkonsistenz', note: 'Heuchelei → Inkonsistenz' },
  { pattern: /\bDoppelmoral\b/g, replacement: 'Inkonsistenz', note: 'Doppelmoral → Inkonsistenz' },
  { pattern: /\bStimmungsmache\b/g, replacement: 'Polemik', note: 'Stimmungsmache → Polemik' },
  { pattern: /\bAbgesang\b/g, replacement: 'Pessimismus', note: 'Abgesang → Pessimismus' },
  { pattern: /\bDiffamierungskampagne\b/g, replacement: 'scharfe Kritik', note: 'Diffamierungskampagne → scharfe Kritik' },
  { pattern: /\bDiffamierungen\b/g, replacement: 'Vorwürfe', note: 'Diffamierungen → Vorwürfe' },
  { pattern: /\bDiffamierung\b/g, replacement: 'Vorwurf', note: 'Diffamierung → Vorwurf' },
  { pattern: /\bSkandalisierungsversuch\b/g, replacement: 'Versuch der scharfen Kritik', note: 'Skandalisierungsversuch → Versuch scharfer Kritik' },
  { pattern: /\bSkandalisierung\b/g, replacement: 'scharfe Kritik', note: 'Skandalisierung → scharfe Kritik' },

  // Verben — Flexionsformen einzeln
  { pattern: /\bskandalisierende\b/gi, replacement: 'scharf kritisierende', note: 'skandalisierende → scharf kritisierende' },
  { pattern: /\bskandalisierte\b/gi, replacement: 'kritisierte scharf', note: 'skandalisierte → kritisierte scharf' },
  { pattern: /\bskandalisiert\b/gi, replacement: 'kritisiert scharf', note: 'skandalisiert → kritisiert scharf' },
  { pattern: /\bskandalisieren\b/gi, replacement: 'scharf kritisieren', note: 'skandalisieren → scharf kritisieren' },

  { pattern: /\bpolemisierte\b/gi, replacement: 'kritisierte scharf', note: 'polemisierte → kritisierte scharf' },
  { pattern: /\bpolemisiere\b/gi, replacement: 'kritisiere scharf', note: 'polemisiere → kritisiere scharf' },
  { pattern: /\bpolemisiert\b/gi, replacement: 'kritisiert scharf', note: 'polemisiert → kritisiert scharf' },
  { pattern: /\bpolemisieren\b/gi, replacement: 'scharf kritisieren', note: 'polemisieren → scharf kritisieren' },

  { pattern: /\bdiffamierende\b/gi, replacement: 'kritisierende', note: 'diffamierende → kritisierende' },
  { pattern: /\bdiffamierte\b/gi, replacement: 'kritisierte', note: 'diffamierte → kritisierte' },
  { pattern: /\bdiffamiert\b/gi, replacement: 'kritisiert', note: 'diffamiert → kritisiert' },
  { pattern: /\bdiffamiere\b/gi, replacement: 'kritisiere', note: 'diffamiere → kritisiere' },
  { pattern: /\bdiffamieren\b/gi, replacement: 'kritisieren', note: 'diffamieren → kritisieren' },

  { pattern: /\bdenunzierte\b/gi, replacement: 'wirft vor', note: 'denunzierte → wirft vor' },
  { pattern: /\bdenunziere\b/gi, replacement: 'werfe vor', note: 'denunziere → werfe vor' },
  { pattern: /\bdenunziert\b/gi, replacement: 'wirft vor', note: 'denunziert → wirft vor' },
  { pattern: /\bdenunzieren\b/gi, replacement: 'vorwerfen', note: 'denunzieren → vorwerfen' },

  { pattern: /\bverdammten\b/gi, replacement: 'scharf abgelehnten', note: 'verdammten → scharf abgelehnten' },
  { pattern: /\bverdammte\b/gi, replacement: 'lehnte scharf ab', note: 'verdammte → lehnte scharf ab' },
  { pattern: /\bverdamme\b/gi, replacement: 'lehne scharf ab', note: 'verdamme → lehne scharf ab' },
  { pattern: /\bverdammt\b/gi, replacement: 'lehnt scharf ab', note: 'verdammt → lehnt scharf ab' },
  { pattern: /\bverdammen\b/gi, replacement: 'scharf ablehnen', note: 'verdammen → scharf ablehnen' },
  { pattern: /\bVerdammung\b/g, replacement: 'scharfe Ablehnung', note: 'Verdammung → scharfe Ablehnung' },

  { pattern: /\bfabuliere\b/gi, replacement: 'behaupte', note: 'fabuliere → behaupte' },
  { pattern: /\bfabuliert\b/gi, replacement: 'behauptet', note: 'fabuliert → behauptet' },
];

interface FixRow {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  sitzung: number;
  v21_summary: string;
  proposed_new_summary: string;
  applied_mappings: string[];
  matched_words_v21: string[];
  original_text_excerpt: string;
}

function applyMappings(text: string): { newText: string; applied: string[] } {
  let result = text;
  const applied: string[] = [];
  for (const m of MAPPINGS) {
    if (m.pattern.test(result)) {
      result = result.replace(m.pattern, m.replacement);
      applied.push(m.note);
    }
  }
  return { newText: result, applied };
}

function main() {
  const data = fs.readFileSync('bias-fix-51.jsonl', 'utf-8').split('\n').filter(Boolean).map(l => JSON.parse(l));

  const fixes: FixRow[] = [];
  for (const r of data) {
    const { newText, applied } = applyMappings(r.v21_summary);
    if (applied.length === 0) {
      console.log(`⚠ #${r.n} ${r.speaker}: keine Mappings angewendet — manueller Fall`);
      continue;
    }
    const ot = r.original_text || '';
    const mid = Math.floor(ot.length / 2);
    fixes.push({
      rede_id: r.rede_id,
      segment_index: r.segment_index,
      speaker: r.speaker,
      party: r.party,
      sitzung: r.sitzung,
      v21_summary: r.v21_summary,
      proposed_new_summary: newText,
      applied_mappings: applied,
      matched_words_v21: r.matched_words_v21,
      original_text_excerpt: ot.slice(Math.max(0, mid - 400), mid + 400),
    });
  }

  fs.writeFileSync('bias-fixes-proposed.jsonl', fixes.map(f => JSON.stringify(f)).join('\n') + '\n');

  // Markdown report
  const md: string[] = [];
  md.push(`# Bias-Fixes Review — ${new Date().toISOString().slice(0, 10)}`);
  md.push('');
  md.push(`**${fixes.length} Reden** mit Tier-A-Wörtern, die NICHT im Original stehen → automatisches Replacement vorgeschlagen.`);
  md.push('');
  md.push(`Sortiert nach Sitzung. Pro Rede: alte v2.1-Summary + neue Version + Original-Auszug. Manuell prüfen ob Replacement sinnvoll.`);
  md.push('');
  fixes.sort((a, b) => a.sitzung - b.sitzung);
  for (let i = 0; i < fixes.length; i++) {
    const f = fixes[i];
    md.push(`---`);
    md.push('');
    md.push(`## ${i + 1}. ${f.speaker} (${f.party}) — Sitzung ${f.sitzung}, ${f.rede_id}`);
    md.push('');
    md.push(`**Mappings:** ${f.applied_mappings.join(' / ')}`);
    md.push('');
    md.push(`**Alt (v2.1):**`);
    md.push(`> ${f.v21_summary.replace(/\n/g, ' ')}`);
    md.push('');
    md.push(`**Neu (mit Mapping):**`);
    md.push(`> ${f.proposed_new_summary.replace(/\n/g, ' ')}`);
    md.push('');
    md.push(`**Original-Auszug:**`);
    md.push('```');
    md.push(f.original_text_excerpt);
    md.push('```');
    md.push('');
    md.push(`☐ ok  ☐ manuell rewriten`);
    md.push('');
  }
  fs.writeFileSync('bias-fixes-review.md', md.join('\n'));

  console.log(`\n✓ ${fixes.length} Fix-Vorschläge geschrieben`);
  console.log(`  bias-fixes-proposed.jsonl`);
  console.log(`  bias-fixes-review.md`);
}

main();
