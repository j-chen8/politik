import { listBerlinDrucksachenForIndex } from "@/lib/db";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drucksachen — Abgeordnetenhaus Berlin | Politik-Radar",
  description: "Alle analysierten Drucksachen des Berliner Abgeordnetenhauses: Anfragen, Anträge, Gesetzentwürfe, Beschlussempfehlungen — filterbar nach Typ und Jahr.",
};

const PAGE_SIZE = 50;

const KLASSE_LABEL: Record<string, string> = {
  anfrage_antwort: "Schriftliche Anfrage",
  antrag: "Antrag",
  gesetzentwurf: "Gesetzentwurf",
  vorlage_senat: "Senats-Vorlage",
  beschlussempfehlung: "Beschlussempfehlung",
  beschlussempfehlung_regex: "Beschlussempfehlung",
};

const KLASSE_BADGE: Record<string, string> = {
  anfrage_antwort: "bg-blue-50 text-blue-700",
  antrag: "bg-orange-50 text-orange-700",
  gesetzentwurf: "bg-violet-50 text-violet-700",
  vorlage_senat: "bg-slate-100 text-slate-700",
  beschlussempfehlung: "bg-emerald-50 text-emerald-700",
  beschlussempfehlung_regex: "bg-emerald-50 text-emerald-700",
};

export default function BerlinDrucksachenPage({
  searchParams,
}: {
  searchParams: Promise<{ klasse?: string; year?: string; page?: string; fraktion?: string }>;
}) {
  return <Inner searchParams={searchParams} />;
}

// Hauptfraktionen im Berliner AGH (19. WP) — als Filter-Pills.
const FRAKTIONEN = ["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP"];

async function Inner({ searchParams }: { searchParams: Promise<{ klasse?: string; year?: string; page?: string; fraktion?: string }> }) {
  const sp = await searchParams;
  const klasse = sp.klasse ?? "";
  const year = sp.year ?? "";
  const fraktion = sp.fraktion ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total, klasseFacets, years } = listBerlinDrucksachenForIndex({
    klasse: klasse || undefined,
    year: year || undefined,
    fraktion: fraktion || undefined,
    offset,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allKlassenTotal = klasseFacets.reduce((s, f) => s + f.count, 0);

  const qs = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    if (klasse && !("klasse" in extra)) params.set("klasse", klasse);
    if (year && !("year" in extra)) params.set("year", year);
    if (fraktion && !("fraktion" in extra)) params.set("fraktion", fraktion);
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
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-3">Drucksachen</h1>
          <p className="text-[15px] text-zinc-600 leading-relaxed max-w-2xl">
            <span className="num font-medium text-zinc-900">{allKlassenTotal.toLocaleString("de-DE")}</span> analysierte Drucksachen —
            Schriftliche Anfragen, Anträge, Gesetzentwürfe, Senats-Vorlagen und Beschlussempfehlungen. Jede mit LLM-Zusammenfassung
            und Themen-Einordnung (siehe <Link href="/parlamente/berlin/methodik" className="text-blue-700 hover:text-blue-900 underline">Methodik</Link>).
            Volltext-Suche über die <Link href="/parlamente/berlin/suche" className="text-blue-700 hover:text-blue-900 underline">Berlin-Suche</Link>.
          </p>
        </div>

        {/* Klassen-Filter */}
        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 self-center mr-1">Typ:</span>
          <FilterPill href={qs({ klasse: "", page: "" })} active={!klasse}>alle ({allKlassenTotal.toLocaleString("de-DE")})</FilterPill>
          {klasseFacets.filter((f) => f.klasse !== "beschlussempfehlung_regex").map((f) => {
            const count = f.klasse === "beschlussempfehlung"
              ? f.count + (klasseFacets.find((x) => x.klasse === "beschlussempfehlung_regex")?.count ?? 0)
              : f.count;
            return (
              <FilterPill key={f.klasse} href={qs({ klasse: f.klasse, page: "" })} active={klasse === f.klasse}>
                {KLASSE_LABEL[f.klasse] ?? f.klasse} ({count.toLocaleString("de-DE")})
              </FilterPill>
            );
          })}
        </div>

        {/* Jahr-Filter */}
        {years.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-zinc-400 self-center mr-1">Jahr:</span>
            <FilterPill href={qs({ year: "", page: "" })} active={!year}>alle</FilterPill>
            {years.map((y) => (
              <FilterPill key={y} href={qs({ year: y, page: "" })} active={year === y}>{y}</FilterPill>
            ))}
          </div>
        )}

        {/* Fraktions-Filter (einbringende Fraktion) */}
        <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 self-center mr-1">Fraktion:</span>
          <FilterPill href={qs({ fraktion: "", page: "" })} active={!fraktion}>alle</FilterPill>
          {FRAKTIONEN.map((f) => (
            <FilterPill key={f} href={qs({ fraktion: f, page: "" })} active={fraktion === f}>{f}</FilterPill>
          ))}
          {/* aktiver Sonderwert (z.B. Koalitions-Kombi), der nicht in der Pill-Liste steht */}
          {fraktion && !FRAKTIONEN.includes(fraktion) && (
            <FilterPill href={qs({ fraktion, page: "" })} active>{fraktion}</FilterPill>
          )}
        </div>

        <div className="text-[12px] text-zinc-500 mb-4 num">
          {total.toLocaleString("de-DE")} Treffer{totalPages > 1 && ` · Seite ${page} / ${totalPages}`}
        </div>

        <div className="space-y-2 fade-in-up fade-in-up-3">
          {rows.map((d) => <DsCard key={d.dbid} d={d} />)}
          {rows.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
              Keine Drucksache passt zu diesem Filter.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 text-[12px]">
            {page > 1 ? (
              <Link href={qs({ page: String(page - 1) })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} /> Zurück
              </Link>
            ) : <span />}
            <span className="text-zinc-400 num">Seite {page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={qs({ page: String(page + 1) })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 transition-colors">
                Weiter <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.25} />
              </Link>
            ) : <span />}
          </div>
        )}
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

function DsCard({ d }: { d: import("@/lib/db").BerlinDsIndexEntry }) {
  const label = KLASSE_LABEL[d.klasse] ?? d.klasse;
  const badge = KLASSE_BADGE[d.klasse] ?? "bg-zinc-100 text-zinc-600";
  const title = (d.titel && d.titel.trim()) || `Drucksache ${d.dokNr ?? d.dbid}`;
  const urheber = d.fraktion || d.einbringer;
  const snippet = d.zusammenfassung?.replace(/\s+/g, " ").trim();
  return (
    <Link href={`/parlamente/berlin/drucksache/${encodeURIComponent(d.dbid)}`} className="block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group">
      <div className="flex items-start gap-4">
        <FileText className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[10px] uppercase tracking-wider">
            <span className={`px-1.5 py-0.5 rounded font-medium ${badge}`}>{label}</span>
            {d.dokNr && <span className="num text-zinc-400">Drs. {d.dokNr}</span>}
            <span className="num text-zinc-400 normal-case">{formatDate(d.datum)}</span>
            {urheber && <span className="text-zinc-400 normal-case truncate max-w-[200px]">· {urheber}</span>}
          </div>
          <div className="text-[14px] font-medium text-zinc-950 leading-snug mb-1 group-hover:text-zinc-700 transition-colors line-clamp-2">
            {title}
          </div>
          {snippet && <div className="text-[12.5px] text-zinc-500 leading-relaxed line-clamp-2">{snippet}</div>}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" strokeWidth={2.25} />
      </div>
    </Link>
  );
}
