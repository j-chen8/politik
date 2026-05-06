#!/usr/bin/env npx tsx
/**
 * Variante B: enger Filter + Llama-Klassifikation für die OFFENSICHTLICHSTEN Bias-Fälle.
 *
 * Filter NUR auf Wörter mit hoher Bias-Konfidenz (kaum von Sprechern selbst genutzt):
 *   - skandalisier*, polemisier*, diffamier*, denunzier*, verdamm*, fabulier*
 *   - Substantive: Heuchelei, Doppelmoral, Stimmungsmache, Abgesang
 *
 * Bewusst NICHT enthalten:
 *   - Tier B (entlarv, instrumentalisier, demaskier, ...): zu oft im Original
 *   - Distanz-Markierungen (angeblich, vermeintlich): zu oft als legitime Wiedergabe
 *   - hetz*: oft im Original
 *   - Pattern B: braucht echtes Rewriting, nicht Verb-Replace
 *
 * Output: bias-audit-tier-a-only.jsonl
 *   → Inputs für manuellen Rewrite in nächstem Schritt
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

function loadEnv() {
  if (!fs.existsSync('.env')) return;
  const lines = fs.readFileSync('.env', 'utf-8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const DB_PATH = 'politik.db';
const STATE_FILE = 'bias-audit-tier-a-only.jsonl';

// ============================================================
// ENGE Wortliste — nur hohe Bias-Konfidenz
// ============================================================

const VERB_STEMS = [
  'skandalisier', 'polemisier', 'diffamier',
  'denunzier', 'verdamm', 'fabulier',
];

const NOUNS = [
  'Heuchelei', 'Doppelmoral', 'Stimmungsmache', 'Abgesang',
];

interface RedeRow {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  zusammenfassung_2_saetze: string;
  original_text: string;
}

interface FilterMatch {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  summary: string;
  original_excerpt: string;
  original_full_len: number;
  matched_word: string;
  verb_in_original_naive: boolean;
}

function findFirstMatch(summary: string): string | null {
  for (const stem of VERB_STEMS) {
    const re = new RegExp('\\b' + stem + '\\w*', 'i');
    const m = summary.match(re);
    if (m) return m[0];
  }
  for (const noun of NOUNS) {
    const re = new RegExp('\\b' + noun + '\\b');
    const m = summary.match(re);
    if (m) return m[0];
  }
  return null;
}

function getOriginalExcerpt(originalText: string, word: string, len: number = 1500): string {
  if (!originalText) return '';
  const stem = word.slice(0, Math.min(word.length, 6)).toLowerCase();
  const idx = originalText.toLowerCase().indexOf(stem);
  if (idx === -1) {
    if (originalText.length <= len) return originalText;
    const mid = Math.floor(originalText.length / 2);
    return '…' + originalText.slice(Math.max(0, mid - len / 2), mid + len / 2) + '…';
  }
  const start = Math.max(0, idx - Math.floor(len / 2));
  const end = Math.min(originalText.length, idx + Math.floor(len / 2));
  return (start > 0 ? '…' : '') + originalText.slice(start, end) + (end < originalText.length ? '…' : '');
}

function buildMatches(db: Database.Database): FilterMatch[] {
  const rows = db.prepare(`
    SELECT s.rede_id, s.segment_index, ps.speaker, ps.party,
           s.zusammenfassung_2_saetze, ps.original_text
    FROM speech_analyses_v2 s
    JOIN plenar_speeches ps ON s.speech_id = ps.id
    WHERE s.zusammenfassung_2_saetze IS NOT NULL
  `).all() as RedeRow[];

  const matches: FilterMatch[] = [];
  for (const r of rows) {
    const word = findFirstMatch(r.zusammenfassung_2_saetze);
    if (!word) continue;
    const stem = word.slice(0, 6).toLowerCase();
    matches.push({
      rede_id: r.rede_id,
      segment_index: r.segment_index,
      speaker: r.speaker,
      party: r.party || '(Bundesregierung)',
      summary: r.zusammenfassung_2_saetze.replace(/\s+/g, ' ').trim(),
      original_excerpt: getOriginalExcerpt(r.original_text, word, 1500),
      original_full_len: (r.original_text || '').length,
      matched_word: word,
      verb_in_original_naive: (r.original_text || '').toLowerCase().includes(stem),
    });
  }
  return matches;
}

// ============================================================
// GROQ
// ============================================================

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_QDMAGIX1,
  process.env.GROQ_API_KEY_ADAMSORTINO,
  process.env.GROQ_API_KEY_ANALDINMAGIX,
  process.env.GROQ_API_KEY_4,
].filter(Boolean) as string[];

const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Du bist ein neutraler Bias-Prüfer für Bundestagsreden-Zusammenfassungen.

WICHTIG:
- Original-Auszug = der wörtliche Text, den der Sprecher gesagt hat
- Zusammenfassung = vom LLM erstellte Kurz-Wiedergabe

Deine Aufgabe: Steht das wertende Wort (oder ein klares Synonym) tatsächlich im ORIGINAL-Auszug, oder hat das LLM es nur in die ZUSAMMENFASSUNG eingefügt?

Antworte AUSSCHLIESSLICH als JSON.`;

function buildUserPrompt(m: FilterMatch): string {
  return `ORIGINAL-AUSZUG (was der Sprecher tatsächlich gesagt hat):
${m.original_excerpt}

ZUSAMMENFASSUNG (LLM-generiert, enthält das Wort "${m.matched_word}"):
${m.summary}

FRAGE: Verwendet der Sprecher im ORIGINAL-AUSZUG oben das Wort "${m.matched_word}" oder ein klares Synonym (gleiche Wertungsstärke)?

Synonyme-Beispiele:
- "skandalisieren" ≈ "Skandal nennen", "als Skandal bezeichnen"
- "polemisieren" ≈ "polemisch reden"
- "diffamieren" ≈ "verleumden", "schmähen"
- "denunzieren" ≈ "bloßstellen mit Vorwurf"
- "verdammen" ≈ "scharf verurteilen", "geißeln"
- "Heuchelei" ≈ "Scheinheiligkeit", "Doppelzüngigkeit"
- "Doppelmoral" ≈ "doppelte Standards", "messen mit zweierlei Maß"
- "Stimmungsmache" ≈ "Hetze gegen", "Stimmung schüren"
- "Abgesang" ≈ "Untergangsrhetorik"

REGEL:
- "JA" = Wort oder klares Synonym IM ORIGINAL-Auszug vorhanden
- "NEIN" = nicht im Original — LLM hat es selbst eingefügt
- "UNKLAR" = nicht eindeutig

Antworte als JSON:
{"klassifikation": "JA" | "NEIN" | "UNKLAR", "begruendung": "max. 1 Satz, zitiere wenn möglich"}`;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function callGroq(userPrompt: string, apiKey: string, attempt = 0): Promise<{ klassifikation: string; begruendung: string } | { error: string }> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429 && attempt < 3) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
        await sleep((retryAfter + 1) * 1000);
        return callGroq(userPrompt, apiKey, attempt + 1);
      }
      return { error: `${res.status} ${text.slice(0, 200)}` };
    }

    const data = await res.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { error: 'no content' };
    const parsed = JSON.parse(content);
    return {
      klassifikation: parsed.klassifikation || 'UNKLAR',
      begruendung: parsed.begruendung || '',
    };
  } catch (e: any) {
    if (attempt < 2) { await sleep(2000); return callGroq(userPrompt, apiKey, attempt + 1); }
    return { error: e.message || 'unknown' };
  }
}

interface Result {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  matched_word: string;
  classification: string;
  begruendung: string;
  summary: string;
  original_excerpt: string;
  ts: string;
}

async function classify(matches: FilterMatch[], doneIds: Set<string>): Promise<void> {
  const todo = matches.filter(m => !doneIds.has(m.rede_id + '|' + m.matched_word));
  console.log(`Treffer: ${matches.length}, schon klassifiziert: ${matches.length - todo.length}, todo: ${todo.length}\n`);
  if (todo.length === 0) return;

  const stream = fs.createWriteStream(STATE_FILE, { flags: 'a' });
  const queue = [...todo];
  let completed = 0, errors = 0;
  const start = Date.now();

  async function worker(keyIdx: number) {
    const apiKey = GROQ_KEYS[keyIdx];
    while (queue.length > 0) {
      const m = queue.shift()!;
      const result = await callGroq(buildUserPrompt(m), apiKey);
      const r: Result = {
        rede_id: m.rede_id,
        segment_index: m.segment_index,
        speaker: m.speaker,
        party: m.party,
        matched_word: m.matched_word,
        classification: 'error' in result ? 'ERROR' : result.klassifikation,
        begruendung: 'error' in result ? result.error : result.begruendung,
        summary: m.summary,
        original_excerpt: m.original_excerpt,
        ts: new Date().toISOString(),
      };
      stream.write(JSON.stringify(r) + '\n');
      completed++;
      if (r.classification === 'ERROR') errors++;
      if (completed % 20 === 0) {
        const rate = completed / ((Date.now() - start) / 1000);
        console.log(`  ${completed}/${todo.length} (${rate.toFixed(1)}/s, ${errors} errors)`);
      }
      await sleep(600);
    }
  }
  await Promise.all(GROQ_KEYS.map((_, i) => worker(i)));
  stream.end();
  console.log(`\n✓ ${completed} klassifiziert (${errors} errors)`);
}

function loadDone(): Set<string> {
  if (!fs.existsSync(STATE_FILE)) return new Set();
  const ids = new Set<string>();
  for (const line of fs.readFileSync(STATE_FILE, 'utf-8').split('\n').filter(Boolean)) {
    try {
      const r = JSON.parse(line) as Result;
      if (r.classification !== 'ERROR') ids.add(r.rede_id + '|' + r.matched_word);
    } catch {}
  }
  return ids;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('=== Bias-Audit Variante B (enger Filter + Llama 8B) ===');
  console.log(`API-Keys: ${GROQ_KEYS.length}\n`);

  const db = new Database(DB_PATH, { readonly: true });
  const matches = buildMatches(db);
  db.close();

  console.log(`Filter-Treffer: ${matches.length}`);
  const byWord: Record<string, number> = {};
  const byParty: Record<string, number> = {};
  for (const m of matches) {
    byWord[m.matched_word.toLowerCase()] = (byWord[m.matched_word.toLowerCase()] || 0) + 1;
    byParty[m.party] = (byParty[m.party] || 0) + 1;
  }
  console.log('\nTop Wörter:');
  for (const [w, n] of Object.entries(byWord).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${w.padEnd(20)} ${n}`);
  }
  console.log('\nPro Partei:');
  for (const [p, n] of Object.entries(byParty).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${p.padEnd(28)} ${n}`);
  }

  if (dryRun) { console.log('\n--dry-run, no LLM calls.'); return; }

  console.log('');
  await classify(matches, loadDone());
  console.log(`\nOutput: ${STATE_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
