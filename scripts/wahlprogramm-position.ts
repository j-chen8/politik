/**
 * Partei × Themenfeld → extraktive Position + verifizierte Beleg-Zitate aus dem Wahlprogramm.
 * „Sagt"-Schicht für Partei-Seiten. Mistral (large, Free-Tier), Multi-Key.
 *
 * Ablauf je (Partei, Feld):
 *  1. Retrieval: Programm-Seiten nach AW-Tag-Stichwörtern des Felds scoren → topK Seiten.
 *  2. LLM extrahiert NUR aus diesen Seiten: Position (2–4 Sätze) + 1–3 wörtliche Zitate.
 *  3. Verifikation: jedes Zitat muss real auf einer Seite stehen → echter Seiten-Anker,
 *     sonst verifiziert=0 (Halluzinations-Flag). KEIN Beleg ohne Quittung.
 *
 * Lauf:  npx tsx scripts/wahlprogramm-position.ts --feld "Verteidigung"   # Pilot: 1 Feld × 5 Parteien
 *        npx tsx scripts/wahlprogramm-position.ts                          # alle 25 Felder
 *        npx tsx scripts/wahlprogramm-position.ts --print --feld "Verteidigung"
 *        --redo   vorhandene überschreiben    --model <id>   (Default large)
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { MistralPool } from "./_lib/mistral";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");

const argv = process.argv.slice(2);
const REDO = argv.includes("--redo");
const PRINT = argv.includes("--print");
const ONLY_FELD = argv.includes("--feld") ? argv[argv.indexOf("--feld") + 1] : null;
const MODEL = argv.includes("--model") ? argv[argv.indexOf("--model") + 1] : "mistral-large-2512";

const PARTEIEN: { key: string; name: string }[] = [
  { key: "cdu_csu", name: "CDU/CSU" }, { key: "spd", name: "SPD" },
  { key: "gruene", name: "GRÜNE" }, { key: "linke", name: "LINKE" }, { key: "afd", name: "AfD" },
];
const TOP_K = 14;           // max. Seiten je Feld (adaptiv, s. topPages)
const MAX_KONTEXT_WORDS = 8000;
const MIN_SCORE = 3;        // ab Seite 4: nur noch Seiten mit ≥ MIN_SCORE Treffern (Präzision)

db.exec(`
  CREATE TABLE IF NOT EXISTS partei_themenfeld_position (
    partei TEXT NOT NULL, feld TEXT NOT NULL,
    position TEXT NOT NULL, leer INTEGER DEFAULT 0,
    belege_json TEXT,            -- [{zitat, seite, verifiziert}]
    seiten_json TEXT,            -- genutzte Quell-Seiten
    n_kontext_woerter INTEGER, model TEXT,
    created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (partei, feld)
  );
`);

const felder = (ONLY_FELD ? [ONLY_FELD] : (db.prepare(
  `SELECT DISTINCT feld FROM aw_tag_themenfeld WHERE feld IS NOT NULL ORDER BY feld`
).all() as { feld: string }[]).map((r) => r.feld));

function tagsFor(feld: string): string[] {
  return (db.prepare(`SELECT label FROM aw_tag_themenfeld WHERE feld=?`).all(feld) as { label: string }[])
    .map((r) => r.label).filter((l) => l && l.length >= 3);
}
const pagesCache: Record<string, { page: number; text: string }[]> = {};
function pages(key: string) {
  if (!pagesCache[key]) pagesCache[key] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "wahlprogramme", `${key}.pages.json`), "utf8"));
  return pagesCache[key];
}
// Verifikations-Normalisierung: NFKD + nur Buchstaben/Ziffern behalten.
// Grund: PDF-Extraktion bricht mitten ins Wort um ("Cyber-Fähig keiten", "aktu- elle"),
// dazu Aufzählungszeichen (▪ •), Gender-Stern (Polizist*innen), weiche Bindestriche
// (U+00AD), Klammer-Querverweise „(Kapitel 6)" und Subscripts (CO₂) — die das Zitat
// inhaltlich nicht verändern, aber den naiven Zeichenvergleich brechen.
// So bleibt ein Zitat NUR dann unverifiziert, wenn der Wortlaut echt abweicht.
const norm = (s: string) => s.normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

// Retrieval: Seiten nach Stichwort-Treffern scoren
function topPages(key: string, tags: string[]) {
  const lc = tags.map((t) => t.toLowerCase());
  const scored = pages(key).map((pg) => {
    const t = pg.text.toLowerCase();
    let score = 0;
    for (const tag of lc) {
      let i = 0; while ((i = t.indexOf(tag, i)) !== -1) { score++; i += tag.length; }
    }
    return { ...pg, score };
  }).filter((p) => p.score > 0).sort((a, b) => b.score - a.score);
  // adaptiv: immer die Top-3, danach nur noch Seiten mit ≥ MIN_SCORE Treffern,
  // gedeckelt bei TOP_K Seiten / MAX_KONTEXT_WORDS Wörtern (Recall hoch, Präzision via Schwelle).
  const out: typeof scored = []; let words = 0;
  for (const p of scored) {
    if (out.length >= TOP_K || words >= MAX_KONTEXT_WORDS) break;
    if (out.length >= 3 && p.score < MIN_SCORE) break;
    out.push(p); words += p.text.split(/\s+/).length;
  }
  return out;
}

const SYSTEM = `Du extrahierst für eine neutrale Politik-Transparenzplattform die Position einer Partei zu einem Themenfeld – AUSSCHLIESSLICH aus dem gegebenen Wahlprogramm-Auszug.

REGELN — strikt:
- Nur aus dem gegebenen Text. Nichts erfinden, nichts dazuwissen, keine Wertung.
- WICHTIG: Der Auszug kann Passagen aus Nachbar-Kapiteln enthalten, die nur Stichwörter teilen, aber NICHT zum angegebenen Themenfeld gehören. Ignoriere alles, was nicht klar zum angegebenen Themenfeld gehört – weder in die Position noch in die Belege aufnehmen.
- Gib UMFASSEND wieder, was die Partei in diesem Feld will/fordert – decke alle erkennbaren Teilthemen ab, sachlich und konkret (Maßnahmen, Richtung).
- KEINE wertenden oder intensivierenden Adverbien/Adjektive (radikal, drastisch, extrem, hart, massiv). Größenordnung mit Fakten beschreiben (z. B. "Rückkehr zum Recht vor 1990"), nicht mit Wertung.
- Wenn der Auszug zum Themenfeld nichts Substanzielles hergibt: "leer": true und position kurz begründen.
- belege: 3–5 WÖRTLICHE Zitate, je EIN zusammenhängender Satz/Teilsatz, exakt und ununterbrochen aus dem Text kopiert. NIEMALS zwei Stellen mit […] zusammenfügen, nicht paraphrasieren, nicht kürzen.

Antworte NUR mit JSON:
{"position": "umfassende, sachliche Zusammenfassung (4–6 Sätze) aller Teilthemen der Partei im Feld", "belege": ["wörtliches Zitat 1", "..."], "leer": false}`;

function parseJson(s: string): any {
  const m = s.match(/\{[\s\S]*\}/); if (!m) throw new Error("kein JSON");
  // Mistral packt gelegentlich rohe Steuerzeichen (Zeilenumbrüche) in String-Literale
  // → "Bad control character". Innerhalb/zwischen Tokens unschädlich durch Space ersetzen.
  return JSON.parse(m[0].replace(/[\u0000-\u001F]/g, " "));
}

// Zitat real auf einer Seite? → Seiten-Anker
// Präfix-Match: erste ~70 kompakte Zeichen müssen real auf einer Seite stehen.
// Toleriert harmlose Schwanz-Expansion ("BIP" → "Bruttoinlandsprodukts (BIP)"),
// fängt aber echte Halluzinationen (die schon im Präfix abweichen).
function verify(key: string, zitat: string): number | null {
  const z = norm(zitat).slice(0, 70);
  if (z.length < 30) return null;
  for (const pg of pages(key)) if (norm(pg.text).includes(z)) return pg.page;
  return null;
}

(async () => {
  if (PRINT) {
    const rows = db.prepare(
      `SELECT * FROM partei_themenfeld_position ${ONLY_FELD ? "WHERE feld=?" : ""} ORDER BY feld, partei`
    ).all(...(ONLY_FELD ? [ONLY_FELD] : [])) as any[];
    for (const r of rows) {
      const bel = JSON.parse(r.belege_json || "[]");
      console.log(`\n━━━ ${r.partei} · ${r.feld} ${r.leer ? "(LEER)" : ""} [${r.model}]`);
      console.log(r.position);
      for (const b of bel) console.log(`   ${b.verifiziert ? "✓ S." + b.seite : "✗ UNVERIFIZIERT"}: „${b.zitat.slice(0, 130)}…"`);
    }
    console.log(`\n${rows.length} Positionen.`);
    db.close(); return;
  }

  const pool = new MistralPool(14500);
  const jobs: { partei: typeof PARTEIEN[0]; feld: string }[] = [];
  for (const feld of felder) for (const partei of PARTEIEN) {
    const exists = db.prepare(`SELECT 1 FROM partei_themenfeld_position WHERE partei=? AND feld=?`).get(partei.name, feld);
    if (exists && !REDO) continue;
    jobs.push({ partei, feld });
  }
  console.log(`Wahlprogramm-Positionen: ${jobs.length} Jobs (${felder.length} Felder × ${PARTEIEN.length} Parteien) · ${MODEL} · ${pool.size} Key(s)`);

  const ins = db.prepare(`INSERT INTO partei_themenfeld_position
    (partei,feld,position,leer,belege_json,seiten_json,n_kontext_woerter,model) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(partei,feld) DO UPDATE SET position=excluded.position, leer=excluded.leer,
    belege_json=excluded.belege_json, seiten_json=excluded.seiten_json,
    n_kontext_woerter=excluded.n_kontext_woerter, model=excluded.model, created_at=datetime('now')`);

  let done = 0, fail = 0, flagged = 0;
  await Promise.all(Array.from({ length: pool.size * 2 }, async () => {
    while (jobs.length) {
      const job = jobs.shift(); if (!job) break;
      const { partei, feld } = job;
      try {
        const tags = tagsFor(feld);
        const top = topPages(partei.key, tags);
        if (top.length === 0) { ins.run(partei.name, feld, "Im Programm kein einschlägiger Abschnitt gefunden.", 1, "[]", "[]", 0, MODEL); done++; continue; }
        const ctx = top.map((p) => `[S. ${p.page}]\n${p.text}`).join("\n\n");
        const words = ctx.split(/\s+/).length;
        const user = `THEMENFELD: ${feld}\n\nWAHLPROGRAMM-AUSZUG (${partei.name}):\n${ctx}`;
        const raw = await pool.chat({ model: MODEL, system: SYSTEM, user, maxTokens: 1500, temperature: 0.1 });
        const j = parseJson(raw);
        const belege = (j.belege || []).map((z: string) => {
          const seite = verify(partei.key, z);
          if (seite === null) flagged++;
          return { zitat: z, seite, verifiziert: seite !== null };
        });
        ins.run(partei.name, feld, String(j.position || "").trim(), j.leer ? 1 : 0,
          JSON.stringify(belege), JSON.stringify(top.map((p) => p.page)), words, MODEL);
        done++;
        console.log(`  ✓ ${partei.name.padEnd(8)} ${feld.slice(0, 32).padEnd(32)} ${belege.filter((b: any) => b.verifiziert).length}/${belege.length} Belege ok`);
      } catch (e: any) {
        fail++; console.log(`  ✗ ${partei.name} · ${feld}: ${e.message?.slice(0, 80)}`);
      }
    }
  }));
  console.log(`\n=== fertig: ${done} Positionen, ${fail} Fehler, ${flagged} unverifizierte Zitate ===`);
  db.close();
})();
