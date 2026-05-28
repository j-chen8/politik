/**
 * Backfillt `berlin_documents.titel` für vote-referenzierte Drucksachen, deren
 * Titel in PARDOK leer ist (Betreff steht nur im PDF-Body — typisch bei
 * Entschließungsanträgen zu Volksinitiativen/Volksbegehren).
 *
 * Hintergrund: Solche titellosen DS rendern in der Abstimmungs-Ansicht als
 * nacktes „Drucksache 19/X". Die Titel sind aus den PDF-Volltexten
 * (berlin_pdf_texts) recoverbar.
 *
 * Zwei Teile:
 *  1. KNOWN_TITLES — manuell aus dem PDF verifizierte Titel (inkl. Fraktions-
 *     Disambiguierung). Werden mit --write idempotent auf LEERE titel gesetzt
 *     → garantiert exakte Reproduktion nach einem DS-Re-Seed.
 *  2. Scan — findet WEITERE titellose vote-referenzierte DS und zeigt deren
 *     PDF-Header + einen Heuristik-Kandidaten zur MANUELLEN Prüfung an.
 *     (Wird NICHT auto-geschrieben — Titel sind zu wichtig zum Blind-Raten.)
 *
 * Run:
 *   npx tsx scripts/backfill-berlin-vote-ds-titles.ts           (dry-run + scan)
 *   npx tsx scripts/backfill-berlin-vote-ds-titles.ts --write    (KNOWN_TITLES setzen)
 */
import Database from "better-sqlite3";
import path from "path";

const WRITE = process.argv.includes("--write");
const db = new Database(path.join(process.cwd(), "politik.db"));

// Manuell aus den PDF-Headern verifiziert (Betreff + proponierende Fraktion).
const KNOWN_TITLES: Record<string, string> = {
  "D-426783": "Entschließung zur Volksinitiative „Bauwende für Berlin – ökologisch und sozial“ (Grüne/Linke)",
  "D-426794": "Entschließung zur Volksinitiative „Bauwende für Berlin – ökologisch und sozial“ (CDU/SPD)",
  "D-441305": "Entschließung zum Volksbegehren „Berlin werbefrei“ (Werberegulierungsgesetz)",
};

function isGenericTitle(t: string | null): boolean {
  if (!t) return true;
  const s = t.trim();
  if (s.length < 12) return true;
  return /^(Beschlussempfehlung|Mitteilung zur Kenntnisnahme|Vorlage|Antrag|Drucksache|Gesetzentwurf)(\s|$)/i.test(s);
}

/** Heuristik: Betreff aus einem Berliner DS-PDF-Header ziehen. Konservativ —
 *  nur als Vorschlag zur manuellen Prüfung, nicht zum Auto-Write. */
function extractTitleCandidate(fullText: string): string | null {
  const lines = fullText.split("\n").map((l) => l.trim());
  const introRe = /^(\d+\.\s*Wahlperiode|Drucksache\s+\d+\/|Antrag$|Gesetzentwurf$|Vorlage(\s|$)|der (Fraktion|Senat)|des Senats|der Fraktionen|auf Annahme|gemäß Artikel|[–-]\s*Drucksache|\d{2}\.\d{2}\.\d{4}|Neufassung|zum Antrag auf)/i;
  const termRe = /(wolle beschließen|^Begründung|^A\.\s*Problem|^Der Senat wird|^1\.\s|^Artikel\s+1|^Inhaltsverzeichnis)/i;
  let termIdx = lines.findIndex((l) => termRe.test(l));
  if (termIdx < 0) termIdx = Math.min(lines.length, 18);
  const titleLines: string[] = [];
  for (let i = termIdx - 1; i >= 0 && titleLines.length < 3; i--) {
    const l = lines[i];
    if (!l) { if (titleLines.length > 0) break; else continue; }
    if (introRe.test(l)) break;
    titleLines.unshift(l);
  }
  const title = titleLines.join(" ").replace(/\s+/g, " ").replace(/^[„"”]+|["“”]+$/g, "").trim();
  return title.length >= 8 ? title : null;
}

