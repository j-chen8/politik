/**
 * Salienz — neutrale 1-Satz-Zusammenfassung je Cross-Outlet-Story (Mistral Free, €0).
 * Schreibt news_cluster.summary + leitet salienz_themen.summary vom Top-Cluster ab.
 * Lauf:  npx tsx scripts/salienz-cluster-summary.ts [--date=YYYY-MM-DD]
 */
import Database from "better-sqlite3";
import path from "path";
import { MistralPool, runPool } from "./_lib/mistral";
import { ensureSalienzSchema } from "./_lib/salienz-schema";

const RUN_DATE = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1] ?? new Date().toISOString().slice(0, 10);
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");
ensureSalienzSchema(db);

async function main() {
  const clusters = db
    .prepare(`SELECT cluster_id, leitthema, titles_json FROM news_cluster WHERE run_date=? AND outlet_count>=2 ORDER BY outlet_count DESC`)
    .all(RUN_DATE) as { cluster_id: number; leitthema: string; titles_json: string }[];
  if (!clusters.length) {
    console.log(`${RUN_DATE}: keine Cross-Outlet-Cluster zum Zusammenfassen.`);
    return;
  }

  const pool = new MistralPool(300);
  const updCl = db.prepare(`UPDATE news_cluster SET summary=? WHERE run_date=? AND cluster_id=?`);

  await runPool(clusters, Math.max(1, pool.size * 2), async (c) => {
    let titles: { outlet: string; title: string }[] = [];
    try { titles = JSON.parse(c.titles_json); } catch { /* ignore */ }
    const user = titles.map((t) => `- [${t.outlet}] ${t.title}`).join("\n") || c.leitthema;
    try {
      const sum = await pool.chat({
        model: "mistral-small-2506", // NUR free-small — nie large/medium (paid)
        system: "Fasse das politische Tagesthema neutral in EINEM kurzen Satz zusammen — nur Fakten, keine Wertung, kein Vorwort, keine Anführungszeichen.",
        user,
        maxTokens: 120,
        temperature: 0.2,
      });
      const clean = sum.replace(/^["„»]|["”«]$/g, "").trim();
      if (clean) updCl.run(clean, RUN_DATE, c.cluster_id);
    } catch (e: unknown) {
      console.error(`cluster ${c.cluster_id}:`, (e as Error).message);
    }
  });

  // Feld-Summary = Summary des dominantesten Clusters je Feld
  db.prepare(`
    UPDATE salienz_themen SET summary = (
      SELECT nc.summary FROM news_cluster nc
      WHERE nc.run_date = salienz_themen.run_date AND nc.themenfeld = salienz_themen.themenfeld
        AND nc.summary IS NOT NULL
      ORDER BY nc.outlet_count DESC LIMIT 1)
    WHERE run_date = ?
  `).run(RUN_DATE);

  console.log(`${RUN_DATE}: ${clusters.length} Cross-Outlet-Cluster zusammengefasst.`);
}
main();
