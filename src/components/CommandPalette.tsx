"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MessageSquare,
  MessageSquareQuote,
  ListTree,
  Vote as VoteIcon,
  FileText,
  Loader2,
  Plus,
  MapPin,
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
  QaHit,
} from "@/lib/suche";

type SearchScope = "bundestag" | "berlin";

interface FlatHit {
  hit: SearchHit;
  href: string;
  sectionLabel: string;
}

const ZERO_TOTALS = { politicians: 0, speeches: 0, topics: 0, votes: 0, drucksachen: 0, qa: 0 };
const EMPTY: SearchResults = {
  query: "",
  politicians: [],
  speeches: [],
  topics: [],
  votes: [],
  drucksachen: [],
  qa: [],
  total: 0,
  totals: { ...ZERO_TOTALS },
  totalsOriginal: { ...ZERO_TOTALS },
  totalsExpanded: { ...ZERO_TOTALS },
  expand: false,
  expansions: [],
  matchedClusters: [],
  directHit: null,
};

function speechHref(h: SpeechHit, scope: SearchScope): string {
  // Berlin hat keine Redner-Seite — Reden routen auf ihre Sitzungs-Seite.
  if (scope === "berlin") return h.detail_url ?? "#";
  return `/protokolle/redner/${encodeURIComponent(h.speaker)}`;
}

function drucksacheHref(h: DrucksacheHit, scope: SearchScope): string {
  if (scope === "berlin") return h.detail_url ?? "#";
  return h.drucksache_nr ? `/aktivitaeten/${h.drucksache_nr.replace("/", "-")}` : `/protokolle`;
}

