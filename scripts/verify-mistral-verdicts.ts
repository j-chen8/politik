/**
 * Cascade-Verifier für Mistral Datums-Inspektor (Stage 2a-2).
 *
 * Liest inspect-dates.partial.jsonl, prüft jeden problematischen Verdict
 * (datum_falsch / halluziniert / fehlend) mit Llama 4 Maverick als
 * unabhängige Schiedsrichter-Schicht.
 *
 * Hintergrund: Stichproben-Reality-Check zeigte False-Positive-Raten
 *   - halluziniert:  ~60% FP (Daten die wirklich im Text stehen)
 *   - fehlend:       ~80% FP (sollten "korrekt_leer" sein)
 *   - datum_falsch:  ~40% problematisch (Format-Bugs)
 *
 * Cascade-Logik analog zu verify-duplicates.ts:
 *   Programmatisch billig (Mistral) → LLM teuer für Subtilität (Maverick)
 *
 * Output: verify-mistral.partial.jsonl mit pro Verdict:
 *   { politician_id, section, index, original_status, original_jahr, original_text,
 *     verifier_decision: "confirmed" | "rejected" | "uncertain",
 *     suggested_correction: { jahr, text } | null,
 *     reason, evidence_quote }
 *
 * Run:
 *   npx tsx scripts/verify-mistral-verdicts.ts          # alle problematischen
 *   npx tsx scripts/verify-mistral-verdicts.ts --print  # statt persistieren
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
const INPUT = path.join(process.cwd(), "inspect-dates.partial.jsonl");
const OUTPUT = path.join(process.cwd(), "verify-mistral.partial.jsonl");

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);
const DEEPINFRA_KEY = process.env.DEEPINFRA_API_KEY;
if (GROQ_KEYS.length === 0 && !DEEPINFRA_KEY) {
  console.error("Weder GROQ_API_KEY noch DEEPINFRA_API_KEY in .env");
  process.exit(1);
}

// Provider-Cascade: Groq Free zuerst (kostenlos aber TPD-limitiert),
// bei Erschöpfung Fallback zu DeepInfra (paid, $0.10/$0.32 per MTok).
// Beide Provider servieren dasselbe Modell — Output ist konsistent.
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEEPINFRA_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const DEEPINFRA_URL = "https://api.deepinfra.com/v1/openai/chat/completions";

const SLEEP_MS = 1500;
const VERIFIER_VERSION = "verify-mistral-v1-llama70b-cascade";

const PRINT_MODE = process.argv.includes("--print");
const FORCE_DEEPINFRA = process.argv.includes("--deepinfra");

let keyIdx = 0;
const nextGroqKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Provider-State: einmal auf DeepInfra geswitcht, bleibt dort
let activeProvider: "groq" | "deepinfra" = (FORCE_DEEPINFRA || GROQ_KEYS.length === 0) ? "deepinfra" : "groq";
let groqExhaustedAt: number | null = null;

interface Verdict {
  section: string; index: number;
  jahr: string; text: string;
  status: string;
  korrektes_datum: string | null;
  evidence_quote: string;
}

interface VerifyResult {
  index: number; section: string;
  original_status: string;
  verifier_decision: "confirmed" | "rejected" | "uncertain";
  correct_status: "korrekt" | "korrekt_leer" | "datum_falsch" | "halluziniert" | "fehlend";
  suggested_correction: { jahr: string; text?: string } | null;
  reason: string;
  evidence_quote: string;
}

const SYSTEM_PROMPT = `Du bist Schiedsrichter für einen Datums-Inspektor. Ein anderer LLM (Mistral Small) hat einzelne CV-Einträge eines Politikers als problematisch markiert. Deine Aufgabe: prüfe ob das wirklich Probleme sind.

Du bekommst:
1. QUELLTEXT (Wikipedia)
2. FRAGLICHE EINTRÄGE mit Mistrals Verdicts

Für JEDEN fraglichen Eintrag entscheide:

VERIFIER_DECISION:
- "confirmed": Mistrals Verdict stimmt — es ist wirklich ein Problem
- "rejected": Mistrals Verdict ist falsch — Eintrag ist korrekt
- "uncertain": kann nicht eindeutig entschieden werden

CORRECT_STATUS (wie es WIRKLICH ist):
- "korrekt" = jahr ist gefüllt UND steht im Quelltext
- "korrekt_leer" = jahr="" UND Text hat kein Datum (Generator hat richtig leer gelassen)
- "datum_falsch" = jahr ist gefüllt, Quelltext nennt anderes Datum
- "halluziniert" = jahr ist gefüllt, aber Quelltext nennt KEIN Datum (Generator hat erfunden)
- "fehlend" = jahr="" aber Quelltext nennt SEHR WOHL ein Datum (Generator hat es übersehen)

WICHTIGE PRÜFUNGEN für Mistrals Häufigste Fehler:
1. **"halluziniert" wird oft falsch geflaggt:** Prüfe sehr sorgfältig ob das Datum nicht doch im Text steht (auch in einer Auszeichnungs-Liste, einem "===Schriften===" Abschnitt, etc.)
2. **"fehlend" sollte oft "korrekt_leer" sein:** Wenn jahr="" und Text auch wirklich KEIN Datum für diese Aussage nennt → CORRECT_STATUS="korrekt_leer", verifier_decision="rejected"
3. **"datum_falsch" mit Format-Bug:** Manchmal hat Mistral als korrektes_datum einen ganzen Satz statt Datum geschrieben — kennzeichne das

SUGGESTED_CORRECTION (nur wenn confirmed):
Bei datum_falsch oder halluziniert: { jahr: korrekter Wert oder "" }
Bei fehlend: { jahr: gefundenes Datum aus Text }
Bei rejected: null

Antworte AUSSCHLIESSLICH mit JSON-Array (genau ein Objekt pro fraglichem Eintrag, in derselben Reihenfolge):
[
  {
    "index": <number>, "section": <string>,
    "original_status": <string>,
    "verifier_decision": "confirmed|rejected|uncertain",
    "correct_status": "korrekt|korrekt_leer|datum_falsch|halluziniert|fehlend",
    "suggested_correction": null oder {"jahr": "..."},
    "reason": "<1 Satz>",
    "evidence_quote": "<wörtlicher Schnipsel aus Quelltext, oder leer>"
  }
]`;

async function callDeepInfra(payload: object): Promise<any> {
  if (!DEEPINFRA_KEY) throw new Error("DEEPINFRA_API_KEY fehlt für Fallback");
  const adjusted = { ...payload, model: DEEPINFRA_MODEL };
  const res = await fetch(DEEPINFRA_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${DEEPINFRA_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(adjusted),
  });
  if (!res.ok) throw new Error(`DeepInfra HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return await res.json();
}

async function callGroq(payload: object): Promise<any> {
  const adjusted = { ...payload, model: GROQ_MODEL };
  for (let attempt = 0; attempt < GROQ_KEYS.length * 3; attempt++) {
    const key = nextGroqKey();
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(adjusted),
    });
    if (res.status === 429) { await sleep(3000); continue; }
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  }
  throw new Error("groq-rate-limited");
}

async function callLLM(payload: object): Promise<any> {
  // Cascade: Groq zuerst, bei Rate-Limit-Erschöpfung Switch zu DeepInfra
  if (activeProvider === "groq") {
    try {
      return await callGroq(payload);
    } catch (e: any) {
      if (e.message?.includes("groq-rate-limited") && DEEPINFRA_KEY) {
        groqExhaustedAt = Date.now();
        activeProvider = "deepinfra";
        process.stdout.write(`\n  ⚡ Switch: Groq → DeepInfra (TPD erschöpft)\n`);
        return await callDeepInfra(payload);
      }
      throw e;
    }
  }
  return await callDeepInfra(payload);
}

async function verifyMdB(name: string, wikiText: string, problems: Verdict[]): Promise<VerifyResult[]> {
  // Wiki-Text auf 10k limitieren um HTTP 413 zu vermeiden bei vielen Problemen
  const wikiLimit = problems.length > 5 ? 8000 : 12000;
  const userMsg = `POLITIKER: ${name}

QUELLTEXT (Wikipedia):
${wikiText.slice(0, wikiLimit)}

FRAGLICHE EINTRÄGE (${problems.length} Stück, von Mistral als problematisch markiert):
${JSON.stringify(problems.map(p => ({
  index: p.index, section: p.section, jahr: p.jahr, text: p.text.slice(0, 200),
  mistral_status: p.status,
  mistral_correction: (p.korrektes_datum ?? "").slice(0, 100),
})), null, 2)}

Prüfe jeden Eintrag und gib genau ${problems.length} Verifikations-Objekte als JSON-Array unter dem Key "results" zurück. Format: {"results": [...]}`;

  const data = await callLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_object" },
    temperature: 0.0,
    max_tokens: 8192,
  });

  let content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Kein content");

  // DeepInfra wrappt manchmal Output in ```json ... ``` Markdown
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) content = fenced[1];

  let parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    // OK
  } else if (parsed.results && Array.isArray(parsed.results)) {
    parsed = parsed.results;
  } else if (parsed.verdicts && Array.isArray(parsed.verdicts)) {
    parsed = parsed.verdicts;
  } else if (parsed.index !== undefined && parsed.section !== undefined) {
    // Single object instead of array — wrap it
    parsed = [parsed];
  } else {
    const arrKey = Object.keys(parsed).find((k) => Array.isArray((parsed as any)[k]));
    if (arrKey) parsed = (parsed as any)[arrKey];
    else throw new Error(`Kein Array im Output: ${content.slice(0, 200)}`);
  }
  return parsed as VerifyResult[];
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`${INPUT} fehlt — erst inspect-dates.ts laufen lassen`);
    process.exit(1);
  }
  const db = new Database(DB_PATH, { readonly: true });

  // Load Mistral verdicts, group problematic by MdB
  const problemsByMdB = new Map<number, { name: string; problems: Verdict[] }>();
  let totalProblems = 0;
  for (const line of fs.readFileSync(INPUT, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const probs: Verdict[] = r.verdicts.filter((v: Verdict) =>
      v.status === "datum_falsch" || v.status === "halluziniert" || v.status === "fehlend"
    );
    if (probs.length === 0) continue;
    problemsByMdB.set(r.politician_id, { name: r.name, problems: probs });
    totalProblems += probs.length;
  }

  // Resume
  const done = new Set<number>();
  if (!PRINT_MODE && fs.existsSync(OUTPUT)) {
    for (const line of fs.readFileSync(OUTPUT, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try { done.add(JSON.parse(line).politician_id); } catch {}
    }
  }
  const todo = [...problemsByMdB.entries()].filter(([id]) => !done.has(id));

  console.log(`\n${problemsByMdB.size} MdBs mit Problemen, ${totalProblems} fragliche Verdicts gesamt`);
  console.log(`${done.size} schon verifiziert, ${todo.length} todo.\n`);

  let stats = { confirmed: 0, rejected: 0, uncertain: 0 };
  let mdbsDone = 0;

  for (const [pid, { name, problems }] of todo) {
    const row = db.prepare("SELECT bio_full_text FROM politicians WHERE id = ?").get(pid) as { bio_full_text: string } | undefined;
    if (!row?.bio_full_text) {
      console.log(`\n✗ ${pid} ${name}: kein bio_full_text`);
      continue;
    }
    try {
      const results = await verifyMdB(name, row.bio_full_text, problems);
      for (const r of results) stats[r.verifier_decision] = (stats[r.verifier_decision] || 0) + 1;

      if (PRINT_MODE) {
        console.log(`\n═══ ${pid} ${name} — ${results.length} fragliche Verdicts ═══`);
        for (const r of results) {
          const orig = problems.find(p => p.index === r.index && p.section === r.section);
          const flag = r.verifier_decision === "confirmed" ? "✓ CONFIRM"
                     : r.verifier_decision === "rejected"  ? "✗ REJECT "
                     :                                       "? UNCLEAR";
          console.log(`\n  ${flag}  [${r.section}] index ${r.index}`);
          console.log(`    original:  jahr="${orig?.jahr}" text="${(orig?.text ?? '').slice(0,80)}"`);
          console.log(`    Mistral:   ${r.original_status}  →  korrekt? "${orig?.korrektes_datum}"`);
          console.log(`    Maverick:  ${r.correct_status}` + (r.suggested_correction ? ` → "${r.suggested_correction.jahr}"` : ""));
          console.log(`    reason:    ${r.reason}`);
          if (r.evidence_quote) console.log(`    evidence:  "${r.evidence_quote.slice(0, 120)}"`);
        }
      } else {
        fs.appendFileSync(OUTPUT, JSON.stringify({
          politician_id: pid, name,
          verifier_version: VERIFIER_VERSION,
          results,
        }) + "\n");
        mdbsDone++;
        process.stdout.write(`\r  [${mdbsDone}/${todo.length}] ${pid} ${name.slice(0,28).padEnd(28)}  conf=${stats.confirmed} rej=${stats.rejected} unc=${stats.uncertain}      `);
      }
    } catch (e: any) {
      console.log(`\n✗ ${pid} ${name}: ${e.message?.slice(0, 150)}`);
    }
    await sleep(SLEEP_MS);
  }

  if (!PRINT_MODE) process.stdout.write("\n");
  console.log("\n=== Fertig ===");
  console.log(`  confirmed (echtes Problem):  ${stats.confirmed}`);
  console.log(`  rejected  (Mistral irrte):    ${stats.rejected}`);
  console.log(`  uncertain (manuell prüfen):   ${stats.uncertain}`);
  const total = stats.confirmed + stats.rejected + stats.uncertain;
  if (total > 0) {
    console.log(`  Mistral False-Positive-Rate: ${(stats.rejected / total * 100).toFixed(1)}%`);
  }

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
