/**
 * Aggregator (Stage 3) — kombiniert alle Inspector-Outputs zu einer einheitlichen
 * Repair-Queue für Stage 4.
 *
 * Input:
 *   - inspect-dates.partial.jsonl       (Mistral Datums-Inspektor)
 *   - verify-mistral.partial.jsonl      (Llama 70B Verifier)
 *   - confirmed-duplicates-final.jsonl  (Doppelungen, schon Mensch-validiert)
 *
 * Logik:
 *   1. Für jedes Mistral-Verdict prüfe ob es Verifier-Output dazu gibt
 *   2. Verifier "confirmed" → in Repair-Queue
 *   3. Verifier "rejected" → NICHT reparieren (Mistral hatte False Positive)
 *   4. Verifier "uncertain" → flag für Manual-Review
 *   5. Doppelungs-Merges aus confirmed-duplicates-final → in Queue
 *   6. Mistral-Probleme OHNE Verifier-Coverage → flag für Manual-Review
 *
 * Output: cv-repair-queue.jsonl
 *   { politician_id, name, action: "patch_date" | "delete_date" | "set_date" | "merge_entries",
 *     section, target_index, current_value, new_value, source: "verifier" | "human",
 *     reason, evidence }
 *
 * Run:
 *   npx tsx scripts/aggregate-repair-queue.ts
 *   npx tsx scripts/aggregate-repair-queue.ts --print  # nur Stats, kein Write
 */

import path from "path";
import fs from "fs";

const ROOT = process.cwd();
const F_INSPECT = path.join(ROOT, "inspect-dates.partial.jsonl");
const F_VERIFY = path.join(ROOT, "verify-mistral.partial.jsonl");
const F_DUPS = path.join(ROOT, "confirmed-duplicates-final.jsonl");
const F_OUT = path.join(ROOT, "cv-repair-queue.jsonl");

const PRINT_MODE = process.argv.includes("--print");

interface MistralVerdict {
  section: string; index: number;
  jahr: string; text: string;
  status: "korrekt" | "korrekt_leer" | "datum_falsch" | "halluziniert" | "fehlend" | "unklar";
  korrektes_datum: string | null;
  evidence_quote: string;
}

interface VerifierResult {
  index: number; section: string;
  original_status: string;
  verifier_decision: "confirmed" | "rejected" | "uncertain";
  correct_status: "korrekt" | "korrekt_leer" | "datum_falsch" | "halluziniert" | "fehlend";
  suggested_correction: { jahr: string; text?: string } | null;
  reason: string;
  evidence_quote: string;
}

interface RepairAction {
  politician_id: number;
  name: string;
  action: "set_date" | "clear_date" | "merge_entries";
  section: string;
  target_index?: number;
  source_indices?: [number, number]; // for merge
  current_value?: { jahr: string; text: string };
  new_value: { jahr: string; text?: string };
  source: "verifier-confirmed" | "human-validated-duplicate";
  reason: string;
  evidence: string;
  audit: { detector?: string; verifier?: string; human_reviewer?: string };
}

function loadJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  const out: T[] = [];
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch {}
  }
  return out;
}

