import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowLeft, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  getDrucksacheCountForFields,
  getFieldFraktionBreakdown,
  getThemaKeywordShare,
} from "@/lib/db";
import { CITIZEN_TOPICS, TIER_STYLE, bucketizeBreakdown } from "@/lib/citizen-topics";

export const metadata = {
  title: "Wo Aufmerksamkeit und Sorge auseinanderlaufen | Politik-Radar",
  description:
    "Vergleich: Wie sehr ein Thema die Menschen umtreibt (Umfragen) gegenüber dem Volumen, das der Bundestag dazu einbringt — und wer dieses Volumen treibt.",
};

function fmtNum(x: number): string {
  return x.toLocaleString("de-DE");
}

export default function DivergenzPage() {
  // Salienz-Rang = Reihenfolge in CITIZEN_TOPICS (bereits umfrage-getreu sortiert).
  const base = CITIZEN_TOPICS.map((t, i) => {
    const volume = getDrucksacheCountForFields(t.awFields);
    const { buckets, total } = bucketizeBreakdown(getFieldFraktionBreakdown(t.awFields));
    const oppositionShare = total > 0 ? buckets.Opposition / total : 0;
    const ohneShare = total > 0 ? buckets["ohne Angabe"] / total : 0;
    return { ...t, salienceRank: i + 1, volume, oppositionShare, ohneShare };
  });

  // Volumen-Rang
  const byVol = [...base].sort((a, b) => b.volume - a.volume);
  const volRank = new Map(byVol.map((t, i) => [t.slug, i + 1]));

  const rows = base
    .map((t) => {
      const vr = volRank.get(t.slug)!;
      return { ...t, volumeRank: vr, gap: vr - t.salienceRank };
    })
    // Größte Divergenz zuerst: erst Blindflecken (Sorge > Volumen), dann ausgeglichen, dann Volumen-lastig
    .sort((a, b) => b.gap - a.gap);

  const rente = getThemaKeywordShare("Rente");
  const rentePct = ((rente.hits / rente.total) * 100).toFixed(1).replace(".", ",");

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-12 fade-in-up">
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
            Zwei Blickwinkel auf dasselbe Thema: Wie sehr es die <strong>Menschen umtreibt</strong>{" "}
            (laut Umfragen) und wie viel der <strong>Bundestag dazu einbringt</strong> (Anzahl der
            Drucksachen). Beides ist nicht dasselbe — und manchmal liegt es weit auseinander.
          </p>
        </header>

        <div className="space-y-2.5">
          {rows.map((t) => {
            const blindspot = t.gap >= 2; // mehr Sorge als Volumen
            const heavy = t.gap <= -2; // mehr Volumen als Sorge
            const Icon = blindspot ? ArrowUp : heavy ? ArrowDown : Minus;
            const tone = blindspot
              ? "text-amber-700 bg-amber-50 ring-amber-200"
              : heavy
                ? "text-[#1a3e72] bg-[#1a3e72]/8 ring-[#1a3e72]/20"
                : "text-zinc-500 bg-zinc-50 ring-zinc-200";
            // Entzerrung: Volumen-lastige Themen, deren Volumen klar oppositionsgetrieben ist
            const oppNote =
              heavy && t.oppositionShare >= 0.35
                ? `Volumen überwiegend aus Oppositionsanträgen (${Math.round(t.oppositionShare * 100)} %)`
                : heavy && t.ohneShare >= 0.35
                  ? `Volumen großteils ohne klare Fraktionszuordnung (${Math.round(t.ohneShare * 100)} %)`
                  : null;
            return (
              <div
                key={t.slug}
                className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-4"
              >
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
                    {blindspot ? "mehr Sorge" : heavy ? "mehr Volumen" : "im Gleichgewicht"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-zinc-400 text-[10.5px] uppercase tracking-wide">
                      Sorge der Bürger:innen
                    </div>
                    <div className="text-zinc-700 mt-0.5">
                      {t.tier} <span className="text-zinc-400">· Rang {t.salienceRank}/12</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="text-zinc-400 text-[10.5px] uppercase tracking-wide">
                      Initiativen im Bundestag
                    </div>
                    <div className="text-zinc-700 mt-0.5">
                      {fmtNum(t.volume)} <span className="text-zinc-400">· Rang {t.volumeRank}/12</span>
                    </div>
                  </div>
                </div>

                {oppNote && (
                  <p className="mt-2 text-[11.5px] text-zinc-500">
                    <span className="font-medium text-zinc-600">Einordnung:</span> {oppNote} — viel
                    Volumen heißt hier nicht „Priorität des Parlaments", sondern oft abgelehnte
                    Anträge der Opposition.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Schärfster Einzelfall: Rente (kein eigenes Politikfeld → feinere Ebene) */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
          <h2 className="text-[14.5px] font-semibold text-zinc-950">
            Der schärfste Einzelfall: die Rente
          </h2>
          <p className="mt-1.5 text-[12.5px] text-zinc-600 leading-relaxed">
            In Umfragen nennen rund jede:r Zehnte die Rente als wichtigstes Problem. Im Bundestag
            berühren sie aber nur <strong>{rente.hits}</strong> von {fmtNum(rente.total)} Drucksachen
            (<strong>{rentePct}&nbsp;%</strong>). Die Rente hat kein eigenes Politikfeld in unserer
            Klassifikation — sie steckt in „Soziale Sicherung" — deshalb misst dieser Wert die feinere
            Stichwort-Ebene (Untergrenze).
          </p>
        </div>

        <footer className="mt-8 max-w-2xl space-y-2 text-[11.5px] text-zinc-400 leading-relaxed">
          <p>
            <span className="font-medium text-zinc-500">Wichtig zur Einordnung.</span> „Volumen" zählt
            eingebrachte Drucksachen — nicht, was beschlossen oder priorisiert wird. Wer viele Anträge
            stellt (oft die Opposition), erzeugt viel Volumen, auch wenn die Anträge abgelehnt werden.
            Vieles geschieht zudem außerhalb zählbarer Drucksachen (Haushaltsgesetz, Ministerien).
            „Sorge" und „Volumen" sind zwei verschiedene Maße — der Vergleich zeigt Tendenzen, keine
            exakte Bilanz.
          </p>
          <p>
            Salienz-Quellen &amp; Methodik: <code>docs/umfrage-salienz.md</code> · offene vs.
            vorgegebene Umfragen ergeben unterschiedliche Rangfolgen; gezeigt wird der Konsens.
          </p>
        </footer>
      </div>
    </div>
  );
}
