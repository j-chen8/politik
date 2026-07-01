import type Database from "better-sqlite3";

/**
 * Legt alle Kommissionen-Tabellen idempotent an (CREATE TABLE IF NOT EXISTS + Indizes).
 * Wird von JEDEM Ingestion-/Ranking-Script am Start aufgerufen (DRY). KEIN Schema in
 * db.ts (db.ts bleibt rein lesend). In PROD einmal mitlaufen lassen — politik.db ist
 * gitignored, sonst sind die db.ts-Reader fail-closed.
 */
export function ensureKommissionenSchema(db: Database.Database): void {
  db.exec(`
    -- 1) WATCHLIST-STAMMDATEN (eine Zeile je Kommission; slug = Natural-Key, via Upsert gepflegt)
    CREATE TABLE IF NOT EXISTS kommission (
      slug                 TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      kurzname             TEXT,                 -- gängiger Kurzname ("Rentenkommission") oder NULL
      ministerium          TEXT,                 -- BMAS/BMG/... oder "unabhängig"
      tier                 INTEGER NOT NULL DEFAULT 2,  -- 1 = Watchlist-Kern, 2 = Daueranstalt
      thema                TEXT,                 -- grobes Politikfeld (Anzeige/Gruppierung)
      quelle_url           TEXT,                 -- offizielle Übersichtsseite (Anzeige-Link)
      poll_url             TEXT,                 -- Seite, die die Ingestion auf Berichts-Links scrapt (oder NULL)
      cadence              TEXT,                 -- Rhythmus-Klartext ("jährl. (Nov)")
      next_expected        TEXT,                 -- erwarteter nächster Bericht (Klartext, ggf. "(unbestätigt)")
      status               TEXT,                 -- laufend | bericht_vorgelegt | aufgeloest
      letzter_bericht_url  TEXT,                 -- bekannter letzter Bericht (Seed) oder NULL
      notiz                TEXT,                 -- Caveats/Unsicherheiten (z.B. "PNOG = RefE, keine Pollseite")
      fetched_at           TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_kommission_tier ON kommission(tier);

    -- 2) BERICHTE (Seed aus Watchlist + per Poll gescrapte datierte PDF-/Bericht-Links)
    CREATE TABLE IF NOT EXISTS kommission_bericht (
      id              INTEGER PRIMARY KEY,
      kommission_slug TEXT NOT NULL,
      titel           TEXT,                 -- Linktext/Titel (kann NULL sein)
      datum           TEXT,                 -- ISO 'YYYY-MM-DD' (parseGermanDate / URL-Slug) oder NULL
      url             TEXT NOT NULL,        -- absolute PDF-/Detail-URL (Dedup-Key)
      quelle          TEXT NOT NULL DEFAULT 'poll',  -- 'seed' | 'poll' | 'news'
      erfasst_am      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(kommission_slug, url)
    );
    CREATE INDEX IF NOT EXISTS idx_kb_slug_datum ON kommission_bericht(kommission_slug, datum);

    -- 3) NEWS-SIGNALE (deterministisch aus news_items zugeordnet; eine Story kann mehrere Kommissionen treffen)
    CREATE TABLE IF NOT EXISTS kommission_news (
      kommission_slug TEXT NOT NULL,
      news_item_id    INTEGER NOT NULL,
      signal          TEXT,                 -- gematchtes Trigger-Wort ("gutachten") für Transparenz
      run_date        TEXT NOT NULL,
      erfasst_am      TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (kommission_slug, news_item_id)
    );
    CREATE INDEX IF NOT EXISTS idx_kn_slug ON kommission_news(kommission_slug, run_date);

    -- 4) MANUELLE BERICHTS-ANALYSE (eine Zeile je analysiertem Leitbericht; Claude Code, kein LLM)
    CREATE TABLE IF NOT EXISTS kommission_bericht_analyse (
      bericht_id      INTEGER PRIMARY KEY,   -- FK kommission_bericht.id (1 Analyse je Bericht)
      kommission_slug TEXT NOT NULL,
      auftrag         TEXT,                  -- 1-Satz Kontext/Auftrag des Berichts
      kernpunkte_json TEXT,                  -- JSON: [{nr,kapitel,thema,massnahme,gruppe,umsetzbarkeit}]
      gesamttenor     TEXT,                  -- 1-2 Sätze Gesamteinordnung (neutral)
      seiten          TEXT,                  -- Seiten-/Quellenhinweis
      quelle          TEXT NOT NULL DEFAULT 'manual',
      analysiert_am   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_kba_slug ON kommission_bericht_analyse(kommission_slug);
  `);

  // Idempotente Spalten-Migrationen (additiv für Bestands-Tabellen).
  for (const sql of [
    `ALTER TABLE kommission_bericht ADD COLUMN typ TEXT`,          // Klassifikation (classifyTyp)
    `ALTER TABLE kommission_bericht ADD COLUMN pdf_path TEXT`,     // lokaler Pfad data/kommissionen_pdfs/<slug>/<safe>.pdf
    `ALTER TABLE kommission_bericht ADD COLUMN full_text TEXT`,    // pdf-parse-Volltext
    `ALTER TABLE kommission_bericht ADD COLUMN pages INTEGER`,     // r.total
    `ALTER TABLE kommission_bericht ADD COLUMN chars INTEGER`,     // full_text.length
    `ALTER TABLE kommission_bericht ADD COLUMN parse_error TEXT`,  // 'empty:no-text-extracted' | '404' | ...
    `ALTER TABLE kommission_bericht ADD COLUMN parsed_at TEXT`,    // ISO oder NULL
    `ALTER TABLE kommission_bericht ADD COLUMN gemailt_am TEXT`,   // Mail-Tracking; NULL = nie gemailt
    `ALTER TABLE kommission_bericht_analyse ADD COLUMN kennzahlen_json TEXT`, // [{label,wert}] scan-first Kennzahlen
    `ALTER TABLE kommission_bericht_analyse ADD COLUMN eckpunkte_json TEXT`,  // [string] Stichpunkte statt Prosa
    `ALTER TABLE kommission_bericht_analyse ADD COLUMN mitglieder_json TEXT`, // {anzahl,zusammensetzung,merkmale[],gruppen[{rolle,personen[{name,funktion,partei?}]}],beratend[]}
    `ALTER TABLE kommission_bericht_analyse ADD COLUMN kernbefunde_json TEXT`, // [{titel,text,betrifft?,schwere?}] schema-freie, nach Schwere sortierte Kernbefunde (statt gruppe/art/impact-Raster)
    `ALTER TABLE kommission_bericht_analyse ADD COLUMN verwendung_json TEXT`,  // {titel?,zeitraum?,gesamt?,posten:[{label,wert,anteil?}]} — Geld-/Mengen-Aufschlüsselung als Balken
    // Index muss NACH der gemailt_am-Spalte laufen (Spalte kommt per ALTER, nicht im CREATE-Block).
    `CREATE INDEX IF NOT EXISTS idx_kb_gemailt ON kommission_bericht(gemailt_am)`,
  ]) {
    try { db.exec(sql); } catch { /* Spalte/Index existiert schon */ }
  }
}
