/**
 * Berlin-Pilot: Suche scope-getrennt von der Bundes-Suche.
 *
 * Eigene Page statt Refactor der Bundes-Suche, damit Track-Isolation gewahrt bleibt.
 * Nutzt berlin_speeches_fts + berlin_drucksachen_fts via searchBerlinByType.
 *
 * URL: /parlamente/berlin/suche?q=Klima&type=drucksachen
 */
import { searchBerlinByType, type BerlinSearchType, type DrucksacheHit, type BerlinSpeechHit, type PoliticianHit } from "@/lib/suche";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { highlight } from "@/lib/highlight";

const VALID_TYPES: BerlinSearchType[] = ["speeches", "drucksachen", "politicians"];

interface Props {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}

export default async function BerlinSuchePage({ searchParams }: Props) {
  const { q = "", type = "drucksachen", page = "1" } = await searchParams;
  const safeType: BerlinSearchType = (VALID_TYPES as string[]).includes(type) ? (type as BerlinSearchType) : "drucksachen";
  const safePage = Math.max(1, parseInt(page, 10) || 1);

  const result = q.trim().length >= 2 ? searchBerlinByType(q, safeType, safePage, 50) : null;

  // Counts pro Typ holen für Tab-Bar (nur wenn Query da)
  const counts = q.trim().length >= 2 ? {
    drucksachen: searchBerlinByType(q, "drucksachen", 1, 1).total,
    speeches:    searchBerlinByType(q, "speeches", 1, 1).total,
    politicians: searchBerlinByType(q, "politicians", 1, 1).total,
  } : null;

  return (
    <main className="page-wash min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Berlin-Übersicht
        </Link>

        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Berlin · Suche
          </div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-zinc-950 leading-tight mb-3">
            Was sucht das Berliner Abgeordnetenhaus?
          </h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed max-w-2xl">
            18.514 Drucksachen + 23.206 Reden der 19. Wahlperiode. Suche mit Synonym-Erweiterung
            (z. B. „Wohnen" findet auch „Mieten", „Wohnungsbau").
          </p>
        </div>

        {/* Such-Form */}
        <form method="GET" action="/parlamente/berlin/suche" className="mb-6">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-3 focus-within:border-zinc-400 transition-colors">
            <Search className="w-4 h-4 text-zinc-400" strokeWidth={2.25} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Suche in Berliner Drucksachen, Reden…"
              className="flex-1 outline-none text-[14px] text-zinc-900 placeholder:text-zinc-400 bg-transparent"
              autoFocus
            />
            <input type="hidden" name="type" value={safeType} />
            <button type="submit" className="text-[12px] text-zinc-500 hover:text-zinc-900 px-2 py-1 border border-zinc-200 rounded">
              Suchen
            </button>
          </div>
        </form>

        {/* Typ-Tabs */}
        {counts && (
          <div className="mb-6 flex flex-wrap gap-2 text-[12px]">
            {(["drucksachen", "speeches", "politicians"] as const).map((t) => (
              <Link
                key={t}
                href={`?q=${encodeURIComponent(q)}&type=${t}`}
                className={`px-3 py-1.5 rounded-md border transition-colors ${
                  safeType === t
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {t === "drucksachen" && `Drucksachen (${counts.drucksachen})`}
                {t === "speeches" && `Reden (${counts.speeches})`}
                {t === "politicians" && `Personen (${counts.politicians})`}
              </Link>
            ))}
          </div>
        )}

        {/* Beispiele wenn keine Query */}
        {!q.trim() && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-12">
            {[
              { q: "Wohnen", hint: "+ Mieten · Wohnungsbau" },
              { q: "Polizei", hint: "+ Gewaltprävention · Justiz" },
              { q: "Klimaschutz", hint: "+ Energie · Tierschutz" },
              { q: "Verkehr", hint: "+ ÖPNV · Radverkehr" },
              { q: "Bezirke", hint: "12 Berliner Bezirke" },
              { q: "Bildung", hint: "+ Hochschulen · Familie" },
            ].map((b) => (
              <Link
                key={b.q}
                href={`?q=${encodeURIComponent(b.q)}&type=drucksachen`}
                className="block px-3 py-2 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors"
              >
                <div className="text-[13px] font-medium text-zinc-900">{b.q}</div>
                <div className="text-[11px] text-zinc-500">{b.hint}</div>
              </Link>
            ))}
          </div>
        )}

        {/* Ergebnisse */}
        {result && (
          <div className="mt-4">
            <div className="text-[11px] text-zinc-500 mb-4 num">
              {result.total.toLocaleString("de-DE")} {safeType === "drucksachen" ? "Drucksachen" : safeType === "speeches" ? "Reden" : "Personen"}
              {result.expansions.length > 0 && (
                <span className="ml-2">· auch: {result.expansions.slice(0, 5).join(", ")}{result.expansions.length > 5 ? ", …" : ""}</span>
              )}
            </div>

            <div className="space-y-2">
              {result.items.map((item, i) => (
                <ResultCard key={`${item.type}-${i}`} item={item} query={q} expansions={result.expansions} />
              ))}
              {result.items.length === 0 && (
                <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
                  Keine Treffer für „{q}".
                </div>
              )}
            </div>

            {/* Pagination */}
            {result.total > result.pageSize && (
              <div className="mt-6 flex items-center justify-center gap-2 text-[12px]">
                {safePage > 1 && (
                  <Link href={`?q=${encodeURIComponent(q)}&type=${safeType}&page=${safePage - 1}`} className="px-3 py-1 border border-zinc-200 rounded hover:border-zinc-400">
                    ← Zurück
                  </Link>
                )}
                <span className="text-zinc-500 num">
                  Seite {safePage} von {Math.ceil(result.total / result.pageSize)}
                </span>
                {safePage * result.pageSize < result.total && (
                  <Link href={`?q=${encodeURIComponent(q)}&type=${safeType}&page=${safePage + 1}`} className="px-3 py-1 border border-zinc-200 rounded hover:border-zinc-400">
                    Weiter →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

type SearchItem = DrucksacheHit | BerlinSpeechHit | PoliticianHit;

function ResultCard({ item, query, expansions }: { item: SearchItem; query: string; expansions: string[] }) {
  const terms = [query, ...expansions].filter((t) => t.length >= 2);
  if (item.type === "drucksache") {
    const d = item;
    return (
      <Link
        href={d.detail_url ?? "#"}
        className="block border border-zinc-200/70 rounded-xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group"
      >
        <div className="flex items-baseline gap-2 mb-1 flex-wrap text-[11px]">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">{klasseLabel(d.vorgangstyp)}</span>
          {d.drucksache_nr && <span className="num text-zinc-400">{d.drucksache_nr}</span>}
          {d.date && <span className="num text-zinc-400">· {formatDate(d.date)}</span>}
        </div>
        <div className="text-[14px] font-medium text-zinc-950 mb-1 group-hover:text-zinc-700 line-clamp-2">
          {highlight(d.title, terms)}
        </div>
        {d.snippet && (
          <div className="text-[12.5px] text-zinc-600 line-clamp-2">{highlight(d.snippet, terms)}</div>
        )}
      </Link>
    );
  }
  if (item.type === "speech") {
    const s = item;
    return (
      <Link
        href={s.politician_id ? `/politiker/${s.politician_id}` : "#"}
        className="block border border-zinc-200/70 rounded-xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group"
      >
        <div className="flex items-baseline gap-2 mb-1 text-[11px]">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Rede</span>
          {s.speech_date && <span className="num text-zinc-400">{formatDate(s.speech_date)}</span>}
        </div>
        <div
          className="text-[13.5px] text-zinc-800 leading-snug line-clamp-3"
          dangerouslySetInnerHTML={{ __html: s.snippet }}
        />
      </Link>
    );
  }
  if (item.type === "politician") {
    const p = item;
    return (
      <Link
        href={`/politiker/${p.id}`}
        className="block border border-zinc-200/70 rounded-xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors"
      >
        <div className="text-[14px] font-medium text-zinc-950">{highlight(p.name, terms)}</div>
        <div className="text-[11.5px] text-zinc-500">{p.subtitle}</div>
      </Link>
    );
  }
  return null;
}

function klasseLabel(k: string | null): string {
  switch (k) {
    case "anfrage_antwort": return "Schriftliche Anfrage";
    case "antrag": return "Antrag";
    case "gesetzentwurf": return "Gesetzentwurf";
    case "vorlage_senat": return "Senats-Vorlage";
    case "beschlussempfehlung_regex": return "Beschlussempfehlung";
    default: return k ?? "Drucksache";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return iso; }
}
