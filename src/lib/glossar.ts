// Definitionen für Tonalitäts-Klassen + Reden-Typen aus der v2.1-Methodologie.
// Genutzt von TagInfoPopover (Kurz-Definitionen) und der Methodik-Glossar-Seite.

export interface TonalitaetDef {
  slug: string;
  label: string;
  short: string;
  long: string;
}

export interface RedenTypDef {
  code: string;
  label: string;
  short: string;
  long: string;
}

export const TONALITAET_DEFS: TonalitaetDef[] = [
  {
    slug: "sachlich",
    label: "sachlich",
    short:
      "Argumentation auf Basis von Fakten, Statistiken und Belegen, ohne starke wertende Sprache.",
    long:
      "Sachliche Tonalität: Die Rede stützt sich überwiegend auf nachprüfbare Fakten, Zahlen, Studien oder Gesetzestexte. Wertungen und Emotionen sind zurückgenommen. Persönliche Angriffe oder Polemik fehlen weitgehend. Typisch für Fachpolitiker:innen in technischen Debatten.",
  },
  {
    slug: "polemisch",
    label: "polemisch",
    short:
      "Konfrontativer Stil mit deutlich wertender Sprache, Etikettierungen oder zugespitzten Formulierungen gegen Andersdenkende.",
    long:
      "Polemische Tonalität: Konfrontativer Stil mit deutlich wertender Sprache, Etikettierungen oder zugespitzten Formulierungen gegen Andersdenkende. Sachargumente treten gegenüber dem rhetorischen Angriff zurück. Klassifiziert wird der rhetorische Stil, nicht die inhaltliche Position.",
  },
  {
    slug: "polemisch_sachlich",
    label: "polemisch-sachlich",
    short:
      "Mischung — sachliche Argumente, durchsetzt mit polemischen Spitzen oder zugespitzten Vorwürfen.",
    long:
      "Mischtonalität: Es werden inhaltliche Argumente vorgebracht, aber regelmäßig mit polemischen Wendungen, Spitzen oder pauschalen Vorwürfen verbunden. Häufig in Oppositionsreden, die Kritik mit emotionaler Aufladung verbinden.",
  },
  {
    slug: "emotional_persoenlich",
    label: "emotional-persönlich",
    short:
      "Argumentation über persönliche Erfahrungen, Schicksale oder emotionale Appelle.",
    long:
      "Emotional-persönliche Tonalität: Die Rede stützt sich auf Schicksale, Bürger-Anekdoten oder persönliche Erlebnisse statt auf abstrakte Statistik. Appelliert an Mitgefühl, Sorge oder Betroffenheit.",
  },
  {
    slug: "konfrontativ_belegend",
    label: "konfrontativ-belegend",
    short:
      "Direkter Angriff auf den politischen Gegner mit konkreten Belegen, Zitaten oder Statistiken.",
    long:
      "Konfrontativ-belegende Tonalität: Scharfer Angriff auf eine andere Fraktion oder die Regierung — aber mit nachprüfbaren Belegen (wörtliche Zitate aus früheren Reden, Daten aus offiziellen Quellen, dokumentierte Aussagen). Konfrontativ im Stil, sachlich in der Substanz.",
  },
  {
    slug: "ironisch_jugendlich",
    label: "ironisch",
    short:
      "Spottend-distanziert, mit ironischen Wendungen oder satirischer Übertreibung.",
    long:
      "Ironische Tonalität: Indirekte Kritik durch Satire, Sarkasmus oder bewusste Übertreibung. Häufig auch generationelle Sprache (jugendlich oder pop-kulturell). Erfordert vom Hörer Decodieren — was sachlich gemeint ist und was ironisch.",
  },
  {
    slug: "bilanzierend_werbend",
    label: "bilanzierend",
    short:
      "Auflistung von Erfolgen oder Maßnahmen — oft im Werbe-Stil für die eigene Politik.",
    long:
      "Bilanzierend-werbende Tonalität: Es werden eigene Erfolge, beschlossene Maßnahmen oder Regierungs-Bilanz aufgezählt — typischerweise von der Regierungsseite. Tendiert zum positiven Framing der eigenen Arbeit.",
  },
  {
    slug: "staatsmaennisch",
    label: "staatsmännisch",
    short:
      "Distanziert-amtlich, gefasste Diktion, Bezug auf Gemeinwohl und Verantwortung.",
    long:
      "Staatsmännische Tonalität: Würdevoll-amtlicher Ton, oft aus Regierungs- oder Präsidentinnen-Perspektive. Verweist auf historische Verantwortung, internationale Beziehungen oder das Gemeinwohl. Persönliche Polemik wird vermieden.",
  },
  {
    slug: "defensiv_pragmatisch",
    label: "defensiv-pragmatisch",
    short:
      'Verteidigend-rechtfertigend — oft mit "Es war notwendig"-Argumentation oder Sachzwängen.',
    long:
      "Defensiv-pragmatische Tonalität: Die eigene Politik oder vergangene Entscheidungen werden gerechtfertigt, oft mit Verweis auf Sachzwänge, äußere Umstände oder Alternativen-Mangel. Häufig in Reden, in denen Kompromisse oder unliebsame Entscheidungen erklärt werden.",
  },
  {
    slug: "sozial_anklagend",
    label: "sozial-anklagend",
    short:
      "Anklage sozialer Missstände — oft mit moralischer Schuld-Zuweisung.",
    long:
      "Sozial-anklagende Tonalität: Soziale Ungerechtigkeiten, Armut oder strukturelle Benachteiligung werden in moralisch aufgeladener Sprache thematisiert. Verteilungsfragen stehen im Zentrum, oft mit Verantwortungs- oder Schuld-Zuweisung an konkrete Akteure.",
  },
  {
    slug: "mahnend",
    label: "mahnend",
    short: "Warnung vor Gefahren, Aufruf zur Verantwortung — oft prophetisch-ernst.",
    long:
      "Mahnende Tonalität: Die Rede warnt vor zukünftigen Gefahren (Klimawandel, Demokratiekrise, gesellschaftliche Spaltung) und ruft zu kollektivem Handeln auf. Ernst, häufig mit historischen Bezügen.",
  },
];

