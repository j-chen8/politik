/**
 * Tiered (Re-)Analyse für die Vote-Kontext-Worklist.
 *
 * Schwester-Skript zu rerun-truncated-drucksachen.ts — IDENTISCHE tiered
 * Prompt-/Request-Logik (importiert, nicht dupliziert), aber:
 *  - Selektion aus vote-context-worklist.txt (eine drucksache_nr je Zeile),
 *    NICHT der heavy-truncated-Heuristik. Die Worklist = alle einem der 50
 *    bundestag.de-Polls zugeordneten DS ohne gute Analyse (fehlend +
 *    regex-labeler-Stub + dünn-v1 bei vote-relevanten Typen).
 *  - Ingest per UPSERT (INSERT … ON CONFLICT DO UPDATE) — die Worklist
 *    enthält DS OHNE bestehende Analyse-Zeile (Kat KEINE_ANALYSE); ein
 *    bare UPDATE würde diese still verlieren.
 *  - prompt_version='v1.1' (gleiche tiered Qualität wie der 209-Rerun).
 *
 *   --dry-run     Vorschau (Klassifikation + Cost + Beispiel-Request)
 *   --submit      Reicht den Batch ein
 *   --poll <id>   Pollt Status + schreibt Ergebnisse (UPSERT)
 *   --resume      Übernimmt offenen Vote-Worklist-Batch
 *   --limit N     Nur erste N (Smoke-Test)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, TOPIC_TAGS, truncateToTokens, BatchClass,
  LENGTH_TIERS, LengthTier, determineTier, buildSystemPromptTiered,
} from "../src/lib/drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const NEW_PROMPT_VERSION = "v1.1";
const WORKLIST_PATH = path.join(process.cwd(), "vote-context-worklist.txt");
const BATCH_NOTE = "vote-context-worklist-v1.1";
const TOPIC_ENUM = new Set<string>([...TOPIC_TAGS]);

// Wie beim 209-Rerun: effektiv kein Truncate (100K our-Tokens Headroom).
const RERUN_CAP_TOKENS = 100_000;
const MAX_OUTPUT_TIERS: Record<LengthTier, number> = {
  standard: 2000,
  long:     5000,
  massive:  10000,
};

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const SUBMIT = argv.includes("--submit");
const POLL_IDX = argv.indexOf("--poll");
const POLL_ID = POLL_IDX >= 0 ? argv[POLL_IDX + 1] : null;
const RESUME = argv.includes("--resume");
const LIMIT_IDX = argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(argv[LIMIT_IDX + 1], 10) : null;

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

interface Row {
  drucksache_nr: string;
  batch_class: string;
  full_text: string;
  tokens_estimate: number;
  pages: number | null;
}

function dsToCustomId(nr: string): string { return nr.replace(/\//g, "_"); }
function customIdToDs(cid: string): string { return cid.replace(/_/g, "/"); }

// IDENTISCH zu rerun-truncated-drucksachen.ts::buildRequest (tiered)
function buildRequest(row: Row) {
  const tier = determineTier(row.tokens_estimate, row.pages);
  const cfg = PROMPTS_BY_CLASS[row.batch_class as BatchClass];
  const { text, truncated } = truncateToTokens(row.full_text, RERUN_CAP_TOKENS);

  const tierInstruction = `\n\nZielumfang dieser Analyse: Tier "${tier}" → Zusammenfassung ca. ${LENGTH_TIERS[tier].zus_words} Wörter, ${LENGTH_TIERS[tier].bullets} Bullets, andere Textfelder ca. ${LENGTH_TIERS[tier].other_words} Wörter. Decke alle Hauptbefunde / -kapitel ab.`;

  const userContent = `${cfg.instruction}${tierInstruction}\n\nDRUCKSACHEN-TEXT${truncated ? ` (auf ${RERUN_CAP_TOKENS} Tokens gekürzt — Original ${row.tokens_estimate} Tok)` : ""}:\n\n${text}`;

  return {
    custom_id: dsToCustomId(row.drucksache_nr),
    params: {
      model: MODEL,
      max_tokens: MAX_OUTPUT_TIERS[tier],
      system: [
        { type: "text", text: buildSystemPromptTiered(tier, row.batch_class), cache_control: { type: "ephemeral" } },
      ],
      tools: [
        { ...(cfg.tool as any), cache_control: { type: "ephemeral" } },
      ],
      tool_choice: { type: "tool", name: cfg.tool.name },
      messages: [{ role: "user", content: userContent }],
    },
  };
}

function selectTodos(): Row[] {
  if (!fs.existsSync(WORKLIST_PATH)) {
    console.error(`Worklist fehlt: ${WORKLIST_PATH}`);
    process.exit(1);
  }
  const nrs = fs.readFileSync(WORKLIST_PATH, "utf-8")
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const get = db.prepare(`
    SELECT drucksache_nr, batch_class, full_text, tokens_estimate, pages
    FROM drucksache_texts
    WHERE drucksache_nr = ? AND full_text IS NOT NULL AND LENGTH(full_text) > 50
  `);
  const rows: Row[] = [];
  const missing: string[] = [];
  const noPrompt: string[] = [];
  for (const nr of nrs) {
    const r = get.get(nr) as Row | undefined;
    if (!r) { missing.push(nr); continue; }
    // Defensiv: nur LLM-analysierbare Klassen. 'administrativ' (Wahlvorschlag/
    // Sammelübersicht) hat per Design KEINEN PROMPTS_BY_CLASS-Eintrag — Regex-
    // Label ist dort die korrekte Behandlung, nicht ein erzwungenes LLM-Summary.
    if (!PROMPTS_BY_CLASS[r.batch_class as BatchClass]) { noPrompt.push(`${nr} (${r.batch_class})`); continue; }
    rows.push(r);
  }
  if (missing.length) console.warn(`⚠ ${missing.length} Worklist-Nrn ohne brauchbaren Volltext übersprungen: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? " …" : ""}`);
  if (noPrompt.length) console.warn(`⚠ ${noPrompt.length} ohne LLM-Prompt-Klasse übersprungen (korrekt administrativ): ${noPrompt.join(", ")}`);
  return LIMIT ? rows.slice(0, LIMIT) : rows;
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
    console.log("--dry-run: kein API-Call. Beispiel-Request (erster):");
    console.log(JSON.stringify(requests[0], null, 2).slice(0, 1800) + "\n…");
    return;
  }

  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ Batch eingereicht. ID: ${batch.id}, Status: ${batch.processing_status}`);

  db.prepare(
    `INSERT INTO drucksache_batch_runs (batch_id, submitted_at, request_count, classes, status, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    batch.id, new Date().toISOString(), rows.length,
    "vote-worklist", batch.processing_status, BATCH_NOTE
  );

  console.log(`\nPolling:  npx tsx scripts/rerun-vote-worklist-drucksachen.ts --poll ${batch.id}`);
}

async function pollAndIngest(batchId: string) {
  console.log(`📊 Status für Batch ${batchId} …`);
  while (true) {
    const status = await client.messages.batches.retrieve(batchId);
    const c = status.request_counts;
    console.log(`[${new Date().toLocaleTimeString()}] ${status.processing_status} — succeeded ${c.succeeded} / errored ${c.errored} / processing ${c.processing}`);
    if (status.processing_status === "ended") break;
    await new Promise((r) => setTimeout(r, 30_000));
  }

  console.log("\n📥 Lade Ergebnisse … (UPSERT — Kat KEINE_ANALYSE hat keine Bestandszeile)");
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
  const getClass = db.prepare(`SELECT batch_class FROM drucksache_texts WHERE drucksache_nr = ?`);

  let ok = 0, err = 0, drift = 0;
  const stream = await client.messages.batches.results(batchId);
  for await (const item of stream) {
    const nr = customIdToDs(item.custom_id);

    if (item.result.type !== "succeeded") {
      const e = item.result.type === "errored" ? JSON.stringify(item.result.error).slice(0, 300) : item.result.type;
      console.log(`  ✖ ${nr}: ${e.slice(0, 100)}`);
      err++;
      continue;
    }

    const msg = item.result.message;
    const toolUse: any = (msg.content as any[]).find((b) => b.type === "tool_use");
    if (!toolUse) { console.log(`  ✖ ${nr}: no tool_use`); err++; continue; }

    const d = toolUse.input as any;
    const { thema, drift: dArr } = validateAndMapTopics(d.thema);
    if (dArr.length > 0) drift++;
    const cls = (getClass.get(nr) as { batch_class: string } | undefined)?.batch_class ?? null;

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
      dArr.length > 0 ? JSON.stringify(dArr) : null,
      null,
      MODEL, NEW_PROMPT_VERSION, new Date().toISOString(),
      JSON.stringify(d),
    );
    ok++;
  }

  db.prepare(`UPDATE drucksache_batch_runs SET status='ended', completed_at=? WHERE batch_id=?`)
    .run(new Date().toISOString(), batchId);

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Fehler:      ${err}`);
  console.log(`  Topic-Drift: ${drift}`);
}

async function main() {
  if (POLL_ID) { await pollAndIngest(POLL_ID); return; }
  if (RESUME) {
    const open = db.prepare(`SELECT batch_id FROM drucksache_batch_runs WHERE notes='${BATCH_NOTE}' AND status != 'ended' ORDER BY submitted_at DESC LIMIT 1`).get() as { batch_id: string } | undefined;
    if (!open) { console.log("Kein offener Vote-Worklist-Batch."); return; }
    console.log(`Resume Batch ${open.batch_id}`);
    await pollAndIngest(open.batch_id);
    return;
  }

  const rows = selectTodos();
  console.log(`📋 ${rows.length} DS aus Vote-Kontext-Worklist`);

  const tierCount = new Map<LengthTier, number>();
  const classCount = new Map<string, number>();
  let tokSum = 0, outSum = 0;
  for (const r of rows) {
    const t = determineTier(r.tokens_estimate, r.pages);
    tierCount.set(t, (tierCount.get(t) ?? 0) + 1);
    classCount.set(r.batch_class, (classCount.get(r.batch_class) ?? 0) + 1);
    tokSum += Math.min(r.tokens_estimate, RERUN_CAP_TOKENS);
    outSum += MAX_OUTPUT_TIERS[t];
  }
  console.log(`\nVerteilung Tier:`);
  for (const [t, n] of tierCount) console.log(`  ${t.padEnd(10)} ${n}`);
  console.log(`Verteilung Klasse:`);
  for (const [c, n] of classCount) console.log(`  ${c.padEnd(12)} ${n}`);
  console.log(`\nInput-Tokens-Sum:  ${(tokSum / 1e6).toFixed(2)} M`);
  console.log(`Output-Tokens-Cap: ${(outSum / 1e6).toFixed(2)} M`);
  const inCost = (tokSum / 1e6) * 0.50;
  const outCost = (outSum / 1e6) * 2.50;
  console.log(`Cost-Estimate (worst case): ~$${(inCost + outCost).toFixed(2)}`);

  if (SUBMIT || DRY_RUN) {
    await submitBatch(rows);
  } else {
    console.log("\n→ Mit --submit reichst du den Batch ein.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
