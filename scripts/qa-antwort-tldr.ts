/**
 * TL;DR der Regierungs-Antworten auf Schriftliche Fragen (drucksache_qa_paare).
 * Verknappt die oft langen/ausweichenden Ministeriums-Antworten auf 1–2 neutrale
 * Sätze (Kernaussage: Zahlen/Ja-Nein/Inhalt). Modell: mistral-large (Qualität).
 *
 * Nur substantielle Antworten (≥150 Zeichen); kurze sind selbst schon knapp.
 * Idempotent/resumable: bereits verarbeitete Paare werden übersprungen → der Lauf
 * kann über mehrere Nächte/Neustarts laufen (systemd Restart=on-failure greift).
 *
 * Lauf:  npx tsx scripts/qa-antwort-tldr.ts --pilot   # 4 Test (nur drucken)
 *        npx tsx scripts/qa-antwort-tldr.ts           # alle offenen
 *        npx tsx scripts/qa-antwort-tldr.ts --print    # Fortschritt
 *        --model <id>   Default mistral-large-2512
 */
import Database from "better-sqlite3";
import path from "path";
import { MistralPool, runPool } from "./_lib/mistral";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 20000");

const argv = process.argv.slice(2);
const PILOT = argv.includes("--pilot");
const PRINT = argv.includes("--print");
const MODEL = argv.includes("--model") ? argv[argv.indexOf("--model") + 1] : "mistral-large-2512";
// Gestaffelter Re-Run: --frac 0.01|0.05|... = überschreibe TL;DR bis zu diesem
// Anteil aller ≥150-Antworten (kumulativ, deterministische Reihenfolge). Default 1.0.
const FRAC = argv.includes("--frac") ? Math.min(1, Math.max(0, parseFloat(argv[argv.indexOf("--frac") + 1]))) : 1.0;
// Pro-Key-Spacing (ms) je Modell. Large-Limit empirisch = 4 req/min/Key
// (x-ratelimit-limit-req-minute=4); 15500ms hält uns knapp DRUNTER → keine
// 429-Schleifen im unbeaufsichtigten Nachtlauf. Token-Limit (250k/min) unkritisch.
const SPACING: Record<string, number> = {
  "mistral-large-2512": 15500, "mistral-large-latest": 15500,
  "mistral-medium-2508": 2700, "mistral-medium-latest": 2700,
  "mistral-small-2506": 300,
};

db.exec(`
  CREATE TABLE IF NOT EXISTS drucksache_qa_tldr (
    pair_id    INTEGER PRIMARY KEY,
    tldr       TEXT NOT NULL,
    model      TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Marker-Spalte für den gehärteten Re-Run (idempotent) + einmaliges Backup vor dem ersten Überschreiben.
const cols = (db.prepare(`PRAGMA table_info(drucksache_qa_tldr)`).all() as { name: string }[]).map((c) => c.name);
if (!cols.includes("hardened")) db.exec(`ALTER TABLE drucksache_qa_tldr ADD COLUMN hardened INTEGER DEFAULT 0`);
const hasBackup = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='drucksache_qa_tldr_pre_hardened'`).get();
if (!hasBackup) {
  db.exec(`CREATE TABLE drucksache_qa_tldr_pre_hardened AS SELECT * FROM drucksache_qa_tldr`);
  console.log("Backup angelegt: drucksache_qa_tldr_pre_hardened");
}

if (PRINT) {
  const total = (db.prepare(`SELECT COUNT(*) n FROM drucksache_qa_paare WHERE LENGTH(antwort_text)>=150`).get() as { n: number }).n;
  const done = (db.prepare(`SELECT COUNT(*) n FROM drucksache_qa_tldr`).get() as { n: number }).n;
  console.log(`TL;DR: ${done}/${total} (${((100 * done) / total).toFixed(1)}%)`);
  console.log("Stichprobe:", db.prepare(`SELECT pair_id, SUBSTR(tldr,1,160) tldr FROM drucksache_qa_tldr ORDER BY RANDOM() LIMIT 5`).all());
  process.exit(0);
}

