import { getVoteDetail, getVotersForPollByFraktionVote, type VoteSpeechRow } from "@/lib/db";
import { TonalityBadge } from "@/components/TonalityBadge";
import { ArrowLeft, ExternalLink, FileText, MessageSquareQuote, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const VOTE_TYPE_LABEL: Record<string, string> = {
  yes: "Ja",
  no: "Nein",
  abstain: "Enthaltung",
  no_show: "Nicht teilgenommen",
};

const VOTE_TYPE_COLOR: Record<string, string> = {
  yes: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900/50",
  no: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900/50",
  abstain: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900/50",
  no_show: "text-zinc-700 bg-zinc-50 border-zinc-200 dark:text-zinc-300 dark:bg-zinc-800/60 dark:border-zinc-700",
};

// „CDU/CSU (Bundestag 2025 - 2029)" → „CDU/CSU". Wahlperioden-Suffix bleibt
// in DB + URL-Param (sonst bricht der voters-Lookup), wird aber nirgends im
// UI gezeigt.
function shortenFraktion(label: string | null | undefined): string {
  if (!label) return "—";
  return label.replace(/\s*\(Bundestag\s+\d{4}\s*-\s*\d{4}\)\s*$/, "").trim();
}

export default async function VoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ poll_id: string }>;
  searchParams: Promise<{ fraktion?: string; vote?: string }>;
}) {
  const { poll_id } = await params;
  const { fraktion: drillFraktion, vote: drillVote } = await searchParams;
  const pollId = parseInt(poll_id, 10);
  if (Number.isNaN(pollId)) notFound();

  const detail = getVoteDetail(pollId);
  if (!detail) notFound();

  // Drilldown-Daten nur wenn beide Params gesetzt UND valider Vote-Typ
  const drillVoters =
    drillFraktion && drillVote && VOTE_TYPE_LABEL[drillVote]
      ? getVotersForPollByFraktionVote(pollId, drillFraktion, drillVote)
      : null;
  const drillFraktionShort = drillFraktion ? shortenFraktion(drillFraktion) : undefined;

  const { poll_label, poll_url, poll_date, byFraction, totals, speeches, relatedPolls, voteContext } = detail;
  // Defensiv: drucksachen-Liste ist neu (BT-Audit 2026-05-13), Schutz vor stale-cache
  const drucksachen: typeof detail.drucksachen = Array.isArray(detail.drucksachen) ? detail.drucksachen : [];

  // Sortierung: Reden mit Stimm-Info zuerst, dann nach Fraktion, dann nach speech_id
  const orderedSpeeches = [...speeches].sort((a, b) => {
    const av = a.vote ? 0 : 1;
    const bv = b.vote ? 0 : 1;
    if (av !== bv) return av - bv;
    return (a.party ?? "").localeCompare(b.party ?? "");
  });

  return (
    <div className="page-wash">
      <div className="w-full page-shell">
        {/* Back-Nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zur Übersicht
        </Link>

        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Namentliche Abstimmung
            </span>
            {poll_date && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="text-[12px] text-zinc-500 dark:text-zinc-400 num">{formatDate(poll_date)}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-zinc-50 leading-tight">
            {poll_label ?? `Abstimmung #${pollId}`}
          </h1>
          {poll_url && (
            <Link
              href={poll_url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 mt-3 text-[12px] font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Quelle: abgeordnetenwatch.de
              <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
            </Link>
          )}
        </div>

        {/* Worum geht es? — grounded, neutral, quellenbelegt */}
        {voteContext && (
          <section className="mb-10 fade-in-up fade-in-up-2">
            <SectionHeader label="Worum geht es?" />
            <div className="border border-border rounded-2xl bg-card px-5 py-5">
              <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                {voteContext.worum_geht_es}
              </p>
              {voteContext.block_hinweis && (
                <p className="mt-3 text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">Hinweis: </span>
                  {voteContext.block_hinweis}
                </p>
              )}
              {voteContext.subjekt_drucksachen.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-1">
                    Gestützt auf
                  </span>
                  {voteContext.subjekt_drucksachen.map((nr) => (
                    <Link
                      key={nr}
                      href={`/aktivitaeten/${nr.replace(/\//g, "-")}`}
                      className="inline-flex items-center rounded-md border border-[#1a3e72]/25 bg-[#1a3e72]/5 px-2 py-0.5 text-[11px] font-mono text-[#1a3e72] hover:bg-[#1a3e72]/10 hover:text-[#0f2a52] hover:border-[#1a3e72]/40 dark:border-[#8fb3e6]/25 dark:bg-[#8fb3e6]/10 dark:text-[#8fb3e6] dark:hover:bg-[#8fb3e6]/20 dark:hover:text-[#b7d0f0] dark:hover:border-[#8fb3e6]/40 transition-colors"
                    >
                      {nr}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                {voteContext.bt_topic && (
                  <span>Gegenstand laut bundestag.de: <span className="text-zinc-500 dark:text-zinc-400">{voteContext.bt_topic}</span></span>
                )}
                {voteContext.ist_fallback && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="text-amber-700/80 dark:text-amber-400/80">eingeschränkte Datenlage — Zusammenfassung beruht nur auf Titel/Metadaten</span>
                  </>
                )}
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <Link href="/methodik" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors underline decoration-zinc-300 dark:decoration-zinc-600">
                  Methodik
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Stimm-Ergebnis */}
        <section className="mb-10 fade-in-up fade-in-up-2">
          <SectionHeader label="Stimm-Ergebnis" />
          <div className="border border-border rounded-2xl bg-card overflow-hidden">
            {/* Totals */}
            <div className="grid grid-cols-4 divide-x divide-border">
              <TotalCell label="Ja" value={totals.yes} color="text-emerald-700 dark:text-emerald-400" />
              <TotalCell label="Nein" value={totals.no} color="text-rose-700 dark:text-rose-400" />
              <TotalCell label="Enthaltung" value={totals.abstain} color="text-amber-700 dark:text-amber-400" />
              <TotalCell label="Nicht teilg." value={totals.no_show} color="text-zinc-500 dark:text-zinc-400" />
            </div>
            {/* Pro Fraktion */}
            <div className="border-t border-border">
              <table className="w-full text-[13px]">
                <thead className="bg-zinc-50/60 dark:bg-zinc-800/40 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Fraktion</th>
                    <th className="text-right px-2 py-2 font-medium">Ja</th>
                    <th className="text-right px-2 py-2 font-medium">Nein</th>
                    <th className="text-right px-2 py-2 font-medium">Enth.</th>
                    <th className="text-right px-2 py-2 font-medium">N.t.</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byFraction.map((f) => (
                    <tr key={f.fraction}>
                      <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100 font-medium">{shortenFraktion(f.fraction)}</td>
                      <DrillCell value={f.yes} fraction={f.fraction} voteType="yes" pollId={pollId} colorClass="text-emerald-800 dark:text-emerald-400" />
                      <DrillCell value={f.no} fraction={f.fraction} voteType="no" pollId={pollId} colorClass="text-rose-800 dark:text-rose-400" />
                      <DrillCell value={f.abstain} fraction={f.fraction} voteType="abstain" pollId={pollId} colorClass="text-amber-800 dark:text-amber-400" />
                      <DrillCell value={f.no_show} fraction={f.fraction} voteType="no_show" pollId={pollId} colorClass="text-zinc-500 dark:text-zinc-400" />
                      <td className="text-right px-4 py-2.5 num text-zinc-700 dark:text-zinc-300">{f.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Drilldown-Panel: wenn fraktion+vote in URL gesetzt, alle Namen zeigen */}
            {drillVoters && drillFraktion && drillVote && (
              <div id="stimmen-drilldown" className="border-t border-border p-5 bg-zinc-50/40 dark:bg-zinc-800/30 scroll-mt-16">
                <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">{drillFraktionShort}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${VOTE_TYPE_COLOR[drillVote]}`}>
                      {VOTE_TYPE_LABEL[drillVote]}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="text-[12px] text-zinc-500 dark:text-zinc-400 num">{drillVoters.length} Abgeordnete</span>
                  </div>
                  <Link
                    href={`/abstimmungen/${pollId}`}
                    className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.25} />
                    Schließen
                  </Link>
                </div>
                {drillVoters.length === 0 ? (
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 italic">Keine Abgeordneten in dieser Kategorie.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                    {drillVoters.map((v, idx) => (
                      <div key={`${v.politician_id ?? "x"}-${idx}`} className="text-[13px]">
                        {v.politician_id ? (
                          <Link href={`/politiker/${v.politician_id}`} className="text-zinc-900 dark:text-zinc-100 hover:underline">
                            {v.first_name} {v.last_name}
                          </Link>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">{v.first_name} {v.last_name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Drucksachen (präzise Subjekt-DS aus bundestag.de-Filterlist) */}
        {drucksachen.length > 0 && (
          <section className="mb-10 fade-in-up fade-in-up-3">
            <SectionHeader
              label={`${drucksachen.length === 1 ? "Drucksache zur Abstimmung" : `${drucksachen.length} Drucksachen zur Abstimmung`}`}
            />
            <div className="space-y-2">
              {drucksachen.map((d) => (
                <div
                  key={d.drucksache_nr}
                  className="border border-border rounded-xl bg-card overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <Link
                    href={`/aktivitaeten/${d.drucksache_nr.replace(/\//g, "-")}`}
                    className="block px-5 py-4 group"
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400">{d.drucksache_nr}</span>
                      {d.drucksache_typ && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{d.drucksache_typ}</span>
                        </>
                      )}
                      {d.thema && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{d.thema}</span>
                        </>
                      )}
                    </div>
                    {d.titel && (
                      <p className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug mb-1 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 transition-colors">
                        {d.titel}
                      </p>
                    )}
                    {d.zusammenfassung && (
                      <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2">
                        {d.zusammenfassung}
                      </p>
                    )}
                  </Link>
                  {d.pdf_url && (
                    <a
                      href={d.pdf_url}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1.5 border-t border-border px-5 py-2.5 text-[11.5px] font-medium text-[#1a3e72] hover:bg-[#1a3e72]/[0.04] dark:text-[#8fb3e6] dark:hover:bg-[#8fb3e6]/[0.08] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                      Original-PDF auf bundestag.de
                      <ExternalLink className="w-3 h-3" strokeWidth={2} />
                    </a>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Drucksachen-Verknüpfung präzise pro Roll-Call aus{" "}
              <a
                href={poll_url ? poll_url.replace(/abgeordnetenwatch\.de.*/, "bundestag.de/parlament/plenum/abstimmung") : "https://www.bundestag.de"}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#1a3e72]/40 text-[#1a3e72] hover:decoration-[#1a3e72] hover:text-[#0f2a52] dark:decoration-[#8fb3e6]/40 dark:text-[#8fb3e6] dark:hover:decoration-[#8fb3e6] dark:hover:text-[#b7d0f0] transition-colors"
              >
                Bundestag.de
              </a>{" "}
              -Filterlist bezogen.
            </p>
          </section>
        )}

        {/* Verbundene Debatte */}
        {relatedPolls.length > 0 && (
          <section className="mb-8 fade-in-up fade-in-up-3">
            <div className="border border-amber-200/70 rounded-2xl bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="text-[18px] leading-none mt-0.5 select-none">⛓</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                    Verbundene Debatte
                  </div>
                  <p className="text-[13px] text-amber-950/90 dark:text-amber-200/90 leading-relaxed mb-2">
                    Diese Abstimmung wurde im Bundestag gemeinsam mit{" "}
                    {relatedPolls.length === 1 ? (
                      <>einer weiteren Abstimmung</>
                    ) : (
                      <>{relatedPolls.length} weiteren Abstimmungen</>
                    )}{" "}
                    desselben Tagesordnungspunkts debattiert. Die unten gezeigten
                    Reden gelten daher inhaltlich für alle{" "}
                    <span className="num font-semibold">{relatedPolls.length + 1}</span>{" "}
                    Abstimmungen.
                  </p>
                  <ul className="space-y-1">
                    {relatedPolls.map((p) => (
                      <li key={p.poll_id} className="text-[12.5px] leading-snug">
                        <Link
                          href={`/abstimmungen/${p.poll_id}`}
                          className="text-amber-900 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-200 underline decoration-amber-300 dark:decoration-amber-700 underline-offset-2 hover:decoration-amber-500 transition-colors"
                        >
                          {p.poll_label ?? `Abstimmung #${p.poll_id}`}
                        </Link>
                        {p.poll_date && (
                          <span className="text-amber-800/60 dark:text-amber-300/60 num ml-2">
                            · {formatDate(p.poll_date)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reden */}
        <section className="fade-in-up fade-in-up-4">
          <SectionHeader
            label={`Reden zur Abstimmung (${speeches.length})`}
            sub={
              speeches.length > 0
                ? "Tonalitäts-Tags + 2-Sätze-Zusammenfassung aus der KI-Pipeline (v2.1, Bias-auditiert)"
                : "Keine Reden für die zugehörigen TOPs gefunden."
            }
          />
          {orderedSpeeches.length > 0 ? (
            <ul className="space-y-3">
              {orderedSpeeches.map((s) => (
                <SpeechCard key={s.speech_id} speech={s} />
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</h2>
      {sub && <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

function TotalCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`num text-3xl font-semibold tracking-tight ${color}`}>{value.toLocaleString("de-DE")}</span>
    </div>
  );
}

function VoteBadge({ vote }: { vote: string | null }) {
  if (!vote) {
    return (
      <span className="inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded border bg-zinc-50 text-zinc-400 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-500 dark:border-zinc-700">
        ohne Stimm-Info
      </span>
    );
  }
  const cfg: Record<string, { label: string; cls: string }> = {
    yes: { label: "Ja", cls: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" },
    no: { label: "Nein", cls: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50" },
    abstain: { label: "Enthaltung", cls: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50" },
    no_show: { label: "Nicht teilgen.", cls: "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700" },
  };
  const c = cfg[vote] ?? { label: vote, cls: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700" };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border ${c.cls}`}>{c.label}</span>
  );
}


function SpeechCard({ speech }: { speech: VoteSpeechRow }) {
  const speakerLink = speech.politician_id
    ? `/politiker/${speech.politician_id}`
    : null;

  return (
    <li className="border border-border rounded-2xl bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {speakerLink ? (
            <Link
              href={speakerLink}
              className="text-[14.5px] font-semibold text-zinc-950 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300 transition-colors"
            >
              {speech.speaker}
            </Link>
          ) : (
            <span className="text-[14.5px] font-semibold text-zinc-950 dark:text-zinc-50">{speech.speaker}</span>
          )}
          {speech.party && (
            <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400 font-medium">{speech.party}</span>
          )}
          <TonalityBadge slug={speech.tonalitaet} />
        </div>
        <VoteBadge vote={speech.vote} />
      </div>
      {speech.zusammenfassung && (
        <p className="text-[13.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
          {speech.zusammenfassung}
        </p>
      )}
      {speech.forderungen.length > 0 && (
        <div className="mt-3">
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            Forderungen
          </div>
          <ul className="space-y-1">
            {speech.forderungen.slice(0, 5).map((f, i) => (
              <li key={i} className="text-[12.5px] text-zinc-700 dark:text-zinc-300 leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-zinc-400 dark:before:text-zinc-500">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {speech.woertliche_zitate.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
            <MessageSquareQuote className="w-3 h-3" strokeWidth={2.25} />
            Wörtliche Zitate
          </div>
          <ul className="space-y-1.5">
            {speech.woertliche_zitate.slice(0, 3).map((q, i) => (
              <li key={i} className="text-[12.5px] text-zinc-600 dark:text-zinc-300 italic leading-snug">„{q}"</li>
            ))}
          </ul>
        </div>
      )}
      {speech.original_text && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors select-none list-none">
            <span className="inline-flex items-center gap-1">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              <span className="group-open:hidden">Originalrede einblenden (Quelle)</span>
              <span className="hidden group-open:inline">Originalrede ausblenden</span>
              {speech.page_ref && (
                <span className="ml-1 text-zinc-400 dark:text-zinc-500">· Plenarprotokoll {speech.page_ref}</span>
              )}
            </span>
          </summary>
          <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700 px-4 py-3 text-[13px] leading-[1.65] text-zinc-800 dark:text-zinc-200 font-serif">
            {speech.original_text
              .split("\n")
              .map((p) => p.trim())
              .filter(Boolean)
              .map((para, i) => {
                if (/^\[ID\d+\]$/.test(para)) {
                  return (
                    <div key={i} className="mt-4 mb-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 first:mt-0">
                      {para}
                    </div>
                  );
                }
                if (para === "---") {
                  return <hr key={i} className="my-3 border-zinc-200 dark:border-zinc-700" />;
                }
                return (
                  <p key={i} className="mb-3 last:mb-0 hyphens-auto text-justify" lang="de">
                    {para}
                  </p>
                );
              })}
          </div>
        </details>
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function DrillCell({
  value,
  fraction,
  voteType,
  pollId,
  colorClass,
}: {
  value: number;
  fraction: string;
  voteType: "yes" | "no" | "abstain" | "no_show";
  pollId: number;
  colorClass: string;
}) {
  if (!value) return <td className="text-right px-2 py-2.5 num text-zinc-300 dark:text-zinc-600">—</td>;
  const href = `/abstimmungen/${pollId}?fraktion=${encodeURIComponent(fraction)}&vote=${voteType}#stimmen-drilldown`;
  return (
    <td className="text-right px-2 py-2.5 num">
      <Link
        href={href}
        className={`${colorClass} hover:underline decoration-current decoration-dotted underline-offset-2`}
        title={`${value} Abgeordnete in dieser Kategorie anzeigen`}
      >
        {value}
      </Link>
    </td>
  );
}
