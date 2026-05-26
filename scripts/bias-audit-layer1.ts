#!/usr/bin/env npx tsx
/**
 * bias-audit-layer1.ts
 *
 * Schicht 1 des Bias-Audits auf speech_analyses_v2 (9.913 Reden).
 *
 * **Wichtige methodische Klarstellung:**
 * Aggregierte Tonalitäts-Verteilungen pro Partei sind KEIN Bias-Indikator —
 * empirische Asymmetrie (manche Parteien tatsächlich polemischer als andere)
 * spiegelt sich legitim in Klassifikations-Verteilungen.
 *
 * Bias-relevant misst dieses Skript ausschließlich:
 *   - Wertende Verben in zusammenfassung_2_saetze (sollten 0 sein, JEDE Partei)
 *   - Deskriptiv-aggressive Verben (asymmetrie-Auffälligkeit als Hinweis)
 *   - Quote-Längen pro Partei (Schlagwort-Picking-Indikator)
 *   - H-Flag-Rate pro Partei
 *
 * Aggregate Tonalitäts-/Forderungen-Verteilung wird AUCH ausgegeben,
 * aber explizit als „nicht Bias-Indikator, deskriptiv" gekennzeichnet.
 */

import Database from 'better-sqlite3';

const DB_PATH = 'politik.db';

// Wertende Verben — sollten in JEDER Summary 0 sein, egal welche Partei.
// Asymmetrische Verteilung = ECHTER Bias-Indikator.
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
  'brüstet sich', 'brüsten',
  'demoliert', 'demolieren',
  'demontiert', 'demontieren',
  'denunziert', 'denunzieren',
  'diffamiert', 'diffamieren',
  'unterstellt fälschlich',
  'behauptet ohne Beleg',
  'warnt zu Recht', 'kritisiert zu Recht', 'fordert zu Recht',
];

// Deskriptiv-aggressive Verben — kontextabhängig, asymmetrische Verteilung als Hinweis
const AGGRESSIVE_DESKRIPTIVE = [
  'attackiert', 'attackieren',
  'wirft vor', 'wirft .{1,30} vor',
  'unterstellt', 'unterstellen',
  'behauptet', 'behaupten',
  'wettert',
];

// Neutral-deskriptive Verben — Vergleichsbaseline
const NEUTRAL_DESKRIPTIVE = [
  'fordert', 'fordern',
  'kritisiert', 'kritisieren',
  'lehnt ab', 'lehnen ab', 'lehnt .{1,30} ab',
  'argumentiert', 'argumentieren',
  'präsentiert', 'präsentieren',
  'thematisiert', 'thematisieren',
  'legt dar', 'darlegen',
  'verteidigt', 'verteidigen',
  'bilanziert', 'bilanzieren',
];

interface AnalysisRow {
  rede_id: string;
  party: string;
  tonalitaet: string;
  forderungen_json: string;
  woertliche_zitate_json: string;
  framing_marker_json: string;
  anti_hallucination_flags_json: string;
  zusammenfassung_2_saetze: string;
  original_text_length: number;
  zus_length: number;
}

function normalizeParty(p: string | null): string {
  if (!p) return '(unbekannt)';
  const v = p.toLowerCase().trim();
  if (v.includes('cdu') || v.includes('csu')) return 'CDU/CSU';
  if (v.includes('spd')) return 'SPD';
  if (v.includes('grün') || v.includes('grun')) return 'Grüne';
  if (v.includes('linke') || v === 'die linke') return 'Linke';
  if (v.includes('afd')) return 'AfD';
  if (v.includes('fdp')) return 'FDP';
  if (v.includes('regierung') || v.includes('bmin') || v.includes('bm ')) return 'Bundesregierung';
  if (v.includes('fraktionslos') || v === 'fl') return 'Fraktionslos';
  return p;
}

function countMatches(text: string, patterns: string[]): { total: number; perPattern: Record<string, number> } {
  const lc = text.toLowerCase();
  const perPattern: Record<string, number> = {};
  let total = 0;
  for (const p of patterns) {
    const re = new RegExp('\\b' + p.toLowerCase().replace(/\s+/g, '\\s+') + '\\b', 'g');
    const m = lc.match(re);
    const n = m ? m.length : 0;
    if (n > 0) {
      perPattern[p] = n;
      total += n;
    }
  }
  return { total, perPattern };
}

function tryParseJsonArray(s: string | null): any[] {
  if (!s) return [];
  try { return JSON.parse(s); } catch { return []; }
}

