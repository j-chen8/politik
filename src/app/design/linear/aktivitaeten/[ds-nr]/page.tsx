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
  type DrucksacheDetail,
  type MitzeichnerRow,
  type RelatedSpeechRow,
  type RelatedDsRow,
  type DsPollRow,
} from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Mic, MessageSquare } from "lucide-react";
import { GlossarTerm } from "@/components/GlossarTerm";
import { DrucksacheTonalityBadge } from "@/components/TonalityBadge";

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
  // Wenn dokumenttyp da ist, nutze ihn als Basis
  const t = (dokumenttyp ?? "").trim().toLowerCase();

  if (batchClass === "antwort") return { line1: "ANTWORT der", line2: "BUNDESREGIERUNG" };

  if (batchClass === "klein") {
    if (t.includes("antrag")) return { line1: "ANTRAG", line2: "" };
    if (t.includes("entschließung")) return { line1: "ENTSCHLIESSUNGS-", line2: "ANTRAG" };
    if (t.includes("änderung")) return { line1: "ÄNDERUNGS-", line2: "ANTRAG" };
    return { line1: "KLEINE", line2: "ANFRAGE" };
  }

  if (batchClass === "gross") {
    if (t.includes("große anfrage")) return { line1: "GROSSE", line2: "ANFRAGE" };
    if (t.includes("gesetz")) return { line1: "GESETZ-", line2: "ENTWURF" };
    return { line1: "GESETZ-", line2: "ENTWURF" };
  }

  if (batchClass === "mittel") {
    if (t.includes("unterrichtung")) return { line1: "UNTER-", line2: "RICHTUNG" };
    if (t.includes("bericht")) return { line1: "BERICHT", line2: "" };
    if (t.includes("empfehlung") || t.includes("beschluss")) return { line1: "BESCHLUSS-", line2: "EMPFEHLUNG" };
    return { line1: "BERICHT", line2: "" };
  }

  if (batchClass === "regierung") {
    if (t.includes("fragestunde") || t.includes("schriftlich")) return { line1: "SCHRIFTL.", line2: "FRAGEN" };
    if (t.includes("verordnung")) return { line1: "VER-", line2: "ORDNUNG" };
    if (t.includes("eu") || t.includes("vorlage")) return { line1: "EU-", line2: "VORLAGE" };
    return { line1: "REGIERUNGS-", line2: "DOKUMENT" };
  }

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

/**
 * Mappt dokumenttyp-Freitext oder batch_class auf einen Glossar-Slug.
 */
