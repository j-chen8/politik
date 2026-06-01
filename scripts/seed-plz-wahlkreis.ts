/**
 * PLZ → Wahlkreis-Verschnitt (Bundestag + Berlin AGH).
 *
 * Erzeugt die statische Tabelle `plz_wahlkreis` durch geometrischen Verschnitt
 * von PLZ-Polygonen mit Wahlkreis-Polygonen. Keine laufenden Kosten, kein LLM,
 * einmaliger Lauf.
 *
 * Methodik (bewusst transparent):
 *   - PLZ- und Wahlkreis-Grenzen sind NICHT deckungsgleich. Eine PLZ kann in
 *     mehreren Wahlkreisen liegen. Wir bilden das EHRLICH ab: pro (plz, wkr)
 *     eine Zeile mit `flaechenanteil` (0..1 = Anteil der PLZ-Fläche im WK).
 *   - Kein stilles Raten eines „dominanten" WK (anders als abgeordnetenwatch).
 *   - Slivers (Mess-/Generalisierungsrauschen an Grenzen) werden per
 *     MIN_SHARE verworfen.
 *
 * Quellen:
 *   - Bundestags-Wahlkreise 2025: Die Bundeswahlleiterin, DL-DE-BY-2.0,
 *     Shapefile WGS84, Felder WKR_NR (1..299) + WKR_NAME.
 *   - PLZ-Polygone: suche-postleitzahl.org (OSM-abgeleitet), ODbL,
 *     GitHub-Mirror tdudek/de-plz-geojson, plz-5stellig.geojson.
 *   - Berlin AGH-Wahlkreise 2021: Amt für Statistik Berlin-Brandenburg, CC-BY.
 *
 * Join-Key zu `mandates.constituency`: die führende Wahlkreis-Nummer
 *   (z. B. "92 - Köln I (Bundestag 2025 - 2029)" → 92 = WKR_NR).
 *
 * Run: npx tsx scripts/seed-plz-wahlkreis.ts [--source bundestag|berlin] [--dry]
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as shapefile from "shapefile";
import * as turf from "@turf/turf";
import type { Feature, Polygon, MultiPolygon, BBox } from "geojson";

const DB_PATH = path.join(process.cwd(), "politik.db");
const GEO_DIR = path.join(process.cwd(), "data/geo");

// Flächenanteil unterhalb dessen eine Überlappung als Sliver verworfen wird.
const MIN_SHARE = 0.01; // 1 %

type WkFeature = {
  wkrNr: number;
  wkrName: string;
  feature: Feature<Polygon | MultiPolygon>;
  bbox: BBox;
};

type SourceConfig = {
  parlament: string;
  shpPath: string;
  dbfPath: string;
  /** Liest WKR-Nr + Name aus den Shapefile-Properties. */
  readWk: (props: Record<string, unknown>) => { wkrNr: number; wkrName: string };
};

const SOURCES: Record<string, SourceConfig> = {
  bundestag: {
    parlament: "bundestag",
    shpPath: path.join(GEO_DIR, "btw25_wk_shp/btw25_geometrie_wahlkreise_shp_geo.shp"),
    dbfPath: path.join(GEO_DIR, "btw25_wk_shp/btw25_geometrie_wahlkreise_shp_geo.dbf"),
    readWk: (p) => ({ wkrNr: Number(p.WKR_NR), wkrName: String(p.WKR_NAME) }),
  },
  // Berlin wird ergänzt, sobald die Geometrie-Quelle final ist (eigenes Feldschema).
};

function bboxOverlap(a: BBox, b: BBox): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

async function loadWahlkreise(cfg: SourceConfig): Promise<WkFeature[]> {
  const collection = await shapefile.read(cfg.shpPath, cfg.dbfPath, { encoding: "utf-8" });
  const out: WkFeature[] = [];
  for (const f of collection.features) {
    if (!f.geometry) continue;
    const { wkrNr, wkrName } = cfg.readWk(f.properties as Record<string, unknown>);
    if (!Number.isFinite(wkrNr)) continue;
    const feature = turf.feature(f.geometry) as Feature<Polygon | MultiPolygon>;
    out.push({ wkrNr, wkrName, feature, bbox: turf.bbox(feature) });
  }
  return out;
}

