/**
 * Extrahiert Volltext aus allen Drucksachen-PDFs in `data/drucksachen/`
 * und speichert sie in `drucksache_texts`. Idempotent — überspringt bereits
 * geparste, sofern kein --force oder --retry-errors gesetzt ist.
 *
 *   npx tsx scripts/extract-drucksache-texts.ts               # neue PDFs parsen
 *   npx tsx scripts/extract-drucksache-texts.ts --retry-errors # nur Fehlerfälle erneut
 *   npx tsx scripts/extract-drucksache-texts.ts --force        # alle neu
 *   npx tsx scripts/extract-drucksache-texts.ts --limit 50    # nur 50 PDFs
 */

import Database from "better-sqlite3";
import { readFile, readdir } from "node:fs/promises";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const DRUCKSACHEN_DIR = path.join(process.cwd(), "data/drucksachen");
const CHARS_PER_TOKEN = 3.5;

const argv = process.argv.slice(2);
const FORCE = argv.includes("--force");
const RETRY_ERRORS = argv.includes("--retry-errors");
const LIMIT_IDX = argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(argv[LIMIT_IDX + 1], 10) : Infinity;

async function main() {
const { PDFParse } = await import(
  "/home/jinsheng/politik/node_modules/pdf-parse/dist/pdf-parse/esm/index.js"
);

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS drucksache_texts (
    drucksache_nr TEXT PRIMARY KEY,
    pdf_filename TEXT NOT NULL,
    pdf_bytes INTEGER NOT NULL,
    pages INTEGER,
    chars INTEGER,
    tokens_estimate INTEGER,
    full_text TEXT,
    parser TEXT NOT NULL,
    parse_error TEXT,
    parsed_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_drucksache_texts_error ON drucksache_texts(parse_error)
    WHERE parse_error IS NOT NULL;
`);

const upsert = db.prepare(`
  INSERT INTO drucksache_texts
    (drucksache_nr, pdf_filename, pdf_bytes, pages, chars, tokens_estimate, full_text, parser, parse_error, parsed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(drucksache_nr) DO UPDATE SET
    pdf_filename = excluded.pdf_filename,
    pdf_bytes = excluded.pdf_bytes,
    pages = excluded.pages,
    chars = excluded.chars,
    tokens_estimate = excluded.tokens_estimate,
    full_text = excluded.full_text,
    parser = excluded.parser,
    parse_error = excluded.parse_error,
    parsed_at = excluded.parsed_at
`);

/** "2104815.pdf" → "21/4815" */
function pdfFilenameToDsNr(fname: string): string | null {
  const m = fname.match(/^(\d{2})(\d{5})\.pdf$/);
  if (!m) return null;
  const wp = m[1];
  const nr = String(parseInt(m[2], 10)); // führende Nullen entfernen
  return `${wp}/${nr}`;
}

interface ExistingRow {
  drucksache_nr: string;
  parse_error: string | null;
}

const existing = new Map<string, ExistingRow>();
for (const r of db.prepare(`SELECT drucksache_nr, parse_error FROM drucksache_texts`).all() as ExistingRow[]) {
  existing.set(r.drucksache_nr, r);
}

const files = (await readdir(DRUCKSACHEN_DIR)).filter((f) => f.endsWith(".pdf")).sort();
console.log(`📚 ${files.length} PDFs in ${DRUCKSACHEN_DIR}`);
console.log(`📊 ${existing.size} bereits in drucksache_texts (${[...existing.values()].filter((r) => r.parse_error).length} davon mit Fehler)`);

// Filter
const todo: string[] = [];
for (const f of files) {
  const nr = pdfFilenameToDsNr(f);
  if (!nr) continue;
  const ex = existing.get(nr);
  if (FORCE) {
    todo.push(f);
  } else if (RETRY_ERRORS) {
    if (ex?.parse_error) todo.push(f);
  } else {
    if (!ex) todo.push(f);
  }
}

const total = Math.min(todo.length, LIMIT);
console.log(`\n→ ${total} PDFs zu verarbeiten ${RETRY_ERRORS ? "(retry-errors)" : FORCE ? "(force-all)" : "(neue)"}`);
if (total === 0) {
  console.log("Nichts zu tun.");
  process.exit(0);
}

let okCount = 0, errCount = 0;
const errors: { nr: string; msg: string }[] = [];
const tokenSizes: number[] = [];
const t0 = Date.now();

for (let i = 0; i < total; i++) {
  const fname = todo[i];
  const nr = pdfFilenameToDsNr(fname)!;
  const fpath = path.join(DRUCKSACHEN_DIR, fname);

  let buf: Buffer;
  try {
    buf = await readFile(fpath);
  } catch (e) {
    const msg = (e as Error).message.slice(0, 200);
    console.log(`[${i + 1}/${total}] ${nr.padEnd(8)} ✗ READ-ERROR: ${msg}`);
    upsert.run(nr, fname, 0, null, null, null, null, "pdf-parse", msg, new Date().toISOString());
    errors.push({ nr, msg });
    errCount++;
    continue;
  }

  try {
    const inst = new PDFParse({ data: buf });
    const r = await inst.getText();
    const text = (r.text ?? "").trim();
    const pages = typeof r.total === "number" ? r.total : null;
    const chars = text.length;
    const tokens = Math.ceil(chars / CHARS_PER_TOKEN);

    if (chars === 0) {
      // Parse OK aber leerer Text (Scan-PDF?). Als "leer" markieren, kein Fehler.
      upsert.run(nr, fname, buf.length, pages, 0, 0, "", "pdf-parse", "empty:no-text-extracted", new Date().toISOString());
      console.log(`[${i + 1}/${total}] ${nr.padEnd(8)} ⚠ LEER (0 chars, ${pages ?? "?"} pages, ${Math.round(buf.length / 1024)} KB) — eventuell Scan-PDF`);
      errors.push({ nr, msg: "empty:no-text-extracted" });
      errCount++;
      continue;
    }

    upsert.run(nr, fname, buf.length, pages, chars, tokens, text, "pdf-parse", null, new Date().toISOString());
    okCount++;
    tokenSizes.push(tokens);

    if ((i + 1) % 100 === 0 || i + 1 === total) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const rate = ((i + 1) / parseFloat(elapsed)).toFixed(1);
      console.log(`[${(i + 1).toString().padStart(4)}/${total}] ${nr.padEnd(8)} ✓ ${chars} chars / ${tokens} tok    (${elapsed}s, ${rate}/s)`);
    }
  } catch (e) {
    const msg = (e as Error).message.slice(0, 300);
    upsert.run(nr, fname, buf.length, null, null, null, null, "pdf-parse", msg, new Date().toISOString());
    errors.push({ nr, msg });
    errCount++;
    console.log(`[${i + 1}/${total}] ${nr.padEnd(8)} ✗ PARSE-ERROR: ${msg}`);
  }
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
const sumTok = tokenSizes.reduce((a, b) => a + b, 0);
const sorted = [...tokenSizes].sort((a, b) => a - b);

console.log(`\n=== Extraktion fertig (${elapsed}s) ===`);
console.log(`  Parsed OK:     ${okCount}`);
console.log(`  Mit Fehler:    ${errCount}`);
console.log(`  Σ Tokens:      ${sumTok.toLocaleString("de-DE")}  (≈ ${(sumTok / 1_000_000).toFixed(1)} M)`);
if (sorted.length > 0) {
  console.log(`  Median Tokens: ${sorted[Math.floor(sorted.length / 2)].toLocaleString("de-DE")}`);
  console.log(`  Max Tokens:    ${sorted[sorted.length - 1].toLocaleString("de-DE")}`);
}

if (errors.length > 0) {
  console.log(`\n⚠ ${errors.length} Fehler / leere Extraktionen:`);
  for (const e of errors) {
    console.log(`  ${e.nr.padEnd(10)}  ${e.msg}`);
  }
  console.log(`\nDie Fehler sind in drucksache_texts.parse_error gespeichert.`);
  console.log(`Re-Run nur Fehler:  npx tsx scripts/extract-drucksache-texts.ts --retry-errors`);
}
}

main().then(() => process.exit(0));
