import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowRight } from "lucide-react";
import { getDrucksacheCountForFields } from "@/lib/db";
import {
  CITIZEN_TOPICS,
  TIER_ORDER,
  TIER_STYLE,
  SALIENCE_SOURCE,
} from "@/lib/citizen-topics";

export const metadata = {
  title: "Was bewegt Deutschland? — Themen | Politik-Radar",
  description:
    "Die wichtigsten politischen Themen: was die Menschen umtreibt (Umfragen) und wie viel der Bundestag dazu einbringt — nebeneinander, neutral.",
};

function fmtNum(x: number): string {
  return x.toLocaleString("de-DE");
}

export default function ThemenPage() {
  const tiles = CITIZEN_TOPICS.map((t) => ({
    ...t,
    volume: getDrucksacheCountForFields(t.awFields),
  })).sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
  // Stabile Sortierung: nur nach Tier. Within-Tier-Reihenfolge = Array-Reihenfolge
  // in CITIZEN_TOPICS = Umfrage-Salienz (NICHT Parlaments-Volumen). Siehe dort.

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-12 fade-in-up">
        <header className="max-w-2xl mb-9">
          <h1 className="text-[26px] sm:text-[30px] font-semibold text-zinc-950 leading-tight">
            Was bewegt Deutschland?
          </h1>
          <p className="mt-3 text-[14.5px] text-zinc-600 leading-relaxed">
            Sortiert danach, wie sehr ein Thema die Menschen umtreibt (laut Umfragen). Daneben
            steht, wie viel der Bundestag dazu tatsächlich einbringt — manchmal läuft beides
            auseinander. Wähle ein Thema, um zu den konkreten Vorlagen zu kommen.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <Link
              key={t.slug}
              href={`/themen/${t.slug}`}
              className="group flex flex-col rounded-2xl border border-zinc-200/70 bg-white p-5 hover:border-[#1a3e72]/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-zinc-950 leading-snug group-hover:text-[#1a3e72] transition-colors">
                  {t.label}
                </h2>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_STYLE[t.tier]}`}
                  title="Salienz: wie häufig in Umfragen als wichtiges Problem genannt"
                >
                  {t.tier}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] text-zinc-600 leading-relaxed flex-1">{t.blurb}</p>
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[11.5px] text-zinc-500">
                  {fmtNum(t.volume)} Initiativen im Bundestag
                  {t.flag && (
                    <span className="ml-1.5 text-zinc-400">· {t.flag}</span>
                  )}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-[#1a3e72] transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/themen/divergenz"
          className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-5 py-4 hover:border-[#1a3e72]/40 transition-colors"
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

        <footer className="mt-10 max-w-2xl space-y-2 text-[11.5px] text-zinc-400 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-500">Salienz</span> = wie häufig ein Thema in
            repräsentativen Umfragen als wichtiges Problem genannt wird. Es gibt keine eine
            „richtige" Rangfolge: offene Fragen heben Wirtschaft &amp; Migration, vorgegebene Listen
            heben Armut/Ungleichheit &amp; Inflation. Die Einstufung bildet den Konsens über mehrere
            Umfragen ab, keine Einzelzahl. {SALIENCE_SOURCE}
          </p>
          <p>
            <span className="font-medium text-zinc-500">Initiativen</span> = Anzahl der Drucksachen
            (Gesetze, Anträge, Anfragen), die ein Thema berühren — also was zum Thema{" "}
            <em>eingebracht</em> wird, nicht was beschlossen oder priorisiert wird. Eine Vorlage
            kann mehrere Themen berühren.
          </p>
        </footer>
      </div>
    </div>
  );
}
