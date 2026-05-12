/**
 * Prompts und Tool-Schemas für die Drucksachen-LLM-Analyse.
 * Eine Prompt-/Schema-Familie pro batch_class.
 *
 * Architektur: Wir nutzen Anthropic Tool-Use, damit das Model strukturiertes
 * JSON zurückliefert. JSON-Mode allein driftet bei Enums (siehe
 * Tonalitäts-Enum-Drift bei speech_analyses_v2). Tool-Use mit Enum hilft
 * dem Modell, aber lockt nicht 100 % — wir validieren in der Pipeline.
 */

export const PROMPT_VERSION = "v1";

const NEUTRALITY_BLOCK = `STRIKTE REGELN:
- Antworte ausschließlich auf Deutsch.
- Halte dich strikt an den vorgelegten Drucksachen-Text. Erfinde nichts.
- Verwende neutrale, faktenbasierte Sprache. KEINE bewertenden Adjektive ("gefährlich", "berechtigt", "skandalös", "vernünftig", "fragwürdig").
- KEINE Empfehlungen, KEINE Spekulationen über Sinnhaftigkeit, keine eigene Meinung.
- Behalte die Stimme der Drucksache: wenn eine Fraktion etwas fordert, schreibe "Die Fraktion fordert X" — niemals "berechtigterweise" / "fragwürdig".
- Schreibe in zugeschriebener Sprache: "laut Drucksache", "die Fragesteller verweisen auf", "die Bundesregierung antwortet, dass …".`;

export const SYSTEM_PROMPT_HEADER = `Du analysierst eine Bundestags-Drucksache für eine politische Transparenz-Plattform.

${NEUTRALITY_BLOCK}

LÄNGEN-LIMITS (strikt einhalten):
- zusammenfassung: maximal 80 Wörter
- jeder Bullet-Punkt in kerninhalt: maximal 20 Wörter
- jedes weitere Textfeld (regelung/begruendung/auswirkung): maximal 60 Wörter

Verwende die Antwort-Tools — keine Erklärungen außerhalb des Tool-Aufrufs.`;

// ─── Length-Tiers für Re-Run heavy-truncated (v1.1) ──
export const LENGTH_TIERS = {
  standard: { zus_words: 120, bullets: 6, other_words: 100 },
  long:     { zus_words: 300, bullets: 10, other_words: 200 },
  massive:  { zus_words: 700, bullets: 15, other_words: 400 },
} as const;
export type LengthTier = keyof typeof LENGTH_TIERS;

export function determineTier(tokens_estimate: number, pages: number | null): LengthTier {
  if (tokens_estimate > 80_000 || (pages != null && pages > 150)) return "massive";
  if (tokens_estimate > 32_000 || (pages != null && pages > 50)) return "long";
  return "standard";
}

const ANTI_PATTERNS_LONG_MASSIVE = `VERBOT (bei diesem Umfang absolut kritisch):
- KEINE Inhaltsverzeichnis-Paraphrase. NICHT: "Kapitel 2 behandelt X, Kapitel 3 behandelt Y". STATTDESSEN: was in Kapitel 2 inhaltlich GEFUNDEN wird.
- KEINE Floskeln. NICHT: "Der Bericht unterstreicht die Bedeutung von …", "Das Gesetz adressiert wichtige Herausforderungen". STATTDESSEN: konkrete Aussagen.
- KEINE Wiederholung des Drucksache-Titels als Inhaltsaussage.
- KEIN "Meta-Berichten" ("Der Bericht zeigt, dass …"). Schreibe direkt: "Die Armutsrisikoquote liegt bei 16,7 %".
- KEIN Floskeln-Tenor ohne Substanz.

GEBOT:
- Konkrete Zahlen, Quoten, Beträge, Zeiträume, Personenkreise — wenn der Text sie nennt, in die Zusammenfassung aufnehmen.
- Wenn die Drucksache Maßnahmen / Empfehlungen / Forderungen formuliert: im letzten Absatz nennen.
- Wenn Befund UND Begründung im Text stehen: beides nennen, nicht nur eines.
- Wenn der Text Lücken / Verweise auf andere Stellen / "Daten liegen nicht vor" enthält: das ist auch eine Aussage, nennen.`;