async function run() {
  const args = process.argv.slice(2);
  const sourceKey = (() => {
    const i = args.indexOf("--source");
    return i >= 0 ? args[i + 1] : "bundestag";
  })();
  const dry = args.includes("--dry");

  const cfg = SOURCES[sourceKey];
  if (!cfg) {
    console.error(`Unbekannte Quelle '${sourceKey}'. Verfügbar: ${Object.keys(SOURCES).join(", ")}`);
    process.exit(1);
  }

  console.log(`▸ Quelle: ${cfg.parlament}`);
  const wks = await loadWahlkreise(cfg);
  console.log(`  ${wks.length} Wahlkreise geladen (WKR_NR ${Math.min(...wks.map((w) => w.wkrNr))}–${Math.max(...wks.map((w) => w.wkrNr))})`);

  const plzGeojson = JSON.parse(
    fs.readFileSync(path.join(GEO_DIR, "plz-5stellig.geojson"), "utf-8"),
  ) as { features: Array<Feature<Polygon | MultiPolygon, { plz: string }>> };
  console.log(`  ${plzGeojson.features.length} PLZ-Polygone geladen`);

  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS plz_wahlkreis (
      plz            TEXT NOT NULL,
      parlament      TEXT NOT NULL,
      wkr_nr         INTEGER NOT NULL,
      wkr_name       TEXT,
      flaechenanteil REAL NOT NULL,
      PRIMARY KEY (plz, parlament, wkr_nr)
    );
    CREATE INDEX IF NOT EXISTS idx_plz_wahlkreis_lookup ON plz_wahlkreis(plz, parlament);
  `);

  const insert = db.prepare(
    `INSERT OR REPLACE INTO plz_wahlkreis (plz, parlament, wkr_nr, wkr_name, flaechenanteil)
     VALUES (?, ?, ?, ?, ?)`,
  );

  let plzMatched = 0;
  let plzUnmatched = 0;
  let multiWk = 0;
  let rows = 0;
  let intersectErrors = 0;
  const unmatchedSample: string[] = [];

  const tx = db.transaction((rowsToWrite: Array<[string, number, string, number]>) => {
    for (const [plz, wkrNr, wkrName, share] of rowsToWrite) {
      insert.run(plz, cfg.parlament, wkrNr, wkrName, share);
    }
  });

  if (!dry) db.prepare(`DELETE FROM plz_wahlkreis WHERE parlament = ?`).run(cfg.parlament);

  let processed = 0;
  for (const plzFeat of plzGeojson.features) {
    processed++;
    if (processed % 1000 === 0) process.stdout.write(`  …${processed}/${plzGeojson.features.length}\r`);
    const plz = plzFeat.properties?.plz;
    if (!plz || !plzFeat.geometry) continue;

    const plzFeature = turf.feature(plzFeat.geometry) as Feature<Polygon | MultiPolygon>;
    const plzBbox = turf.bbox(plzFeature);
    let plzArea: number;
    try {
      plzArea = turf.area(plzFeature);
    } catch {
      continue;
    }
    if (plzArea <= 0) continue;

    const pieces: Array<[number, string, number]> = []; // wkrNr, wkrName, share
    for (const wk of wks) {
      if (!bboxOverlap(plzBbox, wk.bbox)) continue;
      let inter: Feature<Polygon | MultiPolygon> | null = null;
      try {
        inter = turf.intersect(turf.featureCollection([plzFeature, wk.feature]));
      } catch {
        // Fallback: grobe Mitgliedschaft, falls Verschnitt an kaputter Geometrie scheitert.
        try {
          if (turf.booleanIntersects(plzFeature, wk.feature)) {
            intersectErrors++;
            pieces.push([wk.wkrNr, wk.wkrName, NaN]);
          }
        } catch {
          intersectErrors++;
        }
        continue;
      }
      if (!inter) continue;
      const share = turf.area(inter) / plzArea;
      if (share >= MIN_SHARE) pieces.push([wk.wkrNr, wk.wkrName, share]);
    }

    if (pieces.length === 0) {
      plzUnmatched++;
      if (unmatchedSample.length < 20) unmatchedSample.push(plz);
      continue;
    }
    plzMatched++;
    if (pieces.length > 1) multiWk++;
    pieces.sort((a, b) => (b[2] || 0) - (a[2] || 0));
    for (const [wkrNr, wkrName, share] of pieces) {
      rows++;
      if (!dry) tx([[plz, wkrNr, wkrName, share]]);
    }
  }

  db.close();
  console.log("\n──── Ergebnis ────");
  console.log(`  PLZ mit Zuordnung:   ${plzMatched}`);
  console.log(`  PLZ ohne Zuordnung:  ${plzUnmatched}${unmatchedSample.length ? ` (z. B. ${unmatchedSample.slice(0, 10).join(", ")})` : ""}`);
  console.log(`  davon mehrdeutig:    ${multiWk} (PLZ über >1 Wahlkreis)`);
  console.log(`  Zeilen geschrieben:  ${rows}${dry ? " (DRY-RUN, nichts geschrieben)" : ""}`);
  if (intersectErrors) console.log(`  ⚠ Verschnitt-Fehler: ${intersectErrors} (Fallback/booleanIntersects)`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
