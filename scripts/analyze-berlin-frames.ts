/**
 * N-Gramm-Analyse über berlin_speeches.text — datengetriebene Frame-Discovery.
 *
 * Zweck: Vor LLM-Vollauf empirisch belegen, welche Mehrwort-Phrasen in Berlin-
 * Reden häufig vorkommen. Output: Top-Liste mit Frequenz, manuelle Kuration
 * trennt politisch geladene Frames von Floskeln.
 *
 * Strategie:
 *   - 2-4-Gramme über alle berlin_speeches.text (echte Reden, ohne Präsidium)
 *   - Normalisierung: lowercase, Punctuation raus, Tokens > 3 Zeichen
 *   - Floskel-Filter: Standard-Anreden, Plenum-Phrasen, generische Wörter
 *   - Output: JSON-Report + Top-300-Tabelle für manuelle Sichtung
 *
 * Run: npx tsx scripts/analyze-berlin-frames.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const REPORT_PATH = path.join(process.cwd(), "scripts/analyze-berlin-frames.report.json");
const TOP_N = 300;
const MIN_FREQ = 20; // Phrase muss in ≥20 Reden vorkommen
const NGRAM_SIZES = [2, 3, 4];

// ── Stop-Words: typische Plenum-Floskeln, Anreden, leere Funktionswörter ──
const STOP_WORDS = new Set([
  // Funktionswörter
  "und", "oder", "aber", "auch", "noch", "schon", "doch", "denn", "wenn", "weil", "dass", "ob",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines",
  "ist", "sind", "war", "wird", "werden", "wurde", "wurden", "hat", "haben", "habe", "hatte",
  "ich", "wir", "sie", "ihr", "ihm", "ihn", "ihre", "ihrer", "ihrem", "ihren",
  "mich", "dich", "uns", "euch", "sich",
  "mir", "dir", "ihm", "ihr",
  "mein", "dein", "sein", "unser", "euer",
  "von", "vom", "zu", "zum", "zur", "für", "mit", "bei", "auf", "aus", "nach", "über", "unter",
  "vor", "hinter", "neben", "zwischen", "an", "am", "im", "ins",
  "nicht", "kein", "keine", "keinen", "keinem", "keiner",
  "ja", "nein", "doch", "auch", "sehr", "gar", "nur", "noch",
  "hier", "da", "dort", "so", "wie", "was", "wer", "wo", "wann", "warum",
  "diese", "dieser", "dieses", "diesen", "diesem",
  "alle", "alles", "viele", "viel", "wenig", "manche", "einige", "etwas",
  "mehr", "weniger", "ganz", "gut", "schlecht",
  "Frau", "frau", "Herr", "herr", "Herren", "herren", "Damen", "damen", "Kolleginnen", "kolleginnen", "Kollegen", "kollegen", "Kollege", "kollege",
  // Plenum-Anreden / Floskeln
  "Präsidentin", "präsidentin", "Präsident", "präsident", "Vizepräsident", "vizepräsident", "Vizepräsidentin", "vizepräsidentin",
  "Herzlichen", "herzlichen", "Vielen", "vielen", "Danke", "danke", "Dank", "dank", "Bitte", "bitte",
  "Geehrte", "geehrte", "Geehrter", "geehrter", "Geehrten", "geehrten",
  "Lieber", "lieber", "Liebe", "liebe", "Lieben", "lieben",
  "Werte", "werte", "Werter", "werter",
  "Meine", "meine", "Mein", "mein",
  "Frage", "frage", "Antwort", "antwort", "Senat", "senat", "Senatorin", "senatorin", "Senator", "senator",
  "fraktion", "Fraktion",
  "Abgeordnete", "abgeordnete", "Abgeordneten", "abgeordneten",
  // Modalverben / Hilfsverben
  "kann", "können", "konnte", "konnten", "muss", "müssen", "musste", "musste", "soll", "sollen", "sollte", "sollten",
  "will", "wollen", "wollte", "wollten", "darf", "dürfen", "durfte", "durften", "mag", "mögen",
  "möchte", "möchten", "würde", "würden",
  "bin", "bist", "seid", "waren", "wäre", "wären",
  // sehr generisch
  "sagen", "gesagt", "machen", "gemacht", "geht", "ging", "kommt", "kam", "gibt", "gab",
  "frage", "Frage", "Antwort", "antwort", "Bericht", "bericht",
]);

// 4-Gramm-Floskel-Blacklist (exakte Strings nach Normalisierung)
const FLOSKEL_NGRAMS = new Set([
  "sehr geehrte frau präsidentin",
  "meine damen und herren",
  "liebe kolleginnen und kollegen",
  "sehr geehrte damen und",
  "geehrte damen und herren",
  "sehr geehrter herr präsident",
  "ich frage den senat",
  "vielen dank frau präsidentin",
  "frau präsidentin meine damen",
  "präsidentin meine damen und",
  "sehr geehrte kolleginnen und",
  "geehrte kolleginnen und kollegen",
  "frau präsidentin meine",
  "präsidentin meine damen",
  "damen und herren liebe",
  "und herren liebe kolleginnen",
  "herren liebe kolleginnen und",
  "vielen dank herr präsident",
  "herr präsident meine damen",
  "präsident meine damen und",
  "frau präsidentin sehr geehrte",
  "präsidentin sehr geehrte damen",
  "ich frage den",
  "frage den senat",
]);

// ── PDF-Seiten-Header strippen (kommen in jeder mehrseitigen Rede vor) ──
// Pattern: "Abgeordnetenhaus von Berlin\n19. Wahlperiode\nSeite XXX Plenarprotokoll 19/X\n[Datum]"
function stripPageHeaders(text: string): string {
  return text
    // Komplette Header-Blöcke (multi-line)
    .replace(/\bAbgeordnetenhaus von Berlin[^\n]*/g, "")
    .replace(/\b\d{1,2}\.\s*Wahlperiode/g, "")
    .replace(/\bSeite\s+\d+\s+Plenarprotokoll[^\n]*/g, "")
    .replace(/\bPlenarprotokoll\s+\d{1,2}\/\d{1,3}/g, "")
    // Datums-Marker am Seitenanfang (24. Februar 2022 etc.)
    .replace(/\b\d{1,2}\.\s+(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}/g, "");
}

