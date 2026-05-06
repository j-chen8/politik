/**
 * Generiert für jeden Bundestags-MdB einen strukturierten Lebenslauf
 * via Anthropic Claude Haiku 4.5 mit JSON-Schema-Validation.
 *
 * Pipeline: politicians.bio_full_text → Haiku → cv_json
 * (bio_full_text ist Wikipedia-Volltext, in DB gecacht)
 *
 * Schreibt nach politicians.{cv_json, cv_source, cv_generated_at,
 *                            cv_model, cv_prompt_version, cv_raw_llm_response}.
 *
 * Run:
 *   npx tsx scripts/seed-cv.ts                        # nur fehlende
 *   npx tsx scripts/seed-cv.ts --refresh              # ALLE neu
 *   npx tsx scripts/seed-cv.ts --ids 79129,175003     # nur bestimmte IDs (überschreibt immer)
 *   npx tsx scripts/seed-cv.ts --all                  # auch Nicht-Bundestags-Politiker
 *   npx tsx scripts/seed-cv.ts --refresh-old-version  # nur die mit alter prompt_version
 */

import Anthropic from "@anthropic-ai/sdk";
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

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error("ANTHROPIC_API_KEY in .env fehlt");
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
const MODEL = "claude-haiku-4-5";
const PROMPT_VERSION = "seed-cv-v5-haiku";

// Tier-1: 50 RPM aber ITPM 50K. Bei ~5K Input/Call ~10 RPM safe.
// 6500ms Sleep = ~9 RPM, sicher unter Limit. Ggf. später anpassen wenn Tier-1 mehr ITPM bekommt.
const SLEEP_MS = 6500;

const DB_PATH = path.join(process.cwd(), "politik.db");

// CLI flags
const ALL = process.argv.includes("--all");
const REFRESH = process.argv.includes("--refresh");
const REFRESH_OLD = process.argv.includes("--refresh-old-version");
const IDS_ARG = process.argv.find((a) => a.startsWith("--ids="));
const ONLY_IDS = IDS_ARG
  ? IDS_ARG.replace("--ids=", "").split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n))
  : null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── v5 PROMPT (v4 + REGEL 10 Datums-Konsolidierung + REGEL 11 Privates strenger) ──

