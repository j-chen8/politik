/**
 * Korpus-Analyse über alle Berlin-Drucksachen — vor LLM-Vollauf.
 *
 * Verifiziert empirisch die Vorfilter-Hypothesen über die ganze Population
 * (35.482 DS) statt einer 100-DS-Stichprobe:
 *  1. Boilerplate-Pattern: wie konsistent über alle Anfragen?
 *  2. Antwort-Duplikate: schon auf Char-Count-Basis verifiziert (99,89%) —
 *     hier zusätzlich Substring-Anchor-Check
 *  3. Frage-Pattern-Diversität: welche Formate werden benutzt?
 *  4. Length-Distribution pro Doc-Typ
 *  5. Edge-Cases: DS ohne erwartetes Pattern
 *
 * Run: npx tsx scripts/analyze-berlin-drucksachen.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const db = new Database(DB_PATH, { readonly: true });

// ── 1. Length-Distribution pro Doc-Typ ──
console.log("=== 1. Length-Distribution pro Doc-Typ (über alle 35.482 DS mit Volltext) ===\n");
const dist = db.prepare(`
  SELECT d.dok_typ_label, COUNT(*) n,
    MIN(t.chars) min_z, AVG(t.chars) avg_z, MAX(t.chars) max_z,
    SUM(CASE WHEN t.chars < 5000 THEN 1 ELSE 0 END) lt5k,
    SUM(CASE WHEN t.chars BETWEEN 5000 AND 9999 THEN 1 ELSE 0 END) z5_10k,
    SUM(CASE WHEN t.chars BETWEEN 10000 AND 19999 THEN 1 ELSE 0 END) z10_20k,
    SUM(CASE WHEN t.chars BETWEEN 20000 AND 49999 THEN 1 ELSE 0 END) z20_50k,
    SUM(CASE WHEN t.chars >= 50000 THEN 1 ELSE 0 END) gt50k
  FROM berlin_documents d JOIN berlin_pdf_texts t ON d.lok_url=t.lok_url
  WHERE d.dok_art_label='Drucksache' AND t.chars > 0
  GROUP BY d.dok_typ_label
  HAVING n >= 50
  ORDER BY n DESC
`).all() as any[];
console.log("Typ".padEnd(30) + "n".padStart(7) + "Ø Z.".padStart(8) + "Max Z.".padStart(9) + "<5k".padStart(7) + "5-10k".padStart(8) + "10-20k".padStart(8) + "20-50k".padStart(8) + ">50k".padStart(7));
console.log("─".repeat(95));
for (const r of dist) {
  console.log(
    (r.dok_typ_label || "—").padEnd(30) +
    r.n.toString().padStart(7) +
    Math.round(r.avg_z).toString().padStart(8) +
    r.max_z.toString().padStart(9) +
    r.lt5k.toString().padStart(7) +
    r.z5_10k.toString().padStart(8) +
    r.z10_20k.toString().padStart(8) +
    r.z20_50k.toString().padStart(8) +
    r.gt50k.toString().padStart(7)
  );
}

// ── 2. Boilerplate-Pattern-Hit-Rate über ALLE Schriftlichen Anfragen ──
console.log("\n=== 2. Boilerplate-Anchor-Hit-Rate über alle 15.921 Schr. Anfragen ===\n");
const anker = db.prepare(`
  SELECT
    COUNT(*) total,
    SUM(CASE WHEN t.full_text LIKE '%Im Namen des Senats von Berlin beantworte ich Ihre Schriftliche Anfrage wie folgt%' THEN 1 ELSE 0 END) anker_standard,
    SUM(CASE WHEN t.full_text LIKE '%Im Namen des Senats von Berlin beantworte ich%' THEN 1 ELSE 0 END) anker_locker,
    SUM(CASE WHEN t.full_text LIKE '%Vorbemerkung der Verwaltung%' THEN 1 ELSE 0 END) hat_vorbemerkung,
    SUM(CASE WHEN t.full_text LIKE '%Senatsverwaltung für%' THEN 1 ELSE 0 END) hat_senatsverwaltung,
    SUM(CASE WHEN t.full_text LIKE '%Drucksache 19%Schriftliche Anfrage%19. Wahlperiode%' THEN 1 ELSE 0 END) standard_header
  FROM berlin_documents d JOIN berlin_pdf_texts t ON d.lok_url=t.lok_url
  WHERE d.dok_typ_label = 'Schriftliche Anfrage' AND t.full_text != ''
`).get() as any;
console.log(`Schr. Anfragen gesamt: ${anker.total}`);
console.log(`  Standard-Header (Drucksache+Wahlperiode+Schriftliche Anfrage):  ${anker.standard_header} (${(anker.standard_header/anker.total*100).toFixed(1)}%)`);
console.log(`  "Senatsverwaltung für …":                                       ${anker.hat_senatsverwaltung} (${(anker.hat_senatsverwaltung/anker.total*100).toFixed(1)}%)`);
console.log(`  "Im Namen des Senats … beantworte ich Ihre Schriftliche Anfrage wie folgt": ${anker.anker_standard} (${(anker.anker_standard/anker.total*100).toFixed(1)}%)`);
console.log(`  "Im Namen des Senats … beantworte ich" (lockerer):              ${anker.anker_locker} (${(anker.anker_locker/anker.total*100).toFixed(1)}%)`);
console.log(`  "Vorbemerkung der Verwaltung":                                  ${anker.hat_vorbemerkung} (${(anker.hat_vorbemerkung/anker.total*100).toFixed(1)}%)`);

// ── 3. Frage-Pattern-Diversität ──
console.log("\n=== 3. Frage-Pattern: welche Formate werden in Schr. Anfragen genutzt? ===\n");
const fragenpatterns = db.prepare(`
  SELECT
    SUM(CASE WHEN t.full_text LIKE '%Frage 1:%' THEN 1 ELSE 0 END) pattern_frage_doppelpunkt,
    SUM(CASE WHEN t.full_text LIKE '%Frage 1%' AND t.full_text NOT LIKE '%Frage 1:%' THEN 1 ELSE 0 END) pattern_frage_ohne,
    SUM(CASE WHEN t.full_text LIKE '%1.%Antwort zu 1%' THEN 1 ELSE 0 END) pattern_nummeriert,
    SUM(CASE WHEN t.full_text LIKE '%Zu 1.:%' THEN 1 ELSE 0 END) pattern_zu_nr,
    SUM(CASE WHEN t.full_text LIKE '%Antwort zu%' THEN 1 ELSE 0 END) pattern_antwort_zu,
    COUNT(*) total
  FROM berlin_documents d JOIN berlin_pdf_texts t ON d.lok_url=t.lok_url
  WHERE d.dok_typ_label = 'Schriftliche Anfrage' AND t.full_text != ''
`).get() as any;
console.log(`Total: ${fragenpatterns.total}`);
console.log(`  "Frage 1:" Format:           ${fragenpatterns.pattern_frage_doppelpunkt} (${(fragenpatterns.pattern_frage_doppelpunkt/fragenpatterns.total*100).toFixed(1)}%)`);
console.log(`  "Frage 1" ohne Doppelpunkt:  ${fragenpatterns.pattern_frage_ohne} (${(fragenpatterns.pattern_frage_ohne/fragenpatterns.total*100).toFixed(1)}%)`);
console.log(`  "1. … Antwort zu 1" Format:  ${fragenpatterns.pattern_nummeriert} (${(fragenpatterns.pattern_nummeriert/fragenpatterns.total*100).toFixed(1)}%)`);
console.log(`  "Zu 1.:" Format:             ${fragenpatterns.pattern_zu_nr} (${(fragenpatterns.pattern_zu_nr/fragenpatterns.total*100).toFixed(1)}%)`);
console.log(`  Mind. eine "Antwort zu":     ${fragenpatterns.pattern_antwort_zu} (${(fragenpatterns.pattern_antwort_zu/fragenpatterns.total*100).toFixed(1)}%)`);

// ── 4. Effektive Boilerplate-Reduktion über alle Anfragen (auf Basis Anker-Position) ──
console.log("\n=== 4. Boilerplate-Strip-Effekt: wie viel Bytes vor 'Im Namen des Senats'-Anker? ===\n");
const sample = db.prepare(`
  SELECT t.chars, t.full_text FROM berlin_documents d JOIN berlin_pdf_texts t ON d.lok_url=t.lok_url
  WHERE d.dok_typ_label = 'Schriftliche Anfrage' AND t.full_text != ''
`).all() as {chars: number, full_text: string}[];
let totalChars = 0;
let totalBoilerplate = 0;
const bucketStats = new Map<string, {n: number, origSum: number, stripSum: number, percentile_pos: number[]}>();
for (const s of sample) {
  totalChars += s.chars;
  const idx = s.full_text.indexOf("Im Namen des Senats von Berlin beantworte ich");
  const ankerEnd = idx > 0 ? idx + "Im Namen des Senats von Berlin beantworte ich Ihre Schriftliche Anfrage wie folgt:".length : 0;
  // Plus pages-marker boilerplate (~100 Z pro Seitenumbruch)
  const pageBreaks = (s.full_text.match(/-- \d+ of \d+ --/g) || []).length;
  const pageBoilerplate = pageBreaks * 100;
  const stripped = ankerEnd + pageBoilerplate;
  totalBoilerplate += stripped;

  let bucket = "kurz <5k";
  if (s.chars >= 5000 && s.chars < 10000) bucket = "mittel 5-10k";
  else if (s.chars >= 10000 && s.chars < 20000) bucket = "lang 10-20k";
  else if (s.chars >= 20000 && s.chars < 50000) bucket = "sehr lang 20-50k";
  else if (s.chars >= 50000) bucket = "extrem >50k";
  if (!bucketStats.has(bucket)) bucketStats.set(bucket, {n: 0, origSum: 0, stripSum: 0, percentile_pos: []});
  const b = bucketStats.get(bucket)!;
  b.n++; b.origSum += s.chars; b.stripSum += stripped;
}
console.log(`Σ Original: ${totalChars.toLocaleString("de-DE")} Z. → ${(totalChars-totalBoilerplate).toLocaleString("de-DE")} Z. nach Strip`);
console.log(`Boilerplate-Reduktion gesamt: ${(totalBoilerplate/totalChars*100).toFixed(1)}%\n`);

console.log("Bucket".padEnd(20) + "n".padStart(7) + "Ø orig".padStart(10) + "Ø nach Strip".padStart(14) + "Reduktion".padStart(12));
for (const [name, b] of [...bucketStats.entries()].sort()) {
  const red = b.stripSum / b.origSum * 100;
  console.log(name.padEnd(20) + b.n.toString().padStart(7) + (b.origSum/b.n).toFixed(0).padStart(10) + ((b.origSum-b.stripSum)/b.n).toFixed(0).padStart(14) + `${red.toFixed(1)}%`.padStart(12));
}

// ── 5. Token-Cost-Projektion mit Vorfiltern ──
console.log("\n=== 5. Token-Cost-Projektion mit Vorfiltern ===\n");
const cap15k = sample.reduce((a, s) => a + Math.min(s.chars, 15000), 0);
const inputTokensCapped = cap15k * 0.25; // ~4 Z/Token
const inputCostBatch = inputTokensCapped * 0.5 / 1_000_000; // Haiku Batch $0.50/MTok
// Output: reduziertes Schema, ~600-800 Tokens/DS statt 1.400
const outputTokens = sample.length * 700;
const outputCostBatch = outputTokens * 2.5 / 1_000_000;
const cacheReadCost = (5000 * (sample.length - 1) * 0.025) / 1_000_000; // System-Prompt-Cache

console.log(`Schr. Anfragen ${sample.length}:`);
console.log(`  Input nach 15k-Cap:          ${(inputTokensCapped/1_000_000).toFixed(1)}M Tokens → $${inputCostBatch.toFixed(2)}`);
console.log(`  Output (Ø 700 Tokens/DS):    ${(outputTokens/1_000_000).toFixed(1)}M Tokens → $${outputCostBatch.toFixed(2)}`);
console.log(`  Cache-Read (System-Prompt):  ~$${cacheReadCost.toFixed(2)}`);
console.log(`  Σ nur Anfragen:              $${(inputCostBatch + outputCostBatch + cacheReadCost).toFixed(2)}`);

db.close();
