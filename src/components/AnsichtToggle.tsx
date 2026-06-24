"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Globaler Ansichts-Modus „Kompakt / Detailliert" (gemerkt via Cookie).
 * Default = Kompakt: ~90 % der Besucher togglen nie und kriegen den schlanken
 * Steckbrief; wer auf Detailliert schaltet, ist per Selbst-Selektion der
 * Power-User. Cookie statt localStorage → der Server kennt den Modus beim
 * ersten Byte (force-dynamic), kein Flackern. Siehe feedback_consumer_scan_first.
 */
export function AnsichtToggle({ current }: { current: "kompakt" | "detailliert" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(mode: "kompakt" | "detailliert") {
    if (mode === current) return;
    document.cookie = `ansicht=${mode};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  }

  const base =
    "px-3 py-1 text-[12px] font-medium rounded-full transition-colors";
  const active = "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900";
  const idle =
    "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100";

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 ${pending ? "opacity-60" : ""}`}
      role="group"
      aria-label="Ansicht wählen"
    >
      <button type="button" onClick={() => set("kompakt")} aria-pressed={current === "kompakt"} className={`${base} ${current === "kompakt" ? active : idle}`}>
        Kompakt
      </button>
      <button type="button" onClick={() => set("detailliert")} aria-pressed={current === "detailliert"} className={`${base} ${current === "detailliert" ? active : idle}`}>
        Detailliert
      </button>
    </div>
  );
}
