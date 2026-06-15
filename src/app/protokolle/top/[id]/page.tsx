import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getDb } from "@/lib/db";

interface TopicDetail {
  topic_id: number;
  topic_number: string;
  title: string;
  session_id: number;
  session_datum: string | null;
}

interface SpeechInTop {
  speech_id: number;
  rede_id: string | null;
  speaker: string;
  party: string | null;
  segment_index: number;
  snippet: string | null;
  tonalitaet: string | null;
}

const PARTY_DOT: Record<string, string> = {
  "CDU/CSU": "bg-zinc-800",
  SPD: "bg-rose-500",
  AfD: "bg-sky-600",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-emerald-600",
  "Die Linke": "bg-fuchsia-600",
  fraktionslos: "bg-zinc-400",
};

function formatGermanDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${parseInt(d, 10)}.${parseInt(m, 10)}.${y}`;
}

function formatTonalitaet(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/_/g, " ");
}

function getTopicDetail(topicId: number): TopicDetail | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT pt.id as topic_id, pt.topic_number, pt.title, pt.session_id, ps.datum as session_datum
       FROM plenar_topics pt
       JOIN plenar_sessions ps ON pt.session_id = ps.id
       WHERE pt.id = ?`
    )
    .get(topicId) as TopicDetail | undefined;
  return row ?? null;
}

function getSpeechesForTopic(topicId: number): SpeechInTop[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT s.id as speech_id, s.rede_id, s.speaker, s.party, s.segment_index,
              sa.zusammenfassung_2_saetze as snippet,
              sa.tonalitaet
       FROM plenar_speeches s
       LEFT JOIN speech_analyses_v2 sa ON sa.speech_id = s.id
       WHERE s.topic_id = ?
       ORDER BY s.speech_index, s.segment_index`
    )
    .all(topicId) as SpeechInTop[];
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topicId = parseInt(id, 10);
  if (!Number.isFinite(topicId)) notFound();

  const topic = getTopicDetail(topicId);
  if (!topic) notFound();

  const speeches = getSpeechesForTopic(topicId);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-24 pb-24 fade-in-up">
        {/* Breadcrumb */}
        <Link
          href="/protokolle"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Protokolle
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            TOP {topic.topic_number}
            {topic.session_datum && ` · ${formatGermanDate(topic.session_datum)}`}
            <span className="text-zinc-300 dark:text-zinc-600"> · </span>
            Sitzung {topic.session_id}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 leading-tight">
            {topic.title}
          </h1>
          <div className="mt-3 text-[13px] text-zinc-500 dark:text-zinc-400">
            <span className="tabular-nums">{speeches.length}</span>{" "}
            {speeches.length === 1 ? "Rede" : "Reden"}
          </div>
        </div>

        {/* Speeches */}
        {speeches.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-zinc-400 dark:text-zinc-500">
            Keine Reden zu diesem TOP erfasst.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {speeches.map((s) => (
              <SpeechRow key={`${s.speech_id}-${s.segment_index}`} speech={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SpeechRow({ speech }: { speech: SpeechInTop }) {
  const ton = formatTonalitaet(speech.tonalitaet);
  return (
    <details className="group border-b border-border last:border-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors list-none">
        <ChevronRight
          className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform group-open:rotate-90"
          strokeWidth={2.25}
        />
        {speech.party && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              PARTY_DOT[speech.party] ?? "bg-zinc-300"
            }`}
          />
        )}
        <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate">{speech.speaker}</span>
        {speech.party && (
          <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate shrink min-w-0">
            · {speech.party}
          </span>
        )}
        {ton && (
          <span
            className="ml-auto shrink-0 px-1.5 py-0.5 text-[10.5px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-border rounded"
            title="Tonalität — KI-eingeschätzt"
          >
            {ton}
          </span>
        )}
      </summary>
      <div className="px-4 pb-3 pl-[2.25rem]">
        {speech.snippet ? (
          <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug">{speech.snippet}</p>
        ) : (
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500 italic">
            (keine Zusammenfassung für diese Rede)
          </p>
        )}
        <Link
          href={`/protokolle/redner/${encodeURIComponent(speech.speaker)}`}
          className="inline-flex items-center gap-1 mt-2 text-[11.5px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Alle Reden von {speech.speaker} →
        </Link>
      </div>
    </details>
  );
}