function main() {
  // Load all sources
  const inspectRows = loadJsonl<{ politician_id: number; name: string; verdicts: MistralVerdict[] }>(F_INSPECT);
  const verifyRows = loadJsonl<{ politician_id: number; name: string; results: VerifierResult[] }>(F_VERIFY);
  const dupRows = loadJsonl<any>(F_DUPS);

  console.log(`\nGeladen:`);
  console.log(`  Mistral-Inspector:    ${inspectRows.length} MdBs, ${inspectRows.reduce((a, r) => a + r.verdicts.length, 0)} Verdicts`);
  console.log(`  Verifier:             ${verifyRows.length} MdBs, ${verifyRows.reduce((a, r) => a + r.results.length, 0)} Results`);
  console.log(`  Doppelungs-Merges:    ${dupRows.length} bestätigte Merges`);

  // Build lookup: politician_id+section+index → verifier decision
  const verifierLookup = new Map<string, VerifierResult>();
  for (const v of verifyRows) {
    for (const r of v.results) {
      verifierLookup.set(`${v.politician_id}|${r.section}|${r.index}`, r);
    }
  }

  // Collect repair actions
  const queue: RepairAction[] = [];
  const stats = {
    total_mistral_problems: 0,
    verifier_confirmed: 0,
    verifier_rejected: 0,
    verifier_uncertain: 0,
    no_verifier_coverage: 0,
    duplicates_merge: 0,
  };

  // Process Mistral problems
  for (const row of inspectRows) {
    for (const v of row.verdicts) {
      const isProblem = v.status === "datum_falsch" || v.status === "halluziniert" || v.status === "fehlend";
      if (!isProblem) continue;
      stats.total_mistral_problems++;

      const verifier = verifierLookup.get(`${row.politician_id}|${v.section}|${v.index}`);
      if (!verifier) {
        stats.no_verifier_coverage++;
        continue; // Verifier hat das nicht abgedeckt — wird separat behandelt
      }

      if (verifier.verifier_decision === "rejected") {
        stats.verifier_rejected++;
        continue; // Mistral hatte False Positive — KEINE Reparatur
      }

      if (verifier.verifier_decision === "uncertain") {
        stats.verifier_uncertain++;
        continue; // Manual review nötig — separat handhaben
      }

      // verifier_decision === "confirmed" — Reparatur machen
      stats.verifier_confirmed++;

      // Aktion bestimmen aus correct_status
      let action: RepairAction["action"];
      let new_value: { jahr: string; text?: string };
      switch (verifier.correct_status) {
        case "halluziniert":
          // jahr war erfunden → leeren
          action = "clear_date";
          new_value = { jahr: "" };
          break;
        case "datum_falsch":
          // jahr stimmt nicht → korrekten Wert setzen
          action = "set_date";
          new_value = verifier.suggested_correction ?? { jahr: "" };
          break;
        case "fehlend":
          // jahr war leer → ergänzen
          action = "set_date";
          new_value = verifier.suggested_correction ?? { jahr: "" };
          break;
        default:
          // korrekt / korrekt_leer — sollte gar nicht zu Repair kommen wenn correct_status sagt OK
          continue;
      }

      queue.push({
        politician_id: row.politician_id,
        name: row.name,
        action,
        section: v.section,
        target_index: v.index,
        current_value: { jahr: v.jahr, text: v.text },
        new_value,
        source: "verifier-confirmed",
        reason: verifier.reason,
        evidence: verifier.evidence_quote,
        audit: {
          detector: "inspect-dates-v2-mistral",
          verifier: "verify-mistral-v1-llama70b-cascade",
        },
      });
    }
  }

  // Process duplicate merges
  for (const d of dupRows) {
    if (!d.merge) continue;
    queue.push({
      politician_id: d.politician_id,
      name: d.name,
      action: "merge_entries",
      section: d.section,
      source_indices: [d.index_a, d.index_b],
      current_value: { jahr: `${d.original_a.jahr} + ${d.original_b.jahr}`, text: `${d.original_a.text.slice(0, 60)} | ${d.original_b.text.slice(0, 60)}` },
      new_value: d.merged_entry,
      source: "human-validated-duplicate",
      reason: d.reason,
      evidence: d.evidence_quote,
      audit: {
        detector: "detect-duplicates-v1",
        verifier: "verify-duplicates-v1-llama70b",
        human_reviewer: "opus-4.7",
      },
    });
    stats.duplicates_merge++;
  }

  // Output
  console.log(`\n=== Aggregations-Statistik ===`);
  console.log(`  Mistral-Probleme gesamt:      ${stats.total_mistral_problems}`);
  console.log(`    → Verifier confirmed:        ${stats.verifier_confirmed}  → in Repair-Queue`);
  console.log(`    → Verifier rejected:         ${stats.verifier_rejected}  (False Positives, KEINE Reparatur)`);
  console.log(`    → Verifier uncertain:        ${stats.verifier_uncertain}  ← manueller Review`);
  console.log(`    → noch nicht verifiziert:    ${stats.no_verifier_coverage}  ← Verifier muss noch laufen`);
  console.log(`  Doppelungs-Merges:             ${stats.duplicates_merge}  → in Repair-Queue`);
  console.log(`\n  REPAIR-QUEUE TOTAL:           ${queue.length} Aktionen`);
  if (stats.total_mistral_problems > 0) {
    const fpRate = (stats.verifier_rejected / (stats.verifier_confirmed + stats.verifier_rejected) * 100);
    console.log(`\n  Mistral False-Positive-Rate:  ${fpRate.toFixed(1)}%`);
  }

  // Group queue by action
  const byAction: Record<string, number> = {};
  for (const q of queue) byAction[q.action] = (byAction[q.action] || 0) + 1;
  console.log(`\n  Repair-Queue nach Aktion:`);
  for (const [a, n] of Object.entries(byAction)) console.log(`    ${a.padEnd(20)} ${n}`);

  if (!PRINT_MODE) {
    fs.writeFileSync(F_OUT, queue.map(q => JSON.stringify(q)).join("\n") + "\n");
    console.log(`\n  → ${F_OUT}`);
  } else {
    console.log(`\n  --print mode: kein Write`);
  }
}

main();
