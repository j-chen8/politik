/**
 * Phase-2-Pipeline: Medien-Auftritts-Analyse aus YouTube-Auto-Captions.
 *
 * Steps:
 *   1. yt-dlp Download VTT (de-orig priorisiert)
 *   2. VTT-Parser: Roh-Caption → saubere Prosa mit Block-Timestamps
 *   3. Haiku 4.5 (Tool-Use): Speaker-Identifikation + Themen + Zitate
 *   4. Output als JSON-File (kein DB-Insert in Phase 2a)
 *
 * Usage:
 *   npx tsx scripts/analyze-media-appearance.ts \
 *     --url https://www.youtube.com/watch?v=ZlYKFD5lh98 \
 *     --politician "Felix Banaszak" \
 *     --host "Tilo Jung" \
 *     --publisher "Jung & Naiv" \
 *     --out data/media-analyses/banaszak-jung-naiv-825.json
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";

// Load .env
const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const args = process.argv.slice(2);
function argVal(name: string): string | null {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}
const URL = argVal("--url");
const POLITICIAN = argVal("--politician");
const HOST = argVal("--host") ?? "Interviewer";
const PUBLISHER = argVal("--publisher") ?? "Podcast";
const OTHER_SPEAKERS = argVal("--other-speakers"); // z.B. "Sepp Müller (CDU, MdB), Eva Quadbeck (Journalistin)"
const POLITICIAN_DESC = argVal("--politician-desc"); // z.B. "Co-Vorsitzender der Grünen, MdB, Themen: Klima, Migration, Ost-Wahlkampf"
const OUT_PATH = argVal("--out") ?? "media-analysis-output.json";

if (!URL || !POLITICIAN) {
  console.error("Usage: --url <youtube-url> --politician <name> [--host <name>] [--publisher <name>] [--other-speakers <list>] [--politician-desc <text>] [--out <path>]");
  process.exit(1);
}

const MODEL = "claude-haiku-4-5";

/* ─── Step 1: VTT Download ─────────────────────────────────── */

interface VTTDownload {
  vttPath: string;
  videoId: string;
}

