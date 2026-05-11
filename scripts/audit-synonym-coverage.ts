/**
 * C — Coverage-Audit für Synonym-Cluster
 *
 * Scannt alle 9.913 Reden-Zusammenfassungen, extrahiert kapitalisierte Wörter (≥4 Zeichen),
 * filtert Stopwords + Wörter, die schon in einem Cluster-Term enthalten sind, und gibt
 * die häufigsten unabgedeckten Begriffe aus.
 *
 * Heuristik: Deutsche Substantive werden groß geschrieben. Im Originaltext ist das ein
 * sauberer Filter, in den LLM-Zusammenfassungen leicht verrauscht (Satzanfänge), aber
 * tolerierbar.
 *
 * Run: npx tsx scripts/audit-synonym-coverage.ts [--top 50]
 */
import Database from "better-sqlite3";
import path from "path";
import { SYNONYM_CLUSTERS } from "../src/lib/synonyms";

const args = process.argv.slice(2);
const TOP_N = (() => {
  const i = args.indexOf("--top");
  return i >= 0 ? Number(args[i + 1]) : 80;
})();

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

// 1. Alle Cluster-Terms in eine Lowercase-Set legen
const clusterTermSet = new Set<string>();
for (const c of SYNONYM_CLUSTERS) {
  for (const t of c.terms) clusterTermSet.add(t.toLowerCase());
}

// 2. Stopword-Liste: Funktionswörter + Satzanfangs-Substantive + politik-generische Begriffe
const STOPWORDS = new Set<string>([
  // Funktionswörter
  "aber", "auch", "wenn", "dann", "dort", "auch", "noch", "schon", "sehr", "mehr", "viele",
  "vieler", "vielen", "alle", "allen", "aller", "einige", "einigen", "andere", "anderer",
  "anderen", "also", "darüber", "dafür", "dagegen", "dadurch", "damit", "darum", "deshalb",
  "deswegen", "weiter", "weiteren", "weiterer", "müssen", "können", "sollen", "wollen", "dürfen",
  "haben", "habe", "hat", "hatte", "hatten", "sein", "ist", "sind", "war", "waren", "werden",
  "wird", "wurde", "wurden", "sowie", "etwa", "schon",
  // Generische Politik-Substantive (kein eigenständiges Thema)
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "eines", "einem",
  "bund", "länder", "land", "bundes", "deutschland", "deutschen", "deutsche", "bundestag",
  "bundesregierung", "regierung", "regierungen", "opposition", "ministerin", "minister",
  "fraktion", "fraktionen", "antrag", "antrags", "anträge", "anträgen", "gesetz", "gesetze",
  "gesetzes", "gesetzentwurf", "gesetzentwürfe", "drucksache", "drucksachen", "ausschuss",
  "ausschüsse", "ausschusses", "sitzung", "sitzungen", "debatte", "debatten", "rede",
  "reden", "rednerin", "redner", "abstimmung", "abstimmungen", "frage", "fragen", "antwort",
  "antworten", "diskussion", "kollege", "kollegen", "kollegin", "kolleginnen", "herr", "frau",
  "präsident", "präsidentin", "abgeordnete", "abgeordnetenhaus", "punkt", "tagesordnung",
  "tagesordnungspunkt", "beratung", "beratungen", "lesung", "lesungen", "ausführung",
  "ausführungen", "stellungnahme", "stellungnahmen", "haushaltsplan", "haushaltsausschuss",
  "berlin", "deutschland", "deutscher", "deutsches",
  // Modalwörter / Floskeln
  "ziel", "ziele", "weg", "wege", "punkt", "stelle", "stellen", "problem", "probleme",
  "lösung", "lösungen", "ansatz", "ansätze", "thema", "themen", "frage", "fragen", "rolle",
  "rollen", "fall", "fälle", "art", "arten", "möglichkeit", "möglichkeiten", "grund",
  "gründe", "voraussetzung", "voraussetzungen", "anteil", "anteile", "rahmen", "kontext",
  "ebene", "ebenen", "sicht", "sichtweise", "bereich", "bereiche", "bereichen", "rahmenbedingungen",
  "form", "formen", "art", "arten", "wert", "werte", "bedeutung", "bedeutungen", "anlass",
  "anlässe", "vorhaben", "umsetzung", "umsetzungen", "diskurs", "diskurse", "begründung",
  "begründungen",
  // Politik-Generika ohne Themen-Aussagekraft
  "politik", "politiker", "politikerin", "demokratie", "rechte", "recht", "rechts", "linke",
  "links", "mehrheit", "minderheit", "wähler", "wählerinnen", "bürger", "bürgerinnen",
  "deutsche", "deutschen", "europäische", "europäisch", "europa",
  // Häufige Verben/Modale die kapitalisiert am Satzanfang stehen
  "wenn", "soll", "muss", "kann", "darf", "wir", "ihr", "sie", "ich", "man", "diese",
  "dieser", "dieses", "diesen", "diesem", "jetzt", "heute", "morgen", "gestern",
]);

// 3. Bulk-Fetch aller Zusammenfassungen
const rows = db
  .prepare(`SELECT zusammenfassung_2_saetze AS s FROM speech_analyses_v2 WHERE zusammenfassung_2_saetze IS NOT NULL`)
  .all() as { s: string }[];

console.log(`Scanne ${rows.length} Reden-Zusammenfassungen…`);

// 4. Tokenize & count
// Pattern: Unicode-Wort, beginnt mit Großbuchstabe (inkl. Ö Ü Ä), Länge >= 4
const wordRe = /\b([A-ZÄÖÜ][a-zäöüß][a-zäöüß-]{2,})\b/g;
const counts = new Map<string, number>();

for (const r of rows) {
  if (!r.s) continue;
  for (const m of r.s.matchAll(wordRe)) {
    const word = m[1].toLowerCase();
    if (STOPWORDS.has(word)) continue;
    // Skip wenn das Wort selbst oder ein Substring eines Cluster-Terms ist
    let inCluster = false;
    if (clusterTermSet.has(word)) inCluster = true;
    else {
      // Reverse-Check: enthält das Wort einen Cluster-Term als Substring?
      // (vermeidet "Klimaschutz" als unabgedeckt zu melden, wenn "klima" im Cluster ist)
      for (const ct of clusterTermSet) {
        if (ct.length < 4) continue;
        if (word.includes(ct)) {
          inCluster = true;
          break;
        }
      }
    }
    if (inCluster) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
}

// 5. Sortiere + Top N
const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

console.log(`\n=== Top ${TOP_N} häufigste Begriffe (kapitalisiert) ohne Cluster-Abdeckung ===\n`);
console.log("Begriff                         | Vorkommen");
console.log("---".repeat(20));
for (const [word, n] of sorted.slice(0, TOP_N)) {
  console.log(`${word.padEnd(33)}| ${n}`);
}

console.log(`\nGesamt einzigartige unabgedeckte Begriffe: ${counts.size}`);
console.log(`Cluster-Terms insgesamt: ${clusterTermSet.size}`);
