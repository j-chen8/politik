import { getDb } from "@/lib/db";

/**
 * PLZ → mein Abgeordneter (Bundestag).
 *
 * Kette: PLZ → Wahlkreis-Nummer (Tabelle plz_wahlkreis, geometrischer Verschnitt,
 * siehe scripts/seed-plz-wahlkreis.ts) → mandates.constituency → Politiker:innen.
 *
 * Mehrdeutigkeit wird EHRLICH abgebildet: liegt eine PLZ über mehreren Wahlkreisen,
 * werden alle zurückgegeben, nach Flächenanteil sortiert. Kein stilles Raten.
 */

export type WahlkreisAbgeordnete = {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  party: string | null;
  photoUrl: string | null;
  fraction: string | null;
};

export type WahlkreisTreffer = {
  wkrNr: number;
  wkrName: string;
  /** Anteil der PLZ-Fläche, der in diesem Wahlkreis liegt (0..1). */
  flaechenanteil: number;
  /** Direkt gewählte:r Abgeordnete:r mit Sitz (oder null bei Wahlrechtsreform-Lücke). */
  direkt: WahlkreisAbgeordnete | null;
  /** Weitere Abgeordnete aus dem Wahlkreis, die über die Landesliste eingezogen sind. */
  liste: WahlkreisAbgeordnete[];
};

export type PlzLookupResult = {
  plz: string;
  /** true, wenn die PLZ klar in genau einem Wahlkreis liegt (Top-Anteil ≥ 90 %, nur 1 WK). */
  eindeutig: boolean;
  treffer: WahlkreisTreffer[];
};

let _btPeriodId: number | null = null;
function bundestagPeriodId(): number {
  if (_btPeriodId !== null) return _btPeriodId;
  const row = getDb()
    .prepare(
      `SELECT pp.id FROM parliament_periods pp
       JOIN parliaments p ON pp.parliament_id = p.id
       WHERE p.type = 'bundestag'
       ORDER BY pp.start_date DESC LIMIT 1`,
    )
    .get() as { id: number } | undefined;
  if (!row) throw new Error("Keine Bundestags-Wahlperiode in der DB gefunden");
  _btPeriodId = row.id;
  return _btPeriodId;
}

/** Entfernt Nummer-Präfix ("92 - ") und "(Bundestag …)"-Suffix aus einem constituency-String. */
function cleanWkName(c: string | null): string {
  if (!c) return "";
  return c
    .replace(/\s*\(Bundestag[^)]*\)\s*$/i, "")
    .replace(/^\d+\s*[-–]\s*/, "")
    .trim();
}

/** Normalisiert eine Eingabe auf eine 5-stellige PLZ oder null. */
export function normalizePlz(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  return /^\d{5}$/.test(digits) ? digits : null;
}

type AbgRow = {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  party_label: string | null;
  photo_url: string | null;
  fraction: string | null;
  mandate_won: string | null;
  constituency: string | null;
};

/** Liefert die Abgeordneten zu einer Bundestags-PLZ, nach Wahlkreis-Flächenanteil sortiert. */
export function getBundestagWahlkreiseByPlz(plz: string): PlzLookupResult | null {
  const norm = normalizePlz(plz);
  if (!norm) return null;
  const db = getDb();
  const periodId = bundestagPeriodId();

  const wkRows = db
    .prepare(
      `SELECT wkr_nr, wkr_name, flaechenanteil
       FROM plz_wahlkreis
       WHERE plz = ? AND parlament = 'bundestag'
       ORDER BY flaechenanteil DESC`,
    )
    .all(norm) as Array<{ wkr_nr: number; wkr_name: string; flaechenanteil: number }>;

  if (wkRows.length === 0) return { plz: norm, eindeutig: false, treffer: [] };

  // Aktive Mandate des aktuellen Bundestags je Wahlkreis (Direktmandat + Liste).
  const mandateStmt = db.prepare(
    `SELECT p.id, p.first_name, p.last_name, p.title, pa.label AS party_label,
            p.photo_url, m.fraction, m.mandate_won, m.constituency
     FROM mandates m
     JOIN politicians p ON p.id = m.politician_id
     LEFT JOIN parties pa ON pa.id = p.party_id
     WHERE m.parliament_period_id = ?
       AND m.type = 'mandate'
       AND CAST(m.constituency AS INTEGER) = ?
       AND (m.end_date IS NULL OR m.end_date = '' OR m.end_date > date('now'))
     ORDER BY p.last_name, p.first_name`,
  );

  const treffer: WahlkreisTreffer[] = wkRows.map((wk) => {
    const rows = mandateStmt.all(periodId, wk.wkr_nr) as AbgRow[];
    const toAbg = (r: AbgRow): WahlkreisAbgeordnete => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      title: r.title,
      party: r.party_label,
      photoUrl: r.photo_url,
      fraction: r.fraction,
    });
    const direktRow = rows.find((r) => r.mandate_won === "constituency");
    const liste = rows.filter((r) => r.mandate_won !== "constituency").map(toAbg);
    // Kanonischen Wahlkreis-Namen aus den Mandaten ziehen, sonst Shapefile-Name.
    const wkName = cleanWkName(rows[0]?.constituency) || wk.wkr_name;
    return {
      wkrNr: wk.wkr_nr,
      wkrName: wkName,
      flaechenanteil: wk.flaechenanteil,
      direkt: direktRow ? toAbg(direktRow) : null,
      liste,
    };
  });

  const eindeutig = treffer.length === 1 && treffer[0].flaechenanteil >= 0.9;
  return { plz: norm, eindeutig, treffer };
}
