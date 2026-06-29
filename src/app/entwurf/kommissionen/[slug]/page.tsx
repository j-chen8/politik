/**
 * ENTWURF — Detailseite eines Kommissions-Leitberichts: manuelle Analyse
 * (Kennzahlen, Einschnitte, Betroffene, Empfehlungen) + Link zum Original-PDF. Rein lesend.
 */
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getKommissionAnalyse, type KommissionAnalysePunkt } from "@/lib/db";

export const dynamic = "force-dynamic";

const IMPACT_RANK: Record<string, number> = { hoch: 0, mittel: 1, gering: 2 };
const EINSCHNITT_ARTEN = new Set(["Belastung", "Kürzung", "Pflicht"]);
// Dezenter linker Akzentrand statt Pille — zeigt Impact ohne Text-Clutter.
const accent = (impact?: string) =>
  impact === "hoch" ? "border-l-2 border-l-red-400 dark:border-l-red-500/60"
  : impact === "mittel" ? "border-l-2 border-l-amber-400 dark:border-l-amber-500/50"
  : "border-l-2 border-l-transparent";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-muted dark:bg-zinc-800">{children}</span>;
}

export default async function KommissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getKommissionAnalyse(slug);

  if (!a) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/entwurf/kommissionen" className="inline-flex items-center gap-1 text-[13px] text-muted hover:underline"><ArrowLeft className="h-4 w-4" /> Zurück</Link>
        <p className="mt-6 text-muted">Keine Kommission „{slug}" gefunden.</p>
      </div>
    );
  }

  // Empfehlungen nach Kapitel gruppieren (Reihenfolge des ersten Vorkommens).
  const gruppen: { kapitel: string; punkte: KommissionAnalysePunkt[] }[] = [];
  for (const p of a.kernpunkte) {
    const key = p.kapitel ?? "Empfehlungen";
    let g = gruppen.find((x) => x.kapitel === key);
    if (!g) { g = { kapitel: key, punkte: [] }; gruppen.push(g); }
    g.punkte.push(p);
  }

  // Einschnitte: Belastungen/Kürzungen/Pflichten, nach Impact (hoch→gering).
  const einschnitte = a.kernpunkte
    .filter((p) => p.art && EINSCHNITT_ARTEN.has(p.art))
    .sort((x, y) => (IMPACT_RANK[x.impact ?? "gering"] ?? 9) - (IMPACT_RANK[y.impact ?? "gering"] ?? 9));

  // Betroffenen-Matrix: nur Gruppen mit HOCH-Impact-Maßnahmen (Fallback: alle).
  const matrixQuelle = a.kernpunkte.filter((p) => p.impact === "hoch");
  const matrixPunkte = matrixQuelle.length > 0 ? matrixQuelle : a.kernpunkte;
  const matrix: { gruppe: string; punkte: KommissionAnalysePunkt[] }[] = [];
  for (const p of matrixPunkte) {
    const g = p.gruppe && p.gruppe !== "—" ? p.gruppe : "Sonstige/allgemein";
    let m = matrix.find((x) => x.gruppe === g);
    if (!m) { m = { gruppe: g, punkte: [] }; matrix.push(m); }
    m.punkte.push(p);
  }
  const minRank = (ps: KommissionAnalysePunkt[]) => Math.min(...ps.map((p) => IMPACT_RANK[p.impact ?? "gering"] ?? 9));
  matrix.sort((x, y) => minRank(x.punkte) - minRank(y.punkte));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 px-6 py-8">
      <Link href="/entwurf/kommissionen" className="inline-flex items-center gap-1 text-[13px] text-muted hover:underline"><ArrowLeft className="h-4 w-4" /> Kommissionen</Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-[26px] font-semibold leading-tight text-foreground sm:text-[32px]">{a.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          {a.kurzname && <Chip>{a.kurzname}</Chip>}
          {a.ministerium && <Chip>{a.ministerium}</Chip>}
          {a.thema && <span>{a.thema}</span>}
        </div>
        {a.auftrag && <p className="mt-1 max-w-3xl text-[15px] leading-relaxed text-muted">{a.auftrag}</p>}
      </header>

      {!a.bericht ? (
        <p className="rounded-xl border border-border bg-card p-4 text-[14px] text-muted">Für diesen Bericht liegt noch keine Analyse vor.</p>
      ) : (
        <>
          {/* Kennzahlen — Zahl + Klartext-Bedeutung */}
          {a.kennzahlen.length > 0 && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {a.kennzahlen.map((kz, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
                  <span className="num text-[26px] font-semibold leading-none text-foreground">{kz.wert}</span>
                  <span className="text-[13px] leading-snug text-foreground/80">{kz.label}</span>
                </div>
              ))}
            </section>
          )}

          {/* Auf einen Blick — Fallback nur ohne Kennzahlen */}
          {a.kennzahlen.length === 0 && (a.eckpunkte.length > 0 || a.gesamttenor) && (
            <section className="rounded-xl border border-border bg-background/60 p-4">
              <h2 className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted">Auf einen Blick</h2>
              {a.eckpunkte.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {a.eckpunkte.map((e, i) => (
                    <li key={i} className="flex gap-2 text-[14px] leading-snug text-foreground">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" /><span>{e}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[14px] leading-relaxed text-foreground">{a.gesamttenor}</p>}
            </section>
          )}

          {/* Einschnitte + Wen betrifft es — nebeneinander (Breite nutzen) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {einschnitte.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-[18px] font-semibold text-foreground">Größte Einschnitte</h2>
                <p className="text-[12px] text-muted">Belastungen / Kürzungen / neue Pflichten — sortiert nach Reichweite × Eingriffstiefe.</p>
                <div className="flex flex-col gap-2">
                  {einschnitte.slice(0, 8).map((p, i) => (
                    <div key={i} className={`rounded-lg border border-border bg-card p-3 ${accent(p.impact)}`}>
                      <p className="text-[14px] leading-snug text-foreground">{p.massnahme}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.gruppe && p.gruppe !== "—" && <Chip>{p.gruppe}</Chip>}
                        {p.art && <Chip>{p.art}</Chip>}
                        {p.umsetzbarkeit && <Chip>{p.umsetzbarkeit}</Chip>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {matrix.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="text-[18px] font-semibold text-foreground">Wen betrifft es vor allem</h2>
                <p className="text-[12px] text-muted">Gruppen, die von den Maßnahmen mit dem höchsten Impact getroffen werden.</p>
                <div className="flex flex-col gap-2">
                  {matrix.map((m) => (
                    <div key={m.gruppe} className="rounded-lg border border-border bg-card p-3">
                      <span className="text-[14px] font-semibold text-foreground">{m.gruppe}</span>
                      <ul className="mt-1 flex flex-col gap-0.5">
                        {m.punkte.map((p, i) => (
                          <li key={i} className="text-[13px] leading-snug text-muted">
                            {p.art ? <span className="text-foreground/70">{p.art}: </span> : null}{p.thema ?? p.massnahme.slice(0, 80)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Alle Empfehlungen — zweispaltig je Kapitel */}
          <section className="flex flex-col gap-5">
            <h2 className="text-[18px] font-semibold text-foreground">
              Alle Empfehlungen <span className="text-[14px] font-normal text-muted">({a.kernpunkte.length})</span>
            </h2>
            {gruppen.map((g) => (
              <div key={g.kapitel} className="flex flex-col gap-2">
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{g.kapitel}</h3>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {g.punkte.map((p, i) => (
                    <div key={i} className={`flex gap-3 rounded-lg border border-border bg-card p-3 ${accent(p.impact)}`}>
                      {p.nr != null && <span className="num shrink-0 text-[13px] font-semibold text-muted">{p.nr}</span>}
                      <div className="flex flex-col gap-1">
                        <p className="text-[14px] leading-snug text-foreground">{p.massnahme}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.art && <Chip>{p.art}</Chip>}
                          {p.gruppe && p.gruppe !== "—" && <Chip>{p.gruppe}</Chip>}
                          {p.umsetzbarkeit && <Chip>{p.umsetzbarkeit}</Chip>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Bericht-Quelle / PDF */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
            <FileText className="h-5 w-5 shrink-0 text-muted" />
            <div className="flex flex-col">
              <Link href={a.bericht.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
                {a.bericht.titel ?? "Original-Bericht (PDF öffnen)"}
              </Link>
              <span className="text-[12px] text-muted">
                {[a.bericht.typ, a.bericht.datum, a.bericht.pages ? `${a.bericht.pages} S.` : null].filter(Boolean).join(" · ")}
                {a.seiten ? ` · ${a.seiten}` : ""}{a.analysiertAm ? ` · analysiert ${a.analysiertAm.slice(0, 10)}` : ""}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
