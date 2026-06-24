/**
 * MANUELLER Check der Berlin-Unterthemen-Klassifikation — KEIN LLM, KEINE API, kostenlos.
 * Strukturelle Plausibilität + lesbare Stichprobe für Augen-Audit.
 *
 *   (default)        Struktur-Checks (Konsistenz, Verteilungen, Anomalien)
 *   --sample N       gib N zufällige DS lesbar aus (Text + Zuordnungen)
 *   --seed S         Sample-Offset
 */
import Database from "better-sqlite3";
import path from "path";
import { TAXONOMIE_BERLIN } from "./_lib/themen-taxonomie-berlin";
import { BERLIN_THEMENFELDER_ALLE } from "../src/lib/berlin-themen-struktur";

const argv = process.argv.slice(2);
const num = (f: string, d: number) => { const i = argv.indexOf(f); return i >= 0 ? parseInt(argv[i + 1], 10) : d; };
const SAMPLE = num("--sample", 0);
const SEED = num("--seed", 0);

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

// Tag -> Feld-Label
const TAG2FELD = new Map<string, string>();
for (const f of BERLIN_THEMENFELDER_ALLE) for (const t of f.tags) TAG2FELD.set(t, f.label);
const ALL_FELDER = new Set(BERLIN_THEMENFELDER_ALLE.map((f) => f.label));

function arr(j: string | null): string[] { if (!j) return []; try { const v = JSON.parse(j); return Array.isArray(v) ? v : []; } catch { return []; } }

type Row = { dbid: string; feld: string; unterthemen_json: string };

if (SAMPLE > 0) {
  const dbids = (db.prepare(`SELECT DISTINCT dbid FROM berlin_ds_unterthemen ORDER BY substr(dbid||'x',-3,1), dbid LIMIT ? OFFSET ?`).all(SAMPLE, SEED * SAMPLE) as { dbid: string }[]).map((r) => r.dbid);
  for (const dbid of dbids) {
    const ds = db.prepare(`SELECT klasse, derived_titel, zusammenfassung, thema_json, kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json FROM berlin_drucksachen_analyses WHERE dbid=?`).get(dbid) as any;
    const z = db.prepare(`SELECT feld, unterthemen_json FROM berlin_ds_unterthemen WHERE dbid=?`).all(dbid) as Row[];
    const tags = arr(ds?.thema_json);
    console.log("█".repeat(80));
    console.log(`${dbid}  [${ds?.klasse}]  ${ds?.derived_titel ?? ""}`);
    console.log(`TAGS: ${tags.join(", ")}`);
    console.log(`ZSF:  ${(ds?.zusammenfassung ?? "").slice(0, 360)}`);
    const ki = [...arr(ds?.kerninhalt_json), ...arr(ds?.kerninhalt_frage_json), ...arr(ds?.kerninhalt_antwort_json)];
    if (ki.length) console.log(`KERN: ${ki.slice(0, 4).join(" | ").slice(0, 300)}`);
    console.log(`ZUORDNUNGEN:`);
    for (const r of z) {
      const hatTag = arr(ds?.thema_json).some((t) => TAG2FELD.get(t) === r.feld);
      console.log(`   ${hatTag ? " " : "⚠"} ${r.feld}  ⟫  ${arr(r.unterthemen_json).join(" + ")}`);
    }
    console.log();
  }
  process.exit(0);
}

// ── STRUKTUR-CHECKS ───────────────────────────────────────────────
const rows = db.prepare(`SELECT u.dbid, u.feld, u.unterthemen_json, a.thema_json FROM berlin_ds_unterthemen u JOIN berlin_drucksachen_analyses a ON a.dbid=u.dbid`).all() as (Row & { thema_json: string })[];

let total = 0, feldOhneTag = 0, unbekanntesUT = 0, unbekanntesFeld = 0;
const feldOhneTagBeispiele: string[] = [];
const utUnbekanntBeispiele: string[] = [];
const validUTperFeld = new Map<string, Set<string>>();
for (const [f, uts] of Object.entries(TAXONOMIE_BERLIN)) validUTperFeld.set(f, new Set(uts));

for (const r of rows) {
  total++;
  const tags = arr(r.thema_json);
  const feldHatTag = tags.some((t) => TAG2FELD.get(t) === r.feld);
  if (!ALL_FELDER.has(r.feld)) { unbekanntesFeld++; }
  if (!feldHatTag) {
    feldOhneTag++;
    if (feldOhneTagBeispiele.length < 20) feldOhneTagBeispiele.push(`${r.dbid}: Feld "${r.feld}" — DS-Tags: [${tags.join(", ")}]`);
  }
  for (const ut of arr(r.unterthemen_json)) {
    if (ut === "Sonstiges") continue;
    if (!validUTperFeld.get(r.feld)?.has(ut)) {
      unbekanntesUT++;
      if (utUnbekanntBeispiele.length < 20) utUnbekanntBeispiele.push(`${r.dbid}: "${ut}" nicht in Taxonomie["${r.feld}"]`);
    }
  }
}

const pct = (n: number) => (100 * n / total).toFixed(1);
console.log("═".repeat(70));
console.log(`STRUKTUR-CHECK — ${total} Zuordnungs-Zeilen`);
console.log("─".repeat(70));
console.log(`Feld zugewiesen OHNE passenden DS-Tag (Force-Fit-Verdacht): ${feldOhneTag} (${pct(feldOhneTag)} %)`);
console.log(`Unterthema NICHT in Taxonomie des Feldes (Drift/Halluzination): ${unbekanntesUT} (${pct(unbekanntesUT)} %)`);
console.log(`Unbekanntes Feld-Label: ${unbekanntesFeld}`);
console.log("─".repeat(70));
console.log("Beispiele Feld-ohne-Tag:");
for (const b of feldOhneTagBeispiele) console.log("  ⚠ " + b);
if (utUnbekanntBeispiele.length) { console.log("\nBeispiele Unterthema-Drift:"); for (const b of utUnbekanntBeispiele) console.log("  ⚠ " + b); }
console.log("═".repeat(70));
