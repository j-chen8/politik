/**
 * Specialist 2a — Datums-Inspektor mit Mistral Small.
 *
 * Pro MdB: bekommt Wikipedia-Volltext + alle cv_json-Einträge,
 * verifiziert für JEDES Datum:
 *   - Steht es WÖRTLICH (oder semantisch eindeutig) im Quelltext?
 *   - Falls "seit YYYY" / "ab YYYY" → muss korrekt erhalten sein
 *   - Falls falsch → korrektes Datum laut Quelltext
 *
 * Output pro Eintrag:
 *   { status: "korrekt" | "datum_falsch" | "nicht_im_text",
 *     korrektes_datum: string | null,
 *     evidence_quote: string }
 *
 * Persistiert nach inspect-dates.partial.jsonl (resume-fähig).
 *
 * Run:
 *   npx tsx scripts/inspect-dates.ts                   # alle MdBs mit Haiku-cv_json
 *   npx tsx scripts/inspect-dates.ts --ids=79129,175003  # nur diese
 *   npx tsx scripts/inspect-dates.ts --print           # Test-Modus, druckt statt persistiert
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
const PARTIAL = path.join(process.cwd(), "inspect-dates.partial.jsonl");

const MISTRAL_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("MISTRAL_API_KEY") && v)
  .map(([, v]) => v as string);
if (MISTRAL_KEYS.length === 0) { console.error("MISTRAL_API_KEY in .env fehlt"); process.exit(1); }
console.log(`${MISTRAL_KEYS.length} Mistral-Key(s) verfügbar`);

const MISTRAL_MODEL = "mistral-small-latest";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const SLEEP_MS = 1500; // Mistral Free Tier: 1 RPS, 500K TPM — generous
const INSPECTOR_VERSION = "inspect-dates-v2-mistral";

const IDS_ARG = process.argv.find((a) => a.startsWith("--ids="));
const ONLY_IDS = IDS_ARG ? IDS_ARG.replace("--ids=", "").split(",").map((s) => parseInt(s.trim(), 10)) : null;
const PRINT_MODE = process.argv.includes("--print");

let keyIdx = 0;
const nextKey = () => MISTRAL_KEYS[keyIdx++ % MISTRAL_KEYS.length];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Entry { section: string; index: number; jahr: string; text: string; }
interface Verdict {
  section: string; index: number; jahr: string; text: string;
  status: "korrekt" | "korrekt_leer" | "datum_falsch" | "halluziniert" | "fehlend" | "unklar";
  korrektes_datum: string | null;
  evidence_quote: string;
}

const SYSTEM_PROMPT = `Du bist Datums-Inspektor. Du prüfst NUR die Datums-Angaben in einem strukturierten Lebenslauf gegen einen Quelltext.

Du bekommst:
1. QUELLTEXT (Wikipedia-Artikel)
2. EINTRÄGE (Liste mit jahr + text)

Für JEDEN Eintrag entscheide eines von 6 Status:

⚠️ WICHTIG: jahr="" (leerer String) bedeutet: der Generator hat absichtlich KEIN Datum gesetzt. Das ist OK wenn der Text auch keines nennt!

- "korrekt": jahr ist gefüllt UND steht wörtlich/semantisch im Quelltext für genau diese Aussage
- "korrekt_leer": jahr="" UND der Quelltext nennt für diese Aussage tatsächlich KEIN Datum (Generator hat richtig gehandelt)
- "datum_falsch": jahr ist gefüllt aber Quelltext nennt ein ANDERES Datum für diese Aussage → gib korrektes Datum
- "halluziniert": jahr ist gefüllt, aber Quelltext nennt KEIN Datum für diese Aussage (Generator hat ein Datum erfunden!) → korrektes_datum: ""
- "fehlend": jahr="" aber Quelltext nennt SEHR WOHL ein Datum für diese Aussage (Generator hat es übersehen) → gib korrektes Datum
- "unklar": Aussage existiert nicht eindeutig im Quelltext

ENTSCHEIDUNGSBAUM:
1. Ist jahr leer ("")?
   → Steht im Text ein Datum für diese Aussage? JA → "fehlend" / NEIN → "korrekt_leer"
2. Ist jahr gefüllt?
   → Steht das jahr (oder semantisch äquivalent) im Text? JA → "korrekt"
   → Steht ein ANDERES Datum im Text? JA → "datum_falsch"
   → Steht GAR KEIN Datum im Text? JA → "halluziniert"

WICHTIG bei "seit YYYY" / "ab YYYY":
- Quelltext "seit 2013" → jahr MUSS "seit 2013" sein, NICHT nur "2013"
- Quelltext "ab April 2016" → jahr MUSS "ab April 2016" oder "ab 2016" sein
- Wenn jahr nur "2013" aber Quelltext sagt "seit 2013" → status: "datum_falsch", korrektes_datum: "seit 2013"

WICHTIG bei Zeiträumen:
- Quelltext "von 2005 bis 2009" → jahr "2005-2009" ist korrekt
- Quelltext "seit 2007" aber jahr "2007-2025" → "datum_falsch", korrektes_datum: "seit 2007"

Antworte NUR mit JSON-Array, ein Verdict pro Eintrag (in derselben Reihenfolge):
[
  { "section": "...", "index": 0, "jahr": "...", "text": "...", "status": "korrekt|korrekt_leer|datum_falsch|halluziniert|fehlend|unklar", "korrektes_datum": null oder "neuer Wert", "evidence_quote": "wörtlicher Schnipsel aus Quelltext oder leer" }
]`;

async function callMistral(payload: object): Promise<any> {
  for (let attempt = 0; attempt < MISTRAL_KEYS.length * 3; attempt++) {
    const key = nextKey();
    const res = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 429) { await sleep(3000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  }
  throw new Error("alle Mistral-Keys rate-limited");
}

function flattenCv(cv: any): Entry[] {
  const entries: Entry[] = [];
  for (const sec of ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"]) {
    const arr = cv[sec] ?? [];
    arr.forEach((e: any, i: number) => entries.push({ section: sec, index: i, jahr: String(e.jahr ?? ""), text: String(e.text ?? "") }));
  }
  return entries;
}

async function inspectMdB(name: string, wikiText: string, cv: any): Promise<Verdict[]> {
  const entries = flattenCv(cv);
  if (entries.length === 0) return [];

  const userMsg = `POLITIKER: ${name}

QUELLTEXT (Wikipedia):
${wikiText.slice(0, 15000)}

EINTRÄGE zu prüfen (${entries.length} Stück):
${JSON.stringify(entries, null, 2)}

Prüfe jeden Eintrag und gib genau ${entries.length} Verdict-Objekte als JSON-Array zurück.`;

  const data = await callMistral({
    model: MISTRAL_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    response_format: { type: "json_object" },
    temperature: 0.0,
    max_tokens: 8192,  // erhöht von 4096 — Truncation bei Vielredner-MdBs (Roth, Röttgen, Linnemann etc.)
  });

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Kein content in Response");

  // Mistral wraps array in object — find array
  let parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    // pure array
  } else if (parsed.verdicts && Array.isArray(parsed.verdicts)) {
    parsed = parsed.verdicts;
  } else {
    // try to find first array-valued property
    const arrKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    if (arrKey) parsed = parsed[arrKey];
    else throw new Error(`Kein Array gefunden in: ${content.slice(0, 200)}`);
  }
  return parsed as Verdict[];
}

async function main() {
  const db = new Database(DB_PATH, { readonly: !PRINT_MODE });

  let sql: string;
  if (ONLY_IDS) {
    sql = `SELECT id, first_name || ' ' || last_name AS name, bio_full_text, cv_json, cv_prompt_version
           FROM politicians WHERE id IN (${ONLY_IDS.join(",")})`;
  } else {
    sql = `SELECT id, first_name || ' ' || last_name AS name, bio_full_text, cv_json, cv_prompt_version
           FROM politicians
           WHERE cv_prompt_version = 'seed-cv-v5-haiku'
             AND bio_full_text IS NOT NULL`;
  }
  const rows = db.prepare(sql).all() as { id: number; name: string; bio_full_text: string; cv_json: string; cv_prompt_version: string }[];

  // Resume: schon verarbeitete IDs überspringen
  const done = new Set<number>();
  if (!PRINT_MODE && fs.existsSync(PARTIAL)) {
    for (const line of fs.readFileSync(PARTIAL, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try { done.add(JSON.parse(line).politician_id); } catch {}
    }
  }
  const todo = rows.filter((r) => !done.has(r.id));
  console.log(`\n${rows.length} MdBs gesamt, ${done.size} schon verarbeitet, ${todo.length} todo.\n`);

  let stats = { korrekt: 0, korrekt_leer: 0, datum_falsch: 0, halluziniert: 0, fehlend: 0, unklar: 0 };

  for (let i = 0; i < todo.length; i++) {
    const r = todo[i];
    let cv: any;
    try { cv = JSON.parse(r.cv_json); } catch { console.log(`✗ ${r.id} ${r.name}: cv_json nicht parsebar`); continue; }
    const total = flattenCv(cv).length;
    if (total === 0) { console.log(`  ${r.id} ${r.name}: 0 Einträge (skip)`); continue; }

    try {
      const verdicts = await inspectMdB(r.name, r.bio_full_text, cv);
      for (const v of verdicts) {
        if (v.status in stats) stats[v.status as keyof typeof stats]++;
      }
      const summary = verdicts.reduce((acc: any, v) => {
        acc[v.status] = (acc[v.status] ?? 0) + 1; return acc;
      }, {});

      if (PRINT_MODE) {
        console.log("\n" + "═".repeat(80));
        console.log(`${r.id} ${r.name} — ${verdicts.length} Einträge`);
        console.log("Summary:", summary);
        for (const v of verdicts) {
          const flag = v.status === "korrekt" ? "✓"
            : v.status === "korrekt_leer" ? "○"
            : v.status === "datum_falsch" ? "⚠"
            : v.status === "halluziniert" ? "✗"
            : v.status === "fehlend" ? "+"
            : "?";
          console.log(`  ${flag} [${v.section}] [${v.jahr.padEnd(15)}] → ${v.status}` +
            (v.korrektes_datum !== null && v.korrektes_datum !== undefined ? `  → korrekt: "${v.korrektes_datum}"` : "") +
            `\n      text: ${v.text.slice(0, 80)}` +
            (v.evidence_quote ? `\n      quote: "${v.evidence_quote.slice(0, 100)}"` : ""));
        }
      } else {
        fs.appendFileSync(PARTIAL, JSON.stringify({
          politician_id: r.id, name: r.name, inspector_version: INSPECTOR_VERSION,
          verdicts, summary,
        }) + "\n");
        const probs = stats.datum_falsch + stats.halluziniert + stats.fehlend;
        process.stdout.write(`\r  [${i + 1}/${todo.length}] ${r.id} ${r.name.slice(0, 28).padEnd(28)} ok=${stats.korrekt + stats.korrekt_leer} probleme=${probs}      `);
      }
    } catch (e: any) {
      console.log(`\n✗ ${r.id} ${r.name}: ${e.message?.slice(0, 150)}`);
    }
    await sleep(SLEEP_MS);
  }

  if (!PRINT_MODE) process.stdout.write("\n");
  console.log("\n=== Fertig ===");
  console.log(`  korrekt:        ${stats.korrekt}`);
  console.log(`  korrekt_leer:   ${stats.korrekt_leer}  (Generator hat REGEL 0 befolgt)`);
  console.log(`  datum_falsch:   ${stats.datum_falsch}  ← reparieren`);
  console.log(`  halluziniert:   ${stats.halluziniert}  ← reparieren (Datum löschen)`);
  console.log(`  fehlend:        ${stats.fehlend}  ← reparieren (Datum ergänzen)`);
  console.log(`  unklar:         ${stats.unklar}`);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const ok = stats.korrekt + stats.korrekt_leer;
  const problems = stats.datum_falsch + stats.halluziniert + stats.fehlend;
  if (total > 0) {
    console.log(`  Korrekt total:  ${ok}/${total} = ${(ok / total * 100).toFixed(1)}%`);
    console.log(`  Repair-Bedarf:  ${problems}/${total} = ${(problems / total * 100).toFixed(1)}%`);
  }

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
