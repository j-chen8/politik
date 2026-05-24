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
    <section className="w-full max-w-5xl mx-auto pt-12 px-5 pb-4">
      <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950">
          Aktuelle Interview-Analysen
        </h2>
        <Link
          href="/design/linear/medien"
          className="text-[12.5px] font-medium text-zinc-500 hover:text-zinc-950 transition-colors inline-flex items-center gap-1"
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
    </section>
  );
}
