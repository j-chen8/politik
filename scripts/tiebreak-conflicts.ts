/**
 * Tiebreaker für die 🚨-Konflikte aus dem Mistral-Cross-Check.
 *
 * Für jeden Konflikt aus cross-check-report.md:
 *   - Holt den Original-Quelltext (Wikipedia / Homepage-Roh-Text)
 *   - Fragt GitHub Models (GPT-4o-mini) als drittes unabhängiges LLM:
 *       Welche Aussage stimmt mit dem Quelltext überein? Llama, Mistral, beide, keiner?
 *   - Schreibt einen Bericht mit klarer Entscheidung pro Konflikt
 *
 * Output: tiebreak-report.md mit Empfehlungen — KEIN Auto-Apply.
 *
 * Run: npx tsx scripts/tiebreak-conflicts.ts
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
const REPORT_IN = path.join(process.cwd(), "cross-check-report.md");
const REPORT_OUT = path.join(process.cwd(), "tiebreak-report.md");
const PARTIAL_OUT = path.join(process.cwd(), "tiebreak.partial.jsonl");

function conflictKey(c: { politicianId: number; section: string; jahr: string; llamaText: string }): string {
  return `${c.politicianId}|${c.section}|${c.jahr}|${c.llamaText.slice(0, 40)}`;
}

// Provider-Auswahl:
//   NVIDIA NIM (Phi-4-mini) — Hauptprovider: 40 RPM (kein RPD-Cap), 4. Modell-Familie (Microsoft)
//   GitHub Models (gpt-4o-mini) — Fallback wenn NIM down: 15 RPM, 150 RPD
const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
const GITHUB_KEY = process.env.GITHUB_MODELS_TOKEN;

if (!NVIDIA_KEY && !GITHUB_KEY) {
  console.error("Weder NVIDIA_API_KEY noch GITHUB_MODELS_TOKEN in .env gefunden.");
  process.exit(1);
}

interface ProviderCfg {
  name: string;
  endpoint: string;
  model: string;
  authHeader: () => string;
  /** Mindest-Pause zwischen Calls in ms (Rate-Limit-konservativ) */
  sleepMs: number;
}

