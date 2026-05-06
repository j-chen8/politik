/**
 * Seed Bundeskabinett (Merz-Kabinett, Stand 2025/2026) in politicians.
 *
 * Quelle: https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett
 * Stand der Eingabe: hardcoded, da Kabinett selten wechselt — bei Wechsel
 * Liste hier aktualisieren und re-runnen.
 *
 * Was es tut:
 *   1. Für jedes Kabinett-Mitglied: matche gegen politicians via Name
 *   2. UPDATE amt (Ministerium-Beschreibung) und ggf. rolle, falls noch
 *      nicht gesetzt. Existierendes rolle='MdB' wird BEIBEHALTEN — die
 *      Tatsache dass die Person auch MdB ist bleibt erhalten, das amt
 *      gibt zusätzlich Auskunft über den Kabinettsposten.
 *   3. INSERT für unbekannte Personen mit rolle='Bundesminister'
 *
 * Run: npx tsx scripts/seed-bundeskabinett.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const REPORT_PATH = path.join(
  process.cwd(),
  "scripts/seed-bundeskabinett.report.json",
);
const SOURCE = "bundesregierung.de/bundeskabinett";

interface Member {
  vorname: string;
  nachname: string;
  titel?: string;
  rolle: "Bundeskanzler" | "Bundesminister";
  amt: string; // Ministerium / Aufgabenbereich (deskriptiv)
  vizekanzler?: boolean;
}

const KABINETT: Member[] = [
  // Bundeskanzler
  { vorname: "Friedrich", nachname: "Merz", rolle: "Bundeskanzler", amt: "Bundeskanzleramt" },
  // Bundesminister (Reihenfolge wie auf bundesregierung.de)
  { vorname: "Lars", nachname: "Klingbeil", rolle: "Bundesminister", amt: "Finanzen", vizekanzler: true },
  { vorname: "Alexander", nachname: "Dobrindt", rolle: "Bundesminister", amt: "Innern" },
  { vorname: "Johann", nachname: "Wadephul", titel: "Dr.", rolle: "Bundesminister", amt: "Auswärtiges" },
  { vorname: "Boris", nachname: "Pistorius", rolle: "Bundesminister", amt: "Verteidigung" },
  { vorname: "Katherina", nachname: "Reiche", rolle: "Bundesminister", amt: "Wirtschaft und Energie" },
  { vorname: "Dorothee", nachname: "Bär", rolle: "Bundesminister", amt: "Forschung, Technologie und Raumfahrt" },
  { vorname: "Stefanie", nachname: "Hubig", titel: "Dr.", rolle: "Bundesminister", amt: "Justiz und für Verbraucherschutz" },
  { vorname: "Karin", nachname: "Prien", rolle: "Bundesminister", amt: "Bildung, Familie, Senioren, Frauen und Jugend" },
  { vorname: "Bärbel", nachname: "Bas", rolle: "Bundesminister", amt: "Arbeit und Soziales" },
  { vorname: "Karsten", nachname: "Wildberger", titel: "Dr.", rolle: "Bundesminister", amt: "Digitales und Staatsmodernisierung" },
  { vorname: "Patrick", nachname: "Schnieder", rolle: "Bundesminister", amt: "Verkehr" },
  { vorname: "Carsten", nachname: "Schneider", rolle: "Bundesminister", amt: "Umwelt, Klimaschutz, Naturschutz und nukleare Sicherheit" },
  { vorname: "Nina", nachname: "Warken", rolle: "Bundesminister", amt: "Gesundheit" },
  { vorname: "Alois", nachname: "Rainer", rolle: "Bundesminister", amt: "Landwirtschaft, Ernährung und Heimat" },
  { vorname: "Reem", nachname: "Alabali Radovan", rolle: "Bundesminister", amt: "wirtschaftliche Zusammenarbeit und Entwicklung" },
  { vorname: "Verena", nachname: "Hubertz", rolle: "Bundesminister", amt: "Wohnen, Stadtentwicklung und Bauwesen" },
  { vorname: "Thorsten", nachname: "Frei", rolle: "Bundesminister", amt: "besondere Aufgaben / Chef des Bundeskanzleramtes" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàâ]/g, "a")
    .replace(/ä/g, "ae")
    .replace(/[éèê]/g, "e")
    .replace(/[íìî]/g, "i")
    .replace(/[óòô]/g, "o")
    .replace(/ö/g, "oe")
    .replace(/[úùû]/g, "u")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[ćč]/g, "c")
    .replace(/[ñń]/g, "n")
    .replace(/[şš]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/ı/g, "i")
    .replace(/[ğ]/g, "g")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface ExistingPol {
  id: number;
  first_name: string;
  last_name: string;
  bt_redner_id: string | null;
  rolle: string | null;
  amt: string | null;
}

function main() {
  console.log(`=== seed-bundeskabinett (${KABINETT.length} Mitglieder) ===\n`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const pols = db
    .prepare(
      `SELECT id, first_name, last_name, bt_redner_id, rolle, amt
       FROM politicians`,
    )
    .all() as ExistingPol[];

  const byNameKey = new Map<string, ExistingPol[]>();
  function addKey(k: string, p: ExistingPol) {
    if (!byNameKey.has(k)) byNameKey.set(k, []);
    if (!byNameKey.get(k)!.some((x) => x.id === p.id))
      byNameKey.get(k)!.push(p);
  }
  for (const p of pols) {
    const fn = normalize(p.first_name);
    const ln = normalize(p.last_name);
    if (!fn || !ln) continue;
    addKey(`${fn}|${ln}`, p);
    const fnFirst = fn.split(" ")[0];
    if (fnFirst !== fn) addKey(`${fnFirst}|${ln}`, p);
  }

  const updateAmtStmt = db.prepare(`
    UPDATE politicians
       SET amt = ?,
           rolle = COALESCE(NULLIF(rolle,''), ?),
           stammdaten_source = COALESCE(stammdaten_source, ?),
           stammdaten_fetched_at = COALESCE(stammdaten_fetched_at, ?)
     WHERE id = ?
  `);
  const insertStmt = db.prepare(`
    INSERT INTO politicians
      (first_name, last_name, title, rolle, amt,
       stammdaten_source, stammdaten_fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  type Outcome =
    | { type: "matched_kept_mdb"; member: Member; pol_id: number }
    | { type: "matched_set_role"; member: Member; pol_id: number }
    | { type: "ambiguous"; member: Member; candidates: number[] }
    | { type: "inserted"; member: Member; new_id: number };
  const outcomes: Outcome[] = [];
  const fetchedAt = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const m of KABINETT) {
      const fn = normalize(m.vorname);
      const ln = normalize(m.nachname);
      const fnFirst = fn.split(" ")[0];

      const tryKeys = [
        `${fn}|${ln}`,
        fnFirst !== fn ? `${fnFirst}|${ln}` : null,
      ].filter(Boolean) as string[];

      const candPool = new Map<number, ExistingPol>();
      for (const k of tryKeys) {
        const list = byNameKey.get(k);
        if (list) for (const p of list) candPool.set(p.id, p);
      }
      const cands = Array.from(candPool.values());

      if (cands.length === 0) {
        const r = insertStmt.run(
          m.vorname,
          m.nachname,
          m.titel || null,
          m.rolle,
          m.amt,
          SOURCE,
          fetchedAt,
        );
        outcomes.push({
          type: "inserted",
          member: m,
          new_id: Number(r.lastInsertRowid),
        });
        continue;
      }

      if (cands.length > 1) {
        outcomes.push({
          type: "ambiguous",
          member: m,
          candidates: cands.map((c) => c.id),
        });
        continue;
      }

      const p = cands[0];
      updateAmtStmt.run(m.amt, m.rolle, SOURCE, fetchedAt, p.id);
      if (p.rolle === "MdB") {
        outcomes.push({ type: "matched_kept_mdb", member: m, pol_id: p.id });
      } else {
        outcomes.push({ type: "matched_set_role", member: m, pol_id: p.id });
      }
    }
  });
  tx();

  const summary = {
    total: KABINETT.length,
    matched_kept_mdb: outcomes.filter((o) => o.type === "matched_kept_mdb").length,
    matched_set_role: outcomes.filter((o) => o.type === "matched_set_role").length,
    inserted: outcomes.filter((o) => o.type === "inserted").length,
    ambiguous: outcomes.filter((o) => o.type === "ambiguous").length,
  };

  console.log("Ergebnis:");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);

  const report = {
    summary,
    matched_kept_mdb: outcomes
      .filter((o) => o.type === "matched_kept_mdb")
      .map((o: any) => ({
        name: `${o.member.titel ? o.member.titel + " " : ""}${o.member.vorname} ${o.member.nachname}`,
        amt: o.member.amt,
        pol_id: o.pol_id,
      })),
    matched_set_role: outcomes
      .filter((o) => o.type === "matched_set_role")
      .map((o: any) => ({
        name: `${o.member.titel ? o.member.titel + " " : ""}${o.member.vorname} ${o.member.nachname}`,
        rolle: o.member.rolle,
        amt: o.member.amt,
        pol_id: o.pol_id,
      })),
    inserted: outcomes
      .filter((o) => o.type === "inserted")
      .map((o: any) => ({
        name: `${o.member.titel ? o.member.titel + " " : ""}${o.member.vorname} ${o.member.nachname}`,
        rolle: o.member.rolle,
        amt: o.member.amt,
        new_id: o.new_id,
      })),
    ambiguous: outcomes
      .filter((o) => o.type === "ambiguous")
      .map((o: any) => ({
        name: `${o.member.vorname} ${o.member.nachname}`,
        candidates: o.candidates,
      })),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${REPORT_PATH}`);
  db.close();
}

main();
