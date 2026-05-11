/**
 * A — Term-Audit für Synonym-Cluster
 *
 * Zählt pro Cluster-Term, wie viele Reden / Topics / Drucksachen / Votes
 * den Term enthalten. Findet tote Terms (0 Treffer) und disproportional starke.
 *
 * Run: npx tsx scripts/audit-synonym-terms.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { SYNONYM_CLUSTERS } from "../src/lib/synonyms";

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

// Unicode-aware LOWER: SQLite-Builtin LOWER() ist ASCII-only, daher matched %öpnv% kein ÖPNV.
db.function("lower_de", { deterministic: true }, (s: unknown) =>
  typeof s === "string" ? s.toLowerCase() : null
);

const countSpeeches = db.prepare(
  `SELECT COUNT(*) as n FROM speech_analyses_v2 WHERE lower_de(zusammenfassung_2_saetze) LIKE ?`
);
const countTopics = db.prepare(`SELECT COUNT(*) as n FROM plenar_topics WHERE lower_de(title) LIKE ?`);
const countDrucksachen = db.prepare(
  `SELECT COUNT(*) as n FROM activities WHERE lower_de(titel) LIKE ? AND drucksache_nr IS NOT NULL`
);
const countVotes = db.prepare(
  `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE lower_de(poll_label) LIKE ?`
);

interface TermStat {
  cluster: string;
  term: string;
  speeches: number;
  topics: number;
  drucksachen: number;
  votes: number;
  total: number;
}

const stats: TermStat[] = [];

for (const cluster of SYNONYM_CLUSTERS) {
  for (const term of cluster.terms) {
    const like = `%${term.toLowerCase()}%`;
    const speeches = (countSpeeches.get(like) as { n: number }).n;
    const topics = (countTopics.get(like) as { n: number }).n;
    const drucksachen = (countDrucksachen.get(like) as { n: number }).n;
    const votes = (countVotes.get(like) as { n: number }).n;
    stats.push({
      cluster: cluster.label,
      term,
      speeches,
      topics,
      drucksachen,
      votes,
      total: speeches + topics + drucksachen + votes,
    });
  }
}

// Sortiere innerhalb des Clusters nach total absteigend
const byCluster = new Map<string, TermStat[]>();
for (const s of stats) {
  if (!byCluster.has(s.cluster)) byCluster.set(s.cluster, []);
  byCluster.get(s.cluster)!.push(s);
}

console.log("\n=== Term-Audit pro Cluster ===\n");
console.log("Spalten: Term | Reden | TOPs | Drucks | Votes | Σ\n");

const deadTerms: TermStat[] = [];

for (const [cluster, terms] of byCluster) {
  terms.sort((a, b) => b.total - a.total);
  console.log(`\n## ${cluster}`);
  for (const t of terms) {
    const flag = t.total === 0 ? " ⚠ TOT" : t.total < 5 ? " ⚠ schwach" : "";
    console.log(
      `  ${t.term.padEnd(28)} ${String(t.speeches).padStart(5)} ${String(t.topics).padStart(4)} ${String(
        t.drucksachen
      ).padStart(5)} ${String(t.votes).padStart(4)}  Σ${String(t.total).padStart(5)}${flag}`
    );
    if (t.total === 0) deadTerms.push(t);
  }
}

console.log(`\n\n=== Zusammenfassung ===`);
console.log(`Cluster: ${SYNONYM_CLUSTERS.length}`);
console.log(`Terms insgesamt: ${stats.length}`);
console.log(`Tote Terms (0 Treffer): ${deadTerms.length}`);
if (deadTerms.length > 0) {
  console.log(`\nTote Terms im Detail:`);
  for (const t of deadTerms) console.log(`  ${t.cluster} / ${t.term}`);
}

const weakTerms = stats.filter((s) => s.total > 0 && s.total < 5);
console.log(`\nSchwache Terms (1-4 Treffer): ${weakTerms.length}`);
if (weakTerms.length > 0) {
  for (const t of weakTerms) console.log(`  ${t.cluster} / ${t.term}  Σ${t.total}`);
}
