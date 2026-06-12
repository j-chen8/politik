"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { SearchFullList } from "@/components/SearchFullList";
import type { SearchType } from "@/lib/suche";

const TYPES: { key: SearchType; label: string }[] = [
  { key: "drucksachen", label: "Drucksachen" },
  { key: "qa", label: "Fragen & Antworten" },
  { key: "speeches", label: "Reden" },
  { key: "votes", label: "Abstimmungen" },
  { key: "topics", label: "Tagesordnungspunkte" },
  { key: "politicians", label: "Personen" },
];

// Drucksachen-Typen (batch_class) für den Klasse-Filter
const KLASSEN: { key: string; label: string }[] = [
  { key: "", label: "Alle Drucksachen-Typen" },
  { key: "gross", label: "Gesetzentwurf" },
  { key: "klein", label: "Kleine Anfrage" },
  { key: "antwort", label: "Antwort der Bundesregierung" },
  { key: "mittel", label: "Bericht" },
  { key: "regierung", label: "Regierungsvorlage" },
  { key: "administrativ", label: "Verwaltung" },
];

function isType(v: string | null): v is SearchType {
  return TYPES.some((t) => t.key === v);
}

const selectCls =
  "px-2.5 py-1.5 text-[13px] rounded-lg border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400";

function DetailInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const typeParam = sp.get("type");
  const type: SearchType = isType(typeParam) ? typeParam : "drucksachen";
  const sort: "date" | "relevance" = sp.get("sort") === "relevance" ? "relevance" : "date";
  const expand = sp.get("expand") === "1";
  const klasse = sp.get("klasse");
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  // Patcht URL-Params und setzt Seite zurück auf 1.
  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.set("page", "1");
    router.push(`/suche/detail?${next.toString()}`);
  }

  function submitQuery(e: React.FormEvent) {
    e.preventDefault();
    update({ q: input.trim() || null });
  }

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-24 fade-in-up">
        <Link
          href="/suche"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Einfache Suche
        </Link>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950 mb-1">
          Detaillierte Suche
        </h1>
        <p className="text-[13px] text-zinc-500 mb-6">
          Nach Typ filtern, Sortierung wählen, verwandte Begriffe optional einbeziehen.
        </p>

        {/* Suchfeld */}
        <form onSubmit={submitQuery} className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" strokeWidth={2.25} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Suchbegriff…"
            className="w-full pl-10 pr-24 py-3 rounded-xl border border-zinc-200 bg-white text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-[13px] font-semibold hover:bg-zinc-800 transition-colors"
          >
            Suchen
          </button>
        </form>

        {/* Regler */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8 text-[12px]">
          <label className="flex items-center gap-1.5">
            <span className="text-zinc-500">Typ</span>
            <select
              className={selectCls}
              value={type}
              onChange={(e) => update({ type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-zinc-500">Sortieren</span>
            <select
              className={selectCls}
              value={sort}
              onChange={(e) => update({ sort: e.target.value === "relevance" ? "relevance" : null })}
            >
              <option value="date">Neueste zuerst</option>
              <option value="relevance">Relevanz</option>
            </select>
          </label>

          {type === "drucksachen" && (
            <label className="flex items-center gap-1.5">
              <span className="text-zinc-500">Drucksachen-Typ</span>
              <select
                className={selectCls}
                value={klasse ?? ""}
                onChange={(e) => update({ klasse: e.target.value || null })}
              >
                {KLASSEN.map((k) => (
                  <option key={k.key} value={k.key}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={expand}
              onChange={(e) => update({ expand: e.target.checked ? "1" : null })}
              className="accent-zinc-900"
            />
            <span className="text-zinc-600">verwandte Begriffe einbeziehen</span>
          </label>
        </div>

        {/* Ergebnisse */}
        {q.trim().length >= 2 ? (
          <SearchFullList query={q} type={type} page={page} expand={expand} sort={sort} klasse={klasse} embedded />
        ) : (
          <div className="py-16 text-center text-[13px] text-zinc-400">
            Gib einen Suchbegriff ein, um zu starten.
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailSuchePage() {
  return (
    <Suspense fallback={null}>
      <DetailInner />
    </Suspense>
  );
}
