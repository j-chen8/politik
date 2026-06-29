import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Kommission für die langfristige Stabilisierung der Alterssicherung
 * („Alterssicherungskommission" / „Rentenkommission 2026"), BMAS.
 *
 * pollUrl = die dedizierte Themenseite auf bmas.de. Die Seite ist serverseitig
 * gerendert (statisch scrapebar, kein JS zur Laufzeit nötig), ABER der eigentliche
 * Bericht hängt NICHT an einem klassischen <a href>, sondern an einem Custom-Element
 * <pp-link href="…/empfehlungen-der-rentenkommission-bmas-juni-2026.pdf">. Der
 * generische genericPdfLinks-Helfer fragt nur `a[href]` ab und verfehlt den Bericht
 * deshalb — der einzige normale <a>-PDF-Link ist der prozedurale
 * „Einsetzungsbeschluss" (Gründungsdokument, KEIN Bericht). Darum dieser bespoke
 * Harvester, der sowohl `a[href]` als auch `pp-link[href]` erntet.
 *
 * Inhalt der Seite (Stand 2026-06-29):
 *   - empfehlungen-der-rentenkommission-bmas-juni-2026.pdf  → DER Bericht (33 Empfehlungen),
 *     am 23.06.2026 an das BMAS übergeben → typ „Bericht".
 *   - einsetzungsbeschluss-alterssicherungskommission.pdf   → Gründungs-/Verfahrensdokument,
 *     KEIN Bericht → ausgefiltert.
 *
 * Datum: der Bericht-URL-Slug enthält nur „juni-2026" (kein Tag), darum wird das
 * Übergabedatum „23. Juni 2026" deterministisch aus der Infobox der Seite gelesen
 * (Fallback auf dateFromUrl, dann null). Strategie: static-pdf.
 *
 * Die Kommission ist eine einmalige Reformkommission (Bericht vorgelegt) → es gibt
 * genau einen aktuellen Bericht.
 */

// Ein Bericht ist ein substanzielles Output-Dokument der Kommission, NICHT ein
// Verfahrens-/Gründungsdokument (Einsetzungsbeschluss, Geschäftsordnung, Mitgliederliste).
const IST_BERICHT = /empfehlung|bericht|gutachten|stellungnahme/i;
const KEIN_BERICHT = /einsetzungsbeschluss|gesch[äa]ftsordnung|mitglied|tagesordnung|protokoll/i;

function istPdfUrl(u: string): boolean {
  return (
    /\.pdf(\?|$)/i.test(u) ||
    /__blob=(publicationFile|file)/i.test(u) ||
    /resource\/blob\/.*\.pdf/i.test(u)
  );
}

/** Übergabedatum „… Bericht wurde am 23. Juni 2026 …" aus dem Seitentext lesen. */
function uebergabeDatum($: CheerioAPI): string | null {
  const txt = ($("main").text() || $.root().text()).replace(/\s+/g, " ");
  const m = txt.match(/Bericht wurde am\s+(\d{1,2}\.\s+[A-Za-zÄÖÜäöüß]+\s+20\d{2})/);
  return m ? parseGermanDate(m[1]) : null;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $ = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Bespoke-Harvest: a[href] UND pp-link[href] (der Bericht steckt im pp-link).
  const kandidaten: RohBericht[] = [];
  const seen = new Set<string>();
  $("a[href], pp-link[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, ctx.pollUrl).toString();
    } catch {
      return;
    }
    if (!istPdfUrl(abs) || seen.has(abs)) return;
    seen.add(abs);
    const titel = $(el).attr("title")?.trim() || $(el).text().trim().slice(0, 300) || null;
    kandidaten.push({ url: abs, titel, datum: ctx.dateFromUrl(abs), typ: ctx.classifyTyp(titel, abs) });
  });

  // Nur echte Berichte (Empfehlungen/Bericht), Verfahrensdokumente raus.
  const berichte = kandidaten.filter((r) => {
    const s = `${r.titel ?? ""} ${r.url}`;
    return IST_BERICHT.test(s) && !KEIN_BERICHT.test(s);
  });
  if (berichte.length === 0) return [];

  const pageDatum = uebergabeDatum($);
  const typisiert = berichte.map<RohBericht>((r) => ({
    ...r,
    // Übergabedatum als Fallback, wenn der URL-Slug keinen Tag hergibt.
    datum: r.datum ?? pageDatum,
    // „Empfehlungen der Kommission" trifft kein classifyTyp-Keyword → der
    // substanzielle Output ist der Bericht der Kommission.
    typ: r.typ ?? ctx.classifyTyp(r.titel, r.url) ?? "Bericht",
  }));

  const sortiert = typisiert.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0]; // IMMER behalten
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
