#!/usr/bin/env npx tsx
/**
 * Schreibt alle ~222 Reden mit wertenden Verben in eine kompakte JSONL,
 * damit der Audit-Agent sie sequenziell lesen und klassifizieren kann.
 *
 * Format pro Zeile:
 *   {n, rede_id, party, speaker, verb, verb_in_original (✓/✗),
 *    original_excerpt (1200 Zeichen um Verb-Stelle), summary}
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

const DB_PATH = 'politik.db';

const WERTENDE_VERBEN = [
  'skandalisiert', 'skandalisieren',
  'polarisiert', 'polarisieren',
  'entlarvt', 'entlarven',
  'demaskiert', 'demaskieren',
  'instrumentalisiert', 'instrumentalisieren',
  'polemisiert', 'polemisieren',
  'hetzt', 'hetzen',
  'verharmlost', 'verharmlosen',
  'relativiert', 'relativieren',
  'fabuliert', 'fabulieren',
  'inszeniert', 'inszenieren',
  'demoliert', 'demolieren',
  'demontiert', 'demontieren',
  'denunziert', 'denunzieren',
  'diffamiert', 'diffamieren',
];

// Stamm-Mapping für „im-Original"-Heuristik
const VERB_STEMS: Record<string, string> = {
  'skandalisiert': 'skandal', 'skandalisieren': 'skandal',
  'polarisiert': 'polari', 'polarisieren': 'polari',
  'entlarvt': 'entlarv', 'entlarven': 'entlarv',
  'demaskiert': 'demask', 'demaskieren': 'demask',
  'instrumentalisiert': 'instrumentali', 'instrumentalisieren': 'instrumentali',
  'polemisiert': 'polemi', 'polemisieren': 'polemi',
  'hetzt': 'hetz', 'hetzen': 'hetz',
  'verharmlost': 'verharmlos', 'verharmlosen': 'verharmlos',
  'relativiert': 'relativi', 'relativieren': 'relativi',
  'fabuliert': 'fabuli', 'fabulieren': 'fabuli',
  'inszeniert': 'inszeni', 'inszenieren': 'inszeni',
  'demoliert': 'demoli', 'demolieren': 'demoli',
  'demontiert': 'demonti', 'demontieren': 'demonti',
  'denunziert': 'denunzi', 'denunzieren': 'denunzi',
  'diffamiert': 'diffami', 'diffamieren': 'diffami',
};

interface Row {
  rede_id: string;
  speaker: string;
  party: string;
  zusammenfassung_2_saetze: string;
  tonalitaet: string;
  original_text: string;
}

function findFirstVerb(summary: string): string | null {
  const lc = summary.toLowerCase();
  for (const v of WERTENDE_VERBEN) {
    const re = new RegExp('\\b' + v.toLowerCase() + '\\b');
    if (re.test(lc)) return v;
  }
  return null;
}

function verbInOriginal(originalText: string, stem: string): boolean {
  return originalText.toLowerCase().includes(stem.toLowerCase());
}

function originalExcerpt(originalText: string, stem: string, len: number = 1200): string {
  const lc = originalText.toLowerCase();
  const idx = lc.indexOf(stem.toLowerCase());
  if (idx === -1) {
    // Verb nicht im Original — Mitte des Texts
    const mid = Math.floor(originalText.length / 2);
    const start = Math.max(0, mid - len / 2);
    const end = Math.min(originalText.length, mid + len / 2);
    return originalText.slice(start, end);
  }
  const start = Math.max(0, idx - len / 2);
  const end = Math.min(originalText.length, idx + len / 2);
  return originalText.slice(start, end);
}

function main() {
  const db = new Database(DB_PATH, { readonly: true });

  // Alle Reden mit irgendeinem wertenden Verb
  const allRows = db.prepare(`
    SELECT s.rede_id, ps.speaker, ps.party, s.zusammenfassung_2_saetze, s.tonalitaet,
           ps.original_text
    FROM speech_analyses_v2 s
    JOIN plenar_speeches ps ON s.speech_id = ps.id
    WHERE s.zusammenfassung_2_saetze IS NOT NULL
  `).all() as Row[];

  const matched: any[] = [];
  let i = 0;
  for (const r of allRows) {
    const verb = findFirstVerb(r.zusammenfassung_2_saetze || '');
    if (!verb) continue;
    i++;
    const stem = VERB_STEMS[verb] || verb;
    matched.push({
      n: i,
      rede_id: r.rede_id,
      party: r.party,
      speaker: r.speaker,
      tonalitaet: r.tonalitaet,
      verb,
      verb_in_original: verbInOriginal(r.original_text || '', stem),
      original_len: (r.original_text || '').length,
      original_excerpt: originalExcerpt(r.original_text || '', stem, 1200),
      summary: (r.zusammenfassung_2_saetze || '').replace(/\s+/g, ' ').trim(),
    });
  }

  // Sortieren: nach Partei, dann Verb, dann rede_id
  matched.sort((a, b) => {
    if (a.party !== b.party) return a.party.localeCompare(b.party);
    if (a.verb !== b.verb) return a.verb.localeCompare(b.verb);
    return a.rede_id.localeCompare(b.rede_id);
  });

  // Re-numerieren nach Sortierung
  matched.forEach((m, idx) => m.n = idx + 1);

  const out = matched.map(m => JSON.stringify(m)).join('\n');
  fs.writeFileSync('bias-audit-all-222.jsonl', out + '\n');

  console.log(`✓ ${matched.length} Reden in bias-audit-all-222.jsonl`);
  console.log('\nVerteilung pro Partei:');
  const byParty: Record<string, number> = {};
  for (const m of matched) byParty[m.party] = (byParty[m.party] || 0) + 1;
  for (const [p, n] of Object.entries(byParty).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${p.padEnd(40)} ${n}`);
  }
  console.log('\nVerteilung pro Verb:');
  const byVerb: Record<string, number> = {};
  for (const m of matched) byVerb[m.verb] = (byVerb[m.verb] || 0) + 1;
  for (const [v, n] of Object.entries(byVerb).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v.padEnd(28)} ${n}`);
  }

  db.close();
}

main();
