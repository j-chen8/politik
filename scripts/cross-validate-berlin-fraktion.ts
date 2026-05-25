/**
 * Cross-Validation: Berlin-DS-Fraktion vs. Header-Regex.
 *
 * Defense gegen LLM-Halluzination bei fraktionslosen Abgeordneten:
 *   Wenn extractHeaderMeta.abgeordnete != null UND extractHeaderMeta.fraktion === null
 *   UND DB-fraktion != null → DB-fraktion ist LLM-Spekulation, setze auf "fraktionslos".
 *
 * Politicians-DB-Party-Lookup als Ground-Truth ist UNGENAU (Wikipedia-Mitgliedschaft
 * != aktuelle AGH-Fraktion). Daher kein politicians.party_id-Override — wir vertrauen
 * dem PDF-Header.
 *
 * Run: npx tsx scripts/cross-validate-berlin-fraktion.ts [--dry-run]
 */
import Database from "better-sqlite3";
import path from "path";
import { extractHeaderMeta } from "../src/lib/berlin-drucksachen-prompts";

const DRY_RUN = process.argv.includes("--dry-run");
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const rows = db.prepare(`
  SELECT bda.dbid, bda.fraktion AS db_fraktion, bd.titel, t.full_text
  FROM berlin_drucksachen_analyses bda
  JOIN berlin_documents bd ON bd.dbid = bda.dbid
  JOIN berlin_pdf_texts t ON t.lok_url = bd.lok_url
  WHERE bda.klasse = 'anfrage_antwort'
`).all() as Array<{ dbid: string; db_fraktion: string | null; titel: string | null; full_text: string }>;

let n = 0, overrides = 0, headerHasFraktion = 0, bothNull = 0, agreed = 0;
const overrideExamples: Array<{ dbid: string; was: string; abgeordnete: string | null }> = [];

const update = db.prepare(`UPDATE berlin_drucksachen_analyses SET fraktion = 'fraktionslos' WHERE dbid = ?`);

const tx = db.transaction(() => {
  for (const r of rows) {
    n++;
    const meta = extractHeaderMeta(r.full_text, r.titel);

    if (meta.fraktion) {
      headerHasFraktion++;
      // Header hat klare Fraktion → trust LLM-DB-fraktion (LLM hat den Header gelesen)
      continue;
    }
    if (!meta.abgeordnete) {
      // Header ohne Abgeordnete:r — ungewöhnlich, vermutlich Layout-Variante. Nicht overriden.
      continue;
    }
    if (!r.db_fraktion) {
      bothNull++;
      continue;
    }
    // Header hat Abgeordnete:r aber KEINE Fraktion-Klammer → LLM-Spekulation
    if (overrideExamples.length < 10) {
      overrideExamples.push({ dbid: r.dbid, was: r.db_fraktion, abgeordnete: meta.abgeordnete });
    }
    overrides++;
    if (!DRY_RUN) update.run(r.dbid);
  }
});
tx();
db.close();

console.log(`=== Cross-Validate Berlin-DS Fraktion (${DRY_RUN ? "DRY-RUN" : "LIVE"}) ===\n`);
console.log(`Total anfrage_antwort: ${n}`);
console.log(`  Header hat Fraktion-Klammer (LLM trust):  ${headerHasFraktion}`);
console.log(`  Beide null (kein Override-Kandidat):      ${bothNull}`);
console.log(`  Override-Kandidaten (Header ohne Klammer, DB hat Fraktion): ${overrides}`);
console.log(`\nBeispiele:`);
for (const e of overrideExamples) {
  console.log(`  ${e.dbid}  was="${e.was}"  → fraktionslos  (Abg: ${e.abgeordnete})`);
}
console.log(DRY_RUN ? `\n(DRY-RUN — keine DB-Updates)` : `\n✓ ${overrides} Rows aktualisiert.`);
