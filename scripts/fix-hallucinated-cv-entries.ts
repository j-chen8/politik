/**
 * Stage 5.5 Follow-Up — Halluzinations-Reparatur.
 *
 * Stage 5.5 hat 38 CV-Einträge als Llama-Halluzinationen klassifiziert
 * (classification ∈ wikipedia_extraktion_falsch | homepage_extraktion_falsch | beide_falsch).
 *
 * Dieses Skript extrahiert für jeden flagged Eintrag eine Korrektur aus dem
 * jeweiligen Roh-Quelltext mit Llama 3.3 70B (besser als das ursprüngliche 8B).
 *
 * - Wenn das Modell einen korrekten Text liefert → ersetze den Eintrag
 * - Wenn das Modell sagt "nicht im Quelltext" → lösche den Eintrag
 *
 * Schreibt aktualisierte cv_json / cv_homepage_json zurück in die DB und
 * markiert die Verification mit `repaired_at` damit die UI sie nicht mehr
 * als Konflikt zeigt (Filter sieht eh nur "echte_diskrepanz", aber wir säubern
 * den Pfad).
 *
 * Run: npx tsx scripts/fix-hallucinated-cv-entries.ts [--dry-run]
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
const REPORT_OUT = path.join(process.cwd(), "fix-hallucinated-cv-report.md");
const DRY_RUN = process.argv.includes("--dry-run");

const GROQ_KEYS = Object.entries(process.env)
  .filter(([k, v]) => k.startsWith("GROQ_API_KEY") && v)
  .map(([, v]) => v as string);
let keyIdx = 0;
const nextKey = () => GROQ_KEYS[keyIdx++ % GROQ_KEYS.length];

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const SLEEP_MS = 2500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Section = "ausbildung" | "beruflicher_werdegang" | "politische_stationen" | "sonstiges";
const SECTIONS: Section[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];

interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

interface Verification {
  classification:
    | "echte_diskrepanz"
    | "wikipedia_extraktion_falsch"
    | "homepage_extraktion_falsch"
    | "beide_falsch"
    | "unklar";
  reason: string;
  quote_wikipedia: string | null;
  quote_homepage: string | null;
  repaired_at?: string;
}

interface Conflict {
  section: string;
  jahr: string;
  wikipedia: string;
  homepage: string;
  reason: string;
  verification?: Verification;
}

interface PoliticianRow {
  id: number;
  first_name: string;
  last_name: string;
  cv_json: string | null;
  cv_homepage_json: string | null;
  bio_full_text: string | null;
  cv_homepage_text: string | null;
  source_conflicts: string | null;
}

function fullName(p: PoliticianRow): string {
  return `${p.first_name} ${p.last_name}`;
}

async function reExtract(
  name: string,
  section: string,
  jahr: string,
  oldText: string,
  verifReason: string,
  sourceText: string,
  sourceLabel: "Wikipedia" | "Homepage",
): Promise<string | null> {
  const prompt = `Du bist Daten-Korrektur-Assistent. Eine vorherige LLM-Extraktion war für eine bestimmte Stelle im Lebenslauf falsch — sie passt nicht zum Quelltext.

POLITIKER:    ${name}
SEKTION:      ${section}
ZEITRAUM:     ${jahr}
QUELLE:       ${sourceLabel}

ALTE FALSCHE EXTRAKTION:
"${oldText}"

HINWEIS aus Verifikation (warum als falsch markiert):
${verifReason}

QUELLTEXT (gekürzt auf relevante Stellen):
${sourceText.slice(0, 8000)}

DEINE AUFGABE: Lies den Quelltext und extrahiere den KORREKTEN Eintrag für die Sektion "${section}" und den Zeitraum "${jahr}".

REGELN:
- Sei präzise und halte dich strikt an den Quelltext
- Erfinde nichts dazu — keine Parteinamen, Funktionen oder Daten die im Quelltext nicht stehen
- Falls der Quelltext zu diesem Zeitraum/Sachverhalt KEINE belastbare Information enthält, antworte mit "text": null

Antworte AUSSCHLIESSLICH mit JSON:
{
  "text": "<korrekter, kompakter Lebenslauf-Eintrag (max ~150 Zeichen) — oder null wenn nicht im Quelltext belegt>"
}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${nextKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 250,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429) {
        await sleep(8000);
        continue;
      }
      if (!res.ok) {
        if (attempt === 4) throw new Error(`HTTP ${res.status}`);
        await sleep(2000);
        continue;
      }
      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        if (attempt === 4) throw new Error("empty content");
        await sleep(3000);
        continue;
      }
      const stripped = content.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, "").trim();
      const parsed = JSON.parse(stripped);
      const text = parsed.text;
      if (text === null || text === undefined) return null;
      if (typeof text !== "string") return null;
      const trimmed = text.trim();
      return trimmed.length > 0 ? trimmed : null;
    } catch (e: any) {
      if (attempt === 4) throw e;
      await sleep(2000);
    }
  }
  throw new Error("alle Versuche fehlgeschlagen");
}

interface FixRecord {
  politicianId: number;
  politicianName: string;
  section: string;
  jahr: string;
  side: "wikipedia" | "homepage";
  oldText: string;
  newText: string | null; // null = gelöscht
  action: "replaced" | "deleted" | "skipped_no_match";
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const rows = db
    .prepare(
      `SELECT id, first_name, last_name, cv_json, cv_homepage_json, bio_full_text, cv_homepage_text, source_conflicts
       FROM politicians
       WHERE source_conflicts IS NOT NULL AND source_conflicts != '[]' AND source_conflicts != ''`,
    )
    .all() as PoliticianRow[];

  console.log(`${rows.length} MdBs mit source_conflicts geladen${DRY_RUN ? " (DRY-RUN)" : ""}`);

  const updateCv = db.prepare(`UPDATE politicians SET cv_json = ? WHERE id = ?`);
  const updateCvHome = db.prepare(`UPDATE politicians SET cv_homepage_json = ? WHERE id = ?`);
  const updateConflicts = db.prepare(`UPDATE politicians SET source_conflicts = ? WHERE id = ?`);

  const fixes: FixRecord[] = [];
  let politiciansTouched = 0;
  let llmCalls = 0;

  for (const r of rows) {
    let conflicts: Conflict[];
    try {
      conflicts = JSON.parse(r.source_conflicts!);
    } catch {
      continue;
    }
    if (!Array.isArray(conflicts)) continue;

    // Welche Konflikte brauchen Reparatur?
    const toFix = conflicts.filter((c) => {
      if (!c.verification) return false;
      if (c.verification.repaired_at) return false;
      const cls = c.verification.classification;
      return (
        cls === "wikipedia_extraktion_falsch" ||
        cls === "homepage_extraktion_falsch" ||
        cls === "beide_falsch"
      );
    });
    if (toFix.length === 0) continue;

    let cvWiki: CV | null = null;
    let cvHome: CV | null = null;
    try { if (r.cv_json) cvWiki = JSON.parse(r.cv_json); } catch {}
    try { if (r.cv_homepage_json) cvHome = JSON.parse(r.cv_homepage_json); } catch {}

    let cvWikiTouched = false;
    let cvHomeTouched = false;

    for (const c of toFix) {
      const cls = c.verification!.classification;
      const sides: ("wikipedia" | "homepage")[] = [];
      if (cls === "wikipedia_extraktion_falsch" || cls === "beide_falsch") sides.push("wikipedia");
      if (cls === "homepage_extraktion_falsch" || cls === "beide_falsch") sides.push("homepage");

      for (const side of sides) {
        const cv = side === "wikipedia" ? cvWiki : cvHome;
        const sourceText = side === "wikipedia" ? r.bio_full_text : r.cv_homepage_text;
        const oldText = side === "wikipedia" ? c.wikipedia : c.homepage;

        if (!cv || !sourceText) {
          fixes.push({
            politicianId: r.id,
            politicianName: fullName(r),
            section: c.section,
            jahr: c.jahr,
            side,
            oldText,
            newText: null,
            action: "skipped_no_match",
          });
          continue;
        }

        const arr = (cv as any)[c.section] as { jahr: string; text: string }[] | undefined;
        if (!arr || !Array.isArray(arr)) continue;

        const idx = arr.findIndex((e) => e.jahr === c.jahr && e.text === oldText);
        if (idx === -1) {
          fixes.push({
            politicianId: r.id,
            politicianName: fullName(r),
            section: c.section,
            jahr: c.jahr,
            side,
            oldText,
            newText: null,
            action: "skipped_no_match",
          });
          continue;
        }

        // LLM call
        let newText: string | null = null;
        if (!DRY_RUN) {
          try {
            llmCalls++;
            newText = await reExtract(
              fullName(r),
              c.section,
              c.jahr,
              oldText,
              c.verification!.reason,
              sourceText,
              side === "wikipedia" ? "Wikipedia" : "Homepage",
            );
            await sleep(SLEEP_MS);
          } catch (e: any) {
            console.log(`  ✗ ${fullName(r)} [${c.section}/${c.jahr}/${side}]: ${e.message?.slice(0, 80)}`);
            continue;
          }
        }

        if (newText === null) {
          // löschen
          arr.splice(idx, 1);
          fixes.push({
            politicianId: r.id,
            politicianName: fullName(r),
            section: c.section,
            jahr: c.jahr,
            side,
            oldText,
            newText: null,
            action: "deleted",
          });
        } else {
          arr[idx] = { jahr: c.jahr, text: newText };
          fixes.push({
            politicianId: r.id,
            politicianName: fullName(r),
            section: c.section,
            jahr: c.jahr,
            side,
            oldText,
            newText,
            action: "replaced",
          });
        }
        if (side === "wikipedia") cvWikiTouched = true;
        else cvHomeTouched = true;

        // Mark verification as repaired
        c.verification!.repaired_at = new Date().toISOString();
      }
    }

    if (!DRY_RUN) {
      if (cvWikiTouched && cvWiki) updateCv.run(JSON.stringify(cvWiki), r.id);
      if (cvHomeTouched && cvHome) updateCvHome.run(JSON.stringify(cvHome), r.id);
      if (cvWikiTouched || cvHomeTouched) {
        updateConflicts.run(JSON.stringify(conflicts), r.id);
        politiciansTouched++;
      }
    }
  }

  // Bericht
  const replaced = fixes.filter((f) => f.action === "replaced").length;
  const deleted = fixes.filter((f) => f.action === "deleted").length;
  const skipped = fixes.filter((f) => f.action === "skipped_no_match").length;

  const lines: string[] = [];
  lines.push(`# Halluzinations-Reparatur (Stage 5.5 Follow-Up)\n`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · Modell: ${MODEL} (Groq)${DRY_RUN ? " · DRY-RUN" : ""}\n`);
  lines.push(`## Zusammenfassung`);
  lines.push(`| Aktion | Anzahl | Bedeutung |`);
  lines.push(`|---|---:|---|`);
  lines.push(`| ✅ Ersetzt | ${replaced} | Llama 3.3 70B fand korrekten Text im Quelltext |`);
  lines.push(`| 🗑️ Gelöscht | ${deleted} | Llama 3.3 70B sagte "nicht im Quelltext belegt" → Eintrag entfernt |`);
  lines.push(`| ⊘ Übersprungen (kein Match) | ${skipped} | Eintrag schon nicht mehr in cv_json (vermutlich vorheriger Patch) |`);
  lines.push(`| **MdBs betroffen** | ${politiciansTouched} | |`);
  lines.push(`| **LLM-Calls insgesamt** | ${llmCalls} | |\n`);

  lines.push(`## Detail-Liste\n`);
  let lastPid = 0;
  for (const f of fixes) {
    if (lastPid !== f.politicianId) {
      lines.push(`\n### ${f.politicianName} (id ${f.politicianId})`);
      lastPid = f.politicianId;
    }
    const icon = { replaced: "✅", deleted: "🗑️", skipped_no_match: "⊘" }[f.action];
    lines.push(`- ${icon} **${f.section}** · ${f.jahr} · *${f.side}*`);
    lines.push(`  - Alt: ${f.oldText.slice(0, 130)}`);
    if (f.newText) lines.push(`  - Neu: ${f.newText.slice(0, 130)}`);
  }
  fs.writeFileSync(REPORT_OUT, lines.join("\n"), "utf-8");

  console.log(`\n=== Fertig ${DRY_RUN ? "(DRY-RUN — nichts geschrieben)" : ""} ===`);
  console.log(`  ✅ Ersetzt:                ${replaced}`);
  console.log(`  🗑️ Gelöscht:               ${deleted}`);
  console.log(`  ⊘ Übersprungen:            ${skipped}`);
  console.log(`  MdBs betroffen:           ${politiciansTouched}`);
  console.log(`  LLM-Calls:                ${llmCalls}`);
  console.log(`\nBericht: ${REPORT_OUT}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
