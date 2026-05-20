"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  ListTree,
  Vote as VoteIcon,
  FileText,
  Loader2,
} from "lucide-react";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { highlight } from "@/lib/highlight";
import type {
  SearchHit,
  SearchResults,
  SearchType,
  PoliticianHit,
  SpeechHit,
  TopicHit,
  VoteHit,
  DrucksacheHit,
} from "@/lib/suche";

interface FlatHit {
  hit: SearchHit;
  href: string;
  sectionLabel: string;
}

const EMPTY: SearchResults = {
  query: "",
  politicians: [],
  speeches: [],
  topics: [],
  votes: [],
  drucksachen: [],
  total: 0,
  totals: { politicians: 0, speeches: 0, topics: 0, votes: 0, drucksachen: 0 },
  expansions: [],
  matchedClusters: [],
};

function flatten(results: SearchResults): FlatHit[] {
  const flat: FlatHit[] = [];
  results.politicians.forEach((h) =>
    flat.push({ hit: h, href: `/design/linear/politiker/${h.id}`, sectionLabel: "Personen" })
  );
  results.topics.forEach((h) =>
    flat.push({
      hit: h,
      href: `/design/linear/protokolle/top/${h.topic_id}`,
      sectionLabel: "Tagesordnungspunkte",
    })
  );
  results.speeches.forEach((h) =>
    flat.push({
      hit: h,
      href: `/design/linear/protokolle/redner/${encodeURIComponent(h.speaker)}`,
      sectionLabel: "Reden",
    })
  );
  results.votes.forEach((h) =>
    flat.push({
      hit: h,
      href: `/design/linear/abstimmungen/${h.poll_id}`,
      sectionLabel: "Abstimmungen",
    })
  );
  results.drucksachen.forEach((h) =>
    flat.push({
      hit: h,
      href: h.drucksache_nr
        ? `/design/linear/aktivitaeten/${h.drucksache_nr.replace("/", "-")}`
        : `/design/linear/protokolle`,
      sectionLabel: "Drucksachen",
    })
  );
  return flat;
}

function formatGermanDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${parseInt(d, 10)}.${parseInt(m, 10)}.${y.slice(2)}`;
}

const PARTY_DOT: Record<string, string> = {
  "CDU/CSU": "bg-zinc-800",
  SPD: "bg-rose-500",
  AfD: "bg-sky-600",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-emerald-600",
  "Die Linke": "bg-fuchsia-600",
  fraktionslos: "bg-zinc-400",
};

const SECTION_TOTAL_KEY: Record<string, SearchType> = {
  Personen: "politicians",
  Tagesordnungspunkte: "topics",
  Reden: "speeches",
  Abstimmungen: "votes",
  Drucksachen: "drucksachen",
};

/** Wenn total ≤ INLINE_THRESHOLD, lädt "Mehr"-Klick alle in den Modal; sonst gibt's nur den Vollliste-Link. */
const INLINE_THRESHOLD = 36;

export function CommandPalette({
  open,
  onClose,
  initialQuery,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional: Prefill bei Open (z.B. aus ?q= URL-Param oder Click auf Beispiel-Chip) */
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Inline-expanded items pro Section (Set bei "Mehr laden")
  const [expandedItems, setExpandedItems] = useState<Partial<Record<SearchType, SearchHit[]>>>({});
  const [expandingType, setExpandingType] = useState<SearchType | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Effektive Results — mit ggf. expanded items pro Typ
  const effectiveResults = useMemo<SearchResults>(() => {
    if (Object.keys(expandedItems).length === 0) return results;
    return {
      ...results,
      politicians:
        (expandedItems.politicians as PoliticianHit[] | undefined) ?? results.politicians,
      speeches: (expandedItems.speeches as SpeechHit[] | undefined) ?? results.speeches,
      topics: (expandedItems.topics as TopicHit[] | undefined) ?? results.topics,
      votes: (expandedItems.votes as VoteHit[] | undefined) ?? results.votes,
      drucksachen:
        (expandedItems.drucksachen as DrucksacheHit[] | undefined) ?? results.drucksachen,
    };
  }, [results, expandedItems]);

  const flatHits = useMemo(() => flatten(effectiveResults), [effectiveResults]);
  const highlightTerms = useMemo(
    () => [results.query, ...results.expansions].filter((t) => t && t.length >= 2),
    [results.query, results.expansions]
  );

  // Reset on open (mit optional initialQuery)
  useEffect(() => {
    if (open) {
      setQuery(initialQuery ?? "");
      setResults(EMPTY);
      setSelectedIndex(0);
      setExpandedItems({});
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open, initialQuery]);

  // Debounced fetch — bei Query-Change Expanded-State invalidieren
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      setExpandedItems({});
      return;
    }
    setLoading(true);
    setExpandedItems({});
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suche?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as SearchResults;
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [query, open]);

  async function loadMore(type: SearchType) {
    setExpandingType(type);
    try {
      // Bei Inline-Expand: lade alle (capped bei INLINE_THRESHOLD, weil dieser Pfad nur für total ≤ threshold gezeigt wird)
      const res = await fetch(
        `/api/suche?q=${encodeURIComponent(query)}&type=${type}&page=1&pageSize=${INLINE_THRESHOLD}`
      );
      const data = await res.json();
      setExpandedItems((prev) => ({ ...prev, [type]: data.items }));
    } catch {
      // silent fail
    } finally {
      setExpandingType(null);
    }
  }

  function goToFullList(type: SearchType) {
    onClose();
    router.push(`/design/linear/suche?q=${encodeURIComponent(query)}&type=${type}`);
  }

  // Keyboard navigation
  const navigateTo = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [router, onClose]
  );

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (flatHits.length === 0 ? 0 : (i + 1) % flatHits.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          flatHits.length === 0 ? 0 : (i - 1 + flatHits.length) % flatHits.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = flatHits[selectedIndex];
        if (target) navigateTo(target.href);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, flatHits, selectedIndex, navigateTo, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  // Group flatHits by sectionLabel preserving order
  const grouped: { label: string; items: { hit: FlatHit; idx: number }[] }[] = [];
  flatHits.forEach((fh, idx) => {
    let bucket = grouped.find((g) => g.label === fh.sectionLabel);
    if (!bucket) {
      bucket = { label: fh.sectionLabel, items: [] };
      grouped.push(bucket);
    }
    bucket.items.push({ hit: fh, idx });
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-[12vh] px-4 bg-zinc-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Suche"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          {loading ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" strokeWidth={2.25} />
          ) : (
            <Search className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2.25} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="MdB, Thema, Rede, Vote…"
            className="flex-1 bg-transparent border-0 outline-none text-base sm:text-[15px] text-zinc-900 placeholder:text-zinc-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Synonym-Expansion-Strip: zeigt mit welchen verwandten Begriffen mitgesucht wurde */}
        {results.matchedClusters.length > 0 && results.expansions.length > 0 && (
          <div className="border-b border-zinc-100 bg-zinc-50/60">
            <div className="px-4 pt-2 pb-1 text-[11px] text-zinc-500 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="text-zinc-400">auch gesucht über:</span>
              {results.expansions.slice(0, 12).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                  title={`Stattdessen nach "${term}" suchen`}
                >
                  {term}
                </button>
              ))}
              {results.expansions.length > 12 && (
                <span className="text-zinc-400">+{results.expansions.length - 12}</span>
              )}
            </div>
            <MatchBreakdown
              totals={results.totals}
              totalsOriginal={results.totalsOriginal}
              query={results.query}
            />
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {query.trim().length < 2 && (
            <div className="px-4 py-12 text-center text-[13px] text-zinc-400">
              Tippe mindestens 2 Zeichen, um zu suchen.
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {["Asyl", "Stromsteuer", "Bundeswehr", "Klima", "Bürgergeld"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="px-2 py-0.5 text-[11px] text-zinc-500 border border-zinc-200 rounded hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {query.trim().length >= 2 && results.total === 0 && !loading && (
            <div className="px-4 py-12 text-center text-[13px] text-zinc-400">
              Keine Treffer für „{query}".
            </div>
          )}
          {grouped.map((section) => {
            const totalKey = SECTION_TOTAL_KEY[section.label];
            const total = totalKey ? results.totals[totalKey] : section.items.length;
            return (
            <div key={section.label} className="mb-1">
              <div className="px-4 pt-2 pb-1 flex items-baseline justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                <span>{section.label}</span>
                <span className="text-zinc-400 tabular-nums normal-case tracking-normal">
                  {total > section.items.length ? (
                    <>
                      <span className="text-zinc-900">{section.items.length}</span>
                      <span className="text-zinc-300"> / </span>
                      <span>{total}</span>
                    </>
                  ) : (
                    <span>{total}</span>
                  )}
                </span>
              </div>
              {section.items.map(({ hit, idx }) => (
                <ResultRow
                  key={`${hit.hit.type}-${idx}`}
                  flat={hit}
                  idx={idx}
                  selected={idx === selectedIndex}
                  onHover={() => setSelectedIndex(idx)}
                  onClick={() => navigateTo(hit.href)}
                  terms={highlightTerms}
                />
              ))}
              {totalKey && total > section.items.length && (() => {
                const useInline = total <= INLINE_THRESHOLD && !expandedItems[totalKey];
                return (
                  <div className="px-4 pt-1.5 pb-2 flex items-center text-[11.5px] border-t border-zinc-100 mt-1">
                    {useInline ? (
                      <button
                        type="button"
                        onClick={() => loadMore(totalKey)}
                        disabled={expandingType === totalKey}
                        className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 disabled:text-zinc-400 transition-colors"
                      >
                        {expandingType === totalKey ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.25} />
                            lädt…
                          </>
                        ) : (
                          <>+{total - section.items.length} im Modal laden</>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goToFullList(totalKey)}
                        className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-950 transition-colors"
                      >
                        Alle <span className="tabular-nums">{total}</span> anzeigen →
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="hidden sm:flex px-4 py-2 border-t border-zinc-100 items-center gap-4 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 border border-zinc-200 rounded text-[10px]">↑↓</kbd>
            navigieren
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 border border-zinc-200 rounded text-[10px]">↵</kbd>
            öffnen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 border border-zinc-200 rounded text-[10px]">esc</kbd>
            schließen
          </span>
        </div>
      </div>
    </div>
  );
}

function MatchBreakdown({
  totals,
  totalsOriginal,
  query,
}: {
  totals: SearchResults["totals"];
  totalsOriginal: SearchResults["totalsOriginal"];
  query: string;
}) {
  const types: { key: keyof SearchResults["totals"]; label: string }[] = [
    { key: "speeches", label: "Reden" },
    { key: "topics", label: "TOPs" },
    { key: "votes", label: "Votes" },
    { key: "drucksachen", label: "Drucksachen" },
  ];
  const parts: string[] = [];
  for (const { key, label } of types) {
    const total = totals[key];
    if (total === 0) continue;
    const original = totalsOriginal[key];
    parts.push(`${label} ${original}/${total}`);
  }
  if (parts.length === 0) return null;
  return (
    <div
      className="px-4 pb-2 text-[10.5px] text-zinc-400 leading-snug"
      title="Wieviele Treffer enthalten den Original-Begriff im Text direkt — der Rest kam über die Synonyme oben."
    >
      direkt „{query}": <span className="tabular-nums">{parts.join(" · ")}</span>
    </div>
  );
}

function ResultRow({
  flat,
  idx,
  selected,
  onHover,
  onClick,
  terms,
}: {
  flat: FlatHit;
  idx: number;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
  terms: string[];
}) {
  const cls = `flex items-center gap-3 px-4 py-2 cursor-pointer ${
    selected ? "bg-zinc-100" : ""
  }`;

  return (
    <div data-idx={idx} className={cls} onMouseEnter={onHover} onClick={onClick}>
      {renderHit(flat.hit, terms)}
    </div>
  );
}

function renderHit(hit: SearchHit, terms: string[]) {
  switch (hit.type) {
    case "politician":
      return <PoliticianRow hit={hit} terms={terms} />;
    case "topic":
      return <TopicRow hit={hit} terms={terms} />;
    case "speech":
      return <SpeechRow hit={hit} terms={terms} />;
    case "vote":
      return <VoteRow hit={hit} terms={terms} />;
    case "drucksache":
      return <DrucksacheRow hit={hit} terms={terms} />;
  }
}

function PoliticianRow({ hit, terms }: { hit: PoliticianHit; terms: string[] }) {
  return (
    <>
      <PoliticianAvatar
        photoUrl={hit.photo_url}
        firstName={hit.first_name}
        lastName={hit.last_name}
        party={hit.party}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{highlight(hit.name, terms)}</div>
        {hit.subtitle && (
          <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 truncate">
            {hit.party && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${PARTY_DOT[hit.party] ?? "bg-zinc-300"}`}
              />
            )}
            <span className="truncate">{hit.subtitle}</span>
          </div>
        )}
      </div>
    </>
  );
}

