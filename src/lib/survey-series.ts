/**
 * survey-series.ts — monatliche Umfrage-Salienz (Politbarometer, offene Frage
 * „wichtigste Probleme") für die Zeitreihen-Graphen auf den Themen-Detailseiten.
 *
 * Quelle: Forschungsgruppe Wahlen, Politbarometer, Tabellen „Wichtige Probleme
 * in Deutschland I+II" (Langzeit-xlsx). Werte = % der Befragten, die das Problem
 * nennen (Mehrfachnennung). Statisch hinterlegt (externe Daten, halbjährlich
 * aktualisieren — siehe docs/umfrage-salienz.md). Bei zwei Wellen/Monat: letzte.
 *
 * Deckt NICHT alle Bürger-Themen ab — Politbarometer fragt offen, ohne eigene
 * Kategorie für Innere Sicherheit, Steuern, Bildung, Wohnen → dort keine Sorge-Linie.
 */

export const SURVEY_MONTHS = [
  "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09",
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
  "2026-04", "2026-05",
] as const;

export const SURVEY_SOURCE_LINE = "Politbarometer (Forschungsgruppe Wahlen), Apr 2025 – Mai 2026";

// Kategorie → Monatswerte (Index-aligned zu SURVEY_MONTHS).
const SERIES: Record<string, number[]> = {
  "Wirtschaftslage":            [31, 30, 20, 25, 18, 22, 24, 22, 22, 23, 25, 23, 21, 22],
  "Kosten/Löhne/Preise":        [ 8,  8,  9,  8,  6,  8,  7,  8,  6,  8,  5, 16, 25, 11],
  "Zuwanderung":                [28, 25, 18, 29, 25, 23, 25, 24, 19, 18, 20, 14, 11, 12],
  "Soziales Gefälle":           [ 4,  7, 10,  8,  9,  8,  7,  8,  7,  7, 10,  6,  5, 10],
  "Renten":                     [ 5,  9,  9, 14, 14,  8, 11, 21, 19, 11, 12,  8,  7, 11],
  "Bundeswehr/Verteidigung":    [ 8,  9, 18, 11, 10,  8, 12,  9, 11, 13, 10, 15, 10, 10],
  "Ukraine/Krieg/Russland":     [ 7,  9,  7,  7, 10,  9,  8,  7,  8,  8,  7,  4,  3,  2],
  "Gesundheitswesen, Pflege":   [ 4,  5,  4,  5,  6,  5,  3,  5,  7,  4,  7,  4,  8, 10],
  "Klima / Energie":            [12, 14, 10, 11, 13, 11, 10, 14, 10,  9, 11, 16, 16, 15],
  "Arbeitslosigkeit":           [ 4,  5,  4,  4,  3,  6,  4,  4,  5,  4,  6,  5,  4,  3],
};

// Bürger-Thema (slug) → Politbarometer-Kategorien, die zusammengefasst werden.
// Mehrfachnennung → Summe ist eine Näherung („eine dieser Sorgen"), für den
// Trend-Verlauf ausreichend. Themen ohne Eintrag: keine Sorge-Linie.
const TOPIC_CATEGORIES: Record<string, string[]> = {
  "wirtschaft-preise": ["Wirtschaftslage", "Kosten/Löhne/Preise"],
  "migration-asyl": ["Zuwanderung"],
  "soziale-sicherung": ["Soziales Gefälle", "Renten"],
  "verteidigung-aussen": ["Bundeswehr/Verteidigung", "Ukraine/Krieg/Russland"],
  "gesundheit-pflege": ["Gesundheitswesen, Pflege"],
  "klima-umwelt": ["Klima / Energie"],
  "energie": ["Klima / Energie"],
  "arbeit-loehne": ["Arbeitslosigkeit"],
};

/** Monatliche Sorge-Reihe für ein Thema (Summe der zugeordneten Kategorien), oder null. */
export function getConcernSeries(slug: string): { month: string; value: number }[] | null {
  const cats = TOPIC_CATEGORIES[slug];
  if (!cats) return null;
  return SURVEY_MONTHS.map((m, i) => ({
    month: m,
    value: cats.reduce((s, c) => s + (SERIES[c]?.[i] ?? 0), 0),
  }));
}
