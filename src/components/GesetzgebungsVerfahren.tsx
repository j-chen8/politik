import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { GesetzgebungsVorgangDetail } from "@/lib/db";

/**
 * Verfahrens-Timeline eines Gesetzgebungsvorgangs (DIP-Vorgangsdaten).
 * Zeigt den amtlichen Beratungsstand + alle Verfahrensschritte
 * (1. Beratung, Ausschuss-Überweisung, Beschlussempfehlung, 2./3. Beratung,
 * Bundesrats-Durchgänge, Verkündung, Inkrafttreten).
 *
 * Neutralität: beratungsstand + Schritt-Bezeichnungen sind das amtliche
 * DIP-Vokabular, unverändert. Farbe codiert nur abgeschlossen/laufend —
 * analog zu den Outcome-Badges der Handzeichen-Votes.
 */

// Terminal-Stände grün/rot/grau, alles Laufende blau — gleiche Palette wie
// die bestehenden Outcome-Badges ("angenommen"/"abgelehnt").
function standClasses(stand: string | null): string {
  const s = (stand ?? "").toLowerCase();
  if (s.includes("verkündet") || s.includes("verabschiedet") || s === "bundesrat hat zugestimmt")
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s.includes("abgelehnt") || s.includes("zustimmung versagt"))
    return "bg-rose-50 text-rose-800 border-rose-200";
  if (s.includes("erledigt") || s.includes("zurückgezogen"))
    return "bg-zinc-100 text-zinc-700 border-zinc-300";
  return "bg-[#1a3e72]/5 text-[#1a3e72] border-[#1a3e72]/25";
}

