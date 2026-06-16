import { getBerlinSnapshot } from "@/lib/db";
import { Layers } from "lucide-react";
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
 * Berlin-Übersicht — rendert dasselbe Skelett UND denselben kompakten Karten-Stil
 * wie die Bundestag-Landing (geteilte <ParliamentLanding>), nur mit Berlin-Daten,
 * -Links und -Suche. Akzent-/Link-Farbe ist Berlin-Blau statt Bundestag-Dunkelblau.
 */
// Häufigste thematische Begriffe in den Berlin-Daten (gemessen an Treffern in
// Reden + Drucksachen) — „Senat" bewusst raus, da Institution statt Thema.
const SUCH_BEISPIELE = ["Wohnen", "Bildung", "Klima", "Verkehr"];

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

  if (s.latestAnfragen.length > 0) {
    columns.push({
      title: "Schriftliche Anfragen",
      footer: { href: "/parlamente/berlin/drucksachen?klasse=anfrage_antwort", label: "Alle Schriftlichen Anfragen ansehen" },
      cards: s.latestAnfragen.map((a) => (
        <article key={a.dokNr} className="h-[150px] flex flex-col gap-2.5 overflow-hidden">
          <Link
            href={`/parlamente/berlin/drucksache/${a.dbid}`}
            className="text-[14px] font-semibold text-zinc-950 dark:text-zinc-50 leading-snug hover:text-[#1a3e72] dark:hover:text-[#8fb3e6] transition-colors"
            style={lineClamp(2)}
          >
            {a.titel}
          </Link>
          {a.zusammenfassung && (
            <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed" style={lineClamp(3)}>
              {a.zusammenfassung}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 flex-wrap text-[10.5px] text-zinc-400 dark:text-zinc-500 num pt-1">
            <span>{formatDate(a.datum)}</span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span>Drs. {a.dokNr}</span>
            {a.fraktion && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
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
      headline="Woran arbeitet das Abgeordnetenhaus Berlin?"
      headlineClassName="text-4xl sm:text-5xl lg:text-6xl"
      subtitle="Debatten, Drucksachen, Abstimmungen — transparent und lesbar."
      methodikHref="/parlamente/berlin/methodik"
      search={
        <SearchBox
          searchPath="/parlamente/berlin/suche"
          placeholder={'Name oder Thema – z.B. „Wohnen"'}
        />
      }
      examples={
        <div className="mt-4 flex flex-col items-center gap-3">
          <Link
            href="/parlamente/berlin/themen"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-600 bg-card px-4 py-1.5 text-[13px] font-medium text-zinc-800 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" strokeWidth={2.25} />
            Themen erkunden
          </Link>
          <div className="flex flex-wrap justify-center gap-2">
            {SUCH_BEISPIELE.map((term) => (
              <Link
                key={term}
                href={`/parlamente/berlin/suche?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[12.5px] text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-card transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      }
      plenarPill={
        s.latestSitzung
          ? {
              href: `/parlamente/berlin/sitzung/${s.latestSitzung.sitzungNr}`,
              primary: `Plenarprotokoll ${s.latestSitzung.plprDokNr} · ${formatDate(s.latestSitzung.datum)}`,
              secondary: `${s.latestSitzung.debattenCount} Debattenbeiträge`,
              dotClass: "bg-[#1a3e72] dark:bg-[#8fb3e6]",
            }
          : null
      }
      columns={columns}
    />
  );
}
