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

export const PROMPT_VERSION = "berlin-v1.4";

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

const ANTI_HALLUZINATION_BLOCK = `ANTI-HALLUZINATIONS-HEURISTIKEN (H1-H6) — bei Konflikt mit Eleganz immer Treue wählen:
H1: Erfinde KEINE konstruktiven Forderungen die nicht in der DS stehen. Wenn eine Fraktion kritisiert ohne Alternative zu bieten, schreibe das so — kein „bietet stattdessen X" wenn X nicht da ist.
H2: Behalte Polemik im Original-Wortlaut wenn relevant („Abzocke", „Skandal" — wörtlich zugeschrieben), sanitisiere nicht zu „Bedenken" oder „Kritik".
H3: Multi-Punkt-Vollständigkeit — bei Anträgen mit 8 Forderungen alle 8 in kerninhalt, nicht nur die ersten 3.
H4: Ausweichende Antworten sind eine Position — wenn der Senat verweist statt antwortet, halte das fest („verweist auf Bezirksamt", „Verfahren läuft noch"). Erfinde keine konkrete Antwort wo keine ist.
H5: „Wir werden tun"-Rhetorik des Senats: kennzeichne als Vorhaben, nicht als getätigte Maßnahme.
H6: Konkrete Zahlen sind Anker. Wenn die DS Statistiken nennt, übernimm sie in zusammenfassung/kerninhalt mit der Original-Zahl, nicht „mehrere" oder „einige".`;

const BERLIN_VOKABULAR_BLOCK = `BERLIN-AKTEURE-VOKABULAR (Berliner Politik hat eigene Begriffe, NICHT mit Bundes-Vokabular vermischen):
- „der Senat von Berlin" / „der Senat" (Berliner Landesregierung — NICHT „die Bundesregierung")
- „die Senatsverwaltung für X" / „SenX" (Berliner Ministerien — NICHT „das Bundesministerium")
- „das Abgeordnetenhaus von Berlin" (Landesparlament — NICHT „der Bundestag")
- „das Bezirksamt Y" / „Bezirksverwaltung Y" (12 Berliner Bezirke als handelnde Stelle)
- „die Regierende Bürgermeisterin / der Regierende Bürgermeister"
- Fraktionen im Abgeordnetenhaus: CDU, SPD, GRÜNE, LINKE, AfD, FDP (Short-Form bevorzugen, NICHT „Bündnis 90/Die Grünen" oder „Die Linke" ausschreiben)
- Bezirke: Mitte, Friedrichshain-Kreuzberg, Pankow, Charlottenburg-Wilmersdorf, Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Neukölln, Treptow-Köpenick, Marzahn-Hellersdorf, Lichtenberg, Reinickendorf`;

const TOPIC_GLOSSAR_BLOCK = `BERLIN-TOPIC-GLOSSAR (47 Tags, geschlossenes Enum — KEINE neuen Tags erfinden):
- Wohnen / Stadtentwicklung: Wohnen, Stadtentwicklung, Liegenschaften, Bauplanung, Denkmalschutz
- Mobilität / Verkehr: Mobilität, ÖPNV, Radverkehr, Verkehrssicherheit
- Bildung / Wissenschaft: Bildung, Hochschulen, Familie
- Polizei / Justiz / Sicherheit: Polizei, Justiz, Gewaltprävention
- Sozial / Gesundheit: Soziale Infrastruktur, Gesundheit, Pflege, Wohnungslosigkeit, Inklusion
- Wirtschaft / Arbeit: Wirtschaft, Arbeitsmarkt, Tourismus
- Klima / Umwelt: Klimaschutz, Energie, Tierschutz
- Verwaltung / Bezirke: Verwaltung, Bezirke, Digitalisierung, Bürokratie, Transparenz
- Demokratie / Bürgerrechte: Demokratie, Wahlrecht, Partizipation, Datenschutz, Antidiskriminierung, Geschlechtergerechtigkeit, Extremismus
- Finanzen / Haushalt: Finanzen, Haushalt, Steuern
- Kultur / Sport: Kultur, Sport
- Migration / Integration: Migration, Integration, Geflüchtete
- Catch-all (sparsam verwenden!): Sonstiges
Wähle 1-3 Tags pro DS. Wenn das thematische Cluster nicht passt, lieber „Sonstiges" als ein erfundenes Tag.`;