// ── Teil 1: KNOWN_TITLES setzen ───────────────────────────────
const upd = db.prepare(`UPDATE berlin_documents SET titel=@titel WHERE dbid=@dbid AND COALESCE(titel,'')=''`);
let written = 0, alreadySet = 0;
console.log(`\n=== KNOWN_TITLES (${Object.keys(KNOWN_TITLES).length}) ===`);
for (const [dbid, titel] of Object.entries(KNOWN_TITLES)) {
  const cur = db.prepare(`SELECT titel FROM berlin_documents WHERE dbid=?`).get(dbid) as { titel: string | null } | undefined;
  if (!cur) { console.log(`  ⚠ ${dbid} nicht in berlin_documents`); continue; }
  if (cur.titel && cur.titel.trim()) { alreadySet++; console.log(`  • ${dbid}: bereits gesetzt (skip)`); continue; }
  if (WRITE) { upd.run({ dbid, titel }); written++; console.log(`  ✓ ${dbid}: gesetzt`); }
  else console.log(`  → ${dbid}: WÜRDE setzen → ${titel}`);
}

// ── Teil 2: Scan nach weiteren titellosen vote-referenzierten DS ──
const titelStmt = db.prepare(
  `SELECT COALESCE(NULLIF(bd.titel,''), NULLIF(bd.abstract,''), NULLIF(bd.desk,'')) AS titel,
          bd.vorgang_id AS vorgang_id, bd.lok_url AS lok_url, bd.dok_nr AS dok_nr
   FROM berlin_documents bd WHERE bd.dbid = ?`,
);
const vorgangStmt = db.prepare(
  `SELECT COALESCE(NULLIF(titel,''), NULLIF(abstract,'')) AS titel FROM berlin_documents
   WHERE vorgang_id = ? AND (dok_typ_label LIKE '%Antrag%' OR dok_typ_label LIKE '%Gesetzentwurf%' OR dok_typ_label LIKE '%Vorlage%')
     AND COALESCE(NULLIF(titel,''),NULLIF(abstract,'')) IS NOT NULL LIMIT 1`,
);
const pdfStmt = db.prepare(`SELECT full_text FROM berlin_pdf_texts WHERE lok_url = ?`);

const voteDbids = db.prepare(
  `SELECT DISTINCT j.value AS dbid FROM berlin_votes bv, json_each(bv.drucksache_dbids_json) j
   WHERE bv.outcome != 'kein_vote' AND bv.drucksache_dbids_json NOT IN ('','[]')`,
).all() as { dbid: string }[];

const review: string[] = [];
for (const { dbid } of voteDbids) {
  if (KNOWN_TITLES[dbid]) continue;
  const t = titelStmt.get(dbid) as { titel: string | null; vorgang_id: string | null; lok_url: string | null; dok_nr: string | null } | undefined;
  if (!t) continue;
  let eff = t.titel;
  if (isGenericTitle(eff) && t.vorgang_id) {
    const vt = vorgangStmt.get(t.vorgang_id) as { titel: string | null } | undefined;
    if (vt?.titel?.trim()) eff = vt.titel;
  }
  if (!isGenericTitle(eff)) continue; // hat brauchbaren Titel → ok
  // titellos: PDF-Header + Kandidat zeigen
  const pdf = t.lok_url ? (pdfStmt.get(t.lok_url) as { full_text: string | null } | undefined) : undefined;
  const cand = pdf?.full_text ? extractTitleCandidate(pdf.full_text) : null;
  review.push(
    `  ${dbid} (${t.dok_nr}): ${pdf?.full_text ? "PDF da" : "KEIN PDF"}\n` +
    `     Kandidat: ${cand ?? "∅ (nicht extrahierbar)"}` +
    (pdf?.full_text ? `\n     Header: ${pdf.full_text.split("\n").map(l=>l.trim()).filter(Boolean).slice(0,6).join(" | ").slice(0,200)}` : ""),
  );
}
console.log(`\n=== Weitere titellose vote-referenzierte DS: ${review.length} (manuelle Prüfung) ===`);
if (review.length === 0) console.log("  (keine — alle vote-referenzierten DS haben brauchbare Titel)");
else console.log(review.join("\n"));

console.log(`\n${WRITE ? `Geschrieben: ${written}` : "DRY-RUN"} | bereits gesetzt: ${alreadySet}`);
db.close();
