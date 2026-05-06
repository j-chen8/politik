#!/usr/bin/env npx tsx
/**
 * Exportiert die 142 Klasse-A+B-Reden (Wortliste-Hit in v2.1-Summary)
 * in JSONL für strukturierten manuellen Review.
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

const TIER_A_VERB_STEMS = ['skandalisier', 'polemisier', 'diffamier', 'denunzier', 'verdamm', 'fabulier'];
const TIER_A_NOUNS = ['Heuchelei', 'Doppelmoral', 'Stimmungsmache', 'Abgesang'];

function findWord(text: string): string | null {
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

function findAllWords(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const stem of TIER_A_VERB_STEMS) {
    const re = new RegExp('\\b' + stem + '\\w*', 'gi');
    const m = text.match(re);
    if (m) found.push(...m);
  }
  for (const noun of TIER_A_NOUNS) {
    const re = new RegExp('\\b' + noun + '\\b', 'g');
    const m = text.match(re);
    if (m) found.push(...m);
  }
  return found;
}

const db = new Database('politik.db', { readonly: true });

const rows = db.prepare(`
  SELECT
    c.rede_id, c.segment_index,
    ps.speaker, ps.party,
    ses.sitzung, ses.datum,
    ps.topic_title,
    ps.original_text,
    c.zusammenfassung_2_saetze AS v21_summary,
    c.konfidenz, c.wertende_woerter_eigene_count,
    c.neutralitaets_self_check_json,
    v2.zusammenfassung_2_saetze AS v1_summary
  FROM speech_analyses_v2_corrections c
  JOIN plenar_speeches ps ON c.speech_id = ps.id
  JOIN plenar_sessions ses ON ps.session_id = ses.id
  LEFT JOIN speech_analyses_v2 v2 ON v2.rede_id = c.rede_id AND v2.segment_index = c.segment_index
  WHERE c.error_type IS NULL
  ORDER BY ses.sitzung, c.rede_id, c.segment_index
`).all() as any[];

let n = 0;
const out: any[] = [];
for (const r of rows) {
  const v21Words = findAllWords(r.v21_summary || '');
  if (v21Words.length === 0) continue; // nur Klasse A+B
  n++;
  const klass = (r.konfidenz === 'mittel' || r.konfidenz === 'niedrig' || !r.konfidenz) ? 'A' : 'B';
  out.push({
    n,
    klass,
    rede_id: r.rede_id,
    segment_index: r.segment_index,
    sitzung: r.sitzung,
    datum: r.datum,
    speaker: r.speaker,
    party: r.party || '(Bundesregierung)',
    topic: r.topic_title,
    matched_words_v21: v21Words,
    konfidenz: r.konfidenz,
    self_check: r.neutralitaets_self_check_json,
    v1_summary: r.v1_summary,
    v21_summary: r.v21_summary,
    original_text: r.original_text,
  });
}

fs.writeFileSync('bias-class-ab.jsonl', out.map(o => JSON.stringify(o)).join('\n') + '\n');
console.log(`✓ ${n} Reden in bias-class-ab.jsonl`);

// Stats
const byKlass: Record<string, number> = {};
const bySitzung: Record<number, number> = {};
for (const o of out) {
  byKlass[o.klass] = (byKlass[o.klass] || 0) + 1;
  bySitzung[o.sitzung] = (bySitzung[o.sitzung] || 0) + 1;
}
console.log('\nKlasse A:', byKlass.A, '| Klasse B:', byKlass.B);
console.log('Sitzungen mit Reviews:', Object.keys(bySitzung).length);

db.close();
