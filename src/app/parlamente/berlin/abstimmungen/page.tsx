import { listBerlinVotesForIndex, type BerlinVoteIndexEntry } from "@/lib/db";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abstimmungen — Abgeordnetenhaus Berlin | Politik-Radar",
  description: "Handzeichen-Abstimmungen im Berliner Abgeordnetenhaus auf Fraktions-Ebene, mit Ergebnis und Drucksachen-Bezug.",
};

export default function BerlinAbstimmungen({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; show?: string }>;
}) {
  return <Inner searchParams={searchParams} />;
}

async function Inner({ searchParams }: { searchParams: Promise<{ year?: string; show?: string }> }) {
  const { year = "", show = "" } = await searchParams;
  const berlin = listBerlinVotesForIndex().filter((p) => p.parliament === "Berlin");

  const showPersonenwahl = show === "personenwahl" || show === "alle";
  const base = berlin.filter((p) => (p.subtype === "personenwahl" ? showPersonenwahl : true));

  const years = Array.from(new Set(base.map((p) => p.date?.slice(0, 4)).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a));
  const filtered = base.filter((p) => !year || p.date?.slice(0, 4) === year);

  const personenwahlCount = berlin.filter((p) => p.subtype === "personenwahl").length;
  const qs = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (year && !("year" in extra)) params.set("year", year);
    if (show && !("show" in extra)) params.set("show", show);
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="page-wash">
      <div className="w-full page-shell">
        <Link href="/parlamente/berlin" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zum Abgeordnetenhaus Berlin
        </Link>

        <div className="mb-8 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">Abgeordnetenhaus Berlin · 19. Wahlperiode</div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-3">Abstimmungen</h1>
          <p className="text-[15px] text-zinc-600 leading-relaxed max-w-2xl">
            <span className="num font-medium text-zinc-900">{filtered.length}</span> Plenums-Abstimmungen per Handzeichen, aus den
            Protokollen extrahiert und auf Fraktions-Ebene aufgeschlüsselt. Reine Verfahrens-Abstimmungen sind ausgeblendet
            (siehe <Link href="/parlamente/berlin/methodik#votes-pipeline" className="text-blue-700 hover:text-blue-900 underline">Methodik</Link>).
          </p>
        </div>

        {personenwahlCount > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-zinc-400 self-center mr-1">Auch zeigen:</span>
            <FilterPill href={qs({ show: show === "personenwahl" ? "" : "personenwahl" })} active={showPersonenwahl}>
              Personen-Wahlen ({personenwahlCount})
            </FilterPill>
          </div>
        )}

        {years.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-zinc-400 self-center mr-1">Jahr:</span>
            <FilterPill href={qs({ year: "" })} active={!year}>alle</FilterPill>
            {years.map((y) => (
              <FilterPill key={y} href={qs({ year: y })} active={year === y}>{y}</FilterPill>
            ))}
          </div>
        )}

        <div className="space-y-2 fade-in-up fade-in-up-3">
          {filtered.map((p) => <VoteCard key={p.id} v={p} />)}
          {filtered.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
              Keine Abstimmung passt zu diesem Filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-2.5 py-1 rounded-md border transition-colors ${active ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"}`}>
      {children}
    </Link>
  );
}

const FRAKTIONS_ORDER = ["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP"] as const;
function votePillColor(v: string): string {
  if (v === "ja") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (v === "nein") return "bg-rose-50 text-rose-800 border-rose-200";
  if (v === "enthaltung") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-zinc-50 text-zinc-500 border-zinc-200";
}
function voteIcon(v: string): string {
  return v === "ja" ? "✓" : v === "nein" ? "✗" : v === "enthaltung" ? "—" : "?";
}
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y.slice(2)}` : iso;
}

function VoteCard({ v }: { v: BerlinVoteIndexEntry }) {
  const passed = v.outcome === "angenommen";
  return (
    <Link href={v.detail_url} className="block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-[90px]">
          <div className="text-[11.5px] font-mono text-zinc-500 num">{formatDate(v.date)}</div>
          <div className={`mt-1 inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${passed ? "bg-emerald-50 text-emerald-800 border-emerald-200" : v.outcome === "abgelehnt" ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
            {v.outcome_label}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 text-[10px] uppercase tracking-wider">
            <span className="px-1.5 py-0.5 rounded font-medium bg-orange-50 text-orange-700">Handzeichen</span>
            {v.drucksache_nrn.length > 0 && (
              <span className="text-[10.5px] num text-zinc-400">Drs. {v.drucksache_nrn.slice(0, 3).join(", ")}{v.drucksache_nrn.length > 3 && ` +${v.drucksache_nrn.length - 3}`}</span>
            )}
          </div>
          <div className="text-[14px] font-medium text-zinc-950 leading-snug mb-2 group-hover:text-zinc-700 transition-colors line-clamp-2">
            {v.label ?? `Abstimmung #${v.id}`}
          </div>
          {v.fraktion_votes && (
            <div className="flex flex-wrap gap-1">
              {FRAKTIONS_ORDER.map((f) => {
                const vt = v.fraktion_votes?.[f] ?? "unbekannt";
                return (
                  <span key={f} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10.5px] font-medium ${votePillColor(vt)}`} title={`${f}: ${vt}`}>
                    <span className="font-semibold">{f}</span><span>{voteIcon(vt)}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" strokeWidth={2.25} />
      </div>
    </Link>
  );
}
