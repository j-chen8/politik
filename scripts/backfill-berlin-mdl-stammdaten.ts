/**
 * Backfill: lege fehlende Berlin-MdL als Stammdaten-Politicians an (ID ≥ 900.000).
 *
 * Trigger: berlin_speeches zeigt ~30 MdL ohne politician_id-Match. Pre-existing
 * Lücke aus seed-abgeordnetenwatch.ts — der Snapshot hat Nachrücker + ausgeschiedene
 * MdL der "alten WP19" (vor Wiederholungswahl 12.02.2023) nicht erfasst.
 *
 * Was wir tun:
 *  - alle unmatched MdL-Sprecher aus berlin_speeches sammeln
 *  - Stammdaten-Politicians anlegen (ID ≥ 900.000, stammdaten_source='berlin-mdl-backfill')
 *  - Mandate-Eintrag in parliament_period_id=133 anlegen (mit ggf. end_date für vor-WW-MdL)
 *  - berlin_speeches.politician_id NICHT direkt updaten — das macht der nächste
 *    Lauf von seed-berlin-speeches.ts via Two-Stage-Match.
 *
 * Idempotent: vor INSERT prüfen ob politician (first+last+party) schon existiert.
 *
 * Run: npx tsx scripts/backfill-berlin-mdl-stammdaten.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const BERLIN_PARLIAMENT_ID_LOCAL = 2;
const BERLIN_PP_ID = 133; // parliament_period_id für "Berlin 2021 - 2026"
const DRY_RUN = process.argv.includes("--dry-run");
const WIEDERHOLUNGSWAHL = "2023-02-12";

// Party-Mapping: berlin_speeches.speaker_party → parties.id
const PARTY_MAP: Record<string, number> = {
  "SPD": 1,
  "CDU": 2,
  "FDP": 4,
  "GRÜNE": 5,
  "Grüne": 5,
  "LINKE": 8,
  "Die Linke": 8,
  "AfD": 9,
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function stripLeadingTitles(name: string): string {
  return name
    .replace(/^(?:(?:Prof\.|Dr\.|Dipl\.[A-Za-zÄÖÜäöü-]*\.?|Mag\.|h\.c\.|MdB|MdL|MdA|MdEP)\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
const NAME_PARTICLES = new Set([
  "von", "van", "de", "du", "der", "den", "zu", "vom",
  "ten", "ter", "da", "di", "dos", "dal", "del", "le", "la",
]);
function splitName(raw: string): { first: string; last: string; title: string | null } | null {
  const titleM = raw.match(/^(Prof\.\s*Dr\.|Prof\.|Dr\.)\s+/i);
  const title = titleM ? titleM[1].replace(/\s+/g, " ").trim() : null;
  const cleaned = stripLeadingTitles(raw.trim());
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return null; // braucht Vor + Nachname
  let lastStart = parts.length - 1;
  while (lastStart > 0 && NAME_PARTICLES.has(parts[lastStart - 1].toLowerCase())) {
    lastStart--;
  }
  if (lastStart === 0) return null;
  return {
    first: parts.slice(0, lastStart).join(" "),
    last: parts.slice(lastStart).join(" "),
    title,
  };
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");

  // Lade alle unmatched MdL-Sprecher mit Reden-Span.
  // Filter raus: Edge-Cases wo der bodyMdlRe einen Rollenträger als MdL erkannt hat
  // (z.B. "Alterspräsident Kurt Wansner (CDU):" — Rolle steht im Namen weil
  // Fraktions-Klammer vorhanden ist).
  const unmatched = db
    .prepare(
      `SELECT speaker_name, speaker_party, COUNT(*) AS reden,
              MIN(datum) AS first_datum, MAX(datum) AS last_datum
         FROM berlin_speeches
        WHERE is_praesidium = 0
          AND speaker_role IS NULL
          AND politician_id IS NULL
          AND speaker_party IS NOT NULL
          AND speaker_name NOT LIKE 'Alterspräsident%'
          AND speaker_name NOT LIKE 'Alterspräsidentin%'
          AND speaker_name NOT LIKE 'Präsident %'
          AND speaker_name NOT LIKE 'Präsidentin %'
          AND speaker_name NOT LIKE 'Vizepräsident %'
          AND speaker_name NOT LIKE 'Vizepräsidentin %'
          AND speaker_name NOT LIKE 'Senator %'
          AND speaker_name NOT LIKE 'Senatorin %'
          AND speaker_name NOT LIKE 'Bürgermeister%'
          AND speaker_name NOT LIKE 'Regierende%'
          AND speaker_name NOT LIKE 'Staatssekretär%'
        GROUP BY speaker_name, speaker_party
        ORDER BY 3 DESC`
    )
    .all() as { speaker_name: string; speaker_party: string; reden: number; first_datum: string; last_datum: string }[];

  console.log(`${unmatched.length} unmatched MdL-Sprecher in berlin_speeches gefunden\n`);

  // Lade existierende politicians für Doppel-Check
  const existing = db
    .prepare(`SELECT id, first_name, last_name FROM politicians`)
    .all() as { id: number; first_name: string; last_name: string }[];
  const existingByName = new Map<string, number>();
  for (const e of existing) {
    existingByName.set(normalize(`${e.first_name} ${e.last_name}`), e.id);
  }

  const maxStammdatenId = db
    .prepare(`SELECT COALESCE(MAX(id), 900000) AS max_id FROM politicians WHERE id >= 900000`)
    .get() as { max_id: number };
  let nextId = maxStammdatenId.max_id + 1;
  console.log(`Nächste freie Stammdaten-ID: ${nextId}\n`);

  const candidates: {
    speaker_name: string;
    party: string;
    party_id: number;
    first: string;
    last: string;
    title: string | null;
    reden: number;
    first_datum: string;
    last_datum: string;
    vor_ww: boolean;
    new_id: number | null;
    skip_reason: string | null;
  }[] = [];

  for (const u of unmatched) {
    const split = splitName(u.speaker_name);
    if (!split) {
      candidates.push({
        speaker_name: u.speaker_name,
        party: u.speaker_party,
        party_id: 0,
        first: "",
        last: "",
        title: null,
        reden: u.reden,
        first_datum: u.first_datum,
        last_datum: u.last_datum,
        vor_ww: false,
        new_id: null,
        skip_reason: "name_unsplittable",
      });
      continue;
    }
    const partyId = PARTY_MAP[u.speaker_party];
    if (!partyId) {
      candidates.push({
        speaker_name: u.speaker_name,
        party: u.speaker_party,
        party_id: 0,
        first: split.first,
        last: split.last,
        title: split.title,
        reden: u.reden,
        first_datum: u.first_datum,
        last_datum: u.last_datum,
        vor_ww: false,
        new_id: null,
        skip_reason: `unknown_party:${u.speaker_party}`,
      });
      continue;
    }
    const key = normalize(`${split.first} ${split.last}`);
    if (existingByName.has(key)) {
      candidates.push({
        speaker_name: u.speaker_name,
        party: u.speaker_party,
        party_id: partyId,
        first: split.first,
        last: split.last,
        title: split.title,
        reden: u.reden,
        first_datum: u.first_datum,
        last_datum: u.last_datum,
        vor_ww: u.first_datum < WIEDERHOLUNGSWAHL,
        new_id: null,
        skip_reason: `already_exists_as:${existingByName.get(key)}`,
      });
      continue;
    }
    candidates.push({
      speaker_name: u.speaker_name,
      party: u.speaker_party,
      party_id: partyId,
      first: split.first,
      last: split.last,
      title: split.title,
      reden: u.reden,
      first_datum: u.first_datum,
      last_datum: u.last_datum,
      vor_ww: u.first_datum < WIEDERHOLUNGSWAHL,
      new_id: nextId++,
      skip_reason: null,
    });
  }

  // Print plan
  const toInsert = candidates.filter((c) => c.new_id !== null);
  const skipped = candidates.filter((c) => c.new_id === null);

  console.log(`── Plan ──`);
  console.log(`  Neue Stammdaten-Politicians: ${toInsert.length}`);
  console.log(`  Übersprungen: ${skipped.length}`);
  console.log("");
  console.log(`── Neue Einträge ──`);
  for (const c of toInsert) {
    const titlePart = c.title ? `${c.title} ` : "";
    console.log(
      `  ${c.new_id}  ${titlePart}${c.first} ${c.last}  (${c.party})  ${c.reden} Reden  ${c.first_datum}–${c.last_datum}  ${c.vor_ww ? "[vor WW]" : "[in/nach WW]"}`
    );
  }
  if (skipped.length > 0) {
    console.log(`\n── Übersprungen ──`);
    for (const c of skipped) {
      console.log(`  "${c.speaker_name}" (${c.party}, ${c.reden} Reden) → ${c.skip_reason}`);
    }
  }

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] Keine DB-Änderungen.`);
    db.close();
    return;
  }

  // Apply
  const insertPol = db.prepare(`
    INSERT INTO politicians (id, first_name, last_name, title, party_id, stammdaten_source, stammdaten_fetched_at)
    VALUES (?, ?, ?, ?, ?, 'berlin-mdl-backfill', ?)
  `);
  const insertMandate = db.prepare(`
    INSERT INTO mandates (politician_id, parliament_period_id, label, type, start_date, end_date, fraction)
    VALUES (?, ?, ?, 'mandate', ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    for (const c of toInsert) {
      if (c.new_id === null) continue;
      insertPol.run(c.new_id, c.first, c.last, c.title, c.party_id, now);
      // Mandate: für vor-WW MdL setzen wir end_date auf 2023-02-12; sonst NULL (laufend)
      const startDate = c.first_datum || null;
      const endDate = c.last_datum && c.last_datum < WIEDERHOLUNGSWAHL ? WIEDERHOLUNGSWAHL : null;
      insertMandate.run(
        c.new_id,
        BERLIN_PP_ID,
        `MdL Abgeordnetenhaus Berlin (${c.vor_ww && !endDate ? "WP19" : c.vor_ww ? "WP19 vor Wiederholungswahl" : "WP19 Nachrücker:in"})`,
        startDate,
        endDate,
        c.party
      );
    }
  });
  tx();

  console.log(`\n✓ ${toInsert.length} Politicians + Mandate angelegt.`);
  console.log(`Nun seed-berlin-speeches.ts re-runnen für PID-Match.`);

  db.close();
}

main();
