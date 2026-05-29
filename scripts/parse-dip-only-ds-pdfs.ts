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

interface PetitionRow {
  lfd_nr: number;
  aktenzeichen: string;
  plz: string | null;
  ort: string;
  sachgebiet: string;
}

interface SammeluebersichtDetails {
  pattern: "sammeluebersicht";
  nummer: number;
  beschlussempfehlungen: Array<{
    nummer: number;
    aktion: string;
    petitionen_count: number;
    themen: Array<{ thema: string; count: number }>;
    petitionen: PetitionRow[];
  }>;
  total_petitionen: number;
  top_themen: Array<{ thema: string; count: number }>;
}

/** Heuristisches Wörterbuch: Erstwörter, die typischerweise ein
 *  Petitions-Sachgebiet einleiten. Wird benutzt, um „Ort" von „Sachgebiet"
 *  in einer linearisierten "PLZ Ort Sachgebiet"-Zeile zu trennen. Liste
 *  empirisch aus Sammelübersicht 171 + Standard-Sachgebieten des
 *  Petitionsausschusses. */
const SACHGEBIET_FIRST_TOKENS = new Set([
  "Beschwerden", "Bundesamt", "Bundesagentur", "Bundeswehr", "Bundesversammlung",
  "Bundespolizei", "Bundesfinanzministerium",
  "Erneuerbare", "Energiewende", "Energie", "Energieversorgung",
  "Berücksichtigung", "Beitragsbemessung",
  "Aufenthaltstitel", "Aufenthaltsbeendende", "Aufenthaltsrecht",
  "Asylrecht", "Asyl",
  "Personelle", "Personal",
  "Sicherheit",
  "Sozialversicherung", "Sozialhilfe", "Sozialgesetzbuch",
  "Familienleistungsausgleich", "Familienversicherung", "Familienrecht",
  "Krankenversicherung", "Krankengeld", "Krankenhaus", "Krankenversicherungsbeiträge",
  "Pflegeversicherung", "Pflege",
  "Arbeitslosengeld", "Arbeitslohn", "Arbeitsrecht", "Arbeitszeit",
  "Wirtschaftsförderung", "Wirtschaftssicherung", "Wirtschaftliche", "Wirtschaft",
  "Verwaltungsverfahren", "Verwaltung",
  "Straßenverkehrsrecht", "Straßenverkehrs-Ordnung", "Straßenverkehr",
  "Verhaltensregeln",
  "Fördermaßnahmen", "Förderung",
  "Leistungen", "Anträge",
  "Staatsangehörigkeit",
  "Sanktion", "Sanktionen",
  "Ausländerrecht", "Ausländer",
  "Immissionsschutz", "Immissionen",
  "Abfallwirtschaft", "Abfallrecht",
  "Einkommensteuer", "Einkommen", "Einzelhandel", "Einzelplan",
  "Gesundheitsfachberufe", "Gesundheit",
  "Gesetzliche", "Gesetzgebung",
  "Kraftfahrzeugsteuer", "Kraftfahrzeug",
  "Schutzbauten",
  "Haushaltswesen", "Haushalt",
  "Gas", "Wasser", "Strom",
  "Bundeswehrverwaltung", "Bundesfinanzhof",
  "Steuerrecht", "Steuern",
  "Bildung", "Bildungsförderung",
  "Datenschutz", "Datenverarbeitung",
  "Rente", "Rentenversicherung",
  "Mietrecht", "Wohngeld", "Wohnungswesen",
  "Justiz", "Justizverwaltung",
  "Polizei", "Polizeirecht",
  "Telekommunikation",
  "Klimaschutz", "Klima",
  "Verteidigung", "Verteidigungspolitik",
  "Verbraucherschutz",
  "Tierschutz", "Tierrecht",
  "Naturschutz",
  "Atomrecht", "Atomenergie",
  "Schienenverkehr", "Bahnverkehr",
  "Luftverkehr",
  "Schiffsverkehr",
  "Bauwesen", "Baurecht",
  "Wahlrecht", "Wahlen",
  "Petitionen", "Petitionsrecht",
  "Regelbedarf",
  "Grundsicherung",
  "Deutscher", "Deutsche", // "Deutscher Bundestag", "Deutsche Botschaften"
  "Behindertenhilfe", "Behinderte",
  "Lebensmittelrecht",
  "Vergaberecht",
  "Forschung", "Wissenschaft",
  "Hochschulrecht", "Hochschulen",
  "Steuerverwaltung",
  "Außenpolitik", "Außenhandel",
  "Bundesgrenzschutz",
  "Verkehrssicherheit",
  "Strafrecht", "Strafprozess",
  "Bürgergeld",
]);

