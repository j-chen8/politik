/**
 * Regex-Label für Berlin-Beschlussempfehlungen (kein LLM!).
 *
 * 935 sehr kurze prozedurale DS (Ø 2.466 Z). Sparen ~$5 vs LLM-Analyse.
 *
 * Output-Outcomes (Häufigkeit aus 935 DS empirisch):
 *   ablehnung           ~53 %
 *   annahme             ~30 %
 *   annahme_geaendert    ~7 %
 *   zustimmung_vermoegen ~7 % (Hauptausschuss: Verkauf/Erbbaurecht/Genehmigung)
 *   erledigt             ~0,6 %
 *   kenntnisnahme        ~0,5 %
 *   sonstiges            <1 %
 *
 * Plus: einstimmig_oder_mehrheitlich erkannt für UI ("wie wurde abgestimmt?").
 *
 * Run: npx tsx scripts/label-berlin-beschlussempfehlungen.ts [--dry-run]
 *      Default: schreibt in berlin_drucksachen_analyses (idempotent via INSERT OR REPLACE).
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DRY_RUN = process.argv.includes("--dry-run");

// Outcome-Patterns (Priorität top-down: spezifisch vor generisch)
const PATTERNS: Array<{ name: string; re: RegExp }> = [
  // Geänderte Annahme zuerst (spezifischer)
  { name: "annahme_geaendert", re: /(in (geänderter|folgender) Fassung|mit folgenden Änderungen)\s*(angenommen|wird angenommen|beschlossen)/i },
  // Ablehnung — auch bei "auch mit Änderung X abgelehnt"
  { name: "ablehnung", re: /\babgelehnt\b/i },
  // Vermögens-Zustimmungen (Hauptausschuss — Verkauf/Erbbaurecht/Genehmigung)
  { name: "zustimmung_vermoegen", re: /(stimmt|zugestimmt|wird zugestimmt|genehmigt|nachträglich genehmigt)(\s+der|\s+dem|\s+nachträglich)?/i },
  // Standard-Annahme
  { name: "annahme", re: /\b(angenommen|wird angenommen|wird in folgender Fassung beschlossen|beschlossen)\b/i },
  // Andere
  { name: "erledigt", re: /(für erledigt erklärt|als erledigt)/i },
  { name: "vertagung", re: /\b(vertagt|Vertagung)\b/i },
  { name: "zurueckgezogen", re: /(zurückgezogen|zurück gezogen)/i },
  { name: "ueberweisen", re: /(wird|werden|sei|seien)\s+überwiesen/i },
  { name: "kenntnisnahme", re: /(zur Kenntnis genommen|wird zur Kenntnis genommen)/i },
];

// Stimmverhalten (zusätzlich zum Outcome)
const MEHRHEIT_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "einstimmig", re: /\beinstimmig\b/i },
  { name: "mehrheitlich", re: /\bmehrheitlich\b/i },
];

function classifyBeschluss(text: string): { outcome: string; mehrheit: string | null } {
  let outcome = "sonstiges";
  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      outcome = p.name;
      break;
    }
  }
  let mehrheit: string | null = null;
  for (const p of MEHRHEIT_PATTERNS) {
    if (p.re.test(text)) {
      mehrheit = p.name;
      break;
    }
  }
  return { outcome, mehrheit };
}

function main() {
  const db = new Database(DB_PATH, { readonly: false });
  db.pragma("journal_mode = WAL");

  // Schema check
  const hasTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='berlin_drucksachen_analyses'`).get();
  if (!hasTable) {
    console.error("berlin_drucksachen_analyses fehlt — npx tsx scripts/init-berlin-drucksachen-analyses-schema.ts");
    process.exit(1);
  }

  const rows = db.prepare(`
    SELECT d.dbid, d.titel, t.full_text, t.chars
    FROM berlin_documents d
    JOIN berlin_pdf_texts t ON d.lok_url = t.lok_url
    WHERE d.dok_typ_label = 'Beschlussempfehlung' AND t.full_text != ''
  `).all() as { dbid: string; titel: string | null; full_text: string; chars: number }[];

  console.log(`${rows.length} Beschlussempfehlungen zu labeln (${DRY_RUN ? "DRY-RUN" : "LIVE"})\n`);

  const outcomes = new Map<string, number>();
  const mehrheiten = new Map<string, number>();
  const sonstigesDbids: string[] = [];

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO berlin_drucksachen_analyses (
      dbid, klasse, regex_label, zusammenfassung,
      model, prompt_version, batch_id, batch_stage, created_at
    ) VALUES (?, 'beschlussempfehlung_regex', ?, ?, 'regex-v1', 'berlin-ds-regex-v1', NULL, NULL, CURRENT_TIMESTAMP)
  `);

  // Klassifikation läuft IMMER (auch DRY_RUN — sonst keine Stats)
  // INSERT nur in einer Transaktion wenn !DRY_RUN
  const records: Array<{ dbid: string; outcome: string; mehrheit: string | null; label: string; summary: string }> = [];
  for (const r of rows) {
    const { outcome, mehrheit } = classifyBeschluss(r.full_text);
    outcomes.set(outcome, (outcomes.get(outcome) ?? 0) + 1);
    if (mehrheit) mehrheiten.set(mehrheit, (mehrheiten.get(mehrheit) ?? 0) + 1);
    if (outcome === "sonstiges") sonstigesDbids.push(r.dbid);

    const summary = mehrheit
      ? `Beschlussempfehlung: ${outcome.replace("_", " ")} (${mehrheit}).`
      : `Beschlussempfehlung: ${outcome.replace("_", " ")}.`;
    const label = mehrheit ? `${outcome}+${mehrheit}` : outcome;
    records.push({ dbid: r.dbid, outcome, mehrheit, label, summary });
  }
  if (!DRY_RUN) {
    const tx = db.transaction(() => {
      for (const rec of records) upsert.run(rec.dbid, rec.label, rec.summary);
    });
    tx();
  }

  console.log("Outcome-Verteilung:");
  for (const [o, n] of [...outcomes.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(22)} ${n.toString().padStart(4)} (${(n / rows.length * 100).toFixed(1)}%)`);
  }
  console.log("\nStimmverhalten-Verteilung (wo erkennbar):");
  for (const [o, n] of [...mehrheiten.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(22)} ${n.toString().padStart(4)} (${(n / rows.length * 100).toFixed(1)}%)`);
  }

  if (sonstigesDbids.length > 0) {
    console.log(`\n${sonstigesDbids.length} DS als 'sonstiges' klassifiziert — Beispiele:`);
    for (const id of sonstigesDbids.slice(0, 3)) console.log(`  ${id}`);
  }

  if (!DRY_RUN) {
    const written = db.prepare(`SELECT COUNT(*) c FROM berlin_drucksachen_analyses WHERE klasse='beschlussempfehlung_regex'`).get() as { c: number };
    console.log(`\n✓ ${written.c} Einträge in berlin_drucksachen_analyses (klasse='beschlussempfehlung_regex').`);
  }

  db.close();
}

main();
