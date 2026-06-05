import fs from "fs";
import path from "path";
import { getPoliticianDb } from "./db";

/** Index-Eintrag (leicht) — pro Auftritt im Profil. */
export interface MediaAppearanceIndexEntry {
  id: string;
  politician_id: number;
  politician_display: string;
  format: "podcast" | "tv" | "radio" | "youtube";
  publisher: string;
  host?: string;
  title: string;
  episode_label?: string;
  url: string;
  published_at: string;
  duration_label?: string;
  video_id?: string;
  /** Wenn gesetzt: detaillierte Analyse in data/media-analyses/{file} verfügbar. */
  analysis_file?: string;
  /** Phase-1-Manuell: inline topics statt KI-Analyse. */
  topics?: string[];
  context_notes?: string;
  source_provenance?: string;
}

interface MediaAppearancesFile {
  _meta: Record<string, unknown>;
  appearances: MediaAppearanceIndexEntry[];
}

/** Detail-Analyse — die volle Pipeline-Ausgabe. */
export interface MediaAppearanceDetail {
  _meta: {
    url: string;
    video_id: string;
    politician: string;
    host: string;
    publisher: string;
    transcript_sha: string;
    transcript_chars: number;
    caption_lines: number;
    model: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    quote_validation: { valid_exact: number; valid_fuzzy: number; invalid: number; valid_pct: string };
    answer_type_distribution: Record<string, number>;
    generated_at: string;
    duration_seconds: number;
  };
  _methodology: {
    transcript_source: string;
    transcript_caveat: string;
    classification_caveat: string;
    ui_display_hint: string;
    methodology_version: string;
  };
  analysis: {
    overall_summary: string;
    themes: Array<{
      title: string;
      timestamp_range: string;
      theme_description: string;
      position: string;
      quotes: Array<{ text: string; timestamp: string; context?: string }>;
      concrete_statements?: string[];
      related_bundestag_topics?: string[];
      answer_type: string;
      // Schema-Reform-Felder (in alten Analysen nicht vorhanden, in neuen Pflicht):
      question_asked?: string;
      question_intent?: string;
      answer_match?: string;
      match_reasoning?: string;
      deflection_target?: string;
      evasion_note?: string;
    }>;
    factual_claims_to_verify: Array<{ claim: string; timestamp: string }>;
  };
}

let indexCache: MediaAppearancesFile | null = null;
let indexCacheMtimeMs = -1;
const detailCache = new Map<string, MediaAppearanceDetail>();

function loadIndex(): MediaAppearancesFile {
  const file = path.join(process.cwd(), "data", "media-appearances.json");
  // mtime-Gate: Daten-Updates an media-appearances.json leben ohne Service-Neustart.
  // (force-dynamic rendert pro Request, aber der Modul-Cache überlebte sonst prozesslang.)
  let mtimeMs = -1;
  try { mtimeMs = fs.statSync(file).mtimeMs; } catch { /* Datei fehlt → unten leer */ }
  if (indexCache && mtimeMs === indexCacheMtimeMs) return indexCache;
  try {
    indexCache = JSON.parse(fs.readFileSync(file, "utf-8")) as MediaAppearancesFile;
  } catch {
    indexCache = { _meta: {}, appearances: [] };
  }
  indexCacheMtimeMs = mtimeMs;
  return indexCache;
}

/**
 * Auftritte mit Analyse, deren Politiker:in ein SICHTBARES Profil hat (also verlinkbar
 * ist). Talkshow-Gäste aus Landtagen/EU/ohne Mandat werden gegen den 18-Parlamente-Pool
 * gematcht, haben aber auf der Bundestag-Seite keine Profilseite — ihre Cards wären
 * textlos und ihre Detail-Links würden 404en. Strip + /medien nutzen daher diese Quelle.
 * Die Analyse-Dateien bleiben auf Platte; tauchen automatisch auf, falls je ein Profil
 * existiert.
 */
export function getVisibleAppearances(): MediaAppearanceIndexEntry[] {
  return loadIndex().appearances.filter(
    (a) => a.analysis_file && getPoliticianDb(a.politician_id)
  );
}

export function getMediaAppearancesForPolitician(politicianId: number): MediaAppearanceIndexEntry[] {
  return loadIndex().appearances
    .filter((a) => a.politician_id === politicianId)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
}

export function getMediaAppearanceById(id: string): MediaAppearanceIndexEntry | null {
  return loadIndex().appearances.find((a) => a.id === id) ?? null;
}

export function getMediaAppearanceDetail(id: string): MediaAppearanceDetail | null {
  const entry = getMediaAppearanceById(id);
  if (!entry?.analysis_file) return null;
  if (detailCache.has(id)) return detailCache.get(id)!;
  const file = path.join(process.cwd(), "data", "media-analyses", entry.analysis_file);
  try {
    const detail = JSON.parse(fs.readFileSync(file, "utf-8")) as MediaAppearanceDetail;
    // Defensiv: LLM-Array-Drift (ein Feld kommt als String statt Array) darf NIE die
    // Seite crashen (.map). Array-Felder hart auf Arrays normalisieren — ein nicht
    // reparierbares Feld degradiert zu [] statt 500.
    const asArr = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
    const a: any = detail.analysis ?? {};
    a.themes = asArr<any>(a.themes).map((t: any) => ({
      ...t,
      quotes: asArr(t?.quotes),
      concrete_statements: asArr(t?.concrete_statements),
      related_bundestag_topics: asArr(t?.related_bundestag_topics),
    }));
    a.factual_claims_to_verify = asArr(a.factual_claims_to_verify);
    detail.analysis = a;
    detailCache.set(id, detail);
    return detail;
  } catch {
    return null;
  }
}

/** Aggregierte Stats für die kompakte Profil-Karte. */
export interface MediaAppearanceStats {
  themesTotal: number;
  themesSubstantielle: number;
  themesAusweichend: number;
  factualClaims: number;
  topThemes: string[];
}

export function getMediaAppearanceStats(id: string): MediaAppearanceStats | null {
  const detail = getMediaAppearanceDetail(id);
  if (!detail) return null;
  const themes = detail.analysis.themes ?? [];
  const factualClaims = detail.analysis.factual_claims_to_verify ?? [];
  return {
    themesTotal: themes.length,
    themesSubstantielle: themes.filter((t) => t.answer_type === "substantielle_position").length,
    themesAusweichend: themes.filter((t) => t.answer_type !== "substantielle_position").length,
    factualClaims: factualClaims.length,
    topThemes: themes.slice(0, 6).map((t) => t.title),
  };
}

// Client-safe helpers (ANSWER_TYPE_META, ANSWER_MATCH_META, youtubeUrlWithTimestamp, timestampToSeconds)
// leben in media-appearances-shared.ts — werden von Client-Components benötigt
// und können dort kein fs/path importieren. Re-Export für Server-Side-Convenience:
export { ANSWER_TYPE_META, ANSWER_MATCH_META, timestampToSeconds, youtubeUrlWithTimestamp } from "./media-appearances-shared";
