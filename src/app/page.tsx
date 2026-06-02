import { SearchBox } from "@/components/SearchBox";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import { ParliamentLanding, type LandingColumn } from "@/components/ParliamentLanding";
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

const SUCH_BEISPIELE = ["Bürgergeld", "Heizungsgesetz", "Friedrich Merz", "Klimaschutz"];

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

  if (s.latestVotes.length > 0) {
    columns.push({
      title: "Aktuelle Abstimmungen",
      footer: { href: "/abstimmungen", label: "Alle Abstimmungen ansehen" },
      cards: s.latestVotes.map((v) => (
        <article key={v.id} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
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
              <span className="text-[10.5px] text-zinc-400 num ml-auto">{formatDate(v.date)}</span>
            )}
          </div>
        </article>
      )),
    });
  }

  if (s.latestGesetzentwuerfe.length > 0) {
    columns.push({
      title: "Aktuelle Gesetzentwürfe",
      footer: { href: "/aktivitaeten?typ=gesetze", label: "Alle Gesetzentwürfe ansehen" },
      cards: s.latestGesetzentwuerfe.map((g) => (
        <article key={g.drucksacheNr} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
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
      )),
    });
  }

  return (
    <ParliamentLanding
      headline="Woran arbeitet der Bundestag?"
      subtitle="Debatten, Drucksachen, Abstimmungen, Interviews — transparent und lesbar."
      methodikHref="/methodik"
      search={<SearchBox />}
      examples={
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUCH_BEISPIELE.map((term) => (
            <Link
              key={term}
              href={`/suche?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-[12.5px] text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-white transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      }
      plenarPill={
        s.latestSitzung
          ? {
              href: `/protokolle/sitzung/${s.latestSitzung.sitzung}`,
              primary: `${s.latestSitzung.plpr} · ${formatDate(s.latestSitzung.datum)}`,
              secondary: `${s.latestSitzung.redenCount} Redebeiträge`,
            }
          : null
      }
      columns={columns}
      footer={<RecentMediaAnalysesStrip />}
    />
  );
}
