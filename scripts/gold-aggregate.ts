/**
 * Aggregiert die Per-Rede-Gold-Extraktion (rede_gold_extraktion, passt=1) zu
 * Aspekt × Partei-Zellen für die UI — das fehlende Bindeglied Gold → Seite.
 *
 * Jede Zelle = mehrere Punkte, jeder Punkt mit WÖRTLICHEM Zitat + Quelle (rede_id,
 * Redner) + verifiziert-Flag. Partei kanonisiert auf die 5 Fraktionen.
 * Aspekt-Labels gegen die Matrix normalisiert (LLM-Drift: Tippfehler/Feld-Name).
 *
 *   npx tsx scripts/gold-aggregate.ts --feld "Wirtschaft"
 *   npx tsx scripts/gold-aggregate.ts --all
 */
import Database from "better-sqlite3";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const db = new Database("politik.db");
const normA = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");

function kanon(p: string | null): string | null {
  const s = (p ?? "").toLowerCase();
  if (s.includes("grün") || s.includes("gruen") || s.includes("b90")) return "GRÜNE";
  if (s.includes("linke")) return "LINKE";
  if (s === "afd" || s.includes("alternative für")) return "AfD";
  if (s === "spd" || s.includes("sozialdemokrat")) return "SPD";
  if (s.includes("cdu") || s.includes("csu") || s.includes("union")) return "CDU/CSU";
  return null;
}

db.exec(`CREATE TABLE IF NOT EXISTS partei_aspekt_gold (
  feld TEXT, aspekt TEXT, partei TEXT,
  punkte_json TEXT, n_reden INTEGER, model TEXT DEFAULT 'claude-code-gold',
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (feld, aspekt, partei))`);
const ins = db.prepare(`INSERT OR REPLACE INTO partei_aspekt_gold (feld, aspekt, partei, punkte_json, n_reden) VALUES (?,?,?,?,?)`);

function aggregate(feld: string) {
  const MATRIX_ASP: string[] = (VERGLEICH_MATRIX[feld]?.aspekte ?? []).map((a: any) => a.label);
  const aspByNorm = new Map(MATRIX_ASP.map((l) => [normA(l), l]));
  const canonAspekt = (a: string): string | null => {
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
  };

  const rows = db
    .prepare(`SELECT aspekt, partei, speaker, rede_id, position, zitat, zitat_verifiziert AS verif
              FROM rede_gold_extraktion WHERE feld=? AND passt=1 AND aspekt <> ''`)
    .all(feld) as any[];
  const cells: Record<string, any[]> = {};
  let skipped = 0, droppedAsp = 0;
  for (const r of rows) {
    const p = kanon(r.partei);
    if (!p) { skipped++; continue; }
    const asp = canonAspekt(r.aspekt);
    if (!asp) { droppedAsp++; continue; }
    (cells[`${asp}||${p}`] ??= []).push({ position: r.position, zitat: r.zitat, rede_id: r.rede_id, speaker: r.speaker, verifiziert: !!r.verif });
  }
  db.prepare(`DELETE FROM partei_aspekt_gold WHERE feld=?`).run(feld);
  for (const [key, pts] of Object.entries(cells)) {
    const [aspekt, partei] = key.split("||");
    ins.run(feld, aspekt, partei, JSON.stringify(pts), new Set(pts.map((x: any) => x.rede_id)).size);
  }
  const verif = rows.filter((r) => r.verif).length;
  console.log(`  ✓ ${feld}: ${Object.keys(cells).length} Zellen, ${rows.length} Punkte, ${Math.round((verif / Math.max(rows.length, 1)) * 100)}% wörtlich (${droppedAsp} Nicht-Matrix verworfen)`);
}

if (argv.includes("--all")) {
  const felder = (db.prepare(`SELECT DISTINCT feld FROM rede_gold_extraktion WHERE passt=1 ORDER BY feld`).all() as any[]).map((r) => r.feld);
  console.log(`Aggregiere ${felder.length} Felder:`);
  for (const f of felder) aggregate(f);
} else {
  aggregate(argv.includes("--feld") ? argv[argv.indexOf("--feld") + 1] : "Wirtschaft");
}
db.close();
