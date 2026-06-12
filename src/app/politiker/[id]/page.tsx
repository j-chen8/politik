import {
  getPoliticianDb,
  getMandatesForPoliticianDb,
  getSpeechSummaryInfo,
  getVotesForPoliticianDb,
  getFractionDeviationsForPolitician,
  getSidejobsForPoliticianDb,
  getCommitteeMembershipsForPoliticianDb,
  computeVoteStatsDb,
  getIncomeRange,
  getParlamentarischeArbeit,
  getNotesForPolitician,
  getCVMergeDropsForPolitician,
  getDrucksachenForPolitician,
  getBerlinParlamentarischeArbeit,
  getBerlinSpeechesByPolitician,
  getQaPaareForPolitician,
  type PoliticianDrucksacheRow,
  type BerlinParlItem,
} from "@/lib/db";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { PoliticianCV, type CV, type SourceConflict } from "@/components/PoliticianCV";
import { resolveBerlinTonality } from "@/lib/berlin-reden-tonality";
import { stripBerlinSpeakerLead } from "@/lib/berlin-summary";
import { TagInfoPopover } from "@/components/TagInfoPopover";
import { TonalityBadge, DrucksacheTonalityBadge } from "@/components/TonalityBadge";
import { MediaAppearancesList } from "@/components/MediaAppearancesList";
import { getMediaAppearancesForPolitician } from "@/lib/media-appearances";
import {
  ExternalLink,
  Mic,
  AlertCircle,
  ChevronDown,
  PlayCircle,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ orig?: string; parlament?: string }>;
}

/**
 * Wikimedia Commons liefert das `author`-Feld manchmal als Freiform-Reuse-
 * Hinweis (z.B. C.Suthorn-Bilder: 723 Zeichen Lizenz-Belehrung). Für die
 * Caption unter dem Foto reicht der Kern-Author bis zum ersten Satz-Ende
 * oder ~80 Zeichen — der vollständige Text bleibt als `title`-Tooltip
 * verfügbar.
 */
function truncateAuthor(raw: string): { short: string; full: string; wasTruncated: boolean } {
  const trimmed = raw.trim();
  if (trimmed.length <= 70) return { short: trimmed, full: trimmed, wasTruncated: false };
  // Erster Satz: bis zum ersten ". " oder ! oder ?
  const sentenceEnd = trimmed.search(/[.!?]\s/);
  if (sentenceEnd > 0 && sentenceEnd <= 80) {
    return { short: trimmed.slice(0, sentenceEnd), full: trimmed, wasTruncated: true };
  }
  // Hart bei ~70 Zeichen, am letzten Wort-Grenze schneiden
  const cut = trimmed.slice(0, 70);
  const lastSpace = cut.lastIndexOf(" ");
  return {
    short: (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + "…",
    full: trimmed,
    wasTruncated: true,
  };
}

function shortenTyp(typ: string): string {
  const map: Record<string, string> = {
    "Regierungserklärung": "Reg.-Erklärung",
    "Berichterstattung": "Bericht",
    "Entschließungsantrag": "Entschl.-Antrag",
    "Änderungsantrag": "Änd.-Antrag",
    "Kurzintervention": "Kurzinterv.",
    "Zwischenfrage": "Zwischenfr.",
    "Rede (zu Protokoll gegeben)": "Rede (z. Prot.)",
    "Schriftliche Frage": "Schriftl. Frage",
    "Mündliche Frage (Fragestunde)": "Mündl. Frage",
  };
  if (map[typ]) return map[typ];
  // Lange Varianten wie "Schriftliche Erklärung gem. § 31 Geschäftsordnung BT"
  if (/^Schriftliche Erklärung/i.test(typ)) return "Schriftl. Erklärung";
  return typ;
}

/** Kurz-Label für eine Berlin-PARDOK-Position (Anfragen / Anträge — Reden separat). */
function berlinKatLabel(it: BerlinParlItem): string {
  if (it.kategorie === "rede") return "Rede";
  if (it.kategorie === "anfrage") return it.dokTyp?.startsWith("Mündl") ? "Mdl. Anfrage" : "Schr. Anfrage";
  if (it.kategorie === "antrag") return "Antrag";
  return it.dokTyp ?? "Drucksache";
}

/** Speech-Type-Label für Berlin-Reden (aus berlin_speeches.speech_type). */
function berlinSpeechTypeLabel(t: string | null): string {
  switch (t) {
    case "debatte": return "Debatte";
    case "fragestunde_antwort": return "Antwort";
    case "fragestunde_frage": return "Frage";
    case "persoenliche_erklaerung": return "Pers. Erkl.";
    case "praesidium": return "Präsidium";
    default: return "Beitrag";
  }
}

/** Tonalitäts-Badge-Konfig (identisch zur Bundes-Methodology v2.1). */
const TONALITAET_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sachlich: { label: "sachlich", color: "#374151", bg: "#f3f4f6" },
  polemisch: { label: "polemisch", color: "#b91c1c", bg: "#fee2e2" },
  polemisch_sachlich: { label: "polemisch-sachlich", color: "#9a3412", bg: "#ffedd5" },
  emotional_persoenlich: { label: "emotional-persönlich", color: "#7c3aed", bg: "#ede9fe" },
  konfrontativ_belegend: { label: "konfrontativ-belegend", color: "#1d4ed8", bg: "#dbeafe" },
  ironisch_jugendlich: { label: "ironisch", color: "#a16207", bg: "#fef3c7" },
  bilanzierend_werbend: { label: "bilanzierend", color: "#15803d", bg: "#dcfce7" },
  staatsmaennisch: { label: "staatsmännisch", color: "#1e40af", bg: "#dbeafe" },
  defensiv_pragmatisch: { label: "defensiv-pragmatisch", color: "#475569", bg: "#f1f5f9" },
  sozial_anklagend: { label: "sozial-anklagend", color: "#be185d", bg: "#fce7f3" },
  mahnend: { label: "mahnend", color: "#854d0e", bg: "#fef9c3" },
};

