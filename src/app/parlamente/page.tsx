import { SearchBox } from "@/components/SearchBox";
import { getParliamentsOverview, type ParliamentOverview } from "@/lib/db";
import Link from "next/link";

/**
 * Prototyp: Parlaments-Hub — skalierbarer Einstieg über die drei Ebenen der
 * Demokratie (Bund · Länder · Europa). Eigene Route, lässt die Live-Landing
 * (design/linear/page.tsx) unangetastet.
 *
 * Länder vorerst als Kachel-Grid (MVP) — Platzhalter für die geplante
 * interaktive Deutschland-Karte.
 */

const TIER: Record<ParliamentOverview["tier"], { label: string; cls: string; legende: string }> = {
  voll: {
    label: "Voll-Analyse",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    legende: "Reden-, Drucksachen- & Abstimmungs-Analyse",
  },
  pilot: {
    label: "Pilot",
    cls: "text-blue-700 bg-blue-50 border-blue-200",
    legende: "Stammdaten, Lebensläufe, parlamentarische Arbeit",
  },
  stammdaten: {
    label: "In Vorbereitung",
    cls: "text-zinc-400 bg-zinc-100 border-zinc-200",
    legende: "nur Stammdaten — noch nicht aufrufbar",
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
      {children}
    </h2>
  );
}

function ParliamentTile({ p, featured = false }: { p: ParliamentOverview; featured?: boolean }) {
  const tier = TIER[p.tier];
  const active = p.tier !== "stammdaten";
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-semibold tracking-[-0.02em] text-zinc-950 ${
            featured ? "text-xl" : "text-[15px]"
          }`}
        >
          {p.label}
        </h3>
        <span
          className={`shrink-0 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${tier.cls}`}
        >
          {tier.label}
        </span>
      </div>
      <p className="text-[12.5px] text-zinc-500 mt-1.5">
        <span className="num font-medium text-zinc-700">
          {p.memberCount.toLocaleString("de-DE")}
        </span>{" "}
        {p.type === "eu" ? "Abgeordnete (DE)" : "Abgeordnete"}
      </p>
    </>
  );
  const base = `rounded-xl border p-4 ${featured ? "sm:p-5" : ""}`;
  return active ? (
    <Link
      href={`/politiker?parlament=${p.id}`}
      className={`${base} block border-zinc-200/70 bg-white hover:border-zinc-300 hover:shadow-sm transition-all`}
    >
      {body}
    </Link>
  ) : (
    <div
      className={`${base} border-zinc-200/60 bg-zinc-50/60 cursor-default`}
      title="Noch keine Detaildaten — in Vorbereitung"
    >
      {body}
    </div>
  );
}

export default function ParlamenteHub() {
  const all = getParliamentsOverview();
  const bund = all.filter((p) => p.type === "bundestag");
  const laender = all
    .filter((p) => p.type === "landtag")
    .sort((a, b) => a.label.localeCompare(b.label, "de"));
  const eu = all.filter((p) => p.type === "eu");

  return (
    <div className="page-wash min-h-screen">
      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 pt-6 pb-24 fade-in-up">
        <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.97] text-zinc-950 mb-5">
          Wer vertritt Sie —
          <br />
          <span className="bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-400 bg-clip-text text-transparent">
            auf jeder Ebene?
          </span>
        </h1>
        <p className="text-center text-[16px] text-zinc-500 max-w-lg mx-auto mb-8 leading-relaxed">
          Bundestag, 16 Landesparlamente und das Europaparlament — eine Plattform.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBox />
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-5 pb-24 space-y-12 fade-in-up fade-in-up-2">
        {/* Bund */}
        <section>
          <SectionLabel>Bund</SectionLabel>
          {bund.map((p) => (
            <ParliamentTile key={p.id} p={p} featured />
          ))}
        </section>

        {/* Länder */}
        <section>
          <SectionLabel>Landesparlamente</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {laender.map((p) => (
              <ParliamentTile key={p.id} p={p} />
            ))}
          </div>
          <p className="text-[11px] text-zinc-400 mt-3">
            MVP-Kachel-Grid — Platzhalter für die geplante interaktive Deutschland-Karte.
          </p>
        </section>

        {/* Europa */}
        <section>
          <SectionLabel>Europa</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {eu.map((p) => (
              <ParliamentTile key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* Legende */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500 border-t border-zinc-200/70 pt-5">
          <span className="font-medium uppercase tracking-wider text-zinc-400">Abdeckung</span>
          {(["voll", "pilot", "stammdaten"] as const).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span
                className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${TIER[t].cls}`}
              >
                {TIER[t].label}
              </span>
              <span className="text-zinc-500">{TIER[t].legende}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
