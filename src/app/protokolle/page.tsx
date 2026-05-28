import Link from "next/link";
import {
  getProtokollOverview,
  getPlenarSessions,
  getAusschussStats,
  getTopAusschussAttendees,
  getPlenarTypeStats,
  getPartyContributionMatrix,
  getTopSpeakersWithBreakdown,
  getAusschussCoverage,
  PLENAR_TYPE_SLUG_LABEL,
} from "@/lib/db";
import { ArrowRight } from "lucide-react";
import { SpeakerExplorer } from "./SpeakerExplorer";

const PARTY_SHORT: Record<string, string> = {
  "CDU/CSU": "CDU/CSU",
  AfD: "AfD",
  SPD: "SPD",
  "Die Linke": "Linke",
  "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
  fraktionslos: "fraktionslos",
};

// Per-party tint for the breakdown bars. Ordered by typ-slug.
// Uses tailwind palette via inline style fallback to ensure JIT picks them up.
const PARTY_COLOR: Record<string, { dot: string; tints: string[] }> = {
  "CDU/CSU": { dot: "bg-zinc-900", tints: ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"] },
  SPD: { dot: "bg-red-600", tints: ["#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"] },
  AfD: { dot: "bg-sky-700", tints: ["#0369a1", "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"] },
  "BÜNDNIS 90/DIE GRÜNEN": { dot: "bg-green-600", tints: ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"] },
  "Die Linke": { dot: "bg-pink-600", tints: ["#be185d", "#db2777", "#ec4899", "#f472b6", "#f9a8d4", "#fbcfe8"] },
  fraktionslos: { dot: "bg-zinc-400", tints: ["#52525b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7", "#f4f4f5"] },
};
const TYP_ORDER = ["reden", "regierungserklaerungen", "antworten", "fragen", "debattenbeitraege", "erklaerungen"] as const;

// Normalize accidental NBSP / soft-hyphen casings before short-name lookup.
function shortPartyName(raw: string | null | undefined): string {
  if (!raw) return "—";
  const cleaned = raw.replace(/ /g, " ").replace(/­/g, "").trim();
  return PARTY_SHORT[cleaned] || cleaned;
}

export default function ProtokollePage() {
  const overview = getProtokollOverview();
  const partyMatrix = getPartyContributionMatrix();
  const sessions = getPlenarSessions();
  const ausschussStats = getAusschussStats();
  const topAttendees = getTopAusschussAttendees(0);
  const coverage = getAusschussCoverage();
  const mdbsMissing = coverage.mdbsTotal - coverage.mdbsLinked;
  const typeStats = getPlenarTypeStats();
  const typeStatsTotal = typeStats.reduce((s, t) => s + t.count, 0);
  const allSpeakers = getTopSpeakersWithBreakdown(0);

  const maxAttendance = Math.max(...topAttendees.map((a) => a.sitzungen), 1);
  const maxAus = Math.max(...ausschussStats.map((a) => a.sitzungen), 1);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-12 fade-in-up">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">
            Protokolle
          </h1>
          <p className="text-[14px] text-zinc-500">
            <span className="num text-zinc-700 font-medium">{overview.plenarSessions}</span> Plenar- und{" "}
            <span className="num text-zinc-700 font-medium">{overview.ausschussSessions}</span> Ausschuss-Sitzungen der 21. Wahlperiode
          </p>
        </div>

        {/* Overview strip */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <Stat
              label="Plenar-Sitzungen"
              value={overview.plenarSessions.toString()}
              href="/protokolle/sitzungen"
            />
            <Stat label="Beiträge" value={overview.plenarSpeeches.toLocaleString("de-DE")} />
            <Stat label="Sprecher" value={overview.plenarSpeakers.toString()} />
            <Stat label="Ausschuss-Sitzungen" value={overview.ausschussSessions.toString()} />
            <Stat label="Anwesenheiten" value={overview.ausschussAttendees.toLocaleString("de-DE")} />
            <Stat
              label="Tagesordnungs­punkte"
              hint="abgekürzt TOPs — einzelne Themen einer Sitzung"
              value={overview.ausschussTopics.toLocaleString("de-DE")}
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Ausschuss-Zahlen: nur veröffentlichte Protokolle — nicht jede Sitzung wird publiziert.{" "}
            <span className="hidden sm:inline">·</span>{" "}
            <span className="text-zinc-500">Tagesordnungspunkt (TOP)</span>: einzelnes Thema einer Sitzung.
          </p>
        </section>

        {/* Plenarbeiträge nach Typ */}
        {typeStats.length > 0 && (
          <Card className="mb-12">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <SectionLabel className="mb-0">Plenarbeiträge nach Typ</SectionLabel>
              <span className="text-[11px] text-zinc-400">
                <Link
                  href="/methodik#plenarbeitrag-typen"
                  className="hover:text-zinc-700 underline underline-offset-2 decoration-zinc-200 hover:decoration-zinc-400 transition-colors"
                >
                  Was ist was?
                </Link>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {typeStats.map((t) => (
                <Link
                  key={t.slug}
                  href={`/protokolle/typ/${t.slug}`}
                  className="group rounded-xl border border-zinc-200/70 bg-white px-3 py-3 hover:border-zinc-400 hover:bg-zinc-50/50 transition-colors flex flex-col gap-0.5"
                >
                  <span className="num text-2xl font-semibold tracking-tight text-zinc-950">
                    {t.count.toLocaleString("de-DE")}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-zinc-700 group-hover:text-zinc-950 transition-colors">
                      {t.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] text-zinc-400">
              <span className="num">{typeStatsTotal.toLocaleString("de-DE")}</span> Plenarbeiträge insgesamt — eine Antwort in der Fragestunde ist keine Rede, eine Zwischenfrage erst recht nicht.
            </p>
          </Card>
        )}

        {/* Beiträge nach Fraktion (Karten-Grid mit Typ-Mix) */}
        {partyMatrix.length > 0 && (
          <Card className="mb-12">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <SectionLabel className="mb-0">Beiträge nach Fraktion</SectionLabel>
              <span className="text-[11px] text-zinc-400">
                Nicht nur Reden — alle 6 Plenarbeitrag-Typen
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {partyMatrix.map((p) => (
                <FraktionCard key={p.fraktion} fraktion={p.fraktion} total={p.total} byTyp={p.byTyp} />
              ))}
            </div>
            <TypLegend className="mt-4" />
          </Card>
        )}

        {/* Aktivste im Plenum — interaktiv: filterbar nach Typ, sortierbar, alle Sprecher scrollbar */}
        {allSpeakers.length > 0 && (
          <Card className="mb-12">
            <SpeakerExplorer speakers={allSpeakers} totalAnalyzed={typeStatsTotal} />
          </Card>
        )}

        {/* Sitzungen je Ausschuss */}
        <Card className="mb-12">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <SectionLabel className="mb-0">Sitzungen je Ausschuss</SectionLabel>
            <span className="text-[11px] text-zinc-400">
              Nur veröffentlichte Protokolle — nicht jede Sitzung wird publiziert
            </span>
          </div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
            {ausschussStats.map((a) => (
              <BarRow
                key={a.ausschuss}
                label={a.ausschuss}
                value={a.sitzungen}
                max={maxAus}
              />
            ))}
          </div>
        </Card>

        {/* Top Ausschuss Attendees */}
        {/* Coverage-Disclaimer: ehrliche Aufklärung wie viele MdBs überhaupt erfasst sind */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
          <div className="flex items-baseline gap-2 flex-wrap mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Datenabdeckung — was du hier siehst und was nicht
            </span>
          </div>
          <p className="text-[13px] text-amber-900 leading-relaxed">
            <span className="num font-semibold">{coverage.mdbsLinked}</span> von{" "}
            <span className="num font-semibold">{coverage.mdbsTotal}</span> MdBs der 21. Wahlperiode tauchen in unseren Ausschuss-Daten auf{" "}
            (<span className="num">{coverage.ausschuesseCovered}</span> Ausschüsse mit publizierten Protokollen).{" "}
            <span className="num font-semibold">{mdbsMissing}</span> MdBs erscheinen <em>nicht</em>, weil ihre Ausschüsse{" "}
            entweder nicht-öffentlich tagen (Innenausschuss, Auswärtiger Ausschuss, Verteidigungsausschuss, Petitionsausschuss, Haushaltsausschuss),{" "}
            keine Wortprotokolle veröffentlichen (Umwelt, Forschung, EU-Angelegenheiten, Wirtschaftliche Zusammenarbeit, Geschäftsordnung, Wahlprüfung)
            oder sie nur als Stellvertreter geführt sind und nie an einer publizierten Sitzung teilgenommen haben.
          </p>
        </div>

        <Card className="mb-12">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <SectionLabel className="mb-0">Fleißigste Ausschuss-Teilnehmer</SectionLabel>
            <span className="text-[11px] text-zinc-400">
              {topAttendees.filter((a) => a.politician_id).length} verifizierte MdBs ·{" "}
              {topAttendees.filter((a) => !a.politician_id).length} Sachverständige/Gäste ausgeblendet · scrollbar
            </span>
          </div>
          <div className="max-h-[600px] overflow-y-auto pr-1 space-y-1">
            {topAttendees.filter((a) => a.politician_id).map((a, i) => {
              const Row = ({ children }: { children: React.ReactNode }) =>
                a.politician_id ? (
                  <Link
                    href={`/politiker/${a.politician_id}`}
                    className="flex items-start gap-3 py-1 px-1 hover:bg-zinc-50 rounded-md group transition-colors"
                  >
                    {children}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 py-1 px-1">{children}</div>
                );
              return (
                <Row key={a.name}>
                  <span className="num w-6 text-right text-[12px] font-medium text-zinc-400 shrink-0 mt-1">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_1fr_3rem] items-center gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          PARTY_COLOR[a.fraktion?.replace(/ /g, " ").replace(/­/g, "").trim() || ""]?.dot || "bg-zinc-300"
                        }`}
                      />
                      <span
                        className={
                          "text-[13px] font-medium text-zinc-950 truncate " +
                          (a.politician_id ? "group-hover:underline" : "")
                        }
                        title={a.name}
                      >
                        {a.name}
                      </span>
                      {a.fraktion && (
                        <span className="text-[10.5px] text-zinc-500 shrink-0 uppercase tracking-wider font-medium">
                          {shortPartyName(a.fraktion)}
                        </span>
                      )}
                    </div>
                    <div className="h-5 bg-zinc-50 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-zinc-900/[0.08] rounded-md"
                        style={{ width: `${Math.max((a.sitzungen / maxAttendance) * 100, 8)}%` }}
                      />
                    </div>
                    <span className="num text-[13px] font-semibold text-zinc-950 text-right">
                      {a.sitzungen}
                    </span>
                  </div>
                </Row>
              );
            })}
          </div>
        </Card>

        {/* Link to dedicated sessions list */}
        <Link
          href="/protokolle/sitzungen"
          className="card-hover group block mb-12 rounded-2xl border border-zinc-200/70 bg-white p-5 hover:border-zinc-300 transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <SectionLabel className="mb-1">Plenar-Sitzungen</SectionLabel>
              <div className="text-[15px] font-semibold text-zinc-950">
                Alle <span className="num">{sessions.length}</span> Sitzungen der 21. WP
              </div>
              <div className="mt-1 text-[12.5px] text-zinc-500">
                Übersicht aller Sitzungen mit Reden, TOPs, Abstimmungen und PDF-Protokollen
              </div>
            </div>
            <ArrowRight
              className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0"
              strokeWidth={2.25}
            />
          </div>
        </Link>
      </div>
    </div>
  );
}

function FraktionCard({ fraktion, total, byTyp }: { fraktion: string; total: number; byTyp: Record<string, number> }) {
  const colors = PARTY_COLOR[fraktion] || PARTY_COLOR["fraktionslos"];
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
          <span className="text-[13px] font-semibold text-zinc-950 truncate" title={fraktion}>
            {shortPartyName(fraktion)}
          </span>
        </div>
        <span className="num text-[15px] font-semibold tracking-tight text-zinc-950">
          {total.toLocaleString("de-DE")}
        </span>
      </div>
      {/* Stacked typ bar */}
      <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-100">
        {TYP_ORDER.map((slug, i) => {
          const v = byTyp[slug] || 0;
          if (!v) return null;
          const pct = (v / total) * 100;
          return (
            <div
              key={slug}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, background: colors.tints[i] }}
              title={`${PLENAR_TYPE_SLUG_LABEL[slug]}: ${v.toLocaleString("de-DE")} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      {/* Numeric breakdown */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-zinc-500">
        {TYP_ORDER.map((slug) => {
          const v = byTyp[slug] || 0;
          if (!v) return null;
          return (
            <span key={slug} className="whitespace-nowrap">
              <span className="num font-medium text-zinc-700">{v.toLocaleString("de-DE")}</span>{" "}
              {PLENAR_TYPE_SLUG_LABEL[slug]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TypLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[10.5px] text-zinc-500 ${className}`}>
      Reihenfolge der Bar-Segmente (dunkel → hell):{" "}
      {TYP_ORDER.map((slug, i) => (
        <span key={slug}>
          {i > 0 && " · "}
          <span className="text-zinc-700 font-medium">{PLENAR_TYPE_SLUG_LABEL[slug]}</span>
        </span>
      ))}
      . Hover für Detail.
    </p>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const inner = (
    <>
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 leading-tight inline-flex items-center gap-1">
        {label}
        {href && <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />}
      </span>
      <span className="num text-xl font-semibold tracking-tight text-zinc-950">{value}</span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="group px-4 py-5 flex flex-col gap-0.5 hover:bg-zinc-50 transition-colors"
        title={hint}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="px-4 py-5 flex flex-col gap-0.5" title={hint}>
      {inner}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-zinc-200/70 p-6 ${className}`}>
      {children}
    </section>
  );
}

function SectionLabel({ children, className = "mb-5" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[11px] font-medium uppercase tracking-wider text-zinc-500 ${className}`}>
      {children}
    </h2>
  );
}

// Bar with the label on the LEFT (always fully visible, fixed width, truncates with ellipsis if too long)
// and the bar fill in the middle, count on the right. Replaces the old in-bar-label design.
function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="grid grid-cols-[minmax(8rem,14rem)_1fr_3rem] items-center gap-3 py-0.5">
      <span
        className="text-[12px] font-medium text-zinc-700 truncate"
        title={label}
      >
        {label}
      </span>
      <div className="h-5 bg-zinc-50 rounded-md overflow-hidden">
        <div
          className="h-full bg-zinc-900/[0.08] rounded-md"
          style={{ width: `${Math.max((value / max) * 100, 3)}%` }}
        />
      </div>
      <span className="num text-[12px] font-semibold text-zinc-950 text-right">
        {value.toLocaleString("de-DE")}
      </span>
    </div>
  );
}
