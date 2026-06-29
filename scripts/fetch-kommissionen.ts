/**
 * Ingestion — Kommissions-Tracker (€0, deterministisch, kein LLM).
 * (a) Watchlist → kommission (Upsert) + letzter_bericht_url als Seed-Bericht.
 *     (Berichts-Scraping macht der Tages-Scraper scripts/scrape-kommissionsberichte.ts.)
 * (c) Deterministische News-Signal-Erkennung über news_items der letzten 14 Tage
 *     (Regex-Gate + Token-Überlappung via _lib/text-sim.ts, kein LLM).
 * Schema legt scripts/_lib/kommissionen-schema.ts an.
 *
 * Lauf:  npx tsx scripts/fetch-kommissionen.ts          # holt + schreibt
 *        npx tsx scripts/fetch-kommissionen.ts --dry     # nur parsen/loggen, kein DB-Write
 */
import Database from "better-sqlite3";
import path from "path";
import { ensureKommissionenSchema } from "./_lib/kommissionen-schema";
import { KOMMISSIONEN_WATCHLIST } from "./_lib/kommissionen-watchlist";

const DRY = process.argv.includes("--dry");
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");
ensureKommissionenSchema(db);
const RUN_DATE = new Date().toISOString().slice(0, 10);

/** Datum aus URL-Slug: tolerante Regexe → ISO 'YYYY-MM-DD' oder null. */
function dateFromUrl(url: string): string | null {
  let m: RegExpMatchArray | null;
  if ((m = url.match(/-pm-(\d{2})-(\d{2})-(\d{4})/))) return `${m[3]}-${m[2]}-${m[1]}`;          // -pm-DD-MM-YYYY
  if ((m = url.match(/_(\d{2})_(\d{2})_(\d{4})/))) return `${m[3]}-${m[2]}-${m[1]}`;             // _DD_MM_YYYY
  if ((m = url.match(/(20\d{2})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;            // YYYY-MM-DD
  if ((m = url.match(/(20\d{2})(\d{2})(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;              // _YYYYMMDD
  return null;
}

async function main() {
  // ── (a) Watchlist → kommission (Upsert) + Seed-Berichte ───────────────────
  const upK = db.prepare(`
    INSERT INTO kommission (slug,name,kurzname,ministerium,tier,thema,quelle_url,poll_url,cadence,next_expected,status,letzter_bericht_url,notiz)
    VALUES (@slug,@name,@kurzname,@ministerium,@tier,@thema,@quelleUrl,@pollUrl,@cadence,@nextExpected,@status,@letzterBerichtUrl,@notiz)
    ON CONFLICT(slug) DO UPDATE SET
      name=excluded.name, kurzname=excluded.kurzname, ministerium=excluded.ministerium, tier=excluded.tier,
      thema=excluded.thema, quelle_url=excluded.quelle_url, poll_url=excluded.poll_url, cadence=excluded.cadence,
      next_expected=excluded.next_expected, status=excluded.status, letzter_bericht_url=excluded.letzter_bericht_url, notiz=excluded.notiz
  `);
  const insB = db.prepare(`INSERT INTO kommission_bericht (kommission_slug,titel,datum,url,quelle)
    VALUES (?,?,?,?,?) ON CONFLICT(kommission_slug,url) DO NOTHING`);

  let upserted = 0;
  if (!DRY) {
    const tx = db.transaction(() => {
      for (const k of KOMMISSIONEN_WATCHLIST) {
        upK.run(k as unknown as Record<string, unknown>);
        upserted++;
        if (k.letzterBerichtUrl) insB.run(k.slug, null, dateFromUrl(k.letzterBerichtUrl), k.letzterBerichtUrl, "seed");
      }
    });
    tx();
  } else {
    upserted = KOMMISSIONEN_WATCHLIST.length;
    console.log(`[dry] ${upserted} Kommissionen würden upserted (+ Seed-Berichte)`);
  }

  // ── (c) Deterministische News-Signal-Erkennung ────────────────────────────
  const seit = new Date(Date.now() - 14 * 864e5).toISOString();
  const items = db.prepare(
    `SELECT id, title, description FROM news_items WHERE pubdate >= ? ORDER BY pubdate DESC`
  ).all(seit) as { id: number; title: string; description: string | null }[];
  // Kontext-Gate: Schlagzeile muss um ein Gremium ODER einen Berichts-/Empfehlungs-Akt gehen
  // (sonst zählt eine bloße Themen-Erwähnung wie „Rentenreform" schon als Kommissions-Signal).
  const RE_KONTEXT = /(kommission|beirat|sachverst[äa]ndigenrat|gutachten|expertenkommission|legt vor|vorgelegt|übergibt|übergeben|empfiehlt|empfehlung|bericht)/i;

  // Zuordnung über KURATIERTE Stichwort-Phrasen (Substring, lowercase) statt Fuzzy-Namensabgleich.
  // Fuzzy-Matching ordnete jede „die Kommission"-Schlagzeile allen Gremien zu — kuratierte,
  // unterscheidende Phrasen sind präzise und redaktionell pflegbar.
  const insN = db.prepare(`INSERT INTO kommission_news (kommission_slug,news_item_id,signal,run_date)
    VALUES (?,?,?,?) ON CONFLICT(kommission_slug,news_item_id) DO NOTHING`);

  // Idempotent: ganze Tabelle je Lauf neu aufbauen (das 14-Tage-Fenster deckt alle relevanten
  // News ab; Logik-/Watchlist-Änderungen sollen keine falschen Alt-Zuordnungen hinterlassen).
  if (!DRY) db.exec(`DELETE FROM kommission_news`);

  let newsNeu = 0;
  for (const it of items) {
    const low = `${it.title} ${it.description ?? ""}`.toLowerCase();
    if (!RE_KONTEXT.test(low)) continue;
    for (const k of KOMMISSIONEN_WATCHLIST) {
      const hit = k.keywords.find((kw) => low.includes(kw.toLowerCase()));
      if (!hit) continue;
      if (!DRY) newsNeu += insN.run(k.slug, it.id, hit, RUN_DATE).changes;
      else { newsNeu++; console.log(`[dry] news ${it.id} → ${k.slug} (${hit})`); }
    }
  }

  // ── (d) Abschluss-Log ─────────────────────────────────────────────────────
  console.log(`${DRY ? "[dry] " : ""}Kommissionen upserted=${upserted} · neue News-Signale=${newsNeu}`);
  db.close();
}

main();
