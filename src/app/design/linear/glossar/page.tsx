import Link from "next/link";
import { ArrowLeft, ListTree } from "lucide-react";
import { TONALITAET_DEFS, REDEN_TYP_DEFS } from "@/lib/glossar";

// Drucksachen-Tonalitäten (separates Schema vs. Reden-Tonalitäten).
interface DrucksacheTonDef {
  slug: string;
  label: string;
  long: string;
  notMeaning?: string;
}

const DRUCKSACHEN_TONALITAETEN: DrucksacheTonDef[] = [
  {
    slug: "fordernd",
    label: "fordernd",
    long:
      "Die Anfrage enthält klare Forderungen oder Handlungsaufrufe an die Bundesregierung. Die Fragestellung verlangt explizit eine Reaktion, Maßnahme oder Positionierung.",
    notMeaning:
      "Bedeutet nicht „berechtigte Forderung“. Das Label markiert die Form der Fragestellung, nicht die politische Plausibilität des Anliegens.",
  },
  {
    slug: "kritisch",
    label: "kritisch",
    long:
      "Die Anfrage enthält Vorwürfe, Missstands-Schilderungen oder eine kritische Hinterfragung von Regierungshandeln. Die Vorbemerkung oder die Fragestellung selbst signalisieren eine deutliche Skepsis gegenüber dem Regierungs-Vorgehen.",
    notMeaning:
      "Bedeutet nicht „die Kritik trifft zu“. Das Label markiert die kritische Stoßrichtung, nicht die Berechtigung der Kritik.",
  },
  {
    slug: "sachlich",
    label: "sachlich",
    long:
      "Reine Informations- oder Faktenfrage ohne klare Forderung oder Kritik. Die Anfrage stellt offene Fragen zu Daten, Sachverhalten oder Zuständigkeiten, ohne eine eigene Bewertung vorzunehmen.",
    notMeaning:
      "Bedeutet nicht „politisch neutral“ oder „ohne Anliegen“. Die Themenwahl einer sachlichen Anfrage kann politisch motiviert sein — das Label bewertet nur die Formulierung, nicht den Themen-Hintergrund.",
  },
  {
    slug: "informierend",
    label: "informierend",
    long:
      "Die Anfrage stellt eigenes Wissen voran (z. B. eine Beobachtung, eine vorliegende Statistik, einen Bericht) und fordert Bestätigung, Ergänzung oder Stellungnahme von der Bundesregierung.",
    notMeaning:
      "Bedeutet nicht „die vorangestellten Informationen sind korrekt“. Das Label markiert die Frageform (eigenes Wissen + Rückfrage), nicht die Verlässlichkeit des vorgebrachten Inhalts.",
  },
];

const TOC_GROUPS = [
  {
    label: "Klassifikations-Labels",
    anchor: "klassifikation",
    items: [
      { id: "tonalitaeten-reden", label: `Tonalitäten — Plenarreden (${TONALITAET_DEFS.length})` },
      { id: "reden-typen", label: `Reden-Typen (${REDEN_TYP_DEFS.length})` },
      {
        id: "tonalitaeten-drucksachen",
        label: `Tonalitäten — Kleine Anfragen (${DRUCKSACHEN_TONALITAETEN.length})`,
      },
    ],
  },
];

export const metadata = {
  title: "Glossar — Klassifikations-Labels | Politik-Radar",
  description:
    "Definitionen der Klassifikations-Labels, mit denen die Plattform Plenarreden und Kleine Anfragen einsortiert.",
};

