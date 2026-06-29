/**
 * Util für den Kommissions-Tracker (§3 CONTRACT).
 * €0, statisch (fetch + cheerio + pdf-parse), kein LLM.
 *
 * Vorlagen:
 *   - scripts/sync-drucksachen-pdfs.ts          (Download)
 *   - scripts/extract-drucksache-texts.ts       (Volltext via pdf-parse)
 *   - scripts/fetch-kommissionen.ts             (fetchHtml/extractBerichte/dateFromUrl)
 *   - scripts/_lib/german-date.ts               (parseGermanDate)
 *
 * Die Helfer hier werden vom Tages-Scraper (§5) als ExtractCtx an die
 * Pro-Quelle-Extractoren (§1) durchgereicht, damit diese dünn bleiben.
 */
import fs from "node:fs";
import path from "node:path";
import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "./german-date";
import type { RohBericht } from "./kommissionen-extractors/types";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB Cap (Gutachten größer als Drucksachen)
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** PDF nach destPath laden. Idempotent. Gibt Status-Enum (bricht NIE ab). */
export async function downloadPdf(
  url: string,
  destPath: string,
): Promise<"ok" | "exists" | "404" | "large" | "err"> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) return "exists";
  try {
    try {
      const head = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": UA },
        redirect: "follow",
      });
      if (head.status === 404) return "404";
      const len = parseInt(head.headers.get("content-length") ?? "0", 10);
      if (len > MAX_SIZE) return "large";
    } catch {
      /* HEAD unzuverlässig (kein content-length/404) → GET-Pfad maßgeblich */
    }
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) return res.status === 404 ? "404" : "err";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return "err";
    if (buf.length > MAX_SIZE) return "large";
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    await sleep(60); // höflich
    return "ok";
  } catch {
    return "err";
  }
}

/** Volltext via pdf-parse (kanonischer Projektweg: dynamischer ESM-Import, ABSOLUTER Pfad). */
export async function extractPdfText(
  filePath: string,
): Promise<{ text: string; pages: number | null; chars: number }> {
  const { PDFParse } = await import(
    "/home/jinsheng/politik/node_modules/pdf-parse/dist/pdf-parse/esm/index.js"
  );
  const buf = await fs.promises.readFile(filePath);
  const inst = new PDFParse({ data: buf });
  const r = await inst.getText();
  const text = (r.text ?? "").trim();
  const pages = typeof r.total === "number" ? r.total : null;
  return { text, pages, chars: text.length };
}

/** Deterministische Typ-Klassifikation aus Titel/URL. */
export function classifyTyp(titel: string | null, url: string): string | null {
  const s = `${titel ?? ""} ${url}`.toLowerCase();
  if (/pr[üu]fbericht/.test(s)) return "Prüfbericht";
  if (/jahresbericht|jahresgutachten/.test(s)) return /jahresgutachten/.test(s) ? "Gutachten" : "Jahresbericht";
  if (/gutachten/.test(s)) return "Gutachten";
  if (/stellungnahme/.test(s)) return "Stellungnahme";
  if (/pressemitteilung|pressemeldung|\bpm[-_ ]/.test(s)) return "Pressemitteilung";
  if (/referentenentwurf|refe[-_ ]/.test(s)) return "Referentenentwurf";
  if (/gesetzentwurf/.test(s)) return "Gesetzentwurf";
  if (/bericht/.test(s)) return "Bericht";
  return null;
}

/** Datum aus URL-Slug (Port aus fetch-kommissionen.ts). */
export function dateFromUrl(url: string): string | null {
  let m: RegExpMatchArray | null;
  if ((m = url.match(/-pm-(\d{2})-(\d{2})-(\d{4})/))) return `${m[3]}-${m[2]}-${m[1]}`;
  if ((m = url.match(/_(\d{2})_(\d{2})_(\d{4})/))) return `${m[3]}-${m[2]}-${m[1]}`;
  if ((m = url.match(/(20\d{2})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = url.match(/(20\d{2})(\d{2})(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

/** datum innerhalb der letzten `monate`? null → false. */
export function istKuerzlich(datum: string | null, monate = 24): boolean {
  if (!datum) return false;
  const d = new Date(datum + "T00:00:00Z").getTime();
  if (Number.isNaN(d)) return false;
  return d >= Date.now() - monate * 30 * 864e5;
}

/** PDF-Link-Ernte (Port von extractBerichte) + typ + datum. */
export function genericPdfLinks($: CheerioAPI, baseUrl: string): RohBericht[] {
  const out: RohBericht[] = [];
  const seen = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      return;
    }
    const isBericht =
      /\.pdf(\?|$)/i.test(abs) ||
      /__blob=(publicationFile|file)/i.test(abs) ||
      /resource\/blob\/.*\.pdf/i.test(abs) ||
      /SharedDocs\/Downloads/i.test(abs);
    if (!isBericht || seen.has(abs)) return;
    seen.add(abs);
    const titel = $(a).attr("title")?.trim() || $(a).text().trim().slice(0, 300) || null;
    const teaserDate = $(a).closest(".c-teaser").find(".c-teaser__date").text().trim();
    const datum =
      parseGermanDate(teaserDate) || parseGermanDate($(a).text().trim()) || dateFromUrl(abs);
    out.push({ url: abs, titel, datum, typ: classifyTyp(titel, abs) });
  });
  return out;
}

/** Stabiler, kollisionsarmer Dateiname für eine PDF-URL. */
export function safePdfName(url: string, datum: string | null): string {
  let base = "dok";
  try {
    base = path.basename(new URL(url).pathname).replace(/\.pdf$/i, "") || "dok";
  } catch {
    /* unparsbare URL → Default-Basis */
  }
  base = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "dok";
  let hash = 0;
  for (let i = 0; i < url.length; i++) hash = (hash * 31 + url.charCodeAt(i)) | 0;
  const suffix = (hash >>> 0).toString(16).slice(0, 8);
  return `${datum ? datum + "_" : ""}${base}_${suffix}.pdf`;
}
