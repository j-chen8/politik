/**
 * GLOBAL-Batch (Berlin Themen-Achse, Stufe 7): Single-Pass-Unterthemen-Klassifikation
 * über ALLE Drucksachen, Anthropic Batch API + Prompt-Caching.
 *
 * Ansatz (validiert in spike-singlepass-unterthemen.ts, ~95 % Hand-Präzision):
 *   - 1 Call je DS (nicht je Feld). Auswahl = Unterthemen ALLER Felder, deren Roh-Tag
 *     die DS trägt → das Modell wählt das richtige Feld selbst (löst kern_im_feld implizit).
 *   - Nur ZUSAMMENFASSUNG als Input (kein kerninhalt) — Token sparen.
 *   - Die VOLLE Taxonomie + Regeln stehen GECACHT im System-Prompt (1× statt 19k×);
 *     die per-DS-Nachricht nennt nur die relevanten Felder + Zusammenfassung.
 *   - Post-Validierung: Picks außerhalb der Tag-Felder der DS werden verworfen.
 *
 * Schreibt berlin_ds_unterthemen (dbid, feld) — ersetzt die Wohnen-Pilot-Daten durch
 * die einheitliche Single-Pass-Klassifikation. Jede geschriebene Zeile ist kern (das
 * Modell hat das Feld aktiv gewählt).
 *
 * Usage:
 *   npx tsx scripts/batch-unterthemen-global-berlin.ts --estimate
 *   npx tsx scripts/batch-unterthemen-global-berlin.ts --spike [--limit 20]   # live, kein DB-Write
 *   npx tsx scripts/batch-unterthemen-global-berlin.ts --submit
 *   npx tsx scripts/batch-unterthemen-global-berlin.ts --status
 *   npx tsx scripts/batch-unterthemen-global-berlin.ts --apply
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { TAXONOMIE_BERLIN } from "./_lib/themen-taxonomie-berlin";
import { BERLIN_THEMENFELDER_ALLE } from "../src/lib/berlin-themen-struktur";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const MODEL = "claude-haiku-4-5-20251001";
const STATE_FILE = path.join(process.cwd(), "scripts", ".batch-unterthemen-global-berlin.json");
const SEP = " ⟫ ";

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const LIMIT = ((i) => i >= 0 ? parseInt(args[i + 1], 10) : 20)(args.indexOf("--limit"));

// ── Taxonomie-Welt ──
const TAG2FELD = new Map<string, string>();
for (const f of BERLIN_THEMENFELDER_ALLE) for (const t of f.tags) TAG2FELD.set(t, f.label);
const ALL_OPTIONS: string[] = [];
for (const f of BERLIN_THEMENFELDER_ALLE) for (const u of TAXONOMIE_BERLIN[f.label] ?? []) ALL_OPTIONS.push(`${f.label}${SEP}${u}`);
ALL_OPTIONS.push("Sonstiges");
const OPTION_SET = new Set(ALL_OPTIONS);

const TAXONOMIE_TEXT = BERLIN_THEMENFELDER_ALLE.map((f) =>
  `■ ${f.label}\n${(TAXONOMIE_BERLIN[f.label] ?? []).map((u) => `   - ${u}`).join("\n")}`
).join("\n");

// System-Prompt MIT voller Taxonomie → gecacht (konstant über alle Requests)
const SYSTEM_TEXT = `Du klassifizierst Drucksachen des Berliner Abgeordnetenhauses in Unterthemen.

Jede Drucksache nennt dir die Politikfelder, die sie laut Verschlagwortung berührt. Wähle Unterthemen NUR aus diesen genannten Feldern, im Format „Politikfeld ⟫ Unterthema".

Regeln:
- Wähle 1 bis 3 Optionen, die den INHALTLICHEN KERN treffen. Mehrere Felder erlaubt, wenn die DS sie wirklich behandelt.
- Wähle das SPEZIFISCHSTE passende Unterthema; breite Sammel-Cluster nur, wenn nichts Konkreteres greift (eine ÖPNV-Anbindung → „ÖPNV", nicht „Verkehrsplanung").
- Passt KEINE Option zum Kern (die Tags waren nur Randbezug), wähle "Sonstiges". Zwinge nichts ins nächstklingende Cluster.
- Vergib zusätzlich 1–4 SPEZIFISCHE Tags (Eigennamen, Gesetze, Programme, Orte). Keine Einmal-Erfindungen, keine ganzen Sätze.
- Strikt neutral, grounde dich NUR im gegebenen Text.

VOLLSTÄNDIGE TAXONOMIE (alle Politikfelder und ihre Unterthemen):
${TAXONOMIE_TEXT}`;

const TOOL: Anthropic.Tool = {
  name: "klassifiziere",
  description: "Wähle Unterthemen im Format Politikfeld ⟫ Unterthema aus den genannten Feldern, plus 1-4 spezifische Tags.",
  input_schema: {
    type: "object",
    properties: {
      unterthemen: { type: "array", items: { type: "string", enum: ALL_OPTIONS }, minItems: 1, maxItems: 3 },
      spezifische_tags: { type: "array", items: { type: "string" }, maxItems: 4 },
    },
    required: ["unterthemen", "spezifische_tags"],
  },
};

function feldOf(thema_json: string): string[] {
  let tags: string[] = []; try { tags = JSON.parse(thema_json); } catch { /* */ }
  const felder = new Set<string>();
  for (const t of tags) { const f = TAG2FELD.get(t); if (f) felder.add(f); }
  return [...felder];
}
function userMsg(felder: string[], zusammenfassung: string): string {
  return `FELDER DIESER DRUCKSACHE (nur hieraus wählen): ${felder.join(" · ")}\n\nZUSAMMENFASSUNG: ${zusammenfassung}`;
}

