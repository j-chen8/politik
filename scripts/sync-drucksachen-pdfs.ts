/**
 * Drucksachen-PDF-Sync — VOLLSTÄNDIGE Discovery aus DIP (nicht aktivitäts-getrieben).
 *
 * Hintergrund (Fix 2026-06-13): Die bisherige Discovery (`download-missing-
 * drucksachen.sh`) zog nur DS, die in `activities` als MdB-Aktivität referenziert
 * sind. Das verfehlt strukturell Regierungs-Gesetzentwürfe, Ausschuss-Beschluss-
 * empfehlungen, Unterrichtungen usw. (z. B. 21/5922 Medizinregister). Dieses Skript
 * enumeriert stattdessen die AUTORITATIVE vollständige Liste der WP21-Bundestag-
 * Drucksachen aus der DIP-API (f.zuordnung=BT) und lädt jedes fehlende PDF vom
 * dserver. Idempotent: vorhandene PDFs werden übersprungen → gefahrlos wiederholbar.
 *
 * Downstream unverändert: extract-drucksache-texts (liest alle PDFs im Ordner) →
 * classify-drucksachen (Inhalts-Fallback classifyFromPdfHeader für DS ohne Activity)
 * → run-drucksachen-batch.
 *
 * Run:  npx tsx scripts/sync-drucksachen-pdfs.ts            (enumerieren + laden)
 *       npx tsx scripts/sync-drucksachen-pdfs.ts --dry-run  (nur Lücke zählen)
 */