const KERNINHALT_VS_ZUS = `ABGRENZUNG zusammenfassung ↔ kerninhalt:
- zusammenfassung = NARRATIVE Synthese, prose, mit Übergängen, lesbar als Text.
- kerninhalt = DISKRETE Liste konkreter Forderungen / Befunde / Regelungen als Quick-Reference.
- Die kerninhalt-Bullets sollten KEINE Paraphrase der zusammenfassung sein, sondern atomare Einzelpositionen liefern.`;

function structureGuidance(tier: LengthTier, batchClass: string): string {
  if (tier === "standard") return ""; // einfacher Absatz reicht

  // Klassen-spezifische Struktur
  const guides: Record<string, { long: string; massive: string }> = {
    klein: {
      long: `STRUKTUR (2-3 Absätze):
1. Anlass + initiierende Fraktion + Ziel der Anfrage / des Antrags.
2. Konkrete Forderungen oder Fragenbereiche, mit Detail.
3. Falls Bezug zu vorherigen Drucksachen / aktuellem politischem Kontext: kurz einordnen.`,
      massive: `STRUKTUR (4-5 Absätze):
1. Anlass + initiierende Fraktion + Stoßrichtung.
2-3. Forderungskataloge / Fragebereiche thematisch gruppiert.
4. Wenn die Fraktion Begründung / politischen Hintergrund nennt: zusammenfassen.
5. Bezug zu anderen Drucksachen / Vorgängen falls erwähnt.`,
    },
    mittel: {
      long: `STRUKTUR (2-3 Absätze):
1. Was wird berichtet, Zeitraum/Scope, wer ist Auftraggeber.
2. Zentrale Befunde mit konkreten Zahlen.
3. Empfehlungen / Maßnahmen / Folgerungen falls im Text formuliert.`,
      massive: `STRUKTUR (4-6 Absätze, entlang der HAUPTBEFUNDE — nicht Kapitel):
1. Scope: Was untersucht / berichtet der Bericht, für welchen Zeitraum, im Auftrag wessen.
2-4. Die drei bis fünf wichtigsten inhaltlichen Befunde — JEDER Absatz ein Hauptbefund mit Zahlen.
5. Methodisches NUR wenn ein Befund nur unter Berücksichtigung der Methode verstehbar ist.
6. Empfehlungen / Maßnahmen / politische Implikationen falls im Bericht formuliert.`,
    },
    gross: {
      long: `STRUKTUR (2-3 Absätze):
1. Was regelt das Gesetz / fragt die Große Anfrage konkret, einbringende Stelle.
2. Kernregelungen / Hauptfragebereiche im Detail.
3. Auswirkungen / Betroffene / Kosten — sofern in der Drucksache benannt.`,
      massive: `STRUKTUR (4-6 Absätze):
1. Zweck des Gesetzes / der Anfrage: Was wird geregelt / erfragt, welches Problem adressiert.
2-3. Geltungsbereich + betroffene Gruppen / Wirtschaftszweige.
4. Konkrete Regelungen auf Paragraph-Ebene (bei Gesetz) bzw. Forderungs-Cluster (bei Großer Anfrage).
5. Begründung der Bundesregierung / Fraktion — kurz, da eigenes Feld vorhanden.
6. Wenn konkrete Kostenfolgen / Auswirkungen in der DS stehen: nennen.`,
    },
    antwort: {
      long: `STRUKTUR (2-3 Absätze):
1. Was hat die Fraktion gefragt, in welchem Kontext.
2. Wie hat die Bundesregierung im Kern geantwortet — substantiell oder mit Verweisen / Datenlücken.
3. Falls Anlagen referenziert oder bestimmte Fragen offen gelassen: das nennen.`,
      massive: `STRUKTUR (4-5 Absätze):
1. Was hat die Fraktion gefragt, in welchem politischen Kontext.
2-3. Wie die Bundesregierung inhaltlich antwortet — gruppiert nach Themenfeldern der Fragen.
4. Welche Fragen unbeantwortet bleiben / wo auf Datenlücken / Geheimhaltung verwiesen wird.
5. Falls Anlagen mit Rohdaten geliefert werden: nennen, was darin enthalten ist (Datentyp, Zeitraum), aber NICHT die Anlagedaten selbst summieren.`,
    },
    regierung: {
      long: `STRUKTUR (2-3 Absätze):
1. Dokumenttyp + Auftraggeber/Vorlagestelle.
2. Inhaltlicher Kern.
3. Verfahrenshinweise / nächste Schritte falls erkennbar.`,
      massive: `STRUKTUR (4-5 Absätze):
1. Dokumenttyp + Auftraggeber/Vorlagestelle + Zeitraum.
2-3. Inhaltlicher Kern, thematisch gruppiert.
4. Wenn das Dokument Aufzählungen (z.B. Fragestunde mit 80 Fragen) enthält: Themenverteilung, nicht Einzelfragen.
5. Verfahrenshinweise / Folgevorlagen.`,
    },
  };

  const cls = guides[batchClass];
  if (!cls) return "";
  return tier === "massive" ? cls.massive : cls.long;
}

