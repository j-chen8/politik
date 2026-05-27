/**
 * Deterministischer Parser für DIP-only Drucksachen-PDFs.
 *
 * Erkennt 4 Patterns aus der PDF-Volltext-Struktur und extrahiert je
 * nach Pattern strukturierte Zusatz-Informationen:
 *
 *  - Pattern A "Verfahrens-Antrag" → Beschluss-Klausel + Antragsteller
 *  - Pattern C "Wahlvorschlag"      → Sitzverteilung pro Fraktion
 *  - Pattern D "Sammelübersicht"    → Beschlussempfehlungen + Themen-Häufigkeit
 *  - Pattern B "Substantieller Antrag" → skip (durch reguläre Pipeline abgedeckt)
 *
 * Ausgabe: `dip_ds_details`-Tabelle mit JSON-Spalte parsed_summary.
 *
 * Run-Modi:
 *   npx tsx scripts/parse-dip-only-ds-pdfs.ts --test       # nur lokale /tmp/ds-inspect PDFs
 *   npx tsx scripts/parse-dip-only-ds-pdfs.ts              # alle DIP-only DS aus DB
 *   npx tsx scripts/parse-dip-only-ds-pdfs.ts --limit 5    # nur 5 testweise
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

// ============================================================================
// PDF-Text-Extraktion
// ============================================================================

async function loadPdfParse() {
  const mod = await import(
    "/home/jinsheng/politik/node_modules/pdf-parse/dist/pdf-parse/esm/index.js"
  );
  return mod.PDFParse;
}

async function extractText(buf: Buffer): Promise<{ text: string; pages: number }> {
  const PDFParse = await loadPdfParse();
  const parser = new PDFParse({ data: buf });
  const out = await parser.getText();
  return {
    text: (out.text ?? "").trim(),
    pages: typeof out.total === "number" ? out.total : 0,
  };
}

function buildPdfUrl(dsNr: string): string | null {
  const m = dsNr.match(/^(\d+)\/0*(\d+)$/);
  if (!m) return null;
  const wp = m[1];
  const nr5 = m[2].padStart(5, "0");
  const ordner = nr5.slice(0, 3);
  return `https://dserver.bundestag.de/btd/${wp}/${ordner}/${wp}${nr5}.pdf`;
}

async function fetchPdf(dsNr: string): Promise<Buffer | null> {
  const url = buildPdfUrl(dsNr);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ============================================================================
// Pattern-Erkennung
// ============================================================================

type DsPattern = "sammeluebersicht" | "wahlvorschlag" | "verfahren" | "substantiell" | "unknown";

function detectPattern(text: string, pages: number): DsPattern {
  const head = text.slice(0, 2000);
  // Sammelübersicht: Header enthält "Sammelübersicht ... zu Petitionen"
  if (/Sammelübersicht\s+\d+\s+zu Petitionen/i.test(head)) return "sammeluebersicht";
  // Wahlvorschlag: Header sagt "Wahlvorschläge" + Tabelle "Mitglieder | Stellvertretung"
  if (/^.{0,1000}Wahlvorschläge/is.test(text) && /Mitglieder.*Stellvertretung/i.test(text)) {
    return "wahlvorschlag";
  }
  // Substantieller Antrag: > 4 Seiten + Begründungs-Sektion
  if (pages > 4 && /Begründung\s*\n/i.test(text)) return "substantiell";
  // Verfahrens-Antrag: kurz (1-3 Seiten) + "Der Bundestag wolle beschließen"
  if (pages <= 3 && /Der Bundestag wolle beschließen/i.test(text)) return "verfahren";
  return "unknown";
}

// ============================================================================
// Pattern A: Verfahrens-Antrag
// ============================================================================

interface VerfahrenDetails {
  pattern: "verfahren";
  beschluss_klausel: string;
  antragsteller: string[];
}

function parseVerfahren(text: string): VerfahrenDetails {
  // Beschluss-Klausel: alles zwischen "Der Bundestag wolle beschließen:" und
  // (Datum-Linie | "Berlin, den …" | Antragsteller-Block).
  let klausel = "";
  const beschlMatch = text.match(/Der Bundestag wolle beschließen:?\s*([\s\S]+?)(?=Berlin,\s*den|\n[A-ZÄÖÜ][^\n]+(?:Fraktion|und Fraktion))/);
  if (beschlMatch) {
    klausel = beschlMatch[1]
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600);
  }

  // Antragsteller: Zeilen nach dem Datum, vor "Gesamtherstellung"/Footer.
  const signMatch = text.match(/Berlin,\s*den\s+\d{1,2}\.\s*\w+\s+\d{4}\s*\n([\s\S]+?)(?=Gesamtherstellung|Vertrieb:|ISSN|$)/);
  let antragsteller: string[] = [];
  if (signMatch) {
    antragsteller = signMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 5 && /(?:Fraktion|MdB|, Dr|und Fraktion)/i.test(l))
      .map((l) => l.replace(/\s+/g, " "))
      .slice(0, 10);
  }

  return { pattern: "verfahren", beschluss_klausel: klausel, antragsteller };
}

// ============================================================================
// Pattern C: Wahlvorschlag
// ============================================================================

interface WahlvorschlagDetails {
  pattern: "wahlvorschlag";
  fraktion_sitze: Array<{ fraktion: string; mitglieder: number }>;
  total_mitglieder: number;
}

/** Bekannte Fraktions-Namen im 21. Bundestag — alles andere ist Signatur-Zeile
 *  oder Footer-Müll und wird nicht als Fraktion gezählt. */
