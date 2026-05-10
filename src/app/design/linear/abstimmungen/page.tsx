import { listAllPollsForIndex, type PollIndexRow } from "@/lib/db";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export default function AbstimmungenIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  return <AbstimmungenIndexInner searchParams={searchParams} />;
}

async function AbstimmungenIndexInner({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const { q = "", year = "" } = await searchParams;
  const all = listAllPollsForIndex();

  const years = Array.from(
    new Set(all.map((p) => p.poll_date?.slice(0, 4)).filter(Boolean) as string[])
  ).sort((a, b) => b.localeCompare(a));

  const filtered = all.filter((p) => {
    if (year && p.poll_date?.slice(0, 4) !== year) return false;
    if (q) {
      const haystack = (p.poll_label ?? "").toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const totalMapped = all.filter((p) => p.has_topic_match === 1).length;

  return (
    <div className="page-wash">
      <div className="w-full max-w-5xl mx-auto px-5 pt-12 pb-24">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Namentliche Abstimmungen · Bundestag · Wahlperiode 21
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 leading-tight mb-3">
            Wer hat wann wie abgestimmt — und was wurde gesagt?
          </h1>
          <p className="text-[14px] text-zinc-600 leading-relaxed max-w-2xl">
            Alle <span className="num font-medium text-zinc-900">{all.length.toLocaleString("de-DE")}</span> namentlichen
            Abstimmungen seit Beginn der Wahlperiode. Für{" "}
            <span className="num font-medium text-zinc-900">{totalMapped}</span> davon haben wir die zugehörige
            Plenar-Debatte automatisch verknüpft — pro Vote findest du Reden mit Tonalität, Forderungen und Zitaten
            neben dem Stimmverhalten.
          </p>
        </div>

        {/* Filter-Leiste */}
        <form className="mb-8 fade-in-up fade-in-up-2" action="" method="get">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" strokeWidth={2.25} />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={`Suche im Vote-Titel — z.B. „Familie", „Bundeswehr", „Steuer"…`}
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-zinc-200/80 rounded-xl bg-white focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            <select
              name="year"
              defaultValue={year}
              className="text-[13px] py-2 px-3 border border-zinc-200/80 rounded-xl bg-white focus:outline-none focus:border-zinc-400 transition-colors"
            >
              <option value="">alle Jahre</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-[13px] font-medium px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            >
              Filtern
            </button>
            {(q || year) && (
              <Link
                href="/design/linear/abstimmungen"
                className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Zurücksetzen
              </Link>
            )}
          </div>
          <div className="text-[11.5px] text-zinc-500 mt-2 num">
            {filtered.length} von {all.length} angezeigt
          </div>
        </form>

        {/* Liste */}
        <div className="space-y-2 fade-in-up fade-in-up-3">
          {filtered.map((p) => (
            <PollCard key={p.poll_id} p={p} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
              Keine Abstimmung passt zu diesem Filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PollCard({ p }: { p: PollIndexRow }) {
  const yesPct = p.total > 0 ? (p.yes / p.total) * 100 : 0;
  const noPct = p.total > 0 ? (p.no / p.total) * 100 : 0;
  const abstainPct = p.total > 0 ? (p.abstain / p.total) * 100 : 0;
  const passed = p.yes > p.no;

  return (
    <Link
      href={`/design/linear/abstimmungen/${p.poll_id}`}
      className="block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Datum + Outcome */}
        <div className="shrink-0 w-[90px]">
          <div className="text-[11.5px] font-mono text-zinc-500 num">
            {formatDate(p.poll_date)}
          </div>
          <div
            className={`mt-1 inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${
              passed
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {passed ? "angenommen" : "abgelehnt"}
          </div>
        </div>

        {/* Label + Stats */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-zinc-950 leading-snug mb-2 group-hover:text-zinc-700 transition-colors">
            {p.poll_label ?? `Abstimmung #${p.poll_id}`}
          </div>

          {/* Stimmen-Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500/80" style={{ width: `${yesPct}%` }} />
              <div className="bg-rose-500/80" style={{ width: `${noPct}%` }} />
              <div className="bg-amber-400/70" style={{ width: `${abstainPct}%` }} />
            </div>
            <div className="text-[11px] num text-zinc-500 shrink-0">
              <span className="text-emerald-700">{p.yes}</span>
              <span className="text-zinc-300 mx-1">·</span>
              <span className="text-rose-700">{p.no}</span>
              {p.abstain > 0 && (
                <>
                  <span className="text-zinc-300 mx-1">·</span>
                  <span className="text-amber-700">{p.abstain}</span>
                </>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
            {p.has_topic_match === 1 ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="num">{p.speech_count}</span> Reden verknüpft
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                ohne Reden-Verknüpfung
              </span>
            )}
            {p.match_confidence === "high" && (
              <span className="text-emerald-700">Match: hoch</span>
            )}
            {p.match_confidence === "medium" && (
              <span className="text-amber-700">Match: mittel</span>
            )}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" strokeWidth={2.25} />
      </div>
    </Link>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y.slice(2)}`;
}
