/**
 * classify-drucksache-instrument.ts — leitet den Instrument-Typ jeder Bundestags-
 * Drucksache aus dem offiziellen Volltext-Kopf ab (rein regex, keine API).
 *
 * Hintergrund: Rohes Drucksachen-"Volumen" ist als Maß für parlamentarisches
 * Handeln irreführend — 62 % sind Kleine Anfragen (Opposition-Kontrolle), nur
 * ~19 % echte Gesetzgebung (Gesetzentwurf + Beschlussempfehlung). Für die Themen-
 * Frontdoor trennen wir "Handeln" (Gesetzgebung) von "Kontrolle" (Anfragen).
 *
 * Quelle: drucksache_texts.full_text. Der Kopf ist starr:
 *   "Deutscher Bundestag  Drucksache 21/X  21. Wahlperiode  DD.MM.YYYY  <TYP> …"
 * Wir nehmen das ERSTE Typ-Schlüsselwort NACH dem Datum (Position-basiert, damit
 * "Beschlussempfehlung und Bericht … zu dem Gesetzentwurf" korrekt = Beschluss).
 *
 * Schreibt Tabelle drucksache_instrument(drucksache_nr, instrument, bucket,
 * publication_date). bucket ∈ {handeln, kontrolle, antrag, regierung, sonstiges}.
 *
 * Usage: npx tsx scripts/classify-drucksache-instrument.ts [--write]
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");
const WRITE = process.argv.includes("--write");

// Typ-Schlüsselwort → kanonisches Instrument + Bucket. Reihenfolge egal — wir
// wählen nach Textposition, nicht nach Listenreihenfolge.
const TYPES: { kw: RegExp; instrument: string; bucket: string }[] = [
  { kw: /Beschlussempfehlung/i, instrument: "beschlussempfehlung", bucket: "handeln" },
  { kw: /Gesetzentwurf/i, instrument: "gesetzentwurf", bucket: "handeln" },
  { kw: /Verordnung/i, instrument: "verordnung", bucket: "handeln" },
  { kw: /Kleine Anfrage/i, instrument: "kleine_anfrage", bucket: "kontrolle" },
  { kw: /Große Anfrage|Grosse Anfrage/i, instrument: "grosse_anfrage", bucket: "kontrolle" },
  { kw: /Schriftliche Frage|Fragestunde|Mündliche Frage/i, instrument: "anfrage_sonstige", bucket: "kontrolle" },
  { kw: /Antrag/i, instrument: "antrag", bucket: "antrag" },
  { kw: /Unterrichtung/i, instrument: "unterrichtung", bucket: "regierung" },
  { kw: /Bericht/i, instrument: "bericht", bucket: "regierung" },
  { kw: /Antwort/i, instrument: "antwort", bucket: "antwort" },
];

function classify(fullText: string): { instrument: string; bucket: string } {
  // Fenster nach dem Datum (DD.MM.YYYY), sonst ab Anfang.
  const m = fullText.match(/\d{2}\.\d{2}\.\d{4}/);
  const start = m ? (m.index ?? 0) + m[0].length : 0;
  const window = fullText.slice(start, start + 120);
  let best: { instrument: string; bucket: string; pos: number } | null = null;
  for (const t of TYPES) {
    const mm = window.match(t.kw);
    if (mm && mm.index !== undefined) {
      if (!best || mm.index < best.pos) best = { instrument: t.instrument, bucket: t.bucket, pos: mm.index };
    }
  }
  return best ? { instrument: best.instrument, bucket: best.bucket } : { instrument: "sonstiges", bucket: "sonstiges" };
}

const rows = db
  .prepare(`SELECT drucksache_nr, full_text, publication_date FROM drucksache_texts WHERE full_text IS NOT NULL AND length(full_text) > 100`)
  .all() as { drucksache_nr: string; full_text: string; publication_date: string | null }[];

const results = rows.map((r) => {
  const { instrument, bucket } = classify(r.full_text);
  // Ungültige OCR-Daten (Jahr < 2024) verwerfen
  const pub = r.publication_date && /^20(2[4-9]|[3-9])/.test(r.publication_date) ? r.publication_date : null;
  return { nr: r.drucksache_nr, instrument, bucket, pub };
});

// Verteilung
const byBucket: Record<string, number> = {};
const byInstr: Record<string, number> = {};
for (const r of results) {
  byBucket[r.bucket] = (byBucket[r.bucket] ?? 0) + 1;
  byInstr[r.instrument] = (byInstr[r.instrument] ?? 0) + 1;
}
console.log(`Klassifiziert: ${results.length} Drucksachen\n`);
console.log("Bucket:");
for (const [k, v] of Object.entries(byBucket).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);
console.log("\nInstrument:");
for (const [k, v] of Object.entries(byInstr).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);

if (WRITE) {
  db.exec(`CREATE TABLE IF NOT EXISTS drucksache_instrument (
    drucksache_nr TEXT PRIMARY KEY,
    instrument TEXT NOT NULL,
    bucket TEXT NOT NULL,
    publication_date TEXT
  )`);
  const up = db.prepare(
    `INSERT INTO drucksache_instrument (drucksache_nr, instrument, bucket, publication_date)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(drucksache_nr) DO UPDATE SET instrument=excluded.instrument, bucket=excluded.bucket, publication_date=excluded.publication_date`,
  );
  const tx = db.transaction(() => {
    for (const r of results) up.run(r.nr, r.instrument, r.bucket, r.pub);
  });
  tx();
  console.log(`\n✓ geschrieben in drucksache_instrument (${results.length} Zeilen)`);
} else {
  console.log("\n(Dry-Run — mit --write speichern)");
}
db.close();
