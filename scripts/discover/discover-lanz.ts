/**
 * Discovery-Scraper: Markus Lanz Episodenliste von fernsehserien.de
 *
 * Crawled die 2025/2026-Saison-Seiten, parst Episoden + Gäste,
 * matched gegen MdB-Liste, schreibt neue Vorschläge nach data/discovery-suggestions.json
 *
 * Usage:
 *   npx tsx scripts/discover/discover-lanz.ts
 *   npx tsx scripts/discover/discover-lanz.ts --pages 1,2,3,4,5
 */

import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { matchPolitician, MatchedPolitician } from "./_lib/politician-matcher";

const BASE_URL = "https://www.fernsehserien.de/markus-lanz/episodenguide/18/21920";
const ZDF_BASE_URL = "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-";

export interface ScrapedEpisode {
  episodeNumber: string;
  airDate: string;        // "20.05.2026"
  airDateIso: string;     // "2026-05-20"
  guests: Array<{ name: string; description: string }>;
  zdfUrlGuess: string;    // sollte zur ZDF Mediathek führen (Verfügbarkeit nicht garantiert)
}

/** Scrapet + dedupliziert die Lanz-Episodenliste (für Wiederverwendung, z.B.
 *  match-lanz-guests.ts mit 18-Parlamente-Matcher statt period-161). */
export async function scrapeLanzEpisodes(pages: number[]): Promise<ScrapedEpisode[]> {
  const all: ScrapedEpisode[] = [];
  for (const page of pages) {
    try {
      all.push(...parseEpisodes(await fetchPage(page)));
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`  Seite ${page} FAILED: ${(e as Error).message}`);
    }
  }
  const seen = new Set<string>();
  return all.filter(e => !seen.has(e.episodeNumber) && seen.add(e.episodeNumber));
}

interface SuggestedAppearance {
  politician_id: number;
  politician_display: string;
  party: string | null;
  episode_number: string;
  air_date: string;
  zdf_url_guess: string;
  other_guests: Array<{ name: string; description: string; matched_mdb_id?: number }>;
}

const args = process.argv.slice(2);
const pagesArg = args.indexOf("--pages") >= 0 ? args[args.indexOf("--pages") + 1] : "1,2,3,4,5";
const PAGES = pagesArg.split(",").map(Number).filter(n => Number.isInteger(n));

async function fetchPage(page: number): Promise<string> {
  const url = page === 1 ? BASE_URL : `${BASE_URL}/${page}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 politik-discovery" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseEpisodes(html: string): ScrapedEpisode[] {
  const $ = cheerio.load(html);
  const episodes: ScrapedEpisode[] = [];

  $("section[itemprop='episode']").each((_, el) => {
    const section = $(el);
    const titleA = section.find("h3.episode-output-titel a span[itemprop='name']").text().trim();
    // Beispiel: "Sendung vom 26.08.2025"
    const dateMatch = titleA.match(/(\d{2})\.(\d{2})\.(20\d{2})/);
    const epNumber = section.find("[itemprop='episodeNumber']").attr("content")
      ?? section.find("[itemprop='episodeNumber']").text().match(/Folge\s+(\d+)/)?.[1];
    const inhaltText = section.find(".episode-output-inhalt-inner").text().trim();
    if (!dateMatch || !epNumber || !inhaltText) return;

    const airDate = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`;
    const airDateIso = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

    // Gäste-Parse aus dem Free-Text:
    // Pattern: "Name Nachname, Funktion ... Er/Sie/Der/Die ... [nächster Name Nachname,]"
    // Wir splitten an "[2+ Wörter Großbuchstaben], "-Mustern
    const guests = parseGuestList(inhaltText);

    if (guests.length === 0) return;

    const dateSlug = `${Number(dateMatch[1])}-${monatNumToWord(Number(dateMatch[2]))}-${dateMatch[3]}`;
    episodes.push({
      episodeNumber: epNumber,
      airDate,
      airDateIso,
      guests,
      zdfUrlGuess: `${ZDF_BASE_URL}${dateSlug}-100`,
    });
  });

  return episodes;
}

/**
 * Parsed Free-Text-Gästeliste à la
 * "Matthias Miersch, SPD-Fraktionschef Er äußert sich zu X. Eva Quadbeck, Journalistin Die Chefredakteurin ..."
 *
 * Heuristik: jeder "Vorname Nachname[,]" am Start eines Satzes der nicht mitten in einem Satz steht.
 */
