/**
 * Fixt das TOP-Marker-Mapping für Berliner Sitzungen, indem TOP-Header direkt im
 * Body-Text gesucht werden (statt aus dem TOC abgeleitet).
 *
 * Hintergrund: parseTopsFromToc + topAtPage in seed-berlin-speeches.ts geht
 * davon aus, dass TOPs im PDF in TOC-Marker-Reihenfolge abgehandelt werden.
 * Berlin springt aber nicht-monoton (TOP 28A vor TOP 21, TOP 12+13 nach TOP 21, …).
 *
 * Korrigiert NUR top_marker + top_titel + drucksache_nrn,
 * berührt KEINE anderen Felder und KEINE LLM-Analysen.
 *
 * Run:
 *   npx tsx scripts/fix-berlin-top-markers.ts --sitzung 85          (dry-run)
 *   npx tsx scripts/fix-berlin-top-markers.ts --sitzung 85 --write
 *   npx tsx scripts/fix-berlin-top-markers.ts --all                 (alle, dry-run)
 *   npx tsx scripts/fix-berlin-top-markers.ts --all --write
 */
import Database from "better-sqlite3";
import path from "path";

const argv = process.argv.slice(2);
const SITZ_IDX = argv.indexOf("--sitzung");
const SITZUNG_ARG = SITZ_IDX >= 0 ? parseInt(argv[SITZ_IDX + 1], 10) : null;
const ALL = argv.includes("--all");
const WRITE = argv.includes("--write");
if (!SITZUNG_ARG && !ALL) {
  console.error("Usage: --sitzung <nr> oder --all (mit optional --write)");
  process.exit(1);
}

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

// Vokabular aus seed-berlin-speeches.ts
const ROLLEN = [
  "Regierender Bürgermeister", "Regierende Bürgermeisterin",
  "Bürgermeister", "Bürgermeisterin",
  "Senator", "Senatorin", "Staatssekretär", "Staatssekretärin",
  "Alterspräsidentin", "Alterspräsident",
  "Vizepräsidentin", "Vizepräsident",
  "Präsidentin", "Präsident",
];
const rolleStartRe = new RegExp(`^(?:${ROLLEN.join("|")})\\s+[A-ZÄÖÜ]`);

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

// ── Body-TOP-Header-Erkennung ──
// Berliner PDFs nutzen "lfd. Nr. N:" als kanonischen TOP-Aufruf (sequentiell in
// Sitzungs-Reihenfolge). Optional folgt "Tagesordnungspunkt M" als echte
// Marker-Referenz (kann von der lfd. Nr. abweichen, weil Prioritäten unter
// lfd. Nr. 3.X die TOPs 21/26/27/77/79 in der Tagesordnung sind).
const lfdNrRe = /^lfd\.\s+Nr\.\s+([\d]+(?:\.[\d]+)?(?:\s*[A-Z])?)\s*:\s*$/;
const tagesOrdnungsRe = /^Tagesordnungspunkt\s+(\d{1,3}(?:\s*[A-Z])?)\s*$/;
// "Tagesordnungspunkt 15 steht auf der Konsensliste." → Verweis, kein Aufruf
const inlineRefRe = /^Tagesordnungspunkt\s+\d/;

type BodyTopHeader = {
  line: number;
  lfdNr: string;
  marker: string;
  titel: string;
  drucksachen: string[];
  /** Wenn true, ist dies KEIN eigener TOP, sondern ein Sub-Aufruf der
   *  Haushaltsplan-Einzelplan-Debatte. Reden danach gehören zum vorigen
   *  Haushaltsplan-TOP (= TOP 1 typischerweise), nicht zu einem neuen TOP. */
  isHaushaltSubItem?: boolean;
};

/** Berliner Haushalts-Sitzungen: Einzelplan-Sub-Debatten werden mit
 *  „Ich rufe auf\n[a-z])\s*Einzelplan..." angekündigt, OHNE neuen lfd.Nr.
 *  Pattern-Varianten:
 *    "e) Einzelplan:"                       → Einzelplan-Nr in Folgezeile
 *    "b) Einzelplan 03 – Regierender ..."   → Nr direkt in derselben Zeile
 *    "b) Einzelplan 03 – RegBM – und"       → erstes von kombinierten Einzelplänen
 *  Diese werden als eigene Sub-TOPs (marker "<Haushalts-TOP>.<letter>") modelliert. */
