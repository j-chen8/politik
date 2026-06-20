/**
 * Schritt 2 zum deterministischen QA→Themenfeld-Crosswalk: mistral-small wählt
 * das PRIMÄRE Feld — bounded choice, kein Halluzinieren neuer Felder.
 *
 * Zwei Job-Typen:
 *   multi  Paar hängt an einem Mehrfeld-Ressort (BMI/BMWE/BMAS/BMBFSFJ/BMDS) →
 *          Kandidaten = die 2–3 bereits getaggten Felder; Modell wählt das
 *          primäre. Ergebnis: ist_primaer in drucksache_qa_themenfeld umgeflaggt.
 *   open   Paar ist untagged (Staatsminister ohne Ressort, Doppelrollen) →
 *          Kandidaten = alle 25 kanonischen Felder; Modell klassifiziert offen.
 *          Ergebnis: neue Themenfeld-Zeile (ist_primaer=1).
 *
 * Audit-Trail in qa_themenfeld_llm (Crosswalk-Provenance bleibt unangetastet).
 *
 * Lauf:  npx tsx scripts/qa-themenfeld-llm.ts --pilot   # 12 Test (kein Schreiben in Haupttabelle)
 *        npx tsx scripts/qa-themenfeld-llm.ts           # alle offenen Jobs
 *        npx tsx scripts/qa-themenfeld-llm.ts --print    # Übersicht
 *        --redo   bereits verarbeitete neu klassifizieren
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
  CREATE TABLE IF NOT EXISTS qa_themenfeld_llm (
    pair_id    INTEGER PRIMARY KEY,
    modus      TEXT NOT NULL,        -- 'multi' | 'open'
    kandidaten TEXT,                 -- zur Auswahl gestellte Felder (|-getrennt)
    gewaehlt   TEXT,                 -- vom Modell gewähltes Primärfeld
    model      TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

if (PRINT) {
  console.log("qa_themenfeld_llm:", db.prepare(`SELECT modus, COUNT(*) n FROM qa_themenfeld_llm GROUP BY modus`).all());
  console.log("Primärfeld-Verteilung NACH LLM:");
  console.table(db.prepare(`SELECT themenfeld, COUNT(*) n FROM drucksache_qa_themenfeld WHERE ist_primaer=1 GROUP BY themenfeld ORDER BY n DESC`).all());
  process.exit(0);
}

const canon = (db.prepare(`SELECT DISTINCT feld FROM aw_tag_themenfeld WHERE feld!=''`).all() as { feld: string }[]).map((r) => r.feld);

type Job = { pair_id: number; frage: string; kandidaten: string[]; modus: "multi" | "open" };

// multi: Paare mit >1 Themenfeld-Tag
const multi = db.prepare(`
  SELECT p.id AS pair_id, p.frage_text AS frage,
         (SELECT GROUP_CONCAT(t.themenfeld, '|') FROM drucksache_qa_themenfeld t WHERE t.pair_id=p.id) AS felder
  FROM drucksache_qa_paare p
  WHERE p.id IN (SELECT pair_id FROM drucksache_qa_themenfeld GROUP BY pair_id HAVING COUNT(*)>1)
`).all() as { pair_id: number; frage: string; felder: string }[];

// open: untagged Paare (keine Themenfeld-Zeile)
const open = db.prepare(`
  SELECT p.id AS pair_id, p.frage_text AS frage
  FROM drucksache_qa_paare p
  WHERE p.id NOT IN (SELECT pair_id FROM drucksache_qa_themenfeld)
`).all() as { pair_id: number; frage: string }[];

const doneStmt = db.prepare(`SELECT 1 FROM qa_themenfeld_llm WHERE pair_id=?`);
let jobs: Job[] = [
  ...multi.map((m) => ({ pair_id: m.pair_id, frage: m.frage, kandidaten: m.felder.split("|"), modus: "multi" as const })),
  ...open.map((o) => ({ pair_id: o.pair_id, frage: o.frage, kandidaten: canon, modus: "open" as const })),
];
if (!REDO) jobs = jobs.filter((j) => !doneStmt.get(j.pair_id));
if (PILOT) jobs = jobs.slice(0, 12);

console.log(`${jobs.length} Jobs (${jobs.filter((j) => j.modus === "multi").length} multi / ${jobs.filter((j) => j.modus === "open").length} open) · ${MODEL}`);

const SPACING = 300; // mistral-small ~5 RPS/Key
const pool = new MistralPool(SPACING);
const CONCURRENCY = pool.size * 3;

const SYSTEM = `Du ordnest eine Schriftliche Frage eines Bundestagsabgeordneten an die Bundesregierung ihrem PRIMÄREN Politikfeld zu — dem zentralen Sachthema, um das es hauptsächlich geht.
Wähle GENAU EIN Feld aus der vorgegebenen Kandidatenliste. Nebenaspekte zählen nicht.
Antworte AUSSCHLIESSLICH mit dem exakten Feldnamen aus der Liste, wortwörtlich, ohne Anführungszeichen, Nummerierung oder weiteren Text.`;

function matchCandidate(resp: string, kandidaten: string[]): string | null {
  const r = resp.trim().toLowerCase().replace(/^["'\-\d.\s]+|["'\s]+$/g, "");
  let best = kandidaten.find((k) => k.toLowerCase() === r);
  if (best) return best;
  best = kandidaten.find((k) => r.includes(k.toLowerCase()) || k.toLowerCase().includes(r));
  return best ?? null;
}

const logIns = db.prepare(`
  INSERT INTO qa_themenfeld_llm (pair_id, modus, kandidaten, gewaehlt, model)
  VALUES (@pair_id, @modus, @kandidaten, @gewaehlt, @model)
  ON CONFLICT(pair_id) DO UPDATE SET modus=excluded.modus, kandidaten=excluded.kandidaten, gewaehlt=excluded.gewaehlt, model=excluded.model, created_at=datetime('now')
`);
// multi: Primär umflaggen (Sekundär-Provenance bleibt). open: neue Primär-Zeile.
const reflag = db.prepare(`UPDATE drucksache_qa_themenfeld SET ist_primaer = (themenfeld=?) WHERE pair_id=?`);
const insTf = db.prepare(`INSERT INTO drucksache_qa_themenfeld (pair_id, themenfeld, ist_primaer, quelle) VALUES (?,?,1,'llm-mistral-small') ON CONFLICT(pair_id,themenfeld) DO UPDATE SET ist_primaer=1, quelle='llm-mistral-small'`);

let done = 0, changed = 0, unparsed = 0;
const t0 = Date.now();

async function main() {
  await runPool(jobs, CONCURRENCY, async (j) => {
    const user = `FRAGE:\n${j.frage.slice(0, 1400)}\n\nKANDIDATEN-FELDER:\n${j.kandidaten.map((k) => `- ${k}`).join("\n")}\n\nPrimäres Feld:`;
    let gewaehlt: string | null = null;
    try {
      const resp = await pool.chat({ model: MODEL, system: SYSTEM, user, maxTokens: 40, temperature: 0 });
      gewaehlt = matchCandidate(resp, j.kandidaten);
    } catch (e: any) {
      console.error(`FEHLER pair ${j.pair_id}: ${e.message}`);
      return; // unverarbeitet → nächster Lauf holt nach
    }
    if (!gewaehlt) { unparsed++; if (j.modus === "open") return; gewaehlt = j.kandidaten[0]; } // multi: konservativ erstes (=Default-Primär); open: überspringen
    if (PILOT) {
      console.log(`  [${j.modus}] pair ${j.pair_id} → ${gewaehlt}\n     (Kand: ${j.kandidaten.slice(0, 4).join(" | ")}${j.kandidaten.length > 4 ? " …" : ""})\n     ${j.frage.slice(0, 120)}`);
    } else {
      const before = db.prepare(`SELECT themenfeld FROM drucksache_qa_themenfeld WHERE pair_id=? AND ist_primaer=1`).get(j.pair_id) as { themenfeld: string } | undefined;
      if (j.modus === "multi") reflag.run(gewaehlt, j.pair_id);
      else insTf.run(j.pair_id, gewaehlt);
      if (before?.themenfeld !== gewaehlt) changed++;
      logIns.run({ pair_id: j.pair_id, modus: j.modus, kandidaten: j.kandidaten.join("|"), gewaehlt, model: MODEL });
    }
    if (++done % 200 === 0) console.log(`${done}/${jobs.length} · ${changed} Primär geändert · ${Math.round((Date.now() - t0) / 1000)}s`);
  });
  console.log(`\nFERTIG: ${done} verarbeitet · ${changed} Primärfeld geändert · ${unparsed} unklar · ${Math.round((Date.now() - t0) / 1000)}s`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