const PROVIDERS: ProviderCfg[] = [];
if (NVIDIA_KEY) {
  PROVIDERS.push({
    name: "NVIDIA NIM (nemotron-nano-12b)",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: "nvidia/nemotron-nano-12b-v2-vl",
    authHeader: () => `Bearer ${NVIDIA_KEY}`,
    sleepMs: 2000,
  });
}
if (GITHUB_KEY) {
  PROVIDERS.push({
    name: "GitHub Models (gpt-4o-mini)",
    endpoint: "https://models.github.ai/inference/chat/completions",
    model: "openai/gpt-4o-mini",
    authHeader: () => `Bearer ${GITHUB_KEY}`,
    sleepMs: 4500, // 15 RPM Limit → 4.5s Pause
  });
}
console.log(`Provider-Reihenfolge: ${PROVIDERS.map(p => p.name).join(" → ")}`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Bericht parsen ──

interface ConflictItem {
  politicianId: number;
  politicianName: string;
  section: string;
  jahr: string;
  llamaText: string;
  mistralText: string;
}

function parseReport(md: string): ConflictItem[] {
  const out: ConflictItem[] = [];
  const lines = md.split("\n");
  let politicianName = "";
  let politicianId = 0;
  let section = "";
  let inConflict = false;
  let currentJahr = "";
  let currentLlama: string | null = null;

  for (const line of lines) {
    const polM = line.match(/^## (.+) \(id (\d+),/);
    if (polM) {
      politicianName = polM[1];
      politicianId = parseInt(polM[2], 10);
      section = "";
      continue;
    }
    const secM = line.match(/^### (\w+)/);
    if (secM) {
      section = secM[1];
      inConflict = false;
      continue;
    }
    if (line.includes("🚨 KONFLIKTE")) { inConflict = true; continue; }
    if (line.includes("🔴 Nur Llama") || line.includes("🟡 Nur Mistral")) { inConflict = false; continue; }
    if (!inConflict) continue;

    const jahrM = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*$/);
    if (jahrM) { currentJahr = jahrM[1]; currentLlama = null; continue; }
    const llamaM = line.match(/^\s+-\s+Llama:\s+(.+)$/);
    if (llamaM) { currentLlama = llamaM[1]; continue; }
    const mistralM = line.match(/^\s+-\s+Mistral:\s+(.+)$/);
    if (mistralM && currentLlama) {
      out.push({
        politicianId, politicianName, section, jahr: currentJahr,
        llamaText: currentLlama, mistralText: mistralM[1],
      });
      currentLlama = null;
    }
  }
  return out;
}

// ── Tiebreaker-Aufruf ──

interface Verdict {
  winner: "llama" | "mistral" | "beide" | "keiner" | "unklar";
  reason: string;
  evidenceQuote: string | null;
}

// Aktueller Provider-Index — wechselt bei dauerhaften Fehlern
let providerIdx = 0;

async function callTiebreaker(item: ConflictItem, sourceText: string): Promise<Verdict> {
  const prompt = `Du bist Schiedsrichter zwischen zwei LLM-Aussagen über einen Politiker.

POLITIKER: ${item.politicianName}
SEKTION: ${item.section}
ZEITRAUM: ${item.jahr}

LLAMA SAGT:    "${item.llamaText}"
MISTRAL SAGT:  "${item.mistralText}"

QUELLTEXT (Wikipedia/Homepage):
${sourceText.slice(0, 5000)}

AUFGABE: Entscheide auf Basis des Quelltexts, welche Aussage über den Zeitraum ${item.jahr} korrekt ist.

Antworte AUSSCHLIESSLICH mit JSON:
{
  "winner": "<llama|mistral|beide|keiner|unklar>",
  "reason": "<kurze Begründung, max 1 Satz>",
  "evidenceQuote": "<wörtlicher Zitat-Schnipsel aus dem Quelltext, oder null>"
}

REGELN:
- "llama" → Llama-Aussage stimmt mit Quelltext überein, Mistral nicht
- "mistral" → Mistral stimmt, Llama nicht
- "beide" → Beide Aussagen sind im Quelltext belegt (z.B. weil Person mehrere Rollen hatte)
- "keiner" → Beide widersprechen dem Quelltext
- "unklar" → Quelltext sagt zum Thema gar nichts aus

WICHTIG (für Auditierbarkeit):
- Bei winner = "llama", "mistral" oder "beide" MUSS evidenceQuote ein WÖRTLICHES Zitat (mind. 25 Zeichen) aus dem oben gegebenen Quelltext sein.
- Erfinde NIE ein Zitat. Wenn du keine Stelle findest, die deine Entscheidung belegt, wähle "unklar" oder "keiner".
- Bei "keiner" oder "unklar" darf evidenceQuote null sein.`;

  const triedProviders = new Set<number>();
  outerLoop: while (triedProviders.size < PROVIDERS.length) {
    const cfg = PROVIDERS[providerIdx];
    triedProviders.add(providerIdx);
    let rateLimitsThisProvider = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const fetchPromise = fetch(cfg.endpoint, {
          method: "POST",
          headers: { Authorization: cfg.authHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({
            model: cfg.model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 400,
            // Kein response_format — gemma-3/4 und phi-4-multimodal lehnen es mit 500 ab.
            // Wir parsen JSON aus dem Content selbst (mit Markdown-Strip-Fallback).
          }),
          signal: AbortSignal.timeout(45000),
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("hard-timeout 50s")), 50000)
        );
        const res = (await Promise.race([fetchPromise, timeoutPromise])) as Response;
        if (res.status === 429) {
          rateLimitsThisProvider++;
          // Bei 2× 429 dauerhaft auf den Fallback umstellen (für Rest des Skript-Laufs)
          if (rateLimitsThisProvider >= 2 && PROVIDERS.length > 1) {
            const nextIdx = PROVIDERS.findIndex((_, i) => !triedProviders.has(i));
            if (nextIdx !== -1) {
              console.log(`    ⚠ ${cfg.name} dauerhaft rate-limited → wechsle zu ${PROVIDERS[nextIdx].name}`);
              providerIdx = nextIdx;
              continue outerLoop;
            }
          }
          const ra = res.headers.get("retry-after");
          const wait = ra ? Math.min(60000, parseFloat(ra) * 1000) : 8000;
          console.log(`    ⏳ ${cfg.name} rate-limited, warte ${wait}ms…`);
          await sleep(wait);
          continue;
        }
        if (res.status === 403 || res.status === 402) {
          console.log(`    ⚠ ${cfg.name} Quota erschöpft → Wechsel`);
          const nextIdx = PROVIDERS.findIndex((_, i) => !triedProviders.has(i));
          if (nextIdx !== -1) {
            providerIdx = nextIdx;
            continue outerLoop;
          }
          break;
        }
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          if (attempt === 2) throw new Error(`${cfg.name} HTTP ${res.status}: ${body.slice(0, 150)}`);
          await sleep(3000);
          continue;
        }
        const jsonTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("json-read timeout 30s")), 30000)
        );
        const data = (await Promise.race([res.json(), jsonTimeout])) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty response");
        // Markdown-Wrapper strippen falls vorhanden (gemma + phi-4-multimodal liefern oft ```json...```)
        const stripped = content
          .replace(/^\s*```(?:json)?\s*/, "")
          .replace(/\s*```\s*$/, "")
          .trim();
        return JSON.parse(stripped) as Verdict;
      } catch (e: any) {
        if (attempt === 2) {
          // Letzter Versuch fehlgeschlagen → nächsten Provider testen
          break;
        }
        await sleep(2000);
      }
    }
  }
  throw new Error("Alle Provider fehlgeschlagen");
}

