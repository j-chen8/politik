"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { highlight } from "@/lib/highlight";
import type {
  SearchByTypeResult,
  SearchHit,
  SearchType,
  PoliticianHit,
  SpeechHit,
  TopicHit,
  VoteHit,
  DrucksacheHit,
  QaHit,
} from "@/lib/suche";

type SearchScope = "bundestag" | "berlin";

const TYPE_LABELS: Record<SearchType, string> = {
  politicians: "Personen",
  topics: "Tagesordnungspunkte",
  speeches: "Reden",
  votes: "Abstimmungen",
  drucksachen: "Drucksachen",
  qa: "Fragen & Antworten",
};

const PARTY_DOT: Record<string, string> = {
  "CDU/CSU": "bg-zinc-800",
  SPD: "bg-rose-500",
  AfD: "bg-sky-600",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-emerald-600",
  "Die Linke": "bg-fuchsia-600",
  fraktionslos: "bg-zinc-400",
};

const PAGE_SIZE = 50;

const dsKlasseShort: Record<string, string> = {
  klein: "Kl. Anfrage",
  mittel: "Bericht",
  gross: "Gesetzentwurf",
  antwort: "BReg-Antwort",
  regierung: "Reg.-Vorlage",
  administrativ: "Verwaltung",
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

interface Props {
  query: string;
  type: SearchType;
  page: number;
  expand: boolean;
  /** Sortierung (nur Detail-Suche; Palette-Vollliste nutzt Default „date"). */
  sort?: "date" | "relevance";
  /** Drucksachen-Typ-Filter (nur Detail-Suche), z.B. „gross" für Gesetzentwürfe. */
  klasse?: string | null;
  /** In Detail-Suche eingebettet → eigenen „Zurück"-Button ausblenden (Seite hat eigene Navigation). */
  embedded?: boolean;
  /** Daten-/Routing-Scope. "berlin" → Berlin-API + Berlin-Detail-Links. */
  scope?: SearchScope;
}

export function SearchFullList({ query, type, page, expand, sort = "date", klasse = null, embedded = false, scope = "bundestag" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() || "/suche";
  const apiScope = scope === "berlin" ? "&scope=berlin" : "";
  const backPath = scope === "berlin" ? "/parlamente/berlin/suche" : "/suche";
  const [data, setData] = useState<SearchByTypeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const klasseParam = klasse ? `&klasse=${encodeURIComponent(klasse)}` : "";
    fetch(
      `/api/suche?q=${encodeURIComponent(query)}&type=${type}&page=${page}&pageSize=${PAGE_SIZE}&expand=${expand ? 1 : 0}&sort=${sort}${klasseParam}${apiScope}`
    )
      .then((r) => r.json())
      .then((d: SearchByTypeResult) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message ?? "Fehler beim Laden");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, type, page, expand, sort, klasse]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  }, [data]);

  function gotoPage(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`${pathname}?${next.toString()}`);
  }

  function backToModal() {
    // Immer zurück zur einfachen Suche (Palette), egal ob von Vollliste oder Detail-Suche.
    router.push(`${backPath}?q=${encodeURIComponent(query)}`);
  }

  function toggleExpand(on: boolean) {
    const next = new URLSearchParams(searchParams.toString());
    if (on) next.set("expand", "1");
    else next.delete("expand");
    next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  }

  const typeLabel = TYPE_LABELS[type];

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8 fade-in-up">
        {/* Breadcrumb + Back (in Detail-Suche ausgeblendet — Seite hat eigene Navigation) */}
        {!embedded && (
          <button
            onClick={backToModal}
            className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
            Zurück zur Suche
          </button>
        )}

        {/* Header */}
        <div className="mb-8 flex items-baseline justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              {typeLabel} · „{query}"
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950">
              {loading && !data ? (
                <span className="text-zinc-400">…</span>
              ) : (
                <>
                  <span className="tabular-nums">{data?.total ?? 0}</span>{" "}
                  <span className="text-zinc-500 font-normal">
                    {(data?.total ?? 0) === 1 ? "Treffer" : "Treffer"}
                  </span>
                </>
              )}
            </h1>
          </div>
          {data && data.total > 0 && (
            <div className="text-[12px] text-zinc-500 tabular-nums">
              Seite {data.page} / {totalPages}
            </div>
          )}
        </div>

        {/* Exakt-Default vs. Erweitern */}
        {data && data.matchedClusters.length > 0 && (
          <div className="mb-6 p-3 rounded-lg border border-zinc-200 bg-zinc-50/60 text-[12px] text-zinc-500">
            {data.expand ? (
              <>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="text-zinc-400">verwandte Begriffe mitgesucht:</span>
                  {data.expansions.map((term) => (
                    <span
                      key={term}
                      className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-600"
                    >
                      {term}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-zinc-400 leading-snug">
                  <span>
                    direkt „{data.query}": <span className="tabular-nums">{data.totalOriginal}</span>{" "}
                    · via Synonymen{" "}
                    <span className="tabular-nums">{Math.max(0, data.total - data.totalOriginal)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(false)}
                    className="shrink-0 text-zinc-600 hover:text-zinc-950 underline underline-offset-2"
                  >
                    nur exakte Treffer
                  </button>
                </div>
              </>
            ) : data.totalExpanded > data.totalOriginal ? (
              <button
                type="button"
                onClick={() => toggleExpand(true)}
                className="w-full flex items-center gap-2 text-left text-zinc-600 hover:text-zinc-950 transition-colors"
                title="Verwandte Themen über Synonym-Cluster einbeziehen"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                <span>
                  Verwandte Themen einbeziehen{" "}
                  <span className="text-zinc-400">({data.matchedClusters.join(", ")})</span> —{" "}
                  <span className="tabular-nums font-medium text-zinc-900">
                    +{data.totalExpanded - data.totalOriginal}
                  </span>{" "}
                  Treffer
                </span>
              </button>
            ) : null}
          </div>
        )}

        {/* Loading / Error / Empty */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {error && (
          <div className="py-12 text-center text-[13px] text-rose-600">{error}</div>
        )}
        {data && data.total === 0 && !loading && (
          <div className="py-12 text-center text-[13px] text-zinc-400">
            Keine {typeLabel.toLowerCase()} für „{query}" gefunden.
          </div>
        )}

        {/* Result-List */}
        {data && data.items.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {data.items.map((hit, i) => (
              <ResultRow
                key={`${hit.type}-${i}`}
                hit={hit}
                terms={[data.query, ...(data.expand ? data.expansions : [])]}
                scope={scope}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => gotoPage(Math.max(1, data.page - 1))}
              disabled={data.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] text-zinc-700 hover:text-zinc-950 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
              Zurück
            </button>
            <PageNumbers
              current={data.page}
              total={totalPages}
              onClick={gotoPage}
            />
            <button
              onClick={() => gotoPage(Math.min(totalPages, data.page + 1))}
              disabled={data.page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[13px] text-zinc-700 hover:text-zinc-950 disabled:text-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              Weiter
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PageNumbers({
  current,
  total,
  onClick,
}: {
  current: number;
  total: number;
  onClick: (p: number) => void;
}) {
  // Zeigt: 1 … current-1 [current] current+1 … total
  const pages: (number | "…")[] = [];
  const add = (p: number) => pages.push(p);
  const dot = () => {
    if (pages[pages.length - 1] !== "…") pages.push("…");
  };

  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) {
      add(p);
    } else {
      dot();
    }
  }

  return (
    <div className="flex items-center gap-0.5 tabular-nums">
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={i} className="px-1.5 text-zinc-300 text-[12px]">
            …
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onClick(p)}
            className={`min-w-[28px] px-2 py-1 text-[12.5px] rounded ${
              p === current
                ? "bg-zinc-900 text-white font-medium"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}

function ResultRow({ hit, terms, scope }: { hit: SearchHit; terms: string[]; scope: SearchScope }) {
  switch (hit.type) {
    case "politician":
      return <PoliticianFullRow hit={hit} terms={terms} />;
    case "topic":
      return <TopicFullRow hit={hit} terms={terms} />;
    case "speech":
      return <SpeechFullRow hit={hit} terms={terms} scope={scope} />;
    case "vote":
      return <VoteFullRow hit={hit} terms={terms} />;
    case "drucksache":
      return <DrucksacheFullRow hit={hit} terms={terms} scope={scope} />;
    case "qa":
      return <QaFullRow hit={hit} terms={terms} />;
  }
}

function PoliticianFullRow({ hit, terms }: { hit: PoliticianHit; terms: string[] }) {
  return (
    <Link
      href={`/politiker/${hit.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      <PoliticianAvatar
        photoUrl={hit.photo_url}
        firstName={hit.first_name}
        lastName={hit.last_name}
        party={hit.party}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] text-zinc-900 truncate">{highlight(hit.name, terms)}</div>
        {hit.subtitle && (
          <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 truncate">
            {hit.party && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  PARTY_DOT[hit.party] ?? "bg-zinc-300"
                }`}
              />
            )}
            <span className="truncate">{hit.subtitle}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function TopicFullRow({ hit, terms }: { hit: TopicHit; terms: string[] }) {
  return (
    <Link
      href={`/protokolle/top/${hit.topic_id}`}
      className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="text-[14px] text-zinc-900 leading-snug">{highlight(hit.title, terms)}</div>
      <div className="text-[12px] text-zinc-500 mt-0.5">
        TOP {hit.topic_number} · {hit.speech_count} Reden
        {hit.session_date && ` · ${formatGermanDate(hit.session_date)}`}
      </div>
    </Link>
  );
}

function SpeechFullRow({ hit, terms, scope }: { hit: SpeechHit; terms: string[]; scope: SearchScope }) {
  const ton = formatTonalitaet(hit.tonalitaet);
  // Berlin hat keine Redner-Seite → auf die Sitzungs-Seite routen.
  const href =
    scope === "berlin"
      ? hit.detail_url ?? "#"
      : `/protokolle/redner/${encodeURIComponent(hit.speaker)}`;
  return (
    <Link
      href={href}
      className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 text-[14px] text-zinc-900 leading-snug">
          {highlight(hit.snippet, terms)}
        </div>
        {ton && (
          <span
            className="shrink-0 px-1.5 py-0.5 text-[10.5px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded"
            title="Tonalität — KI-eingeschätzt"
          >
            {ton}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mt-1">
        {hit.party && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              PARTY_DOT[hit.party] ?? "bg-zinc-300"
            }`}
          />
        )}
        <span>
          {hit.speaker}
          {hit.speech_date && ` · ${formatGermanDate(hit.speech_date)}`}
        </span>
      </div>
    </Link>
  );
}

function VoteFullRow({ hit, terms }: { hit: VoteHit; terms: string[] }) {
  return (
    <Link
      href={`/abstimmungen/${hit.poll_id}`}
      className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="text-[14px] text-zinc-900 leading-snug">{highlight(hit.label, terms)}</div>
      {hit.poll_date && (
        <div className="text-[12px] text-zinc-500 mt-0.5">
          Abstimmung · {formatGermanDate(hit.poll_date)}
        </div>
      )}
    </Link>
  );
}

function DrucksacheFullRow({ hit, terms, scope }: { hit: DrucksacheHit; terms: string[]; scope: SearchScope }) {
  const klasseLabel = hit.batch_class
    ? dsKlasseShort[hit.batch_class] ?? hit.batch_class
    : "Drucksache";
  const href =
    scope === "berlin"
      ? hit.detail_url ?? "#"
      : hit.drucksache_nr
      ? `/aktivitaeten/${hit.drucksache_nr.replace("/", "-")}`
      : "/protokolle";
  return (
    <Link
      href={href}
      className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="text-[14px] text-zinc-900 leading-snug font-medium">{highlight(hit.title, terms)}</div>
      {hit.snippet && (
        <div className="text-[12px] text-zinc-600 line-clamp-2 leading-snug mt-0.5">
          {highlight(hit.snippet, terms)}
        </div>
      )}
      <div className="text-[12px] text-zinc-500 mt-0.5">
        {klasseLabel}
        {hit.drucksache_nr && ` · ${hit.drucksache_nr}`}
        {hit.date && ` · ${formatGermanDate(hit.date)}`}
      </div>
    </Link>
  );
}

function QaFullRow({ hit, terms }: { hit: QaHit; terms: string[] }) {
  return (
    <Link
      href={hit.detail_url ?? `/aktivitaeten/${hit.drucksache_nr.replace("/", "-")}`}
      className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      {hit.frage && (
        <div className="text-[14px] text-zinc-900 leading-snug font-medium">{highlight(hit.frage, terms)}</div>
      )}
      {hit.antwort_snippet && (
        <div className="text-[12px] text-zinc-600 line-clamp-2 leading-snug mt-0.5">
          <span className="text-zinc-400">↳ </span>{highlight(hit.antwort_snippet, terms)}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 mt-1">
        {hit.fragesteller_party && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${PARTY_DOT[hit.fragesteller_party] ?? "bg-zinc-300"}`}
          />
        )}
        <span>
          {hit.parliament === "berlin" ? "Schriftliche Anfrage" : "Schriftliche Frage"}
          {hit.fragesteller_name && ` · ${hit.fragesteller_name}`}
          {` · ${hit.drucksache_nr}`}
          {hit.date && ` · ${formatGermanDate(hit.date)}`}
        </span>
      </div>
    </Link>
  );
}
