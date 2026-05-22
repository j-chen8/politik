/**
 * Berlin-Pilot: holt Wikidata-QIDs, Fotos und Geburtsjahre für die MdL des
 * Abgeordnetenhauses von Berlin (19. WP).
 *
 * Quelle: die deutsche Wikipedia-Listenseite der 19. WP. Deren Mitglieder-
 * Tabellen nutzen das Template {{PersonZelle|Vorname|Nachname|k=Klammerzusatz}}
 * — daraus lassen sich Name, Artikel-Titel, Foto-Datei und Geburtsjahr direkt
 * ablesen. Artikel-Titel → Wikidata-QID via MediaWiki pageprops.
 *
 * (abgeordnetenwatch hat für Berlin kaum QIDs ~1/15; die Wikidata-Position P39
 * ist für die 19. WP lückenhaft ~57 % — die Listenseite deckt ~90-95 % ab.)
 *
 * Setzt:
 *   - politicians.qid_wikidata     (Voraussetzung für die CV-Pipeline)
 *   - politicians.photo_url / photo_source / photo_attribution
 *   - politicians.year_of_birth    (nur wenn bisher NULL)
 *
 * Run: npx tsx scripts/seed-berlin-wikidata.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const WIKI_API = "https://de.wikipedia.org/w/api.php";
const COMMONS_FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath";
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const LIST_PAGE = "Liste der Mitglieder des Abgeordnetenhauses von Berlin (19. Wahlperiode)";
const BERLIN_PARLIAMENT_ID_LOCAL = 2; // par.id in unserer DB
const THUMB_WIDTH = 400;
const BATCH_DELAY_MS = 350;
const RETRY_429_DELAY_MS = 8000;

const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ──

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      });
      if (res.status === 429) { await sleep(RETRY_429_DELAY_MS); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url.slice(0, 110)}`);
      return res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2000);
    }
  }
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step 1: Listenseite parsen ──

interface Member {
  first: string;
  last: string;
  articleTitle: string | null; // null = kein Wikipedia-Artikel
  imageFile: string | null;
  birthYear: number | null;
}

/** {{PersonZelle|Vorname|Nachname|k=Klammerzusatz}} → Name + Artikel-Titel. */
function parsePersonZelle(raw: string): { first: string; last: string; title: string | null } {
  const parts = raw.split("|").map((s) => s.trim());
  const first = parts[0] ?? "";
  const last = parts[1] ?? "";
  let explicit: string | null = null;
  let kVal: string | null = null;
  let noLink = false;
  for (const p of parts.slice(2)) {
    if (!p) continue;
    const km = p.match(/^k=(.+)$/);
    if (km) { kVal = km[1].trim(); continue; }
    if (/^nl=1$/.test(p)) { noLink = true; continue; }
    if (/^[a-zA-Z]+=/.test(p)) continue; // kursiv= u. a. — ignorieren
    explicit = p;                        // positionaler Param = expliziter Titel
  }
  let title: string | null = `${first} ${last}`;
  if (noLink) title = null;
  else if (explicit) title = explicit;
  else if (kVal) title = `${first} ${last} (${kVal})`;
  return { first, last, title };
}

