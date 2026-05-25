/**
 * Re-prozessiert berlin_drucksachen_analyses-Rows aus raw_tool_input_json mit den
 * aktuellen Validation-Helpers — KEIN LLM-Call.
 *
 * Use-Case: Wenn validateTonalitaet/validateThemen/safeParseArray erweitert wurden
 * (z.B. neue Aliases, tolerantere Array-Parse), bestehende Rows neu validieren.
 *
 * Run: npx tsx scripts/reprocess-berlin-ds-from-raw.ts [--stage=N] [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";
import {
  BerlinBatchClass,
  validateTonalitaet, validateThemen, safeParseArray, normalizeFraktion,
  applyTagDriftFix,
} from "../src/lib/berlin-drucksachen-prompts";

const DB_PATH = path.join(process.cwd(), "politik.db");
const args = process.argv.slice(2);
const stageArg = args.find((a) => a.startsWith("--stage="));
const stage = stageArg ? parseInt(stageArg.split("=")[1], 10) : null;
const DRY_RUN = args.includes("--dry-run");

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const where = stage !== null ? `WHERE batch_stage = ? AND raw_tool_input_json IS NOT NULL` : `WHERE raw_tool_input_json IS NOT NULL AND klasse != 'beschlussempfehlung_regex'`;
const sql = `SELECT dbid, klasse, raw_tool_input_json FROM berlin_drucksachen_analyses ${where}`;
const rows = (stage !== null
  ? db.prepare(sql).all(stage)
  : db.prepare(sql).all()) as { dbid: string; klasse: BerlinBatchClass; raw_tool_input_json: string }[];

console.log(`Re-Process ${rows.length} Rows ${stage !== null ? `(stage=${stage})` : "(alle)"} ${DRY_RUN ? "[DRY-RUN]" : ""}`);

let changedTonal = 0, changedTopic = 0, fixedArray = 0, hardBugs = 0;
let xmlDriftCleaned = 0, xmlDriftRescued = 0;

const update = db.prepare(`
  UPDATE berlin_drucksachen_analyses SET
    zusammenfassung = @zusammenfassung,
    thema_json = @thema_json,
    tonalitaet = @tonalitaet,
    antwort_charakter = @antwort_charakter,
    kerninhalt_json = @kerninhalt_json,
    kerninhalt_frage_json = @kerninhalt_frage_json,
    kerninhalt_antwort_json = @kerninhalt_antwort_json,
    regelung = @regelung,
    begruendung = @begruendung,
    auswirkung = @auswirkung,
    betroffene_gruppen = @betroffene_gruppen,
    einbringer = @einbringer,
    dokumenttyp = @dokumenttyp,
    senatsverwaltung = @senatsverwaltung,
    bezirk_bezug = @bezirk_bezug,
    adressat = @adressat,
    topic_drift_json = @topic_drift_json,
    tonalitaet_drift = @tonalitaet_drift,
    fraktion = @fraktion
  WHERE dbid = @dbid
`);

const tx = db.transaction(() => {
  for (const r of rows) {
    let analysis: Record<string, unknown>;
    try { analysis = JSON.parse(r.raw_tool_input_json); } catch { continue; }

    // XML-Tag-Drift-Fix: schneidet "</field>\n<parameter name=...>"-Suffixe ab
    // und rekonstruiert verlorene Folge-Felder aus dem Suffix.
    const drift = applyTagDriftFix(analysis);
    xmlDriftCleaned += drift.cleaned;
    xmlDriftRescued += drift.rescued;

    const tVal = validateTonalitaet(r.klasse, analysis);
    const thVal = validateThemen(analysis);
    const ki = safeParseArray(analysis.kerninhalt);
    const kif = safeParseArray(analysis.kerninhalt_frage);
    const kia = safeParseArray(analysis.kerninhalt_antwort);

    if (ki.wasStringified || kif.wasStringified || kia.wasStringified) fixedArray++;
    if (ki.isHardBug || kif.isHardBug || kia.isHardBug) hardBugs++;

    // Vergleich mit bisherigen DB-Werten (nur grobe Diff-Stats, kein Fail wenn unverändert)
    const prev = db.prepare(`SELECT tonalitaet, topic_drift_json FROM berlin_drucksachen_analyses WHERE dbid=?`).get(r.dbid) as any;
    if (prev?.tonalitaet !== tVal.value) changedTonal++;
    const prevDrift = prev?.topic_drift_json ? JSON.parse(prev.topic_drift_json).length : 0;
    if (prevDrift !== thVal.drift.length) changedTopic++;

    if (DRY_RUN) continue;

    update.run({
      dbid: r.dbid,
      zusammenfassung: strOrNull(analysis.zusammenfassung),
      thema_json: thVal.themen.length ? JSON.stringify(thVal.themen) : null,
      tonalitaet: tVal.value,
      antwort_charakter: r.klasse === "anfrage_antwort" ? tVal.value : null,
      kerninhalt_json: r.klasse !== "anfrage_antwort" && ki.items.length ? JSON.stringify(ki.items) : null,
      kerninhalt_frage_json: r.klasse === "anfrage_antwort" && kif.items.length ? JSON.stringify(kif.items) : null,
      kerninhalt_antwort_json: r.klasse === "anfrage_antwort" && kia.items.length ? JSON.stringify(kia.items) : null,
      regelung: r.klasse === "gesetzentwurf" ? strOrNull(analysis.regelung) : null,
      begruendung: r.klasse === "gesetzentwurf" ? strOrNull(analysis.begruendung) : null,
      auswirkung: r.klasse === "gesetzentwurf" ? strOrNull(analysis.auswirkung) : null,
      betroffene_gruppen: r.klasse === "gesetzentwurf" ? strOrNull(analysis.betroffene_gruppen) : null,
      einbringer: r.klasse === "gesetzentwurf" ? strOrNull(analysis.einbringer) : null,
      dokumenttyp: r.klasse === "vorlage_senat" ? strOrNull(analysis.dokumenttyp) : null,
      senatsverwaltung: (r.klasse === "vorlage_senat" || r.klasse === "anfrage_antwort") ? strOrNull(analysis.senatsverwaltung) : null,
      bezirk_bezug: r.klasse === "anfrage_antwort" ? strOrNull(analysis.bezirk_bezug) : null,
      adressat: r.klasse === "antrag" ? strOrNull(analysis.adressat) : null,
      topic_drift_json: thVal.drift.length ? JSON.stringify(thVal.drift) : null,
      tonalitaet_drift: tVal.drift,
      fraktion: normalizeFraktion(typeof analysis.fraktion === "string" ? analysis.fraktion : null),
    });
  }
});
tx();

db.close();

console.log(`\nDiff vs bisherige DB-Werte:`);
console.log(`  Tonalitaet verändert: ${changedTonal}`);
console.log(`  Topic-Drift verändert: ${changedTopic}`);
console.log(`  Stringified-Arrays gerettet: ${fixedArray}`);
console.log(`  XML-Tag-Drift gecleant: ${xmlDriftCleaned} Felder`);
console.log(`  XML-Tag-Drift Folge-Feld gerettet: ${xmlDriftRescued} Felder`);
console.log(`  Echte Hard-Bugs (nicht reparierbar): ${hardBugs}`);
console.log(DRY_RUN ? "\n(DRY-RUN — keine Updates geschrieben)" : "\n✓ Updates geschrieben");