export const REDEN_TYP_DEFS: RedenTypDef[] = [
  {
    code: "A",
    label: "Polemische Opposition",
    short:
      "Oppositionsrede mit rhetorischem Schwerpunkt auf Kritik am politischen Gegner — nicht auf Detail-Vorschlägen oder Gegen-Konzepten.",
    long:
      "Typ A: Oppositionsrede, deren rhetorischer Schwerpunkt auf Kritik am politischen Gegner liegt — über Wertungen, Etikettierungen oder zugespitzte Formulierungen. Detail-Vorschläge oder Alternativ-Konzepte werden in dieser Form nicht primär entwickelt. Klassifiziert wird die rhetorische Form, nicht die Berechtigung der Kritik.",
  },
  {
    code: "B",
    label: "Sachlich-fachliche Opposition",
    short:
      "Oppositionsrede mit Schwerpunkt auf inhaltlicher Auseinandersetzung — konkrete Argumente, Alternativ-Konzepte oder Detail-Kritik.",
    long:
      "Typ B: Oppositionsrede mit Schwerpunkt auf inhaltlicher Auseinandersetzung. Charakteristisch sind konkrete Sachargumente, Alternativ-Konzepte oder Detail-Kritik an Regierungs-Vorhaben. Polemische Wendungen können vorkommen, sind aber nicht das prägende Element.",
  },
  {
    code: "C",
    label: "Persönliche Anekdotenrede",
    short: "Argumentation überwiegend aus persönlichen Erfahrungen und Bürger-Geschichten.",
    long:
      "Typ C: Die Rede stützt sich dominant auf persönliche Erlebnisse, Wahlkreis-Beispiele oder einzelne Bürger-Schicksale. Häufig zur emotionalen Veranschaulichung politischer Forderungen.",
  },
  {
    code: "D",
    label: "Konfrontativ-belegend",
    short: "Direkter Gegenangriff mit Zitaten, Statistiken und dokumentierten Aussagen.",
    long:
      "Typ D: Scharfer, aber inhaltlich belegter Angriff auf den politischen Gegner. Setzt Zitate aus früheren Reden, Statistiken oder dokumentierte Aussagen als Munition ein. Konfrontativ im Stil, faktenbasiert in der Substanz.",
  },
  {
    code: "E",
    label: "Bilanz-/Erfolgs-Rede",
    short: "Auflistung umgesetzter Ziele und beschlossener Maßnahmen — meist aus Regierungs-Perspektive.",
    long:
      "Typ E: Aufzählung dessen, was die eigene Regierung oder Fraktion umgesetzt hat — typischerweise mit positivem Framing der eigenen Bilanz. Häufig in Haushaltsdebatten oder Wahlkampf-Phasen, wo die eigene Politik öffentlich verortet wird.",
  },
  {
    code: "F",
    label: "Sachlich-technisch",
    short: "Detailorientierte Erklärung von Gesetzen, Mechanismen oder Zahlen.",
    long:
      "Typ F: Fachpolitisch-technische Rede. Erklärt Gesetze, technische Mechanismen, Förderlogiken oder Haushalts-Posten im Detail. Wenig Wertung, viel Information.",
  },
  {
    code: "G",
    label: "Sozialgerechtigkeits-Rede",
    short: "Argumentation um Verteilungsfragen und Gerechtigkeits-Frames.",
    long:
      'Typ G: Schwerpunkt auf sozialer Verteilung — Steuern, Renten, Mindestlohn, Sozialleistungen, Bildungschancen. Argumentation oft im Frame "Wer profitiert / wer trägt die Last?".',
  },
  {
    code: "H",
    label: "Regierungserklärung",
    short: "Programmatische Aussage der Regierung — Kanzler:in oder Minister:in.",
    long:
      "Typ H: Formale Regierungs-Aussage zur Programmatik, Lage oder zu konkreten Vorhaben. Quasi-rituelle Form mit großer öffentlicher Sichtbarkeit.",
  },
  {
    code: "I",
    label: "Fragestunde-Antwort",
    short: "Antwort auf eine parlamentarische Anfrage in der Fragestunde.",
    long:
      "Typ I: Beantwortung einer schriftlichen oder mündlichen Anfrage durch die Bundesregierung. Format ist standardisiert, Inhalt oft kurz und auf den Anfragepunkt fokussiert.",
  },
  {
    code: "J",
    label: "Zwischenfrage",
    short: "Spontane Frage einer/eines anderen MdB während laufender Rede.",
    long:
      "Typ J: Unterbrechende Frage, die eine andere abgeordnete Person an die laufend Redende richtet. Kurz, fokussiert, oft konfrontativ. Wird in der Regel beantwortet.",
  },
  {
    code: "K",
    label: "Außenpolitik",
    short: "Schwerpunkt auf internationalen Beziehungen, EU, NATO oder bilateralen Themen.",
    long:
      "Typ K: Außen- oder europapolitische Rede. Behandelt internationale Beziehungen, EU-Politik, Bündnis-Fragen, internationale Krisen oder bilaterale Beziehungen.",
  },
];

// Lookup-Maps für schnellen Zugriff aus Komponenten.
export const TONALITAET_DEF_MAP = Object.fromEntries(
  TONALITAET_DEFS.map((d) => [d.slug, d]),
) as Record<string, TonalitaetDef>;

export const REDEN_TYP_DEF_MAP = Object.fromEntries(
  REDEN_TYP_DEFS.map((d) => [d.code, d]),
) as Record<string, RedenTypDef>;