export function buildSystemPromptTiered(tier: LengthTier, batchClass: string): string {
  const t = LENGTH_TIERS[tier];
  const structure = structureGuidance(tier, batchClass);
  const antiPatterns = tier === "standard" ? "" : ANTI_PATTERNS_LONG_MASSIVE;

  const themaEnumReminder = `THEMA-DISZIPLIN: Das thema-Feld akzeptiert AUSSCHLIESSLICH Tags aus der vorgegebenen Liste (siehe Tool-Schema). Wähle 1-3 passende Tags. Wenn nichts passt: "Sonstiges". Erfinde KEINE neuen Tags (z.B. NICHT "Armut" → nutze "Soziales"; NICHT "Pflege" → nutze "Gesundheit"; NICHT "Soziale Ungleichheit" → nutze "Soziales").`;

  return `Du analysierst eine Bundestags-Drucksache für eine politische Transparenz-Plattform.

${NEUTRALITY_BLOCK}

LÄNGEN-VORGABEN (Tier "${tier}", strikt einhalten):
- zusammenfassung: ca. ${t.zus_words} Wörter (mind. ${Math.round(t.zus_words * 0.75)}, max. ${Math.round(t.zus_words * 1.2)})
- kerninhalt: ${t.bullets} Bullet-Punkte (je Bullet max. 25 Wörter, prägnant)
- weitere Textfelder (regelung/begruendung/auswirkung): ca. ${t.other_words} Wörter

${structure ? structure + "\n\n" : ""}${antiPatterns ? antiPatterns + "\n\n" : ""}${KERNINHALT_VS_ZUS}

${themaEnumReminder}

Verwende die Antwort-Tools — keine Erklärungen außerhalb des Tool-Aufrufs.`;
}

export const TOPIC_TAGS = [
  // Klassisch
  "Migration", "Klimaschutz", "Energie", "Digitalisierung", "Verteidigung",
  "Wirtschaft", "Soziales", "Bildung", "Gesundheit", "Justiz",
  "Verkehr", "Wohnen", "Landwirtschaft", "Außenpolitik", "Europa",
  "Innere Sicherheit", "Finanzen", "Steuern", "Bundeswehr", "Kultur",
  "Umweltschutz", "Arbeitsmarkt", "Rente", "Familie", "Sport",
  // Erweitert nach Test-Run-Drift
  "Verbraucherschutz", "Datenschutz", "Extremismus", "Forschung", "Antidiskriminierung",
  "Tierschutz", "Mietrecht", "Demokratie", "Menschenrechte", "Geschlechtergerechtigkeit",
  "Bürgerrechte", "Verwaltung", "Mobilität", "Entwicklungszusammenarbeit",
  // Erweitert nach Voll-Batch-Drift (1.143 DS, top-Cluster)
  "Transparenz", "Infrastruktur", "Bürokratie", "Lobbyismus", "Föderalismus",
  "Sonstiges",
] as const;

