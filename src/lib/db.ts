import Database from "better-sqlite3";
import path from "path";
import { BERLIN_POLITIKFELDER, BERLIN_QUERSCHNITT } from "./berlin-themen-struktur";

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
    registerSearchFunctions(_db);
  }
  return _db;
}

// Unicode-aware Such-Helfer, einmalig an der Connection registriert (genutzt von der
// Politiker-, Reden-, Drucksachen- und Topic-Suche):
//  - lower_de: Umlaut-korrektes LOWER (SQLite-LOWER ist ASCII-only).
//  - word_match(text, term): 1, wenn `term` am ANFANG EINES WORTES in `text` vorkommt
//    (Wortgrenze davor), sonst 0. Ersetzt die alte %term%-Substring-Suche, damit „ai"
//    nicht mehr mittendrin „FrohnmAIer"/„UkrAIne" matcht (Wortgrenze: Nicht-Buchstabe/Ziffer).
function registerSearchFunctions(db: Database.Database) {
  db.function("lower_de", { deterministic: true }, (s: unknown) =>
    typeof s === "string" ? s.toLowerCase() : null
  );
  db.function("word_match", { deterministic: true }, (text: unknown, term: unknown) => {
    if (typeof text !== "string" || typeof term !== "string" || term.length === 0) return 0;
    const h = text.toLowerCase();
    const n = term.toLowerCase();
    let from = 0;
    for (;;) {
      const idx = h.indexOf(n, from);
      if (idx === -1) return 0;
      const prev = idx === 0 ? "" : h[idx - 1];
      if (idx === 0 || !/[\p{L}\p{N}]/u.test(prev)) return 1; // Wortgrenze davor
      from = idx + 1;
    }
  });
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

// Berlin-Pilot: das Abgeordnetenhaus von Berlin (parliament_id 2) wird
// schrittweise freigeschaltet. Detail-Seiten sind bereits per Direkt-URL
// erreichbar (Berlin-Klausel in IS_POLITICIAN_VISIBLE_SQL); Listen, Suche und
// Counts bleiben bis zum offiziellen Live-Schalten Bundestag-only
// (IS_POLITICIAN_ACTIVE_SQL unverändert).
export const BERLIN_PILOT_PARLIAMENT_ID = 2;

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
  OR EXISTS (
    SELECT 1 FROM mandates m_bln
    JOIN parliament_periods pp_bln ON m_bln.parliament_period_id = pp_bln.id
    WHERE m_bln.politician_id = p.id AND m_bln.type = 'mandate'
      AND pp_bln.parliament_id = ${BERLIN_PILOT_PARLIAMENT_ID}
  )
)`;

/**
 * Strict Active — für LISTEN, COUNTS, FILTER-Dropdowns.
 * Nur aktuell aktive Politiker:innen — verstorbene/ausgeschiedene MdBs raus.
 *
 * Leitprinzip der Liste: AKTUELLE Politiker:innen des Bundestags — gewählte
 * Abgeordnete + Regierungsmitglieder. NICHT enthalten: Verwaltung/Diplomatie
 * (beamtete Staatssekretär:innen, Botschafter:innen, Regierungssprecher — das sind
 * keine Politiker:innen, sie tauchen nur als Anfrage-Beantworter in den Daten auf),
 * der Wehrbeauftragte (Organ DES Bundestages, kein Mandat) und ehemalige MdB. Diese
 * sind über IS_POLITICIAN_VISIBLE_SQL weiter per Detail-URL bzw. (Ehemalige) über
 * IS_POLITICIAN_SEARCHABLE_SQL in der Suche erreichbar — nur nicht in der Liste.
 *
 * Politiker:in ist aktiv wenn:
 *   - id >= 900000 als Quereinsteiger-Kabinettsmitglied (rolle Bundes-/Staatsminister,
 *     Bundes-Amt gesetzt, kein Landes-Amt), ODER
 *   - mindestens ein Bundestags-Mandat mit end_date NULL/leer/zukünftig.
 *
 * Damit (Soll: 635 = 630 MdB + 5 Quereinsteiger-Minister):
 *   - Reiche/Prien/Wildberger/Weimer/Hubig → sichtbar (Quereinsteiger-Minister)
 *   - Stein/Mandrella → sichtbar (Stammdaten-MdB MIT Bundestags-Mandat → 2. Zweig)
 *   - Habeck/Baerbock/Foullong/Träger → ausgeblendet (ehemalig → SEARCHABLE/VISIBLE)
 *   - Annen/von Geyr/Kotsch → ausgeblendet (Verwaltung, keine Politiker)
 *   - Otte → ausgeblendet (Wehrbeauftragter, kein Mandat)
 *   - Gräff/Czaja/Friederici → ausgeblendet (Berliner AGH-Mitglieder, Landtags-Mandat)
 *
 * HISTORIE (2026-06-03, CAIS/Bieber-Feedback „686 statt 630"): Der frühere Filter
 * war zu weit. Lecks: (a) Land:%-Stringtest verfehlte 30 Berliner AGH-Mitglieder
 * (amt=NULL); (b) der gueltig_bis-Pfad zog 20 Bundesrats-Stammdaten-Nicht-MdB
 * (Staatssekr./Botschafter/Sprecher) + Otte rein. Verifiziert gegen bundestag.de.
 * Jetzt exakt auf Mandat (MdB) und Kabinett (rolle/amt) gezielt — die einzig
 * belastbaren Signale. Deckt sich mit getDbStats.cabinetQuereinsteiger.
 */
export const IS_POLITICIAN_ACTIVE_SQL = `(
  (p.id >= 900000
    AND p.rolle IN ('Bundesminister', 'Staatsminister')
    AND p.amt IS NOT NULL AND p.amt != '' AND p.amt NOT LIKE 'Land:%'
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

/**
 * Ehemalige MdB — gewählte Abgeordnete OHNE aktuelles Mandat. Eigene, klar
 * gelabelte Gruppe (NICHT in der Liste/den 635, aber in der Suche auffindbar).
 * Zwei Repräsentationen in der Doppel-Pipeline:
 *   - id >= 900000 Stammdaten-Profil mit rolle='MdB' und gueltig_bis in der
 *     Vergangenheit (Baerbock/Habeck/Foullong — kein mandates-Row), ODER
 *   - hatte ein Bundestags-Mandat, das beendet ist (Träger ✝ — end_date past).
 * Keine Platzhalter (Literal 'bundestag'), damit als Such-Zusatz frei kombinierbar.
 */
export const IS_POLITICIAN_FORMER_MDB_SQL = `(
  ( p.id >= 900000 AND p.rolle = 'MdB'
    AND p.gueltig_bis IS NOT NULL AND p.gueltig_bis != '' AND p.gueltig_bis <= date('now') )
  OR (
    EXISTS (
      SELECT 1 FROM mandates m_fb
      JOIN parliament_periods pp_fb ON m_fb.parliament_period_id = pp_fb.id
      JOIN parliaments par_fb ON pp_fb.parliament_id = par_fb.id
      WHERE m_fb.politician_id = p.id AND m_fb.type = 'mandate' AND par_fb.type = 'bundestag'
    )
    AND NOT EXISTS (
      SELECT 1 FROM mandates m_fa
      JOIN parliament_periods pp_fa ON m_fa.parliament_period_id = pp_fa.id
      JOIN parliaments par_fa ON pp_fa.parliament_id = par_fa.id
      WHERE m_fa.politician_id = p.id AND m_fa.type = 'mandate' AND par_fa.type = 'bundestag'
        AND (m_fa.end_date IS NULL OR m_fa.end_date = '' OR m_fa.end_date > date('now'))
    )
  )
)`;

/**
 * Such-Filter: aktuelle Politiker:innen (ACTIVE) PLUS ehemalige MdB. Damit findet
 * die Personensuche auch Baerbock/Habeck/Träger (gelabelt „ehem."), während die
 * Liste streng aktuell bleibt. Verwaltung/Berlin bleiben außen vor (weder ACTIVE
 * noch FORMER). Platzhalter-Zahl = die von ACTIVE (FORMER hat keine).
 */
export const IS_POLITICIAN_SEARCHABLE_SQL = `(${IS_POLITICIAN_ACTIVE_SQL} OR ${IS_POLITICIAN_FORMER_MDB_SQL})`;

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
  // AGH-Profil (Abgeordnetenhaus Berlin) als dritte, eigenständige CV-Quelle
  cv_agh_json: string | null;
  cv_agh_generated_at: string | null;
  agh_bio_url: string | null;
  homepage_source: string | null;
  source_conflicts: string | null;
  source_coherence_checked_at: string | null;
  // Stammdaten-Felder (für Quereinsteiger-Bundesminister:innen + Stammdaten-MdBs, id ≥ 900000)
  rolle: string | null;
  amt: string | null;
  gueltig_ab: string | null;
  gueltig_bis: string | null;
  bt_redner_id: string | null;
  /** Nur in searchPoliticiansDb gesetzt: 1 = ehemaliges MdB (kein aktuelles Mandat). */
  is_former?: number;
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

/**
 * Berlin-gescopte Personensuche — für die Berlin-Suche (searchBerlin /
 * searchBerlinByType). Liefert Politiker:innen mit IRGENDEINEM Berlin-Mandat
 * (aktiv ODER beendet), `is_former=1` wenn KEIN aktives Berlin-Mandat mehr
 * besteht (→ „ehem."-Badge wie beim Bundestag).
 *
 * WICHTIG: Berlin darf NICHT searchPoliticiansDb (Bundestags-Scope) benutzen.
 * Früher tat es das und fand Berliner nur, weil die 30 berlin-mdl-backfill-
 * Profile durch das amt=NULL-Leck in den Bundestags-Filter rutschten. Seit der
 * Scope-Fix dieses Leck schließt (2026-06-03), MUSS Berlin über sein eigenes
 * Mandat scopen — sonst verschwinden die Berliner aus der Berlin-Suche.
 * Tripwire: scripts/check-bundestag-scope.ts (INV4).
 */
export function searchBerlinPoliticiansDb(query: string, limit = 30): PoliticianRow[] {
  const db = getDb();
  const term = query.trim();
  return db
    .prepare(
      `SELECT p.*, pa.label as party_label,
         CASE WHEN NOT EXISTS (
           SELECT 1 FROM mandates m_act
           JOIN parliament_periods pp_act ON m_act.parliament_period_id = pp_act.id
           WHERE m_act.politician_id = p.id AND m_act.type = 'mandate'
             AND pp_act.parliament_id = ${BERLIN_PILOT_PARLIAMENT_ID}
             AND (m_act.end_date IS NULL OR m_act.end_date = '' OR m_act.end_date > date('now'))
         ) THEN 1 ELSE 0 END AS is_former
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE (word_match(p.last_name, ?) OR word_match(p.first_name, ?)
         OR word_match(p.first_name || ' ' || p.last_name, ?))
         AND EXISTS (
           SELECT 1 FROM mandates m_bln
           JOIN parliament_periods pp_bln ON m_bln.parliament_period_id = pp_bln.id
           WHERE m_bln.politician_id = p.id AND m_bln.type = 'mandate'
             AND pp_bln.parliament_id = ${BERLIN_PILOT_PARLIAMENT_ID}
         )
       ORDER BY is_former ASC, p.last_name, p.first_name
       LIMIT ?`,
    )
    .all(term, term, term, limit) as PoliticianRow[];
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
  // Wortanfang-Match (kein %substring%) — „ai" matcht keine Namen wie „FrohnmAIer".
  const term = query.trim();
  return db
    .prepare(
      `SELECT p.*, pa.label as party_label,
         CASE WHEN ${IS_POLITICIAN_FORMER_MDB_SQL} THEN 1 ELSE 0 END AS is_former
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE (word_match(p.last_name, ?) OR word_match(p.first_name, ?)
         OR word_match(p.first_name || ' ' || p.last_name, ?))
         AND ${IS_POLITICIAN_SEARCHABLE_SQL}
       ORDER BY is_former ASC, p.last_name, p.first_name
       LIMIT ?`
    )
    .all(term, term, term, ...VISIBLE_PARLIAMENT_TYPE_VALUES, limit) as PoliticianRow[];
}

export interface BundestagLandingSnapshot {
  latestSitzung: {
    sitzung: number;
    datum: string;
    redenCount: number;
    plpr: string;
  } | null;
  latestVotes: VoteIndexEntry[];
  /** Drucksachen-Zusammenfassung je Vote (key = VoteIndexEntry.id), wo verfügbar. */
  voteSummaries: Record<string, string | null>;
  latestGesetzentwuerfe: {
    drucksacheNr: string;
    titel: string;
    zusammenfassung: string | null;
    datum: string | null;
    einbringer: string | null;
  }[];
  latestAnfragen: {
    drucksacheNr: string;
    titel: string;
    zusammenfassung: string | null;
    datum: string | null;
    fraktion: string | null;
  }[];
}

/**
 * Landing-Snapshot für die Bundestag-Hauptseite — symmetrisch zu getBerlinSnapshot:
 * letzte Plenarsitzung + aktuelle Abstimmungen + Gesetzentwürfe + Kleine Anfragen.
 */
export function getBundestagLandingSnapshot(): BundestagLandingSnapshot {
  const db = getDb();

  // 1. Letzte Plenarsitzung
  const sess = db
    .prepare(
      `SELECT id, wahlperiode, sitzung, datum FROM plenar_sessions
       WHERE datum IS NOT NULL AND datum != '' ORDER BY datum DESC, sitzung DESC LIMIT 1`
    )
    .get() as { id: number; wahlperiode: number; sitzung: number; datum: string } | undefined;
  let latestSitzung: BundestagLandingSnapshot["latestSitzung"] = null;
  if (sess) {
    const redenCount = (db
      .prepare(`SELECT COUNT(*) AS c FROM plenar_speeches WHERE session_id = ?`)
      .get(sess.id) as { c: number }).c;
    latestSitzung = {
      sitzung: sess.sitzung,
      datum: sess.datum,
      redenCount,
      plpr: `${sess.wahlperiode}/${sess.sitzung}`,
    };
  }

  // 2. Aktuelle Abstimmungen — GLEICHE Quelle wie /abstimmungen: listAllVotesForIndex
  //    vereint namentliche (Tabelle votes) + Handzeichen (bundestag_votes), nach Datum
  //    sortiert. Petition/Personenwahl wie auf der Liste per Default raus. Top-5 =
  //    exakt die obersten der Abstimmungs-Liste (Konsistenz Landing ↔ /abstimmungen).
  const latestVotes = listAllVotesForIndex()
    .filter((v) => v.subtype !== "petition" && v.subtype !== "personenwahl")
    .slice(0, 14);
  // Zusammenfassung je Vote — füllt die Karte. Bevorzugt der Abstimmungs-Kontext
  // „Worum geht es?" (vote_context, nur namentliche Polls), sonst die Zusammenfassung
  // der verknüpften Drucksache (für Handzeichen-Votes).
  const voteSummaries: Record<string, string | null> = {};
  for (const v of latestVotes) {
    let summ: string | null = null;
    if (v.type === "namentlich") {
      summ = (db
        .prepare(`SELECT worum_geht_es FROM vote_context WHERE poll_id = ? LIMIT 1`)
        .get(v.poll_id) as { worum_geht_es: string | null } | undefined)?.worum_geht_es ?? null;
    }
    if (!summ) {
      const nr = v.drucksache_nrn[0];
      summ = nr
        ? (db
            .prepare(`SELECT zusammenfassung FROM drucksache_analyses WHERE drucksache_nr=? LIMIT 1`)
            .get(nr) as { zusammenfassung: string | null } | undefined)?.zusammenfassung ?? null
        : null;
    }
    voteSummaries[v.id] = summ;
  }

  // 3+4. Drucksachen nach amtlichem DIP-Typ (dokumenttyp) — NICHT batch_class:
  // batch_class ist ein Längen-Tier ('klein' enthält ~694 Anträge, 'gross' enthält
  // Unterrichtungen/Große Anfragen). dokumenttyp ist der amtliche Typ.
  // Titel/Datum: activities zuerst (kuratiertes Kurz-Thema), aber mit Fallback
  // auf dip_ds_titles + drucksache_texts — Regierungs-/Bundesrats-Entwürfe haben
  // KEINE activities-Zeilen (mitzeichner-getrieben) und fielen sonst komplett raus.
  const drucksByKlasse = (klasse: string) =>
    (db
      .prepare(
        `SELECT da.drucksache_nr, da.zusammenfassung, da.fraktion,
                COALESCE(
                  (SELECT thema FROM activities WHERE drucksache_nr=da.drucksache_nr AND thema IS NOT NULL LIMIT 1),
                  (SELECT titel FROM activities WHERE drucksache_nr=da.drucksache_nr AND titel IS NOT NULL LIMIT 1),
                  (SELECT titel FROM dip_ds_titles t WHERE t.drucksache_nr=da.drucksache_nr)
                ) AS titel,
                COALESCE(
                  (SELECT datum FROM activities WHERE drucksache_nr=da.drucksache_nr AND datum IS NOT NULL ORDER BY datum DESC LIMIT 1),
                  (SELECT publication_date FROM drucksache_texts dt WHERE dt.drucksache_nr=da.drucksache_nr)
                ) AS datum
         FROM drucksache_analyses da
         WHERE da.dokumenttyp = ? AND da.analyze_error IS NULL
         ORDER BY datum DESC LIMIT 18`
      )
      .all(klasse) as {
      drucksache_nr: string;
      zusammenfassung: string | null;
      fraktion: string | null;
      titel: string | null;
      datum: string | null;
    }[])
      .filter((r) => r.titel && r.datum)
      .map((r) => ({
        drucksacheNr: r.drucksache_nr,
        titel: r.titel as string,
        zusammenfassung: r.zusammenfassung,
        datum: r.datum,
        fraktion: r.fraktion,
        einbringer: r.fraktion,
      }));

  const latestGesetzentwuerfe = drucksByKlasse("Gesetzentwurf").map((r) => ({
    drucksacheNr: r.drucksacheNr,
    titel: r.titel,
    zusammenfassung: r.zusammenfassung,
    datum: r.datum,
    einbringer: r.einbringer,
  }));
  const latestAnfragen = drucksByKlasse("Kleine Anfrage").map((r) => ({
    drucksacheNr: r.drucksacheNr,
    titel: r.titel,
    zusammenfassung: r.zusammenfassung,
    datum: r.datum,
    fraktion: r.fraktion,
  }));

  return { latestSitzung, latestVotes, voteSummaries, latestGesetzentwuerfe, latestAnfragen };
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

export interface BerlinMethodikCounts {
  redenTotal: number;
  redenNichtPraesidium: number;
  redenAnalysiert: number;
  sitzungen: number;
  quoteValid: number;
  quoteTotal: number;
  dsAnalysen: number;
  dsByKlasse: { klasse: string; count: number }[];
  votesTotal: number;
  votesEcht: number;
  votesByOutcome: { outcome: string; count: number }[];
  topSummaries: number;
  politiker: number;
  politikerMitCv: number;
  politikerMitHomepage: number;
  politikerMitFoto: number;
}

/** Live-Zahlen für die Berlin-Methodik-Seite. Alle aus berlin_*-Tabellen. */
export function getBerlinMethodikCounts(): BerlinMethodikCounts {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { c: number } | undefined)?.c ?? 0;
  const bp = `WITH bp AS (SELECT DISTINCT politician_id AS id FROM berlin_speeches WHERE politician_id IS NOT NULL)`;
  return {
    redenTotal: one(`SELECT COUNT(*) c FROM berlin_speeches`),
    redenNichtPraesidium: one(`SELECT COUNT(*) c FROM berlin_speeches WHERE is_praesidium=0`),
    redenAnalysiert: one(`SELECT COUNT(*) c FROM berlin_speech_analyses`),
    sitzungen: one(`SELECT COUNT(DISTINCT sitzung_nr) c FROM berlin_speeches WHERE sitzung_nr IS NOT NULL`),
    quoteValid: one(`SELECT COALESCE(SUM(quote_valid_count),0) c FROM berlin_speech_analyses WHERE quote_total_count>0`),
    quoteTotal: one(`SELECT COALESCE(SUM(quote_total_count),0) c FROM berlin_speech_analyses WHERE quote_total_count>0`),
    dsAnalysen: one(`SELECT COUNT(*) c FROM berlin_drucksachen_analyses`),
    dsByKlasse: db.prepare(`SELECT klasse, COUNT(*) AS count FROM berlin_drucksachen_analyses GROUP BY klasse ORDER BY COUNT(*) DESC`).all() as { klasse: string; count: number }[],
    votesTotal: one(`SELECT COUNT(*) c FROM berlin_votes`),
    votesEcht: one(`SELECT COUNT(*) c FROM berlin_votes WHERE outcome!='kein_vote'`),
    votesByOutcome: db.prepare(`SELECT outcome, COUNT(*) AS count FROM berlin_votes WHERE outcome!='kein_vote' GROUP BY outcome ORDER BY COUNT(*) DESC`).all() as { outcome: string; count: number }[],
    topSummaries: one(`SELECT COUNT(*) c FROM berlin_top_summaries`),
    politiker: one(`${bp} SELECT COUNT(*) c FROM bp`),
    politikerMitCv: one(`${bp} SELECT COUNT(*) c FROM bp JOIN politicians p ON p.id=bp.id WHERE p.cv_json IS NOT NULL AND p.cv_json!=''`),
    politikerMitHomepage: one(`${bp} SELECT COUNT(*) c FROM bp JOIN politicians p ON p.id=bp.id WHERE p.cv_homepage_json IS NOT NULL AND p.cv_homepage_json!=''`),
    politikerMitFoto: one(`${bp} SELECT COUNT(*) c FROM bp JOIN politicians p ON p.id=bp.id WHERE p.photo_url IS NOT NULL AND p.photo_url!=''`),
  };
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
    cvStatementsTotal: (() => {
      // SQL-json_extract scheitert bei einzelnen legacy-Einträgen mit malformed
      // Inner-Escapes (z.B. Geisel id=119641 hat `\"` Unicode-Mix im ausbildung-
      // Sub-Wert). Statt SQL-Loop in TS iterieren mit try-catch — robuster gegen
      // die geteilte DB als die json_type-SQL-Variante (kann nicht crashen).
      try {
        const rows = db.prepare(`SELECT cv_json FROM politicians WHERE cv_json IS NOT NULL AND cv_json != ''`).all() as { cv_json: string }[];
        let total = 0;
        for (const r of rows) {
          try {
            const cv = JSON.parse(r.cv_json);
            for (const key of ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"]) {
              const v = cv?.[key];
              if (Array.isArray(v)) total += v.length;
              else if (typeof v === "string") {
                // Legacy stringified array — versuchen zu parsen
                try {
                  const parsed = JSON.parse(v);
                  if (Array.isArray(parsed)) total += parsed.length;
                } catch { /* skip */ }
              }
            }
          } catch { /* skip malformed row */ }
        }
        return total;
      } catch { return 0; }
    })(),
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
  // Berlin-Pilot: nur im eigenen Filter (?parlament=2) sichtbar — Default-Liste,
  // globale Counts und Suche bleiben Bundestag.
  const berlinScope = params.parliamentId === BERLIN_PILOT_PARLIAMENT_ID;
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

  // Aktiv-/Sichtbarkeits-Filter — Bundestag-typisiert oder Berlin-Pilot-gescopt
  if (berlinScope) {
    conditions.push(`EXISTS (
      SELECT 1 FROM mandates m_act
      JOIN parliament_periods pp_act ON m_act.parliament_period_id = pp_act.id
      WHERE m_act.politician_id = p.id AND m_act.type = 'mandate'
        AND pp_act.parliament_id = ${BERLIN_PILOT_PARLIAMENT_ID})`);
  } else {
    conditions.push(IS_POLITICIAN_ACTIVE_SQL);
    args.push(...VISIBLE_PARLIAMENT_TYPE_VALUES);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  // Pro Politiker:in nur das aktive Mandat des relevanten Scopes anzeigen
  // (sonst erscheinen MdBs mit zusätzlichen Landtags-Mandaten doppelt — siehe
  // Carsten Becker: Bundestag + Saarland). end_date-Filter blendet beendete
  // Mandate aus (z. B. ✝ Träger).
  const mandateScope = berlinScope
    ? `par_v.id = ${BERLIN_PILOT_PARLIAMENT_ID}`
    : `par_v.type IN (${VISIBLE_PARLIAMENT_TYPES.map(() => "?").join(", ")})`;
  const joinArgs: string[] = berlinScope ? [] : [...VISIBLE_PARLIAMENT_TYPE_VALUES];
  const visibleMandateJoin = `
    LEFT JOIN (
      SELECT m_v.politician_id, m_v.fraction, m_v.constituency,
             par_v.id AS parliament_id, par_v.label AS parliament_label, par_v.type AS parliament_type
      FROM mandates m_v
      JOIN parliament_periods pp_v ON m_v.parliament_period_id = pp_v.id
      JOIN parliaments par_v ON pp_v.parliament_id = par_v.id
      WHERE m_v.type = 'mandate' AND ${mandateScope}
        AND (m_v.end_date IS NULL OR m_v.end_date = '' OR m_v.end_date > date('now'))
      GROUP BY m_v.politician_id
    ) vm ON vm.politician_id = p.id
  `;

  const whereSql = where
    .replace(/\bm\.fraction\b/g, "vm.fraction")
    .replace(/\bpar\.id\b/g, "vm.parliament_id");

  const countSql = `
    SELECT COUNT(DISTINCT p.id) as c
    FROM politicians p
    LEFT JOIN parties pa ON p.party_id = pa.id
    ${visibleMandateJoin}
    ${whereSql}
  `;
  const total = (db.prepare(countSql).get(...joinArgs, ...args) as { c: number }).c;

  const dataSql = `
    SELECT p.*, pa.label as party_label,
      vm.parliament_label, vm.parliament_type,
      vm.fraction, vm.constituency,
      (SELECT COUNT(*) FROM activities act WHERE act.politician_id = p.id) as activity_count
    FROM politicians p
    LEFT JOIN parties pa ON p.party_id = pa.id
    ${visibleMandateJoin}
    ${whereSql}
    ORDER BY p.last_name, p.first_name
    LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(dataSql).all(...joinArgs, ...args, limit, offset) as PoliticianListRow[];

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

// ============================================================
// KOMPAKT-PROFIL — scan-first Steckbrief (eine Karte, ein Viewport).
// Komponiert bestehende Helfer + zwei eigene Ableitungen (Schwerpunkte,
// Nebeneinkünfte-Untergrenze). Reine Label:Wert/Chip-Daten, keine Sätze.
// Mindset: [[feedback_consumer_scan_first]] / [[reference_ux_text_budget]].
// ============================================================

// Bundestags-Vergütungsstufen (Verhaltensregeln WP20+): Untergrenze je Stufe.
// Index = Stufe (1–10); Stufe 10 = „über 250.000" → konservativ 250.000.
const SIDEJOB_STUFE_FLOOR = [0, 1000, 3500, 7000, 15000, 30000, 50000, 75000, 100000, 150000, 250000];

// Reine Mandats-Bezeichnungen sind KEIN Beruf — Feld dann weglassen statt „Beruf: MdB".
const MANDAT_NUR = /^(mdb|mdep|mda|mdl|abgeordnete[r]?|mitglied des (deutschen )?bundestage?s|mitglied des abgeordnetenhauses|bundesminister(in)?|staatsminister(in)?|senator(in)?|regierende[r]? bürgermeister(in)?|parlamentarische[r]? staatssekretär(in)?)\b/i;

function cleanBeruf(occupation: string | null): string | null {
  if (!occupation) return null;
  const o = occupation.replace(/\s*\n\s*/g, ", ").trim();
  if (!o || MANDAT_NUR.test(o)) return null;
  return o.length > 75 ? o.slice(0, 74).replace(/[\s,;]+\S*$/, "") + "…" : o;
}

function cleanAusbildung(education: string | null): string | null {
  if (!education) return null;
  const e = education.replace(/\s*\n\s*/g, ", ").trim();
  if (!e) return null;
  // Ausbildung darf zweizeilig umbrechen → großzügigere Grenze (~2 Zeilen).
  return e.length > 150 ? e.slice(0, 149).replace(/[\s,;]+\S*$/, "") + "…" : e;
}

// "269 - Backnang – Schwäbisch Gmünd (Bundestag 2025 - 2029)" → "Backnang – Schwäbisch Gmünd"
function cleanWahlkreis(c: string | null | undefined): string | null {
  if (!c) return null;
  const w = c.replace(/^\s*\d+\s*[-–]\s*/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  return w || null;
}

// cv_json-Fallback: wenn das abgeordnetenwatch-Feld leer ist oder nur das Mandat
// nennt, ziehen wir Ausbildung/Beruf aus dem strukturierten Lebenslauf nach.
// Beruf = letzter (= jüngster) Eintrag aus `beruflicher_werdegang` — das ist die
// nicht-politische Berufstätigkeit (politische Stationen stehen separat). Ist
// dort nichts, hat die Person keinen erfassten Nicht-Politik-Beruf → bleibt leer.
function parseCvLebenslauf(
  cvJson: string | null,
): { ausbildung: string | null; doktorgrad: string | null; beruf: string | null } {
  const empty = { ausbildung: null, doktorgrad: null, beruf: null };
  if (!cvJson) return empty;
  const cap = (t: string | null | undefined, max = 75): string | null => {
    if (!t) return null;
    const s = t.replace(/\s*\n\s*/g, ", ").trim();
    if (!s) return null;
    return s.length > max ? s.slice(0, max - 1).replace(/[\s,;]+\S*$/, "") + "…" : s;
  };
  try {
    const o = JSON.parse(cvJson) as {
      ausbildung?: { text?: string }[];
      beruflicher_werdegang?: { text?: string }[];
    };
    const ausEntries = (o.ausbildung ?? [])
      .map((e) => e?.text?.trim())
      .filter((t): t is string => !!t);

    // Höchster Grad als kurzer Marker (z. B. "Dr. phil."); sonst "promoviert".
    let doktorgrad: string | null = null;
    for (const t of ausEntries) {
      const m = t.match(/\bDr\.?\s?(?:phil|med|jur|rer\.?\s?nat|rer\.?\s?pol|theol|-?Ing|h\.?\s?c|paed|oec|mult)\.?/i);
      if (m) { doktorgrad = m[0].replace(/\s+/g, " ").trim(); break; }
      if (!doktorgrad && /\bpromotion|\bdissertation|\bhabilitation/i.test(t)) doktorgrad = "promoviert";
    }

    // Beste Studien-Zeile als Basis: Studienfach + Abschluss bevorzugt; Schule/
    // Volontariat und die reine Promotions-Erzählung NICHT (Grad kommt als Marker).
    const baseRank = (s: string): number => {
      if (/promotion|dissertation|habilitation/i.test(s)) return -1;
      if (/abitur|gymnasium|\bschule|realschule|volontariat|\blehre\b|ausbildung zur|ausbildung zum/i.test(s)) return -1;
      if (/magister|master|diplom|staatsexamen|lizentiat/i.test(s)) return 3;
      if (/studium|bachelor|hochschul|universit/i.test(s)) return 2;
      return 1;
    };
    let best: string | null = null;
    let bestR = 0;
    for (const t of ausEntries) {
      const r = baseRank(t);
      if (r > bestR) { bestR = r; best = t; }
    }

    // Beruf = ERSTER (= ursprünglicher) Nicht-Politik-Werdegang.
    const wd = (o.beruflicher_werdegang ?? [])
      .map((e) => e?.text?.trim())
      .filter((t): t is string => !!t && !MANDAT_NUR.test(t));

    return { ausbildung: cap(best, 150), doktorgrad, beruf: wd.length ? cap(wd[0]) : null };
  } catch {
    return empty;
  }
}

export interface KompaktSchwerpunkt { feld: string; count: number }
export interface KompaktNebeneinkuenfte {
  kind: "betrag" | "unbeziffert" | "keine";
  minEuro: number;      // Summe der Stufen-Untergrenzen (nur kind='betrag')
  anzahl: number;       // gemeldete Nebentätigkeiten
}
export interface KompaktAbstimmung {
  verfuegbar: boolean;  // false = keine namentlichen Abstimmungen (z. B. Berlin = Fraktionsebene)
  teilgenommen: number;
  gesamt: number;
  abweichungen: number;
  fraktionslos: boolean;
}
export interface PoliticianKompakt {
  id: number;
  name: string;
  party_label: string | null;
  rolle: string | null;
  wahlkreis: string | null;
  parliament_label: string | null;
  year_of_birth: number | null;
  photo_url: string | null;
  ausbildung: string | null;
  beruf: string | null;
  // "vorhanden" = beruf gesetzt; "keiner" = CV vorhanden, kein Nicht-Politik-Beruf
  // (→ ehrlich „kein Beruf vor dem Mandat"); "unbekannt" = keine CV-Daten (Zeile weg).
  berufStatus: "vorhanden" | "keiner" | "unbekannt";
  berufKategorie: string | null; // Sektor-Enum (aus cv_kompakt) — für Aggregat-Analysen
  ausschuesse: { label: string; rolle: string | null }[];
  schwerpunkte: KompaktSchwerpunkt[];
  nebeneinkuenfte: KompaktNebeneinkuenfte;
  abstimmung: KompaktAbstimmung;
  social: { label: string; url: string }[]; // offizielle Online-Präsenz (Handles aus Stammdaten)
  // Pilot: schriftliche Fragen an die Bundesregierung (drucksache_qa_paare). null = keine.
  fragen: { anzahl: number; query: string } | null;
}

export function getPoliticianKompakt(id: number): PoliticianKompakt | undefined {
  const p = getPoliticianDb(id);
  if (!p) return undefined;
  const db = getDb();

  // Aktuellstes Mandat → Wahlkreis + Parlament-Label
  const mandate = db.prepare(
    `SELECT constituency, label, type FROM mandates WHERE politician_id = ?
     ORDER BY COALESCE(end_date,'9999-12-31') DESC, COALESCE(start_date,'') DESC LIMIT 1`,
  ).get(id) as { constituency: string | null; label: string | null; type: string | null } | undefined;

  // Schwerpunkte: distinkte Reden (rede_unterthemen.feld, sauber) + distinkte
  // Drucksachen (item_topics.aw_field) je Politikfeld, zusammengezählt, Top 5.
  const schwerpunkte = db.prepare(
    `SELECT feld, SUM(n) AS count FROM (
       SELECT ru.feld AS feld, COUNT(DISTINCT s.rede_id) AS n
         FROM plenar_speeches s
         JOIN politicians pp ON pp.bt_redner_id = s.redner_id
         JOIN rede_unterthemen ru ON ru.rede_id = s.rede_id
         WHERE pp.id = ? GROUP BY ru.feld
       UNION ALL
       SELECT it.aw_field AS feld, COUNT(DISTINCT a.drucksache_nr) AS n
         FROM activities a
         JOIN item_topics it ON it.item_id = a.drucksache_nr AND it.source = 'bt_drucksache'
         WHERE a.politician_id = ? GROUP BY it.aw_field
     )
     WHERE feld IS NOT NULL AND feld != ''
     GROUP BY feld ORDER BY count DESC, feld LIMIT 5`,
  ).all(id, id) as KompaktSchwerpunkt[];

  // Ausschüsse: Leitungsrollen zuerst, dann alphabetisch
  const ausschuesse = getCommitteeMembershipsForPoliticianDb(id).map((c) => ({
    label: c.committee_label,
    rolle: c.committee_role,
  }));

  // Nebeneinkünfte: Untergrenze aus Stufen (ehrliches „mindestens").
  const sidejobs = getSidejobsForPoliticianDb(id);
  let minEuro = 0;
  let hasBracket = false;
  for (const s of sidejobs) {
    const lvl = s.income_level ? parseInt(s.income_level, 10) : NaN;
    if (!Number.isNaN(lvl) && lvl >= 1 && lvl <= 10) {
      minEuro += SIDEJOB_STUFE_FLOOR[lvl];
      hasBracket = true;
    } else if (s.income && s.income > 0) {
      minEuro += s.income;
      hasBracket = true;
    }
  }
  const nebeneinkuenfte: KompaktNebeneinkuenfte = {
    kind: sidejobs.length === 0 ? "keine" : hasBracket ? "betrag" : "unbeziffert",
    minEuro: Math.floor(minEuro),
    anzahl: sidejobs.length,
  };

  // Abstimmungen: xx/xx teilgenommen + Abweichungen (nur wo namentliche Polls existieren)
  const dev = getFractionDeviationsForPolitician(id);
  const abstimmung: KompaktAbstimmung = {
    verfuegbar: dev.total_namentlich > 0,
    teilgenommen: dev.active_polls,
    gesamt: dev.total_namentlich,
    abweichungen: dev.deviations.length,
    fraktionslos: dev.is_fractionless,
  };

  // Fallback-Lebenslauf aus dem strukturierten CV (dedup bevorzugt)
  const cvJson = p.cv_json_dedup ?? p.cv_json;
  const cvLebenslauf = parseCvLebenslauf(cvJson);

  // Ausbildung: aw-Studienfach bevorzugt (sauber), sonst beste CV-Studienzeile.
  // Höchsten Grad (Promotion) als Marker anhängen, falls nicht schon enthalten —
  // Titel "Dr." reicht als Promotions-Signal, wenn der CV den Grad nicht nennt.
  let ausbildung = cleanAusbildung(p.education) ?? cvLebenslauf.ausbildung;
  const doktor = cvLebenslauf.doktorgrad ?? (/\bDr\b\.?/.test(p.title ?? "") ? "promoviert" : null);
  if (ausbildung && doktor && !/\b(dr\.|promo|doktor|ph\.?\s?d)/i.test(ausbildung)) {
    ausbildung = `${ausbildung} · ${doktor}`;
  }

  let beruf = cleanBeruf(p.occupation) ?? cvLebenslauf.beruf;
  let berufStatus: PoliticianKompakt["berufStatus"] = beruf
    ? "vorhanden"
    : cvJson
      ? "keiner" // CV vorhanden, aber kein Nicht-Politik-Beruf erfasst
      : "unbekannt"; // keine CV-Daten → keine Aussage möglich
  let berufKategorie: string | null = null;

  // LLM-Extraktion (cv_kompakt) bevorzugen — sauberer als die Heuristik oben.
  // Tabelle existiert evtl. noch nicht (vor erstem Extraktions-Lauf) → try/catch.
  try {
    const x = db
      .prepare(
        `SELECT hoechster_abschluss, praegender_beruf, beruf_status, beruf_kategorie
         FROM cv_kompakt WHERE politician_id = ? AND error IS NULL`,
      )
      .get(id) as
      | { hoechster_abschluss: string | null; praegender_beruf: string | null; beruf_status: string | null; beruf_kategorie: string | null }
      | undefined;
    if (x) {
      if (x.hoechster_abschluss) ausbildung = x.hoechster_abschluss;
      if (x.praegender_beruf) {
        beruf = x.praegender_beruf;
        berufStatus = "vorhanden";
      } else if (x.beruf_status === "keiner") {
        beruf = null;
        berufStatus = "keiner";
      }
      // sonst (LLM ohne klare Aussage / Feld bereinigt) → Heuristik behalten
      berufKategorie = x.beruf_kategorie;
    }
  } catch {
    /* cv_kompakt noch nicht vorhanden — Heuristik bleibt */
  }

  // Online-Präsenz: bare Handles aus Stammdaten → Plattform-URLs. Homepage + offizielle
  // Profile zeigen, neutral, ohne Wertung. Reihenfolge = höchste Abdeckung zuerst.
  const handleUrl = (raw: string | null, build: (h: string) => string): string | null => {
    const h = raw?.trim().replace(/^@/, "");
    if (!h) return null;
    return /^https?:\/\//.test(h) ? h : build(h);
  };
  const social = (
    [
      { label: "Homepage", url: p.homepage_url?.trim() || null },
      { label: "Instagram", url: handleUrl(p.instagram_handle, (h) => `https://instagram.com/${h}`) },
      { label: "Facebook", url: handleUrl(p.facebook_handle, (h) => `https://facebook.com/${h}`) },
      { label: "X", url: handleUrl(p.twitter_handle, (h) => `https://x.com/${h}`) },
      { label: "TikTok", url: handleUrl(p.tiktok_handle, (h) => `https://www.tiktok.com/@${h}`) },
    ] as { label: string; url: string | null }[]
  ).filter((s): s is { label: string; url: string } => !!s.url);

  // Pilot: Anzahl schriftlicher Fragen an die Bundesregierung. Tabelle existiert evtl.
  // noch nicht (vor Q&A-Pipeline) → try/catch. Link sucht /fragen nach dem Namen.
  let fragen: PoliticianKompakt["fragen"] = null;
  try {
    const fr = db
      .prepare(`SELECT COUNT(*) AS n FROM drucksache_qa_paare WHERE fragesteller_politician_id = ?`)
      .get(id) as { n: number } | undefined;
    if (fr && fr.n > 0) {
      fragen = { anzahl: fr.n, query: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() };
    }
  } catch {
    /* drucksache_qa_paare noch nicht vorhanden */
  }

  return {
    id: p.id,
    name: [p.title, p.first_name, p.last_name].filter(Boolean).join(" "),
    party_label: p.party_label,
    rolle: p.rolle,
    wahlkreis: cleanWahlkreis(mandate?.constituency),
    parliament_label: mandate?.type ?? null,
    year_of_birth: p.year_of_birth,
    photo_url: p.photo_url,
    ausbildung,
    beruf,
    berufStatus,
    berufKategorie,
    ausschuesse,
    schwerpunkte,
    nebeneinkuenfte,
    abstimmung,
    social,
    fragen,
  };
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
  // Phase 3b: Drill-Down zu Detail-Ansicht + Evidenz-Counts (falls v2.1 verfügbar)
  rede_id: string | null;
  speaker_variant: string | null;  // exakter Name aus plenar_speeches.speaker für Redner-URL
  mediathek_fvid: string | null;   // Bundestag-Mediathek-Video-ID (falls zugeordnet)
  forderungen_count: number;
  zitate_count: number;
  zahlen_count: number;
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

/** Präzisiert das nackte DIP-Label "Frage": die Quelle führt schriftliche
 *  Einzelfragen (drucksache_typ "Schriftliche Fragen") und mündliche Fragen
 *  (Plenarprotokoll, Fragestunde/Regierungsbefragung) beide nur als "Frage". */
function typLabelForDip(art: string, dokumentart: string | null, drucksacheTyp: string | null): string {
  if (art === "Frage") {
    if (dokumentart === "Plenarprotokoll") return "Mündliche Frage (Fragestunde)";
    if (drucksacheTyp === "Schriftliche Fragen" || drucksacheTyp === "Fragen") return "Schriftliche Frage";
  }
  return art;
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
       -- Schriftliche Fragen (Drucksache) haben eine eigene, reichere Sektion
       -- ("Schriftliche Fragen" mit Antwort-Text) → hier raus, um Dopplung zu
       -- vermeiden. Mündliche Fragen (Plenarprotokoll) bleiben.
       AND NOT (aktivitaetsart = 'Frage' AND dokumentart = 'Drucksache')
     ORDER BY datum DESC LIMIT ?`
  ).all(politicianId, limit) as ActivityRow[];

  // 2. Load Plenar summaries via politician_id (zuverlässig, seit Backfill 2026-05-07
  // 100 % Coverage). Vorher wurde via speaker LIKE '%lastname' gematcht — Bug:
  // „Stein" matchte „Wallstein", „Bernstein" etc. → ORDER BY count nahm den
  // höchsten und Sandra Stein bekam Maja Wallsteins Reden zugeordnet.
  type PlenarRow = SpeechSummary & { speaker: string; speech_text_preview: string };
  const plenarRows = db.prepare(`
    SELECT s.*,
      (SELECT ps.mediathek_fvid FROM plenar_speeches ps
         WHERE ps.rede_id = s.rede_id AND ps.mediathek_fvid IS NOT NULL LIMIT 1) AS mediathek_fvid
    FROM speech_summaries s
    WHERE s.politician_id = ?
      AND ${SPEECH_SUMMARY_QUALITY_FILTER_SQL}
    ORDER BY s.sitzung DESC, s.speech_index ASC
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
          rede_id: plenar.rede_id,
          speaker_variant: plenar.speaker,
          mediathek_fvid: plenar.mediathek_fvid ?? null,
          forderungen_count: v21?.forderungen?.length ?? 0,
          zitate_count: v21?.woertliche_zitate?.length ?? 0,
          zahlen_count: v21?.konkrete_zahlen?.length ?? 0,
        });
        continue;
      }
    }

    // No match — DIP only
    // Mündliche Frage (Fragestunde): dokumentart=Plenarprotokoll, drucksache_nr
    // trägt die Protokoll-Nr "21/N" — und Protokoll-Nr == Sitzungs-Nr (verifiziert).
    // → Sitzung ableiten + verlinkbar machen, NICHT als "Drucksache" fehllabeln.
    const isMuendlicheFrage = a.aktivitaetsart === "Frage" && a.dokumentart === "Plenarprotokoll";
    const protoSitzung = isMuendlicheFrage && a.drucksache_nr
      ? Number(a.drucksache_nr.split("/")[1]) : NaN;
    items.push({
      id: `dip-${a.id}`,
      quelle: "dip",
      datum: a.datum,
      typ: typLabelForDip(a.aktivitaetsart, a.dokumentart, a.drucksache_typ),
      kategorie: dipKat,
      thema: a.thema,
      zusammenfassung: null,
      drucksache_nr: isMuendlicheFrage ? null : a.drucksache_nr,
      pdf_url: isMuendlicheFrage ? null : a.pdf_url,
      source_url: isMuendlicheFrage ? a.pdf_url : null,
      sitzung: Number.isFinite(protoSitzung) ? protoSitzung : null,
      page_start: null,
      page_section: null,
      tonalitaet: null,
      reden_typ: null,
      has_correction: false,
      rede_id: null,
      speaker_variant: null,
      mediathek_fvid: null,
      forderungen_count: 0,
      zitate_count: 0,
      zahlen_count: 0,
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
      rede_id: p.rede_id,
      speaker_variant: p.speaker,
      mediathek_fvid: p.mediathek_fvid ?? null,
      forderungen_count: v21?.forderungen?.length ?? 0,
      zitate_count: v21?.woertliche_zitate?.length ?? 0,
      zahlen_count: v21?.konkrete_zahlen?.length ?? 0,
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
  /** Ein aktivitaetsart-Wert oder mehrere (z.B. Kleine + Große Anfrage). */
  art?: string | string[];
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
  const arts = params.art == null ? [] : Array.isArray(params.art) ? params.art : [params.art];
  if (arts.length > 0) {
    conditions.push(`a.aktivitaetsart IN (${arts.map(() => "?").join(",")})`);
    args.push(...arts);
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
  const arts = params.art == null ? [] : Array.isArray(params.art) ? params.art : [params.art];
  if (arts.length > 0) {
    conditions.push(`a.aktivitaetsart IN (${arts.map(() => "?").join(",")})`);
    args.push(...arts);
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

// ────────────────────────────────────────────────────────────────────────
// Drucksachen nach amtlichem Dokumenttyp (drucksache_analyses) — die
// AUTORITATIVE, DIP-voll-enumerierte Quelle. WICHTIG für Gesetzentwürfe:
// activities ist mitzeichner-getrieben und verfehlt alle Regierungs-/Bundesrats-
// Entwürfe (58 statt 313). Diese Liste zählt jeden Entwurf, egal ob er namentliche
// Einbringer hat. Titel aus dip_ds_titles, Datum aus drucksache_texts. Vgl.
// [[project_drucksachen_discovery_fix]].
// ────────────────────────────────────────────────────────────────────────
export interface DrucksacheTypItem {
  drucksache_nr: string;
  dokumenttyp: string;
  titel: string;
  einbringer: string | null;
  datum: string | null;
  zusammenfassung: string | null;
}

export function listDrucksachenByDokumenttyp(params: {
  /** Ein Typ oder mehrere Geschwister-Typen (z.B. die Antrags-Familie). */
  dokumenttyp: string | string[];
  query?: string;
  /** Nur eigenständige Dokumente — schließt Verfahrens-Dokumente aus, deren
   *  Vorgang einen Gesetzentwurf/Antrag enthält (z.B. Ausschuss-Berichte ZUM
   *  Gesetz, die sonst den Gesetz-Titel doppeln). */
  nurEigenstaendig?: boolean;
  limit?: number;
  offset?: number;
}): { rows: DrucksacheTypItem[]; total: number } {
  const db = getDb();
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;
  const typen = Array.isArray(params.dokumenttyp) ? params.dokumenttyp : [params.dokumenttyp];

  const conds: string[] = [`da.dokumenttyp IN (${typen.map(() => "?").join(",")})`, "da.analyze_error IS NULL"];
  const args: (string | number)[] = [...typen];
  if (params.nurEigenstaendig) {
    conds.push(
      `NOT EXISTS (
         SELECT 1 FROM dip_ds_vorgaenge v1
         JOIN dip_ds_vorgaenge v2 ON v2.vorgang_id = v1.vorgang_id AND v2.drucksache_nr != da.drucksache_nr
         JOIN drucksache_analyses g ON g.drucksache_nr = v2.drucksache_nr
           AND g.dokumenttyp IN ('Gesetzentwurf','Antrag','Entschließungsantrag','Änderungsantrag')
         WHERE v1.drucksache_nr = da.drucksache_nr
       )`
    );
  }
  if (params.query) {
    // Suche über Titel (dip_ds_titles) und Zusammenfassung.
    conds.push(
      `(EXISTS (SELECT 1 FROM dip_ds_titles t WHERE t.drucksache_nr = da.drucksache_nr AND t.titel LIKE ?)
        OR da.zusammenfassung LIKE ?)`
    );
    args.push(`%${params.query}%`, `%${params.query}%`);
  }
  const where = `WHERE ${conds.join(" AND ")}`;

  const total = (db.prepare(
    `SELECT COUNT(*) AS c FROM drucksache_analyses da ${where}`
  ).get(...args) as { c: number }).c;

  const rows = db.prepare(
    `SELECT
       da.drucksache_nr AS drucksache_nr,
       da.dokumenttyp AS dokumenttyp,
       COALESCE((SELECT titel FROM dip_ds_titles t WHERE t.drucksache_nr = da.drucksache_nr), '') AS titel,
       da.fraktion AS einbringer,
       da.zusammenfassung AS zusammenfassung,
       (SELECT publication_date FROM drucksache_texts dt WHERE dt.drucksache_nr = da.drucksache_nr) AS datum
     FROM drucksache_analyses da
     ${where}
     ORDER BY datum IS NULL, datum DESC, da.drucksache_nr DESC
     LIMIT ? OFFSET ?`
  ).all(...args, limit, offset) as DrucksacheTypItem[];

  return { rows, total };
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
  topic_count: number;
  vote_count: number;
}

export function getPlenarSessions(): PlenarSessionRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.id, s.wahlperiode, s.sitzung, s.datum, s.source_url,
      COUNT(sp.id) as speech_count,
      COUNT(DISTINCT sp.speaker) as speaker_count,
      (SELECT COUNT(*) FROM plenar_topics pt WHERE pt.session_id = s.id) as topic_count,
      (SELECT COUNT(DISTINCT v.poll_id) FROM votes v WHERE v.poll_date = s.datum) as vote_count
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

// Tonalitäts-Verteilung pro Fraktion über alle KI-analysierten Rede-Segmente.
// Quelle: speech_analyses_v2 × plenar_speeches via speech_id (kein Kartesisches
// Produkt — speech_id ist FK, jeder Segment-Row hat genau einen Speaker).
export function getRedenTonalitaetByFraktion(): {
  fraktion: string;
  total: number;
  byTonalitaet: Record<string, number>;
}[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      COALESCE(NULLIF(TRIM(ps.party), ''), '__none__') AS party,
      sa.tonalitaet AS tonalitaet,
      COUNT(*) AS c
    FROM speech_analyses_v2 sa
    JOIN plenar_speeches ps ON ps.id = sa.speech_id
    WHERE sa.tonalitaet IS NOT NULL
    GROUP BY party, sa.tonalitaet
  `).all() as { party: string; tonalitaet: string; c: number }[];

  // Fraktions-Label-Normalisierung (UI-Schreibweise)
  const FRAKTION_LABEL: Record<string, string> = {
    "CDU/CSU": "CDU/CSU",
    "AfD": "AfD",
    "SPD": "SPD",
    "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
    "Die Linke": "Linke",
    "fraktionslos": "fraktionslos",
    "__none__": "Präsidium / o. Partei",
  };

  // Tonalitäts-Slug-Repair für seltene Drift-Werte, die nicht durch den
  // deterministischen Repair-Pass abgedeckt sind.
  const TONALITAET_REPAIR: Record<string, string> = {
    "defensive_pragmatisch": "defensiv_pragmatisch",
  };

  // Roh-Strings enthalten teilweise NBSP (U+00A0, z.B. „BÜNDNIS␣90") und
  // Soft-Hyphens. Normalisieren bevor wir gegen FRAKTION_LABEL lookupen.
  const normalize = (s: string) => s.replace(/ /g, " ").replace(/­/g, "");

  const map = new Map<string, { total: number; byTonalitaet: Record<string, number> }>();
  for (const r of rows) {
    const fraktion = FRAKTION_LABEL[normalize(r.party)] ?? normalize(r.party);
    const tonalitaet = TONALITAET_REPAIR[r.tonalitaet] ?? r.tonalitaet;
    if (!map.has(fraktion)) map.set(fraktion, { total: 0, byTonalitaet: {} });
    const entry = map.get(fraktion)!;
    entry.total += r.c;
    entry.byTonalitaet[tonalitaet] = (entry.byTonalitaet[tonalitaet] ?? 0) + r.c;
  }

  return Array.from(map.entries())
    .map(([fraktion, v]) => ({ fraktion, total: v.total, byTonalitaet: v.byTonalitaet }))
    .sort((a, b) => b.total - a.total);
}

// Tonalitäts-Verteilung der Kleinen Anfragen pro Fraktion. Filter:
// dokumenttyp='Kleine Anfrage' (amtlicher DIP-Typ — separate Tonalitäts-Skala als
// für Anträge/Gesetze; batch_class='klein' wäre falsch, enthält ~694 Anträge),
// nur Einzel-Fraktionen mit ≥10 Anfragen (joint/Bundesregierung ausgeschlossen).
export function getDrucksacheTonalitaetByFraktion(): {
  fraktion: string;
  total: number;
  byTonalitaet: Record<string, number>;
}[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      TRIM(REPLACE(REPLACE(fraktion, char(10), ''), char(13), '')) AS fraktion,
      TRIM(REPLACE(REPLACE(tonalitaet, char(10), ''), char(13), '')) AS tonalitaet,
      COUNT(*) AS c
    FROM drucksache_analyses
    WHERE dokumenttyp = 'Kleine Anfrage'
      AND tonalitaet IS NOT NULL
      AND fraktion IS NOT NULL
      AND fraktion != ''
    GROUP BY fraktion, tonalitaet
  `).all() as { fraktion: string; tonalitaet: string; c: number }[];

  const FRAKTION_LABEL: Record<string, string> = {
    "CDU/CSU": "CDU/CSU",
    "AfD": "AfD",
    "SPD": "SPD",
    "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
    "BÜNDNIS 90/Die GRÜNEN": "Grüne",
    "Die Linke": "Linke",
    "fraktionslos": "fraktionslos",
  };
  const normalize = (s: string) => s.replace(/ /g, " ").replace(/­/g, "");
  // Joint-Fraktionen, Bundesregierung, Ministerien, Einzelabgeordnete: nicht
  // einer Fraktion zurechenbar — ausschließen.
  const isJointOrInstitution = (s: string) =>
    /,|\bund\b|überparteilich|Bundes(regierung|ministerium|tag)|\(Einzelabgeordnete/i.test(s);

  const map = new Map<string, { total: number; byTonalitaet: Record<string, number> }>();
  for (const r of rows) {
    const cleaned = normalize(r.fraktion);
    if (isJointOrInstitution(cleaned)) continue;
    const fraktion = FRAKTION_LABEL[cleaned] ?? cleaned;
    if (!map.has(fraktion)) map.set(fraktion, { total: 0, byTonalitaet: {} });
    const entry = map.get(fraktion)!;
    entry.total += r.c;
    entry.byTonalitaet[r.tonalitaet] = (entry.byTonalitaet[r.tonalitaet] ?? 0) + r.c;
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.total >= 10)
    .map(([fraktion, v]) => ({ fraktion, total: v.total, byTonalitaet: v.byTonalitaet }))
    .sort((a, b) => b.total - a.total);
}

// Monats-Trend für Kleine Anfragen pro Hauptsteller-Fraktion. Verwendet
// MIN(datum) pro Drucksache aus `activities` (da activities mehrere Rows
// pro Drucksache hat — eine pro Signator:in). Liefert pro Monat den
// konfrontativ-Anteil (fordernd+kritisch) und das absolute Volumen.
export function getDrucksacheMonthlyTrend(): {
  monat: string;
  byFraktion: Record<string, { ka_n: number; konfront_pct: number; sachlich_pct: number }>;
}[] {
  const db = getDb();
  const rows = db.prepare(`
    WITH first_dates AS (
      SELECT drucksache_nr, MIN(datum) AS datum
      FROM activities WHERE datum IS NOT NULL
      GROUP BY drucksache_nr
    )
    SELECT
      substr(fd.datum, 1, 7) AS monat,
      TRIM(REPLACE(REPLACE(da.fraktion, char(10), ''), char(13), '')) AS fraktion,
      SUM(CASE WHEN da.tonalitaet IN ('fordernd','kritisch') THEN 1 ELSE 0 END) AS konfront,
      SUM(CASE WHEN da.tonalitaet = 'sachlich' THEN 1 ELSE 0 END) AS sachlich,
      COUNT(*) AS ka_n
    FROM drucksache_analyses da
    JOIN first_dates fd ON fd.drucksache_nr = da.drucksache_nr
    WHERE da.dokumenttyp = 'Kleine Anfrage' AND da.tonalitaet IS NOT NULL
      AND da.fraktion IS NOT NULL AND da.fraktion != ''
    GROUP BY monat, fraktion
    ORDER BY monat
  `).all() as { monat: string; fraktion: string; konfront: number; sachlich: number; ka_n: number }[];

  const FRAKTION_LABEL: Record<string, string> = {
    "CDU/CSU": "CDU/CSU",
    "AfD": "AfD",
    "SPD": "SPD",
    "BÜNDNIS 90/DIE GRÜNEN": "Grüne",
    "BÜNDNIS 90/Die GRÜNEN": "Grüne",
    "Die Linke": "Linke",
  };
  const ALLOWED = new Set(["CDU/CSU", "AfD", "SPD", "Grüne", "Linke"]);
  const normalize = (s: string) => s.replace(/ /g, " ").replace(/­/g, "");

  const byMonat = new Map<string, Record<string, { ka_n: number; konfront_pct: number; sachlich_pct: number }>>();
  for (const r of rows) {
    const cleaned = normalize(r.fraktion);
    const fraktion = FRAKTION_LABEL[cleaned];
    if (!fraktion || !ALLOWED.has(fraktion)) continue;
    if (!byMonat.has(r.monat)) byMonat.set(r.monat, {});
    byMonat.get(r.monat)![fraktion] = {
      ka_n: r.ka_n,
      konfront_pct: r.ka_n > 0 ? (r.konfront / r.ka_n) * 100 : 0,
      sachlich_pct: r.ka_n > 0 ? (r.sachlich / r.ka_n) * 100 : 0,
    };
  }

  return Array.from(byMonat.entries())
    .map(([monat, byFraktion]) => ({ monat, byFraktion }))
    .sort((a, b) => a.monat.localeCompare(b.monat));
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
  mediathek_fvid: string | null;
  mediathek_confidence: string | null;
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
      SELECT s.*,
        (SELECT ps.mediathek_fvid FROM plenar_speeches ps
           WHERE ps.rede_id = s.rede_id AND ps.mediathek_fvid IS NOT NULL LIMIT 1) AS mediathek_fvid,
        (SELECT ps.mediathek_confidence FROM plenar_speeches ps
           WHERE ps.rede_id = s.rede_id AND ps.mediathek_fvid IS NOT NULL LIMIT 1) AS mediathek_confidence
      FROM speech_summaries s
      WHERE s.speaker = ?
        AND ${SPEECH_SUMMARY_QUALITY_FILTER_SQL}
      ORDER BY s.sitzung DESC, s.speech_index ASC
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
  pdf_url: string | null;
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
      (SELECT drucksache_typ FROM activities WHERE drucksache_nr = dp.drucksache_nr LIMIT 1) AS drucksache_typ,
      (SELECT pdf_url FROM activities WHERE drucksache_nr = dp.drucksache_nr AND pdf_url IS NOT NULL LIMIT 1) AS pdf_url
    FROM drucksache_polls dp
    LEFT JOIN drucksache_analyses a ON a.drucksache_nr = dp.drucksache_nr AND a.analyze_error IS NULL
    WHERE dp.poll_id = ?
    ORDER BY dp.match_score DESC, dp.drucksache_nr
  `).all(pollId) as VoteDrucksacheRow[];
  // pdf_url-Fallback: DS, die nicht in `activities` liegen, haben dort keine
  // pdf_url — deterministisch aus der DS-Nummer rekonstruieren (wie Detail-Seite).
  for (const d of drucksachen) {
    if (!d.pdf_url) d.pdf_url = buildDsPdfUrl(d.drucksache_nr);
  }

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

/** Langes Fraktions-Label (votes.fraction_label) → Kurzname wie in
 *  bundestag_votes.fraktion_votes_json (CDU/CSU, SPD, GRÜNE, LINKE, AfD). */
function normFraktionKurz(label: string): string | null {
  const s = label.toLowerCase();
  if (s.includes("cdu") || s.includes("csu")) return "CDU/CSU";
  if (s.includes("spd")) return "SPD";
  if (s.includes("grüne") || s.includes("bündnis")) return "GRÜNE";
  if (s.includes("linke")) return "LINKE";
  if (s.includes("afd")) return "AfD";
  return null;
}

/**
 * Exakte aktuelle Fraktionsgrößen = Anzahl distinct MdB je Fraktion über alle
 * namentlichen Abstimmungen (votes-Tabelle). Schlüssel = Kurzname wie in den
 * Handzeichen-Votes (fraktion_votes_json), damit man deren „dafür/dagegen je
 * Fraktion" nach Sitzen gewichten kann. Live aus der DB, nicht hardcodiert.
 */
export function getFraktionSitze(): Record<string, number> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT fraction_label AS f, COUNT(DISTINCT politician_id) AS n
       FROM votes WHERE fraction_label IS NOT NULL GROUP BY fraction_label`
    )
    .all() as { f: string; n: number }[];
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = normFraktionKurz(r.f);
    if (key) out[key] = (out[key] ?? 0) + r.n;
  }
  return out;
}

export type VoteSubtype = "gesetz" | "petition" | "personenwahl" | "unbekannt";

/** Was finanziert jeder Einzelplan? Kuratierte Liste, bürgerverständliche
 *  Themen-Klammer nach dem Ministeriumsnamen. Ziel: User soll verstehen,
 *  worum es bei einer Einzelplan-Abstimmung inhaltlich geht. */
const EINZELPLAN_INHALT: Record<string, { ministerium: string; themen: string }> = {
  "01": { ministerium: "Bundespräsident", themen: "Amtsführung, Bundespräsidialamt" },
  "02": { ministerium: "Bundestag", themen: "Parlamentsbetrieb, Verwaltung des Bundestags" },
  "03": { ministerium: "Bundesrat", themen: "Verwaltung des Bundesrats" },
  "04": { ministerium: "Bundeskanzleramt", themen: "Bundesnachrichtendienst, Kultur, Migrations-Beauftragte" },
  "05": { ministerium: "Auswärtiges Amt", themen: "Diplomatie, internationale Beiträge, Auslandsvertretungen" },
  "06": { ministerium: "Bundesministerium des Innern", themen: "Bundespolizei, BKA, Verfassungsschutz, Sport" },
  "07": { ministerium: "Bundesministerium der Justiz und für Verbraucherschutz", themen: "Justiz, Bundesgerichte, Verbraucherschutz" },
  "08": { ministerium: "Bundesministerium der Finanzen", themen: "Steuerverwaltung, Zoll, Bundesschuld, BaFin" },
  "09": { ministerium: "Bundesministerium für Wirtschaft und Energie", themen: "Wirtschaftsförderung, Außenhandel, Energie" },
  "10": { ministerium: "Bundesministerium für Landwirtschaft", themen: "Landwirtschaft, Ernährung, Forsten" },
  "11": { ministerium: "Bundesministerium für Arbeit und Soziales", themen: "Bundesagentur für Arbeit, Rente, Pflege, Bürgergeld" },
  "12": { ministerium: "Bundesministerium für Verkehr", themen: "Straßen, Bahn, Wasserwege, ÖPNV" },
  "14": { ministerium: "Bundesministerium der Verteidigung", themen: "Bundeswehr, Rüstung, Auslandseinsätze" },
  "15": { ministerium: "Bundesministerium für Gesundheit", themen: "GKV-Bundeszuschuss, BfArM, RKI, Pflege" },
  "16": { ministerium: "Bundesministerium für Umwelt", themen: "Klimaschutz, Naturschutz, Reaktorsicherheit" },
  "17": { ministerium: "Bundesministerium für Familie, Senioren, Frauen und Jugend", themen: "Familienleistungen, Senioren, Frauen, Jugend" },
  "19": { ministerium: "Bundesverfassungsgericht", themen: "Verfassungsgericht" },
  "20": { ministerium: "Bundesrechnungshof", themen: "Rechnungsprüfung" },
  "23": { ministerium: "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung", themen: "Entwicklungshilfe, Klimafinanzierung" },
  "24": { ministerium: "Bundesministerium für Digitales und Staatsmodernisierung", themen: "Verwaltungsdigitalisierung, KI, Staatsmodernisierung" },
  "25": { ministerium: "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen", themen: "Wohnungsbau, Städtebau, Bauwesen" },
  "30": { ministerium: "Bundesministerium für Forschung", themen: "Forschungsförderung, Hochschulen, Bildung" },
  "32": { ministerium: "Bundesschuld", themen: "Zinsen und Tilgung der Staatsschulden" },
  "60": { ministerium: "Allgemeine Finanzverwaltung", themen: "Steuereinnahmen, Länder-Finanzausgleich, EU-Beiträge" },
};

/** Extrahiert eine Einzelplan-Nummer aus dem raw_snippet und mappt sie auf
 *  einen bürgerverständlichen Etat-Titel inkl. Themen-Klammer.
 *  Beispiel: "Einzelplan 08 – Bundesministerium der Finanzen" →
 *  "Etat des Bundesministeriums der Finanzen — Steuern, Zoll, Bundesschuld, BaFin" */
function extractEinzelplanHint(snippet: string | null): string | null {
  if (!snippet) return null;
  const m = snippet.match(/Einzelplan\s+(\d+)/);
  if (!m) return null;
  const num = m[1].padStart(2, "0");
  const known = EINZELPLAN_INHALT[num];
  if (known) {
    return `Etat: ${known.ministerium} — ${known.themen}`;
  }
  // Fallback: aus Snippet den Namen ziehen, ohne kuratierte Themen.
  const nameM = snippet.match(
    /Einzelplan\s+\d+\s*[–—-]?\s*(Bundesministerium[^.,;]{0,80}|Bundes\w[^.,;]{0,80}|[A-ZÄÖÜ][^.,;]{0,80})/,
  );
  const name = (nameM?.[1] ?? "")
    .trim()
    .replace(/\s+(in\s+der\s+Ausschussfassung|Drucksache|gemäß|mit\s+den).*$/i, "")
    .replace(/[\s–—-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (name) return `Etat: ${name} (Einzelplan ${num})`;
  return `Etat (Einzelplan ${num})`;
}

/** Erkennt generische kerninhalt-Suffixe, die nach dem Einzelplan-Hint nichts
 *  Informatives mehr beitragen ("Die Drucksache ist eine Ergänzung zu den
 *  Beschlussempfehlungen…", "Haushaltsausschuss empfiehlt…"). */
function isGenericKerninhalt(text: string): boolean {
  const s = text.toLowerCase().trim();
  return (
    s.startsWith("die drucksache ist eine ergänzung") ||
    s.startsWith("haushaltsausschuss empfiehlt") ||
    s.startsWith("der haushaltsausschuss empfiehlt") ||
    s.startsWith("ergänzungsdrucksache") ||
    s.startsWith("einzelplan ")
  );
}

/** Rät aus dem PlPr-Snippet den Dokumenttyp einer Vote (Gesetzentwurf,
 *  Entschließungsantrag etc.) — als letztes Fallback wenn weder DS-Analyse
 *  noch Einzelplan-Hint einen sprechenden Titel liefern. */
function inferDocTypeFromSnippet(snippet: string | null): string {
  if (!snippet) return "Abstimmung";
  const s = snippet.toLowerCase();
  // GO-Verfahrens-Votes (oft ohne DS): Einspruch gegen Ordnungsmaßnahmen,
  // Geschäftsordnungsanträge, Überweisungen, Wahlgang-Eröffnungen.
  if (s.includes("einspruch gegen eine ordnungsmaßnahme") || s.includes("ordnungsmaßnahme gemäß § 39")) {
    return "Einspruch gegen Ordnungsmaßnahme (§ 39 GO)";
  }
  if (s.includes("geschäftsordnungsantrag")) return "Geschäftsordnungs-Antrag";
  if (s.includes("zweiten wahlgang")) return "Antrag auf zweiten Wahlgang";
  if (s.includes("feststellung der tagesordnung")) return "Feststellung der Tagesordnung";
  if (s.includes("überweisung")) return "Überweisungs-Antrag";
  // Substantielle Dokumente:
  if (s.includes("entschließungsantrag")) return "Entschließungsantrag";
  if (s.includes("änderungsantrag")) return "Änderungsantrag";
  if (s.includes("gesetzentwurf") || s.includes("entwurf eines gesetzes")) return "Gesetzentwurf";
  if (s.includes("beschlussempfehlung")) return "Beschlussempfehlung";
  if (s.includes("antrag")) return "Antrag";
  return "Abstimmung";
}

/** Strippt typische Party-Prefix-Sätze aus drucksache-Zusammenfassungen UND
 *  Kerninhalt-Bullets, damit Vote-Labels nicht mit "Die Fraktion XYZ fordert…"
 *  oder "BÜNDNIS 90/DIE GRÜNEN fordert…" starten. Im Titel ist die einbringende
 *  Partei irrelevant — nur das Anliegen zählt. */
function stripPartyPrefix(s: string): string {
  // Verben die typisch nach einer Partei-Nennung kommen.
  const VERBS = "(fordert|fordern|kritisiert|kritisieren|beantragt|beantragen|begrüßt|begrüßen|bringt|bringen|möchte|möchten|bestreitet|will|wollen|verlangt|verlangen|legt|legen|schlägt vor|schlagen vor|plädiert|plädieren|setzt sich ein|setzen sich ein|argumentiert|argumentieren)";
  const PARTY = "(AfD|CDU/CSU|SPD|BÜNDNIS\\s*90/DIE\\s*GRÜNEN|BÜNDNIS\\s*90/Die\\s*GRÜNEN|GRÜNE|GRÜNEN|Grüne|Grünen|Die\\s+Linke|LINKE|Linke|FDP|Antragsteller|Antragstellende)";
  // Trennzeichen nach dem Verb: Leerzeichen ODER Doppelpunkt ODER Komma.
  const SEP = "[\\s:,;.]+";
  const patterns = [
    // "(Die) Fraktion {Party} (-Fraktion)? VERB [:|space|,] …" — Prefix strippen
    new RegExp(`^Die\\s+${PARTY}-Fraktion\\s+${VERBS}${SEP}`, "i"),
    new RegExp(`^Die\\s+Fraktion\\s+(?:der|des|von)\\s+${PARTY}\\s+${VERBS}${SEP}`, "i"),
    new RegExp(`^Die\\s+Fraktion\\s+${PARTY}\\s+${VERBS}${SEP}`, "i"),
    // "Fraktion Die Linke fordert …" (ohne führendes "Die"; "Die" gehört zur Partei)
    new RegExp(`^Fraktion\\s+(?:Die\\s+)?${PARTY}\\s+${VERBS}${SEP}`, "i"),
    // "Die {Party} VERB …" (z.B. "Die AfD fordert", ohne -Fraktion)
    new RegExp(`^Die\\s+${PARTY}\\s+${VERBS}${SEP}`, "i"),
    // "Antrag der {Party}-Fraktion auf …" / "Antrag der Fraktion {Party} …"
    new RegExp(`^(?:Der\\s+|Die\\s+)?(?:Entschließungsantrag|Änderungsantrag|Antrag|Gesetzentwurf|Beschlussempfehlung)\\s+der\\s+(?:${PARTY}-Fraktion|Fraktion\\s+${PARTY})\\s+(?:auf|zur?|über|zum?)?\\s*`, "i"),
    // "Antrag von {Party} zu/zum/zur einem X. " — strip bis nach dem ersten Punkt (oft einleitender Satz vor dem eigentlichen Inhalt)
    new RegExp(`^(?:Der\\s+|Die\\s+)?(?:Entschließungsantrag|Änderungsantrag|Antrag|Gesetzentwurf|Beschlussempfehlung)\\s+von\\s+(?:der\\s+)?${PARTY}\\s+(?:zu|zur?|zum|über|auf)[^.]+\\.\\s*`, "i"),
    // "{Party} VERB [:|space|,] …"  (häufigster Kerninhalt-Fall, ohne "Die")
    new RegExp(`^${PARTY}\\s+${VERBS}${SEP}`, "i"),
    // "Antragsteller fordern …"
    new RegExp(`^Antragstellende?\\s+${VERBS}${SEP}`, "i"),
  ];
  // Mehrere Pässe (fixpoint): wenn ein Pattern einen einleitenden Satz strippt
  // ("Antrag von X zu Y."), kann ein anderes Pattern noch im Rest greifen
  // ("Die Y fordert Z" → "Z"). Maximal 3 Pässe für Sicherheit.
  let result = s.trim();
  for (let pass = 0; pass < 3; pass++) {
    const before = result;
    for (const re of patterns) {
      result = result.replace(re, "");
    }
    if (result === before) break;
  }
  // Erstes Zeichen groß schreiben falls nötig.
  if (result.length > 0 && result[0] !== result[0].toUpperCase()) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result.trim();
}

export interface NamentlicheVoteIndexEntry {
  type: "namentlich";
  subtype: VoteSubtype;
  id: string;
  detail_url: string;
  label: string | null;
  date: string | null;
  outcome: "angenommen" | "abgelehnt";
  outcome_label: string;
  drucksache_nrn: string[];
  topics: string[];
  poll_id: number;
  yes: number;
  no: number;
  abstain: number;
  no_show: number;
  total: number;
  has_topic_match: 0 | 1;
  match_confidence: string | null;
  speech_count: number;
}

export interface HandzeichenVoteIndexEntry {
  type: "handzeichen" | "hammelsprung" | "unklar";
  subtype: VoteSubtype;
  id: string;
  detail_url: string;
  label: string | null;
  date: string | null;
  outcome: "angenommen" | "abgelehnt" | "vertagt" | "ueberwiesen" | "unklar";
  outcome_label: string;
  drucksache_nrn: string[];
  topics: string[];
  vote_id: number;
  modus: string | null;
  // ACHTUNG: Bei beschlussAblehnung=true sind diese Stimmen bereits zur
  // „Position zum Antrag" gedreht (ja↔nein), NICHT die Rohstimme über die
  // Beschlussempfehlung. So passen Balken/Pills zum outcome_label.
  fraktion_votes: Record<string, string> | null;
  // true = abgestimmt wurde über eine Beschlussempfehlung, die die ABLEHNUNG
  // dieses Antrags empfiehlt → outcome + fraktion_votes sind auf Antrags-Ebene
  // gedreht (sonst läse sich „CDU stimmt zu" als Zustimmung zum Antrag, obwohl
  // sie der Ablehnungs-Empfehlung zugestimmt hat). Vgl. Detailseite.
  beschlussAblehnung: boolean;
  sitzung_nr: number | null;
  wahlperiode: number | null;
}

export type VoteIndexEntry = NamentlicheVoteIndexEntry | HandzeichenVoteIndexEntry;

/** Vereint die alten namentlichen Abstimmungen mit den per Handzeichen
 *  bekannten Vote-Events (aus bundestag_votes). Sortierung: neueste zuerst. */
export function listAllVotesForIndex(): VoteIndexEntry[] {
  const db = getDb();
  const entries: VoteIndexEntry[] = [];

  // 1. Namentliche Abstimmungen aus `votes` (mit Topic-Match + Reden-Count
  //    + aw-Topics aus poll_aw_topics).
  const namentlich = db.prepare(`
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
      ), 0) AS speech_count,
      (SELECT topics_json FROM poll_aw_topics WHERE poll_id = v.poll_id) AS aw_topics_json
    FROM votes v
    LEFT JOIN vote_topic_links vtl ON vtl.poll_id = v.poll_id
    GROUP BY v.poll_id, v.poll_label, v.poll_date
  `).all() as Array<{
    poll_id: number; poll_label: string | null; poll_date: string | null;
    yes: number; no: number; abstain: number; no_show: number; total: number;
    has_topic_match: 0 | 1; match_confidence: string | null; speech_count: number;
    aw_topics_json: string | null;
  }>;

  for (const p of namentlich) {
    const passed = p.yes > p.no;
    const topics: string[] = p.aw_topics_json
      ? (() => { try { return JSON.parse(p.aw_topics_json!) as string[]; } catch { return []; } })()
      : [];
    entries.push({
      type: "namentlich",
      subtype: "gesetz", // namentliche Abstimmungen sind fast immer Gesetze/Anträge
      id: `poll:${p.poll_id}`,
      detail_url: `/abstimmungen/${p.poll_id}`,
      label: p.poll_label,
      date: p.poll_date,
      outcome: passed ? "angenommen" : "abgelehnt",
      outcome_label: passed ? "angenommen" : "abgelehnt",
      drucksache_nrn: [],
      topics,
      poll_id: p.poll_id,
      yes: p.yes, no: p.no, abstain: p.abstain, no_show: p.no_show, total: p.total,
      has_topic_match: p.has_topic_match,
      match_confidence: p.match_confidence,
      speech_count: p.speech_count,
    });
  }

  // 2. Handzeichen/Hammelsprung-Votes aus `bundestag_votes` — keine
  //    per-MdB-Daten, Label = Drucksachen-Zusammenfassung, Detail-Link
  //    auf DS-Seite.
  try {
    const btv = db.prepare(`
      SELECT bv.vote_id, bv.sitzung_nr, bv.wahlperiode, bv.datum, bv.outcome,
             bv.vote_type, bv.vote_subtype, bv.modus, bv.fraktion_votes_json,
             bv.drucksache_nrn_json, bv.raw_snippet
      FROM bundestag_votes bv
      WHERE bv.outcome != 'kein_vote' AND bv.error_type IS NULL
    `).all() as Array<{
      vote_id: number; sitzung_nr: number | null; wahlperiode: number | null;
      datum: string | null; outcome: string; vote_type: string; vote_subtype: string | null;
      modus: string | null;
      fraktion_votes_json: string | null; drucksache_nrn_json: string | null;
      raw_snippet: string | null;
    }>;

    const outcomeMap: Record<string, { o: HandzeichenVoteIndexEntry["outcome"]; l: string }> = {
      annahme: { o: "angenommen", l: "angenommen" },
      annahme_geaendert: { o: "angenommen", l: "in geänderter Fassung angenommen" },
      ablehnung: { o: "abgelehnt", l: "abgelehnt" },
      vertagung: { o: "vertagt", l: "vertagt" },
      ueberweisung: { o: "ueberwiesen", l: "an Ausschuss überwiesen" },
    };

    // Beschlussempfehlungs-Flip: vote_id+ds_nr, bei denen über eine die ABLEHNUNG
    // empfehlende Beschlussempfehlung abgestimmt wurde. Für diese Paare drehen wir
    // outcome + fraktion_votes auf die Antrags-Ebene (sonst widerspricht der grüne
    // Balken dem „abgelehnt"-Label — die Rohstimme „ja" galt der Ablehnungs-Empfehlung).
    const ablehnungFlip = new Map<number, Set<string>>();
    try {
      const fr = db.prepare(
        `SELECT vote_id, ds_nr FROM vote_beschluss_kontext WHERE empfiehlt='ablehnen'`
      ).all() as { vote_id: number; ds_nr: string }[];
      for (const r of fr) {
        if (!ablehnungFlip.has(r.vote_id)) ablehnungFlip.set(r.vote_id, new Set());
        ablehnungFlip.get(r.vote_id)!.add(r.ds_nr);
      }
    } catch { /* Tabelle evtl. nicht vorhanden */ }

    for (const v of btv) {
      // DS-Refs: invalide Platzhalter (z.B. "21/XXXX") aus LLM-Halluzinationen filtern.
      const dsNrnRaw: string[] = v.drucksache_nrn_json
        ? (() => { try { return JSON.parse(v.drucksache_nrn_json!) as string[]; } catch { return []; } })()
        : [];
      const dsNrn = dsNrnRaw.filter((nr) => /^\d{1,3}\/\d{3,}$/.test(nr));
      let label: string | null = null;
      let topics: string[] = [];
      // Disambiguierungs-Hinweis aus dem PlPr-Snippet (vor allem "Einzelplan XX —
      // Bundesministerium für …" bei Haushalts-Abstimmungen, die alle dieselbe
      // übergeordnete DS referenzieren). NUR für Gesetz-Subtype — bei Petition/
      // Personenwahl-Votes im selben Snippet-Block würde sonst der Hint aus
      // einem benachbarten Haushalts-Vote fälschlich übernommen.
      const einzelplanHint = v.vote_subtype === "gesetz"
        ? extractEinzelplanHint(v.raw_snippet)
        : null;
      if (dsNrn.length > 0) {
        const row = db.prepare(
          `SELECT kerninhalt, zusammenfassung, thema FROM drucksache_analyses WHERE drucksache_nr=?`
        ).get(dsNrn[0]) as { kerninhalt: string | null; zusammenfassung: string | null; thema: string | null } | undefined;
        // 1) Bevorzugt: erste Bullet aus kerninhalt — LLM sollte party-frei sein,
        //    aber wir strippen safety-halber nochmal Party-Prefixe (kommt bei
        //    Anträgen mit "Grüne fordern X" oder "BÜNDNIS 90/DIE GRÜNEN ..." vor).
        if (row?.kerninhalt) {
          try {
            const arr = JSON.parse(row.kerninhalt) as string[];
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") {
              label = stripPartyPrefix(arr[0]).trim();
            }
          } catch { /* fall through */ }
        }
        // 2) Fallback: zusammenfassung, Party-Prefix strippen.
        if (!label && row?.zusammenfassung) {
          label = stripPartyPrefix(row.zusammenfassung).slice(0, 180);
        }
        // 3) Topics aus dem CSV-Feld `thema` (z.B. "Finanzen, Verteidigung").
        if (row?.thema) {
          topics = row.thema.split(",").map((s) => s.trim()).filter(Boolean);
        }
        // 4) Falls keine Analyse: DIP-Titel als Fallback (z.B. für
        //    Wahlvorschläge, Petitions-Sammelübersichten, Verfahrens-Anträge).
        if (!label) {
          const dip = db.prepare(
            `SELECT titel FROM dip_ds_titles WHERE drucksache_nr=?`
          ).get(dsNrn[0]) as { titel: string | null } | undefined;
          if (dip?.titel) label = dip.titel.trim();
        }
      }
      // Einzelplan-Hint hat Priorität als Label, weil sonst alle Haushalts-Voten
      // gleich heißen. Kerninhalt nur als Suffix wenn er etwas Spezifisches
      // hinzufügt (nicht "Die Drucksache ist eine Ergänzung…" etc.).
      if (einzelplanHint) {
        label = label && !isGenericKerninhalt(label)
          ? `${einzelplanHint} · ${label}`
          : einzelplanHint;
      }
      // Fallback wenn nichts gegriffen hat: Datum + Dokumenttyp aus snippet.
      // Beispiel: "Gesetzentwurf · 24. April 2026". Lieber das anzeigen als
      // den Vote ganz weglassen — auch ohne klares Thema ist das
      // Abstimmungsverhalten der Fraktionen wertvoll.
      if (!label) {
        const docType = inferDocTypeFromSnippet(v.raw_snippet);
        const dateStr = v.datum
          ? new Date(v.datum + "T00:00:00").toLocaleDateString("de-DE", {
              day: "2-digit", month: "long", year: "numeric",
            })
          : "Datum unbekannt";
        if (dsNrn.length > 0) {
          label = `${docType} · Drucksache ${dsNrn.join(", ")}`;
        } else {
          label = `${docType} vom ${dateStr}`;
        }
      }
      // Flip greift, wenn dieser Vote überhaupt eine Ablehnungs-Beschlussempfehlung war
      // — unabhängig davon, ob die Antrags-DS an Position 0 oder 1 steht (sonst flippte
      // nur die Hälfte der Fälle, in denen die Beschlussempfehlungs-DS zuerst gelistet ist).
      const flip = (ablehnungFlip.get(v.vote_id)?.size ?? 0) > 0;
      // outcome auf Antrags-Ebene (identisch zur Detailseite): „ja" zur Ablehnungs-
      // Empfehlung (annahme) bedeutet, der Antrag wurde abgelehnt.
      const oc = flip && v.outcome === "annahme"
        ? { o: "abgelehnt" as const, l: "abgelehnt" }
        : outcomeMap[v.outcome] ?? { o: "unklar" as const, l: v.outcome };
      const detail_url = dsNrn.length > 0
        ? `/aktivitaeten/${dsNrn[0].replace("/", "-")}`
        : `/abstimmungen`;
      const type: HandzeichenVoteIndexEntry["type"] =
        v.vote_type === "handzeichen" || v.vote_type === "hammelsprung"
          ? v.vote_type
          : "unklar";
      const fraktion_votes_raw: Record<string, string> | null = v.fraktion_votes_json
        ? (() => { try { return JSON.parse(v.fraktion_votes_json!) as Record<string, string>; } catch { return null; } })()
        : null;
      // Bei Flip ja↔nein drehen → „Position zum Antrag" (Enthaltung/unbekannt bleiben).
      const fraktion_votes: Record<string, string> | null = flip && fraktion_votes_raw
        ? Object.fromEntries(
            Object.entries(fraktion_votes_raw).map(([k, val]) =>
              [k, val === "ja" ? "nein" : val === "nein" ? "ja" : val]
            )
          )
        : fraktion_votes_raw;
      const subtype: VoteSubtype =
        v.vote_subtype === "gesetz" || v.vote_subtype === "petition" || v.vote_subtype === "personenwahl"
          ? v.vote_subtype
          : "unbekannt";
      entries.push({
        type,
        subtype,
        id: `btv:${v.vote_id}`,
        detail_url,
        label,
        date: v.datum,
        outcome: oc.o,
        outcome_label: oc.l,
        drucksache_nrn: dsNrn,
        topics,
        vote_id: v.vote_id,
        modus: v.modus,
        fraktion_votes,
        beschlussAblehnung: flip,
        sitzung_nr: v.sitzung_nr,
        wahlperiode: v.wahlperiode,
      });
    }
  } catch { /* table evt. noch leer */ }

  entries.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return entries;
}

// Handzeichen-Vote-Events für eine konkrete Bundestags-Drucksache —
// gefiltert via JSON-each über drucksache_nrn_json.
export interface BundestagDsHandzeichenVote {
  voteId: number;
  sitzungNr: number | null;
  wahlperiode: number | null;
  datum: string | null;
  voteType: string;
  outcome: string;
  modus: string | null;
  fraktionVotes: Record<string, string> | null;
  drucksacheNrn: string[];
  xmlSource: string;
  // true = abgestimmt wurde über eine Beschlussempfehlung, die die Ablehnung DIESES
  // Antrags empfiehlt → die rohe Stimme ist gegenläufig zur Position zum Antrag.
  beschlussAblehnung: boolean;
}

export function getBundestagDsHandzeichenVotes(dsNr: string): BundestagDsHandzeichenVote[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT bv.vote_id, bv.sitzung_nr, bv.wahlperiode, bv.datum, bv.vote_type, bv.outcome, bv.modus,
             bv.fraktion_votes_json,
             bv.drucksache_nrn_json, bv.xml_source,
             vbk.empfiehlt AS beschluss_empfiehlt
      FROM bundestag_votes bv, json_each(bv.drucksache_nrn_json) AS j
      -- Flip gilt für den GESAMTEN Vote (eine Beschlussempfehlung empfiehlt die
      -- Ablehnung genau eines Antrags). Join nur auf vote_id, NICHT auf ds_nr —
      -- sonst flippt nur die Antrags-Seite, nicht die Beschlussempfehlungs-DS-Seite,
      -- die aus der Abstimmungs-Liste verlinkt wird. (Jeder Vote in der Tabelle hat
      -- genau eine Antrags-DS, daher keine Über-Flip-Gefahr.)
      LEFT JOIN vote_beschluss_kontext vbk ON vbk.vote_id = bv.vote_id
      WHERE j.value = ? AND bv.error_type IS NULL AND bv.outcome != 'kein_vote'
      ORDER BY bv.datum DESC, bv.snippet_offset ASC
    `).all(dsNr) as Array<{
      vote_id: number; sitzung_nr: number | null; wahlperiode: number | null;
      datum: string | null; vote_type: string; outcome: string; modus: string | null;
      fraktion_votes_json: string | null; drucksache_nrn_json: string | null; xml_source: string;
      beschluss_empfiehlt: string | null;
    }>;
    const parseObj = <T,>(s: string | null): T | null => {
      if (!s) return null;
      try { return JSON.parse(s) as T; } catch { return null; }
    };
    return rows.map((r) => ({
      voteId: r.vote_id,
      sitzungNr: r.sitzung_nr,
      wahlperiode: r.wahlperiode,
      datum: r.datum,
      voteType: r.vote_type,
      outcome: r.outcome,
      modus: r.modus,
      fraktionVotes: parseObj<Record<string, string>>(r.fraktion_votes_json),
      drucksacheNrn: parseObj<string[]>(r.drucksache_nrn_json) ?? [],
      xmlSource: r.xml_source,
      beschlussAblehnung: r.beschluss_empfiehlt === "ablehnen",
    }));
  } catch {
    return [];
  }
}

// ============================================================
// Kombinierter Vote-Index: namentliche Abstimmungen + Handzeichen-
// Fraktions-Votes (Bundestag + Berlin) in einer einheitlichen Liste.
// ============================================================

export interface BerlinVoteIndexEntry {
  // Identität + Routing
  id: string;                                 // "poll:6147" | "btv:42" | "blv:103"
  type: "namentlich" | "handzeichen_bundestag" | "handzeichen_berlin";
  subtype: "gesetz" | "petition" | "personenwahl" | "unbekannt"; // für Default-Filter
  detail_url: string;
  // Anzeige
  label: string | null;
  date: string | null;
  outcome: "angenommen" | "abgelehnt" | "vertagt" | "ueberwiesen" | "unklar";
  outcome_label: string;
  // Stats
  yes: number | null;
  no: number | null;
  abstain: number | null;
  fraktion_votes: Record<string, string> | null;
  // Kontext
  drucksache_nrn: string[];
  parliament: "Bundestag" | "Berlin";
}

/** Robuste Berlin-DS-Titel-Auflösung: beste betitelte dbid (titel→abstract→desk)
 *  + Vorgangs-Fallback bei generischen/„zu Drucksache"-Querverweis-Titeln.
 *  Spiegelt die Inline-Logik in getBerlinSitzungDetail — hier für den Vote-Index,
 *  damit beide Oberflächen identisch auflösen (kein „dbids[0].titel"-Fallback mehr). */
function resolveBerlinDsTitle(db: ReturnType<typeof getDb>, dbids: string[]): string | null {
  const isGeneric = (t: string | null): boolean => {
    if (!t) return true;
    const s = t.trim();
    if (s.length < 12) return true;
    if (/^zu[rm]?\s+Drucksache\s/i.test(s)) return true;
    return /^(Beschlussempfehlung|Mitteilung zur Kenntnisnahme|Vorlage|Antrag|Drucksache|Gesetzentwurf)(\s|$)/i.test(s);
  };
  const titelStmt = db.prepare(
    `SELECT COALESCE(NULLIF(titel,''),NULLIF(abstract,''),NULLIF(desk,'')) AS titel, vorgang_id
     FROM berlin_documents WHERE dbid=?`,
  );
  const vorgangStmt = db.prepare(
    `SELECT COALESCE(NULLIF(titel,''),NULLIF(abstract,'')) AS titel FROM berlin_documents
     WHERE vorgang_id=? AND (dok_typ_label LIKE '%Antrag%' OR dok_typ_label LIKE '%Gesetzentwurf%' OR dok_typ_label LIKE '%Vorlage%')
       AND COALESCE(NULLIF(titel,''),NULLIF(abstract,'')) IS NOT NULL
     ORDER BY CASE WHEN dok_typ_label LIKE '%Antrag%' THEN 1 WHEN dok_typ_label LIKE '%Gesetzentwurf%' THEN 2 ELSE 3 END LIMIT 1`,
  );
  for (const dbid of dbids) {
    const t = titelStmt.get(dbid) as { titel: string | null; vorgang_id: string | null } | undefined;
    let eff = t?.titel ?? null;
    if (isGeneric(eff) && t?.vorgang_id) {
      const vt = vorgangStmt.get(t.vorgang_id) as { titel: string | null } | undefined;
      if (vt?.titel?.trim()) eff = vt.titel;
    }
    if (eff && eff.trim() && !isGeneric(eff)) return eff;
  }
  // Letzter Fallback: erste dbid mit irgendeinem nicht-leeren Titel.
  for (const dbid of dbids) {
    const t = titelStmt.get(dbid) as { titel: string | null } | undefined;
    if (t?.titel?.trim()) return t.titel;
  }
  return null;
}

export function listBerlinVotesForIndex(): BerlinVoteIndexEntry[] {
  const db = getDb();
  const entries: BerlinVoteIndexEntry[] = [];

  // 1. Bundestag namentliche Abstimmungen
  const namentlich = db.prepare(`
    SELECT v.poll_id, v.poll_label, v.poll_date,
      SUM(CASE WHEN v.vote='yes' THEN 1 ELSE 0 END) AS yes,
      SUM(CASE WHEN v.vote='no' THEN 1 ELSE 0 END) AS no,
      SUM(CASE WHEN v.vote='abstain' THEN 1 ELSE 0 END) AS abstain
    FROM votes v
    GROUP BY v.poll_id, v.poll_label, v.poll_date
  `).all() as Array<{ poll_id: number; poll_label: string | null; poll_date: string | null; yes: number; no: number; abstain: number }>;
  for (const p of namentlich) {
    const passed = p.yes > p.no;
    // Namentliche Abstimmungen sind fast immer echte Gesetzes-/Antrags-Voten
    entries.push({
      id: `poll:${p.poll_id}`,
      type: "namentlich",
      subtype: "gesetz",
      detail_url: `/abstimmungen/${p.poll_id}`,
      label: p.poll_label,
      date: p.poll_date,
      outcome: passed ? "angenommen" : "abgelehnt",
      outcome_label: passed ? "angenommen" : "abgelehnt",
      yes: p.yes, no: p.no, abstain: p.abstain,
      fraktion_votes: null,
      drucksache_nrn: [],
      parliament: "Bundestag",
    });
  }

  // 2. Bundestag Handzeichen-Votes (mit DS-Title als Label)
  try {
    const btv = db.prepare(`
      SELECT bv.vote_id, bv.datum, bv.outcome, bv.fraktion_votes_json, bv.drucksache_nrn_json, bv.vote_subtype
      FROM bundestag_votes bv
      WHERE bv.outcome != 'kein_vote' AND bv.error_type IS NULL
    `).all() as Array<{ vote_id: number; datum: string | null; outcome: string; fraktion_votes_json: string | null; drucksache_nrn_json: string | null; vote_subtype: string | null }>;
    for (const v of btv) {
      const dsNrn: string[] = v.drucksache_nrn_json ? (() => { try { return JSON.parse(v.drucksache_nrn_json); } catch { return []; } })() : [];
      // Titel/Label: erste DS-Zusammenfassung
      let label: string | null = null;
      if (dsNrn.length > 0) {
        const row = db.prepare(`SELECT substr(zusammenfassung, 1, 120) AS s FROM drucksache_analyses WHERE drucksache_nr=?`).get(dsNrn[0]) as { s: string | null } | undefined;
        if (row?.s) label = row.s;
        if (!label) label = `Drucksache${dsNrn.length > 1 ? "n" : ""} ${dsNrn.join(", ")}`;
      }
      const outcomeMap: Record<string, { o: BerlinVoteIndexEntry["outcome"]; l: string }> = {
        annahme:           { o: "angenommen", l: "angenommen" },
        annahme_geaendert: { o: "angenommen", l: "in geänderter Fassung angenommen" },
        ablehnung:         { o: "abgelehnt",  l: "abgelehnt" },
        vertagung:         { o: "vertagt",    l: "vertagt" },
        ueberweisung:      { o: "ueberwiesen", l: "an Ausschuss überwiesen" },
      };
      const oc = outcomeMap[v.outcome] ?? { o: "unklar" as const, l: v.outcome };
      const detail_url = dsNrn.length > 0
        ? `/aktivitaeten/${dsNrn[0].replace("/", "-")}`
        : `/abstimmungen`; // Fallback
      const subtype = (v.vote_subtype as "gesetz" | "petition" | "personenwahl" | null) ?? "unbekannt";
      entries.push({
        id: `btv:${v.vote_id}`,
        type: "handzeichen_bundestag",
        subtype,
        detail_url,
        label,
        date: v.datum,
        outcome: oc.o,
        outcome_label: oc.l,
        yes: null, no: null, abstain: null,
        fraktion_votes: v.fraktion_votes_json ? (() => { try { return JSON.parse(v.fraktion_votes_json) as Record<string, string>; } catch { return null; } })() : null,
        drucksache_nrn: dsNrn,
        parliament: "Bundestag",
      });
    }
  } catch { /* table evt. noch leer */ }

  // 3. Berlin Handzeichen-Votes
  try {
    const blv = db.prepare(`
      SELECT bv.vote_id, bv.datum, bv.outcome, bv.fraktion_votes_json, bv.drucksache_nrn_json, bv.drucksache_dbids_json, bv.vote_subtype
      FROM berlin_votes bv
      WHERE bv.outcome != 'kein_vote' AND bv.error_type IS NULL
        AND bv.drucksache_dbids_json IS NOT NULL AND bv.drucksache_dbids_json NOT IN ('', '[]')
    `).all() as Array<{ vote_id: number; datum: string | null; outcome: string; fraktion_votes_json: string | null; drucksache_nrn_json: string | null; drucksache_dbids_json: string | null; vote_subtype: string | null }>;
    for (const v of blv) {
      const dsNrn: string[] = v.drucksache_nrn_json ? (() => { try { return JSON.parse(v.drucksache_nrn_json); } catch { return []; } })() : [];
      const dbids: string[] = v.drucksache_dbids_json ? (() => { try { return JSON.parse(v.drucksache_dbids_json); } catch { return []; } })() : [];
      // Titel: robuste Auflösung (best-titled dbid + abstract + Vorgangs-Fallback),
      // identisch zur Sitzungs-Seite. Fallback nur wenn gar kein Titel auffindbar.
      let label: string | null = resolveBerlinDsTitle(db, dbids);
      if (!label && dsNrn.length > 0) label = `Berlin-Drucksache ${dsNrn.join(", ")}`;
      const outcomeMap: Record<string, { o: BerlinVoteIndexEntry["outcome"]; l: string }> = {
        annahme:           { o: "angenommen", l: "angenommen" },
        annahme_geaendert: { o: "angenommen", l: "in geänderter Fassung angenommen" },
        ablehnung:         { o: "abgelehnt",  l: "abgelehnt" },
        vertagung:         { o: "vertagt",    l: "vertagt" },
        ueberweisung:      { o: "ueberwiesen", l: "an Ausschuss überwiesen" },
      };
      const oc = outcomeMap[v.outcome] ?? { o: "unklar" as const, l: v.outcome };
      const detail_url = dbids.length > 0
        ? `/parlamente/berlin/drucksache/${dbids[0]}`
        : `/parlamente/berlin`;
      const subtype = (v.vote_subtype as "gesetz" | "petition" | "personenwahl" | null) ?? "unbekannt";
      entries.push({
        id: `blv:${v.vote_id}`,
        type: "handzeichen_berlin",
        subtype,
        detail_url,
        label,
        date: v.datum,
        outcome: oc.o,
        outcome_label: oc.l,
        yes: null, no: null, abstain: null,
        fraktion_votes: v.fraktion_votes_json ? (() => { try { return JSON.parse(v.fraktion_votes_json) as Record<string, string>; } catch { return null; } })() : null,
        drucksache_nrn: dsNrn,
        parliament: "Berlin",
      });
    }
  } catch { /* table evt. noch leer */ }

  entries.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return entries;
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
  kerninhaltFrage: string[] | null;   // Phase C: getrennte Frage-Bullets (Anfrage-Antwort)
  kerninhaltAntwort: string[] | null; // Phase C: getrennte Antwort-Bullets
  kerninhaltQaPaare: { frage: string; antwort: string }[] | null; // gepaarte Q&A (bullet-pairing)
  antwortCharakter: string | null;    // substantiell | teilantwortend | ausweichend
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
  thema: string | null;        // Subjekt der Frage/des Beitrags (was es war)
  typLabel: string;            // präzisiertes Label (Schriftl./Mündl. Frage etc.)
  istSchriftlich: boolean;     // dokumentart=Drucksache → nicht "im Plenum"
}

export function getDrucksacheDetail(nr: string): DrucksacheDetail | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT
      a.drucksache_nr, a.batch_class,
      t.pages, t.tokens_estimate,
      a.zusammenfassung, a.kerninhalt, a.thema, a.tonalitaet,
      a.kerninhalt_frage_json, a.kerninhalt_antwort_json, a.kerninhalt_qa_paare_json, a.antwort_charakter,
      a.betroffene_gruppen, a.fraktion, a.dokumenttyp,
      a.regelung, a.begruendung, a.auswirkung, a.topic_drift_audit,
      a.model, a.prompt_version, a.generated_at,
      COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
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
  const parseArr = (s: string | null): string[] | null => {
    if (!s) return null;
    try { const v = JSON.parse(s); return Array.isArray(v) ? v.map(String) : null; } catch { return null; }
  };

  return {
    drucksache_nr: row.drucksache_nr,
    batch_class: row.batch_class,
    pages: row.pages,
    tokens_estimate: row.tokens_estimate,
    pdf_url: row.pdf_url,
    zusammenfassung: row.zusammenfassung,
    kerninhalt: kerninhaltParsed,
    kerninhaltFrage: parseArr(row.kerninhalt_frage_json),
    kerninhaltAntwort: parseArr(row.kerninhalt_antwort_json),
    kerninhaltQaPaare: (() => { try { const v = JSON.parse(row.kerninhalt_qa_paare_json || "null"); return Array.isArray(v) ? v : null; } catch { return null; } })(),
    antwortCharakter: row.antwort_charakter,
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

/** Konstruiert die bundestag.de-PDF-URL für eine Drucksache aus ihrer Nummer.
 *  Format: https://dserver.bundestag.de/btd/{WP}/{ordner}/{wp}{nr_padded5}.pdf
 *  Ordner-Regel: erste 3 Stellen der auf 5 Stellen mit Null aufgefüllten Nr.
 *  Beispiele: 21/0563 → /btd/21/005/2100563.pdf
 *             21/2902 → /btd/21/029/2102902.pdf
 *             21/1064 → /btd/21/010/2101064.pdf */
function buildDsPdfUrl(dsNr: string): string | null {
  const m = dsNr.match(/^(\d+)\/0*(\d+)$/);
  if (!m) return null;
  const wp = m[1];
  const nr5 = m[2].padStart(5, "0");
  const ordner = nr5.slice(0, 3);
  return `https://dserver.bundestag.de/btd/${wp}/${ordner}/${wp}${nr5}.pdf`;
}

export function getDrucksacheSkeleton(nr: string): DrucksacheSkeleton | null {
  const db = getDb();
  // ACHTUNG: `activities.titel` ist der Politiker-Name ("X, MdB, Fraktion"),
  // das echte DS-Thema steht in `activities.thema`. Fallback auf titel nur
  // falls thema NULL ist (sollte praktisch nie passieren).
  const row = db.prepare(`
    SELECT
      drucksache_nr,
      COALESCE(
        MAX(thema),
        (SELECT titel FROM dip_ds_titles t WHERE t.drucksache_nr = activities.drucksache_nr AND t.titel IS NOT NULL),
        MAX(titel)
      ) AS titel,
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
  if (row) return row;
  // DIP-only Fallback: Drucksachen, die wir nur über die DIP-Titel-Tabelle
  // kennen (Wahlvorschläge, Petitions-Sammelübersichten, Verfahrens-Anträge —
  // nicht in unserer activities-Tabelle, nicht in drucksache_analyses).
  // Liefert Skeleton mit DIP-Titel + konstruierter PDF-URL, damit die
  // Drucksachen-Detail-Seite zumindest auf die Original-Quelle verlinken kann.
  const dip = db.prepare(
    `SELECT titel, drucksachetyp, vorgangstyp FROM dip_ds_titles WHERE drucksache_nr = ?`
  ).get(nr) as { titel: string | null; drucksachetyp: string | null; vorgangstyp: string | null } | undefined;
  if (dip?.titel) {
    return {
      drucksache_nr: nr,
      titel: dip.titel,
      datum: null,
      urheber: null,
      aktivitaetsart: dip.vorgangstyp ?? dip.drucksachetyp ?? "Drucksache",
      drucksache_typ: dip.drucksachetyp,
      pdf_url: buildDsPdfUrl(nr),
      herausgeber: "Deutscher Bundestag",
    };
  }
  // Dritter Fallback: DIP-Vorgangsdaten (§2.3b). Greift v. a. für frische
  // Regierungs-Gesetzentwürfe — die haben weder MdB-Aktivitäten noch einen
  // dip_ds_titles-Stub, stehen aber als Einbringungs-Position im Vorgang.
  const vp = db.prepare(`
    SELECT v.titel, v.initiative_json, p.datum, p.vorgangsposition, p.fundstelle_json
    FROM dip_vorgang_positionen p
    JOIN dip_vorgaenge v ON v.id = p.vorgang_id
    WHERE p.dokumentnummer = ? AND p.dokumentart = 'Drucksache' AND p.herausgeber = 'BT'
    ORDER BY p.datum LIMIT 1
  `).get(nr) as {
    titel: string | null; initiative_json: string | null; datum: string | null;
    vorgangsposition: string; fundstelle_json: string | null;
  } | undefined;
  if (!vp?.titel) return null;
  const fundstelle = safeJson<{ pdf_url?: string }>(vp.fundstelle_json, {});
  return {
    drucksache_nr: nr,
    titel: vp.titel,
    datum: vp.datum,
    urheber: safeJson<string[]>(vp.initiative_json, []).join(", ") || null,
    aktivitaetsart: vp.vorgangsposition,
    drucksache_typ: null,
    pdf_url: fundstelle.pdf_url ?? buildDsPdfUrl(nr),
    herausgeber: "Deutscher Bundestag",
  };
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

/** Extrahiert sinnvolle Such-Token aus einem DIP-Drucksachen-Titel —
 *  Substantive ab 5 Zeichen, Stopwords entfernt, Bindestriche behalten.
 *  Wird genutzt um Aussprache-Reden via Volltext-Match zu finden. */
function extractTitleKeywords(title: string): string[] {
  const STOPWORDS = new Set([
    "Programm","Beratung","Antrag","Anträge","Entwurf","Gesetzes","Bundestag",
    "Abgeordneten","Fraktion","Fraktionen","Drucksache","Wahlperiode","Bundesregierung",
    "Bericht","Berichts","Beschlussempfehlung","Sammelübersicht","Petitionen",
    "Deutschland","Deutscher","Deutschen","Bundesrepublik","Grundgesetzes","Artikel",
    "Wahlvorschlag","Mitglieder","Mitglied",
  ]);
  return Array.from(
    new Set(
      title
        .split(/[\s,.\-–—:;()\/]+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 5)
        .filter((w) => /^[A-ZÄÖÜ]/.test(w)) // nur groß-geschriebene (Substantive/Eigennamen)
        .filter((w) => !STOPWORDS.has(w))
        .slice(0, 6),
    ),
  );
}

/** Strukturierte PDF-Parser-Ergebnisse aus `dip_ds_details` für eine DS.
 *  Wird auf der Stub-Detail-Seite gerendert (Sammelübersicht-Themen,
 *  Verfahrens-Beschluss-Klausel etc.). */
export type DsParsedDetails =
  | {
      pattern: "sammeluebersicht";
      nummer: number;
      total_petitionen: number;
      top_themen: Array<{ thema: string; count: number }>;
      beschlussempfehlungen: Array<{
        nummer: number;
        aktion: string;
        petitionen_count: number;
        themen: Array<{ thema: string; count: number }>;
        petitionen?: Array<{
          lfd_nr: number;
          aktenzeichen: string;
          plz: string | null;
          ort: string;
          sachgebiet: string;
        }>;
      }>;
    }
  | {
      pattern: "verfahren";
      beschluss_klausel: string;
      antragsteller: string[];
    }
  | {
      pattern: "wahlvorschlag";
      total_mitglieder: number;
      fraktion_sitze: Array<{ fraktion: string; mitglieder: number }>;
    }
  | { pattern: "substantiell" | "unknown" };

export function getDsParsedDetails(dsNr: string): DsParsedDetails | null {
  const db = getDb();
  try {
    const row = db.prepare(
      `SELECT details_json FROM dip_ds_details WHERE drucksache_nr = ?`,
    ).get(dsNr) as { details_json: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.details_json) as DsParsedDetails;
  } catch {
    return null;
  }
}

/** Findet die Plenardebatte zu einer Drucksache: für jede Vote-Sitzung, in der
 *  diese DS abgestimmt wurde, suche TOPs deren Reden Schlüsselbegriffe aus dem
 *  DIP-Titel erwähnen. Liefert die wahrscheinlichste Aussprache pro Sitzung —
 *  inklusive Liste der Reden (Speaker, Partei, Vote-Outcome-Datum). */
export interface DsPlenarContext {
  sitzungNr: number | null;
  datum: string | null;
  topNumber: string;
  topTitle: string;
  speeches: Array<{
    speechId: number;
    speaker: string;
    party: string | null;
    politicianId: number | null;
    speechIndex: number | null;
  }>;
}

export function getPlenarContextForDs(dsNr: string, dipTitle: string | null): DsPlenarContext[] {
  if (!dipTitle) return [];
  // Skip-Pattern: Routine-Verwaltungsakte ohne politische Aussprache.
  // Sammelübersichten + Wahlvorschläge + Anpassungsverfahren werden ohne
  // Debatte direkt abgestimmt; die generischen Schlüsselwörter ("Petitions-
  // ausschuss", "Wahl") matchen sonst jede Rede über das Thema und liefern
  // falsche Verbindungen.
  const ROUTINE_PATTERNS = [
    /^Sammelübersicht\s+\d+/i,
    /^Wahlvorschlag/i,
    /^Wahl\s+der?\s+(Vertreter|Mitglieder|Mitglied)/i,
    /^Anpassungsverfahren/i,
    /^Einsetzung\s+(des|eines)\s+(Gremiums|Parlamentarischen|Vertrauens)/i,
  ];
  if (ROUTINE_PATTERNS.some((re) => re.test(dipTitle))) return [];
  const keywords = extractTitleKeywords(dipTitle);
  if (keywords.length === 0) return [];
  const db = getDb();

  try {
    // 1. Alle Sitzungen, in denen die DS gevoted wurde.
    const votes = db.prepare(`
      SELECT DISTINCT xml_source, sitzung_nr, datum
      FROM bundestag_votes bv, json_each(bv.drucksache_nrn_json) AS j
      WHERE j.value = ? AND bv.error_type IS NULL AND bv.outcome != 'kein_vote'
    `).all(dsNr) as Array<{ xml_source: string; sitzung_nr: number | null; datum: string | null }>;

    const results: DsPlenarContext[] = [];
    for (const v of votes) {
      // 2. Volltext-OR-Match: Reden in dieser Sitzung, deren original_text
      //    mindestens einen Keyword enthält. Wir trauen dem ersten 5-Zeichen+
      //    Substantiv aus dem Titel — primitiv aber pragmatisch.
      const likeClauses = keywords.map(() => "ps.original_text LIKE ?").join(" OR ");
      const likeArgs = keywords.map((k) => `%${k}%`);

      // Gruppiere nach TOP — nimm den TOP mit der höchsten Trefferzahl.
      // Schwellwert: mindestens 3 Reden im TOP müssen Schlüsselbegriffe
      // erwähnen, sonst ist es ein zufälliger Wort-Match (z.B. Verfahrens-
      // Anträge ohne echte Aussprache).
      const rows = db.prepare(`
        SELECT ps.topic_id, ps.topic_number, ps.topic_title, COUNT(*) AS hits
        FROM plenar_speeches ps
        WHERE ps.xml_source = ? AND (${likeClauses})
        GROUP BY ps.topic_id, ps.topic_number, ps.topic_title
        HAVING hits >= 3
        ORDER BY hits DESC
        LIMIT 1
      `).all(v.xml_source, ...likeArgs) as Array<{
        topic_id: number | null; topic_number: string | null; topic_title: string | null; hits: number;
      }>;
      const topMatch = rows[0];
      if (!topMatch || !topMatch.topic_id) continue;

      // 3. Lade alle Reden dieses TOPs.
      const speeches = db.prepare(`
        SELECT ps.id, ps.speaker, ps.party, ps.speech_index,
               pol.id AS politician_id
        FROM plenar_speeches ps
        LEFT JOIN politicians pol ON pol.id = (
          SELECT politician_id FROM activities a WHERE a.id = ps.rede_id LIMIT 1
        )
        WHERE ps.topic_id = ?
        ORDER BY ps.speech_index ASC
      `).all(topMatch.topic_id) as Array<{
        id: number; speaker: string; party: string | null;
        speech_index: number | null; politician_id: number | null;
      }>;

      results.push({
        sitzungNr: v.sitzung_nr,
        datum: v.datum,
        topNumber: topMatch.topic_number ?? "?",
        topTitle: topMatch.topic_title ?? "",
        speeches: speeches.map((s) => ({
          speechId: s.id,
          speaker: s.speaker,
          party: s.party,
          politicianId: s.politician_id,
          speechIndex: s.speech_index,
        })),
      });
    }
    return results;
  } catch {
    return [];
  }
}

/** Holt alle Handzeichen-Vote-Events, die diese Drucksache referenzieren —
 *  schlanke Variante von getBundestagDsHandzeichenVotes() ohne Fraktions-Matrix,
 *  nur Identität + Sitzung + Outcome. Wird auf der DIP-only Stub-Seite genutzt,
 *  um zu zeigen "abgestimmt in Sitzung X am DD.MM.YYYY". */
export interface DsVoteSummary {
  voteId: number;
  sitzungNr: number | null;
  wahlperiode: number | null;
  datum: string | null;
  outcome: string;
  voteType: string;
}

export function getVotesReferencingDs(dsNr: string): DsVoteSummary[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT bv.vote_id, bv.sitzung_nr, bv.wahlperiode, bv.datum, bv.outcome, bv.vote_type
      FROM bundestag_votes bv, json_each(bv.drucksache_nrn_json) AS j
      WHERE j.value = ? AND bv.error_type IS NULL AND bv.outcome != 'kein_vote'
      ORDER BY bv.datum DESC, bv.snippet_offset ASC
    `).all(dsNr) as Array<{
      vote_id: number; sitzung_nr: number | null; wahlperiode: number | null;
      datum: string | null; outcome: string; vote_type: string;
    }>;
    return rows.map((r) => ({
      voteId: r.vote_id,
      sitzungNr: r.sitzung_nr,
      wahlperiode: r.wahlperiode,
      datum: r.datum,
      outcome: r.outcome,
      voteType: r.vote_type,
    }));
  } catch {
    return [];
  }
}

export function getRelatedSpeechesForDrucksache(nr: string, limit: number = 20): RelatedSpeechRow[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT a.politician_id, a.aktivitaetsart, a.typ, a.titel, a.datum,
           a.thema, a.dokumentart, a.drucksache_typ,
           p.first_name, p.last_name,
           pa.label AS party_label
    FROM activities a
    JOIN politicians p ON p.id = a.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE a.drucksache_nr = ?
      AND a.aktivitaetsart IN ('Rede','Kurzintervention','Zwischenfrage','Erwiderung','Frage','Antwort')
    ORDER BY a.datum DESC, p.last_name
    LIMIT ?
  `).all(nr, limit) as Array<RelatedSpeechRow & { dokumentart: string | null; drucksache_typ: string | null }>;
  return rows.map((r) => ({
    ...r,
    typLabel: typLabelForDip(r.aktivitaetsart, r.dokumentart, r.drucksache_typ),
    istSchriftlich: r.dokumentart === "Drucksache",
  }));
}

export interface DrucksacheQaPaar {
  paarIndex: number;
  fragestellerName: string | null;
  fragestellerParty: string | null;
  fragestellerPoliticianId: number | null;
  antwortSteller: string | null;
  antwortDatum: string | null;
  frageText: string | null;
  antwortText: string | null;
}

/** Einzelne Frage→Antwort-Paare aus „Schriftliche Fragen"-Sammeldrucksachen
 *  (deterministisch extrahiert, siehe scripts/extract-schriftliche-fragen-qa.ts). */
export function getDrucksacheQaPaare(nr: string): DrucksacheQaPaar[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT paar_index, fragesteller_name, fragesteller_party, fragesteller_politician_id,
             antwort_steller, antwort_datum, frage_text, antwort_text
      FROM drucksache_qa_paare WHERE drucksache_nr = ? ORDER BY paar_index
    `).all(nr) as any[];
    return rows.map((r) => ({
      paarIndex: r.paar_index,
      fragestellerName: r.fragesteller_name,
      fragestellerParty: r.fragesteller_party,
      fragestellerPoliticianId: r.fragesteller_politician_id,
      antwortSteller: r.antwort_steller,
      antwortDatum: r.antwort_datum,
      frageText: r.frage_text,
      antwortText: r.antwort_text,
    }));
  } catch {
    return [];
  }
}

