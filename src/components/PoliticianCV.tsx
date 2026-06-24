import {
  GraduationCap,
  Briefcase,
  Landmark,
  Star,
  ExternalLink,
  Info,
  ChevronDown,
} from "lucide-react";

export interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

interface SourceMeta {
  /** model identifier, e.g. "groq:llama-3.1-8b-instant" */
  model: string | null;
  promptVersion: string | null;
  generatedAt: string | null;
}

export interface SourceConflict {
  section: "ausbildung" | "beruflicher_werdegang" | "politische_stationen" | "sonstiges" | string;
  jahr: string;
  /** Legacy-Felder (Wikipedia↔Homepage-Paare, Bundestag-Bestand). */
  wikipedia?: string;
  homepage?: string;
  /** Generische Paar-Felder (jede Kombination aus wikipedia/homepage/agh). */
  sourceA?: CVSource;
  textA?: string;
  sourceB?: CVSource;
  textB?: string;
  reason: string;
  /** Stage-5.5/6 Manual-Review Klassifikation (Opus 4.7 nach Verifier-Cascade). */
  final_verdict?: "ECHT" | "PRAEZISIERUNG" | "FALSE_POSITIVE" | "UNKLAR";
  final_reason?: string;
  verdict_method?: string;
  /** Optional: Stage-5.5-Verifikation gegen die Roh-Quelltexte (älteres Feld). */
  verification?: {
    classification:
      | "echte_diskrepanz"
      | "wikipedia_extraktion_falsch"
      | "homepage_extraktion_falsch"
      | "beide_falsch"
      | "unklar";
    reason: string;
    quote_wikipedia: string | null;
    quote_homepage: string | null;
  };
}

const SOURCE_LABEL: Record<string, string> = {
  wikipedia: "Wikipedia",
  homepage: "Homepage",
  agh: "Abgeordnetenhaus-Profil",
};

/** Liefert die beiden gegenübergestellten Quellen-Aussagen eines Konflikts —
 *  generisch (sourceA/sourceB) oder via Legacy-Felder (wikipedia/homepage). */
function conflictPair(c: SourceConflict): { label: string; text: string }[] {
  if (c.sourceA && c.sourceB && c.textA != null && c.textB != null) {
    return [
      { label: SOURCE_LABEL[c.sourceA] ?? c.sourceA, text: c.textA },
      { label: SOURCE_LABEL[c.sourceB] ?? c.sourceB, text: c.textB },
    ];
  }
  const out: { label: string; text: string }[] = [];
  if (c.wikipedia != null) out.push({ label: "Wikipedia", text: c.wikipedia });
  if (c.homepage != null) out.push({ label: "Homepage", text: c.homepage });
  return out;
}

/**
 * Filtert Konflikte für die UI:
 * - Mit final_verdict (Opus-Review): nur "ECHT" zeigen
 * - Mit altem verification-Feld: nur "echte_diskrepanz" zeigen
 * - Ohne beides: alle zeigen (Fallback)
 */
function filterUserVisibleConflicts(
  conflicts: SourceConflict[] | null | undefined,
): SourceConflict[] {
  if (!conflicts) return [];
  return conflicts.filter((c) => {
    if (c.final_verdict) return c.final_verdict === "ECHT";
    if (c.verification) return c.verification.classification === "echte_diskrepanz";
    return true; // graceful fallback
  });
}

export interface CVMergeDrop {
  section: string;
  dropped_source: "wikipedia" | "homepage";
  dropped_jahr: string | null;
  dropped_text: string | null;
  kept_jahr: string | null;
  kept_text: string | null;
}

export interface PoliticianCVProps {
  /** Lesbarer 2–3-Satz-Bio-Text */
  summary?: string | null;
  summaryMeta?: SourceMeta;

  /** Strukturiert aus Wikipedia */
  cvWikipedia?: CV | null;
  wikipediaMeta?: SourceMeta;
  wikipediaUrl?: string | null;

