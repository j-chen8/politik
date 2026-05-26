import type { getDb } from "@/lib/db";

type Db = ReturnType<typeof getDb>;

const SPEECH_FTS_TABLE = "speeches_fts";
const ACTIVITIES_FTS_TABLE = "activities_fts";
const DRUCKSACHEN_FTS_TABLE = "drucksachen_fts";
// Berlin-Pilot: eigene FTS5-Tabellen für scope-trennende Suche.
const BERLIN_SPEECH_FTS_TABLE = "berlin_speeches_fts";
const BERLIN_DRUCKSACHEN_FTS_TABLE = "berlin_drucksachen_fts";

/**
 * FTS5-Virtuelle-Tabellen für speech_analyses_v2.zusammenfassung_2_saetze und
 * activities.titel. Beide nutzen unicode61-Tokenizer mit Diacritic-Removal,
 * d.h. „ÖPNV" matched „opnv" und „Müller" matched „muller" out-of-the-box.
 *
 * **Track-Isolation:** Diese Datei berührt `db.ts` nicht. Die FTS-Tabellen sind
 * separate virtuelle Tabellen und ändern bestehende Schemas nicht.
 *
 * **Sync-Strategie (Spike):** Initial-Build beim ersten Aufruf, wenn die
 * FTS-Tabelle leer ist. Kein automatisches Sync bei neuen Reden — nach
 * Pipeline-Runs muss `rebuildSearchFTS(db)` manuell aufgerufen werden.
 */
