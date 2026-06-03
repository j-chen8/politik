/**
 * classify-topic-titles.ts — Themen-Klassifikation Gap b + c (nur Bundestag)
 * Klassifiziert freie Titel-Texte (Plenar-TOP-Titel + Vote-Audit-Topics) → AW-Feld
 * und füllt damit die Lücken in item_topics (bt_rede beschreibende TOPs, bt_vote).
 * Haiku 4.5, ~$0,05.
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";

if (!process.env.ANTHROPIC_API_KEY) {
  for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, "");
  }
}
const TAXONOMY = [
  "Arbeit und Beschäftigung", "Außenpolitik und internationale Beziehungen", "Außenwirtschaft",
  "Bildung und Erziehung", "Bundestag", "Energie", "Entwicklungspolitik",
  "Europapolitik und Europäische Union", "Gesellschaftspolitik, soziale Gruppen", "Gesundheit",
  "Innere Sicherheit", "Kultur", "Landwirtschaft und Ernährung",
  "Medien, Kommunikation und Informationstechnik", "Migration und Aufenthaltsrecht",
  "Neue Bundesländer", "Öffentliche Finanzen, Steuern und Abgaben", "Politisches Leben, Parteien",
  "Raumordnung, Bau- und Wohnungswesen", "Recht", "Soziale Sicherung", "Sport, Freizeit und Tourismus",
  "Staat und Verwaltung", "Umwelt", "Verkehr", "Verteidigung", "Wirtschaft",
  "Wissenschaft, Forschung und Technologie",
];
const TAXSET = new Set([...TAXONOMY, "UNKLAR"]);
const db = new Database("politik.db");

// Inputs: TOP-Titel (788) + Vote-Audit-Topics (distinct)
type Item = { kind: "top" | "audit"; key: string; text: string };
const items: Item[] = [];
for (const r of db.prepare("SELECT id, title FROM plenar_topics WHERE title IS NOT NULL").all() as any[])
  items.push({ kind: "top", key: String(r.id), text: r.title });
for (const r of db.prepare("SELECT DISTINCT topic FROM audit_bundestag_polls WHERE topic IS NOT NULL").all() as any[])
  items.push({ kind: "audit", key: r.topic, text: r.topic });
console.log(`Zu klassifizieren: ${items.length} Titel-Texte (${items.filter(i => i.kind === "top").length} TOPs + ${items.filter(i => i.kind === "audit").length} Audit-Topics)`);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM = `Du klassifizierst deutsche Bundestags-Titel (Tagesordnungspunkte, Abstimmungs-Themen) auf eine FESTE Politikfeld-Taxonomie (abgeordnetenwatch).

FELDER (genau eines, exakt buchstabiert):
${TAXONOMY.map(t => "- " + t).join("\n")}

REGELN:
- Ignoriere prozeduralen Vorspann ("Zweite und dritte Beratung des Entwurfs...", Abgeordneten-Namen) → klassifiziere nach dem SACHTHEMA.
- Genau ein Feld pro Titel.
- Reiner Verfahrenstitel OHNE Sachthema ("Beratung des Antrags der Abgeordneten X, Y", "Aktuelle Stunde", "Befragung der Bundesregierung") → "UNKLAR".`;
const TOOL = {
  name: "classify", description: "Feld pro Titel.",
  input_schema: { type: "object" as const, properties: { results: { type: "array", items: {
    type: "object", properties: { index: { type: "integer" }, aw_field: { type: "string" } }, required: ["index", "aw_field"] } } }, required: ["results"] },
};

db.exec(`CREATE TABLE IF NOT EXISTS topic_text_map (kind TEXT, key TEXT, aw_field TEXT, PRIMARY KEY (kind,key))`);
const insMap = db.prepare("INSERT OR REPLACE INTO topic_text_map (kind,key,aw_field) VALUES (?,?,?)");

async function main() {
  const already = (db.prepare("SELECT COUNT(*) n FROM topic_text_map").get() as any).n;
  if (already >= items.length) { console.log(`Bereits ${already} klassifiziert — überspringe LLM, nur Propagation.`); }
  else {
  const CHUNK = 40; let done = 0, unklar = 0;
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = items.slice(i, i + CHUNK);
    const resp = await client.messages.create({
      model: "claude-haiku-4-5", max_tokens: 4000, system: SYSTEM, tools: [TOOL],
      tool_choice: { type: "tool", name: "classify" },
      messages: [{ role: "user", content: batch.map((x, j) => `[${j}] ${x.text.slice(0, 160)}`).join("\n") }],
    });
    const tu: any = resp.content.find((b: any) => b.type === "tool_use");
    const by = new Map<number, string>();
    for (const r of tu.input.results) by.set(r.index, r.aw_field);
    batch.forEach((x, j) => {
      let f = by.get(j) ?? "UNKLAR"; if (!TAXSET.has(f)) f = "UNKLAR";
      if (f === "UNKLAR") unklar++;
      insMap.run(x.kind, x.key, f);
    });
    done += batch.length; process.stdout.write(`\r  ${done}/${items.length}`);
  }
  console.log(`\n✓ klassifiziert. UNKLAR (prozedural): ${unklar}`);
  }

  // ─── Propagation in item_topics (NUR Bundestag) ───
  const insIT = db.prepare("INSERT OR IGNORE INTO item_topics (source,item_id,aw_field,querschnitt,origin) VALUES (?,?,?,?,?)");
  // bt_rede: TOP-Titel-Feld an alle Reden des TOP (wo noch nicht abgedeckt)
  let reden = 0;
  const topMap = db.prepare("SELECT key, aw_field FROM topic_text_map WHERE kind='top' AND aw_field!='UNKLAR'").all() as any[];
  const getReden = db.prepare("SELECT DISTINCT rede_id FROM plenar_speeches WHERE topic_id=? AND rede_id IS NOT NULL");
  const tx1 = db.transaction(() => {
    for (const t of topMap) for (const r of getReden.all(t.key) as any[]) { insIT.run("bt_rede", String(r.rede_id), t.aw_field, null, "title_llm"); reden++; }
  });
  tx1();
  // bt_vote: Audit-Topic-Feld an Poll (bundestag_id→poll_id via vote_context)
  let votes = 0;
  const tx2 = db.transaction(() => {
    for (const a of db.prepare("SELECT key, aw_field FROM topic_text_map WHERE kind='audit' AND aw_field!='UNKLAR'").all() as any[]) {
      const polls = db.prepare(`SELECT DISTINCT vc.poll_id FROM audit_bundestag_polls ap JOIN vote_context vc ON vc.bundestag_id=ap.bundestag_id WHERE ap.topic=?`).all(a.key) as any[];
      for (const p of polls) { insIT.run("bt_vote", String(p.poll_id), a.aw_field, null, "official_specific"); votes++; }
    }
  });
  tx2();
  console.log(`Propagiert: +${reden} bt_rede-Zuordnungen, +${votes} bt_vote-Zuordnungen`);
  console.log(`\nBundestag item_topics jetzt: ${(db.prepare("SELECT COUNT(DISTINCT source||item_id) n FROM item_topics").get() as any).n} Items`);
  for (const r of db.prepare("SELECT source, COUNT(DISTINCT item_id) items FROM item_topics GROUP BY source ORDER BY items DESC").all() as any[])
    console.log(`  ${String(r.items).padStart(6)} · ${r.source}`);
}
main().then(() => db.close()).catch(e => { console.error(e); process.exit(1); });
