"use client";

import { useEffect, useRef, useState } from "react";
import { ListTree } from "lucide-react";
import { ANSWER_TYPE_META } from "@/lib/media-appearances-shared";

interface ToCItem {
  id: string;
  label: string;
  sub?: string;
  answerType?: string;
}

/**
 * Sticky Side-ToC mit IntersectionObserver Scroll-Spy.
 * Desktop: fixed left rail. Mobile: collapsible top drawer.
 *
 * Active-Highlight: IntersectionObserver mit rootMargin "-100px 0px -60% 0px" —
 * Section gilt als aktiv wenn ihr oberer Rand 100px vom oberen Viewport-Rand
 * entfernt ist und unter 40% Viewport-Höhe sichtbar.
 */
export function AppearanceToC({ themes }: {
  themes: Array<{ title: string; answer_type?: string }>;
}) {
  const items: ToCItem[] = [
    { id: "ueberblick", label: "Überblick" },
    ...themes.map((t, i) => ({
      id: `theme-${i}`,
      label: t.title,
      sub: `#${i + 1}`,
      answerType: t.answer_type,
    })),
    { id: "fakten", label: "Fakten-Behauptungen" },
    { id: "methodik", label: "Methodik & Caveats" },
  ];

  const [activeId, setActiveId] = useState<string>(items[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileBarHidden, setMobileBarHidden] = useState(false);
  const intersectingRef = useRef<Set<string>>(new Set());
  const lastScrollYRef = useRef<number>(0);

  // Mobile ToC: Hide-on-scroll-down / Show-on-scroll-up.
  // Anti-Jitter-Strategie:
  // - Peak-Tracking: höchste je gesehene Y-Position seit letztem Show wird gemerkt
  // - Show triggert nur wenn Distanz vom Peak ≥ 50px (= "echtes" Hochscrollen)
  // - Hide triggert nur wenn kumulativ ≥ 60px nach unten gescrollt
  // - Cooldown 400ms nach State-Change verhindert Flackern
  const peakYRef = useRef(0);
  const downAccRef = useRef(0);
  const lastChangeAtRef = useRef(0);
  const clickScrollAtRef = useRef(0);
  // Mirror von mobileBarHidden + mobileOpen — damit handleScroll im stable
  // useEffect immer den aktuellen Wert sieht.
  const hiddenStateRef = useRef(false);
  const mobileOpenRef = useRef(false);
  useEffect(() => { hiddenStateRef.current = mobileBarHidden; }, [mobileBarHidden]);
  useEffect(() => { mobileOpenRef.current = mobileOpen; }, [mobileOpen]);

  useEffect(() => {
    let rafId: number | null = null;
    const COOLDOWN_MS = 400;
    const HIDE_DOWN_PX = 60;
    const SHOW_UP_PX = 50;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const currentY = window.scrollY;
        const delta = currentY - lastScrollYRef.current;
        const now = performance.now();
        const inCooldown = now - lastChangeAtRef.current < COOLDOWN_MS;
        // clickScrollAtRef ist > 0 solange ein Click-Scroll läuft.
        // Cleanup setzt es zurück auf 0 via scrollend-Event oder Fallback-Timeout.
        const isClickScroll = clickScrollAtRef.current > 0;
        const isHidden = hiddenStateRef.current;
        const isDrawerOpen = mobileOpenRef.current;

        if (currentY > peakYRef.current) peakYRef.current = currentY;

        // Click-Scroll oder Drawer offen: nur tracken, KEINE Hide-Logic.
        // Drawer-open: User interagiert mit ToC, jeder Touch-Jitter würde sonst
        // den ganzen Bereich wegfliegen lassen.
        if (isClickScroll || isDrawerOpen) {
          lastScrollYRef.current = currentY;
          return;
        }

        if (currentY < 80) {
          if (isHidden) {
            setMobileBarHidden(false);
            lastChangeAtRef.current = now;
          }
          peakYRef.current = currentY;
          downAccRef.current = 0;
        } else if (!inCooldown && delta > 0) {
          downAccRef.current += delta;
          if (downAccRef.current >= HIDE_DOWN_PX && !isHidden) {
            setMobileBarHidden(true);
            setMobileOpen(false);
            lastChangeAtRef.current = now;
            downAccRef.current = 0;
          }
        } else if (!inCooldown && delta < 0 && isHidden) {
          const distFromPeak = peakYRef.current - currentY;
          if (distFromPeak >= SHOW_UP_PX) {
            setMobileBarHidden(false);
            lastChangeAtRef.current = now;
            peakYRef.current = currentY;
            downAccRef.current = 0;
          }
        }
        if (typeof window !== "undefined" && (window as unknown as { __debugToC?: boolean }).__debugToC) {
          console.log(`[ToC] y=${currentY} Δ=${delta.toFixed(1)} peak=${peakYRef.current} dist=${(peakYRef.current - currentY).toFixed(0)} down=${downAccRef.current.toFixed(0)} hidden=${isHidden} cd=${inCooldown} click=${isClickScroll}`);
        }
        lastScrollYRef.current = currentY;
      });
    };
    lastScrollYRef.current = window.scrollY;
    peakYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const observedIds = new Set<string>();

    const recomputeActive = () => {
      // Wenn nichts intersecting ist: fallback — finde Section deren top am nächsten an 0 ist (von oben)
      if (intersectingRef.current.size === 0) {
        let best: { id: string; top: number } | null = null;
        for (const item of items) {
          const el = document.getElementById(item.id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          // Bevorzuge die Section direkt über/an der oberen Viewport-Kante
          if (top <= 100) {
            if (!best || top > best.top) best = { id: item.id, top };
          }
        }
        if (best) setActiveId(best.id);
        return;
      }
      // Pick das oberste sichtbare Item (top am kleinsten aber >= -50)
      const sortedByPos = [...intersectingRef.current]
        .map(id => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Infinity }))
        .filter(x => x.top >= -50)
        .sort((a, b) => a.top - b.top);
      if (sortedByPos[0]) setActiveId(sortedByPos[0].id);
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      for (const e of entries) {
        if (e.isIntersecting) intersectingRef.current.add(e.target.id);
        else intersectingRef.current.delete(e.target.id);
      }
      recomputeActive();
    };

    // Zusätzlicher Scroll-Listener als Fallback — falls Intersection-Events Lücken haben
    let scrollRaf: number | null = null;
    const onScroll = () => {
      if (scrollRaf !== null) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        recomputeActive();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const attachObserver = () => {
      // Re-create wenn Targets sich verändert haben (z.B. MediaThemesList re-renders nach Toggle)
      const currentIds = new Set<string>();
      for (const item of items) {
        if (document.getElementById(item.id)) currentIds.add(item.id);
      }
      // Differenz-Check
      let same = currentIds.size === observedIds.size;
      if (same) for (const id of currentIds) { if (!observedIds.has(id)) { same = false; break; } }
      if (same && observer) return;

      // Re-attach — auch intersectingRef neu aufbauen (alte IDs könnten weg sein)
      if (observer) observer.disconnect();
      intersectingRef.current = new Set();
      observer = new IntersectionObserver(handleIntersect, {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      });
      observedIds.clear();
      for (const id of currentIds) {
        const el = document.getElementById(id);
        if (el) { observer.observe(el); observedIds.add(id); }
      }
    };

    // Initial setup
    attachObserver();

    // MutationObserver: wenn Themen-Elemente neu rendern (Toggle Kompakt/Vollständig)
    let debounce: number | null = null;
    const mutObserver = new MutationObserver(() => {
      if (debounce) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        attachObserver();
        debounce = null;
      }, 100);
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (observer) observer.disconnect();
      mutObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (debounce) window.clearTimeout(debounce);
      if (scrollRaf !== null) cancelAnimationFrame(scrollRaf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (id: string) => {
    const wasMobileOpen = mobileOpen;
    setMobileOpen(false);
    clickScrollAtRef.current = performance.now();
    setMobileBarHidden(false);
    downAccRef.current = 0;

    const cleanup = () => {
      peakYRef.current = window.scrollY;
      downAccRef.current = 0;
      clickScrollAtRef.current = 0;
      lastChangeAtRef.current = performance.now();
    };
    const onScrollEnd = () => {
      cleanup();
      window.removeEventListener("scrollend", onScrollEnd);
      window.clearTimeout(fallbackTimer);
    };
    const fallbackTimer = window.setTimeout(() => {
      cleanup();
      window.removeEventListener("scrollend", onScrollEnd);
    }, 4000);
    window.addEventListener("scrollend", onScrollEnd, { once: true });

    const doScroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    // Wenn Drawer offen war: erst Reflow nach Close abwarten, sonst misst
    // smooth-scroll mit FALSCHEM Layout (Drawer ist noch ~300px hoch beim
    // Berechnen des Zielpunkts → Section landet zu tief).
    if (wasMobileOpen) {
      requestAnimationFrame(() => requestAnimationFrame(doScroll));
    } else {
      doScroll();
    }
  };

  return (
    <>
      {/* Mobile: Top-Drawer (lg:hidden) — Hide-on-scroll-down / Show-on-scroll-up.
          top-14 = unter der globalen Nav (h-14). */}
      <div
        className={`lg:hidden mb-6 sticky top-14 z-30 bg-card/95 backdrop-blur-sm -mx-5 px-5 py-2 border-b border-border transition-transform duration-200 ease-out will-change-transform ${
          mobileBarHidden ? "-translate-y-[200%]" : "translate-y-0"
        }`}
      >
        <button
          onClick={() => {
            const willOpen = !mobileOpen;
            setMobileOpen(willOpen);
            // Beim Schließen: kurze Cooldown gegen Touch-Jitter-Hide
            if (!willOpen) lastChangeAtRef.current = performance.now();
            // Beim Öffnen: peak + acc resetten, sonst kann stale state hide triggern
            if (willOpen) {
              peakYRef.current = window.scrollY;
              downAccRef.current = 0;
            }
          }}
          className="w-full flex items-center justify-between text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors py-1.5"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            <ListTree className="w-4 h-4" strokeWidth={2.25} />
            Inhalt · {items.length} Abschnitte
          </span>
          <span className={`transition-transform text-zinc-400 dark:text-zinc-500 ${mobileOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {mobileOpen && (
          <nav className="mt-2 max-h-[60vh] overflow-y-auto pb-2">
            <ToCList items={items} activeId={activeId} onClick={handleClick} />
          </nav>
        )}
      </div>

      {/* Desktop: Sticky Side-Rail (hidden on <lg) — top-20 = unter der globalen Nav (h-14 + Abstand) */}
      <aside className="hidden lg:block">
        <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhalt
          </div>
          <ToCList items={items} activeId={activeId} onClick={handleClick} />
        </nav>
      </aside>
    </>
  );
}

function ToCList({
  items,
  activeId,
  onClick,
}: {
  items: ToCItem[];
  activeId: string;
  onClick: (id: string) => void;
}) {
  return (
    <ul className="space-y-0.5 text-[12.5px]">
      {items.map((item) => {
        const isActive = item.id === activeId;
        const meta = item.answerType ? ANSWER_TYPE_META[item.answerType] : null;
        const isAmber = meta?.tone === "amber";
        return (
          <li key={item.id}>
            <button
              onClick={() => onClick(item.id)}
              aria-current={isActive ? "true" : undefined}
              className={`block w-full text-left py-1.5 px-2 rounded-md transition-colors leading-snug ${
                isActive
                  ? "bg-zinc-950 text-white font-medium"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-baseline gap-1.5">
                {item.sub && (
                  <span className={`text-[10.5px] num shrink-0 ${
                    isActive ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400 dark:text-zinc-500"
                  }`}>
                    {item.sub}
                  </span>
                )}
                <span className={`flex-1 ${isAmber && !isActive ? "text-amber-800 dark:text-amber-400" : ""}`}>
                  {item.label}
                </span>
                {isAmber && (
                  <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-amber-300" : "bg-amber-400"
                  }`} title={meta?.label}></span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
