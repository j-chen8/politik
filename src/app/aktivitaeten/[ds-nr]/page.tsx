import {
  getDrucksacheDetail,
  getDrucksacheSkeleton,
  getMitzeichnerForDrucksache,
  getBerichterstatterForDrucksache,
  getRelatedSpeechesForDrucksache,
  getDrucksacheVerfahren,
  getDrucksacheThemenAehnliche,
  getDrucksachenSameFraktion,
  getPollsForDrucksache,
  getBundestagDsHandzeichenVotes,
  getVotesReferencingDs,
  getPlenarContextForDs,
  getDsParsedDetails,
  getDrucksacheQaPaare,
  getGesetzgebungsVorgang,
  type DrucksacheDetail,
  type MitzeichnerRow,
  type RelatedSpeechRow,
  type RelatedDsRow,
  type DsPollRow,
  type BundestagDsHandzeichenVote,
  type DsVoteSummary,
  type DsPlenarContext,
  type DsParsedDetails,
} from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Mic, MessageSquare } from "lucide-react";
import { DrucksacheTonalityBadge } from "@/components/TonalityBadge";
import { positionZumAntrag, POSITION_META } from "@/lib/vote-position";
import { GesetzgebungsVerfahren } from "@/components/GesetzgebungsVerfahren";

interface Props {
  params: Promise<{ "ds-nr": string }>;
}

// "21-3619" → "21/3619"
function slugToDsNr(slug: string): string {
  const idx = slug.indexOf("-");
  if (idx < 0) return slug;
  return slug.slice(0, idx) + "/" + slug.slice(idx + 1);
}


const klasseLabelMap: Record<string, string> = {
  klein: "Kleine Anfrage",
  mittel: "Bericht / Beschlussempfehlung",
  gross: "Gesetzentwurf / Große Anfrage",
  antwort: "Antwort der Bundesregierung",
  regierung: "Regierungs-Drucksache",
};

/**
 * Wandelt batch_class + dokumenttyp in einen bürgerverständlichen
 * Cover-Headline um (2 Zeilen max, ALL CAPS).
 *
 * Beispiele:
 *   klein + "Kleine Anfrage" → "KLEINE / ANFRAGE"
 *   gross + "Gesetzentwurf"  → "GESETZ- / ENTWURF"
 *   antwort + null           → "ANTWORT der / BUNDESREGIERUNG"
 *   mittel + "Unterrichtung" → "UNTER- / RICHTUNG"
 */
function coverHeadline(batchClass: string, dokumenttyp: string | null, fraktion: string | null): { line1: string; line2: string } {
  const t = (dokumenttyp ?? "").trim().toLowerCase();

  // Amtlicher DIP-Typ (dokumenttyp) ist maßgeblich; batch_class ist nur ein
  // Längen-/Verarbeitungs-Tier (klein/mittel/gross/…) und dient bloß als Fallback,
  // falls dokumenttyp fehlt. Reihenfolge wichtig: Entschließungs-/Änderungsantrag
  // VOR dem generischen "antrag", Beschlussempfehlung VOR "bericht".
  if (t) {
    if (t.includes("kleine anfrage")) return { line1: "KLEINE", line2: "ANFRAGE" };
    if (t.includes("große anfrage") || t.includes("grosse anfrage")) return { line1: "GROSSE", line2: "ANFRAGE" };
    if (t.includes("entschließung") || t.includes("entschliessung")) return { line1: "ENTSCHLIESSUNGS-", line2: "ANTRAG" };
    if (t.includes("änderung") || t.includes("aenderung")) return { line1: "ÄNDERUNGS-", line2: "ANTRAG" };
    if (t.includes("antrag")) return { line1: "ANTRAG", line2: "" };
    if (t.includes("gesetz")) return { line1: "GESETZ-", line2: "ENTWURF" };
    if (t.includes("verordnung")) return { line1: "VER-", line2: "ORDNUNG" };
    if (t.includes("unterrichtung")) return { line1: "UNTER-", line2: "RICHTUNG" };
    if (t.includes("beschlussempfehlung") || t.includes("empfehlung")) return { line1: "BESCHLUSS-", line2: "EMPFEHLUNG" };
    if (t.includes("bericht")) return { line1: "BERICHT", line2: "" };
    if (t.includes("wahlvorschlag")) return { line1: "WAHL-", line2: "VORSCHLAG" };
    if (t.includes("antwort")) return { line1: "ANTWORT der", line2: "BUNDESREGIERUNG" };
    if (t.includes("schriftlich") || t.includes("fragestunde") || t === "fragen") return { line1: "SCHRIFTL.", line2: "FRAGEN" };
  }

  // Fallback: kein/unbekannter dokumenttyp → batch_class-Tier
  if (batchClass === "antwort") return { line1: "ANTWORT der", line2: "BUNDESREGIERUNG" };
  if (batchClass === "klein") return { line1: "KLEINE", line2: "ANFRAGE" };
  if (batchClass === "gross") return { line1: "GESETZ-", line2: "ENTWURF" };
  if (batchClass === "mittel") return { line1: "BERICHT", line2: "" };
  if (batchClass === "administrativ") return { line1: "BESCHLUSS-", line2: "EMPFEHLUNG" };
  if (batchClass === "regierung") return { line1: "REGIERUNGS-", line2: "DOKUMENT" };
  return { line1: "DRUCK-", line2: "SACHE" };
}

// Partei-Farben (Hex von Memory)
const partyColorMap: Record<string, string> = {
  "SPD": "#E3000F",
  "CDU/CSU": "#1F1F1F",
  "CDU": "#1F1F1F",
  "CSU": "#1F1F1F",
  "BÜNDNIS 90/DIE GRÜNEN": "#46962b",
  "Bündnis 90/Die Grünen": "#46962b",
  "AfD": "#009EE0",
  "Die Linke": "#BE3075",
  "Linke": "#BE3075",
  "DIE LINKE": "#BE3075",
  "FDP": "#FFED00",
  "BSW": "#722F87",
  "Bundesregierung": "#1F1F1F",
  "fraktionslos": "#71717a",
};

function partyColor(label: string | null | undefined): string {
  if (!label) return "#71717a";
  return partyColorMap[label] ?? "#71717a";
}

// Kerninhalt-Bullet-Type-Annotation (heuristisch, klassen-aware)
function bulletType(s: string, batchClass: string): string {
  const t = s.toLowerCase();
  // Explizite Patterns gewinnen immer
  if (t.endsWith("?") || t.startsWith("wie ") || t.startsWith("welche ") || t.startsWith("warum ") || t.startsWith("wer ") || t.startsWith("ob ") || t.startsWith("inwiefern")) return "FRAGE";
  if (/\b(fordert|verlangt|verlangen|fordern|sollen?|muss|müssen)\b/.test(t)) return "FORDERUNG";
  // Klassen-Default
  if (batchClass === "klein") return "FRAGE";        // Kleine Anfragen sind per se Fragen
  if (batchClass === "antwort") return "BEFUND";     // BReg-Antwort = Befund
  if (batchClass === "mittel") return "BEFUND";      // Bericht / Empfehlung
  if (batchClass === "gross") return "REGELUNG";     // Gesetz
  return "PUNKT";
}

const bulletTypeColor: Record<string, string> = {
  FRAGE:     "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
  FORDERUNG: "text-orange-800 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30",
  BEFUND:    "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
  REGELUNG:  "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
  PUNKT:     "text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800",
};

function formatDate(s: string | null): string | null {
  if (!s) return null;
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return s; }
}

