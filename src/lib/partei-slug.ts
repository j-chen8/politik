/**
 * URL-Slug ↔ kanonischer Parteiname (wie in partei_themenfeld_position / bundestag_votes).
 * Feste Liste der 5 BTW-2025-Fraktionen, in Bundestags-Reihenfolge (21. WP).
 */
export const PARTEIEN: { slug: string; partei: string; kurz: string }[] = [
  { slug: "cdu-csu", partei: "CDU/CSU", kurz: "CDU/CSU" },
  { slug: "afd", partei: "AfD", kurz: "AfD" },
  { slug: "spd", partei: "SPD", kurz: "SPD" },
  { slug: "gruene", partei: "GRÜNE", kurz: "Grüne" },
  { slug: "linke", partei: "LINKE", kurz: "Die Linke" },
];

export function slugToPartei(slug: string): string | null {
  return PARTEIEN.find((p) => p.slug === slug)?.partei ?? null;
}

export function parteiToSlug(partei: string): string | null {
  return PARTEIEN.find((p) => p.partei === partei)?.slug ?? null;
}
