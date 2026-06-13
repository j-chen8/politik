import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RotatingDeck } from "@/components/RotatingDeck";
import type { ReactNode } from "react";

/**
 * Geteiltes Landing-Gerüst für alle Parlamente — wie die Nav parlament-agnostisch.
 * Das Skelett (Hero + Suche + Methodik-Link + Plenarsitzung-Pille + 3-Spalten-Grid)
 * ist 1:1 identisch; beim Parlament-Switch ändern sich nur Wort, Links und Daten.
 * Parlament-spezifische Inhalte (Suchart, Vote-Karten, Footer-Strip) kommen als Slots.
 */

export interface LandingColumn {
  title: string;
  /** Optionale Unterzeile unter dem Spaltentitel (z.B. „Fraktions-Handzeichen im Plenum"). */
  subtitle?: string;
  /** Fertig gerenderte Karten — Inhalt je Parlament unterschiedlich. */
  cards: ReactNode[];
  /** „Alle … ansehen"-Link am Spaltenfuß. */
  footer?: { href: string; label: string };
}

export interface LandingPlenarPill {
  href: string;
  /** Immer sichtbar, z.B. „Plenarprotokoll 21 · 12. Mai 2026". */
  primary: string;
  /** Nur ≥ sm sichtbar, ohne führendes „·" (wird ergänzt), z.B. „142 Debattenbeiträge". */
  secondary?: string;
  /** Akzentfarbe des Punkts, Default Bundestag-Blau. */
  dotClass?: string;
}

export interface ParliamentLandingProps {
  headline: string;
  /** Schriftgrößen-Klassen der Headline — Default Bundestag. Längere Parlamentsnamen
   *  brauchen eine Stufe kleiner, damit der Hero gleich kompakt (2 Zeilen) bleibt. */
  headlineClassName?: string;
  /** Komma-Liste + „— transparent und lesbar". */
  subtitle: string;
  methodikHref: string;
  /** Suchfeld — je Parlament eigenes (Volltext vs. Namenssuche). */
  search: ReactNode;
  /** Optionale Beispiel-Chips unter der Suche (Bundestag). */
  examples?: ReactNode;
  plenarPill?: LandingPlenarPill | null;
  columns: LandingColumn[];
  /** Optionaler Block unter dem Grid (z.B. Interview-Analysen, nur Bundestag). */
  footer?: ReactNode;
  /** Akzentfarbe der „Alle … ansehen"-Links, Default Bundestag-Blau. */
  accentClass?: string;
  /** Optionaler Themen-Block rechts im Hero (nur Bundestag). Vorhanden → zwei-
   *  spaltiger, linksbündiger Hero; fehlt → zentrierter Hero wie bisher. */
  topics?: ReactNode;
}

