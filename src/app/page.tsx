import { SearchBox } from "@/components/SearchBox";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import { ParliamentLanding, type LandingColumn } from "@/components/ParliamentLanding";
import { getBundestagLandingSnapshot } from "@/lib/db";
import { getDatenstand } from "@/lib/such-vorschlaege";
import Link from "next/link";
import type { CSSProperties } from "react";

// Mehrzeiliges Ellipsis-Clamp per Inline-Style — Tailwinds line-clamp-Utility
// verliert unter Tailwind v4/lightningcss das nötige -webkit-box-orient, daher inline.
const lineClamp = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

function dsHref(nr: string): string {
  return `/aktivitaeten/${nr.replace("/", "-")}`;
}

export default function LinearLanding() {
  const s = getBundestagLandingSnapshot();
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
      footer: { href: "/aktivitaeten?typ=gesetze", label: "Alle Gesetzentwürfe ansehen" },
      cards: s.latestGesetzentwuerfe.map((g) => (
        <article key={g.drucksacheNr} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
          <Link
            href={dsHref(g.drucksacheNr)}
            className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] dark:hover:text-[#8fb3e6] transition-colors dark:text-zinc-100 dark:hover:text-blue-400"
            style={lineClamp(2)}
          >
            {g.titel}
          </Link>
          {g.zusammenfassung && (
            <p className="text-[12.5px] text-zinc-600 leading-relaxed dark:text-zinc-300" style={lineClamp(3)}>
              {g.zusammenfassung}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 dark:text-zinc-500 num pt-1">
            {g.datum && <span>{formatDate(g.datum)}</span>}
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>Drs. {g.drucksacheNr}</span>
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
      footer: { href: "/abstimmungen", label: "Alle Abstimmungen ansehen" },
      cards: s.latestVotes.map((v) => (
        <article key={v.id} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
          {v.label && (
            <Link
              href={v.detail_url}
              className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] dark:hover:text-[#8fb3e6] transition-colors dark:text-zinc-100 dark:hover:text-blue-400"
              style={lineClamp(2)}
            >
              {v.label}
            </Link>
          )}
          {s.voteSummaries[v.id] && (
            <p className="text-[12.5px] text-zinc-600 leading-relaxed dark:text-zinc-300" style={lineClamp(3)}>
              {s.voteSummaries[v.id]}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 flex-wrap pt-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                v.outcome === "angenommen"
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : v.outcome === "abgelehnt"
                  ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                  : "text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {v.outcome_label}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              {v.type === "namentlich" ? "Namentlich" : "Handzeichen"}
            </span>
            {v.date && (
              <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 num ml-auto">{formatDate(v.date)}</span>
            )}
          </div>
        </article>
      )),
    });
  }

  return (
    <ParliamentLanding
      headline="Woran arbeitet der Bundestag?"
      subtitle="Debatten, Drucksachen, Abstimmungen, Interviews — transparent und lesbar."
      methodikHref="/methodik"
      search={
        <div className="mb-14">
          {/* Themen-Einstieg ist der primäre Start (User 2026-06-13): großer CTA
              oben, Suche darunter als sekundärer „oder direkt suchen"-Weg.
              mb-14 = Luft fürs Wortfüll-Dropdown über den Spalten. */}
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/themen"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 dark:hover:bg-blue-500"
            >
              Themen erkunden
            </Link>
            <div className="flex w-full max-w-lg flex-col items-center gap-2">
              <span className="text-[12.5px] text-zinc-400 dark:text-zinc-500">
                oder gezielt nach Person, Thema oder Begriff suchen
              </span>
              <div className="w-full">
                <SearchBox vorschlaegeUrl="/api/suche/vorschlaege" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center text-[12px] text-zinc-400 dark:text-zinc-500 num">
            <span>Daten zuletzt aktualisiert: {getDatenstand()}</span>
          </div>
        </div>
      }
      columns={columns}
      footer={<RecentMediaAnalysesStrip />}
    />
  );
}
