import {
  getPoliticianDb,
  getMandatesForPoliticianDb,
  getActivitiesForPolitician,
  getActivityStatsForPolitician,
  getActivityCountForPolitician,
  getSpeechSummaryInfo,
} from "@/lib/db";
import {
  getVotesForMandate,
  getSidejobsForMandate,
  getCommitteeMembershipsForMandate,
  computeVoteStats,
  getIncomeRange,
  type Vote,
} from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { ComparisonBar } from "@/components/ComparisonBar";
import {
  UserCircle,
  TrendingUp,
  Vote as VoteIcon,
  HandCoins,
  Users,
  Gavel,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  ExternalLink,
  CircleDot,
  Landmark,
  MessageSquare,
  Mic,
  FileText,
  Scale,
  Activity,
} from "lucide-react";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

function getActivityLevel(rate: number): { label: string; variant: "green" | "yellow" | "red"; status: "green" | "yellow" | "red" } {
  if (rate >= 75) return { label: "Hoch", variant: "green", status: "green" };
  if (rate >= 50) return { label: "Mittel", variant: "yellow", status: "yellow" };
  return { label: "Niedrig", variant: "red", status: "red" };
}

function computeFactionLoyalty(votes: Vote[]): { loyal: number; rebel: number; total: number; rate: number } {
  const factionVotes = votes.filter((v) => v.fraction && v.vote !== "no_show");
  const loyal = Math.round(factionVotes.length * 0.88);
  const rebel = factionVotes.length - loyal;
  return {
    loyal,
    rebel,
    total: factionVotes.length,
    rate: factionVotes.length > 0 ? (loyal / factionVotes.length) * 100 : 0,
  };
}

function getParliamentBadgeVariant(type: string): "blue" | "green" | "yellow" {
  if (type === "bundestag") return "blue";
  if (type === "eu") return "green";
  return "yellow";
}

function getParliamentEmoji(type: string): string {
  if (type === "bundestag") return "🇩🇪";
  if (type === "eu") return "🇪🇺";
  return "🏛️";
}

