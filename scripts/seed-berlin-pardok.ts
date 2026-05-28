/**
 * Berlin-Pilot Stufe 1 — PARDOK-XML-Ingest.
 *
 * Parst data/berlin/pardok-wp19.xml (Parlamentsspiegel-Export der 19. WP) in
 * die DB. Die XML enthält bereits die Personen-Zuordnung:
 *   - <Redner> in Plenarprotokollen  → "Nachname, Vorname (Partei)"
 *   - <Urheber> in Drucksachen       → einzelne MdL bei Schriftlichen Anfragen
 * → "wer hat wann wozu geredet / welche Anfrage gestellt" OHNE PDF, OHNE LLM.
 *
 * Schreibt: berlin_vorgaenge, berlin_documents, berlin_document_persons.
 * Voller Rebuild bei jedem Lauf (idempotent). Bundestag-Tabellen unberührt.
 *
 * Run: npx tsx scripts/seed-berlin-pardok.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { XMLParser } from "fast-xml-parser";

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_PATH = path.join(process.cwd(), "data/berlin/pardok-wp19.xml");
const BERLIN_PARLIAMENT_ID_LOCAL = 2;

// ── Namens-Helfer (wie in den anderen Berlin-Skripten) ──

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripLeadingTitles(name: string): string {
  return name
    .replace(/^(?:(?:Prof\.|Dr\.|Dipl\.[A-Za-zÄÖÜäöü-]*\.?|Mag\.|h\.c\.|MdB|MdL|MdA|MdEP)\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(d: string | null | undefined): string | null {
  if (!d) return null;
  const m = String(d).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/**
 * "Becker, Franziska (SPD)" → { first, last, party }; null bei Institutionen.
 * Einzelpersonen haben IMMER beides: ein "(Partei)"-Suffix UND ein Komma
 * (Nachname, Vorname). Institutionen ("Senatsverwaltung für Mobilität, Verkehr,
 * …", "Hauptausschuss") und Fraktionen ("Freie Demokratische Partei (FDP)")
 * erfüllen nie beide Bedingungen.
 */
function parsePersonName(raw: string): { first: string; last: string; party: string } | null {
  const s0 = raw.trim();
  const pm = s0.match(/\(([^)]+)\)\s*$/);
  if (!pm) return null; // kein (Partei)-Suffix → Institution
  const party = pm[1].trim();
  const s = s0.slice(0, pm.index).trim();
  if (!s.includes(",")) return null; // Fraktion ("Freie Demokratische Partei")
  const ci = s.indexOf(",");
  const last = s.slice(0, ci).trim();
  const first = stripLeadingTitles(s.slice(ci + 1).trim());
  if (!first || !last) return null;
  return { first, last, party };
}

// ── Politiker-Matcher ──

interface Local { id: number; first: string; last: string }

function buildMatcher(locals: Local[]) {
  const byFull = new Map<string, Local>();
  const byLast = new Map<string, Local[]>();
  for (const l of locals) {
    byFull.set(normalize(`${l.first} ${l.last}`), l);
    for (const w of normalize(l.last).split(" ")) {
      if (w) (byLast.get(w) ?? byLast.set(w, []).get(w)!).push(l);
    }
  }
  return (first: string, last: string): number | null => {
    const exact = byFull.get(normalize(`${first} ${last}`));
    if (exact) return exact.id;
    const fw = normalize(first).split(" ")[0];
    const seen = new Set<Local>();
    const cands: Local[] = [];
    for (const w of normalize(last).split(" ")) {
      for (const c of byLast.get(w) ?? []) {
        if (seen.has(c)) continue;
        if (normalize(c.first).split(" ")[0] === fw) { seen.add(c); cands.push(c); }
      }
    }
    return cands.length === 1 ? cands[0].id : null;
  };
}

