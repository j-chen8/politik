/**
 * Backfill: für jede speech_summary die Quellen-Pointer aus den XML-Plenarprotokollen ziehen.
 *
 * Output je Summary:
 *   - rede_id (offizielle Bundestags-XML-ID, z.B. "ID21100100")
 *   - redner_id (Bundestags-Redner-ID, z.B. "11004662")
 *   - page_start, page_section (Druckseite + A/B/C/D)
 *   - original_text (Volltext der Rede aus XML, ungekürzt)
 *   - xml_source (Pfad zur XML-Datei)
 *   - model + prompt_version: best guess für Bestand ("groq-historical / v1-2025")
 *
 * Bei Fragestunde-Aggregaten (typ enthält "fragestunde", >10 Reden in Sitzung):
 *   - rede_ids = comma-separated Liste aller Reden des Sprechers in Sitzung
 *   - rede_id bleibt NULL
 *   - original_text = alle Reden konkateniert
 *
 * Match-Schlüssel: (xml-sitzung, speaker-lastname, position-in-rede-liste)
 *
 * Run: npx tsx scripts/backfill-speech-sources.ts [--limit N] [--dry]
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");
const HISTORICAL_MODEL = "groq:llama-3.3-70b-versatile|llama-4-scout-17b-16e-instruct";
const HISTORICAL_PROMPT_VERSION = "v1-2025";

const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;
const DRY = process.argv.includes("--dry");

// ── Name resolution (sync mit extract-speeches-xml.ts) ──

const NAME_OVERRIDES: Record<string, { lastName: string; fullName: string }> = {
  "Carsten Müller (Braunschweig)": { lastName: "Müller", fullName: "Carsten Müller" },
  "Dagmar Schmidt (Wetzlar)": { lastName: "Schmidt", fullName: "Dagmar Schmidt" },
  "Hubertus Heil (Peine)": { lastName: "Heil", fullName: "Hubertus Heil" },
  "Claudia Roth (Augsburg)": { lastName: "Roth", fullName: "Claudia Roth" },
  "Michael Brand (Fulda)": { lastName: "Brand", fullName: "Michael Brand" },
  "Mahmut Özdemir (Duisburg)": { lastName: "Özdemir", fullName: "Mahmut Özdemir" },
  "Stephan Mayer (Altötting)": { lastName: "Mayer", fullName: "Stephan Mayer" },
  "Beatrix von Storch": { lastName: "Storch", fullName: "Beatrix von Storch" },
  "Dr. Konstantin von Notz": { lastName: "Notz", fullName: "Dr. Konstantin von Notz" },
  "Ulrich von Zons": { lastName: "Zons", fullName: "Ulrich von Zons" },
  "Jan van Aken": { lastName: "Aken", fullName: "Jan van Aken" },
  "Sascha van Beek": { lastName: "Beek", fullName: "Sascha van Beek" },
  "Christoph de Vries": { lastName: "Vries", fullName: "Christoph de Vries" },
  "Catarina dos Santos-Wintz": { lastName: "Santos-Wintz", fullName: "Catarina dos Santos-Wintz" },
  "Reem Alabali Radovan": { lastName: "Alabali-Radovan", fullName: "Reem Alabali-Radovan" },
  "LisaSimone Fischer": { lastName: "Fischer", fullName: "Lisa-Simone Fischer" },
  "Aydan Özoğuz": { lastName: "Özoğuz", fullName: "Aydan Özoğuz" },
  "Cansu Özdemir": { lastName: "Özdemir", fullName: "Cansu Özdemir" },
  "Kassem Taher Saleh": { lastName: "Taher Saleh", fullName: "Kassem Taher Saleh" },
  "Maximilain Kneller": { lastName: "Kneller", fullName: "Maximilian Kneller" },
  "Mareike Lotte Wulf": { lastName: "Wulf", fullName: "Mareike Lotte Wulf" },
  "Sara Gambir": { lastName: "Gambir", fullName: "Sara Gambir" },
  "Andrew Mitchell": { lastName: "Mitchell", fullName: "Andrew Mitchell" },
};

function resolveNameForXml(speakerName: string): { lastName: string; fullName: string } {
  if (NAME_OVERRIDES[speakerName]) return NAME_OVERRIDES[speakerName];
  const cleaned = speakerName.replace(/\s*\(.*?\)\s*/g, "").trim();
  const parts = cleaned.split(/\s+/);
  return { lastName: parts[parts.length - 1], fullName: cleaned };
}

