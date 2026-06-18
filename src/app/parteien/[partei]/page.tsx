import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getParteiPositionen } from "@/lib/db";
import { partyColors } from "@/lib/party-colors";
import { PARTEIEN, slugToPartei } from "@/lib/partei-slug";
import { feldToSlug, feldKurz } from "@/lib/themenfeld-slug";

interface Props {
  params: Promise<{ partei: string }>;
}

export default async function ParteiPage({ params }: Props) {
  const { partei: slug } = await params;
  const partei = slugToPartei(slug);
  if (!partei) notFound();

  const positionen = getParteiPositionen(partei).filter((p) => !p.leer && p.position);
  if (positionen.length === 0) notFound();

  const meta = PARTEIEN.find((p) => p.partei === partei)!;
  const { bg, fg } = partyColors(partei);
  const belegeGesamt = positionen.reduce((n, p) => n + p.belege.length, 0);

  const anker = (feld: string) => feldToSlug(feld) ?? encodeURIComponent(feld);

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        {/* Brotkrumen */}
        <div className="mb-6 text-[12px] text-zinc-400">
          <Link href="/parteien" className="hover:text-zinc-600 transition-colors">
            Parteien
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-500">{meta.kurz}</span>
        </div>

        {/* Header */}
        <header
          className="mb-8 rounded-2xl px-7 py-8 sm:px-9"
          style={{ backgroundColor: bg, color: fg }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">
            Was die Partei will
          </div>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {meta.kurz}
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed opacity-90">
            Positionen aus dem Wahlprogramm zur Bundestagswahl 2025 — als
            Stichpunkte zum Überfliegen, jede mit ausführlicher Fassung und
            wörtlichem Beleg-Zitat aus dem Programm.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] opacity-90">
            <span>
              <span className="num font-semibold">{positionen.length}</span>{" "}
              Themenfelder
            </span>
            <span>
              <span className="num font-semibold">{belegeGesamt}</span> Belege
            </span>
          </div>
        </header>

        {/* Partei-Umschalter */}
        <nav className="mb-6 flex flex-wrap gap-2" aria-label="Andere Parteien">
          {PARTEIEN.map((p) => {
            const aktiv = p.partei === partei;
            const c = partyColors(p.partei);
            return (
              <Link
                key={p.slug}
                href={`/parteien/${p.slug}`}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  aktiv
                    ? "text-white"
                    : "bg-white text-zinc-600 border border-zinc-200/80 hover:bg-zinc-50"
                }`}
                style={aktiv ? { backgroundColor: c.bg, color: c.fg } : undefined}
              >
                {p.kurz}
              </Link>
            );
          })}
        </nav>

        {/* Sprung-Nav über die Themenfelder */}
        <nav
          className="mb-8 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-5"
          aria-label="Zu Themenfeld springen"
        >
          {positionen.map((pos) => (
            <a
              key={pos.feld}
              href={`#${anker(pos.feld)}`}
              className="rounded-full border border-zinc-200/80 bg-white px-3 py-1 text-[12px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              {feldKurz(pos.feld)}
            </a>
          ))}
        </nav>

        {/* Positionen je Themenfeld */}
        <div className="space-y-3">
          {positionen.map((pos) => {
            const verif = pos.belege.filter((b) => b.verifiziert).length;
            const hatKompakt = pos.kompakt.length > 0;
            return (
              <section
                key={pos.feld}
                id={anker(pos.feld)}
                className="scroll-mt-24 rounded-2xl border border-zinc-200/70 bg-white p-6"
              >
                <div className="flex items-baseline gap-2.5">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: bg }}
                    aria-hidden
                  />
                  <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900">
                    {pos.feld}
                  </h2>
                </div>

                {/* Kompakt-Stichpunkte (Default) */}
                {hatKompakt ? (
                  <ul className="mt-3 space-y-1.5 pl-5">
                    {pos.kompakt.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 text-[13.5px] leading-snug text-zinc-700"
                      >
                        <span
                          className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: bg }}
                          aria-hidden
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2.5 pl-5 text-[13.5px] leading-relaxed text-zinc-700">
                    {pos.position}
                  </p>
                )}

                {/* Ausführlich + Belege */}
                <details className="group/b mt-3 pl-5">
                  <summary className="list-none flex cursor-pointer select-none items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-600">
                    <ChevronDown
                      className="h-3 w-3 transition-transform -rotate-90 group-open/b:rotate-0"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    {hatKompakt ? "Ausführlich & Belege" : "Belege im Wahlprogramm"}
                    {pos.belege.length > 0 && (
                      <span className="num">({pos.belege.length})</span>
                    )}
                  </summary>
                  {hatKompakt && (
                    <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">
                      {pos.position}
                    </p>
                  )}
                  {pos.belege.length > 0 && (
                    <ul className="mt-3 space-y-3">
                      {pos.belege.map((b, i) => (
                        <li
                          key={i}
                          className="border-l-2 border-zinc-200 pl-3.5 text-[13px] leading-relaxed text-zinc-600"
                        >
                          <span className="text-zinc-800">„{b.zitat}“</span>
                          {b.verifiziert && b.seite != null && (
                            <span className="num ml-2 whitespace-nowrap text-[11px] text-zinc-400">
                              Programm S. {b.seite}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {verif < pos.belege.length && (
                    <p className="mt-2.5 text-[11px] text-zinc-400">
                      Zitate ohne Seitenzahl sind sinngemäß aus dem Programm
                      zusammengefasst, nicht wortgleich.
                    </p>
                  )}
                </details>
              </section>
            );
          })}
        </div>

        {/* Methodik-Fußnote */}
        <footer className="mt-10 rounded-2xl border border-zinc-200/70 bg-zinc-50/60 p-6 text-[12px] leading-relaxed text-zinc-500">
          <p className="font-medium text-zinc-600">Wie diese Seite entsteht</p>
          <p className="mt-1.5">
            Quelle ist ausschließlich das offizielle Wahlprogramm der Partei zur
            Bundestagswahl 2025. Pro Themenfeld wird extraktiv und ohne Wertung
            zusammengefasst, was die Partei dort fordert; die Stichpunkte
            verdichten die ausführliche Fassung, jeder Punkt ist mit einem
            wörtlichen Zitat aus dem Programm belegt, dessen Fundstelle geprüft
            ist. Keine Interpretation, keine Einordnung — nur das, was im Programm
            steht.
          </p>
          <p className="mt-2.5">
            <span className="font-medium text-zinc-600">In Arbeit:</span> das
            tatsächliche Abstimmungsverhalten der Fraktion je Themenfeld („was die
            Partei tut") neben der Programm-Position.
          </p>
        </footer>
      </div>
    </div>
  );
}
