/**
 * Retrieve-Skript für die CV-Extraktion via Anthropic Batch API.
 *
 * Liest .batch-state-cv.json (von batch-submit-cv.ts), prüft den Batch-Status.
 * Wenn ended: holt die Resultate, schreibt cv_json nach politicians — exakt im
 * selben Format wie seed-cv.ts (cv_source/cv_model/cv_prompt_version).
 *
 * Run:
 *   npx tsx scripts/batch-retrieve-cv.ts          # nur Status
 *   npx tsx scripts/batch-retrieve-cv.ts --apply  # Resultate in DB schreiben
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { CV_MODEL, CV_PROMPT_VERSION } from "./_lib/cv-prompt";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_PATH = path.join(process.cwd(), ".batch-state-cv.json");

async function main() {
  const doApply = process.argv.includes("--apply");

  if (!fs.existsSync(STATE_PATH)) {
    console.error(`Kein ${STATE_PATH} — wurde batch-submit-cv.ts ausgeführt?`);
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
  console.log(`=== CV-Batch-Retrieve ===`);
  console.log(`batch_id: ${state.batch_id} · submitted ${state.submitted_at} · ${state.n_requests} Requests\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");
  const client = new Anthropic({ apiKey });

  const batch = await client.messages.batches.retrieve(state.batch_id);
  const c = batch.request_counts;
  console.log(`Status: ${batch.processing_status}`);
  console.log(`  proc/ok/err/cancel/exp: ${c.processing}/${c.succeeded}/${c.errored}/${c.canceled}/${c.expired}\n`);

  if (batch.processing_status !== "ended") {
    console.log(`Noch nicht fertig — später nochmal aufrufen (Anthropic SLA: max 24h).`);
    return;
  }
  if (!doApply) {
    console.log(`Batch fertig. Mit --apply die ${c.succeeded} Resultate in die DB schreiben.`);
    return;
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");
  const update = db.prepare(
    `UPDATE politicians SET cv_json = ?, cv_source = ?, cv_generated_at = ?,
       cv_model = ?, cv_prompt_version = ?, cv_raw_llm_response = ? WHERE id = ?`
  );

  let ok = 0, fail = 0;
  const now = new Date().toISOString();
  const errors: string[] = [];

  for await (const item of await client.messages.batches.results(state.batch_id)) {
    const pid = parseInt(item.custom_id, 10);
    if (item.result.type !== "succeeded") {
      fail++;
      errors.push(`#${pid}: ${item.result.type}`);
      continue;
    }
    const toolBlock = item.result.message.content.find((b: any) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      fail++;
      errors.push(`#${pid}: kein tool_use-Block (stop_reason=${item.result.message.stop_reason})`);
      continue;
    }
    const cv = toolBlock.input;
    update.run(
      JSON.stringify(cv),
      `wikipedia_de+anthropic:${CV_MODEL}`,
      now,
      `anthropic:${CV_MODEL}`,
      CV_PROMPT_VERSION,
      JSON.stringify(cv),
      pid
    );
    ok++;
  }

  db.close();
  console.log(`=== Fertig === ${ok} CVs geschrieben, ${fail} Fehler`);
  if (errors.length) for (const e of errors) console.log(`  ✗ ${e}`);
}

main().catch((e) => {
  console.error("FEHLER:", e);
  process.exit(1);
});
