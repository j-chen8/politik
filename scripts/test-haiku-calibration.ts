/**
 * Mini-Kalibrierung: Haiku 4.5 generiert Reden-Zusammenfassungen für 10
 * sorgfältig gewählte Reality-Check-Fälle. Output ist Markdown zum direkten
 * Vergleich Llama-70B-alt vs. Haiku-4.5-neu.
 *
 * Run: npx tsx scripts/test-haiku-calibration.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// .env laden (analog test-cv-haiku.ts)
const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const OUT_PATH = path.join(process.cwd(), "haiku-calibration-report.md");
const MODEL = "claude-haiku-4-5";

// Selektion: 9 Reality-Check-Fälle + 1 schwere Sammel-Fragestunde
const TEST_REDE_IDS = [
  "ID211101400", // Hardt — Multi-Punkt (Iran/Gaza/Hamas)
  "ID211404200", // Krings — Mietpreisbremse Regierung
  "ID211607400", // Bochmann — Wasserstraßen technisch
  "ID212708300", // Akbulut — BMZ-Kürzungen Opposition
  "ID214008100", // Kreiser — AfD-Sponsor-Anekdote (SPD polemisch)
  "ID214008600", // Kleinschmidt — Operation Irini (AfD polemisch, größter Tonalitäts-Test)
  "ID214405000", // Bloch — 55-Mrd-Paket (Über-Interpretations-Risiko)
  "ID215303600", // Heuberger — Bürokratieabbau (Baseline gut)
  "ID21700700",  // Gereon Bollmann — Ganztagsschule (vorher mis-attributiert)
];

// Original-Prompt-Logik der alten Pipeline (für faire Vergleichbarkeit)
function buildPrompt(speakerName: string, sitzung: number, datum: string, text: string): string {
  return `Analysiere den folgenden Redebeitrag von ${speakerName} im Deutschen Bundestag.

Gib EXAKT dieses JSON zurück:
{
  "zusammenfassung": "<2-3 Sätze: Was sagt oder fordert ${speakerName} konkret? Welche Position vertritt er/sie?>",
  "kontext": "<Thema in 3-8 Wörtern, z.B. 'Unterstützung der Ukraine' oder 'Rückführungsabkommen'>",
  "typ": "<debatte|fragestunde_frage|fragestunde_antwort|regierungserklaerung|zwischenfrage|kurzintervention|erklaerung>"
}

REGELN:
- Zusammenfassung beschreibt NUR was ${speakerName} SELBST sagt, meint oder fordert
- NIEMALS Meta-Beschreibungen ("Das Dokument enthält...", "Der Text listet auf...")
- Kontext ist NUR das Thema, kein ganzer Satz
- Für Laien verständlich
- Tonalität bewahren: wenn polemisch/emotional, nicht in neutrale Sprache übersetzen

Sitzung ${sitzung} | Datum: ${datum}

---REDE---

${text}`;
}

interface TestRow {
  rede_id: string;
  speaker: string;
  sitzung: number;
  datum: string | null;
  original_text: string;
  party: string;
  old_summary: string | null;
  old_kontext: string | null;
  old_typ: string | null;
}

async function main() {
  console.log(`=== Haiku-4.5-Kalibrierung (${TEST_REDE_IDS.length} Reden) ===\n`);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt in env");

  const client = new Anthropic({ apiKey });
  const db = new Database(DB_PATH);

  const rows: TestRow[] = [];
  for (const id of TEST_REDE_IDS) {
    const row = db
      .prepare(
        `SELECT ps.rede_id, ps.speaker, ses.sitzung, ses.datum, ps.original_text, ps.party,
                ss.zusammenfassung AS old_summary, ss.kontext AS old_kontext, ss.typ AS old_typ
         FROM plenar_speeches ps
         JOIN plenar_sessions ses ON ses.id = ps.session_id
         LEFT JOIN speech_summaries ss ON ss.rede_id = ps.rede_id
         WHERE ps.rede_id = ?
         ORDER BY ps.segment_index LIMIT 1`,
      )
      .get(id) as TestRow | undefined;
    if (!row) {
      console.log(`  ⚠ rede_id ${id} nicht gefunden`);
      continue;
    }
    rows.push(row);
  }
  console.log(`Lade ${rows.length} Reden aus DB.\n`);

  let totalIn = 0;
  let totalOut = 0;
  const results: { row: TestRow; haiku: any; raw: string; usage: any }[] = [];

  for (const r of rows) {
    process.stdout.write(`  ${r.rede_id} (${r.speaker})… `);
    const prompt = buildPrompt(
      r.speaker,
      r.sitzung,
      r.datum || "unbekannt",
      r.original_text,
    );
    try {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });
      const textBlock = resp.content.find((b) => b.type === "text");
      let raw = textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fenced) raw = fenced[1];
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { _parse_error: true, raw };
      }
      results.push({ row: r, haiku: parsed, raw, usage: resp.usage });
      totalIn += resp.usage.input_tokens;
      totalOut += resp.usage.output_tokens;
      console.log(
        `OK (${resp.usage.input_tokens}in/${resp.usage.output_tokens}out)`,
      );
    } catch (e: any) {
      console.log(`FEHLER: ${e.message}`);
      results.push({ row: r, haiku: { _error: e.message }, raw: "", usage: null });
    }
  }

  // Markdown-Report
  const lines: string[] = [];
  lines.push(`# Haiku-4.5 vs. Llama-70B Kalibrierung\n`);
  lines.push(`**Modell:** \`${MODEL}\`\n`);
  lines.push(`**Reden:** ${results.length}\n`);
  lines.push(`**Tokens:** ${totalIn} in / ${totalOut} out\n`);
  // Haiku 4.5 Pricing: $1/MTok in, $5/MTok out
  const cost = totalIn * 1 / 1_000_000 + totalOut * 5 / 1_000_000;
  lines.push(`**Kosten ca.:** $${cost.toFixed(4)}\n`);
  lines.push(`---\n`);

  for (const { row, haiku } of results) {
    lines.push(`## ${row.rede_id} — ${row.speaker}${row.party ? ` (${row.party})` : ""}\n`);
    lines.push(
      `**Sitzung ${row.sitzung} (${row.datum})** | original_text: ${row.original_text.length} Zeichen\n`,
    );
    lines.push(`### Original (Auszug)`);
    lines.push("> " + row.original_text.slice(0, 800).replace(/\n/g, "\n> "));
    if (row.original_text.length > 800) lines.push(`> _… (${row.original_text.length - 800} weitere Zeichen)_`);
    lines.push("");
    lines.push(`### Llama-70B (alt)`);
    lines.push(`- **Kontext:** ${row.old_kontext ?? "_(keine alte Summary)_"}`);
    lines.push(`- **Typ:** ${row.old_typ ?? ""}`);
    lines.push(`- **Summary:** ${row.old_summary ?? "_(keine alte Summary)_"}`);
    lines.push("");
    lines.push(`### Haiku-4.5 (neu)`);
    if (haiku._error) {
      lines.push(`**FEHLER:** ${haiku._error}`);
    } else if (haiku._parse_error) {
      lines.push(`**Parse-Fehler. Roh-Output:**`);
      lines.push("```\n" + haiku.raw + "\n```");
    } else {
      lines.push(`- **Kontext:** ${haiku.kontext ?? ""}`);
      lines.push(`- **Typ:** ${haiku.typ ?? ""}`);
      lines.push(`- **Summary:** ${haiku.zusammenfassung ?? ""}`);
    }
    lines.push("\n---\n");
  }

  fs.writeFileSync(OUT_PATH, lines.join("\n"));
  console.log(`\nReport: ${OUT_PATH}`);
  console.log(`Kosten: ~$${cost.toFixed(4)}`);

  db.close();
}

main().catch((e) => {
  console.error("Fehler:", e);
  process.exit(1);
});
