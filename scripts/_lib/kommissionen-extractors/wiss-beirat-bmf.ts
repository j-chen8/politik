import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Wissenschaftlicher Beirat beim Bundesministerium der Finanzen (BMF).
 * www.bundesfinanzministerium.de — Govsite-CMS.
 *
 * STRUKTUR (manuell verifiziert 2026-06-29):
 *   - pollUrl = die Trefferliste „Gutachten und Stellungnahmen". Sie liefert
 *     HTTP 200, ist serverseitig gerendert (kein JS zur Laufzeit nötig).
 *   - Jeder Bericht steht als <li class="bmf-list-entry">:
 *       · Titel  → .bmf-entry-title .bmf-resultlist-teaser-link > span
 *       · Datum  → .bmf-entry-footer time[datetime]  (ISO, z.B. 2026-03-23T09:00)
 *       · PDF    → direkter Download-Link .bmf-link--download mit
 *                  …/<name>.pdf?__blob=publicationFile&v=N  (absolut nach BASE)
 *   - Die Liste ist serverseitig nach Datum absteigend sortiert (neuester oben)
 *     und zeigt auf Seite 1 die laufenden Veröffentlichungen; das Vollarchiv
 *     liegt hinter ?gtp=…_list-Pagination (bewusst NICHT verfolgt → „nur aktuell").
 *
 * STRATEGIE: static-pdf. Direkter PDF-Link je Eintrag, ISO-Datum aus dem
 * time-Element — kein Detailseiten-Hop nötig.
 *
 * TYP: Der Titeltext trägt die Gattung („Gutachten“/„Stellungnahme“/„Brief“).
 * classifyTyp wird NUR mit dem Titel (leere URL) aufgerufen — denn alle PDFs
 * liegen im Verzeichnis …/Wissenschaftlicher-Beirat/Gutachten/, sodass die URL
 * sonst JEDEN Eintrag fälschlich als „Gutachten“ klassifizieren würde. „Brief“-
 * Schreiben matchen keinen Enum-Wert → typ bleibt null (bewusst, nicht interpretiert).
 *
 * Layout geändert / keine Einträge gefunden → return [] (Fallback = Seed-Bericht
 * aus der Watchlist). KEINE erfundenen URLs.
 */

const BASE = "https://www.bundesfinanzministerium.de";

/** ISO-Datetime ('2026-03-23T09:00') → 'YYYY-MM-DD' oder null. */
function isoDay(dt: string | undefined | null): string | null {
  if (!dt) return null;
  const m = dt.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  const roh: RohBericht[] = [];
  const seen = new Set<string>();

  $("li.bmf-list-entry").each((_, li) => {
    const $li = $(li);

    // Direkter PDF-Download-Link des Eintrags.
    let pdf: string | null = null;
    $li.find("a[href]").each((__, a) => {
      if (pdf) return;
      const href = $(a).attr("href");
      if (!href) return;
      let abs: string;
      try {
        abs = new URL(href, BASE).toString();
      } catch {
        return;
      }
      if (/\.pdf(\?|$)/i.test(abs) && /__blob=publicationFile/i.test(abs)) pdf = abs;
    });
    if (!pdf || seen.has(pdf)) return;
    seen.add(pdf);

    const titel =
      ($li.find(".bmf-entry-title .bmf-resultlist-teaser-link span").first().text().trim() ||
        $li.find(".bmf-entry-title").first().text().trim() ||
        null)?.slice(0, 300) ?? null;

    const datum = isoDay($li.find("time[datetime]").first().attr("datetime"));

    // Typ aus dem Titel (nicht der URL — siehe Kopf-Kommentar).
    roh.push({ url: pdf, titel, datum, typ: ctx.classifyTyp(titel, "") });
  });

  if (roh.length === 0) return [];

  // Neuester immer behalten + alle der letzten ~24 Monate. Liste ist bereits
  // datums-absteigend; defensiv trotzdem sortieren.
  const sortiert = roh.sort((a, b) => (b.datum ?? "").localeCompare(a.datum ?? ""));
  const neuester = sortiert[0];
  const aktuell = sortiert.filter((r) => ctx.istKuerzlich(r.datum, 24));
  const out = [neuester, ...aktuell];

  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
