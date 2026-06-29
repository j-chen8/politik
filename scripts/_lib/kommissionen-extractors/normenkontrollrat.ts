import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Nationaler Normenkontrollrat (NKR), www.normenkontrollrat.bund.de
 * (Government-Site-Builder/GSB des Bundes, identische Technik wie BMF/BMWE).
 *
 * STRUKTUR (manuell verifiziert 2026-06-29):
 *   - pollUrl = die Jahresberichte-Übersicht. HTTP 200, serverseitig gerendert
 *     (kein JS zur Laufzeit nötig), klassische GSB-Downloadliste.
 *   - Der NKR erstellt JÄHRLICH einen Tätigkeits-/Jahresbericht. Die aktuellen
 *     Jahrgänge hängen als DIREKTE PDFs:
 *       /Webs/NKR/SharedDocs/Downloads/DE/Jahresberichte/<JAHR>-jahresbericht.pdf?__blob=publicationFile
 *     (2019–2025 als .pdf; Anker-Headline = Berichts-Motto, z.B. 2025
 *     „Einfach, schnell, wirksam. Den Staat neu gestalten.").
 *   - DARUNTER ein ARCHIV (2007–2018): das sind KEINE PDFs, sondern
 *     Detail-/Archiv-.html-Seiten (…/Jahresberichte-Archiv/Jahresbericht-2017.html).
 *     Genau diese reißt der generische Report-Poll mit (alte Jahrgänge) → hier
 *     bewusst ausgefiltert (wir nehmen NUR direkte <JAHR>-jahresbericht.pdf).
 *
 * AKTUALITÄT: Die Liste trägt KEIN tagesgenaues Datum (nur Jahr im URL-Slug),
 *   daher datum=null (YYYY-MM-DD nicht ermittelbar). Recency wird über das
 *   Jahr im URL-Slug bestimmt (nicht über ctx.istKuerzlich, das ein volles
 *   Datum bräuchte): IMMER der neueste Jahrgang + alle Jahrgänge der laufenden
 *   Periode (Jahr ≥ aktuelles Jahr − 1 ≈ letzte ~24 Monate). Kein Archiv.
 *
 * STRATEGIE: static-pdf (direkte PDF-Liste, kein Detail-Follow nötig).
 *
 * Layout geändert / keine direkten Jahresbericht-PDFs gefunden → return []
 * (Fallback = Seed-Bericht aus der Watchlist). KEINE erfundenen URLs.
 */

// Direktes Jahresbericht-PDF: …/Jahresberichte/<JAHR>-jahresbericht.pdf
// (case-insensitiv: ältere Jahrgänge nutzen „-Jahresbericht.pdf"). Schließt die
// Archiv-.html-Seiten aus, weil die auf „.html" enden.
const JB_PDF_RE = /\/Jahresberichte\/(20\d{2})-[Jj]ahresbericht\.pdf(\?|$)/;

/** Anker-/Titeltext säubern: GSB-Suffixe wie „ PDF, 3MB" / „Öffnet im neuen Fenster". */
function cleanTitel(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.replace(/\s+/g, " ").trim();
  t = t.replace(/\s*\(?PDF[,;]?\s*[\d.,]+\s*[KMG]B\)?.*$/i, "").trim();
  t = t.replace(/\s*Öffnet im neuen Fenster.*$/i, "").trim();
  return t.slice(0, 300) || null;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Direkte Jahresbericht-PDFs einsammeln (Archiv-.html fällt raus).
  type Kand = { url: string; jahr: number; titel: string | null };
  const byUrl = new Map<string, Kand>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try { abs = new URL(href, ctx.pollUrl).toString(); } catch { return; }
    const m = abs.match(JB_PDF_RE);
    if (!m) return;
    const jahr = parseInt(m[1], 10);
    // Bevorzugt die beschreibende Headline; der nackte Anker trägt oft nur
    // „… PDF, 3MB"/„Öffnet im neuen Fenster".
    const headline = cleanTitel(
      $(a).closest("div,li,article").find("h1,h2,h3,h4,h5").first().text() || null,
    );
    const ankerTitel = cleanTitel($(a).attr("title") || $(a).text() || null);
    const motto = headline || ankerTitel;
    const titel = (motto ? `Jahresbericht ${jahr}: ${motto}` : `Jahresbericht ${jahr}`).slice(0, 300);
    const prev = byUrl.get(abs);
    if (!prev || (!prev.titel && titel)) byUrl.set(abs, { url: abs, jahr, titel });
  });

  const kandidaten = [...byUrl.values()];
  if (kandidaten.length === 0) return [];

  // Sortieren nach Jahr (neuestes zuerst).
  kandidaten.sort((a, b) => b.jahr - a.jahr);
  const neuesterJahr = kandidaten[0].jahr;
  const aktJahr = new Date().getUTCFullYear();
  // IMMER der neueste Jahrgang + laufende Periode (Jahr ≥ aktuelles − 1).
  const aktuell = kandidaten.filter((k) => k.jahr === neuesterJahr || k.jahr >= aktJahr - 1);

  return aktuell.map((k) => ({
    url: k.url,
    titel: k.titel,
    datum: null, // nur Jahr im Slug → kein valides YYYY-MM-DD ermittelbar
    typ: "Jahresbericht" as const,
  }));
}
