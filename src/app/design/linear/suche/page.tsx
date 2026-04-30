import { searchPoliticiansDb } from "@/lib/db";
import { SearchBox } from "@/components/SearchBox";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
import { getDb } from "@/lib/db";

const SUGGESTIONS = [
  "Friedrich Merz",
  "Katherina Reiche",
  "Sahra Wagenknecht",
  "Alice Weidel",
  "Robert Habeck",
  "Bärbel Bas",
];

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

export default async function SuchePage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q || "";
  const politicians = query ? searchPoliticiansDb(query) : [];

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-16 fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-2">
          Suche
        </h1>
        <p className="text-[14px] text-zinc-500 mb-8">
          Finde Bundestagsabgeordnete nach Namen, Beruf oder Wohnort.
        </p>

        <div className="mb-10">
          <SearchBox />
        </div>

        {query && (
          <div className="flex items-baseline gap-2 mb-5">
            <span className="num text-2xl font-semibold text-zinc-950">
              {politicians.length}
            </span>
            <span className="text-[13px] text-zinc-500">
              Ergebnis{politicians.length !== 1 ? "se" : ""} für „{query}"
            </span>
          </div>
        )}

        {query && politicians.length === 0 && (
          <div className="border border-dashed border-zinc-200 rounded-2xl px-6 py-12 text-center">
            <SearchX className="w-8 h-8 text-zinc-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-zinc-500">
              Keine Abgeordneten gefunden. Versuche einen anderen Namen.
            </p>
          </div>
        )}

        {!query && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
                Beliebte Suchen
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href={`/design/linear/suche?q=${encodeURIComponent(s)}`}
                    className="px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-[13px] text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 transition-colors"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            <p className="text-[12px] text-zinc-400">
              Oder gib oben einen Namen ein und drücke{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-600">
                Enter
              </kbd>
              .
            </p>
          </div>
        )}

        {politicians.length > 0 && (
          <div className="space-y-1.5">
            {politicians.map((p) => {
              const parliament = getParliamentForPolitician(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/design/linear/politiker/${p.id}`}
                  className="card-hover group flex items-center gap-4 bg-white rounded-xl border border-zinc-200/70 px-4 py-3.5"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200/70 flex items-center justify-center shrink-0 text-[13px] font-semibold text-zinc-600">
                    {p.first_name[0]}
                    {p.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-[14.5px] text-zinc-950 truncate">
                        {p.title ? `${p.title} ` : ""}
                        {p.first_name} {p.last_name}
                      </span>
                      {p.party_label && (
                        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                          {p.party_label}
                        </span>
                      )}
                      {parliament && (
                        <span className="text-[11px] text-zinc-400">
                          {parliament.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-zinc-500 mt-0.5">
                      {p.occupation && <span className="truncate">{p.occupation}</span>}
                      {p.residence && (
                        <>
                          <span className="text-zinc-300">·</span>
                          <span>{p.residence}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2.25} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
