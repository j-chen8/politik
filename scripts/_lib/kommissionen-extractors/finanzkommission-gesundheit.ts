import type { CheerioAPI } from "cheerio";
import { parseGermanDate } from "../german-date";
import type { ExtractCtx, RohBericht } from "./types";

/**
 * FinanzKommission Gesundheit (FKG), BMG.
 *
 * pollUrl = die FKG-Übersichtsseite auf bundesgesundheitsministerium.de.
 * Die Seite ist vollständig serverseitig gerendert (kein JS nötig): die echten
 * Dokumente hängen als direkte `/fileadmin/Dateien/3_Downloads/F/FinanzKommission_Gesundheit/*.pdf`-
 * Links im HTML. Strategie: static-pdf (direkte PDF-Links, kein Detail-Folgen nötig).
 *
 * Besonderheit: Die meisten Anker tragen als Linktext nur die Datei-Boilerplate
 * („PDF-Datei (barrierefrei, 6 MB)"). Der aussagekräftige Titel steht teils in
 * einem zweiten Anker auf dieselbe URL („Erster Bericht der FKG …"). Deshalb
 * werden pro URL ALLE Anker eingesammelt und der beste (längste, von Boilerplate
 * befreite) Linktext als Titel gewählt; Fallback = Dateiname.
 *
 * Gefiltert (KEINE Berichte): Besetzungsliste (Mitgliederliste), Arbeitsauftrag
 * (Mandat/Organisatorisches), Infografiken (Grafik/Bild).
 *
 * Stand 2026-06-29 ist der einzige Berichtszyklus der „Erste Bericht" vom
 * 30.03.2026 (samt Management Summary, Pressemitteilung, Anhang) — alle aktuell.
 * Datum: Erster Bericht aus URL-Slug (…20260330…); Pressemitteilung aus dem
 * Linktext („vom 30. März 2026"); begleitende Dokumente ohne Datum bleiben null,
 * werden aber als laufender Zyklus mitgeführt (die Seite hat KEIN Archiv).
 */

// FKG-Download-Verzeichnis: nur Dokumente von hier zählen als Quelldateien.
const FKG_DIR = /\/FinanzKommission_Gesundheit\//i;
// Organisatorisches/Grafik/Mitgliederliste → keine Berichte.
const AUSSCHLUSS = /besetzungsliste|arbeitsauftrag|infografik|mitglieder|tagesordnung|glossar|logo|favicon/i;

/** Linktext von Datei-/Größen-Boilerplate befreien. */
function cleanTitel(raw: string): string {
  return raw
    .replace(/\s*PDF-Datei\b.*$/i, "")               // „… PDF-Datei (barrierefrei, 6 MB)"
    .replace(/\s*\(PDF[^)]*\)\s*/gi, " ")            // „(PDF, barrierefrei, 122 KB)"
    .replace(/\s*\((?:nicht\s+)?barrierefrei[^)]*\)\s*/gi, " ")
    .replace(/\s*zum Download\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Titel aus dem Dateinamen ableiten (Fallback). */
function titelAusUrl(url: string): string {
  try {
    const base = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "")
      .replace(/\.pdf$/i, "")
      .replace(/^\d{6,8}[_-]/, "")   // führendes Datum (250908_ / 20260330_) strippen
      .replace(/[_]+/g, " ")
      .trim();
    return base || "Dokument";
  } catch {
    return "Dokument";
  }
}

/** Deutsches Datum aus Fließtext extrahieren („… vom 30. März 2026 …"). */
function datumAusText(text: string): string | null {
  const m = text.match(/(\d{1,2}\.?\s+[A-Za-zÄÖÜäöü]+\s+20\d{2})/);
  return m ? parseGermanDate(m[1]) : null;
}

export async function extract(ctx: ExtractCtx): Promise<RohBericht[]> {
  const $: CheerioAPI = ctx.load(await ctx.fetchHtml(ctx.pollUrl));

  // Pro URL alle Anker einsammeln (bester Titel + Datum aus bestem Linktext).
  const perUrl = new Map<string, { titel: string; datumText: string | null }>();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    let abs: string;
    try {
      abs = new URL(href, ctx.pollUrl).toString();
    } catch {
      return;
    }
    if (!/\.pdf(\?|$)/i.test(abs)) return;
    if (!FKG_DIR.test(abs)) return;        // nur FKG-Download-Verzeichnis
    if (AUSSCHLUSS.test(abs)) return;      // Besetzungsliste/Arbeitsauftrag/Infografik

    const roh = $(a).text().replace(/\s+/g, " ").trim();
    // Linktext UND title-Attribut bereinigen, den aussagekräftigeren (längeren) nehmen
    // (title ist hier teils nur „zum Download", der Linktext aber beschreibend).
    const tText = cleanTitel(roh);
    const tAttr = cleanTitel($(a).attr("title")?.trim() ?? "");
    const titel = tAttr.length > tText.length ? tAttr : tText;
    const datumText = datumAusText(roh);

    const prev = perUrl.get(abs);
    // Besten (längsten, nicht-leeren) Titel behalten; Datum aus Text übernehmen, falls vorhanden.
    if (!prev) {
      perUrl.set(abs, { titel, datumText });
    } else {
      if (titel.length > prev.titel.length) prev.titel = titel;
      if (!prev.datumText && datumText) prev.datumText = datumText;
    }
  });

  if (perUrl.size === 0) return [];

  // RohBerichte bauen.
  const items: RohBericht[] = [];
  for (const [url, info] of perUrl) {
    const titel = (info.titel || titelAusUrl(url)).slice(0, 300);
    const datum = info.datumText ?? ctx.dateFromUrl(url);
    items.push({ url, titel, datum, typ: ctx.classifyTyp(titel, url) ?? "Bericht" });
  }

  // Sortieren: jüngstes Datum zuerst, datierte vor undatierten.
  const sortiert = items.sort((a, b) => {
    if (!!a.datum !== !!b.datum) return a.datum ? -1 : 1;
    return (b.datum ?? "").localeCompare(a.datum ?? "");
  });

  const neuester = sortiert[0]; // IMMER behalten
  // Aktueller Zyklus signalisiert durch mind. einen Bericht der letzten 24 Monate.
  const hatAktuellen = sortiert.some((r) => ctx.istKuerzlich(r.datum, 24));
  const aktuell = sortiert.filter((r) =>
    r.datum === null ? hatAktuellen : ctx.istKuerzlich(r.datum, 24),
  );

  const out = [neuester, ...aktuell];
  // dedup nach url
  return Array.from(new Map(out.map((r) => [r.url, r])).values());
}
