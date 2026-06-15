/**
 * Berlin-Themenfeld-Struktur fürs UI — das Pendant zu themen-struktur.ts (Bund).
 *
 * Daten-Korn = berlin_drucksachen_analyses.thema_json (47 kontrollierte Roh-Tags).
 * Diese 47 Tags sind GENAU EINEM Feld zugeordnet (Achse A Politikfeld / Achse B
 * Querschnitt / Sonstiges) — lückenlos & doppelungsfrei validiert.
 *
 * GENERIERT aus der SoT docs/themenfelder-berlin.mapping.json (Stand 2026-06-02).
 * Bei Änderung dort: hier nachziehen (oder umgekehrt) — beide müssen deckungsgleich
 * bleiben. Anzeige-Labels sind verbraucherfreundlich (Berlin-spezifisch), NICHT die
 * AW-Sachgebiete (die leben im geteilten aw_field-Rollup für die Bund-Analytik).
 *
 * Aggregationsregel: „Größe eines Feldes" = Drucksachen mit ≥1 Tag des Feldes,
 * pro DS entdoppelt (NICHT Summe der Tag-Nennungen). Multi-Label: eine DS kann in
 * mehreren Feldern liegen. Querschnitt wird additiv vergeben, ersetzt kein Feld.
 */

export interface BerlinThemenfeld {
  key: string;                  // URL-Slug
  label: string;                // verbraucherfreundlicher Anzeige-Name
  tags: readonly string[];      // Roh-Tags (thema_json) = die „Unterthemen"
}

// ── Achse A: 12 Politikfelder (worum es sachlich geht) ──
export const BERLIN_POLITIKFELDER: readonly BerlinThemenfeld[] = [
  { key: "wohnen-bau",            label: "Stadtentwicklung, Bauen & Wohnen", tags: ["Wohnen", "Stadtentwicklung", "Liegenschaften", "Bauplanung", "Wohnungslosigkeit", "Denkmalschutz"] },
  { key: "verwaltung-digitales",  label: "Verwaltung & Digitales",           tags: ["Verwaltung", "Digitalisierung", "Datenschutz", "Bürokratie"] },
  { key: "mobilitaet",            label: "Mobilität & Verkehr",              tags: ["Mobilität", "ÖPNV", "Verkehrssicherheit", "Radverkehr"] },
  { key: "soziales-arbeit",       label: "Soziales, Arbeit & Familie",       tags: ["Soziale Infrastruktur", "Arbeitsmarkt", "Inklusion", "Familie"] },
  { key: "bildung-wissenschaft",  label: "Bildung & Wissenschaft",           tags: ["Bildung", "Hochschulen"] },
  { key: "sicherheit-justiz",     label: "Innere Sicherheit & Justiz",       tags: ["Polizei", "Justiz", "Gewaltprävention", "Extremismus"] },
  { key: "finanzen-haushalt",     label: "Finanzen & Haushalt",              tags: ["Finanzen", "Haushalt", "Steuern"] },
  { key: "umwelt-klima",          label: "Umwelt, Klima & Energie",          tags: ["Klimaschutz", "Energie", "Tierschutz"] },
  { key: "gesundheit-pflege",     label: "Gesundheit & Pflege",              tags: ["Gesundheit", "Pflege"] },
  { key: "migration-integration", label: "Migration & Integration",          tags: ["Geflüchtete", "Integration", "Migration"] },
  { key: "kultur-sport",          label: "Kultur & Sport",                   tags: ["Kultur", "Sport"] },
  { key: "wirtschaft",            label: "Wirtschaft & Tourismus",           tags: ["Wirtschaft", "Tourismus"] },
];

// ── Achse B: 4 Querschnitt-Kategorien (laufen quer durch alle Felder) ──
export const BERLIN_QUERSCHNITT: readonly BerlinThemenfeld[] = [
  { key: "bezirksbezug",                      label: "Bezirksbezug",                         tags: ["Bezirke"] },
  { key: "transparenz",                       label: "Transparenz & Open Data",              tags: ["Transparenz"] },
  { key: "demokratie-teilhabe",               label: "Demokratie & Teilhabe",                tags: ["Demokratie", "Partizipation", "Wahlrecht"] },
  { key: "gleichstellung-antidiskriminierung",label: "Gleichstellung & Antidiskriminierung", tags: ["Antidiskriminierung", "Geschlechtergerechtigkeit"] },
];

// „Sonstiges" (Tag „Sonstiges") bleibt expliziter Auffang — kein eigenes Feld,
// wird NICHT zwangszugeordnet, damit die Feld-Statistik ehrlich bleibt.

export const BERLIN_THEMENFELDER_ALLE: readonly BerlinThemenfeld[] = [
  ...BERLIN_POLITIKFELDER,
  ...BERLIN_QUERSCHNITT,
];

const BY_SLUG = new Map(BERLIN_THEMENFELDER_ALLE.map((f) => [f.key, f]));

export function berlinFeldBySlug(slug: string): BerlinThemenfeld | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Roh-Tags eines Felds (zum Filtern auf thema_json). */
export function berlinTagsForFeld(slug: string): readonly string[] {
  return BY_SLUG.get(slug)?.tags ?? [];
}
