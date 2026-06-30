/**
 * ENTWURF — Detailseite eines Kommissions-Leitberichts: manuelle Analyse
 * (Kennzahlen, Einschnitte, Betroffene, Empfehlungen) + Link zum Original-PDF. Rein lesend.
 */
import Link from "next/link";
import { ArrowLeft, FileText, ChevronDown, ExternalLink } from "lucide-react";
import { getKommissionAnalyse, type KommissionAnalysePunkt } from "@/lib/db";
import { EinschnittKarte } from "./EinschnittKarte";

export const dynamic = "force-dynamic";

const IMPACT_RANK: Record<string, number> = { hoch: 0, mittel: 1, gering: 2 };
const EINSCHNITT_ARTEN = new Set(["Belastung", "Kürzung", "Pflicht"]);
// Dezenter linker Akzentrand statt Pille — zeigt Impact ohne Text-Clutter.
const accent = (impact?: string) =>
  impact === "hoch" ? "border-l-2 border-l-red-400 dark:border-l-red-500/60"
  : impact === "mittel" ? "border-l-2 border-l-amber-400 dark:border-l-amber-500/50"
  : "border-l-2 border-l-transparent";

// Härte-Achse: nur 2 Stufen — Kürzung (weniger/später) vs. Belastung (mehr/neu zahlen).
// „Pflicht" (bisher Befreite werden neu pflichtversichert) zählt als Belastung: sie
// kostet die Gruppe ab dann Beiträge. Daten bleiben unangetastet, hier nur normalisiert.
const haerte = (art?: string) => (art === "Pflicht" ? "Belastung" : art);
const ART_RANG: Record<string, number> = { "Kürzung": 0, "Belastung": 1 };
const artDot = (art?: string) =>
  art === "Kürzung" ? "bg-red-400 dark:bg-red-500/80"
  : art === "Belastung" ? "bg-amber-400 dark:bg-amber-500/75"
  : art === "Entlastung" || art === "Ausweitung" ? "bg-emerald-400 dark:bg-emerald-500/75"
  : "bg-zinc-300 dark:bg-zinc-600";
// Legenden-Text je Härte/Art — dynamisch, nur vorkommende Arten werden gezeigt.
const ART_LEGENDE: Record<string, string> = {
  "Kürzung": "Kürzung (weniger / später)",
  "Belastung": "Belastung (mehr / neu zahlen)",
  "Entlastung": "Entlastung / mehr Leistung",
  "Ausweitung": "Ausweitung / mehr Leistung",
  "strukturell": "struktureller Umbau",
};