const STRUKT_META_HINWEIS = `WICHTIG bei STRUKTURIERTE METADATEN-Block in der User-Message:
Wenn der Block am Anfang der User-Message Felder vorgibt (Fraktion, Senatsverwaltung, Datum, Bezirk-Hint), VERWENDE diese Werte in deinen Output-Feldern statt sie im Boilerplate-gestrippten Text zu suchen — der Strip schneidet den DS-Header weg, der Header-Block hat die Info schon extrahiert.
Wenn der Block leer ist oder ein Feld nicht enthält, extrahiere selbst aus dem Volltext.
Bezirks-Hint ist ein KANDIDAT — übernimm ihn als bezirk_bezug nur wenn der DS-Volltext den Bezug bestätigt.`;

const FRAKTION_DISZIPLIN_BLOCK = `FRAKTION-FELD-DISZIPLIN — sehr wichtig:
- Erlaubte Werte: ausschließlich CDU, SPD, GRÜNE, LINKE, AfD, FDP, "fraktionslos", "parteilos" — KEINE Long-Form ("Bündnis 90/Die Grünen" → schreibe "GRÜNE", "Die Linke" → schreibe "LINKE").
- Bei Koalitions-/Multi-Fraktions-Anträgen: mit " + " zusammenführen, kurze Schreibweise, z.B. "CDU + SPD" oder "GRÜNE + LINKE".
- Wenn die DS keine Fraktion erkennbar enthält (z.B. fraktionsloser Abgeordneter ohne Fraktions-Klammer im Header): lass das Feld LEER. Erfinde NIEMALS einen Wert. Schreibe insbesondere keine Daten, Adressen oder Namen ins fraktion-Feld.
- Beispiel KORREKT: "GRÜNE"     |     "CDU + SPD + FDP"     |     ""     |     "fraktionslos"
- Beispiel FALSCH:  "Bündnis 90/Die Grünen"   |   "Fraktion CDU"   |   "Eingang beim Abgeordnetenhaus am DATUM"   |   "AfD-Fraktion"`;

const BEZIRKS_DISZIPLIN_BLOCK = `BEZIRKS-FELD-DISZIPLIN (nur für anfrage_antwort):
- Nur befüllen, wenn die Anfrage einen KONKRETEN Berliner Bezirk thematisch betrifft (z.B. "Schulen in Reinickendorf"). Berlin-weite Anfragen → Feld LEER.
- Erlaubte Werte: exakt einer der 12 Bezirke (Mitte, Friedrichshain-Kreuzberg, Pankow, Charlottenburg-Wilmersdorf, Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Neukölln, Treptow-Köpenick, Marzahn-Hellersdorf, Lichtenberg, Reinickendorf). Multi-Bezirks-Anfragen → Komma-Liste.
- Wenn der STRUKTURIERTE-METADATEN-Block einen Bezirks-Hint vorgibt, übernimm ihn NUR, wenn der DS-Volltext den Bezug auch wirklich bestätigt (nicht jede Erwähnung eines Stadtteils = primärer Bezug).
- Stadtteile (z.B. "Kreuzberg") → übergeordneter Bezirk verwenden ("Friedrichshain-Kreuzberg").`;

const ZUSAMMENFASSUNG_QUALITAETSKRITERIEN = `ZUSAMMENFASSUNGS-QUALITÄT — vor dem Schreiben prüfen:
- Nennt konkrete Zahlen / Bezirke / Beträge, wenn die DS welche liefert? (Treue vor Eleganz, H6)
- Vermeidet Floskeln ("der Senat plant Maßnahmen zur Verbesserung der Lage")?
- Identifiziert beide Seiten klar: WER (Fraktion / Senat) sagt WAS?
- Bei anfrage_antwort: Ist klar, ob der Senat substanziell, teilantwortend oder ausweichend geantwortet hat?
- Bei Anträgen: Ist die zentrale Forderung in den ersten 1-2 Sätzen?
- Bei Gesetzentwürfen: Ist die Regelung in den ersten 2 Sätzen, die Begründung danach?
- Keine Bewertung — nur Wiedergabe. Nicht "der Senat schiebt sich vor der Antwort", sondern "der Senat verweist auf bezirkliche Zuständigkeit".`;

