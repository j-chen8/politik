/**
 * Post-Process-Cleanup für die 36 Records, deren Re-Run nicht half:
 *
 * Bei diesen hat Haiku im Tool-Use-Output den `zusammenfassung`-String
 * zu einem XML-Tool-Call-Dump gemacht:
 *
 *   "Echte Zusammenfassung.</zusammenfassung>\n
 *    <parameter name=\"regelung\">…</regelung>\n
 *    <parameter name=\"thema\">[\"A\",\"B\"]"
 *
 * Die anderen JSON-Keys (tonalitaet, fraktion) wurden manchmal *daneben*
 * korrekt emittiert, manchmal aber als Folgefeld im XML-Dump.
 *
 * Strategie:
 *  1. raw_llm_response neu parsen
 *  2. zusammenfassung an erstem </zusammenfassung> ODER ersten <parameter splitten
 *     → echte summary = links davon
 *  3. Aus rechtem Rest alle <parameter name="X">VALUE(</X>|$) extrahieren
 *  4. Array-Felder JSON.parse; String-Felder strippen
 *  5. UPDATE: ursprüngliche JSON-Felder gewinnen, XML-Felder füllen Lücken
 *
 *   --dry-run    Nur Vorschau
 */
import Database from "better-sqlite3";
import path from "path";
import { TOPIC_TAGS } from "../src/lib/drucksachen-prompts";

const TOPIC_ENUM = new Set<string>([...TOPIC_TAGS]);
const DRY_RUN = process.argv.includes("--dry-run");

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

interface Row {
  drucksache_nr: string;
  batch_class: string;
  raw_llm_response: string;
}

function selectCorrupted(): Row[] {
  return db
    .prepare(
      `SELECT drucksache_nr, batch_class, raw_llm_response
       FROM drucksache_analyses
       WHERE prompt_version IN ('v1','v1.1') AND analyze_error IS NULL
         AND (zusammenfassung LIKE '%</%' OR zusammenfassung LIKE '%<parameter%'
              OR kerninhalt LIKE '%</invoke>%' OR kerninhalt LIKE '%<parameter%'
              OR thema LIKE '%<%' OR tonalitaet LIKE '%<%'
              OR regelung LIKE '%<%' OR begruendung LIKE '%<%' OR auswirkung LIKE '%<%')`
    )
    .all() as Row[];
}

interface Extracted {
  zusammenfassung: string;
  fields: Record<string, string>;
}

function splitAndExtract(zusammenfassung: string): Extracted {
  // Finde ersten Split-Punkt: </zusammenfassung> oder <parameter
  const closeIdx = zusammenfassung.indexOf("</zusammenfassung>");
  const paramIdx = zusammenfassung.indexOf("<parameter");
  let splitAt = -1;
  if (closeIdx >= 0 && paramIdx >= 0) splitAt = Math.min(closeIdx, paramIdx);
  else if (closeIdx >= 0) splitAt = closeIdx;
  else if (paramIdx >= 0) splitAt = paramIdx;

  if (splitAt < 0) return { zusammenfassung: zusammenfassung.trim(), fields: {} };

  const cleanSummary = zusammenfassung.slice(0, splitAt).trim();
  const rest = zusammenfassung.slice(splitAt);

  // Alle <parameter name="X">VALUE(</X>|<parameter|$)
  // Greedy aber non-overlapping
  const fields: Record<string, string> = {};
  const re = /<parameter\s+name="([^"]+)">([\s\S]*?)(?=<\/[^>]+>\s*\n?\s*<parameter|<\/[^>]+>\s*$|<parameter|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    const name = m[1];
    let value = m[2].trim();
    // Trailing </name> oder </anything> abschneiden
    value = value.replace(/<\/[a-z_]+>\s*$/i, "").trim();
    fields[name] = value;
  }

  return { zusammenfassung: cleanSummary, fields };
}

function parseArrayField(s: string | undefined): string[] | null {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : null;
  } catch {
    return null;
  }
}

function validateThema(themas: string[] | null): { thema: string[]; drift: string[] } {
  if (!themas) return { thema: ["Sonstiges"], drift: [] };
  const accepted: string[] = [];
  const drift: string[] = [];
  for (const t of themas) {
    if (TOPIC_ENUM.has(t)) accepted.push(t);
    else drift.push(t);
  }
  if (accepted.length === 0) accepted.push("Sonstiges");
  return { thema: accepted, drift };
}

