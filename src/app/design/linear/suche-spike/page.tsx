"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";

export default function SucheSpikePage() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-12 fade-in-up">
        {/* Status-Badge */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-800 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Test-Seite — Cmd+K Universal-Suche
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" strokeWidth={2.25} />
            Spike: Cross-Entity-Suche
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 mb-3">
            Eine Suche für alles.
          </h1>
          <p className="text-[15px] text-zinc-500 leading-relaxed max-w-xl">
            Personen, Themen, Reden, Abstimmungen, Drucksachen — in einer Palette. Tastatur-first,
            Linear-/Raycast-Style. Tippe „Asyl", „Stromsteuer" oder einen MdB-Namen.
          </p>
        </div>

        {/* Trigger */}
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl text-left hover:border-zinc-400 transition-colors mb-8 group"
        >
          <Search
            className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 transition-colors"
            strokeWidth={2.25}
          />
          <span className="flex-1 text-[14px] text-zinc-400 group-hover:text-zinc-700 transition-colors">
            Suche öffnen…
          </span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono text-zinc-500 border border-zinc-200 rounded">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        {/* Beispiel-Queries */}
        <div className="mb-12">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Probier mal
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { q: "Asyl", hint: "Reden + Drucksachen" },
              { q: "Stromsteuer", hint: "Abstimmung + TOP" },
              { q: "Bundeswehr", hint: "Reden + Topics" },
              { q: "Klima", hint: "Themen + Personen" },
              { q: "Bürgergeld", hint: "Drucksachen + Reden" },
              { q: "Merz", hint: "Person + Reden" },
            ].map((item) => (
              <button
                key={item.q}
                onClick={() => setOpen(true)}
                className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-left hover:border-zinc-400 transition-colors"
              >
                <div className="text-[13px] font-medium text-zinc-900">{item.q}</div>
                <div className="text-[11px] text-zinc-500">{item.hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Methodik-Hinweis */}
        <div className="border border-zinc-200 rounded-xl p-5 bg-white">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Was passiert hier
          </div>
          <p className="text-[13px] text-zinc-600 leading-relaxed mb-3">
            Volltextsuche über fünf Datenquellen gleichzeitig: Politiker:innen-Namen,
            TOP-Titel, Reden-Zusammenfassungen, Abstimmungs-Bezeichnungen und
            Drucksachen-Titel. Pro Treffer-Typ maximal sechs Treffer, sortiert nach Datum.
          </p>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            <span className="font-medium text-zinc-700">Limitation MVP:</span> Reines
            Schlagwort-Match (LIKE). „Asyl" findet noch nicht „Migration" oder
            „Geflüchtete" — dafür brauchts Topic-Tags oder Embeddings (Roadmap-Phase 2).
          </p>
        </div>
      </div>

      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
