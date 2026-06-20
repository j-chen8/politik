/**
 * Gold-Standard-Extraktion „pro Rede, Volltext" — Extraktor = Claude Code (manuell).
 *
 * Idee (User 2026-06-20): Statt das LLM mit Zusammenfassungen zu füttern (→ paraphrasierte
 * „Zitate", nur ~2,7% wörtlich verifizierbar), wird jede Rede im VOLLTEXT klassifiziert:
 *   - passt die Rede zum Feld?  → Aspekt + WÖRTLICHES Zitat (Beleg aus dem gelesenen Text)
 *   - passt sie nicht?          → korrektes Feld benennen (Selbstkorrektur der Tags)
 * Belege sind ~100% verifizierbar, weil sie aus dem gelesenen Text stammen.
 *
 * Drei Modi (tranchenweise wiederholbar):
 *   npx tsx scripts/gold-extract.ts --init
 *   npx tsx scripts/gold-extract.ts --fetch --feld "Wirtschaft" --limit 25 --out /tmp/batch.txt
 *   npx tsx scripts/gold-extract.ts --write /tmp/batch-result.json
 *
 * Das Write-Skript VERIFIZIERT jedes zitat gegen plenar_speeches.original_text (instr) und
 * meldet jede nicht-wörtliche Stelle, damit der Extraktor sie korrigiert (kein Halluzinieren).
 */
import Database from "better-sqlite3";
import { readFileSync, writeFileSync } from "fs";

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) =>
  argv.includes(k) ? argv[argv.indexOf(k) + 1] : d;
const db = new Database("politik.db");

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rede_gold_extraktion (
      rede_id TEXT, feld TEXT, aspekt TEXT,
      partei TEXT, speaker TEXT, session_nr INTEGER,
      passt INTEGER,              -- 1 = Rede gehört ins Feld, 0 = Fehl-Tag
      feld_korrekt TEXT,          -- bei passt=0: korrektes Feld
      position TEXT,              -- knappe, neutrale Position
      zitat TEXT,                 -- WÖRTLICH aus der Rede
      zitat_verifiziert INTEGER,  -- 1 = exakt im original_text gefunden
      model TEXT DEFAULT 'claude-code-manual',
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (rede_id, feld, aspekt)
    )`);
  console.log("✓ Tabelle rede_gold_extraktion bereit.");
}

function fetch() {
  const feld = arg("--feld", "Wirtschaft")!;
  const limit = Number(arg("--limit", "25"));
  const out = arg("--out", "/tmp/gold-batch.txt")!;
  const rows = db
    .prepare(
      `SELECT ps.rede_id, ps.speaker, ps.party, ps.session_id, ps.original_text
       FROM item_topics it
       JOIN plenar_speeches ps ON ps.rede_id = it.item_id
       WHERE it.source='bt_rede' AND it.aw_field = ?
         AND ps.original_text IS NOT NULL AND LENGTH(ps.original_text) > 600
         AND ps.rede_id NOT IN (
           SELECT rede_id FROM plenar_speeches WHERE rede_id IS NOT NULL
           GROUP BY rede_id HAVING COUNT(DISTINCT redner_id) > 1)
         AND ps.rede_id NOT IN (SELECT DISTINCT rede_id FROM rede_gold_extraktion WHERE feld = ?)
       ORDER BY ps.session_id DESC, LENGTH(ps.original_text) DESC
       LIMIT ?`,
    )
    .all(feld, feld, limit) as {
    rede_id: string; speaker: string; party: string; session_id: number; original_text: string;
  }[];
  const body = rows
    .map(
      (r) =>
        `##### ${r.rede_id} | ${r.speaker} | ${r.party} | Sitzung ${r.session_id}\n${r.original_text}\n`,
    )
    .join("\n");
  writeFileSync(out, body);
  console.log(`✓ ${rows.length} unbearbeitete Reden (Feld „${feld}") → ${out}`);
}

type Extraktion = { aspekt: string; position: string; zitat: string };
type RedeResult = {
  rede_id: string;
  passt: boolean;
  feld_korrekt?: string | null;
  extraktionen?: Extraktion[];
};

function write() {
  const feld = arg("--feld", "Wirtschaft")!;
  const file = arg("--write")!;
  const data = JSON.parse(readFileSync(file, "utf8")) as RedeResult[];
  const meta = db.prepare(
    `SELECT speaker, party, session_id, original_text FROM plenar_speeches WHERE rede_id = ? LIMIT 1`,
  );
  const ins = db.prepare(`
    INSERT OR REPLACE INTO rede_gold_extraktion
      (rede_id, feld, aspekt, partei, speaker, session_nr, passt, feld_korrekt, position, zitat, zitat_verifiziert)
    VALUES (@rede_id,@feld,@aspekt,@partei,@speaker,@session_nr,@passt,@feld_korrekt,@position,@zitat,@zitat_verifiziert)`);

  let nReden = 0, nFit = 0, nMiss = 0, nZitat = 0, nVerif = 0;
  const unverified: { rede_id: string; zitat: string }[] = [];

  const tx = db.transaction(() => {
    for (const r of data) {
      const m = meta.get(r.rede_id) as
        | { speaker: string; party: string; session_id: number; original_text: string }
        | undefined;
      if (!m) { console.warn(`⚠ rede_id unbekannt: ${r.rede_id}`); continue; }
      nReden++;
      const base = { rede_id: r.rede_id, feld, partei: m.party, speaker: m.speaker, session_nr: m.session_id };
      if (!r.passt) {
        nMiss++;
        ins.run({ ...base, aspekt: "", passt: 0, feld_korrekt: r.feld_korrekt ?? null, position: null, zitat: null, zitat_verifiziert: 0 });
        continue;
      }
      nFit++;
      const src = norm(m.original_text);
      for (const e of r.extraktionen ?? []) {
        nZitat++;
        const ok = e.zitat ? src.includes(norm(e.zitat)) : false;
        if (ok) nVerif++;
        else unverified.push({ rede_id: r.rede_id, zitat: e.zitat });
        ins.run({ ...base, aspekt: e.aspekt, passt: 1, feld_korrekt: null, position: e.position, zitat: e.zitat, zitat_verifiziert: ok ? 1 : 0 });
      }
    }
  });
  tx();

  console.log(`\n=== Gold-Lauf „${feld}" ===`);
  console.log(`Reden: ${nReden}  ·  passt: ${nFit}  ·  Fehl-Tag: ${nMiss}`);
  console.log(`Zitate: ${nZitat}  ·  wörtlich verifiziert: ${nVerif} (${nZitat ? Math.round((nVerif / nZitat) * 100) : 0}%)`);
  if (unverified.length) {
    console.log(`\n⚠ ${unverified.length} NICHT wörtlich (korrigieren):`);
    for (const u of unverified) console.log(`  ${u.rede_id}: „${u.zitat.slice(0, 80)}…"`);
  }
}

if (argv.includes("--init")) init();
else if (argv.includes("--fetch")) fetch();
else if (argv.includes("--write")) write();
else console.log("Modus fehlt: --init | --fetch | --write <file>");
db.close();