const update = db.prepare(`
  UPDATE drucksache_analyses
  SET zusammenfassung = ?, kerninhalt = ?, thema = ?, tonalitaet = COALESCE(?, tonalitaet),
      betroffene_gruppen = COALESCE(?, betroffene_gruppen),
      fraktion = COALESCE(?, fraktion),
      dokumenttyp = COALESCE(?, dokumenttyp),
      regelung = COALESCE(?, regelung),
      begruendung = COALESCE(?, begruendung),
      auswirkung = COALESCE(?, auswirkung),
      topic_drift_audit = ?,
      generated_at = ?
  WHERE drucksache_nr = ?
`);

const rows = selectCorrupted();
console.log(`📋 ${rows.length} korrupte Records zu cleanupen\n`);

let fixed = 0, partial = 0, skipped = 0;

for (const row of rows) {
  let raw: any;
  try { raw = JSON.parse(row.raw_llm_response); }
  catch { console.log(`  ✖ ${row.drucksache_nr}: raw_llm_response not JSON`); skipped++; continue; }

  const zus: string = typeof raw.zusammenfassung === "string" ? raw.zusammenfassung : "";
  if (!zus) { console.log(`  ✖ ${row.drucksache_nr}: keine zusammenfassung in raw`); skipped++; continue; }

  const { zusammenfassung: cleanZus, fields: xmlFields } = splitAndExtract(zus);

  // Merge: original JSON keys gewinnen wenn nicht-null
  const final: Record<string, any> = {
    zusammenfassung: cleanZus,
    kerninhalt: raw.kerninhalt ?? null,
    thema: raw.thema ?? null,
    tonalitaet: raw.tonalitaet ?? null,
    betroffene_gruppen: raw.betroffene_gruppen ?? null,
    fraktion: raw.fraktion ?? null,
    dokumenttyp: raw.dokumenttyp ?? null,
    regelung: raw.regelung ?? null,
    begruendung: raw.begruendung ?? null,
    auswirkung: raw.auswirkung ?? null,
  };

  // XML-Felder fluten Lücken
  for (const [k, v] of Object.entries(xmlFields)) {
    if (final[k] != null && final[k] !== "" && !(Array.isArray(final[k]) && final[k].length === 0)) continue;
    if (k === "kerninhalt" || k === "thema") {
      final[k] = parseArrayField(v);
    } else {
      final[k] = v;
    }
  }

  // kerninhalt: wenn String mit JSON-Array, parsen
  if (typeof final.kerninhalt === "string") {
    const arr = parseArrayField(final.kerninhalt);
    if (arr) final.kerninhalt = arr;
  }

  // thema validieren
  const themaArr: string[] | null = Array.isArray(final.thema) ? final.thema :
    typeof final.thema === "string" ? parseArrayField(final.thema) : null;
  const { thema, drift } = validateThema(themaArr);

  // Sanity: zusammenfassung darf keine XML mehr enthalten
  if (/<\/|<parameter/.test(final.zusammenfassung)) {
    console.log(`  ⚠ ${row.drucksache_nr}: zusammenfassung enthält weiter XML nach Cleanup`);
    partial++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`✓ ${row.drucksache_nr} (${row.batch_class}):`);
    console.log(`  zus: ${final.zusammenfassung.slice(0, 80)}…`);
    console.log(`  fields: ${Object.entries(xmlFields).map(([k, v]) => `${k}=${v.length}c`).join(" ")}`);
    fixed++;
    continue;
  }

  update.run(
    final.zusammenfassung,
    final.kerninhalt ? JSON.stringify(final.kerninhalt) : null,
    thema.join(", "),
    final.tonalitaet,
    final.betroffene_gruppen,
    final.fraktion,
    final.dokumenttyp,
    final.regelung,
    final.begruendung,
    final.auswirkung,
    drift.length > 0 ? JSON.stringify(drift) : null,
    new Date().toISOString(),
    row.drucksache_nr,
  );
  fixed++;
}

console.log(`\n=== Fertig ===`);
console.log(`  Repariert:  ${fixed}`);
console.log(`  Teil-Clean: ${partial}`);
console.log(`  Skipped:    ${skipped}`);
