/**
 * Reden erben Unterthemen über ihre Debatte (User 2026-06-12, „Reden-Erben"):
 *   rede → plenar_speeches.topic_id → plenar_topic_drucksachen → ds_unterthemen.
 * Deterministischer Join-Lauf, kein LLM, $0 — nach jedem ds_unterthemen-Batch
 * oder Protokoll-Seed neu laufen lassen (DROP + Rebuild, idempotent).
 *
 * Verproben (2026-06-12): 5.111 von 11.926 Reden erben (Decke = TOPs ohne DS:
 * Regierungserklärungen, Aktuelle Stunden, Fragestunde); Ø 3,4 Unterthemen je
 * Rede; Sammel-TOPs (≥6 DS) sind ECHTE thematische Debatten (Renten-Paket,
 * Haushalts-Begleit-Anträge), kein Filter nötig; Stichprobe Strafrecht sauber.
 * Konsumiert von src/lib/themen-blatt.ts (Köpfe/Reden/Sitzungen am Blatt).
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "..", "politik.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  DROP TABLE IF EXISTS rede_unterthemen;
  CREATE TABLE rede_unterthemen (
    rede_id TEXT NOT NULL,
    feld TEXT NOT NULL,
    unterthema TEXT NOT NULL,
    n_ds INTEGER NOT NULL, -- wie viele DS der Debatte dieses Unterthema tragen (Provenienz/Gewicht)
    PRIMARY KEY (rede_id, feld, unterthema)
  );

  INSERT INTO rede_unterthemen (rede_id, feld, unterthema, n_ds)
  SELECT ss.rede_id, du.feld, j.value, COUNT(DISTINCT du.drucksache_nr)
  FROM speech_summaries ss
  JOIN plenar_speeches ps ON ps.rede_id = ss.rede_id
  JOIN plenar_topic_drucksachen ptd ON ptd.topic_id = ps.topic_id
  JOIN ds_unterthemen du ON du.drucksache_nr = ptd.drucksache_nr
  CROSS JOIN json_each(du.unterthemen_json) j
  WHERE ss.rede_id IS NOT NULL
  GROUP BY ss.rede_id, du.feld, j.value;

  CREATE INDEX idx_rede_unterthemen_leaf ON rede_unterthemen(feld, unterthema);
`);

const stats = db.prepare(`
  SELECT (SELECT COUNT(*) FROM rede_unterthemen) AS paare,
    COUNT(*) AS reden, ROUND(AVG(n), 1) AS proRede
  FROM (SELECT rede_id, COUNT(*) AS n FROM rede_unterthemen GROUP BY rede_id)
`).get() as { paare: number; reden: number; proRede: number };
const leaves = db.prepare(
  "SELECT COUNT(*) AS n FROM (SELECT DISTINCT feld, unterthema FROM rede_unterthemen)"
).get() as { n: number };
console.log(`rede_unterthemen: ${stats.paare} Paare · ${stats.reden} Reden · Ø ${stats.proRede}/Rede · ${leaves.n} Blätter mit Reden`);
