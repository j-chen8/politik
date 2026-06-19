/**
 * n=1-Synthesen härten: Für jede Themenfeld-Synthese mit n_fragen=1, deren EINE
 * Frage an MEHREREN Feldern hängt, lässt mistral-small das PRIMÄRE Feld unter den
 * bereits getaggten Kandidaten wählen (kein Halluzinieren neuer Felder). Stimmt
 * das Hauptfeld nicht mit dem Synthese-Feld überein, ist die Synthese ein Phantom
 * (z. B. Auernhammer/„Bildung" = eigentlich LGBT/EU) und wird geflaggt.
 *
 * Eindeutige n=1 (Frage hat nur 1 Feld) sind per Konstruktion sicher → nicht hier.
 *
 * Lauf:  npx tsx scripts/aw-n1-hauptfeld.ts --pilot   # 8 Test
 *        npx tsx scripts/aw-n1-hauptfeld.ts           # alle mehrdeutigen n=1
 *        npx tsx scripts/aw-n1-hauptfeld.ts --print   # Ergebnis-Übersicht
 *        --redo   vorhandene überschreiben
 */
import Database from "better-sqlite3";
import path from "path";
import { MistralPool, runPool } from "./_lib/mistral";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");

const argv = process.argv.slice(2);
const PILOT = argv.includes("--pilot");
const REDO = argv.includes("--redo");
const PRINT = argv.includes("--print");
const MODEL = "mistral-small-2506";

db.exec(`
  CREATE TABLE IF NOT EXISTS aw_n1_hauptfeld (
    politician_id INTEGER NOT NULL,
    feld          TEXT NOT NULL,   -- Feld der n=1-Synthese
    frage_url     TEXT NOT NULL,
    primary_feld  TEXT,            -- vom Modell gewähltes Hauptfeld
    is_phantom    INTEGER,         -- 1 = Hauptfeld ≠ Synthese-Feld → Phantom
    kandidaten    TEXT,            -- die zur Auswahl gestellten Felder (|-getrennt)
    model         TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (politician_id, feld)
  );
`);

if (PRINT) {
  const rows = db.prepare(`
    SELECT is_phantom, COUNT(*) AS n FROM aw_n1_hauptfeld GROUP BY is_phantom
  `).all() as { is_phantom: number; n: number }[];
  console.log("aw_n1_hauptfeld:", rows);
  const ph = db.prepare(`
    SELECT p.last_name, h.feld, h.primary_feld FROM aw_n1_hauptfeld h
    JOIN politicians p ON p.id=h.politician_id WHERE h.is_phantom=1 LIMIT 25
  `).all();
  console.log("Phantome (Stichprobe):", ph);
  process.exit(0);
}

// Alle n=1-Synthesen + ihre eine beantwortete Frage in diesem Feld
type Cand = { politician_id: number; feld: string; frage_url: string; frage_text: string };
const base = db.prepare(`
  WITH n1 AS (SELECT politician_id, feld FROM aw_themenfeld_synthese WHERE n_fragen = 1)
  SELECT n1.politician_id, n1.feld, q.frage_url, q.frage_text
  FROM n1
  JOIN aw_questions q ON q.politician_id = n1.politician_id AND q.status = 'beantwortet'
  JOIN aw_question_topics qt ON qt.frage_url = q.frage_url
  JOIN aw_tag_themenfeld tf ON tf.label = qt.label AND tf.feld = n1.feld
  GROUP BY n1.politician_id, n1.feld
`).all() as Cand[];

// Kandidaten-Felder je Frage
const candFelderStmt = db.prepare(`
  SELECT DISTINCT tf.feld FROM aw_question_topics qt
  JOIN aw_tag_themenfeld tf ON tf.label = qt.label AND tf.feld IS NOT NULL
  WHERE qt.frage_url = ?
`);
const doneStmt = db.prepare(`SELECT 1 FROM aw_n1_hauptfeld WHERE politician_id=? AND feld=?`);

