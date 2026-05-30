/**
 * KA-Q&A-Paarung: ordnet die bereits extrahierten kerninhalt_frage- und
 * kerninhalt_antwort-Bullets paarweise zu (nur die Bullets gehen an den LLM,
 * NICHT das Volldokument → ~$0.50 statt ~$12). Der LLM nutzt die Bullets
 * WÖRTLICH (paart nur, formuliert nicht um). Schreibt drucksache_analyses
 * .kerninhalt_qa_paare_json = [{frage, antwort}].
 *
 *   --test      3 Live-Calls, kein Write (Verifikation)
 *   --dry-run   Vorschau + Kosten, kein Call
 *   --submit    Batch einreichen
 *   --poll <id> Ergebnisse abholen + schreiben
 */
import Database from "better-sqlite3";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
for (const l of fs.readFileSync(".env", "utf8").split("\n")) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }

const MODEL = "claude-haiku-4-5-20251001";
const argv = process.argv.slice(2);
const TEST = argv.includes("--test");
const DRY = argv.includes("--dry-run");
const SUBMIT = argv.includes("--submit");
const POLL = argv.includes("--poll") ? argv[argv.indexOf("--poll") + 1] : null;
const toCid = (nr: string) => "ds_" + nr.replace(/\//g, "_");
const fromCid = (c: string) => c.replace(/^ds_/, "").replace(/_/g, "/");

const SYSTEM = `Du bekommst nummerierte FRAGE-Stichpunkte (F1, F2, …) und ANTWORT-Stichpunkte (A1, A2, …) einer Bundestags-Anfrage. Ordne jeder Frage die thematisch passende(n) Antwort-Nummer(n) zu.
REGELN:
- Gib NUR die Nummern zurück (keine Texte): pro Frage die Frage-Nummer f und die passenden Antwort-Nummern a (Array).
- Meist 1:1 (F1→[1], F2→[2] …), aber prüfe inhaltlich; mehrere Antworten möglich; keine passende Antwort → a=[].
- Jede Frage genau einmal. Nur über das Tool.`;

const TOOL = {
  name: "zuordnung", description: "Frage-Nummer → Antwort-Nummer(n).",
  input_schema: { type: "object" as const, required: ["paare"], properties: {
    paare: { type: "array", items: { type: "object", required: ["f", "a"], properties: { f: { type: "integer" }, a: { type: "array", items: { type: "integer" } } } } } } },
};

/** Baut die Paare aus den Original-Bullets + der Index-Zuordnung (wörtlich, kein Paraphrase). */
function assemble(fr: string[], an: string[], paare: { f: number; a: number[] }[]): { frage: string; antwort: string }[] {
  const out: { frage: string; antwort: string }[] = [];
  const seen = new Set<number>();
  for (const p of paare) {
    const fi = p.f - 1;
    if (fi < 0 || fi >= fr.length || seen.has(fi)) continue;
    seen.add(fi);
    const ans = (p.a || []).map((i) => an[i - 1]).filter(Boolean);
    out.push({ frage: fr[fi], antwort: ans.join(" | ") });
  }
  // nicht zugeordnete Fragen anhängen (ohne Antwort)
  fr.forEach((f, i) => { if (!seen.has(i)) out.push({ frage: f, antwort: "" }); });
  return out;
}

function userMsg(fr: string[], an: string[]) {
  return `FRAGE-Stichpunkte:\n${fr.map((x, i) => `F${i + 1}. ${x}`).join("\n")}\n\nANTWORT-Stichpunkte:\n${an.map((x, i) => `A${i + 1}. ${x}`).join("\n")}`;
}

function rows(db: Database.Database, limit?: number) {
  return db.prepare(`
    SELECT drucksache_nr, kerninhalt_frage_json, kerninhalt_antwort_json
    FROM drucksache_analyses
    WHERE kerninhalt_frage_json IS NOT NULL AND kerninhalt_antwort_json IS NOT NULL
    ORDER BY drucksache_nr ${limit ? "LIMIT " + limit : ""}
  `).all() as { drucksache_nr: string; kerninhalt_frage_json: string; kerninhalt_antwort_json: string }[];
}
const parse = (s: string) => { try { const v = JSON.parse(s); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

async function main() {
  const db = new Database("politik.db");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (POLL) {
    const bulletMap = new Map<string, { fr: string[]; an: string[] }>();
    for (const r of rows(db)) bulletMap.set(r.drucksache_nr, { fr: parse(r.kerninhalt_frage_json), an: parse(r.kerninhalt_antwort_json) });
    const stream = await client.messages.batches.results(POLL);
    const upd = db.prepare(`UPDATE drucksache_analyses SET kerninhalt_qa_paare_json=? WHERE drucksache_nr=?`);
    let ok = 0, err = 0;
    for await (const item of stream as any) {
      const nr = fromCid(item.custom_id);
      if (item.result?.type !== "succeeded") { err++; continue; }
      const tu = item.result.message.content.find((c: any) => c.type === "tool_use");
      const b = bulletMap.get(nr);
      if (!tu?.input?.paare || !b) { err++; continue; }
      upd.run(JSON.stringify(assemble(b.fr, b.an, tu.input.paare)), nr); ok++;
    }
    console.log(`Retrieve: ok=${ok} err=${err}`);
    db.close(); return;
  }

  const all = rows(db);
  if (TEST) {
    for (const r of rows(db, 3)) {
      const fr = parse(r.kerninhalt_frage_json), an = parse(r.kerninhalt_antwort_json);
      const resp = await client.messages.create({ model: MODEL, max_tokens: 500, system: SYSTEM, tools: [TOOL], tool_choice: { type: "tool", name: "zuordnung" }, messages: [{ role: "user", content: userMsg(fr, an) }] });
      const tu = resp.content.find((c: any) => c.type === "tool_use") as any;
      const pairs = assemble(fr, an, tu?.input?.paare ?? []);
      console.log(`\n===== ${r.drucksache_nr} (${fr.length} F / ${an.length} A) | out=${resp.usage.output_tokens} Tok | Map=${JSON.stringify(tu?.input?.paare)} =====`);
      for (const p of pairs) { console.log(`  F: ${p.frage.slice(0, 78)}`); console.log(`  A: ${(p.antwort || "(keine)").slice(0, 78)}\n`); }
    }
    db.close(); return;
  }

  const requests = all.map((r) => ({
    custom_id: toCid(r.drucksache_nr),
    params: { model: MODEL, max_tokens: 500, system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }], tools: [TOOL], tool_choice: { type: "tool", name: "zuordnung" },
      messages: [{ role: "user", content: userMsg(parse(r.kerninhalt_frage_json), parse(r.kerninhalt_antwort_json)) }] },
  }));
  const inTok = all.reduce((a, r) => a + Math.ceil((r.kerninhalt_frage_json.length + r.kerninhalt_antwort_json.length) / 4) + 180, 0);
  console.log(`Docs: ${all.length} | Input ~${(inTok / 1e6).toFixed(2)}M Tok | Kosten ~$${(inTok / 1e6 * 0.5 + all.length * 60 / 1e6 * 2.5).toFixed(2)} (Output nur Indizes)`);
  if (DRY || !SUBMIT) { console.log(DRY ? "--dry-run" : "kein --submit"); db.close(); return; }
  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ Batch: ${batch.id}  (poll: --poll ${batch.id})`);
  db.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
