/**
 * Crosswalk Schriftliche-Fragen-Paar → Themenfeld, DETERMINISTISCH (kein LLM).
 *
 * Zwei Schichten (wiederverwendbar):
 *   Layer A  Person → Ministerium   — selbst-pflegend, amtlich aus `activities.titel`
 *            ("…, [Parl.] Staatssekr., <Ministerium>"). Wird pro (DS + Nachname)
 *            aufgelöst, NICHT global: dieselbe Person antwortet in frühen WP21-
 *            Heften noch unter altem Ressort (geschäftsführende Vorgänger-Regierung).
 *   Layer B  Ministerium → Themenfeld(er) — handkuratiert, stabil (nur bei
 *            Kabinettsumbau zu pflegen). Mappt Alt- UND Neu-Ressortnamen auf die
 *            25 kanonischen BT-Felder (Quelle: aw_tag_themenfeld.feld).
 *
 * Sonderrollen (Staatsminister/BKM/Kanzleramt) tragen in `activities` kein
 * Ministerium → separate SONDERROLLEN-Map, nur für zweifelsfreie Fälle. Unsichere
 * bleiben untagged (Spalte themenfeld_quelle = NULL) für den späteren LLM-Pass.
 *
 * Schreibt:  drucksache_qa_paare.antwort_ministerium  (aufgelöstes Ressort)
 *            drucksache_qa_themenfeld(pair_id, themenfeld, ist_primaer, quelle)
 *
 * Aufruf:  npx tsx scripts/build-qa-themenfeld.ts [--write]
 *          ohne --write = Dry-Run (Stats, kein DB-Schreiben)
 */
import Database from "better-sqlite3";
import { parseGermanName, normalizeName } from "../src/lib/german-name-parser";

const DB = "politik.db";
const WRITE = process.argv.includes("--write");

// ── Layer B: Ministerium (amtl. String, Alt+Neu) → [primär, ...sekundär] ──────
// Felder MÜSSEN exakt den 25 kanonischen Werten in aw_tag_themenfeld.feld gleichen.
const MIN2FELD: Record<string, string[]> = {
  "Bundesministerium des Innern": ["Innere Sicherheit", "Migration und Aufenthaltsrecht", "Sport, Freizeit und Tourismus"],
  "Bundesministerium des Innern und für Heimat": ["Innere Sicherheit", "Migration und Aufenthaltsrecht", "Sport, Freizeit und Tourismus"],
  "Bundesministerium für Wirtschaft und Energie": ["Wirtschaft", "Energie"],
  "Bundesministerium für Wirtschaft und Klimaschutz": ["Wirtschaft", "Energie"],
  "Auswärtiges Amt": ["Außenpolitik und internationale Beziehungen", "Europapolitik und Europäische Union"],
  "Bundesministerium für Verkehr": ["Verkehr"],
  "Bundesministerium für Digitales und Verkehr": ["Verkehr", "Medien, Kommunikation und Informationstechnik"],
  "Bundesministerium der Finanzen": ["Öffentliche Finanzen, Steuern und Abgaben"],
  "Bundesministerium für Arbeit und Soziales": ["Arbeit und Beschäftigung", "Soziale Sicherung"],
  "Bundesministerium für Gesundheit": ["Gesundheit"],
  "Bundesministerium der Verteidigung": ["Verteidigung"],
  "Bundesministerium für Bildung, Familie, Senioren, Frauen und Jugend": ["Bildung und Erziehung", "Gesellschaftspolitik, soziale Gruppen"],
  "Bundesministerium für Familie, Senioren, Frauen und Jugend": ["Gesellschaftspolitik, soziale Gruppen"],
  "Bundesministerium für Bildung und Forschung": ["Bildung und Erziehung", "Wissenschaft, Forschung und Technologie"],
  "Bundesministerium für Umwelt, Klimaschutz, Naturschutz und nukleare Sicherheit": ["Umwelt"],
  "Bundesministerium für Umwelt, Naturschutz, nukleare Sicherheit und Verbraucherschutz": ["Umwelt"],
  "Bundesministerium der Justiz und für Verbraucherschutz": ["Recht"],
  "Bundesministerium der Justiz": ["Recht"],
  "Bundesministerium für Digitales und Staatsmodernisierung": ["Medien, Kommunikation und Informationstechnik", "Staat und Verwaltung"],
  "Bundesministerium für Landwirtschaft, Ernährung und Heimat": ["Landwirtschaft und Ernährung"],
  "Bundesministerium für Ernährung und Landwirtschaft": ["Landwirtschaft und Ernährung"],
  "Bundesministerium für Forschung, Technologie und Raumfahrt": ["Wissenschaft, Forschung und Technologie"],
  "Bundesministerium für Wohnen, Stadtentwicklung und Bauwesen": ["Raumordnung, Bau- und Wohnungswesen"],
  "Bundesministerium für wirtschaftliche Zusammenarbeit und Entwicklung": ["Entwicklungspolitik"],
  "Presse- und Informationsamt der Bundesregierung": ["Staat und Verwaltung"],
};

