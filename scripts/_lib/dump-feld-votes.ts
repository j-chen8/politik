/** Dump: Sach-Votes (verfahren=0) pro Feld mit Gold-Aspekten + DS-Unterthema/Tags → /tmp/votes.txt
 * Zum manuellen Lesen für die Vote→Aspekt-Zuordnung. */
import Database from "better-sqlite3";
import { writeFileSync } from "fs";

const db = new Database("politik.db");
const norm = (d: string) => {
  const m = String(d).match(/^(\d+)\/0*(\d+)$/);
  return m ? `${m[1]}/${m[2]}` : String(d);
};

const felder = (db.prepare(
  "SELECT DISTINCT feld FROM vote_themenfeld WHERE primaer=1 AND verfahren=0 ORDER BY feld"
).all() as any[]).map((r) => r.feld);

const aspekteStmt = db.prepare("SELECT DISTINCT aspekt FROM partei_aspekt_gold WHERE feld=? ORDER BY aspekt");
const votesStmt = db.prepare(
  "SELECT vt.vote_id, bv.drucksache_nrn_json, bv.outcome, bv.fraktion_votes_json FROM vote_themenfeld vt JOIN bundestag_votes bv ON bv.vote_id=vt.vote_id WHERE vt.primaer=1 AND vt.verfahren=0 AND vt.feld=? ORDER BY vt.vote_id"
);
const utStmt = db.prepare("SELECT unterthemen_json, spezifische_tags_json FROM ds_unterthemen WHERE drucksache_nr=? AND feld=?");
const anStmt = db.prepare("SELECT dokumenttyp, thema, kerninhalt FROM drucksache_analyses WHERE drucksache_nr=?");

const out: string[] = [];
for (const feld of felder) {
  const aspekte = (aspekteStmt.all(feld) as any[]).map((a) => a.aspekt);
  const votes = votesStmt.all(feld) as any[];
  out.push(`\n================ ${feld}  (${votes.length} Sach-Votes) ================`);
  out.push(`ASPEKTE: ${aspekte.join(" | ")}`);
  for (const v of votes) {
    const ds = (JSON.parse(v.drucksache_nrn_json || "[]") as string[]).map(norm);
    const u = utStmt.get(ds[0], feld) as any;
    const a = anStmt.get(ds[0]) as any;
    let uts: string[] = [], tags: string[] = [];
    try { uts = JSON.parse(u?.unterthemen_json || "[]"); } catch {}
    try { tags = JSON.parse(u?.spezifische_tags_json || "[]"); } catch {}
    out.push(`[${v.vote_id}] ${a?.dokumenttyp || "?"} | ${ds.join(",")} | ${v.outcome}`);
    out.push(`    UT: ${uts.join("; ")}  ||  TAGS: ${tags.join(", ")}`);
    out.push(`    kern: ${(a?.kerninhalt || a?.thema || "").replace(/\s+/g, " ").slice(0, 150)}`);
  }
}
writeFileSync("/tmp/votes.txt", out.join("\n"));
console.log(`${felder.length} Felder, ${out.length} Zeilen → /tmp/votes.txt`);
