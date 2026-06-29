import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Sachverständigenrat zur Begutachtung der gesamtwirtschaftlichen Entwicklung
 * („Wirtschaftsweise"), www.sachverstaendigenrat-wirtschaft.de.
 *
 * STRUKTUR (manuell verifiziert 2026-06-29):
 *   - pollUrl = Startseite. Sie liefert HTTP 200, ist serverseitig gerendert
 *     (kein JS nötig), enthält aber KEINE direkten .pdf-Links.
 *   - Die echten Berichte liegen hinter Detailseiten:
 *       /fruehjahrsgutachten-<jahr>.html, /jahresgutachten-<jahr>.html
 *       (+ zugehörige …-pressemitteilung.html).
 *   - Auf jeder Detailseite hängt die Gesamtausgabe als direktes
 *     /fileadmin/dateiablage/gutachten/<dir>/<NAME>_Gesamtausgabe.pdf,
 *     allerdings mit Dutzenden #page=-Deep-Links referenziert. Fremde/ältere
 *     Gutachten werden vereinzelt mitverlinkt (z.B. JG202324 auf der FG2026-
 *     Seite) → wir wählen das PDF mit der HÖCHSTEN Referenz-Frequenz
 *     (die seiteneigene Gesamtausgabe dominiert deutlich, 89 vs. 1).
 *
 * AKTUALITÄT: Die Startseite kuratiert NUR den aktuellen Stand — der News-Feed
 *   (.news-list-article) zeigt die jüngsten Veröffentlichungen mit ISO-Datum
 *   (<time datetime>), die Gutachten-Teaser verlinken nur die laufenden
 *   Haupt-Gutachten (Archiv liegt separat unter /publikationen/…). Wir nehmen
 *   daher alle Gutachten-Teaser der Startseite + die Report-Feed-Items.
 *
 * STRATEGIE: detail-follow (Detailseite via ctx.fetchHtml folgen → Haupt-PDF).
 */

const BASE = "https://www.sachverstaendigenrat-wirtschaft.de";

/** Detailseiten-Slug eines laufenden Haupt-Gutachtens (kein Archiv-Listing). */
const GUTACHTEN_DETAIL = /^\/(fruehjahrsgutachten|jahresgutachten)-\d{4}\.html$/i;

/** News-Feed-Kategorie → Bericht-Typ. Nicht gelistete Kategorien (z.B.
 *  „In eigener Sache", „Veranstaltung") sind KEINE Berichte → übersprungen. */
function kategorieTyp(kat: string): string | null {
  const s = kat.toLowerCase();
  if (/sondergutachten|jahresgutachten|gutachten/.test(s)) return "Gutachten";
  if (/stellungnahme/.test(s)) return "Stellungnahme";
  if (/pressemitteilung|pressemeldung/.test(s)) return "Pressemitteilung";
  if (/expertise|policy.?brief|bericht/.test(s)) return "Bericht";
  return null;
}

/** Wählt auf einer Detailseite das dominante Haupt-PDF (Gesamtausgabe bzw.
 *  Pressemitteilung) per Referenz-Frequenz; Teil-/Barriere-Fassungen raus. */
function hauptPdf($: CheerioAPI, detailUrl: string): string | null {
  const freq = new Map<string, number>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try { abs = new URL(href, detailUrl).toString(); } catch { return; }
    const base = abs.split("#")[0];
    if (!/\.pdf$/i.test(base)) return;
    if (/_kapitel_|_barrierefrei/i.test(base)) return; // Teil-/Barrierefassungen
    freq.set(base, (freq.get(base) ?? 0) + 1);
  });
  if (freq.size === 0) return null;
  return [...freq.entries()].sort((a, b) => {
    const ag = /gesamtausgabe/i.test(a[0]) ? 1 : 0;
    const bg = /gesamtausgabe/i.test(b[0]) ? 1 : 0;
    if (ag !== bg) return bg - ag;       // Gesamtausgabe bevorzugen …
    return b[1] - a[1];                  // … sonst häufigste Referenz
  })[0][0];
}

