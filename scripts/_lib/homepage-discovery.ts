/**
 * Homepage-Discovery: findet aus einer Politiker-Homepage die beste „Über mich"/Vita-
 * Unterseite und liefert deren Plain-Text. KEIN LLM — reine Fetch-/Heuristik-Logik.
 *
 * Extrahiert aus dem (deprecateten) seed-cv-homepage.ts, damit der Text-Fetch ohne den
 * alten llama-Pfad wiederverwendbar ist (Bundestag + Berlin).
 */

import { cleanBioHtml } from "./html-clean";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const PER_DOMAIN_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Per-domain rate limit ──
const lastFetchAt = new Map<string, number>();
async function politeFetch(url: string, timeoutMs = 8000): Promise<Response | null> {
  const host = new URL(url).hostname;
  const last = lastFetchAt.get(host) ?? 0;
  const wait = Math.max(0, last + PER_DOMAIN_DELAY_MS - Date.now());
  if (wait > 0) await sleep(wait);
  lastFetchAt.set(host, Date.now());

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ── robots.txt cache ──
const robotsCache = new Map<string, Set<string>>();
async function isAllowed(url: string): Promise<boolean> {
  const host = new URL(url).hostname;
  if (!robotsCache.has(host)) {
    const robotsUrl = `${new URL(url).origin}/robots.txt`;
    const res = await politeFetch(robotsUrl, 4000);
    const disallows = new Set<string>();
    if (res?.ok) {
      const text = await res.text();
      let activeUa = false;
      for (const raw of text.split("\n")) {
        const line = raw.trim().toLowerCase();
        if (line.startsWith("user-agent:")) {
          const ua = line.split(":", 2)[1].trim();
          activeUa = ua === "*" || ua === "mozilla";
        } else if (activeUa && line.startsWith("disallow:")) {
          const p = line.split(":", 2)[1].trim();
          if (p) disallows.add(p);
        }
      }
    }
    robotsCache.set(host, disallows);
  }
  const dis = robotsCache.get(host)!;
  const pathPart = new URL(url).pathname;
  for (const d of dis) {
    if (pathPart.startsWith(d)) return false;
  }
  return true;
}

function htmlToText(html: string): string {
  return cleanBioHtml(html).text;
}

// ── Find best "about" page ──
// Pfad-Liste basierend auf einer Auswertung der bereits erfolgreichen cv_homepage_url.
const ABOUT_PATHS = (() => {
  const stems = [
    "ueber-mich", "uebermich", "uber-mich", "ueber_mich",
    "person", "persoenlich", "persönlich", "persoenliches", "persönliches",
    "lebenslauf", "mein-lebenslauf", "vita", "zur-person",
    "about", "about-me", "biografie", "biographie",
    "steckbrief", "profil", "mein-profil", "wer-bin-ich", "wer-ich-bin",
    "ueber-meine-person", "ueber-mein-person", "uber-meine-person",
    "zu-meiner-person", "zur-meiner-person",
    "über-mich", "ueber",
    "das-bin-ich", "abgeordnete", "abgeordneter",
    "portrait", "porträt", "werdegang", "beruflicher-werdegang",
    "cv", "biografisches", "biografische-angaben", "biographische-angaben",
    "ueber-uns", "über-uns",
    "ueber-mich-1", "lebenslauf-1",
  ];
  const paths: string[] = [];
  for (const s of stems) {
    paths.push(`/${s}/`, `/${s}`);
  }
  return paths;
})();

const ABOUT_KEYWORDS =
  /(?:ueber[_-]?mich|über[_-]?mich|uebermich|übermich|uber[_-]?mich|zur[_-]?person|zu[_-]?meiner[_-]?person|ueber[_-]?meine?[_-]?person|lebenslauf|vita|biogra(?:fie|phie|fisch|phisch)|steckbrief|persönlich|persoenlich|^persoen|^persön|person(?!al)|about[_-]?me|^about$|portrait|porträt|profil|wer[_-]?bin[_-]?ich|wer[_-]?ich[_-]?bin|mein[_-]?weg|werdegang|das[_-]?bin[_-]?ich|abgeordnete[rn]?|^cv$|hintergrund|biografisch|biographisch)/i;

export interface PageHit { url: string; text: string }

function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const re = /<a\s[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const linkText = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!rawHref || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) continue;
    try {
      const abs = new URL(rawHref, baseUrl).href;
      links.push({ href: abs, text: linkText });
    } catch { /* skip invalid URLs */ }
  }
  return links;
}

