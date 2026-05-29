/**
 * Parteifarben — Hex, theme-unabhängig.
 * Geteilte Single Source of Truth für PoliticianAvatar + Politiker-Explorer.
 */
export function partyColors(party: string | null): { bg: string; fg: string } {
  const p = (party ?? "").toLowerCase();
  if (p.includes("spd")) return { bg: "#e3000f", fg: "#fff" };
  if (p === "cdu" || p.includes("christlich demo")) return { bg: "#000", fg: "#fff" };
  if (p === "csu") return { bg: "#0080c8", fg: "#fff" };
  if (p.includes("grün")) return { bg: "#1aa037", fg: "#fff" };
  if (p === "fdp" || p.includes("freie demo")) return { bg: "#ffed00", fg: "#000" };
  if (p === "afd") return { bg: "#009ee0", fg: "#fff" };
  if (p.includes("linke")) return { bg: "#bd2c80", fg: "#fff" };
  if (p === "bsw" || p.includes("wagenknecht")) return { bg: "#7d2972", fg: "#fff" };
  if (p.includes("freie wähler")) return { bg: "#0f4778", fg: "#fff" };
  if (p === "ssw") return { bg: "#003d8f", fg: "#fff" };
  if (p === "volt") return { bg: "#562883", fg: "#fff" };
  if (p === "ödp") return { bg: "#ed8b00", fg: "#fff" };
  if (p.includes("tierschutz")) return { bg: "#005d23", fg: "#fff" };
  if (p === "die partei") return { bg: "#b80000", fg: "#fff" };
  return { bg: "#9ca3af", fg: "#fff" }; // parteilos / unbekannt → grau
}

/** Nur die Hauptfarbe — für Punkte, Balken-Segmente, Chips. */
export function partyColor(party: string | null): string {
  return partyColors(party).bg;
}
