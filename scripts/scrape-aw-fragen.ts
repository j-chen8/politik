/**
 * Scraper: abgeordnetenwatch-Bürgerfragen (Fragen & Antworten) je MdB.
 *
 * Datenquelle: SSR-HTML der Profilseiten (robots.txt erlaubt /profile/<slug>/fragen-antworten).
 * AW liefert Themen-Tags bereits klassifiziert (data-tid) → kein LLM nötig.
 *
 * Phasen:
 *   1) Listenseiten ?page=0.. → alle Fragen (Metadaten, Themen, Status, Antwort-Vorschau)
 *   2) --details: pro beantworteter Frage die Detailseite → Antwort-Volltext
 *
 * Nutzung:
 *   npx tsx scripts/scrape-aw-fragen.ts --limit 8            # Test (Listenphase, 8 Profile)
 *   npx tsx scripts/scrape-aw-fragen.ts --run                # alle Profile, Listenphase
 *   npx tsx scripts/scrape-aw-fragen.ts --run --details      # + Antwort-Volltexte
 *   --resume   überspringt Profile, die heute schon gescraped wurden
 *   --delay N  ms zwischen Requests (Default 700)
 */
import Database from "better-sqlite3";
import path from "path";
import * as cheerio from "cheerio";

const DB_PATH = path.join(process.cwd(), "politik.db");
const db = new Database(DB_PATH);
// WAL + Busy-Timeout: erlaubt parallelen Listen- und Detail-Prozess auf derselben DB
// ohne "database is locked".
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 15000");
const UA = "Mozilla/5.0 (compatible; PolitikRadar/1.0; +https://politik.jinsheng-chen.de)";
const BASE = "https://www.abgeordnetenwatch.de";

const argv = process.argv.slice(2);
const LIMIT = argv.includes("--limit") ? parseInt(argv[argv.indexOf("--limit") + 1], 10) : null;
const RUN = argv.includes("--run") || LIMIT !== null || argv.includes("--details-only");
const DETAILS = argv.includes("--details");
const DETAILS_ONLY = argv.includes("--details-only"); // nur Phase 2 (paralleler Prozess)
const LOOP_DETAILS = argv.includes("--loop-details"); // pollt nachkommende Fragen, bis Backlog leer bleibt
const CONCURRENCY = argv.includes("--concurrency") ? parseInt(argv[argv.indexOf("--concurrency") + 1], 10) : 1;
const LIST_CONCURRENCY = argv.includes("--list-concurrency") ? parseInt(argv[argv.indexOf("--list-concurrency") + 1], 10) : 1;
const RESUME = argv.includes("--resume");
const ONLY = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const DELAY = argv.includes("--delay") ? parseInt(argv[argv.indexOf("--delay") + 1], 10) : 700;

db.exec(`
  CREATE TABLE IF NOT EXISTS aw_questions (
    frage_url TEXT PRIMARY KEY,
    politician_id INTEGER,
    slug TEXT,
    frage_text TEXT,
    asker TEXT,
    frage_datum TEXT,
    status TEXT,                 -- 'beantwortet' | 'ausstehend'
    antwort_text TEXT,           -- Volltext (Detailseite) oder Vorschau
    antwort_volltext INTEGER DEFAULT 0,  -- 1 = aus Detailseite, 0 = nur Vorschau
    antwort_datum TEXT,
    antwort_steller TEXT,
    fetched_at TEXT
  );
  CREATE TABLE IF NOT EXISTS aw_question_topics (
    frage_url TEXT,
    tid TEXT,
    label TEXT,
    PRIMARY KEY (frage_url, tid)
  );
  CREATE INDEX IF NOT EXISTS idx_awq_pol ON aw_questions(politician_id);
  CREATE INDEX IF NOT EXISTS idx_awqt_tid ON aw_question_topics(tid);
`);

