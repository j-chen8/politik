/**
 * fix-media-moderator-naming.ts
 *
 * Normalisiert generische Moderator-Referenzen in den gespeicherten Medien-Analysen
 * auf den echten Host-Namen (aus _meta.host). Reine Referenz-Auflösung — der Moderator
 * IST in den Metadaten benannt; ändert keine Aussagen/Zitate.
 *
 * Ersetzt (Artikel-Formen, Singular):  der/Der/dem/den Moderator · die/Die/der Moderatorin
 *   → Host-Name. (?!-) schützt Komposita ("Moderator-Frage" bleibt).
 * Lässt in Ruhe: Plural "die Moderatoren", Komposita "Moderator-X", artikelloses "Moderator".
 *
 * Behebt nebenbei den Gender-Fehler (z.B. Caren Miosga 45× als "der Moderator").
 *
 * Usage: npx tsx scripts/fix-media-moderator-naming.ts [--write]
 *        ohne --write = Dry-Run (zeigt Zahlen + Stichproben)
 */
import fs from "fs";
import glob from "glob";

const WRITE = process.argv.includes("--write");
const files = glob.sync("data/media-analyses/*.json");

function makeReplacer(host: string) {
  // Reihenfolge: feminin/spezifisch zuerst, dann maskulin. (?!-) gegen Komposita.
  const patterns: RegExp[] = [
    /\b[Dd]ie Moderatorin\b(?!-)/g,
    /\b[Dd]er Moderatorin\b(?!-)/g,
    /\b[Dd]er Moderator\b(?!-)/g,
    /\b[Dd]em Moderator\b(?!-)/g,
    /\b[Dd]en Moderator\b(?!-)/g,
  ];
  return (s: string): [string, number] => {
    let count = 0;
    let out = s;
    for (const re of patterns) {
      out = out.replace(re, () => { count++; return host; });
    }
    return [out, count];
  };
}

// rekursiv alle String-Werte transformieren
function walk(node: any, replace: (s: string) => [string, number], stat: { n: number; samples: string[] }): any {
  if (typeof node === "string") {
    const [out, c] = replace(node);
    if (c > 0) {
      stat.n += c;
      if (stat.samples.length < 2 && out !== node) stat.samples.push(`  vorher: …${node.slice(0, 90)}…\n  nachher: …${out.slice(0, 90)}…`);
    }
    return out;
  }
  if (Array.isArray(node)) return node.map((x) => walk(x, replace, stat));
  if (node && typeof node === "object") {
    const o: any = {};
    for (const [k, v] of Object.entries(node)) o[k] = walk(v, replace, stat);
    return o;
  }
  return node;
}

let totalFiles = 0, totalReps = 0, skipped = 0;
const showcase: string[] = [];

for (const f of files) {
  const d = JSON.parse(fs.readFileSync(f, "utf-8"));
  const host: string | undefined = d?._meta?.host;
  if (!host) { skipped++; continue; }
  const stat = { n: 0, samples: [] as string[] };
  const newAnalysis = walk(d.analysis, makeReplacer(host), stat);
  if (stat.n > 0) {
    totalFiles++; totalReps += stat.n;
    if (showcase.length < 3 && stat.samples.length) showcase.push(`[${f.split("/").pop()}] host="${host}" — ${stat.n} Ersetzungen\n${stat.samples[0]}`);
    if (WRITE) {
      d.analysis = newAnalysis;
      fs.writeFileSync(f, JSON.stringify(d, null, 2));
    }
  }
}

console.log(`${WRITE ? "GESCHRIEBEN" : "DRY-RUN"}: ${totalReps} Ersetzungen in ${totalFiles} Dateien (${skipped} ohne host übersprungen)`);
console.log(`\nStichproben:\n${showcase.join("\n\n")}`);
if (!WRITE) console.log(`\n→ Mit --write anwenden.`);
