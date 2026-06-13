import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import { OBERTHEMEN, TAXONOMIE, anzeigeName, istGemergt } from "@/lib/themen-struktur";

/**
 * Wortfüll-Vorschläge fürs Landing-Suchfeld (User 2026-06-13): alle aktiven
 * Bundestags-Namen + 14 Themenfelder + 191 Unterthemen + die spezifischen
 * Tags der Unterthemen-Klassifikation (~12k, offenes Vokabular). Wegen des
 * Tag-Volumens wird NICHT inline geliefert, sondern serverseitig gefiltert
 * (/api/suche/vorschlaege) — die Liste lebt in einem Modul-Cache.
 */
export interface SuchVorschlag {
  v: string;
  typ: "Person" | "Themenfeld" | "Unterthema" | "Spezifisches Thema";
}

// Umlaut-/Akzent-tolerantes Matching („muller" findet „Müller")
function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function baueListe(): SuchVorschlag[] {
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

  // Tags nach Verbreitung (DS-dedupliziert — eine DS wiederholt ihre Tags pro
  // Feld-Zeile), häufige zuerst: bei Rang-Gleichstand gewinnt die frühere Position.
  const tags = db.prepare(`
    SELECT je.value AS v, COUNT(DISTINCT du.drucksache_nr) AS c
    FROM ds_unterthemen du, json_each(du.spezifische_tags_json) je
    GROUP BY je.value ORDER BY c DESC
  `).all() as { v: string; c: number }[];

  const liste: SuchVorschlag[] = namen.map((n) => ({ v: n.name, typ: "Person" as const }));
  for (const o of OBERTHEMEN) {
    liste.push({ v: o.name, typ: "Themenfeld" });
    for (const feld of o.felder)
      for (const u of (TAXONOMIE[feld] ?? []).filter((x) => !istGemergt(feld, x)))
        liste.push({ v: anzeigeName(u), typ: "Unterthema" });
  }
  // Tags zuletzt + Dedupe: heißt ein Tag wie ein Unterthema/Feld, gewinnt die Ebene
  const gesehen = new Set(liste.map((s) => norm(s.v)));
  for (const t of tags) {
    const n = norm(t.v);
    if (gesehen.has(n)) continue;
    gesehen.add(n);
    liste.push({ v: t.v, typ: "Spezifisches Thema" });
  }
  return liste;
}

// Pro Server-Prozess gecacht; TTL fängt Pipeline-Läufe bei laufendem Server ab.
let cache: { at: number; liste: SuchVorschlag[] } | null = null;
const TTL_MS = 60 * 60 * 1000;

export function getSuchVorschlaege(): SuchVorschlag[] {
  if (!cache || Date.now() - cache.at > TTL_MS) cache = { at: Date.now(), liste: baueListe() };
  return cache.liste;
}

/** Ranking: Präfix vor Wortanfang vor Teilstring — bei Gleichstand Listenreihenfolge. */
export function filterVorschlaege(query: string, limit = 8): SuchVorschlag[] {
  const q = norm(query.trim());
  if (q.length < 2) return [];
  const rang = (v: string): number => {
    const n = norm(v);
    if (n.startsWith(q)) return 0;
    if (n.includes(` ${q}`) || n.includes(`-${q}`)) return 1;
    if (n.includes(q)) return 2;
    return 3;
  };
  const treffer: { s: SuchVorschlag; r: number }[] = [];
  for (const s of getSuchVorschlaege()) {
    const r = rang(s.v);
    if (r < 3) treffer.push({ s, r });
  }
  return treffer.sort((a, b) => a.r - b.r).slice(0, limit).map((x) => x.s);
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