export interface PoliticianQaPaar {
  pairId: number;
  drucksacheNr: string;
  paarIndex: number;
  frageText: string | null;
  antwortText: string | null;
  antwortSteller: string | null;
  ministerium: string | null;
  themenfeld: string | null;
  tldr: string | null;
  datum: string | null;
}

/** Schriftliche Einzelfragen + Antworten DIESER Abgeordneten (Rückwärts-Link).
 *  Angereichert um Themenfeld (Primär-Tag), neutrale Antwort-TL;DR und antwortendes Ministerium. */
export function getQaPaareForPolitician(politicianId: number, limit = 200): PoliticianQaPaar[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT qa.id, qa.drucksache_nr, qa.paar_index, qa.frage_text, qa.antwort_text, qa.antwort_steller,
             qa.antwort_ministerium,
             (SELECT themenfeld FROM drucksache_qa_themenfeld WHERE pair_id = qa.id AND ist_primaer = 1 LIMIT 1) AS themenfeld,
             (SELECT tldr FROM drucksache_qa_tldr WHERE pair_id = qa.id) AS tldr,
             (SELECT publication_date FROM drucksache_texts WHERE drucksache_nr = qa.drucksache_nr) AS datum
      FROM drucksache_qa_paare qa
      WHERE qa.fragesteller_politician_id = ?
      ORDER BY qa.drucksache_nr DESC, qa.paar_index
      LIMIT ?
    `).all(politicianId, limit) as any[];
    return rows.map((r) => ({
      pairId: r.id,
      drucksacheNr: r.drucksache_nr,
      paarIndex: r.paar_index,
      frageText: r.frage_text,
      antwortText: r.antwort_text,
      antwortSteller: r.antwort_steller,
      ministerium: r.antwort_ministerium,
      themenfeld: r.themenfeld,
      tldr: r.tldr,
      datum: r.datum,
    }));
  } catch {
    return [];
  }
}

export interface QaPaarListItem {
  drucksacheNr: string;
  paarIndex: number;
  fragestellerName: string | null;
  fragestellerParty: string | null;
  fragestellerPoliticianId: number | null;
  antwortSteller: string | null;
  datum: string | null;
  frageText: string | null;
  antwortText: string | null;
}

// ── Bürgerfragen (abgeordnetenwatch) ─────────────────────────────────────────
// Bürger:innen stellen öffentlich Fragen an Abgeordnete; diese antworten im
// Freitext. Quelle: aw_questions / aw_question_topics (HTML-Scrape, kein LLM).
// Anders als drucksache_qa_paare (MdB→Regierung) ist das die Bürger→MdB-Achse.

export interface BuergerfrageItem {
  frageUrl: string;
  frageText: string | null;
  asker: string | null;
  frageDatum: string | null;
  antwortText: string | null;
  antwortDatum: string | null;
  topics: string[];
}

export interface BuergerfragenData {
  total: number;          // alle an diese:n MdB gestellten Fragen
  beantwortet: number;
  ausstehend: number;
  quotePct: number;       // beantwortet / total
  baselineMedianPct: number; // Median-Antwortquote aller MdB (neutraler Vergleich)
  topics: { label: string; count: number }[]; // Verteilung über die geladenen (beantworteten) Fragen
  items: BuergerfrageItem[]; // beantwortete Fragen, neueste zuerst, gedeckelt
  itemsCapped: boolean;   // true, wenn mehr beantwortete Fragen existieren als geladen
  awUrl: string | null;   // Profil auf abgeordnetenwatch.de
}

// Modul-Cache: Median ist über alle Requests stabil (force-dynamic re-rendert,
// aber der Wert ändert sich nur bei Daten-Refresh / Prozess-Neustart).
let _awAnswerRateMedian: number | null = null;
function getAwAnswerRateMedian(): number {
  if (_awAnswerRateMedian !== null) return _awAnswerRateMedian;
  const db = getDb();
  try {
    const row = db.prepare(`
      WITH q AS (
        SELECT ROUND(100.0 * SUM(status = 'beantwortet') / COUNT(*)) AS pct
        FROM aw_questions GROUP BY politician_id HAVING COUNT(*) >= 5
      )
      SELECT pct FROM q ORDER BY pct LIMIT 1 OFFSET (SELECT COUNT(*) / 2 FROM q)
    `).get() as { pct: number } | undefined;
    _awAnswerRateMedian = row?.pct ?? 0;
  } catch {
    _awAnswerRateMedian = 0;
  }
  return _awAnswerRateMedian;
}

/**
 * Bürgerfragen-Archiv DIESER Abgeordneten: Aggregat (Antwortquote als Fakt +
 * Median-Baseline) plus die beantworteten Frage-Antwort-Paare (neueste zuerst,
 * gedeckelt). Liefert null, wenn keine Fragen vorliegen.
 */
export function getBuergerfragenForPolitician(
  politicianId: number,
  limit = 400
): BuergerfragenData | null {
  const db = getDb();
  try {
    const agg = db.prepare(`
      SELECT COUNT(*) AS total,
             SUM(status = 'beantwortet') AS beantwortet
      FROM aw_questions WHERE politician_id = ?
    `).get(politicianId) as { total: number; beantwortet: number | null } | undefined;
    if (!agg || agg.total === 0) return null;

    const total = agg.total;
    const beantwortet = agg.beantwortet ?? 0;
    const ausstehend = total - beantwortet;
    const quotePct = Math.round((100 * beantwortet) / total);

    const rows = db.prepare(`
      SELECT frage_url, frage_text, asker, frage_datum, antwort_text, antwort_datum
      FROM aw_questions
      WHERE politician_id = ? AND status = 'beantwortet'
      ORDER BY COALESCE(antwort_datum, frage_datum) DESC, frage_url
      LIMIT ?
    `).all(politicianId, limit) as Array<{
      frage_url: string;
      frage_text: string | null;
      asker: string | null;
      frage_datum: string | null;
      antwort_text: string | null;
      antwort_datum: string | null;
    }>;

    const topicStmt = db.prepare(
      // DISTINCT: ein Label kann über mehrere tids an derselben Frage hängen
      `SELECT DISTINCT label FROM aw_question_topics WHERE frage_url = ? ORDER BY label`
    );
    const items: BuergerfrageItem[] = rows.map((r) => ({
      frageUrl: r.frage_url,
      frageText: r.frage_text,
      asker: r.asker,
      frageDatum: r.frage_datum,
      antwortText: r.antwort_text,
      antwortDatum: r.antwort_datum,
      topics: (topicStmt.all(r.frage_url) as Array<{ label: string }>).map((t) => t.label),
    }));

    const topicCount = new Map<string, number>();
    for (const it of items) for (const t of it.topics) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
    const topics = [...topicCount.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "de"));

    const aw = db.prepare(`SELECT abgeordnetenwatch_url FROM politicians WHERE id = ?`)
      .get(politicianId) as { abgeordnetenwatch_url: string | null } | undefined;

    return {
      total,
      beantwortet,
      ausstehend,
      quotePct,
      baselineMedianPct: getAwAnswerRateMedian(),
      topics,
      items,
      itemsCapped: beantwortet > items.length,
      awUrl: aw?.abgeordnetenwatch_url ?? null,
    };
  } catch {
    return null;
  }
}

/* ── Themenfeld-Synthese aus Bürgerfragen ──────────────────────────────────
 * Pro Abgeordnete:r × Themenfeld eine neutrale Zusammenfassung der öffentlichen
 * Bürgerfragen: WORUM gefragt wird + WIE geantwortet wird (inkl. wo keine
 * Position bezogen wird). Quelle: aw_themenfeld_synthese (Mistral, aus den
 * Original-Q&A). n_fragen flaggt dünne Synthesen (1-Frage-Fälle). */
export type ThemenfeldSynthese = {
  feld: string;
  synthese: string;
  nFragen: number;
  nKontext: number;
  createdAt: string | null;
};

/**
 * Themenfeld-Synthesen dieser/dieses Abgeordneten, meistgefragtes Feld zuerst.
 * Phantom-Felder ausgeblendet: n=1-Synthesen, deren Frage primär zu einem ANDEREN
 * Feld gehört (z. B. eine LGBT/EU-Frage, die über einen Neben-Tag „Schulen" unter
 * „Bildung" landete), markiert durch aw_n1_hauptfeld.is_phantom=1.
 */
export function getAwThemenfeldSynthesen(politicianId: number): ThemenfeldSynthese[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT s.feld, s.synthese, s.n_fragen AS nFragen, s.n_kontext AS nKontext, s.created_at AS createdAt
      FROM aw_themenfeld_synthese s
      WHERE s.politician_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM aw_n1_hauptfeld h
          WHERE h.politician_id = s.politician_id AND h.feld = s.feld AND h.is_phantom = 1
        )
      ORDER BY s.n_fragen DESC, s.feld
    `).all(politicianId) as ThemenfeldSynthese[];
  } catch {
    return [];
  }
}

