import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS parliaments (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      label_external TEXT,
      type TEXT NOT NULL DEFAULT 'landtag',
      api_url TEXT
    );

    CREATE TABLE IF NOT EXISTS parliament_periods (
      id INTEGER PRIMARY KEY,
      parliament_id INTEGER NOT NULL REFERENCES parliaments(id),
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'legislature',
      start_date TEXT,
      end_date TEXT,
      api_url TEXT
    );

    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS politicians (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      title TEXT,
      sex TEXT,
      year_of_birth INTEGER,
      education TEXT,
      occupation TEXT,
      residence TEXT,
      photo_url TEXT,
      party_id INTEGER REFERENCES parties(id),
      abgeordnetenwatch_url TEXT,
      api_url TEXT
    );

    CREATE TABLE IF NOT EXISTS mandates (
      id INTEGER PRIMARY KEY,
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      parliament_period_id INTEGER NOT NULL REFERENCES parliament_periods(id),
      label TEXT,
      type TEXT,
      start_date TEXT,
      end_date TEXT,
      constituency TEXT,
      list_position INTEGER,
      mandate_won TEXT,
      fraction TEXT,
      fraction_role TEXT,
      api_url TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_mandates_politician ON mandates(politician_id);
    CREATE INDEX IF NOT EXISTS idx_mandates_period ON mandates(parliament_period_id);
    CREATE INDEX IF NOT EXISTS idx_politicians_party ON politicians(party_id);
    CREATE INDEX IF NOT EXISTS idx_politicians_name ON politicians(last_name, first_name);

    -- Votes (from Abgeordnetenwatch API)
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL REFERENCES mandates(id),
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      poll_id INTEGER NOT NULL,
      poll_label TEXT,
      poll_url TEXT,
      poll_date TEXT,
      vote TEXT NOT NULL,
      reason_no_show TEXT,
      fraction_id INTEGER,
      fraction_label TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_votes_politician ON votes(politician_id);
    CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);

    -- Sidejobs (from Abgeordnetenwatch API)
    CREATE TABLE IF NOT EXISTS sidejobs (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL REFERENCES mandates(id),
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      label TEXT NOT NULL,
      income_level TEXT,
      income INTEGER,
      income_total INTEGER,
      interval TEXT,
      created INTEGER,
      organization TEXT,
      additional_information TEXT,
      category TEXT,
      data_change_date TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sidejobs_politician ON sidejobs(politician_id);

    -- Committee Memberships (from Abgeordnetenwatch API)
    CREATE TABLE IF NOT EXISTS committee_memberships (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL REFERENCES mandates(id),
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      committee_id INTEGER NOT NULL,
      committee_label TEXT NOT NULL,
      committee_role TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_committee_memberships_politician ON committee_memberships(politician_id);
  `);

  return db;
}

// ── Sichtbarkeits-Filter ──
//
// Aktuell zeigen wir nur Bundestags-MdBs + Quereinsteiger-Minister im Kabinett
// (id >= 900000). Landtage und EU-Parlament sind in der DB enthalten, aber bis
// auf weiteres ausgeblendet — sie werden später aktiviert.
//
// Um sie wieder anzuzeigen, einfach VISIBLE_TYPES erweitern oder den Filter
// abschalten (siehe IS_POLITICIAN_VISIBLE_SQL).
export const VISIBLE_PARLIAMENT_TYPES: readonly string[] = ["bundestag"];

/**
 * Loose Visibility — für DETAIL-Seiten und Speaker-/Vote-Auflösung.
 * Erlaubt auch ehemalige MdBs (z. B. Habeck nach Niederlegung): wer einmal Daten
 * in der DB hat, behält ein Profil.
 *
 * Politiker:in ist sichtbar wenn:
 *   - id >= 900000 mit nicht-Land-Amt (Bundes-Quereinsteiger oder Stammdaten-MdB), ODER
 *   - irgendein historisches Bundestags-Mandat existiert.
 *
 * Land-Minister:innen (amt LIKE 'Land:%', z. B. Eder/RLP) bleiben grundsätzlich
 * gefiltert — sie sind über die Bundesrats-Stammdaten reingerutscht, ihre
 * Bundesrats-Reden bleiben über speaker-Match auflösbar.
 */
export const IS_POLITICIAN_VISIBLE_SQL = `(
  (p.id >= 900000 AND (p.amt IS NULL OR p.amt NOT LIKE 'Land:%'))
  OR EXISTS (
    SELECT 1 FROM mandates m_vis
    JOIN parliament_periods pp_vis ON m_vis.parliament_period_id = pp_vis.id
    JOIN parliaments par_vis ON pp_vis.parliament_id = par_vis.id
    WHERE m_vis.politician_id = p.id AND m_vis.type = 'mandate'
      AND par_vis.type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})
  )
)`;

/**
 * Strict Active — für LISTEN, COUNTS, FILTER-Dropdowns.
 * Nur aktuell aktive Politiker:innen — verstorbene/ausgeschiedene MdBs raus.
 *
 * Politiker:in ist aktiv wenn:
 *   - id >= 900000 mit Bundes-Amt (Bundesminister:in, immer aktiv solange amt gesetzt), ODER
 *   - id >= 900000 ohne Amt mit gueltig_bis NULL/leer/zukünftig (aktiver Stammdaten-MdB), ODER
 *   - mindestens ein Bundestags-Mandat mit end_date NULL/leer/zukünftig.
 *
 * Damit:
 *   - Reiche/Prien/Wildberger/Weimer/Hubig → sichtbar (Bundesminister mit amt)
 *   - Stein/Mandrella → sichtbar (aktive MdBs ohne abgeordnetenwatch-Eintrag)
 *   - Habeck/Baerbock/Otte/Foullong → ausgeblendet (gueltig_bis in Vergangenheit)
 *   - Träger ✝ → ausgeblendet (Mandat hat end_date in Vergangenheit)
 */
export const IS_POLITICIAN_ACTIVE_SQL = `(
  (p.id >= 900000
    AND (p.amt IS NULL OR p.amt NOT LIKE 'Land:%')
    AND (
      (p.amt IS NOT NULL AND p.amt != '')
      OR (p.gueltig_bis IS NULL OR p.gueltig_bis = '' OR p.gueltig_bis > date('now'))
    )
  )
  OR EXISTS (
    SELECT 1 FROM mandates m_act
    JOIN parliament_periods pp_act ON m_act.parliament_period_id = pp_act.id
    JOIN parliaments par_act ON pp_act.parliament_id = par_act.id
    WHERE m_act.politician_id = p.id AND m_act.type = 'mandate'
      AND par_act.type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})
      AND (m_act.end_date IS NULL OR m_act.end_date = '' OR m_act.end_date > date('now'))
  )
)`;

/** Werte für die Platzhalter in IS_POLITICIAN_VISIBLE_SQL und IS_POLITICIAN_ACTIVE_SQL. */
export const VISIBLE_PARLIAMENT_TYPE_VALUES = [...VISIBLE_PARLIAMENT_TYPES];

/**
 * Filter für „low-content" Llama-Zusammenfassungen — Phrasen, die der LLM
 * ausgibt wenn er keine sinnvolle Aussage extrahieren konnte. NULL-Zeilen
 * werden durchgelassen (für Sitzungen > 64 ist `zusammenfassung` NULL und
 * v2.1-Daten greifen). Wird sowohl beim Count (Speaker-Übersicht) als auch
 * beim Detail-Rendering angewendet, damit beide Pages die gleiche Zahl zeigen.
 */
export const SPEECH_SUMMARY_QUALITY_FILTER_SQL = `(
  zusammenfassung IS NULL
  OR (
    zusammenfassung NOT LIKE '%lediglich%'
    AND zusammenfassung NOT LIKE '%nicht möglich%'
    AND zusammenfassung NOT LIKE '%nicht zu entnehmen%'
    AND zusammenfassung NOT LIKE '%nicht erkennbar%'
    AND zusammenfassung NOT LIKE '%nicht feststellbar%'
    AND zusammenfassung NOT LIKE '%nicht ableitbar%'
    AND zusammenfassung NOT LIKE '%keine inhaltliche%'
  )
)`;

// ── Query helpers ──

export interface PoliticianRow {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  sex: string | null;
  year_of_birth: number | null;
  education: string | null;
  occupation: string | null;
  residence: string | null;
  photo_url: string | null;
  photo_source: string | null;
  photo_attribution: string | null;
  photo_author: string | null;
  photo_license: string | null;
  photo_license_url: string | null;
  party_id: number | null;
  party_label: string | null;
  abgeordnetenwatch_url: string | null;
  qid_wikidata: string | null;
  homepage_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  facebook_handle: string | null;
  tiktok_handle: string | null;
  bio_summary: string | null;
  bio_url: string | null;
  bio_source: string | null;
  bundestag_bio_url: string | null;
  bundesregierung_bio_url: string | null;
  cv_json: string | null;
  cv_json_dedup: string | null;
  cv_source: string | null;
  cv_generated_at: string | null;
  cv_homepage_json: string | null;
  cv_homepage_json_dedup: string | null;
  cv_homepage_url: string | null;
  cv_homepage_text: string | null;
  cv_homepage_generated_at: string | null;
  cv_dedup_at: string | null;
  cv_summary: string | null;
  cv_summary_generated_at: string | null;
  cv_model: string | null;
  cv_prompt_version: string | null;
  cv_homepage_model: string | null;
  cv_homepage_prompt_version: string | null;
  cv_summary_model: string | null;
  cv_summary_prompt_version: string | null;
  homepage_source: string | null;
  source_conflicts: string | null;
  source_coherence_checked_at: string | null;
  // Stammdaten-Felder (für Quereinsteiger-Bundesminister:innen + Stammdaten-MdBs, id ≥ 900000)
  rolle: string | null;
  amt: string | null;
  gueltig_ab: string | null;
  gueltig_bis: string | null;
  bt_redner_id: string | null;
}

export interface MandateRow {
  id: number;
  politician_id: number;
  parliament_period_id: number;
  period_label: string;
  parliament_label: string;
  parliament_type: string;
  label: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  constituency: string | null;
  fraction: string | null;
}

export interface DataFreshness {
  plenarsitzungen: string | null;
  abstimmungen: string | null;
  aktivitaeten: string | null;
  drucksachen_analyse: string | null;
  reden_analyse: string | null;
}

export function getDataFreshness(): DataFreshness {
  const db = getDb();
  const q = (sql: string): string | null => {
    try {
      const r = db.prepare(sql).get() as { x: string | null };
      return r?.x ?? null;
    } catch {
      return null;
    }
  };
  return {
    plenarsitzungen: q(`SELECT MAX(datum) AS x FROM plenar_sessions`),
    abstimmungen: q(`SELECT MAX(poll_date) AS x FROM votes`),
    aktivitaeten: q(`SELECT MAX(datum) AS x FROM activities`),
    drucksachen_analyse: q(`SELECT MAX(generated_at) AS x FROM drucksache_analyses`),
    reden_analyse: q(`SELECT MAX(created_at) AS x FROM speech_analyses_v2`),
  };
}

export function searchPoliticiansDb(query: string, limit = 30): PoliticianRow[] {
  const db = getDb();
  const term = `%${query}%`;
  return db
    .prepare(
      `SELECT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE (p.last_name LIKE ? OR p.first_name LIKE ?
         OR (p.first_name || ' ' || p.last_name) LIKE ?)
         AND ${IS_POLITICIAN_ACTIVE_SQL}
       ORDER BY p.last_name, p.first_name
       LIMIT ?`
    )
    .all(term, term, term, ...VISIBLE_PARLIAMENT_TYPE_VALUES, limit) as PoliticianRow[];
}

export function getPoliticianDb(id: number): PoliticianRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE p.id = ? AND ${IS_POLITICIAN_VISIBLE_SQL}`
    )
    .get(id, ...VISIBLE_PARLIAMENT_TYPE_VALUES) as PoliticianRow | undefined;
}

