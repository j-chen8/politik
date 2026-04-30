/**
 * Stage 5.5 — Quelltext-Schiedsrichter.
 *
 * Stage 5 vergleicht zwei extrahierte CVs (Wikipedia vs. Homepage) und findet
 * Diskrepanzen. Das Problem: eine "Diskrepanz" kann zwei Ursachen haben —
 *   a) die echten Quelltexte stimmen wirklich nicht überein, ODER
 *   b) eine Extraktion ist falsch (LLM-Halluzination), die Quelltexte sagen
 *      eigentlich dasselbe.
 *
 * Stage 5.5 löst das, indem es für jede Diskrepanz die echten Roh-Quelltexte
 * konsultiert (bio_full_text + cv_homepage_text) und klassifiziert:
 *   - "echte_diskrepanz"           → Quellen sind wirklich uneinig (UI: zeigen)
 *   - "wikipedia_extraktion_falsch" → cv_json muss neu extrahiert werden
 *   - "homepage_extraktion_falsch"  → cv_homepage_json muss neu extrahiert werden
 *   - "beide_falsch"               → beide CV-Extraktionen falsch
 *   - "unklar"                     → Quelltext zu dünn für Entscheidung
 *
 * Modell: meta-llama/llama-3.3-70b-versatile auf Groq.
 * Andere Familie als Stage 5 (gpt-oss/OpenAI) — methodisch unabhängige Stimme.
 *
 * Output: aktualisiert politicians.source_conflicts (fügt `verification`-Feld
 *         pro Konflikt hinzu) + scripts/verify-source-conflicts.partial.jsonl
 *         für Resume.
 *
 * Run: npx tsx scripts/verify-source-conflicts.ts
 */

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
const PARTIAL_OUT = path.join(process.cwd(), "verify-source-conflicts.partial.jsonl");
const REPORT_OUT = path.join(process.cwd(), "verify-source-conflicts-report.md");

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);
if (GROQ_KEYS.length === 0) {
  console.error("Keine GROQ_API_KEY* in .env");
  process.exit(1);
}
let keyIdx = 0;
const nextKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
// Llama 3.3 70B Free-Tier: 30 RPM. 2500ms = 24 RPM, mit 4 Keys Rotation = sicher.
const SLEEP_MS = 2500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

type Classification =
  | "echte_diskrepanz"
  | "wikipedia_extraktion_falsch"
  | "homepage_extraktion_falsch"
  | "beide_falsch"
  | "unklar";

interface Verification {
  classification: Classification;
  reason: string;
  quote_wikipedia: string | null;
  quote_homepage: string | null;
}

interface Conflict {
  section: string;
  jahr: string;
  wikipedia: string;
  homepage: string;
  reason: string;
  verification?: Verification;
}

interface PoliticianRow {
  id: number;
  first_name: string;
  last_name: string;
  source_conflicts: string | null;
  bio_full_text: string | null;
  cv_homepage_text: string | null;
}

function fullName(p: PoliticianRow): string {
  return `${p.first_name} ${p.last_name}`;
}

