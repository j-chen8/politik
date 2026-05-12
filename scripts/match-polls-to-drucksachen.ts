/**
 * Match die 50 namentlichen Abstimmungen zu ihren zugrunde liegenden Drucksachen.
 * Heuristik: signifikante Keywords aus poll_label vs. Drucksachen-Titel,
 * gefiltert auf Datumsbereich poll_date ± 60 Tage.
 *
 * Persistiert in neuer Tabelle drucksache_polls.
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS drucksache_polls (
    drucksache_nr TEXT NOT NULL,
    poll_id INTEGER NOT NULL,
    match_score REAL NOT NULL,
    matched_via TEXT NOT NULL,
    PRIMARY KEY (drucksache_nr, poll_id)
  );
`);

// Stopwörter ausfiltern
const STOP = new Set([
  "der","die","das","den","des","dem","ein","eine","einer","einen","eines","einem",
  "und","oder","nicht","auch","mehr","gegen","für","von","zu","zur","im","in","am",
  "bei","mit","aus","auf","wegen","beschlussempfehlung","antrag","ablehnung","weitere",
  "gesetz","gesetzes","gesetzentwurf","änderung","novelle","entwurf","ein","eines","keinen",
  "kein","keine","gemäß","abs","§"
]);

function tokenize(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^\wäöüß\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOP.has(w));
}

interface Poll { poll_id: number; poll_label: string; poll_date: string; }
interface DsRow { drucksache_nr: string; titel: string; publication_date: string; }

const polls = db.prepare(`
  SELECT DISTINCT poll_id, poll_label, poll_date
  FROM votes WHERE poll_label IS NOT NULL AND poll_date IS NOT NULL
`).all() as Poll[];

const dsRows = db.prepare(`
  SELECT a.drucksache_nr,
         (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL LIMIT 1) AS titel,
         t.publication_date
  FROM drucksache_analyses a
  JOIN drucksache_texts t ON t.drucksache_nr=a.drucksache_nr
  WHERE a.analyze_error IS NULL AND t.publication_date IS NOT NULL
`).all() as DsRow[];

// Index DS-Titel-Tokens
const dsTokenIdx = dsRows
  .filter((r) => r.titel)
  .map((r) => ({ ...r, tokens: new Set(tokenize(r.titel)) }));

const ins = db.prepare(`
  INSERT OR REPLACE INTO drucksache_polls (drucksache_nr, poll_id, match_score, matched_via)
  VALUES (?, ?, ?, ?)
`);

console.log(`📋 ${polls.length} polls × ${dsTokenIdx.length} ds-titles`);

let matched = 0, unmatched: Poll[] = [];

for (const p of polls) {
  const pollTokens = new Set(tokenize(p.poll_label));
  if (pollTokens.size === 0) { unmatched.push(p); continue; }
  const pollDateMs = new Date(p.poll_date + "T00:00:00").getTime();
  const window = 60 * 24 * 3600 * 1000;

  let best: { ds: typeof dsTokenIdx[0]; score: number } | null = null;
  for (const ds of dsTokenIdx) {
    if (!ds.publication_date) continue;
    const dsMs = new Date(ds.publication_date + "T00:00:00").getTime();
    // DS muss BEFORE oder zur poll_date veröffentlicht sein, max 60 Tage vorher
    if (dsMs > pollDateMs + 86400000) continue;
    if (pollDateMs - dsMs > window) continue;

    // Token-Overlap
    let overlap = 0;
    for (const t of pollTokens) if (ds.tokens.has(t)) overlap++;
    if (overlap < 2) continue;  // mind. 2 signifikante Treffer
    const score = overlap / Math.sqrt(pollTokens.size * ds.tokens.size);

    if (!best || score > best.score) best = { ds, score };
  }

  if (best && best.score >= 0.15) {
    ins.run(best.ds.drucksache_nr, p.poll_id, best.score, "keyword-overlap");
    matched++;
    console.log(`✓ ${p.poll_label.slice(0, 60)}… → ${best.ds.drucksache_nr} (score ${best.score.toFixed(2)})`);
  } else {
    unmatched.push(p);
  }
}

console.log(`\n=== Fertig ===`);
console.log(`  Matched:   ${matched}`);
console.log(`  Unmatched: ${unmatched.length}`);
if (unmatched.length > 0) {
  console.log(`\nUngematchte Polls (eventuell ältere Wahlperiode oder kein DS-Titel-Match):`);
  for (const p of unmatched.slice(0, 20)) console.log(`  ${p.poll_id} ${p.poll_date} ${p.poll_label.slice(0, 70)}`);
}
