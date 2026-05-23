/**
 * Spike: Reden-Extraktion aus einem Berlin-Plenarprotokoll-PDF-Volltext.
 *
 * Drei Quellen, die wir gegeneinander prüfen:
 *   1. TOC im PDF-Anfang  →  Sprecher + Seite (Ground Truth Reihenfolge/Anzahl)
 *   2. Body-Volltext      →  Sprecher-Marker-Zeilen + Text dazwischen
 *   3. PARDOK             →  Redner-Set pro Sitzung (berlin_document_persons)
 *
 * Usage:  npx tsx scripts/extract-berlin-speeches-spike.ts <pdf_filename>
 * z.B.:   npx tsx scripts/extract-berlin-speeches-spike.ts PlenarPr_p19-007-wp.pdf
 */

import Database from "better-sqlite3";
import path from "path";

const PDF_FILENAME = process.argv[2] || "PlenarPr_p19-007-wp.pdf";
const DB_PATH = path.join(__dirname, "..", "politik.db");

const db = new Database(DB_PATH, { readonly: true });

// ── Lade Volltext + Meta ──
const row = db
  .prepare(
    `SELECT pdf_filename, pages, chars, full_text, lok_url
       FROM berlin_pdf_texts
      WHERE pdf_filename = ?`
  )
  .get(PDF_FILENAME) as
  | {
      pdf_filename: string;
      pages: number;
      chars: number;
      full_text: string;
      lok_url: string;
    }
  | undefined;

if (!row) {
  console.error(`PDF nicht in berlin_pdf_texts: ${PDF_FILENAME}`);
  process.exit(1);
}

console.log(`\n=== ${row.pdf_filename} — ${row.pages} S., ${row.chars.toLocaleString("de-DE")} Zeichen ===\n`);

// ── Sprecher-Vokabular ──
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
  "Vizepräsident",
  "Vizepräsidentin",
  "Präsident",
  "Präsidentin",
];
const ROLLE_RE = `(?:${ROLLEN.join("|")})`;

const rawLines = row.full_text.split(/\r?\n/);

// Multi-Line-Joiner: Sprecher-Marker können über 2 Zeilen gehen, z.B.
//   Senator Stephan Schwarz (Senatsverwaltung für
//   Wirtschaft, Energie und Betriebe):
// Wir joinen nur Zeilen, die mit Rolle-Prefix beginnen UND mit offener "(" ohne ")" enden.
const rolleStartRe = new RegExp(`^(?:${ROLLEN.join("|")})\\s+[A-ZÄÖÜ]`);
const lines: string[] = [];
{
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
}

// TOC-Zeile mit (Fraktion):  "Melanie Kühnemann-Grunow (SPD) .......... 360"
const tocMdlRe = new RegExp(
  `^(?<name>[A-ZÄÖÜ][^()]{1,80}?)\\s*\\((?<party>${FRAKTION_RE})\\)\\s*\\.{2,}\\s*(?<page>\\d{1,4})\\s*$`
);
// TOC-Zeile mit Rolle:  "Bürgermeisterin Bettina Jarasch .................. 366"
const tocRolleRe = new RegExp(
  `^(?<role>${ROLLE_RE})\\s+(?<name>[A-ZÄÖÜ][^()]{1,80}?)\\s*\\.{2,}\\s*(?<page>\\d{1,4})\\s*$`
);

type TocEntry = {
  order: number;
  speaker_raw: string;
  name: string;
  party: string | null;
  role: string | null;
  page: number;
  line: number;
};
const tocEntries: TocEntry[] = [];

// TOC liegt am Anfang — wir scannen bis ca. Seite 6 (großzügig). PlPr-TOC ist normalerweise 3-5 Seiten.
// Body-Sprecher-Marker enden mit ":", TOC-Zeilen mit Seitenzahl — disjunkt.
// Wir nehmen ALLE Matches im ganzen Dokument: Body matcht TOC-Regex nicht (kein ":").
// Sicherheits-Cutoff: nur Zeilen vor dem ersten Body-Sprecher-Marker als TOC werten.

