import type { CheerioAPI } from "cheerio";

/** Ein roher Berichts-Fund einer Quelle (noch nicht in der DB). */
export interface RohBericht {
  url: string;                 // direktes PDF wenn auffindbar, sonst Detailseiten-URL; absolut
  titel: string | null;       // Linktext/Titel, getrimmt, ≤300 Zeichen
  datum: string | null;       // ISO 'YYYY-MM-DD' oder null
  typ: string | null;         // ∈ Jahresbericht|Gutachten|Stellungnahme|Prüfbericht|Bericht|Pressemitteilung
}

/** Vom Scraper injizierter Kontext — Extractor nutzt NUR diese Helfer (€0, statisch). */
export interface ExtractCtx {
  pollUrl: string;                                   // seed.pollUrl (nie null, wenn Extractor aufgerufen wird)
  fetchHtml: (u: string) => Promise<string>;
  load: (html: string) => CheerioAPI;                // = cheerio.load
  genericPdfLinks: ($: CheerioAPI, baseUrl: string) => RohBericht[];
  classifyTyp: (titel: string | null, url: string) => string | null;
  dateFromUrl: (url: string) => string | null;
  istKuerzlich: (datum: string | null, monate?: number) => boolean;  // default 24 Monate; null → false
}
