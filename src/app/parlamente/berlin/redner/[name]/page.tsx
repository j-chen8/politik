import { getBerlinSpeechesBySpeakerName, getBerlinSpeakerMeta, resolveBerlinDbidsByNr } from "@/lib/db";
import { resolveBerlinTonality } from "@/lib/berlin-reden-tonality";
import { stripBerlinSpeakerLead } from "@/lib/berlin-summary";
import { BerlinOriginalSpeech } from "@/components/BerlinOriginalSpeech";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, User } from "lucide-react";
import type { Metadata } from "next";

/**
 * Berlin-Redner-Seite — alle Reden eines Sprechers im Abgeordnetenhaus,
 * namensbasiert (analog zur Bundestag-Redner-Seite /protokolle/redner/[name]).
 * Deckt MdL UND Senator:innen/Regierungsmitglieder ohne Profil ab. Such-Treffer
 * (Reden) verlinken hierher — einheitlich mit dem Bundestag.
 */

const SPEECH_TYPE_LABEL: Record<string, string> = {
  debatte: "Debatte",
  fragestunde_antwort: "Antwort (Fragestunde)",
  fragestunde_frage: "Frage (Fragestunde)",
  persoenliche_erklaerung: "Persönliche Erklärung",
};

const TONALITY_BADGE: Record<string, { color: string; bg: string }> = {
  sachlich: { color: "#374151", bg: "#f3f4f6" },
  polemisch: { color: "#b91c1c", bg: "#fee2e2" },
  polemisch_sachlich: { color: "#9a3412", bg: "#ffedd5" },
  emotional_persoenlich: { color: "#7c3aed", bg: "#ede9fe" },
  konfrontativ_belegend: { color: "#1d4ed8", bg: "#dbeafe" },
  ironisch_jugendlich: { color: "#a16207", bg: "#fef3c7" },
  bilanzierend_werbend: { color: "#15803d", bg: "#dcfce7" },
  staatsmaennisch: { color: "#1e40af", bg: "#dbeafe" },
  defensiv_pragmatisch: { color: "#475569", bg: "#f1f5f9" },
  sozial_anklagend: { color: "#be185d", bg: "#fce7f3" },
  mahnend: { color: "#a16207", bg: "#fef9c3" },
};