const COMMON_FIELDS = {
  zusammenfassung: { type: "string", description: "2–5 neutrale Sätze auf Deutsch. Keine Wertungen." },
  thema: {
    type: "array",
    items: { type: "string", enum: [...TOPIC_TAGS] },
    minItems: 1,
    maxItems: 3,
    description: "1–3 Themen-Schlagwörter aus der vorgegebenen Liste.",
  },
} as const;

// ─── KLEIN ───────────────────────────────────────────
export const KLEIN_USER_INSTRUCTION = `Analysiere diese Drucksache (Kleine Anfrage, Antrag, Entschließungs- oder Änderungsantrag). Ziel: Bürger:innen sollen in 3 Sätzen verstehen, was die Drucksache will und wer sie eingebracht hat.`;

export const KLEIN_TOOL = {
  name: "analyse_klein",
  description: "Analyse einer Kleinen Anfrage / eines Antrags / Entschließungsantrags.",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt", "thema", "tonalitaet"],
    properties: {
      zusammenfassung: { type: "string", description: "2–3 neutrale Sätze: Was will die Drucksache erreichen oder erfragen?" },
      kerninhalt: {
        type: "array",
        items: { type: "string" },
        maxItems: 5,
        description: "Konkrete Forderungen oder Fragen als kurze Stichpunkte (max 5).",
      },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "fordernd", "kritisch", "informierend"],
        description: "Grundton der Drucksache.",
      },
      fraktion: { type: "string", description: "Initiierende Fraktion, z.B. 'AfD', 'BÜNDNIS 90/DIE GRÜNEN'. Leer wenn nicht erkennbar." },
    },
  },
};

// ─── MITTEL ──────────────────────────────────────────
export const MITTEL_USER_INSTRUCTION = `Analysiere diesen Bericht oder diese Unterrichtung. Bürger:innen sollen verstehen, was berichtet wird und welche zentralen Befunde es gibt.`;

export const MITTEL_TOOL = {
  name: "analyse_mittel",
  description: "Analyse eines Berichts / einer Unterrichtung.",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt", "thema", "tonalitaet"],
    properties: {
      zusammenfassung: { type: "string", description: "3–5 neutrale Sätze: Was berichtet die Drucksache, welche zentralen Befunde?" },
      kerninhalt: {
        type: "array",
        items: { type: "string" },
        maxItems: 5,
        description: "Konkrete Befunde / Empfehlungen / Hinweise.",
      },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "informierend", "mahnend"],
      },
      betroffene_gruppen: { type: "string", description: "Konkret benannte gesellschaftliche/wirtschaftliche Gruppen im Fokus. Leer wenn keine." },
    },
  },
};

// ─── GROSS ───────────────────────────────────────────
export const GROSS_USER_INSTRUCTION = `Analysiere diesen Gesetzentwurf oder diese Große Anfrage. Bürger:innen sollen verstehen, was geregelt werden soll und wen es betrifft.`;

export const GROSS_TOOL = {
  name: "analyse_gross",
  description: "Analyse eines Gesetzentwurfs / einer Großen Anfrage.",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "regelung", "begruendung", "thema", "tonalitaet"],
    properties: {
      zusammenfassung: { type: "string", description: "3–5 neutrale Sätze: Was wird geregelt oder erfragt?" },
      regelung: { type: "string", description: "Was wird konkret neu festgelegt (bei Gesetz) / nach was wird gefragt (bei Gr. Anfrage). 2–4 Sätze." },
      begruendung: { type: "string", description: "Die offizielle Begründung der Drucksache. 2–4 Sätze." },
      auswirkung: { type: "string", description: "In der Drucksache genannte Folgen / Auswirkungen. Leer wenn nicht genannt." },
      betroffene_gruppen: { type: "string", description: "Konkrete Gruppen, die rechtlich tangiert werden. Leer wenn nicht klar." },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "fordernd", "kritisch"],
      },
      fraktion: { type: "string", description: "Einbringende Fraktion oder 'Bundesregierung' bei Regierungsentwurf." },
    },
  },
};

