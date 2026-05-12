/**
 * Re-Run für Drucksachen-Analysen mit XML-Tool-Call-Leakage im Output.
 *
 * Ausgangslage: ~200 Records, bei denen das Modell im Tool-Use-Pfad XML-Marker
 * (</zusammenfassung>, <parameter name="...">, </invoke>) oder Roh-Arrays in
 * String-Feldern eingebettet hat. Tool-Use-Block selbst war valid, daher gelangten
 * die Werte mit Müll am Ende in die DB.
 *
 * Strategie: Live-Messages-API (kein Batch), serieller Durchlauf mit Concurrency=5,
 * 3 Retries bei Overload/Network-Fehlern, idempotent via DS-Nr.
 *
 *   --dry-run        Nur Auswahl + Plan ausgeben
 *   --limit N        Optional, nur erste N Records (zum Testen)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPTS_BY_CLASS, PROMPT_VERSION, SYSTEM_PROMPT_HEADER, TOPIC_TAGS,
  truncateToTokens, BatchClass,
} from "../src/lib/drucksachen-prompts";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const TOPIC_ENUM = new Set<string>([...TOPIC_TAGS]);
const CONCURRENCY = 5;
const MAX_RETRIES = 3;

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const LIMIT_IDX = argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(argv[LIMIT_IDX + 1], 10) : null;

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

interface Row { drucksache_nr: string; batch_class: string; full_text: string }

function isCorrupted(s: string | null | undefined): boolean {
  if (!s) return false;
  return /<\/(zusammenfassung|kerninhalt|tonalitaet|thema|invoke|parameter)/i.test(s)
      || /<parameter\s+name=/i.test(s);
}

function validateAndMapTopics(themas: string[] | undefined): { thema: string[]; drift: string[] } {
  if (!Array.isArray(themas)) return { thema: ["Sonstiges"], drift: [] };
  const accepted: string[] = [];
  const drift: string[] = [];
  for (const t of themas) {
    if (TOPIC_ENUM.has(t)) accepted.push(t);
    else drift.push(t);
  }
  if (accepted.length === 0) accepted.push("Sonstiges");
  return { thema: accepted, drift };
}

function selectCorrupted(): Row[] {
  const q = `
    SELECT a.drucksache_nr, a.batch_class, t.full_text
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr = a.drucksache_nr
    WHERE a.prompt_version = '${PROMPT_VERSION}'
      AND a.analyze_error IS NULL
      AND a.batch_class IN ('klein','mittel','gross','antwort','regierung')
      AND (
        a.zusammenfassung LIKE '%</%' OR
        a.zusammenfassung LIKE '%<parameter%' OR
        a.kerninhalt LIKE '%</invoke>%' OR
        a.kerninhalt LIKE '%<parameter%' OR
        a.thema LIKE '%<%' OR
        a.tonalitaet LIKE '%<%' OR
        a.regelung LIKE '%<%' OR
        a.begruendung LIKE '%<%' OR
        a.auswirkung LIKE '%<%'
      )
      AND t.full_text IS NOT NULL
      AND LENGTH(t.full_text) > 50
    ORDER BY a.drucksache_nr
    ${LIMIT ? `LIMIT ${LIMIT}` : ""}
  `;
  return db.prepare(q).all() as Row[];
}

async function callOnce(row: Row): Promise<any> {
  const cfg = PROMPTS_BY_CLASS[row.batch_class as BatchClass];
  const { text, truncated } = truncateToTokens(row.full_text, cfg.cap);
  const userContent = `${cfg.instruction}\n\nDRUCKSACHEN-TEXT${truncated ? ` (auf ${cfg.cap} Tokens gekürzt)` : ""}:\n\n${text}`;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [{ type: "text", text: SYSTEM_PROMPT_HEADER, cache_control: { type: "ephemeral" } }] as any,
    tools: [{ ...(cfg.tool as any), cache_control: { type: "ephemeral" } }] as any,
    tool_choice: { type: "tool", name: cfg.tool.name } as any,
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse: any = (msg.content as any[]).find((b) => b.type === "tool_use");
  if (!toolUse) throw new Error("no tool_use in response");
  return toolUse.input;
}

async function processOne(row: Row): Promise<{ ok: boolean; stillCorrupted: boolean; error?: string; data?: any }> {
  let lastErr: string | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await callOnce(row);
      const stillCorrupted = isCorrupted(data.zusammenfassung)
        || isCorrupted(data.regelung)
        || isCorrupted(data.begruendung)
        || isCorrupted(data.auswirkung)
        || (Array.isArray(data.kerninhalt) && data.kerninhalt.some((k: any) => isCorrupted(String(k))))
        || isCorrupted(data.tonalitaet);
      return { ok: true, stillCorrupted, data };
    } catch (e: any) {
      lastErr = e?.message ?? String(e);
      const transient = /overload|rate|timeout|ECONN|ETIMEDOUT|503|529/i.test(lastErr || "");
      if (!transient || attempt === MAX_RETRIES) break;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return { ok: false, stillCorrupted: false, error: lastErr ?? "unknown" };
}

const update = db.prepare(`
  UPDATE drucksache_analyses
  SET zusammenfassung = ?, kerninhalt = ?, thema = ?, tonalitaet = ?,
      betroffene_gruppen = ?, fraktion = ?,
      dokumenttyp = ?, regelung = ?, begruendung = ?, auswirkung = ?,
      topic_drift_audit = ?, analyze_error = NULL,
      model = ?, generated_at = ?, raw_llm_response = ?
  WHERE drucksache_nr = ? AND prompt_version = '${PROMPT_VERSION}'
`);

async function main() {
  const rows = selectCorrupted();
  console.log(`📋 ${rows.length} korrupte Records zu reparieren`);
  const byClass = new Map<string, number>();
  for (const r of rows) byClass.set(r.batch_class, (byClass.get(r.batch_class) ?? 0) + 1);
  console.log(`Verteilung:`);
  for (const [c, n] of byClass) console.log(`  ${c.padEnd(12)} ${n}`);

  if (DRY_RUN) { console.log("--dry-run, exit."); return; }

  let ok = 0, stillBad = 0, hardErr = 0;
  const start = Date.now();

  // Worker-Pool
  let idx = 0;
  async function worker(wid: number) {
    while (true) {
      const i = idx++;
      if (i >= rows.length) return;
      const row = rows[i];
      const res = await processOne(row);
      if (res.ok && !res.stillCorrupted) {
        const d = res.data;
        const { thema, drift } = validateAndMapTopics(d.thema);
        update.run(
          d.zusammenfassung ?? null,
          JSON.stringify(d.kerninhalt ?? null),
          thema.join(", "),
          d.tonalitaet ?? null,
          d.betroffene_gruppen ?? null,
          d.fraktion ?? null,
          d.dokumenttyp ?? null,
          d.regelung ?? null,
          d.begruendung ?? null,
          d.auswirkung ?? null,
          drift.length > 0 ? JSON.stringify(drift) : null,
          MODEL,
          new Date().toISOString(),
          JSON.stringify(d),
          row.drucksache_nr,
        );
        ok++;
      } else if (res.ok && res.stillCorrupted) {
        stillBad++;
        console.log(`  ⚠ ${row.drucksache_nr} (${row.batch_class}): still corrupted nach Retry`);
      } else {
        hardErr++;
        console.log(`  ✖ ${row.drucksache_nr} (${row.batch_class}): ${res.error?.slice(0, 100)}`);
      }
      const done = ok + stillBad + hardErr;
      if (done % 20 === 0 || done === rows.length) {
        const rate = done / ((Date.now() - start) / 1000);
        console.log(`  … ${done}/${rows.length}  ok=${ok}  stillBad=${stillBad}  err=${hardErr}  (${rate.toFixed(1)}/s)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i)));

  console.log(`\n=== Fertig (${((Date.now() - start) / 1000).toFixed(1)}s) ===`);
  console.log(`  Repariert:        ${ok}`);
  console.log(`  Erneut korrupt:   ${stillBad}`);
  console.log(`  Harte Errors:     ${hardErr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
