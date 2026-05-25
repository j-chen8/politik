/**
 * Prompts und Tool-Schemas für die Berlin-Drucksachen-LLM-Analyse.
 *
 * Architektur: analog Bundes-Pipeline (src/lib/drucksachen-prompts.ts) mit
 * Anthropic Tool-Use, ABER mit Berlin-spezifischen Anpassungen:
 *  - 4 Doc-Klassen (anfrage_antwort, antrag, gesetzentwurf, vorlage_senat)
 *  - Berlin-Topic-Tags (anders als Bundes — keine Bundeswehr/Außenpolitik etc.)
 *  - Berliner Sprache: "Senat von Berlin", "Senatsverwaltung", Bezirke
 *  - Schriftliche Anfrage + Antwort als EINHEIT (anders als Bundes wo getrennt)
 *  - Beschlussempfehlung: Regex-Label, kein LLM
 *
 * Bundes-Methodology-Lehren übernommen:
 *  - NEUTRALITY_BLOCK strikt
 *  - Tier-System (standard/long/massive)
 *  - Typ-spezifische Tonality-Enums
 *  - TOPIC_TAGS als geschlossenes Enum (Anti-Drift)
 */

export const PROMPT_VERSION = "berlin-v1.1";

const NEUTRALITY_BLOCK = `STRIKTE REGELN:
- Antworte ausschließlich auf Deutsch.
- Halte dich strikt an den vorgelegten Drucksachen-Text. Erfinde nichts.
- Verwende neutrale, faktenbasierte Sprache. KEINE bewertenden Adjektive ("gefährlich", "berechtigt", "skandalös", "vernünftig", "fragwürdig").
- KEINE Empfehlungen, KEINE Spekulationen über Sinnhaftigkeit, keine eigene Meinung.
- Behalte die Stimme der Drucksache: wenn eine Fraktion etwas fordert, schreibe "Die Fraktion fordert X" — niemals "berechtigterweise" / "fragwürdig".
- Schreibe in zugeschriebener Sprache: "laut Drucksache", "die Fragesteller verweisen auf", "der Senat antwortet, dass …".
- BERLIN-SPEZIFISCH: Verwende "der Senat von Berlin" / "die Senatsverwaltung für X" / "das Bezirksamt Y" — nicht "die Bundesregierung" / "das Ministerium".`;

// ─── BERLIN-TOPIC-TAGS v2 ──────────────────────────────────
// Empirisch validiert via N-Gramm-Analyse über 18.194 DS-Titel +
// 11.713 Reden-Frames. Schwelle: Tag-Token kommt in ≥30 Titeln vor.
// Geschlossenes Enum gegen Drift (Bundes-Lehre: ohne Enum erfindet LLM hunderte).
//
// v1.1-Änderungen gegenüber v1 (empirisch belegt):
// - Gestrichen (≤2 Titel): Mietrecht, Innere Sicherheit, Versammlungsrecht, Mittelstand, Umweltschutz, Kinderbetreuung
// - Hinzugefügt: Transparenz (230), Wahlrecht (Smoke-Test-Drift), Partizipation (Smoke-Test-Drift), Familie
// - Umbenannt: Soziales → Soziale Infrastruktur (klarer)
export const BERLIN_TOPIC_TAGS = [
  // Wohnen / Stadtentwicklung (Berlin-Kern-Thema)
  "Wohnen", "Stadtentwicklung", "Liegenschaften", "Bauplanung", "Denkmalschutz",
  // Mobilität / Verkehr (Berlin-stark)
  "Mobilität", "ÖPNV", "Radverkehr", "Verkehrssicherheit",
  // Bildung / Wissenschaft
  "Bildung", "Hochschulen", "Familie",
  // Polizei / Justiz / Sicherheit
  "Polizei", "Justiz", "Gewaltprävention",
  // Sozial / Gesundheit
  "Soziale Infrastruktur", "Gesundheit", "Pflege", "Wohnungslosigkeit", "Inklusion",
  // Wirtschaft / Arbeit
  "Wirtschaft", "Arbeitsmarkt", "Tourismus",
  // Klima / Umwelt
  "Klimaschutz", "Energie", "Tierschutz",
  // Verwaltung / Bezirke / Bürgernähe
  "Verwaltung", "Bezirke", "Digitalisierung", "Bürokratie", "Transparenz",
  // Demokratie / Bürgerrechte
  "Demokratie", "Wahlrecht", "Partizipation", "Datenschutz",
  "Antidiskriminierung", "Geschlechtergerechtigkeit", "Extremismus",
  // Finanzen / Haushalt
  "Finanzen", "Haushalt", "Steuern",
  // Kultur / Sport
  "Kultur", "Sport",
  // Migration / Integration
  "Migration", "Integration", "Geflüchtete",
  // Sonstiges
  "Sonstiges",
] as const;
export type BerlinTopicTag = (typeof BERLIN_TOPIC_TAGS)[number];

