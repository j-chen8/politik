/**
 * Vergleich ALT (Top-6, 3500 W, 3 Belege) vs NEU (adaptiv Top-14, 8000 W, 5 Belege)
 * für EIN Feld über alle 5 Parteien. Schreibt NICHTS in die DB — nur Konsolen-Vergleich.
 *
 * Lauf: npx tsx scripts/wahlprogramm-compare.ts "Raumordnung, Bau- und Wohnungswesen"
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { MistralPool } from "./_lib/mistral";

const db = new Database(path.join(process.cwd(), "politik.db"));
const FELD = process.argv[2] || "Raumordnung, Bau- und Wohnungswesen";
const MODEL = "mistral-large-2512";
const PARTEIEN = [
  { key: "cdu_csu", name: "CDU/CSU" }, { key: "spd", name: "SPD" },
  { key: "gruene", name: "GRÜNE" }, { key: "linke", name: "LINKE" }, { key: "afd", name: "AfD" },
];

// NEU: adaptiv – alle Seiten mit Score >= MIN_SCORE, gedeckelt bei MAX_K / MAX_WORDS
const MAX_K = 14, MAX_WORDS = 8000, MIN_SCORE = 3;

const pagesCache: Record<string, any[]> = {};
const pages = (k: string) => pagesCache[k] || (pagesCache[k] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "wahlprogramme", `${k}.pages.json`), "utf8")));
const norm = (s: string) => s.replace(/[„“”"'»«…\s\-–—‐‑]/g, "").toLowerCase().trim();

function tags(feld: string): string[] {
  return (db.prepare(`SELECT label FROM aw_tag_themenfeld WHERE feld=?`).all(feld) as any[])
    .map((r) => r.label.toLowerCase()).filter((l) => l.length >= 3);
}
function scorePages(key: string, tg: string[]) {
  return pages(key).map((pg: any) => {
    const t = pg.text.toLowerCase(); let s = 0;
    for (const tag of tg) { let i = 0; while ((i = t.indexOf(tag, i)) !== -1) { s++; i += tag.length; } }
    return { page: pg.page, text: pg.text, score: s };
  }).filter((p: any) => p.score > 0).sort((a: any, b: any) => b.score - a.score);
}
function pick(scored: any[], maxK: number, maxWords: number, minScore: number) {
  const out: any[] = []; let w = 0;
  for (const p of scored) {
    if (out.length >= maxK || w >= maxWords) break;
    if (p.score < minScore && out.length >= 3) break; // mind. 3, dann Schwellwert
    out.push(p); w += p.text.split(/\s+/).length;
  }
  return out;
}
const verify = (key: string, z: string) => {
  const q = norm(z).slice(0, 70); if (q.length < 30) return null;
  for (const p of pages(key)) if (norm(p.text).includes(q)) return p.page; return null;
};

const SYSTEM = `Du extrahierst für eine neutrale Politik-Transparenzplattform die Position einer Partei zu einem Themenfeld – AUSSCHLIESSLICH aus dem gegebenen Wahlprogramm-Auszug.

REGELN — strikt:
- Nur aus dem gegebenen Text. Nichts erfinden, keine Wertung, keine intensivierenden Adverbien.
- WICHTIG: Der Auszug kann Passagen enthalten, die NICHT zum Themenfeld gehören (Nachbar-Kapitel, die nur Stichwörter teilen). Ignoriere alles, was nicht klar zum Themenfeld "${FELD}" gehört – weder in die Position noch in die Belege aufnehmen.
- Gib UMFASSEND wieder, was die Partei in diesem Feld will/fordert – decke alle erkennbaren Teilthemen ab, sachlich und konkret.
- belege: 3–5 WÖRTLICHE Zitate, je EIN zusammenhängender Satz, exakt kopiert, NIEMALS mit […] zusammengefügt.

Antworte NUR mit JSON: {"position": "umfassende, sachliche Zusammenfassung (4–6 Sätze)", "belege": ["...", "..."], "leer": false}`;

(async () => {
  const pool = new MistralPool(14500);
  const tg = tags(FELD);
  console.log(`\n╔══ VERGLEICH: ${FELD} ══╗\n`);
  for (const p of PARTEIEN) {
    const scored = scorePages(p.key, tg);
    const totalMass = scored.reduce((a, b) => a + b.score, 0);
    const altPick = scored.slice(0, 6);
    const neuPick = pick(scored, MAX_K, MAX_WORDS, MIN_SCORE);
    const altMass = altPick.reduce((a, b) => a + b.score, 0);
    const neuMass = neuPick.reduce((a, b) => a + b.score, 0);

    const old = db.prepare(`SELECT position, belege_json FROM partei_themenfeld_position WHERE partei=? AND feld=?`)
      .get(p.name, FELD) as any;
    const oldBel = JSON.parse(old?.belege_json || "[]");

    const ctx = neuPick.map((x) => `[S. ${x.page}]\n${x.text}`).join("\n\n");
    let j: any = null;
    for (let a = 0; a < 3 && !j; a++) {
      const raw = await pool.chat({ model: MODEL, system: SYSTEM, user: `THEMENFELD: ${FELD}\n\nWAHLPROGRAMM-AUSZUG (${p.name}):\n${ctx}`, maxTokens: 900, temperature: 0.1 });
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { j = JSON.parse(m[0]); } catch { /* retry */ } }
    }
    if (!j) { console.log(`\n━━ ${p.name}: keine valide Antwort, übersprungen ━━`); continue; }
    const neuBel = (j.belege || []).map((z: string) => ({ zitat: z, seite: verify(p.key, z) }));

    console.log(`\n━━━━━━━━━ ${p.name} ━━━━━━━━━`);
    console.log(`Abdeckung: ALT ${altPick.length} Seiten / ${(100*altMass/totalMass).toFixed(0)}% Masse  →  NEU ${neuPick.length} Seiten / ${(100*neuMass/totalMass).toFixed(0)}% Masse`);
    console.log(`\n  ── ALT (${old?.position?.split(/\s+/).length || 0} W, ${oldBel.length} Belege) ──`);
    console.log("  " + (old?.position || "(keine)"));
    console.log(`\n  ── NEU (${String(j.position).split(/\s+/).length} W, ${neuBel.length} Belege) ──`);
    console.log("  " + j.position);
    console.log(`  Belege NEU: ${neuBel.filter((b: any) => b.seite).length}/${neuBel.length} verifiziert`);
  }
  db.close();
})();
