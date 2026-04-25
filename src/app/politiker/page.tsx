import { listPoliticians, getAllParliaments, getAllParties } from "@/lib/db";
import { PolitikerFilters } from "@/components/PolitikerFilters";
import { Badge } from "@/components/Badge";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  searchParams: Promise<{
    q?: string;
    parlament?: string;
    partei?: string;
    seite?: string;
  }>;
}

const ROWS_PER_PAGE = 50;

function getParliamentBadgeVariant(type: string | null): "blue" | "green" | "yellow" {
  if (type === "bundestag") return "blue";
  if (type === "eu") return "green";
  return "yellow";
}

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

  // Build base params for pagination
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (parlament) baseParams.set("parlament", parlament);
  if (partei) baseParams.set("partei", partei);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Alle Politiker
        </h1>
        <p className="text-sm text-muted">
          {total.toLocaleString("de-DE")} Abgeordnete in {parliaments.length} Parlamenten
        </p>
      </div>

      <PolitikerFilters
        parliaments={parliaments}
        parties={parties}
        activeParliament={parlament}
        activeParty={partei}
        query={q}
      />

      {/* Table */}
      <div className="mt-6 bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left px-4 py-3 font-semibold text-muted">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted hidden sm:table-cell">Partei</th>
                <th className="text-left px-4 py-3 font-semibold text-muted hidden md:table-cell">Parlament</th>
                <th className="text-left px-4 py-3 font-semibold text-muted hidden lg:table-cell">Wahlkreis / Fraktion</th>
                <th className="text-left px-4 py-3 font-semibold text-muted hidden md:table-cell">Aktivitäten</th>
                <th className="text-left px-4 py-3 font-semibold text-muted hidden lg:table-cell">Beruf</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/50 hover:bg-primary-light/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/politiker/${p.id}`}
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
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                          {p.title ? `${p.title} ` : ""}
                          {p.first_name} {p.last_name}
                        </span>
                        {/* Show party + parliament on mobile */}
                        <span className="text-xs text-muted sm:hidden">
                          {p.party_label || ""}
                          {p.parliament_label ? ` · ${p.parliament_label}` : ""}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {p.party_label ? (
                      <Badge variant="blue">{p.party_label}</Badge>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.parliament_label ? (
                      <Badge variant={getParliamentBadgeVariant(p.parliament_type)}>
                        {p.parliament_label}
                      </Badge>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs text-muted truncate max-w-[200px]">
                      {p.constituency || p.fraction || "–"}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.activity_count > 0 ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        p.activity_count >= 100
                          ? "bg-green-light text-green"
                          : p.activity_count >= 30
                          ? "bg-primary-light text-primary"
                          : p.activity_count > 0
                          ? "bg-gray-100 text-muted"
                          : ""
                      }`}>
                        {p.activity_count}
                      </span>
                    ) : (
                      <span className="text-muted/40 text-xs">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-xs text-muted truncate max-w-[180px]">
                      {p.occupation || "–"}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
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
        <div className="flex items-center justify-center gap-4 mt-6">
          {page > 1 ? (
            <Link
              href={`/politiker?${baseParams.toString()}&seite=${page - 1}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted/40">
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </span>
          )}
          <span className="text-sm text-muted">
            Seite {page} von {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/politiker?${baseParams.toString()}&seite=${page + 1}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted/40">
              Weiter
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
