/**
 * Fraktions-Pressemitteilungen aller fünf Bundestagsfraktionen → fraktion_pm.
 * Erstquelle für „was die Fraktionen sagen" (Reaktions-Schicht am Aufmacher,
 * PM-Frequenz je Feld, später Sagt-Quelle). Alles €0, deterministisch, kein LLM.
 *
 * Quellen (Erkundung 08.07.2026, siehe [[project_salienz_pipeline]]):
 *   GRÜNE  RSS  gruene-bundestag.de/pressemitteilungen-rss-feed.xml (trägt ~2 Jahre!)
 *   SPD    RSS  spdfraktion.de/presse/pressemitteilungen/feed (rollierend 10)
 *          Backfill: HTML-Liste ?page=N (article.node-pressemitteilung, dd.mm.yyyy)
 *   LINKE  RSS  dielinkebt.de/presse/pressemitteilungen/feed.rss (Kategorien=Politikfeld!)
 *          Backfill: TYPO3-Liste …/news/seite-N/ (div.article, schema.org)
 *   AfD    WP-REST-API afdbundestag.de/wp-json/wp/v2/posts (offen, Volltext,
 *          Kategorien=Arbeitskreis+MdB; ?after= filtert serverseitig)
 *   CDU/CSU kein RSS → sitemap.xml (/presse/-URLs) + Detailseiten (h1, time, Volltext)
 *
 * Aufruf:  npx tsx scripts/fetch-fraktions-pm.ts            # nur Neues (Feeds/Sitemap-Diff)
 *          npx tsx scripts/fetch-fraktions-pm.ts --backfill # Historie ab LP21 (2025-03-25)
 *          … [--nur=spd|gruene|linke|afd|cdu]               # einzelne Quelle
 */
import Database from "better-sqlite3";
import * as cheerio from "cheerio";
import { ensureFraktionPmSchema } from "./_lib/fraktion-pm-schema";

const BACKFILL = process.argv.includes("--backfill");
const NUR = process.argv.find((a) => a.startsWith("--nur="))?.split("=")[1];
// Konstituierung des 21. Bundestags — ab hier ist der Fraktions-Vergleich fair,
// weil alle fünf Quellen die laufende Wahlperiode abdecken.
const CUTOFF = "2025-03-25";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; Politik-Radar/1.0)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const db = new Database("politik.db");
ensureFraktionPmSchema(db);
const ins = db.prepare(`
  INSERT OR IGNORE INTO fraktion_pm (fraktion, titel, link, datum, text, kategorien_json, quelle)
  VALUES (?,?,?,?,?,?,?)`);
const kennt = db.prepare(`SELECT 1 FROM fraktion_pm WHERE link = ?`);

const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&")
  .replace(/&quot;|&#822[01];/g, '"').replace(/&#0?39;|&apos;|&#821[67];/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#8211;/g, "–").replace(/&#8222;/g, "„").replace(/&#8220;/g, "“")
  .replace(/\s+/g, " ").trim();
const deDatum = (s: string) => { const m = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null; };
const isoDatum = (s?: string | null) => { if (!s) return null; const d = new Date(s); return isNaN(+d) ? null : d.toISOString().slice(0, 16); };

async function hole(url: string): Promise<string> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/** Generischer RSS-Parser (reicht für alle drei Feeds). */
function rssItems(xml: string): { titel: string; link: string; datum: string | null; text: string; kategorien: string[] }[] {
  const cdata = (s: string) => strip(s.replace(/<!\[CDATA\[|\]\]>/g, ""));
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => ({
    titel: cdata(/<title>([\s\S]*?)<\/title>/.exec(it)?.[1] ?? ""),
    link: strip(/<link>([\s\S]*?)<\/link>/.exec(it)?.[1] ?? ""),
    datum: isoDatum(/<pubDate>([\s\S]*?)<\/pubDate>/.exec(it)?.[1]),
    text: cdata(/<description>([\s\S]*?)<\/description>/.exec(it)?.[1] ?? ""),
    kategorien: [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/g)].map((m) => cdata(m[1])),
  })).filter((i) => i.titel && i.link);
}

// Link-Normalisierung als Dedupe-Anker: dieselbe PM erscheint sonst doppelt,
// weil z.B. der Linke-RSS www.dielinkebt.de nutzt, die Liste dielinkebt.de.
const normLink = (u: string) => u.replace(/^https?:\/\/www\./, "https://").replace(/\/$/, "");

function speichere(fraktion: string, quelle: string, items: { titel: string; link: string; datum: string | null; text: string; kategorien?: string[] }[]): number {
  let neu = 0;
  for (const i of items) {
    if (BACKFILL && i.datum && i.datum < CUTOFF) continue;
    const r = ins.run(fraktion, i.titel, normLink(i.link), i.datum, i.text || null, i.kategorien?.length ? JSON.stringify(i.kategorien) : null, quelle);
    neu += r.changes;
  }
  return neu;
}

