/**
 * Stresstest: Berlin-Reden-Extraktor auf alle 124 Plenarprotokolle.
 *
 * Wiederverwendet die Parser-Logik aus extract-berlin-speeches-spike.ts,
 * ohne sie zu duplizieren — wir kompilieren die Kernfunktionen hier inline.
 *
 * Output: pro Sitzung eine Stat-Zeile + am Ende ein Bilanz-Block + JSON-Report.
 *
 * Usage:  npx tsx scripts/extract-berlin-speeches-stresstest.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(__dirname, "..", "politik.db");
const REPORT_PATH = path.join(__dirname, "extract-berlin-speeches-stresstest.report.json");

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
const rolleStartRe = new RegExp(`^(?:${ROLLEN.join("|")})\\s+[A-ZÄÖÜ]`);

const tocMdlRe = new RegExp(
  `^(?<name>[A-ZÄÖÜ][^()]{1,80}?)\\s*\\((?<party>${FRAKTION_RE})\\)\\s*\\.{2,}\\s*(?<page>\\d{1,4})\\s*$`
);
const tocRolleRe = new RegExp(
  `^(?<role>${ROLLE_RE})\\s+(?<name>[A-ZÄÖÜ][^()]{1,80}?)\\s*\\.{2,}\\s*(?<page>\\d{1,4})\\s*$`
);
const bodyMdlRe = new RegExp(
  `^(?<name>[A-ZÄÖÜ][^()\\[\\]]{1,80}?)\\s*\\((?<party>${FRAKTION_RE})\\)\\s*:\\s*$`
);
const bodyRolleRe = new RegExp(
  `^(?<role>${ROLLE_RE})\\s+(?<name>[A-ZÄÖÜ][^:\\[\\]()]{1,60}?)\\s*(?:\\([^)]{1,120}\\))?\\s*:\\s*$`
);

function normalizeName(s: string): string {
  let name = s.toLowerCase().trim();
  name = name.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const comma = name.match(/^(.+?),\s*(.+)$/);
  if (comma) name = `${comma[2]} ${comma[1]}`;
  name = name
    .split(/\s+/)
    .filter((tok) => !/^(dr|prof|drs|prof\.|dr\.)\.?$/i.test(tok))
    .join(" ");
  return name.replace(/\s+/g, " ").trim();
}

const isPraesidium = (role: string | null): boolean =>
  !!role && /^(Vizepräsident|Vizepräsidentin|Präsident|Präsidentin)$/.test(role);

type Marker = { line: number; name: string; party: string | null; role: string | null; raw: string };

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

function parseToc(lines: string[], cutoff: number) {
  const entries: { name: string; party: string | null; role: string | null; page: number }[] = [];
  for (let i = 0; i < cutoff; i++) {
    const line = lines[i];
    let m = line.match(tocMdlRe);
    if (m && m.groups) {
      entries.push({ name: m.groups.name.trim(), party: m.groups.party, role: null, page: parseInt(m.groups.page, 10) });
      continue;
    }
    m = line.match(tocRolleRe);
    if (m && m.groups) {
      entries.push({ name: m.groups.name.trim(), party: null, role: m.groups.role, page: parseInt(m.groups.page, 10) });
    }
  }
  return entries;
}

function parseBody(lines: string[], startLine: number): Marker[] {
  const markers: Marker[] = [];
  for (let i = startLine; i < lines.length; i++) {
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
  return markers;
}

// ── Main ──
const db = new Database(DB_PATH, { readonly: true });
const allPdfs = db
  .prepare(
    `SELECT pdf_filename, pages, chars, full_text, lok_url
       FROM berlin_pdf_texts
      WHERE dok_art = 'Plenarprotokoll'
        AND full_text IS NOT NULL AND full_text != ''
      ORDER BY pdf_filename`
  )
  .all() as { pdf_filename: string; pages: number; chars: number; full_text: string; lok_url: string }[];

console.log(`\n=== Stresstest auf ${allPdfs.length} Plenarprotokolle ===\n`);

const pardokStmt = db.prepare(
  `SELECT DISTINCT p.raw_name
     FROM berlin_documents d
     JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
     JOIN berlin_document_persons p ON p.dbid = d.dbid
    WHERE t.pdf_filename = ?
      AND p.role = 'redner'`
);

type Stat = {
  pdf: string;
  pages: number;
  toc_count: number;
  body_total: number;
  body_real: number;
  body_praes: number;
  pardok_count: number;
  toc_in_body_pct: number;
  order_match_n: number;
  order_match_pct: number;
  extra_body_markers: number;
  toc_only_names: string[];
  warnings: string[];
};

const stats: Stat[] = [];

for (const pdf of allPdfs) {
  const lines = joinMultiLineMarkers(pdf.full_text.split(/\r?\n/));

  // Erster Body-Marker als TOC-Cutoff
  let firstBody = -1;
  for (let i = 0; i < lines.length; i++) {
    if (bodyMdlRe.test(lines[i]) || bodyRolleRe.test(lines[i])) {
      firstBody = i;
      break;
    }
  }

  const warnings: string[] = [];
  if (firstBody < 0) warnings.push("KEIN_BODY_MARKER");

  const tocEntries = parseToc(lines, firstBody > 0 ? firstBody : lines.length);
  const bodyMarkers = firstBody >= 0 ? parseBody(lines, firstBody) : [];
  const bodyReal = bodyMarkers.filter((m) => !isPraesidium(m.role));
  const bodyPraes = bodyMarkers.length - bodyReal.length;

  const pardokRows = pardokStmt.all(pdf.pdf_filename) as { raw_name: string }[];
  const pardokCount = pardokRows.length;

  const tocSet = new Set(tocEntries.map((e) => normalizeName(e.name)));
  const bodySet = new Set(bodyReal.map((m) => normalizeName(m.name)));

  const tocInBody = [...tocSet].filter((n) => bodySet.has(n)).length;
  const tocInBodyPct = tocSet.size > 0 ? (tocInBody / tocSet.size) * 100 : 0;
  const tocOnly = [...tocSet].filter((n) => !bodySet.has(n));

  // Order-Match: greedy pointer wie im Spike
  const tocOrder = tocEntries.map((e) => normalizeName(e.name));
  const bodyOrder = bodyReal.map((m) => normalizeName(m.name));
  let tocPtr = 0;
  let extraBody = 0;
  for (let k = 0; k < bodyOrder.length; k++) {
    if (tocPtr < tocOrder.length && tocOrder[tocPtr] === bodyOrder[k]) {
      tocPtr++;
    } else {
      extraBody++;
    }
  }
  // tocPtr ist jetzt die Anzahl TOC-Einträge die in der Body-Reihenfolge gefunden wurden
  const orderMatchN = tocPtr;
  const orderMatchPct = tocEntries.length > 0 ? (tocPtr / tocEntries.length) * 100 : 0;

  if (tocEntries.length === 0) warnings.push("KEIN_TOC");
  if (tocInBodyPct < 90 && tocSet.size > 0) warnings.push(`TOC_IN_BODY=${tocInBodyPct.toFixed(0)}%`);
  if (orderMatchPct < 90 && tocEntries.length > 0) warnings.push(`ORDER=${orderMatchPct.toFixed(0)}%`);

  const stat: Stat = {
    pdf: pdf.pdf_filename,
    pages: pdf.pages,
    toc_count: tocEntries.length,
    body_total: bodyMarkers.length,
    body_real: bodyReal.length,
    body_praes: bodyPraes,
    pardok_count: pardokCount,
    toc_in_body_pct: +tocInBodyPct.toFixed(1),
    order_match_n: orderMatchN,
    order_match_pct: +orderMatchPct.toFixed(1),
    extra_body_markers: extraBody,
    toc_only_names: tocOnly,
    warnings,
  };
  stats.push(stat);

  const flag = warnings.length > 0 ? "⚠" : " ";
  console.log(
    `${flag} ${pdf.pdf_filename.padEnd(28)} S${pdf.pages.toString().padStart(3)}  TOC=${tocEntries.length.toString().padStart(3)}  Body-real=${bodyReal.length.toString().padStart(3)}  Praes=${bodyPraes.toString().padStart(3)}  PARDOK=${pardokCount.toString().padStart(3)}  Set-Match=${tocInBodyPct.toFixed(0).padStart(3)}%  Order=${orderMatchPct.toFixed(0).padStart(3)}%  ${warnings.join(",")}`
  );
}

// ── Bilanz ──
const ok = stats.filter((s) => s.warnings.length === 0);
const warned = stats.filter((s) => s.warnings.length > 0);

const sumTOC = stats.reduce((a, s) => a + s.toc_count, 0);
const sumBodyReal = stats.reduce((a, s) => a + s.body_real, 0);
const sumBodyPraes = stats.reduce((a, s) => a + s.body_praes, 0);
const sumPardok = stats.reduce((a, s) => a + s.pardok_count, 0);

const avgSetMatch = stats.filter((s) => s.toc_count > 0).reduce((a, s) => a + s.toc_in_body_pct, 0) / Math.max(1, stats.filter((s) => s.toc_count > 0).length);
const avgOrderMatch = stats.filter((s) => s.toc_count > 0).reduce((a, s) => a + s.order_match_pct, 0) / Math.max(1, stats.filter((s) => s.toc_count > 0).length);

console.log(`\n=== Bilanz ===`);
console.log(`  Sitzungen gesamt: ${stats.length}`);
console.log(`  Sauber (keine Warnings): ${ok.length}`);
console.log(`  Mit Warnings: ${warned.length}`);
console.log(`  Σ TOC-Reden: ${sumTOC.toLocaleString("de-DE")}`);
console.log(`  Σ Body-Real (Reden): ${sumBodyReal.toLocaleString("de-DE")}`);
console.log(`  Σ Body-Präsidium-Marker: ${sumBodyPraes.toLocaleString("de-DE")}`);
console.log(`  Σ PARDOK-Redner-Refs: ${sumPardok.toLocaleString("de-DE")}`);
console.log(`  Ø Set-Match TOC→Body: ${avgSetMatch.toFixed(1)}%`);
console.log(`  Ø Order-Match TOC→Body: ${avgOrderMatch.toFixed(1)}%`);

if (warned.length > 0) {
  console.log(`\n── Top 10 Warnings ──`);
  for (const w of warned.slice(0, 10)) {
    console.log(`  ${w.pdf}  ${w.warnings.join(", ")}`);
  }
}

fs.writeFileSync(REPORT_PATH, JSON.stringify(stats, null, 2));
console.log(`\nReport: ${REPORT_PATH}`);

db.close();
