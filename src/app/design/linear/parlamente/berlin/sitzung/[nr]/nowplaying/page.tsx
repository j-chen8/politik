import { getBerlinSitzungDetail, type BerlinSitzungTop } from "@/lib/db";
import { resolveBerlinTonality } from "@/lib/berlin-reden-tonality";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { BerlinSitzungVariantBar } from "@/components/BerlinSitzungVariantBar";

interface Props {
  params: Promise<{ nr: string }>;
}

const PARTY_COLOR: Record<string, string> = {
  SPD: "bg-red-500",
  CDU: "bg-zinc-900",
  GRÜNE: "bg-emerald-600",
  LINKE: "bg-pink-600",
  AfD: "bg-blue-700",
  FDP: "bg-yellow-400",
};

const TON_COLOR: Record<string, string> = {
  sachlich: "#6b7280",
  polemisch: "#dc2626",
  polemisch_sachlich: "#ea580c",
  konfrontativ_belegend: "#2563eb",
  bilanzierend_werbend: "#16a34a",
  defensiv_pragmatisch: "#64748b",
  sozial_anklagend: "#db2777",
  mahnend: "#a16207",
  emotional_persoenlich: "#7c3aed",
  ironisch_jugendlich: "#ca8a04",
  staatsmaennisch: "#1e3a8a",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nr } = await params;
  return { title: `Sitzung ${nr} · Now Playing · Abgeordnetenhaus Berlin` };
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

interface TopScored {
  top: BerlinSitzungTop;
  speeches: BerlinSitzungTop["speeches"];
  score: number;
  tonMix: { ton: string; count: number; pct: number }[];
  partyCounts: { party: string; count: number }[];
}

function scoreTop(top: BerlinSitzungTop): TopScored {
  const filtered = top.speeches.filter((s) => s.zusammenfassung);
  const ton: Record<string, number> = {};
  const party: Record<string, number> = {};
  for (const sp of filtered) {
    const t = resolveBerlinTonality(sp.tonalitaet);
    if (t) ton[t] = (ton[t] ?? 0) + 1;
    if (sp.speakerParty) party[sp.speakerParty] = (party[sp.speakerParty] ?? 0) + 1;
  }
  const total = filtered.length || 1;
  return {
    top,
    speeches: filtered,
    // Score: Reden-Zahl + Polemik-Bonus
    score: filtered.length + ((ton.polemisch ?? 0) + (ton.polemisch_sachlich ?? 0)) * 0.5,
    tonMix: Object.entries(ton)
      .sort((a, b) => b[1] - a[1])
      .map(([ton, count]) => ({ ton, count, pct: (count / total) * 100 })),
    partyCounts: Object.entries(party)
      .sort((a, b) => b[1] - a[1])
      .map(([party, count]) => ({ party, count })),
  };
}

