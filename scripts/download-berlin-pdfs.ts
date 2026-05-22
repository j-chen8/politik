/**
 * Berlin-Pilot Stufe 1 / Tier 2 — PDF-Download + Volltext-Extraktion.
 *
 * Lädt die PDFs der berlin_documents (distinct LokURLs) von pardok.parlament-
 * berlin.de, extrahiert den Text via pdf-parse und legt ihn in berlin_pdf_texts
 * ab (keyed auf lok_url — viele Plenarprotokoll-Dokumente teilen sich eine
 * Sitzungs-PDF, der Text wird nur einmal gespeichert).
 *
 * Standardmäßig nur Plenarprotokolle (124 PDFs, ~0,1 GB). Idempotent — bereits
 * geladene/geparste URLs werden übersprungen.
 *
 * Run:
 *   npx tsx scripts/download-berlin-pdfs.ts                       # Plenarprotokolle
 *   npx tsx scripts/download-berlin-pdfs.ts --art=Ausschussprotokoll
 *   npx tsx scripts/download-berlin-pdfs.ts --art=Drucksache --limit=200
 *   npx tsx scripts/download-berlin-pdfs.ts --force               # alles neu
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { writeFile, readFile, mkdir } from "node:fs/promises";

// pdf-parse ist ESM-only — dynamischer Import in main() (kein Top-Level-await,
// das esbuild/tsx beim CJS-Transform stört).
async function loadPdfParse(): Promise<any> {
  const mod = await import(
    path.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/esm/index.js")
  );
  return mod.PDFParse;
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const PDF_DIR = path.join(process.cwd(), "data/berlin/pdfs");
const USER_AGENT = "politik-radar/1.0 (Kontakt: chenjinsheng@proton.me)";
const DELAY_MS = 800; // höflich — pardok.parlament-berlin.de
const CHARS_PER_TOKEN = 4;

const args = process.argv.slice(2);
const ART = (args.find((a) => a.startsWith("--art=")) ?? "--art=Plenarprotokoll").split("=")[1];
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1], 10) : 0;
})();
const FORCE = args.includes("--force");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** LokURL → eindeutiger, flacher Dateiname (Pfad ab /VT/19/, Slashes → _). */
function urlToFilename(url: string): string {
  const m = url.match(/\/VT\/\d+\/(.+)$/);
  const rel = m ? m[1] : url.split("/").slice(-1)[0];
  return rel.replace(/[\/\\]/g, "_");
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS berlin_pdf_texts (
      lok_url TEXT PRIMARY KEY,
      dok_art TEXT,
      pdf_filename TEXT,
      pdf_bytes INTEGER,
      pages INTEGER,
      chars INTEGER,
      tokens_estimate INTEGER,
      full_text TEXT,
      parse_error TEXT,
      fetched_at TEXT,
      parsed_at TEXT
    );
  `);
}

async function fetchPdf(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 429) { await sleep(8000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2500);
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const PDFParse = await loadPdfParse();
  await mkdir(PDF_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000");
  ensureSchema(db);

  const done = new Set(
    FORCE ? [] :
    (db.prepare("SELECT lok_url FROM berlin_pdf_texts WHERE parse_error IS NULL").all() as { lok_url: string }[])
      .map((r) => r.lok_url)
  );

  let urls = (
    db.prepare(
      `SELECT DISTINCT lok_url FROM berlin_documents
       WHERE dok_art_label = ? AND lok_url IS NOT NULL AND lok_url != ''`
    ).all(ART) as { lok_url: string }[]
  ).map((r) => r.lok_url).filter((u) => !done.has(u));
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);

  console.log(`Dokument-Art: ${ART}`);
  console.log(`PDFs zu laden: ${urls.length}  (${done.size} bereits erledigt)\n`);
  if (urls.length === 0) { console.log("Nichts zu tun."); db.close(); return; }

  const upsert = db.prepare(
    `INSERT INTO berlin_pdf_texts
       (lok_url, dok_art, pdf_filename, pdf_bytes, pages, chars, tokens_estimate, full_text, parse_error, fetched_at, parsed_at)
     VALUES (@lok_url, @dok_art, @pdf_filename, @pdf_bytes, @pages, @chars, @tokens_estimate, @full_text, @parse_error, @fetched_at, @parsed_at)
     ON CONFLICT (lok_url) DO UPDATE SET
       pdf_filename = excluded.pdf_filename, pdf_bytes = excluded.pdf_bytes,
       pages = excluded.pages, chars = excluded.chars, tokens_estimate = excluded.tokens_estimate,
       full_text = excluded.full_text, parse_error = excluded.parse_error,
       fetched_at = excluded.fetched_at, parsed_at = excluded.parsed_at`
  );

  let ok = 0, fail = 0, totalChars = 0;
  const t0 = Date.now();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const fname = urlToFilename(url);
    const fpath = path.join(PDF_DIR, fname);
    const now = new Date().toISOString();
    let buf: Buffer;

    try {
      if (fs.existsSync(fpath) && fs.statSync(fpath).size > 1000) {
        buf = await readFile(fpath);
      } else {
        buf = await fetchPdf(url);
        await writeFile(fpath, buf);
        await sleep(DELAY_MS);
      }
    } catch (e) {
      fail++;
      upsert.run({ lok_url: url, dok_art: ART, pdf_filename: fname, pdf_bytes: 0, pages: null,
        chars: null, tokens_estimate: null, full_text: null,
        parse_error: `download: ${(e as Error).message}`.slice(0, 250), fetched_at: now, parsed_at: null });
      console.log(`  [${i + 1}/${urls.length}] ✗ ${fname}: download-error`);
      continue;
    }

    try {
      const r = await new PDFParse({ data: buf }).getText();
      const text = (r.text ?? "").trim();
      const pages = typeof r.total === "number" ? r.total : null;
      upsert.run({ lok_url: url, dok_art: ART, pdf_filename: fname, pdf_bytes: buf.length,
        pages, chars: text.length, tokens_estimate: Math.ceil(text.length / CHARS_PER_TOKEN),
        full_text: text, parse_error: text.length === 0 ? "empty:no-text-extracted" : null,
        fetched_at: now, parsed_at: now });
      ok++;
      totalChars += text.length;
    } catch (e) {
      fail++;
      upsert.run({ lok_url: url, dok_art: ART, pdf_filename: fname, pdf_bytes: buf.length, pages: null,
        chars: null, tokens_estimate: null, full_text: null,
        parse_error: `parse: ${(e as Error).message}`.slice(0, 250), fetched_at: now, parsed_at: null });
      console.log(`  [${i + 1}/${urls.length}] ✗ ${fname}: parse-error`);
      continue;
    }

    if ((i + 1) % 20 === 0 || i + 1 === urls.length) {
      const s = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  [${i + 1}/${urls.length}] ok=${ok} fail=${fail}  (${s}s)`);
    }
  }

  const mb = (totalChars / 1_000_000).toFixed(1);
  console.log(`\n=== Fertig === ${ok} PDFs geparst (${fail} Fehler), ~${mb} MB Text`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