const KNOWN_FRAKTIONEN = new Set([
  "CDU/CSU", "AfD", "SPD",
  "BÜNDNIS 90/DIE GRÜNEN", "BÜNDNIS 90/Die GRÜNEN",
  "Die Linke", "DIE LINKE",
  "FDP", // historische Anträge
]);

function parseWahlvorschlag(text: string): WahlvorschlagDetails {
  // Nimm nur Blöcke bis zum "Berlin, den …"-Datum (alles danach sind
  // Fraktions-Signatur-Zeilen + PDF-Footer, keine Mitglieder mehr).
  const cutAt = text.search(/Berlin,\s*den\s+\d/);
  const body = cutAt > 0 ? text.slice(0, cutAt) : text;
  const blocks = body.split(/(Fraktion(?:\s+der)?\s+[^\n]+)/g);
  const result: Array<{ fraktion: string; mitglieder: number }> = [];
  for (let i = 1; i < blocks.length; i += 2) {
    const fraktionRaw = blocks[i].replace(/^Fraktion(?:\s+der)?\s+/, "").trim();
    // Filter: nur bekannte Fraktionen.
    if (!KNOWN_FRAKTIONEN.has(fraktionRaw)) continue;
    const segment = blocks[i + 1] ?? "";
    // Zähle Namen-Zeilen (zwei Personen-Spalten pro Zeile = ein Mitglied + sein
    // Stellvertreter, daher zählen wir nur die linke Spalte).
    const lines = segment
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^[A-ZÄÖÜ][a-zäöü]/.test(l) && !/Mitglieder|Stellvertretung|Berlin|Gesamtherstellung/.test(l));
    if (lines.length === 0) continue;
    result.push({ fraktion: fraktionRaw, mitglieder: lines.length });
  }
  return {
    pattern: "wahlvorschlag",
    fraktion_sitze: result,
    total_mitglieder: result.reduce((acc, x) => acc + x.mitglieder, 0),
  };
}

// ============================================================================
// Pattern D: Petitions-Sammelübersicht
// ============================================================================

interface SammeluebersichtDetails {
  pattern: "sammeluebersicht";
  nummer: number;
  beschlussempfehlungen: Array<{
    nummer: number;
    aktion: string;
    petitionen_count: number;
    themen: Array<{ thema: string; count: number }>;
  }>;
  total_petitionen: number;
  top_themen: Array<{ thema: string; count: number }>;
}

/** Wörter/Zeilen, die NIE ein gültiges Petitions-Thema sein können
 *  (Tabellen-Header, PDF-Noise, Verwaltungs-Begriffe). */
const PETITION_NOISE = new Set([
  "Lfd.", "Lfd. Nr.", "Nr.", "Aktenzeichen", "Aktenzeichen der", "Eingabe",
  "Wohnsitz", "Wohnsitz des", "Einsenders", "Inhalt der Eingabe",
  "Wohnsitz des Einsenders Inhalt der Eingabe",
  "noch", "Beschlussempfehlung", "Drucksache", "Wahlperiode", "Bundestag",
  "Deutscher Bundestag", "Beschlüsse", "Berlin",
  "Mönchengladbach", "Hamminkeln", "Neumünster", "Hunderdorf", "Radevormwald",
  "Lauenburg", "Schwarzenbach", "Schwarzenbach an der Saale", "ohne", "ohne Ortsangabe",
]);

