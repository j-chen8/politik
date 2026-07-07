/**
 * ENTWURF — Kommissions-Tracker: Watchlist staatlicher Kommissionen/Beiräte mit
 * letztem Bericht und jüngsten News-Signalen. Liest kommission/kommission_bericht/
 * kommission_news rein lesend; Schema legt scripts/_lib/kommissionen-schema.ts an.
 */
import Link from "next/link";
import { Scale, FileText } from "lucide-react";
import { getKommissionenTracker, type KommissionView } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  laufend: "laufend",
  bericht_vorgelegt: "Bericht vorgelegt",
  aufgeloest: "abgeschlossen",
};

function KommissionCard({ k }: { k: KommissionView }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      {/* Kopf: Name/Kurzname + Status-Badge */}
      <div className="flex items-start gap-2">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{k.name}</span>
          {k.kurzname && <span className="text-[13px] text-muted">{k.kurzname}</span>}
        </div>
        {k.status && (
          <span className="ml-auto shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            {STATUS_LABEL[k.status] ?? k.status}
          </span>
        )}
      </div>
      {/* Meta-Zeile: Ministerium-Badge + Thema */}
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
        {k.ministerium && <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">{k.ministerium}</span>}
        {k.thema && <span>{k.thema}</span>}
      </div>
      {/* Nächster Bericht (Klartext) */}
      {k.nextExpected && (
        <p className="text-[13px] text-muted">Nächster Bericht: <span className="text-foreground">{k.nextExpected}</span></p>
      )}
      {/* Neuester Bericht (Link + Typ + PDF) */}
      {k.neuesterBericht && (
        <p className="flex flex-wrap items-center gap-1.5 text-[13px]">
          <span className="text-muted">Letzter Bericht:</span>
          <Link href={k.neuesterBericht.url} className="text-foreground hover:underline" target="_blank" rel="noopener noreferrer">
            {k.neuesterBericht.titel ?? "Dokument"}
          </Link>
          {k.neuesterBericht.datum && <span className="num text-muted">({k.neuesterBericht.datum})</span>}
          {k.neuesterBericht.typ && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-muted dark:bg-zinc-800">{k.neuesterBericht.typ}</span>
          )}
          {k.neuesterBericht.pdfVorhanden && (
            <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
              PDF{k.neuesterBericht.pages ? ` · ${k.neuesterBericht.pages} S.` : ""}
            </span>
          )}
        </p>
      )}
      {/* Jüngste News-Signale */}
      {k.juengsteSignale.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg bg-background/60 p-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">News-Signale</span>
          {k.juengsteSignale.map((s) => (
            <Link key={s.newsItemId} href={s.link} target="_blank" rel="noopener noreferrer"
                  className="text-[13px] text-muted hover:underline">
              <span className="num mr-1">{s.runDate}</span> {s.title}
            </Link>
          ))}
        </div>
      )}
      {k.notiz && <p className="text-[12px] text-muted">{k.notiz}</p>}
      {k.hatAnalyse && (
        <Link href={`/kommissionen/${k.slug}`}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90">
          Analyse ansehen →
        </Link>
      )}
    </div>
  );
}

export default function KommissionenPage() {
  const data = getKommissionenTracker();
  if (!data) {
    return <p className="p-8 text-muted">Noch keine Daten — erst scripts/fetch-kommissionen.ts laufen lassen.</p>;
  }
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="flex items-center gap-2 text-[24px] font-semibold text-foreground sm:text-[28px]">
          <Scale className="h-6 w-6 text-muted" /> Kommissionen
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Staatliche Kommissionen und Beiräte: erwartete Berichte, zuletzt vorgelegte Gutachten und aktuelle Signale aus den Nachrichten.
        </p>
        <Link href="/kommissionen/berichte"
              className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <FileText className="h-4 w-4 text-muted" /> Alle Berichte ansehen →
        </Link>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold text-foreground">Watchlist</h2>
        {data.tier1.length === 0 ? (
          <p className="text-[14px] text-muted">Noch keine Einträge.</p>
        ) : data.tier1.map((k) => <KommissionCard key={k.slug} k={k} />)}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold text-foreground">Ständige Gremien</h2>
        {data.tier2.length === 0 ? (
          <p className="text-[14px] text-muted">Noch keine Einträge.</p>
        ) : data.tier2.map((k) => <KommissionCard key={k.slug} k={k} />)}
      </section>
    </div>
  );
}
