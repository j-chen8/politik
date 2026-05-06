/**
 * Haiku-4.5-Verifier für Stage-5 Source-Coherence-Flags.
 *
 * Identischer Prompt wie verify-source-coherence.ts (Llama-Variante),
 * damit der Vergleich Opus / Llama / Haiku auf Modellvermögen abzielt
 * und nicht auf Prompt-Unterschieden.
 *
 * Run: npx tsx scripts/verify-source-coherence-haiku.ts
 */

import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
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
const OUT_PATH = path.join(process.cwd(), "haiku-verdicts-source-coherence.jsonl");

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY fehlt in .env");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5";
const SLEEP_MS = 500;

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
  section: string; jahr: string;
  wikipedia: string; homepage: string; reason: string;
}

interface ConflictRow {
  id: number; politicianId: number; name: string;
  section: string; jahr: string;
  wikipedia: string; homepage: string; stage5Reason: string;
}

interface HaikuVerdict {
  id: number; politicianId: number; name: string;
  section: string; jahr: string;
  haiku_verdict: "ECHT" | "PRAEZISIERUNG" | "FALSE_POSITIVE" | "UNKLAR";
  haiku_reason: string;
  raw_response?: string;
  error?: string;
  input_tokens?: number;
  output_tokens?: number;
}

async function classify(c: ConflictRow): Promise<HaikuVerdict> {
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
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    let parsed: any;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch {
      return {
        id: c.id, politicianId: c.politicianId, name: c.name,
        section: c.section, jahr: c.jahr,
        haiku_verdict: "UNKLAR", haiku_reason: "JSON-Parse-Fehler",
        raw_response: text.slice(0, 500), error: "json-parse",
        input_tokens: resp.usage.input_tokens,
        output_tokens: resp.usage.output_tokens,
      };
    }

    const v = String(parsed.verdict ?? "").trim().toUpperCase().replace(/-/g, "_");
    const valid = ["ECHT", "PRAEZISIERUNG", "FALSE_POSITIVE", "UNKLAR"];
    const verdict = valid.includes(v) ? v : "UNKLAR";

    return {
      id: c.id, politicianId: c.politicianId, name: c.name,
      section: c.section, jahr: c.jahr,
      haiku_verdict: verdict as HaikuVerdict["haiku_verdict"],
      haiku_reason: String(parsed.reason ?? "").slice(0, 500),
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
      ...(valid.includes(v) ? {} : { error: `unknown-verdict:${v}` }),
    };
  } catch (e: any) {
    return {
      id: c.id, politicianId: c.politicianId, name: c.name,
      section: c.section, jahr: c.jahr,
      haiku_verdict: "UNKLAR", haiku_reason: "API-Fehler",
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
  let cid = 0;
  for (const r of rows) {
    const arr: Conflict[] = JSON.parse(r.source_conflicts);
    for (const c of arr) {
      cid += 1;
      conflicts.push({
        id: cid, politicianId: r.id, name: r.name,
        section: c.section, jahr: c.jahr,
        wikipedia: c.wikipedia, homepage: c.homepage,
        stage5Reason: c.reason,
      });
    }
  }

  console.log(`${conflicts.length} Konflikte zu verifizieren mit Haiku 4.5`);

  const existing = new Map<number, HaikuVerdict>();
  if (fs.existsSync(OUT_PATH)) {
    for (const line of fs.readFileSync(OUT_PATH, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as HaikuVerdict;
        existing.set(obj.id, obj);
      } catch {}
    }
    console.log(`Resume: ${existing.size} bereits geprüft`);
  }

  const fh = fs.openSync(OUT_PATH, "a");
  const tally: Record<string, number> = {};
  let totalInputTok = 0, totalOutputTok = 0;

  for (const c of conflicts) {
    if (existing.has(c.id)) {
      const v = existing.get(c.id)!;
      tally[v.haiku_verdict] = (tally[v.haiku_verdict] ?? 0) + 1;
      totalInputTok += v.input_tokens ?? 0;
      totalOutputTok += v.output_tokens ?? 0;
      continue;
    }

    const v = await classify(c);
    fs.writeSync(fh, JSON.stringify(v) + "\n");
    tally[v.haiku_verdict] = (tally[v.haiku_verdict] ?? 0) + 1;
    totalInputTok += v.input_tokens ?? 0;
    totalOutputTok += v.output_tokens ?? 0;

    const tag = v.error ? `⚠ ${v.error}` : v.haiku_verdict;
    console.log(`  [${c.id}/${conflicts.length}] ${c.name} (${c.section}/${c.jahr}) → ${tag}`);

    await sleep(SLEEP_MS);
  }

  fs.closeSync(fh);
  db.close();

  // Cost-Schätzung Haiku 4.5: $1/MTok input, $5/MTok output
  const costInput = totalInputTok / 1_000_000 * 1.0;
  const costOutput = totalOutputTok / 1_000_000 * 5.0;

  console.log("\n=== Haiku 4.5 Verdicts ===");
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(16)} ${v}`);
  }
  console.log(`\nTokens: ${totalInputTok} in / ${totalOutputTok} out`);
  console.log(`Cost:   $${(costInput + costOutput).toFixed(4)}`);
  console.log(`Output: ${OUT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
