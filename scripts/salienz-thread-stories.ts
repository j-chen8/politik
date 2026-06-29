/**
 * Ebene 2 — Story-Stränge über Tage. Verkettet markante Tages-Cluster (outlet_count>=2)
 * deterministisch zu fortlaufenden Stories ("Thema X seit N Tagen"). €0, kein LLM.
 *
 * Voll-Recompute je Lauf (≈ wenige hundert Cluster gesamt → trivial): liest die ganze
 * news_cluster-History in Datumsreihenfolge, ordnet jeden Cluster dem ähnlichsten
 * offenen Strang der letzten K Tage zu (weiche Token-Ähnlichkeit, Feld als Gate),
 * sonst neuer Strang. Schreibt news_cluster.thread_id + Tabelle salienz_story.
 *
 * Matching ist bewusst konservativ: ein einzelnes generisches Token (z.B. "deutschland")
 * verkettet NICHT — es braucht >=2 inhaltliche Treffer ODER hohe Token-Überlappung.
 *
 * Lauf:  npx tsx scripts/salienz-thread-stories.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { ensureSalienzSchema } from "./_lib/salienz-schema";
import { tokens, sharedTokens } from "./_lib/text-sim";

const K = 4;        // Tage Rückblick: ein pausierter Strang bleibt so lange anschlussfähig
const FLOOR = 2;    // nur Cross-Outlet-Cluster sind "markant" genug für einen Strang
const TH = 0.34;    // Mindest-Ähnlichkeit (Feld-Gate eingerechnet) für Anschluss

type Row = { run_date: string; cluster_id: number; themenfeld: string | null; leitthema: string; outlet_count: number; gesetzbezug: number };
type Thread = { id: string; field: string | null; toks: Set<string>; leitthema: string; dates: string[]; lastDate: string; peak: number; gesetz: number };

function daysBetween(a: string, b: string): number { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
/** Lückenlose Kalendertage am Ende der Strang-Historie (z.B. 26,28,29 → Streak 2). */
function streak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let s = 1;
  for (let i = sorted.length - 1; i > 0; i--) { if (daysBetween(sorted[i - 1], sorted[i]) === 1) s++; else break; }
  return s;
}

function main() {
  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.pragma("busy_timeout = 15000");
  ensureSalienzSchema(db);

  const rows = db.prepare(
    `SELECT run_date, cluster_id, themenfeld, leitthema, outlet_count, gesetzbezug
     FROM news_cluster WHERE outlet_count >= ? ORDER BY run_date, cluster_id`
  ).all(FLOOR) as Row[];

  const threads: Thread[] = [];
  const assign = new Map<string, string>(); // "run_date#cluster_id" -> thread_id

  for (const r of rows) {
    const tk = tokens(r.leitthema);
    let best: Thread | null = null, bestScore = 0;
    for (const t of threads) {
      if (t.dates.includes(r.run_date)) continue;          // ein Strang max. 1 Cluster/Tag
      if (daysBetween(t.lastDate, r.run_date) > K) continue; // zu alt → geschlossen
      const { total: shared, specific } = sharedTokens(tk, t.toks);
      // Anschluss-Substrat: EIN spezifisches (langes) Token reicht, sonst >=2 beliebige.
      if (specific < 1 && shared < 2) continue;
      const sim = shared / Math.max(1, Math.min(tk.size, t.toks.size));
      const score = sim * (t.field === r.themenfeld ? 1 : 0.7); // Feldwechsel dämpft, schließt nicht aus
      if (score > bestScore) { bestScore = score; best = t; }
    }
    if (best && bestScore >= TH) {
      best.dates.push(r.run_date); best.lastDate = r.run_date; best.leitthema = r.leitthema; // jüngster Titel repräsentiert
      for (const x of tk) best.toks.add(x);
      best.peak = Math.max(best.peak, r.outlet_count); best.gesetz = Math.max(best.gesetz, r.gesetzbezug);
      assign.set(`${r.run_date}#${r.cluster_id}`, best.id);
    } else {
      const id = `${r.run_date}#${r.cluster_id}`;
      threads.push({ id, field: r.themenfeld, toks: new Set(tk), leitthema: r.leitthema, dates: [r.run_date], lastDate: r.run_date, peak: r.outlet_count, gesetz: r.gesetzbezug });
      assign.set(id, id);
    }
  }

  const tx = db.transaction(() => {
    db.exec(`DELETE FROM salienz_story`);
    db.exec(`UPDATE news_cluster SET thread_id = NULL`);
    const upd = db.prepare(`UPDATE news_cluster SET thread_id = ? WHERE run_date = ? AND cluster_id = ?`);
    for (const [key, tid] of assign) { const [rd, cid] = key.split("#"); upd.run(tid, rd, Number(cid)); }
    const ins = db.prepare(`INSERT INTO salienz_story (thread_id, themenfeld, leitthema, first_date, last_date, day_count, streak_days, peak_outlets, gesetzbezug, dates_json) VALUES (?,?,?,?,?,?,?,?,?,?)`);
    for (const t of threads) {
      const ds = [...new Set(t.dates)].sort();
      ins.run(t.id, t.field, t.leitthema, ds[0], ds[ds.length - 1], ds.length, streak(ds), t.peak, t.gesetz, JSON.stringify(ds));
    }
  });
  tx();

  const multi = threads.filter((t) => new Set(t.dates).size > 1).sort((a, b) => b.dates.length - a.dates.length);
  console.log(`${rows.length} markante Cluster → ${threads.length} Stränge (${multi.length} mehrtägig)`);
  for (const t of multi.slice(0, 12)) console.log(`  ${new Set(t.dates).size}T (Streak ${streak(t.dates)}${t.gesetz ? " ⚖" : ""}): ${t.leitthema}`);
  db.close();
}
main();
