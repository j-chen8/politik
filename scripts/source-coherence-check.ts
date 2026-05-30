/**
 * Stage 5 — Source-Coherence-Check.
 *
 * Vergleicht für jeden Politiker den Wikipedia-CV (cv_json) mit dem Homepage-CV
 * (cv_homepage_json) und identifiziert Quellen-Widersprüche zum gleichen
 * Sachverhalt (z.B. unterschiedliche Daten für ein Amtsantritt).
 *
 * Modell: openai/gpt-oss-120b auf Groq (große Limits, schnell, OpenAI-Familie
 * aber anderes Modell als Stage 4 GPT-4o-mini).
 *
 * Output: source-coherence-report.md + DB-Updates in
 *         politicians.source_conflicts (JSON, Liste der Widersprüche pro Person).
 *
 * Run: npx tsx scripts/source-coherence-check.ts [--limit N]
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
const REPORT_OUT = path.join(process.cwd(), "source-coherence-report.md");
const PARTIAL_OUT = path.join(process.cwd(), "source-coherence.partial.jsonl");

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
const MODEL = "openai/gpt-oss-120b";
// Konservatives Tempo: gpt-oss-120b auf Groq Free-Tier hat 30 RPM, 250K TPM.
// Wir nutzen 2500ms = 24 RPM — sicher unter Free-Tier-Limit, auch bei mehreren
// Politikern in Folge mit vielen Kandidaten.
const SLEEP_MS = 2500;

const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;
const BERLIN = process.argv.includes("--berlin");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

interface Conflict {
  section: string;
  jahr: string;
  wikipedia: string;
  homepage: string;
  reason: string;
}

interface PoliticianRow {
  id: number;
  name: string;
  cv_json: string | null;
  cv_homepage_json: string | null;
}

interface Result {
  politicianId: number;
  name: string;
  conflicts: Conflict[];
  totalChecked: number;
}

function ensureColumn(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("source_conflicts")) {
    db.exec("ALTER TABLE politicians ADD COLUMN source_conflicts TEXT");
  }
  if (!have.has("source_coherence_checked_at")) {
    db.exec("ALTER TABLE politicians ADD COLUMN source_coherence_checked_at TEXT");
  }
}

function loadCV(json: string | null): CV | null {
  if (!json) return null;
  try { return JSON.parse(json) as CV; } catch { return null; }
}

const SECTIONS = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"] as const;

/**
 * Findet pro Sektion + Jahr Paare, die beide Quellen haben — kandidaten für Widerspruchs-Prüfung.
 * Heuristik: gleiches `jahr` (oder überlappender Zeitraum), aber unterschiedlicher `text`.
 */
function findCandidates(cvWiki: CV, cvHome: CV): {
  section: string; jahr: string; wikipedia: string; homepage: string;
}[] {
  const candidates: { section: string; jahr: string; wikipedia: string; homepage: string }[] = [];
  for (const sec of SECTIONS) {
    const wikiEntries = cvWiki[sec] ?? [];
    const homeEntries = cvHome[sec] ?? [];
    for (const w of wikiEntries) {
      for (const h of homeEntries) {
        // Gleiches Jahr (oder „zumindest mit demselben Jahr beginnend")
        if (!w.jahr || !h.jahr) continue;
        const sameYear = w.jahr === h.jahr ||
          (w.jahr.length >= 4 && h.jahr.length >= 4 && w.jahr.slice(0, 4) === h.jahr.slice(0, 4));
        if (!sameYear) continue;
        // Wenn die Texte fast identisch sind (z.B. Stem-Match), kein Konflikt-Kandidat
        const wt = w.text.toLowerCase();
        const ht = h.text.toLowerCase();
        if (wt === ht) continue;
        if (wt.includes(ht.slice(0, 30)) || ht.includes(wt.slice(0, 30))) continue;
        candidates.push({ section: sec, jahr: w.jahr, wikipedia: w.text, homepage: h.text });
      }
    }
  }
  return candidates;
}

