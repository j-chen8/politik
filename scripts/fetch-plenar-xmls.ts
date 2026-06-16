/**
 * Fetcht neue WP21-Plenarprotokoll-XMLs von bundestag.de/services/opendata.
 *
 * Mechanik:
 *   1. Listet die WP21-Filter-Liste (bundestag.de Open Data, AJAX-Endpoint)
 *   2. Vergleicht gegen lokal vorhandene Dateien in data/plenarprotokolle_xml/
 *   3. Lädt alle fehlenden herunter
 *   4. Idempotent: Re-Run lädt nur neue
 *
 * Run: npx tsx scripts/fetch-plenar-xmls.ts
 *
 * Cron-Empfehlung: Wöchentlich am Wochenende, falls neue Sitzungswochen-XMLs
 * verfügbar sind. Bundestag veröffentlicht die XMLs typischerweise wenige Tage
 * nach jeder Sitzung.
 */

import fs from "fs";
import path from "path";

const TARGET_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");
// Stand 2026-04-30: dies ist die WP21-Filter-Liste auf bundestag.de.
// Falls die Filter-Liste-ID sich ändert (neue WP, Re-Strukturierung):
// Endpoint findest du indem du auf bundestag.de/services/opendata den
// Browser-Network-Tab öffnest und nach "filterlist" filterst.
const LIST_URL =
  "https://www.bundestag.de/ajax/filterlist/de/services/opendata/1058442-1058442";

interface Entry {
  filename: string; // z.B. "21075.xml"
  url: string; // voller blob-URL
  blobId: string; // /resource/blob/<ID>/… — ändert sich bei Neu-Veröffentlichung
}

async function fetchListing(limit = 200, offset = 0): Promise<string> {
  const url = `${LIST_URL}?limit=${limit}&offset=${offset}&noFilterSet=true`;
  const res = await fetch(url, {
    headers: { "User-Agent": "politik-scrape/1.0 (+local)" },
  });
  if (!res.ok) throw new Error(`Filter-Listing HTTP ${res.status}`);
  return await res.text();
}

function parseListing(html: string): Entry[] {
  const out: Entry[] = [];
  const re = /href="(https:\/\/www\.bundestag\.de\/resource\/blob\/(\d+)\/(21\d{3}\.xml))"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push({ url: m[1], blobId: m[2], filename: m[3] });
  }
  return out;
}

async function main() {
  console.log("=== fetch-plenar-xmls (WP21) ===\n");

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const local = new Set(
    fs.readdirSync(TARGET_DIR).filter((f) => /^21\d{3}\.xml$/.test(f)),
  );
  // Blob-ID-Sidecar: pro Dateiname die zuletzt geladene Blob-ID. Bundestag
  // veröffentlicht erst eine vorläufige, später die endgültige Fassung unter
  // gleichem Dateinamen, aber NEUER Blob-ID. Ohne Vergleich blieben wir auf der
  // vorläufigen (Bug bis 2026-06-14: fehlende „zu Protokoll"-Reden, z. B. Warken/
  // Medizinregister, Sitzung 80). → re-fetch wenn Datei fehlt ODER Blob-ID neu.
  const SIDECAR = path.join(TARGET_DIR, "_blob-ids.json");
  const blobIds: Record<string, string> = fs.existsSync(SIDECAR)
    ? JSON.parse(fs.readFileSync(SIDECAR, "utf-8")) : {};
  console.log(`Lokal: ${local.size} XMLs`);

  // Pagination — Bundestag-Filter-List paginiert per offset
  const seen = new Set<string>();
  const all: Entry[] = [];
  for (let offset = 0; offset < 500; offset += 10) {
    const html = await fetchListing(10, offset);
    const entries = parseListing(html);
    if (entries.length === 0) break;
    let newCount = 0;
    for (const e of entries) {
      if (!seen.has(e.filename)) {
        seen.add(e.filename);
        all.push(e);
        newCount++;
      }
    }
    if (newCount === 0) break; // keine neuen → Ende
  }

  console.log(`Online: ${all.length} XMLs verfügbar`);
  // Neu = lokal nicht vorhanden; Geändert = vorhanden, aber Blob-ID ≠ gespeichert.
  const isNew = (e: Entry) => !local.has(e.filename);
  const isChanged = (e: Entry) => local.has(e.filename) && blobIds[e.filename] !== e.blobId;
  const toFetch = all.filter((e) => isNew(e) || isChanged(e));
  console.log(`Zu laden: ${toFetch.length} (${all.filter(isNew).length} neu, ${all.filter(isChanged).length} aktualisiert)\n`);

  if (toFetch.length === 0) {
    console.log("Alles aktuell. Nichts zu tun.");
    return;
  }

  toFetch.sort((a, b) => a.filename.localeCompare(b.filename));

  let downloaded = 0;
  const updated: string[] = []; // bereits vorhandene, jetzt aktualisierte → Re-Seed nötig
  for (const e of toFetch) {
    const target = path.join(TARGET_DIR, e.filename);
    const wasPresent = local.has(e.filename);
    process.stdout.write(`  ${e.filename}${wasPresent ? " (Update)" : ""}… `);
    try {
      const res = await fetch(e.url);
      if (!res.ok) { console.log(`FAIL HTTP ${res.status}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(target, buf);
      blobIds[e.filename] = e.blobId;
      console.log(`OK (${(buf.length / 1024).toFixed(1)} kB)`);
      downloaded++;
      if (wasPresent) updated.push(e.filename);
    } catch (err: any) {
      console.log(`ERROR ${err.message}`);
    }
  }
  fs.writeFileSync(SIDECAR, JSON.stringify(blobIds, null, 2));

  console.log(`\nFertig: ${downloaded}/${toFetch.length} heruntergeladen.`);
  if (updated.length > 0) {
    console.log(`\n⚠️  ${updated.length} aktualisierte Sitzungen — RE-SEED nötig (idempotent, fügt nur neue Reden):`);
    console.log(`   ${updated.join(", ")}`);
    console.log(`   → npx tsx scripts/extract-all-speeches.ts  (+ speaker-links, analyse, summaries-from-v2)`);
  }
}

main().catch((e) => {
  console.error("Fehler:", e);
  process.exit(1);
});