export function getMandatesForPoliticianDb(politicianId: number): MandateRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT m.*, pp.label as period_label, par.label as parliament_label, par.type as parliament_type
       FROM mandates m
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE m.politician_id = ?
       ORDER BY pp.start_date DESC`
    )
    .all(politicianId) as MandateRow[];
}

export function getPoliticiansByParliament(parliamentId: number, periodId?: number): PoliticianRow[] {
  const db = getDb();
  const sql = periodId
    ? `SELECT DISTINCT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       JOIN mandates m ON m.politician_id = p.id
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ? AND pp.id = ? AND m.type = 'mandate'
       ORDER BY p.last_name, p.first_name`
    : `SELECT DISTINCT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       JOIN mandates m ON m.politician_id = p.id
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ? AND m.type = 'mandate'
       ORDER BY p.last_name, p.first_name`;
  return (periodId ? db.prepare(sql).all(parliamentId, periodId) : db.prepare(sql).all(parliamentId)) as PoliticianRow[];
}

export function getDbStats(): {
  politicians: number;
  mdbs: number;
  cabinetQuereinsteiger: number;
  mandates: number;
  parliaments: number;
  parties: number;
} {
  const db = getDb();
  const polCount = db.prepare(
    `SELECT COUNT(*) as c FROM politicians p WHERE ${IS_POLITICIAN_ACTIVE_SQL}`
  ).get(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { c: number };

  // Aktive MdBs = Politiker:innen mit aktivem Bundestags-Mandat
  const mdbCount = (db.prepare(
    `SELECT COUNT(DISTINCT m.politician_id) as c FROM mandates m
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     JOIN parliaments par ON pp.parliament_id = par.id
     WHERE par.type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})
       AND m.type = 'mandate'
       AND (m.end_date IS NULL OR m.end_date = '' OR m.end_date > date('now'))`
  ).get(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { c: number }).c;

  // Quereinsteiger-Bundesminister:innen = Bundeskabinettsmitglieder OHNE
  // Bundestagsmandat. GEZIELT zählen (rolle = Bundes-/Staatsminister, amt
  // gesetzt & kein 'Land:%', kein aktives Mandat) — NICHT als Differenz
  // politicians − mdbs: in dieser Differenz steckten sonst auch
  // Staatssekretär:innen, Regierungssprecher, Botschafter und Stammdaten-MdBs
  // ohne mandates-Zeile (→ Bug: zeigte 26 statt 5).
  const cabinetQuereinsteiger = (db.prepare(
    `SELECT COUNT(*) as c FROM politicians p
     WHERE p.id >= 900000
       AND p.rolle IN ('Bundesminister', 'Staatsminister')
       AND p.amt IS NOT NULL AND p.amt != '' AND p.amt NOT LIKE 'Land:%'
       AND NOT EXISTS (
         SELECT 1 FROM mandates m
         JOIN parliament_periods pp ON m.parliament_period_id = pp.id
         JOIN parliaments par ON pp.parliament_id = par.id
         WHERE m.politician_id = p.id AND m.type = 'mandate'
           AND par.type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})
           AND (m.end_date IS NULL OR m.end_date = '' OR m.end_date > date('now'))
       )`
  ).get(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { c: number }).c;

  return {
    politicians: polCount.c,
    mdbs: mdbCount,
    cabinetQuereinsteiger,
    mandates: (db.prepare(
      `SELECT COUNT(*) as c FROM mandates m
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE par.type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})
         AND m.type = 'mandate'
         AND (m.end_date IS NULL OR m.end_date = '' OR m.end_date > date('now'))`
    ).get(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { c: number }).c,
    parliaments: VISIBLE_PARLIAMENT_TYPES.length,
    parties: (db.prepare(
      `SELECT COUNT(DISTINCT pa.id) as c FROM parties pa
       JOIN politicians p ON p.party_id = pa.id
       WHERE ${IS_POLITICIAN_ACTIVE_SQL}`
    ).get(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { c: number }).c,
  };
}

export interface LatestActivityHighlights {
  latestSession: { wahlperiode: number; sitzung: number; datum: string; speechCount: number } | null;
  latestPoll: { pollId: number; label: string; date: string; yes: number; no: number; yesRatio: number } | null;
  latestDrucksache: { drucksacheNr: string; thema: string; datum: string } | null;
}

export function getLatestActivityHighlights(): LatestActivityHighlights {
  const db = getDb();

  const session = db.prepare(
    `SELECT id, wahlperiode, sitzung, datum FROM plenar_sessions
     WHERE datum IS NOT NULL AND datum != ''
     ORDER BY datum DESC LIMIT 1`
  ).get() as { id: number; wahlperiode: number; sitzung: number; datum: string } | undefined;

  const speechCount = session
    ? (db.prepare(
        `SELECT COUNT(DISTINCT rede_id) AS c FROM plenar_speeches WHERE session_id = ?`
      ).get(session.id) as { c: number }).c
    : 0;

  const poll = db.prepare(
    `SELECT poll_id, poll_label, poll_date,
       SUM(CASE WHEN vote = 'yes' THEN 1 ELSE 0 END) AS yes,
       SUM(CASE WHEN vote = 'no' THEN 1 ELSE 0 END) AS no
     FROM votes
     WHERE poll_label IS NOT NULL AND poll_date IS NOT NULL AND poll_date != ''
     GROUP BY poll_id, poll_label, poll_date
     ORDER BY poll_date DESC, poll_id DESC LIMIT 1`
  ).get() as { poll_id: number; poll_label: string; poll_date: string; yes: number; no: number } | undefined;

  const drucksache = db.prepare(
    `SELECT a.drucksache_nr, MIN(a.thema) AS thema, MAX(a.datum) AS datum
     FROM activities a
     WHERE a.drucksache_nr IS NOT NULL AND a.drucksache_nr != ''
       AND a.thema IS NOT NULL AND a.thema != ''
       AND a.datum IS NOT NULL AND a.datum != ''
     GROUP BY a.drucksache_nr
     ORDER BY MAX(a.datum) DESC LIMIT 1`
  ).get() as { drucksache_nr: string; thema: string; datum: string } | undefined;

  return {
    latestSession: session
      ? { wahlperiode: session.wahlperiode, sitzung: session.sitzung, datum: session.datum, speechCount }
      : null,
    latestPoll: poll
      ? {
          pollId: poll.poll_id,
          label: poll.poll_label,
          date: poll.poll_date,
          yes: poll.yes,
          no: poll.no,
          yesRatio: poll.yes + poll.no > 0 ? poll.yes / (poll.yes + poll.no) : 0,
        }
      : null,
    latestDrucksache: drucksache
      ? { drucksacheNr: drucksache.drucksache_nr, thema: drucksache.thema, datum: drucksache.datum }
      : null,
  };
}

export function getLlmPipelineCounts(): {
  cvSummaries: number;
  speechAnalyses: number;
  drucksacheAnalyses: number;
} {
  const db = getDb();
  return {
    cvSummaries: (db.prepare(
      `SELECT COUNT(*) AS c FROM politicians
       WHERE cv_summary IS NOT NULL AND cv_summary != ''`
    ).get() as { c: number }).c,
    speechAnalyses: (db.prepare(
      `SELECT COUNT(DISTINCT rede_id) AS c FROM speech_analyses_v2`
    ).get() as { c: number }).c,
    drucksacheAnalyses: (db.prepare(
      `SELECT COUNT(*) AS c FROM drucksache_analyses WHERE analyze_error IS NULL`
    ).get() as { c: number }).c,
  };
}

export interface MethodikCounts {
  mdbsCvJson: number;
  mdbsCvHomepage: number;
  mdbsCvSummary: number;
  cvStatementsTotal: number;
  sourceCoherenceChecked: number;
  /** ECHT-Konflikte, die nach manueller Verifikation tatsächlich ins
   *  Frontend (politicians.source_conflicts) übernommen wurden. Kleiner
   *  als die Pipeline-Rohzahl (final-verdicts-jsonl) — nur belastbare
   *  Fälle werden gemergt. */
  sourceCoherenceEcht: number;
  plenarSpeechesCount: number;
  speechSegments: number;
  speechDistinctReden: number;
  quoteValidCount: number;
  quoteTotalCount: number;
  redenWithVerifiedQuote: number;
  biasCorrectionsTotal: number;
  biasCorrectionsApplied: number;
  tonalitatsDriftRepaired: number;
  pollsCount: number;
  drucksacheAnalyses: number;
  bundestagAuditPagesCount: number;
  drucksachePollsCount: number;
  sonstigesDrops: number;
  sonstigesFixes: number;
  speechTypeCounts: { typ: string; count: number }[];
}

export function getMethodikCounts(): MethodikCounts {
  const db = getDb();
  const one = (sql: string, ...params: unknown[]) =>
    (db.prepare(sql).get(...params) as { c: number } | undefined)?.c ?? 0;

  const speechTypeRaw = db.prepare(
    `SELECT LOWER(TRIM(typ)) AS typ, COUNT(*) AS c FROM speech_summaries
     WHERE typ IS NOT NULL AND typ != ''
     GROUP BY LOWER(TRIM(typ))`
  ).all() as { typ: string; c: number }[];

  // Merge legacy spellings (erklärung → erklaerung, Rede → debatte, etc.)
  const normalize = (t: string): string => {
    const x = t.toLowerCase();
    if (x === "erklärung" || x === "erklaerung") return "erklaerung";
    if (x === "regierungserklärung" || x === "regierungserklaerung") return "regierungserklaerung";
    if (x === "kurzintervention") return "zwischenfrage_kurzintervention";
    if (x === "zwischenfrage") return "zwischenfrage_kurzintervention";
    if (x === "rede" || x === "debatte") return "debatte";
    return x;
  };
  const merged = new Map<string, number>();
  for (const row of speechTypeRaw) merged.set(normalize(row.typ), (merged.get(normalize(row.typ)) ?? 0) + row.c);
  const speechTypeCounts = [...merged.entries()]
    .map(([typ, count]) => ({ typ, count }))
    .sort((a, b) => b.count - a.count);

  return {
    mdbsCvJson: one(`SELECT COUNT(*) AS c FROM politicians WHERE cv_json IS NOT NULL AND cv_json != ''`),
    mdbsCvHomepage: one(`SELECT COUNT(*) AS c FROM politicians WHERE cv_homepage_json IS NOT NULL AND cv_homepage_json != ''`),
    mdbsCvSummary: one(`SELECT COUNT(*) AS c FROM politicians WHERE cv_summary IS NOT NULL AND cv_summary != ''`),
    cvStatementsTotal: one(
      // CASE WHEN/json_type schützt vor cv_json-Rows, deren CV-Sektion als String
      // statt Array gespeichert ist (~15 Rows aus der Berlin-Pipeline) — sonst wirft
      // json_array_length "malformed JSON" und der Prod-Build crasht.
      `SELECT SUM(
         CASE WHEN json_type(cv_json, '$.ausbildung') = 'array'
              THEN json_array_length(json_extract(cv_json, '$.ausbildung')) ELSE 0 END
         + CASE WHEN json_type(cv_json, '$.beruflicher_werdegang') = 'array'
                THEN json_array_length(json_extract(cv_json, '$.beruflicher_werdegang')) ELSE 0 END
         + CASE WHEN json_type(cv_json, '$.politische_stationen') = 'array'
                THEN json_array_length(json_extract(cv_json, '$.politische_stationen')) ELSE 0 END
         + CASE WHEN json_type(cv_json, '$.sonstiges') = 'array'
                THEN json_array_length(json_extract(cv_json, '$.sonstiges')) ELSE 0 END
       ) AS c FROM politicians WHERE cv_json IS NOT NULL`
    ),
    sourceCoherenceChecked: one(`SELECT COUNT(*) AS c FROM politicians WHERE source_coherence_checked_at IS NOT NULL`),
    sourceCoherenceEcht: one(
      `SELECT COUNT(*) AS c FROM politicians p, JSON_EACH(p.source_conflicts)
       WHERE p.source_conflicts IS NOT NULL
         AND JSON_EXTRACT(value, '$.final_verdict') = 'ECHT'`
    ),
    plenarSpeechesCount: one(`SELECT COUNT(DISTINCT rede_id) AS c FROM plenar_speeches WHERE rede_id IS NOT NULL`),
    speechSegments: one(`SELECT COUNT(*) AS c FROM speech_analyses_v2`),
    speechDistinctReden: one(`SELECT COUNT(DISTINCT rede_id) AS c FROM speech_analyses_v2`),
    quoteValidCount: one(`SELECT COALESCE(SUM(quote_valid_count), 0) AS c FROM speech_analyses_v2`),
    quoteTotalCount: one(`SELECT COALESCE(SUM(quote_total_count), 0) AS c FROM speech_analyses_v2`),
    redenWithVerifiedQuote: one(
      `SELECT COUNT(DISTINCT rede_id) AS c FROM speech_analyses_v2 WHERE quote_valid_count > 0`
    ),
    biasCorrectionsTotal: one(`SELECT COUNT(*) AS c FROM speech_analyses_v2_corrections`),
    biasCorrectionsApplied: one(
      `SELECT COUNT(*) AS c FROM speech_analyses_v2_corrections WHERE zusammenfassung_2_saetze_final IS NOT NULL`
    ),
    tonalitatsDriftRepaired: one(`SELECT COUNT(*) AS c FROM speech_analyses_v2 WHERE tonalitaet_original IS NOT NULL`),
    pollsCount: one(`SELECT COUNT(DISTINCT poll_id) AS c FROM votes WHERE poll_id IS NOT NULL`),
    drucksacheAnalyses: one(`SELECT COUNT(*) AS c FROM drucksache_analyses WHERE analyze_error IS NULL`),
    bundestagAuditPagesCount: one(`SELECT COUNT(*) AS c FROM audit_bundestag_polls`),
    drucksachePollsCount: one(`SELECT COUNT(*) AS c FROM drucksache_polls`),
    sonstigesDrops: one(
      `SELECT COUNT(*) AS c FROM cv_repair_log WHERE repair_version = 'homepage-sonstiges-cleanup-v1' AND action = 'drop_text'`
    ),
    sonstigesFixes: one(
      `SELECT COUNT(*) AS c FROM cv_repair_log WHERE repair_version = 'homepage-sonstiges-cleanup-v1' AND action = 'set_text'`
    ),
    speechTypeCounts,
  };
}

export interface SourceCoherenceStats {
  checked: number;
  politiciansWithEchtConflicts: number;
  totalEchtConflicts: number;
}

export interface SourceCoherenceConflictRow {
  politicianId: number;
  firstName: string;
  lastName: string;
  party: string | null;
  conflicts: Array<{
    section: string;
    jahr: string;
    wikipedia: string;
    homepage: string;
    final_reason: string;
  }>;
}

export function listSourceCoherenceConflicts(): SourceCoherenceConflictRow[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT p.id, p.first_name, p.last_name, parties.label AS party, p.source_conflicts
     FROM politicians p
     LEFT JOIN parties ON parties.id = p.party_id
     WHERE p.source_conflicts IS NOT NULL AND p.source_conflicts != '[]'
     ORDER BY p.last_name, p.first_name`
  ).all() as Array<{ id: number; first_name: string; last_name: string; party: string | null; source_conflicts: string }>;

  const result: SourceCoherenceConflictRow[] = [];
  for (const r of rows) {
    const all = JSON.parse(r.source_conflicts) as Array<Record<string, any>>;
    const echt = all.filter(c => c.final_verdict === "ECHT");
    if (echt.length === 0) continue;
    result.push({
      politicianId: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      party: r.party,
      conflicts: echt.map(c => ({
        section: c.section,
        jahr: c.jahr,
        wikipedia: c.wikipedia,
        homepage: c.homepage,
        final_reason: c.final_reason ?? c.reason,
      })),
    });
  }
  return result;
}

export function getSourceCoherenceStats(): SourceCoherenceStats {
  const db = getDb();
  const checked = (db.prepare(
    `SELECT COUNT(*) as c FROM politicians WHERE source_coherence_checked_at IS NOT NULL`
  ).get() as { c: number }).c;
  const echtRow = db.prepare(
    `SELECT COUNT(DISTINCT p.id) AS politicians, COUNT(*) AS conflicts
     FROM politicians p, JSON_EACH(p.source_conflicts)
     WHERE p.source_conflicts IS NOT NULL
       AND JSON_EXTRACT(value, '$.final_verdict') = 'ECHT'`
  ).get() as { politicians: number; conflicts: number };
  return {
    checked,
    politiciansWithEchtConflicts: echtRow.politicians,
    totalEchtConflicts: echtRow.conflicts,
  };
}

// ── For Politiker-Tabelle ──

export interface PoliticianListRow extends PoliticianRow {
  parliament_label: string | null;
  parliament_type: string | null;
  fraction: string | null;
  constituency: string | null;
  activity_count: number;
}

export interface ListParams {
  query?: string;
  parliamentId?: number;
  partyId?: number;
  limit?: number;
  offset?: number;
}

export function listPoliticians(params: ListParams): { rows: PoliticianListRow[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.query) {
    conditions.push(`(p.last_name LIKE ? OR p.first_name LIKE ? OR (p.first_name || ' ' || p.last_name) LIKE ?)`);
    const term = `%${params.query}%`;
    args.push(term, term, term);
  }
  if (params.parliamentId) {
    conditions.push(`par.id = ?`);
    args.push(params.parliamentId);
  }
  if (params.partyId) {
    conditions.push(`p.party_id = ?`);
    args.push(params.partyId);
  }

  // Aktiv-Filter (nicht ausgeschieden, nicht verstorben) zusätzlich zu User-Filtern
  conditions.push(IS_POLITICIAN_ACTIVE_SQL);
  args.push(...VISIBLE_PARLIAMENT_TYPE_VALUES);

  const where = `WHERE ${conditions.join(" AND ")}`;
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  // Pro Politiker:in nur das aktive Mandat eines sichtbaren Parlament-Typs anzeigen
  // (sonst erscheinen MdBs mit zusätzlichen Landtags-Mandaten doppelt — siehe
  // Carsten Becker: Bundestag + Saarland). end_date-Filter blendet beendete
  // Mandate aus (z. B. ✝ Träger).
  const visibleTypesPlaceholders = VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ");
  const visibleMandateJoin = `
    LEFT JOIN (
      SELECT m_v.politician_id, m_v.fraction, m_v.constituency,
             par_v.id AS parliament_id, par_v.label AS parliament_label, par_v.type AS parliament_type
      FROM mandates m_v
      JOIN parliament_periods pp_v ON m_v.parliament_period_id = pp_v.id
      JOIN parliaments par_v ON pp_v.parliament_id = par_v.id
      WHERE m_v.type = 'mandate' AND par_v.type IN (${visibleTypesPlaceholders})
        AND (m_v.end_date IS NULL OR m_v.end_date = '' OR m_v.end_date > date('now'))
      GROUP BY m_v.politician_id
    ) vm ON vm.politician_id = p.id
  `;

  const countSql = `
    SELECT COUNT(DISTINCT p.id) as c
    FROM politicians p
    LEFT JOIN parties pa ON p.party_id = pa.id
    ${visibleMandateJoin}
    ${where.replace(/\bm\.fraction\b/g, "vm.fraction").replace(/\bpar\.id\b/g, "vm.parliament_id")}
  `;
  const total = (db.prepare(countSql).get(...VISIBLE_PARLIAMENT_TYPE_VALUES, ...args) as { c: number }).c;

  const dataSql = `
    SELECT p.*, pa.label as party_label,
      vm.parliament_label, vm.parliament_type,
      vm.fraction, vm.constituency,
      (SELECT COUNT(*) FROM activities act WHERE act.politician_id = p.id) as activity_count
    FROM politicians p
    LEFT JOIN parties pa ON p.party_id = pa.id
    ${visibleMandateJoin}
    ${where.replace(/\bm\.fraction\b/g, "vm.fraction").replace(/\bpar\.id\b/g, "vm.parliament_id")}
    ORDER BY p.last_name, p.first_name
    LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(dataSql).all(...VISIBLE_PARLIAMENT_TYPE_VALUES, ...args, limit, offset) as PoliticianListRow[];

  return { rows, total };
}

export function getAllParliaments(): { id: number; label: string; type: string }[] {
  const db = getDb();
  return db.prepare(
    `SELECT id, label, type FROM parliaments
     WHERE type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})
     ORDER BY type, label`
  ).all(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { id: number; label: string; type: string }[];
}

export function getAllParties(): { id: number; label: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT pa.id, pa.label, COUNT(DISTINCT p.id) as count
       FROM parties pa
       JOIN politicians p ON p.party_id = pa.id
       WHERE ${IS_POLITICIAN_ACTIVE_SQL}
       GROUP BY pa.id
       ORDER BY count DESC`
    )
    .all(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { id: number; label: string; count: number }[];
}

