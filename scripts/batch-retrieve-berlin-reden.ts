/**
 * Berlin-Reden Batch-Retrieve mit Polling + INSERT + Quality-Gates.
 *
 * Run:  npx tsx scripts/batch-retrieve-berlin-reden.ts --batch=N
 *       Polling alle 30 Sek, dann Retrieve + INSERT OR REPLACE + Quality-Report
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const STATE_DIR = path.join(process.cwd(), ".batch-state-berlin");

const TONALITAET_ENUM = new Set([
  "sachlich", "polemisch", "polemisch_sachlich", "emotional_persoenlich",
  "konfrontativ_belegend", "ironisch_jugendlich", "bilanzierend_werbend",
  "staatsmaennisch", "defensiv_pragmatisch", "sozial_anklagend", "mahnend",
]);

// Glossar inkl. Umlaut-Normalisierung — der LLM nutzt oft ae/oe/ue statt ä/ö/ü
function normFrame(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}
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
].map(normFrame));

function normalize(text: string): string {
  return text.replace(/-\n([a-zäöüß])/g, "$1").replace(/\s+/g, " ").trim();
}

function decodeCustomId(c: string): string {
  // Custom-ID war speech_id mit `[^a-zA-Z0-9_-]/g, "_"`-Replacement.
  // Berlin-speech_id-Format: "19-007-r042" — Bindestriche bleiben, keine Sonderzeichen.
  return c;
}

async function main() {
  const args = process.argv.slice(2);
  const batchArg = args.find((a) => a.startsWith("--batch="));
  if (!batchArg) {
    console.error("Usage: --batch=1|2|3|4");
    process.exit(1);
  }
  const batchStage = parseInt(batchArg.split("=")[1], 10);

  const stateFile = path.join(STATE_DIR, `batch-${batchStage}.json`);
  if (!fs.existsSync(stateFile)) {
    console.error(`State-Datei fehlt: ${stateFile}`);
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  console.log(`=== Batch ${batchStage} Retrieve (${state.batch_id}) ===\n`);
  console.log(`Submitted: ${state.submitted_at}`);
  console.log(`Expected: ${state.n_requests} Reden`);
  console.log(`Methodology-SHA: ${state.methodology_sha}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");

  const client = new Anthropic({ apiKey });

  // Polling
  let batch = await client.messages.batches.retrieve(state.batch_id);
  let polled = 0;
  const POLL_INTERVAL = 30; // Sekunden
  const MAX_POLLS = 240; // 240*30s = 2h Maximum

  while (batch.processing_status !== "ended") {
    if (polled >= MAX_POLLS) {
      console.log(`\n⚠ Timeout nach ${polled * POLL_INTERVAL}s. Skript stoppen + später erneut starten.`);
      return;
    }
    const c = batch.request_counts;
    process.stdout.write(`  [${polled * POLL_INTERVAL}s] status=${batch.processing_status} | processing=${c.processing} succeeded=${c.succeeded} errored=${c.errored}\r`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL * 1000));
    polled++;
    batch = await client.messages.batches.retrieve(state.batch_id);
  }
  console.log(`\n✓ Batch beendet nach ${polled * POLL_INTERVAL}s`);
  console.log(`  Final: succeeded=${batch.request_counts.succeeded} errored=${batch.request_counts.errored} canceled=${batch.request_counts.canceled} expired=${batch.request_counts.expired}`);

  // Retrieve + INSERT
  console.log(`\n→ Lese Resultate + INSERT in berlin_speech_analyses...`);
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO berlin_speech_analyses (
      speech_id, reden_typ, tonalitaet,
      forderungen_json, woertliche_zitate_json, framing_marker_json,
      rhetorische_mittel_json, konkrete_zahlen_json, anti_hallucination_flags_json,
      zusammenfassung_2_saetze, neutralitaets_self_check_json,
      quote_valid_count, quote_total_count,
      raw_tool_input_json, model, methodology_sha, batch_id, batch_stage,
      input_tokens, cache_read_input_tokens, cache_creation_input_tokens, output_tokens,
      stop_reason, error_type, error_message
    ) VALUES (
      @speech_id, @reden_typ, @tonalitaet,
      @forderungen_json, @woertliche_zitate_json, @framing_marker_json,
      @rhetorische_mittel_json, @konkrete_zahlen_json, @anti_hallucination_flags_json,
      @zusammenfassung_2_saetze, @neutralitaets_self_check_json,
      @quote_valid_count, @quote_total_count,
      @raw_tool_input_json, @model, @methodology_sha, @batch_id, @batch_stage,
      @input_tokens, @cache_read_input_tokens, @cache_creation_input_tokens, @output_tokens,
      @stop_reason, @error_type, @error_message
    )
  `);

  const textCache = new Map<string, string>();
  for (const id of state.speech_ids) {
    const row = db.prepare(`SELECT text FROM berlin_speeches WHERE speech_id = ?`).get(id) as { text: string } | undefined;
    if (row) textCache.set(id, normalize(row.text));
  }

  let nInserted = 0;
  let nErrored = 0;
  let tonalDrift = 0;
  let totalQuotes = 0;
  let validQuotes = 0;
  let glossarMatches = 0;
  let nonGlossarFrames = 0;
  const typCount = new Map<string, number>();

  for await (const entry of await client.messages.batches.results(state.batch_id)) {
    const speechId = decodeCustomId(entry.custom_id);

    if (entry.result.type !== "succeeded") {
      nErrored++;
      insertStmt.run({
        speech_id: speechId, reden_typ: null, tonalitaet: null,
        forderungen_json: null, woertliche_zitate_json: null, framing_marker_json: null,
        rhetorische_mittel_json: null, konkrete_zahlen_json: null, anti_hallucination_flags_json: null,
        zusammenfassung_2_saetze: null, neutralitaets_self_check_json: null,
        quote_valid_count: 0, quote_total_count: 0,
        raw_tool_input_json: null, model: state.model, methodology_sha: state.methodology_sha,
        batch_id: state.batch_id, batch_stage: batchStage,
        input_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 0,
        stop_reason: null, error_type: entry.result.type, error_message: JSON.stringify(entry.result),
      });
      continue;
    }

    const msg: any = entry.result.message;
    const toolUse = msg.content.find((c: any) => c.type === "tool_use");
    const analysis = toolUse?.input;
    if (!analysis) {
      nErrored++;
      continue;
    }

    // Quote-Validation (normalisiert)
    const normText = textCache.get(speechId);
    let perValid = 0;
    if (normText && analysis.woertliche_zitate) {
      for (const q of analysis.woertliche_zitate as string[]) {
        if (normText.includes(normalize(q))) perValid++;
      }
    }
    const totalPerSpeech = analysis.woertliche_zitate?.length ?? 0;
    totalQuotes += totalPerSpeech;
    validQuotes += perValid;

    // Tonality-Drift
    if (analysis.tonalitaet && !TONALITAET_ENUM.has(analysis.tonalitaet)) tonalDrift++;

    // Frame-Glossar-Match (mit Umlaut-Normalisierung)
    for (const f of (analysis.framing_marker ?? []) as string[]) {
      if (GLOSSAR_FRAMES.has(normFrame(f))) glossarMatches++;
      else nonGlossarFrames++;
    }

    // Reden-Typ-Verteilung
    typCount.set(analysis.reden_typ, (typCount.get(analysis.reden_typ) ?? 0) + 1);

    insertStmt.run({
      speech_id: speechId,
      reden_typ: analysis.reden_typ ?? null,
      tonalitaet: analysis.tonalitaet ?? null,
      forderungen_json: JSON.stringify(analysis.forderungen ?? []),
      woertliche_zitate_json: JSON.stringify(analysis.woertliche_zitate ?? []),
      framing_marker_json: JSON.stringify(analysis.framing_marker ?? []),
      rhetorische_mittel_json: JSON.stringify(analysis.rhetorische_mittel ?? []),
      konkrete_zahlen_json: JSON.stringify(analysis.konkrete_zahlen ?? []),
      anti_hallucination_flags_json: JSON.stringify(analysis.anti_hallucination_flags ?? []),
      zusammenfassung_2_saetze: analysis.zusammenfassung_2_saetze ?? null,
      neutralitaets_self_check_json: analysis.neutralitaets_self_check
        ? JSON.stringify(analysis.neutralitaets_self_check) : null,
      quote_valid_count: perValid,
      quote_total_count: totalPerSpeech,
      raw_tool_input_json: JSON.stringify(analysis),
      model: state.model,
      methodology_sha: state.methodology_sha,
      batch_id: state.batch_id,
      batch_stage: batchStage,
      input_tokens: msg.usage.input_tokens,
      cache_read_input_tokens: msg.usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens: msg.usage.cache_creation_input_tokens ?? 0,
      output_tokens: msg.usage.output_tokens,
      stop_reason: msg.stop_reason,
      error_type: null,
      error_message: null,
    });
    nInserted++;
  }

  db.close();

  console.log(`  ✓ ${nInserted} eingefügt, ${nErrored} Fehler`);

  // Quality-Gates
  console.log(`\n=== Quality-Gates (Batch ${batchStage}) ===`);
  const successRate = (nInserted / (nInserted + nErrored)) * 100;
  const tonalDriftPct = (tonalDrift / Math.max(1, nInserted)) * 100;
  const quoteValidPct = totalQuotes > 0 ? (validQuotes / totalQuotes) * 100 : 0;
  const glossarPct = (glossarMatches + nonGlossarFrames) > 0
    ? (glossarMatches / (glossarMatches + nonGlossarFrames)) * 100 : 0;

  console.log(`  Success-Rate:       ${successRate.toFixed(1)}%      ${successRate >= 99 ? "✓" : "⚠ < 99%"}`);
  console.log(`  Tonality-Drift:     ${tonalDriftPct.toFixed(2)}%     ${tonalDriftPct <= 1 ? "✓" : "✗ > 1%"}`);
  console.log(`  Quote-Validation:   ${quoteValidPct.toFixed(1)}% (${validQuotes}/${totalQuotes})  ${quoteValidPct >= 85 ? "✓" : "✗ < 85%"}`);
  console.log(`  Frame-Glossar:      ${glossarPct.toFixed(0)}% (${glossarMatches}/${glossarMatches + nonGlossarFrames})  ${glossarPct >= 70 ? "✓" : "⚠ < 70%"}`);
  console.log(`\n  Reden-Typ-Verteilung:`);
  for (const [t, c] of [...typCount.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t.padEnd(10)} ${c.toString().padStart(5)} (${((c / nInserted) * 100).toFixed(0)}%)`);
  }

  const allGatesOk = successRate >= 99 && tonalDriftPct <= 1 && quoteValidPct >= 85 && glossarPct >= 70;
  console.log(`\n${allGatesOk ? "✅ Alle Quality-Gates erfüllt" : "⚠ Quality-Gate-Warnung — vor nächstem Batch prüfen"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
