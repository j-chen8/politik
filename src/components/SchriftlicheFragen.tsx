"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { PoliticianQaPaar } from "@/lib/db";
import { feldEmoji, feldKurz } from "@/lib/themenfeld-slug";

const PAGE_STEP = 8;

/** „2025-03-14" → „14.03.2025"; Rohwert wenn unparsbar. */
function fmtDatum(d: string | null): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : d;
}

function QaCard({ item }: { item: PoliticianQaPaar }) {
  const datum = fmtDatum(item.datum);
  return (
    <li className="border-l-2 border-zinc-200 pl-3">
      {item.frageText && (
        <p className="text-[13px] text-zinc-800 leading-snug">{item.frageText}</p>
      )}
      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1 flex-wrap">
        {item.themenfeld && (
          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px]">
            <span aria-hidden>{feldEmoji(item.themenfeld)}</span> {feldKurz(item.themenfeld)}
          </span>
        )}
        {item.ministerium && <span className="text-zinc-500">{item.ministerium}</span>}
        <Link
          href={`/aktivitaeten/${item.drucksacheNr.replace(/\//g, "-")}`}
          className="text-[#1a3e72] hover:text-[#0f2a52] transition-colors"
        >
          {item.drucksacheNr}
        </Link>
        {datum && (
          <>
            <span className="text-zinc-200">·</span>
            <span className="num">{datum}</span>
          </>
        )}
      </div>
      {/* Neutrale Antwort-Kurzfassung (scan-first) */}
      {item.tldr && (
        <p className="mt-1.5 text-[12px] text-zinc-700 leading-relaxed">{item.tldr}</p>
      )}
      {item.antwortText && (
        <details className="group mt-1">
          <summary className="cursor-pointer text-[11px] text-[#1a3e72] hover:text-[#0f2a52] select-none list-none">
            <span className="group-open:hidden">▶ {item.tldr ? "Volle Antwort der Bundesregierung" : "Antwort der Bundesregierung"}</span>
            <span className="hidden group-open:inline">▼ Antwort ausblenden</span>
          </summary>
          <p className="mt-1 text-[12px] text-zinc-600 leading-relaxed whitespace-pre-line border-l-2 border-zinc-100 pl-3">
            {item.antwortText}
          </p>
        </details>
      )}
    </li>
  );
}

export function SchriftlicheFragen({ items }: { items: PoliticianQaPaar[] }) {
  const [feld, setFeld] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_STEP);

  // Themenfeld-Filter aus den Primär-Tags der Fragen ableiten (häufigste zuerst).
  const felder = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      if (it.themenfeld) counts.set(it.themenfeld, (counts.get(it.themenfeld) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([f, c]) => ({ feld: f, count: c }));
  }, [items]);

  const filtered = useMemo(
    () => (feld ? items.filter((it) => it.themenfeld === feld) : items),
    [items, feld]
  );

  const shown = filtered.slice(0, visible);
  const rest = filtered.length - shown.length;

  function pickFeld(f: string | null) {
    setFeld(f);
    setVisible(PAGE_STEP);
  }

  return (
    <div>
      {/* Themenfeld-Filter */}
      {felder.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => pickFeld(null)}
            className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
              feld === null
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            Alle <span className="num opacity-60">{items.length}</span>
          </button>
          {felder.slice(0, 14).map((f) => (
            <button
              key={f.feld}
              type="button"
              onClick={() => pickFeld(f.feld)}
              className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                feld === f.feld
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span aria-hidden>{feldEmoji(f.feld)}</span> {feldKurz(f.feld)}{" "}
              <span className="num opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((it) => (
          <QaCard key={`${it.drucksacheNr}-${it.paarIndex}`} item={it} />
        ))}
      </ul>

      {rest > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_STEP * 2)}
          className="mt-3 inline-flex items-center gap-1 text-[12px] text-[#1a3e72] hover:text-[#0f2a52] transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          {rest.toLocaleString("de-DE")} weitere anzeigen
        </button>
      )}

      {/* Substrat-Ehrlichkeit: was diese Liste ist (Kontroll-Aktivität des Büros, nicht persönliches Interesse). */}
      <p className="mt-4 text-[11px] text-zinc-400 leading-relaxed">
        Schriftliche Einzelfragen an die Bundesregierung — eine parlamentarische Kontroll-Aktivität des
        Abgeordnetenbüros. Kurzfassungen der Antworten sind neutral zusammengefasst; die volle Antwort
        steht jeweils darunter.
      </p>
    </div>
  );
}
