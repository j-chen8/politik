import { searchPoliticiansDb, type PoliticianRow } from "@/lib/db";
import { SearchBox } from "@/components/SearchBox";
import { Badge } from "@/components/Badge";
import Link from "next/link";
import { UserCircle, ArrowRight, SearchX } from "lucide-react";
import { getDb } from "@/lib/db";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

function getParliamentForPolitician(politicianId: number): { label: string; type: string } | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT par.label, par.type
       FROM mandates m
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE m.politician_id = ? AND m.type = 'mandate'
       ORDER BY pp.start_date DESC
       LIMIT 1`
    )
    .get(politicianId) as { label: string; type: string } | undefined;
  return row || null;
}

function getParliamentBadgeVariant(type: string): "blue" | "green" | "yellow" {
  if (type === "bundestag") return "blue";
  if (type === "eu") return "green";
  return "yellow";
}

export default async function SuchePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";
  const politicians = query ? searchPoliticiansDb(query) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 fade-in">
      <div className="mb-8">
        <SearchBox />
      </div>

      {query && (
        <p className="text-sm text-muted mb-6">
          {politicians.length} Ergebnis{politicians.length !== 1 ? "se" : ""} für{" "}
          <span className="font-semibold text-foreground">&quot;{query}&quot;</span>
        </p>
      )}

      {query && politicians.length === 0 && (
        <div className="text-center py-16">
          <SearchX className="w-12 h-12 text-muted/40 mx-auto mb-4" />
          <p className="text-muted">
            Keine Abgeordneten gefunden. Versuchen Sie einen anderen Namen.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {politicians.map((p) => {
          const parliament = getParliamentForPolitician(p.id);
          return (
            <Link
              key={p.id}
              href={`/politiker/${p.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-semibold text-foreground truncate">
                    {p.title ? `${p.title} ` : ""}
                    {p.first_name} {p.last_name}
                  </span>
                  {p.party_label && (
                    <Badge variant="blue">{p.party_label}</Badge>
                  )}
                  {parliament && (
                    <Badge variant={getParliamentBadgeVariant(parliament.type)}>
                      {parliament.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {p.occupation && <span className="truncate">{p.occupation}</span>}
                  {p.residence && (
                    <>
                      <span className="text-border">·</span>
                      <span>{p.residence}</span>
                    </>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