// ── Schema ──

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS berlin_vorgaenge (
      vid TEXT PRIMARY KEY,
      vtyp TEXT, vtyp_label TEXT,
      vsys TEXT, vsys_label TEXT,
      titel TEXT
    );
    CREATE TABLE IF NOT EXISTS berlin_documents (
      dbid TEXT PRIMARY KEY,
      vorgang_id TEXT,
      wp INTEGER,
      dok_art TEXT, dok_art_label TEXT,
      dok_typ TEXT, dok_typ_label TEXT,
      dok_nr TEXT, nr_in_typ TEXT,
      titel TEXT, desk TEXT, abstract TEXT,
      dok_datum TEXT, seitenbereich TEXT,
      lok_url TEXT,
      pdf_path TEXT, full_text TEXT, text_extracted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_berlin_docs_vorgang ON berlin_documents(vorgang_id);
    CREATE INDEX IF NOT EXISTS idx_berlin_docs_art ON berlin_documents(dok_art);
    CREATE INDEX IF NOT EXISTS idx_berlin_docs_datum ON berlin_documents(dok_datum);
    -- dok_nr-Lookup (DS-Nr → dbid Auflösung in Reden/Votes): ohne Index Full-Scan
    -- über ~47k Rows pro Auflösung. getSitzungDetail löst dutzende DS pro Seite auf.
    CREATE INDEX IF NOT EXISTS idx_berlin_docs_dok_nr ON berlin_documents(dok_nr);
    CREATE TABLE IF NOT EXISTS berlin_document_persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dbid TEXT NOT NULL,
      role TEXT NOT NULL,
      raw_name TEXT NOT NULL,
      politician_id INTEGER,
      party TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_berlin_persons_pol ON berlin_document_persons(politician_id);
    CREATE INDEX IF NOT EXISTS idx_berlin_persons_dbid ON berlin_document_persons(dbid);
  `);
}

// ── XML laden ──

function str(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function loadVorgaenge(): any[] {
  const xml = fs.readFileSync(XML_PATH, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false, // alles als String — DokNr "19/0019" etc. nicht verfälschen
    trimValues: true,
    isArray: (name) => ["Vorgang", "Dokument", "Redner", "Urheber"].includes(name),
  });
  return parser.parse(xml)?.Export?.Vorgang ?? [];
}

// ── Main ──

function main() {
  if (!fs.existsSync(XML_PATH)) {
    console.error(`XML fehlt: ${XML_PATH}`);
    console.error(`→ curl -A "politik-radar/1.0" https://www.parlament-berlin.de/opendata/pardok-wp19.xml -o ${XML_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");
  ensureSchema(db);

  const locals = db.prepare(
    `SELECT p.id, p.first_name AS first, p.last_name AS last
     FROM politicians p
     JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     WHERE pp.parliament_id = ?`
  ).all(BERLIN_PARLIAMENT_ID_LOCAL) as Local[];
  const match = buildMatcher(locals);
  console.log(`${locals.length} Berliner MdL für Personen-Matching geladen`);

  console.log("→ PARDOK-XML parsen…");
  const vlist = loadVorgaenge();
  console.log(`  ${vlist.length} <Vorgang>-Knoten`);

  const vorgaenge: any[] = [];
  const documents: any[] = [];
  const persons: { dbid: string; role: string; raw_name: string; politician_id: number | null; party: string | null }[] = [];
  let skippedDelete = 0;

  function addPerson(dbid: string, role: string, raw: string) {
    const parsed = parsePersonName(raw);
    let pid = parsed ? match(parsed.first, parsed.last) : null;
    // PARDOK-Tippfehler: vereinzelt Reihenfolge vertauscht ("Katharina, Senge")
    if (parsed && pid === null) pid = match(parsed.last, parsed.first);
    persons.push({ dbid, role, raw_name: raw, politician_id: pid, party: parsed?.party ?? null });
  }

  for (const v of vlist) {
    if (str(v.VFunktion) === "delete") { skippedDelete++; continue; }
    const vid = str(v.VID) || str(v.VNr);
    if (!vid) continue;

    let vorgangTitel: string | null = null;
    for (const d of asArray<any>(v.Dokument)) {
      const dbid = str(d.DBID);
      if (!dbid) continue;
      const titel = str(d.Titel);
      if (titel && !vorgangTitel) vorgangTitel = titel;
      documents.push({
        dbid,
        vorgang_id: vid,
        wp: str(d.Wp) ? parseInt(str(d.Wp)!, 10) : null,
        dok_art: str(d.DokArt),
        dok_art_label: str(d.DokArtL),
        dok_typ: str(d.DokTyp),
        dok_typ_label: str(d.DokTypL),
        dok_nr: str(d.DokNr),
        nr_in_typ: str(d.NrInTyp),
        titel,
        desk: str(d.Desk),
        abstract: str(d.Abstract),
        dok_datum: parseDate(d.DokDat),
        seitenbereich: str(d.Sb),
        lok_url: str(d.LokURL),
      });
      for (const r of asArray<unknown>(d.Redner)) { const s = str(r); if (s) addPerson(dbid, "redner", s); }
      for (const u of asArray<unknown>(d.Urheber)) { const s = str(u); if (s) addPerson(dbid, "urheber", s); }
    }
    vorgaenge.push({
      vid,
      vtyp: str(v.VTyp), vtyp_label: str(v.VTypL),
      vsys: str(v.VSys), vsys_label: str(v.VSysL),
      titel: vorgangTitel,
    });
  }

  console.log(`  ${vorgaenge.length} Vorgänge, ${documents.length} Dokumente, ${persons.length} Personen-Einträge`);
  console.log(`  (${skippedDelete} delete-Marker übersprungen)`);

  const tx = db.transaction(() => {
    db.exec(`DELETE FROM berlin_document_persons; DELETE FROM berlin_documents; DELETE FROM berlin_vorgaenge;`);
    const iv = db.prepare(
      `INSERT OR REPLACE INTO berlin_vorgaenge (vid, vtyp, vtyp_label, vsys, vsys_label, titel)
       VALUES (@vid, @vtyp, @vtyp_label, @vsys, @vsys_label, @titel)`
    );
    for (const v of vorgaenge) iv.run(v);
    const idoc = db.prepare(
      `INSERT OR REPLACE INTO berlin_documents
        (dbid, vorgang_id, wp, dok_art, dok_art_label, dok_typ, dok_typ_label,
         dok_nr, nr_in_typ, titel, desk, abstract, dok_datum, seitenbereich, lok_url)
       VALUES
        (@dbid, @vorgang_id, @wp, @dok_art, @dok_art_label, @dok_typ, @dok_typ_label,
         @dok_nr, @nr_in_typ, @titel, @desk, @abstract, @dok_datum, @seitenbereich, @lok_url)`
    );
    for (const d of documents) idoc.run(d);
    const ip = db.prepare(
      `INSERT INTO berlin_document_persons (dbid, role, raw_name, politician_id, party)
       VALUES (@dbid, @role, @raw_name, @politician_id, @party)`
    );
    for (const p of persons) ip.run(p);
  });
  tx();

  const totalRedner = persons.filter((p) => p.role === "redner").length;
  const matchedRedner = persons.filter((p) => p.role === "redner" && p.politician_id).length;
  const personUrheber = persons.filter((p) => p.role === "urheber" && parsePersonName(p.raw_name)).length;
  const matchedUrheber = persons.filter((p) => p.role === "urheber" && p.politician_id).length;
  const polWithDocs = new Set(persons.filter((p) => p.politician_id).map((p) => p.politician_id)).size;

  console.log(`\n=== Fertig ===`);
  console.log(`  berlin_vorgaenge:        ${vorgaenge.length}`);
  console.log(`  berlin_documents:        ${documents.length}`);
  console.log(`  Redner-Einträge:         ${totalRedner}  (gematcht: ${matchedRedner})`);
  console.log(`  Urheber Einzelpersonen:  ${personUrheber}  (gematcht: ${matchedUrheber})`);
  console.log(`  Berliner MdL mit ≥1 Dokument-Bezug: ${polWithDocs}/${locals.length}`);

  db.close();
}

main();