function downloadVTT(url: string): VTTDownload {
  const tmpDir = path.join(process.cwd(), ".tmp-media");
  fs.mkdirSync(tmpDir, { recursive: true });
  // Quelle erkennen
  const isZdf = /zdf\.de\//.test(url);
  const isArd = /ardmediathek\.de\//.test(url);
  const isYoutube = /youtube\.com|youtu\.be/.test(url);
  // Video-ID für Cache-Check
  let videoId: string | null = null;
  if (isYoutube) {
    const m = url.match(/[?&]v=([A-Za-z0-9_-]+)/) ?? url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
    videoId = m ? m[1] : null;
  } else if (isZdf || isArd) {
    // ZDF/ARD: nutze letzten Path-Segment-Slug als ID
    const m = url.match(/\/([^/]+)(?:[?#]|$)/);
    videoId = m ? m[1] : null;
  }
  if (videoId) {
    const cached = fs.readdirSync(tmpDir).find(f => f.startsWith(videoId + ".") && f.endsWith(".vtt"));
    if (cached) {
      console.log(`[1/4] Cache-Hit: ${cached}`);
      return { vttPath: path.join(tmpDir, cached), videoId };
    }
  }
  console.log(`[1/4] Lade VTT für ${url} ...`);
  // ZDF/ARD haben redaktionelle Untertitel als "deu", YouTube hat Auto-Captions als "de-orig"
  const subArgs = (isZdf || isArd)
    ? `--write-subs --sub-langs "deu"`
    : `--write-auto-subs --sub-langs "de-orig"`;
  execSync(
    `yt-dlp --skip-download ${subArgs} --sub-format vtt -o "${tmpDir}/%(id)s.%(ext)s" "${url}"`,
    { stdio: "pipe" }
  );
  const files = fs.readdirSync(tmpDir).filter(f => f.endsWith(".vtt"));
  const preferred = files.find(f => f.includes(".deu.")) ?? files.find(f => f.includes(".de-orig.")) ?? files.find(f => f.includes(".de.")) ?? files[0];
  if (!preferred) throw new Error("Keine VTT-Datei gefunden");
  const finalVideoId = preferred.split(".")[0];
  return { vttPath: path.join(tmpDir, preferred), videoId: finalVideoId };
}

/* ─── Step 2: VTT Parsen ───────────────────────────────────── */

interface CaptionLine {
  time: string;  // "HH:MM:SS"
  text: string;
  speaker?: string;  // Wenn VTT Speaker-Marker hat (z.B. "FB", "ML")
}

interface ParsedVTT {
  lines: CaptionLine[];
  hasSpeakerMarkers: boolean;
  speakerCounts: Record<string, number>;
}

function parseVTT(content: string): ParsedVTT {
  const result: CaptionLine[] = [];
  const lines = content.split("\n");
  let pendingTime = "";
  let lastText = "";
  let currentSpeaker: string | undefined;
  const speakerCounts: Record<string, number> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const tsMatch = line.match(/^(\d{2}:\d{2}:\d{2})\.\d{3}\s+-->/);
    if (tsMatch) {
      pendingTime = tsMatch[1];
      continue;
    }
    if (!line) continue;
    if (line.startsWith("WEBVTT") || line.startsWith("Kind:") || line.startsWith("Language:")) continue;
    if (line.includes("<")) continue;
    if (line === lastText) continue;

    // Speaker-Marker am Zeilenanfang? z.B. "FB: text..." oder "ML: text..."
    const speakerMatch = line.match(/^([A-Z]{1,3}):\s*(.*)$/);
    let cleanText = line;
    if (speakerMatch) {
      currentSpeaker = speakerMatch[1];
      cleanText = speakerMatch[2];
      speakerCounts[currentSpeaker] = (speakerCounts[currentSpeaker] ?? 0) + 1;
    }
    result.push({ time: pendingTime, text: cleanText, speaker: currentSpeaker });
    lastText = line;
  }
  return {
    lines: result,
    hasSpeakerMarkers: Object.keys(speakerCounts).length > 0,
    speakerCounts,
  };
}

/**
 * Baut Prosa-Transkript.
 * - Mit Speaker-Markern: ein Block pro Speaker-Wechsel (+ harte Zeit-Schwelle als Notbremse)
 * - Ohne Speaker-Marker: 30-Sekunden-Blöcke (statt 60 — bessere Timestamp-Granularität für Quotes)
 */
function captionsToProse(parsed: ParsedVTT): string {
  if (parsed.lines.length === 0) return "";
  const blocks: string[] = [];
  let currentText: string[] = [];
  let blockStartTime = parsed.lines[0].time;
  let blockStartSec = timeToSec(blockStartTime);
  let blockSpeaker: string | undefined = parsed.lines[0].speaker;
  const MAX_BLOCK_SECONDS = parsed.hasSpeakerMarkers ? 120 : 30;

  const flush = () => {
    if (currentText.length === 0) return;
    const prefix = blockSpeaker ? `[${blockStartTime}] [${blockSpeaker}] ` : `[${blockStartTime}] `;
    blocks.push(prefix + currentText.join(" "));
    currentText = [];
  };

  for (const c of parsed.lines) {
    const sec = timeToSec(c.time);
    // Block-Trigger: Speaker-Wechsel ODER Zeit-Überschreitung
    const speakerChanged = parsed.hasSpeakerMarkers && c.speaker !== blockSpeaker;
    const timeExceeded = sec - blockStartSec >= MAX_BLOCK_SECONDS;
    if ((speakerChanged || timeExceeded) && currentText.length > 0) {
      flush();
      blockStartTime = c.time;
      blockStartSec = sec;
      blockSpeaker = c.speaker;
    }
    if (!blockSpeaker && c.speaker) blockSpeaker = c.speaker;
    currentText.push(c.text);
  }
  flush();
  return blocks.join("\n\n");
}

function timeToSec(t: string): number {
  const [h, m, s] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

/* ─── Step 3: Haiku-Analyse ────────────────────────────────── */

const IS_MULTI_SPEAKER = !!OTHER_SPEAKERS;
// HAS_SPEAKER_TAGS wird zur Laufzeit gesetzt — wenn das Transkript Speaker-Marker enthält (ZDF).
// Wird im Prompt als Bedingung interpoliert.

const buildSpeakerBlock = (hasSpeakerTags: boolean, speakerCounts: Record<string, number>): string => {
  if (hasSpeakerTags) {
    const counts = Object.entries(speakerCounts).map(([k, v]) => `${k}: ${v}`).join(", ");
    return `QUELLE: Redaktionell editiertes Untertitel-Transkript mit EXPLIZITEN Speaker-Markern (z.B. ZDF Mediathek).

FORMAT: Jeder Block ist mit "[HH:MM:SS] [XX] Text..." markiert, wobei "XX" der Speaker-Code ist.
Gefundene Speaker-Codes (Häufigkeit): ${counts}.

SPRECHER (Beispiele für Codes — bitte ableiten welcher zu wem gehört):
- ${HOST} (Moderator) — typisch häufigster Speaker, stellt Fragen
- ${POLITICIAN} (UNSER ZIEL${POLITICIAN_DESC ? ` — ${POLITICIAN_DESC}` : ""})
${OTHER_SPEAKERS ? `- Weitere Gäste: ${OTHER_SPEAKERS}` : ""}

ZIEL: Du sollst NUR die Aussagen aus den Blöcken extrahieren, die den Speaker-Code für ${POLITICIAN} tragen.
Speaker-Code-Zuordnung anhand der Initialen ableiten: z.B. "FB" → Felix Banaszak, "ML" → Markus Lanz, "SM" → Sepp Müller.
Statements aus Blöcken mit anderem Speaker-Code NICHT als ${POLITICIAN}-Position erfassen — auch nicht wenn der Inhalt politisch nahe wirkt.`;
  }
  if (IS_MULTI_SPEAKER) {
    return `QUELLE: Untertitel-Transkript mit Zeitstempeln aus einer TALKSHOW mit MEHREREN Sprechern. Bekannte Limitierungen:
- Eigennamen meist sauber (redaktionelle Untertitel), aber gelegentlich Übertragungs-Fehler.
- KEINE Speaker-Labels im laufenden Text. Sprecher wechseln implizit.
- Block-Format: "[HH:MM:SS] <Text>" — Zeitstempel markiert den Beginn jedes Blocks.

SPRECHER IN DIESER SENDUNG:
- ${HOST} (Moderator): leitet die Sendung, stellt Fragen an alle, formuliert oft pointierte Statements
- ${POLITICIAN} (UNSER ZIEL${POLITICIAN_DESC ? ` — ${POLITICIAN_DESC}` : ""})
- Weitere Gäste: ${OTHER_SPEAKERS}

ZIEL: Du sollst NUR die Aussagen von ${POLITICIAN} extrahieren. Statements der anderen Gäste oder des Moderators NICHT als ${POLITICIAN}-Position erfassen.

SPRECHER-IDENTIFIKATION — ohne Speaker-Labels nur über Kontext:
- ${POLITICIAN} spricht typischerweise: aus eigener Partei-Perspektive (siehe Charakterisierung), antwortet auf direkte Ansprache (z.B. "Herr ${POLITICIAN.split(" ").pop()}, ..."), nutzt typische Sprachmuster seiner politischen Linie.
- Andere Politiker (z.B. aus anderer Partei) sind NICHT ${POLITICIAN} — auch wenn sie politische Statements machen.
- Journalist:innen / Reporter:innen analysieren oft die Politiker — auch das ist NICHT ${POLITICIAN}.
- BEI UNSICHERHEIT: lieber das Zitat / Thema WEGLASSEN als falsch zuordnen.`;
  }
  return `QUELLE: YouTube-Auto-Caption mit Zeitstempeln. Bekannte Limitierungen:
- Eigennamen können verstümmelt sein (z.B. "Beinerschalt" → "Banaszak", "Maritz" → "Merz", "Hapeck" → "Habeck"). Korrigiere offensichtliche Verstümmelungen still.
- KEINE Speaker-Labels — identifiziere Sprecher anhand Kontext:
  - ${HOST} (Interviewer): stellt Fragen, du-Form, oft fragender Ton, kürzere Beiträge
  - ${POLITICIAN} (Gast): antwortet, längere zusammenhängende Passagen, eigene Position
- Block-Format: "[HH:MM:SS] <Text>" — der Zeitstempel markiert den Beginn jedes Blocks.`;
};

const buildSystemPrompt = (hasSpeakerTags: boolean, speakerCounts: Record<string, number>) => `Du extrahierst die Aussagen von ${POLITICIAN} aus einem ${IS_MULTI_SPEAKER || hasSpeakerTags ? "Talkshow" : "Interview"}-Transkript.

${buildSpeakerBlock(hasSpeakerTags, speakerCounts)}

AUFGABE:
Liefere eine strukturierte Themen-Analyse aus ${POLITICIAN}s Sicht. Pro Thema bestehst du auf einer FRAGE-ANTWORT-PAARUNG: erst was wurde gefragt (oder was war der Anlass), dann was hat ${POLITICIAN} darauf gesagt, dann wie gut hat die Antwort die Frage adressiert.

TIMESTAMP-REGEL (sehr wichtig — Bug-Schutz):
- Jeder Block beginnt mit "[HH:MM:SS]" — das ist der echte Zeitstempel aus dem Untertitel.
- Quote-Timestamps MÜSSEN dem Block-Anker des Blocks entsprechen, in dem das Zitat steht. Schätze NIE Timestamps zwischen den Anchors.
- timestamp_range eines Themas: nutze Block-Anker des ERSTEN und LETZTEN Banaszak-Blocks zu diesem Thema.

GRANULARITÄT:
${IS_MULTI_SPEAKER
  ? `- 3–10 substanziell unterscheidbare Themen (in einer Talkshow mit mehreren Gästen hat jeder weniger Redezeit; lieber wenige, dafür belastbare Themen).
- Wenn ${POLITICIAN} nur sehr wenig sagt: lieber 3 starke Themen als 10 dünne.
- Pro Thema: präzise Themen-Titel, neutrale Themen-Beschreibung, ${POLITICIAN}s konkrete Position mit Belegen.
- Pro Thema: 1–2 wörtliche Zitate mit Timestamp. Zitate müssen wortgenau aus dem Transkript sein (nicht paraphrasiert). Bei Unsicherheit ob das Zitat wirklich von ${POLITICIAN} stammt: WEGLASSEN.
- Pro Thema: konkrete Forderungen / Aussagen (falls vorhanden, keine Erfindung).`
  : `- 10–20 substanziell unterscheidbare Themen (kein Mini-Splitting, keine Über-Aggregation).
- Pro Thema: präzise Themen-Titel, neutrale Themen-Beschreibung, ${POLITICIAN}s konkrete Position mit Belegen.
- Pro Thema: 1–3 wörtliche Zitate mit Timestamp. Zitate müssen wortgenau aus dem Transkript sein (nicht paraphrasiert).
- Pro Thema: konkrete Forderungen / Aussagen (falls vorhanden, keine Erfindung).`}

ANTWORT-TYPISIERUNG (Pflichtfeld pro Thema):
Klassifiziere für jedes Thema, wie ${POLITICIAN} die zugrundeliegende Frage beantwortet hat. Die Begriffe sind bewusst neutral gewählt — sie beschreiben Muster, kein Werturteil:
- "substantielle_position": klare eigene Position mit Begründung.
- "teilweise_antwort": antwortet, lässt aber zentrale Aspekte der Frage aus.
- "themenwechsel": weicht auf nicht-verwandtes Thema aus.
- "pivot_zum_gegenpunkt": gibt eine substantielle Antwort, aber zu einem anderen Bezugspunkt — typischerweise zu einer Verfehlung oder Verantwortung der anderen Seite, statt die eigene Position zur gestellten Frage zu erklären. Methodisch das, was im englischen Diskurs als "whataboutism" bezeichnet wird, hier neutral benannt. KONKRETES BEISPIEL: Frage zur humanitären Lage in Gaza wird mit Hinweis auf den 7. Oktober und Hamas-Verantwortung beantwortet, ohne die humanitäre Lage selbst zu adressieren. Weiteres Beispiel: Frage zu Verfehlung der eigenen Partei wird mit Verweis auf Verfehlung einer anderen Partei beantwortet ("aber CDU/SPD/AfD haben doch X").
- "floskel_generisch": Allgemeinplätze ohne erkennbare Substanz ("die Komplexität erfordert mehrere Perspektiven", "wir müssen alle Seiten hören").
- "offene_verweigerung": explizit "dazu sage ich nichts" / "kein Kommentar".
- "gegenfrage": Gegenfrage statt Antwort als Hauptmanöver.

WICHTIG bei pivot_zum_gegenpunkt, themenwechsel, teilweise_antwort, gegenfrage:
- Erfasse "question_asked": was wurde tatsächlich gefragt (1 Satz, paraphrasiert).
- Erfasse "deflection_target" (nur bei pivot_zum_gegenpunkt + themenwechsel): worauf wurde umgeleitet.
- Erfasse "evasion_note": was wurde NICHT beantwortet (1-2 Sätze).

NEUTRALITÄT — sehr wichtig:
- Alle Antwort-Typen außer "substantielle_position" sind LEGITIME rhetorische Manöver. Wir erfassen das Muster transparent, nicht als Werturteil. Ein Politiker, der oft pivotiert, ist weder besser noch schlechter — aber der/die Leser:in soll das selbst sehen können.
- Keine wertende Sprache ("greift hart an", "entlarvt", "weicht feige aus"). Beschreibe was gesagt wurde + was nicht gesagt wurde.
- THEMEN-TITEL müssen rein deskriptiv sein. KEINE wertenden Klammer-Zusätze wie "(Fehler)", "(Kritik)", "(Eingeständnis)", "(Skandal)", "(Erfolg)", "(Selbstkritik)". Selbst wenn der Politiker selbst etwas als "Fehler" bezeichnet — diese Selbst-Wertung gehört in den position-Text, NICHT in den Titel. Titel sollen das THEMA benennen, nicht es bewerten.
- Trenne Position-Statement (was ${POLITICIAN} vertritt) von Faktischer Behauptung (was ${POLITICIAN} als Tatsache darstellt — extra Liste für mögliche Verifikation).
- Bei Unsicherheit zwischen "substantielle_position" und "teilweise_antwort": eher "substantielle_position" wählen (konservativ — Klassifikator soll lieber wohlwollend lesen).
- Bei Unsicherheit zwischen "themenwechsel" und "pivot_zum_gegenpunkt": "pivot_zum_gegenpunkt" nur wählen wenn die Umleitung KLAR zu einer Verantwortung der Gegenseite geht, sonst "themenwechsel".
- Bei Unsicherheit zwischen "substantielle_position" und "floskel_generisch": "floskel_generisch" nur wenn keinerlei konkreter Inhalt erkennbar ist.

METHODOLOGIE-DISCLAIMER (wichtiger als der Output):
Diese Klassifikation ist eine LLM-Auslegung, kein etabliertes politikwissenschaftliches Coding-Schema. Sie hat keine Inter-Annotator-Agreement-Studie. Ein Symmetrie-Audit über ≥ 20 Politiker:innen verschiedener Fraktionen ist erforderlich, BEVOR die Antwort-Typen öffentlich angezeigt werden — sonst könnte eine fraktionspolitische Asymmetrie in den Sprachmustern als asymmetrische Klassifikation durchschlagen. Das ist im Output-Metadata vermerkt.

Antworte ausschließlich über das Tool \`analyze_appearance\`.`;

const TOOL_SCHEMA = {
  name: "analyze_appearance",
  description: "Strukturierte Analyse eines Medien-Auftritts.",
  input_schema: {
    type: "object" as const,
    properties: {
      overall_summary: {
        type: "string",
        description: "2-3 Sätze: was war Gegenstand des Auftritts insgesamt, in welchem Ton wirkte der Gast.",
      },
      themes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Präziser Themen-Titel (max 8 Wörter, rein deskriptiv — KEINE wertenden Klammern wie '(Fehler)')." },
            timestamp_range: { type: "string", description: "Format 'HH:MM:SS - HH:MM:SS' — Block-Anker des ersten und letzten Banaszak-Blocks zu diesem Thema. NIE schätzen." },
            theme_description: { type: "string", description: "1 Satz neutrale Beschreibung des Themas — was wurde besprochen." },
            question_asked: { type: "string", description: "PFLICHT: was hat der Moderator/Interviewer gefragt (paraphrasiert in 1-2 Sätzen). Wenn keine direkte Frage: 'Eigeninitiative' oder 'Anlass: <was Banaszak provozierte>'." },
            question_intent: { type: "string", description: "PFLICHT: was wollte der Moderator wirklich wissen? (1 Satz, identifiziert den eigentlichen Erkenntnisinteresse — z.B. 'Will eine konkrete Selbstkritik hören' oder 'Will Position zur AfD-Frage')." },
            position: { type: "string", description: "3-5 Sätze: konkrete Position des Gastes, neutral formuliert. Eigene Wortwahl des Gastes mit Anführungs-Markierung wenn übernommen ('bezeichnete als ideologisch')." },
            answer_match: {
              type: "string",
              enum: ["voll_adressiert", "teil_adressiert", "verschoben", "umgeleitet_gegenpunkt", "verweigert", "kein_direkter_anlass"],
              description: "PFLICHT: Wie gut hat die Antwort die FRAGE-INTENTION adressiert? voll_adressiert: Frage direkt + vollständig. teil_adressiert: antwortet auf Teilaspekte, lässt zentrale Aspekte aus. verschoben: antwortet zu verwandtem aber anderem Thema. umgeleitet_gegenpunkt: pivotiert zu Verantwortung/Verfehlung der Gegenseite. verweigert: explizit kein Kommentar. kein_direkter_anlass: Eigeninitiative-Statement, keine Frage davor.",
            },
            match_reasoning: { type: "string", description: "PFLICHT: 1-2 Sätze: warum diese answer_match-Bewertung? Konkret: was wurde adressiert, was nicht. Lass sich gegen Original prüfen." },
            quotes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Wörtliches Zitat, gereinigt von Eigennamen-Verstümmelungen." },
                  timestamp: { type: "string", description: "Format 'HH:MM:SS' — MUSS dem Block-Anker entsprechen, in dem das Zitat steht. NIE zwischen Anker schätzen." },
                  context: { type: "string", description: "1 Satz: was war der Anlass (z.B. 'Frage nach X')." },
                },
                required: ["text", "timestamp"],
              },
            },
            concrete_statements: {
              type: "array",
              items: { type: "string" },
              description: "Konkrete Forderungen / Ankündigungen / Ablehnungen. Leer wenn nichts Konkretes.",
            },
            related_bundestag_topics: {
              type: "array",
              items: { type: "string" },
              description: "Stichwörter zu Bundestags-Themen für mögliche Cross-Reference (z.B. 'NATO-Mandate').",
            },
            answer_type: {
              type: "string",
              enum: [
                "substantielle_position",
                "teilweise_antwort",
                "themenwechsel",
                "pivot_zum_gegenpunkt",
                "floskel_generisch",
                "offene_verweigerung",
                "gegenfrage",
              ],
              description: "Sekundär abgeleitet aus answer_match. Mapping: voll_adressiert→substantielle_position. teil_adressiert→teilweise_antwort. verschoben→themenwechsel. umgeleitet_gegenpunkt→pivot_zum_gegenpunkt. verweigert→offene_verweigerung. kein_direkter_anlass→substantielle_position.",
            },
            deflection_target: {
              type: "string",
              description: "Nur bei answer_match='verschoben' oder 'umgeleitet_gegenpunkt': worauf wurde umgeleitet.",
            },
            evasion_note: {
              type: "string",
              description: "Optional, redundant zu match_reasoning bei nicht-vollen Antworten. Kann weggelassen werden.",
            },
          },
          required: ["title", "timestamp_range", "theme_description", "question_asked", "question_intent", "position", "answer_match", "match_reasoning", "quotes", "answer_type"],
        },
      },
      factual_claims_to_verify: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: { type: "string", description: "Konkrete Faktenbehauptung." },
            timestamp: { type: "string" },
          },
          required: ["claim", "timestamp"],
        },
        description: "Überprüfbare Sachaussagen (z.B. 'Die SPD hat 2024 X beschlossen'). PFLICHT: mindestens 5 wenn vorhanden, ansonsten leere Liste mit kurzer Begründung im overall_summary.",
      },
    },
    required: ["overall_summary", "themes", "factual_claims_to_verify"],
  },
};