/** Erkennt, ob ein Token einen Ort-Fortsatz markiert (z.B. „an der Saale",
 *  „im Breisgau") — diese Tokens werden zum Ort gezählt, nicht zum
 *  Sachgebiet. */
const ORT_CONTINUATION_TOKENS = new Set([
  "an", "der", "die", "das", "im", "am", "in", "auf", "bei", "von", "und",
  "ob", "zu", "vor", "unter",
]);

/** Großgeschriebene Tokens, die typische deutsche Ortsname-Prefixes sind und
 *  zum Ort gezählt werden müssen, auch wenn sie isoliert erscheinen. */
const ORT_PREFIX_TOKENS = new Set([
  "Bad", "Sankt", "St.", "Großen", "Klein", "Alt", "Neu", "Hohen", "Ober",
]);

/** Endungen typischer deutscher Ortsnamen — wenn ein Token so endet,
 *  zählen wir es zum Ort, auch wenn es mit Großbuchstaben anfängt. */
const ORTSNAME_SUFFIX_PATTERNS = [
  /(?:stadt|burg|berg|dorf|hausen|bach|feld|thal|tal|heim|furt|bruck|brücken|au|see|hof|kirchen|stein|wald|hagen|büttel|leben|münde|rode|werk|hofen|brunn|moor|reuth|geist|gau)$/i,
];

function looksLikeSachgebiet(token: string): boolean {
  if (SACHGEBIET_FIRST_TOKENS.has(token)) return true;
  // Längere Substantiv-Composite die typischerweise Sachgebiete sind
  if (/^[A-ZÄÖÜ]\w{3,}(?:steuer|recht|verfahren|wesen|ordnung|gesetz|behörde|behörden|amt|agentur|ministerium|hilfe|fonds|prozess)$/.test(token)) return true;
  return false;
}

