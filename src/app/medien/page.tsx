import path from "path";
import fs from "fs";
import { MediaAppearanceCard } from "@/components/MediaAppearanceCard";
import { type MediaAppearanceIndexEntry } from "@/lib/media-appearances";

export const metadata = {
  title: "Medien-Auftritte — Interview-Analysen | Politik-Radar",
  description:
    "KI-gestützte Themen- und Aussagen-Analysen von Podcast- und Talkshow-Auftritten von Bundestagsabgeordneten.",
};

export default function MedienOverviewPage() {
  const indexPath = path.join(process.cwd(), "data", "media-appearances.json");
  let appearances: MediaAppearanceIndexEntry[] = [];
  try {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    appearances = (idx.appearances ?? []).filter(
      (a: MediaAppearanceIndexEntry) => a.analysis_file
    );
  } catch {
    appearances = [];
  }

  const sorted = appearances.sort((a, b) =>
    b.published_at.localeCompare(a.published_at)
  );

  const publishers = new Set(sorted.map((a) => a.publisher));
  const politicians = new Set(sorted.map((a) => a.politician_id));

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-5xl mx-auto px-5 py-12 fade-in-up">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Medien-Auftritte
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-3">
            Interview-Analysen
          </h1>
          <p className="text-[15px] text-zinc-600 leading-relaxed max-w-2xl">
            <strong className="text-zinc-950 num">{sorted.length}</strong> KI-analysierte
            Auftritte von <strong className="text-zinc-950 num">{politicians.size}</strong>{" "}
            Bundestagsabgeordneten aus{" "}
            <strong className="text-zinc-950 num">{publishers.size}</strong>{" "}
            {publishers.size === 1 ? "Sendung" : "Sendungen"}. Pro Auftritt: Themen,
            Frage-Antwort-Bewertung, Original-Zitate mit Zeitstempel.
          </p>
        </div>

        {/* Grid */}
        {sorted.length === 0 ? (
          <p className="text-[14px] text-zinc-500">Noch keine analysierten Auftritte.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((a) => (
              <MediaAppearanceCard key={a.id} appearance={a} />
            ))}
          </div>
        )}

        {/* Methodik-Hinweis */}
        <div className="mt-10 pt-6 border-t border-zinc-200/70">
          <p className="text-[12.5px] text-zinc-500 leading-relaxed max-w-2xl">
            Transkripte stammen aus YouTube-Auto-Captions bzw. ZDF-redaktionellen
            Untertiteln und werden mit Claude Haiku analysiert. Klassifikation ist
            LLM-Auslegung, kein etabliertes Coding-Schema — bei jedem Thema sind Frage,
            Position und Begründung sichtbar, damit man sich selbst ein Urteil bilden
            kann. Volle Methodik auf{" "}
            <a
              href="/methodik"
              className="underline decoration-zinc-300 hover:decoration-zinc-950 hover:text-zinc-950"
            >
              /methodik
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
