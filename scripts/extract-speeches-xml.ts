/**
 * Extract speeches from Bundestag XML Plenarprotokolle
 * Then summarize with Gemini or Groq
 *
 * Provider selection via PROVIDER env var:
 *   PROVIDER=groq  → Groq API, 30 RPM / 1K RPD per key
 *   PROVIDER=gemini → Gemini API, 15 RPM / 500 RPD per key
 *
 * Groq Model Fallback Chain:
 *   1. llama-3.3-70b-versatile  (12K TPM) — beste Qualität
 *   2. meta-llama/llama-4-scout-17b-16e-instruct (30K TPM) — Fallback bei Rate Limit
 *   Bei 429 auf allen Keys → nächstes Modell in der Kette
 *
 * Rate Limits:
 *   Gemini Free Tier (pro Key): 15 RPM | 500 RPD | 250k TPM
 *   Groq Free Tier (pro Key):   30 RPM | 1K RPD  | 12k TPM / 30k TPM (Scout)
 * → Nur 1 Prozess gleichzeitig laufen lassen! Siehe batch-summarize.ts
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Load .env file
const envPath = path.join(__dirname, "..", "env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_0-9]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

// ── Provider Config ──

const PROVIDER = (process.env.PROVIDER || "groq").toLowerCase();

// Groq model fallback chain: best quality first, then higher TPM fallback
const GROQ_MODEL_CHAIN = [
  "llama-3.3-70b-versatile",                      // 12K TPM, 100K TPD, beste Qualität
  "meta-llama/llama-4-scout-17b-16e-instruct",    // 30K TPM, 500K TPD, Fallback
];

// Persistent model state file — survives across batch-summarize subprocess calls
const MODEL_STATE_FILE = path.join(__dirname, "..", ".groq-model-state");

interface ModelState {
  modelIndex: number;
  reason: "tpd" | "tpm" | null;  // why we switched
  timestamp: string;
}

function readModelState(): ModelState {
  try {
    if (fs.existsSync(MODEL_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(MODEL_STATE_FILE, "utf-8"));
    }
  } catch {}
  return { modelIndex: 0, reason: null, timestamp: "" };
}

function writeModelState(state: ModelState) {
  fs.writeFileSync(MODEL_STATE_FILE, JSON.stringify(state));
}

// Load persisted state — if TPD was hit, stay on fallback model
const persistedState = readModelState();
let groqModelIndex = persistedState.modelIndex;
let currentGroqModel = GROQ_MODEL_CHAIN[groqModelIndex] || GROQ_MODEL_CHAIN[0];

if (persistedState.reason === "tpd" && groqModelIndex > 0) {
  console.log(`  ⚠ TPD-Limit wurde erreicht (${persistedState.timestamp}) → starte direkt mit ${currentGroqModel}`);
}

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

  return {
    keys,
    model: currentGroqModel,
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
          model: currentGroqModel,
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
let ALL_KEYS: string[] = [...config.keys]; // Original keys backup for model fallback
let API_KEYS = config.keys;
let keyIndex = 0;

function getKey() { const k = API_KEYS[keyIndex]; keyIndex = (keyIndex + 1) % API_KEYS.length; return k; }

/** Switch to next model in the fallback chain. Returns true if switched, false if no more models. */
function switchToNextModel(reason: "tpd" | "tpm"): boolean {
  groqModelIndex++;
  if (groqModelIndex >= GROQ_MODEL_CHAIN.length) return false;
  const prevModel = currentGroqModel;
  currentGroqModel = GROQ_MODEL_CHAIN[groqModelIndex];
  API_KEYS = [...ALL_KEYS]; // Restore all keys — new model has fresh rate limits
  keyIndex = 0;

  const label = reason === "tpd" ? "TPD (Tageslimit)" : "TPM (Minutenlimit)";
  console.log(`\n  ⟳ Modell-Wechsel: ${prevModel} → ${currentGroqModel} [${label}]`);
  console.log(`    (alle ${API_KEYS.length} Keys wiederhergestellt)\n`);

  // Persist state — TPD means "stay on fallback for entire batch"
  if (reason === "tpd") {
    writeModelState({ modelIndex: groqModelIndex, reason: "tpd", timestamp: new Date().toISOString() });
    console.log(`    State persistiert → alle weiteren Redner starten direkt mit ${currentGroqModel}\n`);
  }

  return true;
}

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
          body: JSON.stringify({ model: currentGroqModel, messages: [{ role: "user", content: "hi" }], max_tokens: 5 }),
        });
        if (res.status === 200 || res.status === 201) { working.push(key); }
        else { console.log(`  Key ${key.substring(0, 8)}... ist tot (${res.status}), wird übersprungen`); }
      } catch { console.log(`  Key ${key.substring(0, 8)}... nicht erreichbar, wird übersprungen`); }
    }
    if (working.length === 0) { console.log("FEHLER: Keine funktionierenden API-Keys!"); process.exit(1); }
    API_KEYS = working;
    console.log(`  ${working.length} funktionierende Groq Keys (${currentGroqModel})\n`);
    console.log(`  Modell-Kette: ${GROQ_MODEL_CHAIN.join(" → ")}\n`);
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

