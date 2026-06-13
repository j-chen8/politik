import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getThemenAktivitaet } from "@/lib/themen-blatt";
import { HomeThemeToggle } from "@/components/HomeThemeToggle";

/**
 * Hero-CTA der Startseite → Themensystem (/themen). Zeigt die drei Oberthemen
 * mit den meisten neuen Vorgängen statt eines statischen Kachel-Grids: die
 * Zahlen beweisen Bewegung, der Klick landet direkt im geöffneten Feld.
 * Reihenfolge = Volumen + Aktualität (neutral, kein inhaltliches Ranking).
 */
export function ThemenAktivitaetTeaser() {
  const akt = getThemenAktivitaet();
  if (akt.top.length === 0) return null;

  return (
    <div className="border border-zinc-200/70 rounded-2xl bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Gerade viel Bewegung
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-400 num whitespace-nowrap">
            letzte {akt.tage} Tage
          </span>
          <HomeThemeToggle />
        </div>
      </div>
      <div className="[&>*+*]:border-t [&>*+*]:border-zinc-100 dark:[&>*+*]:border-zinc-800">
        {akt.top.map((t) => (
          <Link
            key={t.slug}
            href={`/themen?feld=${encodeURIComponent(t.slug)}`}
            className="group flex items-center gap-3 py-3.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold leading-snug text-zinc-950 transition-colors group-hover:text-[#1a3e72] dark:text-zinc-100 dark:group-hover:text-blue-400">
                {t.name}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-zinc-500 num dark:text-zinc-400">
                {t.count} neue {t.count === 1 ? "Vorgang" : "Vorgänge"}
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:text-zinc-600 dark:group-hover:text-zinc-300"
              strokeWidth={2.25}
            />
          </Link>
        ))}
      </div>
      <Link
        href="/themen"
        className="mt-1 inline-flex items-center gap-1.5 border-t border-zinc-100 pt-3.5 text-[12.5px] font-medium text-[#1a3e72] transition-all hover:gap-2 dark:border-zinc-800 dark:text-blue-400 w-full"
      >
        Alle {akt.oberCount} Themenfelder · {akt.unterCount} Unterthemen erkunden
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
      </Link>
    </div>
  );
}
