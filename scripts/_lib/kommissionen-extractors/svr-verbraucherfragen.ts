import type { CheerioAPI } from "cheerio";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * Sachverständigenrat für Verbraucherfragen (SVRV) — berät das BMJ (Verbraucher-
 * schutz); veröffentlicht Gutachten, Stellungnahmen, Policy Briefs, Studien und
 * Pressemitteilungen. Die Website ist ein WordPress-CMS.
 *
 * pollUrl = https://www.svr-verbraucherfragen.de — die Startseite UND die
 * /publikationen/-Liste rendern die eigentliche Publikationsliste per JavaScript
 * (admin-ajax, leerer `shmtheme_publication_filter__result_container` im statischen
 * HTML). Direkte `<a …>.pdf`-Links erscheinen NIRGENDS im ausgelieferten HTML — der
 * Download-Button einer Publikation zeigt auf eine Custom-Post-Type-„publication"-Seite
 * (Slug = z.B. /2026-06-16_stellungnahme_ki-dfa/), die per 301 auf das echte PDF unter
 * /wp-content/uploads/<jahr>/<monat>/<Datei>.pdf weiterleitet.
 *
 * Statischer Weg = die WordPress-REST-API (server-seitig, kein JS, €0):
 *   1) /wp-json/wp/v2/posts  → autoritative Liste mit Titel/Datum/Kategorien.
 *      Publikationen tragen die Kategorie 7 ("Publikation"); reine Meldungen
 *      (Kategorie 5/48 "Aktuelles") haben sie NICHT → so trennen wir Berichte von News.
 *   2) /wp-json/wp/v2/media  → liefert die Direkt-PDF-URLs (source_url, mime_type).
 *   3) Pro Publikations-Post die Detailseite folgen (ctx.fetchHtml, try/catch) und den
 *      Download-Slug aus `a.shmtheme_publication_teaser__download` ziehen. Der Slug ist
 *      identisch zum (klein geschriebenen) PDF-Dateinamen → exakter Join auf die
 *      media-Liste ergibt die DIREKTE PDF-URL (ermöglicht Download + Volltext).
 *      Kein media-Treffer → Fallback auf die redirectende publication-Slug-Seite,
 *      sonst auf die post-Detailseite (beide funktionieren via 301).
 *
 * Filter „nur aktuell": IMMER der neueste Bericht PLUS alle der letzten ~24 Monate
 * (ctx.istKuerzlich). Kein Archiv, keine Nav/Bilder/Mitgliederlisten.
 * Datum = Publikationsdatum des Posts (REST `date`). Typ = ctx.classifyTyp (Stellungnahme/
 * Gutachten/Pressemitteilung greifen; Policy Brief/Studie/Statement sind nicht im
 * Enum → typ=null, das ist korrekt).
 *
 * REST-API weg/umgebaut oder JSON nicht parsebar → return [] (Fallback = Seed aus
 * Watchlist). KEINE erfundenen URLs.
 */

const BASE = "https://www.svr-verbraucherfragen.de";
const POSTS_API = `${BASE}/wp-json/wp/v2/posts?per_page=20&_fields=id,date,link,title,categories`;
const MEDIA_API = `${BASE}/wp-json/wp/v2/media?per_page=80&_fields=source_url,mime_type`;
const KAT_PUBLIKATION = 7; // WordPress-Kategorie "Publikation" (fehlt bei reinen Meldungen)

type WpPost = { id: number; date?: string; link?: string; title?: { rendered?: string }; categories?: number[] };
type WpMedia = { source_url?: string; mime_type?: string };

/** Normalisiert Slug/Dateiname für den exakten Join (publication-Slug == klein geschr. PDF-Name). */
const norm = (s: string): string => s.toLowerCase().replace(/\.pdf$/, "").replace(/[^a-z0-9]/g, "");

/** HTML-Entities aus dem REST-Titel via cheerio dekodieren, trimmen, kappen. */
function decodeTitel(ctx: ExtractCtx, raw: string | null | undefined): string | null {
  if (!raw) return null;
  let txt = raw;
  try {
    txt = ctx.load(`<x>${raw}</x>`)("x").text();
  } catch {
    /* roher Fallback */
  }
  txt = txt.replace(/\s+/g, " ").trim();
  return txt ? txt.slice(0, 300) : null;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  // 1) Publikations-Posts (REST → JSON). Fällt die API aus → [].
  let posts: WpPost[];
  try {
    const parsed = JSON.parse(await ctx.fetchHtml(POSTS_API));
    if (!Array.isArray(parsed)) return [];
    posts = parsed as WpPost[];
  } catch {
    return [];
  }
  const pubs = posts.filter(
    (p) => Array.isArray(p?.categories) && p.categories.includes(KAT_PUBLIKATION) && !!p?.link && !!p?.date,
  );
  if (pubs.length === 0) return [];

  // 2) Direkt-PDF-Index aus der media-API (optional — Fehler → Fallback-URLs).
  const pdfByName = new Map<string, string>();
  try {
    const media = JSON.parse(await ctx.fetchHtml(MEDIA_API));
    if (Array.isArray(media)) {
      for (const m of media as WpMedia[]) {
        if (m?.mime_type !== "application/pdf" || !m?.source_url) continue;
        let basename = "";
        try {
          basename = decodeURIComponent(m.source_url.split("/").pop() || "");
        } catch {
          basename = m.source_url.split("/").pop() || "";
        }
        const key = norm(basename);
        if (key) pdfByName.set(key, m.source_url);
      }
    }
  } catch {
    /* media optional */
  }

  // 3) Fenster: neuester IMMER + alle der letzten 24 Monate. Dedup nach Post-ID.
  const sortiert = pubs
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const auswahl = sortiert.filter((p, i) => i === 0 || ctx.istKuerzlich(String(p.date).slice(0, 10), 24));
  const uniq = Array.from(new Map(auswahl.map((p) => [p.id, p])).values());

  // 4) Pro Publikation Detailseite folgen → Download-Slug → Direkt-PDF (Fallbacks defensiv).
  const out: RohBericht[] = [];
  for (const p of uniq) {
    const datum = String(p.date).slice(0, 10);
    const titel = decodeTitel(ctx, p.title?.rendered);
    let url = p.link as string;
    try {
      const $: CheerioAPI = ctx.load(await ctx.fetchHtml(p.link as string));
      const href = $("a.shmtheme_publication_teaser__download").attr("href");
      if (href) {
        const slug = href.replace(/\/+$/, "").split("/").pop() || "";
        const direkt = pdfByName.get(norm(slug));
        if (direkt) {
          url = direkt;
        } else {
          try {
            url = new URL(href, BASE).toString();
          } catch {
            /* href unbrauchbar → post.link bleibt */
          }
        }
      }
    } catch {
      /* 404/Timeout einer Detailseite darf den Lauf nicht kippen → post.link bleibt */
    }
    out.push({ url, titel, datum, typ: ctx.classifyTyp(titel, url) });
  }

  // dedup nach url (DE/EN-Fassungen sind getrennte PDFs und bleiben beide erhalten)
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