// ── Normalisierung ──
function normalize(text: string): string {
  return stripPageHeaders(text)
    .toLowerCase()
    // Bindestriche / Apostrophe als Trennzeichen
    .replace(/[-‐‑‒–—']/g, " ")
    // Punctuation raus (außer Umlaute/ß)
    .replace(/[^\wäöüß\s]/gu, " ")
    // Mehrfach-Whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3); // Token muss ≥3 Zeichen
}

function generateNgrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    const slice = tokens.slice(i, i + n);
    // Mindestens 1 Token muss nicht-Stopword sein
    if (slice.every((t) => STOP_WORDS.has(t))) continue;
    // Erstes/letztes Token darf kein Stopword sein (sonst halbe Phrasen)
    if (STOP_WORDS.has(slice[0]) || STOP_WORDS.has(slice[slice.length - 1])) continue;
    const phrase = slice.join(" ");
    if (FLOSKEL_NGRAMS.has(phrase)) continue;
    out.push(phrase);
  }
  return out;
}

// ── Main ──
function main() {
  const db = new Database(DB_PATH, { readonly: true });

  console.log("Lade Berlin-Reden (ohne Präsidium)...");
  const speeches = db
    .prepare(
      `SELECT speech_id, text, speaker_party, speech_type, text_chars
         FROM berlin_speeches
        WHERE is_praesidium = 0
          AND text IS NOT NULL AND text != ''`
    )
    .all() as { speech_id: string; text: string; speaker_party: string | null; speech_type: string | null; text_chars: number }[];

  console.log(`${speeches.length} Reden geladen, Σ ${speeches.reduce((a, s) => a + s.text_chars, 0).toLocaleString("de-DE")} Zeichen`);

  // N-Gramme zählen (mit Tracking pro speech_id für "wie viele eindeutige Reden enthalten Phrase X")
  console.log("\nGeneriere N-Gramme...");
  const phraseStats = new Map<string, { freq: number; redenSet: Set<string>; perParty: Map<string, number>; perType: Map<string, number> }>();

  for (const s of speeches) {
    const tokens = tokenize(s.text);
    const seenInThisSpeech = new Set<string>();
    for (const n of NGRAM_SIZES) {
      for (const ng of generateNgrams(tokens, n)) {
        if (!phraseStats.has(ng)) {
          phraseStats.set(ng, { freq: 0, redenSet: new Set(), perParty: new Map(), perType: new Map() });
        }
        const stats = phraseStats.get(ng)!;
        stats.freq++;
        stats.redenSet.add(s.speech_id);
        if (s.speaker_party) {
          stats.perParty.set(s.speaker_party, (stats.perParty.get(s.speaker_party) ?? 0) + 1);
        }
        if (s.speech_type) {
          stats.perType.set(s.speech_type, (stats.perType.get(s.speech_type) ?? 0) + 1);
        }
        seenInThisSpeech.add(ng);
      }
    }
  }

  console.log(`${phraseStats.size.toLocaleString("de-DE")} eindeutige Phrasen gefunden`);

  // Filter: Mindestens MIN_FREQ Reden
  const filtered = [...phraseStats.entries()]
    .filter(([, s]) => s.redenSet.size >= MIN_FREQ)
    .map(([phrase, s]) => ({
      phrase,
      freq: s.freq,
      reden: s.redenSet.size,
      tokens: phrase.split(" ").length,
      per_party: Object.fromEntries(s.perParty),
      per_type: Object.fromEntries(s.perType),
    }))
    .sort((a, b) => b.reden - a.reden);

  console.log(`${filtered.length} Phrasen kommen in ≥${MIN_FREQ} Reden vor`);

  // Output: Top N
  const top = filtered.slice(0, TOP_N);
  fs.writeFileSync(REPORT_PATH, JSON.stringify(top, null, 2));
  console.log(`\nReport: ${REPORT_PATH}`);

  // Sortiert nach n-gram size für bessere Lesbarkeit der Top
  console.log(`\n=== Top ${Math.min(50, top.length)} Phrasen (nach Reden-Coverage) ===`);
  console.log(`${"#".padStart(3)} ${"Reden".padStart(5)} ${"Freq".padStart(5)} ${"N".padStart(2)}  Top-Partei  Phrase`);
  console.log("─".repeat(110));
  for (let i = 0; i < Math.min(50, top.length); i++) {
    const t = top[i];
    const topParty = Object.entries(t.per_party).sort((a, b) => b[1] - a[1])[0];
    const partyStr = topParty ? `${topParty[0].padEnd(6)} (${Math.round(topParty[1] / t.freq * 100)}%)` : "—".padEnd(13);
    console.log(`${(i + 1).toString().padStart(3)} ${t.reden.toString().padStart(5)} ${t.freq.toString().padStart(5)} ${t.tokens.toString().padStart(2)}  ${partyStr}  ${t.phrase}`);
  }

  db.close();
}

main();
