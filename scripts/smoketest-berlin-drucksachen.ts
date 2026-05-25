/**
 * Smoke-Test: 10 stratifizierte Berlin-Drucksachen via Haiku 4.5 Batch-API.
 *
 * Stichprobe: 5 anfrage_antwort + 2 antrag + 2 vorlage_senat + 1 gesetzentwurf
 *
 * Run: npx tsx scripts/smoketest-berlin-drucksachen.ts          (Pre-Flight)
 *      npx tsx scripts/smoketest-berlin-drucksachen.ts --confirm (Batch submit + polling)
 *
 * Cost: ~$0,05 für 10 DS via Batch.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, PROMPT_VERSION, BerlinBatchClass, BERLIN_TOPIC_TAGS,
  buildSystemPrompt, stripBoilerplate, capText,
  classifyBerlinDoc,
  extractHeaderMeta, formatHeaderMetaBlock,
} from "../src/lib/berlin-drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const REPORT_PATH = path.join(process.cwd(), "scripts/smoketest-berlin-drucksachen.report.json");
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 2048;

interface DSRow {
  dbid: string;
  dok_typ_label: string;
  titel: string | null;
  chars: number;
  pages: number | null;
  full_text: string;
  klasse: BerlinBatchClass;
}

function selectSample(db: Database.Database): DSRow[] {
  const queries: Array<[BerlinBatchClass, string, number]> = [
    ["anfrage_antwort", "Schriftliche Anfrage", 5],
    ["antrag", "Antrag", 2],
    ["vorlage_senat", "Vorlage zur Kenntnisnahme", 2],
    ["gesetzentwurf", "Vorlage zur Beschlussfassung (Gesetzentwurf)", 1],
  ];
  const out: DSRow[] = [];
  for (const [klasse, typ, n] of queries) {
    const rows = db.prepare(`
      SELECT d.dbid, d.dok_typ_label, d.titel, t.chars, t.pages, t.full_text
      FROM berlin_documents d JOIN berlin_pdf_texts t ON d.lok_url=t.lok_url
      WHERE d.dok_typ_label = ? AND t.chars BETWEEN 3000 AND 50000
      ORDER BY RANDOM() LIMIT ?
    `).all(typ, n) as Omit<DSRow, "klasse">[];
    for (const r of rows) out.push({...r, klasse});
  }
  return out;
}

async function main() {
  const doSubmit = process.argv.includes("--confirm");
  console.log("=== Berlin-DS Smoke-Test ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");

  const db = new Database(DB_PATH, { readonly: true });
  const sample = selectSample(db);
  db.close();

  console.log(`Stichprobe: ${sample.length} DS`);
  for (const s of sample) {
    console.log(`  ${s.dbid} | ${s.klasse.padEnd(18)} | ${s.chars.toString().padStart(6)}Z | ${(s.titel ?? "—").slice(0, 60)}`);
  }

  // Build Batch-Requests mit Boilerplate-Strip + Cap. v1.1: kein Tier mehr, 1 System-Prompt pro Klasse für Cache-Hit.
  const requests = sample.map((s) => {
    const cfg = PROMPTS_BY_CLASS[s.klasse];
    const headerMetaBlock = formatHeaderMetaBlock(extractHeaderMeta(s.full_text, s.titel));
    const stripped = stripBoilerplate(s.full_text);
    const { text, truncated } = capText(stripped, cfg.cap_chars);
    const systemPrompt = buildSystemPrompt();
    const userContent = `${cfg.instruction}\n\n${headerMetaBlock}DRUCKSACHEN-TEXT (Doc-Typ: ${s.dok_typ_label}${truncated ? `, gekürzt auf ${cfg.cap_chars} Z.` : ""}):\n\n${text}`;
    return {
      custom_id: s.dbid.replace(/[^a-zA-Z0-9_-]/g, "_"),
      _meta: { dbid: s.dbid, klasse: s.klasse, chars_after_strip: stripped.length, chars_after_cap: text.length, truncated },
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

  // Pre-Flight-Stats
  const totalCharsInput = requests.reduce((a, r) => a + r._meta.chars_after_cap, 0);
  const sysTokens = Math.ceil(buildSystemPrompt().length / 4);
  const userTokens = Math.ceil(totalCharsInput / 4);
  const outputEstimate = sample.length * 1000;
  const inputCostBatch = userTokens * 0.5 / 1_000_000;
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost = (sysTokens * (sample.length - 1) * 0.05) / 1_000_000;
  const outputCost = outputEstimate * 2.5 / 1_000_000;
  const totalBatch = inputCostBatch + cacheWriteCost + cacheReadCost + outputCost;

  console.log(`\nNach Boilerplate-Strip + Cap: ${totalCharsInput.toLocaleString("de-DE")} Z (= ~${(userTokens/1000).toFixed(0)}k Tokens)`);
  console.log(`System-Prompt: ${(sysTokens/1000).toFixed(1)}k Tokens (gecached)`);
  console.log(`Cost-Estimate (Haiku 4.5 Batch): $${totalBatch.toFixed(3)}`);

  if (!doSubmit) {
    console.log("\nPre-Flight only. --confirm für Batch.");
    return;
  }

  // Submit Batch
  console.log("\n→ Submit Batch...");
  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.create({
    requests: requests.map(r => ({ custom_id: r.custom_id, params: r.params })) as any
  });
  console.log(`✓ batch_id: ${batch.id} status: ${batch.processing_status}`);

  // Polling
  let status = batch.processing_status;
  let polled = 0;
  while (status !== "ended") {
    if (polled > 60) {
      console.log(`\n⚠ Timeout — manuell retrieven: ${batch.id}`);
      return;
    }
    await new Promise(r => setTimeout(r, 10_000));
    polled++;
    const upd = await client.messages.batches.retrieve(batch.id);
    status = upd.processing_status;
    process.stdout.write(`  [${polled*10}s] status=${status} processing=${upd.request_counts.processing} succeeded=${upd.request_counts.succeeded} errored=${upd.request_counts.errored}\r`);
  }
  console.log(`\n✓ Batch ended after ${polled*10}s`);

  // Retrieve
  console.log("\n→ Resultate:");
  const results: any[] = [];
  const metaMap = new Map(requests.map(r => [r.custom_id, r._meta]));
  for await (const entry of await client.messages.batches.results(batch.id)) {
    const meta = metaMap.get(entry.custom_id);
    if (entry.result.type === "succeeded") {
      const msg: any = entry.result.message;
      const toolUse = msg.content.find((c: any) => c.type === "tool_use");
      const analysis = toolUse?.input ?? null;
      const usage = msg.usage;
      results.push({
        dbid: meta!.dbid,
        klasse: meta!.klasse,
        chars_after_cap: meta!.chars_after_cap,
        usage: {
          input: usage.input_tokens,
          cache_read: usage.cache_read_input_tokens ?? 0,
          cache_create: usage.cache_creation_input_tokens ?? 0,
          output: usage.output_tokens,
        },
        analysis,
      });
    } else {
      console.log(`  ✗ ${meta?.dbid}: ${JSON.stringify(entry.result).slice(0, 200)}`);
      results.push({ dbid: meta!.dbid, error: entry.result });
    }
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
  console.log(`✓ Report: ${REPORT_PATH}`);

  // Quick-Bilanz
  const ok = results.filter(r => r.analysis);
  const totalInput = ok.reduce((a, r) => a + r.usage.input + r.usage.cache_read + r.usage.cache_create, 0);
  const totalOutput = ok.reduce((a, r) => a + r.usage.output, 0);
  const realCost = (
    ok.reduce((a, r) => a + r.usage.input * 0.5 / 1e6 + r.usage.cache_read * 0.025 / 1e6 + r.usage.cache_create * 0.625 / 1e6, 0)
    + totalOutput * 2.5 / 1e6
  );

  console.log(`\n=== Quick-Bilanz ===`);
  console.log(`Erfolgreich: ${ok.length}/${results.length}`);
  console.log(`Σ Input-Tokens: ${(totalInput/1000).toFixed(1)}k`);
  console.log(`Σ Output-Tokens: ${(totalOutput/1000).toFixed(1)}k`);
  console.log(`Real Cost (Batch): $${realCost.toFixed(4)}`);
  console.log(`\nProjektion auf 18.511 DS: $${(realCost / ok.length * 18511).toFixed(0)}`);

  // Quality-Validation: Array-vs-String + Topic-Tag-Glossar
  const GLOSSAR = new Set(BERLIN_TOPIC_TAGS);
  let arrayBugs = 0;
  let glossarHits = 0;
  let glossarMisses = 0;
  const missedTags: string[] = [];
  for (const r of ok) {
    for (const key of ["kerninhalt", "kerninhalt_frage", "kerninhalt_antwort"]) {
      const v = (r.analysis as any)?.[key];
      if (v !== undefined && !Array.isArray(v)) arrayBugs++;
    }
    for (const t of (r.analysis?.thema ?? []) as string[]) {
      if (GLOSSAR.has(t as any)) glossarHits++;
      else { glossarMisses++; missedTags.push(t); }
    }
  }
  console.log(`\n=== Quality-Validation ===`);
  console.log(`Array-Schema-Bugs (sollte 0 sein):  ${arrayBugs}`);
  console.log(`Topic-Tag-Glossar-Hit: ${glossarHits}/${glossarHits+glossarMisses} = ${(glossarHits/(glossarHits+glossarMisses)*100).toFixed(0)}%`);
  if (missedTags.length) console.log(`  Erfundene Tags: ${[...new Set(missedTags)].join(", ")}`);

  // Sample-Outputs zeigen
  console.log("\n=== Sample-Outputs ===");
  for (const r of ok.slice(0, 3)) {
    console.log(`\n--- ${r.dbid} (${r.klasse}) ---`);
    console.log(JSON.stringify(r.analysis, null, 2).slice(0, 1500));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