// ─── EIN System-Prompt pro Klasse (KEIN Tier-System mehr) ──────────────
//
// v1.1-Änderung: Tier-Variation entfernt → 1 System-Prompt pro Klasse statt 12.
// Grund: Tier-Variation verhindert Cache-Hit (5-Min-TTL × 12 verschiedene Prompts =
// 0 % Cache). Mit nur 4 Prompts wird Cache massiv greifen (Smoke-Test hatte 0 %
// Cache-Read; Vollauf mit Cache: ~$40 Einsparung).
//
// Längen-Vorgaben jetzt fix pro Klasse (Bundes hatte spezifische Tiers für Berichte
// mit 100+ Seiten — Berlin-DS sind mit 30k-Cap alle ähnlich lang nach Strip).

const SCHEMA_DISCIPLIN_BLOCK = `OUTPUT-DISZIPLIN — SEHR WICHTIG:
- Die kerninhalt/kerninhalt_frage/kerninhalt_antwort-Felder sind JSON-Arrays von Strings, KEIN XML, KEIN Newline-getrennter Text.
- Korrekt:   "kerninhalt": ["Erste Forderung", "Zweite Forderung", "Dritte Forderung"]
- Falsch:    "kerninhalt": "<item>Erste</item><item>Zweite</item>"
- Falsch:    "kerninhalt": "Erste Forderung\\nZweite Forderung"
- Auch bei kleinen DS (z.B. nur 1-2 Forderungen): Array mit 1-2 Elementen, NIE leerer String.
- Das thema-Feld akzeptiert AUSSCHLIESSLICH Tags aus der vorgegebenen Liste — wähle 1-3, erfinde keine.`;

const KERNINHALT_VS_ZUS = `ABGRENZUNG zusammenfassung ↔ kerninhalt:
- zusammenfassung = NARRATIVE Synthese, prose, mit Übergängen, lesbar als Text.
- kerninhalt = DISKRETE Liste konkreter Forderungen / Befunde / Antworten als Quick-Reference.
- Die kerninhalt-Bullets sollen KEINE Paraphrase der zusammenfassung sein, sondern atomare Einzelpositionen liefern.`;

// Klassen-unabhängiger System-Prompt — derselbe für alle 4 LLM-Klassen, damit
// ein einziger ephemeral-Cache-Eintrag genügt (v1.1-Refactor; spart ~3× cache_creation Tokens).
export function buildSystemPrompt(): string {
  return `Du analysierst eine Berlin-Drucksache (Abgeordnetenhaus, 19. Wahlperiode) für eine politische Transparenz-Plattform.

${NEUTRALITY_BLOCK}

LÄNGEN-VORGABEN (strikt einhalten):
- zusammenfassung: 80-150 Wörter (3-5 Sätze)
- kerninhalt-Bullets: max 25 Wörter je Bullet, prägnant
- weitere Textfelder (regelung/begruendung/auswirkung): 60-120 Wörter

${SCHEMA_DISCIPLIN_BLOCK}

${KERNINHALT_VS_ZUS}

Verwende die Antwort-Tools — keine Erklärungen außerhalb des Tool-Aufrufs.`;
}

const COMMON_FIELDS = {
  thema: {
    type: "array",
    items: { type: "string", enum: [...BERLIN_TOPIC_TAGS] },
    minItems: 1,
    maxItems: 3,
    description: 'JSON-Array von 1-3 Tags aus der vorgegebenen Liste. Beispiel: ["Wohnen", "Bezirke"]. KEINE neuen Tags erfinden.',
  },
} as const;

