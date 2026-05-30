/**
 * Phase D: Mündliche Fragen / Fragestunde / Regierungsbefragung paaren.
 * Jede Antwort-Rede (Regierungs-Rolle) wird mit der unmittelbar vorangehenden
 * Frage-Rede (MdB) im selben (session, topic) verknüpft. Deterministisch.
 * Schreibt plenar_speeches.antwort_auf_speech_id (die beantwortete Frage).
 *
 * Aufruf:  npx tsx scripts/pair-fragestunde-qa.ts [--write]
 */
import Database from "better-sqlite3";
const DB = "politik.db";
const WRITE = process.argv.includes("--write");

const isGov = (role: string | null) =>
  !!role && /Bundesminister|Bundeskanzler|Staatssekret|Staatsminister|Parl\. Staatssekret|Wehrbeauftragt/i.test(role);

function main() {
  const db = new Database(DB, { readonly: !WRITE });
  const rows = db.prepare(`
    SELECT sp.id, sp.session_id, sp.topic_id, sp.speech_index, sp.speaker, sp.role, sp.party
    FROM plenar_speeches sp JOIN speech_analyses_v2 sa ON sa.speech_id = sp.id
    WHERE sa.reden_typ LIKE '%I%' AND sp.topic_id IS NOT NULL
    ORDER BY sp.session_id, sp.topic_id, sp.speech_index
  `).all() as { id: number; session_id: number; topic_id: number; speech_index: number; speaker: string; role: string | null; party: string | null }[];

  const upd = WRITE ? db.prepare(`UPDATE plenar_speeches SET antwort_auf_speech_id=? WHERE id=?`) : null;
  let answers = 0, paired = 0, questions = 0;
  let curKey = "", lastFrageId: number | null = null;

  for (const r of rows) {
    const key = `${r.session_id}|${r.topic_id}`;
    if (key !== curKey) { curKey = key; lastFrageId = null; }
    if (isGov(r.role)) {
      answers++;
      if (lastFrageId != null) { paired++; if (WRITE && upd) upd.run(lastFrageId, r.id); }
    } else {
      questions++;
      lastFrageId = r.id;
    }
  }
  db.close();
  console.log(`Fragestunde-Turns: ${rows.length} | Fragen ${questions} | Antworten ${answers} | gepaart ${paired} (${(100*paired/answers||0).toFixed(1)}% der Antworten)`);
  console.log(WRITE ? "GESCHRIEBEN." : "DRY-RUN.");
}
main();
