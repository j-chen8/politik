/**
 * Seed parsed protocol data into SQLite
 * Creates tables for: plenar_sessions, plenar_speeches, ausschuss_sessions, ausschuss_attendees
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Create tables ──

db.exec(`
  -- Plenar sessions (64 Sitzungen)
  CREATE TABLE IF NOT EXISTS plenar_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wahlperiode INTEGER NOT NULL,
    sitzung INTEGER NOT NULL UNIQUE,
    datum TEXT
  );

  -- Plenar speeches (from TOC parsing)
  CREATE TABLE IF NOT EXISTS plenar_speeches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES plenar_sessions(id),
    speaker TEXT NOT NULL,
    party TEXT,
    role TEXT,
    topic_number TEXT,
    topic_title TEXT,
    page_ref TEXT
  );

  -- Ausschuss sessions
  CREATE TABLE IF NOT EXISTS ausschuss_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protokoll_nr TEXT,
    wahlperiode INTEGER NOT NULL DEFAULT 21,
    sitzung_nr INTEGER,
    ausschuss TEXT NOT NULL,
    typ TEXT,
    datum TEXT,
    vorsitz TEXT,
    seiten INTEGER,
    source_file TEXT
  );

  -- Ausschuss attendance
  CREATE TABLE IF NOT EXISTS ausschuss_attendees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES ausschuss_sessions(id),
    name TEXT NOT NULL,
    fraktion TEXT,
    typ TEXT DEFAULT 'ordentlich'
  );

  -- Ausschuss topics
  CREATE TABLE IF NOT EXISTS ausschuss_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES ausschuss_sessions(id),
    topic_number TEXT,
    title TEXT,
    drucksache TEXT
  );

  -- Ausschuss speakers (from Wortprotokolle)
  CREATE TABLE IF NOT EXISTS ausschuss_speakers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES ausschuss_sessions(id),
    name TEXT NOT NULL,
    fraktion TEXT,
    speech_count INTEGER DEFAULT 1
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_plenar_speeches_speaker ON plenar_speeches(speaker);
  CREATE INDEX IF NOT EXISTS idx_plenar_speeches_session ON plenar_speeches(session_id);
  CREATE INDEX IF NOT EXISTS idx_plenar_speeches_party ON plenar_speeches(party);
  CREATE INDEX IF NOT EXISTS idx_ausschuss_attendees_session ON ausschuss_attendees(session_id);
  CREATE INDEX IF NOT EXISTS idx_ausschuss_attendees_name ON ausschuss_attendees(name);
  CREATE INDEX IF NOT EXISTS idx_ausschuss_sessions_ausschuss ON ausschuss_sessions(ausschuss);
`);

console.log("Tables created.\n");

// ── Helper: parse German date string to ISO ──

function parseDatum(raw: string): string | null {
  if (!raw) return null;
  const months: Record<string, string> = {
    Januar: "01", Februar: "02", März: "03", April: "04",
    Mai: "05", Juni: "06", Juli: "07", August: "08",
    September: "09", Oktober: "10", November: "11", Dezember: "12",
  };
  const m = raw.match(/(\d+)\.\s*(\w+)\s*(\d{4})/);
  if (!m) return null;
  const month = months[m[2]];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
}

// ── Seed Plenarprotokolle ──

function seedPlenar() {
  console.log("=== Seeding Plenarprotokolle ===");

  const dir = "data/plenarprotokolle";
  const jsonFiles = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  const insertSession = db.prepare(
    `INSERT OR IGNORE INTO plenar_sessions (wahlperiode, sitzung, datum) VALUES (?, ?, ?)`
  );
  const insertSpeech = db.prepare(
    `INSERT INTO plenar_speeches (session_id, speaker, party, role, topic_number, topic_title, page_ref)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const getSession = db.prepare(
    `SELECT id FROM plenar_sessions WHERE sitzung = ?`
  );

  let sessionCount = 0;
  let speechCount = 0;

  const tx = db.transaction(() => {
    for (const file of jsonFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      if (!data.session || data.session.sitzung === 0) continue;

      const datum = parseDatum(data.session.datum);
      insertSession.run(data.session.wahlperiode, data.session.sitzung, datum);
      const row = getSession.get(data.session.sitzung) as { id: number };
      if (!row) continue;

      sessionCount++;

      for (const speech of data.speeches || []) {
        // Skip garbage speaker names
        if (!speech.speaker || speech.speaker.length > 80) continue;
        if (speech.speaker.includes("Tagesord") || speech.speaker.includes("Erweiterung")) continue;

        insertSpeech.run(
          row.id,
          speech.speaker,
          speech.party || null,
          speech.role || null,
          speech.topicNumber || null,
          (speech.topicTitle || "").substring(0, 200) || null,
          speech.pageRef || null
        );
        speechCount++;
      }
    }
  });

  tx();
  console.log(`  ${sessionCount} Sitzungen, ${speechCount} Reden\n`);
}

// ── Seed Ausschuss-Protokolle ──

function seedAusschuss() {
  console.log("=== Seeding Ausschuss-Protokolle ===");

  const baseDir = "data/ausschuss_protokolle";
  const jsonFiles: string[] = [];

  function findJsons(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) findJsons(full);
      else if (entry.name.endsWith(".json") && entry.name !== "parse-summary.json") {
        jsonFiles.push(full);
      }
    }
  }
  findJsons(baseDir);

  const insertSession = db.prepare(
    `INSERT INTO ausschuss_sessions (protokoll_nr, wahlperiode, sitzung_nr, ausschuss, typ, datum, vorsitz, seiten, source_file)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAttendee = db.prepare(
    `INSERT INTO ausschuss_attendees (session_id, name, fraktion, typ) VALUES (?, ?, ?, ?)`
  );
  const insertTopic = db.prepare(
    `INSERT INTO ausschuss_topics (session_id, topic_number, title, drucksache) VALUES (?, ?, ?, ?)`
  );
  const insertSpeaker = db.prepare(
    `INSERT INTO ausschuss_speakers (session_id, name, fraktion, speech_count) VALUES (?, ?, ?, ?)`
  );

  let sessionCount = 0;
  let attendeeCount = 0;
  let topicCount = 0;
  let speakerCount = 0;

  // Deduplicate by protokoll_nr + ausschuss
  const seen = new Set<string>();

  const tx = db.transaction(() => {
    for (const file of jsonFiles) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (!data.session) continue;

      const s = data.session;
      // Skip duplicates and empty parses
      const key = `${s.protokollNr}|${s.ausschuss}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Skip entries with no useful data
      if (!s.ausschuss && (data.attendees?.length || 0) === 0 && (data.topics?.length || 0) === 0) continue;

      const datum = parseDatum(s.datum);
      const ausschuss = (s.ausschuss || "").replace(/Ausschuss für /g, "").substring(0, 100);

      const result = insertSession.run(
        s.protokollNr || null,
        s.wahlperiode || 21,
        s.sitzungNr || null,
        ausschuss || "Unbekannt",
        s.typ || null,
        datum,
        s.vorsitz || null,
        s.seiten || null,
        path.relative(baseDir, file)
      );
      const sessionId = result.lastInsertRowid as number;
      sessionCount++;

      // Attendees
      for (const a of data.attendees || []) {
        if (!a.name || a.name.length < 3 || a.name.length > 60) continue;
        insertAttendee.run(sessionId, a.name, a.fraktion || null, a.typ || "ordentlich");
        attendeeCount++;
      }

      // Topics
      for (const t of data.topics || []) {
        if (!t.number) continue;
        const title = (t.title || "").substring(0, 300);
        insertTopic.run(sessionId, t.number, title || null, t.drucksache || null);
        topicCount++;
      }

      // Speakers
      for (const [name, info] of Object.entries(data.speakers || {})) {
        const sp = info as any;
        if (!name || name.length < 3 || name.length > 60) continue;
        // Skip false positive patterns
        if (name.match(/^(Federführend|Mitberatend|Gutachtlich|Hierzu|Berichterstatter)/)) continue;
        insertSpeaker.run(sessionId, name, sp.fraktion || null, sp.count || 1);
        speakerCount++;
      }
    }
  });

  tx();
  console.log(`  ${sessionCount} Sitzungen`);
  console.log(`  ${attendeeCount} Anwesenheitseinträge`);
  console.log(`  ${topicCount} Tagesordnungspunkte`);
  console.log(`  ${speakerCount} Redner-Einträge\n`);
}

// ── Run ──

// Clear existing protocol data for clean re-seed
db.exec(`
  DELETE FROM plenar_speeches;
  DELETE FROM plenar_sessions;
  DELETE FROM ausschuss_speakers;
  DELETE FROM ausschuss_topics;
  DELETE FROM ausschuss_attendees;
  DELETE FROM ausschuss_sessions;
`);

seedPlenar();
seedAusschuss();

// ── Final stats ──

console.log("=== DATENBANK ÜBERSICHT ===");
const stats = [
  ["Parlamente", "parliaments"],
  ["Parteien", "parties"],
  ["Politiker", "politicians"],
  ["Mandate", "mandates"],
  ["Aktivitäten", "activities"],
  ["Plenar-Sitzungen", "plenar_sessions"],
  ["Plenar-Reden", "plenar_speeches"],
  ["Ausschuss-Sitzungen", "ausschuss_sessions"],
  ["Ausschuss-Anwesenheit", "ausschuss_attendees"],
  ["Ausschuss-TOPs", "ausschuss_topics"],
  ["Ausschuss-Redner", "ausschuss_speakers"],
];

for (const [label, table] of stats) {
  const count = (db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }).c;
  console.log(`  ${label.padEnd(25)} ${count.toLocaleString("de-DE").padStart(8)}`);
}

db.close();
