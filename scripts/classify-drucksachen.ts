/**
 * Klassifiziert jede Drucksache in `drucksache_texts.batch_class`:
 *   - klein         (Kleine Anfrage, Antrag, Entschl-/Änderungsantrag)        Cap 6K
 *   - mittel        (Berichterstattung, Bericht, Unterrichtung)               Cap 16K
 *   - gross         (Gesetzentwurf, Große Anfrage)                            Cap 32K
 *   - antwort       (Schriftliche Frage / Antwort der Bundesregierung)       Cap 32K
 *   - regierung     (sonstige Reg-DS ohne Activity-Match)                     Cap 16K
 *   - administrativ (Wahlvorschlag, Sammelübersicht, Beschlussempfehlung)    Cap 2K
 *   - skip          (Reden — bereits via speech_analyses_v2 abgedeckt)
 *
 * Vorrangregel:
 *   1) Wenn `activities.dokumentart = 'Drucksache'` existiert → Klasse aus aktivitaetsart
 *      (Prio bei Konflikt: gross > mittel > antwort > klein > administrativ > skip)
 *   2) Sonst: PDF-Header-Regex auf full_text
 *   3) Sonst: 'regierung' (Default für reine Reg-DS ohne klare Form)
 *
 * Run: npx tsx scripts/classify-drucksachen.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// 1. Spalte hinzufügen (idempotent)
const cols = db.prepare(`PRAGMA table_info(drucksache_texts)`).all() as { name: string }[];
if (!cols.some((c) => c.name === "batch_class")) {
  db.exec(`ALTER TABLE drucksache_texts ADD COLUMN batch_class TEXT`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_drucksache_texts_class ON drucksache_texts(batch_class)`);
  console.log("✓ batch_class-Spalte angelegt");
}

// 2. Mapping aktivitaetsart → batch_class
const ART_TO_CLASS: Record<string, string> = {
  "Kleine Anfrage": "klein",
  "Antrag": "klein",
  "Entschließungsantrag": "klein",
  "Änderungsantrag": "klein",

  "Berichterstattung": "mittel",
  "Berichterstattung (zu Protokoll gegeben)": "mittel",

  "Gesetzentwurf": "gross",
  "Große Anfrage": "gross",

  "Frage": "antwort",
  "Antwort": "antwort",
  "Zusatzfrage": "antwort",

  // Reden — werden bereits in speech_analyses_v2 analysiert
  "Rede": "skip",
  "Rede (zu Protokoll gegeben)": "skip",
  "Zwischenfrage": "skip",
  "Kurzintervention": "skip",
  "Erwiderung": "skip",
  "Einleitende Ausführungen und Beantwortung": "skip",
  "Zur Geschäftsordnung BT": "skip",
  "Schriftliche Erklärung gem. § 31 Geschäftsordnung BT": "skip",
  "Erklärung zur Aussprache gem. § 30 Geschäftsordnung BT": "skip",
  "Persönliche Erklärung gem. § 32 Geschäftsordnung BT": "skip",
};

const CLASS_PRIO: Record<string, number> = {
  gross: 1, mittel: 2, antwort: 3, klein: 4, administrativ: 5, regierung: 6, skip: 7,
};

// 3. PDF-Header-Klassifikation für Reg-DS ohne Activity
function classifyFromPdfHeader(text: string): string {
  const head = text.slice(0, 800); // Cover-Bereich

  // Administrative Drucksachen-Typen
  if (/^Deutscher Bundestag Drucksache.*\s*Wahlvorschl[aä]g/is.test(head)
      || /Wahlvorschl[aä]g.{0,200}\s*der Fraktion/is.test(head)) return "administrativ";
  if (/Sammelübersicht/i.test(head)) return "administrativ";
  // HINWEIS: Beschlussempfehlung NICHT mehr administrativ — siehe unten
  // ("Berichte"). administrativ = nur Regex-Boilerplate ohne echte
  // Zusammenfassung; eine Beschlussempfehlung+Bericht ist aber die
  // zentrale "was wurde empfohlen / worum geht es"-Quelle für Votes.
  // Wahlvorschlag/Sammelübersicht bleiben administrativ (echt formal).

  // Antwort der Bundesregierung
  if (/Antwort\s+der Bundesregierung/i.test(head)) return "antwort";

  // Gesetz / Antrag etc.
  if (/Gesetzentwurf/i.test(head)) return "gross";
  if (/Große Anfrage/i.test(head)) return "gross";
  if (/Entschließungsantrag/i.test(head)) return "klein";
  if (/Änderungsantrag/i.test(head)) return "klein";
  if (/Kleine Anfrage/i.test(head)) return "klein";
  if (/^\s*Antrag\s*\n/m.test(head)) return "klein";

  // Berichte + Unterrichtungen + Beschlussempfehlungen (inhaltsreich,
  // vote-relevant → echte LLM-Zusammenfassung statt administrativ-Stub)
  if (/Beschlussempfehlung/i.test(head)) return "mittel";
  if (/^Unterrichtung/im.test(head)) return "mittel";
  if (/Unterrichtung\s+durch/i.test(head)) return "mittel";
  if (/^Bericht/im.test(head)) return "mittel";

  return "regierung"; // Default für reine Reg-DS
}

// 4. activities-basierte Klassen pro Drucksache
const actMap = new Map<string, string[]>();
const actRows = db
  .prepare(
    `SELECT drucksache_nr, aktivitaetsart
     FROM activities
     WHERE drucksache_nr IS NOT NULL AND dokumentart = 'Drucksache'`
  )
  .all() as { drucksache_nr: string; aktivitaetsart: string }[];

for (const r of actRows) {
  const klass = ART_TO_CLASS[r.aktivitaetsart];
  if (!klass) continue; // unbekannte aktivitaetsart → in Header-Fallback
  if (!actMap.has(r.drucksache_nr)) actMap.set(r.drucksache_nr, []);
  actMap.get(r.drucksache_nr)!.push(klass);
}

function bestClass(candidates: string[]): string {
  return candidates.sort((a, b) => CLASS_PRIO[a] - CLASS_PRIO[b])[0];
}

// 5. Klassifizieren
const allDs = db.prepare(`SELECT drucksache_nr, full_text FROM drucksache_texts WHERE parse_error IS NULL OR parse_error = 'empty:no-text-extracted'`).all() as { drucksache_nr: string; full_text: string }[];
const update = db.prepare(`UPDATE drucksache_texts SET batch_class = ? WHERE drucksache_nr = ?`);

const counts = new Map<string, number>();
const sources = new Map<string, number>(); // 'activities' | 'pdf-header' | 'default'

const tx = db.transaction(() => {
  for (const ds of allDs) {
    let cls: string;
    let source: string;
    const fromAct = actMap.get(ds.drucksache_nr);
    if (fromAct && fromAct.length > 0) {
      cls = bestClass(fromAct);
      source = "activities";
    } else {
      cls = classifyFromPdfHeader(ds.full_text ?? "");
      source = "pdf-header";
    }
    update.run(cls, ds.drucksache_nr);
    counts.set(cls, (counts.get(cls) ?? 0) + 1);
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }
});
tx();

console.log(`\n=== Klassifikation: ${allDs.length} Drucksachen ===`);
console.log(`\nNach Quelle:`);
for (const [s, n] of sources) console.log(`  ${s.padEnd(12)} ${n}`);

console.log(`\nNach Klasse (mit Token-Volumen):`);
const stats = db
  .prepare(
    `SELECT batch_class, COUNT(*) AS n,
            SUM(tokens_estimate) / 1000000.0 AS m_tokens,
            MIN(tokens_estimate) AS min_tok,
            ROUND(AVG(tokens_estimate)) AS avg_tok,
            MAX(tokens_estimate) AS max_tok
     FROM drucksache_texts WHERE batch_class IS NOT NULL
     GROUP BY batch_class ORDER BY n DESC`
  )
  .all() as { batch_class: string; n: number; m_tokens: number; min_tok: number; avg_tok: number; max_tok: number }[];

const colW = (s: string, w: number) => s.toString().padStart(w);
console.log(`  ${"class".padEnd(13)} ${"n".padStart(6)} ${"min".padStart(7)} ${"avg".padStart(8)} ${"max".padStart(8)} ${"Σ M tok".padStart(10)}`);
for (const r of stats) {
  console.log(`  ${r.batch_class.padEnd(13)} ${colW(r.n, 6)} ${colW(r.min_tok, 7)} ${colW(r.avg_tok, 8)} ${colW(r.max_tok, 8)} ${(r.m_tokens.toFixed(2) + " M").padStart(10)}`);
}

// Mit Cap-Berechnung
console.log(`\nNach Klasse mit Token-Cap (effektive LLM-Last):`);
const CAPS: Record<string, number> = {
  klein: 6000, mittel: 16000, gross: 32000, antwort: 32000, regierung: 16000, administrativ: 2000, skip: 0,
};
let totalCapped = 0;
for (const r of stats) {
  const cap = CAPS[r.batch_class] ?? 8000;
  const cappedSumQuery = db
    .prepare(
      `SELECT SUM(MIN(tokens_estimate, ?)) AS s FROM drucksache_texts WHERE batch_class = ?`
    )
    .get(cap, r.batch_class) as { s: number };
  const cappedM = (cappedSumQuery.s ?? 0) / 1000000;
  totalCapped += cappedSumQuery.s ?? 0;
  console.log(`  ${r.batch_class.padEnd(13)} Cap=${cap.toString().padStart(5)}  effektiv ${cappedM.toFixed(2)} M tok`);
}
console.log(`  ${"".padEnd(13)} ${"Σ".padStart(11)}  ${(totalCapped / 1000000).toFixed(2)} M tok input`);
console.log(`\n  Haiku 4.5 Batch (50% off):  $${((totalCapped / 1_000_000) * 0.4).toFixed(2)} input`);
console.log(`                              + ~$2 output (geschätzt 1 M Output-Tokens)`);
