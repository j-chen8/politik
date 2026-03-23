/**
 * Plenarprotokoll PDF Parser v2
 * Uses text item positions to reconstruct lines, then parses speakers/topics
 */

const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// ── Types ──

interface Speaker {
  name: string;
  party: string | null;
  role: string | null;
  count: number;
}

interface SpeechEntry {
  speaker: string;
  party: string | null;
  role: string | null;
  topicNumber: string;
  topicTitle: string;
  pageRef: string;
}

interface SessionInfo {
  wahlperiode: number;
  sitzung: number;
  datum: string;
}

interface ParseResult {
  session: SessionInfo;
  speeches: SpeechEntry[];
  speakers: Record<string, Speaker>;
  topics: { number: string; title: string }[];
}

// ── PDF → Lines ──

async function extractLines(filepath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(filepath));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  const allLines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Group text items by Y position (same line = same Y, within tolerance)
    const lineMap = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items as any[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, str: item.str });
    }

    // Sort by Y descending (top to bottom), then X ascending
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = items.map((i) => i.str).join("").trim();
      if (lineText) allLines.push(lineText);
    }
  }

  return allLines;
}

// ── Parse session info ──

function parseSession(lines: string[]): SessionInfo {
  let sitzung = 0;
  let datum = "";
  let wp = 21;

  for (const line of lines.slice(0, 30)) {
    const sm = line.match(/(\d+)\.\s*Sitzung/);
    if (sm) sitzung = parseInt(sm[1]);

    const dm = line.match(
      /(?:Berlin,\s*)?(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),\s*den\s*(\d+)\.\s*(\w+)\s*(\d{4})/
    );
    if (dm) datum = `${dm[1]}. ${dm[2]} ${dm[3]}`;

    const wm = line.match(/(\d+)\.\s*Wahlperiode/);
    if (wm) wp = parseInt(wm[1]);
  }

  return { wahlperiode: wp, sitzung, datum };
}

// ── Parse speakers from TOC ──

function parseTOC(lines: string[]): ParseResult {
  const session = parseSession(lines);
  const speeches: SpeechEntry[] = [];
  const speakerMap: Record<string, Speaker> = {};
  const topics: { number: string; title: string }[] = [];

  let currentTopicNum = "0";
  let currentTopicTitle = "Eröffnung";

  // Find where TOC ends (look for "Beginn:" or page number pattern at start of body)
  let tocEndIdx = lines.findIndex(
    (l) => l.match(/^Beginn:\s*\d/) || l.match(/^Präsident(?:in)?\s/)
  );
  if (tocEndIdx < 0) tocEndIdx = Math.min(lines.length, 500);

  const tocLines = lines.slice(0, tocEndIdx);

  // Speaker line pattern: "Name Name (Party)  . . .  7661 D" or "Name Name, Role  . . .  7661 D"
  const speakerLineRegex =
    /^((?:Dr\.\s+|Prof\.\s+)?[A-ZÄÖÜ][a-zäöüß]+(?:[-\s]+(?:von|van|de|zu|Al-|El-)?[A-ZÄÖÜa-zäöüß][-a-zäöüß]*)*?)(?:\s*,\s*(.+?))?\s*\(([^)]+)\)\s*(?:\.[\s.]*)?(\d{4,5}\s*[A-D])?\s*$/;

  // Role-only speaker (ministers etc): "Name Name, Bundeskanzler BMXYZ  . . .  7661 D"
  const roleLineRegex =
    /^((?:Dr\.\s+|Prof\.\s+)?[A-ZÄÖÜ][a-zäöüß]+(?:[-\s]+(?:von|van|de|zu|Al-|El-)?[A-ZÄÖÜa-zäöüß][-a-zäöüß]*)*?)\s*,\s*((?:Bundes(?:kanzler|minister)(?:in)?|Parl\.\s*Staatssekretär(?:in)?|Staatsminister(?:in)?|Staatssekretär(?:in)?|Wehrbeauftragte[r]?|Beauftragte[r]?)\s*\w*)\s*(?:\.[\s.]+)?(\d{4,5}\s*[A-D])\s*$/;

  // Topic line pattern: "Tagesordnungspunkt X:" or "Zusatzpunkt X:"
  const topicRegex =
    /^(?:Tagesordnungspunkt|Zusatzpunkt|Zusatztagesordnungspunkt)\s+(\d+\s*[a-z]?)\s*:\s*$/;

  let collectingTitle = false;
  let titleBuffer = "";

  for (let i = 0; i < tocLines.length; i++) {
    const line = tocLines[i];

    // Topic header
    const topicMatch = line.match(topicRegex);
    if (topicMatch) {
      currentTopicNum = topicMatch[1].trim();
      collectingTitle = true;
      titleBuffer = "";
      continue;
    }

    // If collecting title, grab text until we hit a speaker or another topic
    if (collectingTitle) {
      const isSpeaker = speakerLineRegex.test(line) || roleLineRegex.test(line);
      const isPageRef = /^\d{4,5}\s*[A-D]$/.test(line.trim());
      const isDots = /^[\s.]+$/.test(line);
      const isNextTopic = topicRegex.test(line);

      if (!isSpeaker && !isPageRef && !isDots && !isNextTopic && line.length > 3) {
        titleBuffer += (titleBuffer ? " " : "") + line.replace(/\.{3,}/g, "").replace(/\d{4,5}\s*[A-D]/g, "").trim();
        continue;
      } else {
        currentTopicTitle = titleBuffer || currentTopicNum;
        topics.push({ number: currentTopicNum, title: currentTopicTitle });
        collectingTitle = false;
      }
    }

    // Try speaker with party: "Friedrich Merz (CDU/CSU)"
    let match = line.match(speakerLineRegex);
    if (match) {
      const name = match[1].trim();
      const extraRole = match[2]?.trim() || null;
      const party = normalizeParty(match[3].trim());
      const pageRef = match[4]?.trim() || "";

      addSpeech(name, party, extraRole, currentTopicNum, currentTopicTitle, pageRef);
      continue;
    }

    // Try speaker with role (ministers): "Friedrich Merz, Bundeskanzler . . . 7661 D"
    match = line.match(roleLineRegex);
    if (match) {
      const name = match[1].trim();
      const role = match[2].trim();
      const pageRef = match[3]?.trim() || "";

      addSpeech(name, null, role, currentTopicNum, currentTopicTitle, pageRef);
      continue;
    }
  }

  function addSpeech(
    name: string,
    party: string | null,
    role: string | null,
    topicNum: string,
    topicTitle: string,
    pageRef: string
  ) {
    speeches.push({
      speaker: name,
      party,
      role,
      topicNumber: topicNum,
      topicTitle: topicTitle,
      pageRef,
    });

    if (!speakerMap[name]) {
      speakerMap[name] = { name, party, role, count: 0 };
    }
    speakerMap[name].count++;
    if (party && !speakerMap[name].party) speakerMap[name].party = party;
    if (role && !speakerMap[name].role) speakerMap[name].role = role;
  }

  return { session, speeches, speakers: speakerMap, topics };
}

