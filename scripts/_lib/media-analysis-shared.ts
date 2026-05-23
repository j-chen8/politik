/**
 * Shared helpers für Medien-Auftritts-Analyse (Live + Batch).
 *
 * - parseVTT: VTT-Format → CaptionLines (mit optionalen Speaker-Markern)
 * - captionsToProse: → Transkript mit [HH:MM:SS] + optional [SPEAKER] Anchors
 * - buildSystemPrompt + TOOL_SCHEMA: Schema-Reform-Version
 */

export interface CaptionLine {
  time: string;
  text: string;
  speaker?: string;
}

export interface ParsedVTT {
  lines: CaptionLine[];
  hasSpeakerMarkers: boolean;
  speakerCounts: Record<string, number>;
}

export function parseVTT(content: string): ParsedVTT {
  const result: CaptionLine[] = [];
  const lines = content.split("\n");
  let pendingTime = "";
  let lastText = "";
  let currentSpeaker: string | undefined;
  const speakerCounts: Record<string, number> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const tsMatch = line.match(/^(\d{2}:\d{2}:\d{2})\.\d{3}\s+-->/);
    if (tsMatch) { pendingTime = tsMatch[1]; continue; }
    if (!line) continue;
    if (line.startsWith("WEBVTT") || line.startsWith("Kind:") || line.startsWith("Language:")) continue;
    if (line.includes("<")) continue;
    if (line === lastText) continue;

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

function timeToSec(t: string): number {
  const [h, m, s] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

export function captionsToProse(parsed: ParsedVTT): string {
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

export function buildSystemPrompt(opts: {
  politician: string;
  host: string;
  otherSpeakers?: string;
  politicianDesc?: string;
  hasSpeakerTags: boolean;
  speakerCounts: Record<string, number>;
}): string {
  const { politician, host, otherSpeakers, politicianDesc, hasSpeakerTags, speakerCounts } = opts;
  const isMulti = !!otherSpeakers;

  let speakerBlock: string;
  if (hasSpeakerTags) {
    const counts = Object.entries(speakerCounts).map(([k, v]) => `${k}: ${v}`).join(", ");
    speakerBlock = `QUELLE: Redaktionell editiertes Untertitel-Transkript mit EXPLIZITEN Speaker-Markern (z.B. ZDF Mediathek).

FORMAT: Jeder Block ist mit "[HH:MM:SS] [XX] Text..." markiert, wobei "XX" der Speaker-Code ist.
Gefundene Speaker-Codes (Häufigkeit): ${counts}.

SPRECHER (Beispiele für Codes — bitte ableiten welcher zu wem gehört):
- ${host} (Moderator) — typisch häufigster Speaker, stellt Fragen
- ${politician} (UNSER ZIEL${politicianDesc ? ` — ${politicianDesc}` : ""})
${otherSpeakers ? `- Weitere Gäste: ${otherSpeakers}` : ""}

ZIEL: Du sollst NUR die Aussagen aus den Blöcken extrahieren, die den Speaker-Code für ${politician} tragen.
Speaker-Code-Zuordnung anhand der Initialen ableiten: z.B. "FB" → Felix Banaszak, "ML" → Markus Lanz, "SM" → Sepp Müller.
Statements aus Blöcken mit anderem Speaker-Code NICHT als ${politician}-Position erfassen — auch nicht wenn der Inhalt politisch nahe wirkt.`;
  } else if (isMulti) {
    speakerBlock = `QUELLE: Untertitel-Transkript mit Zeitstempeln aus einer TALKSHOW mit MEHREREN Sprechern. KEINE Speaker-Labels.

SPRECHER:
- ${host} (Moderator): stellt Fragen
- ${politician} (UNSER ZIEL${politicianDesc ? ` — ${politicianDesc}` : ""})
- Weitere Gäste: ${otherSpeakers}

ZIEL: NUR ${politician}-Aussagen. Andere Sprecher-Statements NICHT als ${politician}-Position erfassen. BEI UNSICHERHEIT: weglassen.`;
  } else {
    speakerBlock = `QUELLE: YouTube-Auto-Caption mit Zeitstempeln. Bekannte Limitierungen:
- Eigennamen können verstümmelt sein (z.B. "Beinerschalt" → "Banaszak"). Korrigiere offensichtliche Verstümmelungen still.
- KEINE Speaker-Labels — identifiziere Sprecher anhand Kontext:
  - ${host} (Interviewer): stellt Fragen, du-Form, kürzere Beiträge
  - ${politician} (Gast): antwortet, längere Passagen, eigene Position
- Block-Format: "[HH:MM:SS] <Text>".`;
  }

  const granularityBlock = (isMulti || hasSpeakerTags)
    ? `- 3–10 substanziell unterscheidbare Themen (Talkshow: weniger Redezeit pro Gast).
- Pro Thema: 1–2 wörtliche Zitate. Bei Unsicherheit ob das Zitat wirklich von ${politician} stammt: WEGLASSEN.`
    : `- 10–20 substanziell unterscheidbare Themen.
- Pro Thema: 1–3 wörtliche Zitate.`;

  return `Du extrahierst die Aussagen von ${politician} aus einem ${isMulti || hasSpeakerTags ? "Talkshow" : "Interview"}-Transkript.

${speakerBlock}

AUFGABE:
Liefere eine strukturierte Themen-Analyse aus ${politician}s Sicht. Pro Thema bestehst du auf einer FRAGE-ANTWORT-PAARUNG: erst was wurde gefragt, dann was hat ${politician} darauf gesagt, dann wie gut hat die Antwort die Frage adressiert.

TIMESTAMP-REGEL (sehr wichtig — Bug-Schutz):
- Jeder Block beginnt mit "[HH:MM:SS]" — das ist der echte Zeitstempel aus dem Untertitel.
- Quote-Timestamps MÜSSEN dem Block-Anker des Blocks entsprechen, in dem das Zitat steht. Schätze NIE Timestamps zwischen den Anchors.
- timestamp_range eines Themas: nutze Block-Anker des ERSTEN und LETZTEN ${politician}-Blocks zu diesem Thema.

GRANULARITÄT:
${granularityBlock}
- Pro Thema: präzise Themen-Titel (max 8 Wörter, REIN deskriptiv — KEINE wertenden Klammern wie "(Fehler)" oder "(Kritik)").
- Pro Thema: konkrete Forderungen / Aussagen (falls vorhanden, keine Erfindung).

ANTWORT-TYPISIERUNG (Pflichtfeld pro Thema):
Klassifiziere für jedes Thema, wie ${politician} die zugrundeliegende Frage beantwortet hat. Die Begriffe sind bewusst neutral gewählt — sie beschreiben Muster, kein Werturteil:
- "substantielle_position" (mapped von answer_match='voll_adressiert' oder 'kein_direkter_anlass')
- "teilweise_antwort" (von 'teil_adressiert')
- "themenwechsel" (von 'verschoben')
- "pivot_zum_gegenpunkt" (von 'umgeleitet_gegenpunkt') — antwortet substantiell, aber zu einer Verantwortung/Verfehlung der anderen Seite statt zur gestellten Frage. KONKRETES BEISPIEL: Frage zur humanitären Lage in Gaza wird mit Hinweis auf den 7. Oktober beantwortet.
- "floskel_generisch": Allgemeinplätze ohne erkennbare Substanz
- "offene_verweigerung" (von 'verweigert')
- "gegenfrage"

NEUTRALITÄT — sehr wichtig:
- Alle Antwort-Typen außer "substantielle_position" sind LEGITIME rhetorische Manöver. Wir erfassen das Muster transparent, nicht als Werturteil.
- Keine wertende Sprache ("greift hart an", "entlarvt", "weicht feige aus"). Beschreibe was gesagt wurde + was nicht gesagt wurde.
- THEMEN-TITEL müssen rein deskriptiv sein. KEINE wertenden Klammer-Zusätze.
- Trenne Position-Statement von Faktischer Behauptung (extra Liste für mögliche Verifikation).

METHODOLOGIE-DISCLAIMER:
Diese Klassifikation ist eine LLM-Auslegung, kein etabliertes politikwissenschaftliches Coding-Schema. Symmetrie-Audit über ≥ 20 Politiker:innen verschiedener Fraktionen ist erforderlich, BEVOR die Klassifikation öffentlich angezeigt wird.

Antworte ausschließlich über das Tool \`analyze_appearance\`.`;
}

export const TOOL_SCHEMA = {
  name: "analyze_appearance",
  description: "Strukturierte Analyse eines Medien-Auftritts.",
  input_schema: {
    type: "object" as const,
    properties: {
      overall_summary: { type: "string", description: "2-3 Sätze: Gegenstand des Auftritts insgesamt, in welchem Ton wirkte der Gast." },
      themes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Präziser Themen-Titel (max 8 Wörter, REIN deskriptiv — KEINE wertenden Klammern)." },
            timestamp_range: { type: "string", description: "Format 'HH:MM:SS - HH:MM:SS' — Block-Anker des ersten und letzten Politiker-Blocks zu diesem Thema. NIE schätzen." },
            theme_description: { type: "string", description: "1 Satz neutrale Beschreibung des Themas." },
            question_asked: { type: "string", description: "PFLICHT: was hat der Moderator gefragt (paraphrasiert 1-2 Sätze). Wenn keine direkte Frage: 'Eigeninitiative' oder 'Anlass: <was vorausging>'." },
            question_intent: { type: "string", description: "PFLICHT: was wollte der Moderator wirklich wissen? (1 Satz)." },
            position: { type: "string", description: "3-5 Sätze: konkrete Position, neutral formuliert. Eigene Wortwahl des Gastes mit Anführungs-Markierung wenn übernommen." },
            answer_match: {
              type: "string",
              enum: ["voll_adressiert", "teil_adressiert", "verschoben", "umgeleitet_gegenpunkt", "verweigert", "kein_direkter_anlass"],
              description: "PFLICHT: Wie gut hat die Antwort die FRAGE-INTENTION adressiert?",
            },
            match_reasoning: { type: "string", description: "PFLICHT: 1-2 Sätze: warum diese answer_match-Bewertung? Was wurde adressiert, was nicht. Prüfbar gegen Original." },
            quotes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string", description: "Wörtliches Zitat." },
                  timestamp: { type: "string", description: "MUSS dem Block-Anker entsprechen, in dem das Zitat steht. NIE schätzen." },
                  context: { type: "string", description: "1 Satz: was war der Anlass." },
                },
                required: ["text", "timestamp"],
              },
            },
            concrete_statements: {
              type: "array",
              items: { type: "string" },
              description: "Konkrete Forderungen / Ankündigungen / Ablehnungen.",
            },
            related_bundestag_topics: {
              type: "array",
              items: { type: "string" },
              description: "Stichwörter zu Bundestags-Themen für Cross-Reference.",
            },
            answer_type: {
              type: "string",
              enum: ["substantielle_position", "teilweise_antwort", "themenwechsel", "pivot_zum_gegenpunkt", "floskel_generisch", "offene_verweigerung", "gegenfrage"],
              description: "Sekundär aus answer_match abgeleitet (siehe Mapping im Prompt).",
            },
            deflection_target: { type: "string", description: "Nur bei answer_match='verschoben' oder 'umgeleitet_gegenpunkt'." },
            evasion_note: { type: "string", description: "Optional, redundant zu match_reasoning bei nicht-vollen Antworten." },
          },
          required: ["title", "timestamp_range", "theme_description", "question_asked", "question_intent", "position", "answer_match", "match_reasoning", "quotes", "answer_type"],
        },
      },
      factual_claims_to_verify: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: { type: "string" },
            timestamp: { type: "string" },
          },
          required: ["claim", "timestamp"],
        },
        description: "Überprüfbare Sachaussagen. PFLICHT: mindestens 5 wenn vorhanden, sonst leere Liste.",
      },
    },
    required: ["overall_summary", "themes", "factual_claims_to_verify"],
  },
};
