"use client";

import { useEffect } from "react";

/**
 * Scrollt nach (client-seitiger) Navigation zum URL-Hash-Ziel und klappt dabei
 * umschließende <details> auf. Nötig, weil Next.js App-Router bei Client-Navigation
 * NICHT den nativen Fragment-Mechanismus auslöst (der sonst <details> auto-öffnet)
 * und ein Ziel in einem geschlossenen <details> (display:none) nicht anspringen kann.
 *
 * Einsatz: einmal auf Seiten mit ankerbaren, einklappbaren Inhalten rendern
 * (z.B. Berlin-Sitzungs-Detailseite — Deep-Links aus der Suche auf einzelne Reden).
 */
export function HashDetailsScroller() {
  useEffect(() => {
    function go() {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      // Alle umschließenden <details> aufklappen, damit das Ziel sichtbar wird.
      let p: HTMLElement | null = el.parentElement;
      while (p) {
        if (p.tagName === "DETAILS") (p as HTMLDetailsElement).open = true;
        p = p.parentElement;
      }
      // Nach dem Aufklappen (Layout-Shift) im nächsten Frame scrollen — scroll-mt
      // der Zielelemente sorgt für den Offset unter dem Sticky-Header.
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "start" });
        // Kurzes Aufleuchten der Ziel-Zeile (das :target greift nur am unsichtbaren
        // Anker-Span, nicht an der umschließenden <li> — daher hier von Hand).
        const row = el.closest("li") ?? el;
        if (row instanceof HTMLElement) {
          row.style.transition = "background-color 0.4s ease";
          row.style.backgroundColor = "rgba(254, 243, 199, 0.7)"; // amber-100/70
          setTimeout(() => { row.style.backgroundColor = ""; }, 1800);
        }
      });
    }
    // Initial (Mount nach Navigation) + bei reinen Hash-Wechseln.
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  return null;
}
