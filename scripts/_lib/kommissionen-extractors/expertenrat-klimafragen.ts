import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Expertenrat für Klimafragen (ERK) — unabhängiges, gesetzlich verankertes Gremium
 * (Bundes-Klimaschutzgesetz). Veröffentlicht jährliche Prüfberichte (Emissionsdaten),
 * Zweijahresgutachten, Stellungnahmen und Sondergutachten.
 *
 * pollUrl = https://expertenrat-klima.de/publikationen/ — macht 301 auf
 * https://expertenrat-klima.de/publikation (TYPO3 + Solr). Die Seite ist serverseitig
 * gerendert (statisch via cheerio scrapebar, KEIN JS zur Laufzeit nötig): die
 * Publikationsliste sind Solr-Ergebnis-Teaser `<li class="search-result …">` mit
 *   - data-document-url  → Detailseiten-Pfad
 *   - h3.results-topic a → Titel
 *   - p.date .date-text  → "Veröffentlicht am  18. Mai 2026" (deutsches Datum)
 * Die Liste ist nach Datum absteigend sortiert; Seite 1 = die aktuellsten Publikationen
 * (ältere stecken hinter ?tx_solr[page]=2..4 = Archiv → bewusst NICHT gefolgt).
 *
 * Strategie: detail-follow. Die echten Berichte sind KEINE direkten <a>-PDFs auf der
 * Listenseite — pro Eintrag wird die Detailseite via ctx.fetchHtml geholt; dort liegt
 * der Bericht als PDF unter /fileadmin/ERK/Berichte/*.pdf (daneben i.d.R. eine
 * begleitende Pressemitteilung unter /fileadmin/ERK/Pressemitteilungen_Meldungen/ —
 * die wird zugunsten des Berichts ausgefiltert; ein Bericht je Publikation).
 *
 * Datum kommt verlässlich aus dem Teaser (.date-text), nicht aus dem URL-Slug
 * (Slugs tragen nur Jahre). Filter „nur aktuell": IMMER der neueste Bericht PLUS alle
 * der letzten ~24 Monate (ctx.istKuerzlich). KEIN Archiv, keine Nav/Bilder/Mitglieder.
 *
 * Layout geändert / keine Teaser gefunden → return [] (Fallback = Seed aus Watchlist).
 * KEINE erfundenen URLs.
 */

function istPdfUrl(u: string): boolean {
  return /\.pdf(\?|$)/i.test(u);
}

/** Datum aus dem Teaser-Datumsblock, ohne den Screenreader-Prefix „Veröffentlicht am". */
function teaserDatum($: CheerioAPI, li: any): string | null {
  const dt = $(li).find(".date-text").first().clone();
  dt.find(".visually-hidden").remove();
  const txt = dt.text().replace(/\s+/g, " ").trim();
  return parseGermanDate(txt);
}

/** Detailseite holen → bestes Berichts-PDF (bevorzugt /Berichte/, NIE Pressemitteilung). */
async function bestesPdf(ctx: ExtractCtx, detailUrl: string): Promise<string | null> {
  let html: string;
  try {
    html = await ctx.fetchHtml(detailUrl);
  } catch {
    return null; // 404/Timeout einer Detailseite darf den Lauf nicht kippen
  }
  const $: CheerioAPI = ctx.load(html);

  let bericht: string | null = null; // PDF in /Berichte/
  let nichtPm: string | null = null; // erstes Nicht-Pressemitteilungs-PDF
  let erstes: string | null = null; // erstes PDF überhaupt

  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, detailUrl).toString();
    } catch {
      return;
    }
    if (!istPdfUrl(abs)) return;
    if (erstes === null) erstes = abs;
    const istPm =
      /Pressemitteilungen_Meldungen/i.test(abs) ||
      /pressemitteilung|_meldung|presse/i.test(`${$(a).text()} ${$(a).attr("title") ?? ""}`);
    if (istPm) return;
    if (nichtPm === null) nichtPm = abs;
    if (bericht === null && /\/Berichte\//i.test(abs)) bericht = abs;
  });

  return bericht ?? nichtPm ?? erstes;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $ = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Solr-Teaser der Publikationsliste (Seite 1 = aktuellste, absteigend sortiert).
  const eintraege: { url: string; titel: string | null; datum: string | null }[] = [];
  const seen = new Set<string>();
  $("li.search-result").each((_, li) => {
    const rel =
      $(li).attr("data-document-url") ||
      $(li).find("h3.results-topic a[href]").first().attr("href");
    if (!rel) return;
    let abs: string;
    try {
      abs = new URL(rel, ctx.pollUrl).toString();
    } catch {
      return;
    }
    if (seen.has(abs)) return;
    seen.add(abs);
    const titel =
      $(li)
        .find("h3.results-topic a")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300) || null;
    eintraege.push({ url: abs, titel, datum: teaserDatum($, li) });
  });
  if (eintraege.length === 0) return [];

  // Sortieren (neueste zuerst) → neuester IMMER + alles der letzten 24 Monate.
  const sortiert = eintraege.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const auswahl = sortiert.filter((e, i) => i === 0 || ctx.istKuerzlich(e.datum, 24));

  // Detailseite folgen → echtes Berichts-PDF; sonst Detailseiten-URL als Fallback.
  const out: RohBericht[] = [];
  for (const e of auswahl) {
    const pdf = await bestesPdf(ctx, e.url);
    const url = pdf ?? e.url;
    out.push({ url, titel: e.titel, datum: e.datum, typ: ctx.classifyTyp(e.titel, url) });
  }

  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