// ── Activities ──

export interface ActivityRow {
  id: string;
  politician_id: number | null;
  aktivitaetsart: string;
  typ: string | null;
  wahlperiode: number | null;
  titel: string;
  thema: string | null;
  datum: string | null;
  dokumentart: string | null;
  vorgangstyp: string | null;
  drucksache_nr: string | null;
  drucksache_typ: string | null;
  pdf_url: string | null;
  herausgeber: string | null;
  urheber: string | null;
}

export function getActivitiesForPolitician(politicianId: number, limit = 50): ActivityRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM activities
       WHERE politician_id = ?
       ORDER BY datum DESC
       LIMIT ?`
    )
    .all(politicianId, limit) as ActivityRow[];
}

export function getActivityStatsForPolitician(politicianId: number): { art: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT aktivitaetsart as art, COUNT(*) as count
       FROM activities
       WHERE politician_id = ?
       GROUP BY aktivitaetsart
       ORDER BY count DESC`
    )
    .all(politicianId) as { art: string; count: number }[];
}

export function getActivityCountForPolitician(politicianId: number): number {
  const db = getDb();
  return (db.prepare("SELECT COUNT(*) as c FROM activities WHERE politician_id = ?").get(politicianId) as { c: number }).c;
}

export function getSpeechSummaryInfo(politicianId: number): { speaker: string; count: number } | null {
  const db = getDb();
  try {
    // Strikt via politician_id (seit Backfill 2026-05-07 100 % Coverage).
    // Vorher: LIKE '%lastname' — Bug: „Stein" matchte „Wallstein"/„Bernstein",
    // ORDER BY count DESC LIMIT 1 nahm den falschen Treffer.
    const row = db.prepare(
      `SELECT speaker, COUNT(*) AS count FROM speech_summaries
       WHERE politician_id = ?
         AND ${SPEECH_SUMMARY_QUALITY_FILTER_SQL}
       GROUP BY speaker ORDER BY count DESC LIMIT 1`
    ).get(politicianId) as { speaker: string; count: number } | undefined;
    return row && row.count > 0 ? row : null;
  } catch {
    return null;
  }
}

export interface ActivityWithPolitician extends ActivityRow {
  pol_first_name: string | null;
  pol_last_name: string | null;
  pol_party: string | null;
}

// ── Votes, Sidejobs, Committees (local DB) ──

export interface VoteRow {
  id: number;
  mandate_id: number;
  politician_id: number;
  poll_id: number;
  poll_label: string | null;
  poll_url: string | null;
  poll_date: string | null;
  vote: string;
  reason_no_show: string | null;
  fraction_id: number | null;
  fraction_label: string | null;
}

export function getVotesForPoliticianDb(politicianId: number, limit = 200): VoteRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM votes WHERE politician_id = ? ORDER BY poll_date DESC LIMIT ?`
  ).all(politicianId, limit) as VoteRow[];
}

export interface VoteStats {
  totalPolls: number;
  attended: number;
  attendanceRate: number;
  votedYes: number;
  votedNo: number;
  abstained: number;
  noShow: number;
}

export function computeVoteStatsDb(votes: VoteRow[]): VoteStats {
  const totalPolls = votes.length;
  const attended = votes.filter((v) => v.vote !== "no_show").length;
  return {
    totalPolls,
    attended,
    attendanceRate: totalPolls > 0 ? (attended / totalPolls) * 100 : 0,
    votedYes: votes.filter((v) => v.vote === "yes").length,
    votedNo: votes.filter((v) => v.vote === "no").length,
    abstained: votes.filter((v) => v.vote === "abstain").length,
    noShow: votes.filter((v) => v.vote === "no_show").length,
  };
}

// ============================================================
// Fraktions-Abweichungen — einzige inhaltliche Aussage auf Person-Ebene,
// die aus den 51 namentlichen Abstimmungen ableitbar ist. „Hat in N von M
// anders als Fraktion gestimmt" — bei 90 % der MdB ist N=0 (Disziplin),
// die übrigen ~65 zeigen reale Abweichungen.
// ============================================================

export interface FractionDeviationRow {
  poll_id: number;
  poll_label: string | null;
  poll_date: string | null;
  majority_vote: "yes" | "no" | "abstain";
  personal_vote: "yes" | "no" | "abstain";
}

export interface FractionDeviationResult {
  fraction_label: string | null;     // null = fraktionslos / unbekannt
  is_fractionless: boolean;
  total_namentlich: number;          // alle Polls in denen MdB stimmen konnte
  active_polls: number;              // davon nicht-Abwesend (yes/no/abstain)
  deviations: FractionDeviationRow[];
}

export function getFractionDeviationsForPolitician(politicianId: number): FractionDeviationResult {
  const db = getDb();

  // Häufigste Fraktion dieses MdB (manche MdB haben mehrere fraction_labels über
  // verschiedene Polls — z.B. wenn sie ausgetreten sind. Wir nehmen die häufigste).
  const fracRow = db.prepare(`
    SELECT fraction_label, COUNT(*) AS n
    FROM votes
    WHERE politician_id = ? AND fraction_label IS NOT NULL
    GROUP BY fraction_label
    ORDER BY n DESC LIMIT 1
  `).get(politicianId) as { fraction_label: string; n: number } | undefined;

  const fractionLabel = fracRow?.fraction_label ?? null;
  const isFractionless = fractionLabel === null
    || /^fraktionslos\b/i.test(fractionLabel)
    || /\bfraktionslos\b/i.test(fractionLabel);

  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN vote IN ('yes','no','abstain') THEN 1 ELSE 0 END) AS active
    FROM votes WHERE politician_id = ?
  `).get(politicianId) as { total: number; active: number };

  if (isFractionless || !fractionLabel) {
    return {
      fraction_label: fractionLabel,
      is_fractionless: true,
      total_namentlich: counts.total,
      active_polls: counts.active,
      deviations: [],
    };
  }

  // Pro Poll: Mehrheits-Vote dieser Fraktion (Ja/Nein/Enthaltung — keine
  // no_shows). Dann Person-Vote dagegen halten.
  const deviations = db.prepare(`
    WITH fraction_majority AS (
      SELECT poll_id, vote, COUNT(*) AS n,
             ROW_NUMBER() OVER (PARTITION BY poll_id ORDER BY COUNT(*) DESC) AS rn
      FROM votes
      WHERE fraction_label = ? AND vote IN ('yes','no','abstain')
      GROUP BY poll_id, vote
    ),
    majority AS (
      SELECT poll_id, vote AS majority_vote FROM fraction_majority WHERE rn = 1
    )
    SELECT v.poll_id, v.poll_label, v.poll_date, m.majority_vote, v.vote AS personal_vote
    FROM votes v
    JOIN majority m ON m.poll_id = v.poll_id
    WHERE v.politician_id = ?
      AND v.vote IN ('yes','no','abstain')
      AND v.vote != m.majority_vote
    ORDER BY v.poll_date DESC
  `).all(fractionLabel, politicianId) as FractionDeviationRow[];

  return {
    fraction_label: fractionLabel,
    is_fractionless: false,
    total_namentlich: counts.total,
    active_polls: counts.active,
    deviations,
  };
}

export interface SidejobRow {
  id: number;
  mandate_id: number;
  politician_id: number;
  label: string;
  income_level: string | null;
  income: number | null;
  income_total: number | null;
  interval: string | null;
  created: number;
  organization: string | null;
  additional_information: string | null;
  category: string | null;
  data_change_date: string | null;
}

export function getSidejobsForPoliticianDb(politicianId: number): SidejobRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM sidejobs WHERE politician_id = ? ORDER BY created DESC`
  ).all(politicianId) as SidejobRow[];
}

export interface CommitteeMembershipRow {
  id: number;
  mandate_id: number;
  politician_id: number;
  committee_id: number;
  committee_label: string;
  committee_role: string | null;
}

export function getCommitteeMembershipsForPoliticianDb(politicianId: number): CommitteeMembershipRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM committee_memberships WHERE politician_id = ? ORDER BY committee_label`
  ).all(politicianId) as CommitteeMembershipRow[];
}

export interface CVMergeDropRow {
  section: string;
  dropped_source: "wikipedia" | "homepage";
  dropped_jahr: string | null;
  dropped_text: string | null;
  kept_jahr: string | null;
  kept_text: string | null;
}

export function getCVMergeDropsForPolitician(politicianId: number): CVMergeDropRow[] {
  const db = getDb();
  // Tabelle existiert evtl. noch nicht (vor erstem Lauf des Dedup-Skripts)
  try {
    return db.prepare(
      `SELECT section, dropped_source, dropped_jahr, dropped_text, kept_jahr, kept_text
       FROM cv_merge_drops WHERE politician_id = ? ORDER BY section, id`
    ).all(politicianId) as CVMergeDropRow[];
  } catch {
    return [];
  }
}

export function getIncomeRange(level: string | null): string {
  const levels: Record<string, string> = {
    "1": "1.000 – 3.500 €",
    "2": "3.500 – 7.000 €",
    "3": "7.000 – 15.000 €",
    "4": "15.000 – 30.000 €",
    "5": "30.000 – 75.000 €",
    "6": "75.000 – 100.000 €",
    "7": "100.000 – 150.000 €",
    "8": "150.000 – 250.000 €",
    "9": "über 250.000 €",
    "10": "unter 1.000 €",
  };
  return levels[level || ""] || "Keine Angabe";
}

// ── Combined Parliamentary Work (DIP + Plenar merged) ──

export interface ParlamentarischeArbeit {
  id: string;
  quelle: "dip" | "plenar" | "kombiniert";
  datum: string | null;
  typ: string;              // Unified type label
  kategorie: string;        // For filtering: "rede" | "regierungserklaerung" | "frage" | "antwort" | "debattenbeitrag" | "erklaerung" | "gesetzgebung" | "bericht"
  thema: string | null;     // DIP thema or Plenar kontext
  zusammenfassung: string | null;  // From Plenar (mit v2.1-Fallback bei NULL)
  drucksache_nr: string | null;
  pdf_url: string | null;
  source_url: string | null;       // Plenar PDF
  sitzung: number | null;
  page_start: number | null;       // Plenarprotokoll-Seite (aus speech_summaries)
  page_section: string | null;     // Spaltenkennung A/B/C/D
  // v2.1 Reden-Analyse (optional, falls in speech_analyses_v2 verfügbar)
  tonalitaet: string | null;
  reden_typ: string | null;
  has_correction: boolean;
}

function kategorieForDip(art: string): string {
  if (art === "Rede" || art === "Rede (zu Protokoll gegeben)") return "rede";
  if (art === "Regierungserklärung") return "regierungserklaerung";
  if (art.includes("Anfrage") || art === "Frage" || art === "Zusatzfrage") return "frage";
  if (art === "Antwort" || art === "Einleitende Ausführungen und Beantwortung") return "antwort";
  if (art === "Kurzintervention" || art === "Zwischenfrage" || art === "Erwiderung" || art === "Zur Geschäftsordnung BT") return "debattenbeitrag";
  if (art.includes("Erklärung")) return "erklaerung";
  if (art === "Antrag" || art === "Gesetzentwurf" || art === "Änderungsantrag" || art === "Entschließungsantrag") return "gesetzgebung";
  if (art === "Berichterstattung") return "bericht";
  return "sonstige";
}

function kategorieForPlenar(typ: string): string {
  if (typ === "debatte") return "rede";
  if (typ === "regierungserklaerung") return "regierungserklaerung";
  if (typ === "fragestunde_frage") return "frage";
  if (typ === "fragestunde_antwort") return "antwort";
  if (typ === "zwischenfrage" || typ === "kurzintervention") return "debattenbeitrag";
  if (typ === "erklaerung") return "erklaerung";
  return "rede";
}

// Joint buckets für DIP↔Plenar-Matching (DIP API trennt Regierungserklärung
// nicht von Rede; Fragestunde-Antwort wird unter "Antwort"/Frage geführt).
// Display-Kategorien sind feiner — daher diese Mapping-Schicht für reine Match-Zwecke.
function matchBucket(kat: string): string {
  if (kat === "regierungserklaerung") return "rede";
  if (kat === "antwort") return "frage";
  return kat;
}

function typLabelForPlenar(typ: string): string {
  const map: Record<string, string> = {
    debatte: "Rede",
    regierungserklaerung: "Regierungserklärung",
    fragestunde_frage: "Frage (Fragestunde)",
    fragestunde_antwort: "Antwort (Fragestunde)",
    zwischenfrage: "Zwischenfrage",
    kurzintervention: "Kurzintervention",
    erklaerung: "Erklärung",
  };
  return map[typ] || "Rede";
}