/** Substring-Patterns die ein Thema disqualifizieren (PDF-Footer-Noise +
 *  Seiten-Header). */
const PETITION_NOISE_PATTERNS = [
  /ISSN\s+\d/,
  /Gesamtherstellung/i,
  /Bessemerstraße/i,
  /Bundesanzeiger Verlag/i,
  /heenemann-druck/i,
  /Wohnsitz des Einsenders/i,
  /Aktenzeichen der Eingabe/i,
  /Drucksache\s+\d+\/\d+/,                              // Seiten-Header
  /Deutscher\s+Bundestag\s*[–-]\s*\d+\.\s*Wahlperiode/i, // Seiten-Header
  /^Berlin,\s*den/,                                      // Datum-Zeile
];

/** Heuristik: ist diese Zeile potenziell ein Petitions-Thema?
 *  Themen sind kurze (1-7 Wörter) Substantiv-Phrasen, die nicht mit
 *  Tabellen-Vokabular kollidieren und nicht wie Akz/PLZ aussehen. */
function isLikelyThema(line: string): boolean {
  const s = line.trim();
  if (s.length < 4 || s.length > 80) return false;
  if (PETITION_NOISE.has(s)) return false;
  if (PETITION_NOISE_PATTERNS.some((re) => re.test(s))) return false;
  if (/^Pet\s/i.test(s)) return false;
  if (/^\d{4,6}\s/.test(s)) return false; // PLZ + Ort
  if (/^\d+\s+Pet/.test(s)) return false; // Lfd-Nr + Pet
  if (/^\d{4,6}$/.test(s)) return false; // pure PLZ
  if (/^\d{6}$/.test(s)) return false; // Akz-Suffix
  if (/^-+\s+\d+\s+of\s+\d+/i.test(s)) return false; // pdf-parse page marker
  // Beginnt mit Großbuchstaben (Substantiv oder Eigenname)
  if (!/^[A-ZÄÖÜ]/.test(s)) return false;
  return true;
}