export default async function BerlinSitzungNowPlayingPage({ params }: Props) {
  const { nr } = await params;
  const sitzungNr = parseInt(nr, 10);
  if (!Number.isFinite(sitzungNr)) notFound();

  const sit = getBerlinSitzungDetail(sitzungNr);
  if (!sit) notFound();

  const scored = sit.tops
    .map(scoreTop)
    .filter((s) => s.speeches.length > 0)
    .sort((a, b) => b.score - a.score);

  const [hero, ...queue] = scored;
  if (!hero) {
    return (
      <div className="page-wash">
        <div className="w-full max-w-4xl mx-auto px-5 pt-10">
          <BerlinSitzungVariantBar sitzungNr={sit.sitzungNr} current="nowplaying" />
          <p className="text-zinc-500">Keine Tagesordnungspunkte mit Aussprache.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wash">
      <div className="w-full max-w-4xl mx-auto px-5 pt-10 pb-24">
        <Link
          href="/design/linear/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Abgeordnetenhaus Berlin
        </Link>

        <BerlinSitzungVariantBar sitzungNr={sit.sitzungNr} current="nowplaying" />

        <header className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
            Plenarprotokoll {sit.plprDokNr} · {formatDate(sit.datum)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950">
            {sit.sitzungNr}. Sitzung · {fmt(sit.redenTotal)} Wortbeiträge
            {sit.plprLokUrl && (
              <>
                {" "}
                <a
                  href={sit.plprLokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-700 inline-flex items-baseline gap-1 transition-colors text-[15px] font-normal"
                  title="Original-Plenarprotokoll (PDF)"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                </a>
              </>
            )}
          </h1>
        </header>

        {/* HERO — der prominenteste TOP */}
        <section className="mb-8">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            ▶ Wichtigster TOP der Sitzung
          </div>
          <article className="rounded-2xl border-2 border-zinc-900 bg-white px-6 py-6 shadow-sm">
            <div className="flex items-baseline gap-2 flex-wrap mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 num">
                TOP {hero.top.marker}
              </span>
              <span className="text-[10px] text-zinc-400">·</span>
              <span className="text-[11px] text-zinc-500 num">{hero.speeches.length} Reden</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950 leading-tight mb-4">
              {hero.top.titel}
            </h2>

            {/* Tonalitäts-Streifen */}
            {hero.tonMix.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Tonalitäts-Mix</div>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-100">
                  {hero.tonMix.map((m) => (
                    <span
                      key={m.ton}
                      style={{
                        width: `${m.pct}%`,
                        backgroundColor: TON_COLOR[m.ton] ?? "#a1a1aa",
                      }}
                      title={`${m.ton}: ${m.count} Reden (${m.pct.toFixed(0)}%)`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[10.5px] text-zinc-600">
                  {hero.tonMix.slice(0, 5).map((m) => (
                    <span key={m.ton} className="inline-flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: TON_COLOR[m.ton] ?? "#a1a1aa" }}
                      />
                      <span>{m.ton.replace(/_/g, " ")}</span>
                      <span className="num text-zinc-400">{m.pct.toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fraktions-Beteiligung */}
            {hero.partyCounts.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Wer hat gesprochen</div>
                <div className="flex flex-wrap gap-1.5">
                  {hero.partyCounts.map((p) => (
                    <span
                      key={p.party}
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-zinc-700 px-2 py-1 rounded bg-zinc-100"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${PARTY_COLOR[p.party] ?? "bg-zinc-400"}`} />
                      {p.party}
                      <span className="num text-zinc-500">{p.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <details className="mt-4 border-t border-zinc-100 pt-3">
              <summary className="list-none cursor-pointer text-[12px] font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 select-none">
                <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-0" strokeWidth={2.25} />
                Alle {hero.speeches.length} Reden zu diesem TOP
              </summary>
              <ul className="mt-3 divide-y divide-zinc-100">
                {hero.speeches.map((sp) => (
                  <li key={sp.speechId} className="py-2.5">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      {sp.politicianId ? (
                        <Link
                          href={`/design/linear/politiker/${sp.politicianId}`}
                          className="text-[13.5px] font-medium text-zinc-950 hover:text-blue-700 transition-colors"
                        >
                          {sp.speakerName}
                        </Link>
                      ) : (
                        <span className="text-[13.5px] font-medium text-zinc-950">{sp.speakerName}</span>
                      )}
                      {sp.speakerParty && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${PARTY_COLOR[sp.speakerParty] ?? "bg-zinc-400"}`} />
                          {sp.speakerParty}
                        </span>
                      )}
                    </div>
                    {sp.zusammenfassung && (
                      <p className="text-[12.5px] text-zinc-600 leading-relaxed">{sp.zusammenfassung}</p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        </section>

        {/* Abstimmungen — kompakte Liste */}
        {sit.votes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-zinc-950 mb-3">
              Abstimmungen
            </h2>
            <ul className="space-y-1.5">
              {sit.votes.map((v) => (
                <li
                  key={v.voteId}
                  className="flex items-baseline gap-3 px-3 py-2 rounded-lg border border-zinc-100 bg-white"
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                      v.outcome === "annahme" || v.outcome === "annahme_geaendert"
                        ? "text-emerald-700 bg-emerald-50"
                        : v.outcome === "ablehnung"
                        ? "text-red-700 bg-red-50"
                        : "text-zinc-600 bg-zinc-100"
                    }`}
                  >
                    {(v.outcome === "annahme" || v.outcome === "annahme_geaendert") ? "Angen."
                      : v.outcome === "ablehnung" ? "Abgel."
                      : v.outcome === "vertagung" ? "Vertagt"
                      : v.outcome === "ueberweisung" ? "Übern."
                      : v.outcome}
                  </span>
                  {v.primaryTitel && v.primaryDbid ? (
                    <Link
                      href={`/design/linear/parlamente/berlin/drucksache/${v.primaryDbid}`}
                      className="flex-1 text-[13px] text-zinc-950 leading-snug hover:text-blue-700 line-clamp-1 transition-colors"
                    >
                      {v.primaryTitel}
                    </Link>
                  ) : (
                    <span className="flex-1 text-[13px] text-zinc-950 line-clamp-1">{v.primaryTitel}</span>
                  )}
                  <div className="flex gap-0.5 shrink-0">
                    {Object.entries(v.fraktionVotes).map(([frak, vote]) => (
                      <span
                        key={frak}
                        className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                          vote === "ja"
                            ? "text-emerald-800 bg-emerald-100"
                            : vote === "nein"
                            ? "text-red-800 bg-red-100"
                            : vote === "enthaltung"
                            ? "text-amber-800 bg-amber-100"
                            : "text-zinc-500 bg-zinc-100"
                        }`}
                      >
                        {frak}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* UP NEXT — andere TOPs als kleinere Karten */}
        {queue.length > 0 && (
          <section>
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Up Next · Weitere TOPs
            </h2>
            <div className="space-y-2">
              {queue.map((q) => (
                <details
                  key={`${q.top.marker}-${q.top.titel}`}
                  className="group/q rounded-xl border border-zinc-200/70 bg-white"
                >
                  <summary className="list-none cursor-pointer flex items-baseline gap-3 px-4 py-3 hover:bg-zinc-50/60 transition-colors select-none">
                    <ChevronDown
                      className="w-3 h-3 text-zinc-400 shrink-0 transition-transform group-open/q:rotate-0 -rotate-90"
                      strokeWidth={2.25}
                    />
                    <span className="num text-[10px] font-semibold text-zinc-500 shrink-0">
                      TOP {q.top.marker}
                    </span>
                    <span className="flex-1 text-[13.5px] text-zinc-950 leading-snug">{q.top.titel}</span>
                    {/* Mini-Tonalitäts-Streifen */}
                    {q.tonMix.length > 0 && (
                      <div className="flex h-1 w-16 rounded-full overflow-hidden bg-zinc-100">
                        {q.tonMix.map((m) => (
                          <span
                            key={m.ton}
                            style={{ width: `${m.pct}%`, backgroundColor: TON_COLOR[m.ton] ?? "#a1a1aa" }}
                          />
                        ))}
                      </div>
                    )}
                    <span className="num text-[11px] text-zinc-400 shrink-0">{q.speeches.length} Reden</span>
                  </summary>
                  <ul className="border-t border-zinc-100 divide-y divide-zinc-100">
                    {q.speeches.map((sp) => (
                      <li key={sp.speechId} className="px-4 py-2.5">
                        <div className="flex items-baseline gap-2 flex-wrap mb-1">
                          {sp.politicianId ? (
                            <Link
                              href={`/design/linear/politiker/${sp.politicianId}`}
                              className="text-[13px] font-medium text-zinc-950 hover:text-blue-700 transition-colors"
                            >
                              {sp.speakerName}
                            </Link>
                          ) : (
                            <span className="text-[13px] font-medium text-zinc-950">{sp.speakerName}</span>
                          )}
                          {sp.speakerParty && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${PARTY_COLOR[sp.speakerParty] ?? "bg-zinc-400"}`} />
                              {sp.speakerParty}
                            </span>
                          )}
                        </div>
                        {sp.zusammenfassung && (
                          <p className="text-[12px] text-zinc-600 leading-relaxed">{sp.zusammenfassung}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
