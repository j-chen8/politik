/**
 * Tiebreak v2 — Zweite Runde nur für die unscharfen Konflikte (winner =
 * "keiner" oder "unklar") aus tiebreak.partial.jsonl.
 *
 * Verbesserungen ggü. v1:
 *  - Alle 4 Roh-Text-Quellen werden ins Prompt gepackt (mit Tags), nicht nur 1
 *  - Anthropic Claude Haiku 4.5 als unabhängige 5. Modell-Familie
 *    (Anthropic) ergänzt Llama/Mistral/Nemotron in der Pipeline
 *  - Quelle pro Verdict mit-protokolliert
 *  - Persistierung pro Konflikt (Resume-fähig)
 *
 * Output: tiebreak-v2-report.md + tiebreak-v2.partial.jsonl
 *
 * Run: npx tsx scripts/tiebreak-v2-uncertain.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const PARTIAL_IN = path.join(process.cwd(), "tiebreak.partial.jsonl");
const PARTIAL_OUT = path.join(process.cwd(), "tiebreak-v2.partial.jsonl");
const REPORT_OUT = path.join(process.cwd(), "tiebreak-v2-report.md");

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error("ANTHROPIC_API_KEY in .env fehlt");
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
const MODEL = "claude-haiku-4-5";
// Tier-1: 50 RPM / 50K ITPM. Bei ~5K Input/Call wird ITPM Engpass: 50K/5K = 10 RPM.
// 6500ms Sleep = ~9 RPM, sicher unter Limit.
const SLEEP_MS = 6500;

console.log(`Modell: ${MODEL} (Anthropic), Sleep: ${SLEEP_MS}ms`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Conflict {
  politicianId: number;
  politicianName: string;
  section: string;
  jahr: string;
  llamaText: string;
  mistralText: string;
}

interface V1Verdict {
  winner: "llama" | "mistral" | "beide" | "keiner" | "unklar";
  reason: string;
  evidenceQuote: string | null;
}

interface V1Row {
  key: string;
  conflict: Conflict;
  verdict: V1Verdict;
}

interface V2Verdict {
  winner: "llama" | "mistral" | "beide" | "keiner" | "unklar";
  reason: string;
  evidenceQuote: string | null;
  evidenceSource: "wikipedia" | "bundestag" | "homepage" | "bundesregierung" | "none";
  /** True wenn die 4 Quellen zum gleichen Sachverhalt unterschiedliche Aussagen machen */
  source_conflict: boolean;
  /** Beschreibung des Quellen-Widerspruchs, falls source_conflict=true */
  conflict_description: string | null;
}

interface V2Row {
  key: string;
  conflict: Conflict;
  v1Verdict: V1Verdict;
  v2Verdict: V2Verdict;
}

interface Sources {
  wikipedia: string | null;
  bundestag: string | null;
  homepage: string | null;
  bundesregierung: string | null;
}