export default async function DrucksacheDetailPage({ params }: Props) {
  const { "ds-nr": slug } = await params;
  const dsNr = slugToDsNr(slug);
  const ds = getDrucksacheDetail(dsNr);
  if (!ds) {
    // Fallback: DS ist in `activities` (DIP), aber Drucksachen-Pipeline noch
    // nicht durch (PDF kam später, oder Analyse pending). Minimal-Page mit
    // dem rendern was wir haben — verhindert 404 für frische DS-Nrn.
    const skeleton = getDrucksacheSkeleton(dsNr);
    if (!skeleton) notFound();
    const mitzeichner = getMitzeichnerForDrucksache(dsNr);
    const berichterstatter = getBerichterstatterForDrucksache(dsNr);
    const referencingVotes = getVotesReferencingDs(dsNr);
    const plenarContext = getPlenarContextForDs(dsNr, skeleton.titel);
    const parsedDetails = getDsParsedDetails(dsNr);
    const gesetzgebung = getGesetzgebungsVorgang(dsNr);
    return renderSkeletonPage(skeleton, mitzeichner, berichterstatter, referencingVotes, plenarContext, parsedDetails, gesetzgebung);
  }

  const mitzeichner = getMitzeichnerForDrucksache(dsNr);
  const berichterstatter = getBerichterstatterForDrucksache(dsNr);
  const qaPaare = getDrucksacheQaPaare(dsNr);
  const relatedSpeechesRaw = getRelatedSpeechesForDrucksache(dsNr);
  // Reine Schriftliche-Fragen-Sammeldrucksache: nur die Fragen sind als Einzel-
  // Themen erfassbar; die Antwort-Texte liegen nur im Original-PDF. Antwort-
  // Metadaten-Einträge (ohne Text) raus, damit der Titel nicht Antworten verspricht.
  const relatedAllSchriftlich =
    relatedSpeechesRaw.length > 0 && relatedSpeechesRaw.every((r) => r.istSchriftlich);
  const relatedSpeeches = relatedAllSchriftlich
    ? relatedSpeechesRaw.filter((r) => r.aktivitaetsart !== "Antwort")
    : relatedSpeechesRaw;
  const verfahren = getDrucksacheVerfahren(dsNr);
  const themenAehnliche = getDrucksacheThemenAehnliche(dsNr, ds.thema.join(", "), 6);
  const polls = getPollsForDrucksache(dsNr);
  const handzeichenVotes = getBundestagDsHandzeichenVotes(dsNr);
  // Parsed-Details: für Petitions-Sammelübersichten mit Boilerplate-Analyse
  // ist der PDF-Parser-Output deutlich aussagekräftiger als die existierende
  // zusammenfassung — wir zeigen ihn deshalb auch auf der vollen Detail-Seite.
  const parsedDetails = getDsParsedDetails(dsNr);
  // Gesetzgebungs-Verfahren (DIP): greift für Gesetzentwürfe UND alle weiteren
  // DS eines Gesetzgebungsvorgangs (Beschlussempfehlung, Bericht, …)
  const gesetzgebung = getGesetzgebungsVorgang(dsNr);
  // Nur Parteien zählen — "Bundesregierung" und null ausschließen, sonst macht "andere DS der Fraktion" keinen Sinn
  const isParty = ds.fraktion && ds.fraktion !== "Bundesregierung";
  const sameFraktion = isParty
    ? getDrucksachenSameFraktion(dsNr, ds.fraktion!, ds.thema.join(", "), 6)
    : [];

  // Mitzeichner: Fraktionsverteilung
  const fraktionCounts = new Map<string, number>();
  for (const m of mitzeichner) {
    const k = m.party_label ?? "fraktionslos";
    fraktionCounts.set(k, (fraktionCounts.get(k) ?? 0) + 1);
  }
  const fraktionList = Array.from(fraktionCounts.entries()).sort((a, b) => b[1] - a[1]);
  const mitzTotal = mitzeichner.length;

  // Amtlicher DIP-Typ (dokumenttyp) zuerst; klasseLabelMap[batch_class] nur Fallback.
  const klasseLabel = (ds.dokumenttyp?.trim() || klasseLabelMap[ds.batch_class]) ?? ds.batch_class;
  const datumFormatted = formatDate(ds.datum);
  const dsNrPart1 = dsNr.split("/")[0];
  const dsNrPart2 = dsNr.split("/")[1];

  // Wer ist der Hauptträger? Erst Fraktion-Feld, dann größte Mitzeichner-Fraktion, dann Bundesregierung bei Klassen antwort/regierung
  const tragendeFraktion = ds.fraktion ?? (fraktionList[0]?.[0] ?? (ds.batch_class === "antwort" || ds.batch_class === "regierung" ? "Bundesregierung" : null));

  return (
    <main className="page-wash min-h-screen">
      <div className="page-shell">
        {/* Breadcrumb */}
        <Link
          href="/aktivitaeten"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Aktivitäten
        </Link>

        {/* HERO — Cover + Title-Block. Auf Mobile stacked, ab sm side-by-side. */}
        <div className="fade-in-up flex flex-col sm:grid sm:grid-cols-[180px_1fr] gap-6 sm:gap-8 mb-10">
          {/* Stylized Document-Type Cover */}
          {(() => {
            const cover = coverHeadline(ds.batch_class, ds.dokumenttyp, tragendeFraktion);
            return (
              <div
                className="rounded-xl border-2 border-zinc-900 dark:border-zinc-100 flex flex-col justify-between p-4 aspect-[2/2.7] text-zinc-50 w-[140px] sm:w-auto self-start"
                style={{
                  background: `linear-gradient(135deg, ${partyColor(tragendeFraktion)} 0%, ${partyColor(tragendeFraktion)}cc 60%, #18181b 100%)`,
                }}
              >
                <div className="font-bold uppercase tracking-tight leading-[0.95]">
                  <div className={cover.line1.length > 11 ? "text-[15px]" : "text-[20px]"}>{cover.line1}</div>
                  {cover.line2 && (
                    <div className={cover.line2.length > 12 ? "text-[14px] mt-0.5" : "text-[20px] mt-0.5"}>{cover.line2}</div>
                  )}
                </div>
                <div className="num font-mono tracking-tight text-center">
                  <div className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">
                    <span title="Drucksache-Nummer: offizielles Aktenzeichen. Wahlperiode/laufende Nummer.">Nr.</span>
                  </div>
                  <div className="text-[28px] font-bold leading-none">{dsNrPart1}/{dsNrPart2}</div>
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider opacity-80 text-right">
                  {ds.pages ? `${ds.pages} S.` : ""}
                </div>
              </div>
            );
          })()}

          {/* Title + Properties */}
          <div className="flex flex-col min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-baseline gap-1.5 flex-wrap">
              Bundestag
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>Wahlperiode {dsNrPart1}</span>
              {ds.dokumenttyp && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="text-zinc-700 dark:text-zinc-300 normal-case font-normal tracking-normal">
                    {ds.dokumenttyp}
                  </span>
                </>
              )}
              {datumFormatted && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="text-zinc-700 dark:text-zinc-300 normal-case font-normal tracking-normal num">{datumFormatted}</span>
                </>
              )}
            </div>

            <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-semibold tracking-[-0.025em] text-zinc-950 dark:text-zinc-50 leading-[1.15] mb-4 break-words hyphens-auto">
              {ds.titel ?? klasseLabel}
            </h1>

            {/* Träger */}
            {tragendeFraktion && (
              <div className="flex items-center gap-3 text-[13px] mb-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: partyColor(tragendeFraktion) }}
                  />
                  <span className="font-medium">{tragendeFraktion}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {ds.batch_class === "antwort" ? "antwortet" : "eingebracht"}
                  </span>
                </span>
              </div>
            )}

            {/* Tonalität + Themen */}
            <div className="flex items-center gap-2 flex-wrap">
              <DrucksacheTonalityBadge slug={ds.tonalitaet} />
              {ds.thema.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* PDF-Link */}
            {ds.pdf_url && (
              <a
                href={ds.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-[#1a3e72] dark:text-[#8fb3e6] hover:text-[#0f2a52] dark:hover:text-[#b7d0f0] px-2.5 py-1 rounded-md border border-[#1a3e72]/25 dark:border-[#8fb3e6]/25 hover:border-[#1a3e72]/40 dark:hover:border-[#8fb3e6]/40 bg-[#1a3e72]/5 dark:bg-[#8fb3e6]/10 hover:bg-[#1a3e72]/10 dark:hover:bg-[#8fb3e6]/20 transition-colors w-fit"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={2.25} />
                Original-PDF auf bundestag.de
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>
            )}
          </div>
        </div>

        {/* GESETZGEBUNGS-VERFAHREN: amtlicher Beratungsstand + Schritt-Timeline
            aus DIP-Vorgangsdaten — beantwortet "in welcher Phase ist das?" */}
        {gesetzgebung && (
          <GesetzgebungsVerfahren vorgang={gesetzgebung} currentDsNr={dsNr} />
        )}

        {/* ZUSAMMENFASSUNG (verstecke, wenn parsed_details eine reichere
            Sammelübersicht-Struktur liefert — sonst sieht der User nur
            "Sammelübersicht N mit X behandelten Petitionen"-Boilerplate). */}
        {ds.zusammenfassung &&
          !(parsedDetails?.pattern === "sammeluebersicht" && parsedDetails.total_petitionen > 0) && (
          <section className="fade-in-up-2 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
              Was die Drucksache sagt
            </h2>
            <div className="prose-zinc max-w-none">
              <p className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                {ds.zusammenfassung}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border text-[11px] text-zinc-400 dark:text-zinc-500">
              <Link href="/methodik" className="hover:text-zinc-950 dark:hover:text-zinc-100 underline-offset-2 hover:underline">
                Methodik öffnen →
              </Link>
            </div>
          </section>
        )}

        {/* PARSED-DETAILS: strukturierte PDF-Parser-Ausgabe für Sammel-
            übersichten, Verfahrens-Anträge, Wahlvorschläge. */}
        {parsedDetails?.pattern === "sammeluebersicht" && parsedDetails.total_petitionen > 0 && (
          <section className="fade-in-up-2 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
              Petitions-Sammelübersicht {parsedDetails.nummer}
            </h2>
            <p className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed mb-5">
              <span className="num font-medium text-zinc-950 dark:text-zinc-50">{parsedDetails.total_petitionen}</span>{" "}
              Bürger-Petitionen — vom Petitionsausschuss in dieser Sammelübersicht behandelt.
            </p>

            {parsedDetails.top_themen.length > 0 && (
              <div className="mb-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Top-Themen
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedDetails.top_themen.map((t) => (
                    <span
                      key={t.thema}
                      className="inline-flex items-center gap-1 text-[12.5px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <span>{t.thema}</span>
                      <span className="num text-zinc-500 dark:text-zinc-400">×{t.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Beschlussempfehlungen
              </div>
              <ul className="space-y-4">
                {parsedDetails.beschlussempfehlungen.map((be) => (
                  <li key={be.nummer} className="border-l-2 border-border pl-3 py-1">
                    <div className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-1.5">
                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">BE {be.nummer}:</span> {be.aktion}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] mb-2">
                      <span className="text-zinc-500 dark:text-zinc-400 num">
                        {be.petitionen_count}{" "}
                        {be.petitionen_count === 1 ? "Petition" : "Petitionen"}
                      </span>
                      {be.themen.slice(0, 4).map((t) => (
                        <span key={t.thema} className="inline-flex items-center gap-0.5 text-zinc-600 dark:text-zinc-300">
                          · <span>{t.thema}</span>
                          {t.count > 1 && <span className="num text-zinc-400 dark:text-zinc-500">×{t.count}</span>}
                        </span>
                      ))}
                      {be.themen.length > 4 && (
                        <span className="text-zinc-400 dark:text-zinc-500">+ {be.themen.length - 4}</span>
                      )}
                    </div>
                    {be.petitionen && be.petitionen.length > 0 && (
                      <details className="group mt-1">
                        <summary className="cursor-pointer text-[11.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 list-none flex items-center gap-1">
                          <span className="text-zinc-400 dark:text-zinc-500 group-open:hidden">▶</span>
                          <span className="text-zinc-400 dark:text-zinc-500 hidden group-open:inline">▼</span>
                          Einzelne Petitionen anzeigen
                        </summary>
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-[12px] text-zinc-700 dark:text-zinc-300">
                            <thead>
                              <tr className="text-[10.5px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-border">
                                <th className="text-left py-1 pr-2 font-medium">Nr</th>
                                <th className="text-left py-1 pr-2 font-medium">Aktenzeichen</th>
                                <th className="text-left py-1 pr-2 font-medium">Wohnort</th>
                                <th className="text-left py-1 font-medium">Sachgebiet</th>
                              </tr>
                            </thead>
                            <tbody>
                              {be.petitionen.map((p) => (
                                <tr key={p.lfd_nr} className="border-b border-border last:border-0">
                                  <td className="py-1.5 pr-2 num text-zinc-500 dark:text-zinc-400">{p.lfd_nr}</td>
                                  <td className="py-1.5 pr-2 num text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{p.aktenzeichen}</td>
                                  <td className="py-1.5 pr-2 text-zinc-700 dark:text-zinc-300">
                                    {p.plz && <span className="num text-zinc-500 dark:text-zinc-400 mr-1">{p.plz}</span>}
                                    {p.ort}
                                  </td>
                                  <td className="py-1.5 text-zinc-800 dark:text-zinc-200">{p.sachgebiet || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-5 leading-relaxed">
              Aktenzeichen, Wohnort und Sachgebiet werden deterministisch aus
              der PDF-Tabelle des Petitionsausschusses extrahiert. Der
              Petitions-Volltext einzelner Bürger:innen-Eingaben ist aus
              Datenschutzgründen nicht öffentlich.
            </p>
          </section>
        )}

        {parsedDetails?.pattern === "verfahren" && (parsedDetails.beschluss_klausel || parsedDetails.antragsteller.length > 0) && (
          <section className="fade-in-up-2 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
              Beschluss-Vorschlag
            </h2>
            {parsedDetails.beschluss_klausel && (
              <blockquote className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed border-l-2 border-zinc-300 dark:border-zinc-600 pl-4 mb-4">
                {parsedDetails.beschluss_klausel}
              </blockquote>
            )}
            {parsedDetails.antragsteller.length > 0 && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Eingebracht von
                </div>
                <ul className="space-y-0.5 text-[13.5px] text-zinc-700 dark:text-zinc-300">
                  {parsedDetails.antragsteller.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {parsedDetails?.pattern === "wahlvorschlag" && parsedDetails.total_mitglieder > 0 && (
          <section className="fade-in-up-2 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
              Vorgeschlagene Sitzverteilung
            </h2>
            <p className="text-[13.5px] text-zinc-700 dark:text-zinc-300 mb-3">
              <span className="num font-medium text-zinc-950 dark:text-zinc-50">{parsedDetails.total_mitglieder}</span>{" "}
              Personen über{" "}
              <span className="num font-medium text-zinc-950 dark:text-zinc-50">{parsedDetails.fraktion_sitze.length}</span>{" "}
              Fraktion{parsedDetails.fraktion_sitze.length === 1 ? "" : "en"}.
            </p>
            <ul className="space-y-1.5">
              {parsedDetails.fraktion_sitze.map((f) => (
                <li key={f.fraktion} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="text-zinc-800 dark:text-zinc-200">{f.fraktion}</span>
                  <span className="num font-medium text-zinc-950 dark:text-zinc-50">{f.mitglieder}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FRAGE & ANTWORT (Phase C: Kleine/Große Anfrage — getrennte Kerninhalte) */}
        {((ds.kerninhaltFrage?.length ?? 0) > 0 || (ds.kerninhaltAntwort?.length ?? 0) > 0) && qaPaare.length === 0 && (
          <section className="fade-in-up-3 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline gap-3 mb-5 flex-wrap">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Frage &amp; Antwort</h2>
              {ds.antwortCharakter && <DrucksacheTonalityBadge slug={ds.antwortCharakter} />}
            </div>
            {(ds.kerninhaltQaPaare?.length ?? 0) > 0 ? (
              /* Gepaart: jede Frage mit ihrer zugeordneten Antwort */
              <ul className="space-y-3.5">
                {ds.kerninhaltQaPaare!.map((p, i) => (
                  <li key={`p-${i}`} className="border-l-2 border-border pl-4">
                    <p className="text-[13.5px] text-zinc-900 dark:text-zinc-100 leading-snug font-medium">{p.frage}</p>
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-snug mt-0.5">
                      <span className="text-zinc-400 dark:text-zinc-500">↳ </span>{p.antwort || <span className="italic text-zinc-400 dark:text-zinc-500">keine Antwort zugeordnet</span>}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              /* Fallback: zwei getrennte Listen (falls noch keine Paarung) */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(ds.kerninhaltFrage?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Was wurde gefragt?</h3>
                    <ul className="space-y-2.5">
                      {ds.kerninhaltFrage!.map((b, i) => (
                        <li key={`f-${i}`} className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(ds.kerninhaltAntwort?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Wie hat die Bundesregierung geantwortet?</h3>
                    <ul className="space-y-2.5">
                      {ds.kerninhaltAntwort!.map((b, i) => (
                        <li key={`a-${i}`} className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug">{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* KERNINHALT mit Bullet-Type-Tags (Blob — entfällt, wenn Frage/Antwort getrennt vorliegt) */}
        {ds.kerninhalt && ds.kerninhalt.length > 0 && !((ds.kerninhaltFrage?.length ?? 0) > 0) && (
          <section className="fade-in-up-3 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Kerninhalt
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{ds.kerninhalt.length}</span>
            </div>
            <ul className="space-y-3">
              {ds.kerninhalt.map((b, i) => {
                const typ = bulletType(b, ds.batch_class);
                return (
                  <li key={i} className="flex gap-3 items-start text-[13.5px] leading-relaxed">
                    <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-wider uppercase ${bulletTypeColor[typ] ?? "text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800"} mt-0.5`}>
                      {typ}
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200">{b}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* GROSS-SPEZIFISCH: Regelung / Begründung / Auswirkung */}
        {(ds.regelung || ds.begruendung || ds.auswirkung) && (
          <section className="fade-in-up-3 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-5">
              Details
            </h2>
            <div className="space-y-5">
              {ds.regelung && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wide mb-2">
                    Regelung
                  </h3>
                  <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">{ds.regelung}</p>
                </div>
              )}
              {ds.begruendung && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wide mb-2">
                    Begründung
                  </h3>
                  <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">{ds.begruendung}</p>
                </div>
              )}
              {ds.auswirkung && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wide mb-2">
                    Auswirkung
                  </h3>
                  <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">{ds.auswirkung}</p>
                </div>
              )}
              {ds.betroffene_gruppen && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 dark:text-zinc-50 uppercase tracking-wide mb-2">
                    Betroffene Gruppen
                  </h3>
                  <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed">{ds.betroffene_gruppen}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* MITZEICHNER mit Fraktionsverteilung */}
        {mitzTotal > 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Mitgezeichnet
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{mitzTotal}</span>
            </div>

            {/* Fraktionsverteilung-Bar (nur bei >1 Fraktion) */}
            {fraktionList.length > 1 && (
              <div className="mb-5">
                <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2.5">
                  {fraktionList.map(([party, n]) => (
                    <div
                      key={party}
                      style={{
                        width: `${(n / mitzTotal) * 100}%`,
                        background: partyColor(party),
                      }}
                      title={`${party}: ${n}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] num">
                  {fraktionList.map(([party, n]) => (
                    <span key={party} className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: partyColor(party) }} />
                      <span>{party}</span>
                      <span className="text-zinc-950 dark:text-zinc-50 font-medium">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mitzeichner-Grid */}
            <MitzeichnerGrid mitz={mitzeichner} />
          </section>
        )}

        {/* BERICHTERSTATTER:INNEN — formale Ausschuss-Rolle, KEINE inhaltliche Mit-Trägerschaft */}
        {berichterstatter.length > 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Berichterstatter:innen
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{berichterstatter.length}</span>
            </div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug mb-5">
              Vom Ausschuss benannt — typischerweise 1 pro Fraktion. Diese Liste zeigt KEINE inhaltliche Zustimmung; die genannten Fraktionen können in der namentlichen Abstimmung sehr wohl dagegen stimmen.
            </p>
            <MitzeichnerGrid mitz={berichterstatter} />
          </section>
        )}

        {/* FRAGEN & ANTWORTEN — extrahierte Einzel-Q&A aus Sammeldrucksachen */}
        {qaPaare.length > 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fragen & Antworten</h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{qaPaare.length}</span>
              {ds.antwortCharakter && <DrucksacheTonalityBadge slug={ds.antwortCharakter} />}
            </div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug mb-5">
              Jede Einzelfrage mit der zugeordneten Antwort der Bundesregierung, aus der Drucksache extrahiert.
            </p>
            <ul className="space-y-4">
              {qaPaare.map((qa) => (
                <li key={qa.paarIndex} className="border-l-2 border-border pl-4">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="num text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0">{qa.paarIndex}</span>
                    {qa.fragestellerName && (qa.fragestellerPoliticianId ? (
                      <Link href={`/politiker/${qa.fragestellerPoliticianId}`} className="text-[13px] font-medium text-zinc-950 dark:text-zinc-50 hover:text-[#1a3e72] dark:hover:text-[#8fb3e6] transition-colors">
                        {qa.fragestellerName}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{qa.fragestellerName}</span>
                    ))}
                    {qa.fragestellerParty && <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{qa.fragestellerParty}</span>}
                  </div>
                  {qa.frageText && <p className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug mb-1.5">{qa.frageText}</p>}
                  {qa.antwortText && (
                    <details className="group">
                      <summary className="cursor-pointer text-[11.5px] text-[#1a3e72] dark:text-[#8fb3e6] hover:text-[#0f2a52] dark:hover:text-[#b7d0f0] select-none list-none">
                        <span className="group-open:hidden">▶ Antwort{qa.antwortSteller ? ` (${qa.antwortSteller})` : ""} anzeigen</span>
                        <span className="hidden group-open:inline">▼ Antwort ausblenden</span>
                      </summary>
                      <div className="mt-1.5 text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line border-l-2 border-border pl-3">
                        {(qa.antwortSteller || qa.antwortDatum) && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-1">
                            Antwort{qa.antwortSteller ? ` von ${qa.antwortSteller}` : ""}{qa.antwortDatum ? `, ${qa.antwortDatum}` : ""}
                          </p>
                        )}
                        {qa.antwortText}
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* BETEILIGTE BEITRÄGE / FRAGEN — schriftliche Fragen sind NICHT "im Plenum" */}
        {relatedSpeeches.length > 0 && qaPaare.length === 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {relatedAllSchriftlich ? "Enthaltene Fragen" : "Im Plenum"}
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{relatedSpeeches.length}</span>
            </div>
            {relatedAllSchriftlich && (
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug mb-5 -mt-2">
                Die Antworten der Bundesregierung stehen im{" "}
                {ds.pdf_url ? (
                  <a href={ds.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[#1a3e72] dark:text-[#8fb3e6] hover:text-[#0f2a52] dark:hover:text-[#b7d0f0] underline decoration-[#1a3e72]/40 dark:decoration-[#8fb3e6]/40 underline-offset-2">Original-PDF</a>
                ) : "Original-PDF"}
                {["substantiell", "teilantwortend", "ausweichend"].includes(ds.tonalitaet ?? "")
                  ? <>; ihre Substanz ist oben als „{ds.tonalitaet}" eingeordnet.</>
                  : "."}
              </p>
            )}
            <ul className="space-y-3">
              {relatedSpeeches.slice(0, 12).map((r, i) => {
                const Icon = r.aktivitaetsart === "Rede" ? Mic : MessageSquare;
                return (
                  <li key={`${r.politician_id}-${i}`} className="text-[13px]">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 self-center" strokeWidth={2} />
                      <Link
                        href={`/politiker/${r.politician_id}`}
                        className="text-zinc-950 dark:text-zinc-50 hover:underline underline-offset-2 font-medium"
                      >
                        {r.first_name} {r.last_name}
                      </Link>
                      <span className="text-zinc-400 dark:text-zinc-500">·</span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[12px]">{r.typLabel}</span>
                      {r.party_label && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">{r.party_label}</span>
                      )}
                      {r.datum && (
                        <span className="text-zinc-400 dark:text-zinc-500 text-[11px] num ml-auto">
                          {new Date(r.datum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    {r.thema && (
                      <p className="text-[12.5px] text-zinc-700 dark:text-zinc-300 leading-snug mt-0.5 pl-[22px] line-clamp-2">
                        {r.thema}
                      </p>
                    )}
                  </li>
                );
              })}
              {relatedSpeeches.length > 12 && (
                <li className="text-[11.5px] text-zinc-400 dark:text-zinc-500 pl-6 pt-1">
                  + {relatedSpeeches.length - 12} weitere
                </li>
              )}
            </ul>
          </section>
        )}

        {/* NAMENTLICHE ABSTIMMUNG (wenn vorhanden) */}
        {polls.length > 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-5">
              Namentliche Abstimmung{polls.length > 1 ? "en" : ""}
            </h2>
            <div className="space-y-5">
              {polls.map((p) => {
                const pct = (n: number) => `${((n / Math.max(p.total, 1)) * 100).toFixed(1)}%`;
                return (
                  <div key={p.poll_id}>
                    <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                      <Link
                        href={`/abstimmungen/${p.poll_id}`}
                        className="text-[13.5px] font-medium text-zinc-950 dark:text-zinc-50 hover:underline underline-offset-2"
                      >
                        {p.poll_label}
                      </Link>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">
                        {new Date(p.poll_date + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-2.5">
                      <div className="bg-emerald-500" style={{ width: pct(p.yes) }} title={`Ja: ${p.yes}`} />
                      <div className="bg-red-500" style={{ width: pct(p.no) }} title={`Nein: ${p.no}`} />
                      <div className="bg-amber-500" style={{ width: pct(p.abstain) }} title={`Enthaltung: ${p.abstain}`} />
                      <div className="bg-zinc-400" style={{ width: pct(p.noShow) }} title={`Abwesend: ${p.noShow}`} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] num">
                      <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ja <span className="text-zinc-950 dark:text-zinc-50 font-medium">{p.yes}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Nein <span className="text-zinc-950 dark:text-zinc-50 font-medium">{p.no}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Enthaltung <span className="text-zinc-950 dark:text-zinc-50 font-medium">{p.abstain}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Abwesend <span className="text-zinc-950 dark:text-zinc-50 font-medium">{p.noShow}</span>
                      </span>
                    </div>
                    {p.match_score < 0.5 && (
                      <p className="text-[10.5px] text-zinc-400 dark:text-zinc-500 mt-2">
                        Verknüpfung automatisch erkannt (Confidence niedrig — bitte prüfen)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* HANDZEICHEN-VOTES (Plenum, Fraktions-Ebene) */}
        {handzeichenVotes.length > 0 && (
          <HandzeichenVotesSection votes={handzeichenVotes} />
        )}

        {/* VERFAHRENS-ZUSAMMENHANG (Antwort↔Anfrage) */}
        {(verfahren.parent || verfahren.children.length > 0) && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-5">
              Verfahrens-Zusammenhang
            </h2>
            <div className="space-y-3">
              {verfahren.parent && (
                <RelatedDsCard
                  ds={verfahren.parent}
                  prefix="Ursprüngliche Anfrage →"
                  ownDatum={ds.datum}
                />
              )}
              {verfahren.children.map((c) => (
                <RelatedDsCard
                  key={c.drucksache_nr}
                  ds={c}
                  prefix={c.batch_class === "antwort" ? "Antwort der Bundesregierung →" : "Folge-Drucksache →"}
                  ownDatum={ds.datum}
                />
              ))}
            </div>
          </section>
        )}

        {/* ANDERE DS DER FRAKTION */}
        {sameFraktion.length > 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: partyColor(ds.fraktion) }} />
                Weitere Drucksachen der {ds.fraktion}
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{sameFraktion.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sameFraktion.map((c) => (
                <RelatedDsCard key={c.drucksache_nr} ds={c} compact />
              ))}
            </div>
          </section>
        )}

        {/* THEMEN-ÄHNLICHE DRUCKSACHEN */}
        {themenAehnliche.length > 0 && (
          <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Ähnliche Themen
              </h2>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                {ds.thema.slice(0, 3).join(" · ")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {themenAehnliche.map((c) => (
                <RelatedDsCard key={c.drucksache_nr} ds={c} compact />
              ))}
            </div>
          </section>
        )}

        {/* Drift-Audit (wenn vorhanden) */}
        {ds.topic_drift_audit && ds.topic_drift_audit.length > 0 && (
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 px-2 mb-4">
            Weitere unaufgenommene Themen-Tags (Audit):{" "}
            <span className="text-zinc-500 dark:text-zinc-400">{ds.topic_drift_audit.join(" · ")}</span>
          </div>
        )}
      </div>
    </main>
  );
}

function renderSkeletonPage(
  skeleton: import("@/lib/db").DrucksacheSkeleton,
  mitzeichner: MitzeichnerRow[],
  berichterstatter: MitzeichnerRow[],
  referencingVotes: DsVoteSummary[] = [],
  plenarContext: DsPlenarContext[] = [],
  parsedDetails: DsParsedDetails | null = null,
  gesetzgebung: import("@/lib/db").GesetzgebungsVorgangDetail | null = null,
) {
  const datumFormatted = formatDate(skeleton.datum);
  const fraktionCounts = new Map<string, number>();
  for (const m of mitzeichner) {
    const k = m.party_label ?? "fraktionslos";
    fraktionCounts.set(k, (fraktionCounts.get(k) ?? 0) + 1);
  }
  const fraktionList = Array.from(fraktionCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <main className="page-wash min-h-screen">
      <div className="page-shell">
        <Link
          href="/aktivitaeten"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Alle Aktivitäten
        </Link>

        <header className="mb-7">
          <div className="flex items-baseline gap-2 flex-wrap mb-2 text-[11px] uppercase tracking-wider font-medium text-zinc-500 dark:text-zinc-400">
            <span>{skeleton.aktivitaetsart}</span>
            {skeleton.urheber && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span>{skeleton.urheber}</span>
              </>
            )}
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="num">{skeleton.drucksache_nr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight">
            {skeleton.titel}
          </h1>
          {datumFormatted && (
            <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400 num">{datumFormatted}</p>
          )}
        </header>

        <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 mb-6">
          <h2 className="text-[12px] font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-2">
            Analyse pending
          </h2>
          <p className="text-[14px] text-amber-900 dark:text-amber-300 leading-relaxed">
            Diese Drucksache ist aus der DIP-Aktivitätsliste bekannt, aber das offizielle
            PDF auf dserver.bundestag.de wurde noch nicht durch unsere Analyse-Pipeline
            verarbeitet. Beim nächsten Daten-Refresh wird die KI-Zusammenfassung,
            Tonalitäts-Analyse und thematische Einordnung ergänzt.
            {skeleton.pdf_url && (
              <>
                {" "}Bis dahin: direkt auf bundestag.de lesen via{" "}
                <a
                  href={skeleton.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-amber-400 dark:decoration-amber-600 hover:decoration-amber-900 dark:hover:decoration-amber-300 font-medium inline-flex items-center gap-1"
                >
                  Original-PDF
                  <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                </a>
                .
              </>
            )}
          </p>
        </section>

        {gesetzgebung && (
          <GesetzgebungsVerfahren vorgang={gesetzgebung} currentDsNr={skeleton.drucksache_nr} />
        )}

        {referencingVotes.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Wo diese Drucksache abgestimmt wurde
            </h2>
            <ul className="space-y-3">
              {referencingVotes.map((v) => {
                const dateStr = v.datum
                  ? new Date(v.datum + "T00:00:00").toLocaleDateString("de-DE", {
                      day: "2-digit", month: "long", year: "numeric",
                    })
                  : "Datum unbekannt";
                const outcomeLabel =
                  v.outcome === "annahme"
                    ? "angenommen"
                    : v.outcome === "annahme_geaendert"
                      ? "in geänderter Fassung angenommen"
                      : v.outcome === "ablehnung"
                        ? "abgelehnt"
                        : v.outcome === "vertagung"
                          ? "vertagt"
                          : v.outcome === "ueberweisung"
                            ? "an Ausschuss überwiesen"
                            : v.outcome;
                const outcomeClasses =
                  v.outcome === "annahme" || v.outcome === "annahme_geaendert"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    : v.outcome === "ablehnung"
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600";
                return (
                  <li key={v.voteId} className="flex items-baseline gap-3 flex-wrap">
                    <span
                      className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded border ${outcomeClasses}`}
                    >
                      {outcomeLabel}
                    </span>
                    <span className="text-[13px] text-zinc-700 dark:text-zinc-300">
                      {v.voteType === "handzeichen" ? "Handzeichen" : v.voteType} ·{" "}
                      <span className="num">{dateStr}</span>
                      {v.sitzungNr && (
                        <>
                          {" "}·{" "}
                          {v.wahlperiode ? `WP ${v.wahlperiode}, ` : ""}
                          {v.sitzungNr}. Sitzung
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-3 leading-relaxed">
              Diese Verbindung kommt aus dem Plenarprotokoll der Sitzung — wir scannen
              alle PlPr-XMLs auf Abstimmungs-Snippets und ordnen sie der Drucksache zu.
            </p>
          </section>
        )}

        {parsedDetails?.pattern === "sammeluebersicht" && parsedDetails.total_petitionen > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Petitions-Sammelübersicht {parsedDetails.nummer}
            </h2>
            <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed mb-4">
              <span className="num font-medium text-zinc-950 dark:text-zinc-50">{parsedDetails.total_petitionen}</span>{" "}
              Bürger-Petitionen — vom Petitionsausschuss in dieser Sammelübersicht behandelt.
            </p>

            {parsedDetails.top_themen.length > 0 && (
              <div className="mb-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Top-Themen
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedDetails.top_themen.map((t) => (
                    <span
                      key={t.thema}
                      className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    >
                      <span>{t.thema}</span>
                      <span className="num text-zinc-500 dark:text-zinc-400">×{t.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Beschlussempfehlungen
              </div>
              <ul className="space-y-4">
                {parsedDetails.beschlussempfehlungen.map((be) => (
                  <li
                    key={be.nummer}
                    className="border-l-2 border-border pl-3 py-1"
                  >
                    <div className="text-[12.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-1.5">
                      <span className="font-semibold text-zinc-950 dark:text-zinc-50">BE {be.nummer}:</span>{" "}
                      {be.aktion}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-2">
                      <span className="text-zinc-500 dark:text-zinc-400 num">
                        {be.petitionen_count}{" "}
                        {be.petitionen_count === 1 ? "Petition" : "Petitionen"}
                      </span>
                      {be.themen.slice(0, 4).map((t) => (
                        <span
                          key={t.thema}
                          className="inline-flex items-center gap-0.5 text-[11px] text-zinc-600 dark:text-zinc-300"
                        >
                          ·{" "}
                          <span>{t.thema}</span>
                          {t.count > 1 && (
                            <span className="num text-zinc-400 dark:text-zinc-500">×{t.count}</span>
                          )}
                        </span>
                      ))}
                      {be.themen.length > 4 && (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          + {be.themen.length - 4}
                        </span>
                      )}
                    </div>
                    {be.petitionen && be.petitionen.length > 0 && (
                      <details className="group mt-1">
                        <summary className="cursor-pointer text-[11.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 list-none flex items-center gap-1">
                          <span className="text-zinc-400 dark:text-zinc-500 group-open:hidden">▶</span>
                          <span className="text-zinc-400 dark:text-zinc-500 hidden group-open:inline">▼</span>
                          Einzelne Petitionen anzeigen
                        </summary>
                        <div className="mt-2 overflow-x-auto">
                          <table className="w-full text-[12px] text-zinc-700 dark:text-zinc-300">
                            <thead>
                              <tr className="text-[10.5px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-border">
                                <th className="text-left py-1 pr-2 font-medium">Nr</th>
                                <th className="text-left py-1 pr-2 font-medium">Aktenzeichen</th>
                                <th className="text-left py-1 pr-2 font-medium">Wohnort</th>
                                <th className="text-left py-1 font-medium">Sachgebiet</th>
                              </tr>
                            </thead>
                            <tbody>
                              {be.petitionen.map((p) => (
                                <tr key={p.lfd_nr} className="border-b border-border last:border-0">
                                  <td className="py-1.5 pr-2 num text-zinc-500 dark:text-zinc-400">{p.lfd_nr}</td>
                                  <td className="py-1.5 pr-2 num text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{p.aktenzeichen}</td>
                                  <td className="py-1.5 pr-2 text-zinc-700 dark:text-zinc-300">
                                    {p.plz && <span className="num text-zinc-500 dark:text-zinc-400 mr-1">{p.plz}</span>}
                                    {p.ort}
                                  </td>
                                  <td className="py-1.5 text-zinc-800 dark:text-zinc-200">{p.sachgebiet || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-5 leading-relaxed">
              Aktenzeichen, Wohnort und Sachgebiet werden deterministisch aus
              der PDF-Tabelle des Petitionsausschusses extrahiert. Der
              Petitions-Volltext einzelner Bürger:innen-Eingaben ist aus
              Datenschutzgründen nicht öffentlich.
            </p>
          </section>
        )}

        {parsedDetails?.pattern === "verfahren" && (parsedDetails.beschluss_klausel || parsedDetails.antragsteller.length > 0) && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Beschluss-Vorschlag
            </h2>
            {parsedDetails.beschluss_klausel && (
              <blockquote className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed border-l-2 border-zinc-300 dark:border-zinc-600 pl-4 mb-4">
                {parsedDetails.beschluss_klausel}
              </blockquote>
            )}
            {parsedDetails.antragsteller.length > 0 && (
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Eingebracht von
                </div>
                <ul className="space-y-0.5 text-[13px] text-zinc-700 dark:text-zinc-300">
                  {parsedDetails.antragsteller.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {parsedDetails?.pattern === "wahlvorschlag" && parsedDetails.total_mitglieder > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Vorgeschlagene Sitzverteilung
            </h2>
            <p className="text-[13px] text-zinc-700 dark:text-zinc-300 mb-3">
              <span className="num font-medium text-zinc-950 dark:text-zinc-50">{parsedDetails.total_mitglieder}</span>{" "}
              Personen über{" "}
              <span className="num font-medium text-zinc-950 dark:text-zinc-50">{parsedDetails.fraktion_sitze.length}</span>{" "}
              Fraktion{parsedDetails.fraktion_sitze.length === 1 ? "" : "en"}.
            </p>
            <ul className="space-y-1.5">
              {parsedDetails.fraktion_sitze.map((f) => (
                <li
                  key={f.fraktion}
                  className="flex items-baseline justify-between gap-3 text-[13px]"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">{f.fraktion}</span>
                  <span className="num font-medium text-zinc-950 dark:text-zinc-50">{f.mitglieder}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {plenarContext.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Aussprache zu dieser Drucksache
            </h2>
            <div className="space-y-5">
              {plenarContext.map((ctx) => (
                <div key={`${ctx.sitzungNr}-${ctx.topNumber}`}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-3">
                    <span className="num text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      TOP {ctx.topNumber}
                    </span>
                    {ctx.sitzungNr && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">
                        · {ctx.sitzungNr}. Sitzung
                      </span>
                    )}
                    {ctx.datum && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">
                        · {new Date(ctx.datum + "T00:00:00").toLocaleDateString("de-DE", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3">
                    {ctx.topTitle}
                  </p>
                  <ul className="space-y-1.5">
                    {ctx.speeches.slice(0, 12).map((sp) => (
                      <li
                        key={sp.speechId}
                        className="flex items-baseline gap-2 text-[13px] text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="num text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0 w-6">
                          {sp.speechIndex ?? ""}
                        </span>
                        <span className="font-medium text-zinc-950 dark:text-zinc-50">{sp.speaker}</span>
                        {sp.party && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">({sp.party})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {ctx.speeches.length > 12 && (
                    <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-2">
                      + {ctx.speeches.length - 12} weitere Reden
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-4 leading-relaxed">
              Aussprache automatisch gefunden via Volltext-Match auf Schlüsselbegriffen aus
              dem Drucksachen-Titel gegen das Plenarprotokoll. Bei Verfahrens-Anträgen
              (z.B. Wahlvorschläge, Petitions-Sammelübersichten) gibt es oft keine Aussprache —
              dann wird diese Sektion nicht angezeigt.
            </p>
          </section>
        )}

        {mitzeichner.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Mitgezeichnet
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{mitzeichner.length}</span>
            </div>
            {fraktionList.length > 1 && (
              <div className="mb-5">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] num">
                  {fraktionList.map(([party, n]) => (
                    <span key={party} className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <span>{party}</span>
                      <span className="text-zinc-950 dark:text-zinc-50 font-medium">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <MitzeichnerGrid mitz={mitzeichner} />
          </section>
        )}

        {berichterstatter.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Berichterstatter:innen
              </h2>
              <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">{berichterstatter.length}</span>
            </div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug mb-5">
              Vom Ausschuss benannt — typischerweise 1 pro Fraktion. Diese Liste zeigt KEINE inhaltliche Zustimmung; die genannten Fraktionen können in der namentlichen Abstimmung sehr wohl dagegen stimmen.
            </p>
            <MitzeichnerGrid mitz={berichterstatter} />
          </section>
        )}
      </div>
    </main>
  );
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  try {
    const t1 = new Date(a + "T00:00:00").getTime();
    const t2 = new Date(b + "T00:00:00").getTime();
    return Math.round(Math.abs(t1 - t2) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

function RelatedDsCard({
  ds,
  prefix,
  compact = false,
  ownDatum,
}: {
  ds: RelatedDsRow;
  prefix?: string;
  compact?: boolean;
  ownDatum?: string | null;     // Datum der "Quelldrucksache" für Diff-Anzeige
}) {
  const slug = ds.drucksache_nr.replace("/", "-");
  // Amtlicher DIP-Typ (dokumenttyp) zuerst; klasseLabelMap[batch_class] nur Fallback.
  const klasseLabel = (ds.dokumenttyp?.trim() || klasseLabelMap[ds.batch_class]) ?? ds.batch_class;
  const datumF = formatDate(ds.datum);
  const dayDiff = ownDatum ? daysBetween(ownDatum, ds.datum) : null;

  return (
    <Link
      href={`/aktivitaeten/${slug}`}
      className="block rounded-xl border border-border bg-card hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors p-4 group"
    >
      {prefix && (
        <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5 flex items-baseline justify-between gap-2">
          <span>{prefix}</span>
          {dayDiff !== null && dayDiff > 0 && (
            <span className="text-zinc-400 dark:text-zinc-500 normal-case font-normal tracking-normal num">
              nach {dayDiff === 1 ? "1 Tag" : `${dayDiff} Tagen`}
            </span>
          )}
        </div>
      )}
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <span className="text-[11px] font-mono font-semibold text-zinc-950 dark:text-zinc-50 num">
          {ds.drucksache_nr}
        </span>
        <span className="text-[10.5px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {klasseLabel}
        </span>
        {datumF && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 num">{datumF}</span>
          </>
        )}
        {ds.tonalitaet && (
          <span className="ml-auto">
            <DrucksacheTonalityBadge slug={ds.tonalitaet} />
          </span>
        )}
      </div>
      {ds.titel && (
        <div className={`text-[13.5px] font-medium text-zinc-950 dark:text-zinc-50 ${compact ? "line-clamp-2" : "line-clamp-3"} leading-snug group-hover:underline underline-offset-2`}>
          {ds.titel}
        </div>
      )}
      {!compact && ds.zusammenfassung && (
        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
          {ds.zusammenfassung}
        </p>
      )}
    </Link>
  );
}

function MitzeichnerGrid({ mitz }: { mitz: MitzeichnerRow[] }) {
  // Default zeigt erste 8, bei mehr ein "Alle anzeigen" - aber Server-Component, daher einfach erste 24 anzeigen
  const visible = mitz.slice(0, 24);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2.5">
      {visible.map((m) => (
        <Link
          key={m.politician_id}
          href={`/politiker/${m.politician_id}`}
          className="flex items-center gap-2.5 group min-w-0"
        >
          <span
            className="shrink-0 w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border inline-flex items-center justify-center text-[9.5px] font-semibold text-zinc-600 dark:text-zinc-300"
            style={m.party_label ? { boxShadow: `0 0 0 1.5px ${partyColor(m.party_label)}` } : undefined}
          >
            {m.first_name.charAt(0)}{m.last_name.charAt(0)}
          </span>
          <span className="text-[12.5px] text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 transition-colors truncate">
            {m.first_name} {m.last_name}
          </span>
        </Link>
      ))}
      {mitz.length > 24 && (
        <div className="text-[12px] text-zinc-400 dark:text-zinc-500 col-span-full mt-2">
          + {mitz.length - 24} weitere Mitzeichner:innen
        </div>
      )}
    </div>
  );
}

const HZ_FRAKTIONS_ORDER = ["CDU/CSU", "SPD", "GRÜNE", "LINKE", "AfD"] as const;

const HZ_OUTCOME_META: Record<string, { label: string; classes: string }> = {
  annahme: { label: "angenommen", classes: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" },
  annahme_geaendert: {
    label: "in geänderter Fassung angenommen",
    classes: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  ablehnung: { label: "abgelehnt", classes: "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/50" },
  vertagung: { label: "vertagt", classes: "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50" },
  ueberweisung: { label: "an Ausschuss überwiesen", classes: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600" },
};

// Rohe Fraktions-Stimme als Chip (ja/nein/Enthaltung).
function RohstimmeChip({ fraktion, vote }: { fraktion: string; vote: string }) {
  const cls =
    vote === "ja"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : vote === "nein"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : vote === "enthaltung"
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-zinc-50 text-zinc-500 border-zinc-200";
  const icon = vote === "ja" ? "✓" : vote === "nein" ? "✗" : vote === "enthaltung" ? "—" : "?";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${cls}`}
      title={`${fraktion}: ${vote}`}
    >
      <span className="font-semibold">{fraktion}</span>
      <span>{icon}</span>
    </span>
  );
}

// Umgerechnete Sachposition zum Antrag als Chip (dafür/dagegen/Enthaltung).
function PositionChip({ fraktion, raw }: { fraktion: string; raw: string }) {
  const pos = positionZumAntrag(raw, true);
  const cls =
    pos === "dafuer"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : pos === "dagegen"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : pos === "enthaltung"
          ? "bg-amber-50 text-amber-800 border-amber-200"
          : "bg-zinc-50 text-zinc-500 border-zinc-200";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${cls}`}
      title={`${fraktion}: ${POSITION_META[pos].label} (Rohstimme: ${raw})`}
    >
      <span className="font-semibold">{fraktion}</span>
      <span>{POSITION_META[pos].icon}</span>
    </span>
  );
}

function HandzeichenVotesSection({ votes }: { votes: BundestagDsHandzeichenVote[] }) {
  const hatFlip = votes.some((v) => v.beschlussAblehnung);
  return (
    <section className="fade-in-up-4 bg-card rounded-2xl border border-border p-7 mb-6">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
        Abstimmung{votes.length > 1 ? "en" : ""} im Plenum{" "}
        <span className="text-zinc-400 dark:text-zinc-500 normal-case font-normal tracking-normal">
          · Handzeichen, Fraktions-Ebene
        </span>
      </h2>
      {/* "Oben": Beschlussempfehlungs-Hinweis vor den Stimmen — sonst liest sich die rohe
          Stimme als "Einbringer stimmt gegen den eigenen Antrag". */}
      {hatFlip && (
        <div className="mb-5 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-[12.5px] leading-relaxed text-amber-900">
          <span className="font-semibold">Wichtig zum Verständnis:</span> Abgestimmt wurde nicht über
          den Antrag selbst, sondern über die{" "}
          <span className="font-medium">Beschlussempfehlung des Ausschusses, die die Ablehnung dieses
          Antrags empfiehlt</span>. Ein „Nein“ zur Empfehlung bedeutet daher{" "}
          <span className="font-medium">Zustimmung zum Antrag</span>. Die Stimmen unten sind als{" "}
          <span className="font-medium">Position zum Antrag</span> dargestellt; die Rohstimme über die
          Beschlussempfehlung steht jeweils darunter.
        </div>
      )}
      <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5 max-w-2xl">
        Diese Abstimmung wurde nicht namentlich durchgeführt; das Plenum hat per Handzeichen
        entschieden. Es liegen daher keine individuellen MdB-Stimmen vor, nur das Abstimmungs-Verhalten
        je Fraktion.
      </p>
      <div className="space-y-5">
        {votes.map((v) => {
          const flip = v.beschlussAblehnung;
          // Bei Flip steht das Outcome für die Beschlussempfehlung; annahme = Antrag abgelehnt.
          const oc =
            flip && v.outcome === "annahme"
              ? {
                  label: "Antrag abgelehnt",
                  classes:
                    "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-900/50",
                }
              : HZ_OUTCOME_META[v.outcome] ?? {
                  label: v.outcome,
                  classes:
                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600",
                };

          return (
            <div key={v.voteId}>
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded border ${oc.classes}`}
                  >
                    {oc.label}
                  </span>
                  {flip && (
                    <span className="text-[11px] font-medium text-amber-700">
                      über Beschlussempfehlung (Ablehnung empfohlen)
                    </span>
                  )}
                  {v.modus && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {v.modus === "einstimmig"
                        ? "einstimmig"
                        : v.modus === "knapp"
                          ? "knappe Mehrheit"
                          : v.modus === "mehrheitlich"
                            ? "mehrheitlich"
                            : v.modus}
                    </span>
                  )}
                  {v.sitzungNr && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">
                      {v.wahlperiode ? `WP ${v.wahlperiode} · ` : ""}Sitzung {v.sitzungNr}
                    </span>
                  )}
                </div>
                {v.datum && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 num">
                    {new Date(v.datum + "T00:00:00").toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              {!v.fraktionVotes ? (
                <div className="text-[11.5px] text-zinc-400 dark:text-zinc-500 italic">
                  Fraktions-Voten nicht erfasst
                </div>
              ) : flip ? (
                <>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 mb-1">
                    Position zum Antrag
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HZ_FRAKTIONS_ORDER.map((f) => (
                      <PositionChip key={f} fraktion={f} raw={v.fraktionVotes?.[f] ?? "unbekannt"} />
                    ))}
                  </div>
                  <details className="group mt-2">
                    <summary className="cursor-pointer list-none text-[11px] text-zinc-400 hover:text-zinc-600 select-none">
                      <span className="group-open:hidden">▶ Rohstimme über die Beschlussempfehlung</span>
                      <span className="hidden group-open:inline">▼ Rohstimme ausblenden</span>
                    </summary>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {HZ_FRAKTIONS_ORDER.map((f) => (
                        <RohstimmeChip key={f} fraktion={f} vote={v.fraktionVotes?.[f] ?? "unbekannt"} />
                      ))}
                    </div>
                  </details>
                </>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {HZ_FRAKTIONS_ORDER.map((f) => (
                    <RohstimmeChip key={f} fraktion={f} vote={v.fraktionVotes?.[f] ?? "unbekannt"} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