const EINZELPLAN_RE = /^([a-z])\)\s*Einzelpl(?:an|äne)(?:\s*[:.]?\s*(.+))?$/i;
/** Trigger-Phrasen die ein Einzelplan-Sub-TOP einleiten können. */
const EINZELPLAN_TRIGGER_RE = /^(Ich rufe auf|Wir kommen(?:\s+dann)?(?:\s+jetzt)?(?:\s+zu(?:r)?)?)/;
/** Einzelplan-Nummer + Ressort-Name aus Body extrahieren (für Titel-Bauen). */
const EINZELPLAN_NRNAME_RE = /Einzelplan\s+(\d+)(?:\s*[–-]\s*(.+?))?(?:\s*[–-]\s*und.*)?$/i;

function parseBodyTopHeaders(lines: string[], firstBody: number): BodyTopHeader[] {
  const headers: BodyTopHeader[] = [];

  // Pass 1: Standard lfd.Nr.-Headers extrahieren (wie bisher)
  for (let i = firstBody; i < lines.length; i++) {
    const m = lines[i].trim().match(lfdNrRe);
    if (!m) continue;
    const lfdNr = m[1].replace(/\s+/g, "");

    // Suche optional "Tagesordnungspunkt M" in den nächsten 8 Zeilen
    let marker = lfdNr;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const tm = lines[j].trim().match(tagesOrdnungsRe);
      if (tm) {
        marker = tm[1].replace(/\s+/g, " ").trim();
        break;
      }
      // Stop wenn wir auf einen Sprecher-Marker oder andere Section stoßen
      if (/^[A-ZÄÖÜ][^()]{1,80}\([A-Z]+\)\s*:\s*$/.test(lines[j].trim())) break;
    }

    // Titel: erste 4 Zeilen nach lfd.Nr / Tagesordnungspunkt bis zum Stop-Pattern.
    // Stop-Pattern fängt Body-Text + Sub-TOP-Aufrufe + organisatorische Hinweise ab.
    const STOP_RE = /^(Antrag|Beschlussempfehlung|Drucksache|Vorlage|Konsensliste|Erste\s+Lesung|Zweite\s+Lesung|Dritte\s+Lesung|Ich\s+eröffne|Ich\s+rufe|In\s+der\s+Beratung|hierzu\s+Änderungsantrag|Wahlvorschlag|Wahlvorschläge|Gemeinsame\s+Beratung|Antragstext|der\s+Senatsverwaltung|Für\s+die\s+Besprechung|Nun\s+können|Hierzu\s+hat|Beginn:|Wir\s+kommen)/;
    let titel = "";
    let titelLines = 0;
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      const l = lines[j].trim();
      if (!l) continue;
      if (tagesOrdnungsRe.test(l) || lfdNrRe.test(l)) continue;
      if (STOP_RE.test(l)) break;
      if (titelLines < 4) {
        titel = titel ? `${titel} ${l}` : l;
        titelLines++;
      } else {
        break;
      }
    }
    // Drucksachen im 20-Zeilen-Fenster
    const drucksachen: string[] = [];
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
      const matches = lines[j].matchAll(/Drucksache\s+(\d{1,2}\/\d{4}(?:-\d+)?)/g);
      for (const dm of matches) drucksachen.push(dm[1]);
    }
    titel = titel.replace(/\s+-\s+/g, "-").replace(/\s+/g, " ").trim();
    // Sub-Item-Marker am Anfang strippen: "a) Ausstellung des ..." → "Ausstellung des ..."
    // Bei Multi-Item-TOPs werden a/b/c-Punkte einzeln aufgerufen; der Buchstabe
    // ist ein Verfahrens-Marker, nicht Teil des Titels.
    titel = titel.replace(/^[a-z]\)\s*/i, "");

    headers.push({ line: i, lfdNr, marker, titel, drucksachen: Array.from(new Set(drucksachen)) });
  }

  // Pass 2: Einzelplan-Sub-Aufrufe als eigene Sub-TOPs erzeugen.
  // Pattern: "Ich rufe auf" + "[a-z]) Einzelplan ...".
  // Marker-Schema: "<Haushalts-TOP>.<letter>" (z. B. "1.e" für TOP-1-Einzelplan-e).
  // Titel wird aus dem Einzelplan-Nr-und-Ressort-Namen gebaut.
  const haushaltsplanHeaderIdx = headers.findIndex(
    (h) => /Haushaltsplan|Haushaltsgesetz|Haushaltsbeschluss|Haushalts-?gesetz/i.test(h.titel),
  );
  const haushaltsTopMarker = haushaltsplanHeaderIdx >= 0 ? headers[haushaltsplanHeaderIdx].marker : "1";

  for (let i = firstBody; i < lines.length - 2; i++) {
    if (!EINZELPLAN_TRIGGER_RE.test(lines[i].trim())) continue;
    // Suche EINZELPLAN_RE in i+1 bis i+5 (oft sind Zwischen-Zeilen vor der Marker-Zeile)
    let markerLineIdx = -1;
    let letter = "";
    let inlineRest = "";
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const m = lines[j].trim().match(EINZELPLAN_RE);
      if (m) { markerLineIdx = j; letter = m[1].toLowerCase(); inlineRest = m[2]?.trim() ?? ""; break; }
    }
    if (markerLineIdx < 0) continue;

    // Einzelpläne in diesem Block sammeln. Block kann mehrere Einzelpläne enthalten
    // ("c) Einzelpläne: 15 Finanzen / 01 Abgeordnetenhaus / 02 Verfassungsgerichtshof").
    const plans: { nr: string; name: string }[] = [];
    // Wenn inline-Rest schon eine Nummer enthält („b) Einzelplan 03 – Regierender …")
    if (inlineRest) {
      const r = inlineRest.match(/^(\d+)\s*[–-]?\s*(.*?)(?:\s*[–-]\s*und.*)?$/);
      if (r) plans.push({ nr: r[1], name: r[2].trim() });
    }
    // Folgezeilen nach Marker-Line scannen — bis Sprecher-Zeile / Hier-beginnt / Leerzeile-Block
    for (let j = markerLineIdx + 1; j < Math.min(markerLineIdx + 12, lines.length); j++) {
      const l = lines[j].trim();
      if (!l) continue;
      // Stop wenn Sprecher-Marker, Senats-/Praesidial-Wechsel oder organisat. Hinweis
      if (/^[A-ZÄÖÜ][^()]{1,80}\(\w+\)\s*:\s*$/.test(l)) break;
      // KEIN \b nach "In der Rede" — sonst matcht "Rederunde" nicht (zusammenhängende Wortzeichen).
      if (/^(Hier beginnt|Vizepräsident|Präsidentin|Präsident|In der Rede|In der Beratung|Für die Beratung|Es beginnt|Bitte schön|Vielen Dank)/.test(l)) break;
      if (/^Senator(in)?\s+[A-ZÄÖÜ]/.test(l)) break;
      // Einzelplan-Eintrag: "05 Inneres und Sport" oder Multi-Wort-Fortsetzung der vorigen Einzelplan-Zeile
      const r = l.match(/^(\d+)\s+(.+?)(?:\s*[–-]\s*und.*)?$/);
      if (r) {
        plans.push({ nr: r[1], name: r[2].trim() });
      } else if (plans.length > 0 && plans[plans.length - 1].name.length < 80) {
        // Fortsetzungs-Zeile der letzten Einzelplan-Beschreibung
        plans[plans.length - 1].name += " " + l;
      } else {
        break;
      }
    }

    const titel = plans.length === 0
      ? `Einzelplan-Block (${letter})`
      : plans.length === 1
      ? `Einzelplan ${plans[0].nr.padStart(2, "0")} — ${plans[0].name}`
      : `Einzelplan-Block: ${plans.map((p) => `${p.nr.padStart(2, "0")} ${p.name}`).join(" + ")}`;
    headers.push({
      line: i,
      lfdNr: `${haushaltsTopMarker}.${letter}`,
      marker: `${haushaltsTopMarker}.${letter}`,
      titel: titel.length > 200 ? titel.substring(0, 200) + "…" : titel,
      drucksachen: [],
    });
  }

  // Chronologisch sortieren — Pass 1 + Pass 2 mischen, da sie aus verschiedenen
  // for-Loops kommen.
  headers.sort((a, b) => a.line - b.line);
  return headers;
}

