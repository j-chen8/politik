"use client";

/**
 * Berlin-Suche — gespiegelt zur Bundestag-/suche-Seite, nur scope="berlin".
 * Live-Modal (CommandPalette) + Vollliste (SearchFullList) ziehen Berlin-Daten
 * (Reden/Drucksachen/Personen) über /api/suche?scope=berlin.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search, CornerDownRight } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { SearchFullList } from "@/components/SearchFullList";
import type { BerlinSearchType, SearchType } from "@/lib/suche";

const VALID_TYPES: BerlinSearchType[] = ["speeches", "drucksachen", "politicians"];

const BEISPIELE: { q: string; hint: string }[] = [
  { q: "Klima", hint: "auch Energiewende · CO₂" },
  { q: "Wohnen", hint: "auch Mieten · Wohnungsbau" },
  { q: "Verkehr", hint: "auch ÖPNV · Radwege" },
  { q: "Schule", hint: "auch Bildung · Kita" },
  { q: "Verwaltung", hint: "auch Bürgeramt · Digitalisierung" },
  { q: "Wegner", hint: "Person + Reden" },
];

function BerlinSuchePageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const typeParam = searchParams.get("type");
  const pageParam = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const expandParam = searchParams.get("expand") === "1";
  const isFullListMode =
    typeParam !== null &&
    (VALID_TYPES as string[]).includes(typeParam) &&
    initialQuery.trim().length >= 2;

  const [open, setOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState<string>("");

  // ?q=... in URL (ohne ?type) → Palette gleich öffnen mit Prefill
  useEffect(() => {
    if (!isFullListMode && initialQuery.trim().length >= 2) {
      setPaletteQuery(initialQuery);
      setOpen(true);
    }
  }, [initialQuery, isFullListMode]);

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

  // Vollliste-Mode: ?q=...&type=... → eigene Page-View statt Hero
  if (isFullListMode) {
    return (
      <SearchFullList
        query={initialQuery}
        type={typeParam as SearchType}
        page={pageParam}
        expand={expandParam}
        scope="berlin"
      />
    );
  }

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-24 pb-24 fade-in-up">
        <Link
          href="/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zum Abgeordnetenhaus
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50 mb-3">
            Eine Suche für alles.
          </h1>
          <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
            Personen, Reden, Drucksachen und Fragen &amp; Antworten des Abgeordnetenhauses von Berlin — in einer Palette.
            Standardmäßig wird exakt gesucht; verwandte Begriffe lassen sich auf Wunsch einbeziehen
            („Wohnen" → auch Mieten und Wohnungsbau).
          </p>
        </div>

        <button
          onClick={() => openWith("")}
          className="w-full flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-left hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors mb-4 group"
        >
          <Search
            className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors"
            strokeWidth={2.25}
          />
          <span className="flex-1 text-[14px] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
            Suche öffnen…
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 border border-border rounded">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        <Link
          href="/parlamente/berlin/suche/detail"
          className="inline-flex items-center gap-2 ml-1 text-[14px] font-medium text-blue-700 dark:text-blue-400 hover:underline underline-offset-4 decoration-blue-700/40 dark:decoration-blue-400/40 mb-8"
        >
          <CornerDownRight className="w-4 h-4 shrink-0 -mt-1 text-blue-700/70 dark:text-blue-400/70" strokeWidth={2.25} />
          Detaillierte Suche — nach Typ filtern, sortieren, eingrenzen
        </Link>

        <div className="mb-12">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Probier mal
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BEISPIELE.map((item) => (
              <button
                key={item.q}
                onClick={() => openWith(item.q)}
                className="px-3 py-2 bg-card border border-border rounded-lg text-left hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{item.q}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-xl p-5 bg-card">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Was passiert hier
          </div>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
            Volltextsuche über drei Berliner Datenquellen gleichzeitig: Abgeordneten-Namen,
            Reden-Zusammenfassungen und Drucksachen-Titel. Nach Typ filterbar; Treffer mit dem
            Original-Begriff zuerst.
          </p>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Exakt zuerst, Synonyme optional:</span>{" "}
            standardmäßig wird genau der eingegebene Begriff gesucht. Auf Wunsch lassen sich
            Themen-Cluster (Migration, Klima &amp; Energie, Wohnen, …) als verwandte Begriffe
            einbeziehen — sichtbar über den „Verwandte Themen einbeziehen"-Schalter.
          </p>
        </div>
      </div>

      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        initialQuery={paletteQuery}
        scope="berlin"
      />
    </div>
  );
}

export default function BerlinSuchePage() {
  return (
    <Suspense fallback={null}>
      <BerlinSuchePageInner />
    </Suspense>
  );
}