/** Sleep nach erfolgreichem Call basierend auf aktuellem Provider */
function currentSleepMs(): number {
  return PROVIDERS[providerIdx].sleepMs;
}

// ── Main ──

async function main() {
  if (!fs.existsSync(REPORT_IN)) {
    console.error(`${REPORT_IN} fehlt. Erst scripts/cross-check-mistral.ts laufen lassen.`);
    process.exit(1);
  }
  const md = fs.readFileSync(REPORT_IN, "utf-8");
  const conflicts = parseReport(md);
  console.log(`${conflicts.length} Konflikte aus Bericht geladen`);
  if (conflicts.length === 0) return;

  const db = new Database(DB_PATH);

  // Pro Politiker:in den Quelltext einmal laden
  const sourceCache = new Map<number, string>();
  function getSource(id: number): string | null {
    if (sourceCache.has(id)) return sourceCache.get(id)!;
    const r = db.prepare("SELECT cv_homepage_text, bio_summary FROM politicians WHERE id = ?").get(id) as { cv_homepage_text: string | null; bio_summary: string | null } | undefined;
    if (!r) return null;
    const src = r.cv_homepage_text ?? r.bio_summary ?? "";
    sourceCache.set(id, src);
    return src;
  }

  // ── Resume-Set aus tiebreak.partial.jsonl laden ──
  type Persisted = { key: string; conflict: ConflictItem; verdict: Verdict };
  const cached = new Map<string, Persisted>();
  if (fs.existsSync(PARTIAL_OUT)) {
    for (const line of fs.readFileSync(PARTIAL_OUT, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as Persisted;
        if (obj.key) cached.set(obj.key, obj);
      } catch {}
    }
    console.log(`Resume: ${cached.size} bereits verarbeitete Konflikte aus ${path.basename(PARTIAL_OUT)} geladen`);
  }
  const partialFh = fs.openSync(PARTIAL_OUT, "a");
  function persist(c: ConflictItem, verdict: Verdict) {
    const row: Persisted = { key: conflictKey(c), conflict: c, verdict };
    fs.writeSync(partialFh, JSON.stringify(row) + "\n");
  }

  const tally = { llama: 0, mistral: 0, beide: 0, keiner: 0, unklar: 0, error: 0 };

  // Verdikte sammeln (aus Cache + neue), am Ende in einen Bericht
  const verdicts: { c: ConflictItem; verdict: Verdict }[] = [];

  for (let i = 0; i < conflicts.length; i++) {
    const c = conflicts[i];
    const key = conflictKey(c);

    // Schon verarbeitet? Aus Cache übernehmen.
    const hit = cached.get(key);
    if (hit) {
      tally[hit.verdict.winner] = (tally[hit.verdict.winner] ?? 0) + 1;
      verdicts.push({ c: hit.conflict, verdict: hit.verdict });
      continue;
    }

    const src = getSource(c.politicianId);
    if (!src) { tally.error++; continue; }

    try {
      const verdict = await callTiebreaker(c, src);
      tally[verdict.winner] = (tally[verdict.winner] ?? 0) + 1;
      verdicts.push({ c, verdict });
      persist(c, verdict);

      if ((i + 1) % 25 === 0 || i === 0) {
        console.log(`  [${i + 1}/${conflicts.length}] ${c.politicianName} → ${verdict.winner}`);
      }

      // Sleep abhängig vom aktuellen Provider
      await sleep(currentSleepMs());
    } catch (e: any) {
      tally.error++;
      console.log(`\n  ✗ ${c.politicianName}: ${e.message?.slice(0, 100)}`);
    }
  }

  fs.closeSync(partialFh);

  // ── Bericht aus allen Verdikten aufbauen ──
  const lines: string[] = [];
  lines.push(`# Tiebreak-Bericht (qwen3-next-80b)`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · ${verdicts.length} Konflikte überprüft\n`);
  let lastPoliticianId = 0;
  for (const { c, verdict } of verdicts) {
    if (lastPoliticianId !== c.politicianId) {
      lines.push(`\n## ${c.politicianName} (id ${c.politicianId})`);
      lastPoliticianId = c.politicianId;
    }
    const icon = { llama: "🟦 LLAMA", mistral: "🟧 MISTRAL", beide: "🟩 BEIDE", keiner: "🟥 KEINER", unklar: "⬜ UNKLAR" }[verdict.winner] || "❓";
    lines.push(`- **${c.section}** · ${c.jahr} → ${icon}`);
    lines.push(`  - Llama: ${c.llamaText.slice(0, 130)}`);
    lines.push(`  - Mistral: ${c.mistralText.slice(0, 130)}`);
    lines.push(`  - **Begründung:** ${verdict.reason}`);
    if (verdict.evidenceQuote) lines.push(`  - **Beleg:** "${verdict.evidenceQuote.slice(0, 200)}"`);
  }

  console.log(`\n\n=== Verdikte ===`);
  console.log(`  Llama gewinnt:   ${tally.llama}`);
  console.log(`  Mistral gewinnt: ${tally.mistral}`);
  console.log(`  Beide korrekt:   ${tally.beide}`);
  console.log(`  Beide falsch:    ${tally.keiner}`);
  console.log(`  Unklar:          ${tally.unklar}`);
  console.log(`  Fehler:          ${tally.error}`);

  // Header mit Statistik vorne anhängen
  const summary = [
    `## Verdikte Übersicht`,
    `| Sieger | Anzahl |`,
    `|---|---:|`,
    `| 🟦 Llama | ${tally.llama} |`,
    `| 🟧 Mistral | ${tally.mistral} |`,
    `| 🟩 Beide korrekt | ${tally.beide} |`,
    `| 🟥 Beide falsch (Halluzinationen!) | ${tally.keiner} |`,
    `| ⬜ Unklar (Quelle sagt nichts) | ${tally.unklar} |`,
    ``,
  ].join("\n");
  lines.splice(2, 0, summary);

  fs.writeFileSync(REPORT_OUT, lines.join("\n"), "utf-8");
  console.log(`\nBericht: ${REPORT_OUT}`);
  db.close();
}

main();