async function tryFetchAboutPage(url: string): Promise<PageHit | null> {
  if (!(await isAllowed(url))) return null;
  const res = await politeFetch(url);
  if (!res?.ok) return null;
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("text/html")) return null;
  const html = await res.text();
  const text = htmlToText(html);
  if (text.length < 300) return null;
  return { url, text };
}

/** Findet die beste Über-mich/Vita-Unterseite einer Homepage und liefert deren Text. */
export async function findAboutPage(homepageUrl: string): Promise<PageHit | null> {
  let origin: string;
  try { origin = new URL(homepageUrl).origin; }
  catch { return null; }

  let best: PageHit | null = null;

  // Strategy 1: Homepage holen — für Strategy 2 + 5 sowieso nötig.
  const homeRes = await politeFetch(homepageUrl);
  let homeHtml: string | null = null;
  if (homeRes?.ok) {
    const homeCt = homeRes.headers.get("content-type") ?? "";
    if (homeCt.includes("text/html")) homeHtml = await homeRes.text();
  }

  // Strategy 2: Homepage nach about-Keyword-Links scannen (echte Site-Pfade).
  if (homeHtml) {
    const links = extractLinks(homeHtml, homepageUrl);
    const seen = new Set<string>();
    const candidates: string[] = [];
    for (const link of links) {
      let urlPath = "";
      try { urlPath = decodeURIComponent(new URL(link.href).pathname); } catch { continue; }
      if (ABOUT_KEYWORDS.test(urlPath) || ABOUT_KEYWORDS.test(link.text)) {
        if (link.href.startsWith(origin) && !seen.has(link.href)) {
          seen.add(link.href);
          candidates.push(link.href);
        }
      }
    }
    for (const url of candidates.slice(0, 8)) {
      const hit = await tryFetchAboutPage(url);
      if (!hit) continue;
      if (!best || hit.text.length > best.text.length) best = hit;
      if (hit.text.length > 2000) return best;
    }
    if (best) return best;
  }

  // Strategy 3: Standard-Pfade brute-force.
  for (const p of ABOUT_PATHS) {
    const hit = await tryFetchAboutPage(origin + p);
    if (!hit) continue;
    if (!best || hit.text.length > best.text.length) best = hit;
    if (hit.text.length > 2000) return best;
  }
  if (best) return best;

  // Strategy 4: Sitemap.xml.
  for (const sitemapPath of ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"]) {
    const smRes = await politeFetch(origin + sitemapPath, 6000);
    if (!smRes?.ok) continue;
    const smText = await smRes.text();
    const urls: string[] = [];
    const reLoc = /<loc>([^<]+)<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = reLoc.exec(smText)) !== null) {
      const u = m[1].trim();
      try {
        const p = decodeURIComponent(new URL(u).pathname);
        if (ABOUT_KEYWORDS.test(p)) urls.push(u);
      } catch { /* skip */ }
    }
    for (const url of urls.slice(0, 5)) {
      const hit = await tryFetchAboutPage(url);
      if (!hit) continue;
      if (!best || hit.text.length > best.text.length) best = hit;
      if (hit.text.length > 2000) return best;
    }
    if (best) break;
  }
  if (best) return best;

  // Strategy 5: One-Pager-Fallback — Homepage selbst, wenn substanziell.
  if (homeHtml) {
    const homeText = htmlToText(homeHtml);
    if (homeText.length > 800) best = { url: homepageUrl, text: homeText };
  }

  return best;
}