// ─── ANFRAGE_ANTWORT (Berlin-eigene Klasse: Schr. Anfrage MIT Senats-Antwort) ─
export const ANFRAGE_ANTWORT_USER_INSTRUCTION = `Analysiere diese Berliner Schriftliche Anfrage MIT zugehöriger Senats-Antwort (beides ist in der Drucksache enthalten). Bürger:innen sollen verstehen: WAS hat die Fraktion gefragt, WIE hat der Senat geantwortet, ist die Antwort substanziell oder ausweichend?`;

export const ANFRAGE_ANTWORT_TOOL = {
  name: "analyse_berlin_anfrage_antwort",
  description: "Analyse einer Berliner Schriftlichen Anfrage inkl. Senats-Antwort als Einheit.",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt_frage", "kerninhalt_antwort", "thema", "antwort_charakter"],
    properties: {
      zusammenfassung: {
        type: "string",
        description: "3–4 Sätze: (a) was wurde gefragt + von welcher Fraktion, (b) wie hat der Senat im Kern geantwortet (substanziell vs ausweichend)."
      },
      kerninhalt_frage: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
        description: 'JSON-Array von 1-5 Strings. Konkrete Fragen/Fragenbereiche, thematisch gruppiert. Beispiel: ["Wie hoch sind die Mietsteigerungen 2024?", "Welche Bezirke sind besonders betroffen?"]. KEIN XML, KEINE Newlines im String.'
      },
      kerninhalt_antwort: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
        description: 'JSON-Array von 1-5 Strings. Konkrete Antwort-Substanzen mit Zahlen/Bezirken oder Verweisen. Beispiel: ["Mietsteigerung 2024: 4,7 %", "Marzahn-Hellersdorf besonders betroffen", "Senat verweist auf Bezirksamt für Detail-Daten"]. KEIN XML.'
      },
      thema: COMMON_FIELDS.thema,
      antwort_charakter: {
        type: "string",
        enum: ["substantiell", "teilantwortend", "ausweichend"],
        description: "substantiell = konkrete Zahlen/Fakten zu allen Fragen; teilantwortend = manche Fragen offen oder verwiesen; ausweichend = v.a. Verweise auf Bezirke/Geheimhaltung/Datenlücken."
      },
      fraktion: { type: "string", description: "Initiierende Fraktion der Anfrage (z.B. 'GRÜNE', 'AfD', 'SPD', 'CDU', 'LINKE')." },
      senatsverwaltung: { type: "string", description: "Antwortende Senatsverwaltung (z.B. 'Inneres', 'Bildung Jugend Familie', 'Mobilität Verkehr Klimaschutz Umwelt'). Leer wenn nicht erkennbar." },
      bezirk_bezug: { type: "string", description: "Falls die Anfrage einen konkreten Bezirk betrifft (z.B. 'Friedrichshain-Kreuzberg', 'Marzahn-Hellersdorf'). Leer wenn berlinweit." },
    },
  },
};

// ─── ANTRAG (Berlin-Anträge der Fraktionen) ─────────────
export const ANTRAG_USER_INSTRUCTION = `Analysiere diesen Berliner Antrag einer Fraktion. Bürger:innen sollen in 3 Sätzen verstehen, was die Drucksache will und wer sie eingebracht hat.`;

export const ANTRAG_TOOL = {
  name: "analyse_berlin_antrag",
  description: "Analyse eines Berliner Antrags (CDU/SPD/GRÜNE/LINKE/AfD/FDP).",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt", "thema", "tonalitaet"],
    properties: {
      zusammenfassung: { type: "string", description: "2–3 neutrale Sätze: Was will der Antrag erreichen?" },
      kerninhalt: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
        description: 'JSON-Array von 1-5 Strings. Konkrete Forderungen als Stichpunkte. Beispiel: ["Tempo 30 auf allen Hauptverkehrsstraßen einführen", "Schulwege barrierefrei umbauen"]. KEIN XML, KEINE Newlines.'
      },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "fordernd", "kritisch", "informierend"],
        description: "Grundton: sachlich (neutral), fordernd (klare Maßnahmen), kritisch (Senat-Kritik), informierend (Kenntnisnahme)."
      },
      fraktion: { type: "string", description: "Initiierende Fraktion." },
      adressat: {
        type: "string",
        description: "Wer soll handeln? 'Senat', 'Bezirksamt X', 'Bundesregierung' (Berlin im Bundesrat), 'Abgeordnetenhaus'."
      },
    },
  },
};

