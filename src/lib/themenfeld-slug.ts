/**
 * URL-Slug ↔ Themenfeld-Name (amtliche Sachgebiete, wie in partei_themenfeld_position.feld).
 * 25 Felder, alphabetisch wie in der DB. `kurz` = knappes Label für Nav/Chips.
 */
export const THEMENFELDER: { slug: string; feld: string; kurz: string }[] = [
  { slug: "arbeit", feld: "Arbeit und Beschäftigung", kurz: "Arbeit" },
  { slug: "aussenpolitik", feld: "Außenpolitik und internationale Beziehungen", kurz: "Außenpolitik" },
  { slug: "bildung", feld: "Bildung und Erziehung", kurz: "Bildung" },
  { slug: "energie", feld: "Energie", kurz: "Energie" },
  { slug: "entwicklungspolitik", feld: "Entwicklungspolitik", kurz: "Entwicklung" },
  { slug: "europa", feld: "Europapolitik und Europäische Union", kurz: "Europa" },
  { slug: "gesellschaft", feld: "Gesellschaftspolitik, soziale Gruppen", kurz: "Gesellschaft" },
  { slug: "gesundheit", feld: "Gesundheit", kurz: "Gesundheit" },
  { slug: "innere-sicherheit", feld: "Innere Sicherheit", kurz: "Innere Sicherheit" },
  { slug: "kultur", feld: "Kultur", kurz: "Kultur" },
  { slug: "landwirtschaft", feld: "Landwirtschaft und Ernährung", kurz: "Landwirtschaft" },
  { slug: "medien-digitales", feld: "Medien, Kommunikation und Informationstechnik", kurz: "Medien & Digitales" },
  { slug: "migration", feld: "Migration und Aufenthaltsrecht", kurz: "Migration" },
  { slug: "politisches-leben", feld: "Politisches Leben, Parteien", kurz: "Politisches Leben" },
  { slug: "wohnen-bau", feld: "Raumordnung, Bau- und Wohnungswesen", kurz: "Wohnen & Bau" },
  { slug: "recht", feld: "Recht", kurz: "Recht" },
  { slug: "soziale-sicherung", feld: "Soziale Sicherung", kurz: "Soziale Sicherung" },
  { slug: "sport-freizeit", feld: "Sport, Freizeit und Tourismus", kurz: "Sport & Freizeit" },
  { slug: "staat-verwaltung", feld: "Staat und Verwaltung", kurz: "Staat & Verwaltung" },
  { slug: "umwelt", feld: "Umwelt", kurz: "Umwelt" },
  { slug: "verkehr", feld: "Verkehr", kurz: "Verkehr" },
  { slug: "verteidigung", feld: "Verteidigung", kurz: "Verteidigung" },
  { slug: "wirtschaft", feld: "Wirtschaft", kurz: "Wirtschaft" },
  { slug: "wissenschaft-forschung", feld: "Wissenschaft, Forschung und Technologie", kurz: "Wissenschaft" },
  { slug: "finanzen-steuern", feld: "Öffentliche Finanzen, Steuern und Abgaben", kurz: "Finanzen & Steuern" },
];

export function slugToFeld(slug: string): string | null {
  return THEMENFELDER.find((t) => t.slug === slug)?.feld ?? null;
}

export function feldToSlug(feld: string): string | null {
  return THEMENFELDER.find((t) => t.feld === feld)?.slug ?? null;
}

export function feldKurz(feld: string): string {
  return THEMENFELDER.find((t) => t.feld === feld)?.kurz ?? feld;
}
