import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getFeldVergleich } from "@/lib/db";
import { partyColors } from "@/lib/party-colors";
import { PARTEIEN } from "@/lib/partei-slug";
import { THEMENFELDER, slugToFeld } from "@/lib/themenfeld-slug";
import { getFeldMatrix } from "@/lib/partei-vergleich-matrix";

interface Props {
  params: Promise<{ slug: string }>;
}

const PARTEI_ORDER = new Map(PARTEIEN.map((p, i) => [p.partei, i]));
const PARTEI_KURZ = new Map(PARTEIEN.map((p) => [p.partei, p.kurz]));

export default async function FeldVergleichPage({ params }: Props) {
  const { slug } = await params;
  const feld = slugToFeld(slug);
  if (!feld) notFound();

  const eintraege = getFeldVergleich(feld).sort(
    (a, b) =>
      (PARTEI_ORDER.get(a.partei) ?? 99) - (PARTEI_ORDER.get(b.partei) ?? 99),
  );
  if (eintraege.length === 0) notFound();

  const matrix = getFeldMatrix(feld);
  const parteien = eintraege.map((e) => e.partei);

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        {/* Brotkrumen */}
        <div className="mb-6 text-[12px] text-zinc-400">
          <Link href="/parteien" className="hover:text-zinc-600 transition-colors">
            Parteien
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-500">Vergleich</span>
        </div>

        {/* Header */}
        <header className="mb-6">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Was die Parteien wollen
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {feld}
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-zinc-600">
            {matrix
              ? "Verglichen nach einzelnen Aspekten: Was sagt jede Partei dazu — und wozu schweigt ihr Programm (n/a)? Quelle: Wahlprogramme zur Bundestagswahl 2025."
              : "Die Kernforderungen aller Parteien in diesem Themenfeld — laut Wahlprogramm zur Bundestagswahl 2025. Für Details und Belege jede Partei aufklappen."}
          </p>
        </header>

        {/* Themenfeld-Umschalter (zugleich Sprung-Nav über alle Felder) */}
        <nav className="mb-8 flex flex-wrap gap-1.5" aria-label="Anderes Themenfeld">
          {THEMENFELDER.map((t) => {
            const aktiv = t.feld === feld;
            return (
              <Link
                key={t.slug}
                href={`/parteien/feld/${t.slug}`}
                aria-current={aktiv ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  aktiv
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50"
                }`}
              >
                {t.kurz}
              </Link>
            );
          })}
        </nav>

        {matrix ? (
          /* ---- Aspekt-Matrix ---- */
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Aspekt
                  </th>
                  {parteien.map((p) => {
                    const { bg, fg } = partyColors(p);
                    return (
                      <th
                        key={p}
                        className="min-w-[150px] px-3 py-3 align-bottom"
                      >
                        <span
                          className="inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold"
                          style={{ backgroundColor: bg, color: fg }}
                        >
                          {PARTEI_KURZ.get(p) ?? p}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrix.aspekte.map((asp, ri) => (
                  <tr
                    key={asp.label}
                    className={ri % 2 ? "bg-zinc-50/40" : undefined}
                  >
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 px-4 py-3 align-top text-[13px] font-semibold text-zinc-800 ${
                        ri % 2 ? "bg-[#fafafa]" : "bg-white"
                      }`}
                    >
                      {asp.label}
                    </th>
                    {parteien.map((p) => {
                      const v = asp.zellen[p];
                      return (
                        <td
                          key={p}
                          className="border-l border-zinc-100 px-3 py-3 align-top"
                        >
                          {v ? (
                            <span className="text-[12.5px] leading-snug text-zinc-700">
                              {v}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-300">
                              n/a
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ---- Fallback: Spalten je Partei (Felder ohne Matrix) ---- */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {eintraege.map(({ partei, pos }) => {
              const { bg, fg } = partyColors(partei);
              const hatKompakt = pos.kompakt.length > 0;
              return (
                <section
                  key={partei}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white"
                >
                  <div
                    className="px-4 py-2.5 text-[13px] font-semibold"
                    style={{ backgroundColor: bg, color: fg }}
                  >
                    {PARTEI_KURZ.get(partei) ?? partei}
                  </div>
                  <div className="flex-1 px-4 py-4">
                    {hatKompakt ? (
                      <ul className="space-y-2">
                        {pos.kompakt.map((b, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-[13px] leading-snug text-zinc-700"
                          >
                            <span
                              className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: bg }}
                              aria-hidden
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-zinc-700">
                        {pos.position}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Volltext & Belege je Partei (immer, unter dem Vergleich) */}
        <h2 className="mb-3 mt-8 text-[13px] font-semibold tracking-tight text-zinc-700">
          Volltext &amp; Belege je Partei
        </h2>
        <div className="space-y-2">
          {eintraege.map(({ partei, pos }) => {
            const { bg, fg } = partyColors(partei);
            const verif = pos.belege.filter((b) => b.verifiziert).length;
            return (
              <details
                key={partei}
                className="group/b overflow-hidden rounded-xl border border-zinc-200/70 bg-white"
              >
                <summary className="list-none flex cursor-pointer select-none items-center gap-2.5 px-4 py-3">
                  <ChevronDown
                    className="h-3.5 w-3.5 text-zinc-400 transition-transform -rotate-90 group-open/b:rotate-0"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span
                    className="rounded-md px-2 py-0.5 text-[12px] font-semibold"
                    style={{ backgroundColor: bg, color: fg }}
                  >
                    {PARTEI_KURZ.get(partei) ?? partei}
                  </span>
                  {pos.belege.length > 0 && (
                    <span className="num text-[11px] text-zinc-400">
                      {pos.belege.length} Belege
                    </span>
                  )}
                </summary>
                <div className="px-4 pb-4 pl-11">
                  <p className="text-[13px] leading-relaxed text-zinc-600">
                    {pos.position}
                  </p>
                  {pos.belege.length > 0 && (
                    <ul className="mt-3 space-y-2.5">
                      {pos.belege.map((b, i) => (
                        <li
                          key={i}
                          className="border-l-2 border-zinc-200 pl-3 text-[12.5px] leading-relaxed text-zinc-600"
                        >
                          <span className="text-zinc-800">„{b.zitat}“</span>
                          {b.verifiziert && b.seite != null && (
                            <span className="num ml-1.5 whitespace-nowrap text-[11px] text-zinc-400">
                              S. {b.seite}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {verif < pos.belege.length && (
                    <p className="mt-2.5 text-[11px] text-zinc-400">
                      Zitate ohne Seitenzahl sind sinngemäß zusammengefasst, nicht
                      wortgleich.
                    </p>
                  )}
                </div>
              </details>
            );
          })}
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-zinc-400">
          {matrix
            ? "„n/a“ heißt: im Wahlprogramm dieser Partei nicht behandelt — nicht zwingend Ablehnung. Geplant: solche Lücken aus Reden, Bürgerfragen und Abstimmungen ergänzen. Quelle: offizielle Wahlprogramme zur BTW 2025, Belege geprüft."
            : "Quelle: offizielle Wahlprogramme zur Bundestagswahl 2025, extraktiv und ohne Wertung; Belege mit geprüfter Fundstelle."}
        </p>
      </div>
    </div>
  );
}
