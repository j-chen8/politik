/**
 * Hand-verifizierte Ground-Truth für Berliner Plenum-Votes in Sitzung 85.
 * Quelle: docs/PlenarPr/p19-085-wp.pdf, 7. Mai 2026.
 *
 * Verifikations-Methodik: pro Vote den PDF-Snippet manuell gelesen, die
 * abschließende Formel ("Damit ist der Antrag X") als Quelle für outcome
 * genommen. Fraktions-Votes ggf. nachgezählt aus "Das sind die Fraktionen …".
 *
 * Verwendet in `scripts/_compare-votes-s85.ts` zur Regression-Detection
 * nach Vote-Pipeline-Änderungen.
 */

export interface VoteGroundTruth {
  snippet_offset: number;
  /** Drucksachen-Nrn die zum Vote gehören (Antrag + Beschlussempfehlung / Änderungsantrag). */
  drucksache_nrn: string[];
  /** Hauptsächlich abgestimmtes Dokument zum Identifizieren des Vote-Inhalts. */
  primary_dok_nr: string;
  outcome: "annahme" | "annahme_geaendert" | "ablehnung" | "vertagung" | "ueberweisung";
  modus: "einstimmig" | "mehrheitlich" | "knapp" | "unklar";
  fraktion_votes: Partial<Record<"CDU" | "SPD" | "GRÜNE" | "LINKE" | "AfD" | "FDP", "ja" | "nein" | "enthaltung" | "unbekannt">>;
  /** Kurze Beschreibung des Vote-Gegenstands für Mensch-Lesbarkeit. */
  description: string;
}

export const SITZUNG_85_GROUND_TRUTH: VoteGroundTruth[] = [
  {
    snippet_offset: 332209,
    primary_dok_nr: "19/3071",
    drucksache_nrn: ["19/3071", "19/3167"],
    outcome: "annahme",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "ja", SPD: "ja", GRÜNE: "ja", LINKE: "ja", AfD: "enthaltung" },
    description: "Gesetz zum Staatsvertrag über private Medien in Berlin und Brandenburg",
  },
  {
    snippet_offset: 333263,
    primary_dok_nr: "19/3104",
    drucksache_nrn: ["19/3104", "19/3175"],
    outcome: "annahme",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "ja", SPD: "ja", GRÜNE: "ja", LINKE: "ja", AfD: "nein" },
    description: "Fünftes Gesetz zur Änderung des Landeskrankenhausgesetzes",
  },
  {
    snippet_offset: 440644,
    primary_dok_nr: "19/0924",
    drucksache_nrn: ["19/0924", "19/3132"],
    outcome: "ablehnung",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "nein", SPD: "nein", GRÜNE: "ja", LINKE: "ja", AfD: "nein" },
    description: "Antrag GRÜNE auf Drucksache 19/0924 (Kultur), nach Beschlussempfehlung 19/3132 abgelehnt",
  },
  {
    snippet_offset: 459877,
    primary_dok_nr: "19/1395",
    drucksache_nrn: ["19/1395", "19/3138"],
    outcome: "ablehnung",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "nein", SPD: "nein", GRÜNE: "ja", LINKE: "ja", AfD: "enthaltung" },
    description: "Ausstellung des Berechtigungsnachweises (zuvor berlinpass) vereinfachen",
  },
  {
    snippet_offset: 460563,
    primary_dok_nr: "19/1803",
    drucksache_nrn: ["19/1803", "19/3139"],
    outcome: "annahme_geaendert",
    modus: "einstimmig",
    fraktion_votes: { CDU: "ja", SPD: "ja", GRÜNE: "ja", LINKE: "ja", AfD: "ja" },
    description: "Funktionierendes System für das Berlin-Ticket S entwickeln",
  },
  {
    snippet_offset: 476420,
    primary_dok_nr: "19/3006",
    drucksache_nrn: ["19/3006", "19/3153"],
    outcome: "annahme_geaendert",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "ja", SPD: "ja", LINKE: "ja", GRÜNE: "enthaltung", AfD: "enthaltung" },
    description: "Katastrophenschutz und Notfallvorsorge an Berliner Schulen stärken (mit geändertem Berichtsdatum)",
  },
  {
    snippet_offset: 477699,
    primary_dok_nr: "19/3008-1",
    drucksache_nrn: ["19/3008-1"],
    outcome: "ablehnung",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "nein", SPD: "nein", GRÜNE: "nein", LINKE: "nein", AfD: "ja" },
    description: "Änderungsantrag der AfD-Fraktion zu 19/3008 (Pflegenotfall-Telefon)",
  },
  {
    snippet_offset: 478163,
    primary_dok_nr: "19/3008",
    drucksache_nrn: ["19/3008", "19/3173"],
    outcome: "annahme",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "ja", SPD: "ja", GRÜNE: "ja", LINKE: "ja", AfD: "enthaltung" },
    description: "Einführung eines Pflegenotfall-Telefons (Koalitions-Antrag, schließlich angenommen)",
  },
  {
    snippet_offset: 479056,
    primary_dok_nr: "19/3027",
    drucksache_nrn: ["19/3027"],
    outcome: "ablehnung",
    modus: "mehrheitlich",
    fraktion_votes: { CDU: "nein", SPD: "nein", GRÜNE: "ja", LINKE: "ja", AfD: "nein" },
    description: "GRÜNE-Antrag 'Rund um die Uhr erreichbar: Ein Pflegenottelefon für akute Pflegekrisen'",
  },
];
