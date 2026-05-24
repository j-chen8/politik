import { SearchBox } from "@/components/SearchBox";
import { LatestActivityStrip } from "@/components/LatestActivityStrip";
import { RecentMediaAnalysesStrip } from "@/components/RecentMediaAnalysesStrip";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const DATEN_SCHRITTE = [
  {
    titel: "Offizielle Rohdaten",
    text: "Die Daten kommen 1:1 aus offiziellen Quellen — Bundestag und abgeordnetenwatch, unverändert übernommen.",
  },
  {
    titel: "KI-Aufbereitung",
    text: "Umfangreiche Originaltexte wie Reden oder Drucksachen fasst KI zusammen und strukturiert sie — damit sie durchsuchbar und vergleichbar werden.",
  },
  {
    titel: "Nachvollziehbar",
    text: "Die Daten lassen sich bis zur offiziellen Originalquelle zurückverfolgen. Die KI-Analysen sind stichprobenartig auditiert und ihre Grenzen offen dokumentiert.",
  },
];

const SUCH_BEISPIELE = ["Bürgergeld", "Heizungsgesetz", "Friedrich Merz", "Klimaschutz"];

export default function LinearLanding() {
  return (
    <div className="page-wash">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-24 pb-20 fade-in-up">
        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 mb-7">
          Wie arbeitet
          <br />
          <span className="bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-400 bg-clip-text text-transparent">
            der Bundestag?
          </span>
        </h1>

        <p className="text-center text-[17px] text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Abstimmungen, Reden und Drucksachen — und die Lebensläufe aller Abgeordneten dahinter.
        </p>

        <div className="max-w-xl mx-auto">
          <SearchBox />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUCH_BEISPIELE.map((term) => (
            <Link
              key={term}
              href={`/design/linear/suche?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-zinc-200 bg-white/70 px-3.5 py-2 text-[13px] text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 hover:bg-white transition-colors"
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

      {/* So entstehen die Daten — Prozess in drei Schritten */}
      <section className="w-full max-w-5xl mx-auto pt-12 px-5 pb-24 fade-in-up fade-in-up-4">
        <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-6">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950 mb-6">
              So entstehen die Daten
            </h2>
            <ol className="space-y-5">
              {DATEN_SCHRITTE.map((schritt, i) => (
                <li key={schritt.titel} className="flex gap-3.5">
                  <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full border border-zinc-300 text-zinc-500 text-[12px] font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
                    <span className="font-semibold text-zinc-950">{schritt.titel}</span>
                    {" — "}
                    {schritt.text}
                  </p>
                </li>
              ))}
            </ol>
            <Link
              href="/design/linear/methodik"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 hover:text-zinc-950 transition-colors mt-7"
            >
              Pipeline, Modelle, bekannte Limitationen
              <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
