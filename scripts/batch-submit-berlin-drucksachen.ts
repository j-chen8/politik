/**
 * Berlin-Drucksachen Batch-Submit für 4-stufigen Vollauf via Anthropic Batch API.
 *
 * Strategie (analog Reden-Pipeline, kumulative Targets):
 *   --batch=1  →     100 DS (~$0,60)  Schema-Sanity, stratifiziert über alle Klassen
 *   --batch=2  →   1.000 DS (~$6)     Pattern-Stability, Audit nach Stage 1
 *   --batch=3  →   7.769 DS (~$45)    37 %-Threshold nach Reden-Logik
 *   --batch=4  →  19.294 DS (~$115)   Production Run, Rest des Korpus
 *
 * Stratifiziert über Klasse × (Senatsverwaltung/Fraktion). Skip bereits in
 * berlin_drucksachen_analyses vorhandene dbids (idempotent).
 *
 * 4 Klassen → 4 versch. Tools/System-Prompts. Requests werden nach Klasse SORTIERT
 * damit Cache pro Klasse warm bleibt.
 *
 * Beschlussempfehlungen (936) werden separat via Regex-Skript verarbeitet und
 * hier ausgenommen. Antwort-DS mit Anfrage-Counterpart werden geskippt
 * (15.880 byte-identische Duplikate). Orphan + längere Antworten (780) werden
 * als anfrage_antwort analysiert.
 *
 * Run:
 *   npx tsx scripts/batch-submit-berlin-drucksachen.ts --batch=1            (Pre-Flight)
 *   npx tsx scripts/batch-submit-berlin-drucksachen.ts --batch=1 --confirm  (Submit)
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, PROMPT_VERSION, BerlinBatchClass,
  buildSystemPrompt, stripBoilerplate, capText,
  classifyBerlinDoc, buildAntwortMetaMap,
} from "../src/lib/berlin-drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const METHOD_PATH = path.join(process.cwd(), "docs/summarization-methodology-berlin-drucksachen.md");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin-ds");
const MIN_CHARS = 500;
const MAX_TOKENS = 2048;
const MODEL = "claude-haiku-4-5";

// Kumulative Targets (analog Reden-Pipeline)
// Stage 1=100, 2=1000, 3 = 1000 + 37 % vom Rest, 4 = Rest
const BATCH_SIZES: Record<number, number> = {
  1: 100,
  2: 1000,
  3: 7769,  // 1000 + 0,37 × (19294 − 1000)
  4: 19294,
};

interface DSCandidate {
  dbid: string;
  vorgang_id: string | null;
  dok_typ_label: string;
  titel: string | null;
  full_text: string;
  chars: number;
  klasse: BerlinBatchClass;
}

function customId(dbid: string): string {
  return dbid.replace(/[^a-zA-Z0-9_-]/g, "_");
}

// Lightweight-Row für Stratifizierung (kein full_text)
interface DSMeta {
  dbid: string;
  vorgang_id: string | null;
  dok_typ_label: string;
  titel: string | null;
  chars: number;
  klasse: BerlinBatchClass;
}

function selectCandidatesStratified(db: Database.Database, batchStage: number): DSCandidate[] {
  // Skip bereits analysierte DS (ohne beschlussempfehlung_regex — die werden anderweitig erzeugt)
  const alreadyDone = new Set(
    (db.prepare(`
      SELECT dbid FROM berlin_drucksachen_analyses
      WHERE klasse != 'beschlussempfehlung_regex' AND error_type IS NULL
    `).all() as { dbid: string }[]).map((r) => r.dbid)
  );

  // AntwortMeta für Edge-Case-Routing
  const antwortMeta = buildAntwortMetaMap(db);

  // Phase 1: NUR Meta laden (ohne full_text) — Heap-Sparsam
  const metaRows = db.prepare(`
    SELECT d.dbid, d.vorgang_id, d.dok_typ_label, d.titel, t.chars
      FROM berlin_documents d
      JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
     WHERE t.chars >= ?
  `).all(MIN_CHARS) as Omit<DSMeta, "klasse">[];

  // Klassifikation
  const eligible: DSMeta[] = [];
  for (const r of metaRows) {
    const meta = r.dok_typ_label === "Antwort" ? antwortMeta.get(r.dbid) : undefined;
    const cls = classifyBerlinDoc(r.dok_typ_label, meta);
    if (cls === "skip" || cls === "beschlussempfehlung_skip") continue;
    if (alreadyDone.has(r.dbid)) continue;
    eligible.push({ ...r, klasse: cls });
  }

  console.log(`  ${metaRows.length} DS gesamt eligible (≥${MIN_CHARS} Z.)`);
  console.log(`  ${alreadyDone.size} bereits analysiert, ${eligible.length} verbleibend`);

  const targetSize = BATCH_SIZES[batchStage];
  const numToAdd = Math.max(0, targetSize - alreadyDone.size);
  if (numToAdd === 0) {
    console.log(`  Stage-${batchStage}-Ziel (${targetSize}) bereits erreicht.`);
    return [];
  }

  // Stratifiziert wählen
  let pickedMeta: DSMeta[];
  if (numToAdd >= eligible.length) {
    console.log(`  Wähle alle ${eligible.length} verbleibenden (Ziel: +${numToAdd})`);
    pickedMeta = eligible;
  } else {
    const buckets = new Map<string, DSMeta[]>();
    for (const c of eligible) {
      const key = `${c.klasse}__${bucketKey(c.titel)}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(c);
    }
    const rng = mulberry32(42 + batchStage);
    for (const arr of buckets.values()) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    pickedMeta = [];
    const bucketKeys = [...buckets.keys()];
    while (pickedMeta.length < numToAdd) {
      let added = false;
      for (const k of bucketKeys) {
        if (pickedMeta.length >= numToAdd) break;
        const arr = buckets.get(k)!;
        if (arr.length > 0) { pickedMeta.push(arr.pop()!); added = true; }
      }
      if (!added) break;
    }
    console.log(`  Stratifiziert: ${pickedMeta.length} DS über ${bucketKeys.length} Buckets`);
  }

  // Phase 2: full_text NUR für ausgewählte DS laden (Heap-Sparsam)
  const fetchStmt = db.prepare(`
    SELECT t.full_text FROM berlin_documents d
      JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
     WHERE d.dbid = ?
  `);
  const out: DSCandidate[] = pickedMeta.map((m) => {
    const row = fetchStmt.get(m.dbid) as { full_text: string } | undefined;
    if (!row) throw new Error(`Kein Volltext für ${m.dbid}`);
    return { ...m, full_text: row.full_text };
  });
  return sortForCache(out);
}

/** Sortiert nach Klasse damit Cache pro System-Prompt warm bleibt (5-Min-TTL). */
function sortForCache(rows: DSCandidate[]): DSCandidate[] {
  const order: BerlinBatchClass[] = ["anfrage_antwort", "antrag", "vorlage_senat", "gesetzentwurf"];
  return [...rows].sort((a, b) => order.indexOf(a.klasse) - order.indexOf(b.klasse));
}

