/**
 * SPIKE: Berlin-Wohnen-Unterthemen-Klassifikation (Entscheidungs-Experiment, Stufe 4).
 *
 * Killt die Kern-Risikofrage des Achse-B-Layers für Berlin: Kann Haiku eine
 * Wohnen-Drucksache sauber zerlegen in
 *   (a) Unterthema(en) aus der GESCHLOSSENEN 12er-Liste (multi-label), und
 *   (b) ein paar OFFENE spezifische Tags (HOWOGE, Milieuschutz, Vorkaufsrecht …),
 * mit `Sonstiges` als Auffangventil + `kern_im_feld`-Flag — ohne 1-Item-Erfindungen
 * und ohne Cross-Feld-Items ins nächstklingende Cluster zu zwingen?
 *
 * Default = DRY-RUN: ruft Haiku live für ~N Items, druckt die Zerlegung,
 * rechnet die Stufe-3-Erfolgskriterien aus. Schreibt NICHTS in die DB.
 *
 * Grounding: NUR die vorhandene Analyse (zusammenfassung/kerninhalt/thema_json) —
 * keine Modell-Welt, kein Web. Neutralität = beschreiben, nicht etikettieren.
 *
 *   --limit N    Anzahl Items (Default 40)
 *   --seed S     Offset in die (dbid-sortierte) Liste, für andere Stichprobe
 *
 * Doku: docs/themen-unterthemen-berlin.md (Stufe 3 Scorecard + Stufe 4).
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const argv = process.argv.slice(2);
const LIMIT = ((i) => i >= 0 ? parseInt(argv[i + 1], 10) : 40)(argv.indexOf("--limit"));
const SEED = ((i) => i >= 0 ? parseInt(argv[i + 1], 10) : 0)(argv.indexOf("--seed"));

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

import { SYSTEM, TOOL, buildUserText, kerninhaltText, themaTags } from "./_lib/unterthemen-wohnen-berlin";

// kerninhalt liegt je nach Klasse in verschiedenen JSON-Feldern (siehe Schema):
//   antrag/gesetzentwurf/vorlage_senat → kerninhalt_json
//   anfrage_antwort                    → kerninhalt_frage_json + kerninhalt_antwort_json
const rows = db.prepare(`
  SELECT dbid, klasse, thema_json, zusammenfassung,
         kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json
  FROM berlin_drucksachen_analyses
  WHERE thema_json LIKE '%"Wohnen"%' AND zusammenfassung IS NOT NULL
  ORDER BY dbid DESC
  LIMIT ? OFFSET ?
`).all(LIMIT, SEED) as {
  dbid: string; klasse: string; thema_json: string; zusammenfassung: string;
  kerninhalt_json: string | null; kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null;
}[];

console.log(`SPIKE Berlin-Wohnen-Unterthemen — ${rows.length} Items, Modell ${MODEL}, DRY-RUN (kein DB-Write)\n`);

const unterCount = new Map<string, number>();
const tagCount = new Map<string, number>();
let sonstiges = 0, fremdkern = 0, sonstigesKern = 0, inTok = 0, outTok = 0;

async function main() {
for (const r of rows) {
  const text = buildUserText(r);
  const resp = await client.messages.create({
    model: MODEL, max_tokens: 400, system: SYSTEM,
    tools: [TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
    messages: [{ role: "user", content: text }],
  });
  inTok += resp.usage.input_tokens; outTok += resp.usage.output_tokens;
  const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
  const out = (block?.input ?? {}) as { unterthemen: string[]; spezifische_tags: string[]; kern_im_feld?: boolean };
  const unter = out.unterthemen ?? [], tags = out.spezifische_tags ?? [];
  const kern = out.kern_im_feld !== false;

  for (const u of unter) {
    unterCount.set(u, (unterCount.get(u) ?? 0) + 1);
    if (u === "Sonstiges") { sonstiges++; if (kern) sonstigesKern++; }
  }
  if (!kern) fremdkern++;
  for (const t of tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);

  console.log(`DS ${r.dbid} [${r.klasse}]${!kern ? "  ⟵ KERN IN ANDEREM FELD" : ""}`);
  console.log(`  alt(tags): ${themaTags(r.thema_json)}`);
  console.log(`  → unterthemen: ${unter.join(" · ")}`);
  console.log(`  → tags: ${tags.join(" · ") || "—"}`);
  console.log(`  ${r.zusammenfassung.slice(0, 130)}…\n`);
}

console.log("─".repeat(60));
console.log("UNTERTHEMEN-VERTEILUNG:");
for (const [u, n] of [...unterCount.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${n.toString().padStart(3)}  ${u}${u === "Sonstiges" ? "  ⟵ Auffangventil" : ""}`);
console.log("\nSPEZIFISCHE TAGS (≥1):");
for (const [t, n] of [...tagCount.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${n.toString().padStart(3)}  ${t}`);

// Erfolgskriterien (Stufe-3-Scorecard): Sonstiges-Quote auf KERN-Items, nicht auf allen.
const kernItems = rows.length - fremdkern;
const maxCluster = Math.max(...[...unterCount.entries()].filter(([u]) => u !== "Sonstiges").map(([, n]) => n), 0);
const maxClusterName = [...unterCount.entries()].find(([u, n]) => u !== "Sonstiges" && n === maxCluster)?.[0];
console.log("\n─ ERFOLGSKRITERIEN (Stufe-3-Scorecard) ─");
console.log(`  Sonstiges auf Kern-Items: ${kernItems ? (100 * sonstigesKern / kernItems).toFixed(0) : "–"} %  (${sonstigesKern}/${kernItems})   Ziel < 15 %`);
console.log(`  kern_im_feld=false:       ${fremdkern} von ${rows.length}  (${(100 * fremdkern / rows.length).toFixed(0)} %)   Erwartung ~12–15 %`);
console.log(`  Sonstiges gesamt:         ${(100 * sonstiges / rows.length).toFixed(0)} %   (0 % = Ventil unbenutzt = BT-Lauf-1-Pathologie!)`);
console.log(`  Größter Kern-Cluster:     ${rows.length ? (100 * maxCluster / rows.length).toFixed(0) : "–"} % (${maxClusterName})   Ziel < 40 %`);
console.log(`  Distinkte Tags:           ${tagCount.size} bei ${rows.length} Items`);
console.log(`  1-Vorkommen-Tags:         ${[...tagCount.values()].filter((n) => n === 1).length} (hohe Zahl = Erfindungs-Risiko)`);
console.log(`\n  Tokens: ${inTok} in / ${outTok} out  (~$${((inTok / 1e6) * 1 + (outTok / 1e6) * 5).toFixed(3)} grob, Haiku-Live)`);
}

main();
