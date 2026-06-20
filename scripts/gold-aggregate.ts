/**
 * Aggregiert die Per-Rede-Gold-Extraktion (rede_gold_extraktion, passt=1) zu
 * Aspekt × Partei-Zellen für die UI — das fehlende Bindeglied Gold → Seite.
 *
 * Jede Zelle = mehrere Punkte, jeder Punkt mit WÖRTLICHEM Zitat + Quelle (rede_id,
 * Redner) + verifiziert-Flag. Partei kanonisiert auf die 5 Fraktionen.
 *
 *   npx tsx scripts/gold-aggregate.ts --feld "Wirtschaft"
 */
import Database from "better-sqlite3";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const FELD = argv.includes("--feld") ? argv[argv.indexOf("--feld") + 1] : "Wirtschaft";
const db = new Database("politik.db");

// Aspekt-Labels gegen die Matrix normalisieren: LLM driftet gelegentlich (Tippfehler,
// Feld-Name statt Aspekt). Exakt → normalisiert → Fuzzy-Prefix(≥14); sonst verwerfen.
const MATRIX_ASP: string[] = (VERGLEICH_MATRIX[FELD]?.aspekte ?? []).map((a: any) => a.label);
const normA = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
const aspByNorm = new Map(MATRIX_ASP.map((l) => [normA(l), l]));
function canonAspekt(a: string): string | null {
  if (MATRIX_ASP.includes(a)) return a;
  const n = normA(a);
  if (aspByNorm.has(n)) return aspByNorm.get(n)!;
  let best: string | null = null, bestLen = 0;
  for (const l of MATRIX_ASP) {
    const ln = normA(l);
    let i = 0;
    while (i < n.length && i < ln.length && n[i] === ln[i]) i++;
    if (i > bestLen) { bestLen = i; best = l; }
  }
  return bestLen >= 14 ? best : null;
}

function kanon(p: string | null): string | null {
  const s = (p ?? "").toLowerCase();
  if (s.includes("grün") || s.includes("gruen") || s.includes("b90")) return "GRÜNE";
  if (s.includes("linke")) return "LINKE";
  if (s === "afd" || s.includes("alternative für")) return "AfD";
  if (s === "spd" || s.includes("sozialdemokrat")) return "SPD";
  if (s.includes("cdu") || s.includes("csu") || s.includes("union")) return "CDU/CSU";
  return null; // Minister:innen ohne Fraktion etc.
}

db.exec(`CREATE TABLE IF NOT EXISTS partei_aspekt_gold (
  feld TEXT, aspekt TEXT, partei TEXT,
  punkte_json TEXT,   -- [{position, zitat, rede_id, speaker, verifiziert}]
  n_reden INTEGER, model TEXT DEFAULT 'claude-code-gold',
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (feld, aspekt, partei))`);

const rows = db
  .prepare(
    `SELECT aspekt, partei, speaker, rede_id, position, zitat, zitat_verifiziert AS verif
     FROM rede_gold_extraktion WHERE feld=? AND passt=1 AND aspekt <> ''`,
  )
  .all(FELD) as any[];

const cells: Record<string, any[]> = {};
let skipped = 0, droppedAsp = 0;
for (const r of rows) {
  const p = kanon(r.partei);
  if (!p) { skipped++; continue; }
  const asp = canonAspekt(r.aspekt);
  if (!asp) { droppedAsp++; continue; }
  (cells[`${asp}||${p}`] ??= []).push({
    position: r.position, zitat: r.zitat, rede_id: r.rede_id,
    speaker: r.speaker, verifiziert: !!r.verif,
  });
}

db.prepare(`DELETE FROM partei_aspekt_gold WHERE feld=?`).run(FELD);
const ins = db.prepare(
  `INSERT OR REPLACE INTO partei_aspekt_gold (feld, aspekt, partei, punkte_json, n_reden) VALUES (?,?,?,?,?)`,
);
for (const [key, pts] of Object.entries(cells)) {
  const [aspekt, partei] = key.split("||");
  ins.run(FELD, aspekt, partei, JSON.stringify(pts), new Set(pts.map((x: any) => x.rede_id)).size);
}

const verif = rows.filter((r) => r.verif).length;
console.log(
  `✓ Feld „${FELD}": ${Object.keys(cells).length} Zellen aus ${rows.length} Gold-Punkten ` +
    `(${verif}/${rows.length} = ${Math.round((verif / Math.max(rows.length, 1)) * 100)}% wörtlich; ` +
    `${skipped} ohne Fraktion, ${droppedAsp} Nicht-Matrix-Aspekt verworfen)`,
);
db.close();
