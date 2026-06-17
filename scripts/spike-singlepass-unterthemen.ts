/**
 * SPIKE Sparweg: SINGLE-PASS-Unterthemen-Klassifikation (Kosten-Experiment).
 *
 * Testet, ob die GÜNSTIGE Verdrahtung die Präzision hält:
 *   (1) jede DS EINMAL klassifizieren (statt pro Feld) — Auswahl = Unterthemen ALLER
 *       Felder, deren Roh-Tag die DS trägt (löst „kern_im_feld" implizit: das Modell
 *       wählt das richtige Feld aus der Liste);
 *   (2) nur ZUSAMMENFASSUNG als Input (kein kerninhalt) — ~150 statt ~1.000 Token.
 *
 * DRY-RUN, Haiku live, kein DB-Write. Hand gegen die Per-Feld-Spikes vergleichen.
 *
 *   --limit N   Anzahl DS (Default 35)
 *   --estimate  nur Kosten, kein API-Call
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { TAXONOMIE_BERLIN } from "./_lib/themen-taxonomie-berlin";
import { BERLIN_THEMENFELDER_ALLE } from "../src/lib/berlin-themen-struktur";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const MODEL = "claude-haiku-4-5-20251001";
const argv = process.argv.slice(2);
const LIMIT = ((i) => i >= 0 ? parseInt(argv[i + 1], 10) : 35)(argv.indexOf("--limit"));
const ESTIMATE = argv.includes("--estimate");
const SEP = " ⟫ ";

// Roh-Tag → Feld-Label (jeder Tag gehört genau einem Feld)
const TAG2FELD = new Map<string, string>();
for (const f of BERLIN_THEMENFELDER_ALLE) for (const t of f.tags) TAG2FELD.set(t, f.label);

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
const rows = db.prepare(`
  SELECT dbid, klasse, thema_json, zusammenfassung
  FROM berlin_drucksachen_analyses
  WHERE klasse IS NOT NULL AND zusammenfassung IS NOT NULL
  ORDER BY substr(dbid, -2), dbid
  LIMIT ?
`).all(LIMIT) as { dbid: string; klasse: string; thema_json: string; zusammenfassung: string }[];

// Optionsliste je DS = Unterthemen der Felder, deren Tag die DS trägt
function feldOf(thema_json: string): string[] {
  let tags: string[] = []; try { tags = JSON.parse(thema_json); } catch { /* */ }
  const felder = new Set<string>();
  for (const t of tags) { const f = TAG2FELD.get(t); if (f) felder.add(f); }
  return [...felder];
}
function optionsFor(thema_json: string): string[] {
  const opts: string[] = [];
  for (const f of feldOf(thema_json)) for (const u of TAXONOMIE_BERLIN[f] ?? []) opts.push(`${f}${SEP}${u}`);
  opts.push("Sonstiges");
  return opts;
}

const SYSTEM = `Du klassifizierst Drucksachen des Berliner Abgeordnetenhauses in Unterthemen.
Du bekommst pro Drucksache eine LISTE erlaubter Optionen im Format „Politikfeld ⟫ Unterthema" — sie umfasst die Politikfelder, die diese Drucksache laut Verschlagwortung berührt.

Regeln:
- Wähle 1 bis 3 Optionen, die den INHALTLICHEN KERN treffen. Mehrere Felder sind erlaubt, wenn die DS sie wirklich behandelt.
- Wähle das SPEZIFISCHSTE passende Unterthema; breite Sammel-Cluster nur, wenn nichts Konkreteres greift.
- Passt KEINE Option zum Kern (die Tags waren nur Randbezug), wähle "Sonstiges". Zwinge nichts ins nächstklingende Cluster.
- Vergib zusätzlich 1–4 SPEZIFISCHE Tags (Eigennamen, Gesetze, Programme, Orte). Keine Einmal-Erfindungen, keine Sätze.
- Strikt neutral, grounde dich NUR im gegebenen Text.`;

function tool(options: string[]): Anthropic.Tool {
  return {
    name: "klassifiziere",
    description: "Wähle Unterthemen aus der Optionsliste + spezifische Tags.",
    input_schema: {
      type: "object",
      properties: {
        unterthemen: { type: "array", items: { type: "string", enum: options }, minItems: 1, maxItems: 3 },
        spezifische_tags: { type: "array", items: { type: "string" }, maxItems: 4 },
      },
      required: ["unterthemen", "spezifische_tags"],
    },
  };
}
function userText(r: { klasse: string; thema_json: string; zusammenfassung: string }, options: string[]): string {
  return `OPTIONEN (Politikfeld ⟫ Unterthema):\n${options.map((o) => `- ${o}`).join("\n")}\n\nKLASSE: ${r.klasse}\n\nZUSAMMENFASSUNG: ${r.zusammenfassung}`;
}

if (ESTIMATE) {
  let chars = 0; for (const r of rows) { const o = optionsFor(r.thema_json); chars += SYSTEM.length + userText(r, o).length; }
  const inTok = Math.round(chars / 4) + rows.length * 200;
  console.log(`ESTIMATE Single-Pass: ${rows.length} DS · ~${inTok.toLocaleString()} in → ~$${((inTok / 1e6) + (rows.length * 130 / 1e6) * 5).toFixed(3)} live`);
  process.exit(0);
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

console.log(`SPIKE Single-Pass (1 Call/DS, nur Zusammenfassung) — ${rows.length} DS, ${MODEL}\n`);
const feldHits = new Map<string, number>();
let sonstiges = 0, multiFeld = 0, inTok = 0, outTok = 0;

async function main() {
for (const r of rows) {
  const options = optionsFor(r.thema_json);
  const resp = await client.messages.create({
    model: MODEL, max_tokens: 300, system: SYSTEM,
    tools: [tool(options)], tool_choice: { type: "tool", name: "klassifiziere" },
    messages: [{ role: "user", content: userText(r, options) }],
  });
  inTok += resp.usage.input_tokens; outTok += resp.usage.output_tokens;
  const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
  const out = (block?.input ?? {}) as { unterthemen?: string[]; spezifische_tags?: string[] };
  const picks = out.unterthemen ?? [];
  const felderGewaehlt = new Set(picks.filter((p) => p !== "Sonstiges").map((p) => p.split(SEP)[0]));
  if (picks.includes("Sonstiges")) sonstiges++;
  if (felderGewaehlt.size > 1) multiFeld++;
  for (const f of felderGewaehlt) feldHits.set(f, (feldHits.get(f) ?? 0) + 1);
  console.log(`${r.dbid} [${r.klasse}]  (Tag-Felder: ${feldOf(r.thema_json).join(", ")})`);
  console.log(`  → ${picks.join("  |  ")}`);
  console.log(`    {${(out.spezifische_tags ?? []).join(", ")}}`);
  console.log(`  ${r.zusammenfassung.slice(0, 130)}…\n`);
}
console.log("─".repeat(60));
console.log(`Sonstiges: ${sonstiges}/${rows.length} (${(100 * sonstiges / rows.length).toFixed(0)} %)  ·  Multi-Feld-Zuordnung: ${multiFeld}/${rows.length}`);
console.log(`Felder getroffen: ${[...feldHits.entries()].sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f.split(",")[0].split(" ")[0]}=${n}`).join(" · ")}`);
console.log(`Tokens: ${inTok} in / ${outTok} out  (~$${((inTok / 1e6) + (outTok / 1e6) * 5).toFixed(3)} live; Batch+Cache ~1/3 davon)`);
}
main();