// ─── GESETZENTWURF (Vorlage zur Beschlussfassung) ───────
export const GESETZENTWURF_USER_INSTRUCTION = `Analysiere diesen Berliner Gesetzentwurf. Bürger:innen sollen verstehen, was geregelt werden soll und wen es betrifft.`;

export const GESETZENTWURF_TOOL = {
  name: "analyse_berlin_gesetzentwurf",
  description: "Analyse eines Berliner Gesetzentwurfs (Senat oder Fraktion).",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "regelung", "begruendung", "thema", "tonalitaet"],
    properties: {
      zusammenfassung: { type: "string", description: "3–5 neutrale Sätze: Was wird geregelt?" },
      regelung: { type: "string", description: "Was wird konkret neu festgelegt. 2–4 Sätze." },
      begruendung: { type: "string", description: "Die offizielle Begründung des Entwurfs. 2–4 Sätze." },
      auswirkung: { type: "string", description: "In der Drucksache genannte Folgen / Kosten / betroffene Gruppen. Leer wenn nicht genannt." },
      betroffene_gruppen: { type: "string", description: "Konkrete Gruppen (z.B. 'Mieter:innen in Bezirk X', 'Studierende', 'Polizeibeamt:innen'). Leer wenn nicht klar." },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "fordernd", "kritisch"],
      },
      einbringer: { type: "string", description: "Senat oder einbringende Fraktion (z.B. 'Senat', 'CDU/SPD-Koalition', 'GRÜNE-Fraktion')." },
    },
  },
};

// ─── VORLAGE_SENAT (Vorlage zur Kenntnisnahme / Mitteilung / Verordnung / Unterrichtung) ─
export const VORLAGE_SENAT_USER_INSTRUCTION = `Analysiere diese Vorlage des Berliner Senats. Bürger:innen sollen verstehen, worum es geht und welche Art Dokument das ist.`;

export const VORLAGE_SENAT_TOOL = {
  name: "analyse_berlin_vorlage_senat",
  description: "Analyse einer Senats-Vorlage (zur Kenntnisnahme, Mitteilung, Verordnung, Unterrichtung).",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt", "thema", "dokumenttyp"],
    properties: {
      zusammenfassung: { type: "string", description: "3–5 neutrale Sätze." },
      kerninhalt: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
        description: 'JSON-Array von 1-5 Strings. Zentrale Aussagen oder Verfahrenshinweise. Beispiel: ["3,2 Mio Euro Stabilisierungshilfe", "Förderung läuft Q4 2024 aus"]. KEIN XML.'
      },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "informierend"],
      },
      dokumenttyp: {
        type: "string",
        description: "Kurz: 'Bericht', 'Verordnung', 'Mitteilung zur Kenntnisnahme', 'Zwischenbericht', etc."
      },
      senatsverwaltung: { type: "string", description: "Vorlegende Senatsverwaltung. Leer wenn nicht klar." },
    },
  },
};

// ─── REGISTRY ────────────────────────────────────────
export const PROMPTS_BY_CLASS = {
  anfrage_antwort: { instruction: ANFRAGE_ANTWORT_USER_INSTRUCTION, tool: ANFRAGE_ANTWORT_TOOL, cap_chars: 60000 },  // ~15k tokens
  antrag:          { instruction: ANTRAG_USER_INSTRUCTION,          tool: ANTRAG_TOOL,          cap_chars: 24000 },  // ~6k tokens
  gesetzentwurf:   { instruction: GESETZENTWURF_USER_INSTRUCTION,   tool: GESETZENTWURF_TOOL,   cap_chars: 120000 }, // ~30k tokens
  vorlage_senat:   { instruction: VORLAGE_SENAT_USER_INSTRUCTION,   tool: VORLAGE_SENAT_TOOL,   cap_chars: 120000 }, // ~30k tokens
} as const;