interface Row { dbid: string; thema_json: string; zusammenfassung: string; felder: string[] }
function loadRows(): Row[] {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  const raw = db.prepare(`
    SELECT dbid, thema_json, zusammenfassung FROM berlin_drucksachen_analyses
    WHERE klasse IS NOT NULL AND zusammenfassung IS NOT NULL AND thema_json IS NOT NULL
    ORDER BY dbid
  `).all() as { dbid: string; thema_json: string; zusammenfassung: string }[];
  db.close();
  return raw.map((r) => ({ ...r, felder: feldOf(r.thema_json) })).filter((r) => r.felder.length > 0);
}

function reqParams(r: Row): Anthropic.Messages.MessageCreateParamsNonStreaming {
  return {
    model: MODEL, max_tokens: 300,
    system: [{ type: "text", text: SYSTEM_TEXT, cache_control: { type: "ephemeral" } }],
    tools: [TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
    messages: [{ role: "user", content: userMsg(r.felder, r.zusammenfassung) }],
  };
}

// Picks → {feld → unterthemen[]}, nur Picks innerhalb der Tag-Felder der DS
function parsePicks(picks: string[], felder: Set<string>): Map<string, string[]> {
  const byFeld = new Map<string, string[]>();
  for (const p of picks) {
    if (p === "Sonstiges" || !OPTION_SET.has(p)) continue;
    const idx = p.indexOf(SEP); if (idx < 0) continue;
    const feld = p.slice(0, idx), unter = p.slice(idx + SEP.length);
    if (!felder.has(feld)) continue; // außerhalb der DS-Felder → verwerfen
    const list = byFeld.get(feld) ?? []; if (!list.includes(unter)) list.push(unter); byFeld.set(feld, list);
  }
  return byFeld;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

async function estimate() {
  const rows = loadRows();
  let chars = 0; for (const r of rows) chars += userMsg(r.felder, r.zusammenfassung).length;
  const uniqueIn = Math.round(chars / 3.3) + rows.length * 60;        // per-DS (unique), DE-dicht
  const cachedTok = Math.round(SYSTEM_TEXT.length / 3.3) + 1800;      // System+Taxonomie+Tool-Enum, 1× geschrieben, N× gelesen
  const out = rows.length * 150;
  // Batch: in $0.5/M, out $2.5/M; Cache-Read ~$0.1/M (Haiku, grob)
  const usd = (uniqueIn / 1e6) * 0.5 + (cachedTok * rows.length / 1e6) * 0.1 + (cachedTok / 1e6) * 0.5 * 1.25 + (out / 1e6) * 2.5;
  console.log(`ESTIMATE Global Single-Pass:`);
  console.log(`  DS gesamt:        ${rows.length}`);
  console.log(`  Cache-Block:      ~${cachedTok.toLocaleString()} Token (System+Taxonomie+Tool, 1× geschrieben / ${rows.length}× gelesen)`);
  console.log(`  Unique-Input:     ~${uniqueIn.toLocaleString()} Token gesamt`);
  console.log(`  Output:           ~${out.toLocaleString()} Token`);
  console.log(`  Kosten (Batch+Cache): ~$${usd.toFixed(2)}   ⚠️ grob — echte Zahl via --spike`);
}

async function spike() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
  const rows = loadRows();
  // Spread-Stichprobe statt erste N
  const step = Math.max(1, Math.floor(rows.length / LIMIT));
  const sample = rows.filter((_, i) => i % step === 0).slice(0, LIMIT);
  console.log(`SPIKE (exakter Batch-Prompt, live) — ${sample.length} DS\n`);
  let inTok = 0, cacheRead = 0, cacheWrite = 0, outTok = 0, sonstiges = 0;
  for (const r of sample) {
    const resp = await client.messages.create(reqParams(r));
    const u = resp.usage;
    inTok += u.input_tokens; outTok += u.output_tokens;
    cacheRead += u.cache_read_input_tokens ?? 0; cacheWrite += u.cache_creation_input_tokens ?? 0;
    const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
    const picks = ((block?.input ?? {}) as { unterthemen?: string[] }).unterthemen ?? [];
    const byFeld = parsePicks(picks, new Set(r.felder));
    if (![...byFeld.keys()].length) sonstiges++;
    console.log(`${r.dbid}  (Felder: ${r.felder.join(", ")})`);
    console.log(`  → ${[...byFeld.entries()].map(([f, us]) => `${f.split(",")[0].split(" ")[0]}: ${us.join("/")}`).join("  |  ") || "Sonstiges"}`);
    console.log(`  ${r.zusammenfassung.slice(0, 110)}…\n`);
  }
  const n = sample.length;
  // input_tokens enthält die Cache-Tokens NICHT (cache_read ist separat) → nicht abziehen.
  // Batch = 50 % off: in $0.50/M · out $2.50/M · cache-read $0.05/M (Haiku, batch-rabattiert).
  const perItemUnique = inTok / n, perItemOut = outTok / n, perItemCacheRead = cacheRead / n;
  const all = loadRows().length;
  const proj = (perItemUnique * all / 1e6) * 0.5 + (perItemCacheRead * all / 1e6) * 0.05 + (perItemOut * all / 1e6) * 2.5;
  void cacheWrite;
  console.log(`─ Token (live-Mittel/DS): unique ${perItemUnique.toFixed(0)} · cache-read ${perItemCacheRead.toFixed(0)} · out ${perItemOut.toFixed(0)}`);
  console.log(`  Sonstiges/leer: ${sonstiges}/${n}`);
  console.log(`  → Projektion Voll-Batch (${all} DS, Batch+Cache): ~$${proj.toFixed(2)}`);
}

async function submit() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
  const rows = loadRows();
  console.log(`Submit: ${rows.length} DS, ${MODEL}, Batch API + Caching`);
  const requests = rows.map((r) => ({ custom_id: r.dbid, params: reqParams(r) }));
  const batch = await client.messages.batches.create({ requests });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ batch_id: batch.id, count: rows.length }, null, 2));
  console.log(`Batch: ${batch.id} (${rows.length}) — --status / --apply`);
}

