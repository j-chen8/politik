/**
 * GENERISCHER Berlin-Unterthemen-Klassifikator (Factory pro Politikfeld).
 * Verallgemeinert scripts/_lib/unterthemen-wohnen-berlin.ts auf ALLE 16 Felder —
 * genutzt von scripts/spike-feld-unterthemen.ts (Validierung) und später vom
 * Global-Batch. Taxonomie-Quelle: scripts/_lib/themen-taxonomie-berlin.ts;
 * Feld-Tags (zum Sampling): src/lib/berlin-themen-struktur.ts.
 *
 * Disziplin wie beim Wohnen-Pilot (bestanden): geschlossene Unterthemen-Liste +
 * "Sonstiges"-Auffangventil + kern_im_feld-Flag AB LAUF 1 (Cross-Feld-Items nicht
 * ins nächstklingende Cluster zwingen). Grounding NUR im gegebenen Text.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { TAXONOMIE_BERLIN } from "./themen-taxonomie-berlin";
import { BERLIN_THEMENFELDER_ALLE } from "../../src/lib/berlin-themen-struktur";

export interface Klassifikator {
  feld: string;
  tags: readonly string[];           // Roh-Tags des Felds (thema_json) — fürs Sampling
  UNTERTHEMEN: readonly string[];     // geschlossene Liste inkl. "Sonstiges"
  SYSTEM: string;
  TOOL: Anthropic.Tool;
  normalizeUnterthema: (u: string) => string | null;
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/** Baut den Klassifikator für ein Feld-LABEL (z.B. "Verwaltung & Digitales"). */
export function buildKlassifikator(feldLabel: string): Klassifikator {
  const feldDef = BERLIN_THEMENFELDER_ALLE.find((f) => f.label === feldLabel);
  if (!feldDef) throw new Error(`Unbekanntes Feld-Label: ${feldLabel}`);
  const unter = TAXONOMIE_BERLIN[feldLabel];
  if (!unter || !unter.length) throw new Error(`Keine Taxonomie-Unterthemen für: ${feldLabel}`);
  const UNTERTHEMEN = [...unter, "Sonstiges"] as const;

  const SYSTEM = `Du klassifizierst Drucksachen des Berliner Abgeordnetenhauses, die dem Politikfeld „${feldLabel}" zugeordnet sind, in Unterthemen.

Regeln:
- Vergib EIN bis DREI Unterthemen aus der vorgegebenen Liste (multi-label — viele Vorlagen berühren mehrere). Wähle nur, was der Text wirklich trägt, nicht was entfernt anklingt.
- Wähle das SPEZIFISCHSTE passende Unterthema. Breite Sammel-Cluster (allgemeine „…planung", „…politik", „…organisation") NUR, wenn kein konkreteres Unterthema den Kern trifft — z.B. eine ÖPNV-Anbindung gehört zu „ÖPNV", nicht zu „Verkehrsplanung"; eine Rad-Frage zu „Radverkehr", nicht zu „Verkehrsplanung".
- WICHTIG: Liegt der inhaltliche KERN des Dokuments in einem ANDEREN Politikfeld (Berliner Felder sind u.a. Wohnen/Bauen, Verkehr, Verwaltung/Digitales, Soziales/Arbeit, Bildung, Innere Sicherheit/Justiz, Finanzen/Haushalt, Umwelt/Klima/Energie, Gesundheit/Pflege, Migration, Kultur/Sport, Wirtschaft) und „${feldLabel}" ist nur Randbezug oder Folge, dann vergib "Sonstiges" — zwinge das Dokument NICHT in das nächstklingende Cluster dieses Felds.
- "Sonstiges" gilt außerdem, wenn schlicht kein Listen-Unterthema passt.
- Setze kern_im_feld auf true, wenn der inhaltliche Kern wirklich in „${feldLabel}" liegt; auf false, wenn das Dokument primär in ein anderes Politikfeld gehört.
- Vergib zusätzlich 1–4 SPEZIFISCHE Tags: konkrete, wiederverwendbare Schlagwörter (Eigennamen, Programme, Gesetze, Institutionen, Orte). KEINE Einmal-Erfindungen, keine ganzen Sätze, keine Feldnamen. Wenn es kein sinnvolles spezifisches Tag gibt: leeres Array.
- Strikt neutral: beschreibe den Gegenstand, bewerte nicht.
- Grounde dich NUR im gegebenen Text.`;

  const TOOL: Anthropic.Tool = {
    name: "klassifiziere",
    description: "Gib Unterthemen, spezifische Tags und Feld-Kern-Flag für die Drucksache zurück.",
    input_schema: {
      type: "object",
      properties: {
        unterthemen: { type: "array", items: { type: "string", enum: [...UNTERTHEMEN] }, minItems: 1, maxItems: 3 },
        spezifische_tags: { type: "array", items: { type: "string" }, maxItems: 4 },
        kern_im_feld: { type: "boolean", description: `true = inhaltlicher Kern liegt im Feld „${feldLabel}"; false = Kern in einem anderen Politikfeld` },
      },
      required: ["unterthemen", "spezifische_tags", "kern_im_feld"],
    },
  };

  const list = UNTERTHEMEN as readonly string[];
  const normalizeUnterthema = (u: string): string | null => {
    const clean = u.replace(/&amp;/g, "&").trim();
    if (list.includes(clean)) return clean;
    const ranked = list.map((c) => ({ c, d: lev(clean.toLowerCase(), c.toLowerCase()) })).sort((a, b) => a.d - b.d);
    if (ranked[0].d <= 2 && (ranked.length < 2 || ranked[1].d - ranked[0].d >= 2)) return ranked[0].c;
    return null;
  };

  return { feld: feldLabel, tags: feldDef.tags, UNTERTHEMEN, SYSTEM, TOOL, normalizeUnterthema };
}

// ─── Prompt-Bau (geteilt Spike↔Batch) ───
export interface BerlinDsRow {
  klasse: string; thema_json: string; zusammenfassung: string | null;
  kerninhalt_json: string | null; kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null;
}
function joinJson(s: string | null): string {
  if (!s) return "";
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.join(" · ") : String(a); } catch { return ""; }
}
export function kerninhaltText(r: BerlinDsRow): string {
  if (r.klasse === "anfrage_antwort") {
    const f = joinJson(r.kerninhalt_frage_json), a = joinJson(r.kerninhalt_antwort_json);
    return [f && `FRAGE: ${f}`, a && `ANTWORT: ${a}`].filter(Boolean).join("\n") || "—";
  }
  return joinJson(r.kerninhalt_json) || "—";
}
export function themaTags(s: string): string {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.join(", ") : s; } catch { return s; }
}
export function buildUserText(r: BerlinDsRow): string {
  return `THEMA-TAGS (Alt-Klassifikation): ${themaTags(r.thema_json)}\n\nKLASSE: ${r.klasse}\n\nZUSAMMENFASSUNG: ${r.zusammenfassung ?? "—"}\n\nKERNINHALT:\n${kerninhaltText(r)}`;
}
