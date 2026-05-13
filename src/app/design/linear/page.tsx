import { SearchBox } from "@/components/SearchBox";
import { PopHeroPolls } from "@/components/PopHeroPolls";
import { LatestActivityStrip } from "@/components/LatestActivityStrip";
import { getDbStats, getLlmPipelineCounts } from "@/lib/db";
import { ArrowRight, Users, FileText, Gavel, Vote } from "lucide-react";
import Link from "next/link";

export default function LinearLanding() {
  const stats = getDbStats();
  const pipeline = getLlmPipelineCounts();
  const fmt = (n: number) => n.toLocaleString("de-DE");

  return (
    <div className="page-wash">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-24 pb-20 fade-in-up">
        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 mb-7">
          Wie arbeitet
          <br />
          <span className="bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-400 bg-clip-text text-transparent">
            Ihr Abgeordneter?
          </span>
        </h1>

        <p className="text-center text-[17px] text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Alle <span className="num text-zinc-900 font-medium">{stats.mdbs.toLocaleString("de-DE")}</span> Bundestagsabgeordneten
          {stats.cabinetQuereinsteiger > 0 && (
            <>
              {" "}+ <span className="num text-zinc-900 font-medium">{stats.cabinetQuereinsteiger}</span> Quereinsteiger-Bundesminister:innen
            </>
          )}.
        </p>

        <div className="max-w-xl mx-auto">
          <SearchBox />
        </div>
      </section>

      {/* Latest-Activity-Strip: zeigt dass die Daten leben */}
      <div className="fade-in-up fade-in-up-2">
        <LatestActivityStrip />
      </div>

      {/* Pop-Hero: Knappste Abstimmungen */}
      <div className="fade-in-up fade-in-up-3">
        <PopHeroPolls />
      </div>

      {/* Feature cards */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-24 pt-12 fade-in-up fade-in-up-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FeatureCard
            href="/design/linear/politiker"
            icon={Users}
            title="Politiker-Profile"
            desc="Lebenslauf, Reden, Anträge, Anwesenheit — alles auf einer Seite."
          />
          <FeatureCard
            href="/design/linear/protokolle"
            icon={Gavel}
            title="Plenarprotokolle"
            desc="Reden mit Quellenpointer und KI-Zusammenfassung."
          />
          <FeatureCard
            href="/design/linear/abstimmungen"
            icon={Vote}
            title="Abstimmungen"
            desc="Wer hat wie abgestimmt — und was wurde dazu gesagt? Reden + Stimme nebeneinander."
          />
          <FeatureCard
            href="/design/linear/aktivitaeten"
            icon={FileText}
            title="Drucksachen & Anfragen"
            desc="Was wurde wann beantragt, von wem — durchsuchbar."
          />
        </div>
      </section>

      {/* So entstehen die Daten — Audit-Trail-Versprechen, kein Marketing */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-24 fade-in-up fade-in-up-5">
        <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-6">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950 mb-2">
              So entstehen die Daten
            </h2>
            <p className="text-[14px] text-zinc-600 leading-relaxed max-w-2xl">
              Roh-Daten (Abstimmungen, Drucksachen, Nebeneinkünfte) kommen 1:1 aus
              offiziellen Quellen. Wo KI hilft, durchläuft jede Aussage mehrere
              unabhängige Prüfschritte mit Modellen verschiedener Familien — jede
              Entscheidung dokumentiert, jede Quelle verlinkbar:
            </p>
            <ul className="mt-4 space-y-2 text-[14px] text-zinc-700">
              <li className="flex items-baseline gap-2">
                <span className="num font-semibold text-zinc-950">{fmt(pipeline.cvSummaries)}</span>
                <span>Lebensläufe KI-strukturiert</span>
                <Link
                  href="/design/linear/methodik"
                  className="text-[12px] text-zinc-500 hover:text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
                >
                  Methodik
                </Link>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="num font-semibold text-zinc-950">{fmt(pipeline.speechAnalyses)}</span>
                <span>Reden KI-analysiert</span>
                <Link
                  href="/design/linear/methodik#reden-pipeline"
                  className="text-[12px] text-zinc-500 hover:text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
                >
                  Methodik
                </Link>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="num font-semibold text-zinc-950">{fmt(pipeline.drucksacheAnalyses)}</span>
                <span>Drucksachen KI-zusammengefasst</span>
                <Link
                  href="/design/linear/methodik"
                  className="text-[12px] text-zinc-500 hover:text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
                >
                  Methodik
                </Link>
              </li>
            </ul>
            <Link
              href="/design/linear/methodik"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 hover:text-zinc-950 transition-colors mt-5"
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

function FeatureCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card-hover group bg-white border border-zinc-200/70 rounded-2xl p-5 flex items-start gap-4"
    >
      <div className="shrink-0 w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200/70 flex items-center justify-center group-hover:bg-zinc-900 group-hover:border-zinc-900 transition-colors">
        <Icon className="w-4 h-4 text-zinc-900 group-hover:text-white transition-colors" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[15px] text-zinc-950 tracking-tight">{title}</h3>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />
        </div>
        <p className="text-[13.5px] text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
