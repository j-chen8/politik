/**
 * Scraped die offiziellen Profile der Berliner Abgeordneten vom
 * Abgeordnetenhaus (AGH): parlament-berlin.de/Abgeordnete/<slug>
 *
 * Zweck: systematische CV-Zweitquelle für die Berlin-Source-Coherence-Cascade.
 * Bisher haben 159/189 MdL nur eine Quelle (Wikipedia, cv_json). Das AGH-Profil
 * liefert pro Person:
 *   - strukturierte Felder (Geburtsjahr/-ort, Wahlkreis, gewählt über)  → agh_structured_json
 *   - Vita-Fließtext (Lebenslauf)                                       → agh_bio_text
 *   - Link zur persönlichen Homepage (Teilmenge)                        → homepage_url (nur falls leer)
 *
 * Slug = first_name + " " + last_name, lowercase, Spaces→"-".
 * Die AGH-Seite akzeptiert rohes Unicode (pätzold, çağlar) UND einzeichniges
 * ASCII-Folding (ä→a, ü→u, ß→ss). Wir probieren erst Unicode, dann ASCII-Fold.
 * (ae/ue/oe-Folding funktioniert NICHT: martin-paetzold → 404, martin-patzold → 200.)
 *
 * Run:
 *   npx tsx scripts/scrape-berlin-agh-profiles.ts --probe        # nur Coverage, kein DB-Write
 *   npx tsx scripts/scrape-berlin-agh-profiles.ts [--limit N] [--id N] [--force]
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
const BASE = "https://www.parlament-berlin.de/Abgeordnete/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FETCH_DELAY_MS = 700;
const TIMEOUT_MS = 12000;

const PROBE = process.argv.includes("--probe");
const FORCE = process.argv.includes("--force");
const limitIdx = process.argv.indexOf("--limit");
const LIMIT = limitIdx > -1 ? parseInt(process.argv[limitIdx + 1], 10) : 0;
const idIdx = process.argv.indexOf("--id");
const ONLY_ID = idIdx > -1 ? parseInt(process.argv[idIdx + 1], 10) : 0;

const db = new Database(DB_PATH);

// ── Slug-Erzeugung ──────────────────────────────────────────────────────────
const ASCII_FOLD: Record<string, string> = {
  ä: "a", ö: "o", ü: "u", ß: "ss", ğ: "g", ç: "c", ş: "s",
  ı: "i", İ: "i", é: "e", è: "e", á: "a", í: "i", ó: "o", ú: "u", ñ: "n",
  ć: "c", ń: "n", ś: "s", ź: "z", ż: "z", ł: "l", ř: "r", š: "s", ž: "z", ý: "y", č: "c",
};
const KEEP_RE = /[^a-z0-9äöüßğçşıİéèáíóúñćńśźżłřšžýč-]/g;
const FOLD_RE = /[äöüßğçşıİéèáíóúñćńśźżłřšžýč]/g;
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\s/]+/g, "-")
    .replace(KEEP_RE, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function baseSlug(first: string, last: string): string {
  return slugify(`${first} ${last}`);
}
function asciiSlug(first: string, last: string): string {
  return baseSlug(first, last).replace(FOLD_RE, (c) => ASCII_FOLD[c] ?? c);
}
// AGH-Slugs lassen Mittelnamen/Initialen weg (Alexander J. Herrmann → alexander-herrmann,
// Karsten Ludwig Woldeit → karsten-woldeit). Erstvorname + Nachname als Fallback.
function shortSlug(first: string, last: string): string {
  const firstToken = first.trim().split(/\s+/)[0];
  return slugify(`${firstToken} ${last}`).replace(FOLD_RE, (c) => ASCII_FOLD[c] ?? c);
}

// ── HTML-Parsing ────────────────────────────────────────────────────────────
function extractDivBlock(h: string, startIdx: number): string {
  let i = startIdx, depth = 0;
  const n = h.length;
  while (i < n) {
    if (h.startsWith("<div", i) && !/[a-z]/i.test(h[i + 4] ?? "")) { depth++; i += 4; }
    else if (h.startsWith("</div>", i)) { depth--; i += 6; if (depth === 0) return h.slice(startIdx, i); }
    else { i++; continue; }
    if (depth === 0) return h.slice(startIdx, i);
  }
  return h.slice(startIdx);
}
function cleanText(raw: string): string {
  let t = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ");
  t = decodeEntities(t)
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return t.split("\n").map((l) => l.trim()).join("\n").trim();
}
function decodeEntities(s: string): string {
  const map: Record<string, string> = {
    "&auml;": "ä", "&ouml;": "ö", "&uuml;": "ü", "&Auml;": "Ä", "&Ouml;": "Ö",
    "&Uuml;": "Ü", "&szlig;": "ß", "&amp;": "&", "&quot;": '"', "&apos;": "'",
    "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&ndash;": "–", "&mdash;": "—",
    "&shy;": "", "&eacute;": "é",
  };
  return s
    .replace(/&[a-zA-Z]+;/g, (m) => map[m] ?? m)
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

const SOCIAL_RE =
  /parlament-berlin|facebook|twitter|x\.com|instagram|youtube|youtu\.be|linkedin|matomo|datenschutz|google|tiktok|mastodon|bsky|threads|xing|wikipedia|\.(css|js|png|jpe?g|svg|gif|ico|pdf)(\?|$)/i;

interface Parsed {
  vita: string | null;
  structured: Record<string, string>;
  homepage: string | null;
}
function parseProfile(html: string): Parsed {
  const blocks: string[] = [];
  const re = /<div class="b-text/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) blocks.push(cleanText(extractDivBlock(html, m.index)));

  // Vita = längster Block (Strukturblöcke sind ~100 Zeichen, beginnen mit "Vergrößerte Abbildung")
  let vita: string | null = null;
  for (const b of blocks) {
    const isStruct = /^Vergr/.test(b) || /gewählt über:/.test(b);
    if (!isStruct && (!vita || b.length > vita.length)) vita = b;
  }
  if (vita && vita.length < 40) vita = null;

  // Strukturfelder aus dem ersten Strukturblock
  const structured: Record<string, string> = {};
  const sb = blocks.find((b) => /geb\.|gewählt über:/.test(b));
  if (sb) {
    const lines = sb.split("\n").map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l === "geb." && lines[i + 1]) structured.geboren_jahr = lines[i + 1];
      if (l === "in" && lines[i + 1]) structured.geboren_ort = lines[i + 1];
      if (/^gewählt über:?$/.test(l) && lines[i + 1]) structured.gewaehlt_ueber = lines[i + 1];
      if (/^Wahlkreis:?$/.test(l) && lines[i + 1]) structured.wahlkreis = lines[i + 1];
      if (/^Wahlbezirk:?$/.test(l) && lines[i + 1]) structured.wahlbezirk = lines[i + 1];
    }
  }

  // Homepage: erster externer, nicht-sozialer Link
  let homepage: string | null = null;
  const hrefs = new Set<string>();
  for (const hm of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) hrefs.add(hm[1]);
  for (const href of hrefs) {
    if (!SOCIAL_RE.test(href)) { homepage = href.replace(/\/+$/, ""); break; }
  }

  return { vita, structured, homepage };
}

async function fetchHtml(url: string): Promise<{ ok: boolean; status: number; html?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, html: await res.text() };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resolve(first: string, last: string): Promise<{ url: string; html: string } | null> {
  const candidates = Array.from(
    new Set([baseSlug(first, last), asciiSlug(first, last), shortSlug(first, last)])
  );
  for (const slug of candidates) {
    const url = BASE + encodeURI(slug);
    const r = await fetchHtml(url);
    if (r.ok && r.html) return { url, html: r.html };
    await sleep(250);
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────────────────
const rows = db
  .prepare(
    `SELECT p.id, p.first_name, p.last_name, p.homepage_url, p.agh_bio_text
     FROM politicians p
     JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     WHERE pp.parliament_id = 2
       ${ONLY_ID ? "AND p.id = @id" : ""}
     GROUP BY p.id
     ORDER BY p.last_name, p.first_name`
  )
  .all({ id: ONLY_ID }) as Array<{
  id: number;
  first_name: string;
  last_name: string;
  homepage_url: string | null;
  agh_bio_text: string | null;
}>;

const work = rows.filter((r) => FORCE || PROBE || ONLY_ID || !r.agh_bio_text);
const todo = LIMIT ? work.slice(0, LIMIT) : work;

const update = db.prepare(
  `UPDATE politicians SET
     agh_bio_url = @url,
     agh_bio_text = @text,
     agh_structured_json = @structured,
     agh_bio_fetched_at = datetime('now'),
     homepage_url = COALESCE(NULLIF(homepage_url, ''), @homepage),
     homepage_source = CASE WHEN (homepage_url IS NULL OR homepage_url = '') AND @homepage IS NOT NULL
                            THEN 'agh' ELSE homepage_source END
   WHERE id = @id`
);

(async () => {
  console.log(
    `${PROBE ? "[PROBE] " : ""}${todo.length} Berlin-MdL${LIMIT ? ` (limit ${LIMIT})` : ""}, ` +
      `${rows.length} gesamt\n`
  );
  let hit = 0, miss = 0, withVita = 0, withHomepage = 0, newHomepage = 0;
  const misses: string[] = [];

  for (const r of todo) {
    const name = `${r.first_name} ${r.last_name}`;
    const res = await resolve(r.first_name, r.last_name);
    if (!res) {
      miss++; misses.push(name);
      console.log(`  ✗ 404  ${name}`);
      await sleep(FETCH_DELAY_MS);
      continue;
    }
    hit++;
    const p = parseProfile(res.html);
    if (p.vita) withVita++;
    if (p.homepage) withHomepage++;
    const isNewHp = p.homepage && !r.homepage_url;
    if (isNewHp) newHomepage++;

    if (PROBE) {
      console.log(
        `  ✓ ${name.padEnd(34)} vita:${p.vita ? p.vita.length : 0}` +
          `${p.homepage ? `  hp:${p.homepage}${isNewHp ? " (NEU)" : ""}` : ""}`
      );
    } else {
      update.run({
        id: r.id,
        url: res.url,
        text: p.vita,
        structured: Object.keys(p.structured).length ? JSON.stringify(p.structured) : null,
        homepage: p.homepage,
      });
      console.log(`  ✓ ${name.padEnd(34)} vita:${p.vita ? p.vita.length : 0}${isNewHp ? `  +hp:${p.homepage}` : ""}`);
    }
    await sleep(FETCH_DELAY_MS);
  }

  console.log(
    `\n── ${PROBE ? "PROBE" : "FERTIG"} ──\n` +
      `  Treffer:        ${hit}/${todo.length}\n` +
      `  mit Vita-Text:  ${withVita}\n` +
      `  mit Homepage:   ${withHomepage} (davon neu: ${newHomepage})\n` +
      `  404/Miss:       ${miss}`
  );
  if (misses.length) console.log(`  Misses: ${misses.join(", ")}`);
})();
