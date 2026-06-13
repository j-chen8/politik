import {
  getSitzungStories,
  type SitzungStoryTop,
  type SitzungStorySpeech,
  type SitzungHandzeichenVote,
} from "@/lib/db";
import { TonalityBadge } from "@/components/TonalityBadge";
import { splitTopTitle } from "@/lib/top-title";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HashOpener } from "./HashOpener";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ListTree, PlayCircle } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ nummer: string }>;
}

const PARTY_DOT: Record<string, string> = {
  "CDU/CSU": "bg-zinc-800",
  SPD: "bg-rose-500",
  AfD: "bg-sky-600",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-emerald-600",
  "Die Linke": "bg-fuchsia-600",
  Bundesregierung: "bg-amber-500",
  "Präsidium": "bg-zinc-500",
  fraktionslos: "bg-zinc-400",
  "ohne Fraktion": "bg-zinc-400",
};

const PARTY_LABEL_SHORT: Record<string, string> = {
  "BÜNDNIS 90/DIE GRÜNEN": "GRÜNE",
};

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Aggregiert Mehrfach-Nennungen zu Top-N nach Häufigkeit (über die Reden eines TOP). */
function aggregateBullets(allLists: string[][], limit = 5): { text: string; count: number }[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const list of allLists) {
    const seen = new Set<string>();
    for (const raw of list) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const prev = counts.get(key);
      if (prev) prev.count += 1;
      else counts.set(key, { display: trimmed, count: 1 });
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.display.length - b.display.length)
    .slice(0, limit)
    .map((c) => ({ text: c.display, count: c.count }));
}

/* ── TOP-Kategorisierung fürs Inhaltsverzeichnis ────────────────────────── */
type TopCategory = "standard" | "gesetz" | "antrag" | "weitere";

function categorizeTop(title: string): TopCategory {
  const t = title.toLowerCase();
  if (
    t.startsWith("aktuelle stunde") ||
    t.startsWith("befragung der bundesregierung") ||
    t.startsWith("regierungsbefragung") ||
    t.includes("fragestunde")
  ) {
    return "standard";
  }
  if (/entwurf eines gesetz|gesetzentwurf|gesetzes\b|\bgesetz\b/.test(t)) return "gesetz";
  if (/antrag|beschlussempfehlung|entschließung/.test(t)) return "antrag";
  return "weitere";
}

const CATEGORY_META: Record<TopCategory, { label: string }> = {
  standard: { label: "Aktuelle Stunde & Fragen" },
  gesetz: { label: "Gesetzentwürfe" },
  antrag: { label: "Anträge & Beschlüsse" },
  weitere: { label: "Weitere Beratungen" },
};
const CATEGORY_ORDER: TopCategory[] = ["standard", "gesetz", "antrag", "weitere"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nummer } = await params;
  return { title: `Sitzung ${nummer} · Deutscher Bundestag` };
}

