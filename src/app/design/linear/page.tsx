import { SearchBox } from "@/components/SearchBox";
import { getDbStats, getSourceCoherenceStats } from "@/lib/db";
import { ArrowRight, Users, FileText, Gavel, Wallet, Sparkles, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function LinearLanding() {
  const stats = getDbStats();
  const coherence = getSourceCoherenceStats();

  return (
    <div className="page-wash">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-24 pb-20 fade-in-up">
        {/* Live indicator */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-200 bg-white/70 backdrop-blur text-[11px] font-medium text-zinc-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="num text-zinc-900 font-semibold">{stats.politicians.toLocaleString("de-DE")}</span>
            <span>Politiker · live</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[0.95] text-zinc-950 mb-7">
          Wie arbeitet
          <br />
          <span className="bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-400 bg-clip-text text-transparent">
            Ihr Abgeordneter?
          </span>
        </h1>

        <p className="text-center text-[17px] text-zinc-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Alle <span className="num text-zinc-900 font-medium">{stats.politicians.toLocaleString("de-DE")}</span> Mitglieder
          des Bundestags — vollständig durchleuchtet,
          radikal transparent, vergleichbar.
        </p>

        <div className="max-w-xl mx-auto">
          <SearchBox />
        </div>

        <div className="flex justify-center mt-6">
          <span className="text-[12px] text-zinc-400">
            Demnächst: alle 16 Landtage und das EU-Parlament
          </span>
        </div>
      </section>

      {/* Stats strip */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-12 fade-in-up fade-in-up-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white/70 backdrop-blur overflow-hidden">
          <Stat label="Politiker" value={stats.politicians.toLocaleString("de-DE")} />
          <Stat label="Parteien" value={stats.parties.toString()} />
          <Stat label="Parlamente" value={stats.parliaments.toString()} />
          <Stat label="Wahlperiode" value="21." sub="2025–2029" />
        </div>
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-24 fade-in-up fade-in-up-3">
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
            href="/design/linear/aktivitaeten"
            icon={FileText}
            title="Drucksachen & Anfragen"
            desc="Was wurde wann beantragt, von wem — durchsuchbar."
          />
          <FeatureCard
            href="/design/linear/politiker"
            icon={Wallet}
            title="Nebeneinkünfte"
            desc="Wer verdient wieviel neben dem Mandat. Mit Quellen."
          />
        </div>
      </section>

      {/* Multi-LLM-Konsens — unter den Features platziert (dezenter, für tech-affine Leser:innen) */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-20 fade-in-up fade-in-up-4">
        <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Transparenz durch KI
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-950 mb-2">
              Multi-LLM-Konsens für mehr Verlässlichkeit
            </h2>
            <p className="text-[14px] text-zinc-600 leading-relaxed max-w-2xl">
              Lebenslauf-Daten werden nicht von einer einzelnen KI erzeugt und blind übernommen.
              Jede Aussage durchläuft ein Konsens-Verfahren mit{" "}
              <span className="text-zinc-950 font-medium">fünf unabhängigen Modell-Familien</span> —
              gegen Bias, gegen Halluzinationen, mit wörtlichem Quellenbeleg.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-zinc-100">
            <LinearModelCell n="①" name="Claude Haiku 4.5" role="Generator" />
            <LinearModelCell n="②" name="Mistral Small" role="Inspector" />
            <LinearModelCell n="③" name="Llama 3.3 70B" role="Verifier" />
            <LinearModelCell n="④" name="Nemotron-Nano" role="Mamba-Diversität" />
            <LinearModelCell n="⑤" name="gpt-oss-120b" role="Source-Coherence" />
          </div>
          <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100">
            <Link
              href="/design/linear/methodik"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
            >
              Methodik &amp; Wirksamkeits-Statistik
              <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </section>

      {/* Quellen-Diskrepanzen offengelegt — konkrete Source-Coherence-Resultate */}
      <section className="w-full max-w-5xl mx-auto px-5 pb-24 fade-in-up fade-in-up-4">
        <div className="border border-amber-200/70 rounded-2xl bg-amber-50/40 overflow-hidden">
          <div className="px-6 py-5 border-b border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" strokeWidth={2.25} />
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-800">
                Quellen-Diskrepanzen offengelegt
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-zinc-950 mb-2">
              Wir prüfen Wikipedia gegen die Politiker-Homepages
            </h2>
            <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              Lebensläufe aus zwei unabhängigen Quellen — Wikipedia und persönliche
              Webseiten — automatisch gegeneinander geprüft. Bei{" "}
              <span className="text-zinc-950 font-medium">
                {coherence.politiciansWithEchtConflicts} von {coherence.checked.toLocaleString("de-DE")} MdBs
              </span>{" "}
              echte Quellen-Konflikte gefunden: falsche Schul-Orte, ungenaue
              Funktionsangaben, veraltete Berufs-Stände. Transparent statt verschleiert.
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-amber-100">
            <LinearStat n={coherence.checked} label="Profile geprüft" />
            <LinearStat n={coherence.totalEchtConflicts} label="Konflikte entdeckt" />
            <LinearStat n={coherence.politiciansWithEchtConflicts} label="MdBs betroffen" />
          </div>
          <div className="px-6 py-3 bg-amber-100/40 border-t border-amber-100 flex flex-wrap gap-x-5 gap-y-1.5">
            <Link
              href="/design/linear/quellen-diskrepanzen"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-900 hover:text-amber-950 transition-colors"
            >
              Vollständige Liste der Diskrepanzen
              <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
            </Link>
            <Link
              href="/design/linear/methodik"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-900 hover:text-amber-950 transition-colors"
            >
              Wie wir Konflikte erkennen
              <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function LinearStat({ n, label }: { n: number; label: string }) {
  return (
    <div className="px-5 py-5">
      <div className="num text-3xl font-semibold tracking-tight text-amber-900">
        {n.toLocaleString("de-DE")}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700/80 mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-5 py-6 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="num text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">{value}</span>
      {sub && <span className="text-[11px] text-zinc-400 num">{sub}</span>}
    </div>
  );
}

function LinearModelCell({ n, name, role }: { n: string; name: string; role: string }) {
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <span className="text-zinc-400 font-mono text-lg">{n}</span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-zinc-950 truncate">{name}</div>
        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{role}</div>
      </div>
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
