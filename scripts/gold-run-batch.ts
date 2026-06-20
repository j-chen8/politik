/**
 * „Einmal lesen" auf der BATCH-API (Haiku, −50%). Jede Rede wird EINMAL im Volltext
 * gelesen; Kandidaten sind nur ihre GEERBTEN Felder (item_topics) — das Modell wählt
 * per Mehrfach-Auswahl, welche es im Kern behandelt, und extrahiert je Feld Aspekt +
 * Position + WÖRTLICHES Zitat. Löst Design A's „Wirtschaft ertrinkt" (nur Kandidaten,
 * nicht alle 25) UND Design B's Mehrfach-Lesen (1 Call/Rede statt 1/Feld).
 *
 *   npx tsx scripts/gold-run-batch.ts --scope benchmark   # 40 Gold-Reden, submit+poll+score
 */
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const SCOPE = arg("--scope", "benchmark")!;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const db = new Database("politik.db");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
function anthropicKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  return fs.readFileSync(".env", "utf8").match(/^ANTHROPIC_API_KEY\s*=\s*["']?([^"'\s]+)/m)![1];
}
const MATRIX_FIELDS = new Set(Object.keys(VERGLEICH_MATRIX));
const aspektsOf = (f: string) => (VERGLEICH_MATRIX[f]?.aspekte ?? []).map((a: any) => a.label);

const SYS =
  "Eine Bundestagsrede ist zu mehreren Politikfeldern getaggt (KANDIDATEN). Bestimme, " +
  "welche dieser Kandidaten-Felder die Rede WIRKLICH im Kern behandelt — mehrere möglich. " +
  "Felder, die sie nur am Rande streift oder gar nicht behandelt, NICHT aufnehmen. " +
  "Je behandeltem Feld: je Aspekt (nur aus dessen Liste) eine knappe neutrale Position und " +
  "EIN Zitat, das du WÖRTLICH und EXAKT aus dem Redetext kopierst (kein Paraphrasieren).\n" +
  'NUR JSON: {"felder":[{"feld":"<Kandidat>","aspekte":[{"aspekt":"<Label dieses Feldes>",' +
  '"position":"<knapp>","zitat":"<woertlich>"}]}]}';

function candidates(redeId: string): string[] {
  const fs2 = (db.prepare(`SELECT DISTINCT aw_field FROM item_topics WHERE source='bt_rede' AND item_id=?`).all(redeId) as any[])
    .map((r) => r.aw_field).filter((f) => MATRIX_FIELDS.has(f));
  return fs2;
}
function buildUser(redeId: string, text: string): string | null {
  const cand = candidates(redeId);
  if (!cand.length) return null;
  const fa = cand.map((f) => `## ${f}\n` + aspektsOf(f).map((a) => `- ${a}`).join("\n")).join("\n\n");
  return `KANDIDATEN-FELDER (nur diese):\n${fa}\n\nREDETEXT:\n${text}`;
}
function parseJSON(raw: string): any | null {
  try {
    const c = raw.replace(/```json|```/g, "").split("").map((ch) => (ch.charCodeAt(0) < 32 ? " " : ch)).join("");
    const s = c.indexOf("{"), e = c.lastIndexOf("}");
    return s < 0 || e < 0 ? null : JSON.parse(c.slice(s, e + 1));
  } catch { return null; }
}

function redenForScope(): { rede_id: string; text: string }[] {
  if (SCOPE === "benchmark") {
    const ids = (db.prepare(`SELECT DISTINCT rede_id FROM rede_gold_extraktion WHERE feld='Wirtschaft' AND model='claude-code-manual'`).all() as any[]).map((r) => r.rede_id);
    return (db.prepare(`SELECT rede_id, original_text AS text FROM plenar_speeches WHERE rede_id IN (${ids.map(() => "?").join(",")}) GROUP BY rede_id`).all(...ids) as any[]);
  }
  throw new Error("nur benchmark implementiert");
}

db.exec(`CREATE TABLE IF NOT EXISTS read_once_extraktion (
  rede_id TEXT, feld TEXT, aspekt TEXT, position TEXT, zitat TEXT, verifiziert INTEGER,
  scope TEXT, created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (rede_id, feld, aspekt))`);

(async () => {
  const client = new Anthropic({ apiKey: anthropicKey() });
  const reden = redenForScope();
  const textOf = new Map(reden.map((r) => [r.rede_id, r.text]));
  const requests: any[] = [];
  for (const r of reden) {
    const user = buildUser(r.rede_id, r.text);
    if (!user) continue;
    requests.push({ custom_id: r.rede_id, params: { model: "claude-haiku-4-5", max_tokens: 3000, system: SYS, messages: [{ role: "user", content: user }] } });
  }
  console.log(`Batch „${SCOPE}": ${requests.length} Reden → submit…`);
  const batch = await client.messages.batches.create({ requests });
  console.log(`  batch_id=${batch.id} status=${batch.processing_status}`);

  let status = batch.processing_status;
  while (status !== "ended") {
    await sleep(20000);
    const b = await client.messages.batches.retrieve(batch.id);
    status = b.processing_status;
    process.stdout.write(`  …${status} (${b.request_counts.processing} offen, ${b.request_counts.succeeded} ok)\n`);
  }

  const ins = db.prepare(`INSERT OR REPLACE INTO read_once_extraktion (rede_id, feld, aspekt, position, zitat, verifiziert, scope) VALUES (?,?,?,?,?,?,?)`);
  db.prepare(`DELETE FROM read_once_extraktion WHERE scope=?`).run(SCOPE);
  const fieldsByRede: Record<string, Set<string>> = {};
  let parsed = 0, zit = 0, zitOk = 0;
  for await (const r of await client.messages.batches.results(batch.id)) {
    if (r.result.type !== "succeeded") continue;
    const raw = r.result.message.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
    const res = parseJSON(raw);
    if (!res?.felder) continue;
    parsed++;
    const src = norm(textOf.get(r.custom_id) || "");
    const set = (fieldsByRede[r.custom_id] ??= new Set());
    db.transaction(() => {
      for (const f of res.felder) {
        if (!MATRIX_FIELDS.has(f.feld)) continue;
        set.add(f.feld);
        for (const e of f.aspekte ?? []) {
          if (!e?.aspekt) continue;
          const ok = e.zitat ? src.includes(norm(String(e.zitat))) : false;
          zit++; if (ok) zitOk++;
          ins.run(r.custom_id, f.feld, String(e.aspekt), String(e.position ?? ""), String(e.zitat ?? ""), ok ? 1 : 0, SCOPE);
        }
      }
    })();
  }
  console.log(`✓ geparst ${parsed}/${requests.length} · Zitate wörtlich ${zitOk}/${zit} = ${Math.round((zitOk / Math.max(zit, 1)) * 100)}%`);

  if (SCOPE === "benchmark") {
    const goldRows = db.prepare(`SELECT rede_id, passt, feld_korrekt, aspekt FROM rede_gold_extraktion WHERE feld='Wirtschaft' AND model='claude-code-manual'`).all() as any[];
    const gold: Record<string, { wirt: boolean; aspekte: Set<string> }> = {};
    for (const g of goldRows) {
      const x = (gold[g.rede_id] ??= { wirt: g.passt === 1, aspekte: new Set() });
      if (g.passt === 1 && g.aspekt) x.aspekte.add(g.aspekt);
    }
    let wInclN = 0, wInclHit = 0, fehlN = 0, fehlExcl = 0, aspN = 0, aspSum = 0;
    for (const rid of Object.keys(gold)) {
      const g = gold[rid], set = fieldsByRede[rid] ?? new Set();
      if (g.wirt) { wInclN++; if (set.has("Wirtschaft")) wInclHit++; }
      else { fehlN++; if (!set.has("Wirtschaft")) fehlExcl++; }
      if (g.wirt && set.has("Wirtschaft") && g.aspekte.size) {
        aspN++;
        const ma = new Set((db.prepare(`SELECT aspekt FROM read_once_extraktion WHERE rede_id=? AND feld='Wirtschaft' AND scope=?`).all(rid, SCOPE) as any[]).map((r) => r.aspekt));
        let hit = 0; for (const a of g.aspekte) if (ma.has(a)) hit++;
        aspSum += hit / g.aspekte.size;
      }
    }
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
    console.log(`\n=== Einmal-Lesen vs. Gold (40) ===`);
    console.log(`  Wirtschaft korrekt enthalten (Recall): ${wInclHit}/${wInclN} = ${pct(wInclHit, wInclN)}%`);
    console.log(`  Über-Tag korrekt ausgeschlossen:       ${fehlExcl}/${fehlN} = ${pct(fehlExcl, fehlN)}%`);
    console.log(`  Aspekt-Recall (Wirtschaft):            ${pct(aspSum, aspN)}%`);
    console.log(`  Vergleich Design B (per Feld): Wirt-Recall ~72% · Über-Tag 93% · Aspekt 52% · wörtlich 96-98%`);
  }
  db.close();
})();
