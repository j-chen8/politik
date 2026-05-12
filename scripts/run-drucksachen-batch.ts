/**
 * Voll-Batch-Run für Drucksachen-Analyse via Anthropic Message Batches API.
 *
 *   --dry-run            Vorschau ohne API-Call
 *   --submit             Reicht den Batch ein, gibt Batch-ID aus, exit (Polling separat)
 *   --poll <batch_id>    Poll Status + Results und schreibt in DB
 *   --resume             Übernimmt einen offenen Batch aus drucksache_batch_runs
 *   --classes klein,gross  Nur bestimmte Klassen (default: alle außer skip/administrativ)
 *
 * Idempotenz: DS mit drucksache_analyses.prompt_version = 'v1' AND raw_llm_response IS NOT NULL
 * werden übersprungen.
 *
 * Caching: System-Prompt + Tool-Schema werden als ephemeral cache_control markiert.
 * Drift-Audit: Topic-Tags außerhalb der Enum landen in topic_drift_audit.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, PROMPT_VERSION, SYSTEM_PROMPT_HEADER, TOPIC_TAGS,
  truncateToTokens, BatchClass,
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

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const SUBMIT = argv.includes("--submit");
const POLL_IDX = argv.indexOf("--poll");
const POLL_ID = POLL_IDX >= 0 ? argv[POLL_IDX + 1] : null;
const RESUME = argv.includes("--resume");
const CLASSES_IDX = argv.indexOf("--classes");
const CLASSES_FILTER: string[] | null = CLASSES_IDX >= 0 ? argv[CLASSES_IDX + 1].split(",") : null;

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

// Bookkeeping-Tabelle für Batch-Runs
db.exec(`
  CREATE TABLE IF NOT EXISTS drucksache_batch_runs (
    batch_id TEXT PRIMARY KEY,
    submitted_at TEXT NOT NULL,
    request_count INTEGER NOT NULL,
    classes TEXT,
    status TEXT,
    completed_at TEXT,
    notes TEXT
  )
`);

interface Row { drucksache_nr: string; batch_class: string; full_text: string; tokens_estimate: number }

function dsToCustomId(nr: string): string { return nr.replace(/\//g, "_"); }
function customIdToDs(cid: string): string { return cid.replace(/_/g, "/"); }

function buildRequest(row: Row) {
  const cfg = PROMPTS_BY_CLASS[row.batch_class as BatchClass];
  const { text, truncated } = truncateToTokens(row.full_text, cfg.cap);
  const userContent = `${cfg.instruction}\n\nDRUCKSACHEN-TEXT${truncated ? ` (auf ${cfg.cap} Tokens gekürzt)` : ""}:\n\n${text}`;

  return {
    custom_id: dsToCustomId(row.drucksache_nr),
    params: {
      model: MODEL,
      max_tokens: 1500,
      // System-Block mit Caching
      system: [
        { type: "text", text: SYSTEM_PROMPT_HEADER, cache_control: { type: "ephemeral" } },
      ],
      // Tools mit Caching (kommt nach system im Cache-Chain)
      tools: [
        { ...(cfg.tool as any), cache_control: { type: "ephemeral" } },
      ],
      tool_choice: { type: "tool", name: cfg.tool.name },
      messages: [{ role: "user", content: userContent }],
    },
  };
}

function selectTodos(): Row[] {
  const classes: BatchClass[] = (CLASSES_FILTER ?? ["klein", "mittel", "gross", "antwort", "regierung"]) as BatchClass[];
  const placeholders = classes.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT t.drucksache_nr, t.batch_class, t.full_text, t.tokens_estimate
       FROM drucksache_texts t
       LEFT JOIN drucksache_analyses a
         ON a.drucksache_nr = t.drucksache_nr AND a.prompt_version = '${PROMPT_VERSION}' AND a.raw_llm_response IS NOT NULL
       WHERE t.batch_class IN (${placeholders})
         AND t.parse_error IS NULL
         AND t.full_text IS NOT NULL
         AND LENGTH(t.full_text) > 50
         AND a.drucksache_nr IS NULL`
    )
    .all(...classes) as Row[];
}

function validateAndMapTopics(themas: string[] | undefined): { thema: string[]; drift: string[] } {
  if (!Array.isArray(themas)) return { thema: ["Sonstiges"], drift: [] };
  const accepted: string[] = [];
  const drift: string[] = [];
  for (const t of themas) {
    if (TOPIC_ENUM.has(t)) accepted.push(t);
    else drift.push(t);
  }
  if (accepted.length === 0) accepted.push("Sonstiges");
  return { thema: accepted, drift };
}

async function submitBatch(rows: Row[]) {
  console.log(`📤 ${rows.length} Requests an Anthropic Batch API …`);
  const requests = rows.map(buildRequest);

  if (DRY_RUN) {
    console.log("--dry-run: kein API-Call. Beispiel-Request:");
    console.log(JSON.stringify(requests[0], null, 2).slice(0, 1500) + "\n…");
    return;
  }

  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ Batch eingereicht. ID: ${batch.id}, Status: ${batch.processing_status}`);

  db.prepare(
    `INSERT INTO drucksache_batch_runs (batch_id, submitted_at, request_count, classes, status)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    batch.id,
    new Date().toISOString(),
    rows.length,
    (CLASSES_FILTER ?? ["alle"]).join(","),
    batch.processing_status,
  );

  console.log(`\nPolling:  npx tsx scripts/run-drucksachen-batch.ts --poll ${batch.id}`);
}

async function pollAndIngest(batchId: string) {
  console.log(`📊 Status für Batch ${batchId} …`);
  while (true) {
    const status = await client.messages.batches.retrieve(batchId);
    const counts = status.request_counts;
    console.log(`[${new Date().toLocaleTimeString()}] ${status.processing_status} — succeeded ${counts.succeeded} / errored ${counts.errored} / processing ${counts.processing}`);
    if (status.processing_status === "ended") break;
    await new Promise((r) => setTimeout(r, 30_000));
  }

  console.log("\n📥 Lade Ergebnisse …");
  const upsert = db.prepare(`
    INSERT INTO drucksache_analyses
      (drucksache_nr, batch_class, zusammenfassung, kerninhalt, thema, tonalitaet, betroffene_gruppen, fraktion,
       dokumenttyp, regelung, begruendung, auswirkung, topic_drift_audit, analyze_error,
       model, prompt_version, generated_at, raw_llm_response)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(drucksache_nr) DO UPDATE SET
      batch_class=excluded.batch_class, zusammenfassung=excluded.zusammenfassung,
      kerninhalt=excluded.kerninhalt, thema=excluded.thema, tonalitaet=excluded.tonalitaet,
      betroffene_gruppen=excluded.betroffene_gruppen, fraktion=excluded.fraktion,
      dokumenttyp=excluded.dokumenttyp, regelung=excluded.regelung,
      begruendung=excluded.begruendung, auswirkung=excluded.auswirkung,
      topic_drift_audit=excluded.topic_drift_audit, analyze_error=excluded.analyze_error,
      model=excluded.model, prompt_version=excluded.prompt_version,
      generated_at=excluded.generated_at, raw_llm_response=excluded.raw_llm_response
  `);

  // batch_class aus drucksache_texts holen (custom_id = drucksache_nr)
  const getClass = db.prepare(`SELECT batch_class FROM drucksache_texts WHERE drucksache_nr = ?`);

  let okCount = 0, errCount = 0, driftCount = 0;

  const stream = await client.messages.batches.results(batchId);
  for await (const item of stream) {
    const nr = customIdToDs(item.custom_id);
    const cls = (getClass.get(nr) as { batch_class: string } | undefined)?.batch_class ?? "unknown";

    if (item.result.type !== "succeeded") {
      const err = item.result.type === "errored" ? JSON.stringify(item.result.error).slice(0, 300) : item.result.type;
      upsert.run(nr, cls, null, null, null, null, null, null, null, null, null, null, null, err,
                 MODEL, PROMPT_VERSION, new Date().toISOString(), null);
      errCount++;
      continue;
    }

    const msg = item.result.message;
    const toolUse = msg.content.find((b: any) => b.type === "tool_use") as any;
    if (!toolUse) {
      upsert.run(nr, cls, null, null, null, null, null, null, null, null, null, null, null, "no tool_use in response",
                 MODEL, PROMPT_VERSION, new Date().toISOString(), JSON.stringify(msg));
      errCount++;
      continue;
    }

    const d = toolUse.input as any;
    const { thema, drift } = validateAndMapTopics(d.thema);
    if (drift.length > 0) driftCount++;

    upsert.run(
      nr, cls,
      d.zusammenfassung ?? null,
      JSON.stringify(d.kerninhalt ?? null),
      thema.join(", "),
      d.tonalitaet ?? null,
      d.betroffene_gruppen ?? null,
      d.fraktion ?? null,
      d.dokumenttyp ?? null,
      d.regelung ?? null,
      d.begruendung ?? null,
      d.auswirkung ?? null,
      drift.length > 0 ? JSON.stringify(drift) : null,
      null,
      MODEL, PROMPT_VERSION, new Date().toISOString(),
      JSON.stringify(d),
    );
    okCount++;
  }

  db.prepare(`UPDATE drucksache_batch_runs SET status='ended', completed_at=? WHERE batch_id=?`)
    .run(new Date().toISOString(), batchId);

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich:  ${okCount}`);
  console.log(`  Fehler:       ${errCount}`);
  console.log(`  Topic-Drift:  ${driftCount} (Tags außerhalb Enum, in topic_drift_audit gespeichert)`);
  if (errCount > 0) {
    console.log(`\n  Failures abfragen:`);
    console.log(`    sqlite3 politik.db "SELECT drucksache_nr, analyze_error FROM drucksache_analyses WHERE analyze_error IS NOT NULL"`);
  }
}

async function main() {
  if (POLL_ID) {
    await pollAndIngest(POLL_ID);
    return;
  }
  if (RESUME) {
    const open = db
      .prepare(`SELECT batch_id FROM drucksache_batch_runs WHERE status != 'ended' OR status IS NULL ORDER BY submitted_at DESC LIMIT 1`)
      .get() as { batch_id: string } | undefined;
    if (!open) { console.log("Kein offener Batch in drucksache_batch_runs."); return; }
    console.log(`Resume Batch ${open.batch_id}`);
    await pollAndIngest(open.batch_id);
    return;
  }

  const rows = selectTodos();
  console.log(`📋 ${rows.length} Drucksachen zu analysieren`);
  const byClass = new Map<string, number>();
  let tokSum = 0;
  for (const r of rows) {
    byClass.set(r.batch_class, (byClass.get(r.batch_class) ?? 0) + 1);
    tokSum += Math.min(r.tokens_estimate, PROMPTS_BY_CLASS[r.batch_class as BatchClass].cap);
  }
  console.log(`\nVerteilung:`);
  for (const [c, n] of byClass) console.log(`  ${c.padEnd(12)} ${n}`);
  console.log(`\nGeschätzter Input mit Caps:  ${(tokSum / 1e6).toFixed(2)} M Tokens`);
  console.log(`Geschätzte Kosten (Haiku 4.5 Batch + Caching, Input+Output): ~$${((tokSum / 1e6) * 0.30 + 3).toFixed(2)}`);

  if (rows.length === 0) {
    console.log(`\nNichts zu tun. (Idempotenz greift — alle prompt_version=${PROMPT_VERSION} mit gültigem Output.)`);
    return;
  }

  if (!SUBMIT && !DRY_RUN) {
    console.log(`\nNICHT eingereicht. Zum Einreichen:`);
    console.log(`  npx tsx scripts/run-drucksachen-batch.ts --submit`);
    console.log(`Oder Vorschau:`);
    console.log(`  npx tsx scripts/run-drucksachen-batch.ts --dry-run`);
    return;
  }

  await submitBatch(rows);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