const SYSTEM_PROMPT = `Du bist ein Assistent, der aus Wikipedia-Artikeln über Politiker einen strukturierten Lebenslauf in deutschem JSON extrahiert.

═══════════════════════════════════════════════════════════════════
KLASSIFIKATIONS-REGELN — was gehört in welche Sektion?
═══════════════════════════════════════════════════════════════════

ausbildung:
  - Schule, Abitur, Berufsausbildung, Lehre, Studium, Diplom, M.A., B.A., Promotion, Habilitation
  - NICHT: Berufstätigkeit nach dem Abschluss

beruflicher_werdegang:
  - Anstellung, Selbstständigkeit, Berufstätigkeit, Geschäftsführung, Wehrdienst
  - NICHT: politische Mandate oder Ämter (auch nicht "hauptberuflich Abgeordnete")

politische_stationen:
  - Parteimitgliedschaft, Parteiämter (Vorsitz, Vorstand, Beisitzer)
  - Mandate (Stadtrat, Kreistag, Landtag, Bundestag, Europaparlament)
  - Ausschuss-Mitgliedschaften (Innenausschuss, Untersuchungsausschüsse, Gremien)
  - Fraktions-Funktionen (Sprecher:in, Obfrau, Geschäftsführer:in, Fraktionsvorsitz)
  - Regierungs-Ämter (Minister:in, Staatssekretär:in)

sonstiges:
  - Bücher, Dissertationen (als Veröffentlichung), Aufsätze, Auszeichnungen, Ehrungen
  - Kandidaturen, die NICHT zur Wahl führten (z.B. erfolglose Listenplatz-Bewerbung)
  - Vereins-Engagement, Ehrenämter außerhalb der Politik
  - NICHT: aktuelle politische Mandate oder Ausschuss-Posten

ABSOLUT VERBOTEN:
- Erfinden von Universitäten, Abschlüssen, Verlagen, Buchtiteln, Jahreszahlen oder anderen Fakten, die nicht WÖRTLICH im gelieferten Text stehen.
- Wenn der Text z.B. keine Bücher nennt: "sonstiges" bleibt leer (für Bücher-Einträge).

═══════════════════════════════════════════════════════════════════
WICHTIG — REGELN FÜR ZEITANGABEN (häufige Fehlerquelle!):
═══════════════════════════════════════════════════════════════════

⚠️ REGEL 0 — DIE WICHTIGSTE: KEIN JAHR IM TEXT → KEIN JAHR IM OUTPUT!
Wenn der Quelltext für ein Ereignis KEIN Jahr/Datum nennt → schreibe "jahr": "" (LEERER String).
NIEMALS ein Jahr "plausibel" ableiten, schätzen, oder aus dem Kontext erfinden.

  ✓ "Hoffmann arbeitete 9,5 Jahre bei Union Investment." → jahr: ""  (KEIN Jahr genannt!)
  ✗ FALSCH: "2015-2024" oder "2013-2022" — solche Bereiche sind ERFUNDEN

  ✓ "Nach der Schule absolvierte sie eine Ausbildung zur Verwaltungsfachangestellten." → jahr: ""
  ✗ FALSCH: "1998-2002" — KEIN Jahr im Text!

REGEL 1 — EINZELJAHR:
Steht nur EIN Jahr im Text → schreibe "YYYY".
  ✓ "2016 trat sie der AfD bei" → jahr: "2016"

⚠️ REGEL 2 — "seit YYYY" / "ab YYYY" WÖRTLICH ERHALTEN:
Steht "seit YYYY" / "ab YYYY" / "seither" / "bis heute" im Text → schreibe EXAKT "seit YYYY" bzw. "ab YYYY".
NIEMALS zu nur "YYYY" verkürzen.

  ✓ "Sie ist seit 2013 Mitglied des Bundestages." → jahr: "seit 2013"
  ✗ FALSCH: "2013" (verliert das "seit"!) oder "2013-2017"

REGEL 3 — ZEITRAUM nur wenn BEIDE Daten WÖRTLICH im Text stehen:
  ✓ "Von 2005 bis 2009 war er Bürgermeister." → jahr: "2005-2009"
  ✗ "Sie ist seit 2007 bei der Polizei Köln." → KEIN "1993-2007"

REGEL 4 — REIHENFOLGE NICHT UMDREHEN:
"Ab YYYY" / "seit YYYY" markiert den ANFANG, nicht das Ende.
  ✓ "Ab 2007 war sie beim Polizeipräsidium Köln tätig." → jahr: "ab 2007"
  ✗ FALSCH: "1993-2007"

REGEL 5 — DATEN-ZUORDNUNG bei mehreren Ereignissen:
Wenn mehrere Daten im selben Satz stehen, ordne JEDES Datum dem RICHTIGEN Ereignis zu.
  Quelltext: "Sie trat 2016 der AfD bei. Seit 2019 ist sie Stadträtin in Klötze."
  ✓ {"jahr": "2016", "text": "Eintritt in die AfD"}
  ✓ {"jahr": "seit 2019", "text": "Stadträtin in Klötze"}

REGEL 6 — KEINE EXTRAPOLATION:
Wenn nur ein Anfangsjahr ohne Endjahr genannt ist → "seit YYYY", NIE Endjahr erfinden.

REGEL 7 — MANDATS-KONTINUITÄT:
"seit 2013 Mitglied" ist EIN Eintrag, KEINE Pausen zwischen Wahlperioden konstruieren.

REGEL 8 — KEINE QUELLEN-VERWECHSLUNG:
"Beisitzer im Landesvorstand der Partei X" NICHT zu "tätig im Landtag" umdeuten.

REGEL 9 — KEINE DOPPELUNGEN:
Ein Ereignis darf NUR EINMAL im Output erscheinen.

⚠️ REGEL 10 — DATUMS-KONSOLIDIERUNG (gegen Redundanz):
Wenn mehrere Sub-Aussagen dasselbe Datum teilen, mache EINEN Eintrag der diese zusammenfasst, nicht mehrere mit gleichem Datum.

  Quelltext: "Seit März 2025 ist er Mitglied im Finanzausschuss, im Ausschuss für wirtschaftliche Zusammenarbeit und ständiger Vertreter im Haushaltsausschuss."
  ✓ {"jahr": "seit März 2025", "text": "Mitglied im Finanzausschuss, Ausschuss für wirtschaftliche Zusammenarbeit, ständiger Vertreter im Haushaltsausschuss"}
  ✗ FALSCH: 3 separate Einträge mit "seit März 2025"

⚠️ REGEL 11 — PRIVATES NUR WENN POLITISCH RELEVANT:
Familienstand, Wohnort, Anzahl Kinder NUR übernehmen, wenn der Text sie als explizit relevant für das politische Profil markiert (z.B. "Mutter dreier Kinder, daher Engagement für Familienpolitik").
Reine Privatleben-Aufzählungen ("verheiratet, zwei Kinder, wohnt in X") WEGLASSEN.

═══════════════════════════════════════════════════════════════════

Weitere Regeln:
- Nur Fakten aus dem gelieferten Text. Keine Vermutungen, keine Erfindungen.
- Chronologisch sortiert (älteste zuerst).
- jahr-Format: "YYYY", "YYYY-YYYY", "seit YYYY", "ab YYYY", "bis YYYY" — wie im Text. Leerer String "" wenn kein Datum genannt.
- Bei Ausbildung: WENN im Text genannt, IMMER Universität/Schule UND Abschluss/Titel mitnennen.
- Bei Berufen: Position + Arbeitgeber/Firma falls genannt.
- text präzise und vollständig (max ~250 Zeichen, ein Satz).
- Wenn ein Bereich keine Einträge hat: leeres Array [].`;

interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

const CV_SCHEMA = {
  type: "object",
  properties: {
    ausbildung: { type: "array", items: { type: "object",
      properties: { jahr: { type: "string" }, text: { type: "string" } },
      required: ["jahr", "text"], additionalProperties: false } },
    beruflicher_werdegang: { type: "array", items: { type: "object",
      properties: { jahr: { type: "string" }, text: { type: "string" } },
      required: ["jahr", "text"], additionalProperties: false } },
    politische_stationen: { type: "array", items: { type: "object",
      properties: { jahr: { type: "string" }, text: { type: "string" } },
      required: ["jahr", "text"], additionalProperties: false } },
    sonstiges: { type: "array", items: { type: "object",
      properties: { jahr: { type: "string" }, text: { type: "string" } },
      required: ["jahr", "text"], additionalProperties: false } },
  },
  required: ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"],
  additionalProperties: false,
} as const;

function ensureColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("cv_json")) db.exec("ALTER TABLE politicians ADD COLUMN cv_json TEXT");
  if (!have.has("cv_source")) db.exec("ALTER TABLE politicians ADD COLUMN cv_source TEXT");
  if (!have.has("cv_generated_at")) db.exec("ALTER TABLE politicians ADD COLUMN cv_generated_at TEXT");
  if (!have.has("cv_model")) db.exec("ALTER TABLE politicians ADD COLUMN cv_model TEXT");
  if (!have.has("cv_prompt_version")) db.exec("ALTER TABLE politicians ADD COLUMN cv_prompt_version TEXT");
  if (!have.has("cv_raw_llm_response")) db.exec("ALTER TABLE politicians ADD COLUMN cv_raw_llm_response TEXT");
}

