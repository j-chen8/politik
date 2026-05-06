/**
 * Test Stage-1-Generator mit Anthropic Claude Haiku 4.5 statt Llama/Scout.
 *
 * Selbe v4-Date-Precision-Regeln wie test-cv-date-precision.ts, aber
 * Anthropic SDK + JSON-Schema-Output für garantiert valides JSON.
 *
 * Test auf 5 problematische MdBs:
 *   - Mihalic 79129     (Date-Range-Halluzinationen)
 *   - Korell  175003    (Date-Conflation)
 *   - Hoffmann 138330   (Doppelungen + erfundene Daten)
 *   - Nouripour 79103   (Klassifikation + "Ende der Amtszeit"-Halluzination)
 *   - Verlinden 78944   ("seit"-Loss + sehr präzise Daten)
 *
 * Druckt OLD (alt aus DB) vs HAIKU (neu) nebeneinander. KEIN DB-Write.
 *
 * Run: npx tsx scripts/test-cv-haiku.ts
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
// Tier-1: 50 RPM aber ITPM 50K. Bei ~5K Input/Call ~10 RPM.
// 6500ms Sleep = ~9 RPM, sicher unter Limit.
const SLEEP_MS = 6500;
const DB_PATH = path.join(process.cwd(), "politik.db");

const TEST_IDS = [79129, 175003, 138330, 79103, 78944];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  - Privatleben-Hinweise nur wenn explizit erwähnt — sehr sparsam
  - NICHT: aktuelle politische Mandate oder Ausschuss-Posten

ABSOLUT VERBOTEN:
- Erfinden von Universitäten, Abschlüssen, Verlagen, Buchtiteln, Jahreszahlen oder anderen Fakten, die nicht WÖRTLICH im gelieferten Text stehen.
- Wenn der Text z.B. keine Bücher nennt: "sonstiges" bleibt leer.

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

═══════════════════════════════════════════════════════════════════

Weitere Regeln:
- Nur Fakten aus dem gelieferten Text. Keine Vermutungen, keine Erfindungen.
- Chronologisch sortiert (älteste zuerst).
- jahr-Format: "YYYY", "YYYY-YYYY", "seit YYYY", "ab YYYY", "bis YYYY" — wie im Text. Leerer String "" wenn kein Datum genannt.
- Bei Ausbildung: WENN im Text genannt, IMMER Universität/Schule UND Abschluss/Titel mitnennen.
- Bei Berufen: Position + Arbeitgeber/Firma falls genannt.
- text präzise und vollständig (max ~200 Zeichen, ein Satz).
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
    ausbildung: {
      type: "array",
      items: {
        type: "object",
        properties: { jahr: { type: "string" }, text: { type: "string" } },
        required: ["jahr", "text"],
        additionalProperties: false,
      },
    },
    beruflicher_werdegang: {
      type: "array",
      items: {
        type: "object",
        properties: { jahr: { type: "string" }, text: { type: "string" } },
        required: ["jahr", "text"],
        additionalProperties: false,
      },
    },
    politische_stationen: {
      type: "array",
      items: {
        type: "object",
        properties: { jahr: { type: "string" }, text: { type: "string" } },
        required: ["jahr", "text"],
        additionalProperties: false,
      },
    },
    sonstiges: {
      type: "array",
      items: {
        type: "object",
        properties: { jahr: { type: "string" }, text: { type: "string" } },
        required: ["jahr", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"],
  additionalProperties: false,
} as const;

async function generateCv(name: string, wikipediaText: string): Promise<{ cv: CV; usage: any }> {
  const text = wikipediaText.slice(0, 50000);
  const userPrompt = `Politiker: ${name}\n\nWikipedia-Artikel:\n${text}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    output_config: {
      format: { type: "json_schema", schema: CV_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Kein text-Block in Response");

  let raw = textBlock.text.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) raw = fenced[1];

  return { cv: JSON.parse(raw) as CV, usage: response.usage };
}

const SECTIONS: (keyof CV)[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];

function printSection(label: string, entries: { jahr: string; text: string }[] | undefined) {
  console.log(`  ${label}:`);
  if (!entries || entries.length === 0) { console.log("    (leer)"); return; }
  for (const e of entries) {
    const jahr = String(e.jahr ?? "?") || "(kein Datum)";
    const text = String(e.text ?? "");
    const cut = text.length > 90 ? text.slice(0, 87) + "…" : text;
    console.log(`    [${jahr.padEnd(14)}] ${cut}`);
  }
}

async function main() {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db.prepare(
    `SELECT id, first_name || ' ' || last_name AS name, cv_json, bio_full_text, cv_model
     FROM politicians WHERE id IN (${TEST_IDS.join(",")})
     ORDER BY id`
  ).all() as { id: number; name: string; cv_json: string; bio_full_text: string; cv_model: string }[];

  let totalIn = 0, totalOut = 0;

  for (const row of rows) {
    console.log("\n" + "═".repeat(80));
    console.log(`MdB ${row.id} — ${row.name}    (alt: ${row.cv_model})`);
    console.log("═".repeat(80));

    const oldCv: CV = JSON.parse(row.cv_json);
    let newCv: CV; let usage: any;
    try {
      const r = await generateCv(row.name, row.bio_full_text);
      newCv = r.cv; usage = r.usage;
      totalIn += usage.input_tokens; totalOut += usage.output_tokens;
    } catch (e: any) {
      console.log(`  ✗ FEHLER: ${e.message}`);
      continue;
    }

    console.log(`\n  ── Modell: ${MODEL}  (in: ${usage.input_tokens} tok, out: ${usage.output_tokens} tok) ──`);

    for (const sec of SECTIONS) {
      console.log(`\n┌─ ${sec.toUpperCase()} ─────────────────────────────────────────`);
      console.log("│ ALT:");
      printSection("│", oldCv[sec]);
      console.log("│");
      console.log("│ NEU (Haiku 4.5 + v4-Prompt):");
      printSection("│", newCv[sec]);
    }
    await sleep(SLEEP_MS);
  }

  // Anthropic Pricing (Haiku 4.5): $1/MTok input, $5/MTok output
  const cost = (totalIn / 1_000_000) * 1.0 + (totalOut / 1_000_000) * 5.0;
  console.log("\n" + "═".repeat(80));
  console.log(`Total Tokens:  in ${totalIn.toLocaleString()}  /  out ${totalOut.toLocaleString()}`);
  console.log(`Geschätzte Kosten: $${cost.toFixed(4)}  →  Hochrechnung 640 MdBs: $${(cost * 640 / TEST_IDS.length).toFixed(2)}`);
  console.log("═".repeat(80));

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
