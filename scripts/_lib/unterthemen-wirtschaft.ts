/**
 * Geteilte Definition der Wirtschaft-Unterthemen-Klassifikation:
 * Taxonomie (11 Cluster + Sonstiges), System-Prompt und Tool-Schema.
 * Genutzt von scripts/spike-wirtschaft-unterthemen.ts (Validierung, live)
 * und scripts/batch-wirtschaft-unterthemen.ts (voller Lauf, Batch API).
 *
 * Stand = Lauf-2-Patch (docs/themen-unterthemen-design.md):
 *   - 11. Cluster „Wettbewerb & Kartellrecht" (Spike-Befund 2)
 *   - Sonstiges-Regel geschärft + kern_im_feld-Flag (Spike-Befund 1:
 *     Cross-Feld-Items nicht mehr ins nächstklingende Cluster zwingen)
 */
import type Anthropic from "@anthropic-ai/sdk";

export const FELD = "Wirtschaft";

export const UNTERTHEMEN = [
  "Industrie- & Standortpolitik",
  "Außenhandel, Zölle & Rohstoffe",
  "Digital- & KI-Wirtschaft",
  "Energiewirtschaft & Energiekosten",
  "Lieferketten & Unternehmensverantwortung",
  "Wirtschaftsförderung & Subventionen",
  "Mittelstand, Handwerk & Gründung",
  "Fachkräfte & Arbeitsmarkt-Wirtschaft",
  "Verbraucherschutz",
  "Konjunktur, Wachstum & Gesamtsteuerung",
  "Wettbewerb & Kartellrecht",
  "Sonstiges",
] as const;

export const SYSTEM = `Du klassifizierst Drucksachen des Deutschen Bundestags, die dem Politikfeld WIRTSCHAFT zugeordnet sind, in Unterthemen.

Regeln:
- Vergib EIN bis DREI Unterthemen aus der vorgegebenen Liste (multi-label — die meisten Vorlagen berühren mehrere). Wähle nur, was der Text wirklich trägt, nicht was entfernt anklingt.
- WICHTIG: Liegt der inhaltliche KERN des Dokuments in einem ANDEREN Politikfeld (z. B. Gesundheit, Wohnen, Verkehr, Landwirtschaft, Raumfahrt) und Wirtschaft ist nur Randbezug oder Folge, dann vergib "Sonstiges" — zwinge das Dokument NICHT in das nächstklingende Wirtschafts-Cluster. Beispiel: Eine Anfrage zu Impfschäden ist Gesundheitspolitik, auch wenn Entschädigungskosten vorkommen → Sonstiges.
- "Sonstiges" gilt außerdem, wenn schlicht kein Listen-Unterthema passt.
- Setze kern_im_feld auf true, wenn der inhaltliche Kern wirklich Wirtschaftspolitik ist; auf false, wenn das Dokument primär in ein anderes Politikfeld gehört.
- Vergib zusätzlich 1–4 SPEZIFISCHE Tags: konkrete, wiederverwendbare Schlagwörter (z.B. "Künstliche Intelligenz", "Krypto-Assets", "Lieferkettengesetz", "Halbleiter", "Strompreis"). KEINE Einmal-Erfindungen, keine ganzen Sätze, keine Feldnamen. Wenn es kein sinnvolles spezifisches Tag gibt: leeres Array.
- Strikt neutral: beschreibe den Gegenstand, bewerte nicht.
- Grounde dich NUR im gegebenen Text.`;

export const TOOL: Anthropic.Tool = {
  name: "klassifiziere",
  description: "Gib Unterthemen, spezifische Tags und Feld-Kern-Flag für die Drucksache zurück.",
  input_schema: {
    type: "object",
    properties: {
      unterthemen: { type: "array", items: { type: "string", enum: [...UNTERTHEMEN] }, minItems: 1, maxItems: 3 },
      spezifische_tags: { type: "array", items: { type: "string" }, maxItems: 4 },
      kern_im_feld: { type: "boolean", description: "true = inhaltlicher Kern liegt im Feld Wirtschaft; false = Kern liegt in einem anderen Politikfeld" },
    },
    required: ["unterthemen", "spezifische_tags", "kern_im_feld"],
  },
};

export function buildUserText(r: { thema: string | null; zusammenfassung: string | null; kerninhalt: string | null }): string {
  return `THEMA-FELD (Alt-Klassifikation): ${r.thema ?? "—"}\n\nZUSAMMENFASSUNG: ${r.zusammenfassung ?? "—"}\n\nKERNINHALT: ${r.kerninhalt ?? "—"}`;
}

// Tool-Use-Enum-Drift (im Validierungslauf beobachtet): „&" kommt vereinzelt als
// HTML-Entity „&amp;" zurück. Normalisieren + gegen die Liste validieren.
export function normalizeUnterthema(u: string): string | null {
  const clean = u.replace(/&amp;/g, "&").trim();
  return (UNTERTHEMEN as readonly string[]).includes(clean) ? clean : null;
}
