"use client";

import { useEffect, useState } from "react";

/**
 * Reading-Progress-Bar am oberen Bildschirmrand.
 *
 * Misst Scroll-Position relativ zur Höhe eines Target-Elements (oder body).
 * Mit `targetId` kann man den Bereich begrenzen (z.B. Main-Article exklusive
 * Footer). Ohne targetId: gesamtes Dokument.
 *
 * Performance: passiver Scroll-Listener, rAF-throttled.
 */
export function ReadingProgress({ targetId }: { targetId?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const target = targetId ? document.getElementById(targetId) : document.body;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const totalHeight = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      if (totalHeight <= 0) {
        setProgress(scrolled > 0 ? 100 : 0);
        return;
      }
      const pct = Math.max(0, Math.min(100, (scrolled / totalHeight) * 100));
      setProgress(pct);
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [targetId]);

  return (
    <div
      className="fixed top-0 inset-x-0 h-0.5 bg-transparent z-50 pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-zinc-950 transition-all duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
