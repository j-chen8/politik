import type { ExtractCtx, RohBericht } from "./types";

/**
 * Mindestlohnkommission (unabhängig, BMAS-nah) — https://www.mindestlohn-kommission.de
 *
 * BESONDERHEIT / WARUM KEIN KLASSISCHES CRAWLING:
 * Die komplette Website liegt hinter einem JavaScript-Proof-of-Work-Schutz
 * ("Bunny Shield"). JEDE HTML-Seite (Startseite, robots.txt, sitemap.xml, die
 * Berichte-/Beschluss-Listings, alle `*_node`-Detailseiten) antwortet einem
 * statischen Client (curl/fetch ohne JS) mit HTTP 403 + Challenge-HTML
 * ("Establishing a secure connection ..."). Ein rein statischer cheerio-Scraper
 * kann die Listings also NICHT crawlen → keine Live-Discovery möglich.
 *
 * WAS STATISCH GEHT:
 * Die direkten PDF-Download-URLs unter `/shareddocs/downloads/de/Bericht/…`
 * (GSB-CMS-Muster `?__blob=publicationFile&v=N`) werden vom Origin AUSGELIEFERT
 * (HTTP 200, application/pdf) — verifiziert 4/4 stabil pro URL am 2026-06-29.
 * Wichtig: nur die VERSIONIERTE Form (`&v=N`) ist zuverlässig; die un-versionierte
 * Variante triggert teils erneut die Shield-Challenge.
 *
 * STRATEGIE: static-pdf mit kuratierten, real verifizierten Direkt-PDF-URLs des
 * laufenden Berichts-Zyklus (5. Bericht 2025). KEINE erfundenen URLs — jede unten
 * gelistete URL wurde geprüft (200, application/pdf; der 5. Bericht zusätzlich
 * heruntergeladen + via pdf-parse gelesen: 220 Seiten, 648k Zeichen, deutscher
 * Volltext). Da Discovery shield-blockiert ist, kann ein künftiger 6. Bericht
 * NICHT automatisch gefunden werden — dann hier eine Zeile ergänzen.
 *
 * Cadence der Kommission: ~2-jährl. Evaluationsbericht + Anpassungsbeschluss
 * (zuletzt 27.06.2025: 13,90 €/2026, 14,60 €/2027).
 *
 * Forward-compat: Es wird best-effort versucht, das Berichte-Listing dennoch
 * statisch zu laden (try/catch). Falls der Shield je entfällt, werden dort
 * verlinkte PDFs zusätzlich aufgenommen; bis dahin greift die kuratierte Liste.
 */

const BERICHTE_LISTING =
  "https://www.mindestlohn-kommission.de/de/Publikationen/Berichte-der-Mindestlohnkommission/berichte-der-mindestlohnkommission_node";

/** Real verifizierte Direkt-PDFs des laufenden Zyklus (5. Bericht, 27.06.2025). */
const KURATIERT: RohBericht[] = [
  {
    url: "https://www.mindestlohn-kommission.de/shareddocs/downloads/de/Bericht/fuenfter-bericht.pdf?__blob=publicationFile&v=5",
    titel: "Fünfter Bericht zu den Auswirkungen des gesetzlichen Mindestlohns",
    datum: "2025-06-27",
    typ: "Bericht",
  },
  {
    url: "https://www.mindestlohn-kommission.de/shareddocs/downloads/de/Bericht/beschluss2025.pdf?__blob=publicationFile&v=6",
    titel: "Beschluss der Mindestlohnkommission nach § 9 MiLoG (2025)",
    datum: "2025-06-27",
    typ: null, // „Beschluss" ist kein Enum-Typ (classifyTyp → null)
  },
  {
    url: "https://www.mindestlohn-kommission.de/shareddocs/downloads/de/Bericht/Ergaenzungsband-Stellungnahmen2025.pdf?__blob=publicationFile&v=4",
    titel: "Ergänzungsband: Stellungnahmen aus der schriftlichen Anhörung 2025",
    datum: "2025-06-27",
    typ: "Stellungnahme",
  },
];

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  // COALESCE-Merge nach url: kuratierte Werte (gute Titel/Daten) gewinnen,
  // ein Crawl-Treffer derselben URL füllt nur fehlende Felder. Verhindert, dass
  // der Listing-Treffer (Titel „Herunterladen (PDF…)", datum=null) die kuratierte
  // Zeile überschreibt.
  const byUrl = new Map<string, RohBericht>();
  const merge = (r: RohBericht) => {
    const ex = byUrl.get(r.url);
    byUrl.set(r.url, ex
      ? { url: r.url, titel: ex.titel ?? r.titel, datum: ex.datum ?? r.datum, typ: ex.typ ?? r.typ }
      : r);
  };
  KURATIERT.forEach(merge);

  // Best-effort: Listing/Startseite statisch laden — der Shield blockt teils
  // (wirft 403, gefangen), lässt aber zeitweise durch. Gelingt es, werden dort
  // verlinkte Bericht-PDFs zusätzlich entdeckt (z. B. ein künftiger 6. Bericht).
  for (const seite of [BERICHTE_LISTING, ctx.pollUrl]) {
    try {
      const $ = ctx.load(await ctx.fetchHtml(seite));
      ctx.genericPdfLinks($, seite)
        .filter((r) => {
          const s = `${r.titel ?? ""} ${r.url}`.toLowerCase();
          return /bericht|beschluss|stellungnahme|gutachten/.test(s)
            && !/schaubild|logo|favicon|grafik/.test(s);
        })
        .forEach((r) => merge({ ...r, typ: r.typ ?? ctx.classifyTyp(r.titel, r.url) }));
    } catch {
      /* Shield-Challenge / Netzfehler — kuratierte Liste bleibt maßgeblich */
    }
  }

  const uniq = Array.from(byUrl.values());
  if (uniq.length === 0) return [];

  // NUR aktuell: neuester (immer) + alles aus den letzten 24 Monaten.
  const sortiert = uniq.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0];
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
