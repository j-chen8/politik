/**
 * Generiert aus cv_json und cv_homepage_json (plus Stammdaten) eine
 * lesbare 2–3-Satz-Bio für die UI. Speichert nach politicians.cv_summary.
 *
 * Run: npx tsx scripts/generate-cv-summary.ts [--all] [--refresh] [--limit N]
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
const MODEL = "llama-3.1-8b-instant";
const PROMPT_VERSION = "generate-cv-summary-v1";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const CONCURRENCY = 4;

const ALL = process.argv.includes("--all");
const REFRESH = process.argv.includes("--refresh");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);

if (GROQ_KEYS.length === 0) {
  console.error("Keine GROQ_API_KEY* in .env gefunden");
  process.exit(1);
}
console.log(`${GROQ_KEYS.length} Groq-Key(s) verfügbar`);

let keyIdx = 0;
const nextKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ensureColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  for (const col of ["cv_summary", "cv_summary_generated_at"]) {
    if (!have.has(col)) {
      db.exec(`ALTER TABLE politicians ADD COLUMN ${col} TEXT`);
      console.log(`→ ${col} Spalte angelegt`);
    }
  }
}

const SYSTEM_PROMPT = `Du fasst den Lebenslauf eines deutschen Politikers in 2–3 lesbaren deutschen Sätzen zusammen.

REGELN:
- Reiner Fließtext, kein Markdown, keine Aufzählungen, keine Anrede.
- Nur Fakten, die WÖRTLICH in den gelieferten Daten stehen. Niemals Universitäten, Abschlüsse, Buchtitel, Verlage oder Jahreszahlen erfinden.
- Wenn ein Detail nicht in den Daten steht, lass es weg. Lieber kurz und korrekt als ausgeschmückt.
- Beginne mit dem aktuellen politischen Amt oder dem prägendsten Mandat.
- Erwähne, falls in den Daten vorhanden: zentrale Ausbildung/Beruf, ein bis zwei wichtige politische Stationen.
- Maximal 3 Sätze. Insgesamt höchstens ~400 Zeichen.
- Antworte NUR mit dem Bio-Text, kein JSON, keine Erklärung, keine Anführungszeichen drumherum.`;

interface CV {
  ausbildung?: { jahr: string; text: string }[];
  beruflicher_werdegang?: { jahr: string; text: string }[];
  politische_stationen?: { jahr: string; text: string }[];
  sonstiges?: { jahr: string; text: string }[];
}

function buildUserPrompt(p: {
  first_name: string;
  last_name: string;
  title: string | null;
  party: string | null;
  year_of_birth: number | null;
  occupation: string | null;
  cv_json: string | null;
  cv_homepage_json: string | null;
}): string {
  const lines: string[] = [];
  const fullName = [p.title, p.first_name, p.last_name].filter(Boolean).join(" ");
  lines.push(`Name: ${fullName}`);
  if (p.party) lines.push(`Partei: ${p.party}`);
  if (p.year_of_birth) lines.push(`Geburtsjahr: ${p.year_of_birth}`);
  if (p.occupation) lines.push(`Beruf (Stammdaten): ${p.occupation}`);

  const merged: CV = { ausbildung: [], beruflicher_werdegang: [], politische_stationen: [], sonstiges: [] };
  for (const raw of [p.cv_homepage_json, p.cv_json]) {
    if (!raw) continue;
    try {
      const cv = JSON.parse(raw) as CV;
      for (const k of ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"] as const) {
        if (Array.isArray(cv[k])) merged[k]!.push(...cv[k]!);
      }
    } catch { /* ignore broken json */ }
  }

  const fmt = (arr?: { jahr: string; text: string }[]) =>
    (arr ?? []).map((e) => `  - ${e.jahr ? `[${e.jahr}] ` : ""}${e.text}`).join("\n");

  if (merged.ausbildung?.length) lines.push(`\nAusbildung:\n${fmt(merged.ausbildung)}`);
  if (merged.beruflicher_werdegang?.length) lines.push(`\nBeruflicher Werdegang:\n${fmt(merged.beruflicher_werdegang)}`);
  if (merged.politische_stationen?.length) lines.push(`\nPolitische Stationen:\n${fmt(merged.politische_stationen)}`);
  if (merged.sonstiges?.length) lines.push(`\nSonstiges:\n${fmt(merged.sonstiges)}`);

  return lines.join("\n");
}

