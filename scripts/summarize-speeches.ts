/**
 * Extract and summarize individual speeches from Plenarprotokolle
 * Uses PDF text extraction + Gemini for summaries
 */

const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const Database = require("better-sqlite3");

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

const MODEL = "gemini-3.1-flash-lite-preview";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
let keyIndex = 0;

function getKey() {
  const k = API_KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % API_KEYS.length;
  return k;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Extract full text with line structure ──

async function extractFullText(filepath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(filepath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const allLines: string[] = [];

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
      if (text) allLines.push(text);
    }
  }
  return allLines;
}

// ── Find speech sections for a speaker ──

function findSpeechSections(lines: string[], speakerName: string): string[] {
  const sections: string[] = [];
  const nameParts = speakerName.split(" ");
  const lastName = nameParts[nameParts.length - 1];

  // Skip the TOC — find where "Beginn: XX.XX Uhr" appears (with time)
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^Beginn:\s*\d+[\.:]\d+\s*Uhr/)) {
      bodyStart = i;
      break;
    }
  }
  // Fallback: skip first 15% of lines
  if (bodyStart === 0) bodyStart = Math.floor(lines.length * 0.15);

  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line or a nearby line (within 3 lines) forms a speaker marker
    // The two-column PDF layout can split "Dr. Johann David Wadephul, Bundesminister des"
    // and "Auswärtigen:" across separate lines with other column text in between
    if (!line.includes(lastName)) continue;

    const isShortLine = line.length < 120;
    const hasFaction = line.match(/\((?:CDU|SPD|AfD|BÜNDNIS|Die Linke|FDP|BSW|fraktionslos)/);
    const hasRole = line.match(/Bundesminister|Staatssekretär|Bundeskanzler/);
    const endsWithColon = line.endsWith(":");

    // Also check if the colon is on a nearby line (two-column split)
    let colonNearby = false;
    for (let k = i + 1; k <= Math.min(i + 3, lines.length - 1); k++) {
      if (lines[k].match(/^(?:Auswärtigen|Innern|Inneres|Verteidigung|Finanzen|Justiz|Arbeit|Gesundheit|Bildung|Wirtschaft|Verkehr|Umwelt|Ernährung|Entwicklung|des\s|der\s|für\s)/i) && lines[k].includes(":")) {
        colonNearby = true;
        break;
      }
      // Also match short lines ending with colon that could be the role continuation
      if (lines[k].length < 30 && lines[k].endsWith(":")) {
        colonNearby = true;
        break;
      }
    }

    const isSpeakerMarker = endsWithColon || (isShortLine && (hasFaction || hasRole || colonNearby));

    if (!isSpeakerMarker) continue;

    {
      // Collect the speech text (until next speaker or interruption)
      let speechText = line + "\n";
      let j = i + 1;
      const maxLines = 80; // Cap at ~80 lines per speech

      while (j < lines.length && j < i + maxLines) {
        const nextLine = lines[j];

        // Stop at next speaker: must look like a person name, not a ministry/role continuation
        const looksLikePersonName = nextLine.match(/^(?:Dr\.\s+|Prof\.\s+)?[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]/); // at least first+last name
        const isNextSpeaker = nextLine.length < 120 && looksLikePersonName &&
          (nextLine.endsWith(":") || nextLine.match(/\((?:CDU|SPD|AfD|BÜNDNIS|Die Linke|FDP|BSW)\b/));
        if (isNextSpeaker && !nextLine.includes(lastName)) {
          break;
        }

        // Stop at "(Beifall" markers (end of speech)
        if (nextLine.match(/^\(Beifall\b/)) {
          speechText += nextLine + "\n";
          break;
        }

        speechText += nextLine + "\n";
        j++;
      }

      if (speechText.length > 100) {
        sections.push(speechText.substring(0, 3000)); // Cap per section
      }
    }
  }

  return sections;
}

// ── Gemini summarize ──

async function summarizeSpeech(speechText: string, sitzung: number, datum: string, retries = 2): Promise<any> {
  const key = getKey();
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${key}`;

  const prompt = `Du bist ein Parlamentsanalyst. Analysiere den folgenden Redebeitrag aus dem Deutschen Bundestag.

Gib EXAKT dieses JSON-Format zurück:
{
  "zusammenfassung": "<2-3 Sätze: Was sagt oder fordert DIESE PERSON konkret? Welche Position vertritt sie? Was ist ihre Kernaussage?>",
  "kontext": "<Kurzes Thema der Debatte, z.B. 'Haushalt 2026 – Verteidigungsetat' oder 'Verlängerung UNIFIL-Mandat' oder 'Stahlindustrie und Standortsicherung'>",
  "typ": "<debatte|fragestunde_frage|fragestunde_antwort|regierungserklaerung|zwischenfrage|kurzintervention|erklaerung>"
}

WICHTIGE REGELN:
- "zusammenfassung" beschreibt NUR was der Redner SELBST sagt, meint oder fordert. Nicht was die Debatte allgemein behandelt.
- NIEMALS Meta-Beschreibungen wie "Das vorliegende Dokument...", "Der Protokollauszug listet...", "Es handelt sich um..."
- NIEMALS allgemeine Debattenbeschreibungen ohne den konkreten Standpunkt des Redners
- "kontext" ist NUR das Thema in 3-8 Wörtern, kein ganzer Satz
- Wenn der Redetext nicht genug Inhalt hat um die Position des Redners zu bestimmen, schreibe in zusammenfassung was erkennbar ist

Sitzung: ${sitzung} | Datum: ${datum}`;

  const body = {
    contents: [{ parts: [{ text: prompt + "\n\n---REDE---\n\n" + speechText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      if (retries > 0) {
        console.log("    Rate limited, waiting 15s...");
        await sleep(15000);
        return summarizeSpeech(speechText, sitzung, datum, retries - 1);
      }
      throw new Error("Rate limited");
    }

    if (!res.ok) throw new Error(`API ${res.status}`);

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty response");
    return JSON.parse(content);
  } catch (e: any) {
    if (retries > 0) {
      await sleep(3000);
      return summarizeSpeech(speechText, sitzung, datum, retries - 1);
    }
    throw e;
  }
}

// ── Main ──

async function main() {
  const speakerName = process.argv[2];
  if (!speakerName) {
    console.log("Usage: npx tsx scripts/summarize-speeches.ts 'Dr. Johann David Wadephul'");
    process.exit(1);
  }

  const db = new Database("politik.db");

  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS speech_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      speaker TEXT NOT NULL,
      sitzung INTEGER NOT NULL,
      datum TEXT,
      speech_index INTEGER DEFAULT 0,
      speech_text_preview TEXT,
      zusammenfassung TEXT,
      kontext TEXT,
      typ TEXT,
      source_url TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_speech_summaries_speaker ON speech_summaries(speaker);
    CREATE INDEX IF NOT EXISTS idx_speech_summaries_sitzung ON speech_summaries(sitzung);
  `);

  // Get sessions for this speaker
  const sessions = db.prepare(`
    SELECT DISTINCT s.sitzung, s.datum, s.source_url
    FROM plenar_speeches sp
    JOIN plenar_sessions s ON sp.session_id = s.id
    WHERE sp.speaker = ?
    ORDER BY s.sitzung
  `).all(speakerName) as any[];

  console.log(`=== ${speakerName}: ${sessions.length} Sitzungen ===\n`);

  // Clear existing summaries for this speaker
  db.prepare("DELETE FROM speech_summaries WHERE speaker = ?").run(speakerName);

  const insert = db.prepare(`
    INSERT INTO speech_summaries (speaker, sitzung, datum, speech_index, speech_text_preview, zusammenfassung, kontext, typ, source_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalSummaries = 0;

  for (const session of sessions) {
    const padded = String(session.sitzung).padStart(3, "0");
    const pdfPath = `data/plenarprotokolle/21${padded}.pdf`;

    if (!fs.existsSync(pdfPath)) {
      console.log(`  Sitzung ${session.sitzung}: PDF not found, skipping`);
      continue;
    }

    process.stdout.write(`  Sitzung ${session.sitzung} (${session.datum})... `);

    const lines = await extractFullText(pdfPath);
    const sections = findSpeechSections(lines, speakerName);

    if (sections.length === 0) {
      console.log("keine Redebeiträge im Text gefunden");
      continue;
    }

    // For sessions with many speeches (Fragestunde), only summarize a sample
    const toProcess = sections.length > 5
      ? [sections[0], sections[Math.floor(sections.length / 2)], sections[sections.length - 1]]
      : sections;

    const isFragestunde = sections.length > 10;

    if (isFragestunde) {
      // For Fragestunde, create one summary entry
      insert.run(
        speakerName, session.sitzung, session.datum, 0,
        sections[0].substring(0, 200),
        `Befragung der Bundesregierung / Fragestunde mit ${sections.length} Frage-Antwort-Beiträgen.`,
        "Regierungsbefragung / Fragestunde",
        "fragestunde_antwort",
        session.source_url
      );
      console.log(`Fragestunde (${sections.length} Beiträge) → 1 Zusammenfassung`);
      totalSummaries++;
      continue;
    }

    // Regular speeches — summarize each
    for (let idx = 0; idx < toProcess.length; idx++) {
      try {
        const summary = await summarizeSpeech(toProcess[idx], session.sitzung, session.datum || "");
        insert.run(
          speakerName,
          session.sitzung,
          session.datum,
          idx,
          toProcess[idx].substring(0, 200),
          summary.zusammenfassung,
          summary.kontext,
          summary.typ || "debatte",
          session.source_url
        );
        totalSummaries++;
        await sleep(2500); // Rate limit
      } catch (e: any) {
        console.log(`ERROR at speech ${idx}: ${e.message}`);
      }
    }

    console.log(`${toProcess.length} Zusammenfassungen`);
  }

  console.log(`\n=== Fertig: ${totalSummaries} Zusammenfassungen gespeichert ===`);
  db.close();
}

main().catch(console.error);