/* ── Bürgerfragen-Feed („Durchklicken") ─────────────────────────────────────
 * Gemischter, endlos blätterbarer Strom EINZELNER beantworteter Bürgerfragen
 * über ALLE Abgeordneten (nicht pro Person). Eine Karte = eine echte Frage +
 * der TL;DR der Antwort. Reihenfolge bewusst pseudo-zufällig (deterministischer
 * Seed-Shuffle), NICHT nach „Brisanz" gerankt — neutral-by-format, Parteien
 * gleichbehandelt. Nur Fragen mit TL;DR + Politiker-Foto (visuelle Karte). */
export type FrageFeedCard = {
  frageUrl: string;
  frageText: string;
  asker: string | null;
  frageDatum: string | null;
  tldr: string;
  antwortText: string | null;
  antwortDatum: string | null;
  politicianId: number;
  name: string;
  party: string | null;
  photoUrl: string | null;
  feld: string | null; // amtliches Themenfeld (eines, fürs Chip), null wenn ungetaggt
};

/**
 * Eine Seite des gemischten Bürgerfragen-Feeds. `seed` hält die Reihenfolge über
 * die Seiten EINER Session stabil (LCG-Scramble über rowid → kein Repeat, keine
 * seen-Liste nötig), `page` ist 0-basiert. Optional auf ein Themenfeld eingrenzbar.
 */
