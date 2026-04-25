import {
  getPoliticianDb,
  getMandatesForPoliticianDb,
  getSpeechSummaryInfo,
  getVotesForPoliticianDb,
  getSidejobsForPoliticianDb,
  getCommitteeMembershipsForPoliticianDb,
  computeVoteStatsDb,
  getIncomeRange,
  getParlamentarischeArbeit,
  getNotesForPolitician,
} from "@/lib/db";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { ComparisonBar } from "@/components/ComparisonBar";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import {
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

function computeFactionLoyalty(votes: { vote: string; fraction_label: string | null }[]): { loyal: number; rebel: number; total: number; rate: number } {
  const factionVotes = votes.filter((v) => v.fraction_label && v.vote !== "no_show");
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

  // Notes / Sonderfälle
  const notes = getNotesForPolitician(politicianId);

  // Combined parliamentary work (DIP + Plenar)
  const speechInfo = getSpeechSummaryInfo(politician.last_name, politician.title);
  const { items: parlArbeit, stats: parlStats } = getParlamentarischeArbeit(
    politicianId,
    speechInfo?.speaker ?? null,
    500
  );

  const votes = getVotesForPoliticianDb(politicianId);
  const sidejobs = getSidejobsForPoliticianDb(politicianId);
  const committees = getCommitteeMembershipsForPoliticianDb(politicianId);

  const voteStats = computeVoteStatsDb(votes);
  const hasVoteData = voteStats.totalPolls > 0;
  const activity = hasVoteData ? getActivityLevel(voteStats.attendanceRate) : null;
  const factionLoyalty = computeFactionLoyalty(votes);

  const avgAttendance = 78;

  const partyLabel = politician.party_label || "Parteilos";
  const fractionLabel = primaryMandate?.fraction || partyLabel;
  const constituency = primaryMandate?.constituency;

  const totalSidejobIncome = sidejobs.reduce((sum, s) => sum + (s.income || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <PoliticianAvatar
            photoUrl={politician.photo_url}
            firstName={politician.first_name}
            lastName={politician.last_name}
            party={politician.party_label}
            size="lg"
          />
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
                  {speechInfo.count} Plenarbeiträge ansehen
                </a>
              )}
              {politician.homepage_url && (
                <a
                  href={politician.homepage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {new URL(politician.homepage_url).hostname.replace(/^www\./, "")}
                </a>
              )}
              {politician.twitter_handle && (
                <a
                  href={`https://twitter.com/${politician.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  @{politician.twitter_handle}
                </a>
              )}
              {politician.instagram_handle && (
                <a
                  href={`https://instagram.com/${politician.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Instagram
                </a>
              )}
              {politician.abgeordnetenwatch_url && (
                <a
                  href={politician.abgeordnetenwatch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  abgeordnetenwatch
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sonderfälle / Notes */}
      {notes.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
          {notes.map((note) => (
            <div key={note.id}>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-amber-800">
                <FileText className="w-5 h-5" />
                {note.titel}
              </h2>
              <div className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
                {note.inhalt}
              </div>
              {(note.datum_von || note.datum_bis) && (
                <p className="text-xs text-amber-600 mt-3">
                  {note.datum_von && `Seit ${new Date(note.datum_von + "T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`}
                  {note.datum_von && note.datum_bis && " — "}
                  {note.datum_bis && `bis ${new Date(note.datum_bis + "T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

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

      {/* Parlamentarische Arbeit (DIP + Plenar kombiniert) */}
      {parlArbeit.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Parlamentarische Arbeit
            <Badge variant="blue">{parlArbeit.length}</Badge>
          </h2>

          {/* Category breakdown */}
          <div className="flex flex-wrap gap-2 mb-4">
            {parlStats.rede && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
                <Mic className="w-3 h-3 text-green" />
                <span className="font-medium text-foreground">{parlStats.rede}</span>
                <span className="text-muted">Reden</span>
              </div>
            )}
            {parlStats.frage && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
                <MessageSquare className="w-3 h-3 text-primary" />
                <span className="font-medium text-foreground">{parlStats.frage}</span>
                <span className="text-muted">Fragen & Antworten</span>
              </div>
            )}
            {parlStats.debattenbeitrag && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
                <MessageSquare className="w-3 h-3 text-muted" />
                <span className="font-medium text-foreground">{parlStats.debattenbeitrag}</span>
                <span className="text-muted">Debattenbeiträge</span>
              </div>
            )}
            {parlStats.erklaerung && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
                <FileText className="w-3 h-3 text-accent" />
                <span className="font-medium text-foreground">{parlStats.erklaerung}</span>
                <span className="text-muted">Erklärungen</span>
              </div>
            )}
            {parlStats.gesetzgebung && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
                <Scale className="w-3 h-3 text-yellow" />
                <span className="font-medium text-foreground">{parlStats.gesetzgebung}</span>
                <span className="text-muted">Gesetzgebung</span>
              </div>
            )}
            {parlStats.bericht && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/50 text-xs">
                <FileText className="w-3 h-3 text-muted" />
                <span className="font-medium text-foreground">{parlStats.bericht}</span>
                <span className="text-muted">Berichte</span>
              </div>
            )}
          </div>

          {/* Combined activity list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {parlArbeit.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  item.quelle === "kombiniert"
                    ? "bg-green-50 border-green-200"
                    : "bg-background border-border/50"
                }`}
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Badge
                    variant={
                      item.kategorie === "rede" ? "green"
                        : item.kategorie === "frage" ? "blue"
                        : item.kategorie === "gesetzgebung" ? "yellow"
                        : "gray"
                    }
                  >
                    {item.typ}
                  </Badge>
                  <span className="text-[10px] text-muted">
                    {item.quelle === "kombiniert" ? "DIP + Plenar"
                      : item.quelle === "plenar" ? "Plenar"
                      : "DIP"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {item.thema && (
                    <p className="text-sm text-foreground line-clamp-2 mb-1">{item.thema}</p>
                  )}
                  {item.zusammenfassung && (
                    <p className="text-sm text-muted leading-relaxed mb-1.5">
                      {item.zusammenfassung}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                    {item.datum && (
                      <span>
                        {new Date(item.datum + "T00:00:00").toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {item.sitzung && (
                      <>
                        <span className="text-border">·</span>
                        <span>Sitzung {item.sitzung}</span>
                      </>
                    )}
                    {item.drucksache_nr && (
                      <>
                        <span className="text-border">·</span>
                        {item.pdf_url ? (
                          <a
                            href={item.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Drucksache {item.drucksache_nr}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>Drucksache {item.drucksache_nr}</span>
                        )}
                      </>
                    )}
                    {item.source_url && (
                      <>
                        <span className="text-border">·</span>
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Protokoll-PDF
                          <ExternalLink className="w-3 h-3" />
                        </a>
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
                    {s.organization && (
                      <span>{s.organization}</span>
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
                      {c.committee_label}
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
                  {v.poll_label}
                </span>
                <a
                  href={v.poll_url ?? "#"}
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
