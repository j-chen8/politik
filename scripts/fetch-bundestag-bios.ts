/**
 * Holt für jeden Bundestag-MdB die offizielle Biografie-Seite des Bundestags
 * und extrahiert den Bio-Text.
 *
 * Pipeline:
 *   1. AJAX-Liste fetchen: /ajax/filterlist/de/abgeordnete/biografien/...?limit=700
 *      → Profile-URL + Name pro MdB
 *   2. DB-Match per Name → bundestag_bio_url speichern
 *   3. Pro Profile-URL: HTML laden, <section class="m-biography"> extrahieren,
 *      HTML strippen → bundestag_bio_text speichern
 *
 * Run: npx tsx scripts/fetch-bundestag-bios.ts [--refresh]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const LIST_BASE = "https://www.bundestag.de/ajax/filterlist/de/abgeordnete/biografien/1040594-1040594";
const PAGE_SIZE = 12; // Server ignoriert höhere limits, liefert max 12
const UA = "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/120";
const DELAY_MS = 250; // 4 req/s — höflich gegenüber Bundestag-Server

const REFRESH = process.argv.includes("--refresh");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Name auf ASCII-vergleichbar normalisieren */
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Diacritics entfernen
    .replace(/ß/g, "ss")
    .replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[çÇ]/g, "c")
    .replace(/[„""'']/g, "") // Anführungszeichen
    .replace(/\b(von|van|der|den|zu|zur|de|la|del)\b/gi, "") // Adelszeichen
    .replace(/[^a-z0-9\s-]/g, "") // alles andere weg
    .replace(/\s+/g, " ")
    .trim();
}

/** Last-name-Key (für Fallback-Match) */
function lastNameKey(s: string): string {
  return normalizeName(s).split(" ").slice(-1)[0];
}

interface BTProfile {
  url: string;
  id: string;
  firstName: string;
  lastName: string;
  /** Lower-case "vorname nachname" für Match */
  matchKey: string;
}

/** Eine Seite der Liste fetchen */
async function fetchListPage(offset: number): Promise<{ profiles: BTProfile[]; total: number }> {
  const url = `${LIST_BASE}?limit=${PAGE_SIZE}&offset=${offset}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Liste HTTP ${res.status}`);
  const html = await res.text();

  // total aus data-hits
  const totalMatch = html.match(/data-hits="(\d+)"/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const profiles: BTProfile[] = [];
  const re = /<a\s+title="([^"]+)"\s+href="(https:\/\/www\.bundestag\.de\/abgeordnete\/biografien\/[^"]+-(\d+))"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const title = m[1].trim();
    const url = m[2];
    const id = m[3];
    const idx = title.indexOf(",");
    if (idx === -1) continue;
    const lastName = title.slice(0, idx).trim();
    const firstName = title.slice(idx + 1).trim();
    // Titel aus firstName entfernen (z.B. "Dr. Inge" → "Inge", "Prof. Dr. Karl" → "Karl")
    const cleanFirst = firstName.replace(/^(?:Prof\.?\s*)?(?:Dr\.?\s*)+/i, "").trim();
    profiles.push({
      url,
      id,
      firstName: cleanFirst,
      lastName,
      matchKey: normalizeName(`${cleanFirst} ${lastName}`),
    });
  }
  return { profiles, total };
}

/** Alle Seiten paginieren */
async function fetchAllProfiles(): Promise<BTProfile[]> {
  const all: BTProfile[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let total = 0;
  while (true) {
    const { profiles, total: t } = await fetchListPage(offset);
    if (offset === 0) total = t;
    if (profiles.length === 0) break;
    for (const p of profiles) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        all.push(p);
      }
    }
    offset += PAGE_SIZE;
    if (offset >= total) break;
    await sleep(150);
  }
  return all;
}

/** HTML der Bio-Section extrahieren und in Plain Text wandeln */
function extractBioText(html: string): string | null {
  const sectionMatch = html.match(/<section[^>]*class="m-biography"[^>]*>([\s\S]*?)<\/section>/);
  if (!sectionMatch) return null;
  let inner = sectionMatch[1];

  // Footer "Ausdruck aus dem Internet-Angebot..." abschneiden
  inner = inner.replace(/<p[^>]*>Ausdruck aus dem Internet-Angebot[\s\S]*$/i, "");

  // <h3> als Sektion-Header behalten (mit Newline)
  inner = inner.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "\n\n## $1\n");
  // <p> als Absätze
  inner = inner.replace(/<p[^>]*>/g, "\n").replace(/<\/p>/g, "\n");
  // <li>
  inner = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, "- $1\n");
  // Restliche Tags entfernen
  inner = inner.replace(/<[^>]+>/g, " ");
  // HTML-Entities decodieren (basic)
  inner = inner
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&shy;/g, "")
    .replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä").replace(/&uuml;/g, "ü")
    .replace(/&Ouml;/g, "Ö").replace(/&Auml;/g, "Ä").replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&[a-z]+;/gi, " ");
  // Whitespace normalisieren
  inner = inner.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).join("\n");
  inner = inner.replace(/\n{3,}/g, "\n\n").trim();
  if (inner.length < 100) return null;
  return inner;
}

