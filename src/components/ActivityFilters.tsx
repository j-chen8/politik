"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, MessageSquare, Mic, FileText, Scale } from "lucide-react";

const filters = [
  { key: undefined, label: "Alle", icon: undefined },
  { key: "fragen", label: "Fragen", icon: MessageSquare },
  { key: "reden", label: "Reden", icon: Mic },
  { key: "antraege", label: "Anträge", icon: FileText },
  { key: "gesetze", label: "Gesetze", icon: Scale },
] as const;

interface Props {
  activeTyp?: string;
  query?: string;
  basePath?: string;
}

export function ActivityFilters({ activeTyp, query, basePath = "/aktivitaeten" }: Props) {
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function navigate(typ?: string, q?: string) {
    const params = new URLSearchParams();
    if (typ) params.set("typ", typ);
    if (q) params.set("q", q);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(activeTyp, searchQuery.trim() || undefined);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suche nach Politiker oder Thema..."
          className="w-full pl-10 pr-24 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center gap-1.5"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Suchen"}
        </button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => {
          const isActive = activeTyp === f.key || (!activeTyp && !f.key);
          const Icon = f.icon;
          return (
            <button
              key={f.label}
              onClick={() => navigate(f.key, searchQuery.trim() || undefined)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-muted border border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
