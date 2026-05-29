"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "Back-to-Top"-Button. Erscheint nach 600px Scroll,
 * unten rechts, dezent.
 */
export function BackToTopButton({ threshold = 600 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;
    const check = () => {
      rafId = null;
      setVisible(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Zum Seitenanfang"
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-zinc-950 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}
