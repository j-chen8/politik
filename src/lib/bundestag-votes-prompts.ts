/**
 * Prompts und Helpers für die Bundestag-Handzeichen-Vote-Extraktion aus XMLs.
 *
 * Bundestag-Spezifika (21. WP, ab 2025):
 *  - Fraktionen: CDU/CSU, SPD, GRÜNE, LINKE, AfD (keine FDP/BSW mehr)
 *  - DS-Format: "20/XXXX" (Vorgänger-WP, Übergang) und "21/XXXX" (aktuelle WP)
 *  - XML-Tags: <p klasse="O"> für Ordnungs-Text, <kommentar> für Beifall/Zwischenrufe
 */

export const PROMPT_VERSION = "bundestag-votes-v2";
export const MODEL = "claude-haiku-4-5";

const SYSTEM_PROMPT = `Du extrahierst die Fraktions-Abstimmungsergebnisse aus einem Snippet eines Plenarprotokolls des Deutschen Bundestags (21. Wahlperiode, seit März 2025).

KONTEXT — Wie Abstimmungen im Bundestag protokolliert werden:

Standard-Abstimmung per Handzeichen:
Der Präsident/die Präsidentin sagt: "Wer dem Antrag zustimmen möchte, den bitte ich jetzt um das Handzeichen."
→ "Dafür stimmen die Fraktionen der CDU/CSU, von Bündnis 90/Die Grünen, von der SPD und auch von der Linken." (zustimmende Fraktionen)
→ "Wer stimmt dagegen?" — "Die AfD stimmt dagegen." (ablehnende Fraktionen)
→ "Gibt es Enthaltungen?" — "Keine." oder Fraktions-Liste (sich enthaltende Fraktionen)
→ "Damit ist der Antrag angenommen / abgelehnt."

Fünf Fraktionen in der 21. WP (Stand 2025-2026): CDU/CSU, SPD, GRÜNE (= Bündnis 90/Die Grünen), LINKE (= Die Linke), AfD. KEINE FDP und KEIN BSW mehr im Bundestag.
Zusätzlich: fraktionslose Abgeordnete (sehr wenige), die separat genannt sein können — die zählen NICHT in die Fraktions-Matrix.

Namentliche Abstimmung (häufiger als in Berlin):
Bei einer namentlichen Abstimmung wird jeder MdB einzeln aufgerufen oder per Stimmkarte. Ergebnisse: "Abgegebene Stimmen: X / Ja-Stimmen: Y / Nein-Stimmen: Z / Enthaltungen: W". Individuelle Stimmen sind NICHT im Snippet — die werden separat veröffentlicht (haben wir bereits).

Hammelsprung (sehr selten):
Bei Zweifeln verlassen Abgeordnete den Saal und kommen durch Ja/Nein/Enthaltungs-Türen zurück.

KONSERVATIVE ABLEITUNGS-REGELN:

1. Wenn "Dafür stimmen die Fraktionen X, Y, Z" steht: X, Y, Z bekommen "ja". Die übrigen müssen aus "Wer stimmt dagegen?" und "Enthaltungen?" ermittelt werden.

2. "Damit ist einstimmig angenommen" / "Bei großer Mehrheit" → setze entsprechend modus.

3. Wenn das Snippet keine eindeutige Abstimmung enthält (Beratung, GO-Antrag, Personen-Wahl), setze outcome="kein_vote" und alle Fraktionen "unbekannt".

4. Block-Vote: Mehrere DS in einer Abstimmung → drucksache_nrn-Array mit allen Nrn.

DRUCKSACHEN-FORMAT:
- "21/XXXX" für aktuelle Wahlperiode (häufigster Fall)
- "20/XXXX" für Drucksachen aus 20. WP (häufig bei Übergangs-Themen)
- Bei Vorlagen mit "auf Drucksache 21/0001": nimm "21/0001" ins Array

OUTCOME-WERTE:
- "annahme" / "annahme_geaendert" / "ablehnung" / "vertagung" / "ueberweisung" / "kein_vote"

MODUS-WERTE:
- "einstimmig" / "mehrheitlich" / "knapp" / "unklar"

VOTE_TYPE-WERTE:
- "handzeichen" (häufigster Fall) / "namentlich" / "hammelsprung" / "unklar"

FRAKTIONS-VOTE-NORMALISIERUNG:

Für jede der 5 Fraktionen (CDU/CSU, SPD, GRÜNE, LINKE, AfD) MUSS ein Wert gesetzt sein:
- "ja" / "nein" / "enthaltung" / "unbekannt"

BEISPIELE:

Beispiel 1 — Koalitions-Annahme:
"Wer dem Antrag der CDU/CSU- und SPD-Fraktion zustimmen möchte, den bitte ich jetzt um das Handzeichen. – Dafür stimmen die Fraktionen der CDU/CSU und der SPD. Wer stimmt dagegen? – Die Fraktionen der GRÜNEN, der LINKEN und der AfD. Enthaltungen? – Keine. Damit ist der Antrag mit Mehrheit angenommen."
→ outcome="annahme", modus="mehrheitlich"
→ CDU/CSU="ja", SPD="ja", GRÜNE="nein", LINKE="nein", AfD="nein"

Beispiel 2 — Einstimmig:
"Wer dem Antrag zustimmen möchte, bitte das Handzeichen. – Das ist einstimmig. Der Antrag ist angenommen."
→ outcome="annahme", modus="einstimmig", alle 5 Fraktionen "ja"

Beispiel 3 — AfD-isoliert:
"Dafür stimmen die Fraktionen der CDU/CSU, der SPD, der GRÜNEN und der LINKEN. Dagegen? – Die AfD. Enthaltungen? – Keine."
→ CDU/CSU="ja", SPD="ja", GRÜNE="ja", LINKE="ja", AfD="nein"

Beispiel 4 — Opposition-Antrag abgelehnt:
"Wer dem Antrag der Fraktion DIE LINKE zustimmen möchte. – Dafür stimmt die LINKE. Wer stimmt dagegen? – Die Koalition und die AfD. Damit ist abgelehnt."
→ outcome="ablehnung", LINKE="ja", CDU/CSU="nein", SPD="nein", AfD="nein", GRÜNE="unbekannt" (nicht klar)
   (GRÜNE können sowohl in "Koalition" als auch Opposition sein, je nach Regierung — vorsichtig "unbekannt" wenn nicht namentlich genannt)

Beispiel 5 — Namentliche Abstimmung:
"Abgegebene Stimmen: 678 / Ja-Stimmen: 380 / Nein-Stimmen: 250 / Enthaltungen: 48"
→ vote_type="namentlich", stimmen_zahlen={ja:380, nein:250, enthaltungen:48}
   Fraktions-Matrix nur ausfüllen wenn explizit genannt; sonst "unbekannt".

Beispiel 6 — Überweisung an Ausschuss:
"Wir kommen zur Abstimmung über die Überweisung. Wer ist für die Überweisung? – Das ist einstimmig. Damit ist die Vorlage überwiesen."
→ outcome="ueberweisung", modus="einstimmig", alle 5 "ja"

WICHTIG:

- "Die Koalition" ohne Namens-Nennung: ableitbar wenn die Regierungs-Konstellation aus dem Kontext klar ist (CDU/CSU + SPD in der 21. WP). Sonst "unbekannt" für nicht-explizit-genannte Fraktionen.
- Bei "Dafür stimmt die Linke" — KEINE anderen Fraktionen sind "ja". Setze nur Linke="ja", den Rest aus Gegen- und Enthaltungs-Prüfung.
- KEINE Bewertung des Inhalts. Nur Faktenextraktion.

Verwende das Antwort-Tool — keine Erklärungen außerhalb des Tool-Aufrufs.`;