void inlineRefRe; // reserved for future "wurde bereits behandelt"-Detection

function findFirstBodyLine(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (/^Beginn:\s*\d+\.\d+\s+Uhr/.test(lines[i].trim())) return i + 1;
    if (/^Präsident(in)?\s+[A-ZÄÖÜ]/.test(lines[i].trim()) && lines[i].includes(":")) return i;
  }
  return Math.floor(lines.length * 0.15); // Fallback
}

function processSitzung(sitzungNr: number, write: boolean, verbose = true): { updated: number; skipped: number; ok: boolean } {
  const pdf = db.prepare(
    `SELECT full_text, pdf_filename FROM berlin_pdf_texts WHERE pdf_filename LIKE ?`,
  ).get(`%p19-${sitzungNr.toString().padStart(3, "0")}-wp%`) as { full_text: string; pdf_filename: string } | undefined;

  if (!pdf || !pdf.full_text) {
    if (verbose) console.log(`Sitzung ${sitzungNr}: kein PDF/full_text in DB — skip`);
    return { updated: 0, skipped: 0, ok: false };
  }

  const rawLines = pdf.full_text.split(/\r?\n/);
  const lines = joinMultiLineMarkers(rawLines);
  const firstBody = findFirstBodyLine(lines);
  const headers = parseBodyTopHeaders(lines, firstBody);

  if (verbose) {
    console.log(`\n=== Sitzung ${sitzungNr} (${pdf.pdf_filename}) ===`);
    console.log(`${lines.length} lines, firstBody=${firstBody}, ${headers.length} TOP-Header`);
  }

  type Speech = { speech_id: string; start_line: number; current_marker: string | null; current_titel: string | null };
  const speeches = db.prepare(
    `SELECT speech_id, start_line, top_marker AS current_marker, top_titel AS current_titel
     FROM berlin_speeches WHERE sitzung_nr = ? ORDER BY start_line`,
  ).all(sitzungNr) as Speech[];

  function headerAtLine(line: number): BodyTopHeader | null {
    let last: BodyTopHeader | null = null;
    for (const h of headers) {
      if (h.line <= line) last = h;
      else break;
    }
    return last;
  }

  const updates: Array<{ speech_id: string; marker: string; titel: string; drucksachen: string[] }> = [];
  let unchanged = 0;
  let noHeader = 0;
  for (const sp of speeches) {
    const h = headerAtLine(sp.start_line);
    if (!h) { noHeader++; continue; }
    const oldKey = `${sp.current_marker ?? "-"} · ${sp.current_titel ?? "-"}`;
    const newKey = `${h.marker} · ${h.titel}`;
    if (oldKey === newKey) { unchanged++; continue; }
    updates.push({ speech_id: sp.speech_id, marker: h.marker, titel: h.titel, drucksachen: h.drucksachen });
  }

  if (verbose) console.log(`${speeches.length} Reden · ${updates.length} updates · ${unchanged} unchanged · ${noHeader} no-header`);

  if (write && updates.length > 0) {
    const stmt = db.prepare(
      `UPDATE berlin_speeches SET top_marker = ?, top_titel = ?, drucksache_nrn = ?
       WHERE speech_id = ?`,
    );
    const tx = db.transaction(() => {
      for (const u of updates) {
        stmt.run(u.marker, u.titel, u.drucksachen.length > 0 ? JSON.stringify(u.drucksachen) : null, u.speech_id);
      }
    });
    tx();
  }
  return { updated: write ? updates.length : 0, skipped: unchanged, ok: true };
}