// Tage seit einem Datum — Seiten sind force-dynamic, wird also pro Request
// frisch berechnet
function daysSince(s: string | null | undefined): number | null {
  if (!s) return null;
  const t = new Date(s.slice(0, 10) + "T00:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

function fmtDate(s: string | null | undefined): string | null {
  if (!s) return null;
  try {
    return new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return s; }
}

// "21/2192" (BT-Drucksache) → interner Link; BT-Plenarprotokoll → Sitzungsseite
function schrittHref(s: { dokumentart: string | null; dokumentnummer: string | null; herausgeber: string | null }, currentDsNr: string): string | null {
  if (s.herausgeber !== "BT" || !s.dokumentnummer) return null;
  if (s.dokumentart === "Drucksache") {
    if (s.dokumentnummer === currentDsNr) return null;
    return `/aktivitaeten/${s.dokumentnummer.replace("/", "-")}`;
  }
  if (s.dokumentart === "Plenarprotokoll") {
    const nr = s.dokumentnummer.split("/")[1];
    return nr ? `/protokolle/sitzung/${nr}` : null;
  }
  return null;
}

// ── 4-Phasen-Makro-Stepper ──────────────────────────────────────────
// Verfassungslogik (Art. 76/77/78/82 GG): Einbringung (inkl. BR-Erst-
// befassung bei Regierungsvorlagen!) → Bundestag (1. Lesung, Ausschuss,
// 2./3. Lesung) → Bundesrat (Durchgang nach Gesetzesbeschluss, ggf.
// Vermittlung) → Verkündung/Inkrafttreten.
// Empirie WP21: Abgelehnte GE haben NIE eine 3. Beratung (§ 83 GO-BT),
// deshalb zählt auch "2. Beratung und Schlussabstimmung" als BT-Abschluss.

type StepState = "done" | "active" | "failed" | "ended" | "pending";

interface MacroStep {
  label: string;
  state: StepState;
  datum: string | null;
  // Binnenphase des aktiven Schritts, z. B. "im Ausschuss" — die meisten
  // laufenden Verfahren stecken innerhalb der Bundestag-Phase
  subLabel?: string;
  // Beginn der Binnenphase → "seit <Datum> · <N> Tage"
  seit?: string | null;
}

function deriveMacroSteps(vorgang: GesetzgebungsVorgangDetail): MacroStep[] {
  const stand = vorgang.beratungsstand ?? "";
  const pos = (names: string[]) =>
    vorgang.schritte.filter((s) => names.includes(s.position));
  const lastDatum = (names: string[]) =>
    pos(names).map((s) => s.datum).filter(Boolean).sort().pop() ?? null;

  const einbringungDatum = lastDatum(["Gesetzentwurf", "Gesetzesantrag"]);
  const btSchluss = pos(["3. Beratung", "2. Beratung und Schlussabstimmung"]);
  const btSchlussDatum = btSchluss.map((s) => s.datum).filter(Boolean).sort().pop() ?? null;
  // BR-Durchgänge VOR dem BT-Gesetzesbeschluss = Einbringungsphase (Art. 76 GG)
  const brNachBt = vorgang.schritte.filter(
    (s) => ["2. Durchgang", "Durchgang", "BR-Sitzung"].includes(s.position) &&
      btSchlussDatum != null && (s.datum ?? "") >= btSchlussDatum
  );
  const verkDatum = vorgang.verkuendung.map((v) => v.verkuendungsdatum).filter(Boolean).sort()[0] ?? null;

  // Welche Phase ist "dran" / wo endete das Verfahren?
  // Index: 0 Eingebracht · 1 Bundestag · 2 Bundesrat · 3 In Kraft
  let active: number;
  let terminal: "failed" | "ended" | null = null;
  if (stand === "Verkündet") {
    active = 4; // alles fertig
  } else if (stand === "Bundesrat hat zugestimmt") {
    active = 3;
  } else if (stand === "Verabschiedet" || stand === "Im Vermittlungsverfahren") {
    active = 2;
  } else if (stand === "Bundesrat hat Zustimmung versagt") {
    active = 2; terminal = "failed";
  } else if (stand === "Abgelehnt") {
    active = 1; terminal = "failed";
  } else if (stand === "Einbringung abgelehnt") {
    active = 0; terminal = "failed";
  } else if (stand === "Für erledigt erklärt" || stand === "Zurückgezogen") {
    active = btSchluss.length > 0 ? 2 : pos(["1. Beratung"]).length > 0 ? 1 : 0;
    terminal = "ended";
  } else if (stand === "Dem Bundesrat zugeleitet - Noch nicht beraten" || stand === "Den Ausschüssen zugewiesen") {
    active = 0; // BR-Erstbefassung / BR-Initiative — noch nicht beim BT
  } else {
    // Überwiesen, Beschlussempfehlung liegt vor, Dem Bundestag zugeleitet,
    // Noch nicht beraten + unbekannte künftige DIP-Stände → BT-Phase als
    // konservativer Default (Positions-Daten korrigieren done-Zustände).
    active = 1;
  }

  const stateFor = (idx: number): StepState => {
    if (idx < active) return "done";
    if (idx === active) return terminal ?? "active";
    return "pending";
  };

  // Binnenphase im Bundestag: 1. Lesung → Ausschuss → 2./3. Lesung.
  // Aus Positions-Fakten abgeleitet, nicht aus beratungsstand-Strings.
  // "seit" = Datum des Ereignisses, das die Binnenphase eröffnet hat.
  let btSub: string | undefined;
  let btSeit: string | null = null;
  if (active === 1 && !terminal) {
    const ersteBeratungDatum = lastDatum(["1. Beratung", "1. Beratung (Gesetzentwurf)"]);
    const beschlussempfehlungDatum = lastDatum(["Beschlussempfehlung und Bericht", "Beschlussempfehlung", "Bericht"]);
    if (!ersteBeratungDatum && pos(["1. Beratung", "1. Beratung (Gesetzentwurf)"]).length === 0) {
      btSub = "vor der 1. Lesung";
      btSeit = einbringungDatum;
    } else if (beschlussempfehlungDatum || pos(["Beschlussempfehlung und Bericht", "Beschlussempfehlung", "Bericht"]).length > 0) {
      btSub = "Beschlussempfehlung liegt vor";
      btSeit = beschlussempfehlungDatum;
    } else {
      btSub = "im Ausschuss";
      btSeit = ersteBeratungDatum; // Überweisung erfolgt in der 1. Beratung
    }
  }
  const brSub = active === 2 && stand === "Im Vermittlungsverfahren" ? "Vermittlungsausschuss" : undefined;

  return [
    { label: "Eingebracht", state: stateFor(0), datum: einbringungDatum },
    { label: "Bundestag", state: stateFor(1), datum: btSchlussDatum, subLabel: btSub, seit: btSeit },
    { label: "Bundesrat", state: stateFor(2), datum: brNachBt.map((s) => s.datum).filter(Boolean).sort().pop() ?? null, subLabel: brSub },
    { label: "In Kraft", state: stateFor(3), datum: verkDatum ?? null },
  ];
}

const STEP_DOT: Record<StepState, string> = {
  done: "bg-zinc-900 border-zinc-900 text-zinc-50",
  active: "bg-[#1a3e72] border-[#1a3e72] text-zinc-50",
  failed: "bg-rose-600 border-rose-600 text-zinc-50",
  ended: "bg-zinc-400 border-zinc-400 text-zinc-50",
  pending: "bg-white border-zinc-300 text-zinc-300",
};

const STEP_LABEL: Record<StepState, string> = {
  done: "text-zinc-950",
  active: "text-[#1a3e72] font-semibold",
  failed: "text-rose-700 font-semibold",
  ended: "text-zinc-500",
  pending: "text-zinc-400",
};

function MacroStepper({ steps }: { steps: MacroStep[] }) {
  return (
    <ol className="flex items-start mb-2">
      {steps.map((s, i) => (
        <li key={s.label} className={`flex-1 flex flex-col items-center relative ${i === 0 ? "" : ""}`}>
          {/* Verbindungslinie zum vorherigen Schritt */}
          {i > 0 && (
            <span
              aria-hidden
              className={`absolute top-[11px] right-1/2 w-full h-[2px] -translate-y-1/2 ${
                s.state === "done" || s.state === "active" || s.state === "failed" || s.state === "ended"
                  ? "bg-zinc-900"
                  : "bg-zinc-200"
              }`}
            />
          )}
          <span
            className={`relative z-10 w-[22px] h-[22px] rounded-full border-2 inline-flex items-center justify-center text-[11px] font-bold ${STEP_DOT[s.state]}`}
          >
            {s.state === "done" ? "✓" : s.state === "failed" ? "✕" : s.state === "ended" ? "–" : i + 1}
          </span>
          <span className={`mt-1.5 text-[11.5px] text-center leading-tight ${STEP_LABEL[s.state]}`}>
            {s.label}
          </span>
          {s.datum && s.state !== "pending" && (
            <span className="num text-[10.5px] text-zinc-400 mt-0.5">{fmtDate(s.datum)}</span>
          )}
          {s.subLabel && (
            <span className="text-[10.5px] text-[#1a3e72] mt-0.5 text-center leading-tight px-1">
              {s.subLabel}
            </span>
          )}
          {s.subLabel && s.seit && (
            <span className="num text-[10px] text-zinc-400 mt-0.5 text-center leading-tight">
              seit {fmtDate(s.seit)}{daysSince(s.seit) !== null && <> · {daysSince(s.seit)} {daysSince(s.seit) === 1 ? "Tag" : "Tage"}</>}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

interface Props {
  vorgang: GesetzgebungsVorgangDetail;
  currentDsNr: string;
}

export function GesetzgebungsVerfahren({ vorgang, currentDsNr }: Props) {
  const standFmt = fmtDate(vorgang.aktualisiert);
  const macroSteps = deriveMacroSteps(vorgang);
  const detailCount =
    vorgang.schritte.length + vorgang.verkuendung.length + vorgang.inkrafttreten.length;

  return (
    <section className="fade-in-up-2 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Gesetzgebungs-Verfahren
        </h2>
        {vorgang.beratungsstand && (
          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded border ${standClasses(vorgang.beratungsstand)}`}>
            {vorgang.beratungsstand}
          </span>
        )}
      </div>
      {vorgang.initiative.length > 0 && (
        <p className="text-[12px] text-zinc-500 leading-snug mb-5">
          Initiative: {vorgang.initiative.join(", ")}
        </p>
      )}

      <MacroStepper steps={macroSteps} />

      {/* Amtliche Schritt-Timeline, eingeklappt — der Stepper trägt die
          Kernaussage, die DIP-Schritte bleiben vollständig nachlesbar */}
      {detailCount > 0 && (
        <details className="group mt-4">
          <summary className="cursor-pointer text-[11.5px] text-zinc-500 hover:text-zinc-700 list-none flex items-center gap-1 w-fit">
            <span className="text-zinc-400 group-open:hidden">▶</span>
            <span className="text-zinc-400 hidden group-open:inline">▼</span>
            Alle {detailCount} amtlichen Verfahrensschritte
          </summary>
          <div className="mt-4">
      {vorgang.schritte.length > 0 && (
        <ol className="relative border-l border-zinc-200 ml-1.5 space-y-4">
          {vorgang.schritte.map((s, i) => {
            const href = schrittHref(s, currentDsNr);
            const datum = fmtDate(s.datum);
            return (
              <li key={i} className="pl-4 relative">
                <span className="absolute -left-[5px] top-[5px] w-2.5 h-2.5 rounded-full bg-white border-2 border-zinc-400" />
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13.5px] font-medium text-zinc-950">{s.position}</span>
                  {s.zuordnung && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600"
                      title={s.zuordnung === "BR" ? "Bundesrat" : s.zuordnung === "BT" ? "Bundestag" : s.zuordnung}
                    >
                      {s.zuordnung}
                    </span>
                  )}
                  {datum && <span className="num text-[11.5px] text-zinc-400 ml-auto">{datum}</span>}
                </div>
                {(href || s.dokumentnummer) && (
                  <div className="text-[12px] text-zinc-500 mt-0.5">
                    {href ? (
                      <Link href={href} className="text-[#1a3e72] hover:text-[#0f2a52] hover:underline underline-offset-2">
                        {s.dokumentart} <span className="num">{s.dokumentnummer}</span>
                      </Link>
                    ) : (
                      <span>
                        {s.dokumentart} <span className="num">{s.dokumentnummer}</span>
                        {s.herausgeber === "BR" && " (Bundesrat)"}
                      </span>
                    )}
                  </div>
                )}
                {s.ausschuesse.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {s.ausschuesse.map((a) => (
                      <span
                        key={a.ausschuss}
                        className={`text-[11px] px-2 py-0.5 rounded-full ${a.federfuehrung ? "bg-zinc-900 text-zinc-50" : "bg-zinc-100 text-zinc-700"}`}
                        title={a.federfuehrung ? "federführender Ausschuss" : "mitberatender Ausschuss"}
                      >
                        {a.ausschuss}
                        {a.federfuehrung && " · federführend"}
                      </span>
                    ))}
                  </div>
                )}
                {s.beschluesse.length > 0 && (
                  <p className="text-[12px] text-zinc-600 mt-1">
                    Beschluss: {s.beschluesse.join(" · ")}
                  </p>
                )}
              </li>
            );
          })}

          {/* Verkündung + Inkrafttreten als Abschluss-Schritte */}
          {vorgang.verkuendung.map((v, i) => (
            <li key={`vk-${i}`} className="pl-4 relative">
              <span className="absolute -left-[5px] top-[5px] w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-500" />
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13.5px] font-medium text-zinc-950">Verkündung</span>
                {fmtDate(v.verkuendungsdatum) && (
                  <span className="num text-[11.5px] text-zinc-400 ml-auto">{fmtDate(v.verkuendungsdatum)}</span>
                )}
              </div>
              {v.fundstelle && (
                <div className="text-[12px] text-zinc-500 mt-0.5">
                  {v.pdf_url ? (
                    <a href={v.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[#1a3e72] hover:text-[#0f2a52] hover:underline underline-offset-2 inline-flex items-center gap-1">
                      {v.fundstelle}
                      <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    </a>
                  ) : (
                    v.fundstelle
                  )}
                </div>
              )}
            </li>
          ))}
          {vorgang.inkrafttreten.map((ik, i) => (
            <li key={`ik-${i}`} className="pl-4 relative">
              <span className="absolute -left-[5px] top-[5px] w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-500" />
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13.5px] font-medium text-zinc-950">Inkrafttreten</span>
                <span className="num text-[11.5px] text-zinc-400 ml-auto">{fmtDate(ik.datum)}</span>
              </div>
              {ik.erlaeuterung && (
                <p className="text-[12px] text-zinc-500 mt-0.5">{ik.erlaeuterung}</p>
              )}
            </li>
          ))}
        </ol>
      )}
          </div>
        </details>
      )}

      <div className="mt-6 pt-4 border-t border-zinc-100 text-[11px] text-zinc-400 leading-relaxed">
        {vorgang.zustimmungsbeduerftigkeit.length > 0 && (
          <p className="mb-1">Zustimmungsbedürftigkeit (Bundesrat): {vorgang.zustimmungsbeduerftigkeit.join(" · ")}</p>
        )}
        <p>
          Amtliche Verfahrensdaten aus dem Dokumentations- und Informationssystem
          des Bundestags (DIP){standFmt ? <> · Stand: <span className="num">{standFmt}</span></> : null}
        </p>
      </div>
    </section>
  );
}
