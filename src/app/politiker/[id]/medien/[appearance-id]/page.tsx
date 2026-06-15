import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Mic, Tv, Radio, Youtube, Info } from "lucide-react";
import { getPoliticianDb } from "@/lib/db";
import {
  getMediaAppearanceById,
  getMediaAppearanceDetail,
  youtubeUrlWithTimestamp,
  type MediaAppearanceIndexEntry,
} from "@/lib/media-appearances";
import { MediaThemesList } from "@/components/MediaThemesList";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { AppearanceToC } from "@/components/AppearanceToC";
import { ReadingProgress } from "@/components/ReadingProgress";
import { BackToTopButton } from "@/components/BackToTopButton";

const FORMAT_ICONS: Record<MediaAppearanceIndexEntry["format"], typeof Mic> = {
  podcast: Mic,
  tv: Tv,
  radio: Radio,
  youtube: Youtube,
};

interface PageProps {
  params: Promise<{ id: string; "appearance-id": string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { "appearance-id": appearanceId } = await params;
  const entry = getMediaAppearanceById(appearanceId);
  if (!entry) return { title: "Auftritt nicht gefunden" };
  return {
    title: `${entry.politician_display} bei ${entry.publisher} — Detail-Analyse | Politik-Radar`,
    description: `KI-gestützte Themen- und Aussagen-Analyse des Auftritts von ${entry.politician_display} bei „${entry.publisher}" (${entry.episode_label ?? ""}).`,
  };
}

export default async function MediaAppearanceDetailPage({ params }: PageProps) {
  const { id, "appearance-id": appearanceId } = await params;
  const politicianId = Number(id);
  if (!Number.isFinite(politicianId)) notFound();

  const politician = getPoliticianDb(politicianId);
  if (!politician) notFound();

  const entry = getMediaAppearanceById(appearanceId);
  if (!entry || entry.politician_id !== politicianId) notFound();

  const detail = getMediaAppearanceDetail(appearanceId);
  if (!detail) notFound();

  const FormatIcon = FORMAT_ICONS[entry.format];
  const themes = detail.analysis.themes ?? [];
  const factualClaims = detail.analysis.factual_claims_to_verify ?? [];
  const dist = detail._meta.answer_type_distribution ?? {};
  const substantielle = dist.substantielle_position ?? 0;
  const ausweichend = themes.length - substantielle;

  const politicianName = [
    politician.title,
    politician.first_name,
    politician.last_name,
  ].filter(Boolean).join(" ").trim();

  return (
    <div className="page-wash min-h-screen">
      <ReadingProgress />
      <BackToTopButton />
      {/* fade-in-up bewusst nicht verwendet: dessen `transform` würde
          position:sticky der ToC-Bar brechen (sticky degeneriert dann zu
          relative, weil ein transformed-Ancestor der containing block wird). */}
      <div className="page-shell">
        {/* Breadcrumb */}
        <Link
          href={`/politiker/${politicianId}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zu {politicianName || "Profil"}
        </Link>

        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
          <AppearanceToC themes={themes} />
          <main className="min-w-0">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FormatIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Medien-Auftritt · Detail-Analyse
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-3">
            {entry.title}
          </h1>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] text-zinc-600 dark:text-zinc-300">
            <span className="font-medium text-zinc-950 dark:text-zinc-50">{entry.publisher}</span>
            {entry.host && <span>· mit {entry.host}</span>}
            {entry.episode_label && <span>· {entry.episode_label}</span>}
            {entry.duration_label && <span>· {entry.duration_label}</span>}
          </div>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-zinc-950 dark:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 mt-3"
          >
            Original-Audio / Video beim Anbieter
            <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
          </a>
        </div>

        {/* YouTube-Embed (Click-to-Load) — nur für YouTube-Auftritte */}
        {entry.video_id && entry.format !== "tv" && (
          <div className="mb-6">
            <YouTubeEmbed videoId={entry.video_id} title={entry.title} />
          </div>
        )}

        {/* Kompakter Methodik-Hinweis — Volltext am Footer */}
        <div className="mb-6 flex items-center gap-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">
          <Info className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>KI-gestützte Analyse · </span>
          <a href="#methodik" className="underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 hover:text-zinc-950 dark:hover:text-zinc-50">
            Methodik &amp; Caveats unten
          </a>
        </div>

        {/* Overall Summary */}
        <section id="ueberblick" className="mb-8 scroll-mt-28">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Überblick
          </h2>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-[14.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {detail.analysis.overall_summary}
            </p>
          </div>
        </section>

        {/* Statistik — kompakte Einzeile statt Big-Boxes (n ist meist klein) */}
        <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px] text-zinc-600 dark:text-zinc-300 pb-4 border-b border-border">
          <span><strong className="text-zinc-950 dark:text-zinc-50 num">{themes.length}</strong> Themen</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span><strong className="text-zinc-950 dark:text-zinc-50 num">{substantielle}</strong> substantiell</span>
          {ausweichend > 0 && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span><strong className="text-amber-800 dark:text-amber-400 num">{ausweichend}</strong> ausweichend / pivotierend</span>
            </>
          )}
          {factualClaims.length > 0 && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <span><strong className="text-zinc-950 dark:text-zinc-50 num">{factualClaims.length}</strong> Faktenbehauptungen</span>
            </>
          )}
        </div>

        {/* Themen — Toggle Kompakt / Vollständig */}
        <section className="mb-8">
          <MediaThemesList
            themes={themes}
            appearanceUrl={entry.url}
            politicianName={politicianName}
          />
        </section>

        {/* Fakten-Behauptungen */}
        {factualClaims.length > 0 && (
          <section id="fakten" className="mb-10 scroll-mt-28">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Überprüfbare Fakten-Behauptungen
            </h2>
            <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
              Konkrete Sachaussagen, die {politicianName} im Gespräch als Tatsachen
              darstellte. Nicht von dieser Plattform verifiziert — Material für
              eigene Recherche.
            </p>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {factualClaims.map((claim, ci) => (
                <div key={ci} className="p-4 flex items-start gap-3 text-[13.5px]">
                  <a
                    href={youtubeUrlWithTimestamp(entry.url, claim.timestamp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[11.5px] text-zinc-950 dark:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-950 dark:hover:decoration-zinc-100 num pt-0.5"
                  >
                    {claim.timestamp}
                  </a>
                  <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{claim.claim}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Methodik & Caveats — am Footer, prominent sichtbar */}
        <section id="methodik" className="border-t border-border pt-6 mt-10 scroll-mt-28">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Wie diese Analyse zustande kommt
          </h2>
          <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-3">
            <p>
              <strong className="text-amber-900 dark:text-amber-300">Quelle:</strong> {detail._methodology.transcript_source}. {detail._methodology.transcript_caveat}
            </p>
            <p>
              <strong className="text-amber-900 dark:text-amber-300">Klassifikation:</strong> Die Antwort-Typen
              („Substantielle Antwort", „Antwort zu anderem Bezugspunkt" usw.) sind eine
              LLM-Auslegung, kein etabliertes politikwissenschaftliches Coding-Schema. Ohne
              Inter-Annotator-Agreement-Studie. Bei jeder Bewertung sind Frage, Position
              und Begründung sichtbar — bilde dir selbst ein Urteil.
            </p>
            <p>
              <strong className="text-amber-900 dark:text-amber-300">Zitate:</strong> Wortgenaue Übereinstimmung
              wird per Substring-Match validiert (Quote-Validation: {detail._meta.quote_validation.valid_pct} % gültig).
              Trotzdem: bei wichtigen Aussagen immer Original beim Anbieter prüfen — Auto-
              Captions enthalten gelegentlich Übertragungs-Fehler.
            </p>
            <p>
              <strong className="text-amber-900 dark:text-amber-300">Neutralität:</strong> Wir behandeln alle
              Politiker:innen unabhängig von Partei mit demselben Prompt. Unterschiede in den
              Daten reflektieren Politiker-Stil + Format der Sendung, nicht eine Bewertung
              durch die Plattform.
            </p>
          </div>

          {/* Tech-Audit collapsible */}
          <details className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-4">
            <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              Technische Audit-Informationen
            </summary>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 max-w-2xl">
              <dt>Modell</dt>
              <dd className="num">{detail._meta.model}</dd>
              <dt>Methodologie-Version</dt>
              <dd className="num">{detail._methodology.methodology_version}</dd>
              <dt>Transkript-SHA</dt>
              <dd className="num font-mono text-[11px]">{detail._meta.transcript_sha}</dd>
              <dt>Zitate validiert</dt>
              <dd className="num">{detail._meta.quote_validation.valid_pct} % ({detail._meta.quote_validation.valid_exact} exact, {detail._meta.quote_validation.valid_fuzzy} fuzzy)</dd>
              <dt>Analyse-Cost</dt>
              <dd className="num">${detail._meta.cost_usd.toFixed(4)}</dd>
              <dt>Generiert</dt>
              <dd className="num">{new Date(detail._meta.generated_at).toLocaleDateString("de-DE")}</dd>
            </dl>
          </details>
        </section>

          </main>
        </div>
      </div>
    </div>
  );
}
