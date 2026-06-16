/**
 * GENERISCHER Spike: Unterthemen-Klassifikation für EIN beliebiges Berliner Feld.
 * Validiert die DRAFT-Taxonomie eines Felds am echten Material, BEVOR der Global-
 * Batch läuft. Pendant zu spike-wohnen-unterthemen.ts, aber feld-parametrisiert.
 *
 * Default = DRY-RUN: Haiku live für ~N DS, druckt Zerlegung + Stufe-3-Scorecard,
 * schreibt NICHTS in die DB.
 *
 *   --feld <slug>   Pflicht (z.B. verwaltung-digitales)
 *   --limit N       Anzahl Items (Default 30)
 *   --estimate      nur Item-Zahl + grobe Kosten, KEIN API-Call (gratis)
 *
 * Sampling: Spread über die dbid-Endung (nicht nur neueste — Wohnen-Spike fing sonst
 * eine Themen-Häufung). Doku: docs/themen-unterthemen-berlin.md.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { buildKlassifikator, buildUserText } from "./_lib/unterthemen-berlin";
import { berlinFeldBySlug } from "../src/lib/berlin-themen-struktur";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const argv = process.argv.slice(2);
const arg = (name: string, def?: string) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const SLUG = arg("--feld");
const LIMIT = parseInt(arg("--limit", "30")!, 10);
const ESTIMATE = argv.includes("--estimate");

if (!SLUG) { console.error("--feld <slug> fehlt"); process.exit(1); }
const feldDef = berlinFeldBySlug(SLUG);
if (!feldDef) { console.error(`Unbekannter Feld-Slug: ${SLUG}`); process.exit(1); }
const K = buildKlassifikator(feldDef.label);

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
const tagCond = K.tags.map(() => "a.thema_json LIKE ?").join(" OR ");
const rows = db.prepare(`
  SELECT a.dbid, a.klasse, a.thema_json, a.zusammenfassung,
         a.kerninhalt_json, a.kerninhalt_frage_json, a.kerninhalt_antwort_json
  FROM berlin_drucksachen_analyses a
  WHERE a.klasse IS NOT NULL AND a.zusammenfassung IS NOT NULL AND (${tagCond})
  ORDER BY substr(a.dbid, -2), a.dbid
  LIMIT ?
`).all(...K.tags.map((t) => `%"${t}"%`), LIMIT) as {
  dbid: string; klasse: string; thema_json: string; zusammenfassung: string;
  kerninhalt_json: string | null; kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null;
}[];

const totalImFeld = (db.prepare(`
  SELECT COUNT(*) c FROM berlin_drucksachen_analyses a
  WHERE a.klasse IS NOT NULL AND (${tagCond})
`).get(...K.tags.map((t) => `%"${t}"%`)) as { c: number }).c;

if (ESTIMATE) {
  let chars = 0; for (const r of rows) chars += K.SYSTEM.length + buildUserText(r).length;
  const inTok = Math.round(chars / 4) + rows.length * 600; // +Tool-Schema-Aufschlag
  console.log(`ESTIMATE Feld „${K.feld}" (${SLUG}): ${totalImFeld} DS im Feld, Spike-Stichprobe ${rows.length}`);
  console.log(`  ~${inTok.toLocaleString()} in / ~${(rows.length * 130).toLocaleString()} out → ~$${((inTok / 1e6) + (rows.length * 130 / 1e6) * 5).toFixed(3)} live (Haiku)`);
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

console.log(`SPIKE Feld „${K.feld}" (${SLUG}) — ${rows.length} DS, ${MODEL}, DRY-RUN\nUnterthemen: ${K.UNTERTHEMEN.join(" · ")}\n`);

const unterCount = new Map<string, number>();
const tagCount = new Map<string, number>();
let sonstiges = 0, sonstigesKern = 0, fremdkern = 0, inTok = 0, outTok = 0;

async function main() {
for (const r of rows) {
  const resp = await client.messages.create({
    model: MODEL, max_tokens: 400, system: K.SYSTEM,
    tools: [K.TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
    messages: [{ role: "user", content: buildUserText(r) }],
  });
  inTok += resp.usage.input_tokens; outTok += resp.usage.output_tokens;
  const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
  const out = (block?.input ?? {}) as { unterthemen?: string[]; spezifische_tags?: string[]; kern_im_feld?: boolean };
  const unter = (out.unterthemen ?? []).map(K.normalizeUnterthema).filter((u): u is string => !!u);
  const tags = out.spezifische_tags ?? [];
  const kern = out.kern_im_feld !== false;
  for (const u of unter) { unterCount.set(u, (unterCount.get(u) ?? 0) + 1); if (u === "Sonstiges") { sonstiges++; if (kern) sonstigesKern++; } }
  if (!kern) fremdkern++;
  for (const t of tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  console.log(`${r.dbid} [${r.klasse}]${!kern ? " ⟵ KERN ANDERES FELD" : ""}`);
  console.log(`  → ${unter.join(" · ")}   {${tags.join(", ")}}`);
  console.log(`  ${r.zusammenfassung.slice(0, 120)}…\n`);
}
console.log("─".repeat(60));
for (const [u, n] of [...unterCount.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${(n + "").padStart(3)}  ${u}${u === "Sonstiges" ? " ⟵ Ventil" : ""}`);
const kernItems = rows.length - fremdkern;
const maxKern = Math.max(...[...unterCount.entries()].filter(([u]) => u !== "Sonstiges").map(([, n]) => n), 0);
const maxName = [...unterCount.entries()].find(([u, n]) => u !== "Sonstiges" && n === maxKern)?.[0];
console.log(`\n─ SCORECARD ─`);
console.log(`  Sonstiges auf Kern-Items: ${kernItems ? (100 * sonstigesKern / kernItems).toFixed(0) : "–"} %  (Ziel <15 %)`);
console.log(`  Sonstiges gesamt:         ${(100 * sonstiges / rows.length).toFixed(0)} %  (0 % = Ventil tot)`);
console.log(`  kern_im_feld=false:       ${fremdkern}/${rows.length} (${(100 * fremdkern / rows.length).toFixed(0)} %)`);
console.log(`  Größter Kern-Cluster:     ${rows.length ? (100 * maxKern / rows.length).toFixed(0) : "–"} % (${maxName})  (Ziel <40 %)`);
console.log(`  1-Vorkommen-Tags:         ${[...tagCount.values()].filter((n) => n === 1).length}/${tagCount.size}`);
console.log(`  Tokens: ${inTok} in / ${outTok} out  (~$${((inTok / 1e6) + (outTok / 1e6) * 5).toFixed(3)})`);
}
main();