/* ── GRÜNE: der Feed trägt die Historie selbst ── */
async function gruene(): Promise<number> {
  const xml = await hole("https://www.gruene-bundestag.de/pressemitteilungen-rss-feed.xml");
  return speichere("GRÜNE", "rss", rssItems(xml));
}

/* ── SPD: Feed (neu) + Listen-Pagination (Backfill) ── */
async function spd(): Promise<number> {
  let neu = speichere("SPD", "rss", rssItems(await hole("https://www.spdfraktion.de/presse/pressemitteilungen/feed")));
  if (!BACKFILL) return neu;
  for (let page = 0; page < 60; page++) {
    const $ = cheerio.load(await hole(`https://www.spdfraktion.de/presse/pressemitteilungen?page=${page}`));
    const items: Parameters<typeof speichere>[2] = [];
    $("article.node-pressemitteilung").each((_, el) => {
      const a = $(el).find("h3 a").first();
      const href = a.attr("href");
      if (!href) return;
      const datum = deDatum($(el).find("span.date").first().text());
      const teaser = strip($(el).clone().find("h3, span.date").remove().end().text());
      items.push({ titel: strip(a.text()), link: new URL(href, "https://www.spdfraktion.de").href, datum, text: teaser });
    });
    if (!items.length) break;
    neu += speichere("SPD", "html-liste", items);
    if (items.every((i) => i.datum && i.datum < CUTOFF)) break;
    await sleep(200);
  }
  return neu;
}

/* ── LINKE: Feed (neu, mit Politikfeld-Kategorien) + TYPO3-Liste (Backfill) ── */
async function linke(): Promise<number> {
  let neu = speichere("LINKE", "rss", rssItems(await hole("https://www.dielinkebt.de/presse/pressemitteilungen/feed.rss")));
  if (!BACKFILL) return neu;
  // ⚠️ Die TYPO3-Pagination ist NICHT chronologisch (seite-4=2020, seite-20=2026,
  // seite-100=2020 …) → kein Datums-Frühabbruch möglich; kompletter Sweep, der
  // CUTOFF-Filter sitzt in speichere(). linksfraktion.de leitet ab seite-4 auf
  // die kanonische Domain dielinkebt.de um → direkt dorthin.
  for (let seite = 1; seite <= 300; seite++) {
    const url = seite === 1
      ? "https://dielinkebt.de/presse/pressemitteilungen/"
      : `https://dielinkebt.de/presse/pressemitteilungen/news/seite-${seite}/`;
    const $ = cheerio.load(await hole(url));
    const items: Parameters<typeof speichere>[2] = [];
    $("div.article").each((_, el) => {
      const a = $(el).find("h2 a").first();
      const href = a.attr("href");
      if (!href) return;
      const datum = $(el).find("time[datetime]").attr("datetime")?.slice(0, 10) ?? deDatum($(el).text());
      const teaser = strip($(el).find("[itemprop='description'], .teaser-text, p").first().text());
      items.push({ titel: strip(a.attr("title") ?? a.text()), link: new URL(href, "https://dielinkebt.de").href, datum, text: teaser });
    });
    if (process.env.PM_DEBUG) console.log(`    linke seite=${seite}: ${items.length} Items, ${items.map((i) => i.datum).filter(Boolean).slice(-1)[0] ?? "?"}`);
    if (!items.length) break;
    neu += speichere("LINKE", "html-liste", items);
    await sleep(200);
  }
  return neu;
}

/* ── AfD: offene WordPress-API, Volltext + Kategorien (AK + MdB) ── */
async function afd(): Promise<number> {
  let neu = 0;
  const maxPages = BACKFILL ? 80 : 1;
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://afdbundestag.de/wp-json/wp/v2/posts?per_page=100&page=${page}&after=${CUTOFF}T00:00:00&_embed=wp:term`;
    const res = await fetch(url, { headers: UA });
    if (res.status === 400) break; // hinter der letzten Seite
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const posts = (await res.json()) as {
      link: string; date: string;
      title: { rendered: string }; content: { rendered: string };
      _embedded?: { "wp:term"?: { name: string; taxonomy: string }[][] };
    }[];
    if (!posts.length) break;
    const items = posts.map((p) => {
      const kategorien = (p._embedded?.["wp:term"] ?? []).flat().filter((t) => t.taxonomy === "category").map((t) => strip(t.name));
      return { titel: strip(p.title.rendered), link: p.link, datum: p.date?.slice(0, 16) ?? null, text: strip(p.content.rendered).slice(0, 4000), kategorien };
    }).filter((i) => i.kategorien.some((k) => /pressemitteilung/i.test(k))); // nur PMs, keine sonstigen Posts
    neu += speichere("AfD", "wp-api", items);
    await sleep(250);
  }
  return neu;
}

