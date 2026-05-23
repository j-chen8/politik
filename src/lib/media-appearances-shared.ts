/**
 * Client-safe helpers + constants — kein fs/path Import.
 * Loader (mit fs) lebt in media-appearances.ts (server-only).
 */

/** Labels + Farben für Antwort-Typen — UI-tauglich, neutral benannt. */
export const ANSWER_TYPE_META: Record<string, { label: string; tone: "neutral" | "amber" }> = {
  substantielle_position: { label: "Substantielle Antwort", tone: "neutral" },
  teilweise_antwort: { label: "Teilantwort", tone: "amber" },
  themenwechsel: { label: "Themenwechsel", tone: "amber" },
  pivot_zum_gegenpunkt: { label: "Antwort zu anderem Bezugspunkt", tone: "amber" },
  floskel_generisch: { label: "Allgemeinplatz", tone: "amber" },
  offene_verweigerung: { label: "Antwort verweigert", tone: "amber" },
  gegenfrage: { label: "Gegenfrage", tone: "amber" },
};

/** Labels für answer_match — Schema-Reform-Feld, direkte Match-Bewertung. */
export const ANSWER_MATCH_META: Record<string, { label: string; tone: "neutral" | "amber" }> = {
  voll_adressiert: { label: "Voll adressiert", tone: "neutral" },
  teil_adressiert: { label: "Teilweise adressiert", tone: "amber" },
  verschoben: { label: "Auf anderes Thema verschoben", tone: "amber" },
  umgeleitet_gegenpunkt: { label: "Auf anderen Bezugspunkt umgeleitet", tone: "amber" },
  verweigert: { label: "Antwort verweigert", tone: "amber" },
  kein_direkter_anlass: { label: "Eigeninitiative", tone: "neutral" },
};

/** Konvertiert "HH:MM:SS" → Sekunden für YouTube-Timestamp-Link (?t=Xs). */
export function timestampToSeconds(ts: string): number {
  const m = ts.match(/^(\d{2}):(\d{2}):(\d{2})/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

/** Baut YouTube-URL mit Timestamp-Parameter. */
export function youtubeUrlWithTimestamp(baseUrl: string, ts: string): string {
  const sec = timestampToSeconds(ts);
  if (sec === 0) return baseUrl;
  return baseUrl.includes("?") ? `${baseUrl}&t=${sec}s` : `${baseUrl}?t=${sec}s`;
}
