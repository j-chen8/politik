/**
 * Holt Kabinett-Profile von bundesregierung.de für die Quereinsteiger-Minister
 * (und für alle Bundeskabinett-Mitglieder, die in der DB sind).
 *
 * Pipeline:
 *   1. Liste fetchen: /breg-de/bundesregierung/bundeskabinett
 *      → Profile-URL + Name
 *   2. DB-Match per Name → bundesregierung_bio_url speichern
 *   3. Pro Profile: <div class="bpa-vita"> extrahieren, <li class="bpa-vita-item">
 *      strukturiert als Plain Text
 *
 * Run: npx tsx scripts/fetch-bundesregierung-bios.ts [--refresh]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const LIST_URL = "https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett";
const UA = "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/120";
const DELAY_MS = 300;

const REFRESH = process.argv.includes("--refresh");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface BregProfile {
  url: string;
  slug: string;
  name: string;
  matchKey: string;
}

/** Liste aller Kabinett-Profile von bundesregierung.de */
async function fetchProfileList(): Promise<BregProfile[]> {
  const res = await fetch(LIST_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Liste HTTP ${res.status}`);
  const html = await res.text();

  // Pattern: href="/breg-de/bundesregierung/bundeskabinett/firstname-lastname-1234567"
  const re = /href="(\/breg-de\/bundesregierung\/bundeskabinett\/([a-z0-9-]+)-(\d+))"/g;
  const seen = new Set<string>();
  const out: BregProfile[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (seen.has(m[3])) continue;
    seen.add(m[3]);
    const slug = m[2];
    // slug like "katherina-reiche" → name "Katherina Reiche"
    const name = slug
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
      .replace(/\bAe\b/g, "Ä").replace(/\bOe\b/g, "Ö").replace(/\bUe\b/g, "Ü")
      .replace(/Baer/, "Bär");
    out.push({
      url: `https://www.bundesregierung.de${m[1]}`,
      slug,
      name,
      matchKey: name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue"),
    });
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
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
}

/** Bio-Text aus Profile-HTML extrahieren */
function extractBio(html: string): string | null {
  // Suche nach <div class="bpa-module-content"> ... <h3>Lebenslauf</h3> ... </div>
  // Robuster: alle <div class="bpa-vita"> Sections
  const sections: string[] = [];
  const sectionRe = /<div class="bpa-vita">([\s\S]*?)<\/div>\s*(?=<div class="bpa-vita">|<div class="bpa-sammlung-item"|<\/div>)/g;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(html)) !== null) {
    sections.push(m[1]);
  }

  // Wenn keine matches: Fallback alle <li class="bpa-vita-item"> einsammeln
  if (sections.length === 0) {
    const liRe = /<li class="bpa-vita-item">([\s\S]*?)<\/li>/g;
    const items: string[] = [];
    while ((m = liRe.exec(html)) !== null) items.push(m[1]);
    if (items.length === 0) return null;
    sections.push(items.join("\n"));
  }

  // Strukturiert konvertieren: <strong>JAHR</strong> <br/> TEXT → "JAHR — TEXT"
  let combined = sections.join("\n\n");

  // bpa-subtitle (Funktionstitel) erhalten
  combined = combined.replace(/<h2[^>]*class="bpa-subtitle"[^>]*>([\s\S]*?)<\/h2>/g, "\n## $1\n");
  combined = combined.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "\n## $1\n");

  // <li class="bpa-vita-item"> als Bullets
  combined = combined.replace(/<li class="bpa-vita-item">([\s\S]*?)<\/li>/g, "- $1\n");

  // <strong>X</strong><br>Y → X — Y
  combined = combined.replace(/<strong>([\s\S]*?)<\/strong>\s*<br\s*\/?>/g, "$1 — ");

  // Restliche Tags entfernen
  combined = combined.replace(/<[^>]+>/g, " ");
  combined = decodeEntities(combined);

  // Whitespace normalisieren
  combined = combined
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0)
    .join("\n");

  combined = combined.replace(/\n{3,}/g, "\n\n").trim();

  if (combined.length < 80) return null;
  return combined;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  console.log("Lade Liste der Bundeskabinett-Profile...");
  const profiles = await fetchProfileList();
  console.log(`  ${profiles.length} Profile gefunden`);

  // Match-Index: Name (lowercase, umlaut→ae normalisiert) → Profile
  const byKey = new Map<string, BregProfile>();
  for (const p of profiles) byKey.set(p.matchKey, p);

  // Politiker aus DB — wir matchen breit (alle Politiker mit `id BETWEEN 900001 AND 900011`
  // PLUS alle mit Bundestags-Mandat, da Klingbeil/Bas/Hubig etc. teilweise auch MdBs sind)
  const dbRows = db
    .prepare(
      `SELECT DISTINCT p.id, p.first_name, p.last_name, p.bundesregierung_bio_text
       FROM politicians p
       WHERE p.id BETWEEN 900001 AND 900011
          OR p.id IN (SELECT DISTINCT politician_id FROM mandates m
            JOIN parliament_periods pp ON m.parliament_period_id = pp.id
            JOIN parliaments par ON pp.parliament_id = par.id
            WHERE par.type = 'bundestag')`
    )
    .all() as { id: number; first_name: string; last_name: string; bundesregierung_bio_text: string | null }[];

  const updateUrl = db.prepare("UPDATE politicians SET bundesregierung_bio_url = ? WHERE id = ?");
  const updateBio = db.prepare(
    "UPDATE politicians SET bundesregierung_bio_text = ?, bundesregierung_bio_fetched_at = ? WHERE id = ?"
  );

  // Match
  let matched = 0;
  const toFetch: { id: number; url: string; name: string }[] = [];
  for (const r of dbRows) {
    const key = `${r.first_name} ${r.last_name}`
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");
    const profile = byKey.get(key);
    if (!profile) continue;
    matched++;
    updateUrl.run(profile.url, r.id);
    if (REFRESH || !r.bundesregierung_bio_text || r.bundesregierung_bio_text.length < 80) {
      toFetch.push({ id: r.id, url: profile.url, name: `${r.first_name} ${r.last_name}` });
    }
  }
  console.log(`Match: ${matched} ✓ (von ${dbRows.length} DB-Politikern, ${profiles.length} Profilen)`);
  console.log(`Bio-Fetch nötig: ${toFetch.length}\n`);

  // Fetch
  let ok = 0,
    miss = 0,
    fail = 0;
  for (let i = 0; i < toFetch.length; i++) {
    const t = toFetch[i];
    try {
      const res = await fetch(t.url, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        fail++;
        console.error(`  ✗ ${t.name}: HTTP ${res.status}`);
        continue;
      }
      const html = await res.text();
      const bio = extractBio(html);
      if (!bio) {
        miss++;
        console.log(`  ⚠ ${t.name}: keine Bio extrahierbar`);
      } else {
        updateBio.run(bio, new Date().toISOString(), t.id);
        ok++;
        console.log(`  ✓ ${t.name} (${bio.length} chars)`);
      }
    } catch (e: any) {
      fail++;
      console.error(`  ✗ ${t.name}: ${e.message?.slice(0, 80)}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Bio nicht extrahierbar: ${miss}`);
  console.log(`  Fehler: ${fail}`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
