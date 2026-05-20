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

interface Props {
  searchParams: Promise<{
    typ?: string;
    q?: string;
    seite?: string;
  }>;
}

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

const typFilterMap: Record<string, string[]> = {
  fragen: ["Kleine Anfrage", "Große Anfrage", "Frage", "Antwort"],
  reden: ["Rede", "Kurzintervention", "Zwischenfrage", "Erwiderung"],
  antraege: ["Antrag", "Änderungsantrag", "Entschließungsantrag"],
  gesetze: ["Gesetzentwurf"],
};

export default async function AktivitaetenPage({ searchParams }: Props) {
  const { typ, q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));
  const offset = (page - 1) * ROWS_PER_PAGE;

  let artFilter: string | undefined;
  if (typ && typFilterMap[typ]) {
    artFilter = typFilterMap[typ][0];
  }

  const { rows, total } = listActivitiesGrouped({
    query: q || undefined,
    art: artFilter,
    limit: ROWS_PER_PAGE,
    offset,
  });

  const totalPages = Math.ceil(total / ROWS_PER_PAGE);
  const activityTypes = getActivityTypes();

  const baseParams = new URLSearchParams();
  if (typ) baseParams.set("typ", typ);
  if (q) baseParams.set("q", q);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-12 fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">
            Aktivitäten
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="num text-[15px] text-zinc-950 font-medium">
              {total.toLocaleString("de-DE")}
            </span>
            <span className="text-[13px] text-zinc-500">
              Aktivitäten{artFilter ? ` · ${artFilter}` : ""} · 21. Wahlperiode
            </span>
          </div>
        </div>

        <ActivityFilters activeTyp={typ} query={q} basePath="/design/linear/aktivitaeten" />

        {/* Activity type stats — Linear-style strip */}
        <div className="mt-6 mb-8 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
          {activityTypes.slice(0, 8).map((t) => (
            <div key={t.art} className="inline-flex items-baseline gap-1.5">
              <span className="num font-semibold text-zinc-950">
                {t.count.toLocaleString("de-DE")}
              </span>
              <span className="text-zinc-500">{t.art}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
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
            const dsDetailHref = dsSlug ? `/design/linear/aktivitaeten/${dsSlug}` : null;

            if (a.kind === "grouped" && a.party_set && a.party_set.length > 0) {
              const isBerichterstattung = a.aktivitaetsart === "Berichterstattung";
              const personLabel = isBerichterstattung
                ? `${a.person_count} Berichterstatter:in${a.person_count === 1 ? "" : "nen"}`
                : `${a.person_count} Mitzeichner:in${a.person_count === 1 ? "" : "nen"}`;
              const fraktionLabel = a.party_set.length === 1
                ? `(${a.party_set[0]})`
                : `aus ${a.party_set.length} Fraktionen (${a.party_set.join(", ")})`;
              const cardClass = "card-hover bg-white rounded-xl border border-zinc-200/70 p-4 block";
              const cardInner = (
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/70 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-zinc-700" strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                          {a.aktivitaetsart}
                        </span>
                        {a.urheber && (
                          <>
                            <span className="text-[11px] text-zinc-400">·</span>
                            <span className="text-[11px] font-medium text-zinc-500">
                              {a.urheber}
                            </span>
                          </>
                        )}
                      </div>
                      {a.thema && (
                        <p className="text-[14px] font-semibold text-zinc-950 leading-snug mb-1.5 line-clamp-2">
                          {a.thema}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 flex-wrap num">
                        {dateStr && <span>{dateStr}</span>}
                        {a.drucksache_nr && (
                          <>
                            <span className="text-zinc-200">·</span>
                            <span className="text-zinc-700">
                              {a.herausgeber}-Drucksache {a.drucksache_nr}
                            </span>
                          </>
                        )}
                        <span className="text-zinc-200">·</span>
                        <span className="text-zinc-600">
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
              <article
                key={a.key}
                className="card-hover bg-white rounded-xl border border-zinc-200/70 p-4"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/70 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-700" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      {hasPolitician ? (
                        <Link
                          href={`/design/linear/politiker/${a.politician_id}`}
                          className="font-semibold text-[14px] text-zinc-950 hover:underline"
                        >
                          {a.pol_first_name} {a.pol_last_name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[14px] text-zinc-950">
                          {a.titel.split(",")[0]}
                        </span>
                      )}
                      {a.pol_party && (
                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                          {a.pol_party}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-400">·</span>
                      <span className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                        {a.aktivitaetsart}
                      </span>
                    </div>
                    {a.thema && (
                      <p className="text-[13px] text-zinc-600 mb-1.5 line-clamp-2 leading-relaxed">
                        {a.thema}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 flex-wrap num">
                      {dateStr && <span>{dateStr}</span>}
                      {a.drucksache_nr && (
                        <>
                          <span className="text-zinc-200">·</span>
                          {a.pdf_url ? (
                            <a
                              href={a.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {page > 1 ? (
              <Link
                href={`/design/linear/aktivitaeten?${baseParams.toString()}&seite=${page - 1}`}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
                Zurück
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-[13px] text-zinc-300 px-3 py-1.5">
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
                Zurück
              </span>
            )}
            <span className="text-[12px] text-zinc-500 num">
              Seite {page} von {totalPages.toLocaleString("de-DE")}
            </span>
            {page < totalPages ? (
              <Link
                href={`/design/linear/aktivitaeten?${baseParams.toString()}&seite=${page + 1}`}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              >
                Weiter
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-[13px] text-zinc-300 px-3 py-1.5">
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
