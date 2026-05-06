/**
 * Specialist 2d — Doppelungs-Detector (programmatisch, kein LLM).
 *
 * Findet redundante Einträge innerhalb derselben Sektion eines cv_json.
 * Detektion-Logik:
 *   1. Jahres-Overlap (z.B. "2013" überlappt mit "seit 2013" und "2013-2017")
 *   2. Text-Similarity (Jaccard auf normalisierten Wörtern)
 *   3. Flag wenn (jahr_overlap UND text-sim > 0.5) ODER text-sim > 0.85
 *
 * Persistiert nach detect-duplicates.partial.jsonl.
 *
 * Run:
 *   npx tsx scripts/detect-duplicates.ts                       # alle Haiku-cv_jsons
 *   npx tsx scripts/detect-duplicates.ts --ids=79129,138330    # nur diese
 *   npx tsx scripts/detect-duplicates.ts --print               # statt persistieren
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const PARTIAL = path.join(process.cwd(), "detect-duplicates.partial.jsonl");
const DETECTOR_VERSION = "detect-duplicates-v1";

const IDS_ARG = process.argv.find((a) => a.startsWith("--ids="));
const ONLY_IDS = IDS_ARG ? IDS_ARG.replace("--ids=", "").split(",").map((s) => parseInt(s.trim(), 10)) : null;
const PRINT_MODE = process.argv.includes("--print");

// ── Year-Range-Parser ──

interface YearRange { start: number | null; end: number | null; }

function parseYear(jahr: string): YearRange {
  if (!jahr || !jahr.trim()) return { start: null, end: null };
  const s = jahr.trim().toLowerCase();

  // "seit YYYY" oder "ab YYYY"
  const seitMatch = s.match(/(?:seit|ab|seither)\s+(?:[a-zäöüß.]+\s+)?(\d{4})/);
  if (seitMatch) return { start: parseInt(seitMatch[1], 10), end: 9999 };

  // "bis YYYY"
  const bisMatch = s.match(/^bis\s+(?:[a-zäöüß.]+\s+)?(\d{4})/);
  if (bisMatch) return { start: 0, end: parseInt(bisMatch[1], 10) };

  // "YYYY-YYYY" oder "YYYY bis YYYY" oder "Monat YYYY bis Monat YYYY"
  const allYears = [...s.matchAll(/(\d{4})/g)].map((m) => parseInt(m[1], 10));
  if (allYears.length >= 2) return { start: Math.min(...allYears), end: Math.max(...allYears) };
  if (allYears.length === 1) return { start: allYears[0], end: allYears[0] };

  return { start: null, end: null };
}

function yearsOverlap(a: YearRange, b: YearRange): boolean {
  if (a.start === null || a.end === null || b.start === null || b.end === null) return false;
  return a.start <= b.end && b.start <= a.end;
}

// Strenger als Overlap: einer ist Teilmenge des anderen ODER beide sind identisch
// "2013" ⊂ "seit 2013" ✓     (echte Doppelung)
// "2013-2017" vs "2017-2021": keine Teilmenge ✗  (verschiedene WP)
// "2009" vs "2014": keine Teilmenge ✗  (verschiedene Kandidaturen)
function yearsContained(a: YearRange, b: YearRange): boolean {
  if (a.start === null || a.end === null || b.start === null || b.end === null) return false;
  const aInB = a.start >= b.start && a.end <= b.end;
  const bInA = b.start >= a.start && b.end <= a.end;
  return aInB || bInA;
}

// ── Text-Similarity (Jaccard auf normalisierten Wörtern) ──

const STOPWORDS = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "einem",
  "und", "oder", "in", "im", "an", "am", "von", "vom", "zu", "zum", "zur",
  "bei", "mit", "auf", "für", "als", "ist", "war", "wurde", "wird",
  "auch", "nach", "vor", "über", "unter", "durch",
]);

// Rang-Modifier — wenn EINES sie hat und DAS ANDERE nicht, sind es verschiedene Rang-Stufen
// (z.B. "Stellv. Vorsitzender" vs "Vorsitzender" = Aufstieg, KEINE Doppelung)
const RANK_MODIFIERS = new Set([
  "stellvertretend", "stellvertretende", "stellvertretender", "stellvertretendes", "stellvertretenden",
  "stellv", "stellvertreter", "stellvertreterin",
  "vize", "vizepräsident", "vizepräsidentin", "vizevorsitzender", "vizevorsitzende",
  "erste", "erster", "ersten", "zweite", "zweiter", "zweiten", "dritte", "dritter",
  "ehrenvorsitzender", "ehrenvorsitzende", "ehrenmitglied",
  "ordentliches", "ordentliche", "ordentlicher", "stellvertretendes",
  "kandidat", "kandidatin", "direktkandidat", "direktkandidatin", "spitzenkandidat", "spitzenkandidatin",
]);

function hasRankAsymmetry(textA: string, textB: string): boolean {
  const aWords = textA.toLowerCase().replace(/[^\wäöüß ]+/g, " ").split(/\s+/);
  const bWords = textB.toLowerCase().replace(/[^\wäöüß ]+/g, " ").split(/\s+/);
  const aRanks = new Set(aWords.filter((w) => RANK_MODIFIERS.has(w)));
  const bRanks = new Set(bWords.filter((w) => RANK_MODIFIERS.has(w)));
  // Asymmetrisch: einer hat ein Rank-Modifier das der andere nicht hat (oder umgekehrt)
  for (const r of aRanks) if (!bRanks.has(r)) return true;
  for (const r of bRanks) if (!aRanks.has(r)) return true;
  return false;
}

function normalize(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^\wäöüß ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0;
  if (a.size === 0 || b.size === 0) return 0.0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

// ── Doppelungs-Detection ──

interface Entry { jahr: string; text: string; }
interface Duplicate {
  section: string; index_a: number; index_b: number;
  jahr_a: string; jahr_b: string; text_a: string; text_b: string;
  similarity: number; year_overlap: boolean; reason: string;
}

function detectInSection(section: string, entries: Entry[]): Duplicate[] {
  const dups: Duplicate[] = [];
  const tokens = entries.map((e) => normalize(e.text));
  const yearRanges = entries.map((e) => parseYear(e.jahr));

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const sim = jaccard(tokens[i], tokens[j]);
      const contained = yearsContained(yearRanges[i], yearRanges[j]);
      const aHasNoYear = yearRanges[i].start === null;
      const bHasNoYear = yearRanges[j].start === null;
      const oneHasNoYear = aHasNoYear !== bHasNoYear; // genau einer hat kein Jahr

      let flag: string | null = null;
      // Echte Doppelung: hohe Text-Similarity UND (Jahr-Containment ODER beide ohne Jahr ODER einer ohne Jahr)
      if (sim > 0.7 && contained) flag = "year_contained_and_text_similar";
      else if (sim > 0.85 && (aHasNoYear && bHasNoYear)) flag = "near_identical_both_no_year";
      else if (sim > 0.8 && oneHasNoYear) flag = "high_text_sim_one_no_year";

      // Anti-Match: Rang-Asymmetrie filtert Aufstiegs-Patterns raus
      if (flag && hasRankAsymmetry(entries[i].text, entries[j].text)) flag = null;

      if (flag) {
        dups.push({
          section, index_a: i, index_b: j,
          jahr_a: entries[i].jahr, jahr_b: entries[j].jahr,
          text_a: entries[i].text, text_b: entries[j].text,
          similarity: Math.round(sim * 100) / 100,
          year_overlap: contained,
          reason: flag,
        });
      }
    }
  }
  return dups;
}

function detectAll(cv: any): Duplicate[] {
  const all: Duplicate[] = [];
  for (const sec of ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"]) {
    const entries = (cv[sec] ?? []) as Entry[];
    if (entries.length < 2) continue;
    all.push(...detectInSection(sec, entries));
  }
  return all;
}

function main() {
  const db = new Database(DB_PATH, { readonly: true });

  let sql: string;
  if (ONLY_IDS) {
    sql = `SELECT id, first_name || ' ' || last_name AS name, cv_json, cv_prompt_version
           FROM politicians WHERE id IN (${ONLY_IDS.join(",")}) AND cv_json IS NOT NULL`;
  } else {
    sql = `SELECT id, first_name || ' ' || last_name AS name, cv_json, cv_prompt_version
           FROM politicians WHERE cv_prompt_version = 'seed-cv-v5-haiku'`;
  }
  const rows = db.prepare(sql).all() as { id: number; name: string; cv_json: string; cv_prompt_version: string }[];

  if (!PRINT_MODE) {
    if (fs.existsSync(PARTIAL)) fs.unlinkSync(PARTIAL); // detector ist deterministisch — fresh start
  }

  let totalDups = 0;
  let mdbsWithDups = 0;
  const sectionStats: Record<string, number> = {};
  const reasonStats: Record<string, number> = {};

  console.log(`\n${rows.length} MdBs zu prüfen.\n`);

  for (const r of rows) {
    let cv: any;
    try { cv = JSON.parse(r.cv_json); } catch { continue; }
    const dups = detectAll(cv);
    if (dups.length === 0) continue;

    mdbsWithDups++;
    totalDups += dups.length;
    for (const d of dups) {
      sectionStats[d.section] = (sectionStats[d.section] ?? 0) + 1;
      reasonStats[d.reason] = (reasonStats[d.reason] ?? 0) + 1;
    }

    if (PRINT_MODE) {
      console.log("\n" + "═".repeat(80));
      console.log(`${r.id} ${r.name} — ${dups.length} potentielle Doppelung${dups.length > 1 ? "en" : ""}`);
      for (const d of dups) {
        console.log(`\n  [${d.section}] sim=${d.similarity} year_overlap=${d.year_overlap} reason=${d.reason}`);
        console.log(`    A [${d.index_a}] [${d.jahr_a}] ${d.text_a.slice(0, 90)}`);
        console.log(`    B [${d.index_b}] [${d.jahr_b}] ${d.text_b.slice(0, 90)}`);
      }
    } else {
      fs.appendFileSync(PARTIAL, JSON.stringify({
        politician_id: r.id, name: r.name, detector_version: DETECTOR_VERSION,
        duplicates: dups,
      }) + "\n");
    }
  }

  console.log("\n" + "═".repeat(80));
  console.log(`=== Doppelungs-Statistik ===`);
  console.log(`  MdBs gesamt:            ${rows.length}`);
  console.log(`  MdBs mit Doppelungen:   ${mdbsWithDups} (${(mdbsWithDups / rows.length * 100).toFixed(1)}%)`);
  console.log(`  Doppelungs-Pärchen:     ${totalDups}`);
  console.log(`  pro MdB Ø:              ${(totalDups / rows.length).toFixed(2)}`);
  console.log(`\n  Pro Sektion:`);
  for (const [sec, n] of Object.entries(sectionStats)) console.log(`    ${sec.padEnd(25)} ${n}`);
  console.log(`\n  Pro Grund:`);
  for (const [r, n] of Object.entries(reasonStats)) console.log(`    ${r.padEnd(35)} ${n}`);

  db.close();
}

main();
