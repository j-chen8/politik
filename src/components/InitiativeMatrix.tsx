"use client";

import { useState } from "react";
import Link from "next/link";
import { partyColors } from "@/lib/party-colors";
import type { InitiativeMatrix as MatrixData, InitiativeArt } from "@/lib/db";

const shortField = (f: string) => f.split(",")[0].replace(" und Aufenthaltsrecht", "").replace(" und internationale Beziehungen", "");

const ART_LABEL: Record<InitiativeArt, string> = {
  ini: "Anträge + Gesetzentwürfe",
  ka: "Kleine Anfragen",
  alle: "alle Drucksachen",
};

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16), g = parseInt(full.slice(2, 4), 16), b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function fmtPct(count: number, total: number): string {
  const pct = (count / Math.max(1, total)) * 100;
  if (pct >= 10) return `${Math.round(pct)} %`;
  return `${pct.toFixed(1).replace(".", ",")} %`;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded-full border transition-colors ${
        active ? "border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white" : "border-border text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

export function InitiativeMatrix({ data }: { data: MatrixData }) {
  const [sel, setSel] = useState<{ field: string; frak: string } | null>(null);
  const [art, setArt] = useState<InitiativeArt>("ini");
  const [relativ, setRelativ] = useState(false);
  const { fraktionen, fields, cells } = data;

  // Nenner für die %-Sicht: Summe aller Themen-Nennungen der Fraktion im Modus (Spalte = 100 %)
  const totals: Record<string, number> = {};
  for (const fr of fraktionen)
    totals[fr.name] = fields.reduce((s, f) => s + (cells[fr.name]?.[f]?.counts[art] ?? 0), 0);

  // Intensität pro Spalte (Fraktion): eigenes Schwerpunkt-Profil sichtbar machen
  const colMax: Record<string, number> = {};
  for (const fr of fraktionen)
    colMax[fr.name] = Math.max(1, ...fields.map((f) => cells[fr.name]?.[f]?.counts[art] ?? 0));

  const selCell = sel ? cells[sel.frak]?.[sel.field] : null;
  const selItems = (selCell?.items ?? []).filter((it) => art === "alle" || it.art === art);
  const selCount = selCell?.counts[art] ?? 0;

  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-2 text-[11.5px] flex-wrap">
        {(Object.keys(ART_LABEL) as InitiativeArt[]).map((a) => (
          <Pill key={a} active={art === a} onClick={() => setArt(a)}>{ART_LABEL[a]}</Pill>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1 mb-3 text-[11.5px]">
        {([false, true] as const).map((mode) => (
          <Pill key={String(mode)} active={relativ === mode} onClick={() => setRelativ(mode)}>
            {mode ? "in % der Fraktion" : "absolut"}
          </Pill>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-[12px] mx-auto">
          <thead>
            <tr>
              <th className="text-left font-medium text-zinc-400 dark:text-zinc-500 pb-2 pr-3 align-bottom">Themenfeld</th>
              {fraktionen.map((fr) => {
                const c = partyColors(fr.name);
                return (
                  <th key={fr.name} className="px-1 pb-2 align-bottom" title={`${fr.name}: ${fr.totals[art]} Drucksachen (${ART_LABEL[art]})`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap"
                        style={{ background: c.bg, color: c.fg }}>{fr.name}</span>
                      <span className="num text-[11px] text-zinc-500 dark:text-zinc-400">{fr.totals[art].toLocaleString("de-DE")}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field} className="border-t border-border">
                <td className="py-1 pr-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap" title={field}>{shortField(field)}</td>
                {fraktionen.map((fr) => {
                  const count = cells[fr.name]?.[field]?.counts[art] ?? 0;
                  const c = partyColors(fr.name);
                  const intensity = count / colMax[fr.name];
                  const isSel = sel?.field === field && sel?.frak === fr.name;
                  return (
                    <td key={fr.name} className="p-0.5 text-center">
                      <button
                        disabled={!count}
                        onClick={() => setSel(isSel ? null : { field, frak: fr.name })}
                        className={`w-full min-w-[52px] rounded py-1 num tabular-nums transition-all ${count ? "cursor-pointer hover:ring-2 hover:ring-zinc-900/20 dark:hover:ring-zinc-100/20" : "cursor-default text-zinc-300 dark:text-zinc-600"} ${isSel ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""}`}
                        style={count ? { background: hexToRgba(c.bg, 0.12 + intensity * 0.85), color: intensity > 0.5 ? c.fg : "#27272a" } : undefined}
                      >{count ? (relativ ? fmtPct(count, totals[fr.name]) : count) : "·"}</button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sel && selCell && selCount > 0 && (
        <div className="mt-4 border border-border rounded-xl p-4 bg-zinc-50/60 dark:bg-zinc-800/60">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              <span style={{ color: partyColors(sel.frak).bg }}>{sel.frak}</span> · {sel.field}
              <span className="text-zinc-400 dark:text-zinc-500 font-normal"> — {selCount} {ART_LABEL[art]}</span>
            </p>
            <button onClick={() => setSel(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-[12px]">schließen ✕</button>
          </div>
          <ul className="space-y-1.5">
            {selItems.map((it) => (
              <li key={it.nr + it.titel} className="text-[12.5px] leading-snug">
                <Link href={`/aktivitaeten/${it.nr.replace("/", "-")}`} className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 hover:underline">
                  {it.titel}
                </Link>
              </li>
            ))}
          </ul>
          {selCount > selItems.length && (
            <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-2">+{selCount - selItems.length} weitere</p>
          )}
        </div>
      )}
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3 text-center">
        {relativ
          ? "Prozent = Anteil des Themenfelds an allen Themen-Nennungen der Fraktion im gewählten Modus (Spalte summiert auf 100 %; eine Drucksache kann mehrere Felder tragen)."
          : "Farbintensität = Schwerpunkt innerhalb der Fraktion (Spalte)."}{" "}
        Zelle anklicken für die Drucksachen.
      </p>
    </div>
  );
}
