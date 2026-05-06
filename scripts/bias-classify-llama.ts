#!/usr/bin/env npx tsx
/**
 * bias-classify-llama.ts
 *
 * Phase 1+2 des Bias-Audits:
 * 1. Mechanischer Filter — alle Reden mit wertenden Wörtern aus Tier A + B + Pattern-B-Heuristik
 * 2. Llama 3.1 8B Instant via Groq (4 Keys round-robin) — pro Treffer:
 *    "Verwendet der Sprecher dieses Wort (oder klares Synonym) selbst?" → JA/NEIN/UNKLAR
 *
 * Output: bias-classification.jsonl (resume-fähig)
 *
 * Cross-Check (Mistral Small) und Rewrite kommen in separaten Skripten.
 */

import Database from 'better-sqlite3';
import * as fs from 'node:fs';

// Mini .env Loader (kein dotenv-Dep)
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
const STATE_FILE = 'bias-classification.jsonl';

// ============================================================
// WORTLISTE — finalisiert nach 200er-Audit
// ============================================================

// Tier A: Hohe Bias-Konfidenz (immer fragwürdig wenn nicht im Original)
const TIER_A_VERBEN = [
  'skandalisier', 'polarisier', 'polemisier', 'diffamier',
  'denunzier', 'fabulier', 'verdamm', 'hetz',
];

const TIER_A_SUBSTANTIVE = [
  'Heuchelei', 'Doppelmoral', 'Stimmungsmache', 'Abgesang',
];

const TIER_A_DISTANZ = [
  'angeblich', 'vermeintlich',
];

// Tier B: Mittlere Konfidenz (Original-Check entscheidend)
const TIER_B_VERBEN = [
  'entlarv', 'demaskier', 'instrumentalisier',
  'inszenier', 'demolier', 'demontier',
];

// Pattern-B-Heuristik (Meta-Kommentare zur Rhetorik)
// Achtung: viele false positives, niedrigere Konfidenz
const PATTERN_B_PHRASES = [
  'rahmt als', 'rahmt es als', 'sein Frame ist', 'ihr Frame ist',
  'Sein wahres Anliegen', 'In Wahrheit geht es',
  'Botschaft ist', 'Pointe ist',
  'die Rede dient als', 'dient zur',
  'nutzt X als Strategie', 'strategisch eingesetzt',
];

interface RedeRow {
  rede_id: string;
  speaker: string;
  party: string;
  zusammenfassung_2_saetze: string;
  original_text: string;
}

interface FilterMatch {
  rede_id: string;
  speaker: string;
  party: string;
  summary: string;
  original_excerpt: string;
  matched_word: string;
  matched_tier: 'A' | 'B' | 'PatternB';
  verb_in_original_naive: boolean; // schneller Substring-Pre-Check
}

interface ClassificationResult {
  rede_id: string;
  matched_word: string;
  matched_tier: string;
  classification: 'JA' | 'NEIN' | 'UNKLAR' | 'ERROR';
  begruendung: string;
  model: string;
  api_key_used: string;
  ts: string;
}

// ============================================================
// MECHANISCHER FILTER
// ============================================================

function findFirstMatch(summary: string): { word: string; tier: 'A' | 'B' | 'PatternB' } | null {
  const lc = summary.toLowerCase();

  // Tier A Verben
  for (const stem of TIER_A_VERBEN) {
    const re = new RegExp('\\b' + stem.toLowerCase() + '\\w*', 'i');
    const m = summary.match(re);
    if (m) return { word: m[0], tier: 'A' };
  }
  // Tier A Substantive (case-sensitive für Substantive)
  for (const noun of TIER_A_SUBSTANTIVE) {
    const re = new RegExp('\\b' + noun + '\\b');
    if (re.test(summary)) return { word: noun, tier: 'A' };
  }
  // Tier A Distanz-Markierungen
  for (const w of TIER_A_DISTANZ) {
    const re = new RegExp('\\b' + w + '\\w*\\b', 'i');
    const m = summary.match(re);
    if (m) return { word: m[0], tier: 'A' };
  }
  // Tier B Verben
  for (const stem of TIER_B_VERBEN) {
    const re = new RegExp('\\b' + stem.toLowerCase() + '\\w*', 'i');
    const m = summary.match(re);
    if (m) return { word: m[0], tier: 'B' };
  }
  // Pattern B (heuristisch)
  for (const phrase of PATTERN_B_PHRASES) {
    if (lc.includes(phrase.toLowerCase())) return { word: phrase, tier: 'PatternB' };
  }

  return null;
}

function getOriginalExcerpt(originalText: string, word: string, len: number = 1500): string {
  if (!originalText) return '';
  const stem = word.slice(0, Math.min(word.length, 6)).toLowerCase();
  const idx = originalText.toLowerCase().indexOf(stem);
  if (idx === -1) {
    // Wort/Stamm nicht im Original gefunden
    if (originalText.length <= len) return originalText;
    const mid = Math.floor(originalText.length / 2);
    return '…' + originalText.slice(Math.max(0, mid - len / 2), mid + len / 2) + '…';
  }
  const start = Math.max(0, idx - Math.floor(len / 2));
  const end = Math.min(originalText.length, idx + Math.floor(len / 2));
  return (start > 0 ? '…' : '') + originalText.slice(start, end) + (end < originalText.length ? '…' : '');
}