const upsertQ = db.prepare(`
  INSERT INTO aw_questions (frage_url, politician_id, slug, frage_text, asker, frage_datum,
    status, antwort_text, antwort_volltext, antwort_datum, antwort_steller, fetched_at)
  VALUES (@frage_url, @politician_id, @slug, @frage_text, @asker, @frage_datum,
    @status, @antwort_text, @antwort_volltext, @antwort_datum, @antwort_steller, @fetched_at)
  ON CONFLICT(frage_url) DO UPDATE SET
    frage_text=@frage_text, asker=@asker, frage_datum=@frage_datum, status=@status,
    -- Volltext NIE mit Listen-Vorschau überschreiben: war die Ursache der 40k-Truncation
    -- (06-15-Re-Scrape ohne --resume lief über die Listen-Phase, downgradete Volltexte auf
    -- Vorschau, volltext blieb via MAX auf 1 → Detail-Phase übersprang sie). 2026-06-16.
    antwort_text=CASE WHEN antwort_volltext=1 THEN antwort_text
                      ELSE COALESCE(NULLIF(@antwort_text,''), antwort_text) END,
    antwort_volltext=MAX(antwort_volltext,@antwort_volltext),
    antwort_datum=@antwort_datum, antwort_steller=@antwort_steller, fetched_at=@fetched_at
`);
const upsertTopic = db.prepare(`INSERT OR IGNORE INTO aw_question_topics (frage_url, tid, label) VALUES (?,?,?)`);
const setAnswer = db.prepare(`UPDATE aw_questions SET antwort_text=?, antwort_volltext=1, fetched_at=? WHERE frage_url=?`);
// Detail-Fetch aktualisiert Frage UND Antwort: frage_text aus .question__question .body
// (echter Wortlaut statt Listen-Titel "Frage an X bezüglich Y"); leer → alten Wert behalten.
const setQA = db.prepare(`UPDATE aw_questions SET frage_text=COALESCE(NULLIF(?,''),frage_text), antwort_text=?, antwort_volltext=1, fetched_at=? WHERE frage_url=?`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toISO = (d: string | null) => {
  const m = d?.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
// Block-bewusste Textextraktion: cheerios .text() klebt Block-Elemente ohne Leerzeichen
// zusammen ("GrüßenPaula", "zu.Mit") → Leerzeichen um Blöcke einsetzen, &nbsp; dekodieren.
// War die Ursache der pervasiven Run-together-Texte (2026-06-16).
function blockText($: cheerio.CheerioAPI, el: cheerio.Cheerio<any>): string {
  if (!el || el.length === 0) return "";
  const cl = el.clone();
  cl.find("p, div, br, li, tr, h1, h2, h3, h4, blockquote").each((_, b) => { $(b).before(" "); $(b).append(" "); });
  return cl.text().replace(/ |&nbsp;/g, " ")
    // AW-Quelle teils doppelt-encodiert (&amp;hellip;) → cheerio dekodiert nur eine Ebene,
    // die zweite bleibt Literal → nachdekodieren (&amp; zuletzt):
    .replace(/&hellip;/g, "…").replace(/&ldquo;/g, "„").replace(/&rdquo;/g, "“")
    .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&bull;/g, "•")
    .replace(/&(?:lrm|shy);/g, "").replace(/&gt;/g, ">").replace(/&lt;/g, "<")
    .replace(/&quot;/g, "\"").replace(/&#0?39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

// Adaptiver Delay: startet bei DELAY, steigt dauerhaft bei Rate-Limit-Treffern.
let curDelay = DELAY;
let rateLimitHits = 0;
async function get(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 404) return null;
      if (res.status === 429 || res.status === 503) {
        rateLimitHits++;
        const ra = parseInt(res.headers.get("retry-after") || "", 10);
        const wait = !isNaN(ra) ? ra * 1000 : Math.min(60000, 5000 * 2 ** attempt);
        // Basis-Delay dauerhaft anheben (max 3s), damit wir uns nicht wieder reinrennen.
        curDelay = Math.min(3000, curDelay + 200);
        console.log(`  ⏳ HTTP ${res.status} (Rate-Limit #${rateLimitHits}) → warte ${Math.round(wait / 1000)}s, Delay jetzt ${curDelay}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) { await sleep(2000 * (attempt + 1)); continue; }
      return await res.text();
    } catch { await sleep(2000 * (attempt + 1)); }
  }
  return null;
}

function parseList(html: string, slug: string, politicianId: number) {
  const $ = cheerio.load(html);
  const header = $("body").text().match(/(\d+)\s*\/\s*(\d+)\s*Fragen beantwortet/);
  const out: { q: any; topics: { tid: string; label: string }[] }[] = [];
  $("article.question").each((_, el) => {
    const card = $(el);
    const link = card.find('a[href*="/fragen-antworten/"]').filter((_, a) => {
      const h = $(a).attr("href") || "";
      return /\/fragen-antworten\/.+/.test(h) && !h.includes("/themen/") && !h.includes("?");
    }).first();
    const href = link.attr("href");
    if (!href) return;
    const frage_url = href.startsWith("http") ? href : BASE + href;
    const frage_text = link.text().trim();
    const hdr = card.find(".answer__header-text").first().text().replace(/\s+/g, " ").trim();
    const answered = !/ausstehend/i.test(hdr) && /Antwort/i.test(hdr);
    const answ = card.find(".answer__body").first().text().replace(/\s+/g, " ").trim();
    const cardText = card.text().replace(/\s+/g, " ");
    const askerM = cardText.match(/Frage von\s+(.+?)\s*[•·]\s*(\d{2}\.\d{2}\.\d{4})/);
    const antwortDatum = answered ? toISO((hdr.match(/(\d{2}\.\d{2}\.\d{4})/) || [])[1] || null) : null;
    const antwortSteller = answered ? (hdr.match(/von\s+(.+)$/)?.[1]?.trim() || null) : null;
    const topics: { tid: string; label: string }[] = [];
    card.find('a[href*="/fragen-antworten/themen/"]').each((_, t) => {
      const tid = $(t).attr("data-tid"); const label = $(t).text().trim();
      if (tid && label) topics.push({ tid, label });
    });
    out.push({
      q: {
        frage_url, politician_id: politicianId, slug, frage_text,
        asker: askerM?.[1]?.trim() || null,
        frage_datum: toISO(askerM?.[2] || null),
        status: answered ? "beantwortet" : "ausstehend",
        antwort_text: answ || "", antwort_volltext: 0,
        antwort_datum: antwortDatum, antwort_steller: antwortSteller,
        fetched_at: new Date().toISOString(),
      },
      topics,
    });
  });
  return { header: header?.[0] ?? null, headerBeantwortet: header ? +header[1] : null, headerTotal: header ? +header[2] : null, items: out };
}

async function main() {
  if (!RUN) { console.log("Nichts zu tun. --limit N (Test) oder --run."); return; }
  let pols = db.prepare(
    `SELECT id, replace(abgeordnetenwatch_url,'${BASE}/profile/','') AS slug
     FROM politicians WHERE abgeordnetenwatch_url LIKE '${BASE}/profile/%'
       AND bundestag_bio_text IS NOT NULL AND bundestag_bio_text<>'' ORDER BY id`
  ).all() as { id: number; slug: string }[];
  if (ONLY) pols = pols.filter((p) => p.slug === ONLY);
  if (LIMIT) pols = pols.slice(0, LIMIT);

  const today = new Date().toISOString().slice(0, 10);
  let totalQ = 0, totalAnswered = 0, profilesDone = 0, mismatch = 0;
  const listQueue = DETAILS_ONLY ? [] : [...pols];
  const total = listQueue.length;

  const scrapeProfile = async (pol: { id: number; slug: string }) => {
    if (RESUME) {
      const last = db.prepare(`SELECT MAX(fetched_at) f FROM aw_questions WHERE politician_id=?`).get(pol.id) as { f: string | null };
      if (last.f && last.f.slice(0, 10) === today) { profilesDone++; return; }
    }
    // Listing-Slug auflösen: AW nutzt für manche Profile einen ABWEICHENDEN Fragen-Slug
    // (z.B. Profil `anna-luehrmann` ü→ue, Fragen-Liste `anna-luhrmann` ü→u). Der Profil-Slug
    // 404t dann auf /fragen-antworten → Profil würde als "0 Fragen" übersprungen (Bug 2026-06-16).
    // Profil-Slug zuerst probieren; bei 404 echten Slug aus dem "Alle Fragen"-Link holen.
    let listingSlug = pol.slug;
    let firstHtml = await get(`${BASE}/profile/${pol.slug}/fragen-antworten?page=0`);
    await sleep(curDelay);
    if (firstHtml === null) {
      const base = await get(`${BASE}/profile/${pol.slug}`);
      await sleep(curDelay);
      const m = base?.match(/href="\/profile\/([a-z0-9-]+)\/fragen-antworten"/);
      if (m && m[1] !== pol.slug) {
        listingSlug = m[1];
        firstHtml = await get(`${BASE}/profile/${listingSlug}/fragen-antworten?page=0`);
        await sleep(curDelay);
        if (firstHtml) console.log(`  ↳ ${pol.slug}: Fragen-Slug-Alias → ${listingSlug}`);
      }
    }
    let page = 0, pq = 0, headerTotal: number | null = null;
    while (page < 400) {
      const html = page === 0 ? firstHtml : await get(`${BASE}/profile/${listingSlug}/fragen-antworten?page=${page}`);
      if (page > 0) await sleep(curDelay);
      if (!html) break;
      const { items, headerTotal: ht } = parseList(html, pol.slug, pol.id);
      if (page === 0) headerTotal = ht;
      if (items.length === 0) break;
      const tx = db.transaction(() => {
        for (const { q, topics } of items) {
          upsertQ.run(q);
          for (const t of topics) upsertTopic.run(q.frage_url, t.tid, t.label);
          if (q.status === "beantwortet") totalAnswered++;
        }
      });
      tx();
      pq += items.length; totalQ += items.length;
      page++;
    }
    profilesDone++;
    const dbCount = (db.prepare(`SELECT COUNT(*) c FROM aw_questions WHERE politician_id=?`).get(pol.id) as { c: number }).c;
    const flag = headerTotal !== null && Math.abs(dbCount - headerTotal) > 2 ? " ⚠️MISMATCH" : "";
    if (flag) mismatch++;
    console.log(`[${profilesDone}/${total}] ${pol.slug}: ${pq} Fragen (DB ${dbCount}, Header ${headerTotal ?? "?"})${flag}`);
  };

  // Profil-Pool: LIST_CONCURRENCY Profile gleichzeitig (jeder Worker zieht aus der Queue).
  let qi = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, LIST_CONCURRENCY) }, async () => {
      while (qi < listQueue.length) await scrapeProfile(listQueue[qi++]);
    })
  );

  // Phase 2: Antwort-Volltexte — parallel (Worker-Pool) + optional Poll-Schleife,
  // damit dieser Prozess parallel zur Listenphase den wachsenden Backlog abarbeitet.
  if (DETAILS || DETAILS_ONLY) {
    const onlyClause = ONLY ? ` AND politician_id IN (${pols.map((p) => p.id).join(",") || "-1"})` : "";
    const fetchAnswer = async (frage_url: string) => {
      const html = await get(frage_url);
      if (!html) return;
      const $ = cheerio.load(html);
      const art = $("article.question").first();
      const full = blockText($, art.find(".answer__body").first())
        || blockText($, $(".answer__body").first());
      // Echten Fragewortlaut aus .question__question .body; leer → h1-Titel als Fallback.
      const qq = $(".question__question").first();
      const frage = blockText($, qq.find(".body").first()) || blockText($, qq.find("h1").first());
      if (full) setQA.run(frage, full, new Date().toISOString(), frage_url);
    };
    let done = 0, emptyPasses = 0;
    console.log(`\n--- Phase 2 (Volltexte, ${CONCURRENCY} parallel${LOOP_DETAILS ? ", Poll-Modus" : ""}) ---`);
    while (true) {
      const todo = (db.prepare(
        `SELECT frage_url FROM aw_questions WHERE status='beantwortet' AND antwort_volltext=0${onlyClause} LIMIT 2000`
      ).all() as { frage_url: string }[]).map((r) => r.frage_url);
      if (todo.length === 0) {
        if (!LOOP_DETAILS || ++emptyPasses >= 4) break;
        await sleep(15000); // auf nachkommende Fragen aus Phase 1 warten
        continue;
      }
      emptyPasses = 0;
      let idx = 0;
      await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
          while (idx < todo.length) {
            const u = todo[idx++];
            await fetchAnswer(u);
            await sleep(curDelay);
            if (++done % 100 === 0) console.log(`  Volltexte: ${done} (Delay ${curDelay}ms, Limits ${rateLimitHits})`);
          }
        })
      );
    }
    console.log(`Phase 2 fertig: ${done} Volltexte geholt.`);
  }

  console.log(`\n=== FERTIG ===`);
  console.log(`Profile: ${profilesDone} · Fragen: ${totalQ} · beantwortet: ${totalAnswered} · Mismatches: ${mismatch}`);
  const topicCount = (db.prepare(`SELECT COUNT(DISTINCT tid) c FROM aw_question_topics`).get() as { c: number }).c;
  console.log(`distinkte Themen: ${topicCount}`);
}
main();
