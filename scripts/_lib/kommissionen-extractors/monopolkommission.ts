import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Monopolkommission (unabhängiges Beratungsgremium, Wettbewerbspolitik).
 *
 * pollUrl = die Startseite monopolkommission.de. Die Seite ist ein serverseitig
 * gerendertes Joomla-CMS (statisch scrapebar, kein JS zur Laufzeit nötig). Sie führt
 * ein Modul „Neueste Gutachten" mit „Weiterlesen …"-Links auf die Joomla-Artikel-
 * Detailseiten der drei substanziellen Berichts-Reihen:
 *   - Hauptgutachten  (alle 2 Jahre, /gutachten/hauptgutachten/…)
 *   - Sektorgutachten (Bahn/Energie/Post/Telekommunikation, /gutachten/sektorgutachten/…)
 *   - Sondergutachten (/gutachten/sondergutachten/…)
 * Diese „Neueste Gutachten"-Liste IST die offizielle Aktuell-Auswahl der Quelle.
 *
 * Strategie: detail-follow. Pro Detailseite stehen der echte Titel (`.page-header`),
 * das Veröffentlichungsdatum im Fließtext („… Bonn, 04. November 2025 …") und der
 * direkte Volltext-PDF-Link („Sektorgutachten/Sondergutachten im Volltext").
 * Daneben liegt jeweils ein Pressemitteilungs-PDF — das wird zugunsten des
 * Gutachten-Volltexts AUSGEFILTERT (ein Bericht je Gutachten).
 *
 * Bewusst NICHT geerntet: die Homepage-Pressemeldungen/Pressestatements/Policy-Briefs
 * (eigene News-Formate, keine „Berichte" im Sinne Gutachten) sowie die Gesamtliste
 * aller Gutachten (/gutachten/gesamtliste-aller-gutachten.html) — die ist ein
 * vollständiges Archiv ohne tagesgenaue Daten und widerspricht „NUR AKTUELL".
 *
 * Datum: aus der Detailseite („Bonn, DD. Monat YYYY", sonst erstes deutsches Datum)
 * via parseGermanDate; URL-Slugs tragen nur das Jahr, daher Datum aus dem Seitentext.
 *
 * Nicht statisch auffindbar / Layout geändert → keine Detail-Links gefunden → return []
 * (Fallback = Seed-Bericht aus der Watchlist). KEINE erfundenen URLs.
 */

// Joomla-Artikel-Detailseiten der drei substanziellen Gutachten-Reihen
// (Artikel-ID-Präfix „NNN-" vor dem Slug, endet auf .html).
const DETAIL_RE =
  /\/gutachten\/(?:hauptgutachten|sektorgutachten|sondergutachten)\/[^?#]*?\d+-[^?#]*\.html$/i;

const MONATE =
  "Januar|Februar|M[äa]rz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";
const DATE_RE = new RegExp(`(\\d{1,2}\\.?\\s+(?:${MONATE})\\s+20\\d{2})`, "i");
const BONN_DATE_RE = new RegExp(`Bonn,\\s*(\\d{1,2}\\.?\\s+(?:${MONATE})\\s+20\\d{2})`, "i");

function istPdfUrl(u: string): boolean {
  return /\.pdf(\?|$)/i.test(u);
}

/** Detailseite parsen: Titel (.page-header), Datum, Volltext-PDF (nicht Pressemitteilung). */
async function parseDetail(ctx: ExtractCtx, url: string): Promise<RohBericht | null> {
  let html: string;
  try {
    html = await ctx.fetchHtml(url);
  } catch {
    return null; // 404/Timeout einer Detailseite darf den Lauf nicht kippen
  }
  const $: CheerioAPI = ctx.load(html);

  // Titel: bevorzugt die Artikel-Überschrift, sonst <title> ohne „– Monopolkommission".
  const headerTxt = $(".page-header").first().text().replace(/\s+/g, " ").trim();
  const titleTag = $("title").first().text().split(/[–|]/)[0].replace(/\s+/g, " ").trim();
  const titel = (headerTxt || titleTag || null)?.slice(0, 300) ?? null;

  // Datum: „Bonn, DD. Monat YYYY" ist die zuverlässige Signatur des Pub-Datums,
  // sonst erstes deutsches Datum im Text.
  const body = ($("main").text() || $("body").text() || "").replace(/\s+/g, " ");
  const dm = BONN_DATE_RE.exec(body) || DATE_RE.exec(body);
  const datum = dm ? parseGermanDate(dm[1]) : null;

  // Bestes PDF: der Gutachten-Volltext, NICHT die begleitende Pressemitteilung.
  let volltext: string | null = null;
  let ersterNichtPm: string | null = null;
  let erstesPdf: string | null = null;
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, url).toString();
    } catch {
      return;
    }
    if (!istPdfUrl(abs)) return;
    if (erstesPdf === null) erstesPdf = abs;
    const ankertext = `${$(a).text()} ${$(a).attr("title") ?? ""}`;
    const istPm = /pressemitteilung|pressemeldung/i.test(ankertext) || /presse/i.test(abs);
    if (istPm) return;
    if (ersterNichtPm === null) ersterNichtPm = abs;
    if (volltext === null && /volltext|gutachten/i.test(ankertext)) volltext = abs;
  });

  const pdf = volltext ?? ersterNichtPm ?? erstesPdf ?? url;
  return { url: pdf, titel, datum, typ: ctx.classifyTyp(titel, pdf) ?? "Gutachten" };
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Detailseiten-Links der „Neueste Gutachten"-Auswahl einsammeln.
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
    abs = abs.replace("/index.php/de/", "/de/").split("#")[0].trim();
    if (DETAIL_RE.test(abs)) detailUrls.add(abs);
  });
  if (detailUrls.size === 0) return [];

  const roh: RohBericht[] = [];
  for (const u of detailUrls) {
    const r = await parseDetail(ctx, u);
    if (r && r.url) roh.push(r);
  }
  if (roh.length === 0) return [];

  // Sortieren (jüngstes Datum zuerst), IMMER den neuesten behalten + alle der
  // letzten ~24 Monate. Die Homepage-Auswahl ist ohnehin die Aktuell-Liste.
  const sortiert = roh.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0];
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
