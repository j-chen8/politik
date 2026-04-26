/**
 * Generiert für jeden Politiker mit Wikipedia-Bio einen strukturierten
 * Lebenslauf via Groq LLM (llama-3.3-70b, JSON-Mode).
 *
 * Pipeline: politicians.bio_url → Wikipedia full text → LLM → cv_json
 *
 * Schreibt nach politicians.{cv_json, cv_source, cv_generated_at}.
 *
 * Run: npx tsx scripts/seed-cv.ts [--all] [--refresh]
 *      --all     : nicht nur Bundestag
 *      --refresh : auch Politiker mit existierendem cv_json überschreiben
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
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const MODEL = "llama-3.1-8b-instant";  // 5× höheres TPD als 70b, für Fakten-Extraktion ausreichend
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_DELAY_MS = 250;
const CONCURRENCY = 3;          // 4 Keys × 30 RPM = 120 RPM Limit, 3 parallel passt

const ALL = process.argv.includes("--all");
const REFRESH = process.argv.includes("--refresh");

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);

if (GROQ_KEYS.length === 0) {
  console.error("Keine GROQ_API_KEY* in .env gefunden");
  process.exit(1);
}

console.log(`${GROQ_KEYS.length} Groq-Key(s) verfügbar`);

let keyIdx = 0;
function nextKey() {
  const k = GROQ_KEYS[keyIdx % GROQ_KEYS.length];
  keyIdx++;
  return k;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Schema ──

function ensureColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("cv_json")) db.exec("ALTER TABLE politicians ADD COLUMN cv_json TEXT");
  if (!have.has("cv_source")) db.exec("ALTER TABLE politicians ADD COLUMN cv_source TEXT");
  if (!have.has("cv_generated_at")) db.exec("ALTER TABLE politicians ADD COLUMN cv_generated_at TEXT");
}

// ── Wikipedia full text ──

async function fetchWikipediaText(title: string): Promise<string | null> {
  const url = `https://de.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const pages = data?.query?.pages ?? {};
  const first = Object.values<any>(pages)[0];
  return first?.extract ?? null;
}

function titleFromBioUrl(url: string): string {
  const m = url.match(/\/wiki\/([^?#]+)/);
  return m ? decodeURIComponent(m[1]).replace(/_/g, " ") : "";
}

// ── Groq Call ──

const SYSTEM_PROMPT = `Du bist ein Assistent, der aus Wikipedia-Artikeln über Politiker einen strukturierten Lebenslauf in deutschem JSON extrahiert.

Antworte AUSSCHLIESSLICH mit gültigem JSON in folgendem Schema:
{
  "ausbildung": [{"jahr": "2003-2007", "text": "Studium der Rechtswissenschaft an der Universität Köln (1. Staatsexamen)"}],
  "beruflicher_werdegang": [{"jahr": "2010-2014", "text": "Wissenschaftlicher Mitarbeiter am Lehrstuhl für Verfassungsrecht, Universität Bonn"}],
  "politische_stationen": [{"jahr": "seit 2017", "text": "Mitglied der SPD, ab 2019 Vorsitzender des Ortsvereins Köln-Mülheim"}],
  "sonstiges": [{"jahr": "2019", "text": "Buchautor: 'Titel des Buches' (Suhrkamp)"}]
}

Strikte Regeln:
- Nur Fakten aus dem gelieferten Text. Keine Vermutungen, keine Erfindungen.
- Chronologisch sortiert (älteste zuerst).
- jahr als String mit Format "YYYY", "YYYY-YYYY", "seit YYYY", "bis YYYY" — wie im Text.
- Bei Ausbildung: WENN im Text genannt, IMMER Universität/Schule UND erreichten Abschluss/Titel mitnennen (z.B. "Studium der BWL an der LMU München, Diplom-Kaufmann"). Wenn nicht im Text, dann nicht erfinden.
- Bei Berufen: Position + Arbeitgeber/Firma falls genannt.
- text präzise und vollständig zur Information (max ~200 Zeichen, ein Satz, keine Aufzählungs-Striche im Text).
- Wenn ein Bereich keine Einträge hat: leeres Array [].
- Antworte NUR mit dem JSON-Objekt, kein Markdown, keine Kommentare.`;

interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

async function generateCv(politicianName: string, wikipediaText: string): Promise<CV | null> {
  // Trim very long articles to first 25k chars (saves tokens, lead is the relevant part)
  const text = wikipediaText.slice(0, 25000);

  for (let attempt = 0; attempt < GROQ_KEYS.length * 2; attempt++) {
    const key = nextKey();
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Politiker: ${politicianName}\n\nWikipedia-Artikel:\n${text}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (res.status === 429) {
        // Rate-limited — try next key after short pause
        await sleep(2000);
        continue;
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;
      return JSON.parse(content) as CV;
    } catch (e: any) {
      if (attempt === GROQ_KEYS.length * 2 - 1) throw e;
      await sleep(1000);
    }
  }
  return null;
}

// ── Main ──

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureColumns(db);

  const where = ALL ? `` : `AND par.type = 'bundestag'`;
  const skipExisting = REFRESH ? "" : "AND p.cv_json IS NULL";

  const rows = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.bio_url
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE p.bio_url IS NOT NULL ${where} ${skipExisting}`
    )
    .all() as { id: number; first_name: string; last_name: string; bio_url: string }[];

  console.log(`\n${rows.length} Politiker zu verarbeiten`);
  if (rows.length === 0) {
    console.log("Nichts zu tun.");
    db.close();
    return;
  }

  const update = db.prepare(
    `UPDATE politicians SET cv_json = ?, cv_source = 'wikipedia_de+groq:${MODEL}', cv_generated_at = ? WHERE id = ?`
  );

  let ok = 0, fail = 0, done = 0;
  const start = Date.now();

  async function processOne(p: typeof rows[0]) {
    const name = `${p.first_name} ${p.last_name}`;
    const title = titleFromBioUrl(p.bio_url);
    try {
      const wpText = await fetchWikipediaText(title);
      if (!wpText || wpText.length < 200) {
        fail++;
        return;
      }
      const cv = await generateCv(name, wpText);
      if (!cv) {
        fail++;
        return;
      }
      update.run(JSON.stringify(cv), new Date().toISOString(), p.id);
      ok++;
    } catch (e: any) {
      fail++;
      console.log(`\n  ✗ ${name}: ${e.message?.slice(0, 100)}`);
    } finally {
      done++;
      const elapsed = (Date.now() - start) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((rows.length - done) / Math.max(rate, 0.01));
      process.stdout.write(`\r  [${done}/${rows.length}] ok=${ok} fail=${fail} ${rate.toFixed(1)}/s ETA ${eta}s    `);
    }
  }

  // Worker-Pool
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < rows.length) {
      const i = nextIdx++;
      await processOne(rows[i]);
      await sleep(REQUEST_DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write("\n");

  console.log(`\n=== Fertig ===`);
  console.log(`  CVs generiert: ${ok}`);
  console.log(`  Fehler:        ${fail}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