// ── Name Normalization ──
// Handles: location suffixes "(Braunschweig)", prefixes "von/van/de/dos",
// hyphen variants, special chars, and known typos/aliases

// Map from plenar_speeches speaker name → { lastName, fullName } for XML matching
// Entries here override the default "split by space, last word = lastName" logic
const NAME_OVERRIDES: Record<string, { lastName: string; fullName: string }> = {
  // Location suffixes — XML has no suffix
  "Carsten Müller (Braunschweig)": { lastName: "Müller", fullName: "Carsten Müller" },
  "Dagmar Schmidt (Wetzlar)": { lastName: "Schmidt", fullName: "Dagmar Schmidt" },
  "Hubertus Heil (Peine)": { lastName: "Heil", fullName: "Hubertus Heil" },
  "Claudia Roth (Augsburg)": { lastName: "Roth", fullName: "Claudia Roth" },
  "Michael Brand (Fulda)": { lastName: "Brand", fullName: "Michael Brand" },
  "Mahmut Özdemir (Duisburg)": { lastName: "Özdemir", fullName: "Mahmut Özdemir" },
  "Stephan Mayer (Altötting)": { lastName: "Mayer", fullName: "Stephan Mayer" },

  // Nobility prefixes "von", "van", "de", "dos" — lastName in XML is just the last word
  "Beatrix von Storch": { lastName: "Storch", fullName: "Beatrix von Storch" },
  "Dr. Konstantin von Notz": { lastName: "Notz", fullName: "Dr. Konstantin von Notz" },
  "Ulrich von Zons": { lastName: "Zons", fullName: "Ulrich von Zons" },
  "Jan van Aken": { lastName: "Aken", fullName: "Jan van Aken" },
  "Sascha van Beek": { lastName: "Beek", fullName: "Sascha van Beek" },
  "Christoph de Vries": { lastName: "Vries", fullName: "Christoph de Vries" },
  "Catarina dos Santos-Wintz": { lastName: "Santos-Wintz", fullName: "Catarina dos Santos-Wintz" },

  // Hyphen / spacing variants
  "Reem Alabali Radovan": { lastName: "Alabali-Radovan", fullName: "Reem Alabali-Radovan" },
  "LisaSimone Fischer": { lastName: "Fischer", fullName: "Lisa-Simone Fischer" },

  // Special characters (ğ etc.)
  "Aydan Özoğuz": { lastName: "Özoğuz", fullName: "Aydan Özoğuz" },
  "Cansu Özdemir": { lastName: "Özdemir", fullName: "Cansu Özdemir" },
  "Mahmut Özdemir": { lastName: "Özdemir", fullName: "Mahmut Özdemir" },
  "Kassem Taher Saleh": { lastName: "Taher Saleh", fullName: "Kassem Taher Saleh" },

  // Typos in plenar_speeches data
  "Maximilain Kneller": { lastName: "Kneller", fullName: "Maximilian Kneller" },

  // Multi-word last names
  "Mareike Lotte Wulf": { lastName: "Wulf", fullName: "Mareike Lotte Wulf" },
  "Sara Gambir": { lastName: "Gambir", fullName: "Sara Gambir" },

  // Foreign speakers / special cases
  "Andrew Mitchell": { lastName: "Mitchell", fullName: "Andrew Mitchell" },
};

