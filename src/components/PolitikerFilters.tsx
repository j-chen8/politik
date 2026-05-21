"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface Props {
  parliaments: { id: number; label: string; type: string }[];
  parties: { id: number; label: string; count: number }[];
  activeParliament?: string;
  activeParty?: string;
  query?: string;
  basePath?: string;
}

export function PolitikerFilters({ parliaments, parties, activeParliament, activeParty, query, basePath = "/politiker" }: Props) {
  const [searchQuery, setSearchQuery] = useState(query || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function navigate(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const vals = {
      q: searchQuery.trim() || undefined,
      parlament: activeParliament,
      partei: activeParty,
      ...overrides,
    };
    Object.entries(vals).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({});
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Name suchen..."
          className="w-full pl-10 pr-24 py-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-all flex items-center gap-1.5"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Suchen"}
        </button>
      </form>

      <div className="flex gap-6 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted mb-1 block">Parlament</label>
          <select
            value={activeParliament || ""}
            onChange={(e) => navigate({ parlament: e.target.value || undefined, seite: undefined })}
            className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
          >
            <option value="">Alle Parlamente</option>
            {parliaments.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.type === "eu" ? "🇪🇺" : p.type === "bundestag" ? "🇩🇪" : "🏛️"} {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted mb-1 block">Partei</label>
          <select
            value={activeParty || ""}
            onChange={(e) => navigate({ partei: e.target.value || undefined, seite: undefined })}
            className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
          >
            <option value="">Alle Parteien</option>
            {parties.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.label} ({p.count})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
