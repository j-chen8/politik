import type { SpeechAnalysisV2 } from "@/lib/db";
import { TonalityBadge, RedenTypBadge } from "@/components/TonalityBadge";

interface Props {
  analysis: SpeechAnalysisV2;
}

// Deutsche Plural-Helpers für die Evidenz-Counter im Summary-Label.
function plural(n: number, singular: string, plural: string) {
  return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
}

export function SpeechAnalysisDetails({ analysis }: Props) {
  const evidenceCount =
    analysis.forderungen.length +
    analysis.woertliche_zitate.length +
    analysis.konkrete_zahlen.length;
  const modelCount =
    analysis.framing_marker.length + analysis.rhetorische_mittel.length;
  const hasContent = evidenceCount + modelCount > 0;

  const evidenceParts: string[] = [];
  if (analysis.forderungen.length > 0)
    evidenceParts.push(plural(analysis.forderungen.length, "Forderung", "Forderungen"));
  if (analysis.woertliche_zitate.length > 0)
    evidenceParts.push(plural(analysis.woertliche_zitate.length, "Zitat", "Zitate"));
  if (analysis.konkrete_zahlen.length > 0)
    evidenceParts.push(plural(analysis.konkrete_zahlen.length, "Zahl", "Zahlen"));

  return (
    <div className="mt-2.5 space-y-2">
      {/* Tags-Reihe: Tonalität + Reden-Typ */}
      {(analysis.tonalitaet || analysis.reden_typ) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <TonalityBadge slug={analysis.tonalitaet} />
          <RedenTypBadge code={analysis.reden_typ} />
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

      {/* Strukturierte Analyse — zwei Sektionen: Evidenz und Modell-Lesart */}
      {hasContent && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted hover:text-primary transition-colors select-none list-none">
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              <span className="group-open:hidden">
                {evidenceParts.length > 0 ? (
                  <>Belege: {evidenceParts.join(" · ")}</>
                ) : (
                  <>Modell-Lesart einblenden</>
                )}
              </span>
              <span className="hidden group-open:inline">
                Strukturierte Analyse ausblenden
              </span>
            </span>
          </summary>

          <div className="mt-2 rounded-lg bg-white border border-gray-200 px-4 py-3 space-y-4 text-[13px]">
            {/* Sektion A: Evidenz aus dem Text — Transparenz-Anker */}
            {evidenceCount > 0 && (
              <div className="space-y-3">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
                  Evidenz aus dem Text
                </div>

                {analysis.forderungen.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                      Forderungen / Positionen
                    </h4>
                    <ul className="space-y-1 list-disc pl-4">
                      {analysis.forderungen.map((f, i) => (
                        <li key={i} className="text-foreground/85 leading-snug">
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
              </div>
            )}

            {/* Sektion B: Modell-Lesart — pro Rede individuell, nicht aggregierbar */}
            {modelCount > 0 && (
              <div className="space-y-2">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
                  Modell-Lesart
                </div>
                <p className="text-[11.5px] text-zinc-500 leading-relaxed italic">
                  Wie das Klassifizier-Modell die Rede strukturiert. Pro Rede individuell ausgewählt — nicht statistisch über Reden aggregierbar.
                </p>

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
            )}
          </div>
        </details>
      )}
    </div>
  );
}
