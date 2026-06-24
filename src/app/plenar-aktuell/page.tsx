import Link from "next/link";
import { ArrowRight, Calendar, Vote } from "lucide-react";
import { getLatestPlenarWeek, type PartyCount } from "@/lib/plenar-aktuell";

const PARTY_SHORT: Record<string, string> = {
  "CDU/CSU": "CDU",
  AfD: "AfD",
  SPD: "SPD",
  "Die Linke": "Linke",
  "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
  fraktionslos: "FL",
};

const PARTY_COLOR: Record<string, string> = {
  "CDU/CSU": "bg-zinc-800",
  SPD: "bg-rose-500",
  AfD: "bg-sky-600",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-emerald-600",
  "Die Linke": "bg-fuchsia-600",
  fraktionslos: "bg-zinc-400",
};

function formatGermanDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return `${parseInt(d, 10)}. ${months[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function shortenTitle(title: string): string {
  const trimmed = title
    .replace(/^(Erste|Zweite und dritte|Zweite|Dritte) Beratung des (von .+? eingebrachten )?Entwurfs (eines|einer) /i, "Gesetzentwurf: ")
    .replace(/^Beratung des Antrags der Abgeordneten .+? und der Fraktion (der )?/i, "Antrag ")
    .replace(/^Beratung des Antrags der Fraktion (der )?/i, "Antrag ")
    .replace(/^Verlangen der Fraktion (der )?/i, "Verlangen ");
  return trimmed.length > 140 ? trimmed.slice(0, 137) + "…" : trimmed;
}

export default function PlenarAktuellPage() {
  const week = getLatestPlenarWeek();

  if (!week) {
    return (
      <div className="page-wash min-h-screen">
        <div className="page-shell text-center">
          <p className="text-zinc-500 dark:text-zinc-400">Keine Plenardaten gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        {/* Status-Badge */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-[11px] font-medium text-amber-800 dark:text-amber-400 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Test-Seite — Aktualitäts-Anker MVP
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Letzte Plenarwoche
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50 mb-2">
            {week.sitzung}. Sitzung des {week.wahlperiode}. Bundestags
          </h1>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" strokeWidth={2.25} />
            {formatGermanDate(week.datum)} · Stand: aktuellster verfügbarer Plenartag
          </p>
        </div>

        {/* Summary */}
        <section className="mb-10 fade-in-up fade-in-up-2">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-[14.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Im Plenum wurden{" "}
              <span className="num text-zinc-900 dark:text-zinc-100 font-medium">{week.topic_count}</span>{" "}
              Tagesordnungspunkte mit insgesamt{" "}
              <span className="num text-zinc-900 dark:text-zinc-100 font-medium">
                {week.total_speeches.toLocaleString("de-DE")}
              </span>{" "}
              Reden verhandelt.
              {week.related_polls.length > 0 && (
                <>
                  {" "}Im Anschluss fanden{" "}
                  <span className="num text-zinc-900 dark:text-zinc-100 font-medium">{week.related_polls.length}</span>{" "}
                  namentliche Abstimmungen statt.
                </>
              )}
            </p>
          </div>
        </section>

        {/* TOP-Liste */}
        <section className="mb-12 fade-in-up fade-in-up-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Tagesordnungspunkte mit Reden
          </div>
          <div className="space-y-2">
            {week.topics.map((topic) => {
              const topicTotal = topic.parties.reduce((s, p) => s + p.count, 0) || 1;
              return (
                <div
                  key={topic.topic_id}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="text-[11px] font-mono font-semibold text-zinc-400 dark:text-zinc-500 w-12 shrink-0 pt-0.5">
                      TOP {topic.topic_number}
                    </div>
                    <div className="flex-1 text-[14px] text-zinc-900 dark:text-zinc-100 leading-snug">
                      {shortenTitle(topic.title)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-16">
                    <div className="text-[12px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      <span className="num text-zinc-900 dark:text-zinc-100 font-medium">{topic.speech_count}</span> Reden ·{" "}
                      <span className="num text-zinc-900 dark:text-zinc-100 font-medium">{topic.speaker_count}</span> Redner
                    </div>
                    <div className="flex-1 max-w-md">
                      <PartyBar parties={topic.parties} total={topicTotal} compact />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Verwandte Abstimmungen */}
        {week.related_polls.length > 0 && (
          <section className="mb-16 fade-in-up fade-in-up-4">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Abstimmungen am selben Tag
            </div>
            <div className="space-y-1.5">
              {week.related_polls.map((poll) => (
                <Link
                  key={poll.poll_id}
                  href={`/abstimmungen/${poll.poll_id}`}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                >
                  <Vote className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" strokeWidth={2.25} />
                  <span className="flex-1 text-[13.5px] text-zinc-900 dark:text-zinc-100">{poll.poll_label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" strokeWidth={2.25} />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer-Pfad */}
        <div className="text-center pt-4 border-t border-border">
          <Link
            href="/protokolle"
            className="text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Alle Plenarprotokolle →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PartyBar({
  parties,
  total,
  compact = false,
}: {
  parties: PartyCount[];
  total: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`${compact ? "h-1.5" : "h-2"} rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex`}
    >
      {parties.map((p) => (
        <div
          key={p.party}
          className={PARTY_COLOR[p.party] ?? "bg-zinc-400"}
          style={{ width: `${(p.count / total) * 100}%` }}
          title={`${p.party}: ${p.count}`}
        />
      ))}
    </div>
  );
}