export type BerlinBatchClass = keyof typeof PROMPTS_BY_CLASS;

/** Boilerplate-Strip vor LLM-Call: spart 12-30 % Tokens je nach DS-Größe. */
export function stripBoilerplate(text: string): string {
  // Anker "Im Namen des Senats von Berlin beantworte ich" matcht in 99,8 % der Anfragen
  const ankerIdx = text.indexOf("Im Namen des Senats von Berlin beantworte ich");
  let stripped = text;
  if (ankerIdx > 0) {
    // Schneide den Header (bis nach dem Anker-Satz + ggf. Vorbemerkung)
    const ankerEnd = ankerIdx + "Im Namen des Senats von Berlin beantworte ich Ihre Schriftliche Anfrage wie folgt:".length;
    stripped = stripped.slice(ankerEnd);
  }
  // Page-Marker "-- N of M --" + die folgenden 4-6 Header-Zeilen pro Seite raus
  stripped = stripped.replace(/--\s*\d+\s+of\s+\d+\s*--[\s\S]{0,300}?(?=\n[A-ZÄÖÜ]|\n\d|\n$)/g, "\n");
  // Multi-Whitespace normalisieren
  return stripped.replace(/\n{3,}/g, "\n\n").trim();
}

/** Cap auf max Zeichen (vor LLM-Call). */
export function capText(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}

/**
 * Metadaten zu einer 'Antwort'-DS, optional übergeben für Edge-Case-Routing.
 * Empirie (politik.db Stand 2026-05-23, 16.660 Antwort-DS):
 *   - 15.886 (95,4 %) haben Anfrage-Counterpart via vorgang_id
 *   - 15.863 davon (99,86 %) sind byte-identisch zur Anfrage  → skip (LLM analysiert die Anfrage-DS)
 *   -    774 (4,6 %)  sind orphan (kein Anfrage-Counterpart)  → NICHT skippen, sonst Datenverlust
 *   -      6 (0,04 %) sind länger als die Anfrage             → NICHT skippen (Anfrage hat keinen Antworttext)
 */
export interface AntwortMeta {
  hasAnfrageCounterpart: boolean;  // gibt's ein anderes Doc mit gleicher vorgang_id und dok_typ='Schriftliche Anfrage'?
  antwortIsLongerThanAnfrage: boolean;  // chars(antwort) > chars(anfrage) * 1.1 — heißt: Anfrage-DS enthält den Antworttext nicht
}

/** Klassifikation: welche Klasse passt zu einem Doc-Typ-Label?
 *  Für dok_typ_label='Antwort' kann optional antwortMeta mitgegeben werden,
 *  um orphan / längen-Mismatch korrekt zu routen statt blind zu skippen. */
export function classifyBerlinDoc(
  dok_typ_label: string | null,
  antwortMeta?: AntwortMeta,
): BerlinBatchClass | "beschlussempfehlung_skip" | "skip" {
  if (!dok_typ_label) return "skip";
  const t = dok_typ_label;
  if (t === "Schriftliche Anfrage") return "anfrage_antwort";
  if (t === "Antwort") {
    // Default (ohne Meta): konservativ skip — alte Pipelines verlassen sich darauf.
    if (!antwortMeta) return "skip";
    // Orphan oder Antwort substanziell länger → Anfrage-DS enthält den Antworttext NICHT,
    // also als standalone Doc analysieren.
    if (!antwortMeta.hasAnfrageCounterpart || antwortMeta.antwortIsLongerThanAnfrage) return "anfrage_antwort";
    return "skip"; // Duplikat zur Schriftlichen Anfrage
  }
  if (t === "Antrag" || t === "Antrag (Gesetzentwurf)" || t === "Änderungsantrag") return "antrag";
  if (t === "Vorlage zur Beschlussfassung" || t === "Vorlage zur Beschlussfassung (Gesetzentwurf)") return "gesetzentwurf";
  if (t === "Vorlage zur Kenntnisnahme" || t === "Verordnung" || t === "Mitteilung zur Kenntnisnahme" ||
      t === "Mitteilung zur Kenntnisnahme (Zwischenbericht)" || t === "Mitteilung zur Kenntnisnahme (Schlussbericht)" ||
      t === "Unterrichtung") return "vorlage_senat";
  if (t === "Beschlussempfehlung") return "beschlussempfehlung_skip"; // Regex-Label, kein LLM
  if (t === "Wahlvorschlag") return "skip"; // Administrativ
  return "skip";
}

