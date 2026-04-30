/**
 * Patch-Skript für die wenigen MdBs, die unser Hauptlauf
 * (fetch-bundestag-bios.ts) nicht erfasst hat — z.B. weil sie nicht
 * im AJAX-Liste-Endpoint waren. URLs werden manuell gepflegt.
 *
 * Run: npx tsx scripts/patch-missing-bundestag-bios.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const UA = "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/120";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Manuell gepflegte URLs für die 7 MdBs, die der Hauptlauf verfehlt hat */
const MANUAL: { name: string; url: string }[] = [
  { name: "Michael Brand", url: "https://www.bundestag.de/abgeordnete/biografien/B/brand_michael-1043790" },
  { name: "Carsten Schneider", url: "https://www.bundestag.de/abgeordnete/biografien/S/schneider_carsten-1047194" },
  { name: "Michael Kaufmann", url: "https://www.bundestag.de/webarchiv/abgeordnete/biografien20/K/kaufmann_michael-860722" },
  { name: "Philip Hoffmann", url: "https://www.bundestag.de/abgeordnete/biografien/H/hoffmann_philip-1045026" },
  { name: "Jürgen Kögel", url: "https://www.bundestag.de/abgeordnete/biografien/K/koegel_juergen-1045486" },
  { name: "Jamila Anna Schäfer", url: "https://www.bundestag.de/webarchiv/abgeordnete/biografien20/S/schaefer_jamila-860330" },
  { name: "Maria-Lena Weiss", url: "https://www.bundestag.de/abgeordnete/biografien/W/weiss_maria-1049354" },
  // { name: "Jürgen Kögel", url: "..." },
  // { name: "Jamila Anna Schäfer", url: "..." },
  // { name: "Maria-Lena Weiss", url: "..." },
];

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

function extractBio(html: string): string | null {
  const sectionMatch = html.match(/<section[^>]*class="m-biography"[^>]*>([\s\S]*?)<\/section>/);
  if (!sectionMatch) return null;
  let inner = sectionMatch[1];
  inner = inner.replace(/<p[^>]*>Ausdruck aus dem Internet-Angebot[\s\S]*$/i, "");
  inner = inner.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "\n\n## $1\n");
  inner = inner.replace(/<p[^>]*>/g, "\n").replace(/<\/p>/g, "\n");
  inner = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, "- $1\n");
  inner = inner.replace(/<[^>]+>/g, " ");
  inner = decodeEntities(inner);
  inner = inner.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).join("\n");
  inner = inner.replace(/\n{3,}/g, "\n\n").trim();
  return inner.length < 100 ? null : inner;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  if (MANUAL.length === 0) {
    console.log("Keine manuellen URLs gepflegt. MANUAL-Array oben füllen.");
    db.close();
    return;
  }

  const update = db.prepare(
    "UPDATE politicians SET bundestag_bio_url = ?, bundestag_bio_text = ?, bundestag_bio_fetched_at = ? WHERE first_name || ' ' || last_name = ?"
  );

  let ok = 0,
    fail = 0;
  for (const m of MANUAL) {
    try {
      const res = await fetch(m.url, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        console.error(`  ✗ ${m.name}: HTTP ${res.status}`);
        fail++;
        continue;
      }
      const html = await res.text();
      const bio = extractBio(html);
      if (!bio) {
        console.error(`  ✗ ${m.name}: keine Bio extrahierbar`);
        fail++;
        continue;
      }
      const r = update.run(m.url, bio, new Date().toISOString(), m.name);
      if (r.changes === 0) {
        console.error(`  ✗ ${m.name}: kein DB-Match (Name unbekannt?)`);
        fail++;
        continue;
      }
      console.log(`  ✓ ${m.name} (${bio.length} chars)`);
      ok++;
    } catch (e: any) {
      console.error(`  ✗ ${m.name}: ${e.message?.slice(0, 80)}`);
      fail++;
    }
    await sleep(300);
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Erfolgreich: ${ok}`);
  console.log(`  Fehler: ${fail}`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
