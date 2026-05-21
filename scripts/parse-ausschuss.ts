/**
 * Ausschuss-Protokoll PDF Parser
 * Extracts: committee info, attendance, topics, speakers
 */

const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// ── Types ──

interface CommitteeSession {
  protokollNr: string; // "21/18"
  wahlperiode: number;
  sitzungNr: number;
  ausschuss: string;
  typ: "Wortprotokoll" | "Kurzprotokoll" | "Beschlussprotokoll" | "Unbekannt";
  datum: string;
  ort: string;
  vorsitz: string;
  seiten: number;
}

interface Attendee {
  name: string;
  fraktion: string;
  typ: "ordentlich" | "stellvertretend" | "sachverständig" | "gast" | "regierung";
}

interface Topic {
  number: string;
  title: string;
  drucksache: string | null;
}

interface CommitteeSpeaker {
  name: string;
  fraktion: string | null;
  count: number;
}

interface ParsedCommitteeProtocol {
  session: CommitteeSession;
  attendees: Attendee[];
  topics: Topic[];
  speakers: Record<string, CommitteeSpeaker>;
}

// ── PDF → Lines ──

interface StructuredItem { x: number; w: number; str: string }
type StructuredLine = StructuredItem[];

function joinItemsWithGaps(items: StructuredItem[]): string {
  // Join with gap-aware whitespace: any visible horizontal gap → insert space.
  // Prevents table-column data being glued ("Stephanja" instead of "Stephan ja").
  let text = "";
  let prevEndX = -Infinity;
  for (const it of items) {
    const gap = it.x - prevEndX;
    if (text && gap > 1 && !/\s$/.test(text) && !/^\s/.test(it.str)) {
      text += " ";
    }
    text += it.str;
    prevEndX = it.x + it.w;
  }
  return text.replace(/\s+/g, " ").trim();
}

async function extractLines(
  filepath: string,
): Promise<{ lines: string[]; structured: (StructuredLine | null)[]; pages: number }> {
  const data = new Uint8Array(fs.readFileSync(filepath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const allLines: string[] = [];
  const allStructured: (StructuredLine | null)[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lineMap = new Map<number, StructuredItem[]>();

    for (const item of content.items as any[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      const w = typeof item.width === "number" ? item.width : 0;
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, w, str: item.str });
    }

    for (const y of [...lineMap.keys()].sort((a, b) => b - a)) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const text = joinItemsWithGaps(items);
      if (text) {
        allLines.push(text);
        allStructured.push(items);
      }
    }
    allLines.push("---PAGEBREAK---");
    allStructured.push(null);
  }

  return { lines: allLines, structured: allStructured, pages: doc.numPages };
}

// ── Parsers ──

function parseHeader(lines: string[]): CommitteeSession {
  let protokollNr = "";
  let wahlperiode = 21;
  let sitzungNr = 0;
  let ausschuss = "";
  let typ: CommitteeSession["typ"] = "Unbekannt";
  let datum = "";
  let ort = "";
  let vorsitz = "";

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i];

    // Protokoll-Nr. 21/18
    const pMatch = line.match(/Protokoll-Nr\.\s*(\d+\/\d+)/);
    if (pMatch) protokollNr = pMatch[1];

    // 21. Wahlperiode
    const wMatch = line.match(/(\d+)\.\s*Wahlperiode/);
    if (wMatch) wahlperiode = parseInt(wMatch[1]);

    // Ausschuss name (usually a line containing "Ausschuss für" or specific names)
    if (line.match(/^(?:Ausschuss\s+(?:für|für die)|Finanzausschuss|Innenausschuss|Petitionsausschuss|Verteidigungsausschuss|Sportausschuss)/)) {
      if (!ausschuss) ausschuss = line;
    }

    // Type: Wortprotokoll / Kurzprotokoll / Beschlussprotokoll
    if (line.match(/^Wortprotokoll$/i)) typ = "Wortprotokoll";
    if (line.match(/^Kurzprotokoll$/i)) typ = "Kurzprotokoll";
    if (line.match(/^Beschlussprotokoll$/i)) typ = "Beschlussprotokoll";

    // Sitzung number: "der 18. Sitzung"
    const sMatch = line.match(/der\s+(\d+)\.\s*Sitzung/);
    if (sMatch) sitzungNr = parseInt(sMatch[1]);

    // Datum: "Berlin, den 4. März 2026" or "Berlin, den 4. März 2026, 11:30 Uhr"
    const dMatch = line.match(/Berlin,\s*(?:den\s+)?(\d+\.\s*\w+\s*\d{4})/);
    if (dMatch) datum = dMatch[1].replace(/\s+/g, " ").trim();

    // Also try standalone date lines
    const dMatch2 = line.match(/^(\d+)\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/);
    if (dMatch2 && !datum) datum = `${dMatch2[1]}. ${dMatch2[2]} ${dMatch2[3]}`;

    // Vorsitz
    const vMatch = line.match(/Vorsitz:\s*(?:VP\s+)?(.+?)(?:,\s*MdB)?$/);
    if (vMatch) vorsitz = vMatch[1].trim();
  }

  return { protokollNr, wahlperiode, sitzungNr, ausschuss, typ, datum, ort: "Berlin", vorsitz, seiten: 0 };
}

