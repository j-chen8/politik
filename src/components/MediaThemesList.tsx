"use client";

import { useState, useEffect } from "react";
import { LayoutList, LayoutGrid } from "lucide-react";
import { ANSWER_TYPE_META, ANSWER_MATCH_META, youtubeUrlWithTimestamp } from "@/lib/media-appearances-shared";

type Theme = {
  title: string;
  timestamp_range: string;
  theme_description: string;
  position: string;
  quotes: Array<{ text: string; timestamp: string; context?: string }>;
  concrete_statements?: string[];
  related_bundestag_topics?: string[];
  answer_type: string;
  // Schema-Reform-Felder (optional, alte Analysen haben sie nicht):
  question_asked?: string;
  question_intent?: string;
  answer_match?: string;
  match_reasoning?: string;
  deflection_target?: string;
  evasion_note?: string;
};

const STORAGE_KEY = "media-themes-view-mode";
type ViewMode = "kompakt" | "vollstaendig";

export function MediaThemesList({
  themes,
  appearanceUrl,
  politicianName,
}: {
  themes: Theme[];
  appearanceUrl: string;
  politicianName: string;
}) {
  // Default 'kompakt'. Lade Preference aus localStorage nach Mount.
  const [mode, setMode] = useState<ViewMode>("kompakt");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "kompakt" || saved === "vollstaendig") setMode(saved);
    } catch {}
    setHydrated(true);
  }, []);

  const setAndPersist = (m: ViewMode) => {
    setMode(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {}
  };

  // Während Hydration: zeige Kompakt-Default (kein Flicker)
  const effectiveMode = hydrated ? mode : "kompakt";

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Themen im Detail
        </h2>
        <div className="inline-flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => setAndPersist("kompakt")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
              effectiveMode === "kompakt"
                ? "bg-card text-zinc-950 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            aria-pressed={effectiveMode === "kompakt"}
          >
            <LayoutList className="w-3.5 h-3.5" strokeWidth={2.25} />
            Kompakt
          </button>
          <button
            onClick={() => setAndPersist("vollstaendig")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
              effectiveMode === "vollstaendig"
                ? "bg-card text-zinc-950 dark:text-zinc-50 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            aria-pressed={effectiveMode === "vollstaendig"}
          >
            <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2.25} />
            Vollständig
          </button>
        </div>
      </div>

      {/* Themes */}
      <div className="space-y-3">
        {themes.map((theme, idx) => (
          <ThemeCard
            key={idx}
            idx={idx}
            theme={theme}
            mode={effectiveMode}
            appearanceUrl={appearanceUrl}
            politicianName={politicianName}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  idx,
  theme,
  mode,
  appearanceUrl,
  politicianName,
}: {
  idx: number;
  theme: Theme;
  mode: ViewMode;
  appearanceUrl: string;
  politicianName: string;
}) {
  const meta = ANSWER_TYPE_META[theme.answer_type] ?? { label: theme.answer_type, tone: "neutral" as const };
  const isAmber = meta.tone === "amber";
  const firstQuote = theme.quotes?.[0];

  // KOMPAKT
  if (mode === "kompakt") {
    return (
      <details
        id={`theme-${idx}`}
        className={`group bg-card border rounded-xl overflow-hidden scroll-mt-28 ${
          isAmber ? "border-amber-200/70 dark:border-amber-900/50" : "border-border"
        }`}
      >
        <summary className="p-4 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors list-none">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">#{idx + 1}</span>
            <span
              className={`text-[10.5px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                isAmber ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {meta.label}
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">{theme.timestamp_range}</span>
          </div>
          <h3 className="text-[15px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug mb-2">
            {theme.title}
          </h3>

          {/* Frage IMMER zeigen wenn Schema-Reform-Daten vorhanden */}
          {theme.question_asked && (
            <div className={`text-[12.5px] leading-relaxed mb-2 ${isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-600 dark:text-zinc-300"}`}>
              <span className="font-medium">Frage:</span> {theme.question_asked}
              {theme.deflection_target && (
                <>
                  {" · "}<span className="font-medium">Umleitung:</span> {theme.deflection_target}
                </>
              )}
            </div>
          )}

          {/* Erstes Zitat — kompakt */}
          {firstQuote && (
            <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 text-[13px] text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
              „{firstQuote.text.length > 200 ? firstQuote.text.slice(0, 200) + "…" : firstQuote.text}"
              <a
                href={youtubeUrlWithTimestamp(appearanceUrl, firstQuote.timestamp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="not-italic text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 num ml-2"
              >
                Min. {firstQuote.timestamp}
              </a>
            </blockquote>
          )}

          <div className="flex items-center justify-end mt-2 text-[11.5px] text-zinc-400 dark:text-zinc-500 group-open:hidden">
            Mehr Details ↓
          </div>
          <div className="flex items-center justify-end mt-2 text-[11.5px] text-zinc-400 dark:text-zinc-500 hidden group-open:flex">
            Weniger anzeigen ↑
          </div>
        </summary>

        {/* Expanded — alles weitere */}
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-4">
          <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{theme.theme_description}</p>

          {/* Frage-Intent + Match-Bewertung (Schema-Reform) */}
          {(theme.question_intent || theme.match_reasoning) && (
            <div className={`rounded-lg p-3 text-[12.5px] leading-relaxed space-y-1.5 ${
              isAmber ? "bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50" : "bg-zinc-50 dark:bg-zinc-800 border border-border"
            }`}>
              {theme.question_intent && (
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mr-2">
                    Erkenntnisinteresse
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{theme.question_intent}</span>
                </div>
              )}
              {theme.answer_match && ANSWER_MATCH_META[theme.answer_match] && (
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mr-2">
                    Match
                  </span>
                  <span className={`text-[11px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                    ANSWER_MATCH_META[theme.answer_match].tone === "amber"
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}>{ANSWER_MATCH_META[theme.answer_match].label}</span>
                </div>
              )}
              {theme.match_reasoning && (
                <div>
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mr-2">
                    Begründung
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{theme.match_reasoning}</span>
                </div>
              )}
            </div>
          )}

          {/* Fallback: alte evasion_note bei amber wenn keine match_reasoning vorhanden */}
          {!theme.match_reasoning && isAmber && theme.evasion_note && (
            <div className="bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 rounded-lg p-3 text-[12.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <span className="text-[10.5px] uppercase tracking-wider font-semibold text-amber-900 dark:text-amber-300 mr-2">
                Was nicht beantwortet wurde
              </span>
              {theme.evasion_note}
            </div>
          )}

          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              {politicianName} sagt
            </div>
            <p className="text-[13.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{theme.position}</p>
          </div>

          {/* Weitere Zitate (ohne das erste) */}
          {theme.quotes && theme.quotes.length > 1 && (
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Weitere Zitate
              </div>
              <div className="space-y-2.5">
                {theme.quotes.slice(1).map((q, qi) => (
                  <blockquote
                    key={qi}
                    className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 text-[13px] text-zinc-700 dark:text-zinc-300 italic leading-relaxed"
                  >
                    „{q.text}"
                    <div className="not-italic text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      <a
                        href={youtubeUrlWithTimestamp(appearanceUrl, q.timestamp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-950 dark:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 num"
                      >
                        Min. {q.timestamp}
                      </a>
                      {q.context && <span className="ml-2">· {q.context}</span>}
                    </div>
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {theme.concrete_statements && theme.concrete_statements.length > 0 && (
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Konkrete Aussagen / Forderungen
              </div>
              <ul className="space-y-1 text-[13px] text-zinc-700 dark:text-zinc-300">
                {theme.concrete_statements.map((s, si) => (
                  <li key={si}>· {s}</li>
                ))}
              </ul>
            </div>
          )}

          {theme.related_bundestag_topics && theme.related_bundestag_topics.length > 0 && (
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                Verwandte Bundestags-Themen
              </div>
              <div className="flex flex-wrap gap-1.5">
                {theme.related_bundestag_topics.map((t, ti) => (
                  <span
                    key={ti}
                    className="inline-block text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </details>
    );
  }

  // VOLLSTÄNDIG (wie ursprünglich)
  return (
    <article
      id={`theme-${idx}`}
      className={`bg-card border rounded-2xl overflow-hidden scroll-mt-28 ${
        isAmber ? "border-amber-200/70 dark:border-amber-900/50" : "border-border"
      }`}
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">#{idx + 1}</span>
          <span
            className={`text-[10.5px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
              isAmber ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {meta.label}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">{theme.timestamp_range}</span>
        </div>
        <h3 className="text-[16.5px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug mb-1.5">
          {theme.title}
        </h3>
        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{theme.theme_description}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Frage + Intent + Match — IMMER zeigen wenn Schema-Reform-Daten da */}
        {(theme.question_asked || theme.question_intent || theme.match_reasoning) && (
          <div className={`rounded-lg p-3.5 space-y-2 text-[13px] leading-relaxed ${
            isAmber ? "bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-zinc-700 dark:text-zinc-300" : "bg-zinc-50 dark:bg-zinc-800 border border-border text-zinc-700 dark:text-zinc-300"
          }`}>
            {theme.question_asked && (
              <div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold mr-2 ${
                  isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  Frage
                </span>
                {theme.question_asked}
              </div>
            )}
            {theme.question_intent && (
              <div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold mr-2 ${
                  isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  Erkenntnisinteresse
                </span>
                {theme.question_intent}
              </div>
            )}
            {theme.answer_match && ANSWER_MATCH_META[theme.answer_match] && (
              <div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold mr-2 ${
                  isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  Match
                </span>
                <span className={`text-[11px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${
                  ANSWER_MATCH_META[theme.answer_match].tone === "amber"
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}>{ANSWER_MATCH_META[theme.answer_match].label}</span>
              </div>
            )}
            {theme.deflection_target && (
              <div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold mr-2 ${
                  isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  Umleitung zu
                </span>
                {theme.deflection_target}
              </div>
            )}
            {theme.match_reasoning && (
              <div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold mr-2 ${
                  isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  Begründung
                </span>
                {theme.match_reasoning}
              </div>
            )}
            {!theme.match_reasoning && theme.evasion_note && (
              <div>
                <span className={`text-[10.5px] uppercase tracking-wider font-semibold mr-2 ${
                  isAmber ? "text-amber-900 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  Was nicht beantwortet wurde
                </span>
                {theme.evasion_note}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            {politicianName} sagt
          </div>
          <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{theme.position}</p>
        </div>

        {theme.quotes && theme.quotes.length > 0 && (
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Wörtlich
            </div>
            <div className="space-y-3">
              {theme.quotes.map((q, qi) => (
                <blockquote
                  key={qi}
                  className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 text-[13.5px] text-zinc-700 dark:text-zinc-300 italic leading-relaxed"
                >
                  „{q.text}"
                  <div className="not-italic text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <a
                      href={youtubeUrlWithTimestamp(appearanceUrl, q.timestamp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-950 dark:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 num"
                    >
                      Min. {q.timestamp}
                    </a>
                    {q.context && <span>· {q.context}</span>}
                  </div>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {theme.concrete_statements && theme.concrete_statements.length > 0 && (
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Konkrete Aussagen / Forderungen
            </div>
            <ul className="space-y-1 text-[13.5px] text-zinc-700 dark:text-zinc-300">
              {theme.concrete_statements.map((s, si) => (
                <li key={si}>· {s}</li>
              ))}
            </ul>
          </div>
        )}

        {theme.related_bundestag_topics && theme.related_bundestag_topics.length > 0 && (
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Verwandte Bundestags-Themen
            </div>
            <div className="flex flex-wrap gap-1.5">
              {theme.related_bundestag_topics.map((t, ti) => (
                <span
                  key={ti}
                  className="inline-block text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
