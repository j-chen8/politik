// Definitionen für Drucksachen-Tonalitäten (Methodik:
// docs/drucksachen-tonalitaet-methodik.md, Stand 2026-05-26).
// 8 distinct Werte über 5 batch_class-Subsets (klein, mittel, gross, antwort, regierung).

export interface DrucksacheTonalitaetDef {
  slug: string;
  label: string;
  short: string;
  long: string;
  /** Anti-Definition: was das Label NICHT bedeutet. */
  notMeaning: string;
  /** In welchen batch_class-Subsets dieser Wert auftritt (informativ, keine Constraint). */
  klassen: string[];
}

export const DRUCKSACHEN_TONALITAET_DEFS: DrucksacheTonalitaetDef[] = [
  {
    slug: "sachlich",
    label: "sachlich",
    short: "Neutraler Frage-/Darstellungston, ohne wertende Färbung.",
    long:
      "Sachlicher Ton: Die Drucksache beschreibt, fragt oder informiert in neutraler Sprache, ohne rhetorische Aufladung. Fokus auf Beschaffen-von-Informationen oder strukturierter Darstellung.",
    notMeaning:
      "Keine Aussage über Wichtigkeit, Tiefe oder Belastbarkeit des Anliegens. Eine sachliche Anfrage kann fachlich oberflächlich sein; eine polemische kann faktisch korrekt sein.",
    klassen: ["klein", "mittel", "gross", "regierung"],
  },
  {
    slug: "fordernd",
    label: "fordernd",
    short: 'Handlungs-orientiert: enthält explizite Forderungen, "muss"/"soll".',
    long:
      'Fordernder Ton: Erkennbar handlungs-orientiert. Enthält explizite Forderungen, "muss"/"soll"-Konstruktionen, Aufforderung zur Stellungnahme oder konkrete Maßnahmen-Forderung.',
    notMeaning:
      "Kein Urteil darüber, ob die Forderung berechtigt, durchsetzbar oder verfassungsgemäß ist.",
    klassen: ["klein", "gross"],
  },
  {
    slug: "kritisch",
    label: "kritisch",
    short: "Gegen Regierung/Institution gerichtet, hinterfragt, zieht in Zweifel.",
    long:
      "Kritischer Ton: Eine gegen die Regierung oder eine Institution gerichtete Stoßrichtung; bestreitet, hinterfragt, zieht in Zweifel. Häufig in der Vorbemerkung erkennbar.",
    notMeaning:
      "Keine Aussage darüber, ob die Kritik gerechtfertigt ist oder ob die Belege tragen. Markiert den Tonfall, nicht den Wahrheitsgehalt.",
    klassen: ["klein", "gross"],
  },
  {
    slug: "informierend",
    label: "informierend",
    short: "Bestandsaufnahme: Daten beschaffen, Stand erfragen, Sachverhalt darlegen.",
    long:
      "Informierender Ton: Anliegen, Bericht oder Anfrage primär zur Bestandsaufnahme — Daten beschaffen, Stand erfragen, Sachverhalt darlegen. Weniger Konfrontation, mehr Recherche.",
    notMeaning:
      "Keine Wertung über die Tiefe oder Vollständigkeit der erbetenen Information.",
    klassen: ["klein", "mittel", "regierung"],
  },
  {
    slug: "mahnend",
    label: "mahnend",
    short: "Bericht/Darstellung mit ausdrücklichem Appell — Warnung, Erinnerung.",
    long:
      "Mahnender Ton: Verbindet Bericht oder Darstellung mit ausdrücklichem Appell — Warnung, Erinnerung, Aufforderung zur Verhaltensänderung. Häufig bei Berichten zu strukturellen oder gesellschaftlichen Problemen.",
    notMeaning:
      "Keine Aussage über die Berechtigung oder Dringlichkeit der Mahnung.",
    klassen: ["mittel"],
  },
  {
    slug: "substantiell",
    label: "substantiell",
    short: "Antwort liefert konkrete Zahlen, Daten, Sachverhalte zu den gestellten Fragen.",
    long:
      "Substantielle Antwort: Konkrete Zahlen, Daten oder Sachverhalte werden geliefert; die Antwort geht auf die gestellten Fragen ein.",
    notMeaning:
      "Keine Aussage, ob die Zahlen oder Sachverhalte die Frage vollständig oder zutreffend beantworten. Auch eine substantielle Antwort kann selektiv informieren.",
    klassen: ["antwort"],
  },
  {
    slug: "teilantwortend",
    label: "teilantwortend",
    short: "Antwort beantwortet einen Teil der Fragen, lässt andere offen.",
    long:
      "Teilantwortend: Die Antwort beantwortet einen Teil der Fragen, lässt andere offen — oft mit Verweis auf laufende Verfahren oder fehlende Datengrundlagen.",
    notMeaning:
      "Kein Vorwurf, dass die Antwort verweigert wurde. Manche Datenlagen sind tatsächlich nicht abrufbar.",
    klassen: ["antwort"],
  },
  {
    slug: "ausweichend",
    label: "ausweichend",
    short: "Antwort weicht der konkreten Frage strukturell aus.",
    long:
      "Ausweichend: Die Antwort weicht der konkreten Frage strukturell aus — vorwiegend Verweise, generische Bezugnahmen, Hinweise auf Zuständigkeiten anderer Stellen, oder explizite Datenlücken.",
    notMeaning:
      "Keine moralische Wertung. Manche Ausweichungen sind verfahrenstechnisch oder verfassungsrechtlich (z. B. laufende Ermittlungsverfahren) begründet.",
    klassen: ["antwort"],
  },
];

export const DRUCKSACHEN_TONALITAET_DEF_MAP = Object.fromEntries(
  DRUCKSACHEN_TONALITAET_DEFS.map((d) => [d.slug, d]),
) as Record<string, DrucksacheTonalitaetDef>;

/**
 * Farb-Palette pro Drucksachen-Tonalität. Konsistent mit Reden-Palette,
 * aber DS-spezifische Werte (substantiell/teilantwortend/ausweichend)
 * haben eigene Farben für die Antwort-Subkategorie.
 */
export const DRUCKSACHEN_TONALITAET_COLORS: Record<
  string,
  { color: string; bg: string }
> = {
  sachlich: { color: "#374151", bg: "#f3f4f6" },
  fordernd: { color: "#b91c1c", bg: "#fee2e2" },
  kritisch: { color: "#9a3412", bg: "#ffedd5" },
  informierend: { color: "#1e40af", bg: "#dbeafe" },
  mahnend: { color: "#854d0e", bg: "#fef9c3" },
  substantiell: { color: "#15803d", bg: "#dcfce7" },
  teilantwortend: { color: "#a16207", bg: "#fef3c7" },
  ausweichend: { color: "#7c3aed", bg: "#ede9fe" },
};
