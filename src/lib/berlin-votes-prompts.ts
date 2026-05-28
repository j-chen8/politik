/**
 * Prompts und Tool-Schemas für die Berlin-Plenum-Abstimmungs-Extraktion.
 *
 * Snippet-basiert: Pre-Extract findet 'Wer dem/der X zustimmen möchte'-Events
 * in Plenarprotokollen, der LLM klassifiziert pro Snippet die Fraktions-Votes.
 */

export const PROMPT_VERSION = "berlin-votes-v1";
export const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `Du extrahierst die Fraktions-Abstimmungsergebnisse aus einem Snippet eines Plenarprotokolls des Berliner Abgeordnetenhauses (19. Wahlperiode, 2021-2026).

KONTEXT — Wie Abstimmungen im AGH Berlin protokolliert werden:

Standard-Abstimmung (per Handzeichen):
Präsident:in fragt: "Wer dem Antrag zustimmen möchte, den bitte ich um das Handzeichen."
→ "Das sind die Fraktionen der CDU, SPD und FDP." (zustimmende Fraktionen)
→ "Gegenprobe" — "Das sind die Fraktionen der GRÜNEN und der LINKEN." (ablehnende Fraktionen)
→ "Enthaltungen?" — "Das ist die AfD-Fraktion." (sich enthaltende Fraktionen)
→ "Damit ist der Antrag mit Mehrheit / einstimmig angenommen / abgelehnt."

Sechs Fraktionen in der 19. WP: CDU, SPD, GRÜNE (= Bündnis 90/Die Grünen), LINKE (= Die Linke), AfD, FDP.
Außerdem zwei fraktionslose Abgeordnete (Dr. Alexander King, Antonin Brousek).
Wenn fraktionslose Abgeordnete im Snippet als "Abgeordneter X" gesondert genannt sind, sind sie NICHT Teil der Fraktions-Voting-Matrix.

Namentliche Abstimmung (selten):
Eine Fraktion oder eine bestimmte Anzahl Abgeordneter beantragt namentliche Abstimmung.
Stimmen werden einzeln aufgerufen und gezählt. Ergebnis: aggregierte Zahlen "Abgegebene Stimmen: X / Ja-Stimmen: Y / Nein-Stimmen: Z / Enthaltungen: W" — KEINE Einzelstimmen werden im Plenarprotokoll genannt.

Hammelsprung (sehr selten):
Bei Zweifeln über Mehrheit verlassen Abgeordnete den Saal und kommen durch Ja/Nein/Enthaltungs-Türen zurück. Wieder nur Endzahlen.

KONSERVATIVE ABLEITUNGS-REGELN:

1. Wenn in "Wer dem Antrag zustimmen möchte... Das sind die Fraktionen X, Y, Z" nicht alle 6 Fraktionen genannt sind: prüfe die folgende Gegenprobe und Enthaltungs-Frage. Wenn keine vollständige Aufzählung findbar ist, setze die nicht-genannten Fraktionen auf "unbekannt".

2. Bei "einstimmig" / "Das sind alle Fraktionen": alle 6 Fraktionen bekommen den entsprechenden Vote ("ja" oder "nein").

3. Wenn das Snippet nur eine Tagesordnungs-Ankündigung ohne tatsächliche Abstimmung enthält, oder eine Personen-Wahl (Präsident, Vize-Präsident, Senator), oder eine reine Beratungs-Sequenz: setze outcome="kein_vote" und alle Fraktions-Votes auf "unbekannt".

4. Wenn das Snippet einen Block-Vote enthält ("Wer den Anträgen auf den Drucksachen 19/X und 19/Y zustimmen möchte"): alle DS-Nrn ins drucksache_nrn-Array.
4a. Wenn der Vote eine Beschlussempfehlung referenziert ("gemäß den Beschlussempfehlungen auf Drucksache 19/Z" + Vote auf "Antrag auf Drucksache 19/Y"): BEIDE Nummern (19/Y und 19/Z) ins drucksache_nrn-Array. Die Beschlussempfehlung gehört konstitutiv zur Abstimmung, auch wenn der formale Vote-Gegenstand der Antrag ist.

DRUCKSACHEN-ZUORDNUNG:

- Format: "19/XXXX" mit führenden Nullen (z.B. "19/0001", "19/3198"). Der KONTEXT-HINWEIS am Anfang der User-Message zeigt bereits gefundene DS-Referenzen — übernimm sie ins Output-Array.
- Wenn der Snippet zusätzliche DS-Nummern enthält (z.B. Änderungsanträge "19/0001-2"), nimm nur die HAUPT-Nummer (19/0001), nicht Sub-Varianten.
- Wenn keine DS-Referenz: leeres Array. Im Geschäftsordnungs-Antrag-Fall ist das normal.

OUTCOME-WERTE:

- "annahme": Antrag/Gesetz/Vorlage angenommen
- "annahme_geaendert": angenommen mit Änderungen (typisch nach Beschlussempfehlung "in geänderter Fassung")
- "ablehnung": abgelehnt
- "vertagung": vertagt
- "ueberweisung": an Ausschuss überwiesen (in I. Lesung üblich)
- "kein_vote": Snippet enthält keine Abstimmung im engeren Sinne (Personen-Wahl, Beratung, Tagesordnungs-Punkt)

MODUS-WERTE:

- "einstimmig": alle 6 Fraktionen stimmen gleich (alle ja oder alle nein)
- "mehrheitlich": klare Mehrheit, nicht-einstimmig (Standard-Fall in der Politik)
- "knapp": klare aber sehr knappe Mehrheit (selten bei Handzeichen, eher bei namentlicher Abstimmung sichtbar)
- "unklar": Modus nicht ableitbar aus Snippet

VOTE_TYPE-WERTE:

- "handzeichen": Standard-Mehrheitsabstimmung per Handzeichen (≈95 % der Fälle)
- "namentlich": namentliche Abstimmung mit aggregierter Stimmenzählung
- "hammelsprung": Saal verlassen + Türen-Zählung
- "unklar": nicht ableitbar

FRAKTIONS-VOTE-NORMALISIERUNG:

Für jede der 6 Fraktionen (CDU, SPD, GRÜNE, LINKE, AfD, FDP) MUSS ein Wert gesetzt sein:
- "ja": Fraktion hat zugestimmt
- "nein": Fraktion hat dagegen gestimmt
- "enthaltung": Fraktion hat sich enthalten
- "unbekannt": aus Snippet nicht eindeutig ableitbar

Bei "Das sind die Fraktionen X und Y" → X, Y = "ja". Bei "Gegenprobe: Das ist die Fraktion Z" → Z = "nein". Bei "Enthaltungen: Das ist die Fraktion W" → W = "enthaltung". Alle anderen, die im Snippet nicht klar verortet sind: "unbekannt".

BEISPIELE:

Beispiel 1 — Einstimmige Annahme:
Snippet: "Wer dem Antrag zustimmen möchte, den bitte ich um das Handzeichen. – Das sind alle Fraktionen. Gegenprobe? – Enthaltungen? – Damit ist der Antrag einstimmig angenommen."
→ outcome="annahme", modus="einstimmig", alle 6 Fraktionen "ja".

Beispiel 2 — Koalitions-Annahme gegen Opposition:
Snippet: "Wer dem Antrag der CDU- und SPD-Fraktion zustimmen möchte, den bitte ich um das Handzeichen. – Das sind die Fraktionen der CDU und der SPD. Gegenprobe? – Das sind die Fraktionen der GRÜNEN, der LINKEN und der AfD. Enthaltungen? – Das ist die FDP-Fraktion. Damit ist der Antrag angenommen."
→ outcome="annahme", modus="mehrheitlich"
→ CDU="ja", SPD="ja", GRÜNE="nein", LINKE="nein", AfD="nein", FDP="enthaltung"

Beispiel 3 — Block-Vote über mehrere Drucksachen:
Snippet enthält "Wer den Anträgen auf Drucksachen 19/0234 und 19/0235 zustimmen möchte..." mit zwei DS-Referenzen.
→ drucksache_nrn=["19/0234", "19/0235"]

Beispiel 4 — Kein Vote (Personen-Wahl):
Snippet zeigt "Wahl des Präsidenten" mit "Wer Dennis Buchner als Präsidenten wählen möchte, den bitte ich um das Handzeichen" → das ist eine Personen-Wahl, nicht eine Drucksachen-Abstimmung.
→ outcome="kein_vote", alle Fraktionen "unbekannt"

Beispiel 5 — Namentliche Abstimmung:
Snippet enthält "Abgegebene Stimmen: 146 / Ja-Stimmen: 88 / Nein-Stimmen: 50 / Enthaltungen: 8"
→ vote_type="namentlich", stimmen_zahlen={ja:88, nein:50, enthaltungen:8}
Die Fraktions-Matrix kann aus dem Text trotzdem ableitbar sein wenn z.B. "Mit Ja stimmten die Fraktionen CDU und SPD" steht — sonst "unbekannt".

Beispiel 6 — Ablehnung Opposition-Antrag:
Snippet: "Wer dem AfD-Antrag zustimmen möchte, den bitte ich um das Handzeichen. – Das ist die AfD-Fraktion. Wer dagegen ist? – Das sind die Fraktionen der CDU, SPD, GRÜNEN, LINKEN und der FDP. Damit ist der Antrag mit deutlicher Mehrheit abgelehnt."
→ outcome="ablehnung", modus="mehrheitlich"
→ AfD="ja", alle anderen "nein"

Beispiel 7 — Vertagung:
Snippet: "Da heute nicht abschließend abgestimmt werden konnte, beantragt die Fraktion der SPD die Vertagung. Wer der Vertagung zustimmen möchte, den bitte ich um das Handzeichen. – Das ist die deutliche Mehrheit. Damit ist der Antrag vertagt."
→ outcome="vertagung", modus="mehrheitlich", fraktion_votes alle "unbekannt" (nicht klar wer wie gestimmt hat)

Beispiel 8 — Überweisung an Ausschuss (I. Lesung):
Snippet: "Damit empfehle ich die Überweisung an den Ausschuss für Stadtentwicklung. Wer dem zustimmen möchte, den bitte ich um das Handzeichen. – Das ist die gesamte Versammlung. Damit ist der Antrag an den Ausschuss überwiesen."
→ outcome="ueberweisung", modus="einstimmig", alle Fraktionen "ja"

Beispiel 9 — Annahme in geänderter Fassung:
Snippet: "Wer dem Antrag in der Fassung der Beschlussempfehlung 19/2736 zustimmen möchte, den bitte ich um das Handzeichen. – Das sind die Fraktionen CDU, SPD und FDP. Damit ist der Antrag in geänderter Fassung angenommen."
→ outcome="annahme_geaendert", modus="mehrheitlich"
→ CDU="ja", SPD="ja", FDP="ja", GRÜNE/LINKE/AfD aus Kontext (Gegenprobe / Enthaltungen prüfen, sonst "unbekannt")

WICHTIG bei der Klassifikation:

- Wenn "Das sind alle Fraktionen" steht aber fraktionslose Abgeordnete separat erwähnt sind: das "alle" bezieht sich nur auf die 6 Fraktionen, nicht auf einzelne fraktionslose Abgeordnete. Trotzdem setze alle 6 Fraktionen auf den entsprechenden Vote.
- Wenn ein Antrag in einer Aktuellen Stunde oder reinen Beratung diskutiert wird ohne formelle Abstimmung: outcome="kein_vote".
- Die unmittelbaren Wörter nach "bitte ich um das Handzeichen" sind die wichtigsten — danach kommen die zustimmenden Fraktionen. Achte besonders auf "– Das sind die Fraktionen ..." (Dash + Fraktions-Aufzählung).
- "Vereinzelt" / "einzelne Abgeordnete" zählen NICHT als Fraktions-Vote. Sie werden bei "unbekannt" gelassen für die jeweilige Fraktion.

NEUTRALITÄT:

Bewerte NICHT, was abgestimmt wurde ("kontroverses Gesetz", "umstrittener Antrag"). Du extrahierst nur die Fakten der Abstimmung — Welche Fraktion wie gestimmt hat und mit welchem Outcome.

Verwende das Antwort-Tool — keine Erklärungen außerhalb des Tool-Aufrufs.`;

