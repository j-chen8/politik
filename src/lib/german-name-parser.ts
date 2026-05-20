/**
 * Parser für deutsche Personennamen mit Adelspartikel-Erkennung.
 *
 * Hintergrund: ein naiver `split(/\s+/)` und `parts.pop()` als Nachname schlägt
 * bei Namen wie "Ulrich von Zons" fehl — er liefert "Zons" statt "von Zons".
 * Dieser Parser absorbiert Partikel rückwärts in den Nachnamen.
 */

export const NAME_PARTICLES = new Set([
  "von", "van", "de", "du", "der", "den", "zu", "vom",
  "ten", "ter", "da", "di", "dos", "dal", "del", "le", "la",
]);

export interface ParsedName {
  firstName: string;
  lastName: string;
  /** Akademischer Titel-Präfix: "Dr.", "Prof.", "Prof. Dr.", oder null. */
  title: string | null;
}

/**
 * Splittet einen vollen Namen in firstName / lastName und absorbiert
 * Adelspartikel ("von", "van", "de", "zu", …) in den Nachnamen.
 * Trennt akademische Titel-Präfixe vor dem Namen ab.
 *
 *  "Friedrich Merz"            → { first: "Friedrich",    last: "Merz",         title: null }
 *  "Ulrich von Zons"           → { first: "Ulrich",       last: "von Zons",     title: null }
 *  "Dr. Konstantin von Notz"   → { first: "Konstantin",   last: "von Notz",     title: "Dr." }
 *  "Prof. Dr. Andreas Lenz"    → { first: "Andreas",      last: "Lenz",         title: "Prof. Dr." }
 *  "Ursula von der Leyen"      → { first: "Ursula",       last: "von der Leyen",title: null }
 */
export function parseGermanName(input: string): ParsedName {
  let s = input.trim();
  let title: string | null = null;

  // Wahlkreis-Eindeutigkeitssuffix wie "Stephan Mayer (Altötting)" entfernen
  s = s.replace(/\s*\([^()]+\)\s*$/, "").trim();

  const titleMatch = s.match(/^(Prof\.\s*Dr\.|Prof\.|Dr\.)\s+/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/\s+/g, " ").trim();
    s = s.slice(titleMatch[0].length).trim();
  }

  s = s.replace(/^(Freiherr|Freifrau)\s+/i, "").trim();
  if (!s) return { firstName: "", lastName: "", title };

  const parts = s.split(/\s+/);
  if (parts.length === 1) return { firstName: "", lastName: parts[0], title };

  let lastNameStart = parts.length - 1;
  while (
    lastNameStart > 0 &&
    NAME_PARTICLES.has(parts[lastNameStart - 1].toLowerCase())
  ) {
    lastNameStart--;
  }

  if (lastNameStart === 0) return { firstName: "", lastName: parts.join(" "), title };

  return {
    firstName: parts.slice(0, lastNameStart).join(" "),
    lastName: parts.slice(lastNameStart).join(" "),
    title,
  };
}

/**
 * Spezialform für die DIP-API: titel = "FirstName LastName, MdB, Partei".
 */
export function parseDipTitle(titel: string): ParsedName {
  return parseGermanName(titel.split(",")[0] ?? "");
}

/**
 * Normalisiert Namen für tolerantes Matching:
 *  - Umlaute zu Ersatzschreibung: ö→oe, ä→ae, ü→ue, ß→ss
 *    (DIP liefert „Koegel" für DB-Eintrag „Kögel"; Bundestag schreibt
 *    „Rainer Groß", abgeordnetenwatch oft „Rainer Gross")
 *  - Diakritika entfernen: ć/č/ğ/ž/é/ñ → c/c/g/z/e/n
 *  - Bindestrich → Space („Alabali-Radovan" ↔ „Alabali Radovan")
 *  - Lowercase
 *
 * Geteilte Funktion für seed-activities.ts + rematch-activities.ts —
 * Drift zwischen beiden hat den Jennifer-Groß-Bug ausgelöst (Bundestag
 * 21/2363: Rainer Groß → fälschlich Jennifer Groß zugeordnet).
 */
export function normalizeName(s: string): string {
  return s
    .replace(/ö/g, "oe").replace(/Ö/g, "Oe")
    .replace(/ä/g, "ae").replace(/Ä/g, "Ae")
    .replace(/ü/g, "ue").replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/[-‐‑‒–—―]/g, " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
