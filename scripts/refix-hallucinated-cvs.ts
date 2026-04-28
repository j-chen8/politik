/**
 * Refix CVs die noch die Suhrkamp/Titel-des-Buches-Halluzination haben.
 * Nutzt die bereits gespeicherte cv_homepage_url, fetcht direkt, speichert Roh-Text + neuen CV.
 *
 * Run: npx tsx scripts/refix-hallucinated-cvs.ts
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

let keyIdx = 0;
const nextKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

async function fetchPage(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": BROWSER_UA, "Accept": "text/html", "Accept-Language": "de-DE,de;q=0.9" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

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
    } catch {
      await sleep(1000);
    }
  }
  return null;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const rows = db.prepare(`
    SELECT p.id, p.first_name || ' ' || p.last_name AS name, p.cv_homepage_url
    FROM politicians p
    JOIN mandates m ON m.politician_id = p.id
    WHERE m.parliament_period_id = 161
      AND (cv_homepage_json LIKE '%Suhrkamp%' OR cv_homepage_json LIKE '%Titel des Buches%')
      AND cv_homepage_url IS NOT NULL
  `).all() as { id: number; name: string; cv_homepage_url: string }[];

  console.log(`${rows.length} Halluzinations-Einträge zu refixen\n`);

  const update = db.prepare(`UPDATE politicians SET cv_homepage_json = ?, cv_homepage_text = ?, cv_homepage_generated_at = ? WHERE id = ?`);
  let ok = 0, fail = 0;

  for (const row of rows) {
    process.stdout.write(`  ${row.name}... `);
    const html = await fetchPage(row.cv_homepage_url);
    if (!html) { console.log("✗ fetch failed"); fail++; continue; }
    const text = htmlToText(html);
    if (text.length < 200) { console.log(`✗ Text zu kurz (${text.length})`); fail++; continue; }
    const cv = await generateCv(row.name, text);
    if (!cv) { console.log("✗ LLM failed"); fail++; continue; }
    update.run(JSON.stringify(cv), text, new Date().toISOString(), row.id);
    console.log(`✓ (${text.length} Z.)`);
    ok++;
    await sleep(500);
  }

  console.log(`\n=== Fertig: ${ok} ok, ${fail} fail ===`);
  db.close();
}

main().catch(console.error);
