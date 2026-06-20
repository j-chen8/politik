/**
 * „Tut"-Schicht aus der Gold-Volltext-Extraktion (partei_aspekt_gold) — liefert
 * dieselbe Form wie getFeldVerhalten (db.ts), damit die Feld-Seite ohne weitere
 * Änderung darauf umschalten kann. Reden-Deeplinks/Labels identisch zur
 * Belege-Auflösung: /protokolle/sitzung/<n>#rede-<id> + „Redner, N. Sitzung (WP), Datum".
 */
import { getDb, type AspektVerhalten } from "./db";

export function hasGold(feld: string): boolean {
  return !!getDb().prepare(`SELECT 1 FROM partei_aspekt_gold WHERE feld=? LIMIT 1`).get(feld);
}

export function getFeldVerhaltenGold(
  feld: string,
): Record<string, Record<string, AspektVerhalten>> {
  const db = getDb();
  const meta = new Map<string, { sitzung: number; wp: number; datum: string }>();
  for (const r of db
    .prepare(
      `SELECT ps.rede_id, s.sitzung, s.wahlperiode AS wp, s.datum
       FROM plenar_speeches ps JOIN plenar_sessions s ON s.id = ps.session_id
       WHERE ps.rede_id IS NOT NULL`,
    )
    .all() as { rede_id: string; sitzung: number; wp: number; datum: string }[]) {
    if (!meta.has(r.rede_id)) meta.set(r.rede_id, { sitzung: r.sitzung, wp: r.wp, datum: r.datum });
  }

  const rows = db
    .prepare(`SELECT aspekt, partei, punkte_json, n_reden FROM partei_aspekt_gold WHERE feld=?`)
    .all(feld) as { aspekt: string; partei: string; punkte_json: string; n_reden: number }[];

  const out: Record<string, Record<string, AspektVerhalten>> = {};
  for (const r of rows) {
    const pts = JSON.parse(r.punkte_json || "[]") as {
      position: string; zitat: string; rede_id: string; speaker: string; verifiziert: boolean;
    }[];
    const punkte = pts.map((p) => ({ text: p.position, refs: [p.rede_id] }));
    const belege = pts.map((p) => {
      const m = meta.get(p.rede_id);
      const wann = m ? `${m.sitzung}. Sitzung (${m.wp}. WP)${m.datum ? ", " + m.datum : ""}` : "";
      return {
        zitat: p.zitat,
        quelle: "Rede",
        quelleId: p.rede_id,
        quelleUrl: m ? `/protokolle/sitzung/${m.sitzung}#rede-${p.rede_id}` : null,
        quelleLabel: p.speaker ? `${p.speaker}, ${wann}` : `Bundestagsdebatte, ${wann}`,
        person: p.speaker || null,
        verifiziert: !!p.verifiziert,
      };
    });
    (out[r.aspekt] ??= {})[r.partei] = {
      gesagt: pts.map((p) => p.position).join(" / ") || null,
      punkte,
      belege,
      votes: [],
      nVotes: 0,
      nReden: r.n_reden,
      nQa: 0,
    };
  }
  return out;
}