interface LLMVerdict {
  konflikt: boolean;
  begründung: string;
}

async function checkConflict(
  cand: { section: string; jahr: string; wikipedia: string; homepage: string }
): Promise<LLMVerdict> {
  const prompt = `Du prüfst, ob zwei Quellen sich beim gleichen Sachverhalt widersprechen.

SEKTION: ${cand.section}
ZEITRAUM: ${cand.jahr}

QUELLE A (Wikipedia): ${cand.wikipedia}
QUELLE B (Homepage):  ${cand.homepage}

Frage: Widersprechen sich die Quellen zum GLEICHEN Sachverhalt im gleichen Zeitraum?

Beachte:
- "Studium 1995" und "Promotion 1995" widersprechen sich NICHT (verschiedene Sachverhalte zum gleichen Jahr)
- "Amtsantritt 2018" und "Amtsantritt 2019" widersprechen sich JA (gleicher Sachverhalt, anderes Jahr)
- "MdB 2021" und "Vorsitz Ausschuss 2021" widersprechen sich NICHT (gleiche Person hat mehrere Rollen)

Antworte AUSSCHLIESSLICH mit JSON:
{
  "konflikt": <true|false>,
  "begründung": "<kurze Begründung, max 1 Satz>"
}`;

  // 5 Versuche statt 3 — gpt-oss-120b auf Groq liefert manchmal "empty content"
  // bei wiederholt gleichem Input. Mehr Retries + längere Backoffs helfen.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${nextKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 250,
          // OpenAI-kompatibler JSON-Mode auf Groq: erzwingt valides JSON.
          // Eliminiert die "Unterminated string"/"Expected property name"-Klasse von Fehlern.
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(30000),
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
        // Empty content ist transient: Backoff + retry mit nächstem Key
        if (attempt === 4) throw new Error("empty content (5x)");
        await sleep(3000);
        continue;
      }
      const stripped = content
        .replace(/^\s*```(?:json)?\s*/, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const parsed = JSON.parse(stripped);
      return {
        konflikt: parsed.konflikt === true,
        begründung: parsed.begründung ?? "",
      };
    } catch (e: any) {
      if (attempt === 4) throw e;
      await sleep(2000);
    }
  }
  throw new Error("Alle Versuche fehlgeschlagen");
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureColumn(db);

  // Politiker: nur die mit beiden CVs (sonst kein Vergleich möglich).
  // --berlin: alle MdL des Abgeordnetenhauses (parliament_id = 2), inkl. der
  //           ~178 mit abgeordnetenwatch-ids (<900000) — der alte
  //           Hardcode-Range 900001..900011 verpasste die.
  const scope = BERLIN
    ? `p.id IN (SELECT DISTINCT m.politician_id FROM mandates m
               JOIN parliament_periods pp ON m.parliament_period_id = pp.id
               WHERE pp.parliament_id = 2 AND m.type = 'mandate')`
    : `(p.id BETWEEN 900001 AND 900011 OR p.id IN (
                   SELECT DISTINCT politician_id FROM mandates m
                   JOIN parliament_periods pp ON m.parliament_period_id = pp.id
                   JOIN parliaments par ON pp.parliament_id = par.id
                   WHERE par.type = 'bundestag'
                 ))`;
  const sql = `SELECT p.id, p.first_name || ' ' || p.last_name AS name,
                      p.cv_json, p.cv_homepage_json
               FROM politicians p
               WHERE p.cv_json IS NOT NULL AND p.cv_homepage_json IS NOT NULL
                 AND ${scope}
               ORDER BY p.id`;
  let rows = db.prepare(sql).all() as PoliticianRow[];
  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} Politiker mit beiden CVs zu prüfen\n`);

  // Resume
  const cache = new Map<number, Result>();
  if (fs.existsSync(PARTIAL_OUT)) {
    for (const line of fs.readFileSync(PARTIAL_OUT, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as Result;
        cache.set(obj.politicianId, obj);
      } catch {}
    }
    console.log(`Resume: ${cache.size} bereits geprüft\n`);
  }
  const partialFh = fs.openSync(PARTIAL_OUT, "a");

  const updateDb = db.prepare(
    "UPDATE politicians SET source_conflicts = ?, source_coherence_checked_at = ? WHERE id = ?"
  );

  const allResults: Result[] = [];
  let totalCandidates = 0;
  let totalConflicts = 0;
  let politiciansWithConflicts = 0;
  const start = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let result = cache.get(r.id);

    if (!result) {
      const cvWiki = loadCV(r.cv_json);
      const cvHome = loadCV(r.cv_homepage_json);
      if (!cvWiki || !cvHome) {
        result = { politicianId: r.id, name: r.name, conflicts: [], totalChecked: 0 };
      } else {
        const candidates = findCandidates(cvWiki, cvHome);
        const conflicts: Conflict[] = [];
        for (const c of candidates) {
          try {
            const v = await checkConflict(c);
            if (v.konflikt) {
              conflicts.push({ ...c, reason: v.begründung });
            }
            await sleep(SLEEP_MS);
          } catch (e: any) {
            console.log(`  ✗ ${r.name} [${c.section}/${c.jahr}]: ${e.message?.slice(0, 80)}`);
          }
        }
        result = {
          politicianId: r.id, name: r.name, conflicts, totalChecked: candidates.length,
        };
        fs.writeSync(partialFh, JSON.stringify(result) + "\n");
        // DB
        updateDb.run(
          conflicts.length > 0 ? JSON.stringify(conflicts) : null,
          new Date().toISOString(),
          r.id
        );
      }
    }

    allResults.push(result);
    totalCandidates += result.totalChecked;
    totalConflicts += result.conflicts.length;
    if (result.conflicts.length > 0) politiciansWithConflicts++;

    if ((i + 1) % 25 === 0 || i === 0 || i === rows.length - 1) {
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`  [${i + 1}/${rows.length}] candidates=${totalCandidates} conflicts=${totalConflicts} betroffene=${politiciansWithConflicts} · ${elapsed}s`);
    }
  }
  fs.closeSync(partialFh);

  // Bericht
  const lines: string[] = [];
  lines.push(`# Source-Coherence-Bericht (Stage 5)`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · Modell: ${MODEL} (Groq)\n`);
  lines.push(`## Übersicht`);
  lines.push(`- ${rows.length} Politiker mit beiden CVs (Wikipedia + Homepage) geprüft`);
  lines.push(`- ${totalCandidates} Aussage-Paare mit gleichem Jahr (Konflikt-Kandidaten)`);
  lines.push(`- **${totalConflicts} echte Quellen-Widersprüche** identifiziert`);
  lines.push(`- ${politiciansWithConflicts} Politiker:innen betroffen\n`);

  lines.push(`## Detail-Liste\n`);
  for (const r of allResults) {
    if (r.conflicts.length === 0) continue;
    lines.push(`### ${r.name} (id ${r.politicianId})`);
    for (const c of r.conflicts) {
      lines.push(`- **${c.section}** · ${c.jahr}`);
      lines.push(`  - Wikipedia: ${c.wikipedia.slice(0, 130)}`);
      lines.push(`  - Homepage:  ${c.homepage.slice(0, 130)}`);
      lines.push(`  - **Widerspruch:** ${c.reason}`);
    }
    lines.push("");
  }

  fs.writeFileSync(REPORT_OUT, lines.join("\n"), "utf-8");

  console.log(`\n=== Fertig ===`);
  console.log(`  Politiker geprüft:        ${rows.length}`);
  console.log(`  Aussage-Paare verglichen: ${totalCandidates}`);
  console.log(`  Quellen-Widersprüche:     ${totalConflicts}`);
  console.log(`  Betroffene Politiker:     ${politiciansWithConflicts}`);
  console.log(`\nBericht: ${REPORT_OUT}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