export function getFrageFeed(opts: {
  seed: number;
  page: number;
  perPage?: number;
  feld?: string | null;
}): FrageFeedCard[] {
  const db = getDb();
  const perPage = Math.max(1, Math.min(40, opts.perPage ?? 12));
  const offset = Math.max(0, opts.page) * perPage;
  // Seed in den positiven int32-Bereich normalisieren (deterministisch pro Session).
  const seed = (((opts.seed | 0) % 1000000007) + 1000000007) % 1000000007;
  const feld = opts.feld?.trim() || null;
  try {
    const feldFilter = feld
      ? `AND EXISTS (SELECT 1 FROM aw_question_topics qt
                     JOIN aw_tag_themenfeld tf ON tf.label = qt.label
                     WHERE qt.frage_url = q.frage_url AND tf.feld = @feld)`
      : "";
    const params: Record<string, unknown> = { seed, limit: perPage, offset };
    if (feld) params.feld = feld;
    return db.prepare(`
      SELECT
        q.frage_url      AS frageUrl,
        q.frage_text     AS frageText,
        q.asker          AS asker,
        q.frage_datum    AS frageDatum,
        t.tldr           AS tldr,
        q.antwort_text   AS antwortText,
        q.antwort_datum  AS antwortDatum,
        p.id             AS politicianId,
        p.first_name || ' ' || p.last_name AS name,
        pa.label         AS party,
        p.photo_url      AS photoUrl,
        (SELECT tf.feld FROM aw_question_topics qt
           JOIN aw_tag_themenfeld tf ON tf.label = qt.label
           WHERE qt.frage_url = q.frage_url AND tf.feld IS NOT NULL
           LIMIT 1) AS feld
      FROM aw_questions q
      JOIN aw_qa_tldr t   ON t.frage_url = q.frage_url
      JOIN politicians p  ON p.id = q.politician_id
      LEFT JOIN parties pa ON pa.id = p.party_id
      WHERE q.status = 'beantwortet'
        AND q.frage_text IS NOT NULL AND TRIM(q.frage_text) <> ''
        AND p.photo_url IS NOT NULL
        ${feldFilter}
      ORDER BY ((q.rowid * 2654435761 + @seed) % 1000000007), q.frage_url
      LIMIT @limit OFFSET @offset
    `).all(params) as FrageFeedCard[];
  } catch {
    return [];
  }
}

/** Themenfelder, die im Bürgerfragen-Feed tatsächlich vorkommen (+ Karten-Anzahl) — für die Filterleiste. */
export function getFrageFeedFelder(): { feld: string; count: number }[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT tf.feld AS feld, COUNT(DISTINCT q.frage_url) AS count
      FROM aw_questions q
      JOIN aw_qa_tldr t       ON t.frage_url = q.frage_url
      JOIN politicians p      ON p.id = q.politician_id
      JOIN aw_question_topics qt ON qt.frage_url = q.frage_url
      JOIN aw_tag_themenfeld tf  ON tf.label = qt.label AND tf.feld IS NOT NULL
      WHERE q.status = 'beantwortet' AND p.photo_url IS NOT NULL
      GROUP BY tf.feld
      HAVING count >= 20
      ORDER BY count DESC
    `).all() as { feld: string; count: number }[];
  } catch {
    return [];
  }
}

/** Fraktionen mit nennenswerter Fragezahl — für den Partei-Filter auf /fragen (Rauschen <20 ausgeblendet). */
export function getQaPaareParties(): { party: string; count: number }[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT fragesteller_party AS party, COUNT(*) AS count
      FROM drucksache_qa_paare
      WHERE fragesteller_party IS NOT NULL AND TRIM(fragesteller_party) <> ''
      GROUP BY fragesteller_party
      HAVING count >= 20
      ORDER BY count DESC
    `).all() as { party: string; count: number }[];
  } catch {
    return [];
  }
}

/**
 * Durchsuchbare, paginierte Liste aller Schriftliche-Fragen-Q&A-Paare (für /fragen).
 * Optional gefiltert nach Fragesteller-Partei und sortiert nach Datum (neu/alt).
 */
export function getQaPaareList(
  q: string,
  page: number,
  perPage = 50,
  party: string | null = null,
  sort: "neu" | "alt" = "neu"
): { items: QaPaarListItem[]; total: number } {
  const db = getDb();
  try {
    const conds: string[] = [];
    const params: Record<string, unknown> = { lim: perPage, off: (page - 1) * perPage };
    if (q) {
      conds.push(`(qa.frage_text LIKE @like OR qa.antwort_text LIKE @like OR qa.fragesteller_name LIKE @like)`);
      params.like = `%${q.replace(/[%_]/g, "")}%`;
    }
    if (party) {
      conds.push(`qa.fragesteller_party = @party`);
      params.party = party;
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const total = (db.prepare(`SELECT COUNT(*) AS c FROM drucksache_qa_paare qa ${where}`).get(params) as { c: number }).c;
    // Sortier-/Anzeige-Datum: pro-Paar-Antwortdatum (antwort_datum_iso, 98 % Coverage),
    // sonst publication_date der Sammeldrucksache. NULLs landen via „datum IS NULL"
    // in BEIDEN Richtungen ans Ende (sonst säßen die 4 dateless – und neuesten –
    // Docs bei „alt→neu" oben).
    const dir = sort === "alt" ? "ASC" : "DESC";
    const rows = db.prepare(`
      SELECT qa.drucksache_nr, qa.paar_index, qa.fragesteller_name, qa.fragesteller_party,
             qa.fragesteller_politician_id, qa.antwort_steller, qa.frage_text, qa.antwort_text,
             COALESCE(qa.antwort_datum_iso, (SELECT publication_date FROM drucksache_texts WHERE drucksache_nr = qa.drucksache_nr)) AS datum
      FROM drucksache_qa_paare qa ${where}
      ORDER BY datum IS NULL, datum ${dir}, qa.drucksache_nr ${dir}, qa.paar_index
      LIMIT @lim OFFSET @off
    `).all(params) as any[];
    return {
      total,
      items: rows.map((r) => ({
        drucksacheNr: r.drucksache_nr, paarIndex: r.paar_index,
        fragestellerName: r.fragesteller_name, fragestellerParty: r.fragesteller_party,
        fragestellerPoliticianId: r.fragesteller_politician_id, antwortSteller: r.antwort_steller,
        datum: r.datum, frageText: r.frage_text, antwortText: r.antwort_text,
      })),
    };
  } catch {
    return { items: [], total: 0 };
  }
}

// ============================================================
// Drucksachen-Related (Verfahrens-Zusammenhang + Themen-Ähnliche)
// ============================================================

export interface RelatedDsRow {
  drucksache_nr: string;
  titel: string | null;
  batch_class: string;
  dokumenttyp: string | null;
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
      SELECT a.drucksache_nr, a.batch_class, a.dokumenttyp, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
             COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
             COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum
      FROM drucksache_analyses a
      JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
      WHERE a.drucksache_nr=? AND a.analyze_error IS NULL
    `).get(parentNr) as RelatedDsRow | undefined) ?? null;
  }

  // Children: welche DS referenzieren DIESE?
  const children = db.prepare(`
    SELECT a.drucksache_nr, a.batch_class, a.dokumenttyp, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
           COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
           COALESCE((SELECT datum FROM activities WHERE drucksache_nr=a.drucksache_nr AND datum IS NOT NULL ORDER BY datum LIMIT 1), t.publication_date) AS datum
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE t.referenced_drucksache_nr = ? AND a.analyze_error IS NULL
    ORDER BY datum DESC
  `).all(nr) as RelatedDsRow[];

  return { parent, children };
}

// ============================================================
// Gesetzgebungs-Verfahren (DIP-Vorgangsdaten, DATA-SOURCES.md §2.3b)
// ============================================================

export interface GesetzgebungsSchritt {
  position: string;                  // amtliche Bezeichnung, z. B. "1. Beratung"
  zuordnung: string | null;          // "BT" | "BR"
  datum: string | null;
  dokumentart: string | null;        // "Drucksache" | "Plenarprotokoll"
  dokumentnummer: string | null;
  herausgeber: string | null;        // "BT" | "BR"
  ausschuesse: { ausschuss: string; federfuehrung: boolean }[];
  beschluesse: string[];             // beschlusstenor, z. B. "Annahme in Ausschussfassung"
}

export interface GesetzgebungsVorgangDetail {
  vorgangId: string;
  titel: string | null;
  beratungsstand: string | null;     // amtliches DIP-Vokabular, roh
  initiative: string[];
  zustimmungsbeduerftigkeit: string[];
  verkuendung: { fundstelle?: string; verkuendungsdatum?: string; pdf_url?: string }[];
  inkrafttreten: { datum: string; erlaeuterung?: string }[];
  aktualisiert: string | null;
  schritte: GesetzgebungsSchritt[];
}

function safeJson<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function getGesetzgebungsVorgang(dsNr: string): GesetzgebungsVorgangDetail | null {
  const db = getDb();
  // Praktisch 1:1 (Stand Seed 2026-06-11: kein GE mit >1 Vorgang); bei
  // Mehrfach-Zuordnung (z. B. Beschlussempfehlung über mehrere Vorgänge)
  // deterministisch den jüngsten Vorgang nehmen.
  const vg = db.prepare(`
    SELECT v.id, v.titel, v.beratungsstand, v.initiative_json,
           v.zustimmungsbeduerftigkeit_json, v.verkuendung_json,
           v.inkrafttreten_json, v.aktualisiert
    FROM dip_ds_vorgaenge dv
    JOIN dip_vorgaenge v ON v.id = dv.vorgang_id
    WHERE dv.drucksache_nr = ?
    ORDER BY v.datum DESC, v.id DESC
    LIMIT 1
  `).get(dsNr) as {
    id: string; titel: string | null; beratungsstand: string | null;
    initiative_json: string | null; zustimmungsbeduerftigkeit_json: string | null;
    verkuendung_json: string | null; inkrafttreten_json: string | null;
    aktualisiert: string | null;
  } | undefined;
  if (!vg) return null;

  // gang=1 ist DIPs eigener Marker für den "Gang der Gesetzgebung";
  // nachträgliche/geänderte Ausschuss-Überweisungen (gang=0) gehören
  // inhaltlich dazu — BR-Unterrichtungen mit Überweisung dagegen nicht.
  const rows = db.prepare(`
    SELECT vorgangsposition, zuordnung, datum, dokumentart, dokumentnummer,
           herausgeber, ueberweisung_json,
           json_extract(raw_json, '$.beschlussfassung') AS beschlussfassung_json
    FROM dip_vorgang_positionen
    WHERE vorgang_id = ?
      AND (gang = 1 OR (ueberweisung_json IS NOT NULL AND vorgangsposition LIKE '%Überweisung%'))
    ORDER BY datum, id
  `).all(vg.id) as {
    vorgangsposition: string; zuordnung: string | null; datum: string | null;
    dokumentart: string | null; dokumentnummer: string | null;
    herausgeber: string | null; ueberweisung_json: string | null;
    beschlussfassung_json: string | null;
  }[];

  const schritte: GesetzgebungsSchritt[] = rows.map((r) => ({
    position: r.vorgangsposition,
    zuordnung: r.zuordnung,
    datum: r.datum,
    dokumentart: r.dokumentart,
    dokumentnummer: r.dokumentnummer,
    herausgeber: r.herausgeber,
    ausschuesse: safeJson<{ ausschuss: string; federfuehrung: boolean }[]>(r.ueberweisung_json, []),
    beschluesse: safeJson<{ beschlusstenor?: string }[]>(r.beschlussfassung_json, [])
      .map((b) => b.beschlusstenor)
      .filter((t): t is string => Boolean(t)),
  }));

  return {
    vorgangId: vg.id,
    titel: vg.titel,
    beratungsstand: vg.beratungsstand,
    initiative: safeJson<string[]>(vg.initiative_json, []),
    zustimmungsbeduerftigkeit: safeJson<string[]>(vg.zustimmungsbeduerftigkeit_json, []),
    verkuendung: safeJson<{ fundstelle?: string; verkuendungsdatum?: string; pdf_url?: string }[]>(vg.verkuendung_json, []),
    inkrafttreten: safeJson<{ datum: string; erlaeuterung?: string }[]>(vg.inkrafttreten_json, []),
    aktualisiert: vg.aktualisiert,
    schritte,
  };
}

export interface LaufenderGesetzentwurf {
  drucksache_nr: string;
  titel: string | null;
  beratungsstand: string | null;
  initiative: string[];
  // Binnenphase aus Positions-Fakten (wie der Stepper auf der Detail-Seite)
  phase: "vor_erster_lesung" | "im_ausschuss" | "beschlussempfehlung";
  seitDatum: string | null;          // Beginn der aktuellen Binnenphase
  einbringungDatum: string | null;
  federfuehrenderAusschuss: string | null;
}

/**
 * Alle Gesetzentwürfe (BT-Drucksachen, WP21), über die der Bundestag noch
 * nicht abschließend abgestimmt hat — d. h. beratungsstand vor der
 * 2./3. Lesung. Post-Vote-Stände (Verabschiedet, Vermittlung, Bundesrat)
 * und Terminal-Stände (Verkündet, Abgelehnt, erledigt, …) sind raus.
 *
 * GE-Definition kommt aus den DIP-Positionen selbst (Einbringungs-Position
 * 'Gesetzentwurf'), NICHT aus drucksache_instrument: die PDF-Klassifikation
 * hängt Tage bis Wochen hinterher und labelt 18 GE als 'sonstiges' — über
 * den instrument-Join fehlten 31 laufende (v. a. die frischesten) Entwürfe.
 */
export function getLaufendeGesetzentwuerfe(): LaufenderGesetzentwurf[] {
  const db = getDb();
  const rows = db.prepare(`
    WITH dip_ge AS (
      SELECT DISTINCT p.dokumentnummer AS drucksache_nr, p.vorgang_id
      FROM dip_vorgang_positionen p
      WHERE p.vorgangsposition = 'Gesetzentwurf' AND p.zuordnung = 'BT'
        AND p.dokumentart = 'Drucksache' AND p.herausgeber = 'BT'
    )
    SELECT dv.drucksache_nr, v.titel, v.beratungsstand, v.initiative_json,
      (SELECT MIN(p.datum) FROM dip_vorgang_positionen p
        WHERE p.vorgang_id=v.id AND p.vorgangsposition IN ('Gesetzentwurf','Gesetzesantrag') AND p.zuordnung='BT') AS einbringung_datum,
      (SELECT MAX(p.datum) FROM dip_vorgang_positionen p
        WHERE p.vorgang_id=v.id AND p.vorgangsposition IN ('1. Beratung','1. Beratung (Gesetzentwurf)')) AS erste_beratung_datum,
      (SELECT MAX(p.datum) FROM dip_vorgang_positionen p
        WHERE p.vorgang_id=v.id AND p.vorgangsposition IN ('Beschlussempfehlung und Bericht','Beschlussempfehlung','Bericht')) AS be_datum,
      (SELECT p.ueberweisung_json FROM dip_vorgang_positionen p
        WHERE p.vorgang_id=v.id AND p.ueberweisung_json IS NOT NULL AND p.zuordnung='BT'
        ORDER BY p.datum DESC LIMIT 1) AS ueberweisung_json
    FROM dip_ge dv
    JOIN dip_vorgaenge v ON v.id = dv.vorgang_id
    WHERE v.beratungsstand NOT IN (
      'Verkündet','Verabschiedet','Abgelehnt','Für erledigt erklärt','Zurückgezogen',
      'Bundesrat hat zugestimmt','Bundesrat hat Zustimmung versagt',
      'Im Vermittlungsverfahren','Einbringung abgelehnt'
    )
    GROUP BY dv.drucksache_nr
  `).all() as {
    drucksache_nr: string; titel: string | null; beratungsstand: string | null;
    initiative_json: string | null; einbringung_datum: string | null;
    erste_beratung_datum: string | null; be_datum: string | null;
    ueberweisung_json: string | null;
  }[];

  return rows.map((r) => {
    const phase = r.be_datum
      ? ("beschlussempfehlung" as const)
      : r.erste_beratung_datum
        ? ("im_ausschuss" as const)
        : ("vor_erster_lesung" as const);
    const ueberweisung = safeJson<{ ausschuss: string; federfuehrung: boolean }[]>(r.ueberweisung_json, []);
    return {
      drucksache_nr: r.drucksache_nr,
      titel: r.titel,
      beratungsstand: r.beratungsstand,
      initiative: safeJson<string[]>(r.initiative_json, []),
      phase,
      seitDatum: r.be_datum ?? r.erste_beratung_datum ?? r.einbringung_datum,
      einbringungDatum: r.einbringung_datum,
      federfuehrenderAusschuss: ueberweisung.find((a) => a.federfuehrung)?.ausschuss ?? null,
    };
  });
}

export interface GesetzgebungsFunnelRow {
  einbringer: string;            // "Bundesregierung" | "Koalitionsfraktionen" | …
  gesamt: number;                // alle Gesetzgebungsvorgänge WP21
  imBundestag: number;           // BT-Drucksache existiert
  ersteLesung: number;
  zurAbstimmung: number;         // 3. Lesung/Schlussabstimmung ODER abgelehnt (2. Lesung)
  beschlossen: number;
  abgelehnt: number;
  wartendVorLesung: number;      // laufend, BT-DS da, noch keine 1. Lesung
  wartendSchnittTage: number | null;
}

/**
 * Gesetzgebungs-Trichter pro Einbringer (WP21, amtliche DIP-Vorgangsdaten):
 * Wer bringt ein, was erreicht die 1. Lesung, was kommt zur Abstimmung,
 * was wird beschlossen. "Zur Abstimmung" zählt auch Ablehnungen in der
 * 2. Lesung mit (danach entfällt die 3. Lesung, § 83 GO-BT).
 */
export function getGesetzgebungsFunnel(): GesetzgebungsFunnelRow[] {
  const db = getDb();
  return db.prepare(`
    WITH klass AS (
      SELECT v.id, v.beratungsstand,
        CASE
          WHEN v.initiative_json LIKE '%Bundesregierung%' THEN 'Bundesregierung'
          WHEN v.initiative_json LIKE '%CDU/CSU%' AND v.initiative_json LIKE '%SPD%' THEN 'Koalitionsfraktionen'
          WHEN v.initiative_json LIKE '%Fraktion%' THEN 'Oppositionsfraktionen'
          ELSE 'Länder (über den Bundesrat)'
        END AS einbringer,
        CASE
          WHEN v.initiative_json LIKE '%Bundesregierung%' THEN 1
          WHEN v.initiative_json LIKE '%CDU/CSU%' AND v.initiative_json LIKE '%SPD%' THEN 2
          WHEN v.initiative_json LIKE '%Fraktion%' THEN 3
          ELSE 4
        END AS sortier,
        EXISTS(SELECT 1 FROM dip_vorgang_positionen p WHERE p.vorgang_id=v.id
          AND p.vorgangsposition='Gesetzentwurf' AND p.zuordnung='BT' AND p.herausgeber='BT') AS im_bt,
        EXISTS(SELECT 1 FROM dip_vorgang_positionen p WHERE p.vorgang_id=v.id
          AND p.vorgangsposition LIKE '1. Beratung%') AS lesung1,
        EXISTS(SELECT 1 FROM dip_vorgang_positionen p WHERE p.vorgang_id=v.id
          AND p.vorgangsposition IN ('3. Beratung','2. Beratung und Schlussabstimmung')) AS schlussvote,
        (SELECT MIN(p.datum) FROM dip_vorgang_positionen p WHERE p.vorgang_id=v.id
          AND p.vorgangsposition='Gesetzentwurf' AND p.zuordnung='BT') AS bt_datum
      FROM dip_vorgaenge v
    )
    SELECT einbringer,
      COUNT(*) AS gesamt,
      SUM(im_bt) AS imBundestag,
      SUM(lesung1) AS ersteLesung,
      SUM(schlussvote OR beratungsstand='Abgelehnt') AS zurAbstimmung,
      SUM(beratungsstand IN ('Verkündet','Verabschiedet','Bundesrat hat zugestimmt','Im Vermittlungsverfahren')) AS beschlossen,
      SUM(beratungsstand='Abgelehnt') AS abgelehnt,
      SUM(im_bt AND NOT lesung1 AND beratungsstand NOT IN (
        'Verkündet','Verabschiedet','Abgelehnt','Für erledigt erklärt','Zurückgezogen',
        'Bundesrat hat zugestimmt','Bundesrat hat Zustimmung versagt',
        'Im Vermittlungsverfahren','Einbringung abgelehnt')) AS wartendVorLesung,
      CAST(AVG(CASE WHEN im_bt AND NOT lesung1 AND beratungsstand NOT IN (
        'Verkündet','Verabschiedet','Abgelehnt','Für erledigt erklärt','Zurückgezogen',
        'Bundesrat hat zugestimmt','Bundesrat hat Zustimmung versagt',
        'Im Vermittlungsverfahren','Einbringung abgelehnt')
        THEN julianday('now') - julianday(bt_datum) END) AS INT) AS wartendSchnittTage
    FROM klass
    GROUP BY einbringer
    ORDER BY MIN(sortier)
  `).all() as GesetzgebungsFunnelRow[];
}

export interface GesetzesdauerBeispiel {
  titel: string;
  tage: number;
  dsNr: string | null;
}

export interface Gesetzesdauer {
  n: number;
  medianTotal: number;
  // Median-Etappen in Tagen: Vorlage→1. Lesung, 1. Lesung→Schlussabstimmung, Schlussabstimmung→Verkündung
  etappen: { bisLesung: number; parlament: number; bisVerkuendung: number };
  perEinbringer: { name: string; n: number; median: number }[];
  histogramm: { vonTage: number; n: number }[]; // 30-Tage-Bins über die Gesamtdauer
  schnellste: GesetzesdauerBeispiel[];
  langsamste: GesetzesdauerBeispiel[];
}

/**
 * Dauer verkündeter Gesetze (WP21, amtliche DIP-Vorgangsdaten):
 * von der ersten formalen Vorlage des Entwurfs (bei Regierungsentwürfen die
 * Zuleitung an den Bundesrat) bis zur Verkündung im Bundesgesetzblatt.
 * Schlussabstimmung = 3. Beratung bzw. "2. Beratung und Schlussabstimmung"
 * (Vertragsgesetze, § 78 GO-BT).
 */
export function getGesetzesdauer(): Gesetzesdauer {
  const rows = getDb().prepare(`
    WITH v AS (
      SELECT id, titel, initiative_json,
        json_extract(verkuendung_json, '$[0].verkuendungsdatum') AS verk
      FROM dip_vorgaenge WHERE beratungsstand = 'Verkündet'
    )
    SELECT v.titel,
      CASE WHEN v.initiative_json LIKE '%Bundesregierung%' THEN 'Bundesregierung'
           WHEN v.initiative_json LIKE '%CDU/CSU%' AND v.initiative_json LIKE '%SPD%' THEN 'Koalitionsfraktionen'
           WHEN v.initiative_json LIKE '%Fraktion%' THEN 'Oppositionsfraktionen'
           ELSE 'Länder (über den Bundesrat)' END AS einbringer,
      MIN(CASE WHEN p.vorgangsposition IN ('Gesetzentwurf','Gesetzesantrag') THEN p.datum END) AS vorlage,
      MIN(CASE WHEN p.vorgangsposition LIKE '1. Beratung%' THEN p.datum END) AS lesung1,
      MAX(CASE WHEN p.vorgangsposition IN ('2. Beratung','3. Beratung','2. Beratung und Schlussabstimmung') THEN p.datum END) AS schluss,
      v.verk,
      MIN(CASE WHEN p.vorgangsposition = 'Gesetzentwurf' AND p.zuordnung = 'BT' THEN p.dokumentnummer END) AS dsNr
    FROM v JOIN dip_vorgang_positionen p ON p.vorgang_id = v.id
    GROUP BY v.id
    HAVING vorlage IS NOT NULL AND verk IS NOT NULL
  `).all() as {
    titel: string; einbringer: string; vorlage: string;
    lesung1: string | null; schluss: string | null; verk: string; dsNr: string | null;
  }[];

  const days = (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor((s.length - 1) / 2)] : 0;
  };

  const items = rows.map((r) => ({ ...r, total: days(r.vorlage, r.verk) }));

  const perEinbringer = [...new Set(items.map((i) => i.einbringer))]
    .map((name) => {
      const xs = items.filter((i) => i.einbringer === name);
      return { name, n: xs.length, median: median(xs.map((i) => i.total)) };
    })
    .sort((a, b) => b.n - a.n);

  const maxTotal = Math.max(0, ...items.map((i) => i.total));
  const histogramm = Array.from({ length: Math.floor(maxTotal / 30) + 1 }, (_, b) => ({
    vonTage: b * 30,
    n: items.filter((i) => Math.floor(i.total / 30) === b).length,
  }));

  const sorted = [...items].sort((a, b) => a.total - b.total);
  const beispiel = (i: (typeof items)[number]): GesetzesdauerBeispiel => ({
    titel: i.titel, tage: i.total, dsNr: i.dsNr,
  });

  return {
    n: items.length,
    medianTotal: median(items.map((i) => i.total)),
    etappen: {
      bisLesung: median(items.filter((i) => i.lesung1).map((i) => days(i.vorlage, i.lesung1!))),
      parlament: median(items.filter((i) => i.lesung1 && i.schluss).map((i) => days(i.lesung1!, i.schluss!))),
      bisVerkuendung: median(items.filter((i) => i.schluss).map((i) => days(i.schluss!, i.verk))),
    },
    perEinbringer,
    histogramm,
    schnellste: sorted.slice(0, 3).map(beispiel),
    langsamste: sorted.slice(-3).reverse().map(beispiel),
  };
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
    SELECT a.drucksache_nr, a.batch_class, a.dokumenttyp, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
           COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
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
      COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
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
      SELECT a.drucksache_nr, a.batch_class, a.dokumenttyp, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
             COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
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
    SELECT a.drucksache_nr, a.batch_class, a.dokumenttyp, a.tonalitaet, a.zusammenfassung, a.fraktion, a.thema,
           COALESCE(
        (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL AND thema != '' LIMIT 1),
        (SELECT titel FROM dip_ds_titles WHERE drucksache_nr=a.drucksache_nr AND titel IS NOT NULL),
        (SELECT titel FROM activities WHERE drucksache_nr=a.drucksache_nr LIMIT 1)
      ) AS titel,
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

// ============================================================
// Berlin-Pilot — Parlamentarische Arbeit aus den PARDOK-Daten
// (berlin_documents / berlin_document_persons / berlin_vorgaenge).
// Reden, Schriftliche/Mündliche Anfragen und Anträge der 19. WP,
// rein aus der PARDOK-XML — ohne PDF, ohne LLM.
// ============================================================

export interface BerlinParlItem {
  dbid: string;
  kategorie: "rede" | "anfrage" | "antrag" | "sonstige";
  dokArt: string | null;
  dokTyp: string | null;
  dokNr: string | null;
  titel: string | null;
  datum: string | null;
  lokUrl: string | null;
  seitenbereich: string | null;
  sachgebiet: string | null;
}

export interface BerlinParlGroup {
  kategorie: BerlinParlItem["kategorie"];
  label: string;
  total: number;
  items: BerlinParlItem[]; // neueste zuerst, auf perGroup gekappt
}

export interface BerlinParlamentarischeArbeit {
  groups: BerlinParlGroup[];
  total: number;
}

const BERLIN_PARL_GROUP_LABEL: Record<BerlinParlItem["kategorie"], string> = {
  rede: "Reden",
  anfrage: "Schriftliche & Mündliche Anfragen",
  antrag: "Anträge & Gesetzentwürfe",
  sonstige: "Weitere Drucksachen",
};

export function getBerlinParlamentarischeArbeit(
  politicianId: number,
  perGroup = 50
): BerlinParlamentarischeArbeit {
  const db = getDb();
  let rows: Array<{
    dbid: string; dok_art_label: string | null; dok_typ_label: string | null;
    dok_nr: string | null; dok_datum: string | null; lok_url: string | null;
    seitenbereich: string | null; doc_titel: string | null; vorgang_titel: string | null;
    vsys_label: string | null; role: string;
  }>;
  try {
    rows = db.prepare(`
      SELECT d.dbid, d.dok_art_label, d.dok_typ_label, d.dok_nr, d.dok_datum,
             d.lok_url, d.seitenbereich, d.titel AS doc_titel,
             v.titel AS vorgang_titel, v.vsys_label, bdp.role
      FROM berlin_document_persons bdp
      JOIN berlin_documents d ON d.dbid = bdp.dbid
      LEFT JOIN berlin_vorgaenge v ON v.vid = d.vorgang_id
      WHERE bdp.politician_id = ?
      ORDER BY d.dok_datum DESC, d.dbid DESC
    `).all(politicianId) as typeof rows;
  } catch {
    return { groups: [], total: 0 }; // berlin_*-Tabellen noch nicht angelegt
  }

  const categorize = (role: string, typ: string | null): BerlinParlItem["kategorie"] => {
    if (role === "redner") return "rede";
    const t = typ ?? "";
    if (t.includes("Anfrage")) return "anfrage";
    if (t.includes("Antrag") || t.includes("Gesetz")) return "antrag";
    return "sonstige";
  };

  const buckets: Record<BerlinParlItem["kategorie"], BerlinParlItem[]> = {
    rede: [], anfrage: [], antrag: [], sonstige: [],
  };
  for (const r of rows) {
    const kategorie = categorize(r.role, r.dok_typ_label);
    buckets[kategorie].push({
      dbid: r.dbid,
      kategorie,
      dokArt: r.dok_art_label,
      dokTyp: r.dok_typ_label,
      dokNr: r.dok_nr,
      titel: r.doc_titel || r.vorgang_titel || null,
      datum: r.dok_datum,
      lokUrl: r.lok_url,
      seitenbereich: r.seitenbereich,
      sachgebiet: r.vsys_label,
    });
  }

  const order: BerlinParlItem["kategorie"][] = ["rede", "anfrage", "antrag", "sonstige"];
  const groups: BerlinParlGroup[] = order
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({
      kategorie: k,
      label: BERLIN_PARL_GROUP_LABEL[k],
      total: buckets[k].length,
      items: buckets[k].slice(0, perGroup),
    }));
  return { groups, total: rows.length };
}

// ============================================================
// Berlin-Pilot: Reden eines:r MdL aus berlin_speeches.
// Liefert Volltexte + TOP-Kontext + Interruption-Counts, OHNE LLM-Felder
// (Berlin-Reden sind noch nicht KI-zusammengefasst — explizit als
// Limitation in UI markieren).
// ============================================================

export interface BerlinSpeechItem {
  speech_id: string;
  wp: number;
  sitzung_nr: number;
  datum: string | null;
  pdf_filename: string;
  lok_url: string;
  speaker_role: string | null;        // null = MdL
  speaker_ressort: string | null;
  top_marker: string | null;
  top_titel: string | null;
  drucksache_nrn: string[];
  speech_type: string | null;
  text_chars: number;
  text_preview: string;               // erste ~200 Zeichen ohne Grußformel
  interruption_count: number;         // Anzahl [Beifall|Zwischenruf|...] in der Rede
  // LLM-Analyse (aus berlin_speech_analyses, optional)
  analysis: {
    reden_typ: string | null;          // A-K, L (Berlin-NEU)
    tonalitaet: string | null;         // 11-Enum
    zusammenfassung: string | null;    // 2-3 Sätze
    forderungen_count: number;         // Anzahl Forderungen (für UI-Stats)
    forderungen: string[];             // Forderungen/Positionen (Volltext)
    woertliche_zitate: string[];       // wörtliche Zitate aus der Rede
    framing_marker: string[];          // Berlin-Glossar-Frames
    quote_valid: number;               // Wieviele Zitate substring-valid
    quote_total: number;
    self_check_konfidenz: string | null; // hoch | mittel | niedrig
  } | null;
}

export interface BerlinSpeechStats {
  total: number;                      // Gesamt-Reden (ohne Präsidium)
  debatte: number;
  fragestunde_antwort: number;
  fragestunde_frage: number;
  persoenliche_erklaerung: number;
  uncategorized: number;              // speech_type IS NULL
}

export interface BerlinSpeechesByPolitician {
  items: BerlinSpeechItem[];          // chronologisch absteigend, auf limit gekappt
  stats: BerlinSpeechStats;
  total_chars: number;                // Σ Wortlaut-Zeichen über alle Reden
}

/** Entfernt typische Grußformel am Anfang für eine aussagekräftige Vorschau. */
function speechPreview(text: string, maxLen = 200): string {
  // pdf-parse Bindestriche: "Wort- \nWort" zusammenfügen
  let t = text.replace(/-\n([a-zäöüß])/g, "$1").replace(/\s+/g, " ").trim();
  // Strip Standard-Grußformeln (greedy, max 1 Match)
  t = t.replace(
    /^(?:Herr|Frau|Sehr geehrte[rs]?|Liebe[rs]?)[^!.?]{0,120}[!.?]\s*(?:[A-ZÄÖÜ][^!.?]{0,120}[!.?]\s*)?/,
    ""
  );
  if (t.length <= maxLen) return t;
  // Auf letztem Whitespace innerhalb maxLen schneiden
  const cut = t.lastIndexOf(" ", maxLen);
  return (cut > maxLen * 0.6 ? t.slice(0, cut) : t.slice(0, maxLen)) + "…";
}

type BerlinSpeechRowDb = {
  speech_id: string; wp: number; sitzung_nr: number; datum: string | null;
  pdf_filename: string; lok_url: string;
  speaker_role: string | null; speaker_ressort: string | null;
  top_marker: string | null; top_titel: string | null; drucksache_nrn: string | null;
  speech_type: string | null;
  text: string; text_chars: number; interruptions: string | null;
  analysis_reden_typ: string | null;
  analysis_tonalitaet: string | null;
  analysis_zusammenfassung: string | null;
  analysis_forderungen_json: string | null;
  analysis_woertliche_zitate_json: string | null;
  analysis_framing_marker_json: string | null;
  analysis_quote_valid: number | null;
  analysis_quote_total: number | null;
  analysis_self_check_json: string | null;
};

const EMPTY_BERLIN_SPEECHES: BerlinSpeechesByPolitician = {
  items: [],
  stats: { total: 0, debatte: 0, fragestunde_antwort: 0, fragestunde_frage: 0, persoenliche_erklaerung: 0, uncategorized: 0 },
  total_chars: 0,
};

/** Berlin-Reden-Rows nach einem berlin_speeches-Spaltenfilter (politician_id ODER speaker_name). */
function runBerlinSpeechesQuery(whereCol: "politician_id" | "speaker_name", value: number | string): BerlinSpeechRowDb[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT bs.speech_id, bs.wp, bs.sitzung_nr, bs.datum, bs.pdf_filename, bs.lok_url,
             bs.speaker_role, bs.speaker_ressort, bs.top_marker, bs.top_titel, bs.drucksache_nrn,
             bs.speech_type, bs.text, bs.text_chars, bs.interruptions,
             bsa.reden_typ AS analysis_reden_typ,
             bsa.tonalitaet AS analysis_tonalitaet,
             bsa.zusammenfassung_2_saetze AS analysis_zusammenfassung,
             bsa.forderungen_json AS analysis_forderungen_json,
             bsa.woertliche_zitate_json AS analysis_woertliche_zitate_json,
             bsa.framing_marker_json AS analysis_framing_marker_json,
             bsa.quote_valid_count AS analysis_quote_valid,
             bsa.quote_total_count AS analysis_quote_total,
             bsa.neutralitaets_self_check_json AS analysis_self_check_json
        FROM berlin_speeches bs
        LEFT JOIN berlin_speech_analyses bsa ON bsa.speech_id = bs.speech_id
       WHERE bs.${whereCol} = ?
         AND bs.is_praesidium = 0
       ORDER BY bs.datum DESC, bs.sitzung_nr DESC, bs.order_in_session DESC
    `).all(value) as BerlinSpeechRowDb[];
  } catch {
    return []; // berlin_speeches-Tabelle existiert nicht
  }
}

