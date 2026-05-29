import { getQaPaareList } from "@/lib/db";
import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; seite?: string }> };

const PER_PAGE = 50;

export default async function FragenPage({ searchParams }: Props) {
  const { q: qRaw, seite } = await searchParams;
  const q = (qRaw ?? "").trim();
  const page = Math.max(1, parseInt(seite ?? "1", 10) || 1);
  const { items, total } = getQaPaareList(q, page, PER_PAGE);
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const mkHref = (p: number) => `/fragen?${q ? `q=${encodeURIComponent(q)}&` : ""}seite=${p}`;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquareQuote className="w-5 h-5 text-[#1a3e72]" strokeWidth={2} />
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-zinc-950">Fragen &amp; Antworten</h1>
      </div>
      <p className="text-[13px] text-zinc-500 mb-6 leading-relaxed">
        Schriftliche Einzelfragen von Abgeordneten und die Antworten der Bundesregierung,
        einzeln aus den Sammeldrucksachen extrahiert.
      </p>

      <form action="/fragen" method="get" className="mb-6 flex gap-2">
        <input
          type="search" name="q" defaultValue={q} placeholder="In Fragen & Antworten suchen…"
          className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:border-[#1a3e72]"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#1a3e72] text-white text-[13px] font-medium hover:bg-[#0f2a52] transition-colors">Suchen</button>
      </form>

      <p className="text-[12px] text-zinc-400 mb-4 num">
        {total.toLocaleString("de-DE")} {total === 1 ? "Treffer" : "Treffer"}{q && <> für „{q}"</>}
      </p>

      <ul className="space-y-5">
        {items.map((qa) => (
          <li key={`${qa.drucksacheNr}-${qa.paarIndex}`} className="border border-zinc-200/70 rounded-xl bg-white px-5 py-4">
            <div className="flex items-baseline gap-2 flex-wrap mb-1.5 text-[11.5px]">
              {qa.fragestellerPoliticianId ? (
                <Link href={`/politiker/${qa.fragestellerPoliticianId}`} className="font-medium text-zinc-950 hover:text-[#1a3e72] transition-colors">{qa.fragestellerName}</Link>
              ) : (
                <span className="font-medium text-zinc-700">{qa.fragestellerName}</span>
              )}
              {qa.fragestellerParty && <span className="text-zinc-400">{qa.fragestellerParty}</span>}
              <span className="text-zinc-200">·</span>
              <Link href={`/aktivitaeten/${qa.drucksacheNr.replace(/\//g, "-")}`} className="text-[#1a3e72] hover:text-[#0f2a52] num transition-colors">{qa.drucksacheNr}</Link>
              {qa.datum && <span className="text-zinc-400 num">{qa.datum}</span>}
            </div>
            {qa.frageText && <p className="text-[13.5px] text-zinc-800 leading-snug mb-1.5">{qa.frageText}</p>}
            {qa.antwortText && (
              <details className="group">
                <summary className="cursor-pointer text-[11.5px] text-[#1a3e72] hover:text-[#0f2a52] select-none list-none">
                  <span className="group-open:hidden">▶ Antwort{qa.antwortSteller ? ` (${qa.antwortSteller})` : ""} anzeigen</span>
                  <span className="hidden group-open:inline">▼ Antwort ausblenden</span>
                </summary>
                <p className="mt-1.5 text-[12.5px] text-zinc-600 leading-relaxed whitespace-pre-line border-l-2 border-zinc-100 pl-3">{qa.antwortText}</p>
              </details>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-[13px] text-zinc-400 py-8 text-center">Keine Treffer.</li>}
      </ul>

      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-8 text-[12.5px]">
          {page > 1 ? <Link href={mkHref(page - 1)} className="text-[#1a3e72] hover:text-[#0f2a52]">← Zurück</Link> : <span />}
          <span className="text-zinc-400 num">Seite {page} / {lastPage}</span>
          {page < lastPage ? <Link href={mkHref(page + 1)} className="text-[#1a3e72] hover:text-[#0f2a52]">Weiter →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