/* ── CDU/CSU: kein RSS — sitemap.xml als Voll-Enumeration + Detailseiten ── */
async function cdu(): Promise<number> {
  const sm = await hole("https://www.cducsu.de/sitemap.xml");
  const urls = [...sm.matchAll(/<loc>(https:\/\/www\.cducsu\.de\/presse\/[^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => !/\/presse\/(kontakt|presse-abo|fotos|akkreditierung)/.test(u));
  let neu = 0;
  for (const url of urls) {
    if (kennt.get(url)) continue; // Detailseiten nur für Unbekanntes holen
    let $: cheerio.CheerioAPI;
    try { $ = cheerio.load(await hole(url)); } catch { continue; } // Einzelseite weg → überspringen
    const titel = strip($("h1").first().text());
    const datum = $("time[datetime]").attr("datetime")?.slice(0, 16) ?? null;
    if (!titel) continue;
    const text = strip($("main p, article p").slice(0, 8).text()).slice(0, 4000);
    if (BACKFILL && datum && datum < CUTOFF) continue;
    neu += ins.run("CDU/CSU", titel, url, datum, text || null, null, "sitemap-detail").changes;
    await sleep(200);
  }
  return neu;
}

/* ── Volltext-Anreicherung: Grüne/SPD/Linke liefern in Feed/Liste nur Teaser —
      die Detailseiten tragen die komplette PM (Grüne Dienstag-Statements z.B.
      ~10.000 Zeichen mit Thema-für-Thema-Gliederung). AfD/CDU sind ab Fetch
      Volltext. Läuft inkrementell über volltext=0. ── */
async function volltexte(): Promise<number> {
  db.prepare(`UPDATE fraktion_pm SET volltext = 1 WHERE fraktion IN ('AfD','CDU/CSU') AND volltext = 0`).run();
  const NUR_FRAKTION: Record<string, string> = { gruene: "GRÜNE", spd: "SPD", linke: "LINKE" };
  const rows = db.prepare(
    `SELECT id, fraktion, link, length(COALESCE(text,'')) AS len FROM fraktion_pm
     WHERE volltext = 0 ${NUR ? "AND fraktion = ?" : ""} ORDER BY datum DESC`
  ).all(...(NUR ? [NUR_FRAKTION[NUR] ?? NUR] : [])) as { id: number; fraktion: string; link: string; len: number }[];
  const upd = db.prepare(`UPDATE fraktion_pm SET text = ?, volltext = 1 WHERE id = ?`);
  const flag = db.prepare(`UPDATE fraktion_pm SET volltext = 1 WHERE id = ?`);
  let ok = 0;
  for (const r of rows) {
    let text = "";
    try {
      const $ = cheerio.load(await hole(r.link));
      if (r.link.includes("gruene-bundestag.de")) {
        text = strip($("main p").map((_, p) => $(p).text()).get().join(" "));
      } else if (r.link.includes("dielinkebt.de")) {
        text = strip($('[itemprop="articleBody"]').text());
      } else if (r.link.includes("spdfraktion.de")) {
        const art = $("article").first().length ? $("article").first() : $("main").first();
        art.find("header, nav, form, h1, .share, .social").remove();
        text = strip(art.find("p").map((_, p) => $(p).text()).get().join(" "));
      }
    } catch { /* Seite weg/Timeout → Teaser behalten, nicht erneut versuchen */ }
    if (text.length > 200 && text.length > r.len) { upd.run(text.slice(0, 12000), r.id); ok++; }
    else flag.run(r.id); // nichts Besseres gefunden → Teaser bleibt, aber abgehakt
    await sleep(150);
  }
  return ok;
}

async function main() {
  const quellen: [string, () => Promise<number>][] = [
    ["gruene", gruene], ["spd", spd], ["linke", linke], ["afd", afd], ["cdu", cdu],
  ];
  const NUR_VOLLTEXT = process.argv.includes("--volltext");
  console.log(`Fraktions-PM-Fetch ${NUR_VOLLTEXT ? "(nur Volltext-Anreicherung)" : BACKFILL ? `(BACKFILL ab ${CUTOFF})` : "(nur Neues)"}${NUR ? ` — nur ${NUR}` : ""}`);
  for (const [name, fn] of quellen) {
    if (NUR_VOLLTEXT) break;
    if (NUR && NUR !== name) continue;
    try {
      const neu = await fn();
      console.log(`  ${name.padEnd(6)} +${neu} neu`);
    } catch (e) {
      console.log(`  ${name.padEnd(6)} FEHLER: ${(e as Error).message} — andere Quellen laufen weiter`);
    }
  }
  try {
    const angereichert = await volltexte();
    console.log(`  volltext +${angereichert} angereichert`);
  } catch (e) {
    console.log(`  volltext FEHLER: ${(e as Error).message}`);
  }
  const stat = db.prepare(`SELECT fraktion, COUNT(*) n, MIN(datum) von, MAX(datum) bis FROM fraktion_pm GROUP BY fraktion ORDER BY fraktion`).all() as { fraktion: string; n: number; von: string; bis: string }[];
  console.log("\nBestand:");
  for (const s of stat) console.log(`  ${s.fraktion.padEnd(8)} ${String(s.n).padStart(5)}  ${s.von?.slice(0, 10)} → ${s.bis?.slice(0, 10)}`);
  db.close();
}
main();
