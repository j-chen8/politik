"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export function SearchBox({
  searchPath = "/suche",
  placeholder = 'Name oder Thema – z.B. „Bürgergeld"',
}: {
  /** Zielseite der Suche — z.B. "/parlamente/berlin/suche" für Berlin-Scope. */
  searchPath?: string;
  placeholder?: string;
} = {}) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Aktuellen Wert direkt aus dem DOM holen — robuster bei nicht voll-hydrierter Seite
    const form = e.currentTarget;
    const data = new FormData(form);
    const q = String(data.get("q") ?? "").trim();
    if (!q) {
      e.preventDefault();
      return;
    }
    // Wenn JS gehydriert: client-side routing
    if (typeof window !== "undefined") {
      e.preventDefault();
      startTransition(() => {
        router.push(`${searchPath}?q=${encodeURIComponent(q)}`);
      });
    }
    // Sonst übernimmt das Form-action als HTML-Fallback
  }

  return (
    <form
      action={searchPath}
      method="get"
      onSubmit={handleSubmit}
      className="relative max-w-lg mx-auto w-full"
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-28 py-4 rounded-2xl border border-border bg-white text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-base shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suchen"}
        </button>
      </div>
    </form>
  );
}
