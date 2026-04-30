/**
 * Korrigiert CV-Daten ohne LLM-Aufruf:
 *   1. jahr-Feld: wenn keine 4-stellige Jahreszahl drin → leeren
 *      (LLM hat z.B. "Düsseldorf" statt Jahr geschrieben)
 *   2. sonstiges → beruflicher_werdegang: bei Aufsichtsrats-/Vorstands-Mitgliedschaften
 *   3. sonstiges → politische_stationen: bei Partei-/Mandats-Begriffen
 *   4. Duplikate innerhalb einer Sektion entfernen
 *
 * Run: npx tsx scripts/fix-cv-quality.ts [--dry]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DRY = process.argv.includes("--dry");

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

// ── Klassifikations-Keywords ──

const KEYWORDS_BERUFLICH = [
  /\bAufsichtsrat/i, /\bAufsichtsrät/i,
  /\bVerwaltungsrat/i, /\bVerwaltungsrät/i,
  /\bVorstand(?!s\w*partei|s\w*frakt)/i,  // nicht "Parteivorstand"
  /\bBeirat/i, /\bBeirät/i,
  /\bGeschäftsführ/i,
  /\bSenior\s+Counsel/i,
  /\bPartner.*(?:kanzlei|firma|gesellschaft)/i,
  /\bDirektor/i,
];

const KEYWORDS_POLITISCH = [
  /\bPräsidiums?\s+(?:der|im)/i,
  /\bParteivorsitz/i,
  /\bParteivorsitzend/i,
  /\bGeneralsekretär.*(CDU|CSU|SPD|Grünen|FDP|AfD|Linke|BSW|Volt|Partei)/i,
  /\bGeneralsekretär\s+der\s+\w+/i,
  /\bKandidat\s+für\s+(?:den|die)\s+(?:Partei|Bundestag|Landtag|Kanzler|Bundeskanzler)/i,
  /\bFraktionsvorsitz/i,
  /\bFraktion(?:sführung|sführer|svorsitzender)/i,
  /\bVorsitzender?\s+der\s+(?:CDU|CSU|SPD|Grünen|FDP|AfD|Linke|BSW|Bundestags?fraktion|CDU\/CSU)/i,
  /\bAbgeordnet/i,
  /\b(?:Bundes)?(?:kanzler|außenminister|innenminister|finanzminister|verteidigungsminister)/i,
  /\b(?:Bundes)?Minister(?:in)?\s+(?:für|der|des)/i,
  /\bStaatssekretär/i,
  /\bStaatsminister/i,
  /\bBürgermeist/i,
  /\bLandrat/i,
  /\bLandesvorsitz/i,
  /\bMitglied\s+des\s+(?:Bundestages|Landtages|Europäischen\s+Parlaments|Bundesrats)/i,
  /\bZukunftsteam\s+von\s+\w+\s+zur\s+Kanzlerkandidatur/i,
  /\bOppositionsführer/i,
];

function hasYear(jahr: string): boolean {
  return /\d{4}/.test(jahr);
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, " ").replace(/\s+/g, " ").trim();
}

function isSubstring(a: string, b: string, minLen = 30): boolean {
  if (a.length < minLen || b.length < minLen) return false;
  return a.includes(b) || b.includes(a);
}

function findDuplicate(entries: Entry[], target: Entry): boolean {
  const tn = normalizeText(target.text);
  for (const e of entries) {
    const en = normalizeText(e.text);
    // Exakt gleicher Text, egal welches jahr → ein Eintrag mit Range gewinnt (weil länger)
    if (en === tn) return true;
    // Substring-Match: "Mitglied Aufsichtsrats X" enthält bzw. ist enthalten in "Mitglied Aufsichtsrats X seit/bis YYYY"
    if (isSubstring(en, tn)) return true;
  }
  return false;
}

interface Stats {
  yearsFixed: number;
  movedBeruflich: number;
  movedPolitisch: number;
  duplicatesRemoved: number;
}

function fixCv(cv: CV, stats: Stats): CV {
  const out: CV = {
    ausbildung: [],
    beruflicher_werdegang: [],
    politische_stationen: [],
    sonstiges: [],
  };

  // Erst jahr-Feld validieren über alle Sektionen
  const sections: (keyof CV)[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];
  for (const sec of sections) {
    for (const e of cv[sec] ?? []) {
      const fixed: Entry = { jahr: e.jahr ?? "", text: e.text ?? "" };
      if (fixed.jahr && !hasYear(fixed.jahr)) {
        // Wert kann ein Ortsname o.Ä. sein — wenn sinnvoll, in den Text vorne anhängen
        if (fixed.text && !fixed.text.toLowerCase().includes(fixed.jahr.toLowerCase())) {
          fixed.text = `${fixed.jahr.trim()}: ${fixed.text}`;
        }
        fixed.jahr = "";
        stats.yearsFixed++;
      }
      // Reklassifizierung — politisch hat Vorrang vor beruflich
      // (Beispiel: "Mitglied des Aufsichtsrats" + "Bundeskanzler" → politisch).
      // Ausbildung wird nicht angetastet (LLM klassifiziert dort meist korrekt).
      let target = sec;
      const isPolitisch = KEYWORDS_POLITISCH.some((re) => re.test(fixed.text));
      const isBeruflich = !isPolitisch && KEYWORDS_BERUFLICH.some((re) => re.test(fixed.text));
      if (isPolitisch && sec !== "politische_stationen" && sec !== "ausbildung") {
        target = "politische_stationen";
        stats.movedPolitisch++;
      } else if (isBeruflich && sec !== "beruflicher_werdegang" && sec !== "ausbildung") {
        target = "beruflicher_werdegang";
        stats.movedBeruflich++;
      }
      if (findDuplicate(out[target], fixed)) {
        stats.duplicatesRemoved++;
        continue;
      }
      out[target].push(fixed);
    }
  }

  // Chronologisch sortieren je Sektion
  for (const sec of sections) {
    out[sec].sort((a, b) => {
      const ya = parseInt((a.jahr.match(/\d{4}/) ?? [""])[0] || "9999", 10);
      const yb = parseInt((b.jahr.match(/\d{4}/) ?? [""])[0] || "9999", 10);
      return ya - yb;
    });
  }
  return out;
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const rows = db.prepare(
    `SELECT id, first_name, last_name, cv_json, cv_homepage_json FROM politicians
     WHERE cv_json IS NOT NULL OR cv_homepage_json IS NOT NULL`
  ).all() as { id: number; first_name: string; last_name: string; cv_json: string | null; cv_homepage_json: string | null }[];

  console.log(`${rows.length} Politiker mit CV-Daten`);

  const update = db.prepare(`UPDATE politicians SET cv_json = ?, cv_homepage_json = ? WHERE id = ?`);
  const stats: Stats = { yearsFixed: 0, movedBeruflich: 0, movedPolitisch: 0, duplicatesRemoved: 0 };

  let processedRows = 0;
  for (const r of rows) {
    let cv1: string | null = r.cv_json;
    let cv2: string | null = r.cv_homepage_json;
    let changed = false;

    if (cv1) {
      try {
        const before = JSON.stringify(JSON.parse(cv1));
        const fixed = fixCv(JSON.parse(cv1) as CV, stats);
        const after = JSON.stringify(fixed);
        if (before !== after) { cv1 = after; changed = true; }
      } catch {}
    }
    if (cv2) {
      try {
        const before = JSON.stringify(JSON.parse(cv2));
        const fixed = fixCv(JSON.parse(cv2) as CV, stats);
        const after = JSON.stringify(fixed);
        if (before !== after) { cv2 = after; changed = true; }
      } catch {}
    }

    if (changed && !DRY) {
      update.run(cv1, cv2, r.id);
      processedRows++;
    } else if (changed) {
      processedRows++;
    }
  }

  console.log(`\n=== Fertig${DRY ? " (DRY-RUN)" : ""} ===`);
  console.log(`  Zeilen verändert:        ${processedRows}`);
  console.log(`  jahr-Felder bereinigt:   ${stats.yearsFixed}`);
  console.log(`  → beruflicher_werdegang: ${stats.movedBeruflich}`);
  console.log(`  → politische_stationen:  ${stats.movedPolitisch}`);
  console.log(`  Duplikate entfernt:      ${stats.duplicatesRemoved}`);
  db.close();
}

main();
