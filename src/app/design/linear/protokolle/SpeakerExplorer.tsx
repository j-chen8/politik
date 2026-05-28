"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export type Speaker = {
  speaker: string;
  fraktion: string | null;
  total: number;
  byTyp: Record<string, number>;
};

type Sort = "count_desc" | "count_asc";

const SORT_LABEL: Record<Sort, string> = {
  count_desc: "Meiste zuerst",
  count_asc: "Wenigste zuerst",
};

const TYP_ORDER = ["reden", "regierungserklaerungen", "antworten", "fragen", "debattenbeitraege", "erklaerungen"] as const;
type Typ = (typeof TYP_ORDER)[number];

const TYP_LABEL: Record<Typ, string> = {
  reden: "Reden",
  regierungserklaerungen: "Regierungserklärungen",
  antworten: "Antworten",
  fragen: "Fragen",
  debattenbeitraege: "Debattenbeiträge",
  erklaerungen: "Erklärungen",
};

const PARTY_SHORT: Record<string, string> = {
  "CDU/CSU": "CDU/CSU",
  AfD: "AfD",
  SPD: "SPD",
  "Die Linke": "Linke",
  "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
  fraktionslos: "fraktionslos",
};

const PARTY_COLOR: Record<string, { dot: string; tints: string[] }> = {
  "CDU/CSU": { dot: "bg-zinc-900", tints: ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"] },
  SPD: { dot: "bg-red-600", tints: ["#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"] },
  AfD: { dot: "bg-sky-700", tints: ["#0369a1", "#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"] },
  "BÜNDNIS 90/DIE GRÜNEN": { dot: "bg-green-600", tints: ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"] },
  "Die Linke": { dot: "bg-pink-600", tints: ["#be185d", "#db2777", "#ec4899", "#f472b6", "#f9a8d4", "#fbcfe8"] },
  fraktionslos: { dot: "bg-zinc-400", tints: ["#52525b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7", "#f4f4f5"] },
};

function shortPartyName(raw: string | null | undefined): string {
  if (!raw) return "—";
  const cleaned = raw.replace(/ /g, " ").replace(/­/g, "").trim();
  return PARTY_SHORT[cleaned] || cleaned;
}

const PAGE_SIZE_STEP = 50;

export function SpeakerExplorer({ speakers, totalAnalyzed }: { speakers: Speaker[]; totalAnalyzed: number }) {
  const router = useRouter();
  const [sort, setSort] = useState<Sort>("count_desc");
  const [enabledTyps, setEnabledTyps] = useState<Set<Typ>>(() => new Set(TYP_ORDER));
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);

  const view = useMemo(() => {
    const enabled = TYP_ORDER.filter((t) => enabledTyps.has(t));
    const q = query.trim().toLowerCase();
    const list = speakers
      .map((s) => {
        const filteredTotal = enabled.reduce((sum, t) => sum + (s.byTyp[t] || 0), 0);
        return { ...s, filteredTotal };
      })
      // 0-Beiträge werden behalten — Transparenz wer (noch) nicht gesprochen hat.
      // Filter greifen nur bei Suche oder wenn ALLE Typen aktiv sind UND s.total>0
      // gehört, damit „Wenigste zuerst" tatsächlich die Stillen zeigt.
      .filter((s) => !q || s.speaker.toLowerCase().includes(q));

    list.sort((a, b) => {
      switch (sort) {
        case "count_desc": return b.filteredTotal - a.filteredTotal;
        case "count_asc": return a.filteredTotal - b.filteredTotal;
      }
    });
    return list;
  }, [speakers, sort, enabledTyps, query]);

  const max = view[0]?.filteredTotal || 1;
  const allTypsActive = enabledTyps.size === TYP_ORDER.length;
  const visibleSpeakers = view.slice(0, pageSize);
  const hasMore = view.length > pageSize;

  function toggleTyp(t: Typ) {
    setEnabledTyps((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      // Don't allow zero typs — at least one must be active
      if (next.size === 0) return prev;
      return next;
    });
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Aktivste im Plenum
        </h2>
        <span className="text-[11px] text-zinc-400">
          Basis: {totalAnalyzed.toLocaleString("de-DE")} KI-analysierte Beiträge · {speakers.length} Sprecher
        </span>
      </div>

      {/* Filter row: Typ-Toggles */}
      <div className="mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10.5px] text-zinc-500 uppercase tracking-wider font-medium">
            Zähle:
          </span>
          {TYP_ORDER.map((t) => {
            const active = enabledTyps.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTyp(t)}
                aria-pressed={active}
                className={
                  "text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors " +
                  (active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 line-through")
                }
              >
                {TYP_LABEL[t]}
              </button>
            );
          })}
        </div>
        {!allTypsActive && (
          <p className="text-[10.5px] text-amber-700 mt-2">
            ⚠ Ranking ist gefiltert — Counts und Reihenfolge zählen nur die aktiven Typen.
          </p>
        )}
      </div>

      {/* Sort + Suche */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] text-zinc-500 uppercase tracking-wider font-medium">
            Sortieren:
          </span>
          {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={
                "text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors " +
                (sort === s
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200")
              }
            >
              {SORT_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2.25} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && view.length > 0) {
                router.push(`/design/linear/protokolle/redner/${encodeURIComponent(view[0].speaker)}`);
              }
            }}
            placeholder="Sprecher suchen — Enter springt zum ersten Treffer"
            className="w-full text-[12px] pl-8 pr-7 py-1.5 rounded-md border border-zinc-200 bg-white placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Suche löschen"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-700" strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>

      {/* Speakers list, scrollable */}
      <div className="max-h-[680px] overflow-y-auto pr-1 space-y-1">
        {view.length === 0 && (
          <p className="text-[12px] text-zinc-500 py-4 px-1">
            Keine Treffer für „{query}".
          </p>
        )}
        {visibleSpeakers.map((s, i) => {
          const colors = (s.fraktion && PARTY_COLOR[s.fraktion]) || PARTY_COLOR["fraktionslos"];
          const isSilent = s.filteredTotal === 0;
          const widthPct = isSilent ? 0 : Math.max((s.filteredTotal / max) * 100, 4);
          return (
            <Link
              key={s.speaker}
              href={`/design/linear/protokolle/redner/${encodeURIComponent(s.speaker)}`}
              className={`grid grid-cols-[1.75rem_minmax(11rem,15rem)_1fr_2.75rem] items-center gap-3 hover:bg-zinc-50 rounded-md py-1 px-1 group transition-colors ${isSilent ? "opacity-60" : ""}`}
              title={isSilent ? "Bisher keine Plenarbeiträge in unseren Daten" : undefined}
            >
              <span className="num text-right text-[12px] font-medium text-zinc-400">
                {i + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                <span
                  className={`text-[13px] font-medium group-hover:underline truncate ${isSilent ? "text-zinc-600" : "text-zinc-950"}`}
                  title={s.speaker}
                >
                  {s.speaker}
                </span>
                {s.fraktion && (
                  <span className="text-[10.5px] text-zinc-500 shrink-0 uppercase tracking-wider font-medium">
                    {shortPartyName(s.fraktion)}
                  </span>
                )}
              </div>
              <div className="h-5 bg-zinc-50 rounded-md overflow-hidden">
                {!isSilent && (
                  <div
                    className="h-full flex transition-[width] duration-200"
                    style={{ width: `${widthPct}%` }}
                  >
                    {TYP_ORDER.map((slug, ti) => {
                      if (!enabledTyps.has(slug)) return null;
                      const v = s.byTyp[slug] || 0;
                      if (!v) return null;
                      const pct = (v / s.filteredTotal) * 100;
                      return (
                        <div
                          key={slug}
                          className="h-full"
                          style={{ width: `${pct}%`, background: colors.tints[ti] }}
                          title={`${TYP_LABEL[slug]}: ${v.toLocaleString("de-DE")}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <span className={`num text-[13px] font-semibold text-right ${isSilent ? "text-zinc-400" : "text-zinc-950"}`}>
                {isSilent ? "—" : s.filteredTotal.toLocaleString("de-DE")}
              </span>
            </Link>
          );
        })}
        {hasMore && (
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPageSize((p) => p + PAGE_SIZE_STEP)}
              className="inline-flex items-center gap-1 text-[12.5px] text-zinc-600 hover:text-zinc-950 transition-colors px-1"
            >
              Weitere {Math.min(PAGE_SIZE_STEP, view.length - pageSize)} anzeigen
            </button>
            <button
              type="button"
              onClick={() => setPageSize(view.length)}
              className="text-[11.5px] text-zinc-400 hover:text-zinc-700 transition-colors px-1"
            >
              Alle {view.length} laden
            </button>
          </div>
        )}
      </div>

      <p className="text-[10.5px] text-zinc-400 mt-3">
        Reihenfolge der Bar-Segmente (dunkel → hell):{" "}
        {TYP_ORDER.map((slug, i) => (
          <span key={slug}>
            {i > 0 && " · "}
            <span className={enabledTyps.has(slug) ? "text-zinc-700 font-medium" : "text-zinc-400 line-through"}>
              {TYP_LABEL[slug]}
            </span>
          </span>
        ))}
        . Hover für Detail.
      </p>
    </>
  );
}