function checkVerbInOriginalNaive(originalText: string, word: string): boolean {
  if (!originalText) return false;
  // Verb-Stamm: erste 5-7 Buchstaben
  const stem = word.slice(0, Math.min(word.length, 6)).toLowerCase();
  return originalText.toLowerCase().includes(stem);
}

function buildMatches(db: Database.Database): FilterMatch[] {
  const rows = db.prepare(`
    SELECT s.rede_id, ps.speaker, ps.party,
           s.zusammenfassung_2_saetze, ps.original_text
    FROM speech_analyses_v2 s
    JOIN plenar_speeches ps ON s.speech_id = ps.id
    WHERE s.zusammenfassung_2_saetze IS NOT NULL
  `).all() as RedeRow[];

  const matches: FilterMatch[] = [];
  for (const r of rows) {
    const m = findFirstMatch(r.zusammenfassung_2_saetze);
    if (!m) continue;
    matches.push({
      rede_id: r.rede_id,
      speaker: r.speaker,
      party: r.party || '(Bundesregierung)',
      summary: r.zusammenfassung_2_saetze.replace(/\s+/g, ' ').trim(),
      original_excerpt: getOriginalExcerpt(r.original_text, m.word, 1500),
      matched_word: m.word,
      matched_tier: m.tier,
      verb_in_original_naive: checkVerbInOriginalNaive(r.original_text, m.word),
    });
  }
  return matches;
}

// ============================================================
// GROQ API
// ============================================================

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_QDMAGIX1,
  process.env.GROQ_API_KEY_ADAMSORTINO,
  process.env.GROQ_API_KEY_ANALDINMAGIX,
  process.env.GROQ_API_KEY_4,
].filter(Boolean) as string[];

if (GROQ_KEYS.length === 0) {
  console.error('❌ Keine GROQ_API_KEY_* in .env gefunden');
  process.exit(1);
}

const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `Du bist ein neutraler Bias-Prüfer für Zusammenfassungen von Bundestagsreden. Deine einzige Aufgabe: prüfen, ob ein bestimmtes wertendes Wort in einer LLM-Zusammenfassung vom Sprecher selbst stammt oder vom LLM hinzugefügt wurde.

Antworte AUSSCHLIESSLICH als JSON. Keine zusätzlichen Wörter, keine Erklärungen außerhalb des JSON.`;

function buildUserPrompt(m: FilterMatch): string {
  return `ORIGINAL-AUSZUG (relevante Stelle der Rede):
${m.original_excerpt}

LLM-ZUSAMMENFASSUNG:
${m.summary}

ZU PRÜFENDES WORT IN DER ZUSAMMENFASSUNG: "${m.matched_word}"

Frage: Verwendet der Sprecher dieses Wort (oder ein KLARES Synonym mit gleicher Wertungsstärke) selbst im Originaltext?

Beispiele klarer Synonyme:
- "skandalisieren" ≈ "als Skandal bezeichnen", "Skandal nennen"
- "entlarven" ≈ "aufdecken", "bloßstellen", "demaskieren"
- "instrumentalisieren" ≈ "missbrauchen für", "ausnutzen für"
- "diffamieren" ≈ "verleumden", "schmähen"

WICHTIG:
- "JA" nur wenn der Sprecher das Wort oder ein klares Synonym SELBST verwendet
- "NEIN" wenn das Wort vom LLM in die Zusammenfassung eingefügt wurde, ohne dass der Sprecher es nutzt
- "UNKLAR" wenn nicht eindeutig entscheidbar

Antworte als JSON-Objekt:
{"klassifikation": "JA" | "NEIN" | "UNKLAR", "begruendung": "max. 1 Satz"}`;
}

async function callGroq(userPrompt: string, apiKey: string, attempt = 0): Promise<{ klassifikation: string; begruendung: string } | { error: string }> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      // Rate-Limit → backoff retry
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
    if (attempt < 2) {
      await sleep(2000);
      return callGroq(userPrompt, apiKey, attempt + 1);
    }
    return { error: e.message || 'unknown' };
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ============================================================
// WORKER POOL (1 worker pro Key)
// ============================================================

