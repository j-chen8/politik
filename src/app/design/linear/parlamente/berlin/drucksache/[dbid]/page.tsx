import { getBerlinDrucksacheDetail, getBerlinDsMitzeichner } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";

interface Props {
  params: Promise<{ dbid: string }>;
}

// Klassen-Label-Map: technisches Enum → bürgerverständlich
const KLASSE_LABEL: Record<string, string> = {
  anfrage_antwort: "Schriftliche Anfrage",
  antrag: "Antrag",
  gesetzentwurf: "Gesetzentwurf",
  vorlage_senat: "Senats-Vorlage",
  beschlussempfehlung_regex: "Beschlussempfehlung",
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

function fraktionColor(f: string | null): string {
  if (!f) return "bg-zinc-100 text-zinc-700";
  if (f.includes("CDU")) return "bg-zinc-100 text-zinc-900";
  if (f.includes("SPD")) return "bg-red-50 text-red-900";
  if (f.includes("GRÜNE")) return "bg-green-50 text-green-900";
  if (f.includes("LINKE")) return "bg-pink-50 text-pink-900";
  if (f.includes("AfD")) return "bg-blue-50 text-blue-900";
  if (f.includes("FDP")) return "bg-yellow-50 text-yellow-900";
  return "bg-zinc-100 text-zinc-700";
}

export default async function BerlinDrucksacheDetailPage({ params }: Props) {
  const { dbid } = await params;
  const ds = getBerlinDrucksacheDetail(dbid);
  if (!ds) notFound();

  const mitzeichner = getBerlinDsMitzeichner(dbid);
  const klasseLabel = KLASSE_LABEL[ds.klasse] ?? ds.klasse;
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

  return (
    <main className="page-wash min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back-Link */}
        <Link
          href="/design/linear/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Berlin-Übersicht
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {klasseLabel}
            </span>
            {ds.dokNr && (
              <span className="num text-[12px] text-zinc-400">Drucksache {ds.dokNr}</span>
            )}
            {datumFormatted && (
              <span className="num text-[12px] text-zinc-400">· {datumFormatted}</span>
            )}
          </div>

          {ds.titel && (
            <h1 className="text-[24px] font-medium text-zinc-950 leading-tight mb-3">
              {ds.titel}
            </h1>
          )}

          {/* Badges: Fraktion / Senatsverwaltung / Bezirk / Tonality */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {ds.fraktion && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium ${fraktionColor(ds.fraktion)}`}>
                {ds.fraktion}
              </span>
            )}
            {ds.einbringer && !ds.fraktion && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700">
                Einbringer: {ds.einbringer}
              </span>
            )}
            {ds.senatsverwaltung && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] text-zinc-700 bg-zinc-50 border border-zinc-200">
                SenV {ds.senatsverwaltung}
              </span>
            )}
            {ds.bezirkBezug && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] text-zinc-700 bg-zinc-50 border border-zinc-200">
                Bezirk: {ds.bezirkBezug}
              </span>
            )}
            {ds.adressat && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] text-zinc-700 bg-zinc-50 border border-zinc-200">
                Adressat: {ds.adressat}
              </span>
            )}
            {tonCfg && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium"
                style={{ color: tonCfg.color, backgroundColor: tonCfg.bg }}
                title={tonCfg.desc}
              >
                {tonCfg.label}
              </span>
            )}
          </div>

          {/* PDF-Link */}
          {ds.lokUrl && (
            <a
              href={ds.lokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-[12px] text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={2.25} />
              Original-PDF{ds.pages ? ` (${ds.pages} S.)` : ""}
              <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
            </a>
          )}
        </div>

        {/* Zusammenfassung */}
        {ds.zusammenfassung && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Zusammenfassung
            </h2>
            <p className="text-[14.5px] text-zinc-800 leading-relaxed whitespace-pre-wrap">
              {ds.zusammenfassung}
            </p>
          </section>
        )}

        {/* Kerninhalt — anfrage_antwort */}
        {ds.klasse === "anfrage_antwort" && (ds.kerninhaltFrage || ds.kerninhaltAntwort) && (
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ds.kerninhaltFrage && ds.kerninhaltFrage.length > 0 && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Was wurde gefragt?
                </h2>
                <ul className="space-y-2.5">
                  {ds.kerninhaltFrage.map((b, i) => (
                    <li key={`f-${i}`} className="flex gap-2.5">
                      <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BULLET_COLOR[bulletType(b, ds.klasse, "frage")]}`}>
                        {bulletType(b, ds.klasse, "frage")}
                      </span>
                      <span className="text-[13.5px] text-zinc-800 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ds.kerninhaltAntwort && ds.kerninhaltAntwort.length > 0 && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Was hat der Senat geantwortet?
                </h2>
                <ul className="space-y-2.5">
                  {ds.kerninhaltAntwort.map((b, i) => (
                    <li key={`a-${i}`} className="flex gap-2.5">
                      <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BULLET_COLOR[bulletType(b, ds.klasse, "antwort")]}`}>
                        {bulletType(b, ds.klasse, "antwort")}
                      </span>
                      <span className="text-[13.5px] text-zinc-800 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Kerninhalt — antrag / vorlage_senat */}
        {ds.klasse !== "anfrage_antwort" && ds.kerninhalt && ds.kerninhalt.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              {ds.klasse === "antrag" ? "Konkrete Forderungen" : "Kerninhalt"}
            </h2>
            <ul className="space-y-2.5">
              {ds.kerninhalt.map((b, i) => (
                <li key={`k-${i}`} className="flex gap-2.5">
                  <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BULLET_COLOR[bulletType(b, ds.klasse)]}`}>
                    {bulletType(b, ds.klasse)}
                  </span>
                  <span className="text-[13.5px] text-zinc-800 leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Gesetzentwurf-spezifisch: regelung / begruendung / auswirkung / betroffene */}
        {ds.klasse === "gesetzentwurf" && (
          <section className="mb-8 space-y-6">
            {ds.regelung && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Was wird geregelt?</h2>
                <p className="text-[14px] text-zinc-800 leading-relaxed">{ds.regelung}</p>
              </div>
            )}
            {ds.begruendung && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Begründung</h2>
                <p className="text-[14px] text-zinc-800 leading-relaxed">{ds.begruendung}</p>
              </div>
            )}
            {ds.auswirkung && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Auswirkungen</h2>
                <p className="text-[14px] text-zinc-800 leading-relaxed">{ds.auswirkung}</p>
              </div>
            )}
            {ds.betroffeneGruppen && (
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Betroffene Gruppen</h2>
                <p className="text-[14px] text-zinc-800 leading-relaxed">{ds.betroffeneGruppen}</p>
              </div>
            )}
          </section>
        )}

        {/* Themen-Tags */}
        {ds.thema.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Themen
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {ds.thema.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] text-zinc-700 bg-zinc-100"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Mitzeichner */}
        {mitzeichner.length > 0 && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Beteiligte Abgeordnete ({mitzeichner.length})
            </h2>
            {fraktionList.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-zinc-500">
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
                    href={`/design/linear/politiker/${m.politicianId}`}
                    className="text-zinc-900 hover:text-blue-700 transition-colors"
                  >
                    {m.firstName} {m.lastName}
                  </Link>
                  {m.partyLabel && (
                    <span className="text-[10.5px] text-zinc-400">({m.partyLabel})</span>
                  )}
                  <span className="text-[10.5px] text-zinc-400 uppercase tracking-wider">{m.role}</span>
                </li>
              ))}
              {mitzeichner.length > 25 && (
                <li className="text-[11px] text-zinc-400 italic mt-1">
                  + {mitzeichner.length - 25} weitere
                </li>
              )}
            </ul>
          </section>
        )}

        {/* Beschlussempfehlung-Regex (kein LLM-Output, regex_label) */}
        {ds.klasse === "beschlussempfehlung_regex" && (
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Outcome (Regex-Label)
            </h2>
            <span className="inline-flex items-center px-3 py-1.5 rounded text-[14px] font-medium bg-zinc-100 text-zinc-900">
              {ds.regexLabel ?? "—"}
            </span>
            {ds.zusammenfassung && (
              <p className="mt-2 text-[12.5px] text-zinc-600">{ds.zusammenfassung}</p>
            )}
          </section>
        )}

        {/* Audit-Footer (klein, methodisch) */}
        <section className="mt-12 pt-6 border-t border-zinc-100 text-[11px] text-zinc-400">
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
