import { ContextualLink as Link } from "@/components/ContextualLink";
import { TOPIC_VISUAL } from "@/lib/citizen-topics";
import type { CSSProperties } from "react";

/**
 * Themen-Kachel: neutrale Karte mit ZARTER Tönung der Themenfarbe (nicht bunt,
 * aber unterscheidbar). Tönung via `.topic-tile` (color-mix in globals.css) — hell
 * und dunkel getrennt. Dunkle Schrift in Light, helle in Dark.
 */
export function TopicCard({ slug, label }: { slug: string; label: string }) {
  const color = TOPIC_VISUAL[slug]?.color ?? "#6b7280";
  return (
    <Link
      href={`/themen/${slug}`}
      className="topic-tile group flex aspect-[1.7] items-start overflow-hidden rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{ "--tile": color } as CSSProperties}
    >
      <span className="text-[15px] sm:text-[16px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
        {label}
      </span>
    </Link>
  );
}