const FEWSHOT_BEISPIELE = `FEW-SHOT-BEISPIELE — Format-Kalibrierung:

Beispiel 1 — anfrage_antwort, Senat antwortet substantiell:
  zusammenfassung: "Die SPD-Fraktion fragte nach Zugriffszahlen, Registrierungen und Barrierefreiheit des Kita-Navigators. Der Senat antwortete substantiell mit konkreten Statistiken (Ø 370 tägliche Zugriffe 2021, 210.000 Anfragen seit Start 2019) und erklärte Datenpflege-Verpflichtungen der Träger. Die Behebung der Barrierefreiheits-Mängel ist für H1 2022 angekündigt."
  thema: ["Bildung","Digitalisierung","Familie"]
  antwort_charakter: "substantiell"
  fraktion: "SPD"
  senatsverwaltung: "Bildung, Jugend und Familie"
  bezirk_bezug: ""  // berlin-weit

Beispiel 2 — antrag, fordernde Tonalität, Multi-Koalition:
  zusammenfassung: "Die CDU/SPD-Koalition fordert den Senat auf, eine Berliner Mobilitätsoffensive 2030 aufzulegen mit Fokus auf Tram-Netz-Ausbau in den Außenbezirken, Modernisierung der S-Bahn-Knoten und Erhöhung der Radwegekapazität auf Hauptverkehrsstraßen. Konkret werden 12 neue Tram-Strecken bis 2030 und 200 km zusätzliche Radwege verlangt."
  kerninhalt: ["12 neue Tram-Strecken bis 2030 in den Außenbezirken", "Modernisierung S-Bahn-Knoten Spandau, Hauptbahnhof, Ostkreuz", "200 km zusätzliche Radwege auf Hauptverkehrsstraßen"]
  thema: ["Mobilität","ÖPNV","Radverkehr"]
  tonalitaet: "fordernd"
  fraktion: "CDU + SPD"
  adressat: "Senat"`;

