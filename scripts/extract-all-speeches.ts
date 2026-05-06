/**
 * Vollständige Reden-Extraktion aus Plenar-XMLs.
 *
 * ERSETZT scripts/extract-speeches-xml.ts (das per-Speaker-Heuristiken nutzte).
 *
 * Prinzipien:
 *   - XML ist Single Source of Truth (kein Name-Matching, keine Heuristiken)
 *   - redner_id aus dem XML ist KANONISCH (Bundestags-eigene ID)
 *   - Pro <rede> mit MEHREREN Sprechern (Zwischenfragen) wird pro Sprecher
 *     ein eigener Eintrag (segment_index) erzeugt
 *   - Idempotent: UPSERT by (rede_id, segment_index)
 *   - Kein LLM, kein Halluzinations-Risiko
 *
 * Was wird in plenar_speeches geschrieben:
 *   - rede_id (XML)
 *   - segment_index (0 für ein-Sprecher-Reden, 0..N für Zwischenfragen)
 *   - redner_id (XML, FK auf politicians.bt_redner_id)
 *   - original_text (alle Sprech-Absätze des Sprechers, in Reihenfolge)
 *   - kommentare (JSON-Array: Beifall, Zwischenrufe in Reihenfolge)
 *   - speaker, party, role (denormalisiert für direktes Display)
 *   - topic_number, topic_title (vom umgebenden <tagesordnungspunkt>)
 *   - speech_index (Reihenfolge innerhalb der Sitzung)
 *   - xml_source, extracted_at (Audit-Trail)
 *
 * Run: npx tsx scripts/extract-all-speeches.ts [--clean]
 *   --clean: löscht alle existierenden Einträge zuerst (Vollrebuild)
 *
 * Bei normalem Run werden nur fehlende rede_id/segment_index-Kombinationen
 * angelegt (idempotent).
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");
const REPORT_PATH = path.join(
  process.cwd(),
  "scripts/extract-all-speeches.report.json",
);

const CLEAN = process.argv.includes("--clean");

// ── Hilfs-Parser ──

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string): string {
  return decodeXmlEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

interface SessionMeta {
  wahlperiode: number;
  sitzung: number;
  datum: string | null; // ISO YYYY-MM-DD
}

function parseSessionMeta(xml: string): SessionMeta | null {
  // Root-Element: <dbtplenarprotokoll wahlperiode="21" sitzung-nr="75" sitzung-datum="TT.MM.JJJJ" …>
  const rootM = xml.match(/<dbtplenarprotokoll\s+([^>]+)>/);
  if (!rootM) return null;
  const attrs = rootM[1];
  const wpM = attrs.match(/wahlperiode="(\d+)"/);
  const sitzM = attrs.match(/sitzung-nr="(\d+)"/);
  if (!wpM || !sitzM) return null;
  const dateM = attrs.match(/sitzung-datum="(\d{2})\.(\d{2})\.(\d{4})"/);
  const datum = dateM ? `${dateM[3]}-${dateM[2]}-${dateM[1]}` : null;
  return {
    wahlperiode: parseInt(wpM[1]),
    sitzung: parseInt(sitzM[1]),
    datum,
  };
}

interface TopBlock {
  topIdRaw: string; // "Tagesordnungspunkt 6", "Zusatzpunkt 11"
  topNumber: string; // numerischer Teil oder Roh-Form
  title: string; // Beschreibungs-Text
  content: string; // innerer XML-Text dieser TOP
}

function parseTops(xml: string): TopBlock[] {
  // tagesordnungspunkt-Blöcke (auch mit zusatzpunkt) — beide erscheinen mit top-id
  const re = /<tagesordnungspunkt\s+top-id="([^"]+)">([\s\S]*?)<\/tagesordnungspunkt>/g;
  const out: TopBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const topIdRaw = m[1];
    const content = m[2];
    // Topic-Nummer extrahieren — grob "Tagesordnungspunkt 6" → "6", "Zusatzpunkt 11" → "ZP 11"
    let topNumber = topIdRaw;
    const numM = topIdRaw.match(/Tagesordnungspunkt\s+(\S+)/i);
    if (numM) topNumber = numM[1];
    const zpM = topIdRaw.match(/Zusatzpunkt\s+(\S+)/i);
    if (zpM) topNumber = `ZP ${zpM[1]}`;

    // Erste T_NaS-Zeile als Title-Hint
    let title = "";
    const tnasM = content.match(/<p\s+klasse="T_NaS"[^>]*>([\s\S]*?)<\/p>/);
    if (tnasM) {
      title = stripTags(tnasM[1])
        .replace(/^[\s\d\)a-z]+(–\s*)?/, "") // "6 a) – " entfernen
        .trim();
    }
    if (!title) {
      // Fallback: erste klasse="J"-Zeile, falls aussagekräftig
      const jM = content.match(/<p\s+klasse="J"[^>]*>([\s\S]*?)<\/p>/);
      if (jM) {
        const t = stripTags(jM[1]);
        if (!/^Ich rufe auf/i.test(t)) title = t.slice(0, 250);
      }
    }
    out.push({ topIdRaw, topNumber, title, content });
  }
  return out;
}

interface SpeechSegment {
  rede_id: string;
  segment_index: number;
  redner_id: string;
  speaker_full: string; // "Vorname Nachname"
  party: string;
  role: string;
  original_text: string;
  kommentare: string[]; // Liste der Beifall/Zwischenrufe
  page_start: string | null; // erste Seitenzahl in dem Abschnitt
}

function parseRede(redeContent: string, redeId: string): SpeechSegment[] {
  // Wir splitten den rede-Inhalt an <p klasse="redner">-Markern.
  // Jeder Marker startet einen neuen Sprecher-Abschnitt.
  // Vor dem ersten Marker liegender Inhalt wird ignoriert (Header/Empty).
  const markerRe = /<p\s+klasse="redner"[^>]*>([\s\S]*?)<\/p>/g;
  const matches: { start: number; end: number; rednerInfo: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = markerRe.exec(redeContent)) !== null) {
    matches.push({ start: m.index, end: markerRe.lastIndex, rednerInfo: m[1] });
  }
  if (matches.length === 0) return [];

  const segments: SpeechSegment[] = [];
  for (let i = 0; i < matches.length; i++) {
    const segStart = matches[i].end;
    const segEnd = i + 1 < matches.length ? matches[i + 1].start : redeContent.length;
    const segContent = redeContent.slice(segStart, segEnd);

    // Aus rednerInfo: <a id="r36"/><redner id="..."><name>...</name></redner>Vorname Nachname (Fraktion):
    const idM = matches[i].rednerInfo.match(/<redner\s+id="(\w+)">/);
    if (!idM) continue;
    const rednerId = idM[1];

    const vornameM = matches[i].rednerInfo.match(/<vorname>([^<]*)<\/vorname>/);
    const nachnameM = matches[i].rednerInfo.match(/<nachname>([^<]*)<\/nachname>/);
    const titelM = matches[i].rednerInfo.match(/<titel>([^<]*)<\/titel>/);
    const fraktionM = matches[i].rednerInfo.match(/<fraktion>([^<]*)<\/fraktion>/);
    const rolleM = matches[i].rednerInfo.match(
      /<rolle>[\s\S]*?<rolle_lang>([^<]+)<\/rolle_lang>/,
    );

    const titel = titelM ? decodeXmlEntities(titelM[1]).trim() : "";
    const vorname = vornameM ? decodeXmlEntities(vornameM[1]).trim() : "";
    const nachname = nachnameM ? decodeXmlEntities(nachnameM[1]).trim() : "";
    const speaker_full = [titel, vorname, nachname].filter((x) => x).join(" ");

    // Extrahiere Sprech-Absätze (klasse J*|O) und kommentare
    // Reihenfolge wichtig — wir scannen linear und sammeln je nach Tag-Typ
    const tokenRe =
      /<(p|kommentar|name)\s*(?:klasse="([^"]*)")?[^>]*>([\s\S]*?)<\/(?:p|kommentar|name)>/g;
    const textParts: string[] = [];
    const kommentare: string[] = [];
    let t: RegExpExecArray | null;
    let pageStart: string | null = null;
    while ((t = tokenRe.exec(segContent)) !== null) {
      const tag = t[1];
      const klasse = t[2] || "";
      const inner = t[3];
      if (tag === "p") {
        if (klasse === "redner") continue; // Marker — bereits konsumiert
        // alle anderen p-Klassen sind Sprech-Text (J, J_1, O, etc.)
        const text = stripTags(inner);
        if (text) textParts.push(text);
      } else if (tag === "kommentar") {
        const c = stripTags(inner);
        if (c) kommentare.push(c);
      }
      // <name>...</name> ist Präsidium-Annotation, ignorieren
    }

    if (textParts.length === 0) continue; // Sprecher hat im Segment nichts gesagt

    // Wenn der vorige Sprecher derselbe ist (Admin-Unterbrechung durch
    // Präsidium, Redezeit-Hinweis etc.), MERGE statt neuem Segment.
    const prev = segments[segments.length - 1];
    if (prev && prev.redner_id === rednerId) {
      prev.original_text += "\n" + textParts.join("\n");
      prev.kommentare.push(...kommentare);
      continue;
    }

    segments.push({
      rede_id: redeId,
      segment_index: segments.length,
      redner_id: rednerId,
      speaker_full,
      party: fraktionM ? decodeXmlEntities(fraktionM[1]).trim() : "",
      role: rolleM ? decodeXmlEntities(rolleM[1]).trim() : "",
      original_text: textParts.join("\n"),
      kommentare,
      page_start: pageStart,
    });
  }
  return segments;
}

interface RedeBlock {
  redeId: string;
  content: string;
}

function parseRedesInTop(topContent: string): RedeBlock[] {
  const re = /<rede\s+id="(\w+)">([\s\S]*?)<\/rede>/g;
  const out: RedeBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(topContent)) !== null) {
    out.push({ redeId: m[1], content: m[2] });
  }
  return out;
}

// ── Main ──

function main() {
  console.log("=== extract-all-speeches ===\n");
  const fetchedAt = new Date().toISOString();

  const xmlFiles = fs
    .readdirSync(XML_DIR)
    .filter((f) => f.endsWith(".xml"))
    .sort();
  console.log(`Quellen: ${xmlFiles.length} XMLs in ${XML_DIR}\n`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF"); // wir kümmern uns selbst um topic_id-Verknüpfung

  // Sessions-Lookup (sitzung → session_id)
  const sessionsRows = db
    .prepare("SELECT id, wahlperiode, sitzung FROM plenar_sessions WHERE wahlperiode=21")
    .all() as { id: number; wahlperiode: number; sitzung: number }[];
  const sessionIdBySitzung = new Map(sessionsRows.map((s) => [s.sitzung, s.id]));

  if (CLEAN) {
    console.log("--clean: lösche bestehende plenar_speeches und plenar_topics …\n");
    db.exec("DELETE FROM plenar_speeches; DELETE FROM plenar_topics;");
  }

  const insertTop = db.prepare(`
    INSERT INTO plenar_topics (session_id, topic_number, title, top_id_raw, xml_source, extracted_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, topic_number) DO UPDATE SET
      title = excluded.title,
      top_id_raw = excluded.top_id_raw,
      xml_source = excluded.xml_source,
      extracted_at = excluded.extracted_at
  `);

  const findTopId = db.prepare(`
    SELECT id FROM plenar_topics WHERE session_id=? AND topic_number=?
  `);

  const insertSpeech = db.prepare(`
    INSERT INTO plenar_speeches (
      session_id, speaker, party, role, topic_number, topic_title, page_ref,
      rede_id, segment_index, redner_id, topic_id,
      original_text, kommentare, speech_index, page_start, page_section,
      xml_source, extracted_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(rede_id, segment_index) DO UPDATE SET
      session_id = excluded.session_id,
      speaker = excluded.speaker,
      party = excluded.party,
      role = excluded.role,
      topic_number = excluded.topic_number,
      topic_title = excluded.topic_title,
      redner_id = excluded.redner_id,
      topic_id = excluded.topic_id,
      original_text = excluded.original_text,
      kommentare = excluded.kommentare,
      speech_index = excluded.speech_index,
      xml_source = excluded.xml_source,
      extracted_at = excluded.extracted_at
  `);

  let totalTopics = 0;
  let totalSpeeches = 0;
  let skippedNoSession = 0;
  const stats: { sitzung: number; tops: number; reden: number; segs: number }[] = [];

  for (const f of xmlFiles) {
    const xml = fs.readFileSync(path.join(XML_DIR, f), "utf-8");
    const meta = parseSessionMeta(xml);
    if (!meta) {
      console.log(`  ${f}: kein Meta gefunden, übersprungen`);
      continue;
    }
    const sessionId = sessionIdBySitzung.get(meta.sitzung);
    if (!sessionId) {
      console.log(`  ${f}: Sitzung ${meta.sitzung} nicht in plenar_sessions, skip`);
      skippedNoSession++;
      continue;
    }

    const tops = parseTops(xml);
    let speechIndexInSession = 0;
    let topsInSession = 0;
    let redenInSession = 0;
    let segsInSession = 0;

    const tx = db.transaction(() => {
      for (const top of tops) {
        insertTop.run(
          sessionId,
          top.topNumber,
          top.title,
          top.topIdRaw,
          f,
          fetchedAt,
        );
        const topRow = findTopId.get(sessionId, top.topNumber) as
          | { id: number }
          | undefined;
        const topicId = topRow?.id ?? null;
        topsInSession++;

        const reden = parseRedesInTop(top.content);
        for (const rede of reden) {
          redenInSession++;
          const segments = parseRede(rede.content, rede.redeId);
          for (const seg of segments) {
            insertSpeech.run(
              sessionId,
              seg.speaker_full,
              seg.party,
              seg.role,
              top.topNumber,
              top.title,
              null, // page_ref (legacy, not used)
              seg.rede_id,
              seg.segment_index,
              seg.redner_id,
              topicId,
              seg.original_text,
              JSON.stringify(seg.kommentare),
              speechIndexInSession++,
              seg.page_start,
              null,
              f,
              fetchedAt,
            );
            segsInSession++;
          }
        }
      }
    });
    tx();

    totalTopics += topsInSession;
    totalSpeeches += segsInSession;
    stats.push({
      sitzung: meta.sitzung,
      tops: topsInSession,
      reden: redenInSession,
      segs: segsInSession,
    });
    process.stdout.write(
      `  ${f}: ${topsInSession} TOPs, ${redenInSession} Reden, ${segsInSession} Segmente${redenInSession !== segsInSession ? ` (${segsInSession - redenInSession} Zwischenfragen)` : ""}\n`,
    );
  }

  console.log(`\n=== Total ===`);
  console.log(`  Topics:   ${totalTopics}`);
  console.log(`  Segments: ${totalSpeeches}`);
  console.log(`  Sessions skipped (kein DB-Eintrag): ${skippedNoSession}`);

  fs.writeFileSync(
    REPORT_PATH,
    JSON.stringify({ totalTopics, totalSpeeches, stats }, null, 2),
  );
  console.log(`\nReport: ${REPORT_PATH}`);

  db.close();
}

main();
