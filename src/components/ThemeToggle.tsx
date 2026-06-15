"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Site-weiter Dark-Mode-Toggle in der Nav: setzt/entfernt `.dark` auf <html>,
 * Präferenz in localStorage('theme'). Beim Mount wird der gespeicherte (bzw.
 * System-)Zustand gespiegelt; das No-Flash-Inline-Script im Layout hat `.dark`
 * schon vor dem Paint gesetzt. Kein Unmount-Cleanup mehr — der Modus gilt
 * überall und über Navigationen hinweg.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark =
      stored === "dark" ||
      (stored === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Hellen Modus einschalten" : "Dunklen Modus einschalten"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-white/70 text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:text-white"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
