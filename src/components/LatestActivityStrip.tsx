import { getLatestActivityHighlights } from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Gavel, Vote, FileText } from "lucide-react";

function formatGermanDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  const monthIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)}. ${months[monthIdx] ?? m} ${y}`;
}

function mostRecent(...dates: (string | undefined | null)[]): string | null {
  const valid = dates.filter((d): d is string => !!d);
  if (valid.length === 0) return null;
  return valid.sort().slice(-1)[0];
}

export function LatestActivityStrip() {
  const { latestSession, latestPoll, latestDrucksache } = getLatestActivityHighlights();
  if (!latestSession && !latestPoll && !latestDrucksache) return null;

  const newestDate = mostRecent(latestSession?.datum, latestPoll?.date, latestDrucksache?.datum);

  return (
    <section className="w-full max-w-5xl mx-auto px-5 pb-8 pt-2">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-0.5">
            Letzter Datenstand
          </div>
          <h3 className="text-lg font-semibold text-zinc-950 tracking-tight">
            Aktuell aus dem Bundestag
          </h3>
        </div>
        {newestDate && (
          <div className="text-[12px] text-zinc-500 num shrink-0">
            {formatGermanDate(newestDate)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {latestSession && (
          <Link
            href="/design/linear/protokolle"
            className="card-hover group block bg-white border border-zinc-200/70 rounded-2xl p-5"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              <Gavel className="w-3 h-3" strokeWidth={2.25} />
              Plenarsitzung
            </div>
            <div className="text-[15px] font-semibold text-zinc-950 tracking-tight mb-1 num">
              {latestSession.sitzung}. Sitzung
            </div>
            <div className="text-[13px] text-zinc-600 mb-3">
              <span className="num">{latestSession.speechCount}</span> Reden — Wortprotokoll, Quellenpointer, KI-Zusammenfassung pro Rede
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 num">{formatGermanDate(latestSession.datum)}</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />
            </div>
          </Link>
        )}

        {latestPoll && (
          <Link
            href={`/design/linear/abstimmungen/${latestPoll.pollId}`}
            className="card-hover group block bg-white border border-zinc-200/70 rounded-2xl p-5"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              <Vote className="w-3 h-3" strokeWidth={2.25} />
              Abstimmung
            </div>
            <div className="text-[13.5px] font-medium text-zinc-900 leading-snug mb-3 line-clamp-3 min-h-[60px]">
              {latestPoll.label}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 num">{formatGermanDate(latestPoll.date)}</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />
            </div>
          </Link>
        )}

        {latestDrucksache && (
          <Link
            href={`/design/linear/aktivitaeten/${latestDrucksache.drucksacheNr.replace("/", "-")}`}
            className="card-hover group block bg-white border border-zinc-200/70 rounded-2xl p-5"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              <FileText className="w-3 h-3" strokeWidth={2.25} />
              Drucksache {latestDrucksache.drucksacheNr}
            </div>
            <div className="text-[13.5px] font-medium text-zinc-900 leading-snug mb-3 line-clamp-3 min-h-[60px]">
              {latestDrucksache.thema}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 num">{formatGermanDate(latestDrucksache.datum)}</span>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" strokeWidth={2.25} />
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
