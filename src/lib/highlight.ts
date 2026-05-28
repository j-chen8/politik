import type { ReactNode } from "react";
import { createElement } from "react";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Splittet `text` an Vorkommen jedes `terms` (case-insensitive, Umlaut-aware via Native
 * String#toLowerCase, das im Gegensatz zu SQLite's LOWER auch Umlaute kennt).
 *
 * Returns ReactNode-Array: ungematched Teile als Strings, gematchte als <mark>-Elements
 * mit gegebener `className`.
 *
 * Beispiel:
 *   highlight("Die Bundeswehr ist...", ["bundeswehr"], "bg-yellow-200")
 *   → ["Die ", <mark>Bundeswehr</mark>, " ist..."]
 *
 * Filter leere terms und doppelte (case-insensitive).
 */
export function highlight(
  text: string,
  terms: string[],
  className: string = "bg-amber-100 text-zinc-900 rounded-[2px] px-[1px]"
): ReactNode[] {
  if (!text) return [];
  const cleaned = Array.from(
    new Set(
      terms
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
        .map((t) => t.toLowerCase())
    )
  );
  if (cleaned.length === 0) return [text];

  // Längere Terms zuerst, damit "Bundeswehr-Sondervermögen" nicht bei "bund" zerschnitten wird
  cleaned.sort((a, b) => b.length - a.length);
  const re = new RegExp(`(${cleaned.map(escapeRegex).join("|")})`, "gi");
  const parts = text.split(re);

  return parts.map((part, i) => {
    if (!part) return null;
    if (i % 2 === 1) {
      // Match-Capture-Group
      return createElement("mark", { key: i, className }, part);
    }
    return part;
  });
}
