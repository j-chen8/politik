"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BuergerfragenData, BuergerfrageItem } from "@/lib/db";

const PAGE_STEP = 8;

/** Tag-Datum „2025-03-14" → „14.03.2025"; gibt Rohwert zurück, wenn unparsbar. */
function fmtDatum(d: string | null): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : d;
}

function FrageCard({ item }: { item: BuergerfrageItem }) {
  const datum = fmtDatum(item.frageDatum);
  return (
    <li className="border-l-2 border-zinc-200 pl-3">
      {item.frageText && (
        <p className="text-[13px] text-zinc-800 leading-snug">{item.frageText}</p>
      )}
      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
        {item.asker && <span>{item.asker}</span>}
        {datum && (
          <>
            {item.asker && <span className="text-zinc-200">·</span>}
            <span className="num">{datum}</span>
          </>
        )}
        {item.topics.slice(0, 4).map((t) => (
          <span
            key={t}
            className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[10px]"
          >
            {t}
          </span>
        ))}
        {item.frageUrl && (
          <a
            href={item.frageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1a3e72] hover:text-[#0f2a52] underline-offset-2 hover:underline"
          >
            ↗ Original
          </a>
        )}
      </div>
      {item.antwortText && (
        <details className="group mt-1">
          <summary className="cursor-pointer text-[11px] text-[#1a3e72] hover:text-[#0f2a52] select-none list-none">
            <span className="group-open:hidden">▶ Antwort anzeigen</span>
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

export function Buergerfragen({ data }: { data: BuergerfragenData }) {
  const [topic, setTopic] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_STEP);

  const filtered = useMemo(
    () => (topic ? data.items.filter((it) => it.topics.includes(topic)) : data.items),
    [data.items, topic]
  );

  const shown = filtered.slice(0, visible);
  const rest = filtered.length - shown.length;

  function pickTopic(t: string | null) {
    setTopic(t);
    setVisible(PAGE_STEP);
  }

  return (
    <div>
      {/* Antwortquote als Fakt + neutraler Vergleichswert */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] text-zinc-600 mb-1">
        <span>
          <span className="num font-medium text-zinc-900">
            {data.beantwortet.toLocaleString("de-DE")}
          </span>{" "}
          von{" "}
          <span className="num">{data.total.toLocaleString("de-DE")}</span> beantwortet
        </span>
        <span className="text-zinc-200">·</span>
        <span className="num font-medium text-zinc-900">{data.quotePct} %</span>
        <span className="text-zinc-400">
          (Median aller Abgeordneten: <span className="num">{data.baselineMedianPct} %</span>)
        </span>
      </div>

      {/* Themen-Filter */}
      {data.topics.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          <button
            type="button"
            onClick={() => pickTopic(null)}
            className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
              topic === null
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            Alle{" "}
            <span className="num opacity-60">{data.items.length}</span>
          </button>
          {data.topics.slice(0, 14).map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => pickTopic(t.label)}
              className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                topic === t.label
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {t.label} <span className="num opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((it) => (
          <FrageCard key={it.frageUrl} item={it} />
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

      {/* Coverage-Ehrlichkeit: was diese Zahl NICHT abbildet */}
      <p className="mt-4 text-[11px] text-zinc-400 leading-relaxed">
        Öffentliche Fragen über abgeordnetenwatch.de
        {data.itemsCapped && (
          <> — angezeigt die {data.items.length.toLocaleString("de-DE")} neuesten beantworteten Fragen</>
        )}
        . Andere Bürgerkontakte (Sprechstunde, Brief, E-Mail) sind hier nicht erfasst.
        {data.awUrl && (
          <>
            {" "}
            <a
              href={data.awUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1a3e72] hover:text-[#0f2a52] underline-offset-2 hover:underline"
            >
              Profil auf abgeordnetenwatch.de
            </a>
          </>
        )}
      </p>
    </div>
  );
}
