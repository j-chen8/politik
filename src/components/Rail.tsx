"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

/**
 * Rail — eine horizontale „Regal"-Reihe aus Karten (Spotify/Netflix-Muster).
 * Überschrift + optionaler „Alle ansehen"-Link, darunter seitlich scrollende
 * Karten mit Snap. Neutral: die Reihenfolge der Karten ist CHRONOLOGISCH
 * (neueste zuerst), kein Popularitäts-Ranking.
 *
 * Scroll-bewusst: die Karten laufen über den rechten Rand hinaus (= Scroll-Hinweis),
 * aber statt eines harten Schnitts faded die Kante weich aus — UND zwar nur an der
 * Seite, an der es wirklich noch weitergeht (kein Fehl-Fade, wenn alles reinpasst).
 * Auf dem Desktop erscheinen beim Hover Pfeil-Buttons.
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

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  // Weiche Kante nur dort, wo es weitergeht.
  const fadeL = !atStart;
  const fadeR = !atEnd;
  const mask =
    fadeL && fadeR
      ? "linear-gradient(to right, transparent, #000 48px, #000 calc(100% - 48px), transparent)"
      : fadeR
      ? "linear-gradient(to right, #000 calc(100% - 48px), transparent)"
      : fadeL
      ? "linear-gradient(to right, transparent, #000 48px)"
      : undefined;

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
          style={mask ? { WebkitMaskImage: mask, maskImage: mask } : undefined}
          className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((card, i) => (
            <div key={i} className={`flex snap-start shrink-0 ${cardWidth}`}>
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