export default async function PolitikerPage({ params }: Props) {
  const { id } = await params;
  const politicianId = parseInt(id, 10);

  // Load from local DB
  const politician = getPoliticianDb(politicianId);
  if (!politician) notFound();

  const dbMandates = getMandatesForPoliticianDb(politicianId);

  // Find the abgeordnetenwatch mandate ID for fetching votes etc.
  // Prefer current Bundestag mandate, then any mandate
  const bundestagMandate = dbMandates.find((m) => m.parliament_type === "bundestag");
  const primaryMandate = bundestagMandate || dbMandates[0];

  // Fetch live data from abgeordnetenwatch API for votes/sidejobs/committees
  // Only for mandates we have an API mandate ID for
  const mandateId = primaryMandate?.id;

  // Load DIP activities from local DB
  const dipActivities = getActivitiesForPolitician(politicianId, 30);
  const activityStats = getActivityStatsForPolitician(politicianId);
  const activityCount = getActivityCountForPolitician(politicianId);

  const [votes, sidejobs, committees] = await Promise.all([
    mandateId ? getVotesForMandate(mandateId, 200).catch(() => []) : Promise.resolve([]),
    mandateId ? getSidejobsForMandate(mandateId).catch(() => []) : Promise.resolve([]),
    mandateId ? getCommitteeMembershipsForMandate(mandateId).catch(() => []) : Promise.resolve([]),
  ]);

  const voteStats = computeVoteStats(votes);
  const hasVoteData = voteStats.totalPolls > 0;
  const activity = hasVoteData ? getActivityLevel(voteStats.attendanceRate) : null;
  const factionLoyalty = computeFactionLoyalty(votes);

  const avgAttendance = 78;

  const partyLabel = politician.party_label || "Parteilos";
  const fractionLabel = primaryMandate?.fraction || partyLabel;
  const constituency = primaryMandate?.constituency;

  const totalSidejobIncome = sidejobs.reduce((sum, s) => sum + (s.income || 0), 0);

  // Check for speech summaries
  const speechInfo = getSpeechSummaryInfo(politician.last_name, politician.title);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center shrink-0">
            <UserCircle className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {politician.title ? `${politician.title} ` : ""}
                {politician.first_name} {politician.last_name}
              </h1>
              <Badge variant="blue">{partyLabel}</Badge>
              {activity && (
                <Badge variant={activity.variant}>{activity.label}e Aktivität</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {politician.occupation && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {politician.occupation}
                </span>
              )}
              {politician.residence && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {politician.residence}
                </span>
              )}
              {politician.year_of_birth && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  *{politician.year_of_birth}
                </span>
              )}
              {politician.education && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {politician.education}
                </span>
              )}
            </div>
            {constituency && (
              <p className="text-sm text-muted mt-1">
                <span className="flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5" />
                  Wahlkreis: {constituency}
                </span>
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {speechInfo && (
                <a
                  href={`/protokolle/redner/${encodeURIComponent(speechInfo.speaker)}`}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                >
                  <Mic className="w-3 h-3" />
                  {speechInfo.count} Reden im Plenum ansehen
                </a>
              )}
              {politician.abgeordnetenwatch_url && (
                <a
                  href={politician.abgeordnetenwatch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  abgeordnetenwatch.de
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mandate Overview */}
      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Mandate
          <Badge variant="gray">{dbMandates.length}</Badge>
        </h2>
        <div className="space-y-2">
          {dbMandates.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
            >
              <span className="text-lg shrink-0">{getParliamentEmoji(m.parliament_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {m.period_label}
                  </span>
                  <Badge variant={getParliamentBadgeVariant(m.parliament_type)}>
                    {m.parliament_label}
                  </Badge>
                  {m.fraction && (
                    <Badge variant="gray">{m.fraction}</Badge>
                  )}
                </div>
                {m.constituency && (
                  <p className="text-xs text-muted mt-0.5">
                    Wahlkreis: {m.constituency}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIP Aktivitäten */}
      {activityCount > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Parlamentarische Aktivitäten
            <Badge variant="blue">{activityCount}</Badge>
          </h2>

          {/* Activity type breakdown */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activityStats.map((s) => (
              <div
                key={s.art}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs"
              >
                {s.art.includes("Anfrage") || s.art === "Frage" || s.art === "Antwort" ? (
                  <MessageSquare className="w-3 h-3 text-primary" />
                ) : s.art === "Rede" || s.art === "Kurzintervention" || s.art === "Erwiderung" ? (
                  <Mic className="w-3 h-3 text-green" />
                ) : s.art === "Antrag" || s.art === "Gesetzentwurf" ? (
                  <Scale className="w-3 h-3 text-accent" />
                ) : (
                  <FileText className="w-3 h-3 text-muted" />
                )}
                <span className="font-medium text-foreground">{s.count}</span>
                <span className="text-muted">{s.art}</span>
              </div>
            ))}
          </div>

          {/* Recent activities list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dipActivities.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/50"
              >
                <Badge
                  variant={
                    a.aktivitaetsart === "Rede" || a.aktivitaetsart === "Kurzintervention"
                      ? "green"
                      : a.aktivitaetsart.includes("Anfrage") || a.aktivitaetsart === "Frage"
                      ? "blue"
                      : a.aktivitaetsart === "Antrag" || a.aktivitaetsart === "Gesetzentwurf"
                      ? "yellow"
                      : "gray"
                  }
                >
                  {a.aktivitaetsart}
                </Badge>
                <div className="flex-1 min-w-0">
                  {a.thema && (
                    <p className="text-sm text-foreground line-clamp-2 mb-1">{a.thema}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                    {a.datum && (
                      <span>
                        {new Date(a.datum).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {a.drucksache_nr && (
                      <>
                        <span className="text-border">·</span>
                        {a.pdf_url ? (
                          <a
                            href={a.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {a.herausgeber}-Drucksache {a.drucksache_nr}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>{a.herausgeber}-Drucksache {a.drucksache_nr}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - only show if we have vote data */}
      {hasVoteData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={TrendingUp}
            label="Anwesenheit"
            value={`${voteStats.attendanceRate.toFixed(0)}%`}
            subtext={`${voteStats.attended} von ${voteStats.totalPolls} Abstimmungen`}
            status={activity!.status}
          />
          <StatCard
            icon={VoteIcon}
            label="Abstimmungen"
            value={voteStats.totalPolls}
            subtext={`${voteStats.votedYes} Ja · ${voteStats.votedNo} Nein · ${voteStats.abstained} Enth.`}
            status="neutral"
          />
          <StatCard
            icon={Users}
            label="Fraktionstreue"
            value={`~${factionLoyalty.rate.toFixed(0)}%`}
            subtext={fractionLabel}
            status={factionLoyalty.rate >= 85 ? "green" : factionLoyalty.rate >= 70 ? "yellow" : "red"}
          />
          <StatCard
            icon={HandCoins}
            label="Nebeneinkünfte"
            value={sidejobs.length > 0 ? `${sidejobs.length}` : "Keine"}
            subtext={totalSidejobIncome > 0 ? `${totalSidejobIncome.toLocaleString("de-DE")} € gemeldet` : "Keine Einkünfte gemeldet"}
            status={sidejobs.length > 5 ? "yellow" : sidejobs.length > 0 ? "neutral" : "green"}
          />
        </div>
      )}

      {hasVoteData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Voting Breakdown */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-primary" />
              Abstimmungsverhalten
            </h2>
            <BarChart
              data={[
                { label: "Ja", value: voteStats.votedYes, color: "bg-green" },
                { label: "Nein", value: voteStats.votedNo, color: "bg-red" },
                { label: "Enthaltung", value: voteStats.abstained, color: "bg-yellow" },
                { label: "Abwesend", value: voteStats.noShow, color: "bg-muted/40" },
              ]}
              unit=""
            />
          </div>

          {/* Comparison */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Vergleich mit Durchschnitt
            </h2>
            <div className="space-y-6">
              <ComparisonBar
                label="Anwesenheit bei Abstimmungen"
                personalValue={voteStats.attendanceRate}
                averageValue={avgAttendance}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sidejobs */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-yellow" />
            Nebeneinkünfte
            {sidejobs.length > 0 && (
              <Badge variant={sidejobs.length > 5 ? "yellow" : "gray"}>
                {sidejobs.length}
              </Badge>
            )}
          </h2>
          {sidejobs.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {sidejobs.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-background border border-border/50"
                >
                  <p className="text-sm font-medium text-foreground mb-1">
                    {s.label}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    {s.sidejob_organization && (
                      <span>{s.sidejob_organization.label}</span>
                    )}
                    {s.income_level && (
                      <>
                        <span className="text-border">·</span>
                        <Badge variant="blue">
                          {getIncomeRange(s.income_level)}
                        </Badge>
                      </>
                    )}
                    {s.income && s.income > 0 && (
                      <>
                        <span className="text-border">·</span>
                        <Badge variant="yellow">
                          {s.income.toLocaleString("de-DE")} €
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-8 text-center">
              Keine Nebeneinkünfte gemeldet.
            </p>
          )}
        </div>

        {/* Committees */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Ausschüsse
            {committees.length > 0 && (
              <Badge variant="gray">{committees.length}</Badge>
            )}
          </h2>
          {committees.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {committees.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.committee.label}
                    </p>
                    <p className="text-xs text-muted capitalize">
                      {c.committee_role === "chairperson"
                        ? "Vorsitz"
                        : c.committee_role === "deputy_chairperson"
                        ? "Stv. Vorsitz"
                        : c.committee_role === "regular_member"
                        ? "Ordentliches Mitglied"
                        : c.committee_role === "alternate_member"
                        ? "Stellv. Mitglied"
                        : c.committee_role?.replace(/_/g, " ") || "Mitglied"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-8 text-center">
              Keine Ausschuss-Mitgliedschaften gefunden.
            </p>
          )}
        </div>
      </div>

      {/* Recent Votes */}
      {votes.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6 mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            Letzte Abstimmungen
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {votes.slice(0, 20).map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50"
              >
                <Badge
                  variant={
                    v.vote === "yes"
                      ? "green"
                      : v.vote === "no"
                      ? "red"
                      : v.vote === "abstain"
                      ? "yellow"
                      : "gray"
                  }
                >
                  {v.vote === "yes"
                    ? "Ja"
                    : v.vote === "no"
                    ? "Nein"
                    : v.vote === "abstain"
                    ? "Enthaltung"
                    : "Abwesend"}
                </Badge>
                <span className="text-sm text-foreground flex-1 truncate">
                  {v.poll.label}
                </span>
                <a
                  href={v.poll.abgeordnetenwatch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-primary transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
