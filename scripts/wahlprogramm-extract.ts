/**
 * Wahlprogramm-PDFs → seitengenauer Text (für Beleg-Anker).
 * Liest data/wahlprogramme/<partei>.pdf, schreibt <partei>.pages.json = [{page, text}].
 * pdfjs-dist (Legacy-Build, node). Kein LLM, gratis.
 *
 * Lauf: npx tsx scripts/wahlprogramm-extract.ts
 */
import fs from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data", "wahlprogramme");
const PARTEIEN = ["cdu_csu", "spd", "gruene", "linke", "afd"];

// pdfjs Legacy-Build (kein DOM/Worker nötig im Node)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

async function extract(partei: string) {
  const pdfPath = path.join(DIR, `${partei}.pdf`);
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages: { page: number; text: string }[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Items in Lesereihenfolge zusammensetzen; Zeilenumbruch bei größerem Y-Sprung
    let text = "";
    let lastY: number | null = null;
    for (const it of content.items as any[]) {
      const s = it.str ?? "";
      const y = it.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) text += "\n";
      else if (text && !text.endsWith(" ") && !text.endsWith("\n")) text += " ";
      text += s;
      if (y !== undefined) lastY = y;
    }
    const clean = text
      .replace(/�/g, ".")            // Linke-Sonderpunkt → Punkt
      .replace(/[ \t]+/g, " ")
      .replace(/\s+([.,;:])/g, "$1")       // Leerzeichen vor Satzzeichen
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    pages.push({ page: p, text: clean });
  }
  const words = pages.reduce((a, b) => a + b.text.split(/\s+/).length, 0);
  fs.writeFileSync(path.join(DIR, `${partei}.pages.json`), JSON.stringify(pages));
  console.log(`${partei.padEnd(10)} ${String(doc.numPages).padStart(3)} S. · ${words.toLocaleString("de")} Wörter`);
  return { partei, pages: doc.numPages, words };
}

(async () => {
  console.log("=== Wahlprogramm-Extraktion (seitengenau) ===");
  for (const p of PARTEIEN) {
    try { await extract(p); } catch (e: any) { console.log(`${p}: FEHLER ${e.message}`); }
  }
})();
