/**
 * Ingestion A — Politik-RSS-Schlagzeilen (Primärsignal Cross-Outlet). Stündlich. €0.
 * Lauf:  npx tsx scripts/fetch-news-rss.ts        # holt + schreibt
 *        npx tsx scripts/fetch-news-rss.ts --dry   # nur parsen, kein DB-Write
 */
import Database from "better-sqlite3";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { ensureSalienzSchema } from "./_lib/salienz-schema";

const DRY = process.argv.includes("--dry");
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");
ensureSalienzSchema(db);

const UA = "PolitikRadar/1.0 (+https://politik.jinsheng-chen.de; Salienz-Ingestion, hourly)";

// Alle am 26.06. live als HTTP 200 / RSS 2.0 verifiziert. Dedizierte Politik-Ressorts
// → ganzer Feed ist Politik, KEIN <category>-Filter nötig.
const FEEDS: { outlet: string; url: string }[] = [
  { outlet: "zeit",         url: "https://newsfeed.zeit.de/politik/index" },
  { outlet: "spiegel",      url: "https://www.spiegel.de/politik/index.rss" },
  { outlet: "faz",          url: "https://www.faz.net/rss/aktuell/politik/" },
  { outlet: "welt",         url: "https://www.welt.de/feeds/section/politik.rss" },
  { outlet: "taz",          url: "https://taz.de/Politik/!p4615;rss/" },
  { outlet: "ntv",          url: "https://www.n-tv.de/politik/rss" },
  { outlet: "tagesspiegel", url: "https://www.tagesspiegel.de/contentexport/feed/politik" },
  { outlet: "tagesschau",   url: "https://www.tagesschau.de/inland/index~rss2.xml" },
];

// fast-xml-parser merged CDATA automatisch in den Text; unwrap() fängt {#text}-Objekte ab.
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
function unwrap(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o["#text"] === "string") return (o["#text"] as string).trim();
  }
  return String(v).trim();
}
// Toleranter pubDate-Parser: RFC822 mit/ohne Wochentag, GMT/+0200/-0000.
function parsePubDate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const ins = db.prepare(`
  INSERT INTO news_items (outlet, title, link, description, pubdate, pubdate_raw)
  VALUES (@outlet, @title, @link, @description, @pubdate, @pubdate_raw)
  ON CONFLICT(link) DO NOTHING
`);

async function fetchFeed(f: { outlet: string; url: string }): Promise<number> {
  const res = await fetch(f.url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const doc = parser.parse(await res.text());
  let items = doc?.rss?.channel?.item ?? [];
  if (!Array.isArray(items)) items = items ? [items] : [];
  let neu = 0;
  for (const it of items) {
    const title = unwrap(it.title);
    const link = unwrap(it.link) || unwrap(it.guid);
    if (!title || !link) continue;
    const raw = unwrap(it.pubDate) || unwrap(it["dc:date"]);
    const row = {
      outlet: f.outlet,
      title,
      link,
      description: unwrap(it.description).slice(0, 2000) || null,
      pubdate: parsePubDate(raw),
      pubdate_raw: raw || null,
    };
    if (!DRY) neu += ins.run(row).changes;
    else neu++;
  }
  return neu;
}

async function main() {
  let total = 0;
  for (const f of FEEDS) {
    try {
      const n = await fetchFeed(f); // ein toter Feed killt den Lauf NICHT
      total += n;
      console.log(`✓ ${f.outlet.padEnd(12)} +${n}`);
    } catch (e: unknown) {
      console.error(`✗ ${f.outlet.padEnd(12)} ${(e as Error).message}`);
    }
  }
  console.log(`${DRY ? "[dry] " : ""}${total} neue news_items`);
}
main();
