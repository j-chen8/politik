/**
 * Seed BT-MdB-Stammdaten in die politicians-Tabelle.
 *
 * Was es tut:
 *   1. Parst data/stammdaten/MDB_STAMMDATEN.XML
 *   2. Filtert MdBs der gewünschten Wahlperiode (default: WP21)
 *   3. Match-Strategie gegen existierende politicians:
 *      a) STRENG: normalisierter Vor+Nachname + Geburtsjahr exakt → 1 Treffer
 *      b) STRENG: normalisierter Vor+Nachname → genau 1 Treffer
 *      c) Fail-loud: mehrdeutig → manuelle Triage
 *      d) Fail-loud: kein Match → INSERT als neuer politicians-Eintrag
 *   4. Bei Match: UPDATE bt_redner_id, rolle='MdB', gueltig_ab/bis,
 *      stammdaten_source/fetched_at — überschreibt KEINE existierenden
 *      first_name/last_name/title/year_of_birth/party_id Werte
 *   5. Bei Insert: füllt first_name, last_name, title, year_of_birth, party_id
 *      und alle bt_*-Felder
 *
 * Audit-Output: scripts/seed-politicians-bt.report.json mit
 *   { matched_strict, matched_name_only, ambiguous, inserted, errors }
 *
 * Run: npx tsx scripts/seed-politicians-bt.ts [WP, default 21]
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const DB_PATH = path.join(process.cwd(), "politik.db");
const STAMMDATEN_PATH = path.join(
  process.cwd(),
  "data/stammdaten/MDB_STAMMDATEN.XML",
);
const REPORT_PATH = path.join(
  process.cwd(),
  "scripts/seed-politicians-bt.report.json",
);
const STAMMDATEN_SOURCE = "bundestag.de/MdB-Stammdaten.zip";
const TARGET_WP = process.argv[2] || "21";

// Normalisierung wie in backfill-speaker-politician-links.ts
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

// Datum TT.MM.JJJJ → ISO YYYY-MM-DD (oder null)
function parseDate(s: string | null | undefined): string | null {
  if (!s) return null;
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseYear(s: string | null | undefined): number | null {
  if (!s) return null;
  // Akzeptiert sowohl TT.MM.JJJJ als auch ISO YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-/);
  if (isoMatch) return parseInt(isoMatch[1]);
  const deMatch = s.match(/^\d{2}\.\d{2}\.(\d{4})$/);
  if (deMatch) return parseInt(deMatch[1]);
  return null;
}

interface MdB {
  bt_redner_id: string;
  vorname: string;
  nachname: string;
  ortszusatz: string;
  adel: string;
  praefix: string;
  anrede_titel: string; // Dr.
  akad_titel: string; // Prof. Dr.
  geburtsdatum: string | null; // ISO
  geburtsort: string;
  sterbedatum: string | null;
  geschlecht: string; // männlich|weiblich
  beruf: string;
  partei_kurz: string;
  // WP-spezifisch
  wp_von: string | null; // ISO
  wp_bis: string | null;
  fraktion: string | null; // INS_LANG der Fraktion in dieser WP
}

interface ExistingPol {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  year_of_birth: number | null;
  party_id: number | null;
  bt_redner_id: string | null;
}

// Mapping Stammdaten-Partei-Kurzform → parties.label
function partyLabelToId(
  parteiKurz: string,
  partyMap: Map<string, number>,
): number | null {
  const variants = [
    parteiKurz,
    parteiKurz.replace(/\s+/g, " "),
    parteiKurz.replace("BÜNDNIS 90/DIE GRÜNEN", "BÜNDNIS 90/­DIE GRÜNEN"),
  ];
  for (const v of variants) {
    if (partyMap.has(v)) return partyMap.get(v)!;
  }
  // Sonderfälle: "DIE LINKE." → "Die Linke"
  if (/linke/i.test(parteiKurz)) return partyMap.get("Die Linke") ?? null;
  if (/grüne/i.test(parteiKurz)) {
    // Suche nach jedem Eintrag der "GRÜNEN" enthält
    for (const [label, id] of partyMap.entries()) {
      if (/GR[ÜU]NEN/i.test(label)) return id;
    }
  }
  if (/^cdu$/i.test(parteiKurz)) return partyMap.get("CDU") ?? null;
  if (/^csu$/i.test(parteiKurz)) return partyMap.get("CSU") ?? null;
  if (/^spd$/i.test(parteiKurz)) return partyMap.get("SPD") ?? null;
  if (/^afd$/i.test(parteiKurz)) return partyMap.get("AfD") ?? null;
  if (/^fdp$/i.test(parteiKurz)) return partyMap.get("FDP") ?? null;
  if (/parteilos|fraktionslos/i.test(parteiKurz))
    return partyMap.get("parteilos") ?? null;
  return null;
}

function extractMdBs(
  xmlPath: string,
  targetWp: string,
  alsoIncludeIds: Set<string>,
): MdB[] {
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
  });
  const tree = parser.parse(xml);
  const mdbs = tree.DOCUMENT.MDB as any[];
  const result: MdB[] = [];

  for (const mdb of mdbs) {
    const wps = Array.isArray(mdb.WAHLPERIODEN.WAHLPERIODE)
      ? mdb.WAHLPERIODEN.WAHLPERIODE
      : [mdb.WAHLPERIODEN.WAHLPERIODE];

    const wpMatch = wps.find((wp: any) => String(wp.WP) === targetWp);
    const id = String(mdb.ID);
    const isReferenced = alsoIncludeIds.has(id);

    // Aufnehmen wenn (a) MdB der Ziel-WP oder (b) bt_redner_id wird in
    // speech_summaries referenziert (z.B. ehemaliger MdB jetzt im Kabinett)
    if (!wpMatch && !isReferenced) continue;

    // Wenn nicht in Ziel-WP, nimm die letzte WP für gueltig_ab/bis
    let effectiveWp = wpMatch;
    if (!effectiveWp) {
      effectiveWp = wps[wps.length - 1];
    }

    // Aktueller Name (HISTORIE_BIS leer → aktuell)
    const names = Array.isArray(mdb.NAMEN.NAME)
      ? mdb.NAMEN.NAME
      : [mdb.NAMEN.NAME];
    const currentName =
      names.find((n: any) => !n.HISTORIE_BIS || n.HISTORIE_BIS === "") ||
      names[names.length - 1];

    const bio = mdb.BIOGRAFISCHE_ANGABEN || {};

    // Fraktion in der relevanten WP
    let fraktion: string | null = null;
    const insts = effectiveWp.INSTITUTIONEN?.INSTITUTION;
    if (insts) {
      const instArr = Array.isArray(insts) ? insts : [insts];
      const fr = instArr.find((i: any) => i.INSART_LANG === "Fraktion/Gruppe");
      if (fr) fraktion = fr.INS_LANG || null;
    }

    result.push({
      bt_redner_id: id,
      vorname: String(currentName.VORNAME || ""),
      nachname: String(currentName.NACHNAME || ""),
      ortszusatz: String(currentName.ORTSZUSATZ || ""),
      adel: String(currentName.ADEL || ""),
      praefix: String(currentName.PRAEFIX || ""),
      anrede_titel: String(currentName.ANREDE_TITEL || ""),
      akad_titel: String(currentName.AKAD_TITEL || ""),
      geburtsdatum: parseDate(bio.GEBURTSDATUM),
      geburtsort: String(bio.GEBURTSORT || ""),
      sterbedatum: parseDate(bio.STERBEDATUM),
      geschlecht: String(bio.GESCHLECHT || ""),
      beruf: String(bio.BERUF || ""),
      partei_kurz: String(bio.PARTEI_KURZ || ""),
      wp_von: parseDate(effectiveWp.MDBWP_VON),
      wp_bis: parseDate(effectiveWp.MDBWP_BIS),
      fraktion,
    });
  }
  return result;
}

function buildLastName(m: MdB): string {
  // Ein zusammengesetzter Last-Name umfasst Praefix (von, van) und Nachname
  // Beispiel: "von Storch", "van Aken"
  const parts = [m.praefix, m.nachname].filter((x) => x && x.length);
  return parts.join(" ");
}

function buildFirstName(m: MdB): string {
  // Adel (Freiherr, Baron) gehört zum Vornamen-Bereich
  const parts = [m.vorname, m.adel].filter((x) => x && x.length);
  return parts.join(" ");
}

function buildTitle(m: MdB): string {
  // ANREDE_TITEL ist die kurze Form (Dr.), AKAD_TITEL die ausführliche (Prof. Dr.)
  // Wir nehmen AKAD_TITEL bevorzugt, fallback ANREDE_TITEL
  return m.akad_titel || m.anrede_titel || "";
}

function geschlechtToSex(g: string): string | null {
  if (g === "männlich") return "m";
  if (g === "weiblich") return "f";
  return null;
}

function main() {
  console.log(`=== seed-politicians-bt: WP${TARGET_WP} ===\n`);
  const fetchedAt = new Date().toISOString();

  // Sammle bereits in speech_summaries referenzierte bt_redner_ids (auch von
  // ehemaligen MdBs außerhalb der Ziel-WP, z.B. Kabinettsmitglieder)
  const dbForRefs = new Database(DB_PATH);
  const referenced = new Set<string>(
    (dbForRefs
      .prepare(
        "SELECT DISTINCT redner_id FROM speech_summaries WHERE redner_id LIKE '11%'",
      )
      .all() as { redner_id: string }[])
      .map((r) => r.redner_id),
  );
  dbForRefs.close();
  console.log(
    `  ${referenced.size} 11-IDs in speech_summaries (für Stretch-Filter)\n`,
  );

  console.log("Parse MdB-Stammdaten…");
  const mdbs = extractMdBs(STAMMDATEN_PATH, TARGET_WP, referenced);
  console.log(
    `  ${mdbs.length} MdBs zu seeden (WP${TARGET_WP} + in speeches referenzierte)\n`,
  );

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Existing politicians + parties
  const pols = db
    .prepare(
      `SELECT id, first_name, last_name, title, year_of_birth, party_id, bt_redner_id
       FROM politicians`,
    )
    .all() as ExistingPol[];

  const parties = db
    .prepare(`SELECT id, label FROM parties`)
    .all() as { id: number; label: string }[];
  const partyMap = new Map(parties.map((p) => [p.label, p.id]));

  // Index der existierenden politicians.
  // Wir registrieren JEDEN politician unter mehreren Schlüsseln, um robust zu matchen:
  //   - (norm(first_name), norm(last_name))
  //   - (firstToken(first_name), norm(last_name))
  // Damit matched z.B. Stammdaten "Johann David" auch existing "Johann".
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
    if (fnFirst && fnFirst !== fn) addKey(`${fnFirst}|${ln}`, p);
    // Lastname ohne führendes "von/van/zu" für Match
    const lnNoPraefix = ln.replace(/^(von|van|zu|de|der|den|dem)\s+/, "");
    if (lnNoPraefix !== ln) {
      addKey(`${fn}|${lnNoPraefix}`, p);
      if (fnFirst && fnFirst !== fn) addKey(`${fnFirst}|${lnNoPraefix}`, p);
    }
  }

  const updateStmt = db.prepare(`
    UPDATE politicians
       SET bt_redner_id = ?,
           rolle = 'MdB',
           gueltig_ab = ?,
           gueltig_bis = ?,
           stammdaten_source = ?,
           stammdaten_fetched_at = ?,
           year_of_birth = COALESCE(year_of_birth, ?),
           sex = COALESCE(sex, ?),
           title = COALESCE(NULLIF(title,''), ?),
           party_id = COALESCE(party_id, ?)
     WHERE id = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO politicians
      (first_name, last_name, title, sex, year_of_birth, occupation, party_id,
       bt_redner_id, rolle, gueltig_ab, gueltig_bis,
       stammdaten_source, stammdaten_fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'MdB', ?, ?, ?, ?)
  `);

  type Outcome =
    | { type: "matched_strict"; mdb: MdB; pol_id: number }
    | { type: "matched_name_only"; mdb: MdB; pol_id: number; pol_yob: number | null }
    | { type: "ambiguous"; mdb: MdB; candidates: number[] }
    | { type: "redner_id_already_set"; mdb: MdB; pol_id: number; existing: string }
    | { type: "inserted"; mdb: MdB; new_id: number };
  const outcomes: Outcome[] = [];

  const tx = db.transaction(() => {
    for (const m of mdbs) {
      const fn = buildFirstName(m);
      const ln = buildLastName(m);
      const ttl = buildTitle(m);
      const yob = parseYear(m.geburtsdatum);
      const sex = geschlechtToSex(m.geschlecht);
      const partyId = partyLabelToId(m.partei_kurz, partyMap);

      // Versuchsreihe: mehrere Schlüssel-Varianten, in dieser Reihenfolge:
      //  1. fullVorname|fullNachname (z.B. "johann david|wadephul")
      //  2. firstToken|fullNachname (z.B. "johann|wadephul")
      //  3. fullVorname|nachname-ohne-praefix (z.B. "christian|stetten")
      //  4. firstToken|nachname-ohne-praefix
      const fnNorm = normalize(fn);
      const lnNorm = normalize(ln);
      const fnFirstTok = fnNorm.split(" ")[0];
      const lnNoPrx = lnNorm.replace(/^(von|van|zu|de|der|den|dem)\s+/, "");

      const tryKeys = [
        `${fnNorm}|${lnNorm}`,
        fnFirstTok !== fnNorm ? `${fnFirstTok}|${lnNorm}` : null,
        lnNoPrx !== lnNorm ? `${fnNorm}|${lnNoPrx}` : null,
        fnFirstTok !== fnNorm && lnNoPrx !== lnNorm
          ? `${fnFirstTok}|${lnNoPrx}`
          : null,
      ].filter(Boolean) as string[];

      let matched: ExistingPol | null = null;
      let matchType: "matched_strict" | "matched_name_only" | "ambiguous" | "none" = "none";

      // Sammle ALLE Kandidaten aus allen Versuchen und dedupliziere via id
      const candPool = new Map<number, ExistingPol>();
      for (const k of tryKeys) {
        const list = byNameKey.get(k);
        if (list) for (const p of list) candPool.set(p.id, p);
      }
      const cands = Array.from(candPool.values());

      if (cands.length === 1) {
        if (cands[0].year_of_birth && yob && cands[0].year_of_birth === yob) {
          matched = cands[0];
          matchType = "matched_strict";
        } else if (cands[0].year_of_birth && yob && cands[0].year_of_birth !== yob) {
          // Name passt, aber Geburtsjahr stimmt NICHT → das ist eine andere Person
          // Insert als neuer Eintrag, NICHT mergen
          outcomes.push({
            type: "ambiguous",
            mdb: m,
            candidates: cands.map((c) => c.id),
          });
          continue;
        } else {
          matched = cands[0];
          matchType = "matched_name_only";
        }
      } else if (cands.length > 1) {
        // Mehrere Kandidaten — Disambiguierung über Geburtsjahr
        const exact = cands.filter(
          (c) => c.year_of_birth && yob && c.year_of_birth === yob,
        );
        if (exact.length === 1) {
          matched = exact[0];
          matchType = "matched_strict";
        } else {
          // Filter raus: solche mit explizit ABWEICHENDEM yob
          const noConflict = cands.filter(
            (c) => !c.year_of_birth || !yob || c.year_of_birth === yob,
          );
          if (noConflict.length === 1) {
            matched = noConflict[0];
            matchType = "matched_name_only";
          } else {
            outcomes.push({
              type: "ambiguous",
              mdb: m,
              candidates: cands.map((c) => c.id),
            });
            continue;
          }
        }
      }

      if (matched) {
        // Skip wenn schon eine bt_redner_id gesetzt ist und sie abweicht
        if (matched.bt_redner_id && matched.bt_redner_id !== m.bt_redner_id) {
          outcomes.push({
            type: "redner_id_already_set",
            mdb: m,
            pol_id: matched.id,
            existing: matched.bt_redner_id,
          });
          continue;
        }
        updateStmt.run(
          m.bt_redner_id,
          m.wp_von,
          m.wp_bis,
          STAMMDATEN_SOURCE,
          fetchedAt,
          yob,
          sex,
          ttl || null,
          partyId,
          matched.id,
        );
        outcomes.push(
          matchType === "matched_strict"
            ? { type: "matched_strict", mdb: m, pol_id: matched.id }
            : {
                type: "matched_name_only",
                mdb: m,
                pol_id: matched.id,
                pol_yob: matched.year_of_birth,
              },
        );
      } else {
        // INSERT
        const r = insertStmt.run(
          fn,
          ln,
          ttl || null,
          sex,
          yob,
          m.beruf || null,
          partyId,
          m.bt_redner_id,
          m.wp_von,
          m.wp_bis,
          STAMMDATEN_SOURCE,
          fetchedAt,
        );
        outcomes.push({
          type: "inserted",
          mdb: m,
          new_id: Number(r.lastInsertRowid),
        });
      }
    }
  });
  tx();

  // Aggregate
  const summary = {
    total_mdbs: mdbs.length,
    matched_strict: outcomes.filter((o) => o.type === "matched_strict").length,
    matched_name_only: outcomes.filter((o) => o.type === "matched_name_only")
      .length,
    ambiguous: outcomes.filter((o) => o.type === "ambiguous").length,
    redner_id_conflicts: outcomes.filter((o) => o.type === "redner_id_already_set")
      .length,
    inserted: outcomes.filter((o) => o.type === "inserted").length,
    target_wp: TARGET_WP,
    stammdaten_fetched_at: fetchedAt,
  };

  console.log("Ergebnis:");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);

  // Detail-Report
  const report = {
    summary,
    matched_name_only: outcomes
      .filter((o) => o.type === "matched_name_only")
      .map((o: any) => ({
        bt_redner_id: o.mdb.bt_redner_id,
        name: `${buildFirstName(o.mdb)} ${buildLastName(o.mdb)}`,
        mdb_yob: parseYear(o.mdb.geburtsdatum),
        pol_id: o.pol_id,
        pol_yob: o.pol_yob,
      })),
    ambiguous: outcomes
      .filter((o) => o.type === "ambiguous")
      .map((o: any) => ({
        bt_redner_id: o.mdb.bt_redner_id,
        name: `${buildFirstName(o.mdb)} ${buildLastName(o.mdb)}`,
        yob: parseYear(o.mdb.geburtsdatum),
        candidate_ids: o.candidates,
      })),
    redner_id_conflicts: outcomes
      .filter((o) => o.type === "redner_id_already_set")
      .map((o: any) => ({
        bt_redner_id_new: o.mdb.bt_redner_id,
        bt_redner_id_existing: o.existing,
        name: `${buildFirstName(o.mdb)} ${buildLastName(o.mdb)}`,
        pol_id: o.pol_id,
      })),
    inserted: outcomes
      .filter((o) => o.type === "inserted")
      .map((o: any) => ({
        bt_redner_id: o.mdb.bt_redner_id,
        new_id: o.new_id,
        name: `${buildFirstName(o.mdb)} ${buildLastName(o.mdb)}`,
        partei: o.mdb.partei_kurz,
      })),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${REPORT_PATH}`);
  db.close();
}

main();
