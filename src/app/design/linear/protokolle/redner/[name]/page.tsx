import {
  getSpeakerDetail,
  getSpeechSummaries,
  getSpeechAnalysesBySpeaker,
} from "@/lib/db";
import { SpeechAnalysisDetails } from "@/components/SpeechAnalysisDetails";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

const TYP_LABEL: Record<string, string> = {
  debatte: "Debatte",
  fragestunde_antwort: "Fragestunde",
  fragestunde_frage: "Fragestunde",
  regierungserklaerung: "Regierungserklärung",
  zwischenfrage: "Zwischenfrage",
  kurzintervention: "Kurzintervention",
  erklaerung: "Erklärung",
};

export default async function RednerPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const detail = getSpeakerDetail(decodedName);

  if (!detail) notFound();

  const summaries = getSpeechSummaries(decodedName);
  const analyses = getSpeechAnalysesBySpeaker(decodedName);
  const summaryMap = new Map<number, typeof summaries>();
  for (const s of summaries) {
    if (!summaryMap.has(s.sitzung)) summaryMap.set(s.sitzung, []);
    summaryMap.get(s.sitzung)!.push(s);
  }

  const debattenReden = summaries.filter(
    (s) => s.typ === "debatte" || s.typ === "erklaerung"
  ).length;
  const fragestunden = summaries.filter((s) =>
    s.typ?.includes("fragestunde")
  ).length;

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-12 fade-in-up">
        <Link
          href="/design/linear/protokolle"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zur Übersicht
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            {detail.party && (
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                {detail.party}
              </span>
            )}
            {detail.role && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="text-[12px] text-zinc-500">{detail.role}</span>
              </>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-6">
            {detail.speaker}
          </h1>

          {/* Stats */}
          <div className="flex items-baseline gap-8 text-zinc-500 text-[13px]">
            <div>
              <span className="num text-3xl font-semibold text-zinc-950 align-baseline">
                {detail.totalSpeeches}
              </span>{" "}
              Reden
            </div>
            <div className="text-zinc-300">·</div>
            <div>
              <span className="num text-zinc-950 font-medium">{detail.sessions.length}</span> Sitzungen
            </div>
            {summaries.length > 0 && (
              <>
                <div className="text-zinc-300">·</div>
                <div>
                  <span className="num text-zinc-950 font-medium">{debattenReden}</span> Debatten
                </div>
                <div className="text-zinc-300">·</div>
                <div>
                  <span className="num text-zinc-950 font-medium">{fragestunden}</span> Fragestunden
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sessions list */}
        <section>
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-5">
            Sitzungen mit Redebeiträgen
          </h2>
          <div className="space-y-2">
            {detail.sessions.map((s) => {
              const sessionSummaries = summaryMap.get(s.sitzung) || [];

              return (
                <article
                  key={s.sitzung}
                  className="bg-white rounded-2xl border border-zinc-200/70 overflow-hidden"
                >
                  {/* Session header */}
                  <div className="px-5 py-4 flex items-center gap-4 border-b border-zinc-100">
                    <div className="w-12 text-center shrink-0 border-r border-zinc-200 pr-3">
                      <span className="num text-xl font-semibold text-zinc-950">
                        {s.sitzung}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-950">
                        {s.datum
                          ? new Date(s.datum + "T00:00:00").toLocaleDateString("de-DE", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Datum unbekannt"}
                      </p>
                      <p className="text-[12px] text-zinc-500">
                        <span className="num">{s.count}</span>{" "}
                        {s.count === 1 ? "Redebeitrag" : "Redebeiträge"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(s.count, 10) }).map((_, i) => (
                          <div key={i} className="w-1.5 h-4 rounded-sm bg-zinc-300" />
                        ))}
                        {s.count > 10 && (
                          <span className="num text-[11px] text-zinc-500 ml-1">
                            +{s.count - 10}
                          </span>
                        )}
                      </div>
                      {s.sourceUrl && (
                        <a
                          href={s.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-700 hover:text-zinc-950 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
                        >
                          PDF
                          <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Summaries */}
                  {sessionSummaries.length > 0 && (
                    <div className="divide-y divide-zinc-100">
                      {sessionSummaries.map((sum, idx) => {
                        const pdfDeepLink =
                          sum.source_url && sum.page_start
                            ? `${sum.source_url}#page=${sum.page_start}`
                            : sum.source_url;
                        const pageLabel = sum.page_start
                          ? `S. ${sum.page_start}${sum.page_section ?? ""}`
                          : null;

                        return (
                          <div key={idx} className="px-5 py-4">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                                {TYP_LABEL[sum.typ] || sum.typ}
                              </span>
                              {sum.kontext && (
                                <>
                                  <span className="text-zinc-300 text-[11px]">·</span>
                                  <span className="text-[12px] text-zinc-500 truncate">
                                    {sum.kontext}
                                  </span>
                                </>
                              )}
                              <span
                                className="ml-auto text-[10px] uppercase tracking-wider text-zinc-400 font-medium"
                                title={sum.model ? `Generiert mit ${sum.model}` : "KI-Zusammenfassung"}
                              >
                                KI · überprüfbar
                              </span>
                            </div>
                            {(() => {
                              const ids = (sum.rede_ids || sum.rede_id || "")
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              const matched = [];
                              for (const id of ids) {
                                for (let seg = 0; seg < 10; seg++) {
                                  const a = analyses.get(`${id}_${seg}`);
                                  if (a) matched.push(a);
                                  else if (seg > 0) break;
                                }
                              }
                              const v21 = matched[0] ?? null;
                              const displayText =
                                v21?.zusammenfassung_neutral ?? sum.zusammenfassung;
                              return (
                                <>
                                  {displayText && (
                                    <p className="text-[14px] text-zinc-700 leading-relaxed">
                                      {displayText}
                                    </p>
                                  )}
                                  {v21 && <SpeechAnalysisDetails analysis={v21} />}
                                </>
                              );
                            })()}

                            {(sum.original_text || pdfDeepLink) && (
                              <div className="mt-3 pt-3 border-t border-zinc-100">
                                <div className="flex items-center gap-3 flex-wrap text-[11.5px]">
                                  {pdfDeepLink && (
                                    <a
                                      href={pdfDeepLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-950 transition-colors"
                                    >
                                      Im PDF nachlesen{pageLabel && ` (${pageLabel})`}
                                      <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                                    </a>
                                  )}
                                  {sum.rede_id && (
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      {sum.rede_id}
                                    </span>
                                  )}
                                </div>

                                {sum.original_text && (
                                  <details className="mt-2 group">
                                    <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors select-none list-none">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="group-open:hidden">▶</span>
                                        <span className="hidden group-open:inline">▼</span>
                                        <span className="group-open:hidden">Originalrede einblenden</span>
                                        <span className="hidden group-open:inline">Originalrede ausblenden</span>
                                      </span>
                                    </summary>
                                    <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-[13px] leading-[1.65] text-zinc-800 font-serif">
                                      {sum.original_text
                                        .split("\n")
                                        .map((p) => p.trim())
                                        .filter(Boolean)
                                        .map((para, i) => {
                                          if (/^\[ID\d+\]$/.test(para)) {
                                            return (
                                              <div key={i} className="mt-4 mb-1 text-[10px] font-mono text-zinc-400 first:mt-0">
                                                {para}
                                              </div>
                                            );
                                          }
                                          if (para === "---") {
                                            return <hr key={i} className="my-3 border-zinc-200" />;
                                          }
                                          return (
                                            <p key={i} className="mb-3 last:mb-0 hyphens-auto text-justify" lang="de">
                                              {para}
                                            </p>
                                          );
                                        })}
                                    </div>
                                    {sum.model && (
                                      <p className="mt-1.5 text-[10px] text-zinc-400">
                                        Methode: KI-Modell <span className="font-mono">{sum.model}</span>
                                        {sum.prompt_version && (
                                          <> · Prompt-Version <span className="font-mono">{sum.prompt_version}</span></>
                                        )}
                                      </p>
                                    )}
                                  </details>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
