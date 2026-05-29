import { listBerlinSitzungen, getBerlinMethodikCounts, type BerlinSitzungListEntry } from "@/lib/db";
import { ArrowLeft, ArrowRight, Mic, ListTree, Vote } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plenarsitzungen — Abgeordnetenhaus Berlin | Politik-Radar",
  description: "Alle Plenarsitzungen des Berliner Abgeordnetenhauses der 19. Wahlperiode mit Reden, Tagesordnungspunkten und Abstimmungen.",
};

const MONTH_YEAR = (iso: string | null): string | null => {
  if (!iso) return null;
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : null;
};

export default function BerlinSitzungenPage() {
  const sitzungen = listBerlinSitzungen();
  const c = getBerlinMethodikCounts();

  // Jahr pro Sitzung: aus dem Datum; für die ~10 Sitzungen ohne erfasstes Datum
  // den zuletzt bekannten Jahrgang fortschreiben (Sitzungs-Nr. ist chronologisch).
  let lastYear = MONTH_YEAR(sitzungen.find((s) => MONTH_YEAR(s.datum))?.datum ?? null) ?? "—";
  const groups: { year: string; items: BerlinSitzungListEntry[] }[] = [];
  for (const s of sitzungen) {
    const y = MONTH_YEAR(s.datum) ?? lastYear;
    if (MONTH_YEAR(s.datum)) lastYear = y;
    const g = groups[groups.length - 1];
    if (g && g.year === y) g.items.push(s);
    else groups.push({ year: y, items: [s] });
  }

  const analysiertPct = c.redenNichtPraesidium > 0 ? Math.round((c.redenAnalysiert / c.redenNichtPraesidium) * 100) : 0;
  const quotePct = c.quoteTotal > 0 ? Math.round((c.quoteValid / c.quoteTotal) * 1000) / 10 : 0;

  return (
    <div className="page-wash">
      <div className="w-full max-w-5xl mx-auto px-5 pt-12 pb-24">
        <Link href="/parlamente/berlin" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zum Abgeordnetenhaus Berlin
        </Link>

        <div className="mb-8 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">Abgeordnetenhaus Berlin · 19. Wahlperiode</div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-3">Plenarsitzungen</h1>
          <p className="text-[15px] text-zinc-600 leading-relaxed max-w-2xl">
            Jede Sitzung als Protokoll aufbereitet: Wortbeiträge, gruppierte Tagesordnungspunkte mit
            KI-Zusammenfassung und die zugehörigen Abstimmungen.
          </p>
        </div>

        {/* Coverage-Strip — ehrliche Erfassungs-Kennzahlen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-200/70 rounded-2xl overflow-hidden border border-zinc-200/70 mb-10 fade-in-up fade-in-up-2">
          <Stat value={c.sitzungen.toLocaleString("de-DE")} label="Sitzungen" />
          <Stat value={c.redenNichtPraesidium.toLocaleString("de-DE")} label="Wortbeiträge (ohne Präsidium)" />
          <Stat value={`${analysiertPct} %`} label={`davon KI-analysiert (${c.redenAnalysiert.toLocaleString("de-DE")})`} />
          <Stat value={`${quotePct.toLocaleString("de-DE")} %`} label="Zitate verifiziert" />
        </div>

        <div className="space-y-8 fade-in-up fade-in-up-3">
          {groups.map((g) => (
            <div key={g.year}>
              <div className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 num">{g.year}</div>
              <div className="space-y-2">
                {g.items.map((s) => <SitzungCard key={s.nr} s={s} />)}
              </div>
            </div>
          ))}
          {sitzungen.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
              Keine Sitzungen erfasst.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white px-4 py-4">
      <div className="text-2xl font-semibold tracking-[-0.02em] num">{value}</div>
      <div className="text-[11px] text-zinc-500 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function SitzungCard({ s }: { s: BerlinSitzungListEntry }) {
  const datum = formatDate(s.datum);
  return (
    <Link href={`/parlamente/berlin/sitzung/${s.nr}`} className="block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="shrink-0 w-14 text-center">
          <div className="text-2xl font-semibold tracking-[-0.02em] num leading-none">{s.nr}</div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">Sitzung</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-zinc-950 group-hover:text-zinc-700 transition-colors">
            {datum ?? <span className="text-zinc-400">Datum nicht erfasst</span>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[12px] text-zinc-500">
            <span className="inline-flex items-center gap-1"><ListTree className="w-3.5 h-3.5 text-zinc-300" strokeWidth={2} /><span className="num">{s.tops}</span> Tagesordnungspunkte</span>
            <span className="inline-flex items-center gap-1"><Mic className="w-3.5 h-3.5 text-zinc-300" strokeWidth={2} /><span className="num">{s.reden}</span> Wortbeiträge</span>
            {s.votes > 0 && <span className="inline-flex items-center gap-1"><Vote className="w-3.5 h-3.5 text-zinc-300" strokeWidth={2} /><span className="num">{s.votes}</span> Abstimmungen</span>}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2.25} />
      </div>
    </Link>
  );
}
