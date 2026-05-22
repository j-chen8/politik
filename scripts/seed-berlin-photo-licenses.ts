/**
 * Berlin-Pilot: ergänzt photo_author / photo_license / photo_license_url für
 * die Berliner MdL-Fotos aus den Wikimedia-Commons-Metadaten (extmetadata).
 *
 * seed-berlin-wikidata.ts lädt die Fotos und setzt photo_attribution, aber
 * nicht die Lizenz-/Urheber-Felder — die brauchen je einen Commons-API-Abruf.
 * Ohne sichtbare Attribution wäre die Anzeige eines CC-Fotos ein Lizenzverstoß.
 *
 * Idempotent (nur Fotos ohne photo_author). Run:
 *   npx tsx scripts/seed-berlin-photo-licenses.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "politik-radar/1.0 (Kontakt: chenjinsheng@proton.me)";
const BERLIN_PARLIAMENT_ID = 2;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** HTML/Entities aus dem Commons-Artist-Feld entfernen. */
function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;.])/g, "$1") // Leerzeichen vor Satzzeichen entfernen
    .replace(/[;,\s]+$/, "")      // Trailing-Satzzeichen entfernen
    .trim();
}

/** Commons-Titel-Schlüssel: "File:"-Präfix weg, Unterstriche → Leerzeichen. */
function fileKey(title: string): string {
  return title.replace(/^File:/i, "").replace(/_/g, " ").trim();
}

async function fetchJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 429) { await sleep(8000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2500);
    }
  }
}

interface PhotoMeta {
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
}

async function fetchMeta(filenames: string[]): Promise<Map<string, PhotoMeta>> {
  const out = new Map<string, PhotoMeta>();
  for (let i = 0; i < filenames.length; i += 50) {
    const batch = filenames.slice(i, i + 50);
    const titles = batch.map((f) => `File:${f}`).join("|");
    const url = `${COMMONS_API}?action=query&prop=imageinfo&iiprop=extmetadata` +
      `&titles=${encodeURIComponent(titles)}&format=json&formatversion=2`;
    const data = await fetchJson(url);
    for (const pg of data?.query?.pages ?? []) {
      if (pg.missing) continue;
      const em = (pg.imageinfo ?? [{}])[0]?.extmetadata ?? {};
      const author = em.Artist?.value ? cleanText(em.Artist.value) : null;
      const license = em.LicenseShortName?.value ? cleanText(em.LicenseShortName.value) : null;
      const licenseUrl = em.LicenseUrl?.value ? cleanText(em.LicenseUrl.value) : null;
      out.set(fileKey(pg.title), { author, license, licenseUrl });
    }
    process.stdout.write(`\r  [${Math.min(i + 50, filenames.length)}/${filenames.length}] Metadaten geholt`);
    if (i + 50 < filenames.length) await sleep(400);
  }
  process.stdout.write("\n");
  return out;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  const rows = db.prepare(
    `SELECT DISTINCT p.id, p.photo_attribution
     FROM politicians p
     JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
     JOIN parliament_periods pp ON m.parliament_period_id = pp.id
     WHERE pp.parliament_id = ?
       AND p.photo_url IS NOT NULL
       AND p.photo_attribution LIKE 'Wikimedia Commons: %'
       AND p.photo_author IS NULL`
  ).all(BERLIN_PARLIAMENT_ID) as { id: number; photo_attribution: string }[];

  console.log(`${rows.length} Berliner Fotos ohne Lizenz-Metadaten`);
  if (rows.length === 0) { console.log("Nichts zu tun."); db.close(); return; }

  const byFile = new Map<string, number>(); // fileKey → politician id
  for (const r of rows) {
    byFile.set(fileKey(r.photo_attribution.replace(/^Wikimedia Commons:\s*/, "")), r.id);
  }

  console.log("→ Commons-Metadaten abrufen…");
  const meta = await fetchMeta([...byFile.keys()]);

  const update = db.prepare(
    `UPDATE politicians SET photo_author = ?, photo_license = ?, photo_license_url = ? WHERE id = ?`
  );
  let withAuthor = 0, withLicense = 0, noMeta = 0;
  const tx = db.transaction(() => {
    for (const [key, pid] of byFile) {
      const m = meta.get(key);
      if (!m) { noMeta++; continue; }
      update.run(m.author, m.license, m.licenseUrl, pid);
      if (m.author) withAuthor++;
      if (m.license) withLicense++;
    }
  });
  tx();

  console.log(`\n=== Fertig ===`);
  console.log(`  Urheber gesetzt:  ${withAuthor}/${rows.length}`);
  console.log(`  Lizenz gesetzt:   ${withLicense}/${rows.length}`);
  if (noMeta) console.log(`  ohne Commons-Treffer: ${noMeta}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
