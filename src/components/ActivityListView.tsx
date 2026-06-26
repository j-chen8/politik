import { listActivitiesGrouped, getActivityTypes } from "@/lib/db";
import { ActivityFilters } from "@/components/ActivityFilters";
import {
  FileText,
  MessageSquare,
  Mic,
  Scale,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const ROWS_PER_PAGE = 30;

const artIconMap: Record<string, typeof FileText> = {
  "Kleine Anfrage": MessageSquare,
  "Große Anfrage": MessageSquare,
  Frage: MessageSquare,
  Antwort: MessageSquare,
  Rede: Mic,
  Kurzintervention: Mic,
  Zwischenfrage: Mic,
  Erwiderung: Mic,
  Antrag: FileText,
  Änderungsantrag: FileText,
  Entschließungsantrag: FileText,
  Gesetzentwurf: Scale,
  Berichterstattung: FileText,
};

function getIcon(art: string) {
  for (const [key, Icon] of Object.entries(artIconMap)) {
    if (art.includes(key)) return Icon;
  }
  return FileText;
}

const DEFAULT_INTRO: ReactNode = (
  <>
    Datenstand: 21. Wahlperiode (ab 31.03.2025) — frühere Wahlperioden (WP18–20) noch nicht
    eingespielt, keine wahlperioden-übergreifenden Trends. Mehr in der{" "}
    <a
      href="/methodik"
      className="underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-700 dark:hover:decoration-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
    >
      Methodik
    </a>
    .
  </>
);

export interface ActivityListViewProps {
  /** Überschrift der Seite, z.B. "Gesetzentwürfe". */
  title: string;
  /** Wort hinter der Gesamtzahl, z.B. "Gesetzentwürfe" → "313 Gesetzentwürfe · 21. WP". */
  countLabel: string;
  /** Fester aktivitaetsart-Filter (ein Wert oder mehrere). Ohne = alle. */
  art?: string | string[];
  query?: string;
  page: number;
  /** Pfad für Pagination-Links (z.B. "/gesetze"). */
  basePath: string;
  /** Hinweiszeile unter der Zahl. Default = Datenstand/Methodik-Note. */
  intro?: ReactNode;
  /** Typ-Filter-Leiste (nur für die Allesicht /aktivitaeten sinnvoll). */
  showFilters?: boolean;
  activeTyp?: string;
  /** Linear-Strip mit Typ-Zählungen (nur Allesicht). */
  showTypeStats?: boolean;
}

export function ActivityListView({
  title,
  countLabel,
  art,
  query,
  page,
  basePath,
  intro = DEFAULT_INTRO,
  showFilters = false,
  activeTyp,
  showTypeStats = false,
}: ActivityListViewProps) {
  const offset = (page - 1) * ROWS_PER_PAGE;

  const { rows, total } = listActivitiesGrouped({
    query: query || undefined,
    art,
    limit: ROWS_PER_PAGE,
    offset,
  });

  const totalPages = Math.ceil(total / ROWS_PER_PAGE);
  const activityTypes = showTypeStats ? getActivityTypes() : [];

  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (activeTyp) sp.set("typ", activeTyp);
    if (query) sp.set("q", query);
    sp.set("seite", String(n));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">
            {title}
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="num text-[15px] text-zinc-950 dark:text-zinc-50 font-medium">
              {total.toLocaleString("de-DE")}
            </span>
            <span className="text-[13px] text-zinc-500 dark:text-zinc-400">
              {countLabel} · 21. Wahlperiode
            </span>
          </div>
          {intro && (
            <p className="mt-1.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">{intro}</p>
          )}
        </div>

        {showFilters && (
          <ActivityFilters activeTyp={activeTyp} query={query} basePath={basePath} />
        )}

        {showTypeStats && (
          <div className="mt-6 mb-8 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
            {activityTypes.slice(0, 8).map((t) => (
              <div key={t.art} className="inline-flex items-baseline gap-1.5">
                <span className="num font-semibold text-zinc-950 dark:text-zinc-50">
                  {t.count.toLocaleString("de-DE")}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">{t.art}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`space-y-1.5${showFilters || showTypeStats ? "" : " mt-6"}`}>
          {rows.map((a) => {
            const Icon = getIcon(a.aktivitaetsart);
            const dateStr = a.datum
              ? new Date(a.datum).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : null;
            const dsSlug = a.drucksache_nr?.replace("/", "-");
            const dsDetailHref = dsSlug ? `/aktivitaeten/${dsSlug}` : null;

            if (a.kind === "grouped" && a.party_set && a.party_set.length > 0) {
              const isBerichterstattung = a.aktivitaetsart === "Berichterstattung";
              const personLabel = isBerichterstattung
                ? `${a.person_count} Berichterstatter:in${a.person_count === 1 ? "" : "nen"}`
                : `${a.person_count} Mitzeichner:in${a.person_count === 1 ? "" : "nen"}`;
              const fraktionLabel =
                a.party_set.length === 1
                  ? `(${a.party_set[0]})`
                  : `aus ${a.party_set.length} Fraktionen (${a.party_set.join(", ")})`;
              const cardClass = "card-hover bg-card rounded-xl border border-border p-4 block";
              const cardInner = (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        {a.aktivitaetsart}
                      </span>
                      {a.urheber && (
                        <>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">·</span>
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {a.urheber}
                          </span>
                        </>
                      )}
                    </div>
                    {a.thema && (
                      <p className="text-[14px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug mb-1.5 line-clamp-2">
                        {a.thema}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 dark:text-zinc-500 flex-wrap num">
                      {dateStr && <span>{dateStr}</span>}
                      {a.drucksache_nr && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {a.herausgeber}-Drucksache {a.drucksache_nr}
                          </span>
                        </>
                      )}
                      <span className="text-zinc-200">·</span>
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {personLabel} {fraktionLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
              return dsDetailHref ? (
                <Link key={a.key} href={dsDetailHref} className={cardClass}>
                  {cardInner}
                </Link>
              ) : (
                <article key={a.key} className={cardClass}>
                  {cardInner}
                </article>
              );
            }

            // Individual rendering (Reden, Antworten, Fragen, …)
            const hasPolitician = a.politician_id && a.pol_first_name;
            return (
              <article key={a.key} className="card-hover bg-card rounded-xl border border-border p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      {hasPolitician ? (
                        <Link
                          href={`/politiker/${a.politician_id}`}
                          className="font-semibold text-[14px] text-zinc-950 dark:text-zinc-50 hover:underline"
                        >
                          {a.pol_first_name} {a.pol_last_name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[14px] text-zinc-950 dark:text-zinc-50">
                          {a.titel.split(",")[0]}
                        </span>
                      )}
                      {a.pol_party && (
                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          {a.pol_party}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500">·</span>
                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        {a.aktivitaetsart}
                      </span>
                    </div>
                    {a.thema && (
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-300 mb-1.5 line-clamp-2 leading-relaxed">
                        {a.thema}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 dark:text-zinc-500 flex-wrap num">
                      {dateStr && <span>{dateStr}</span>}
                      {a.drucksache_nr && (
                        <>
                          <span className="text-zinc-200">·</span>
                          {a.pdf_url ? (
                            <a
                              href={a.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:text-[#0f2a52] dark:hover:text-[#b7d0f0] inline-flex items-center gap-1 transition-colors"
                            >
                              {a.herausgeber}-Drucksache {a.drucksache_nr}
                              <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                            </a>
                          ) : (
                            <span>
                              {a.herausgeber}-Drucksache {a.drucksache_nr}
                            </span>
                          )}
                        </>
                      )}
                      {a.urheber && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span>{a.urheber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
                Zurück
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-[13px] text-zinc-300 dark:text-zinc-600 px-3 py-1.5">
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
                Zurück
              </span>
            )}
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400 num">
              Seite {page} von {totalPages.toLocaleString("de-DE")}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Weiter
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-[13px] text-zinc-300 dark:text-zinc-600 px-3 py-1.5">
                Weiter
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