export function ensureSearchFTS(db: Db): void {
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ${SPEECH_FTS_TABLE} USING fts5(
      snippet,
      rede_id UNINDEXED,
      speech_id UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 2'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS ${ACTIVITIES_FTS_TABLE} USING fts5(
      titel,
      activity_id UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 2'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS ${DRUCKSACHEN_FTS_TABLE} USING fts5(
      drucksache_nr UNINDEXED,
      titel,
      zusammenfassung,
      kerninhalt,
      thema_tags,
      tokenize = 'unicode61 remove_diacritics 2'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS ${BERLIN_SPEECH_FTS_TABLE} USING fts5(
      snippet,
      speech_id UNINDEXED,
      politician_id UNINDEXED,
      datum UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 2'
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS ${BERLIN_DRUCKSACHEN_FTS_TABLE} USING fts5(
      dbid UNINDEXED,
      klasse UNINDEXED,
      titel,
      zusammenfassung,
      kerninhalt,
      thema_tags,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `);

  const speechCount = (db.prepare(`SELECT COUNT(*) as n FROM ${SPEECH_FTS_TABLE}`).get() as {
    n: number;
  }).n;
  if (speechCount === 0) buildSpeechFTS(db);

  const activitiesCount = (db
    .prepare(`SELECT COUNT(*) as n FROM ${ACTIVITIES_FTS_TABLE}`)
    .get() as { n: number }).n;
  if (activitiesCount === 0) buildActivitiesFTS(db);

  const drucksachenCount = (db
    .prepare(`SELECT COUNT(*) as n FROM ${DRUCKSACHEN_FTS_TABLE}`)
    .get() as { n: number }).n;
  if (drucksachenCount === 0) buildDrucksachenFTS(db);

  // Berlin-Pilot
  try {
    const berlinSpeechCount = (db
      .prepare(`SELECT COUNT(*) as n FROM ${BERLIN_SPEECH_FTS_TABLE}`)
      .get() as { n: number }).n;
    if (berlinSpeechCount === 0) buildBerlinSpeechFTS(db);
  } catch { /* berlin_speeches evtl. nicht da */ }
  try {
    const berlinDsCount = (db
      .prepare(`SELECT COUNT(*) as n FROM ${BERLIN_DRUCKSACHEN_FTS_TABLE}`)
      .get() as { n: number }).n;
    if (berlinDsCount === 0) buildBerlinDrucksachenFTS(db);
  } catch { /* berlin_drucksachen_analyses evtl. nicht da */ }

  // Auto-Sync via Triggers — persistent in DB, läuft auch nach Server-Restart.
  // Bei INSERT/UPDATE/DELETE in den Source-Tabellen wird FTS automatisch aktuell gehalten.
  ensureSyncTriggers(db);
}

function ensureSyncTriggers(db: Db): void {
  db.exec(`
    -- speech_analyses_v2 → speeches_fts

    CREATE TRIGGER IF NOT EXISTS speech_analyses_v2_ai
    AFTER INSERT ON speech_analyses_v2
    BEGIN
      INSERT INTO ${SPEECH_FTS_TABLE} (snippet, rede_id, speech_id)
      SELECT new.zusammenfassung_2_saetze, new.rede_id, new.speech_id
      WHERE new.zusammenfassung_2_saetze IS NOT NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS speech_analyses_v2_au
    AFTER UPDATE OF zusammenfassung_2_saetze, rede_id, speech_id ON speech_analyses_v2
    BEGIN
      DELETE FROM ${SPEECH_FTS_TABLE} WHERE speech_id = old.speech_id;
      INSERT INTO ${SPEECH_FTS_TABLE} (snippet, rede_id, speech_id)
      SELECT new.zusammenfassung_2_saetze, new.rede_id, new.speech_id
      WHERE new.zusammenfassung_2_saetze IS NOT NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS speech_analyses_v2_ad
    AFTER DELETE ON speech_analyses_v2
    BEGIN
      DELETE FROM ${SPEECH_FTS_TABLE} WHERE speech_id = old.speech_id;
    END;

    -- activities → activities_fts (nur wenn drucksache_nr nicht null)

    CREATE TRIGGER IF NOT EXISTS activities_ai
    AFTER INSERT ON activities
    BEGIN
      INSERT INTO ${ACTIVITIES_FTS_TABLE} (titel, activity_id)
      SELECT new.titel, new.id
      WHERE new.titel IS NOT NULL AND new.drucksache_nr IS NOT NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS activities_au
    AFTER UPDATE OF titel, drucksache_nr ON activities
    BEGIN
      DELETE FROM ${ACTIVITIES_FTS_TABLE} WHERE activity_id = old.id;
      INSERT INTO ${ACTIVITIES_FTS_TABLE} (titel, activity_id)
      SELECT new.titel, new.id
      WHERE new.titel IS NOT NULL AND new.drucksache_nr IS NOT NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS activities_ad
    AFTER DELETE ON activities
    BEGIN
      DELETE FROM ${ACTIVITIES_FTS_TABLE} WHERE activity_id = old.id;
    END;

    -- drucksache_analyses → drucksachen_fts
    -- Titel kommt aus activities.thema (echter DS-Titel), kerninhalt-Array
    -- wird vor INSERT zu Plain-Text zusammengefügt.

    CREATE TRIGGER IF NOT EXISTS drucksache_analyses_ai
    AFTER INSERT ON drucksache_analyses
    BEGIN
      DELETE FROM ${DRUCKSACHEN_FTS_TABLE} WHERE drucksache_nr = new.drucksache_nr;
      INSERT INTO ${DRUCKSACHEN_FTS_TABLE} (drucksache_nr, titel, zusammenfassung, kerninhalt, thema_tags)
      SELECT new.drucksache_nr,
             COALESCE((SELECT thema FROM activities WHERE drucksache_nr=new.drucksache_nr AND thema IS NOT NULL LIMIT 1), ''),
             COALESCE(new.zusammenfassung, ''),
             COALESCE(REPLACE(REPLACE(REPLACE(new.kerninhalt, '[', ''), ']', ''), '","', ' · '), ''),
             COALESCE(new.thema, '')
      WHERE new.analyze_error IS NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS drucksache_analyses_au
    AFTER UPDATE OF zusammenfassung, kerninhalt, thema, analyze_error ON drucksache_analyses
    BEGIN
      DELETE FROM ${DRUCKSACHEN_FTS_TABLE} WHERE drucksache_nr = old.drucksache_nr;
      INSERT INTO ${DRUCKSACHEN_FTS_TABLE} (drucksache_nr, titel, zusammenfassung, kerninhalt, thema_tags)
      SELECT new.drucksache_nr,
             COALESCE((SELECT thema FROM activities WHERE drucksache_nr=new.drucksache_nr AND thema IS NOT NULL LIMIT 1), ''),
             COALESCE(new.zusammenfassung, ''),
             COALESCE(REPLACE(REPLACE(REPLACE(new.kerninhalt, '[', ''), ']', ''), '","', ' · '), ''),
             COALESCE(new.thema, '')
      WHERE new.analyze_error IS NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS drucksache_analyses_ad
    AFTER DELETE ON drucksache_analyses
    BEGIN
      DELETE FROM ${DRUCKSACHEN_FTS_TABLE} WHERE drucksache_nr = old.drucksache_nr;
    END;

    -- berlin_speech_analyses → berlin_speeches_fts

    CREATE TRIGGER IF NOT EXISTS berlin_speech_analyses_ai
    AFTER INSERT ON berlin_speech_analyses
    BEGIN
      DELETE FROM ${BERLIN_SPEECH_FTS_TABLE} WHERE speech_id = new.speech_id;
      INSERT INTO ${BERLIN_SPEECH_FTS_TABLE} (snippet, speech_id, politician_id, datum)
      SELECT
        COALESCE(new.zusammenfassung_2_saetze, substr(bs.text, 1, 400)),
        bs.speech_id,
        bs.politician_id,
        bs.datum
      FROM berlin_speeches bs
      WHERE bs.speech_id = new.speech_id;
    END;

    CREATE TRIGGER IF NOT EXISTS berlin_speech_analyses_au
    AFTER UPDATE OF zusammenfassung ON berlin_speech_analyses
    BEGIN
      DELETE FROM ${BERLIN_SPEECH_FTS_TABLE} WHERE speech_id = new.speech_id;
      INSERT INTO ${BERLIN_SPEECH_FTS_TABLE} (snippet, speech_id, politician_id, datum)
      SELECT
        COALESCE(new.zusammenfassung_2_saetze, substr(bs.text, 1, 400)),
        bs.speech_id,
        bs.politician_id,
        bs.datum
      FROM berlin_speeches bs
      WHERE bs.speech_id = new.speech_id;
    END;

    -- berlin_drucksachen_analyses → berlin_drucksachen_fts

    CREATE TRIGGER IF NOT EXISTS berlin_drucksachen_analyses_ai
    AFTER INSERT ON berlin_drucksachen_analyses
    BEGIN
      DELETE FROM ${BERLIN_DRUCKSACHEN_FTS_TABLE} WHERE dbid = new.dbid;
      INSERT INTO ${BERLIN_DRUCKSACHEN_FTS_TABLE} (dbid, klasse, titel, zusammenfassung, kerninhalt, thema_tags)
      SELECT
        new.dbid, new.klasse,
        COALESCE((SELECT titel FROM berlin_documents WHERE dbid=new.dbid), ''),
        COALESCE(new.zusammenfassung, ''),
        COALESCE(REPLACE(REPLACE(REPLACE(COALESCE(new.kerninhalt_json, '') || ' · ' || COALESCE(new.kerninhalt_frage_json, '') || ' · ' || COALESCE(new.kerninhalt_antwort_json, ''), '[', ''), ']', ''), '","', ' · '), ''),
        COALESCE(REPLACE(REPLACE(REPLACE(new.thema_json, '[', ''), ']', ''), '","', ' · '), '')
      WHERE new.error_type IS NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS berlin_drucksachen_analyses_au
    AFTER UPDATE OF zusammenfassung, kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json, thema_json, error_type ON berlin_drucksachen_analyses
    BEGIN
      DELETE FROM ${BERLIN_DRUCKSACHEN_FTS_TABLE} WHERE dbid = new.dbid;
      INSERT INTO ${BERLIN_DRUCKSACHEN_FTS_TABLE} (dbid, klasse, titel, zusammenfassung, kerninhalt, thema_tags)
      SELECT
        new.dbid, new.klasse,
        COALESCE((SELECT titel FROM berlin_documents WHERE dbid=new.dbid), ''),
        COALESCE(new.zusammenfassung, ''),
        COALESCE(REPLACE(REPLACE(REPLACE(COALESCE(new.kerninhalt_json, '') || ' · ' || COALESCE(new.kerninhalt_frage_json, '') || ' · ' || COALESCE(new.kerninhalt_antwort_json, ''), '[', ''), ']', ''), '","', ' · '), ''),
        COALESCE(REPLACE(REPLACE(REPLACE(new.thema_json, '[', ''), ']', ''), '","', ' · '), '')
      WHERE new.error_type IS NULL;
    END;

    CREATE TRIGGER IF NOT EXISTS berlin_drucksachen_analyses_ad
    AFTER DELETE ON berlin_drucksachen_analyses
    BEGIN
      DELETE FROM ${BERLIN_DRUCKSACHEN_FTS_TABLE} WHERE dbid = old.dbid;
    END;
  `);
}

function buildSpeechFTS(db: Db): void {
  db.exec(`
    INSERT INTO ${SPEECH_FTS_TABLE} (snippet, rede_id, speech_id)
    SELECT zusammenfassung_2_saetze, rede_id, speech_id
    FROM speech_analyses_v2
    WHERE zusammenfassung_2_saetze IS NOT NULL
  `);
}

function buildActivitiesFTS(db: Db): void {
  db.exec(`
    INSERT INTO ${ACTIVITIES_FTS_TABLE} (titel, activity_id)
    SELECT titel, id
    FROM activities
    WHERE titel IS NOT NULL AND drucksache_nr IS NOT NULL
  `);
}

function buildDrucksachenFTS(db: Db): void {
  // Bulk-Build aus drucksache_analyses + activities.thema (echter DS-Titel)
  db.exec(`
    INSERT INTO ${DRUCKSACHEN_FTS_TABLE} (drucksache_nr, titel, zusammenfassung, kerninhalt, thema_tags)
    SELECT
      a.drucksache_nr,
      COALESCE((SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL LIMIT 1), ''),
      COALESCE(a.zusammenfassung, ''),
      COALESCE(REPLACE(REPLACE(REPLACE(a.kerninhalt, '[', ''), ']', ''), '","', ' · '), ''),
      COALESCE(a.thema, '')
    FROM drucksache_analyses a
    WHERE a.analyze_error IS NULL
  `);
}

function buildBerlinSpeechFTS(db: Db): void {
  // Berlin-Reden: zusammenfassung aus berlin_speech_analyses (LLM-Output) joined mit politician_id
  db.exec(`
    INSERT INTO ${BERLIN_SPEECH_FTS_TABLE} (snippet, speech_id, politician_id, datum)
    SELECT
      COALESCE(bsa.zusammenfassung_2_saetze, substr(bs.text, 1, 400)),
      bs.speech_id,
      bs.politician_id,
      bs.datum
    FROM berlin_speeches bs
    LEFT JOIN berlin_speech_analyses bsa ON bsa.speech_id = bs.speech_id
    WHERE (bsa.zusammenfassung_2_saetze IS NOT NULL AND bsa.zusammenfassung_2_saetze != '')
       OR (bs.text IS NOT NULL AND bs.text != '')
  `);
}

function buildBerlinDrucksachenFTS(db: Db): void {
  // Berlin-DS: kombiniert kerninhalt_json + kerninhalt_frage_json + kerninhalt_antwort_json
  db.exec(`
    INSERT INTO ${BERLIN_DRUCKSACHEN_FTS_TABLE} (dbid, klasse, titel, zusammenfassung, kerninhalt, thema_tags)
    SELECT
      bda.dbid,
      bda.klasse,
      COALESCE(bd.titel, ''),
      COALESCE(bda.zusammenfassung, ''),
      COALESCE(
        REPLACE(REPLACE(REPLACE(COALESCE(bda.kerninhalt_json, '') || ' · ' || COALESCE(bda.kerninhalt_frage_json, '') || ' · ' || COALESCE(bda.kerninhalt_antwort_json, ''), '[', ''), ']', ''), '","', ' · '),
        ''
      ),
      COALESCE(REPLACE(REPLACE(REPLACE(bda.thema_json, '[', ''), ']', ''), '","', ' · '), '')
    FROM berlin_drucksachen_analyses bda
    LEFT JOIN berlin_documents bd ON bd.dbid = bda.dbid
    WHERE bda.error_type IS NULL
  `);
}

/**
 * Drops und rebuilds beide FTS-Tabellen. Nach Reden- oder Drucksachen-
 * Pipeline-Runs aufrufen. Idempotent.
 */
export function rebuildSearchFTS(db: Db): void {
  db.exec(`
    DROP TABLE IF EXISTS ${SPEECH_FTS_TABLE};
    DROP TABLE IF EXISTS ${ACTIVITIES_FTS_TABLE};
    DROP TABLE IF EXISTS ${DRUCKSACHEN_FTS_TABLE};
    DROP TABLE IF EXISTS ${BERLIN_SPEECH_FTS_TABLE};
    DROP TABLE IF EXISTS ${BERLIN_DRUCKSACHEN_FTS_TABLE};
  `);
  ensureSearchFTS(db);
}

/**
 * Baut einen FTS5-MATCH-String aus einer Term-Liste mit Prefix-Matching:
 * jedes Token wird gequotet UND mit `*` versehen, sodass „bundeswehr"
 * auch „bundeswehrnachschub" findet — damit kommen wir näher an die
 * Substring-Semantik des alten LIKE-Pfads heran.
 *
 * FTS5-Syntax: `"phrase"*` ist legal (Prefix-Phrase). Bei einzelnen
 * Tokens entspricht das `token*`.
 *
 * Leere oder zu kurze Terms (<2 Zeichen) werden gefiltert.
 */
export function ftsMatchClause(terms: string[]): string | null {
  const cleaned = Array.from(
    new Set(
      terms
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length >= 2)
    )
  );
  if (cleaned.length === 0) return null;
  return cleaned
    .map((t) => {
      // FTS5: " innerhalb von Phrase muss doppelt sein
      const safe = t.replace(/"/g, '""');
      return `"${safe}"*`;
    })
    .join(" OR ");
}

export const FTS_TABLES = {
  speeches: SPEECH_FTS_TABLE,
  activities: ACTIVITIES_FTS_TABLE,
  drucksachen: DRUCKSACHEN_FTS_TABLE,
  berlinSpeeches: BERLIN_SPEECH_FTS_TABLE,
  berlinDrucksachen: BERLIN_DRUCKSACHEN_FTS_TABLE,
} as const;
