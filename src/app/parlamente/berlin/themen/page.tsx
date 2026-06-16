import { getBerlinThemenfelderCounts, listBerlinDrucksachenForIndex, getBerlinUnterthemenForFeld, getBerlinTopTagsForUnterthema } from "@/lib/db";
import { berlinFeldBySlug } from "@/lib/berlin-themen-struktur";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, FileText, Layers } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Themen — Abgeordnetenhaus Berlin | Politik-Radar",
  description:
    "Woran arbeitet das Berliner Abgeordnetenhaus? Alle analysierten Drucksachen nach Politikfeld sortiert — 12 Felder plus Querschnittsthemen, jedes mit Anfragen, Anträgen und Gesetzentwürfen.",
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
  anfrage_antwort: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
  antrag: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400",
  gesetzentwurf: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400",
  vorlage_senat: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  beschlussempfehlung: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  beschlussempfehlung_regex: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
};

const FRAKTIONEN = ["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP"];

export default function BerlinThemenPage({
  searchParams,
}: {
  searchParams: Promise<{ feld?: string; unter?: string; klasse?: string; fraktion?: string; page?: string }>;
}) {
  return <Inner searchParams={searchParams} />;
}

async function Inner({
  searchParams,
}: {
  searchParams: Promise<{ feld?: string; unter?: string; klasse?: string; fraktion?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const feld = sp.feld ? berlinFeldBySlug(sp.feld) : null;
  if (sp.feld && feld) return <FeldDetail feld={feld} sp={sp} />;
  return <Landing />;
}

// ────────────────────────────── Landing ──────────────────────────────
function Landing() {
  const { felder, querschnitt, gesamtDs } = getBerlinThemenfelderCounts();
  const max = felder[0]?.count ?? 1;

  return (
    <div className="page-wash">
      <div className="w-full page-shell">
        <Link href="/parlamente/berlin" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zum Abgeordnetenhaus Berlin
        </Link>

        <div className="mb-8 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Abgeordnetenhaus Berlin · 19. Wahlperiode</div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-3">Themen</h1>
          <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            Woran arbeitet das Abgeordnetenhaus? Alle{" "}
            <span className="num font-medium text-zinc-900 dark:text-zinc-100">{gesamtDs.toLocaleString("de-DE")}</span>{" "}
            analysierten Drucksachen, sortiert nach Politikfeld. Wählen Sie ein Feld, um die
            Anfragen, Anträge und Gesetzentwürfe dahinter zu sehen.
          </p>
        </div>

        {/* Politikfelder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 fade-in-up fade-in-up-2">
          {felder.map((f) => (
            <FeldKarte key={f.key} f={f} max={max} />
          ))}
        </div>

        {/* Querschnitt */}
        <div className="mt-10 fade-in-up fade-in-up-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Querschnittsthemen</h2>
          </div>
          <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl mb-3">
            Diese vier Themen laufen <strong>quer durch alle Politikfelder</strong> — eine Drucksache
            kann gleichzeitig hier und in einem Feld oben liegen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {querschnitt.map((f) => (
              <FeldKarte key={f.key} f={f} max={max} muted />
            ))}
          </div>
        </div>

        {/* Methodik */}
        <div className="mt-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-2xl">
          <strong className="text-zinc-600 dark:text-zinc-300">Methodik.</strong> Jede Drucksache wird bei der
          LLM-Analyse mit kontrollierten Themen-Schlagwörtern versehen; diese sind hier zu 12 Politikfeldern
          und 4 Querschnittsthemen gebündelt. Eine Drucksache kann in mehreren Feldern liegen (im Schnitt rund
          zwei) — pro Feld wird sie aber nur einmal gezählt. Reine Zählung der Vorgänge, keine Bewertung. Quelle
          bleibt die jeweils verlinkte Drucksache. Details in der{" "}
          <Link href="/parlamente/berlin/methodik" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline">Methodik</Link>.
        </div>
      </div>
    </div>
  );
}

function FeldKarte({ f, max, muted }: { f: { key: string; label: string; count: number }; max: number; muted?: boolean }) {
  const pct = Math.max(2, (f.count / max) * 100);
  return (
    <Link
      href={`/parlamente/berlin/themen?feld=${encodeURIComponent(f.key)}`}
      className="group block rounded-2xl border border-border bg-card px-5 py-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[14.5px] font-medium text-zinc-950 dark:text-zinc-50 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors leading-snug">{f.label}</span>
        <span className="num shrink-0 text-[13px] tabular-nums text-zinc-500 dark:text-zinc-400">{f.count.toLocaleString("de-DE")}</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${muted ? "bg-zinc-300 dark:bg-zinc-600" : "bg-zinc-800 dark:bg-zinc-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}

// ────────────────────────────── Feld-Detail ──────────────────────────────
function FeldDetail({
  feld,
  sp,
}: {
  feld: { key: string; label: string; tags: readonly string[] };
  sp: { unter?: string; klasse?: string; fraktion?: string; page?: string };
}) {
  const klasse = sp.klasse ?? "";
  const fraktion = sp.fraktion ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Achse-B-Sub-Ebene: Unterthemen dieses Felds (nur befüllt, wo der Batch lief).
  const unterthemen = getBerlinUnterthemenForFeld(feld.label);
  const unterNames = new Set(unterthemen.map((u) => u.unterthema));
  const unter = sp.unter && unterNames.has(sp.unter) ? sp.unter : "";
  const topTags = unter ? getBerlinTopTagsForUnterthema(feld.label, unter) : [];

  const { rows, total, klasseFacets } = listBerlinDrucksachenForIndex({
    tags: feld.tags,
    klasse: klasse || undefined,
    fraktion: fraktion || undefined,
    unterthema: unter || undefined,
    unterthemaFeld: unter ? feld.label : undefined,
    offset,
    limit: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allKlassenTotal = klasseFacets.reduce((s, f) => s + f.count, 0);

  const qs = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ feld: feld.key });
    if (unter && !("unter" in extra)) params.set("unter", unter);
    if (klasse && !("klasse" in extra)) params.set("klasse", klasse);
    if (fraktion && !("fraktion" in extra)) params.set("fraktion", fraktion);
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    return `?${params.toString()}`;
  };

  return (
    <div className="page-wash">
      <div className="w-full page-shell">
        <Link href="/parlamente/berlin/themen" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Alle Themen
        </Link>

        <div className="mb-7 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Abgeordnetenhaus Berlin · Themenfeld</div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mb-3">{feld.label}</h1>
          <p className="text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            <span className="num font-medium text-zinc-900 dark:text-zinc-100">{allKlassenTotal.toLocaleString("de-DE")}</span>{" "}
            Drucksachen in diesem Feld. Bündelt die Schlagwörter:{" "}
            <span className="text-zinc-500 dark:text-zinc-400">{feld.tags.join(" · ")}</span>.
          </p>
        </div>

        {/* Achse-B-Sub-Navigation: Unterthemen (nur wo der LLM-Batch lief) */}
        {unterthemen.length > 0 && (
          <div className="mb-6 fade-in-up fade-in-up-2">
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="text-zinc-400 dark:text-zinc-500 self-center mr-1">Unterthema:</span>
              <FilterPill href={qs({ unter: "", page: "" })} active={!unter}>
                alle
              </FilterPill>
              {unterthemen.map((u) => (
                <FilterPill key={u.unterthema} href={qs({ unter: u.unterthema, page: "" })} active={unter === u.unterthema}>
                  {u.unterthema} ({u.count.toLocaleString("de-DE")})
                </FilterPill>
              ))}
            </div>
            {unter && topTags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-zinc-400 dark:text-zinc-500 self-center mr-0.5">Häufige Schlagwörter:</span>
                {topTags.map((t) => (
                  <span key={t.tag} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {t.tag} <span className="num text-zinc-400 dark:text-zinc-500">{t.count}</span>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed max-w-2xl">
              Feinere Ebene: jede Drucksache wurde per LLM einem oder mehreren Unterthemen zugeordnet
              (eine DS kann in mehreren liegen). Reine Zuordnung, keine Bewertung.
            </p>
          </div>
        )}

        {/* Klassen-Filter */}
        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 dark:text-zinc-500 self-center mr-1">Typ:</span>
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

        {/* Fraktions-Filter */}
        <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 dark:text-zinc-500 self-center mr-1">Fraktion:</span>
          <FilterPill href={qs({ fraktion: "", page: "" })} active={!fraktion}>alle</FilterPill>
          {FRAKTIONEN.map((f) => (
            <FilterPill key={f} href={qs({ fraktion: f, page: "" })} active={fraktion === f}>{f}</FilterPill>
          ))}
        </div>

        <div className="text-[12px] text-zinc-500 dark:text-zinc-400 mb-4 num">
          {total.toLocaleString("de-DE")} Treffer{totalPages > 1 && ` · Seite ${page} / ${totalPages}`}
        </div>

        <div className="space-y-2 fade-in-up fade-in-up-3">
          {rows.map((d) => <DsCard key={d.dbid} d={d} />)}
          {rows.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 dark:text-zinc-400 py-12 border border-dashed border-border rounded-2xl">
              Keine Drucksache passt zu diesem Filter.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 text-[12px]">
            {page > 1 ? (
              <Link href={qs({ page: String(page - 1) })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.25} /> Zurück
              </Link>
            ) : <span />}
            <span className="text-zinc-400 dark:text-zinc-500 num">Seite {page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={qs({ page: String(page + 1) })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-card text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
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
    <Link href={href} className={`px-2.5 py-1 rounded-md border transition-colors ${active ? "bg-zinc-900 text-white border-zinc-900 dark:border-zinc-100" : "bg-card text-zinc-700 dark:text-zinc-300 border-border hover:border-zinc-400 dark:hover:border-zinc-500"}`}>
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
  const badge = KLASSE_BADGE[d.klasse] ?? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
  const title = (d.titel && d.titel.trim()) || `Drucksache ${d.dokNr ?? d.dbid}`;
  const urheber = d.fraktion || d.einbringer;
  const snippet = d.zusammenfassung?.replace(/\s+/g, " ").trim();
  return (
    <Link href={`/parlamente/berlin/drucksache/${encodeURIComponent(d.dbid)}`} className="block border border-border rounded-2xl bg-card px-5 py-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group">
      <div className="flex items-start gap-4">
        <FileText className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0 mt-0.5" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[10px] uppercase tracking-wider">
            <span className={`px-1.5 py-0.5 rounded font-medium ${badge}`}>{label}</span>
            {d.dokNr && <span className="num text-zinc-400 dark:text-zinc-500">Drs. {d.dokNr}</span>}
            <span className="num text-zinc-400 dark:text-zinc-500 normal-case">{formatDate(d.datum)}</span>
            {urheber && <span className="text-zinc-400 dark:text-zinc-500 normal-case truncate max-w-[200px]">· {urheber}</span>}
          </div>
          <div className="text-[14px] font-medium text-zinc-950 dark:text-zinc-50 leading-snug mb-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors line-clamp-2">
            {title}
          </div>
          {snippet && <div className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">{snippet}</div>}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" strokeWidth={2.25} />
      </div>
    </Link>
  );
}
