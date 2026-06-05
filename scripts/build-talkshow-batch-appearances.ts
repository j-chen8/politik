/**
 * build-talkshow-batch-appearances.ts
 *
 * Pendant zu build-lanz-batch-appearances.ts, aber für die vier getaggten Talkshows
 * (maischberger, Caren Miosga, hart aber fair, Maybrit Illner). Materialisiert die
 * Politiker:innen-Gäste aus data/talkshow-guests-appearances.json in Batch-Appearance-
 * Records für scripts/batch-media-analyses.ts (--from).
 *
 * - Ein Record je (Gast × Folge) — Multi-Speaker-Modus (politician_desc + other_speakers).
 * - custom_id = <slug>-<idkey>-<iso> (slug = transliterierter Nachname). Schon analysierte
 *   data/media-analyses/<custom_id>.json werden übersprungen (kein Doppel-Geld) — das deckt
 *   auch die Hand-Test-Fixtures vom 2026-06-02 ab (gysi-maischberger, merz-miosga, …).
 * - URL/Quelle:
 *     maischberger, miosga, hart_aber_fair → ARD-Mediathek (Video-ID aus dem Transkript-
 *       _manifest.tsv, Spalte 2 = base64-crid) → https://www.ardmediathek.de/video/<id>
 *     illner → ZDF; das illner-_manifest.tsv ist nicht deckungsgleich mit den Transkripten,
 *       daher wird die ZDF-URL aus dem Datum konstruiert (Domain korrekt → korrektes
 *       Methodik-Label im Batch-Apply). Best-Effort; "spezial"-Folgen können abweichen.
 * - other_speakers = die anderen gematchten Gäste der Folge + generischer Nicht-MdB-Hinweis.
 * - politician_desc = grounded aus DB (cv_summary-Anriss) + Partei/Parlament aus dem Match.
 * - Staged die committeten VTTs nach .tmp-media/<video_id>.deu.vtt (Batch-Konvention; alle
 *   vier Shows nutzen ARD/ZDF-Redaktions-Untertitel → .deu.vtt, isZdf-Pfad im Batch-Skript).
 *
 * Usage: npx tsx scripts/build-talkshow-batch-appearances.ts [--show maischberger]
 *        → schreibt data/talkshow-batch-appearances.json (alle Shows oder gefiltert)
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const GUESTS = "data/talkshow-guests-appearances.json";
const TRANSCRIPTS = "data/media-transcripts";
const ANALYSES_DIR = "data/media-analyses";
const OUT = "data/talkshow-batch-appearances.json";
const TMP = ".tmp-media";
const DB_PATH = "politik.db";

interface ShowCfg {
  key: string;        // Key in der Gäste-JSON
  folder: string;     // Transkript-Ordner (Dateipräfix)
  idkey: string;      // custom_id-/video_id-Segment (kompakt, ohne Unterstriche)
  host: string;
  publisher: string;
  source: "ard" | "zdf";
}
const SHOWS: ShowCfg[] = [
  { key: "maischberger",   folder: "maischberger",   idkey: "maischberger", host: "Sandra Maischberger", publisher: "maischberger (ARD)",     source: "ard" },
  { key: "miosga",         folder: "caren_miosga",   idkey: "miosga",       host: "Caren Miosga",        publisher: "Caren Miosga (ARD)",     source: "ard" },
  { key: "hart_aber_fair", folder: "hart_aber_fair", idkey: "hartaberfair", host: "Louis Klamroth",      publisher: "hart aber fair (ARD)",   source: "ard" },
  { key: "illner",         folder: "illner",         idkey: "illner",       host: "Maybrit Illner",      publisher: "maybrit illner (ZDF)",   source: "zdf" },
  { key: "lanz",           folder: "lanz",           idkey: "lanz",         host: "Markus Lanz",         publisher: "Markus Lanz (ZDF)",      source: "zdf" },
];

const args = process.argv.slice(2);
const showFilter = args.includes("--show") ? args[args.indexOf("--show") + 1] : null;

const UMLAUT: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue" };
function slugLastName(fullName: string): string {
  const last = fullName.trim().split(/\s+/).pop() ?? fullName;
  return last
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUT[c] ?? c)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

const MONTHS_DE = ["januar","februar","maerz","april","mai","juni","juli","august","september","oktober","november","dezember"];
function zdfUrlFromDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `https://www.zdf.de/video/talk/maybrit-illner-128/maybrit-illner-vom-${d}-${MONTHS_DE[m - 1]}-${y}-100`;
}

// _manifest.tsv: <iso>\t<base64-crid>\t... → iso→id (Spalte 2)
function manifestIds(folder: string): Record<string, string> {
  const mf = path.join(TRANSCRIPTS, folder, "_manifest.tsv");
  const map: Record<string, string> = {};
  if (!fs.existsSync(mf)) return map;
  for (const line of fs.readFileSync(mf, "utf-8").split("\n")) {
    const [iso, id] = line.split("\t");
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && id) map[iso] = id.trim();
  }
  return map;
}

const data = JSON.parse(fs.readFileSync(GUESTS, "utf-8"));
const db = new Database(DB_PATH, { readonly: true });
const cvStmt = db.prepare("SELECT cv_summary FROM politicians WHERE id = ?");

function cleanParty(party: string | null): string {
  if (!party) return "";
  return party.replace(/\s*\([^)]*\)\s*/g, "").trim(); // "CDU/CSU (Bundestag …)" → "CDU/CSU"
}
function buildDesc(g: any): string {
  const parts: string[] = [];
  const cp = cleanParty(g.party);
  const parl = g.parliaments as string | null;
  const role = parl ? (/Bundestag/.test(parl) ? "MdB" : parl) : "";
  const head = [cp, role].filter(Boolean).join(", ");
  if (head) parts.push(head);
  const row = cvStmt.get(g.politician_id) as any;
  if (row?.cv_summary) {
    let s = String(row.cv_summary).replace(/\s+/g, " ").trim();
    if (s.length > 260) s = s.slice(0, 257).replace(/\s+\S*$/, "") + "…";
    parts.push(s);
  }
  return parts.join(". ") || `${g.name}`;
}