// ── Sonderrollen ohne Ministeriums-String in activities ──────────────────────
// Key = normalisierter Nachname des antwort_steller. NUR zweifelsfreie Rollen;
// unsichere (Meister/Schenderlein/Pawlik) bleiben absichtlich raus → untagged.
const SONDERROLLEN: Record<string, { ministerium: string; felder: string[] }> = {
  weimer:    { ministerium: "Beauftragter der Bundesregierung für Kultur und Medien", felder: ["Kultur"] },
  roth:      { ministerium: "Beauftragte der Bundesregierung für Kultur und Medien", felder: ["Kultur"] },
  frei:      { ministerium: "Bundeskanzleramt", felder: ["Staat und Verwaltung"] },
  kornelius: { ministerium: "Presse- und Informationsamt der Bundesregierung", felder: ["Staat und Verwaltung"] },
};

function main() {
  const db = new Database(DB);

  // Guard: jedes Layer-B/Sonderrollen-Feld muss kanonisch existieren (fail loud).
  const canon = new Set((db.prepare(`SELECT DISTINCT feld FROM aw_tag_themenfeld WHERE feld != ''`).all() as { feld: string }[]).map((r) => r.feld));
  const allFelder = [...Object.values(MIN2FELD).flat(), ...Object.values(SONDERROLLEN).flatMap((s) => s.felder)];
  const bad = [...new Set(allFelder)].filter((f) => !canon.has(f));
  if (bad.length) { console.error("FEHLER: nicht-kanonische Felder im Mapping:", bad); process.exit(1); }

  // Layer A: (drucksache_nr + Nachname) → Ministerium aus activities.
  const actRows = db.prepare(`
    SELECT DISTINCT drucksache_nr, titel FROM activities
    WHERE drucksache_typ='Schriftliche Fragen'
      AND (titel LIKE '%Staatssekr.%' OR titel LIKE '%Staatsminist%')
      AND titel NOT LIKE '%, MdB,%'
  `).all() as { drucksache_nr: string; titel: string }[];
  const dsName2min = new Map<string, string>();           // "ds|nachname" → ministerium
  const globalMin = new Map<string, Set<string>>();       // nachname → {ministerien} (dataset-weit)
  const collisions = new Set<string>();
  for (const r of actRows) {
    // Format: "Person, [Parl.] Staatssekr., <Ministerium>" — Ministerium ab dem
    // 2. Komma (Ressortnamen enthalten selbst Kommas, z.B. "…Forschung, Technologie…").
    const parts = r.titel.split(",");
    if (parts.length < 3) continue;
    const person = parts[0].trim();
    const ministerium = parts.slice(2).join(",").trim();
    const ln = normalizeName(parseGermanName(person).lastName);
    if (!ln) continue;
    (globalMin.get(ln) ?? globalMin.set(ln, new Set()).get(ln)!).add(ministerium);
    const key = `${r.drucksache_nr}|${ln}`;
    const prev = dsName2min.get(key);
    if (prev && prev !== ministerium) collisions.add(`${key}: ${prev} ≠ ${ministerium}`);
    else dsName2min.set(key, ministerium);
  }
  // Fallback nur für eindeutige Personen (genau 1 Ressort dataset-weit). Doppel-
  // rollen (Saathoff/Kramme/Bartol/Müller) bleiben DS-spezifisch → sonst untagged.
  const uniqueMin = (ln: string): string | undefined => { const s = globalMin.get(ln); return s && s.size === 1 ? [...s][0] : undefined; };

  const pairs = db.prepare(`SELECT id, drucksache_nr, antwort_steller FROM drucksache_qa_paare`).all() as { id: number; drucksache_nr: string; antwort_steller: string | null }[];

  let resolvedMin = 0, viaSonder = 0, unresolvedMin = 0, unmappedMin = 0, untagged = 0;
  const unresolvedNames = new Map<string, number>();
  const unmappedMinSet = new Map<string, number>();
  const rows: { pair_id: number; ministerium: string | null; felder: string[]; quelle: string | null }[] = [];

  for (const p of pairs) {
    const stellerLn = p.antwort_steller ? normalizeName(parseGermanName(p.antwort_steller.replace(/^(Parlamentarischen?|Staatssekret\S+|Staatsminister\S*|Bundesminister\S*|Chefs?\s+des\s+Bundespresseamts?|der|des|für besondere Aufgaben)\s+/gi, "").trim()).lastName) : "";

    // 1) Sonderrolle?
    const sr = stellerLn && SONDERROLLEN[stellerLn];
    if (sr) { rows.push({ pair_id: p.id, ministerium: sr.ministerium, felder: sr.felder, quelle: "sonderrolle" }); viaSonder++; continue; }

    // 2) Ministerium via activities: erst (DS + Nachname), sonst globaler Fallback
    //    (nur eindeutige Personen). Fängt DS mit lückenhafter activities-Liste ab.
    const min = stellerLn ? (dsName2min.get(`${p.drucksache_nr}|${stellerLn}`) ?? uniqueMin(stellerLn)) : undefined;
    if (!min) { unresolvedMin++; if (stellerLn) unresolvedNames.set(stellerLn, (unresolvedNames.get(stellerLn) ?? 0) + 1); rows.push({ pair_id: p.id, ministerium: null, felder: [], quelle: null }); untagged++; continue; }
    resolvedMin++;
    const felder = MIN2FELD[min];
    if (!felder) { unmappedMin++; unmappedMinSet.set(min, (unmappedMinSet.get(min) ?? 0) + 1); rows.push({ pair_id: p.id, ministerium: min, felder: [], quelle: null }); untagged++; continue; }
    rows.push({ pair_id: p.id, ministerium: min, felder, quelle: "ministerium-crosswalk" });
  }

  if (WRITE) {
    const cols = db.prepare(`PRAGMA table_info(drucksache_qa_paare)`).all() as { name: string }[];
    if (!cols.some((c) => c.name === "antwort_ministerium")) db.exec(`ALTER TABLE drucksache_qa_paare ADD COLUMN antwort_ministerium TEXT`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS drucksache_qa_themenfeld (
        pair_id INTEGER NOT NULL,
        themenfeld TEXT NOT NULL,
        ist_primaer INTEGER NOT NULL DEFAULT 0,
        quelle TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(pair_id, themenfeld)
      );
      CREATE INDEX IF NOT EXISTS idx_qa_tf_pair ON drucksache_qa_themenfeld(pair_id);
      CREATE INDEX IF NOT EXISTS idx_qa_tf_feld ON drucksache_qa_themenfeld(themenfeld);
    `);
    const upMin = db.prepare(`UPDATE drucksache_qa_paare SET antwort_ministerium=? WHERE id=?`);
    const insTf = db.prepare(`INSERT INTO drucksache_qa_themenfeld (pair_id, themenfeld, ist_primaer, quelle) VALUES (?,?,?,?) ON CONFLICT(pair_id, themenfeld) DO UPDATE SET ist_primaer=excluded.ist_primaer, quelle=excluded.quelle`);
    const tx = db.transaction(() => {
      db.exec(`DELETE FROM drucksache_qa_themenfeld`);
      for (const r of rows) {
        upMin.run(r.ministerium, r.pair_id);
        r.felder.forEach((f, i) => insTf.run(r.pair_id, f, i === 0 ? 1 : 0, r.quelle));
      }
    });
    tx();
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  const total = pairs.length;
  const tagged = rows.filter((r) => r.felder.length).length;
  console.log(`\n=== Crosswalk QA → Themenfeld (${WRITE ? "GESCHRIEBEN" : "DRY-RUN"}) ===`);
  console.log(`Paare gesamt:           ${total}`);
  console.log(`  getagged:             ${tagged} (${(100 * tagged / total).toFixed(1)}%)`);
  console.log(`    via Ministerium:    ${resolvedMin - unmappedMin}`);
  console.log(`    via Sonderrolle:    ${viaSonder}`);
  console.log(`  untagged:             ${untagged} (${(100 * untagged / total).toFixed(1)}%)`);
  console.log(`    Steller nicht aufgelöst: ${unresolvedMin}`);
  console.log(`    Ministerium ohne Map:    ${unmappedMin}`);
  if (collisions.size) { console.log(`\n⚠ Nachname-Kollisionen in einer DS (${collisions.size}):`); [...collisions].slice(0, 10).forEach((c) => console.log("   " + c)); }
  if (unresolvedNames.size) { console.log(`\nUNTAGGED Steller (Top, → LLM-Pass):`); [...unresolvedNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([n, c]) => console.log(`   ${c}  ${n}`)); }
  if (unmappedMinSet.size) { console.log(`\n⚠ Ministerien OHNE Layer-B-Eintrag (fixen!):`); [...unmappedMinSet.entries()].forEach(([m, c]) => console.log(`   ${c}  ${m}`)); }

  // Feld-Verteilung (nur Primär)
  const feldCount = new Map<string, number>();
  for (const r of rows) if (r.felder[0]) feldCount.set(r.felder[0], (feldCount.get(r.felder[0]) ?? 0) + 1);
  console.log(`\nPrimärfeld-Verteilung:`);
  [...feldCount.entries()].sort((a, b) => b[1] - a[1]).forEach(([f, c]) => console.log(`   ${String(c).padStart(5)}  ${f}`));

  db.close();
  console.log(WRITE ? "\nGESCHRIEBEN." : "\nDRY-RUN (kein Schreiben).");
}

main();
