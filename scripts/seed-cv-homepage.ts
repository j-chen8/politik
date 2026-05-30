/**
 * ⛔️ DEPRECATED — NICHT MEHR VERWENDEN für die CV-Generierung.
 * ─────────────────────────────────────────────────────────────────────────────
 * Dieses Skript extrahiert den Homepage-CV mit Groq Llama 3.1 8b. Das ist NICHT
 * unsere CV-Methodik: laut docs/PIPELINE.md (Block A) ist der Generator-Slot
 * Haiku 4.5 (Anthropic) — wie bei Wikipedia-CVs (cv_json, A.1) und den bereits
 * mit Haiku erzeugten Bundestag-Homepage-CVs (cv_homepage_model =
 * 'anthropic:claude-haiku-4-5'). Llama-8b liefert spürbar schwächere Struktur.
 *
 * ➡️ Profile/Homepages analysieren? → Haiku-Batch nutzen:
 *      Discovery + Text-Fetch (die Logik HIER, findAboutPage) liefert
 *      cv_homepage_text; die JSON-Extraktion läuft über die geteilte
 *      _lib/cv-prompt.ts (CV_MODEL = claude-haiku-4-5, CV_SCHEMA) im Batch —
 *      analog scripts/batch-submit-cv.ts / batch-retrieve-cv.ts (Wikipedia).
 *      Siehe docs/PIPELINE.md §A.2 und scripts/scrape-berlin-agh-profiles.ts.
 *
 * Die Vita-Discovery (Standard-Pfade, Link-Scan, Sitemap, One-Pager-Fallback)
 * bleibt wertvoll und wird vom Haiku-Pfad WIEDERVERWENDET — nur der LLM-Call
 * (generateCv → Groq) ist veraltet. Skript zu Doku-/Discovery-Zwecken behalten.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pipeline: homepage_url → Standard-Pfade probieren → längster Treffer →
 *           HTML strippen → Groq Llama 3.1 8b → cv_homepage_json   ⛔️ (llama!)
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
const PROMPT_VERSION = "seed-cv-homepage-v2-2026-04-28";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PER_DOMAIN_DELAY_MS = 1000;
const CONCURRENCY = 4;          // verschiedene Domains parallel okay
const MAX_TEXT_CHARS = 8000;

const ALL = process.argv.includes("--all");
const REFRESH = process.argv.includes("--refresh");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

// ⛔️ DEPRECATED-Guard: llama-8b ist nicht unsere CV-Methodik (Haiku-Batch, s. Header).
if (!process.argv.includes("--i-know-this-is-deprecated")) {
  console.error(
    "⛔️  seed-cv-homepage.ts ist DEPRECATED (llama-8b statt Haiku 4.5).\n" +
      "    Für CV-Generierung den Haiku-Batch-Pfad nutzen — siehe Datei-Header & docs/PIPELINE.md §A.2.\n" +
      "    Wenn du WIRKLICH den alten llama-Pfad willst: Flag --i-know-this-is-deprecated anhängen."
  );
  process.exit(1);
}

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
  for (const col of ["cv_homepage_json", "cv_homepage_url", "cv_homepage_generated_at", "cv_homepage_text"]) {
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

import { cleanBioHtml } from "./_lib/html-clean";

function htmlToText(html: string): string {
  return cleanBioHtml(html).text;
}

// ── Find best "about" page ──

// Pfad-Liste basierend auf einer Auswertung der bereits erfolgreichen cv_homepage_url.
// Jede Variante einmal mit und einmal ohne Trailing Slash.
const ABOUT_PATHS = (() => {
  const stems = [
    // Häufigste Treffer (>5 in DB)
    "ueber-mich", "uebermich", "uber-mich", "ueber_mich",
    "person", "persoenlich", "persönlich", "persoenliches", "persönliches",
    "lebenslauf", "mein-lebenslauf", "vita", "zur-person",
    "about", "about-me", "biografie", "biographie",
    // Mittel (2-5)
    "steckbrief", "profil", "mein-profil", "wer-bin-ich", "wer-ich-bin",
    "ueber-meine-person", "ueber-mein-person", "uber-meine-person",
    "zu-meiner-person", "zur-meiner-person",
    "über-mich", "ueber",
    "das-bin-ich", "abgeordnete", "abgeordneter",
    // Niedrig, aber lohnt
    "portrait", "porträt", "werdegang", "beruflicher-werdegang",
    "cv", "biografisches", "biografische-angaben", "biographische-angaben",
    "ueber-uns", "über-uns",
    // Suffix-Varianten (manche WP-Themes hängen "-1" an)
    "ueber-mich-1", "lebenslauf-1",
  ];
  const paths: string[] = [];
  for (const s of stems) {
    paths.push(`/${s}/`, `/${s}`);
  }
  return paths;
})();

// Keywords to match in link href or text when scanning the homepage
const ABOUT_KEYWORDS = /(?:ueber[_-]?mich|über[_-]?mich|uebermich|übermich|uber[_-]?mich|zur[_-]?person|zu[_-]?meiner[_-]?person|ueber[_-]?meine?[_-]?person|lebenslauf|vita|biogra(?:fie|phie|fisch|phisch)|steckbrief|persönlich|persoenlich|^persoen|^persön|person(?!al)|about[_-]?me|^about$|portrait|porträt|profil|wer[_-]?bin[_-]?ich|wer[_-]?ich[_-]?bin|mein[_-]?weg|werdegang|das[_-]?bin[_-]?ich|abgeordnete[rn]?|^cv$|hintergrund|biografisch|biographisch)/i;

interface PageHit { url: string; text: string }

/** Extract all <a href="..."> from HTML, return absolute URLs */
function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const re = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const linkText = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!rawHref || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) continue;
    try {
      const abs = new URL(rawHref, baseUrl).href;
      links.push({ href: abs, text: linkText });
    } catch { /* skip invalid URLs */ }
  }
  return links;
}

