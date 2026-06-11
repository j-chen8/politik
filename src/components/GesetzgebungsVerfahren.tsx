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

interface Props {
  vorgang: GesetzgebungsVorgangDetail;
  currentDsNr: string;
}

export function GesetzgebungsVerfahren({ vorgang, currentDsNr }: Props) {
  const standFmt = fmtDate(vorgang.aktualisiert);

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

      {/* Schritt-Timeline */}
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
