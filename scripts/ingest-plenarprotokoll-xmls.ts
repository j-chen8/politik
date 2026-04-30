/**
 * Ingestiert NEUE Plenarprotokoll-XMLs ohne LLM-Summary.
 *
 * Für jede XML, die noch nicht in plenar_sessions ist:
 *   - plenar_sessions-Eintrag anlegen
 *   - alle <rede>-Elemente in plenar_speeches und speech_summaries einfügen
 *   - speech_summaries.zusammenfassung bleibt NULL (LLM-Summary kann später)
 *   - rede_id, redner_id, page, original_text, xml_source werden direkt geschrieben
 *
 * Anschließend kann backfill-speaker-politician-links.ts die neuen Speaker verlinken.
 *
 * Run: npx tsx scripts/ingest-plenarprotokoll-xmls.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");

interface RedeData {
  redeId: string;
  rednerId: string;
  speaker: string;
  party: string | null;
  role: string | null;
  text: string;
  page: number | null;
  pageSection: string | null;
  topicNumber: string | null;
  topicTitle: string | null;
}

function parseSession(xmlPath: string): { sitzung: number; datum: string; reden: RedeData[] } | null {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const sitzungMatch = xml.match(/sitzung-nr="(\d+)"/);
  const datumMatch = xml.match(/sitzung-datum="([^"]+)"/);
  if (!sitzungMatch || !datumMatch) return null;
  const sitzung = parseInt(sitzungMatch[1], 10);
  const dp = datumMatch[1].split(".");
  const datum = dp.length === 3 ? `${dp[2]}-${dp[1]}-${dp[0]}` : "";

  // TOC: rid → { page, section }
  const ridToPage = new Map<string, { page: number; section: string }>();
  const xrefRe = /<xref[^>]*ref-type="rede"[^>]*rid="([^"]+)"[^>]*>([\s\S]*?)<\/xref>/g;
  let xm: RegExpExecArray | null;
  while ((xm = xrefRe.exec(xml)) !== null) {
    const m = xm[2].match(/<seite>(\d+)<\/seite>\s*<seitenbereich>([A-D])<\/seitenbereich>/);
    if (m && !ridToPage.has(xm[1])) {
      ridToPage.set(xm[1], { page: parseInt(m[1], 10), section: m[2] });
    }
  }

  // Tagesordnungspunkte erfassen — letzter <tagesordnungspunkt> vor jeder rede
  // (für topic_number / topic_title)
  // Vereinfacht: wir lesen die Reden in Reihenfolge und bauen per-State-Verfolgung mit ein
  const reden: RedeData[] = [];
  // current TOP context
  let currentTopNr: string | null = null;
  let currentTopTitle: string | null = null;

  // Iteriere Document linear: <tagesordnungspunkt top-id="..."> oder <rede id="...">
  const blockRe = /<(?:tagesordnungspunkt|rede)\s[^>]*>([\s\S]*?)<\/(?:tagesordnungspunkt|rede)>/g;
  // Das ist nicht perfekt für nested Tags — alternativ direkt via Marker.
  // Wir nutzen einen einfacheren Ansatz: TOP-Header parsen + Reden separat,
  // und matchen Reden zu TOPs via Position im Dokument.

  // Alle TOPs sammeln (mit Position)
  const tops: { pos: number; nr: string | null; title: string | null }[] = [];
  const topRe = /<tagesordnungspunkt\s[^>]*top-id="([^"]*)"[^>]*>([\s\S]*?)<\/tagesordnungspunkt>/g;
  let tm: RegExpExecArray | null;
  while ((tm = topRe.exec(xml)) !== null) {
    const titleMatch = tm[2].match(/<p\s+klasse="T_NaS"[^>]*>([^<]+)<\/p>|<p\s+klasse="T_(?:Drs|fett)"[^>]*>([^<]+)<\/p>/);
    tops.push({ pos: tm.index, nr: tm[1], title: titleMatch ? (titleMatch[1] || titleMatch[2] || "").trim() : null });
  }
  tops.sort((a, b) => a.pos - b.pos);

  function topAtPosition(pos: number): { nr: string | null; title: string | null } {
    let last = { nr: null as string | null, title: null as string | null };
    for (const t of tops) {
      if (t.pos > pos) break;
      last = { nr: t.nr, title: t.title };
    }
    return last;
  }

  // Reden parsen
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
    const partei = rednerMatch[5] ?? null;
    const rolle = rednerMatch[6] ?? null;
    const speakerName = (titel ? `${titel} ${vorname} ${nachname}` : `${vorname} ${nachname}`).replace(/\s+/g, " ").trim();

    // Volltext (ohne klasse="redner" Header, ohne Beifall-/Zuruf-Klammern)
    const paragraphs: string[] = [];
    const pRe = /<p klasse="([^"]*)">([\s\S]*?)<\/p>/g;
    let pm: RegExpExecArray | null;
    while ((pm = pRe.exec(content)) !== null) {
      if (pm[1] === "redner") continue;
      const t = pm[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      if (t.startsWith("(Beifall") || t.startsWith("(Zuruf")) continue;
      paragraphs.push(t);
    }
    const text = paragraphs.join("\n");
    if (text.length < 20) continue;

    const pi = ridToPage.get(redeId);
    const top = topAtPosition(rm.index);

    reden.push({
      redeId, rednerId, speaker: speakerName, party: partei, role: rolle, text,
      page: pi?.page ?? null, pageSection: pi?.section ?? null,
      topicNumber: top.nr, topicTitle: top.title,
    });
  }

  return { sitzung, datum, reden };
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const xmlFiles = fs.readdirSync(XML_DIR).filter((f) => f.endsWith(".xml")).sort();
  const existingSitzungen = new Set(
    (db.prepare("SELECT sitzung FROM plenar_sessions").all() as { sitzung: number }[]).map((r) => r.sitzung)
  );

  const newXmls = xmlFiles.filter((f) => {
    const m = f.match(/21(\d+)\.xml/);
    if (!m) return false;
    return !existingSitzungen.has(parseInt(m[1], 10));
  });
  console.log(`${newXmls.length} XML-Dateien zu ingestieren: ${newXmls.join(", ")}`);
  if (newXmls.length === 0) return;

  const insertSession = db.prepare(`
    INSERT INTO plenar_sessions (wahlperiode, sitzung, datum, source_url) VALUES (?, ?, ?, ?)
  `);
  const insertSpeech = db.prepare(`
    INSERT INTO plenar_speeches (session_id, speaker, party, role, topic_number, topic_title, page_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSummary = db.prepare(`
    INSERT INTO speech_summaries (
      speaker, sitzung, datum, speech_index, speech_text_preview,
      zusammenfassung, kontext, typ, source_url,
      rede_id, redner_id, page_start, page_section,
      original_text, xml_source, model, prompt_version, generated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let speeches = 0, summaries = 0, sessions = 0;

  for (const file of newXmls) {
    const session = parseSession(path.join(XML_DIR, file));
    if (!session) { console.log(`  ✗ ${file}: parse failed`); continue; }
    const padded = String(session.sitzung).padStart(3, "0");
    const sourceUrl = `https://dserver.bundestag.de/btp/21/21${padded}.pdf`;
    const insRes = insertSession.run(21, session.sitzung, session.datum, sourceUrl);
    const sessionId = insRes.lastInsertRowid as number;
    sessions++;

    // Pro Sprecher: speech_index in der Sitzung zählen
    const speakerCounter = new Map<string, number>();

    for (const r of session.reden) {
      // plenar_speeches
      insertSpeech.run(sessionId, r.speaker, r.party, r.role, r.topicNumber, r.topicTitle, `S.${r.page ?? "?"}${r.pageSection ?? ""}`);
      speeches++;

      // speech_summaries (ohne LLM-summary)
      const idx = speakerCounter.get(r.speaker) ?? 0;
      speakerCounter.set(r.speaker, idx + 1);
      insertSummary.run(
        r.speaker, session.sitzung, session.datum, idx,
        r.text.substring(0, 200),
        null, // zusammenfassung
        r.topicTitle, // kontext
        "debatte", // typ — Default, wird später eventuell von LLM angepasst
        sourceUrl,
        r.redeId, r.rednerId, r.page, r.pageSection,
        r.text, `data/plenarprotokolle_xml/21${padded}.xml`,
        null, // model: noch nicht generiert
        null, // prompt_version
        null, // generated_at
      );
      summaries++;
    }
    console.log(`  ✓ Sitzung ${session.sitzung} (${session.datum}): ${session.reden.length} Reden`);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Sessions: ${sessions}`);
  console.log(`  Plenar-Speeches: ${speeches}`);
  console.log(`  Speech-Summaries (ohne LLM): ${summaries}`);

  db.close();
}

main();