export function getBerlinSpeechesByPolitician(
  politicianId: number,
  limit = 100
): BerlinSpeechesByPolitician {
  return buildBerlinSpeechesResult(runBerlinSpeechesQuery("politician_id", politicianId), limit);
}

/** Wie getBerlinSpeechesByPolitician, aber per Sprecher-Name — deckt auch Senator:innen/
 *  Regierungsmitglieder ohne politician_id ab (Basis für die namensbasierte Redner-Seite). */
export function getBerlinSpeechesBySpeakerName(
  speakerName: string,
  limit = 100
): BerlinSpeechesByPolitician {
  return buildBerlinSpeechesResult(runBerlinSpeechesQuery("speaker_name", speakerName), limit);
}

/** Mappt Berlin-Drucksachen-Nummern (dok_nr) auf eine dbid für Detail-Links. Erste dbid je Nummer. */
export function resolveBerlinDbidsByNr(nrs: string[]): Record<string, string> {
  const unique = Array.from(new Set(nrs.filter(Boolean)));
  if (unique.length === 0) return {};
  const db = getDb();
  try {
    const placeholders = unique.map(() => "?").join(",");
    const rows = db.prepare(
      `SELECT dok_nr, MIN(dbid) AS dbid FROM berlin_documents WHERE dok_nr IN (${placeholders}) GROUP BY dok_nr`
    ).all(...unique) as { dok_nr: string; dbid: string }[];
    const map: Record<string, string> = {};
    for (const r of rows) map[r.dok_nr] = r.dbid;
    return map;
  } catch {
    return {};
  }
}

/** Kopf-Metadaten für die Berlin-Redner-Seite: Partei/Rolle/Ressort + ggf. verknüpftes Profil. */
export function getBerlinSpeakerMeta(speakerName: string): {
  speakerName: string; party: string | null; role: string | null; ressort: string | null;
  politicianId: number | null; redenTotal: number;
} | null {
  const db = getDb();
  try {
    const row = db.prepare(`
      SELECT speaker_name, speaker_party, speaker_role, speaker_ressort, politician_id
        FROM berlin_speeches WHERE speaker_name = ? AND is_praesidium = 0
       ORDER BY datum DESC LIMIT 1
    `).get(speakerName) as {
      speaker_name: string; speaker_party: string | null; speaker_role: string | null;
      speaker_ressort: string | null; politician_id: number | null;
    } | undefined;
    if (!row) return null;
    const total = (db.prepare(
      `SELECT COUNT(*) c FROM berlin_speeches WHERE speaker_name = ? AND is_praesidium = 0`
    ).get(speakerName) as { c: number }).c;
    return {
      speakerName: row.speaker_name, party: row.speaker_party, role: row.speaker_role,
      ressort: row.speaker_ressort, politicianId: row.politician_id, redenTotal: total,
    };
  } catch {
    return null;
  }
}

function buildBerlinSpeechesResult(rows: BerlinSpeechRowDb[], limit: number): BerlinSpeechesByPolitician {
  if (rows.length === 0) return EMPTY_BERLIN_SPEECHES;

  const stats: BerlinSpeechStats = {
    total: rows.length,
    debatte: 0,
    fragestunde_antwort: 0,
    fragestunde_frage: 0,
    persoenliche_erklaerung: 0,
    uncategorized: 0,
  };
  let totalChars = 0;
  for (const r of rows) {
    totalChars += r.text_chars ?? 0;
    switch (r.speech_type) {
      case "debatte": stats.debatte++; break;
      case "fragestunde_antwort": stats.fragestunde_antwort++; break;
      case "fragestunde_frage": stats.fragestunde_frage++; break;
      case "persoenliche_erklaerung": stats.persoenliche_erklaerung++; break;
      default: stats.uncategorized++;
    }
  }

  const items: BerlinSpeechItem[] = rows.slice(0, limit).map((r) => {
    let interruptionCount = 0;
    if (r.interruptions) {
      try { interruptionCount = (JSON.parse(r.interruptions) as unknown[]).length; } catch { /* keep 0 */ }
    }
    let drsNrn: string[] = [];
    if (r.drucksache_nrn) {
      try { drsNrn = JSON.parse(r.drucksache_nrn) as string[]; } catch { /* keep [] */ }
    }
    // LLM-Analyse parsen (falls vorhanden)
    let analysis: BerlinSpeechItem["analysis"] = null;
    if (r.analysis_tonalitaet || r.analysis_zusammenfassung) {
      const forderungen = safeJsonArray(r.analysis_forderungen_json);
      const woertlicheZitate = safeJsonArray(r.analysis_woertliche_zitate_json);
      const forderungenCount = forderungen.length;
      let framingMarker: string[] = [];
      if (r.analysis_framing_marker_json) {
        try {
          const arr = JSON.parse(r.analysis_framing_marker_json);
          if (Array.isArray(arr)) framingMarker = arr.filter((x: unknown) => typeof x === "string") as string[];
        } catch { /* keep [] */ }
      }
      let selfCheckKonfidenz: string | null = null;
      if (r.analysis_self_check_json) {
        try {
          const obj = JSON.parse(r.analysis_self_check_json);
          if (obj && typeof obj.konfidenz === "string") selfCheckKonfidenz = obj.konfidenz;
        } catch { /* keep null */ }
      }
      analysis = {
        reden_typ: r.analysis_reden_typ,
        tonalitaet: r.analysis_tonalitaet,
        zusammenfassung: r.analysis_zusammenfassung,
        forderungen_count: forderungenCount,
        forderungen,
        woertliche_zitate: woertlicheZitate,
        framing_marker: framingMarker,
        quote_valid: r.analysis_quote_valid ?? 0,
        quote_total: r.analysis_quote_total ?? 0,
        self_check_konfidenz: selfCheckKonfidenz,
      };
    }
    return {
      speech_id: r.speech_id,
      wp: r.wp,
      sitzung_nr: r.sitzung_nr,
      datum: r.datum,
      pdf_filename: r.pdf_filename,
      lok_url: r.lok_url,
      speaker_role: r.speaker_role,
      speaker_ressort: r.speaker_ressort,
      top_marker: r.top_marker,
      top_titel: r.top_titel,
      drucksache_nrn: drsNrn,
      speech_type: r.speech_type,
      text_chars: r.text_chars ?? 0,
      text_preview: speechPreview(r.text ?? ""),
      interruption_count: interruptionCount,
      analysis,
    };
  });

  return { items, stats, total_chars: totalChars };
}

// ============================================================
// Parlaments-Hub — Übersicht aller Parlamente (Bund, Länder, EU)
// für die skalierbare Hub-/Landing-Navigation.
// ============================================================

export interface ParliamentOverview {
  id: number;
  label: string;
  type: string; // bundestag | landtag | eu
  memberCount: number;
  /** Abdeckungstiefe — bestimmt Badge + ob die Kachel verlinkt ist. */
  tier: "voll" | "pilot" | "stammdaten";
}