function isOrtContinuation(token: string, prevToken: string | null): boolean {
  // Klein anfangende Bindewörter ("an", "der", "im") oder Klammern
  if (ORT_CONTINUATION_TOKENS.has(token)) return true;
  if (/^\(/.test(token)) return true; // "(Müritz)"-Suffix
  // Token endet mit Bindestrich → wahrscheinlich Hyphen-Fortsetzung des Ortes
  if (token.endsWith("-")) return true;
  // Vorheriges Token endete mit Bindestrich → diese ist die Fortsetzung
  if (prevToken && prevToken.endsWith("-")) return true;
  // Großbuchstaben-Token mit typischer Ortsnamen-Endung
  if (ORTSNAME_SUFFIX_PATTERNS.some((re) => re.test(token))) return true;
  return false;
}

/** Joint Bindestrich-Linebreaks:
 *  "Bundes-\nbehörden" → "Bundesbehörden" (Layout-Umbruch eines Worts)
 *  "Alsbach-\nHähnlein" → "Alsbach-Hähnlein" (echter Compound-Bindestrich)
 *  "Anspruchs-\nund" → "Anspruchs- und" (Compound mit Konnektiv → Bindestrich bleibt)
 *  Heuristik: Folgt ein Bindewort (und/oder/bzw/sowie), bleibt der Bindestrich;
 *  bei Kleinbuchstabe verschmilzt das Wort; bei Großbuchstabe bleibt Bindestrich. */
const COMPOUND_CONNECTORS = new Set(["und", "oder", "bzw.", "bzw", "sowie", "als", "zur", "zum"]);

function joinHyphenBreaks(s: string): string {
  return s.replace(/(\w)-\s+(\S+)/g, (_, before: string, after: string) => {
    const firstWord = after.match(/^[\wäöüÄÖÜß]+/)?.[0] ?? "";
    if (COMPOUND_CONNECTORS.has(firstWord)) return `${before}- ${after}`;
    if (/^[A-ZÄÖÜ]/.test(after)) return `${before}-${after}`;
    return `${before}${after}`;
  });
}

/** Parst eine einzelne Petitions-Zeile in (Aktenzeichen, PLZ, Ort, Sachgebiet).
 *  Erwartet die rohen Zeilen eines Petitions-Blocks. */
function parsePetitionRow(blockLines: string[]): PetitionRow | null {
  if (blockLines.length === 0) return null;

  // Erste Zeile: "<LfdNr> Pet <prefix>" — AZ-Prefix
  const headerMatch = blockLines[0].match(/^\s*(\d+)\s+(Pet\s+[\d\w/-]+?)(-)?$/);
  if (!headerMatch) return null;
  const lfdNr = parseInt(headerMatch[1], 10);
  let azPrefix = headerMatch[2].trim();
  const endsHyphen = !!headerMatch[3];

  // Wenn Prefix mit Bindestrich endet, kommt der Suffix in nächster Zeile
  let aktenzeichen: string;
  let restStart = 1;
  if (endsHyphen) {
    const suffix = blockLines[1]?.trim();
    if (suffix && /^\d+$/.test(suffix)) {
      aktenzeichen = `${azPrefix}-${suffix}`;
      restStart = 2;
    } else {
      // Fallback: nimm Prefix ohne Bindestrich
      aktenzeichen = azPrefix;
      restStart = 1;
    }
  } else {
    aktenzeichen = azPrefix;
  }

  // Rest: PLZ + Ort + Sachgebiet (linearisiert über mehrere Zeilen)
  const restRaw = blockLines.slice(restStart).join(" ");
  const restJoined = joinHyphenBreaks(restRaw).replace(/\s+/g, " ").trim();

  // PLZ-Match: 5-stellige Zahl oder Sonderfall (Land/„ohne Ortsangabe")
  let plz: string | null = null;
  let orWohnsitz = restJoined;
  const plzMatch = restJoined.match(/^(\d{5})\s+(.+)$/);
  if (plzMatch) {
    plz = plzMatch[1];
    orWohnsitz = plzMatch[2];
  }

  // Spezialfall: "ohne Ortsangabe" → Ort, Sachgebiet beginnt ab Token 2.
  if (/^ohne\s+Ortsangabe\b/i.test(orWohnsitz)) {
    const rest = orWohnsitz.replace(/^ohne\s+Ortsangabe\s*/i, "");
    return { lfd_nr: lfdNr, aktenzeichen, plz, ort: "ohne Ortsangabe", sachgebiet: rest.trim() };
  }

  // Ort und Sachgebiet aufteilen: scan token-by-token. Erstes Token ist
  // immer Teil des Ortes. Weitere Tokens werden zum Ort gezählt, solange
  // sie wie Ort-Fortsätze aussehen; sonst beginnen sie das Sachgebiet.
  const tokens = orWohnsitz.split(/\s+/);
  const ortTokens: string[] = [];
  let sachgebietStart = -1;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i === 0) {
      ortTokens.push(t);
      // Bei "Bad", "Sankt" etc. ist der nächste Token zwangsläufig auch Ort.
      if (ORT_PREFIX_TOKENS.has(t) && tokens.length > 1) {
        ortTokens.push(tokens[++i]);
      }
      continue;
    }
    // Sachgebiet beginnt: Token ist eindeutiger Sachgebiet-Starter
    if (looksLikeSachgebiet(t)) {
      sachgebietStart = i;
      break;
    }
    // Ort-Fortsetzung: klein anfangende Bindewörter, Klammern, Bindestrich
    const prev = i > 0 ? tokens[i - 1] : null;
    if (isOrtContinuation(t, prev)) {
      ortTokens.push(t);
      continue;
    }
    // Wenn das vorherige Token eine Continuation war (z.B. „der", „an", „im"),
    // ist das aktuelle Token zwangsläufig noch Teil des Orts-Suffix
    // („Schwarzenbach an der Saale" → „Saale" gehört zum Ort).
    if (prev && ORT_CONTINUATION_TOKENS.has(prev)) {
      ortTokens.push(t);
      continue;
    }
    // Standardfall: bei großgeschriebenem Token, das nicht typischer
    // Ort-Suffix ist → Sachgebiet startet hier
    if (/^[A-ZÄÖÜ]/.test(t)) {
      sachgebietStart = i;
      break;
    }
    // Sonst: noch zum Ort
    ortTokens.push(t);
  }

  const ort = ortTokens.join(" ").trim();
  const sachgebiet = sachgebietStart >= 0
    ? tokens.slice(sachgebietStart).join(" ").trim()
    : "";

  return { lfd_nr: lfdNr, aktenzeichen, plz, ort, sachgebiet };
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

  // Vor dem Splitten: entferne pdf-parse-Page-Marker ("-- N of M --") und
  // Seiten-Header/-Footer (Drucksache X/Y, Deutscher Bundestag…), die innerhalb
  // einer Petitions-Zeile als Müll-Tokens auftauchen würden.
  const cleaned = text
    .replace(/^-- \d+ of \d+ --\s*$/gm, "")
    .replace(/^Drucksache\s+\d+\/\d+\s*[–-].*$/gm, "")
    .replace(/^Deutscher\s+Bundestag\s*[–-]\s*\d+\.\s*Wahlperiode.*$/gm, "")
    .replace(/^Lfd\.\s*$/gm, "")
    .replace(/^Nr\.\s*$/gm, "")
    .replace(/^Aktenzeichen der\s*$/gm, "")
    .replace(/^Eingabe\s*$/gm, "")
    .replace(/^Wohnsitz des\s*$/gm, "")
    .replace(/^Einsenders\s*$/gm, "")
    .replace(/^Inhalt der Eingabe\s*$/gm, "—INHALT-MARKER—")  // Marker für Sub-Header-Erkennung
    .replace(/^Wohnsitz des Einsenders Inhalt der Eingabe\s*$/gm, "—INHALT-MARKER—");

  // Walk durch alle BE-Header-Matches und sortiere Blöcke:
  //  - "Beschlussempfehlung\n<Nr>"           → neue BE mit dieser Nummer
  //  - "Beschlussempfehlung\n<Text>"          → neue BE (Layout-C, anonym); implicitCounter
  //  - "noch Beschlussempfehlung"            → Fortsetzung der letzten BE
  //  - Cover-Header (gefolgt von "des Petitionsausschusses") → skip
  const headerRe = /(?:^|\n)\s*(noch\s+)?Beschlussempfehlung(?:\s+(\d+))?\s*\n/gi;
  const blocksByNumber = new Map<number, string[]>();
  const blockOrder: number[] = [];
  let lastBeNr: number | null = null;
  let implicitCounter = 1;
  let lastIdx = -1;
  let m: RegExpExecArray | null;
  const headers: Array<{ idx: number; endIdx: number; nochFlag: boolean; nr: number | null }> = [];
  while ((m = headerRe.exec(cleaned)) !== null) {
    const noch = !!m[1];
    const nrCap = m[2];
    const nr = nrCap ? parseInt(nrCap, 10) : null;
    headers.push({ idx: m.index, endIdx: m.index + m[0].length, nochFlag: noch, nr });
  }
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const bodyEnd = i + 1 < headers.length ? headers[i + 1].idx : cleaned.length;
    const body = cleaned.slice(h.endIdx, bodyEnd);
    // Cover-Header? Direkt nach diesem Header steht "des Petitionsausschusses"
    if (/^\s*des Petitionsausschusses/i.test(body)) continue;
    let beNr: number;
    if (h.nochFlag) {
      // Fortsetzung der letzten BE
      beNr = lastBeNr ?? 1;
    } else if (h.nr !== null) {
      beNr = h.nr;
    } else {
      beNr = implicitCounter++;
    }
    if (!blocksByNumber.has(beNr)) {
      blocksByNumber.set(beNr, []);
      blockOrder.push(beNr);
    }
    blocksByNumber.get(beNr)!.push(body);
    lastBeNr = beNr;
  }

  const beschlussempfehlungen: SammeluebersichtDetails["beschlussempfehlungen"] = [];
  let totalPetitionen = 0;
  const themenGlobal = new Map<string, number>();

  for (const beNr of blockOrder) {
    const bodies = blocksByNumber.get(beNr)!;
    const body = bodies.join("\n");
    // Aktion: alles bis zur ersten Tabelle/Lfd-Nr/Inhalt-Marker.
    const aktionMatch = body.match(/^([\s\S]{0,500}?)(?=\n\s*(?:Lfd\.|—INHALT-MARKER—|\d+\s+Pet\s|$))/);
    const aktion = (aktionMatch?.[1] ?? "")
      .replace(/—INHALT-MARKER—/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);

    // Layout-B/C-Variante: Sammelübersichten haben einen oder mehrere
    // SUB-HEADER (gemeinsames Sachgebiet pro Petitions-Gruppe). Wir finden
    // ALLE `—INHALT-MARKER—`-Positionen und ordnen pro Petition den zuletzt
    // gesehenen Sub-Header zu. Sub-Header steht direkt nach Marker bis zur
    // ersten <N> Pet-Zeile oder zum nächsten Block-Marker.
    type SubHeader = { idx: number; text: string };
    const subHeaders: SubHeader[] = [];
    const markerRe = /—INHALT-MARKER—/g;
    let mm: RegExpExecArray | null;
    while ((mm = markerRe.exec(body)) !== null) {
      const after = body.slice(mm.index + "—INHALT-MARKER—".length);
      const lines = after.split("\n").map((l) => l.trim()).filter(Boolean);
      const headerLines: string[] = [];
      for (const l of lines) {
        if (/^\d+\s+Pet\s/.test(l)) break;
        if (/^(?:Lfd\.|Nr\.|Aktenzeichen|Eingabe|Wohnsitz|Einsenders|noch\s+Beschluss|Beschlussempfehlung|Inhalt der Eingabe|—INHALT-MARKER—)/i.test(l)) continue;
        headerLines.push(l);
        if (headerLines.length >= 3) break;
      }
      if (headerLines.length > 0) {
        const joined = joinHyphenBreaks(headerLines.join(" ")).replace(/\s+/g, " ").trim();
        if (joined && joined.length > 3 && !PETITION_NOISE.has(joined)) {
          subHeaders.push({ idx: mm.index, text: joined });
        }
      }
    }

    // Hilfsfunktion: finde den Sub-Header, der zuletzt VOR der Petition stand.
    function subHeaderForOffset(off: number): string | null {
      let result: string | null = null;
      for (const sh of subHeaders) {
        if (sh.idx < off) result = sh.text;
        else break;
      }
      return result;
    }

    // Splitte am "<N> Pet "-Token in einzelne Petitions-Blöcke.
    // WICHTIG: Wir behalten die Marker-Positionen für die Sub-Header-Zuordnung,
    // entfernen aber sie aus dem Block-Body damit sie nicht ins Sachgebiet leaken.
    const petBlockRegex = /^\s*\d+\s+Pet\s/gm;
    const petBlocks: Array<{ block: string; offset: number }> = [];
    const matches: number[] = [];
    let pbMatch: RegExpExecArray | null;
    while ((pbMatch = petBlockRegex.exec(body)) !== null) {
      matches.push(pbMatch.index);
    }
    for (let mi = 0; mi < matches.length; mi++) {
      const start = matches[mi];
      const end = mi + 1 < matches.length ? matches[mi + 1] : body.length;
      let rawBlock = body.slice(start, end);
      // Schneide vor dem nächsten Sub-Header-Marker ab — der gehört zur NÄCHSTEN
      // Petitionsgruppe, nicht mehr zu dieser Petition.
      const markerIdx = rawBlock.indexOf("—INHALT-MARKER—");
      if (markerIdx >= 0) rawBlock = rawBlock.slice(0, markerIdx);
      petBlocks.push({ block: rawBlock, offset: start });
    }
    const petitionen: PetitionRow[] = [];
    const themenInThisBe = new Map<string, number>();

    for (const pb of petBlocks) {
      const lines = pb.block.split("\n").map((l) => l.trim()).filter(Boolean);
      // Schneide bei Sub-Header-Markern oder Section-Brüchen ab.
      const cutAt = lines.findIndex((l, idx) => idx > 0 && (
        /^(?:noch\s+)?Beschlussempfehlung\s+\d+/i.test(l) ||
        /^Berlin,\s*den/.test(l) ||
        /^Gesamtherstellung/.test(l)
      ));
      const blockLines = cutAt > 0 ? lines.slice(0, cutAt) : lines;
      const row = parsePetitionRow(blockLines);
      if (row) {
        // Fallback: wenn die Petition kein Sachgebiet in der Zeile hatte,
        // benutze den zuletzt gesehenen Sub-Header vor dieser Petition.
        if (!row.sachgebiet) {
          const sh = subHeaderForOffset(pb.offset);
          if (sh) row.sachgebiet = sh;
        }
        petitionen.push(row);
        if (row.sachgebiet) {
          themenInThisBe.set(row.sachgebiet, (themenInThisBe.get(row.sachgebiet) ?? 0) + 1);
          themenGlobal.set(row.sachgebiet, (themenGlobal.get(row.sachgebiet) ?? 0) + 1);
        }
      }
    }

    totalPetitionen += petitionen.length;

    const themen = Array.from(themenInThisBe.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([thema, count]) => ({ thema, count }));

    beschlussempfehlungen.push({
      nummer: beNr,
      aktion,
      petitionen_count: petitionen.length,
      themen,
      petitionen,
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
  const reparseSamm = argv.includes("--reparse-sammeluebersicht");

  // Worklist:
  //  (a) DIP-only DS (aus dip_ds_titles), die noch nicht in dip_ds_details sind
  //  (b) DS mit Boilerplate-Analyse, ebenfalls noch nicht in dip_ds_details
  //  (c) optional: alle bestehenden Sammelübersicht-Records re-parsen
  //      (--reparse-sammeluebersicht-Flag)
  let targetSql = `
    SELECT DISTINCT ds FROM (
      SELECT drucksache_nr AS ds FROM dip_ds_titles
      UNION ALL
      SELECT drucksache_nr AS ds FROM drucksache_analyses
        WHERE zusammenfassung LIKE 'Sammelübersicht%des Petitionsausschusses%'
    )
    WHERE ds NOT IN (SELECT drucksache_nr FROM dip_ds_details)
    ORDER BY ds
  `;
  if (reparseSamm) {
    targetSql = `
      SELECT DISTINCT ds FROM (
        SELECT drucksache_nr AS ds FROM dip_ds_titles
        UNION ALL
        SELECT drucksache_nr AS ds FROM drucksache_analyses
          WHERE zusammenfassung LIKE 'Sammelübersicht%des Petitionsausschusses%'
        UNION ALL
        SELECT drucksache_nr AS ds FROM dip_ds_details
          WHERE pattern = 'sammeluebersicht'
      )
      ORDER BY ds
    `;
  }
  const targets = db.prepare(targetSql).all() as Array<{ ds: string }>;

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
