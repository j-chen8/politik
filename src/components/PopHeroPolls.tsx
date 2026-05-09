import { getClosestPolls } from "@/lib/db";
import Link from "next/link";

function formatGermanDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const monthIdx = parseInt(m, 10) - 1;
  return `${parseInt(d, 10)}. ${months[monthIdx] ?? m} ${y}`;
}

export function PopHeroPolls() {
  const polls = getClosestPolls(3);
  if (polls.length === 0) return null;

  return (
    <section className="w-full max-w-5xl mx-auto px-5 pb-12">
      <div className="mb-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-0.5">
          Diese Woche knapp
        </div>
        <h3 className="text-lg font-semibold text-zinc-950 tracking-tight">
          Drei Abstimmungen mit hauchdünner Mehrheit
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {polls.map((poll) => {
          const yesRatio = poll.yes_ratio;
          const yesPct = (yesRatio * 100).toFixed(1).replace(".", ",");
          const yesPctNum = yesRatio * 100;
          const noPctNum = 100 - yesPctNum;

          return (
            <Link
              key={poll.poll_id}
              href={`/design/linear/abstimmungen/${poll.poll_id}`}
              className="block bg-white border border-zinc-200/70 rounded-2xl p-5 hover:border-zinc-400 transition-colors"
            >
              <div className="text-[11px] text-zinc-400 num mb-2">
                {formatGermanDate(poll.poll_date)}
              </div>
              <div className="text-[13.5px] font-medium text-zinc-900 leading-snug mb-3 min-h-[40px] line-clamp-2">
                {poll.poll_label}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-semibold text-zinc-950 num">{yesPct} %</span>
                <span className="text-[11px] text-zinc-500">Ja-Anteil</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-zinc-100 flex">
                <div className="bg-emerald-500" style={{ width: `${yesPctNum}%` }} />
                <div className="bg-rose-400" style={{ width: `${noPctNum}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 num mt-1.5">
                <span>{poll.yes} Ja</span>
                <span>{poll.no} Nein</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center mt-4">
        <Link
          href="/design/linear/abstimmungen"
          className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Alle Abstimmungen →
        </Link>
      </div>
    </section>
  );
}
