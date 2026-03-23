/**
 * Seed LLM-parsed protocol data into SQLite
 * Replaces regex-parsed data with cleaner LLM results
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Ensure tables exist with source_url ──

db.exec(`
  CREATE TABLE IF NOT EXISTS plenar_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wahlperiode INTEGER NOT NULL,
    sitzung INTEGER NOT NULL UNIQUE,
    datum TEXT,
    source_url TEXT
  );

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

  CREATE TABLE IF NOT EXISTS plenar_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES plenar_sessions(id),
    topic_number TEXT NOT NULL,
    title TEXT NOT NULL
  );

  -- Add source_url column if missing
  SELECT sql FROM sqlite_master WHERE name='plenar_sessions' AND sql NOT LIKE '%source_url%';
`);

// Try adding column (ignore if exists)
try { db.exec("ALTER TABLE plenar_sessions ADD COLUMN source_url TEXT"); } catch {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_plenar_speeches_speaker ON plenar_speeches(speaker)"); } catch {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_plenar_speeches_party ON plenar_speeches(party)"); } catch {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_plenar_topics_session ON plenar_topics(session_id)"); } catch {}

// ── Clear and re-seed ──

db.exec(`
  DELETE FROM plenar_speeches;
  DELETE FROM plenar_sessions;
  DELETE FROM plenar_topics;
`);

const insertSession = db.prepare(
  `INSERT INTO plenar_sessions (wahlperiode, sitzung, datum, source_url) VALUES (?, ?, ?, ?)`
);
const insertSpeech = db.prepare(
  `INSERT INTO plenar_speeches (session_id, speaker, party, role, topic_number, topic_title, page_ref) VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const insertTopic = db.prepare(
  `INSERT INTO plenar_topics (session_id, topic_number, title) VALUES (?, ?, ?)`
);
const getSession = db.prepare(`SELECT id FROM plenar_sessions WHERE sitzung = ?`);

const dir = "data/plenarprotokolle";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".llm.json")).sort();

let sessionCount = 0;
let speechCount = 0;
let topicCount = 0;

const tx = db.transaction(() => {
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    const sitzung = data.sitzung || parseInt(file.replace(/\D/g, "").slice(-3));
    if (!sitzung) continue;

    const padded = String(sitzung).padStart(3, "0");
    const sourceUrl = `https://dserver.bundestag.de/btp/21/21${padded}.pdf`;

    insertSession.run(data.wahlperiode || 21, sitzung, data.datum || null, sourceUrl);
    const row = getSession.get(sitzung) as { id: number };
    if (!row) continue;
    sessionCount++;

    // Topics
    for (const t of data.themen || []) {
      if (!t.nummer || !t.titel) continue;
      insertTopic.run(row.id, t.nummer, t.titel.substring(0, 200));
      topicCount++;
    }

    // Speeches — expand each speaker into individual speech entries
    for (const r of data.redner || []) {
      if (!r.name || r.name.length < 3) continue;

      // Find which topic this speaker belongs to (if available)
      // LLM doesn't always give per-speech topic assignment, so default to null
      const count = r.reden_anzahl || 1;
      for (let i = 0; i < count; i++) {
        insertSpeech.run(
          row.id,
          r.name,
          r.partei || null,
          r.rolle || null,
          null, // topic_number (LLM gives per-speaker, not per-speech)
          null,
          null  // page_ref
        );
        speechCount++;
      }
    }
  }
});

tx();

console.log("=== LLM-Daten in DB geladen ===");
console.log(`  ${sessionCount} Sitzungen`);
console.log(`  ${topicCount} Tagesordnungspunkte`);
console.log(`  ${speechCount} Reden`);

// Quick stats
const speakers = (db.prepare("SELECT COUNT(DISTINCT speaker) as c FROM plenar_speeches").get() as any).c;
console.log(`  ${speakers} verschiedene Redner`);

db.close();