function TopicRow({ hit, terms }: { hit: TopicHit; terms: string[] }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <ListTree className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{highlight(hit.title, terms)}</div>
        <div className="text-[11.5px] text-zinc-500 truncate">
          TOP {hit.topic_number} · {hit.speech_count} Reden
          {hit.session_date && ` · ${formatGermanDate(hit.session_date)}`}
        </div>
      </div>
    </>
  );
}

function formatTonalitaet(raw: string | null): string | null {
  if (!raw) return null;
  return raw.replace(/_/g, " ");
}

function SpeechRow({ hit, terms }: { hit: SpeechHit; terms: string[] }) {
  const ton = formatTonalitaet(hit.tonalitaet);
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[13.5px] text-zinc-900 truncate flex-1 min-w-0">{highlight(hit.snippet, terms)}</div>
          {ton && (
            <span
              className="shrink-0 px-1.5 py-0.5 text-[10.5px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded"
              title="Tonalität — KI-eingeschätzt aus dem Redetext (Methodik in /design/linear/methodik)"
            >
              {ton}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 truncate">
          {hit.party && (
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${PARTY_DOT[hit.party] ?? "bg-zinc-300"}`}
            />
          )}
          <span className="truncate">
            {hit.speaker}
            {hit.speech_date && ` · ${formatGermanDate(hit.speech_date)}`}
          </span>
        </div>
      </div>
    </>
  );
}

function VoteRow({ hit, terms }: { hit: VoteHit; terms: string[] }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <VoteIcon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{highlight(hit.label, terms)}</div>
        {hit.poll_date && (
          <div className="text-[11.5px] text-zinc-500">
            Abstimmung · {formatGermanDate(hit.poll_date)}
          </div>
        )}
      </div>
    </>
  );
}

const dsKlasseShort: Record<string, string> = {
  klein: "Kl. Anfrage",
  mittel: "Bericht",
  gross: "Gesetzentwurf",
  antwort: "BReg-Antwort",
  regierung: "Reg.-Vorlage",
  administrativ: "Verwaltung",
};

function DrucksacheRow({ hit, terms }: { hit: DrucksacheHit; terms: string[] }) {
  const klasseLabel = hit.batch_class ? dsKlasseShort[hit.batch_class] ?? hit.batch_class : "Drucksache";
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate font-medium">{highlight(hit.title, terms)}</div>
        {hit.snippet && (
          <div className="text-[12px] text-zinc-600 line-clamp-2 leading-snug mt-0.5">
            {highlight(hit.snippet, terms)}
          </div>
        )}
        <div className="text-[10.5px] text-zinc-500 truncate mt-0.5">
          {klasseLabel}
          {hit.drucksache_nr && ` · ${hit.drucksache_nr}`}
          {hit.date && ` · ${formatGermanDate(hit.date)}`}
        </div>
      </div>
    </>
  );
}