async function fetchProfileBio(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const html = await res.text();
  return extractBioText(html);
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  console.log("Lade Liste aller MdBs vom Bundestag...");
  const profiles = await fetchAllProfiles();
  console.log(`  ${profiles.length} Profile gefunden`);

  // Index für Name-Match (full + last-name-only Fallback)
  const byMatchKey = new Map<string, BTProfile>();
  const byLastName = new Map<string, BTProfile[]>();
  for (const p of profiles) {
    byMatchKey.set(p.matchKey, p);
    const lk = lastNameKey(p.lastName);
    if (!byLastName.has(lk)) byLastName.set(lk, []);
    byLastName.get(lk)!.push(p);
  }

  // Bundestag-MdBs aus DB
  const dbRows = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.bundestag_bio_text
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE par.type = 'bundestag'`
    )
    .all() as { id: number; first_name: string; last_name: string; bundestag_bio_text: string | null }[];
  console.log(`  ${dbRows.length} MdBs in DB`);

  const updateUrl = db.prepare(
    "UPDATE politicians SET bundestag_bio_url = ? WHERE id = ?"
  );
  const updateBio = db.prepare(
    "UPDATE politicians SET bundestag_bio_text = ?, bundestag_bio_fetched_at = ? WHERE id = ?"
  );

  // Schritt 1: URL-Match (mit Fuzzy-Fallback)
  let matched = 0,
    matchedFuzzy = 0,
    nomatch = 0;
  const toFetch: { id: number; url: string; name: string }[] = [];
  // DB-Last-Name → Anzahl, damit wir nur eindeutige Last-Names per Fallback matchen
  const dbLastNameCount = new Map<string, number>();
  for (const r of dbRows) {
    const lk = lastNameKey(r.last_name);
    dbLastNameCount.set(lk, (dbLastNameCount.get(lk) ?? 0) + 1);
  }

  for (const r of dbRows) {
    const fullKey = normalizeName(`${r.first_name} ${r.last_name}`);
    let profile = byMatchKey.get(fullKey);

    // Fallback: Last-Name-only, wenn beidseitig eindeutig
    if (!profile) {
      const lk = lastNameKey(r.last_name);
      const dbCount = dbLastNameCount.get(lk) ?? 0;
      const profileCandidates = byLastName.get(lk) ?? [];
      if (dbCount === 1 && profileCandidates.length === 1) {
        profile = profileCandidates[0];
        matchedFuzzy++;
      }
    }

    if (!profile) {
      nomatch++;
      continue;
    }
    matched++;
    updateUrl.run(profile.url, r.id);
    if (REFRESH || !r.bundestag_bio_text || r.bundestag_bio_text.length < 200) {
      toFetch.push({ id: r.id, url: profile.url, name: `${r.first_name} ${r.last_name}` });
    }
  }
  console.log(`\nName-Match: ${matched} ✓ (davon ${matchedFuzzy} via Fuzzy-Fallback) · ${nomatch} kein Match`);
  console.log(`Bio-Fetch nötig: ${toFetch.length}\n`);

  // Schritt 2: Bio-Text fetchen
  let ok = 0,
    miss = 0,
    fail = 0;
  const start = Date.now();
  for (let i = 0; i < toFetch.length; i++) {
    const t = toFetch[i];
    try {
      const text = await fetchProfileBio(t.url);
      if (!text) {
        miss++;
      } else {
        updateBio.run(text, new Date().toISOString(), t.id);
        ok++;
      }
    } catch (e: any) {
      fail++;
      if (fail < 5) console.error(`  ✗ ${t.name}: ${e.message?.slice(0, 80)}`);
    }
    if ((i + 1) % 25 === 0 || i === toFetch.length - 1) {
      const pct = (((i + 1) / toFetch.length) * 100).toFixed(0);
      const elapsed = Math.round((Date.now() - start) / 1000);
      console.log(`  [${i + 1}/${toFetch.length}] ${pct}% · ok=${ok} miss=${miss} fail=${fail} · ${elapsed}s`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Leer / Section nicht gefunden: ${miss}`);
  console.log(`  Fehler: ${fail}`);

  // Coverage
  const cov = db
    .prepare(
      `SELECT
        SUM(CASE WHEN bundestag_bio_text IS NOT NULL AND length(bundestag_bio_text) > 200 THEN 1 ELSE 0 END) AS hat,
        COUNT(*) AS total
       FROM politicians p
       WHERE p.id IN (SELECT DISTINCT politician_id FROM mandates m
         JOIN parliament_periods pp ON m.parliament_period_id = pp.id
         JOIN parliaments par ON pp.parliament_id = par.id
         WHERE par.type = 'bundestag')`
    )
    .get() as { hat: number; total: number };
  console.log(`  Coverage Bundestag: ${cov.hat}/${cov.total}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