async function generateSummary(userPrompt: string): Promise<{ summary: string; raw: string } | null> {
  for (let attempt = 0; attempt < GROQ_KEYS.length * 2; attempt++) {
    const key = nextKey();
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 250,
        }),
      });
      if (res.status === 429) {
        const ra = res.headers.get("retry-after");
        const waitMs = ra ? Math.min(60000, parseFloat(ra) * 1000) : 5000;
        await sleep(waitMs);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${body.slice(0, 120)}`);
      }
      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content as string | undefined;
      if (!content) return null;
      return { summary: content.trim().replace(/^["']|["']$/g, "").trim(), raw: content };
    } catch (e: any) {
      if (attempt === GROQ_KEYS.length * 2 - 1) throw e;
      await sleep(1000);
    }
  }
  return null;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureColumns(db);

  const skipExisting = REFRESH ? "" : "AND p.cv_summary IS NULL";

  const sql = ALL
    ? `SELECT DISTINCT p.id, p.first_name, p.last_name, p.title, p.year_of_birth, p.occupation,
            p.cv_json, p.cv_homepage_json, parties.label AS party
       FROM politicians p
       LEFT JOIN parties ON parties.id = p.party_id
       WHERE (p.cv_json IS NOT NULL OR p.cv_homepage_json IS NOT NULL) ${skipExisting}`
    : `SELECT DISTINCT p.id, p.first_name, p.last_name, p.title, p.year_of_birth, p.occupation,
            p.cv_json, p.cv_homepage_json, parties.label AS party
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       LEFT JOIN parties ON parties.id = p.party_id
       WHERE (p.cv_json IS NOT NULL OR p.cv_homepage_json IS NOT NULL)
         AND par.type = 'bundestag' ${skipExisting}`;

  let rows = db.prepare(sql).all() as {
    id: number;
    first_name: string;
    last_name: string;
    title: string | null;
    year_of_birth: number | null;
    occupation: string | null;
    cv_json: string | null;
    cv_homepage_json: string | null;
    party: string | null;
  }[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`${rows.length} MdBs zum Zusammenfassen`);
  if (rows.length === 0) { db.close(); return; }

  const update = db.prepare(
    `UPDATE politicians SET cv_summary = ?, cv_summary_generated_at = ?,
     cv_summary_model = ?, cv_summary_prompt_version = ?, cv_summary_raw_llm_response = ? WHERE id = ?`
  );

  let ok = 0, fail = 0, done = 0;
  const start = Date.now();

  async function processOne(p: typeof rows[0]) {
    const name = `${p.first_name} ${p.last_name}`;
    try {
      const userPrompt = buildUserPrompt(p);
      const result = await generateSummary(userPrompt);
      if (!result) { fail++; return; }
      update.run(
        result.summary, new Date().toISOString(),
        `groq:${MODEL}`, PROMPT_VERSION, result.raw,
        p.id
      );
      ok++;
    } catch (e: any) {
      fail++;
      console.log(`\n  ✗ ${name}: ${e.message?.slice(0, 100)}`);
    } finally {
      done++;
      const elapsed = (Date.now() - start) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((rows.length - done) / Math.max(rate, 0.01));
      process.stdout.write(`\r  [${done}/${rows.length}] ok=${ok} fail=${fail} ${rate.toFixed(1)}/s ETA ${eta}s   `);
    }
  }

  let nextIdx = 0;
  async function worker() {
    while (nextIdx < rows.length) {
      const i = nextIdx++;
      await processOne(rows[i]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write("\n");

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Fehler:      ${fail}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
