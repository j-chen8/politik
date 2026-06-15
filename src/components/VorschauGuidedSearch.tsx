"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, X, LayoutGrid, Landmark, FileText, MessageSquareQuote } from "lucide-react";
import { CITIZEN_TOPICS } from "@/lib/citizen-topics";

/**
 * Geführte Suche im ChatGPT-Stil (User-Ansage 2026-06-06): unter dem Feld stehen
 * wenige Such-Richtungen als Chips. Klick auf eine → die anderen verschwinden, die
 * gewählte wird zum abschaltbaren Filter, und es erscheinen tiefere Optionen.
 * Ersetzt Modus-Dropdown UND Erkunden-Buttons.
 *
 * Vier Richtungen: Themen · Parteien · Drucksachen · Texte. „Themen" und „Parteien"
 * klappen zu konkreten Filtern auf (Themenfelder bzw. Fraktionen); „Drucksachen" und
 * „Texte" setzen den Such-Typ für die Freitext-Eingabe. Freie Volltextsuche über
 * ALLES bleibt: einfach ohne Kategorie tippen (PLZ wird auf der Suchseite zum
 * Wahlkreis umgeleitet).
 */

type SearchType = "speeches" | "topics" | "drucksachen";

interface Suggestion {
  key: string;
  label: string;
  /** Leaf: Klick navigiert direkt hierhin. */
  href: string;
}

interface Category {
  key: string;
  label: string;
  Icon: typeof LayoutGrid;
  /** Such-Typ für Freitext-Submit (fehlt → Unter-Optionen statt Freitext). */
  type?: SearchType;
  placeholder: string;
  /** Tiefere Optionen, die nach der Auswahl erscheinen. */
  children?: Suggestion[];
}

const TOPIC_CHILDREN: Suggestion[] = CITIZEN_TOPICS.map((t) => ({
  key: t.slug,
  label: t.label,
  // Themen MIT aw_field → Facetten-Filter (alle Inhalte mit diesem Thema).
  // themaMatch-only-Themen (Rente, Krieg) haben kein aw_field → normale Textsuche.
  href:
    t.awFields && t.awFields.length > 0
      ? `/suche?thema=${t.slug}`
      : `/suche?q=${encodeURIComponent(t.label)}`,
}));

// Fraktionen des aktuellen Bundestags. Token = Teilstring, den die Politiker-Seite
// auf den exakten Fraktions-Label auflöst (/politiker?partei=…).
const PARTY_CHILDREN: Suggestion[] = [
  { key: "cdu", label: "CDU", href: "/politiker?partei=cdu" },
  { key: "csu", label: "CSU", href: "/politiker?partei=csu" },
  { key: "spd", label: "SPD", href: "/politiker?partei=spd" },
  { key: "gruene", label: "Grüne", href: "/politiker?partei=gr%C3%BCn" },
  { key: "afd", label: "AfD", href: "/politiker?partei=afd" },
  { key: "linke", label: "Die Linke", href: "/politiker?partei=linke" },
];

const CATEGORIES: Category[] = [
  {
    key: "thema",
    label: "Themen",
    Icon: LayoutGrid,
    placeholder: "Themenfeld antippen oder durchsuchen …",
    children: TOPIC_CHILDREN,
  },
  {
    key: "partei",
    label: "Parteien",
    Icon: Landmark,
    placeholder: "Fraktion antippen …",
    children: PARTY_CHILDREN,
  },
  {
    key: "drucksache",
    label: "Drucksachen",
    Icon: FileText,
    type: "drucksachen",
    placeholder: "Gesetz, Antrag, Anfrage …",
  },
  {
    key: "text",
    label: "Texte",
    Icon: MessageSquareQuote,
    type: "speeches",
    placeholder: "In Reden & Wortbeiträgen suchen …",
  },
];

export function VorschauGuidedSearch() {
  const router = useRouter();
  const [catKey, setCatKey] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const cat = useMemo(() => CATEGORIES.find((c) => c.key === catKey) ?? null, [catKey]);
  const placeholder = cat?.placeholder ?? "Suche in Themen, Reden, Drucksachen, Personen …";
  const canSubmit = q.trim().length >= 2;

  function pickCategory(key: string) {
    setCatKey(key);
    inputRef.current?.focus();
  }

  function clearCategory() {
    setCatKey(null);
    inputRef.current?.focus();
  }

  function submit() {
    if (!canSubmit) return;
    // Mit Such-Typ → typisierte Suche; sonst Volltext über alles (Suchseite leitet PLZ um).
    const typeParam = cat?.type ? `&type=${cat.type}` : "";
    router.push(`/suche?q=${encodeURIComponent(q.trim())}${typeParam}`);
  }

  return (
    <div className="relative">
      {/* Eingabefeld */}
      <div className="rounded-[28px] border border-zinc-300 bg-card p-2.5 shadow-sm transition focus-within:border-zinc-900 focus-within:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-400">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
              // Backspace bei leerem Feld entfernt den aktiven Filter
              if (e.key === "Backspace" && q.length === 0 && cat) clearCategory();
            }}
            placeholder={placeholder}
            aria-label={cat ? `Suche — ${cat.label}` : "Suche"}
            className="w-full bg-transparent px-3 py-2 text-[16px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            aria-label="Suchen"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition enabled:hover:bg-zinc-700 disabled:opacity-25 dark:bg-zinc-100 dark:text-zinc-900 dark:enabled:hover:bg-white"
          >
            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Chip-Zeile: aktiver Filter + Optionen */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {cat && (
          <button
            type="button"
            onClick={clearCategory}
            className="flex items-center gap-1.5 rounded-full bg-[#1a3e72] dark:bg-[#8fb3e6] py-1.5 pl-3 pr-2 text-[13.5px] font-medium text-white transition hover:bg-[#16335f]"
          >
            <cat.Icon className="h-[15px] w-[15px]" strokeWidth={2} />
            {cat.label}
            <X className="h-[15px] w-[15px] opacity-80" strokeWidth={2.5} />
          </button>
        )}

        {/* Ebene 0: Richtungen — Ebene 1: konkrete Optionen der gewählten Richtung */}
        {!cat
          ? CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => pickCategory(c.key)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1.5 pl-2.5 pr-3 text-[13.5px] font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <c.Icon className="h-[15px] w-[15px] text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
                {c.label}
              </button>
            ))
          : cat.children?.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => router.push(s.href)}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13.5px] font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {s.label}
              </button>
            ))}
      </div>
    </div>
  );
}