const isoOrNull = (s: string | undefined | null): string | null =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? s.trim() : null;

interface Kandidat { detailUrl: string; titel: string | null; datum: string | null; typ: string }

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $ = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  const kandidaten = new Map<string, Kandidat>(); // key = detailUrl (ohne Query)
  const cleanUrl = (u: string): string | null => {
    try { const x = new URL(u, BASE); x.search = ""; x.hash = ""; return x.toString(); } catch { return null; }
  };

  // 1) News-Feed: jüngste Veröffentlichungen mit ISO-Datum.
  $(".news-list-article").each((_, el) => {
    const $el = $(el);
    const typ = kategorieTyp($el.find(".news-list-category").first().text().trim());
    if (!typ) return; // keine Bericht-Kategorie (z.B. „In eigener Sache")
    const a = $el.find(".news-list-header a[href]").first();
    const href = a.attr("href");
    if (!href) return;
    const url = cleanUrl(href);
    if (!url) return;
    const datum = isoOrNull($el.find("time[datetime]").first().attr("datetime"));
    const titel = (a.attr("title")?.trim() || a.text().trim() || null)?.slice(0, 300) ?? null;
    kandidaten.set(url, { detailUrl: url, titel, datum, typ });
  });

  // 2) Laufende Haupt-Gutachten-Teaser der Startseite (immer aktuell).
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let pathOnly: string;
    try { pathOnly = new URL(href, BASE).pathname; } catch { return; }
    if (!GUTACHTEN_DETAIL.test(pathOnly)) return;
    const url = cleanUrl(href);
    if (!url) return;
    const existing = kandidaten.get(url);
    const titel = ($(a).attr("title")?.trim() || $(a).text().trim() || null)?.slice(0, 300) ?? null;
    if (existing) { if (!existing.titel && titel) existing.titel = titel; return; }
    kandidaten.set(url, { detailUrl: url, titel, datum: null, typ: "Gutachten" });
  });

  if (kandidaten.size === 0) return [];

  // Aktualitätsfilter: Gutachten-Teaser sind per Konstruktion aktuell (Startseite
  // listet kein Archiv); übrige Kandidaten nur, wenn ≤24 Monate. Neuestes immer.
  const liste = [...kandidaten.values()];
  liste.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuesterKey = liste[0]?.detailUrl;
  const gefiltert = liste.filter((k) =>
    k.typ === "Gutachten" || ctx.istKuerzlich(k.datum, 24) || k.detailUrl === neuesterKey,
  );

  // 3) Detailseiten folgen → Haupt-PDF + ggf. besseren Titel auflösen (defensiv).
  const generisch = /^(download|mehr|weiterlesen|pdf|hier|zum gutachten)\.?$/i;
  const out: RohBericht[] = [];
  for (const k of gefiltert) {
    let url = k.detailUrl;
    let titel = k.titel;
    try {
      const $d = ctx.load(await ctx.fetchHtml(k.detailUrl));
      const pdf = hauptPdf($d, k.detailUrl);
      if (pdf) url = pdf;
      if (!titel || generisch.test(titel)) {
        const t = $d("title").first().text().trim().replace(/^Sachverst[äa]ndigenrat\s+Wirtschaft:\s*/i, "");
        if (t) titel = t.slice(0, 300);
      }
    } catch { /* Detailseite nicht erreichbar → Detail-URL als Fallback */ }
    out.push({ url, titel, datum: k.datum, typ: k.typ ?? ctx.classifyTyp(titel, url) });
  }

  // dedup nach finaler url (Gutachten vor anderen Typen, falls Kollision)
  const byUrl = new Map<string, RohBericht>();
  for (const r of out) {
    const prev = byUrl.get(r.url);
    if (!prev || (r.typ === "Gutachten" && prev.typ !== "Gutachten")) byUrl.set(r.url, r);
  }
  return [...byUrl.values()];
}
