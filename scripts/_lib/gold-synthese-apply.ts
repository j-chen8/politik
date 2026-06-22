/**
 * Wiederverwendbare Mechanik für die MANUELLE Gold-Synthese (Claude Code, kein LLM):
 * pro Aspekt×Partei-Zelle werden die Per-Rede-Punkte (punkte_json) zu wenigen
 * Stichpunkten verdichtet. Jeder Stichpunkt referenziert INDIZES in die punkte_json;
 * die Funktion löst rede_ids auf und prüft, dass jeder Roh-Punkt-Index genau einmal
 * verwendet wird (Coverage-invariant → Fußnoten/Belege bleiben vollständig).
 *
 * Zwei Granularitäten: lang → synthese_json, kurz → synthese_kurz_json.
 * Identische Schreiblogik wie die Wirtschaft-Pilots (scripts/gold-synthese-pilot-*.ts).
 */
import Database from "better-sqlite3";

export type B = { text: string; idx: number[] };
export type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
export const r = (...xs: number[]) => xs;

export function applySynthese(FELD: string, CELLS: Cell[]) {
  const db = new Database("politik.db");
  const cols = (db.prepare(`PRAGMA table_info(partei_aspekt_gold)`).all() as any[]).map((c) => c.name);
  for (const c of ["synthese_json", "synthese_kurz_json"]) {
    if (!cols.includes(c)) { db.exec(`ALTER TABLE partei_aspekt_gold ADD COLUMN ${c} TEXT`); console.log(`+ Spalte ${c}`); }
  }
  const upd = db.prepare(
    `UPDATE partei_aspekt_gold SET synthese_json=?, synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`,
  );
  const resolve = (rede: string[], bullets: B[], label: string): { text: string; refs: string[] }[] => {
    const out = bullets.map((b) => ({ text: b.text, refs: b.idx.map((i) => rede[i]) }));
    const used = bullets.flatMap((b) => b.idx);
    const dup = used.filter((i, k) => used.indexOf(i) !== k);
    const missing = rede.map((_, i) => i).filter((i) => !used.includes(i));
    const bad = used.filter((i) => i < 0 || i >= rede.length);
    if (dup.length) console.log(`    ⚠ ${label}: doppelte Indizes ${[...new Set(dup)].join(",")}`);
    if (missing.length) console.log(`    ⚠ ${label}: nicht zugeordnete Reden-Indizes ${missing.join(",")}`);
    if (bad.length) console.log(`    ⚠ ${label}: ungültige Indizes ${bad.join(",")}`);
    return out;
  };
  let ok = 0, warn = 0;
  for (const c of CELLS) {
    const row = db
      .prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`)
      .get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
    if (!row) { console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`); warn++; continue; }
    const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
    const before = warn;
    const lang = resolve(rede, c.lang, `${c.aspekt}/${c.partei} lang`);
    const kurz = resolve(rede, c.kurz, `${c.aspekt}/${c.partei} kurz`);
    upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, c.aspekt, c.partei);
    ok++;
    if (warn === before) console.log(`  ✓ ${c.aspekt} / ${c.partei}: ${rede.length} Reden → ${lang.length} lang / ${kurz.length} kompakt`);
  }
  console.log(`\n${ok}/${CELLS.length} Zellen aktualisiert für „${FELD}".`);
  db.close();
}
