/**
 * One-off: 21/2682 hat im Batch-Rerun einen invalid_request_error gefehlt
 * (vermutlich token-too-long). Direct Live-API mit 80K our-token cap.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, BatchClass, truncateToTokens, TOPIC_TAGS,
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
const TOPIC_ENUM = new Set<string>([...TOPIC_TAGS]);
const NR = "21/2682";
const CAP = 80_000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const db = new Database(path.join(process.cwd(), "politik.db"));

const row: any = db.prepare(`SELECT * FROM drucksache_texts WHERE drucksache_nr=?`).get(NR);
const tier = determineTier(row.tokens_estimate, row.pages);
const cfg = PROMPTS_BY_CLASS[row.batch_class as BatchClass];
const { text, truncated } = truncateToTokens(row.full_text, CAP);
const tierInstruction = `\n\nZielumfang dieser Analyse: Tier "${tier}" → Zusammenfassung ca. ${LENGTH_TIERS[tier].zus_words} Wörter, ${LENGTH_TIERS[tier].bullets} Bullets, andere Textfelder ca. ${LENGTH_TIERS[tier].other_words} Wörter.`;
const userContent = `${cfg.instruction}${tierInstruction}\n\nDRUCKSACHEN-TEXT (auf ${CAP} Tokens gekürzt):\n\n${text}`;

console.log(`📋 ${NR} (${row.batch_class}, ${row.pages}p, ${row.tokens_estimate}tok) → Tier "${tier}", cap ${CAP}`);

async function main() {
const msg = await client.messages.create({
  model: MODEL,
  max_tokens: 10_000,
  system: [{ type: "text", text: buildSystemPromptTiered(tier, row.batch_class), cache_control: { type: "ephemeral" } }] as any,
  tools: [{ ...(cfg.tool as any), cache_control: { type: "ephemeral" } }] as any,
  tool_choice: { type: "tool", name: cfg.tool.name } as any,
  messages: [{ role: "user", content: userContent }],
});

console.log(`Input tokens: ${msg.usage?.input_tokens}, Output: ${msg.usage?.output_tokens}`);

const toolUse: any = (msg.content as any[]).find((b) => b.type === "tool_use");
if (!toolUse) { console.error("no tool_use"); process.exit(1); }
const d = toolUse.input;

// Validate thema
const accepted: string[] = []; const drift: string[] = [];
for (const t of (d.thema ?? [])) {
  if (TOPIC_ENUM.has(t)) accepted.push(t); else drift.push(t);
}
if (accepted.length === 0) accepted.push("Sonstiges");

db.prepare(`
  UPDATE drucksache_analyses
  SET zusammenfassung=?, kerninhalt=?, thema=?, tonalitaet=?,
      betroffene_gruppen=?, fraktion=?, dokumenttyp=?,
      regelung=?, begruendung=?, auswirkung=?,
      topic_drift_audit=?, analyze_error=NULL,
      model=?, prompt_version='v1.1', generated_at=?, raw_llm_response=?
  WHERE drucksache_nr=?
`).run(
  d.zusammenfassung ?? null,
  JSON.stringify(d.kerninhalt ?? null),
  accepted.join(", "),
  d.tonalitaet ?? null,
  d.betroffene_gruppen ?? null,
  d.fraktion ?? null,
  d.dokumenttyp ?? null,
  d.regelung ?? null,
  d.begruendung ?? null,
  d.auswirkung ?? null,
  drift.length > 0 ? JSON.stringify(drift) : null,
  MODEL, new Date().toISOString(),
  JSON.stringify(d), NR,
);

console.log(`✓ ${NR} → updated to v1.1, ${d.zusammenfassung?.split(/\s+/).length} Wörter, thema=[${accepted.join(",")}]${drift.length ? ` drift=[${drift.join(",")}]` : ""}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
