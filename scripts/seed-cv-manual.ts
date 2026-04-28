/**
 * Gezielter CV-Scraper für manuell gefundene Bio-URLs.
 * Für die 46 MdBs die beim automatischen Scraping durchgefallen sind.
 *
 * Run: npx tsx scripts/seed-cv-manual.ts
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

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);

if (GROQ_KEYS.length === 0) { console.error("Keine GROQ_API_KEY* in .env"); process.exit(1); }
console.log(`${GROQ_KEYS.length} Groq-Key(s) verfügbar`);

let keyIdx = 0;
function nextKey() { return GROQ_KEYS[keyIdx++ % GROQ_KEYS.length]; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Manuell gefundene Bio-URLs ──

interface ManualEntry {
  name: string;           // Voller Name zum DB-Match
  urls: string[];         // Bio-URLs zum Scrapen
  useHomepage?: boolean;  // Homepage selbst enthält Bio
  wikipediaFallback?: boolean; // Kein Homepage-CV möglich, Wikipedia nutzen
  skip?: boolean;         // Komplett überspringen (z.B. verstorben)
  note?: string;
}

const MANUAL_ENTRIES: ManualEntry[] = [
  // Spezifische Bio-URLs
  { name: "Franziska Brantner", urls: ["https://franziska-brantner.de/ueber-mich/"] },
  { name: "Clara Bünger", urls: ["https://clarabuenger.de/%C3%BCber-mich"] },
  { name: "Tino Chrupalla", urls: ["https://tinochrupalla.de/uber-mich/"] },
  { name: "Jeanne Dillschneider", urls: ["https://jeanne-dillschneider.de/eine-starke-stimme-fuer-das-saarland-und-saarbruecken-in-berlin/"] },
  { name: "Hansjörg Durz", urls: ["https://www.hansjoerg-durz.de/%C3%BCber-mich"] },
  { name: "Hülya Düber", urls: ["https://huelyadueber.de/ueber-mich/"] },
  { name: "Wiebke Esdar", urls: ["https://www.wiebke-esdar.de/das-bin-ich"] },
  { name: "Markus Frohnmaier", urls: ["https://www.markusfrohnmaier.de/ueber-mich/"] },
  { name: "Mark Helfrich", urls: ["https://mark-helfrich.de/ueber-mich2/"] },
  { name: "Philip Hoffmann", urls: ["https://philip-hoffmann.de/uber-mich/"] },
  { name: "Lamya Kaddor", urls: ["https://www.lamya-kaddor.de/%C3%BCber-mich"] },
  { name: "Karl Lauterbach", urls: ["https://karllauterbach.de/prof_karl_lauterbach/"] },
  { name: "Katja Mast", urls: ["https://www.katja-mast.de/de/topic/4777.%C3%BCber-mich.html"] },
  { name: "Volker Mayer-Lay", urls: ["https://mayerlay.live-website.com/portfolio-item/privat-und-beruf/", "https://mayerlay.live-website.com/portfolio-item/politik/"] },
  { name: "Jan Metzler", urls: ["https://www.janmetzler.de/pers%C3%B6nliches/%C3%BCber-mich/"] },
  { name: "Matthias Moosdorf", urls: ["https://matthiasmoosdorf.de/ueber"] },
  { name: "Sören Pellmann", urls: ["https://www.soeren-pellmann.de/ueber-mich/ueber-mich/"] },
  { name: "Stephan Pilsinger", urls: ["https://stephan-pilsinger.de/stephan-pilsinger"] },
  { name: "Thomas Rachel", urls: ["https://www.thomas-rachel.de/ueber-uns/"] },
  { name: "Sebastian Roloff", urls: ["https://www.roloff-direkt.de/persoenlich/"] },
  { name: "Andreas Schwarz", urls: ["https://spd-schwarz.de/persoenlich/"] },
  { name: "Jamila Anna Schäfer", urls: ["https://jamila-schaefer.de/ueber-jamila/"] },
  { name: "Awet Tesfaiesus", urls: ["https://awet-tesfaiesus.de/ueber-awet/"] },
  { name: "Alexander Throm", urls: ["https://www.alexander-throm.de/Persoenlich_p_61.html"] },
  { name: "Nina Warken", urls: ["https://nina-warken.de/uber-mich/"] },
  { name: "Dirk Wiese", urls: ["https://www.dirkwiese.de/persoenlich/"] },
  { name: "Janine Wissler", urls: ["https://www.janine-wissler.de/de/topic/2.wer-ich-bin.html"] },
  { name: "Paul Ziemiak", urls: ["https://www.paul-ziemiak.de/persoenlich/"] },
  { name: "Beatrix von Storch", urls: ["https://beatrixvonstorch.de/beatrix-von-storch/"] },

  // Homepage selbst enthält Bio
  { name: "Dorothee Bär", urls: ["https://dorothee-baer.de/"], useHomepage: true },
  { name: "Friedrich Merz", urls: ["https://www.friedrich-merz.de/"], useHomepage: true },
  { name: "Stephan Protschka", urls: ["https://www.stephan-protschka.de/"], useHomepage: true },
  { name: "Hendrik Streeck", urls: ["https://hendrikstreeck.de/"], useHomepage: true },
  { name: "Jan van Aken", urls: ["https://jan-van-aken.com/"], useHomepage: true },
  { name: "Christian von Stetten", urls: ["https://www.christian-stetten.de/"], useHomepage: true },

  // Wikipedia-Fallback (Homepage nicht brauchbar)
  { name: "Bernd Baumann", urls: [], wikipediaFallback: true },
  { name: "Birgit Bessin", urls: [], wikipediaFallback: true },
  { name: "Steffen Kotré", urls: [], wikipediaFallback: true },
  { name: "Maximilian Krah", urls: [], wikipediaFallback: true, note: "Homepage in Wartung" },
  { name: "Holger Mann", urls: [], wikipediaFallback: true },
  { name: "Stephan Mayer", urls: [], wikipediaFallback: true, note: "Homepage im Umbau" },
  { name: "Frank Schwabe", urls: [], wikipediaFallback: true, note: "Homepage im Wartungsmodus" },
  { name: "Boris Pistorius", urls: [], wikipediaFallback: true, note: "Homepage down" },
  { name: "Emmi Zeulner", urls: [], wikipediaFallback: true },

  // Überspringen
  { name: "Carsten Träger", urls: [], skip: true, note: "Verstorben" },
];

// ── HTML → Plain Text ──

function htmlToText(html: string): string {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
  t = t.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  t = t.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  t = t.replace(/<[^>]+>/g, " ");
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// ── Fetch ──

async function fetchPage(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": BROWSER_UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "de-DE,de;q=0.9" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

// ── Wikipedia ──

async function fetchWikipediaText(name: string, db: Database.Database): Promise<string | null> {
  const row = db.prepare("SELECT bio_url FROM politicians WHERE (first_name || ' ' || last_name) = ?").get(name) as { bio_url: string } | undefined;
  if (!row?.bio_url) return null;
  const m = row.bio_url.match(/\/wiki\/([^?#]+)/);
  if (!m) return null;
  const title = decodeURIComponent(m[1]).replace(/_/g, " ");
  const url = `https://de.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": "politik-radar/1.0" } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const pages = data?.query?.pages ?? {};
  const first = Object.values<any>(pages)[0];
  // Aggressiver trim: 8000 statt 25000 Zeichen für das 8b-Modell
  return first?.extract?.slice(0, 8000) ?? null;
}

// ── Groq LLM ──

const SYSTEM_PROMPT = `Du extrahierst aus dem Text einer Politiker-Webseite einen strukturierten Lebenslauf in deutschem JSON.

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

async function generateCv(name: string, text: string): Promise<any | null> {
  const trimmed = text.slice(0, 8000);
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
            { role: "user", content: `Politiker: ${name}\n\nText:\n${trimmed}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });
      if (res.status === 429) { await sleep(2000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      return content ? JSON.parse(content) : null;
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

  // Ensure columns exist
  const cols = new Set((db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[]).map(c => c.name));
  if (!cols.has("cv_homepage_json")) db.exec("ALTER TABLE politicians ADD COLUMN cv_homepage_json TEXT");
  if (!cols.has("cv_homepage_url")) db.exec("ALTER TABLE politicians ADD COLUMN cv_homepage_url TEXT");
  if (!cols.has("cv_homepage_generated_at")) db.exec("ALTER TABLE politicians ADD COLUMN cv_homepage_generated_at TEXT");
  if (!cols.has("cv_homepage_text")) db.exec("ALTER TABLE politicians ADD COLUMN cv_homepage_text TEXT");

  const updateHomepage = db.prepare("UPDATE politicians SET cv_homepage_json = ?, cv_homepage_url = ?, cv_homepage_generated_at = ?, cv_homepage_text = ? WHERE first_name || ' ' || last_name = ?");
  const updateWiki = db.prepare("UPDATE politicians SET cv_json = ?, cv_source = 'wikipedia_de+groq:llama-3.1-8b-instant', cv_generated_at = ? WHERE first_name || ' ' || last_name = ?");

  let ok = 0, fail = 0, skipped = 0;

  for (const entry of MANUAL_ENTRIES) {
    if (entry.skip) {
      console.log(`  SKIP ${entry.name} (${entry.note})`);
      skipped++;
      continue;
    }

    // Check if already has CV
    const existing = db.prepare("SELECT cv_json, cv_homepage_json FROM politicians WHERE first_name || ' ' || last_name = ?").get(entry.name) as any;
    if (existing?.cv_json || existing?.cv_homepage_json) {
      console.log(`  SKIP ${entry.name} (bereits CV vorhanden)`);
      skipped++;
      continue;
    }

    if (entry.wikipediaFallback) {
      // Wikipedia path
      console.log(`  WIKI ${entry.name}...`);
      try {
        const wpText = await fetchWikipediaText(entry.name, db);
        if (!wpText || wpText.length < 200) {
          console.log(`    ✗ Wikipedia-Text zu kurz oder nicht gefunden`);
          fail++;
          continue;
        }
        const cv = await generateCv(entry.name, wpText);
        if (!cv) { fail++; continue; }
        updateWiki.run(JSON.stringify(cv), new Date().toISOString(), entry.name);
        console.log(`    ✓`);
        ok++;
      } catch (e: any) {
        console.log(`    ✗ ${e.message?.slice(0, 80)}`);
        fail++;
      }
      await sleep(300);
      continue;
    }

    // Homepage path
    console.log(`  WEB  ${entry.name}...`);
    try {
      let allText = "";
      let sourceUrl = "";
      for (const url of entry.urls) {
        const html = await fetchPage(url);
        if (!html) { console.log(`    ✗ Fetch fehlgeschlagen: ${url}`); continue; }
        const text = htmlToText(html);
        if (text.length > 200) {
          allText += (allText ? "\n\n" : "") + text;
          if (!sourceUrl) sourceUrl = url;
        }
        await sleep(500);
      }
      if (allText.length < 200) {
        console.log(`    ✗ Nicht genug Text gefunden`);
        fail++;
        continue;
      }
      const cv = await generateCv(entry.name, allText);
      if (!cv) { fail++; continue; }
      updateHomepage.run(JSON.stringify(cv), sourceUrl, new Date().toISOString(), allText, entry.name);
      console.log(`    ✓ (${sourceUrl})`);
      ok++;
    } catch (e: any) {
      console.log(`    ✗ ${e.message?.slice(0, 80)}`);
      fail++;
    }
    await sleep(300);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Fehler:      ${fail}`);
  console.log(`  Übersprungen: ${skipped}`);

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