// Klassen-unabhängiger System-Prompt — derselbe für alle 4 LLM-Klassen, damit
// ein einziger ephemeral-Cache-Eintrag genügt (v1.1-Refactor; spart ~3× cache_creation Tokens).
// v1.3: Auf ≥1024 Tokens gestreckt (Anthropic-Haiku-Cache-Minimum) durch
// inhaltlich nützliche Blöcke (Glossar/Anti-Halluzination/Berlin-Vokabular/Meta-Hint),
// nicht durch Filler. Stage-1-v1.2-Empirie: ohne diese Länge fiel cache_read auf 0 %.
export function buildSystemPrompt(): string {
  return `Du analysierst eine Berlin-Drucksache (Abgeordnetenhaus, 19. Wahlperiode) für eine politische Transparenz-Plattform.

${NEUTRALITY_BLOCK}

LÄNGEN-VORGABEN (strikt einhalten):
- zusammenfassung: 80-150 Wörter (3-5 Sätze)
- kerninhalt-Bullets: max 25 Wörter je Bullet, prägnant
- weitere Textfelder (regelung/begruendung/auswirkung): 60-120 Wörter

${SCHEMA_DISCIPLIN_BLOCK}

${KERNINHALT_VS_ZUS}

${BERLIN_VOKABULAR_BLOCK}

${TOPIC_GLOSSAR_BLOCK}

${ANTI_HALLUZINATION_BLOCK}

${FRAKTION_DISZIPLIN_BLOCK}

${BEZIRKS_DISZIPLIN_BLOCK}

${ZUSAMMENFASSUNG_QUALITAETSKRITERIEN}

${FEWSHOT_BEISPIELE}

${STRUKT_META_HINWEIS}

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
 *  um orphan / längen-Mismatch korrekt zu routen statt blind zu skippen.
 *  dok_art_label='Plenarprotokoll' / 'Ausschussprotokoll' → immer skip
 *  (Stage-1-Empirie: 767 'Antwort'+'Plenarprotokoll'-DS sind Mündliche-Anfragen-
 *   Antworten und gehören in die Reden-Pipeline, nicht in die DS-LLM-Pipeline). */
export function classifyBerlinDoc(
  dok_typ_label: string | null,
  dok_art_label?: string | null,
  antwortMeta?: AntwortMeta,
): BerlinBatchClass | "beschlussempfehlung_skip" | "skip" {
  if (!dok_typ_label) return "skip";
  if (dok_art_label && dok_art_label !== "Drucksache") return "skip";
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

// ─── XML-Tag-Drift-Cleanup ──────────────────────────────────
// Stage-1-v1.4-Empirie: ~10 % der antrag/gesetzentwurf/vorlage_senat haben einen
// "</fieldname>\n<parameter name=...>"-Suffix in einem Text-Output-Feld. Der LLM
// streamt das nächste Tool-Use-Argument als XML in den Vorgänger-String.
// Folgen: Suffix-Müll im Text-Feld + Folge-Feld bleibt leer.
// Fix: Suffix abschneiden + Folge-Feld aus dem Suffix rekonstruieren.
const DS_OUTPUT_FIELDS = [
  "zusammenfassung", "kerninhalt", "kerninhalt_frage", "kerninhalt_antwort",
  "regelung", "begruendung", "auswirkung", "betroffene_gruppen",
  "thema", "tonalitaet", "antwort_charakter",
  "fraktion", "adressat", "senatsverwaltung", "bezirk_bezug",
  "dokumenttyp", "einbringer",
] as const;

/** Schneidet ein "</fieldname>...."-Suffix ab, falls fieldname ein bekanntes Output-Feld ist.
 *  Liefert den Vor-Tag-Wert (trimmed) oder unverändert wenn kein Drift. */
export function cleanTagDrift(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  for (const f of DS_OUTPUT_FIELDS) {
    const tag = `</${f}>`;
    const idx = value.indexOf(tag);
    if (idx >= 0) return value.slice(0, idx).trim();
  }
  // Generisch: irgendein closing-Tag gefolgt von neuem <parameter name=…>
  const m1 = value.match(/^([\s\S]*?)<\/[a-z_]+>\s*<parameter\s+name=/i);
  if (m1) return m1[1].trim();
  // Generisch: closing-Tag + <invoke>/<\/invoke> (LLM zitiert fremdes Schema)
  const m2 = value.match(/^([\s\S]*?)<\/[a-z_]+>\s*<\/?invoke/i);
  if (m2) return m2[1].trim();
  return value;
}

/** Extrahiert ein durch XML-Drift weggespültes Folge-Feld aus dem Sister-Field-String.
 *  Pattern: "...</zusammenfassung>\n<parameter name=\"kerninhalt\">[...]"
 *  Liefert den geparsten Wert (Array für JSON-Listen, String sonst) oder null. */
export function extractDriftedField(value: string | null | undefined, targetField: string): unknown {
  if (!value || typeof value !== "string") return null;
  const re = new RegExp(`<parameter\\s+name=["']${targetField}["']\\s*>\\s*([\\s\\S]*?)(?:</parameter>|<\\/?[a-z_]+>|$)`, "i");
  const m = value.match(re);
  if (!m) return null;
  const content = m[1].trim();
  if (content.startsWith("[")) {
    try { return JSON.parse(content); } catch { /* fall through */ }
  }
  return content || null;
}

/** Wendet cleanTagDrift + extractDriftedField auf eine komplette LLM-Analysis-Struktur an.
 *  In-place-Mutation: gedriftete Felder werden gecleant, fehlende Felder aus Drift-Suffixen rekonstruiert.
 *  Liefert Anzahl reparierter Felder (zur Telemetrie). */
export function applyTagDriftFix(analysis: Record<string, unknown>): { cleaned: number; rescued: number } {
  let cleaned = 0, rescued = 0;
  // Pass 1: Folge-Felder rekonstruieren BEVOR die Suffixe gecleant werden
  for (const f of DS_OUTPUT_FIELDS) {
    const cur = analysis[f];
    if (cur !== null && cur !== undefined && cur !== "") continue;
    // Suche in anderen Feldern nach <parameter name="f">-Suffix
    for (const other of DS_OUTPUT_FIELDS) {
      if (other === f) continue;
      const otherVal = analysis[other];
      if (typeof otherVal !== "string") continue;
      const rescuedVal = extractDriftedField(otherVal, f);
      if (rescuedVal !== null && rescuedVal !== "" && !(Array.isArray(rescuedVal) && rescuedVal.length === 0)) {
        analysis[f] = rescuedVal;
        rescued++;
        break;
      }
    }
  }
  // Pass 2: Suffixe abschneiden
  for (const f of DS_OUTPUT_FIELDS) {
    const cur = analysis[f];
    if (typeof cur !== "string") continue;
    const cleanedVal = cleanTagDrift(cur);
    if (cleanedVal !== cur) {
      analysis[f] = cleanedVal;
      cleaned++;
    }
  }
  return { cleaned, rescued };
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

// ─── Fraktions-Normalisierung ────────────────────────────────
// Stage-1-Empirie: Anträge enthalten Fraktionen in Long-Form ("Bündnis 90/Die Grünen"),
// Anfragen in Short-Form ("GRÜNE"). Auf gemeinsame Schreibweise zwingen, sonst sind
// Aggregationen über Fraktion × Topic × Zeit (Hofmann-Frage) durch Drift verzerrt.
const FRAKTION_NORMALIZE: Record<string, string> = {
  "bündnis 90/die grünen": "GRÜNE",
  "bündnis 90 / die grünen": "GRÜNE",
  "die grünen": "GRÜNE",
  "grüne": "GRÜNE",
  "die linke": "LINKE",
  "linke": "LINKE",
  "spd": "SPD",
  "cdu": "CDU",
  "afd": "AfD",
  "fdp": "FDP",
};

// Strict-Whitelist: nur diese Werte (plus Multi-Fraktion-Combos) dürfen in die fraktion-Spalte.
// LLM hat in v1.3-Empirie bei fraktionslosen Abgeordneten ein Datum als Fraktion halluziniert
// ("Eingang beim Abgeordnetenhaus am 22. Februar 2024"). Pass-Through ohne Filter ließ das durch.
const FRAKTION_WHITELIST = new Set(["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP", "fraktionslos", "parteilos"]);

/** Normalisiert Fraktions-String auf Short-Form-Enum. Strict: nicht-erkannte Werte → null.
 *  Multi-Fraktion via " und " oder "," → " + "-getrennt. */
export function normalizeFraktion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed || /^[<\-—]+$|^unknown$/i.test(trimmed)) return null;
  const lower = trimmed.toLowerCase();
  if (FRAKTION_NORMALIZE[lower]) return FRAKTION_NORMALIZE[lower];
  if (FRAKTION_WHITELIST.has(trimmed)) return trimmed;
  // Multi-Fraktion: split auf " und " / "," / " + " — Koalitions-/Mehr-Fraktions-Anträge
  // LLM gibt nach v1.4-Prompt "GRÜNE + LINKE" zurück — Plus-Splitter sonst → null
  if (/\s+und\s+|,|\s+\+\s+/.test(trimmed)) {
    const parts = trimmed.split(/\s+und\s+|,|\s+\+\s+/).map((p) => normalizeFraktion(p)).filter((p): p is string => !!p);
    if (parts.length >= 1) return [...new Set(parts)].join(" + ");
  }
  // Strict: alles andere wird gefiltert (z.B. halluzinierte Datumstrings)
  return null;
}

