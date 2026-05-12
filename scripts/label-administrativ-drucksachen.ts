/**
 * Generiert Kurz-Labels für administrative Drucksachen (Wahlvorschläge,
 * Sammelübersichten, Beschlussempfehlungen). Kein LLM — reine Regex.
 *
 * Schreibt in drucksache_analyses mit batch_class='administrativ' und
 * model='regex-labeler'.
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Schema (idempotent)
db.exec(`
  CREATE TABLE IF NOT EXISTS drucksache_analyses (
    drucksache_nr TEXT PRIMARY KEY,
    batch_class TEXT NOT NULL,
    zusammenfassung TEXT,
    kerninhalt TEXT,
    thema TEXT,
    tonalitaet TEXT,
    betroffene_gruppen TEXT,
    fraktion TEXT,
    label TEXT,
    model TEXT NOT NULL,
    prompt_version TEXT,
    generated_at TEXT NOT NULL,
    raw_llm_response TEXT,
    FOREIGN KEY (drucksache_nr) REFERENCES drucksache_texts(drucksache_nr)
  );
  CREATE INDEX IF NOT EXISTS idx_drucksache_analyses_class ON drucksache_analyses(batch_class);
`);

interface Row { drucksache_nr: string; full_text: string }

function generateLabel(text: string): { zusammenfassung: string; label: string; fraktion: string | null } {
  const head = text.slice(0, 2000);

  // Sammelübersicht zu Petitionen
  const sammel = head.match(/Sammelübersicht\s+(\d+)\s+zu Petitionen/i)
              ?? head.match(/Sammelübersicht\s+(\d+)/i);
  if (sammel) {
    // Anzahl Petitionen aus Listen-Items zählen (heuristisch via "Pet \d-")
    const petCount = (text.match(/Pet\s+\d-\d/g) ?? []).length;
    const label = `Sammelübersicht ${sammel[1]} zu Petitionen`;
    const zus = petCount > 0
      ? `Sammelübersicht ${sammel[1]} des Petitionsausschusses mit ${petCount} behandelten Petitionen.`
      : `Sammelübersicht ${sammel[1]} des Petitionsausschusses (Beschlussempfehlung).`;
    return { zusammenfassung: zus, label, fraktion: null };
  }

  // Beschlussempfehlung (Ausschuss, ohne Sammelübersicht)
  const beschluss = head.match(/Beschlussempfehlung\s*\n?\s*des\s+(\S[^\n]+Ausschuss[^\n]*)/i)
                 ?? head.match(/Beschlussempfehlung\s*(?:und Bericht\s*)?(?:des\s+(\S[^\n]+Ausschuss[^\n]+))?/i);
  if (beschluss && head.includes("Beschlussempfehlung")) {
    const aus = beschluss[1]?.trim() ?? "eines Ausschusses";
    const label = `Beschlussempfehlung ${aus}`;
    return {
      zusammenfassung: `Beschlussempfehlung ${aus} (formaler Verfahrensschritt im Bundestag).`,
      label,
      fraktion: null,
    };
  }

  // Wahlvorschläge
  const wahlMulti = head.match(/Wahlvorschl[aä]ge?\s+(?:der|von)\s+(?:den\s+)?Fraktion(?:en)?\s+([^\n]+)/i);
  if (wahlMulti) {
    const fraktionen = wahlMulti[1].split(/[,;]|\s+und\s+/i).map((s) => s.trim()).filter(Boolean).join(", ");
    const titel = head.match(/Wahl(?:vorschl[aä]ge?)\s+(?:der Mitglieder|von Mitgliedern|der Vertreter)[^\n]*/i);
    const what = titel ? titel[0] : "Wahlvorschlag für ein Gremium";
    const label = `Wahlvorschlag (${fraktionen})`;
    return {
      zusammenfassung: `${what}. Eingebracht von ${fraktionen}.`,
      label,
      fraktion: fraktionen,
    };
  }
  if (/Wahlvorschl[aä]g/i.test(head)) {
    const fr = head.match(/Fraktion\s+(?:der\s+)?([A-ZÄÖÜ][^\n]+)/i)?.[1]?.trim();
    return {
      zusammenfassung: `Wahlvorschlag für ein Bundestags-Gremium.${fr ? ` Eingebracht von Fraktion ${fr}.` : ""}`,
      label: `Wahlvorschlag${fr ? ` (${fr})` : ""}`,
      fraktion: fr ?? null,
    };
  }

  // Fallback
  return {
    zusammenfassung: "Administrative Drucksache (Verfahrenshinweis, Wahlvorschlag oder Petitions-Beschluss).",
    label: "Administrative Drucksache",
    fraktion: null,
  };
}

const rows = db
  .prepare(`SELECT drucksache_nr, full_text FROM drucksache_texts WHERE batch_class = 'administrativ' AND full_text IS NOT NULL`)
  .all() as Row[];

console.log(`📋 ${rows.length} administrative Drucksachen zu labeln`);

const upsert = db.prepare(`
  INSERT INTO drucksache_analyses
    (drucksache_nr, batch_class, zusammenfassung, label, fraktion, model, prompt_version, generated_at)
  VALUES (?, 'administrativ', ?, ?, ?, 'regex-labeler', 'v1', ?)
  ON CONFLICT(drucksache_nr) DO UPDATE SET
    zusammenfassung = excluded.zusammenfassung,
    label = excluded.label,
    fraktion = excluded.fraktion,
    model = excluded.model,
    prompt_version = excluded.prompt_version,
    generated_at = excluded.generated_at
`);

const labelCounts = new Map<string, number>();
const tx = db.transaction(() => {
  for (const r of rows) {
    const out = generateLabel(r.full_text);
    upsert.run(r.drucksache_nr, out.zusammenfassung, out.label, out.fraktion, new Date().toISOString());
    // Label-Bucket zählen (nur erste Worte für Kategorie)
    const bucket = out.label.split(" (")[0].split(" zu ")[0].slice(0, 30);
    labelCounts.set(bucket, (labelCounts.get(bucket) ?? 0) + 1);
  }
});
tx();

console.log(`\n=== Labels generiert ===`);
const sorted = [...labelCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [bucket, n] of sorted) {
  console.log(`  ${bucket.padEnd(35)} ${n}`);
}

// 5 Stichproben anzeigen
console.log(`\n=== 5 Stichproben ===`);
const samples = db
  .prepare(`SELECT drucksache_nr, label, zusammenfassung, fraktion FROM drucksache_analyses WHERE batch_class = 'administrativ' ORDER BY RANDOM() LIMIT 5`)
  .all() as { drucksache_nr: string; label: string; zusammenfassung: string; fraktion: string | null }[];
for (const s of samples) {
  console.log(`  ${s.drucksache_nr.padEnd(8)} [${s.label}]`);
  console.log(`    → ${s.zusammenfassung}`);
}