// Column-aware Attendance-Parser. The PDF has a fixed-column table:
//   Fraktion (x ≈ 60-130) | Ordentliche (x ≈ 149-310) | Anwesenheit | Stellvertretende (x ≈ 362-510) | Anwesenheit
// Column thresholds are detected from the header row "Fraktion | Ordentliche … | Stellvertretende …".
// Single global currentFraktion does NOT work because:
//   (a) Multi-line Fraktion-Labels: "BÜNDNIS 90/" + "DIE GRÜNEN" auf zwei Zeilen
//   (b) Names from BOTH columns (Ordentliche + Stellvertretende) get tagged with the same Fraktion correctly.
function parseAttendance(structured: (StructuredLine | null)[], lines: string[]): Attendee[] {
  const attendees: Attendee[] = [];
  const seen = new Set<string>(); // dedupe across both columns

  let inAttendance = false;
  let currentFraktion = "";
  let pendingFraktionPrefix = ""; // for "BÜNDNIS 90/" → wait for "DIE GRÜNEN"

  // Auto-detected column boundaries (set when header row is encountered).
  // Defaults match observed Bildung-Familie layout; will be overridden per-PDF.
  let colOrdMinX = 130;
  let colOrdMaxX = 310;
  let colStellvMinX = 350;
  let colStellvMaxX = 510;

  const attendanceStart = /(?:Mitglieder\s+des\s+Ausschusses|Anwesenheit|Teilnehmende\s+Mitglieder|Ausschussmitglieder)/i;

  for (let i = 0; i < structured.length; i++) {
    const line = structured[i];
    if (!line) {
      // PAGEBREAK — keep going if we're still in attendance section (continues across pages)
      continue;
    }
    const flat = lines[Math.min(i, lines.length - 1)] ?? joinItemsWithGaps(line);

    if (!inAttendance) {
      if (attendanceStart.test(flat)) inAttendance = true;
      continue;
    }

    // End markers — typical sections that follow the Mitglieder-Tabelle.
    if (/^(Tagesordnung|Tagesordnungspunkt\b|Einziger\s+Tagesordnungspunkt|Mitglieder\s+der\s+Bundesregierung|Bundesregierung\b|Sachverständige|Berichterstatter\b|Ministerium\s+bzw|Dienststelle\b|Amtsbezeichnung\b|Beratungsgegenstand|Anhörungsgegenstand|Sitzungsverlauf)/i.test(flat)) break;

    // Header row — detect column positions from "Ordentliche Mitglieder" / "Stellvertretende Mitglieder"
    const ordHeader = line.find((it) => /^Ordentliche/.test(it.str));
    const stellvHeader = line.find((it) => /^Stellvertretende/.test(it.str));
    if (ordHeader && stellvHeader) {
      colOrdMinX = ordHeader.x - 5;
      colOrdMaxX = stellvHeader.x - 20;
      colStellvMinX = stellvHeader.x - 5;
      colStellvMaxX = stellvHeader.x + 200; // generous right bound
      continue; // header row itself doesn't contain names
    }

    // Skip page-footer / Wahlperiode / "Seite x von y"
    if (/^(Seite\s+\d+|\d+\.\s*Wahlperiode|Protokoll der \d+\.)/i.test(flat)) continue;

    // 1) Fraktion-cell: items with x < colOrdMinX (i.e. left of "Ordentliche" column)
    const fraktionItems = line.filter((it) => it.x < colOrdMinX);
    if (fraktionItems.length > 0) {
      const fStr = joinItemsWithGaps(fraktionItems);
      if (fStr) {
        // BÜNDNIS-90-Erkennung: jeder Bestandteil ("BÜNDNIS 90/", "BÜNDNIS 90/DIE",
        // "DIE GRÜNEN", "GRÜNEN") landet in derselben Fraktion. Sofort setzen,
        // damit Namen auf der ersten Zeile (mit nur "BÜNDNIS 90/DIE" als Label)
        // korrekt zugeordnet werden.
        if (/(?:BÜNDNIS|GRÜNEN)/i.test(fStr)) {
          currentFraktion = "BÜNDNIS 90/DIE GRÜNEN";
          pendingFraktionPrefix = "";
        } else {
          const m = fStr.match(/^(CDU\/CSU|AfD|SPD|FDP|Die Linke|BSW|fraktionslos)/i);
          if (m) {
            const raw = m[1];
            if (/CDU/i.test(raw)) currentFraktion = "CDU/CSU";
            else currentFraktion = raw;
            pendingFraktionPrefix = "";
          }
        }
      }
    }

    if (!currentFraktion) continue;

    // 2) Ordentliches-Mitglied — exclude pure-symbol items (☒/☐) from the column.
    const ordItems = line.filter(
      (it) => it.x >= colOrdMinX && it.x < colOrdMaxX && !/^[☒☐■□✓✗\s]+$/u.test(it.str),
    );
    if (ordItems.length > 0) {
      const nameText = joinItemsWithGaps(ordItems);
      addAttendeeIfValid(nameText, currentFraktion, attendees, seen, "ordentlich");
    }

    // 3) Stellvertretendes-Mitglied
    const stellvItems = line.filter(
      (it) => it.x >= colStellvMinX && it.x < colStellvMaxX && !/^[☒☐■□✓✗\s]+$/u.test(it.str),
    );
    if (stellvItems.length > 0) {
      const nameText = joinItemsWithGaps(stellvItems);
      addAttendeeIfValid(nameText, currentFraktion, attendees, seen, "stellvertretend");
    }
  }

  return attendees;
}

