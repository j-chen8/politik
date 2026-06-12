import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowLeft, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getInstrumentCountsForFields, getInstrumentCountsForThema, getThemaKeywordShare } from "@/lib/db";
import { CITIZEN_TOPICS, TIER_STYLE } from "@/lib/citizen-topics";

export const metadata = {
  title: "Wo Aufmerksamkeit und Sorge auseinanderlaufen | Politik-Radar",
  description:
    "Vergleich: Wie sehr ein Thema die Menschen umtreibt (Umfragen) gegenüber dem, was der Bundestag dazu tatsächlich beschließt (Gesetzgebung) — nicht bloßes Anfrage-Volumen.",
};

function fmtNum(x: number): string {
  return x.toLocaleString("de-DE");
}

export default function DivergenzPage() {
  // Salienz-Rang = Reihenfolge in CITIZEN_TOPICS (umfrage-getreu, über die Wahlperiode).
  const base = CITIZEN_TOPICS.map((t, i) => {
    const instr = t.themaMatch
      ? getInstrumentCountsForThema(t.themaMatch)
      : getInstrumentCountsForFields(t.awFields ?? []);
    return { ...t, salienceRank: i + 1, ...instr };
  });

  // Rang nach GESETZGEBUNG (Handeln), nicht nach rohem Volumen.
  const byHandeln = [...base].sort((a, b) => b.handeln - a.handeln);
  const handelnRank = new Map(byHandeln.map((t, i) => [t.slug, i + 1]));

  const rows = base
    .map((t) => {
      const hr = handelnRank.get(t.slug)!;
      return { ...t, handelnRank: hr, gap: hr - t.salienceRank };
    })
    .sort((a, b) => a.salienceRank - b.salienceRank); // eine klare Achse: Bürger-Sorge

  const rente = getThemaKeywordShare("Rente");
  const rentePct = ((rente.hits / rente.total) * 100).toFixed(1).replace(".", ",");

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-20 pb-24 fade-in-up">
        <Link
          href="/themen"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-[#1a3e72] transition-colors mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zu den Themen
        </Link>

        <header className="mb-7 max-w-2xl">
          <h1 className="text-[24px] sm:text-[28px] font-semibold text-zinc-950 leading-tight">
            Wo Aufmerksamkeit und Sorge auseinanderlaufen
          </h1>
          <p className="mt-3 text-[14px] text-zinc-600 leading-relaxed">
            Wie sehr ein Thema die <strong>Menschen umtreibt</strong> (Umfragen, Durchschnitt über die
            Wahlperiode) gegenüber dem, was der Bundestag dazu <strong>tatsächlich beschließt</strong>{" "}
            — gemessen an Gesetzgebung (Gesetzentwürfe + Beschlüsse), nicht an bloßen Anfragen. Denn
            zwei Drittel aller Drucksachen sind Kleine Anfragen — ein Kontroll-Instrument, kein
            Handeln. Sortiert nach Bürger-Sorge.
          </p>
        </header>

        <div className="space-y-2.5">
          {rows.map((t) => {
            const blindspot = t.gap >= 2; // mehr Sorge als Gesetzgebung
            const heavy = t.gap <= -2; // mehr Gesetzgebung als Sorge
            const Icon = blindspot ? ArrowUp : heavy ? ArrowDown : Minus;
            const tone = blindspot
              ? "text-amber-700 bg-amber-50 ring-amber-200"
              : heavy
                ? "text-[#1a3e72] bg-[#1a3e72]/8 ring-[#1a3e72]/20"
                : "text-zinc-500 bg-zinc-50 ring-zinc-200";
            // Kontroll-Kontext: viel Aufmerksamkeit (Anfragen) trotz wenig Gesetzgebung
            const kontrollLastig = blindspot && t.kontrolle >= t.handeln * 3 && t.kontrolle >= 100;
            return (
              <div key={t.slug} className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/themen/${t.slug}`}
                      className="text-[14.5px] font-semibold text-zinc-950 hover:text-[#1a3e72] transition-colors truncate"
                    >
                      {t.label}
                    </Link>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_STYLE[t.tier]}`}
                    >
                      {t.tier}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tone}`}
                  >
                    <Icon className="w-3 h-3" />
                    {blindspot ? "mehr Sorge" : heavy ? "mehr Gesetzgebung" : "im Gleichgewicht"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-zinc-400 text-[10px] uppercase tracking-wide">Bürger-Sorge</div>
                    <div className="text-zinc-700 mt-0.5">
                      {t.tier} <span className="text-zinc-400">· #{t.salienceRank}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-zinc-400 text-[10px] uppercase tracking-wide">Gesetzgebung</div>
                    <div className="text-zinc-700 mt-0.5">
                      {fmtNum(t.handeln)} <span className="text-zinc-400">· #{t.handelnRank}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-zinc-400 text-[10px] uppercase tracking-wide">Anfragen</div>
                    <div className="text-zinc-700 mt-0.5">{fmtNum(t.kontrolle)}</div>
                  </div>
                </div>

                {kontrollLastig && (
                  <p className="mt-2 text-[11.5px] text-zinc-500">
                    <span className="font-medium text-zinc-600">Einordnung:</span> Viel Aufmerksamkeit
                    ({fmtNum(t.kontrolle)} Anfragen), aber wenig Gesetzgebung ({fmtNum(t.handeln)}) —
                    das Thema wird stark hinterfragt, kaum in Gesetze überführt.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Schärfster Einzelfall: Rente */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
          <h2 className="text-[14.5px] font-semibold text-zinc-950">Der schärfste Einzelfall: die Rente</h2>
          <p className="mt-1.5 text-[12.5px] text-zinc-600 leading-relaxed">
            Im Schnitt der Wahlperiode nennen rund jede:r Zehnte (Ø&nbsp;10,8&nbsp;%) die Rente als
            wichtigstes Problem. Im Bundestag berühren sie aber nur <strong>{rente.hits}</strong> von{" "}
            {fmtNum(rente.total)} Drucksachen (<strong>{rentePct}&nbsp;%</strong>) — und davon ist nur
            ein Bruchteil Gesetzgebung. Die Rente hat kein eigenes Politikfeld in unserer
            Klassifikation (sie steckt in „Soziale Sicherung"), daher misst dieser Wert die feinere
            Stichwort-Ebene (Untergrenze).
          </p>
        </div>

        <footer className="mt-8 max-w-2xl space-y-2 text-[11.5px] text-zinc-400 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-500">Warum Gesetzgebung statt Volumen?</span> Rund
            zwei Drittel aller Drucksachen sind Kleine Anfragen — ein Kontroll-Werkzeug, das fast nur
            die Opposition nutzt. Sie zu zählen würde „Handeln" mit „Nachfragen" verwechseln. Deshalb
            vergleichen wir die Sorge mit der <em>Gesetzgebung</em> (Gesetzentwürfe + Beschlüsse) und
            weisen Anfragen getrennt als Aufmerksamkeit aus.
          </p>
          <p>
            <span className="font-medium text-zinc-500">Vorbehalte.</span> Politik reagiert mit Verzug
            — wenig Gesetzgebung heute kann morgen kommen. Nicht jede Sorge ist Bundessache (Wohnen =
            Länder, Inflation = EZB/global). Und „Sorge" (Umfrage-Anteil) und „Gesetzgebung" (Anzahl)
            sind zwei verschiedene Maße — der Vergleich zeigt Tendenzen, kein Urteil. Salienz-Methodik:{" "}
            <code>docs/umfrage-salienz.md</code>.
          </p>
        </footer>
      </div>
    </div>
  );
}