async function runClassification(matches: FilterMatch[], doneIds: Set<string>): Promise<void> {
  const todo = matches.filter(m => !doneIds.has(m.rede_id + '|' + m.matched_word));
  console.log(`Total Filter-Treffer: ${matches.length}`);
  console.log(`Bereits klassifiziert: ${matches.length - todo.length}`);
  console.log(`Noch zu tun: ${todo.length}\n`);

  if (todo.length === 0) {
    console.log('Alles bereits klassifiziert.');
    return;
  }

  const writeStream = fs.createWriteStream(STATE_FILE, { flags: 'a' });

  let completed = 0;
  let lastReport = Date.now();
  let errors = 0;

  // Round-robin queue + worker per key
  const queue = [...todo];

  async function worker(keyIdx: number) {
    const apiKey = GROQ_KEYS[keyIdx];
    while (queue.length > 0) {
      const m = queue.shift()!;
      const userPrompt = buildUserPrompt(m);
      const result = await callGroq(userPrompt, apiKey);

      const cr: ClassificationResult = {
        rede_id: m.rede_id,
        matched_word: m.matched_word,
        matched_tier: m.matched_tier,
        classification: 'error' in result ? 'ERROR' : (result.klassifikation as any),
        begruendung: 'error' in result ? result.error : result.begruendung,
        model: MODEL,
        api_key_used: `key${keyIdx + 1}`,
        ts: new Date().toISOString(),
      };

      writeStream.write(JSON.stringify(cr) + '\n');
      completed++;
      if (cr.classification === 'ERROR') errors++;

      const now = Date.now();
      if (now - lastReport > 5000) {
        const rate = completed / ((now - (lastReport - 5000)) / 1000);
        console.log(`  ${completed}/${todo.length} klassifiziert (${rate.toFixed(1)}/s, ${errors} errors)`);
        lastReport = now;
      }

      // Sanftes Throttling — 2 Anfragen pro Sekunde pro Key max
      await sleep(500);
    }
  }

  await Promise.all(GROQ_KEYS.map((_, i) => worker(i)));
  writeStream.end();

  console.log(`\n✓ ${completed} Klassifikationen geschrieben (${errors} errors)`);
}

// ============================================================
// MAIN
// ============================================================

function loadDoneIds(): Set<string> {
  if (!fs.existsSync(STATE_FILE)) return new Set();
  const lines = fs.readFileSync(STATE_FILE, 'utf-8').split('\n').filter(Boolean);
  const ids = new Set<string>();
  for (const line of lines) {
    try {
      const r = JSON.parse(line) as ClassificationResult;
      if (r.classification !== 'ERROR') {
        ids.add(r.rede_id + '|' + r.matched_word);
      }
    } catch {}
  }
  return ids;
}

function reportTier(matches: FilterMatch[]) {
  const byTier: Record<string, number> = { A: 0, B: 0, PatternB: 0 };
  const byParty: Record<string, number> = {};
  const byWord: Record<string, number> = {};
  for (const m of matches) {
    byTier[m.matched_tier]++;
    byParty[m.party] = (byParty[m.party] || 0) + 1;
    byWord[m.matched_word] = (byWord[m.matched_word] || 0) + 1;
  }
  console.log('\n=== Filter-Treffer ===');
  console.log(`Total: ${matches.length}`);
  console.log(`  Tier A:    ${byTier.A}`);
  console.log(`  Tier B:    ${byTier.B}`);
  console.log(`  Pattern B: ${byTier.PatternB}`);
  console.log('\nTop 15 Wörter:');
  for (const [w, n] of Object.entries(byWord).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${w.padEnd(28)} ${n}`);
  }
  console.log('\nVerteilung pro Partei:');
  for (const [p, n] of Object.entries(byParty).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${p.padEnd(28)} ${n}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

  console.log('=== Bias-Classify (Llama 3.1 8B Instant via Groq) ===');
  console.log(`API-Keys verfügbar: ${GROQ_KEYS.length}`);
  if (limit !== Infinity) console.log(`LIMIT: nur erste ${limit} Reden`);
  console.log('');

  const db = new Database(DB_PATH, { readonly: true });
  let matches = buildMatches(db);
  db.close();

  reportTier(matches);

  if (limit !== Infinity) {
    // Stratifizierte Stichprobe (über Tier verteilt)
    const tierA = matches.filter(m => m.matched_tier === 'A').slice(0, Math.ceil(limit / 2));
    const tierB = matches.filter(m => m.matched_tier === 'B').slice(0, Math.ceil(limit / 4));
    const patternB = matches.filter(m => m.matched_tier === 'PatternB').slice(0, Math.floor(limit / 4));
    matches = [...tierA, ...tierB, ...patternB];
    console.log(`\nStichprobe: ${matches.length} (${tierA.length} A / ${tierB.length} B / ${patternB.length} PatternB)`);
  }

  if (dryRun) {
    console.log('\n--dry-run — keine LLM-Calls. Treffer-Report oben.');
    console.log('\nErste 3 Treffer als Sanity-Check:');
    for (const m of matches.slice(0, 3)) {
      console.log(`\n[${m.matched_tier}] ${m.rede_id} (${m.party}) — Wort: "${m.matched_word}"`);
      console.log(`  Naive verb-im-Original: ${m.verb_in_original_naive ? '✓' : '✗'}`);
      console.log(`  Summary: ${m.summary.slice(0, 200)}…`);
    }
    return;
  }

  console.log('');
  const doneIds = loadDoneIds();
  await runClassification(matches, doneIds);

  console.log('\n✓ Fertig. Output: bias-classification.jsonl');
  console.log('Nächste Schritte:');
  console.log('  - Stats anzeigen: npx tsx scripts/bias-classify-llama.ts --report');
  console.log('  - Cross-Check via Mistral: separates Skript (kommt nach Test-Lauf)');
}

main().catch(e => { console.error(e); process.exit(1); });