// Add an attendee if the text looks like a real name. Drops known table-noise
// like "ja", "nein", "-", "N. N.", and dedupes across rows.
function addAttendeeIfValid(
  raw: string,
  fraktion: string,
  attendees: Attendee[],
  seen: Set<string>,
  typ: Attendee["typ"],
): void {
  let s = raw.trim();
  // Strip Unicode-Kästchen / Häkchen die die Anwesenheits-Spalte markieren
  s = s.replace(/[☒☐■□✓✗]/gu, " ").replace(/\s+/g, " ").trim();
  // Strip Asterisks/Sterne/Klammer-Marker die der Parser durchschleust
  // (z.B. "Oliver* Kaczmarek", "Josephine** Ortleb")
  s = s.replace(/[*†‡§¶]+/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/\s+(ja|nein)\s*$/i, "").trim();
  s = s.replace(/^[•\-–—\s]+/, "").trim();
  if (!s || s.length < 4) return;
  if (/^N\.?\s*N\.?$/i.test(s)) return;
  if (/^(ja|nein)$/i.test(s)) return;

  // "LastName, FirstName"-Pattern: nach dem Komma muss ein Großbuchstabe stehen.
  if (!/^\p{Lu}[\p{L}\-']+(?:\s+(?:von|van|de|zu|Frhr\.?))?\s*,\s*\p{Lu}/u.test(s)) return;

  // Reject prose-fragments that bleed in from Anhörungs-/Beratungs-Texten:
  // "Violetta Bock, weiterer Abgeordneter und Bünger"
  // "Kommunistischen Partei Vietnams Becker"
  // Ein echter MdB-Name enthält keine niedergeschriebenen Funktions- oder
  // Sachgebietsbegriffe.
  const PROSE_RX = /\b(weitere[rn]?|Abgeordnete[rnm]?|Mitglied(er)?|Stellvertret\w+|Fraktion(en)?|Politik|Heilkunde|Stabilität|Republik|Partei|Hoteliers?|Fluglinien|Vorsitz\w*|Präsiden\w*|Vietnam(s)?|Singapur|Italien\w*|Amerikan\w*|Drucksache|Heimat|Stadtentwicklung\b(?!.*,))/iu;
  if (PROSE_RX.test(s)) return;

  // Convert "LastName, FirstName" → "FirstName LastName"
  let display = s;
  const m = s.match(/^([\p{Lu}][\p{L}\-']+(?:\s+(?:von|van|de|zu|Frhr\.?))?)\s*,\s*(.+)$/u);
  if (m) {
    const last = m[1].trim();
    const first = m[2].trim();
    display = `${first} ${last}`;
  }

  // Final structural check: 2-5 tokens, jeder Token beginnt mit Großbuchstaben
  // (Ausnahme: deutsche Adelspartikel "von", "van", "de", "zu").
  const tokens = display.split(/\s+/);
  if (tokens.length < 2 || tokens.length > 5) return;
  for (const t of tokens) {
    if (!t) return;
    if (/[*\[\]()0-9]/.test(t)) return;
    if (/^(von|van|de|zu|Frhr\.?|Frfr\.?)$/i.test(t)) continue;
    if (!/^\p{Lu}/u.test(t)) return;
  }

  if (seen.has(display)) return;
  seen.add(display);
  attendees.push({ name: display, fraktion, typ });
}

function extractNames(text: string, fraktion: string, attendees: Attendee[]) {
  // Names appear as "LastName, FirstName" or just "FirstName LastName"
  // Sometimes merged from two columns: "Kuban, TilmanBareiß, Thomas"
  // Try to split by capital letter patterns indicating merged names
  const nameRegex = /([A-ZÄÖÜ][a-zäöüß]+(?:\s+(?:von|van|de|zu|Frhr\.|Dr\.|Prof\.)\s+)?[A-ZÄÖÜ]?[a-zäöüß]*),\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ]\.?)?)/g;

  let match;
  while ((match = nameRegex.exec(text)) !== null) {
    const name = `${match[2].trim()} ${match[1].trim()}`;
    if (name.length > 4 && !attendees.find((a) => a.name === name)) {
      attendees.push({ name, fraktion, typ: "ordentlich" });
    }
  }
}

function parseTopics(lines: string[]): Topic[] {
  const topics: Topic[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // "Tagesordnungspunkt 1" or "Einziger Tagesordnungspunkt"
    const topicMatch = line.match(/(?:Tagesordnungspunkt\s+(\d+[a-z]?)|Einziger\s+Tagesordnungspunkt)/i);
    if (topicMatch) {
      const num = topicMatch[1] || "1";
      let title = "";
      let drucksache: string | null = null;

      // Collect title from following lines
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const next = lines[j];
        if (next.match(/^(Tagesordnungspunkt|---PAGEBREAK---|Federführend|Mitberatend|Berichterstatter|Hierzu|Seite\s+\d)/)) break;

        // Look for Drucksache reference
        const dsMatch = next.match(/BT-Drucksache\s+([\d/]+)/);
        if (dsMatch) {
          drucksache = dsMatch[1];
          continue;
        }

        if (next.length > 3 && !next.match(/^(Seite|21\.\s*Wahlperiode)/)) {
          title += (title ? " " : "") + next;
        }
      }

      topics.push({ number: num, title: title.substring(0, 200), drucksache });
    }
  }

  return topics;
}

function parseSpeakersFromBody(lines: string[]): Record<string, CommitteeSpeaker> {
  const speakers: Record<string, CommitteeSpeaker> = {};

  // In Wortprotokolle, speakers appear as bold names followed by their speech
  // Pattern: "Vorsitzende Saskia Esken:" or "Abg. Ellen Demuth (CDU/CSU):"
  const speakerRegex = /^(?:(?:Vorsitzend(?:e[r]?)|Abg\.|Sv\s|SV\s|Svst)\s+)?(?:Dr\.\s+|Prof\.\s+)?([A-ZÄÖÜ][a-zäöüß]+(?:[-\s]+(?:von|van|de|zu|Frhr\.)?[A-ZÄÖÜa-zäöüß][-a-zäöüß]*)*)\s*(?:\(([^)]+)\))?\s*:$/;

  // Skip false positives
  const skipPatterns = /^(Federführend|Mitberatend|Gutachtlich|Hierzu|Berichterstatter|Seite|Anlage|Protokoll|Ausschuss|Berlin|Tagesordnung|Ich\s|Er\s|Sie\s|Wir\s|Das\s|Die\s|Der\s|Es\s|Man\s)/;

  for (const line of lines) {
    if (skipPatterns.test(line)) continue;

    let match = line.match(speakerRegex);
    if (match) {
      const name = match[1].trim();
      const fraktion = match[2]?.trim() || null;

      if (name.length < 4) continue;
      if (name.match(/^(Seite|Protokoll|Ausschuss|Berlin|Tagesordnung|Fraktion|Ordentliche|Stellvertretende)/)) continue;

      if (!speakers[name]) {
        speakers[name] = { name, fraktion, count: 0 };
      }
      speakers[name].count++;
      if (fraktion && !speakers[name].fraktion) speakers[name].fraktion = fraktion;
    }
  }

  return speakers;
}

