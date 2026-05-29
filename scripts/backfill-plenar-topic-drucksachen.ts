/**
 * Extrahiert pro Tagesordnungspunkt die referenzierten Drucksachen aus den
 * `T_Drs`-Absätzen des XML-<tagesordnungspunkt>-Blocks und schreibt sie nach
 * plenar_topic_drucksachen (topic_id, drucksache_nr). Grundlage für die
 * Vote→TOP-Zuordnung (DS-Überschneidung, analog Berlin).
 *
 * Re-runnable / idempotent (INSERT OR IGNORE; bei --write erst alte Rows der
 * betroffenen TOPs löschen, dann neu schreiben → exakte Reproduktion nach Re-Seed).
 *
 * Run:
 *   npx tsx scripts/backfill-plenar-topic-drucksachen.ts            (dry-run + Stats)
 *   npx tsx scripts/backfill-plenar-topic-drucksachen.ts --write
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const WRITE = process.argv.includes("--write");
const db = new Database(path.join(process.cwd(), "politik.db"));
const XML_DIR = path.join(process.cwd(), "data", "plenarprotokolle_xml");

db.exec(`
  CREATE TABLE IF NOT EXISTS plenar_topic_drucksachen (
    topic_id INTEGER NOT NULL,
    drucksache_nr TEXT NOT NULL,
    PRIMARY KEY (topic_id, drucksache_nr)
  )
`);

interface Row {
  id: number;
  top_id_raw: string | null;
  xml_source: string | null;
}
const rows = db.prepare(`SELECT id, top_id_raw, xml_source FROM plenar_topics WHERE top_id_raw IS NOT NULL AND xml_source IS NOT NULL`).all() as Row[];

const xmlCache = new Map<string, string>();
const blockCache = new Map<string, Map<string, string>>();
function loadXml(src: string): string | null {
  if (xmlCache.has(src)) return xmlCache.get(src)!;
  const p = path.join(XML_DIR, src);
  if (!fs.existsSync(p)) return null;
  const x = fs.readFileSync(p, "utf-8");
  xmlCache.set(src, x);
  return x;
}
function topBlocks(src: string, xml: string): Map<string, string> {
  if (blockCache.has(src)) return blockCache.get(src)!;
  const map = new Map<string, string>();
  const re = /<tagesordnungspunkt\s+top-id="([^"]+)">([\s\S]*?)<\/tagesordnungspunkt>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) map.set(m[1], m[2]);
  blockCache.set(src, map);
  return map;
}

/** DS-Nummern aus den T_Drs-Absätzen eines TOP-Blocks (Link-Text der <a>-Tags). */
function dsFromBlock(content: string): string[] {
  const out = new Set<string>();
  const tdrs = [...content.matchAll(/<p\s+klasse="T_Drs"[^>]*>([\s\S]*?)<\/p>/g)];
  for (const p of tdrs) {
    // Nur der <a>-Link-Text ist die echte DS-Nr (NICHT die href-Pfadsegmente
    // wie btd/21/003/, die führende Nullen tragen).
    for (const mm of p[1].matchAll(/<a\b[^>]*>\s*(\d{1,2}\/\d{1,6})\s*<\/a>/g)) out.add(mm[1]);
  }
  return [...out];
}

const insert = db.prepare(`INSERT OR IGNORE INTO plenar_topic_drucksachen (topic_id, drucksache_nr) VALUES (?, ?)`);
const del = db.prepare(`DELETE FROM plenar_topic_drucksachen WHERE topic_id = ?`);

let topsWithDs = 0, totalLinks = 0, topsNoDs = 0;
const writes: { topicId: number; ds: string[] }[] = [];

for (const r of rows) {
  const xml = loadXml(r.xml_source!);
  if (!xml) continue;
  const block = topBlocks(r.xml_source!, xml).get(r.top_id_raw!);
  if (!block) { topsNoDs++; continue; }
  const ds = dsFromBlock(block);
  if (ds.length === 0) { topsNoDs++; continue; }
  topsWithDs++;
  totalLinks += ds.length;
  writes.push({ topicId: r.id, ds });
}

console.log(`\n${rows.length} TOPs gescannt · ${topsWithDs} mit DS · ${topsNoDs} ohne DS · ${totalLinks} TOP↔DS-Links`);
// Beispiele
for (const w of writes.slice(0, 5)) console.log(`  topic ${w.topicId}: ${w.ds.join(", ")}`);

if (WRITE) {
  const txn = db.transaction(() => {
    for (const w of writes) {
      del.run(w.topicId);
      for (const ds of w.ds) insert.run(w.topicId, ds);
    }
  });
  txn();
  console.log(`✓ geschrieben: ${totalLinks} Links für ${topsWithDs} TOPs.`);
} else {
  console.log(`DRY-RUN — mit --write schreiben.`);
}
db.close();
