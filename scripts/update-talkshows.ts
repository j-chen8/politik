/**
 * update-talkshows.ts — hält das TV-Talk-Transkript-Archiv frisch.
 *
 * 3 Stufen, alle KOSTENLOS (kein LLM):
 *   1. Discovery — pro Show die aktuell in der Mediathek verfügbaren Folgen via yt-dlp
 *      enumerieren (ZDF: Hub-Playlist; ARD: Sendungs-Collection /sendung/x/<show.id>).
 *   2. Diff       — gegen data/media-transcripts/<folder>/_manifest.tsv (+ vorhandene
 *      VTTs) abgleichen → nur NEUE Folgen.
 *   3. Fetch      — für neue Folgen die deutschen Redaktions-UT ziehen (--write-subs,
 *      --skip-download), als <folder>-<YYYY-MM-DD>.deu.vtt speichern, Manifest-Zeile
 *      anhängen. Folgen ohne UT-Spur werden als Lücke geloggt (nur per Whisper holbar).
 *
 * Die LLM-Analyse ist bewusst NICHT Teil dieses Skripts (separater, kostenpflichtiger
 * Schritt: scripts/batch-media-analyses.ts).
 *
 * Run:
 *   npx tsx scripts/update-talkshows.ts                 # Dry-Run: zeigt nur neue Folgen
 *   npx tsx scripts/update-talkshows.ts --fetch         # lädt UT der neuen Folgen
 *   npx tsx scripts/update-talkshows.ts --show lanz     # nur eine Show
 *   npx tsx scripts/update-talkshows.ts --fetch --limit 5   # max 5 neue je Show
 *
 * Quellen-Rezepte empirisch verifiziert 2026-06-03 (ARD page-gateway-Widget-API ist
 * tot/404 → yt-dlp-Collection ist der robuste Weg für ZDF UND ARD).
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "data", "media-transcripts");
const UA = "Mozilla/5.0";

type Show = {
  key: string;        // CLI-Name
  folder: string;     // Verzeichnis + VTT-Prefix
  type: "zdf" | "ard";
  url: string;        // ZDF: Hub-URL; ARD: Collection-URL /sendung/x/<show.id>
};

// show.id (ARD) = base64 der echten Show-CRID, aus episode→page-gateway item .widgets[0].show.id.
// ACHTUNG maischberger: "menschen bei maischberger", NICHT "maischberger" (letztere 404t).
const SHOWS: Show[] = [
  { key: "lanz",           folder: "lanz",           type: "zdf", url: "https://www.zdf.de/talk/markus-lanz-114" },
  { key: "illner",         folder: "illner",         type: "zdf", url: "https://www.zdf.de/politik/maybrit-illner" },
  { key: "maischberger",   folder: "maischberger",   type: "ard", url: "https://www.ardmediathek.de/sendung/x/Y3JpZDovL2Rhc2Vyc3RlLmRlL21lbnNjaGVuIGJlaSBtYWlzY2hiZXJnZXI" },
  { key: "miosga",         folder: "caren_miosga",   type: "ard", url: "https://www.ardmediathek.de/sendung/x/Y3JpZDovL2Rhc2Vyc3RlLmRlL2NhcmVuLW1pb3NnYQ" },
  { key: "hart_aber_fair", folder: "hart_aber_fair", type: "ard", url: "https://www.ardmediathek.de/sendung/x/Y3JpZDovL3dkci5kZS9oYXJ0IGFiZXIgZmFpcg" },
];

const args = process.argv.slice(2);
const FETCH = args.includes("--fetch");
const showFilter = args.includes("--show") ? args[args.indexOf("--show") + 1] : null;
const LIMIT = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1], 10) : 0;

const isoFromUpload = (d: string) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`; // 20260604 → 2026-06-04
// Manifest-Datum (DD.MM.YYYY oder YYYY-MM-DD) → ISO
function manifestDateToIso(s: string): string | null {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
const isoToDe = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };

type Ep = { iso: string; title: string; url: string; id: string; duration: number };

function enumerate(show: Show): Ep[] {
  let raw: string;
  try {
    raw = execFileSync("yt-dlp", ["--flat-playlist", "--dump-json", show.url], {
      encoding: "utf-8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (e) {
    console.log(`  ⚠ ${show.key}: Enumeration fehlgeschlagen (${(e as Error).message.split("\n")[0]})`);
    return [];
  }
  const eps: Ep[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let j: any; try { j = JSON.parse(line); } catch { continue; }
    if (!j.upload_date) continue;                                   // ohne Datum unbrauchbar
    const title: string = j.title ?? "";
    const duration: number = j.duration ?? 0;
    // ARD-Playlists enthalten Segmente (kurz) + Gebärden-/AD-Varianten → nur volle Folge
    if (show.type === "ard") {
      if (duration && duration < 1800) continue;
      if (/Geb(ä|ae)rdensprache|Audiodeskription|H(ö|oe)rfassung/i.test(title)) continue;
    }
    eps.push({ iso: isoFromUpload(j.upload_date), title, url: j.url ?? j.webpage_url, id: j.id ?? "", duration });
  }
  // Dedupe pro Datum (erste Variante gewinnt) + keine Zukunfts-Folgen (angekündigt,
  // aber noch nicht gesendet → yt-dlp: "No video formats found")
  const today = new Date().toISOString().slice(0, 10);
  const byDate = new Map<string, Ep>();
  for (const e of eps) if (e.iso <= today && !byDate.has(e.iso)) byDate.set(e.iso, e);
  return [...byDate.values()].sort((a, b) => a.iso.localeCompare(b.iso));
}

function knownDates(show: Show): Set<string> {
  const dir = path.join(ROOT, show.folder);
  const known = new Set<string>();
  const manifest = path.join(dir, "_manifest.tsv");
  if (fs.existsSync(manifest)) {
    for (const line of fs.readFileSync(manifest, "utf-8").split("\n")) {
      const first = line.split("\t")[0];
      const iso = manifestDateToIso(first);
      if (iso) known.add(iso);
    }
  }
  // zusätzlich: vorhandene VTT-Dateien (falls Manifest hinterherhinkt)
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/-(\d{4}-\d{2}-\d{2})\.deu\.vtt$/);
      if (m) known.add(m[1]);
    }
  }
  return known;
}

// UT einer Folge ziehen → true wenn deu-VTT geschrieben
function fetchSubs(show: Show, ep: Ep): "ok" | "no-subs" | "error" {
  const dir = path.join(ROOT, show.folder);
  const target = path.join(dir, `${show.folder}-${ep.iso}.deu.vtt`);
  const tmpl = path.join(dir, `${show.folder}-${ep.iso}.%(ext)s`);
  try {
    execFileSync("yt-dlp", [
      "--skip-download", "--write-subs", "--sub-langs", "deu", "--sub-format", "vtt",
      "--convert-subs", "vtt", "--no-warnings", "--user-agent", UA, "-o", tmpl, ep.url,
    ], { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "error";
  }
  // yt-dlp schreibt <base>.deu.vtt (oder .de.vtt) — finde die erzeugte Datei
  if (fs.existsSync(target)) return "ok";
  const base = `${show.folder}-${ep.iso}.`;
  const cand = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f.startsWith(base) && f.endsWith(".vtt")) : null;
  if (cand) { fs.renameSync(path.join(dir, cand), target); return "ok"; }
  return "no-subs";
}

function appendManifest(show: Show, ep: Ep) {
  const manifest = path.join(ROOT, show.folder, "_manifest.tsv");
  // Schema je Quelle beibehalten (Konsistenz mit Bestand)
  const row = show.type === "zdf"
    ? [isoToDe(ep.iso), "OK", ep.url, ep.iso.replace(/-/g, ""), ep.title].join("\t")
    : [ep.iso, ep.id, String(ep.duration || ""), ""].join("\t");
  // Sicherstellen, dass die vorhandene letzte Zeile mit \n endet (sonst klebt der Append)
  const prefix = fs.existsSync(manifest) && fs.readFileSync(manifest, "utf-8").slice(-1) !== "\n" ? "\n" : "";
  fs.appendFileSync(manifest, prefix + row + "\n");
}

(async () => {
  const targets = SHOWS.filter((s) => !showFilter || s.key === showFilter);
  if (!targets.length) { console.error(`Unbekannte Show: ${showFilter}. Bekannt: ${SHOWS.map((s) => s.key).join(", ")}`); process.exit(1); }

  console.log(`=== Talkshow-Update ${FETCH ? "(FETCH)" : "(DRY-RUN — nur Anzeige, --fetch zum Laden)"} ===\n`);
  let totalNew = 0, totalFetched = 0, totalGaps = 0;

  for (const show of targets) {
    const eps = enumerate(show);
    const known = knownDates(show);
    let neu = eps.filter((e) => !known.has(e.iso));
    if (LIMIT > 0) neu = neu.slice(-LIMIT); // die neuesten N
    totalNew += neu.length;
    console.log(`${show.key.padEnd(15)} ${eps.length} verfügbar · ${known.size} im Archiv · ${neu.length} NEU`);
    for (const ep of neu) {
      if (!FETCH) { console.log(`   • ${ep.iso}  ${ep.title.slice(0, 60)}`); continue; }
      const r = fetchSubs(show, ep);
      if (r === "ok") { appendManifest(show, ep); totalFetched++; console.log(`   ✓ ${ep.iso}  ${ep.title.slice(0, 55)}`); }
      else if (r === "no-subs") { totalGaps++; console.log(`   ⚠ ${ep.iso}  KEINE deu-UT (Whisper-only)  ${ep.title.slice(0, 40)}`); }
      else { console.log(`   ✗ ${ep.iso}  Fetch-Fehler  ${ep.title.slice(0, 40)}`); }
    }
  }

  console.log(`\n── ${FETCH ? `${totalFetched} UT geladen, ${totalGaps} ohne UT-Spur` : `${totalNew} neue Folgen (Dry-Run)`} ──`);
  if (!FETCH && totalNew > 0) console.log(`Zum Laden: npx tsx scripts/update-talkshows.ts --fetch`);
})();