function normalizeParty(raw: string): string {
  if (raw.includes("CDU") || raw.includes("CSU")) return "CDU/CSU";
  if (raw.includes("BÜNDNIS") || raw.includes("GRÜNEN")) return "BÜNDNIS 90/DIE GRÜNEN";
  if (raw.includes("SPD")) return "SPD";
  if (raw.includes("AfD")) return "AfD";
  if (raw.includes("Linke")) return "Die Linke";
  if (raw.includes("FDP")) return "FDP";
  if (raw.includes("BSW")) return "BSW";
  if (raw.includes("fraktionslos")) return "fraktionslos";
  return raw;
}

// ── Main ──

async function main() {
  const filepath = process.argv[2] || "data/plenarprotokolle/21064.pdf";
  const jsonOnly = process.argv.includes("--json");

  if (!jsonOnly) console.log(`Parsing: ${filepath}`);

  const lines = await extractLines(filepath);
  if (!jsonOnly) console.log(`Extracted ${lines.length} lines\n`);

  const result = parseTOC(lines);

  if (!jsonOnly) {
    console.log("=== SESSION ===");
    console.log(`${result.session.wahlperiode}. WP, ${result.session.sitzung}. Sitzung, ${result.session.datum}`);

    console.log(`\n=== ${result.topics.length} TAGESORDNUNGSPUNKTE ===`);
    for (const t of result.topics) {
      const count = result.speeches.filter((s) => s.topicNumber === t.number).length;
      console.log(`  TOP ${t.number}: ${t.title} (${count} Redner)`);
    }

    const sorted = Object.values(result.speakers).sort((a, b) => b.count - a.count);
    console.log(`\n=== ${sorted.length} REDNER ===`);
    for (const s of sorted.slice(0, 25)) {
      const p = s.party ? ` (${s.party})` : "";
      const r = s.role ? ` [${s.role}]` : "";
      console.log(`  ${String(s.count).padStart(3)}x  ${s.name}${p}${r}`);
    }

    // Party stats
    const partyStats: Record<string, number> = {};
    for (const s of result.speeches) {
      const p = s.party || s.role || "Unbekannt";
      partyStats[p] = (partyStats[p] || 0) + 1;
    }
    console.log("\n=== PARTEI-STATISTIK ===");
    for (const [party, count] of Object.entries(partyStats).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(3)}x  ${party}`);
    }
  }

  // Save JSON
  const jsonPath = filepath.replace(".pdf", ".json");
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
  if (!jsonOnly) console.log(`\nJSON → ${jsonPath}`);
}

main().catch(console.error);