export function getParlamentarischeArbeit(
  politicianId: number,
  speakerName: string | null,
  limit = 200
): { items: ParlamentarischeArbeit[]; stats: Record<string, number> } {
  const db = getDb();

  // 1. Load DIP activities — nur mündliche Plenar-Auftritte. Schriftliche
  // Drucksachen-Akte (Antrag/Gesetzentwurf/Anfrage/Berichterstattung etc.)
  // landen separat in der Drucksachen-Sektion via getDrucksachenForPolitician,
  // mit reicheren Daten (Thema, Zusammenfassung, Tonalität).
  const dipRows = db.prepare(
    `SELECT * FROM activities
     WHERE politician_id = ?
       AND aktivitaetsart NOT IN (
         'Kleine Anfrage','Große Anfrage','Antrag','Änderungsantrag',
         'Entschließungsantrag','Gesetzentwurf','Berichterstattung',
         'Berichterstattung (zu Protokoll gegeben)'
       )
     ORDER BY datum DESC LIMIT ?`
  ).all(politicianId, limit) as ActivityRow[];

  // 2. Load Plenar summaries via politician_id (zuverlässig, seit Backfill 2026-05-07
  // 100 % Coverage). Vorher wurde via speaker LIKE '%lastname' gematcht — Bug:
  // „Stein" matchte „Wallstein", „Bernstein" etc. → ORDER BY count nahm den
  // höchsten und Sandra Stein bekam Maja Wallsteins Reden zugeordnet.
  type PlenarRow = SpeechSummary & { speaker: string; speech_text_preview: string };
  const plenarRows = db.prepare(`
    SELECT * FROM speech_summaries
    WHERE politician_id = ?
      AND ${SPEECH_SUMMARY_QUALITY_FILTER_SQL}
    ORDER BY sitzung DESC, speech_index ASC
    LIMIT ?
  `).all(politicianId, limit) as PlenarRow[];

  // Analyses-Map: alle Speaker-Varianten dieser Person aggregieren (für v2.1-Match)
  const speakerVariants = db.prepare(
    `SELECT DISTINCT speaker FROM speech_summaries WHERE politician_id = ?`
  ).all(politicianId) as { speaker: string }[];
  const analysesMap = new Map<string, SpeechAnalysisV2>();
  for (const sv of speakerVariants) {
    const m = getSpeechAnalysesBySpeaker(sv.speaker);
    for (const [k, v] of m.entries()) analysesMap.set(k, v);
  }

  // Helper: matche Plenar-Row gegen v2.1-Analysen (rede_id + segment_index)
  function findV21(p: PlenarRow): SpeechAnalysisV2 | null {
    const ids = (p.rede_ids || p.rede_id || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const id of ids) {
      for (let seg = 0; seg < 10; seg++) {
        const a = analysesMap.get(`${id}_${seg}`);
        if (a) return a;
        if (seg > 0) break;
      }
    }
    return null;
  }

  // 3. Index plenar rows by date+match-bucket for matching against DIP
  const plenarByDateKat = new Map<string, PlenarRow[]>();
  for (const p of plenarRows) {
    if (!p.datum) continue;
    const key = `${p.datum}|${matchBucket(kategorieForPlenar(p.typ))}`;
    if (!plenarByDateKat.has(key)) plenarByDateKat.set(key, []);
    plenarByDateKat.get(key)!.push(p);
  }
  const matchedPlenarIds = new Set<number>();

  // 4. Build items — merge DIP with matching Plenar
  const items: ParlamentarischeArbeit[] = [];

  for (const a of dipRows) {
    const dipKat = kategorieForDip(a.aktivitaetsart);
    const key = a.datum ? `${a.datum}|${matchBucket(dipKat)}` : null;
    const matchingPlenar = key ? plenarByDateKat.get(key) : undefined;

    if (matchingPlenar && matchingPlenar.length > 0) {
      // Take first unmatched plenar entry for this date+match-bucket
      const plenar = matchingPlenar.find(p => !matchedPlenarIds.has(p.id)) || null;
      if (plenar) {
        matchedPlenarIds.add(plenar.id);
        const v21 = findV21(plenar);
        // Plenar-Typ ist präziser (kennt Regierungserklärung vs. Rede etc.) — Display-Kategorie übernehmen
        const plenarKat = kategorieForPlenar(plenar.typ);
        items.push({
          id: `kombi-${a.id}-${plenar.id}`,
          quelle: "kombiniert",
          datum: a.datum,
          typ: typLabelForPlenar(plenar.typ),
          kategorie: plenarKat,
          thema: a.thema || plenar.kontext,
          zusammenfassung: v21?.zusammenfassung_neutral ?? plenar.zusammenfassung,
          drucksache_nr: a.drucksache_nr,
          pdf_url: a.pdf_url,
          source_url: plenar.source_url,
          sitzung: plenar.sitzung,
          page_start: plenar.page_start,
          page_section: plenar.page_section,
          tonalitaet: v21?.tonalitaet ?? null,
          reden_typ: v21?.reden_typ ?? null,
          has_correction: v21?.has_correction ?? false,
        });
        continue;
      }
    }

    // No match — DIP only
    items.push({
      id: `dip-${a.id}`,
      quelle: "dip",
      datum: a.datum,
      typ: a.aktivitaetsart,
      kategorie: dipKat,
      thema: a.thema,
      zusammenfassung: null,
      drucksache_nr: a.drucksache_nr,
      pdf_url: a.pdf_url,
      source_url: null,
      sitzung: null,
      page_start: null,
      page_section: null,
      tonalitaet: null,
      reden_typ: null,
      has_correction: false,
    });
  }

  // 5. Add unmatched Plenar entries (no DIP counterpart)
  for (const p of plenarRows) {
    if (matchedPlenarIds.has(p.id)) continue;
    const v21 = findV21(p);
    items.push({
      id: `plenar-${p.id}`,
      quelle: "plenar",
      datum: p.datum,
      typ: typLabelForPlenar(p.typ),
      kategorie: kategorieForPlenar(p.typ),
      thema: p.kontext,
      zusammenfassung: v21?.zusammenfassung_neutral ?? p.zusammenfassung,
      drucksache_nr: null,
      pdf_url: null,
      source_url: p.source_url,
      sitzung: p.sitzung,
      page_start: p.page_start,
      page_section: p.page_section,
      tonalitaet: v21?.tonalitaet ?? null,
      reden_typ: v21?.reden_typ ?? null,
      has_correction: v21?.has_correction ?? false,
    });
  }

  // 6. Sort chronologically (newest first)
  items.sort((a, b) => {
    const da = a.datum || "0000";
    const db2 = b.datum || "0000";
    if (da !== db2) return db2.localeCompare(da);
    // Combined first, then DIP, then Plenar
    const order = { kombiniert: 0, dip: 1, plenar: 2 };
    return (order[a.quelle] ?? 1) - (order[b.quelle] ?? 1);
  });

  // 7. Compute stats
  const stats: Record<string, number> = {};
  for (const item of items) {
    stats[item.kategorie] = (stats[item.kategorie] || 0) + 1;
  }

  return { items, stats };
}

export interface ActivityListParams {
  query?: string;
  art?: string;
  limit?: number;
  offset?: number;
}

export function listActivities(params: ActivityListParams): { rows: ActivityWithPolitician[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.query) {
    conditions.push(`(a.thema LIKE ? OR a.titel LIKE ?)`);
    const term = `%${params.query}%`;
    args.push(term, term);
  }
  if (params.art) {
    conditions.push(`a.aktivitaetsart = ?`);
    args.push(params.art);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;

  const total = (db.prepare(`SELECT COUNT(*) as c FROM activities a ${where}`).get(...args) as { c: number }).c;

  const rows = db.prepare(
    `SELECT a.*, p.first_name as pol_first_name, p.last_name as pol_last_name, pa.label as pol_party
     FROM activities a
     LEFT JOIN politicians p ON a.politician_id = p.id
     LEFT JOIN parties pa ON p.party_id = pa.id
     ${where}
     ORDER BY a.datum DESC
     LIMIT ? OFFSET ?`
  ).all(...args, limit, offset) as ActivityWithPolitician[];

  return { rows, total };
}

export function getActivityTypes(): { art: string; count: number }[] {
  const db = getDb();
  return db.prepare(
    `SELECT aktivitaetsart as art, COUNT(*) as count FROM activities GROUP BY aktivitaetsart ORDER BY count DESC`
  ).all() as { art: string; count: number }[];
}

/**
 * Aktivitäten-Typen, bei denen mehrere Personen typischerweise GEMEINSAM eine
 * Drucksache einbringen (Mit-Initiierende) oder formal benannt werden
 * (Berichterstattung). Bei diesen wird in der Listen-Ansicht NACH
 * (drucksache_nr, aktivitaetsart) gruppiert, damit nicht 24× die identische
 * Karte erscheint. Reden/Antworten/Fragen sind individuell pro Person.
 */
const GROUPED_AKTIVITAETSARTEN = [
  "Antrag",
  "Änderungsantrag",
  "Entschließungsantrag",
  "Gesetzentwurf",
  "Kleine Anfrage",
  "Große Anfrage",
  "Berichterstattung",
] as const;
const GROUPED_AKTIVITAETSARTEN_PLACEHOLDERS = GROUPED_AKTIVITAETSARTEN.map(() => "?").join(",");

export interface ActivityListGroupedItem {
  kind: "individual" | "grouped";
  /** activities.id (individual) oder drucksache_nr|aktivitaetsart (grouped) — Key für React */
  key: string;
  drucksache_nr: string | null;
  aktivitaetsart: string;
  datum: string | null;
  titel: string;
  thema: string | null;
  herausgeber: string | null;
  pdf_url: string | null;
  urheber: string | null;
  /** Bei individual: einzelner Politiker. Bei grouped: null. */
  politician_id: number | null;
  pol_first_name: string | null;
  pol_last_name: string | null;
  pol_party: string | null;
  /** Bei grouped: Anzahl distinct Mitzeichner:innen. Bei individual: 1. */
  person_count: number;
  /** Bei grouped: alphabetische Liste der distinct Fraktionen (z.B. ["GRÜNE"] oder ["AfD","CSU","GRÜNE",…]). Bei individual: null. */
  party_set: string[] | null;
}

export function listActivitiesGrouped(params: ActivityListParams): {
  rows: ActivityListGroupedItem[];
  total: number;
  totalGrouped: number;
  totalIndividual: number;
} {
  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.query) {
    conditions.push(`(a.thema LIKE ? OR a.titel LIKE ?)`);
    const term = `%${params.query}%`;
    args.push(term, term);
  }
  if (params.art) {
    conditions.push(`a.aktivitaetsart = ?`);
    args.push(params.art);
  }
  const userWhere = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  // Counts (vor UNION) — nur für UI-Header, nicht für Pagination-Math
  const totalGrouped = (db.prepare(
    `SELECT COUNT(*) as c FROM (
       SELECT 1 FROM activities a
       WHERE a.drucksache_nr IS NOT NULL
         AND a.aktivitaetsart IN (${GROUPED_AKTIVITAETSARTEN_PLACEHOLDERS})
         ${userWhere}
       GROUP BY a.drucksache_nr, a.aktivitaetsart
     )`
  ).get(...GROUPED_AKTIVITAETSARTEN, ...args) as { c: number }).c;

  const totalIndividual = (db.prepare(
    `SELECT COUNT(*) as c FROM activities a
     WHERE (a.drucksache_nr IS NULL
        OR a.aktivitaetsart NOT IN (${GROUPED_AKTIVITAETSARTEN_PLACEHOLDERS}))
       ${userWhere}`
  ).get(...GROUPED_AKTIVITAETSARTEN, ...args) as { c: number }).c;

  const total = totalGrouped + totalIndividual;

  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;

  // UNION ALL — beide Quellen, dann sortiert+paginiert
  const rawRows = db.prepare(
    `SELECT * FROM (
       SELECT
         'grouped' AS kind,
         (a.drucksache_nr || '|' || a.aktivitaetsart) AS key,
         a.drucksache_nr AS drucksache_nr,
         a.aktivitaetsart AS aktivitaetsart,
         MAX(a.datum) AS datum,
         MAX(a.titel) AS titel,
         MAX(a.thema) AS thema,
         MAX(a.herausgeber) AS herausgeber,
         MAX(a.pdf_url) AS pdf_url,
         MAX(a.urheber) AS urheber,
         NULL AS politician_id,
         NULL AS pol_first_name,
         NULL AS pol_last_name,
         NULL AS pol_party,
         COUNT(DISTINCT a.politician_id) AS person_count,
         GROUP_CONCAT(DISTINCT COALESCE(pa.label, 'fraktionslos')) AS party_set
       FROM activities a
       LEFT JOIN politicians p ON p.id = a.politician_id
       LEFT JOIN parties pa ON pa.id = p.party_id
       WHERE a.drucksache_nr IS NOT NULL
         AND a.aktivitaetsart IN (${GROUPED_AKTIVITAETSARTEN_PLACEHOLDERS})
         ${userWhere}
       GROUP BY a.drucksache_nr, a.aktivitaetsart

       UNION ALL

       SELECT
         'individual' AS kind,
         CAST(a.id AS TEXT) AS key,
         a.drucksache_nr,
         a.aktivitaetsart,
         a.datum,
         a.titel,
         a.thema,
         a.herausgeber,
         a.pdf_url,
         a.urheber,
         a.politician_id,
         p.first_name AS pol_first_name,
         p.last_name AS pol_last_name,
         pa.label AS pol_party,
         1 AS person_count,
         NULL AS party_set
       FROM activities a
       LEFT JOIN politicians p ON p.id = a.politician_id
       LEFT JOIN parties pa ON pa.id = p.party_id
       WHERE (a.drucksache_nr IS NULL
          OR a.aktivitaetsart NOT IN (${GROUPED_AKTIVITAETSARTEN_PLACEHOLDERS}))
         ${userWhere}
     )
     ORDER BY datum IS NULL, datum DESC
     LIMIT ? OFFSET ?`
  ).all(
    ...GROUPED_AKTIVITAETSARTEN, ...args,
    ...GROUPED_AKTIVITAETSARTEN, ...args,
    limit, offset
  ) as Array<{
    kind: "grouped" | "individual";
    key: string;
    drucksache_nr: string | null;
    aktivitaetsart: string;
    datum: string | null;
    titel: string;
    thema: string | null;
    herausgeber: string | null;
    pdf_url: string | null;
    urheber: string | null;
    politician_id: number | null;
    pol_first_name: string | null;
    pol_last_name: string | null;
    pol_party: string | null;
    person_count: number;
    party_set: string | null;
  }>;

  const rows: ActivityListGroupedItem[] = rawRows.map((r) => ({
    kind: r.kind,
    key: r.key,
    drucksache_nr: r.drucksache_nr,
    aktivitaetsart: r.aktivitaetsart,
    datum: r.datum,
    titel: r.titel,
    thema: r.thema,
    herausgeber: r.herausgeber,
    pdf_url: r.pdf_url,
    urheber: r.urheber,
    politician_id: r.politician_id,
    pol_first_name: r.pol_first_name,
    pol_last_name: r.pol_last_name,
    pol_party: r.pol_party,
    person_count: r.person_count,
    party_set: r.party_set ? r.party_set.split(",").sort() : null,
  }));

  return { rows, total, totalGrouped, totalIndividual };
}

// ── Politician Notes (Sonderfälle) ──

export interface PoliticianNote {
  id: number;
  politician_id: number | null;
  speaker_name: string | null;
  kategorie: string;
  titel: string;
  inhalt: string;
  datum_von: string | null;
  datum_bis: string | null;
}

export function getNotesForPolitician(politicianId: number): PoliticianNote[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM politician_notes WHERE politician_id = ? ORDER BY datum_von DESC`
  ).all(politicianId) as PoliticianNote[];
}

// ── Plenar-Protokolle ──

export interface PlenarSessionRow {
  id: number;
  wahlperiode: number;
  sitzung: number;
  datum: string | null;
  source_url: string | null;
  speech_count: number;
  speaker_count: number;
}

export function getPlenarSessions(): PlenarSessionRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.id, s.wahlperiode, s.sitzung, s.datum, s.source_url,
      COUNT(sp.id) as speech_count,
      COUNT(DISTINCT sp.speaker) as speaker_count
    FROM plenar_sessions s
    LEFT JOIN plenar_speeches sp ON sp.session_id = s.id
    GROUP BY s.id
    ORDER BY s.sitzung DESC
  `).all() as PlenarSessionRow[];
}

export function getTopPlenarSpeakers(limit = 25): { speaker: string; party: string | null; role: string | null; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT speaker,
      COALESCE(party, role) as party,
      role,
      COUNT(*) as count
    FROM plenar_speeches
    GROUP BY speaker
    ORDER BY count DESC
    LIMIT ?
  `).all(limit) as any[];
}

export function getPlenarPartyStats(): { party: string; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT party, COUNT(*) as count
    FROM plenar_speeches
    WHERE party IS NOT NULL
    AND party NOT IN ('EU', 'GEAS-Anpassungsgesetz', 'Tariftreuegesetz', 'Zusatzpunkt 5')
    GROUP BY party
    ORDER BY count DESC
  `).all() as any[];
}

// Returns one row per Fraktion with total contribution count and breakdown by Plenarbeitrag-Typ-Slug.
// Source: speech_summaries → politicians → parties (so Fraktionen are clean & joined to politicians).
// Typ-strings are normalized via TYP_TO_SLUG below before grouping.
export function getPartyContributionMatrix(): {
  fraktion: string;
  total: number;
  byTyp: Record<string, number>;
}[] {
  const db = getDb();
  let rows: { fraktion: string | null; typ: string | null; c: number }[] = [];
  try {
    rows = db.prepare(`
      SELECT p.label AS fraktion, ss.typ AS typ, COUNT(*) AS c
      FROM speech_summaries ss
      LEFT JOIN politicians po ON po.id = ss.politician_id
      LEFT JOIN parties p ON p.id = po.party_id
      WHERE p.label IS NOT NULL AND ss.typ IS NOT NULL AND ss.typ != ''
      GROUP BY p.label, ss.typ
    `).all() as any[];
  } catch {
    return [];
  }

  const FRAKTION_GROUPS: Record<string, string> = {
    "CDU": "CDU/CSU",
    "CSU": "CDU/CSU",
  };
  const norm = (s: string) => s.replace(/ /g, " ").replace(/­/g, "").trim();

  const map = new Map<string, { total: number; byTyp: Record<string, number> }>();
  for (const r of rows) {
    if (!r.fraktion || !r.typ) continue;
    const cleaned = norm(r.fraktion);
    const key = FRAKTION_GROUPS[cleaned] || cleaned;
    const slug = TYP_TO_SLUG[r.typ.toLowerCase().trim()];
    if (!slug) continue; // skip unknown / variant casings
    if (!map.has(key)) map.set(key, { total: 0, byTyp: {} });
    const entry = map.get(key)!;
    entry.total += r.c;
    entry.byTyp[slug] = (entry.byTyp[slug] || 0) + r.c;
  }

  return Array.from(map.entries())
    .map(([fraktion, v]) => ({ fraktion, total: v.total, byTyp: v.byTyp }))
    .sort((a, b) => b.total - a.total);
}

