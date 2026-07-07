"use client";
/**
 * Einschnitt-Karte mit aufklappbarem Volltext — aber „mehr ›" erscheint NUR,
 * wenn der Text bei 2-Zeilen-Clamp tatsächlich abgeschnitten ist (DOM-Messung
 * scrollHeight > clientHeight). Kurze Einschnitte bleiben statisch, ohne Köder.
 */
import { useEffect, useRef, useState } from "react";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-muted dark:bg-zinc-800">{children}</span>;
}

export function EinschnittKarte({ massnahme, accentClass, chips }: { massnahme: string; accentClass: string; chips: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return; // nur im geklemmten Zustand messen
    const messen = () => setTruncated(el.scrollHeight > el.clientHeight + 1);
    messen();
    window.addEventListener("resize", messen);
    return () => window.removeEventListener("resize", messen);
  }, [open]);

  return (
    <div
      className={`rounded-lg border border-border bg-card p-3 ${accentClass} ${truncated ? "cursor-pointer" : ""}`}
      onClick={() => truncated && setOpen((o) => !o)}
    >
      <p ref={ref} className={`text-[14px] leading-snug text-foreground ${open ? "" : "line-clamp-2"}`}>{massnahme}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {chips.map((c, i) => <Chip key={i}>{c}</Chip>)}
        {truncated && (
          <span className="ml-auto text-[11px] text-muted hover:text-foreground/70">{open ? "weniger" : "mehr ›"}</span>
        )}
      </div>
    </div>
  );
}