// Body-Sprecher-Marker-Regex (für Cutoff + Body-Parsing):
// Zeile MIT Doppelpunkt-Ende, KEIN "[" in Zeile (sonst Zwischenruf).
const bodyMdlRe = new RegExp(
  `^(?<name>[A-ZÄÖÜ][^()\\[\\]]{1,80}?)\\s*\\((?<party>${FRAKTION_RE})\\)\\s*:\\s*$`
);
// Body-Rolle-Regex: optional folgt ein Senatsverwaltungs-Suffix in Klammern, dann ":"
// z.B. "Bürgermeisterin Bettina Jarasch (Senatsverwaltung für Umwelt, ...):"
const bodyRolleRe = new RegExp(
  `^(?<role>${ROLLE_RE})\\s+(?<name>[A-ZÄÖÜ][^:\\[\\]()]{1,60}?)\\s*(?:\\([^)]{1,120}\\))?\\s*:\\s*$`
);

let firstBodyMarkerLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (bodyMdlRe.test(lines[i]) || bodyRolleRe.test(lines[i])) {
    firstBodyMarkerLine = i;
    break;
  }
}
console.log(`Erster Body-Sprecher-Marker: Zeile ${firstBodyMarkerLine}`);
const tocEndLine = firstBodyMarkerLine > 0 ? firstBodyMarkerLine : lines.length;

for (let i = 0; i < tocEndLine; i++) {
  const line = lines[i];
  let m = line.match(tocMdlRe);
  if (m && m.groups) {
    tocEntries.push({
      order: tocEntries.length + 1,
      speaker_raw: `${m.groups.name.trim()} (${m.groups.party})`,
      name: m.groups.name.trim(),
      party: m.groups.party,
      role: null,
      page: parseInt(m.groups.page, 10),
      line: i,
    });
    continue;
  }
  m = line.match(tocRolleRe);
  if (m && m.groups) {
    tocEntries.push({
      order: tocEntries.length + 1,
      speaker_raw: `${m.groups.role} ${m.groups.name.trim()}`,
      name: m.groups.name.trim(),
      party: null,
      role: m.groups.role,
      page: parseInt(m.groups.page, 10),
      line: i,
    });
  }
}

console.log(`\n── TOC ──`);
console.log(`  ${tocEntries.length} Sprecher-Zeilen gefunden`);
console.log(`  Erste 5:`);
for (const e of tocEntries.slice(0, 5)) {
  console.log(`    ${e.order.toString().padStart(3)}. S.${e.page}  ${e.speaker_raw}`);
}
console.log(`  Letzte 3:`);
for (const e of tocEntries.slice(-3)) {
  console.log(`    ${e.order.toString().padStart(3)}. S.${e.page}  ${e.speaker_raw}`);
}

// ── Body-Parser ──
// Alle Sprecher-Marker im Body finden, Text zwischen ihnen extrahieren.

type BodySpeech = {
  order: number;
  speaker_raw: string;
  name: string;
  party: string | null;
  role: string | null;
  start_line: number;
  end_line: number;
  text_chars: number;
  text_preview: string;
};
const bodySpeeches: BodySpeech[] = [];

const markers: { line: number; name: string; party: string | null; role: string | null; raw: string }[] = [];
for (let i = tocEndLine; i < lines.length; i++) {
  const line = lines[i];
  let m = line.match(bodyMdlRe);
  if (m && m.groups) {
    markers.push({
      line: i,
      name: m.groups.name.trim(),
      party: m.groups.party,
      role: null,
      raw: `${m.groups.name.trim()} (${m.groups.party})`,
    });
    continue;
  }
  m = line.match(bodyRolleRe);
  if (m && m.groups) {
    markers.push({
      line: i,
      name: m.groups.name.trim(),
      party: null,
      role: m.groups.role,
      raw: `${m.groups.role} ${m.groups.name.trim()}`,
    });
  }
}

for (let k = 0; k < markers.length; k++) {
  const mk = markers[k];
  const nextLine = k + 1 < markers.length ? markers[k + 1].line : lines.length;
  const textLines = lines.slice(mk.line + 1, nextLine);
  const text = textLines.join("\n").trim();
  bodySpeeches.push({
    order: k + 1,
    speaker_raw: mk.raw,
    name: mk.name,
    party: mk.party,
    role: mk.role,
    start_line: mk.line,
    end_line: nextLine - 1,
    text_chars: text.length,
    text_preview: text.slice(0, 120).replace(/\s+/g, " "),
  });
}

