import type { ExtractCtx, RohBericht } from "./types";

/**
 * Sozialbeirat — beratendes Gremium beim BMAS, das jährlich (im November,
 * gemeinsam mit dem Rentenversicherungsbericht der Bundesregierung) sein
 * „Gutachten des Sozialbeirats zum Rentenversicherungsbericht" vorlegt.
 * https://sozialbeirat.de
 *
 * STRATEGIE: static-pdf (statisch, cheerio). Verifiziert 2026-06-29.
 *
 * SEITENSTRUKTUR (pollUrl = https://sozialbeirat.de/dokumente/):
 *   - Serverseitig gerendert (HTTP 200, kein JS nötig). Liefert das KOMPLETTE
 *     Archiv: ~113 direkte `/media/*.pdf`-Links, nach Jahr gruppiert.
 *   - Markup: `#docs_list > div.year` (mit `<h2>JAHR</h2>`) enthält je Dokument
 *     ein `div.doc > a[href] > div.desc` (Titel) + `span.ext` (Format/Größe).
 *   - Pro Jahr stehen NEBEN dem Eigen-Gutachten des Sozialbeirats auch fremde
 *     Regierungsberichte (Rentenversicherungsbericht, Alterssicherungsbericht),
 *     die der Sozialbeirat nur begutachtet — diese sind NICHT sein Output und
 *     werden ausgefiltert.
 *
 * WAS WIR SURFACEN: ausschließlich das Eigen-Gutachten des Sozialbeirats
 *   (Titel beginnt mit „Gutachten des Sozialbeirats" bzw. „Sondergutachten des
 *   Sozialbeirats"), typ = „Gutachten" (Jahresgutachten).
 *
 * AKTUALITÄT: IMMER das neueste Gutachten + das des Vorjahres (Cadence jährl.
 *   Nov → „letzte ~24 Monate" ≈ neuestes Jahr und Vorjahr). Älteres Archiv raus.
 *
 * DATUM: Nur wenige Dateinamen tragen ein Datum (z. B. `2020-11-24_…`,
 *   `2019-11-29_…`); für aktuelle Jahre (z. B. `jahresgutachten_2025_…`)
 *   enthält der Dateiname keines → datum = null (NICHT fabriziert). Der
 *   Aktualitätsfilter stützt sich daher auf das Jahr aus der `<h2>`-Gruppe.
 */

const BASE = "https://sozialbeirat.de";

/** Nur das Eigen-Gutachten des Sozialbeirats (kein RV-/Alterssicherungs-/
 *  Sozialbericht der Bundesregierung). */
const IST_SOZIALBEIRAT_GUTACHTEN = /^(sonder)?gutachten des sozialbeirats/i;

interface Kandidat {
  url: string;
  titel: string | null;
  datum: string | null;
  jahr: number;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  let $;
  try {
    $ = ctx.load(await ctx.fetchHtml(ctx.pollUrl));
  } catch {
    return [];
  }

  const kandidaten: Kandidat[] = [];
  $("#docs_list .year").each((_, yEl) => {
    const $y = $(yEl);
    const jahr = parseInt($y.find("h2").first().text().trim(), 10);
    if (!jahr || jahr < 1950 || jahr > 2100) return;

    $y.find(".doc").each((__, dEl) => {
      const $d = $(dEl);
      const a = $d.find("a[href]").first();
      const href = a.attr("href");
      if (!href) return;
      let abs: string;
      try {
        abs = new URL(href, BASE).toString();
      } catch {
        return;
      }
      if (!/\.pdf(\?|$)/i.test(abs)) return;

      // Titel aus .desc OHNE den "PDF … KB"-Span.
      const titel =
        ($d.find(".desc").clone().children("span").remove().end().text() ||
          a.text())
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 300) || null;

      if (!titel || !IST_SOZIALBEIRAT_GUTACHTEN.test(titel)) return;
      kandidaten.push({ url: abs, titel, datum: ctx.dateFromUrl(abs), jahr });
    });
  });

  if (kandidaten.length === 0) return [];

  // NUR aktuell: neuestes Jahr + Vorjahr (≈ letzte 24 Monate, Cadence jährl.).
  const neuestesJahr = Math.max(...kandidaten.map((k) => k.jahr));
  const aktuell = kandidaten
    .filter((k) => k.jahr >= neuestesJahr - 1)
    .sort(
      (a, b) =>
        b.jahr - a.jahr || (b.datum ?? "").localeCompare(a.datum ?? ""),
    )
    .map<RohBericht>((k) => ({
      url: k.url,
      titel: k.titel,
      datum: k.datum,
      typ: ctx.classifyTyp(k.titel, k.url) ?? "Gutachten",
    }));

  // dedup nach url.
  return Array.from(new Map(aktuell.map((r) => [r.url, r])).values());
}