// ── Run ──
if (SITZUNG_ARG) {
  processSitzung(SITZUNG_ARG, WRITE);
  console.log(WRITE ? "\n✓ Fertig (Sitzung " + SITZUNG_ARG + ")" : "\nDRY-RUN — mit --write tatsächlich UPDATEN");
} else if (ALL) {
  // Alle Sitzungen mit Reden + verfügbarem full_text
  const sitzungen = db.prepare(
    `SELECT DISTINCT bs.sitzung_nr AS nr FROM berlin_speeches bs
     JOIN berlin_pdf_texts t ON t.pdf_filename LIKE '%p19-' || printf('%03d', bs.sitzung_nr) || '%'
     WHERE bs.sitzung_nr IS NOT NULL AND t.full_text IS NOT NULL AND t.full_text != ''
     ORDER BY bs.sitzung_nr`,
  ).all() as { nr: number }[];

  console.log(`\n${sitzungen.length} Sitzungen mit verfügbarem PDF\n`);
  let totalUpdates = 0, totalOk = 0, totalFail = 0;
  for (const s of sitzungen) {
    const res = processSitzung(s.nr, WRITE, true);
    if (res.ok) { totalOk++; totalUpdates += res.updated; }
    else totalFail++;
  }
  console.log(`\n${WRITE ? "✓" : "DRY-RUN"} Total: ${totalOk} OK, ${totalFail} skip, ${totalUpdates} updates`);
}
