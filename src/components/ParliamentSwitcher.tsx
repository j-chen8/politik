"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
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
  if (p.type === "bundestag") return "/";
  if (p.id === 2) return "/parlamente/berlin";
  return `/politiker?parlament=${p.id}`;
}

function Group({
  label,
  items,
  activeId,
  onPick,
}: {
  label: string;
  items: ParliamentOverview[];
  activeId: number;
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
        const clickable = p.tier !== "stammdaten";
        const isCurrent = p.id === activeId;
        const row = (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 flex justify-center shrink-0">
                {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />}
              </span>
              <span className={clickable ? (isCurrent ? "text-zinc-950 font-semibold" : "text-zinc-800") : "text-zinc-400"}>
                {p.label}
              </span>
            </span>
            <span
              className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
        );
        return clickable ? (
          <Link
            key={p.id}
            href={overviewHref(p)}
            role="menuitem"
            onClick={onPick}
            className={`block px-3 py-1.5 text-[13px] transition-colors ${isCurrent ? "bg-zinc-50" : "hover:bg-zinc-50"}`}
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
  const pathname = usePathname() || "/";
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

  // Aktuelles Parlament aus dem Pfad — Default Bundestag, Berlin unter /parlamente/berlin.
  const isBerlin = pathname.startsWith("/parlamente/berlin");
  const current = (isBerlin ? active.find((p) => p.id === 2) : undefined) ?? bund[0];
  const currentLabel = current?.label ?? "Bundestag";
  const currentId = current?.id ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted hover:text-foreground transition-colors"
      >
        {currentLabel}
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
          <Group label="Bund" items={bund} activeId={currentId} onPick={() => setOpen(false)} />
          <Group label="Landesparlamente" items={laender} activeId={currentId} onPick={() => setOpen(false)} />
          <Group label="Europa" items={eu} activeId={currentId} onPick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
