/**
 * Verifier-Pass für Stage-5 Source-Coherence-Flags.
 *
 * Liest alle Konflikte aus politicians.source_conflicts und lässt jedes
 * Konflikt-Flag von Llama 3.3 70B als zweiter Layer prüfen. Klassifikation:
 *   - ECHT: echter Quellen-Widerspruch, eine Quelle ist falsch
 *   - PRAEZISIERUNG: eine Quelle vereinfacht/vergröbert, kein echter Widerspruch
 *   - FALSE_POSITIVE: Stage-5 hat falsch geflaggt (kompatible Aussagen)
 *   - UNKLAR: braucht manuelle Recherche
 *
 * Provider: Groq Free Tier (llama-3.3-70b-versatile).
 *
 * Run: npx tsx scripts/verify-source-coherence.ts
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
const OUT_PATH = path.join(process.cwd(), "llama-verdicts-source-coherence.jsonl");

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);
if (GROQ_KEYS.length === 0) {
  console.error("Keine GROQ_API_KEY* in .env");
  process.exit(1);
}
let keyIdx = 0;
const nextGroqKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const SLEEP_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPT = `Du bist Schiedsrichter für einen Source-Coherence-Inspector. Ein anderer LLM (gpt-oss-120b) hat einen vermeintlichen Widerspruch zwischen einem Wikipedia-CV-Eintrag und einem Homepage-CV-Eintrag eines Politikers geflaggt. Deine Aufgabe: prüfe nüchtern, ob das wirklich ein Widerspruch ist.

Klassifiziere die Beziehung zwischen den beiden Aussagen in EINE der folgenden vier Kategorien:

ECHT
  Die Aussagen widersprechen sich faktisch. Eine der Quellen ist falsch oder veraltet. Beispiele:
  - Verschiedene Schulen für denselben Abschluss
  - Unterschiedliche Wahlkreise / Mandate für dasselbe Mandat
  - Unterschiedliche Funktionsstufen, die sich gegenseitig ausschließen (Vorsitzender vs. stellvertretender Vorsitzender im selben Gremium)
  - Verschiedene Arbeitgeber im selben Zeitraum

PRAEZISIERUNG
  Beide Aussagen sind kompatibel, eine ist nur ungenauer/abstrahierter. Kein echter Widerspruch. Beispiele:
  - "Vorsitz" vs. "Co-Vorsitz" — Vereinfachung
  - "Moskau" vs. "Berlin und Moskau" — eine Quelle kürzt
  - Karriere-Stufen innerhalb desselben Zeitraums (Anwärter → Beamter)
  - Eine Quelle nennt eine Sub-Phase, die in der anderen enthalten ist
  - Identische Sache mit anderem Detail-Level

FALSE_POSITIVE
  Stage-5 hat falsch geflaggt. Die Aussagen sind nicht widersprüchlich, sondern beschreiben:
  - Verschiedene Sachverhalte im selben Jahr (z.B. Studienabschluss + Beginn nächste Ausbildung)
  - Identische Institution mit anderem Namen (Umbenennung, Übernahme)
  - Verschiedene Aussage-Kategorien (Identität vs. Funktion)
  - Genus-/Flexions-Variante als vermeintlicher Widerspruch (z.B. "Vorsitzender" vs. "Landesvorsitzende")
  - Funktion innerhalb einer übergeordneten Rolle (z.B. Schriftführer ist immer auch Abgeordneter)
  - Inhaltlich kompatibel, weil eine Aussage die andere impliziert

UNKLAR
  Aus dem gegebenen Kontext nicht eindeutig entscheidbar. Brauche Faktenrecherche oder mehr Kontext.

Antworte AUSSCHLIESSLICH mit JSON unter dem Key "verdict":
{
  "verdict": "ECHT" | "PRAEZISIERUNG" | "FALSE_POSITIVE" | "UNKLAR",
  "reason": "<1-2 Sätze, sachlich, ohne Hedging>"
}`;

interface Conflict {
  section: string;
  jahr: string;
  wikipedia: string;
  homepage: string;
  reason: string;
}

interface ConflictRow {
  id: number;
  conflictIndex: number;  // index within politician's conflict array
  politicianId: number;
  name: string;
  section: string;
  jahr: string;
  wikipedia: string;
  homepage: string;
  stage5Reason: string;
}

interface LlamaVerdict {
  id: number;
  politicianId: number;
  name: string;
  section: string;
  jahr: string;
  llama_verdict: "ECHT" | "PRAEZISIERUNG" | "FALSE_POSITIVE" | "UNKLAR";
  llama_reason: string;
  raw_response?: string;
  error?: string;
}

async function callGroq(payload: object): Promise<any> {
  for (let attempt = 0; attempt < GROQ_KEYS.length * 3; attempt++) {
    const key = nextGroqKey();
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, model: MODEL }),
    });
    if (res.status === 429) {
      await sleep(3000);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    return await res.json();
  }
  throw new Error("groq-rate-limited-all-keys");
}

async function classifyConflict(c: ConflictRow): Promise<LlamaVerdict> {
  const userMsg = `POLITIKER: ${c.name}
SEKTION: ${c.section}
ZEITRAUM/JAHR: ${c.jahr}

AUSSAGE A (Wikipedia):
${c.wikipedia}

AUSSAGE B (Homepage):
${c.homepage}

STAGE-5 REASONING (gpt-oss-120b):
${c.stage5Reason}

Klassifiziere die Beziehung zwischen Aussage A und Aussage B nüchtern. Gib genau ein JSON-Objekt zurück: {"verdict": "...", "reason": "..."}.`;

  try {
    const data = await callGroq({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
      temperature: 0.0,
      max_tokens: 1024,
    });

    const content = data?.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        id: c.id, politicianId: c.politicianId, name: c.name,
        section: c.section, jahr: c.jahr,
        llama_verdict: "UNKLAR", llama_reason: "JSON-Parse-Fehler",
        raw_response: content.slice(0, 500),
        error: "json-parse",
      };
    }

    const v = String(parsed.verdict ?? "").trim().toUpperCase().replace(/-/g, "_");
    const validVerdicts = ["ECHT", "PRAEZISIERUNG", "FALSE_POSITIVE", "UNKLAR"];
    const verdict = validVerdicts.includes(v) ? v : "UNKLAR";
    const reason = String(parsed.reason ?? "").slice(0, 500);

    return {
      id: c.id, politicianId: c.politicianId, name: c.name,
      section: c.section, jahr: c.jahr,
      llama_verdict: verdict as LlamaVerdict["llama_verdict"],
      llama_reason: reason,
      ...(verdict === "UNKLAR" && !validVerdicts.includes(v)
        ? { error: `unknown-verdict:${v}` }
        : {}),
    };
  } catch (e: any) {
    return {
      id: c.id, politicianId: c.politicianId, name: c.name,
      section: c.section, jahr: c.jahr,
      llama_verdict: "UNKLAR", llama_reason: "API-Fehler",
      error: e.message?.slice(0, 200) ?? "unknown",
    };
  }
}

async function main() {
  const db = new Database(DB_PATH, { readonly: true });

  const rows = db.prepare(
    `SELECT p.id, p.first_name || ' ' || p.last_name AS name, p.source_conflicts
     FROM politicians p
     WHERE p.source_conflicts IS NOT NULL AND p.source_conflicts != '[]'
     ORDER BY p.id`
  ).all() as Array<{ id: number; name: string; source_conflicts: string }>;

  const conflicts: ConflictRow[] = [];
  let conflictId = 0;
  for (const r of rows) {
    const arr: Conflict[] = JSON.parse(r.source_conflicts);
    for (let idx = 0; idx < arr.length; idx++) {
      const c = arr[idx];
      conflictId += 1;
      conflicts.push({
        id: conflictId,
        conflictIndex: idx,
        politicianId: r.id,
        name: r.name,
        section: c.section,
        jahr: c.jahr,
        wikipedia: c.wikipedia,
        homepage: c.homepage,
        stage5Reason: c.reason,
      });
    }
  }

  console.log(`${conflicts.length} Konflikte zu verifizieren`);

  // Resume: bereits geprüfte aus OUT_PATH überspringen
  const existing = new Map<number, LlamaVerdict>();
  if (fs.existsSync(OUT_PATH)) {
    for (const line of fs.readFileSync(OUT_PATH, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as LlamaVerdict;
        existing.set(obj.id, obj);
      } catch {}
    }
    console.log(`Resume: ${existing.size} bereits geprüft`);
  }

  const fh = fs.openSync(OUT_PATH, "a");
  const tally: Record<string, number> = {};

  for (let i = 0; i < conflicts.length; i++) {
    const c = conflicts[i];
    if (existing.has(c.id)) {
      const v = existing.get(c.id)!;
      tally[v.llama_verdict] = (tally[v.llama_verdict] ?? 0) + 1;
      continue;
    }

    const v = await classifyConflict(c);
    fs.writeSync(fh, JSON.stringify(v) + "\n");
    tally[v.llama_verdict] = (tally[v.llama_verdict] ?? 0) + 1;

    const tag = v.error ? `⚠ ${v.error}` : v.llama_verdict;
    console.log(`  [${c.id}/${conflicts.length}] ${c.name} (${c.section}/${c.jahr}) → ${tag}`);

    await sleep(SLEEP_MS);
  }

  fs.closeSync(fh);
  db.close();

  console.log("\n=== Llama 70B Verdicts ===");
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(16)} ${v}`);
  }
  console.log(`\nOutput: ${OUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
