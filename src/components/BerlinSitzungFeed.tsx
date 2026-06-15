"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { resolveBerlinTonality } from "@/lib/berlin-reden-tonality";
import type { BerlinSitzungDetail, BerlinLatestVote, BerlinSitzungSpeech } from "@/lib/db";

const PARTY_COLOR: Record<string, string> = {
  SPD: "bg-red-500",
  CDU: "bg-zinc-900",
  GRÜNE: "bg-emerald-600",
  LINKE: "bg-pink-600",
  AfD: "bg-blue-700",
  FDP: "bg-yellow-400",
};

const TONALITAET_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sachlich: { label: "sachlich", color: "#374151", bg: "#f3f4f6" },
  polemisch: { label: "polemisch", color: "#b91c1c", bg: "#fee2e2" },
  polemisch_sachlich: { label: "polemisch-sachlich", color: "#9a3412", bg: "#ffedd5" },
  emotional_persoenlich: { label: "emotional-persönlich", color: "#7c3aed", bg: "#ede9fe" },
  konfrontativ_belegend: { label: "konfrontativ-belegend", color: "#1d4ed8", bg: "#dbeafe" },
  ironisch_jugendlich: { label: "ironisch", color: "#a16207", bg: "#fef3c7" },
  bilanzierend_werbend: { label: "bilanzierend", color: "#15803d", bg: "#dcfce7" },
  staatsmaennisch: { label: "staatsmännisch", color: "#1e40af", bg: "#dbeafe" },
  defensiv_pragmatisch: { label: "defensiv-pragmatisch", color: "#475569", bg: "#f1f5f9" },
  sozial_anklagend: { label: "sozial-anklagend", color: "#be185d", bg: "#fce7f3" },
  mahnend: { label: "mahnend", color: "#854d0e", bg: "#fef9c3" },
};

type ItemType = "topheader" | "vote" | "speech";

interface FeedItem {
  id: string;
  type: ItemType;
  topMarker: string;
  topTitel: string;
  vote?: BerlinLatestVote;
  speech?: BerlinSitzungSpeech;
  party?: string | null;
  tonality?: string | null;
}

function buildItems(sit: BerlinSitzungDetail): FeedItem[] {
  const items: FeedItem[] = [];
  for (const top of sit.tops) {
    items.push({
      id: `top-${top.marker}-${top.titel}`,
      type: "topheader",
      topMarker: top.marker,
      topTitel: top.titel,
    });
    // Votes die zu dieser TOP gehören könnten (heuristisch: keine echte Verknüpfung, nehmen wir alle dem ersten TOP zu)
    if (top.marker === sit.tops[0]?.marker) {
      for (const v of sit.votes) {
        items.push({
          id: `vote-${v.voteId}`,
          type: "vote",
          topMarker: top.marker,
          topTitel: top.titel,
          vote: v,
        });
      }
    }
    for (const sp of top.speeches) {
      if (!sp.zusammenfassung) continue;
      items.push({
        id: `speech-${sp.speechId}`,
        type: "speech",
        topMarker: top.marker,
        topTitel: top.titel,
        speech: sp,
        party: sp.speakerParty,
        tonality: resolveBerlinTonality(sp.tonalitaet),
      });
    }
  }
  return items;
}

interface Props {
  sit: BerlinSitzungDetail;
}

