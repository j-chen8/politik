import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * KEF — Kommission zur Ermittlung des Finanzbedarfs der Rundfunkanstalten.
 *
 * pollUrl = die Startseite kef-online.de (TYPO3-CMS, serverseitig gerendert,
 * statisch scrapebar — kein JS zur Laufzeit nötig).
 *
 * Die ECHTEN Berichte (die nummerierten „KEF-Berichte", das einzige inhaltliche
 * Produkt der Kommission) stehen vollständig und statisch auf der Unterseite
 *   https://kef-online.de/berichte
 * Jeder Bericht ist eine `div.row` (TYPO3-„rlppublications"-Publikationsliste) mit
 *   - Titel    in `h4.title`  (z. B. „25. KEF-Bericht"),
 *   - Metadaten im Fließtext  („Erscheinungsjahr: 2026", „Umfang: … Seiten"),
 *   - direktem PDF-Download-Link (`li.ce-uploads-item`, fileadmin/.../NN._*Bericht*.pdf).
 * Diese Liste ist nach Berichtsnummer absteigend sortiert (neuester zuerst).
 * Der PDF-Link liegt NICHT in der title-box, sondern als Geschwister-Knoten in
 * derselben Zeile — daher wird die ganze `div.row` als Einheit gelesen. Die äußere
 * Container-`row` matcht ebenfalls (sie enthält alle Zeilen); ihr erstes PDF ist das
 * des neuesten Berichts, sodass die spätere url-Deduplizierung sie kollabiert.
 *
 * Strategie: static-pdf (Berichtsliste) + 1 Detail-Follow für das Datum.
 * Die Berichtsliste trägt nur das Erscheinungsjahr, kein tagesgenaues Datum.
 * Das exakte Veröffentlichungsdatum des NEUESTEN Berichts wird — falls vorhanden —
 * aus der zugehörigen Pressemitteilung geholt: die Startseite verlinkt
 * `/presse/detail/<NN>-kef-bericht-…`, deren Detailseite ein maschinenlesbares
 * `<time itemprop="datePublished" datetime="YYYY-MM-DD">` trägt. Schlägt das fehl,
 * bleibt datum = null (nur Jahr ist KEIN vollständiges ISO-Datum → nicht erfinden).
 *
 * NUR AKTUELL: KEF berichtet ~alle 2 Jahre. Ausgegeben werden der neueste Bericht
 * (immer) plus Berichte, deren Erscheinungsjahr ins laufende oder letzte Jahr fällt.
 * Das große Bericht-Archiv (16.–24.) sowie Flipbooks, Reden und Mitglieder-Seiten
 * werden bewusst NICHT geerntet.
 *
 * Layout geändert / Liste nicht erreichbar → return [] (Fallback = Seed-Bericht).
 * KEINE erfundenen URLs/Daten.
 */

interface BerichtBlock {
  num: number;
  titel: string;
  url: string;
  jahr: number | null;
}

/** Berichtsnummer aus „NN. KEF-Bericht". */
function berichtNummer(titel: string): number | null {
  const m = titel.match(/^\s*(\d{1,3})\.\s*KEF-Bericht/i);
  return m ? parseInt(m[1], 10) : null;
}

/** Exaktes Datum des neuesten Berichts aus der verlinkten Pressemitteilung. */
async function datumAusPresse(ctx: ExtractCtx): Promise<string | null> {
  try {
    const $: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));
    let detail: string | null = null;
    $("a[href]").each((_, a) => {
      if (detail) return;
      const href = $(a).attr("href") ?? "";
      if (/presse\/detail\/.*kef-bericht/i.test(href)) {
        try {
          detail = new URL(href, ctx.pollUrl).toString();
        } catch {
          /* ignore */
        }
      }
    });
    if (!detail) return null;
    const d$: CheerioAPI = ctx.load(await ctx.fetchHtml(detail));
    const dt =
      d$('time[itemprop="datePublished"]').attr("datetime") ||
      d$("time[datetime]").first().attr("datetime") ||
      "";
    const m = dt.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  } catch {
    return null; // Datum ist optional — eine fehlende/umgebaute Presseseite kippt nichts
  }
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  // Berichts-Archiv-Seite aus dem pollUrl-Origin ableiten (robust gegen www/Trailing-Slash).
  let berichteUrl: string;
  try {
    berichteUrl = new URL("/berichte", ctx.pollUrl).toString();
  } catch {
    return [];
  }

  let html: string;
  try {
    html = await ctx.fetchHtml(berichteUrl);
  } catch {
    return [];
  }
  const $: CheerioAPI = ctx.load(html);

  const blocks: BerichtBlock[] = [];
  $("div.row").each((_, el) => {
    const $el = $(el);
    const titel = $el.find("div.title-box h4.title").first().text().replace(/\s+/g, " ").trim();
    const num = berichtNummer(titel);
    if (num === null) return;

    // direktes Bericht-PDF innerhalb derselben Zeile (erstes PDF = Berichtsvolltext)
    let pdf: string | null = null;
    $el.find("a[href]").each((__, a) => {
      if (pdf) return;
      const href = $(a).attr("href");
      if (href && /\.pdf(\?|$)/i.test(href)) {
        try {
          pdf = new URL(href, berichteUrl).toString();
        } catch {
          /* ignore */
        }
      }
    });
    if (!pdf) return;

    const ym = $el.text().match(/Erscheinungsjahr:?\s*(20\d{2})/i);
    const jahr = ym ? parseInt(ym[1], 10) : null;
    blocks.push({ num, titel, url: pdf, jahr });
  });

  if (blocks.length === 0) return [];

  // Neuester = höchste Berichtsnummer (zuverlässiger als das nur jährliche Datum).
  blocks.sort((a, b) => b.num - a.num);
  const neuester = blocks[0];

  // NUR AKTUELL: neuester immer + alles aus laufendem/letztem Jahr.
  const jetztJahr = new Date().getFullYear();
  const aktuell = blocks.filter((b) => b.jahr !== null && b.jahr >= jetztJahr - 1);

  const datumNeuester = await datumAusPresse(ctx);

  const ausgewaehlt = Array.from(new Map([neuester, ...aktuell].map((b) => [b.url, b])).values());

  return ausgewaehlt.map((b) => ({
    url: b.url,
    titel: b.titel.slice(0, 300),
    datum: b.num === neuester.num ? datumNeuester : null,
    typ: ctx.classifyTyp(b.titel, b.url) ?? "Bericht",
  }));
}
