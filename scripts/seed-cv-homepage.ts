/**
 * Versucht für jeden Politiker mit homepage_url eine "Über mich"/Vita-Seite
 * zu finden, scraped sie und extrahiert via LLM einen strukturierten CV.
 *
 * Pipeline: homepage_url → Standard-Pfade probieren → längster Treffer →
 *           HTML strippen → Groq Llama 3.1 8b → cv_homepage_json
 *
 * Schreibt nach politicians.{cv_homepage_json, cv_homepage_url, cv_homepage_generated_at}.
 *
 * Rate-Limits: max 1 req/sec pro Domain, Browser-UA, robots.txt wird respektiert.
 *
 * Run: npx tsx scripts/seed-cv-homepage.ts [--all] [--refresh] [--limit N]
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
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PER_DOMAIN_DELAY_MS = 1000;
const CONCURRENCY = 4;          // verschiedene Domains parallel okay
const MAX_TEXT_CHARS = 8000;

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
function nextKey() { return GROQ_KEYS[keyIdx++ % GROQ_KEYS.length]; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Schema ──

function ensureColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  for (const col of ["cv_homepage_json", "cv_homepage_url", "cv_homepage_generated_at"]) {
    if (!have.has(col)) {
      db.exec(`ALTER TABLE politicians ADD COLUMN ${col} TEXT`);
      console.log(`→ ${col} Spalte angelegt`);
    }
  }
}

// ── Per-domain rate limit ──

const lastFetchAt = new Map<string, number>();
async function politeFetch(url: string, timeoutMs = 8000): Promise<Response | null> {
  const host = new URL(url).hostname;
  const last = lastFetchAt.get(host) ?? 0;
  const wait = Math.max(0, last + PER_DOMAIN_DELAY_MS - Date.now());
  if (wait > 0) await sleep(wait);
  lastFetchAt.set(host, Date.now());

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ── robots.txt cache ──

const robotsCache = new Map<string, Set<string>>();
async function isAllowed(url: string): Promise<boolean> {
  const host = new URL(url).hostname;
  if (!robotsCache.has(host)) {
    const robotsUrl = `${new URL(url).origin}/robots.txt`;
    const res = await politeFetch(robotsUrl, 4000);
    const disallows = new Set<string>();
    if (res?.ok) {
      const text = await res.text();
      let activeUa = false;
      for (const raw of text.split("\n")) {
        const line = raw.trim().toLowerCase();
        if (line.startsWith("user-agent:")) {
          const ua = line.split(":", 2)[1].trim();
          activeUa = ua === "*" || ua === "mozilla";
        } else if (activeUa && line.startsWith("disallow:")) {
          const p = line.split(":", 2)[1].trim();
          if (p) disallows.add(p);
        }
      }
    }
    robotsCache.set(host, disallows);
  }
  const dis = robotsCache.get(host)!;
  const pathPart = new URL(url).pathname;
  for (const d of dis) {
    if (pathPart.startsWith(d)) return false;
  }
  return true;
}

// ── HTML → Plain Text ──

function htmlToText(html: string): string {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
  t = t.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  t = t.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  t = t.replace(/<header[\s\S]*?<\/header>/gi, " ");
  t = t.replace(/<[^>]+>/g, " ");
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// ── Find best "about" page ──

const ABOUT_PATHS = [
  "/ueber-mich/", "/ueber-mich",
  "/zur-person/", "/zur-person",
  "/lebenslauf/", "/lebenslauf",
  "/vita/", "/vita",
  "/biografie/", "/biografie", "/biographie/", "/biographie",
  "/steckbrief/", "/steckbrief",
  "/person/", "/person",
  "/about/", "/about",
  "/profil/", "/profil",
  "/mein-profil/", "/mein-profil",
  "/mein-lebenslauf/", "/mein-lebenslauf",
  "/wer-bin-ich/", "/wer-bin-ich",
];

interface PageHit { url: string; text: string }

async function findAboutPage(homepageUrl: string): Promise<PageHit | null> {
  let origin: string;
  try { origin = new URL(homepageUrl).origin; }
  catch { return null; }

  let best: PageHit | null = null;
  for (const p of ABOUT_PATHS) {
    const tryUrl = origin + p;
    if (!(await isAllowed(tryUrl))) continue;
    const res = await politeFetch(tryUrl);
    if (!res?.ok) continue;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) continue;
    const html = await res.text();
    const text = htmlToText(html);
    if (text.length < 300) continue;
    if (!best || text.length > best.text.length) {
      best = { url: tryUrl, text };
    }
    if (text.length > 2000) break; // good enough
  }
  return best;
}

// ── Groq Call ──

const SYSTEM_PROMPT = `Du extrahierst aus dem Text einer Politiker-Homepage einen strukturierten Lebenslauf in deutschem JSON.

Antworte AUSSCHLIESSLICH mit gültigem JSON in folgendem Schema:
{
  "ausbildung": [{"jahr": "2003-2007", "text": "Studium der Rechtswissenschaft an der Universität Köln, Diplom-Jurist"}],
  "beruflicher_werdegang": [{"jahr": "2010-2014", "text": "Wissenschaftlicher Mitarbeiter am Lehrstuhl für Verfassungsrecht, Universität Bonn"}],
  "politische_stationen": [{"jahr": "seit 2017", "text": "Mitglied der SPD, ab 2019 Vorsitzender des Ortsvereins Köln-Mülheim"}],
  "sonstiges": [{"jahr": "2019", "text": "Buchautor: 'Titel des Buches' (Suhrkamp)"}]
}

Strikte Regeln:
- Nur Fakten aus dem gelieferten Text. Keine Vermutungen, keine Erfindungen.
- Chronologisch sortiert (älteste zuerst).
- jahr als String mit Format "YYYY", "YYYY-YYYY", "seit YYYY", "bis YYYY" — wie im Text.
- Bei Ausbildung: WENN im Text genannt, IMMER Universität/Schule UND erreichten Abschluss/Titel mitnennen.
- Bei Berufen: Position + Arbeitgeber/Firma falls genannt.
- text präzise (max ~200 Zeichen, ein Satz).
- Wenn ein Bereich keine Einträge hat: leeres Array [].
- Antworte NUR mit dem JSON-Objekt, kein Markdown.`;

interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

async function generateCv(name: string, text: string): Promise<CV | null> {
  const trimmed = text.slice(0, MAX_TEXT_CHARS);
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
            { role: "user", content: `Politiker: ${name}\n\nHomepage-Text:\n${trimmed}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });
      if (res.status === 429) { await sleep(2000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      return content ? (JSON.parse(content) as CV) : null;
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
  const skipExisting = REFRESH ? "" : "AND p.cv_homepage_json IS NULL";

  let rows = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.homepage_url
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE p.homepage_url IS NOT NULL ${where} ${skipExisting}`
    )
    .all() as { id: number; first_name: string; last_name: string; homepage_url: string }[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`\n${rows.length} Politiker mit homepage_url zu verarbeiten`);
  if (rows.length === 0) { db.close(); return; }

  const update = db.prepare(
    `UPDATE politicians SET cv_homepage_json = ?, cv_homepage_url = ?, cv_homepage_generated_at = ? WHERE id = ?`
  );

  let foundPage = 0, llmOk = 0, llmFail = 0, noPage = 0, done = 0;
  const start = Date.now();

  async function processOne(p: typeof rows[0]) {
    const name = `${p.first_name} ${p.last_name}`;
    try {
      const hit = await findAboutPage(p.homepage_url);
      if (!hit) { noPage++; return; }
      foundPage++;
      const cv = await generateCv(name, hit.text);
      if (!cv) { llmFail++; return; }
      update.run(JSON.stringify(cv), hit.url, new Date().toISOString(), p.id);
      llmOk++;
    } catch (e: any) {
      llmFail++;
      console.log(`\n  ✗ ${name}: ${e.message?.slice(0, 100)}`);
    } finally {
      done++;
      const elapsed = (Date.now() - start) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((rows.length - done) / Math.max(rate, 0.01));
      process.stdout.write(`\r  [${done}/${rows.length}] page=${foundPage} llm-ok=${llmOk} llm-fail=${llmFail} no-page=${noPage} ${rate.toFixed(1)}/s ETA ${eta}s   `);
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
  console.log(`  Über-mich-Seite gefunden: ${foundPage}/${rows.length}`);
  console.log(`  LLM erfolgreich:          ${llmOk}`);
  console.log(`  LLM-Fehler:               ${llmFail}`);
  console.log(`  Keine Seite gefunden:     ${noPage}`);

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
