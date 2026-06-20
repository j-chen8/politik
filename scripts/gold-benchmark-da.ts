/**
 * Design-A-Benchmark: EIN Call pro Rede wählt das Primär-Feld aus ALLEN 25 Feldern
 * und extrahiert dessen Aspekte. Gegen die 40 Claude-Code-Gold-Reden gescort.
 * Beantwortet: hält die (schwerere) 25-Feld-Klassifikation die Qualität?
 *
 *   npx tsx scripts/gold-benchmark-da.ts
 */
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { runPool } from "./_lib/mistral";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const db = new Database("politik.db");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function anthropicKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  return fs.readFileSync(".env", "utf8").match(/^ANTHROPIC_API_KEY\s*=\s*["']?([^"'\s]+)/m)![1];
}

const FELDER = Object.keys(VERGLEICH_MATRIX);
const ASPEKTE_VON: Record<string, Set<string>> = {};
const FA = FELDER.map((f) => {
  const asp = (VERGLEICH_MATRIX[f].aspekte ?? []).map((a: any) => a.label);
  ASPEKTE_VON[f] = new Set(asp);
  return `## ${f}\n` + asp.map((a: string) => `- ${a}`).join("\n");
}).join("\n\n");

const SYS =
  "Du ordnest eine Bundestagsrede GENAU EINEM Politikfeld zu (ihr Hauptthema) und " +
  "extrahierst Positionen für dieses Feld.\n" +
  "SCHRITT 1: Wähle aus der Feld-Liste das EINE Primär-Feld — das Thema, um das es im " +
  "Kern geht. Wirtschafts-/Kosten-Vokabular allein macht eine Rede nicht zu Wirtschaft.\n" +
  "SCHRITT 2: Nenne je behandeltem Aspekt DIESES Feldes (nur aus dessen Aspekt-Liste) eine " +
  "knappe neutrale Position und EIN Zitat, das du WÖRTLICH und EXAKT aus dem Text kopierst.\n" +
  'NUR JSON: {"primaer_feld":"<exakt ein Feld>","extraktionen":[{"aspekt":"<exakt ein Aspekt ' +
  'dieses Feldes>","position":"<knapp>","zitat":"<woertlich>"}]}';

const buildUser = (text: string) => `FELDER MIT ASPEKTEN:\n${FA}\n\nREDETEXT:\n${text}`;

function parseJSON(raw: string): any | null {
  try {
    const c = raw.replace(/```json|```/g, "").split("").map((ch) => (ch.charCodeAt(0) < 32 ? " " : ch)).join("");
    const s = c.indexOf("{"), e = c.lastIndexOf("}");
    return s < 0 || e < 0 ? null : JSON.parse(c.slice(s, e + 1));
  } catch {
    return null;
  }
}

// Ground truth: 40 manuelle Gold-Reden
const goldRows = db
  .prepare(`SELECT rede_id, passt, feld_korrekt, aspekt FROM rede_gold_extraktion WHERE feld='Wirtschaft' AND model='claude-code-manual'`)
  .all() as any[];
const gold: Record<string, { primaer: string; aspekte: Set<string> }> = {};
for (const g of goldRows) {
  const x = (gold[g.rede_id] ??= { primaer: g.passt === 1 ? "Wirtschaft" : (g.feld_korrekt ?? "?"), aspekte: new Set() });
  if (g.passt === 1 && g.aspekt) x.aspekte.add(g.aspekt);
}
const ids = Object.keys(gold);
const textOf = new Map<string, string>();
for (const r of db.prepare(`SELECT rede_id, original_text FROM plenar_speeches WHERE rede_id IN (${ids.map(() => "?").join(",")})`).all(...ids) as any[])
  if (!textOf.has(r.rede_id)) textOf.set(r.rede_id, r.original_text);

(async () => {
  console.log(`Design-A-Benchmark: ${ids.length} Gold-Reden, ${FELDER.length} Felder, ${Object.values(ASPEKTE_VON).reduce((a, s) => a + s.size, 0)} Aspekte`);
  const client = new Anthropic({ apiKey: anthropicKey() });
  const res: Record<string, any> = {};
  await runPool(ids, 5, async (rid) => {
    const text = textOf.get(rid);
    if (!text) return;
    let r: any = null;
    for (let a = 0; a < 4 && !r; a++) {
      try {
        const msg = await client.messages.create({ model: "claude-haiku-4-5", max_tokens: 2000, system: SYS, messages: [{ role: "user", content: buildUser(text) }] });
        r = parseJSON(msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join(""));
      } catch { await sleep(2000); }
    }
    res[rid] = r;
  });

  // Score
  let parsed = 0, primMatch = 0, wirtRecallN = 0, wirtRecallHit = 0, fehlN = 0, fehlHit = 0;
  let aspSum = 0, aspN = 0, zit = 0, zitOk = 0, aspInvalid = 0, aspTotal = 0;
  for (const rid of ids) {
    const g = gold[rid], m = res[rid];
    if (!m || !m.primaer_feld) continue;
    parsed++;
    const src = norm(textOf.get(rid)!);
    if (m.primaer_feld === g.primaer) primMatch++;
    if (g.primaer === "Wirtschaft") { wirtRecallN++; if (m.primaer_feld === "Wirtschaft") wirtRecallHit++; }
    else { fehlN++; if (m.primaer_feld !== "Wirtschaft") fehlHit++; }
    if (g.primaer === "Wirtschaft" && m.primaer_feld === "Wirtschaft" && g.aspekte.size) {
      aspN++;
      const ma = new Set<string>((m.extraktionen ?? []).map((e: any) => e.aspekt));
      let hit = 0; for (const a of g.aspekte) if (ma.has(a)) hit++;
      aspSum += hit / g.aspekte.size;
    }
    const validAsp = ASPEKTE_VON[m.primaer_feld] ?? new Set();
    for (const e of m.extraktionen ?? []) {
      aspTotal++; if (!validAsp.has(e.aspekt)) aspInvalid++;
      if (e.zitat) { zit++; if (src.includes(norm(String(e.zitat)))) zitOk++; }
    }
  }
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  console.log(`\n=== Design A (Haiku, 1 Call/Rede, 25 Felder) — n=${ids.length}, geparst ${parsed} ===`);
  console.log(`  Primär-Feld exakt richtig:        ${primMatch}/${parsed} = ${pct(primMatch, parsed)}%`);
  console.log(`  Wirtschaft erkannt (Recall):      ${wirtRecallHit}/${wirtRecallN} = ${pct(wirtRecallHit, wirtRecallN)}%`);
  console.log(`  Über-Tag erkannt (≠Wirtschaft):   ${fehlHit}/${fehlN} = ${pct(fehlHit, fehlN)}%`);
  console.log(`  Aspekt-Recall (Wirt∩Wirt):        ${pct(aspSum, aspN)}%`);
  console.log(`  Aspekt gültig fürs Feld:          ${aspTotal - aspInvalid}/${aspTotal} = ${pct(aspTotal - aspInvalid, aspTotal)}%`);
  console.log(`  Zitate wörtlich verifiziert:      ${zitOk}/${zit} = ${pct(zitOk, zit)}%`);
  console.log(`\n  Vergleich Design B (per Feld, gemessen): Primär 72% · Über-Tag 93% · Aspekt 52% · wörtlich 98%`);
  db.close();
})();