// Speakers with per-Typ breakdown. Pass `limit = 0` to get all.
export function getTopSpeakersWithBreakdown(limit = 15): {
  speaker: string;
  fraktion: string | null;
  total: number;
  byTyp: Record<string, number>;
}[] {
  const db = getDb();
  // Group by politician_id when available — multiple speaker-string variants
  // (e.g. "Dr. Johann David Wadephul" + "Dr. Johann Wadephul") map to the
  // same person. Fall back to speaker string for rows without politician_id.
  let rows: {
    politician_id: number | null;
    canonical_name: string | null;
    speaker: string;
    fraktion: string | null;
    typ: string | null;
    c: number;
  }[] = [];
  try {
    rows = db.prepare(`
      SELECT
        ss.politician_id AS politician_id,
        TRIM(COALESCE(po.title || ' ', '') || COALESCE(po.first_name, '') || ' ' || COALESCE(po.last_name, '')) AS canonical_name,
        ss.speaker AS speaker,
        p.label AS fraktion,
        ss.typ AS typ,
        COUNT(*) AS c
      FROM speech_summaries ss
      LEFT JOIN politicians po ON po.id = ss.politician_id
      LEFT JOIN parties p ON p.id = po.party_id
      WHERE ss.speaker IS NOT NULL AND ss.typ IS NOT NULL AND ss.typ != ''
        AND ${SPEECH_SUMMARY_QUALITY_FILTER_SQL.replace(/zusammenfassung/g, "ss.zusammenfassung")}
      GROUP BY ss.politician_id, ss.speaker, p.label, ss.typ
    `).all() as any[];
  } catch {
    return [];
  }

  const FRAKTION_GROUPS: Record<string, string> = {
    "CDU": "CDU/CSU",
    "CSU": "CDU/CSU",
  };
  const norm = (s: string) => s.replace(/ /g, " ").replace(/­/g, "").trim();

  const map = new Map<string, { displayName: string; fraktion: string | null; total: number; byTyp: Record<string, number> }>();
  for (const r of rows) {
    if (!r.speaker || !r.typ) continue;
    const slug = TYP_TO_SLUG[r.typ.toLowerCase().trim()];
    if (!slug) continue;
    const cleanedFr = r.fraktion ? norm(r.fraktion) : null;
    const fr = cleanedFr ? (FRAKTION_GROUPS[cleanedFr] || cleanedFr) : null;
    const key = r.politician_id != null ? `pid:${r.politician_id}` : `name:${r.speaker}`;
    const display = r.politician_id != null && r.canonical_name ? r.canonical_name : r.speaker;
    if (!map.has(key)) map.set(key, { displayName: display, fraktion: fr, total: 0, byTyp: {} });
    const entry = map.get(key)!;
    entry.total += r.c;
    entry.byTyp[slug] = (entry.byTyp[slug] || 0) + r.c;
    if (!entry.fraktion && fr) entry.fraktion = fr;
  }

  // Ergänze aktive MdBs ohne Plenarbeiträge mit total=0 — Transparenz darüber,
  // wer noch keinen Beitrag hatte. Quelle: Politiker mit aktivem Mandat (ACTIVE-Filter).
  // IS_POLITICIAN_ACTIVE_SQL nutzt Alias `p` — daher hier auch `p` für politicians.
  const activeMdbsWithoutSpeech = db.prepare(`
    SELECT p.id AS politician_id,
      TRIM(COALESCE(p.title || ' ', '') || COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) AS canonical_name,
      pa.label AS fraktion
    FROM politicians p
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE ${IS_POLITICIAN_ACTIVE_SQL}
      AND p.id NOT IN (
        SELECT DISTINCT politician_id FROM speech_summaries WHERE politician_id IS NOT NULL
      )
  `).all(...VISIBLE_PARLIAMENT_TYPE_VALUES) as { politician_id: number; canonical_name: string; fraktion: string | null }[];

  for (const m of activeMdbsWithoutSpeech) {
    const cleanedFr = m.fraktion ? norm(m.fraktion) : null;
    const fr = cleanedFr ? (FRAKTION_GROUPS[cleanedFr] || cleanedFr) : null;
    const key = `pid:${m.politician_id}`;
    if (!map.has(key)) {
      map.set(key, { displayName: m.canonical_name || "Unbekannt", fraktion: fr, total: 0, byTyp: {} });
    }
  }

  const all = Array.from(map.values())
    .map((v) => ({ speaker: v.displayName, fraktion: v.fraktion, total: v.total, byTyp: v.byTyp }))
    .sort((a, b) => b.total - a.total);
  return limit > 0 ? all.slice(0, limit) : all;
}

// ── Ausschuss-Protokolle ──

export interface AusschussSessionRow {
  id: number;
  protokoll_nr: string | null;
  sitzung_nr: number | null;
  ausschuss: string;
  typ: string | null;
  datum: string | null;
  vorsitz: string | null;
  attendee_count: number;
  topic_count: number;
}

export function getAusschussSessions(): AusschussSessionRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM ausschuss_attendees WHERE session_id = s.id) as attendee_count,
      (SELECT COUNT(*) FROM ausschuss_topics WHERE session_id = s.id) as topic_count
    FROM ausschuss_sessions s
    WHERE s.ausschuss != 'Unbekannt'
    ORDER BY s.datum DESC NULLS LAST, s.sitzung_nr DESC
  `).all() as AusschussSessionRow[];
}

// Canonical mapping: source_file top-level folder → official Ausschuss name.
// The PDF text-headers are unreliable (cut at line breaks, duplicated, mixed
// with adjacent committee headers), but the data/ausschuss_protokolle/<folder>
// structure is curated and trustworthy.
const AUSSCHUSS_FOLDER_MAP: Record<string, string> = {
  "a07_finanzen": "Finanzausschuss",
  "a09_wirtschaft": "Wirtschaft und Energie",
  "a10_landwirtschaft": "Landwirtschaft, Ernährung, Heimat",
  "a11_arbeit_soziales": "Arbeit und Soziales",
  "a13_Bildung-Familie-Senioren-Frauen-und-Jugend": "Bildung, Familie, Senioren, Frauen und Jugend",
  "a13_Bildung-Familie-Senioren-Frauen-und-Jugend_kiko": "Kinderkommission (KiKo)",
  "a17_menschenrechte": "Menschenrechte und humanitäre Hilfe",
  "a20_tourismus": "Tourismus",
  "a22_kultur": "Kultur und Medien",
  "a23_digitales_staatsmodernisierung": "Digitales und Staatsmodernisierung",
  "a24_wohnen": "Wohnen, Stadtentwicklung, Bauwesen und Kommunen",
  "gesundheit": "Gesundheit",
  "recht-verbraucherschutz": "Recht und Verbraucherschutz",
  "sport_und_ehrenamt": "Sport und Ehrenamt",
  "verkehr": "Verkehr",
};

// SQL fragment shared across queries: folder = top-level dir of source_file,
// excluding Anlagenkonvolute (those are PDF attachments, not real sessions).
const AUSSCHUSS_REAL_SESSION_WHERE = `
  ausschuss != 'Unbekannt'
  AND source_file IS NOT NULL
  AND source_file NOT LIKE '%Anlagenkonvolut%'
`;
const AUSSCHUSS_FOLDER_EXPR = `
  CASE
    WHEN source_file LIKE '%/%' THEN substr(source_file, 1, instr(source_file, '/') - 1)
    ELSE NULL
  END
`;

export function getAusschussStats(): { ausschuss: string; sitzungen: number; anwesende: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      ${AUSSCHUSS_FOLDER_EXPR} AS folder,
      COUNT(*) AS sitzungen,
      SUM((SELECT COUNT(*) FROM ausschuss_attendees WHERE session_id = s.id)) AS anwesende
    FROM ausschuss_sessions s
    WHERE ${AUSSCHUSS_REAL_SESSION_WHERE}
    GROUP BY folder
  `).all() as { folder: string | null; sitzungen: number; anwesende: number | null }[];

  return rows
    .map((r) => ({
      ausschuss: (r.folder && AUSSCHUSS_FOLDER_MAP[r.folder]) || r.folder || "Unbekannt",
      sitzungen: r.sitzungen,
      anwesende: r.anwesende || 0,
    }))
    .sort((a, b) => b.sitzungen - a.sitzungen);
}

// Cleans a PDF-parser-extracted attendee name. Hauptsächlich Whitespace-Norm.
// Die Anwesenheits-Marker-Stripping (ja|nein) ist im neuen Parser erledigt;
// hier nicht mehr versuchen, sonst werden echte Namen wie "Sonja", "Anja",
// "Tanja", "Maja" fälschlich gekürzt.
function cleanAttendeeName(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  // CamelCase boundary nur defensiv falls in alten Daten noch "AlaaBeck" lauert.
  s = s.replace(/([a-zäöüß])([A-ZÄÖÜ])/g, "$1 $2");
  return s.replace(/\s+/g, " ").trim();
}