fs.mkdirSync(TMP, { recursive: true });
const out: any[] = [];
const warnings: string[] = [];
let skippedDone = 0, skippedNoVtt = 0, skippedNoUrl = 0, staged = 0;

for (const show of SHOWS.filter((s) => !showFilter || s.key === showFilter)) {
  const ids = manifestIds(show.folder);
  const episodes: Record<string, any> = data[show.key]?.episodes ?? {};
  for (const iso of Object.keys(episodes)) {
    const ep = episodes[iso];
    const guests: any[] = ep.guests ?? [];
    if (!guests.length) continue;

    // VTT vorhanden?
    const srcVtt = path.join(TRANSCRIPTS, show.folder, `${show.folder}-${iso}.deu.vtt`);
    if (!fs.existsSync(srcVtt)) { skippedNoVtt += guests.length; continue; }

    // Episoden-URL bestimmen
    let url: string;
    if (show.source === "ard") {
      const id = ids[iso];
      if (!id) { warnings.push(`${show.key} ${iso}: keine Manifest-ID → übersprungen`); skippedNoUrl += guests.length; continue; }
      url = `https://www.ardmediathek.de/video/${id}`;
    } else {
      // Lanz: echte zdf_url aus dem Rematch; illner: aus Datum konstruiert (Best-Effort)
      url = ep.zdf_url || zdfUrlFromDate(iso);
    }

    const videoId = `${show.idkey}-${iso}`;
    const [y, m, d] = iso.split("-");
    const deDate = `${d}.${m}.${y}`;

    for (const g of guests) {
      const slug = slugLastName(g.name);
      const customId = `${slug}-${show.idkey}-${iso}`;
      if (fs.existsSync(path.join(ANALYSES_DIR, `${customId}.json`))) { skippedDone++; continue; }

      // VTT stagen (einmal je Folge reicht, copyFileSync ist idempotent)
      const dstVtt = path.join(TMP, `${videoId}.deu.vtt`);
      if (!fs.existsSync(dstVtt)) { fs.copyFileSync(srcVtt, dstVtt); staged++; }

      const others = guests
        .filter((x) => x.politician_id !== g.politician_id)
        .map((x) => `${x.name}${x.party ? ` (${cleanParty(x.party)})` : ""}`);
      const otherSpeakers =
        (others.length ? others.join("; ") + ". " : "") +
        `In ${show.host.split(" ").pop()}-Sendungen diskutieren pro Folge mehrere Gäste; weitere Teilnehmer:innen (Journalist:innen, Fachleute, Nicht-Abgeordnete) können im Transkript vorkommen.`;

      out.push({
        custom_id: customId,
        politician_id: g.politician_id,
        politician: g.name,
        host: show.host,
        publisher: show.publisher,
        episode_label: `Sendung vom ${deDate}`,
        url,
        video_id: videoId,
        published_at: iso,
        duration_label: "ca. 75 Min",
        format: "tv",
        other_speakers: otherSpeakers,
        politician_desc: buildDesc(g),
      });
    }
  }
}

// Kollisions-Check
const seen = new Set<string>();
for (const a of out) {
  if (seen.has(a.custom_id)) warnings.push(`DUPLIKAT custom_id: ${a.custom_id}`);
  seen.add(a.custom_id);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
const byShow: Record<string, number> = {};
for (const a of out) { const k = a.video_id.split("-").slice(0, 1)[0]; byShow[k] = (byShow[k] ?? 0) + 1; }
console.log(`✓ ${out.length} Appearances → ${OUT}`);
console.log(`  je Show: ${Object.entries(byShow).map(([k, v]) => `${k}:${v}`).join("  ")}`);
console.log(`  ${staged} VTTs nach ${TMP} gestaged`);
console.log(`  ${skippedDone} bereits analysiert · ${skippedNoVtt} ohne VTT · ${skippedNoUrl} ohne URL`);
if (warnings.length) {
  console.log(`\n⚠ Warnungen (${warnings.length}):`);
  for (const w of warnings.slice(0, 20)) console.log(`   - ${w}`);
  if (warnings.length > 20) console.log(`   … +${warnings.length - 20} weitere`);
}
db.close();
