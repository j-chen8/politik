/**
 * build-item-topics.ts — Themen-Klassifikation Schritt D (Propagation)
 * Wendet topic_tag_map auf ALLE Quellen an → einheitliche Tabelle item_topics.
 * Rein datenbasiert (kein LLM). Herkunft pro Zuordnung getrackt.
 *
 * Quellen: bt_drucksache · bt_rede (über TOP→DS) · bt_vote (offiziell+DS) ·
 *          berlin_drucksache · berlin_rede (über drucksache_nrn) · media
 */
import Database from "better-sqlite3";
import fs from "fs";

const db = new Database("politik.db");

// tag → {field, querschnitt}
const TAGMAP = new Map<string, { field: string; q: string | null }>();
for (const r of db.prepare("SELECT tag, aw_field, querschnitt FROM topic_tag_map").all() as any[])
  TAGMAP.set(r.tag, { field: r.aw_field, q: r.querschnitt });

function fieldsFromTags(tags: string[]): Map<string, string | null> {
  const out = new Map<string, string | null>(); // field -> querschnitt (irgendeines)
  for (const t of tags) {
    const m = TAGMAP.get(t.trim());
    if (m && m.field !== "UNKLAR") out.set(m.field, m.q ?? out.get(m.field) ?? null);
  }
  return out;
}
const splitThema = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
const parseJsonTags = (s: string) => { try { return (JSON.parse(s) as any[]).filter(x => typeof x === "string"); } catch { return []; } };

// SCOPE-GETRENNT: item_topics = NUR Bundestag, berlin_item_topics = NUR Berlin. Nie gemischt.
const ddl = (tbl: string) => `DROP TABLE IF EXISTS ${tbl};
CREATE TABLE ${tbl} (
  source TEXT NOT NULL, item_id TEXT NOT NULL,
  aw_field TEXT NOT NULL, querschnitt TEXT, origin TEXT NOT NULL,
  PRIMARY KEY (source, item_id, aw_field)
);`;
db.exec(ddl("item_topics"));
db.exec(ddl("berlin_item_topics"));
const insBT = db.prepare("INSERT OR IGNORE INTO item_topics (source,item_id,aw_field,querschnitt,origin) VALUES (?,?,?,?,?)");
const insBLN = db.prepare("INSERT OR IGNORE INTO berlin_item_topics (source,item_id,aw_field,querschnitt,origin) VALUES (?,?,?,?,?)");
const put = (src: string, id: string, fields: Map<string, string | null>, origin: string) => {
  const ins = src.startsWith("berlin_") ? insBLN : insBT;
  for (const [f, q] of fields) ins.run(src, String(id), f, q, origin);
};

