import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Wissenschaftlicher Beirat beim Bundesministerium für Wirtschaft und Energie (BMWE).
 *
 * pollUrl = die Beiräte-Übersicht auf www.bundeswirtschaftsministerium.de
 * (…/Textsammlungen/Ministerium/beiraete.html). Die echten Gutachten des
 * Wissenschaftlichen Beirats liegen NICHT direkt auf dieser Übersicht, sondern
 * hinter einer eigenen Unterseite (Gutachten-Liste) des Beirats.
 *
 * STRATEGIE: blocked.
 * Die GESAMTE BMWE-Domain (www.bundeswirtschaftsministerium.de UND die
 * Alt-/Spiegel-Domain www.bmwk.de) ist hinter einer Radware-/perfdrive-
 * Bot-Protection eingesperrt. Jeder statische Abruf (curl/fetch ohne Browser)
 * — auch der der Übersicht, der Startseite und sogar /robots.txt — liefert
 * HTTP 200 mit der „Radware Captcha Page" statt des Inhalts. Die Freigabe
 * erfordert das Lösen eines clientseitigen JS-Challenges (Cookie über
 * validate.perfdrive.com, __uzma/__uzmb/…), was sich mit cheerio+fetch
 * grundsätzlich NICHT statisch nachbilden lässt. Manuell verifiziert
 * 2026-06-29 (auch mit vollständigen Browser-Headern und Cookie-Jar-Retry:
 * stets „Radware Captcha Page", title = "Radware Captcha Page"/"Radware Page").
 *
 * Konsequenz: kein statischer Endpunkt → extract() liefert [].
 * Fallback = kuratierter Seed-Bericht aus der Watchlist (kommissionen-watchlist.ts).
 * Es werden BEWUSST KEINE Gutachten-PDF-URLs erfunden — die reale Listing-
 * Struktur ist hinter der Bot-Protection nicht einsehbar/verifizierbar.
 *
 * Der Abruf wird hier dennoch defensiv versucht und auf das Captcha-Markup
 * geprüft, damit der Extractor (a) den Blocker zur Laufzeit selbst belegt und
 * (b) automatisch wieder Daten liefern KÖNNTE, falls die Bot-Protection später
 * fällt UND die Übersicht dann direkte, eindeutig dem Wiss. Beirat zugeordnete
 * Gutachten-PDFs enthält. Solange beides nicht zutrifft → [].
 */

const BASE = "https://www.bundeswirtschaftsministerium.de";

/** Erkennt die Radware-/perfdrive-Bot-Protection-Seite. */
function istBotProtection(html: string): boolean {
  return /radware|perfdrive|validate\.perfdrive|px-captcha|captcha-public/i.test(html);
}

/** Nur PDFs, deren URL/Titel den Wissenschaftlichen Beirat klar ausweisen. */
const WISS_BEIRAT_RE = /wissenschaftlich|beirat|gutachten/i;

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  let html: string;
  try {
    html = await ctx.fetchHtml(ctx.pollUrl);
  } catch {
    return []; // Netzfehler/HTTP-Fehler → Seed bleibt
  }

  // Hard-Blocker: solange die Radware-/perfdrive-Schranke greift, gibt es
  // keinen verwertbaren Inhalt → []. (KEINE erfundenen URLs.)
  if (istBotProtection(html)) return [];

  // --- Best-effort-Pfad, falls die Bot-Protection künftig fällt ---
  // Nur direkte, dem Wiss. Beirat eindeutig zuordenbare PDF-Links ernten;
  // die generische Beiräte-Übersicht verlinkt sonst viele FREMDE Beiräte.
  const $: CheerioAPI = ctx.load(html);
  const kandidaten = ctx
    .genericPdfLinks($, BASE)
    .filter((r) => WISS_BEIRAT_RE.test(`${r.titel ?? ""} ${r.url}`));

  if (kandidaten.length === 0) return [];

  const sortiert = kandidaten.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0]; // IMMER behalten
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
