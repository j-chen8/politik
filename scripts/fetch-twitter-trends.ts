/**
 * Ingestion B — Twitter/X-Trends Deutschland (Social-Spalte der Salienz-Pipeline).
 * Zwei Quellen (trends24.in/germany + getdaytrends.com/germany), Schnittmenge =
 * Cross-Source-Bestätigung (auf_beiden=1). LLM-Filter (Mistral small, Free-Tier €0):
 * pro Begriff politisch (0/1) + genau ein Themenfeld (oder null). Schreibt
 * twitter_trends_daily idempotent (DELETE run_date + INSERT). €0.
 *
 * Lauf:  npx tsx scripts/fetch-twitter-trends.ts                 # holt + klassifiziert + schreibt
 *        npx tsx scripts/fetch-twitter-trends.ts --date=2026-06-27
 *        npx tsx scripts/fetch-twitter-trends.ts --dry           # nur parsen/klassifizieren, kein DB-Write
 *        npx tsx scripts/fetch-twitter-trends.ts --no-llm        # ohne Klassifikation (alles politisch=0)
 *
 * Consumer: rank-news-salienz.ts liest WHERE run_date=? AND politisch=1 AND themenfeld
 * IS NOT NULL — beide Spalten MÜSSEN daher korrekt gesetzt sein, sonst zählt der Begriff
 * nicht ins Ranking. themenfeld muss wortwörtlich aus den 25 THEMENFELDER[].feld stammen.
 */
import Database from "better-sqlite3";
import path from "path";
import * as cheerio from "cheerio";
import { THEMENFELDER } from "../src/lib/themenfeld-slug";
import { ensureSalienzSchema } from "./_lib/salienz-schema";
import { MistralPool } from "./_lib/mistral";

// Env analog zum Orchestrator laden, damit MISTRAL_API_KEY* auch bei Direktstart greifen.
try { process.loadEnvFile(path.join(process.cwd(), ".env")); } catch { /* optional */ }

const DRY = process.argv.includes("--dry");
const NO_LLM = process.argv.includes("--no-llm");
const RUN_DATE = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1] ?? new Date().toISOString().slice(0, 10);
const TOP_N = 30; // pro Quelle die obersten N Trends betrachten

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const FELDER = THEMENFELDER.map((t) => t.feld);
const FELD_SET = new Set(FELDER);

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");
ensureSalienzSchema(db);

type Trend = { term: string; rang: number };

