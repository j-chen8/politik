/**
 * TRIPWIRE: Bundestags-Scope-Leck.
 *
 * Hintergrund (2026-06-03, CAIS/Bieber-Feedback): 30 Berliner Abgeordnetenhaus-
 * Mitglieder leckten in die Bundestags-Politiker:innen-Liste (686 statt 635).
 * Ursache: Der `berlin-mdl-backfill`-Seed (2026-05-23) legt Berlin-MdL als
 * Stammdaten-Profile im GETEILTEN id≥900000-Bereich an (Berlin-MdL stehen nicht in
 * abgeordnetenwatch). Die alten Bundestags-Filter trennten Landespolitiker:innen
 * per String-Heuristik `amt LIKE 'Land:%'` — der Backfill setzt `amt` aber nie →
 * Leck. Fix: Filter scopen jetzt über das MANDAT (parliament), nicht über `amt`.
 *
 * Dieses Skript prüft die Invarianten, die der Bug verletzt hätte — gegen die
 * ECHTEN db.ts-Funktionen (keine Query-Nachbauten → keine Drift). NACH jedem
 * Seed (besonders Landtags-Backfills) laufen lassen. Exit-Code 1 bei Verletzung.
 *
 *   npx tsx scripts/check-bundestag-scope.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { listPoliticians, getDbStats, searchPoliticiansDb, searchBerlinPoliticiansDb } from "../src/lib/db";

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

const failures: string[] = [];
const ok: string[] = [];

// --- INV 1: Identität 635 = MdB + Quereinsteiger-Kabinett -------------------
// Wenn ein nicht-Bundestags-Profil in die aktive Liste leckt, bricht diese Summe.
const stats = getDbStats();
if (stats.politicians === stats.mdbs + stats.cabinetQuereinsteiger) {
  ok.push(
    `INV1 ok: politicians (${stats.politicians}) = mdbs (${stats.mdbs}) + cabinetQuereinsteiger (${stats.cabinetQuereinsteiger})`,
  );
} else {
  failures.push(
    `INV1 VERLETZT: politicians (${stats.politicians}) != mdbs (${stats.mdbs}) + cabinetQuereinsteiger (${stats.cabinetQuereinsteiger}) ` +
      `— Differenz ${stats.politicians - stats.mdbs - stats.cabinetQuereinsteiger}. Vermutlich ein nicht-Bundestags-Profil in der aktiven Liste.`,
  );
}

// --- INV 2: Jedes Listen-Mitglied hat echten Bundestags-Bezug ----------------
// Die EIGENTLICHE Bug-Signatur, SEMANTISCH geprüft (unabhängig davon, WIE der
// Filter geschrieben ist → fängt künftige Filter-Fehler). Legitim in der
// Bundestags-Liste ist nur, wer ein AKTIVES Bundestags-Mandat ODER ein
// Bundes-Kabinettsamt hat. Ein Doppelmandat-MdB (BT + altes Landtags-Mandat,
// z. B. Carsten Becker BT+Saarland) ist legitim über sein aktives BT-Mandat.
// Die 30 Berliner Backfill-Profile hatten WEDER — genau das fällt hier auf.
const listIds = new Set(
  listPoliticians({ limit: 5000, offset: 0 }).rows.map((r) => r.id),
);
const legitIds = new Set(
  (
    db
      .prepare(
        `SELECT p.id FROM politicians p WHERE
           EXISTS (
             SELECT 1 FROM mandates m JOIN parliament_periods pp ON m.parliament_period_id = pp.id
             JOIN parliaments par ON pp.parliament_id = par.id
             WHERE m.politician_id = p.id AND m.type = 'mandate' AND par.type = 'bundestag'
               AND (m.end_date IS NULL OR m.end_date = '' OR m.end_date > date('now'))
           )
           OR ( p.id >= 900000 AND p.rolle IN ('Bundesminister','Staatsminister')
                AND p.amt IS NOT NULL AND p.amt != '' AND p.amt NOT LIKE 'Land:%' )`,
      )
      .all() as { id: number }[]
  ).map((r) => r.id),
);

const leaked = [...listIds].filter((id) => !legitIds.has(id));
if (leaked.length === 0) {
  ok.push(`INV2 ok: alle ${listIds.size} Listen-Einträge haben aktives BT-Mandat ODER Kabinettsamt (Doppelmandate ok)`);
} else {
  const names = (
    db
      .prepare(
        `SELECT id, first_name || ' ' || last_name AS name, stammdaten_source
         FROM politicians WHERE id IN (${leaked.join(",")}) LIMIT 10`,
      )
      .all() as { id: number; name: string; stammdaten_source: string | null }[]
  )
    .map((r) => `${r.id} ${r.name}${r.stammdaten_source ? ` [${r.stammdaten_source}]` : ""}`)
    .join(", ");
  failures.push(
    `INV2 VERLETZT: ${leaked.length} Profil(e) mit Nicht-Bundestags-Mandat lecken in die Bundestags-Liste: ${names}` +
      (leaked.length > 10 ? " …" : ""),
  );
}

// --- INV 3: Auch die Bundestags-Personensuche darf keine reinen ---------------
// Landtags-Profile zeigen. Stichprobe: Profile mit ausschließlich Nicht-BT-Mandat
// dürfen via searchPoliticiansDb NICHT auftauchen.
const sampleNonBt = (
  db
    .prepare(
      `SELECT p.id, p.last_name FROM politicians p
       WHERE EXISTS (
           SELECT 1 FROM mandates m JOIN parliament_periods pp ON m.parliament_period_id = pp.id
           JOIN parliaments par ON pp.parliament_id = par.id
           WHERE m.politician_id = p.id AND m.type = 'mandate' AND par.type != 'bundestag')
         AND NOT EXISTS (
           SELECT 1 FROM mandates m JOIN parliament_periods pp ON m.parliament_period_id = pp.id
           JOIN parliaments par ON pp.parliament_id = par.id
           WHERE m.politician_id = p.id AND m.type = 'mandate' AND par.type = 'bundestag')
       LIMIT 40`,
    )
    .all() as { id: number; last_name: string }[]
);
const searchLeaks = sampleNonBt.filter((p) =>
  searchPoliticiansDb(p.last_name, 50).some((hit) => hit.id === p.id),
);
if (searchLeaks.length === 0) {
  ok.push(`INV3 ok: ${sampleNonBt.length} reine Landtags-Profile stichprobenartig — keines über die Bundestags-Personensuche auffindbar`);
} else {
  failures.push(
    `INV3 VERLETZT: ${searchLeaks.length} reine(s) Landtags-Profil(e) über die Bundestags-Personensuche auffindbar: ` +
      searchLeaks.map((p) => `${p.id} ${p.last_name}`).join(", "),
  );
}

// --- INV 4: Berlin-Profile bleiben in der BERLIN-Suche auffindbar -------------
// Gegenrichtung zu INV2/INV3: der Bundestags-Scope-Fix darf Berliner NICHT aus
// der Berlin-Suche entfernen (Regression 2026-06-03: searchBerlin nutzte fälschlich
// die Bundestags-Personensuche). Jedes Profil mit Berlin-Mandat muss per Name
// über searchBerlinPoliticiansDb gefunden werden.
const berlinSample = (
  db
    .prepare(
      `SELECT p.id, p.last_name FROM politicians p
       WHERE EXISTS (
         SELECT 1 FROM mandates m JOIN parliament_periods pp ON m.parliament_period_id = pp.id
         WHERE m.politician_id = p.id AND m.type = 'mandate' AND pp.parliament_id = 2)
       AND p.last_name IS NOT NULL AND p.last_name != ''
       LIMIT 60`,
    )
    .all() as { id: number; last_name: string }[]
);
const berlinMissing = berlinSample.filter(
  (p) => !searchBerlinPoliticiansDb(p.last_name, 100).some((hit) => hit.id === p.id),
);
if (berlinMissing.length === 0) {
  ok.push(`INV4 ok: ${berlinSample.length} Berlin-Profile stichprobenartig — alle über die Berlin-Personensuche auffindbar`);
} else {
  failures.push(
    `INV4 VERLETZT: ${berlinMissing.length} Berlin-Profil(e) NICHT über die Berlin-Personensuche auffindbar (verschwunden): ` +
      berlinMissing.map((p) => `${p.id} ${p.last_name}`).join(", "),
  );
}

// --- Report ------------------------------------------------------------------
console.log("\n=== Tripwire: Politiker-Scope (Bundestag-Leck + Berlin-Findbarkeit) ===\n");
ok.forEach((m) => console.log("  ✓ " + m));
failures.forEach((m) => console.log("  ✗ " + m));
console.log("");
if (failures.length) {
  console.log(`FAIL — ${failures.length} Invariante(n) verletzt. Ein Landtags-Backfill ist vermutlich in den Bundestags-Scope geleckt.`);
  console.log("→ Bundestags-Filter müssen über das MANDAT scopen (IS_POLITICIAN_ACTIVE_SQL in src/lib/db.ts), nicht über amt.\n");
  process.exit(1);
} else {
  console.log("PASS — Bundestags-Scope sauber, kein Landtags-Leck.\n");
  process.exit(0);
}