export const VOTE_TOOL = {
  name: "extract_berlin_vote",
  description: "Extrahiert ein Abstimmungs-Event aus einem Plenarprotokoll-Snippet.",
  input_schema: {
    type: "object" as const,
    required: ["drucksache_nrn", "vote_type", "outcome", "modus", "fraktion_votes"],
    properties: {
      drucksache_nrn: {
        type: "array",
        items: { type: "string" },
        description: 'JSON-Array ALLER Drucksachen-Nummern, die TEIL DIESES VOTES sind, im Format "19/XXXX". Pflicht-Inklusion: (a) der Vote-Gegenstand-Antrag (z.B. "auf Drucksache 19/0924"), (b) eine zitierte Beschlussempfehlung in dieser Abstimmung (z.B. "gemäß Beschlussempfehlung 19/3132"), (c) bei Block-Votes alle DS-Nrn. Format "19/XXXX" (führende Null erhalten). NICHT inkludieren: DS aus vorherigen Debatten im Snippet-Kontext.',
      },
      vote_type: {
        type: "string",
        enum: ["handzeichen", "namentlich", "hammelsprung", "unklar"],
      },
      outcome: {
        type: "string",
        enum: ["annahme", "annahme_geaendert", "ablehnung", "vertagung", "ueberweisung", "kein_vote"],
      },
      modus: {
        type: "string",
        enum: ["einstimmig", "mehrheitlich", "knapp", "unklar"],
      },
      fraktion_votes: {
        type: "object",
        description: "Fraktions-Vote-Matrix. Jede der 6 Fraktionen muss als Key vorhanden sein.",
        required: ["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP"],
        properties: {
          CDU:   { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          SPD:   { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          GRÜNE: { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          LINKE: { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          AfD:   { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          FDP:   { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
        },
      },
      stimmen_zahlen: {
        type: "object",
        description: 'Nur bei namentlicher Abstimmung. Aggregierte Zahlen aus "Abgegebene Stimmen / Ja / Nein / Enthaltungen". Null bei Handzeichen.',
        properties: {
          ja: { type: "integer" },
          nein: { type: "integer" },
          enthaltungen: { type: "integer" },
        },
      },
    },
  },
};

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

// ─── Vote-Event-Patterns ─────────────────────────────────────
// Empirisch (Stage-Vote-Iteration 1): die zuverlässige Schluss-Phrase JEDER
// Berlin-Handzeichen-Abstimmung ist "bitte ich ... um das Handzeichen". 634 Treffer
// über 124 Plenarprotokolle. Eröffnungs-Phrasen ("Wer dem/Wer diesem/Wer den") sind
// zu variabel und matchen weniger als 5 % der echten Abstimmungen.
// `\s+` für die Whitespace-Stellen — im PDF brechen Zeilen oft an Wort-Grenzen
// (z. B. "bitte ich jetzt um das\nHandzeichen") und ein literal Space matcht
// kein Newline. Vorher: nur 4/17 echte Triggers in Sitzung 85 wurden gefunden.
export const VOTE_PATTERNS: ReadonlyArray<RegExp> = [
  /bitte\s+ich(?:[^.]{0,30})um\s+das\s+Handzeichen/g,
] as const;

export const ROLLCALL_PATTERN = /Abgegebene Stimmen:\s*(\d+)[\s\S]{0,200}?Ja-Stimmen:\s*(\d+)[\s\S]{0,200}?Nein-Stimmen:\s*(\d+)[\s\S]{0,200}?Enthaltungen:\s*(\d+)/;

/** Extrahiert alle Vote-Event-Snippets aus einem Plenarprotokoll-Volltext.
 *  Pro Match: ±2.000 Z. Kontext + Drucksachen-Nr-Array (Regex). */
export interface VoteEvent {
  offset: number;
  snippet: string;
  drucksache_nrn_prefiltered: string[]; // via Regex aus Snippet vorgefüllt
}

export function extractVoteEvents(fullText: string): VoteEvent[] {
  const allMatches: number[] = [];
  // Drucksache-Nr-Regex: "19/0001" bis "19/99999" (Berlin nutzt 0-padded 4+ Ziffern)
  const dsNrPattern = /\bDrucksache\s+(\d{2})\s*\/\s*(\d{1,5})/gi;

  // Alle Patterns über den ganzen Text durchsuchen, Offsets sammeln
  for (const pattern of VOTE_PATTERNS) {
    const re = new RegExp(pattern.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(fullText)) !== null) {
      allMatches.push(m.index);
    }
  }

  // Sortieren + dedupen: zwei Matches innerhalb von 100 Z. sind dasselbe Event
  // (z.B. "Wer dem Antrag" und das nachfolgende "Wer dem Antrag in geänderter Fassung").
  allMatches.sort((a, b) => a - b);
  const dedupOffsets: number[] = [];
  for (const off of allMatches) {
    const last = dedupOffsets[dedupOffsets.length - 1];
    if (last === undefined || off - last > 100) dedupOffsets.push(off);
  }

  const events: VoteEvent[] = [];
  for (const offset of dedupOffsets) {
    const start = Math.max(0, offset - 500);
    const end = Math.min(fullText.length, offset + 1500);
    const snippet = fullText.slice(start, end);

    const dsNrs = new Set<string>();
    let dsm: RegExpExecArray | null;
    const dsRe = new RegExp(dsNrPattern.source, "gi");
    while ((dsm = dsRe.exec(snippet)) !== null) {
      const nr = `${dsm[1]}/${dsm[2].padStart(4, "0")}`;
      dsNrs.add(nr);
    }

    events.push({
      offset,
      snippet,
      drucksache_nrn_prefiltered: [...dsNrs],
    });
  }
  return events;
}

/** Versucht Sitzungs-Nr (z.B. 83) zu extrahieren.
 *  Robuste Variante: nimmt entweder Body-Text ODER PDF-Filename (z. B.
 *  "PlenarPr_p19-085-wp.pdf" → 85). Filename hat Priorität, weil sicherer. */
export function extractSitzungNr(textOrFilename: string): number | null {
  // 1. Filename-Pattern: p19-NNN(-wp).pdf
  const fnMatch = textOrFilename.match(/p\d{2}-(\d{3})/);
  if (fnMatch) return parseInt(fnMatch[1], 10);
  // 2. Body-Pattern: "85. Sitzung"
  const bodyMatch = textOrFilename.slice(0, 3000).match(/(\d{1,3})\.\s*Sitzung/);
  return bodyMatch ? parseInt(bodyMatch[1], 10) : null;
}

/** Versucht das Sitzungs-Datum (z.B. "26. März 2026") aus dem PlPr-Header zu extrahieren. */
export function extractSitzungDatum(fullText: string): string | null {
  const head = fullText.slice(0, 3000);
  const monthMap: Record<string, string> = {
    "Januar": "01", "Februar": "02", "März": "03", "April": "04", "Mai": "05", "Juni": "06",
    "Juli": "07", "August": "08", "September": "09", "Oktober": "10", "November": "11", "Dezember": "12",
  };
  const m = head.match(/(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = monthMap[m[2]];
  return `${m[3]}-${month}-${day}`;
}