// ── XML Parsing ──

interface XmlRede {
  redeId: string;
  rednerId: string;
  vorname: string;
  nachname: string;
  partei: string | null;
  rolle: string | null;
  text: string;
  page: number | null;
  pageSection: string | null;
}

interface XmlSession {
  sitzung: number;
  datum: string;
  reden: XmlRede[];
}

function parseSession(xmlPath: string): XmlSession {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const sitzungMatch = xml.match(/sitzung-nr="(\d+)"/);
  const datumMatch = xml.match(/sitzung-datum="([^"]+)"/);
  const sitzung = sitzungMatch ? parseInt(sitzungMatch[1]) : 0;
  const datumRaw = datumMatch ? datumMatch[1] : "";
  const dp = datumRaw.split(".");
  const datum = dp.length === 3 ? `${dp[2]}-${dp[1]}-${dp[0]}` : "";

  // Build rid → page map from inhaltsverzeichnis (TOC)
  const ridToPage = new Map<string, { page: number; section: string }>();
  const xrefRe = /<xref[^>]*ref-type="rede"[^>]*rid="([^"]+)"[^>]*>([\s\S]*?)<\/xref>/g;
  let xm: RegExpExecArray | null;
  while ((xm = xrefRe.exec(xml)) !== null) {
    const rid = xm[1];
    const inner = xm[2];
    const seiteMatch = inner.match(/<seite>(\d+)<\/seite>\s*<seitenbereich>([A-D])<\/seitenbereich>/);
    if (seiteMatch && !ridToPage.has(rid)) {
      ridToPage.set(rid, { page: parseInt(seiteMatch[1], 10), section: seiteMatch[2] });
    }
  }

  // Iterate <rede> elements in document order
  const reden: XmlRede[] = [];
  const redeRe = /<rede id="([^"]+)">([\s\S]*?)<\/rede>/g;
  let rm: RegExpExecArray | null;
  while ((rm = redeRe.exec(xml)) !== null) {
    const redeId = rm[1];
    const content = rm[2];

    const rednerMatch = content.match(
      /<redner id="(\d+)"><name>(?:<titel>([^<]*)<\/titel>)?<vorname>([^<]+)<\/vorname><nachname>([^<]+)<\/nachname>(?:<fraktion>([^<]+)<\/fraktion>)?(?:<rolle><rolle_lang>([^<]+)<\/rolle_lang>)?/
    );
    if (!rednerMatch) continue;

    const rednerId = rednerMatch[1];
    const titel = rednerMatch[2] || "";
    const vorname = rednerMatch[3];
    const nachname = rednerMatch[4];
    const partei = rednerMatch[5] || null;
    const rolle = rednerMatch[6] || null;

    // Volltext: alle <p> sammeln, OHNE klasse="redner" (Header-Konkatenation),
    // ohne Beifall-/Zuruf-Klammern, unbeschnitten.
    const paragraphs: string[] = [];
    const pRe = /<p klasse="([^"]*)">([\s\S]*?)<\/p>/g;
    let pm: RegExpExecArray | null;
    while ((pm = pRe.exec(content)) !== null) {
      const klasse = pm[1];
      if (klasse === "redner") continue; // Header-Block überspringen
      const t = pm[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      if (t.startsWith("(Beifall") || t.startsWith("(Zuruf")) continue;
      paragraphs.push(t);
    }
    const text = paragraphs.join("\n");
    if (text.length < 20) continue;

    const pageInfo = ridToPage.get(redeId);
    reden.push({
      redeId,
      rednerId,
      vorname: titel ? `${titel} ${vorname}` : vorname,
      nachname,
      partei,
      rolle,
      text,
      page: pageInfo?.page ?? null,
      pageSection: pageInfo?.section ?? null,
    });
  }

  return { sitzung, datum, reden };
}