function stripTitles(name: string): string {
  return name
    .replace(/\b(Dr\.?|Prof\.?|Frhr\.?|Frfr\.?|MdB)\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function foldDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Loose fraktion-equivalence check (attendees write "CDU/CSU", politicians table has "CDU" + "CSU" separately).
function fraktionMatches(attendee: string | null, party: string | null): boolean {
  if (!attendee || !party) return true; // missing info → don't reject
  const a = attendee.toLowerCase().replace(/[\s/­]/g, "");
  const p = party.toLowerCase().replace(/[\s/­]/g, "");
  if (a === p) return true;
  // Cross-mapping: "CDU/CSU" ↔ "CDU" or "CSU"
  if (a.includes("cducsu") && (p === "cdu" || p === "csu")) return true;
  // "Bündnis 90/Die Grünen" forms
  if (a.includes("grün") && p.includes("grün")) return true;
  if (a.includes("linke") && p.includes("linke")) return true;
  if (a.includes("spd") && p === "spd") return true;
  if (a.includes("afd") && p === "afd") return true;
  return false;
}

// Returns ALL Ausschuss-attendees with attendance count + politician_id when
// the name can be resolved. Names are cleaned of common parser artifacts and
// matched against `politicians` with multiple strategies + fraktion-check
// to avoid false positives (e.g. SPD-attendee → Grünen-MdB with same last name).
export function getTopAusschussAttendees(
  limit = 20,
): { name: string; original_name: string; fraktion: string | null; sitzungen: number; ausschuesse: string; politician_id: number | null }[] {
  const db = getDb();
  const rawRows = db.prepare(`
    SELECT a.name AS original_name,
      a.fraktion,
      COUNT(DISTINCT a.session_id) AS sitzungen,
      GROUP_CONCAT(DISTINCT s.ausschuss) AS ausschuesse
    FROM ausschuss_attendees a
    JOIN ausschuss_sessions s ON a.session_id = s.id
    WHERE s.ausschuss != 'Unbekannt'
    GROUP BY a.name
    ORDER BY sitzungen DESC
  `).all() as { original_name: string; fraktion: string | null; sitzungen: number; ausschuesse: string }[];

  // Pull all politicians once + build folded lookup tables in JS for fuzzy matching.
  const allPoliticians = db.prepare(`
    SELECT po.id, po.first_name, po.last_name, po.title, p.label AS party_label
    FROM politicians po
    LEFT JOIN parties p ON p.id = po.party_id
  `).all() as { id: number; first_name: string; last_name: string; title: string | null; party_label: string | null }[];

  // Index by folded full-name (with and without title) and by folded last_name.
  const byFullName = new Map<string, { id: number; party_label: string | null }[]>();
  const byLastName = new Map<string, { id: number; party_label: string | null }[]>();
  for (const p of allPoliticians) {
    const full = `${p.first_name} ${p.last_name}`.trim();
    const fullWithTitle = `${p.title ? p.title + " " : ""}${full}`.trim();
    for (const variant of [full, fullWithTitle]) {
      const k = foldDiacritics(variant.toLowerCase());
      if (!byFullName.has(k)) byFullName.set(k, []);
      byFullName.get(k)!.push({ id: p.id, party_label: p.party_label });
    }
    const lastK = foldDiacritics(p.last_name.toLowerCase());
    if (!byLastName.has(lastK)) byLastName.set(lastK, []);
    byLastName.get(lastK)!.push({ id: p.id, party_label: p.party_label });
  }

  function lookupFullName(name: string, fraktion: string | null): number | null {
    const k = foldDiacritics(name.toLowerCase());
    const cands = byFullName.get(k) || [];
    const inFraktion = cands.filter((c) => fraktionMatches(fraktion, c.party_label));
    if (inFraktion.length === 1) return inFraktion[0].id;
    if (inFraktion.length > 1) return inFraktion[0].id; // identical names + fraktion → take first
    return null;
  }

  function lookupLastName(last: string, fraktion: string | null): number | null {
    const k = foldDiacritics(last.toLowerCase());
    const cands = byLastName.get(k) || [];
    const inFraktion = cands.filter((c) => fraktionMatches(fraktion, c.party_label));
    if (inFraktion.length === 1) return inFraktion[0].id;
    return null;
  }

  const out = rawRows.map((r) => {
    const cleaned = cleanAttendeeName(r.original_name);
    const stripped = stripTitles(cleaned);
    const tokens = cleaned.split(" ");
    const strippedTokens = stripped.split(" ");

    let politician_id: number | null = null;

    // Strategy 1: try multiple variants of the full name.
    const fullCandidates = [cleaned, stripped];
    if (tokens.length === 3 && /^[A-ZÄÖÜ]$/.test(tokens[1])) {
      fullCandidates.push(`${tokens[0]} ${tokens[2]}`);
    }
    if (strippedTokens.length > 2) {
      fullCandidates.push(`${strippedTokens[0]} ${strippedTokens[strippedTokens.length - 1]}`);
      // Multi-word last names: "Christian Frhr. von Stetten" → first + "von Stetten"
      fullCandidates.push(
        `${strippedTokens[0]} ${strippedTokens.slice(1).join(" ")}`,
      );
    }
    for (const cand of fullCandidates) {
      const id = lookupFullName(cand, r.fraktion);
      if (id) { politician_id = id; break; }
    }

    // Strategy 2: last-name-only fallback (handles "Dr <Last>" cases).
    if (!politician_id && strippedTokens.length > 0) {
      // Try last token, then last two tokens (for "von Stetten").
      const lastSingle = strippedTokens[strippedTokens.length - 1];
      const lastDouble = strippedTokens.length >= 2 ? strippedTokens.slice(-2).join(" ") : null;
      politician_id =
        lookupLastName(lastSingle, r.fraktion) ||
        (lastDouble ? lookupLastName(lastDouble, r.fraktion) : null);
    }

    return {
      name: cleaned,
      original_name: r.original_name,
      fraktion: r.fraktion,
      sitzungen: r.sitzungen,
      ausschuesse: r.ausschuesse,
      politician_id,
    };
  });

  return limit > 0 ? out.slice(0, limit) : out;
}

export function getProtokollOverview() {
  const db = getDb();
  return {
    plenarSessions: (db.prepare("SELECT COUNT(*) as c FROM plenar_sessions").get() as any).c,
    plenarSpeeches: (db.prepare("SELECT COUNT(*) as c FROM plenar_speeches").get() as any).c,
    plenarSpeakers: (db.prepare("SELECT COUNT(DISTINCT speaker) as c FROM plenar_speeches").get() as any).c,
    ausschussSessions: (db.prepare(`SELECT COUNT(*) as c FROM ausschuss_sessions WHERE ${AUSSCHUSS_REAL_SESSION_WHERE}`).get() as any).c,
    ausschussAttendees: (db.prepare("SELECT COUNT(*) as c FROM ausschuss_attendees").get() as any).c,
    ausschussTopics: (db.prepare("SELECT COUNT(*) as c FROM ausschuss_topics").get() as any).c,
  };
}

// Coverage-Stats für den Disclaimer auf /protokolle:
// Nutzt dieselbe fuzzy-Match-Logik wie getTopAusschussAttendees (Diacritics-Fold,
// Title-Strip, Multi-Word-Last-Names), damit die "Linked"-Zahl exakt mit der
// angezeigten Liste übereinstimmt.
export function getAusschussCoverage(): {
  mdbsLinked: number;
  mdbsTotal: number;
  ausschuesseCovered: number;
} {
  const db = getDb();
  const matched = getTopAusschussAttendees(0);
  const distinctIds = new Set<number>();
  for (const a of matched) {
    if (a.politician_id) distinctIds.add(a.politician_id);
  }
  const total = db.prepare(`
    SELECT COUNT(DISTINCT m.politician_id) AS c FROM mandates m
    JOIN parliament_periods pp ON pp.id = m.parliament_period_id
    JOIN parliaments par ON par.id = pp.parliament_id
    WHERE par.label = 'Bundestag' AND pp.label LIKE '%2025%'
  `).get() as { c: number };
  const folders = db.prepare(`
    SELECT COUNT(DISTINCT folder) AS c FROM (
      SELECT ${AUSSCHUSS_FOLDER_EXPR} AS folder
      FROM ausschuss_sessions WHERE ${AUSSCHUSS_REAL_SESSION_WHERE}
    )
  `).get() as { c: number };
  return {
    mdbsLinked: distinctIds.size,
    mdbsTotal: total.c,
    ausschuesseCovered: folders.c,
  };
}

// ── Redner-Detail ──

export interface SpeakerDetail {
  speaker: string;
  party: string | null;
  role: string | null;
  totalSpeeches: number;
  sessions: {
    sitzung: number;
    datum: string | null;
    sourceUrl: string | null;
    count: number;
  }[];
}

/**
 * Resolve a free-form speaker name (typ. „Vorname Nachname", evtl. mit
 * Titel) auf einen Politiker-Row, OHNE auf `speech_summaries` zu schauen.
 * Wird auf der Redner-Detail-Seite als Fallback genutzt: wenn jemand
 * in SpeakerExplorer als Sprecher mit 0 Reden erscheint (z.B. Sitzungs-
 * leitung, jemand der nur in Anwesenheitslisten auftaucht), redirecten
 * wir zum Politiker-Profil statt 404 zu werfen.
 *
 * Match-Heuristik: alle Tokens aus dem Eingabe-Namen werden gegen
 * first_name + last_name (zusammen) geprüft. Trefferprio: exact match
 * vor partial. Titel (Dr./Prof. etc.) und Klammer-Zusätze werden vor
 * Match entfernt.
 */
export function getPoliticianIdByDisplayName(name: string): number | null {
  const db = getDb();
  const cleaned = name
    .replace(/\(.*?\)/g, " ")
    .replace(/^(Dr\.|Prof\.|Prof\. Dr\.)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  // Versuche exact match auf "first_name + ' ' + last_name"
  const exact = db.prepare(`
    SELECT id FROM politicians
    WHERE TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')) = ?
    LIMIT 1
  `).get(cleaned) as { id: number } | undefined;
  if (exact) return exact.id;

  // Fallback: last token = last_name, alles davor = first_name
  const tokens = cleaned.split(" ");
  if (tokens.length >= 2) {
    const last = tokens[tokens.length - 1];
    const first = tokens.slice(0, -1).join(" ");
    const partial = db.prepare(`
      SELECT id FROM politicians WHERE last_name = ? AND first_name LIKE ? || '%' LIMIT 1
    `).get(last, first) as { id: number } | undefined;
    if (partial) return partial.id;
  }
  return null;
}

export function getSpeakerDetail(name: string): SpeakerDetail | null {
  const db = getDb();

  // Check if we have XML-based speech_summaries for this speaker (higher quality)
  let hasSummaries = false;
  try {
    const sumCheck = db.prepare("SELECT COUNT(*) as c FROM speech_summaries WHERE speaker = ?").get(name) as any;
    hasSummaries = sumCheck?.c > 0;
  } catch {}

  if (hasSummaries) {
    // Use speech_summaries as source of truth
    const sessions = db.prepare(`
      SELECT sitzung, datum,
        source_url as sourceUrl,
        COUNT(*) as count
      FROM speech_summaries
      WHERE speaker = ?
      GROUP BY sitzung
      ORDER BY sitzung DESC
    `).all(name) as any[];

    if (sessions.length === 0) return null;

    // Get party/role from first summary entry
    const info = db.prepare(`
      SELECT speaker, typ, kontext FROM speech_summaries
      WHERE speaker = ? ORDER BY sitzung DESC LIMIT 1
    `).get(name) as any;

    // Also check plenar_speeches for party/role info
    const pInfo = db.prepare(`
      SELECT party, role FROM plenar_speeches WHERE speaker = ? AND (party IS NOT NULL OR role IS NOT NULL) LIMIT 1
    `).get(name) as any;

    const totalSpeeches = sessions.reduce((sum: number, s: any) => sum + s.count, 0);

    return {
      speaker: name,
      party: pInfo?.party || null,
      role: pInfo?.role || null,
      totalSpeeches,
      sessions,
    };
  }

  // Fallback to plenar_speeches
  const summary = db.prepare(`
    SELECT speaker, party, role, COUNT(*) as totalSpeeches
    FROM plenar_speeches
    WHERE speaker = ?
    GROUP BY speaker
  `).get(name) as any;

  if (!summary) return null;

  const sessions = db.prepare(`
    SELECT s.sitzung, s.datum, s.source_url as sourceUrl, COUNT(*) as count
    FROM plenar_speeches sp
    JOIN plenar_sessions s ON sp.session_id = s.id
    WHERE sp.speaker = ?
    GROUP BY s.id
    ORDER BY s.sitzung DESC
  `).all(name) as any[];

  return {
    speaker: summary.speaker,
    party: summary.party,
    role: summary.role,
    totalSpeeches: summary.totalSpeeches,
    sessions,
  };
}

export function getAllSpeakers(): { speaker: string; party: string | null; role: string | null; count: number; sessions: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT speaker,
      MAX(party) as party,
      MAX(role) as role,
      COUNT(*) as count,
      COUNT(DISTINCT session_id) as sessions
    FROM plenar_speeches
    GROUP BY speaker
    ORDER BY count DESC
  `).all() as any[];
}

export interface SpeechSummary {
  id: number;
  sitzung: number;
  datum: string | null;
  speech_index: number;
  zusammenfassung: string | null;
  kontext: string | null;
  typ: string;
  source_url: string | null;
  // Quellen-Pointer (gefüllt seit 2026-04-28)
  rede_id: string | null;
  rede_ids: string | null;
  page_start: number | null;
  page_section: string | null;
  original_text: string | null;
  model: string | null;
  prompt_version: string | null;
  generated_at: string | null;
}

// Resolve a speaker name (which may be a canonical or a variant) to the
// underlying politician + ALL speaker-string variants used in speech_summaries.
// Returns null for speakers with no politician_id (Sitzungsleitung etc.).
export function getPoliticianFromSpeakerName(name: string): {
  politician_id: number;
  canonical_name: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  party_label: string | null;
  variants: string[];
} | null {
  const db = getDb();

  let row = db.prepare(`
    SELECT DISTINCT politician_id FROM speech_summaries
    WHERE speaker = ? AND politician_id IS NOT NULL LIMIT 1
  `).get(name) as { politician_id: number } | undefined;

  if (!row) {
    const polRow = db.prepare(`
      SELECT id FROM politicians
      WHERE TRIM(COALESCE(title || ' ', '') || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) = ?
      LIMIT 1
    `).get(name) as { id: number } | undefined;
    if (!polRow) return null;
    row = { politician_id: polRow.id };
  }

  const detail = db.prepare(`
    SELECT
      TRIM(COALESCE(title || ' ', '') || COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) AS canonical_name,
      first_name,
      last_name,
      photo_url,
      party_id
    FROM politicians WHERE id = ?
  `).get(row.politician_id) as {
    canonical_name: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    party_id: number | null;
  } | undefined;
  if (!detail) return null;

  const party = detail.party_id
    ? (db.prepare(`SELECT label FROM parties WHERE id = ?`).get(detail.party_id) as { label: string } | undefined)
    : null;

  const variants = db.prepare(
    `SELECT DISTINCT speaker FROM speech_summaries WHERE politician_id = ?`,
  ).all(row.politician_id) as { speaker: string }[];

  return {
    politician_id: row.politician_id,
    canonical_name: detail.canonical_name,
    first_name: detail.first_name,
    last_name: detail.last_name,
    photo_url: detail.photo_url,
    party_label: party?.label || null,
    variants: variants.map((v) => v.speaker),
  };
}

export function getSpeechSummaries(speakerName: string): SpeechSummary[] {
  const db = getDb();
  try {
    // NULL/leere zusammenfassung NICHT filtern — die v2.1-Analyse-Pipeline
    // (speech_analyses_v2) hat Coverage für alle Sitzungen 1-75; die alte
    // Llama-3.3-70B-Pipeline (speech_summaries.zusammenfassung) lief nur
    // bis Sitzung 64. Für Sitzungen 65+ ist zusammenfassung NULL — die UI
    // fällt dann auf v2.1-Daten zurück (zusammenfassung_neutral).
    return db.prepare(`
      SELECT * FROM speech_summaries
      WHERE speaker = ?
        AND ${SPEECH_SUMMARY_QUALITY_FILTER_SQL}
      ORDER BY sitzung DESC, speech_index ASC
    `).all(speakerName) as SpeechSummary[];
  } catch {
    return [];
  }
}

// ============================================================
// Strukturierte Reden-Analysen (speech_analyses_v2 + corrections)
// Pipeline: Haiku 4.5 mit neutralisierter v2.1-Methodology, Quote-validation
// COALESCE-Pattern: final (manuell korrigiert) → v2.1 (Re-Batch) → v2 (Original)
// ============================================================

export interface SpeechAnalysisV2 {
  rede_id: string;
  segment_index: number;
  reden_typ: string | null;
  tonalitaet: string | null;
  forderungen: string[];
  woertliche_zitate: string[];
  framing_marker: string[];
  rhetorische_mittel: string[];
  konkrete_zahlen: string[];
  zusammenfassung_neutral: string | null;
  quote_valid_count: number;
  quote_total_count: number;
  fix_source: string | null; // null | 'mapping' | 'manual_override'
  has_correction: boolean;
}

function safeJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    // Double-encoded JSON-Bug bei ~90 Reden — versuche zweites Parsen
    if (typeof parsed === "string") {
      try {
        const inner = JSON.parse(parsed);
        if (Array.isArray(inner)) return inner.filter((x) => typeof x === "string");
      } catch {}
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Bereinigt Tool-Use-Tag-Lecks am Ende der zusammenfassung_2_saetze.
 * Bei einigen v2.1-Outputs hat Haiku XML-artige Tags an die Summary angehängt.
 */
function stripTagLeak(s: string | null): string | null {
  if (!s) return s;
  let r = s;
  // /s-Flag nicht überall verfügbar → [\s\S] als Workaround
  r = r.replace(/<\/zusammenfassung_2_saetze>[\s\S]*$/, "");
  r = r.replace(/<parameter\s+name=[\s\S]*$/, "");
  r = r.replace(/<\/invoke>[\s\S]*$/, "");
  r = r.replace(/<\/answer>[\s\S]*$/, "");
  return r.trim();
}

/**
 * Liefert strukturierte Reden-Analysen für einen Sprecher, gemapped per
 * `${rede_id}_${segment_index}`. UI verwendet die COALESCE-Logik:
 * final-corrigiert > v2.1-rebatch > v2-original.
 */
export function getSpeechAnalysesBySpeaker(
  speakerName: string,
): Map<string, SpeechAnalysisV2> {
  const db = getDb();
  const map = new Map<string, SpeechAnalysisV2>();
  try {
    const rows = db
      .prepare(
        `
      SELECT
        v2.rede_id, v2.segment_index, v2.reden_typ, v2.tonalitaet,
        v2.forderungen_json, v2.woertliche_zitate_json, v2.framing_marker_json,
        v2.rhetorische_mittel_json, v2.konkrete_zahlen_json,
        v2.quote_valid_count, v2.quote_total_count,
        COALESCE(
          c.zusammenfassung_2_saetze_final,
          c.zusammenfassung_2_saetze,
          v2.zusammenfassung_2_saetze
        ) AS zusammenfassung_neutral,
        c.fix_source,
        c.id AS correction_id
      FROM speech_analyses_v2 v2
      JOIN plenar_speeches ps ON v2.speech_id = ps.id
      LEFT JOIN speech_analyses_v2_corrections c
        ON c.rede_id = v2.rede_id AND c.segment_index = v2.segment_index
      WHERE ps.speaker = ?
    `,
      )
      .all(speakerName) as Array<{
      rede_id: string;
      segment_index: number;
      reden_typ: string | null;
      tonalitaet: string | null;
      forderungen_json: string | null;
      woertliche_zitate_json: string | null;
      framing_marker_json: string | null;
      rhetorische_mittel_json: string | null;
      konkrete_zahlen_json: string | null;
      quote_valid_count: number;
      quote_total_count: number;
      zusammenfassung_neutral: string | null;
      fix_source: string | null;
      correction_id: number | null;
    }>;

    for (const r of rows) {
      map.set(`${r.rede_id}_${r.segment_index}`, {
        rede_id: r.rede_id,
        segment_index: r.segment_index,
        reden_typ: r.reden_typ,
        tonalitaet: r.tonalitaet,
        forderungen: safeJsonArray(r.forderungen_json),
        woertliche_zitate: safeJsonArray(r.woertliche_zitate_json),
        framing_marker: safeJsonArray(r.framing_marker_json),
        rhetorische_mittel: safeJsonArray(r.rhetorische_mittel_json),
        konkrete_zahlen: safeJsonArray(r.konkrete_zahlen_json),
        zusammenfassung_neutral: stripTagLeak(r.zusammenfassung_neutral),
        quote_valid_count: r.quote_valid_count ?? 0,
        quote_total_count: r.quote_total_count ?? 0,
        fix_source: r.fix_source,
        has_correction: r.correction_id !== null,
      });
    }
  } catch {
    // Tabellen existieren noch nicht → empty
  }
  return map;
}

// Plenarbeitrag-Typen, gleiche Bezeichnungen wie auf /methodik (Live-Pipeline → Block C)
export const PLENAR_TYPE_LABELS: Record<string, string> = {
  debatte: "Reden",
  regierungserklaerung: "Regierungserklärungen",
  fragestunde_frage: "Fragen",
  fragestunde_antwort: "Antworten",
  zwischenfrage: "Debattenbeiträge", // gemerged
  kurzintervention: "Debattenbeiträge",
  erklaerung: "Erklärungen",
};

// Slug-Buckets fürs Routing (mehrere typ-Werte können in einen Slug fallen)
export const PLENAR_TYPE_SLUGS: Record<string, string[]> = {
  reden: ["debatte"],
  regierungserklaerungen: ["regierungserklaerung"],
  fragen: ["fragestunde_frage"],
  antworten: ["fragestunde_antwort"],
  debattenbeitraege: ["zwischenfrage", "kurzintervention"],
  erklaerungen: ["erklaerung"],
};

export const PLENAR_TYPE_SLUG_LABEL: Record<string, string> = {
  reden: "Reden",
  regierungserklaerungen: "Regierungserklärungen",
  fragen: "Fragen",
  antworten: "Antworten",
  debattenbeitraege: "Debattenbeiträge",
  erklaerungen: "Erklärungen",
};

// Reverse map: typ-string (lowercased) → slug. Built once from PLENAR_TYPE_SLUGS.
export const TYP_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(PLENAR_TYPE_SLUGS).flatMap(([slug, typs]) =>
    typs.map((t) => [t.toLowerCase().trim(), slug] as const),
  ),
);

export function getPlenarTypeStats(): { slug: string; label: string; count: number }[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT typ, COUNT(*) AS c FROM speech_summaries
      WHERE typ IS NOT NULL AND typ != '' GROUP BY typ
    `).all() as { typ: string; c: number }[];
    const byTyp = new Map<string, number>();
    for (const r of rows) byTyp.set(r.typ.toLowerCase().trim(), r.c);

    return Object.entries(PLENAR_TYPE_SLUGS).map(([slug, typs]) => ({
      slug,
      label: PLENAR_TYPE_SLUG_LABEL[slug],
      count: typs.reduce((sum, t) => sum + (byTyp.get(t) || 0), 0),
    })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

export interface PlenarSpeechByTypeRow {
  rede_id: string | null;
  speaker: string;
  party: string | null;
  typ: string;
  sitzung: number | null;
  datum: string | null;
  kontext: string | null;
  zusammenfassung: string | null;
  speech_index: number | null;
}

export function listPlenarSpeechesByType(slug: string, limit = 100, offset = 0): { rows: PlenarSpeechByTypeRow[]; total: number } {
  const db = getDb();
  const typs = PLENAR_TYPE_SLUGS[slug] ?? [];
  if (typs.length === 0) return { rows: [], total: 0 };

  try {
    const placeholders = typs.map(() => "?").join(",");
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM speech_summaries WHERE typ IN (${placeholders})`).get(...typs) as { c: number }).c;
    const rows = db.prepare(`
      SELECT ss.rede_id, ss.speaker, p.label AS party, ss.typ, ss.sitzung, ss.datum, ss.kontext, ss.zusammenfassung, ss.speech_index
      FROM speech_summaries ss
      LEFT JOIN politicians po ON po.id = ss.politician_id
      LEFT JOIN parties p ON p.id = po.party_id
      WHERE ss.typ IN (${placeholders})
      ORDER BY ss.sitzung DESC, ss.speech_index ASC
      LIMIT ? OFFSET ?
    `).all(...typs, limit, offset) as PlenarSpeechByTypeRow[];
    return { rows, total };
  } catch (e) {
    console.error("listPlenarSpeechesByType error:", e);
    return { rows: [], total: 0 };
  }
}

export function getAllSpeakersWithSummaries(): { speaker: string; party: string | null; count: number; sessions: number }[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT speaker,
        COUNT(*) as count,
        COUNT(DISTINCT sitzung) as sessions
      FROM speech_summaries
      GROUP BY speaker
      ORDER BY speaker COLLATE NOCASE ASC
    `).all() as any[];
  } catch {
    return [];
  }
}

export function getPlenarSessionDetail(sitzung: number) {
  const db = getDb();

  const session = db.prepare(`
    SELECT * FROM plenar_sessions WHERE sitzung = ?
  `).get(sitzung) as any;
  if (!session) return null;

  const topics = db.prepare(`
    SELECT * FROM plenar_topics WHERE session_id = ? ORDER BY topic_number
  `).all(session.id) as any[];

  const speeches = db.prepare(`
    SELECT speaker, party, role, COUNT(*) as count
    FROM plenar_speeches
    WHERE session_id = ?
    GROUP BY speaker
    ORDER BY count DESC
  `).all(session.id) as any[];

  return { ...session, topics, speeches };
}

// ============================================================
// Vote-Detail (für /abstimmungen/[poll_id])
// ============================================================

export interface VoteDetail {
  poll_id: number;
  poll_label: string | null;
  poll_url: string | null;
  poll_date: string | null;
  topics: { id: number; topic_number: string; title: string; confidence: string }[];
  byFraction: { fraction: string; yes: number; no: number; abstain: number; no_show: number; total: number }[];
  totals: { yes: number; no: number; abstain: number; no_show: number; total: number };
  speeches: VoteSpeechRow[];
  relatedPolls: { poll_id: number; poll_label: string | null; poll_date: string | null }[];
  drucksachen: VoteDrucksacheRow[];
  voteContext: {
    worum_geht_es: string;
    subjekt_drucksachen: string[];
    block_hinweis: string | null;
    bt_topic: string | null;
    ist_fallback: boolean;
  } | null;
}

export interface VoteDrucksacheRow {
  drucksache_nr: string;
  thema: string | null;
  zusammenfassung: string | null;
  titel: string | null;
  datum: string | null;
  drucksache_typ: string | null;
}

export interface VoteSpeechRow {
  speech_id: number;
  speaker: string;
  party: string | null;
  politician_id: number | null;
  topic_id: number;
  topic_number: string;
  vote: string | null; // yes | no | abstain | no_show | null (nicht in votes-Tabelle)
  tonalitaet: string | null;
  zusammenfassung: string | null;
  forderungen: string[];
  woertliche_zitate: string[];
  reden_typ: string | null;
  original_text: string | null;
  page_ref: string | null;
}

export function getVoteDetail(pollId: number): VoteDetail | null {
  const db = getDb();

  const head = db.prepare(`
    SELECT poll_id, poll_label, poll_url, poll_date
    FROM votes
    WHERE poll_id = ?
    LIMIT 1
  `).get(pollId) as { poll_id: number; poll_label: string | null; poll_url: string | null; poll_date: string | null } | undefined;
  if (!head) return null;

  const topics = db.prepare(`
    SELECT pt.id, pt.topic_number, pt.title, vtl.confidence, vtl.is_primary
    FROM vote_topic_links vtl
    JOIN plenar_topics pt ON pt.id = vtl.topic_id
    WHERE vtl.poll_id = ? AND vtl.topic_id != 0
    ORDER BY vtl.is_primary DESC, pt.topic_number
  `).all(pollId) as { id: number; topic_number: string; title: string; confidence: string; is_primary: number }[];

  const fracRows = db.prepare(`
    SELECT fraction_label AS fraction,
      SUM(CASE WHEN vote = 'yes' THEN 1 ELSE 0 END) AS yes,
      SUM(CASE WHEN vote = 'no' THEN 1 ELSE 0 END) AS no,
      SUM(CASE WHEN vote = 'abstain' THEN 1 ELSE 0 END) AS abstain,
      SUM(CASE WHEN vote = 'no_show' THEN 1 ELSE 0 END) AS no_show,
      COUNT(*) AS total
    FROM votes
    WHERE poll_id = ?
    GROUP BY fraction_label
    ORDER BY total DESC
  `).all(pollId) as { fraction: string | null; yes: number; no: number; abstain: number; no_show: number; total: number }[];

  const totals = fracRows.reduce(
    (acc, r) => ({
      yes: acc.yes + r.yes,
      no: acc.no + r.no,
      abstain: acc.abstain + r.abstain,
      no_show: acc.no_show + r.no_show,
      total: acc.total + r.total,
    }),
    { yes: 0, no: 0, abstain: 0, no_show: 0, total: 0 }
  );

  const topicIds = topics.map((t) => t.id);
  let speeches: VoteSpeechRow[] = [];
  if (topicIds.length > 0) {
    const placeholders = topicIds.map(() => "?").join(",");
    const speechRows = db.prepare(`
      SELECT psp.id AS speech_id, psp.speaker, psp.party, psp.topic_id,
        pt.topic_number,
        psp.original_text, psp.page_ref,
        p.id AS politician_id,
        v.vote AS vote,
        sa.tonalitaet, sa.zusammenfassung_2_saetze AS zusammenfassung,
        sa.forderungen_json, sa.woertliche_zitate_json, sa.reden_typ
      FROM plenar_speeches psp
      JOIN plenar_topics pt ON pt.id = psp.topic_id
      LEFT JOIN politicians p ON p.bt_redner_id = psp.redner_id
      LEFT JOIN votes v ON v.poll_id = ? AND v.politician_id = p.id
      LEFT JOIN speech_analyses_v2 sa ON sa.speech_id = psp.id
      WHERE psp.topic_id IN (${placeholders})
      ORDER BY psp.id
    `).all(pollId, ...topicIds) as any[];
    speeches = speechRows.map((r) => ({
      speech_id: r.speech_id,
      speaker: r.speaker,
      party: r.party,
      politician_id: r.politician_id,
      topic_id: r.topic_id,
      topic_number: r.topic_number,
      vote: r.vote,
      tonalitaet: r.tonalitaet,
      zusammenfassung: stripTagLeak(r.zusammenfassung),
      forderungen: safeJsonArray(r.forderungen_json),
      woertliche_zitate: safeJsonArray(r.woertliche_zitate_json),
      reden_typ: r.reden_typ,
      original_text: r.original_text,
      page_ref: r.page_ref,
    }));
  }

  // Andere Polls, die mit demselben TOP verlinkt sind (verbundene Debatte)
  let relatedPolls: { poll_id: number; poll_label: string | null; poll_date: string | null }[] = [];
  if (topicIds.length > 0) {
    const placeholders = topicIds.map(() => "?").join(",");
    relatedPolls = db.prepare(`
      SELECT v.poll_id,
        MIN(v.poll_label) AS poll_label,
        MIN(v.poll_date)  AS poll_date
      FROM vote_topic_links vtl
      JOIN votes v ON v.poll_id = vtl.poll_id
      WHERE vtl.topic_id IN (${placeholders})
        AND vtl.poll_id != ?
      GROUP BY v.poll_id
      ORDER BY poll_date, v.poll_id
    `).all(...topicIds, pollId) as { poll_id: number; poll_label: string | null; poll_date: string | null }[];
  }

  // Drucksachen zu diesem Poll — präzise Subjekt-DS aus bundestag.de-
  // Filterlist (siehe scripts/map-vote-drucksache-bundestag.ts).
  const drucksachen = db.prepare(`
    SELECT
      dp.drucksache_nr,
      a.thema,
      a.zusammenfassung,
      (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr = dp.drucksache_nr LIMIT 1) AS titel,
      (SELECT datum FROM activities WHERE drucksache_nr = dp.drucksache_nr LIMIT 1) AS datum,
      (SELECT drucksache_typ FROM activities WHERE drucksache_nr = dp.drucksache_nr LIMIT 1) AS drucksache_typ
    FROM drucksache_polls dp
    LEFT JOIN drucksache_analyses a ON a.drucksache_nr = dp.drucksache_nr AND a.analyze_error IS NULL
    WHERE dp.poll_id = ?
    ORDER BY dp.match_score DESC, dp.drucksache_nr
  `).all(pollId) as VoteDrucksacheRow[];

  // Vote-Kontext ("Worum geht es?", grounded, neutral) — optional
  let voteContext: VoteDetail["voteContext"] = null;
  try {
    const vc = db.prepare(`
      SELECT worum_geht_es, subjekt_drucksachen, block_hinweis, bt_topic, ist_fallback
      FROM vote_context WHERE poll_id = ?
    `).get(pollId) as
      | { worum_geht_es: string | null; subjekt_drucksachen: string | null; block_hinweis: string | null; bt_topic: string | null; ist_fallback: number }
      | undefined;
    if (vc?.worum_geht_es) {
      let subj: string[] = [];
      try { const a = JSON.parse(vc.subjekt_drucksachen ?? "[]"); if (Array.isArray(a)) subj = a.filter((x) => typeof x === "string"); } catch {}
      voteContext = {
        worum_geht_es: vc.worum_geht_es,
        subjekt_drucksachen: subj,
        block_hinweis: vc.block_hinweis,
        bt_topic: vc.bt_topic ? decodeHtmlEntities(vc.bt_topic) : null,
        ist_fallback: vc.ist_fallback === 1,
      };
    }
  } catch { /* vote_context-Tabelle ggf. nicht vorhanden — graceful null */ }

  return {
    poll_id: head.poll_id,
    poll_label: head.poll_label,
    poll_url: head.poll_url,
    poll_date: head.poll_date,
    topics: topics.map((t) => ({ id: t.id, topic_number: t.topic_number, title: t.title, confidence: t.confidence })),
    byFraction: fracRows.map((r) => ({ fraction: r.fraction ?? "(ohne Fraktion)", yes: r.yes, no: r.no, abstain: r.abstain, no_show: r.no_show, total: r.total })),
    totals,
    speeches,
    relatedPolls,
    drucksachen,
    voteContext,
  };
}

/**
 * Voters einer EINZELNEN Fraktion mit EINEM Stimm-Typ für eine Abstimmung.
 * Dient dem Fraktions-Drilldown auf der Vote-Detail-Page („wer hat in X
 * abweichend gestimmt?"). Sortiert nach Nachname.
 */
export interface VoterRow {
  politician_id: number | null;
  first_name: string | null;
  last_name: string | null;
  party_label: string | null;
  photo_url: string | null;
}

export function getVotersForPollByFraktionVote(
  pollId: number,
  fraktion: string,
  vote: string,
): VoterRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT v.politician_id,
           p.first_name, p.last_name, p.photo_url,
           pa.label AS party_label
    FROM votes v
    LEFT JOIN politicians p ON p.id = v.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE v.poll_id = ?
      AND COALESCE(v.fraction_label, '(ohne Fraktion)') = ?
      AND v.vote = ?
    ORDER BY p.last_name, p.first_name
  `).all(pollId, fraktion, vote) as VoterRow[];
}

export interface PollIndexRow {
  poll_id: number;
  poll_label: string | null;
  poll_date: string | null;
  yes: number;
  no: number;
  abstain: number;
  no_show: number;
  total: number;
  has_topic_match: 0 | 1;
  match_confidence: string | null; // 'high' | 'medium' | 'low' | 'none' | null
  speech_count: number;
}

export function listAllPollsForIndex(): PollIndexRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      v.poll_id,
      v.poll_label,
      v.poll_date,
      SUM(CASE WHEN v.vote = 'yes' THEN 1 ELSE 0 END) AS yes,
      SUM(CASE WHEN v.vote = 'no' THEN 1 ELSE 0 END) AS no,
      SUM(CASE WHEN v.vote = 'abstain' THEN 1 ELSE 0 END) AS abstain,
      SUM(CASE WHEN v.vote = 'no_show' THEN 1 ELSE 0 END) AS no_show,
      COUNT(*) AS total,
      CASE WHEN MAX(vtl.topic_id) IS NOT NULL AND MAX(vtl.topic_id) != 0 THEN 1 ELSE 0 END AS has_topic_match,
      MAX(CASE WHEN vtl.is_primary = 1 THEN vtl.confidence END) AS match_confidence,
      COALESCE((
        SELECT COUNT(*) FROM plenar_speeches psp
        WHERE psp.topic_id IN (
          SELECT topic_id FROM vote_topic_links
          WHERE poll_id = v.poll_id AND topic_id != 0
        )
      ), 0) AS speech_count
    FROM votes v
    LEFT JOIN vote_topic_links vtl ON vtl.poll_id = v.poll_id
    GROUP BY v.poll_id, v.poll_label, v.poll_date
    ORDER BY v.poll_date DESC, v.poll_id DESC
  `).all() as PollIndexRow[];
}

// ============================================================
// Drucksachen-Detail (für Letterboxd-Style Detail-Page)
// ============================================================

export interface DrucksacheDetail {
  drucksache_nr: string;
  batch_class: string;
  pages: number | null;
  tokens_estimate: number | null;
  pdf_url: string | null;
  // analyse
  zusammenfassung: string | null;
  kerninhalt: string[] | null;  // parsed JSON array
  thema: string[];               // from thema CSV
  tonalitaet: string | null;
  betroffene_gruppen: string | null;
  fraktion: string | null;
  dokumenttyp: string | null;
  regelung: string | null;
  begruendung: string | null;
  auswirkung: string | null;
  topic_drift_audit: string[] | null;
  model: string | null;
  prompt_version: string | null;
  generated_at: string | null;
  // header (Titel + Datum aus activities)
  titel: string | null;
  datum: string | null;
  drucksache_typ: string | null;
}

export interface MitzeichnerRow {
  politician_id: number;
  first_name: string;
  last_name: string;
  party_label: string | null;
  photo_url: string | null;
  aktivitaetsart: string;
  urheber: string | null;
}

export interface RelatedSpeechRow {
  politician_id: number;
  first_name: string;
  last_name: string;
  party_label: string | null;
  datum: string | null;
  aktivitaetsart: string;
  typ: string | null;
  titel: string | null;
}

export function getDrucksacheDetail(nr: string): DrucksacheDetail | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      a.drucksache_nr, a.batch_class,
      t.pages, t.tokens_estimate,
      a.zusammenfassung, a.kerninhalt, a.thema, a.tonalitaet,
      a.betroffene_gruppen, a.fraktion, a.dokumenttyp,
      a.regelung, a.begruendung, a.auswirkung, a.topic_drift_audit,
      a.model, a.prompt_version, a.generated_at,
      (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
      COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum,
      (SELECT drucksache_typ FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS drucksache_typ,
      (SELECT pdf_url FROM activities WHERE drucksache_nr=a.drucksache_nr AND pdf_url IS NOT NULL LIMIT 1) AS pdf_url
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE a.drucksache_nr = ? AND a.analyze_error IS NULL
  `).get(nr) as any;
  if (!row) return null;

  // Antwort-DS (und andere Regierungs-Drucksachen) haben keinen MdB-Urheber,
  // landen also nicht in `activities` und haben daher keine pdf_url von dort.
  // Aus der DS-Nr eine bundestag.de-URL rekonstruieren — Standard-Schema
  // `btd/<WP>/<floor(nr/100)-padded3>/<WP-padded-4-digit>.pdf`, z.B.
  // 21/3023 → btd/21/030/2103023.pdf
  if (!row.pdf_url) {
    const m = /^(\d+)\/(\d+)$/.exec(row.drucksache_nr);
    if (m) {
      const wp = m[1];
      const ds = parseInt(m[2], 10);
      const folder = String(Math.floor(ds / 100)).padStart(3, "0");
      const fullDs = wp.padStart(2, "0") + String(ds).padStart(5, "0");
      row.pdf_url = `https://dserver.bundestag.de/btd/${wp}/${folder}/${fullDs}.pdf`;
    }
  }

  let kerninhaltParsed: string[] | null = null;
  if (row.kerninhalt) {
    try {
      const v = JSON.parse(row.kerninhalt);
      if (Array.isArray(v)) kerninhaltParsed = v.map(String);
    } catch {}
  }
  let driftParsed: string[] | null = null;
  if (row.topic_drift_audit) {
    try {
      const v = JSON.parse(row.topic_drift_audit);
      if (Array.isArray(v)) driftParsed = v.map(String);
    } catch {}
  }
  const themaArr = (row.thema ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);

  return {
    drucksache_nr: row.drucksache_nr,
    batch_class: row.batch_class,
    pages: row.pages,
    tokens_estimate: row.tokens_estimate,
    pdf_url: row.pdf_url,
    zusammenfassung: row.zusammenfassung,
    kerninhalt: kerninhaltParsed,
    thema: themaArr,
    tonalitaet: row.tonalitaet,
    betroffene_gruppen: row.betroffene_gruppen,
    fraktion: row.fraktion,
    dokumenttyp: row.dokumenttyp,
    regelung: row.regelung,
    begruendung: row.begruendung,
    auswirkung: row.auswirkung,
    topic_drift_audit: driftParsed,
    model: row.model,
    prompt_version: row.prompt_version,
    generated_at: row.generated_at,
    titel: row.titel,
    datum: row.datum,
    drucksache_typ: row.drucksache_typ,
  };
}

