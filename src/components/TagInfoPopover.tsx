"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface Props {
  label: string;
  definition: string;
  /** Anti-Definition: was das Label NICHT bedeutet. Wird unter der Definition mit Trenner gerendert. */
  notMeaning?: string;
  color: string;
  bg: string;
  glossarAnchor?: string;
  variant?: "tonalitaet" | "redentyp";
}

const POPOVER_WIDTH = 288; // w-72

export function TagInfoPopover({
  label,
  definition,
  notMeaning,
  color,
  bg,
  glossarAnchor,
  variant = "tonalitaet",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Position the popover under the button using viewport coordinates
  // (position: fixed) so it escapes any overflow:hidden ancestor.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    function place() {
      const rect = buttonRef.current!.getBoundingClientRect();
      const margin = 8;
      let left = rect.left;
      // Clamp to viewport so we don't render off-screen on mobile.
      if (left + POPOVER_WIDTH > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - POPOVER_WIDTH - margin);
      }
      if (left < margin) left = margin;
      setPos({ top: rect.bottom + 6, left });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | TouchEvent) {
      const t = e.target as Node;
      if (
        (wrapRef.current && wrapRef.current.contains(t)) ||
        (popoverRef.current && popoverRef.current.contains(t))
      ) {
        return;
      }
      setOpen(false);
    }
    function escHandler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  const isTonalitaet = variant === "tonalitaet";

  const popover = open && pos ? (
    <div
      ref={popoverRef}
      role="dialog"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: POPOVER_WIDTH,
        zIndex: 50,
      }}
      className="rounded-lg border border-zinc-200 bg-white shadow-lg p-3 text-[12px] text-zinc-700 leading-relaxed"
    >
      <p className="font-semibold text-zinc-950 mb-1.5 text-[12.5px]">
        {label}
      </p>
      <p>{definition}</p>
      {notMeaning && (
        <div className="mt-2 pt-2 border-t border-zinc-100">
          <p className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-0.5">
            Was es nicht bedeutet
          </p>
          <p className="text-[11.5px] text-zinc-600 leading-relaxed">
            {notMeaning}
          </p>
        </div>
      )}
      {glossarAnchor && (
        <Link
          href={glossarAnchor}
          className="mt-2 inline-block text-[11px] font-medium text-zinc-700 hover:text-zinc-950 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-700"
          onClick={() => setOpen(false)}
        >
          Methodik-Glossar →
        </Link>
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapRef} className="inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${label} — Definition anzeigen`}
        className={
          "px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-shadow hover:ring-1 hover:ring-zinc-300 " +
          (isTonalitaet ? "" : "bg-gray-100 text-zinc-600 font-medium")
        }
        style={isTonalitaet ? { color, backgroundColor: bg } : undefined}
      >
        <span>{label}</span>
        <span
          className={
            "inline-flex items-center justify-center w-3 h-3 rounded-full text-[8px] font-bold leading-none " +
            (isTonalitaet ? "bg-white/80" : "bg-white text-zinc-500")
          }
          style={isTonalitaet ? { color } : undefined}
          aria-hidden="true"
        >
          ?
        </span>
      </button>
      {mounted && popover && createPortal(popover, document.body)}
    </div>
  );
}