interface Props {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const speaker = decodeURIComponent(name);
  return {
    title: `${speaker} — Reden im Abgeordnetenhaus Berlin`,
    description: `Alle Redebeiträge von ${speaker} im Berliner Abgeordnetenhaus, 19. Wahlperiode.`,
  };
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function BerlinRednerPage({ params }: Props) {
  const speaker = decodeURIComponent((await params).name);
  const meta = getBerlinSpeakerMeta(speaker);
  if (!meta) notFound();
  const { items, stats, total_chars } = getBerlinSpeechesBySpeakerName(speaker, 300);
  // Drucksachen-Nummern → dbid für klickbare Drs.-Pills (Detail-Links).
  const dbidByNr = resolveBerlinDbidsByNr(items.flatMap((it) => it.drucksache_nrn));

  const roleLine = [meta.role, meta.ressort].filter(Boolean).join(" · ") || (meta.party ?? "Abgeordnete:r");

  return (
    <div className="page-wash">
      <div className="w-full max-w-3xl mx-auto px-5 pt-10 pb-24">
        <Link
          href="/parlamente/berlin/suche"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zur Berlin-Suche
        </Link>

        {/* Kopf */}
        <div className="mb-8">
          <div className="text-[11px] font-medium uppercase tracking-wider text-blue-700 mb-1">
            Reden im Abgeordnetenhaus
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 mb-2">
            {speaker}
          </h1>
          <p className="text-[14px] text-zinc-500">
            {roleLine}
            {meta.party && roleLine !== meta.party && <span className="text-zinc-400"> · {meta.party}</span>}
            <span className="text-zinc-300"> · </span>
            <span className="num text-zinc-700 font-medium">{stats.total}</span> Redebeiträge
            <span className="text-zinc-400 num"> · Ø {stats.total ? Math.round(total_chars / stats.total).toLocaleString("de-DE") : 0} Z.</span>
          </p>
          {meta.politicianId && (
            <Link
              href={`/politiker/${meta.politicianId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-100 transition-colors"
            >
              <User className="w-3.5 h-3.5" strokeWidth={2.25} />
              Zum vollständigen Profil
            </Link>
          )}
          <p className="text-[11px] text-zinc-500 mt-3 italic">
            KI-Zusammenfassung + Tonalität via Haiku 4.5 (Methodologie Berlin-v1). Präsidiale Verfahrens-Wortmeldungen sind ausgenommen.
          </p>
        </div>

        {/* Reden-Liste */}
        <div className="space-y-2.5">
          {items.map((it) => {
            const ton = resolveBerlinTonality(it.analysis?.tonalitaet);
            const tonBadge = ton ? TONALITY_BADGE[ton] : null;
            const typeLabel = it.speech_type ? SPEECH_TYPE_LABEL[it.speech_type] ?? null : null;
            const forderungen = it.analysis?.forderungen ?? [];
            const zitate = it.analysis?.woertliche_zitate ?? [];
            return (
              <article key={it.speech_id} className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
                <div className="flex items-baseline gap-2 flex-wrap mb-1.5 text-[11.5px]">
                  {typeLabel && (
                    <span className="font-medium text-zinc-700">{typeLabel}</span>
                  )}
                  {it.top_marker && (
                    <span className="num text-zinc-400">TOP {it.top_marker}</span>
                  )}
                  <span className="num text-zinc-400 ml-auto">
                    Sitzung {it.sitzung_nr} · {fmtDate(it.datum)}
                  </span>
                </div>
                {it.top_titel && (
                  <div className="text-[12px] text-zinc-500 mb-1.5 leading-snug">{it.top_titel}</div>
                )}
                <p className="text-[14px] text-zinc-900 leading-relaxed">
                  {it.analysis?.zusammenfassung ? stripBerlinSpeakerLead(it.analysis.zusammenfassung) : it.text_preview}
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  {ton && tonBadge && (
                    <span
                      className="text-[10.5px] font-medium px-1.5 py-0.5 rounded"
                      style={{ color: tonBadge.color, backgroundColor: tonBadge.bg }}
                    >
                      {ton.replace(/_/g, " ")}
                    </span>
                  )}
                  {it.drucksache_nrn.slice(0, 3).map((nr) =>
                    dbidByNr[nr] ? (
                      <Link
                        key={nr}
                        href={`/parlamente/berlin/drucksache/${dbidByNr[nr]}`}
                        className="num text-[10.5px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded px-1.5 py-0.5 transition-colors"
                      >
                        Drs. {nr}
                      </Link>
                    ) : (
                      <span key={nr} className="num text-[10.5px] text-zinc-500 bg-zinc-100 rounded px-1.5 py-0.5">
                        Drs. {nr}
                      </span>
                    )
                  )}
                  {it.interruption_count > 0 && (
                    <span className="text-[10.5px] text-zinc-400">{it.interruption_count} Zwischenrufe</span>
                  )}
                  <Link
                    href={`/parlamente/berlin/sitzung/${it.sitzung_nr}#rede-s-${it.speech_id}`}
                    className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-blue-700 hover:underline underline-offset-2"
                  >
                    In der Sitzung ansehen
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                  </Link>
                </div>

                {/* Forderungen & wörtliche Zitate — einklappbar */}
                {(forderungen.length > 0 || zitate.length > 0) && (
                  <details className="mt-2 group/an">
                    <summary className="list-none cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors select-none">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-zinc-400 group-open/an:rotate-90 transition-transform inline-block">▶</span>
                        <span>
                          Forderungen &amp; Zitate
                          <span className="text-zinc-400">
                            {" "}({[
                              forderungen.length > 0 ? `${forderungen.length} Forderung${forderungen.length === 1 ? "" : "en"}` : null,
                              zitate.length > 0 ? `${zitate.length} Zitat${zitate.length === 1 ? "" : "e"}` : null,
                            ].filter(Boolean).join(" · ")})
                          </span>
                        </span>
                      </span>
                    </summary>
                    <div className="mt-2 space-y-3 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
                      {forderungen.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Forderungen / Positionen</div>
                          <ul className="space-y-1 text-[12.5px] text-zinc-700 list-disc pl-4">
                            {forderungen.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                      {zitate.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                            Wörtliche Zitate
                            {(it.analysis?.quote_total ?? 0) > 0 && (
                              <span
                                className="normal-case tracking-normal text-zinc-400"
                                title={`${it.analysis?.quote_valid ?? 0} von ${it.analysis?.quote_total ?? 0} Zitaten als exakter Substring im Originaltext bestätigt`}
                              >
                                ({it.analysis?.quote_valid ?? 0}/{it.analysis?.quote_total ?? 0} bestätigt)
                              </span>
                            )}
                          </div>
                          <ul className="space-y-1.5">
                            {zitate.map((q, i) => (
                              <li key={i} className="text-[12.5px] text-zinc-700 border-l-2 border-zinc-200 pl-2.5 italic">„{q}"</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Vollständige Originalrede — lazy nachgeladen */}
                <BerlinOriginalSpeech speechId={it.speech_id} />
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