function parseGuestList(text: string): Array<{ name: string; description: string }> {
  // Strategy: Format ist "Name1, Funktion1 Beschreibung1. Name2, Funktion2 Beschreibung2."
  // Pro Gast: starts mit "Vorname Nachname[, Funktion]" am Satz-Anfang
  // Split-Trigger: ". <Großbuchstabe>" + nachfolgendes ", " im selben Block
  //
  // Vorgehen: scanne Text linear, finde alle Vorkommen von /^|\.\s+|^\s*/[Vorname Nachname], /

  // Wir splitten zuerst nach Sätzen (Punkt + Space + Großbuchstabe als Anker)
  // und sammeln dann nur die Stücke die als Gast-Eröffnung erkennbar sind.
  const guests: Array<{ name: string; description: string }> = [];

  // Pattern: am Anfang oder nach ". " ein "Vorname Nachname, " — capture name
  // Vorname-Nachname: 2-4 großgeschriebene Wörter (Doppelnamen + Adelspartikel)
  const guestStartRegex = /(?:^|\.\s+|\)\s+)([A-ZÄÖÜ][a-zäöüß]+(?:[-\s][A-ZÄÖÜ][a-zäöüß]+){1,3}),\s+/g;
  const matches: Array<{ name: string; startIdx: number; afterCommaIdx: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = guestStartRegex.exec(text)) !== null) {
    matches.push({
      name: m[1].trim(),
      startIdx: m.index + (m[0].length - m[1].length - 2),  // Position des Namens
      afterCommaIdx: m.index + m[0].length,                 // nach "Name, "
    });
  }
  // Pro Gast: description = Text zwischen "afterCommaIdx" und nächstem "startIdx" (oder Ende)
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const desc = (next ? text.slice(cur.afterCommaIdx, next.startIdx) : text.slice(cur.afterCommaIdx))
      .replace(/\(Text:\s*[^)]+\)\s*$/, "")
      .trim();
    if (desc.length < 3) continue;
    guests.push({ name: cur.name, description: desc.slice(0, 300) });
  }
  // Dedupe per Name (manchmal namen doppelt erkannt durch Patterns)
  const seen = new Set<string>();
  return guests.filter(g => seen.has(g.name) ? false : (seen.add(g.name), true));
}

function dateNumToWord(d: number): string {
  return String(d);
}
function monatNumToWord(m: number): string {
  const names = ["", "januar", "februar", "maerz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];
  return names[m] || String(m);
}

async function main() {
  console.log(`Scraping Markus Lanz auf fernsehserien.de · Seiten ${PAGES.join(", ")} ...`);
  const allEpisodes: ScrapedEpisode[] = [];
  for (const page of PAGES) {
    try {
      const html = await fetchPage(page);
      const eps = parseEpisodes(html);
      console.log(`  Seite ${page}: ${eps.length} Episoden mit Gästen gefunden`);
      allEpisodes.push(...eps);
      // Rate-Limit-freundlich
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`  Seite ${page} FAILED: ${(e as Error).message}`);
    }
  }
  console.log(`Total: ${allEpisodes.length} Episoden`);

  // Dedupe per Episode-Number
  const seen = new Set<string>();
  const uniqueEps = allEpisodes.filter(e => !seen.has(e.episodeNumber) && seen.add(e.episodeNumber));

  // Pro Episode: matched MdBs identifizieren
  const suggestions: SuggestedAppearance[] = [];
  for (const ep of uniqueEps) {
    for (const guest of ep.guests) {
      const mdbMatch = matchPolitician(guest.name);
      if (!mdbMatch) continue;
      // Bauen andere Gäste mit ihren optionalen MdB-Matches
      const otherGuests = ep.guests
        .filter(g => g.name !== guest.name)
        .map(g => {
          const m = matchPolitician(g.name);
          return { name: g.name, description: g.description, matched_mdb_id: m?.politician_id };
        });
      suggestions.push({
        politician_id: mdbMatch.politician_id,
        politician_display: mdbMatch.full_name,
        party: mdbMatch.party_label,
        episode_number: ep.episodeNumber,
        air_date: ep.airDateIso,
        zdf_url_guess: ep.zdfUrlGuess,
        other_guests: otherGuests,
      });
    }
  }

  // Index-Auftritte laden zum Diff
  const indexPath = path.join(process.cwd(), "data", "media-appearances.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const existingIds = new Set<string>(index.appearances.map((a: any) => a.id));

  // Discovery-ID-Format: "lastname-lanz-YYYY-MM-DD"
  const newSuggestions = suggestions.filter(s => {
    const slug = s.politician_display.split(" ").pop()!.toLowerCase().replace(/[^a-z]/g, "");
    const id = `${slug}-lanz-${s.air_date}`;
    return !existingIds.has(id);
  });

  // Output
  const outPath = path.join(process.cwd(), "data", "discovery-suggestions.json");
  let existingSuggestions: any = { _meta: { last_scan: null }, suggestions: [] };
  if (fs.existsSync(outPath)) {
    try { existingSuggestions = JSON.parse(fs.readFileSync(outPath, "utf-8")); } catch {}
  }
  // Merge: alte behalten, neue Lanz-Einträge ersetzen
  const nonLanzExisting = (existingSuggestions.suggestions ?? []).filter((s: any) => !s.source?.startsWith("lanz"));
  const merged = {
    _meta: { last_scan: new Date().toISOString(), sources_scanned: ["lanz-fernsehserien"] },
    suggestions: [
      ...nonLanzExisting,
      ...newSuggestions.map(s => ({ ...s, source: "lanz-fernsehserien" })),
    ],
  };
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2));

  console.log(`\n✓ ${suggestions.length} Lanz-MdB-Matches gefunden (${newSuggestions.length} neu, ${suggestions.length - newSuggestions.length} bereits im Index)`);
  console.log(`✓ Output: ${outPath}`);

  if (newSuggestions.length > 0) {
    console.log("\n=== NEUE Vorschläge ===");
    for (const s of newSuggestions.slice(0, 25)) {
      console.log(`  ${s.politician_display.padEnd(25)} (${s.party}) · Lanz #${s.episode_number} vom ${s.air_date}`);
    }
    if (newSuggestions.length > 25) console.log(`  ... + ${newSuggestions.length - 25} weitere`);
  }
}

// Nur als CLI ausführen — nicht beim Import (match-lanz-guests.ts importiert scrapeLanzEpisodes).
if (process.argv[1] && /discover-lanz\.ts$/.test(process.argv[1])) {
  main().catch(e => { console.error("FAILED:", e); process.exit(1); });
}
