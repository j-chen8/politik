import { getSpeakerDetail, getSpeechSummaries } from "@/lib/db";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Mic,
  CalendarDays,
  MessageSquare,
  HelpCircle,
  Megaphone,
} from "lucide-react";
import { notFound } from "next/navigation";

const PARTY_COLORS: Record<string, string> = {
  "CDU/CSU": "#000000",
  AfD: "#009ee0",
  SPD: "#e3000f",
  "Die Linke": "#be3075",
  "BÜNDNIS 90/DIE GRÜNEN": "#46962b",
  FDP: "#ffed00",
  BSW: "#7d2e80",
  fraktionslos: "#94a3b8",
};

const TYP_CONFIG: Record<string, { label: string; color: string }> = {
  debatte: { label: "Debatte", color: "#2563eb" },
  fragestunde_antwort: { label: "Fragestunde", color: "#f59e0b" },
  fragestunde_frage: { label: "Fragestunde", color: "#f59e0b" },
  regierungserklaerung: { label: "Regierungserklärung", color: "#7c3aed" },
  zwischenfrage: { label: "Zwischenfrage", color: "#6b7280" },
  kurzintervention: { label: "Kurzintervention", color: "#6b7280" },
  erklaerung: { label: "Erklärung", color: "#10b981" },
};

export default async function RednerPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const detail = getSpeakerDetail(decodedName);

  if (!detail) notFound();

  const summaries = getSpeechSummaries(decodedName);
  const summaryMap = new Map<number, typeof summaries>();
  for (const s of summaries) {
    if (!summaryMap.has(s.sitzung)) summaryMap.set(s.sitzung, []);
    summaryMap.get(s.sitzung)!.push(s);
  }

  const color = PARTY_COLORS[detail.party || ""] || "#2563eb";

  // Stats
  const debattenReden = summaries.filter(
    (s) => s.typ === "debatte" || s.typ === "erklaerung"
  ).length;
  const fragestunden = summaries.filter((s) =>
    s.typ?.includes("fragestunde")
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      <Link
        href="/protokolle"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zur Übersicht
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: color + "15" }}
          >
            <Mic className="w-7 h-7" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">
              {detail.speaker}
            </h1>
            <div className="flex items-center gap-3 text-sm">
              {detail.party && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: color }}
                >
                  {detail.party}
                </span>
              )}
              {detail.role && (
                <span className="text-muted">{detail.role}</span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-extrabold">
              {detail.totalSpeeches}
            </span>
            <p className="text-xs text-muted">
              Reden in {detail.sessions.length} Sitzungen
            </p>
          </div>
        </div>

        {/* Type breakdown if summaries available */}
        {summaries.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-sm">
              <Megaphone className="w-4 h-4 text-primary" />
              <span className="font-semibold">{debattenReden}</span>
              <span className="text-muted">Debatten</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <HelpCircle className="w-4 h-4 text-yellow" />
              <span className="font-semibold">{fragestunden}</span>
              <span className="text-muted">Fragestunden</span>
            </div>
          </div>
        )}
      </div>

      {/* Sessions list */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Alle Sitzungen mit Redebeiträgen
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {detail.sessions.map((s) => {
            const sessionSummaries = summaryMap.get(s.sitzung) || [];

            return (
              <div key={s.sitzung} className="px-6 py-4">
                {/* Session header */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 text-center shrink-0">
                    <span className="text-lg font-bold">{s.sitzung}</span>
                    <p className="text-[10px] text-muted">Sitzung</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {s.datum
                        ? new Date(
                            s.datum + "T00:00:00"
                          ).toLocaleDateString("de-DE", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Datum unbekannt"}
                    </p>
                    <p className="text-xs text-muted">
                      {s.count}{" "}
                      {s.count === 1 ? "Redebeitrag" : "Redebeiträge"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({
                        length: Math.min(s.count, 10),
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-5 rounded-sm"
                          style={{ backgroundColor: color + "40" }}
                        />
                      ))}
                      {s.count > 10 && (
                        <span className="text-xs text-muted ml-1">
                          +{s.count - 10}
                        </span>
                      )}
                    </div>

                    {s.sourceUrl && (
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary-light transition-colors"
                      >
                        PDF
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Summaries */}
                {sessionSummaries.length > 0 && (
                  <div className="ml-16 space-y-2 mt-2">
                    {sessionSummaries.map((sum, idx) => {
                      const typConfig =
                        TYP_CONFIG[sum.typ] || TYP_CONFIG.debatte;
                      return (
                        <div
                          key={idx}
                          className="rounded-xl bg-gray-50 px-4 py-3 text-sm"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white"
                              style={{
                                backgroundColor: typConfig.color,
                              }}
                            >
                              {typConfig.label}
                            </span>
                            {sum.kontext && (
                              <span className="text-xs text-muted truncate">
                                {sum.kontext}
                              </span>
                            )}
                          </div>
                          {sum.zusammenfassung && (
                            <p className="text-foreground leading-relaxed">
                              {sum.zusammenfassung}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