console.log(`\n── Body ──`);
console.log(`  ${bodySpeeches.length} Sprecher-Marker im Body`);
console.log(`  Erste 5:`);
for (const s of bodySpeeches.slice(0, 5)) {
  console.log(`    ${s.order.toString().padStart(3)}. ${s.speaker_raw}  [${s.text_chars} Z]  ${s.text_preview.slice(0, 60)}...`);
}
console.log(`  Letzte 3:`);
for (const s of bodySpeeches.slice(-3)) {
  console.log(`    ${s.order.toString().padStart(3)}. ${s.speaker_raw}  [${s.text_chars} Z]  ${s.text_preview.slice(0, 60)}...`);
}

// ── PARDOK-Cross-Check ──
const pardokRedner = db
  .prepare(
    `SELECT DISTINCT p.raw_name, p.party, p.politician_id
       FROM berlin_documents d
       JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
       JOIN berlin_document_persons p ON p.dbid = d.dbid
      WHERE t.pdf_filename = ?
        AND p.role = 'redner'`
  )
  .all(PDF_FILENAME) as { raw_name: string; party: string; politician_id: number | null }[];

console.log(`\n── PARDOK ──`);
console.log(`  ${pardokRedner.length} eindeutige Redner-Einträge (über alle TOPs der Sitzung)`);

// Normalisierung für Set-Vergleich: "Nachname, Vorname (Fraktion)" → "vorname nachname"
function normalizeName(s: string): string {
  // PARDOK-Format: "Kühnemann-Grunow, Melanie (SPD)"  →  "melanie kühnemann-grunow"
  // Body-Format:   "Melanie Kühnemann-Grunow"          →  "melanie kühnemann-grunow"
  // TOC-Format:    "Dr. Susanna Kahlefeld"             →  "susanna kahlefeld" (Titel raus)
  let name = s.toLowerCase().trim();
  // Klammer-Suffix raus (Fraktion oder Senator-Rolle)
  name = name.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  // PARDOK Komma-Format: "nachname, vorname" → "vorname nachname"
  const comma = name.match(/^(.+?),\s*(.+)$/);
  if (comma) name = `${comma[2]} ${comma[1]}`;
  // Titel raus (mit Punkt) — vorher als ganze Tokens entfernen
  name = name
    .split(/\s+/)
    .filter((tok) => !/^(dr|prof|drs|prof\.|dr\.)\.?$/i.test(tok))
    .join(" ");
  return name.replace(/\s+/g, " ").trim();
}

// Präsident/Vizepräsident-Marker im Body filtern (sind im TOC nicht gelistet)
const isPraesidium = (role: string | null): boolean =>
  !!role && /^(Vizepräsident|Vizepräsidentin|Präsident|Präsidentin)$/.test(role);

// Body OHNE Präsidium = nur "echte" Reden (analog TOC)
const bodyReal = bodySpeeches.filter((s) => !isPraesidium(s.role));

const tocNorm = new Set(tocEntries.map((e) => normalizeName(e.name)));
const bodyNorm = new Set(bodyReal.map((s) => normalizeName(s.name)));
const pardokNorm = new Set(pardokRedner.map((p) => normalizeName(p.raw_name)));

// ── Cross-Check ──
console.log(`\n── 3-Quellen-Cross-Check (Set-Membership ohne Präsidium) ──`);
console.log(`  Eindeutige Sprecher:  TOC=${tocNorm.size}  Body=${bodyNorm.size}  PARDOK=${pardokNorm.size}`);
console.log(`  Body insg.: ${bodySpeeches.length}  davon Präsidium: ${bodySpeeches.length - bodyReal.length}  echte Reden: ${bodyReal.length}`);

const tocOnly = [...tocNorm].filter((n) => !bodyNorm.has(n));
const bodyOnly = [...bodyNorm].filter((n) => !tocNorm.has(n));
const pardokOnly = [...pardokNorm].filter((n) => !bodyNorm.has(n) && !tocNorm.has(n));

