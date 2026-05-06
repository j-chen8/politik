/**
 * Wendet die User-recherchierten Auflösungen für die 5 ECHT-Fälle an:
 *   - cv_homepage_json Text-Patches (Merz, Behrens) mit cv_repair_log Audit
 *   - final_verdict-Revisionen ECHT → PRAEZISIERUNG (Nacke, Pantazis)
 *   - final_reason-Vermerke (alle 5)
 *
 * Default = Dry-Run. Mit --apply tatsächlich.
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const APPLY = process.argv.includes("--apply");
const VERSION = "source-coherence-resolutions-v1";

interface TextPatch {
  politicianId: number;
  name: string;
  target: "cv_json" | "cv_homepage_json";
  section: string;
  jahr: string;
  oldText: string;
  newText: string;
  reason: string;
  sourceUrl: string;
}

interface ConflictRevise {
  politicianId: number;
  name: string;
  section: string;
  jahr: string;
  newVerdict?: "ECHT" | "PRAEZISIERUNG" | "FALSE_POSITIVE";
  finalReasonAmendment: string;
}

const textPatches: TextPatch[] = [
  {
    politicianId: 78863, name: "Jürgen Hardt",
    target: "cv_homepage_json",
    section: "ausbildung", jahr: "1982",
    oldText: "Abitur in Hofheim am Taunus",
    newText: "Abitur am Taunus-Gymnasium Königstein/Taunus",
    reason: "User-Recherche: CDU-Landesgruppe NRW belegt Königstein. Homepage hatte den Ort falsch.",
    sourceUrl: "https://cdu-landesgruppe-nrw.de/bundestagsausschuesse/auswaertiges",
  },
  {
    politicianId: 118559, name: "Friedrich Merz",
    target: "cv_homepage_json",
    section: "beruflicher_werdegang", jahr: "2005-2021",
    oldText: "Senior Counsel in der Anwaltskanzlei Mayer Brown LLP",
    newText: "2005-2014 Partner, 2014-2021 Senior Counsel der internationalen Anwaltskanzlei Mayer Brown LLP, Chicago/Düsseldorf",
    reason: "User-Recherche: bundestag.de-Bio belegt 2005-2014 Partner, 2014-2021 Senior Counsel.",
    sourceUrl: "https://www.bundestag.de/abgeordnete/biografien/M/merz_friedrich-862050",
  },
  {
    politicianId: 178435, name: "Jens Behrens",
    target: "cv_homepage_json",
    section: "politische_stationen", jahr: "2018",
    oldText: "stellv. Fraktionsvorsitzender",
    newText: "Stadtratsmitglied seit 2018 (Stadt Lippstadt)",
    reason: "User-Recherche: SPD-Kreis-Soest belegt Chronologie. Stadtratsmitglied seit 2018; Fraktionsvorsitz erst 2022-2025.",
    sourceUrl: "https://www.spd-kreis-soest.de/personen/jens-behrens/",
  },
];

const conflictUpdates: ConflictRevise[] = [
  {
    politicianId: 78863, name: "Jürgen Hardt",
    section: "ausbildung", jahr: "1982",
    finalReasonAmendment: " Korrektur applied: Homepage-Eintrag korrigiert auf 'Abitur am Taunus-Gymnasium Königstein/Taunus'. Quelle: CDU-Landesgruppe NRW.",
  },
  {
    politicianId: 118559, name: "Friedrich Merz",
    section: "beruflicher_werdegang", jahr: "2005",
    finalReasonAmendment: " Korrektur applied: Homepage-Eintrag durch bundestag.de-Wortlaut ersetzt (2005-2014 Partner Mayer Brown LLP).",
  },
  {
    politicianId: 130574, name: "Stefan Nacke",
    section: "politische_stationen", jahr: "2017-2021",
    newVerdict: "PRAEZISIERUNG",
    finalReasonAmendment: " Aufgelöst: Beide Quellen meinen denselben Wahlkreis (LTWK 080 'Münster II'). 'Münster Süd' war damals umgangssprachlich für diesen Wahlkreis. Seit Wahl 2022 wurde Münster in drei Wahlkreise (I Nord, II Mitte/Ost, III Süd/West) aufgeteilt — 'Münster Süd' wäre heute irreführend.",
  },
  {
    politicianId: 136381, name: "Christos Pantazis",
    section: "politische_stationen", jahr: "2023-2025",
    newVerdict: "PRAEZISIERUNG",
    finalReasonAmendment: " Aufgelöst: Vollständige Position laut SPD-Bezirk Braunschweig: 'Beratendes Mitglied im geschäftsführenden Bezirksvorstand'. Beide Quellen geben jeweils einen Aspekt der vollständigen Bezeichnung wieder. Quelle: web.archive.org/.../spd-bezirk-braunschweig.de.",
  },
  {
    politicianId: 178435, name: "Jens Behrens",
    section: "politische_stationen", jahr: "2018",
    finalReasonAmendment: " Korrektur applied: Homepage-Eintrag korrigiert auf 'Stadtratsmitglied seit 2018'. Fraktionsvorsitz war erst 2022-2025 laut SPD-Kreis-Soest.",
  },
];

const db = new Database(DB_PATH);

const insertLog = db.prepare(`
  INSERT INTO cv_repair_log (politician_id, applied_at, repair_version, action,
    section, target_index, original_entry, new_entry, reason, audit)
  VALUES (?, ?, ?, 'set_text', ?, ?, ?, ?, ?, ?)
`);

let textApplied = 0, textSkipped = 0;
let revisedApplied = 0, revisedSkipped = 0;

console.log("=== Text-Patches ===\n");
for (const p of textPatches) {
  const row = db.prepare(`SELECT ${p.target} AS cv FROM politicians WHERE id = ?`)
    .get(p.politicianId) as { cv: string } | undefined;
  if (!row?.cv) { console.log(`✗ ${p.name}: ${p.target} fehlt`); textSkipped += 1; continue; }
  const cv = JSON.parse(row.cv);
  const arr = (cv as Record<string, { jahr: string; text: string }[]>)[p.section];
  if (!Array.isArray(arr)) { console.log(`✗ ${p.name}: ${p.section} fehlt`); textSkipped += 1; continue; }
  const idx = arr.findIndex(e => e.jahr === p.jahr && e.text === p.oldText);
  if (idx < 0) { console.log(`✗ ${p.name}: Eintrag nicht gefunden`); textSkipped += 1; continue; }

  console.log(`${APPLY ? "✓" : "[dry]"} ${p.name} ${p.target} ${p.section}/${p.jahr}`);
  console.log(`  old: "${p.oldText.slice(0, 80)}"`);
  console.log(`  new: "${p.newText.slice(0, 80)}"`);

  if (APPLY) {
    const original = arr[idx];
    arr[idx] = { jahr: p.jahr, text: p.newText };
    db.prepare(`UPDATE politicians SET ${p.target} = ? WHERE id = ?`)
      .run(JSON.stringify(cv), p.politicianId);
    insertLog.run(
      p.politicianId, new Date().toISOString(), VERSION,
      p.section, idx, JSON.stringify(original),
      JSON.stringify({ jahr: p.jahr, text: p.newText }),
      p.reason,
      JSON.stringify({ source: VERSION, target: p.target, sourceUrl: p.sourceUrl })
    );
  }
  textApplied += APPLY ? 1 : 0;
}

console.log("\n=== final_verdict / final_reason Updates ===\n");
for (const u of conflictUpdates) {
  const row = db.prepare(`SELECT source_conflicts FROM politicians WHERE id = ?`)
    .get(u.politicianId) as { source_conflicts: string } | undefined;
  if (!row?.source_conflicts) { console.log(`✗ ${u.name}: source_conflicts fehlt`); revisedSkipped += 1; continue; }
  const conflicts = JSON.parse(row.source_conflicts) as Array<Record<string, any>>;
  const idx = conflicts.findIndex(c => c.section === u.section && c.jahr === u.jahr);
  if (idx < 0) { console.log(`✗ ${u.name}: Konflikt ${u.section}/${u.jahr} nicht gefunden`); revisedSkipped += 1; continue; }

  const before = conflicts[idx].final_verdict;
  const after = u.newVerdict ?? before;
  const reasonBefore = (conflicts[idx].final_reason ?? "").slice(0, 50);
  const verdictChange = u.newVerdict && u.newVerdict !== before ? `${before} → ${after}` : `${before} (unverändert)`;

  console.log(`${APPLY ? "✓" : "[dry]"} ${u.name} ${u.section}/${u.jahr}: ${verdictChange}`);
  console.log(`  reason was:  "${reasonBefore}..."`);
  console.log(`  amendment:   "${u.finalReasonAmendment.slice(0, 100).trim()}..."`);

  if (APPLY) {
    if (u.newVerdict) conflicts[idx].final_verdict = u.newVerdict;
    conflicts[idx].final_reason = (conflicts[idx].final_reason ?? "") + u.finalReasonAmendment;
    conflicts[idx].verdict_method = "opus-4.7-manual-post-haiku-user-research";
    db.prepare(`UPDATE politicians SET source_conflicts = ? WHERE id = ?`)
      .run(JSON.stringify(conflicts), u.politicianId);
  }
  revisedApplied += APPLY ? 1 : 0;
}

db.close();

console.log("");
if (APPLY) {
  console.log(`Text-Patches applied:        ${textApplied} / ${textPatches.length}`);
  console.log(`Conflict-Updates applied:    ${revisedApplied} / ${conflictUpdates.length}`);
} else {
  console.log(`Würde Text-Patches anwenden:        ${textPatches.length - textSkipped}`);
  console.log(`Würde Conflict-Updates anwenden:    ${conflictUpdates.length - revisedSkipped}`);
  console.log("\n→ Mit --apply tatsächlich anwenden");
}
