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
      <div className="max-w-4xl mx-auto px-5 py-12 fade-in-up">
        {/* Breadcrumb */}
        <Link
          href={`/design/linear/politiker/${politicianId}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zu {politicianName || "Profil"}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FormatIcon className="w-4 h-4 text-zinc-500" strokeWidth={2.25} />
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Medien-Auftritt · Detail-Analyse
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-3">
            {entry.title}
          </h1>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] text-zinc-600">
            <span className="font-medium text-zinc-950">{entry.publisher}</span>
            {entry.host && <span>· mit {entry.host}</span>}
            {entry.episode_label && <span>· {entry.episode_label}</span>}
            {entry.duration_label && <span>· {entry.duration_label}</span>}
          </div>
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-zinc-950 underline decoration-zinc-300 hover:decoration-zinc-950 mt-3"
          >
            Original-Audio / Video beim Anbieter
            <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
          </a>
        </div>

        {/* Methodik-Disclaimer */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-[12.5px] text-amber-900 leading-relaxed">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.25} />
            <div>
              <strong>Wie diese Analyse zustande kommt:</strong> {detail._methodology.transcript_source}.{" "}
              {detail._methodology.transcript_caveat} Die Klassifikation der Antwort-Typen
              („Substantielle Antwort", „Antwort zu anderem Bezugspunkt" usw.) ist eine
              LLM-Auslegung, kein etabliertes politikwissenschaftliches Coding-Schema.
              Ohne Inter-Annotator-Agreement-Studie. Zitate ohne Garantie auf wortgenaue
              Übereinstimmung — Original beim Podcast prüfen.
            </div>
          </div>
        </div>

        {/* Overall Summary */}
        <section className="mb-8">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Überblick
          </h2>
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
            <p className="text-[14.5px] text-zinc-700 leading-relaxed">
              {detail.analysis.overall_summary}
            </p>
          </div>
        </section>

        {/* Statistik */}
        <section className="mb-8">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Aussagen-Statistik
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <div className="p-5">
              <div className="text-3xl font-semibold num text-zinc-950">{themes.length}</div>
              <div className="text-[11.5px] text-zinc-500 mt-1">Themen insgesamt</div>
            </div>
            <div className="p-5">
              <div className="text-3xl font-semibold num text-zinc-950">{substantielle}</div>
              <div className="text-[11.5px] text-zinc-500 mt-1">substantielle Antworten</div>
            </div>
            <div className="p-5">
              <div className={`text-3xl font-semibold num ${ausweichend > 0 ? "text-amber-800" : "text-zinc-950"}`}>
                {ausweichend}
              </div>
              <div className="text-[11.5px] text-zinc-500 mt-1">ausweichend / pivotierend</div>
            </div>
            <div className="p-5">
              <div className="text-3xl font-semibold num text-zinc-950">{factualClaims.length}</div>
              <div className="text-[11.5px] text-zinc-500 mt-1">Fakten-Behauptungen</div>
            </div>
          </div>
          {ausweichend > 0 && (
            <p className="text-[11.5px] text-zinc-500 mt-2 italic">
              „Ausweichend" / „pivotierend" beschreibt rhetorische Muster, kein Werturteil. Das vollständige Zitat + die zugrundeliegende Frage sind bei jedem Thema dokumentiert — bilde dir selbst ein Urteil.
            </p>
          )}
        </section>

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
          <section className="mb-10">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              Überprüfbare Fakten-Behauptungen
            </h2>
            <p className="text-[12.5px] text-zinc-500 mb-3 leading-relaxed">
              Konkrete Sachaussagen, die {politicianName} im Gespräch als Tatsachen
              darstellte. Nicht von dieser Plattform verifiziert — Material für
              eigene Recherche.
            </p>
            <div className="bg-white border border-zinc-200/70 rounded-2xl divide-y divide-zinc-100">
              {factualClaims.map((claim, ci) => (
                <div key={ci} className="p-4 flex items-start gap-3 text-[13.5px]">
                  <a
                    href={youtubeUrlWithTimestamp(entry.url, claim.timestamp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[11.5px] text-zinc-950 underline decoration-zinc-300 hover:decoration-zinc-950 num pt-0.5"
                  >
                    {claim.timestamp}
                  </a>
                  <span className="text-zinc-700 leading-relaxed">{claim.claim}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer: Tech-Meta */}
        <section className="border-t border-zinc-200 pt-6 mt-10">
          <details className="text-[12px] text-zinc-500">
            <summary className="cursor-pointer hover:text-zinc-700 transition-colors">
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
      </div>
    </div>
  );
}
