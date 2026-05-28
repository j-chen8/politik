import { getBerlinSitzungDetail, getBerlinSitzungNeighbors, type BerlinSitzungTop, type KeyFact } from "@/lib/db";
import { resolveBerlinTonality } from "@/lib/berlin-reden-tonality";
import { getClaudeGold, type ClaudeGoldEntry } from "@/lib/berlin-top-gold-claude";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ListTree } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ nr: string }>;
  searchParams: Promise<{ facts?: string }>;
}

type FactsMode = "haiku" | "claude" | "compare" | "aggregation";

function parseFactsMode(raw: string | undefined): FactsMode {
  if (raw === "claude" || raw === "compare" || raw === "aggregation") return raw;
  return "haiku";
}

/** Aggregiert Mehrfach-Nennungen einer Liste zu Top-N nach Häufigkeit.
 *  Wird nur im Legacy-`aggregation`-Modus verwendet. */
function aggregateBullets(allLists: string[][], limit = 5): { text: string; count: number }[] {
  const counts = new Map<string, { display: string; count: number }>();
  for (const list of allLists) {
    const seenInThisSpeech = new Set<string>();
    for (const raw of list) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seenInThisSpeech.has(key)) continue;
      seenInThisSpeech.add(key);
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

/** Wikipedia-style Bracketed-Superscript-Anker zu den belegenden Reden.
 *  Klick scrollt zur Sprecher-Name-Zeile in der TOP-Reden-Liste weiter unten. */
function RefAnchors({ refs, topMarker }: { refs: number[]; topMarker: string }) {
  if (!refs || refs.length === 0) return null;
  return (
    <sup className="ml-0.5 num text-[10px]">
      {refs.map((r) => (
        <a
          key={r}
          href={`#rede-${topMarker}-${r}`}
          className="text-blue-700 hover:text-blue-900 transition-colors"
        >
          [{r}]
        </a>
      ))}
    </sup>
  );
}

type VoteForCard = {
  voteId: number;
  outcome: string;
  modus: string | null;
  primaryTitel: string | null;
  primaryDbid: string | null;
  drucksacheNrn: string[];
  fraktionVotes: Record<string, string>;
  voteLabel: string | null;
};

/** Manche Drucksachen-Titel sind generisch (nur Dokumenten-Typ ohne Thema —
 *  Berlin PARDOK-Quirk bei Beschlussempfehlungen + Mitteilungen). Hänge dann
 *  die DS-Nr an, damit der Vote-Eintrag aus dem Listen-Kontext eindeutig ist. */
const GENERIC_TITLES = /^(Beschlussempfehlung|Mitteilung|Vorlage|Antrag|Drucksache|Gesetzentwurf)(\s.*)?$/i;
/** „Vermögensgeschäft - Nr. 4/2022 -" → bürgerverständliches Label.
 *  Vermögensgeschäfte sind Beschlüsse über Käufe/Verkäufe von Immobilien oder
 *  Beteiligungen durch das Land Berlin. Detail-Inhalt meist vertraulich. */
const VERMOEGEN_RE = /^Vermögensgeschäft\s*-?\s*(Nr\.?\s*[\d/]+)\s*-?\s*$/i;
function enrichTitle(titel: string | null, drucksacheNrn: string[]): string {
  if (!titel || titel.trim().length === 0) return `Drucksache ${drucksacheNrn.join(", ")}`;
  const trimmed = titel.trim();
  const vm = trimmed.match(VERMOEGEN_RE);
  if (vm) {
    // Rewrite zu bürgerverständlicher Form. „Nr." optional doppeln vermeiden.
    const nr = vm[1].replace(/^Nr\.?\s*/i, "");
    return `Berlin kauft/verkauft Immobilie oder Beteiligung (Vermögensgeschäft Nr. ${nr})`;
  }
  // Generisch + sehr kurz (≤ 30 Z.) → DS-Nr anhängen für Unterscheidung
  if (GENERIC_TITLES.test(trimmed) && trimmed.length <= 30 && drucksacheNrn.length > 0) {
    return `${trimmed} ${drucksacheNrn[0]}`;
  }
  return titel;
}

function VoteCard({ vote, compact = false, additionalVotes = 0 }: { vote: VoteForCard; compact?: boolean; additionalVotes?: number }) {
  const isAcceptance = vote.outcome === "annahme" || vote.outcome === "annahme_geaendert";
  const isRejection = vote.outcome === "ablehnung";
  const outcomeLabel = isAcceptance ? "Angenommen"
    : isRejection ? "Abgelehnt"
    : vote.outcome === "vertagung" ? "Vertagt"
    : vote.outcome === "ueberweisung" ? "Überwiesen"
    : vote.outcome;
  const titel = enrichTitle(vote.primaryTitel, vote.drucksacheNrn);
  const outcomeClass = isAcceptance ? "text-emerald-700 bg-emerald-50"
    : isRejection ? "text-red-700 bg-red-50"
    : "text-zinc-600 bg-zinc-100";
  return (
    <div className={`flex items-baseline gap-3 ${compact ? "px-3 py-2" : "px-3 py-2.5"} rounded-lg border border-zinc-100 bg-white`}>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 text-center min-w-[5.75rem] ${outcomeClass}`}>
        {outcomeLabel}
      </span>
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <div className="flex-1 min-w-0">
          {vote.voteLabel && (
            <div className="text-[10.5px] font-medium text-zinc-500 uppercase tracking-wider leading-tight mb-0.5 line-clamp-1">
              {vote.voteLabel}
            </div>
          )}
          {vote.primaryDbid ? (
            <Link
              href={`/design/linear/parlamente/berlin/drucksache/${vote.primaryDbid}`}
              className="block text-[13px] text-zinc-950 leading-snug hover:text-blue-700 line-clamp-1 transition-colors"
            >
              {titel}
            </Link>
          ) : (
            <span className="block text-[13px] text-zinc-950 leading-snug line-clamp-1">
              {titel}
            </span>
          )}
        </div>
        {additionalVotes > 0 && (
          <span
            className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0 num"
            title={`Zu dieser Drucksache gab es ${additionalVotes + 1} Abstimmungen (Schlussabstimmung wird gezeigt; Detail-Verlauf auf der DS-Seite)`}
          >
            +{additionalVotes} weitere
          </span>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0">
        {Object.entries(vote.fraktionVotes).map(([frak, voteKind]) => (
          <span
            key={frak}
            className={`text-[9px] font-bold px-1 py-0.5 rounded ${
              voteKind === "ja" ? "text-emerald-800 bg-emerald-100"
                : voteKind === "nein" ? "text-red-800 bg-red-100"
                : voteKind === "enthaltung" ? "text-amber-800 bg-amber-100"
                : "text-zinc-500 bg-zinc-100"
            }`}
            title={`${frak}: ${voteKind}`}
          >
            {frak}
          </span>
        ))}
      </div>
    </div>
  );
}

type TopCategory = "standard" | "prioritaet" | "gesetz" | "antrag";

/** Heuristik: kategorisiere einen TOP anhand des Titels, damit das TOC sinnvoll
 *  gruppiert werden kann. Prioritäten-Aufrufe gewinnen vor Gesetz-Erwähnung,
 *  weil sie verfahrenstechnisch zuerst kategorisieren. */
function categorizeTop(top: BerlinSitzungTop): TopCategory {
  const t = top.titel.toLowerCase();
  if (t.startsWith("aktuelle stunde") || t.startsWith("fragestunde") || t.startsWith("prioritäten")) {
    return "standard";
  }
  if (t.startsWith("priorität")) return "prioritaet";
  if (/^(?:erstes\s+|zweites\s+|drittes\s+|viertes\s+|fünftes\s+|sechstes\s+|siebtes\s+)?gesetz\b/.test(t)) {
    return "gesetz";
  }
  return "antrag";
}

const CATEGORY_META: Record<TopCategory, { label: string; description: string }> = {
  standard: { label: "Standard-Tagesordnung", description: "Aktuelle Stunde, Fragestunde, Prioritäten" },
  prioritaet: { label: "Prioritäten", description: "Aus der Tagesordnung vorgezogene Drucksachen" },
  gesetz: { label: "Gesetzentwürfe", description: "Erste/Zweite Lesung von Gesetzen" },
  antrag: { label: "Anträge & Beschlüsse", description: "Anträge, Beschlussempfehlungen, sonstige Vorlagen" },
};
const CATEGORY_ORDER: TopCategory[] = ["standard", "prioritaet", "gesetz", "antrag"];

function TopsTOC({ insights }: { insights: TopInsight[] }) {
  // Gruppieren nach Kategorie, Reihenfolge innerhalb der Gruppe bleibt chronologisch
  const grouped = new Map<TopCategory, TopInsight[]>();
  for (const ins of insights) {
    const cat = categorizeTop(ins.top);
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(ins);
  }
  return (
    <nav className="space-y-3 text-[12.5px]">
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat);
        if (!items || items.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
              {meta.label}
              <span className="text-zinc-300 num ml-1.5">({items.length})</span>
            </div>
            <ul className="border-l border-zinc-200">
              {items.map((ins) => {
                const t = ins.top;
                return (
                  <li key={`${t.marker}-${t.titel}`}>
                    <a
                      href={`#top-${t.marker}`}
                      className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 hover:text-zinc-950 text-zinc-600 py-0.5 leading-snug transition-colors"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="num text-[10px] text-zinc-400 shrink-0 min-w-[20px]">{t.marker}</span>
                        <span className="font-medium line-clamp-1" title={t.titel}>{t.titel}</span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Kleine klickbare Drucksachen-Pill. Wenn dbid bekannt, Link zur Detail-Page;
 *  sonst nur visuelle Anzeige (greyed out). */
function DsPill({ nr, dbid, className = "" }: { nr: string; dbid: string | null; className?: string }) {
  const baseCls = "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded num";
  if (dbid) {
    return (
      <Link
        href={`/design/linear/parlamente/berlin/drucksache/${dbid}`}
        className={`${baseCls} text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors ${className}`}
        title={`Drucksache ${nr} öffnen`}
      >
        {nr}
      </Link>
    );
  }
  return (
    <span
      className={`${baseCls} text-zinc-500 bg-zinc-100 ${className}`}
      title={`Drucksache ${nr} (nicht in der Datenbank gefunden)`}
    >
      {nr}
    </span>
  );
}

function KeyFactsList({ facts, topMarker }: { facts: KeyFact[]; topMarker: string }) {
  return (
    <ul className="space-y-1.5">
      {facts.map((f, i) => (
        <li key={i} className="text-[12.5px] text-zinc-800 leading-relaxed flex items-baseline gap-2">
          <span className="text-zinc-400 shrink-0 num text-[10px]">{i + 1}</span>
          <span className="flex-1">
            {f.text}
            <RefAnchors refs={f.refs} topMarker={topMarker} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function SyntheseCard({
  label,
  source,
  badge,
  facts,
  topMarker,
}: {
  label: string;
  source: string;
  badge?: string;
  facts: KeyFact[] | null;
  topMarker: string;
}) {
  return (
    <div className="px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[11px] font-semibold text-zinc-700">
          {label}
        </span>
        <span className="text-[10px] text-zinc-400">·</span>
        <span className="text-[10px] text-zinc-400">{source}</span>
        {badge && (
          <span className="ml-auto text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-zinc-500 bg-white border border-zinc-200">
            {badge}
          </span>
        )}
      </div>
      {facts && facts.length > 0 ? (
        <KeyFactsList facts={facts} topMarker={topMarker} />
      ) : (
        <p className="text-[12px] italic text-zinc-400">
          (noch nicht generiert)
        </p>
      )}
    </div>
  );
}

function SyntheseRender({
  mode,
  top,
  gold,
  redenCount,
}: {
  mode: FactsMode;
  top: BerlinSitzungTop;
  gold: ClaudeGoldEntry | null;
  redenCount: number;
}) {
  if (mode === "compare") {
    return (
      <div className="grid sm:grid-cols-2 gap-3 mt-2">
        <SyntheseCard
          label="Haiku v4"
          source={`aus ${redenCount} Reden`}
          badge="LLM"
          facts={top.summaryKeyFacts}
          topMarker={top.marker}
        />
        <SyntheseCard
          label="Claude-Goldstandard"
          source={gold ? "Opus, manuell" : "kein Gold für diesen TOP"}
          badge="MANUELL"
          facts={gold?.key_facts ?? null}
          topMarker={top.marker}
        />
      </div>
    );
  }
  if (mode === "claude") {
    return (
      <div className="mt-2">
        <SyntheseCard
          label="Claude-Goldstandard"
          source={gold ? "Opus, manuell" : "kein Gold für diesen TOP"}
          badge="MANUELL"
          facts={gold?.key_facts ?? null}
          topMarker={top.marker}
        />
      </div>
    );
  }
  if (mode === "aggregation") {
    const zahlenBullets = aggregateBullets(top.speeches.map((s) => s.konkreteZahlen));
    const forderungBullets = aggregateBullets(top.speeches.map((s) => s.forderungen));
    return (
      <div className="mt-2 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500">Aggregation</span>
          <span className="text-[9.5px] text-zinc-400">·</span>
          <span className="text-[9.5px] text-zinc-400">rohe Sub-Achsen aus {redenCount} Reden</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Zahlen</p>
            <ul className="space-y-0.5">
              {zahlenBullets.map((b) => (
                <li key={b.text} className="text-[12px] text-zinc-800 leading-snug flex items-baseline gap-1.5">
                  <span className="text-zinc-400 shrink-0">•</span>
                  <span className="flex-1">{b.text}{b.count > 1 && <span className="text-zinc-400 text-[10.5px] num ml-1.5">×{b.count}</span>}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Forderungen</p>
            <ul className="space-y-0.5">
              {forderungBullets.map((b) => (
                <li key={b.text} className="text-[12px] text-zinc-800 leading-snug flex items-baseline gap-1.5">
                  <span className="text-zinc-400 shrink-0">•</span>
                  <span className="flex-1">{b.text}{b.count > 1 && <span className="text-zinc-400 text-[10.5px] num ml-1.5">×{b.count}</span>}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
  // Default: Haiku v4 (fallback bei fehlenden v4-Rows: alter v3-Lead)
  if (top.summaryKeyFacts) {
    return (
      <div className="mt-2">
        <SyntheseCard
          label="Das Wichtigste"
          source={`aus ${redenCount} Reden`}
          facts={top.summaryKeyFacts}
          topMarker={top.marker}
        />
      </div>
    );
  }
  if (top.summaryLead) {
    return (
      <div className="mt-2 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500">KI-Synthese (v3, Legacy)</span>
          <span className="text-[9.5px] text-zinc-400">·</span>
          <span className="text-[9.5px] text-zinc-400">aus {redenCount} Reden</span>
        </div>
        <p className="text-[13px] text-zinc-800 leading-relaxed font-medium">{top.summaryLead}</p>
        {top.summaryBody && (
          <p className="text-[12.5px] text-zinc-600 leading-relaxed mt-2">{top.summaryBody}</p>
        )}
      </div>
    );
  }
  return null;
}

const PARTY_COLOR: Record<string, string> = {
  SPD: "bg-red-500",
  CDU: "bg-zinc-900",
  GRÜNE: "bg-emerald-600",
  LINKE: "bg-pink-600",
  AfD: "bg-blue-700",
  FDP: "bg-yellow-400",
};

const TON_DOT_COLOR: Record<string, string> = {
  sachlich: "#6b7280",
  polemisch: "#dc2626",
  polemisch_sachlich: "#ea580c",
  konfrontativ_belegend: "#2563eb",
  bilanzierend_werbend: "#16a34a",
  defensiv_pragmatisch: "#64748b",
  sozial_anklagend: "#db2777",
  mahnend: "#a16207",
  emotional_persoenlich: "#7c3aed",
  ironisch_jugendlich: "#ca8a04",
  staatsmaennisch: "#1e3a8a",
};

const TONALITAET_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sachlich: { label: "sachlich", color: "#374151", bg: "#f3f4f6" },
  polemisch: { label: "polemisch", color: "#b91c1c", bg: "#fee2e2" },
  polemisch_sachlich: { label: "polemisch-sachlich", color: "#9a3412", bg: "#ffedd5" },
  emotional_persoenlich: { label: "emotional-persönlich", color: "#7c3aed", bg: "#ede9fe" },
  konfrontativ_belegend: { label: "konfrontativ-belegend", color: "#1d4ed8", bg: "#dbeafe" },
  ironisch_jugendlich: { label: "ironisch", color: "#a16207", bg: "#fef3c7" },
  bilanzierend_werbend: { label: "bilanzierend", color: "#15803d", bg: "#dcfce7" },
  staatsmaennisch: { label: "staatsmännisch", color: "#1e40af", bg: "#dbeafe" },
  defensiv_pragmatisch: { label: "defensiv-pragmatisch", color: "#475569", bg: "#f1f5f9" },
  sozial_anklagend: { label: "sozial-anklagend", color: "#be185d", bg: "#fce7f3" },
  mahnend: { label: "mahnend", color: "#854d0e", bg: "#fef9c3" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nr } = await params;
  return { title: `Sitzung ${nr} · Abgeordnetenhaus Berlin` };
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

function shortDate(d: string | null): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Sitzungs-Navigation Vor/Zurück — kompakt für Header oder Footer. */
function SitzungNav({
  neighbors,
  size = "sm",
}: {
  neighbors: { prev: { nr: number; datum: string | null } | null; next: { nr: number; datum: string | null } | null };
  size?: "sm" | "lg";
}) {
  const cls = size === "lg"
    ? "text-[13px] px-4 py-2.5"
    : "text-[12px] px-2.5 py-1.5";
  const disabledCls = `inline-flex items-center gap-1.5 ${cls} rounded-lg border border-zinc-100 text-zinc-300 cursor-not-allowed`;
  const linkCls = `inline-flex items-center gap-1.5 ${cls} rounded-lg border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-950 transition-colors`;
  return (
    <div className="flex items-center gap-1.5">
      {neighbors.prev ? (
        <Link
          href={`/design/linear/parlamente/berlin/sitzung/${neighbors.prev.nr}`}
          className={linkCls}
          title={`Zur vorherigen Sitzung (${neighbors.prev.nr})`}
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>
            <span className="num">Sitzung {neighbors.prev.nr}</span>
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
        <Link
          href={`/design/linear/parlamente/berlin/sitzung/${neighbors.next.nr}`}
          className={linkCls}
          title={`Zur nächsten Sitzung (${neighbors.next.nr})`}
        >
          <span>
            <span className="num">Sitzung {neighbors.next.nr}</span>
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

interface TopInsight {
  top: BerlinSitzungTop & { speeches: BerlinSitzungTop["speeches"] };
  redenWithSummary: number;
  tonMix: { ton: string; count: number; pct: number }[];
  topParties: { party: string; count: number }[];
}

function analyseTop(top: BerlinSitzungTop): TopInsight {
  const withSum = top.speeches.filter((s) => s.zusammenfassung);
  const tonCounts: Record<string, number> = {};
  const partyCounts: Record<string, number> = {};
  for (const sp of withSum) {
    const ton = resolveBerlinTonality(sp.tonalitaet);
    if (ton) tonCounts[ton] = (tonCounts[ton] ?? 0) + 1;
    if (sp.speakerParty) partyCounts[sp.speakerParty] = (partyCounts[sp.speakerParty] ?? 0) + 1;
  }
  const total = withSum.length || 1;
  const tonMix = Object.entries(tonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([ton, count]) => ({ ton, count, pct: (count / total) * 100 }));
  const topParties = Object.entries(partyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([party, count]) => ({ party, count }));
  return { top, redenWithSummary: withSum.length, tonMix, topParties };
}

export default async function BerlinSitzungStoriesPage({ params, searchParams }: Props) {
  const { nr } = await params;
  const { facts: factsRaw } = await searchParams;
  const factsMode = parseFactsMode(factsRaw);
  const sitzungNr = parseInt(nr, 10);
  if (!Number.isFinite(sitzungNr)) notFound();

  const sit = getBerlinSitzungDetail(sitzungNr);
  if (!sit) notFound();
  const neighbors = getBerlinSitzungNeighbors(sitzungNr);

  const insights = sit.tops
    .map(analyseTop)
    .filter((i) => i.redenWithSummary > 0);

  // Aggregierte Drucksachen über die gesamte Sitzung (dedup'd, sortiert nach Nr)
  const sitzungDsMap = new Map<string, string | null>();
  for (const t of sit.tops) {
    for (const d of t.drucksachen) {
      if (!sitzungDsMap.has(d.nr)) sitzungDsMap.set(d.nr, d.dbid);
    }
  }
  const sitzungDrucksachen = Array.from(sitzungDsMap.entries())
    .map(([nr, dbid]) => ({ nr, dbid }))
    .sort((a, b) => a.nr.localeCompare(b.nr, undefined, { numeric: true }));

  // Filtere `kein_vote`-Rows + Votes ohne Drucksachen-Verlinkung aus dem Display.
  // `kein_vote` = Personenwahlen ("Wahl mittels einfacher Abstimmung durch
  // Handaufheben"). Votes ohne `primaryDbid` sind reine Verfahrens-Abstimmungen
  // (Aktuelle-Stunde-Themenwahl, Dringlichkeit, Zitierung, Einspruch gegen
  // Ordnungsruf) ohne Drucksache — sie würden sonst als titelloses „Drucksache"
  // ohne Link erscheinen. Für Audit bleiben beide in der DB; UI-seitig wegfiltern.
  const filteredVotes = sit.votes.filter((v) => v.outcome !== "kein_vote" && v.primaryDbid !== null);

  // Gruppiere nach primary DS-Nr und behalte nur die letzte Abstimmung pro DS
  // (= Schlussabstimmung). Bei einem Gesetz mit 3 Votes (Änderungsantrag,
  // Original-Antrag, Schlussabstimmung im Ganzen) zeigt der Sitzungs-View
  // nur das Endergebnis + Hinweis "+N weitere". Detail liegt auf DS-Page.
  // vote_id wird in Insert-Reihenfolge vergeben → höchstes vote_id = letzte.
  const groupedByDs = new Map<string, typeof filteredVotes>();
  for (const v of filteredVotes) {
    // Vorgangs-ID gruppiert Antrag + Beschlussempfehlung + Schlussabstimmung
    // derselben „Drucksachen-Folge" zusammen. Wenn vorgang_id null, Fallback
    // auf primaryDbid (eindeutiger) oder drucksacheNrn[0].
    const key = v.primaryVorgangId
      ?? v.primaryDbid
      ?? v.drucksacheNrn[0]
      ?? `__solo_${v.voteId}`;
    if (!groupedByDs.has(key)) groupedByDs.set(key, []);
    groupedByDs.get(key)!.push(v);
  }
  const displayVotes: typeof filteredVotes = [];
  const additionalVotesCount = new Map<number, number>(); // vote_id → +N
  for (const group of groupedByDs.values()) {
    const sorted = [...group].sort((a, b) => b.voteId - a.voteId);
    const final = sorted[0];
    displayVotes.push(final);
    if (sorted.length > 1) additionalVotesCount.set(final.voteId, sorted.length - 1);
  }
  // Chronologisch sortiert (vote_id ascending) wieder
  displayVotes.sort((a, b) => a.voteId - b.voteId);

  // Match Votes → TOPs anhand DS-Nrn-Überschneidung.
  const votesByTopMarker = new Map<string, typeof displayVotes>();
  const matchedVoteIds = new Set<number>();
  for (const t of sit.tops) {
    const topDsNrs = new Set(t.drucksachen.map((d) => d.nr));
    if (topDsNrs.size === 0) continue;
    const matches = displayVotes.filter((v) =>
      v.drucksacheNrn.some((nr) => topDsNrs.has(nr))
    );
    if (matches.length > 0) {
      votesByTopMarker.set(t.marker, matches);
      for (const m of matches) matchedVoteIds.add(m.voteId);
    }
  }
  const orphanVotes = displayVotes.filter((v) => !matchedVoteIds.has(v.voteId));

  return (
    <div className="page-wash">
      <div className="w-full max-w-6xl mx-auto px-5 pt-10 pb-24">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <Link
            href="/design/linear/parlamente/berlin"
            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
            Abgeordnetenhaus Berlin
          </Link>
          <SitzungNav neighbors={neighbors} />
        </div>


        {/* Header */}
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Plenarprotokoll {sit.plprDokNr}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-zinc-950 mb-2">
            {sit.sitzungNr}. Sitzung des Abgeordnetenhauses
          </h1>
          <p className="text-[14px] text-zinc-600 num">
            {formatDate(sit.datum)}
            {" · "}
            <span className="font-medium text-zinc-950">{fmt(sit.redenTotal)}</span> Wortbeiträge
            {" · "}
            <span className="font-medium text-zinc-950">{displayVotes.length}</span> Abstimmungen
            {sit.plprLokUrl && (
              <>
                {" · "}
                <a
                  href={sit.plprLokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                >
                  PDF
                  <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                </a>
              </>
            )}
          </p>
          {sitzungDrucksachen.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1 items-center">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 mr-1">Drucksachen:</span>
              {sitzungDrucksachen.map((d) => (
                <DsPill key={d.nr} nr={d.nr} dbid={d.dbid} />
              ))}
            </div>
          )}
        </header>

        {/* Mobile: Inhaltsverzeichnis als ausklappbares Detail-Element */}
        <details className="lg:hidden mb-6 rounded-xl border border-zinc-200/70 bg-white">
          <summary className="list-none cursor-pointer px-4 py-3 flex items-center gap-2 text-[12px] font-medium text-zinc-700 select-none">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhaltsverzeichnis ({insights.length} Themen)
          </summary>
          <div className="px-4 pb-4">
            <TopsTOC insights={insights} />
          </div>
        </details>

        <div className="lg:flex lg:gap-10">
          <main className="lg:flex-1 lg:min-w-0">

        {/* Globaler Abstimmungs-Überblick — alle Votes der Sitzung auf einen Blick.
            Pro Vote ein id="vote-{id}", damit aus den TOP-Headern verlinkt werden kann.
            Orphans (ohne Debatte) sind visuell als solche markiert. */}
        {displayVotes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-zinc-950 mb-3">
              Abstimmungen
              <span className="text-zinc-400 num text-base font-normal ml-2">({displayVotes.length})</span>
            </h2>
            <ul className="space-y-1.5">
              {displayVotes.map((v) => (
                <li
                  key={v.voteId}
                  id={`vote-${v.voteId}`}
                  className="scroll-mt-12 target:bg-amber-50/60 transition-colors rounded-lg"
                >
                  <VoteCard vote={v} compact additionalVotes={additionalVotesCount.get(v.voteId) ?? 0} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Detail-Bereiche pro TOP — Anchor-Targets der Story-Cards */}
        {insights.map((ins) => {
          const t = ins.top;
          const filteredSpeeches = t.speeches.filter((s) => s.zusammenfassung);
          const gold = getClaudeGold(sit.sitzungNr, t.marker, t.titel);
          return (
            <section
              key={`detail-${t.marker}`}
              id={`top-${t.marker}`}
              className="mb-8 scroll-mt-6"
            >
              <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <div className="flex items-baseline gap-3 flex-wrap mb-2">
                    <span className="num text-[11px] font-semibold text-zinc-500">TOP {t.marker}</span>
                    <h2 className="text-[16px] font-semibold text-zinc-950 leading-snug flex-1">
                      {t.titel}
                    </h2>
                    <span className="text-[11px] text-zinc-400 num">{filteredSpeeches.length} Reden</span>
                  </div>
                  {(votesByTopMarker.get(t.marker) ?? []).length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      {(votesByTopMarker.get(t.marker) ?? []).map((v) => {
                        const isAcc = v.outcome === "annahme" || v.outcome === "annahme_geaendert";
                        const isRej = v.outcome === "ablehnung";
                        const label = isAcc ? "Angenommen"
                          : isRej ? "Abgelehnt"
                          : v.outcome === "vertagung" ? "Vertagt"
                          : v.outcome === "ueberweisung" ? "Überwiesen"
                          : v.outcome;
                        const cls = isAcc ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          : isRej ? "text-red-700 bg-red-50 hover:bg-red-100 border-red-200"
                          : "text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border-zinc-200";
                        return (
                          <a
                            key={v.voteId}
                            href={`#vote-${v.voteId}`}
                            className={`inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors ${cls}`}
                            title="Zur Abstimmung springen"
                          >
                            <span>↑</span> Abstimmung: {label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                  {t.drucksachen.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center mb-2">
                      {t.drucksachen.map((d) => (
                        <DsPill key={d.nr} nr={d.nr} dbid={d.dbid} />
                      ))}
                    </div>
                  )}
                  <SyntheseRender
                    mode={factsMode}
                    top={t}
                    gold={gold}
                    redenCount={filteredSpeeches.length}
                  />
                </div>
                <details className="group/reden">
                  <summary className="list-none cursor-pointer px-5 py-2.5 text-[11.5px] text-zinc-500 hover:text-zinc-950 border-t border-zinc-100 transition-colors select-none flex items-center gap-1.5">
                    <span className="text-zinc-400 group-open/reden:rotate-90 transition-transform">▶</span>
                    <span className="group-open/reden:hidden">Reden einblenden ({filteredSpeeches.length})</span>
                    <span className="hidden group-open/reden:inline">Reden ausblenden</span>
                  </summary>
                  <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                    {filteredSpeeches.map((sp, idx) => (
                      <li
                        key={sp.speechId}
                        id={`rede-${t.marker}-${idx + 1}`}
                        className="px-5 py-3 scroll-mt-12 target:bg-amber-50/60 transition-colors"
                      >
                        <div className="flex items-baseline gap-2 flex-wrap mb-1">
                          <span className="num text-[10px] text-zinc-400 shrink-0">{idx + 1}</span>
                          {sp.politicianId ? (
                            <Link
                              href={`/design/linear/politiker/${sp.politicianId}`}
                              className="text-[13.5px] font-medium text-zinc-950 hover:text-blue-700 transition-colors"
                            >
                              {sp.speakerName}
                            </Link>
                          ) : (
                            <span className="text-[13.5px] font-medium text-zinc-950">{sp.speakerName}</span>
                          )}
                          {sp.speakerParty && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${PARTY_COLOR[sp.speakerParty] ?? "bg-zinc-400"}`} />
                              {sp.speakerParty}
                            </span>
                          )}
                          {(() => {
                            const ton = resolveBerlinTonality(sp.tonalitaet);
                            const cfg = ton ? TONALITAET_CONFIG[ton] : null;
                            if (!cfg) return null;
                            return (
                              <span
                                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                title={`Tonalität: ${cfg.label}`}
                              >
                                {cfg.label}
                              </span>
                            );
                          })()}
                          {sp.drucksachen.length > 0 && sp.drucksachen.map((d) => (
                            <DsPill key={d.nr} nr={d.nr} dbid={d.dbid} />
                          ))}
                        </div>
                        {sp.zusammenfassung && (
                          <p className="text-[12.5px] text-zinc-600 leading-relaxed">
                            {sp.zusammenfassung}
                          </p>
                        )}
                        {sp.originalText && sp.originalText.length > 50 && (
                          <details className="mt-2 group/orig">
                            <summary className="list-none cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors select-none">
                              <span className="inline-flex items-center gap-1">
                                <span className="text-zinc-400 group-open/orig:rotate-90 transition-transform inline-block">▶</span>
                                <span className="group-open/orig:hidden">Originalrede einblenden</span>
                                <span className="hidden group-open/orig:inline">Originalrede ausblenden</span>
                              </span>
                            </summary>
                            <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-[12.5px] leading-[1.65] text-zinc-800 font-serif">
                              {sp.originalText
                                .split(/\n+/)
                                .map((p) => p.trim())
                                .filter(Boolean)
                                .map((para, i) => (
                                  <p key={i} className="mb-3 last:mb-0 hyphens-auto text-justify" lang="de">
                                    {para}
                                  </p>
                                ))}
                            </div>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </section>
          );
        })}

        {/* Footer-Navigation: dieselbe Sitzungs-Navigation am Ende, damit der
            Leser nach 17 TOPs direkt zur nächsten/vorherigen Sitzung springen kann. */}
        <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">Weiter zu</span>
          <SitzungNav neighbors={neighbors} size="lg" />
        </div>
          </main>

          {/* Desktop: Sticky-Sidebar Inhaltsverzeichnis.
              Sticky von top-20, mit pb-6 unten für visuellen Rand. */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 pb-6">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <ListTree className="w-3 h-3" strokeWidth={2.25} />
                Auf dieser Seite
              </div>
              <TopsTOC insights={insights} />
            </div>
          </aside>
        </div>
      </div>
      {/* Hash-Auto-Open: bei Klick auf [ref]-Anker oder Direktnavigation
          jeden geschlossenen <details>-Vorfahren des Targets aufklappen,
          damit der Sprung sichtbar landet. Nativer Browser-Support für
          target-induced details-open ist inkonsistent — kleines JS hilft. */}
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
    while(p){
      if(p.tagName === 'DETAILS' && !p.open){ p.open = true; }
      p = p.parentElement;
    }
    setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'start'}); }, 50);
  }
  window.addEventListener('hashchange', openAncestors);
  window.addEventListener('load', openAncestors);
  // Auch bei DOM-Ready falls load schon durch
  if(document.readyState !== 'loading'){ openAncestors(); }
})();
`,
        }}
      />
    </div>
  );
}
