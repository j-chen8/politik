"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ParliamentOverview } from "@/lib/db";

/**
 * Parlament-Auswahl im Header — ersetzt das statische „Bundestag"-Tag.
 * Gruppiert nach den drei Ebenen (Bund · Länder · Europa), Coverage-Badge je
 * Eintrag; „In Vorbereitung"-Parlamente sind sichtbar, aber nicht klickbar.
 */

const TIER_BADGE: Record<ParliamentOverview["tier"], { label: string; cls: string }> = {
  voll: { label: "Voll", cls: "text-emerald-700 bg-emerald-50" },
  pilot: { label: "Pilot", cls: "text-blue-700 bg-blue-50" },
  stammdaten: { label: "bald", cls: "text-zinc-400 bg-zinc-100" },
};

/** Ziel je Parlament: dessen Übersichtsseite (Bundestag = die Landing). */
function overviewHref(p: ParliamentOverview): string {
  if (p.type === "bundestag") return "/design/linear";
  if (p.id === 2) return "/design/linear/parlamente/berlin";
  return `/design/linear/politiker?parlament=${p.id}`;
}

function Group({
  label,
  items,
  onPick,
}: {
  label: string;
  items: ParliamentOverview[];
  onPick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-1">
      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </div>
      {items.map((p) => {
        const badge = TIER_BADGE[p.tier];
        const active = p.tier !== "stammdaten";
        const row = (
          <div className="flex items-center justify-between gap-2">
            <span className={active ? "text-zinc-800" : "text-zinc-400"}>{p.label}</span>
            <span
              className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
        );
        return active ? (
          <Link
            key={p.id}
            href={overviewHref(p)}
            role="menuitem"
            onClick={onPick}
            className="block px-3 py-1.5 text-[13px] hover:bg-zinc-50 transition-colors"
          >
            {row}
          </Link>
        ) : (
          <div
            key={p.id}
            className="px-3 py-1.5 text-[13px] cursor-default"
            title="Noch keine Detaildaten — in Vorbereitung"
          >
            {row}
          </div>
        );
      })}
    </div>
  );
}

export function ParliamentSwitcher({ parliaments }: { parliaments: ParliamentOverview[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Nur Parlamente mit echter Abdeckung anzeigen — keine "In Vorbereitung"-
  // Platzhalter (15 Stammdaten-Länder + EU bleiben raus, bis sie Daten haben).
  const active = parliaments.filter((p) => p.tier !== "stammdaten");
  const bund = active.filter((p) => p.type === "bundestag");
  const laender = active
    .filter((p) => p.type === "landtag")
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
  const eu = active.filter((p) => p.type === "eu");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted hover:text-foreground transition-colors"
      >
        Alle Parlamente
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg py-2 z-50"
        >
          <Link
            href="/design/linear/politiker"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[13px] font-medium text-zinc-950 hover:bg-zinc-50 transition-colors"
          >
            Alle Parlamente
          </Link>
          <Group label="Bund" items={bund} onPick={() => setOpen(false)} />
          <Group label="Landesparlamente" items={laender} onPick={() => setOpen(false)} />
          <Group label="Europa" items={eu} onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
