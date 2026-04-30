import Link from "next/link";
import {
  getProtokollOverview,
  getTopPlenarSpeakers,
  getPlenarPartyStats,
  getPlenarSessions,
  getAusschussStats,
  getTopAusschussAttendees,
  getAllSpeakersWithSummaries,
} from "@/lib/db";

const PARTY_SHORT: Record<string, string> = {
  "CDU/CSU": "CDU",
  AfD: "AfD",
  SPD: "SPD",
  "Die Linke": "Linke",
  "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
  fraktionslos: "FL",
};

export default function ProtokollePage() {
  const overview = getProtokollOverview();
  const topSpeakers = getTopPlenarSpeakers(15);
  const partyStats = getPlenarPartyStats();
  const sessions = getPlenarSessions();
  const ausschussStats = getAusschussStats();
  const topAttendees = getTopAusschussAttendees(15);
  const allSpeakersWithSummaries = getAllSpeakersWithSummaries();

  const maxSpeeches = Math.max(...topSpeakers.map((s) => s.count), 1);
  const maxAttendance = Math.max(...topAttendees.map((a) => a.sitzungen), 1);
  const maxParty = Math.max(...partyStats.map((p) => p.count), 1);
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
            <Stat label="Plenar-Sitzungen" value={overview.plenarSessions.toString()} />
            <Stat label="Reden" value={overview.plenarSpeeches.toLocaleString("de-DE")} />
            <Stat label="Redner" value={overview.plenarSpeakers.toString()} />
            <Stat label="Ausschuss-Sitzungen" value={overview.ausschussSessions.toString()} />
            <Stat label="Anwesenheiten" value={overview.ausschussAttendees.toLocaleString("de-DE")} />
            <Stat label="TOPs" value={overview.ausschussTopics.toLocaleString("de-DE")} />
          </div>
        </section>

        {/* Two columns: Reden / Ausschuss */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
          <Card>
            <SectionLabel>Reden nach Fraktion</SectionLabel>
            <div className="space-y-1.5">
              {partyStats.slice(0, 7).map((p) => (
                <BarRow
                  key={p.party}
                  label={PARTY_SHORT[p.party] || p.party.substring(0, 6)}
                  value={p.count}
                  max={maxParty}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Ausschüsse nach Sitzungen</SectionLabel>
            <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
              {ausschussStats.map((a) => (
                <BarRow
                  key={a.ausschuss}
                  label={a.ausschuss}
                  value={a.sitzungen}
                  max={maxAus}
                  compact
                />
              ))}
            </div>
          </Card>
        </section>

        {/* Top Speakers */}
        <Card className="mb-12">
          <SectionLabel>Top-Redner im Plenum</SectionLabel>
          <div className="space-y-1">
            {topSpeakers.map((s, i) => (
              <Link
                key={s.speaker}
                href={`/design/linear/protokolle/redner/${encodeURIComponent(s.speaker)}`}
                className="flex items-center gap-3 group hover:bg-zinc-50 rounded-md transition-colors py-1 px-1"
              >
                <span className="num w-6 text-right text-[12px] font-medium text-zinc-400">
                  {i + 1}
                </span>
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="flex-1 h-7 bg-zinc-50 rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-zinc-900/[0.06] rounded-md flex items-center px-3 gap-2 transition-all duration-500"
                      style={{
                        width: `${Math.max((s.count / maxSpeeches) * 100, 15)}%`,
                      }}
                    >
                      <span className="text-[13px] font-medium text-zinc-950 truncate group-hover:underline">
                        {s.speaker}
                      </span>
                      {s.party && (
                        <span className="text-[11px] text-zinc-500 shrink-0 uppercase tracking-wider font-medium">
                          {PARTY_SHORT[s.party] || s.party}
                        </span>
                      )}
                      {s.role && !s.party && (
                        <span className="text-[11px] text-zinc-500 shrink-0 truncate">
                          {s.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="num text-[13px] font-semibold text-zinc-950 w-12 text-right shrink-0">
                    {s.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* All Speakers Grid */}
        {allSpeakersWithSummaries.length > 0 && (
          <Card className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <SectionLabel className="mb-0">Alle Redner mit KI-Zusammenfassungen</SectionLabel>
              <span className="num text-[11px] text-zinc-400">
                {allSpeakersWithSummaries.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0.5">
              {allSpeakersWithSummaries.map((s) => (
                <Link
                  key={s.speaker}
                  href={`/design/linear/protokolle/redner/${encodeURIComponent(s.speaker)}`}
                  className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-zinc-50 transition-colors group"
                >
                  <span className="text-[13px] text-zinc-700 group-hover:text-zinc-950 truncate">
                    {s.speaker}
                  </span>
                  <span className="num text-[11px] text-zinc-400 shrink-0 ml-2">
                    {s.count}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Top Ausschuss Attendees */}
        <Card className="mb-12">
          <SectionLabel>Fleißigste Ausschuss-Teilnehmer</SectionLabel>
          <div className="space-y-1">
            {topAttendees.map((a, i) => (
              <div key={a.name} className="flex items-start gap-3 py-1 px-1">
                <span className="num w-6 text-right text-[12px] font-medium text-zinc-400 mt-1">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-7 bg-zinc-50 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-zinc-900/[0.06] rounded-md flex items-center px-3 gap-2"
                        style={{
                          width: `${Math.max(
                            (a.sitzungen / maxAttendance) * 100,
                            20
                          )}%`,
                        }}
                      >
                        <span className="text-[13px] font-medium text-zinc-950 truncate">
                          {a.name}
                        </span>
                        {a.fraktion && (
                          <span className="text-[11px] text-zinc-500 shrink-0 uppercase tracking-wider font-medium">
                            {PARTY_SHORT[a.fraktion] || a.fraktion}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="num text-[13px] font-semibold text-zinc-950 w-16 text-right shrink-0">
                      {a.sitzungen}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-zinc-400 mt-0.5 truncate pl-3">
                    {a.ausschuesse}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Plenar Sessions */}
        <Card>
          <SectionLabel>Plenar-Sitzungen</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Nr.</th>
                  <th className="text-left py-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Datum</th>
                  <th className="text-right py-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Redner</th>
                  <th className="text-right py-2 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Reden</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 20).map((s) => (
                  <tr
                    key={s.sitzung}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="py-2 px-2 num font-medium text-zinc-950">
                      {s.sitzung}
                    </td>
                    <td className="py-2 px-2 text-zinc-500 num">
                      {s.datum || "—"}
                    </td>
                    <td className="py-2 px-2 text-right num text-zinc-700">
                      {s.speaker_count}
                    </td>
                    <td className="py-2 px-2 text-right num font-semibold text-zinc-950">
                      {s.speech_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="num text-xl font-semibold tracking-tight text-zinc-950">{value}</span>
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

function BarRow({ label, value, max, compact = false }: { label: string; value: number; max: number; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "py-0.5"}`}>
      <span className="num w-12 text-right text-[12px] font-medium text-zinc-700 shrink-0">
        {value.toLocaleString("de-DE")}
      </span>
      <div className="flex-1 h-6 bg-zinc-50 rounded-md overflow-hidden">
        <div
          className="h-full bg-zinc-900/[0.06] rounded-md flex items-center px-2"
          style={{ width: `${(value / max) * 100}%` }}
        >
          <span className="text-[12px] font-medium text-zinc-700 truncate">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