  /** Strukturiert von der persönlichen Homepage */
  cvHomepage?: CV | null;
  homepageMeta?: SourceMeta;
  homepageUrl?: string | null;

  /** Strukturiert aus dem Abgeordnetenhaus-Profil (Berlin) — dritte Quelle */
  cvAgh?: CV | null;
  aghMeta?: SourceMeta;
  aghUrl?: string | null;

  /** Quellen-Diskrepanzen aus Stage 5 (Source-Coherence-Check). */
  sourceConflicts?: SourceConflict[] | null;

  /** Audit-Trail: Einträge die als Duplikate ausgeblendet wurden (cv_merge_drops). */
  mergeDrops?: CVMergeDrop[] | null;
}

const SECTIONS = [
  { key: "ausbildung", label: "Ausbildung", icon: GraduationCap },
  { key: "beruflicher_werdegang", label: "Beruflicher Werdegang", icon: Briefcase },
  { key: "politische_stationen", label: "Politische Stationen", icon: Landmark },
  { key: "sonstiges", label: "Sonstiges", icon: Star },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export type CVSource = "homepage" | "wikipedia" | "agh";

interface MergedEntry {
  jahr: string;
  text: string;
  sources: CVSource[];
}

/** Normalisiert Text für simple Duplikat-Erkennung */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9äöüß]/gi, "").slice(0, 60);
}

/**
 * Merged mehrere Quellen (in Prioritäts-Reihenfolge) zu einer deduplizierten Liste.
 * Die erste Quelle bestimmt die Erst-Reihenfolge; spätere Quellen werden über exakte
 * Schlüssel oder Ähnlichkeit eingemischt und tragen ihre Herkunft in `sources` nach.
 * Bei Ähnlichkeits-Merge gewinnt eine spätere Quelle mit Jahr, wenn der bestehende
 * Eintrag keins hat (genauere Datierung).
 */
function mergeSections(
  sources: { src: CVSource; entries: { jahr: string; text: string }[] | undefined }[],
): MergedEntry[] {
  const result: MergedEntry[] = [];
  const seen = new Map<string, number>(); // normKey → idx in result

  for (let s = 0; s < sources.length; s++) {
    const { src, entries } = sources[s];
    for (const e of entries ?? []) {
      const key = normalize(e.jahr + e.text);
      if (seen.has(key)) {
        const idx = seen.get(key)!;
        if (!result[idx].sources.includes(src)) result[idx].sources.push(src);
        continue;
      }
      // Erste Quelle: einfach übernehmen (legt die Reihenfolge fest).
      if (s === 0) {
        seen.set(key, result.length);
        result.push({ jahr: e.jahr, text: e.text, sources: [src] });
        continue;
      }
      // Ähnlichkeits-Dedup über alle bestehenden Einträge.
      const newTextNorm = normalize(e.text);
      const newYear = parseFirstYear(e.jahr);
      let merged = false;
      for (let idx = 0; idx < result.length; idx++) {
        const existing = result[idx];
        const existingTextNorm = normalize(existing.text);
        const existingYear = parseFirstYear(existing.jahr);
        const yearsCompatible =
          newYear === null || existingYear === null || newYear === existingYear;
        if (!yearsCompatible) continue;
        // Text-Ähnlichkeit: einer ist Substring des anderen (mind. 25 normierte Zeichen)
        const minLen = Math.min(existingTextNorm.length, newTextNorm.length);
        if (minLen < 25) continue;
        const overlap =
          existingTextNorm.includes(newTextNorm.slice(0, 25)) ||
          newTextNorm.includes(existingTextNorm.slice(0, 25));
        if (!overlap) continue;
        // Match — Quelle nachtragen
        if (!existing.sources.includes(src)) existing.sources.push(src);
        // Wenn die neue Quelle ein Jahr hat und der bestehende Eintrag nicht:
        // genauere Datierung gewinnt (Text + Jahr übernehmen, Quellen behalten).
        if (newYear !== null && existingYear === null) {
          result[idx] = { jahr: e.jahr, text: e.text, sources: existing.sources };
        }
        merged = true;
        break;
      }
      if (merged) continue;
      seen.set(key, result.length);
      result.push({ jahr: e.jahr, text: e.text, sources: [src] });
    }
  }

  // Chronologisch sortieren (älteste zuerst); Einträge ohne Jahr an den Anfang
  // (oft frühe Lebens-Phasen wie "Jugendlicher: Mitglied JU" oder andauernde
  // Mitgliedschaften ohne klares Startdatum).
  // Tiebreaker bei gleichem Startjahr: Punkt-Daten vor Zeitraum-Daten
  // (z.B. "1990 Ausbildung abgeschlossen" vor "1990-1994 Studium").
  result.sort((a, b) => {
    const ya = parseFirstYear(a.jahr);
    const yb = parseFirstYear(b.jahr);
    if (ya === null && yb === null) return 0;
    if (ya === null) return -1;
    if (yb === null) return 1;
    if (ya !== yb) return ya - yb;
    const aRange = isYearRange(a.jahr);
    const bRange = isYearRange(b.jahr);
    if (aRange === bRange) return 0;
    return aRange ? 1 : -1;
  });

  return result;
}