const tx = db.transaction(() => {
  // 1. BT Drucksachen (thema → map)
  let n = 0;
  for (const r of db.prepare("SELECT drucksache_nr, thema FROM drucksache_analyses WHERE thema IS NOT NULL").all() as any[]) {
    const f = fieldsFromTags(splitThema(r.thema)); if (f.size) { put("bt_drucksache", r.drucksache_nr, f, "thema_map"); n++; }
  }
  console.log(`bt_drucksache: ${n}`);

  // 2. Berlin Drucksachen (thema_json → map)
  n = 0;
  for (const r of db.prepare("SELECT dbid, thema_json FROM berlin_drucksachen_analyses WHERE thema_json IS NOT NULL").all() as any[]) {
    const f = fieldsFromTags(parseJsonTags(r.thema_json)); if (f.size) { put("berlin_drucksache", r.dbid, f, "thema_map"); n++; }
  }
  console.log(`berlin_drucksache: ${n}`);

  // 3. BT Reden (über TOP→DS-Vererbung)
  n = 0;
  const topFields = db.prepare(`
    SELECT ps.rede_id AS rede_id, GROUP_CONCAT(da.thema, ',') AS themen
    FROM plenar_speeches ps
    JOIN plenar_topic_drucksachen ptd ON ptd.topic_id = ps.topic_id
    JOIN drucksache_analyses da ON da.drucksache_nr = ptd.drucksache_nr AND da.thema IS NOT NULL
    WHERE ps.rede_id IS NOT NULL GROUP BY ps.rede_id`).all() as any[];
  for (const r of topFields) { const f = fieldsFromTags(splitThema(r.themen)); if (f.size) { put("bt_rede", r.rede_id, f, "inherited_ds"); n++; } }
  console.log(`bt_rede (vererbt): ${n}`);

  // 4. Berlin Reden: drucksache_nrn (["19/0025"]) → berlin_documents.dok_nr → dbid → thema_json
  n = 0;
  const blnDsThema = new Map<string, string>();
  for (const r of db.prepare("SELECT dbid, thema_json FROM berlin_drucksachen_analyses WHERE thema_json IS NOT NULL").all() as any[]) blnDsThema.set(String(r.dbid), r.thema_json);
  const dokToDbid = new Map<string, string>();
  for (const r of db.prepare("SELECT dbid, dok_nr FROM berlin_documents WHERE dok_nr IS NOT NULL").all() as any[]) dokToDbid.set(String(r.dok_nr), String(r.dbid));
  for (const r of db.prepare("SELECT speech_id, drucksache_nrn FROM berlin_speeches WHERE drucksache_nrn IS NOT NULL AND drucksache_nrn!=''").all() as any[]) {
    const tags: string[] = [];
    for (const dsnr of parseJsonTags(r.drucksache_nrn)) {
      const dbid = dokToDbid.get(dsnr); const tj = dbid ? blnDsThema.get(dbid) : null;
      if (tj) tags.push(...parseJsonTags(tj));
    }
    const f = fieldsFromTags(tags); if (f.size) { put("berlin_rede", r.speech_id, f, "inherited_ds"); n++; }
  }
  console.log(`berlin_rede (vererbt über dok_nr→dbid): ${n}`);

  // 5. BT Votes (offiziell poll_aw_topics + DS-Vererbung)
  n = 0;
  for (const r of db.prepare("SELECT poll_id, topics_json FROM poll_aw_topics").all() as any[]) {
    const f = new Map<string, string | null>(); for (const t of parseJsonTags(r.topics_json)) f.set(t, null);
    if (f.size) { put("bt_vote", r.poll_id, f, "official"); n++; }
  }
  for (const r of db.prepare(`SELECT dp.poll_id AS poll_id, GROUP_CONCAT(da.thema, ',') AS themen
      FROM drucksache_polls dp JOIN drucksache_analyses da ON da.drucksache_nr=dp.drucksache_nr AND da.thema IS NOT NULL
      WHERE dp.poll_id NOT IN (SELECT poll_id FROM poll_aw_topics) GROUP BY dp.poll_id`).all() as any[]) {
    const f = fieldsFromTags(splitThema(r.themen)); if (f.size) put("bt_vote", r.poll_id, f, "inherited_ds");
  }
  console.log(`bt_vote (offiziell+vererbt): ${n} offiziell`);

  // 6. Medien (related_bundestag_topics → map)
  n = 0;
  for (const file of fs.readdirSync("data/media-analyses").filter(f => f.endsWith(".json"))) {
    try {
      const d = JSON.parse(fs.readFileSync("data/media-analyses/" + file, "utf-8"));
      const tags: string[] = [];
      for (const th of d.analysis?.themes ?? []) for (const rt of th.related_bundestag_topics ?? []) if (typeof rt === "string") tags.push(rt);
      const f = fieldsFromTags(tags); if (f.size) { put("media", file.replace(".json", ""), f, "thema_map"); n++; }
    } catch {}
  }
  console.log(`media: ${n}`);
});
tx();

for (const [label, tbl] of [["BUNDESTAG (item_topics)", "item_topics"], ["BERLIN (berlin_item_topics)", "berlin_item_topics"]]) {
  console.log(`\n══════ ${label} ══════`);
  for (const r of db.prepare(`SELECT source, COUNT(DISTINCT item_id) items, COUNT(*) zuordnungen FROM ${tbl} GROUP BY source ORDER BY items DESC`).all() as any[])
    console.log(`  ${r.items.toString().padStart(6)} Items · ${r.zuordnungen} Zuordnungen · ${r.source}`);
  console.log(`  Σ ${(db.prepare(`SELECT COUNT(DISTINCT source||item_id) n FROM ${tbl}`).get() as any).n} klassifizierte Items`);
}
db.close();
