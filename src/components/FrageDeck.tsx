"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronUp, Share2, Check, ArrowUpRight } from "lucide-react";
import type { FrageFeedCard } from "@/lib/db";
import { feldToSlug, FELD_EMOJI } from "@/lib/themenfeld-slug";

const PER_PAGE = 12; // muss zu getFrageFeed-Default passen

/** Dezenter Partei-Akzent (Markenfarbe, Gleichbehandlung — nur Wiedererkennung). */
function partyColor(party: string | null): string {
  const p = (party ?? "").toLowerCase();
  if (p.includes("grüne")) return "#1faa4b";
  if (p.includes("spd")) return "#e3000f";
  if (p.includes("csu")) return "#0a6eb4";
  if (p.includes("cdu")) return "#0a0a0a";
  if (p.includes("fdp")) return "#ffcc00";
  if (p.includes("afd")) return "#0099db";
  if (p.includes("linke")) return "#be3075";
  if (p.includes("ssw")) return "#003c8f";
  return "#71717a";
}

function fmtDatum(d: string | null): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : d;
}

/* ── Einzelkarte ─────────────────────────────────────────────────────────── */

function DeckCard({ card, index }: { card: FrageFeedCard; index: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const accent = partyColor(card.party);
  const emoji = (card.feld && FELD_EMOJI[card.feld]) || "❓";

  const share = useCallback(async () => {
    const text = `„${card.frageText}"\n— Frage an ${card.name}${card.party ? ` (${card.party})` : ""}\n\nAntwort: ${card.tldr}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Politik-Radar", text, url: card.frageUrl });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${card.frageUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* abgebrochen — ignorieren */
    }
  }, [card]);

  const datum = fmtDatum(card.antwortDatum ?? card.frageDatum);

  return (
    <section className="snap-start shrink-0 h-full w-full flex items-stretch justify-center px-4 py-3">
      <div
        className="relative w-full max-w-md h-full flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
        style={{ borderTopColor: accent, borderTopWidth: 3 }}
      >
        {/* Themenfeld-Chip */}
        <div className="shrink-0 px-5 pt-4">
          {card.feld && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              <span aria-hidden>{emoji}</span>
              {card.feld}
            </span>
          )}
        </div>

        {/* Frage — der Hook */}
        <div className={`px-5 ${open ? "pt-3" : "flex-1 flex flex-col justify-center"}`}>
          <p
            className={`font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-snug ${
              open ? "text-[15px] line-clamp-3" : "text-[21px] sm:text-[23px] line-clamp-[10]"
            }`}
          >
            {card.frageText}
          </p>
          <p className="mt-2 text-[12px] text-zinc-400 dark:text-zinc-500">
            {card.asker ? card.asker : "Bürgerfrage"}
            {datum && <span className="num"> · {datum}</span>}
          </p>
        </div>

        {/* Reveal-Bereich */}
        {open ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 pt-3 overscroll-contain">
            {/* Politiker */}
            <Link
              href={`/politiker/${card.politicianId}`}
              className="flex items-center gap-3 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.photoUrl ?? ""}
                alt={card.name}
                loading="lazy"
                className="w-11 h-11 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800"
                style={{ boxShadow: `0 0 0 2px ${accent}` }}
              />
              <div className="leading-tight">
                <div className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline underline-offset-2">
                  {card.name}
                </div>
                {card.party && (
                  <div className="text-[12px]" style={{ color: accent }}>
                    {card.party}
                  </div>
                )}
              </div>
            </Link>

            {/* TL;DR — Sofort-Payoff */}
            <p className="mt-3 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">{card.tldr}</p>

            {/* Volltext optional */}
            {card.antwortText && (
              <details className="group mt-3">
                <summary className="cursor-pointer list-none text-[12px] font-medium text-[#1a3e72] dark:text-[#8fb3e6] select-none">
                  <span className="group-open:hidden">Vollständige Antwort lesen ▾</span>
                  <span className="hidden group-open:inline">Antwort einklappen ▴</span>
                </summary>
                <p className="mt-2 whitespace-pre-line border-l-2 border-border pl-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {card.antwortText}
                </p>
              </details>
            )}

            {/* Aktionen */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-zinc-700"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? "Kopiert" : "Teilen"}
              </button>
              <a
                href={card.frageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-[12px] text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Original <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="shrink-0 px-5 pb-5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full rounded-xl bg-[#1a3e72] dark:bg-[#8fb3e6] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0f2a52] dark:hover:bg-[#b7d0f0]"
            >
              👆 Antwort zeigen
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-300 dark:text-zinc-600">
              {index === 0 ? "↑ nach oben wischen für die nächste Frage" : "↑ wischen"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Deck ────────────────────────────────────────────────────────────────── */

export function FrageDeck({
  initialCards,
  seed,
  feldSlug,
  felder,
}: {
  initialCards: FrageFeedCard[];
  seed: number;
  feldSlug: string | null;
  felder: { feld: string; kurz: string; count: number }[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState<FrageFeedCard[]>(initialCards);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialCards.length < PER_PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || exhausted) return;
    setLoading(true);
    try {
      const sp = new URLSearchParams({ seed: String(seed), page: String(nextPage) });
      if (feldSlug) sp.set("feld", feldSlug);
      const res = await fetch(`/durchklicken/feed?${sp.toString()}`);
      const data = (await res.json()) as { cards: FrageFeedCard[] };
      const fresh = data.cards ?? [];
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.frageUrl));
        return [...prev, ...fresh.filter((c) => !seen.has(c.frageUrl))];
      });
      setNextPage((p) => p + 1);
      if (fresh.length < PER_PAGE) setExhausted(true);
    } catch {
      // transienter Fehler — beim nächsten Sentinel-Trigger erneut
    } finally {
      setLoading(false);
    }
  }, [loading, exhausted, seed, nextPage, feldSlug]);

  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "600px 0px" }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [loadMore]);

  function pickFeld(slug: string | null) {
    router.push(slug ? `/durchklicken?feld=${slug}` : "/durchklicken");
  }

  return (
    <div className="flex flex-col h-[calc(100svh-3.5rem)]">
      {/* Themenfeld-Filterleiste */}
      <div className="shrink-0 border-b border-border bg-card/90 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => pickFeld(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              feldSlug === null
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Alles
          </button>
          {felder.map((f) => {
            const slug = feldToSlug(f.feld);
            if (!slug) return null;
            const active = slug === feldSlug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => pickFeld(slug)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  active ? "bg-zinc-900 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span aria-hidden className="mr-1">
                  {FELD_EMOJI[f.feld] ?? "•"}
                </span>
                {f.kurz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Karten-Deck — vollbild Wisch */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 snap-y snap-mandatory overflow-y-scroll overscroll-contain bg-zinc-50 dark:bg-zinc-800"
      >
        {cards.map((card, i) => (
          <DeckCard key={card.frageUrl} card={card} index={i} />
        ))}

        {/* Sentinel / Ende */}
        <div ref={sentinelRef} className="snap-start h-24 flex items-center justify-center">
          {loading ? (
            <span className="text-[12px] text-zinc-400 dark:text-zinc-500">lädt …</span>
          ) : exhausted ? (
            <button
              type="button"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <ChevronUp className="w-4 h-4" /> Das war alles — nach oben
            </button>
          ) : (
            <span className="text-[12px] text-zinc-300 dark:text-zinc-600">↑ weiter wischen</span>
          )}
        </div>
      </div>
    </div>
  );
}
