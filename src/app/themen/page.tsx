import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowRight } from "lucide-react";
import { CITIZEN_TOPICS, TIER_ORDER, SALIENCE_SOURCE } from "@/lib/citizen-topics";
import { TopicCard } from "@/components/TopicCard";

export const metadata = {
  title: "Was bewegt Deutschland? — Themen | Politik-Radar",
  description:
    "Die wichtigsten politischen Themen: was die Menschen umtreibt (Umfragen) und wie viel der Bundestag dazu einbringt — nebeneinander, neutral.",
};

export default function ThemenPage() {
  // Stabile Sortierung nur nach Tier → Within-Tier-Reihenfolge = Array-Reihenfolge
  // in CITIZEN_TOPICS = Umfrage-Salienz.
  const tiles = [...CITIZEN_TOPICS].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );
  const mainTiles = tiles.filter((t) => t.tier !== "niedrig");
  const sonstige = tiles.filter((t) => t.tier === "niedrig");

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-12 fade-in-up">
        <header className="max-w-2xl mb-9">
          <h1 className="text-[26px] sm:text-[30px] font-semibold text-zinc-950 leading-tight">
            Was bewegt Deutschland?
          </h1>
          <p className="mt-3 text-[14.5px] text-zinc-600 leading-relaxed">
            Die politischen Themen, sortiert danach, wie sehr sie die Menschen umtreiben (laut
            Umfragen). Wähle ein Thema, um zu sehen, woran der Bundestag dazu tatsächlich arbeitet.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {mainTiles.map((t) => (
            <TopicCard key={t.slug} slug={t.slug} label={t.label} />
          ))}
        </div>

        {sonstige.length > 0 && (
          <>
            <h2 className="mt-10 mb-4 text-[15px] font-semibold text-zinc-950">
              Sonstige Themen
              <span className="ml-2 text-[12px] font-normal text-zinc-400">
                weiterer parlamentarischer Schwerpunkt, aber keine Umfrage-Top-Sorge
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sonstige.map((t) => (
                <TopicCard key={t.slug} slug={t.slug} label={t.label} />
              ))}
            </div>
          </>
        )}

        <Link
          href="/themen/divergenz"
          className="group mt-8 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-5 py-4 hover:border-[#1a3e72]/40 transition-colors"
        >
          <div>
            <div className="text-[14px] font-semibold text-zinc-950 group-hover:text-[#1a3e72] transition-colors">
              Wo Aufmerksamkeit und Sorge auseinanderlaufen
            </div>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Was die Menschen umtreibt — und wie viel der Bundestag dazu tatsächlich einbringt.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0 text-zinc-300 group-hover:text-[#1a3e72] transition-colors" />
        </Link>

        <footer className="mt-10 max-w-2xl text-[11.5px] text-zinc-400 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-500">Salienz</span> = wie häufig ein Thema in
            repräsentativen Umfragen als wichtiges Problem genannt wird. Es gibt keine eine
            „richtige" Rangfolge: offene Fragen heben Wirtschaft &amp; Migration, vorgegebene Listen
            heben Armut/Ungleichheit &amp; Inflation. Die Einstufung bildet den Konsens über mehrere
            Umfragen ab, keine Einzelzahl. Farben sind rein gestalterisch (kein Etikett).{" "}
            {SALIENCE_SOURCE}
          </p>
        </footer>
      </div>
    </div>
  );
}