async function generateCv(name: string, wikipediaText: string): Promise<{ cv: CV; raw: string; usage: any }> {
  const text = wikipediaText.slice(0, 50000);
  const userPrompt = `Politiker: ${name}\n\nWikipedia-Artikel:\n${text}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,  // erhöht von 4096 — Truncation bei langjährigen MdBs (z.B. Kiesewetter)
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    output_config: { format: { type: "json_schema", schema: CV_SCHEMA } },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Kein text-Block in Response");

  let raw = textBlock.text.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) raw = fenced[1];

  return { cv: JSON.parse(raw) as CV, raw, usage: response.usage };
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureColumns(db);

  // Query-Strategie:
  // - --ids=…: nur diese, immer überschreiben
  // - --refresh: alle Bundestags-MdBs (oder --all), überschreiben
  // - --refresh-old-version: nur die mit alter prompt_version
  // - default: nur die ohne cv_json
  let sql: string;
  if (ONLY_IDS) {
    sql = `SELECT id, first_name, last_name, bio_full_text
           FROM politicians WHERE id IN (${ONLY_IDS.join(",")})
             AND bio_full_text IS NOT NULL AND length(bio_full_text) > 200`;
  } else {
    const baseSelect = `SELECT DISTINCT p.id, p.first_name, p.last_name, p.bio_full_text
                        FROM politicians p`;
    const mandateJoin = ALL ? "" : `
      JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
      JOIN parliament_periods pp ON m.parliament_period_id = pp.id
      JOIN parliaments par ON pp.parliament_id = par.id`;
    const mandateWhere = ALL ? "" : "AND par.type = 'bundestag'";

    let filterClause: string;
    if (REFRESH) filterClause = "";
    else if (REFRESH_OLD) filterClause = `AND (p.cv_prompt_version IS NULL OR p.cv_prompt_version != '${PROMPT_VERSION}')`;
    else filterClause = "AND p.cv_json IS NULL";

    sql = `${baseSelect}${mandateJoin}
           WHERE p.bio_full_text IS NOT NULL AND length(p.bio_full_text) > 200
             ${mandateWhere} ${filterClause}
           ORDER BY p.id`;
  }

  const rows = db.prepare(sql).all() as { id: number; first_name: string; last_name: string; bio_full_text: string }[];

  console.log(`\nModell:          ${MODEL}`);
  console.log(`Prompt-Version:  ${PROMPT_VERSION}`);
  console.log(`Sleep:           ${SLEEP_MS}ms (~${(60000 / SLEEP_MS).toFixed(1)} RPM)`);
  console.log(`MdBs zu verarbeiten: ${rows.length}\n`);
  if (rows.length === 0) {
    console.log("Nichts zu tun.");
    db.close();
    return;
  }

  const update = db.prepare(
    `UPDATE politicians SET cv_json = ?, cv_source = ?, cv_generated_at = ?,
     cv_model = ?, cv_prompt_version = ?, cv_raw_llm_response = ? WHERE id = ?`
  );

  let ok = 0, fail = 0, totalIn = 0, totalOut = 0;
  const start = Date.now();

  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    const name = `${p.first_name} ${p.last_name}`;
    try {
      const { cv, raw, usage } = await generateCv(name, p.bio_full_text);
      totalIn += usage.input_tokens; totalOut += usage.output_tokens;
      update.run(
        JSON.stringify(cv),
        `wikipedia_de+anthropic:${MODEL}`,
        new Date().toISOString(),
        `anthropic:${MODEL}`, PROMPT_VERSION, raw,
        p.id
      );
      ok++;
    } catch (e: any) {
      fail++;
      console.log(`\n  ✗ ${p.id} ${name}: ${e.message?.slice(0, 150)}`);
    }
    const elapsed = (Date.now() - start) / 1000;
    const rate = (i + 1) / elapsed;
    const eta = Math.round((rows.length - i - 1) / Math.max(rate, 0.001));
    const etaMin = Math.floor(eta / 60), etaSec = eta % 60;
    const cost = (totalIn / 1_000_000) * 1.0 + (totalOut / 1_000_000) * 5.0;
    process.stdout.write(`\r  [${i + 1}/${rows.length}] ok=${ok} fail=${fail}  ETA ${etaMin}m${etaSec}s  cost=$${cost.toFixed(3)}      `);
    if (i < rows.length - 1) await sleep(SLEEP_MS);
  }
  process.stdout.write("\n");

  const cost = (totalIn / 1_000_000) * 1.0 + (totalOut / 1_000_000) * 5.0;
  console.log(`\n=== Fertig ===`);
  console.log(`  CVs generiert: ${ok}`);
  console.log(`  Fehler:        ${fail}`);
  console.log(`  Tokens:        in ${totalIn.toLocaleString()}  /  out ${totalOut.toLocaleString()}`);
  console.log(`  Kosten:        $${cost.toFixed(4)}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
