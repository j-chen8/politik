/**
 * Smoke-Test für rerun-truncated-drucksachen.ts via Live-API (kein Batch).
 * Schreibt NICHT in die DB — gibt nur die LLM-Outputs aus damit man prüfen kann
 * ob die Tier-spezifischen Prompts die gewünschte Struktur produzieren.
 *
 * Nimmt 3 prototypische Records: je 1 massive aus mittel/gross/antwort.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, BatchClass, truncateToTokens,
  buildSystemPromptTiered, determineTier, LENGTH_TIERS,
} from "../src/lib/drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const RERUN_CAP_TOKENS = 100_000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const db = new Database(path.join(process.cwd(), "politik.db"));

const SAMPLES = [
  "21/3250", // mittel/massive — Armuts- und Reichtumsbericht (510 p)
  "21/1511", // gross/massive — Pflege-Krankenvers-Gesetz (190 p)
  "21/726",  // antwort/massive — Angriffe auf Parteibüros (1991 p, data-dump)
];

async function analyze(nr: string) {
  const row = db.prepare(`
    SELECT drucksache_nr, batch_class, full_text, tokens_estimate, pages
    FROM drucksache_texts WHERE drucksache_nr=?
  `).get(nr) as any;
  if (!row) { console.log(`✖ ${nr}: nicht gefunden`); return; }

  const tier = determineTier(row.tokens_estimate, row.pages);
  const cfg = PROMPTS_BY_CLASS[row.batch_class as BatchClass];
  const { text } = truncateToTokens(row.full_text, RERUN_CAP_TOKENS);
  const tierInstruction = `\n\nZielumfang dieser Analyse: Tier "${tier}" → Zusammenfassung ca. ${LENGTH_TIERS[tier].zus_words} Wörter, ${LENGTH_TIERS[tier].bullets} Bullets, andere Textfelder ca. ${LENGTH_TIERS[tier].other_words} Wörter.`;
  const userContent = `${cfg.instruction}${tierInstruction}\n\nDRUCKSACHEN-TEXT:\n\n${text}`;

  console.log(`\n${"=".repeat(80)}\n${nr} (${row.batch_class}, ${row.pages}p, ${row.tokens_estimate}tok) → Tier "${tier}"`);
  console.log(`${"=".repeat(80)}\n`);

  const t0 = Date.now();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 10_000,
    system: [{ type: "text", text: buildSystemPromptTiered(tier, row.batch_class), cache_control: { type: "ephemeral" } }] as any,
    tools: [{ ...(cfg.tool as any), cache_control: { type: "ephemeral" } }] as any,
    tool_choice: { type: "tool", name: cfg.tool.name } as any,
    messages: [{ role: "user", content: userContent }],
  });
  const dur = ((Date.now() - t0) / 1000).toFixed(1);

  const toolUse: any = (msg.content as any[]).find((b) => b.type === "tool_use");
  if (!toolUse) { console.log("  ✖ no tool_use"); return; }
  const d = toolUse.input;

  console.log(`⏱ ${dur}s  ·  Input tokens: ${msg.usage?.input_tokens ?? "?"}  ·  Output tokens: ${msg.usage?.output_tokens ?? "?"}`);
  console.log(`\n--- ZUSAMMENFASSUNG (${d.zusammenfassung?.split(/\s+/).length ?? 0} Wörter) ---`);
  console.log(d.zusammenfassung);
  if (Array.isArray(d.kerninhalt)) {
    console.log(`\n--- KERNINHALT (${d.kerninhalt.length} Bullets) ---`);
    for (const b of d.kerninhalt) console.log(`  • ${b}`);
  }
  if (d.regelung) console.log(`\n--- REGELUNG ---\n${d.regelung}`);
  if (d.begruendung) console.log(`\n--- BEGRÜNDUNG ---\n${d.begruendung}`);
  if (d.auswirkung) console.log(`\n--- AUSWIRKUNG ---\n${d.auswirkung}`);
  console.log(`\nthema: ${(d.thema ?? []).join(", ") || "(LEER!)"}  ·  tonalitaet: ${d.tonalitaet}`);
  if (!d.thema || d.thema.length === 0) {
    console.log(`\n⚠ thema-Feld leer — raw input keys: ${Object.keys(d).join(", ")}`);
  }
}

(async () => {
  for (const nr of SAMPLES) {
    await analyze(nr);
  }
})();