async function verifyOne(
  name: string,
  conflict: Conflict,
  wikiText: string,
  homepageText: string,
): Promise<Verification> {
  const prompt = `Du bist Schiedsrichter über eine festgestellte Diskrepanz zwischen zwei Quellen über einen Politiker.
Eine Vorstufe hat zwei extrahierte Lebenslauf-Daten miteinander verglichen und einen Unterschied gefunden:

POLITIKER: ${name}
SEKTION: ${conflict.section}
ZEITRAUM: ${conflict.jahr}

EXTRAHIERT AUS WIKIPEDIA:  "${conflict.wikipedia}"
EXTRAHIERT AUS HOMEPAGE:   "${conflict.homepage}"

DEINE AUFGABE: Lies die ECHTEN Roh-Quelltexte (siehe unten) und entscheide:
Ist diese Diskrepanz eine ECHTE Diskrepanz zwischen den Quellen, oder ist eine Extraktion FALSCH (sagt etwas, das im Quelltext nicht so steht)?

--- ROH-WIKIPEDIA-VOLLTEXT (gekürzt auf relevante Stellen) ---
${wikiText.slice(0, 8000)}

--- ROH-HOMEPAGE-VOLLTEXT (gekürzt auf relevante Stellen) ---
${homepageText.slice(0, 6000)}

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt:
{
  "classification": "<echte_diskrepanz|wikipedia_extraktion_falsch|homepage_extraktion_falsch|beide_falsch|unklar>",
  "reason": "<1-2 Sätze Begründung>",
  "quote_wikipedia": "<wörtliches Zitat aus Wikipedia-Volltext, das die Klassifikation belegt; oder null>",
  "quote_homepage": "<wörtliches Zitat aus Homepage-Volltext, das die Klassifikation belegt; oder null>"
}

KRITERIEN:
- "echte_diskrepanz" → Wikipedia und Homepage sagen WIRKLICH etwas Verschiedenes zum gleichen Sachverhalt im gleichen Zeitraum (z.B. Wikipedia "Amtsantritt 2018", Homepage "Amtsantritt 2019")
- "wikipedia_extraktion_falsch" → der Wikipedia-Volltext sagt EIGENTLICH dasselbe wie die Homepage; die cv_json-Extraktion hat halluziniert oder falsch interpretiert
- "homepage_extraktion_falsch" → analog: der Homepage-Volltext sagt EIGENTLICH dasselbe wie Wikipedia, die cv_homepage_json-Extraktion ist falsch
- "beide_falsch" → keiner der beiden Quelltexte stützt die jeweilige Extraktion
- "unklar" → Quelltexte enthalten zum genannten Sachverhalt nicht genug Information

Sei ehrlich. Wenn der Quelltext eine Behauptung NICHT stützt, sage es.`;

  // 5 Versuche; Llama 3.3 70B kann gelegentlich rate-limiten oder leeren Output liefern
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${nextKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429) {
        await sleep(8000);
        continue;
      }
      if (!res.ok) {
        if (attempt === 4) throw new Error(`HTTP ${res.status}`);
        await sleep(2000);
        continue;
      }
      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        if (attempt === 4) throw new Error("empty content (5x)");
        await sleep(3000);
        continue;
      }
      const stripped = content
        .replace(/^\s*```(?:json)?\s*/, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const parsed = JSON.parse(stripped);
      const cls = parsed.classification as Classification;
      const validClasses: Classification[] = [
        "echte_diskrepanz",
        "wikipedia_extraktion_falsch",
        "homepage_extraktion_falsch",
        "beide_falsch",
        "unklar",
      ];
      return {
        classification: validClasses.includes(cls) ? cls : "unklar",
        reason: parsed.reason ?? "",
        quote_wikipedia: parsed.quote_wikipedia ?? null,
        quote_homepage: parsed.quote_homepage ?? null,
      };
    } catch (e: any) {
      if (attempt === 4) throw e;
      await sleep(2000);
    }
  }
  throw new Error("alle Versuche fehlgeschlagen");
}

interface PartialEntry {
  politicianId: number;
  conflictKey: string;
  verification: Verification;
}

function conflictKey(politicianId: number, c: Conflict): string {
  return `${politicianId}|${c.section}|${c.jahr}|${c.wikipedia.slice(0, 40)}|${c.homepage.slice(0, 40)}`;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Resume-Cache
  const cache = new Map<string, Verification>();
  if (fs.existsSync(PARTIAL_OUT)) {
    for (const line of fs.readFileSync(PARTIAL_OUT, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as PartialEntry;
        cache.set(obj.conflictKey, obj.verification);
      } catch {}
    }
    console.log(`Resume: ${cache.size} bereits verifiziert`);
  }
  const partialFh = fs.openSync(PARTIAL_OUT, "a");

  let rows = db
    .prepare(
      `SELECT id, first_name, last_name, source_conflicts, bio_full_text, cv_homepage_text
       FROM politicians
       WHERE source_conflicts IS NOT NULL AND source_conflicts != '[]' AND source_conflicts != ''`,
    )
    .all() as PoliticianRow[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);

  // Konflikte zählen
  const allConflicts: { row: PoliticianRow; conflicts: Conflict[] }[] = [];
  let totalConflicts = 0;
  for (const r of rows) {
    try {
      const conflicts = JSON.parse(r.source_conflicts!) as Conflict[];
      if (Array.isArray(conflicts) && conflicts.length > 0) {
        allConflicts.push({ row: r, conflicts });
        totalConflicts += conflicts.length;
      }
    } catch {}
  }
  console.log(`${allConflicts.length} MdBs mit insgesamt ${totalConflicts} Konflikten zu verifizieren\n`);

  const update = db.prepare(`UPDATE politicians SET source_conflicts = ? WHERE id = ?`);
  const tally: Record<Classification, number> = {
    echte_diskrepanz: 0,
    wikipedia_extraktion_falsch: 0,
    homepage_extraktion_falsch: 0,
    beide_falsch: 0,
    unklar: 0,
  };
  let processed = 0;
  let errors = 0;

  for (const { row, conflicts } of allConflicts) {
    const wiki = row.bio_full_text ?? "";
    const home = row.cv_homepage_text ?? "";
    if (!wiki && !home) {
      console.log(`  ⊘ ${fullName(row)}: keine Roh-Quelltexte vorhanden`);
      continue;
    }

    const updatedConflicts: Conflict[] = [];
    let politicianTouched = false;

    for (const c of conflicts) {
      const key = conflictKey(row.id, c);
      let verification = cache.get(key);

      if (!verification) {
        try {
          verification = await verifyOne(fullName(row), c, wiki, home);
          fs.writeSync(
            partialFh,
            JSON.stringify({ politicianId: row.id, conflictKey: key, verification } satisfies PartialEntry) + "\n",
          );
          await sleep(SLEEP_MS);
        } catch (e: any) {
          errors++;
          console.log(`  ✗ ${fullName(row)} [${c.section}/${c.jahr}]: ${e.message?.slice(0, 80)}`);
          updatedConflicts.push(c); // unverändert übernehmen
          continue;
        }
      }

      tally[verification.classification]++;
      politicianTouched = true;
      updatedConflicts.push({ ...c, verification });
    }

    if (politicianTouched) {
      update.run(JSON.stringify(updatedConflicts), row.id);
    }

    processed++;
    if (processed % 5 === 0 || processed === allConflicts.length) {
      const realCount = tally.echte_diskrepanz;
      const falschCount =
        tally.wikipedia_extraktion_falsch +
        tally.homepage_extraktion_falsch +
        tally.beide_falsch;
      console.log(
        `  [${processed}/${allConflicts.length}] echt=${realCount} extraktion-falsch=${falschCount} unklar=${tally.unklar} fehler=${errors}`,
      );
    }
  }
  fs.closeSync(partialFh);

  // Bericht
  const lines: string[] = [];
  lines.push(`# Stage 5.5 — Verifikation der Stage-5-Diskrepanzen\n`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · Modell: ${MODEL} (Groq)\n`);
  lines.push(`## Klassifikation`);
  lines.push(`| Kategorie | Anzahl | Bedeutung |`);
  lines.push(`|---|---:|---|`);
  lines.push(`| 🟧 Echte Quellen-Diskrepanz | ${tally.echte_diskrepanz} | Wikipedia und Homepage sagen wirklich Verschiedenes — UI zeigt das |`);
  lines.push(`| 🟦 Wikipedia-Extraktion falsch | ${tally.wikipedia_extraktion_falsch} | cv_json muss neu erzeugt werden |`);
  lines.push(`| 🟦 Homepage-Extraktion falsch | ${tally.homepage_extraktion_falsch} | cv_homepage_json muss neu erzeugt werden |`);
  lines.push(`| 🟥 Beide falsch | ${tally.beide_falsch} | beide Extraktionen falsch — beide neu erzeugen |`);
  lines.push(`| ⬜ Unklar | ${tally.unklar} | Quelltexte zu dünn |`);
  lines.push(`| ✗ Fehler | ${errors} | Verifikations-Aufruf failed |\n`);

  fs.writeFileSync(REPORT_OUT, lines.join("\n"), "utf-8");

  console.log(`\n=== Stage 5.5 Fertig ===`);
  console.log(`  Echte Diskrepanz:           ${tally.echte_diskrepanz}`);
  console.log(`  Wikipedia-Extr. falsch:     ${tally.wikipedia_extraktion_falsch}`);
  console.log(`  Homepage-Extr. falsch:      ${tally.homepage_extraktion_falsch}`);
  console.log(`  Beide falsch:               ${tally.beide_falsch}`);
  console.log(`  Unklar:                     ${tally.unklar}`);
  console.log(`  Fehler:                     ${errors}`);
  console.log(`\nBericht: ${REPORT_OUT}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
