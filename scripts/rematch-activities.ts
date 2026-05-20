/**
 * Re-Match: läuft den Politicians-Lookup gegen `activities` mit gefixter
 * Matcher-Logik (normalizeName + Null-Fallback statt candidates[0].id).
 *
 *   npx tsx scripts/rematch-activities.ts             # dry-run, nur NULL-Rows
 *   npx tsx scripts/rematch-activities.ts --apply     # NULL-Rows schreiben
 *   npx tsx scripts/rematch-activities.ts --all       # dry-run, ALLE Rows (audit)
 *   npx tsx scripts/rematch-activities.ts --all --apply  # ALLE Rows schreiben
 *
 * Audit-Modus (`--all`) re-evaluiert auch schon gematchte Rows. Wenn der neue
 * Matcher NULL liefert, wo bisher ein politician_id stand, war der alte
 * `candidates[0].id`-Fallback im Spiel → wird auf NULL gesetzt (lieber
 * unmatched als falsch zugeordnet, siehe Rainer-Groß-Bug 2026-05-20).
 */

import Database from "better-sqlite3";
import path from "path";
import { parseDipTitle, normalizeName } from "../src/lib/german-name-parser";

const DB_PATH = path.join(process.cwd(), "politik.db");
const apply = process.argv.includes("--apply");
const allMode = process.argv.includes("--all");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

interface Pol {
  id: number;
  first_name: string;
  last_name: string;
  party: string | null;
}

const allPoliticians = db
  .prepare(
    `SELECT p.id, p.first_name, p.last_name, pa.label as party
     FROM politicians p
     LEFT JOIN parties pa ON p.party_id = pa.id`
  )
  .all() as Pol[];

const byNormLastWord = new Map<string, Pol[]>();
for (const p of allPoliticians) {
  const tokens = p.last_name.split(/\s+/);
  const keys = new Set<string>();
  keys.add(normalizeName(p.last_name));
  keys.add(normalizeName(tokens[tokens.length - 1]));
  for (const k of keys) {
    if (!byNormLastWord.has(k)) byNormLastWord.set(k, []);
    byNormLastWord.get(k)!.push(p);
  }
}

function matchPolitician(titel: string): number | null {
  const parsed = parseDipTitle(titel);
  if (!parsed.lastName) return null;

  const candidates = byNormLastWord.get(normalizeName(parsed.lastName));
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  if (parsed.firstName) {
    const fnLower = normalizeName(parsed.firstName);
    const match = candidates.find((c) => {
      const cfn = normalizeName(c.first_name);
      return cfn === fnLower || cfn.startsWith(fnLower) || fnLower.startsWith(cfn);
    });
    if (match) return match.id;
  }

  const titleParts = titel.split(",").map((s) => s.trim());
  if (titleParts.length >= 3) {
    const party = titleParts[titleParts.length - 1];
    const partyMatch = candidates.find((c) => c.party && c.party.includes(party));
    if (partyMatch) return partyMatch.id;
  }

  return null;
}

const rows = allMode
  ? db.prepare(`SELECT id, titel, politician_id FROM activities`).all() as { id: string; titel: string; politician_id: number | null }[]
  : db.prepare(`SELECT id, titel, politician_id FROM activities WHERE politician_id IS NULL`).all() as { id: string; titel: string; politician_id: number | null }[];

const before = db
  .prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN politician_id IS NOT NULL THEN 1 ELSE 0 END) AS matched
     FROM activities`
  )
  .get() as { total: number; matched: number };

console.log(`Stand vor Re-Match: ${before.matched}/${before.total} (${(100*before.matched/before.total).toFixed(1)}%)`);
console.log(`Modus: ${allMode ? "ALL (Audit)" : "nur NULL-Rows"}`);
console.log(`Rows zu prüfen: ${rows.length}`);

// Diff-Stats
let newMatches = 0;       // alt NULL → neu Treffer
let nulledOut = 0;        // alt Treffer → neu NULL (war Falsch-Fallback)
let overrides = 0;        // alt X → neu Y (X ≠ Y)
let unchanged = 0;
const fixesByName = new Map<string, number>();
const nulledByName = new Map<string, number>();
const overrideSamples: { titel: string; oldId: number; newId: number }[] = [];

for (const a of rows) {
  const newPid = matchPolitician(a.titel);
  const oldPid = a.politician_id;
  if (newPid === oldPid) { unchanged++; continue; }
  const key = a.titel.split(",")[0].trim();
  if (oldPid === null && newPid !== null) {
    newMatches++;
    fixesByName.set(key, (fixesByName.get(key) ?? 0) + 1);
  } else if (oldPid !== null && newPid === null) {
    nulledOut++;
    nulledByName.set(key, (nulledByName.get(key) ?? 0) + 1);
  } else if (oldPid !== null && newPid !== null) {
    overrides++;
    if (overrideSamples.length < 20) overrideSamples.push({ titel: a.titel, oldId: oldPid, newId: newPid });
  }
}

console.log(`\n=== Diff ===`);
console.log(`  Unverändert:           ${unchanged}`);
console.log(`  Neue Matches (alt NULL → neu Treffer):  ${newMatches}`);
console.log(`  Genullt (alt Treffer → neu NULL):       ${nulledOut}`);
console.log(`  Overrides (alt X → neu Y):              ${overrides}`);

if (fixesByName.size > 0) {
  console.log(`\nTop 10 neue Matches:`);
  const top = [...fixesByName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [name, n] of top) console.log(`  ${n.toString().padStart(4)}  ${name}`);
}

if (nulledByName.size > 0) {
  console.log(`\nTop 10 genullte (alt falsch-gematcht, neu unbekannt):`);
  const top = [...nulledByName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [name, n] of top) console.log(`  ${n.toString().padStart(4)}  ${name}`);
}

if (overrideSamples.length > 0) {
  console.log(`\nOverride-Beispiele (alt X → neu Y):`);
  const nameById = new Map<number, string>();
  for (const p of allPoliticians) nameById.set(p.id, `${p.first_name} ${p.last_name}`);
  for (const s of overrideSamples) {
    console.log(`  "${s.titel}"`);
    console.log(`     ${s.oldId} (${nameById.get(s.oldId) ?? "?"}) → ${s.newId} (${nameById.get(s.newId) ?? "?"})`);
  }
}

if (!apply) {
  console.log("\n(Dry-Run. Mit --apply ausführen, um UPDATEs zu schreiben.)");
  process.exit(0);
}

console.log("\nApplying UPDATEs ...");
const update = db.prepare(`UPDATE activities SET politician_id = ? WHERE id = ?`);
let applied = 0;
const tx = db.transaction(() => {
  for (const a of rows) {
    const newPid = matchPolitician(a.titel);
    if (newPid !== a.politician_id) {
      update.run(newPid, a.id);
      applied++;
    }
  }
});
tx();

const after = db
  .prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN politician_id IS NOT NULL THEN 1 ELSE 0 END) AS matched
     FROM activities`
  )
  .get() as { total: number; matched: number };

console.log(`\nGeschrieben: ${applied} rows`);
console.log(`Stand nach Re-Match: ${after.matched}/${after.total} (${(100*after.matched/after.total).toFixed(1)}%)`);
