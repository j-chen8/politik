/**
 * Specialist 2d.2 — Doppelungs-Verifier (Llama 3.3 70B auf Groq).
 *
 * Liest detect-duplicates.partial.jsonl (Vorfilter-Kandidaten), schickt jedes
 * Pärchen + Quelltext an Llama 70B zur semantischen Bestätigung:
 *   - Beziehen sich beide Einträge auf DENSELBEN Sachverhalt?
 *   - Wenn ja: wie sollte der konsolidierte Eintrag aussehen?
 *
 * Output: confirm-duplicates.partial.jsonl mit merge: true/false + merged_entry.
 *
 * Run:
 *   npx tsx scripts/verify-duplicates.ts          # alle Kandidaten
 *   npx tsx scripts/verify-duplicates.ts --print  # statt persistieren
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const INPUT = path.join(process.cwd(), "detect-duplicates.partial.jsonl");
const OUTPUT = path.join(process.cwd(), "verify-duplicates.partial.jsonl");

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);
if (GROQ_KEYS.length === 0) { console.error("GROQ_API_KEY in .env fehlt"); process.exit(1); }

const MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const SLEEP_MS = 1500;
const VERIFIER_VERSION = "verify-duplicates-v1-llama70b";

const PRINT_MODE = process.argv.includes("--print");

let keyIdx = 0;
const nextKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Duplicate {
  section: string; index_a: number; index_b: number;
  jahr_a: string; jahr_b: string; text_a: string; text_b: string;
  similarity: number; reason: string;
}

interface VerifyResult {
  merge: boolean;
  reason: string;
  merged_entry: { jahr: string; text: string } | null;
  evidence_quote: string;
}

const SYSTEM_PROMPT = `Du bist Doppelungs-Verifier für Politiker-Lebensläufe. Du bekommst zwei Einträge aus einem strukturierten CV und entscheidest ob sie sich auf denselben Sachverhalt beziehen.

Regeln:
- "merge": true → wenn beide Einträge DENSELBEN Sachverhalt beschreiben (z.B. selbe Position, selbe Wahl, selbe Mitgliedschaft) und konsolidiert werden sollten
- "merge": false → wenn sie sich auf VERSCHIEDENE Sachverhalte beziehen (z.B. zwei verschiedene Wahlperioden derselben Position, Aufstieg von Stellv. zu Voll-Position, MdB-Mandat vs. Ausschuss-Mitgliedschaft, Wahl-Datum vs. Amtszeit derselben Position dürfen unter Umständen GETRENNT bleiben wenn semantisch unterschiedlich)

Wichtige Unterscheidungen:
- "Mitglied des Bundestages" ≠ "Mitglied im Innenausschuss" → VERSCHIEDENE Sachverhalte (merge: false)
- "Stellvertretender Vorsitzender" ≠ "Vorsitzender" → VERSCHIEDENE Positionen (merge: false)
- "16. WP Mitglied im X-Ausschuss" + "17. WP Mitglied im X-Ausschuss" → kann konsolidiert werden zu einem Eintrag mit Range (merge: true)
- "Wahl zur Vizepräsidentin am 22.10.2013" + "Vizepräsidentin 2013-2021" → DIESELBE Position (merge: true), konsolidieren

Bei merge: true → liefere "merged_entry" mit konsolidiertem jahr und text:
- jahr: das umfassendere Datum (z.B. "2013-2021" statt "22.10.2013")
- text: prägnanter zusammengefasst (max 250 Zeichen)

Antworte AUSSCHLIESSLICH mit JSON:
{
  "merge": true | false,
  "reason": "<kurze Begründung, 1 Satz>",
  "merged_entry": { "jahr": "...", "text": "..." } oder null,
  "evidence_quote": "<wörtlicher Schnipsel aus Quelltext, der die Entscheidung stützt>"
}`;

async function callLlama(payload: object): Promise<any> {
  for (let attempt = 0; attempt < GROQ_KEYS.length * 3; attempt++) {
    const key = nextKey();
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 429) { await sleep(3000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  }
  throw new Error("alle Groq-Keys rate-limited");
}

async function verifyPair(name: string, wikiText: string, dup: Duplicate): Promise<VerifyResult> {
  const userMsg = `POLITIKER: ${name}

QUELLTEXT (Wikipedia):
${wikiText.slice(0, 12000)}

ZWEI EINTRÄGE in Sektion "${dup.section}":
A: { "jahr": "${dup.jahr_a}", "text": "${dup.text_a}" }
B: { "jahr": "${dup.jahr_b}", "text": "${dup.text_b}" }

Entscheide: dieselbe Sache (merge: true) oder verschiedene Sachverhalte (merge: false)?`;

  const data = await callLlama({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_object" },
    temperature: 0.0,
    max_tokens: 800,
  });

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Kein content");
  const parsed = JSON.parse(content);
  return {
    merge: parsed.merge === true,
    reason: parsed.reason ?? "",
    merged_entry: parsed.merge && parsed.merged_entry ? {
      jahr: String(parsed.merged_entry.jahr ?? ""),
      text: String(parsed.merged_entry.text ?? ""),
    } : null,
    evidence_quote: parsed.evidence_quote ?? "",
  };
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`${INPUT} fehlt — erst detect-duplicates.ts laufen lassen`);
    process.exit(1);
  }
  const db = new Database(DB_PATH, { readonly: true });

  // Lade Kandidaten + Politiker-Daten
  const candidates: { politician_id: number; name: string; dup: Duplicate; wikiText: string }[] = [];
  const wikiCache = new Map<number, string>();

  for (const line of fs.readFileSync(INPUT, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    let wiki = wikiCache.get(r.politician_id);
    if (!wiki) {
      const row = db.prepare("SELECT bio_full_text FROM politicians WHERE id = ?").get(r.politician_id) as { bio_full_text: string } | undefined;
      wiki = row?.bio_full_text ?? "";
      wikiCache.set(r.politician_id, wiki);
    }
    for (const dup of r.duplicates) candidates.push({ politician_id: r.politician_id, name: r.name, dup, wikiText: wiki });
  }

  console.log(`\n${candidates.length} Doppelungs-Kandidaten zu verifizieren\n`);

  if (!PRINT_MODE && fs.existsSync(OUTPUT)) fs.unlinkSync(OUTPUT);

  let confirmed = 0, rejected = 0;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    try {
      const result = await verifyPair(c.name, c.wikiText, c.dup);
      if (result.merge) confirmed++; else rejected++;

      if (PRINT_MODE) {
        const flag = result.merge ? "✅ MERGE" : "❌ KEEP-SEPARATE";
        console.log(`\n${flag}  ${c.politician_id} ${c.name} — ${c.dup.section}`);
        console.log(`  A [${c.dup.jahr_a}] ${c.dup.text_a.slice(0, 90)}`);
        console.log(`  B [${c.dup.jahr_b}] ${c.dup.text_b.slice(0, 90)}`);
        console.log(`  → ${result.reason}`);
        if (result.merged_entry) {
          console.log(`  → merge: [${result.merged_entry.jahr}] ${result.merged_entry.text.slice(0, 100)}`);
        }
      } else {
        fs.appendFileSync(OUTPUT, JSON.stringify({
          politician_id: c.politician_id, name: c.name,
          section: c.dup.section, index_a: c.dup.index_a, index_b: c.dup.index_b,
          original_a: { jahr: c.dup.jahr_a, text: c.dup.text_a },
          original_b: { jahr: c.dup.jahr_b, text: c.dup.text_b },
          verifier_version: VERIFIER_VERSION,
          ...result,
        }) + "\n");
        process.stdout.write(`\r  [${i + 1}/${candidates.length}] confirmed=${confirmed} rejected=${rejected}      `);
      }
    } catch (e: any) {
      console.log(`\n✗ ${c.politician_id}: ${e.message?.slice(0, 150)}`);
    }
    await sleep(SLEEP_MS);
  }

  if (!PRINT_MODE) process.stdout.write("\n");
  console.log("\n=== Fertig ===");
  console.log(`  Bestätigt (merge):    ${confirmed}`);
  console.log(`  Abgelehnt (separate): ${rejected}`);
  console.log(`  False-Positive-Rate:  ${(rejected / (confirmed + rejected) * 100).toFixed(1)}%`);

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