async function analyze(transcript: string, systemPrompt: string): Promise<{ result: unknown; tokens: { in: number; out: number } }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log(`[3/4] Sende ${transcript.length.toLocaleString()} Zeichen Transkript an ${MODEL} (Streaming) ...`);
  // Streaming ist Pflicht bei max_tokens > ~10k (Anthropic Long-Request-Policy)
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system: systemPrompt,
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "tool", name: "analyze_appearance" },
    messages: [{ role: "user", content: `TRANSKRIPT:\n\n${transcript}` }],
  });
  const response = await stream.finalMessage();
  const toolUse = response.content.find(b => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Kein tool_use Block im Response: " + JSON.stringify(response.content));
  }
  return {
    result: toolUse.input,
    tokens: { in: response.usage.input_tokens, out: response.usage.output_tokens },
  };
}

/* ─── Step 4: Quote-Validation ─────────────────────────────── */

function validateQuotes(themes: any[], transcript: string): {
  valid_exact: number; valid_fuzzy: number; invalid: number; details: any[];
} {
  // Normalisiere Whitespace + Anführungszeichen
  const normalize = (s: string) => s
    .replace(/[„""„""]/g, '"')
    .replace(/[—–-]/g, ' ')
    .replace(/[.,;:!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const tokenize = (s: string) => normalize(s).split(/\s+/).filter(w => w.length >= 3);
  const haystackText = normalize(transcript);
  const haystackTokens = new Set(tokenize(transcript));

  let validExact = 0, validFuzzy = 0, invalid = 0;
  const details: any[] = [];
  for (const theme of themes) {
    for (const q of (theme.quotes ?? [])) {
      const needleText = normalize(q.text);
      // 1. Strict substring
      if (haystackText.includes(needleText)) {
        validExact++;
        continue;
      }
      // 2. Fuzzy: ≥ 80 % der Quote-Tokens müssen im Transcript vorkommen
      const needleTokens = tokenize(q.text);
      if (needleTokens.length === 0) {
        invalid++;
        details.push({ theme: theme.title, quote: q.text, timestamp: q.timestamp, reason: "empty" });
        continue;
      }
      const found = needleTokens.filter(t => haystackTokens.has(t)).length;
      const ratio = found / needleTokens.length;
      if (ratio >= 0.80) {
        validFuzzy++;
      } else {
        invalid++;
        details.push({
          theme: theme.title, quote: q.text, timestamp: q.timestamp,
          reason: `token-overlap ${(ratio * 100).toFixed(0)}%`,
        });
      }
    }
  }
  return { valid_exact: validExact, valid_fuzzy: validFuzzy, invalid, details };
}

function sortThemesByStart(themes: any[]): any[] {
  const startSec = (range: string): number => {
    const m = range?.match(/^(\d{2}):(\d{2}):(\d{2})/);
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
  };
  return [...themes].sort((a, b) => startSec(a.timestamp_range) - startSec(b.timestamp_range));
}

/* ─── Main ─────────────────────────────────────────────────── */

(async () => {
  const t0 = Date.now();

  // Step 1: Download
  const { vttPath, videoId } = downloadVTT(URL);
  console.log(`     ✓ VTT: ${vttPath}`);

  // Step 2: Parse
  const vttContent = fs.readFileSync(vttPath, "utf-8");
  const parsed = parseVTT(vttContent);
  const transcript = captionsToProse(parsed);
  const transcriptSha = createHash("sha256").update(transcript).digest("hex").slice(0, 16);
  console.log(`[2/4] VTT geparst: ${parsed.lines.length} Caption-Lines, ${transcript.length.toLocaleString()} Zeichen Prosa${parsed.hasSpeakerMarkers ? ` · Speaker: ${Object.entries(parsed.speakerCounts).map(([k,v]) => `${k}:${v}`).join(", ")}` : ""}`);
  console.log(`     ✓ transcript_sha: ${transcriptSha}`);

  // Step 3: Haiku
  const systemPrompt = buildSystemPrompt(parsed.hasSpeakerMarkers, parsed.speakerCounts);
  const { result, tokens } = await analyze(transcript, systemPrompt);
  console.log(`     ✓ Themen: ${(result as any).themes?.length ?? 0}`);
  console.log(`     ✓ Tokens: ${tokens.in.toLocaleString()} in / ${tokens.out.toLocaleString()} out`);
  const costUSD = (tokens.in / 1_000_000) * 0.80 + (tokens.out / 1_000_000) * 4.0;
  console.log(`     ✓ Cost: $${costUSD.toFixed(4)}`);

  // Themen sortieren nach Start-Timestamp (LLM gibt sie manchmal out-of-order)
  if ((result as any).themes) {
    (result as any).themes = sortThemesByStart((result as any).themes);
  }

  // Step 4: Quote-Validation (strict + fuzzy)
  const validation = validateQuotes((result as any).themes ?? [], transcript);
  const totalQuotes = validation.valid_exact + validation.valid_fuzzy + validation.invalid;
  const validTotal = validation.valid_exact + validation.valid_fuzzy;
  const validPct = totalQuotes > 0 ? (validTotal / totalQuotes * 100).toFixed(1) : "n/a";
  console.log(`[4/4] Quote-Validation: ${validTotal}/${totalQuotes} (${validPct} %) — exact: ${validation.valid_exact}, fuzzy: ${validation.valid_fuzzy}, invalid: ${validation.invalid}`);
  if (validation.invalid > 0) {
    console.log(`     ⚠ Invalid quotes (token-overlap < 80 %):`);
    for (const d of validation.details.slice(0, 5)) {
      console.log(`       · ${d.theme} @${d.timestamp} (${d.reason}): "${d.quote.slice(0, 70)}..."`);
    }
  }

  // Antwort-Typ-Statistik (für Symmetrie-Audit)
  const answerTypeCounts: Record<string, number> = {};
  for (const t of ((result as any).themes ?? [])) {
    const at = t.answer_type ?? "unknown";
    answerTypeCounts[at] = (answerTypeCounts[at] ?? 0) + 1;
  }
  console.log(`     ✓ Antwort-Typ-Verteilung:`);
  for (const [k, v] of Object.entries(answerTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`         ${k}: ${v}`);
  }

  // Save JSON
  const output = {
    _meta: {
      url: URL,
      video_id: videoId,
      politician: POLITICIAN,
      host: HOST,
      publisher: PUBLISHER,
      transcript_sha: transcriptSha,
      transcript_chars: transcript.length,
      caption_lines: parsed.lines.length,
      model: MODEL,
      tokens_in: tokens.in,
      tokens_out: tokens.out,
      cost_usd: costUSD,
      quote_validation: {
        valid_exact: validation.valid_exact,
        valid_fuzzy: validation.valid_fuzzy,
        invalid: validation.invalid,
        valid_pct: validPct,
      },
      answer_type_distribution: answerTypeCounts,
      generated_at: new Date().toISOString(),
      duration_seconds: Math.round((Date.now() - t0) / 1000),
    },
    _methodology: {
      transcript_source: /ardmediathek\.de/.test(URL ?? "") ? "ARD-Mediathek Redaktions-Untertitel (deu)"
        : /zdf\.de/.test(URL ?? "") ? "ZDF-Mediathek Redaktions-Untertitel (deu)"
        : "YouTube Auto-Caption (de-orig)",
      transcript_caveat: /youtube\.com|youtu\.be/.test(URL ?? "")
        ? "Auto-generated, ~5-10 % Eigennamen-Fehler erwartet, vom LLM still korrigiert."
        : "Redaktionelle Untertitel (Hörgeschädigten-Fassung), nah am Wortlaut; vereinzelt gekürzt/paraphrasiert.",
      classification_caveat: "Antwort-Typ-Klassifikation (substantielle_position / teilweise_antwort / themenwechsel / pivot_zum_gegenpunkt / floskel_generisch / offene_verweigerung / gegenfrage) ist eine LLM-Auslegung, kein etabliertes politikwissenschaftliches Coding-Schema. Keine Inter-Annotator-Agreement-Studie. Ein Symmetrie-Audit über ≥ 20 Politiker:innen verschiedener Fraktionen ist erforderlich, BEVOR die Klassifikation öffentlich angezeigt wird — sonst könnte fraktionspolitische Asymmetrie in Sprachmustern als asymmetrische Klassifikation durchschlagen.",
      ui_display_hint: "Bis Symmetrie-Audit abgeschlossen ist, sollten answer_type-Klassifikationen entweder gar nicht oder nur mit Begriffen wie 'Antwort zu anderem Bezugspunkt' (statt 'whataboutism') angezeigt werden. Original-Zitat + question_asked müssen IMMER mit verlinkt sein, damit Leser:innen selbst urteilen können.",
      methodology_version: "v0.1-phase2",
    },
    analysis: result,
    invalid_quotes: validation.details,
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✓ Output: ${OUT_PATH}`);
  console.log(`✓ Total runtime: ${Math.round((Date.now() - t0) / 1000)}s`);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
