/**
 * classify-rede-summaries.ts — Reden ohne Einzel-Thema-Anker direkt aus der
 * 2-Satz-Zusammenfassung klassifizieren (General-/Haushalts-/Aktuelle-Stunde-Debatten).
 * Multi-Label (1–2 Felder) für breite Reden. Füllt item_topics / berlin_item_topics.
 *
 * Usage: npx tsx scripts/classify-rede-summaries.ts [--berlin] [--limit N]
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
const args = process.argv.slice(2);
const BERLIN = args.includes("--berlin");
const LIMIT = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : 0;
const db = new Database("politik.db");
const TABLE = BERLIN ? "berlin_item_topics" : "item_topics";
const SOURCE = BERLIN ? "berlin_rede" : "bt_rede";

// Unabgedeckte Reden mit Zusammenfassung holen
let rows: { id: string; sum: string }[];
if (BERLIN) {
  rows = (db.prepare(`SELECT bsa.speech_id AS id, bsa.zusammenfassung_2_saetze AS sum
    FROM berlin_speech_analyses bsa
    WHERE bsa.zusammenfassung_2_saetze IS NOT NULL AND bsa.zusammenfassung_2_saetze!=''
      AND CAST(bsa.speech_id AS TEXT) NOT IN (SELECT item_id FROM berlin_item_topics WHERE source='berlin_rede')`).all() as any[])
    .map(r => ({ id: String(r.id), sum: r.sum }));
} else {
  rows = (db.prepare(`SELECT rede_id AS id, zusammenfassung_2_saetze AS sum
    FROM speech_analyses_v2
    WHERE zusammenfassung_2_saetze IS NOT NULL AND zusammenfassung_2_saetze!='' AND rede_id IS NOT NULL
      AND rede_id NOT IN (SELECT item_id FROM item_topics WHERE source='bt_rede')
    GROUP BY rede_id`).all() as any[])
    .map(r => ({ id: String(r.id), sum: r.sum }));
}
if (LIMIT) rows = rows.slice(0, LIMIT);
console.log(`${BERLIN ? "BERLIN" : "BUNDESTAG"}: ${rows.length} unabgedeckte Reden zu klassifizieren`);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM = `Du klassifizierst deutsche Parlamentsreden (2-Satz-Zusammenfassung) auf eine FESTE Politikfeld-Taxonomie (abgeordnetenwatch).

FELDER (exakt buchstabiert):
${TAXONOMY.map(t => "- " + t).join("\n")}

REGELN:
- 1–2 Felder pro Rede, treffendstes zuerst. Nur bei klar mehreren Themen ein zweites Feld.
- Bei reiner Verfahrens-/Geschäftsordnungsrede ohne Sachthema: ["UNKLAR"].`;
const TOOL = {
  name: "classify", description: "Felder pro Rede.",
  input_schema: { type: "object" as const, properties: { results: { type: "array", items: {
    type: "object", properties: { index: { type: "integer" }, fields: { type: "array", items: { type: "string" } } },
    required: ["index", "fields"] } } }, required: ["results"] },
};
const insIT = db.prepare(`INSERT OR IGNORE INTO ${TABLE} (source,item_id,aw_field,querschnitt,origin) VALUES (?,?,?,?,?)`);

async function main() {
  const CHUNK = 40; let done = 0, unklar = 0, assigned = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const resp = await client.messages.create({
      model: "claude-haiku-4-5", max_tokens: 4000, system: SYSTEM, tools: [TOOL],
      tool_choice: { type: "tool", name: "classify" },
      messages: [{ role: "user", content: batch.map((x, j) => `[${j}] ${x.sum.slice(0, 220)}`).join("\n") }],
    });
    const tu: any = resp.content.find((b: any) => b.type === "tool_use");
    const by = new Map<number, string[]>();
    for (const r of tu.input.results) by.set(r.index, r.fields);
    const tx = db.transaction(() => {
      batch.forEach((x, j) => {
        const fields = (by.get(j) ?? ["UNKLAR"]).filter(f => TAXSET.has(f) && f !== "UNKLAR");
        if (!fields.length) { unklar++; return; }
        for (const f of fields) { insIT.run(SOURCE, x.id, f, null, "rede_summary"); assigned++; }
      });
    });
    tx();
    done += batch.length; process.stdout.write(`\r  ${done}/${rows.length}`);
  }
  console.log(`\n✓ ${done} Reden klassifiziert, ${assigned} Zuordnungen, ${unklar} UNKLAR (Verfahrensreden).`);
  const tot = (db.prepare(`SELECT COUNT(DISTINCT item_id) n FROM ${TABLE} WHERE source='${SOURCE}'`).get() as any).n;
  console.log(`${SOURCE} jetzt: ${tot} Items abgedeckt.`);
}
main().then(() => db.close()).catch(e => { console.error(e); process.exit(1); });