function readState(): { batch_id: string } {
  if (!fs.existsSync(STATE_FILE)) { console.error("Kein State — erst --submit."); process.exit(1); }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}
async function status() {
  const b = await client.messages.batches.retrieve(readState().batch_id);
  console.log(`${b.id}: ${b.processing_status} — ${JSON.stringify(b.request_counts)}`);
}

async function apply() {
  const { batch_id } = readState();
  const b = await client.messages.batches.retrieve(batch_id);
  if (b.processing_status !== "ended") { console.log(`Noch nicht fertig: ${b.processing_status} ${JSON.stringify(b.request_counts)}`); return; }
  const felderByDbid = new Map(loadRows().map((r) => [r.dbid, new Set(r.felder)]));

  const writes: { dbid: string; feld: string; unter: string[]; tags: string[] }[] = [];
  let ok = 0, errored = 0, leer = 0;
  const unterCount = new Map<string, number>();
  for await (const res of await client.messages.batches.results(batch_id)) {
    if (res.result.type !== "succeeded") { errored++; continue; }
    const block = res.result.message.content.find((c) => c.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
    const out = (block?.input ?? {}) as { unterthemen?: string[]; spezifische_tags?: string[] };
    const felder = felderByDbid.get(res.custom_id) ?? new Set<string>();
    const byFeld = parsePicks(out.unterthemen ?? [], felder);
    const tags = (out.spezifische_tags ?? []).map((t) => String(t).trim()).filter(Boolean);
    if (![...byFeld.keys()].length) { leer++; ok++; continue; } // alles Sonstiges → keine Feld-Zeile
    for (const [feld, unter] of byFeld) {
      writes.push({ dbid: res.custom_id, feld, unter, tags });
      for (const u of unter) unterCount.set(`${feld}${SEP}${u}`, (unterCount.get(`${feld}${SEP}${u}`) ?? 0) + 1);
    }
    ok++;
  }
  console.log(`Ergebnisse: ${ok} ok · ${errored} Fehler · ${leer} nur-Sonstiges`);
  if (errored > ok * 0.02) { console.error(`ABBRUCH: ${errored} Fehler (>2 %). Erst klären, kein DB-Write.`); return; }

  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.exec(`CREATE TABLE IF NOT EXISTS berlin_ds_unterthemen (
      dbid TEXT NOT NULL, feld TEXT NOT NULL, unterthemen_json TEXT NOT NULL,
      spezifische_tags_json TEXT NOT NULL, kern_im_feld INTEGER, model TEXT, batch_id TEXT,
      created_at TEXT DEFAULT (datetime('now')), PRIMARY KEY (dbid, feld));`);
  const ins = db.prepare(`INSERT INTO berlin_ds_unterthemen (dbid, feld, unterthemen_json, spezifische_tags_json, kern_im_feld, model, batch_id)
      VALUES (?, ?, ?, ?, 1, ?, ?) ON CONFLICT(dbid, feld) DO UPDATE SET
      unterthemen_json=excluded.unterthemen_json, spezifische_tags_json=excluded.spezifische_tags_json,
      kern_im_feld=1, model=excluded.model, batch_id=excluded.batch_id, created_at=datetime('now')`);
  const tx = db.transaction(() => {
    db.exec("DELETE FROM berlin_ds_unterthemen"); // Single-Pass reklassifiziert ALLES → sauberer Reset
    for (const w of writes) ins.run(w.dbid, w.feld, JSON.stringify(w.unter), JSON.stringify(w.tags), MODEL, batch_id);
  });
  tx();
  db.close();
  console.log(`\n✅ ${writes.length} (dbid,feld)-Zeilen geschrieben.`);
  console.log(`Top-Unterthemen:`);
  for (const [k, n] of [...unterCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${(n + "").padStart(4)}  ${k}`);
}

async function main() {
  if (has("--estimate")) await estimate();
  else if (has("--spike")) await spike();
  else if (has("--submit")) await submit();
  else if (has("--status")) await status();
  else if (has("--apply")) await apply();
  else console.log("Usage: --estimate | --spike | --submit | --status | --apply");
}
main();
