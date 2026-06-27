/**
 * Ranking v1 — News-Cross-Outlet (Rückgrat) + Twitter (Social) → EIN Tagesranking.
 * Review-Fixes: (1) Clustering über INTEGER item_ids statt Links; (2) NaN-Guard in der
 * Normierung; (3) rang nach ROHEM outlet_count, score nur Kontext; Floor=2.
 * Lauf:  npx tsx scripts/rank-news-salienz.ts [--no-llm] [--date=YYYY-MM-DD]
 */
import Database from "better-sqlite3";
import path from "path";
import { THEMENFELDER, feldToSlug } from "../src/lib/themenfeld-slug";
import { ensureSalienzSchema } from "./_lib/salienz-schema";
import { MistralPool } from "./_lib/mistral";

const NO_LLM = process.argv.includes("--no-llm");
// Clustering-Modell: Large (Free-Tier, €0) klustert Story-Cluster spürbar kohärenter
// als Small (A/B 27.06.: Rente als volle 7-Outlet-Story statt zersplittert, weniger
// fachfremde Einstreuungen). Override per --model=… für Vergleichsläufe.
const CLUSTER_MODEL = process.argv.find((a) => a.startsWith("--model="))?.split("=")[1] ?? "mistral-large-latest";
const RUN_DATE = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1] ?? new Date().toISOString().slice(0, 10);
const FLOOR = 2; // Story zählt nur als "markant" ab >=2 distinkten Outlets
const GESETZ_BOOST = 1.5; // Substanz-Boost: Gesetz/Reform-Feld zählt fürs Ranking wie +1,5 Outlets
                          // (modest — überholt vergleichbar laute Themen, begräbt aber keine Riesenstory)

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");
ensureSalienzSchema(db);

const FELDER = THEMENFELDER.map((t) => t.feld);
const FELD_SET = new Set(FELDER);

const items = db.prepare(`
  SELECT id, outlet, title, link FROM news_items
  WHERE COALESCE(pubdate, fetched_at) >= datetime('now','-24 hours')
  ORDER BY id
`).all() as { id: number; outlet: string; title: string; link: string }[];

type Cluster = { leitthema: string; themenfeld: string; gesetzbezug: boolean; itemIds: number[] };

// Keyword-Heuristik für „geht es um Gesetz/Reform/parl. Verfahren?" (Fallback + Backstop).
const GESETZ_RE = /\b(gesetz|gesetzentwurf|reform|novelle|verordnung|beschluss|beschließ|verabschied|ratifizier|grundgesetz|richtlinie)\w*|bundestag (beschließt|stimmt|debattiert|verabschiedet)|im bundestag|abstimmung/i;

