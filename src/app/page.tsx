import { SearchBox } from "@/components/SearchBox";
import { getDbStats, getSourceCoherenceStats } from "@/lib/db";
import { TrendingUp, Users, BarChart3, Shield, Landmark, Globe, Sparkles, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const stats = getDbStats();
  const coherence = getSourceCoherenceStats();

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-4 pt-20 pb-16 text-center fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {stats.politicians.toLocaleString("de-DE")} Politiker · {stats.parliaments} Parlamente
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          Wie arbeitet Ihr
          <br />
          <span className="text-primary">Abgeordneter?</span>
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-10">
          Bundestag, alle 16 Landtage und EU-Parlament – alle Daten auf einen
          Blick. Radikal transparent und vergleichbar.
        </p>

        <SearchBox />
      </section>

      {/* Feature cards */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Landmark,
              title: "18 Parlamente",
              desc: "Bundestag, alle 16 Landtage und EU-Parlament",
              color: "text-primary",
              bg: "bg-primary-light",
            },
            {
              icon: Users,
              title: `${stats.politicians.toLocaleString("de-DE")} Politiker`,
              desc: `Aus ${stats.parties} Parteien mit vollständigen Profilen`,
              color: "text-green",
              bg: "bg-green-light",
            },
            {
              icon: TrendingUp,
              title: "Abstimmungen",
              desc: "Anwesenheit und Stimmverhalten im Bundestag",
              color: "text-accent",
              bg: "bg-purple-100",
            },
            {
              icon: Shield,
              title: "Nebeneinkünfte",
              desc: "Transparenz bei Zusatz-Einkommen",
              color: "text-yellow",
              bg: "bg-yellow-light",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}
              >
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-LLM-Konsens — Transparenz durch KI (jetzt unter den Features, dezenter platziert) */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-20 fade-in">
        <div className="bg-gradient-to-br from-primary-light/40 via-white to-purple-50/50 border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Transparenz durch KI
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
            Multi-LLM-Konsens-System für mehr Verlässlichkeit
          </h2>
          <p className="text-sm text-foreground/85 leading-relaxed mb-5 max-w-2xl">
            Politiker-Lebensläufe werden nicht von einer einzelnen KI erzeugt und blind
            übernommen. Jede Aussage durchläuft ein Konsens-Verfahren mit{" "}
            <strong>fünf unabhängigen Modell-Familien</strong> — gegen
            Trainingsdaten-Bias, gegen Halluzinationen, mit wörtlichem Quellenbeleg pro Eintrag.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            <ModelChip n="①" name="Claude Haiku 4.5" role="Generator" />
            <ModelChip n="②" name="Mistral Small" role="Inspector" />
            <ModelChip n="③" name="Llama 3.3 70B" role="Verifier" />
            <ModelChip n="④" name="Nemotron-Nano" role="Mamba-Diversität" />
            <ModelChip n="⑤" name="gpt-oss-120b" role="Source-Coherence" />
          </div>
          <Link
            href="/methodik"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Methodik &amp; Wirksamkeits-Statistik ansehen →
          </Link>
        </div>
      </section>

      {/* Quellen-Diskrepanz-Block: konkrete Statistik unserer Source-Coherence-Pipeline */}
      <section className="w-full max-w-5xl mx-auto px-4 pb-20 fade-in">
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Quellen-Diskrepanzen offengelegt
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
            Wir prüfen Wikipedia gegen die Politiker-Homepages
          </h2>
          <p className="text-sm text-foreground/85 leading-relaxed mb-4 max-w-2xl">
            Wir extrahieren Lebensläufe aus zwei unabhängigen Quellen — Wikipedia und
            den persönlichen Webseiten — und vergleichen sie automatisch auf
            Widersprüche. Bei{" "}
            <strong>{coherence.politiciansWithEchtConflicts} von {coherence.checked.toLocaleString("de-DE")} geprüften MdBs</strong>{" "}
            haben wir echte Quellen-Konflikte gefunden: falsche Schul-Orte,
            ungenaue Funktionsangaben, veraltete Berufs-Stände. Diese Diskrepanzen
            bleiben transparent in den Profilen sichtbar, statt verschleiert zu werden.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md mb-4">
            <Stat n={coherence.checked} label="Profile geprüft" />
            <Stat n={coherence.totalEchtConflicts} label="Konflikte entdeckt" />
            <Stat n={coherence.politiciansWithEchtConflicts} label="MdBs betroffen" />
          </div>
          <p className="text-[12px] text-foreground/70 leading-snug max-w-2xl mb-3">
            Jeder Konflikt wird mit beiden Originalquellen + KI-Begründung in der jeweiligen
            Politiker-Detailseite ausgewiesen. Quellen pro Eintrag: Wikipedia (Volltext zur Person),
            persönliche Homepage (cv-Auszug der Selbstdarstellung), bei einzelnen Korrekturen zusätzlich:
            bundestag.de-Bio, CDU-/SPD-Webarchive, NRW-Landtagsregister.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/quellen-diskrepanzen"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
            >
              Vollständige Liste der Diskrepanzen →
            </Link>
            <Link
              href="/methodik"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
            >
              Wie wir Konflikte erkennen &amp; auflösen →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="bg-white border border-amber-200 rounded-xl px-3 py-2.5">
      <div className="text-2xl font-extrabold tracking-tight text-amber-900">
        {n.toLocaleString("de-DE")}
      </div>
      <div className="text-[11px] text-foreground/70 leading-snug">{label}</div>
    </div>
  );
}

function ModelChip({ n, name, role }: { n: string; name: string; role: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border">
      <span className="text-primary font-mono text-base">{n}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{name}</div>
        <div className="text-[11px] text-muted">{role}</div>
      </div>
    </div>
  );
}
