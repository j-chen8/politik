/**
 * Seed script: fetches all Gesetzgebungs-Vorgänge (WP21) from the DIP v1 API
 * including their Vorgangspositionen (Verfahrensschritte) and stores them in
 * dip_vorgaenge / dip_vorgang_positionen.
 *
 * Purpose: amtlicher Verfahrensstand pro Gesetzentwurf (beratungsstand wie
 * "Überwiesen", "Verkündet") plus die Schritt-Timeline (1. Beratung,
 * Überweisung, Beschlussempfehlung, 2./3. Beratung, Bundesrat, Verkündung).
 *
 * Join auf unsere Drucksachen: dip_vorgang_positionen.dokumentnummer ist
 * ungepaddet ("21/538") wie drucksache_instrument/drucksache_texts/
 * bundestag_votes. ⚠️ Immer dokumentart='Drucksache' AND herausgeber='BT'
 * mitfiltern — Plenarprotokolle teilen denselben Nummernraum ("21/15").
 * Convenience-View: dip_ds_vorgaenge (drucksache_nr ↔ vorgang_id, n:m).
 *
 * Idempotent (Upsert per id), gratis, Voll-Sweep pro Lauf (~33 Requests).
 * Run with: npx tsx scripts/seed-dip-vorgaenge.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

// Load .env if present
const envPath = path.join(process.cwd(), ".env");
const fs = require("fs");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DIP_API_KEY = process.env.DIP_API_KEY ?? "";
if (!DIP_API_KEY) {
  console.error("DIP_API_KEY missing — set in .env (Bundestag DIP-API)");
  process.exit(1);
}

const API_BASE = "https://search.dip.bundestag.de/api/v1";
const WAHLPERIODE = "21";
const VORGANGSTYP = "Gesetzgebung";
const DELAY_MS = 250;
const MAX_RETRIES = 4;

interface DipPage {
  numFound: number;
  cursor: string;
  documents: any[];
}

async function fetchPage(resource: string, cursor?: string): Promise<DipPage> {
  const url = new URL(`${API_BASE}/${resource}`);
  url.searchParams.set("apikey", DIP_API_KEY);
  url.searchParams.set("f.vorgangstyp", VORGANGSTYP);
  url.searchParams.set("f.wahlperiode", WAHLPERIODE);
  if (cursor) url.searchParams.set("cursor", cursor);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url.toString(), {
      headers: {
        Origin: "https://dip.bundestag.de",
        Referer: "https://dip.bundestag.de/",
      },
    });
    if (res.ok) return (await res.json()) as DipPage;

    // Rate-Limit (DIP drosselt gelegentlich, vgl. fetch-missing-ds-titles)
    const wait = res.status === 429 ? 5000 * (attempt + 1) : 1500 * (attempt + 1);
    console.warn(`  HTTP ${res.status} auf ${resource} — Retry in ${wait}ms`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error(`DIP API ${resource} failed after ${MAX_RETRIES} retries`);
}

async function sweep(resource: string, onPage: (docs: any[]) => void): Promise<number> {
  let cursor: string | undefined;
  let total = 0;
  let numFound = -1;
  for (;;) {
    const page = await fetchPage(resource, cursor);
    if (numFound === -1) {
      numFound = page.numFound;
      console.log(`  ${resource}: ${numFound} Dokumente erwartet`);
    }
    if (page.documents.length === 0 || page.cursor === cursor) break;
    onPage(page.documents);
    total += page.documents.length;
    cursor = page.cursor;
    process.stdout.write(`\r  ${total}/${numFound}`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log(`\r  ${total}/${numFound} geladen`);
  if (total < numFound) {
    console.warn(`  ⚠️ ${numFound - total} Dokumente fehlen (Cursor endete früh)`);
  }
  return total;
}

const asJson = (v: unknown) => (v == null ? null : JSON.stringify(v));
const asBool = (v: unknown) => (v == null ? null : v ? 1 : 0);

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS dip_vorgaenge (
      id TEXT PRIMARY KEY,
      vorgangstyp TEXT NOT NULL,
      wahlperiode INTEGER,
      titel TEXT,
      abstract TEXT,
      beratungsstand TEXT,
      initiative_json TEXT,
      sachgebiet_json TEXT,
      zustimmungsbeduerftigkeit_json TEXT,
      gesta TEXT,
      verkuendung_json TEXT,
      inkrafttreten_json TEXT,
      datum TEXT,
      aktualisiert TEXT,
      raw_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dip_vorgang_positionen (
      id TEXT PRIMARY KEY,
      vorgang_id TEXT NOT NULL,
      vorgangsposition TEXT NOT NULL,
      zuordnung TEXT,
      gang INTEGER,
      fortsetzung INTEGER,
      nachtrag INTEGER,
      datum TEXT,
      dokumentart TEXT,
      dokumentnummer TEXT,
      herausgeber TEXT,
      urheber_json TEXT,
      ueberweisung_json TEXT,
      beschluss_json TEXT,
      fundstelle_json TEXT,
      raw_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dip_pos_vorgang ON dip_vorgang_positionen(vorgang_id);
    CREATE INDEX IF NOT EXISTS idx_dip_pos_doknr ON dip_vorgang_positionen(dokumentnummer);

    -- n:m Drucksache↔Vorgang, nur BT-Drucksachen (Protokolle teilen den Nummernraum)
    CREATE VIEW IF NOT EXISTS dip_ds_vorgaenge AS
    SELECT DISTINCT dokumentnummer AS drucksache_nr, vorgang_id
    FROM dip_vorgang_positionen
    WHERE dokumentart = 'Drucksache' AND herausgeber = 'BT';
  `);

  const upsertVorgang = db.prepare(`
    INSERT INTO dip_vorgaenge (id, vorgangstyp, wahlperiode, titel, abstract, beratungsstand,
      initiative_json, sachgebiet_json, zustimmungsbeduerftigkeit_json, gesta,
      verkuendung_json, inkrafttreten_json, datum, aktualisiert, raw_json, fetched_at)
    VALUES (@id, @vorgangstyp, @wahlperiode, @titel, @abstract, @beratungsstand,
      @initiative_json, @sachgebiet_json, @zustimmungsbeduerftigkeit_json, @gesta,
      @verkuendung_json, @inkrafttreten_json, @datum, @aktualisiert, @raw_json, @fetched_at)
    ON CONFLICT(id) DO UPDATE SET
      titel=excluded.titel, abstract=excluded.abstract, beratungsstand=excluded.beratungsstand,
      initiative_json=excluded.initiative_json, sachgebiet_json=excluded.sachgebiet_json,
      zustimmungsbeduerftigkeit_json=excluded.zustimmungsbeduerftigkeit_json, gesta=excluded.gesta,
      verkuendung_json=excluded.verkuendung_json, inkrafttreten_json=excluded.inkrafttreten_json,
      datum=excluded.datum, aktualisiert=excluded.aktualisiert,
      raw_json=excluded.raw_json, fetched_at=excluded.fetched_at
  `);

  const upsertPosition = db.prepare(`
    INSERT INTO dip_vorgang_positionen (id, vorgang_id, vorgangsposition, zuordnung, gang,
      fortsetzung, nachtrag, datum, dokumentart, dokumentnummer, herausgeber,
      urheber_json, ueberweisung_json, beschluss_json, fundstelle_json, raw_json, fetched_at)
    VALUES (@id, @vorgang_id, @vorgangsposition, @zuordnung, @gang,
      @fortsetzung, @nachtrag, @datum, @dokumentart, @dokumentnummer, @herausgeber,
      @urheber_json, @ueberweisung_json, @beschluss_json, @fundstelle_json, @raw_json, @fetched_at)
    ON CONFLICT(id) DO UPDATE SET
      vorgang_id=excluded.vorgang_id, vorgangsposition=excluded.vorgangsposition,
      zuordnung=excluded.zuordnung, gang=excluded.gang, fortsetzung=excluded.fortsetzung,
      nachtrag=excluded.nachtrag, datum=excluded.datum, dokumentart=excluded.dokumentart,
      dokumentnummer=excluded.dokumentnummer, herausgeber=excluded.herausgeber,
      urheber_json=excluded.urheber_json, ueberweisung_json=excluded.ueberweisung_json,
      beschluss_json=excluded.beschluss_json, fundstelle_json=excluded.fundstelle_json,
      raw_json=excluded.raw_json, fetched_at=excluded.fetched_at
  `);

  return { db, upsertVorgang, upsertPosition };
}

async function run() {
  console.log("🏛️  DIP Gesetzgebungs-Vorgänge Seed (WP21)");
  console.log("═".repeat(50));
  const { db, upsertVorgang, upsertPosition } = main();
  const fetchedAt = new Date().toISOString();

  console.log("1/2 Vorgänge …");
  const vorgangIds = new Set<string>();
  await sweep("vorgang", (docs) => {
    const tx = db.transaction((rows: any[]) => {
      for (const v of rows) {
        if (v.vorgangstyp !== VORGANGSTYP) continue; // Filter-Drift-Guard
        vorgangIds.add(String(v.id));
        upsertVorgang.run({
          id: String(v.id),
          vorgangstyp: v.vorgangstyp,
          wahlperiode: v.wahlperiode ?? null,
          titel: v.titel ?? null,
          abstract: v.abstract ?? null,
          beratungsstand: v.beratungsstand ?? null,
          initiative_json: asJson(v.initiative),
          sachgebiet_json: asJson(v.sachgebiet),
          zustimmungsbeduerftigkeit_json: asJson(v.zustimmungsbeduerftigkeit),
          gesta: v.gesta ?? null,
          verkuendung_json: asJson(v.verkuendung),
          inkrafttreten_json: asJson(v.inkrafttreten),
          datum: v.datum ?? null,
          aktualisiert: v.aktualisiert ?? null,
          raw_json: JSON.stringify(v),
          fetched_at: fetchedAt,
        });
      }
    });
    tx(docs);
  });

  console.log("2/2 Vorgangspositionen …");
  let orphans = 0;
  await sweep("vorgangsposition", (docs) => {
    const tx = db.transaction((rows: any[]) => {
      for (const p of rows) {
        if (p.vorgangstyp !== VORGANGSTYP) continue;
        if (!vorgangIds.has(String(p.vorgang_id))) {
          orphans++;
          continue;
        }
        const f = p.fundstelle ?? {};
        upsertPosition.run({
          id: String(p.id),
          vorgang_id: String(p.vorgang_id),
          vorgangsposition: p.vorgangsposition ?? "",
          zuordnung: p.zuordnung ?? null,
          gang: asBool(p.gang),
          fortsetzung: asBool(p.fortsetzung),
          nachtrag: asBool(p.nachtrag),
          datum: p.datum ?? null,
          dokumentart: f.dokumentart ?? p.dokumentart ?? null,
          dokumentnummer: f.dokumentnummer ?? null,
          herausgeber: f.herausgeber ?? null,
          urheber_json: asJson(p.urheber),
          ueberweisung_json: asJson(p.ueberweisung),
          beschluss_json: asJson(p.beschluss),
          fundstelle_json: asJson(p.fundstelle),
          raw_json: JSON.stringify(p),
          fetched_at: fetchedAt,
        });
      }
    });
    tx(docs);
  });
  if (orphans > 0) {
    console.warn(`  ⚠️ ${orphans} Positionen ohne bekannten Vorgang übersprungen`);
  }

  // Verifikations-Report
  console.log("\nVerifikation");
  console.log("─".repeat(50));
  const stats = db
    .prepare(
      `SELECT beratungsstand, COUNT(*) n FROM dip_vorgaenge GROUP BY 1 ORDER BY 2 DESC`
    )
    .all() as { beratungsstand: string; n: number }[];
  for (const s of stats) console.log(`  ${String(s.n).padStart(4)}  ${s.beratungsstand}`);

  const cov = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM drucksache_instrument WHERE instrument='gesetzentwurf') AS ge_total,
         (SELECT COUNT(*) FROM drucksache_instrument di WHERE instrument='gesetzentwurf'
            AND EXISTS (SELECT 1 FROM dip_ds_vorgaenge v WHERE v.drucksache_nr = di.drucksache_nr)) AS ge_mit_vorgang`
    )
    .get() as { ge_total: number; ge_mit_vorgang: number };
  console.log(
    `\n  Gesetzentwürfe mit Vorgang: ${cov.ge_mit_vorgang}/${cov.ge_total}` +
      ` (${((100 * cov.ge_mit_vorgang) / cov.ge_total).toFixed(1)}%)`
  );

  const posStats = db
    .prepare(
      `SELECT COUNT(*) n, COUNT(DISTINCT vorgang_id) v FROM dip_vorgang_positionen`
    )
    .get() as { n: number; v: number };
  console.log(`  Positionen: ${posStats.n} über ${posStats.v} Vorgänge`);

  db.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
