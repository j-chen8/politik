import Link from "next/link";
import { ArrowLeft, ChevronRight, ExternalLink, FileText, Gavel, Vote } from "lucide-react";
import { getPlenarSessions } from "@/lib/db";

const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function formatGermanDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${parseInt(d, 10)}. ${MONTHS_DE[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function monthKey(iso: string | null): string {
  if (!iso) return "unbekannt";
  const [y, m] = iso.split("-");
  if (!y || !m) return iso;
  return `${MONTHS_DE[parseInt(m, 10) - 1] ?? m} ${y}`;
}

export default function SitzungenListPage() {
  const sessions = getPlenarSessions();

  // Gruppen nach Monat, Reihenfolge wie sessions (DESC)
  const groups: Array<{ month: string; sessions: typeof sessions }> = [];
  for (const s of sessions) {
    const key = monthKey(s.datum);
    let g = groups[groups.length - 1];
    if (!g || g.month !== key) {
      g = { month: key, sessions: [] };
      groups.push(g);
    }
    g.sessions.push(s);
  }

  const totalSpeeches = sessions.reduce((sum, s) => sum + s.speech_count, 0);
  const totalTopics = sessions.reduce((sum, s) => sum + s.topic_count, 0);
  const totalVotes = sessions.reduce((sum, s) => sum + s.vote_count, 0);
  const wahlperioden = Array.from(new Set(sessions.map((s) => s.wahlperiode))).sort((a, b) => b - a);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8 fade-in-up">
        {/* Breadcrumb */}
        <Link
          href="/protokolle"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Protokolle
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Plenarsitzungen · WP {wahlperioden.join(", ")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-zinc-950 leading-tight">
            Alle Sitzungen
          </h1>
          <p className="mt-4 text-[14px] text-zinc-700 leading-relaxed">
            {sessions.length} Sitzungen · {totalTopics.toLocaleString("de-DE")} Tagesordnungspunkte · {totalSpeeches.toLocaleString("de-DE")} Reden · {totalVotes} namentliche {totalVotes === 1 ? "Abstimmung" : "Abstimmungen"}
          </p>
        </div>

        {/* Gruppen */}
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.month}>
              <div className="flex items-baseline justify-between mb-3 px-1">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-zinc-600">
                  {group.month}
                </h2>
                <span className="text-[11px] text-zinc-400 num">
                  {group.sessions.length} {group.sessions.length === 1 ? "Sitzung" : "Sitzungen"}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                {group.sessions.map((s) => (
                  <SessionRow key={s.sitzung} session={s} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: ReturnType<typeof getPlenarSessions>[number] }) {
  const detailHref = `/protokolle/sitzung/${session.sitzung}`;

  return (
    <div className="group flex items-stretch border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
      <Link href={detailHref} className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
        {/* Sitzungsnummer */}
        <div className="shrink-0 w-12 text-center">
          <div className="text-xl font-semibold text-zinc-950 num leading-none">
            {session.sitzung}
          </div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">
            Nr.
          </div>
        </div>

        {/* Datum + Mini-Stats */}
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] text-zinc-900 font-medium num">
            {formatGermanDate(session.datum)}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[11.5px] text-zinc-500">
            <span className="inline-flex items-center gap-1 num">
              <Gavel className="w-3 h-3" strokeWidth={2.25} />
              {session.speech_count}
            </span>
            <span className="inline-flex items-center gap-1 num">
              <FileText className="w-3 h-3" strokeWidth={2.25} />
              {session.topic_count}
            </span>
            {session.vote_count > 0 && (
              <span className="inline-flex items-center gap-1 num">
                <Vote className="w-3 h-3" strokeWidth={2.25} />
                {session.vote_count}
              </span>
            )}
            <span className="num text-zinc-400">·</span>
            <span className="num text-zinc-400">{session.speaker_count} Sprecher</span>
          </div>
        </div>

        <ChevronRight
          className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 shrink-0 transition-colors"
          strokeWidth={2.25}
        />
      </Link>

      {/* PDF-Link separat, damit Click nicht in den Detail-Link bubbled */}
      {session.source_url && (
        <a
          href={session.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center px-3 text-[11px] text-[#1a3e72] hover:text-[#0f2a52] hover:bg-[#1a3e72]/10 border-l border-zinc-100 transition-colors"
          title="Offizielles PDF-Protokoll"
        >
          PDF
          <ExternalLink className="w-3 h-3 ml-1" strokeWidth={2.25} />
        </a>
      )}
    </div>
  );
}
