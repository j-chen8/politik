/**
 * test-topic-classifier.ts — SPIKE-Test (kein Produktiv-Code)
 * Klassifiziert eine kleine Stichprobe (Drucksachen-themen + TOP-Titel) auf die
 * AW-Politikfeld-Taxonomie und druckt Vorhersage vs. offizielles AW-Label zum
 * manuellen Drüberschauen. ~1 Cent (Haiku 4.5, ein Call).
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

// .env laden (tsx lädt nicht automatisch)
if (!process.env.ANTHROPIC_API_KEY) {
  for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, "");
  }
}

// Kanonische AW-Politikfelder (22 aus DB bestätigt + 6 Standard-Felder ergänzt)
const TAXONOMY = [
  "Arbeit und Beschäftigung", "Außenpolitik und internationale Beziehungen", "Außenwirtschaft",
  "Bildung und Erziehung", "Bundestag", "Energie", "Entwicklungspolitik",
  "Europapolitik und Europäische Union", "Gesellschaftspolitik, soziale Gruppen", "Gesundheit",
  "Innere Sicherheit", "Kultur", "Landwirtschaft und Ernährung",
  "Medien, Kommunikation und Informationstechnik", "Migration und Aufenthaltsrecht",
  "Neue Bundesländer", "Öffentliche Finanzen, Steuern und Abgaben", "Politisches Leben, Parteien",
  "Raumordnung, Bau- und Wohnungswesen", "Recht", "Soziale Sicherung", "Sport, Freizeit und Tourismus",
  "Staat und Verwaltung", "Umwelt", "Verkehr", "Verteidigung", "Wirtschaft",
  "Wissenschaft, Forschung und Technologie",
];

const labeled = fs.readFileSync("/tmp/test_themes_labeled.tsv", "utf-8").trim().split("\n")
  .map(l => { const [thema, aw] = l.split("\t"); return { kind: "drucksache_thema", text: thema, official: aw }; });
const tops = fs.readFileSync("/tmp/test_tops.tsv", "utf-8").trim().split("\n")
  .filter(Boolean).map(t => ({ kind: "top_titel", text: t, official: null as string | null }));
const inputs = [...labeled, ...tops];

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Du klassifizierst deutsche Bundestags-Inhalte auf eine FESTE Politikfeld-Taxonomie (abgeordnetenwatch-Standard).

TAXONOMIE (NUR diese Labels exakt verwenden):
${TAXONOMY.map(t => "- " + t).join("\n")}

REGELN:
- Pro Eintrag 1–3 Felder, das treffendste zuerst (= primary).
- NUR Labels aus der Taxonomie, exakt buchstabiert.
- "thema" ist ein Stichwort-Cluster einer Drucksache; "top_titel" ist ein Plenar-Tagesordnungspunkt (oft mit prozeduralem Vorspann wie "Zweite und dritte Beratung des Entwurfs..."). Ignoriere prozedurale Floskeln und Abgeordneten-Namen, klassifiziere nach dem SACHTHEMA.
- Wenn KEIN Sachthema erkennbar ist (reiner Verfahrenstext ohne Inhalt), gib das Feld ["UNKLAR"] zurück.`;

const TOOL = {
  name: "classify",
  description: "Ordne jedem Eintrag Politikfelder zu.",
  input_schema: {
    type: "object" as const,
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer", description: "0-basierter Index des Eintrags" },
            fields: { type: "array", items: { type: "string" }, description: "1–3 Felder, treffendstes zuerst" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["index", "fields", "confidence"],
        },
      },
    },
    required: ["results"],
  },
};

const userMsg = inputs.map((x, i) => `[${i}] (${x.kind}) ${x.text}`).join("\n");

async function main() {
const resp = await client.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 4000,
  system: SYSTEM,
  tools: [TOOL],
  tool_choice: { type: "tool", name: "classify" },
  messages: [{ role: "user", content: userMsg }],
});

const tu: any = resp.content.find((b: any) => b.type === "tool_use");
const byIndex = new Map<number, any>();
for (const r of tu.input.results) byIndex.set(r.index, r);

const norm = (s: string) => s.toLowerCase().replace(/[^a-zäöü]/g, "");
let exactPrimary = 0, anyOverlap = 0, labeledCount = 0, unklar = 0;

console.log("\n══════ DRUCKSACHEN-THEMEN (mit AW-Ground-Truth) ══════\n");
inputs.forEach((x, i) => {
  const pred = byIndex.get(i);
  const pf = pred?.fields ?? ["(keine)"];
  if (pf[0] === "UNKLAR") unklar++;
  if (x.kind === "top_titel" && i === labeled.length) {
    console.log("\n══════ TOP-TITEL (Reden-Pfad, keine Ground-Truth) ══════\n");
  }
  if (x.official) {
    labeledCount++;
    const off = JSON.parse(x.official);
    const offNorm = off.map(norm);
    const primaryHit = offNorm.includes(norm(pf[0]));
    const overlap = pf.some((f: string) => offNorm.includes(norm(f)));
    if (primaryHit) exactPrimary++;
    if (overlap) anyOverlap++;
    console.log(`„${x.text}"`);
    console.log(`   → VORHERSAGE: ${pf.join(" · ")}  [${pred?.confidence}]`);
    console.log(`   → AW-OFFIZIELL: ${off.join(" · ")}`);
    console.log(`   ${primaryHit ? "✓ Primär-Treffer" : overlap ? "~ Überlappung" : "✗ kein Treffer"}\n`);
  } else {
    console.log(`„${x.text.slice(0, 95)}${x.text.length > 95 ? "…" : ""}"`);
    console.log(`   → ${pf.join(" · ")}  [${pred?.confidence}]\n`);
  }
});

console.log("══════ ZUSAMMENFASSUNG ══════");
console.log(`Gelabelte Themen: ${labeledCount} | Primär-Treffer: ${exactPrimary}/${labeledCount} (${(exactPrimary/labeledCount*100).toFixed(0)}%) | mind. 1 Überlappung: ${anyOverlap}/${labeledCount} (${(anyOverlap/labeledCount*100).toFixed(0)}%)`);
console.log(`TOP-Titel als UNKLAR (prozedural, kein Thema): ${unklar}`);
const usage: any = resp.usage;
console.log(`Tokens: ${usage.input_tokens} in / ${usage.output_tokens} out  (~$${((usage.input_tokens*1e-6*1)+(usage.output_tokens*1e-6*5)).toFixed(4)} live)`);
}
main().catch(e => { console.error(e); process.exit(1); });