// ─── KLASSEN-SPEZIFISCHE TONALITY-ENUMS (für Retrieve-Validation) ────────
// Single source of truth — falls Tool-Schemas geändert werden, hier mitziehen.
// Bundes-Reden-Lehre: trotz JSON-Schema-Enum entstanden ~0,3 % Drift bei Tool-Use.
// Daher: im Retrieve gegen diese Enums prüfen und Drift in tonalitaet_drift speichern.
export const TONALITY_ENUMS_BY_CLASS = {
  anfrage_antwort: { field: "antwort_charakter", allowed: ["substantiell", "teilantwortend", "ausweichend"] as const },
  antrag:          { field: "tonalitaet",        allowed: ["sachlich", "fordernd", "kritisch", "informierend"] as const },
  gesetzentwurf:   { field: "tonalitaet",        allowed: ["sachlich", "fordernd", "kritisch"] as const },
  vorlage_senat:   { field: "tonalitaet",        allowed: ["sachlich", "informierend"] as const },
} as const;

// Kuratierte Tippfehler-Korrekturen aus Stage-1-Empirie.
// LLM produziert semantisch korrekte aber orthografisch leicht abweichende Werte.
// Erweitern wenn neue Varianten in späteren Batches auftauchen.
const TONALITY_ALIASES: Record<string, string> = {
  teilanswortend: "teilantwortend",
  substanziell: "substantiell",
};

/** Liest das klassen-spezifische Tonality-Feld aus dem LLM-Output und validiert gegen Enum.
 *  Liefert { value, drift }:
 *    - value: Enum-konformer Wert (wird in tonalitaet-Spalte gespeichert)
 *    - drift: rohe LLM-Antwort, wenn sie NICHT im Enum ist (wird in tonalitaet_drift-Spalte gespeichert)
 *  Genau eine der beiden ist non-null pro Aufruf. */
export function validateTonalitaet(
  klasse: BerlinBatchClass,
  rawAnalysis: Record<string, unknown> | null | undefined,
): { value: string | null; drift: string | null } {
  if (!rawAnalysis) return { value: null, drift: null };
  const { field, allowed } = TONALITY_ENUMS_BY_CLASS[klasse];
  const raw = rawAnalysis[field];
  if (typeof raw !== "string" || !raw.trim()) return { value: null, drift: null };
  const normalized = raw.trim().toLowerCase();
  if ((allowed as readonly string[]).includes(normalized)) return { value: normalized, drift: null };
  // Tippfehler-Korrektur über kuratiertes Alias-Mapping
  const aliased = TONALITY_ALIASES[normalized];
  if (aliased && (allowed as readonly string[]).includes(aliased)) return { value: aliased, drift: null };
  return { value: null, drift: raw };
}

/** Tolerante Array-Parse: akzeptiert nativen Array ODER stringifiziertes JSON-Array.
 *  Stage-1-Empirie: 3 % der LLM-Outputs senden Array als JSON-String — semantisch korrekt, falsch serialisiert.
 *  Liefert { items, wasStringified }: wasStringified=true → kein Schema-Bug (war korrigierbar). */
