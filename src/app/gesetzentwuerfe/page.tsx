import { getLaufendeGesetzentwuerfe, type LaufenderGesetzentwurf } from "@/lib/db";
import Link from "next/link";
import { Scale } from "lucide-react";

/**
 * Alle Gesetzentwürfe, über die der Bundestag noch nicht abgestimmt hat —
 * gruppiert nach Binnenphase (vor 1. Lesung / im Ausschuss / wartet auf
 * 2./3. Lesung), innerhalb der Gruppen die am längsten liegenden zuerst.
 * Daten: amtliche DIP-Vorgangsdaten (DATA-SOURCES.md §2.3b).
 */

export const metadata = {
  title: "Gesetzentwürfe in Beratung | Politik-Radar",
  description:
    "Alle Gesetzentwürfe der 21. Wahlperiode, über die der Bundestag noch nicht abgestimmt hat — mit Verfahrensphase und Wartezeit.",
};

const PHASEN: {
  key: LaufenderGesetzentwurf["phase"];
  titel: string;
  beschreibung: string;
}[] = [
  {
    key: "beschlussempfehlung",
    titel: "Beschlussempfehlung liegt vor",
    beschreibung:
      "Der Ausschuss ist fertig — die Abstimmung in der 2./3. Lesung kann angesetzt werden.",
  },
  {
    key: "im_ausschuss",
    titel: "Im Ausschuss",
    beschreibung:
      "Nach der 1. Lesung an die Ausschüsse überwiesen. Eine Frist für die Beratung gibt es nicht.",
  },
  {
    key: "vor_erster_lesung",
    titel: "Vor der 1. Lesung",
    beschreibung: "Eingebracht, aber noch nicht im Plenum beraten.",
  },
];

function daysSince(s: string | null): number | null {
  if (!s) return null;
  const t = new Date(s.slice(0, 10) + "T00:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

function fmtDate(s: string | null): string | null {
  if (!s) return null;
  try {
    return new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return s; }
}

// Initiative-Strings ("Fraktion der CDU/CSU", "Bundesregierung") → Punkt-Farbe,
// gleiche Palette wie die Drucksachen-Detailseite
const INITIATIVE_COLORS: [string, string][] = [
  ["SPD", "#E3000F"],
  ["CDU/CSU", "#1F1F1F"],
  ["GRÜNEN", "#46962b"],
  ["AfD", "#009EE0"],
  ["Linke", "#BE3075"],
  ["LINKE", "#BE3075"],
  ["BSW", "#722F87"],
  ["Bundesregierung", "#1F1F1F"],
  ["Bundesrat", "#71717a"],
];

function initiativeColor(initiative: string[]): string {
  const s = initiative.join(" ");
  for (const [needle, color] of INITIATIVE_COLORS) {
    if (s.includes(needle)) return color;
  }
  return "#71717a";
}

// "Fraktion der CDU/CSU" → "CDU/CSU"; Mehrfach-Initiativen kommagetrennt
function initiativeLabel(initiative: string[]): string {
  return initiative
    .map((s) => s.replace(/^Fraktion (der |die |DIE )?/i, "").trim())
    .join(", ");
}

export default function GesetzentwuerfePage() {
  const alle = getLaufendeGesetzentwuerfe();

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-12 fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">
            Gesetzentwürfe in Beratung
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="num text-[15px] text-zinc-950 font-medium">
              {alle.length.toLocaleString("de-DE")}
            </span>
            <span className="text-[13px] text-zinc-500">
              Gesetzentwürfe, über die der Bundestag noch nicht abgestimmt hat · 21. Wahlperiode
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-zinc-400">
            Amtliche Verfahrensdaten aus dem Dokumentations- und Informationssystem
            des Bundestags (DIP). Wartezeit = Tage seit dem Ereignis, das die
            aktuelle Phase eröffnet hat.
          </p>
        </div>

        {/* Phasen-Übersicht */}
        <div className="mb-10 flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
          {PHASEN.map((p) => {
            const n = alle.filter((g) => g.phase === p.key).length;
            return (
              <div key={p.key} className="inline-flex items-baseline gap-1.5">
                <span className="num font-semibold text-zinc-950">{n}</span>
                <span className="text-zinc-500">{p.titel}</span>
              </div>
            );
          })}
        </div>

        {PHASEN.map((phase) => {
          const gruppe = alle
            .filter((g) => g.phase === phase.key)
            .sort((a, b) => (a.seitDatum ?? "9999") < (b.seitDatum ?? "9999") ? -1 : 1);
          if (gruppe.length === 0) return null;

          return (
            <section key={phase.key} className="mb-10">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-[15px] font-semibold text-zinc-950 tracking-tight">
                  {phase.titel}
                </h2>
                <span className="num text-[12px] text-zinc-400">{gruppe.length}</span>
              </div>
              <p className="text-[12px] text-zinc-500 mb-4">{phase.beschreibung}</p>

              <div className="space-y-1.5">
                {gruppe.map((g) => {
                  const tage = daysSince(g.seitDatum);
                  const label = initiativeLabel(g.initiative);
                  return (
                    <Link
                      key={g.drucksache_nr}
                      href={`/aktivitaeten/${g.drucksache_nr.replace("/", "-")}`}
                      className="card-hover bg-white rounded-xl border border-zinc-200/70 p-4 block"
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200/70 flex items-center justify-center shrink-0 mt-0.5">
                          <Scale className="w-3.5 h-3.5 text-zinc-700" strokeWidth={2.25} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap mb-1">
                            <span className="num text-[11px] font-mono font-semibold text-zinc-950">
                              {g.drucksache_nr}
                            </span>
                            {label && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                                <span
                                  className="inline-block w-2 h-2 rounded-full"
                                  style={{ background: initiativeColor(g.initiative) }}
                                />
                                {label}
                              </span>
                            )}
                          </div>
                          <p className="text-[14px] font-semibold text-zinc-950 leading-snug mb-1.5 line-clamp-2">
                            {g.titel ?? "Gesetzentwurf"}
                          </p>
                          <div className="flex items-center gap-2 text-[11.5px] text-zinc-400 flex-wrap num">
                            {g.einbringungDatum && (
                              <span>eingebracht {fmtDate(g.einbringungDatum)}</span>
                            )}
                            {g.federfuehrenderAusschuss && phase.key !== "vor_erster_lesung" && (
                              <>
                                <span className="text-zinc-200">·</span>
                                <span className="text-zinc-600">
                                  federführend: {g.federfuehrenderAusschuss}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {tage !== null && (
                          <div className="shrink-0 text-right self-center pl-2">
                            <div className="num text-[20px] font-semibold text-zinc-950 leading-none">
                              {tage}
                            </div>
                            <div className="text-[10.5px] text-zinc-400 mt-0.5">
                              {tage === 1 ? "Tag" : "Tage"}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        <p className="text-[11.5px] text-zinc-400 leading-relaxed max-w-2xl">
          Ausschüsse haben keine Frist, eine Vorlage abzuschließen — Entwürfe
          können dort beliebig lange liegen. Die Wartezeit ist eine reine
          Tageszählung ohne Wertung. Von dieser Liste verschwindet ein Entwurf,
          wenn der Bundestag über ihn abstimmt — oder ohne Abstimmung, wenn er
          zurückgezogen oder für erledigt erklärt wird (etwa weil ein
          inhaltsgleicher Entwurf beschlossen wurde). Alle übrigen Vorlagen
          verfallen am Ende der Wahlperiode automatisch (Diskontinuität). Das
          jeweilige Ergebnis steht auf der Drucksachen-Seite des Entwurfs.
        </p>
      </div>
    </div>
  );
}
