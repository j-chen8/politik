"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  intervalMs?: number;
}

/**
 * Zeigt einen Eintrag nach dem anderen, rotiert automatisch.
 * Hover, Fokus oder Klick auf einen Dot pausieren die Auto-Rotation.
 * Reduziert sich auf statischen Render bei prefers-reduced-motion oder ≤1 Eintrag.
 */
export function RotatingDeck({ children, intervalMs = 5000 }: Props) {
  const items = Children.toArray(children);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const motionQuery =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (motionQuery && motionQuery.matches) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [paused, items.length, intervalMs]);

  if (items.length === 0) return null;
  if (items.length === 1) return <>{items[0]}</>;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="flex flex-col"
    >
      <div className="relative flex-1">
        {items.map((item, i) => (
          <div
            key={i}
            aria-hidden={i !== idx}
            className={`transition-all duration-500 ease-out ${
              i === idx
                ? "opacity-100 translate-y-0 relative"
                : "opacity-0 translate-y-1 absolute inset-0 pointer-events-none"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3" role="tablist">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={`Eintrag ${i + 1} von ${items.length}`}
            onClick={() => {
              setIdx(i);
              setPaused(true);
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === idx
                ? "w-6 bg-zinc-900"
                : "w-1.5 bg-zinc-300 hover:bg-zinc-500"
            }`}
          />
        ))}
        <span className="text-[10px] text-zinc-400 num ml-1.5">
          {idx + 1} / {items.length}
        </span>
      </div>
    </div>
  );
}
