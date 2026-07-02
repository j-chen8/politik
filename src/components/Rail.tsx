"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

// Spalten-Abstand zwischen den Karten (Tailwind gap-3 = 0.75rem = 12px).
const GAP = 12;

/**
 * Rail — eine horizontale „Regal"-Reihe aus Karten (Spotify/Netflix-Muster).
 * Überschrift + optionaler „Alle ansehen"-Link, darunter seitlich scrollende
 * Karten mit Snap. Neutral: die Reihenfolge der Karten ist CHRONOLOGISCH
 * (neueste zuerst), kein Popularitäts-Ranking.
 *
 * Breite passt sich dem Fenster an: aus der gewünschten Mindestbreite (cardWidth)
 * wird gemessen, wie viele GANZE Karten reinpassen, und diese werden exakt auf die
 * volle Reihenbreite verteilt. So gibt es nie eine angeschnittene Teil-Karte am
 * Rand — der Schnitt ist hart und sauber, kein „Anteasern". Weiteres erreicht man
 * über die Pfeil-Buttons (Desktop, beim Hover sichtbar) bzw. seitliches Scrollen.
 */
export function Rail({
  title,
  subtitle,
  href,
  hrefLabel = "Alle ansehen",
  items,
  cardWidth = "w-[370px]",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  items: ReactNode[];
  cardWidth?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  // Berechnete Kartenbreite in px (null = vor der ersten Messung → SSR-Fallback
  // über die cardWidth-Klasse, damit nichts springt).
  const [cardPx, setCardPx] = useState<number | null>(null);

  // Gewünschte Mindestbreite aus der Tailwind-Klasse (z. B. „w-[420px]" → 420).
  const minCardPx = useMemo(() => {
    const m = cardWidth.match(/\[(\d+)px\]/);
    return m ? parseInt(m[1], 10) : 320;
  }, [cardWidth]);

  const itemCount = items.length;

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Wie viele ganze Karten (>= Mindestbreite) passen in die sichtbare Breite?
    const width = el.clientWidth;
    const n = Math.max(1, Math.floor((width + GAP) / (minCardPx + GAP)));
    // Mobil (nur 1 Karte passt): Karte schmaler als die Reihe, damit die nächste
    // sichtbar anschneidet — ohne die Desktop-Pfeile ist der Anschnitt der einzige
    // Hinweis, dass die Reihe seitlich scrollt.
    const peek = n === 1 && itemCount > 1 ? 36 : 0;
    setCardPx(peek ? Math.max(220, width - peek) : (width - (n - 1) * GAP) / n);
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, [minCardPx, itemCount]);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // ResizeObserver fängt auch Layout-Änderungen ohne Fenster-Resize (z. B.
    // Ein-/Ausklappen der linken Leiste).
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [update]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="group/rail flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[14px] text-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-muted transition-colors hover:text-foreground"
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((card, i) => (
            <div
              key={i}
              className={`flex max-w-full snap-start shrink-0 ${cardPx == null ? cardWidth : ""}`}
              style={cardPx == null ? undefined : { width: cardPx }}
            >
              {card}
            </div>
          ))}
        </div>

        {/* Pfeile (nur Desktop, nur wenn scrollbar; beim Hover sichtbar) */}
        {!atStart && (
          <button
            type="button"
            aria-label="Zurück"
            onClick={() => scrollByDir(-1)}
            className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-soft bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-background group-hover/rail:opacity-100 lg:flex"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
        )}
        {!atEnd && (
          <button
            type="button"
            aria-label="Weiter"
            onClick={() => scrollByDir(1)}
            className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border-soft bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-background group-hover/rail:opacity-100 lg:flex"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
          </button>
        )}
      </div>
    </section>
  );
}
