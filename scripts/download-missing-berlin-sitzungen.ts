/**
 * Lädt die 5 fehlenden Berlin-Sitzungs-PDFs nach (11, 17, 46, 47, 52)
 * und fügt sie in berlin_pdf_texts ein. Die Sitzungen wurden ursprünglich nicht
 * über berlin_documents indiziert (kein Plenarprotokoll-Eintrag), deshalb hat sie
 * download-berlin-pdfs.ts übersprungen.
 *
 * Nach diesem Skript:
 *   npx tsx scripts/seed-berlin-speeches.ts
 *   npx tsx scripts/batch-submit-berlin-reden.ts --batch=4 --confirm
 *   npx tsx scripts/batch-berlin-top-summaries.ts --all --confirm
 *   npx tsx scripts/batch-submit-berlin-votes.ts ...
 *
 * Run: npx tsx scripts/download-missing-berlin-sitzungen.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { writeFile, mkdir } from "node:fs/promises";

async function loadPdfParse(): Promise<any> {
  const mod = await import(
    path.join(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/esm/index.js")
  );
  return mod.PDFParse;
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const PDF_DIR = path.join(process.cwd(), "data/berlin/pdfs");
const USER_AGENT = "politik-radar/1.0 (Kontakt: chenjinsheng@proton.me)";
const DELAY_MS = 800;

const MISSING_SITZUNGEN = [11, 17, 46, 47, 52];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadPdf(url: string, dest: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf;
}

async function main() {
  await mkdir(PDF_DIR, { recursive: true });
  const PDFParseCtor = await loadPdfParse();
  const db = new Database(DB_PATH);

  const insertPdf = db.prepare(`
    INSERT OR REPLACE INTO berlin_pdf_texts (
      lok_url, dok_art, pdf_filename, pdf_bytes, pages, chars, tokens_estimate, full_text
    ) VALUES (?, 'Plenarprotokoll', ?, ?, ?, ?, ?, ?)
  `);

  for (const n of MISSING_SITZUNGEN) {
    const filename = `p19-${String(n).padStart(3, "0")}-wp.pdf`;
    const url = `https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/PlenarPr/${filename}`;
    const dest = path.join(PDF_DIR, filename);

    console.log(`\n=== Sitzung ${n} ===`);
    console.log(`URL: ${url}`);

    let buf: Buffer;
    if (fs.existsSync(dest)) {
      buf = fs.readFileSync(dest);
      console.log(`✓ cached ${dest} (${(buf.length / 1024).toFixed(0)} KB)`);
    } else {
      buf = await downloadPdf(url, dest);
      console.log(`✓ downloaded ${(buf.length / 1024).toFixed(0)} KB`);
      await sleep(DELAY_MS);
    }

    const parser = new PDFParseCtor({ data: new Uint8Array(buf) });
    const parsed = await parser.getText();
    const fullText = String(parsed.text ?? "");
    const pages = Number(parsed.pages ?? parsed.numpages ?? 0);
    const chars = fullText.length;
    const tokens = Math.ceil(chars / 4);

    insertPdf.run(url, filename, buf.length, pages, chars, tokens, fullText);
    console.log(`✓ inserted: ${pages} pages, ${chars.toLocaleString()} chars, ~${tokens.toLocaleString()} tokens`);
  }

  db.close();
  console.log(`\n✓ ${MISSING_SITZUNGEN.length} Sitzungen geladen + extrahiert.\n`);
  console.log(`Next: npx tsx scripts/seed-berlin-speeches.ts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
