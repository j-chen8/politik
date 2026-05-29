/**
 * Smart-Haiku-Cascade Smoke-Test
 *
 * Lädt docs/summarization-methodology.md als gecachten System-Prompt und lässt
 * Haiku 4.5 20 stratifizierte Reden zusammenfassen — 9 Reality-Check-IDs
 * (Bloch/Kleinschmidt/Hardt/etc.) + 11 zusätzliche stratifiziert über
 * Parteien (2× CDU/SPD/AfD/Grüne/Linke + 1 Minister).
 *
 * Validiert post-hoc per Substring-Check, dass jedes wörtliche_zitate-Element
 * tatsächlich im original_text vorkommt.
 *
 * Output: smoketest-haiku-report.md (Original + Llama-alt + Haiku-Cal-alt + Smart-Haiku-neu).
 *
 * Run: npx tsx scripts/smoketest-smart-haiku.ts
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
const MODEL = "claude-haiku-4-5";

// 9 Reality-Check-Reden + 11 stratifizierte Picks (CDU/SPD/AfD/Grüne/Linke + 1 Minister)
const MAIN_IDS = [
  // Reality-Check-Set
  "ID211101400", // Hardt (CDU/CSU) — Multi-Punkt Nahost
  "ID211404200", // Krings (CDU/CSU) — Mietpreisbremse
  "ID211607400", // Bochmann (AfD) — Wasserstraßen technisch
  "ID212708300", // Akbulut (Linke) — BMZ-Kürzungen
  "ID214008100", // Kreiser (SPD) — AfD-Sponsor-Anekdote
  "ID214008600", // Kleinschmidt (AfD) — Operation Irini, polemisch
  "ID214405000", // Bloch (AfD) — 55-Mrd-Paket Halluzinations-Test
  "ID215303600", // Heuberger (Grüne) — Bürokratieabbau
  "ID21700700",  // Gereon Bollmann (AfD) — Ganztagsschule
  // Zusatz-Stratifizierung
  "ID211103700", // Düber (CDU/CSU)
  "ID211411100", // Whittaker (CDU/CSU)
  "ID211315500", // Schraps (SPD)
  "ID211604500", // Stüwe (SPD)
  "ID211314500", // Sichert (AfD)
  "ID211601900", // Groß (AfD)
  "ID211000500", // Steinmüller (Grüne)
  "ID211001700", // Detzer (Grüne)
  "ID211504100", // Achelwilm (Linke)
  "ID212015400", // Glaser (Linke)
  "ID211003100", // Klingbeil (BMin Finanzen)
];

// Extension-Set: 10 neue Reden, gewichtet auf „sachliche" Reden-Klassen,
// um Stabilität der invented Tonalitäten (sachlich_pragmatisch etc.) zu testen
// + 2 Fragestunden für H5-Trigger-Test
const EXTENSION_IDS = [
  "ID211000200", // Hubig (BMin Justiz) — Regierungserklärung
  "ID211007400", // Wildberger (BMin Digitales)
  "ID211011100", // Lange (Parl. Staatssekretär Verkehr)
  "ID211000900#1", // Vandre (Linke) — Zwischenfrage Typ J
  "ID211001000#3", // Luczak (CDU/CSU) — Zwischenfragen-Antwort Typ J
  "ID21914600",  // Zerr (Linke) — technisch
  "ID21914000",  // Polat (Grüne) — technisch
  "ID21913200",  // Piechotta (Grüne) — technisch
  "ID21915200",  // Goßner (AfD) — sachlich AfD
  "ID21914800",  // Bohnhof (AfD)
];

// Problem-Set: 3 JSON-Failures (Main-Run) + 7 invented Tonalitäten (Main+Extension).
// Diese gegen den Tool-Use-Fix testen — Erwartung: alle 10 sauber, alle Tonalitäten aus Enum.
const PROBLEM_IDS = [
  "ID211001700",   // Detzer (Grüne) — JSON-Failure
  "ID212015400",   // Glaser (Linke) — JSON-Failure
  "ID211003100",   // Klingbeil (BMin) — JSON-Failure
  "ID211404200",   // Krings → sachlich_pragmatisch
  "ID211103700",   // Düber → sachlich_pragmatisch
  "ID211607400",   // Bochmann → sachlich_kritisch
  "ID215303600",   // Heuberger → sachlich_konstruktiv
  "ID211000200",   // Hubig → sachlich_bilanzierend
  "ID211000900#1", // Vandre → sachlich_nachfragend
  "ID211001000#3", // Luczak → konfrontativ_pragmatisch
];

const MODE = process.env.SMOKETEST_MODE;
const TEST_REDE_IDS =
  MODE === "extension" ? EXTENSION_IDS : MODE === "problem" ? PROBLEM_IDS : MAIN_IDS;
const OUT_PATH = path.join(
  process.cwd(),
  MODE === "extension"
    ? "smoketest-extension-report.md"
    : MODE === "problem"
      ? "smoketest-problem-report.md"
      : "smoketest-haiku-report.md",
);

// Tool-Use mit ASCII-Keys (API-Regex `^[a-zA-Z0-9_.-]+$` erlaubt keine Umlaute).
// Mapping zurück auf deutsche Keys passiert nach dem Parsen — so bleibt
// Methodology-Doc + Report konsistent in deutscher Notation, aber API-Schema-Validation
// (insb. Tonalitäts-Enum) wird hart durchgesetzt.
const TONALITAET_ENUM = [
  "sachlich",
  "polemisch",
  "polemisch_sachlich",
  "emotional_persoenlich",
  "konfrontativ_faktenrhetorisch",
  "ironisch_jugendlich",
  "bilanzierend_werbend",
  "staatsmaennisch",
  "defensiv_pragmatisch",
  "sozial_anklagend",
  "mahnend",
] as const;

const REDEN_SUMMARY_TOOL = {
  name: "submit_speech_summary",
  description:
    "Strukturierte Zusammenfassung einer Plenarrede gemäß summarization-methodology.md. Property-Keys sind hier ASCII (tonalitaet, woertliche_zitate) — werden post-hoc auf die in der Methodology gelehrten deutschen Keys gemappt.",
  input_schema: {
    type: "object" as const,
    properties: {
      reden_typ: {
        type: "string",
        description: "Einer der Typen A-K aus Methodology Sektion 1, oder Mischung wie 'A+E'",
      },
      tonalitaet: {
        type: "string",
        enum: [...TONALITAET_ENUM],
        description:
          "STRIKT einer aus dieser Liste — KEINE Modifikatoren erfinden (kein 'sachlich_pragmatisch'). Bei Misch-Tonalität: dominante wählen.",
      },
      forderungen: {
        type: "array",
        items: { type: "string" },
        description: "Vollständige Aufzählung aller distinkten Forderungen / Positionen",
      },
      woertliche_zitate: {
        type: "array",
        items: { type: "string" },
        description:
          "1-3 EXAKTE Substrings aus original_text (max ~150 Zeichen). Werden post-hoc per Substring-Match validiert. Lieber paraphrasieren als ein Quasi-Zitat erfinden.",
      },
      framing_marker: {
        type: "array",
        items: { type: "string" },
        description: "Frame-Schlüssel aus Glossar Sektion 2",
      },
      rhetorische_mittel: { type: "array", items: { type: "string" } },
      konkrete_zahlen: { type: "array", items: { type: "string" } },
      anti_hallucination_flags: {
        type: "array",
        items: { type: "string" },
        description: "H1-H8-Markierungen wo Heuristiken griffen, mit Kurzbegründung",
      },
      zusammenfassung_2_saetze: {
        type: "string",
        description:
          "2-3 Sätze die obige Felder synthesisieren — Tonalität, Forderungen, Frames, Pointe",
      },
    },
    required: [
      "reden_typ",
      "tonalitaet",
      "forderungen",
      "woertliche_zitate",
      "framing_marker",
      "zusammenfassung_2_saetze",
    ],
  },
};

function mapAsciiToGerman(ascii: any): HaikuResult {
  if (!ascii || typeof ascii !== "object") return ascii;
  const result: any = { ...ascii };
  if ("tonalitaet" in result) {
    result["tonalität"] = result.tonalitaet;
    delete result.tonalitaet;
  }
  if ("woertliche_zitate" in result) {
    result["wörtliche_zitate"] = result.woertliche_zitate;
    delete result.woertliche_zitate;
  }
  return result as HaikuResult;
}

interface DbRow {
  rede_id: string;
  speaker: string;
  party: string | null;
  role: string | null;
  sitzung: number;
  datum: string | null;
  original_text: string;
  topic_title: string | null;
  old_summary: string | null;
  old_kontext: string | null;
  old_typ: string | null;
}

interface HaikuResult {
  reden_typ?: string;
  tonalität?: string;
  forderungen?: string[];
  wörtliche_zitate?: string[];
  framing_marker?: string[];
  rhetorische_mittel?: string[];
  konkrete_zahlen?: string[];
  anti_hallucination_flags?: string[];
  zusammenfassung_2_saetze?: string;
  _error?: string;
}

interface ResultRow {
  row: DbRow;
  haiku: HaikuResult;
  quote_validation: { valid: number; invalid: number; invalid_quotes: string[] };
  usage: { input_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number; output_tokens: number } | null;
  ms: number;
}

/**
 * Extrahiert das erste balancierte JSON-Objekt aus einem String.
 * Berücksichtigt Strings (mit Escape) und überspringt sie für Brace-Zählung.
 */
