/**
 * v2→speech_summaries-Kopie (Pflicht-Schritt nach jedem Reden-Batch, $0):
 * Die UI liest speech_summaries.zusammenfassung — neue Reden bleiben dort leer,
 * bis die Analyse aus speech_analyses_v2 kopiert ist (Lücke vom 2026-06-11:
 * 737 leere Summaries für Sitzungen 76–80). Bisher tsx-Inline (Runbook §2.2),
 * seit 2026-06-12 dieses Skript. Segment-geordnet je rede_id konkateniert,
 * model-Marker 'backfill-from-v2-<datum>'. Idempotent (füllt nur Leere).
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(__dirname, "..", "politik.db"));
db.pragma("journal_mode = WAL");

const leer = db.prepare(`
  SELECT s.id, s.rede_id
  FROM speech_summaries s
  WHERE (s.zusammenfassung IS NULL OR s.zusammenfassung = '')
    AND s.rede_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM speech_analyses_v2 v WHERE v.rede_id = s.rede_id
                  AND v.zusammenfassung_2_saetze IS NOT NULL AND v.zusammenfassung_2_saetze != '')
`).all() as { id: number; rede_id: string }[];

const teile = db.prepare(`
  SELECT zusammenfassung_2_saetze AS zusammenfassung FROM speech_analyses_v2
  WHERE rede_id = ? AND zusammenfassung_2_saetze IS NOT NULL AND zusammenfassung_2_saetze != ''
  ORDER BY segment_index
`);
const upd = db.prepare("UPDATE speech_summaries SET zusammenfassung = ?, model = ? WHERE id = ?");

const marker = `backfill-from-v2-${new Date().toISOString().slice(0, 10)}`;
let n = 0;
const tx = db.transaction(() => {
  for (const r of leer) {
    const z = (teile.all(r.rede_id) as { zusammenfassung: string }[])
      .map((t) => t.zusammenfassung.trim()).join(" ");
    if (!z) continue;
    upd.run(z, marker, r.id);
    n++;
  }
});
tx();
const rest = (db.prepare(
  "SELECT COUNT(*) c FROM speech_summaries WHERE (zusammenfassung IS NULL OR zusammenfassung='') AND rede_id IS NOT NULL"
).get() as { c: number }).c;
console.log(`kopiert: ${n} · weiterhin leer (keine v2-Analyse): ${rest}`);
