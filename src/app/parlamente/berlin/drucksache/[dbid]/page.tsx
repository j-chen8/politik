import { getBerlinDrucksacheDetail, getBerlinDsMitzeichner, getBerlinDsVotes, getBerlinDsPlenarbehandlungen, getBerlinDsVorgang } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Check, X, Minus, HelpCircle, MessageCircle, GitBranch } from "lucide-react";

interface Props {
  params: Promise<{ dbid: string }>;
}

// Klassen-Label-Map: technisches Enum → bürgerverständlich
const KLASSE_LABEL: Record<string, string> = {
  anfrage_antwort: "Schriftliche Anfrage",
  antrag: "Antrag",
  gesetzentwurf: "Gesetzentwurf",
  vorlage_senat: "Senats-Vorlage",
  beschlussempfehlung: "Beschlussempfehlung",
  beschlussempfehlung_regex: "Beschlussempfehlung",
};

// Ausschuss-Haltung (Beschlussempfehlung-LLM v1.5)
const HALTUNG_MAP: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  empfehlung_unveraendert_annahme:    { label: "Annahme empfohlen",           color: "#15803d", bg: "#dcfce7", desc: "Ausschuss empfiehlt die Vorlage unverändert anzunehmen" },
  empfehlung_mit_aenderungen_annahme: { label: "Annahme mit Änderungen",      color: "#9a3412", bg: "#ffedd5", desc: "Ausschuss empfiehlt Annahme mit konkreten Modifikationen" },
  empfehlung_ablehnung:               { label: "Ablehnung empfohlen",         color: "#b91c1c", bg: "#fee2e2", desc: "Ausschuss empfiehlt die Vorlage abzulehnen" },
  kenntnisnahme:                      { label: "Zur Kenntnisnahme",           color: "#475569", bg: "#f1f5f9", desc: "Ausschuss empfiehlt nur Kenntnisnahme, kein Beschluss" },
};

// Tonality- & antwort_charakter-Map mit Farben (kompatibel mit Bundes-DS-Page)
const TON_MAP: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  sachlich:       { label: "sachlich",       color: "#374151", bg: "#f3f4f6", desc: "Neutrale Darstellung ohne wertende Sprache" },
  fordernd:       { label: "fordernd",       color: "#9a3412", bg: "#ffedd5", desc: "Klare Forderungen / Handlungsaufrufe an den Senat" },
  kritisch:       { label: "kritisch",       color: "#b91c1c", bg: "#fee2e2", desc: "Kritisierende Sprache, Hinterfragen von Praktiken / Entscheidungen" },
  informierend:   { label: "informierend",   color: "#1e40af", bg: "#dbeafe", desc: "Sach-Information / Verfahrenshinweise" },
  substantiell:   { label: "substantiell",   color: "#15803d", bg: "#dcfce7", desc: "Antwort mit konkreten Zahlen / Fakten" },
  teilantwortend: { label: "teilantwortend", color: "#475569", bg: "#f1f5f9", desc: "Teils geantwortet, teils auf andere Stellen verwiesen" },
  ausweichend:    { label: "ausweichend",    color: "#a16207", bg: "#fef3c7", desc: "Antwort verweist überwiegend auf Geheimhaltung / Datenlücken / Bezirke" },
};

// Bullet-Type-Annotation für Kerninhalt (heuristisch, klassen-aware)
function bulletType(s: string, klasse: string, frageOderAntwort?: "frage" | "antwort"): string {
  const t = s.toLowerCase();
  if (frageOderAntwort === "frage") return "FRAGE";
  if (frageOderAntwort === "antwort") return "BEFUND";
  if (t.endsWith("?") || /^(wie|welche|warum|wer|ob|inwiefern|wann|wo)\s/.test(t)) return "FRAGE";
  if (/\b(fordert|verlangt|verlangen|fordern|sollen?|muss|müssen)\b/.test(t)) return "FORDERUNG";
  if (klasse === "antrag") return "FORDERUNG";
  if (klasse === "gesetzentwurf") return "REGELUNG";
  if (klasse === "vorlage_senat") return "BEFUND";
  return "PUNKT";
}

