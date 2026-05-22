/**
 * Submit-Skript für CV-Extraktion via Anthropic Batch API (50 % günstiger als
 * Live-API). Batch-Pendant zu seed-cv.ts — gleicher Prompt/Schema aus
 * scripts/_lib/cv-prompt.ts, daher konsistente Ergebnisse.
 *
 * Lädt Politiker:innen mit bio_full_text aber ohne cv_json, baut je einen
 * Tool-Use-Request (System-Prompt gecached), schickt als Batch, speichert
 * batch_id in .batch-state-cv.json für batch-retrieve-cv.ts.
 *
 * Run:
 *   npx tsx scripts/batch-submit-cv.ts --ids=1,2,3            # Pre-Flight (Kosten zeigen)
 *   npx tsx scripts/batch-submit-cv.ts --ids=1,2,3 --confirm  # tatsächlich submitten
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
const STATE_PATH = path.join(process.cwd(), ".batch-state-cv.json");
const MAX_TOKENS = 8192;

const CV_TOOL = {
  name: "extract_cv",
  description: "Strukturierter Lebenslauf einer Politikerin / eines Politikers, extrahiert aus dem gelieferten Wikipedia-Artikel gemäß den Regeln im System-Prompt.",
  input_schema: CV_SCHEMA as any,
};

const SYSTEM_WITH_TOOL = `${CV_SYSTEM_PROMPT}

Rufe das Tool \`extract_cv\` mit dem strukturierten Lebenslauf auf.`;

interface Row {
  id: number;
  first_name: string;
  last_name: string;
  bio_full_text: string;
}

async function main() {
  const args = process.argv.slice(2);
  const doSubmit = args.includes("--confirm");
  const idsArg = args.find((a) => a.startsWith("--ids="));
  const onlyIds = idsArg
    ? idsArg.replace("--ids=", "").split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n))
    : null;

  console.log("=== CV-Batch-Submit ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");

  if (fs.existsSync(STATE_PATH)) {
    const existing = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    console.log(`⚠ Bestehende ${STATE_PATH}: batch ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) throw new Error("State existiert — erst .batch-state-cv.json löschen/retrieven");
  }

  const db = new Database(DB_PATH, { readonly: true });
  const idFilter = onlyIds ? `AND id IN (${onlyIds.join(",")})` : "";
  const rows = db
    .prepare(
      `SELECT id, first_name, last_name, bio_full_text
       FROM politicians
       WHERE bio_full_text IS NOT NULL AND length(bio_full_text) > 200
         AND cv_json IS NULL ${idFilter}
       ORDER BY id`
    )
    .all() as Row[];
  db.close();

  console.log(`Politiker:innen ohne CV: ${rows.length}`);
  if (rows.length === 0) { console.log("Nichts zu tun."); return; }

  // Cost-Estimate (Haiku 4.5 Batch = 50 % off; System-Prompt gecached)
  const sysTokens = Math.ceil(SYSTEM_WITH_TOOL.length / 4);
  const userTokensTotal = rows.reduce((a, r) => a + Math.ceil(Math.min(r.bio_full_text.length, 50000) / 4), 0);
  const outExpected = rows.length * 1200;
  const live =
    (sysTokens * 1.25) / 1e6 +                       // cache write (1×)
    (sysTokens * (rows.length - 1) * 0.1) / 1e6 +    // cache read
    (userTokensTotal * 1) / 1e6 +                    // user input
    (outExpected * 5) / 1e6;                         // output
  console.log(`\nCost-Estimate (Haiku 4.5):`);
  console.log(`  Live-API:  $${live.toFixed(3)}`);
  console.log(`  Batch-API: $${(live * 0.5).toFixed(3)}  (50 % off)\n`);

  const requests = rows.map((r) => ({
    custom_id: String(r.id),
    params: {
      model: CV_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: "text" as const, text: SYSTEM_WITH_TOOL, cache_control: { type: "ephemeral" as const } },
      ],
      tools: [CV_TOOL] as any,
      tool_choice: { type: "tool" as const, name: CV_TOOL.name } as any,
      messages: [
        { role: "user" as const, content: buildCvUserPrompt(`${r.first_name} ${r.last_name}`, r.bio_full_text) },
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
        estimated_cost_batch_usd: live * 0.5,
        model: CV_MODEL,
      },
      null,
      2
    )
  );
  console.log(`\nState → ${STATE_PATH}`);
  console.log(`Nächster Schritt: npx tsx scripts/batch-retrieve-cv.ts`);
}

main().catch((e) => {
  console.error("FEHLER:", e);
  process.exit(1);
});