async function callTiebreaker(c: Conflict, sources: Sources): Promise<V2Verdict> {
  const sourceBlocks: string[] = [];
  if (sources.wikipedia) sourceBlocks.push(`--- QUELLE 1: WIKIPEDIA-VOLLTEXT ---\n${sources.wikipedia.slice(0, 6000)}`);
  if (sources.bundestag) sourceBlocks.push(`--- QUELLE 2: BUNDESTAG-PROFIL ---\n${sources.bundestag.slice(0, 4000)}`);
  if (sources.homepage) sourceBlocks.push(`--- QUELLE 3: HOMEPAGE ---\n${sources.homepage.slice(0, 4000)}`);
  if (sources.bundesregierung) sourceBlocks.push(`--- QUELLE 4: BUNDESREGIERUNG ---\n${sources.bundesregierung.slice(0, 2000)}`);

  const prompt = `Du bist Schiedsrichter zwischen zwei LLM-Aussagen über einen Politiker.
Zwei vorherige LLM-Verifikationen waren sich unsicher — nun stehen dir mehr Quellen zur Verfügung.

POLITIKER: ${c.politicianName}
SEKTION: ${c.section}
ZEITRAUM: ${c.jahr}

LLAMA SAGT:    "${c.llamaText}"
MISTRAL SAGT:  "${c.mistralText}"

QUELLTEXTE (mehrere unabhängige Quellen, mit Tags markiert):

${sourceBlocks.join("\n\n")}

AUFGABE: Entscheide auf Basis ALLER Quelltexte, welche Aussage über den Zeitraum ${c.jahr} korrekt ist.
Wichtig: Die Aussagen müssen sich nicht gegenseitig ausschließen — z.B. „Abitur" und „Studium" können beide korrekt sein, nur eben in unterschiedlichen Jahren oder Phasen. Nutze "beide" wenn beide separat belegbar sind.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt, ohne Markdown-Codeblock, ohne Erklärung davor oder danach:
{
  "winner": "<llama|mistral|beide|keiner|unklar>",
  "reason": "<kurze Begründung, max 1-2 Sätze>",
  "evidenceQuote": "<wörtlicher Zitat-Schnipsel aus dem belegenden Quelltext, oder null>",
  "evidenceSource": "<wikipedia|bundestag|homepage|bundesregierung|none>",
  "source_conflict": <true|false>,
  "conflict_description": "<falls source_conflict=true: kurze Beschreibung des Widerspruchs zwischen den Quellen, sonst null>"
}

REGELN:
- "llama" → Llama-Aussage stimmt mit mind. einer Quelle, Mistral nicht
- "mistral" → Mistral stimmt mit mind. einer Quelle, Llama nicht
- "beide" → Beide Aussagen sind in den Quellen belegt (z.B. weil unterschiedliche Phasen)
- "keiner" → Beide widersprechen ALLEN Quellen
- "unklar" → Auch mit den erweiterten Quellen ist nichts dazu zu finden
- evidenceSource: gib an, in welcher Quelle der Beleg steht (oder "none" wenn keine)

QUELLEN-KONSISTENZ-PRÜFUNG (wichtig für Auditierbarkeit):
- Setze source_conflict=true, wenn die Quellen ZUM GLEICHEN SACHVERHALT unterschiedliche Aussagen machen
  (z.B. Wikipedia sagt „Amtsantritt 2018", Homepage sagt „2019" — das ist ein Widerspruch)
- Beachte: „Studium 1995-2000" in Quelle A und „Promotion 2003" in Quelle B widersprechen sich NICHT — das sind verschiedene Sachverhalte
- conflict_description: ein Satz, welche Quellen welche unterschiedlichen Aussagen machen
- Bei source_conflict=false: conflict_description ist null`;

  // SDK retried automatisch 429/5xx (default max_retries=2, exponential backoff).
  // Wir lassen den SDK das Heavy-Lifting machen; bei finalem Fail propagiert die Exception.
  // output_config.format mit JSON-Schema garantiert valides JSON ohne Escape-Bugs.
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: "Du antwortest immer mit einem reinen JSON-Objekt gemäß dem vorgegebenen Schema.",
    messages: [{ role: "user", content: prompt }],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            winner: { type: "string", enum: ["llama", "mistral", "beide", "keiner", "unklar"] },
            reason: { type: "string" },
            evidenceQuote: { anyOf: [{ type: "string" }, { type: "null" }] },
            evidenceSource: { type: "string", enum: ["wikipedia", "bundestag", "homepage", "bundesregierung", "none"] },
            source_conflict: { type: "boolean" },
            conflict_description: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
          required: ["winner", "reason", "evidenceQuote", "evidenceSource", "source_conflict", "conflict_description"],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Kein text-Block in Response");

  // Mit structured outputs sollte JSON.parse direkt funktionieren — defensiv trotzdem strippen
  let raw = textBlock.text.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) raw = fenced[1];

  const parsed = JSON.parse(raw);
  return {
    winner: parsed.winner ?? "unklar",
    reason: parsed.reason ?? "",
    evidenceQuote: parsed.evidenceQuote ?? null,
    evidenceSource: parsed.evidenceSource ?? "none",
    source_conflict: parsed.source_conflict === true,
    conflict_description: parsed.conflict_description ?? null,
  };
}

