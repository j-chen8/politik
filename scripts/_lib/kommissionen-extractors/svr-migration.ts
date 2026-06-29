import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Sachverständigenrat für Integration und Migration (SVR, unabhängig, Stiftungen).
 *
 * pollUrl = die Startseite svr-migration.de. Die Startseite selbst trägt KEINE
 * direkten PDF-Links (nur Teaser auf Detailseiten), enthält aber im Hauptmenü den
 * stabilen Link „Alle Publikationen" → https://www.svr-migration.de/alle-publikationen/.
 *
 * Strategie: static-pdf (über einen Hop). Die „Alle Publikationen"-Seite ist ein
 * serverseitig gerendertes WordPress (statisch scrapebar, kein JS zur Laufzeit nötig)
 * und listet die jüngsten Veröffentlichungen mit DIREKTEN PDF-Download-Links
 * (`/wp-content/uploads/JJJJ/MM/…​.pdf`) inkl. sprechender `title`-Attribute:
 *   - Jahresgutachten (jährl., das Hauptprodukt) + seine Begleitdokumente
 *     (Kernbotschaften, Empfehlungen, Factsheet, Grafiken, beauftragte Expertisen),
 *   - Stellungnahmen (zu Gesetzentwürfen),
 *   - Kurzinformationen / Policy-Briefs / „Kurz und bündig"-Faktenpapiere,
 *   - Integrationsbarometer-Sonderauswertungen.
 * Diese Seite IST die offizielle Aktuell-Auswahl der Quelle (statisch nur die
 * jüngsten ~17 PDFs, kein Voll-Archiv), deshalb reicht das Ernten der PDF-Links.
 *
 * Datum: die PDF-URLs tragen kein tagesgenaues Datum, wohl aber den WordPress-
 * Upload-Pfad `/uploads/JJJJ/MM/` → als JJJJ-MM-01 übernommen (Monatsgenauigkeit,
 * guter Proxy fürs Veröffentlichungsdatum). Greift das nicht, fällt es auf die
 * generischen Datums-Heuristiken (Linktext/URL-Slug) zurück.
 *
 * Bewusst NICHT geerntet: Navigations-/Footer-Links, Bilder, Mitgliederlisten —
 * `genericPdfLinks` greift ausschließlich PDF-/Download-Links ab.
 *
 * Layout geändert / „Alle Publikationen" nicht erreichbar / keine PDFs gefunden
 * → return [] (Fallback = Seed-Bericht aus der Watchlist). KEINE erfundenen URLs.
 */

/** Datum aus dem WordPress-Upload-Pfad `/wp-content/uploads/JJJJ/MM/` → JJJJ-MM-01. */
function dateFromUploadPath(url: string): string | null {
  const m = url.match(/\/uploads\/(20\d{2})\/(0[1-9]|1[0-2])\//);
  return m ? `${m[1]}-${m[2]}-01` : null;
}

/** Im HTML den stabilen „Alle Publikationen"-Link finden, sonst konstruieren. */
function findListingUrl($: CheerioAPI, base: string): string {
  let found: string | null = null;
  $("a[href]").each((_, a) => {
    if (found) return;
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, base).toString();
    } catch {
      return;
    }
    if (/\/alle-publikationen\/?($|[?#])/i.test(abs)) found = abs.split(/[?#]/)[0];
  });
  try {
    return found ?? new URL("/alle-publikationen/", base).toString();
  } catch {
    return found ?? base;
  }
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  // 1) Startseite holen und den „Alle Publikationen"-Link bestimmen.
  const $home: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));
  const listingUrl = findListingUrl($home, ctx.pollUrl);

  // 2) Listenseite holen (eigener try/catch — ein 404 darf den Lauf nicht kippen).
  let $list: CheerioAPI;
  try {
    $list = ctx.load(await ctx.fetchHtml(listingUrl));
  } catch {
    return [];
  }

  // 3) Direkte PDF-Links ernten (typ via classifyTyp bereits gesetzt).
  //    Begleitmaterial des Jahresgutachtens (Factsheet/Grafiken/Kernbotschaften/
  //    Empfehlungen/Expertisen) ist KEIN eigener Bericht → herausfiltern, sonst
  //    erscheint EIN Gutachten als ~7 Einträge (und spammt die Neu-Bericht-Mail).
  const BEGLEIT_RE = /factsheet|grafik(en)?|kernbotschaft|empfehlungen zum jahresgutachten|expertise von|aus dem jahresgutachten/i;
  const alle = ctx.genericPdfLinks($list, listingUrl).filter((r) => !BEGLEIT_RE.test(r.titel ?? ""));
  if (alle.length === 0) return [];

  // 4) Datum anreichern: Upload-Pfad-Monat als Proxy, wenn die generische
  //    Heuristik (Linktext/Slug) nichts geliefert hat.
  for (const r of alle) r.datum = r.datum ?? dateFromUploadPath(r.url);

  // 5) Sortieren (jüngstes zuerst), IMMER den neuesten behalten + alle der
  //    letzten ~24 Monate. Die Liste ist ohnehin die Aktuell-Auswahl der Quelle.
  const sortiert = alle.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0];
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
