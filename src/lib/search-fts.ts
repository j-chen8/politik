import type { getDb } from "@/lib/db";

type Db = ReturnType<typeof getDb>;

const SPEECH_FTS_TABLE = "speeches_fts";
const ACTIVITIES_FTS_TABLE = "activities_fts";
const DRUCKSACHEN_FTS_TABLE = "drucksachen_fts";
const QA_FTS_TABLE = "qa_fts";

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
    CREATE VIRTUAL TABLE IF NOT EXISTS ${QA_FTS_TABLE} USING fts5(
      frage_text,
      antwort_text,
      fragesteller_name,
      pair_id UNINDEXED,
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

  const qaCount = (db
    .prepare(`SELECT COUNT(*) as n FROM ${QA_FTS_TABLE}`)
    .get() as { n: number }).n;
  if (qaCount === 0) buildQaFTS(db);

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

    -- drucksache_qa_paare → qa_fts (einzelne Schriftliche-Fragen-Q&A-Paare)

    CREATE TRIGGER IF NOT EXISTS qa_paare_ai
    AFTER INSERT ON drucksache_qa_paare
    BEGIN
      INSERT INTO ${QA_FTS_TABLE} (frage_text, antwort_text, fragesteller_name, pair_id)
      VALUES (COALESCE(new.frage_text, ''), COALESCE(new.antwort_text, ''), COALESCE(new.fragesteller_name, ''), new.id);
    END;

    CREATE TRIGGER IF NOT EXISTS qa_paare_au
    AFTER UPDATE OF frage_text, antwort_text, fragesteller_name ON drucksache_qa_paare
    BEGIN
      DELETE FROM ${QA_FTS_TABLE} WHERE pair_id = old.id;
      INSERT INTO ${QA_FTS_TABLE} (frage_text, antwort_text, fragesteller_name, pair_id)
      VALUES (COALESCE(new.frage_text, ''), COALESCE(new.antwort_text, ''), COALESCE(new.fragesteller_name, ''), new.id);
    END;

    CREATE TRIGGER IF NOT EXISTS qa_paare_ad
    AFTER DELETE ON drucksache_qa_paare
    BEGIN
      DELETE FROM ${QA_FTS_TABLE} WHERE pair_id = old.id;
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

function buildQaFTS(db: Db): void {
  db.exec(`
    INSERT INTO ${QA_FTS_TABLE} (frage_text, antwort_text, fragesteller_name, pair_id)
    SELECT COALESCE(frage_text, ''), COALESCE(antwort_text, ''), COALESCE(fragesteller_name, ''), id
    FROM drucksache_qa_paare
  `);
}

/**
 * Drops und rebuilds alle FTS-Tabellen. Nach Reden-, Drucksachen- oder
 * Q&A-Pipeline-Runs aufrufen. Idempotent.
 */
export function rebuildSearchFTS(db: Db): void {
  db.exec(`
    DROP TABLE IF EXISTS ${SPEECH_FTS_TABLE};
    DROP TABLE IF EXISTS ${ACTIVITIES_FTS_TABLE};
    DROP TABLE IF EXISTS ${DRUCKSACHEN_FTS_TABLE};
    DROP TABLE IF EXISTS ${QA_FTS_TABLE};
  `);
  ensureSearchFTS(db);
}

/**
 * Baut einen FTS5-MATCH-String aus einer Term-Liste mit Prefix-Matching:
 * längere Tokens werden mit `*` versehen, sodass „bundeswehr" auch
 * „bundeswehrnachschub" findet — damit kommen wir näher an die
 * Substring-Semantik des alten LIKE-Pfads heran.
 *
 * Prefix-`*` NUR ab 4 Zeichen. Kurze Tokens (z.B. „ki", „ai", „eu", „co2")
 * werden exakt gematcht — sonst matcht `"ki"*` jedes Wort, das mit „ki"
 * beginnt (Kind, Kita, der Name „Kiesewetter" …) und flutet die Treffer:
 * eine „deepfakes"-Suche expandiert über das KI-Cluster zu „ki" und lieferte
 * so 1.318 statt ~340 Reden, viele thematisch völlig unverwandt.
 *
 * FTS5-Syntax: `"phrase"*` ist legal (Prefix-Phrase). Bei einzelnen
 * Tokens entspricht das `token*`.
 *
 * Leere oder zu kurze Terms (<2 Zeichen) werden gefiltert.
 */
const FTS_PREFIX_MIN_LEN = 4;

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
      return t.length >= FTS_PREFIX_MIN_LEN ? `"${safe}"*` : `"${safe}"`;
    })
    .join(" OR ");
}

export const FTS_TABLES = {
  speeches: SPEECH_FTS_TABLE,
  activities: ACTIVITIES_FTS_TABLE,
  drucksachen: DRUCKSACHEN_FTS_TABLE,
  qa: QA_FTS_TABLE,
} as const;
