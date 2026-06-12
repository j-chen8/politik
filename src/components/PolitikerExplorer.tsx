"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { partyColor } from "@/lib/party-colors";

export type ExplorerPolitician = {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  party: string | null;
  photoUrl: string | null;
  constituency: string | null;
};

/** Wie viele Kacheln pro „Nachlade"-Schritt beim Runterscrollen. */
const PAGE_SIZE = 60;

/** Lange Partei-Namen für die Anzeige kürzen (Wert bleibt unverändert). */
function shortParty(label: string): string {
  if (/grün/i.test(label)) return "Grüne";
  return label;
}

export function PolitikerExplorer({
  politicians,
  initialParty = null,
}: {
  politicians: ExplorerPolitician[];
  /** Vorausgewählter Partei-Filter (Deep-Link von der Startseite: /politiker?partei=spd). */
  initialParty?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [activeParty, setActiveParty] = useState<string | null>(initialParty);

  // Partei-Verteilung — speist Balken + Filter-Chips
  const parties = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of politicians) {
      const key = p.party || "parteilos";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [politicians]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return politicians.filter((p) => {
      if (activeParty && (p.party || "parteilos") !== activeParty) return false;
      if (q && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [politicians, search, activeParty]);

  const total = politicians.length;

  // Infinite Scroll — erst PAGE_SIZE Kacheln, beim Runterscrollen mehr.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Filter oder Suche geändert → Nachlade-Zähler zurücksetzen + nach oben.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    window.scrollTo(0, 0);
  }, [search, activeParty]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Sentinel kommt in Sicht → nächsten Schwung nachladen.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE_SIZE);
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <div className="mb-5">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-1">
            Politiker
          </h1>
          <p className="text-[13px] text-zinc-500">
            <span className="num font-medium text-zinc-950">{filtered.length}</span>
            {filtered.length !== total && (
              <>
                {" "}von <span className="num">{total}</span>
              </>
            )}{" "}
            Politiker:innen
          </p>
          <p className="mt-1.5 text-[11.5px] text-zinc-400">
            Datenstand: 21. Wahlperiode (ab 31.03.2025) — Aktivitäten, Reden, Lebensläufe und Mediathek-Auftritte aggregieren ausschließlich diese Periode. Mehr in der <a href="/methodik" className="underline decoration-zinc-300 hover:decoration-zinc-700 hover:text-zinc-600 transition-colors">Methodik</a>.
          </p>
        </div>

        {/* Sticky-Suche */}
        <div className="sticky top-14 z-20 -mx-5 px-5 py-3 bg-background/80 backdrop-blur-xl border-b border-border-soft">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
              strokeWidth={2.25}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Politiker:in suchen …"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-[14px] text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
            />
          </div>
        </div>

        {/* Partei-Filter-Chips */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          <FilterChip
            label="Alle"
            count={total}
            active={activeParty === null}
            onClick={() => setActiveParty(null)}
          />
          {parties.map((pa) => (
            <FilterChip
              key={pa.label}
              label={shortParty(pa.label)}
              count={pa.count}
              color={partyColor(pa.label)}
              active={activeParty === pa.label}
              onClick={() =>
                setActiveParty(activeParty === pa.label ? null : pa.label)
              }
            />
          ))}
        </div>

        {/* Kachel-Grid */}
        {filtered.length > 0 ? (
          <div className="mt-6 grid grid-cols-3 lg:grid-cols-4 gap-2.5 lg:gap-3">
            {visible.map((p) => (
              <Link
                key={p.id}
                href={`/politiker/${p.id}`}
                className="group flex flex-col items-center text-center p-3 lg:p-4 rounded-xl border border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <PoliticianAvatar
                  photoUrl={p.photoUrl}
                  firstName={p.firstName}
                  lastName={p.lastName}
                  party={p.party}
                  size="card"
                  fallback="muted"
                />
                <div className="mt-2.5 lg:mt-3 min-h-[30px] lg:min-h-[36px] flex items-center">
                  <span className="text-[12px] lg:text-[13.5px] font-medium text-zinc-950 leading-snug line-clamp-2 group-hover:underline">
                    {p.title ? `${p.title} ` : ""}
                    {p.firstName} {p.lastName}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] lg:text-[11px] text-zinc-500">
                  <span
                    className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0"
                    style={{ backgroundColor: partyColor(p.party) }}
                  />
                  <span className="truncate">{shortParty(p.party || "parteilos")}</span>
                </div>
              </Link>
            ))}
            {hasMore && (
              <div ref={sentinelRef} aria-hidden className="col-span-full h-8" />
            )}
          </div>
        ) : (
          <div className="mt-6 py-16 text-center text-[13px] text-zinc-400">
            Keine Politiker:innen gefunden.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
      }`}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
      <span className={`num ${active ? "text-zinc-300" : "text-zinc-400"}`}>
        {count}
      </span>
    </button>
  );
}
