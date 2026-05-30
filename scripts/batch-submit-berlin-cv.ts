/**
 * Submit-Skript für Berliner CV-Extraktion aus ZWEI Quellen via Anthropic Batch API:
 *   - cv_homepage_text          → cv_homepage_json     (custom_id "hp_<id>")
 *   - agh_bio_text (≥200 Z.)    → cv_agh_json          (custom_id "agh_<id>")
 *
 * Gleicher Prompt/Schema/Version wie batch-submit-cv.ts (scripts/_lib/cv-prompt.ts),
 * nur das Quell-Label im User-Prompt unterscheidet sich → Ergebnisse konsistent.
 *
 * Run:
 *   npx tsx scripts/batch-submit-berlin-cv.ts            # Pre-Flight (Kosten zeigen)
 *   npx tsx scripts/batch-submit-berlin-cv.ts --confirm  # tatsächlich submitten
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { CV_MODEL, CV_SYSTEM_PROMPT, CV_SCHEMA, buildCvUserPrompt } from "./_lib/cv-prompt";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_PATH = path.join(process.cwd(), ".batch-state-berlin-cv.json");
const MAX_TOKENS = 8192;

const CV_TOOL = {
  name: "extract_cv",
  description: "Strukturierter Lebenslauf einer Politikerin / eines Politikers, extrahiert aus dem gelieferten Quelltext gemäß den Regeln im System-Prompt.",
  input_schema: CV_SCHEMA as any,
};

const SYSTEM_WITH_TOOL = `${CV_SYSTEM_PROMPT}

Rufe das Tool \`extract_cv\` mit dem strukturierten Lebenslauf auf.`;

const BERLIN_WHERE = "(agh_bio_url IS NOT NULL OR homepage_source='brave_search_verified')";

interface Src { custom_id: string; name: string; text: string; label: string }

async function main() {
  const doSubmit = process.argv.includes("--confirm");
  console.log("=== Berlin-CV-Batch-Submit (Homepage + AGH) ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");

  if (fs.existsSync(STATE_PATH)) {
    const existing = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    console.log(`⚠ Bestehende ${STATE_PATH}: batch ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) throw new Error("State existiert — erst .batch-state-berlin-cv.json löschen/retrieven");
  }

  const db = new Database(DB_PATH, { readonly: true });

  const hpRows = db.prepare(
    `SELECT id, first_name, last_name, cv_homepage_text AS text
       FROM politicians
      WHERE cv_homepage_text IS NOT NULL AND cv_homepage_json IS NULL
        AND ${BERLIN_WHERE} ORDER BY id`
  ).all() as any[];

  const aghRows = db.prepare(
    `SELECT id, first_name, last_name, agh_bio_text AS text
       FROM politicians
      WHERE agh_bio_text IS NOT NULL AND LENGTH(agh_bio_text) >= 200 AND cv_agh_json IS NULL
        AND ${BERLIN_WHERE} ORDER BY id`
  ).all() as any[];
  db.close();

  const sources: Src[] = [
    ...hpRows.map((r) => ({ custom_id: `hp_${r.id}`, name: `${r.first_name} ${r.last_name}`, text: r.text, label: "Homepage-Text" })),
    ...aghRows.map((r) => ({ custom_id: `agh_${r.id}`, name: `${r.first_name} ${r.last_name}`, text: r.text, label: "Abgeordnetenhaus-Profil" })),
  ];

  console.log(`Homepage-Quellen: ${hpRows.length} · AGH-Quellen: ${aghRows.length} · gesamt ${sources.length}`);
  if (sources.length === 0) { console.log("Nichts zu tun."); return; }

  // Cost-Estimate (Haiku 4.5 Batch = 50 % off; System-Prompt gecached)
  const sysTokens = Math.ceil(SYSTEM_WITH_TOOL.length / 4);
  const userTokensTotal = sources.reduce((a, s) => a + Math.ceil(Math.min(s.text.length, 50000) / 4), 0);
  const outExpected = sources.length * 1200;
  const live =
    (sysTokens * 1.25) / 1e6 +
    (sysTokens * (sources.length - 1) * 0.1) / 1e6 +
    (userTokensTotal * 1) / 1e6 +
    (outExpected * 5) / 1e6;
  console.log(`\nCost-Estimate (Haiku 4.5):`);
  console.log(`  Live-API:  $${live.toFixed(3)}`);
  console.log(`  Batch-API: $${(live * 0.5).toFixed(3)}  (50 % off)\n`);

  const requests = sources.map((s) => ({
    custom_id: s.custom_id,
    params: {
      model: CV_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: "text" as const, text: SYSTEM_WITH_TOOL, cache_control: { type: "ephemeral" as const } },
      ],
      tools: [CV_TOOL] as any,
      tool_choice: { type: "tool" as const, name: CV_TOOL.name } as any,
      messages: [
        { role: "user" as const, content: buildCvUserPrompt(s.name, s.text, s.label) },
      ],
    },
  }));

  if (!doSubmit) {
    console.log(`Pre-Flight only. Mit --confirm tatsächlich submitten.`);
    return;
  }

  console.log(`SUBMITTING ${requests.length} Requests an Anthropic Batch API…`);
  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ batch_id: ${batch.id} · status: ${batch.processing_status}`);

  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        batch_id: batch.id,
        submitted_at: new Date().toISOString(),
        n_requests: requests.length,
        n_homepage: hpRows.length,
        n_agh: aghRows.length,
        estimated_cost_batch_usd: live * 0.5,
        model: CV_MODEL,
      },
      null,
      2
    )
  );
  console.log(`\nState → ${STATE_PATH}`);
  console.log(`Nächster Schritt: npx tsx scripts/batch-retrieve-berlin-cv.ts`);
}

main().catch((e) => {
  console.error("FEHLER:", e);
  process.exit(1);
});