function dokumentSlug(batchClass: string, dokumenttyp: string | null): string | null {
  const t = (dokumenttyp ?? "").toLowerCase();
  if (t.includes("kleine anfrage")) return "kleine-anfrage";
  if (t.includes("große anfrage") || t.includes("grosse anfrage")) return "grosse-anfrage";
  if (t.includes("entschließung") || t.includes("entschliessung")) return "entschliessungsantrag";
  if (t.includes("antrag")) return "antrag";
  if (t.includes("gesetzentwurf") || t.includes("gesetz")) return "gesetzentwurf";
  if (t.includes("unterrichtung")) return "unterrichtung";
  if (t.includes("bericht")) return "bericht";
  if (t.includes("empfehlung") || t.includes("beschluss")) return "beschlussempfehlung";
  if (t.includes("antwort")) return "antwort-bundesregierung";
  // Fallback per batch_class
  if (batchClass === "klein") return "kleine-anfrage";
  if (batchClass === "gross") return "gesetzentwurf";
  if (batchClass === "antwort") return "antwort-bundesregierung";
  if (batchClass === "mittel") return "bericht";
  return null;
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
  FRAGE:     "text-blue-700 bg-blue-50",
  FORDERUNG: "text-orange-800 bg-orange-50",
  BEFUND:    "text-emerald-700 bg-emerald-50",
  REGELUNG:  "text-violet-700 bg-violet-50",
  PUNKT:     "text-zinc-600 bg-zinc-100",
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
    return renderSkeletonPage(skeleton, mitzeichner, berichterstatter);
  }

  const mitzeichner = getMitzeichnerForDrucksache(dsNr);
  const berichterstatter = getBerichterstatterForDrucksache(dsNr);
  const relatedSpeeches = getRelatedSpeechesForDrucksache(dsNr);
  const verfahren = getDrucksacheVerfahren(dsNr);
  const themenAehnliche = getDrucksacheThemenAehnliche(dsNr, ds.thema.join(", "), 6);
  const polls = getPollsForDrucksache(dsNr);
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

  const klasseLabel = klasseLabelMap[ds.batch_class] ?? ds.batch_class;
  const datumFormatted = formatDate(ds.datum);
  const dsNrPart1 = dsNr.split("/")[0];
  const dsNrPart2 = dsNr.split("/")[1];

  // Wer ist der Hauptträger? Erst Fraktion-Feld, dann größte Mitzeichner-Fraktion, dann Bundesregierung bei Klassen antwort/regierung
  const tragendeFraktion = ds.fraktion ?? (fraktionList[0]?.[0] ?? (ds.batch_class === "antwort" || ds.batch_class === "regierung" ? "Bundesregierung" : null));

  return (
    <main className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Breadcrumb */}
        <Link
          href="/design/linear/aktivitaeten"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-950 transition-colors mb-6"
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
                className="rounded-xl border-2 border-zinc-900 flex flex-col justify-between p-4 aspect-[2/2.7] text-zinc-50 w-[140px] sm:w-auto self-start"
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
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2 flex items-baseline gap-1.5 flex-wrap">
              <GlossarTerm slug="bundestag">Bundestag</GlossarTerm>
              <span className="text-zinc-300">·</span>
              <span>
                <GlossarTerm slug="wahlperiode">Wahlperiode</GlossarTerm> {dsNrPart1}
              </span>
              {ds.dokumenttyp && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-700 normal-case font-normal tracking-normal">
                    {(() => {
                      const slug = dokumentSlug(ds.batch_class, ds.dokumenttyp);
                      return slug ? <GlossarTerm slug={slug}>{ds.dokumenttyp}</GlossarTerm> : ds.dokumenttyp;
                    })()}
                  </span>
                </>
              )}
              {datumFormatted && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-700 normal-case font-normal tracking-normal num">{datumFormatted}</span>
                </>
              )}
            </div>

            <h1 className="text-[22px] sm:text-[28px] lg:text-[32px] font-semibold tracking-[-0.025em] text-zinc-950 leading-[1.15] mb-4 break-words hyphens-auto">
              {ds.titel ?? klasseLabel}
            </h1>

            {/* Träger */}
            {tragendeFraktion && (
              <div className="flex items-center gap-3 text-[13px] mb-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-zinc-700">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: partyColor(tragendeFraktion) }}
                  />
                  {tragendeFraktion === "Bundesregierung" ? (
                    <GlossarTerm slug="bundesregierung">
                      <span className="font-medium">{tragendeFraktion}</span>
                    </GlossarTerm>
                  ) : (
                    <GlossarTerm slug="fraktion">
                      <span className="font-medium">{tragendeFraktion}</span>
                    </GlossarTerm>
                  )}
                  <span className="text-zinc-400">
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
                  className="px-2 py-1 rounded text-[11px] font-medium text-zinc-700 bg-zinc-100"
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
                className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-[#1a3e72] hover:text-[#0f2a52] px-2.5 py-1 rounded-md border border-[#1a3e72]/25 hover:border-[#1a3e72]/40 bg-[#1a3e72]/5 hover:bg-[#1a3e72]/10 transition-colors w-fit"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={2.25} />
                Original-PDF auf bundestag.de
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>
            )}
          </div>
        </div>

        {/* ZUSAMMENFASSUNG */}
        {ds.zusammenfassung && (
          <section className="fade-in-up-2 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
              Was die Drucksache sagt
            </h2>
            <div className="prose-zinc max-w-none">
              <p className="text-[15px] text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">
                {ds.zusammenfassung}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-100 text-[11px] text-zinc-400">
              <Link href="/design/linear/methodik" className="hover:text-zinc-950 underline-offset-2 hover:underline">
                Methodik öffnen →
              </Link>
            </div>
          </section>
        )}

        {/* KERNINHALT mit Bullet-Type-Tags */}
        {ds.kerninhalt && ds.kerninhalt.length > 0 && (
          <section className="fade-in-up-3 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Kerninhalt
              </h2>
              <span className="num text-[11px] text-zinc-400">{ds.kerninhalt.length}</span>
            </div>
            <ul className="space-y-3">
              {ds.kerninhalt.map((b, i) => {
                const typ = bulletType(b, ds.batch_class);
                return (
                  <li key={i} className="flex gap-3 items-start text-[13.5px] leading-relaxed">
                    <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-wider uppercase ${bulletTypeColor[typ] ?? "text-zinc-600 bg-zinc-100"} mt-0.5`}>
                      {typ}
                    </span>
                    <span className="text-zinc-800">{b}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* GROSS-SPEZIFISCH: Regelung / Begründung / Auswirkung */}
        {(ds.regelung || ds.begruendung || ds.auswirkung) && (
          <section className="fade-in-up-3 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-5">
              Details
            </h2>
            <div className="space-y-5">
              {ds.regelung && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 uppercase tracking-wide mb-2">
                    Regelung
                  </h3>
                  <p className="text-[14px] text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">{ds.regelung}</p>
                </div>
              )}
              {ds.begruendung && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 uppercase tracking-wide mb-2">
                    Begründung
                  </h3>
                  <p className="text-[14px] text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">{ds.begruendung}</p>
                </div>
              )}
              {ds.auswirkung && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 uppercase tracking-wide mb-2">
                    Auswirkung
                  </h3>
                  <p className="text-[14px] text-zinc-800 leading-relaxed whitespace-pre-wrap break-words">{ds.auswirkung}</p>
                </div>
              )}
              {ds.betroffene_gruppen && (
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-950 uppercase tracking-wide mb-2">
                    Betroffene Gruppen
                  </h3>
                  <p className="text-[14px] text-zinc-800 leading-relaxed">{ds.betroffene_gruppen}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* MITZEICHNER mit Fraktionsverteilung */}
        {mitzTotal > 0 && (
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <GlossarTerm slug="mitzeichner">Mitgezeichnet</GlossarTerm>
              </h2>
              <span className="num text-[11px] text-zinc-400">{mitzTotal}</span>
            </div>

            {/* Fraktionsverteilung-Bar (nur bei >1 Fraktion) */}
            {fraktionList.length > 1 && (
              <div className="mb-5">
                <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 mb-2.5">
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
                    <span key={party} className="inline-flex items-center gap-1.5 text-zinc-600">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: partyColor(party) }} />
                      <span>{party}</span>
                      <span className="text-zinc-950 font-medium">{n}</span>
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
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <GlossarTerm slug="berichterstatter">Berichterstatter:innen</GlossarTerm>
              </h2>
              <span className="num text-[11px] text-zinc-400">{berichterstatter.length}</span>
            </div>
            <p className="text-[12px] text-zinc-500 leading-snug mb-5">
              Vom Ausschuss benannt — typischerweise 1 pro Fraktion. Diese Liste zeigt KEINE inhaltliche Zustimmung; die genannten Fraktionen können in der namentlichen Abstimmung sehr wohl dagegen stimmen.
            </p>
            <MitzeichnerGrid mitz={berichterstatter} />
          </section>
        )}

        {/* PLENAR-BEITRÄGE */}
        {relatedSpeeches.length > 0 && (
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Im <GlossarTerm slug="plenum">Plenum</GlossarTerm>
              </h2>
              <span className="num text-[11px] text-zinc-400">{relatedSpeeches.length}</span>
            </div>
            <ul className="space-y-2.5">
              {relatedSpeeches.slice(0, 12).map((r, i) => {
                const Icon = r.aktivitaetsart === "Rede" ? Mic : MessageSquare;
                return (
                  <li key={`${r.politician_id}-${i}`} className="flex items-baseline gap-3 text-[13px]">
                    <Icon className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" strokeWidth={2} />
                    <Link
                      href={`/design/linear/politiker/${r.politician_id}`}
                      className="text-zinc-950 hover:underline underline-offset-2 font-medium"
                    >
                      {r.first_name} {r.last_name}
                    </Link>
                    <span className="text-zinc-400">·</span>
                    <span className="text-zinc-500 text-[12px]">{r.aktivitaetsart}{r.typ ? ` (${r.typ})` : ""}</span>
                    {r.party_label && (
                      <span className="text-zinc-400 text-[11px]">
                        {r.party_label}
                      </span>
                    )}
                    {r.datum && (
                      <span className="text-zinc-400 text-[11px] num ml-auto">
                        {new Date(r.datum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    )}
                  </li>
                );
              })}
              {relatedSpeeches.length > 12 && (
                <li className="text-[11.5px] text-zinc-400 pl-6 pt-1">
                  + {relatedSpeeches.length - 12} weitere
                </li>
              )}
            </ul>
          </section>
        )}

        {/* NAMENTLICHE ABSTIMMUNG (wenn vorhanden) */}
        {polls.length > 0 && (
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-5">
              Namentliche Abstimmung{polls.length > 1 ? "en" : ""}
            </h2>
            <div className="space-y-5">
              {polls.map((p) => {
                const pct = (n: number) => `${((n / Math.max(p.total, 1)) * 100).toFixed(1)}%`;
                return (
                  <div key={p.poll_id}>
                    <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                      <Link
                        href={`/design/linear/abstimmungen/${p.poll_id}`}
                        className="text-[13.5px] font-medium text-zinc-950 hover:underline underline-offset-2"
                      >
                        {p.poll_label}
                      </Link>
                      <span className="text-[11px] text-zinc-400 num">
                        {new Date(p.poll_date + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 mb-2.5">
                      <div className="bg-emerald-500" style={{ width: pct(p.yes) }} title={`Ja: ${p.yes}`} />
                      <div className="bg-red-500" style={{ width: pct(p.no) }} title={`Nein: ${p.no}`} />
                      <div className="bg-amber-500" style={{ width: pct(p.abstain) }} title={`Enthaltung: ${p.abstain}`} />
                      <div className="bg-zinc-400" style={{ width: pct(p.noShow) }} title={`Abwesend: ${p.noShow}`} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] num">
                      <span className="inline-flex items-center gap-1.5 text-zinc-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ja <span className="text-zinc-950 font-medium">{p.yes}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Nein <span className="text-zinc-950 font-medium">{p.no}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Enthaltung <span className="text-zinc-950 font-medium">{p.abstain}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Abwesend <span className="text-zinc-950 font-medium">{p.noShow}</span>
                      </span>
                    </div>
                    {p.match_score < 0.5 && (
                      <p className="text-[10.5px] text-zinc-400 mt-2">
                        Verknüpfung automatisch erkannt (Confidence niedrig — bitte prüfen)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* VERFAHRENS-ZUSAMMENHANG (Antwort↔Anfrage) */}
        {(verfahren.parent || verfahren.children.length > 0) && (
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-5">
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
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: partyColor(ds.fraktion) }} />
                Weitere Drucksachen der {ds.fraktion}
              </h2>
              <span className="num text-[11px] text-zinc-400">{sameFraktion.length}</span>
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
          <section className="fade-in-up-4 bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Ähnliche Themen
              </h2>
              <span className="text-[11px] text-zinc-400">
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
          <div className="text-[11px] text-zinc-400 px-2 mb-4">
            Weitere unaufgenommene Themen-Tags (Audit):{" "}
            <span className="text-zinc-500">{ds.topic_drift_audit.join(" · ")}</span>
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
      <div className="max-w-5xl mx-auto px-5 py-8">
        <Link
          href="/design/linear/aktivitaeten"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-zinc-950 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Alle Aktivitäten
        </Link>

        <header className="mb-7">
          <div className="flex items-baseline gap-2 flex-wrap mb-2 text-[11px] uppercase tracking-wider font-medium text-zinc-500">
            <span>{skeleton.aktivitaetsart}</span>
            {skeleton.urheber && (
              <>
                <span className="text-zinc-300">·</span>
                <span>{skeleton.urheber}</span>
              </>
            )}
            <span className="text-zinc-300">·</span>
            <span className="num">{skeleton.drucksache_nr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight leading-tight">
            {skeleton.titel}
          </h1>
          {datumFormatted && (
            <p className="mt-2 text-[13px] text-zinc-500 num">{datumFormatted}</p>
          )}
        </header>

        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h2 className="text-[12px] font-semibold text-amber-900 uppercase tracking-wide mb-2">
            Analyse pending
          </h2>
          <p className="text-[14px] text-amber-900 leading-relaxed">
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
                  className="underline decoration-amber-400 hover:decoration-amber-900 font-medium inline-flex items-center gap-1"
                >
                  Original-PDF
                  <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                </a>
                .
              </>
            )}
          </p>
        </section>

        {mitzeichner.length > 0 && (
          <section className="bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <GlossarTerm slug="mitzeichner">Mitgezeichnet</GlossarTerm>
              </h2>
              <span className="num text-[11px] text-zinc-400">{mitzeichner.length}</span>
            </div>
            {fraktionList.length > 1 && (
              <div className="mb-5">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] num">
                  {fraktionList.map(([party, n]) => (
                    <span key={party} className="inline-flex items-center gap-1.5 text-zinc-600">
                      <span>{party}</span>
                      <span className="text-zinc-950 font-medium">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <MitzeichnerGrid mitz={mitzeichner} />
          </section>
        )}

        {berichterstatter.length > 0 && (
          <section className="bg-white rounded-2xl border border-zinc-200/70 p-7 mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                <GlossarTerm slug="berichterstatter">Berichterstatter:innen</GlossarTerm>
              </h2>
              <span className="num text-[11px] text-zinc-400">{berichterstatter.length}</span>
            </div>
            <p className="text-[12px] text-zinc-500 leading-snug mb-5">
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
  const klasseLabel = klasseLabelMap[ds.batch_class] ?? ds.batch_class;
  const datumF = formatDate(ds.datum);
  const dayDiff = ownDatum ? daysBetween(ownDatum, ds.datum) : null;

  return (
    <Link
      href={`/design/linear/aktivitaeten/${slug}`}
      className="block rounded-xl border border-zinc-200/70 bg-white hover:bg-zinc-50/50 hover:border-zinc-300 transition-colors p-4 group"
    >
      {prefix && (
        <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5 flex items-baseline justify-between gap-2">
          <span>{prefix}</span>
          {dayDiff !== null && dayDiff > 0 && (
            <span className="text-zinc-400 normal-case font-normal tracking-normal num">
              nach {dayDiff === 1 ? "1 Tag" : `${dayDiff} Tagen`}
            </span>
          )}
        </div>
      )}
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <span className="text-[11px] font-mono font-semibold text-zinc-950 num">
          {ds.drucksache_nr}
        </span>
        <span className="text-[10.5px] uppercase tracking-wider text-zinc-500">
          {klasseLabel}
        </span>
        {datumF && (
          <>
            <span className="text-zinc-300">·</span>
            <span className="text-[10.5px] text-zinc-400 num">{datumF}</span>
          </>
        )}
        {ds.tonalitaet && (
          <span className="ml-auto">
            <DrucksacheTonalityBadge slug={ds.tonalitaet} />
          </span>
        )}
      </div>
      {ds.titel && (
        <div className={`text-[13.5px] font-medium text-zinc-950 ${compact ? "line-clamp-2" : "line-clamp-3"} leading-snug group-hover:underline underline-offset-2`}>
          {ds.titel}
        </div>
      )}
      {!compact && ds.zusammenfassung && (
        <p className="text-[12.5px] text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
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
          href={`/design/linear/politiker/${m.politician_id}`}
          className="flex items-center gap-2.5 group min-w-0"
        >
          <span
            className="shrink-0 w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 inline-flex items-center justify-center text-[9.5px] font-semibold text-zinc-600"
            style={m.party_label ? { boxShadow: `0 0 0 1.5px ${partyColor(m.party_label)}` } : undefined}
          >
            {m.first_name.charAt(0)}{m.last_name.charAt(0)}
          </span>
          <span className="text-[12.5px] text-zinc-700 group-hover:text-zinc-950 transition-colors truncate">
            {m.first_name} {m.last_name}
          </span>
        </Link>
      ))}
      {mitz.length > 24 && (
        <div className="text-[12px] text-zinc-400 col-span-full mt-2">
          + {mitz.length - 24} weitere Mitzeichner:innen
        </div>
      )}
    </div>
  );
}
