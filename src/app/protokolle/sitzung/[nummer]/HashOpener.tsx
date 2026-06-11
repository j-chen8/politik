"use client";
import { useEffect } from "react";

/**
 * Öffnet bei Anker-Navigation (#rede-…, #vote-…) alle umschließenden <details>
 * und scrollt zum Ziel. Nötig, weil die Reden in zugeklappten TOP-Akkordeons
 * liegen — bei Client-Navigation (next/link mit Hash) öffnet der Browser die
 * details-Vorfahren nicht und scrollt deshalb ins Leere (Deep-Links vom
 * Themen-Blatt „Letzte Reden zum Thema", 2026-06-11).
 */
export function HashOpener() {
  useEffect(() => {
    const goto = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      let d = el.closest("details");
      while (d) { d.open = true; d = d.parentElement?.closest("details") ?? null; }
      // nach dem Aufklappen layouten lassen, dann anfahren
      requestAnimationFrame(() => el.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior }));
    };
    goto();
    window.addEventListener("hashchange", goto);
    return () => window.removeEventListener("hashchange", goto);
  }, []);
  return null;
}
