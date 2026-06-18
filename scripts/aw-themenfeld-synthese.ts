/**
 * Ebene 2: Bürgerfragen-Synthese pro (Politiker × Themenfeld) — „worüber wird gefragt /
 * wie antwortet er/sie", extraktiv & neutral. Mistral (Default large), Multi-Key-Round-Robin.
 * KEINE Wertung, nur aus den gegebenen Q&A. Resume: vorhandene (politician_id, feld) skippen.
 *
 * Lauf:  npx tsx scripts/aw-themenfeld-synthese.ts --pilot       # 5 Profile (Test)
 *        npx tsx scripts/aw-themenfeld-synthese.ts                # ALLE Profile, Felder ≥4
 *        npx tsx scripts/aw-themenfeld-synthese.ts --print        # gespeicherte zeigen
 *        --model <id>   Default mistral-large-2512  (medium-2508 = schneller)
 *        --redo         vorhandene überschreiben
 */
import Database from "better-sqlite3";
import path from "path";
import { MistralPool, runPool } from "./_lib/mistral";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");

const argv = process.argv.slice(2);
const PILOT = argv.includes("--pilot");
const REDO = argv.includes("--redo");
const MODEL = argv.includes("--model") ? argv[argv.indexOf("--model") + 1] : "mistral-large-2512";

// Pro-Key-Spacing nach Modell-RPS (Dashboard): large 0,07 RPS · medium 0,38 · small 5
const SPACING: Record<string, number> = {
  "mistral-large-2512": 14500, "mistral-large-latest": 14500,
  "mistral-medium-2508": 2700, "mistral-medium-2505": 2700, "mistral-medium-latest": 2700,
  "mistral-small-2506": 300,
};
const pool = new MistralPool(SPACING[MODEL] ?? 14500);
const CONCURRENCY = pool.size * 2;

const MIN_FRAGEN = 1;       // Mindest-Fragen je Feld (1 = volle Abdeckung aller Politiker; n_fragen flaggt dünne)
const PILOT_TOP_FELDER = 6; // im Pilot: nur Top-Felder
const MAX_PAARE = 30;       // Q&A-Paare Kontext je Synthese

const PILOT_IDS = [
  { id: 79334, name: "Gregor Gysi" }, { id: 32337, name: "Stephan Brandner" },
  { id: 79316, name: "Hubertus Heil" }, { id: 78886, name: "Katrin Göring-Eckardt" },
  { id: 79378, name: "Thorsten Frei" },
];

db.exec(`
  CREATE TABLE IF NOT EXISTS aw_themenfeld_synthese (
    politician_id INTEGER NOT NULL, feld TEXT NOT NULL, synthese TEXT NOT NULL,
    n_fragen INTEGER, n_kontext INTEGER, model TEXT,
    created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (politician_id, feld)
  );
`);

const SYSTEM = `Du fasst für eine neutrale Politik-Transparenzplattform sachlich zusammen, worüber Bürger:innen eine:n Abgeordnete:n in einem Themenfeld fragen und wie er/sie darauf antwortet.

REGELN — strikt:
- Nur aus den gegebenen Fragen/Antworten. Nichts erfinden, nichts dazuwissen.
- Keine Wertung, kein Lob, keine Kritik, keine eigene Meinung. Beschreiben, nicht beurteilen.
- Die Position der/des Abgeordneten nur so wiedergeben, wie sie aus den Antworten hervorgeht. Wenn Antworten unklar/uneinheitlich/ausweichend sind, sag das neutral.
- Wenn die/der Abgeordnete in den Antworten keine inhaltliche Position bezieht, beschreibe das (z. B. „verweist auf …", „antwortet allgemein").
- Knapp, sachlich, Deutsch.

FORMAT — genau zwei kurze Absätze, zusammen max. ~80 Wörter:
1) „Gefragt wird vor allem nach …" (die wiederkehrenden Themen der Bürgerfragen)
2) „In den Antworten …" (Tenor + konkrete inhaltliche Punkte der Abgeordneten-Antworten)`;

