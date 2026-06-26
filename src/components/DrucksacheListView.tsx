import { listDrucksachenByDokumenttyp } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

const ROWS_PER_PAGE = 30;

const DEFAULT_INTRO: ReactNode = (
  <>
    Datenstand: 21. Wahlperiode (ab 31.03.2025) — frühere Wahlperioden (WP18–20) noch nicht
    eingespielt. Mehr in der{" "}
    <a
      href="/methodik"
      className="underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-700 dark:hover:decoration-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
    >
      Methodik
    </a>
    .
  </>
);

export interface DrucksacheListViewProps {
  title: string;
  countLabel: string;
  /** Ein Dokumenttyp oder mehrere Geschwister-Typen (z.B. die Antrags-Familie). */
  dokumenttyp: string | string[];
  /** Verfahrens-Dokumente ausschließen, die zu einem Gesetz/Antrag gehören. */
  nurEigenstaendig?: boolean;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  query?: string;
  page: number;
  basePath: string;
  intro?: ReactNode;
}

export function DrucksacheListView({
  title,
  countLabel,
  dokumenttyp,
  nurEigenstaendig,
  icon: Icon,
  query,
  page,
  basePath,
  intro = DEFAULT_INTRO,
}: DrucksacheListViewProps) {
  const offset = (page - 1) * ROWS_PER_PAGE;
  const { rows, total } = listDrucksachenByDokumenttyp({
    dokumenttyp,
    query: query || undefined,
    nurEigenstaendig,
    limit: ROWS_PER_PAGE,
    offset,
  });
  const totalPages = Math.ceil(total / ROWS_PER_PAGE);

  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    sp.set("seite", String(n));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">{title}</h1>
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

        <div className="space-y-1.5 mt-6">
          {rows.map((d) => {
            const dateStr = d.datum
              ? new Date(d.datum).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : null;
            const href = `/aktivitaeten/${d.drucksache_nr.replace("/", "-")}`;
            return (
              <Link
                key={d.drucksache_nr}
                href={href}
                className="card-hover bg-card rounded-xl border border-border p-4 block"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        {d.dokumenttyp}
                      </span>
                      {d.einbringer && (
                        <>
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">·</span>
                          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            {d.einbringer}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[14px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug mb-1.5">
                      {d.titel || `Drucksache ${d.drucksache_nr}`}
                    </p>
                    <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 dark:text-zinc-500 flex-wrap num">
                      {dateStr && <span>{dateStr}</span>}
                      <span className="text-zinc-200">·</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        BT-Drucksache {d.drucksache_nr}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {rows.length === 0 && (
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 py-8 text-center">
              Keine Einträge gefunden.
            </p>
          )}
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