// ─── Header-Meta-Extraktion (Pre-Strip) ──────────────────────
// Stage-1-Empirie: stripBoilerplate schneidet bei "Im Namen des Senats…" (Pos ~700)
// alles davor weg — inkl. Fraktion-Header. Resultat: 52 % Fraktion-Miss bei
// Schriftlichen Anfragen. Fix: Meta VOR Strip extrahieren, dem LLM als strukturierten
// Block mitgeben.
export interface HeaderMeta {
  fraktion: string | null;
  abgeordnete: string | null;
  senatsverwaltung: string | null;
  datum_anfrage: string | null;
  bezirk_hint: string | null;
}

// 12 Berliner Bezirke (offizielle Schreibweise) — für Titel-Match
const BEZIRKE = [
  "Mitte",
  "Friedrichshain-Kreuzberg",
  "Pankow",
  "Charlottenburg-Wilmersdorf",
  "Spandau",
  "Steglitz-Zehlendorf",
  "Tempelhof-Schöneberg",
  "Neukölln",
  "Treptow-Köpenick",
  "Marzahn-Hellersdorf",
  "Lichtenberg",
  "Reinickendorf",
] as const;

/** Sucht einen offiziellen Bezirks-Namen in einem Titel/Header. Liefert kanonische Schreibweise. */
export function extractBezirkFromTitel(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const b of BEZIRKE) {
    const re = new RegExp(`\\b${b.replace(/-/g, "[ -]")}\\b`, "i");
    if (re.test(text)) return b;
  }
  // Häufige Stadtteile als Bezirks-Aliase
  const STADTTEILE: Record<string, string> = {
    "kreuzberg": "Friedrichshain-Kreuzberg",
    "friedrichshain": "Friedrichshain-Kreuzberg",
    "charlottenburg": "Charlottenburg-Wilmersdorf",
    "wilmersdorf": "Charlottenburg-Wilmersdorf",
    "steglitz": "Steglitz-Zehlendorf",
    "zehlendorf": "Steglitz-Zehlendorf",
    "tempelhof": "Tempelhof-Schöneberg",
    "schöneberg": "Tempelhof-Schöneberg",
    "treptow": "Treptow-Köpenick",
    "köpenick": "Treptow-Köpenick",
    "marzahn": "Marzahn-Hellersdorf",
    "hellersdorf": "Marzahn-Hellersdorf",
    "prenzlauer berg": "Pankow",
    "weißensee": "Pankow",
    "wedding": "Mitte",
    "moabit": "Mitte",
  };
  const lower = text.toLowerCase();
  for (const [needle, bezirk] of Object.entries(STADTTEILE)) {
    if (lower.includes(needle)) return bezirk;
  }
  return null;
}

