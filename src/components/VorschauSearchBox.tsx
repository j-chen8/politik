"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUp,
  ChevronDown,
  Check,
  Users,
  FileText,
  MessageSquareQuote,
  Vote,
  LayoutGrid,
  MapPin,
  Sparkles,
} from "lucide-react";

type Mode = {
  key: string;
  label: string;
  Icon: typeof Search;
  placeholder: string;
  /** baut das Ziel-URL aus der Eingabe */
  href: (q: string) => string;
  /** numerische Eingabe (z. B. PLZ) */
  numeric?: boolean;
};

const MODES: Mode[] = [
  {
    key: "alles",
    label: "Alles",
    Icon: Sparkles,
    placeholder: "Suche in Reden, Drucksachen, Personen …",
    href: (q) => `/suche?q=${encodeURIComponent(q)}`,
  },
  {
    key: "politicians",
    label: "Personen",
    Icon: Users,
    placeholder: "Name einer/eines Abgeordneten, z. B. Merz",
    href: (q) => `/suche?q=${encodeURIComponent(q)}&type=politicians`,
  },
  {
    key: "drucksachen",
    label: "Drucksachen",
    Icon: FileText,
    placeholder: "Gesetz, Antrag, Anfrage …",
    href: (q) => `/suche?q=${encodeURIComponent(q)}&type=drucksachen`,
  },
  {
    key: "speeches",
    label: "Reden",
    Icon: MessageSquareQuote,
    placeholder: "Wer hat worüber gesprochen?",
    href: (q) => `/suche?q=${encodeURIComponent(q)}&type=speeches`,
  },
  {
    key: "votes",
    label: "Abstimmungen",
    Icon: Vote,
    placeholder: "Worüber wurde abgestimmt?",
    href: (q) => `/suche?q=${encodeURIComponent(q)}&type=votes`,
  },
  {
    key: "topics",
    label: "Themen",
    Icon: LayoutGrid,
    placeholder: "Thema, z. B. Klima · Migration · Rente",
    href: (q) => `/suche?q=${encodeURIComponent(q)}&type=topics`,
  },
  {
    key: "wahlkreis",
    label: "Mein Wahlkreis",
    Icon: MapPin,
    placeholder: "Postleitzahl, z. B. 50667",
    href: (q) => `/wahlkreis?plz=${encodeURIComponent(q.trim())}`,
    numeric: true,
  },
];

export function VorschauSearchBox() {
  const router = useRouter();
  const [modeKey, setModeKey] = useState("alles");
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mode = MODES.find((m) => m.key === modeKey) ?? MODES[0];
  const canSubmit = mode.numeric ? /^\d{5}$/.test(q.trim()) : q.trim().length >= 2;

  // Klick außerhalb schließt das Modus-Menü
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function submit() {
    if (!canSubmit) return;
    router.push(mode.href(q.trim()));
  }

  function pickMode(key: string) {
    setModeKey(key);
    setMenuOpen(false);
    // numerische Eingabe verwerfen, wenn der Modus wechselt
    setQ((prev) => (MODES.find((m) => m.key === key)?.numeric ? prev.replace(/\D/g, "") : prev));
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="rounded-[28px] border border-zinc-300 bg-white p-2.5 shadow-sm transition focus-within:border-zinc-900 focus-within:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-400">
        {/* Eingabezeile */}
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => setQ(mode.numeric ? e.target.value.replace(/\D/g, "").slice(0, 5) : e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          inputMode={mode.numeric ? "numeric" : "text"}
          placeholder={mode.placeholder}
          aria-label={`Suche — Modus ${mode.label}`}
          className="w-full bg-transparent px-3 pb-2 pt-2 text-[16px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />

        {/* Steuerzeile: Modus links, Senden rechts */}
        <div className="flex items-center justify-between gap-2 pl-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-2 text-[13px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <mode.Icon className="h-[15px] w-[15px] text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
            {mode.label}
            <ChevronDown className={`h-[14px] w-[14px] text-zinc-400 transition ${menuOpen ? "rotate-180" : ""}`} strokeWidth={2.5} />
          </button>

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

      {/* Modus-Menü */}
      {menuOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-[15rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {MODES.map((m) => {
            const active = m.key === modeKey;
            return (
              <button
                key={m.key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pickMode(m.key)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px] text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <m.Icon className="h-[17px] w-[17px] text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
                <span className="flex-1">{m.label}</span>
                {active && <Check className="h-[15px] w-[15px] text-zinc-900 dark:text-zinc-100" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
