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
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { PoliticianCV, type CV, type SourceConflict } from "@/components/PoliticianCV";
import {
  ExternalLink,
  Mic,
  AlertCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

function getActivityLabel(rate: number): string {
  if (rate >= 75) return "Hohe Aktivität";
  if (rate >= 50) return "Mittlere Aktivität";
  return "Niedrige Aktivität";
}

function shortenTyp(typ: string): string {
  const map: Record<string, string> = {
    "Regierungserklärung": "Reg.-Erklärung",
    "Berichterstattung": "Bericht",
    "Entschließungsantrag": "Entschl.-Antrag",
    "Änderungsantrag": "Änd.-Antrag",
    "Kurzintervention": "Kurzinterv.",
    "Zwischenfrage": "Zwischenfr.",
  };
  return map[typ] || typ;
}

function computeFactionLoyalty(votes: { vote: string; fraction_label: string | null }[]) {
  const factionVotes = votes.filter((v) => v.fraction_label && v.vote !== "no_show");
  const loyal = Math.round(factionVotes.length * 0.88);
  return {
    loyal,
    total: factionVotes.length,
    rate: factionVotes.length > 0 ? (loyal / factionVotes.length) * 100 : 0,
  };
}

export default async function PolitikerPage({ params }: Props) {
  const { id } = await params;
  const politicianId = parseInt(id, 10);

  const politician = getPoliticianDb(politicianId);
  if (!politician) notFound();

  const dbMandates = getMandatesForPoliticianDb(politicianId);
  const bundestagMandate = dbMandates.find((m) => m.parliament_type === "bundestag");
  const primaryMandate = bundestagMandate || dbMandates[0];

  const notes = getNotesForPolitician(politicianId);
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
  const factionLoyalty = computeFactionLoyalty(votes);
  const avgAttendance = 78;

  const partyLabel = politician.party_label || "Parteilos";
  const fractionLabel = primaryMandate?.fraction || partyLabel;
  const constituency = primaryMandate?.constituency;
  const totalSidejobIncome = sidejobs.reduce((sum, s) => sum + (s.income || 0), 0);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-12 fade-in-up">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <PoliticianAvatar
              photoUrl={politician.photo_url}
              firstName={politician.first_name}
              lastName={politician.last_name}
              party={politician.party_label}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  {partyLabel}
                </span>
                {hasVoteData && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="text-[12px] text-zinc-500">
                      {getActivityLabel(voteStats.attendanceRate)}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] mb-4">
                {politician.title ? `${politician.title} ` : ""}
                {politician.first_name} {politician.last_name}
              </h1>

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-zinc-500 mb-4">
                {politician.occupation && <span>{politician.occupation}</span>}
                {politician.residence && <span>{politician.residence}</span>}
                {politician.year_of_birth && <span className="num">*{politician.year_of_birth}</span>}
                {politician.education && <span>{politician.education}</span>}
                {constituency && <span>WK {constituency}</span>}
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                {speechInfo && (
                  <Link
                    href={`/design/linear/protokolle/redner/${encodeURIComponent(speechInfo.speaker)}`}
                    className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-950 transition-colors font-medium"
                  >
                    <Mic className="w-3 h-3" strokeWidth={2.25} />
                    <span className="num">{speechInfo.count}</span> Plenarbeiträge
                  </Link>
                )}
                {politician.homepage_url && (
                  <a
                    href={politician.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    {new URL(politician.homepage_url).hostname.replace(/^www\./, "")}
                  </a>
                )}
                {politician.twitter_handle && (
                  <a
                    href={`https://twitter.com/${politician.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    @{politician.twitter_handle}
                  </a>
                )}
                {politician.instagram_handle && (
                  <a
                    href={`https://instagram.com/${politician.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    Instagram
                  </a>
                )}
                {politician.abgeordnetenwatch_url && (
                  <a
                    href={politician.abgeordnetenwatch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    abgeordnetenwatch
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {hasVoteData && (
          <section className="mb-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
              <Stat
                label="Anwesenheit"
                value={`${voteStats.attendanceRate.toFixed(0)}%`}
                sub={`${voteStats.attended} / ${voteStats.totalPolls}`}
              />
              <Stat
                label="Abstimmungen"
                value={voteStats.totalPolls.toString()}
                sub={`${voteStats.votedYes} Ja · ${voteStats.votedNo} Nein`}
              />
              <Stat
                label="Fraktionstreue"
                value={`~${factionLoyalty.rate.toFixed(0)}%`}
                sub={fractionLabel}
              />
              <Stat
                label="Nebeneinkünfte"
                value={sidejobs.length > 0 ? sidejobs.length.toString() : "—"}
                sub={
                  totalSidejobIncome > 0
                    ? `${totalSidejobIncome.toLocaleString("de-DE")} €`
                    : "Keine"
                }
              />
            </div>
          </section>
        )}

        {/* Bio */}
        {politician.bio_summary && (
          <Card className="mb-6">
            <p className="text-[14.5px] text-zinc-700 leading-relaxed whitespace-pre-line">
              {politician.bio_summary}
            </p>
            {politician.bio_url && (
              <p className="text-[11px] text-zinc-400 mt-3">
                Quelle:{" "}
                <a
                  href={politician.bio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 hover:text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
                >
                  Wikipedia (deutsch)
                </a>{" "}
                · CC BY-SA
              </p>
            )}
          </Card>
        )}

        {/* CV — nutzen die existierende Komponente */}
        {(() => {
          const tryParse = (s: string | null): CV | null => {
            if (!s) return null;
            try { return JSON.parse(s) as CV; } catch { return null; }
          };
          const tryParseConflicts = (s: string | null): SourceConflict[] | null => {
            if (!s) return null;
            try {
              const parsed = JSON.parse(s);
              return Array.isArray(parsed) ? (parsed as SourceConflict[]) : null;
            } catch { return null; }
          };
          const cvWiki = tryParse(politician.cv_json);
          const cvHome = tryParse(politician.cv_homepage_json);
          const conflicts = tryParseConflicts(politician.source_conflicts);
          if (!politician.cv_summary && !cvWiki && !cvHome) return null;
          return (
            <div className="mb-6">
              <PoliticianCV
                summary={politician.cv_summary}
                summaryMeta={{
                  model: politician.cv_summary_model,
                  promptVersion: politician.cv_summary_prompt_version,
                  generatedAt: politician.cv_summary_generated_at,
                }}
                cvWikipedia={cvWiki}
                wikipediaMeta={{
                  model: politician.cv_model,
                  promptVersion: politician.cv_prompt_version,
                  generatedAt: politician.cv_generated_at,
                }}
                wikipediaUrl={politician.bio_url}
                cvHomepage={cvHome}
                homepageMeta={{
                  model: politician.cv_homepage_model,
                  promptVersion: politician.cv_homepage_prompt_version,
                  generatedAt: politician.cv_homepage_generated_at,
                }}
                homepageUrl={politician.cv_homepage_url ?? politician.homepage_url}
                sourceConflicts={conflicts}
              />
            </div>
          );
        })()}

        {/* Notes */}
        {notes.length > 0 && (
          <Card className="mb-6 border-amber-200/70 bg-amber-50/40">
            {notes.map((note) => (
              <div key={note.id}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={2.25} />
                  <h2 className="text-[13px] font-semibold text-amber-900 uppercase tracking-wider">
                    {note.titel}
                  </h2>
                </div>
                <div className="text-[14px] text-amber-900 leading-relaxed whitespace-pre-line">
                  {note.inhalt}
                </div>
                {(note.datum_von || note.datum_bis) && (
                  <p className="text-[11px] text-amber-700/70 mt-2 num">
                    {note.datum_von && `Seit ${new Date(note.datum_von + "T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`}
                    {note.datum_von && note.datum_bis && " — "}
                    {note.datum_bis && `bis ${new Date(note.datum_bis + "T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`}
                  </p>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* Mandate */}
        <Card className="mb-6">
          <SectionHeader label="Mandate" count={dbMandates.length} />
          <div className="space-y-1">
            {dbMandates.map((m) => (
              <div
                key={m.id}
                className="flex items-baseline gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors"
              >
                <span className="text-[13.5px] font-medium text-zinc-950">
                  {m.period_label}
                </span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                  {m.parliament_label}
                </span>
                {m.fraction && (
                  <span className="text-[11px] text-zinc-400">{m.fraction}</span>
                )}
                {m.constituency && (
                  <span className="text-[11px] text-zinc-400 ml-auto">
                    WK {m.constituency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Parlamentarische Arbeit */}
        {parlArbeit.length > 0 && (
          <Card className="mb-6">
            <SectionHeader label="Parlamentarische Arbeit" count={parlArbeit.length} />

            {/* Stats strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5 text-[12px]">
              {parlStats.rede ? (
                <Stat2 label="Reden" value={parlStats.rede} />
              ) : null}
              {parlStats.frage ? (
                <Stat2 label="Fragen & Antworten" value={parlStats.frage} />
              ) : null}
              {parlStats.debattenbeitrag ? (
                <Stat2 label="Debattenbeiträge" value={parlStats.debattenbeitrag} />
              ) : null}
              {parlStats.erklaerung ? (
                <Stat2 label="Erklärungen" value={parlStats.erklaerung} />
              ) : null}
              {parlStats.gesetzgebung ? (
                <Stat2 label="Gesetzgebung" value={parlStats.gesetzgebung} />
              ) : null}
              {parlStats.bericht ? (
                <Stat2 label="Berichte" value={parlStats.bericht} />
              ) : null}
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {parlArbeit.map((item) => (
                <article
                  key={item.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors"
                >
                  <div className="flex flex-col items-start gap-0.5 shrink-0 w-24">
                    <span className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                      {shortenTyp(item.typ)}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {item.quelle === "kombiniert" ? "DIP+Plenar"
                        : item.quelle === "plenar" ? "Plenar"
                        : "DIP"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.thema && (
                      <p className="text-[13.5px] text-zinc-950 line-clamp-2 mb-1 leading-snug">
                        {item.thema}
                      </p>
                    )}
                    {item.zusammenfassung && (
                      <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-1.5">
                        {item.zusammenfassung}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap num">
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
                          <span className="text-zinc-200">·</span>
                          <span>Sitzung {item.sitzung}</span>
                        </>
                      )}
                      {item.drucksache_nr && (
                        <>
                          <span className="text-zinc-200">·</span>
                          {item.pdf_url ? (
                            <a
                              href={item.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                            >
                              Drucksache {item.drucksache_nr}
                              <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                            </a>
                          ) : (
                            <span>Drucksache {item.drucksache_nr}</span>
                          )}
                        </>
                      )}
                      {item.source_url && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                          >
                            PDF
                            <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Card>
        )}

        {/* Voting Bar */}
        {hasVoteData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <SectionHeader label="Abstimmungsverhalten" />
              <VotingBar
                yes={voteStats.votedYes}
                no={voteStats.votedNo}
                abstain={voteStats.abstained}
                noShow={voteStats.noShow}
                total={voteStats.totalPolls}
              />
            </Card>
            <Card>
              <SectionHeader label="Anwesenheit vs. Durchschnitt" />
              <ComparisonRow
                label="Diese:r MdB"
                value={voteStats.attendanceRate}
                color="bg-zinc-900"
              />
              <ComparisonRow
                label="Durchschnitt"
                value={avgAttendance}
                color="bg-zinc-300"
              />
            </Card>
          </div>
        )}

        {/* Sidejobs + Committees */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <SectionHeader label="Nebeneinkünfte" count={sidejobs.length || undefined} />
            {sidejobs.length > 0 ? (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {sidejobs.map((s) => (
                  <div
                    key={s.id}
                    className="px-3 py-2.5 rounded-lg border border-zinc-100"
                  >
                    <p className="text-[13px] font-medium text-zinc-950 mb-1">
                      {s.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                      {s.organization && <span>{s.organization}</span>}
                      {s.income_level && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span>{getIncomeRange(s.income_level)}</span>
                        </>
                      )}
                      {s.income && s.income > 0 && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span className="num font-medium text-zinc-700">
                            {s.income.toLocaleString("de-DE")} €
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-zinc-400 py-6 text-center">
                Keine Nebeneinkünfte gemeldet.
              </p>
            )}
          </Card>

          <Card>
            <SectionHeader label="Ausschüsse" count={committees.length || undefined} />
            {committees.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {committees.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-baseline gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-[13px] font-medium text-zinc-950">
                      {c.committee_label}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      {c.committee_role === "chairperson" ? "Vorsitz"
                        : c.committee_role === "deputy_chairperson" ? "Stv. Vorsitz"
                        : c.committee_role === "regular_member" ? "Ord. Mitglied"
                        : c.committee_role === "alternate_member" ? "Stv. Mitglied"
                        : c.committee_role?.replace(/_/g, " ") || "Mitglied"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-zinc-400 py-6 text-center">
                Keine Ausschuss-Mitgliedschaften gefunden.
              </p>
            )}
          </Card>
        </div>

        {/* Recent Votes */}
        {votes.length > 0 && (
          <Card>
            <SectionHeader label="Letzte Abstimmungen" />
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {votes.slice(0, 20).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  <span
                    className={
                      "text-[10px] font-medium uppercase tracking-wider w-16 shrink-0 " +
                      (v.vote === "yes" ? "text-emerald-700"
                        : v.vote === "no" ? "text-red-700"
                        : v.vote === "abstain" ? "text-amber-700"
                        : "text-zinc-400")
                    }
                  >
                    {v.vote === "yes" ? "Ja"
                      : v.vote === "no" ? "Nein"
                      : v.vote === "abstain" ? "Enthaltung"
                      : "Abwesend"}
                  </span>
                  <span className="text-[13px] text-zinc-700 flex-1 truncate">
                    {v.poll_label}
                  </span>
                  {v.poll_url && (
                    <a
                      href={v.poll_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-950 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="num text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">{value}</span>
      {sub && <span className="text-[11px] text-zinc-400 num">{sub}</span>}
    </div>
  );
}

function Stat2({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="num font-semibold text-zinc-950">{value}</span>
      <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-zinc-200/70 p-6 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </h2>
      {count !== undefined && (
        <span className="num text-[11px] text-zinc-400">{count}</span>
      )}
    </div>
  );
}

function VotingBar({
  yes, no, abstain, noShow, total,
}: {
  yes: number; no: number; abstain: number; noShow: number; total: number;
}) {
  if (total === 0) return null;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-100 mb-4">
        <div className="bg-emerald-500" style={{ width: pct(yes) }} />
        <div className="bg-red-500" style={{ width: pct(no) }} />
        <div className="bg-amber-500" style={{ width: pct(abstain) }} />
        <div className="bg-zinc-400" style={{ width: pct(noShow) }} />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12.5px]">
        <Legend dot="bg-emerald-500" label="Ja" value={yes} />
        <Legend dot="bg-red-500" label="Nein" value={no} />
        <Legend dot="bg-amber-500" label="Enthaltung" value={abstain} />
        <Legend dot="bg-zinc-400" label="Abwesend" value={noShow} />
      </div>
    </div>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-zinc-500">{label}</span>
      <span className="num font-medium text-zinc-950 ml-auto">{value}</span>
    </div>
  );
}

function ComparisonRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12.5px] text-zinc-500">{label}</span>
        <span className="num text-[13px] font-semibold text-zinc-950">
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
