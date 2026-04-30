import { listPoliticians, getAllParliaments, getAllParties } from "@/lib/db";
import { PolitikerFilters } from "@/components/PolitikerFilters";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  searchParams: Promise<{
    q?: string;
    parlament?: string;
    partei?: string;
    seite?: string;
  }>;
}

const ROWS_PER_PAGE = 50;

export default async function PolitikerListPage({ searchParams }: Props) {
  const { q, parlament, partei, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));
  const offset = (page - 1) * ROWS_PER_PAGE;

  const parliaments = getAllParliaments();
  const parties = getAllParties();

  const { rows, total } = listPoliticians({
    query: q || undefined,
    parliamentId: parlament ? parseInt(parlament, 10) : undefined,
    partyId: partei ? parseInt(partei, 10) : undefined,
    limit: ROWS_PER_PAGE,
    offset,
  });

  const totalPages = Math.ceil(total / ROWS_PER_PAGE);

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (parlament) baseParams.set("parlament", parlament);
  if (partei) baseParams.set("partei", partei);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-12 fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">
            Politiker
          </h1>
          <div className="flex items-baseline gap-2">
            <span className="num text-[15px] text-zinc-950 font-medium">
              {total.toLocaleString("de-DE")}
            </span>
            <span className="text-[13px] text-zinc-500">
              Abgeordnete in {parliaments.length} Parlamenten
            </span>
          </div>
        </div>

        <PolitikerFilters
          parliaments={parliaments}
          parties={parties}
          activeParliament={parlament}
          activeParty={partei}
          query={q}
          basePath="/design/linear/politiker"
        />

        {/* Table */}
        <div className="mt-8 bg-white rounded-2xl border border-zinc-200/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 hidden sm:table-cell">Partei</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 hidden md:table-cell">Parlament</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Wahlkreis / Fraktion</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 hidden md:table-cell">Aktivität</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Beruf</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/design/linear/politiker/${p.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <PoliticianAvatar
                          photoUrl={p.photo_url}
                          firstName={p.first_name}
                          lastName={p.last_name}
                          party={p.party_label}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <span className="font-medium text-zinc-950 group-hover:underline block truncate">
                            {p.title ? `${p.title} ` : ""}
                            {p.first_name} {p.last_name}
                          </span>
                          <span className="text-[12px] text-zinc-400 sm:hidden">
                            {p.party_label || ""}
                            {p.parliament_label ? ` · ${p.parliament_label}` : ""}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {p.party_label ? (
                        <span className="text-[12px] font-medium text-zinc-700 uppercase tracking-wider">
                          {p.party_label}
                        </span>
                      ) : (
                        <span className="text-zinc-300">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[12.5px] text-zinc-500">
                      {p.parliament_label || <span className="text-zinc-300">–</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-[12px] text-zinc-400 truncate max-w-[200px]">
                        {p.constituency || p.fraction || "–"}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right">
                      {p.activity_count > 0 ? (
                        <span className="num text-[13px] font-medium text-zinc-950">
                          {p.activity_count}
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-[12px]">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-[12px] text-zinc-400 truncate max-w-[180px]">
                        {p.occupation || "–"}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-zinc-400 text-[13px]">
                      Keine Politiker gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {page > 1 ? (
              <Link
                href={`/design/linear/politiker?${baseParams.toString()}&seite=${page - 1}`}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
                Zurück
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-[13px] text-zinc-300 px-3 py-1.5">
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
                Zurück
              </span>
            )}
            <span className="text-[12px] text-zinc-500 num">
              Seite {page} von {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/design/linear/politiker?${baseParams.toString()}&seite=${page + 1}`}
                className="flex items-center gap-1 text-[13px] font-medium text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
              >
                Weiter
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-[13px] text-zinc-300 px-3 py-1.5">
                Weiter
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
