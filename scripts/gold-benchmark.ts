/**
 * Benchmark: Volltext-Klassifikator (Haiku 4.5 vs. Mistral medium) gegen den
 * Claude-Code-Gold-Satz (rede_gold_extraktion, Feld Wirtschaft).
 *
 * Gleicher Prompt + gleiche Methode für beide (fair): Volltext rein → JSON
 *   {passt, feld_korrekt, extraktionen:[{aspekt, position, zitat}]}.
 * Jedes zitat wird deterministisch gegen original_text verifiziert (Leitplanke).
 *
 *   npx tsx scripts/gold-benchmark.ts --run --model haiku
 *   npx tsx scripts/gold-benchmark.ts --run --model mistral
 *   npx tsx scripts/gold-benchmark.ts --score
 */
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { MistralPool } from "./_lib/mistral";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const db = new Database("politik.db");
const FELD = "Wirtschaft";
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function anthropicKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const m = fs.readFileSync(".env", "utf8").match(/^ANTHROPIC_API_KEY\s*=\s*["']?([^"'\s]+)/m);
  if (!m) throw new Error("ANTHROPIC_API_KEY fehlt");
  return m[1];
}

const ASPEKTE: string[] = (VERGLEICH_MATRIX[FELD]?.aspekte ?? []).map((a: any) => a.label);
const FELDER: string[] = (
  db.prepare(`SELECT DISTINCT aw_field FROM item_topics WHERE source='bt_rede' ORDER BY aw_field`).all() as {
    aw_field: string;
  }[]
).map((r) => r.aw_field);

const SYS =
  'Du klassifizierst eine Bundestagsrede gegen das Politikfeld „Wirtschaft".\n' +
  "Entscheide zuerst: Ist die Rede PRIMÄR (Hauptthema) dem Feld Wirtschaft zuzuordnen?\n" +
  "- Wenn JA: nenne je behandeltem Wirtschaft-ASPEKT (nur aus der Liste) eine knappe neutrale " +
  "Position und EIN Zitat, das du WÖRTLICH und EXAKT aus dem Redetext kopierst (kein Paraphrasieren).\n" +
  "- Wenn NEIN: gib das korrekte Primär-Feld an (aus der Feld-Liste).\n" +
  'NUR JSON: {"passt": true|false, "feld_korrekt": "<Feld oder null>", ' +
  '"extraktionen": [{"aspekt":"<exakt ein Label>","position":"<knapp>","zitat":"<woertlich>"}]}';

const SYS_V2 =
  'Du klassifizierst eine Bundestagsrede gegen das Politikfeld „Wirtschaft".\n' +
  "SCHRITT 1 — Primär-Feld: Worum geht es im KERN? Wirtschafts-Vokabular (Kosten, Standort, " +
  "Arbeitsplätze, Wettbewerb) allein macht eine Rede NICHT zu Wirtschaft — fast jede Debatte " +
  "enthält es. Test: Verschwände der wirtschaftliche Bezug und die Rede wäre sinnlos → Wirtschaft. " +
  "Geht es im Kern um Autos/Verkehr, Gesundheit/Apotheken, Kultur, Energie-Versorgung etc. → jenes Feld.\n" +
  'AUSNAHME: Geht es im Kern um Energie-PREISE/-KOSTEN und ihre Wirkung auf Industrie/' +
  'Wettbewerbsfähigkeit, ist das Wirtschaft (Aspekt „Energiekosten für die Wirtschaft"). Reine ' +
  "Versorgungssicherheit/Netz/Kapazitätsmarkt OHNE Kosten- oder Standort-Argument ist Energie.\n" +
  "SCHRITT 2 — wenn primär Wirtschaft: Nenne ALLE behandelten Aspekte aus der Liste (mehrere sind " +
  "die REGEL — typisch 2–4, selten nur 1). Je Aspekt eine knappe neutrale Position und EIN Zitat, " +
  "das du WÖRTLICH und EXAKT aus dem Redetext kopierst (kein Paraphrasieren, keine Auslassungen).\n" +
  "   wenn NICHT primär Wirtschaft: gib das korrekte Primär-Feld an (aus der Feld-Liste).\n" +
  'NUR JSON: {"passt": true|false, "feld_korrekt": "<Feld oder null>", ' +
  '"extraktionen": [{"aspekt":"<exakt ein Label>","position":"<knapp>","zitat":"<woertlich>"}]}';

const buildUser = (text: string) =>
  [
    `WIRTSCHAFT-ASPEKTE (genau diese Labels):`,
    ...ASPEKTE.map((a) => `- ${a}`),
    ``,
    `MÖGLICHE FELDER (falls NICHT Wirtschaft):`,
    FELDER.join(" · "),
    ``,
    `REDETEXT:`,
    text,
  ].join("\n");

function parseJSON(raw: string): any | null {
  try {
    const c = raw
      .replace(/```json|```/g, "")
      .split("")
      .map((ch) => (ch.charCodeAt(0) < 32 ? " " : ch))
      .join("");
    const s = c.indexOf("{"), e = c.lastIndexOf("}");
    if (s < 0 || e < 0) return null;
    return JSON.parse(c.slice(s, e + 1));
  } catch {
    return null;
  }
}

function getReden() {
  return (
    db
      .prepare(
        `SELECT DISTINCT g.rede_id, ps.original_text AS text
         FROM rede_gold_extraktion g JOIN plenar_speeches ps ON ps.rede_id=g.rede_id
         WHERE g.feld=? GROUP BY g.rede_id`,
      )
      .all(FELD) as { rede_id: string; text: string }[]
  );
}

function initTable() {
  db.exec(`CREATE TABLE IF NOT EXISTS rede_gold_benchmark (
    rede_id TEXT, model TEXT, passt INTEGER, feld_korrekt TEXT,
    aspekte_json TEXT, n_zitat INTEGER, n_verif INTEGER, ok INTEGER,
    created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (rede_id, model))`);
}

function store(model: string, redeId: string, text: string, res: any | null) {
  const ins = db.prepare(`INSERT OR REPLACE INTO rede_gold_benchmark
    (rede_id, model, passt, feld_korrekt, aspekte_json, n_zitat, n_verif, ok)
    VALUES (?,?,?,?,?,?,?,?)`);
  if (!res || typeof res.passt !== "boolean") {
    ins.run(redeId, model, null, null, null, 0, 0, 0);
    return;
  }
  const src = norm(text);
  const exts = (res.extraktionen ?? []).map((e: any) => {
    const verif = e?.zitat ? src.includes(norm(String(e.zitat))) : false;
    return { aspekt: String(e?.aspekt ?? ""), position: String(e?.position ?? ""), zitat: String(e?.zitat ?? ""), verif };
  });
  ins.run(
    redeId, model, res.passt ? 1 : 0, res.feld_korrekt ?? null,
    JSON.stringify(exts), exts.length, exts.filter((e: any) => e.verif).length, 1,
  );
}

async function run(model: string) {
  initTable();
  const reden = getReden();
  console.log(`\n${model}: ${reden.length} Reden, ${ASPEKTE.length} Aspekte, ${FELDER.length} Felder`);
  const useHaiku = model === "haiku";
  const client = useHaiku ? new Anthropic({ apiKey: anthropicKey() }) : null;
  const pool = useHaiku ? null : new MistralPool(900);
  const mid = useHaiku ? "claude-haiku-4-5" : (arg("--mistral-model", "mistral-medium-latest")!);
  const v2 = argv.includes("--v2");
  const SYSTEM = v2 ? SYS_V2 : SYS;
  const label = useHaiku ? (v2 ? "claude-haiku-4-5-v2" : "claude-haiku-4-5") : mid;
  let done = 0, fail = 0;
  for (const r of reden) {
    let res: any | null = null;
    for (let a = 0; a < 4 && !res; a++) {
      try {
        let raw: string;
        if (useHaiku) {
          const msg = await client!.messages.create({
            model: mid, max_tokens: 2000, system: SYSTEM,
            messages: [{ role: "user", content: buildUser(r.text) }],
          });
          raw = msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
        } else {
          raw = await pool!.chat({ model: mid, system: SYSTEM, user: buildUser(r.text), maxTokens: 2000, temperature: 0.1 });
        }
        res = parseJSON(raw);
      } catch (e: any) {
        await sleep(1500);
      }
    }
    if (!res) fail++;
    store(label, r.rede_id, r.text, res);
    done++;
    if (done % 10 === 0) console.log(`  ${done}/${reden.length} (${fail} parse-fail)`);
  }
  console.log(`✓ ${model} fertig: ${done} Reden, ${fail} ohne JSON.`);
}

function score() {
  const reden = getReden().map((r) => r.rede_id);
  const goldRows = db.prepare(`SELECT rede_id, passt, feld_korrekt, aspekt FROM rede_gold_extraktion WHERE feld=?`).all(FELD) as any[];
  const gold: Record<string, { passt: number; feld_korrekt: string | null; aspekte: Set<string> }> = {};
  for (const g of goldRows) {
    const x = (gold[g.rede_id] ??= { passt: g.passt, feld_korrekt: g.feld_korrekt, aspekte: new Set() });
    if (g.passt === 1 && g.aspekt) x.aspekte.add(g.aspekt);
  }
  const models = (db.prepare(`SELECT DISTINCT model FROM rede_gold_benchmark ORDER BY model`).all() as any[]).map((r) => r.model);
  for (const model of models) {
    const rows = db.prepare(`SELECT * FROM rede_gold_benchmark WHERE model=?`).all(model) as any[];
    const by: Record<string, any> = {};
    for (const r of rows) by[r.rede_id] = r;
    let n = 0, parsed = 0, passtMatch = 0, fehlRecall = 0, fehlTotal = 0, feldMatch = 0;
    let aspRecallSum = 0, aspGoldReden = 0, zit = 0, zitVerif = 0;
    for (const rid of reden) {
      const g = gold[rid], m = by[rid];
      if (!g) continue;
      n++;
      if (!m || !m.ok) continue;
      parsed++;
      if (m.passt === g.passt) passtMatch++;
      if (g.passt === 0) {
        fehlTotal++;
        if (m.passt === 0) { fehlRecall++; if ((m.feld_korrekt ?? "") === (g.feld_korrekt ?? "")) feldMatch++; }
      }
      if (g.passt === 1 && g.aspekte.size) {
        aspGoldReden++;
        const ma = new Set<string>((JSON.parse(m.aspekte_json || "[]") as any[]).map((e) => e.aspekt));
        let hit = 0; for (const a of g.aspekte) if (ma.has(a)) hit++;
        aspRecallSum += hit / g.aspekte.size;
      }
      zit += m.n_zitat; zitVerif += m.n_verif;
    }
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
    console.log(`\n=== ${model} (n=${n}, geparst ${parsed}) ===`);
    console.log(`  passt-Übereinstimmung (primär Wirtschaft?):  ${passtMatch}/${parsed} = ${pct(passtMatch, parsed)}%`);
    console.log(`  Fehl-Tag erkannt (Recall der ${fehlTotal} echten): ${fehlRecall}/${fehlTotal} = ${pct(fehlRecall, fehlTotal)}%`);
    console.log(`  davon korrektes Primär-Feld getroffen:       ${feldMatch}/${fehlRecall} = ${pct(feldMatch, fehlRecall)}%`);
    console.log(`  Aspekt-Recall (vs. Gold, ⌀ über ${aspGoldReden} Reden): ${pct(aspRecallSum, aspGoldReden)}%`);
    console.log(`  Zitate wörtlich verifiziert:                 ${zitVerif}/${zit} = ${pct(zitVerif, zit)}%`);
  }
}

(async () => {
  if (argv.includes("--run")) await run(arg("--model", "haiku")!);
  else if (argv.includes("--score")) score();
  else console.log("--run --model haiku|mistral  |  --score");
  db.close();
})();