type Job = { pair_id: number; frage: string; antwort: string };
// Kanonische deterministische Reihenfolge (Knuth-Multiplikativ-Hash) über ALLE ≥150-Antworten
// → frac-Stufen sind kumulative Präfixe & repräsentativ. Verarbeite das Präfix bis ceil(FRAC*total),
// das noch NICHT gehärtet ist (hardened=0 oder fehlt). Resume-sicher.
const total = (db.prepare(`SELECT COUNT(*) n FROM drucksache_qa_paare WHERE LENGTH(antwort_text) >= 150`).get() as { n: number }).n;
const target = Math.ceil(FRAC * total);
let jobs = db.prepare(`
  WITH ranked AS (
    SELECT p.id, p.frage_text, p.antwort_text,
           ROW_NUMBER() OVER (ORDER BY (p.id * 2654435761) % 2147483647, p.id) AS rn
    FROM drucksache_qa_paare p WHERE LENGTH(p.antwort_text) >= 150
  )
  SELECT r.id AS pair_id, r.frage_text AS frage, r.antwort_text AS antwort
  FROM ranked r
  WHERE r.rn <= ?
    AND r.id NOT IN (SELECT pair_id FROM drucksache_qa_tldr WHERE hardened = 1)
  ORDER BY r.rn
`).all(target) as Job[];
if (PILOT) jobs = jobs.slice(0, 4);
console.log(`Staffel: FRAC=${FRAC} → Ziel ${target}/${total} gehärtet · diese Runde ${jobs.length} zu erzeugen`);

const pool = new MistralPool(SPACING[MODEL] ?? 14500);
const CONCURRENCY = pool.size * 2;
const estH = ((jobs.length * (pool.minSpacingMs / pool.size)) / 3600000).toFixed(1);
console.log(`${jobs.length} TL;DR zu erzeugen · ${MODEL} · ${pool.size} Keys · ~${estH}h`);

const SYSTEM = `Du fasst die Antwort der Bundesregierung auf eine Schriftliche Frage in 1–2 knappen, sachlich-neutralen Sätzen zusammen — die Kernaussage (konkrete Zahlen, Ja/Nein, der inhaltliche Befund).
Keine Wertung, keine Floskeln, keine Einleitung wie „Die Bundesregierung antwortet…".

STRENGE REGELN:
- Fasse AUSSCHLIESSLICH zusammen, was im ANTWORT-Text selbst steht. Die FRAGE liefert nur Kontext, niemals Inhalt: übernimm KEINE Zahlen, Namen, Orte, Daten, Gesetze oder Behauptungen aus der Frage in die Zusammenfassung.
- Verweist die Antwort nur auf ein anderes Dokument, eine Drucksache, einen Link, eine Anlage oder eine Statistik-Seite, OHNE die Zahlen/Inhalte selbst zu nennen, dann schreibe genau das (z. B. „nennt selbst keine Zahlen; verweist auf …") und erfinde NICHTS. Erfinde niemals den Inhalt eines verwiesenen Dokuments.
- Behaupte keine Zahl, kein Ergebnis und keinen Akteur, die nicht wörtlich oder eindeutig im Antwort-Text stehen. Leite keine Präzisionszahlen ab, die dort nicht stehen.
- Nenne Akteure/Stellen genau so, wie die Antwort sie nennt.

Antworte AUSSCHLIESSLICH mit der Zusammenfassung, ohne Anführungszeichen oder Vorrede.`;

const ins = db.prepare(`INSERT INTO drucksache_qa_tldr (pair_id, tldr, model, hardened) VALUES (?,?,?,1) ON CONFLICT(pair_id) DO UPDATE SET tldr=excluded.tldr, model=excluded.model, hardened=1, created_at=datetime('now')`);

let done = 0, fail = 0;
const t0 = Date.now();

async function main() {
  await runPool(jobs, CONCURRENCY, async (j) => {
    const user = `FRAGE:\n${j.frage.slice(0, 1200)}\n\nANTWORT:\n${j.antwort.slice(0, 4500)}\n\nTL;DR (1–2 Sätze):`;
    let tldr = "";
    try {
      tldr = (await pool.chat({ model: MODEL, system: SYSTEM, user, maxTokens: 160, temperature: 0.2 })).trim();
    } catch (e: any) {
      fail++; console.error(`FEHLER pair ${j.pair_id}: ${e.message}`); return; // unverarbeitet → nächster Lauf
    }
    if (tldr.length < 5) { fail++; return; }
    if (PILOT) { console.log(`\n[pair ${j.pair_id}]\n  F: ${j.frage.slice(0, 110)}\n  TL;DR: ${tldr}`); return; }
    ins.run(j.pair_id, tldr, MODEL);
    if (++done % 50 === 0) {
      const rate = done / ((Date.now() - t0) / 60000);
      console.log(`${done}/${jobs.length} · ${fail} Fehler · ${rate.toFixed(1)}/min · ${Math.round((Date.now() - t0) / 60000)}min`);
    }
  });
  console.log(`\nFERTIG: ${done} TL;DR · ${fail} Fehler · ${Math.round((Date.now() - t0) / 60000)}min`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
