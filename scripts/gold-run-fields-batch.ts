/**
 * GLOBALER Gold-Lauf, Design B (pro Feld) auf der BATCH-API (Haiku, −50%).
 * Für jedes Feld × jede noch nicht erledigte Rede: passt/Primär-Feld + Aspekt +
 * WÖRTLICHES Zitat. Bewährter v1-Prompt (Benchmark-Sieger), pro Feld parametrisiert.
 * Resumierbar: Batch-ID in /tmp/gold-fields-batch.json; --collect <id> sammelt nach.
 *
 *   npx tsx scripts/gold-run-fields-batch.ts           # build+submit+poll+collect+write
 *   npx tsx scripts/gold-run-fields-batch.ts --collect msgbatch_...   # nur nachsammeln
 */
import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const db = new Database("politik.db");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const IDFILE = "/tmp/gold-fields-batch.json";
function anthropicKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  return fs.readFileSync(".env", "utf8").match(/^ANTHROPIC_API_KEY\s*=\s*["']?([^"'\s]+)/m)![1];
}
const client = new Anthropic({ apiKey: anthropicKey() });

const FIELDS = Object.keys(VERGLEICH_MATRIX); // 25, alle mit Aspekten
const FIELD_IDX = new Map(FIELDS.map((f, i) => [f, i]));
const ALL_FELDER = (db.prepare(`SELECT DISTINCT aw_field FROM item_topics WHERE source='bt_rede' ORDER BY aw_field`).all() as any[]).map((r) => r.aw_field);
const aspektsOf = (f: string) => (VERGLEICH_MATRIX[f]?.aspekte ?? []).map((a: any) => a.label);

const SYS = (feld: string) =>
  `Du klassifizierst eine Bundestagsrede gegen das Politikfeld „${feld}".\n` +
  "Entscheide zuerst: Ist die Rede PRIMÄR (Hauptthema) diesem Feld zuzuordnen?\n" +
  `- Wenn JA: nenne je behandeltem ${feld}-ASPEKT (nur aus der Liste) eine knappe neutrale ` +
  "Position und EIN Zitat, das du WÖRTLICH und EXAKT aus dem Redetext kopierst (kein Paraphrasieren).\n" +
  "- Wenn NEIN: gib das korrekte Primär-Feld an (aus der Feld-Liste).\n" +
  'NUR JSON: {"passt": true|false, "feld_korrekt": "<Feld oder null>", ' +
  '"extraktionen": [{"aspekt":"<exakt ein Label>","position":"<knapp>","zitat":"<woertlich>"}]}';

const buildUser = (feld: string, text: string) =>
  [`${feld}-ASPEKTE (genau diese Labels):`, ...aspektsOf(feld).map((a) => `- ${a}`), ``,
   `MÖGLICHE FELDER (falls NICHT ${feld}):`, ALL_FELDER.join(" · "), ``, `REDETEXT:`, text].join("\n");

function parseJSON(raw: string): any | null {
  try {
    const c = raw.replace(/```json|```/g, "").split("").map((ch) => (ch.charCodeAt(0) < 32 ? " " : ch)).join("");
    const s = c.indexOf("{"), e = c.lastIndexOf("}");
    return s < 0 || e < 0 ? null : JSON.parse(c.slice(s, e + 1));
  } catch { return null; }
}

const ins = db.prepare(`INSERT OR REPLACE INTO rede_gold_extraktion
  (rede_id, feld, aspekt, partei, speaker, session_nr, passt, feld_korrekt, position, zitat, zitat_verifiziert, model)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
const metaQ = db.prepare(`SELECT party, speaker, session_id, original_text FROM plenar_speeches WHERE rede_id=? LIMIT 1`);

function writeResult(redeId: string, feld: string, res: any) {
  const m = metaQ.get(redeId) as any;
  if (!m) return;
  const src = norm(m.original_text);
  db.transaction(() => {
    if (!res.passt) {
      ins.run(redeId, feld, "", m.party, m.speaker, m.session_id, 0, res.feld_korrekt ?? null, null, null, 0, "claude-haiku-4-5");
      return;
    }
    let any = false;
    for (const e of res.extraktionen ?? []) {
      if (!e?.aspekt) continue;
      const verif = e?.zitat ? src.includes(norm(String(e.zitat))) : false;
      ins.run(redeId, feld, String(e.aspekt), m.party, m.speaker, m.session_id, 1, null, String(e.position ?? ""), String(e.zitat ?? ""), verif ? 1 : 0, "claude-haiku-4-5");
      any = true;
    }
    if (!any) ins.run(redeId, feld, "", m.party, m.speaker, m.session_id, 1, null, null, null, 0, "claude-haiku-4-5");
  })();
}

async function collect(batchId: string) {
  let status = "";
  do {
    const b = await client.messages.batches.retrieve(batchId);
    status = b.processing_status;
    process.stdout.write(`  …${status} (${b.request_counts.processing} offen, ${b.request_counts.succeeded} ok, ${b.request_counts.errored} err)\n`);
    if (status !== "ended") await sleep(30000);
  } while (status !== "ended");

  let ok = 0, bad = 0;
  for await (const r of await client.messages.batches.results(batchId)) {
    if (r.result.type !== "succeeded") { bad++; continue; }
    const dash = r.custom_id.lastIndexOf("-");
    const redeId = r.custom_id.slice(0, dash);
    const feld = FIELDS[Number(r.custom_id.slice(dash + 1))];
    const raw = r.result.message.content.map((b: any) => (b.type === "text" ? b.text : "")).join("");
    const res = parseJSON(raw);
    if (!res || typeof res.passt !== "boolean") { bad++; continue; }
    writeResult(redeId, feld, res);
    ok++;
  }
  console.log(`✓ gesammelt: ${ok} ok, ${bad} fehlerhaft`);
}

(async () => {
  const resume = arg("--collect");
  if (resume) { await collect(resume); db.close(); return; }

  // Requests bauen: jedes Feld × jede noch nicht erledigte Rede
  const requests: any[] = [];
  for (const feld of FIELDS) {
    const reden = db.prepare(
      `SELECT ps.rede_id, ps.original_text AS text
       FROM item_topics it JOIN plenar_speeches ps ON ps.rede_id = it.item_id
       WHERE it.source='bt_rede' AND it.aw_field = ?
         AND ps.original_text IS NOT NULL AND LENGTH(ps.original_text) > 600
         AND ps.rede_id NOT IN (SELECT rede_id FROM plenar_speeches WHERE rede_id IS NOT NULL GROUP BY rede_id HAVING COUNT(DISTINCT redner_id) > 1)
         AND ps.rede_id NOT IN (SELECT DISTINCT rede_id FROM rede_gold_extraktion WHERE feld = ?)
       GROUP BY ps.rede_id`,
    ).all(feld, feld) as any[];
    const fi = FIELD_IDX.get(feld);
    for (const r of reden)
      requests.push({ custom_id: `${r.rede_id}-${fi}`, params: { model: "claude-haiku-4-5", max_tokens: 2000, system: SYS(feld), messages: [{ role: "user", content: buildUser(feld, r.text) }] } });
  }
  console.log(`Design-B Batch-Lauf: ${requests.length} (Rede×Feld) über ${FIELDS.length} Felder`);
  if (!requests.length) { console.log("Nichts offen."); db.close(); return; }

  const batch = await client.messages.batches.create({ requests });
  fs.writeFileSync(IDFILE, JSON.stringify({ batchId: batch.id, n: requests.length, at: batch.created_at }));
  console.log(`  batch_id=${batch.id} (gespeichert in ${IDFILE}) — pollt…`);
  await collect(batch.id);
  db.close();
})();
