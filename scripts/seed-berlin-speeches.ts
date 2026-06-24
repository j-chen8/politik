/**
 * Berlin-Pilot Stufe 3 — Reden-Extraktion aus Plenarprotokoll-PDFs.
 *
 * Quelle: berlin_pdf_texts.full_text (124 Plenarprotokolle, davon 80 Wortprotokolle).
 * Ziel:   berlin_speeches — pro Sprecher-Wechsel ein Eintrag.
 *
 * Design-Entscheidungen (siehe Schema-Diskussion):
 *   - speech_id ist deterministisch ({wp}-{sitzung}-r{order}), NICHT auto-increment
 *   - idempotent via INSERT OR REPLACE auf speech_id
 *   - keine MIN_CHAR_LEN-Filterung (auch 35-Zeichen-Wortmeldungen sind dabei)
 *   - speech_type wird aus TOP-Kontext abgeleitet (kein default 'debatte')
 *   - Beifall/Zwischenrufe werden aus text entfernt und nach interruptions verschoben
 *   - politician_id-Match via deselben Namens-Matcher wie seed-berlin-pardok.ts
 *
 * Run: npx tsx scripts/seed-berlin-speeches.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const REPORT_PATH = path.join(process.cwd(), "scripts/seed-berlin-speeches.report.json");
const BERLIN_PARLIAMENT_ID_LOCAL = 2;
const EXTRACTOR_VERSION = "berlin-speech-v3";

// ── Vokabular ──
const FRAKTIONEN = ["SPD", "CDU", "GRÜNE", "Grüne", "AfD", "LINKE", "Die Linke", "FDP"];
const FRAKTION_RE = `(?:${FRAKTIONEN.map((f) => f.replace(/ /g, "\\s+")).join("|")})`;
const ROLLEN = [
  "Regierender Bürgermeister",
  "Regierende Bürgermeisterin",
  "Bürgermeister",
  "Bürgermeisterin",
  "Senator",
  "Senatorin",
  "Staatssekretär",
  "Staatssekretärin",
  "Alterspräsidentin",       // konstituierende Sitzung nach Wiederholungswahl
  "Alterspräsident",
  "Vizepräsidentin",
  "Vizepräsident",
  "Präsidentin",
  "Präsident",
];
const ROLLE_RE = `(?:${ROLLEN.join("|")})`;
const rolleStartRe = new RegExp(`^(?:${ROLLEN.join("|")})\\s+[A-ZÄÖÜ]`);

const tocMdlRe = new RegExp(
  `^(?<name>[A-ZÄÖÜ][^()]{1,80}?)\\s*\\((?<party>${FRAKTION_RE})\\)\\s*\\.{2,}\\s*(?<page>\\d{1,4})\\s*$`
);
const tocRolleRe = new RegExp(
  `^(?<role>${ROLLE_RE})\\s+(?<name>[A-ZÄÖÜ][^()]{1,80}?)\\s*\\.{2,}\\s*(?<page>\\d{1,4})\\s*$`
);
// Body-MdL-Marker. Schließt Zwischenruf-Patterns aus, die ohne führende [ erscheinen können
// (z.B. wenn pdf-parse die Klammer auf eigene Zeile schiebt): "Zuruf von X (Y):", "Beifall von Z (Y):"
const bodyMdlRe = new RegExp(
  `^(?!(?:Zuruf|Beifall|Heiterkeit|Lachen|Unruhe)\\s+(?:von|bei)\\b)(?<name>[A-ZÄÖÜ][^()\\[\\]]{1,80}?)\\s*\\((?<party>${FRAKTION_RE})\\)\\s*:\\s*$`
);
const bodyRolleRe = new RegExp(
  `^(?<role>${ROLLE_RE})\\s+(?<name>[A-ZÄÖÜ][^:\\[\\]()]{1,60}?)\\s*(?:\\((?<ressort>[^)]{1,120})\\))?\\s*:\\s*$`
);

// TOP im TOC: "1 Aktuelle Stunde ............... 369" oder "45 A Volle Solidarität ........... 360"
// (Body-TOP-Erkennung war fehleranfällig — Fließtext mit Zahlen-Anfang matchte fälschlich.
//  TOC ist via dotty-leaders eindeutig.)
const tocTopRe = /^(?<top>\d{1,3}(?:\s+[A-Z])?)\s+(?<titel>[A-ZÄÖÜ].{4,150}?)\s*\.{2,}\s*(?<page>\d{1,4})\s*$/;
// Drucksachen-Referenz: "Drucksache 19/0190" oder "Drucksache 19/0191-1"
const drsRe = /Drucksache\s+(\d{1,2}\/\d{4}(?:-\d+)?)/g;
// Seitenmarker im Body: "Seite 354 Plenarprotokoll 19/7" oder pdf-parse Marker "-- N of M --"
const seitenMarkerRe = /^Seite\s+(\d{1,4})\s+Plenarprotokoll/;
const pageBreakRe = /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/;
// Seitenumbruch-Footer: "-- N of M --" plus die folgenden 4 Header-Zeilen
const pageFooterRe = /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/;
// Continuation-Marker: "(Name)" als eigene Zeile nach Seitenumbruch
const continuationRe = /^\s*\([A-ZÄÖÜ][^()]{2,80}\)\s*$/;

// ── Schema ──
function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS berlin_speeches (
      speech_id            TEXT PRIMARY KEY,
      wp                   INTEGER NOT NULL,
      sitzung_nr           INTEGER NOT NULL,
      datum                TEXT,
      pdf_filename         TEXT NOT NULL,
      lok_url              TEXT NOT NULL,
      order_in_session     INTEGER NOT NULL,
      body_marker_order    INTEGER NOT NULL,

      speaker_raw          TEXT NOT NULL,
      speaker_name         TEXT NOT NULL,
      speaker_party        TEXT,
      speaker_role         TEXT,
      speaker_ressort      TEXT,
      politician_id        INTEGER,

      top_marker           TEXT,
      top_titel            TEXT,
      drucksache_nrn       TEXT,

      speech_type          TEXT,
      is_praesidium        INTEGER DEFAULT 0,

      text                 TEXT NOT NULL,
      text_chars           INTEGER,
      interruptions        TEXT,

      start_line           INTEGER,
      end_line             INTEGER,
      parse_warnings       TEXT,

      extractor_version    TEXT NOT NULL,
      extracted_at         TEXT NOT NULL,

      FOREIGN KEY (politician_id) REFERENCES politicians(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bspeech_sitzung    ON berlin_speeches(wp, sitzung_nr);
    CREATE INDEX IF NOT EXISTS idx_bspeech_politician ON berlin_speeches(politician_id);
    CREATE INDEX IF NOT EXISTS idx_bspeech_top        ON berlin_speeches(wp, sitzung_nr, top_marker);
    -- Seek auf sitzung_nr OHNE wp: getSitzungDetail filtert nur sitzung_nr (+ top),
    -- idx_bspeech_top beginnt aber mit wp → Leftmost-Prefix verhindert Seek.
    CREATE INDEX IF NOT EXISTS idx_bspeech_sitzung_top_titel ON berlin_speeches(sitzung_nr, top_marker, top_titel);
    CREATE INDEX IF NOT EXISTS idx_bspeech_party      ON berlin_speeches(speaker_party);
    CREATE INDEX IF NOT EXISTS idx_bspeech_datum      ON berlin_speeches(datum);
    CREATE INDEX IF NOT EXISTS idx_bspeech_type       ON berlin_speeches(speech_type);
  `);
}

// ── Namens-Helfer (analog seed-berlin-pardok.ts) ──
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingTitles(name: string): string {
  return name
    .replace(/^(?:(?:Prof\.|Dr\.|Dipl\.[A-Za-zÄÖÜäöü-]*\.?|Mag\.|h\.c\.|MdB|MdL|MdA|MdEP)\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface Local { id: number; first: string; last: string }
function buildMatcher(locals: Local[]) {
  const byFull = new Map<string, Local>();
  const byLast = new Map<string, Local[]>();
  for (const l of locals) {
    byFull.set(normalize(`${l.first} ${l.last}`), l);
    for (const w of normalize(l.last).split(" ")) {
      if (w) (byLast.get(w) ?? byLast.set(w, []).get(w)!).push(l);
    }
  }
  return (first: string, last: string): number | null => {
    const exact = byFull.get(normalize(`${first} ${last}`));
    if (exact) return exact.id;
    const fw = normalize(first).split(" ")[0];
    const seen = new Set<Local>();
    const cands: Local[] = [];
    for (const w of normalize(last).split(" ")) {
      for (const c of byLast.get(w) ?? []) {
        if (seen.has(c)) continue;
        if (normalize(c.first).split(" ")[0] === fw) { seen.add(c); cands.push(c); }
      }
    }
    return cands.length === 1 ? cands[0].id : null;
  };
}

// Body-Format "Vorname Nachname" → first/last (mit Adelspartikel-Erkennung minimal)
const NAME_PARTICLES = new Set([
  "von", "van", "de", "du", "der", "den", "zu", "vom",
  "ten", "ter", "da", "di", "dos", "dal", "del", "le", "la",
]);
function splitBodyName(raw: string): { first: string; last: string } {
  const cleaned = stripLeadingTitles(raw.trim());
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { first: "", last: parts[0] };
  let lastStart = parts.length - 1;
  while (lastStart > 0 && NAME_PARTICLES.has(parts[lastStart - 1].toLowerCase())) {
    lastStart--;
  }
  return {
    first: parts.slice(0, lastStart).join(" "),
    last: parts.slice(lastStart).join(" "),
  };
}

// ── Volltext-Pre-Processing ──
function joinMultiLineMarkers(rawLines: string[]): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < rawLines.length) {
    let cur = rawLines[i];
    while (
      rolleStartRe.test(cur) &&
      /\([^)]*$/.test(cur) &&
      !cur.trimEnd().endsWith(":") &&
      i + 1 < rawLines.length
    ) {
      cur = cur.trimEnd() + " " + rawLines[i + 1].trimStart();
      i++;
    }
    lines.push(cur);
    i++;
  }
  return lines;
}

// ── TOC-Parsing ──
type TocEntry = { name: string; party: string | null; role: string | null; page: number; line: number };
function parseToc(lines: string[], cutoff: number): TocEntry[] {
  const entries: TocEntry[] = [];
  for (let i = 0; i < cutoff; i++) {
    const line = lines[i];
    let m = line.match(tocMdlRe);
    if (m?.groups) {
      entries.push({ name: m.groups.name.trim(), party: m.groups.party, role: null, page: parseInt(m.groups.page, 10), line: i });
      continue;
    }
    m = line.match(tocRolleRe);
    if (m?.groups) {
      entries.push({ name: m.groups.name.trim(), party: null, role: m.groups.role, page: parseInt(m.groups.page, 10), line: i });
    }
  }
  return entries;
}

// ── Body-Parsing ──
type BodyMarker = {
  line: number;
  name: string;
  party: string | null;
  role: string | null;
  ressort: string | null;
  raw: string;
};
function parseBody(lines: string[], startLine: number): BodyMarker[] {
  const markers: BodyMarker[] = [];
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    let m = line.match(bodyMdlRe);
    if (m?.groups) {
      markers.push({
        line: i,
        name: m.groups.name.trim(),
        party: m.groups.party,
        role: null,
        ressort: null,
        raw: `${m.groups.name.trim()} (${m.groups.party})`,
      });
      continue;
    }
    m = line.match(bodyRolleRe);
    if (m?.groups) {
      const ressort = m.groups.ressort?.trim() ?? null;
      markers.push({
        line: i,
        name: m.groups.name.trim(),
        party: null,
        role: m.groups.role,
        ressort,
        raw: ressort ? `${m.groups.role} ${m.groups.name.trim()} (${ressort})` : `${m.groups.role} ${m.groups.name.trim()}`,
      });
    }
  }
  return markers;
}

const isPraesidiumRole = (role: string | null): boolean =>
  !!role && /^(Vizepräsident|Vizepräsidentin|Präsident|Präsidentin)$/.test(role);

// ── TOP-Tracking (V2): TOPs aus dem TOC parsen, Drucksachen aus dem Body sammeln ──
type TopContext = {
  marker: string;
  titel: string;
  page_start: number;
  drucksachen: string[];
};

function parseTopsFromToc(lines: string[], cutoff: number): TopContext[] {
  const tops: TopContext[] = [];
  for (let i = 0; i < cutoff; i++) {
    const line = lines[i];
    const m = line.match(tocTopRe);
    if (m?.groups) {
      // Heuristik: TOP-Titel muss ein Anfangsbuchstabe + ein paar Worte sein.
      // Filter aus: Untertitel ohne TOP-Nummer (sind eh nicht matchend hier),
      // sowie sub-Headers wie "Ergebnisse ........ 368"
      const titel = m.groups.titel.trim();
      if (titel.length >= 5 && !/^Ergebnis/i.test(titel) && !/^Beschlusstext/i.test(titel)) {
        tops.push({
          marker: m.groups.top.trim(),
          titel,
          page_start: parseInt(m.groups.page, 10),
          drucksachen: [],
        });
      }
    }
  }
  return tops;
}

// Body-Seitenzahl-Tracking: pro Zeile, welche PDF-Seite ist aktuell.
// Aus "Seite N Plenarprotokoll X/Y"-Header pro Seitenanfang (verlässlich), Fallback auf "-- N of M --"-Marker.
function buildLineToPageMap(lines: string[]): number[] {
  const map = new Array(lines.length).fill(0);
  let currentPage = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(seitenMarkerRe);
    if (m) currentPage = parseInt(m[1], 10);
    map[i] = currentPage;
  }
  return map;
}

function topAtPage(tops: TopContext[], page: number): TopContext | null {
  if (page <= 0) return null;
  let last: TopContext | null = null;
  for (const t of tops) {
    if (t.page_start <= page) last = t;
    else break;
  }
  return last;
}

// Drucksachen-Referenzen aus dem TOC pro TOP-Bereich sammeln (zwischen TOPs i und i+1)
function attachDrucksachenFromToc(tops: TopContext[], lines: string[], cutoff: number) {
  for (let ti = 0; ti < tops.length; ti++) {
    const t = tops[ti];
    // Finde TOC-Zeile für diesen TOP, dann scan bis zur nächsten TOP-Zeile (oder cutoff)
    let startLine = -1;
    for (let i = 0; i < cutoff; i++) {
      const m = lines[i].match(tocTopRe);
      if (m?.groups && m.groups.top.trim() === t.marker && m.groups.titel.trim().startsWith(t.titel.slice(0, 20))) {
        startLine = i;
        break;
      }
    }
    if (startLine < 0) continue;
    let endLine = cutoff;
    for (let i = startLine + 1; i < cutoff; i++) {
      const m = lines[i].match(tocTopRe);
      if (m?.groups) { endLine = i; break; }
    }
    for (let i = startLine; i < endLine; i++) {
      for (const dm of lines[i].matchAll(drsRe)) {
        if (!t.drucksachen.includes(dm[1])) t.drucksachen.push(dm[1]);
      }
    }
  }
}

// Speech-Type aus TOP-Kontext + Speaker-Role ableiten
function deriveSpeechType(
  topTitel: string | null,
  speakerRole: string | null,
  isPraesidium: boolean
): string | null {
  if (isPraesidium) return "praesidium";
  if (!topTitel) return null;
  const t = topTitel.toLowerCase();
  if (t.startsWith("fragestunde") || t.startsWith("mündliche anfrage")) {
    return speakerRole ? "fragestunde_antwort" : "fragestunde_frage";
  }
  if (t.includes("persönliche erklärung") || t.includes("erklärung nach")) {
    return "persoenliche_erklaerung";
  }
  if (t.includes("aktuelle stunde") || t.includes("lesung") || t.includes("antrag") || t.includes("aussprache") || t.includes("debatte")) {
    return "debatte";
  }
  return "debatte"; // default für klar Body-Sprecher in TOPs die nicht Fragestunde/Erklärung sind
}

// ── Text-Säuberung + Interruptions-Extraktion ──
type Interruption =
  | { type: "beifall"; from_parties: string[]; raw: string; pos: number }
  | { type: "zwischenruf"; speaker_raw: string; speaker_name: string | null; party: string | null; text: string; pos: number }
  | { type: "heiterkeit" | "lachen" | "unruhe"; from: string | null; pos: number }
  | { type: "sonstiges"; text: string; pos: number };

function extractInterruptions(rawText: string): { text: string; interruptions: Interruption[] } {
  // Strip Seitenumbruch-Footer (4-5 Zeilen nach "-- N of M --") + Continuation-Marker
  const lines = rawText.split("\n");
  const cleanedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (pageFooterRe.test(l)) {
      // Skip Footer + bis zur Zeile mit dem nächsten Datum oder leeren Zeile
      // Header-Block ist typischerweise: leer, "Abgeordnetenhaus von Berlin", "19. Wahlperiode", "Seite XXX Plenarprotokoll 19/X", "TT. Monat YYYY", leer
      let skipUntil = i + 1;
      while (
        skipUntil < lines.length &&
        skipUntil < i + 8 &&
        !/[a-zäöü]/i.test(lines[skipUntil].replace(/Abgeordnetenhaus|Wahlperiode|Plenarprotokoll|Seite|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|^\s*$/g, "").trim())
      ) {
        skipUntil++;
      }
      i = skipUntil - 1;
      continue;
    }
    if (continuationRe.test(l)) continue; // (Name) als eigene Zeile nach Umbruch
    cleanedLines.push(l);
  }
  let working = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  const interruptions: Interruption[] = [];

  // Greife alle [...]-Blöcke. Diese können mehrzeilig sein und – Trennzeichen enthalten.
  const bracketRe = /\[([^\[\]]{2,500}?)\]/gs;
  const parts: string[] = [];
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  while ((m = bracketRe.exec(working)) !== null) {
    parts.push(working.slice(lastEnd, m.index));
    const innerRaw = m[1].replace(/\s+/g, " ").trim();
    const pos = parts.join("").length; // Position im gesäuberten Text
    // Mehrere Annotations in einem Block: getrennt durch " – "
    const subs = innerRaw.split(/\s+–\s+/);
    for (const sub of subs) {
      const c = sub.trim();
      if (!c) continue;
      if (/^Beifall/i.test(c)) {
        // Parteien aus "bei der SPD, den GRÜNEN, ..." extrahieren
        const parties = [...c.matchAll(/\b(SPD|CDU|GRÜNEN|Grünen|GRÜNE|AfD|LINKEN|Linken|LINKE|FDP)\b/g)].map((x) => x[1]);
        // Normalisiere "GRÜNEN" → "GRÜNE", "LINKEN" → "LINKE", "Grünen" → "GRÜNE"
        const norm = parties.map((p) => p.replace(/^(GRÜNEN|Grünen|Grüne)$/, "GRÜNE").replace(/^(LINKEN|Linken)$/, "LINKE")).filter((p, i, arr) => arr.indexOf(p) === i);
        interruptions.push({ type: "beifall", from_parties: norm, raw: c, pos });
      } else if (/^Heiterkeit/i.test(c)) {
        const fromM = c.match(/\bbei (?:der |den )?([A-ZÄÖÜa-zäöü]+)/);
        interruptions.push({ type: "heiterkeit", from: fromM?.[1] ?? null, pos });
      } else if (/^Lachen/i.test(c)) {
        const fromM = c.match(/\bbei (?:der |den )?([A-ZÄÖÜa-zäöü]+)/);
        interruptions.push({ type: "lachen", from: fromM?.[1] ?? null, pos });
      } else if (/^Unruhe/i.test(c)) {
        const fromM = c.match(/\bbei (?:der |den )?([A-ZÄÖÜa-zäöü]+)/);
        interruptions.push({ type: "unruhe", from: fromM?.[1] ?? null, pos });
      } else {
        // Zwischenruf-Pattern: "Name (Fraktion): Text" oder einfach Text
        const zwM = c.match(/^([A-ZÄÖÜ][\wäöüß.\-' ]+?)\s*\((SPD|CDU|GRÜNE|Grüne|AfD|LINKE|Die Linke|FDP)\)\s*:\s*(.+)$/);
        if (zwM) {
          interruptions.push({
            type: "zwischenruf",
            speaker_raw: `${zwM[1].trim()} (${zwM[2]})`,
            speaker_name: zwM[1].trim(),
            party: zwM[2],
            text: zwM[3].trim(),
            pos,
          });
        } else {
          interruptions.push({ type: "sonstiges", text: c, pos });
        }
      }
    }
    lastEnd = m.index + m[0].length;
  }
  parts.push(working.slice(lastEnd));
  let text = parts.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  // Whitespace normalisieren: pdf-parse splittet manche Wörter mit "Wort-\nWort" Bindestrichen
  text = text.replace(/-\n([a-zäöüß])/g, "$1");
  return { text, interruptions };
}

// ── Datum aus dem PDF-Header extrahieren ──
function extractDatum(rawLines: string[]): string | null {
  const monate: Record<string, string> = {
    Januar: "01", Februar: "02", März: "03", April: "04", Mai: "05", Juni: "06",
    Juli: "07", August: "08", September: "09", Oktober: "10", November: "11", Dezember: "12",
  };
  for (let i = 0; i < Math.min(20, rawLines.length); i++) {
    const m = rawLines[i].match(/(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),\s*(\d{1,2})\.\s*(\w+)\s+(\d{4})/);
    if (m && monate[m[2]]) {
      const d = m[1].padStart(2, "0");
      return `${m[3]}-${monate[m[2]]}-${d}`;
    }
  }
  return null;
}

function extractSitzungWp(pdfFilename: string): { wp: number; sitzung: number } | null {
  const m = pdfFilename.match(/p(\d+)-(\d+)/);
  if (!m) return null;
  return { wp: parseInt(m[1], 10), sitzung: parseInt(m[2], 10) };
}

// ── Main ──
function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");
  ensureSchema(db);

  // Primärer Pool: Berlin-MdL (eindeutiger Match-Kontext)
  const localsBerlin = db
    .prepare(
      `SELECT p.id, p.first_name AS first, p.last_name AS last
         FROM politicians p
         JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
         JOIN parliament_periods pp ON m.parliament_period_id = pp.id
        WHERE pp.parliament_id = ?`
    )
    .all(BERLIN_PARLIAMENT_ID_LOCAL) as Local[];
  const matchBerlin = buildMatcher(localsBerlin);

  // Fallback-Pool: alle politicians (für Berlin-MdL die später in BT/EP gewechselt sind,
  // deren Berlin-Mandat in der DB fehlt; siehe Pre-existing Daten-Bug bei Gennburg etc.)
  const localsAll = db
    .prepare(`SELECT id, first_name AS first, last_name AS last FROM politicians`)
    .all() as Local[];
  const matchAll = buildMatcher(localsAll);
  console.log(`${localsBerlin.length} Berliner MdL (Primär) + ${localsAll.length} Politiker insgesamt (Fallback) geladen`);

  function matchTwoStage(first: string, last: string): number | null {
    return matchBerlin(first, last) ?? matchAll(first, last);
  }

  const allPdfs = db
    .prepare(
      `SELECT pdf_filename, pages, full_text, lok_url
         FROM berlin_pdf_texts
        WHERE dok_art = 'Plenarprotokoll'
          AND full_text IS NOT NULL AND full_text != ''
          AND pdf_filename LIKE '%-wp.pdf'
        ORDER BY pdf_filename`
    )
    .all() as { pdf_filename: string; pages: number; full_text: string; lok_url: string }[];

  console.log(`\n${allPdfs.length} Wortprotokolle zu verarbeiten\n`);

  // Nur NEUE Sitzungen verarbeiten. berlin_speech_analyses hat einen FK auf
  // berlin_speeches.speech_id — ein INSERT OR REPLACE über bereits analysierte
  // Sitzungen würde beim Replace (delete→insert) den FK verletzen. Inkrementell
  // ist ohnehin das gewünschte Verhalten. --force erzwingt Re-Extraktion (dann
  // muss FK-Handling separat bedacht werden).
  const FORCE_RESEED = process.argv.includes("--force");
  const seededSessions = new Set(
    (db.prepare(`SELECT DISTINCT sitzung_nr FROM berlin_speeches`).all() as { sitzung_nr: number }[])
      .map((r) => r.sitzung_nr)
  );

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO berlin_speeches (
      speech_id, wp, sitzung_nr, datum, pdf_filename, lok_url,
      order_in_session, body_marker_order,
      speaker_raw, speaker_name, speaker_party, speaker_role, speaker_ressort, politician_id,
      top_marker, top_titel, drucksache_nrn,
      speech_type, is_praesidium,
      text, text_chars, interruptions,
      start_line, end_line, parse_warnings,
      extractor_version, extracted_at
    ) VALUES (
      @speech_id, @wp, @sitzung_nr, @datum, @pdf_filename, @lok_url,
      @order_in_session, @body_marker_order,
      @speaker_raw, @speaker_name, @speaker_party, @speaker_role, @speaker_ressort, @politician_id,
      @top_marker, @top_titel, @drucksache_nrn,
      @speech_type, @is_praesidium,
      @text, @text_chars, @interruptions,
      @start_line, @end_line, @parse_warnings,
      @extractor_version, @extracted_at
    )
  `);

  const report: any[] = [];
  let totalInserted = 0;
  let totalReal = 0;
  let totalPraes = 0;
  let totalMatched = 0;

  for (const pdf of allPdfs) {
    const rawLines = pdf.full_text.split(/\r?\n/);
    const lines = joinMultiLineMarkers(rawLines);
    const datum = extractDatum(rawLines);
    const wpSitz = extractSitzungWp(pdf.pdf_filename);
    if (!wpSitz) {
      console.log(`  ⚠ ${pdf.pdf_filename}: kann WP/Sitzung nicht aus Dateinamen extrahieren — skip`);
      continue;
    }
    const { wp, sitzung } = wpSitz;

    if (!FORCE_RESEED && seededSessions.has(sitzung)) {
      continue; // Sitzung bereits geseedet (Reden evtl. analysiert → FK) — überspringen
    }

    // Cutoff: erster Body-Marker
    let firstBody = -1;
    for (let i = 0; i < lines.length; i++) {
      if (bodyMdlRe.test(lines[i]) || bodyRolleRe.test(lines[i])) {
        firstBody = i;
        break;
      }
    }
    if (firstBody < 0) {
      console.log(`  ⚠ ${pdf.pdf_filename}: kein Body-Marker — skip`);
      continue;
    }

    const tocEntries = parseToc(lines, firstBody);
    const bodyMarkers = parseBody(lines, firstBody);
    const tops = parseTopsFromToc(lines, firstBody);
    attachDrucksachenFromToc(tops, lines, firstBody);
    const lineToPage = buildLineToPageMap(lines);

    // TOC-Set für Cross-Validation
    const tocSet = new Set(tocEntries.map((e) => normalize(e.name).split(" ").slice(-1)[0]));

    const extractedAt = new Date().toISOString();
    let inserted = 0;
    let real = 0;
    let praes = 0;
    let matched = 0;

    const tx = db.transaction(() => {
      for (let k = 0; k < bodyMarkers.length; k++) {
        const mk = bodyMarkers[k];
        const nextLine = k + 1 < bodyMarkers.length ? bodyMarkers[k + 1].line : lines.length;
        const rawText = lines.slice(mk.line + 1, nextLine).join("\n");
        const { text, interruptions } = extractInterruptions(rawText);
        const isPraes = isPraesidiumRole(mk.role);
        const currentPage = lineToPage[mk.line];
        const top = topAtPage(tops, currentPage);
        const speechType = deriveSpeechType(top?.titel ?? null, mk.role, isPraes);

        // Speaker-Name aufsplitten + matchen (Two-Stage: Berlin-MdL primär, alle als Fallback)
        const { first, last } = splitBodyName(mk.name);
        let pid: number | null = null;
        if (first && last) {
          pid = matchTwoStage(first, last);
          if (pid === null) pid = matchTwoStage(last, first); // PARDOK-style vertauscht
        }

        const parseWarnings: string[] = [];
        if (!isPraes && !tocSet.has(normalize(mk.name).split(" ").slice(-1)[0])) {
          parseWarnings.push("NO_TOC_MATCH");
        }
        if (mk.party === null && !mk.role && !isPraes) parseWarnings.push("NO_ROLE");

        const orderInSession = isPraes ? 0 : ++real; // 0 für Präsidium, sonst inkrementell
        if (isPraes) praes++;
        if (pid) matched++;
        const bodyMarkerOrder = k + 1;
        const speechId = `${wp}-${sitzung.toString().padStart(3, "0")}-r${bodyMarkerOrder.toString().padStart(3, "0")}`;

        insertStmt.run({
          speech_id: speechId,
          wp,
          sitzung_nr: sitzung,
          datum,
          pdf_filename: pdf.pdf_filename,
          lok_url: pdf.lok_url,
          order_in_session: orderInSession,
          body_marker_order: bodyMarkerOrder,
          speaker_raw: mk.raw,
          speaker_name: mk.name,
          speaker_party: mk.party,
          speaker_role: mk.role,
          speaker_ressort: mk.ressort,
          politician_id: pid,
          top_marker: top?.marker ?? null,
          top_titel: top?.titel ?? null,
          drucksache_nrn: top && top.drucksachen.length > 0 ? JSON.stringify(top.drucksachen) : null,
          speech_type: speechType,
          is_praesidium: isPraes ? 1 : 0,
          text,
          text_chars: text.length,
          interruptions: interruptions.length > 0 ? JSON.stringify(interruptions) : null,
          start_line: mk.line,
          end_line: nextLine - 1,
          parse_warnings: parseWarnings.length > 0 ? JSON.stringify(parseWarnings) : null,
          extractor_version: EXTRACTOR_VERSION,
          extracted_at: extractedAt,
        });
        inserted++;
      }
    });
    tx();

    totalInserted += inserted;
    totalReal += real;
    totalPraes += praes;
    totalMatched += matched;
    report.push({
      pdf: pdf.pdf_filename,
      sitzung,
      datum,
      pages: pdf.pages,
      inserted,
      real,
      praesidium: praes,
      matched_pid: matched,
      tops_found: tops.length,
    });
    console.log(
      `  ${pdf.pdf_filename.padEnd(28)} ${datum ?? "?".padEnd(10)}  Reden=${real.toString().padStart(3)}  Praes=${praes.toString().padStart(3)}  TOPs=${tops.length.toString().padStart(3)}  PID-Match=${matched.toString().padStart(3)}/${inserted}`
    );
  }

  // ── Bilanz ──
  console.log(`\n=== Bilanz ===`);
  console.log(`  Plenarprotokolle verarbeitet: ${allPdfs.length}`);
  console.log(`  Σ Einträge in berlin_speeches: ${totalInserted.toLocaleString("de-DE")}`);
  console.log(`  Σ Echte Reden (ohne Präsidium): ${totalReal.toLocaleString("de-DE")}`);
  console.log(`  Σ Präsidiums-Marker: ${totalPraes.toLocaleString("de-DE")}`);
  console.log(`  Σ Mit politician_id gematcht: ${totalMatched.toLocaleString("de-DE")} (${((totalMatched / totalInserted) * 100).toFixed(1)}%)`);

  // Coverage pro Rolle
  console.log(`\n── Coverage pro Sprecher-Rolle ──`);
  const roleStats = db
    .prepare(
      `SELECT
         CASE
           WHEN is_praesidium = 1 THEN 'PRÄSIDIUM'
           WHEN speaker_role IS NULL THEN 'MdL'
           ELSE speaker_role
         END AS rolle,
         COUNT(*) c,
         SUM(CASE WHEN politician_id IS NOT NULL THEN 1 ELSE 0 END) matched
       FROM berlin_speeches
       GROUP BY rolle
       ORDER BY 2 DESC`
    )
    .all() as { rolle: string; c: number; matched: number }[];
  for (const r of roleStats) {
    const pct = ((r.matched / r.c) * 100).toFixed(0);
    console.log(`  ${r.rolle.padEnd(35)} ${r.c.toString().padStart(5)} Einträge   PID-Match=${r.matched}/${r.c} (${pct}%)`);
  }

  // Sanity-Check: wie viele MdL haben mindestens 1 echte Rede?
  const mdlWithSpeech = db
    .prepare(
      `SELECT COUNT(DISTINCT politician_id) c
         FROM berlin_speeches
        WHERE is_praesidium = 0 AND politician_id IS NOT NULL`
    )
    .get() as { c: number };
  console.log(`\n  ${mdlWithSpeech.c} eindeutige Politiker:innen mit ≥1 echter Rede`);
  console.log(`  (Berlin-MdL gesamt: ${localsBerlin.length}; Senat/Präsidium ohne MdL-Mandat fallen ggf. raus)`);

  // Speech-Type-Verteilung
  console.log(`\n── Verteilung speech_type ──`);
  const typeStats = db
    .prepare(`SELECT COALESCE(speech_type, 'NULL') AS typ, COUNT(*) c FROM berlin_speeches GROUP BY speech_type ORDER BY 2 DESC`)
    .all() as { typ: string; c: number }[];
  for (const t of typeStats) {
    console.log(`  ${t.typ.padEnd(25)} ${t.c.toString().padStart(5)}`);
  }

  // Parse-Warnings
  const warnings = db
    .prepare(`SELECT COUNT(*) c FROM berlin_speeches WHERE parse_warnings IS NOT NULL`)
    .get() as { c: number };
  console.log(`\n  ${warnings.c} Einträge mit parse_warnings (${((warnings.c / totalInserted) * 100).toFixed(1)}%)`);

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${REPORT_PATH}`);

  db.close();
}

main();
