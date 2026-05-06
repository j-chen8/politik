/**
 * Seed Nicht-MdB-Speaker aus den Plenar-XMLs in die politicians-Tabelle.
 *
 * Hintergrund: Die Bundestags-XMLs vergeben "999..."-redner-IDs an externe
 * Sprecher (Bundeskabinett-Mitglieder die keine MdBs sind, Bundesrats-Speaker
 * = Landesregierungs-Mitglieder, Wehrbeauftragte etc.). Im Gegensatz zu MdBs
 * stehen sie NICHT in der MdB-Stammdaten-XML, aber alle nötigen Infos
 * (Vorname, Nachname, Titel, Rolle) sind im Plenar-XML beim <redner>-Element
 * enthalten.
 *
 * Was es tut:
 *   1. Scanne alle data/plenarprotokolle_xml/*.xml
 *   2. Sammle pro 999-ID: vorname, nachname, titel, rolle_lang, ortszusatz
 *      (Erste Vorkommnis pro ID gewinnt — IDs sollten konsistent sein)
 *   3. Parse rolle_lang in {rolle, amt}
 *   4. Match gegen politicians (Name-basiert, da keine bt_redner_id existiert)
 *   5. UPDATE wenn matched (setze bt_redner_id, rolle, amt)
 *   6. INSERT wenn nicht matched
 *
 * Run: npx tsx scripts/seed-non-mdb-speakers.ts
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const XML_DIR = path.join(process.cwd(), "data/plenarprotokolle_xml");
const REPORT_PATH = path.join(
  process.cwd(),
  "scripts/seed-non-mdb-speakers.report.json",
);

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

interface ExtSpeaker {
  bt_redner_id: string;
  vorname: string;
  nachname: string;
  titel: string;
  ortszusatz: string;
  rolle_lang: string;
  source_xml: string;
}

function extractFromXml(xml: string, source: string): Map<string, ExtSpeaker> {
  // Matcht <redner id="999..."> bis zum </redner>
  const re =
    /<redner id="(999\d+)">\s*<name>([\s\S]*?)<\/name>\s*<\/redner>/g;
  const out = new Map<string, ExtSpeaker>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const id = m[1];
    const inner = m[2];
    const get = (tag: string) =>
      inner.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1] ?? "";
    const rolle =
      inner.match(/<rolle>[\s\S]*?<rolle_lang>([^<]+)<\/rolle_lang>/)?.[1] ?? "";
    out.set(id, {
      bt_redner_id: id,
      vorname: get("vorname"),
      nachname: get("nachname"),
      titel: get("titel"),
      ortszusatz: get("ortszusatz"),
      rolle_lang: rolle,
      source_xml: source,
    });
  }
  return out;
}

interface ParsedRole {
  rolle: string;
  amt: string;
}

function parseRole(rolleLang: string): ParsedRole {
  if (!rolleLang) return { rolle: "", amt: "" };
  const t = rolleLang.trim();

  // (Bundesland) Suffix → Land
  const landMatch = t.match(/\(([^)]+)\)\s*$/);
  if (landMatch) {
    const land = landMatch[1].trim();
    const base = t.replace(/\s*\([^)]+\)\s*$/, "").trim();
    // base = "Ministerpräsident" / "Ministerpräsidentin" / "Minister" / "Staatsminister"
    const rolleN = base
      .replace(/in$/, "") // weibliche Form normalisieren
      .replace(/Ministerpraesident/, "Ministerpräsident");
    return { rolle: rolleN, amt: `Land:${land}` };
  }

  // "Staatsminister beim Bundeskanzler"
  if (/beim Bundeskanzler/i.test(t)) {
    return { rolle: "Staatsminister", amt: "Bundeskanzleramt" };
  }

  // "Bundesminister(in) der/für/des X"
  const fedMatch = t.match(
    /^(Bundesminister(?:in)?|Bundeskanzler(?:in)?)\s+(?:der|des|für|bei)\s+(.+)$/,
  );
  if (fedMatch) {
    return {
      rolle: fedMatch[1].replace(/in$/, ""),
      amt: fedMatch[2].trim(),
    };
  }

  // "Wehrbeauftragte(r) des Deutschen Bundestages"
  if (/^Wehrbeauftragte/i.test(t)) {
    return { rolle: "Wehrbeauftragter", amt: "Deutscher Bundestag" };
  }

  // Fallback: erste Wort als rolle
  const words = t.split(/\s+/);
  return { rolle: words[0].replace(/in$/, ""), amt: words.slice(1).join(" ") };
}

interface ExistingPol {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  party_id: number | null;
  bt_redner_id: string | null;
  rolle: string | null;
  amt: string | null;
}

function main() {
  console.log("=== seed-non-mdb-speakers ===\n");

  const xmlFiles = fs
    .readdirSync(XML_DIR)
    .filter((f) => f.endsWith(".xml"))
    .sort();
  console.log(`Scanne ${xmlFiles.length} Plenar-XMLs…`);

  const speakers = new Map<string, ExtSpeaker>();
  for (const f of xmlFiles) {
    const xml = fs.readFileSync(path.join(XML_DIR, f), "utf-8");
    const found = extractFromXml(xml, f);
    for (const [id, sp] of found.entries()) {
      if (!speakers.has(id)) speakers.set(id, sp);
    }
  }
  console.log(`  ${speakers.size} unique 999-redner-IDs gefunden\n`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const pols = db
    .prepare(
      `SELECT id, first_name, last_name, title, party_id, bt_redner_id, rolle, amt
       FROM politicians`,
    )
    .all() as ExistingPol[];

  // Index: (norm(first), norm(last)) → ExistingPol[]
  const byNameKey = new Map<string, ExistingPol[]>();
  for (const p of pols) {
    const fn = normalize(p.first_name);
    const ln = normalize(p.last_name);
    if (!fn || !ln) continue;
    const k = `${fn}|${ln}`;
    if (!byNameKey.has(k)) byNameKey.set(k, []);
    byNameKey.get(k)!.push(p);
    const fnFirst = fn.split(" ")[0];
    if (fnFirst !== fn) {
      const k2 = `${fnFirst}|${ln}`;
      if (!byNameKey.has(k2)) byNameKey.set(k2, []);
      if (!byNameKey.get(k2)!.some((x) => x.id === p.id))
        byNameKey.get(k2)!.push(p);
    }
  }

  const updateStmt = db.prepare(`
    UPDATE politicians
       SET bt_redner_id = ?,
           rolle = ?,
           amt = ?,
           stammdaten_source = 'plenar_xml',
           stammdaten_fetched_at = ?
     WHERE id = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO politicians
      (first_name, last_name, title, bt_redner_id, rolle, amt,
       stammdaten_source, stammdaten_fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, 'plenar_xml', ?)
  `);

  type Outcome =
    | { type: "matched"; sp: ExtSpeaker; pol_id: number; parsed: ParsedRole }
    | { type: "ambiguous"; sp: ExtSpeaker; candidates: number[] }
    | { type: "redner_id_conflict"; sp: ExtSpeaker; pol_id: number; existing: string }
    | { type: "inserted"; sp: ExtSpeaker; new_id: number; parsed: ParsedRole }
    | { type: "skipped_already_set"; sp: ExtSpeaker; pol_id: number };

  const outcomes: Outcome[] = [];
  const fetchedAt = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const sp of speakers.values()) {
      const parsed = parseRole(sp.rolle_lang);
      const fnFull = normalize(sp.vorname);
      const ln = normalize(sp.nachname);
      const fnFirst = fnFull.split(" ")[0];

      const tryKeys = [
        `${fnFull}|${ln}`,
        fnFirst !== fnFull ? `${fnFirst}|${ln}` : null,
      ].filter(Boolean) as string[];

      const candPool = new Map<number, ExistingPol>();
      for (const k of tryKeys) {
        const list = byNameKey.get(k);
        if (list) for (const p of list) candPool.set(p.id, p);
      }
      const cands = Array.from(candPool.values());

      if (cands.length === 0) {
        // INSERT
        const r = insertStmt.run(
          sp.vorname,
          sp.nachname,
          sp.titel || null,
          sp.bt_redner_id,
          parsed.rolle,
          parsed.amt,
          fetchedAt,
        );
        outcomes.push({
          type: "inserted",
          sp,
          new_id: Number(r.lastInsertRowid),
          parsed,
        });
        continue;
      }

      if (cands.length > 1) {
        outcomes.push({
          type: "ambiguous",
          sp,
          candidates: cands.map((c) => c.id),
        });
        continue;
      }

      const m = cands[0];
      if (m.bt_redner_id && m.bt_redner_id !== sp.bt_redner_id) {
        // Konflikt: dieser politician hat schon eine andere bt_redner_id
        // (z.B. ein MdB der ZUSÄTZLICH eine 999-ID als Externer Sprecher hat)
        outcomes.push({
          type: "redner_id_conflict",
          sp,
          pol_id: m.id,
          existing: m.bt_redner_id,
        });
        continue;
      }
      if (m.bt_redner_id === sp.bt_redner_id) {
        outcomes.push({ type: "skipped_already_set", sp, pol_id: m.id });
        continue;
      }

      updateStmt.run(
        sp.bt_redner_id,
        parsed.rolle,
        parsed.amt,
        fetchedAt,
        m.id,
      );
      outcomes.push({ type: "matched", sp, pol_id: m.id, parsed });
    }
  });
  tx();

  const summary = {
    total_external_speakers: speakers.size,
    matched: outcomes.filter((o) => o.type === "matched").length,
    inserted: outcomes.filter((o) => o.type === "inserted").length,
    ambiguous: outcomes.filter((o) => o.type === "ambiguous").length,
    redner_id_conflicts: outcomes.filter((o) => o.type === "redner_id_conflict")
      .length,
    already_set: outcomes.filter((o) => o.type === "skipped_already_set").length,
  };

  console.log("Ergebnis:");
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);

  // Detail-Report
  const report = {
    summary,
    matched: outcomes
      .filter((o) => o.type === "matched")
      .map((o: any) => ({
        bt_redner_id: o.sp.bt_redner_id,
        name: `${o.sp.titel} ${o.sp.vorname} ${o.sp.nachname}`.trim(),
        rolle_lang: o.sp.rolle_lang,
        rolle: o.parsed.rolle,
        amt: o.parsed.amt,
        pol_id: o.pol_id,
      })),
    inserted: outcomes
      .filter((o) => o.type === "inserted")
      .map((o: any) => ({
        bt_redner_id: o.sp.bt_redner_id,
        name: `${o.sp.titel} ${o.sp.vorname} ${o.sp.nachname}`.trim(),
        rolle_lang: o.sp.rolle_lang,
        rolle: o.parsed.rolle,
        amt: o.parsed.amt,
        new_id: o.new_id,
      })),
    ambiguous: outcomes
      .filter((o) => o.type === "ambiguous")
      .map((o: any) => ({
        bt_redner_id: o.sp.bt_redner_id,
        name: `${o.sp.vorname} ${o.sp.nachname}`,
        candidate_ids: o.candidates,
      })),
    redner_id_conflicts: outcomes
      .filter((o) => o.type === "redner_id_conflict")
      .map((o: any) => ({
        bt_redner_id_new: o.sp.bt_redner_id,
        bt_redner_id_existing: o.existing,
        name: `${o.sp.vorname} ${o.sp.nachname}`,
        pol_id: o.pol_id,
      })),
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${REPORT_PATH}`);
  db.close();
}

main();
