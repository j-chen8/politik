/**
 * GLOBALER Themen-Klassifikations-Lauf: alle BT-Drucksachen (mit LLM-Analyse)
 * in EINEM Batch gegen die komplette zweistufige Taxonomie (25 Felder ×
 * 202 Unterthemen, scripts/_lib/themen-taxonomie.ts, SoT docs/themen-taxonomie-bt.md).
 *
 * Jede Drucksache wird GENAU EINMAL klassifiziert: 1–3 Feld→Unterthema-Paare
 * (multi-feld) + 1–4 offene spezifische Tags. Ersetzt den überzählenden
 * Feld-Rollup (item_topics) als Themen-Korn UND das kern_im_feld-Flag des
 * Wirtschaft-Piloten (Feld-Zuordnung kommt jetzt direkt aus dem Lauf).
 * Taxonomie-Block liegt gecacht im System-Prompt (~3k Tokens, cache_control).
 *
 * Usage:
 *   npx tsx scripts/batch-unterthemen-global.ts --validate [N]   (live, Default 50, kein DB-Write)
 *   npx tsx scripts/batch-unterthemen-global.ts --submit         (NUR unklassifizierte DS — der »update«-Pfad)
 *   npx tsx scripts/batch-unterthemen-global.ts --submit --all   (Voll-Lauf, ~$6,30 — nur bei Taxonomie-Änderung)
 *   npx tsx scripts/batch-unterthemen-global.ts --status
 *   npx tsx scripts/batch-unterthemen-global.ts --apply
 *
 * ⚠️ Taxonomie-Kanonik: Dieser Lauf schreibt die ORIGINAL-Namen aus
 * scripts/_lib/themen-taxonomie.ts (SoT docs/themen-taxonomie-bt.md). Die
 * Anzeige-Merges + Kurz-Labels (2026-06-12) leben NUR in src/lib/
 * themen-struktur.ts (UNTERTHEMA_MERGES/ANZEIGE_NAME) — hier nichts umbenennen,
 * sonst reißt der Join zwischen Bestand und Neu-Klassifikation.
 * Nach jedem --apply: scripts/seed-rede-unterthemen.ts (Reden-Erben) neu laufen.
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { TAXONOMIE, FELDER, taxonomieText, normalizePaar } from "./_lib/themen-taxonomie";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }

const MODEL = "claude-haiku-4-5-20251001";
const STATE_FILE = path.join(process.cwd(), "scripts", ".batch-unterthemen-global.json");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Du klassifizierst Drucksachen des Deutschen Bundestags in eine zweistufige Themen-Taxonomie (Politikfeld → Unterthema).

TAXONOMIE (Feld in eckigen Klammern, darunter seine Unterthemen):

${taxonomieText()}

Regeln:
- Vergib EIN bis DREI Zuordnungen, jeweils als Paar {feld, unterthema}. Wähle nur Felder, in denen der inhaltliche KERN des Dokuments liegt — nicht jede Randerwähnung (eine Kostenfrage macht kein Finanzen-Dokument, ein Digitalisierungs-Nebensatz kein Digital-Dokument).
- Das unterthema MUSS exakt (zeichengenau) aus der Liste des gewählten Feldes stammen.
- Gehört das Dokument klar in ein Feld, aber kein Unterthema passt, vergib für dieses Feld "Sonstiges".
- Die meisten Dokumente tragen 1–2 Paare; 3 nur bei echten Querschnitts-Vorlagen.
- Vergib zusätzlich 1–4 SPEZIFISCHE Tags: konkrete, wiederverwendbare Schlagwörter (z. B. "Künstliche Intelligenz", "Mietpreisbremse", "Wolf", "NIS-2"). KEINE Einmal-Erfindungen, keine ganzen Sätze, keine Feld- oder Unterthema-Namen. Wenn nichts Sinnvolles: leeres Array.
- Strikt neutral: beschreibe den Gegenstand, bewerte nicht.
- Grounde dich NUR im gegebenen Text.`;

const TOOL: Anthropic.Tool = {
  name: "klassifiziere",
  description: "Gib Feld→Unterthema-Zuordnungen und spezifische Tags für die Drucksache zurück.",
  input_schema: {
    type: "object",
    properties: {
      zuordnungen: {
        type: "array", minItems: 1, maxItems: 3,
        items: {
          type: "object",
          properties: {
            feld: { type: "string", enum: FELDER },
            unterthema: { type: "string", description: "exakt aus der Unterthemen-Liste des Feldes, oder 'Sonstiges'" },
          },
          required: ["feld", "unterthema"],
        },
      },
      spezifische_tags: { type: "array", items: { type: "string" }, maxItems: 4 },
    },
    required: ["zuordnungen", "spezifische_tags"],
  },
};

interface Row { drucksache_nr: string; thema: string | null; zusammenfassung: string | null; kerninhalt: string | null }
function loadRows(limit?: number, random = false, missingOnly = false): Row[] {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  const rows = db.prepare(`
    SELECT drucksache_nr, thema, zusammenfassung, kerninhalt
    FROM drucksache_analyses da
    WHERE zusammenfassung IS NOT NULL AND analyze_error IS NULL
    ${missingOnly ? "AND NOT EXISTS (SELECT 1 FROM ds_unterthemen du WHERE du.drucksache_nr = da.drucksache_nr)" : ""}
    ORDER BY ${random ? "RANDOM()" : "drucksache_nr"}
    ${limit ? `LIMIT ${limit}` : ""}
  `).all() as Row[];
  db.close();
  return rows;
}

const userText = (r: Row) =>
  `ROH-TAGS (Alt-Klassifikation): ${r.thema ?? "—"}\n\nZUSAMMENFASSUNG: ${r.zusammenfassung ?? "—"}\n\nKERNINHALT: ${r.kerninhalt ?? "—"}`;

// System-Prompt als gecachter Block (Batch: gleicher Prefix über alle Requests)
const systemBlocks: Anthropic.TextBlockParam[] = [
  { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
];

type Out = { zuordnungen?: { feld?: string; unterthema?: string }[]; spezifische_tags?: string[] };

function parseResult(out: Out) {
  const roh = out.zuordnungen ?? [];
  const paare: { feld: string; unterthema: string }[] = [];
  let drift = 0;
  for (const z of roh) {
    const norm = normalizePaar(z.feld ?? "", z.unterthema ?? "");
    if (norm) {
      if (!paare.some((p) => p.feld === norm.feld && p.unterthema === norm.unterthema)) paare.push(norm);
    } else drift++;
  }
  const tags = (out.spezifische_tags ?? []).map((t) => String(t).trim()).filter(Boolean);
  return { paare, tags, drift };
}

const toCustomId = (nr: string) => `ds_${nr.replace(/\//g, "_")}`;
const fromCustomId = (id: string) => id.replace(/^ds_/, "").replace(/_/g, "/");

async function validate(n: number) {
  const rows = loadRows(n, true);
  console.log(`VALIDIERUNG (live, kein DB-Write): ${rows.length} zufällige DS, Modell ${MODEL}\n`);
  const feldCount = new Map<string, number>();
  let driftSum = 0, sonstiges = 0, paar1 = 0, paar2 = 0, paar3 = 0, inTok = 0, outTok = 0, cacheRead = 0;
  for (const r of rows) {
    const resp = await client.messages.create({
      model: MODEL, max_tokens: 500, system: systemBlocks,
      tools: [TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
      messages: [{ role: "user", content: userText(r) }],
    });
    inTok += resp.usage.input_tokens; outTok += resp.usage.output_tokens;
    cacheRead += (resp.usage as any).cache_read_input_tokens ?? 0;
    const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
    const { paare, tags, drift } = parseResult((block?.input ?? {}) as Out);
    driftSum += drift;
    if (paare.length === 1) paar1++; else if (paare.length === 2) paar2++; else if (paare.length >= 3) paar3++;
    for (const p of paare) {
      feldCount.set(p.feld, (feldCount.get(p.feld) ?? 0) + 1);
      if (p.unterthema === "Sonstiges") sonstiges++;
    }
    console.log(`DS ${r.drucksache_nr}`);
    console.log(`  roh: ${(r.thema ?? "").slice(0, 70)}`);
    console.log(`  → ${paare.map((p) => `${p.feld} → ${p.unterthema}`).join("  ·  ") || "KEIN VALIDES PAAR"}${drift ? `  (⚠ ${drift} Drift)` : ""}`);
    console.log(`  → tags: ${tags.join(" · ") || "—"}`);
    console.log(`  ${(r.zusammenfassung ?? "").slice(0, 100)}…\n`);
  }
  console.log("─".repeat(60));
  console.log("FELD-VERTEILUNG:");
  for (const [f, c] of [...feldCount.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(3)}  ${f}`);
  console.log(`\nPaare/Dokument: 1×${paar1} · 2×${paar2} · 3×${paar3}`);
  console.log(`Sonstiges-Zuordnungen: ${sonstiges} | Drift (invalide Paare): ${driftSum}`);
  console.log(`Tokens: ${inTok} in (davon ${cacheRead} cache-read) / ${outTok} out`);
}

async function submit() {
  // Default: NUR unklassifizierte DS (inkrementell, »update«-sicher) — --all für Voll-Lauf
  const all = process.argv.includes("--all");
  const rows = loadRows(undefined, false, !all);
  if (rows.length === 0) { console.log("Nichts zu tun: alle analysierten DS sind klassifiziert."); return; }
  console.log(`Submit: ${rows.length} Drucksachen (${all ? "VOLL-LAUF" : "nur unklassifizierte"}), Modell ${MODEL}, Batch API`);
  const requests: Anthropic.Messages.Batches.BatchCreateParams.Request[] = rows.map((r) => ({
    custom_id: toCustomId(r.drucksache_nr),
    params: {
      model: MODEL, max_tokens: 500, system: systemBlocks,
      tools: [TOOL], tool_choice: { type: "tool", name: "klassifiziere" },
      messages: [{ role: "user", content: userText(r) }],
    },
  }));
  const batch = await client.messages.batches.create({ requests });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ batch_id: batch.id, submitted_at: new Date().toISOString(), count: rows.length }, null, 2));
  console.log(`Batch submitted: ${batch.id} (${rows.length} Requests)`);
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
      drucksache_nr TEXT NOT NULL, feld TEXT NOT NULL,
      unterthemen_json TEXT NOT NULL, spezifische_tags_json TEXT NOT NULL,
      kern_im_feld INTEGER, model TEXT, batch_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (drucksache_nr, feld)
    );
  `);
  // Globaler Lauf ersetzt ALLE bisherigen Zuordnungen (inkl. Wirtschaft-Pilot):
  // pro Dokument erst löschen, dann frisch schreiben — keine Stale-Felder.
  const del = db.prepare("DELETE FROM ds_unterthemen WHERE drucksache_nr = ?");
  const ins = db.prepare(`
    INSERT INTO ds_unterthemen (drucksache_nr, feld, unterthemen_json, spezifische_tags_json, kern_im_feld, model, batch_id)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `);

  let ok = 0, errored = 0, leer = 0, driftSum = 0;
  const feldCount = new Map<string, number>();
  const writeDoc = db.transaction((nr: string, paare: { feld: string; unterthema: string }[], tags: string[]) => {
    del.run(nr);
    const byFeld = new Map<string, string[]>();
    for (const p of paare) {
      const l = byFeld.get(p.feld) ?? [];
      l.push(p.unterthema); byFeld.set(p.feld, l);
    }
    for (const [feld, unter] of byFeld) {
      ins.run(nr, feld, JSON.stringify(unter), JSON.stringify(tags), MODEL, batch_id);
      feldCount.set(feld, (feldCount.get(feld) ?? 0) + 1);
    }
  });

  for await (const result of await client.messages.batches.results(batch_id)) {
    if (result.result.type !== "succeeded") { errored++; console.error(`  ✗ ${result.custom_id}: ${result.result.type}`); continue; }
    const msg = result.result.message;
    const block = msg.content.find((c) => c.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
    const { paare, tags, drift } = parseResult((block?.input ?? {}) as Out);
    driftSum += drift;
    if (paare.length === 0) { leer++; console.error(`  ⚠ ${result.custom_id}: keine validen Paare`); continue; }
    writeDoc(fromCustomId(result.custom_id), paare, tags);
    ok++;
  }
  db.close();
  console.log(`\nApply fertig: ${ok} Dokumente · ${errored} API-Fehler · ${leer} ohne valide Paare · ${driftSum} Drift-Paare verworfen`);
  console.log("FELD-VERTEILUNG (Dokumente je Feld):");
  for (const [f, c] of [...feldCount.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(5)}  ${f}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--validate")) {
    const i = args.indexOf("--validate");
    await validate(parseInt(args[i + 1], 10) || 50);
  } else if (args.includes("--submit")) await submit();
  else if (args.includes("--status")) await status();
  else if (args.includes("--apply")) await apply();
  else console.log("Usage: --validate [N] | --submit | --status | --apply");
}
main();
