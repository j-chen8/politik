import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Sachverständigenrat zur Begutachtung der Entwicklung im Gesundheitswesen
 * (SVR Gesundheit & Pflege), beraten das BMG; legt unregelmäßig (~jährlich)
 * ein großes Gutachten vor.
 *
 * pollUrl = die Startseite svr-gesundheit.de. Die Seite ist ein serverseitig
 * gerendertes TYPO3-CMS (statisch scrapebar, kein JS zur Laufzeit nötig).
 * Die Publikationen liegen unter /publikationen/ als Jahres-Detailseiten
 * `/publikationen/gutachten-<JAHR>/` (z.B. .../gutachten-2025/, -2024/, -2023/);
 * ältere Gutachten unter /publikationen/fruehere-gutachten/ (= Archiv, bewusst
 * NICHT geerntet).
 *
 * Strategie: detail-follow.
 *   1) Homepage laden, alle `/publikationen/gutachten-<JAHR>/`-Links sammeln,
 *      das JÜNGSTE Jahr wählen (= aktuelles Gutachten der Quelle).
 *   2) Diese Jahres-Detailseite folgen (ctx.fetchHtml, try/catch):
 *        - Datum: Übergabedatum aus dem Fließtext „… hat am DD. Monat YYYY sein
 *          Gutachten … übergeben …" (parseGermanDate); ein späteres Symposium-Datum
 *          wird ignoriert (Vorrang für das Datum VOR „übergeben/vorgestellt").
 *        - Titel: der in Anführungszeichen stehende Gutachten-Titel
 *          („Preise innovativer Arzneimittel …"), zusammengesetzt zu
 *          „Gutachten <JAHR>: <Titel>".
 *        - PDF: die barrierefreie Gesamt-/Langfassung des Gutachtens.
 *          AUSGEFILTERT werden Pressemitteilung und (englische) Executive Summary
 *          (ein Bericht je Gutachten).
 *
 * Gibt NUR das aktuelle Gutachten zurück (eine Reihe, ~jährlich) — kein Archiv.
 *
 * Layout geändert / keine Jahres-Detailseite gefunden / keine Gesamtfassung
 * auffindbar → return [] (Fallback = Seed-Bericht aus der Watchlist).
 * KEINE erfundenen URLs.
 */

const JAHR_RE = /\/publikationen\/gutachten-(20\d{2})\/?$/i;

const MONATE =
  "Januar|Februar|M[äa]rz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";
const DATE_RE = new RegExp(`(\\d{1,2}\\.?\\s+(?:${MONATE})\\s+20\\d{2})`, "gi");

function istPdfUrl(u: string): boolean {
  return /\.pdf(\?|$)/i.test(u);
}

/** Übergabedatum aus dem Detail-Fließtext (Datum bevorzugt VOR „übergeben/vorgestellt"). */
function findeDatum(body: string, jahr: number): string | null {
  const ub = body.search(/übergab|übergeben|übergibt|vorgestellt/i);
  const cands: { i: number; d: string }[] = [];
  let m: RegExpExecArray | null;
  DATE_RE.lastIndex = 0;
  while ((m = DATE_RE.exec(body))) {
    const d = parseGermanDate(m[1]);
    if (d) cands.push({ i: m.index, d });
  }
  if (cands.length === 0) return null;
  const jahrStr = String(jahr);
  // Bevorzugt: ein Datum des Jahres, das VOR „übergeben/vorgestellt" steht.
  const vorUebergabe = cands.filter((c) => (ub < 0 || c.i <= ub) && c.d.startsWith(jahrStr));
  return (
    vorUebergabe[0]?.d ??
    cands.find((c) => c.d.startsWith(jahrStr))?.d ??
    cands[0].d
  );
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $home: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Jüngste Jahres-Detailseite der Gutachten-Reihe finden.
  let detailUrl: string | null = null;
  let jahr = 0;
  $home("a[href]").each((_, a) => {
    const href = $home(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, ctx.pollUrl).toString();
    } catch {
      return;
    }
    const m = abs.match(JAHR_RE);
    if (!m) return;
    const y = parseInt(m[1], 10);
    if (y > jahr) {
      jahr = y;
      detailUrl = abs;
    }
  });
  if (!detailUrl) return [];

  // Detailseite folgen (defensiv: 404/Timeout darf den Lauf nicht kippen).
  let html: string;
  try {
    html = await ctx.fetchHtml(detailUrl);
  } catch {
    return [];
  }
  const $: CheerioAPI = ctx.load(html);
  const body = ($("main").text() || $("body").text())
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const datum = findeDatum(body, jahr);

  // Titel: der in Anführungszeichen stehende Gutachten-Titel.
  const tm = body.match(/Gutachten\s+["„“]\s*([^"”“]{5,200}?)\s*["”“]/);
  const quoted = tm ? tm[1].replace(/\s+/g, " ").trim() : null;
  const titel = (quoted ? `Gutachten ${jahr}: ${quoted}` : `Gutachten ${jahr}`).slice(0, 300);

  // Beste PDF: die Gesamt-/Langfassung; Pressemitteilung + (engl.) Executive Summary raus.
  const pdfs: string[] = [];
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, detailUrl!).toString();
    } catch {
      return;
    }
    if (istPdfUrl(abs) && !pdfs.includes(abs)) pdfs.push(abs);
  });

  const nichtNeben = pdfs.filter(
    (u) => !/pressemitteilung|executive|summary|report/i.test(u),
  );
  const gesamt = nichtNeben.find((u) => /gesamtfassung|langfassung/i.test(u));
  const pdf = gesamt ?? nichtNeben[0] ?? detailUrl;

  return [
    {
      url: pdf,
      titel,
      datum,
      typ: ctx.classifyTyp(titel, pdf) ?? "Gutachten",
    },
  ];
}
