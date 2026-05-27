/**
 * Holt Titel + Dokumenttyp aus der DIP-API für Drucksachen, die in
 * `bundestag_votes` referenziert werden, aber kein `drucksache_analyses`-Eintrag
 * existiert (typischerweise Wahlvorschläge, Verfahrens-Anträge oder
 * Tischvorlagen, die nicht durch die normale Drucksachen-Pipeline laufen).
 *
 * Run: npx tsx scripts/fetch-missing-ds-titles.ts
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
  drucksachetyp?: string;
  vorgangsbezug?: Array<{ titel?: string; vorgangstyp?: string }>;
}

/** Normalisiert DS-Nrn für die DIP-API: "21/0563" → "21/563"
 *  (DIP speichert ohne führende Nullen). */
function dipDsNr(dsNr: string): string {
  const m = dsNr.match(/^(\d+)\/0*(\d+)$/);
  return m ? `${m[1]}/${m[2]}` : dsNr;
}

async function fetchDsTitle(dsNr: string): Promise<{ titel: string | null; drucksachetyp: string | null; vorgangstyp: string | null } | null> {
  const normalizedNr = dipDsNr(dsNr);
  const url = `${DIP}/drucksache?f.dokumentnummer=${encodeURIComponent(normalizedNr)}&apikey=${DIP_KEY}`;
  try {
    const res = await fetch(url, { headers: DIP_HEADERS });
    if (!res.ok) return null;
    const json = (await res.json()) as { documents?: DipDoc[] };
    const doc = (json.documents ?? [])[0];
    if (!doc) return null;
    const vorgang = (doc.vorgangsbezug ?? [])[0];
    return {
      titel: vorgang?.titel ?? null,
      drucksachetyp: doc.drucksachetyp ?? null,
      vorgangstyp: vorgang?.vorgangstyp ?? null,
    };
  } catch {
    return null;
  }
}

async function main() {
  if (!DIP_KEY) {
    console.error("DIP_API_KEY fehlt in .env");
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dip_ds_titles (
      drucksache_nr TEXT PRIMARY KEY,
      titel TEXT,
      drucksachetyp TEXT,
      vorgangstyp TEXT,
      fetched_at TEXT NOT NULL
    )
  `);

  // Sammle alle DS aus bundestag_votes, die NICHT in drucksache_analyses sind UND
  // noch nicht in dip_ds_titles.
  const rows = db.prepare(`
    SELECT DISTINCT json_each.value AS ds
    FROM bundestag_votes, json_each(bundestag_votes.drucksache_nrn_json)
    WHERE bundestag_votes.error_type IS NULL
      AND json_each.value LIKE '21/%'
      AND json_each.value NOT IN (SELECT drucksache_nr FROM drucksache_analyses)
      AND json_each.value NOT IN (SELECT drucksache_nr FROM dip_ds_titles)
  `).all() as Array<{ ds: string }>;

  // Filter Halluzinationen (z.B. "21/XXXX").
  const targets = rows
    .map((r) => r.ds)
    .filter((ds) => /^\d{1,3}\/\d{3,}$/.test(ds));

  console.log(`=== Fetch DIP-Titel für ${targets.length} Drucksachen ohne Analyse ===\n`);
  if (targets.length === 0) {
    console.log("Nichts zu tun.");
    db.close();
    return;
  }

  const insert = db.prepare(`
    INSERT INTO dip_ds_titles (drucksache_nr, titel, drucksachetyp, vorgangstyp, fetched_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(drucksache_nr) DO UPDATE SET
      titel = excluded.titel,
      drucksachetyp = excluded.drucksachetyp,
      vorgangstyp = excluded.vorgangstyp,
      fetched_at = excluded.fetched_at
  `);

  let ok = 0, miss = 0;
  for (const ds of targets) {
    const info = await fetchDsTitle(ds);
    if (info?.titel) {
      insert.run(ds, info.titel, info.drucksachetyp, info.vorgangstyp, new Date().toISOString());
      ok += 1;
      console.log(`  ${ds}: [${info.drucksachetyp ?? "-"}] ${info.titel.slice(0, 100)}`);
    } else {
      miss += 1;
      console.log(`  ${ds}: NICHT GEFUNDEN`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n=== Fertig: ${ok} OK, ${miss} Fehler ===`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
