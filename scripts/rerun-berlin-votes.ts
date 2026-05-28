/**
 * Re-Run der Berlin-Vote-Extraktion (live API) für eine oder alle Sitzungen.
 * Nutzt den gefixten Regex aus berlin-votes-prompts.ts (\s+ statt literal Space)
 * sowie die erweiterten DS-Zuordnungs-Regeln (Antrag + Beschlussempfehlung beide
 * in drucksache_nrn).
 *
 * Run:
 *   npx tsx scripts/rerun-berlin-votes.ts --sitzung 85
 *   npx tsx scripts/rerun-berlin-votes.ts --all
 *   npx tsx scripts/rerun-berlin-votes.ts --all --skip-existing
 *
 * Erwartung: bei --all ~700-800 API-Calls, geschätzt $2-3 live (oder via Batch ~$1).
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPT_VERSION, MODEL, VOTE_TOOL, buildSystemPrompt,
  extractVoteEvents, extractSitzungNr, extractSitzungDatum,
} from "../src/lib/berlin-votes-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const argv = process.argv.slice(2);
const SITZ_IDX = argv.indexOf("--sitzung");
const SITZUNG_ARG = SITZ_IDX >= 0 ? parseInt(argv[SITZ_IDX + 1], 10) : null;
const ALL = argv.includes("--all");
const SKIP_EXISTING = argv.includes("--skip-existing");
if (!SITZUNG_ARG && !ALL) {
  console.error("Usage: --sitzung <nr> oder --all (optional --skip-existing)");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const resolveDokNrStmt = db.prepare(`SELECT dbid FROM berlin_documents WHERE dok_nr = ?`);
function resolveDsDbids(nrs: string[]): string[] {
  const out: string[] = [];
  for (const nr of nrs) {
    const row = resolveDokNrStmt.get(nr) as { dbid: string } | undefined;
    if (row) out.push(row.dbid);
    else {
      // 0-padding: 19/924 → 19/0924
      const m = nr.match(/^(\d+)\/(\d+)$/);
      if (m) {
        const padded = `${m[1]}/${m[2].padStart(4, "0")}`;
        const row2 = resolveDokNrStmt.get(padded) as { dbid: string } | undefined;
        if (row2) out.push(row2.dbid);
      }
    }
  }
  return out;
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO berlin_votes (
    plpr_lok_url, snippet_offset, sitzung_nr, datum,
    drucksache_nrn_json, drucksache_dbids_json,
    vote_type, vote_subtype, outcome, modus, fraktion_votes_json, stimmen_zahlen_json,
    raw_snippet, raw_tool_input_json, model, prompt_version, batch_id,
    input_tokens, cache_read_input_tokens, cache_creation_input_tokens, output_tokens,
    stop_reason, error_type, error_message
  ) VALUES (
    @plpr_lok_url, @snippet_offset, @sitzung_nr, @datum,
    @drucksache_nrn_json, @drucksache_dbids_json,
    @vote_type, @vote_subtype, @outcome, @modus, @fraktion_votes_json, @stimmen_zahlen_json,
    @raw_snippet, @raw_tool_input_json, @model, @prompt_version, @batch_id,
    @input_tokens, @cache_read_input_tokens, @cache_creation_input_tokens, @output_tokens,
    @stop_reason, @error_type, @error_message
  )
`);

const sysPrompt = buildSystemPrompt();
const asJson = (v: unknown) => (v == null ? null : JSON.stringify(v));

async function processSitzung(sitzungNr: number): Promise<{ inserted: number; errored: number; inT: number; outT: number; cacheR: number }> {
  const pdf = db.prepare(
    `SELECT lok_url, pdf_filename, full_text FROM berlin_pdf_texts WHERE pdf_filename LIKE ?`,
  ).get(`%p19-${sitzungNr.toString().padStart(3, "0")}-wp%`) as { lok_url: string; pdf_filename: string; full_text: string } | undefined;
  if (!pdf || !pdf.full_text) {
    console.log(`Sitzung ${sitzungNr}: kein PDF in DB — skip`);
    return { inserted: 0, errored: 0, inT: 0, outT: 0, cacheR: 0 };
  }

  if (SKIP_EXISTING) {
    const existing = db.prepare(
      `SELECT COUNT(*) AS c FROM berlin_votes WHERE plpr_lok_url = ? AND prompt_version = ?`,
    ).get(pdf.lok_url, PROMPT_VERSION) as { c: number };
    if (existing.c > 0) {
      console.log(`Sitzung ${sitzungNr}: ${existing.c} Votes mit prompt v=${PROMPT_VERSION} bereits da — skip`);
      return { inserted: 0, errored: 0, inT: 0, outT: 0, cacheR: 0 };
    }
  }

  // Alte Vote-Rows für diese Sitzung löschen (saubere Re-Run)
  db.prepare(`DELETE FROM berlin_votes WHERE plpr_lok_url = ?`).run(pdf.lok_url);

  const sitzungFromName = extractSitzungNr(pdf.pdf_filename) ?? sitzungNr;
  const datum = extractSitzungDatum(pdf.full_text);
  const events = extractVoteEvents(pdf.full_text);
  console.log(`Sitzung ${sitzungFromName} (${datum ?? "?"}): ${events.length} Events`);

  let inserted = 0, errored = 0, totalIn = 0, totalOut = 0, totalCacheR = 0;
  for (const e of events) {
    const userMsg = `KONTEXT-HINWEIS: Im Snippet vorgefundene Drucksachen-Referenzen: ${JSON.stringify(e.drucksache_nrn_prefiltered)}. Datum der Sitzung: ${datum ?? "unbekannt"}.\n\nSNIPPET:\n${e.snippet}`;
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: [{ type: "text", text: sysPrompt, cache_control: { type: "ephemeral" } }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [VOTE_TOOL] as any,
        tool_choice: { type: "tool", name: VOTE_TOOL.name },
        messages: [{ role: "user", content: userMsg }],
      });
      const toolUse = msg.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") throw new Error("no tool_use");
      const analysis = toolUse.input as Record<string, unknown>;
      const drucksache_nrn = Array.isArray(analysis.drucksache_nrn) ? (analysis.drucksache_nrn as unknown[]).filter((x): x is string => typeof x === "string") : [];
      const dbids = resolveDsDbids(drucksache_nrn);
      const outcome = typeof analysis.outcome === "string" ? analysis.outcome : "kein_vote";
      const modus = typeof analysis.modus === "string" ? analysis.modus : null;
      const voteType = typeof analysis.vote_type === "string" ? analysis.vote_type : "unklar";
      const subtype = /Wahlvorschlag|Wahl der|Wahl von/.test(e.snippet) ? "personenwahl" : "gesetz";
      totalIn += msg.usage.input_tokens;
      totalOut += msg.usage.output_tokens;
      totalCacheR += msg.usage.cache_read_input_tokens ?? 0;
      insert.run({
        plpr_lok_url: pdf.lok_url, snippet_offset: e.offset,
        sitzung_nr: sitzungFromName, datum,
        drucksache_nrn_json: drucksache_nrn.length ? JSON.stringify(drucksache_nrn) : null,
        drucksache_dbids_json: dbids.length ? JSON.stringify(dbids) : null,
        vote_type: voteType, vote_subtype: subtype, outcome, modus,
        fraktion_votes_json: asJson(analysis.fraktion_votes),
        stimmen_zahlen_json: asJson(analysis.stimmen_zahlen),
        raw_snippet: e.snippet, raw_tool_input_json: JSON.stringify(analysis),
        model: MODEL, prompt_version: PROMPT_VERSION, batch_id: null,
        input_tokens: msg.usage.input_tokens,
        cache_read_input_tokens: msg.usage.cache_read_input_tokens ?? 0,
        cache_creation_input_tokens: msg.usage.cache_creation_input_tokens ?? 0,
        output_tokens: msg.usage.output_tokens,
        stop_reason: msg.stop_reason, error_type: null, error_message: null,
      });
      inserted++;
    } catch (err) {
      errored++;
      console.log(`  ✗ offset=${e.offset}: ${(err as Error).message}`);
    }
  }
  console.log(`  ✓ ${inserted}/${events.length} inserted (${errored} errored)`);
  return { inserted, errored, inT: totalIn, outT: totalOut, cacheR: totalCacheR };
}

async function main() {
  let grandIn = 0, grandOut = 0, grandCache = 0, grandIns = 0, grandErr = 0;
  if (SITZUNG_ARG) {
    const r = await processSitzung(SITZUNG_ARG);
    grandIn += r.inT; grandOut += r.outT; grandCache += r.cacheR; grandIns += r.inserted; grandErr += r.errored;
  } else if (ALL) {
    const sitzungen = db.prepare(
      `SELECT DISTINCT bs.sitzung_nr AS nr FROM berlin_speeches bs
       JOIN berlin_pdf_texts t ON t.pdf_filename LIKE '%p19-' || printf('%03d', bs.sitzung_nr) || '%'
       WHERE bs.sitzung_nr IS NOT NULL AND t.full_text IS NOT NULL AND t.full_text != ''
       ORDER BY bs.sitzung_nr`,
    ).all() as { nr: number }[];
    console.log(`\n${sitzungen.length} Sitzungen zu verarbeiten\n`);
    for (const s of sitzungen) {
      const r = await processSitzung(s.nr);
      grandIn += r.inT; grandOut += r.outT; grandCache += r.cacheR; grandIns += r.inserted; grandErr += r.errored;
    }
  }
  // Haiku 4.5 live: $1/M input, $5/M output, $0.10/M cache_read
  const cost = (grandIn - grandCache) * 1e-6 * 1.0 + grandCache * 1e-6 * 0.10 + grandOut * 1e-6 * 5.0;
  console.log(`\n=== Gesamt ===`);
  console.log(`${grandIns} inserted · ${grandErr} errored`);
  console.log(`Tokens: ${grandIn}↓ (cache_read: ${grandCache}) ${grandOut}↑`);
  console.log(`Kosten: ~$${cost.toFixed(4)} (live)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
