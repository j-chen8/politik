/**
 * ENTWURF — Alle Kommissionsberichte: flache Übersicht sämtlicher in der DB
 * erfassten Berichte je Kommission (kommission_bericht), neueste zuerst. Leit-
 * berichte mit manueller Analyse sind markiert und verlinken auf die Detailseite.
 */
import Link from "next/link";
import { FileText, ArrowLeft, ExternalLink, BarChart3, ChevronDown } from "lucide-react";
import { getAlleKommissionsberichte, type KommissionMitBerichten, type KommissionsberichtItem } from "@/lib/db";

export const dynamic = "force-dynamic";

// Ab dieser Seitenzahl gilt ein Bericht als „umfangreich" und wird offen gezeigt.
// Leitberichte (mit Analyse) sind IMMER offen — auch wenn sie kurz sind (z. B. RNE, 10 S.).
const UMFANG_SCHWELLE = 40;
const istUmfangreich = (b: KommissionsberichtItem) =>
  b.istLeitbericht || (b.pages != null && b.pages >= UMFANG_SCHWELLE);
// Sortierung: der analysierte Leitbericht führt, danach viele Seiten oben,
// bei Gleichstand neueste zuerst.
const nachUmfang = (a: KommissionsberichtItem, b: KommissionsberichtItem) =>
  (Number(b.istLeitbericht) - Number(a.istLeitbericht)) ||
  (b.pages ?? -1) - (a.pages ?? -1) ||
  (b.datum ?? "").localeCompare(a.datum ?? "");

function BerichtZeile({ b, slug }: { b: KommissionsberichtItem; slug: string }) {
  const titel = b.titel && b.titel.trim() ? b.titel : "Bericht ohne Titel";
  return (
    <div className={`flex flex-col gap-1.5 rounded-lg border border-border bg-background/40 p-3 ${b.istLeitbericht ? "border-l-2 border-l-foreground/60" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {b.datum && <span className="num shrink-0 text-[12px] text-muted">{b.datum}</span>}
        {b.url ? (
          <a href={b.url} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-baseline gap-1 text-[14px] font-medium text-foreground hover:underline">
            {titel}<ExternalLink className="h-3 w-3 shrink-0 translate-y-0.5 text-muted" aria-label="Quelle öffnen" />
          </a>
        ) : (
          <span className="text-[14px] font-medium text-foreground">{titel}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {b.typ && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-muted dark:bg-zinc-800">{b.typ}</span>}
        {b.pages != null && (
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
            PDF · {b.pages} S.
          </span>
        )}
        {b.istLeitbericht && (
          <Link href={`/kommissionen/${slug}`}
                className="inline-flex items-center gap-1 rounded bg-foreground px-1.5 py-0.5 text-[11px] font-medium text-background hover:opacity-90">
            <BarChart3 className="h-3 w-3" /> Analyse
          </Link>
        )}
      </div>
    </div>
  );
}

function GremiumBlock({ g }: { g: KommissionMitBerichten }) {
  // Umfangreiche Berichte (+ Leitberichte) offen zeigen, kurze Dokumente einklappen.
  let offen = g.berichte.filter(istUmfangreich).sort(nachUmfang);
  let klein = g.berichte.filter((b) => !istUmfangreich(b)).sort(nachUmfang);
  // Nie mit leerem Kopf: gibt es keinen „großen" Bericht, den größten hochziehen.
  if (offen.length === 0 && klein.length > 0) { offen = [klein[0]]; klein = klein.slice(1); }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{g.name}</span>
          {g.kurzname && <span className="text-[13px] text-muted">{g.kurzname}</span>}
        </div>
        <div className="flex items-center gap-2">
          {g.ministerium && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[12px] text-muted dark:bg-zinc-800">{g.ministerium}</span>}
          <span className="text-[12px] text-muted">{g.berichte.length} {g.berichte.length === 1 ? "Bericht" : "Berichte"}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {offen.map((b) => <BerichtZeile key={b.id} b={b} slug={g.slug} />)}
      </div>
      {klein.length > 0 && (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[13px] text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            <span className="group-open:hidden">{klein.length} kürzere {klein.length === 1 ? "Dokument" : "Dokumente"} anzeigen</span>
            <span className="hidden group-open:inline">kürzere Dokumente ausblenden</span>
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {klein.map((b) => <BerichtZeile key={b.id} b={b} slug={g.slug} />)}
          </div>
        </details>
      )}
    </div>
  );
}

export default function KommissionsberichtePage() {
  const data = getAlleKommissionsberichte();
  if (!data) {
    return <p className="p-8 text-muted">Noch keine Berichte — erst scripts/scrape-kommissionsberichte.ts laufen lassen.</p>;
  }
  const tier1 = data.gremien.filter((g) => g.tier === 1);
  const tier2 = data.gremien.filter((g) => g.tier !== 1);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-2">
        <Link href="/kommissionen" className="inline-flex w-fit items-center gap-1 text-[13px] text-muted hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kommissionen-Tracker
        </Link>
        <h1 className="flex items-center gap-2 text-[24px] font-semibold text-foreground sm:text-[28px]">
          <FileText className="h-6 w-6 text-muted" /> Alle Kommissionsberichte
        </h1>
        <p className="text-[15px] text-muted">
          {data.totalBerichte} erfasste Berichte aus {data.gremien.length} Kommissionen und Beiräten — neueste zuerst.
          Leitberichte mit eigener Analyse sind markiert.
        </p>
      </header>

      {tier1.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-semibold text-foreground">Aktuelle Kommissionen</h2>
          {tier1.map((g) => <GremiumBlock key={g.slug} g={g} />)}
        </section>
      )}

      {tier2.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[18px] font-semibold text-foreground">Ständige Gremien &amp; Beiräte</h2>
          {tier2.map((g) => <GremiumBlock key={g.slug} g={g} />)}
        </section>
      )}
    </div>
  );
}
