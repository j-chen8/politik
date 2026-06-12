import {
  listPlenarSpeechesByType,
  PLENAR_TYPE_SLUG_LABEL,
  PLENAR_TYPE_SLUGS,
} from "@/lib/db";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const PARTY_SHORT: Record<string, string> = {
  "CDU/CSU": "CDU",
  AfD: "AfD",
  SPD: "SPD",
  "Die Linke": "Linke",
  "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
  fraktionslos: "FL",
};

const PAGE_SIZE = 100;

export default async function PlenarTypeListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  if (!PLENAR_TYPE_SLUGS[slug]) notFound();

  const label = PLENAR_TYPE_SLUG_LABEL[slug];
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const { rows, total } = listPlenarSpeechesByType(slug, PAGE_SIZE, offset);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <Link
          href="/protokolle"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zur Protokoll-Übersicht
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Plenarbeiträge · Filter
            </span>
            <span className="text-zinc-300">·</span>
            <Link
              href="/methodik#plenarbeitrag-typen"
              className="text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors underline underline-offset-2 decoration-zinc-200"
            >
              Methodik: Was ist was?
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 mb-2">
            {label}
          </h1>
          <p className="text-[14px] text-zinc-500">
            <span className="num text-zinc-700 font-medium">{total.toLocaleString("de-DE")}</span> Beiträge in der WP21
          </p>
        </div>

        {/* Filter-Chips für die anderen Typen */}
        <div className="mb-8 flex flex-wrap gap-1.5">
          {Object.entries(PLENAR_TYPE_SLUG_LABEL).map(([s, lbl]) => (
            <Link
              key={s}
              href={`/protokolle/typ/${s}`}
              className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                s === slug
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
              }`}
            >
              {lbl}
            </Link>
          ))}
        </div>

        {/* Liste */}
        {rows.length === 0 ? (
          <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
            Keine Beiträge dieses Typs gefunden.
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li
                key={`${r.rede_id}-${i}`}
                className="border border-zinc-200/70 rounded-xl bg-white px-4 py-3 hover:border-zinc-300 hover:bg-zinc-50/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/protokolle/redner/${encodeURIComponent(r.speaker)}`}
                      className="text-[13.5px] font-semibold text-zinc-950 hover:text-zinc-700 transition-colors"
                    >
                      {r.speaker}
                    </Link>
                    {r.party && (
                      <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
                        {PARTY_SHORT[r.party] || r.party}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 num shrink-0">
                    {r.datum && <span>{formatDate(r.datum)}</span>}
                    {r.sitzung && <span className="ml-2">Sitzung {r.sitzung}</span>}
                  </div>
                </div>
                {r.kontext && (
                  <p className="text-[12.5px] text-zinc-500 leading-snug mb-1">{r.kontext}</p>
                )}
                {r.zusammenfassung ? (
                  <p className="text-[13px] text-zinc-700 leading-relaxed">{r.zusammenfassung}</p>
                ) : (
                  <p
                    className="text-[12px] text-zinc-400 italic leading-snug"
                    title="Reden werden in einer separaten LLM-Pipeline analysiert. Frische Sitzungen erscheinen hier zuerst ohne Zusammenfassung und werden nachträglich befüllt."
                  >
                    Zusammenfassung wird noch erzeugt — frische Sitzung, LLM-Pipeline läuft nach.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-[12px]">
            <span className="text-zinc-500 num">
              Seite {page} / {totalPages} · {((page - 1) * PAGE_SIZE + 1).toLocaleString("de-DE")}–{Math.min(page * PAGE_SIZE, total).toLocaleString("de-DE")} von {total.toLocaleString("de-DE")}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/protokolle/typ/${slug}?page=${page - 1}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200/70 bg-white hover:border-zinc-400 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" strokeWidth={2.25} />
                  Zurück
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/protokolle/typ/${slug}?page=${page + 1}`}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200/70 bg-white hover:border-zinc-400 transition-colors inline-flex items-center gap-1"
                >
                  Weiter
                  <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
