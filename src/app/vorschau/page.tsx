import Link from "next/link";
import type { CSSProperties } from "react";
import { Search, LayoutGrid, Newspaper, MapPin, ArrowRight } from "lucide-react";
import { getBundestagLandingSnapshot } from "@/lib/db";
import { CITIZEN_TOPICS } from "@/lib/citizen-topics";
import { VorschauVoteExplorer, type VorschauVote } from "@/components/VorschauVoteExplorer";

export const metadata = {
  title: "Vorschau — Politik-Radar",
  description: "Mobile-first Homepage-Vorschau nach den Catch-Prinzipien (Research 2026-06-05).",
};

const SHELF_TOPICS = ["wirtschaft-preise", "migration-asyl", "soziale-sicherung", "krieg-konflikte", "rente", "klima-energie"];

const lineClamp = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

function dsHref(nr: string): string {
  return `/aktivitaeten/${nr.replace("/", "-")}`;
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VorschauPage() {
  const s = getBundestagLandingSnapshot();

  const votes: VorschauVote[] = s.latestVotes.map((v) => ({
    id: v.id,
    label: v.label,
    summary: s.voteSummaries[v.id] ?? null,
    outcome: v.outcome,
    outcomeLabel: v.outcome_label,
    type: v.type,
    date: v.date,
    href: v.detail_url,
  }));

  const topics = SHELF_TOPICS
    .map((slug) => CITIZEN_TOPICS.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="page-wash min-h-screen pb-24">
      {/* Vorschau-Hinweis */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-[12px] text-amber-800">
        Design-Vorschau · deine echte Startseite bleibt unter <code className="font-mono">/</code>
      </div>

      <div className="mx-auto w-full max-w-xl px-5">
        {/* ───────── HERO: Wert + Catch ganz oben ───────── */}
        <section className="pt-12 pb-8 fade-in-up">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Politik-Radar
          </span>
          <h1 className="mt-2 text-[2.6rem] sm:text-[3rem] font-semibold leading-[0.98] tracking-[-0.04em] text-zinc-950 text-balance dark:text-zinc-50">
            Woran arbeitet der&nbsp;Bundestag?
          </h1>
          <p className="mt-3 text-[16px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Debatten, Abstimmungen und Gesetze — transparent und lesbar.
          </p>

          {/* Oberste Interaktion = sofortiger persönlicher Treffer, kein Login */}
          <form action="/wahlkreis" method="get" className="mt-6">
            <label className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
              Wer vertritt mich?
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" strokeWidth={2} />
                <input
                  type="text"
                  name="plz"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  placeholder="Postleitzahl, z. B. 50667"
                  aria-label="Postleitzahl"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-11 pr-4 text-[16px] tracking-wide outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-5 text-[15px] font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Finden
              </button>
            </div>
          </form>

          <Link
            href="/suche"
            className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 text-[14px] text-zinc-500 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/60"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            Reden, Drucksachen, Personen durchsuchen…
          </Link>
        </section>

        {/* ───────── SIGNATUR-WOW: ein interaktives Explorable ───────── */}
        <section className="fade-in-up fade-in-up-2">
          <VorschauVoteExplorer votes={votes} />
        </section>

        {/* ───────── SHELF: Themen (horizontal, ruhig) ───────── */}
        <section className="mt-10 fade-in-up fade-in-up-3">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Was bewegt Deutschland?
            </h2>
            <Link href="/themen" className="text-[12px] font-medium text-[#1a3e72] hover:underline dark:text-blue-400">
              Alle Themen
            </Link>
          </div>
          <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topics.map((t) => (
              <Link
                key={t.slug}
                href={`/themen/${t.slug}`}
                className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[14px] font-medium text-zinc-800 transition hover:border-zinc-300 hover:-translate-y-0.5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ───────── SHELF: Neue Gesetzentwürfe (horizontale Karten) ───────── */}
        {s.latestGesetzentwuerfe.length > 0 && (
          <section className="mt-8 fade-in-up fade-in-up-3">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Neue Gesetzentwürfe
              </h2>
              <Link href="/aktivitaeten?typ=gesetze" className="text-[12px] font-medium text-[#1a3e72] hover:underline dark:text-blue-400">
                Alle
              </Link>
            </div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {s.latestGesetzentwuerfe.map((g) => (
                <Link
                  key={g.drucksacheNr}
                  href={dsHref(g.drucksacheNr)}
                  className="flex w-[260px] shrink-0 flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70"
                >
                  <span className="text-[14px] font-semibold leading-snug text-zinc-950 dark:text-zinc-100" style={lineClamp(2)}>
                    {g.titel}
                  </span>
                  {g.zusammenfassung && (
                    <span className="text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-300" style={lineClamp(3)}>
                      {g.zusammenfassung}
                    </span>
                  )}
                  <span className="mt-auto flex items-center gap-2 pt-1 text-[10.5px] text-zinc-400 num">
                    {g.datum && <span>{formatDate(g.datum)}</span>}
                    <span className="text-zinc-300">·</span>
                    <span>Drs. {g.drucksacheNr}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ───────── MOBILE BOTTOM-NAV (Form von Consumer-Apps) ───────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {[
            { href: "/suche", label: "Suche", Icon: Search },
            { href: "/themen", label: "Themen", Icon: LayoutGrid },
            { href: "/abstimmungen", label: "Aktuelles", Icon: Newspaper },
            { href: "/wahlkreis", label: "Mein Wahlkreis", Icon: MapPin },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
