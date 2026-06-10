/**
 * Themenfeld-Profil (Bundestag) — wer "besitzt" ein Politikfeld?
 *
 * Beantwortet pro abgeordnetenwatch-Politikfeld zwei Fragen aus reinem Zählen:
 *   1. Reden: Wer redet am meisten / am spezialisiertesten über das Feld?
 *   2. Ausschuss: Sitzen genau diese Leute im thematisch passenden Ausschuss?
 *
 * Datenpfad (alles ID-basiert, KEIN Namensstring-Join):
 *   item_topics(source='bt_rede', aw_field)  --item_id-->  plenar_speeches.rede_id
 *   plenar_speeches.redner_id  ==  politicians.bt_redner_id  ==>  committee_memberships.politician_id
 *
 * Neutralität: nur deskriptive Anteile + Mitgliedschaften, kein Werturteil.
 *
 * Run:
 *   npx tsx scripts/analyse-themenfeld.ts --list
 *   npx tsx scripts/analyse-themenfeld.ts "Medien, Kommunikation"
 *   npx tsx scripts/analyse-themenfeld.ts "Medien" --ausschuss "Digitales"
 *   npx tsx scripts/analyse-themenfeld.ts "Energie" --min 15 --top 25
 */
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

// ---- Argumente ----------------------------------------------------------
const argv = process.argv.slice(2);
function flag(name: string, def: string | null = null): string | null {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
}
const wantList = argv.includes("--list");
const minTotal = parseInt(flag("min", "10")!, 10); // min. Gesamtreden, damit Anteil aussagekräftig
const minDigi = parseInt(flag("mindigi", "5")!, 10); // min. Feld-Reden
const topN = parseInt(flag("top", "20")!, 10);
const ausschussFilter = flag("ausschuss"); // optionaler Ausschuss-Substring-Filter
// erstes Nicht-Flag-Argument = Themenfeld-Suchbegriff
const query = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1] || "").startsWith("--"));

// ---- --list: alle Felder zeigen ----------------------------------------
if (wantList || !query) {
  const rows = db
    .prepare(
      `SELECT aw_field, COUNT(DISTINCT item_id) c
       FROM item_topics WHERE source='bt_rede'
       GROUP BY aw_field ORDER BY c DESC`
    )
    .all() as { aw_field: string; c: number }[];
  console.log("\nVerfügbare Politikfelder (bt_rede), mit Anzahl getaggter Reden:\n");
  for (const r of rows) console.log(`  ${String(r.c).padStart(5)}  ${r.aw_field}`);
  console.log(
    `\nNutzung: npx tsx scripts/analyse-themenfeld.ts "<Feld-Substring>" [--ausschuss "<Substr>"] [--min N] [--top N]\n`
  );
  if (!query) process.exit(0);
}

// ---- Feld(er) auflösen ---------------------------------------------------
const fields = (
  db
    .prepare(
      `SELECT DISTINCT aw_field FROM item_topics
       WHERE source='bt_rede' AND lower(aw_field) LIKE '%'||lower(?)||'%'`
    )
    .all(query) as { aw_field: string }[]
).map((r) => r.aw_field);

if (fields.length === 0) {
  console.error(`\nKein Politikfeld passt zu "${query}". Mit --list alle Felder anzeigen.\n`);
  process.exit(1);
}
const ph = fields.map(() => "?").join(",");
console.log(`\n════ Themenfeld-Profil: "${query}" ════`);
console.log("Aufgelöste Felder:");
for (const f of fields) console.log(`  • ${f}`);

// ---- Kennzahlen pro Redner:in -------------------------------------------
type Row = {
  redner_id: string;
  name: string;
  party: string | null;
  n_digi: number;
  n_total: number;
  anteil: number;
  pid: number | null;
};
const rows = db
  .prepare(
    `
  WITH digi AS (
    SELECT DISTINCT item_id FROM item_topics
    WHERE source='bt_rede' AND aw_field IN (${ph})
  ),
  tot AS (
    SELECT redner_id, COUNT(DISTINCT rede_id) n_total
    FROM plenar_speeches WHERE redner_id IS NOT NULL GROUP BY redner_id
  ),
  dg AS (
    SELECT ps.redner_id, COUNT(DISTINCT ps.rede_id) n_digi
    FROM digi JOIN plenar_speeches ps ON ps.rede_id = digi.item_id
    GROUP BY ps.redner_id
  )
  SELECT dg.redner_id,
         p.id AS pid,
         COALESCE(p.first_name||' '||p.last_name,
                  (SELECT speaker FROM plenar_speeches s WHERE s.redner_id=dg.redner_id LIMIT 1)) AS name,
         pa.label AS party,
         dg.n_digi, tot.n_total,
         1.0*dg.n_digi/tot.n_total AS anteil
  FROM dg
  JOIN tot ON tot.redner_id = dg.redner_id
  LEFT JOIN politicians p ON p.bt_redner_id = dg.redner_id
  LEFT JOIN parties pa ON pa.id = p.party_id
  WHERE dg.n_digi >= ?
  `
  )
  .all(...fields, minDigi) as Row[];