async function clusterLlm(): Promise<Cluster[] | null> {
  if (NO_LLM || items.length === 0) return null;
  const liste = items.map((it) => `${it.id}\t[${it.outlet}] ${it.title}`).join("\n");
  const system = `Du bündelst Nachrichten-Schlagzeilen zu Story-Clustern. Gleiche Story = gleiches Ereignis, auch bei abweichendem Wortlaut.
WICHTIG: Gib NUR Cluster zurück, deren Schlagzeilen zu MINDESTENS ZWEI VERSCHIEDENEN Outlets gehören (Cross-Outlet-Stories). Einzelmeldungen (nur ein Outlet) komplett WEGLASSEN. Nicht-politische/Service-Meldungen WEGLASSEN.
Ordne jedem Cluster GENAU EIN Politikfeld aus der Liste zu (wortwörtlich).
Setze "gesetzbezug": true NUR bei einem konkreten DEUTSCHEN Gesetzgebungs-/Parlamentsverfahren: Gesetz, Gesetzentwurf, Reform/Novelle, Verordnung, Bundestags-/Bundesrats-Beschluss oder -Abstimmung, Haushaltsausschuss-Beschluss, Bundeswehr-Mandat. NICHT bei: ausländischen Ereignissen/Staaten, Gerichtsurteilen/Strafprozessen, bloßer politischer Debatte/Forderung OHNE konkretes Gesetzesvorhaben, Wahlkampf, reinen Service-/Wetter-Meldungen. Im Zweifel false.
Antworte AUSSCHLIESSLICH als JSON: {"cluster":[{"leitthema":"…","themenfeld":"<exakt aus Liste>","gesetzbezug":true,"item_ids":[<zahlen>]}]}.
Nutze NUR die vorgegebenen item-IDs.`;
  const user = `POLITIKFELDER:\n${FELDER.map((f) => `- ${f}`).join("\n")}\n\nSCHLAGZEILEN (id<TAB>[outlet] titel):\n${liste}`;
  try {
    const pool = new MistralPool(300);
    const raw = await pool.chat({ model: CLUSTER_MODEL, system, user, temperature: 0, maxTokens: 8000 });
    const clean = raw.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(clean) as { cluster?: { leitthema?: string; themenfeld?: string; gesetzbezug?: boolean; item_ids?: unknown[] }[] };
    const out: Cluster[] = [];
    for (const c of parsed.cluster ?? []) {
      const ids = (c.item_ids ?? []).map(Number).filter((n) => Number.isFinite(n));
      if (!c.themenfeld || !FELD_SET.has(c.themenfeld) || ids.length === 0) continue;
      const lt = String(c.leitthema ?? "").slice(0, 200);
      out.push({ leitthema: lt, themenfeld: c.themenfeld, gesetzbezug: !!c.gesetzbezug || GESETZ_RE.test(lt), itemIds: ids });
    }
    return out.length ? out : null;
  } catch (e: unknown) {
    console.error("LLM-Clustering fehlgeschlagen, Fallback Jaccard:", (e as Error).message);
    return null;
  }
}