function fmtPct(num: number, den: number): string {
  if (den === 0) return ' n/a ';
  return `${(100 * num / den).toFixed(2)}%`;
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n);
}
function rpad(s: string | number, n: number): string {
  return String(s).padStart(n);
}

function main() {
  console.log('=== Bias-Audit Schicht 1 — Strukturelle Indikatoren ===');
  console.log(`Datum: ${new Date().toISOString().slice(0, 10)}`);
  console.log('');

  const db = new Database(DB_PATH, { readonly: true });

  // Join speech_analyses_v2 ↔ plenar_speeches für party + original_text
  const rows = db.prepare(`
    SELECT s.rede_id, s.tonalitaet, s.forderungen_json, s.woertliche_zitate_json,
           s.framing_marker_json, s.anti_hallucination_flags_json, s.zusammenfassung_2_saetze,
           ps.party, length(ps.original_text) AS original_text_length,
           length(s.zusammenfassung_2_saetze) AS zus_length
    FROM speech_analyses_v2 s
    JOIN plenar_speeches ps ON s.speech_id = ps.id
    WHERE s.zusammenfassung_2_saetze IS NOT NULL
  `).all() as AnalysisRow[];

  console.log(`Total Reden im Audit-Scope: ${rows.length}`);
  console.log('');

  // Gruppieren nach normalisierter Partei
  const byParty: Record<string, AnalysisRow[]> = {};
  for (const r of rows) {
    const p = normalizeParty(r.party);
    (byParty[p] ||= []).push(r);
  }

  const partySorted = Object.keys(byParty).sort((a, b) => byParty[b].length - byParty[a].length);

  // ===== 1) WERTENDE VERBEN — Bias-relevant =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1) WERTENDE VERBEN in zusammenfassung_2_saetze (Bias-relevant)');
  console.log('   Sollten in JEDER Summary 0 sein. Asymmetrische Verteilung = Bias.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(pad('Partei', 16) + rpad('Reden', 8) + rpad('Treffer', 10) + rpad('pro 100 Reden', 16));
  const wertendeStats: Record<string, { hits: number; n: number; perPattern: Record<string, number> }> = {};
  for (const party of partySorted) {
    let hits = 0;
    const perPatternAcc: Record<string, number> = {};
    for (const r of byParty[party]) {
      const result = countMatches(r.zusammenfassung_2_saetze || '', WERTENDE_VERBEN);
      hits += result.total;
      for (const [pat, n] of Object.entries(result.perPattern)) {
        perPatternAcc[pat] = (perPatternAcc[pat] || 0) + n;
      }
    }
    wertendeStats[party] = { hits, n: byParty[party].length, perPattern: perPatternAcc };
    const per100 = hits / byParty[party].length * 100;
    console.log(pad(party, 16) + rpad(byParty[party].length, 8) + rpad(hits, 10) + rpad(per100.toFixed(2), 16));
  }

  console.log('');
  console.log('  Top wertende Verben pro Partei (wenn Treffer):');
  for (const party of partySorted) {
    const s = wertendeStats[party];
    if (s.hits === 0) continue;
    const top = Object.entries(s.perPattern).sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`  ${pad(party, 16)} ${top.map(([p, n]) => `${p}(${n})`).join(', ')}`);
  }
  console.log('');

  // ===== 2) DESKRIPTIV-AGGRESSIVE VERBEN =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2) DESKRIPTIV-AGGRESSIVE VERBEN (kontextabhängig)');
  console.log('   Akzeptabel wenn Sprecher tatsächlich attackiert. Aber:');
  console.log('   asymmetrische Verteilung kann auf Wording-Bias hindeuten.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(pad('Partei', 16) + rpad('aggr.', 8) + rpad('neutral', 10) + rpad('Ratio aggr/neutral', 22));
  for (const party of partySorted) {
    let aggressiveHits = 0;
    let neutralHits = 0;
    for (const r of byParty[party]) {
      aggressiveHits += countMatches(r.zusammenfassung_2_saetze || '', AGGRESSIVE_DESKRIPTIVE).total;
      neutralHits += countMatches(r.zusammenfassung_2_saetze || '', NEUTRAL_DESKRIPTIVE).total;
    }
    const ratio = neutralHits === 0 ? 'inf' : (aggressiveHits / neutralHits).toFixed(3);
    console.log(pad(party, 16) + rpad(aggressiveHits, 8) + rpad(neutralHits, 10) + rpad(ratio, 22));
  }
  console.log('');
  console.log('  Lese-Hilfe: höhere Ratio = mehr aggressive vs. neutrale Verben.');
  console.log('  Wenn Partei-Ratios stark divergieren bei vergleichbarem Polemik-Niveau,');
  console.log('  ist das ein Wording-Bias-Indikator. Bei AfD/Linke ist hohe Ratio empirisch erwartbar.');
  console.log('');

  // ===== 3) QUOTE-LÄNGEN-VERTEILUNG =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3) QUOTE-LÄNGEN-VERTEILUNG (woertliche_zitate_json)');
  console.log('   Auffällig kurze Quotes können Schlagwort-Picking sein.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(pad('Partei', 16) + rpad('Reden', 8) + rpad('Quotes ges.', 14) + rpad('Ø Q/Rede', 12) + rpad('Ø Länge', 12) + rpad('Median Länge', 14));
  for (const party of partySorted) {
    let totalQuotes = 0;
    const lengths: number[] = [];
    for (const r of byParty[party]) {
      const quotes = tryParseJsonArray(r.woertliche_zitate_json);
      totalQuotes += quotes.length;
      for (const q of quotes) lengths.push(typeof q === 'string' ? q.length : 0);
    }
    const avgQ = totalQuotes / byParty[party].length;
    const avgLen = lengths.length === 0 ? 0 : lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];
    console.log(pad(party, 16) + rpad(byParty[party].length, 8) + rpad(totalQuotes, 14) + rpad(avgQ.toFixed(2), 12) + rpad(avgLen.toFixed(0), 12) + rpad(median, 14));
  }
  console.log('');

  // ===== 4) ANTI-HALLUCINATION-FLAG-RATE =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4) ANTI-HALLUCINATION-FLAG-RATE pro Partei');
  console.log('   H1-H9 sollten dort ausgelöst werden, wo das Risiko inhärent ist.');
  console.log('   Asymmetrie kann reflektieren: empirisches Risiko ODER Modell-Misstrauen.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(pad('Partei', 16) + rpad('Reden', 8) + rpad('mit Flag', 10) + rpad('% Flag-Rate', 14));
  for (const party of partySorted) {
    let flagged = 0;
    for (const r of byParty[party]) {
      const flags = tryParseJsonArray(r.anti_hallucination_flags_json);
      if (flags.length > 0) flagged++;
    }
    console.log(pad(party, 16) + rpad(byParty[party].length, 8) + rpad(flagged, 10) + rpad(fmtPct(flagged, byParty[party].length), 14));
  }
  console.log('');

  // ===== 5) DESKRIPTIV: TONALITÄTS-VERTEILUNG (NICHT Bias-Indikator) =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5) TONALITÄTS-VERTEILUNG pro Partei (DESKRIPTIV, NICHT Bias-Indikator)');
  console.log('   Empirische Asymmetrie ist erwartbar (manche Parteien polemischer).');
  console.log('   Verwendung: Anomalien für Schicht 2 stratifizieren.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tonValues = ['polemisch', 'polemisch_sachlich', 'konfrontativ_faktenrhetorisch', 'sachlich',
    'defensiv_pragmatisch', 'bilanzierend_werbend', 'staatsmaennisch', 'sozial_anklagend',
    'mahnend', 'emotional_persoenlich', 'ironisch_jugendlich'];

  const header = pad('Partei', 14) + tonValues.map(t => rpad(t.slice(0, 12), 13)).join('');
  console.log(header);
  for (const party of partySorted) {
    const counts: Record<string, number> = {};
    for (const r of byParty[party]) counts[r.tonalitaet] = (counts[r.tonalitaet] || 0) + 1;
    const n = byParty[party].length;
    const cells = tonValues.map(t => rpad((counts[t] ? `${(100 * counts[t] / n).toFixed(1)}%` : '–'), 13));
    console.log(pad(party, 14) + cells.join(''));
  }
  console.log('');

  // ===== Zusammenfassung =====
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ZUSAMMENFASSUNG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const totalWertende = Object.values(wertendeStats).reduce((s, x) => s + x.hits, 0);
  const totalReden = rows.length;
  console.log(`  Total wertende Verben: ${totalWertende} in ${totalReden} Reden = ${fmtPct(totalWertende, totalReden)} Reden mit Treffer (max).`);
  console.log(`  Bei sauberer Methodologie: 0 wertende Verben in 0% der Reden.`);
  console.log('');
  console.log('  Wenn wertende-Verben-Rate >0.5% pro Partei oder asymmetrisch verteilt → Schicht 2 fokussieren.');
  console.log('  Aggregat-Tonalitäts-Verteilung wird in Schicht 2 NICHT als Bias-Indikator genutzt — nur als Stratifikations-Quelle.');

  db.close();
}

main();
