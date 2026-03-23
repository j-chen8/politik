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
import { StatCard } from "@/components/StatCard";
import { BarChart } from "@/components/BarChart";
import {
  Mic,
  Users,
  CalendarDays,
  FileText,
  Building2,
  UserCheck,
  TrendingUp,
  Award,
} from "lucide-react";

const PARTY_COLORS: Record<string, string> = {
  "CDU/CSU": "bg-[#000000]",
  AfD: "bg-[#009ee0]",
  SPD: "bg-[#e3000f]",
  "Die Linke": "bg-[#be3075]",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-[#46962b]",
  FDP: "bg-[#ffed00]",
  BSW: "bg-[#7d2e80]",
  fraktionslos: "bg-gray-400",
};

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Protokoll-Analyse
        </h1>
        <p className="text-muted text-lg">
          Daten aus {overview.plenarSessions} Plenar- und{" "}
          {overview.ausschussSessions} Ausschuss-Sitzungen der 21. Wahlperiode
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard
          icon={CalendarDays}
          label="Plenar-Sitzungen"
          value={overview.plenarSessions}
          status="neutral"
        />
        <StatCard
          icon={Mic}
          label="Reden erfasst"
          value={overview.plenarSpeeches.toLocaleString("de-DE")}
          status="green"
        />
        <StatCard
          icon={Users}
          label="Redner"
          value={overview.plenarSpeakers}
          status="neutral"
        />
        <StatCard
          icon={Building2}
          label="Ausschuss-Sitzungen"
          value={overview.ausschussSessions}
          status="neutral"
        />
        <StatCard
          icon={UserCheck}
          label="Anwesenheitseinträge"
          value={overview.ausschussAttendees.toLocaleString("de-DE")}
          status="green"
        />
        <StatCard
          icon={FileText}
          label="Tagesordnungspunkte"
          value={overview.ausschussTopics.toLocaleString("de-DE")}
          status="neutral"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Reden nach Fraktion */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Reden nach Fraktion
          </h2>
          <BarChart
            data={partyStats.slice(0, 6).map((p) => ({
              label: PARTY_SHORT[p.party] || p.party.substring(0, 6),
              value: p.count,
              color: PARTY_COLORS[p.party] || "bg-gray-400",
            }))}
          />
        </section>

        {/* Ausschüsse Übersicht */}
        <section className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Ausschüsse nach Sitzungen
          </h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {ausschussStats.map((a) => {
              const maxS = Math.max(
                ...ausschussStats.map((x) => x.sitzungen),
                1
              );
              return (
                <div key={a.ausschuss} className="flex items-center gap-3">
                  <span className="text-sm text-muted w-8 text-right font-mono">
                    {a.sitzungen}
                  </span>
                  <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary/20 rounded-lg flex items-center px-2"
                      style={{
                        width: `${(a.sitzungen / maxS) * 100}%`,
                      }}
                    >
                      <span className="text-xs font-medium text-foreground truncate">
                        {a.ausschuss}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Top Speakers */}
      <section className="bg-white rounded-2xl border border-border p-6 mb-10">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Top-Redner im Plenum
        </h2>
        <div className="space-y-2">
          {topSpeakers.map((s, i) => (
            <Link key={s.speaker} href={`/protokolle/redner/${encodeURIComponent(s.speaker)}`} className="flex items-center gap-3 group cursor-pointer">
              <span className="w-6 text-right text-sm font-bold text-muted">
                {i + 1}
              </span>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden relative group-hover:bg-gray-100 transition-colors">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center px-3 gap-2"
                    style={{
                      width: `${Math.max((s.count / maxSpeeches) * 100, 15)}%`,
                      backgroundColor:
                        s.party === "AfD"
                          ? "#009ee020"
                          : s.party === "CDU/CSU"
                            ? "#00000015"
                            : s.party === "SPD"
                              ? "#e3000f15"
                              : s.party === "Die Linke"
                                ? "#be307515"
                                : s.party === "BÜNDNIS 90/DIE GRÜNEN"
                                  ? "#46962b15"
                                  : "#f1f5f9",
                    }}
                  >
                    <span className="text-sm font-semibold truncate">
                      {s.speaker}
                    </span>
                    {s.party && (
                      <span className="text-xs text-muted shrink-0">
                        {PARTY_SHORT[s.party] || s.party}
                      </span>
                    )}
                    {s.role && !s.party && (
                      <span className="text-xs text-muted shrink-0 truncate">
                        {s.role}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground w-12 text-right shrink-0">
                  {s.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Speakers with Summaries */}
      {allSpeakersWithSummaries.length > 0 && (
        <section className="bg-white rounded-2xl border border-border p-6 mb-10">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Alle Redner mit KI-Zusammenfassungen
            <span className="text-sm font-normal text-muted ml-1">
              ({allSpeakersWithSummaries.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
            {allSpeakersWithSummaries.map((s) => (
              <Link
                key={s.speaker}
                href={`/protokolle/redner/${encodeURIComponent(s.speaker)}`}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-primary-light/30 transition-colors group"
              >
                <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {s.speaker}
                </span>
                <span className="text-xs text-muted shrink-0 ml-2">
                  {s.count} {s.count === 1 ? "Rede" : "Reden"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Ausschuss Attendees */}
      <section className="bg-white rounded-2xl border border-border p-6 mb-10">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Fleißigste Ausschuss-Teilnehmer
        </h2>
        <div className="space-y-2">
          {topAttendees.map((a, i) => (
            <div key={a.name} className="flex items-center gap-3">
              <span className="w-6 text-right text-sm font-bold text-muted">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-green/10 rounded-lg flex items-center px-3 gap-2"
                      style={{
                        width: `${Math.max(
                          (a.sitzungen / maxAttendance) * 100,
                          20
                        )}%`,
                      }}
                    >
                      <span className="text-sm font-semibold truncate">
                        {a.name}
                      </span>
                      {a.fraktion && (
                        <span className="text-xs text-muted shrink-0">
                          {PARTY_SHORT[a.fraktion] || a.fraktion}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold w-16 text-right shrink-0">
                    {a.sitzungen} Sitz.
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate pl-3">
                  {a.ausschuesse}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Plenar Sessions */}
      <section className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          Plenar-Sitzungen
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold text-muted">
                  Nr.
                </th>
                <th className="text-left py-2 px-3 font-semibold text-muted">
                  Datum
                </th>
                <th className="text-right py-2 px-3 font-semibold text-muted">
                  Redner
                </th>
                <th className="text-right py-2 px-3 font-semibold text-muted">
                  Reden
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 20).map((s) => (
                <tr
                  key={s.sitzung}
                  className="border-b border-border/50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 px-3 font-mono font-semibold">
                    {s.sitzung}
                  </td>
                  <td className="py-2 px-3 text-muted">{s.datum || "—"}</td>
                  <td className="py-2 px-3 text-right">{s.speaker_count}</td>
                  <td className="py-2 px-3 text-right font-semibold">
                    {s.speech_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
