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
  /**
   * Falls kein aktives Direktmandat besteht, aber die ursprünglich direkt gewählte
   * Person zwischenzeitlich ausgeschieden ist (z. B. Wechsel in den Bundestag): die
   * letzte Direktgewinnerin/der letzte Direktgewinner samt Enddatum. Der frei gewordene
   * Sitz wird in Berlin über die Landesliste nachbesetzt (nicht wahlkreisgebunden).
   */
  formerDirekt: { abg: WahlkreisAbgeordnete; endDate: string } | null;
  /** Weitere Abgeordnete aus dem Wahlkreis, die über die Landesliste eingezogen sind. */
  liste: WahlkreisAbgeordnete[];
};

export type PlzLookupResult = {
  plz: string;
  /** true, wenn die PLZ klar in genau einem Wahlkreis liegt (Top-Anteil ≥ 90 %, nur 1 WK). */
  eindeutig: boolean;
  treffer: WahlkreisTreffer[];
};

const _periodCache: Record<string, number> = {};
/** Jüngste Wahlperiode eines Parlaments (per parliament.id — type='landtag' wäre mehrdeutig). */
function latestPeriodId(parliamentId: number): number {
  const key = String(parliamentId);
  if (_periodCache[key] !== undefined) return _periodCache[key];
  const row = getDb()
    .prepare(
      `SELECT id FROM parliament_periods
       WHERE parliament_id = ?
       ORDER BY start_date DESC LIMIT 1`,
    )
    .get(parliamentId) as { id: number } | undefined;
  if (!row) throw new Error(`Keine Wahlperiode für parliament_id=${parliamentId} in der DB gefunden`);
  _periodCache[key] = row.id;
  return row.id;
}

/** Entfernt Nummer-Präfix ("92 - ") und "(Bundestag …)"/"(Berlin …)"-Suffix aus constituency. */
function cleanWkName(c: string | null): string {
  if (!c) return "";
  return c
    .replace(/\s*\((?:Bundestag|Berlin)[^)]*\)\s*$/i, "")
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

/**
 * Generischer PLZ→Wahlkreis→Abgeordnete-Lookup für ein Parlament.
 * `parlament` = Wert in plz_wahlkreis.parlament; `parliamentId` = parliaments.id
 * für die aktive Wahlperiode + die Mandate.
 */
function lookupByPlz(plz: string, parlament: string, parliamentId: number): PlzLookupResult | null {
  const norm = normalizePlz(plz);
  if (!norm) return null;
  const db = getDb();
  const periodId = latestPeriodId(parliamentId);

  const wkRows = db
    .prepare(
      `SELECT wkr_nr, wkr_name, flaechenanteil
       FROM plz_wahlkreis
       WHERE plz = ? AND parlament = ?
       ORDER BY flaechenanteil DESC`,
    )
    .all(norm, parlament) as Array<{ wkr_nr: number; wkr_name: string; flaechenanteil: number }>;

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

  // Ausgeschiedene:r Direktgewinner:in (Mandat beendet) — für WK ohne aktives Direktmandat.
  const formerDirektStmt = db.prepare(
    `SELECT p.id, p.first_name, p.last_name, p.title, pa.label AS party_label,
            p.photo_url, m.fraction, m.end_date, m.constituency
     FROM mandates m
     JOIN politicians p ON p.id = m.politician_id
     LEFT JOIN parties pa ON pa.id = p.party_id
     WHERE m.parliament_period_id = ?
       AND m.type = 'mandate' AND m.mandate_won = 'constituency'
       AND CAST(m.constituency AS INTEGER) = ?
       AND m.end_date IS NOT NULL AND m.end_date != '' AND m.end_date <= date('now')
     ORDER BY m.end_date DESC LIMIT 1`,
  );

  const toAbg = (r: AbgRow): WahlkreisAbgeordnete => ({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    title: r.title,
    party: r.party_label,
    photoUrl: r.photo_url,
    fraction: r.fraction,
  });

  const treffer: WahlkreisTreffer[] = wkRows.map((wk) => {
    const rows = mandateStmt.all(periodId, wk.wkr_nr) as AbgRow[];
    const direktRow = rows.find((r) => r.mandate_won === "constituency");
    const liste = rows.filter((r) => r.mandate_won !== "constituency").map(toAbg);

    const frRow = direktRow
      ? undefined
      : (formerDirektStmt.get(periodId, wk.wkr_nr) as (AbgRow & { end_date: string }) | undefined);
    const formerDirekt: WahlkreisTreffer["formerDirekt"] = frRow
      ? { abg: toAbg(frRow), endDate: frRow.end_date }
      : null;

    // Kanonischen Wahlkreis-Namen aus den Mandaten ziehen, sonst Shapefile-Name.
    const wkName = cleanWkName(rows[0]?.constituency) || cleanWkName(frRow?.constituency ?? null) || wk.wkr_name;
    return {
      wkrNr: wk.wkr_nr,
      wkrName: wkName,
      flaechenanteil: wk.flaechenanteil,
      direkt: direktRow ? toAbg(direktRow) : null,
      formerDirekt,
      liste,
    };
  });

  const eindeutig = treffer.length === 1 && treffer[0].flaechenanteil >= 0.9;
  return { plz: norm, eindeutig, treffer };
}

/** Bundestags-Abgeordnete zu einer PLZ (Direktmandat + Landesliste), nach Flächenanteil. */
export function getBundestagWahlkreiseByPlz(plz: string): PlzLookupResult | null {
  return lookupByPlz(plz, "bundestag", 5 /* parliaments.id Bundestag */);
}

/**
 * Abgeordnetenhaus-Berlin-Abgeordnete zu einer PLZ. Liefert leere Treffer für
 * Nicht-Berliner PLZ (dort gibt es keine AGH-Wahlkreis-Zeilen).
 */
export function getBerlinWahlkreiseByPlz(plz: string): PlzLookupResult | null {
  return lookupByPlz(plz, "berlin", 2 /* parliaments.id Berlin */);
}
