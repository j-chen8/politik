/** Dumpt die indizierten Positions-Texte eines Feldes nach /tmp/pts.txt (zum manuellen Clustern). */
import Database from "better-sqlite3";
import fs from "fs";
const feld = process.argv[2];
if (!feld) { console.error("Feld als Argument angeben"); process.exit(1); }
const db = new Database("politik.db");
const rows = db.prepare(`SELECT aspekt,partei,punkte_json FROM partei_aspekt_gold WHERE feld=? ORDER BY aspekt,partei`).all(feld) as any[];
const out: string[] = [];
for (const row of rows) {
  const pts = JSON.parse(row.punkte_json);
  out.push(`### ${row.aspekt} || ${row.partei}  (n=${pts.length})`);
  pts.forEach((p: any, i: number) => out.push(`  [${i}] ${(p.position || "(leer)").replace(/\s+/g, " ")}`));
  out.push("");
}
fs.writeFileSync("/tmp/pts.txt", out.join("\n"));
console.log(`${out.length} Zeilen, ${rows.length} Zellen → /tmp/pts.txt`);
