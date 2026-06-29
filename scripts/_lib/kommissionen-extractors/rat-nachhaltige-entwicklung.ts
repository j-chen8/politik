import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Rat für Nachhaltige Entwicklung (RNE) — unabhängiges Beratungsgremium,
 * berufen vom Bundeskanzler. Substanzielle Outputs sind Stellungnahmen und
 * Empfehlungen an die Bundesregierung (kein klassischer „Jahresbericht").
 *
 * Website = WordPress (nachhaltigkeitsrat.de). Die pollUrl /aktuelles/ ist die
 * News-/Aktuelles-Liste und wird SERVERSEITIG gerendert (statisch scrapebar,
 * trotz des Watchlist-Hinweises „ggf. JS"): die Artikel-Detail-Links stehen als
 * echte <a href>-Tags im HTML. Eine dedizierte „Publikationen"-/„Stellungnahmen"-
 * Seite existiert NICHT (per page-sitemap.xml geprüft) — RNE veröffentlicht seine
 * Berichte als Beiträge unter /aktuelles/<slug>/ mit dem PDF im Fließtext.
 *
 * Strategie: detail-follow.
 *   1) /aktuelles/ liefert die ~12 jüngsten Beiträge (Newest-first).
 *   2) Pro Beitrag die Detailseite folgen (try/catch) und PDFs aus
 *      /wp-content/uploads/ ernten.
 *   3) NUR echte RNE-Berichte behalten: Dateiname matcht eine Berichts-Gattung
 *      (Stellungnahme|Empfehlung|Gutachten|Positionspapier|Jahresbericht|
 *      Standpunkt|Bericht). Reine News-/Meinungs-/Event-Beiträge verlinken KEIN
 *      uploads-PDF (verifiziert) und fallen so automatisch heraus; Broschüren/
 *      Flyer/Newsletter werden zusätzlich ausgefiltert.
 *
 * Datum: die Detailseiten tragen weder article:published_time noch ein <time>-
 * Element mit Pub-Datum. Verlässlichster Anker ist der WordPress-Upload-Pfad
 * /wp-content/uploads/YYYY/MM/ bzw. ein YYYYMM-Präfix im Dateinamen → YYYY-MM-01
 * (Monatsgenau; Tag unbekannt). Fallback ctx.dateFromUrl / parseGermanDate.
 *
 * NUR AKTUELL: jüngster Bericht IMMER + alle der letzten ~24 Monate.
 *
 * Layout geändert / keine Detail-Links / keine Berichts-PDFs gefunden → return []
 * (Fallback = Seed-Bericht aus der Watchlist). KEINE erfundenen URLs.
 */

const POLL = "https://www.nachhaltigkeitsrat.de/aktuelles/";

// Artikel-Detailseite: /aktuelles/<slug>/ (NICHT die Liste selbst).
const DETAIL_RE = /\/aktuelles\/[a-z0-9][a-z0-9-]+\/?$/i;

// PDF muss eine RNE-Berichts-Gattung im Dateinamen tragen.
const BERICHT_RE =
  /(stellungnahme|empfehlung|gutachten|positionspapier|jahresbericht|standpunkt|bericht)/i;
// Begleitmaterial (keine Berichte) ausschließen.
const KEIN_BERICHT_RE =
  /(folder|flyer|broschuere|broschure|brosch[uü]re|newsletter|einladung|programm|agenda|flyer|plakat)/i;

/** Monatsgenaues Datum aus Upload-Pfad/Dateiname, sonst Standard-Heuristiken. */
function pdfDatum(ctx: ExtractCtx, pdfUrl: string): string | null {
  // /wp-content/uploads/2025/10/...  ODER  Dateiname-Präfix 202510_...
  let m = pdfUrl.match(/\/uploads\/(20\d{2})\/(0[1-9]|1[0-2])\//);
  if (m) return `${m[1]}-${m[2]}-01`;
  m = pdfUrl.match(/\/(20\d{2})(0[1-9]|1[0-2])[_-]/);
  if (m) return `${m[1]}-${m[2]}-01`;
  return ctx.dateFromUrl(pdfUrl);
}

/** Detailseite: bestes Berichts-PDF + Titel + Datum. */
async function parseDetail(ctx: ExtractCtx, url: string): Promise<RohBericht | null> {
  let html: string;
  try {
    html = await ctx.fetchHtml(url);
  } catch {
    return null; // 404/Timeout einer Detailseite darf den Lauf nicht kippen
  }
  const $: CheerioAPI = ctx.load(html);

  const titel =
    ($("h1").first().text().replace(/\s+/g, " ").trim() ||
      $('meta[property="og:title"]').attr("content")?.split(/[–|]/)[0].trim() ||
      null)?.slice(0, 300) ?? null;

  let pdf: string | null = null;
  $("a[href]").each((_, a) => {
    if (pdf) return;
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, url).toString();
    } catch {
      return;
    }
    if (!/\/wp-content\/uploads\/.*\.pdf(\?|$)/i.test(abs)) return;
    if (!BERICHT_RE.test(abs) || KEIN_BERICHT_RE.test(abs)) return;
    pdf = abs;
  });
  if (!pdf) return null;

  // Datum: Upload-Pfad/Dateiname; sonst erstes deutsches Datum im Beitrag.
  const datum =
    pdfDatum(ctx, pdf) ||
    parseGermanDate(
      ($("main").text() || $("body").text() || "")
        .replace(/\s+/g, " ")
        .match(
          /\d{1,2}\.\s*(?:Januar|Februar|M[äa]rz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*20\d{2}/,
        )?.[0] ?? "",
    );

  return { url: pdf, titel, datum, typ: ctx.classifyTyp(titel, pdf) };
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Artikel-Detail-Links der Aktuelles-Liste einsammeln (newest-first).
  const detailUrls = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, ctx.pollUrl).toString();
    } catch {
      return;
    }
    abs = abs.split("#")[0].split("?")[0];
    if (abs.replace(/\/$/, "") === POLL.replace(/\/$/, "")) return; // Liste selbst
    if (DETAIL_RE.test(abs)) detailUrls.add(abs);
  });
  if (detailUrls.size === 0) return [];

  const roh: RohBericht[] = [];
  for (const u of detailUrls) {
    const r = await parseDetail(ctx, u);
    if (r && r.url) roh.push(r);
  }
  if (roh.length === 0) return [];

  // dedup nach PDF-URL (eine Stellungnahme kann mehrfach verlinkt sein).
  const uniq = Array.from(new Map(roh.map((r) => [r.url, r])).values());

  // Sortieren (jüngstes Datum zuerst), IMMER neuesten behalten + letzte 24 Monate.
  const sortiert = uniq.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0];
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