function parseSammeluebersicht(text: string): SammeluebersichtDetails {
  const nrMatch = text.match(/Sammelübersicht\s+(\d+)/i);
  const nummer = nrMatch ? parseInt(nrMatch[1], 10) : 0;

  // Split nach "Beschlussempfehlung K"-Headers. "noch Beschlussempfehlung"
  // bezeichnet Fortsetzungs-Blöcke derselben BE — wir mergen die per gleicher
  // Nummer.
  const beBlocks = text.split(/(?:^|\n)\s*Beschlussempfehlung\s+(\d+)\s*\n/i);
  const blocksByNumber = new Map<number, string[]>();
  for (let i = 1; i < beBlocks.length; i += 2) {
    const beNr = parseInt(beBlocks[i], 10);
    const body = beBlocks[i + 1] ?? "";
    if (!blocksByNumber.has(beNr)) blocksByNumber.set(beNr, []);
    blocksByNumber.get(beNr)!.push(body);
  }

  const beschlussempfehlungen: SammeluebersichtDetails["beschlussempfehlungen"] = [];
  let totalPetitionen = 0;
  const themenGlobal = new Map<string, number>();

  for (const [beNr, bodies] of blocksByNumber.entries()) {
    const body = bodies.join("\n");
    // Aktion: alles bis zur ersten Tabelle/Lfd-Nr.
    const aktionMatch = body.match(/^([\s\S]{0,500}?)(?=\n\s*(?:Lfd\.|Inhalt der Eingabe|\d+\s+Pet\s|$))/);
    const aktion = (aktionMatch?.[1] ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    const themenInThisBe = new Map<string, number>();

    // Sub-Header-Thema (gilt für alle Petitionen dieser BE)
    const subThemaMatch = body.match(/Inhalt der Eingabe\s*\n([^\n]+?(?:\n[^\n]+?){0,1}?)\s*\n\s*Lfd\./);
    let subThema: string | null = null;
    if (subThemaMatch) {
      subThema = subThemaMatch[1].replace(/\s*\n\s*/g, " ").trim();
      if (PETITION_NOISE.has(subThema)) subThema = null;
    }

    // Zähle Petitionen: jedes "<N> Pet <Akz>" ist eine Petition.
    const petitionLines = body.match(/^\s*\d+\s+Pet\s/gm) ?? [];
    const petitionCount = petitionLines.length;

    if (subThema && petitionCount > 0) {
      // Alle Petitionen dieser BE bekommen das Sub-Thema.
      themenInThisBe.set(subThema, petitionCount);
      themenGlobal.set(subThema, (themenGlobal.get(subThema) ?? 0) + petitionCount);
      totalPetitionen += petitionCount;
    } else if (petitionCount > 0) {
      // Per-Row-Themen: splitte am "<N> Pet "-Token. Innerhalb jedes Blocks
      // ist das Thema die letzte Zeile die isLikelyThema(...) ist.
      const petBlocks = body.split(/(?=^\s*\d+\s+Pet\s)/m).slice(1);
      for (const pb of petBlocks) {
        const lines = pb.split("\n").map((l) => l.trim()).filter(Boolean);
        // Suche das Thema: gehe rückwärts und finde erste "wahrscheinliche
        // Thema"-Zeile, die nicht zur Akz/PLZ-Zeile gehört.
        // Manchmal ist Thema auf eigener Zeile, manchmal als Suffix auf
        // "PLZ Ort Thema"-Zeile.
        let thema: string | null = null;
        for (let j = lines.length - 1; j >= 0; j--) {
          const l = lines[j];
          // "PLZ Ort Thema"-Zusammenfall? Pattern: "<5 Ziffern> <Wort> <Thema-Text>"
          const plzInline = l.match(/^\d{4,6}\s+\S+\s+(.+)$/);
          if (plzInline && isLikelyThema(plzInline[1])) {
            thema = plzInline[1].trim();
            break;
          }
          if (isLikelyThema(l)) {
            thema = l;
            break;
          }
        }
        // Manche Themen erstrecken sich über 2 Zeilen ("Grundsicherung für\n
        // Arbeitsuchende/Bürgergeld (SGB II)"). Schauen ob die vorherige
        // Zeile auch ein Thema-Fragment ist und joinen.
        if (thema) {
          const idx = lines.lastIndexOf(thema);
          if (idx > 0 && isLikelyThema(lines[idx - 1]) && lines[idx - 1].length < 30) {
            thema = `${lines[idx - 1]} ${thema}`.trim();
          }
          themenInThisBe.set(thema, (themenInThisBe.get(thema) ?? 0) + 1);
          themenGlobal.set(thema, (themenGlobal.get(thema) ?? 0) + 1);
          totalPetitionen += 1;
        }
      }
    }

    const themen = Array.from(themenInThisBe.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([thema, count]) => ({ thema, count }));

    beschlussempfehlungen.push({
      nummer: beNr,
      aktion,
      petitionen_count: petitionCount,
      themen,
    });
  }

  const top_themen = Array.from(themenGlobal.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([thema, count]) => ({ thema, count }));

  return {
    pattern: "sammeluebersicht",
    nummer,
    beschlussempfehlungen,
    total_petitionen: totalPetitionen,
    top_themen,
  };
}

// ============================================================================
// Hauptfunktion + Test-Modus
// ============================================================================

type ParsedDetails = VerfahrenDetails | WahlvorschlagDetails | SammeluebersichtDetails | { pattern: "substantiell" | "unknown" };

async function parseDsPdf(dsNr: string, buf: Buffer): Promise<ParsedDetails> {
  const { text, pages } = await extractText(buf);
  const pattern = detectPattern(text, pages);
  switch (pattern) {
    case "sammeluebersicht": return parseSammeluebersicht(text);
    case "wahlvorschlag":    return parseWahlvorschlag(text);
    case "verfahren":        return parseVerfahren(text);
    default:                 return { pattern };
  }
}

async function runTest() {
  const TEST_DIR = "/tmp/ds-inspect";
  const TEST_FILES = [
    { ds: "21/0563", file: "21-0563.pdf" }, // Verfahren
    { ds: "21/0589", file: "21-0589.pdf" }, // Substantiell
    { ds: "21/0595", file: "21-0595.pdf" }, // Wahlvorschlag
    { ds: "21/0620", file: "21-0620.pdf" }, // Sammelübersicht klein
    { ds: "21/0828", file: "21-0828.pdf" }, // Sammelübersicht mittel
    { ds: "21/4331", file: "21-4331.pdf" }, // Sammelübersicht groß (63 Petitionen)
  ];
  for (const t of TEST_FILES) {
    const buf = fs.readFileSync(path.join(TEST_DIR, t.file));
    const details = await parseDsPdf(t.ds, buf);
    console.log(`\n${"=".repeat(70)}\n=== ${t.ds} ===\n${"=".repeat(70)}`);
    console.log(JSON.stringify(details, null, 2));
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const isTest = argv.includes("--test");

  if (isTest) {
    await runTest();
    return;
  }

  // Volle Mode: alle DIP-only DS verarbeiten + in DB speichern.
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS dip_ds_details (
      drucksache_nr TEXT PRIMARY KEY,
      pattern TEXT NOT NULL,
      details_json TEXT NOT NULL,
      parsed_at TEXT NOT NULL
    )
  `);
  const insert = db.prepare(`
    INSERT INTO dip_ds_details (drucksache_nr, pattern, details_json, parsed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(drucksache_nr) DO UPDATE SET
      pattern = excluded.pattern,
      details_json = excluded.details_json,
      parsed_at = excluded.parsed_at
  `);

  const limitIdx = argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(argv[limitIdx + 1], 10) : Infinity;

  // Worklist: alle DS die in bundestag_votes referenziert sind UND noch keine
  // parsed_details haben. Das umfasst:
  //  (a) DIP-only DS (aus dip_ds_titles)
  //  (b) DS mit Boilerplate-Analyse ("Sammelübersicht N des Petitionsausschusses
  //      mit X behandelten Petitionen") — diese sind in drucksache_analyses,
  //      aber der Inhalt der bisherigen LLM-Pipeline ist nichtssagend.
  const targets = db.prepare(`
    SELECT DISTINCT ds FROM (
      SELECT drucksache_nr AS ds FROM dip_ds_titles
      UNION ALL
      SELECT drucksache_nr AS ds FROM drucksache_analyses
        WHERE zusammenfassung LIKE 'Sammelübersicht%des Petitionsausschusses%'
    )
    WHERE ds NOT IN (SELECT drucksache_nr FROM dip_ds_details)
    ORDER BY ds
  `).all() as Array<{ ds: string }>;

  const normalized = targets.map((t) => ({ drucksache_nr: t.ds }));

  console.log(`=== Parse ${Math.min(normalized.length, limit)} von ${normalized.length} DS (DIP-only + Boilerplate-Petitionen) ===\n`);

  let ok = 0, miss = 0;
  for (const t of normalized.slice(0, limit)) {
    const buf = await fetchPdf(t.drucksache_nr);
    if (!buf) {
      console.log(`  ${t.drucksache_nr}: PDF nicht erreichbar`);
      miss += 1;
      continue;
    }
    try {
      const details = await parseDsPdf(t.drucksache_nr, buf);
      insert.run(t.drucksache_nr, details.pattern, JSON.stringify(details), new Date().toISOString());
      ok += 1;
      // Kurz-Output
      let summary = details.pattern;
      if (details.pattern === "sammeluebersicht") {
        const d = details;
        summary = `Sammelübersicht ${d.nummer}: ${d.total_petitionen} Petitionen, Top: ${d.top_themen.slice(0,3).map(t=>`${t.thema}(${t.count})`).join(", ")}`;
      } else if (details.pattern === "verfahren") {
        summary = `Verfahren: "${(details as VerfahrenDetails).beschluss_klausel.slice(0, 80)}..."`;
      } else if (details.pattern === "wahlvorschlag") {
        summary = `Wahlvorschlag: ${(details as WahlvorschlagDetails).total_mitglieder} Personen`;
      }
      console.log(`  ${t.drucksache_nr}: ${summary}`);
    } catch (e) {
      console.log(`  ${t.drucksache_nr}: ERROR ${e}`);
      miss += 1;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`\n=== Fertig: ${ok} OK, ${miss} Fehler ===`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