// ─── ANTWORT ─────────────────────────────────────────
export const ANTWORT_USER_INSTRUCTION = `Analysiere diese Antwort der Bundesregierung auf eine Schriftliche Anfrage. Bürger:innen sollen verstehen: was wurde gefragt, wie wurde geantwortet, ist die Antwort substanziell oder ausweichend?`;

export const ANTWORT_TOOL = {
  name: "analyse_antwort",
  description: "Analyse einer Antwort der Bundesregierung auf eine Schriftliche Anfrage.",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt", "thema", "tonalitaet"],
    properties: {
      zusammenfassung: { type: "string", description: "3–4 Sätze: (a) was wurde gefragt, (b) wie hat die BReg im Kern geantwortet." },
      kerninhalt: {
        type: "array",
        items: { type: "string" },
        maxItems: 5,
        description: "Zentrale Antwortsubstanzen oder Verweise (z.B. 'BReg verweist auf laufende Evaluation', 'Daten liegen nicht vor').",
      },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["substantiell", "teilantwortend", "ausweichend"],
        description: "Charakter der Antwort: konkrete Zahlen/Fakten → substantiell; manche Fragen offen → teilantwortend; v.a. Verweise/Datenlücken → ausweichend.",
      },
      fraktion: { type: "string", description: "Fraktion der ursprünglichen Anfrage." },
    },
  },
};

// ─── REGIERUNG ───────────────────────────────────────
export const REGIERUNG_USER_INSTRUCTION = `Analysiere diese Drucksache der Bundesregierung oder eines Bundesorgans. Bürger:innen sollen verstehen, worum es geht und welche Art Dokument das ist.`;

export const REGIERUNG_TOOL = {
  name: "analyse_regierung",
  description: "Analyse einer Regierungs-Drucksache.",
  input_schema: {
    type: "object" as const,
    required: ["zusammenfassung", "kerninhalt", "thema", "dokumenttyp"],
    properties: {
      zusammenfassung: { type: "string", description: "3–5 neutrale Sätze." },
      kerninhalt: {
        type: "array",
        items: { type: "string" },
        maxItems: 5,
        description: "Zentrale Aussagen oder Verfahrenshinweise.",
      },
      thema: COMMON_FIELDS.thema,
      tonalitaet: {
        type: "string",
        enum: ["sachlich", "informierend"],
      },
      dokumenttyp: { type: "string", description: "Kurze Typ-Bezeichnung: 'Antwort zu Schriftlicher Frage', 'Unterrichtung über überwiesene Vorlagen', 'EU-Vorlage', 'Bericht', usw." },
    },
  },
};

// ─── REGISTRY ────────────────────────────────────────
export const PROMPTS_BY_CLASS = {
  klein:     { instruction: KLEIN_USER_INSTRUCTION,     tool: KLEIN_TOOL,     cap: 6000 },
  mittel:    { instruction: MITTEL_USER_INSTRUCTION,    tool: MITTEL_TOOL,    cap: 16000 },
  gross:     { instruction: GROSS_USER_INSTRUCTION,     tool: GROSS_TOOL,     cap: 32000 },
  antwort:   { instruction: ANTWORT_USER_INSTRUCTION,   tool: ANTWORT_TOOL,   cap: 32000 },
  regierung: { instruction: REGIERUNG_USER_INSTRUCTION, tool: REGIERUNG_TOOL, cap: 16000 },
} as const;

export type BatchClass = keyof typeof PROMPTS_BY_CLASS;

/** Approximative Token-zu-Char-Konvertierung (3.5 chars/token bei Deutsch). */
export function truncateToTokens(text: string, maxTokens: number): { text: string; truncated: boolean } {
  const maxChars = Math.floor(maxTokens * 3.5);
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}
