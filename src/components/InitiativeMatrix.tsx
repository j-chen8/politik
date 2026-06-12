"use client";

import { useState } from "react";
import Link from "next/link";
import { partyColors } from "@/lib/party-colors";
import type { InitiativeMatrix as MatrixData } from "@/lib/db";

const shortField = (f: string) => f.split(",")[0].replace(" und Aufenthaltsrecht", "").replace(" und internationale Beziehungen", "");

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

export function InitiativeMatrix({ data }: { data: MatrixData }) {
  const [sel, setSel] = useState<{ field: string; frak: string } | null>(null);
  const [relativ, setRelativ] = useState(false);
  const { fraktionen, fields, cells } = data;
  // Nenner für die %-Sicht: Summe aller Themen-Nennungen der Fraktion (Spalte = 100 %)
  const totals: Record<string, number> = {};
  for (const fr of fraktionen)
    totals[fr.name] = fields.reduce((s, f) => s + (cells[fr.name]?.[f]?.count ?? 0), 0);

  // Intensität pro Spalte (Fraktion): eigenes Schwerpunkt-Profil sichtbar machen
  const colMax: Record<string, number> = {};
  for (const fr of fraktionen) colMax[fr.name] = Math.max(1, ...fields.map((f) => cells[fr.name]?.[f]?.count ?? 0));

  const selCell = sel ? cells[sel.frak]?.[sel.field] : null;

  return (
    <div>
      <div className="flex items-center justify-center gap-1 mb-3 text-[11.5px]">
        {([false, true] as const).map((mode) => (
          <button
            key={String(mode)}
            onClick={() => setRelativ(mode)}
            className={`px-2 py-0.5 rounded-full border transition-colors ${
              relativ === mode
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
            }`}
          >
            {mode ? "in % der Fraktion" : "absolut"}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-[12px] mx-auto">
          <thead>
            <tr>
              <th className="text-left font-medium text-zinc-400 pb-2 pr-3 align-bottom">Themenfeld</th>
              {fraktionen.map((fr) => {
                const c = partyColors(fr.name);
                return (
                  <th key={fr.name} className="px-1 pb-2 align-bottom" title={`${fr.name}: ${fr.total} Initiativen`}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap"
                        style={{ background: c.bg, color: c.fg }}>{fr.name}</span>
                      <span className="num text-[11px] text-zinc-500">{fr.total.toLocaleString("de-DE")}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field} className="border-t border-zinc-100">
                <td className="py-1 pr-3 text-zinc-700 whitespace-nowrap" title={field}>{shortField(field)}</td>
                {fraktionen.map((fr) => {
                  const cell = cells[fr.name]?.[field];
                  const count = cell?.count ?? 0;
                  const c = partyColors(fr.name);
                  const intensity = count / colMax[fr.name];
                  const isSel = sel?.field === field && sel?.frak === fr.name;
                  return (
                    <td key={fr.name} className="p-0.5 text-center">
                      <button
                        disabled={!count}
                        onClick={() => setSel(isSel ? null : { field, frak: fr.name })}
                        className={`w-full min-w-[52px] rounded py-1 num tabular-nums transition-all ${count ? "cursor-pointer hover:ring-2 hover:ring-zinc-900/20" : "cursor-default text-zinc-300"} ${isSel ? "ring-2 ring-zinc-900" : ""}`}
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

      {sel && selCell && (
        <div className="mt-4 border border-zinc-200 rounded-xl p-4 bg-zinc-50/60">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-medium text-zinc-900">
              <span style={{ color: partyColors(sel.frak).bg }}>{sel.frak}</span> · {sel.field}
              <span className="text-zinc-400 font-normal"> — {selCell.count} Initiativen</span>
            </p>
            <button onClick={() => setSel(null)} className="text-zinc-400 hover:text-zinc-900 text-[12px]">schließen ✕</button>
          </div>
          <ul className="space-y-1.5">
            {selCell.items.map((it) => (
              <li key={it.nr} className="text-[12.5px] leading-snug">
                <Link href={`/aktivitaeten/${it.nr.replace("/", "-")}`} className="text-zinc-600 hover:text-zinc-950 hover:underline">
                  {it.titel}
                </Link>
              </li>
            ))}
          </ul>
          {selCell.count > selCell.items.length && (
            <p className="text-[11.5px] text-zinc-400 mt-2">+{selCell.count - selCell.items.length} weitere</p>
          )}
        </div>
      )}
      <p className="text-[11px] text-zinc-400 mt-3">
        {relativ
          ? "Prozent = Anteil des Themenfelds an allen Themen-Nennungen der Fraktion (Spalte summiert auf 100 %; eine Initiative kann mehrere Felder tragen)."
          : "Farbintensität = Schwerpunkt innerhalb der Fraktion (Spalte)."}{" "}
        Zelle anklicken für die Drucksachen.
      </p>
    </div>
  );
}
