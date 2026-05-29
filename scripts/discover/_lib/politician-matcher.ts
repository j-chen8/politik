/**
 * Politician-Matcher: matched einen freien Namen (z.B. "Felix Banaszak" oder
 * "Robert Habeck") gegen die politicians-Tabelle, gefiltert auf aktuelle MdBs
 * der 21. Wahlperiode (Bundestag 2025-2029).
 *
 * Liefert: { politician_id, full_name, party } oder null wenn kein eindeutiger
 * Treffer.
 */

import Database from "better-sqlite3";
import path from "path";
import { parseGermanName } from "../../../src/lib/german-name-parser";

export interface MatchedPolitician {
  politician_id: number;
  first_name: string;
  last_name: string;
  party_label: string | null;
  full_name: string;
}

const DB_PATH = path.join(process.cwd(), "politik.db");
let db: Database.Database | null = null;
function getDb(): Database.Database {
  if (!db) db = new Database(DB_PATH, { readonly: true });
  return db;
}

let mdbCache: MatchedPolitician[] | null = null;

function loadActiveMdbs(): MatchedPolitician[] {
  if (mdbCache) return mdbCache;
  const rows = getDb().prepare(`
    SELECT DISTINCT po.id, po.first_name, po.last_name, p.label AS party_label
    FROM politicians po
    LEFT JOIN parties p ON p.id = po.party_id
    JOIN mandates m ON m.politician_id = po.id
    JOIN parliament_periods pp ON pp.id = m.parliament_period_id
    WHERE pp.label LIKE 'Bundestag 2025%'
      AND po.first_name IS NOT NULL AND po.last_name IS NOT NULL
  `).all() as Array<{ id: number; first_name: string; last_name: string; party_label: string | null }>;
  mdbCache = rows.map(r => ({
    politician_id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
    party_label: r.party_label,
    full_name: `${r.first_name} ${r.last_name}`,
  }));
  return mdbCache;
}

/**
 * Versuche, einen Namen einer Person aus der MdB-Liste zuzuordnen.
 *
 *  Match-Strategie (in dieser Reihenfolge):
 *  1. Exakter Match auf {first_name, last_name} (nach parseGermanName)
 *  2. Last-Name-Eindeutigkeit (wenn nur EIN MdB diesen Last-Name hat)
 *  3. Sonst: kein Match (Ambiguität — lieber NICHT raten)
 */
export function matchPolitician(rawName: string): MatchedPolitician | null {
  const parsed = parseGermanName(rawName);
  const mdbs = loadActiveMdbs();
  const wantedFirst = parsed.firstName.toLowerCase();
  const wantedLast = parsed.lastName.toLowerCase();
  if (!wantedLast) return null;

  // Strategie 1: exakter Match auf first+last
  if (wantedFirst) {
    const exact = mdbs.find(m =>
      m.first_name.toLowerCase() === wantedFirst &&
      m.last_name.toLowerCase() === wantedLast
    );
    if (exact) return exact;
  }

  // Strategie 2: eindeutiger Last-Name
  const byLast = mdbs.filter(m => m.last_name.toLowerCase() === wantedLast);
  if (byLast.length === 1) return byLast[0];

  // Mehrere oder keiner: kein Match (Ambiguität → lieber null als raten)
  return null;
}

/** Convenience: filtert eine Liste von Namen auf MdBs. */
export function matchPoliticianBatch(names: string[]): Array<{ raw: string; match: MatchedPolitician | null }> {
  return names.map(raw => ({ raw, match: matchPolitician(raw) }));
}
