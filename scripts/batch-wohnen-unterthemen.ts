/**
 * Pilot-Batch: Berlin-Wohnen-Unterthemen über die Anthropic Batch API (50 % off).
 *
 * Klassifiziert alle Wohnen-getaggten Berlin-Drucksachen (berlin_drucksachen_analyses,
 * thema_json enthält "Wohnen", ~2.414 Items) in {unterthemen[] (geschlossen, 12+Sonstiges)
 * + spezifische_tags[] (offen) + kern_im_feld}. Taxonomie/Prompt/Tool geteilt mit dem
 * validierten Spike: scripts/_lib/unterthemen-wohnen-berlin.ts (Stufe 4 bestanden,
 * docs/themen-unterthemen-berlin.md).
 *
 * Schreibt nach berlin_ds_unterthemen (PK dbid+feld, multi-feld-fähig für spätere Felder).
 * kern_im_feld=false-Items sind die Putzliste des Feld-Rollups.
 *
 * Usage:
 *   npx tsx scripts/batch-wohnen-unterthemen.ts --estimate   # gratis: Items + Token/Kosten
 *   npx tsx scripts/batch-wohnen-unterthemen.ts --submit
 *   npx tsx scripts/batch-wohnen-unterthemen.ts --status
 *   npx tsx scripts/batch-wohnen-unterthemen.ts --apply
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { FELD, SYSTEM, TOOL, buildUserText, normalizeUnterthema, type WohnenRow } from "./_lib/unterthemen-wohnen-berlin";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const STATE_FILE = path.join(process.cwd(), "scripts", ".batch-wohnen-unterthemen.json");

const args = process.argv.slice(2);
const DO_ESTIMATE = args.includes("--estimate");
const DO_SUBMIT = args.includes("--submit");
const DO_STATUS = args.includes("--status");
const DO_APPLY = args.includes("--apply");

interface Row extends WohnenRow { dbid: string }

function loadRows(): Row[] {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  const rows = db.prepare(`
    SELECT dbid, klasse, thema_json, zusammenfassung,
           kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json
    FROM berlin_drucksachen_analyses
    WHERE thema_json LIKE '%"Wohnen"%' AND zusammenfassung IS NOT NULL
    ORDER BY dbid
  `).all() as Row[];
  db.close();
  return rows;
}

// gratis: grobe Token-/Kostenschätzung vor dem Submit (Batch API = 50 % off).
// Haiku 4.5: $1/M in, $5/M out (Batch: halbiert). System-Prompt wird pro Request
// mitgezählt (kein cache_control im Pilot — lohnt erst global).
function estimate(rows: Row[]) {
  let chars = 0;
  for (const r of rows) chars += (SYSTEM.length + buildUserText(r).length);
  const inTok = Math.round(chars / 4);              // ~4 Zeichen/Token (DE konservativ)
  const outTok = rows.length * 130;                 // Spike-Mittel ~133 out/Item
  const usd = (inTok / 1e6) * 1 * 0.5 + (outTok / 1e6) * 5 * 0.5;
  console.log(`ESTIMATE Wohnen-Pilot:`);
  console.log(`  Items:        ${rows.length}`);
  console.log(`  Input-Token:  ~${inTok.toLocaleString()} (inkl. System je Request)`);
  console.log(`  Output-Token: ~${outTok.toLocaleString()} (à ~130)`);
  console.log(`  Kosten Batch: ~$${usd.toFixed(2)}  (Haiku 4.5, 50 % Batch-Rabatt)`);
  console.log(`  Live-Vergleich (Spike 40 DS): $0,134 → hochskaliert grob $${(0.134 / 40 * rows.length).toFixed(2)} ohne Batch-Rabatt`);
}

if (!DO_ESTIMATE && !process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

async function submit() {
  const rows = loadRows();
  console.log(`Submit: ${rows.length} Drucksachen (Feld ${FELD}), Modell ${MODEL}, Batch API`);
  const requests: Anthropic.Messages.Batches.BatchCreateParams.Request[] = rows.map((r) => ({
    custom_id: r.dbid, // dbid (z.B. "D-453438") ist ein valider custom_id [a-zA-Z0-9_-]
    params: {
      model: MODEL, max_tokens: 400, system: SYSTEM,
      tools: [TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
      messages: [{ role: "user", content: buildUserText(r) }],
    },
  }));
  const batch = await client.messages.batches.create({ requests });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ batch_id: batch.id, submitted_at: new Date().toISOString(), count: rows.length }, null, 2));
  console.log(`Batch submitted: ${batch.id} (${rows.length} Requests) — Status via --status, Ergebnis via --apply`);
}

function readState(): { batch_id: string } {
  if (!fs.existsSync(STATE_FILE)) { console.error("Kein State-File — erst --submit."); process.exit(1); }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

async function status() {
  const { batch_id } = readState();
  const b = await client.messages.batches.retrieve(batch_id);
  console.log(`Batch ${batch_id}: ${b.processing_status}`);
  console.log(`  counts: ${JSON.stringify(b.request_counts)}`);
}

async function apply() {
  const { batch_id } = readState();
  const b = await client.messages.batches.retrieve(batch_id);
  if (b.processing_status !== "ended") { console.log(`Noch nicht fertig: ${b.processing_status} — ${JSON.stringify(b.request_counts)}`); return; }

  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS berlin_ds_unterthemen (
      dbid TEXT NOT NULL,
      feld TEXT NOT NULL,
      unterthemen_json TEXT NOT NULL,
      spezifische_tags_json TEXT NOT NULL,
      kern_im_feld INTEGER,
      model TEXT,
      batch_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (dbid, feld)
    );
    CREATE INDEX IF NOT EXISTS idx_berlin_ds_unterthemen_feld ON berlin_ds_unterthemen(feld, kern_im_feld);
  `);
  const upsert = db.prepare(`
    INSERT INTO berlin_ds_unterthemen (dbid, feld, unterthemen_json, spezifische_tags_json, kern_im_feld, model, batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(dbid, feld) DO UPDATE SET
      unterthemen_json=excluded.unterthemen_json, spezifische_tags_json=excluded.spezifische_tags_json,
      kern_im_feld=excluded.kern_im_feld, model=excluded.model, batch_id=excluded.batch_id,
      created_at=datetime('now')
  `);

  let ok = 0, drift = 0, errored = 0, leer = 0, fremd = 0;
  const unterCount = new Map<string, number>();
  for await (const result of await client.messages.batches.results(batch_id)) {
    if (result.result.type !== "succeeded") { errored++; console.error(`  ✗ ${result.custom_id}: ${result.result.type}`); continue; }
    const msg = result.result.message;
    const block = msg.content.find((c) => c.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
    const out = (block?.input ?? {}) as { unterthemen?: string[]; spezifische_tags?: string[]; kern_im_feld?: boolean };
    const rawUnter = out.unterthemen ?? [];
    const unter = rawUnter.map(normalizeUnterthema).filter((u): u is string => u !== null);
    if (unter.length !== rawUnter.length) drift++;
    if (unter.length === 0) { leer++; console.error(`  ⚠ ${result.custom_id}: keine validen Unterthemen (roh: ${rawUnter.join("|")})`); continue; }
    const tags = (out.spezifische_tags ?? []).map((t) => String(t).trim()).filter(Boolean);
    const kern = out.kern_im_feld === false ? 0 : out.kern_im_feld === true ? 1 : null;
    if (kern === 0) fremd++;
    upsert.run(result.custom_id, FELD, JSON.stringify(unter), JSON.stringify(tags), kern, MODEL, batch_id);
    for (const u of unter) unterCount.set(u, (unterCount.get(u) ?? 0) + 1);
    ok++;
  }
  db.close();

  console.log(`\nApply fertig: ${ok} gespeichert · ${errored} Fehler · ${leer} ohne valide Unterthemen · ${drift} mit Enum-Drift (normalisiert)`);
  console.log(`kern_im_feld=false: ${fremd} (${(100 * fremd / Math.max(1, ok)).toFixed(0)} % — Putzliste des Feld-Rollups)`);
  console.log(`\nVerteilung:`);
  for (const [u, n] of [...unterCount.entries()].sort((a, b) => b[1] - a[1]))
    console.log(`  ${n.toString().padStart(4)}  ${u}`);
}

async function main() {
  if (DO_ESTIMATE) estimate(loadRows());
  else if (DO_SUBMIT) await submit();
  else if (DO_STATUS) await status();
  else if (DO_APPLY) await apply();
  else console.log("Usage: --estimate | --submit | --status | --apply");
}
main();
