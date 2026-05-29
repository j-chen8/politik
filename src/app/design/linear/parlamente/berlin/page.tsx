import { getBerlinSnapshot } from "@/lib/db";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { RotatingDeck } from "@/components/RotatingDeck";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abgeordnetenhaus von Berlin — Politik-Radar",
  description: "Die Abgeordneten des Berliner Abgeordnetenhauses, 19. Wahlperiode — Reden, Drucksachen und Abstimmungen.",
};

/**
 * Berlin-Übersicht — symmetrisch zur Bundestag-Landing (Hero + Suche +
 * Aktuelles), mit Berlin-Daten aus PARDOK.
 */
/** Schneidet Text auf max. Zeichen am Wort-Boundary, hängt … an wenn gekürzt. */
function truncate(text: string | null, max: number): string | null {
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max - 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export default function BerlinOverview() {
  const s = getBerlinSnapshot();
  const fmt = (n: number) => n.toLocaleString("de-DE");
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="page-wash">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-20 pb-14 fade-in-up">
        <div className="flex justify-center mb-5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
            Abgeordnetenhaus von Berlin · Pilot
          </span>
        </div>
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 mb-7">
          Wie arbeitet
          <br />
          <span className="bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-400 bg-clip-text text-transparent">
            Ihr Berliner Abgeordneter?
          </span>
        </h1>
        <p className="text-center text-[17px] text-zinc-500 max-w-xl mx-auto mb-9 leading-relaxed">
          Alle <span className="num text-zinc-900 font-medium">{fmt(s.memberCount)}</span>{" "}
          Abgeordneten des Berliner Abgeordnetenhauses, 19. Wahlperiode.
        </p>

        {/* Suche — serverseitiges Formular, fest auf Berlin gescoped */}
        <form action="/design/linear/politiker" method="GET" className="max-w-xl mx-auto">
          <input type="hidden" name="parlament" value="2" />
          <div className="flex items-center gap-2 bg-white rounded-full border border-zinc-200/80 shadow-sm pl-5 pr-2 py-2 focus-within:border-zinc-400 transition-colors">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2.25} />
            <input
              name="q"
              type="text"
              placeholder={'Name eingeben, z.B. "Kai Wegner"'}
              aria-label="Berliner Abgeordnete suchen"
              className="flex-1 bg-transparent outline-none text-[15px] text-zinc-950 placeholder:text-zinc-400 min-w-0"
            />
            <button
              type="submit"
              className="shrink-0 bg-zinc-950 text-white text-[14px] font-medium rounded-full px-5 py-2 hover:bg-zinc-800 transition-colors"
            >
              Suchen
            </button>
          </div>
        </form>

      </section>

      {/* Letzte Plenarsitzung — schlanker Banner (klickbar zur Detail-Page) */}
      {s.latestSitzung && (
        <section className="w-full max-w-6xl mx-auto px-5 pb-5 fade-in-up fade-in-up-2">
          <Link
            href={`/design/linear/parlamente/berlin/sitzung/${s.latestSitzung.sitzungNr}`}
            className="group block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:border-zinc-300 hover:bg-zinc-50/30 transition-colors"
          >
            <div className="flex items-baseline gap-x-4 gap-y-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 shrink-0">
                Letzte Plenarsitzung
              </span>
              <span className="text-[12.5px] text-zinc-600 num">
                Plenarprotokoll {s.latestSitzung.plprDokNr} · {formatDate(s.latestSitzung.datum)} · {s.latestSitzung.debattenCount} Debattenbeiträge
              </span>
              <span className="ml-auto text-[12px] text-zinc-400 group-hover:text-zinc-700 inline-flex items-center gap-1 transition-colors">
                Übersicht öffnen
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </span>
            </div>
            {s.latestSitzung.topItems.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <span className="text-[11px] text-zinc-400">
                  Inhaltliche Debatte{s.latestSitzung.topItems.length === 1 ? "" : "n"}:
                </span>
                {s.latestSitzung.topItems.map((t) => (
                  <span
                    key={t.marker}
                    className="inline-flex items-baseline gap-2 px-2.5 py-1 rounded-md border border-zinc-100 bg-zinc-50/60"
                  >
                    <span className="num text-[10px] font-semibold text-zinc-500">
                      TOP {t.marker}
                    </span>
                    <span className="text-[12.5px] text-zinc-950 leading-snug">
                      {t.titel}
                    </span>
                    <span className="num text-[10px] text-zinc-400">
                      {t.redenCount} {t.redenCount === 1 ? "Rede" : "Reden"}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </Link>
        </section>
      )}

      {/* 3-Spalten-Grid: Abstimmungen + Gesetzentwürfe + Schriftliche Anfragen */}
      <section className="w-full max-w-6xl mx-auto px-5 pb-24 fade-in-up fade-in-up-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Spalte 1: Aktuelle Abstimmungen — Rotating Deck */}
          {s.latestVotes.length > 0 && (
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 mb-1">
                Aktuelle Abstimmungen
              </h3>
              <p className="text-[12px] text-zinc-500 mb-4">
                Fraktions-Handzeichen im Plenum
              </p>
              <div className="flex-1 flex flex-col">
                <RotatingDeck>
                  {s.latestVotes.map((v) => (
                    <article
                      key={v.voteId}
                      className="rounded-lg border border-zinc-100 px-4 py-4 h-[320px] flex flex-col gap-2.5 overflow-hidden"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            v.outcome === "annahme" || v.outcome === "annahme_geaendert"
                              ? "text-emerald-700 bg-emerald-50"
                              : v.outcome === "ablehnung"
                              ? "text-red-700 bg-red-50"
                              : "text-zinc-600 bg-zinc-100"
                          }`}
                        >
                          {(v.outcome === "annahme" || v.outcome === "annahme_geaendert") ? "Angenommen"
                            : v.outcome === "ablehnung" ? "Abgelehnt"
                            : v.outcome === "vertagung" ? "Vertagt"
                            : v.outcome === "ueberweisung" ? "Überwiesen"
                            : v.outcome}
                        </span>
                        {v.modus && (
                          <span className="text-[10px] text-zinc-400 italic">{v.modus}</span>
                        )}
                      </div>
                      {v.primaryTitel && (
                        v.primaryDbid ? (
                          <Link
                            href={`/design/linear/parlamente/berlin/drucksache/${v.primaryDbid}`}
                            className="block text-[14px] font-semibold text-zinc-950 leading-snug hover:text-blue-700 transition-colors"
                          >
                            {v.primaryTitel}
                          </Link>
                        ) : (
                          <p className="text-[14px] font-semibold text-zinc-950 leading-snug">
                            {v.primaryTitel}
                          </p>
                        )
                      )}
                      {v.primaryZusammenfassung && (
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed flex-1 overflow-hidden">
                          {truncate(v.primaryZusammenfassung, 240)}
                        </p>
                      )}
                      <div className={v.primaryZusammenfassung ? "" : "flex-1 flex items-end"}>
                        <div className="flex flex-wrap gap-1 w-full">
                          {Object.entries(v.fraktionVotes).map(([frak, vote]) => (
                            <span
                              key={frak}
                              className={`text-[10.5px] font-medium px-2 py-0.5 rounded ${
                                vote === "ja"
                                  ? "text-emerald-800 bg-emerald-50 border border-emerald-200/60"
                                  : vote === "nein"
                                  ? "text-red-800 bg-red-50 border border-red-200/60"
                                  : vote === "enthaltung"
                                  ? "text-amber-800 bg-amber-50 border border-amber-200/60"
                                  : "text-zinc-500 bg-zinc-50 border border-zinc-200/60"
                              }`}
                              title={`${frak}: ${vote}`}
                            >
                              {frak}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10.5px] text-zinc-400 num pt-1">
                        Sitzung {v.sitzungNr} · {formatDate(v.datum)}
                        {v.drucksacheNrn.length > 0 && (
                          <> · Drs. {v.drucksacheNrn.slice(0, 2).join(", ")}{v.drucksacheNrn.length > 2 ? ` (+${v.drucksacheNrn.length - 2})` : ""}</>
                        )}
                      </p>
                    </article>
                  ))}
                </RotatingDeck>
              </div>
            </div>
          )}

          {/* Spalte 2: Aktuelle Gesetzentwürfe — Rotating Deck */}
          {s.latestGesetzentwuerfe.length > 0 && (
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 mb-1">
                Aktuelle Gesetzentwürfe
              </h3>
              <p className="text-[12px] text-zinc-500 mb-4">
                Berliner Landesgesetzgebung im Verfahren
              </p>
              <div className="flex-1 flex flex-col">
                <RotatingDeck>
                  {s.latestGesetzentwuerfe.map((g) => (
                    <article
                      key={g.dbid}
                      className="rounded-lg border border-zinc-100 px-4 py-4 h-[320px] flex flex-col gap-2.5 overflow-hidden"
                    >
                      {g.titel && (
                        <Link
                          href={`/design/linear/parlamente/berlin/drucksache/${g.dbid}`}
                          className="block text-[14px] font-semibold text-zinc-950 leading-snug hover:text-blue-700 transition-colors"
                        >
                          {g.titel}
                        </Link>
                      )}
                      {g.zusammenfassung && (
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed flex-1 overflow-hidden">
                          {truncate(g.zusammenfassung, 320)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 num pt-1">
                        <span>{formatDate(g.datum)}</span>
                        {g.dokNr && (
                          <>
                            <span className="text-zinc-300">·</span>
                            <span>Drs. {g.dokNr}</span>
                          </>
                        )}
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
            </div>
          )}

          {/* Spalte 3: Schriftliche Anfragen — Rotating Deck */}
          {s.latestAnfragen.length > 0 && (
            <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 mb-1">
                Schriftliche Anfragen
              </h3>
              <p className="text-[12px] text-zinc-500 mb-4">
                Kontroll-Instrument der Abgeordneten
              </p>
              <div className="flex-1 flex flex-col">
                <RotatingDeck>
                  {s.latestAnfragen.map((a) => (
                    <article
                      key={a.dokNr}
                      className="rounded-lg border border-zinc-100 px-4 py-4 h-[320px] flex flex-col gap-2.5 overflow-hidden"
                    >
                      <Link
                        href={`/design/linear/parlamente/berlin/drucksache/${a.dbid}`}
                        className="block text-[14px] font-semibold text-zinc-950 leading-snug hover:text-blue-700 transition-colors"
                      >
                        {a.titel}
                      </Link>
                      {a.zusammenfassung && (
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed flex-1 overflow-hidden">
                          {truncate(a.zusammenfassung, 320)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 num pt-1">
                        <span>{formatDate(a.datum)}</span>
                        <span className="text-zinc-300">·</span>
                        <span>Drs. {a.dokNr}</span>
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
            </div>
          )}
        </div>
      </section>

    </div>
  );
}