function resolveNameForXml(speakerName: string): { lastName: string; fullName: string } {
  // Check overrides first
  if (NAME_OVERRIDES[speakerName]) return NAME_OVERRIDES[speakerName];

  // Default: last word is lastName
  const parts = speakerName.split(" ");
  const lastName = parts[parts.length - 1];
  return { lastName, fullName: speakerName };
}

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

    // Check if this speech is by our speaker (quick pre-filter)
    if (!redeContent.includes(lastName)) continue;

    // Extract redner info from the first <redner> tag in this rede
    const rednerMatch = redeContent.match(
      /<redner id="(\d+)"><name>(?:<titel>([^<]*)<\/titel>)?<vorname>([^<]+)<\/vorname><nachname>([^<]+)<\/nachname>(?:<fraktion>([^<]+)<\/fraktion>)?(?:<rolle><rolle_lang>([^<]+)<\/rolle_lang>)?/
    );

    if (!rednerMatch) continue;

    const xmlNachname = rednerMatch[4];

    // Flexible lastName matching: exact match, or lastName contained in xmlNachname, or vice versa
    const lastNameMatch = xmlNachname === lastName
      || xmlNachname.includes(lastName)
      || lastName.includes(xmlNachname);
    if (!lastNameMatch) continue;

    const rednerId = rednerMatch[1];
    const titel = rednerMatch[2] || "";
    const vorname = rednerMatch[3];
    const nachname = xmlNachname;

    // If fullName provided, check with flexible matching
    if (fullName) {
      const constructedName = titel ? `${titel} ${vorname} ${nachname}` : `${vorname} ${nachname}`;
      // Exact match, or constructed name contained in fullName, or fullName contained in constructed
      const nameMatch = constructedName === fullName
        || fullName.includes(vorname) && fullName.includes(nachname)
        || constructedName.includes(fullName.replace(/\s*\(.*?\)\s*/g, "").trim());
      if (!nameMatch) continue;
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
      // Detect if this is a TPD (daily) or TPM (minute) limit from headers
      // Groq returns headers like: x-ratelimit-remaining-tokens, x-ratelimit-limit-tokens
      // and the error body may contain "tokens_per_day" or "tokens_per_minute"
      let isTPD = false;
      try {
        const errorBody = await res.text();
        isTPD = errorBody.includes("token") && errorBody.includes("day") || errorBody.includes("TPD");
        if (isTPD) {
          console.log(`  ⚠ TPD-Limit erreicht für ${currentGroqModel} (Key ${key.substring(0, 8)}...)`);
        }
      } catch {}

      if (isTPD && PROVIDER === "groq") {
        // TPD hit → switch model persistently, don't bother trying other keys on same model
        if (switchToNextModel("tpd")) {
          return summarize(speechText, sitzung, datum, speakerName, retries);
        }
      }

      // TPM or unknown — remove this key from rotation
      if (API_KEYS.length > 1) {
        API_KEYS = API_KEYS.filter(k => k !== key);
        console.log(`  Key ${key.substring(0, 8)}... entfernt (${currentGroqModel}), ${API_KEYS.length} Keys übrig`);
        keyIndex = keyIndex % API_KEYS.length;
        return summarize(speechText, sitzung, datum, speakerName, retries);
      }
      // All keys exhausted on current model → try next model in chain
      if (PROVIDER === "groq" && switchToNextModel("tpm")) {
        return summarize(speechText, sitzung, datum, speakerName, retries);
      }
      // No more models — wait and retry
      if (retries > 0) { console.log("  Alle Modelle rate-limited, warte..."); await sleep(15000); return summarize(speechText, sitzung, datum, speakerName, retries - 1); }
      throw new Error("Rate limited on all models");
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
  // ORIGINAL_SPEAKER: the name as it appears in plenar_speeches (for DB storage)
  // Falls back to speakerFullName if not set
  const originalSpeaker = process.env.ORIGINAL_SPEAKER || speakerFullName;

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
  ALL_KEYS = [...API_KEYS]; // Backup working keys for model fallback

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
  // Check both original name and XML name to avoid duplicates
  const existingSessions = new Set(
    (db.prepare("SELECT DISTINCT sitzung FROM speech_summaries WHERE speaker = ? OR speaker = ?").all(originalSpeaker, speakerFullName) as any[])
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
      insert.run(originalSpeaker, sitzung, datum, 0,
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
        insert.run(originalSpeaker, sitzung, datum, idx,
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
