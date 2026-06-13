"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import type { SuchVorschlag } from "@/lib/such-vorschlaege";

// Umlaut-/Akzent-tolerantes Matching („muller" findet „Müller")
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function SearchBox({
  searchPath = "/suche",
  placeholder = 'Name, Thema oder deine PLZ – z.B. „10115"',
  vorschlaege,
}: {
  /** Zielseite der Suche — z.B. "/parlamente/berlin/suche" für Berlin-Scope. */
  searchPath?: string;
  placeholder?: string;
  /** Wortfüll-Vorschläge (Namen + Themen): Auswahl füllt das Feld, Enter sucht. */
  vorschlaege?: SuchVorschlag[];
} = {}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Ranking: Präfix vor Wortanfang vor Teilstring — bei Gleichstand Originalreihenfolge
  const treffer = useMemo(() => {
    if (!vorschlaege || norm(query.trim()).length < 2) return [];
    const q = norm(query.trim());
    const rang = (v: string): number => {
      const n = norm(v);
      if (n.startsWith(q)) return 0;
      if (n.includes(` ${q}`) || n.includes(`-${q}`)) return 1;
      if (n.includes(q)) return 2;
      return 3;
    };
    return vorschlaege
      .map((s) => ({ s, r: rang(s.v) }))
      .filter((x) => x.r < 3)
      .sort((a, b) => a.r - b.r)
      .slice(0, 8)
      .map((x) => x.s);
  }, [vorschlaege, query]);

  const zeigeListe = open && treffer.length > 0;

  function uebernehmen(v: string) {
    setQuery(v);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!zeigeListe) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % treffer.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? treffer.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      // Wortfüllung: erster Enter übernimmt, zweiter sucht
      e.preventDefault();
      uebernehmen(treffer[active].v);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

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
      setOpen(false);
      // Smarte PLZ-Erkennung (nur Bundestag-Suche): reine 5-stellige Eingabe führt
      // direkt zum Wahlkreis-Finder statt zur Volltextsuche. Berlin hat (noch) keine
      // Wahlkreis-Geometrie → dort normal weitersuchen.
      const isBundestag = searchPath === "/suche";
      const target =
        isBundestag && /^\d{5}$/.test(q)
          ? `/wahlkreis?plz=${q}`
          : `${searchPath}?q=${encodeURIComponent(q)}`;
      startTransition(() => {
        router.push(target);
      });
    }
    // Sonst übernimmt das Form-action als HTML-Fallback (PLZ fängt /suche serverseitig ab)
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
          ref={inputRef}
          type="text"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={zeigeListe}
          aria-autocomplete="list"
          className="w-full pl-12 pr-28 py-4 rounded-2xl border border-border bg-white text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-base shadow-sm dark:bg-zinc-900 dark:focus:ring-white/10 dark:focus:border-zinc-500"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suchen"}
        </button>
      </div>
      {zeigeListe && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1.5 text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {treffer.map((t, i) => (
            <li key={`${t.typ}:${t.v}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                // mousedown statt click: feuert vor dem Input-Blur, der die Liste schließt
                onMouseDown={(e) => {
                  e.preventDefault();
                  uebernehmen(t.v);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-[14px] transition-colors ${
                  i === active ? "bg-zinc-100 dark:bg-zinc-800" : ""
                } text-zinc-900 dark:text-zinc-100`}
              >
                <span className="truncate">{t.v}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wider text-zinc-400">
                  {t.typ}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
