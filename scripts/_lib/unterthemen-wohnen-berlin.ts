/**
 * Geteilte Definition der BERLIN-Wohnen-Unterthemen-Klassifikation:
 * Taxonomie (12 Unterthemen + Sonstiges), System-Prompt und Tool-Schema.
 * Pendant zu scripts/_lib/unterthemen-wirtschaft.ts (Bund).
 *
 * Genutzt von scripts/spike-wohnen-unterthemen.ts (Validierung, live, kein DB-Write)
 * und später scripts/batch-wohnen-unterthemen.ts (Pilot-Batch).
 *
 * Stand = Discovery Phase B (docs/themen-unterthemen-berlin.md):
 *   - 12 Unterthemen aus der gepatchten Taxonomie (9→12: +Vergesellschaftung/Enteignung,
 *     +Wohneigentum, +Kleingärten) — Single Source: themen-taxonomie-berlin.ts.
 *   - Sonstiges-Regel scharf + kern_im_feld-Flag AB LAUF 1 (B4: ~12–15 % Cross-Feld-
 *     Rauschen; BT-Lauf-1-Pathologie „Ventil unbenutzt" von vornherein vermeiden).
 */
import type Anthropic from "@anthropic-ai/sdk";
import { TAXONOMIE_BERLIN } from "./themen-taxonomie-berlin";

export const FELD = "Stadtentwicklung, Bauen & Wohnen";

export const UNTERTHEMEN = [
  ...TAXONOMIE_BERLIN[FELD],
  "Sonstiges",
] as const;

export const SYSTEM = `Du klassifizierst Drucksachen des Berliner Abgeordnetenhauses, die dem Politikfeld STADTENTWICKLUNG, BAUEN & WOHNEN zugeordnet sind, in Unterthemen.

Regeln:
- Vergib EIN bis DREI Unterthemen aus der vorgegebenen Liste (multi-label — viele Vorlagen berühren mehrere). Wähle nur, was der Text wirklich trägt, nicht was entfernt anklingt.
- WICHTIG: Liegt der inhaltliche KERN des Dokuments in einem ANDEREN Politikfeld (z. B. Finanzen/Haushalt, Migration/Geflüchtete, Umwelt/Wasser, Verkehr, Soziales, Kultur) und Wohnen/Stadtentwicklung ist nur Randbezug oder Folge, dann vergib "Sonstiges" — zwinge das Dokument NICHT in das nächstklingende Wohnen-Cluster. Beispiele: Ein Haushaltsgesetz mit einzelnen Wohnungs-Posten ist Finanzpolitik → Sonstiges; eine Anfrage zu Abwasser-/Trinkwasser-Erschließung ist Umwelt/Infrastruktur → Sonstiges; ein Landesaufnahmeprogramm für Geflüchtete ist Migration, auch wenn Unterkünfte vorkommen → Sonstiges.
- "Sonstiges" gilt außerdem, wenn schlicht kein Listen-Unterthema passt.
- Setze kern_im_feld auf true, wenn der inhaltliche Kern wirklich Stadtentwicklung/Bauen/Wohnen ist; auf false, wenn das Dokument primär in ein anderes Politikfeld gehört.
- Unterscheidungshilfen innerhalb des Felds: "Mietregulierung & Mieterschutz" (Miethöhe, Milieuschutz/Vorkauf, Mietendeckel, Wohngeld) ≠ "Sozialer & landeseigener Wohnungsbau" (HOWOGE/degewo/Sozialwohnungs-Neubau, Belegungsbindung) ≠ "Vergesellschaftung & Enteignung" (Volksentscheid DW&Co, Art. 15 GG) ≠ "Wohneigentum & Eigentumsförderung" (Selbstnutzer, Einfamilienhaus, Grunderwerbsteuer). "Bauleitplanung & Bebauungspläne" = B-Pläne/Baurecht/Baubeschleunigung; "Große Stadtentwicklungsprojekte" = benannte Großvorhaben/Quartiere.
- Vergib zusätzlich 1–4 SPEZIFISCHE Tags: konkrete, wiederverwendbare Schlagwörter (z.B. "Milieuschutz", "HOWOGE", "Vorkaufsrecht", "Mietendeckel", "Modulare Unterkünfte", "Bebauungsplan"). KEINE Einmal-Erfindungen, keine ganzen Sätze, keine Feldnamen. Wenn es kein sinnvolles spezifisches Tag gibt: leeres Array.
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
      kern_im_feld: { type: "boolean", description: "true = inhaltlicher Kern liegt im Feld Stadtentwicklung/Bauen/Wohnen; false = Kern liegt in einem anderen Politikfeld" },
    },
    required: ["unterthemen", "spezifische_tags", "kern_im_feld"],
  },
};

// Tool-Use-Enum-Drift: (a) „&amp;" → „&" (BT), (b) seltene Tippfehler/OCR-artige
// Zeichendreher trotz JSON-Schema-Enum (Pilot: „Kleingarïten", „Gebäudeverwahrlofung").
// Fuzzy-Fallback über Levenshtein ≤2 gegen die kanonische Liste, aber nur bei
// EINDEUTIGEM nächstem Treffer (sonst null = echte Halluzination verwerfen).
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
export function normalizeUnterthema(u: string): string | null {
  const clean = u.replace(/&amp;/g, "&").trim();
  const list = UNTERTHEMEN as readonly string[];
  if (list.includes(clean)) return clean;
  // Fuzzy: nächster Listen-Eintrag mit Distanz ≤2, eindeutig (Abstand zum Zweitnächsten ≥2).
  const ranked = list.map((c) => ({ c, d: lev(clean.toLowerCase(), c.toLowerCase()) })).sort((a, b) => a.d - b.d);
  if (ranked[0].d <= 2 && (ranked.length < 2 || ranked[1].d - ranked[0].d >= 2)) return ranked[0].c;
  return null;
}

// ─── Prompt-Bau (geteilt Spike↔Batch, damit die Validierung sich überträgt) ───
// kerninhalt liegt je nach Klasse in verschiedenen JSON-Feldern (Berlin-Schema):
//   antrag/gesetzentwurf/vorlage_senat → kerninhalt_json
//   anfrage_antwort                    → kerninhalt_frage_json + kerninhalt_antwort_json
export interface WohnenRow {
  klasse: string;
  thema_json: string;
  zusammenfassung: string | null;
  kerninhalt_json: string | null;
  kerninhalt_frage_json: string | null;
  kerninhalt_antwort_json: string | null;
}

function joinJson(s: string | null): string {
  if (!s) return "";
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.join(" · ") : String(a); } catch { return ""; }
}

export function kerninhaltText(r: WohnenRow): string {
  if (r.klasse === "anfrage_antwort") {
    const f = joinJson(r.kerninhalt_frage_json), a = joinJson(r.kerninhalt_antwort_json);
    return [f && `FRAGE: ${f}`, a && `ANTWORT: ${a}`].filter(Boolean).join("\n") || "—";
  }
  return joinJson(r.kerninhalt_json) || "—";
}

export function themaTags(s: string): string {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.join(", ") : s; } catch { return s; }
}

export function buildUserText(r: WohnenRow): string {
  return `THEMA-TAGS (Alt-Klassifikation): ${themaTags(r.thema_json)}\n\nKLASSE: ${r.klasse}\n\nZUSAMMENFASSUNG: ${r.zusammenfassung ?? "—"}\n\nKERNINHALT:\n${kerninhaltText(r)}`;
}
