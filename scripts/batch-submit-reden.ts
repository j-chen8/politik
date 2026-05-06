/**
 * Submit-Skript für Reden-Vollauf via Anthropic Batch API.
 *
 * Lädt alle 9.913 Reden mit original_text >= 200 Zeichen, baut für jede einen
 * Batch-Request mit identischem System-Prompt (gecached) + Tool-Use-Schema wie
 * im Smoke-Test, schickt als ein Batch los, speichert batch_id in
 * .batch-state.json für späteren Retrieve.
 *
 * Run: npx tsx scripts/batch-submit-reden.ts [--confirm]
 *
 * Ohne --confirm zeigt nur Pre-Flight-Stats. Mit --confirm submitted tatsächlich.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// .env laden
const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const METHOD_PATH = path.join(process.cwd(), "docs/summarization-methodology.md");
const STATE_PATH = path.join(process.cwd(), ".batch-state.json");
const MIN_CHAR_LEN = 200;
const MAX_TOKENS = 2048;
const MODEL = "claude-haiku-4-5";

// Identisch zum Smoke-Test: Tool-Use mit ASCII-Keys, harter Tonalitäts-Enum
const TONALITAET_ENUM = [
  "sachlich", "polemisch", "polemisch_sachlich", "emotional_persoenlich",
  "konfrontativ_belegend", "ironisch_jugendlich", "bilanzierend_werbend",
  "staatsmaennisch", "defensiv_pragmatisch", "sozial_anklagend", "mahnend",
];

const REDEN_SUMMARY_TOOL = {
  name: "submit_speech_summary",
  description:
    "Strukturierte Zusammenfassung einer Plenarrede gemäß summarization-methodology.md. Property-Keys sind hier ASCII (tonalitaet, woertliche_zitate) — werden post-hoc auf die in der Methodology gelehrten deutschen Keys gemappt.",
  input_schema: {
    type: "object" as const,
    properties: {
      reden_typ: { type: "string", description: "Typ A-K aus Methodology Sektion 1, oder Mischung" },
      tonalitaet: {
        type: "string",
        enum: TONALITAET_ENUM,
        description: "STRIKT einer aus dieser Liste — KEINE Modifikatoren erfinden.",
      },
      forderungen: { type: "array", items: { type: "string" } },
      woertliche_zitate: {
        type: "array",
        items: { type: "string" },
        description: "1-3 EXAKTE Substrings aus original_text (max ~150 Zeichen).",
      },
      framing_marker: { type: "array", items: { type: "string" } },
      rhetorische_mittel: { type: "array", items: { type: "string" } },
      konkrete_zahlen: { type: "array", items: { type: "string" } },
      anti_hallucination_flags: { type: "array", items: { type: "string" } },
      zusammenfassung_2_saetze: { type: "string" },
    },
    required: [
      "reden_typ", "tonalitaet", "forderungen", "woertliche_zitate",
      "framing_marker", "zusammenfassung_2_saetze",
    ],
  },
};

interface Speech {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string | null;
  role: string | null;
  sitzung: number;
  datum: string | null;
  topic_title: string | null;
  original_text: string;
}

function buildUserMsg(s: Speech): string {
  return `Sitzung ${s.sitzung} (${s.datum || "unbekannt"}) | Sprecher: ${s.speaker}${s.party ? ` (${s.party})` : ""}${s.role ? ` [${s.role}]` : ""}
Topic: ${s.topic_title || "—"}

---REDETEXT---

${s.original_text}`;
}

function customId(s: Speech): string {
  // custom_id muss [a-zA-Z0-9_-]{1,64} sein (Anthropic-Constraint)
  return `${s.rede_id}_${s.segment_index}`;
}

async function main() {
  const args = process.argv.slice(2);
  const doSubmit = args.includes("--confirm");

  console.log("=== Reden-Batch-Submit ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");
  if (!fs.existsSync(METHOD_PATH)) throw new Error(`Methodology missing: ${METHOD_PATH}`);

  if (fs.existsSync(STATE_PATH)) {
    const existing = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    console.log(`⚠ Bestehende batch_id gefunden: ${existing.batch_id} (submitted ${existing.submitted_at})`);
    console.log(`  Wenn du erneut submittest, wird dieser Eintrag überschrieben.`);
    if (doSubmit) {
      console.log(`  Lösche zuerst .batch-state.json wenn das beabsichtigt ist.`);
      throw new Error("State exists — aborting to prevent overwrite");
    }
  }

  const methodology = fs.readFileSync(METHOD_PATH, "utf-8");
  const systemPrompt = `${methodology}

---

JETZT ANALYSIERE die folgende Plenarrede gemäß der obigen Methodologie und rufe das \`submit_speech_summary\`-Tool auf.

WICHTIG zur API-Schema-Konvention:
- Property-Keys sind ASCII (\`tonalitaet\` statt \`tonalität\`, \`woertliche_zitate\` statt \`wörtliche_zitate\`) — nur die KEYS, nicht die Werte
- \`tonalitaet\` MUSS einer aus dem Enum sein. KEINE Modifikatoren erfinden (kein 'sachlich_pragmatisch', 'sachlich_kritisch' etc.). Bei Misch-Tonalität: dominante wählen.

Beachte außerdem:
- **Heuristiken H1-H8 strikt anwenden** (Sektion 3) — wenn eine greift, in \`anti_hallucination_flags\` benennen
- **Wörtliche Zitate müssen EXAKTE Substrings aus dem original_text sein** — werden post-hoc per Substring-Match validiert
- **Tonalität bewahren** — NIE Polemik in neutrale Sprache übersetzen
- **Forderungen vollständig enumerieren BEVOR synthese**`;

  const db = new Database(DB_PATH, { readonly: true });
  const speeches = db
    .prepare(
      `SELECT ps.rede_id, ps.segment_index, ps.speaker, ps.party, ps.role,
              ses.sitzung, ses.datum, ps.topic_title, ps.original_text
       FROM plenar_speeches ps
       JOIN plenar_sessions ses ON ses.id = ps.session_id
       WHERE ps.original_text IS NOT NULL AND LENGTH(ps.original_text) >= ?
       ORDER BY ps.rede_id, ps.segment_index`,
    )
    .all(MIN_CHAR_LEN) as Speech[];
  db.close();

  console.log(`Eligible Reden: ${speeches.length}`);
  const totalChars = speeches.reduce((a, s) => a + s.original_text.length, 0);
  console.log(`Total Zeichen: ${totalChars.toLocaleString()} (~${(totalChars / 4 / 1000).toFixed(0)}k Tokens user-input)`);
  console.log(`System-Prompt: ~${(systemPrompt.length / 4 / 1000).toFixed(1)}k Tokens (gecached pro Request)\n`);

  // Cost-Estimate (Haiku 4.5 Batch: 50% off all rates)
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  const userTokensTotal = Math.ceil(totalChars / 4);
  const outputTokensExpected = speeches.length * 1400; // empirisch aus Smoke-Test
  const cacheReadCost = (sysTokens * (speeches.length - 1) * 0.1) / 1_000_000;
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const userInputCost = (userTokensTotal * 1) / 1_000_000;
  const outputCost = (outputTokensExpected * 5) / 1_000_000;
  const totalLive = cacheReadCost + cacheWriteCost + userInputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  console.log(`Cost-Estimate (Haiku 4.5):`);
  console.log(`  Live-API:  $${totalLive.toFixed(2)}`);
  console.log(`  Batch-API: $${totalBatch.toFixed(2)} (50% off)\n`);

  // Build requests
  console.log(`Baue ${speeches.length} Batch-Requests...`);
  const requests = speeches.map((s) => ({
    custom_id: customId(s),
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      tools: [REDEN_SUMMARY_TOOL] as any,
      tool_choice: { type: "tool" as const, name: REDEN_SUMMARY_TOOL.name } as any,
      messages: [{ role: "user" as const, content: buildUserMsg(s) }],
    },
  }));
  const payloadSize = JSON.stringify(requests).length;
  console.log(`  Payload-Größe: ${(payloadSize / 1_000_000).toFixed(1)} MB (Limit: 256 MB)\n`);

  // Split bei >200 MB Payload (Anthropic-Limit 256 MB, Sicherheitsmarge)
  const MAX_BATCH_BYTES = 200 * 1024 * 1024;
  const chunks: typeof requests[] = [];
  let current: typeof requests = [];
  let currentBytes = 0;
  for (const r of requests) {
    const sz = JSON.stringify(r).length;
    if (currentBytes + sz > MAX_BATCH_BYTES && current.length > 0) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(r);
    currentBytes += sz;
  }
  if (current.length > 0) chunks.push(current);
  console.log(`Splitting in ${chunks.length} Sub-Batches: ${chunks.map((c) => c.length).join(", ")} Requests`);
  console.log(`  Größen: ${chunks.map((c) => (JSON.stringify(c).length / 1_000_000).toFixed(0) + " MB").join(", ")}\n`);

  if (!doSubmit) {
    console.log(`Pre-Flight only. Add --confirm um tatsächlich zu submitten.`);
    return;
  }

  console.log(`SUBMITTING ${chunks.length} Batches zu Anthropic Batch API...`);
  const client = new Anthropic({ apiKey });
  const submitted: any[] = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  [${i + 1}/${chunks.length}] ${chunks[i].length} Requests… `);
    const t0 = Date.now();
    const batch = await client.messages.batches.create({ requests: chunks[i] as any });
    const dt = Date.now() - t0;
    console.log(`✓ ${dt}ms · batch_id: ${batch.id} · status: ${batch.processing_status}`);
    submitted.push({
      batch_id: batch.id,
      status: batch.processing_status,
      n_requests: chunks[i].length,
      submitted_at: new Date().toISOString(),
    });
  }

  const state = {
    submitted_at: new Date().toISOString(),
    n_requests_total: requests.length,
    n_batches: chunks.length,
    estimated_cost_batch_usd: totalBatch,
    model: MODEL,
    tool_name: REDEN_SUMMARY_TOOL.name,
    methodology_path: METHOD_PATH,
    methodology_sha: require("crypto")
      .createHash("sha256")
      .update(fs.readFileSync(METHOD_PATH))
      .digest("hex")
      .slice(0, 16),
    batches: submitted,
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log(`\nbatch-state geschrieben → ${STATE_PATH}`);
  console.log(`\nNächster Schritt: morgen \`npx tsx scripts/batch-retrieve-reden.ts\` aufrufen`);
}

main().catch((e) => {
  console.error("FEHLER:", e);
  process.exit(1);
});
