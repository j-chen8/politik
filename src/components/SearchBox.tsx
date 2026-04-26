"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    if (!query.trim()) return;
    e.preventDefault();
    startTransition(() => {
      router.push(`/suche?q=${encodeURIComponent(query.trim())}`);
    });
  }

  // Native action="/suche" method="get" als Fallback, falls JS noch nicht
  // hydratiert ist (z.B. über langsame Verbindung). Dann funktioniert es
  // wie ein normales HTML-Form: Browser navigiert zu /suche?q=...
  return (
    <form action="/suche" method="get" onSubmit={handleSubmit} className="relative max-w-lg mx-auto w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input
          type="text"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name eingeben, z.B. &quot;Friedrich Merz&quot;"
          className="w-full pl-12 pr-28 py-4 rounded-2xl border border-border bg-white text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base shadow-sm"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Suchen"
          )}
        </button>
      </div>
    </form>
  );
}
