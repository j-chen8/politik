/**
 * Befüllt `dip_ds_titles` für ALLE WP21-Bundestags-Drucksachen per
 * DIP-Bulk-API (Cursor-Pagination) — nicht nur für die Gesetzentwurfs-
 * Vorgänge wie bisher. Damit bekommen ~2.000 Drucksachen ohne
 * abgeordnetenwatch-Thema (v. a. Antworten auf Kleine Anfragen,
 * Unterrichtungen, Beschlussempfehlungen) ihren amtlichen Titel,
 * statt im UI als "Drucksache 21/XXXX" zu erscheinen.
 *
 * Jeder Titel wird unter BEIDEN Nummern-Schreibweisen abgelegt
 * (DIP unpadded "21/453" + padded "21/0453"), weil die Konsumenten
 * gemischte Konventionen nutzen (activities/drucksache_texts unpadded,
 * bundestag_votes padded) und die Tabelle ein reiner Lookup-Cache ist.
 *
 * Idempotent; vorhandene Titel werden nur durch non-null ersetzt.
 * Run: npx tsx scripts/seed-dip-ds-titles-all.ts
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
const DIP = "https://search.dip.bundestag.de/api/v1";
const DIP_KEY = process.env.DIP_API_KEY ?? "";
const DIP_HEADERS = {
  Origin: "https://dip.bundestag.de",
  Referer: "https://dip.bundestag.de/",
};

interface DipDoc {
  dokumentnummer?: string;
  titel?: string;
  drucksachetyp?: string;
  vorgangsbezug?: Array<{ titel?: string; vorgangstyp?: string }>;
}

/** "21/453" → ["21/453", "21/0453"] — beide gebräuchlichen Schreibweisen. */
function nrVariants(nr: string): string[] {
  const m = nr.match(/^(\d+)\/0*(\d+)$/);
  if (!m) return [nr];
  const unpadded = `${m[1]}/${parseInt(m[2], 10)}`;
  const padded = `${m[1]}/${String(parseInt(m[2], 10)).padStart(4, "0")}`;
  return unpadded === padded ? [unpadded] : [unpadded, padded];
}

async function main() {
  if (!DIP_KEY) {
    console.error("DIP_API_KEY fehlt in .env");
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  const upsert = db.prepare(`
    INSERT INTO dip_ds_titles (drucksache_nr, titel, drucksachetyp, vorgangstyp, fetched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(drucksache_nr) DO UPDATE SET
      titel = COALESCE(excluded.titel, titel),
      drucksachetyp = COALESCE(excluded.drucksachetyp, drucksachetyp),
      vorgangstyp = COALESCE(excluded.vorgangstyp, vorgangstyp),
      fetched_at = excluded.fetched_at
  `);

  let cursor = "";
  let pages = 0;
  let docs = 0;
  let written = 0;
  const now = new Date().toISOString();

  for (;;) {
    const url = new URL(`${DIP}/drucksache`);
    url.searchParams.set("f.wahlperiode", "21");
    url.searchParams.set("f.zuordnung", "BT");
    url.searchParams.set("apikey", DIP_KEY);
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, { headers: DIP_HEADERS });
    if (!res.ok) {
      console.error(`HTTP ${res.status} auf Seite ${pages + 1} — Abbruch`);
      break;
    }
    const json = (await res.json()) as { numFound?: number; cursor?: string; documents?: DipDoc[] };
    const batch = json.documents ?? [];
    pages += 1;
    if (pages === 1) console.log(`DIP meldet ${json.numFound ?? "?"} WP21-BT-Drucksachen`);
    if (batch.length === 0) break;

    const tx = db.transaction(() => {
      for (const doc of batch) {
        if (!doc.dokumentnummer) continue;
        docs += 1;
        const vorgang = (doc.vorgangsbezug ?? [])[0];
        const titel = vorgang?.titel ?? doc.titel ?? null;
        if (!titel) continue;
        for (const nr of nrVariants(doc.dokumentnummer)) {
          upsert.run(nr, titel, doc.drucksachetyp ?? null, vorgang?.vorgangstyp ?? null, now);
          written += 1;
        }
      }
    });
    tx();

    if (pages % 10 === 0) console.log(`  Seite ${pages}: ${docs} Dokumente verarbeitet …`);
    if (!json.cursor || json.cursor === cursor) break;
    cursor = json.cursor;
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n=== Fertig: ${pages} Seiten, ${docs} Dokumente, ${written} Upserts ===`);
  const stats = db.prepare(
    `SELECT COUNT(*) AS rows, SUM(titel IS NOT NULL) AS mitTitel FROM dip_ds_titles`
  ).get() as { rows: number; mitTitel: number };
  console.log(`dip_ds_titles: ${stats.rows} Zeilen, ${stats.mitTitel} mit Titel`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
