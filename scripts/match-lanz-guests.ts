/**
 * match-lanz-guests.ts — Lanz-Gäste gegen den 18-Parlamente-Pool nachziehen.
 *
 * Der ursprüngliche Lanz-Match (discover-lanz.ts → _lib/politician-matcher.ts) filtert
 * auf aktuelle Bundestags-MdB (Wahlperiode 'Bundestag 2025%'). Landtags-/EU-/Ex-Mandats-
 * Gäste fallen damit durch. Dieses Skript nutzt DIESELBE fernsehserien-Scrape-Logik
 * (scrapeLanzEpisodes), matcht die Gast-Namen aber per Voll-Namen-Substring gegen ALLE
 * Politiker:innen aus der DB (18 Parlamente) — konsistent mit match-talkshow-guests.ts /
 * match-fernsehserien-guests.ts.
 *
 * Default = Dry-Run (Report; hebt die NEUEN Nicht-Bundestag-Treffer hervor).
 * Mit --write → schreibt Key "lanz" nach data/talkshow-guests-appearances.json.
 *
 * Run: npx tsx scripts/match-lanz-guests.ts [--pages 1,2,3,4,5] [--write]
 */
import Database from "better-sqlite3";
import fs from "fs";
import { scrapeLanzEpisodes } from "./discover/discover-lanz";

const DB_PATH = "politik.db";
const OUT = "data/talkshow-guests-appearances.json";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const pagesArg = args.includes("--pages") ? args[args.indexOf("--pages") + 1] : "1,2,3,4,5";
const PAGES = pagesArg.split(",").map(Number).filter(Number.isInteger);

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ß/g, "ss");
// Wortgrenzen-Match statt nackter Substring: verhindert "Thomas Reich" ⊂ "Thomas Reichart".
// norm() liefert [a-z0-9 ]; Grenze = Nicht-Alphanumerik oder String-Rand.
const wholeWord = (hay: string, needle: string) =>
  new RegExp(`(?:^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9]|$)`).test(hay);

interface Pol { id: number; first: string; last: string; full: string; party: string; parliaments: string }
function loadPoliticians(db: Database.Database): Pol[] {
  return (db.prepare(`
    SELECT p.id, p.first_name AS first, p.last_name AS last,
           (SELECT m.fraction FROM mandates m WHERE m.politician_id=p.id AND m.fraction IS NOT NULL AND m.fraction!='' ORDER BY m.id DESC LIMIT 1) AS party,
           (SELECT GROUP_CONCAT(DISTINCT pl.label) FROM mandates m JOIN parliament_periods pp ON m.parliament_period_id=pp.id JOIN parliaments pl ON pp.parliament_id=pl.id WHERE m.politician_id=p.id) AS parliaments
      FROM politicians p WHERE p.first_name IS NOT NULL AND p.last_name IS NOT NULL AND LENGTH(p.last_name) >= 4
  `).all() as any[]).map((r) => ({ ...r, full: norm(`${r.first} ${r.last}`) }));
}

(async () => {
  const db = new Database(DB_PATH, { readonly: true });
  const pols = loadPoliticians(db);
  // Ambige Voll-Namen (≥2 Personen gleichen Namens, z.B. zwei "Martin Huber") → nicht raten.
  const nameCount = new Map<string, number>();
  for (const p of pols) nameCount.set(p.full, (nameCount.get(p.full) ?? 0) + 1);
  const ambiguous = new Set([...nameCount].filter(([, n]) => n > 1).map(([k]) => k));
  console.log(`Match-Pool: ${pols.length} Politiker:innen (18 Parlamente) · ${ambiguous.size} ambige Voll-Namen ausgeschlossen\n`);

  console.log(`Scrape Lanz (fernsehserien.de, Seiten ${PAGES.join(",")}) …`);
  const eps = await scrapeLanzEpisodes(PAGES);
  console.log(`${eps.length} Episoden mit Gästen\n`);

  const episodes: Record<string, any> = {};
  const newNonBundestag: { date: string; name: string; party: string | null; parliaments: string | null }[] = [];
  let totalWithGuest = 0, totalMatches = 0;

  for (const ep of eps.sort((a, b) => a.airDateIso.localeCompare(b.airDateIso))) {
    const guestText = ep.guests.map((g) => g.name).join("; ");
    const gtN = norm(guestText);
    const guests = [...new Map(
      pols.filter((p) => !ambiguous.has(p.full) && wholeWord(gtN, p.full))
        .map((p) => [p.id, { politician_id: p.id, name: `${p.first} ${p.last}`, party: p.party || null, parliaments: p.parliaments || null }])
    ).values()];
    episodes[ep.airDateIso] = { zdf_url: ep.zdfUrlGuess, guest_text: guestText, guests };
    if (guests.length) { totalWithGuest++; totalMatches += guests.length; }
    for (const g of guests) {
      const isBundestag = /Bundestag/.test(g.parliaments || "");
      if (!isBundestag) newNonBundestag.push({ date: ep.airDateIso, ...g });
    }
    const tag = guests.map((g) => `${g.name}${/Bundestag/.test(g.parliaments || "") ? "" : ` ⟨${g.parliaments}⟩`}`).join(", ");
    console.log(`  ${ep.airDateIso}  ${tag || "—"}`);
  }
  db.close();

  console.log(`\n── ${eps.length} Folgen · ${totalWithGuest} mit Gast · ${totalMatches} Treffer ──`);
  console.log(`\n★ NEU durch 18-Parlamente-Pool (Nicht-Bundestag, vom period-161-Filter verpasst): ${newNonBundestag.length}`);
  for (const n of newNonBundestag) console.log(`   ${n.date}  ${n.name}  (${n.party}, ${n.parliaments})`);

  if (WRITE) {
    const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};
    existing.lanz = { label: "Markus Lanz", source: "fernsehserien.de (markus-lanz)", episodes };
    fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
    console.log(`\n→ ${OUT} (Key "lanz" geschrieben/aktualisiert)`);
  } else {
    console.log(`\nDry-Run. Mit --write nach ${OUT} speichern.`);
  }
})();
