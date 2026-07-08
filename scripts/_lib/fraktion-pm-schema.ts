/** Schema für Fraktions-Pressemitteilungen (idempotent). */
import type Database from "better-sqlite3";

export function ensureFraktionPmSchema(db: Database.Database): void {
  db.exec(`
    -- Pressemitteilungen der fünf Bundestagsfraktionen (Erstquelle, kein Medienzitat).
    -- Quellen-Inventar + Backfill-Tiefen: docs/PROZEDUR-fraktions-pm.md bzw.
    -- scripts/fetch-fraktions-pm.ts. Fraktions-Namen wie in fraktion_votes
    -- (CDU/CSU · SPD · GRÜNE · LINKE · AfD) → joinbar auf bestehende Schichten.
    CREATE TABLE IF NOT EXISTS fraktion_pm (
      id              INTEGER PRIMARY KEY,
      fraktion        TEXT NOT NULL,
      titel           TEXT NOT NULL,
      link            TEXT NOT NULL UNIQUE,  -- Dedupe-Anker (stabil, driftet nicht)
      datum           TEXT,                  -- ISO YYYY-MM-DD[THH:MM] soweit Quelle es hergibt
      text            TEXT,                  -- AfD/CDU: Volltext · Feeds/Listen: Teaser
      kategorien_json TEXT,                  -- Quelle-Kategorien (Linke: Politikfeld, AfD: AK+MdB)
      quelle          TEXT NOT NULL,         -- rss | wp-api | html-liste | sitemap-detail
      fetched_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fraktion_pm_datum ON fraktion_pm(datum DESC);
    CREATE INDEX IF NOT EXISTS idx_fraktion_pm_fraktion ON fraktion_pm(fraktion, datum DESC);
  `);
  // Idempotente Migrationen.
  for (const sql of [
    // 1 = text ist der Volltext der PM (AfD/CDU ab Fetch; Grüne/SPD/Linke nach
    // Detailseiten-Anreicherung — deren Feeds/Listen liefern nur Teaser).
    `ALTER TABLE fraktion_pm ADD COLUMN volltext INTEGER NOT NULL DEFAULT 0`,
  ]) {
    try { db.exec(sql); } catch { /* Spalte existiert schon */ }
  }
}
