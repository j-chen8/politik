#!/usr/bin/env npx tsx
/**
 * Zieht ein 200er-Sample aus den 9655 Reden, die KEIN bekanntes wertendes Verb
 * enthalten (also nicht aus den 209 schon klassifizierten).
 *
 * Zweck: Audit-Agent (Claude) liest die 200 durch, sucht nach Bias-Mustern,
 * die die ursprüngliche Wortliste verfehlt — andere wertende Wörter,
 * Distanz-Markierungen, Affirmations-Sprache, Auslassungen.
 *
 * Stratifikation pro Partei proportional zum Anteil im Gesamtbestand.
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

const DB_PATH = 'politik.db';

const KNOWN_VERBEN = [
  'skandalisiert', 'skandalisieren', 'polarisiert', 'polarisieren',
  'entlarvt', 'entlarven', 'demaskiert', 'demaskieren',
  'instrumentalisiert', 'instrumentalisieren', 'polemisiert', 'polemisieren',
  'hetzt', 'hetzen', 'verharmlost', 'verharmlosen',
  'relativiert', 'relativieren', 'fabuliert', 'fabulieren',
  'inszeniert', 'inszenieren', 'demoliert', 'demolieren',
  'demontiert', 'demontieren', 'denunziert', 'denunzieren',
  'diffamiert', 'diffamieren',
];

interface Row {
  rede_id: string;
  speaker: string;
  party: string;
  zusammenfassung_2_saetze: string;
  tonalitaet: string;
  reden_typ: string;
  original_text: string;
}

function hasKnownVerb(s: string): boolean {
  const lc = s.toLowerCase();
  for (const v of KNOWN_VERBEN) {
    const re = new RegExp('\\b' + v.toLowerCase() + '\\b');
    if (re.test(lc)) return true;
  }
  return false;
}

// Deterministisches Random für Reproduzierbarkeit
function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Verwende LIKE-Pattern statt exact-match (Unicode-Robustheit)
const TARGETS: Array<{ name: string; pattern: RegExp; n: number }> = [
  { name: 'AfD',             pattern: /AfD/i,            n: 45 },
  { name: 'SPD',             pattern: /^SPD$/i,           n: 30 },
  { name: 'CDU/CSU',         pattern: /CDU\/CSU/i,        n: 50 },
  { name: 'Grüne',           pattern: /RÜNE/i,            n: 30 },
  { name: 'Linke',           pattern: /linke/i,           n: 22 },
  { name: 'Bundesregierung', pattern: /^$/,               n: 30 },
  { name: 'fraktionslos',    pattern: /fraktionslos/i,    n: 3  },
];

function originalExcerpt(t: string, len: number = 1400): string {
  if (!t) return '';
  if (t.length <= len) return t;
  // Mitte des Texts (interessanter als Anfang/Ende)
  const start = Math.floor((t.length - len) / 2);
  return '…' + t.slice(start, start + len) + '…';
}

function main() {
  const db = new Database(DB_PATH, { readonly: true });

  const all = db.prepare(`
    SELECT s.rede_id, ps.speaker, ps.party, s.zusammenfassung_2_saetze,
           s.tonalitaet, s.reden_typ, ps.original_text
    FROM speech_analyses_v2 s
    JOIN plenar_speeches ps ON s.speech_id = ps.id
    WHERE s.zusammenfassung_2_saetze IS NOT NULL
  `).all() as Row[];

  console.log(`Gesamt-Reden im Pool: ${all.length}`);

  // Filtere die 209 mit wertenden Verben raus
  const candidates = all.filter(r => !hasKnownVerb(r.zusammenfassung_2_saetze));
  console.log(`Davon ohne bekanntes wertendes Verb: ${candidates.length}`);

  // Gruppieren nach Partei via Pattern-Match
  const sampled: Row[] = [];
  const usedIds = new Set<string>();
  for (const target of TARGETS) {
    const pool = candidates.filter(r => {
      if (usedIds.has(r.rede_id)) return false;
      return target.pattern.test(r.party || '');
    });
    const shuffled = seededShuffle(pool, 42);
    const taken = shuffled.slice(0, target.n);
    for (const t of taken) usedIds.add(t.rede_id);
    sampled.push(...taken);
    console.log(`  ${target.name.padEnd(20)} target=${target.n} pool=${pool.length} taken=${taken.length}`);
  }

  // Sortieren: Partei dann rede_id
  sampled.sort((a, b) => {
    if (a.party !== b.party) return a.party.localeCompare(b.party);
    return a.rede_id.localeCompare(b.rede_id);
  });

  // JSONL schreiben
  const out = sampled.map((r, idx) => JSON.stringify({
    n: idx + 1,
    rede_id: r.rede_id,
    party: r.party || '(Bundesregierung)',
    speaker: r.speaker,
    tonalitaet: r.tonalitaet,
    reden_typ: r.reden_typ,
    summary: (r.zusammenfassung_2_saetze || '').replace(/\s+/g, ' ').trim(),
    original_len: (r.original_text || '').length,
    original_excerpt: originalExcerpt(r.original_text || '', 1400),
  })).join('\n') + '\n';

  fs.writeFileSync('bias-audit-broad-200.jsonl', out);
  console.log(`\n✓ ${sampled.length} Reden in bias-audit-broad-200.jsonl`);

  db.close();
}

main();
