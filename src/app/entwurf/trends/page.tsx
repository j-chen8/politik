/**
 * ENTWURF — Salienz-Trends: was kommt über die Zeit häufig in den Nachrichten?
 * Fokus: Gesetze / Reformen / parlamentarische Verfahren (Plattform-Kern).
 * Liest die akkumulierte run_date-History (füllt sich mit jedem 6h-Lauf).
 */
import Link from "next/link";
import { Scale } from "lucide-react";
import { getSalienzTrends } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmt(d: string): string {
  try { return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "short" }); } catch { return d; }
}

export default function TrendsPage() {
  const t = getSalienzTrends(30);
  if (!t) return <p className="p-8 text-muted">Noch keine Trend-Daten — die History füllt sich mit jedem 6h-Lauf.</p>;
  const { gesetzStories, felder } = t;
  const maxTage = Math.max(1, ...felder.map((f) => f.tageGesetz), 1);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="flex items-center gap-2 text-[24px] font-semibold text-foreground sm:text-[28px]">
          <Scale className="h-6 w-6 text-muted" /> Gesetze & Reformen in den Nachrichten
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Welche Gesetzes-/Reform-Themen die letzten {t.tage} Tage Schlagzeilen machten (seit {fmt(t.seit)}). Wächst mit jedem 6h-Lauf.
        </p>
      </header>

      {/* Dauerbrenner: Felder mit den meisten Gesetzes-/Reform-Tagen */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold text-foreground">Felder mit den meisten Gesetzes-/Reform-Themen</h2>
        {felder.filter((f) => f.tageGesetz > 0).length === 0 ? (
          <p className="text-[14px] text-muted">Noch keine als Gesetz/Reform markierten Stories im Zeitraum.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {felder.filter((f) => f.tageGesetz > 0).slice(0, 12).map((f) => (
              <Link key={f.themenfeld} href={f.slug ? `/parteien/feld/${f.slug}` : "/themen"} className="group flex items-center gap-3 text-[14px]">
                <span className="w-44 shrink-0 truncate text-foreground group-hover:underline">{f.themenfeld}</span>
                <span className="h-2.5 rounded-full bg-foreground/80" style={{ width: `${Math.max(8, (f.tageGesetz / maxTage) * 100)}%` }} />
                <span className="num ml-auto text-[12px] text-muted">{f.tageGesetz} Tage · {f.gesetzCluster} Stories</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Chronologie: zuletzt Gesetzes-/Reform-Stories */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold text-foreground">Zuletzt: Gesetze & Reformen</h2>
        {gesetzStories.length === 0 ? (
          <p className="text-[14px] text-muted">Noch keine Gesetzes-/Reform-Stories erfasst.</p>
        ) : (
          gesetzStories.map((s, i) => (
            <div key={`${s.runDate}-${i}`} className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-[12px] text-muted">
                <span className="num rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">{fmt(s.runDate)}</span>
                <Link href={s.slug ? `/parteien/feld/${s.slug}` : "/themen"} className="font-medium text-foreground hover:underline">{s.themenfeld}</Link>
                <span className="ml-auto">{s.outletCount} Outlets</span>
              </div>
              <p className="text-[15px] font-semibold leading-snug text-foreground">{s.leitthema}</p>
              {s.summary && <p className="text-[14px] leading-relaxed text-muted">{s.summary}</p>}
              {s.outlets.length > 0 && <p className="text-[11.5px] text-muted">→ {s.outlets.join(" · ")}</p>}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