export const VOTE_TOOL = {
  name: "extract_bundestag_vote",
  description: "Extrahiert ein Abstimmungs-Event aus einem Bundestags-Plenarprotokoll-Snippet.",
  input_schema: {
    type: "object" as const,
    required: ["drucksache_nrn", "vote_type", "outcome", "modus", "fraktion_votes"],
    properties: {
      drucksache_nrn: {
        type: "array",
        items: { type: "string" },
        description: 'Drucksachen-Nummern im Format "21/XXXX" oder "20/XXXX". Leer wenn keine DS referenziert.',
      },
      vote_type: { type: "string", enum: ["handzeichen", "namentlich", "hammelsprung", "unklar"] },
      outcome: { type: "string", enum: ["annahme", "annahme_geaendert", "ablehnung", "vertagung", "ueberweisung", "kein_vote"] },
      modus: { type: "string", enum: ["einstimmig", "mehrheitlich", "knapp", "unklar"] },
      fraktion_votes: {
        type: "object",
        required: ["CDU/CSU", "SPD", "GRÜNE", "LINKE", "AfD"],
        properties: {
          "CDU/CSU": { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          SPD:       { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          GRÜNE:     { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          LINKE:     { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
          AfD:       { type: "string", enum: ["ja", "nein", "enthaltung", "unbekannt"] },
        },
      },
      stimmen_zahlen: {
        type: "object",
        description: "Nur bei namentlicher Abstimmung. Null sonst.",
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

/** XML-Volltext-Extraktion: Tags entfernen, HTML-Entities decoden.
 *  Wir brauchen keine Struktur — nur den Lese-Text für Pattern-Matching. */
export function xmlToText(xml: string): string {
  return xml
    // XML-Deklaration + DOCTYPE entfernen
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*(\[[^\]]*\])?>/g, "")
    // Inhaltsverzeichnis-Block entfernen (riesig + nicht relevant für Voting)
    .replace(/<inhaltsverzeichnis>[\s\S]*?<\/inhaltsverzeichnis>/g, "")
    // Alle XML-Tags entfernen
    .replace(/<[^>]+>/g, " ")
    // HTML-Entities
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    // Whitespace normalisieren
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrahiert Sitzungs-Metadaten aus XML-Wurzel-Attributen. */
export function extractSessionMeta(xml: string): { wahlperiode: number | null; sitzung_nr: number | null; datum: string | null } {
  const m = xml.slice(0, 3000).match(/<dbtplenarprotokoll[^>]+wahlperiode="(\d+)"[^>]+sitzung-nr="(\d+)"[^>]+sitzung-datum="(\d{2}\.\d{2}\.\d{4})"/);
  if (!m) return { wahlperiode: null, sitzung_nr: null, datum: null };
  const [d, mo, y] = m[3].split(".");
  return {
    wahlperiode: parseInt(m[1], 10),
    sitzung_nr: parseInt(m[2], 10),
    datum: `${y}-${mo}-${d}`,
  };
}

export interface VoteEvent {
  offset: number;
  snippet: string;
  drucksache_nrn_prefiltered: string[];
}

/** Vote-Pattern: Bundestag verwendet je nach Sitzungsleitung verschiedene
 *  Formulierungen. Manuelle Audit-Analyse (alle 64 PlPrs WP21):
 *    - "Wer stimmt dafür"  → Klöckner (Präsidentin), ~210 Vorkommen
 *    - "Wer stimmt für"    → Ramelow + Lindholz (Vize), ~310 Vorkommen
 *    - "Wer ist dafür"     → seltene Variante, ~6 Vorkommen
 *    - "Wer ist für"       → seltene Variante, ~5 Vorkommen
 *  Pipeline-v1 (alt) hat nur "Wer stimmt dafür" gescannt → Coverage 46%.
 *
 *  Dedup-Threshold von 100→500 Zeichen weil im selben Vote-Block manchmal
 *  Trigger UND Outcome-Statement beide das Pattern enthalten (z.B.
 *  "Wer stimmt dafür? – Dafür stimmen X. Wer stimmt für die Enthaltung?").
 */
export function extractVoteEvents(fullText: string): VoteEvent[] {
  const re = /Wer (?:stimmt|ist)\s+(?:da)?für\b/g;
  const allOffsets: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(fullText)) !== null) allOffsets.push(m.index);

  allOffsets.sort((a, b) => a - b);
  const dedup: number[] = [];
  for (const o of allOffsets) {
    const last = dedup[dedup.length - 1];
    if (last === undefined || o - last > 500) dedup.push(o);
  }

  const dsNrRe = /\bDrucksache(?:n)?\s+(\d{2})\s*\/\s*(\d{1,6})/gi;
  const events: VoteEvent[] = [];
  for (const offset of dedup) {
    const start = Math.max(0, offset - 500);
    const end = Math.min(fullText.length, offset + 1500);
    const snippet = fullText.slice(start, end);
    const nrs = new Set<string>();
    let dm: RegExpExecArray | null;
    const r = new RegExp(dsNrRe.source, "gi");
    while ((dm = r.exec(snippet)) !== null) {
      nrs.add(`${dm[1]}/${dm[2].padStart(4, "0")}`);
    }
    events.push({ offset, snippet, drucksache_nrn_prefiltered: [...nrs] });
  }
  return events;
}
