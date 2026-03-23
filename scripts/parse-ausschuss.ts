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

async function extractLines(filepath: string): Promise<{ lines: string[]; pages: number }> {
  const data = new Uint8Array(fs.readFileSync(filepath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const allLines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lineMap = new Map<number, { x: number; str: string }[]>();

    for (const item of content.items as any[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, str: item.str });
    }

    for (const y of [...lineMap.keys()].sort((a, b) => b - a)) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const text = items.map((i) => i.str).join("").trim();
      if (text) allLines.push(text);
    }
    allLines.push("---PAGEBREAK---");
  }

  return { lines: allLines, pages: doc.numPages };
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

function parseAttendance(lines: string[]): Attendee[] {
  const attendees: Attendee[] = [];

  // Find the attendance section
  let inAttendance = false;
  let currentFraktion = "";

  const fraktionRegex = /^(CDU\/CSU|AfD|SPD|BÜNDNIS\s*90\/\s*DIE|GRÜNEN|FDP|Die Linke|BSW|fraktionslos)/;
  const attendanceStart = /(?:Anwesenheit|Teilnehmende\s+Mitglieder|Mitglieder\s+des\s+Ausschusses|Ausschussmitglieder)/i;
  const attendanceEnd = /(?:^Tagesordnung|^Tagesordnungspunkt|^Einziger\s+Tagesordnungspunkt|---PAGEBREAK---)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (attendanceStart.test(line)) {
      inAttendance = true;
      continue;
    }

    if (inAttendance && attendanceEnd.test(line)) {
      break;
    }

    if (!inAttendance) continue;

    // Skip header lines
    if (line.match(/^(Fraktion|Ordentliche|Stellvertretende|Fraktionen)\b/)) continue;
    if (line.match(/^\d+\.\s*Wahlperiode/)) continue;
    if (line.match(/^Seite\s+\d+/)) continue;

    // Detect fraktion
    const fMatch = line.match(fraktionRegex);
    if (fMatch) {
      const raw = fMatch[1];
      if (raw.includes("CDU")) currentFraktion = "CDU/CSU";
      else if (raw.includes("BÜNDNIS") || raw.includes("GRÜNEN")) currentFraktion = "BÜNDNIS 90/DIE GRÜNEN";
      else currentFraktion = raw;

      // Names might be on the same line after the fraktion
      const rest = line.replace(fraktionRegex, "").trim();
      if (rest) {
        // Could be "Name, LastnameOtherName, Lastname" (columns merged)
        extractNames(rest, currentFraktion, attendees);
      }
      continue;
    }

    // Regular name lines
    if (currentFraktion && line.length > 2 && !line.match(/^(Nur|Dieser|Protokoll)/)) {
      extractNames(line, currentFraktion, attendees);
    }
  }

  return attendees;
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
  const { lines, pages } = await extractLines(filepath);

  const session = parseHeader(lines);
  session.seiten = pages;

  const attendees = parseAttendance(lines);
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