// „Die Kommission empfiehlt[,] …" am Satzanfang strippen — in jeder Karte redundant,
// die Überschrift sagt schon, dass es Empfehlungen sind. Ersten Buchstaben groß.
const ohnePraefix = (s: string) => {
  const t = s.replace(/^\s*Die Kommission empfiehlt,?\s+/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

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

  // Aufmacher-Daten: Leit-Kennzahl (= These, manuell zuerst kuratiert) + restliche Zahlen
  // + Betroffenen-Zeilen (Gruppe, härteste Art für den Punkt, Klartext-Label).
  const leit = a.kennzahlen[0];
  const restKennzahlen = a.kennzahlen.slice(1);
  const betroffene = matrix.map((m) => {
    const arten = new Map<string, number>();
    for (const p of m.punkte) { const k = haerte(p.art) ?? "betroffen"; arten.set(k, (arten.get(k) ?? 0) + 1); }
    const primaer = [...arten.keys()].sort((x, y) => (ART_RANG[x] ?? 9) - (ART_RANG[y] ?? 9))[0];
    const label = [...arten].map(([art, n]) => (n > 1 ? `${n}× ` : "") + art).join(" · ");
    return { gruppe: m.gruppe, primaer, label };
  });
  // Legende dynamisch: nur Arten, die in „Wen es trifft" tatsächlich vorkommen.
  const legendeArten = [...new Set(betroffene.map((b) => b.primaer))].filter((a): a is string => Boolean(a) && Boolean(ART_LEGENDE[a]));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7 px-6 py-8">
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
          {/* AUFMACHER (Bento) — These + wen es trifft + größte Zahlen auf EINEN Blick.
              Variierte Kachelgrößen statt Gleichraster; folgt der Landingpage-Sprache. */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6 [grid-auto-rows:minmax(92px,auto)]">
            {/* These — große, dunkle Ankerkachel */}
            <div className="col-span-2 row-span-2 flex flex-col gap-4 rounded-2xl border border-border bg-foreground p-5 text-background lg:col-span-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">Worum es geht</span>
              <div className="flex flex-1 flex-col justify-center">
                {leit ? (
                  <div className="flex flex-col gap-2">
                    <span className="num text-[44px] font-bold leading-[0.95] sm:text-[56px]">{leit.wert}</span>
                    <p className="max-w-xl text-[15px] leading-snug opacity-90 sm:text-[16px]">{leit.label}</p>
                  </div>
                ) : a.eckpunkte.length > 0 ? (
                  <ul className="flex flex-col gap-1.5">
                    {a.eckpunkte.slice(0, 5).map((e, i) => (
                      <li key={i} className="flex gap-2 text-[14px] leading-snug opacity-90">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-background/60" /><span>{e}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[16px] leading-relaxed opacity-90">{a.gesamttenor}</p>}
              </div>
            </div>

            {/* Wen es trifft — prominent, farbcodiert nach Härte */}
            {betroffene.length > 0 && (
              <div className="col-span-2 row-span-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Wen es trifft</span>
                <div className="flex flex-1 flex-col justify-center gap-2.5">
                  {betroffene.map((b) => (
                    <div key={b.gruppe} className="flex items-baseline gap-2.5">
                      <span className={`relative top-[3px] h-2.5 w-2.5 shrink-0 rounded-full ${artDot(b.primaer)}`} />
                      <span className="text-[15px] font-medium leading-snug text-foreground">{b.gruppe}</span>
                      <span className="ml-auto shrink-0 text-[12px] text-muted">{b.label}</span>
                    </div>
                  ))}
                </div>
                {legendeArten.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-2.5 text-[11px] text-muted">
                    {legendeArten.map((art) => (
                      <span key={art} className="flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${artDot(art)}`} /> {ART_LEGENDE[art]}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Restliche Kennzahlen — Zahlen-Kacheln, halbe Breite für Lesbarkeit (lange Labels) */}
            {restKennzahlen.map((kz, i) => (
              <div key={i} className="col-span-2 flex flex-col justify-center gap-1 rounded-2xl border border-border bg-card p-4 lg:col-span-3">
                <span className="num text-[30px] font-semibold leading-none text-foreground">{kz.wert}</span>
                <span className="text-[13px] leading-snug text-foreground/80">{kz.label}</span>
              </div>
            ))}
          </section>

          {/* WER DAHINTER STECKT — Zusammensetzung + Köpfe. Bewusst KEIN „neutral/parteiisch"-
              Urteil, sondern Fakten, aus denen der Leser die Unabhängigkeit selbst einschätzt. */}
          {a.mitglieder && (
            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[18px] font-semibold text-foreground">Wer dahinter steckt</h2>
                <span className="text-[13px] text-muted">{a.mitglieder.anzahl} Mitglieder</span>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {a.mitglieder.gruppen.map((g) => (
                  <div key={g.rolle} className={`flex flex-col gap-1.5 ${g.personen.length > 3 ? "sm:col-span-2" : ""}`}>
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-muted">{g.rolle}</h3>
                    {/* Viele Mitglieder → CSS-Spalten (keine Zeilen-Kopplung wie im Grid → keine Lücken). */}
                    <div className={g.personen.length > 3 ? "sm:columns-2 sm:gap-x-8" : ""}>
                      {g.personen.map((p, i) => (
                        <div key={i} className="break-inside-avoid pb-1.5 text-[13px] leading-snug last:pb-0">
                          {p.politikerId ? (
                            <Link href={`/politiker/${p.politikerId}`} className="font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground">{p.name}</Link>
                          ) : p.wikipedia ? (
                            <a href={p.wikipedia} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground">
                              {p.name}<ExternalLink className="h-3 w-3 text-muted" aria-label="Wikipedia" />
                            </a>
                          ) : (
                            <span className="font-medium text-foreground">{p.name}</span>
                          )}
                          {p.partei && <span className="ml-1.5 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted dark:bg-zinc-800">{p.partei}</span>}
                          {p.funktion && <span className="text-muted"> — {p.funktion}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {a.mitglieder.beratend && a.mitglieder.beratend.length > 0 && (
                <p className="text-[12px] text-muted">Beratend (ohne Stimmrecht): {a.mitglieder.beratend.map((b, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    {b.wikipedia ? (
                      <a href={b.wikipedia} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-2 hover:text-foreground hover:decoration-foreground">{b.name}</a>
                    ) : b.name}
                    {b.funktion ? ` — ${b.funktion}` : ""}
                  </span>
                ))}</p>
              )}
            </section>
          )}

          {/* Größte Einschnitte — breite eigene Sektion, je Karte aufklappbar */}
          {einschnitte.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-[18px] font-semibold text-foreground">Größte Einschnitte</h2>
              <p className="text-[12px] text-muted">Kürzungen und Belastungen — sortiert nach Reichweite × Eingriffstiefe. Karte antippen für den vollen Wortlaut.</p>
              {/* Zwei EIGENSTÄNDIGE Spalten (kein gekoppeltes Grid): Aufklappen einer Karte
                  schiebt nur die Karten darunter in derselben Spalte, die andere Seite bleibt. */}
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
                {[einschnitte.slice(0, 4), einschnitte.slice(4, 8)].map((spalte, ci) => (
                  <div key={ci} className="flex flex-1 flex-col gap-2">
                    {spalte.map((p, i) => (
                      <EinschnittKarte
                        key={`${ci}-${i}`}
                        massnahme={ohnePraefix(p.massnahme)}
                        accentClass={accent(p.impact)}
                        chips={[
                          p.gruppe && p.gruppe !== "—" ? p.gruppe : null,
                          p.art ? haerte(p.art) : null,
                          p.umsetzbarkeit || null,
                        ].filter((c): c is string => Boolean(c))}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Alle Empfehlungen — pro Kapitel einklappbar: verdichtet, voller Text auf Klick.
              (Einschnitte/Betroffene oben sind die Destillation; hier die kanonische Vollliste.) */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[18px] font-semibold text-foreground">
                Alle Empfehlungen <span className="text-[14px] font-normal text-muted">({a.kernpunkte.length})</span>
              </h2>
              <p className="text-[12px] text-muted">Nach Kapitel gegliedert — zum Aufklappen tippen.</p>
            </div>
            <div className="flex flex-col gap-2">
              {gruppen.map((g) => (
                  <details key={g.kapitel} className="group rounded-lg border border-border bg-card">
                    <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-3 px-4 py-3">
                      <span className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
                        {g.kapitel}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-[12px] text-muted">
                        {g.punkte.length} {g.punkte.length === 1 ? "Empfehlung" : "Empfehlungen"}
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                      </span>
                    </summary>
                    <div className="grid grid-cols-1 gap-2 border-t border-border p-3 lg:grid-cols-2">
                      {g.punkte.map((p, i) => (
                        <div key={i} className={`flex gap-3 rounded-lg border border-border bg-background/40 p-3 ${accent(p.impact)}`}>
                          {p.nr != null && <span className="num shrink-0 text-[13px] font-semibold text-muted">{p.nr}</span>}
                          <div className="flex flex-col gap-1">
                            <p className="text-[14px] leading-snug text-foreground">{p.massnahme}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.art && <Chip>{haerte(p.art)}</Chip>}
                              {p.gruppe && p.gruppe !== "—" && <Chip>{p.gruppe}</Chip>}
                              {p.umsetzbarkeit && <Chip>{p.umsetzbarkeit}</Chip>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
              ))}
            </div>
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
