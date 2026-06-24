/**
 * build-topic-tag-map.ts — Themen-Klassifikation Schritt A+B
 * Mappt das distinct Einzel-Tag-Vokabular (BT-thema + Berlin-thema_json + Medien)
 * EINMAL auf die kanonische AW-Politikfeld-Taxonomie (+ optionales Querschnitt-Label).
 * Ergebnis in Tabelle topic_tag_map → wird später an alle Items vererbt.
 *
 * Usage: npx tsx scripts/build-topic-tag-map.ts [--limit N] [--dry]
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

// ─── A: kanonische AW-Politikfelder (22 in DB bestätigt + 6 Standard) ───
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
// Querschnittsthemen (Achse 2, schneiden quer durch Politikfelder)
const QUERSCHNITT = ["Klima", "Digitalisierung", "Europa", "Datenschutz", "Gleichstellung", "Ostdeutschland"];

const args = process.argv.slice(2);
const LIMIT = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1]) : 0;
const DRY = args.includes("--dry");

const db = new Database("politik.db");
db.exec(`CREATE TABLE IF NOT EXISTS topic_tag_map (
  tag TEXT PRIMARY KEY,
  aw_field TEXT NOT NULL,
  querschnitt TEXT,
  occurrences INTEGER,
  confidence TEXT,
  model TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// ─── Vokabular sammeln (häufigste zuerst) ───
const tags = new Map<string, number>();
const add = (t: string) => { t = t.trim(); if (t) tags.set(t, (tags.get(t) ?? 0) + 1); };
for (const r of db.prepare("SELECT thema FROM drucksache_analyses WHERE thema IS NOT NULL").all() as any[])
  for (const x of String(r.thema).split(",")) add(x);
for (const r of db.prepare("SELECT thema_json FROM berlin_drucksachen_analyses WHERE thema_json IS NOT NULL").all() as any[]) {
  try { for (const x of JSON.parse(r.thema_json)) if (typeof x === "string") add(x); } catch {}
}
for (const f of fs.readdirSync("data/media-analyses").filter(f => f.endsWith(".json"))) {
  try {
    const d = JSON.parse(fs.readFileSync("data/media-analyses/" + f, "utf-8"));
    for (const th of d.analysis?.themes ?? []) for (const rt of th.related_bundestag_topics ?? []) if (typeof rt === "string") add(rt);
  } catch {}
}
let vocab = [...tags.entries()].sort((a, b) => b[1] - a[1]);
if (LIMIT) vocab = vocab.slice(0, LIMIT);
console.log(`Vokabular: ${vocab.length} distinct Tags`);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM = `Du mappst deutsche Politik-Stichwörter auf eine FESTE Politikfeld-Taxonomie (abgeordnetenwatch-Standard, Bundestag + Berliner Abgeordnetenhaus).

AW-POLITIKFELDER (genau eines pro Tag, exakt buchstabiert):
${TAXONOMY.map(t => "- " + t).join("\n")}

QUERSCHNITT (optional, zusätzlich, wenn das Tag quer durch Felder schneidet — sonst null):
${QUERSCHNITT.join(", ")}

REGELN:
- Jedem Tag GENAU EIN bestes AW-Feld zuordnen (Berlin-Lokalbegriffe: Bezirke/Liegenschaften/Stadtentwicklung/Bauplanung → "Raumordnung, Bau- und Wohnungswesen"; ÖPNV/Mobilität/Verkehrssicherheit → "Verkehr"; Verwaltung → "Staat und Verwaltung").
- querschnitt nur setzen wenn eindeutig (Klimaschutz→Klima, Digitalisierung→Digitalisierung, EU→Europa, Datenschutz→Datenschutz, Gleichstellung/Antidiskriminierung→Gleichstellung), sonst null.
- Kein Sachthema (Floskel/Verfahren/Name) → aw_field "UNKLAR".`;

const TOOL = {
  name: "map_tags",
  description: "Mappe jedes Tag auf ein AW-Feld.",
  input_schema: {
    type: "object" as const,
    properties: {
      mappings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tag: { type: "string" },
            aw_field: { type: "string" },
            querschnitt: { type: ["string", "null"] },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["tag", "aw_field", "confidence"],
        },
      },
    },
    required: ["mappings"],
  },
};

const TAXSET = new Set([...TAXONOMY, "UNKLAR"]);

// Manuelle Overrides — gewinnen über die LLM-Zuordnung und überleben jeden Re-Run.
// Korrigieren systematische Fehl-Mappings, die der LLM wiederholt produziert.
// 2026-06-15: generische "Infrastruktur"-Tags landeten fälschlich im Sachgebiet
// "Raumordnung, Bau- und Wohnungswesen" → 184 Fremd-Items im /analyse-Topic-Matrix
// (Infrastruktur ist zu generisch für Raumordnung; Investitionen = Finanzthema).
const OVERRIDES: Record<string, string> = {
  // Bund: generische Infrastruktur-Tags gehören nicht ins Raumordnungs-Sachgebiet.
  "Infrastruktur": "UNKLAR",
  "Infrastrukturpolitik": "UNKLAR",
  "Infrastruktur-Unterschiede": "UNKLAR",
  "Infrastrukturinvestitionen": "Öffentliche Finanzen, Steuern und Abgaben",
  "Infrastruktur-Investitionen": "Öffentliche Finanzen, Steuern und Abgaben",
  "Kommunale Infrastruktur": "Staat und Verwaltung",
  // Berlin: "Bezirke" ist ein reiner Orts-Marker (klebt an fast jeder lokalen Anfrage:
  // Bäume, Ampeln, Gesundheit, Verkehr) — KEIN Politikfeld. Mappte fälschlich auf
  // Raumordnung → 2431 Fremd-Items im Wohn/Raumordnung-Feld (2026-06-15).
  "Bezirke": "UNKLAR",
};

const ins = db.prepare("INSERT OR REPLACE INTO topic_tag_map (tag,aw_field,querschnitt,occurrences,confidence,model) VALUES (?,?,?,?,?,?)");
const CHUNK = 50;

async function main() {
  let done = 0, unklar = 0, badField = 0;
  const fieldCount: Record<string, number> = {};
  for (let i = 0; i < vocab.length; i += CHUNK) {
    const batch = vocab.slice(i, i + CHUNK);
    const resp = await client.messages.create({
      model: "claude-haiku-4-5", max_tokens: 8000, system: SYSTEM, tools: [TOOL],
      tool_choice: { type: "tool", name: "map_tags" },
      messages: [{ role: "user", content: batch.map(([t]) => "- " + t).join("\n") }],
    });
    const tu: any = resp.content.find((b: any) => b.type === "tool_use");
    const got = new Map<string, any>();
    for (const m of tu.input.mappings) got.set(m.tag, m);
    for (const [tag, occ] of batch) {
      const m = got.get(tag);
      let field = m?.aw_field ?? "UNKLAR";
      if (!TAXSET.has(field)) { badField++; field = "UNKLAR"; }
      if (OVERRIDES[tag]) field = OVERRIDES[tag];   // manueller Override gewinnt
      if (field === "UNKLAR") unklar++;
      fieldCount[field] = (fieldCount[field] ?? 0) + 1;
      if (!DRY) ins.run(tag, field, m?.querschnitt ?? null, occ, m?.confidence ?? "low", "claude-haiku-4-5");
    }
    done += batch.length;
    process.stdout.write(`\r  gemappt: ${done}/${vocab.length}`);
  }
  console.log(`\n\n✓ ${done} Tags gemappt${DRY ? " (DRY, nicht gespeichert)" : " → topic_tag_map"}`);
  console.log(`  UNKLAR: ${unklar} | ungültiges Feld korrigiert: ${badField}`);
  console.log(`\nVerteilung über AW-Felder (Top 15, gewichtet nach Vorkommen):`);
  // gewichtete Verteilung
  if (!DRY) {
    const dist = db.prepare("SELECT aw_field, COUNT(*) tags, SUM(occurrences) items FROM topic_tag_map GROUP BY aw_field ORDER BY items DESC LIMIT 15").all() as any[];
    for (const d of dist) console.log(`  ${String(d.items).padStart(7)} Vorkommen · ${String(d.tags).padStart(4)} Tags · ${d.aw_field}`);
  }
}
main().then(() => db.close()).catch(e => { console.error(e); process.exit(1); });
