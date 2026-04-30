/**
 * Health-Check vor Snapshot.
 *
 * Listet pro Datentyp und pro MdB systematisch Lücken auf, damit klar wird,
 * wo der Datenstand "nicht 100 %" ist, bevor wir den Snapshot festschreiben.
 *
 * Gruppen:
 *  1. Bestand-Übersicht (wie viele Zeilen pro Tabelle)
 *  2. Coverage pro MdB (Bundestag) — was fehlt wo
 *  3. Spezielle Daten-Probleme (defekte JSONs, doppelte Parteien, NULL-Werte)
 *
 * Run: npx tsx scripts/health-check.ts
 */

import Database from "better-sqlite3";

const db = new Database("politik.db");
db.pragma("journal_mode = WAL");

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function bar(pct: number): string {
  const filled = Math.round(pct / 5);
  const color = pct >= 95 ? C.green : pct >= 80 ? C.yellow : C.red;
  return color + "█".repeat(filled) + C.dim + "░".repeat(20 - filled) + C.reset;
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

// ────────────────────────────────────────────────────────
// 1. Bestand-Übersicht
// ────────────────────────────────────────────────────────

console.log(`\n${C.bold}═══ 1. BESTAND ═══${C.reset}\n`);

const tables = [
  "politicians", "parties", "mandates", "parliament_periods", "parliaments",
  "sidejobs", "committee_memberships", "votes",
  "activities", "plenar_sessions", "plenar_speeches", "speech_summaries",
  "ausschuss_sessions", "ausschuss_topics", "ausschuss_speakers", "ausschuss_attendees",
  "politician_notes",
];

for (const t of tables) {
  try {
    const c = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get() as { c: number };
    console.log(`  ${t.padEnd(26)} ${c.c.toLocaleString("de-DE").padStart(8)} Zeilen`);
  } catch {
    console.log(`  ${t.padEnd(26)} ${C.red}— Tabelle fehlt${C.reset}`);
  }
}

// ────────────────────────────────────────────────────────
// 2. Coverage pro Bundestag-MdB
// ────────────────────────────────────────────────────────

console.log(`\n${C.bold}═══ 2. COVERAGE BUNDESTAG-MdBs (Hauptdaten) ═══${C.reset}\n`);

const total = db.prepare(`
  SELECT COUNT(DISTINCT p.id) AS c FROM politicians p
  JOIN mandates m ON m.politician_id=p.id AND m.type='mandate'
  JOIN parliament_periods pp ON m.parliament_period_id=pp.id
  JOIN parliaments par ON pp.parliament_id=par.id
  WHERE par.type='bundestag'
`).get() as { c: number };

const checks: { label: string; sql: string; threshold?: number }[] = [
  { label: "Wikidata-QID",       sql: "p.qid_wikidata IS NOT NULL" },
  { label: "Foto",               sql: "p.photo_url IS NOT NULL", threshold: 80 },
  { label: "Wikipedia-Bio",      sql: "p.bio_summary IS NOT NULL" },
  { label: "Twitter",            sql: "p.twitter_handle IS NOT NULL", threshold: 70 },
  { label: "Instagram",          sql: "p.instagram_handle IS NOT NULL", threshold: 80 },
  { label: "Homepage-URL",       sql: "p.homepage_url IS NOT NULL" },
  { label: "CV (Wikipedia)",     sql: "p.cv_json IS NOT NULL", threshold: 90 },
  { label: "CV (Homepage)",      sql: "p.cv_homepage_json IS NOT NULL", threshold: 80 },
  { label: "CV-Roh-Text Homepage",sql: "p.cv_homepage_text IS NOT NULL", threshold: 80 },
  { label: "CV-Summary (Bio)",   sql: "p.cv_summary IS NOT NULL", threshold: 95 },
  { label: "≥1 Sidejob",         sql: "p.id IN (SELECT politician_id FROM sidejobs)", threshold: 70 },
  { label: "≥1 Ausschuss",       sql: "p.id IN (SELECT politician_id FROM committee_memberships)", threshold: 80 },
  { label: "≥1 Vote",            sql: "p.id IN (SELECT politician_id FROM votes)", threshold: 90 },
  { label: "≥1 Rede",            sql: "p.id IN (SELECT politician_id FROM speech_summaries WHERE politician_id IS NOT NULL)" },
  { label: "≥1 DIP-Aktivität",   sql: "p.id IN (SELECT politician_id FROM activities)", threshold: 90 },
];

console.log(`  ${C.dim}Bundestag-MdBs gesamt: ${total.c}${C.reset}\n`);
console.log(`  ${"Datentyp".padEnd(26)} ${"Coverage".padEnd(20)}  ${"%".padStart(5)}  ${"haben".padStart(6)} ${"fehlen".padStart(7)}`);
console.log(`  ${"─".repeat(72)}`);

for (const ck of checks) {
  const have = db.prepare(`
    SELECT COUNT(DISTINCT p.id) AS c FROM politicians p
    JOIN mandates m ON m.politician_id=p.id AND m.type='mandate'
    JOIN parliament_periods pp ON m.parliament_period_id=pp.id
    JOIN parliaments par ON pp.parliament_id=par.id
    WHERE par.type='bundestag' AND ${ck.sql}
  `).get() as { c: number };
  const p = pct(have.c, total.c);
  const missing = total.c - have.c;
  const line = `  ${ck.label.padEnd(26)} ${bar(p)}  ${p.toString().padStart(5)}  ${have.c.toString().padStart(6)} ${C.dim}${missing.toString().padStart(7)}${C.reset}`;
  console.log(line);
}

// ────────────────────────────────────────────────────────
// 3. Detail-Lücken (welche MdBs konkret)
// ────────────────────────────────────────────────────────

console.log(`\n${C.bold}═══ 3. KONKRETE LÜCKEN ═══${C.reset}\n`);

interface MissingRow { id: number; name: string; partei: string; }

function listMissing(label: string, sqlCondition: string, limit = 10) {
  const rows = db.prepare(`
    SELECT p.id, p.first_name || ' ' || p.last_name AS name, COALESCE(pa.label, '?') AS partei
    FROM politicians p
    JOIN mandates m ON m.politician_id=p.id AND m.type='mandate'
    JOIN parliament_periods pp ON m.parliament_period_id=pp.id
    JOIN parliaments par ON pp.parliament_id=par.id
    LEFT JOIN parties pa ON pa.id=p.party_id
    WHERE par.type='bundestag' AND ${sqlCondition}
    ORDER BY p.last_name LIMIT ${limit}
  `).all() as MissingRow[];
  if (rows.length === 0) return;
  console.log(`${C.yellow}  ${label}${C.reset} (${rows.length}${rows.length === limit ? "+" : ""}):`);
  for (const r of rows) {
    console.log(`    - ${r.name} (${r.partei}, id=${r.id})`);
  }
  console.log();
}

listMissing("Ohne Foto", "p.photo_url IS NULL");
listMissing("Ohne Sidejob", "p.id NOT IN (SELECT politician_id FROM sidejobs)");
listMissing("Ohne Ausschuss-Mitgliedschaft", "p.id NOT IN (SELECT politician_id FROM committee_memberships)");
listMissing("Ohne Wikipedia-Bio", "p.bio_summary IS NULL");
listMissing("Ohne CV (weder Wikipedia noch Homepage)", "p.cv_json IS NULL AND p.cv_homepage_json IS NULL");

// ────────────────────────────────────────────────────────
// 4. Daten-Qualität
// ────────────────────────────────────────────────────────

console.log(`${C.bold}═══ 4. DATEN-QUALITÄT ═══${C.reset}\n`);

// Defekte cv_json
const brokenCv = db.prepare(`SELECT id, first_name, last_name FROM politicians WHERE cv_json IS NOT NULL AND cv_json NOT LIKE '{%}'`).all() as any[];
console.log(`  Defekte cv_json: ${brokenCv.length === 0 ? C.green + "0 ✓" : C.red + brokenCv.length}${C.reset}`);

// Speech-Summaries ohne politician_id
const orphanSpeeches = db.prepare(`SELECT COUNT(*) AS c FROM speech_summaries WHERE politician_id IS NULL`).get() as any;
console.log(`  Reden ohne Politician-Link: ${orphanSpeeches.c === 0 ? C.green + "0 ✓" : C.red + orphanSpeeches.c}${C.reset}`);

// Doppelte Parteien (Heuristik: Labels, die Substrings voneinander sind)
const allParties = db.prepare(`SELECT id, label FROM parties ORDER BY label`).all() as { id: number; label: string }[];
const dupes: string[] = [];
for (let i = 0; i < allParties.length; i++) {
  for (let j = i + 1; j < allParties.length; j++) {
    const a = allParties[i].label.toLowerCase();
    const b = allParties[j].label.toLowerCase();
    if (a !== b && (a.includes(b) || b.includes(a)) && Math.abs(a.length - b.length) > 3) {
      dupes.push(`${allParties[i].label} (id ${allParties[i].id}) ↔ ${allParties[j].label} (id ${allParties[j].id})`);
    }
  }
}
console.log(`  Mögliche doppelte Parteien: ${dupes.length === 0 ? C.green + "0 ✓" : C.yellow + dupes.length}${C.reset}`);
for (const d of dupes) console.log(`    - ${d}`);

// Politicians ohne Mandat (sollte für Quereinsteiger erwartet sein)
const noMandate = db.prepare(`
  SELECT COUNT(*) AS c FROM politicians p
  WHERE p.id NOT IN (SELECT DISTINCT politician_id FROM mandates WHERE politician_id IS NOT NULL)
`).get() as any;
console.log(`  Politicians ohne Mandat: ${noMandate.c} ${C.dim}(Quereinsteiger-Minister sind ok)${C.reset}`);

// LLM-Audit-Coverage
const cvWithModel = db.prepare(`SELECT COUNT(*) AS c FROM politicians WHERE cv_json IS NOT NULL AND cv_model IS NOT NULL`).get() as any;
const cvJsonTotal = db.prepare(`SELECT COUNT(*) AS c FROM politicians WHERE cv_json IS NOT NULL`).get() as any;
console.log(`  cv_json mit Modell-Tag: ${cvWithModel.c}/${cvJsonTotal.c} (${pct(cvWithModel.c, cvJsonTotal.c)}%)`);

const speechWithModel = db.prepare(`SELECT COUNT(*) AS c FROM speech_summaries WHERE model IS NOT NULL`).get() as any;
const speechTotal = db.prepare(`SELECT COUNT(*) AS c FROM speech_summaries`).get() as any;
console.log(`  speech_summaries mit Modell-Tag: ${speechWithModel.c}/${speechTotal.c} (${pct(speechWithModel.c, speechTotal.c)}%)`);

// ────────────────────────────────────────────────────────
// 5. Frische der Daten
// ────────────────────────────────────────────────────────

console.log(`\n${C.bold}═══ 5. DATEN-FRISCHE ═══${C.reset}\n`);

const dipLatest = db.prepare(`SELECT MAX(datum) AS d FROM activities`).get() as any;
const speechLatest = db.prepare(`SELECT MAX(datum) AS d FROM speech_summaries`).get() as any;
const sidejobLatest = db.prepare(`SELECT MAX(data_change_date) AS d FROM sidejobs`).get() as any;
const voteLatest = db.prepare(`SELECT MAX(poll_date) AS d FROM votes`).get() as any;

const today = new Date().toISOString().slice(0, 10);
function age(d: string | null): string {
  if (!d) return C.red + "?";
  const days = Math.floor((Date.parse(today) - Date.parse(d.slice(0, 10))) / 86400000);
  const color = days < 14 ? C.green : days < 60 ? C.yellow : C.red;
  return `${color}${d.slice(0, 10)} (vor ${days} Tagen)${C.reset}`;
}

console.log(`  Letzte DIP-Aktivität:    ${age(dipLatest.d)}`);
console.log(`  Letzte Plenar-Rede:      ${age(speechLatest.d)}`);
console.log(`  Letzter Sidejob-Update:  ${age(sidejobLatest.d)}`);
console.log(`  Letzter Vote:            ${age(voteLatest.d)}`);

console.log(`\n${C.bold}═══ ENDE ═══${C.reset}\n`);

db.close();