async function fetchMembers(): Promise<Member[]> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(LIST_PAGE)}&prop=wikitext&format=json&formatversion=2`;
  const wt: string = (await fetchJson(url)).parse?.wikitext ?? "";
  const start = wt.indexOf("== Abgeordnete ==");
  const end = wt.indexOf("== Weblinks ==");
  const section = wt.slice(start < 0 ? 0 : start, end < 0 ? wt.length : end);

  const members: Member[] = [];
  for (const row of section.split(/\n\|-/)) {
    const pz = row.match(/\{\{PersonZelle\|([^}]*)\}\}/);
    if (!pz) continue;
    const { first, last, title } = parsePersonZelle(pz[1]);
    if (!first || !last) continue;

    const datei = row.match(/\[\[(?:Datei|File):([^|\]]+)/i);
    const imageFile = datei ? datei[1].trim() : null;

    // Zelle direkt nach PersonZelle = Lebensdaten → Geburtsjahr
    const after = row.slice(row.indexOf(pz[0]) + pz[0].length).split("||")[1] ?? "";
    const ym = after.match(/\b(19\d\d|20[01]\d)\b/);
    const birthYear = ym ? parseInt(ym[1], 10) : null;

    members.push({ first, last, articleTitle: title, imageFile, birthYear });
  }
  return members;
}

// ── Step 2: Artikel-Titel → Wikidata-QID ──

async function titlesToQids(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const url = `${WIKI_API}?action=query&prop=pageprops&ppprop=wikibase_item` +
      `&titles=${encodeURIComponent(batch.join("|"))}&redirects=1&format=json&formatversion=2`;
    const q = (await fetchJson(url)).query ?? {};
    const alias = new Map<string, string>();
    for (const n of q.normalized ?? []) alias.set(n.from, n.to);
    for (const r of q.redirects ?? []) alias.set(r.from, r.to);
    const resolve = (t: string): string => {
      let cur = t;
      const seen = new Set<string>();
      while (alias.has(cur) && !seen.has(cur)) { seen.add(cur); cur = alias.get(cur)!; }
      return cur;
    };
    const pageQid = new Map<string, string>();
    for (const p of q.pages ?? []) {
      if (p.pageprops?.wikibase_item) pageQid.set(p.title, p.pageprops.wikibase_item);
    }
    for (const t of batch) {
      const qid = pageQid.get(resolve(t));
      if (qid) out.set(t, qid);
    }
    await sleep(300);
  }
  return out;
}

// ── Matching: Listenseite → lokale MdL ──

interface LocalPolitician {
  id: number;
  first_name: string;
  last_name: string;
  year_of_birth: number | null;
}

function matchMembers(
  locals: LocalPolitician[],
  members: Member[]
): { matches: Map<number, Member>; unmatched: LocalPolitician[] } {
  const byFull = new Map<string, Member[]>();
  const byLast = new Map<string, Member[]>(); // indiziert auf JEDES Nachnamens-Wort
  for (const m of members) {
    const key = normalize(`${m.first} ${m.last}`);
    if (!key) continue;
    (byFull.get(key) ?? byFull.set(key, []).get(key)!).push(m);
    for (const w of normalize(m.last).split(" ")) {
      if (w) (byLast.get(w) ?? byLast.set(w, []).get(w)!).push(m);
    }
  }

  const matches = new Map<number, Member>();
  const unmatched: LocalPolitician[] = [];
  const used = new Set<Member>();

  for (const loc of locals) {
    const full = normalize(`${loc.first_name} ${loc.last_name}`);
    let cands = (byFull.get(full) ?? []).filter((c) => !used.has(c));
    if (cands.length === 0) {
      // Fallback: Vorname-Anfang gleich + irgendein Nachnamens-Wort teilt sich
      // (deckt Doppelnamen-Varianten ab, z. B. „Pieroth" vs. „Pieroth-Manelli").
      const fw = normalize(loc.first_name).split(" ")[0];
      const seen = new Set<Member>();
      cands = [];
      for (const w of normalize(loc.last_name).split(" ")) {
        for (const c of byLast.get(w) ?? []) {
          if (used.has(c) || seen.has(c)) continue;
          if (normalize(c.first).split(" ")[0] === fw) { seen.add(c); cands.push(c); }
        }
      }
    }
    if (cands.length >= 1) {
      matches.set(loc.id, cands[0]);
      used.add(cands[0]);
    } else {
      unmatched.push(loc);
    }
  }
  return { matches, unmatched };
}

// ── Foto-Download ──

async function downloadPhoto(localId: number, file: string): Promise<boolean> {
  const target = path.join(PHOTOS_DIR, `${localId}.jpg`);
  const url = `${COMMONS_FILEPATH}/${encodeURIComponent(file)}?width=${THUMB_WIDTH}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      fs.writeFileSync(target, await fetchBuffer(url));
      return true;
    } catch (e: any) {
      if (e.message?.includes("429") && attempt === 0) { await sleep(RETRY_429_DELAY_MS); continue; }
      console.log(`\n  ✗ #${localId} (${file}): ${e.message}`);
      return false;
    }
  }
  return false;
}

