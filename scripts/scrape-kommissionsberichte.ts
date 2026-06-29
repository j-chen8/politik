/**
 * Tages-Scraper Kommissionsberichte (€0, statisch, kein LLM).
 * Je Watchlist-Kommission mit Registry-Extractor (try/catch) → RohBerichte
 *   → UPSERT kommission_bericht (quelle='scrape', DO NOTHING bei (slug,url))
 *   → wenn url ein PDF ist und (pdf_path NULL oder Datei fehlt): downloadPdf + extractPdfText
 *     → full_text/pages/chars/pdf_path/parsed_at/parse_error setzen.
 *
 * NICHT-destruktiv: KEIN DELETE von quelle='scrape'-Zeilen (sonst Re-Download
 * geladener PDFs). Upsert-Merge: neue URLs via INSERT … DO NOTHING, dann
 * fehlende PDFs/Volltexte nachladen. quelle='seed'/'news' bleiben unberührt.
 *
 * Lauf: npx tsx scripts/scrape-kommissionsberichte.ts [--dry]
 */
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as cheerio from "cheerio";
import { ensureKommissionenSchema } from "./_lib/kommissionen-schema";
import { KOMMISSIONEN_WATCHLIST } from "./_lib/kommissionen-watchlist";
import { EXTRACTORS } from "./_lib/kommissionen-extractors";
import {
  fetchHtml, downloadPdf, extractPdfText,
  classifyTyp, dateFromUrl, istKuerzlich, genericPdfLinks, safePdfName,
} from "./_lib/kommissionen-fetch";

const DRY = process.argv.includes("--dry");
const isPdfUrl = (u: string) =>
  /\.pdf(\?|$)/i.test(u) || /__blob=(publicationFile|file)/i.test(u) || /resource\/blob\/.*\.pdf/i.test(u);

async function main() {
  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.pragma("busy_timeout = 15000");
  ensureKommissionenSchema(db);

  const ins = db.prepare(`INSERT INTO kommission_bericht (kommission_slug,titel,datum,url,quelle,typ)
    VALUES (?,?,?,?, 'scrape', ?) ON CONFLICT(kommission_slug,url) DO NOTHING`);
  const updMeta = db.prepare(`UPDATE kommission_bericht SET titel=COALESCE(titel,?), datum=COALESCE(datum,?), typ=COALESCE(typ,?) WHERE kommission_slug=? AND url=?`);
  const getRow = db.prepare(`SELECT id, pdf_path, full_text FROM kommission_bericht WHERE kommission_slug=? AND url=?`);
  const updPdf = db.prepare(`UPDATE kommission_bericht SET pdf_path=?, full_text=?, pages=?, chars=?, parsed_at=datetime('now'), parse_error=? WHERE id=?`);
  const updErr = db.prepare(`UPDATE kommission_bericht SET parse_error=?, parsed_at=datetime('now') WHERE id=?`);

  const ctx = { fetchHtml, load: cheerio.load, genericPdfLinks, classifyTyp, dateFromUrl, istKuerzlich };

  for (const k of KOMMISSIONEN_WATCHLIST) {
    const fn = EXTRACTORS[k.slug];
    if (!fn || !k.pollUrl) continue; // kein Extractor / keine Pollseite → Seed bleibt
    let roh: import("./_lib/kommissionen-extractors/types").RohBericht[] = [];
    try {
      roh = await fn({ ...ctx, pollUrl: k.pollUrl });
    } catch (e) {
      console.error(`✗ ${k.slug.padEnd(38)} extract: ${(e as Error).message}`);
      continue; // eine kaputte Quelle bricht den Lauf NIE ab
    }
    let neu = 0, pdfs = 0;
    for (const b of roh) {
      if (!b.url) continue;
      const typ = b.typ ?? classifyTyp(b.titel, b.url);
      if (!DRY) {
        neu += ins.run(k.slug, b.titel, b.datum, b.url, typ).changes;
        updMeta.run(b.titel, b.datum, typ, k.slug, b.url);
      }
      if (!isPdfUrl(b.url)) continue;
      if (DRY) { pdfs++; continue; }
      const row = getRow.get(k.slug, b.url) as { id: number; pdf_path: string | null; full_text: string | null } | undefined;
      if (!row) continue;
      const alreadyHasFile = row.pdf_path && fs.existsSync(path.join(process.cwd(), row.pdf_path));
      if (alreadyHasFile && row.full_text) continue; // bereits geladen+geparst → skip
      const rel = path.join("data", "kommissionen_pdfs", k.slug, safePdfName(b.url, b.datum));
      const dest = path.join(process.cwd(), rel);
      const dl = await downloadPdf(b.url, dest);
      if (dl === "404" || dl === "large" || dl === "err") { updErr.run(dl === "err" ? "download:err" : dl, row.id); continue; }
      try {
        const { text, pages, chars } = await extractPdfText(dest);
        const perr = chars === 0 ? "empty:no-text-extracted" : null;
        updPdf.run(rel, text || null, pages, chars, perr, row.id);
        pdfs++;
      } catch (e) { updErr.run(`parse:${(e as Error).message}`.slice(0, 200), row.id); }
    }
    console.log(`${DRY ? "[dry] " : ""}${k.slug.padEnd(38)} ${roh.length} gefunden, +${neu} neu, ${pdfs} PDFs`);
  }

  // Direkte PDF-Seeds NUR für Quellen OHNE Extractor nachladen (z.B. PNOG-RefE:
  // einzige Quelle ist der Seed-Link). Quellen MIT Extractor decken ihre Berichte
  // selbst ab → deren Seed (oft Dublette/Landeseite) NICHT laden. Idempotent.
  const ohneExtractor = new Set(KOMMISSIONEN_WATCHLIST.filter((k) => !EXTRACTORS[k.slug] || !k.pollUrl).map((k) => k.slug));
  const seeds = db.prepare(`SELECT id, kommission_slug, url, pdf_path, full_text, typ FROM kommission_bericht WHERE quelle='seed'`).all() as { id: number; kommission_slug: string; url: string; pdf_path: string | null; full_text: string | null; typ: string | null }[];
  for (const r of seeds) {
    if (!ohneExtractor.has(r.kommission_slug) || !isPdfUrl(r.url)) continue;
    const hatDatei = r.pdf_path && fs.existsSync(path.join(process.cwd(), r.pdf_path));
    if (hatDatei && r.full_text) continue;
    if (DRY) { console.log(`[dry] seed ${r.kommission_slug} → ${r.url}`); continue; }
    const rel = path.join("data", "kommissionen_pdfs", r.kommission_slug, safePdfName(r.url, null));
    const dest = path.join(process.cwd(), rel);
    const dl = await downloadPdf(r.url, dest);
    if (dl === "404" || dl === "large" || dl === "err") { updErr.run(dl === "err" ? "download:err" : dl, r.id); continue; }
    try {
      const { text, pages, chars } = await extractPdfText(dest);
      updPdf.run(rel, text || null, pages, chars, chars === 0 ? "empty:no-text-extracted" : null, r.id);
      if (!r.typ) db.prepare(`UPDATE kommission_bericht SET typ=? WHERE id=?`).run(classifyTyp(null, r.url), r.id);
      console.log(`${r.kommission_slug.padEnd(38)} Seed-PDF geladen (${pages}S)`);
    } catch (e) { updErr.run(`parse:${(e as Error).message}`.slice(0, 200), r.id); }
  }
  db.close();
}
main();
