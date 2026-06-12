"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, CornerDownRight } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { SearchFullList } from "@/components/SearchFullList";
import { SearchThemaList } from "@/components/SearchThemaList";
import type { SearchType } from "@/lib/suche";

const VALID_TYPES: SearchType[] = ["politicians", "speeches", "topics", "votes", "drucksachen", "qa"];

const BEISPIELE: { q: string; hint: string }[] = [
  { q: "Asyl", hint: "auch Migration · Geflüchtete" },
  { q: "Klima", hint: "auch Energiewende · CO₂" },
  { q: "Bürgergeld", hint: "auch Sozialleistungen" },
  { q: "Bundeswehr", hint: "auch Verteidigung · Wehrdienst" },
  { q: "Wohnen", hint: "auch Mieten · Wohnungsbau" },
  { q: "Merz", hint: "Person + Reden" },
];

function SuchePageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const themaParam = searchParams.get("thema");
  const typeParam = searchParams.get("type");
  const pageParam = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const expandParam = searchParams.get("expand") === "1";
  const isFullListMode =
    typeParam !== null &&
    (VALID_TYPES as string[]).includes(typeParam) &&
    initialQuery.trim().length >= 2;

  const [open, setOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState<string>("");

  // Smarte PLZ-Erkennung: reine 5-stellige PLZ → direkt zum Wahlkreis-Finder (Bundestag).
  // Fängt No-JS-Form-Fallback + Direktlinks /suche?q=10115 ab.
  const router = useRouter();
  const plzMatch = initialQuery.trim().match(/^\d{5}$/)?.[0] ?? null;
  useEffect(() => {
    if (plzMatch) router.replace(`/wahlkreis?plz=${plzMatch}`);
  }, [plzMatch, router]);

  // ?q=... in URL (ohne ?type) → Palette gleich öffnen mit Prefill (außer bei PLZ → Redirect)
  useEffect(() => {
    if (!plzMatch && !isFullListMode && initialQuery.trim().length >= 2) {
      setPaletteQuery(initialQuery);
      setOpen(true);
    }
  }, [initialQuery, isFullListMode, plzMatch]);

  // Cmd+K / Ctrl+K Shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setPaletteQuery("");
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function openWith(q: string) {
    setPaletteQuery(q);
    setOpen(true);
  }

  // Themen-Facette: ?thema=<slug> → gemischte Treffer eines Citizen-Topics
  if (themaParam) {
    return <SearchThemaList slug={themaParam} initialQuery={initialQuery} />;
  }

  // Vollliste-Mode: ?q=...&type=... → eigene Page-View statt Hero
  if (isFullListMode) {
    return (
      <SearchFullList
        query={initialQuery}
        type={typeParam as SearchType}
        page={pageParam}
        expand={expandParam}
      />
    );
  }

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-24 fade-in-up">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 mb-3">
            Eine Suche für alles.
          </h1>
          <p className="text-[15px] text-zinc-500 leading-relaxed max-w-xl">
            Personen, Themen, Reden, Abstimmungen, Drucksachen — in einer Palette. Standardmäßig
            wird exakt gesucht; verwandte Begriffe lassen sich auf Wunsch einbeziehen („Asyl" →
            auch Migration und Geflüchtete).
          </p>
        </div>

        <button
          onClick={() => openWith("")}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-left hover:border-zinc-400 transition-colors mb-4 group"
        >
          <Search
            className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 transition-colors"
            strokeWidth={2.25}
          />
          <span className="flex-1 text-[14px] text-zinc-400 group-hover:text-zinc-700 transition-colors">
            Suche öffnen…
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono text-zinc-500 border border-zinc-200 rounded">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        <Link
          href="/suche/detail"
          className="inline-flex items-center gap-2 ml-1 text-[14px] font-medium text-[#1a3e72] hover:underline underline-offset-4 decoration-[#1a3e72]/40 mb-8"
        >
          <CornerDownRight className="w-4 h-4 shrink-0 -mt-1 text-[#1a3e72]/70" strokeWidth={2.25} />
          Detaillierte Suche — nach Typ filtern, sortieren, eingrenzen
        </Link>

        <div className="mb-12">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Probier mal
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BEISPIELE.map((item) => (
              <button
                key={item.q}
                onClick={() => openWith(item.q)}
                className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-left hover:border-zinc-400 transition-colors"
              >
                <div className="text-[13px] font-medium text-zinc-900">{item.q}</div>
                <div className="text-[11px] text-zinc-500">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-zinc-200 rounded-xl p-5 bg-white">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Was passiert hier
          </div>
          <p className="text-[13px] text-zinc-600 leading-relaxed mb-3">
            Volltextsuche über fünf Datenquellen gleichzeitig: Politiker:innen-Namen, TOP-Titel,
            Reden-Zusammenfassungen, Abstimmungs-Bezeichnungen und Drucksachen-Titel. Nach Typ
            filterbar; Treffer mit dem Original-Begriff zuerst.
          </p>
          <p className="text-[13px] text-zinc-600 leading-relaxed">
            <span className="font-medium text-zinc-700">Exakt zuerst, Synonyme optional:</span>{" "}
            standardmäßig wird genau der eingegebene Begriff gesucht. Auf Wunsch lassen sich 40
            Themen-Cluster (Migration, Klima &amp; Energie, Innere Sicherheit, …) als verwandte
            Begriffe einbeziehen — sichtbar über den „Verwandte Themen einbeziehen"-Schalter.
          </p>
        </div>
      </div>

      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        initialQuery={paletteQuery}
      />
    </div>
  );
}

export default function SuchePage() {
  return (
    <Suspense fallback={null}>
      <SuchePageInner />
    </Suspense>
  );
}
