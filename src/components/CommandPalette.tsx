"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  MessageSquare,
  ListTree,
  Vote as VoteIcon,
  FileText,
  Loader2,
} from "lucide-react";
import type {
  SearchHit,
  SearchResults,
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
};

function flatten(results: SearchResults): FlatHit[] {
  const flat: FlatHit[] = [];
  results.politicians.forEach((h) =>
    flat.push({ hit: h, href: `/design/linear/politiker/${h.id}`, sectionLabel: "Personen" })
  );
  results.topics.forEach((h) =>
    flat.push({
      hit: h,
      href: `/design/linear/protokolle`,
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
    flat.push({ hit: h, href: `/design/linear/protokolle`, sectionLabel: "Drucksachen" })
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

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const flatHits = useMemo(() => flatten(results), [results]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(EMPTY);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
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
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-zinc-950/40 backdrop-blur-sm"
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
            placeholder="MdBs, Themen, Reden, Abstimmungen, Drucksachen…"
            className="flex-1 bg-transparent border-0 outline-none text-[15px] text-zinc-900 placeholder:text-zinc-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-200 rounded">
            ESC
          </kbd>
        </div>

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
          {grouped.map((section) => (
            <div key={section.label} className="mb-1">
              <div className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {section.label}
              </div>
              {section.items.map(({ hit, idx }) => (
                <ResultRow
                  key={`${hit.hit.type}-${idx}`}
                  flat={hit}
                  idx={idx}
                  selected={idx === selectedIndex}
                  onHover={() => setSelectedIndex(idx)}
                  onClick={() => navigateTo(hit.href)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-100 flex items-center gap-4 text-[11px] text-zinc-400">
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

function ResultRow({
  flat,
  idx,
  selected,
  onHover,
  onClick,
}: {
  flat: FlatHit;
  idx: number;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const cls = `flex items-center gap-3 px-4 py-2 cursor-pointer ${
    selected ? "bg-zinc-100" : ""
  }`;

  return (
    <div data-idx={idx} className={cls} onMouseEnter={onHover} onClick={onClick}>
      {renderHit(flat.hit)}
    </div>
  );
}

function renderHit(hit: SearchHit) {
  switch (hit.type) {
    case "politician":
      return <PoliticianRow hit={hit} />;
    case "topic":
      return <TopicRow hit={hit} />;
    case "speech":
      return <SpeechRow hit={hit} />;
    case "vote":
      return <VoteRow hit={hit} />;
    case "drucksache":
      return <DrucksacheRow hit={hit} />;
  }
}

function PoliticianRow({ hit }: { hit: PoliticianHit }) {
  return (
    <>
      <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
        <User className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{hit.name}</div>
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

function TopicRow({ hit }: { hit: TopicHit }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <ListTree className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{hit.title}</div>
        <div className="text-[11.5px] text-zinc-500 truncate">
          TOP {hit.topic_number} · {hit.speech_count} Reden
          {hit.session_date && ` · ${formatGermanDate(hit.session_date)}`}
        </div>
      </div>
    </>
  );
}

function SpeechRow({ hit }: { hit: SpeechHit }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{hit.snippet}</div>
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

function VoteRow({ hit }: { hit: VoteHit }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <VoteIcon className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{hit.label}</div>
        {hit.poll_date && (
          <div className="text-[11.5px] text-zinc-500">
            Abstimmung · {formatGermanDate(hit.poll_date)}
          </div>
        )}
      </div>
    </>
  );
}

function DrucksacheRow({ hit }: { hit: DrucksacheHit }) {
  return (
    <>
      <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-zinc-500" strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] text-zinc-900 truncate">{hit.title}</div>
        <div className="text-[11.5px] text-zinc-500 truncate">
          {hit.vorgangstyp ?? "Drucksache"}
          {hit.drucksache_nr && ` · ${hit.drucksache_nr}`}
          {hit.date && ` · ${formatGermanDate(hit.date)}`}
        </div>
      </div>
    </>
  );
}
