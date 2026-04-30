/**
 * Wendet die kombinierten Tiebreak-Patches automatisch an:
 *   - Aus tiebreak.partial.jsonl (v1): alle "mistral"-Verdikte
 *   - Aus tiebreak-v2.partial.jsonl (v2): alle "mistral"-Verdikte
 *     (falls v2 auch noch andere Verdikte als v1 für die ehemals unscharfen
 *     Konflikte liefert, verwenden wir die v2-Verdikte)
 *
 * Ein Patch ersetzt im cv_json oder cv_homepage_json einen Eintrag, dessen
 * .text den llamaText enthält, durch { jahr, text } aus der mistralText-Aussage.
 *
 * Modi:
 *   --dry-run   : zeigt Patches an, ändert NICHTS
 *   --sample N  : zeigt N zufällige Patches mit voller Begründung
 *   --apply     : wendet Patches tatsächlich an
 *
 * Run:
 *   npx tsx scripts/apply-tiebreak-patches-auto.ts --dry-run
 *   npx tsx scripts/apply-tiebreak-patches-auto.ts --sample 10
 *   npx tsx scripts/apply-tiebreak-patches-auto.ts --apply
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const V1_PATH = path.join(process.cwd(), "tiebreak.partial.jsonl");
const V2_PATH = path.join(process.cwd(), "tiebreak-v2.partial.jsonl");

const DRY = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");
const SAMPLE_IDX = process.argv.indexOf("--sample");
const SAMPLE_N = SAMPLE_IDX > -1 ? parseInt(process.argv[SAMPLE_IDX + 1], 10) : 0;
const SHOW_SHAKY = process.argv.includes("--show-shaky");
const SKIP_SHAKY = !process.argv.includes("--include-shaky");

/** Erkennt unsichere Verdict-Begründungen — Heuristik */
function isShaky(reason: string): boolean {
  const r = reason.toLowerCase();
  const patterns = [
    "wenn man annimmt",
    "wenn man davon ausgeht",
    "vermutlich",
    "möglicherweise",
    "moeglicherweise",
    "nicht eindeutig",
    "nicht klar",
    "lässt unklar",
    "lässt sich nicht eindeutig",
    "ist nicht spezifisch",
    "nicht spezifisch für den zeitraum",
    "ist zwar wahr, aber",
    "präziser und korrekt, wenn",
    "kann nicht ausgeschlossen werden",
    "der quelltext nennt nicht das genaue",
    "übereinstimmt, aber",
    "trifft nicht direkt",
  ];
  return patterns.some((p) => r.includes(p));
}

if (!DRY && !APPLY && SAMPLE_N === 0 && !SHOW_SHAKY) {
  console.log("Bitte mit --dry-run, --sample N, --apply oder --show-shaky aufrufen.");
  process.exit(1);
}

interface Entry { jahr: string; text: string; }
interface CV {
  ausbildung: Entry[];
  beruflicher_werdegang: Entry[];
  politische_stationen: Entry[];
  sonstiges: Entry[];
}

interface Conflict {
  politicianId: number;
  politicianName: string;
  section: keyof CV | string;
  jahr: string;
  llamaText: string;
  mistralText: string;
}

interface V1Verdict {
  winner: "llama" | "mistral" | "beide" | "keiner" | "unklar";
  reason: string;
  evidenceQuote: string | null;
}

interface V2Verdict extends V1Verdict {
  evidenceSource?: string;
}

interface Patch {
  source: "v1" | "v2";
  conflict: Conflict;
  verdict: V1Verdict | V2Verdict;
}

function loadJsonl<T>(p: string): T[] {
  if (!fs.existsSync(p)) return [];
  const out: T[] = [];
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
}

function buildPatches(): { patches: Patch[]; shaky: Patch[] } {
  // v2-Verdikte priorisieren — dort sind die ehemals unscharfen Fälle drin,
  // die mit reicheren Quellen entschieden wurden.
  const v2Rows = loadJsonl<{ key: string; conflict: Conflict; v1Verdict: V1Verdict; v2Verdict: V2Verdict }>(V2_PATH);
  const v2Keys = new Set(v2Rows.map((r) => r.key));

  const v1Rows = loadJsonl<{ key: string; conflict: Conflict; verdict: V1Verdict }>(V1_PATH);

  const patches: Patch[] = [];

  // v1: alle mistral-Verdikte AUSSER die, die v2 erneut geprüft hat
  for (const r of v1Rows) {
    if (v2Keys.has(r.key)) continue; // v2 hat das übernommen
    if (r.verdict.winner === "mistral") {
      patches.push({ source: "v1", conflict: r.conflict, verdict: r.verdict });
    }
  }
  // v2: alle mistral-Verdikte
  for (const r of v2Rows) {
    if (r.v2Verdict.winner === "mistral") {
      patches.push({ source: "v2", conflict: r.conflict, verdict: r.v2Verdict });
    }
  }
  // Wackelige rausfiltern
  const shaky: Patch[] = [];
  const stable: Patch[] = [];
  for (const p of patches) {
    if (isShaky(p.verdict.reason || "")) shaky.push(p);
    else stable.push(p);
  }
  return { patches: stable, shaky };
}

interface ApplyResult {
  applied: boolean;
  field?: "cv_json" | "cv_homepage_json";
  before?: string;
  after?: string;
  reason?: string;
}

const SECTIONS = ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"] as const;