export function getParliamentsOverview(): ParliamentOverview[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT par.id, par.label, par.type,
           COUNT(DISTINCT m.politician_id) AS members
    FROM parliaments par
    LEFT JOIN parliament_periods pp ON pp.parliament_id = par.id
    LEFT JOIN mandates m ON m.parliament_period_id = pp.id AND m.type = 'mandate'
    GROUP BY par.id
  `).all() as { id: number; label: string; type: string; members: number }[];

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    type: r.type,
    memberCount: r.members,
    tier:
      r.type === "bundestag" ? "voll"
      : r.id === BERLIN_PILOT_PARLIAMENT_ID ? "pilot"
      : "stammdaten",
  }));
}

// ============================================================
// Berlin-Übersichtsseite — Snapshot fürs „Aktuelles aus dem
// Abgeordnetenhaus" (analog zur Bundestag-Landing, aber aus PARDOK).
// ============================================================

export interface BerlinLatestVote {
  voteId: number;
  sitzungNr: number;
  datum: string;
  outcome: string;
  modus: string | null;
  fraktionVotes: Record<string, string>;
  drucksacheNrn: string[];
  primaryTitel: string | null;
  primaryDbid: string | null;
  primaryZusammenfassung: string | null;
  /** Vorgangs-ID der primary-Drucksache. Wird im Sitzungs-View zur Gruppierung
   *  mehrerer Votes derselben Drucksachen-Folge verwendet (Antrag + Beschluss-
   *  empfehlung + Schlussabstimmung haben oft denselben Vorgang). */
  primaryVorgangId: string | null;
  /** Regex-Label aus raw_snippet: "Einzelplan 06 – Justiz", "Auflagen-Paket".
   *  NULL wenn kein Pattern matcht — dann nur primaryTitel + DS-Nr in UI. */
  voteLabel: string | null;
}

export interface BerlinLatestGesetz {
  dbid: string;
  dokNr: string | null;
  titel: string | null;
  datum: string;
  einbringer: string | null;
  zusammenfassung: string | null;
}

export interface BerlinSnapshot {
  memberCount: number;
  anfragenCount: number;
  redenCount: number;
  ausschussCount: number;
  cvCount: number;
  latestPlenum: { dokNr: string; datum: string } | null;
  latestSitzung:
    | {
        sitzungNr: number;
        datum: string;
        debattenCount: number;
        plprDokNr: string;
        topItems: { marker: string; titel: string; redenCount: number }[];
      }
    | null;
  latestAnfragen: {
    dbid: string;
    titel: string;
    datum: string;
    dokNr: string;
    lokUrl: string | null;
    zusammenfassung: string | null;
    antwortCharakter: string | null;
    fraktion: string | null;
  }[];
  latestVotes: BerlinLatestVote[];
  latestGesetzentwuerfe: BerlinLatestGesetz[];
}

export function getBerlinSnapshot(): BerlinSnapshot {
  const db = getDb();
  const one = (sql: string, ...p: unknown[]) =>
    ((db.prepare(sql).get(...p) as { c: number } | undefined)?.c ?? 0);

  const memberCount = one(
    `SELECT COUNT(DISTINCT m.politician_id) AS c FROM mandates m
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     WHERE pp.parliament_id = ${BERLIN_PILOT_PARLIAMENT_ID} AND m.type = 'mandate'`
  );
  const cvCount = one(
    `SELECT COUNT(*) AS c FROM politicians p
     JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     WHERE pp.parliament_id = ${BERLIN_PILOT_PARLIAMENT_ID} AND p.cv_summary IS NOT NULL`
  );

  let anfragenCount = 0, redenCount = 0, ausschussCount = 0;
  let latestPlenum: BerlinSnapshot["latestPlenum"] = null;
  let latestSitzung: BerlinSnapshot["latestSitzung"] = null;
  let latestAnfragen: BerlinSnapshot["latestAnfragen"] = [];
  let latestVotes: BerlinSnapshot["latestVotes"] = [];
  let latestGesetzentwuerfe: BerlinSnapshot["latestGesetzentwuerfe"] = [];
  try {
    anfragenCount = one(`SELECT COUNT(*) AS c FROM berlin_documents WHERE dok_typ_label LIKE '%Anfrage%'`);
    redenCount = one(`SELECT COUNT(*) AS c FROM berlin_document_persons WHERE role = 'redner'`);
    ausschussCount = one(`SELECT COUNT(*) AS c FROM committee_memberships WHERE committee_id >= 92000`);
    const pl = db.prepare(
      `SELECT dok_nr, dok_datum FROM berlin_documents
       WHERE dok_art_label = 'Plenarprotokoll' AND dok_datum IS NOT NULL AND dok_datum != ''
       ORDER BY dok_datum DESC LIMIT 1`
    ).get() as { dok_nr: string; dok_datum: string } | undefined;
    if (pl) latestPlenum = { dokNr: pl.dok_nr, datum: pl.dok_datum };

    // Letzte Sitzung: höchste sitzung_nr in berlin_speeches mit substantieller TOPs-Übersicht.
    // Boilerplate-TOPs (Aktuelle Stunde, Fragestunde, Prioritäten) sind administrative Slots
    // und sagen wenig über den Sitzungs-Inhalt — daher rausgefiltert.
    const sit = db.prepare(
      `SELECT sitzung_nr, MAX(datum) AS datum, COUNT(*) AS debatten
       FROM berlin_speeches
       WHERE speech_type = 'debatte' AND sitzung_nr IS NOT NULL
       GROUP BY sitzung_nr
       ORDER BY datum DESC LIMIT 1`
    ).get() as { sitzung_nr: number; datum: string; debatten: number } | undefined;
    if (sit) {
      const tops = (db.prepare(
        `SELECT top_marker, top_titel, COUNT(*) AS reden
         FROM berlin_speeches
         WHERE sitzung_nr = ? AND top_titel IS NOT NULL AND top_titel != ''
           AND top_marker IS NOT NULL AND top_marker != ''
           AND top_titel NOT IN ('Aktuelle Stunde', 'Fragestunde', 'Prioritäten', 'Mündliche Anfragen')
         GROUP BY top_marker, top_titel
         ORDER BY CAST(top_marker AS INTEGER)
         LIMIT 8`
      ).all(sit.sitzung_nr) as { top_marker: string; top_titel: string; reden: number }[]);
      latestSitzung = {
        sitzungNr: sit.sitzung_nr,
        datum: sit.datum,
        debattenCount: sit.debatten,
        // PlPr-Nummer wird aus der Sitzungs-Nr abgeleitet, weil neuere PlPr-Dokumente
        // in berlin_documents existieren können, deren Reden noch nicht eingelesen sind.
        plprDokNr: `19/${sit.sitzung_nr}`,
        topItems: tops.map((r) => ({ marker: r.top_marker, titel: r.top_titel, redenCount: r.reden })),
      };
    }

    latestAnfragen = (db.prepare(
      `SELECT bd.dbid, bd.titel, bd.dok_datum, bd.dok_nr, bd.lok_url,
              bda.zusammenfassung, bda.antwort_charakter, bda.fraktion
       FROM berlin_documents bd
       LEFT JOIN berlin_drucksachen_analyses bda
         ON bda.dbid = bd.dbid AND bda.klasse = 'anfrage_antwort'
       WHERE bd.dok_typ_label = 'Schriftliche Anfrage'
         AND bd.titel IS NOT NULL AND bd.titel != ''
         AND bd.dok_datum IS NOT NULL AND bd.dok_datum != ''
       ORDER BY bd.dok_datum DESC LIMIT 5`
    ).all() as {
      dbid: string; titel: string; dok_datum: string; dok_nr: string; lok_url: string | null;
      zusammenfassung: string | null; antwort_charakter: string | null; fraktion: string | null;
    }[]).map((r) => ({
      dbid: r.dbid,
      titel: r.titel,
      datum: r.dok_datum,
      dokNr: r.dok_nr,
      lokUrl: r.lok_url,
      zusammenfassung: r.zusammenfassung,
      antwortCharakter: r.antwort_charakter,
      fraktion: r.fraktion,
    }));

    // Letzte Abstimmungen (nur Plenum-Votes mit echtem Outcome, kein 'kein_vote')
    latestVotes = (db.prepare(
      `SELECT vote_id, sitzung_nr, datum, outcome, modus,
              fraktion_votes_json, drucksache_nrn_json, drucksache_dbids_json, vote_label
       FROM berlin_votes
       WHERE outcome NOT IN ('kein_vote', 'unklar')
         AND fraktion_votes_json IS NOT NULL AND fraktion_votes_json != ''
         AND drucksache_dbids_json IS NOT NULL AND drucksache_dbids_json NOT IN ('', '[]')
       ORDER BY datum DESC, vote_id DESC
       LIMIT 5`
    ).all() as {
      vote_id: number; sitzung_nr: number; datum: string;
      outcome: string; modus: string | null;
      fraktion_votes_json: string; drucksache_nrn_json: string | null;
      drucksache_dbids_json: string | null; vote_label: string | null;
    }[]).map((r) => {
      const drsNrn: string[] = r.drucksache_nrn_json ? safeParseStringArray(r.drucksache_nrn_json) : [];
      const drsDbids: string[] = r.drucksache_dbids_json ? safeParseStringArray(r.drucksache_dbids_json) : [];
      const primaryDbid = drsDbids[0] ?? null;
      let primaryTitel: string | null = null;
      let primaryZusammenfassung: string | null = null;
      if (primaryDbid) {
        const t = db.prepare(
          `SELECT bd.titel, bda.zusammenfassung
           FROM berlin_documents bd
           LEFT JOIN berlin_drucksachen_analyses bda ON bda.dbid = bd.dbid
           WHERE bd.dbid = ?`,
        ).get(primaryDbid) as { titel: string | null; zusammenfassung: string | null } | undefined;
        primaryTitel = t?.titel ?? null;
        primaryZusammenfassung = t?.zusammenfassung ?? null;
      }
      let fraktionVotes: Record<string, string> = {};
      try {
        fraktionVotes = JSON.parse(r.fraktion_votes_json) as Record<string, string>;
      } catch {
        fraktionVotes = {};
      }
      return {
        voteId: r.vote_id,
        sitzungNr: r.sitzung_nr,
        datum: r.datum,
        outcome: r.outcome,
        modus: r.modus,
        fraktionVotes,
        drucksacheNrn: drsNrn,
        primaryTitel,
        primaryDbid,
        primaryZusammenfassung,
        primaryVorgangId: null,
        voteLabel: r.vote_label,
      };
    });

    // Letzte Gesetzentwürfe (nur 'Vorlage zur Beschlussfassung (Gesetzentwurf)' — keine Bebauungspläne)
    latestGesetzentwuerfe = (db.prepare(
      `SELECT bd.dbid, bd.dok_nr, bd.titel, bd.dok_datum, bda.einbringer, bda.zusammenfassung
       FROM berlin_documents bd
       JOIN berlin_drucksachen_analyses bda ON bda.dbid = bd.dbid
       WHERE bda.klasse = 'gesetzentwurf'
         AND bd.dok_typ_label = 'Vorlage zur Beschlussfassung (Gesetzentwurf)'
         AND bd.titel IS NOT NULL AND bd.titel != ''
         AND bd.dok_datum IS NOT NULL AND bd.dok_datum != ''
         AND bd.titel NOT LIKE 'Entwurf des Bebauungsplans%'
       ORDER BY bd.dok_datum DESC LIMIT 5`
    ).all() as {
      dbid: string; dok_nr: string | null; titel: string | null;
      dok_datum: string; einbringer: string | null; zusammenfassung: string | null;
    }[]).map((r) => ({
      dbid: r.dbid,
      dokNr: r.dok_nr,
      titel: r.titel,
      datum: r.dok_datum,
      einbringer: r.einbringer,
      zusammenfassung: r.zusammenfassung,
    }));
  } catch {
    // berlin_*-Tabellen noch nicht angelegt
  }

  return {
    memberCount, anfragenCount, redenCount, ausschussCount, cvCount,
    latestPlenum, latestSitzung, latestAnfragen, latestVotes, latestGesetzentwuerfe,
  };
}

export interface BerlinSitzungSpeech {
  speechId: string;
  speakerName: string;
  speakerParty: string | null;
  speakerRole: string | null;
  speakerRessort: string | null;
  politicianId: number | null;
  speechType: string | null;
  textChars: number;
  interruptionCount: number;
  tonalitaet: string | null;
  zusammenfassung: string | null;
  konkreteZahlen: string[];
  forderungen: string[];
  /** Voller Rede-Text wird NICHT mehr mitgeliefert (Payload-Reduktion ~58%) —
   *  per <BerlinOriginalSpeech> on-demand über /api/berlin/speech-text geladen.
   *  `textChars` zeigt an, ob es überhaupt einen Text zum Aufklappen gibt. */
  /** Drucksachen, die diese Rede referenziert. dbid kann null sein wenn die
   *  DS-Nummer in berlin_documents (noch) nicht aufgelöst werden konnte. */
  drucksachen: { nr: string; dbid: string | null }[];
}

export interface KeyFact {
  text: string;
  /** 1-based Indizes in die gefilterte Reden-Liste (Reden mit `zusammenfassung_2_saetze`).
   *  Wikipedia-style Belegquellen — 1-3 refs üblich, leer wenn LLM keine ausgewählt. */
  refs: number[];
}

export interface BerlinSitzungTop {
  marker: string;
  titel: string;
  isBoilerplate: boolean;
  redenCount: number;
  /** v3-Legacy: Kompakter Kern-Lead (eigenständig lesbar).
   *  null bei v4+ (key_facts statt lead) oder wenn noch keine Synthese existiert. */
  summaryLead: string | null;
  /** v3+: Optionale vertiefende Synthese. v4 ist Bullet-only und füllt body=null. */
  summaryBody: string | null;
  /** v4+: 2-8 eigenständig lesbare Fakt-Bullets mit optionalen Reden-Refs.
   *  null bei v3-Legacy oder fehlender Synthese. */
  summaryKeyFacts: KeyFact[] | null;
  /** Aggregierte Drucksachen aller Reden in diesem TOP. Dedup'd. */
  drucksachen: { nr: string; dbid: string | null }[];
  speeches: BerlinSitzungSpeech[];
}

export interface BerlinSitzungDetail {
  sitzungNr: number;
  plprDokNr: string;
  datum: string;
  plprLokUrl: string | null;
  redenTotal: number;
  redenByType: Record<string, number>;
  uniqueSpeakers: number;
  tops: BerlinSitzungTop[];
  votes: BerlinLatestVote[];
}

/** Parst `key_facts_json` aus berlin_top_summaries in den kanonischen KeyFact[]-Shape.
 *  Akzeptiert sowohl Legacy-`string[]` (frühe v4-Runs ohne refs) als auch das v4-Format
 *  `Array<{ text, refs }>`. Liefert null wenn leer/ungültig. */
function parseKeyFacts(raw: string | null): KeyFact[] | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const out: KeyFact[] = [];
  for (const item of parsed) {
    if (typeof item === "string") {
      out.push({ text: item, refs: [] });
    } else if (item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string") {
      const refsRaw = (item as { refs?: unknown }).refs;
      const refs = Array.isArray(refsRaw)
        ? refsRaw.filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n > 0)
        : [];
      out.push({ text: (item as { text: string }).text, refs });
    }
  }
  return out.length > 0 ? out : null;
}

/** Vorherige + nächste Berliner Sitzung (mit Datum) für Navigation in der Detail-View.
 *  Berücksichtigt nur Sitzungen mit substantiellen Reden (>5), um Konstituierungs-
 *  Sitzungen und kaputte PDFs auszublenden. */
export function getBerlinSitzungNeighbors(sitzungNr: number): {
  prev: { nr: number; datum: string | null } | null;
  next: { nr: number; datum: string | null } | null;
} {
  const db = getDb();
  try {
    const prev = db.prepare(
      `SELECT sitzung_nr AS nr, MAX(datum) AS datum
       FROM berlin_speeches WHERE sitzung_nr < ?
       GROUP BY sitzung_nr HAVING COUNT(*) > 5
       ORDER BY sitzung_nr DESC LIMIT 1`,
    ).get(sitzungNr) as { nr: number; datum: string | null } | undefined;
    const next = db.prepare(
      `SELECT sitzung_nr AS nr, MAX(datum) AS datum
       FROM berlin_speeches WHERE sitzung_nr > ?
       GROUP BY sitzung_nr HAVING COUNT(*) > 5
       ORDER BY sitzung_nr ASC LIMIT 1`,
    ).get(sitzungNr) as { nr: number; datum: string | null } | undefined;
    return { prev: prev ?? null, next: next ?? null };
  } catch {
    return { prev: null, next: null };
  }
}

const BERLIN_BOILERPLATE_TOPS = new Set([
  "Aktuelle Stunde",
  "Fragestunde",
  "Prioritäten",
  "Mündliche Anfragen",
]);

export interface BerlinSitzungListEntry {
  nr: number;
  datum: string | null;
  reden: number;
  tops: number;
  votes: number;
  topSummaries: number;
}

/** Alle Berliner Plenarsitzungen mit Glance-Kennzahlen, neueste zuerst. */
export function listBerlinSitzungen(): BerlinSitzungListEntry[] {
  const db = getDb();
  try {
    const rows = db.prepare(
      `SELECT sitzung_nr AS nr,
              MAX(NULLIF(datum,'')) AS datum,
              SUM(CASE WHEN is_praesidium = 0 THEN 1 ELSE 0 END) AS reden,
              COUNT(DISTINCT NULLIF(top_marker,'')) AS tops
       FROM berlin_speeches
       WHERE sitzung_nr IS NOT NULL
       GROUP BY sitzung_nr`,
    ).all() as { nr: number; datum: string | null; reden: number; tops: number }[];

    const voteRows = db.prepare(
      `SELECT sitzung_nr AS nr, COUNT(*) AS c FROM berlin_votes
       WHERE outcome != 'kein_vote' AND sitzung_nr IS NOT NULL GROUP BY sitzung_nr`,
    ).all() as { nr: number; c: number }[];
    const sumRows = db.prepare(
      `SELECT sitzung_nr AS nr, COUNT(*) AS c FROM berlin_top_summaries
       WHERE sitzung_nr IS NOT NULL GROUP BY sitzung_nr`,
    ).all() as { nr: number; c: number }[];
    const vMap = new Map(voteRows.map((r) => [r.nr, r.c]));
    const sMap = new Map(sumRows.map((r) => [r.nr, r.c]));

    return rows
      .map((r) => ({
        nr: r.nr,
        datum: r.datum,
        reden: r.reden,
        tops: r.tops,
        votes: vMap.get(r.nr) ?? 0,
        topSummaries: sMap.get(r.nr) ?? 0,
      }))
      .sort((a, b) => b.nr - a.nr);
  } catch {
    return [];
  }
}

export function getBerlinSitzungDetail(sitzungNr: number): BerlinSitzungDetail | null {
  const db = getDb();

  // Header-Stats
  const header = db.prepare(
    `SELECT MAX(datum) AS datum, MAX(lok_url) AS lok_url, COUNT(*) AS reden
     FROM berlin_speeches WHERE sitzung_nr = ?`,
  ).get(sitzungNr) as { datum: string | null; lok_url: string | null; reden: number } | undefined;
  // datum kann leer sein (manche alte PDF-Headers wurden vom Scraper nicht erfasst —
  // separater Datenqualitäts-Track). Trotzdem Detail-Seite zeigen wenn Reden da sind.
  if (!header || header.reden === 0) return null;

  const byType = db.prepare(
    `SELECT speech_type, COUNT(*) AS c FROM berlin_speeches
     WHERE sitzung_nr = ? GROUP BY speech_type`,
  ).all(sitzungNr) as { speech_type: string | null; c: number }[];
  const redenByType: Record<string, number> = {};
  for (const r of byType) {
    if (r.speech_type) redenByType[r.speech_type] = r.c;
  }

  const uniqueSpeakers = (db.prepare(
    `SELECT COUNT(DISTINCT speaker_name) AS c FROM berlin_speeches
     WHERE sitzung_nr = ? AND is_praesidium = 0 AND speaker_name IS NOT NULL`,
  ).get(sitzungNr) as { c: number } | undefined)?.c ?? 0;

  // TOPs gruppieren — sortiert nach chronologischer Reihenfolge (PDF-Position des
  // ersten zugehörigen Wortbeitrags), NICHT nach Marker. In ca. 24 Berliner
  // Sitzungen wurden TOPs umsortiert (vorgezogen / zurückgestellt).
  const topRows = db.prepare(
    `SELECT top_marker, top_titel, COUNT(*) AS reden, MIN(start_line) AS first_line
     FROM berlin_speeches
     WHERE sitzung_nr = ?
       AND top_titel IS NOT NULL AND top_titel != ''
       AND top_marker IS NOT NULL AND top_marker != ''
     GROUP BY top_marker, top_titel
     ORDER BY first_line`,
  ).all(sitzungNr) as { top_marker: string; top_titel: string; reden: number; first_line: number }[];

  // Cached TOP-Summaries (KI-Synthese aus berlin_top_summaries) optional pro TOP laden.
  // v4+ schreibt in `key_facts_json`/`body` (lead=NULL).
  // v3 schreibt in `lead`/`body`. v1/v2-Legacy steht in `zusammenfassung` → fallback in lead.
  const summaryRow = db.prepare(
    `SELECT lead, body, zusammenfassung, key_facts_json FROM berlin_top_summaries
     WHERE sitzung_nr = ? AND top_marker = ? AND top_titel = ?`,
  );

  // Pre-resolve dok_nr → dbid für alle Drucksachen, die in dieser Sitzung in
  // Reden referenziert werden. Single query, dann pro Rede aus der Map ziehen.
  const dsNrToDbid = new Map<string, string | null>();
  try {
    const dsRows = db.prepare(
      `SELECT DISTINCT j.value AS nr, bd.dbid
       FROM berlin_speeches bs, json_each(bs.drucksache_nrn) j
       LEFT JOIN berlin_documents bd ON bd.dok_nr = j.value
       WHERE bs.sitzung_nr = ? AND bs.drucksache_nrn IS NOT NULL`,
    ).all(sitzungNr) as { nr: string; dbid: string | null }[];
    for (const r of dsRows) dsNrToDbid.set(r.nr, r.dbid);
  } catch {
    // berlin_documents oder json_each evt. nicht verfügbar — leer lassen
  }

  const tops: BerlinSitzungTop[] = topRows.map((t) => {
    // Partei aus berlin_speeches.speaker_party; falls leer (gilt für Senatsmitglieder
    // wie Wegner, Giffey, Spranger und für das Präsidium), aus politicians-Tabelle holen.
    // parties.label nutzt Langform (BÜNDNIS 90/DIE GRÜNEN, Die Linke), die UI-Konvention
    // ist die Kurzform aus speaker_party (GRÜNE, LINKE) — daher Mapping per CASE.
    const speeches = db.prepare(
      `SELECT bs.speech_id, bs.speaker_name AS speaker,
              COALESCE(
                NULLIF(bs.speaker_party, ''),
                CASE
                  WHEN pa.label LIKE 'BÜNDNIS%' THEN 'GRÜNE'
                  WHEN pa.label = 'Die Linke' THEN 'LINKE'
                  ELSE pa.label
                END
              ) AS party,
              bs.speaker_role, bs.speaker_ressort, bs.speech_type, bs.text_chars,
              bs.interruptions, bs.politician_id,
              bs.drucksache_nrn,
              bsa.tonalitaet, bsa.zusammenfassung_2_saetze AS zusammenfassung,
              bsa.konkrete_zahlen_json, bsa.forderungen_json
       FROM berlin_speeches bs
       LEFT JOIN berlin_speech_analyses bsa ON bsa.speech_id = bs.speech_id
       LEFT JOIN politicians p ON p.id = bs.politician_id
       LEFT JOIN parties pa ON pa.id = p.party_id
       WHERE bs.sitzung_nr = ? AND bs.top_marker = ? AND bs.top_titel = ?
         AND bs.is_praesidium = 0
       ORDER BY bs.order_in_session`,
    ).all(sitzungNr, t.top_marker, t.top_titel) as {
      speech_id: string; speaker: string | null; party: string | null;
      speaker_role: string | null; speaker_ressort: string | null;
      speech_type: string | null; text_chars: number; interruptions: string | null;
      politician_id: number | null;
      drucksache_nrn: string | null;
      tonalitaet: string | null; zusammenfassung: string | null;
      konkrete_zahlen_json: string | null; forderungen_json: string | null;
    }[];

    const sum = summaryRow.get(sitzungNr, t.top_marker, t.top_titel) as
      | { lead: string | null; body: string | null; zusammenfassung: string | null; key_facts_json: string | null }
      | undefined;
    const keyFacts = parseKeyFacts(sum?.key_facts_json ?? null);

    const speechesOut: BerlinSitzungSpeech[] = speeches.map((s) => {
      let interruptionCount = 0;
      if (s.interruptions) {
        try {
          const parsed = JSON.parse(s.interruptions);
          interruptionCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          interruptionCount = 0;
        }
      }
      const dsNrs = safeJsonArray(s.drucksache_nrn);
      const drucksachen = dsNrs.map((nr) => ({ nr, dbid: dsNrToDbid.get(nr) ?? null }));
      return {
        speechId: s.speech_id,
        speakerName: s.speaker ?? "Unbekannt",
        speakerParty: s.party,
        speakerRole: s.speaker_role,
        speakerRessort: s.speaker_ressort,
        politicianId: s.politician_id,
        speechType: s.speech_type,
        textChars: s.text_chars,
        interruptionCount,
        tonalitaet: s.tonalitaet,
        zusammenfassung: s.zusammenfassung,
        konkreteZahlen: safeJsonArray(s.konkrete_zahlen_json),
        forderungen: safeJsonArray(s.forderungen_json),
        drucksachen,
      };
    });

    // Aggregate TOP-Drucksachen aus Reden (dedup auf nr)
    const topDsMap = new Map<string, string | null>();
    for (const sp of speechesOut) {
      for (const d of sp.drucksachen) {
        if (!topDsMap.has(d.nr)) topDsMap.set(d.nr, d.dbid);
      }
    }
    const topDrucksachen = Array.from(topDsMap.entries()).map(([nr, dbid]) => ({ nr, dbid }));

    return {
      marker: t.top_marker,
      titel: t.top_titel,
      isBoilerplate: BERLIN_BOILERPLATE_TOPS.has(t.top_titel),
      redenCount: t.reden,
      summaryLead: sum?.lead ?? sum?.zusammenfassung ?? null,
      summaryBody: sum?.body ?? null,
      summaryKeyFacts: keyFacts,
      drucksachen: topDrucksachen,
      speeches: speechesOut,
    };
  });

  // Votes der Sitzung — reuse derselben Struktur wie in latestVotes
  const voteRows = db.prepare(
    `SELECT vote_id, sitzung_nr, datum, outcome, modus,
            fraktion_votes_json, drucksache_nrn_json, drucksache_dbids_json, vote_label
     FROM berlin_votes
     WHERE sitzung_nr = ?
     ORDER BY vote_id`,
  ).all(sitzungNr) as {
    vote_id: number; sitzung_nr: number; datum: string;
    outcome: string; modus: string | null;
    fraktion_votes_json: string | null; drucksache_nrn_json: string | null;
    drucksache_dbids_json: string | null; vote_label: string | null;
  }[];

  const votes: BerlinLatestVote[] = voteRows.map((r) => {
    const drsNrn = r.drucksache_nrn_json ? safeParseStringArray(r.drucksache_nrn_json) : [];
    const drsDbids = r.drucksache_dbids_json ? safeParseStringArray(r.drucksache_dbids_json) : [];
    // Bei Vote-Pakets (Antrag + Beschlussempfehlung): wähle die DS mit nicht-
    // leerem Titel als primary, damit die UI nie eine titellose Karte zeigt.
    // Bei Berliner Anträgen ist oft die alte Antrag-DS (PARDOK-Mitteilung)
    // ohne Titel — die Beschlussempfehlung hat dann den aussagekräftigen Titel.
    let primaryDbid: string | null = null;
    let primaryTitel: string | null = null;
    let primaryZusammenfassung: string | null = null;
    let primaryVorgangId: string | null = null;
    // Titel-Quellen-Hierarchie für Berliner Drucksachen:
    // 1. `titel` (Antrag / Gesetzentwurf — meist gut gefüllt)
    // 2. `abstract` (Beschlussempfehlungen + Mitteilungen — Titel landet hier)
    // 3. `desk` (selten, manche alten Vorlagen)
    // 4. Vorgangs-Fallback: bei Beschlussempfehlungen ohne Titel den Original-
    //    Antrag oder Gesetzentwurf via vorgang_id-Lookup nehmen — der hat den
    //    aussagekräftigen Titel.
    // Letzter Fallback: erste DBID auch wenn alle Title-Spalten leer.
    const titelStmt = db.prepare(
      `SELECT COALESCE(NULLIF(bd.titel,''), NULLIF(bd.abstract,''), NULLIF(bd.desk,'')) AS titel,
              bd.vorgang_id AS vorgang_id,
              bd.dok_typ_label AS dok_typ_label,
              bda.zusammenfassung
       FROM berlin_documents bd
       LEFT JOIN berlin_drucksachen_analyses bda ON bda.dbid = bd.dbid
       WHERE bd.dbid = ?`,
    );
    const vorgangsAntragStmt = db.prepare(
      `SELECT COALESCE(NULLIF(bd.titel,''), NULLIF(bd.abstract,'')) AS titel
       FROM berlin_documents bd
       WHERE bd.vorgang_id = ?
         AND (bd.dok_typ_label LIKE '%Antrag%' OR bd.dok_typ_label LIKE '%Gesetzentwurf%' OR bd.dok_typ_label LIKE '%Vorlage%')
         AND (COALESCE(bd.titel,'') != '' OR COALESCE(bd.abstract,'') != '')
       ORDER BY CASE
         WHEN bd.dok_typ_label LIKE '%Antrag%' THEN 1
         WHEN bd.dok_typ_label LIKE '%Gesetzentwurf%' THEN 2
         ELSE 3
       END
       LIMIT 1`,
    );
    /** Generischer Title-Marker — meist Beschlussempfehlung/Mitteilung mit
     *  nur dem dok_typ_label als „Titel". Wenn solcher gefunden, lieber
     *  Vorgangs-Fallback nutzen. */
    function isGenericTitle(t: string | null): boolean {
      if (!t) return true;
      const trimmed = t.trim();
      if (trimmed.length < 12) return true;
      // Querverweis-Abstracts wie „zu Drucksache 19/2933-3" sind kein echter Titel
      // (Beschlussempfehlungen verweisen nur auf die Basis-DS) → Vorgangs-Fallback.
      if (/^zu[rm]?\s+Drucksache\s/i.test(trimmed)) return true;
      return /^(Beschlussempfehlung|Mitteilung zur Kenntnisnahme|Vorlage|Antrag|Drucksache|Gesetzentwurf)(\s|$)/i.test(trimmed);
    }
    for (const dbid of drsDbids) {
      const t = titelStmt.get(dbid) as { titel: string | null; vorgang_id: string | null; dok_typ_label: string | null; zusammenfassung: string | null } | undefined;
      let effectiveTitel = t?.titel ?? null;
      // Vorgangs-Fallback wenn Titel generisch oder leer
      if (isGenericTitle(effectiveTitel) && t?.vorgang_id) {
        const vorgangTitel = vorgangsAntragStmt.get(t.vorgang_id) as { titel: string | null } | undefined;
        if (vorgangTitel?.titel && vorgangTitel.titel.trim().length > 0) {
          effectiveTitel = vorgangTitel.titel;
        }
      }
      if (effectiveTitel && effectiveTitel.trim().length > 0) {
        primaryDbid = dbid;
        primaryTitel = effectiveTitel;
        primaryZusammenfassung = t?.zusammenfassung ?? null;
        primaryVorgangId = t?.vorgang_id ?? null;
        break;
      }
    }
    // Fallback: kein DS mit Titel → erste DBID nehmen (Link funktioniert wenigstens)
    if (!primaryDbid && drsDbids.length > 0) {
      primaryDbid = drsDbids[0];
      const fb = titelStmt.get(primaryDbid) as { vorgang_id: string | null } | undefined;
      primaryVorgangId = fb?.vorgang_id ?? null;
    }
    let fraktionVotes: Record<string, string> = {};
    if (r.fraktion_votes_json) {
      try {
        fraktionVotes = JSON.parse(r.fraktion_votes_json) as Record<string, string>;
      } catch {
        fraktionVotes = {};
      }
    }
    return {
      voteId: r.vote_id,
      sitzungNr: r.sitzung_nr,
      datum: r.datum,
      outcome: r.outcome,
      modus: r.modus,
      fraktionVotes,
      drucksacheNrn: drsNrn,
      primaryTitel,
      primaryDbid,
      primaryZusammenfassung,
      primaryVorgangId,
      voteLabel: r.vote_label,
    };
  });

  return {
    sitzungNr,
    plprDokNr: `19/${sitzungNr}`,
    datum: header.datum ?? "",
    plprLokUrl: header.lok_url,
    redenTotal: header.reden,
    redenByType,
    uniqueSpeakers,
    tops,
    votes,
  };
}

function safeParseStringArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// ============================================================
// Berlin-Drucksachen-Detail: JOIN berlin_documents ↔ berlin_pdf_texts
// ↔ berlin_drucksachen_analyses. Liefert alle für die UI relevanten
// Felder, inkl. Mitzeichner aus berlin_document_persons.
// ============================================================

export interface BerlinDrucksacheDetail {
  // Identität
  dbid: string;
  klasse: string; // anfrage_antwort | antrag | gesetzentwurf | vorlage_senat | beschlussempfehlung_regex
  dokTypLabel: string | null;
  dokArtLabel: string | null;
  dokNr: string | null;
  datum: string | null;
  titel: string | null;
  vorgangId: string | null;
  vorgangTitel: string | null;
  lokUrl: string | null;
  seitenbereich: string | null;
  sachgebiet: string | null;
  pages: number | null;
  chars: number | null;
  // LLM-Output (Common)
  zusammenfassung: string | null;
  thema: string[];
  tonalitaet: string | null;
  antwortCharakter: string | null;
  // Klassen-spezifisch
  kerninhalt: string[] | null;        // antrag / vorlage_senat
  kerninhaltFrage: string[] | null;   // anfrage_antwort
  kerninhaltAntwort: string[] | null; // anfrage_antwort
  regelung: string | null;            // gesetzentwurf
  begruendung: string | null;         // gesetzentwurf
  auswirkung: string | null;          // gesetzentwurf
  betroffeneGruppen: string | null;   // gesetzentwurf
  einbringer: string | null;          // gesetzentwurf
  dokumenttyp: string | null;         // vorlage_senat
  // Aktoren
  fraktion: string | null;
  adressat: string | null;            // antrag
  senatsverwaltung: string | null;
  bezirkBezug: string | null;
  // Beschlussempfehlung-Regex
  regexLabel: string | null;
  // Drift-Audit
  topicDrift: string[] | null;
  tonalitaetDrift: string | null;
  // Audit-Trail
  promptVersion: string | null;
  model: string | null;
}

export interface BerlinDsMitzeichner {
  politicianId: number;
  firstName: string;
  lastName: string;
  partyLabel: string | null;
  role: string; // urheber, mitunterzeichner, redner, etc.
}

export interface BerlinDsIndexEntry {
  dbid: string;
  dokNr: string | null;
  titel: string | null;
  datum: string | null;
  klasse: string;
  fraktion: string | null;
  einbringer: string | null;
  zusammenfassung: string | null;
  tonalitaet: string | null;
  antwortCharakter: string | null;
}

export interface BerlinDsIndexResult {
  rows: BerlinDsIndexEntry[];
  total: number;
  klasseFacets: { klasse: string; count: number }[];
  years: string[];
}

/** Berlin-Drucksachen-Index: paginierte Liste + Klassen-/Jahr-Facetten (Pendant zu /aktivitaeten).
 *  `tags`: OR-Filter auf thema_json (≥1 der Roh-Tags) — trägt die /themen-Feld-Detailansicht. */
export function listBerlinDrucksachenForIndex(opts: {
  klasse?: string;
  year?: string;
  fraktion?: string;
  tags?: readonly string[];
  offset?: number;
  limit?: number;
}): BerlinDsIndexResult {
  const db = getDb();
  const { klasse, year, fraktion, tags, offset = 0, limit = 50 } = opts;
  try {
    const yearCond = year ? "AND substr(d.dok_datum,1,4) = @year" : "";
    const klasseCond = klasse ? "AND a.klasse = @klasse" : "";
    const fraktionCond = fraktion ? "AND a.fraktion = @fraktion" : "";
    // Tag-Filter: a.thema_json enthält ≥1 der Feld-Tags (entdoppelt pro DS durch den JOIN-1:1).
    const tagList = (tags ?? []).filter(Boolean);
    const tagsCond = tagList.length
      ? `AND (${tagList.map((_, i) => `a.thema_json LIKE @tag${i}`).join(" OR ")})`
      : "";
    const whereParams: Record<string, string> = {};
    if (year) whereParams.year = year;
    if (klasse) whereParams.klasse = klasse;
    if (fraktion) whereParams.fraktion = fraktion;
    tagList.forEach((t, i) => { whereParams[`tag${i}`] = `%"${t}"%`; });

    const rows = db.prepare(`
      SELECT d.dbid, d.dok_nr AS dokNr,
             COALESCE(NULLIF(TRIM(d.titel),''), NULLIF(TRIM(d.abstract),''), a.derived_titel) AS titel,
             d.dok_datum AS datum,
             a.klasse, a.fraktion, a.einbringer, a.zusammenfassung,
             a.tonalitaet, a.antwort_charakter AS antwortCharakter
      FROM berlin_documents d
      JOIN berlin_drucksachen_analyses a ON a.dbid = d.dbid
      WHERE a.klasse IS NOT NULL ${yearCond} ${klasseCond} ${fraktionCond} ${tagsCond}
      ORDER BY d.dok_datum DESC, d.dbid DESC
      LIMIT @limit OFFSET @offset
    `).all({ ...whereParams, offset, limit }) as BerlinDsIndexEntry[];

    const total = (db.prepare(`
      SELECT COUNT(*) c
      FROM berlin_documents d
      JOIN berlin_drucksachen_analyses a ON a.dbid = d.dbid
      WHERE a.klasse IS NOT NULL ${yearCond} ${klasseCond} ${fraktionCond} ${tagsCond}
    `).get(whereParams) as { c: number }).c;

    const tagParams: Record<string, string> = {};
    tagList.forEach((t, i) => { tagParams[`tag${i}`] = `%"${t}"%`; });

    const klasseFacets = db.prepare(`
      SELECT a.klasse, COUNT(*) count
      FROM berlin_documents d
      JOIN berlin_drucksachen_analyses a ON a.dbid = d.dbid
      WHERE a.klasse IS NOT NULL ${yearCond} ${fraktionCond} ${tagsCond}
      GROUP BY a.klasse ORDER BY count DESC
    `).all({ ...(year ? { year } : {}), ...(fraktion ? { fraktion } : {}), ...tagParams }) as { klasse: string; count: number }[];

    const years = (db.prepare(`
      SELECT DISTINCT substr(d.dok_datum,1,4) y
      FROM berlin_documents d
      JOIN berlin_drucksachen_analyses a ON a.dbid = d.dbid
      WHERE a.klasse IS NOT NULL AND d.dok_datum IS NOT NULL ${klasseCond} ${fraktionCond} ${tagsCond}
      ORDER BY y DESC
    `).all({ ...(klasse ? { klasse } : {}), ...(fraktion ? { fraktion } : {}), ...tagParams }) as { y: string }[])
      .map((r) => r.y)
      .filter((y) => y && y.length === 4);

    return { rows, total, klasseFacets, years };
  } catch {
    return { rows: [], total: 0, klasseFacets: [], years: [] };
  }
}

export interface BerlinThemenfeldCount {
  key: string;     // Feld-Slug (berlin-themen-struktur.ts)
  label: string;
  count: number;   // distinct DS mit ≥1 Tag des Felds
}
export interface BerlinThemenfelderCounts {
  felder: BerlinThemenfeldCount[];     // Achse A (Politikfelder), desc
  querschnitt: BerlinThemenfeldCount[];// Achse B, desc
  gesamtDs: number;                    // alle analysierten DS (entdoppelt)
}

/**
 * Level-1-Themenbrowse: pro Feld die Anzahl DISTINCT Drucksachen mit ≥1 Roh-Tag
 * des Felds (Aggregationsregel aus berlin-themen-struktur.ts — pro DS entdoppelt,
 * multi-Feld erlaubt, Querschnitt additiv). Grundlage der /themen-Berlin-Seite.
 * Frei aus thema_json — KEIN LLM (Level 2 wäre Phase B).
 */
export function getBerlinThemenfelderCounts(): BerlinThemenfelderCounts {
  const db = getDb();
  const tally = (feld: { key: string; label: string; tags: readonly string[] }): BerlinThemenfeldCount => {
    const cond = feld.tags.map(() => "a.thema_json LIKE ?").join(" OR ") || "0";
    const c = (db.prepare(`
      SELECT COUNT(*) c FROM berlin_drucksachen_analyses a
      WHERE a.klasse IS NOT NULL AND (${cond})
    `).get(...feld.tags.map((t) => `%"${t}"%`)) as { c: number }).c;
    return { key: feld.key, label: feld.label, count: c };
  };
  const felder = BERLIN_POLITIKFELDER.map(tally).sort((a, b) => b.count - a.count);
  const querschnitt = BERLIN_QUERSCHNITT.map(tally).sort((a, b) => b.count - a.count);
  const gesamtDs = (db.prepare(`SELECT COUNT(*) c FROM berlin_drucksachen_analyses WHERE klasse IS NOT NULL`).get() as { c: number }).c;
  return { felder, querschnitt, gesamtDs };
}

export interface BerlinQaItem {
  dbid: string;
  dokNr: string | null;
  datum: string | null;
  titel: string | null;
  askerName: string | null;
  askerParty: string | null;
  askerPoliticianId: number | null;
  askerMore: number;            // weitere Mit-Fragende (für „+N")
  frage: string[];
  antwort: string[];
  zusammenfassung: string | null;
}

/**
 * Schriftliche Anfragen Berlins als Frage→Antwort-Liste (paginiert, optional gesucht).
 * Anders als beim Bundestag braucht es KEINE Extraktion: jede anfrage_antwort-Drucksache
 * ist bereits ein Q&A-Dokument (Frage-Bullets + Senatsantwort-Bullets + Urheber:in).
 */
export function getBerlinQaList(
  q: string,
  page: number,
  perPage = 30,
  partei: string | null = null,
  sort: "neu" | "alt" = "neu"
): { items: BerlinQaItem[]; total: number } {
  const db = getDb();
  try {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const search = q
      ? `AND (a.zusammenfassung LIKE @like OR a.kerninhalt_frage_json LIKE @like OR a.kerninhalt_antwort_json LIKE @like OR bd.dok_nr LIKE @like OR a.derived_titel LIKE @like OR bd.titel LIKE @like)`
      : "";
    // Partei-Filter: Dokument zählt, wenn eine:r der Urheber:innen dieser Partei angehört.
    const parteiFilter = partei
      ? `AND EXISTS (
           SELECT 1 FROM berlin_document_persons bdp
           JOIN politicians p ON p.id = bdp.politician_id
           LEFT JOIN parties pa ON p.party_id = pa.id
           WHERE bdp.dbid = a.dbid AND bdp.role = 'urheber' AND pa.label = @partei
         )`
      : "";
    const baseWhere = `WHERE a.klasse='anfrage_antwort' AND a.error_type IS NULL ${search} ${parteiFilter}`;
    const filterParams: Record<string, unknown> = {};
    if (q) filterParams.like = like;
    if (partei) filterParams.partei = partei;
    const countStmt = db.prepare(
      `SELECT COUNT(*) c FROM berlin_drucksachen_analyses a JOIN berlin_documents bd ON bd.dbid=a.dbid ${baseWhere}`
    );
    const total = ((Object.keys(filterParams).length ? countStmt.get(filterParams) : countStmt.get()) as { c: number }).c;

    const dir = sort === "alt" ? "ASC" : "DESC";
    const params: Record<string, unknown> = { ...filterParams, lim: perPage, off: (page - 1) * perPage };
    const rows = db.prepare(`
      SELECT a.dbid, bd.dok_nr AS dokNr, bd.dok_datum AS datum,
             COALESCE(NULLIF(TRIM(bd.titel),''), a.derived_titel) AS titel,
             a.kerninhalt_frage_json, a.kerninhalt_antwort_json, a.zusammenfassung
      FROM berlin_drucksachen_analyses a
      JOIN berlin_documents bd ON bd.dbid = a.dbid
      ${baseWhere}
      ORDER BY bd.dok_datum ${dir}, bd.dbid ${dir}
      LIMIT @lim OFFSET @off
    `).all(params) as Array<{
      dbid: string; dokNr: string | null; datum: string | null; titel: string | null;
      kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null; zusammenfassung: string | null;
    }>;

    const askerStmt = db.prepare(`
      SELECT bdp.politician_id, p.first_name, p.last_name, pa.label AS party_label
      FROM berlin_document_persons bdp
      JOIN politicians p ON p.id = bdp.politician_id
      LEFT JOIN parties pa ON p.party_id = pa.id
      WHERE bdp.dbid = ? AND bdp.role = 'urheber'
    `);
    const items: BerlinQaItem[] = rows.map((r) => {
      const askers = askerStmt.all(r.dbid) as Array<{ politician_id: number; first_name: string; last_name: string; party_label: string | null }>;
      const a0 = askers[0];
      return {
        dbid: r.dbid, dokNr: r.dokNr, datum: r.datum, titel: r.titel,
        askerName: a0 ? `${a0.first_name} ${a0.last_name}`.trim() : null,
        askerParty: a0?.party_label ?? null,
        askerPoliticianId: a0?.politician_id ?? null,
        askerMore: Math.max(0, askers.length - 1),
        frage: safeJsonArray(r.kerninhalt_frage_json),
        antwort: safeJsonArray(r.kerninhalt_antwort_json),
        zusammenfassung: r.zusammenfassung,
      };
    });
    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
}

/** Partei-Optionen für den Filter auf /fragen (nur Parteien, die als Urheber:in von Anfragen auftreten). */
export function getBerlinQaParties(): Array<{ party: string; count: number }> {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT pa.label AS party, COUNT(DISTINCT a.dbid) AS count
      FROM berlin_drucksachen_analyses a
      JOIN berlin_document_persons bdp ON bdp.dbid = a.dbid AND bdp.role = 'urheber'
      JOIN politicians p ON p.id = bdp.politician_id
      JOIN parties pa ON p.party_id = pa.id
      WHERE a.klasse = 'anfrage_antwort' AND a.error_type IS NULL
        AND pa.label IS NOT NULL AND TRIM(pa.label) <> ''
      GROUP BY pa.label
      ORDER BY count DESC
    `).all() as Array<{ party: string; count: number }>;
  } catch {
    return [];
  }
}

export function getBerlinDrucksacheDetail(dbid: string): BerlinDrucksacheDetail | null {
  const db = getDb();
  let row: {
    dbid: string; klasse: string; dok_typ_label: string | null; dok_art_label: string | null;
    dok_nr: string | null; dok_datum: string | null; titel: string | null; vorgang_id: string | null;
    vorgang_titel: string | null; lok_url: string | null; seitenbereich: string | null; sachgebiet: string | null;
    pages: number | null; chars: number | null;
    zusammenfassung: string | null; thema_json: string | null; tonalitaet: string | null; antwort_charakter: string | null;
    kerninhalt_json: string | null; kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null;
    regelung: string | null; begruendung: string | null; auswirkung: string | null;
    betroffene_gruppen: string | null; einbringer: string | null; dokumenttyp: string | null;
    fraktion: string | null; adressat: string | null; senatsverwaltung: string | null; bezirk_bezug: string | null;
    regex_label: string | null; topic_drift_json: string | null; tonalitaet_drift: string | null;
    prompt_version: string | null; model: string | null;
  } | undefined;
  try {
    row = db.prepare(`
      SELECT
        d.dbid, a.klasse, d.dok_typ_label, d.dok_art_label, d.dok_nr, d.dok_datum AS dok_datum,
        COALESCE(NULLIF(TRIM(d.titel),''), NULLIF(TRIM(d.abstract),''), a.derived_titel) AS titel,
        d.vorgang_id, v.titel AS vorgang_titel, d.lok_url, d.seitenbereich, v.vsys_label AS sachgebiet,
        t.pages, t.chars,
        a.zusammenfassung, a.thema_json, a.tonalitaet, a.antwort_charakter,
        a.kerninhalt_json, a.kerninhalt_frage_json, a.kerninhalt_antwort_json,
        a.regelung, a.begruendung, a.auswirkung, a.betroffene_gruppen, a.einbringer, a.dokumenttyp,
        a.fraktion, a.adressat, a.senatsverwaltung, a.bezirk_bezug,
        a.regex_label, a.topic_drift_json, a.tonalitaet_drift, a.prompt_version, a.model
      FROM berlin_documents d
      LEFT JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
      LEFT JOIN berlin_drucksachen_analyses a ON a.dbid = d.dbid
      LEFT JOIN berlin_vorgaenge v ON v.vid = d.vorgang_id
      WHERE d.dbid = ?
    `).get(dbid) as typeof row;
  } catch {
    return null; // Tabellen fehlen
  }
  if (!row) return null;

  const parseArr = (s: string | null): string[] | null => {
    if (!s) return null;
    try {
      const v = JSON.parse(s);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null;
    } catch { return null; }
  };
  const themen = parseArr(row.thema_json) ?? [];
  const topic_drift = parseArr(row.topic_drift_json);

  return {
    dbid: row.dbid,
    klasse: row.klasse ?? "skip",
    dokTypLabel: row.dok_typ_label,
    dokArtLabel: row.dok_art_label,
    dokNr: row.dok_nr,
    datum: row.dok_datum,
    titel: row.titel,
    vorgangId: row.vorgang_id,
    vorgangTitel: row.vorgang_titel,
    lokUrl: row.lok_url,
    seitenbereich: row.seitenbereich,
    sachgebiet: row.sachgebiet,
    pages: row.pages,
    chars: row.chars,
    zusammenfassung: row.zusammenfassung,
    thema: themen,
    tonalitaet: row.tonalitaet,
    antwortCharakter: row.antwort_charakter,
    kerninhalt: parseArr(row.kerninhalt_json),
    kerninhaltFrage: parseArr(row.kerninhalt_frage_json),
    kerninhaltAntwort: parseArr(row.kerninhalt_antwort_json),
    regelung: row.regelung,
    begruendung: row.begruendung,
    auswirkung: row.auswirkung,
    betroffeneGruppen: row.betroffene_gruppen,
    einbringer: row.einbringer,
    dokumenttyp: row.dokumenttyp,
    fraktion: row.fraktion,
    adressat: row.adressat,
    senatsverwaltung: row.senatsverwaltung,
    bezirkBezug: row.bezirk_bezug,
    regexLabel: row.regex_label,
    topicDrift: topic_drift,
    tonalitaetDrift: row.tonalitaet_drift,
    promptVersion: row.prompt_version,
    model: row.model,
  };
}

// ============================================================
// Berlin-Vorgang: die ganze Verfahrenskette einer Drucksache
// (Antrag → Lesungen → Ausschuss → Beschlussempfehlung → Beschluss)
// ============================================================

export interface BerlinVorgangSchritt {
  dbid: string;
  dokNr: string | null;
  dokTypLabel: string | null;
  datum: string | null;
  titel: string | null;     // derived_titel aus Analyse, falls vorhanden
  linkable: boolean;        // hat eigene Detailseite (in analyses) und ist nicht das aktuelle Dok
  isSelf: boolean;
}

export interface BerlinDsVorgang {
  vid: string;
  vtypLabel: string | null;
  titel: string | null;
  schritte: BerlinVorgangSchritt[];
}

/** Liefert die komplette Vorgangskette der Drucksache (alle Dokumente mit gleicher
 *  vorgang_id, chronologisch). Dok ohne Analyse (Lesungen/Plenum-Behandlungen) erscheinen
 *  als Verfahrensschritt ohne Link; echte Drucksachen (Antrag/Beschlussempfehlung) sind
 *  verlinkbar. null, wenn kein Vorgang oder Kette nur aus sich selbst besteht. */
export function getBerlinDsVorgang(dbid: string): BerlinDsVorgang | null {
  const db = getDb();
  try {
    const self = db.prepare(`SELECT vorgang_id FROM berlin_documents WHERE dbid = ?`).get(dbid) as { vorgang_id: string | null } | undefined;
    if (!self?.vorgang_id) return null;
    const vid = self.vorgang_id;
    const v = db.prepare(`SELECT vtyp_label, titel FROM berlin_vorgaenge WHERE vid = ?`).get(vid) as { vtyp_label: string | null; titel: string | null } | undefined;
    const rows = db.prepare(`
      SELECT d.dbid, d.dok_nr, d.dok_typ_label, d.dok_datum AS dok_datum,
             a.dbid AS a_dbid, a.derived_titel
      FROM berlin_documents d
      LEFT JOIN berlin_drucksachen_analyses a ON a.dbid = d.dbid
      WHERE d.vorgang_id = ?
      ORDER BY (d.dok_datum IS NULL), d.dok_datum ASC, d.dok_nr ASC
    `).all(vid) as Array<{ dbid: string; dok_nr: string | null; dok_typ_label: string | null; dok_datum: string | null; a_dbid: string | null; derived_titel: string | null }>;
    if (rows.length <= 1) return null;
    return {
      vid,
      vtypLabel: v?.vtyp_label ?? null,
      titel: v?.titel ?? null,
      schritte: rows.map((r) => ({
        dbid: r.dbid,
        dokNr: r.dok_nr,
        dokTypLabel: r.dok_typ_label,
        datum: r.dok_datum,
        titel: r.derived_titel,
        linkable: !!r.a_dbid && r.dbid !== dbid,
        isSelf: r.dbid === dbid,
      })),
    };
  } catch {
    return null;
  }
}


// ============================================================
// Berlin-Votes: Plenum-Abstimmungs-Events pro DS
// ============================================================

export interface BerlinDsVote {
  voteId: number;
  sitzungNr: number | null;
  datum: string | null;
  voteType: string;          // handzeichen | namentlich | hammelsprung | unklar
  outcome: string;           // annahme | annahme_geaendert | ablehnung | vertagung | ueberweisung | kein_vote
  modus: string | null;      // einstimmig | mehrheitlich | knapp | unklar
  fraktionVotes: Record<string, string> | null; // {CDU:"ja", SPD:"ja", ...}
  stimmenZahlen: { ja: number; nein: number; enthaltungen: number } | null;
  drucksacheNrn: string[];   // ["19/0234"]
  drucksacheDbids: string[]; // ["D-XXX", "D-YYY"] (resolved)
  plprLokUrl: string;
  rawSnippet: string | null;
  voteLabel: string | null;  // Regex-Label aus raw_snippet: "Einzelplan 06 – Justiz", "Auflagen-Paket", etc.
}

export interface BerlinDsPlenarbehandlung {
  sitzungNr: number;
  datum: string;
  topMarker: string;
  topTitel: string;
  redenCount: number;
  /** Phase, falls aus speech_type oder Kontext ableitbar: 'erste_lesung' | 'zweite_lesung' | 'fragestunde' | 'priorität' | null. */
  phase: string | null;
}

/** Reverse-Lookup: in welchen Sitzungen + TOPs wurde diese Drucksache verhandelt?
 *  Aggregiert über berlin_speeches.drucksache_nrn (JSON-Array).
 *  Liefert chronologisch absteigend (neueste zuerst). */
export function getBerlinDsPlenarbehandlungen(dbid: string): BerlinDsPlenarbehandlung[] {
  const db = getDb();
  // 1. dok_nr für dbid holen
  const doc = db.prepare(`SELECT dok_nr FROM berlin_documents WHERE dbid = ?`).get(dbid) as { dok_nr: string | null } | undefined;
  if (!doc?.dok_nr) return [];
  const dokNr = doc.dok_nr;
  try {
    const rows = db.prepare(
      `SELECT bs.sitzung_nr AS sitzung_nr,
              MAX(bs.datum) AS datum,
              bs.top_marker AS top_marker,
              MAX(bs.top_titel) AS top_titel,
              COUNT(*) AS reden_count
       FROM berlin_speeches bs, json_each(bs.drucksache_nrn) j
       WHERE j.value = ?
         AND bs.is_praesidium = 0
       GROUP BY bs.sitzung_nr, bs.top_marker
       ORDER BY datum DESC, bs.sitzung_nr DESC`,
    ).all(dokNr) as Array<{ sitzung_nr: number; datum: string; top_marker: string; top_titel: string; reden_count: number }>;
    return rows.map((r) => ({
      sitzungNr: r.sitzung_nr,
      datum: r.datum,
      topMarker: r.top_marker,
      topTitel: r.top_titel,
      redenCount: r.reden_count,
      phase: r.top_titel?.includes("Priorität") ? "priorität" : null, // simple heuristic
    }));
  } catch {
    return [];
  }
}

/** Holt alle Vote-Events die diese Berlin-DS referenzieren.
 *  JOIN über drucksache_dbids_json (json_each-able). */
export function getBerlinDsVotes(dbid: string): BerlinDsVote[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT bv.vote_id, bv.sitzung_nr, bv.datum, bv.vote_type, bv.outcome, bv.modus,
             bv.fraktion_votes_json, bv.stimmen_zahlen_json,
             bv.drucksache_nrn_json, bv.drucksache_dbids_json,
             bv.plpr_lok_url, bv.raw_snippet, bv.vote_label
      FROM berlin_votes bv, json_each(bv.drucksache_dbids_json) AS j
      WHERE j.value = ? AND bv.error_type IS NULL
      ORDER BY bv.datum DESC, bv.snippet_offset ASC
    `).all(dbid) as Array<{
      vote_id: number; sitzung_nr: number | null; datum: string | null;
      vote_type: string; outcome: string; modus: string | null;
      fraktion_votes_json: string | null; stimmen_zahlen_json: string | null;
      drucksache_nrn_json: string | null; drucksache_dbids_json: string | null;
      plpr_lok_url: string; raw_snippet: string | null; vote_label: string | null;
    }>;
    const parse = <T,>(s: string | null): T | null => {
      if (!s) return null;
      try { return JSON.parse(s) as T; } catch { return null; }
    };
    return rows.map((r) => ({
      voteId: r.vote_id,
      sitzungNr: r.sitzung_nr,
      datum: r.datum,
      voteType: r.vote_type,
      outcome: r.outcome,
      modus: r.modus,
      fraktionVotes: parse<Record<string, string>>(r.fraktion_votes_json),
      stimmenZahlen: parse<{ ja: number; nein: number; enthaltungen: number }>(r.stimmen_zahlen_json),
      drucksacheNrn: parse<string[]>(r.drucksache_nrn_json) ?? [],
      drucksacheDbids: parse<string[]>(r.drucksache_dbids_json) ?? [],
      plprLokUrl: r.plpr_lok_url,
      rawSnippet: r.raw_snippet,
      voteLabel: r.vote_label,
    }));
  } catch {
    return []; // berlin_votes-Tabelle evt. noch nicht angelegt
  }
}

/** Mitzeichner / Urheber einer Berlin-Drucksache aus berlin_document_persons. */
export function getBerlinDsMitzeichner(dbid: string): BerlinDsMitzeichner[] {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT bdp.politician_id, p.first_name, p.last_name, p.party_label, bdp.role
      FROM berlin_document_persons bdp
      JOIN politicians p ON p.id = bdp.politician_id
      WHERE bdp.dbid = ?
      ORDER BY
        CASE bdp.role
          WHEN 'urheber' THEN 0
          WHEN 'mitunterzeichner' THEN 1
          WHEN 'redner' THEN 2
          ELSE 3
        END,
        p.last_name, p.first_name
    `).all(dbid) as Array<{
      politician_id: number; first_name: string; last_name: string;
      party_label: string | null; role: string;
    }>;
    return rows.map((r) => ({
      politicianId: r.politician_id,
      firstName: r.first_name,
      lastName: r.last_name,
      partyLabel: r.party_label,
      role: r.role,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sitzungs-Detail-Seite (/protokolle/sitzung/[nummer])
// ─────────────────────────────────────────────────────────────────────────────

// ── Sitzungs-„Stories"-Detail: pro TOP verschachtelte Reden mit Analyse ──────
// Liefert die Daten für die erzählerische Sitzungs-Detailseite (analog zur
// Berlin-Variante): jeder TOP mit seinen Reden (Sprecher, Partei-Label,
// Tonalität, 2-Satz-Zusammenfassung, extrahierte Forderungen/Zahlen, Original-
// text) + Session-Abstimmungen (namentlich) + Drucksachen + Nachbar-Sitzungen.
export interface SitzungStorySpeech {
  speechId: number;
  redeId: string | null;
  segmentIndex: number;
  speaker: string;
  partyLabel: string;
  rawParty: string | null;
  tonalitaet: string | null;
  zusammenfassung: string | null;
  forderungen: string[];
  konkreteZahlen: string[];
  originalText: string | null;
  mediathekFvid: string | null;
  mediathekConfidence: string | null;
  antwortAufSpeaker: string | null;  // Phase D: bei Fragestunde-Antworten die beantwortete Frage-Person
}

export interface SitzungStoryTop {
  topicId: number;
  topicNumber: string;
  title: string;
  speeches: SitzungStorySpeech[];
  /** KI-Synthese „Das Wichtigste" (key_facts mit refs in die with-summary-Reden), null wenn nicht generiert. */
  keyFacts: { text: string; refs: number[] }[] | null;
  /** Diesem TOP zugeordnete Abstimmungen (per DS-Überschneidung), Sprung-Anker in den Überblick. */
  voteRefs: { anchorId: string; label: string; accepted: boolean | null }[];
  /** Drucksachen dieses TOP (aus den T_Drs des Protokolls), für Pills mit Link zur DS-Seite. */
  drucksachen: { nr: string; titel: string | null }[];
}

export interface SitzungHandzeichenVote {
  voteId: number;
  outcome: string;
  modus: string | null;
  subtype: string | null;
  titel: string | null;
  drucksacheNrn: string[];
  fraktionVotes: Record<string, string>;
}

export interface SitzungStories {
  wahlperiode: number;
  sitzung: number;
  datum: string | null;
  sourceUrl: string | null;
  stats: { speechCount: number; voteCount: number; speakerCount: number; topicCount: number };
  tops: SitzungStoryTop[];
  votes: Array<{ pollId: number; label: string; yes: number; no: number; abstain: number; yesRatio: number }>;
  handzeichen: SitzungHandzeichenVote[];
  drucksachen: Array<{ drucksacheNr: string; thema: string | null; refCount: number }>;
  neighbors: {
    prev: { sitzung: number; datum: string | null } | null;
    next: { sitzung: number; datum: string | null } | null;
  };
}

/** Tolerantes Parsen der LLM-JSON-Arrays (Haiku sendet selten Strings statt Arrays). */
function safeStringArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    }
  } catch {
    /* defekte Zeile ignorieren */
  }
  return [];
}