import path from "path";
import fs from "fs";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DIP_KEY = process.env.DIP_API_KEY ?? "";
if (!DIP_KEY) { console.error("DIP_API_KEY fehlt in .env"); process.exit(1); }
const DIP = "https://search.dip.bundestag.de/api/v1";
const DIP_HEADERS = { Origin: "https://dip.bundestag.de", Referer: "https://dip.bundestag.de/" };
const OUTDIR = path.join(process.cwd(), "data/drucksachen");
const MANIFEST = path.join(OUTDIR, "_dip-bt-manifest.tsv");
const LARGE_LOG = path.join(OUTDIR, "large_files_skipped.txt");
// --only 21/600,21/700,…  → genau diese DS ziehen (gezielter Nachzug substanzieller
// Großberichte, die der 10-MB-Cap normalerweise auslässt); Limit dann angehoben.
const ONLY_IDX = process.argv.indexOf("--only");
const ONLY: string[] | null = ONLY_IDX >= 0 ? (process.argv[ONLY_IDX + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : null;
const MAX_SIZE = (ONLY ? 100 : 10) * 1024 * 1024; // Default 10 MB; im --only-Modus 100 MB
const DRY = process.argv.includes("--dry-run");
const CONCURRENCY = 5;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Doc = { dokumentnummer: string; drucksachetyp?: string; datum?: string; titel?: string };

/** Alle WP21-Bundestag-Drucksachen aus DIP enumerieren (Cursor-Pagination). */
async function enumerateBT(): Promise<Doc[]> {
  const out: Doc[] = [];
  let cursor = "";
  let prev = "__init__";
  let page = 0;
  while (cursor !== prev) {
    prev = cursor;
    const url = `${DIP}/drucksache?f.wahlperiode=21&f.zuordnung=BT&rows=100&apikey=${DIP_KEY}`
      + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    let res: Response;
    try {
      res = await fetch(url, { headers: DIP_HEADERS });
    } catch (e) {
      console.error(`  Netzfehler Seite ${page}, retry in 2s:`, (e as Error).message);
      await sleep(2000); cursor = prev; continue;
    }
    if (res.status === 429) { console.error("  429 — backoff 5s"); await sleep(5000); cursor = prev; continue; }
    if (!res.ok) { console.error(`  DIP ${res.status} auf Seite ${page} — Abbruch`); break; }
    const j = (await res.json()) as { documents?: Doc[]; cursor?: string };
    for (const d of j.documents ?? []) {
      // Nur saubere Bundestag-Nummern „21/NNNN" (keine Bundesrat-/Anlagen-Formate)
      if (/^21\/\d+$/.test(d.dokumentnummer ?? "")) out.push(d);
    }
    cursor = j.cursor ?? "";
    page++;
    if (page % 10 === 0) console.log(`  … ${out.length} BT-DS enumeriert (Seite ${page})`);
  }
  return out;
}

function pdfTarget(nr: string): { fname: string; url: string } | null {
  const m = nr.match(/^21\/(\d+)$/);
  if (!m) return null;
  const pad = m[1].padStart(5, "0");
  const fname = `21${pad}.pdf`;
  return { fname, url: `https://dserver.bundestag.de/btd/21/${pad.slice(0, 3)}/${fname}` };
}

async function downloadOne(nr: string): Promise<"ok" | "exists" | "404" | "large" | "err"> {
  const t = pdfTarget(nr);
  if (!t) return "err";
  const dest = path.join(OUTDIR, t.fname);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return "exists";
  try {
    const head = await fetch(t.url, { method: "HEAD" });
    if (head.status !== 200) return "404";
    const len = parseInt(head.headers.get("content-length") ?? "0", 10);
    if (len > MAX_SIZE) {
      fs.appendFileSync(LARGE_LOG, `[LARGE ${(len / 1048576).toFixed(1)}MB] ${nr} - ${t.url}\n`);
      return "large";
    }
    const res = await fetch(t.url);
    if (!res.ok) return "err";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return "err";
    fs.writeFileSync(dest, buf);
    return "ok";
  } catch {
    return "err";
  }
}

async function main() {
  if (!fs.existsSync(OUTDIR)) { console.error(`OUTDIR fehlt: ${OUTDIR}`); process.exit(1); }
  if (ONLY) {
    console.log(`=== Gezielter Nachzug: ${ONLY.length} DS (--only, Limit ${MAX_SIZE / 1048576} MB) ===`);
    const stat = { ok: 0, "404": 0, large: 0, err: 0, exists: 0 };
    for (const nr of ONLY) { const r = await downloadOne(nr); stat[r]++; console.log(`  ${nr}: ${r}`); await sleep(60); }
    console.log(`\n  geladen: ${stat.ok} | exists: ${stat.exists} | 404: ${stat["404"]} | >Limit: ${stat.large} | err: ${stat.err}`);
    return;
  }
  console.log("=== DIP-Enumeration: alle WP21-Bundestag-Drucksachen ===");
  const docs = await enumerateBT();
  // dedupe nach Nummer (DIP kann Varianten liefern)
  const byNr = new Map<string, Doc>();
  for (const d of docs) if (!byNr.has(d.dokumentnummer)) byNr.set(d.dokumentnummer, d);
  const all = [...byNr.values()];
  console.log(`  Enumeriert: ${all.length} BT-Drucksachen (21/NNNN)`);

  // Manifest schreiben (die „immer-alle"-Liste)
  const tsv = ["drucksache_nr\tdrucksachetyp\tdatum\ttitel",
    ...all.map((d) => `${d.dokumentnummer}\t${d.drucksachetyp ?? ""}\t${d.datum ?? ""}\t${(d.titel ?? "").replace(/\t|\n/g, " ")}`)].join("\n");
  fs.writeFileSync(MANIFEST, tsv);
  console.log(`  Manifest: ${MANIFEST}`);

  // Lücke = DS ohne lokales PDF
  const missing = all.filter((d) => { const t = pdfTarget(d.dokumentnummer); return t && !(fs.existsSync(path.join(OUTDIR, t.fname)) && fs.statSync(path.join(OUTDIR, t.fname)).size > 0); });
  console.log(`  Lokal vorhanden: ${all.length - missing.length} | FEHLT: ${missing.length}`);
  if (DRY) { console.log("\n--dry-run: nichts geladen."); return; }

  console.log(`\n=== Lade ${missing.length} fehlende PDFs (Concurrency ${CONCURRENCY}) ===`);
  const stat = { ok: 0, "404": 0, large: 0, err: 0, exists: 0 };
  let done = 0;
  const queue = [...missing];
  async function worker() {
    while (queue.length) {
      const d = queue.shift()!;
      const r = await downloadOne(d.dokumentnummer);
      stat[r]++;
      done++;
      if (r === "ok" && done % 25 === 0) console.log(`  [${done}/${missing.length}] ok=${stat.ok} 404=${stat["404"]} large=${stat.large} err=${stat.err}`);
      await sleep(60); // höflich zum dserver
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\n=== Fertig ===`);
  console.log(`  geladen: ${stat.ok} | 404 (kein PDF): ${stat["404"]} | >10MB übersprungen: ${stat.large} | Fehler: ${stat.err}`);
  console.log(`  Nächste Schritte: extract-drucksache-texts → classify-drucksachen → run-drucksachen-batch`);
}

main();
