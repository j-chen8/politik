/**
 * Refresh-Skript: zieht für alle speech_summaries mit rede_id den Volltext
 * neu aus der XML — diesmal ohne den `klasse="redner"`-Header.
 *
 * Run: npx tsx scripts/refresh-original-text.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");

interface RedeContent {
  text: string;
}

function parseSession(xmlPath: string): Map<string, RedeContent> {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const map = new Map<string, RedeContent>();
  const redeRe = /<rede id="([^"]+)">([\s\S]*?)<\/rede>/g;
  let rm: RegExpExecArray | null;
  while ((rm = redeRe.exec(xml)) !== null) {
    const redeId = rm[1];
    const content = rm[2];
    const paragraphs: string[] = [];
    const pRe = /<p klasse="([^"]*)">([\s\S]*?)<\/p>/g;
    let pm: RegExpExecArray | null;
    while ((pm = pRe.exec(content)) !== null) {
      const klasse = pm[1];
      if (klasse === "redner") continue;
      const t = pm[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      if (t.startsWith("(Beifall") || t.startsWith("(Zuruf")) continue;
      paragraphs.push(t);
    }
    if (paragraphs.length > 0) map.set(redeId, { text: paragraphs.join("\n") });
  }
  return map;
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Alle XMLs vorparsen → Map: rede_id → text
  const xmlFiles = fs.readdirSync(XML_DIR).filter((f) => f.endsWith(".xml")).sort();
  const allRedes = new Map<string, RedeContent>();
  for (const f of xmlFiles) {
    const m = parseSession(path.join(XML_DIR, f));
    for (const [k, v] of m) allRedes.set(k, v);
  }
  console.log(`Geladen: ${allRedes.size} Reden aus ${xmlFiles.length} XML-Dateien`);

  // 1) Einzelreden refreshen
  const single = db.prepare(
    `SELECT id, rede_id FROM speech_summaries WHERE rede_id IS NOT NULL`
  ).all() as { id: number; rede_id: string }[];

  const update = db.prepare(`UPDATE speech_summaries SET original_text = ? WHERE id = ?`);
  let okSingle = 0, missSingle = 0;
  for (const r of single) {
    const rd = allRedes.get(r.rede_id);
    if (!rd) { missSingle++; continue; }
    update.run(rd.text, r.id);
    okSingle++;
  }
  console.log(`Einzelreden refresht: ${okSingle} ok, ${missSingle} ohne XML-Match`);

  // 2) Fragestunde-Aggregate (rede_ids) refreshen
  const aggregate = db.prepare(
    `SELECT id, rede_ids FROM speech_summaries WHERE rede_ids IS NOT NULL`
  ).all() as { id: number; rede_ids: string }[];

  let okAgg = 0, missAgg = 0;
  for (const r of aggregate) {
    const ids = r.rede_ids.split(",").map((x) => x.trim()).filter(Boolean);
    const parts: string[] = [];
    let any = false;
    for (const rid of ids) {
      const rd = allRedes.get(rid);
      if (rd) {
        parts.push(`[${rid}]\n${rd.text}`);
        any = true;
      }
    }
    if (!any) { missAgg++; continue; }
    update.run(parts.join("\n\n---\n\n"), r.id);
    okAgg++;
  }
  console.log(`Fragestunde-Aggregate refresht: ${okAgg} ok, ${missAgg} ohne Match`);

  db.close();
}

main();
