import type { ExtractCtx, RohBericht } from "./types";

/**
 * Expertenkommission „Kinder- und Jugendschutz in der digitalen Welt"
 * (Prien-Kommission), BMBFSFJ.
 *
 * pollUrl = die dedizierte „Handlungsempfehlungen"-Detailseite auf bmbfsfj.bund.de.
 * Die Seite ist vollständig serverseitig gerendert (kein JS nötig): die echten
 * Dokumente hängen als direkte `/resource/blob/.../*.pdf`-Links im HTML
 * (von genericPdfLinks erkannt). Stand 2026-06-29 sind das die am 24.06.2026
 * vorgelegten Handlungsempfehlungen:
 *   - Volltext-Handlungsempfehlungen (PDF)
 *   - Kurzfassung (PDF)
 *   - Schaubild (PDF) — eine Grafik/Bild, daher ausgefiltert.
 *
 * Datum kommt deterministisch aus dem URL-Slug (20260624…) via ctx.dateFromUrl.
 * Strategie: static-pdf (direkte PDF-Links auf der Detailseite, kein Folgen nötig).
 */
export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $ = ctx.load(await ctx.fetchHtml(ctx.pollUrl));
  const alle = ctx.genericPdfLinks($, ctx.pollUrl);
  if (alle.length === 0) return [];

  // Schaubilder/Grafiken sind Bilder, keine Berichte → raus.
  const berichte = alle.filter((r) => {
    const s = `${r.titel ?? ""} ${r.url}`.toLowerCase();
    return !/schaubild|favicon|logo|grafik/.test(s);
  });
  if (berichte.length === 0) return [];

  // Handlungsempfehlungen werden von classifyTyp nicht erfasst (kein Enum-Keyword);
  // es ist der substanzielle Output der Kommission → als „Bericht" einordnen.
  const typisiert = berichte.map<RohBericht>((r) => ({
    ...r,
    typ: r.typ ?? ctx.classifyTyp(r.titel, r.url) ?? "Bericht",
  }));

  const sortiert = typisiert.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0]; // IMMER behalten
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