async function tryFetchAboutPage(url: string): Promise<PageHit | null> {
  if (!(await isAllowed(url))) return null;
  const res = await politeFetch(url);
  if (!res?.ok) return null;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return null;
  const html = await res.text();
  const text = htmlToText(html);
  if (text.length < 300) return null;
  return { url, text };
}

async function findAboutPage(homepageUrl: string): Promise<PageHit | null> {
  let origin: string;
  try { origin = new URL(homepageUrl).origin; }
  catch { return null; }

  let best: PageHit | null = null;

  // Strategy 1: Fetch homepage first — wir brauchen es für Strategy 2 + 4 sowieso.
  const homeRes = await politeFetch(homepageUrl);
  let homeHtml: string | null = null;
  if (homeRes?.ok) {
    const homeCt = homeRes.headers.get("content-type") ?? "";
    if (homeCt.includes("text/html")) {
      homeHtml = await homeRes.text();
    }
  }

  // Strategy 2: Scan homepage for links matching about-keywords
  // (zuerst, weil das die echten Pfade der Site liefert — auch TYPO3-_p_NN.html, eigene Slugs etc.)
  if (homeHtml) {
    const links = extractLinks(homeHtml, homepageUrl);
    const seen = new Set<string>();
    const candidates: string[] = [];
    for (const link of links) {
      let urlPath = "";
      try { urlPath = decodeURIComponent(new URL(link.href).pathname); } catch { continue; }
      if (ABOUT_KEYWORDS.test(urlPath) || ABOUT_KEYWORDS.test(link.text)) {
        if (link.href.startsWith(origin) && !seen.has(link.href)) {
          seen.add(link.href);
          candidates.push(link.href);
        }
      }
    }
    for (const url of candidates.slice(0, 8)) {
      const hit = await tryFetchAboutPage(url);
      if (!hit) continue;
      if (!best || hit.text.length > best.text.length) best = hit;
      if (hit.text.length > 2000) return best;
    }
    if (best) return best;
  }

  // Strategy 3: Standard-Pfade durchprobieren (Brute-Force-Fallback)
  for (const p of ABOUT_PATHS) {
    const tryUrl = origin + p;
    const hit = await tryFetchAboutPage(tryUrl);
    if (!hit) continue;
    if (!best || hit.text.length > best.text.length) best = hit;
    if (hit.text.length > 2000) return best;
  }
  if (best) return best;

  // Strategy 4: Sitemap.xml versuchen
  for (const sitemapPath of ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]) {
    const smRes = await politeFetch(origin + sitemapPath, 6000);
    if (!smRes?.ok) continue;
    const smText = await smRes.text();
    const urls: string[] = [];
    const reLoc = /<loc>([^<]+)<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = reLoc.exec(smText)) !== null) {
      const u = m[1].trim();
      try {
        const path = decodeURIComponent(new URL(u).pathname);
        if (ABOUT_KEYWORDS.test(path)) urls.push(u);
      } catch { /* skip */ }
    }
    for (const url of urls.slice(0, 5)) {
      const hit = await tryFetchAboutPage(url);
      if (!hit) continue;
      if (!best || hit.text.length > best.text.length) best = hit;
      if (hit.text.length > 2000) return best;
    }
    if (best) break;
  }
  if (best) return best;

  // Strategy 5: One-Pager-Fallback — Homepage selbst nehmen wenn substanziell.
  // (auch ohne Bio-Keywords im Content; viele Personal-Sites packen den Lebenslauf direkt auf /)
  if (homeHtml) {
    const homeText = htmlToText(homeHtml);
    if (homeText.length > 800) {
      best = { url: homepageUrl, text: homeText };
    }
  }

  return best;
}

