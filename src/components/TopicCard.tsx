import { ContextualLink as Link } from "@/components/ContextualLink";
import { TOPIC_VISUAL } from "@/lib/citizen-topics";

/**
 * Farbige „Browse"-Kachel: einfarbiger Block, fetter weißer Titel. Farbe rein
 * ästhetisch (siehe TOPIC_VISUAL) — kein Etikett.
 */
export function TopicCard({ slug, label }: { slug: string; label: string }) {
  const color = TOPIC_VISUAL[slug]?.color ?? "#6b7280";
  return (
    <Link
      href={`/themen/${slug}`}
      className="group flex aspect-[1.7] items-start overflow-hidden rounded-xl p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: color }}
    >
      <span className="text-[15px] sm:text-[16px] font-bold leading-tight tracking-tight text-white">
        {label}
      </span>
    </Link>
  );
}
