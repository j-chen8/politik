import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { getSitzungDetail } from "@/lib/db";

const PARTY_DOT: Record<string, string> = {
  "CDU/CSU": "bg-zinc-800",
  SPD: "bg-rose-500",
  AfD: "bg-sky-600",
  "BÜNDNIS 90/DIE GRÜNEN": "bg-emerald-600",
  "Die Linke": "bg-fuchsia-600",
  Bundesregierung: "bg-amber-500",
  "Präsidium": "bg-zinc-500",
  fraktionslos: "bg-zinc-400",
  "ohne Fraktion": "bg-zinc-400",
};

const PARTY_LABEL: Record<string, string> = {
  "BÜNDNIS 90/DIE GRÜNEN": "GRÜNE",
};

function formatGermanDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  return `${parseInt(d, 10)}. ${months[parseInt(m, 10) - 1] ?? m} ${y}`;
}

function formatTonalitaet(raw: string): string {
  // Capitalize first letter, replace underscores with spaces
  const s = raw.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// TOP-Typ aus Titel ableiten (regex). Reihenfolge: spezifisch → allgemein.
type TopType = "Gesetzentwürfe" | "Anträge" | "Beratungen" | "Weitere";
function classifyTopic(title: string): TopType {
  const t = title.toLowerCase();
  if (/entwurf eines gesetz|gesetz(es|entwurf)/.test(t)) return "Gesetzentwürfe";
  if (/antrag(s)? der|antrag der bundesregierung/.test(t)) return "Anträge";
  if (/beschlussempfehlung|beratung der|bericht|vereinbarte debatte|unterrichtung/.test(t)) return "Beratungen";
  return "Weitere";
}

const TOP_TYPE_ORDER: TopType[] = ["Gesetzentwürfe", "Anträge", "Beratungen", "Weitere"];

export default async function SitzungDetailPage({
  params,
}: {
  params: Promise<{ nummer: string }>;
}) {
  const { nummer } = await params;
  const sitzungNr = parseInt(nummer, 10);
  if (!Number.isFinite(sitzungNr)) notFound();

  const detail = getSitzungDetail(sitzungNr);
  if (!detail) notFound();

  // Conversational summary line
  const tonTotal = detail.tonalitaetVerteilung.reduce((s, t) => s + t.count, 0);
  const summaryParts: string[] = [];
  summaryParts.push(`${detail.stats.topicCount} ${detail.stats.topicCount === 1 ? "Tagesordnungspunkt" : "Tagesordnungspunkte"}`);
  summaryParts.push(`${detail.stats.speechCount} Reden`);
  if (detail.stats.voteCount === 0) summaryParts.push("keine namentliche Abstimmung");
  else summaryParts.push(`${detail.stats.voteCount} namentliche ${detail.stats.voteCount === 1 ? "Abstimmung" : "Abstimmungen"}`);

  // TOP-Gruppierung
  const topsByType = new Map<TopType, typeof detail.topics>();
  for (const t of detail.topics) {
    const type = classifyTopic(t.title);
    if (!topsByType.has(type)) topsByType.set(type, []);
    topsByType.get(type)!.push(t);
  }

  // Drucksachen: top-5 sichtbar, rest collapsed
  const drucksachenTop = detail.drucksachen.slice(0, 5);
  const drucksachenRest = detail.drucksachen.slice(5);

  // Tonalitäten: top-5 sichtbar, rest collapsed
  const tonTop = detail.tonalitaetVerteilung.slice(0, 5);
  const tonRest = detail.tonalitaetVerteilung.slice(5);

  // Fraktion: top-5 sichtbar
  const partyTop = detail.partyVerteilung.slice(0, 5);
  const partyRest = detail.partyVerteilung.slice(5);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-8 fade-in-up">
        {/* Breadcrumb */}
        <Link
          href="/design/linear/protokolle"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Protokolle
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Plenarsitzung · WP {detail.wahlperiode}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-zinc-950 leading-tight">
            {detail.sitzung}. Sitzung
          </h1>
          {detail.datum && (
            <div className="mt-2 text-[15px] text-zinc-600 num">
              {formatGermanDate(detail.datum)}
            </div>
          )}

          {/* Conversational summary */}
          <p className="mt-4 text-[14px] text-zinc-700 leading-relaxed">
            {summaryParts.join(" · ")}
          </p>

          {detail.sourceUrl && (
            <div className="mt-4">
              <a
                href={detail.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                Offizielles PDF-Protokoll
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>
            </div>
          )}
        </div>

        {/* Sticky in-page nav (Anchor-Links zu Sektionen) */}
        <nav className="sticky top-0 z-10 -mx-5 px-5 py-2 bg-white/85 backdrop-blur-sm border-b border-zinc-100 mb-6">
          <div className="flex items-center gap-1 overflow-x-auto text-[12px]">
            <AnchorChip href="#ueberblick">Überblick</AnchorChip>
            <AnchorChip href="#themen">Themen</AnchorChip>
            <AnchorChip href="#drucksachen">Drucksachen</AnchorChip>
            <AnchorChip href="#abstimmungen">Abstimmungen</AnchorChip>
          </div>
        </nav>

        {/* Glance Section: 3 Karten */}
        <section id="ueberblick" className="scroll-mt-16 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Karte 1: Wer war aktiv */}
            <GlanceCard label="Wer war aktiv">
              {partyTop.length > 0 ? (
                <>
                  <div className="space-y-1.5">
                    {partyTop.map((p) => (
                      <div key={p.party} className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${PARTY_DOT[p.party] ?? "bg-zinc-300"}`}
                        />
                        <span className="text-[12.5px] text-zinc-800 truncate">
                          {PARTY_LABEL[p.party] ?? p.party}
                        </span>
                        <span className="ml-auto text-[12px] text-zinc-500 num shrink-0">
                          {p.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  {partyRest.length > 0 && (
                    <div className="mt-2 text-[11px] text-zinc-400">
                      + {partyRest.length} weitere
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
                    {detail.stats.speakerCount} Sprecher
                  </div>
                </>
              ) : (
                <div className="text-[12px] text-zinc-400">—</div>
              )}
            </GlanceCard>

            {/* Karte 2: Stimmung */}
            <GlanceCard label="Stimmung der Reden">
              {tonTop.length > 0 ? (
                <>
                  <div className="space-y-1.5">
                    {tonTop.map((t) => (
                      <div key={t.tonalitaet} className="flex items-center gap-2">
                        <span className="text-[12.5px] text-zinc-800 truncate">
                          {formatTonalitaet(t.tonalitaet)}
                        </span>
                        <span className="ml-auto text-[12px] text-zinc-500 num shrink-0">
                          {t.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  {tonRest.length > 0 && (
                    <div className="mt-2 text-[11px] text-zinc-400">
                      + {tonRest.length} weitere
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-zinc-100 text-[11px] text-zinc-500">
                    {tonTotal} klassifiziert
                  </div>
                </>
              ) : (
                <div className="text-[12px] text-zinc-400">—</div>
              )}
            </GlanceCard>

            {/* Karte 3: Entscheidungen */}
            <GlanceCard label="Entscheidungen">
              {detail.abstimmungen.length === 0 ? (
                <div className="text-[12.5px] text-zinc-600 leading-snug">
                  Keine namentliche Abstimmung in dieser Sitzung.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {detail.abstimmungen.slice(0, 3).map((a) => {
                      const yesPct = a.yesRatio * 100;
                      return (
                        <div key={a.pollId}>
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-[13px] font-semibold text-zinc-950 num">
                              {yesPct.toFixed(0)}%
                            </span>
                            <span className="text-[10.5px] text-zinc-500">Ja</span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden bg-zinc-100 flex">
                            <div className="bg-emerald-500" style={{ width: `${yesPct}%` }} />
                            <div className="bg-rose-400" style={{ width: `${100 - yesPct}%` }} />
                          </div>
                          <div className="text-[10.5px] text-zinc-500 mt-0.5 line-clamp-1">
                            {a.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {detail.abstimmungen.length > 3 && (
                    <div className="mt-2 text-[11px] text-zinc-400">
                      + {detail.abstimmungen.length - 3} weitere unten
                    </div>
                  )}
                </>
              )}
            </GlanceCard>
          </div>
        </section>

        {/* THEMEN: grouped */}
        <section id="themen" className="scroll-mt-16 mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-zinc-950 tracking-tight">
              Themen der Sitzung
            </h2>
            <span className="text-[12px] text-zinc-500 num">{detail.topics.length}</span>
          </div>

          {detail.topics.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 text-[13px] text-zinc-500">
              Keine TOPs erfasst.
            </div>
          ) : (
            <div className="space-y-5">
              {TOP_TYPE_ORDER.filter((tt) => topsByType.has(tt)).map((tt) => {
                const tops = topsByType.get(tt)!;
                return (
                  <div key={tt}>
                    <div className="flex items-baseline gap-2 mb-2 px-1">
                      <h3 className="text-[12px] font-medium uppercase tracking-wider text-zinc-500">
                        {tt}
                      </h3>
                      <span className="text-[11px] text-zinc-400 num">{tops.length}</span>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                      {tops.map((t) => (
                        <Link
                          key={t.topicId}
                          href={`/design/linear/protokolle/top/${t.topicId}`}
                          className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-[11px] font-medium text-zinc-500 num shrink-0 w-12 pt-0.5">
                              TOP&nbsp;{t.topicNumber}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13.5px] text-zinc-900 leading-snug line-clamp-2">
                                {t.title}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                                <span className="num">{t.speechCount} {t.speechCount === 1 ? "Rede" : "Reden"}</span>
                                {t.parties.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {t.parties.slice(0, 6).map((p) => (
                                      <span
                                        key={p}
                                        className={`w-1 h-1 rounded-full ${PARTY_DOT[p] ?? "bg-zinc-300"}`}
                                        title={p}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" strokeWidth={2.25} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DRUCKSACHEN: top-5 + expandable */}
        {detail.drucksachen.length > 0 && (
          <section id="drucksachen" className="scroll-mt-16 mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-zinc-950 tracking-tight">
                Behandelte Drucksachen
              </h2>
              <span className="text-[12px] text-zinc-500 num">{detail.drucksachen.length}</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              {drucksachenTop.map((d) => (
                <DrucksacheRow key={d.drucksacheNr} d={d} />
              ))}
              {drucksachenRest.length > 0 && (
                <details className="group [&_summary::-webkit-details-marker]:hidden border-t border-zinc-100">
                  <summary className="cursor-pointer px-4 py-2.5 text-[12px] text-zinc-500 hover:bg-zinc-50 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" strokeWidth={2.25} />
                    + {drucksachenRest.length} weitere zeigen
                  </summary>
                  <div>
                    {drucksachenRest.map((d) => (
                      <DrucksacheRow key={d.drucksacheNr} d={d} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          </section>
        )}

        {/* ABSTIMMUNGEN: nur wenn vorhanden */}
        {detail.abstimmungen.length > 0 && (
          <section id="abstimmungen" className="scroll-mt-16 mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-zinc-950 tracking-tight">
                Namentliche Abstimmungen
              </h2>
              <span className="text-[12px] text-zinc-500 num">{detail.abstimmungen.length}</span>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              {detail.abstimmungen.map((a) => {
                const yesPct = a.yesRatio * 100;
                return (
                  <Link
                    key={a.pollId}
                    href={`/design/linear/abstimmungen/${a.pollId}`}
                    className="block px-4 py-3 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="text-[13.5px] font-medium text-zinc-900 leading-snug mb-2 line-clamp-2">
                      {a.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-zinc-950 num">
                        {yesPct.toFixed(1).replace(".", ",")}&nbsp;%&nbsp;Ja
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-100 flex">
                        <div className="bg-emerald-500" style={{ width: `${yesPct}%` }} />
                        <div className="bg-rose-400" style={{ width: `${100 - yesPct}%` }} />
                      </div>
                      <span className="text-[11px] text-zinc-500 num shrink-0">
                        {a.yes} / {a.no}
                        {a.abstain > 0 && ` / ${a.abstain} Enth.`}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2.25} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AnchorChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-2.5 py-1 rounded-md text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors whitespace-nowrap"
    >
      {children}
    </a>
  );
}

function GlanceCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 flex flex-col">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function DrucksacheRow({ d }: { d: { drucksacheNr: string; thema: string | null; refCount: number } }) {
  return (
    <Link
      href={`/design/linear/aktivitaeten/${d.drucksacheNr.replace("/", "-")}`}
      className="block px-4 py-2.5 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-zinc-500 num shrink-0 w-16">
          {d.drucksacheNr}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-zinc-900 leading-snug line-clamp-1">
            {d.thema ?? "(ohne Thema)"}
          </div>
        </div>
        <span className="text-[11px] text-zinc-500 num shrink-0">
          {d.refCount}×
        </span>
        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={2.25} />
      </div>
    </Link>
  );
}
