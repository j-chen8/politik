/**
 * Cross-Check: ein zweiter LLM (Mistral) liest denselben Quelltext (Wikipedia
 * oder Homepage) und extrahiert einen CV. Vergleicht mit unserem bestehenden
 * cv_json/cv_homepage_json (von Llama via Groq).
 *
 * Disagreements zwischen den beiden LLMs sind starke Halluzinations-Signale.
 *
 * Default: 50 prominenteste MdBs (höchste Reden-Anzahl).
 *
 * Run: npx tsx scripts/cross-check-mistral.ts [--limit N] [--id POL_ID]
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
const REPORT_PATH = path.join(process.cwd(), "cross-check-report.md");

// Mehrere MISTRAL_API_KEY* (analog zu GROQ_API_KEY*) — Round-Robin
const MISTRAL_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("MISTRAL_API_KEY") && v)
  .map(([, v]) => v as string);
const MISTRAL_MODEL = "mistral-small-latest";   // genug für Faktenextraktion, im Free Tier
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

if (MISTRAL_KEYS.length === 0) {
  console.error("Kein MISTRAL_API_KEY* in .env gefunden — siehe https://console.mistral.ai/api-keys/");
  process.exit(1);
}
console.log(`${MISTRAL_KEYS.length} Mistral-Key(s) verfügbar`);
let mistralKeyIdx = 0;
function nextMistralKey() { return MISTRAL_KEYS[mistralKeyIdx++ % MISTRAL_KEYS.length]; }

const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 50;
const ID_IDX = process.argv.indexOf("--id");
const ID_FILTER = ID_IDX > -1 ? parseInt(process.argv[ID_IDX + 1], 10) : null;

const SYSTEM_PROMPT = `Du extrahierst aus einem Quelltext einen strukturierten Lebenslauf in deutschem JSON.

SCHEMA (alle vier Felder Pflicht, leeres Array [] wenn nichts dazu im Text steht):
{
  "ausbildung":            [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "beruflicher_werdegang": [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "politische_stationen":  [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "sonstiges":             [ { "jahr": "<string>", "text": "<string>" }, ... ]
}

ABSOLUT VERBOTEN:
- Beispiele/Demo-Inhalte erfinden. Nur Fakten, die im Text stehen.
- Universitäten, Verlage, Buchtitel, Jahreszahlen erfinden, die nicht WÖRTLICH genannt sind.

REGELN:
- jahr als String exakt im Format wie im Text: "YYYY", "YYYY-YYYY", "seit YYYY", "" wenn keine Jahresangabe.
- text präzise (max ~200 Zeichen, ein Satz).
- Antworte NUR mit dem JSON-Objekt.`;

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callMistral(name: string, sourceLabel: string, text: string): Promise<CV | null> {
  const trimmed = text.slice(0, 12000);
  const userPrompt = `Politiker: ${name}\n\n${sourceLabel}:\n${trimmed}`;

  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${nextMistralKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    if (res.status === 429) {
      const ra = res.headers.get("retry-after");
      const wait = ra ? Math.min(120000, parseFloat(ra) * 1000) : 30000;
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Bei 5xx kurz warten und retry
      if (res.status >= 500 && attempt < 5) { await sleep(5000); continue; }
      throw new Error(`Mistral HTTP ${res.status}: ${body.slice(0, 150)}`);
    }
    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    try { return JSON.parse(content) as CV; } catch { return null; }
  }
  throw new Error("Mistral: Alle Retries fehlgeschlagen");
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9äöüß ]/gi, " ").replace(/\s+/g, " ").trim();
}

/** Filter Mistral-spezifische Pseudo-Werte heraus ("199X", "20XX", "?") */
function isJunkYear(jahr: string): boolean {
  if (!jahr) return false;
  return /[xX?]/.test(jahr) && !/\d{4}/.test(jahr);
}

