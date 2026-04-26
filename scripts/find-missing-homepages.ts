/**
 * Sucht via DuckDuckGo-HTML nach den persönlichen Webseiten von Politikern
 * die in Wikidata keine homepage_url hatten.
 *
 * Strategie:
 *   1. Query: "<Vorname> <Nachname> MdB <Partei>"
 *   2. Top-Hits filtern (raus: Wiki, Twitter/X, Insta, FB, Parteiseiten,
 *      Bundestag, abgeordnetenwatch, News-Sites)
 *   3. Ersten plausiblen Treffer fetchen, im <title> Namen prüfen
 *   4. Bei Match → in DB schreiben (homepage_url + homepage_source='search')
 *
 * Run: npx tsx scripts/find-missing-homepages.ts [--dry-run] [--limit N]
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const BRAVE_DELAY_MS = 1100;     // 1 query/sec free tier
const FETCH_DELAY_MS = 800;
const TIMEOUT_MS = 8000;
const BRAVE_KEY = process.env.BRAVE_API_KEY;
if (!BRAVE_KEY) { console.error("BRAVE_API_KEY fehlt in .env"); process.exit(1); }

const DRY = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;

// Domains die NIE persönliche MdB-Homepages sind. Generische Fraktions-,
// Partei-, Presse-, Social-Media-, sonstige Sammelsites.
const SKIP_DOMAIN_RE = /(^|\.)(wikipedia\.org|wikidata\.org|wikimedia\.org|twitter\.com|x\.com|facebook\.com|fb\.com|instagram\.com|tiktok\.com|youtube\.com|youtu\.be|linkedin\.com|threads\.net|xing\.com|mastodon\.|bewegung\.social|bluesky\.|bsky\.|abgeordnetenwatch\.de|bundestag\.de|mitmischen\.de|btg-bestellservice\.de|spd\.de|cdu\.de|csu\.de|fdp\.de|gruene\.de|afd\.de|die-linke\.de|bsw-vg\.de|freiewaehler\.|volt(deutschland|europa)\.|cducsu\.de|spdfraktion\.de|spdfraktion-bw\.de|spdfraktion-bayern\.de|gruene-bundestag\.de|linksfraktion\.de|linksfraktion-[a-z-]+|afdbundestag\.de|afd-[a-z-]+\.|cdu-[a-z-]+\.|csu-[a-z-]+\.|spd-[a-z-]+\.|gruene-[a-z-]+\.|fdp-[a-z-]+\.|linke-[a-z-]+\.|bayernspd|spd-bayern|gruene-bayern|spiegel\.de|zeit\.de|tagesschau\.de|focus\.de|welt\.de|sueddeutsche\.de|faz\.net|n-tv\.de|stern\.de|nordkurier\.de|bild\.de|gettyimages\.|news\.google\.|google\.com|duckduckgo\.com|amazon\.|spotify\.com|github\.com|t-online\.de|fr\.de|rtl\.de|dpa\.com|reddit\.com|merkur\.de|quora\.com|nzz\.ch|deutschlandfunk\.de|tagesspiegel\.de|tagesschau24|aerztezeitung\.de|aerzteblatt\.de|burg-huelshoff\.de|nordbayern\.de|swr\.de|wdr\.de|ndr\.de|br\.de|hr\.de|mdr\.de|rbb\.de|deutschlandradio\.de|deutsche-welle\.|deutscher-bundestag\.|fragdenstaat\.de|lobbycontrol\.de|abgeordnete-im-fokus\.de|dawum\.de|landtag\.|landtag-[a-z-]+\.|wen-waehlen\.de|kandidatencheck|api\.proxy\.bund\.dev|haz\.de|nwzonline\.de|shz\.de|altmarkkreis|regionalheute\.de|allesdetten\.de|zvw\.de|haznp|lokalkompass\.de|mz\.de|sr\.de|homburg1\.de|siegen-wittgenstein\.de|regensburg\.de|bayern\.de|afdwatchbremen)/i;

async function fetchHtml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Brave Search API ──

async function braveSearch(query: string): Promise<string[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&country=de&search_lang=de&safesearch=off`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "X-Subscription-Token": BRAVE_KEY!,
        "Accept": "application/json",
      },
    });
    if (!res.ok) {
      if (res.status === 429) {
        // Hit rate limit — wait extra before next call
        await sleep(3000);
      }
      return [];
    }
    const data = (await res.json()) as any;
    const results = data?.web?.results ?? [];
    return results.map((r: any) => r.url).filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

function isPlausibleHomepage(url: string): boolean {
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith("http")) return false;
    if (SKIP_DOMAIN_RE.test(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Scoring statt binärer Validierung ──

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function normalizeForDomain(s: string): string {
  // Deutsche Umlaut-Konvention: ä→ae, ö→oe, ü→ue (sonst verlieren wir
  // Match gegen Domains wie "andrea-luebcke.de")
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

async function scoreCandidate(url: string, firstName: string, lastName: string): Promise<{ score: number; reasons: string[] }> {
  const reasons: string[] = [];
  let score = 0;

  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { return { score: -100, reasons: ["bad url"] }; }

  const fnDom = normalizeForDomain(firstName.split(" ")[0]);
  const lnDom = normalizeForDomain(lastName);
  const hostBare = host.split(".")[0];   // "frederik-bouffier" aus "frederik-bouffier.de"
  const hostNorm = normalizeForDomain(host);

  // Domain enthält Nachname → starkes Signal
  if (lnDom.length >= 4 && hostNorm.includes(lnDom)) {
    score += 10;
    reasons.push(`dom:${lnDom}`);
    if (hostNorm.includes(fnDom)) {
      score += 10;
      reasons.push(`dom:${fnDom}`);
    }
  }
  // Subdomain hint (z.B. "ingo-vogel.spd.de") — Hostname startet mit name
  else if (host.startsWith(`${fnDom}-${lnDom}.`) || host.startsWith(`${lnDom}-${fnDom}.`) || host.startsWith(`${lnDom}.`)) {
    score += 8;
    reasons.push("subdom");
  }

  // Title-Check (nur wenn Domain-Score nicht überzeugend)
  if (score < 10) {
    const html = await fetchHtml(url);
    if (html) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
      const title = (titleMatch?.[1] ?? "") + " " + (ogTitleMatch?.[1] ?? "");
      const tn = normalize(title);
      const fn = normalize(firstName.split(" ")[0]);
      const ln = normalize(lastName);
      if (tn.includes(ln) && tn.includes(fn)) {
        score += 3;
        reasons.push("title");
      } else if (tn.includes(ln)) {
        score += 1;
      }
    }
  }
  return { score, reasons };
}

const MIN_ACCEPT_SCORE = 8;

// ── Main ──

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Stelle sicher, dass die Quelle-Spalte existiert
  const cols = db.prepare("PRAGMA table_info(politicians)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "homepage_source")) {
    db.exec("ALTER TABLE politicians ADD COLUMN homepage_source TEXT");
    console.log("→ homepage_source Spalte angelegt");
  }
  // Zukünftige Refs zur Untersuchung speichern
  if (!cols.some((c) => c.name === "homepage_search_attempted_at")) {
    db.exec("ALTER TABLE politicians ADD COLUMN homepage_search_attempted_at TEXT");
    console.log("→ homepage_search_attempted_at Spalte angelegt");
  }

  let rows = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, pa.label AS party
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE par.type = 'bundestag'
         AND p.homepage_url IS NULL
         AND p.homepage_search_attempted_at IS NULL
       ORDER BY p.last_name`
    )
    .all() as { id: number; first_name: string; last_name: string; party: string | null }[];

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  console.log(`\n${rows.length} MdBs ohne homepage_url, suche per DuckDuckGo`);

  const update = db.prepare(
    `UPDATE politicians
     SET homepage_url = ?, homepage_source = 'brave_search', homepage_search_attempted_at = ?
     WHERE id = ?`
  );
  const markAttempted = db.prepare(
    `UPDATE politicians SET homepage_search_attempted_at = ? WHERE id = ?`
  );

  let found = 0, notFound = 0;
  for (let i = 0; i < rows.length; i++) {
    const p = rows[i];
    const partyShort = (p.party ?? "").split(/[\s/]/)[0];
    const query = `${p.first_name} ${p.last_name} MdB ${partyShort} Homepage`.trim();
    process.stdout.write(`\n[${i + 1}/${rows.length}] ${p.first_name} ${p.last_name} (${partyShort}): `);

    let hits: string[] = [];
    try {
      hits = await braveSearch(query);
    } catch {
      process.stdout.write("Brave-Fehler");
    }
    await sleep(BRAVE_DELAY_MS);

    // Score alle plausiblen Kandidaten, nimm den besten — aber nur wenn Score ≥ MIN_ACCEPT
    let best: { url: string; score: number; reasons: string[] } | null = null;
    for (const u of hits.slice(0, 8)) {
      if (!isPlausibleHomepage(u)) continue;
      const { score, reasons } = await scoreCandidate(u, p.first_name, p.last_name);
      if (!best || score > best.score) best = { url: u, score, reasons };
      if (best.score >= 18) break; // domain matched first+last, kein Grund weiter zu suchen
      await sleep(FETCH_DELAY_MS);
    }

    if (best && best.score >= MIN_ACCEPT_SCORE) {
      found++;
      const origin = new URL(best.url).origin;
      process.stdout.write(`✓ ${origin}  [score=${best.score} ${best.reasons.join(",")}]`);
      if (!DRY) update.run(origin, new Date().toISOString(), p.id);
    } else {
      notFound++;
      const reason = best ? `bester Score ${best.score} (${best.url})` : "nichts plausibles";
      process.stdout.write(`✗ ${reason}`);
      if (!DRY) markAttempted.run(new Date().toISOString(), p.id);
    }
  }

  console.log(`\n\n=== Fertig ===`);
  console.log(`  Gefunden:       ${found}`);
  console.log(`  Nicht gefunden: ${notFound}`);

  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
