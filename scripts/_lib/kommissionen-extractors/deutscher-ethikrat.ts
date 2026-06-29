import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Deutscher Ethikrat — unabhängiges, gesetzlich verankertes Gremium (EthRG), berät
 * Bundestag und Bundesregierung. Veröffentlicht Stellungnahmen, Ad-hoc-Stellungnahmen,
 * Impulspapiere (+ Jahresberichte). Publikations-Layer: TYPO3, serverseitig gerendert
 * (statisch via cheerio scrapebar, KEIN JS zur Laufzeit nötig).
 *
 * pollUrl = https://www.ethikrat.org/publikationen/stellungnahmen/ — die Liste sind
 * `<article class="listTeaser">` mit:
 *   - a[href]                       → Detailseiten-Pfad (/publikationen/stellungnahmen/<slug>/)
 *   - .listTeaser__superHeadline    → Gattung ("Stellungnahme" | "Ad-hoc-Stellungnahme"
 *                                       | "Impulspapier" | "Projekt")
 *   - .listTeaser__title            → Titel
 *   - .listTeaser__text             → "Veröffentlicht: 11. Juni 2026"  ODER "In Bearbeitung"
 * Die Liste ist nach Datum absteigend sortiert; Seite 1 = die aktuellsten Publikationen.
 *
 * Strategie: detail-follow. Die echten Berichte sind KEINE direkten <a>-PDFs auf der
 * Listenseite — pro veröffentlichtem Eintrag wird die Detailseite via ctx.fetchHtml
 * geholt; dort liegt das PDF unter /fileadmin/Publikationen/Stellungnahmen/deutsch/*.pdf
 * (daneben eine englische Übersetzung unter /englisch/ — die wird zugunsten der deutschen
 * Fassung ausgefiltert; ein Dokument je Publikation).
 *
 * Datum kommt verlässlich aus dem Teaser (.listTeaser__text ohne "Veröffentlicht:"-Prefix);
 * die URL-Slugs tragen kein Datum. Einträge ohne Datum ("In Bearbeitung"/Projekte) haben
 * kein PDF → werden übersprungen. Filter „nur aktuell": IMMER der neueste veröffentlichte
 * Bericht PLUS alle der letzten ~24 Monate (ctx.istKuerzlich). KEIN Archiv, keine
 * Nav/Bilder/Mitgliederlisten.
 *
 * Layout geändert / keine Teaser gefunden → return [] (Fallback = Seed aus Watchlist).
 * KEINE erfundenen URLs.
 */

function istPdfUrl(u: string): boolean {
  return /\.pdf(\?|$)/i.test(u);
}

/** Detailseite holen → deutsches Berichts-PDF (englische Fassung wird ausgefiltert). */
async function bestesPdf(ctx: ExtractCtx, detailUrl: string): Promise<string | null> {
  let html: string;
  try {
    html = await ctx.fetchHtml(detailUrl);
  } catch {
    return null; // 404/Timeout einer Detailseite darf den Lauf nicht kippen
  }
  const $: CheerioAPI = ctx.load(html);

  let deutsch: string | null = null; // PDF unter /deutsch/
  let nichtEnglisch: string | null = null; // erstes Nicht-/englisch/-PDF
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
    const istEnglisch = /\/englisch\//i.test(abs) || /\/english\//i.test(abs);
    if (istEnglisch) return;
    if (nichtEnglisch === null) nichtEnglisch = abs;
    if (deutsch === null && /\/deutsch\//i.test(abs)) deutsch = abs;
  });

  return deutsch ?? nichtEnglisch ?? erstes;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $ = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Listen-Teaser (Seite 1 = aktuellste, absteigend sortiert).
  const eintraege: { url: string; titel: string | null; gattung: string; datum: string | null }[] = [];
  const seen = new Set<string>();
  $("article.listTeaser").each((_, el) => {
    const rel = $(el).find("a[href]").first().attr("href");
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
      $(el).find(".listTeaser__title").first().text().replace(/\s+/g, " ").trim().slice(0, 300) ||
      $(el).find("a[href]").first().attr("title")?.trim().slice(0, 300) ||
      null;
    const gattung = $(el).find(".listTeaser__superHeadline").first().text().replace(/\s+/g, " ").trim();
    const txt = $(el).find(".listTeaser__text").first().text().replace(/\s+/g, " ").trim();
    const datum = parseGermanDate(txt.replace(/^.*?Veröffentlicht:\s*/i, ""));

    eintraege.push({ url: abs, titel, gattung, datum });
  });
  if (eintraege.length === 0) return [];

  // Nur veröffentlichte Einträge (mit Datum); "In Bearbeitung"/Projekte haben kein Dokument.
  const veroeffentlicht = eintraege.filter((e) => e.datum !== null);
  if (veroeffentlicht.length === 0) return [];

  // Sortieren (neueste zuerst) → neuester IMMER + alles der letzten 24 Monate.
  const sortiert = veroeffentlicht.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const auswahl = sortiert.filter((e, i) => i === 0 || ctx.istKuerzlich(e.datum, 24));

  // Detailseite folgen → deutsches PDF; sonst Detailseiten-URL als Fallback.
  const out: RohBericht[] = [];
  for (const e of auswahl) {
    const pdf = await bestesPdf(ctx, e.url);
    const url = pdf ?? e.url;
    const typ = ctx.classifyTyp(`${e.gattung} ${e.titel ?? ""}`, url);
    out.push({ url, titel: e.titel, datum: e.datum, typ });
  }

  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