export function safeParseArray(raw: unknown): { items: string[]; wasStringified: boolean; isHardBug: boolean } {
  if (Array.isArray(raw)) {
    return { items: raw.filter((x): x is string => typeof x === "string" && !!x.trim()), wasStringified: false, isHardBug: false };
  }
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    // Versuch 1: direkt parsen
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { items: parsed.filter((x): x is string => typeof x === "string" && !!x.trim()), wasStringified: true, isHardBug: false };
      }
    } catch { /* fall-through */ }
    // Versuch 2: typographische Quotes („…") sanitisieren — Stage-1-Empirie:
    // LLM mischt deutsche Quotation Marks in String-Werte, was JSON.parse bricht.
    const sanitized = raw
      .replace(/[„""‚'']/g, "'")  // typographische Doublequotes/Singlequotes → '
      .replace(/[ ]/g, " ");   // NBSP → space
    try {
      const parsed = JSON.parse(sanitized);
      if (Array.isArray(parsed)) {
        return { items: parsed.filter((x): x is string => typeof x === "string" && !!x.trim()), wasStringified: true, isHardBug: false };
      }
    } catch { /* fall-through */ }
    // Versuch 3: Regex-Split bei `", "`-Trennern. LLM lässt manchmal innere Quotes
    // unescaped (typografisch oder ASCII), was Versuch 1+2 brechen. Heuristik:
    // outer `["..."]` strippen, dann an `"\s*,\s*"` splitten.
    const inner = sanitized.replace(/^\s*\[\s*['"]/, "").replace(/['"]\s*\]\s*$/, "");
    const parts = inner.split(/['"]\s*,\s*['"]/);
    const items = parts.map((p) => p.trim()).filter((p) => p.length >= 5);
    if (items.length >= 1) {
      return { items, wasStringified: true, isHardBug: false };
    }
  }
  return { items: [], wasStringified: false, isHardBug: raw !== undefined && raw !== null };
}

/** Validiert thema-Array gegen BERLIN_TOPIC_TAGS-Enum.
 *  Liefert { themen, drift }:
 *    - themen: Liste Enum-konformer Tags (in thema_json speichern)
 *    - drift: Liste der Tags, die NICHT im Enum sind (in topic_drift_json speichern, für v2-Kuration) */
export function validateThemen(
  rawAnalysis: Record<string, unknown> | null | undefined,
): { themen: string[]; drift: string[] } {
  if (!rawAnalysis) return { themen: [], drift: [] };
  const raw = rawAnalysis.thema;
  if (!Array.isArray(raw)) return { themen: [], drift: [] };
  const glossar = new Set<string>(BERLIN_TOPIC_TAGS);
  const themen: string[] = [];
  const drift: string[] = [];
  for (const t of raw) {
    if (typeof t !== "string" || !t.trim()) continue;
    if (glossar.has(t)) themen.push(t);
    else drift.push(t);
  }
  return { themen, drift };
}

/** SQL-Helper: einmaliger Pre-Pass über alle Antwort-DS, liefert eine Map dbid → AntwortMeta.
 *  Wird vom Batch-Builder verwendet, um den Edge-Case-Fix anzuwenden.
 *  Liefert nur Einträge für 'Antwort'-DS (16.660 Rows, in-memory ~1 MB). */
export function buildAntwortMetaMap(db: import("better-sqlite3").Database): Map<string, AntwortMeta> {
  const rows = db.prepare(`
    SELECT
      a.dbid,
      a.vorgang_id,
      t_a.chars AS a_chars,
      (SELECT q.dbid FROM berlin_documents q
       WHERE q.vorgang_id = a.vorgang_id AND q.dok_typ_label='Schriftliche Anfrage' AND q.dbid != a.dbid LIMIT 1) AS q_dbid,
      (SELECT t_q.chars FROM berlin_documents q
       JOIN berlin_pdf_texts t_q ON q.lok_url=t_q.lok_url
       WHERE q.vorgang_id = a.vorgang_id AND q.dok_typ_label='Schriftliche Anfrage' AND q.dbid != a.dbid LIMIT 1) AS q_chars
    FROM berlin_documents a
    LEFT JOIN berlin_pdf_texts t_a ON a.lok_url = t_a.lok_url
    WHERE a.dok_typ_label = 'Antwort'
  `).all() as { dbid: string; a_chars: number | null; q_dbid: string | null; q_chars: number | null }[];
  const map = new Map<string, AntwortMeta>();
  for (const r of rows) {
    map.set(r.dbid, {
      hasAnfrageCounterpart: r.q_dbid !== null,
      antwortIsLongerThanAnfrage: r.q_chars !== null && r.a_chars !== null && r.a_chars > r.q_chars * 1.1,
    });
  }
  return map;
}