const totalReden = db
  .prepare(`SELECT COUNT(DISTINCT item_id) c FROM item_topics WHERE source='bt_rede' AND aw_field IN (${ph})`)
  .get(...fields) as { c: number };
console.log(`Getaggte Reden im Feld gesamt: ${totalReden.c}\n`);

// ---- Ausschuss-Mitgliedschaften je Redner:in ----------------------------
const memStmt = db.prepare(
  `SELECT committee_label, committee_role FROM committee_memberships WHERE politician_id = ?`
);
const roleLabel: Record<string, string> = {
  chairperson: "Vorsitz",
  vice_chairperson: "stellv. Vorsitz",
  foreperson: "Obmann/-frau",
  spokesperson: "Sprecher:in",
  schriftfuehrer: "Schriftführer:in",
  member: "Mitglied",
  alternate_member: "stellv.",
};
function committees(pid: number | null): { matched: string; all: string[] } {
  if (!pid) return { matched: "—", all: [] };
  const ms = memStmt.all(pid) as { committee_label: string; committee_role: string }[];
  const short = (l: string) => l.replace(/^Ausschuss für /, "").replace(/^Ausschuss /, "");
  const all = ms.map((m) => `${short(m.committee_label)} (${roleLabel[m.committee_role] || m.committee_role})`);
  if (ausschussFilter) {
    const hit = ms.find((m) => m.committee_label.toLowerCase().includes(ausschussFilter.toLowerCase()));
    return { matched: hit ? `✓ ${roleLabel[hit.committee_role] || hit.committee_role}` : "✗", all };
  }
  // ohne Filter: passende Mitgliedschaften = die, deren Name ein Feld-Stichwort teilt
  return { matched: all.join("; ") || "—", all };
}

// ---- Ausgabe: Spezialisierung -------------------------------------------
function pad(s: string, n: number) {
  s = s ?? "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
}
const colAussch = ausschussFilter ? `Ausschuss "${ausschussFilter}"` : "Ausschuss-Mitgliedschaften";

console.log(`── Spezialisierung (Anteil Feld-Reden, min. ${minTotal} Reden gesamt) ──`);
console.log(pad("Name", 26) + pad("Partei", 10) + pad("Feld", 6) + pad("Ges.", 6) + pad("Anteil", 8) + colAussch);
const bySpec = rows
  .filter((r) => r.n_total >= minTotal)
  .sort((a, b) => b.anteil - a.anteil || b.n_digi - a.n_digi)
  .slice(0, topN);
for (const r of bySpec) {
  const c = committees(r.pid);
  console.log(
    pad(r.name, 26) +
      pad(r.party || "(Reg./—)", 10) +
      pad(String(r.n_digi), 6) +
      pad(String(r.n_total), 6) +
      pad(Math.round(r.anteil * 100) + "%", 8) +
      c.matched
  );
}

// ---- Ausgabe: Absolute Lautstärke ---------------------------------------
console.log(`\n── Absolute Lautstärke (meiste Feld-Reden) ──`);
console.log(pad("Name", 26) + pad("Partei", 10) + pad("Feld", 6) + pad("Anteil", 8) + colAussch);
const byVol = [...rows].sort((a, b) => b.n_digi - a.n_digi).slice(0, topN);
for (const r of byVol) {
  const c = committees(r.pid);
  console.log(
    pad(r.name, 26) +
      pad(r.party || "(Reg./—)", 10) +
      pad(String(r.n_digi), 6) +
      pad(Math.round(r.anteil * 100) + "%", 8) +
      c.matched
  );
}
console.log();
