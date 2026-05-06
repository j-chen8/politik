/**
 * Test new date-precision prompt against 3 known problem MdBs.
 * Mihalic (79129), Korell (175003), Fehre (183487) — siehe NEXT-SESSION.md.
 *
 * Liest bio_full_text + cv_json aus DB, ruft LLM mit NEUEM Prompt auf,
 * druckt OLD vs NEW politische_stationen + beruflicher_werdegang nebeneinander.
 *
 * SCHREIBT NICHT in die DB.
 *
 * Run: npx tsx scripts/test-cv-date-precision.ts
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
const MODEL_FAST = "llama-3.1-8b-instant";
const MODEL_LONG = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const TEST_IDS = [78944, 118559, 79103, 138330, 175138]; // 5 random — Verlinden, Merz, Nouripour, Hoffmann, Böttger

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);

if (GROQ_KEYS.length === 0) {
  console.error("Keine GROQ_API_KEY* in .env");
  process.exit(1);
}

let keyIdx = 0;
const nextKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// TEST: Llama 4 Scout für alle (statt 8b für kurze Texte)
const pickModel = (_chars: number) => MODEL_LONG;

// ── NEW PROMPT mit expliziten Date-Regeln + Few-Shot ──

const NEW_SYSTEM_PROMPT = `Du bist ein Assistent, der aus Wikipedia-Artikeln über Politiker einen strukturierten Lebenslauf in deutschem JSON extrahiert.

Antworte AUSSCHLIESSLICH mit gültigem JSON. SCHEMA (alle vier Felder Pflicht, leeres Array [] wenn nichts dazu im Text steht):
{
  "ausbildung":            [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "beruflicher_werdegang": [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "politische_stationen":  [ { "jahr": "<string>", "text": "<string>" }, ... ],
  "sonstiges":             [ { "jahr": "<string>", "text": "<string>" }, ... ]
}

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
  - Privatleben-Hinweise nur wenn explizit erwähnt (Kinder, Heirat, Religion) — sehr sparsam
  - NICHT: aktuelle politische Mandate oder Ausschuss-Posten

ABSOLUT VERBOTEN:
- Beispiele/Demo-Inhalte aus diesem Schema als Fakten übernehmen. Die Platzhalter <string> sind KEINE Werte.
- Erfinden von Universitäten, Abschlüssen, Verlagen, Buchtiteln, Jahreszahlen oder anderen Fakten, die nicht WÖRTLICH im gelieferten Text stehen.
- Wenn der Text z.B. keine Bücher nennt: "sonstiges" bleibt leer. Niemals "Buchautor: 'Titel des Buches' (Suhrkamp)" oder ähnliches erfinden.

═══════════════════════════════════════════════════════════════════
WICHTIG — REGELN FÜR ZEITANGABEN (häufige Fehlerquelle!):
═══════════════════════════════════════════════════════════════════

⚠️ REGEL 0 — DIE WICHTIGSTE: KEIN JAHR IM TEXT → KEIN JAHR IM OUTPUT!
Wenn der Quelltext für ein Ereignis KEIN Jahr/Datum nennt → schreibe "jahr": "" (LEERER String).
NIEMALS ein Jahr "plausibel" ableiten, schätzen, oder aus dem Kontext erfinden.
NIEMALS aus "vor seinem Einzug" o.ä. ein konkretes Jahr konstruieren.

  ✓ "Hoffmann arbeitete 9,5 Jahre bei Union Investment." → jahr: ""  (KEIN Jahr genannt!)
  ✗ FALSCH: "2015-2024" oder "2013-2022" — solche Bereiche sind ERFUNDEN

  ✓ "Nach der Schule absolvierte sie eine Ausbildung zur Verwaltungsfachangestellten." → jahr: ""
  ✗ FALSCH: "1998-2002" oder "2002-2003" — KEIN Jahr im Text!

  ✓ "Friedrich Merz ist verheiratet mit Charlotte Merz." → jahr: ""  (kein Heiratsdatum)
  ✗ FALSCH: "[2025] Ehe mit Charlotte Merz" — komplett halluziniert!

REGEL 1 — EINZELJAHR:
Steht nur EIN Jahr im Text → schreibe "YYYY".
  ✓ "2016 trat sie der AfD bei" → jahr: "2016"

⚠️ REGEL 2 — "seit YYYY" / "ab YYYY" WÖRTLICH ERHALTEN:
Steht "seit YYYY" / "ab YYYY" / "seither" / "bis heute" im Text → schreibe EXAKT "seit YYYY" bzw. "ab YYYY".
NIEMALS zu nur "YYYY" verkürzen (das verliert die Information dass es bis heute andauert).
NIEMALS daraus einen Zeitraum "YYYY-YYYY" machen.

  ✓ "Sie ist seit 2013 Mitglied des Bundestages." → jahr: "seit 2013"
  ✗ FALSCH: "2013" (verliert das "seit"!) oder "2013-2017" oder "2013-2025"

  ✓ "Mitglied der CDU seit 1972." → jahr: "seit 1972"
  ✗ FALSCH: nur "1972"

REGEL 3 — ZEITRAUM nur wenn BEIDE Daten WÖRTLICH im Text stehen:
  ✓ "Von 2005 bis 2009 war er Bürgermeister." → jahr: "2005-2009"
  ✗ "Sie ist seit 2007 bei der Polizei Köln." → KEIN "1993-2007", KEIN "2007-aktuell"

REGEL 4 — REIHENFOLGE NICHT UMDREHEN:
"Ab YYYY" / "seit YYYY" markiert den ANFANG, nicht das Ende.
  ✓ "Ab 2007 war sie beim Polizeipräsidium Köln tätig." → jahr: "ab 2007"
  ✗ FALSCH: "1993-2007" — das wäre die UMGEKEHRTE Bedeutung!

REGEL 5 — DATEN-ZUORDNUNG bei mehreren Ereignissen:
Wenn mehrere Daten im selben Satz/Abschnitt stehen, ordne JEDES Datum dem RICHTIGEN Ereignis zu.
Übertrage NIEMALS ein Datum von einem Ereignis auf ein anderes.

  Quelltext: "Sie trat 2016 der AfD bei. Seit 2019 ist sie Stadträtin in Klötze."
  ✓ {"jahr": "2016", "text": "Eintritt in die AfD"}
  ✓ {"jahr": "seit 2019", "text": "Stadträtin in Klötze"}
  ✗ FALSCH: {"jahr": "2016", "text": "Stadträtin in Klötze"} — Datum vom AfD-Eintritt fälschlich übertragen!

REGEL 6 — KEINE EXTRAPOLATION:
Wenn nur ein Anfangsjahr ohne Endjahr genannt ist → "seit YYYY".
NIEMALS ein Endjahr aus dem Kontext erfinden, auch nicht das aktuelle Jahr.
  ✓ "Mitglied der Grünen seit 2006." → jahr: "seit 2006"
  ✗ FALSCH: "2006-2013" oder "2006-2025"

REGEL 7 — MANDATS-KONTINUITÄT:
Wenn der Text durchgehende Mitgliedschaft nahelegt ("seit 2013 Mitglied"), KEINE Pausen oder Lücken zwischen Wahlperioden konstruieren. Eine Aussage wie "seit 2013 Mitglied" ist EIN Eintrag, nicht mehrere.

REGEL 8 — KEINE QUELLEN-VERWECHSLUNG:
Wenn der Text "Beisitzer im Landesvorstand der Partei X" sagt, schreibe das so. NIEMALS daraus "tätig im Landtag" oder ähnlich machen — das wäre eine völlig andere Position.

REGEL 9 — KEINE DOPPELUNGEN ZWISCHEN SEKTIONEN:
Ein Ereignis darf NUR EINMAL im Output erscheinen (in der passenden Sektion).
  ✗ FALSCH: "[2018] Kandidat für CDU-Vorsitz" sowohl in politische_stationen als auch in sonstiges

═══════════════════════════════════════════════════════════════════

Weitere Regeln:
- Nur Fakten aus dem gelieferten Text. Keine Vermutungen, keine Erfindungen.
- Chronologisch sortiert (älteste zuerst).
- jahr-Format: "YYYY", "YYYY-YYYY", "seit YYYY", "ab YYYY", "bis YYYY" — wie im Text.
- Bei Ausbildung: WENN im Text genannt, IMMER Universität/Schule UND erreichten Abschluss/Titel mitnennen.
- Bei Berufen: Position + Arbeitgeber/Firma falls genannt.
- text präzise und vollständig (max ~200 Zeichen, ein Satz, keine Aufzählungs-Striche im Text).
- Wenn ein Bereich keine Einträge hat: leeres Array [].
- Antworte NUR mit dem JSON-Objekt, kein Markdown, keine Kommentare.`;

interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

async function generateCv(name: string, text: string): Promise<{ cv: CV; model: string }> {
  const cut = text.slice(0, 50000);
  const model = pickModel(cut.length);
  for (let attempt = 0; attempt < GROQ_KEYS.length * 2; attempt++) {
    const key = nextKey();
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: NEW_SYSTEM_PROMPT },
          { role: "user", content: `Politiker: ${name}\n\nWikipedia-Artikel:\n${cut}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    if (res.status === 429) { await sleep(2000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as any;
    const content = data?.choices?.[0]?.message?.content;
    return { cv: JSON.parse(content) as CV, model };
  }
  throw new Error("alle keys rate-limited");
}

const SECTIONS_TO_PRINT: (keyof CV)[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];

function printSection(label: string, entries: { jahr: string; text: string }[] | undefined) {
  console.log(`  ${label}:`);
  if (!entries || entries.length === 0) { console.log("    (leer / fehlt)"); return; }
  for (const e of entries) {
    const jahr = String(e.jahr ?? "?");
    const text = String(e.text ?? "");
    const cut = text.length > 90 ? text.slice(0, 87) + "…" : text;
    console.log(`    [${jahr.padEnd(14)}] ${cut}`);
  }
}

async function main() {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db.prepare(
    `SELECT id, first_name || ' ' || last_name AS name, cv_json, bio_full_text, cv_model
     FROM politicians WHERE id IN (${TEST_IDS.join(",")})`
  ).all() as { id: number; name: string; cv_json: string; bio_full_text: string; cv_model: string }[];

  for (const row of rows) {
    console.log("\n" + "═".repeat(80));
    console.log(`MdB ${row.id} — ${row.name}    (alt: ${row.cv_model})`);
    console.log("═".repeat(80));

    const oldCv: CV = JSON.parse(row.cv_json);
    let newCv: CV; let model: string;
    try {
      const r = await generateCv(row.name, row.bio_full_text);
      newCv = r.cv; model = r.model;
    } catch (e: any) {
      console.log(`  ✗ FEHLER: ${e.message}`);
      continue;
    }

    console.log(`\n  ── Modell für Re-Run: ${model} ──`);

    for (const sec of SECTIONS_TO_PRINT) {
      console.log(`\n┌─ ${sec.toUpperCase()} ─────────────────────────────────────────`);
      console.log("│ ALT:");
      printSection("│", oldCv[sec]);
      console.log("│");
      console.log("│ NEU (mit Date-Precision-Prompt):");
      printSection("│", newCv[sec]);
    }
    await sleep(500);
  }

  console.log("\n" + "═".repeat(80));
  console.log("Erwartete Korrekturen prüfen:");
  console.log("  Mihalic 79129:");
  console.log("    - politische_stationen 'Grüne': war '2006-2013', sollte 'seit 2006'");
  console.log("    - beruflicher_werdegang 'Polizei Köln': war '1993-2007', sollte 'ab 2007'/'seit 2007'");
  console.log("    - keine konstruierte Pause zwischen MdB-Perioden");
  console.log("  Korell 175003:");
  console.log("    - 'Stadtrat Klötze' Jahr: war '2016' (AfD-Eintritt), sollte 'seit 2019'");
  console.log("  Fehre 183487:");
  console.log("    - 'beruflich im Landtag' sollte WEG sein (war Beisitzer Landesvorstand)");
  console.log("═".repeat(80));

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