export function extractHeaderMeta(fullText: string, titel?: string | null): HeaderMeta {
  const head = fullText.slice(0, 2500);

  // "des/der Abgeordneten <NAMEN> (FRAKTION)" — Newlines im Namens-Teil tolerieren
  // (PDFs brechen lange Namens-Listen mit \n: "X, Y und\nZ (AfD)").
  let fraktion: string | null = null;
  let abgeordnete: string | null = null;
  const mAbg = head.match(/(?:des|der)\s+Abgeordneten?\s+([^()]{3,200}?)\s*\(([^()\n]{2,80})\)/);
  if (mAbg) {
    abgeordnete = mAbg[1].replace(/\s+/g, " ").trim();
    fraktion = normalizeFraktion(mAbg[2]);
  }
  // Fallback für Anträge: "Antrag der Fraktion(en) X" oder "der X-Fraktion"
  if (!fraktion) {
    const mAntr = head.match(/Antrag\s+der\s+Fraktion(?:en)?\s+([^\n.]{3,150}?)(?=\s+(?:Drucksache|vom|über|zum)|\n)/i);
    if (mAntr) fraktion = normalizeFraktion(mAntr[1]);
  }
  if (!fraktion) {
    // "der AfD-Fraktion" / "der CDU-Fraktion" / "der SPD-Fraktion"
    const mAntrBindestrich = head.match(/\b(?:der|den|die)\s+(AfD|SPD|CDU|FDP|LINKE|GRÜNE|Linke|Grüne)-Fraktion\b/i);
    if (mAntrBindestrich) fraktion = normalizeFraktion(mAntrBindestrich[1]);
  }

  // "Senatsverwaltung für X" — Multi-Zeile bis nächster Header-Marker
  let senatsverwaltung: string | null = null;
  const mSv = head.match(/Senatsverwaltung\s+für\s+([\s\S]{3,200}?)(?=\n\s*(?:Herrn|Frau|über|den\s+Präsident|die\s+Präsident|A\s*n\s*t\s*w\s*o\s*r\s*t\b|Antwort\b))/);
  if (mSv) senatsverwaltung = mSv[1].replace(/\s+/g, " ").trim();

  // Datum: "vom <D>. <Monat> <YYYY>"
  let datum_anfrage: string | null = null;
  const mDat = head.match(/\bvom\s+(\d{1,2}\.?\s*[A-Za-zäöüÄÖÜ]+\s+\d{4})/);
  if (mDat) datum_anfrage = mDat[1].trim();

  // Bezirks-Hint: zuerst aus Titel (am robustesten), sonst aus Header-Block
  const bezirk_hint = extractBezirkFromTitel(titel ?? null) ?? extractBezirkFromTitel(head);

  return { fraktion, abgeordnete, senatsverwaltung, datum_anfrage, bezirk_hint };
}

/** Formatiert HeaderMeta als prompt-tauglichen Block für die User-Message.
 *  Leerer String, wenn nichts extrahiert wurde (sonst frisst der Block Tokens für nichts). */
export function formatHeaderMetaBlock(meta: HeaderMeta): string {
  const lines: string[] = [];
  if (meta.fraktion) lines.push(`- Fraktion: ${meta.fraktion}`);
  if (meta.abgeordnete) lines.push(`- Abgeordnete:r: ${meta.abgeordnete}`);
  if (meta.senatsverwaltung) lines.push(`- Senatsverwaltung: ${meta.senatsverwaltung}`);
  if (meta.datum_anfrage) lines.push(`- Datum Anfrage: ${meta.datum_anfrage}`);
  if (meta.bezirk_hint) lines.push(`- Mögliche Bezirks-Referenz: ${meta.bezirk_hint}`);
  if (lines.length === 0) return "";
  return `STRUKTURIERTE METADATEN (aus DS-Header extrahiert — vor Boilerplate-Strip):\n${lines.join("\n")}\n\n`;
}