function extractFirstJsonObject(raw: string): string {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return raw.slice(start, i + 1);
      }
    }
  }
  return raw; // unbalanced — let JSON.parse give a real error
}

function validateQuotes(quotes: string[] | undefined, originalText: string): { valid: number; invalid: number; invalid_quotes: string[] } {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  const haystack = norm(originalText);
  let valid = 0;
  let invalid = 0;
  const invalid_quotes: string[] = [];
  for (const q of quotes || []) {
    if (haystack.includes(norm(q))) {
      valid++;
    } else {
      invalid++;
      invalid_quotes.push(q);
    }
  }
  return { valid, invalid, invalid_quotes };
}

async function main() {
  console.log(`=== Smart-Haiku Smoke-Test (${TEST_REDE_IDS.length} Reden) ===\n`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");
  if (!fs.existsSync(METHOD_PATH)) throw new Error(`Methodology missing: ${METHOD_PATH}`);

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

  const client = new Anthropic({ apiKey });
  const db = new Database(DB_PATH);

  // Reden laden — Format "ID...#N" erlaubt expliziten segment_index
  const rows: DbRow[] = [];
  for (const spec of TEST_REDE_IDS) {
    const [id, segStr] = spec.split("#");
    const seg = segStr !== undefined ? parseInt(segStr, 10) : 0;
    const row = db
      .prepare(
        `SELECT ps.rede_id, ps.speaker, ps.party, ps.role, ses.sitzung, ses.datum,
                ps.original_text, ps.topic_title,
                ss.zusammenfassung AS old_summary, ss.kontext AS old_kontext, ss.typ AS old_typ
         FROM plenar_speeches ps
         JOIN plenar_sessions ses ON ses.id = ps.session_id
         LEFT JOIN speech_summaries ss ON ss.rede_id = ps.rede_id
         WHERE ps.rede_id = ? AND ps.segment_index = ?
         LIMIT 1`,
      )
      .get(id, seg) as DbRow | undefined;
    if (!row) {
      console.log(`  ⚠ rede_id ${id}#${seg} nicht gefunden`);
      continue;
    }
    rows.push(row);
  }
  console.log(`Lade ${rows.length}/${TEST_REDE_IDS.length} Reden aus DB.\n`);

  let totalIn = 0;
  let totalCacheCreate = 0;
  let totalCacheRead = 0;
  let totalOut = 0;
  const results: ResultRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const userMsg = `Sitzung ${r.sitzung} (${r.datum || "unbekannt"}) | Sprecher: ${r.speaker}${r.party ? ` (${r.party})` : ""}${r.role ? ` [${r.role}]` : ""}
Topic: ${r.topic_title || "—"}

---REDETEXT---

${r.original_text}`;

    process.stdout.write(`  [${i + 1}/${rows.length}] ${r.rede_id} ${r.speaker.slice(0, 32).padEnd(32)} … `);
    const t0 = Date.now();

    try {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        tools: [REDEN_SUMMARY_TOOL],
        tool_choice: { type: "tool", name: REDEN_SUMMARY_TOOL.name },
        messages: [{ role: "user", content: userMsg }],
      });
      const ms = Date.now() - t0;
      const toolBlock = resp.content.find((b: any) => b.type === "tool_use");
      let parsed: HaikuResult;
      if (toolBlock && toolBlock.type === "tool_use") {
        parsed = mapAsciiToGerman(toolBlock.input);
      } else {
        parsed = { _error: "no tool_use block returned" };
      }
      const validation = validateQuotes(parsed.wörtliche_zitate, r.original_text);
      const u: any = resp.usage;
      totalIn += u.input_tokens;
      totalOut += u.output_tokens;
      totalCacheCreate += u.cache_creation_input_tokens || 0;
      totalCacheRead += u.cache_read_input_tokens || 0;
      results.push({
        row: r,
        haiku: parsed,
        quote_validation: validation,
        usage: u,
        ms,
      });
      console.log(
        `OK  ${ms}ms  in=${u.input_tokens}/cR=${u.cache_read_input_tokens || 0}/cW=${u.cache_creation_input_tokens || 0}  out=${u.output_tokens}  zitate=${validation.valid}✓/${validation.invalid}✗`,
      );
    } catch (e: any) {
      console.log(`FEHLER: ${e.message}`);
      results.push({
        row: r,
        haiku: { _error: e.message },
        quote_validation: { valid: 0, invalid: 0, invalid_quotes: [] },
        usage: null,
        ms: Date.now() - t0,
      });
    }
  }

  // Cost (Haiku 4.5: $1/MTok in, $5/MTok out, cache read 0.1×, cache write 1.25×)
  const cost =
    (totalIn * 1) / 1_000_000 +
    (totalCacheCreate * 1.25) / 1_000_000 +
    (totalCacheRead * 0.1) / 1_000_000 +
    (totalOut * 5) / 1_000_000;

  // Markdown-Report
  const lines: string[] = [];
  lines.push(`# Smart-Haiku Smoke-Test Report\n`);
  lines.push(`**Modell:** \`${MODEL}\``);
  lines.push(`**System-Prompt:** docs/summarization-methodology.md (~${(systemPrompt.length / 4).toFixed(0)} Tokens, gecached)`);
  lines.push(`**Reden:** ${results.length}/${TEST_REDE_IDS.length}`);
  lines.push(`**Tokens:** input=${totalIn}, cache_read=${totalCacheRead}, cache_write=${totalCacheCreate}, output=${totalOut}`);
  lines.push(`**Cost:** ~$${cost.toFixed(4)}`);
  lines.push(`**Validierung:** ${results.filter((r) => !r.haiku._error).length} OK, ${results.filter((r) => r.haiku._error).length} Errors`);
  const totalQ = results.reduce((a, r) => a + r.quote_validation.valid + r.quote_validation.invalid, 0);
  const totalQValid = results.reduce((a, r) => a + r.quote_validation.valid, 0);
  lines.push(`**Quote-Validierung:** ${totalQValid}/${totalQ} Zitate korrekt (${((totalQValid / Math.max(totalQ, 1)) * 100).toFixed(1)}%)\n`);

  // Übersichtstabelle
  lines.push(`## Übersicht\n`);
  lines.push(`| # | rede_id | Speaker | Partei | Typ | Tonalität | Zitate | H-Flags |`);
  lines.push(`|---|---------|---------|--------|-----|-----------|--------|---------|`);
  results.forEach((r, i) => {
    const h = r.haiku;
    const flags = (h.anti_hallucination_flags || []).map((f) => f.split(":")[0].split(" ")[0]).join(",") || "—";
    const zit = `${r.quote_validation.valid}/${r.quote_validation.valid + r.quote_validation.invalid}`;
    lines.push(
      `| ${i + 1} | ${r.row.rede_id} | ${r.row.speaker.slice(0, 24)} | ${(r.row.party || "—").slice(0, 8)} | ${h.reden_typ || "?"} | ${h.tonalität || "?"} | ${zit} | ${flags} |`,
    );
  });
  lines.push(``);

  // Detail-Sektion
  lines.push(`---\n## Detail-Ausgabe pro Rede\n`);
  for (const r of results) {
    const row = r.row;
    const h = r.haiku;
    lines.push(`### ${row.rede_id} — ${row.speaker}${row.party ? ` (${row.party})` : ""}${row.role ? ` [${row.role}]` : ""}\n`);
    lines.push(`**Sitzung ${row.sitzung} (${row.datum})** | Topic: ${row.topic_title || "—"} | Original: ${row.original_text.length} Zeichen | Latenz: ${r.ms}ms\n`);

    lines.push(`#### Original (Auszug)`);
    lines.push("> " + row.original_text.slice(0, 600).replace(/\n/g, "\n> "));
    if (row.original_text.length > 600) {
      lines.push(`> _… (${row.original_text.length - 600} weitere Zeichen)_`);
    }
    lines.push("");

    lines.push(`#### Llama-70B (alt) Summary`);
    lines.push(`- **Kontext:** ${row.old_kontext ?? "_(keine)_"}`);
    lines.push(`- **Typ:** ${row.old_typ ?? "_(keiner)_"}`);
    lines.push(`- **Summary:** ${row.old_summary ?? "_(keine)_"}`);
    lines.push("");

    lines.push(`#### Smart-Haiku-Cascade (neu)`);
    if (h._error) {
      lines.push(`**FEHLER:** ${h._error}`);
    } else {
      lines.push(`- **Reden-Typ:** ${h.reden_typ || "—"}`);
      lines.push(`- **Tonalität:** ${h.tonalität || "—"}`);
      if (h.forderungen?.length) {
        lines.push(`- **Forderungen (${h.forderungen.length}):**`);
        h.forderungen.forEach((f) => lines.push(`  - ${f}`));
      }
      if (h.wörtliche_zitate?.length) {
        lines.push(`- **Wörtliche Zitate (${r.quote_validation.valid}/${h.wörtliche_zitate.length} valid):**`);
        h.wörtliche_zitate.forEach((q) => {
          const ok = !r.quote_validation.invalid_quotes.includes(q);
          lines.push(`  - ${ok ? "✅" : "❌"} „${q}"`);
        });
      }
      if (h.framing_marker?.length) {
        lines.push(`- **Framing-Marker:** ${h.framing_marker.join(", ")}`);
      }
      if (h.rhetorische_mittel?.length) {
        lines.push(`- **Rhetorische Mittel:** ${h.rhetorische_mittel.join(", ")}`);
      }
      if (h.konkrete_zahlen?.length) {
        lines.push(`- **Konkrete Zahlen:** ${h.konkrete_zahlen.join(" | ")}`);
      }
      if (h.anti_hallucination_flags?.length) {
        lines.push(`- **Anti-Halluzinations-Flags:**`);
        h.anti_hallucination_flags.forEach((f) => lines.push(`  - ${f}`));
      }
      lines.push(`- **Zusammenfassung:** ${h.zusammenfassung_2_saetze || "—"}`);
    }
    lines.push("\n---\n");
  }

  fs.writeFileSync(OUT_PATH, lines.join("\n"));
  console.log(`\nReport: ${OUT_PATH}`);
  console.log(`Cost: ~$${cost.toFixed(4)} | OK ${results.filter((r) => !r.haiku._error).length}/${results.length} | Zitate ${totalQValid}/${totalQ} (${((totalQValid / Math.max(totalQ, 1)) * 100).toFixed(1)}%)`);

  db.close();
}

main().catch((e) => {
  console.error("Fehler:", e);
  process.exit(1);
});