export function BerlinSitzungFeed({ sit }: Props) {
  const allItems = useMemo(() => buildItems(sit), [sit]);

  const [activeType, setActiveType] = useState<"all" | ItemType>("all");
  const [activeParty, setActiveParty] = useState<string | null>(null);
  const [activeTon, setActiveTon] = useState<string | null>(null);

  const partyCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of allItems) {
      if (it.type === "speech" && it.party) c[it.party] = (c[it.party] ?? 0) + 1;
    }
    return c;
  }, [allItems]);

  const tonCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const it of allItems) {
      if (it.type === "speech" && it.tonality) c[it.tonality] = (c[it.tonality] ?? 0) + 1;
    }
    return c;
  }, [allItems]);

  const visible = useMemo(() => {
    return allItems.filter((it) => {
      if (it.type === "topheader") return true;
      if (activeType !== "all" && it.type !== activeType) return false;
      if (activeParty && it.party !== activeParty) return false;
      if (activeTon && it.tonality !== activeTon) return false;
      return true;
    });
  }, [allItems, activeType, activeParty, activeTon]);

  // Skip topheaders that have no content under them after filtering
  const finalItems = useMemo(() => {
    const result: FeedItem[] = [];
    for (let i = 0; i < visible.length; i++) {
      const cur = visible[i];
      if (cur.type !== "topheader") {
        result.push(cur);
        continue;
      }
      const next = visible[i + 1];
      if (next && next.type !== "topheader") result.push(cur);
    }
    return result;
  }, [visible]);

  const typeCounts = useMemo(() => {
    return {
      all: allItems.filter((i) => i.type !== "topheader").length,
      vote: allItems.filter((i) => i.type === "vote").length,
      speech: allItems.filter((i) => i.type === "speech").length,
    };
  }, [allItems]);

  const partiesSorted = useMemo(
    () => Object.entries(partyCounts).sort((a, b) => b[1] - a[1]).map(([p]) => p),
    [partyCounts],
  );
  const tonsSorted = useMemo(
    () => Object.entries(tonCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t),
    [tonCounts],
  );

  return (
    <>
      {/* Filter-Chips */}
      <div className="sticky top-0 z-10 bg-[color:var(--page-wash)] backdrop-blur supports-[backdrop-filter]:bg-opacity-80 py-3 -mx-5 px-5 mb-4 border-b border-border">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-1">Typ</span>
            <Chip active={activeType === "all"} onClick={() => setActiveType("all")}>
              Alle <span className="num text-zinc-400 dark:text-zinc-500">{typeCounts.all}</span>
            </Chip>
            <Chip active={activeType === "vote"} onClick={() => setActiveType("vote")}>
              Abstimmungen <span className="num text-zinc-400 dark:text-zinc-500">{typeCounts.vote}</span>
            </Chip>
            <Chip active={activeType === "speech"} onClick={() => setActiveType("speech")}>
              Reden <span className="num text-zinc-400 dark:text-zinc-500">{typeCounts.speech}</span>
            </Chip>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-1">Fraktion</span>
            <Chip active={!activeParty} onClick={() => setActiveParty(null)}>Alle</Chip>
            {partiesSorted.map((p) => (
              <Chip
                key={p}
                active={activeParty === p}
                onClick={() => setActiveParty(activeParty === p ? null : p)}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${PARTY_COLOR[p] ?? "bg-zinc-400"}`} />
                {p} <span className="num text-zinc-400 dark:text-zinc-500">{partyCounts[p]}</span>
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-1">Tonalität</span>
            <Chip active={!activeTon} onClick={() => setActiveTon(null)}>Alle</Chip>
            {tonsSorted.map((t) => {
              const cfg = TONALITAET_CONFIG[t];
              return (
                <Chip
                  key={t}
                  active={activeTon === t}
                  onClick={() => setActiveTon(activeTon === t ? null : t)}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg?.color ?? "#a1a1aa" }} />
                  {cfg?.label ?? t} <span className="num text-zinc-400 dark:text-zinc-500">{tonCounts[t]}</span>
                </Chip>
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 num mt-2">
          {finalItems.filter((i) => i.type !== "topheader").length} Items sichtbar
        </p>
      </div>

      {/* Feed */}
      <ul className="space-y-2">
        {finalItems.map((it) => {
          if (it.type === "topheader") {
            return (
              <li
                key={it.id}
                className="px-3 py-2 mt-4 first:mt-0 sticky top-[180px] z-[5] bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur rounded-md"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 num">
                  TOP {it.topMarker}
                </span>
                <span className="ml-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{it.topTitel}</span>
              </li>
            );
          }
          if (it.type === "vote") {
            const v = it.vote!;
            return (
              <li
                key={it.id}
                className="rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    🗳 Abstimmung
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      v.outcome === "annahme" || v.outcome === "annahme_geaendert"
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : v.outcome === "ablehnung"
                        ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                        : "text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    {(v.outcome === "annahme" || v.outcome === "annahme_geaendert") ? "Angenommen"
                      : v.outcome === "ablehnung" ? "Abgelehnt"
                      : v.outcome === "vertagung" ? "Vertagt"
                      : v.outcome === "ueberweisung" ? "Überwiesen"
                      : v.outcome}
                  </span>
                  {v.modus && <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">{v.modus}</span>}
                </div>
                {v.primaryTitel && v.primaryDbid ? (
                  <Link
                    href={`/parlamente/berlin/drucksache/${v.primaryDbid}`}
                    className="block text-[13.5px] text-zinc-950 dark:text-zinc-50 leading-snug hover:text-blue-700 dark:hover:text-blue-400 transition-colors mb-1.5"
                  >
                    {v.primaryTitel}
                  </Link>
                ) : (
                  <p className="text-[13.5px] text-zinc-950 dark:text-zinc-50 leading-snug mb-1.5">{v.primaryTitel}</p>
                )}
                <div className="flex flex-wrap gap-0.5">
                  {Object.entries(v.fraktionVotes).map(([frak, vote]) => (
                    <span
                      key={frak}
                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                        vote === "ja"
                          ? "text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40"
                          : vote === "nein"
                          ? "text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/40"
                          : vote === "enthaltung"
                          ? "text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40"
                          : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      {frak} {vote}
                    </span>
                  ))}
                </div>
              </li>
            );
          }
          // speech
          const sp = it.speech!;
          const tonCfg = it.tonality ? TONALITAET_CONFIG[it.tonality] : null;
          return (
            <li
              key={it.id}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  💬 Rede
                </span>
                {sp.politicianId ? (
                  <Link
                    href={`/politiker/${sp.politicianId}`}
                    className="text-[13px] font-medium text-zinc-950 dark:text-zinc-50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  >
                    {sp.speakerName}
                  </Link>
                ) : (
                  <span className="text-[13px] font-medium text-zinc-950 dark:text-zinc-50">{sp.speakerName}</span>
                )}
                {sp.speakerParty && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                    <span className={`w-1.5 h-1.5 rounded-full ${PARTY_COLOR[sp.speakerParty] ?? "bg-zinc-400"}`} />
                    {sp.speakerParty}
                  </span>
                )}
                {tonCfg && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ color: tonCfg.color, backgroundColor: tonCfg.bg }}
                  >
                    {tonCfg.label}
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{sp.zusammenfassung}</p>
            </li>
          );
        })}
      </ul>

      {finalItems.filter((i) => i.type !== "topheader").length === 0 && (
        <p className="text-center text-[13px] text-zinc-500 dark:text-zinc-400 py-12">
          Keine Items passen zu den Filtern.
        </p>
      )}
    </>
  );
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11.5px] font-medium border transition-colors ${
        active
          ? "bg-zinc-900 text-white border-zinc-900 dark:border-zinc-100"
          : "bg-card text-zinc-700 dark:text-zinc-300 border-border hover:border-zinc-400 dark:hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}
