import { SearchBox } from "@/components/SearchBox";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import { ParliamentLanding, type LandingColumn } from "@/components/ParliamentLanding";
import { getBundestagLandingSnapshot } from "@/lib/db";
import { getDatenstand } from "@/lib/such-vorschlaege";
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
            className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] transition-colors dark:text-zinc-100 dark:hover:text-blue-400"
            style={lineClamp(2)}
          >
            {g.titel}
          </Link>
          {g.zusammenfassung && (
            <p className="text-[12.5px] text-zinc-600 leading-relaxed dark:text-zinc-300" style={lineClamp(3)}>
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
              className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] transition-colors dark:text-zinc-100 dark:hover:text-blue-400"
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
              <span className="text-[10.5px] text-zinc-400 num ml-auto">{formatDate(v.date)}</span>
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
          {/* Suche + Themen-Einstieg nebeneinander (User 2026-06-13): das Suchfeld
              füllt Worte aus Namen/Themen/Tags, der Button ist die Erkunden-Tür.
              mb-14 = Luft fürs Wortfüll-Dropdown über den Spalten. */}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <div className="w-full sm:max-w-lg">
              <SearchBox vorschlaegeUrl="/api/suche/vorschlaege" />
            </div>
            <Link
              href="/themen"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
            >
              Zur Themenauswahl
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
            </Link>
          </div>
          <div className="mt-5 flex items-center justify-center text-[12px] text-zinc-400 num">
            <span>Daten zuletzt aktualisiert: {getDatenstand()}</span>
          </div>
        </div>
      }
      columns={columns}
      footer={<RecentMediaAnalysesStrip />}
    />
  );
}
