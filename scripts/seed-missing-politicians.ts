/**
 * Legt Politiker an, die in speech_summaries auftauchen aber nicht in politicians.
 * Datenquellen: Wikipedia (Bio + Permalink) + Wikidata (Partei, Geburtsjahr,
 * Foto-URL, Twitter/Instagram, Homepage).
 *
 * Eingabe: hardcoded Liste mit { name, note, expectedSearchHint? } unten.
 * Output:  Insert in politicians + politician_notes.
 *          Anschließend können seed-cv.ts / seed-cv-homepage.ts /
 *          generate-cv-summary.ts wie üblich darüberlaufen.
 *
 * Run: npx tsx scripts/seed-missing-politicians.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import {
  searchWikipedia,
  getWikipediaSummary,
  getQidFromWikipediaTitle,
  getWikidataPolitician,
  commonsImageUrl,
} from "../src/lib/wikidata";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");

// Manuelle Liste — exakter Name (wie in speech_summaries gespeichert),
// kanonischer Name für Wikipedia-Suche, Notiz für die Profil-Seite.
const TARGETS: { speaker: string; wikiSearch: string; note: string }[] = [
  // Merz-Kabinett (Mai 2025–) — Quereinsteiger:innen ohne MdB-Mandat
  { speaker: "Katherina Reiche", wikiSearch: "Katherina Reiche",
    note: "Bundesministerin für Wirtschaft und Energie (CDU) im Kabinett Merz seit Mai 2025. Kein aktuelles Bundestagsmandat — daher kein Eintrag bei abgeordnetenwatch.de." },
  { speaker: "Karin Prien", wikiSearch: "Karin Prien",
    note: "Bundesministerin für Bildung und Forschung (CDU) im Kabinett Merz seit Mai 2025. War zuvor Bildungsministerin Schleswig-Holstein, kein MdB-Mandat." },
  { speaker: "Karsten Wildberger", wikiSearch: "Karsten Wildberger Politiker",
    note: "Bundesminister für Digitalisierung und Staatsmodernisierung (parteilos) im Kabinett Merz seit Mai 2025. Quereinsteiger aus der Wirtschaft (Ex-CEO Ceconomy)." },
  { speaker: "Wolfram Weimer", wikiSearch: "Wolfram Weimer",
    note: "Staatsminister für Kultur und Medien (parteilos) im Kabinett Merz seit Mai 2025. Verleger und Publizist." },
  { speaker: "Stefanie Hubig", wikiSearch: "Stefanie Hubig",
    note: "Bundesministerin der Justiz (SPD) im Kabinett Merz seit Mai 2025. War zuvor Bildungsministerin Rheinland-Pfalz." },

  // Sondergesandte / Bundesbeauftragte
  { speaker: "Eva Högl", wikiSearch: "Eva Högl",
    note: "Wehrbeauftragte des Deutschen Bundestages (SPD) seit 2020. Kein MdB-Mandat in der laufenden Wahlperiode." },
  { speaker: "Annalena Baerbock", wikiSearch: "Annalena Baerbock",
    note: "Präsidentin der UN-Generalversammlung 2025/2026 (Bündnis 90/Die Grünen). Vormals Bundesaußenministerin im Kabinett Scholz." },

  // Landesminister:innen mit Bundesrats-Reden im Bundestag
  { speaker: "Katrin Eder", wikiSearch: "Katrin Eder Politikerin",
    note: "Klimaschutz-, Umwelt-, Energie- und Mobilitätsministerin Rheinland-Pfalz (Bündnis 90/Die Grünen)." },
  { speaker: "Sven Schulze", wikiSearch: "Sven Schulze Politiker",
    note: "Wirtschaftsminister Sachsen-Anhalt (CDU)." },

  // Restliche Speaker: vermutlich entweder Sachverständige oder Personen
  // mit Sonderrolle. Wir versuchen Wikipedia.
  { speaker: "Henning Otte", wikiSearch: "Henning Otte",
    note: "Beauftragter der Bundesregierung für die Belange der Soldatinnen und Soldaten." },
  { speaker: "Sandra Stein", wikiSearch: "Sandra Stein Politikerin",
    note: "Sprecherin im Deutschen Bundestag in der 21. Wahlperiode." },
  { speaker: "Cansin Köktürk", wikiSearch: "Cansın Köktürk",
    note: "Sprecherin im Deutschen Bundestag in der 21. Wahlperiode." },
  { speaker: "Thomas Paul", wikiSearch: "Thomas Paul Politiker",
    note: "Sprecher im Deutschen Bundestag in der 21. Wahlperiode." },
];

// Wikidata-Logik komplett ausgelagert nach src/lib/wikidata.ts
// (geteilte Nutzung mit refresh-missing-politician-data.ts)

function splitName(speaker: string): { firstName: string; lastName: string; title: string | null } {
  let title: string | null = null;
  let s = speaker.trim();
  const titleMatch = s.match(/^(Dr\.?|Prof\.?|Prof\.\s*Dr\.?)\s+/i);
  if (titleMatch) { title = titleMatch[1].replace(/\s+/g, " "); s = s.slice(titleMatch[0].length); }
  const parts = s.split(/\s+/);
  const lastName = parts.pop() || s;
  const firstName = parts.join(" ") || s;
  return { firstName, lastName, title };
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const findExisting = db.prepare(`SELECT id FROM politicians WHERE qid_wikidata = ?`);
  const findByName = db.prepare(`SELECT id FROM politicians WHERE first_name = ? AND last_name = ?`);
  const insertPol = db.prepare(`
    INSERT INTO politicians (
      id, first_name, last_name, title, year_of_birth, party_id,
      residence, occupation, education,
      photo_url, photo_source, photo_attribution,
      qid_wikidata, homepage_url, homepage_source,
      twitter_handle, instagram_handle,
      bio_summary, bio_url, bio_source, bio_revision_id, bio_fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const findParty = db.prepare(`SELECT id FROM parties WHERE label = ?`);
  const insertParty = db.prepare(`INSERT INTO parties (label) VALUES (?)`);
  const insertNote = db.prepare(`
    INSERT INTO politician_notes (politician_id, kategorie, titel, inhalt, datum_von, datum_bis)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const maxIdRow = db.prepare(`SELECT COALESCE(MAX(id), 0) AS m FROM politicians WHERE id > 900000`).get() as { m: number };
  let nextId = Math.max(maxIdRow.m, 900000) + 1;

  let okCount = 0, skipCount = 0, failCount = 0;

  for (const t of TARGETS) {
    const { firstName, lastName, title } = splitName(t.speaker);
    const existsByName = findByName.get(firstName, lastName) as { id: number } | undefined;
    if (existsByName) {
      console.log(`  ⤵  skip ${t.speaker} — schon in DB als id=${existsByName.id}`);
      skipCount++;
      continue;
    }
    try {
      console.log(`\n→ ${t.speaker}`);
      const search = await searchWikipedia(t.wikiSearch);
      if (!search) { console.log(`  ✗ Wikipedia-Suche leer`); failCount++; continue; }
      console.log(`  Wikipedia-Treffer: ${search.title}`);

      const summary = await getWikipediaSummary(search.title);
      const qid = await getQidFromWikipediaTitle(search.title);
      if (!qid) { console.log(`  ✗ keine Wikidata-QID`); failCount++; continue; }
      console.log(`  QID: ${qid}`);

      const existsByQid = findExisting.get(qid) as { id: number } | undefined;
      if (existsByQid) {
        console.log(`  ⤵  skip — QID schon in DB als id=${existsByQid.id}`);
        skipCount++;
        continue;
      }

      const wd = await getWikidataPolitician(qid);
      console.log(`  Partei: ${wd.partyCanonical ?? "?"} | Jahrgang: ${wd.birthYear ?? "?"} | Foto: ${wd.photoFile ? "ja" : "nein"}`);

      // Partei: nur in `parties` mappen wenn Kurzform existiert; sonst neu anlegen.
      let partyId: number | null = null;
      const partyToStore = wd.partyCanonical ?? wd.partyLabel;
      if (partyToStore) {
        const pp = findParty.get(partyToStore) as { id: number } | undefined;
        if (pp) partyId = pp.id;
        else {
          const ins = insertParty.run(partyToStore);
          partyId = ins.lastInsertRowid as number;
        }
      }

      const photoUrl = wd.photoFile ? commonsImageUrl(wd.photoFile) : null;

      const occupation = wd.occupation.length ? wd.occupation.join(", ") : null;
      const education = wd.education.length
        ? (wd.education.join(", ") + (wd.birthPlace ? ` · geboren in ${wd.birthPlace}` : ""))
        : (wd.birthPlace ? `geboren in ${wd.birthPlace}` : null);

      const id = nextId++;
      insertPol.run(
        id, firstName, lastName, title, wd.birthYear, partyId,
        wd.residence, occupation, education,
        photoUrl, photoUrl ? "wikimedia_commons" : null,
        wd.photoFile ? `Bild: ${wd.photoFile} via Wikimedia Commons (CC siehe Datei-Seite)` : null,
        qid, wd.homepage, wd.homepage ? "wikidata" : null,
        wd.twitter, wd.instagram,
        summary?.extract ?? null,
        summary?.url ?? null,
        summary ? "wikipedia_de" : null,
        summary?.revid?.toString() ?? null,
        new Date().toISOString(),
      );

      insertNote.run(id, "rolle", "Hinweis zur Person", t.note, null, null);

      console.log(`  ✓ angelegt mit id=${id}`);
      okCount++;
      await new Promise((r) => setTimeout(r, 250));
    } catch (e: any) {
      console.log(`  ✗ Fehler: ${e.message?.slice(0, 200)}`);
      failCount++;
    }
  }

  console.log(`\n=== Fertig ===`);
  console.log(`  Angelegt:    ${okCount}`);
  console.log(`  Übersprungen:${skipCount}`);
  console.log(`  Fehler:      ${failCount}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
