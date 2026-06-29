import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Stabilitätsrat (gemeinsames Gremium von Bund & Ländern, BMF + Länder-Finanzministerien)
 * — https://www.stabilitaetsrat.de
 *
 * STRATEGIE: detail-follow (statisch, cheerio). Verifiziert 2026-06-29.
 *
 * SEITENSTRUKTUR:
 *   - pollUrl = Startseite. Sie zeigt nur die JEWEILS LETZTE Sitzung → für die
 *     Discovery ungeeignet. Statisch vollständig ist hingegen das Listing
 *     „Beschlüsse und Beratungsunterlagen" (LISTING unten): es verlinkt JEDE
 *     Sitzung/jedes Umfrageverfahren als eigene Detailseite (`…_node.html`),
 *     deren Verzeichnis mit dem Sitzungsdatum YYYYMMDD beginnt
 *     (z. B. `…/20260511_35.Sitzung/Sitzung20260511_node.html`).
 *   - Der RSS-Newsfeed (SiteGlobals/.../RSSNewsfeed.xml) ist ein leerer
 *     Platzhalter der „Standardlösung" (Government Site Builder) → unbrauchbar.
 *   - Jede Sitzungs-Detailseite bündelt mehrere PDFs: Tagesordnung,
 *     Pressemitteilung, Beschlüsse, Beschlussvorschläge des Arbeitskreises,
 *     Parlamentsdokumente (TOP1/TOP2/Verzeichnis) und — falls turnusgemäß —
 *     die Stellungnahme des unabhängigen Beirats. Alle PDFs liegen als
 *     direkte `…/SharedDocs/Downloads/…?__blob=publicationFile`-Links vor
 *     (HTTP 200, application/pdf — verifiziert), also kein JS nötig.
 *
 * WAS WIR ALS „BERICHT" SURFACEN (substanziell, nicht prozedural):
 *   - die Stellungnahme des Beirats (unabhängige fiskalpolitische Bewertung,
 *     halbjährlich; typ „Stellungnahme") — das eigentliche Gutachten-Dokument,
 *   - die Pressemitteilung der Sitzung (offizielle Zusammenfassung der
 *     Beschlüsse; typ „Pressemitteilung").
 *   BEWUSST AUSGEFILTERT: Tagesordnung/Einladung, einzelne Beschlüsse und
 *   Beschlussvorschläge des Arbeitskreises, Parlamentsdokumente (TOP*,
 *   Verzeichnis) und die rein verfahrenstechnischen „Umfrageverfahren"
 *   (schriftliche Zwischenbeschlüsse ohne Pressemitteilung/Stellungnahme).
 *
 * DATUM: aus dem 8-stelligen Datum im PDF-Dateinamen/Pfad (dateFromUrl matcht
 *   `(20\d\d)(\d\d)(\d\d)` → ISO). Cadence: halbjährlich (Juni & Dezember).
 */

const LISTING =
  "https://www.stabilitaetsrat.de/DE/Beschluesse-und-Beratungsunterlagen/Beschluesse-und-Beratungsunterlagen_node.html";

// Substanzielle Berichts-PDFs (Pressemitteilung + Beirats-Stellungnahme).
const IST_BERICHT = /Pressemitteilung|Stellungnahme/i;
// Prozedurale/technische PDFs, die nie als Bericht zählen.
const KEIN_BERICHT =
  /Tagesordnung|Einladung|Beschlussvorschlae?g|Parlamentsdokumente|Verzeichnis|_TOP\d|favicon/i;

// Detailseite einer Sitzung (kein Umfrageverfahren — das ist rein prozedural).
const SITZUNG_LINK =
  /Beschluesse-und-Beratungsunterlagen\/(\d{8})_[^/]*Sitzung\/[^/]*_node\.html/i;

function typFuer(url: string): string | null {
  if (/Stellungnahme/i.test(url)) return "Stellungnahme";
  if (/Pressemitteilung/i.test(url)) return "Pressemitteilung";
  return null;
}

function istPdfUrl(u: string): boolean {
  return (
    /\.pdf(\?|$)/i.test(u) ||
    /__blob=(publicationFile|file)/i.test(u) ||
    /resource\/blob\/.*\.pdf/i.test(u)
  );
}

/**
 * Bespoke-Anker-Ernte einer Detailseite. genericPdfLinks bevorzugt das
 * title-Attribut — das ist hier aber durchgehend „Öffnet im neuen Fenster"
 * (Barrierefreiheits-Hinweis). Der beschreibende Titel steckt im Linktext
 * („35. Sitzung 05/2026 Pressemitteilung (PDF, 260 KB)"). Darum hier den
 * Linktext nehmen und den „(PDF, … KB)"-Größen-Suffix entfernen.
 */
function ernteDetailPdfs($: CheerioAPI, baseUrl: string): RohBericht[] {
  const base = $("base[href]").attr("href")?.trim() || baseUrl;
  const out: RohBericht[] = [];
  const seen = new Set<string>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, base).toString();
    } catch {
      return;
    }
    if (!istPdfUrl(abs) || seen.has(abs)) return;
    seen.add(abs);
    const text = $(a)
      .text()
      .replace(/\s+/g, " ")
      .replace(/\s*\(PDF,[^)]*\)\s*$/i, "")
      .trim();
    const titel = text ? text.slice(0, 300) : null;
    out.push({ url: abs, titel, datum: null, typ: null });
  });
  return out;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  // 1) Listing laden und Sitzungs-Detailseiten + Datum sammeln.
  let $: CheerioAPI;
  try {
    $ = ctx.load(await ctx.fetchHtml(LISTING));
  } catch {
    return [];
  }

  // GSB-Seiten setzen <base href="https://www.stabilitaetsrat.de/"> — relative
  // Links sind site-root-relativ, NICHT seiten-relativ. Gegen die <base> auflösen.
  const baseHref = $("base[href]").attr("href")?.trim() || LISTING;

  const sitzungen = new Map<string, { url: string; datum: string | null }>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, baseHref).toString();
    } catch {
      return;
    }
    const m = abs.match(SITZUNG_LINK);
    if (!m || sitzungen.has(abs)) return;
    const datum = ctx.dateFromUrl(abs); // YYYYMMDD aus dem Verzeichnis
    sitzungen.set(abs, { url: abs, datum });
  });
  if (sitzungen.size === 0) return [];

  // 2) Auswahl: neueste Sitzung IMMER + alle aus den letzten 24 Monaten.
  const sortiert = [...sitzungen.values()].sort(
    (a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""),
  );
  const auswahl = [
    sortiert[0],
    ...sortiert.filter((s) => ctx.istKuerzlich(s.datum, 24)),
  ];
  const uniqAuswahl = Array.from(
    new Map(auswahl.map((s) => [s.url, s])).values(),
  ).slice(0, 10); // höflich: Detailseiten-Fetches deckeln

  // 3) Pro Detailseite die substanziellen PDFs ernten (defensiv je Seite).
  const funde: RohBericht[] = [];
  for (const s of uniqAuswahl) {
    try {
      const $d = ctx.load(await ctx.fetchHtml(s.url));
      const pdfs = ernteDetailPdfs($d, s.url).filter((r) => {
        const hay = `${r.titel ?? ""} ${r.url}`;
        return IST_BERICHT.test(hay) && !KEIN_BERICHT.test(hay);
      });
      for (const r of pdfs) {
        funde.push({
          url: r.url,
          titel: r.titel,
          datum: r.datum ?? ctx.dateFromUrl(r.url) ?? s.datum,
          typ: typFuer(r.url) ?? r.typ ?? ctx.classifyTyp(r.titel, r.url),
        });
      }
    } catch {
      /* 404/Netzfehler einer Detailseite kippt den Lauf nicht */
    }
  }
  if (funde.length === 0) return [];

  // 4) NUR aktuell: neuester (immer) + letzte 24 Monate; dedup nach url.
  const sorted = funde.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sorted[0];
  const aktuell = sorted.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
