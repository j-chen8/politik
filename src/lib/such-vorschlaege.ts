import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { OBERTHEMEN, TAXONOMIE, anzeigeName, istGemergt } from "@/lib/themen-struktur";

/**
 * Wortfüll-Vorschläge fürs Landing-Suchfeld (User 2026-06-13): alle aktiven
 * Bundestags-Namen + die 14 Themenfelder + 191 sichtbaren Unterthemen. Wird
 * serverseitig einmal pro Request gebaut und als Prop inline geliefert
 * (~20 KB) — kein eigener API-Roundtrip nötig.
 */
export interface SuchVorschlag {
  v: string;
  typ: "Person" | "Themenfeld" | "Unterthema";
}

export function getSuchVorschlaege(): SuchVorschlag[] {
  const db = getDb();
  // Bundestag-Scope wie /suche: aktive MdB + Bundesregierung (Stammdaten-Profile)
  const namen = db.prepare(`
    SELECT DISTINCT (p.first_name || ' ' || p.last_name) AS name
    FROM politicians p
    WHERE (
      p.id >= 900000
      AND p.rolle IN ('Bundesminister', 'Staatsminister')
      AND p.amt IS NOT NULL AND p.amt != '' AND p.amt NOT LIKE 'Land:%'
    ) OR EXISTS (
      SELECT 1 FROM mandates m
      JOIN parliament_periods pp ON m.parliament_period_id = pp.id
      JOIN parliaments par ON pp.parliament_id = par.id
      WHERE m.politician_id = p.id AND m.type = 'mandate' AND par.type = 'bundestag'
        AND (m.end_date IS NULL OR m.end_date = '' OR m.end_date > date('now'))
    )
    ORDER BY p.last_name, p.first_name
  `).all() as { name: string }[];

  const vorschlaege: SuchVorschlag[] = namen.map((n) => ({ v: n.name, typ: "Person" }));
  for (const o of OBERTHEMEN) {
    vorschlaege.push({ v: o.name, typ: "Themenfeld" });
    for (const feld of o.felder)
      for (const u of (TAXONOMIE[feld] ?? []).filter((x) => !istGemergt(feld, x)))
        vorschlaege.push({ v: anzeigeName(u), typ: "Unterthema" });
  }
  return vorschlaege;
}

/**
 * „Daten zuletzt aktualisiert" = jüngster Schreibstand der Datenbank (Datei-
 * mtime von politik.db + WAL) — ehrlicher als das neueste Inhaltsdatum, das
 * bei frischem Update-Lauf trotzdem Tage zurückliegen kann. Die App schreibt
 * zur Laufzeit nicht; mtime bewegt sich nur durch Pipeline-Läufe.
 */
export function getDatenstand(): string {
  const base = path.join(process.cwd(), "politik.db");
  let ts = 0;
  for (const f of [base, `${base}-wal`]) {
    try { ts = Math.max(ts, fs.statSync(f).mtimeMs); } catch { /* WAL evtl. abwesend */ }
  }
  return new Date(ts).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}