function flatten(results: SearchResults, scope: SearchScope): FlatHit[] {
  const flat: FlatHit[] = [];
  if (results.directHit) {
    flat.push({
      hit: results.directHit,
      href: drucksacheHref(results.directHit, scope),
      sectionLabel: "Direkter Treffer",
    });
  }
  results.politicians.forEach((h) =>
    flat.push({ hit: h, href: `/politiker/${h.id}`, sectionLabel: "Personen" })
  );
  results.topics.forEach((h) =>
    flat.push({
      hit: h,
      href: `/protokolle/top/${h.topic_id}`,
      sectionLabel: "Tagesordnungspunkte",
    })
  );
  results.speeches.forEach((h) =>
    flat.push({
      hit: h,
      href: speechHref(h, scope),
      sectionLabel: "Reden",
    })
  );
  results.votes.forEach((h) =>
    flat.push({
      hit: h,
      href: `/abstimmungen/${h.poll_id}`,
      sectionLabel: "Abstimmungen",
    })
  );
  results.drucksachen.forEach((h) =>
    flat.push({
      hit: h,
      href: drucksacheHref(h, scope),
      sectionLabel: "Drucksachen",
    })
  );
  results.qa.forEach((h) =>
    flat.push({
      hit: h,
      href: h.detail_url ?? `/aktivitaeten/${h.drucksache_nr.replace("/", "-")}`,
      sectionLabel: "Fragen & Antworten",
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
  "Fragen & Antworten": "qa",
};

const TYPE_FILTERS: { key: SearchType; label: string }[] = [
  { key: "politicians", label: "Personen" },
  { key: "speeches", label: "Reden" },
  { key: "topics", label: "TOPs" },
  { key: "votes", label: "Abstimmungen" },
  { key: "drucksachen", label: "Drucksachen" },
  { key: "qa", label: "Fragen" },
];

/** Wenn total ≤ INLINE_THRESHOLD, lädt "Mehr"-Klick alle in den Modal; sonst gibt's nur den Vollliste-Link. */
const INLINE_THRESHOLD = 36;

export function CommandPalette({
  open,
  onClose,
  initialQuery,
  scope = "bundestag",
}: {
  open: boolean;
  onClose: () => void;
  /** Optional: Prefill bei Open (z.B. aus ?q= URL-Param oder Click auf Beispiel-Chip) */
  initialQuery?: string;
  /** Daten-/Routing-Scope. "berlin" → Berlin-API + Berlin-Detail-Links. */
  scope?: SearchScope;
}) {
  const router = useRouter();
  const apiScope = scope === "berlin" ? "&scope=berlin" : "";
  const fullListPath = scope === "berlin" ? "/parlamente/berlin/suche" : "/suche";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Synonym-Erweiterung ist opt-in: Default exakt, „erweitern" schaltet verwandte Themen dazu.
  const [expand, setExpand] = useState(false);
  // Typ-Filter (null = alle Typen)
  const [activeType, setActiveType] = useState<SearchType | null>(null);
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
      qa: (expandedItems.qa as QaHit[] | undefined) ?? results.qa,
    };
  }, [results, expandedItems]);

  const flatHits = useMemo(() => flatten(effectiveResults, scope), [effectiveResults, scope]);
  // Typ-Filter: nur die gewählte Sektion zeigen (null = alle)
  const displayHits = useMemo(
    () =>
      activeType
        ? flatHits.filter((fh) => SECTION_TOTAL_KEY[fh.sectionLabel] === activeType)
        : flatHits,
    [flatHits, activeType]
  );
  // Synonyme nur im Erweitert-Modus hervorheben (sonst exakt).
  const highlightTerms = useMemo(
    () =>
      [results.query, ...(results.expand ? results.expansions : [])].filter(
        (t) => t && t.length >= 2
      ),
    [results.query, results.expansions, results.expand]
  );
  // Wieviele zusätzliche Treffer gäbe es mit Synonym-Erweiterung (über alle Typen)?
  const relatedExtra = useMemo(() => {
    const sum = (t: SearchResults["totals"]) =>
      t.speeches + t.topics + t.votes + t.drucksachen + t.qa; // Personen kennen keine Synonyme
    return Math.max(0, sum(results.totalsExpanded) - sum(results.totalsOriginal));
  }, [results.totalsExpanded, results.totalsOriginal]);
  const canExpand = results.matchedClusters.length > 0 && relatedExtra > 0;

  // Smarte PLZ-Erkennung (nur Bundestag): reine 5-stellige Eingabe → Wahlkreis-Finder.
  // Berlin hat (noch) keine Wahlkreis-Geometrie → dort normal weitersuchen.
  const plzMatch = scope === "bundestag" ? (query.trim().match(/^\d{5}$/)?.[0] ?? null) : null;
  const plzHref = plzMatch ? `/wahlkreis?plz=${plzMatch}` : null;

  // Reset on open (mit optional initialQuery)
  useEffect(() => {
    if (open) {
      setQuery(initialQuery ?? "");
      setResults(EMPTY);
      setSelectedIndex(0);
      setExpandedItems({});
      setExpand(false);
      setActiveType(null);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open, initialQuery]);

  // Neuer Suchbegriff → zurück auf Default: exakt + alle Typen.
  useEffect(() => {
    setExpand(false);
    setActiveType(null);
  }, [query]);

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
        const res = await fetch(
          `/api/suche?q=${encodeURIComponent(query)}&expand=${expand ? 1 : 0}${apiScope}`
        );
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
  }, [query, open, expand]);

  async function loadMore(type: SearchType) {
    setExpandingType(type);
    try {
      // Bei Inline-Expand: lade alle (capped bei INLINE_THRESHOLD, weil dieser Pfad nur für total ≤ threshold gezeigt wird)
      const res = await fetch(
        `/api/suche?q=${encodeURIComponent(query)}&type=${type}&page=1&pageSize=${INLINE_THRESHOLD}&expand=${results.expand ? 1 : 0}${apiScope}`
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
    const expandParam = results.expand ? "&expand=1" : "";
    router.push(`${fullListPath}?q=${encodeURIComponent(query)}&type=${type}${expandParam}`);
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
        setSelectedIndex((i) => (displayHits.length === 0 ? 0 : (i + 1) % displayHits.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          displayHits.length === 0 ? 0 : (i - 1 + displayHits.length) % displayHits.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Reine PLZ → direkt zum Wahlkreis-Finder, egal welche Trefferzeile markiert ist.
        if (plzHref) {
          navigateTo(plzHref);
          return;
        }
        const target = displayHits[selectedIndex];
        if (target) navigateTo(target.href);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, displayHits, selectedIndex, navigateTo, onClose, plzHref]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  // Group flatHits by sectionLabel preserving order
  const grouped: { label: string; items: { hit: FlatHit; idx: number }[] }[] = [];
  displayHits.forEach((fh, idx) => {
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
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Suche"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {loading ? (
            <Loader2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 animate-spin shrink-0" strokeWidth={2.25} />
          ) : (
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" strokeWidth={2.25} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="MdB, Thema, Rede, Vote…"
            className="flex-1 bg-transparent border-0 outline-none text-base sm:text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Steuerleiste: Typ-Filter + Exakt/Erweitern */}
        {query.trim().length >= 2 && results.total > 0 && (
          <div className="border-b border-border bg-zinc-50/60 dark:bg-zinc-800/60 px-4 py-2 space-y-2">
            {/* Typ-Filter-Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                label="Alle"
                count={
                  results.totals.politicians +
                  results.totals.speeches +
                  results.totals.topics +
                  results.totals.votes +
                  results.totals.drucksachen +
                  results.totals.qa
                }
                active={activeType === null}
                onClick={() => {
                  setActiveType(null);
                  setSelectedIndex(0);
                }}
              />
              {TYPE_FILTERS.map(({ key, label }) => {
                const c = results.totals[key];
                if (c === 0) return null;
                return (
                  <FilterChip
                    key={key}
                    label={label}
                    count={c}
                    active={activeType === key}
                    onClick={() => {
                      setActiveType(key);
                      setSelectedIndex(0);
                    }}
                  />
                );
              })}
            </div>

            {/* Exakt-Default vs. Erweitern */}
            {results.expand ? (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-400 dark:text-zinc-500">verwandte Begriffe:</span>
                {results.expansions.slice(0, 10).map((term) => (
                  <span
                    key={term}
                    className="px-1.5 py-0.5 bg-card border border-border rounded text-zinc-600 dark:text-zinc-300"
                  >
                    {term}
                  </span>
                ))}
                {results.expansions.length > 10 && (
                  <span className="text-zinc-400 dark:text-zinc-500">+{results.expansions.length - 10}</span>
                )}
                <button
                  type="button"
                  onClick={() => setExpand(false)}
                  className="ml-auto shrink-0 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 underline underline-offset-2"
                >
                  nur exakte Treffer
                </button>
              </div>
            ) : canExpand ? (
              <button
                type="button"
                onClick={() => setExpand(true)}
                className="w-full flex items-center gap-2 text-[12px] text-left text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                title="Verwandte Themen über Synonym-Cluster einbeziehen"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                <span>
                  Verwandte Themen einbeziehen
                  {results.matchedClusters.length > 0 && (
                    <span className="text-zinc-400 dark:text-zinc-500"> ({results.matchedClusters.join(", ")})</span>
                  )}{" "}
                  — <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">+{relatedExtra}</span>{" "}
                  Treffer
                </span>
              </button>
            ) : null}
          </div>
        )}

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {plzHref && (
            <button
              type="button"
              onClick={() => navigateTo(plzHref)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-border"
            >
              <div className="w-7 h-7 rounded-md bg-[#1a3e72]/10 dark:bg-[#8fb3e6]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#1a3e72] dark:text-[#8fb3e6]" strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] text-zinc-900 dark:text-zinc-100">
                  Abgeordnete für PLZ <span className="font-medium">{plzMatch}</span> anzeigen
                </div>
                <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400">Wer dich im Bundestag vertritt — mit ↵</div>
              </div>
            </button>
          )}
          {query.trim().length < 2 && (
            <div className="px-4 py-12 text-center text-[13px] text-zinc-400 dark:text-zinc-500">
              Tippe mindestens 2 Zeichen, um zu suchen.
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {["Asyl", "Stromsteuer", "Bundeswehr", "Klima", "Bürgergeld"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="px-2 py-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 border border-border rounded hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {query.trim().length >= 2 && results.total === 0 && !loading && !plzHref && (
            <div className="px-4 py-12 text-center text-[13px] text-zinc-400 dark:text-zinc-500">
              Keine Treffer für „{query}".
            </div>
          )}
          {grouped.map((section) => {
            const totalKey = SECTION_TOTAL_KEY[section.label];
            const total = totalKey ? results.totals[totalKey] : section.items.length;
            return (
            <div key={section.label} className="mb-1">
              <div className="px-4 pt-2 pb-1 flex items-baseline justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <span>{section.label}</span>
                <span className="text-zinc-400 dark:text-zinc-500 tabular-nums normal-case tracking-normal">
                  {total > section.items.length ? (
                    <>
                      <span className="text-zinc-900 dark:text-zinc-100">{section.items.length}</span>
                      <span className="text-zinc-300 dark:text-zinc-600"> / </span>
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
                  <div className="px-4 pt-1.5 pb-2 flex items-center text-[11.5px] border-t border-border mt-1">
                    {useInline ? (
                      <button
                        type="button"
                        onClick={() => loadMore(totalKey)}
                        disabled={expandingType === totalKey}
                        className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 disabled:text-zinc-400 dark:disabled:text-zinc-500 transition-colors"
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
                        className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
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
        <div className="hidden sm:flex px-4 py-2 border-t border-border items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 border border-border rounded text-[10px]">↑↓</kbd>
            navigieren
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 border border-border rounded text-[10px]">↵</kbd>
            öffnen
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 border border-border rounded text-[10px]">esc</kbd>
            schließen
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full text-[11.5px] border transition-colors ${
        active
          ? "bg-zinc-900 text-white border-zinc-900 dark:border-zinc-100"
          : "bg-card text-zinc-600 dark:text-zinc-300 border-border hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {label} <span className={`tabular-nums ${active ? "opacity-70" : "text-zinc-400 dark:text-zinc-500"}`}>{count}</span>
    </button>
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
    selected ? "bg-zinc-100 dark:bg-zinc-800" : ""
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
    case "qa":
      return <QaRow hit={hit} terms={terms} />;
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
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate">{highlight(hit.name, terms)}</span>
          {hit.isFormer && (
            <span className="shrink-0 rounded-sm bg-zinc-100 dark:bg-zinc-800 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ring-1 ring-inset ring-zinc-200 dark:ring-zinc-700">
              ehem.
            </span>
          )}
        </div>
        {hit.subtitle && (
          <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate">
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
      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <ListTree className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate">{highlight(hit.title, terms)}</div>
        <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate">
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
      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0">{highlight(hit.snippet, terms)}</div>
          {ton && (
            <span
              className="shrink-0 px-1.5 py-0.5 text-[10.5px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-border rounded"
              title="Tonalität — KI-eingeschätzt aus dem Redetext (Methodik in /methodik)"
            >
              {ton}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate">
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
      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <VoteIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate">{highlight(hit.label, terms)}</div>
        {hit.poll_date && (
          <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
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
      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate font-medium">{highlight(hit.title, terms)}</div>
        {hit.snippet && (
          <div className="text-[12px] text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-snug mt-0.5">
            {highlight(hit.snippet, terms)}
          </div>
        )}
        <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {klasseLabel}
          {hit.drucksache_nr && ` · ${hit.drucksache_nr}`}
          {hit.date && ` · ${formatGermanDate(hit.date)}`}
        </div>
      </div>
    </>
  );
}

function QaRow({ hit, terms }: { hit: QaHit; terms: string[] }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <MessageSquareQuote className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        {hit.frage && (
          <div className="text-[13.5px] text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">{highlight(hit.frage, terms)}</div>
        )}
        {hit.antwort_snippet && (
          <div className="text-[12px] text-zinc-600 dark:text-zinc-300 truncate leading-snug mt-0.5">
            <span className="text-zinc-400 dark:text-zinc-500">↳ </span>{highlight(hit.antwort_snippet, terms)}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
          {hit.fragesteller_party && (
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${PARTY_DOT[hit.fragesteller_party] ?? "bg-zinc-300"}`}
            />
          )}
          <span className="truncate">
            Frage
            {hit.fragesteller_name && ` · ${hit.fragesteller_name}`}
            {` · ${hit.drucksache_nr}`}
            {hit.date && ` · ${formatGermanDate(hit.date)}`}
          </span>
        </div>
      </div>
    </>
  );
}
