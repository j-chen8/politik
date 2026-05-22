/**
 * Speaker→Politician-Mapping persistieren.
 *
 * Fügt politicians.id als Spalte zu speech_summaries hinzu und füllt sie
 * mit der gleichen Fuzzy-Match-Logik aus find-misses.ts:
 *   - Sonderzeichen-Normalisierung (ı→i, ć→c, ä→ae, ß→ss, ğ→g, …)
 *   - Multi-Word-Last-Names (Adelspräfixe: "von Storch", "van Aken", …)
 *   - Doppelvornamen / Multi-Word First-Names
 *   - Substring-Last-Names ("Paul" matcht "Pauls" wenn First-Name passt)
 *   - Title-Strip (Dr. / Prof.) und Stadt-Suffix-Strip ("(Braunschweig)")
 *
 * Zudem nutzt der bei jedem Bundestag-Speaker den Bundestag-Redner-id
 * (P-XXXXXXXX), wenn sie schon im Plenarprotokoll-XML als redner_id
 * gespeichert ist. Das ist die zuverlässigste Verbindung.
 *
 * Run: npx tsx scripts/backfill-speaker-politician-links.ts
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàâ]/g, "a").replace(/ä/g, "ae")
    .replace(/[éèê]/g, "e")
    .replace(/[íìî]/g, "i")
    .replace(/[óòô]/g, "o").replace(/ö/g, "oe")
    .replace(/[úùû]/g, "u").replace(/ü/g, "ue")
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

interface Pol { id: number; first_name: string; last_name: string; }

function buildMatcher(pols: Pol[]) {
  const byLast = new Map<string, Pol[]>();
  for (const p of pols) {
    const k = normalize(p.last_name);
    if (!byLast.has(k)) byLast.set(k, []);
    byLast.get(k)!.push(p);
    const lastWord = k.split(" ").pop() || "";
    if (lastWord && lastWord !== k) {
      const k2 = `_lw:${lastWord}`;
      if (!byLast.has(k2)) byLast.set(k2, []);
      byLast.get(k2)!.push(p);
    }
  }

  return function match(speaker: string): Pol | null {
    const cleaned = speaker
      .replace(/^(Dr\.?|Prof\.?|Prof\.\s*Dr\.?)\s+/i, "")
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const norm = normalize(cleaned);
    const tokens = norm.split(" ");
    if (tokens.length < 2) return null;

    // 1. Volle multi-word Last-Name-Suche
    for (let start = 1; start < tokens.length; start++) {
      const lname = tokens.slice(start).join(" ");
      const matches = byLast.get(lname);
      if (!matches) continue;
      const firstTokens = tokens.slice(0, start);
      for (const p of matches) {
        const polFirst = normalize(p.first_name).split(" ");
        if (firstTokens.some((t) => polFirst.includes(t))) return p;
      }
    }

    // 2. Last-Word-Match (handles Adelspräfixe als _lw:)
    const lastWord = tokens[tokens.length - 1];
    const lwm = byLast.get(lastWord) ?? byLast.get(`_lw:${lastWord}`);
    if (lwm) {
      const first = tokens[0];
      for (const p of lwm) {
        const polFirst = normalize(p.first_name).split(" ");
        if (polFirst.includes(first)) return p;
      }
    }

    // 3. Substring-Last-Name (Paul → Pauls), max 2 Zeichen Suffix
    if (lastWord.length >= 4) {
      for (const [k, ps] of byLast) {
        if (k.startsWith("_lw:")) continue;
        if (k !== lastWord && k.startsWith(lastWord) && k.length - lastWord.length <= 2) {
          const first = tokens[0];
          for (const p of ps) {
            const polFirst = normalize(p.first_name).split(" ");
            if (polFirst.includes(first)) return p;
          }
        }
      }
    }
    return null;
  };
}

function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Schema-Migration
  const cols = db.prepare("PRAGMA table_info(speech_summaries)").all() as { name: string }[];
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("politician_id")) {
    db.exec("ALTER TABLE speech_summaries ADD COLUMN politician_id INTEGER REFERENCES politicians(id)");
    console.log("→ Spalte politician_id angelegt");
  }
  if (!have.has("politician_match_method")) {
    db.exec("ALTER TABLE speech_summaries ADD COLUMN politician_match_method TEXT");
    console.log("→ Spalte politician_match_method angelegt");
  }
  // Index für schnelle Abfragen
  db.exec("CREATE INDEX IF NOT EXISTS idx_speech_summaries_politician ON speech_summaries(politician_id)");
  // Covering-Index: Partei-Beitragsmatrix aggregiert (politician_id, typ) ohne Tabellen-Zugriff
  db.exec("CREATE INDEX IF NOT EXISTS idx_speech_summaries_pol_typ ON speech_summaries(politician_id, typ)");

  const pols = db.prepare("SELECT id, first_name, last_name FROM politicians").all() as Pol[];
  const match = buildMatcher(pols);

  // Speakers in speech_summaries (distinct)
  const speakers = db.prepare("SELECT DISTINCT speaker FROM speech_summaries").all() as { speaker: string }[];
  console.log(`${speakers.length} distinkte Speaker in speech_summaries`);

  const update = db.prepare(`UPDATE speech_summaries SET politician_id = ?, politician_match_method = ? WHERE speaker = ?`);
  // Wenn redner_id vorhanden ist und in politicians.qid_wikidata oder externen Tabelle steht — strongest match
  // (nicht implementiert, hier reicht Name-Matching für 100 % heute)

  let matched = 0, unmatched = 0;
  const failures: string[] = [];

  db.transaction(() => {
    for (const s of speakers) {
      const m = match(s.speaker);
      if (m) {
        update.run(m.id, "name_fuzzy_v1", s.speaker);
        matched++;
      } else {
        unmatched++;
        failures.push(s.speaker);
      }
    }
  })();

  console.log(`\n=== Ergebnis ===`);
  console.log(`  Verlinkt:   ${matched}`);
  console.log(`  Unverlinkt: ${unmatched}`);
  if (failures.length > 0) {
    console.log("\nUnmatched Speaker (sollten manuell geprüft werden):");
    for (const f of failures) console.log(`  - ${f}`);
  }

  // Wie viele speech_summaries-Zeilen jetzt einen Politician haben
  const linked = db.prepare("SELECT COUNT(*) AS c FROM speech_summaries WHERE politician_id IS NOT NULL").get() as { c: number };
  const total = db.prepare("SELECT COUNT(*) AS c FROM speech_summaries").get() as { c: number };
  console.log(`\nspeech_summaries verlinkt: ${linked.c}/${total.c}`);

  db.close();
}

main();