/* ── Sitzungs-Navigation Vor/Zurück ─────────────────────────────────────── */
function SitzungNav({
  neighbors,
  size = "sm",
}: {
  neighbors: {
    prev: { sitzung: number; datum: string | null } | null;
    next: { sitzung: number; datum: string | null } | null;
  };
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "text-[13px] px-4 py-2.5" : "text-[12px] px-2.5 py-1.5";
  const disabledCls = `inline-flex items-center gap-1.5 ${cls} rounded-lg border border-zinc-100 text-zinc-300 cursor-not-allowed`;
  const linkCls = `inline-flex items-center gap-1.5 ${cls} rounded-lg border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-950 transition-colors`;
  return (
    <div className="flex items-center gap-1.5">
      {neighbors.prev ? (
        <Link href={`/protokolle/sitzung/${neighbors.prev.sitzung}`} className={linkCls}>
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>
            <span className="num">Sitzung {neighbors.prev.sitzung}</span>
            {neighbors.prev.datum && (
              <span className="text-zinc-400 ml-1.5 num">{shortDate(neighbors.prev.datum)}</span>
            )}
          </span>
        </Link>
      ) : (
        <span className={disabledCls}>
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>keine vorherige</span>
        </span>
      )}
      {neighbors.next ? (
        <Link href={`/protokolle/sitzung/${neighbors.next.sitzung}`} className={linkCls}>
          <span>
            <span className="num">Sitzung {neighbors.next.sitzung}</span>
            {neighbors.next.datum && (
              <span className="text-zinc-400 ml-1.5 num">{shortDate(neighbors.next.datum)}</span>
            )}
          </span>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
        </Link>
      ) : (
        <span className={disabledCls}>
          <span>keine nächste</span>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
        </span>
      )}
    </div>
  );
}

/* ── Inhaltsverzeichnis (gruppiert) ─────────────────────────────────────── */
function TopsTOC({ tops }: { tops: SitzungStoryTop[] }) {
  const grouped = new Map<TopCategory, SitzungStoryTop[]>();
  for (const t of tops) {
    const cat = categorizeTop(t.title);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(t);
  }
  return (
    <nav className="space-y-3 text-[12.5px]">
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat);
        if (!items || items.length === 0) return null;
        return (
          <div key={cat}>
            <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
              {CATEGORY_META[cat].label}
              <span className="text-zinc-300 num ml-1.5">({items.length})</span>
            </div>
            <ul className="border-l border-zinc-200">
              {items.map((t) => (
                <li key={t.topicId}>
                  <a
                    href={`#top-${t.topicId}`}
                    className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 hover:text-zinc-950 text-zinc-600 py-0.5 leading-snug transition-colors"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="num text-[10px] text-zinc-400 shrink-0 min-w-[20px]">{t.topicNumber}</span>
                      <span className="font-medium line-clamp-1" title={t.title}>
                        {splitTopTitle(t.title, t.drucksachen[0]?.titel).kern}
                      </span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/* ── Abstimmungs-Karte (namentliche Bundestags-Abstimmung) ──────────────── */
function VoteCard({
  vote,
}: {
  vote: { pollId: number; label: string; yes: number; no: number; abstain: number; yesRatio: number };
}) {
  const accepted = vote.yes > vote.no;
  const total = vote.yes + vote.no + vote.abstain;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className="px-3 py-2.5 rounded-lg border border-zinc-100 bg-white">
      <div className="flex items-baseline gap-3">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 text-center min-w-[5.75rem] ${
            accepted ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
          }`}
        >
          {accepted ? "Angenommen" : "Abgelehnt"}
        </span>
        <Link
          href={`/abstimmungen/${vote.pollId}`}
          className="flex-1 min-w-0 text-[13px] text-zinc-950 leading-snug hover:text-[#1a3e72] line-clamp-1 transition-colors"
        >
          {vote.label}
        </Link>
        <span className="shrink-0 num text-[11px] text-zinc-500">
          {fmt(vote.yes)}:{fmt(vote.no)}
          {vote.abstain > 0 && <span className="text-zinc-400"> · {fmt(vote.abstain)} Enth.</span>}
        </span>
      </div>
      <div className="mt-2 flex h-1.5 rounded-full overflow-hidden bg-zinc-100">
        <span className="bg-emerald-500" style={{ width: `${pct(vote.yes)}%` }} />
        <span className="bg-red-400" style={{ width: `${pct(vote.no)}%` }} />
        <span className="bg-zinc-300" style={{ width: `${pct(vote.abstain)}%` }} />
      </div>
    </div>
  );
}

/* ── Handzeichen-Abstimmung (Fraktionsebene) ────────────────────────────── */
const HZ_OUTCOME: Record<string, { label: string; cls: string }> = {
  annahme: { label: "Angenommen", cls: "text-emerald-700 bg-emerald-50" },
  annahme_geaendert: { label: "Angenommen", cls: "text-emerald-700 bg-emerald-50" },
  ablehnung: { label: "Abgelehnt", cls: "text-red-700 bg-red-50" },
  vertagung: { label: "Vertagt", cls: "text-zinc-600 bg-zinc-100" },
  ueberweisung: { label: "Überwiesen", cls: "text-zinc-600 bg-zinc-100" },
};

function HandzeichenCard({ vote, compact = false }: { vote: SitzungHandzeichenVote; compact?: boolean }) {
  const oc = HZ_OUTCOME[vote.outcome] ?? { label: vote.outcome, cls: "text-zinc-600 bg-zinc-100" };
  const primaryNr = vote.drucksacheNrn[0];
  const titel =
    vote.titel ??
    (vote.drucksacheNrn.length > 0
      ? `Drucksache ${vote.drucksacheNrn.join(", ")}`
      : "Abstimmung ohne Drucksache");
  return (
    <div
      className={`flex items-baseline gap-3 ${compact ? "px-3 py-2" : "px-3 py-2.5"} rounded-lg border border-zinc-100 bg-white`}
    >
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 text-center min-w-[5.75rem] ${oc.cls}`}
      >
        {oc.label}
      </span>
      <div className="flex-1 min-w-0">
        {primaryNr ? (
          <Link
            href={`/aktivitaeten/${primaryNr.replace("/", "-")}`}
            className="block text-[13px] text-zinc-950 leading-snug hover:text-[#1a3e72] line-clamp-1 transition-colors"
          >
            {titel}
          </Link>
        ) : (
          <span className="block text-[13px] text-zinc-950 leading-snug line-clamp-1">{titel}</span>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0">
        {Object.entries(vote.fraktionVotes).map(([frak, kind]) => (
          <span
            key={frak}
            className={`text-[9px] font-bold px-1 py-0.5 rounded ${
              kind === "ja"
                ? "text-emerald-800 bg-emerald-100"
                : kind === "nein"
                ? "text-red-800 bg-red-100"
                : kind === "enthaltung"
                ? "text-amber-800 bg-amber-100"
                : "text-zinc-500 bg-zinc-100"
            }`}
            title={`${frak}: ${kind}`}
          >
            {PARTY_LABEL_SHORT[frak] ?? frak}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Aggregations-Synthese „Aus den Reden" (kostenlos, maschinell) ──────── */
function RedenSynthese({ speeches }: { speeches: SitzungStorySpeech[] }) {
  const forderungen = aggregateBullets(speeches.map((s) => s.forderungen));
  const zahlen = aggregateBullets(speeches.map((s) => s.konkreteZahlen));
  if (forderungen.length === 0 && zahlen.length === 0) return null;
  return (
    <div className="mt-2 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500">Aus den Reden</span>
        <span className="text-[9.5px] text-zinc-400">·</span>
        <span className="text-[9.5px] text-zinc-400">maschinell zusammengetragen, nach Häufigkeit</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {forderungen.length > 0 && (
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Forderungen</p>
            <ul className="space-y-0.5">
              {forderungen.map((b) => (
                <li key={b.text} className="text-[12px] text-zinc-800 leading-snug flex items-baseline gap-1.5">
                  <span className="text-zinc-400 shrink-0">•</span>
                  <span className="flex-1">
                    {b.text}
                    {b.count > 1 && <span className="text-zinc-400 text-[10.5px] num ml-1.5">×{b.count}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {zahlen.length > 0 && (
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Zahlen</p>
            <ul className="space-y-0.5">
              {zahlen.map((b) => (
                <li key={b.text} className="text-[12px] text-zinc-800 leading-snug flex items-baseline gap-1.5">
                  <span className="text-zinc-400 shrink-0">•</span>
                  <span className="flex-1">
                    {b.text}
                    {b.count > 1 && <span className="text-zinc-400 text-[10.5px] num ml-1.5">×{b.count}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── „Das Wichtigste" — KI-Synthese (key_facts mit Reden-Belegen) ────────── */
function RefAnchors({ refs, topicId }: { refs: number[]; topicId: number }) {
  if (!refs || refs.length === 0) return null;
  return (
    <sup className="ml-0.5 num text-[10px]">
      {refs.map((r) => (
        <a key={r} href={`#rede-${topicId}-${r}`} className="text-[#1a3e72] hover:underline transition-colors">
          [{r}]
        </a>
      ))}
    </sup>
  );
}

function KeyFactsCard({
  facts,
  topicId,
  redenCount,
}: {
  facts: { text: string; refs: number[] }[];
  topicId: number;
  redenCount: number;
}) {
  return (
    <div className="mt-2 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#1a3e72]">Das Wichtigste</span>
        <span className="text-[9.5px] text-zinc-400">·</span>
        <span className="text-[9.5px] text-zinc-400">KI-Synthese aus {redenCount} Reden</span>
      </div>
      <ul className="space-y-1.5">
        {facts.map((f, i) => (
          <li key={i} className="text-[12.5px] text-zinc-800 leading-relaxed flex items-baseline gap-2">
            <span className="text-zinc-400 shrink-0 num text-[10px]">{i + 1}</span>
            <span className="flex-1">
              {f.text}
              <RefAnchors refs={f.refs} topicId={topicId} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Eine Rede (einklappbar) ────────────────────────────────────────────── */
function SpeechRow({ speech, index, topicId }: { speech: SitzungStorySpeech; index: number; topicId: number }) {
  const partyLabel = PARTY_LABEL_SHORT[speech.partyLabel] ?? speech.partyLabel;
  return (
    <li id={`rede-${topicId}-${index}`} className="px-5 py-3 scroll-mt-12 target:bg-amber-50/60 transition-colors">
      {/* stabiler Deep-Link-Anker je Rede (rede_id) — z. B. vom Themen-Blatt aus */}
      {speech.redeId && speech.segmentIndex === 0 && <span id={`rede-${speech.redeId}`} className="block scroll-mt-12" />}
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <span className="num text-[10px] text-zinc-400 shrink-0">{index}</span>
        <Link
          href={`/protokolle/redner/${encodeURIComponent(speech.speaker)}`}
          className="text-[13.5px] font-medium text-zinc-950 hover:text-[#1a3e72] transition-colors"
        >
          {speech.speaker}
        </Link>
        {speech.partyLabel && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-700">
            <span className={`w-1.5 h-1.5 rounded-full ${PARTY_DOT[speech.partyLabel] ?? "bg-zinc-400"}`} />
            {partyLabel}
          </span>
        )}
        <TonalityBadge slug={speech.tonalitaet} />
      </div>
      {speech.antwortAufSpeaker && (
        <p className="text-[11px] text-zinc-400 mb-1">↳ Antwort auf die Frage von {speech.antwortAufSpeaker}</p>
      )}
      {speech.zusammenfassung ? (
        <p className="text-[12.5px] text-zinc-600 leading-relaxed">{speech.zusammenfassung}</p>
      ) : (
        <p className="text-[12px] italic text-zinc-400">(keine Zusammenfassung für diese Rede)</p>
      )}
      {speech.originalText && speech.originalText.length > 50 && (
        <details className="group/orig mt-1.5">
          <summary className="list-none cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors select-none inline-flex items-center gap-1">
            <span className="text-zinc-400 group-open/orig:rotate-90 transition-transform">▶</span>
            <span className="group-open/orig:hidden">Originalrede einblenden</span>
            <span className="hidden group-open/orig:inline">Originalrede ausblenden</span>
          </summary>
          <p className="mt-2 text-[12px] text-zinc-600 leading-relaxed whitespace-pre-line border-l-2 border-zinc-200 pl-3">
            {speech.originalText}
          </p>
        </details>
      )}
      {speech.mediathekFvid && (
        <a
          href={`https://www.bundestag.de/mediathek?videoid=${speech.mediathekFvid}`}
          target="_blank"
          rel="noopener"
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#1a3e72] hover:text-[#0f2a52] transition-colors"
        >
          <PlayCircle className="w-3.5 h-3.5" strokeWidth={2} />
          Video in der Mediathek
          <ExternalLink className="w-3 h-3" strokeWidth={2} />
        </a>
      )}
    </li>
  );
}

export default async function BundestagSitzungPage({ params }: Props) {
  const { nummer } = await params;
  const sitzungNr = parseInt(nummer, 10);
  if (!Number.isFinite(sitzungNr)) notFound();

  const sit = getSitzungStories(sitzungNr);
  if (!sit) notFound();

  // Handzeichen aufteilen: Gesetze/Personenwahlen prominent, Petitionen gebündelt.
  const hzProminent = sit.handzeichen.filter((v) => v.subtype !== "petition");
  const hzPetitions = sit.handzeichen.filter((v) => v.subtype === "petition");
  const totalVotes = sit.votes.length + sit.handzeichen.length;

  return (
    <div className="page-wash">
      <HashOpener />
      <div className="w-full page-shell">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <Link
            href="/protokolle/sitzungen"
            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
            Alle Sitzungen
          </Link>
          <SitzungNav neighbors={sit.neighbors} />
        </div>

        {/* Header */}
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 num">
            Plenarprotokoll {sit.wahlperiode}/{sit.sitzung}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-zinc-950 mb-2">
            {sit.sitzung}. Sitzung des Deutschen Bundestages
          </h1>
          <p className="text-[14px] text-zinc-600 num">
            {formatDate(sit.datum)}
            {" · "}
            <span className="font-medium text-zinc-950">{fmt(sit.stats.speechCount)}</span> Redebeiträge
            {" · "}
            <span className="font-medium text-zinc-950">{fmt(totalVotes)}</span> Abstimmungen
            {sit.sourceUrl && (
              <>
                {" · "}
                <a
                  href={sit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                >
                  Protokoll
                  <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                </a>
              </>
            )}
          </p>
          {sit.drucksachen.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 items-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Drucksachen:</span>
              {sit.drucksachen.map((d) => (
                <Link
                  key={d.drucksacheNr}
                  href={`/aktivitaeten/${d.drucksacheNr.replace("/", "-")}`}
                  className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded num text-[#1a3e72] bg-blue-50 hover:bg-blue-100 transition-colors"
                  title={d.thema ?? `Drucksache ${d.drucksacheNr}`}
                >
                  {d.drucksacheNr}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Mobile: Inhaltsverzeichnis */}
        <details className="lg:hidden mb-6 rounded-xl border border-zinc-200/70 bg-white">
          <summary className="list-none cursor-pointer px-4 py-3 flex items-center gap-2 text-[12px] font-medium text-zinc-700 select-none">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhaltsverzeichnis ({sit.tops.length} Themen)
          </summary>
          <div className="px-4 pb-4">
            <TopsTOC tops={sit.tops} />
          </div>
        </details>

        <div className="lg:flex lg:gap-10">
          <main className="lg:flex-1 lg:min-w-0">
            {/* Abstimmungs-Überblick — namentliche + Handzeichen, Petitionen gebündelt */}
            {totalVotes > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-zinc-950 mb-3">
                  Abstimmungen
                  <span className="text-zinc-400 num text-base font-normal ml-2">({totalVotes})</span>
                </h2>
                <ul className="space-y-1.5">
                  {sit.votes.map((v) => (
                    <li key={`n-${v.pollId}`} id={`vote-n-${v.pollId}`} className="scroll-mt-12 target:bg-amber-50/60 transition-colors rounded-lg">
                      <VoteCard vote={v} />
                    </li>
                  ))}
                  {hzProminent.map((v) => (
                    <li key={`h-${v.voteId}`} id={`vote-h-${v.voteId}`} className="scroll-mt-12 target:bg-amber-50/60 transition-colors rounded-lg">
                      <HandzeichenCard vote={v} />
                    </li>
                  ))}
                </ul>
                {hzPetitions.length > 0 && (
                  <details className="group/pet mt-1.5">
                    <summary className="list-none cursor-pointer px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50/60 text-[12px] text-zinc-600 hover:text-zinc-950 transition-colors select-none flex items-center gap-1.5">
                      <span className="text-zinc-400 group-open/pet:rotate-90 transition-transform">▶</span>
                      <span className="num">{hzPetitions.length}</span> Petitions-Abstimmungen (Sammelübersichten)
                    </summary>
                    <ul className="space-y-1 mt-1.5">
                      {hzPetitions.map((v) => (
                        <li key={`p-${v.voteId}`} id={`vote-h-${v.voteId}`} className="scroll-mt-12 target:bg-amber-50/60 transition-colors rounded-lg">
                          <HandzeichenCard vote={v} compact />
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
            )}

            {/* Detail-Bereiche pro TOP */}
            {sit.tops.map((t) => {
              // Nur Reden MIT Zusammenfassung — refs der KI-Synthese sind 1-based
              // Indizes in genau diese (speech_index-sortierte) Liste.
              const reden = t.speeches.filter((s) => s.zusammenfassung);
              return (
                <section key={t.topicId} id={`top-${t.topicId}`} className="mb-8 scroll-mt-6">
                  <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100">
                      <div className="flex items-baseline gap-3 flex-wrap mb-2">
                        <span className="num text-[11px] font-semibold text-zinc-500">TOP {t.topicNumber}</span>
                        {(() => {
                          const sp = splitTopTitle(t.title, t.drucksachen[0]?.titel);
                          return (
                            <>
                              {sp.stufe && (
                                <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 shrink-0">
                                  {sp.stufe}
                                </span>
                              )}
                              <h2 className="text-[16px] font-semibold text-zinc-950 leading-snug flex-1" title={t.title}>
                                {sp.kern}
                              </h2>
                            </>
                          );
                        })()}
                        <span className="text-[11px] text-zinc-400 num shrink-0">{reden.length} Reden</span>
                      </div>
                      {t.voteRefs.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {t.voteRefs.map((vr) => (
                            <a
                              key={vr.anchorId}
                              href={`#${vr.anchorId}`}
                              title="Zur Abstimmung springen"
                              className={`inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors ${
                                vr.accepted === true
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                                  : vr.accepted === false
                                  ? "text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
                                  : "text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200"
                              }`}
                            >
                              <span aria-hidden>↑</span> Abstimmung: {vr.label}
                            </a>
                          ))}
                        </div>
                      )}
                      {t.drucksachen.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center mb-2">
                          {t.drucksachen.map((d) => (
                            <Link
                              key={d.nr}
                              href={`/aktivitaeten/${d.nr.replace("/", "-")}`}
                              title={d.titel ?? `Drucksache ${d.nr}`}
                              className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded num text-[#1a3e72] bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              {d.nr}
                            </Link>
                          ))}
                        </div>
                      )}
                      {t.keyFacts && t.keyFacts.length > 0 ? (
                        <KeyFactsCard facts={t.keyFacts} topicId={t.topicId} redenCount={reden.length} />
                      ) : (
                        <RedenSynthese speeches={t.speeches} />
                      )}
                    </div>
                    {reden.length > 0 && (
                      <details className="group/reden">
                        <summary className="list-none cursor-pointer px-5 py-2.5 text-[11.5px] text-zinc-500 hover:text-zinc-950 border-t border-zinc-100 transition-colors select-none flex items-center gap-1.5">
                          <span className="text-zinc-400 group-open/reden:rotate-90 transition-transform">▶</span>
                          <span className="group-open/reden:hidden">Reden einblenden ({reden.length})</span>
                          <span className="hidden group-open/reden:inline">Reden ausblenden</span>
                        </summary>
                        <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                          {reden.map((sp, idx) => (
                            <SpeechRow key={`${sp.speechId}-${sp.segmentIndex}`} speech={sp} index={idx + 1} topicId={t.topicId} />
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </section>
              );
            })}

            {/* Footer-Navigation */}
            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Weiter zu</span>
              <SitzungNav neighbors={sit.neighbors} size="lg" />
            </div>
          </main>

          {/* Desktop: Sticky-Sidebar Inhaltsverzeichnis */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 pb-6">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <ListTree className="w-3 h-3" strokeWidth={2.25} />
                Auf dieser Seite
              </div>
              <TopsTOC tops={sit.tops} />
            </div>
          </aside>
        </div>
      </div>
      {/* Klick auf [ref]-Anker öffnet die eingeklappte Reden-Liste + scrollt hin. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  function openAncestors(){
    var id = location.hash ? location.hash.slice(1) : '';
    if(!id) return;
    var el = document.getElementById(id);
    if(!el) return;
    var p = el.parentElement;
    while(p){ if(p.tagName === 'DETAILS' && !p.open){ p.open = true; } p = p.parentElement; }
    setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'center'}); }, 60);
  }
  window.addEventListener('hashchange', openAncestors);
  window.addEventListener('load', openAncestors);
  if(document.readyState !== 'loading'){ openAncestors(); }
})();
`,
        }}
      />
    </div>
  );
}
