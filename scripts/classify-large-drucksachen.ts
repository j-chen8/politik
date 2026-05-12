/**
 * Klassifiziert "heavy truncated" Drucksachen (>2× Cap) in:
 *   - narrative: fließender Text, Truncation = Verlust an Inhalt
 *   - data_dump: Tabellen-/Listendump nach kurzer Narrativ-Einleitung, Truncation = OK
 *   - mixed: schwierig zu klassifizieren
 *
 * Heuristik: nur auf den Bereich JENSEITS des Caps schauen — wir wollen wissen,
 * was wir BEI TRUNCATION VERLIEREN, nicht was insgesamt im Dokument steht.
 *
 *   --all       Alle truncated (auch ≤2× Cap)
 *   --inspect N Sample-Output für die N häufigsten Pattern
 */
import Database from "better-sqlite3";
import path from "path";

const ALL = process.argv.includes("--all");
const INSPECT_IDX = process.argv.indexOf("--inspect");
const INSPECT = INSPECT_IDX >= 0 ? parseInt(process.argv[INSPECT_IDX + 1], 10) : 0;

const db = new Database(path.join(process.cwd(), "politik.db"));

const CAPS: Record<string, number> = {
  klein: 6000, mittel: 16000, gross: 32000, antwort: 32000, regierung: 16000,
};
// ~4 chars per token estimate
const charsForTokens = (tok: number) => tok * 4;

interface Row { drucksache_nr: string; batch_class: string; full_text: string; tokens_estimate: number; pages: number; zusammenfassung: string }

function selectHeavy(): Row[] {
  const ratio = ALL ? 1 : 2;
  return db.prepare(`
    SELECT t.drucksache_nr, t.batch_class, t.full_text, t.tokens_estimate, t.pages,
           COALESCE(a.zusammenfassung, '') AS zusammenfassung
    FROM drucksache_texts t
    LEFT JOIN drucksache_analyses a ON a.drucksache_nr=t.drucksache_nr AND a.prompt_version='v1'
    WHERE t.batch_class IN ('klein','mittel','gross','antwort','regierung')
      AND t.full_text IS NOT NULL
      AND t.tokens_estimate > ? * (
        CASE t.batch_class
          WHEN 'klein' THEN 6000 WHEN 'mittel' THEN 16000
          WHEN 'gross' THEN 32000 WHEN 'antwort' THEN 32000
          WHEN 'regierung' THEN 16000 END)
    ORDER BY t.tokens_estimate DESC
  `).all(ratio) as Row[];
}

interface Score {
  avg_words_per_line: number;
  short_line_ratio: number;   // ≤ 4 Wörter
  date_line_ratio: number;    // Zeile beginnt mit DD.MM.YYYY
  lex_diversity: number;      // unique / total
  bundesland_density: number; // BR/NW/BY/... per 1k chars
}

const BUNDESLAENDER = ["BR","BW","BY","BE","BB","HB","HH","HE","MV","NI","NW","RP","SL","SN","ST","SH","TH"];
const BL_RE = new RegExp(`\\b(${BUNDESLAENDER.join("|")})\\b`, "g");
const DATE_RE = /^\d{1,2}\.\d{1,2}\.\d{2,4}/;

function score(text: string): Score {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { avg_words_per_line: 0, short_line_ratio: 0, date_line_ratio: 0, lex_diversity: 0, bundesland_density: 0 };

  let totalWords = 0, shortLines = 0, dateLines = 0;
  const wordCounts = new Map<string, number>();

  for (const line of lines) {
    const words = line.split(/\s+/).filter(w => w.length > 0);
    totalWords += words.length;
    if (words.length <= 4) shortLines++;
    if (DATE_RE.test(line)) dateLines++;
    for (const w of words) {
      const lw = w.toLowerCase().replace(/[^\wäöüß]/g, "");
      if (lw.length > 2) wordCounts.set(lw, (wordCounts.get(lw) ?? 0) + 1);
    }
  }

  const bl_matches = (text.match(BL_RE) ?? []).length;
  const bl_density = (bl_matches / text.length) * 1000;

  return {
    avg_words_per_line: totalWords / lines.length,
    short_line_ratio: shortLines / lines.length,
    date_line_ratio: dateLines / lines.length,
    lex_diversity: wordCounts.size / (totalWords || 1),
    bundesland_density: bl_density,
  };
}

