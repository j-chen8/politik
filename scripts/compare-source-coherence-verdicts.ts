/**
 * Vergleich: Opus 4.7 (Ground Truth) vs. Llama 3.3 70B vs. Haiku 4.5
 * für Source-Coherence-Konflikte.
 *
 * Run: npx tsx scripts/compare-source-coherence-verdicts.ts
 */

import path from "path";
import fs from "fs";

const OPUS = path.join(process.cwd(), "opus-verdicts-source-coherence.jsonl");
const LLAMA = path.join(process.cwd(), "llama-verdicts-source-coherence.jsonl");
const HAIKU = path.join(process.cwd(), "haiku-verdicts-source-coherence.jsonl");

function loadJsonl(file: string): Map<number, any> {
  const map = new Map<number, any>();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    map.set(obj.id, obj);
  }
  return map;
}

const opus = loadJsonl(OPUS);
const llama = loadJsonl(LLAMA);
const haiku = loadJsonl(HAIKU);

const CATS = ["ECHT", "PRAEZISIERUNG", "FALSE_POSITIVE", "UNKLAR"];

function buildMatrix(refKey: string, candKey: string, ref: Map<number, any>, cand: Map<number, any>) {
  const matrix: Record<string, Record<string, number>> = {};
  for (const c of CATS) { matrix[c] = {}; for (const c2 of CATS) matrix[c][c2] = 0; }
  let agreed = 0, total = 0;
  for (const id of [...ref.keys()].sort((a, b) => a - b)) {
    const r = ref.get(id);
    const c = cand.get(id);
    if (!c) continue;
    matrix[r[refKey]][c[candKey]] += 1;
    total += 1;
    if (r[refKey] === c[candKey]) agreed += 1;
  }
  return { matrix, agreed, total };
}

function printMatrix(title: string, matrix: Record<string, Record<string, number>>, agreed: number, total: number) {
  console.log(`\n=== ${title} ===`);
  console.log(`Agreement: ${agreed}/${total} = ${(100 * agreed / total).toFixed(1)}%\n`);
  console.log("Confusion-Matrix (Opus → Kandidat):");
  console.log("                     ECHT  PRAEZ  FP  UNKLAR");
  for (const o of CATS) {
    const row = CATS.map(l => String(matrix[o][l]).padStart(5)).join("  ");
    console.log(`  ${o.padEnd(15)} ${row}`);
  }

  const echtTP = matrix["ECHT"]["ECHT"];
  const echtPositiveOpus = CATS.reduce((s, c) => s + matrix["ECHT"][c], 0);
  const echtPositiveCand = CATS.reduce((s, c) => s + matrix[c]["ECHT"], 0);
  const prec = echtTP / (echtPositiveCand || 1);
  const rec = echtTP / (echtPositiveOpus || 1);
  const f1 = (2 * prec * rec) / ((prec + rec) || 1);
  console.log(`\nKlasse ECHT:`);
  console.log(`  Precision: ${(prec * 100).toFixed(1)}%   Recall: ${(rec * 100).toFixed(1)}%   F1: ${(f1 * 100).toFixed(1)}%`);
}

const llamaCmp = buildMatrix("opus_verdict", "llama_verdict", opus, llama);
const haikuCmp = buildMatrix("opus_verdict", "haiku_verdict", opus, haiku);

printMatrix("Opus vs. Llama 3.3 70B (Groq Free)", llamaCmp.matrix, llamaCmp.agreed, llamaCmp.total);
printMatrix("Opus vs. Haiku 4.5 (Anthropic)", haikuCmp.matrix, haikuCmp.agreed, haikuCmp.total);

// Side-by-Side per Konflikt
console.log("\n\n=== Side-by-Side per Konflikt ===\n");
console.log("ID  Politiker                           Opus            Llama           Haiku");
console.log("-".repeat(95));
for (const id of [...opus.keys()].sort((a, b) => a - b)) {
  const o = opus.get(id);
  const l = llama.get(id);
  const h = haiku.get(id);
  const op = o.opus_verdict.padEnd(15);
  const lp = (l?.llama_verdict ?? "-").padEnd(15);
  const hp = (h?.haiku_verdict ?? "-").padEnd(15);
  const name = `${o.name}`.slice(0, 32).padEnd(34);
  const flag = o.opus_verdict === l?.llama_verdict && o.opus_verdict === h?.haiku_verdict ? "" : " ←";
  console.log(`${String(id).padStart(2)}  ${name}  ${op} ${lp} ${hp}${flag}`);
}

// Cases wo Haiku vs Opus differiert
console.log("\n\n=== Haiku-Disagreements mit Opus (Detail) ===");
let nDis = 0;
for (const id of [...opus.keys()].sort((a, b) => a - b)) {
  const o = opus.get(id);
  const h = haiku.get(id);
  if (!h || o.opus_verdict === h.haiku_verdict) continue;
  nDis += 1;
  console.log(`\n  [${id}] ${o.name} (${o.section}/${o.jahr})`);
  console.log(`     Opus  (${o.opus_verdict}):  ${o.opus_reason.slice(0, 200)}`);
  console.log(`     Haiku (${h.haiku_verdict}): ${h.haiku_reason.slice(0, 200)}`);
}
console.log(`\nTotal Haiku-Disagreements: ${nDis}/${opus.size}`);