// ── Main ──

async function parseCommitteeProtocol(filepath: string): Promise<ParsedCommitteeProtocol> {
  const { lines, structured, pages } = await extractLines(filepath);

  const session = parseHeader(lines);
  session.seiten = pages;

  const attendees = parseAttendance(structured, lines);
  const topics = parseTopics(lines);
  const speakers = parseSpeakersFromBody(lines);

  return { session, attendees, topics, speakers };
}

async function main() {
  const filepath = process.argv[2];
  const batchMode = process.argv.includes("--batch");

  if (batchMode) {
    // Process all PDFs in a directory
    const dir = filepath || "data/ausschuss_protokolle";
    const results: ParsedCommitteeProtocol[] = [];
    const pdfFiles: string[] = [];

    function findPdfs(d: string) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) findPdfs(full);
        else if (entry.name.endsWith(".pdf")) pdfFiles.push(full);
      }
    }
    findPdfs(dir);

    console.log(`Found ${pdfFiles.length} PDFs to parse\n`);

    let success = 0;
    let fail = 0;

    for (const f of pdfFiles) {
      try {
        const result = await parseCommitteeProtocol(f);
        results.push(result);

        const jsonPath = f.replace(".pdf", ".json");
        fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

        const att = result.attendees.length;
        const spk = Object.keys(result.speakers).length;
        const top = result.topics.length;
        console.log(
          `  ${result.session.protokollNr.padEnd(8)} ${result.session.ausschuss.substring(0, 40).padEnd(42)} ` +
          `${String(att).padStart(3)} Anwesende  ${String(spk).padStart(3)} Redner  ${String(top).padStart(2)} TOPs  [${result.session.typ}]`
        );
        success++;
      } catch (e: any) {
        console.log(`  ERROR: ${path.basename(f)} - ${e.message}`);
        fail++;
      }
    }

    console.log(`\n=== ${success} OK, ${fail} Fehler ===`);

    // Summary JSON
    const summaryPath = path.join(dir, "parse-summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(results.map(r => ({
      file: r.session.protokollNr,
      ausschuss: r.session.ausschuss,
      typ: r.session.typ,
      datum: r.session.datum,
      sitzung: r.session.sitzungNr,
      attendees: r.attendees.length,
      speakers: Object.keys(r.speakers).length,
      topics: r.topics.length,
    })), null, 2));
    console.log(`Summary → ${summaryPath}`);

  } else {
    // Single file mode
    if (!filepath) {
      console.log("Usage: npx tsx parse-ausschuss.ts <file.pdf> [--batch]");
      process.exit(1);
    }

    const result = await parseCommitteeProtocol(filepath);

    console.log("=== SITZUNG ===");
    console.log(`Protokoll: ${result.session.protokollNr}`);
    console.log(`Ausschuss: ${result.session.ausschuss}`);
    console.log(`Typ:       ${result.session.typ}`);
    console.log(`Sitzung:   ${result.session.sitzungNr}`);
    console.log(`Datum:     ${result.session.datum}`);
    console.log(`Vorsitz:   ${result.session.vorsitz}`);
    console.log(`Seiten:    ${result.session.seiten}`);

    console.log(`\n=== ${result.attendees.length} ANWESENDE ===`);
    const byFraktion: Record<string, string[]> = {};
    for (const a of result.attendees) {
      if (!byFraktion[a.fraktion]) byFraktion[a.fraktion] = [];
      byFraktion[a.fraktion].push(a.name);
    }
    for (const [f, names] of Object.entries(byFraktion)) {
      console.log(`  ${f} (${names.length}): ${names.join(", ")}`);
    }

    console.log(`\n=== ${result.topics.length} TAGESORDNUNGSPUNKTE ===`);
    for (const t of result.topics) {
      const ds = t.drucksache ? ` [${t.drucksache}]` : "";
      console.log(`  TOP ${t.number}: ${t.title}${ds}`);
    }

    console.log(`\n=== ${Object.keys(result.speakers).length} REDNER ===`);
    const sorted = Object.values(result.speakers).sort((a, b) => b.count - a.count);
    for (const s of sorted.slice(0, 20)) {
      const f = s.fraktion ? ` (${s.fraktion})` : "";
      console.log(`  ${String(s.count).padStart(3)}x  ${s.name}${f}`);
    }

    const jsonPath = filepath.replace(".pdf", ".json");
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`\nJSON → ${jsonPath}`);
  }
}

main().catch(console.error);