function classify(s: Score): "data_dump" | "narrative" | "mixed" {
  // Data dump signals (any two):
  let ddPoints = 0;
  if (s.avg_words_per_line < 7) ddPoints++;
  if (s.short_line_ratio > 0.55) ddPoints++;
  if (s.date_line_ratio > 0.08) ddPoints++;
  if (s.lex_diversity < 0.08) ddPoints++;
  if (s.bundesland_density > 1.5) ddPoints++;

  if (ddPoints >= 3) return "data_dump";
  if (ddPoints === 0) return "narrative";
  return "mixed";
}

const rows = selectHeavy();
console.log(`📋 ${rows.length} heavy-truncated DS\n`);

interface Result { row: Row; postCutScore: Score; klass: "data_dump" | "narrative" | "mixed"; cutChars: number }
const results: Result[] = [];

for (const r of rows) {
  const cap = CAPS[r.batch_class];
  const cutChars = charsForTokens(cap);
  // Schaue nur, was wir VERLIEREN: text NACH dem Cap
  const postCut = r.full_text.slice(cutChars);
  if (postCut.length < 1000) continue;
  const s = score(postCut);
  const klass = classify(s);
  results.push({ row: r, postCutScore: s, klass, cutChars });
}

const byKlass = new Map<string, Result[]>();
for (const r of results) {
  const arr = byKlass.get(r.klass) ?? [];
  arr.push(r);
  byKlass.set(r.klass, arr);
}

console.log(`Klassifikation des verlorenen Tail-Bereichs:`);
for (const [k, arr] of byKlass) {
  console.log(`  ${k.padEnd(12)} ${arr.length} DS`);
}

const breakdown = new Map<string, Map<string, number>>();
for (const r of results) {
  const m = breakdown.get(r.row.batch_class) ?? new Map();
  m.set(r.klass, (m.get(r.klass) ?? 0) + 1);
  breakdown.set(r.row.batch_class, m);
}
console.log(`\nBreakdown per batch_class:`);
for (const [bc, m] of breakdown) {
  const parts = Array.from(m.entries()).map(([k, n]) => `${k}=${n}`).join(" ");
  console.log(`  ${bc.padEnd(12)} ${parts}`);
}

if (INSPECT > 0) {
  for (const klass of ["narrative", "mixed", "data_dump"] as const) {
    const arr = (byKlass.get(klass) ?? []).slice(0, INSPECT);
    if (arr.length === 0) continue;
    console.log(`\n=== Sample ${klass.toUpperCase()} (${arr.length}) ===`);
    for (const r of arr) {
      const s = r.postCutScore;
      console.log(`\n  ${r.row.drucksache_nr} (${r.row.batch_class}, ${r.row.pages}p, ${r.row.tokens_estimate}tok)`);
      console.log(`    avg_words=${s.avg_words_per_line.toFixed(1)}  short_lines=${(s.short_line_ratio*100).toFixed(0)}%  date_lines=${(s.date_line_ratio*100).toFixed(0)}%  lex_div=${s.lex_diversity.toFixed(3)}  bl_density=${s.bundesland_density.toFixed(2)}`);
      console.log(`    zus: ${r.row.zusammenfassung.slice(0, 130)}…`);
    }
  }
}

if (process.argv.includes("--persist")) {
  // Tabelle-Spalte ergänzen
  try { db.exec(`ALTER TABLE drucksache_texts ADD COLUMN tail_classification TEXT`); } catch {}
  const upd = db.prepare(`UPDATE drucksache_texts SET tail_classification=? WHERE drucksache_nr=?`);
  for (const r of results) upd.run(r.klass, r.row.drucksache_nr);
  console.log(`\n💾 ${results.length} Klassifikationen in drucksache_texts.tail_classification persistiert.`);
}
