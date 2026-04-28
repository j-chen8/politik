/**
 * Seed CV aus manuell gepastetem Bio-Text (Stdin).
 *
 * Run:
 *   npx tsx scripts/seed-cv-from-paste.ts --name "Sören Pellmann" --url "https://..." < bio.txt
 *   echo "..." | npx tsx scripts/seed-cv-from-paste.ts --name "..." --url "..."
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

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);

if (GROQ_KEYS.length === 0) { console.error("Keine GROQ_API_KEY* in .env"); process.exit(1); }

let keyIdx = 0;
function nextKey() { return GROQ_KEYS[keyIdx++ % GROQ_KEYS.length]; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

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

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const name = arg("--name");
  const url = arg("--url") ?? "manual_paste";
  if (!name) {
    console.error('Usage: ... --name "Vorname Nachname" [--url "https://..."] < bio.txt');
    process.exit(1);
  }

  const text = fs.readFileSync(0, "utf-8").trim();
  if (text.length < 200) {
    console.error(`Text zu kurz (${text.length} Zeichen, min 200)`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const cols = new Set((db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[]).map(c => c.name));
  if (!cols.has("cv_homepage_text")) db.exec("ALTER TABLE politicians ADD COLUMN cv_homepage_text TEXT");

  const row = db.prepare("SELECT id, cv_homepage_json FROM politicians WHERE first_name || ' ' || last_name = ?").get(name) as any;
  if (!row) { console.error(`Politiker nicht gefunden: ${name}`); process.exit(1); }
  if (row.cv_homepage_json) console.warn(`! ${name} hat bereits cv_homepage_json — wird überschrieben`);

  console.log(`Generiere CV für ${name} (${text.length} Zeichen Text)...`);
  const cv = await generateCv(name, text);
  if (!cv) { console.error("CV-Generierung fehlgeschlagen"); process.exit(1); }

  db.prepare("UPDATE politicians SET cv_homepage_json = ?, cv_homepage_url = ?, cv_homepage_generated_at = ?, cv_homepage_text = ? WHERE id = ?")
    .run(JSON.stringify(cv), url, new Date().toISOString(), text, row.id);

  console.log("✓ Gespeichert. Inhalt:");
  console.log(JSON.stringify(cv, null, 2));
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