function tryApplyPatchToJson(json: string, p: Patch): { changed: boolean; before?: string; after?: string; newJson: string } {
  let cv: CV;
  try { cv = JSON.parse(json); } catch { return { changed: false, newJson: json }; }
  const section = p.conflict.section as keyof CV;
  if (!SECTIONS.includes(section as any)) return { changed: false, newJson: json };
  const entries = cv[section];
  if (!Array.isArray(entries)) return { changed: false, newJson: json };
  // Wir matchen den Eintrag, dessen .text mit dem llamaText übereinstimmt
  // (die gespeicherten LLM-Outputs der Generator-Pipeline).
  const llamaShort = p.conflict.llamaText.slice(0, 60);
  const idx = entries.findIndex((e) => e.text && e.text.includes(llamaShort));
  if (idx === -1) return { changed: false, newJson: json };
  const before = `${entries[idx].jahr} — ${entries[idx].text}`;
  entries[idx] = { jahr: p.conflict.jahr, text: p.conflict.mistralText };
  const after = `${p.conflict.jahr} — ${p.conflict.mistralText}`;
  return { changed: true, before, after, newJson: JSON.stringify(cv) };
}

function applyPatch(db: Database.Database, p: Patch, write: boolean): ApplyResult {
  const row = db
    .prepare("SELECT cv_json, cv_homepage_json FROM politicians WHERE id = ?")
    .get(p.conflict.politicianId) as { cv_json: string | null; cv_homepage_json: string | null } | undefined;
  if (!row) return { applied: false, reason: "politician not found" };

  for (const field of ["cv_json", "cv_homepage_json"] as const) {
    const json = row[field];
    if (!json) continue;
    const r = tryApplyPatchToJson(json, p);
    if (!r.changed) continue;
    if (write) {
      db.prepare(`UPDATE politicians SET ${field} = ? WHERE id = ?`).run(r.newJson, p.conflict.politicianId);
    }
    return { applied: true, field, before: r.before, after: r.after };
  }
  return { applied: false, reason: "kein Eintrag in cv_json oder cv_homepage_json gematcht" };
}

function main() {
  const { patches: stable, shaky } = buildPatches();
  const patches = SKIP_SHAKY ? stable : [...stable, ...shaky];

  console.log(`${stable.length + shaky.length} Patches zusammengestellt:`);
  console.log(`  ${stable.length} stabil`);
  console.log(`  ${shaky.length} wackelig (Begründung mit Unsicherheits-Wörtern)`);
  console.log(`  → verarbeite ${patches.length} Patches ${SKIP_SHAKY ? "(wackelige übersprungen)" : "(inkl. wackelige)"}\n`);

  if (SHOW_SHAKY) {
    console.log(`=== Wackelige Patches (würden mit --include-shaky angewendet) ===\n`);
    for (const p of shaky) {
      console.log(`# ${p.conflict.politicianName} · ${p.conflict.section} · ${p.conflict.jahr}`);
      console.log(`  Llama:   ${p.conflict.llamaText.slice(0, 130)}`);
      console.log(`  Mistral: ${p.conflict.mistralText.slice(0, 130)}`);
      console.log(`  Begründung: ${p.verdict.reason}\n`);
    }
    return;
  }

  if (SAMPLE_N > 0) {
    const shuffled = [...patches].sort(() => Math.random() - 0.5).slice(0, SAMPLE_N);
    console.log(`=== Stichprobe (${SAMPLE_N} zufällige Patches) ===\n`);
    for (const p of shuffled) {
      console.log(`# ${p.conflict.politicianName} (${p.source}) · ${p.conflict.section} · ${p.conflict.jahr}`);
      console.log(`  Llama:    ${p.conflict.llamaText.slice(0, 130)}`);
      console.log(`  Mistral:  ${p.conflict.mistralText.slice(0, 130)}`);
      console.log(`  Verdict-Begründung: ${p.verdict.reason}`);
      const v2 = p.verdict as V2Verdict;
      if (v2.evidenceQuote) console.log(`  Beleg${v2.evidenceSource ? ` (${v2.evidenceSource})` : ""}: "${v2.evidenceQuote.slice(0, 200)}"`);
      console.log();
    }
    return;
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const stats = { applied: 0, alreadyDone: 0, notFound: 0, byField: { cv_json: 0, cv_homepage_json: 0 } };
  for (const p of patches) {
    const r = applyPatch(db, p, APPLY);
    if (r.applied) {
      stats.applied++;
      if (r.field) stats.byField[r.field]++;
      if (DRY) {
        console.log(`✓ ${p.conflict.politicianName} [${r.field} · ${p.conflict.section}]`);
        console.log(`    - ${r.before?.slice(0, 130)}`);
        console.log(`    + ${r.after?.slice(0, 130)}`);
      }
    } else {
      stats.notFound++;
    }
  }

  console.log(`\n=== ${APPLY ? "Angewendet" : "Würde anwenden"} ===`);
  console.log(`  ✓ ${stats.applied} Patches ${APPLY ? "angewendet" : "matchbar"}`);
  console.log(`     in cv_json:          ${stats.byField.cv_json}`);
  console.log(`     in cv_homepage_json: ${stats.byField.cv_homepage_json}`);
  console.log(`  ⤵ ${stats.notFound} Patches: kein Match (evtl. schon vorher korrigiert)`);

  db.close();
}

main();