// ── Main ──

async function main() {
  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const locals = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.year_of_birth
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ?`
    )
    .all(BERLIN_PARLIAMENT_ID_LOCAL) as LocalPolitician[];
  console.log(`\n${locals.length} lokale MdL (Abgeordnetenhaus Berlin)`);

  console.log("→ Step 1/3: Wikipedia-Listenseite parsen…");
  const members = await fetchMembers();
  console.log(`  ${members.length} Mitglieder-Zeilen extrahiert`);

  const { matches, unmatched } = matchMembers(locals, members);
  const withArticle = Array.from(matches.values()).filter((m) => m.articleTitle).length;
  const withImage = Array.from(matches.values()).filter((m) => m.imageFile).length;
  console.log(`  Matching: ${matches.size}/${locals.length} — ${withArticle} mit Artikel, ${withImage} mit Foto`);

  console.log("→ Step 2/3: Artikel → Wikidata-QID…");
  const titles = Array.from(
    new Set(Array.from(matches.values(), (m) => m.articleTitle).filter((t): t is string => !!t))
  );
  const titleQid = await titlesToQids(titles);
  console.log(`  ${titleQid.size}/${titles.length} Artikel mit QID`);

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] QIDs: ${titleQid.size}, Fotos: ${withImage}, Geburtsjahre verfügbar.`);
    console.log("── Ohne Match (alle) ──");
    for (const u of unmatched) console.log(`  ${u.first_name} ${u.last_name}`);
    db.close();
    return;
  }

  // QID + Geburtsjahr schreiben
  const updQid = db.prepare("UPDATE politicians SET qid_wikidata = ? WHERE id = ?");
  const updBirth = db.prepare("UPDATE politicians SET year_of_birth = ? WHERE id = ? AND year_of_birth IS NULL");
  let qidCount = 0, birthCount = 0;
  db.transaction(() => {
    for (const [pid, m] of matches) {
      const qid = m.articleTitle ? titleQid.get(m.articleTitle) : undefined;
      if (qid) { updQid.run(qid, pid); qidCount++; }
      if (m.birthYear && updBirth.run(m.birthYear, pid).changes > 0) birthCount++;
    }
  })();
  console.log(`\n→ ${qidCount} QIDs gespeichert, ${birthCount} Geburtsjahre ergänzt`);

  // Fotos laden
  const photoJobs = Array.from(matches, ([id, m]) => ({ id, file: m.imageFile }))
    .filter((j): j is { id: number; file: string } => !!j.file);
  console.log(`→ Step 3/3: Download von ${photoJobs.length} Fotos (${THUMB_WIDTH}px)…`);
  const updPhoto = db.prepare(
    `UPDATE politicians SET photo_url = ?, photo_source = 'wikimedia_commons', photo_attribution = ? WHERE id = ?`
  );
  let ok = 0, fail = 0, skip = 0;
  for (const { id, file } of photoJobs) {
    const target = path.join(PHOTOS_DIR, `${id}.jpg`);
    let have = fs.existsSync(target) && fs.statSync(target).size > 1000;
    if (!have) {
      have = await downloadPhoto(id, file);
      if (have) ok++; else fail++;
      await sleep(BATCH_DELAY_MS);
    } else {
      skip++;
    }
    if (have) updPhoto.run(`/photos/${id}.jpg`, `Wikimedia Commons: ${file}`, id);
    process.stdout.write(`\r  ok=${ok} skip=${skip} fail=${fail}`);
  }
  process.stdout.write("\n");

  console.log("\n=== Fertig ===");
  console.log(`  QIDs:        ${qidCount}/${locals.length}`);
  console.log(`  Fotos:       ${ok + skip} (${ok} neu, ${skip} vorhanden, ${fail} Fehler)`);
  console.log(`  Geburtsjahr: +${birthCount}`);
  console.log(`  Ohne Match:  ${unmatched.length}`);
  if (unmatched.length) {
    console.log("  " + unmatched.map((u) => `${u.first_name} ${u.last_name}`).join(", "));
  }

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
