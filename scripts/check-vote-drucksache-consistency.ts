/**
 * Konsistenz-Check + Repair für bundestag_votes.drucksache_nrn_json.
 *
 * WURZELFIX (2026-06-15) für die Phantom-DS-Klasse: Votes, deren gespeicherte
 * Drucksachen-Nummer WEDER von der LLM extrahiert wurde NOCH im eigenen Quelltext
 * (raw_snippet) vorkommt. So entstand z. B. die unsinnige Anzeige „Linken-Antrag
 * 21/350 von AfD angenommen" — die Abstimmung war in Wahrheit ein AfD-Einspruch
 * (§ 39 GO) ohne Drucksache; die 21/350 war nachträglich (historischer Writer)
 * drangehängt.
 *
 * Invariante: eine gespeicherte drucksache_nrn ist GÜLTIG genau dann, wenn
 *   (a) sie in der echten LLM-Ausgabe (raw_tool_input_json.drucksache_nrn) steht
 *       — der Platzhalter "21/XXXX" / malformte Einträge zählen NICHT — ODER
 *   (b) sie wörtlich (zero-pad-toleriert) im raw_snippet vorkommt.
 * Alles andere ist ein Phantom und wird entfernt (bleibt nichts übrig → NULL).
 *
 * Begründung der Regel (empirisch 2026-06-15 verifiziert):
 *  - Reine "DS muss im Snippet stehen"-Regel wäre falsch: 69 echte LLM-Treffer
 *    stehen NICHT im Snippet (Zero-Pad: LLM "21/0620" vs. Quelltext "21/620").
 *  - Reine "= LLM-Ausgabe"-Regel wäre falsch: 7 korrekte Links stammen aus einem
 *    älteren Lauf/Prefilter (LLM v2 leer), die DS steht aber echt im Snippet.
 *  Nur die ODER-Verknüpfung trifft exakt die 11 Phantome und schont alle echten.
 *
 *   npx tsx scripts/check-vote-drucksache-consistency.ts          (Report / dry-run)
 *   npx tsx scripts/check-vote-drucksache-consistency.ts --fix    (Backup + Repair)
 *
 * Gehört in die Vote-Pipeline-Run-Checks: nach JEDEM Re-Run von
 * batch-retrieve-bundestag-votes.ts laufen lassen (Failure-Modus "21/XXXX-Halluz").
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DO_FIX = process.argv.includes("--fix");

// Gültige DS-Form: "21/123" .. "20/15060". Schließt Platzhalter "21/XXXX" aus.
const DS_RE = /^\d{1,2}\/\d{1,6}$/;
// Numerischen Teil zero-pad-normalisieren: "21/0620" -> "21/620"
function norm(ds: string): string {
  const m = ds.match(/^(\d{1,2})\/0*(\d+)$/);
  return m ? `${m[1]}/${m[2]}` : ds;
}
// Alle DS-Formen aus einem Freitext zero-pad-normalisiert sammeln
function snippetDsSet(snippet: string | null): Set<string> {
  const set = new Set<string>();
  if (!snippet) return set;
  for (const m of snippet.matchAll(/\b(\d{1,2})\/(\d{1,6})\b/g)) set.add(norm(`${m[1]}/${m[2]}`));
  return set;
}
function parseArr(s: string | null): string[] {
  if (!s) return [];
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.filter((x) => typeof x === "string") : []; }
  catch { return []; }
}

const db = new Database(DB_PATH);

interface Row {
  vote_id: number; sitzung_nr: number | null; outcome: string | null;
  drucksache_nrn_json: string | null; raw_snippet: string | null; raw_tool_input_json: string | null;
}
const rows = db.prepare(`
  SELECT vote_id, sitzung_nr, outcome, drucksache_nrn_json, raw_snippet, raw_tool_input_json
  FROM bundestag_votes
  WHERE error_type IS NULL AND drucksache_nrn_json IS NOT NULL AND drucksache_nrn_json <> '[]'
`).all() as Row[];

type Hit = { vote_id: number; sitzung_nr: number | null; outcome: string | null; before: string[]; after: string[]; dropped: string[] };
const phantoms: Hit[] = [];

for (const r of rows) {
  const stored = parseArr(r.drucksache_nrn_json);
  // echte LLM-Ausgabe (Platzhalter/malformte raus), zero-pad-normalisiert
  const llmValid = new Set(
    parseArr(r.raw_tool_input_json ? (() => { try { return JSON.stringify(JSON.parse(r.raw_tool_input_json!).drucksache_nrn ?? []); } catch { return "[]"; } })() : "[]")
      .filter((ds) => DS_RE.test(ds)).map(norm)
  );
  const snipSet = snippetDsSet(r.raw_snippet);
  const keep = stored.filter((ds) => llmValid.has(norm(ds)) || snipSet.has(norm(ds)));
  const dropped = stored.filter((ds) => !keep.includes(ds));
  if (dropped.length) phantoms.push({ vote_id: r.vote_id, sitzung_nr: r.sitzung_nr, outcome: r.outcome, before: stored, after: keep, dropped });
}

console.log(`Geprüft: ${rows.length} Votes mit DS-Link`);
console.log(`Phantom-Votes (mind. eine ungültige DS): ${phantoms.length}\n`);
for (const p of phantoms) {
  console.log(`  vote ${p.vote_id} (Sitzung ${p.sitzung_nr}, ${p.outcome}): [${p.before.join(", ")}] → ${p.after.length ? "[" + p.after.join(", ") + "]" : "NULL"}  (entfernt: ${p.dropped.join(", ")})`);
}

if (!phantoms.length) { console.log("✓ Konsistent — nichts zu tun."); db.close(); process.exit(0); }

if (!DO_FIX) { console.log("\n(dry-run — mit --fix anwenden)"); db.close(); process.exit(0); }

// Backup (idempotent ersetzen) + Repair in einer Transaktion
db.exec(`DROP TABLE IF EXISTS bundestag_votes_pre_phantom_fix`);
db.exec(`CREATE TABLE bundestag_votes_pre_phantom_fix AS SELECT * FROM bundestag_votes`);
const upd = db.prepare(`UPDATE bundestag_votes SET drucksache_nrn_json = ? WHERE vote_id = ?`);
const tx = db.transaction((hits: Hit[]) => {
  for (const p of hits) upd.run(p.after.length ? JSON.stringify(p.after) : null, p.vote_id);
});
tx(phantoms);
console.log(`\n✓ ${phantoms.length} Votes repariert. Backup: bundestag_votes_pre_phantom_fix`);
db.close();