function feldRollup(polId: number) {
  return db.prepare(`
    SELECT m.feld, COUNT(DISTINCT q.frage_url) c
    FROM aw_questions q
    JOIN aw_question_topics t ON t.frage_url=q.frage_url
    JOIN aw_tag_themenfeld m ON m.label=t.label AND m.feld IS NOT NULL
    WHERE q.politician_id=? AND q.status='beantwortet'
    GROUP BY m.feld ORDER BY c DESC
  `).all(polId) as { feld: string; c: number }[];
}
function paare(polId: number, feld: string) {
  return db.prepare(`
    SELECT q.frage_text, q.antwort_text FROM aw_questions q
    WHERE q.frage_url IN (
      SELECT DISTINCT q2.frage_url FROM aw_questions q2
      JOIN aw_question_topics t ON t.frage_url=q2.frage_url
      JOIN aw_tag_themenfeld m ON m.label=t.label AND m.feld=?
      WHERE q2.politician_id=? AND q2.status='beantwortet')
    ORDER BY COALESCE(q.antwort_datum, q.frage_datum) DESC LIMIT ?
  `).all(feld, polId, MAX_PAARE) as { frage_text: string | null; antwort_text: string | null }[];
}
function buildPrompt(name: string, feld: string, ps: { frage_text: string | null; antwort_text: string | null }[]) {
  const block = ps.map((p, i) => `[${i + 1}] FRAGE: ${(p.frage_text || "").replace(/\s+/g, " ").trim().slice(0, 400)}\n    ANTWORT: ${(p.antwort_text || "").replace(/\s+/g, " ").trim().slice(0, 600)}`).join("\n\n");
  return `Abgeordnete:r: ${name}\nThemenfeld: ${feld}\n\nBürgerfragen & Antworten (${ps.length} Beispiele):\n\n${block}`;
}

const ins = db.prepare(`INSERT INTO aw_themenfeld_synthese (politician_id, feld, synthese, n_fragen, n_kontext, model)
  VALUES (@politician_id,@feld,@synthese,@n_fragen,@n_kontext,@model)
  ON CONFLICT(politician_id, feld) DO UPDATE SET synthese=@synthese, n_fragen=@n_fragen, n_kontext=@n_kontext, model=@model, created_at=datetime('now')`);

async function main() {
  if (argv.includes("--print")) {
    for (const r of db.prepare(`SELECT * FROM aw_themenfeld_synthese ORDER BY politician_id, n_fragen DESC`).all() as any[])
      console.log(`\n### ${r.politician_id} · ${r.feld} (${r.n_fragen})\n${r.synthese}`);
    return;
  }

  // Profile + Namen
  const pols = PILOT
    ? PILOT_IDS
    : (db.prepare(`
        SELECT p.id, TRIM(COALESCE(p.first_name,'')||' '||COALESCE(p.last_name,'')) AS name
        FROM politicians p
        WHERE p.id IN (SELECT DISTINCT politician_id FROM aw_questions WHERE status='beantwortet')
          AND TRIM(COALESCE(p.first_name,'')||COALESCE(p.last_name,'')) <> ''
      `).all() as { id: number; name: string }[]);

  type Job = { id: number; name: string; feld: string; c: number };
  const jobs: Job[] = [];
  for (const p of pols) {
    let felder = feldRollup(p.id).filter((f) => f.c >= MIN_FRAGEN);
    if (PILOT) felder = felder.slice(0, PILOT_TOP_FELDER);
    for (const f of felder) jobs.push({ id: p.id, name: p.name, feld: f.feld, c: f.c });
  }
  const existing = new Set((db.prepare(`SELECT politician_id||'|'||feld AS k FROM aw_themenfeld_synthese`).all() as { k: string }[]).map((r) => r.k));
  const todo = REDO ? jobs : jobs.filter((j) => !existing.has(`${j.id}|${j.feld}`));
  const estH = (todo.length * (pool.minSpacingMs / pool.size) / 3600000).toFixed(1);
  console.log(`Ebene-2-Synthese${PILOT ? " (Pilot)" : ""}: ${pols.length} Profile · ${jobs.length} Jobs (${todo.length} offen) · ${MODEL} · ${pool.size} Key(s)·Conc ${CONCURRENCY} · ~${estH} h\n`);

  let done = 0, fail = 0;
  await runPool(todo, CONCURRENCY, async (job) => {
    try {
      const ps = paare(job.id, job.feld);
      const synthese = await pool.chat({ model: MODEL, system: SYSTEM, user: buildPrompt(job.name, job.feld, ps), maxTokens: 400, temperature: 0.2 });
      ins.run({ politician_id: job.id, feld: job.feld, synthese, n_fragen: job.c, n_kontext: ps.length, model: MODEL });
      done++;
      if (PILOT || done % 100 === 0) console.log(`[${done}/${todo.length}] ${job.name} · ${job.feld}`);
    } catch (e: any) { fail++; console.log(`  ❌ ${job.name} · ${job.feld}: ${e.message}`); }
  });
  console.log(`\n=== fertig: ${done} Synthesen, ${fail} Fehler (aw_themenfeld_synthese) ===`);
}
main();
