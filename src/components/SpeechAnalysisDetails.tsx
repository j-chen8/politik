import type { SpeechAnalysisV2 } from "@/lib/db";

/**
 * Tonalitäts-Klassen-Beschriftung (Methodologie v2.1, partei-neutral).
 * Farben: cool/neutral für sachlich-deskriptive, warm für konfrontative.
 */
const TONALITAET_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  sachlich: { label: "sachlich", color: "#374151", bg: "#f3f4f6" },
  polemisch: { label: "polemisch", color: "#b91c1c", bg: "#fee2e2" },
  polemisch_sachlich: {
    label: "polemisch-sachlich",
    color: "#9a3412",
    bg: "#ffedd5",
  },
  emotional_persoenlich: {
    label: "emotional-persönlich",
    color: "#7c3aed",
    bg: "#ede9fe",
  },
  konfrontativ_belegend: {
    label: "konfrontativ-belegend",
    color: "#1d4ed8",
    bg: "#dbeafe",
  },
  ironisch_jugendlich: {
    label: "ironisch",
    color: "#a16207",
    bg: "#fef3c7",
  },
  bilanzierend_werbend: {
    label: "bilanzierend",
    color: "#15803d",
    bg: "#dcfce7",
  },
  staatsmaennisch: {
    label: "staatsmännisch",
    color: "#1e40af",
    bg: "#dbeafe",
  },
  defensiv_pragmatisch: {
    label: "defensiv-pragmatisch",
    color: "#475569",
    bg: "#f1f5f9",
  },
  sozial_anklagend: {
    label: "sozial-anklagend",
    color: "#be185d",
    bg: "#fce7f3",
  },
  mahnend: { label: "mahnend", color: "#854d0e", bg: "#fef9c3" },
};

const REDEN_TYP_LABELS: Record<string, string> = {
  A: "Polemische Opposition",
  B: "Sachlich-fachliche Opposition",
  C: "Persönliche Anekdotenrede",
  D: "Konfrontativ-belegend",
  E: "Bilanz-/Erfolgs-Rede",
  F: "Sachlich-technisch",
  G: "Sozialgerechtigkeits-Rede",
  H: "Regierungserklärung",
  I: "Fragestunde-Antwort",
  J: "Zwischenfrage",
  K: "Außenpolitik",
};

function formatRedenTyp(typ: string | null): string | null {
  if (!typ) return null;
  // "A+B" → "Polemische Opposition + Sachlich-fachliche Opposition"
  return typ
    .split("+")
    .map((t) => REDEN_TYP_LABELS[t.trim()] ?? t.trim())
    .join(" + ");
}

interface Props {
  analysis: SpeechAnalysisV2;
}

export function SpeechAnalysisDetails({ analysis }: Props) {
  const tonConfig = analysis.tonalitaet
    ? TONALITAET_CONFIG[analysis.tonalitaet]
    : null;
  const typLabel = formatRedenTyp(analysis.reden_typ);

  const hasContent =
    analysis.forderungen.length > 0 ||
    analysis.woertliche_zitate.length > 0 ||
    analysis.framing_marker.length > 0 ||
    analysis.konkrete_zahlen.length > 0;

  return (
    <div className="mt-2.5 space-y-2">
      {/* Tags-Reihe: Tonalität + Reden-Typ */}
      {(tonConfig || typLabel) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {tonConfig && (
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
              style={{
                color: tonConfig.color,
                backgroundColor: tonConfig.bg,
              }}
              title={`Tonalität: ${tonConfig.label} (Klassifikation gemäß Methodologie v2.1)`}
            >
              {tonConfig.label}
            </span>
          )}
          {typLabel && (
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-medium text-muted bg-gray-100"
              title="Reden-Typ"
            >
              {typLabel}
            </span>
          )}
          {analysis.has_correction && (
            <span
              className="ml-auto text-[10px] uppercase tracking-wider text-muted/60 font-semibold"
              title={
                analysis.fix_source === "manual_override"
                  ? "Bias-Audit: manuell korrigiert (siehe Methodik)"
                  : analysis.fix_source === "mapping"
                    ? "Bias-Audit: maschinell korrigiert (siehe Methodik)"
                    : "v2.1-Re-Batch (Bias-Audit)"
              }
            >
              v2.1
            </span>
          )}
        </div>
      )}

      {/* Strukturierte Inhalte einklappbar */}
      {hasContent && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted hover:text-primary transition-colors select-none list-none">
            <span className="inline-flex items-center gap-1">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              <span className="group-open:hidden">
                Strukturierte Analyse einblenden
              </span>
              <span className="hidden group-open:inline">
                Strukturierte Analyse ausblenden
              </span>
            </span>
          </summary>

          <div className="mt-2 rounded-lg bg-white border border-gray-200 px-4 py-3 space-y-3 text-[13px]">
            {analysis.forderungen.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Forderungen / Positionen
                </h4>
                <ul className="space-y-1 list-disc pl-4">
                  {analysis.forderungen.map((f, i) => (
                    <li
                      key={i}
                      className="text-foreground/85 leading-snug"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.woertliche_zitate.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-2">
                  <span>Wörtliche Zitate</span>
                  {analysis.quote_total_count > 0 && (
                    <span
                      className="text-[10px] font-normal text-muted/70"
                      title={`${analysis.quote_valid_count} von ${analysis.quote_total_count} Zitaten als exakter Substring im Originaltext bestätigt`}
                    >
                      ({analysis.quote_valid_count}/
                      {analysis.quote_total_count} validiert)
                    </span>
                  )}
                </h4>
                <ul className="space-y-1.5">
                  {analysis.woertliche_zitate.map((q, i) => (
                    <li
                      key={i}
                      className="text-foreground/85 italic leading-snug border-l-2 border-primary/30 pl-3"
                    >
                      „{q}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.konkrete_zahlen.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Konkrete Zahlen
                </h4>
                <ul className="space-y-0.5 list-disc pl-4">
                  {analysis.konkrete_zahlen.map((z, i) => (
                    <li key={i} className="text-foreground/85 leading-snug">
                      {z}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.framing_marker.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Framing-Marker
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.framing_marker.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-muted font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.rhetorische_mittel.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Rhetorische Mittel
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.rhetorische_mittel.map((m, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-muted"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
