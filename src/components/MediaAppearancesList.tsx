import Link from "next/link";
import { ExternalLink, Mic, Tv, Radio, Youtube, ChevronRight } from "lucide-react";
import {
  type MediaAppearanceIndexEntry,
  getMediaAppearanceStats,
} from "@/lib/media-appearances";

const FORMAT_META: Record<MediaAppearanceIndexEntry["format"], { Icon: typeof Mic; label: string }> = {
  podcast: { Icon: Mic, label: "Podcast" },
  tv: { Icon: Tv, label: "TV / Talkshow" },
  radio: { Icon: Radio, label: "Radio" },
  youtube: { Icon: Youtube, label: "YouTube" },
};

function formatPublishedAt(value: string): string {
  const monthOnly = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthOnly) {
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return `${months[Number(monthOnly[2]) - 1]} ${monthOnly[1]}`;
  }
  const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (full) return `${full[3]}.${full[2]}.${full[1]}`;
  return value;
}

export function MediaAppearancesList({
  items,
  politicianId,
}: {
  items: MediaAppearanceIndexEntry[];
  politicianId: number;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((a) => {
        const { Icon, label: formatLabel } = FORMAT_META[a.format];
        const stats = a.analysis_file ? getMediaAppearanceStats(a.id) : null;
        const hasDetail = !!stats;
        const detailHref = `/design/linear/politiker/${politicianId}/medien/${a.id}`;

        return (
          <article
            key={a.id}
            className="bg-white border border-zinc-200/70 rounded-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                <Icon className="w-4 h-4 text-zinc-700" strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                  <span className="text-[13.5px] font-semibold text-zinc-950">
                    {a.publisher}
                  </span>
                  {a.episode_label && (
                    <span className="text-[11.5px] text-zinc-500">· {a.episode_label}</span>
                  )}
                  <span className="text-[11.5px] text-zinc-500">· {formatPublishedAt(a.published_at)}</span>
                  {a.duration_label && (
                    <span className="text-[11.5px] text-zinc-400">· {a.duration_label}</span>
                  )}
                </div>
                <div className="text-[12.5px] text-zinc-600 mt-0.5">
                  {a.title}
                  {a.host && <span className="text-zinc-400"> · mit {a.host}</span>}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-400 shrink-0">
                {formatLabel}
              </span>
            </div>

            {/* Stats-Strip — nur bei detaillierter Analyse */}
            {hasDetail && stats && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-zinc-100">
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-3 text-[12px] text-zinc-600">
                  <span>
                    <strong className="text-zinc-950 num">{stats.themesTotal}</strong> Themen
                  </span>
                  <span>
                    <strong className="text-zinc-950 num">{stats.themesSubstantielle}</strong> substantiell beantwortet
                  </span>
                  {stats.themesAusweichend > 0 && (
                    <span>
                      <strong className="text-amber-800 num">{stats.themesAusweichend}</strong> ausweichend / pivotierend
                    </span>
                  )}
                  <span>
                    <strong className="text-zinc-950 num">{stats.factualClaims}</strong> Faktenbehauptungen
                  </span>
                </div>

                {/* Top-Themen als Tags */}
                {stats.topThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {stats.topThemes.map((t, i) => (
                      <span
                        key={i}
                        className="inline-block text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                    {stats.themesTotal > stats.topThemes.length && (
                      <span className="inline-block text-[11px] text-zinc-400 px-1 py-0.5">
                        +{stats.themesTotal - stats.topThemes.length} weitere
                      </span>
                    )}
                  </div>
                )}

                {/* Detail-Link */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Link
                    href={detailHref}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-zinc-950 hover:text-zinc-700 transition-colors"
                  >
                    Detail-Analyse
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </Link>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    Original-Podcast
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                  </a>
                </div>
              </div>
            )}

            {/* Phase-1-Manuell-Fallback */}
            {!hasDetail && a.topics && a.topics.length > 0 && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-zinc-100">
                <div className="rounded-md border border-amber-200/70 bg-amber-50/40 px-3 py-2 mt-3 mb-3 text-[11.5px] text-amber-900">
                  Phase-1-Stand: kuratierte Themen-Übersicht, KI-Analyse noch ausstehend.
                </div>
                <ul className="space-y-1 text-[13px] text-zinc-700">
                  {a.topics.map((t, i) => (
                    <li key={i}>· {t}</li>
                  ))}
                </ul>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mt-3"
                >
                  Original
                  <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                </a>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