// ── Groq Call ──

const SYSTEM_PROMPT = `Du extrahierst aus dem Text einer Politiker-Homepage einen strukturierten Lebenslauf in deutschem JSON.

SCHEMA (alle vier Felder Pflicht, leeres Array [] wenn nichts dazu im Text steht):
{
  "ausbildung":            [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "beruflicher_werdegang": [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "politische_stationen":  [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "sonstiges":             [ { "jahr": "<string>", "text": "<string>" }, ... ]
}

ABSOLUT VERBOTEN:
- Erfinden von Universitäten, Abschlüssen, Verlagen, Buchtiteln, Jahreszahlen oder anderen Fakten, die nicht WÖRTLICH im gelieferten Text stehen.
- Übernehmen von Beispiel-Inhalten aus Demo-Schemata. Wenn der Text keine Universität nennt, schreibst du KEINE Universität.
- Buchtitel oder Verlage erfinden. Wenn nicht im Text → "sonstiges": [].

REGELN:
- Nur Fakten aus dem gelieferten Text. Im Zweifel weglassen.
- Chronologisch sortiert (älteste zuerst).
- jahr als String, exakt im Format wie im Text: "YYYY", "YYYY-YYYY", "seit YYYY", "bis YYYY", "YYYY-heute" oder "" wenn keine Jahresangabe vorhanden.
- Bei Ausbildung: NUR die Schule/Uni nennen die im Text steht. Wenn nur "Studium der Jura" steht → text: "Studium der Jura" (ohne Uni).
- Bei Berufen: Position genauso wie im Text. Arbeitgeber nur wenn genannt.
- text präzise (max ~200 Zeichen, ein Satz).
- "sonstiges" ist für Hobbys, Ehrenämter, Auszeichnungen, Veröffentlichungen — NUR wenn im Text genannt.
- Antworte NUR mit dem JSON-Objekt, kein Markdown, keine Erklärung.`;

interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

async function generateCv(name: string, text: string): Promise<{ cv: CV; raw: string } | null> {
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
      return content ? { cv: JSON.parse(content) as CV, raw: content } : null;
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

  const skipExisting = REFRESH ? "" : "AND p.cv_homepage_json IS NULL";

  // Mit --all: ALLE Politiker mit homepage_url (auch ohne Mandat).
  const sql = ALL
    ? `SELECT DISTINCT p.id, p.first_name, p.last_name, p.homepage_url
       FROM politicians p
       WHERE p.homepage_url IS NOT NULL ${skipExisting}`
    : `SELECT DISTINCT p.id, p.first_name, p.last_name, p.homepage_url
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE p.homepage_url IS NOT NULL AND par.type = 'bundestag' ${skipExisting}`;

  let rows = db.prepare(sql).all() as { id: number; first_name: string; last_name: string; homepage_url: string }[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`\n${rows.length} Politiker mit homepage_url zu verarbeiten`);
  if (rows.length === 0) { db.close(); return; }

  const update = db.prepare(
    `UPDATE politicians SET cv_homepage_json = ?, cv_homepage_url = ?, cv_homepage_generated_at = ?,
     cv_homepage_text = ?, cv_homepage_model = ?, cv_homepage_prompt_version = ?,
     cv_homepage_raw_llm_response = ? WHERE id = ?`
  );

  let foundPage = 0, llmOk = 0, llmFail = 0, noPage = 0, done = 0;
  const start = Date.now();

  async function processOne(p: typeof rows[0]) {
    const name = `${p.first_name} ${p.last_name}`;
    try {
      const hit = await findAboutPage(p.homepage_url);
      if (!hit) { noPage++; return; }
      foundPage++;
      const result = await generateCv(name, hit.text);
      if (!result) { llmFail++; return; }
      update.run(
        JSON.stringify(result.cv), hit.url, new Date().toISOString(), hit.text,
        `groq:${MODEL}`, PROMPT_VERSION, result.raw,
        p.id
      );
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