export default async function PolitikerPage({ params, searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const showOriginal = sp.orig === "1";
  const { id } = await params;
  const politicianId = parseInt(id, 10);

  const politician = getPoliticianDb(politicianId);
  if (!politician) notFound();

  const dbMandates = getMandatesForPoliticianDb(politicianId);
  const bundestagMandate = dbMandates.find((m) => m.parliament_type === "bundestag");
  const primaryMandate = bundestagMandate || dbMandates[0];

  // Geteilte Route /politiker/[id]: reine Berlin-MdL bekommen ?parlament=2, damit die
  // Nav im Berlin-Kontext bleibt (sonst fällt useIsBerlin auf Bundestag zurück). Greift
  // auch bei Direktaufruf; Loop-Schutz via Param-Check. Dual-Mandat (auch Bundestag) → Bundestag.
  const isBerlinOnly = !bundestagMandate && dbMandates.some((m) => m.parliament_label === "Berlin");
  if (isBerlinOnly && sp.parlament !== "2") {
    const qs = new URLSearchParams();
    if (showOriginal) qs.set("orig", "1");
    qs.set("parlament", "2");
    redirect(`/politiker/${politicianId}?${qs.toString()}`);
  }

  const notes = getNotesForPolitician(politicianId);
  const qaPaare = getQaPaareForPolitician(politicianId);
  const speechInfo = getSpeechSummaryInfo(politicianId);
  const { items: parlArbeit, stats: parlStats } = getParlamentarischeArbeit(
    politicianId,
    speechInfo?.speaker ?? null,
    500
  );

  const votes = getVotesForPoliticianDb(politicianId);
  const sidejobs = getSidejobsForPoliticianDb(politicianId);
  const committees = getCommitteeMembershipsForPoliticianDb(politicianId);
  const drucksachen = getDrucksachenForPolitician(politicianId, 100);
  // Berlin-Pilot: parlamentarische Arbeit aus den PARDOK-Daten (Anfragen, Anträge)
  // — der "Rede"-Bucket wird unten als eigene Sektion aus berlin_speeches gerendert.
  const berlinArbeit = getBerlinParlamentarischeArbeit(politicianId);
  const berlinReden = getBerlinSpeechesByPolitician(politicianId, 100);
  const mediaAppearances = getMediaAppearancesForPolitician(politicianId);
  // Audit-Trail: welche Einträge wurden vom Dedup-Skript ausgeblendet (nur sichtbar wenn !showOriginal)
  const cvMergeDrops = showOriginal ? [] : getCVMergeDropsForPolitician(politicianId);

  const voteStats = computeVoteStatsDb(votes);
  const fractionDev = getFractionDeviationsForPolitician(politicianId);
  const hasVoteData = voteStats.totalPolls > 0;

  const partyLabel = politician.party_label || "Parteilos";
  const constituency = primaryMandate?.constituency;

  // ── Funktionen mit Tier-Klassifikation (Chips neben dem Namen oben im Header) ──
  function shortenFunktionTitel(t: string): string {
    let s = t
      // Tier 1
      .replace(/^Bundesminister:in für /, "BM ")
      .replace(/^Bundestagspräsident(in)?$/i, "BT-Präsidentin")
      // Tier 2 / Bundestag
      .replace(/^Vizepräsident(:in)?(?:in)? des Bundestages.*/i, "BT-Vizepräs.")
      // Fraktionen
      .replace(/^Erste:?r? Stv\. Fraktionsvorsitzender CDU\/CSU.*/i, "1. Stv. Fraktionsvors. CDU/CSU")
      .replace(/^Stv\. Fraktionsvorsitzende[rn]?:?r? /i, "Stv. Fraktionsvors. ")
      .replace(/^Fraktionsvorsitzende[rn]?:?r? /i, "Fraktionsvors. ")
      .replace(/^Erste:?r? Parlamentarische:?r? Geschäftsführer(:?in)?(?:in)? /i, "1. PGF ")
      .replace(/^Parlamentarische:?r? Geschäftsführer(?:in)? /i, "PGF ")
      // Partei
      .replace(/^Parteivorsitzende[rn]?:?r? /i, "Parteivors. ")
      // Regierung — Staatsminister:innen
      .replace(/^Staatsminister(?:in)? (für|im) /i, "StM ")
      .replace(/^Staatsminister(?:in)?(\s+\+\s+.+)$/i, "StM$1")
      // PStS — alle Varianten
      .replace(/^Parlamentarische[rn]?\s+Staatssekretär(?:in)?\s+im\s+/i, "PStS ")
      .replace(/^Parlamentarische[rn]?\s+Staatssekretär(?:in)?\s+(\+\s+.+)$/i, "PStS $1")
      // Beauftragte
      .replace(/^Beauftragte:?r? der Bundesregierung für /i, "Beauftragt. ")
      .replace(/^Beauftragte:?r? für /i, "Beauftragt. ")
      // Ausschussvorsitz — Komitee-Name komplett raus, Detail kommt im Popover
      .replace(/^Vorsitz: Ausschuss für .*$/, "Ausschussvorsitz")
      .replace(/^Vorsitz: (.+)$/, "Vorsitz")
      .replace(/^Stv\. Vorsitz: .*$/, "Stv. Ausschussvorsitz");

    // Häufige Wort-Verkürzungen für Tail-Reste
    s = s
      .replace(/\bAntiziganismus-Beauftragter\b/gi, "Antiziganismus-Beauftr.")
      .replace(/\bBeauftragte für Mittelstand\b/gi, "Mittelstands-Beauftr.")
      .replace(/\bBeauftragte für Ostdeutschland\b/gi, "Ost-Beauftr.")
      .replace(/\bBeauftragte für Migration[^+]*$/gi, "Migrations-Beauftr.")
      .replace(/\bBund-Länder-Zusammenarbeit\b/gi, "Bund-Länder")
      .replace(/\bSport und Ehrenamt\b/gi, "Sport & Ehrenamt")
      .replace(/\bfür Europa.*$/, "Europa");
    return s;
  }
  type Funktion = { key: string; titel: string; inhalt?: string; tier: 1 | 2 | 3 };
  function classifyFunktion(titel: string): 1 | 2 | 3 {
    if (/^bundeskanzler|^vizekanzler|^bundestagspräsident/i.test(titel)) return 1;
    if (/^stv\.|^erste:?r? parlamentarische:?r? geschäftsführer|^parlamentarische:?r? geschäftsführer/i.test(titel)) return 3;
    if (/^vizepräsident|^fraktionsvorsitzend|^parteivorsitzend|^staatsminister|staatssekretär|^beauftragt|landesgruppe/i.test(titel)) return 2;
    return 3;
  }
  const funktionen: Funktion[] = notes
    .filter((n) => n.kategorie === "funktion")
    .map((n) => ({ key: `n${n.id}`, titel: n.titel, inhalt: n.inhalt, tier: classifyFunktion(n.titel) }));
  const hasAmtForFn = !!politician.amt && politician.amt.trim() !== "" && politician.amt !== "Bundeskanzleramt";
  if (hasAmtForFn) {
    funktionen.unshift({ key: "amt", titel: `Bundesminister:in für ${politician.amt}`, tier: 1 });
  }
  for (const c of committees) {
    if (c.committee_role === "chairperson") {
      funktionen.push({ key: `comm-chair-${c.id}`, titel: `Vorsitz: ${c.committee_label}`, inhalt: "Ausschussvorsitz", tier: 2 });
    } else if (c.committee_role === "vice_chairperson" || c.committee_role === "deputy_chairperson") {
      funktionen.push({ key: `comm-vice-${c.id}`, titel: `Stv. Vorsitz: ${c.committee_label}`, inhalt: "Stellvertretender Ausschussvorsitz", tier: 3 });
    }
  }
  funktionen.sort((a, b) => a.tier - b.tier);
  const fnT1 = funktionen.filter((f) => f.tier === 1);
  const fnT2 = funktionen.filter((f) => f.tier === 2);
  const fnT3 = funktionen.filter((f) => f.tier === 3);
  const hasAnyFunktion = funktionen.length > 0;
  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center sm:items-start gap-2">
              {(() => {
                // Commons-Link aus photo_attribution rekonstruieren (für klickbares Foto)
                const commonsUrl = (() => {
                  if (!politician.photo_attribution) return null;
                  const m = politician.photo_attribution.match(/^Wikimedia Commons:\s*(.+?)\s*$/) ||
                            politician.photo_attribution.match(/^Bild:\s*(.+?)\s+via Wikimedia Commons/);
                  if (!m) return null;
                  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(m[1].trim())}`;
                })();
                const avatar = (
                  <PoliticianAvatar
                    photoUrl={politician.photo_url}
                    firstName={politician.first_name}
                    lastName={politician.last_name}
                    party={politician.party_label}
                    size="xl"
                  />
                );
                return politician.photo_url && commonsUrl ? (
                  <a
                    href={commonsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Original-Datei auf Wikimedia Commons öffnen"
                    className="block transition-opacity hover:opacity-90"
                  >
                    {avatar}
                  </a>
                ) : avatar;
              })()}
              {!politician.photo_url && (
                <p className="text-[10px] leading-tight text-zinc-500 max-w-[128px] text-center sm:text-left">
                  Kein Foto – keine eindeutige Bildlizenz
                </p>
              )}
              {politician.photo_url && (politician.photo_author || politician.photo_license) && (
                <p className="text-[10px] leading-tight text-zinc-400 max-w-[140px] text-center sm:text-left">
                  © {(() => {
                    if (!politician.photo_author) return "unbekannt";
                    const t = truncateAuthor(politician.photo_author);
                    return t.wasTruncated ? <span title={t.full}>{t.short}</span> : t.short;
                  })()}
                  {politician.photo_license && (
                    <>
                      {" · "}
                      {politician.photo_license_url ? (
                        <a
                          href={politician.photo_license_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-zinc-700 hover:underline transition-colors"
                        >
                          {politician.photo_license}
                        </a>
                      ) : (
                        politician.photo_license
                      )}
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  {partyLabel}
                </span>
                {hasVoteData && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span
                      className="text-[12px] text-zinc-500 cursor-help underline decoration-dotted decoration-zinc-300 underline-offset-4"
                      title="Anteil an namentlichen Bundestags-Abstimmungen, bei denen Stimme abgegeben wurde (Ja/Nein/Enthaltung). Plenaranwesenheit allgemein wird nicht erfasst."
                    >
                      Namentliche Abstimmungen{" "}
                      <span className="num font-semibold text-zinc-950">
                        {voteStats.attendanceRate.toFixed(0)} %
                      </span>{" "}
                      <span className="num text-zinc-400">
                        · {voteStats.attended} / {voteStats.totalPolls}
                      </span>
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] mb-3">
                {politician.title ? `${politician.title} ` : ""}
                {politician.first_name} {politician.last_name}
              </h1>

              {/* Funktion-Chips — kompakt neben dem Namen, Klick öffnet Popover mit Beschreibung */}
              {hasAnyFunktion && (
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {funktionen.map((f) => {
                    const label = shortenFunktionTitel(f.titel);
                    const def = f.inhalt || f.titel;
                    const styles =
                      f.tier === 1
                        ? { color: "#ffffff", bg: "#18181b" }
                        : f.tier === 2
                        ? { color: "#27272a", bg: "#f4f4f5" }
                        : { color: "#71717a", bg: "#ffffff" };
                    return (
                      <TagInfoPopover
                        key={f.key}
                        label={label}
                        definition={def}
                        color={styles.color}
                        bg={styles.bg}
                        variant="tonalitaet"
                      />
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-zinc-500 mb-4">
                {politician.occupation && <span>{politician.occupation}</span>}
                {politician.residence && <span>{politician.residence}</span>}
                {politician.year_of_birth && <span className="num">*{politician.year_of_birth}</span>}
                {politician.education && <span>{politician.education}</span>}
                {constituency && <span>WK {constituency}</span>}
              </div>

              {/* Links */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                {speechInfo && (
                  <Link
                    href={`/protokolle/redner/${encodeURIComponent(speechInfo.speaker)}`}
                    className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-950 transition-colors font-medium"
                  >
                    <Mic className="w-3 h-3" strokeWidth={2.25} />
                    <span className="num">{speechInfo.count}</span> Plenarbeiträge
                  </Link>
                )}
                {politician.homepage_url && (
                  <a
                    href={politician.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    {new URL(politician.homepage_url).hostname.replace(/^www\./, "")}
                  </a>
                )}
                {politician.bio_url && (
                  <a
                    href={politician.bio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                    title="Wikipedia (deutsch) · CC BY-SA"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    Wikipedia
                  </a>
                )}
                {politician.bundestag_bio_url && (
                  <a
                    href={politician.bundestag_bio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#1a3e72] hover:text-[#0f2a52] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    bundestag.de
                  </a>
                )}
                {politician.bundesregierung_bio_url && (
                  <a
                    href={politician.bundesregierung_bio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    bundesregierung.de
                  </a>
                )}
                {politician.twitter_handle && (
                  <a
                    href={`https://twitter.com/${politician.twitter_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    @{politician.twitter_handle}
                  </a>
                )}
                {politician.instagram_handle && (
                  <a
                    href={`https://instagram.com/${politician.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    Instagram
                  </a>
                )}
                {politician.facebook_handle && (
                  <a
                    href={`https://facebook.com/${politician.facebook_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    Facebook
                  </a>
                )}
                {politician.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${politician.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    TikTok
                  </a>
                )}
                {politician.abgeordnetenwatch_url && (
                  <a
                    href={politician.abgeordnetenwatch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-950 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                    abgeordnetenwatch
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CV — nutzen die existierende Komponente */}
        {(() => {
          const tryParse = (s: string | null): CV | null => {
            if (!s) return null;
            try { return JSON.parse(s) as CV; } catch { return null; }
          };
          const tryParseConflicts = (s: string | null): SourceConflict[] | null => {
            if (!s) return null;
            try {
              const parsed = JSON.parse(s);
              return Array.isArray(parsed) ? (parsed as SourceConflict[]) : null;
            } catch { return null; }
          };
          // ?orig=1 erzwingt die ursprünglichen JSONs (für Vorher/Nachher-Vergleich)
          const cvWiki = tryParse(showOriginal ? politician.cv_json : (politician.cv_json_dedup ?? politician.cv_json));
          const cvHome = tryParse(showOriginal ? politician.cv_homepage_json : (politician.cv_homepage_json_dedup ?? politician.cv_homepage_json));
          const cvAgh = tryParse(politician.cv_agh_json);
          const conflicts = tryParseConflicts(politician.source_conflicts);
          if (!politician.cv_summary && !cvWiki && !cvHome && !cvAgh) return null;
          return (
            <div className="mb-6">
              <PoliticianCV
                summary={politician.cv_summary}
                summaryMeta={{
                  model: politician.cv_summary_model,
                  promptVersion: politician.cv_summary_prompt_version,
                  generatedAt: politician.cv_summary_generated_at,
                }}
                cvWikipedia={cvWiki}
                wikipediaMeta={{
                  model: politician.cv_model,
                  promptVersion: politician.cv_prompt_version,
                  generatedAt: politician.cv_generated_at,
                }}
                wikipediaUrl={politician.bio_url}
                cvHomepage={cvHome}
                homepageMeta={{
                  model: politician.cv_homepage_model,
                  promptVersion: politician.cv_homepage_prompt_version,
                  generatedAt: politician.cv_homepage_generated_at,
                }}
                homepageUrl={politician.cv_homepage_url ?? politician.homepage_url}
                cvAgh={cvAgh}
                aghMeta={{
                  model: politician.cv_agh_json ? "anthropic:claude-haiku-4-5" : null,
                  promptVersion: politician.cv_agh_json ? "seed-cv-v5-haiku" : null,
                  generatedAt: politician.cv_agh_generated_at,
                }}
                aghUrl={politician.agh_bio_url}
                sourceConflicts={conflicts}
                mergeDrops={cvMergeDrops}
              />
            </div>
          );
        })()}

        {/* Prominente Notes (rolle / sonderfall) — oben mit Amber-Highlight */}
        {notes.filter((n) => n.kategorie !== "sonstiges" && n.kategorie !== "funktion").length > 0 && (
          <Card className="mb-6 border-amber-200/70 bg-amber-50/40">
            {notes
              .filter((n) => n.kategorie !== "sonstiges" && n.kategorie !== "funktion")
              .map((note) => (
                <div key={note.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" strokeWidth={2.25} />
                    <h2 className="text-[13px] font-semibold text-amber-900 uppercase tracking-wider">
                      {note.titel}
                    </h2>
                  </div>
                  <div className="text-[14px] text-amber-900 leading-relaxed whitespace-pre-line">
                    {note.inhalt}
                  </div>
                  {(note.datum_von || note.datum_bis) && (
                    <p className="text-[11px] text-amber-700/70 mt-2 num">
                      {note.datum_von && `Seit ${new Date(note.datum_von + "T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`}
                      {note.datum_von && note.datum_bis && " — "}
                      {note.datum_bis && `bis ${new Date(note.datum_bis + "T00:00:00").toLocaleDateString("de-DE", { month: "long", year: "numeric" })}`}
                    </p>
                  )}
                </div>
              ))}
          </Card>
        )}

        {/* Parlamentarische Arbeit */}
        {parlArbeit.length > 0 && (
          <CollapsibleCard title="Parlamentarische Arbeit" count={parlArbeit.length} className="mb-6">

            {/* Stats strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5 text-[12px]">
              {parlStats.rede ? (
                <Stat2 label="Reden" value={parlStats.rede} />
              ) : null}
              {parlStats.regierungserklaerung ? (
                <Stat2 label="Regierungserklärungen" value={parlStats.regierungserklaerung} />
              ) : null}
              {parlStats.frage ? (
                <Stat2 label="Fragen" value={parlStats.frage} />
              ) : null}
              {parlStats.antwort ? (
                <Stat2 label="Antworten" value={parlStats.antwort} />
              ) : null}
              {parlStats.debattenbeitrag ? (
                <Stat2 label="Debattenbeiträge" value={parlStats.debattenbeitrag} />
              ) : null}
              {parlStats.erklaerung ? (
                <Stat2 label="Erklärungen" value={parlStats.erklaerung} />
              ) : null}
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {parlArbeit.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3 px-3 py-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors"
                >
                  <span className="shrink-0 sm:w-24 text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                    {shortenTyp(item.typ)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {item.thema && (
                      <p className="text-[13.5px] text-zinc-950 line-clamp-2 mb-1 leading-snug">
                        {item.thema}
                      </p>
                    )}
                    {item.zusammenfassung && (
                      <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-1.5">
                        {item.zusammenfassung}
                      </p>
                    )}
                    {item.tonalitaet && (
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <TonalityBadge slug={item.tonalitaet} />
                        {item.has_correction && (
                          <span
                            className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold"
                            title="Bias-Audit: korrigiert (siehe Methodik)"
                          >
                            v2.1
                          </span>
                        )}
                      </div>
                    )}
                    {((item.rede_id && item.speaker_variant) || item.mediathek_fvid) && (
                      <p className="text-[11.5px] mb-1.5 flex items-center gap-3 flex-wrap">
                        {/* Plain <a> statt Next.js <Link>, damit :target-Highlight
                            auf der Redner-Page beim Anker-Sprung greift. */}
                        {item.rede_id && item.speaker_variant && (
                          <a
                            href={`/protokolle/redner/${encodeURIComponent(item.speaker_variant)}#speech-${item.rede_id}`}
                            className="text-[#1a3e72] hover:text-[#0f2a52] underline decoration-[#1a3e72]/30 hover:decoration-[#1a3e72] underline-offset-2 transition-colors"
                          >
                            Volle Analyse →
                          </a>
                        )}
                        {item.mediathek_fvid && (
                          <a
                            href={`https://www.bundestag.de/mediathek?videoid=${item.mediathek_fvid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#1a3e72] hover:text-[#0f2a52] transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" strokeWidth={2} />
                            Video
                            <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                          </a>
                        )}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap num">
                      {item.datum && (
                        <span>
                          {new Date(item.datum + "T00:00:00").toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {item.sitzung && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <Link
                            href={`/protokolle/sitzung/${item.sitzung}`}
                            className="text-[#1a3e72] hover:text-[#0f2a52] underline decoration-[#1a3e72]/30 hover:decoration-[#1a3e72] underline-offset-2 transition-colors"
                          >
                            Sitzung {item.sitzung}
                          </Link>
                        </>
                      )}
                      {item.page_start !== null && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span title="Plenarprotokoll-Seite (Spalte A–D)">
                            S. {item.page_start}
                            {item.page_section ? ` (${item.page_section})` : ""}
                          </span>
                        </>
                      )}
                      {item.drucksache_nr && (
                        <>
                          <span className="text-zinc-200">·</span>
                          {/* "Drucksache" → interne Detailseite (mit Analyse),
                              daneben "PDF" → direkter Original-PDF-Link. */}
                          <Link
                            href={`/aktivitaeten/${item.drucksache_nr.replace(/\//g, "-")}`}
                            className="text-zinc-700 hover:text-zinc-950 transition-colors"
                          >
                            Drucksache {item.drucksache_nr}
                          </Link>
                          {item.pdf_url && (
                            <a
                              href={item.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                            >
                              PDF
                              <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                            </a>
                          )}
                        </>
                      )}
                      {item.source_url && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                          >
                            PDF
                            <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CollapsibleCard>
        )}

        {/* Berlin-Pilot: Reden im Abgeordnetenhaus aus berlin_speeches (mit Volltext-Preview).
            Eigene Karte vor der PARDOK-Übersicht, weil sie reicheren Kontext bietet
            (TOP, speech_type, Interruptions, gekürzter Text). */}
        {berlinReden.stats.total > 0 && (
          <CollapsibleCard
            title="Reden im Abgeordnetenhaus"
            count={berlinReden.stats.total}
            className="mb-6"
          >
            {/* Stats-Strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 text-[12px]">
              {berlinReden.stats.debatte > 0 && (
                <span className="text-zinc-600"><span className="num font-semibold text-zinc-950">{berlinReden.stats.debatte}</span> Debatten</span>
              )}
              {berlinReden.stats.fragestunde_frage > 0 && (
                <span className="text-zinc-600"><span className="num font-semibold text-zinc-950">{berlinReden.stats.fragestunde_frage}</span> Fragen</span>
              )}
              {berlinReden.stats.fragestunde_antwort > 0 && (
                <span className="text-zinc-600"><span className="num font-semibold text-zinc-950">{berlinReden.stats.fragestunde_antwort}</span> Antworten</span>
              )}
              {berlinReden.stats.persoenliche_erklaerung > 0 && (
                <span className="text-zinc-600"><span className="num font-semibold text-zinc-950">{berlinReden.stats.persoenliche_erklaerung}</span> Pers. Erkl.</span>
              )}
            </div>
            {/* Transparenz-Hinweis: KI-Analyse-Status */}
            <p className="text-[11px] text-zinc-500 mb-4 italic">
              KI-Zusammenfassung + Tonalität via Haiku 4.5 (Methodologie Berlin-v1, Stand 2026-05-23).
              Wo Analyse fehlt: Volltext-Vorschau aus dem PDF.
            </p>
            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
              {berlinReden.items.map((it) => {
                const drsShort = it.drucksache_nrn.slice(0, 3);
                const drsExtra = it.drucksache_nrn.length - drsShort.length;
                return (
                  <article
                    key={it.speech_id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors"
                  >
                    <div className="flex flex-col items-start gap-0.5 shrink-0 w-24">
                      <span className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                        {berlinSpeechTypeLabel(it.speech_type)}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Plenarprotokoll
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {it.top_titel && (
                        <p className="text-[13.5px] text-zinc-950 line-clamp-2 mb-1 leading-snug">
                          {it.top_marker ? `${it.top_marker} ` : ""}{it.top_titel}
                        </p>
                      )}
                      {/* Bevorzugt KI-Zusammenfassung; Fallback Volltext-Preview */}
                      {it.analysis?.zusammenfassung ? (
                        <p className="text-[12.5px] text-zinc-700 leading-relaxed mb-1.5 line-clamp-3">
                          {stripBerlinSpeakerLead(it.analysis.zusammenfassung)}
                        </p>
                      ) : it.text_preview ? (
                        <p className="text-[12.5px] text-zinc-500 leading-relaxed mb-1.5 line-clamp-2">
                          {it.text_preview}
                        </p>
                      ) : null}
                      {/* Tonalität-Badge wenn vorhanden (Drift-Aliase via resolveBerlinTonality) */}
                      {it.analysis && (() => {
                        const resolved = resolveBerlinTonality(it.analysis.tonalitaet);
                        const cfg = resolved ? TONALITAET_CONFIG[resolved] : null;
                        if (!cfg) return null;
                        return (
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ color: cfg.color, backgroundColor: cfg.bg }}
                              title={`Tonalität: ${cfg.label} (Berlin-Methodology v1, Stand 2026-05-23)`}
                            >
                              {cfg.label}
                            </span>
                            {it.analysis.forderungen_count > 0 && (
                              <span className="text-[10px] text-zinc-500" title="Anzahl der vom LLM erfassten Forderungen / Positionen">
                                {`${it.analysis.forderungen_count} Forderung${it.analysis.forderungen_count === 1 ? "" : "en"}`}
                              </span>
                            )}
                            {it.analysis.self_check_konfidenz && it.analysis.self_check_konfidenz !== "hoch" && (
                              <span
                                className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold"
                                title={`LLM-Selbst-Konfidenz: ${it.analysis.self_check_konfidenz}`}
                              >
                                {it.analysis.self_check_konfidenz}-Konfidenz
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap num">
                        {it.datum && (
                          <>
                            <span>
                              {new Date(it.datum + "T00:00:00").toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-zinc-200">·</span>
                          </>
                        )}
                        <Link
                          href={`/parlamente/berlin/sitzung/${it.sitzung_nr}#rede-s-${it.speech_id}`}
                          className="text-blue-700 hover:underline underline-offset-2 transition-colors"
                        >
                          Sitzung {it.sitzung_nr}
                        </Link>
                        {drsShort.length > 0 && (
                          <>
                            <span className="text-zinc-200">·</span>
                            <span title={it.drucksache_nrn.join(", ")}>
                              Drs. {drsShort.join(", ")}{drsExtra > 0 ? ` (+${drsExtra})` : ""}
                            </span>
                          </>
                        )}
                        <span className="text-zinc-200">·</span>
                        <a
                          href={it.lok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                        >
                          PDF
                          <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
              {berlinReden.stats.total > berlinReden.items.length && (
                <p className="text-[11px] text-zinc-400 italic px-3 py-2">
                  + {berlinReden.stats.total - berlinReden.items.length} weitere Reden (nicht angezeigt)
                </p>
              )}
            </div>
          </CollapsibleCard>
        )}

        {/* Berlin-Pilot: Anfragen & Anträge aus den PARDOK-Daten.
            Reden werden oben separat aus berlin_speeches gerendert — hier nur noch
            der Rest der Dokument-Aktivitäten (anfrage/antrag/sonstige).
            Flache Liste nach Datum, Stats-Strip oben — analog Bundestag „Parlamentarische Arbeit". */}
        {(() => {
          const nonRede = berlinArbeit.groups.filter((g) => g.kategorie !== "rede");
          if (nonRede.length === 0) return null;
          const anfragen = nonRede.find((g) => g.kategorie === "anfrage")?.total ?? 0;
          const antraege = nonRede.find((g) => g.kategorie === "antrag")?.total ?? 0;
          const weitere = nonRede.find((g) => g.kategorie === "sonstige")?.total ?? 0;
          const total = anfragen + antraege + weitere;
          const items = nonRede
            .flatMap((g) => g.items)
            .sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
          const remaining = total - items.length;
          return (
            <CollapsibleCard
              title="Anfragen & Anträge im Abgeordnetenhaus"
              count={total}
              className="mb-6"
            >
              {/* Stats-Strip — analog Bundestag „Parlamentarische Arbeit" */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 text-[12px]">
                {anfragen > 0 && <Stat2 label={anfragen === 1 ? "Anfrage" : "Anfragen"} value={anfragen} />}
                {antraege > 0 && <Stat2 label="Anträge & Gesetzentwürfe" value={antraege} />}
                {weitere > 0 && <Stat2 label="Weitere Drucksachen" value={weitere} />}
              </div>
              <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
                {items.map((it, i) => (
                  <article
                    key={`${it.dbid}-${i}`}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors"
                  >
                    <div className="flex flex-col items-start gap-0.5 shrink-0 w-24">
                      <span className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider">
                        {berlinKatLabel(it)}
                      </span>
                      {it.datum && (
                        <span className="num text-[10px] text-zinc-400">
                          {new Date(it.datum + "T00:00:00").toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {it.titel && (
                        <Link
                          href={`/parlamente/berlin/drucksache/${it.dbid}`}
                          className="block text-[13.5px] text-zinc-950 line-clamp-2 mb-1 leading-snug hover:text-blue-700 transition-colors"
                        >
                          {it.titel}
                        </Link>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 flex-wrap num">
                        {it.dokNr && <span>Drucksache {it.dokNr}</span>}
                        {it.sachgebiet && (
                          <>
                            <span className="text-zinc-200">·</span>
                            <span className="normal-case">{it.sachgebiet}</span>
                          </>
                        )}
                        {it.lokUrl && (
                          <>
                            <span className="text-zinc-200">·</span>
                            <a
                              href={it.lokUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                            >
                              PDF
                              <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {remaining > 0 && (
                  <p className="text-[11px] text-zinc-400 italic px-3 py-2">
                    + {remaining.toLocaleString("de-DE")} weitere
                  </p>
                )}
              </div>
            </CollapsibleCard>
          );
        })()}

        {/* Schriftliche Fragen (Einzelfragen + Antworten der Bundesregierung) */}
        {qaPaare.length > 0 && (
          <CollapsibleCard title="Schriftliche Fragen" count={qaPaare.length} className="mb-6">
            <ul className="space-y-3">
              {qaPaare.map((qa) => (
                <li key={`${qa.drucksacheNr}-${qa.paarIndex}`} className="border-l-2 border-zinc-200 pl-3">
                  {qa.frageText && <p className="text-[13px] text-zinc-800 leading-snug">{qa.frageText}</p>}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 flex-wrap">
                    <Link href={`/aktivitaeten/${qa.drucksacheNr.replace(/\//g, "-")}`} className="text-[#1a3e72] hover:text-[#0f2a52] transition-colors">
                      {qa.drucksacheNr}
                    </Link>
                    {qa.datum && <><span className="text-zinc-200">·</span><span className="num">{qa.datum}</span></>}
                  </div>
                  {qa.antwortText && (
                    <details className="group mt-1">
                      <summary className="cursor-pointer text-[11px] text-[#1a3e72] hover:text-[#0f2a52] select-none list-none">
                        <span className="group-open:hidden">▶ Antwort der Bundesregierung</span>
                        <span className="hidden group-open:inline">▼ Antwort ausblenden</span>
                      </summary>
                      <p className="mt-1 text-[12px] text-zinc-600 leading-relaxed whitespace-pre-line border-l-2 border-zinc-100 pl-3">{qa.antwortText}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleCard>
        )}

        {/* Drucksachen */}
        {drucksachen.length > 0 && (
          <CollapsibleCard title="Drucksachen" count={drucksachen.length} className="mb-6">
            <DrucksachenList items={drucksachen} />
          </CollapsibleCard>
        )}

        {/* Medien & Interviews */}
        {mediaAppearances.length > 0 && (
          <CollapsibleCard title="Medien & Interviews" count={mediaAppearances.length} className="mb-6">
            <MediaAppearancesList items={mediaAppearances} politicianId={politicianId} />
          </CollapsibleCard>
        )}

        {/* Fraktions-Abweichungen — einzige Person-spezifische Aussage über
            das Stimmverhalten. Aggregat-Ja/Nein-Quote wäre nur Fraktions-Echo. */}
        {fractionDev.total_namentlich > 0 && (
          <CollapsibleCard title="Abstimmungsverhalten" className="mb-6">
            <FractionDeviations data={fractionDev} />
          </CollapsibleCard>
        )}

        {/* Sidejobs + Committees */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <CollapsibleCard title="Nebeneinkünfte" count={sidejobs.length || undefined}>
            {sidejobs.length > 0 ? (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {sidejobs.map((s) => (
                  <div
                    key={s.id}
                    className="px-3 py-2.5 rounded-lg border border-zinc-100"
                  >
                    <p className="text-[13px] font-medium text-zinc-950 mb-1">
                      {s.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                      {s.organization && <span>{s.organization}</span>}
                      {s.income_level && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span>{getIncomeRange(s.income_level)}</span>
                        </>
                      )}
                      {s.income && s.income > 0 && (
                        <>
                          <span className="text-zinc-200">·</span>
                          <span className="num font-medium text-zinc-700">
                            {s.income.toLocaleString("de-DE")} €
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-zinc-400 py-6 text-center">
                Keine Nebeneinkünfte gemeldet.
              </p>
            )}
          </CollapsibleCard>

          <CollapsibleCard title="Ausschüsse" count={committees.length || undefined}>
            {committees.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {committees.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-baseline gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-[13px] font-medium text-zinc-950">
                      {c.committee_label}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      {c.committee_role === "chairperson" ? "Vorsitz"
                        : c.committee_role === "deputy_chairperson" ? "Stv. Vorsitz"
                        : c.committee_role === "regular_member" ? "Ord. Mitglied"
                        : c.committee_role === "alternate_member" ? "Stv. Mitglied"
                        : c.committee_role?.replace(/_/g, " ") || "Mitglied"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-zinc-400 py-6 text-center">
                {hasAnyFunktion
                  ? "Keine Ausschuss-Mitgliedschaften — Schwerpunkt liegt auf der oben genannten Funktion."
                  : "Keine Ausschuss-Mitgliedschaften gefunden."}
              </p>
            )}
          </CollapsibleCard>
        </div>

        {/* Recent Votes */}
        {votes.length > 0 && (
          <CollapsibleCard title="Letzte Abstimmungen">
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {votes.slice(0, 20).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-50 transition-colors"
                >
                  <span
                    className={
                      "text-[10px] font-medium uppercase tracking-wider w-16 shrink-0 " +
                      (v.vote === "yes" ? "text-emerald-700"
                        : v.vote === "no" ? "text-red-700"
                        : v.vote === "abstain" ? "text-amber-700"
                        : "text-zinc-400")
                    }
                  >
                    {v.vote === "yes" ? "Ja"
                      : v.vote === "no" ? "Nein"
                      : v.vote === "abstain" ? "Enthaltung"
                      : "Abwesend"}
                  </span>
                  <Link
                    href={`/abstimmungen/${v.poll_id}`}
                    className="text-[13px] text-zinc-700 flex-1 truncate hover:text-zinc-950 hover:underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
                  >
                    {v.poll_label}
                  </Link>
                  {v.poll_url && (
                    <a
                      href={v.poll_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Quelle (Bundestag.de)"
                      className="text-zinc-400 hover:text-zinc-950 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleCard>
        )}
      </div>
    </div>
  );
}

function Stat2({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="num font-semibold text-zinc-950">{value}</span>
      <span className="text-zinc-500">{label}</span>
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-zinc-200/70 p-6 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </h2>
      {count !== undefined && (
        <span className="num text-[11px] text-zinc-400">{count}</span>
      )}
    </div>
  );
}

/**
 * Karte mit Klapp-Toggle. Native <details> — kein JS, kein Hydration, kein
 * State. Per Page-Reload immer offen.
 */
function CollapsibleCard({
  title,
  count,
  children,
  className = "",
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-zinc-200/70 ${className}`}>
      <details open className="group/details">
        <summary className="list-none cursor-pointer flex items-baseline justify-between px-6 pt-6 pb-5 hover:bg-zinc-50/40 rounded-2xl transition-colors select-none">
          <div className="flex items-baseline gap-3">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{title}</h2>
            {count !== undefined && (
              <span className="num text-[11px] text-zinc-400">{count}</span>
            )}
          </div>
          <ChevronDown
            className="w-3.5 h-3.5 text-zinc-400 transition-transform group-open/details:rotate-0 -rotate-90"
            strokeWidth={2.5}
            aria-hidden
          />
        </summary>
        <div className="px-6 pb-6 -mt-1">{children}</div>
      </details>
    </section>
  );
}

const voteLabel: Record<string, string> = {
  yes: "Ja",
  no: "Nein",
  abstain: "Enthaltung",
};

const voteColor: Record<string, string> = {
  yes: "text-emerald-700 bg-emerald-50 border-emerald-200",
  no: "text-rose-700 bg-rose-50 border-rose-200",
  abstain: "text-amber-700 bg-amber-50 border-amber-200",
};

function FractionDeviations({ data }: { data: import("@/lib/db").FractionDeviationResult }) {
  if (data.is_fractionless) {
    return (
      <p className="text-[13.5px] text-zinc-600 leading-relaxed">
        Fraktionslos — Abweichungen vom Fraktionskonsens nicht messbar.
      </p>
    );
  }

  const N = data.active_polls;

  if (data.deviations.length === 0) {
    return (
      <p className="text-[13.5px] text-zinc-700 leading-relaxed">
        Folgte in <span className="font-medium text-zinc-950">allen {N}</span>{" "}
        aktiven namentlichen Abstimmungen der Fraktionslinie.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[13.5px] text-zinc-700 leading-relaxed mb-4">
        In <span className="num font-medium text-zinc-950">{data.deviations.length}</span> von{" "}
        <span className="num font-medium text-zinc-950">{N}</span> aktiven namentlichen Abstimmungen
        anders als die <span className="font-medium">{data.fraction_label?.replace(/\s*\(Bundestag\s+\d{4}\s*-\s*\d{4}\)\s*$/, "").trim()}</span>-Fraktion gestimmt:
      </p>
      <ul className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
        {data.deviations.map((d) => (
          <li key={d.poll_id} className="flex items-start gap-3 px-3 py-2 rounded-lg border border-zinc-100 hover:border-zinc-200 transition-colors">
            <div className="flex-1 min-w-0">
              <Link
                href={`/abstimmungen/${d.poll_id}`}
                className="block text-[13px] font-medium text-zinc-950 hover:underline underline-offset-2 leading-snug line-clamp-2"
              >
                {d.poll_label ?? `Abstimmung #${d.poll_id}`}
              </Link>
              {d.poll_date && (
                <p className="text-[11px] text-zinc-400 num mt-0.5">
                  {new Date(d.poll_date + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${voteColor[d.majority_vote] ?? ""}`} title={`Fraktions-Mehrheit: ${voteLabel[d.majority_vote]}`}>
                Frakt. {voteLabel[d.majority_vote]}
              </span>
              <span className="text-zinc-300 text-[10px]">→</span>
              <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border ${voteColor[d.personal_vote] ?? ""}`} title={`Persönlicher Vote: ${voteLabel[d.personal_vote]}`}>
                MdB {voteLabel[d.personal_vote]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


const dsKlasseShort: Record<string, string> = {
  klein: "KL. ANFRAGE",
  mittel: "BERICHT",
  gross: "GESETZENTWURF",
  antwort: "ANTWORT",
  regierung: "VORLAGE",
};

function DrucksachenList({ items }: { items: PoliticianDrucksacheRow[] }) {
  return (
    <ul className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
      {items.map((it) => {
        const slug = it.drucksache_nr.replace("/", "-");
        const klasseShort = dsKlasseShort[it.batch_class] ?? it.batch_class.toUpperCase();
        const themen = it.thema.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
        const datumF = it.datum
          ? new Date(it.datum + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
          : null;

        return (
          <li key={`${it.drucksache_nr}-${it.aktivitaetsart}`}>
            <a
              href={`/aktivitaeten/${slug}`}
              className="block rounded-lg border border-zinc-200/70 bg-white hover:bg-zinc-50/50 hover:border-zinc-300 transition-colors px-4 py-3 group"
            >
              <div className="flex items-baseline gap-2 mb-1 flex-wrap text-[10.5px] uppercase tracking-wider font-medium text-zinc-500">
                <span className="font-mono text-zinc-950 num">{it.drucksache_nr}</span>
                <span className="text-zinc-300">·</span>
                <span>{klasseShort}</span>
                {datumF && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="num normal-case font-normal tracking-normal text-zinc-500">{datumF}</span>
                  </>
                )}
                {it.total_mitzeichner > 1 && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="normal-case font-normal tracking-normal text-zinc-500">
                      mit <span className="num font-medium text-zinc-700">{it.total_mitzeichner - 1}</span> weiteren
                    </span>
                  </>
                )}
                {it.tonalitaet && (
                  <span className="ml-auto normal-case tracking-normal">
                    <DrucksacheTonalityBadge slug={it.tonalitaet} />
                  </span>
                )}
              </div>
              {it.titel && (
                <p className="text-[13.5px] text-zinc-950 leading-snug font-medium line-clamp-2 mb-1 group-hover:underline underline-offset-2">
                  {it.titel}
                </p>
              )}
              {it.zusammenfassung && (
                <p className="text-[12.5px] text-zinc-500 leading-relaxed line-clamp-2 mb-1.5">
                  {it.zusammenfassung}
                </p>
              )}
              {(themen.length > 0 || it.answer_drucksache_nr) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {themen.map((t) => (
                    <span key={t} className="text-[10.5px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                  {it.answer_drucksache_nr && (
                    <span
                      className="text-[10.5px] text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded font-medium normal-case tracking-normal"
                      title="Antwort der Bundesregierung in unserer DB — siehe Detail-Seite"
                    >
                      ✓ Antwort <span className="font-mono num">{it.answer_drucksache_nr}</span>
                    </span>
                  )}
                </div>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