const STOP = new Set("der die das und in im für von mit zu auf ist am den des dem ein eine nach bei aus über als auch wie wird werden vor neue gegen mehr".split(" "));
function tokens(s: string): Set<string> {
  return new Set(s.toLowerCase().normalize("NFC").replace(/[^a-zäöüß0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter; return uni ? inter / uni : 0;
}
function clusterFallback(): Cluster[] {
  const toks = items.map((it) => tokens(it.title));
  const used = new Array(items.length).fill(false);
  const clusters: Cluster[] = [];
  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue; used[i] = true;
    const member = [items[i].id];
    for (let j = i + 1; j < items.length; j++) {
      if (!used[j] && jaccard(toks[i], toks[j]) > 0.4) { used[j] = true; member.push(items[j].id); }
    }
    // ohne LLM kein sicheres Feld → Sammelfeld; v2 ergänzt deterministische Keyword-Sets
    const lt = items[i].title.slice(0, 200);
    clusters.push({ leitthema: lt, themenfeld: "Politisches Leben, Parteien", gesetzbezug: GESETZ_RE.test(lt), itemIds: member });
  }
  return clusters;
}

const normalize = (x: number, min: number, max: number) => (max === min ? 0 : (x - min) / (max - min)); // NaN-GUARD

// --- Kohärenz-Wächter (deterministisch, €0) ---------------------------------
// LLM/Jaccard stopfen gelegentlich fachfremde Schlagzeilen in große Cluster
// (beobachtet 27.06.: Rentenreform/Magdeburg im "Krim"-Cluster, Ukraine/Gaza/Hormus
// im "Hitzewelle"-Cluster) → outlet_count künstlich aufgebläht → falsches Ranking.
// Fix: pro Cluster nur Items behalten, deren Titel trigramm-/token-ähnlich zum
// Leitthema ODER zu >=1 anderem Item sind. Dieser Fehlertyp ist modellunabhängig,
// der Wächter bleibt also auch bei stärkerem Clustering-Modell sinnvoll.
function trigrams(w: string): Set<string> {
  const g = new Set<string>(); const p = `  ${w} `;
  for (let i = 0; i < p.length - 2; i++) g.add(p.slice(i, i + 3));
  return g;
}
function triJac(a: Set<string>, b: Set<string>): number {
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const uni = a.size + b.size - inter; return uni ? inter / uni : 0;
}
const COH = 0.5; // Titel kohärent ab dieser besten Token-Trigramm-Ähnlichkeit
function titleSim(a: Set<string>, b: Set<string>): number {
  for (const x of a) if (b.has(x)) return 1; // gemeinsames exaktes Token
  let best = 0;
  for (const x of a) { const gx = trigrams(x); for (const y of b) { const s = triJac(gx, trigrams(y)); if (s > best) best = s; } }
  return best;
}
type NewsItem = { id: number; outlet: string; title: string; link: string };
function pruneIncoherent(c: Cluster, byId: Map<number, NewsItem>): Cluster {
  if (c.itemIds.length <= 2) return c; // kleine Cluster nicht antasten
  const its = c.itemIds.map((id) => byId.get(id)).filter(Boolean) as NewsItem[];
  const toks = its.map((it) => tokens(it.title));
  const ltTok = tokens(c.leitthema);
  const keep: number[] = [];
  its.forEach((it, i) => {
    let best = titleSim(toks[i], ltTok);
    for (let j = 0; j < its.length && best < COH; j++) if (j !== i) best = Math.max(best, titleSim(toks[i], toks[j]));
    if (best >= COH) keep.push(it.id);
  });
  return keep.length ? { ...c, itemIds: keep } : c; // nie alles verwerfen
}

async function main() {
  const byId = new Map<number, NewsItem>(items.map((it) => [it.id, it]));
  const rawClusters = (await clusterLlm()) ?? clusterFallback();
  const clusters = rawClusters.map((c) => pruneIncoherent(c, byId));
  const pruned = rawClusters.reduce((s, c, i) => s + (c.itemIds.length - clusters[i].itemIds.length), 0);
  if (pruned > 0) console.log(`Kohärenz-Wächter: ${pruned} fachfremde Items aus Clustern entfernt`);

  type Mat = { clusterId: number; leitthema: string; feld: string; gesetzbezug: boolean; outletCount: number; itemCount: number; outlets: string[]; titles: { outlet: string; title: string; link: string }[]; itemIds: number[] };
  const mats: Mat[] = clusters.map((c, idx) => {
    const its = c.itemIds.map((id) => byId.get(id)).filter(Boolean) as typeof items;
    const outlets = [...new Set(its.map((it) => it.outlet))];
    return { clusterId: idx + 1, leitthema: c.leitthema, feld: c.themenfeld, gesetzbezug: c.gesetzbezug, outletCount: outlets.length, itemCount: its.length, outlets, titles: its.map((it) => ({ outlet: it.outlet, title: it.title, link: it.link })), itemIds: its.map((it) => it.id) };
  }).filter((m) => m.itemCount > 0);

  // Rohsignale je Feld
  const twRows = db.prepare(`SELECT themenfeld, begriff, auf_beiden FROM twitter_trends_daily WHERE run_date=? AND politisch=1 AND themenfeld IS NOT NULL`).all(RUN_DATE) as { themenfeld: string; begriff: string; auf_beiden: number }[];
  const newsRaw = new Map<string, number>(), maxOutlet = new Map<string, number>(), clusterCnt = new Map<string, number>(), twRaw = new Map<string, number>(), twBegr = new Map<string, string[]>(), feldGesetz = new Map<string, boolean>();
  for (const f of FELDER) { newsRaw.set(f, 0); maxOutlet.set(f, 0); clusterCnt.set(f, 0); twRaw.set(f, 0); twBegr.set(f, []); feldGesetz.set(f, false); }
  for (const m of mats) {
    const cur = newsRaw.get(m.feld)!;
    newsRaw.set(m.feld, Math.max(cur, m.outletCount) + (cur > 0 ? 0.25 : 0)); // dominanteste Story voll, weitere +0.25
    maxOutlet.set(m.feld, Math.max(maxOutlet.get(m.feld)!, m.outletCount));
    clusterCnt.set(m.feld, clusterCnt.get(m.feld)! + 1);
    if (m.gesetzbezug) feldGesetz.set(m.feld, true); // Feld trägt mind. ein Gesetz/Reform-Cluster
  }
  for (const t of twRows) { if (!FELD_SET.has(t.themenfeld)) continue; twRaw.set(t.themenfeld, twRaw.get(t.themenfeld)! + (t.auf_beiden ? 2 : 1)); twBegr.get(t.themenfeld)!.push(t.begriff); }

  const nVals = [...newsRaw.values()], tVals = [...twRaw.values()];
  const nMin = Math.min(...nVals), nMax = Math.max(...nVals), tMin = Math.min(...tVals), tMax = Math.max(...tVals);

  const ranked = FELDER.map((feld) => {
    const sNews = normalize(newsRaw.get(feld)!, nMin, nMax);
    const sTw = normalize(twRaw.get(feld)!, tMin, tMax);
    const gb = feldGesetz.get(feld)!;
    const oc = maxOutlet.get(feld)!;
    // Substanz-Boost: legislative Felder ranken wie +GESETZ_BOOST Outlets (nur wenn überhaupt sichtbar, oc>0)
    const rankKey = oc + (gb && oc > 0 ? GESETZ_BOOST : 0);
    return { feld, slug: feldToSlug(feld) ?? "", outletCount: oc, clusterCnt: clusterCnt.get(feld)!, gesetzbezug: gb, rankKey, sNews, sTw, score: 0.7 * sNews + 0.3 * sTw, begr: twBegr.get(feld)! };
  }).sort((a, b) => b.rankKey - a.rankKey || b.outletCount - a.outletCount || b.sTw - a.sTw || b.clusterCnt - a.clusterCnt); // Salienz + Gesetz/Reform-Boost

  if ((ranked[0]?.outletCount ?? 0) < FLOOR) console.warn(`⚠ ${RUN_DATE}: keine Story mit >=${FLOOR} Outlets — Picker zeigt Banner.`);

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM salienz_themen WHERE run_date=?`).run(RUN_DATE);
    db.prepare(`DELETE FROM news_cluster WHERE run_date=?`).run(RUN_DATE);
    db.prepare(`DELETE FROM news_cluster_items WHERE run_date=?`).run(RUN_DATE);
    const insCl = db.prepare(`INSERT INTO news_cluster (run_date, cluster_id, leitthema, themenfeld, outlet_count, item_count, outlets_json, titles_json, gesetzbezug) VALUES (?,?,?,?,?,?,?,?,?)`);
    const insNci = db.prepare(`INSERT OR IGNORE INTO news_cluster_items (run_date, cluster_id, news_item_id) VALUES (?,?,?)`);
    for (const m of mats) {
      insCl.run(RUN_DATE, m.clusterId, m.leitthema, m.feld, m.outletCount, m.itemCount, JSON.stringify(m.outlets), JSON.stringify(m.titles), m.gesetzbezug ? 1 : 0);
      for (const id of m.itemIds) insNci.run(RUN_DATE, m.clusterId, id);
    }
    const insS = db.prepare(`INSERT INTO salienz_themen (run_date, themenfeld, slug, rang, news_outlet_count, news_cluster_count, s_news, s_twitter, score, twitter_begriffe, top_cluster_ids, top_titles, gesetzbezug) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    ranked.forEach((r, i) => {
      const fm = mats.filter((m) => m.feld === r.feld).sort((a, b) => b.outletCount - a.outletCount);
      insS.run(RUN_DATE, r.feld, r.slug, i + 1, r.outletCount, r.clusterCnt, r.sNews, r.sTw, r.score, JSON.stringify(r.begr), JSON.stringify(fm.map((m) => m.clusterId)), JSON.stringify(fm.flatMap((m) => m.titles).slice(0, 6)), r.gesetzbezug ? 1 : 0);
    });
  });
  tx();
  console.log(`${RUN_DATE}: ${mats.length} Cluster · Top: ${ranked.slice(0, 5).map((r) => `${r.feld}(${r.outletCount}${r.gesetzbezug ? "⚖" : ""})`).join(", ")}`);
}
main();
