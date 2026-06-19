import { ChevronDown } from "lucide-react";
import { feldEmoji } from "@/lib/themenfeld-slug";
import type { ThemenfeldSynthese } from "@/lib/db";

/**
 * Mini-Renderer für die Synthese-Texte: **fett** + Absätze (\n\n).
 * Kein Markdown-Paket nötig — die Texte nutzen nur diese zwei Konstrukte.
 */
function renderSynthese(text: string) {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((para, pi) => (
      <p
        key={pi}
        className="text-[13px] leading-relaxed text-zinc-700 [&:not(:first-child)]:mt-2"
      >
        {para.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i} className="font-semibold text-zinc-900">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    ));
}

/**
 * „Themen aus den Bürgerfragen": pro Themenfeld eine neutrale Synthese — worum
 * Bürger:innen fragen UND wie der/die Abgeordnete antwortet (auch wo keine
 * Position bezogen wird). Meistgefragtes Feld zuerst, dünne (1-Frage) markiert.
 */
export function ThemenSynthesen({
  items,
  name,
}: {
  items: ThemenfeldSynthese[];
  name: string;
}) {
  const stand = items
    .map((i) => i.createdAt)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1)
    ?.slice(0, 7); // "YYYY-MM"
  const standLabel = stand ? `${stand.slice(5, 7)}/${stand.slice(0, 4)}` : null;

  return (
    <div>
      <p className="text-[12px] text-zinc-500 mb-3 leading-relaxed">
        Neutral zusammengefasst aus den öffentlichen Bürgerfragen: worum es je
        Themenfeld geht — und wie {name} darauf antwortet, auch wo keine Position
        bezogen wird. Aus den Originaltexten, kein Werturteil.
        {standLabel && <span className="text-zinc-400"> · Stand {standLabel}</span>}
      </p>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={it.feld} className="rounded-lg border border-zinc-100">
            <details open={idx < 2} className="group">
              <summary className="flex items-center gap-2 cursor-pointer list-none px-3 py-2.5 select-none">
                <span aria-hidden>{feldEmoji(it.feld)}</span>
                <span className="flex-1 text-[13.5px] font-medium text-zinc-900">
                  {it.feld}
                </span>
                <span className="num text-[11px] text-zinc-400">
                  {it.nFragen} {it.nFragen === 1 ? "Frage" : "Fragen"}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-300 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-3 pb-3 pt-0.5">
                {it.nFragen === 1 && (
                  <p className="mb-1.5 text-[11px] text-amber-600">
                    Basiert nur auf einer einzigen Frage — wenig belastbar.
                  </p>
                )}
                {renderSynthese(it.synthese)}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