export function getSitzungStories(sitzungNr: number): SitzungStories | null {
  const db = getDb();
  const session = db
    .prepare(
      `SELECT id, wahlperiode, sitzung, datum, source_url
       FROM plenar_sessions WHERE sitzung = ? LIMIT 1`
    )
    .get(sitzungNr) as
    | { id: number; wahlperiode: number; sitzung: number; datum: string | null; source_url: string | null }
    | undefined;
  if (!session) return null;

  // Rolle/Partei → einheitliches Label (Minister:innen ohne party-Feld → Bundesregierung etc.)
  const PARTY_LABEL_SQL = `CASE
    WHEN s.party IS NOT NULL AND s.party != '' THEN s.party
    WHEN s.role LIKE 'Bundesminister%' OR s.role LIKE 'Bundeskanzler%'
      OR s.role LIKE 'Staatssekret%' OR s.role LIKE 'Staatsminister%'
      OR s.role LIKE 'Parl. Staatssekret%' THEN 'Bundesregierung'
    WHEN s.role LIKE '%Präsident%' OR s.role LIKE 'Vizepräsident%' THEN 'Präsidium'
    ELSE 'ohne Fraktion'
  END`;

  const topics = db
    .prepare(
      `SELECT id AS topic_id, topic_number, title
       FROM plenar_topics WHERE session_id = ?
       ORDER BY CASE WHEN topic_number GLOB '[0-9]*' THEN CAST(topic_number AS INTEGER) ELSE 9999 END, topic_number`
    )
    .all(session.id) as Array<{ topic_id: number; topic_number: string; title: string }>;

  const speechRows = db
    .prepare(
      `SELECT s.id AS speech_id, s.rede_id, s.segment_index, s.topic_id, s.speaker,
              s.party AS raw_party, ${PARTY_LABEL_SQL} AS party_label, s.original_text,
              s.mediathek_fvid, s.mediathek_confidence,
              (SELECT q.speaker FROM plenar_speeches q WHERE q.id = s.antwort_auf_speech_id) AS antwort_auf_speaker,
              sa.zusammenfassung_2_saetze AS zus, sa.tonalitaet,
              sa.forderungen_json, sa.konkrete_zahlen_json
       FROM plenar_speeches s
       LEFT JOIN speech_analyses_v2 sa ON sa.speech_id = s.id
       WHERE s.session_id = ?
       ORDER BY s.speech_index, s.segment_index`
    )
    .all(session.id) as Array<{
    speech_id: number;
    rede_id: string | null;
    segment_index: number;
    topic_id: number | null;
    speaker: string;
    raw_party: string | null;
    party_label: string;
    original_text: string | null;
    mediathek_fvid: string | null;
    mediathek_confidence: string | null;
    antwort_auf_speaker: string | null;
    zus: string | null;
    tonalitaet: string | null;
    forderungen_json: string | null;
    konkrete_zahlen_json: string | null;
  }>;

  const byTopic = new Map<number, SitzungStorySpeech[]>();
  for (const r of speechRows) {
    if (r.topic_id == null) continue;
    if (!byTopic.has(r.topic_id)) byTopic.set(r.topic_id, []);
    byTopic.get(r.topic_id)!.push({
      speechId: r.speech_id,
      redeId: r.rede_id,
      segmentIndex: r.segment_index,
      speaker: r.speaker,
      partyLabel: r.party_label,
      rawParty: r.raw_party,
      tonalitaet: r.tonalitaet,
      zusammenfassung: r.zus,
      forderungen: safeStringArray(r.forderungen_json),
      konkreteZahlen: safeStringArray(r.konkrete_zahlen_json),
      originalText: r.original_text,
      mediathekFvid: r.mediathek_fvid,
      mediathekConfidence: r.mediathek_confidence,
      antwortAufSpeaker: r.antwort_auf_speaker,
    });
  }

  // KI-Synthese „Das Wichtigste" pro TOP (falls generiert). Tabelle existiert
  // evtl. noch nicht (vor erstem Batch-Lauf) → tolerant.
  const keyFactsByTopic = new Map<number, { text: string; refs: number[] }[]>();
  try {
    const kfRows = db
      .prepare(`SELECT topic_id, key_facts_json FROM plenar_top_summaries WHERE sitzung_nr = ? AND key_facts_json IS NOT NULL`)
      .all(session.sitzung) as { topic_id: number; key_facts_json: string }[];
    for (const r of kfRows) {
      try {
        const kf = JSON.parse(r.key_facts_json);
        if (Array.isArray(kf)) keyFactsByTopic.set(r.topic_id, kf);
      } catch {
        /* defekte Zeile ignorieren */
      }
    }
  } catch {
    /* plenar_top_summaries noch nicht angelegt */
  }

  const tops: SitzungStoryTop[] = topics
    .map((t) => ({
      topicId: t.topic_id,
      topicNumber: t.topic_number,
      title: t.title,
      speeches: byTopic.get(t.topic_id) ?? [],
      keyFacts: keyFactsByTopic.get(t.topic_id) ?? null,
      voteRefs: [] as { anchorId: string; label: string; accepted: boolean | null }[],
      drucksachen: [] as { nr: string; titel: string | null }[],
    }))
    .filter((t) => t.speeches.length > 0);

  const stats = db
    .prepare(
      `SELECT (SELECT COUNT(DISTINCT rede_id) FROM plenar_speeches WHERE session_id = ?) AS speech_count,
              (SELECT COUNT(DISTINCT speaker) FROM plenar_speeches WHERE session_id = ?) AS speaker_count`
    )
    .get(session.id, session.id) as { speech_count: number; speaker_count: number };

  const voteRows = session.datum
    ? (db
        .prepare(
          `SELECT poll_id, MAX(poll_label) AS poll_label,
                  SUM(CASE WHEN vote='yes' THEN 1 ELSE 0 END) AS yes,
                  SUM(CASE WHEN vote='no' THEN 1 ELSE 0 END) AS no,
                  SUM(CASE WHEN vote='abstain' THEN 1 ELSE 0 END) AS abstain
           FROM votes WHERE poll_date = ? AND poll_label IS NOT NULL
           GROUP BY poll_id ORDER BY poll_id`
        )
        .all(session.datum) as Array<{ poll_id: number; poll_label: string; yes: number; no: number; abstain: number }>)
    : [];

  const drucksachenRows = session.datum
    ? (db
        .prepare(
          `SELECT a.drucksache_nr, MIN(a.thema) AS thema, COUNT(*) AS ref_count
           FROM activities a
           WHERE a.datum = ? AND a.drucksache_nr IS NOT NULL AND a.drucksache_nr != ''
           GROUP BY a.drucksache_nr ORDER BY ref_count DESC LIMIT 12`
        )
        .all(session.datum) as Array<{ drucksache_nr: string; thema: string | null; ref_count: number }>)
    : [];

  // Handzeichen-Abstimmungen (Fraktionsebene) — direkt über sitzung_nr verknüpft.
  const titleByActivity = db.prepare(
    `SELECT thema FROM activities WHERE drucksache_nr = ? AND thema IS NOT NULL AND thema != '' LIMIT 1`
  );
  const titleByDip = db.prepare(
    `SELECT titel FROM dip_ds_titles WHERE drucksache_nr = ? AND titel IS NOT NULL AND titel != '' LIMIT 1`
  );
  // Generischer Titel = nur Dokumenttyp ("Beschlussempfehlung"/"Antrag" allein)
  // oder < 12 Z. → als unbrauchbar behandeln (Berlin-Methodik), bessere Quelle suchen.
  const isGenericDsTitle = (t: string | null | undefined): boolean => {
    if (!t) return true;
    const s = t.trim();
    if (s.length < 12) return true;
    // Nur das NACKTE Dokumenttyp-Wort ist generisch ("Beschlussempfehlung").
    // "Bericht über …", "Antrag der Fraktion …" usw. sind echte Titel → behalten.
    return /^(Beschlussempfehlung|Mitteilung|Unterrichtung|Bericht|Vorlage|Antrag|Drucksache|Gesetzentwurf|Entwurf)\s*$/i.test(s);
  };
  // Titel über ALLE Drucksachen-Nrn des Votes suchen (nicht nur die erste) —
  // z.B. trägt bei Gesetzen oft die Beschlussempfehlung den Titel, nicht der GE.
  // Quellen: activities.thema (offizieller Betreff) + dip_ds_titles.titel
  // (DIP-Vorgang-Titel). Generische Treffer werden übersprungen.
  const lookupDsTitle = (nrs: string[]): string | null => {
    for (const nr of nrs) {
      const a = titleByActivity.get(nr) as { thema: string } | undefined;
      if (a?.thema && !isGenericDsTitle(a.thema)) return a.thema;
      const b = titleByDip.get(nr) as { titel: string } | undefined;
      if (b?.titel && !isGenericDsTitle(b.titel)) return b.titel;
    }
    return null;
  };
  const parseFraktionVotes = (json: string | null): Record<string, string> => {
    if (!json) return {};
    try {
      const v = JSON.parse(json);
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const out: Record<string, string> = {};
        for (const [k, val] of Object.entries(v)) if (typeof val === "string") out[k] = val;
        return out;
      }
    } catch {
      /* defekte Zeile ignorieren */
    }
    return {};
  };
  const handzeichenRows = db
    .prepare(
      `SELECT vote_id, outcome, modus, vote_subtype, drucksache_nrn_json, fraktion_votes_json
       FROM bundestag_votes WHERE sitzung_nr = ? ORDER BY vote_id`
    )
    .all(session.sitzung) as Array<{
    vote_id: number;
    outcome: string;
    modus: string | null;
    vote_subtype: string | null;
    drucksache_nrn_json: string | null;
    fraktion_votes_json: string | null;
  }>;
  const handzeichen: SitzungHandzeichenVote[] = handzeichenRows.map((r) => {
    const drucksacheNrn = safeStringArray(r.drucksache_nrn_json);
    return {
      voteId: r.vote_id,
      outcome: r.outcome,
      modus: r.modus,
      subtype: r.vote_subtype,
      titel: lookupDsTitle(drucksacheNrn),
      drucksacheNrn,
      fraktionVotes: parseFraktionVotes(r.fraktion_votes_json),
    };
  });

  // ── Votes den TOPs zuordnen (DS-Überschneidung, analog Berlin) ──
  // TOP→DS aus plenar_topic_drucksachen (T_Drs), Vote→DS namentlich via
  // drucksache_polls, Handzeichen via drucksache_nrn_json. Treffer → Badge am TOP.
  const dsToTopics = new Map<string, number[]>();
  const topicDsList = new Map<number, string[]>();
  try {
    const ptdRows = db
      .prepare(
        `SELECT ptd.topic_id, ptd.drucksache_nr FROM plenar_topic_drucksachen ptd
         JOIN plenar_topics pt ON pt.id = ptd.topic_id WHERE pt.session_id = ?`
      )
      .all(session.id) as { topic_id: number; drucksache_nr: string }[];
    for (const r of ptdRows) {
      if (!dsToTopics.has(r.drucksache_nr)) dsToTopics.set(r.drucksache_nr, []);
      dsToTopics.get(r.drucksache_nr)!.push(r.topic_id);
      if (!topicDsList.has(r.topic_id)) topicDsList.set(r.topic_id, []);
      topicDsList.get(r.topic_id)!.push(r.drucksache_nr);
    }
  } catch {
    /* plenar_topic_drucksachen noch nicht angelegt */
  }
  // Per-TOP-Drucksachen an die TOPs hängen (mit Titel-Lookup für Tooltip).
  for (const t of tops) {
    const ds = topicDsList.get(t.topicId);
    if (ds && ds.length > 0) t.drucksachen = ds.map((nr) => ({ nr, titel: lookupDsTitle([nr]) }));
  }
  if (dsToTopics.size > 0) {
    const topById = new Map(tops.map((t) => [t.topicId, t]));
    const pushRef = (dsList: string[], anchorId: string, label: string, accepted: boolean | null) => {
      const seenTop = new Set<number>();
      for (const nr of dsList) {
        for (const tid of dsToTopics.get(nr) ?? []) {
          if (seenTop.has(tid)) continue;
          seenTop.add(tid);
          const top = topById.get(tid);
          if (top && !top.voteRefs.some((r) => r.anchorId === anchorId)) {
            top.voteRefs.push({ anchorId, label, accepted });
          }
        }
      }
    };
    // namentliche
    const pollDsStmt = db.prepare(`SELECT drucksache_nr FROM drucksache_polls WHERE poll_id = ?`);
    for (const v of voteRows) {
      const ds = (pollDsStmt.all(v.poll_id) as { drucksache_nr: string }[]).map((r) => r.drucksache_nr);
      if (ds.length === 0) continue;
      const accepted = v.yes > v.no;
      pushRef(ds, `vote-n-${v.poll_id}`, accepted ? "Angenommen" : "Abgelehnt", accepted);
    }
    // Handzeichen
    for (const h of handzeichen) {
      if (h.drucksacheNrn.length === 0) continue;
      const accepted =
        h.outcome === "annahme" || h.outcome === "annahme_geaendert"
          ? true
          : h.outcome === "ablehnung"
          ? false
          : null;
      const label = accepted === true ? "Angenommen" : accepted === false ? "Abgelehnt" : h.outcome;
      pushRef(h.drucksacheNrn, `vote-h-${h.voteId}`, label, accepted);
    }
  }

  const prev = db
    .prepare(`SELECT sitzung, datum FROM plenar_sessions WHERE sitzung < ? ORDER BY sitzung DESC LIMIT 1`)
    .get(sitzungNr) as { sitzung: number; datum: string | null } | undefined;
  const next = db
    .prepare(`SELECT sitzung, datum FROM plenar_sessions WHERE sitzung > ? ORDER BY sitzung ASC LIMIT 1`)
    .get(sitzungNr) as { sitzung: number; datum: string | null } | undefined;

  return {
    wahlperiode: session.wahlperiode,
    sitzung: session.sitzung,
    datum: session.datum,
    sourceUrl: session.source_url,
    stats: {
      speechCount: stats?.speech_count ?? 0,
      voteCount: voteRows.length,
      speakerCount: stats?.speaker_count ?? 0,
      topicCount: tops.length,
    },
    tops,
    votes: voteRows.map((r) => {
      const denom = r.yes + r.no;
      return {
        pollId: r.poll_id,
        label: r.poll_label,
        yes: r.yes,
        no: r.no,
        abstain: r.abstain,
        yesRatio: denom > 0 ? r.yes / denom : 0,
      };
    }),
    handzeichen,
    drucksachen: drucksachenRows.map((r) => ({
      drucksacheNr: r.drucksache_nr,
      thema: r.thema,
      refCount: r.ref_count,
    })),
    neighbors: {
      prev: prev ? { sitzung: prev.sitzung, datum: prev.datum } : null,
      next: next ? { sitzung: next.sitzung, datum: next.datum } : null,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Berlin Themen-Aktivitätsprofil (Regierungsbilanz Produkt 1, rollenbasiert)
// Pro Roh-Tag (thema_json) × Partei, Instrumente GETRENNT (nie summiert — andere
// Rollen: Antrag=Gestaltung / Anfrage=Kontrolle / Rede=Debatte / Gesetzentwurf).
// Scope: Wegner-Ära (dok_datum/datum >= 2023-04-27). Roh-Tag, NICHT aw_field-Rollup
// (der überzählt, siehe project_themenfelder_rollup_bug). Deskriptiv, keine Noten.
// ─────────────────────────────────────────────────────────────────────────
const BERLIN_WEGNER_VON = "2023-04-27";
const BERLIN_REGIERUNG = ["CDU", "SPD"];

// Berlin-Partei-Normalisierung: splittet Koalitions-Urheber ("GRÜNE + LINKE",
// "CDU + SPD") auf die Einzelparteien — jede bekommt die Initiative gutgeschrieben.
function splitBerlinParteien(raw: string | null): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(/\s*\+\s*|\s*,\s*|\s+und\s+/)) {
    const u = part.trim().toUpperCase();
    if (!u) continue;
    if (u.includes("GRÜN") || u.includes("GRUEN")) out.push("Grüne");
    else if (u.includes("LINKE")) out.push("Linke");
    else if (u.includes("AFD")) out.push("AfD");
    else if (u.startsWith("CDU")) out.push("CDU");
    else if (u === "SPD") out.push("SPD");
    else if (u.includes("FDP")) out.push("FDP");
    else if (u.includes("SENAT")) out.push("Senat");
    else if (u.includes("FRAKTIONSLOS")) out.push("fraktionslos");
  }
  return [...new Set(out)];
}

export interface BerlinThemenInstrument {
  key: string;            // antrag | anfrage | gesetzentwurf | rede
  label: string;
  rolle: string;          // Gestaltung | Kontrolle | Debatte | Regierungs-Gestaltung
  total: number;
  byPartei: { partei: string; n: number; regierung: boolean }[];   // desc
}
export interface BerlinThemenAktivitaet {
  thema: string;
  vonDatum: string;
  regierung: string[];
  instrumente: BerlinThemenInstrument[];
}

export function getBerlinThemenAktivitaet(thema: string): BerlinThemenAktivitaet {
  const db = getDb();
  const pat = `%"${thema}"%`;
  // Akkumulator: instrument-key → partei → count
  const acc: Record<string, Map<string, number>> = {
    antrag: new Map(), anfrage: new Map(), gesetzentwurf: new Map(), rede: new Map(),
  };
  const bump = (key: string, parteien: string[]) => {
    for (const p of parteien) acc[key].set(p, (acc[key].get(p) ?? 0) + 1);
  };

  // 1. Drucksachen (Antrag / Anfrage / Gesetzentwurf) — Roh-Tag, Wegner-Scope
  const dsRows = db.prepare(`
    SELECT a.klasse, a.fraktion, a.einbringer
    FROM berlin_drucksachen_analyses a
    JOIN berlin_documents d ON d.dbid = a.dbid
    WHERE a.error_type IS NULL AND a.thema_json LIKE ? AND d.dok_datum >= ?
  `).all(pat, BERLIN_WEGNER_VON) as { klasse: string; fraktion: string | null; einbringer: string | null }[];
  for (const r of dsRows) {
    const parteien = splitBerlinParteien(r.fraktion ?? r.einbringer);
    if (!parteien.length) continue;
    if (r.klasse === "antrag") bump("antrag", parteien);
    else if (r.klasse === "anfrage_antwort") bump("anfrage", parteien);
    else if (r.klasse === "gesetzentwurf") bump("gesetzentwurf", parteien);
  }

  // 2. Reden — kein direktes Thema-Feld → über die debattierte Drucksache
  //    (berlin_speeches.drucksache_nrn → dok_nr → thema_json), Redner-Partei zählt.
  const redeRows = db.prepare(`
    WITH thema_dok AS (
      SELECT DISTINCT d.dok_nr
      FROM berlin_drucksachen_analyses a JOIN berlin_documents d ON d.dbid = a.dbid
      WHERE a.error_type IS NULL AND a.thema_json LIKE ?
    )
    SELECT s.speaker_party AS partei, COUNT(DISTINCT s.speech_id) AS n
    FROM berlin_speeches s, json_each(s.drucksache_nrn) je
    WHERE s.datum >= ? AND s.drucksache_nrn LIKE '[%'
      AND je.value IN (SELECT dok_nr FROM thema_dok)
      AND s.speaker_party IS NOT NULL AND s.speaker_party <> ''
    GROUP BY s.speaker_party
  `).all(pat, BERLIN_WEGNER_VON) as { partei: string; n: number }[];
  for (const r of redeRows) {
    const p = splitBerlinParteien(r.partei)[0];
    if (p) acc.rede.set(p, (acc.rede.get(p) ?? 0) + r.n);
  }

  const META: { key: string; label: string; rolle: string }[] = [
    { key: "antrag", label: "Anträge", rolle: "Gestaltung" },
    { key: "anfrage", label: "Anfragen", rolle: "Kontrolle" },
    { key: "gesetzentwurf", label: "Gesetzentwürfe", rolle: "Regierungs-Gestaltung" },
    { key: "rede", label: "Reden", rolle: "Debatte" },
  ];
  const instrumente: BerlinThemenInstrument[] = META.map((m) => {
    const byPartei = [...acc[m.key].entries()]
      .map(([partei, n]) => ({ partei, n, regierung: BERLIN_REGIERUNG.includes(partei) || partei === "Senat" }))
      .sort((a, b) => b.n - a.n);
    return { ...m, total: byPartei.reduce((s, x) => s + x.n, 0), byPartei };
  });
  return { thema, vonDatum: BERLIN_WEGNER_VON, regierung: BERLIN_REGIERUNG, instrumente };
}

// ─────────────────────────────────────────────────────────────────────────
// Themenfelder: Initiativ-Profil pro Fraktion (Bundestag)
// Kreuzt item_topics (AW-Politikfeld-Klassifikation) × Einbringer-Fraktion.
// Nur Initiativen (Anträge/Gesetzentwürfe), keine Regierungs-Antworten.
// ─────────────────────────────────────────────────────────────────────────
export function normalizeFraktion(raw: string | null): string | null {
  if (!raw) return null;
  let f = raw.trim().replace(/^(Fraktion\s+)?(der |die |des )/i, "").trim();
  if (!f || f === "<UNKNOWN>") return null;
  if (/[,]| und /.test(f)) return "Mehrere (gemeinsam)";
  const u = f.toUpperCase();
  if (u.includes("GRÜNEN")) return "Grüne";
  if (u.includes("LINKE")) return "Die Linke";
  if (u.includes("AFD")) return "AfD";
  if (u.startsWith("CDU") || u.startsWith("CSU")) return "CDU/CSU";
  if (u === "SPD") return "SPD";
  if (u.includes("BUNDESREGIERUNG") || u.includes("BUNDESMINIST")) return "Bundesregierung";
  if (u.includes("BUNDESRAT")) return "Bundesrat";
  return null;
}

/** Instrument-Modus der Initiativ-Matrix: echte Initiativen (Anträge + GE),
 *  Kleine Anfragen (Kontrollinstrument) oder alle Drucksachen. */
export type InitiativeArt = "ini" | "ka" | "alle";

export interface InitiativeItem { nr: string; titel: string; art: Exclude<InitiativeArt, "alle"> | "sonst" }
export interface InitiativeCell {
  counts: Record<InitiativeArt, number>;
  items: InitiativeItem[];
}
export interface InitiativeMatrix {
  fraktionen: { name: string; totals: Record<InitiativeArt, number> }[];
  fields: string[];
  cells: Record<string, Record<string, InitiativeCell>>;
}

export function getTopicInitiativeMatrix(): InitiativeMatrix {
  const rows = getDb().prepare(`
    SELECT it.item_id AS nr, it.aw_field AS field, da.fraktion AS fraktion,
      di.instrument AS instrument,
      COALESCE((SELECT titel FROM dip_ds_titles WHERE drucksache_nr=it.item_id AND titel IS NOT NULL),
               da.zusammenfassung, da.thema) AS titel
    FROM item_topics it
    JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
    LEFT JOIN drucksache_instrument di ON di.drucksache_nr = it.item_id
    WHERE it.source='bt_drucksache' AND da.batch_class != 'antwort' AND da.thema IS NOT NULL
  `).all() as { nr: string; field: string; fraktion: string | null; instrument: string | null; titel: string | null }[];

  const artOf = (instrument: string | null): InitiativeItem["art"] =>
    instrument === "kleine_anfrage" ? "ka"
    : instrument === "antrag" || instrument === "gesetzentwurf" ? "ini"
    : "sonst";

  const cells: Record<string, Record<string, InitiativeCell>> = {};
  const fraktionTotalsDs: Record<string, Record<InitiativeArt, Set<string>>> = {};
  const fieldTotals: Record<string, number> = {};
  for (const r of rows) {
    const fr = normalizeFraktion(r.fraktion);
    if (!fr) continue;
    const art = artOf(r.instrument);
    const tot = (fraktionTotalsDs[fr] ??= { alle: new Set(), ini: new Set(), ka: new Set() });
    tot.alle.add(r.nr);
    if (art !== "sonst") tot[art].add(r.nr);
    fieldTotals[r.field] = (fieldTotals[r.field] ?? 0) + 1;
    const cf = (cells[fr] ??= {});
    const cell = (cf[r.field] ??= { counts: { alle: 0, ini: 0, ka: 0 }, items: [] });
    cell.counts.alle++;
    if (art !== "sonst") cell.counts[art]++;
    // Drill-down: pro Instrument-Art bis zu 8 Titel, damit jeder Modus Beispiele hat.
    if (r.titel && cell.items.filter((it) => it.art === art).length < 8) {
      cell.items.push({ nr: r.nr, titel: r.titel.slice(0, 140), art });
    }
  }
  const fraktionen = Object.entries(fraktionTotalsDs)
    .map(([name, s]) => ({ name, totals: { alle: s.alle.size, ini: s.ini.size, ka: s.ka.size } }))
    .sort((a, b) => b.totals.alle - a.totals.alle);
  const fields = Object.entries(fieldTotals).sort((a, b) => b[1] - a[1]).map(([f]) => f);
  return { fraktionen, fields, cells };
}

/**
 * Bürger-Themen-Frontdoor: distinkte Drucksachen-Zahl ("Initiativen") für ein
 * Set von aw_fields aus item_topics. Antworten ausgeschlossen (= eingebrachte
 * Initiativen, nicht Beantwortungen). DISTINCT über das Feld-Set, damit eine DS
 * mit zwei der Felder nicht doppelt zählt.
 */
export function getDrucksacheCountForFields(fields: string[]): number {
  if (fields.length === 0) return 0;
  const ph = fields.map(() => "?").join(",");
  const row = getDb()
    .prepare(
      `SELECT COUNT(DISTINCT it.item_id) AS n
       FROM item_topics it
       JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
       WHERE it.source = 'bt_drucksache' AND it.aw_field IN (${ph})
         AND da.batch_class != 'antwort' AND da.thema IS NOT NULL`,
    )
    .get(...fields) as { n: number };
  return row?.n ?? 0;
}

/**
 * Fraktions-Aufschlüsselung der Initiativen für ein aw_field-Set — für die
 * Divergenz-Analyse ("wer treibt das Volumen?"). Entzerrt den Eindruck, hohes
 * Drucksachen-Volumen = parlamentarische Priorität (oft sind es Oppositions-
 * anträge). Distinkte Drucksachen je roher Fraktions-Bezeichnung.
 */
export function getFieldFraktionBreakdown(fields: string[]): { fraktion: string | null; n: number }[] {
  if (fields.length === 0) return [];
  const ph = fields.map(() => "?").join(",");
  return getDb()
    .prepare(
      `SELECT da.fraktion AS fraktion, COUNT(DISTINCT it.item_id) AS n
       FROM item_topics it
       JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
       WHERE it.source = 'bt_drucksache' AND it.aw_field IN (${ph})
         AND da.batch_class != 'antwort' AND da.thema IS NOT NULL
       GROUP BY da.fraktion
       ORDER BY n DESC`,
    )
    .all(...fields) as { fraktion: string | null; n: number }[];
}

/**
 * Feinkörnige Drucksachen-Zählung über das `thema`-Freifeld (Substring) — nur
 * für Themen ohne eigenes aw_field (z. B. "Rente", in "Soziale Sicherung"
 * aufgegangen). Liefert Treffer + Gesamtbasis für den Prozentanteil.
 */
export function getThemaKeywordShare(keyword: string): { hits: number; total: number } {
  const total = (
    getDb()
      .prepare(`SELECT COUNT(*) AS n FROM drucksache_analyses WHERE batch_class != 'antwort' AND thema IS NOT NULL`)
      .get() as { n: number }
  ).n;
  const hits = (
    getDb()
      .prepare(`SELECT COUNT(*) AS n FROM drucksache_analyses WHERE batch_class != 'antwort' AND thema LIKE ?`)
      .get(`%${keyword}%`) as { n: number }
  ).n;
  return { hits, total };
}

/**
 * Instrument-Aufschlüsselung für ein aw_field-Set (Bürger-Themen-Frontdoor).
 *   handeln    = Gesetzentwürfe + Beschlussempfehlungen + Verordnungen → was das
 *                Parlament tatsächlich legislativ bearbeitet (das wichtigere Maß).
 *   kontrolle  = Kleine/Große Anfragen → Aufmerksamkeit/Kontrolle (Oppositions-
 *                Werkzeug), NICHT Handeln.
 *   antrag     = Anträge (meist Opposition, meist abgelehnt).
 * Antworten/Administratives (Wahlvorschläge etc.) zählen in keinen der drei.
 * Quelle: drucksache_instrument (aus Volltext-Kopf geparst).
 */
export interface InstrumentCounts {
  handeln: number;
  kontrolle: number;
  antrag: number;
}

export function getInstrumentCountsForFields(fields: string[]): InstrumentCounts {
  if (fields.length === 0) return { handeln: 0, kontrolle: 0, antrag: 0 };
  const ph = fields.map(() => "?").join(",");
  const row = getDb()
    .prepare(
      `SELECT
         SUM(CASE WHEN di.bucket='handeln' THEN 1 ELSE 0 END) AS handeln,
         SUM(CASE WHEN di.bucket='kontrolle' THEN 1 ELSE 0 END) AS kontrolle,
         SUM(CASE WHEN di.bucket='antrag' THEN 1 ELSE 0 END) AS antrag
       FROM (SELECT DISTINCT it.item_id FROM item_topics it
             WHERE it.source='bt_drucksache' AND it.aw_field IN (${ph})) x
       JOIN drucksache_instrument di ON di.drucksache_nr = x.item_id`,
    )
    .get(...fields) as { handeln: number | null; kontrolle: number | null; antrag: number | null };
  return { handeln: row.handeln ?? 0, kontrolle: row.kontrolle ?? 0, antrag: row.antrag ?? 0 };
}

/**
 * Instrument-Aufschlüsselung für STICHWORT-Kacheln (Themen ohne eigenes aw_field,
 * z. B. „Rente", „Krieg"). Match über thema-Tag ODER Zusammenfassung-Freitext.
 */
export function getInstrumentCountsForThema(keywords: string[]): InstrumentCounts {
  if (keywords.length === 0) return { handeln: 0, kontrolle: 0, antrag: 0 };
  const cond = keywords.map(() => "(da.thema LIKE ? OR da.zusammenfassung LIKE ?)").join(" OR ");
  const params: string[] = [];
  for (const k of keywords) params.push(`%${k}%`, `%${k}%`);
  const row = getDb()
    .prepare(
      `SELECT
         SUM(CASE WHEN di.bucket='handeln' THEN 1 ELSE 0 END) AS handeln,
         SUM(CASE WHEN di.bucket='kontrolle' THEN 1 ELSE 0 END) AS kontrolle,
         SUM(CASE WHEN di.bucket='antrag' THEN 1 ELSE 0 END) AS antrag
       FROM drucksache_analyses da
       JOIN drucksache_instrument di ON di.drucksache_nr = da.drucksache_nr
       WHERE da.batch_class != 'antwort' AND da.thema IS NOT NULL AND (${cond})`,
    )
    .get(...params) as { handeln: number | null; kontrolle: number | null; antrag: number | null };
  return { handeln: row.handeln ?? 0, kontrolle: row.kontrolle ?? 0, antrag: row.antrag ?? 0 };
}

export interface TopicDrucksache {
  nr: string;
  titel: string | null;
  fraktion: string | null;
}

/** Drucksachen-Liste für die Bürger-Thema-Detailseite (ein aw_field-Set). */
export function listDrucksachenForFields(
  fields: string[],
  limit = 60,
  offset = 0,
): { items: TopicDrucksache[]; total: number } {
  if (fields.length === 0) return { items: [], total: 0 };
  const ph = fields.map(() => "?").join(",");
  const where = `it.source = 'bt_drucksache' AND it.aw_field IN (${ph})
     AND da.batch_class != 'antwort' AND da.thema IS NOT NULL`;
  const total = (
    getDb()
      .prepare(
        `SELECT COUNT(DISTINCT it.item_id) AS n
         FROM item_topics it JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
         WHERE ${where}`,
      )
      .get(...fields) as { n: number }
  ).n;
  const items = getDb()
    .prepare(
      `SELECT it.item_id AS nr,
         COALESCE((SELECT titel FROM dip_ds_titles WHERE drucksache_nr = it.item_id AND titel IS NOT NULL),
                  da.zusammenfassung, da.thema) AS titel,
         da.fraktion AS fraktion
       FROM item_topics it
       JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
       WHERE ${where}
       GROUP BY it.item_id
       ORDER BY it.item_id DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...fields, limit, offset) as TopicDrucksache[];
  return { items, total };
}

/** Drucksachen-Liste für STICHWORT-Kacheln (Rente/Krieg): thema-Tag ODER Zusammenfassung. */
export function listDrucksachenForThema(
  keywords: string[],
  limit = 60,
  offset = 0,
): { items: TopicDrucksache[]; total: number } {
  if (keywords.length === 0) return { items: [], total: 0 };
  const cond = keywords.map(() => "(da.thema LIKE ? OR da.zusammenfassung LIKE ?)").join(" OR ");
  const kp: string[] = [];
  for (const k of keywords) kp.push(`%${k}%`, `%${k}%`);
  const where = `da.batch_class != 'antwort' AND da.thema IS NOT NULL AND (${cond})`;
  const total = (
    getDb()
      .prepare(`SELECT COUNT(*) AS n FROM drucksache_analyses da WHERE ${where}`)
      .get(...kp) as { n: number }
  ).n;
  const items = getDb()
    .prepare(
      `SELECT da.drucksache_nr AS nr,
         COALESCE((SELECT titel FROM dip_ds_titles WHERE drucksache_nr = da.drucksache_nr AND titel IS NOT NULL),
                  da.zusammenfassung, da.thema) AS titel,
         da.fraktion AS fraktion
       FROM drucksache_analyses da
       WHERE ${where}
       ORDER BY da.drucksache_nr DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...kp, limit, offset) as TopicDrucksache[];
  return { items, total };
}

// ───────────────────────────────────────────────────────────────────────────
// Partei-Themenfeld-Positionen ("Sagt"-Schicht aus den BTW-2025-Wahlprogrammen)
// Extraktiv, neutral, mit verifizierten Beleg-Zitaten (Seiten-Anker).
// ───────────────────────────────────────────────────────────────────────────
export interface ParteiBeleg {
  zitat: string;
  seite: number | null;
  verifiziert: boolean;
}
export interface ParteiPositionRow {
  feld: string;
  position: string;
  leer: number;
  belege: ParteiBeleg[];
  kompakt: string[];
}

type ParteiPositionDbRow = {
  feld: string;
  position: string;
  leer: number;
  belege_json: string | null;
  kompakt_json: string | null;
};

function mapParteiPositionRow(r: ParteiPositionDbRow): ParteiPositionRow {
  return {
    feld: r.feld,
    position: r.position,
    leer: r.leer,
    belege: (JSON.parse(r.belege_json || "[]") as ParteiBeleg[]).map((b) => ({
      zitat: b.zitat,
      seite: b.seite ?? null,
      verifiziert: !!b.verifiziert,
    })),
    kompakt: JSON.parse(r.kompakt_json || "[]") as string[],
  };
}

export function getParteiPositionen(partei: string): ParteiPositionRow[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT feld, position, leer, belege_json, kompakt_json
       FROM partei_themenfeld_position
       WHERE partei = ?
       ORDER BY feld COLLATE NOCASE`,
    )
    .all(partei) as ParteiPositionDbRow[];
  return rows.map(mapParteiPositionRow);
}

/** Alle Parteien für EIN Themenfeld (Themenfeld-zuerst-Vergleich). */
export function getFeldVergleich(
  feld: string,
): { partei: string; pos: ParteiPositionRow }[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT partei, feld, position, leer, belege_json, kompakt_json
       FROM partei_themenfeld_position
       WHERE feld = ? AND leer = 0
       ORDER BY partei`,
    )
    .all(feld) as (ParteiPositionDbRow & { partei: string })[];
  return rows.map((r) => ({ partei: r.partei, pos: mapParteiPositionRow(r) }));
}

