"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Dark-Mode-Toggle für die Homepage. Bewusst homepage-scoped: setzt `.dark` auf
 * <html> beim Mount (gemäß gespeicherter Präferenz/System), entfernt es beim
 * Unmount (= Navigation weg von der Homepage) — so bleibt der Rest der Seite
 * unangetastet hell, bis Dark Mode site-weit ausgerollt ist. Präferenz in
 * localStorage('theme-home'). Kein Flackern dank Inline-Script im Layout.
 */
export function HomeThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme-home");
    const isDark =
      stored === "dark" ||
      (stored === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme-home", next ? "dark" : "light");
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
