import { SearchBox } from "@/components/SearchBox";
import { LatestActivityStrip } from "@/components/LatestActivityStrip";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import Link from "next/link";

const SUCH_BEISPIELE = ["Bürgergeld", "Heizungsgesetz", "Friedrich Merz", "Klimaschutz"];

export default function LinearLanding() {
  return (
    <div className="page-wash">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-32 pb-20 fade-in-up">
        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 mb-3">
          Wie arbeitet der Bundestag?
        </h1>

        <p className="text-center text-xl text-zinc-500 mx-auto mb-2 leading-relaxed">
          Debatten, Drucksachen, Abstimmungen, Interviews{" "}— transparent und lesbar.
        </p>
        <div className="text-center mb-10">
          <Link
            href="/design/linear/methodik"
            className="text-[13px] text-zinc-500 hover:text-zinc-900 underline decoration-zinc-300 hover:decoration-zinc-700 underline-offset-2 transition-colors"
          >
            zur Methodik →
          </Link>
          <p className="mt-2 text-[11.5px] text-zinc-400">
            Datenstand: 21. Wahlperiode (ab 31.03.2025) — frühere Wahlperioden noch nicht eingespielt, keine wahlperioden-übergreifenden Trends.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <SearchBox />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUCH_BEISPIELE.map((term) => (
            <Link
              key={term}
              href={`/design/linear/suche?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-[12.5px] text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-white transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest-Activity-Strip: zeigt dass die Daten leben */}
      <div className="fade-in-up fade-in-up-2">
        <LatestActivityStrip />
      </div>

      {/* Aktuelle Interview-Analysen — Showcase der Medien-Pipeline */}
      <div className="fade-in-up fade-in-up-3">
        <RecentMediaAnalysesStrip />
      </div>

    </div>
  );
}
