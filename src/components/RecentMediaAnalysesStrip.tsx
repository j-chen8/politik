import Link from "next/link";
import path from "path";
import fs from "fs";
import { ArrowRight } from "lucide-react";
import { MediaAppearanceCard } from "@/components/MediaAppearanceCard";
import { type MediaAppearanceIndexEntry } from "@/lib/media-appearances";

export function RecentMediaAnalysesStrip() {
  const indexPath = path.join(process.cwd(), "data", "media-appearances.json");
  let appearances: MediaAppearanceIndexEntry[] = [];
  try {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    appearances = (idx.appearances ?? []).filter((a: MediaAppearanceIndexEntry) => a.analysis_file);
  } catch {
    return null;
  }
  const top = appearances
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="w-full border-y border-zinc-200/70 bg-[#1a3e72]/[0.025] py-14 dark:border-zinc-800 dark:bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div className="pl-5">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1a3e72]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1a3e72]">
                Medien-Analyse
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-100">
              Aktuelle Interview-Analysen
            </h2>
            <p className="mt-1.5 text-[13.5px] text-zinc-500 max-w-xl leading-relaxed dark:text-zinc-400">
              Interviews und Talkshow-Auftritte von Abgeordneten, ausgewertet auf
              Kernaussagen und Tonalität.
            </p>
          </div>
          <Link
            href="/medien"
            className="shrink-0 text-[12.5px] font-medium text-zinc-500 hover:text-zinc-950 transition-colors inline-flex items-center gap-1"
          >
            Alle Auftritte
            <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top.map((a) => (
            <MediaAppearanceCard key={a.id} appearance={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
