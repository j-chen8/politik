/**
 * Extract speeches from Bundestag XML Plenarprotokolle
 * Then summarize with Gemini or Groq
 *
 * Provider selection via PROVIDER env var:
 *   PROVIDER=groq  → Groq API (llama-3.3-70b-versatile), 30 RPM / 1K RPD per key
 *   PROVIDER=gemini → Gemini API (default), 15 RPM / 500 RPD per key
 *
 * Rate Limits:
 *   Gemini Free Tier (pro Key): 15 RPM | 500 RPD | 250k TPM
 *   Groq Free Tier (pro Key):   30 RPM | 1K RPD  | 12k TPM
 * → Nur 1 Prozess gleichzeitig laufen lassen! Siehe batch-summarize.ts
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Load .env file
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_0-9]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

// ── Provider Config ──

const PROVIDER = (process.env.PROVIDER || "groq").toLowerCase();

interface ProviderConfig {
  keys: string[];
  model: string;
  baseUrl: string;
  buildRequest: (prompt: string, key: string) => { url: string; options: RequestInit };
  parseResponse: (data: any) => string;
  sleepMs: number;
}

function getProviderConfig(): ProviderConfig {
  if (PROVIDER === "gemini") {
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter(Boolean) as string[];

    return {
      keys,
      model: "gemini-3.1-flash-lite-preview",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
      buildRequest: (prompt, key) => ({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${key}`,
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 1024 },
          }),
        },
      }),
      parseResponse: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text,
      sleepMs: 2500,
    };
  }

  // Groq (default) — collect all GROQ_API_KEY* env vars
  const keys = Object.entries(process.env)
    .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
    .map(([, v]) => v as string);

  // Model override: GROQ_MODEL env var (default: llama-3.3-70b-versatile)
  // Options: llama-3.3-70b-versatile (100K TPD), meta-llama/llama-4-scout-17b-16e-instruct (500K TPD)
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  return {
    keys,
    model: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
    buildRequest: (prompt, key) => ({
      url: "https://api.groq.com/openai/v1/chat/completions",
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      },
    }),
    parseResponse: (data) => data.choices?.[0]?.message?.content,
    sleepMs: 2200, // 30 RPM = 2s between requests, add buffer
  };
}

const config = getProviderConfig();
let API_KEYS = config.keys;
let keyIndex = 0;

function getKey() { const k = API_KEYS[keyIndex]; keyIndex = (keyIndex + 1) % API_KEYS.length; return k; }

// Remove dead keys on startup
async function filterWorkingKeys() {
  if (PROVIDER === "groq") {
    // Groq: test with a simple request
    const working: string[] = [];
    for (const key of API_KEYS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
          body: JSON.stringify({ model: groqModel, messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        });
        if (res.status === 200 || res.status === 201) { working.push(key); }
        else { console.log(`  Key ${key.substring(0, 8)}... ist tot (${res.status}), wird übersprungen`); }
      } catch { console.log(`  Key ${key.substring(0, 8)}... nicht erreichbar, wird übersprungen`); }
    }
    if (working.length === 0) { console.log("FEHLER: Keine funktionierenden API-Keys!"); process.exit(1); }
    API_KEYS = working;
    console.log(`  ${working.length} funktionierende Groq Keys (${groqModel})\n`);
    return;
  }

  // Gemini
  const working: string[] = [];
  for (const key of API_KEYS) {
    try {
      const res = await fetch(`${config.baseUrl}/${config.model}:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }], generationConfig: { maxOutputTokens: 5 } }),
      });
      if (res.status === 200) { working.push(key); }
      else { console.log(`  Key ${key.substring(0, 8)}... ist tot (${res.status}), wird übersprungen`); }
    } catch { console.log(`  Key ${key.substring(0, 8)}... nicht erreichbar, wird übersprungen`); }
  }
  if (working.length === 0) { console.log("FEHLER: Keine funktionierenden API-Keys!"); process.exit(1); }
  API_KEYS = working;
  console.log(`  ${working.length} funktionierende Gemini Keys (${config.model})\n`);
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── XML Speech Extraction (no library needed, simple regex) ──

interface XmlSpeech {
  redeId: string;
  rednerId: string;
  vorname: string;
  nachname: string;
  partei: string | null;
  rolle: string | null;
  text: string; // full speech text
  sitzung: number;
  datum: string;
}

function extractSpeechesForSpeaker(xmlPath: string, lastName: string, fullName?: string): XmlSpeech[] {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const speeches: XmlSpeech[] = [];

  // Get session info
  const sitzungMatch = xml.match(/sitzung-nr="(\d+)"/);
  const datumMatch = xml.match(/sitzung-datum="([^"]+)"/);
  const sitzung = sitzungMatch ? parseInt(sitzungMatch[1]) : 0;
  const datumRaw = datumMatch ? datumMatch[1] : "";
  // Convert "25.02.2026" to "2026-02-25"
  const datumParts = datumRaw.split(".");
  const datum = datumParts.length === 3 ? `${datumParts[2]}-${datumParts[1]}-${datumParts[0]}` : "";

  // Find all <rede> blocks
  const redeRegex = /<rede id="([^"]+)">([\s\S]*?)<\/rede>/g;
  let match;

  while ((match = redeRegex.exec(xml)) !== null) {
    const redeId = match[1];
    const redeContent = match[2];

    // Check if this speech is by our speaker
    if (!redeContent.includes(lastName)) continue;

    // Extract redner info from the first <redner> tag in this rede
    const rednerMatch = redeContent.match(
      /<redner id="(\d+)"><name>(?:<titel>([^<]*)<\/titel>)?<vorname>([^<]+)<\/vorname><nachname>([^<]+)<\/nachname>(?:<fraktion>([^<]+)<\/fraktion>)?(?:<rolle><rolle_lang>([^<]+)<\/rolle_lang>)?/
    );

    if (!rednerMatch || rednerMatch[4] !== lastName) continue;

    const rednerId = rednerMatch[1];
    const titel = rednerMatch[2] || "";
    const vorname = rednerMatch[3];
    const nachname = rednerMatch[4];

    // If fullName provided, also check vorname to disambiguate duplicate last names
    if (fullName) {
      const constructedName = titel ? `${titel} ${vorname} ${nachname}` : `${vorname} ${nachname}`;
      if (constructedName !== fullName) continue;
    }
    const partei = rednerMatch[5] || null;
    const rolle = rednerMatch[6] || null;

    // Extract speech text: all <p> elements, strip tags
    const paragraphs: string[] = [];
    const pRegex = /<p klasse="[^"]*">([\s\S]*?)<\/p>/g;
    let pMatch;
    while ((pMatch = pRegex.exec(redeContent)) !== null) {
      const text = pMatch[1]
        .replace(/<[^>]+>/g, "") // strip HTML tags
        .replace(/\s+/g, " ")
        .trim();
      if (text && !text.startsWith("(Beifall") && !text.startsWith("(Zuruf")) {
        paragraphs.push(text);
      }
    }

    // Also get Kommentare (Beifall, Zwischenrufe) for context
    const kommentare: string[] = [];
    const komRegex = /<kommentar>([\s\S]*?)<\/kommentar>/g;
    let kMatch;
    while ((kMatch = komRegex.exec(redeContent)) !== null) {
      kommentare.push(kMatch[1].replace(/<[^>]+>/g, "").trim());
    }

    const fullText = paragraphs.join("\n");

    if (fullText.length > 50) {
      speeches.push({
        redeId,
        rednerId,
        vorname: titel ? `${titel} ${vorname}` : vorname,
        nachname,
        partei,
        rolle,
        text: fullText.substring(0, 4000), // Cap for API
        sitzung,
        datum,
      });
    }
  }

  return speeches;
}

// ── Summarize (provider-agnostic) ──

async function summarize(speechText: string, sitzung: number, datum: string, speakerName: string, retries = 2): Promise<any> {
  const key = getKey();

  const prompt = `Analysiere den folgenden Redebeitrag von ${speakerName} im Deutschen Bundestag.

Gib EXAKT dieses JSON zurück:
{
  "zusammenfassung": "<2-3 Sätze: Was sagt oder fordert ${speakerName} konkret? Welche Position vertritt er/sie?>",
  "kontext": "<Thema in 3-8 Wörtern, z.B. 'Unterstützung der Ukraine' oder 'Rückführungsabkommen'>",
  "typ": "<debatte|fragestunde_frage|fragestunde_antwort|regierungserklaerung|zwischenfrage|kurzintervention|erklaerung>"
}

REGELN:
- Zusammenfassung beschreibt NUR was ${speakerName} SELBST sagt, meint oder fordert
- NIEMALS Meta-Beschreibungen ("Das Dokument enthält...", "Der Text listet auf...")
- Kontext ist NUR das Thema, kein ganzer Satz
- Für Laien verständlich

Sitzung ${sitzung} | Datum: ${datum}

---REDE---

${speechText}`;

  const { url, options } = config.buildRequest(prompt, key);

  try {
    const res = await fetch(url, options);
    if (res.status === 429) {
      // Remove this dead key from rotation
      if (API_KEYS.length > 1) {
        API_KEYS = API_KEYS.filter(k => k !== key);
        console.log(`  Key ${key.substring(0, 8)}... entfernt, ${API_KEYS.length} Keys übrig`);
        keyIndex = keyIndex % API_KEYS.length;
        return summarize(speechText, sitzung, datum, speakerName, retries);
      }
      if (retries > 0) { console.log("  rate limited, waiting..."); await sleep(15000); return summarize(speechText, sitzung, datum, speakerName, retries - 1); }
      throw new Error("Rate limited");
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    const content = config.parseResponse(data);
    if (!content) throw new Error("Empty");
    return JSON.parse(content);
  } catch (e: any) {
    if (retries > 0) { await sleep(3000); return summarize(speechText, sitzung, datum, speakerName, retries - 1); }
    throw e;
  }
}

// ── Main ──

async function main() {
  const speakerLastName = process.argv[2]; // e.g. "Wadephul"
  const speakerFullName = process.argv[3]; // e.g. "Dr. Johann David Wadephul"

  if (!speakerLastName || !speakerFullName) {
    console.log("Usage: npx tsx extract-speeches-xml.ts <Nachname> '<Voller Name>'");
    process.exit(1);
  }

  console.log(`Provider: ${PROVIDER.toUpperCase()}`);
  if (process.env.SKIP_HEALTHCHECK === "1") {
    console.log(`  ${API_KEYS.length} Keys (Health-Check übersprungen)\n`);
  } else {
    await filterWorkingKeys();
  }

  const xmlDir = "data/plenarprotokolle_xml";
  const xmlFiles = fs.readdirSync(xmlDir).filter((f: string) => f.endsWith(".xml")).sort();

  console.log(`=== XML Speech Extraction: ${speakerFullName} ===`);
  console.log(`Scanning ${xmlFiles.length} XMLs...\n`);

  // Extract all speeches
  const allSpeeches: XmlSpeech[] = [];
  for (const file of xmlFiles) {
    const speeches = extractSpeechesForSpeaker(path.join(xmlDir, file), speakerLastName, speakerFullName);
    if (speeches.length > 0) {
      console.log(`  Sitzung ${speeches[0].sitzung}: ${speeches.length} Reden`);
      allSpeeches.push(...speeches);
    }
  }

  console.log(`\nGefunden: ${allSpeeches.length} Reden in ${new Set(allSpeeches.map(s => s.sitzung)).size} Sitzungen`);

  if (allSpeeches.length === 0) return;

  // DB setup
  const db = new Database("politik.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS speech_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      speaker TEXT NOT NULL, sitzung INTEGER NOT NULL, datum TEXT,
      speech_index INTEGER DEFAULT 0, speech_text_preview TEXT,
      zusammenfassung TEXT, kontext TEXT, typ TEXT, source_url TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_speech_summaries_speaker ON speech_summaries(speaker);
  `);

  // Check which sessions already have summaries (skip them)
  const existingSessions = new Set(
    (db.prepare("SELECT DISTINCT sitzung FROM speech_summaries WHERE speaker = ?").all(speakerFullName) as any[])
      .map((r: any) => r.sitzung)
  );

  const insert = db.prepare(`
    INSERT INTO speech_summaries (speaker, sitzung, datum, speech_index, speech_text_preview, zusammenfassung, kontext, typ, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Group by session for Fragestunde detection
  const bySession = new Map<number, XmlSpeech[]>();
  for (const s of allSpeeches) {
    if (!bySession.has(s.sitzung)) bySession.set(s.sitzung, []);
    bySession.get(s.sitzung)!.push(s);
  }

  let totalSummaries = 0;
  let skipped = 0;

  for (const [sitzung, speeches] of [...bySession.entries()].sort((a, b) => a[0] - b[0])) {
    const padded = String(sitzung).padStart(3, "0");
    const sourceUrl = `https://dserver.bundestag.de/btp/21/21${padded}.pdf`;
    const datum = speeches[0].datum;

    // Skip sessions we already have
    if (existingSessions.has(sitzung)) {
      skipped++;
      continue;
    }

    process.stdout.write(`  Sitzung ${sitzung} (${datum}): ${speeches.length} Reden... `);

    // Fragestunde: > 10 speeches in one session
    if (speeches.length > 10) {
      insert.run(speakerFullName, sitzung, datum, 0,
        speeches[0].text.substring(0, 200),
        `Befragung der Bundesregierung / Fragestunde mit ${speeches.length} Beiträgen.`,
        "Regierungsbefragung / Fragestunde",
        "fragestunde_antwort", sourceUrl);
      console.log("Fragestunde → 1 Zusammenfassung");
      totalSummaries++;
      continue;
    }

    // Regular: summarize each speech
    let count = 0;
    for (let idx = 0; idx < speeches.length; idx++) {
      const speech = speeches[idx];
      try {
        const summary = await summarize(speech.text, sitzung, datum, speakerFullName);
        insert.run(speakerFullName, sitzung, datum, idx,
          speech.text.substring(0, 200),
          summary.zusammenfassung, summary.kontext, summary.typ || "debatte",
          sourceUrl);
        count++;
        totalSummaries++;
        await sleep(config.sleepMs);
      } catch (e: any) {
        console.log(`ERROR: ${e.message.substring(0, 50)}`);
      }
    }
    console.log(`${count} Zusammenfassungen`);
  }

  console.log(`\n=== Fertig: ${totalSummaries} neue Zusammenfassungen${skipped > 0 ? ` (${skipped} Sitzungen übersprungen)` : ""} ===`);
  db.close();
}

main().catch(console.error);
