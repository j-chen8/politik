/**
 * audit-topic-symmetry.ts — Schritt H: Frame-Capture-Symmetrie-Audit
 * Testet, ob der Themen-Klassifikator Partei-Cues nutzt (Bias) oder den Inhalt liest (fair).
 * Methode: Drucksachen-Summary ORIGINAL vs. PARTEI-GEBLINDET klassifizieren, Flip-Rate
 * pro Fraktion messen. Hohe Flip-Rate / partei-korrelierte Flips = Bias.
 *
 * Usage: npx tsx scripts/audit-topic-symmetry.ts [--n 40]
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";

if (!process.env.ANTHROPIC_API_KEY) {
  for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
    const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].replace(/^["']|["']$/g, "");
  }
}
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
const N = process.argv.includes("--n") ? parseInt(process.argv[process.argv.indexOf("--n") + 1]) : 40;
const db = new Database("politik.db");

// Partei-Cues entfernen → inhaltlich identisch, aber akteur-neutral
function blind(s: string): string {
  let t = s;
  t = t.replace(/\bEingebracht von [^.]+\.\s*/gi, "");
  t = t.replace(/\bDie (AfD|SPD|CDU\/CSU|Linke)-Fraktion\b/gi, "Eine Fraktion");
  t = t.replace(/\bDie Fraktion (BÜNDNIS 90\/DIE GRÜNEN|Die Linke|der AfD|der SPD|der CDU\/CSU)\b/gi, "Eine Fraktion");
  t = t.replace(/\b(BÜNDNIS 90\/DIE GRÜNEN|Bündnis 90\/Die Grünen|CDU\/CSU|AfD|SPD|Die Linke|die Grünen|der Grünen|Die Grünen)\b/g, "eine Fraktion");
  t = t.replace(/\b(Die|der|die) AfD\b/g, "eine Fraktion");
  return t;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SYSTEM = `Klassifiziere die Parlaments-Drucksache (Zusammenfassung) auf GENAU EIN Politikfeld (abgeordnetenwatch). Nur exakt diese Labels:\n${TAXONOMY.map(t => "- " + t).join("\n")}\nGib nur das Feld zurück.`;
const TOOL = { name: "c", description: "Feld pro Eintrag.", input_schema: { type: "object" as const, properties: { r: { type: "array", items: { type: "object", properties: { i: { type: "integer" }, f: { type: "string" } }, required: ["i", "f"] } } }, required: ["r"] } };

async function classify(texts: string[]): Promise<string[]> {
  const out: string[] = new Array(texts.length).fill("?");
  for (let i = 0; i < texts.length; i += 40) {
    const batch = texts.slice(i, i + 40);
    const resp = await client.messages.create({ model: "claude-haiku-4-5", max_tokens: 3000, system: SYSTEM, tools: [TOOL], tool_choice: { type: "tool", name: "c" }, messages: [{ role: "user", content: batch.map((t, j) => `[${j}] ${t.slice(0, 200)}`).join("\n") }] });
    const tu: any = resp.content.find((b: any) => b.type === "tool_use");
    for (const r of tu.input.r) if (r.i < batch.length) out[i + r.i] = r.f;
  }
  return out;
}

async function main() {
  const parties = ["AfD", "BÜNDNIS 90/DIE GRÜNEN", "Die Linke"];
  const sample: { party: string; orig: string; blinded: string }[] = [];
  for (const p of parties) {
    const rows = db.prepare(`SELECT zusammenfassung FROM drucksache_analyses
      WHERE fraktion=? AND zusammenfassung IS NOT NULL AND batch_class!='antwort'
        AND zusammenfassung NOT LIKE 'Wahlvorschlag%' AND length(zusammenfassung)>80
      ORDER BY drucksache_nr LIMIT ?`).all(p, N) as any[];
    for (const r of rows) sample.push({ party: p, orig: r.zusammenfassung, blinded: blind(r.zusammenfassung) });
  }
  console.log(`Stichprobe: ${sample.length} (${parties.map(p => `${p.split(" ")[0]}: ${sample.filter(s => s.party === p).length}`).join(", ")})`);
  console.log(`\nBlinding-Beispiel:\n  ORIG:    ${sample[0].orig.slice(0, 100)}\n  BLIND:   ${sample[0].blinded.slice(0, 100)}\n`);

  const origF = await classify(sample.map(s => s.orig));
  const blindF = await classify(sample.map(s => s.blinded));

  const norm = (x: string) => x.toLowerCase().replace(/[^a-zäöü]/g, "");
  const byParty: Record<string, { n: number; flips: number; flipDetail: string[] }> = {};
  let totalFlips = 0;
  sample.forEach((s, i) => {
    const bp = (byParty[s.party] ??= { n: 0, flips: 0, flipDetail: [] });
    bp.n++;
    if (norm(origF[i]) !== norm(blindF[i])) {
      bp.flips++; totalFlips++;
      if (bp.flipDetail.length < 4) bp.flipDetail.push(`${origF[i]} → ${blindF[i]}`);
    }
  });
  console.log("══════ SYMMETRIE-AUDIT ERGEBNIS ══════");
  console.log(`Gesamt-Flip-Rate (Klassifikation ändert sich, wenn Partei geblindet): ${totalFlips}/${sample.length} (${(totalFlips / sample.length * 100).toFixed(0)}%)`);
  console.log(`\nPro Fraktion (hohe/ungleiche Rate = Partei-Cue-Bias):`);
  for (const [p, d] of Object.entries(byParty)) {
    console.log(`  ${p.split(" ")[0].padEnd(8)} ${d.flips}/${d.n} (${(d.flips / d.n * 100).toFixed(0)}%)  z.B.: ${d.flipDetail.join(" · ") || "—"}`);
  }
  console.log(`\nInterpretation: niedrige + GLEICHE Flip-Rate über Parteien = fair (Inhalt zählt, nicht Partei).`);
  console.log(`Stark ungleiche Rate (z.B. AfD viel höher) = Frame-Capture-Bias.`);
}
main().then(() => db.close()).catch(e => { console.error(e); process.exit(1); });
