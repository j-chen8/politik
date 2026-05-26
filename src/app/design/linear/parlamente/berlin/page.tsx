import { getBerlinSnapshot } from "@/lib/db";
import Link from "next/link";
import { Search, ArrowRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abgeordnetenhaus von Berlin — Politik-Radar",
  description: "Die 159 Abgeordneten des Berliner Abgeordnetenhauses, 19. Wahlperiode.",
};

/**
 * Berlin-Übersicht — symmetrisch zur Bundestag-Landing (Hero + Suche +
 * Aktuelles), aber mit Berlin-Daten aus PARDOK. Der dritte Abschnitt der
 * Landing (KI-Pipeline-Zahlen) lässt sich nicht übertragen — Berlin hat die
 * Analyse-Schicht nicht — daher hier ein ehrlicher Abdeckungs-Block.
 */
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

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-5 text-[13px]">
          <Link
            href="/design/linear/politiker?parlament=2"
            className="inline-flex items-center gap-1.5 font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
          >
            Alle {fmt(s.memberCount)} Abgeordneten ansehen
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
          </Link>
          <span className="text-zinc-300">·</span>
          <Link
            href="/design/linear/parlamente/berlin/suche?type=drucksachen"
            className="inline-flex items-center gap-1.5 font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
          >
            Drucksachen + Reden durchsuchen
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
          </Link>
        </div>
      </section>

      {/* Aktuelles aus dem Abgeordnetenhaus */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-6 fade-in-up fade-in-up-2">
        <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-6">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950 mb-1">
              Aktuelles aus dem Abgeordnetenhaus
            </h2>
            {s.latestPlenum && (
              <p className="text-[13px] text-zinc-500 mb-5">
                Letzte erfasste Plenarsitzung:{" "}
                <span className="text-zinc-800 font-medium">Plenarprotokoll {s.latestPlenum.dokNr}</span>{" "}
                <span className="num">· {formatDate(s.latestPlenum.datum)}</span>
              </p>
            )}

            {s.latestAnfragen.length > 0 && (
              <>
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2.5">
                  Jüngste Schriftliche Anfragen
                </h3>
                <ul className="space-y-1.5">
                  {s.latestAnfragen.map((a) => (
                    <li
                      key={a.dokNr}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-zinc-100"
                    >
                      <span className="num text-[11px] text-zinc-400 shrink-0 w-20">
                        {formatDate(a.datum)}
                      </span>
                      <span className="flex-1 min-w-0 text-[13.5px] text-zinc-950 leading-snug">
                        {a.titel}
                      </span>
                      {a.lokUrl && (
                        <a
                          href={a.lokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-zinc-400 hover:text-zinc-950 transition-colors"
                          title={`Drucksache ${a.dokNr}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Was diese Seite zeigt — ehrlicher Pilot-Abdeckungs-Block */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-24 fade-in-up fade-in-up-3">
        <div className="border border-zinc-200/70 rounded-2xl bg-white px-6 py-6">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950 mb-2">
            Was diese Seite zeigt
          </h2>
          <p className="text-[14px] text-zinc-600 leading-relaxed max-w-2xl mb-4">
            Berlin ist ein <span className="font-medium text-zinc-900">Pilot</span> — das
            Profil-Fundament steht, die KI-Analyse-Schicht des Bundestags gibt es hier noch nicht:
          </p>
          <ul className="space-y-2 text-[14px] text-zinc-700">
            <li className="flex items-baseline gap-2">
              <span className="num font-semibold text-zinc-950">{fmt(s.cvCount)}</span>
              <span>Lebensläufe aus Wikipedia, KI-strukturiert</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="num font-semibold text-zinc-950">{fmt(s.ausschussCount)}</span>
              <span>Ausschuss-Mitgliedschaften</span>
            </li>
            <li className="flex items-baseline gap-2">
              <span className="num font-semibold text-zinc-950">{fmt(s.redenCount)}</span>
              <span>Redebeiträge &amp;</span>
              <span className="num font-semibold text-zinc-950">{fmt(s.anfragenCount)}</span>
              <span>Anfragen — aus den amtlichen Parlamentsdokumenten</span>
            </li>
          </ul>
          <p className="text-[13px] text-zinc-500 leading-relaxed max-w-2xl mt-4">
            <span className="font-medium text-zinc-700">Im Aufbau:</span> Tonalitäts- und
            Bias-Analyse der Reden sowie KI-Zusammenfassungen der Drucksachen — wie beim
            Bundestag — folgen für Berlin erst später.
          </p>
        </div>
      </section>
    </div>
  );
}
