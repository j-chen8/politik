/**
 * Submit-Skript für Bias-Korrektur-Re-Batch (Option E + Self-Check).
 *
 * Lädt die 400 als NEIN klassifizierten Reden aus bias-audit-tier-a-only.jsonl,
 * holt deren Original-Texte aus plenar_speeches, und submitted sie mit der
 * v2.1-Methodology + erweitertem Tool-Schema (neutralitaets_self_check).
 *
 * State: .batch-state-corrections.json
 *
 * Run:
 *   npx tsx scripts/batch-resubmit-bias-corrections.ts            (Pre-Flight)
 *   npx tsx scripts/batch-resubmit-bias-corrections.ts --confirm  (echter Submit)
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import * as crypto from "crypto";

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
const STATE_PATH = path.join(process.cwd(), ".batch-state-corrections.json");
const NEIN_LIST_PATH = path.join(process.cwd(), "bias-audit-tier-a-only.jsonl");
const MIN_CHAR_LEN = 200;
const MAX_TOKENS = 2048;
const MODEL = "claude-haiku-4-5";

const TONALITAET_ENUM = [
  "sachlich", "polemisch", "polemisch_sachlich", "emotional_persoenlich",
  "konfrontativ_faktenrhetorisch", "ironisch_jugendlich", "bilanzierend_werbend",
  "staatsmaennisch", "defensiv_pragmatisch", "sozial_anklagend", "mahnend",
];

// Erweitertes Schema mit neutralitaets_self_check
const REDEN_SUMMARY_TOOL = {
  name: "submit_speech_summary",
  description:
    "Strukturierte Zusammenfassung einer Plenarrede gemäß summarization-methodology.md v2.1. Property-Keys ASCII (tonalitaet, woertliche_zitate). Pflichtfeld neutralitaets_self_check für H10-Selbstreflexion.",
  input_schema: {
    type: "object" as const,
    properties: {
      reden_typ: { type: "string" },
      tonalitaet: { type: "string", enum: TONALITAET_ENUM },
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
      neutralitaets_self_check: {
        type: "object",
        description:
          "H10-Pflichtfeld: Selbst-Prüfung der Zusammenfassung auf wertende Wörter, die der Sprecher nicht selbst nutzt.",
        properties: {
          konfidenz: {
            type: "string",
            enum: ["hoch", "mittel", "niedrig"],
            description:
              "hoch=Summary nutzt nur Wörter, die der Sprecher selbst trifft. mittel=ein wertendes Wort eingebaut, neutral nicht ohne Stilbruch ersetzbar. niedrig=mehrere wertende Wörter eingebaut.",
          },
          wertende_woerter_eigene: {
            type: "array",
            items: { type: "string" },
            description:
              "Wörter aus der Tier-A-Liste (skandalisiert, polemisiert, diffamiert, denunziert, verdammt, fabuliert, Heuchelei, Doppelmoral, Stimmungsmache, Abgesang), die in der Summary stehen aber NICHT vom Sprecher genutzt werden. Leer wenn keine.",
          },
          begruendung_falls_unsicher: {
            type: "string",
            description: "Max. 1 Satz, nur bei mittel/niedrig — leer bei hoch.",
          },
        },
        required: ["konfidenz", "wertende_woerter_eigene", "begruendung_falls_unsicher"],
      },
    },
    required: [
      "reden_typ", "tonalitaet", "forderungen", "woertliche_zitate",
      "framing_marker", "zusammenfassung_2_saetze", "neutralitaets_self_check",
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
  return `${s.rede_id}_${s.segment_index}`;
}

interface NeinEntry {
  rede_id: string;
  segment_index: number;
  classification: string;
  matched_word: string;
}

function loadNeinReden(): Set<string> {
  if (!fs.existsSync(NEIN_LIST_PATH)) {
    throw new Error(`bias-audit-tier-a-only.jsonl nicht gefunden`);
  }
  const ids = new Set<string>();
  for (const line of fs.readFileSync(NEIN_LIST_PATH, "utf-8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line) as NeinEntry;
    if (r.classification === "NEIN") {
      ids.add(`${r.rede_id}_${r.segment_index}`);
    }
  }
  return ids;
}

async function main() {
  const args = process.argv.slice(2);
  const doSubmit = args.includes("--confirm");

  console.log("=== Bias-Korrektur-Re-Batch (v2.1 Methodology + Self-Check) ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");
  if (!fs.existsSync(METHOD_PATH)) throw new Error("Methodology missing");

  if (fs.existsSync(STATE_PATH)) {
    const existing = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
    console.log(`⚠ Bestehende State-Datei: ${STATE_PATH}`);
    console.log(`  Submitted at: ${existing.submitted_at}`);
    console.log(`  Lösche zuerst, falls neuer Submit gewollt.`);
    if (doSubmit) throw new Error("State exists — abort");
  }

  // NEIN-Reden laden
  const neinIds = loadNeinReden();
  console.log(`NEIN-Reden aus Audit: ${neinIds.size}`);

  // Methodology laden + System-Prompt
  const methodology = fs.readFileSync(METHOD_PATH, "utf-8");
  const methodHash = crypto.createHash("sha256").update(methodology).digest("hex").slice(0, 16);

  const systemPrompt = `${methodology}

---

JETZT ANALYSIERE die folgende Plenarrede gemäß der obigen Methodologie und rufe das \`submit_speech_summary\`-Tool auf.

WICHTIG zur API-Schema-Konvention:
- Property-Keys sind ASCII (\`tonalitaet\` statt \`tonalität\`) — nur die KEYS, nicht die Werte
- \`tonalitaet\` MUSS einer aus dem Enum sein. Bei Misch-Tonalität: dominante wählen.

H10 BESONDERS WICHTIG (das ist der Anlass dieses Re-Batches):
Die v1-Generation hat oft wertende Wörter eingefügt, die der Sprecher nicht selbst nutzt. Bei DIESEN Reden hier wurde das mit hoher Konfidenz festgestellt. Deine Aufgabe:
1. Schreibe eine NEUTRALE Zusammenfassung — vermeide alle wertenden Wörter, außer der Sprecher nutzt sie wörtlich
2. Fülle das \`neutralitaets_self_check\`-Feld ehrlich aus
3. Wenn du dir unsicher bist (z.B. ein Synonym ist nicht ganz neutral): konfidenz = "mittel" und wertendes Wort auflisten
4. Wenn die ganze Rede sehr polemisch ist und nur polemische Wiedergabe akkurat wäre: das ist OK, aber dann mindestens \`konfidenz: "hoch"\` mit leerer wertende_woerter_eigene-Liste begründen, weil die Polemik vom Sprecher kommt

Beachte außerdem:
- **Heuristiken H1-H10 strikt anwenden**
- **Wörtliche Zitate müssen EXAKTE Substrings aus dem original_text sein**
- **Tonalität bewahren** — NIE Polemik in neutrale Sprache übersetzen, wenn der Sprecher polemisch ist
- **Forderungen vollständig enumerieren BEVOR synthese**`;

  // Reden aus DB laden, gefiltert auf NEIN-IDs
  const db = new Database(DB_PATH, { readonly: true });
  const allSpeeches = db
    .prepare(
      `SELECT ps.rede_id, ps.segment_index, ps.speaker, ps.party, ps.role,
              ses.sitzung, ses.datum, ps.topic_title, ps.original_text
       FROM plenar_speeches ps
       JOIN plenar_sessions ses ON ses.id = ps.session_id
       WHERE ps.original_text IS NOT NULL AND LENGTH(ps.original_text) >= ?`,
    )
    .all(MIN_CHAR_LEN) as Speech[];
  db.close();

  const speeches = allSpeeches.filter((s) => neinIds.has(`${s.rede_id}_${s.segment_index}`));
  console.log(`Gematchte Reden in DB: ${speeches.length}`);
  if (speeches.length === 0) {
    throw new Error("Keine Reden — Skript falsch verkettet?");
  }
  if (speeches.length < neinIds.size) {
    console.log(`⚠ ${neinIds.size - speeches.length} NEIN-Reden konnten nicht in DB gefunden werden`);
  }

  const totalChars = speeches.reduce((a, s) => a + s.original_text.length, 0);
  console.log(`Total Zeichen: ${totalChars.toLocaleString()} (~${(totalChars / 4 / 1000).toFixed(0)}k Tokens user-input)`);
  console.log(`System-Prompt: ~${(systemPrompt.length / 4 / 1000).toFixed(1)}k Tokens (gecached)\n`);

  // Cost-Estimate
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  const userTokensTotal = Math.ceil(totalChars / 4);
  const outputTokensExpected = speeches.length * 1500;
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
  console.log(`Payload: ${(payloadSize / 1_000_000).toFixed(2)} MB (Limit: 256 MB) — Single-Batch ok\n`);

  if (!doSubmit) {
    console.log("Pre-Flight done. Run mit --confirm um zu submitten.");
    return;
  }

  // Submit
  console.log("Submitting…");
  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ Batch erstellt: ${batch.id}`);
  console.log(`  Status: ${batch.processing_status}`);
  console.log(`  Requests: ${batch.request_counts.processing} processing`);

  const state = {
    submitted_at: new Date().toISOString(),
    n_requests_total: speeches.length,
    n_batches: 1,
    estimated_cost_batch_usd: totalBatch,
    model: MODEL,
    tool_name: REDEN_SUMMARY_TOOL.name,
    methodology_path: METHOD_PATH,
    methodology_sha: methodHash,
    methodology_version: "v2.1",
    purpose: "bias_correction_re_batch_tier_a",
    batches: [
      {
        batch_id: batch.id,
        status: batch.processing_status,
        n_requests: speeches.length,
        submitted_at: new Date().toISOString(),
      },
    ],
  };
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  console.log(`\nState persistiert: ${STATE_PATH}`);
  console.log(`Retrieve mit: npx tsx scripts/batch-retrieve-corrections.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