/** Grobe Bucket-Heuristik für Stratifizierung (kein perfektes Mapping nötig). */
function bucketKey(titel: string | null): string {
  if (!titel) return "OTHER";
  const t = titel.toLowerCase();
  if (/\b(woh|miet|stadt|bau|liegens)/.test(t)) return "wohnen";
  if (/\b(verkehr|bvg|mobil|öpnv|rad)/.test(t)) return "verkehr";
  if (/\b(polizei|justiz|sicherh)/.test(t)) return "sicherheit";
  if (/\b(bildung|schule|kita|hochschul)/.test(t)) return "bildung";
  if (/\b(gesund|pflege|sozial)/.test(t)) return "soziales";
  if (/\b(klima|umwelt|energie)/.test(t)) return "klima";
  if (/\b(verwalt|digital|bezirk)/.test(t)) return "verwaltung";
  if (/\b(migr|geflücht|integration)/.test(t)) return "migration";
  return "sonstiges";
}

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const args = process.argv.slice(2);
  const batchArg = args.find((a) => a.startsWith("--batch="));
  if (!batchArg) {
    console.error("Usage: --batch=1|2|3|4 [--confirm]");
    process.exit(1);
  }
  const batchStage = parseInt(batchArg.split("=")[1], 10);
  if (!(batchStage in BATCH_SIZES)) {
    console.error(`Stage muss 1, 2, 3 oder 4 sein (war: ${batchStage})`);
    process.exit(1);
  }
  const doSubmit = args.includes("--confirm");

  console.log(`=== Berlin-DS Batch-Submit (Stage ${batchStage}, kumuliert ${BATCH_SIZES[batchStage]}) ===\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in .env");
  if (!fs.existsSync(METHOD_PATH)) throw new Error(`Methodology missing: ${METHOD_PATH}`);

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const stateFile = path.join(STATE_DIR, `batch-${batchStage}.json`);
  if (fs.existsSync(stateFile)) {
    const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    console.log(`⚠ Bestehender Batch für Stage ${batchStage}: ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) {
      console.log(`  Lösche zuerst ${stateFile} wenn das ein neuer Submit sein soll.`);
      process.exit(1);
    }
  }

  const methodology = fs.readFileSync(METHOD_PATH, "utf-8");
  const methodologySha = crypto.createHash("sha256").update(methodology).digest("hex").slice(0, 16);
  console.log(`Methodology-SHA: ${methodologySha} · Prompt-Version: ${PROMPT_VERSION}`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  const candidates = selectCandidatesStratified(db, batchStage);
  db.close();

  if (candidates.length === 0) return;

  // Per-Klasse-Stats
  const byKlasse = new Map<BerlinBatchClass, DSCandidate[]>();
  for (const c of candidates) {
    if (!byKlasse.has(c.klasse)) byKlasse.set(c.klasse, []);
    byKlasse.get(c.klasse)!.push(c);
  }
  console.log("\nVerteilung pro Klasse:");
  for (const [k, arr] of byKlasse) console.log(`  ${k.padEnd(18)} ${arr.length}`);

  // Build Requests
  const requests = candidates.map((c) => {
    const cfg = PROMPTS_BY_CLASS[c.klasse];
    const stripped = stripBoilerplate(c.full_text);
    const { text, truncated } = capText(stripped, cfg.cap_chars);
    const systemPrompt = buildSystemPrompt();
    const userContent = `${cfg.instruction}\n\nDRUCKSACHEN-TEXT (Doc-Typ: ${c.dok_typ_label}${truncated ? `, gekürzt auf ${cfg.cap_chars} Z.` : ""}):\n\n${text}`;
    return {
      _meta: { dbid: c.dbid, klasse: c.klasse, chars_in: text.length },
      custom_id: customId(c.dbid),
      params: {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
        tools: [cfg.tool] as any,
        tool_choice: { type: "tool" as const, name: cfg.tool.name } as any,
        messages: [{ role: "user" as const, content: userContent }],
      },
    };
  });

  // Cost-Estimate
  const totalChars = requests.reduce((a, r) => a + r._meta.chars_in, 0);
  const userTokens = Math.ceil(totalChars / 4);
  // System-Prompt ist klassen-unabhängig → 1× cache-write, der Rest cache-read.
  const sysTokens = Math.ceil(buildSystemPrompt().length / 4);
  const numClasses = byKlasse.size;
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost = (sysTokens * (requests.length - 1) * 0.05) / 1_000_000;
  const userInputCost = (userTokens * 1) / 1_000_000;
  const outputTokensExpected = requests.length * 800;
  const outputCost = (outputTokensExpected * 5) / 1_000_000;
  const totalLive = cacheWriteCost + cacheReadCost + userInputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  const payloadSize = JSON.stringify(requests.map((r) => ({ custom_id: r.custom_id, params: r.params }))).length;
  console.log(`\nΣ User-Input: ${totalChars.toLocaleString("de-DE")} Z. (~${(userTokens / 1000).toFixed(0)}k Tokens)`);
  console.log(`System-Prompt: ~${(sysTokens / 1000).toFixed(1)}k Tokens, klassen-unabhängig (1× cache-write, ${requests.length - 1}× cache-read über ${numClasses} Klassen)`);
  console.log(`Payload-Größe: ${(payloadSize / 1_000_000).toFixed(1)} MB (Limit 256 MB)`);
  console.log(`Cost-Estimate Haiku 4.5 Live:  $${totalLive.toFixed(2)}`);
  console.log(`Cost-Estimate Haiku 4.5 Batch: $${totalBatch.toFixed(2)} (50 % off)`);

  if (!doSubmit) {
    console.log(`\nPre-Flight only. --confirm für Submit.`);
    return;
  }

  console.log(`\n→ Submitting Batch...`);
  const client = new Anthropic({ apiKey });
  const t0 = Date.now();
  const batch = await client.messages.batches.create({
    requests: requests.map((r) => ({ custom_id: r.custom_id, params: r.params })) as any,
  });
  console.log(`✓ batch_id: ${batch.id} · status: ${batch.processing_status} · ${Date.now() - t0}ms`);

  const state = {
    batch_stage: batchStage,
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    prompt_version: PROMPT_VERSION,
    methodology_sha: methodologySha,
    request_count: requests.length,
    klasse_breakdown: Object.fromEntries([...byKlasse].map(([k, arr]) => [k, arr.length])),
    custom_id_to_dbid: Object.fromEntries(requests.map((r) => [r.custom_id, r._meta.dbid])),
    custom_id_to_klasse: Object.fromEntries(requests.map((r) => [r.custom_id, r._meta.klasse])),
    estimated_cost_batch: Number(totalBatch.toFixed(2)),
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`✓ State: ${stateFile}`);
  console.log(`\nNext: npx tsx scripts/batch-retrieve-berlin-drucksachen.ts --batch=${batchStage}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
