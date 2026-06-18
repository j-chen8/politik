import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listParteienMitPositionen } from "@/lib/db";
import { partyColors } from "@/lib/party-colors";
import { PARTEIEN } from "@/lib/partei-slug";

export default function ParteienIndex() {
  const counts = new Map(
    listParteienMitPositionen().map((r) => [r.partei, r.felder]),
  );

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Parteien
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-zinc-600">
            Was jede Partei laut ihrem Wahlprogramm zur Bundestagswahl 2025 in den
            großen Themenfeldern will — sachlich zusammengefasst, jeder Punkt mit
            wörtlichem Zitat aus dem Programm belegt.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {PARTEIEN.map((p) => {
            const { bg, fg } = partyColors(p.partei);
            const felder = counts.get(p.partei) ?? 0;
            return (
              <Link
                key={p.slug}
                href={`/parteien/${p.slug}`}
                className="group flex items-stretch overflow-hidden rounded-2xl border border-zinc-200/70 bg-white transition-colors hover:border-zinc-300"
              >
                <div
                  className="flex w-28 shrink-0 items-center justify-center px-4 text-center text-[15px] font-semibold leading-tight sm:w-32"
                  style={{ backgroundColor: bg, color: fg }}
                >
                  {p.kurz}
                </div>
                <div className="flex flex-1 items-center justify-between px-5 py-5">
                  <div>
                    <div className="text-[14px] font-medium text-zinc-900">
                      Positionen ansehen
                    </div>
                    <div className="num mt-0.5 text-[12px] text-zinc-500">
                      {felder} Themenfelder
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-zinc-400">
          Quelle: offizielle Wahlprogramme zur Bundestagswahl 2025. Extraktiv und
          ohne Wertung, Belege mit geprüfter Fundstelle.
        </p>
      </div>
    </div>
  );
}