type Job = Cand & { kandidaten: string[] };
let jobs: Job[] = base
  .map((c) => ({ ...c, kandidaten: (candFelderStmt.all(c.frage_url) as { feld: string }[]).map((r) => r.feld) }))
  .filter((j) => j.kandidaten.length > 1); // nur mehrdeutige
if (!REDO) jobs = jobs.filter((j) => !doneStmt.get(j.politician_id, j.feld));
if (PILOT) jobs = jobs.slice(0, 8);

console.log(`${jobs.length} mehrdeutige n=1-Synthesen zu klassifizieren (${MODEL})`);

const SPACING = 300; // mistral-small ~5 RPS/Key
const pool = new MistralPool(SPACING);
const CONCURRENCY = pool.size * 3;

const SYSTEM = `Du ordnest eine Bürgerfrage ihrem PRIMÄREN Themenfeld zu — dem zentralen Sachthema, um das es in der Frage hauptsächlich geht.
Wähle GENAU EIN Feld aus der vorgegebenen Kandidatenliste. Nebenaspekte zählen nicht.
Antworte AUSSCHLIESSLICH mit dem exakten Feldnamen aus der Liste, wortwörtlich, ohne Anführungszeichen, Nummerierung oder weiteren Text.`;

const ins = db.prepare(`
  INSERT INTO aw_n1_hauptfeld (politician_id, feld, frage_url, primary_feld, is_phantom, kandidaten, model)
  VALUES (@politician_id, @feld, @frage_url, @primary_feld, @is_phantom, @kandidaten, @model)
  ON CONFLICT(politician_id, feld) DO UPDATE SET
    primary_feld=excluded.primary_feld, is_phantom=excluded.is_phantom,
    kandidaten=excluded.kandidaten, model=excluded.model, created_at=datetime('now')
`);

function matchCandidate(resp: string, kandidaten: string[]): string | null {
  const r = resp.trim().toLowerCase().replace(/^["'\-\d.\s]+|["'\s]+$/g, "");
  let best = kandidaten.find((k) => k.toLowerCase() === r);
  if (best) return best;
  best = kandidaten.find((k) => r.includes(k.toLowerCase()) || k.toLowerCase().includes(r));
  return best ?? null;
}

let done = 0, phantom = 0, unparsed = 0;
const t0 = Date.now();

async function main() {
await runPool(jobs, CONCURRENCY, async (j) => {
  const user = `FRAGE:\n${j.frage_text.slice(0, 1400)}\n\nKANDIDATEN-FELDER:\n${j.kandidaten.map((k) => `- ${k}`).join("\n")}\n\nPrimäres Feld:`;
  let primary: string | null = null;
  try {
    const resp = await pool.chat({ model: MODEL, system: SYSTEM, user, maxTokens: 40, temperature: 0 });
    primary = matchCandidate(resp, j.kandidaten);
  } catch (e: any) {
    console.error(`FEHLER ${j.politician_id}/${j.feld}: ${e.message}`);
    return; // unverarbeitet lassen → nächster Lauf holt nach
  }
  if (!primary) { unparsed++; primary = j.feld; } // unklar → konservativ: behalten (kein Phantom)
  const isPhantom = primary !== j.feld ? 1 : 0;
  if (isPhantom) phantom++;
  ins.run({ ...j, kandidaten: j.kandidaten.join("|"), primary_feld: primary, is_phantom: isPhantom, model: MODEL });
  if (++done % 100 === 0) console.log(`${done}/${jobs.length} · ${phantom} Phantome · ${Math.round((Date.now() - t0) / 1000)}s`);
});

console.log(`\nFERTIG: ${done} klassifiziert · ${phantom} Phantome (${((100 * phantom) / Math.max(1, done)).toFixed(1)}%) · ${unparsed} unklar→behalten · ${Math.round((Date.now() - t0) / 1000)}s`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
