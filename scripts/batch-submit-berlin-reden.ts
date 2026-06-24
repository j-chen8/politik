/**
 * Berlin-Reden Batch-Submit für 4-stufigen Vollauf via Anthropic Batch API.
 *
 * Strategie (Optimal-Stopping mit 1/e ≈ 37 % bei Batch 3):
 *   --batch=1  →   100 Reden  (~$0.50)  echte Skalierung, frühe Edge-Cases
 *   --batch=2  →  1.000 Reden (~$4)     Coverage über Speech-Types/Fraktionen
 *   --batch=3  →  3.700 Reden (~$11)    37 %-Threshold, methodische Robustheit
 *   --batch=4  → 10.414 Reden (~$28)    Production Run, Rest des Korpus
 *
 * Stratifiziert über Speech-Type × Fraktion. Skip bereits in berlin_speech_analyses
 * vorhandene speech_ids (idempotent).
 *
 * Run:
 *   npx tsx scripts/batch-submit-berlin-reden.ts --batch=1            (Pre-Flight)
 *   npx tsx scripts/batch-submit-berlin-reden.ts --batch=1 --confirm  (Submit)
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const METHOD_PATH = path.join(process.cwd(), "docs/summarization-methodology-berlin.md");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin");
const MIN_CHAR_LEN = 200;
const MAX_TOKENS = 2048;
const MODEL = "claude-haiku-4-5";

const BATCH_SIZES: Record<number, number> = {
  1: 100,
  2: 1000,
  3: 3700,
  4: 10414, // = max sinnvoll, wird durch MIN_CHAR_LEN-Filter und bereits-analysiert-Skip kleiner
  5: 12000, // Delta-Stage: nachträglich geseedete Sitzungen (11/17/46/47/52)
};

const TONALITAET_ENUM = [
  "sachlich", "polemisch", "polemisch_sachlich", "emotional_persoenlich",
  "konfrontativ_belegend", "ironisch_jugendlich", "bilanzierend_werbend",
  "staatsmaennisch", "defensiv_pragmatisch", "sozial_anklagend", "mahnend",
];

const REDEN_SUMMARY_TOOL = {
  name: "submit_speech_summary",
  description:
    "Strukturierte Zusammenfassung einer Berlin-Plenarrede gemäß summarization-methodology-berlin.md.",
  input_schema: {
    type: "object" as const,
    properties: {
      reden_typ: { type: "string", description: "A=Polemisch, B=Sachlich-Opposition, C=Zeitzeugen, D=Konfrontativ-belegend, E=Bilanz, F=Sachlich-technisch, G=Sozial-anklagend, H=Regierungserklärung, I=Fragestunde-Antwort, J=Zwischenfrage, K=Außenpolitik, L=Fragestunde-Frage (Berlin-spezifisch). Mischung zulässig (z.B. 'B+G')." },
      tonalitaet: {
        type: "string",
        enum: TONALITAET_ENUM,
        description: "STRIKT einer aus dieser Liste — KEINE Modifikatoren erfinden.",
      },
      forderungen: {
        type: "array",
        items: { type: "string" },
        description: "Vollständige Aufzählung. Bei Typ L (Fragestunde-Frage) darf leer sein.",
      },
      woertliche_zitate: {
        type: "array",
        items: { type: "string" },
        description: "1-3 EXAKTE Substrings aus dem Redetext (max ~150 Zeichen).",
      },
      framing_marker: {
        type: "array",
        items: { type: "string" },
        description: "Bevorzugt Frame-Keys aus dem Berlin-Frame-Glossar (Sektion 2 der Methodology).",
      },
      rhetorische_mittel: { type: "array", items: { type: "string" } },
      konkrete_zahlen: { type: "array", items: { type: "string" } },
      anti_hallucination_flags: { type: "array", items: { type: "string" } },
      zusammenfassung_2_saetze: { type: "string" },
      neutralitaets_self_check: {
        type: "object",
        properties: {
          konfidenz: { type: "string", enum: ["hoch", "mittel", "niedrig"] },
          wertende_woerter_eigene: { type: "array", items: { type: "string" } },
          begruendung_falls_unsicher: { type: "string" },
        },
        required: ["konfidenz", "wertende_woerter_eigene", "begruendung_falls_unsicher"],
      },
    },
    required: [
      "reden_typ", "tonalitaet", "forderungen", "woertliche_zitate",
      "framing_marker", "rhetorische_mittel", "konkrete_zahlen",
      "anti_hallucination_flags", "zusammenfassung_2_saetze", "neutralitaets_self_check",
    ],
  },
};

interface Speech {
  speech_id: string;
  wp: number;
  sitzung_nr: number;
  datum: string | null;
  speaker_raw: string;
  speaker_party: string | null;
  speaker_role: string | null;
  speaker_ressort: string | null;
  speech_type: string | null;
  top_titel: string | null;
  text: string;
}

function buildUserMsg(s: Speech): string {
  const rolle = s.speaker_role ?? "MdL";
  const ressort = s.speaker_ressort ? ` (${s.speaker_ressort})` : "";
  const partei = s.speaker_party ? ` [${s.speaker_party}]` : "";
  return `Sitzung ${s.wp}/${s.sitzung_nr} (${s.datum ?? "Datum unbekannt"})
Sprecher: ${s.speaker_raw}
Rolle: ${rolle}${ressort}${partei}
Speech-Type (aus DB): ${s.speech_type ?? "—"}
TOP: ${s.top_titel ?? "—"}

---REDETEXT---

${s.text}`;
}

function customId(speechId: string): string {
  // Anthropic-Constraint: [a-zA-Z0-9_-]{1,64}
  return speechId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS berlin_speech_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      speech_id TEXT NOT NULL UNIQUE REFERENCES berlin_speeches(speech_id),
      reden_typ TEXT,
      tonalitaet TEXT,
      forderungen_json TEXT,
      woertliche_zitate_json TEXT,
      framing_marker_json TEXT,
      rhetorische_mittel_json TEXT,
      konkrete_zahlen_json TEXT,
      anti_hallucination_flags_json TEXT,
      zusammenfassung_2_saetze TEXT,
      neutralitaets_self_check_json TEXT,
      quote_valid_count INTEGER,
      quote_total_count INTEGER,
      raw_tool_input_json TEXT,
      model TEXT,
      methodology_sha TEXT,
      batch_id TEXT,
      batch_stage INTEGER,
      input_tokens INTEGER,
      cache_read_input_tokens INTEGER,
      cache_creation_input_tokens INTEGER,
      output_tokens INTEGER,
      stop_reason TEXT,
      error_type TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_bspeechanal_speech ON berlin_speech_analyses(speech_id);
    CREATE INDEX IF NOT EXISTS idx_bspeechanal_typ ON berlin_speech_analyses(reden_typ);
    CREATE INDEX IF NOT EXISTS idx_bspeechanal_tonal ON berlin_speech_analyses(tonalitaet);
    CREATE INDEX IF NOT EXISTS idx_bspeechanal_batch ON berlin_speech_analyses(batch_id);
  `);
}

function selectSpeechesStratified(db: Database.Database, batchStage: number, rest = false): Speech[] {
  // Bereits analysiert? Skip
  const alreadyDone = new Set(
    (db.prepare(`SELECT speech_id FROM berlin_speech_analyses`).all() as { speech_id: string }[])
      .map((r) => r.speech_id)
  );

  // Alle eligible Reden (≥200 Zeichen, nicht Präsidium)
  const allEligible = db
    .prepare(
      `SELECT speech_id, wp, sitzung_nr, datum, speaker_raw, speaker_party, speaker_role, speaker_ressort, speech_type, top_titel, text
         FROM berlin_speeches
        WHERE is_praesidium = 0 AND text_chars >= ?
        ORDER BY speech_id`
    )
    .all(MIN_CHAR_LEN) as Speech[];

  const eligible = allEligible.filter((s) => !alreadyDone.has(s.speech_id));
  console.log(`  ${allEligible.length} Reden gesamt eligible (≥${MIN_CHAR_LEN} Z., kein Präsidium)`);
  console.log(`  ${alreadyDone.size} bereits analysiert, ${eligible.length} verbleibend`);

  // Inkrementeller Refresh: ALLE noch nicht analysierten Reden submitten, unabhängig
  // von den kumulativen Initial-Rollout-Targets (die längst überschritten sind →
  // jeder --batch=N liefert sonst 0). Der reguläre Weg für laufenden Nachschub.
  if (rest) {
    console.log(`  --rest: alle ${eligible.length} noch nicht analysierten Reden (inkrementeller Refresh)`);
    return eligible;
  }

  const targetSize = BATCH_SIZES[batchStage];
  const numToAdd = Math.max(0, targetSize - alreadyDone.size);

  if (numToAdd === 0) {
    console.log(`  Batch-${batchStage}-Ziel (${targetSize}) bereits erreicht. Nichts zu tun.`);
    return [];
  }

  if (numToAdd >= eligible.length) {
    console.log(`  Wähle alle ${eligible.length} verbleibenden Reden (Ziel: +${numToAdd})`);
    return eligible;
  }

  // Stratifiziert: über Speech-Type × Fraktion gleichmäßig auswählen
  const buckets = new Map<string, Speech[]>();
  for (const s of eligible) {
    const key = `${s.speech_type ?? "NULL"}__${s.speaker_party ?? s.speaker_role ?? "OTHER"}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(s);
  }
  // Shuffle innerhalb jedes Buckets (deterministisch via seed = batchStage für Reproduzierbarkeit)
  const rng = mulberry32(42 + batchStage);
  for (const arr of buckets.values()) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Round-Robin Picking
  const picked: Speech[] = [];
  const bucketKeys = [...buckets.keys()];
  while (picked.length < numToAdd) {
    let added = false;
    for (const k of bucketKeys) {
      if (picked.length >= numToAdd) break;
      const arr = buckets.get(k)!;
      if (arr.length > 0) {
        picked.push(arr.pop()!);
        added = true;
      }
    }
    if (!added) break;
  }

  console.log(`  Stratifiziert ausgewählt: ${picked.length} Reden über ${bucketKeys.length} Buckets`);
  return picked;
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
  const rest = args.includes("--rest");
  const batchArg = args.find((a) => a.startsWith("--batch="));
  if (!batchArg && !rest) {
    console.error("Usage: --batch=1|2|3|4 [--confirm]  |  --rest [--confirm]  (alle noch nicht analysierten Reden)");
    process.exit(1);
  }
  const batchStage = batchArg ? parseInt(batchArg.split("=")[1], 10) : 4; // --rest: nur für rng/Naming
  if (!rest && !(batchStage in BATCH_SIZES)) {
    console.error(`Batch-Stage muss 1, 2, 3, oder 4 sein (war: ${batchStage})`);
    process.exit(1);
  }
  const doSubmit = args.includes("--confirm");
  const stageLabel = rest ? "rest" : String(batchStage);

  console.log(`=== Berlin-Reden Batch-Submit (${rest ? "REST = alle verbleibenden" : `Stage ${batchStage}, Ziel kumuliert: ${BATCH_SIZES[batchStage]}`}) ===\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in .env");
  if (!fs.existsSync(METHOD_PATH)) throw new Error(`Methodology missing: ${METHOD_PATH}`);

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const stateFile = path.join(STATE_DIR, `batch-${stageLabel}.json`);
  if (fs.existsSync(stateFile)) {
    const existing = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    console.log(`⚠ Bestehender Batch-Submit für Stage ${batchStage}: ${existing.batch_id} (${existing.submitted_at})`);
    if (doSubmit) {
      console.log(`  Aborting — lösche zuerst ${stateFile} wenn das neu sein soll.`);
      process.exit(1);
    }
  }

  const methodology = fs.readFileSync(METHOD_PATH, "utf-8");
  const methodologySha = crypto.createHash("sha256").update(methodology).digest("hex").slice(0, 16);
  const systemPrompt = `${methodology}

---

JETZT ANALYSIERE die folgende Berliner Plenarrede gemäß der obigen Methodologie und rufe das \`submit_speech_summary\`-Tool auf.

WICHTIG:
- Property-Keys ASCII (\`tonalitaet\`, \`woertliche_zitate\`)
- \`tonalitaet\` MUSS einer aus dem Enum sein
- \`framing_marker\` bevorzugt Keys aus dem Berlin-Frame-Glossar (Sektion 2)
- \`woertliche_zitate\` müssen EXAKTE Substrings sein
- Bei Typ L (Fragestunde-Frage): \`forderungen\` darf leer sein
- Heuristiken H1-H10 anwenden`;

  console.log(`Methodology-SHA: ${methodologySha}`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");
  ensureSchema(db);

  const speeches = selectSpeechesStratified(db, batchStage, rest);
  db.close();

  if (speeches.length === 0) return;

  const totalChars = speeches.reduce((a, s) => a + s.text.length, 0);
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  const userTokensTotal = Math.ceil(totalChars / 4);
  const outputTokensExpected = speeches.length * 1400;
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost = (sysTokens * (speeches.length - 1) * 0.05) / 1_000_000;
  const userInputCost = (userTokensTotal * 1) / 1_000_000;
  const outputCost = (outputTokensExpected * 5) / 1_000_000;
  const totalLive = cacheWriteCost + cacheReadCost + userInputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  console.log(`\nReden zu verarbeiten: ${speeches.length}`);
  console.log(`Σ Zeichen User-Input: ${totalChars.toLocaleString("de-DE")} (~${(userTokensTotal / 1000).toFixed(0)}k Tokens)`);
  console.log(`System-Prompt: ${(sysTokens / 1000).toFixed(1)}k Tokens (gecached)`);
  console.log(`Output-Estimate: ${(outputTokensExpected / 1000).toFixed(0)}k Tokens`);
  console.log(`Cost-Estimate (Haiku 4.5 Live):  $${totalLive.toFixed(2)}`);
  console.log(`Cost-Estimate (Haiku 4.5 Batch): $${totalBatch.toFixed(2)} (50% off)`);

  // Build Batch-Requests
  const requests = speeches.map((s) => ({
    custom_id: customId(s.speech_id),
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
      tools: [REDEN_SUMMARY_TOOL] as any,
      tool_choice: { type: "tool" as const, name: REDEN_SUMMARY_TOOL.name } as any,
      messages: [{ role: "user" as const, content: buildUserMsg(s) }],
    },
  }));

  const payloadSize = JSON.stringify(requests).length;
  console.log(`Payload-Größe: ${(payloadSize / 1_000_000).toFixed(1)} MB (Limit: 256 MB)`);

  if (!doSubmit) {
    console.log(`\nPre-Flight only. Füge --confirm hinzu um Batch zu submitten.`);
    return;
  }

  console.log(`\n→ Submitting Batch...`);
  const client = new Anthropic({ apiKey });
  const t0 = Date.now();
  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ batch_id: ${batch.id} · status: ${batch.processing_status} · ${Date.now() - t0}ms`);

  const state = {
    batch_stage: batchStage,
    batch_id: batch.id,
    n_requests: speeches.length,
    speech_ids: speeches.map((s) => s.speech_id),
    submitted_at: new Date().toISOString(),
    methodology_sha: methodologySha,
    estimated_cost_batch_usd: totalBatch,
    model: MODEL,
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`✓ State gespeichert: ${stateFile}`);
  console.log(`\nNun: npx tsx scripts/batch-retrieve-berlin-reden.ts --batch=${batchStage}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