function parseFirstYear(jahr: string): number | null {
  const m = jahr.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

/** True wenn die Jahres-Angabe einen Zeitraum/offen-endig beschreibt (vs. ein Punkt-Datum). */
function isYearRange(jahr: string): boolean {
  if ((jahr.match(/\d{4}/g) ?? []).length > 1) return true;  // "1990-1994", "2014–2017"
  if (/\bseit\b/i.test(jahr)) return true;                    // "seit 2018"
  if (/\bbis\b/i.test(jahr)) return true;                     // "bis 2020"
  if (/\bab\b/i.test(jahr)) return true;                      // "ab 2014"
  return false;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

/** Index der Quellen-Diskrepanzen nach `${section}|${jahr}` für O(1)-Lookup im Render. */
function indexConflicts(
  conflicts: SourceConflict[] | null | undefined,
): Map<string, SourceConflict> {
  const map = new Map<string, SourceConflict>();
  if (!conflicts) return map;
  for (const c of conflicts) {
    map.set(`${c.section}|${c.jahr}`, c);
  }
  return map;
}

export function PoliticianCV(props: PoliticianCVProps) {
  const {
    summary,
    summaryMeta,
    cvWikipedia,
    wikipediaMeta,
    wikipediaUrl,
    cvHomepage,
    homepageMeta,
    homepageUrl,
    cvAgh,
    aghMeta,
    aghUrl,
    sourceConflicts,
    mergeDrops,
  } = props;

  // Drops nach Sektion gruppieren für die "X Duplikate ausgeblendet"-Anzeige
  const dropsBySection = new Map<string, CVMergeDrop[]>();
  for (const d of mergeDrops ?? []) {
    if (!dropsBySection.has(d.section)) dropsBySection.set(d.section, []);
    dropsBySection.get(d.section)!.push(d);
  }

  const visibleConflicts = filterUserVisibleConflicts(sourceConflicts);
  const conflictIdx = indexConflicts(visibleConflicts);
  const conflictCount = visibleConflicts.length;

  // Pro Sektion mergen (Prioritäts-Reihenfolge: Homepage → Wikipedia → AGH).
  // AGH ist nur für Berlin gesetzt; ohne sie ist das Ergebnis identisch zum
  // bisherigen 2-Quellen-Merge.
  const mergeKey = (key: SectionKey) =>
    mergeSections([
      { src: "homepage", entries: cvHomepage?.[key] },
      { src: "wikipedia", entries: cvWikipedia?.[key] },
      { src: "agh", entries: cvAgh?.[key] },
    ]);
  const merged: Record<SectionKey, MergedEntry[]> = {
    ausbildung: mergeKey("ausbildung"),
    beruflicher_werdegang: mergeKey("beruflicher_werdegang"),
    politische_stationen: mergeKey("politische_stationen"),
    sonstiges: mergeKey("sonstiges"),
  };

  const nonEmpty = SECTIONS.filter((s) => merged[s.key].length > 0);
  const hasAnything = !!summary || nonEmpty.length > 0;
  if (!hasAnything) return null;

  const hasHomepage = !!cvHomepage && Object.values(cvHomepage).some((arr) => arr?.length > 0);
  const hasWikipedia = !!cvWikipedia && Object.values(cvWikipedia).some((arr) => arr?.length > 0);
  const hasAgh = !!cvAgh && Object.values(cvAgh).some((arr) => arr?.length > 0);
  // Zahl der unabhängigen Quellen, die überhaupt CV-Daten beigesteuert haben.
  const sourceCount = [hasHomepage, hasWikipedia, hasAgh].filter(Boolean).length;

  return (
    <div className="bg-card rounded-2xl border border-border mb-6">
      <details open className="group/details">
        <summary className="list-none cursor-pointer flex items-baseline justify-between gap-3 flex-wrap px-6 pt-6 pb-4 hover:bg-zinc-50/40 dark:hover:bg-zinc-800/40 rounded-2xl transition-colors select-none">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-bold">Lebenslauf</h2>
          </div>
          <ChevronDown
            className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform group-open/details:rotate-0 -rotate-90"
            strokeWidth={2.5}
            aria-hidden
          />
        </summary>
        <div className="px-6 pb-6 -mt-1">

      {/* Bio-Lead */}
      {summary && (
        <p className="text-base leading-relaxed text-foreground/90 mb-5">
          {summary}
        </p>
      )}

      {/* Quellen-Diskrepanz-Banner: rein faktischer Hinweis, keine Wertung */}
      {conflictCount > 0 && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/40 px-4 py-2.5 text-[13px] leading-relaxed text-amber-900 dark:text-amber-300">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>
            <strong>{conflictCount === 1 ? "1 Stelle" : `${conflictCount} Stellen`}</strong>{" "}
            {conflictCount === 1 ? "weicht" : "weichen"} zwischen den Quellen voneinander ab. Markiert in der Liste unten.
          </span>
        </div>
      )}

      {/* Strukturierte Listen — pro Kategorie einklappbar, standardmäßig zu */}
      {nonEmpty.length > 0 && (
        <div className="space-y-2">
          {nonEmpty.map(({ key, label, icon: Icon }) => {
            const sectionDrops = dropsBySection.get(key) ?? [];
            return (
              <details key={key} className="group/sec rounded-xl border border-border-soft">
                <summary className="list-none cursor-pointer flex items-center gap-2.5 px-4 py-3 select-none rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
                  <ChevronDown
                    className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform group-open/sec:rotate-180"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </summary>
                <div className="px-4 pb-4 pt-1">
                  <ul className="space-y-2">
                    {merged[key].map((entry, i) => {
                      const conflict = conflictIdx.get(`${key}|${entry.jahr}`);
                      return (
                        <li key={i} className="flex gap-3 text-sm">
                          <span
                            className={`font-mono text-xs shrink-0 w-20 pt-0.5 ${entry.jahr ? "text-muted" : "text-muted/40"}`}
                            title={entry.jahr ? undefined : "Kein Datum in den Quellen angegeben"}
                          >
                            {entry.jahr || "—"}
                          </span>
                          <span className="text-foreground/90 leading-snug flex-1">
                            {entry.text}
                            {entry.sources.length >= 2 && !conflict && (
                              <span
                                className="ml-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
                                title={`In ${entry.sources.length} unabhängigen Quellen übereinstimmend belegt`}
                              >
                                {"✓".repeat(entry.sources.length)}
                              </span>
                            )}
                            {conflict && (
                              <details className="mt-1.5 text-[12px] rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/40 px-2.5 py-1.5">
                                <summary className="cursor-pointer text-amber-800 dark:text-amber-400 font-medium select-none list-none flex items-center gap-1">
                                  <Info className="w-3 h-3" aria-hidden />
                                  Quellen-Diskrepanz · zum Aufklappen
                                </summary>
                                <div className="mt-2 space-y-1.5 text-amber-900/90 dark:text-amber-300/90 leading-snug">
                                  {conflictPair(conflict).map((p, pi) => (
                                    <div key={pi}>
                                      <span className="font-semibold">{p.label}:</span>{" "}
                                      {p.text}
                                    </div>
                                  ))}
                                  {(conflict.final_reason || conflict.reason) && (
                                    <div className="text-[11px] text-amber-800/80 dark:text-amber-400/80 italic pt-1 border-t border-amber-200/60 dark:border-amber-900/50">
                                      Hinweis der Prüfung: {conflict.final_reason ?? conflict.reason}
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {sectionDrops.length > 0 && (
                    <details className="mt-3 text-[12px] rounded-md border border-border bg-gray-50/70 dark:bg-gray-800/70 px-2.5 py-2">
                      <summary className="cursor-pointer text-muted hover:text-foreground font-medium select-none list-none flex items-center gap-1">
                        <Info className="w-3 h-3" aria-hidden />
                        {sectionDrops.length === 1
                          ? "1 Eintrag als Duplikat ausgeblendet — Vergleich anzeigen"
                          : `${sectionDrops.length} Einträge als Duplikate ausgeblendet — Vergleich anzeigen`}
                      </summary>
                      <ul className="mt-2.5 space-y-3 text-foreground/80">
                        {sectionDrops.map((d, di) => {
                          const droppedSrc = d.dropped_source === "wikipedia" ? "Wikipedia" : "Homepage";
                          const keptSrc = d.dropped_source === "wikipedia" ? "Homepage" : "Wikipedia";
                          return (
                            <li key={di} className="border-l-2 border-gray-300 dark:border-gray-600 pl-2.5 space-y-1 leading-snug">
                              <div className="flex gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted/70 shrink-0 w-20 pt-0.5">
                                  {droppedSrc} (weg)
                                </span>
                                <span className="flex-1 text-muted line-through decoration-gray-400/50 dark:decoration-gray-500/50">
                                  <span className="font-mono text-[11px] mr-1.5">[{d.dropped_jahr || "—"}]</span>
                                  {d.dropped_text}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-700/70 dark:text-emerald-400/70 shrink-0 w-20 pt-0.5">
                                  {keptSrc} (bleibt)
                                </span>
                                <span className="flex-1">
                                  <span className="font-mono text-[11px] mr-1.5 text-muted">[{d.kept_jahr || "—"}]</span>
                                  {d.kept_text}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {/* Quellen-Footer */}
      <details className="mt-6 pt-4 border-t border-border group">
        <summary className="cursor-pointer text-xs text-muted hover:text-foreground transition-colors select-none list-none">
          <span className="inline-flex items-center gap-1">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>
            Quellen & Methode
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-xs text-muted leading-relaxed">
          {summary && summaryMeta && (
            <div>
              <strong className="text-foreground/80">Bio-Zusammenfassung:</strong>{" "}
              KI-generiert aus den strukturierten Daten unten.
              {summaryMeta.model && (
                <>
                  {" "}Modell <span className="font-mono">{summaryMeta.model}</span>
                </>
              )}
              {summaryMeta.promptVersion && (
                <>
                  {" "}· Prompt-Version <span className="font-mono">{summaryMeta.promptVersion}</span>
                </>
              )}
              {formatDate(summaryMeta.generatedAt) && (
                <> · generiert {formatDate(summaryMeta.generatedAt)}</>
              )}
            </div>
          )}
          {hasHomepage && (
            <div>
              <strong className="text-foreground/80">Persönliche Homepage:</strong>{" "}
              {homepageUrl ? (
                <a
                  href={homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {homepageUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "URL unbekannt"
              )}
              {" "}· strukturierter Auszug mit Quellenangabe (§ 51 UrhG)
              {homepageMeta?.model && (
                <>
                  {" "}· extrahiert mit{" "}
                  <span className="font-mono">{homepageMeta.model}</span>
                </>
              )}
              {homepageMeta?.promptVersion && (
                <> · <span className="font-mono">{homepageMeta.promptVersion}</span></>
              )}
              {formatDate(homepageMeta?.generatedAt) && (
                <> · {formatDate(homepageMeta?.generatedAt)}</>
              )}
            </div>
          )}
          {hasWikipedia && (
            <div>
              <strong className="text-foreground/80">Wikipedia (deutsch):</strong>{" "}
              {wikipediaUrl ? (
                <a
                  href={wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Artikel
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "Artikel-URL unbekannt"
              )}
              {" "}· CC BY-SA
              {wikipediaMeta?.model && (
                <>
                  {" "}· extrahiert mit{" "}
                  <span className="font-mono">{wikipediaMeta.model}</span>
                </>
              )}
              {wikipediaMeta?.promptVersion && (
                <> · <span className="font-mono">{wikipediaMeta.promptVersion}</span></>
              )}
              {formatDate(wikipediaMeta?.generatedAt) && (
                <> · {formatDate(wikipediaMeta?.generatedAt)}</>
              )}
            </div>
          )}
          {hasAgh && (
            <div>
              <strong className="text-foreground/80">Abgeordnetenhaus Berlin (Profil):</strong>{" "}
              {aghUrl ? (
                <a
                  href={aghUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Profilseite
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "Profil-URL unbekannt"
              )}
              {" "}· amtliche Vita des Berliner Abgeordnetenhauses
              {aghMeta?.model && (
                <>
                  {" "}· extrahiert mit{" "}
                  <span className="font-mono">{aghMeta.model}</span>
                </>
              )}
              {aghMeta?.promptVersion && (
                <> · <span className="font-mono">{aghMeta.promptVersion}</span></>
              )}
              {formatDate(aghMeta?.generatedAt) && (
                <> · {formatDate(aghMeta?.generatedAt)}</>
              )}
            </div>
          )}
          <div className="mt-2 pt-3 border-t border-border">
            <strong className="text-foreground/80">Mehrfach-Verifikation für mehr Verlässlichkeit:</strong>
            <p className="mt-1">
              Jeder strukturierte Eintrag wird aus{" "}
              <strong className="text-foreground/80">
                {sourceCount >= 3
                  ? "bis zu drei unabhängigen Quellen"
                  : "mehreren unabhängigen Quellen"}
              </strong>{" "}
              (Wikipedia, persönliche Homepage{hasAgh ? " und amtliches Abgeordnetenhaus-Profil" : ""})
              erzeugt und anschließend
              mehrfach gegengeprüft: durch unabhängige Modelle{" "}
              <strong className="text-foreground/80">verschiedener Anbieter-Familien</strong>{" "}
              auf Quellen-Konflikte, durch einen separaten Datums-Validierungs-Lauf,
              und bei bestätigten Problemen durch manuelle Kontrolle. Jeder Eintrag
              trägt einen wörtlichen Quellenbeleg.
            </p>
            <p className="mt-2">
              Welche Modelle genau in welchem Schritt — inklusive Versionsständen —
              steht transparent in{" "}
              <a href="/methodik" className="text-primary hover:underline">
                Methodik &amp; Datenquellen
              </a>.
            </p>
          </div>
          <p className="text-[11px] text-muted/80 italic">
            Mehrere Haken (✓✓ / ✓✓✓) markieren Einträge, die in entsprechend vielen
            unabhängigen Quellen vorkommen. Werden trotzdem Erfindungen oder Fehler
            entdeckt, bitte als Korrektur melden.
          </p>
        </div>
      </details>
        </div>
      </details>
    </div>
  );
}
