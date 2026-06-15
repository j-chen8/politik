"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

/**
 * Signatur-„Wow" der Vorschau-Homepage (Research 2026-06-05): EIN interaktives
 * Explorable statt Deko — Leser tippt eine echte Abstimmung an und sieht sofort,
 * worum es ging und wie sie ausging. Neutral-by-format: Reihenfolge = Datum,
 * kein Ranking; Ausgang faktisch (angenommen/abgelehnt), nicht bewertet.
 */

export interface VorschauVote {
  id: string;
  label: string | null;
  summary: string | null;
  outcome: string;
  outcomeLabel: string;
  type: string;
  date: string | null;
  href: string;
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function outcomeTone(outcome: string): string {
  if (outcome === "angenommen") return "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40";
  if (outcome === "abgelehnt") return "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40";
  return "text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800";
}

export function VorschauVoteExplorer({ votes }: { votes: VorschauVote[] }) {
  const [open, setOpen] = useState<string | null>(votes[0]?.id ?? null);

  return (
    <div className="rounded-3xl border border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="px-5 pt-5 pb-3 sm:px-6">
        <h2 className="text-[19px] sm:text-[21px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
          Wie hat der Bundestag zuletzt entschieden?
        </h2>
        <p className="mt-1 text-[13.5px] text-zinc-500 dark:text-zinc-400">
          Tippe eine Abstimmung an — worum es ging und wie sie ausging.
        </p>
      </div>

      <ul className="divide-y divide-border dark:divide-zinc-800">
        {votes.map((v) => {
          const isOpen = open === v.id;
          return (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : v.id)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50/80 sm:px-6 dark:hover:bg-zinc-800/40"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${outcomeTone(
                    v.outcome
                  )}`}
                >
                  {v.outcomeLabel}
                </span>
                <span className="min-w-0 flex-1 text-[14.5px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                  {v.label ?? "Abstimmung"}
                </span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.25}
                />
              </button>

              {/* Aufklapp-Animation per grid-rows-Trick (0fr→1fr), respektiert reduced-motion via Tailwind-Default. */}
              <div
                className={`grid px-5 transition-all duration-300 ease-out sm:px-6 ${
                  isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  {v.summary && (
                    <p className="text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {v.summary}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {v.type === "namentlich" ? "Namentliche Abstimmung" : "Handzeichen"}
                    </span>
                    {v.date && <span className="num">{formatDate(v.date)}</span>}
                    <Link
                      href={v.href}
                      className="ml-auto font-medium text-[#1a3e72] dark:text-[#8fb3e6] hover:underline dark:text-blue-400"
                    >
                      Zur Abstimmung →
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
