import { ContextualLink as Link } from "@/components/ContextualLink";
import { TOPIC_VISUAL } from "@/lib/citizen-topics";
import {
  TrendingUp, Users, HeartHandshake, Swords, Shield, ShieldAlert, HeartPulse,
  PiggyBank, Landmark, Leaf, Zap, Briefcase, TrainFront, Cpu, Scale, Building2,
  Globe, Wheat, GraduationCap, Home, LayoutGrid, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  TrendingUp, Users, HeartHandshake, Swords, Shield, ShieldAlert, HeartPulse,
  PiggyBank, Landmark, Leaf, Zap, Briefcase, TrainFront, Cpu, Scale, Building2,
  Globe, Wheat, GraduationCap, Home, LayoutGrid,
};

/**
 * Farbige „Browse"-Kachel (Spotify-Pattern): einfarbiger Block, fetter weißer
 * Titel, großes gekipptes Icon unten-rechts (ersetzt Spotifys Thumbnail).
 * Farbe rein ästhetisch (siehe TOPIC_VISUAL) — kein Etikett.
 */
export function TopicCard({ slug, label }: { slug: string; label: string }) {
  const v = TOPIC_VISUAL[slug] ?? { color: "#6b7280", icon: "LayoutGrid" };
  const Icon = ICONS[v.icon] ?? LayoutGrid;
  return (
    <Link
      href={`/themen/${slug}`}
      className="group relative flex aspect-[1.5] overflow-hidden rounded-xl p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: v.color }}
    >
      <span className="relative z-10 pr-6 text-[15px] sm:text-[16px] font-bold leading-tight tracking-tight text-white">
        {label}
      </span>
      <Icon
        className="absolute -bottom-3 -right-3 h-20 w-20 rotate-[18deg] text-white/20 transition-transform group-hover:scale-110 group-hover:rotate-[12deg]"
        strokeWidth={1.75}
      />
    </Link>
  );
}