console.log(`\n  Nur in TOC (nicht im Body):     ${tocOnly.length}${tocOnly.length ? "  " + tocOnly.slice(0, 5).join("; ") : ""}`);
console.log(`  Nur im Body (nicht in TOC):     ${bodyOnly.length}${bodyOnly.length ? "  " + bodyOnly.slice(0, 5).join("; ") : ""}`);
console.log(`  Nur in PARDOK (nicht TOC+Body): ${pardokOnly.length}${pardokOnly.length ? "  " + pardokOnly.slice(0, 5).join("; ") : ""}`);

// ── Reihenfolge-Check: erste 15 TOC vs erste 15 Body-real ──
console.log(`\n── Reihenfolge-Check (erste 15 echte Reden, Body ohne Präsidium) ──`);
const N = Math.min(15, tocEntries.length, bodyReal.length);
let ordMatch = 0;
for (let i = 0; i < N; i++) {
  const t = tocEntries[i];
  const b = bodyReal[i];
  const tn = normalizeName(t.name);
  const bn = normalizeName(b.name);
  const ok = tn === bn;
  if (ok) ordMatch++;
  console.log(
    `    ${(i + 1).toString().padStart(2)}. TOC: ${t.speaker_raw.padEnd(45)} ${ok ? "✓" : "✗"}  Body: ${b.speaker_raw}`
  );
}
console.log(`\n  Order-Match: ${ordMatch}/${N}  (${((ordMatch / N) * 100).toFixed(1)}%)`);

// ── Summary ──
const tocBodyMembershipMatch = [...tocNorm].filter((n) => bodyNorm.has(n)).length;
const accuracy = ((tocBodyMembershipMatch / tocNorm.size) * 100).toFixed(1);

console.log(`\n=== Bilanz ===`);
console.log(`  TOC-Sprecher die auch im Body sind: ${tocBodyMembershipMatch}/${tocNorm.size} (${accuracy}%)`);
console.log(`  Reden-Counts:  TOC=${tocEntries.length}  Body-real=${bodyReal.length}  Body-Präs=${bodySpeeches.length - bodyReal.length}  PARDOK=${pardokRedner.length}`);
console.log(`  Reden-Count-Diff TOC vs Body-real: ${bodyReal.length - tocEntries.length}`);

// ── Volltext-Stichprobe: 3 Reden komplett ausgeben ──
const sampleIndices = [
  0,
  Math.floor(bodyReal.length / 2),
  bodyReal.length - 1,
];
console.log(`\n── Stichprobe (Reden 1 / Mitte / Ende) ──`);
for (const idx of sampleIndices) {
  const s = bodyReal[idx];
  // Hole die Original-Body-Index für Text-Lookup
  const bodyIdx = bodySpeeches.findIndex(
    (x) => x.start_line === s.start_line && x.name === s.name
  );
  const fullText = lines.slice(s.start_line + 1, s.end_line + 1).join("\n").trim();
  console.log(`\n  ─── #${idx + 1} (Body-Order ${bodyIdx + 1})  ${s.speaker_raw}  [${s.text_chars} Zeichen, Zeilen ${s.start_line}-${s.end_line}] ───`);
  const preview = fullText.length > 600
    ? fullText.slice(0, 300) + "\n      …\n      " + fullText.slice(-300)
    : fullText;
  for (const ln of preview.split("\n")) console.log(`      ${ln}`);
}

// ── Drift-Diagnose: die 14 extra Body-Marker auflisten ──
const tocNameOrdered = tocEntries.map((e) => normalizeName(e.name));
const bodyNameOrdered = bodyReal.map((s) => normalizeName(s.name));
// Greedy diff: find body markers nicht in TOC-Reihenfolge platzierbar
console.log(`\n── Extra Body-Marker (nicht durch TOC erklärt) ──`);
let tocPtr = 0;
let extraCount = 0;
for (let k = 0; k < bodyReal.length; k++) {
  const bn = bodyNameOrdered[k];
  if (tocPtr < tocNameOrdered.length && tocNameOrdered[tocPtr] === bn) {
    tocPtr++;
  } else {
    extraCount++;
    if (extraCount <= 10) {
      console.log(`    #${k + 1}  ${bodyReal[k].speaker_raw}  [${bodyReal[k].text_chars}Z]  ${bodyReal[k].text_preview.slice(0, 80)}`);
    }
  }
}
console.log(`  ${extraCount} Body-Marker ohne TOC-Match (von ${bodyReal.length} Body-real)`);

db.close();
