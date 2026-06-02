/**
 * build-lanz-batch-appearances.ts
 *
 * Materialisiert die Lanz-MdB-Auftritte aus data/lanz-mdb-appearances.json in
 * Batch-Appearance-Records für scripts/batch-media-analyses.ts (--from).
 *
 * - Slug = transliterierter Nachname (Klöckner→kloeckner), muss zu bereits
 *   analysierten data/media-analyses/<slug>-lanz-<date>.json passen → die werden
 *   übersprungen (keine Doppel-Analyse, kein Doppel-Geld).
 * - Episoden ohne Transkript (z.B. 12.06.2025 van Aken) werden übersprungen.
 * - other_speakers = die anderen MdB derselben Sendung (aus dem Dataset; Nicht-MdB-
 *   Gäste sind nicht erfasst → generischer Hinweis im Prompt).
 * - politician_desc = grounded aus DB (fraction + cv_summary-Anriss). Neutral, keine
 *   Wertung.
 * - Staged die committeten VTTs nach .tmp-media/lanz-<date>.deu.vtt (Batch-Konvention).
 *
 * Usage: npx tsx scripts/build-lanz-batch-appearances.ts
 *        → schreibt data/lanz-batch-appearances.json
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATASET = "data/lanz-mdb-appearances.json";
const OUT = "data/lanz-batch-appearances.json";
const ANALYSES_DIR = "data/media-analyses";
const TMP = ".tmp-media";
const DB_PATH = "politik.db";

const UMLAUT: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue" };
function slugLastName(fullName: string): string {
  // Nachname = letztes Token (für Lanz-Gäste ausreichend)
  const last = fullName.trim().split(/\s+/).pop() ?? fullName;
  return last
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUT[c] ?? c)
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // restliche Diakritika
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function isoDate(de: string): string {
  // DD.MM.YYYY → YYYY-MM-DD
  const [d, m, y] = de.split(".");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const data = JSON.parse(fs.readFileSync(DATASET, "utf-8"));
const episodes: Record<string, any> = data.episodes;
const db = new Database(DB_PATH, { readonly: true });
const descStmt = db.prepare(
  "SELECT first_name||' '||last_name AS name, rolle, amt, cv_summary FROM politicians WHERE id = ?"
);

function buildDesc(politicianId: number, fraction: string): string {
  const row = descStmt.get(politicianId) as any;
  const parts: string[] = [];
  parts.push(`${fraction}, MdB`);
  if (row?.amt) parts.push(String(row.amt));
  let base = parts.join(", ");
  if (row?.cv_summary) {
    let s = String(row.cv_summary).replace(/\s+/g, " ").trim();
    if (s.length > 260) s = s.slice(0, 257).replace(/\s+\S*$/, "") + "…";
    base += ". " + s;
  }
  return base;
}

// date(DE) → Liste der MdB-Namen dieser Sendung (für other_speakers)
const guestsByDate: Record<string, { name: string; fraction: string }[]> = {};
for (const m of data.mdb) {
  for (const ap of m.appearances) {
    (guestsByDate[ap.date] ??= []).push({ name: m.name, fraction: m.fraction });
  }
}

fs.mkdirSync(TMP, { recursive: true });
const out: any[] = [];
const warnings: string[] = [];
let skippedDone = 0, skippedNoTranscript = 0, staged = 0;

for (const m of data.mdb) {
  for (const ap of m.appearances) {
    const ep = episodes[ap.date];
    if (!ep || !ep.has_transcript || !ep.transcript_file) { skippedNoTranscript++; continue; }
    const iso = isoDate(ap.date);
    const slug = slugLastName(m.name);
    const customId = `${slug}-lanz-${iso}`;

    // schon analysiert?
    if (fs.existsSync(path.join(ANALYSES_DIR, `${customId}.json`))) { skippedDone++; continue; }

    // VTT stagen
    const srcVtt = ep.transcript_file;
    if (!fs.existsSync(srcVtt)) { warnings.push(`VTT-Quelle fehlt: ${srcVtt} (${customId})`); continue; }
    const videoId = `lanz-${iso}`;
    const dstVtt = path.join(TMP, `${videoId}.deu.vtt`);
    fs.copyFileSync(srcVtt, dstVtt);
    staged++;

    // other_speakers = andere MdB derselben Sendung + generischer Nicht-MdB-Hinweis
    const others = (guestsByDate[ap.date] ?? [])
      .filter((g) => g.name !== m.name)
      .map((g) => `${g.name} (${g.fraction}, MdB)`);
    const otherSpeakers =
      (others.length ? others.join("; ") + ". " : "") +
      "Markus Lanz lädt pro Sendung mehrere Gäste; weitere Diskutant:innen (Journalist:innen, Fachleute, Nicht-MdB) können im Transkript vorkommen.";

    out.push({
      custom_id: customId,
      politician_id: m.politician_id,
      politician: m.name,
      host: "Markus Lanz",
      publisher: "Markus Lanz (ZDF)",
      episode_label: ep.title ?? `Markus Lanz vom ${ap.date}`,
      url: ap.zdf_url ?? ep.zdf_url,
      video_id: videoId,
      published_at: iso,
      duration_label: "ca. 75 Min",
      format: "tv",
      other_speakers: otherSpeakers,
      politician_desc: buildDesc(m.politician_id, m.fraction),
    });
  }
}

// Kollisions-Check (gleiche custom_id mehrfach)
const seen = new Set<string>();
for (const a of out) {
  if (seen.has(a.custom_id)) warnings.push(`DUPLIKAT custom_id: ${a.custom_id}`);
  seen.add(a.custom_id);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`✓ ${out.length} Appearances → ${OUT}`);
console.log(`  ${staged} VTTs nach ${TMP} gestaged`);
console.log(`  ${skippedDone} bereits analysiert (übersprungen), ${skippedNoTranscript} ohne Transkript`);
if (warnings.length) {
  console.log(`\n⚠ Warnungen (${warnings.length}):`);
  for (const w of warnings) console.log(`   - ${w}`);
}
db.close();
