/**
 * Holt erweiterte Wikidata-Daten für die in seed-missing-politicians.ts angelegten
 * Politiker (id >= 900000) nach: Wohnort, Beruf, Bildung, Geburtsort.
 * Außerdem normalisiert Partei-Labels auf bestehende Kurzformen
 * (Christlich Demokratische Union → CDU usw.).
 *
 * Run: npx tsx scripts/refresh-missing-politician-data.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const UA = "politik-radar/1.0 (https://github.com/opoi1/politik)";

// Mapping Wikidata-Label → kanonisches Partei-Label, das schon in `parties` existiert.
// Wikidata-Labels sind stabil; QIDs zwischen ähnlichen Parteien zu verwechseln war
// schmerzhaft (vorher hatte ich Q49768 fälschlich CSU statt SPD zugeordnet).
const PARTY_LABEL_TO_CANONICAL: Record<string, string> = {
  "Christlich Demokratische Union": "CDU",
  "Christlich Demokratische Union Deutschlands": "CDU",
  "Christlich-Soziale Union in Bayern": "CSU",
  "Sozialdemokratische Partei Deutschlands": "SPD",
  "Bündnis 90/Die Grünen": "BÜNDNIS 90/­DIE GRÜNEN",
  "Bündnis 90/DIE GRÜNEN": "BÜNDNIS 90/­DIE GRÜNEN",
  "Bundnis 90/Die Grunen": "BÜNDNIS 90/­DIE GRÜNEN",
  "Alternative für Deutschland": "AfD",
  "Freie Demokratische Partei": "FDP",
  "Die Linke": "Die Linke",
  "Bündnis Sahra Wagenknecht": "BSW",
  "Bündnis Sahra Wagenknecht – Vernunft und Gerechtigkeit": "BSW",
  "Volt Deutschland": "Volt",
  "Volt Europa": "Volt",
  "Parteiloser": "parteilos",
  "Parteilose": "parteilos",
  "parteilos": "parteilos",
};

interface WikidataExtended {
  partyQid: string | null;
  partyLabel: string | null;
  birthYear: number | null;
  birthPlace: string | null;
  residence: string | null;
  occupation: string[];
  education: string[];
}

async function getWikidataLabel(qid: string): Promise<string | null> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const entity = data.entities?.[qid];
  return entity?.labels?.de?.value ?? entity?.labels?.en?.value ?? null;
}

async function getExtendedWikidata(qid: string): Promise<WikidataExtended> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const out: WikidataExtended = {
    partyQid: null, partyLabel: null,
    birthYear: null, birthPlace: null, residence: null,
    occupation: [], education: [],
  };
  if (!res.ok) return out;
  const data = (await res.json()) as any;
  const claims = data.entities?.[qid]?.claims ?? {};

  // Party (P102): bei mehreren Mitgliedschaften die AKTUELL gültige nehmen (kein P582 end-time).
  // Wenn mehrere ohne end-time → die mit jüngstem P580 start-time. Sonst Fallback letzter Eintrag.
  const partyClaims = (claims.P102 ?? []) as any[];
  if (partyClaims.length > 0) {
    const active = partyClaims.filter((c) => !c.qualifiers?.P582);
    let chosen: any | null = null;
    if (active.length === 1) {
      chosen = active[0];
    } else if (active.length > 1) {
      // Nimm den mit jüngstem Start-Zeitpunkt
      const withStart = active
        .map((c) => ({
          c,
          start: c.qualifiers?.P580?.[0]?.datavalue?.value?.time as string | undefined,
        }))
        .filter((x) => x.start);
      if (withStart.length > 0) {
        withStart.sort((a, b) => (a.start! < b.start! ? 1 : -1));
        chosen = withStart[0].c;
      } else {
        chosen = active[0];
      }
    } else {
      chosen = partyClaims[partyClaims.length - 1];
    }
    out.partyQid = chosen?.mainsnak?.datavalue?.value?.id ?? null;
  }

  // Birth date (P569)
  const birth = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  if (birth) {
    const m = birth.match(/^[+-]?(\d{4})/);
    if (m) out.birthYear = parseInt(m[1], 10);
  }

  // Birth place (P19)
  const birthPlaceQid = claims.P19?.[0]?.mainsnak?.datavalue?.value?.id;
  if (birthPlaceQid) out.birthPlace = await getWikidataLabel(birthPlaceQid);

  // Residence (P551)
  const residenceQid = claims.P551?.[0]?.mainsnak?.datavalue?.value?.id;
  if (residenceQid) out.residence = await getWikidataLabel(residenceQid);

  // Occupations (P106) — bis zu 3
  const occClaims = claims.P106?.slice(0, 3) ?? [];
  for (const c of occClaims) {
    const q = c?.mainsnak?.datavalue?.value?.id;
    if (q) {
      const label = await getWikidataLabel(q);
      if (label) out.occupation.push(label);
    }
  }

  // Education (P69) — Hochschule(n)
  const eduClaims = claims.P69?.slice(0, 3) ?? [];
  for (const c of eduClaims) {
    const q = c?.mainsnak?.datavalue?.value?.id;
    if (q) {
      const label = await getWikidataLabel(q);
      if (label) out.education.push(label);
    }
  }

  // Party-Label auflösen
  if (out.partyQid) {
    out.partyLabel = await getWikidataLabel(out.partyQid);
  }

  return out;
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const targets = db.prepare(`SELECT id, first_name, last_name, qid_wikidata FROM politicians WHERE id >= 900000 AND qid_wikidata IS NOT NULL`).all() as { id: number; first_name: string; last_name: string; qid_wikidata: string }[];
  console.log(`${targets.length} Politiker zum Refreshen`);

  const findParty = db.prepare(`SELECT id FROM parties WHERE label = ?`);
  const update = db.prepare(`
    UPDATE politicians SET
      year_of_birth = COALESCE(?, year_of_birth),
      residence = COALESCE(?, residence),
      occupation = COALESCE(?, occupation),
      education = COALESCE(?, education),
      party_id = COALESCE(?, party_id)
    WHERE id = ?
  `);

  for (const p of targets) {
    console.log(`\n→ ${p.first_name} ${p.last_name} (${p.qid_wikidata})`);
    try {
      const wd = await getExtendedWikidata(p.qid_wikidata);

      // Party-Normalisierung
      let canonicalParty: string | null = null;
      if (wd.partyLabel && PARTY_LABEL_TO_CANONICAL[wd.partyLabel]) {
        canonicalParty = PARTY_LABEL_TO_CANONICAL[wd.partyLabel];
      } else if (wd.partyLabel) {
        canonicalParty = wd.partyLabel;
      } else {
        canonicalParty = "parteilos";
      }
      let partyId: number | null = null;
      if (canonicalParty) {
        const row = findParty.get(canonicalParty) as { id: number } | undefined;
        if (row) partyId = row.id;
      }

      const occupation = wd.occupation.length ? wd.occupation.join(", ") : null;
      const education = wd.education.length
        ? (wd.education.join(", ") + (wd.birthPlace ? ` · geboren in ${wd.birthPlace}` : ""))
        : (wd.birthPlace ? `geboren in ${wd.birthPlace}` : null);

      update.run(
        wd.birthYear, wd.residence, occupation, education, partyId, p.id,
      );

      console.log(`  Geb: ${wd.birthYear ?? "?"} in ${wd.birthPlace ?? "?"}`);
      console.log(`  Wohnort: ${wd.residence ?? "?"}`);
      console.log(`  Beruf: ${wd.occupation.join(", ") || "?"}`);
      console.log(`  Bildung: ${wd.education.join(", ") || "?"}`);
      console.log(`  Partei: ${canonicalParty ?? "?"} → id=${partyId ?? "?"}`);
    } catch (e: any) {
      console.log(`  ✗ Fehler: ${e.message?.slice(0, 200)}`);
    }
  }

  // Bonus: Tote duplizierte Parteien aufräumen, wo niemand mehr Bezug hat
  const orphanParties = db.prepare(`
    SELECT id, label FROM parties WHERE id NOT IN (SELECT DISTINCT party_id FROM politicians WHERE party_id IS NOT NULL)
      AND label IN ('Christlich Demokratische Union', 'Sozialdemokratische Partei Deutschlands', 'Bündnis 90/Die Grünen', 'Parteiloser')
  `).all() as { id: number; label: string }[];
  for (const op of orphanParties) {
    db.prepare(`DELETE FROM parties WHERE id = ?`).run(op.id);
    console.log(`\n✗ Verwaiste Partei gelöscht: ${op.label} (id ${op.id})`);
  }

  db.close();
  console.log(`\n=== Fertig ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
