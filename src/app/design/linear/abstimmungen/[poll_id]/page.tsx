import { getVoteDetail, type VoteSpeechRow } from "@/lib/db";
import { ArrowLeft, ExternalLink, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function VoteDetailPage({
  params,
}: {
  params: Promise<{ poll_id: string }>;
}) {
  const { poll_id } = await params;
  const pollId = parseInt(poll_id, 10);
  if (Number.isNaN(pollId)) notFound();

  const detail = getVoteDetail(pollId);
  if (!detail) notFound();

  const { poll_label, poll_url, poll_date, topics, byFraction, totals, speeches, relatedPolls, voteContext } = detail;
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
      <div className="w-full max-w-5xl mx-auto px-5 pt-12 pb-24">
        {/* Back-Nav */}
        <Link
          href="/design/linear"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zur Übersicht
        </Link>

        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Namentliche Abstimmung
            </span>
            {poll_date && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="text-[12px] text-zinc-500 num">{formatDate(poll_date)}</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 leading-tight">
            {poll_label ?? `Abstimmung #${pollId}`}
          </h1>
          {poll_url && (
            <Link
              href={poll_url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 mt-3 text-[12px] font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
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
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5">
              <p className="text-[14px] text-zinc-800 leading-relaxed whitespace-pre-line">
                {voteContext.worum_geht_es}
              </p>
              {voteContext.block_hinweis && (
                <p className="mt-3 text-[12.5px] text-zinc-500 leading-relaxed">
                  <span className="font-medium text-zinc-600">Hinweis: </span>
                  {voteContext.block_hinweis}
                </p>
              )}
              {voteContext.subjekt_drucksachen.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mr-1">
                    Gestützt auf
                  </span>
                  {voteContext.subjekt_drucksachen.map((nr) => (
                    <Link
                      key={nr}
                      href={`/design/linear/aktivitaeten/${nr.replace(/\//g, "-")}`}
                      className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-mono text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors"
                    >
                      {nr}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                {voteContext.bt_topic && (
                  <span>Gegenstand laut bundestag.de: <span className="text-zinc-500">{voteContext.bt_topic}</span></span>
                )}
                {voteContext.ist_fallback && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="text-amber-700/80">eingeschränkte Datenlage — Zusammenfassung beruht nur auf Titel/Metadaten</span>
                  </>
                )}
                <span className="text-zinc-300">·</span>
                <Link href="/design/linear/methodik" className="hover:text-zinc-600 transition-colors underline decoration-zinc-300">
                  Methodik
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Stimm-Ergebnis */}
        <section className="mb-10 fade-in-up fade-in-up-2">
          <SectionHeader label="Stimm-Ergebnis" />
          <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            {/* Totals */}
            <div className="grid grid-cols-4 divide-x divide-zinc-100">
              <TotalCell label="Ja" value={totals.yes} color="text-emerald-700" />
              <TotalCell label="Nein" value={totals.no} color="text-rose-700" />
              <TotalCell label="Enthaltung" value={totals.abstain} color="text-amber-700" />
              <TotalCell label="Nicht teilg." value={totals.no_show} color="text-zinc-500" />
            </div>
            {/* Pro Fraktion */}
            <div className="border-t border-zinc-100">
              <table className="w-full text-[13px]">
                <thead className="bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Fraktion</th>
                    <th className="text-right px-2 py-2 font-medium">Ja</th>
                    <th className="text-right px-2 py-2 font-medium">Nein</th>
                    <th className="text-right px-2 py-2 font-medium">Enth.</th>
                    <th className="text-right px-2 py-2 font-medium">N.t.</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {byFraction.map((f) => (
                    <tr key={f.fraction}>
                      <td className="px-4 py-2.5 text-zinc-900 font-medium">{f.fraction}</td>
                      <td className="text-right px-2 py-2.5 num text-emerald-800">{f.yes || ""}</td>
                      <td className="text-right px-2 py-2.5 num text-rose-800">{f.no || ""}</td>
                      <td className="text-right px-2 py-2.5 num text-amber-800">{f.abstain || ""}</td>
                      <td className="text-right px-2 py-2.5 num text-zinc-500">{f.no_show || ""}</td>
                      <td className="text-right px-4 py-2.5 num text-zinc-700">{f.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Debattierter TOP */}
        {topics.length > 0 && (
          <section className="mb-10 fade-in-up fade-in-up-3">
            <SectionHeader label={topics.length === 1 ? "Debattierter Tagesordnungspunkt" : "Debattierte Tagesordnungspunkte"} />
            <div className="space-y-2">
              {topics.map((t) => (
                <div key={t.id} className="border border-zinc-200/70 rounded-xl bg-white px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono uppercase text-zinc-500">TOP {t.topic_number}</span>
                    <ConfidenceBadge confidence={t.confidence} />
                  </div>
                  <p className="text-[13.5px] text-zinc-800 leading-relaxed">{t.title}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Drucksachen (autoritativ via Bundestag.de-Audit) */}
        {drucksachen.length > 0 && (
          <section className="mb-10 fade-in-up fade-in-up-3">
            <SectionHeader
              label={`${drucksachen.length === 1 ? "Drucksache zur Abstimmung" : `${drucksachen.length} Drucksachen zur Abstimmung`}`}
            />
            <div className="space-y-2">
              {drucksachen.map((d) => (
                <Link
                  key={d.drucksache_nr}
                  href={`/design/linear/aktivitaeten/${d.drucksache_nr.replace(/\//g, "-")}`}
                  className="block border border-zinc-200/70 rounded-xl bg-white px-5 py-4 hover:border-zinc-300 transition-colors group"
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[11px] font-mono uppercase text-zinc-500">{d.drucksache_nr}</span>
                    {d.drucksache_typ && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="text-[11px] text-zinc-500">{d.drucksache_typ}</span>
                      </>
                    )}
                    {d.thema && (
                      <>
                        <span className="text-zinc-300">·</span>
                        <span className="text-[11px] text-zinc-500">{d.thema}</span>
                      </>
                    )}
                  </div>
                  {d.titel && (
                    <p className="text-[13.5px] text-zinc-800 leading-snug mb-1 group-hover:text-zinc-950 transition-colors">
                      {d.titel}
                    </p>
                  )}
                  {d.zusammenfassung && (
                    <p className="text-[12.5px] text-zinc-600 leading-relaxed line-clamp-2">
                      {d.zusammenfassung}
                    </p>
                  )}
                </Link>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Drucksachen-Verknüpfung autoritativ aus{" "}
              <a
                href={poll_url ? poll_url.replace(/abgeordnetenwatch\.de.*/, "bundestag.de/parlament/plenum/abstimmung") : "https://www.bundestag.de"}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-zinc-300 hover:decoration-zinc-700 hover:text-zinc-700 transition-colors"
              >
                Bundestag.de
              </a>{" "}
              bezogen (Cross-Source-Audit 2026-05-13).
            </p>
          </section>
        )}

        {/* Verbundene Debatte */}
        {relatedPolls.length > 0 && (
          <section className="mb-8 fade-in-up fade-in-up-3">
            <div className="border border-amber-200/70 rounded-2xl bg-amber-50/40 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="text-[18px] leading-none mt-0.5 select-none">⛓</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-amber-900 mb-1">
                    Verbundene Debatte
                  </div>
                  <p className="text-[13px] text-amber-950/90 leading-relaxed mb-2">
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
                          href={`/design/linear/abstimmungen/${p.poll_id}`}
                          className="text-amber-900 hover:text-amber-950 underline decoration-amber-300 underline-offset-2 hover:decoration-amber-500 transition-colors"
                        >
                          {p.poll_label ?? `Abstimmung #${p.poll_id}`}
                        </Link>
                        {p.poll_date && (
                          <span className="text-amber-800/60 num ml-2">
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
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</h2>
      {sub && <p className="text-[12px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

function TotalCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={`num text-3xl font-semibold tracking-tight ${color}`}>{value.toLocaleString("de-DE")}</span>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    high: { label: "Match: hoch", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    medium: { label: "Match: mittel", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    low: { label: "Match: niedrig", cls: "bg-zinc-50 text-zinc-700 border-zinc-200" },
    none: { label: "kein Match", cls: "bg-zinc-50 text-zinc-500 border-zinc-200" },
  };
  const c = cfg[confidence] ?? cfg.none;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${c.cls}`}>{c.label}</span>
  );
}

function VoteBadge({ vote }: { vote: string | null }) {
  if (!vote) {
    return (
      <span className="inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded border bg-zinc-50 text-zinc-400 border-zinc-200">
        ohne Stimm-Info
      </span>
    );
  }
  const cfg: Record<string, { label: string; cls: string }> = {
    yes: { label: "Ja", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    no: { label: "Nein", cls: "bg-rose-50 text-rose-800 border-rose-200" },
    abstain: { label: "Enthaltung", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    no_show: { label: "Nicht teilgen.", cls: "bg-zinc-50 text-zinc-500 border-zinc-200" },
  };
  const c = cfg[vote] ?? { label: vote, cls: "bg-zinc-50 text-zinc-600 border-zinc-200" };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border ${c.cls}`}>{c.label}</span>
  );
}

function TonalitaetBadge({ ton }: { ton: string | null }) {
  if (!ton) return null;
  const cfg: Record<string, { label: string; cls: string }> = {
    sachlich: { label: "sachlich", cls: "bg-zinc-100 text-zinc-700" },
    polemisch: { label: "polemisch", cls: "bg-rose-50 text-rose-700" },
    polemisch_sachlich: { label: "polemisch-sachlich", cls: "bg-orange-50 text-orange-700" },
    emotional_persoenlich: { label: "emotional-persönlich", cls: "bg-violet-50 text-violet-700" },
    konfrontativ_belegend: { label: "konfrontativ-belegend", cls: "bg-blue-50 text-blue-700" },
    ironisch_jugendlich: { label: "ironisch", cls: "bg-yellow-50 text-yellow-800" },
    bilanzierend_werbend: { label: "bilanzierend", cls: "bg-emerald-50 text-emerald-700" },
    staatsmaennisch: { label: "staatsmännisch", cls: "bg-blue-50 text-blue-800" },
    defensiv_pragmatisch: { label: "defensiv-pragmatisch", cls: "bg-slate-100 text-slate-700" },
    sozial_anklagend: { label: "sozial-anklagend", cls: "bg-pink-50 text-pink-700" },
    mahnend: { label: "mahnend", cls: "bg-stone-100 text-stone-700" },
  };
  const c = cfg[ton] ?? { label: ton, cls: "bg-zinc-100 text-zinc-700" };
  return (
    <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded ${c.cls}`}>{c.label}</span>
  );
}

function SpeechCard({ speech }: { speech: VoteSpeechRow }) {
  const speakerLink = speech.politician_id
    ? `/design/linear/politiker/${speech.politician_id}`
    : null;

  return (
    <li className="border border-zinc-200/70 rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {speakerLink ? (
            <Link
              href={speakerLink}
              className="text-[14.5px] font-semibold text-zinc-950 hover:text-zinc-700 transition-colors"
            >
              {speech.speaker}
            </Link>
          ) : (
            <span className="text-[14.5px] font-semibold text-zinc-950">{speech.speaker}</span>
          )}
          {speech.party && (
            <span className="text-[11.5px] text-zinc-500 font-medium">{speech.party}</span>
          )}
          <TonalitaetBadge ton={speech.tonalitaet} />
        </div>
        <VoteBadge vote={speech.vote} />
      </div>
      {speech.zusammenfassung && (
        <p className="text-[13.5px] text-zinc-700 leading-relaxed mb-3">
          {speech.zusammenfassung}
        </p>
      )}
      {speech.forderungen.length > 0 && (
        <div className="mt-3">
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            Forderungen
          </div>
          <ul className="space-y-1">
            {speech.forderungen.slice(0, 5).map((f, i) => (
              <li key={i} className="text-[12.5px] text-zinc-700 leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-zinc-400">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
      {speech.woertliche_zitate.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
            <MessageSquareQuote className="w-3 h-3" strokeWidth={2.25} />
            Wörtliche Zitate
          </div>
          <ul className="space-y-1.5">
            {speech.woertliche_zitate.slice(0, 3).map((q, i) => (
              <li key={i} className="text-[12.5px] text-zinc-600 italic leading-snug">„{q}"</li>
            ))}
          </ul>
        </div>
      )}
      {speech.original_text && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors select-none list-none">
            <span className="inline-flex items-center gap-1">
              <span className="group-open:hidden">▶</span>
              <span className="hidden group-open:inline">▼</span>
              <span className="group-open:hidden">Originalrede einblenden (Quelle)</span>
              <span className="hidden group-open:inline">Originalrede ausblenden</span>
              {speech.page_ref && (
                <span className="ml-1 text-zinc-400">· Plenarprotokoll {speech.page_ref}</span>
              )}
            </span>
          </summary>
          <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-[13px] leading-[1.65] text-zinc-800 font-serif">
            {speech.original_text
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