/** Normalisierung NUR für den Quellen-Vergleich: führendes # weg, lowercase, trim. */
function norm(term: string): string {
  return term.replace(/^#+/, "").trim().toLowerCase();
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/**
 * trends24.in/germany — 24 stündliche Snapshots als <ol class="trend-card__list">.
 * NUR der erste (=aktuellste) Block. Rang = li-Reihenfolge (kein Rang im Markup).
 */
function parseTrends24(html: string): Trend[] {
  const $ = cheerio.load(html);
  const newest = $("ol.trend-card__list").first();
  const out: Trend[] = [];
  newest.find("li").each((i, li) => {
    if (out.length >= TOP_N) return;
    const term = $(li).find("span.trend-name a").first().text().trim();
    if (term) out.push({ term, rang: out.length + 1 });
  });
  return out;
}

/**
 * getdaytrends.com/germany — sichtbare + ausgeklappte Trend-Tabelle
 * (class enthält "ranking trends wider"). Rang aus th.pos, Begriff aus td.main a.
 * Hashtag-Anchors haben KEIN class="string" → auf td.main a gehen, nicht a.string.
 */
function parseGetdaytrends(html: string): Trend[] {
  const $ = cheerio.load(html);
  const byRang = new Map<number, string>();
  $('table[class*="ranking trends wider"] tr').each((_, tr) => {
    const rang = parseInt($(tr).find("th.pos").first().text().trim(), 10);
    const term = $(tr).find("td.main a").first().text().trim();
    if (!term || !Number.isFinite(rang)) return;
    if (!byRang.has(rang)) byRang.set(rang, term); // dedup bei Tabellen-Überlappung
  });
  return [...byRang.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, TOP_N)
    .map(([rang, term]) => ({ term, rang }));
}

/** Klassifikation: ganze Begriffsliste in EINEM gebündelten Call, bounded choice. */
async function classify(begriffe: string[]): Promise<Map<string, { politisch: number; themenfeld: string | null }>> {
  const result = new Map<string, { politisch: number; themenfeld: string | null }>();
  for (const b of begriffe) result.set(b, { politisch: 0, themenfeld: null }); // Default: unpolitisch
  if (NO_LLM || begriffe.length === 0) return result;

  const system = `Du klassifizierst Twitter/X-Trending-Begriffe aus Deutschland für ein politisches Daten-Portal.
Für JEDEN Begriff entscheide:
- "politisch": 1 NUR wenn der Begriff klar zu Politik, Staat, Gesetzgebung, Parteien, Verwaltung, Außen-/Innenpolitik, Wirtschaftspolitik o.Ä. gehört. Sport, Musik, TV-Shows, Promis, Wetter, Spiele, Fußball-Kürzel (#NORFRA), Hashtags zu Events ohne Politikbezug = 0.
- "themenfeld": Wenn politisch=1, ordne GENAU EIN Feld aus der vorgegebenen Liste zu (wortwörtlich). Wenn politisch=0 ODER unklar: null.
Ordne KONSERVATIV zu: im Zweifel politisch=0 und themenfeld=null. Erfinde keine Felder.
Antworte AUSSCHLIESSLICH als JSON-Array, gleiche Reihenfolge und Anzahl wie die Eingabe:
[{"begriff":"<exakt wie Eingabe>","politisch":0|1,"themenfeld":"<exakt aus Liste oder null>"}]`;
  const user = `THEMENFELDER (erlaubte Werte für themenfeld):\n${FELDER.map((f) => `- ${f}`).join("\n")}\n\nBEGRIFFE:\n${begriffe.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

  try {
    const pool = new MistralPool(300);
    const raw = await pool.chat({ model: "mistral-small-2506", system, user, temperature: 0, maxTokens: 4000 });
    const clean = raw.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
    const arr = clean.match(/\[[\s\S]*\]/); // toleriert führende/abschließende Prosa um das Array
    const parsed = JSON.parse(arr ? arr[0] : clean) as { begriff?: string; politisch?: unknown; themenfeld?: unknown }[];
    const byNorm = new Map(begriffe.map((b) => [norm(b), b]));
    for (const row of parsed ?? []) {
      const key = byNorm.get(norm(String(row.begriff ?? "")));
      if (!key) continue;
      const politischRaw = Number(row.politisch) === 1 ? 1 : 0;
      const feld = typeof row.themenfeld === "string" ? row.themenfeld.trim() : "";
      // Strikt: nur wortwörtliche Felder zulassen, sonst null. politisch fest an gültiges
      // Feld gekoppelt — der Consumer braucht ohnehin beides (politisch=1 AND themenfeld).
      const themenfeld = politischRaw === 1 && FELD_SET.has(feld) ? feld : null;
      result.set(key, { politisch: themenfeld ? 1 : 0, themenfeld });
    }
  } catch (e: unknown) {
    console.error(`✗ Klassifikation fehlgeschlagen (alle politisch=0): ${(e as Error).message}`);
  }
  return result;
}

async function main() {
  // 1) Quellen holen — jede gekapselt, eine tote Quelle killt den Lauf nicht.
  let t24: Trend[] = [];
  let gdt: Trend[] = [];
  try {
    t24 = parseTrends24(await fetchHtml("https://trends24.in/germany/"));
    console.log(`✓ trends24      ${t24.length} Trends`);
  } catch (e: unknown) {
    console.error(`✗ trends24      ${(e as Error).message}`);
  }
  try {
    gdt = parseGetdaytrends(await fetchHtml("https://getdaytrends.com/germany/"));
    console.log(`✓ getdaytrends  ${gdt.length} Trends`);
  } catch (e: unknown) {
    console.error(`✗ getdaytrends  ${(e as Error).message}`);
  }

  if (t24.length === 0 && gdt.length === 0) {
    console.error("Beide Quellen nicht erreichbar — kein Write, Lauf beendet.");
    return;
  }

  // 2) Union bilden; auf_beiden = Begriff in BEIDEN Quellen (normalisiert); rang = bester.
  const normsT24 = new Set(t24.map((t) => norm(t.term)));
  const normsGdt = new Set(gdt.map((t) => norm(t.term)));
  type Agg = { term: string; rang: number; auf_beiden: number };
  const union = new Map<string, Agg>();
  for (const { term, rang } of [...t24, ...gdt]) {
    const key = norm(term);
    const aufBeiden = normsT24.has(key) && normsGdt.has(key) ? 1 : 0;
    const prev = union.get(key);
    if (!prev) union.set(key, { term, rang, auf_beiden: aufBeiden });
    else {
      prev.auf_beiden = aufBeiden;
      if (rang < prev.rang) { prev.rang = rang; prev.term = term; } // Anzeige-Begriff = besser platzierter
    }
  }
  const aggs = [...union.values()].sort((a, b) => a.rang - b.rang);

  // 3) Klassifikation (ein gebündelter Call).
  const klass = await classify(aggs.map((a) => a.term));

  // 4) Idempotenter Write: DELETE run_date, dann INSERT.
  const rows = aggs.map((a) => {
    const k = klass.get(a.term) ?? { politisch: 0, themenfeld: null };
    return { run_date: RUN_DATE, begriff: a.term, rang: a.rang, auf_beiden: a.auf_beiden, politisch: k.politisch, themenfeld: k.themenfeld };
  });

  if (!DRY) {
    const tx = db.transaction(() => {
      db.prepare(`DELETE FROM twitter_trends_daily WHERE run_date=?`).run(RUN_DATE);
      const ins = db.prepare(`INSERT INTO twitter_trends_daily (run_date, begriff, rang, auf_beiden, politisch, themenfeld)
        VALUES (@run_date,@begriff,@rang,@auf_beiden,@politisch,@themenfeld)`);
      for (const r of rows) ins.run(r);
    });
    tx();
  }

  // 5) Konsolen-Zusammenfassung.
  const politisch = rows.filter((r) => r.politisch === 1);
  const beide = rows.filter((r) => r.auf_beiden === 1);
  console.log(`${DRY ? "[dry] " : ""}run_date=${RUN_DATE}: ${rows.length} Begriffe · ${politisch.length} politisch · ${beide.length} auf_beiden`);
  console.log("Top-5 politische:");
  for (const r of politisch.filter((p) => p.themenfeld).slice(0, 5))
    console.log(`  #${r.rang} ${r.begriff} → ${r.themenfeld}${r.auf_beiden ? " [beide]" : ""}`);
}

main();
