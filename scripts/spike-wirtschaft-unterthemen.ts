/**
 * SPIKE: Wirtschaft-Unterthemen-Klassifikation (Entscheidungs-Experiment).
 *
 * Killt die Kern-Risikofrage des Modell-B-Layers: Kann Haiku ein Wirtschafts-Item
 * sauber zerlegen in
 *   (a) Unterthema(en) aus einer GESCHLOSSENEN Liste (multi-label), und
 *   (b) ein paar OFFENE spezifische Tags (KI, Krypto, Lieferkette …),
 * mit `Sonstiges` als Auffangventil — ohne 1-Item-Erfindungen?
 *
 * Default = DRY-RUN: ruft Haiku live für ~N Items, druckt die Zerlegung,
 * rechnet die Erfolgskriterien aus. Schreibt NICHTS in die DB.
 *
 * Grounding: NUR die vorhandene Analyse (zusammenfassung/kerninhalt/thema) —
 * keine Modell-Welt, kein Web. Neutralität = beschreiben, nicht etikettieren.
 *
 *   --limit N    Anzahl Items (Default 30)
 *   --seed S     Offset in die (datums-sortierte) Liste, für andere Stichprobe
 *
 * Doku: docs/themen-unterthemen-design.md (Pilot-Plan Wirtschaft).
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
const LIMIT = ((i) => i >= 0 ? parseInt(argv[i + 1], 10) : 30)(argv.indexOf("--limit"));
const SEED = ((i) => i >= 0 ? parseInt(argv[i + 1], 10) : 0)(argv.indexOf("--seed"));

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

// Taxonomie + Prompt + Tool geteilt mit dem Batch-Skript (eine Quelle der Wahrheit):
// scripts/_lib/unterthemen-wirtschaft.ts — Stand Lauf-2-Patch (11. Cluster
// „Wettbewerb & Kartellrecht", geschärfte Sonstiges-Regel, kern_im_feld-Flag).
import { SYSTEM, TOOL } from "./_lib/unterthemen-wirtschaft";

const rows = db.prepare(`
  SELECT da.drucksache_nr, da.thema, da.zusammenfassung, da.kerninhalt
  FROM item_topics it JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
  WHERE it.source='bt_drucksache' AND it.aw_field='Wirtschaft' AND da.zusammenfassung IS NOT NULL
  ORDER BY da.drucksache_nr DESC
  LIMIT ? OFFSET ?
`).all(LIMIT, SEED) as { drucksache_nr: string; thema: string; zusammenfassung: string; kerninhalt: string | null }[];

console.log(`SPIKE Wirtschaft-Unterthemen — ${rows.length} Items, Modell ${MODEL}, DRY-RUN (kein DB-Write)\n`);

const unterCount = new Map<string, number>();
const tagCount = new Map<string, number>();
let sonstiges = 0, fremdkern = 0, inTok = 0, outTok = 0;

async function main() {
for (const r of rows) {
  const text = `THEMA-FELD (Alt-Klassifikation): ${r.thema}\n\nZUSAMMENFASSUNG: ${r.zusammenfassung}\n\nKERNINHALT: ${r.kerninhalt ?? "—"}`;
  const resp = await client.messages.create({
    model: MODEL, max_tokens: 400, system: SYSTEM,
    tools: [TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
    messages: [{ role: "user", content: text }],
  });
  inTok += resp.usage.input_tokens; outTok += resp.usage.output_tokens;
  const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
  const out = (block?.input ?? {}) as { unterthemen: string[]; spezifische_tags: string[]; kern_im_feld?: boolean };
  const unter = out.unterthemen ?? [], tags = out.spezifische_tags ?? [];

  for (const u of unter) { unterCount.set(u, (unterCount.get(u) ?? 0) + 1); if (u === "Sonstiges") sonstiges++; }
  if (out.kern_im_feld === false) fremdkern++;
  for (const t of tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);

  console.log(`DS ${r.drucksache_nr}${out.kern_im_feld === false ? "  ⟵ KERN IN ANDEREM FELD" : ""}`);
  console.log(`  alt(thema): ${r.thema}`);
  console.log(`  → unterthemen: ${unter.join(" · ")}`);
  console.log(`  → tags: ${tags.join(" · ") || "—"}`);
  console.log(`  ${r.zusammenfassung.slice(0, 110)}…\n`);
}

console.log("─".repeat(60));
console.log("UNTERTHEMEN-VERTEILUNG:");
for (const [u, n] of [...unterCount.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${n.toString().padStart(3)}  ${u}${u === "Sonstiges" ? "  ⟵ Auffangventil" : ""}`);
console.log("\nSPEZIFISCHE TAGS (≥1):");
for (const [t, n] of [...tagCount.entries()].sort((a, b) => b[1] - a[1]))
  console.log(`  ${n.toString().padStart(3)}  ${t}`);

const maxCluster = Math.max(...[...unterCount.values()]);
const maxClusterName = [...unterCount.entries()].find(([, n]) => n === maxCluster)?.[0];
console.log("\n─ ERFOLGSKRITERIEN ─");
console.log(`  Sonstiges-Quote:        ${(100 * sonstiges / rows.length).toFixed(0)} %   (Ziel < 15 %, Lauf 1: 0 % = Ventil unbenutzt)`);
console.log(`  kern_im_feld=false:     ${fremdkern} von ${rows.length}   (Lauf-1-Erwartung: ~5–6 Cross-Feld-Items)`);
console.log(`  Größter Cluster:        ${(100 * maxCluster / rows.length).toFixed(0)} % (${maxClusterName})   (Ziel < 40 %)`);
console.log(`  Distinkte Tags:         ${tagCount.size} bei ${rows.length} Items`);
console.log(`  1-Vorkommen-Tags:       ${[...tagCount.values()].filter((n) => n === 1).length} (hohe Zahl = Erfindungs-Risiko)`);
console.log(`\n  Tokens: ${inTok} in / ${outTok} out  (~$${((inTok / 1e6) * 1 + (outTok / 1e6) * 5).toFixed(3)} grob, Haiku-Live)`);
}

main();