const BULLET_COLOR: Record<string, string> = {
  FRAGE:     "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
  FORDERUNG: "text-orange-800 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40",
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

// Vote-Pill-Styles für die 6 Fraktionen
const VOTE_PILL_STYLES: Record<string, { bg: string; text: string; icon: typeof Check }> = {
  ja:         { bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50", text: "text-emerald-800 dark:text-emerald-400", icon: Check },
  nein:       { bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50",         text: "text-red-800 dark:text-red-400",     icon: X },
  enthaltung: { bg: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/50",   text: "text-yellow-800 dark:text-yellow-400",  icon: Minus },
  unbekannt:  { bg: "bg-zinc-50 dark:bg-zinc-800 border-border",       text: "text-zinc-500 dark:text-zinc-400",    icon: HelpCircle },
};

const VOTE_LABEL: Record<string, string> = {
  ja: "ja", nein: "nein", enthaltung: "enth.", unbekannt: "?",
};

const OUTCOME_LABEL: Record<string, { label: string; tone: string }> = {
  annahme:           { label: "angenommen",           tone: "text-emerald-700 dark:text-emerald-400" },
  annahme_geaendert: { label: "in geänderter Fassung angenommen", tone: "text-emerald-700 dark:text-emerald-400" },
  ablehnung:         { label: "abgelehnt",            tone: "text-red-700 dark:text-red-400" },
  vertagung:         { label: "vertagt",              tone: "text-amber-700 dark:text-amber-400" },
  ueberweisung:      { label: "an Ausschuss überwiesen", tone: "text-blue-700 dark:text-blue-400" },
  kein_vote:         { label: "kein Vote",            tone: "text-zinc-500 dark:text-zinc-400" },
};

const FRAKTIONS_ORDER = ["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP"] as const;

function fraktionColor(f: string | null): string {
  if (!f) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
  if (f.includes("CDU")) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100";
  if (f.includes("SPD")) return "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300";
  if (f.includes("GRÜNE")) return "bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-300";
  if (f.includes("LINKE")) return "bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-300";
  if (f.includes("AfD")) return "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300";
  if (f.includes("FDP")) return "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-300";
  return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
}

// Dunkle Hex-Farbe je Fraktion für den Dokument-Kachel-Gradienten (weiße Schrift lesbar).
function berlinPartyColor(f: string | null | undefined): string {
  if (!f) return "#1a3e72";
  if (f.includes("CDU")) return "#18181b";
  if (f.includes("SPD")) return "#c2102a";
  if (f.includes("GRÜNE")) return "#15803d";
  if (f.includes("LINKE")) return "#a3195b";
  if (f.includes("AfD")) return "#0a4d8c";
  if (f.includes("FDP")) return "#a16207";
  return "#1a3e72";
}

// Zweizeilige Kachel-Überschrift je Drucksachen-Klasse.
const COVER_LINES: Record<string, [string, string | undefined]> = {
  anfrage_antwort: ["SCHRIFTL.", "ANFRAGE"],
  antrag: ["ANTRAG", undefined],
  gesetzentwurf: ["GESETZ-", "ENTWURF"],
  vorlage_senat: ["SENATS-", "VORLAGE"],
  beschlussempfehlung: ["BESCHLUSS-", "EMPFEHLUNG"],
  beschlussempfehlung_regex: ["BESCHLUSS-", "EMPFEHLUNG"],
};

export default async function BerlinDrucksacheDetailPage({ params }: Props) {
  const { dbid } = await params;
  const ds = getBerlinDrucksacheDetail(dbid);
  if (!ds) notFound();

  const mitzeichner = getBerlinDsMitzeichner(dbid);
  const votes = getBerlinDsVotes(dbid);
  const plenarbehandlungen = getBerlinDsPlenarbehandlungen(dbid);
  const vorgang = getBerlinDsVorgang(dbid);
  // Amtlicher PARDOK-Typ (dok_typ_label) zuerst — präziser als die 5-Bucket-klasse
  // (z.B. Verordnung/Änderungsantrag/Mitteilung zur Kenntnisnahme statt nur
  // "Senats-Vorlage"/"Antrag"). klasse bleibt für die Render-Logik. KLASSE_LABEL
  // nur Fallback, falls dok_typ_label fehlt.
  const klasseLabel = (ds.dokTypLabel?.trim() || KLASSE_LABEL[ds.klasse]) ?? ds.klasse;
  const tonValue = ds.antwortCharakter ?? ds.tonalitaet;
  const tonCfg = tonValue ? TON_MAP[tonValue] : null;
  const datumFormatted = formatDate(ds.datum);

  // Mitzeichner-Fraktion-Verteilung
  const fraktionCounts = new Map<string, number>();
  for (const m of mitzeichner) {
    const k = m.partyLabel ?? "fraktionslos";
    fraktionCounts.set(k, (fraktionCounts.get(k) ?? 0) + 1);
  }
  const fraktionList = Array.from(fraktionCounts.entries()).sort((a, b) => b[1] - a[1]);

  const cover = COVER_LINES[ds.klasse] ?? [klasseLabel.toUpperCase(), undefined];
  const coverColor = berlinPartyColor(ds.fraktion);

  return (
    <main className="page-wash min-h-screen">
      <div className="page-shell">
        {/* Back-Link */}
        <Link
          href="/parlamente/berlin/drucksachen"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Aktivitäten
        </Link>

        {/* HERO — Dokument-Kachel + Titel-Block (wie Bundestag) */}
        <div className="fade-in-up flex flex-col sm:grid sm:grid-cols-[170px_1fr] gap-6 sm:gap-8 mb-10">
          {/* Stilisierte Dokument-Kachel */}
          <div
            className="rounded-xl border-2 border-zinc-900 dark:border-zinc-100 flex flex-col justify-between p-4 aspect-[2/2.7] text-zinc-50 w-[140px] sm:w-auto self-start"
            style={{ background: `linear-gradient(135deg, ${coverColor} 0%, ${coverColor}cc 60%, #18181b 100%)` }}
          >
            <div className="font-bold uppercase tracking-tight leading-[0.95]">
              <div className={cover[0].length > 10 ? "text-[15px]" : "text-[20px]"}>{cover[0]}</div>
              {cover[1] && (
                <div className={cover[1].length > 11 ? "text-[14px] mt-0.5" : "text-[19px] mt-0.5"}>{cover[1]}</div>
              )}
            </div>
            <div className="num font-mono tracking-tight text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-70 mb-1">
                <span title="Drucksachen-Nummer: offizielles Aktenzeichen (Wahlperiode/laufende Nummer).">Drs.</span>
              </div>
              <div className="text-[22px] font-bold leading-none">{ds.dokNr ?? "—"}</div>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider opacity-80 text-right">
              {ds.pages ? `${ds.pages} S.` : ""}
            </div>
          </div>

          {/* Titel + Eigenschaften */}
          <div className="flex flex-col min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-baseline gap-1.5 flex-wrap">
              Abgeordnetenhaus Berlin
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span>19. Wahlperiode</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="text-zinc-700 dark:text-zinc-300 normal-case font-normal tracking-normal">{klasseLabel}</span>
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
            {(ds.fraktion || ds.einbringer) && (
              <div className="flex items-center gap-3 text-[13px] mb-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: coverColor }} />
                  <span className="font-medium">{ds.fraktion ?? ds.einbringer}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {ds.klasse === "anfrage_antwort" ? "fragt" : ds.klasse === "vorlage_senat" ? "vorgelegt" : "eingebracht"}
                  </span>
                </span>
              </div>
            )}

            {/* Chips: Tonalität + Senatsverwaltung / Bezirk / Adressat + Themen */}
            <div className="flex items-center gap-2 flex-wrap">
              {tonCfg && (
                <span
                  className="px-2 py-1 rounded text-[11px] font-medium"
                  style={{ color: tonCfg.color, backgroundColor: tonCfg.bg }}
                  title={tonCfg.desc}
                >
                  {tonCfg.label}
                </span>
              )}
              {ds.senatsverwaltung && (
                <span className="px-2 py-1 rounded text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-border">SenV {ds.senatsverwaltung}</span>
              )}
              {ds.bezirkBezug && (
                <span className="px-2 py-1 rounded text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-border">Bezirk: {ds.bezirkBezug}</span>
              )}
              {ds.adressat && (
                <span className="px-2 py-1 rounded text-[11px] text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 border border-border">Adressat: {ds.adressat}</span>
              )}
              {ds.thema.map((t) => (
                <span key={t} className="px-2 py-1 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800">{t}</span>
              ))}
            </div>

            {/* PDF-Link */}
            {ds.lokUrl && (
              <a
                href={ds.lokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-800/50 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors w-fit"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={2.25} />
                Original-PDF{ds.pages ? ` (${ds.pages} S.)` : ""}
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>
            )}
          </div>
        </div>

        {/* Zusammenfassung */}
        {ds.zusammenfassung && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Zusammenfassung
            </h2>
            <p className="text-[14.5px] text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {ds.zusammenfassung}
            </p>
          </section>
        )}

        {/* Kerninhalt — anfrage_antwort */}
        {ds.klasse === "anfrage_antwort" && (ds.kerninhaltFrage || ds.kerninhaltAntwort) && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ds.kerninhaltFrage && ds.kerninhaltFrage.length > 0 && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  Was wurde gefragt?
                </h2>
                <ul className="space-y-2.5">
                  {ds.kerninhaltFrage.map((b, i) => (
                    <li key={`f-${i}`} className="flex gap-2.5">
                      <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BULLET_COLOR[bulletType(b, ds.klasse, "frage")]}`}>
                        {bulletType(b, ds.klasse, "frage")}
                      </span>
                      <span className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ds.kerninhaltAntwort && ds.kerninhaltAntwort.length > 0 && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                  Was hat der Senat geantwortet?
                </h2>
                <ul className="space-y-2.5">
                  {ds.kerninhaltAntwort.map((b, i) => (
                    <li key={`a-${i}`} className="flex gap-2.5">
                      <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BULLET_COLOR[bulletType(b, ds.klasse, "antwort")]}`}>
                        {bulletType(b, ds.klasse, "antwort")}
                      </span>
                      <span className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Kerninhalt — antrag / vorlage_senat / beschlussempfehlung */}
        {ds.klasse !== "anfrage_antwort" && ds.kerninhalt && ds.kerninhalt.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              {ds.klasse === "antrag" ? "Konkrete Forderungen"
                : ds.klasse === "beschlussempfehlung" ? "Empfohlene Änderungen / Auflagen"
                : "Kerninhalt"}
            </h2>
            <ul className="space-y-2.5">
              {ds.kerninhalt.map((b, i) => (
                <li key={`k-${i}`} className="flex gap-2.5">
                  <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BULLET_COLOR[bulletType(b, ds.klasse)]}`}>
                    {bulletType(b, ds.klasse)}
                  </span>
                  <span className="text-[13.5px] text-zinc-800 dark:text-zinc-200 leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Gesetzentwurf-spezifisch: regelung / begruendung / auswirkung / betroffene */}
        {ds.klasse === "gesetzentwurf" && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6 space-y-6">
            {ds.regelung && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Was wird geregelt?</h2>
                <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed">{ds.regelung}</p>
              </div>
            )}
            {ds.begruendung && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Begründung</h2>
                <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed">{ds.begruendung}</p>
              </div>
            )}
            {ds.auswirkung && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Auswirkungen</h2>
                <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed">{ds.auswirkung}</p>
              </div>
            )}
            {ds.betroffeneGruppen && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Betroffene Gruppen</h2>
                <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed">{ds.betroffeneGruppen}</p>
              </div>
            )}
          </section>
        )}

        {/* Vorgang — die ganze Verfahrenskette (Antrag → … → Beschlussempfehlung → Beschluss) */}
        {vorgang && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
              <GitBranch className="w-3 h-3" strokeWidth={2.25} />
              Vorgang
            </h2>
            {vorgang.titel && (
              <p className="text-[13px] text-zinc-700 dark:text-zinc-200 mb-3 leading-snug">{vorgang.titel}</p>
            )}
            <ol className="relative border-l border-border ml-1.5 space-y-1">
              {vorgang.schritte.map((s, i) => {
                const dateStr = s.datum
                  ? new Date(s.datum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
                  : null;
                const inner = (
                  <div className={`flex items-baseline gap-2 flex-wrap text-[12px] ${s.isSelf ? "font-medium text-zinc-950 dark:text-zinc-50" : ""}`}>
                    <span className={`${s.linkable ? "text-blue-700 dark:text-blue-400 group-hover:underline" : s.isSelf ? "" : "text-zinc-600 dark:text-zinc-300"}`}>
                      {s.dokTypLabel ?? "Dokument"}
                    </span>
                    {s.dokNr && /\/\d/.test(s.dokNr) && <span className="num text-zinc-400 dark:text-zinc-500">Drs. {s.dokNr}</span>}
                    {dateStr && <span className="num text-zinc-400 dark:text-zinc-500">· {dateStr}</span>}
                    {s.isSelf && (
                      <span className="ml-auto text-[10px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        diese Drucksache
                      </span>
                    )}
                  </div>
                );
                return (
                  <li key={`${s.dbid}-${i}`} className="relative pl-4 py-1">
                    <span className={`absolute -left-[5px] top-2.5 w-2 h-2 rounded-full ${s.isSelf ? "bg-blue-600 dark:bg-blue-400" : s.linkable ? "bg-zinc-400 dark:bg-zinc-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                    {s.linkable ? (
                      <Link href={`/parlamente/berlin/drucksache/${s.dbid}`} className="group block">
                        {inner}
                        {s.titel && <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">{s.titel}</p>}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Plenarbehandlungen — wann + wo wurde diese Drucksache debattiert? */}
        {plenarbehandlungen.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
              <MessageCircle className="w-3 h-3" strokeWidth={2.25} />
              Plenarbehandlung{plenarbehandlungen.length > 1 ? "en" : ""}
            </h2>
            <ul className="space-y-2">
              {plenarbehandlungen.map((p) => (
                <li key={`${p.sitzungNr}-${p.topMarker}`} className="border border-border rounded-lg p-3 bg-card">
                  <div className="flex items-baseline gap-2 flex-wrap text-[12px]">
                    <Link
                      href={`/parlamente/berlin/sitzung/${p.sitzungNr}#top-${p.topMarker}`}
                      className="font-medium text-zinc-950 dark:text-zinc-50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                    >
                      Sitzung {p.sitzungNr}
                    </Link>
                    <span className="text-zinc-400 dark:text-zinc-500 num">·</span>
                    <span className="text-zinc-600 dark:text-zinc-300 num">
                      {new Date(p.datum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500">·</span>
                    <span className="num text-zinc-500 dark:text-zinc-400">TOP {p.topMarker}</span>
                    <span className="text-zinc-400 dark:text-zinc-500">·</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{p.redenCount} Reden</span>
                    {p.phase === "priorität" && (
                      <span className="ml-auto text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        Priorität
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-snug mt-1">
                    {p.topTitel}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Plenum-Abstimmungen */}
        {votes.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Abstimmung{votes.length > 1 ? "en" : ""} im Plenum
            </h2>
            <div className="space-y-4">
              {votes.map((v) => {
                const outcomeCfg = OUTCOME_LABEL[v.outcome] ?? { label: v.outcome, tone: "text-zinc-700 dark:text-zinc-300" };
                const datumLabel = formatDate(v.datum);
                return (
                  <div key={v.voteId} className="border border-border rounded-lg p-4">
                    {v.voteLabel && (
                      <div className="mb-1.5 text-[12.5px] font-medium text-zinc-900 dark:text-zinc-100">
                        {v.voteLabel}
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 mb-3 flex-wrap text-[11px]">
                      <span className={`font-semibold ${outcomeCfg.tone}`}>
                        {outcomeCfg.label}
                      </span>
                      {v.modus && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-zinc-500 dark:text-zinc-400">{v.modus}</span>
                        </>
                      )}
                      {v.voteType !== "handzeichen" && v.voteType !== "unklar" && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-zinc-500 dark:text-zinc-400">{v.voteType === "namentlich" ? "namentliche Abstimmung" : "Hammelsprung"}</span>
                        </>
                      )}
                      {datumLabel && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-zinc-400 dark:text-zinc-500 num">{datumLabel}</span>
                        </>
                      )}
                      {v.sitzungNr && (
                        <span className="text-zinc-400 dark:text-zinc-500 num">Sitzung {v.sitzungNr}</span>
                      )}
                    </div>

                    {/* Fraktions-Vote-Pills */}
                    {v.fraktionVotes && (
                      <div className="flex flex-wrap gap-1.5">
                        {FRAKTIONS_ORDER.map((f) => {
                          const vote = v.fraktionVotes?.[f] ?? "unbekannt";
                          const cfg = VOTE_PILL_STYLES[vote] ?? VOTE_PILL_STYLES.unbekannt;
                          const Icon = cfg.icon;
                          return (
                            <span
                              key={f}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
                              title={`${f}: ${vote}`}
                            >
                              <span className="font-semibold">{f}</span>
                              <Icon className="w-3 h-3" strokeWidth={2.5} />
                              <span className="text-[10px]">{VOTE_LABEL[vote]}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Bei namentlicher Abstimmung: aggregierte Zahlen */}
                    {v.stimmenZahlen && (
                      <div className="mt-3 flex gap-4 text-[11px] text-zinc-600 dark:text-zinc-300 num">
                        <span>Ja: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{v.stimmenZahlen.ja}</span></span>
                        <span>Nein: <span className="font-semibold text-red-700 dark:text-red-400">{v.stimmenZahlen.nein}</span></span>
                        <span>Enthaltung: <span className="font-semibold text-yellow-700 dark:text-yellow-400">{v.stimmenZahlen.enthaltungen}</span></span>
                      </div>
                    )}

                    {/* Block-Vote-Hinweis: alle DS klickbar verlinkt */}
                    {v.drucksacheNrn.length > 1 && (
                      <div className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-wrap items-baseline gap-1.5">
                        <span>Block-Abstimmung über {v.drucksacheNrn.length} Drucksachen:</span>
                        {v.drucksacheNrn.map((nr, i) => {
                          const linkedDbid = v.drucksacheDbids[i] ?? null;
                          if (!linkedDbid) {
                            return <span key={nr} className="font-mono text-zinc-700 dark:text-zinc-300">{nr}</span>;
                          }
                          return (
                            <Link
                              key={nr}
                              href={`/parlamente/berlin/drucksache/${linkedDbid}`}
                              className="font-mono text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                            >
                              {nr}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Mitzeichner */}
        {mitzeichner.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Beteiligte Abgeordnete ({mitzeichner.length})
            </h2>
            {fraktionList.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                {fraktionList.map(([f, c]) => (
                  <span key={f}>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${fraktionColor(f)}`}>{f}</span>
                    <span className="ml-1 num">{c}</span>
                  </span>
                ))}
              </div>
            )}
            <ul className="space-y-1">
              {mitzeichner.slice(0, 25).map((m) => (
                <li key={`${m.politicianId}-${m.role}`} className="flex items-baseline gap-2 text-[13px]">
                  <Link
                    href={`/politiker/${m.politicianId}`}
                    className="text-zinc-900 dark:text-zinc-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  >
                    {m.firstName} {m.lastName}
                  </Link>
                  {m.partyLabel && (
                    <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500">({m.partyLabel})</span>
                  )}
                  <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{m.role}</span>
                </li>
              ))}
              {mitzeichner.length > 25 && (
                <li className="text-[11px] text-zinc-400 dark:text-zinc-500 italic mt-1">
                  + {mitzeichner.length - 25} weitere
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Beschlussempfehlung — LLM-Klasse mit Ausschuss-Haltung-Pill */}
        {ds.klasse === "beschlussempfehlung" && ds.tonalitaet && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Ausschuss-Empfehlung
            </h2>
            {(() => {
              const h = HALTUNG_MAP[ds.tonalitaet];
              if (!h) return <span className="text-[14px] text-zinc-700 dark:text-zinc-300">{ds.tonalitaet}</span>;
              return (
                <div>
                  <span
                    className="inline-flex items-center px-3 py-1.5 rounded text-[14px] font-medium"
                    style={{ color: h.color, backgroundColor: h.bg }}
                    title={h.desc}
                  >
                    {h.label}
                  </span>
                  <p className="mt-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">{h.desc}</p>
                </div>
              );
            })()}
            {ds.regexLabel && (
              <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                Outcome aus Plenum (Regex): <span className="font-mono">{ds.regexLabel}</span>
              </p>
            )}
          </section>
        )}

        {/* Beschlussempfehlung-Regex Legacy (kein LLM-Output) — Fallback bis Batch durch ist */}
        {ds.klasse === "beschlussempfehlung_regex" && (
          <section className="bg-card rounded-2xl border border-border p-7 mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Outcome (Regex-Label)
            </h2>
            <span className="inline-flex items-center px-3 py-1.5 rounded text-[14px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              {ds.regexLabel ?? "—"}
            </span>
            {ds.zusammenfassung && (
              <p className="mt-2 text-[12.5px] text-zinc-600 dark:text-zinc-300">{ds.zusammenfassung}</p>
            )}
          </section>
        )}

        {/* Audit-Footer (klein, methodisch) */}
        <section className="mt-12 pt-6 border-t border-border text-[11px] text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span>Analysiert mit {ds.model ?? "—"}</span>
            <span>·</span>
            <span className="num">{ds.promptVersion ?? "—"}</span>
            {ds.vorgangId && (
              <>
                <span>·</span>
                <span>Vorgang {ds.vorgangId}</span>
              </>
            )}
          </div>
          {ds.topicDrift && ds.topicDrift.length > 0 && (
            <div className="mt-2">
              Drift-Tags (vom LLM erfunden, nicht im Glossar):{" "}
              {ds.topicDrift.map((t, i) => (
                <span key={t} className="font-mono">
                  {i > 0 && ", "}
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
