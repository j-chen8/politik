"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { POLITIK_GLOSSAR_MAP } from "@/lib/politik-glossar";

interface Props {
  slug: string;       // glossar entry slug
  children?: React.ReactNode;  // optional override-label (sonst entry.term)
  className?: string;
}

const POPOVER_WIDTH = 300;

/**
 * Inline-Term mit Wikipedia-Style hover/click preview.
 * Visual cue: subtiler dotted underline. Hover/Tap zeigt definition-card.
 */
export function GlossarTerm({ slug, children, className }: Props) {
  const entry = POLITIK_GLOSSAR_MAP[slug];
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);
  // Verzögerung beim Schließen, damit cursor in Popover wandern kann
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    function place() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const margin = 8;
      let left = rect.left;
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
    function escHandler(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    function clickAway(e: MouseEvent | TouchEvent) {
      const t = e.target as Node;
      if ((wrapRef.current && wrapRef.current.contains(t)) ||
          (popoverRef.current && popoverRef.current.contains(t))) return;
      setOpen(false);
    }
    document.addEventListener("keydown", escHandler);
    document.addEventListener("mousedown", clickAway);
    document.addEventListener("touchstart", clickAway);
    return () => {
      document.removeEventListener("keydown", escHandler);
      document.removeEventListener("mousedown", clickAway);
      document.removeEventListener("touchstart", clickAway);
    };
  }, [open]);

  if (!entry) {
    // Fallback wenn slug unbekannt — nur das Label rendern
    return <span className={className}>{children}</span>;
  }

  const label = children ?? entry.term;

  const handleEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 150);
  };

  const popover = open && pos ? (
    <div
      ref={popoverRef}
      role="dialog"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: POPOVER_WIDTH,
        zIndex: 50,
      }}
      className="rounded-lg border border-zinc-200 bg-white shadow-lg p-4 text-[12.5px] text-zinc-700 leading-relaxed"
    >
      <div className="font-semibold text-zinc-950 mb-1.5 text-[13.5px]">
        {entry.term}
      </div>
      <p className="text-zinc-700 mb-2">{entry.short}</p>
      {entry.example && (
        <p className="text-zinc-500 text-[11.5px] border-l-2 border-zinc-200 pl-2.5 mb-2 italic">
          {entry.example}
        </p>
      )}
      <Link
        href={`/design/linear/glossar#${entry.slug}`}
        className="inline-block text-[11px] font-medium text-zinc-700 hover:text-zinc-950 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-700"
        onClick={() => setOpen(false)}
      >
        Im Glossar nachschlagen →
      </Link>
    </div>
  ) : null;

  return (
    <span ref={wrapRef} className="inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        aria-expanded={open}
        aria-label={`${entry.term} — Definition anzeigen`}
        className={
          "inline border-b border-dotted border-zinc-400 hover:border-zinc-700 hover:text-zinc-950 transition-colors cursor-help " +
          (className ?? "")
        }
      >
        {label}
      </button>
      {mounted && popover && createPortal(popover, document.body)}
    </span>
  );
}
