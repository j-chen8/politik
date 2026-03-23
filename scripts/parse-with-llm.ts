/**
 * LLM-based Protokoll Parser using Gemini Flash Lite
 * Rotates between API keys, respects rate limits (15 RPM per key)
 */

const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// ── Config ──

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

const MODEL = "gemini-3.1-flash-lite-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const RPM_PER_KEY = 14; // stay under 15
const DELAY_MS = Math.ceil((60 * 1000) / (RPM_PER_KEY * API_KEYS.length)); // ~2s with 2 keys

let currentKeyIndex = 0;
let requestCount = 0;

function getNextKey(): string {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── PDF Text Extraction ──

async function extractText(filepath: string, maxChars = 25000): Promise<string> {
  const data = new Uint8Array(fs.readFileSync(filepath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lineMap = new Map<number, { x: number; str: string }[]>();

    for (const item of content.items as any[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push({ x, str: item.str });
    }

    for (const y of [...lineMap.keys()].sort((a, b) => b - a)) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const text = items.map((i) => i.str).join("").trim();
      if (text) lines.push(text);
    }
  }

  // Truncate if too long for the API
  let fullText = lines.join("\n");
  if (fullText.length > maxChars) {
    // Keep first part (TOC + start) and some from the end
    fullText = fullText.substring(0, maxChars * 0.8) + "\n\n[...TRUNCATED...]\n\n" + fullText.substring(fullText.length - maxChars * 0.2);
  }
  return fullText;
}

// ── Gemini API Call ──

async function callGemini(prompt: string, text: string, retries = 2): Promise<any> {
  const key = getNextKey();
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${key}`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt + "\n\n---DOKUMENT---\n\n" + text },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      console.log("    Rate limited, waiting 10s...");
      await sleep(10000);
      if (retries > 0) return callGemini(prompt, text, retries - 1);
      throw new Error("Rate limited after retries");
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API ${res.status}: ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty response from Gemini");

    return JSON.parse(content);
  } catch (e: any) {
    if (retries > 0 && !e.message.includes("Rate limited after")) {
      console.log(`    Retry (${e.message.substring(0, 60)})`);
      await sleep(3000);
      return callGemini(prompt, text, retries - 1);
    }
    throw e;
  }
}

// ── Prompts ──

const PLENAR_PROMPT = `Du bist ein Daten-Extrahierer für deutsche Bundestagsprotokolle. Analysiere das folgende Plenarprotokoll und extrahiere die Daten als JSON.

Gib EXAKT dieses JSON-Format zurück:
{
  "sitzung": <Sitzungsnummer als Integer>,
  "datum": "<YYYY-MM-DD>",
  "wahlperiode": 21,
  "themen": [
    {
      "nummer": "<Tagesordnungspunkt-Nummer, z.B. '1', '2a', 'ZP3'>",
      "titel": "<Kurzer Titel des Tagesordnungspunkts, max 150 Zeichen>"
    }
  ],
  "redner": [
    {
      "name": "<Vollständiger Name>",
      "partei": "<CDU/CSU|SPD|AfD|BÜNDNIS 90/DIE GRÜNEN|Die Linke|FDP|BSW|fraktionslos|null>",
      "rolle": "<z.B. 'Bundeskanzler', 'Bundesministerin BMWE', 'Parl. Staatssekretär BMV' oder null wenn normaler MdB>",
      "reden_anzahl": <Wie oft diese Person im Protokoll als Redner auftaucht>
    }
  ]
}

Regeln:
- Extrahiere ALLE Redner aus dem Inhaltsverzeichnis UND dem Protokolltext
- Bei Ministern/Staatssekretären: partei = null, rolle = Amtsbezeichnung
- Zähle Reden pro Person (mehrere Auftritte = höhere Zahl)
- Themen kurz und prägnant formulieren
- Wenn kein klares Datum erkennbar: "datum": null`;

const AUSSCHUSS_PROMPT = `Du bist ein Daten-Extrahierer für deutsche Bundestags-Ausschussprotokolle. Analysiere das folgende Ausschuss-Protokoll und extrahiere die Daten als JSON.

Gib EXAKT dieses JSON-Format zurück:
{
  "protokoll_nr": "<z.B. '21/18'>",
  "sitzung_nr": <Integer>,
  "ausschuss": "<Voller Name des Ausschusses>",
  "typ": "<Wortprotokoll|Kurzprotokoll|Beschlussprotokoll>",
  "datum": "<YYYY-MM-DD>",
  "vorsitz": "<Name des/der Vorsitzenden>",
  "themen": [
    {
      "nummer": "<TOP-Nummer>",
      "titel": "<Kurzer Titel, max 150 Zeichen>",
      "drucksache": "<BT-Drucksache Nummer oder null>"
    }
  ],
  "anwesende": [
    {
      "name": "<Vorname Nachname>",
      "fraktion": "<CDU/CSU|SPD|AfD|BÜNDNIS 90/DIE GRÜNEN|Die Linke|FDP|BSW|fraktionslos>",
      "typ": "<ordentlich|stellvertretend>"
    }
  ],
  "redner": [
    {
      "name": "<Vorname Nachname>",
      "fraktion": "<Fraktion oder null>",
      "reden_anzahl": <Anzahl Redebeiträge>
    }
  ]
}

Regeln:
- Anwesende aus der Anwesenheits-/Teilnehmerliste extrahieren (ordentliche UND stellvertretende Mitglieder)
- Fraktionszugehörigkeit immer angeben wenn erkennbar
- Redner: Nur Personen die tatsächlich sprechen (nicht bloß anwesend sind)
- Bei "Umlaufverfahren" oder "Nichtöffentliche Sitzung": anwesende kann leer sein`;

// ── Main ──

async function main() {
  const mode = process.argv[2]; // "plenar" or "ausschuss"
  const target = process.argv[3]; // specific file or "all" or "failed"

  if (!mode || !["plenar", "ausschuss"].includes(mode)) {
    console.log("Usage: npx tsx scripts/parse-with-llm.ts <plenar|ausschuss> <file|all|failed>");
    console.log("  plenar all      - Parse all Plenarprotokolle");
    console.log("  plenar failed   - Parse only those with 0 speeches");
    console.log("  ausschuss all   - Parse all Ausschuss-Protokolle");
    console.log("  plenar <file>   - Parse a single file");
    process.exit(1);
  }

  const isAusschuss = mode === "ausschuss";
  const prompt = isAusschuss ? AUSSCHUSS_PROMPT : PLENAR_PROMPT;
  const outputDir = isAusschuss ? "data/ausschuss_protokolle" : "data/plenarprotokolle";

  // Collect files to process
  let files: string[] = [];

  if (target === "all" || target === "failed") {
    if (isAusschuss) {
      function findPdfs(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) findPdfs(full);
          else if (entry.name.endsWith(".pdf")) files.push(full);
        }
      }
      findPdfs("data/ausschuss_protokolle");
    } else {
      files = fs.readdirSync("data/plenarprotokolle")
        .filter((f: string) => f.endsWith(".pdf"))
        .map((f: string) => path.join("data/plenarprotokolle", f))
        .sort();
    }

    // For "failed" mode, only process files without a good LLM JSON
    if (target === "failed") {
      files = files.filter((f) => {
        const jsonPath = f.replace(".pdf", ".llm.json");
        if (!fs.existsSync(jsonPath)) return true;
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          if (isAusschuss) return !data.ausschuss;
          return !data.redner || data.redner.length === 0;
        } catch {
          return true;
        }
      });
    }
  } else {
    files = [target];
  }

  console.log(`=== LLM Parser (${MODEL}) ===`);
  console.log(`Mode: ${mode}, Files: ${files.length}, Keys: ${API_KEYS.length}`);
  console.log(`Rate: ~${Math.round(60000 / DELAY_MS)} req/min, Delay: ${DELAY_MS}ms\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const basename = path.basename(file, ".pdf");
    const jsonPath = file.replace(".pdf", ".llm.json");

    // Skip if already processed
    if (fs.existsSync(jsonPath) && target === "all") {
      try {
        const existing = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        if (isAusschuss ? existing.ausschuss : existing.redner?.length > 0) {
          continue; // Skip already good results
        }
      } catch {}
    }

    process.stdout.write(`[${i + 1}/${files.length}] ${basename}... `);

    try {
      const text = await extractText(file);

      // Skip very short files (likely empty or just headers)
      if (text.length < 500) {
        console.log("SKIP (too short)");
        continue;
      }

      const result = await callGemini(prompt, text);
      fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

      const info = isAusschuss
        ? `${result.ausschuss || "?"} | ${result.anwesende?.length || 0} anw. | ${result.redner?.length || 0} redner`
        : `Sitzung ${result.sitzung} | ${result.redner?.length || 0} Redner | ${result.themen?.length || 0} TOPs`;
      console.log(`OK → ${info}`);
      success++;
    } catch (e: any) {
      console.log(`ERROR: ${e.message.substring(0, 80)}`);
      errors++;
    }

    requestCount++;
    await sleep(DELAY_MS);
  }

  console.log(`\n=== Done: ${success} OK, ${errors} errors ===`);
}

main().catch(console.error);
