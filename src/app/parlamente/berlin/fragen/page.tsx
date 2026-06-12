import { getBerlinQaList, getBerlinQaParties } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fragen & Antworten — Abgeordnetenhaus Berlin",
  description: "Schriftliche Anfragen der Berliner Abgeordneten und die Antworten des Senats.",
};

type Props = { searchParams: Promise<{ q?: string; seite?: string; partei?: string; sort?: string }> };

const PER_PAGE = 30;

function fmtDate(s: string | null): string | null {
  if (!s) return null;
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return s; }
}

export default async function BerlinFragenPage({ searchParams }: Props) {
  const { q: qRaw, seite, partei: parteiRaw, sort: sortRaw } = await searchParams;
  const q = (qRaw ?? "").trim();
  const partei = (parteiRaw ?? "").trim() || null;
  const sort: "neu" | "alt" = sortRaw === "alt" ? "alt" : "neu";
  const page = Math.max(1, parseInt(seite ?? "1", 10) || 1);
  const parties = getBerlinQaParties();
  const { items, total } = getBerlinQaList(q, page, PER_PAGE, partei, sort);
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (partei) sp.set("partei", partei);
    if (sort !== "neu") sp.set("sort", sort);
    for (const [k, v] of Object.entries(extra)) sp.set(k, String(v));
    return sp.toString();
  };
  const mkHref = (p: number) => `/parlamente/berlin/fragen?${qs({ seite: p })}`;

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-20 pb-24">
        <Link
          href="/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Abgeordnetenhaus Berlin
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote className="w-5 h-5 text-blue-700" strokeWidth={2} />
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-zinc-950">Fragen &amp; Antworten</h1>
        </div>
        <p className="text-[13px] text-zinc-500 mb-6 leading-relaxed">
          Schriftliche Anfragen der Berliner Abgeordneten und die Antworten des Senats — jede Anfrage
          mit Frage und Antwort, KI-zusammengefasst (Methodik in{" "}
          <Link href="/parlamente/berlin/methodik" className="text-blue-700 hover:underline">/methodik</Link>).
        </p>

        <form action="/parlamente/berlin/fragen" method="get" className="mb-6 space-y-2">
          <div className="flex gap-2">
            <input
              type="search" name="q" defaultValue={q} placeholder="In Fragen & Antworten suchen…"
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:border-blue-600"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-700 text-white text-[13px] font-medium hover:bg-blue-800 transition-colors">Suchen</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <label className="flex items-center gap-1.5 text-zinc-500">
              Partei
              <select
                name="partei" defaultValue={partei ?? ""}
                className="border border-zinc-300 rounded-lg px-2 py-1.5 text-[12.5px] text-zinc-800 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="">Alle</option>
                {parties.map((p) => (
                  <option key={p.party} value={p.party}>{p.party} ({p.count.toLocaleString("de-DE")})</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-zinc-500">
              Sortierung
              <select
                name="sort" defaultValue={sort}
                className="border border-zinc-300 rounded-lg px-2 py-1.5 text-[12.5px] text-zinc-800 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="neu">Neueste zuerst</option>
                <option value="alt">Älteste zuerst</option>
              </select>
            </label>
            <button type="submit" className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-700 text-[12.5px] font-medium hover:bg-zinc-50 transition-colors">Anwenden</button>
            {(q || partei || sort !== "neu") && (
              <Link href="/parlamente/berlin/fragen" className="text-zinc-400 hover:text-zinc-700 transition-colors">Zurücksetzen</Link>
            )}
          </div>
        </form>

        <p className="text-[12px] text-zinc-400 mb-4 num">
          {total.toLocaleString("de-DE")} Treffer{q && <> für „{q}"</>}
        </p>

        <ul className="space-y-5">
          {items.map((qa) => (
            <li key={qa.dbid} className="border border-zinc-200/70 rounded-xl bg-white px-5 py-4">
              <div className="flex items-baseline gap-2 flex-wrap mb-1.5 text-[11.5px]">
                {qa.askerPoliticianId ? (
                  <Link href={`/politiker/${qa.askerPoliticianId}`} className="font-medium text-zinc-950 hover:text-blue-700 transition-colors">
                    {qa.askerName}
                  </Link>
                ) : (
                  <span className="font-medium text-zinc-700">{qa.askerName ?? "—"}</span>
                )}
                {qa.askerParty && <span className="text-zinc-400">{qa.askerParty}</span>}
                {qa.askerMore > 0 && <span className="text-zinc-400">+{qa.askerMore}</span>}
                <span className="text-zinc-200">·</span>
                {qa.dokNr && (
                  <Link href={`/parlamente/berlin/drucksache/${qa.dbid}`} className="text-blue-700 hover:text-blue-900 num transition-colors">
                    {qa.dokNr}
                  </Link>
                )}
                {qa.datum && <span className="text-zinc-400 num">{fmtDate(qa.datum)}</span>}
              </div>

              {qa.titel && (
                <p className="text-[14px] font-medium text-zinc-950 leading-snug mb-2">{qa.titel}</p>
              )}

              {/* Frage */}
              {qa.frage.length > 0 ? (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 mb-1">Frage</div>
              ) : null}
              {qa.frage.length > 0 ? (
                <ul className="space-y-1 mb-1.5 text-[13.5px] text-zinc-800 leading-snug list-disc pl-4">
                  {qa.frage.slice(0, 6).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              ) : (
                qa.zusammenfassung && <p className="text-[13.5px] text-zinc-800 leading-snug mb-1.5">{qa.zusammenfassung}</p>
              )}

              {/* Antwort des Senats — ausklappbar */}
              {qa.antwort.length > 0 && (
                <details className="group mt-1">
                  <summary className="cursor-pointer text-[11.5px] text-blue-700 hover:text-blue-900 select-none list-none">
                    <span className="group-open:hidden">▶ Antwort des Senats anzeigen</span>
                    <span className="hidden group-open:inline">▼ Antwort ausblenden</span>
                  </summary>
                  <ul className="mt-1.5 space-y-1 text-[12.5px] text-zinc-600 leading-relaxed border-l-2 border-zinc-100 pl-3 list-disc list-inside">
                    {qa.antwort.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </details>
              )}
            </li>
          ))}
          {items.length === 0 && <li className="text-[13px] text-zinc-400 py-8 text-center">Keine Treffer.</li>}
        </ul>

        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-8 text-[12.5px]">
            {page > 1 ? <Link href={mkHref(page - 1)} className="text-blue-700 hover:text-blue-900">← Zurück</Link> : <span />}
            <span className="text-zinc-400 num">Seite {page} / {lastPage}</span>
            {page < lastPage ? <Link href={mkHref(page + 1)} className="text-blue-700 hover:text-blue-900">Weiter →</Link> : <span />}
          </div>
        )}
      </div>
    </div>
  );
}
