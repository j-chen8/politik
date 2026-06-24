"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, Loader2, FileText, Vote, MessageSquareQuote } from "lucide-react";
import { highlight } from "@/lib/highlight";
import type { SearchHit, SearchThemaResult } from "@/lib/suche";

function fmtDate(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_META = {
  speech: { label: "Rede", Icon: MessageSquareQuote },
  drucksache: { label: "Drucksache", Icon: FileText },
  vote: { label: "Abstimmung", Icon: Vote },
} as const;

function hitKey(h: SearchHit): string {
  if (h.type === "speech") return `s-${h.rede_id}`;
  if (h.type === "drucksache") return `d-${h.drucksache_nr}`;
  if (h.type === "vote") return `v-${h.poll_id}`;
  return Math.random().toString();
}

function hitHref(h: SearchHit): string {
  if (h.type === "speech") return `/protokolle/redner/${encodeURIComponent(h.speaker)}`;
  if (h.type === "drucksache") return `/aktivitaeten/${(h.drucksache_nr ?? "").replace("/", "-")}`;
  if (h.type === "vote") return `/abstimmungen/${h.poll_id}`;
  return "#";
}

function Row({ hit, terms }: { hit: SearchHit; terms: string[] }) {
  if (hit.type !== "speech" && hit.type !== "drucksache" && hit.type !== "vote") return null;
  const meta = TYPE_META[hit.type];
  const title =
    hit.type === "speech" ? hit.snippet : hit.type === "drucksache" ? hit.title : hit.label;
  const date = hit.type === "speech" ? hit.speech_date : hit.type === "drucksache" ? hit.date : hit.poll_date;
  const sub =
    hit.type === "speech"
      ? [hit.speaker, hit.party].filter(Boolean).join(" · ")
      : hit.type === "drucksache"
        ? [hit.snippet, hit.drucksache_nr].filter(Boolean).join(" · ")
        : "";

  return (
    <Link
      href={hitHref(hit)}
      className="block border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
    >
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
        <meta.Icon className="h-3.5 w-3.5" strokeWidth={2} />
        <span className="uppercase tracking-wider">{meta.label}</span>
        {date && <span className="text-zinc-300 dark:text-zinc-600">· {fmtDate(date)}</span>}
      </div>
      <div className="text-[14px] leading-snug text-zinc-900 dark:text-zinc-100">
        {highlight(title ?? "", terms)}
      </div>
      {sub && <div className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{sub}</div>}
    </Link>
  );
}

export function SearchThemaList({ slug, initialQuery }: { slug: string; initialQuery: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [data, setData] = useState<SearchThemaResult | null>(null);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const url = `/api/suche?thema=${encodeURIComponent(slug)}${q.trim().length >= 2 ? `&q=${encodeURIComponent(q.trim())}` : ""}`;
      fetch(url)
        .then((r) => r.json())
        .then((d: SearchThemaResult) => setData(d))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
      // URL teilbar halten (ohne Navigation/History-Spam)
      const shareUrl = `/suche?thema=${encodeURIComponent(slug)}${q.trim().length >= 2 ? `&q=${encodeURIComponent(q.trim())}` : ""}`;
      window.history.replaceState(null, "", shareUrl);
    }, 220);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [slug, q]);

  const terms = useMemo(() => (q.trim().length >= 2 ? [q.trim()] : []), [q]);
  const label = data?.label ?? null;

  return (
    <div className="page-wash min-h-screen">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link
          href="/vorschau"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Zurück
        </Link>

        {/* Aktiver Themen-Filter (abschaltbar) */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Thema</span>
          <Link
            href="/suche"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#1a3e72] dark:bg-[#8fb3e6] py-1.5 pl-3 pr-2 text-[13.5px] font-medium text-white transition hover:bg-[#16335f]"
          >
            {label ?? slug}
            <X className="h-[15px] w-[15px] opacity-80" strokeWidth={2.5} />
          </Link>
        </div>

        {/* Eingrenzen innerhalb des Themas */}
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-zinc-300 bg-card px-3.5 py-2.5 focus-within:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900">
          <Search className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2.25} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={label ? `In „${label}" eingrenzen …` : "Eingrenzen …"}
            className="w-full bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Eingrenzung löschen">
              <X className="h-4 w-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" strokeWidth={2.25} />
            </button>
          )}
        </div>

        {/* Trefferzahl */}
        <div className="mb-3 flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> lädt …
            </>
          ) : (
            <span>
              <span className="num font-medium text-zinc-900 dark:text-zinc-100">{data?.total ?? 0}</span>{" "}
              {data?.total === 1 ? "Treffer" : "Treffer"}
              {q.trim().length >= 2 && label ? ` für „${q.trim()}" in ${label}` : ""}
              {" "}· neueste zuerst
            </span>
          )}
        </div>

        {/* Liste */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card dark:border-zinc-800 dark:bg-zinc-900">
          {data && data.items.length > 0 ? (
            data.items.map((h) => <Row key={hitKey(h)} hit={h} terms={terms} />)
          ) : !loading ? (
            <div className="px-4 py-10 text-center text-[14px] text-zinc-400 dark:text-zinc-500">
              Keine Treffer{q.trim().length >= 2 ? " — Eingrenzung lockern?" : ""}.
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-zinc-300 dark:text-zinc-600">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