/** "Tut"-Schicht (Pilot): synthetisierte Aspekt-Positionen aus Reden/Q&A + Votes,
 *  geschachtelt als aspekt -> partei -> Material. Nur Felder mit Pilot-Daten. */
export type AspektVerhalten = {
  gesagt: string | null;
  punkte: { text: string; refs: string[] }[];
  belege: {
    zitat: string;
    quelle: string;
    quelleId: string;
    quelleUrl: string | null;
    quelleLabel: string | null;
    person: string | null;
    verifiziert: boolean;
  }[];
  votes: { voteId: number; richtung: string; betreff: string; kurz: string | null; url: string | null }[];
  nVotes: number;
  nReden: number;
  nQa: number;
};

export function getFeldVerhalten(
  feld: string,
): Record<string, Record<string, AspektVerhalten>> {
  const db = getDb();
  // vote_id -> Sitzungsnummer, für Deep-Link auf den Vote-Anker im Protokoll.
  const voteSitzung = new Map<number, number>();
  for (const v of db
    .prepare(`SELECT vote_id, sitzung_nr FROM bundestag_votes WHERE sitzung_nr IS NOT NULL`)
    .all() as { vote_id: number; sitzung_nr: number }[]) {
    voteSitzung.set(v.vote_id, v.sitzung_nr);
  }
  // vote_id -> Kurzlabel (manuell, Tabelle vote_kurz)
  const voteKurz = new Map<number, string>();
  for (const v of db.prepare(`SELECT vote_id, kurz FROM vote_kurz`).all() as {
    vote_id: number;
    kurz: string;
  }[]) {
    voteKurz.set(v.vote_id, v.kurz);
  }
  const rows = db
    .prepare(
      `SELECT aspekt, partei, gesagt, gesagt_punkte_json, gesagt_belege_json, abgestimmt_json,
              n_votes, n_reden, n_qa
       FROM partei_aspekt_verhalten
       WHERE feld = ?`,
    )
    .all(feld) as {
    aspekt: string;
    partei: string;
    gesagt: string | null;
    gesagt_punkte_json: string | null;
    gesagt_belege_json: string | null;
    abgestimmt_json: string | null;
    n_votes: number;
    n_reden: number;
    n_qa: number;
  }[];

  const out: Record<string, Record<string, AspektVerhalten>> = {};
  for (const r of rows) {
    const belege = (
      JSON.parse(r.gesagt_belege_json || "[]") as {
        zitat: string;
        quelle: string;
        quelle_id: string;
        quelle_url?: string | null;
        quelle_label?: string | null;
        quelle_person?: string | null;
        verifiziert?: boolean;
      }[]
    ).map((b) => ({
      zitat: b.zitat,
      quelle: b.quelle,
      quelleId: b.quelle_id,
      quelleUrl: b.quelle_url ?? null,
      quelleLabel: b.quelle_label ?? null,
      person: b.quelle_person ?? null,
      verifiziert: !!b.verifiziert,
    }));
    const votes = (
      JSON.parse(r.abgestimmt_json || "[]") as {
        vote_id: number;
        richtung: string;
        betreff: string;
      }[]
    ).map((v) => {
      const sn = voteSitzung.get(v.vote_id);
      return {
        voteId: v.vote_id,
        richtung: v.richtung,
        betreff: v.betreff,
        kurz: voteKurz.get(v.vote_id) ?? null,
        url: sn != null ? `/protokolle/sitzung/${sn}#vote-h-${v.vote_id}` : null,
      };
    });
    const punkte = (() => {
      try {
        const arr = JSON.parse(r.gesagt_punkte_json || "[]");
        if (Array.isArray(arr) && arr.length) {
          if (typeof arr[0] === "string")
            return arr.map((x) => ({ text: String(x), refs: [] as string[] }));
          return arr.map((o) => ({
            text: String(o?.punkt ?? o?.text ?? ""),
            refs: Array.isArray(o?.refs) ? o.refs.map((x: unknown) => String(x)) : [],
          }));
        }
      } catch {
        /* fallback unten */
      }
      return r.gesagt ? [{ text: r.gesagt, refs: [] as string[] }] : [];
    })();
    (out[r.aspekt] ??= {})[r.partei] = {
      gesagt: r.gesagt,
      punkte,
      belege,
      votes,
      nVotes: r.n_votes,
      nReden: r.n_reden,
      nQa: r.n_qa,
    };
  }
  return out;
}

/** Abstimmungen eines Feldes aus der MANUELL verifizierten Klassifikation:
 *  - vote_aspekt = Gold-Aspekt je Sach-Vote (koppelt „Tut" an die Aspekt-Achse der Synthese)
 *  - vote_themenfeld = Feld-Zuordnung; nur Primärfeld + Sach-Votes (verfahren = 0).
 *  Ersetzt die alte lückenhafte Pilot-Zuordnung (partei_aspekt_verhalten.abgestimmt_json).
 *  Verfahrens-Votes (Petition/Personenwahl) bleiben aussen vor. Betreff = DIP-Drucksachentitel
 *  (dip_ds_titles), Kurzlabel aus vote_kurz wenn vorhanden, Roll-Call aus fraktion_votes_json.
 *  proAspekt[label] = Sach-Votes mit Gold-Aspekt (Schlüssel = Matrix-Aspekt-Label);
 *  feldweit = Sach-Votes des Feldes ohne kuratierten Aspekt (Haushalt/Immunität etc.). */
export type FeldVorlage = {
  voteId: number;
  kurz: string | null;
  betreff: string;
  url: string | null;
  fraktionen: Record<string, string>; // partei -> ja|nein|enthaltung|unbekannt
  // true = Beschlussempfehlung, die Ablehnung des Antrags empfiehlt → Stimme gegenläufig.
  beschlussAblehnung: boolean;
};
export type FeldAbstimmungen = {
  proAspekt: Record<string, FeldVorlage[]>;
  feldweit: FeldVorlage[];
};

export function getFeldAbstimmungen(feld: string): FeldAbstimmungen {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT vt.vote_id              AS voteId,
              va.aspekt               AS aspekt,
              bv.sitzung_nr           AS sitzung,
              bv.fraktion_votes_json  AS frakJson,
              bv.drucksache_nrn_json  AS dsJson,
              dt.titel                AS titel,
              vk.kurz                 AS kurz,
              vbk.empfiehlt           AS beschlussEmpfiehlt
       FROM vote_themenfeld vt
       JOIN bundestag_votes bv    ON bv.vote_id = vt.vote_id
       LEFT JOIN vote_aspekt va   ON va.vote_id = vt.vote_id
       LEFT JOIN dip_ds_titles dt ON dt.drucksache_nr = vt.via_drucksache
       LEFT JOIN vote_kurz vk     ON vk.vote_id = vt.vote_id
       LEFT JOIN vote_beschluss_kontext vbk ON vbk.vote_id = vt.vote_id
       WHERE vt.feld = ? AND vt.primaer = 1 AND vt.verfahren = 0
       ORDER BY bv.datum DESC, vt.vote_id DESC`,
    )
    .all(feld) as {
    voteId: number;
    aspekt: string | null;
    sitzung: number | null;
    frakJson: string | null;
    dsJson: string | null;
    titel: string | null;
    kurz: string | null;
    beschlussEmpfiehlt: string | null;
  }[];

  // DS-Nummer "21/0589" -> Aktivitäten-Slug "21-589" (führende Nullen strippen).
  const dsToSlug = (nr: string): string | null => {
    const [wp, n] = nr.split("/");
    if (!wp || !n) return null;
    const num = parseInt(n, 10);
    return Number.isNaN(num) ? null : `${wp}-${num}`;
  };

  const toVorlage = (r: (typeof rows)[number]): FeldVorlage => {
    const ds = JSON.parse(r.dsJson || "[]") as string[];
    // Link bevorzugt zur Drucksache (Inhalt), erste auflösbare DS; sonst Plenar-Anker.
    const slug = ds.map(dsToSlug).find((s) => s != null) ?? null;
    const url = slug
      ? `/aktivitaeten/${slug}`
      : r.sitzung != null
        ? `/protokolle/sitzung/${r.sitzung}#vote-h-${r.voteId}`
        : null;
    return {
      voteId: r.voteId,
      kurz: r.kurz ?? null,
      betreff: r.titel || (ds.length ? `Drucksache ${ds.join(", ")}` : ""),
      url,
      fraktionen: JSON.parse(r.frakJson || "{}"),
      beschlussAblehnung: r.beschlussEmpfiehlt === "ablehnen",
    };
  };

  const proAspekt: Record<string, FeldVorlage[]> = {};
  const feldweit: FeldVorlage[] = [];
  for (const r of rows) {
    const v = toVorlage(r);
    if (r.aspekt) (proAspekt[r.aspekt] ??= []).push(v);
    else feldweit.push(v);
  }
  return { proAspekt, feldweit };
}

/** Liste der Themenfelder, die mind. eine Partei-Position haben (für Vergleichs-Nav). */
/** Themenfeld-„Bewegung": Sach-Votes je Feld (verfahren=0), absteigend. Für die
 *  Startseiten-Entwürfe (Bewegungsmesser). Volumen, nicht Recency (Datenstand-bedingt). */
export function getThemenfeldBewegung(limit = 6): { feld: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT feld, COUNT(*) AS count FROM vote_themenfeld
       WHERE verfahren = 0 GROUP BY feld ORDER BY count DESC LIMIT ?`,
    )
    .all(limit) as { feld: string; count: number }[];
}

/** vote_id → outcome (bundestag_votes). Für Konsumenten, die Verfahrens-Votes
 *  (ueberweisung/vertagung) von Sach-Entscheidungen (annahme/ablehnung) trennen müssen. */
export function getVoteOutcomeMap(): Record<number, string> {
  const db = getDb();
  const rows = db
    .prepare(`SELECT vote_id, outcome FROM bundestag_votes WHERE outcome IS NOT NULL AND error_type IS NULL`)
    .all() as { vote_id: number; outcome: string }[];
  const m: Record<number, string> = {};
  for (const r of rows) m[r.vote_id] = r.outcome;
  return m;
}

export function listThemenfelderMitPositionen(): string[] {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT DISTINCT feld FROM partei_themenfeld_position WHERE leer = 0 ORDER BY feld COLLATE NOCASE`,
      )
      .all() as { feld: string }[]
  ).map((r) => r.feld);
}

export function listParteienMitPositionen(): { partei: string; felder: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT partei, COUNT(*) AS felder
       FROM partei_themenfeld_position
       WHERE leer = 0
       GROUP BY partei
       ORDER BY partei`,
    )
    .all() as { partei: string; felder: number }[];
}

// ── Salienz / Aufmacher (rein lesend; Schema legt scripts/_lib/salienz-schema.ts an) ──
/** Ebene 2: Story-Strang über Tage, an dem dieser Cluster hängt (null = nur heute markant). */
export interface SalienzStory { tageAktiv: number; streak: number; seit: string; }
/** Auto-Anker-VORSCHLAG (salienz-anker.ts): DS/Vote, die derselbe Vorgang sein dürften — Picker füllt vor, Mensch gibt OK. */
export interface SalienzAnker { dsNr: string | null; dsTitel: string | null; pollId: number | null; pollLabel: string | null; begruendung: string | null; }
export interface SalienzCluster { clusterId: number; leitthema: string; outletCount: number; outlets: string[]; titles: { outlet: string; title: string; link: string }[]; summary: string | null; gesetzbezug: boolean; story: SalienzStory | null; anker: SalienzAnker | null; }
export interface SalienzFeld {
  themenfeld: string; slug: string; rang: number;
  newsOutletCount: number; newsClusterCount: number; sNews: number; sTwitter: number; score: number | null;
  twitterBegriffe: string[]; topTitles: { outlet: string; title: string; link: string }[]; topClusterIds: number[];
  summary: string | null; gesetzbezug: boolean; cluster: SalienzCluster[];
}

export function getSalienzRanking(runDate?: string): { runDate: string; felder: SalienzFeld[] } | null {
  const db = getDb();
  let rd = runDate;
  try {
    if (!rd) rd = (db.prepare(`SELECT MAX(run_date) AS d FROM salienz_themen`).get() as { d: string | null } | undefined)?.d ?? undefined;
  } catch { return null; } // Tabelle fehlt in PROD → fail-closed
  if (!rd) return null;
  const rows = db.prepare(`SELECT * FROM salienz_themen WHERE run_date=? ORDER BY rang`).all(rd) as Record<string, unknown>[];
  // LEFT JOIN salienz_story: Ebene-2-Strang (kann fehlen, wenn Threading noch nicht lief).
  const clStmt = db.prepare(`
    SELECT c.cluster_id, c.leitthema, c.outlet_count, c.outlets_json, c.titles_json, c.summary, c.gesetzbezug,
           s.day_count, s.streak_days, s.first_date,
           a.ds_nr AS anker_ds_nr, a.ds_titel AS anker_ds_titel, a.poll_id AS anker_poll_id,
           a.poll_label AS anker_poll_label, a.begruendung AS anker_begruendung
    FROM news_cluster c
    LEFT JOIN salienz_story s ON s.thread_id = c.thread_id
    LEFT JOIN salienz_anker a ON a.run_date = c.run_date AND a.cluster_id = c.cluster_id
    WHERE c.run_date=? AND c.themenfeld=?
    ORDER BY c.gesetzbezug DESC, c.outlet_count DESC, c.item_count DESC`);
  const felder: SalienzFeld[] = rows.map((r) => ({
    themenfeld: r.themenfeld as string, slug: r.slug as string, rang: r.rang as number,
    newsOutletCount: r.news_outlet_count as number, newsClusterCount: r.news_cluster_count as number,
    sNews: r.s_news as number, sTwitter: r.s_twitter as number, score: (r.score as number | null) ?? null,
    twitterBegriffe: safeJson(r.twitter_begriffe as string, [] as string[]),
    topTitles: safeJson(r.top_titles as string, [] as { outlet: string; title: string; link: string }[]),
    topClusterIds: safeJson(r.top_cluster_ids as string, [] as number[]),
    summary: (r.summary as string | null) ?? null,
    gesetzbezug: !!(r.gesetzbezug as number | undefined),
    cluster: (clStmt.all(rd, r.themenfeld) as Record<string, unknown>[]).map((c) => ({
      clusterId: c.cluster_id as number, leitthema: c.leitthema as string, outletCount: c.outlet_count as number,
      outlets: safeJson(c.outlets_json as string, [] as string[]),
      titles: safeJson(c.titles_json as string, [] as { outlet: string; title: string; link: string }[]),
      summary: (c.summary as string | null) ?? null,
      gesetzbezug: !!(c.gesetzbezug as number | undefined),
      story: (c.day_count as number | null) && (c.day_count as number) > 1
        ? { tageAktiv: c.day_count as number, streak: c.streak_days as number, seit: c.first_date as string }
        : null,
      anker: c.anker_ds_nr || c.anker_poll_id != null
        ? {
            dsNr: (c.anker_ds_nr as string | null) ?? null, dsTitel: (c.anker_ds_titel as string | null) ?? null,
            pollId: (c.anker_poll_id as number | null) ?? null, pollLabel: (c.anker_poll_label as string | null) ?? null,
            begruendung: (c.anker_begruendung as string | null) ?? null,
          }
        : null,
    })),
  }));
  return { runDate: rd, felder };
}

export interface AufmacherPick {
  runDate: string; themenfeld: string; slug: string; headline: string | null; summary: string | null;
  ds: { nr: string; titel: string; datum: string | null; url: string | null } | null;
  vote: { pollId: number; label: string | null; datum: string | null; yes: number; no: number; abstain: number } | null;
  /** Quell-Artikel des gepickten News-Clusters (je Outlet einer) — bei Stories
   *  ohne Bundestags-Dokument der einzige Weg zu „worum geht's" in voller Länge.
   *  `datum` = pubdate des Artikels (ISO), per Link aus news_items nachgeschlagen. */
  quellen: { outlet: string; title: string; link: string; datum: string | null }[];
  /** Eigene Analyse-Seite (Vor-Parlaments-Analysen wie /analyse/haushalt-2027). */
  analyseUrl: string | null;
  /** „Worum es geht"-Catcher: EINE große Zahl + ein Satz (manuell kuratiert). */
  these: { wert: string; text: string } | null;
  /** Reaktionen der Fraktionen: PMs (Erstquelle, fraktion_pm), die im Zeitfenster
   *  ab Vortag des Picks Kern-Tokens der Headline tragen — max. 1 je Fraktion. */
  reaktionen: { fraktion: string; titel: string; link: string; datum: string | null }[];
}

export function getAufmacherPick(): AufmacherPick | null {
  const db = getDb();
  let row: Record<string, unknown> | undefined;
  try {
    // Verfallsregel: ein „Aufmacher des Tages" darf nicht tagelang stehen
    // bleiben, wenn niemand pickt — nach 48h verschwindet die Karte still,
    // die Startseite sieht dann aus wie ohne Aufmacher (fail-quiet).
    row = db.prepare(`SELECT * FROM aufmacher_pick WHERE aktiv=1 AND picked_at >= datetime('now','-2 days') ORDER BY picked_at DESC LIMIT 1`).get() as Record<string, unknown> | undefined;
  } catch { return null; } // Tabelle fehlt in PROD → fail-closed
  if (!row) return null;

  let ds: AufmacherPick["ds"] = null;
  if (row.ds_nr) {
    const sk = getDrucksacheSkeleton(String(row.ds_nr)); // 3-Fallback-Kette (deckt frische DIP-only-GE)
    if (sk) ds = { nr: sk.drucksache_nr, titel: sk.titel, datum: sk.datum, url: sk.pdf_url };
  }
  let vote: AufmacherPick["vote"] = null;
  if (row.poll_id != null) {
    const v = db.prepare(`
      SELECT MIN(poll_label) AS label, MIN(poll_date) AS datum,
        SUM(vote='yes') AS yes, SUM(vote='no') AS no, SUM(vote='abstain') AS abstain
      FROM votes WHERE poll_id = ?
    `).get(Number(row.poll_id)) as { label: string | null; datum: string | null; yes: number; no: number; abstain: number } | undefined;
    if (v && (v.yes || v.no || v.abstain)) vote = { pollId: Number(row.poll_id), label: v.label, datum: v.datum, yes: v.yes ?? 0, no: v.no ?? 0, abstain: v.abstain ?? 0 };
  }
  // Quell-Artikel: bevorzugt der BEIM PICK eingefrorene Stand (quellen_json) —
  // der Live-Join über (run_date, cluster_id) driftet, weil der 6h-Lauf die
  // Cluster neu schreibt und dieselbe ID danach eine andere Story sein kann.
  let quellen: AufmacherPick["quellen"] = [];
  try {
    let alle: { outlet: string; title: string; link: string }[] = [];
    if (row.quellen_json) {
      alle = JSON.parse(row.quellen_json as string) as typeof alle;
    } else if (row.cluster_id != null) {
      // Fallback für Alt-Picks ohne Snapshot (nur korrekt, solange der Lauf
      // des Pick-Tages nicht überschrieben wurde).
      const cj = db.prepare(`SELECT titles_json FROM news_cluster WHERE run_date = ? AND cluster_id = ?`)
        .get(row.run_date, Number(row.cluster_id)) as { titles_json: string | null } | undefined;
      alle = JSON.parse(cj?.titles_json ?? "[]") as typeof alle;
    }
    // Artikel-Datum per Link nachschlagen (Link ist UNIQUE in news_items und
    // driftet — anders als cluster_id — nicht).
    const datumStmt = db.prepare(`SELECT pubdate FROM news_items WHERE link = ?`);
    const gesehen = new Set<string>();
    for (const t of alle) {
      if (!t.outlet || !t.link || gesehen.has(t.outlet)) continue;
      gesehen.add(t.outlet);
      let datum: string | null = null;
      try { datum = (datumStmt.get(t.link) as { pubdate: string | null } | undefined)?.pubdate ?? null; } catch { /* Tabelle fehlt */ }
      quellen.push({ outlet: t.outlet, title: t.title, link: t.link, datum });
      if (quellen.length >= 5) break;
    }
  } catch { quellen = []; } // kaputtes JSON/Tabelle fehlt → Karte ohne Quellen

  // Reaktionen der Fraktionen — deterministisch, kein LLM: Kern-Tokens aus
  // Headline+Summary (≥5 Zeichen, plus 8-Zeichen-Stamm gegen deutsche Komposita:
  // „Haushaltsentwurf"→„haushalt" matcht „Haushalt 2027"/„Haushaltspolitik").
  // Zeitfenster ab Vortag des Picks; beste PM je Fraktion (Titel-Treffer vor
  // Text-Treffer, dann neueste). Fail-quiet: keine Treffer → leere Liste.
  let reaktionen: AufmacherPick["reaktionen"] = [];
  try {
    const STOP = new Set([
      "einer", "eines", "einem", "gegen", "nach", "wegen", "durch", "sowie", "sollen", "wollen",
      "werden", "wurde", "haben", "nicht", "trotzdem", "rund", "mehr", "viele", "unter", "über", "beim", "fokus",
      // Strukturwörter jeder Politik-Story — nie story-distinktiv, und ihre
      // 8er-Stämme über-matchen („bundeska" träfe Bundeskanzler/Bundeskasse …).
      "bundesregierung", "bundeskabinett", "bundeskanzler", "bundestag", "regierung", "kabinett",
      "koalition", "deutschland", "deutsche", "deutschen", "milliarden", "millionen", "prozent", "beschlossen",
    ]);
    const basis = `${(row.headline as string | null) ?? ""} ${(row.summary as string | null) ?? ""}`.toLowerCase();
    const toks = [...new Set((basis.match(/[a-zäöüß][a-zäöüß-]{4,}/g) ?? []).filter((w) => !STOP.has(w)))].slice(0, 12);
    const staemme = [...new Set(toks.flatMap((t) => (t.length > 8 ? [t, t.slice(0, 8)] : [t])))];
    if (staemme.length) {
      const rows2 = db.prepare(
        `SELECT fraktion, titel, link, datum, substr(COALESCE(text,''),1,4000) AS text
         FROM fraktion_pm WHERE datum >= date(?, '-1 day') ORDER BY datum DESC`
      ).all(row.run_date) as { fraktion: string; titel: string; link: string; datum: string | null; text: string }[];
      const beste = new Map<string, { score: number; pm: (typeof rows2)[0] }>();
      for (const pm of rows2) {
        const t = pm.titel.toLowerCase(), x = pm.text.toLowerCase();
        const score = staemme.some((s) => t.includes(s)) ? 2 : staemme.some((s) => x.includes(s)) ? 1 : 0;
        if (!score) continue;
        const cur = beste.get(pm.fraktion);
        if (!cur || score > cur.score) beste.set(pm.fraktion, { score, pm });
      }
      const REIHENFOLGE = ["CDU/CSU", "AfD", "SPD", "GRÜNE", "LINKE"]; // Fraktionsstärke
      reaktionen = REIHENFOLGE.filter((f) => beste.has(f)).map((f) => {
        const { pm } = beste.get(f)!;
        return { fraktion: f, titel: pm.titel, link: pm.link, datum: pm.datum };
      });

      // Regierungs-Seite (Rechtfertigung): jüngste Pressekonferenz, deren
      // Themenliste einen Kern-Token trägt — vorangestellt, denn sie ist die
      // handelnde Seite, auf die die Fraktionen reagieren.
      try {
        const pks = db.prepare(
          `SELECT titel, link, datum, COALESCE(themen_json,'[]') AS themen, substr(COALESCE(text,''),1,6000) AS kopf
           FROM regierung_pk WHERE datum >= date(?, '-1 day') ORDER BY datum DESC`
        ).all(row.run_date) as { titel: string; link: string; datum: string | null; themen: string; kopf: string }[];
        for (const pk of pks) {
          const themen = (JSON.parse(pk.themen) as string[]);
          // Fürs BENENNEN des Themas nur Voll-Tokens (Stämme sind zum Finden ok,
          // aber zu grob, um ein Thema auszuweisen).
          const thema = themen.find((t) => toks.some((tok) => t.toLowerCase().includes(tok)))
            ?? themen.find((t) => staemme.some((s) => t.toLowerCase().includes(s)));
          if (!thema && !staemme.some((s) => pk.kopf.toLowerCase().includes(s))) continue;
          reaktionen.unshift({
            fraktion: "Bundesregierung",
            titel: thema ? `${pk.titel} — u.a. „${thema}"` : pk.titel,
            link: pk.link, datum: pk.datum,
          });
          break; // nur die jüngste passende PK
        }
      } catch { /* regierung_pk fehlt → nur Fraktionen */ }
    }
  } catch { reaktionen = []; } // Tabelle fehlt → Karte ohne Reaktions-Band

  return {
    runDate: row.run_date as string, themenfeld: row.themenfeld as string, slug: row.slug as string,
    headline: (row.headline as string | null) ?? null, summary: (row.summary as string | null) ?? null,
    ds, vote, quellen, analyseUrl: (row.analyse_url as string | null) ?? null,
    these: row.these_wert && row.these_text ? { wert: row.these_wert as string, text: row.these_text as string } : null,
    reaktionen,
  };
}

// ── Salienz-Trends: was kommt über die Zeit häufig — Fokus Gesetze/Reformen ──
export interface TrendFeld { themenfeld: string; slug: string | null; tageAktiv: number; tageGesetz: number; gesetzCluster: number; }
export interface GesetzStory { runDate: string; themenfeld: string; slug: string | null; leitthema: string; outletCount: number; summary: string | null; outlets: string[]; }

export function getSalienzTrends(tage = 30): { tage: number; seit: string; gesetzStories: GesetzStory[]; felder: TrendFeld[] } | null {
  const db = getDb();
  const seit = new Date(Date.now() - tage * 86400000).toISOString().slice(0, 10);
  try {
    const felder = db.prepare(`
      SELECT nc.themenfeld AS themenfeld,
             COUNT(DISTINCT nc.run_date) AS tageAktiv,
             COUNT(DISTINCT CASE WHEN nc.gesetzbezug=1 THEN nc.run_date END) AS tageGesetz,
             SUM(nc.gesetzbezug) AS gesetzCluster,
             (SELECT st.slug FROM salienz_themen st WHERE st.themenfeld = nc.themenfeld LIMIT 1) AS slug
      FROM news_cluster nc
      WHERE nc.run_date >= ? AND nc.outlet_count >= 2
      GROUP BY nc.themenfeld
      ORDER BY tageGesetz DESC, gesetzCluster DESC, tageAktiv DESC
    `).all(seit) as { themenfeld: string; tageAktiv: number; tageGesetz: number; gesetzCluster: number; slug: string | null }[];

    const stories = db.prepare(`
      SELECT nc.run_date AS runDate, nc.themenfeld AS themenfeld, nc.leitthema AS leitthema,
             nc.outlet_count AS outletCount, nc.summary AS summary, nc.outlets_json AS outlets_json,
             (SELECT st.slug FROM salienz_themen st WHERE st.themenfeld = nc.themenfeld LIMIT 1) AS slug
      FROM news_cluster nc
      WHERE nc.gesetzbezug=1 AND nc.run_date >= ? AND nc.outlet_count >= 2
      ORDER BY nc.run_date DESC, nc.outlet_count DESC
      LIMIT 80
    `).all(seit) as { runDate: string; themenfeld: string; leitthema: string; outletCount: number; summary: string | null; outlets_json: string; slug: string | null }[];

    return {
      tage, seit,
      felder: felder.map((f) => ({ themenfeld: f.themenfeld, slug: f.slug, tageAktiv: f.tageAktiv, tageGesetz: f.tageGesetz, gesetzCluster: f.gesetzCluster })),
      gesetzStories: stories.map((s) => ({ runDate: s.runDate, themenfeld: s.themenfeld, slug: s.slug, leitthema: s.leitthema, outletCount: s.outletCount, summary: s.summary, outlets: safeJson(s.outlets_json, [] as string[]) })),
    };
  } catch { return null; } // Tabelle/Spalte fehlt → fail-closed
}

// ── Kommissionen-Tracker (rein lesend; Schema legt scripts/_lib/kommissionen-schema.ts an) ──
export interface KommissionBerichtView {
  titel: string | null; datum: string | null; url: string; quelle: string;
  typ: string | null; pdfVorhanden: boolean; pages: number | null;
}
export interface KommissionNewsSignal { newsItemId: number; title: string; link: string; signal: string | null; runDate: string; }
export interface KommissionView {
  slug: string; name: string; kurzname: string | null; ministerium: string | null;
  tier: number; thema: string | null; quelleUrl: string | null; pollUrl: string | null;
  cadence: string | null; nextExpected: string | null; status: string | null;
  letzterBerichtUrl: string | null; notiz: string | null;
  neuesterBericht: KommissionBerichtView | null;
  juengsteSignale: KommissionNewsSignal[];
  hatAnalyse: boolean;
}

export function getKommissionenTracker(): { tier1: KommissionView[]; tier2: KommissionView[] } | null {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT slug, name, kurzname, ministerium, tier, thema, quelle_url, poll_url,
             cadence, next_expected, status, letzter_bericht_url, notiz
      FROM kommission
      ORDER BY tier ASC, name COLLATE NOCASE
    `).all() as Record<string, unknown>[];
    if (rows.length === 0) return null;

    const berStmt = db.prepare(`
      SELECT titel, datum, url, quelle, typ, pdf_path, pages FROM kommission_bericht
      WHERE kommission_slug = ?
      ORDER BY (datum IS NULL), datum DESC, id DESC LIMIT 1
    `);
    const sigStmt = db.prepare(`
      SELECT n.news_item_id, n.signal, n.run_date, i.title, i.link
      FROM kommission_news n JOIN news_items i ON i.id = n.news_item_id
      WHERE n.kommission_slug = ?
      ORDER BY n.run_date DESC, n.news_item_id DESC LIMIT 5
    `);
    const anaStmt = db.prepare(`SELECT 1 FROM kommission_bericht_analyse WHERE kommission_slug = ? LIMIT 1`);

    const map = (r: Record<string, unknown>): KommissionView => {
      const slug = r.slug as string;
      const b = berStmt.get(slug) as Record<string, unknown> | undefined;
      const sigs = sigStmt.all(slug) as Record<string, unknown>[];
      return {
        slug,
        name: r.name as string,
        kurzname: (r.kurzname as string | null) ?? null,
        ministerium: (r.ministerium as string | null) ?? null,
        tier: r.tier as number,
        thema: (r.thema as string | null) ?? null,
        quelleUrl: (r.quelle_url as string | null) ?? null,
        pollUrl: (r.poll_url as string | null) ?? null,
        cadence: (r.cadence as string | null) ?? null,
        nextExpected: (r.next_expected as string | null) ?? null,
        status: (r.status as string | null) ?? null,
        letzterBerichtUrl: (r.letzter_bericht_url as string | null) ?? null,
        notiz: (r.notiz as string | null) ?? null,
        neuesterBericht: b ? {
          titel: (b.titel as string | null) ?? null,
          datum: (b.datum as string | null) ?? null,
          url: b.url as string,
          quelle: b.quelle as string,
          typ: (b.typ as string | null) ?? null,
          pdfVorhanden: !!(b.pdf_path as string | null),
          pages: (b.pages as number | null) ?? null,
        } : null,
        juengsteSignale: sigs.map((s) => ({
          newsItemId: s.news_item_id as number,
          title: s.title as string,
          link: s.link as string,
          signal: (s.signal as string | null) ?? null,
          runDate: s.run_date as string,
        })),
        hatAnalyse: !!anaStmt.get(slug),
      };
    };

    const views = rows.map(map);
    return {
      tier1: views.filter((v) => v.tier === 1),
      tier2: views.filter((v) => v.tier !== 1),
    };
  } catch { return null; } // Tabelle/Spalte fehlt → fail-closed
}

// Alle Berichte je Kommission — flache Übersicht für /kommissionen/berichte.
export interface KommissionsberichtItem {
  id: number; titel: string | null; typ: string | null; datum: string | null;
  url: string | null; pages: number | null; hatVolltext: boolean; istLeitbericht: boolean;
}
export interface KommissionMitBerichten {
  slug: string; name: string; kurzname: string | null; ministerium: string | null;
  tier: number; hatAnalyse: boolean; berichte: KommissionsberichtItem[];
}
export function getAlleKommissionsberichte(): { gremien: KommissionMitBerichten[]; totalBerichte: number } | null {
  const db = getDb();
  try {
    const kom = db.prepare(`
      SELECT slug, name, kurzname, ministerium, tier FROM kommission
      ORDER BY tier ASC, name COLLATE NOCASE
    `).all() as Record<string, unknown>[];
    if (kom.length === 0) return null;
    const berStmt = db.prepare(`
      SELECT id, titel, typ, datum, url, pages, (full_text IS NOT NULL AND full_text <> '') AS ft
      FROM kommission_bericht WHERE kommission_slug = ?
      ORDER BY (datum IS NULL), datum DESC, id DESC
    `);
    const leitStmt = db.prepare(`SELECT bericht_id FROM kommission_bericht_analyse WHERE kommission_slug = ?`);
    let total = 0;
    const gremien: KommissionMitBerichten[] = kom.map((k) => {
      const slug = k.slug as string;
      const leitIds = new Set((leitStmt.all(slug) as Record<string, unknown>[]).map((r) => r.bericht_id as number));
      const berichte = (berStmt.all(slug) as Record<string, unknown>[]).map((b) => ({
        id: b.id as number,
        titel: (b.titel as string | null) ?? null,
        typ: (b.typ as string | null) ?? null,
        datum: (b.datum as string | null) ?? null,
        url: (b.url as string | null) ?? null,
        pages: (b.pages as number | null) ?? null,
        hatVolltext: !!(b.ft as number),
        istLeitbericht: leitIds.has(b.id as number),
      }));
      total += berichte.length;
      return {
        slug, name: k.name as string,
        kurzname: (k.kurzname as string | null) ?? null,
        ministerium: (k.ministerium as string | null) ?? null,
        tier: k.tier as number,
        hatAnalyse: leitIds.size > 0,
        berichte,
      };
    }).filter((g) => g.berichte.length > 0);
    return { gremien, totalBerichte: total };
  } catch { return null; } // fail-closed
}

// Detail: manuelle Analyse eines Kommissions-Leitberichts (kommission_bericht_analyse).
export interface KommissionAnalysePunkt { nr?: number; kapitel?: string; thema?: string; massnahme: string; gruppe?: string; umsetzbarkeit?: string; art?: string; impact?: string; }
export interface KommissionKennzahl { label: string; wert: string; }
/** Schema-freier Kernbefund: „wichtigster/schwerwiegendster Punkt + wen es trifft", nach Schwere sortiert. */
export interface KommissionKernbefund { titel: string; text: string; betrifft?: string; schwere?: "hoch" | "mittel" | "gering"; }
/** Aufschlüsselung, wofür Geld/Mittel gebraucht werden — als Balken (anteil 0–100). */
export interface KommissionVerwendung { titel?: string; zeitraum?: string; gesamt?: string; posten: { label: string; wert: string; anteil?: number }[]; }
export interface KommissionMitglied { name: string; funktion: string; partei?: string; politikerId?: number; wikipedia?: string; }
export interface KommissionMitglieder {
  anzahl: number;            // stimmberechtigte Mitglieder
  zusammensetzung: string;   // eine Zeile: „8 Wissenschaft · 3 Politik … · 2 Vorsitz"
  merkmale: string[];        // neutrale Unabhängigkeits-Fakten (weisungsfrei, intern uneinig …)
  gruppen: { rolle: string; personen: KommissionMitglied[] }[];
  beratend?: KommissionMitglied[];
}
export interface KommissionAnalyse {
  slug: string; name: string; kurzname: string | null; ministerium: string | null; thema: string | null; quelleUrl: string | null;
  bericht: { titel: string | null; datum: string | null; typ: string | null; pages: number | null; url: string; pdfVorhanden: boolean } | null;
  auftrag: string | null; gesamttenor: string | null; seiten: string | null; analysiertAm: string | null;
  kennzahlen: KommissionKennzahl[]; eckpunkte: string[];
  kernpunkte: KommissionAnalysePunkt[];
  kernbefunde: KommissionKernbefund[];
  verwendung: KommissionVerwendung | null;
  mitglieder: KommissionMitglieder | null;
}

export function getKommissionAnalyse(slug: string): KommissionAnalyse | null {
  const db = getDb();
  try {
    const k = db.prepare(`SELECT slug, name, kurzname, ministerium, thema, quelle_url FROM kommission WHERE slug = ?`).get(slug) as Record<string, unknown> | undefined;
    if (!k) return null;
    const a = db.prepare(`
      SELECT a.auftrag, a.kernpunkte_json, a.gesamttenor, a.seiten, a.analysiert_am,
             a.kennzahlen_json, a.eckpunkte_json, a.mitglieder_json, a.kernbefunde_json, a.verwendung_json,
             b.titel, b.datum, b.typ, b.pages, b.url, b.pdf_path
      FROM kommission_bericht_analyse a JOIN kommission_bericht b ON b.id = a.bericht_id
      WHERE a.kommission_slug = ? ORDER BY a.analysiert_am DESC LIMIT 1
    `).get(slug) as Record<string, unknown> | undefined;
    return {
      slug: k.slug as string, name: k.name as string, kurzname: (k.kurzname as string | null) ?? null,
      ministerium: (k.ministerium as string | null) ?? null, thema: (k.thema as string | null) ?? null,
      quelleUrl: (k.quelle_url as string | null) ?? null,
      bericht: a ? { titel: (a.titel as string | null) ?? null, datum: (a.datum as string | null) ?? null, typ: (a.typ as string | null) ?? null, pages: (a.pages as number | null) ?? null, url: a.url as string, pdfVorhanden: !!(a.pdf_path as string | null) } : null,
      auftrag: a ? ((a.auftrag as string | null) ?? null) : null,
      gesamttenor: a ? ((a.gesamttenor as string | null) ?? null) : null,
      seiten: a ? ((a.seiten as string | null) ?? null) : null,
      analysiertAm: a ? ((a.analysiert_am as string | null) ?? null) : null,
      kennzahlen: a ? safeJson<KommissionKennzahl[]>(a.kennzahlen_json as string, []) : [],
      eckpunkte: a ? safeJson<string[]>(a.eckpunkte_json as string, []) : [],
      kernpunkte: a ? safeJson<KommissionAnalysePunkt[]>(a.kernpunkte_json as string, []) : [],
      kernbefunde: a ? safeJson<KommissionKernbefund[]>(a.kernbefunde_json as string, []) : [],
      verwendung: a && a.verwendung_json ? safeJson<KommissionVerwendung | null>(a.verwendung_json as string, null) : null,
      mitglieder: a && a.mitglieder_json ? safeJson<KommissionMitglieder | null>(a.mitglieder_json as string, null) : null,
    };
  } catch { return null; }
}
