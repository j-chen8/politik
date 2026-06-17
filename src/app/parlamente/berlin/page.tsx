import { getBerlinSnapshot } from "@/lib/db";
import { getDatenstand } from "@/lib/such-vorschlaege";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { ParliamentLanding, type LandingColumn } from "@/components/ParliamentLanding";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Abgeordnetenhaus von Berlin — Politik-Radar",
  description: "Die Abgeordneten des Berliner Abgeordnetenhauses, 19. Wahlperiode — Reden, Drucksachen und Abstimmungen.",
};

/**
 * Berlin-Übersicht — 1:1 dasselbe Skelett, denselben Hero (Themen-CTA + sekundäre
 * Suche + Datenstand) UND denselben Karten-Stil wie die Bundestag-Landing (geteilte
 * <ParliamentLanding>), nur mit Berlin-Daten, -Links und -Suche. Berlin hat keinen
 * Medien-/Interview-Strip, daher kein Footer.
 */
// Mehrzeiliges Ellipsis-Clamp per Inline-Style — wie auf der Bundestag-Landing.
const lineClamp = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export default function BerlinOverview() {
  const s = getBerlinSnapshot();
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const columns: LandingColumn[] = [];

  if (s.latestGesetzentwuerfe.length > 0) {
    columns.push({
      title: "Aktuelle Gesetzentwürfe",
      footer: { href: "/parlamente/berlin/drucksachen?klasse=gesetzentwurf", label: "Alle Gesetzentwürfe ansehen" },
      cards: s.latestGesetzentwuerfe.map((g) => (
        <article key={g.dbid} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
          {g.titel && (
            <Link
              href={`/parlamente/berlin/drucksache/${g.dbid}`}
              className="text-[14px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug hover:text-[#1a3e72] dark:hover:text-[#8fb3e6] transition-colors"
              style={lineClamp(2)}
            >
              {g.titel}
            </Link>
          )}
          {g.zusammenfassung && (
            <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed" style={lineClamp(3)}>
              {g.zusammenfassung}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 dark:text-zinc-500 num pt-1">
            <span>{formatDate(g.datum)}</span>
            {g.dokNr && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>Drs. {g.dokNr}</span>
              </>
            )}
            {g.einbringer && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="normal-case">{g.einbringer}</span>
              </>
            )}
          </div>
        </article>
      )),
    });
  }

  if (s.latestVotes.length > 0) {
    columns.push({
      title: "Aktuelle Abstimmungen",
      footer: { href: "/parlamente/berlin/abstimmungen", label: "Alle Abstimmungen ansehen" },
      cards: s.latestVotes.map((v) => (
        <article key={v.voteId} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
          {v.primaryTitel && (
            v.primaryDbid ? (
              <Link
                href={`/parlamente/berlin/drucksache/${v.primaryDbid}`}
                className="text-[14px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug hover:text-[#1a3e72] dark:hover:text-[#8fb3e6] transition-colors"
                style={lineClamp(2)}
              >
                {v.primaryTitel}
              </Link>
            ) : (
              <p className="text-[14px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug" style={lineClamp(2)}>
                {v.primaryTitel}
              </p>
            )
          )}
          {v.primaryZusammenfassung && (
            <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed" style={lineClamp(3)}>
              {v.primaryZusammenfassung}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 flex-wrap pt-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                v.outcome === "annahme" || v.outcome === "annahme_geaendert"
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : v.outcome === "ablehnung"
                  ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                  : "text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {(v.outcome === "annahme" || v.outcome === "annahme_geaendert") ? "Angenommen"
                : v.outcome === "ablehnung" ? "Abgelehnt"
                : v.outcome === "vertagung" ? "Vertagt"
                : v.outcome === "ueberweisung" ? "Überwiesen"
                : v.outcome}
            </span>
            {v.modus && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                {v.modus}
              </span>
            )}
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 num ml-auto">{formatDate(v.datum)}</span>
          </div>
        </article>
      )),
    });
  }

  return (
    <ParliamentLanding
      headline="Woran arbeitet das Abgeordnetenhaus Berlin?"
      headlineClassName="text-4xl sm:text-5xl lg:text-6xl"
      subtitle="Debatten, Drucksachen, Abstimmungen — transparent und lesbar."
      methodikHref="/parlamente/berlin/methodik"
      search={
        <div className="mb-14">
          {/* Identisch zur Bundestag-Landing: Themen-Einstieg als primärer CTA oben,
              Suche darunter als sekundärer „oder direkt suchen"-Weg, Datenstand-Zeile. */}
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/parlamente/berlin/themen"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 dark:hover:bg-blue-500"
            >
              Themen erkunden
            </Link>
            <div className="flex w-full max-w-lg flex-col items-center gap-2">
              <span className="text-[12.5px] text-zinc-400 dark:text-zinc-500">
                oder gezielt nach Person, Thema oder Begriff suchen
              </span>
              <div className="w-full">
                <SearchBox
                  searchPath="/parlamente/berlin/suche"
                  placeholder={'Name oder Thema – z.B. „Wohnen"'}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center text-[12px] text-zinc-400 dark:text-zinc-500 num">
            <span>Daten zuletzt aktualisiert: {getDatenstand()}</span>
          </div>
        </div>
      }
      columns={columns}
    />
  );
}