export default function GlossarPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-12 fade-in-up">
        <Link
          href="/design/linear"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Übersicht
        </Link>

        {/* Mobile: TOC am Anfang als ausklappbares Detail-Element */}
        <details className="lg:hidden mb-8 rounded-2xl border border-zinc-200/70 bg-white">
          <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-[12px] font-medium text-zinc-700">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhaltsverzeichnis
          </summary>
          <div className="px-4 pb-4">
            <TableOfContents />
          </div>
        </details>

        <div className="lg:flex lg:gap-12">
          <main className="lg:flex-1 lg:max-w-3xl">
            {/* Hero */}
            <div className="mb-12">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Klassifikations-Labels
              </span>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">
                Glossar
              </h1>
              <p className="text-[16px] text-zinc-600 leading-relaxed max-w-2xl">
                Definitionen der Labels, mit denen die Plattform Plenarreden und Kleine Anfragen
                einsortiert: Tonalitäten und Reden-Typen. Jede Definition wird ergänzt um einen{" "}
                <em>Was es nicht bedeutet</em>-Hinweis — die Labels sind Stil- oder
                Funktions-Beschreibungen, keine Wahrheits- oder Wertungs-Urteile.
              </p>
              <p className="text-[14px] text-zinc-500 leading-relaxed max-w-2xl mt-3">
                Wie zuverlässig die Klassifikation ist — siehe{" "}
                <Link
                  href="/design/linear/methodik"
                  className="text-[#1a3e72] hover:underline underline-offset-2"
                >
                  Methodik
                </Link>
                . Was die Daten unter diesen Labels zeigen — siehe{" "}
                <Link
                  href="/design/linear/analyse"
                  className="text-[#1a3e72] hover:underline underline-offset-2"
                >
                  Analyse
                </Link>
                .
              </p>
            </div>

            {/* Tonalitäten Reden */}
            <section id="tonalitaeten-reden" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
                Tonalitäten — Plenarreden ({TONALITAET_DEFS.length})
              </h2>
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                <p className="text-[12.5px] text-amber-900 leading-relaxed">
                  <strong>Wichtig:</strong> Die Tonalitäten beschreiben die{" "}
                  <em>rhetorische Form</em> einer Rede, nicht ihre inhaltliche Berechtigung.
                  „Polemisch" ist keine Wertung der Position; „sachlich" ist keine Bestätigung der
                  Inhalte. Das Label klassifiziert <em>wie</em> gesprochen wird, nicht{" "}
                  <em>was</em> richtig ist.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TONALITAET_DEFS.map((d) => (
                  <div
                    key={d.slug}
                    id={`tonalitaeten-reden-${d.slug.replace(/_/g, "-")}`}
                    className="bg-white border border-zinc-200/70 rounded-xl p-4 scroll-mt-24 [&:target]:ring-2 [&:target]:ring-zinc-900 [&:target]:border-zinc-900 transition-all"
                  >
                    <h3 className="text-[13px] font-semibold text-zinc-950 mb-1.5">{d.label}</h3>
                    <p className="text-[13px] text-zinc-700 leading-relaxed">{d.long}</p>
                    {d.notMeaning && (
                      <div className="mt-2.5 pt-2.5 border-t border-zinc-100">
                        <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                          Was es nicht bedeutet
                        </div>
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed">
                          {d.notMeaning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Reden-Typen */}
            <section id="reden-typen" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
                Reden-Typen (A–K)
              </h2>
              <p className="text-[14px] text-zinc-600 leading-relaxed mb-3 max-w-3xl">
                Ergänzend zur Tonalität klassifizieren wir den <em>Funktionstyp</em> jeder Rede.
                Eine einzelne Rede kann mehreren Typen zugeordnet sein (notiert als{" "}
                <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">A+B</code>).
              </p>
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                <p className="text-[12.5px] text-amber-900 leading-relaxed">
                  Auch hier gilt: die Typen beschreiben die <em>rhetorische Funktion</em> einer
                  Rede, nicht ihre Qualität oder inhaltliche Richtigkeit.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REDEN_TYP_DEFS.map((d) => (
                  <div
                    key={d.code}
                    id={`reden-typen-${d.code}`}
                    className="bg-white border border-zinc-200/70 rounded-xl p-4 scroll-mt-24 [&:target]:ring-2 [&:target]:ring-zinc-900 [&:target]:border-zinc-900 transition-all"
                  >
                    <h3 className="text-[13px] font-semibold text-zinc-950 mb-1.5">
                      <span className="font-mono text-zinc-500 mr-2">{d.code}</span>
                      {d.label}
                    </h3>
                    <p className="text-[13px] text-zinc-700 leading-relaxed">{d.long}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tonalitäten Drucksachen */}
            <section id="tonalitaeten-drucksachen" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
                Tonalitäten — Kleine Anfragen ({DRUCKSACHEN_TONALITAETEN.length})
              </h2>
              <p className="text-[14px] text-zinc-600 leading-relaxed mb-3 max-w-3xl">
                Für Kleine Anfragen verwendet die Plattform ein eigenes, schlankeres Schema (vier
                Klassen), weil ihre rhetorische Form deutlich strukturierter ist als bei
                Plenarreden. Die Tonalität bezieht sich auf die{" "}
                <em>Formulierung der Anfrage</em>, nicht auf das angefragte Thema.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DRUCKSACHEN_TONALITAETEN.map((d) => (
                  <div
                    key={d.slug}
                    id={`tonalitaeten-drucksachen-${d.slug}`}
                    className="bg-white border border-zinc-200/70 rounded-xl p-4 scroll-mt-24 [&:target]:ring-2 [&:target]:ring-zinc-900 [&:target]:border-zinc-900 transition-all"
                  >
                    <h3 className="text-[13px] font-semibold text-zinc-950 mb-1.5">{d.label}</h3>
                    <p className="text-[13px] text-zinc-700 leading-relaxed">{d.long}</p>
                    {d.notMeaning && (
                      <div className="mt-2.5 pt-2.5 border-t border-zinc-100">
                        <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                          Was es nicht bedeutet
                        </div>
                        <p className="text-[12.5px] text-zinc-600 leading-relaxed">
                          {d.notMeaning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Berlin-Hinweis */}
            <div className="text-[12.5px] text-zinc-500 leading-relaxed border-t border-zinc-200 pt-6 mt-8">
              <strong className="text-zinc-700">Berliner Abgeordnetenhaus:</strong> Der Berliner
              Landtags-Bereich nutzt ein eigenes, empirisch entwickeltes Tonalitäts- und
              Typ-Schema (11 Tonalitäten + Typ L). Die Definitionen dafür stehen aktuell in{" "}
              <code className="text-[11.5px] font-mono bg-zinc-100 px-1 rounded">
                docs/methodology-berlin.md
              </code>
              ; eine eigene UI-Glossar-Sektion für Berlin folgt separat.
            </div>

            {/* Footer */}
            <div className="text-[11.5px] text-zinc-400 leading-relaxed border-t border-zinc-200 pt-6 mt-8">
              Klassifikations-Labels sind Stil- und Funktions-Beschreibungen aus der LLM-gestützten
              Analyse — siehe Methodik für Grenzen.
            </div>
          </main>

          {/* Desktop: Sticky-Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <ListTree className="w-3 h-3" strokeWidth={2.25} />
                Auf dieser Seite
              </div>
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TableOfContents() {
  return (
    <nav className="space-y-5 text-[12.5px]">
      {TOC_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            <a href={`#${group.anchor}`} className="hover:text-zinc-700 transition-colors">
              {group.label}
            </a>
          </div>
          <ul className="space-y-0.5 border-l border-zinc-200">
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 hover:text-zinc-950 text-zinc-600 py-1 leading-snug transition-colors"
                >
                  <span className="block font-medium">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