export function ParliamentLanding({
  headline,
  headlineClassName = "text-5xl sm:text-6xl lg:text-7xl",
  subtitle,
  methodikHref,
  search,
  examples,
  plenarPill,
  columns,
  footer,
  accentClass = "text-[#1a3e72]",
  topics,
}: ParliamentLandingProps) {
  const pill = plenarPill && (
    <Link
      href={plenarPill.href}
      className="group inline-flex items-center gap-2 max-w-full rounded-full border border-zinc-200/80 bg-white/70 py-1.5 pl-3 pr-3 text-[12.5px] hover:border-zinc-300 hover:bg-white transition-colors dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${plenarPill.dotClass ?? "bg-[#1a3e72]"}`} />
      <span className="font-medium text-zinc-700 shrink-0 dark:text-zinc-200">Letzte Plenarsitzung</span>
      <span className="text-zinc-300 shrink-0 dark:text-zinc-600">·</span>
      <span className="num text-zinc-500 truncate dark:text-zinc-400">
        {plenarPill.primary}
        {plenarPill.secondary && <span className="hidden sm:inline">{" "}· {plenarPill.secondary}</span>}
      </span>
      <ArrowRight
        className="w-3.5 h-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all"
        strokeWidth={2.25}
      />
    </Link>
  );

  return (
    <div className="page-wash">
      {topics ? (
        /* Zweispaltiger Hero (Bundestag): Inhalt links, Themen rechts */
        <section className="w-full max-w-6xl mx-auto px-5 pt-20 lg:pt-24 pb-10 fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <h1 className={`${headlineClassName} font-semibold tracking-[-0.04em] leading-[0.98] text-zinc-950 dark:text-zinc-50 mb-3 text-balance`}>
                {headline}
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed">{subtitle}</p>
              <div className="mb-7">
                <Link
                  href={methodikHref}
                  className="text-[13px] text-zinc-500 hover:text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-700 underline-offset-2 transition-colors dark:text-zinc-400 dark:hover:text-zinc-100 dark:decoration-zinc-600"
                >
                  zur Methodik →
                </Link>
              </div>
              <div className="max-w-xl">{search}</div>
              {examples}
              {pill && <div className="mt-6 flex fade-in-up fade-in-up-2">{pill}</div>}
            </div>
            <div className="fade-in-up fade-in-up-2">{topics}</div>
          </div>
        </section>
      ) : (
        /* Zentrierter Hero (Bundestag & Berlin). relative z-20: fade-in-up macht
           jede Section zum Stacking-Context — ohne Hebung läge das Wortfüll-
           Dropdown der Suche HINTER dem Spalten-Grid. */
        <section className="relative z-20 w-full max-w-3xl mx-auto px-5 pt-24 pb-12 fade-in-up">
          <h1 className={`text-center ${headlineClassName} font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 dark:text-zinc-50 mb-3 text-balance`}>
            {headline}
          </h1>
          <p className="text-center text-xl text-zinc-500 dark:text-zinc-400 mx-auto mb-2 leading-relaxed">{subtitle}</p>
          <div className="text-center mb-10">
            <Link
              href={methodikHref}
              className="text-[13px] text-zinc-500 hover:text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-700 underline-offset-2 transition-colors dark:text-zinc-400 dark:hover:text-zinc-100 dark:decoration-zinc-600"
            >
              zur Methodik →
            </Link>
          </div>
          {/* max-w-3xl statt xl: Bundestag hängt den „Zur Themenauswahl"-Button neben
              die Suche — Berlins schmale SearchBox zentriert sich darin unverändert. */}
          <div className="max-w-3xl mx-auto">{search}</div>
          {examples}
          {pill && <div className="mt-7 flex justify-center fade-in-up fade-in-up-2">{pill}</div>}
        </section>
      )}

      {/* 3-Spalten-Grid */}
      <section className={`w-full max-w-6xl mx-auto px-5 ${footer ? "pb-12" : "pb-24"} fade-in-up fade-in-up-3`}>
        {/* Spaltenzahl folgt dem Inhalt — Bundestag hat seit 2026-06-13 nur noch
            2 Spalten (GE + Kleine Anfragen), Berlin weiter 3. */}
        <div className={`grid grid-cols-1 gap-5 ${columns.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {columns.map((col) => (
            <div key={col.title} className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 flex flex-col dark:border-zinc-800 dark:bg-zinc-900/70">
              <h3 className={`text-[15px] font-semibold tracking-[-0.01em] text-zinc-950 dark:text-zinc-100 ${col.subtitle ? "mb-1" : "mb-4"}`}>
                {col.title}
              </h3>
              {col.subtitle && (
                <p className="text-[12px] text-zinc-500 mb-4 dark:text-zinc-400">{col.subtitle}</p>
              )}
              <div className="flex-1 flex flex-col">
                <RotatingDeck>{col.cards}</RotatingDeck>
              </div>
              {col.footer && (
                <Link
                  href={col.footer.href}
                  className={`mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 inline-flex items-center gap-1.5 text-[12.5px] font-medium ${accentClass} dark:text-blue-400 hover:gap-2 transition-all`}
                >
                  {col.footer.label}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {footer && <div className="fade-in-up fade-in-up-3">{footer}</div>}
    </div>
  );
}
