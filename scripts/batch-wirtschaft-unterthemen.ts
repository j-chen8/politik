/**
 * Voller Wirtschaft-Unterthemen-Lauf über die Anthropic Batch API (50 % off).
 *
 * Klassifiziert alle BT-Drucksachen des Wirtschaft-Feld-Rollups (item_topics
 * aw_field='Wirtschaft', ~1.030 Items) in {unterthemen[] (geschlossen, 11+Sonstiges)
 * + spezifische_tags[] (offen) + kern_im_feld}. Taxonomie/Prompt/Tool geteilt mit
 * dem Spike: scripts/_lib/unterthemen-wirtschaft.ts. Validierung: Lauf 2 bestanden
 * (docs/themen-unterthemen-design.md).
 *
 * Schreibt nach ds_unterthemen (PK drucksache_nr+feld, multi-feld-fähig für
 * spätere Felder). kern_im_feld=false-Items sind die Putzliste des Feld-Rollups.
 *
 * Usage:
 *   npx tsx scripts/batch-wirtschaft-unterthemen.ts --submit
 *   npx tsx scripts/batch-wirtschaft-unterthemen.ts --status
 *   npx tsx scripts/batch-wirtschaft-unterthemen.ts --apply
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { FELD, SYSTEM, TOOL, buildUserText, normalizeUnterthema } from "./_lib/unterthemen-wirtschaft";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }

const MODEL = "claude-haiku-4-5-20251001";
const STATE_FILE = path.join(process.cwd(), "scripts", ".batch-wirtschaft-unterthemen.json");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const args = process.argv.slice(2);
const DO_SUBMIT = args.includes("--submit");
const DO_STATUS = args.includes("--status");
const DO_APPLY = args.includes("--apply");

// custom_id erlaubt kein "/" → "21/980" ↔ "ds_21_980"
const toCustomId = (nr: string) => `ds_${nr.replace(/\//g, "_")}`;
const fromCustomId = (id: string) => id.replace(/^ds_/, "").replace(/_/g, "/");

function loadRows() {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  const rows = db.prepare(`
    SELECT da.drucksache_nr, da.thema, da.zusammenfassung, da.kerninhalt
    FROM item_topics it JOIN drucksache_analyses da ON da.drucksache_nr = it.item_id
    WHERE it.source='bt_drucksache' AND it.aw_field=? AND da.zusammenfassung IS NOT NULL
    GROUP BY da.drucksache_nr
    ORDER BY da.drucksache_nr
  `).all(FELD) as { drucksache_nr: string; thema: string | null; zusammenfassung: string | null; kerninhalt: string | null }[];
  db.close();
  return rows;
}

async function submit() {
  const rows = loadRows();
  console.log(`Submit: ${rows.length} Drucksachen (Feld ${FELD}), Modell ${MODEL}, Batch API`);
  const requests: Anthropic.Messages.Batches.BatchCreateParams.Request[] = rows.map((r) => ({
    custom_id: toCustomId(r.drucksache_nr),
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
    CREATE TABLE IF NOT EXISTS ds_unterthemen (
      drucksache_nr TEXT NOT NULL,
      feld TEXT NOT NULL,
      unterthemen_json TEXT NOT NULL,
      spezifische_tags_json TEXT NOT NULL,
      kern_im_feld INTEGER,
      model TEXT,
      batch_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (drucksache_nr, feld)
    );
    CREATE INDEX IF NOT EXISTS idx_ds_unterthemen_feld ON ds_unterthemen(feld, kern_im_feld);
  `);
  const upsert = db.prepare(`
    INSERT INTO ds_unterthemen (drucksache_nr, feld, unterthemen_json, spezifische_tags_json, kern_im_feld, model, batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(drucksache_nr, feld) DO UPDATE SET
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
    // Enum-Drift normalisieren (&amp; → & etc.); unbekannte Werte zählen + verwerfen
    const unter = rawUnter.map(normalizeUnterthema).filter((u): u is string => u !== null);
    if (unter.length !== rawUnter.length) drift++;
    if (unter.length === 0) { leer++; console.error(`  ⚠ ${result.custom_id}: keine validen Unterthemen (roh: ${rawUnter.join("|")})`); continue; }
    const tags = (out.spezifische_tags ?? []).map((t) => String(t).trim()).filter(Boolean);
    const kern = out.kern_im_feld === false ? 0 : out.kern_im_feld === true ? 1 : null;
    if (kern === 0) fremd++;
    upsert.run(fromCustomId(result.custom_id), FELD, JSON.stringify(unter), JSON.stringify(tags), kern, MODEL, batch_id);
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
  if (DO_SUBMIT) await submit();
  else if (DO_STATUS) await status();
  else if (DO_APPLY) await apply();
  else console.log("Usage: --submit | --status | --apply");
}
main();
