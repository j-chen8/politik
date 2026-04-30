/**
 * Findet Inkonsistenzen zwischen CV-Daten (LLM-generiert) und DB-Stammdaten
 * (Wikidata-/abgeordnetenwatch-verifiziert).
 *
 * Idee: wir haben harte Wahrheiten in der DB:
 *   - politicians.party_id (von abgeordnetenwatch)
 *   - politicians.year_of_birth (von Wikidata)
 *   - mandates → Bundestag-Mandat ja/nein
 *
 * Wenn das LLM-CV diesen Wahrheiten widerspricht, ist das fast sicher
 * eine Halluzination. Output: Markdown-Report mit allen Auffälligkeiten.
 *
 * Run: npx tsx scripts/check-cv-consistency.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const REPORT_PATH = path.join(process.cwd(), "cv-consistency-report.md");

interface Pol {
  id: number;
  first_name: string;
  last_name: string;
  party_label: string | null;
  year_of_birth: number | null;
  has_bundestag_mandate: number;
  cv_json: string | null;
  cv_homepage_json: string | null;
}

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

interface Issue {
  politician: string;
  id: number;
  category: "WRONG_PARTY" | "MISSING_BUNDESTAG" | "IMPLAUSIBLE_YEAR" | "ANCIENT_DATE" | "FUTURE_DATE";
  detail: string;
}

const PARTY_KEYWORDS: Record<string, RegExp[]> = {
  CDU: [/\bCDU\b(?!.\s*\/\s*CSU)/i, /Christlich.Demokratisch/i],
  CSU: [/\bCSU\b/i, /Christlich.Soziale\s+Union/i],
  SPD: [/\bSPD\b/i, /Sozialdemokratisch/i],
  "BÜNDNIS 90/­DIE GRÜNEN": [/\bGrünen?\b/i, /Bündnis\s*90/i],
  FDP: [/\bFDP\b/i, /Freie\s+Demokratisch/i],
  AfD: [/\bAfD\b/i, /Alternative\s+für\s+Deutschland/i],
  "Die Linke": [/\bDie\s+Linke\b/i, /\bLinkspartei\b/i, /\bPDS\b/i],
  BSW: [/\bBSW\b/i, /Sahra\s+Wagenknecht/i],
};

const ALL_PARTY_PATTERNS = Object.entries(PARTY_KEYWORDS).flatMap(([party, regs]) =>
  regs.map((r) => ({ party, regex: r })),
);

function detectMentionedParty(text: string): string | null {
  for (const { party, regex } of ALL_PARTY_PATTERNS) {
    if (regex.test(text)) return party;
  }
  return null;
}

function checkPartyConsistency(p: Pol, cv: CV): Issue[] {
  if (!p.party_label) return [];
  // Frühere Parteimitgliedschaften sind LEGITIM (z.B. Gauland war 40 J. CDU vor AfD).
  // Issue wirft NUR, wenn die aktuelle Partei (DB) im gesamten CV überhaupt nicht erwähnt wird,
  // aber andere Parteien schon — dann ist es vermutlich eine Halluzination.
  const allText = (cv.politische_stationen ?? []).map((e) => e.text).join(" ")
    + " " + (cv.beruflicher_werdegang ?? []).map((e) => e.text).join(" ")
    + " " + (cv.sonstiges ?? []).map((e) => e.text).join(" ");

  const currentPartyRegexes = PARTY_KEYWORDS[p.party_label] ?? [];
  const currentPartyMentioned = currentPartyRegexes.some((r) => r.test(allText));
  if (currentPartyMentioned) return []; // alles ok

  // Aktuelle Partei NICHT erwähnt — wird mindestens eine andere Partei genannt?
  const otherParty = detectMentionedParty(allText);
  if (otherParty && otherParty !== p.party_label) {
    return [{
      politician: `${p.first_name} ${p.last_name}`,
      id: p.id,
      category: "WRONG_PARTY",
      detail: `DB-Partei ${p.party_label} fehlt komplett im CV; statt dessen erwähnt: ${otherParty}`,
    }];
  }
  return [];
}

function checkBundestagMembership(p: Pol, cv: CV): Issue[] {
  if (!p.has_bundestag_mandate) return [];
  const allEntries = [
    ...(cv.politische_stationen ?? []),
    ...(cv.beruflicher_werdegang ?? []),
  ];
  const hasMention = allEntries.some((e) =>
    /(?:Mitglied|MdB|Abgeordnet)/i.test(e.text) &&
    /(?:Bundestag|Deutsche[rn]\s+Bundestages?|MdB)/i.test(e.text)
  );
  if (!hasMention) {
    return [{
      politician: `${p.first_name} ${p.last_name}`,
      id: p.id,
      category: "MISSING_BUNDESTAG",
      detail: "DB hat Bundestag-Mandat, aber CV erwähnt es nicht",
    }];
  }
  return [];
}

function checkYearPlausibility(p: Pol, cv: CV): Issue[] {
  if (!p.year_of_birth) return [];
  const issues: Issue[] = [];
  const currentYear = new Date().getFullYear();
  const sections: (keyof CV)[] = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"];
  for (const sec of sections) {
    for (const e of cv[sec] ?? []) {
      const m = e.jahr.match(/(\d{4})/g);
      if (!m) continue;
      for (const y of m) {
        const yr = parseInt(y, 10);
        if (yr < p.year_of_birth) {
          issues.push({
            politician: `${p.first_name} ${p.last_name}`,
            id: p.id,
            category: "IMPLAUSIBLE_YEAR",
            detail: `${sec}: "${e.text.slice(0, 80)}" — Jahr ${yr} liegt vor Geburt (${p.year_of_birth})`,
          });
        } else if (yr > currentYear + 1) {
          issues.push({
            politician: `${p.first_name} ${p.last_name}`,
            id: p.id,
            category: "FUTURE_DATE",
            detail: `${sec}: "${e.text.slice(0, 80)}" — Jahr ${yr} liegt in der Zukunft`,
          });
        } else if (yr < 1900) {
          issues.push({
            politician: `${p.first_name} ${p.last_name}`,
            id: p.id,
            category: "ANCIENT_DATE",
            detail: `${sec}: "${e.text.slice(0, 80)}" — Jahr ${yr} ist verdächtig alt`,
          });
        }
      }
    }
  }
  return issues;
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const rows = db.prepare(`
    SELECT p.id, p.first_name, p.last_name, p.year_of_birth,
      pa.label AS party_label,
      EXISTS (SELECT 1 FROM mandates m
        JOIN parliament_periods pp ON m.parliament_period_id=pp.id
        JOIN parliaments par ON pp.parliament_id=par.id
        WHERE m.politician_id=p.id AND m.type='mandate' AND par.type='bundestag'
      ) AS has_bundestag_mandate,
      p.cv_json, p.cv_homepage_json
    FROM politicians p
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE p.cv_json IS NOT NULL OR p.cv_homepage_json IS NOT NULL
  `).all() as Pol[];

  console.log(`${rows.length} Politiker:innen mit CV-Daten zu prüfen...`);

  const allIssues: Issue[] = [];
  for (const p of rows) {
    for (const raw of [p.cv_json, p.cv_homepage_json]) {
      if (!raw) continue;
      try {
        const cv = JSON.parse(raw) as CV;
        allIssues.push(...checkPartyConsistency(p, cv));
        allIssues.push(...checkBundestagMembership(p, cv));
        allIssues.push(...checkYearPlausibility(p, cv));
      } catch { /* ignore broken json */ }
    }
  }

  // Deduplizieren — gleiche Issue (politician + category + detail) doppelt zählt nicht
  const seen = new Set<string>();
  const unique = allIssues.filter((i) => {
    const k = `${i.id}|${i.category}|${i.detail.slice(0, 50)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Statistik
  const byCategory = new Map<string, Issue[]>();
  for (const i of unique) {
    if (!byCategory.has(i.category)) byCategory.set(i.category, []);
    byCategory.get(i.category)!.push(i);
  }

  // Bericht generieren
  const lines: string[] = [];
  lines.push(`# CV-Konsistenz-Bericht`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)} · ${rows.length} Politiker:innen geprüft\n`);
  lines.push(`## Zusammenfassung\n`);
  lines.push(`| Kategorie | Anzahl | Beschreibung |`);
  lines.push(`|---|---:|---|`);
  const labels: Record<string, string> = {
    WRONG_PARTY: "Parteiwiderspruch zur DB",
    MISSING_BUNDESTAG: "Bundestags-Mandat nicht im CV",
    IMPLAUSIBLE_YEAR: "Jahr liegt vor Geburtsjahr",
    ANCIENT_DATE: "Jahr verdächtig vor 1900",
    FUTURE_DATE: "Jahr liegt in der Zukunft",
  };
  for (const cat of Object.keys(labels)) {
    const list = byCategory.get(cat) ?? [];
    lines.push(`| ${labels[cat]} | ${list.length} | ${cat} |`);
  }
  lines.push(`| **Gesamt** | **${unique.length}** | |\n`);

  for (const cat of Object.keys(labels)) {
    const list = byCategory.get(cat) ?? [];
    if (list.length === 0) continue;
    lines.push(`\n## ${labels[cat]} (${list.length})\n`);
    for (const i of list.slice(0, 100)) {
      lines.push(`- **${i.politician}** (id ${i.id}) — ${i.detail}`);
    }
    if (list.length > 100) lines.push(`\n*… und ${list.length - 100} weitere*`);
  }

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n=== Fertig ===`);
  for (const cat of Object.keys(labels)) {
    const list = byCategory.get(cat) ?? [];
    console.log(`  ${labels[cat].padEnd(35)} ${list.length}`);
  }
  console.log(`  ${"GESAMT".padEnd(35)} ${unique.length}`);
  console.log(`\nBericht: ${REPORT_PATH}`);
  db.close();
}

main();
