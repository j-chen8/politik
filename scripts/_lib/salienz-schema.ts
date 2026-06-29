import type Database from "better-sqlite3";

/**
 * Legt alle Salienz-Tabellen idempotent an (CREATE TABLE IF NOT EXISTS + Indizes).
 * Wird von JEDEM Ingestion-/Ranking-Script am Start aufgerufen (DRY). KEIN Schema in
 * db.ts (db.ts bleibt rein lesend). In PROD einmal mitlaufen lassen — politik.db ist
 * gitignored, sonst sind die db.ts-Reader fail-closed.
 */
export function ensureSalienzSchema(db: Database.Database): void {
  db.exec(`
    -- 1) ROH-SCHLAGZEILEN (stündlich, dedupliziert über link)
    CREATE TABLE IF NOT EXISTS news_items (
      id          INTEGER PRIMARY KEY,
      outlet      TEXT NOT NULL,
      title       TEXT NOT NULL,
      link        TEXT NOT NULL,
      description TEXT,
      pubdate     TEXT,          -- ISO-8601 normalisiert
      pubdate_raw TEXT,          -- Original (Debug)
      fetched_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(link)
    );
    CREATE INDEX IF NOT EXISTS idx_news_pub ON news_items(pubdate);

    -- 2) TAGES-STORY-CLUSTER (Cross-Outlet-Ergebnis; outlet_count = Salienz)
    CREATE TABLE IF NOT EXISTS news_cluster (
      run_date     TEXT NOT NULL,
      cluster_id   INTEGER NOT NULL,
      leitthema    TEXT NOT NULL,
      themenfeld   TEXT,
      outlet_count INTEGER NOT NULL,
      item_count   INTEGER NOT NULL,
      outlets_json TEXT,         -- ["ntv","zeit",...]
      titles_json  TEXT,         -- [{outlet,title,link}, ...]
      summary      TEXT,         -- neutrale 1-2-Satz-Zusammenfassung (LLM)
      gesetzbezug  INTEGER NOT NULL DEFAULT 0,  -- 1 = Gesetz/Reform/parl. Verfahren (Plattform-Kern)
      PRIMARY KEY (run_date, cluster_id)
    );
    CREATE INDEX IF NOT EXISTS idx_cluster_field ON news_cluster(run_date, themenfeld);

    -- 2b) CLUSTER-MITGLIEDSCHAFT n:m über INTEGER-IDs (KEIN Link-Rückmapping!)
    CREATE TABLE IF NOT EXISTS news_cluster_items (
      run_date     TEXT NOT NULL,
      cluster_id   INTEGER NOT NULL,
      news_item_id INTEGER NOT NULL,
      PRIMARY KEY (run_date, cluster_id, news_item_id)
    );
    CREATE INDEX IF NOT EXISTS idx_nci_item ON news_cluster_items(news_item_id);

    -- 3) TWITTER/X-TRENDS (trends24 ∩ getdaytrends, LLM-gefiltert auf politisch)
    CREATE TABLE IF NOT EXISTS twitter_trends_daily (
      run_date   TEXT NOT NULL,
      begriff    TEXT NOT NULL,
      rang       INTEGER,
      auf_beiden INTEGER NOT NULL DEFAULT 0,
      politisch  INTEGER NOT NULL DEFAULT 0,
      themenfeld TEXT,
      PRIMARY KEY (run_date, begriff)
    );

    -- 4) TAGES-RANKING je Feld (Picker-Eingang). v1: rang nach ROHEM outlet_count.
    CREATE TABLE IF NOT EXISTS salienz_themen (
      run_date           TEXT NOT NULL,
      themenfeld         TEXT NOT NULL,
      slug               TEXT NOT NULL,
      rang               INTEGER NOT NULL,
      news_outlet_count  INTEGER NOT NULL DEFAULT 0,
      news_cluster_count INTEGER NOT NULL DEFAULT 0,
      s_news             REAL NOT NULL DEFAULT 0,
      s_twitter          REAL NOT NULL DEFAULT 0,
      score              REAL,          -- optionaler Kontext-Composite (NICHT ranking-führend)
      twitter_begriffe   TEXT,          -- json [begriff,...]
      top_cluster_ids    TEXT,          -- json [cluster_id,...]
      top_titles         TEXT,          -- json [{outlet,title,link}]
      summary            TEXT,
      PRIMARY KEY (run_date, themenfeld)
    );
    CREATE INDEX IF NOT EXISTS idx_salienz_rang ON salienz_themen(run_date, rang);

    -- 4b) STORY-STRÄNGE über Tage (Ebene 2) — deterministisch aus news_cluster
    --     gethreadet (€0, Voll-Recompute je Lauf). „Thema X seit N Tagen".
    CREATE TABLE IF NOT EXISTS salienz_story (
      thread_id    TEXT PRIMARY KEY,   -- stabil: erstes run_date#cluster_id
      themenfeld   TEXT,
      leitthema    TEXT,               -- jüngste repräsentative Schlagzeile
      first_date   TEXT NOT NULL,
      last_date    TEXT NOT NULL,
      day_count    INTEGER NOT NULL,   -- Tage markant (distinkte run_dates, outlet_count>=2)
      streak_days  INTEGER NOT NULL,   -- am Stück bis last_date (lückenlose Kalendertage)
      peak_outlets INTEGER NOT NULL,
      gesetzbezug  INTEGER NOT NULL DEFAULT 0,
      dates_json   TEXT                 -- ["2026-06-27", ...] alle aktiven Tage
    );
    CREATE INDEX IF NOT EXISTS idx_story_last ON salienz_story(last_date);

    -- 4c) WELCHE STORY-STRÄNGE GINGEN SCHON PER MAIL RAUS — damit die nächste Mail
    --     nur das NEUE auffällig markiert. Pro thread_id genau eine Zeile.
    CREATE TABLE IF NOT EXISTS salienz_mail_sent (
      thread_id     TEXT PRIMARY KEY,
      first_sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      leitthema     TEXT,
      themenfeld    TEXT         -- Feld-Gate für den inhaltlichen „schon gesendet?"-Abgleich
    );

    -- 5) MANUELLER AUFMACHER-PICK (jüngste aktive Zeile speist den Hero)
    CREATE TABLE IF NOT EXISTS aufmacher_pick (
      id         INTEGER PRIMARY KEY,
      picked_at  TEXT NOT NULL DEFAULT (datetime('now')),
      run_date   TEXT NOT NULL,
      themenfeld TEXT NOT NULL,
      slug       TEXT NOT NULL,
      cluster_id INTEGER,        -- Story, aus der die Headline stammt (Rückverfolgung)
      headline   TEXT,
      summary    TEXT,
      ds_nr      TEXT,           -- manuell gemappte Drucksache (z.B. '21/623')
      poll_id    INTEGER,        -- ODER manuell gemappte namentliche Abstimmung
      notiz      TEXT,
      aktiv      INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_pick_aktiv ON aufmacher_pick(aktiv, picked_at);
  `);

  // Idempotente Spalten-Migrationen (für bereits angelegte Tabellen ohne die Spalte).
  for (const sql of [
    `ALTER TABLE news_cluster ADD COLUMN gesetzbezug INTEGER NOT NULL DEFAULT 0`,
    // Feld-Ebene: 1 = mind. ein Gesetz/Reform-Cluster im Feld → Substanz-Boost im Ranking + Badge.
    `ALTER TABLE salienz_themen ADD COLUMN gesetzbezug INTEGER NOT NULL DEFAULT 0`,
    // Ebene 2: jeder markante Cluster bekommt seinen Story-Strang zugeordnet.
    `ALTER TABLE news_cluster ADD COLUMN thread_id TEXT`,
    `ALTER TABLE salienz_mail_sent ADD COLUMN themenfeld TEXT`,
  ]) {
    try { db.exec(sql); } catch { /* Spalte existiert schon */ }
  }
}