/** Extrahiert das primäre Jahr (Start-Jahr) */
function primaryYear(jahr: string): number | null {
  const m = jahr.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

/** Texte überlappen substantiell (Substring oder hoher Token-Overlap) */
function textsOverlap(a: string, b: string): boolean {
  const an = normalize(a);
  const bn = normalize(b);
  if (an === bn) return true;
  if (an.length >= 25 && bn.length >= 25) {
    if (an.includes(bn.slice(0, 25)) || bn.includes(an.slice(0, 25))) return true;
  }
  // Token-Overlap-Check: wenn ≥ 60 % der Wörter aus dem kürzeren im längeren stehen
  const tokens = (s: string) => new Set(s.split(" ").filter((t) => t.length > 3));
  const at = tokens(an);
  const bt = tokens(bn);
  if (at.size === 0 || bt.size === 0) return false;
  const [smaller, larger] = at.size < bt.size ? [at, bt] : [bt, at];
  let common = 0;
  for (const t of smaller) if (larger.has(t)) common++;
  return common / smaller.size >= 0.6;
}

interface Conflict {
  /** Beide LLMs haben Eintrag mit gleichem oder überlappendem Jahr, aber widersprüchlichen Texten. */
  jahr: string;
  ourText: string;
  mistralText: string;
}

interface DiffResult {
  section: string;
  conflicts: Conflict[];     // 🚨 echte Widersprüche
  ourOnly: Entry[];          // Llama hat, Mistral nicht
  mistralOnly: Entry[];      // Mistral hat, Llama nicht (nach Junk-Filter)
  agreed: number;
}

function diffCv(ours: CV, theirs: CV): DiffResult[] {
  const sections: (keyof CV)[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];
  const out: DiffResult[] = [];
  for (const sec of sections) {
    const ourSec = ours[sec] ?? [];
    // Mistral-Junk (199X etc.) filtern
    const theirSec = (theirs[sec] ?? []).filter((e) => !isJunkYear(e.jahr));

    const conflicts: Conflict[] = [];
    const ourMatched = new Set<number>();
    const theirMatched = new Set<number>();

    for (let i = 0; i < ourSec.length; i++) {
      const o = ourSec[i];
      const oy = primaryYear(o.jahr);
      for (let j = 0; j < theirSec.length; j++) {
        if (theirMatched.has(j)) continue;
        const t = theirSec[j];
        const ty = primaryYear(t.jahr);

        // Direkter Match: gleiches Jahr, überlappender Text → konsensuell
        if (oy !== null && ty !== null && oy === ty) {
          if (textsOverlap(o.text, t.text)) {
            ourMatched.add(i); theirMatched.add(j);
            break;
          } else {
            // Gleiches Jahr, aber Texte sehr unterschiedlich → KONFLIKT
            conflicts.push({ jahr: o.jahr, ourText: o.text, mistralText: t.text });
            ourMatched.add(i); theirMatched.add(j);
            break;
          }
        }
        // Beide ohne Jahr aber Text passt → konsensuell
        if (oy === null && ty === null && textsOverlap(o.text, t.text)) {
          ourMatched.add(i); theirMatched.add(j);
          break;
        }
        // Eins hat Jahr, anderes nicht — Text-Match? → konsensuell
        if (textsOverlap(o.text, t.text)) {
          ourMatched.add(i); theirMatched.add(j);
          break;
        }
      }
    }

    const ourOnly = ourSec.filter((_, i) => !ourMatched.has(i));
    const mistralOnly = theirSec.filter((_, j) => !theirMatched.has(j));
    const agreed = ourMatched.size;
    out.push({ section: sec, conflicts, ourOnly, mistralOnly, agreed });
  }
  return out;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Top-Politiker:innen: höchste Reden-Anzahl, Bundestag, hat Roh-Text
  let sql = `
    SELECT p.id, p.first_name, p.last_name, p.bio_url, p.cv_homepage_text, p.cv_json, p.cv_homepage_json,
      (SELECT COUNT(*) FROM speech_summaries s WHERE s.politician_id = p.id) AS reden
    FROM politicians p
    WHERE (p.cv_homepage_text IS NOT NULL OR p.bio_url IS NOT NULL)
      AND (p.cv_json IS NOT NULL OR p.cv_homepage_json IS NOT NULL)
  `;
  if (ID_FILTER) sql += ` AND p.id = ${ID_FILTER}`;
  sql += ` ORDER BY reden DESC LIMIT ${LIMIT}`;

  const targets = db.prepare(sql).all() as {
    id: number; first_name: string; last_name: string;
    bio_url: string | null; cv_homepage_text: string | null;
    cv_json: string | null; cv_homepage_json: string | null;
    reden: number;
  }[];

  console.log(`${targets.length} Politiker:innen für Cross-Check (mistral-small)\n`);

  const lines: string[] = [];
  lines.push(`# Multi-LLM Cross-Check (Mistral)`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · ${targets.length} Politiker:innen geprüft\n`);

  let totalChecked = 0;
  let totalDisagreements = 0;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const name = `${p.first_name} ${p.last_name}`;
    process.stdout.write(`\r  [${i + 1}/${targets.length}] ${name.padEnd(40)} `);

    // Bevorzugt Homepage-Roh-Text als Quelle (frischer, persönlicher)
    let source: string | null = null;
    let sourceLabel = "";
    let ourCv: CV | null = null;
    if (p.cv_homepage_text && p.cv_homepage_json) {
      source = p.cv_homepage_text;
      sourceLabel = "Homepage-Text";
      try { ourCv = JSON.parse(p.cv_homepage_json) as CV; } catch {}
    } else if (p.bio_url && p.cv_json) {
      // Wikipedia: wir holen den Volltext nochmal
      try {
        const title = decodeURIComponent(p.bio_url.replace(/.*\/wiki\//, "")).replace(/_/g, " ");
        const wpRes = await fetch(`https://de.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(title)}&format=json`);
        const wpData = (await wpRes.json()) as any;
        const pages = wpData?.query?.pages ?? {};
        const first = Object.values(pages)[0] as any;
        source = first?.extract ?? null;
      } catch {}
      sourceLabel = "Wikipedia-Artikel";
      try { ourCv = JSON.parse(p.cv_json) as CV; } catch {}
    }
    if (!source || !ourCv) continue;

    try {
      const mistralCv = await callMistral(name, sourceLabel, source);
      if (!mistralCv) continue;
      const diffs = diffCv(ourCv, mistralCv);
      totalChecked++;

      const totalConflicts = diffs.reduce((s, d) => s + d.conflicts.length, 0);
      const totalOurOnly = diffs.reduce((s, d) => s + d.ourOnly.length, 0);
      const totalMistralOnly = diffs.reduce((s, d) => s + d.mistralOnly.length, 0);
      const totalAgreed = diffs.reduce((s, d) => s + d.agreed, 0);

      // Nur in den Bericht wenn echte Konflikte ODER mehr als 2 Einträge nur bei Llama
      if (totalConflicts === 0 && totalOurOnly < 3) continue;

      totalDisagreements += totalConflicts + totalOurOnly;
      lines.push(`\n## ${name} (id ${p.id}, ${p.reden} Reden)`);
      lines.push(`Quelle: ${sourceLabel} — ${totalAgreed} bestätigt · 🚨 ${totalConflicts} Konflikte · 🔴 ${totalOurOnly} nur-Llama · 🟡 ${totalMistralOnly} nur-Mistral\n`);
      for (const d of diffs) {
        if (d.conflicts.length === 0 && d.ourOnly.length === 0 && d.mistralOnly.length === 0) continue;
        lines.push(`### ${d.section}`);
        if (d.conflicts.length > 0) {
          lines.push(`**🚨 KONFLIKTE — gleiches Jahr, widersprüchliche Aussagen:**`);
          for (const c of d.conflicts) {
            lines.push(`  - **${c.jahr}**`);
            lines.push(`    - Llama: ${c.ourText.slice(0, 150)}`);
            lines.push(`    - Mistral: ${c.mistralText.slice(0, 150)}`);
          }
        }
        if (d.ourOnly.length > 0) {
          lines.push(`**🔴 Nur Llama — Mistral hat nicht bestätigt (mögliche Halluzination):**`);
          for (const e of d.ourOnly) lines.push(`  - ${e.jahr || "?"} — ${e.text.slice(0, 150)}`);
        }
        if (d.mistralOnly.length > 0) {
          lines.push(`**🟡 Nur Mistral — könnte fehlend bei uns sein:**`);
          for (const e of d.mistralOnly) lines.push(`  - ${e.jahr || "?"} — ${e.text.slice(0, 150)}`);
        }
      }
      // Bericht nach jedem Politiker schreiben — überlebt Crash, sichtbarer Progress
      fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
      await sleep(1200);
    } catch (e: any) {
      console.log(`\n  ✗ ${name}: ${e.message?.slice(0, 100)}`);
    }
  }

  console.log(`\n\n=== Fertig ===`);
  console.log(`  Geprüft:        ${totalChecked}`);
  console.log(`  Disagreements:  ${totalDisagreements}`);
  console.log(`  Bericht:        ${REPORT_PATH}`);

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
  db.close();
}

main();