/**
 * Minimal-Info zu einer Drucksache aus `activities` alleine — Fallback, wenn
 * die Drucksachen-LLM-Pipeline noch nicht durchgelaufen ist (PDF kam später
 * als das DIP-Aktivitäts-Update). Verhindert 404s in der UI für DS-Nrn,
 * die zwar aus DIP bekannt sind, aber noch kein `drucksache_analyses`-
 * Eintrag haben. Wird vom nächsten `update` automatisch hochgezogen.
 */
export interface DrucksacheSkeleton {
  drucksache_nr: string;
  titel: string;
  datum: string | null;
  urheber: string | null;
  aktivitaetsart: string;
  drucksache_typ: string | null;
  pdf_url: string | null;
  herausgeber: string | null;
}

export function getDrucksacheSkeleton(nr: string): DrucksacheSkeleton | null {
  const db = getDb();
  // ACHTUNG: `activities.titel` ist der Politiker-Name ("X, MdB, Fraktion"),
  // das echte DS-Thema steht in `activities.thema`. Fallback auf titel nur
  // falls thema NULL ist (sollte praktisch nie passieren).
  const row = db.prepare(`
    SELECT
      drucksache_nr,
      COALESCE(MAX(thema), MAX(titel)) AS titel,
      MAX(datum) AS datum,
      MAX(urheber) AS urheber,
      MIN(aktivitaetsart) AS aktivitaetsart,
      MAX(drucksache_typ) AS drucksache_typ,
      MAX(pdf_url) AS pdf_url,
      MAX(herausgeber) AS herausgeber
    FROM activities
    WHERE drucksache_nr = ?
    GROUP BY drucksache_nr
  `).get(nr) as DrucksacheSkeleton | undefined;
  return row ?? null;
}

