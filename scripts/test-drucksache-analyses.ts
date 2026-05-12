/**
 * Test-Run: zieht je 2 random Drucksachen pro batch_class (klein/mittel/gross/
 * antwort/regierung), schickt sie via Anthropic-API durch Haiku 4.5 und speichert
 * Output in drucksache_analyses mit prompt_version='test-v1'.
 *
 * Zweck: Prompt-Qualität validieren BEVOR der Voll-Batch läuft.
 *
 * Run: npx tsx scripts/test-drucksache-analyses.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, PROMPT_VERSION, SYSTEM_PROMPT_HEADER, truncateToTokens, BatchClass,
} from "../src/lib/drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY fehlt");
  process.exit(1);
}

const MODEL = "claude-haiku-4-5-20251001";
const TEST_VERSION = "test-v1";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Row { drucksache_nr: string; batch_class: string; full_text: string; tokens_estimate: number }

async function analyzeOne(row: Row): Promise<{ ok: true; data: any; raw: any } | { ok: false; err: string }> {
  const cfg = PROMPTS_BY_CLASS[row.batch_class as BatchClass];
  if (!cfg) return { ok: false, err: `unknown class: ${row.batch_class}` };

  const { text, truncated } = truncateToTokens(row.full_text, cfg.cap);
  const userContent = `${cfg.instruction}\n\nDRUCKSACHEN-TEXT${truncated ? ` (auf ${cfg.cap} Tokens gekürzt)` : ""}:\n\n${text}`;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT_HEADER,
      tools: [cfg.tool as any],
      tool_choice: { type: "tool", name: cfg.tool.name } as any,
      messages: [{ role: "user", content: userContent }],
    });

    const toolUse = res.content.find((b: any) => b.type === "tool_use") as any;
    if (!toolUse) return { ok: false, err: "no tool_use in response" };

    return { ok: true, data: toolUse.input, raw: res };
  } catch (e) {
    return { ok: false, err: (e as Error).message.slice(0, 300) };
  }
}

async function main() {
  // Sample: 2 zufällige pro Klasse
  const classes: BatchClass[] = ["klein", "mittel", "gross", "antwort", "regierung"];
  const samples: Row[] = [];
  for (const cls of classes) {
    const rows = db
      .prepare(`SELECT drucksache_nr, batch_class, full_text, tokens_estimate FROM drucksache_texts WHERE batch_class = ? AND full_text IS NOT NULL AND LENGTH(full_text) > 100 ORDER BY RANDOM() LIMIT 2`)
      .all(cls) as Row[];
    samples.push(...rows);
  }

  console.log(`🧪 Test-Run: ${samples.length} Drucksachen × Haiku 4.5 via Live-API`);
  console.log(`   (Voll-Batch kommt erst nach deinem Review.)\n`);

  const upsert = db.prepare(`
    INSERT INTO drucksache_analyses
      (drucksache_nr, batch_class, zusammenfassung, kerninhalt, thema, tonalitaet, betroffene_gruppen, fraktion, model, prompt_version, generated_at, raw_llm_response)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(drucksache_nr) DO UPDATE SET
      batch_class         = excluded.batch_class,
      zusammenfassung     = excluded.zusammenfassung,
      kerninhalt          = excluded.kerninhalt,
      thema               = excluded.thema,
      tonalitaet          = excluded.tonalitaet,
      betroffene_gruppen  = excluded.betroffene_gruppen,
      fraktion            = excluded.fraktion,
      model               = excluded.model,
      prompt_version      = excluded.prompt_version,
      generated_at        = excluded.generated_at,
      raw_llm_response    = excluded.raw_llm_response
  `);

  let okCount = 0, errCount = 0;
  for (const s of samples) {
    process.stdout.write(`[${s.batch_class.padEnd(10)}] ${s.drucksache_nr.padEnd(8)} (${s.tokens_estimate} tok) … `);
    const result = await analyzeOne(s);
    if (!result.ok) {
      console.log(`✗ ${result.err}`);
      errCount++;
      continue;
    }
    const d = result.data;
    upsert.run(
      s.drucksache_nr, s.batch_class,
      d.zusammenfassung ?? null,
      JSON.stringify(d.kerninhalt ?? d.regelung ?? null),
      Array.isArray(d.thema) ? d.thema.join(", ") : (d.thema ?? null),
      d.tonalitaet ?? null,
      d.betroffene_gruppen ?? null,
      d.fraktion ?? null,
      MODEL, TEST_VERSION, new Date().toISOString(),
      JSON.stringify(result.data),
    );
    okCount++;
    console.log(`✓`);
  }

  console.log(`\n=== Ergebnisse ===\n`);
  const sql = `SELECT a.drucksache_nr, a.batch_class, a.zusammenfassung, a.kerninhalt, a.thema, a.tonalitaet, a.fraktion, a.betroffene_gruppen, a.raw_llm_response FROM drucksache_analyses a WHERE a.prompt_version = ?`;
  const out = db.prepare(sql).all(TEST_VERSION) as any[];
  for (const r of out) {
    const raw = JSON.parse(r.raw_llm_response);
    console.log(`──── ${r.drucksache_nr}  [${r.batch_class}] ────`);
    console.log(`Zusammenfassung: ${r.zusammenfassung}`);
    console.log(`Thema:           ${r.thema}  ·  Tonalität: ${r.tonalitaet}${r.fraktion ? `  ·  Fraktion: ${r.fraktion}` : ""}`);
    if (r.batch_class === "gross") {
      console.log(`Regelung:        ${raw.regelung}`);
      console.log(`Begründung:      ${raw.begruendung}`);
      if (raw.auswirkung) console.log(`Auswirkung:      ${raw.auswirkung}`);
    } else {
      const k = raw.kerninhalt;
      if (Array.isArray(k)) {
        console.log(`Kerninhalt:`);
        for (const x of k) console.log(`  • ${x}`);
      }
    }
    if (r.betroffene_gruppen) console.log(`Betroffene:      ${r.betroffene_gruppen}`);
    if (raw.dokumenttyp) console.log(`DokTyp:          ${raw.dokumenttyp}`);
    console.log();
  }

  console.log(`OK: ${okCount}, Fehler: ${errCount}`);
}

main().then(() => process.exit(0));
