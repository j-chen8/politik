/**
 * Deutsche Fließtext-Daten ("29. Juli 2025") → ISO ("2025-07-29").
 * Toleriert OCR-Macken aus PDF-Extraktion: fehlender Punkt nach dem Tag
 * ("21 Mai 2025") und fehlendes Leerzeichen vor dem Jahr ("November2025").
 * Gibt null zurück, wenn Tag/Monat/Jahr fehlen oder unplausibel sind
 * (z.B. OCR-Jahr "202S", fehlendes Jahr "2. April").
 */
const MONTHS: Record<string, number> = {
  januar: 1, februar: 2, "märz": 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
};

export function parseGermanDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let t = raw.trim().toLowerCase().replace(/\s+/g, " ");
  t = t.replace(/([a-zä])(\d{4})/, "$1 $2"); // "november2025" → "november 2025"
  const m = t.match(/^(\d{1,2})\.?\s+([a-zä]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const mon = MONTHS[m[2]];
  const year = parseInt(m[3], 10);
  if (!mon || !year || year < 2020 || year > 2030 || day < 1 || day > 31) return null;
  return `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Wie parseGermanDate, verwirft aber Antwortdaten, die NACH dem
 * Publikationsdatum der Sammeldrucksache liegen — eine Antwort kann nie
 * nach der Veröffentlichung datiert sein, also ist so etwas ein Quell-Typo
 * (z.B. "17. Juni 2026" in einer 2025er-DS). Fällt dann auf null zurück.
 */
export function parseAntwortDatumIso(raw: string | null | undefined, publicationDate: string | null | undefined): string | null {
  const iso = parseGermanDate(raw);
  if (iso && publicationDate && iso > publicationDate) return null;
  return iso;
}
