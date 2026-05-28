import { SearchBox } from "@/components/SearchBox";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import { RotatingDeck } from "@/components/RotatingDeck";
import { getBundestagLandingSnapshot } from "@/lib/db";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

// Mehrzeiliges Ellipsis-Clamp per Inline-Style — Tailwinds line-clamp-Utility
// verliert unter Tailwind v4/lightningcss das nötige -webkit-box-orient, daher inline.
const lineClamp = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

const SUCH_BEISPIELE = ["Bürgergeld", "Heizungsgesetz", "Friedrich Merz", "Klimaschutz"];

function dsHref(nr: string): string {
  return `/design/linear/aktivitaeten/${nr.replace("/", "-")}`;
}

export default function LinearLanding() {
  const s = getBundestagLandingSnapshot();
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="page-wash">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-28 pb-12 fade-in-up">
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 mb-3">
          Woran arbeitet der Bundestag?
        </h1>

        <p className="text-center text-xl text-zinc-500 mx-auto mb-2 leading-relaxed">
          Debatten, Drucksachen, Abstimmungen, Interviews{" "}— transparent und lesbar.
        </p>
        <div className="text-center mb-10">
          <Link
            href="/design/linear/methodik"
            className="text-[13px] text-zinc-500 hover:text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-700 underline-offset-2 transition-colors"
          >
            zur Methodik →
          </Link>
        </div>

        <div className="max-w-xl mx-auto">
          <SearchBox />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUCH_BEISPIELE.map((term) => (
            <Link
              key={term}
              href={`/design/linear/suche?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-[12.5px] text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-white transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>

        {/* Letzte Plenarsitzung — zentrierte Pille, gehört optisch zum Hero */}
        {s.latestSitzung && (
          <div className="mt-7 flex justify-center fade-in-up fade-in-up-2">
            <Link
              href={`/design/linear/protokolle/sitzung/${s.latestSitzung.sitzung}`}
              className="group inline-flex items-center gap-2 max-w-full rounded-full border border-zinc-200/80 bg-white/70 py-1.5 pl-3 pr-3 text-[12.5px] hover:border-zinc-300 hover:bg-white transition-colors"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a3e72]" />
              <span className="font-medium text-zinc-700 shrink-0">Letzte Plenarsitzung</span>
              <span className="text-zinc-300 shrink-0">·</span>
              <span className="num text-zinc-500 truncate">
                {s.latestSitzung.plpr} · {formatDate(s.latestSitzung.datum)}
                <span className="hidden sm:inline">
                  {" "}· {s.latestSitzung.redenCount} Redebeiträge
                </span>
              </span>
              <ArrowRight
                className="w-3.5 h-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all"
                strokeWidth={2.25}
              />
            </Link>
          </div>
        )}
      </section>

      {/* 3-Spalten-Grid: Abstimmungen + Gesetzentwürfe + Kleine Anfragen */}
      <section className="w-full max-w-6xl mx-auto px-5 pb-12 fade-in-up fade-in-up-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Spalte 1: Aktuelle Abstimmungen */}
          {s.latestVotes.length > 0 && (
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 mb-4">
                Aktuelle Abstimmungen
              </h3>
              <div className="flex-1 flex flex-col">
                <RotatingDeck>
                  {s.latestVotes.map((v) => (
                    <article
                      key={v.id}
                      className="h-[150px] flex flex-col gap-2.5 overflow-hidden"
                    >
                      {v.label && (
                        <Link
                          href={v.detail_url}
                          className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] transition-colors"
                          style={lineClamp(2)}
                        >
                          {v.label}
                        </Link>
                      )}
                      {s.voteSummaries[v.id] && (
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed" style={lineClamp(3)}>
                          {s.voteSummaries[v.id]}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-2 flex-wrap pt-1">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            v.outcome === "angenommen"
                              ? "text-emerald-700 bg-emerald-50"
                              : v.outcome === "abgelehnt"
                              ? "text-red-700 bg-red-50"
                              : "text-zinc-600 bg-zinc-100"
                          }`}
                        >
                          {v.outcome_label}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                          {v.type === "namentlich" ? "Namentlich" : "Handzeichen"}
                        </span>
                        {v.date && (
                          <span className="text-[10.5px] text-zinc-400 num ml-auto">
                            {formatDate(v.date)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </RotatingDeck>
              </div>
              <Link
                href="/design/linear/abstimmungen"
                className="mt-4 pt-3 border-t border-zinc-100 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1a3e72] hover:gap-2 transition-all"
              >
                Alle Abstimmungen ansehen
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            </div>
          )}

          {/* Spalte 2: Aktuelle Gesetzentwürfe */}
          {s.latestGesetzentwuerfe.length > 0 && (
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 mb-4">
                Aktuelle Gesetzentwürfe
              </h3>
              <div className="flex-1 flex flex-col">
                <RotatingDeck>
                  {s.latestGesetzentwuerfe.map((g) => (
                    <article
                      key={g.drucksacheNr}
                      className="h-[150px] flex flex-col gap-2.5 overflow-hidden"
                    >
                      <Link
                        href={dsHref(g.drucksacheNr)}
                        className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] transition-colors"
                        style={lineClamp(2)}
                      >
                        {g.titel}
                      </Link>
                      {g.zusammenfassung && (
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed" style={lineClamp(3)}>
                          {g.zusammenfassung}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 num pt-1">
                        {g.datum && <span>{formatDate(g.datum)}</span>}
                        <span className="text-zinc-300">·</span>
                        <span>Drs. {g.drucksacheNr}</span>
                        {g.einbringer && (
                          <>
                            <span className="text-zinc-300">·</span>
                            <span className="normal-case">{g.einbringer}</span>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </RotatingDeck>
              </div>
              <Link
                href="/design/linear/aktivitaeten?typ=gesetze"
                className="mt-4 pt-3 border-t border-zinc-100 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1a3e72] hover:gap-2 transition-all"
              >
                Alle Gesetzentwürfe ansehen
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            </div>
          )}

          {/* Spalte 3: Kleine Anfragen */}
          {s.latestAnfragen.length > 0 && (
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 mb-4">
                Kleine Anfragen
              </h3>
              <div className="flex-1 flex flex-col">
                <RotatingDeck>
                  {s.latestAnfragen.map((a) => (
                    <article
                      key={a.drucksacheNr}
                      className="h-[150px] flex flex-col gap-2.5 overflow-hidden"
                    >
                      <Link
                        href={dsHref(a.drucksacheNr)}
                        className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] transition-colors"
                        style={lineClamp(2)}
                      >
                        {a.titel}
                      </Link>
                      {a.zusammenfassung && (
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed" style={lineClamp(3)}>
                          {a.zusammenfassung}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 num pt-1">
                        {a.datum && <span>{formatDate(a.datum)}</span>}
                        <span className="text-zinc-300">·</span>
                        <span>Drs. {a.drucksacheNr}</span>
                        {a.fraktion && (
                          <>
                            <span className="text-zinc-300">·</span>
                            <span className="normal-case">{a.fraktion}</span>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </RotatingDeck>
              </div>
              <Link
                href="/design/linear/aktivitaeten?typ=fragen"
                className="mt-4 pt-3 border-t border-zinc-100 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1a3e72] hover:gap-2 transition-all"
              >
                Alle Kleinen Anfragen ansehen
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Aktuelle Interview-Analysen — Showcase der Medien-Pipeline */}
      <div className="fade-in-up fade-in-up-3">
        <RecentMediaAnalysesStrip />
      </div>
    </div>
  );
}
