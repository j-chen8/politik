import { SearchBox } from "@/components/SearchBox";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import { ParliamentLanding, type LandingColumn } from "@/components/ParliamentLanding";
import { ThemenAktivitaetTeaser } from "@/components/ThemenAktivitaetTeaser";
import { getBundestagLandingSnapshot } from "@/lib/db";
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

  if (s.latestAnfragen.length > 0) {
    columns.push({
      title: "Kleine Anfragen",
      footer: { href: "/aktivitaeten?typ=fragen", label: "Alle Kleinen Anfragen ansehen" },
      cards: s.latestAnfragen.map((a) => (
        <article key={a.drucksacheNr} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
          <Link
            href={dsHref(a.drucksacheNr)}
            className="text-[14px] font-semibold text-zinc-950 leading-snug hover:text-[#1a3e72] transition-colors dark:text-zinc-100 dark:hover:text-blue-400"
            style={lineClamp(2)}
          >
            {a.titel}
          </Link>
          {a.zusammenfassung && (
            <p className="text-[12.5px] text-zinc-600 leading-relaxed dark:text-zinc-300" style={lineClamp(3)}>
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
      )),
    });
  }

  return (
    <ParliamentLanding
      headline="Woran arbeitet der Bundestag?"
      headlineClassName="text-4xl sm:text-5xl lg:text-[3.4rem]"
      subtitle="Debatten, Drucksachen, Abstimmungen, Interviews — transparent und lesbar."
      methodikHref="/methodik"
      search={<SearchBox />}
      topics={<ThemenAktivitaetTeaser />}
      columns={columns}
      footer={<RecentMediaAnalysesStrip />}
    />
  );
}