function matchesSpeaker(rede: XmlRede, lastName: string): boolean {
  return rede.nachname === lastName
    || rede.nachname.includes(lastName)
    || lastName.includes(rede.nachname);
}

// ── Main ──

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Cache: parse jede XML-Datei einmal
  const xmlFiles = fs.readdirSync(XML_DIR).filter((f) => f.endsWith(".xml")).sort();
  const sessions = new Map<number, XmlSession>();
  for (const f of xmlFiles) {
    const s = parseSession(path.join(XML_DIR, f));
    sessions.set(s.sitzung, s);
  }
  console.log(`Geladen: ${sessions.size} XML-Sitzungen, ${xmlFiles.length} Dateien`);

  // Fetch all summaries to backfill
  let rows = db.prepare(
    `SELECT id, speaker, sitzung, speech_index, typ, zusammenfassung, source_url
     FROM speech_summaries
     WHERE rede_id IS NULL AND rede_ids IS NULL
     ORDER BY sitzung, speaker, speech_index`
  ).all() as {
    id: number;
    speaker: string;
    sitzung: number;
    speech_index: number;
    typ: string | null;
    zusammenfassung: string | null;
    source_url: string | null;
  }[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} Summaries zu backfillen`);

  const update = db.prepare(
    `UPDATE speech_summaries SET
       rede_id = ?, rede_ids = ?, redner_id = ?,
       page_start = ?, page_section = ?, original_text = ?,
       xml_source = ?, model = ?, prompt_version = ?
     WHERE id = ?`
  );

  let single = 0, aggregate = 0, miss = 0, noSession = 0;
  const missingSamples: string[] = [];

  for (const r of rows) {
    const session = sessions.get(r.sitzung);
    if (!session) { noSession++; continue; }

    const { lastName } = resolveNameForXml(r.speaker);
    const myReden = session.reden.filter((rd) => matchesSpeaker(rd, lastName));

    if (myReden.length === 0) {
      miss++;
      if (missingSamples.length < 10) missingSamples.push(`${r.speaker} (sitzung ${r.sitzung})`);
      continue;
    }

    const isAggregate = (r.typ ?? "").toLowerCase().includes("fragestunde") || myReden.length > 10;

    if (isAggregate) {
      const allIds = myReden.map((rd) => rd.redeId).join(",");
      const fullText = myReden.map((rd) => `[${rd.redeId} S.${rd.page ?? "?"}]\n${rd.text}`).join("\n\n---\n\n");
      const firstRedner = myReden[0].rednerId;
      const firstPage = myReden[0].page;
      const firstSection = myReden[0].pageSection;
      if (!DRY) {
        update.run(
          null, allIds, firstRedner,
          firstPage, firstSection, fullText,
          `data/plenarprotokolle_xml/21${String(r.sitzung).padStart(3, "0")}.xml`,
          HISTORICAL_MODEL, HISTORICAL_PROMPT_VERSION,
          r.id
        );
      }
      aggregate++;
      continue;
    }

    const target = myReden[r.speech_index];
    if (!target) {
      miss++;
      if (missingSamples.length < 10) missingSamples.push(`${r.speaker} sitzung ${r.sitzung} idx ${r.speech_index} (only ${myReden.length} reden)`);
      continue;
    }

    if (!DRY) {
      update.run(
        target.redeId, null, target.rednerId,
        target.page, target.pageSection, target.text,
        `data/plenarprotokolle_xml/21${String(r.sitzung).padStart(3, "0")}.xml`,
        HISTORICAL_MODEL, HISTORICAL_PROMPT_VERSION,
        r.id
      );
    }
    single++;
  }

  console.log(`\n=== Ergebnis ===`);
  console.log(`  Einzel-Match:        ${single}`);
  console.log(`  Fragestunde-Aggregat: ${aggregate}`);
  console.log(`  Kein Match:           ${miss}`);
  console.log(`  XML-Sitzung fehlt:    ${noSession}`);
  if (miss > 0) {
    console.log(`\nUnmatched-Beispiele:`);
    for (const s of missingSamples) console.log(`  - ${s}`);
  }
  db.close();
}

main();
