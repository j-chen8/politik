import { getBerlinThemenAktivitaet } from "@/lib/db";
import { partyColor } from "@/lib/party-colors";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Themenprofil — Abgeordnetenhaus Berlin | Politik-Radar",
  description:
    "Wer treibt welches Thema im Berliner Abgeordnetenhaus? Anträge, Anfragen, Gesetzentwürfe und Reden pro Partei — nach Rolle getrennt, seit Amtsantritt der Wegner-Koalition.",
};

// Konsumfreundliche Themen-Auswahl (echte Politikfelder, keine Querschnitt-/
// Verwaltungs-Tags wie "Bezirke"/"Transparenz").
const THEMEN = [
  "Wohnen", "Mobilität", "Bildung", "Klimaschutz",
  "Gesundheit", "Polizei", "Finanzen", "Stadtentwicklung",
];

// Senat = Regierung als Ganzes → eigenes neutrales Slate; sonst Partei-Farbe.
function farbe(partei: string): string {
  if (partei === "Senat") return "#475569";
  return partyColor(partei);
}

export default function BerlinThemenprofil({
  searchParams,
}: {
  searchParams: Promise<{ thema?: string }>;
}) {
  return <Inner searchParams={searchParams} />;
}

async function Inner({ searchParams }: { searchParams: Promise<{ thema?: string }> }) {
  const { thema: raw } = await searchParams;
  const thema = raw && THEMEN.includes(raw) ? raw : "Wohnen";
  const data = getBerlinThemenAktivitaet(thema);
  const datum = new Date(data.vonDatum).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Link
          href="/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Abgeordnetenhaus Berlin
        </Link>

        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 leading-tight">
          Wer treibt welches Thema?
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          Vier parlamentarische Instrumente, vier <strong>Rollen</strong> — bewusst{" "}
          <strong>nicht</strong> zu einer Zahl verrechnet. Wer Anträge stellt, gestaltet;
          wer fragt, kontrolliert; Gesetze bringt nur der Senat ein; Reden sind die Debatte.
          Seit Amtsantritt der Wegner-Koalition ({datum}).
        </p>

        {/* Themen-Auswahl */}
        <div className="mt-6 flex flex-wrap gap-2">
          {THEMEN.map((t) => {
            const aktiv = t === thema;
            return (
              <Link
                key={t}
                href={`/parlamente/berlin/themenprofil?thema=${encodeURIComponent(t)}`}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  aktiv
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {t}
              </Link>
            );
          })}
        </div>

        {/* Instrumente */}
        <div className="mt-8 space-y-7">
          {data.instrumente.map((ins) => {
            const max = ins.byPartei[0]?.n ?? 1;
            return (
              <section key={ins.key}>
                <div className="flex items-baseline justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-1.5 mb-3">
                  <h2 className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {ins.label}{" "}
                    <span className="text-[12.5px] font-normal text-zinc-400 dark:text-zinc-500">· {ins.rolle}</span>
                  </h2>
                  <span className="shrink-0 text-[12.5px] tabular-nums text-zinc-400 dark:text-zinc-500">
                    {ins.total > 0 ? `${ins.total} gesamt` : "keine"}
                  </span>
                </div>
                {ins.byPartei.length === 0 ? (
                  <p className="text-[13px] text-zinc-400 dark:text-zinc-500">Kein Vorgang zu diesem Thema.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {ins.byPartei.map((p) => (
                      <li key={p.partei} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-[13px] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          {p.partei}
                          <span
                            className={`text-[9px] font-semibold uppercase tracking-wider ${
                              p.regierung ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-300 dark:text-zinc-600"
                            }`}
                          >
                            {p.regierung ? "Reg" : "Opp"}
                          </span>
                        </span>
                        <span className="flex-1 flex items-center gap-2">
                          <span
                            className="h-4 rounded-sm"
                            style={{ width: `${Math.max(2, (p.n / max) * 100)}%`, backgroundColor: farbe(p.partei) }}
                          />
                          <span className="text-[12.5px] tabular-nums text-zinc-600 dark:text-zinc-400">{p.n}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {/* Methodik */}
        <div className="mt-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          <strong className="text-zinc-600 dark:text-zinc-300">Methodik.</strong> Zeitraum: ab {datum}{" "}
          (Amtsantritt der CDU/SPD-Koalition); frühere Vorgänge der Vorgänger-Regierung sind
          ausgeklammert. Themen-Zuordnung über die Roh-Klassifikation der Drucksachen (LLM),
          nicht das gröbere Sammel-Feld. Die vier Instrumente messen <strong>verschiedene Rollen</strong>{" "}
          und werden bewusst nie summiert. Gemeinsame Anträge (z. B. zweier Fraktionen) zählen
          für jede beteiligte Partei. Reden werden über die debattierte Drucksache zugeordnet.
          Reine Vorgangs-Zählung, keine Bewertung. Die verlinkten Drucksachen bleiben die Quelle.
        </div>
      </main>
    </div>
  );
}