function getSourcesForPolitician(db: Database.Database, id: number): Sources {
  const r = db
    .prepare(
      `SELECT bio_full_text, bundestag_bio_text, cv_homepage_text, bundesregierung_bio_text
       FROM politicians WHERE id = ?`
    )
    .get(id) as
    | { bio_full_text: string | null; bundestag_bio_text: string | null; cv_homepage_text: string | null; bundesregierung_bio_text: string | null }
    | undefined;
  if (!r) return { wikipedia: null, bundestag: null, homepage: null, bundesregierung: null };
  return {
    wikipedia: r.bio_full_text,
    bundestag: r.bundestag_bio_text,
    homepage: r.cv_homepage_text,
    bundesregierung: r.bundesregierung_bio_text,
  };
}

async function main() {
  if (!fs.existsSync(PARTIAL_IN)) {
    console.error(`${PARTIAL_IN} nicht gefunden.`);
    process.exit(1);
  }

  // v1-Verdikte laden
  const v1Rows: V1Row[] = [];
  for (const line of fs.readFileSync(PARTIAL_IN, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    try {
      v1Rows.push(JSON.parse(line));
    } catch {}
  }
  console.log(`${v1Rows.length} v1-Verdikte geladen`);

  // Nur unscharfe Konflikte
  const uncertain = v1Rows.filter(
    (r) => r.verdict.winner === "keiner" || r.verdict.winner === "unklar"
  );
  console.log(`${uncertain.length} unscharfe Konflikte (keiner+unklar) zu prüfen\n`);

  // Resume-Cache
  const cache = new Map<string, V2Row>();
  if (fs.existsSync(PARTIAL_OUT)) {
    for (const line of fs.readFileSync(PARTIAL_OUT, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as V2Row;
        if (obj.key) cache.set(obj.key, obj);
      } catch {}
    }
    console.log(`Resume: ${cache.size} bereits in v2 verarbeitet\n`);
  }
  const partialFh = fs.openSync(PARTIAL_OUT, "a");

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const v2Rows: V2Row[] = [];
  const tally = { llama: 0, mistral: 0, beide: 0, keiner: 0, unklar: 0, error: 0 };
  const sourceTally = { wikipedia: 0, bundestag: 0, homepage: 0, bundesregierung: 0, none: 0 };

  for (let i = 0; i < uncertain.length; i++) {
    const r = uncertain[i];
    const cached = cache.get(r.key);
    if (cached) {
      tally[cached.v2Verdict.winner] = (tally[cached.v2Verdict.winner] ?? 0) + 1;
      sourceTally[cached.v2Verdict.evidenceSource] = (sourceTally[cached.v2Verdict.evidenceSource] ?? 0) + 1;
      v2Rows.push(cached);
      continue;
    }

    const sources = getSourcesForPolitician(db, r.conflict.politicianId);
    try {
      const v2Verdict = await callTiebreaker(r.conflict, sources);
      tally[v2Verdict.winner] = (tally[v2Verdict.winner] ?? 0) + 1;
      sourceTally[v2Verdict.evidenceSource] = (sourceTally[v2Verdict.evidenceSource] ?? 0) + 1;

      const v2Row: V2Row = {
        key: r.key,
        conflict: r.conflict,
        v1Verdict: r.verdict,
        v2Verdict,
      };
      v2Rows.push(v2Row);
      fs.writeSync(partialFh, JSON.stringify(v2Row) + "\n");

      if ((i + 1) % 10 === 0 || i === 0) {
        console.log(`  [${i + 1}/${uncertain.length}] ${r.conflict.politicianName} → v1:${r.verdict.winner} → v2:${v2Verdict.winner} (${v2Verdict.evidenceSource})`);
      }
      await sleep(SLEEP_MS);
    } catch (e: any) {
      tally.error++;
      console.log(`  ✗ ${r.conflict.politicianName}: ${e.message?.slice(0, 100)}`);
    }
  }
  fs.closeSync(partialFh);

  // Verdikt-Wechsel-Statistik
  let upgraded = 0,
    downgraded = 0,
    same = 0;
  for (const r of v2Rows) {
    if (r.v1Verdict.winner === r.v2Verdict.winner) same++;
    else if (
      (r.v1Verdict.winner === "keiner" || r.v1Verdict.winner === "unklar") &&
      r.v2Verdict.winner !== "keiner" &&
      r.v2Verdict.winner !== "unklar"
    ) upgraded++;
    else downgraded++;
  }

  // Bericht
  const lines: string[] = [];
  lines.push(`# Tiebreak v2 — Zweite Runde mit allen 4 Quellen`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · ${v2Rows.length} unscharfe Konflikte erneut geprüft\n`);
  lines.push(`## Verdikte v2 vs v1`);
  lines.push(`| Verdict | Anzahl |`);
  lines.push(`|---|---:|`);
  lines.push(`| 🟦 Llama | ${tally.llama} |`);
  lines.push(`| 🟧 Mistral | ${tally.mistral} |`);
  lines.push(`| 🟩 Beide korrekt | ${tally.beide} |`);
  lines.push(`| 🟥 Beide falsch | ${tally.keiner} |`);
  lines.push(`| ⬜ Unklar | ${tally.unklar} |\n`);
  lines.push(`## Aufgelöst durch v2`);
  lines.push(`- ✅ **${upgraded}** Konflikte aufgelöst (von keiner/unklar → llama/mistral/beide)`);
  lines.push(`- ⬇️ ${downgraded} Konflikte mit anderem Verdict`);
  lines.push(`- ↔️ ${same} Verdikte unverändert\n`);
  lines.push(`## Belege nach Quelle`);
  lines.push(`| Quelle | Anzahl Belege |`);
  lines.push(`|---|---:|`);
  lines.push(`| Wikipedia | ${sourceTally.wikipedia} |`);
  lines.push(`| Bundestag | ${sourceTally.bundestag} |`);
  lines.push(`| Homepage | ${sourceTally.homepage} |`);
  lines.push(`| Bundesregierung | ${sourceTally.bundesregierung} |`);
  lines.push(`| Keine | ${sourceTally.none} |\n`);

  // Detail-Listen
  let lastPid = 0;
  lines.push(`## Detail-Verdikte\n`);
  for (const r of v2Rows) {
    if (lastPid !== r.conflict.politicianId) {
      lines.push(`\n### ${r.conflict.politicianName} (id ${r.conflict.politicianId})`);
      lastPid = r.conflict.politicianId;
    }
    const icon = { llama: "🟦 LLAMA", mistral: "🟧 MISTRAL", beide: "🟩 BEIDE", keiner: "🟥 KEINER", unklar: "⬜ UNKLAR" }[r.v2Verdict.winner] || "❓";
    const v1Icon = { llama: "🟦", mistral: "🟧", beide: "🟩", keiner: "🟥", unklar: "⬜" }[r.v1Verdict.winner] || "?";
    lines.push(`- **${r.conflict.section}** · ${r.conflict.jahr} → ${icon} _(v1: ${v1Icon} ${r.v1Verdict.winner})_`);
    lines.push(`  - Llama: ${r.conflict.llamaText.slice(0, 130)}`);
    lines.push(`  - Mistral: ${r.conflict.mistralText.slice(0, 130)}`);
    lines.push(`  - **Begründung:** ${r.v2Verdict.reason}`);
    if (r.v2Verdict.evidenceQuote) lines.push(`  - **Beleg (${r.v2Verdict.evidenceSource}):** "${r.v2Verdict.evidenceQuote.slice(0, 200)}"`);
  }

  fs.writeFileSync(REPORT_OUT, lines.join("\n"), "utf-8");

  console.log(`\n=== v2 Fertig ===`);
  console.log(`  Llama:   ${tally.llama}`);
  console.log(`  Mistral: ${tally.mistral}`);
  console.log(`  Beide:   ${tally.beide}`);
  console.log(`  Keiner:  ${tally.keiner}`);
  console.log(`  Unklar:  ${tally.unklar}`);
  console.log(`  Fehler:  ${tally.error}`);
  console.log();
  console.log(`Aufgelöst (v1 unscharf → v2 klar): ${upgraded}`);
  console.log(`\nBericht: ${REPORT_OUT}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
