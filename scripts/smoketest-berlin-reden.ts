/**
 * Smoke-Test: 10 stratifizierte Berlin-Reden via Haiku 4.5 Batch-API.
 *
 * Zweck: Vor dem Vollauf prüfen, ob die methodology-berlin.md sauber läuft.
 * Checks:
 *   - speech_type-Mix → reden_typ trifft (insb. neuer Typ L)
 *   - Tonalität strikt im 11-Enum
 *   - framing_marker matched Berlin-Glossar (statt LLM-Ad-Hoc)
 *   - Quote-Substring-Validation
 *   - Forderungen vollständig (Typ L darf leer)
 *
 * Run:
 *   npx tsx scripts/smoketest-berlin-reden.ts          (Pre-Flight, kein API-Call)
 *   npx tsx scripts/smoketest-berlin-reden.ts --confirm (Batch + Polling + Retrieve)
 *
 * Cost: ~$0.04 für 10 Reden via Batch (50% off Live-Rate).
 * Polling alle 10 Sek bis Batch beendet ist.
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
const METHOD_PATH = path.join(process.cwd(), "docs/summarization-methodology-berlin.md");
const REPORT_PATH = path.join(process.cwd(), "scripts/smoketest-berlin-reden.report.json");
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 2048;

// 11 Tonalitäts-Werte (identisch Bundes)
const TONALITAET_ENUM = [
  "sachlich", "polemisch", "polemisch_sachlich", "emotional_persoenlich",
  "konfrontativ_belegend", "ironisch_jugendlich", "bilanzierend_werbend",
  "staatsmaennisch", "defensiv_pragmatisch", "sozial_anklagend", "mahnend",
];

// Berlin-Reden-Typen: A-K (Bundes) + L (NEU, Fragestunde-Frage)
const REDEN_TYP_HINT = "A=Polemisch, B=Sachlich-Opposition, C=Zeitzeugen, D=Konfrontativ-belegend, E=Bilanz, F=Sachlich-technisch, G=Sozial-anklagend, H=Regierungserklärung, I=Fragestunde-Antwort, J=Zwischenfrage, K=Außenpolitik, L=Fragestunde-Frage (Berlin-spezifisch). Mischung zulässig (z.B. 'B+G').";

const REDEN_SUMMARY_TOOL = {
  name: "submit_speech_summary",
  description:
    "Strukturierte Zusammenfassung einer Berlin-Plenarrede gemäß summarization-methodology-berlin.md. Property-Keys sind ASCII; post-hoc auf deutsche Keys gemappt.",
  input_schema: {
    type: "object" as const,
    properties: {
      reden_typ: { type: "string", description: REDEN_TYP_HINT },
      tonalitaet: {
        type: "string",
        enum: TONALITAET_ENUM,
        description: "STRIKT einer aus dieser Liste — KEINE Modifikatoren erfinden.",
      },
      forderungen: {
        type: "array",
        items: { type: "string" },
        description: "Vollständige Aufzählung. Bei Typ L (Fragestunde-Frage) darf leer sein — stattdessen Frage-Kern in zusammenfassung_2_saetze.",
      },
      woertliche_zitate: {
        type: "array",
        items: { type: "string" },
        description: "1-3 EXAKTE Substrings aus dem Redetext (max ~150 Zeichen). Werden post-hoc per Substring-Match validiert.",
      },
      framing_marker: {
        type: "array",
        items: { type: "string" },
        description: "Bevorzugt Frame-Keys aus dem Berlin-Frame-Glossar (Sektion 2 der Methodology). Wenn passendes Frame existiert: verwende den Glossar-Key statt eigene Erfindung.",
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

// ── Stratifizierte Stichprobe wählen ──
function selectSample(db: Database.Database): Speech[] {
  // Strategie: 10 Reden quer durch Speech-Types + Fraktionen
  const ids = [
    // Lange Debatten
    { speech_id: "19-040-r137", note: "Kraft/CDU Bilanz Mobilität-Haushalt (Typ E?)" },
    { speech_id: "19-062-r153", note: "Helm/LINKE Frauen-Förderung (Typ G)" },
    { speech_id: "19-008-r195", note: "Machulik/SPD Mindestlohn (Typ B)" },
    // Mittlere Debatten
    { speech_id: "19-074-r182", note: "Dregger/CDU Einbürgerung polemisch (Typ A)" },
    { speech_id: "19-058-r240", note: "Gläser/AfD Gewerbe-Miete Sahara-Sozialismus (Typ A+B)" },
    // Fragestunde-Antwort (Senat)
    { speech_id: "19-007-r172", note: "Kreck/LINKE Senatorin Klimakleber-Verfahren (Typ I)" },
    { speech_id: "19-021-r091", note: "Giffey/SPD RegBM Klimakleber (Typ I)" },
    // Fragestunde-Frage (NEU Typ L)
    { speech_id: "19-002-r083", note: "Reifschneider/FDP Kinder-Impfung Frage (Typ L)" },
    { speech_id: "19-065-r070", note: "Franco/GRÜNE Abschiebehaft Frage (Typ L)" },
    // Mittlere Debatte mit Anekdote
    { speech_id: "19-075-r156", note: "Helm/LINKE Antifa+Rostock-Lichtenhagen (Typ C+D)" },
  ];

  const stmt = db.prepare(`
    SELECT speech_id, wp, sitzung_nr, datum, speaker_raw, speaker_party, speaker_role, speaker_ressort, speech_type, top_titel, text
      FROM berlin_speeches WHERE speech_id = ?`);
  const out: Speech[] = [];
  for (const id of ids) {
    const row = stmt.get(id.speech_id) as Speech | undefined;
    if (!row) {
      console.log(`  ⚠ ${id.speech_id} nicht gefunden`);
      continue;
    }
    out.push(row);
  }
  return out;
}

async function main() {
  const doSubmit = process.argv.includes("--confirm");

  console.log("=== Berlin-Reden-Smoke-Test ===\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in .env");

  const methodology = fs.readFileSync(METHOD_PATH, "utf-8");
  const systemPrompt = `${methodology}

---

JETZT ANALYSIERE die folgende Berliner Plenarrede gemäß der obigen Methodologie und rufe das \`submit_speech_summary\`-Tool auf.

WICHTIG:
- Property-Keys sind ASCII (\`tonalitaet\`, \`woertliche_zitate\`)
- \`tonalitaet\` MUSS einer aus dem Enum sein — KEINE Modifikatoren erfinden
- \`framing_marker\` bevorzugt Keys aus dem Berlin-Frame-Glossar (Sektion 2) — eigene Erfindung nur wenn KEIN Glossar-Frame passt
- \`woertliche_zitate\` müssen EXAKTE Substrings sein
- Bei Typ L (Fragestunde-Frage): \`forderungen\` darf leer sein
- Heuristiken H1-H10 anwenden (siehe Bundes-Methodology Sektion 3)`;

  const db = new Database(DB_PATH, { readonly: true });
  const sample = selectSample(db);
  db.close();

  console.log(`Stichprobe: ${sample.length} Reden`);
  for (const s of sample) {
    console.log(`  ${s.speech_id} | ${s.speech_type ?? "—"} | ${s.speaker_party ?? s.speaker_role} | ${s.text.length}Z`);
  }

  const totalChars = sample.reduce((a, s) => a + s.text.length, 0);
  const sysTokens = Math.ceil(systemPrompt.length / 4);
  const userTokensTotal = Math.ceil(totalChars / 4);
  const outputTokensExpected = sample.length * 1400;
  // Haiku 4.5 Live-Pricing: Input $1/MTok, Output $5/MTok, Cache-Read $0.05/MTok, Cache-Write $1.25/MTok
  // Batch-API: 50% off auf alle Rates
  const cacheWriteCost = (sysTokens * 1.25) / 1_000_000;
  const cacheReadCost = (sysTokens * (sample.length - 1) * 0.05) / 1_000_000;
  const userInputCost = (userTokensTotal * 1) / 1_000_000;
  const outputCost = (outputTokensExpected * 5) / 1_000_000;
  const totalLive = cacheWriteCost + cacheReadCost + userInputCost + outputCost;
  const totalBatch = totalLive * 0.5;

  console.log(`\nSystem-Prompt: ${(sysTokens / 1000).toFixed(1)}k Tokens (gecached pro Request ab 2. Call)`);
  console.log(`User-Input gesamt: ${(userTokensTotal / 1000).toFixed(1)}k Tokens`);
  console.log(`Output-Estimate: ${(outputTokensExpected / 1000).toFixed(1)}k Tokens`);
  console.log(`Cost-Estimate (Haiku 4.5 Live):  $${totalLive.toFixed(3)}`);
  console.log(`Cost-Estimate (Haiku 4.5 Batch): $${totalBatch.toFixed(3)} (50% off)`);

  if (!doSubmit) {
    console.log(`\nPre-Flight only. Füge --confirm hinzu um Batch zu submitten.`);
    return;
  }

  console.log(`\n→ Submit ${sample.length} Reden als Batch an Anthropic...`);
  const client = new Anthropic({ apiKey });

  // Build Batch-Requests
  const requests = sample.map((s) => ({
    custom_id: s.speech_id.replace(/[^a-zA-Z0-9_-]/g, "_"),
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
      tools: [REDEN_SUMMARY_TOOL] as any,
      tool_choice: { type: "tool" as const, name: REDEN_SUMMARY_TOOL.name } as any,
      messages: [{ role: "user" as const, content: buildUserMsg(s) }],
    },
  }));

  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`  ✓ batch_id: ${batch.id}, status: ${batch.processing_status}`);

  // Polling alle 10 Sek
  let status = batch.processing_status;
  let polled = 0;
  while (status !== "ended") {
    await new Promise((r) => setTimeout(r, 10_000));
    polled++;
    const upd = await client.messages.batches.retrieve(batch.id);
    status = upd.processing_status;
    const c = upd.request_counts;
    process.stdout.write(`  [${polled * 10}s] status=${status} | processing=${c.processing} succeeded=${c.succeeded} errored=${c.errored} canceled=${c.canceled} expired=${c.expired}\r`);
    if (polled > 60) { // 10 Min Timeout
      console.log(`\n  ⚠ Timeout nach 10 Min — abbruch (Batch ${batch.id} läuft weiter, kann manuell retrieved werden)`);
      return;
    }
  }
  console.log(`\n  ✓ Batch beendet nach ${polled * 10}s`);

  // Retrieve Results — Anthropic SDK liefert AsyncIterable von JSONL-Zeilen
  console.log(`\n→ Hole Resultate...`);
  const results: any[] = [];
  const speechMap = new Map(sample.map((s) => [s.speech_id.replace(/[^a-zA-Z0-9_-]/g, "_"), s]));

  for await (const entry of await client.messages.batches.results(batch.id)) {
    const s = speechMap.get(entry.custom_id);
    if (!s) {
      console.log(`  ⚠ Unbekannter custom_id: ${entry.custom_id}`);
      continue;
    }
    if (entry.result.type === "succeeded") {
      const msg: any = entry.result.message;
      const toolUse = msg.content.find((c: any) => c.type === "tool_use");
      const analysis = toolUse?.input ?? null;
      const cacheRead = msg.usage?.cache_read_input_tokens ?? 0;
      const cacheCreate = msg.usage?.cache_creation_input_tokens ?? 0;

      let quotesValid = 0;
      if (analysis?.woertliche_zitate) {
        for (const q of analysis.woertliche_zitate) {
          if (s.text.includes(q)) quotesValid++;
        }
      }

      results.push({
        speech_id: s.speech_id,
        speaker_raw: s.speaker_raw,
        speech_type_db: s.speech_type,
        text_chars: s.text.length,
        usage: { input: msg.usage.input_tokens, cache_read: cacheRead, cache_create: cacheCreate, output: msg.usage.output_tokens },
        analysis,
        quote_validation: {
          total: analysis?.woertliche_zitate?.length ?? 0,
          valid: quotesValid,
        },
      });
    } else {
      console.log(`  ✗ ${s.speech_id}: ${JSON.stringify(entry.result)}`);
      results.push({ speech_id: s.speech_id, error: entry.result });
    }
  }
  console.log(`  ✓ ${results.length} Results gelesen`);

  fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
  console.log(`\n✓ Report: ${REPORT_PATH}`);

  // Quick-Bilanz
  console.log(`\n=== Quick-Bilanz ===`);
  const ok = results.filter((r) => r.analysis);
  console.log(`Erfolgreich: ${ok.length}/${results.length}`);

  // Tonality-Drift-Check
  const tonalDrift = ok.filter((r) => !TONALITAET_ENUM.includes(r.analysis.tonalitaet));
  console.log(`Tonality-Drift (außerhalb Enum): ${tonalDrift.length}`);
  if (tonalDrift.length > 0) {
    for (const t of tonalDrift) console.log(`  ${t.speech_id} → "${t.analysis.tonalitaet}"`);
  }

  // Quote-Validation-Rate
  const totalQuotes = ok.reduce((a, r) => a + r.quote_validation.total, 0);
  const validQuotes = ok.reduce((a, r) => a + r.quote_validation.valid, 0);
  console.log(`Quote-Validation: ${validQuotes}/${totalQuotes} = ${totalQuotes ? ((validQuotes / totalQuotes) * 100).toFixed(1) : 0}%`);

  // reden_typ-Verteilung
  const typCount = new Map<string, number>();
  for (const r of ok) {
    typCount.set(r.analysis.reden_typ, (typCount.get(r.analysis.reden_typ) ?? 0) + 1);
  }
  console.log(`Reden-Typ-Verteilung:`);
  for (const [t, c] of [...typCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`);
  }

  // Framing-Marker: wie viele aus Glossar vs. erfunden?
  const GLOSSAR_FRAMES = new Set([
    "landeseigene_wohnungsunternehmen", "bezahlbarer_wohnraum", "schneller_bauen_gesetz", "mieterinnen_und_mieter",
    "berliner_bvg", "s_bahn_u_bahn", "euro_ticket", "deutschlandticket", "kiezblocks", "mobilitätsgesetz",
    "berliner_schulen", "bildung_jugend_familie", "schülerinnen_und_schüler",
    "berliner_polizei", "gegen_antisemitismus", "klimakleber_strafverfahren", "polizei_und_feuerwehr",
    "soziale_infrastruktur", "menschen_mit_behinderung",
    "unsere_demokratie", "unserer_demokratie", "demokratischen_fraktionen", "kampf_gegen_rechts",
    "rot_grün_rot", "rot_rot_grün", "schwarz_rote_koalition", "schwarz_rot", "grüne_und_linke_opposition",
    "regierender_bürgermeister", "regierende_bürgermeisterin", "kai_wegner",
    "friedrichshain_kreuzberg", "marzahn_hellersdorf", "treptow_köpenick",
    "recht_und_ordnung_berlin", "vergesellschaftung_art15", "schlafende_riesin_art15",
    "richtlinien_der_regierungspolitik",
  ]);

  let glossarMatches = 0;
  let nonGlossar = 0;
  for (const r of ok) {
    for (const f of r.analysis.framing_marker ?? []) {
      if (GLOSSAR_FRAMES.has(f)) glossarMatches++;
      else nonGlossar++;
    }
  }
  console.log(`Framing-Marker: ${glossarMatches} aus Glossar, ${nonGlossar} erfunden (Glossar-Rate: ${(glossarMatches + nonGlossar) ? ((glossarMatches / (glossarMatches + nonGlossar)) * 100).toFixed(0) : 0}%)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