export function getMitzeichnerForDrucksache(nr: string): MitzeichnerRow[] {
  const db = getDb();
  // Nur die Initiierenden / Mit-Einreichenden (inhaltliche Träger).
  // Berichterstattung ist eine formale Ausschuss-Rolle, KEINE Mitzeichnung —
  // siehe getBerichterstatterForDrucksache.
  return db.prepare(`
    SELECT DISTINCT a.politician_id, a.aktivitaetsart, a.urheber,
           p.first_name, p.last_name, p.photo_url,
           pa.label AS party_label
    FROM activities a
    JOIN politicians p ON p.id = a.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE a.drucksache_nr = ?
      AND a.aktivitaetsart IN ('Kleine Anfrage','Große Anfrage','Antrag','Änderungsantrag','Entschließungsantrag','Gesetzentwurf')
    ORDER BY p.last_name, p.first_name
  `).all(nr) as MitzeichnerRow[];
}

/**
 * Berichterstatter:innen einer Drucksache — formal vom Ausschuss benannt,
 * präsentieren die Beratung. Typischerweise 1 pro Fraktion → die Liste sagt
 * NICHT, dass diese Fraktionen inhaltlich mit der Beschlussempfehlung
 * übereinstimmen (sie können in der namentlichen Abstimmung dagegen stimmen).
 */
export function getBerichterstatterForDrucksache(nr: string): MitzeichnerRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT DISTINCT a.politician_id, a.aktivitaetsart, a.urheber,
           p.first_name, p.last_name, p.photo_url,
           pa.label AS party_label
    FROM activities a
    JOIN politicians p ON p.id = a.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE a.drucksache_nr = ?
      AND a.aktivitaetsart = 'Berichterstattung'
    ORDER BY pa.label, p.last_name, p.first_name
  `).all(nr) as MitzeichnerRow[];
}

export function getRelatedSpeechesForDrucksache(nr: string, limit: number = 20): RelatedSpeechRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.politician_id, a.aktivitaetsart, a.typ, a.titel, a.datum,
           p.first_name, p.last_name,
           pa.label AS party_label
    FROM activities a
    JOIN politicians p ON p.id = a.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE a.drucksache_nr = ?
      AND a.aktivitaetsart IN ('Rede','Kurzintervention','Zwischenfrage','Erwiderung','Frage','Antwort')
    ORDER BY a.datum DESC, p.last_name
    LIMIT ?
  `).all(nr, limit) as RelatedSpeechRow[];
}

// ============================================================
// Drucksachen-Related (Verfahrens-Zusammenhang + Themen-Ähnliche)
// ============================================================

export interface RelatedDsRow {
  drucksache_nr: string;
  titel: string | null;
  batch_class: string;
  datum: string | null;
  tonalitaet: string | null;
  zusammenfassung: string | null;
  fraktion: string | null;
  thema: string | null;
}

export function getDrucksacheVerfahren(nr: string): {
  parent: RelatedDsRow | null;     // Wenn diese DS eine Antwort ist: die zugehörige Anfrage
  children: RelatedDsRow[];        // Wenn diese DS eine Anfrage ist: die Antworten
} {
  const db = getDb();

  // Parent: was hat DIESE DS referenziert?
  const parentNrRow = db.prepare(`SELECT referenced_drucksache_nr FROM drucksache_texts WHERE drucksache_nr=?`).get(nr) as { referenced_drucksache_nr: string | null } | undefined;
  const parentNr = parentNrRow?.referenced_drucksache_nr ?? null;

  let parent: RelatedDsRow | null = null;
  if (parentNr) {
    parent = (db.prepare(`
      SELECT a.drucksache_nr, a.batch_class, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
             (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
             COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum
      FROM drucksache_analyses a
      JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
      WHERE a.drucksache_nr=? AND a.analyze_error IS NULL
    `).get(parentNr) as RelatedDsRow | undefined) ?? null;
  }

  // Children: welche DS referenzieren DIESE?
  const children = db.prepare(`
    SELECT a.drucksache_nr, a.batch_class, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
           (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
           COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE t.referenced_drucksache_nr = ? AND a.analyze_error IS NULL
    ORDER BY datum DESC
  `).all(nr) as RelatedDsRow[];

  return { parent, children };
}

export function getDrucksacheThemenAehnliche(nr: string, themaCsv: string, limit: number = 6): RelatedDsRow[] {
  const themas = themaCsv.split(",").map((s) => s.trim()).filter(Boolean);
  if (themas.length === 0) return [];

  const db = getDb();
  // Für jeden Thema-Tag: finde DS die diesen Tag enthalten. Scoring per Anzahl Overlap.
  const likeClauses = themas.map(() => `(a.thema LIKE '%' || ? || '%')`).join(" + ");
  const params: any[] = themas.slice();
  params.push(nr);
  params.push(limit);

  return db.prepare(`
    SELECT a.drucksache_nr, a.batch_class, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
           (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
           COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum,
           (${likeClauses}) AS overlap_score
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE a.analyze_error IS NULL
      AND a.drucksache_nr != ?
      AND (${themas.map(() => `a.thema LIKE '%' || ? || '%'`).join(" OR ")})
    GROUP BY a.drucksache_nr
    ORDER BY overlap_score DESC, datum DESC
    LIMIT ?
  `).all(
    ...themas,                                  // overlap_score CASEs
    nr,                                          // != nr
    ...themas,                                   // OR clauses
    limit,
  ) as RelatedDsRow[];
}

// ============================================================
// Drucksachen einer Politiker:in (für Profilseite-Section)
// ============================================================

export interface PoliticianDrucksacheRow {
  drucksache_nr: string;
  batch_class: string;
  titel: string | null;
  zusammenfassung: string | null;
  thema: string;
  tonalitaet: string | null;
  fraktion: string | null;
  dokumenttyp: string | null;
  datum: string | null;
  aktivitaetsart: string;     // wie diese:r MdB beteiligt war
  // Aggregat: wie viele Mitzeichner insgesamt?
  total_mitzeichner: number;
  // Bei Kleinen/Großen Anfragen: die DS-Nr der Antwort, falls in unserer
  // DB ingestiert. NULL bei Nicht-Anfrage-DS oder wenn (noch) keine Antwort
  // gefunden (kein „ausstehend"-Claim — wir wissen es schlicht nicht).
  answer_drucksache_nr: string | null;
}

/**
 * Findet alle Drucksachen (klein/gross/etc.), bei denen der/die Politiker:in
 * als Einbringer:in oder Mitzeichner:in beteiligt war.
 * Plenarbeiträge (Reden/Fragen) sind in `parlArbeit` schon abgedeckt.
 */
export function getDrucksachenForPolitician(politicianId: number, limit: number = 50): PoliticianDrucksacheRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT DISTINCT
      a.drucksache_nr,
      an.batch_class,
      (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
      an.zusammenfassung,
      an.thema,
      an.tonalitaet,
      an.fraktion,
      an.dokumenttyp,
      COALESCE(t.publication_date, a.datum) AS datum,
      a.aktivitaetsart,
      (SELECT COUNT(DISTINCT politician_id) FROM activities
        WHERE drucksache_nr=a.drucksache_nr
          AND aktivitaetsart IN ('Kleine Anfrage','Große Anfrage','Antrag','Änderungsantrag','Entschließungsantrag','Gesetzentwurf','Berichterstattung')) AS total_mitzeichner,
      (SELECT ans.drucksache_nr FROM drucksache_texts ans
        WHERE ans.batch_class='antwort' AND ans.referenced_drucksache_nr=a.drucksache_nr
        LIMIT 1) AS answer_drucksache_nr
    FROM activities a
    JOIN drucksache_analyses an ON an.drucksache_nr = a.drucksache_nr
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE a.politician_id = ?
      AND an.analyze_error IS NULL
      AND a.aktivitaetsart IN ('Kleine Anfrage','Große Anfrage','Antrag','Änderungsantrag','Entschließungsantrag','Gesetzentwurf','Berichterstattung')
    ORDER BY datum DESC NULLS LAST
    LIMIT ?
  `).all(politicianId, limit) as PoliticianDrucksacheRow[];
}

// ============================================================
// DS ↔ Vote-Verknüpfung (für Detail-Page Section)
// ============================================================

export interface DsPollRow {
  poll_id: number;
  poll_label: string;
  poll_date: string;
  poll_url: string | null;
  match_score: number;
  yes: number;
  no: number;
  abstain: number;
  noShow: number;
  total: number;
}

export function getPollsForDrucksache(nr: string): DsPollRow[] {
  const db = getDb();
  // Tabelle könnte fehlen wenn matcher nicht gelaufen — graceful
  try {
    return db.prepare(`
      SELECT
        dp.poll_id,
        v.poll_label,
        v.poll_date,
        v.poll_url,
        dp.match_score,
        SUM(CASE WHEN v.vote='yes' THEN 1 ELSE 0 END) AS yes,
        SUM(CASE WHEN v.vote='no' THEN 1 ELSE 0 END) AS no,
        SUM(CASE WHEN v.vote='abstain' THEN 1 ELSE 0 END) AS abstain,
        SUM(CASE WHEN v.vote='no_show' THEN 1 ELSE 0 END) AS noShow,
        COUNT(*) AS total
      FROM drucksache_polls dp
      JOIN votes v ON v.poll_id = dp.poll_id
      WHERE dp.drucksache_nr = ?
      GROUP BY dp.poll_id, v.poll_label, v.poll_date, v.poll_url, dp.match_score
      ORDER BY v.poll_date DESC
    `).all(nr) as DsPollRow[];
  } catch { return []; }
}

export function getDrucksachenForPoll(pollId: number): { drucksache_nr: string; match_score: number }[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT drucksache_nr, match_score FROM drucksache_polls WHERE poll_id=? ORDER BY match_score DESC
    `).all(pollId) as { drucksache_nr: string; match_score: number }[];
  } catch { return []; }
}

// ============================================================
// Andere DS derselben Fraktion (für Detail-Page Section)
// ============================================================

/**
 * Findet weitere DS derselben einbringenden Fraktion, die thematisch
 * überlappen. Hilft für Navigations-Kreis „Was hat diese Fraktion sonst
 * noch zum Thema gemacht?".
 *
 * Wichtig: Nur sinnvoll wenn die einbringende Fraktion eine Partei ist
 * (NICHT „Bundesregierung", da das keine Fraktion ist).
 */
export function getDrucksachenSameFraktion(
  nr: string,
  fraktion: string,
  themaCsv: string,
  limit: number = 6,
): RelatedDsRow[] {
  const themas = themaCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const db = getDb();

  if (themas.length === 0) {
    // Ohne Thema-Filter: einfach letzte DS der Fraktion
    return db.prepare(`
      SELECT a.drucksache_nr, a.batch_class, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
             (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
             COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum
      FROM drucksache_analyses a
      JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
      WHERE a.analyze_error IS NULL
        AND a.drucksache_nr != ?
        AND a.fraktion = ?
      ORDER BY datum DESC
      LIMIT ?
    `).all(nr, fraktion, limit) as RelatedDsRow[];
  }

  // Mit Thema-Overlap-Scoring
  const likeClauses = themas.map(() => `(a.thema LIKE '%' || ? || '%')`).join(" + ");
  return db.prepare(`
    SELECT a.drucksache_nr, a.batch_class, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
           (SELECT COALESCE(thema, titel) FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1) AS titel,
           COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum,
           (${likeClauses}) AS overlap_score
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE a.analyze_error IS NULL
      AND a.drucksache_nr != ?
      AND a.fraktion = ?
    ORDER BY overlap_score DESC, datum DESC
    LIMIT ?
  `).all(...themas, nr, fraktion, limit) as RelatedDsRow[];
}
