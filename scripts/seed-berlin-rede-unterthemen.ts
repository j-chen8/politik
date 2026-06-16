/**
 * Stufe 8 (Berlin): Reden erben das Unterthema über die debattierte Drucksache.
 * Pendant zu scripts/seed-rede-unterthemen.ts (Bund).
 *
 * Korn: berlin_speeches.drucksache_nrn (JSON-Array von dok_nr, z.B. ["19/0025"])
 *   -> berlin_documents.dok_nr -> dbid -> berlin_ds_unterthemen.{feld, unterthema}.
 * Schreibt berlin_rede_unterthemen(speech_id, feld, unterthema). Idempotent (DROP+CREATE).
 *
 * dok_nr-Drift: Reden fuehren 4-stellig nullgepaddet ("19/0025"), Dokumente teils
 * unpadded ("19/2") -> daher Join ueber normalisierte Form (fuehrende Nullen strippen).
 *
 * Usage: npx tsx scripts/seed-berlin-rede-unterthemen.ts [--apply]
 */
import Database from "better-sqlite3";
import path from "path";

const APPLY = process.argv.includes("--apply");
const SEP = String.fromCharCode(1);
const db = new Database(path.join(process.cwd(), "politik.db"));

// "19/0025" -> "19/25"; defensiv fuer nicht-passende Formen unveraendert lassen.
const norm = (s: string) => s.trim().replace(/^(\d+)\/0*(\d+)$/, "$1/$2");

// dbid je normalisierter dok_nr
const docRows = db.prepare(`SELECT dbid, dok_nr FROM berlin_documents WHERE dok_nr IS NOT NULL AND dok_nr != ''`)
  .all() as { dbid: string; dok_nr: string }[];
const dbidByNr = new Map<string, string>();
for (const d of docRows) dbidByNr.set(norm(d.dok_nr), d.dbid);

// Unterthemen je dbid
const utRows = db.prepare(`SELECT dbid, feld, unterthemen_json FROM berlin_ds_unterthemen`)
  .all() as { dbid: string; feld: string; unterthemen_json: string }[];
const utByDbid = new Map<string, { feld: string; unterthemen: string[] }[]>();
for (const r of utRows) {
  let unter: string[] = [];
  try { unter = JSON.parse(r.unterthemen_json); } catch { /* skip */ }
  const list = utByDbid.get(r.dbid) ?? [];
  list.push({ feld: r.feld, unterthemen: unter });
  utByDbid.set(r.dbid, list);
}

// Reden mit DS-Bezug
const speeches = db.prepare(`SELECT speech_id, drucksache_nrn FROM berlin_speeches WHERE drucksache_nrn IS NOT NULL AND drucksache_nrn != '' AND drucksache_nrn != '[]'`)
  .all() as { speech_id: string; drucksache_nrn: string }[];

const pairs = new Set<string>();
let speechesMatched = 0, missingDoc = 0, missingUt = 0;
for (const s of speeches) {
  let nrs: string[] = [];
  try { nrs = JSON.parse(s.drucksache_nrn); } catch { continue; }
  let matched = false;
  for (const nr of nrs) {
    const dbid = dbidByNr.get(norm(nr));
    if (!dbid) { missingDoc++; continue; }
    const uts = utByDbid.get(dbid);
    if (!uts) { missingUt++; continue; }
    for (const u of uts)
      for (const ut of u.unterthemen)
        if (ut !== "Sonstiges") { pairs.add(s.speech_id + SEP + u.feld + SEP + ut); matched = true; }
  }
  if (matched) speechesMatched++;
}

console.log(`Reden mit DS-Bezug: ${speeches.length}`);
console.log(`Reden mit Unterthema-Treffer: ${speechesMatched}`);
console.log(`(dok_nr ohne Dokument: ${missingDoc} · Dokument ohne Unterthema-Klassifikation: ${missingUt})`);
console.log(`Erzeugte (Rede x Feld x Unterthema)-Paare: ${pairs.size}`);

if (!APPLY) { console.log("\nDRY-RUN. --apply zum Schreiben."); process.exit(0); }

db.exec(`
  DROP TABLE IF EXISTS berlin_rede_unterthemen;
  CREATE TABLE berlin_rede_unterthemen (
    speech_id TEXT NOT NULL,
    feld TEXT NOT NULL,
    unterthema TEXT NOT NULL,
    PRIMARY KEY (speech_id, feld, unterthema)
  );
  CREATE INDEX idx_berlin_rede_unterthemen_leaf ON berlin_rede_unterthemen(feld, unterthema);
`);
const ins = db.prepare(`INSERT OR IGNORE INTO berlin_rede_unterthemen (speech_id, feld, unterthema) VALUES (?, ?, ?)`);
const tx = db.transaction(() => {
  for (const p of pairs) { const [sid, feld, ut] = p.split(SEP); ins.run(sid, feld, ut); }
});
tx();
const n = (db.prepare(`SELECT COUNT(*) c FROM berlin_rede_unterthemen`).get() as { c: number }).c;
console.log(`\n✅ berlin_rede_unterthemen geschrieben: ${n} Zeilen.`);
