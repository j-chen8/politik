/**
 * Produktions-Extraktion mit Haiku 4.5 (v1-Prompt = Benchmark-Sieger).
 * Liest jede noch nicht erledigte Feld-Rede im VOLLTEXT, klassifiziert
 * passt/Primär-Feld + Aspekt + WÖRTLICHES Zitat, verifiziert jedes Zitat gegen
 * original_text und schreibt nach rede_gold_extraktion. Resumierbar (überspringt
 * bereits erledigte Reden), atomar je Rede.
 *
 *   npx tsx scripts/gold-run-haiku.ts --feld "Wirtschaft" [--limit N]
 */
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { runPool } from "./_lib/mistral";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FELD = arg("--feld", "Wirtschaft")!;
const LIMIT = Number(arg("--limit", "100000"));
const CONCURRENCY = Number(arg("--concurrency", "5"));
const db = new Database("politik.db");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function anthropicKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const m = fs.readFileSync(".env", "utf8").match(/^ANTHROPIC_API_KEY\s*=\s*["']?([^"'\s]+)/m);
  if (!m) throw new Error("ANTHROPIC_API_KEY fehlt");
  return m[1];
}

const ASPEKTE: string[] = (VERGLEICH_MATRIX[FELD]?.aspekte ?? []).map((a: any) => a.label);
const FELDER: string[] = (
  db.prepare(`SELECT DISTINCT aw_field FROM item_topics WHERE source='bt_rede' ORDER BY aw_field`).all() as any[]
).map((r) => r.aw_field);

// v1-Prompt — exakt der Benchmark-Sieger (gold-benchmark.ts SYS).
const SYS =
  'Du klassifizierst eine Bundestagsrede gegen das Politikfeld „Wirtschaft".\n' +
  "Entscheide zuerst: Ist die Rede PRIMÄR (Hauptthema) dem Feld Wirtschaft zuzuordnen?\n" +
  "- Wenn JA: nenne je behandeltem Wirtschaft-ASPEKT (nur aus der Liste) eine knappe neutrale " +
  "Position und EIN Zitat, das du WÖRTLICH und EXAKT aus dem Redetext kopierst (kein Paraphrasieren).\n" +
  "- Wenn NEIN: gib das korrekte Primär-Feld an (aus der Feld-Liste).\n" +
  'NUR JSON: {"passt": true|false, "feld_korrekt": "<Feld oder null>", ' +
  '"extraktionen": [{"aspekt":"<exakt ein Label>","position":"<knapp>","zitat":"<woertlich>"}]}';

const buildUser = (text: string) =>
  [
    `WIRTSCHAFT-ASPEKTE (genau diese Labels):`, ...ASPEKTE.map((a) => `- ${a}`), ``,
    `MÖGLICHE FELDER (falls NICHT Wirtschaft):`, FELDER.join(" · "), ``,
    `REDETEXT:`, text,
  ].join("\n");

function parseJSON(raw: string): any | null {
  try {
    const c = raw.replace(/```json|```/g, "").split("").map((ch) => (ch.charCodeAt(0) < 32 ? " " : ch)).join("");
    const s = c.indexOf("{"), e = c.lastIndexOf("}");
    if (s < 0 || e < 0) return null;
    return JSON.parse(c.slice(s, e + 1));
  } catch {
    return null;
  }
}

const reden = db
  .prepare(
    `SELECT ps.rede_id, ps.party, ps.speaker, ps.session_id, ps.original_text AS text
     FROM item_topics it JOIN plenar_speeches ps ON ps.rede_id = it.item_id
     WHERE it.source='bt_rede' AND it.aw_field = ?
       AND ps.original_text IS NOT NULL AND LENGTH(ps.original_text) > 600
       AND ps.rede_id NOT IN (
         SELECT rede_id FROM plenar_speeches WHERE rede_id IS NOT NULL
         GROUP BY rede_id HAVING COUNT(DISTINCT redner_id) > 1)
       AND ps.rede_id NOT IN (SELECT DISTINCT rede_id FROM rede_gold_extraktion WHERE feld = ?)
     GROUP BY ps.rede_id
     LIMIT ?`,
  )
  .all(FELD, FELD, LIMIT) as { rede_id: string; party: string; speaker: string; session_id: number; text: string }[];

const ins = db.prepare(`INSERT OR REPLACE INTO rede_gold_extraktion
  (rede_id, feld, aspekt, partei, speaker, session_nr, passt, feld_korrekt, position, zitat, zitat_verifiziert, model)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);

function writeRede(r: any, res: any) {
  const src = norm(r.text);
  const tx = db.transaction(() => {
    if (!res.passt) {
      ins.run(r.rede_id, FELD, "", r.party, r.speaker, r.session_id, 0, res.feld_korrekt ?? null, null, null, 0, "claude-haiku-4-5");
      return;
    }
    let any = false;
    for (const e of res.extraktionen ?? []) {
      if (!e?.aspekt) continue;
      const verif = e?.zitat ? src.includes(norm(String(e.zitat))) : false;
      ins.run(r.rede_id, FELD, String(e.aspekt), r.party, r.speaker, r.session_id, 1, null, String(e.position ?? ""), String(e.zitat ?? ""), verif ? 1 : 0, "claude-haiku-4-5");
      any = true;
    }
    // passt=true aber keine Aspekte -> als Marker speichern, damit nicht endlos re-gefetcht
    if (!any) ins.run(r.rede_id, FELD, "", r.party, r.speaker, r.session_id, 1, null, null, null, 0, "claude-haiku-4-5");
  });
  tx();
}

(async () => {
  console.log(`Haiku-Lauf „${FELD}": ${reden.length} offene Reden · Concurrency ${CONCURRENCY}`);
  if (!reden.length) { console.log("Nichts zu tun."); db.close(); return; }
  const client = new Anthropic({ apiKey: anthropicKey() });
  let done = 0, fail = 0, fehl = 0, passt = 0;
  await runPool(reden, CONCURRENCY, async (r) => {
    let res: any | null = null;
    for (let a = 0; a < 4 && !res; a++) {
      try {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5", max_tokens: 2000, system: SYS,
          messages: [{ role: "user", content: buildUser(r.text) }],
        });
        res = parseJSON(msg.content.map((b: any) => (b.type === "text" ? b.text : "")).join(""));
      } catch {
        await sleep(2000);
      }
    }
    if (!res || typeof res.passt !== "boolean") { fail++; }
    else { writeRede(r, res); res.passt ? passt++ : fehl++; }
    if (++done % 50 === 0) console.log(`  ${done}/${reden.length} · passt ${passt} · Fehl-Tag ${fehl} · ${fail} ohne JSON`);
  });
  console.log(`✓ fertig: ${done} Reden · ${passt} Wirtschaft · ${fehl} Fehl-Tag · ${fail} ohne JSON`);
  db.close();
})();
