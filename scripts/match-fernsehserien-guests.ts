/**
 * match-fernsehserien-guests.ts — Gäste-Matching für Shows OHNE Synopsis-Gästeliste
 * (hart aber fair, Illner) via fernsehserien.de.
 *
 * Quelle: die og:description/meta-description der Episodenseite beginnt mit einem
 * SAUBEREN, delimitierten Gästeblock ("Die Gäste: …" bzw. "Gäste: …") — nicht der
 * Themen-Fließtext. Match = Voll-Namen ALLER DB-Politiker:innen (18 Parlamente) NUR im
 * Gästeblock → präzise, FP-arm (Thema steht außerhalb). guest_text wird mitgespeichert.
 * Hinweis: Meta-Description ist gekappt → sehr lange Gästelisten evtl. unvollständig
 * (Recall-, kein Präzisionsproblem).
 *
 * Run: npx tsx scripts/match-fernsehserien-guests.ts [--show hart_aber_fair] [--write]
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = "politik.db";
const ROOT = "data/media-transcripts";
const OUT = "data/talkshow-guests-appearances.json"; // kanonisch (merge mit ARD-synopsis-Shows)
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const SHOWS = [
  { key: "hart_aber_fair", folder: "hart_aber_fair", guide: "https://www.fernsehserien.de/hart-aber-fair/episodenguide", slug: "hart-aber-fair" },
  { key: "illner", folder: "illner", guide: "https://www.fernsehserien.de/maybrit-illner/episodenguide", slug: "maybrit-illner" },
];

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const showFilter = args.includes("--show") ? args[args.indexOf("--show") + 1] : null;

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ß/g, "ss");
const stripTags = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
const isoToDe = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<string> {
  try { const r = await fetch(url, { headers: { "User-Agent": UA } }); return r.ok ? await r.text() : ""; }
  catch { return ""; }
}

interface Pol { id: number; first: string; last: string; full: string; party: string; parliaments: string }
function loadPoliticians(db: Database.Database): Pol[] {
  return (db.prepare(`
    SELECT p.id, p.first_name AS first, p.last_name AS last,
           (SELECT m.fraction FROM mandates m WHERE m.politician_id=p.id AND m.fraction IS NOT NULL AND m.fraction!='' ORDER BY m.id DESC LIMIT 1) AS party,
           (SELECT GROUP_CONCAT(DISTINCT pl.label) FROM mandates m JOIN parliament_periods pp ON m.parliament_period_id=pp.id JOIN parliaments pl ON pp.parliament_id=pl.id WHERE m.politician_id=p.id) AS parliaments
      FROM politicians p WHERE p.first_name IS NOT NULL AND p.last_name IS NOT NULL AND LENGTH(p.last_name) >= 4
  `).all() as any[]).map((r) => ({ ...r, full: norm(`${r.first} ${r.last}`) }));
}

// Datum (DD.MM.YYYY) → Episoden-Detail-URL aus dem Guide-HTML
function parseGuide(html: string, slug: string): Map<string, string> {
  const map = new Map<string, string>();
  const links = [...html.matchAll(new RegExp(`href="(/${slug}/folgen/[^"]+)"`, "g"))].map((m) => ({ pos: m.index!, href: m[1] }));
  const dates = [...html.matchAll(/(\d{2}\.\d{2}\.\d{4})/g)].map((m) => ({ pos: m.index!, de: m[1] }));
  // jedem Link das nächstfolgende Datum zuordnen
  for (const l of links) {
    const d = dates.find((x) => x.pos >= l.pos);
    if (d && !map.has(d.de)) map.set(d.de, l.href);
  }
  return map;
}

// fernsehserien.de meta-description beginnt sauber mit "Die Gäste: <Liste>" —
// strukturierter Delimiter, kein Themen-Fließtext. Genau dort matchen.
function extractGuestText(html: string): string {
  const m = html.match(/<meta (?:property="og:description"|name="description") content="([^"]*)"/i);
  const desc = m ? stripTags(m[1]) : "";
  const g = desc.match(/(?:Die )?Gäste:\s*(.*)$/is) || desc.match(/Zu Gast[^:]*:\s*(.*)$/is);
  return g ? g[1] : ""; // nur der Gäste-Teil; ohne "Gäste:"/"Zu Gast" → kein Gästeblock → leer
}

(async () => {
  const db = new Database(DB_PATH, { readonly: true });
  const pols = loadPoliticians(db);
  const transcriptDates = (folder: string): string[] => {
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).map((f) => f.match(/-(\d{4}-\d{2}-\d{2})\.deu\.vtt$/)?.[1]).filter(Boolean) as string[];
  };

  const shows = SHOWS.filter((s) => !showFilter || s.key === showFilter);
  const result: any = {};
  for (const show of shows) {
    console.log(`\n=== ${show.key} ===`);
    const guideHtml = await get(show.guide);
    const dateMap = parseGuide(guideHtml, show.slug);
    console.log(`Guide: ${dateMap.size} Episoden mit Datum→URL`);
    const dates = transcriptDates(show.folder).sort();
    const episodes: Record<string, any> = {};
    for (const iso of dates) {
      const href = dateMap.get(isoToDe(iso));
      if (!href) { console.log(`  ${iso}  (keine Guide-URL)`); continue; }
      await sleep(600);
      const guestText = extractGuestText(await get(`https://www.fernsehserien.de${href}`));
      const gtN = norm(guestText);
      const guests = [...new Map(pols.filter((p) => gtN.includes(p.full))
        .map((p) => [p.id, { politician_id: p.id, name: `${p.first} ${p.last}`, party: p.party || null, parliaments: p.parliaments || null }])).values()];
      episodes[iso] = { url: `https://www.fernsehserien.de${href}`, guest_text: guestText, guests };
      console.log(`  ${iso}  ${guests.length ? guests.map((g) => g.name).join(", ") : "—"}`);
    }
    result[show.key] = { label: show.key, source: "fernsehserien.de", episodes };
  }
  db.close();

  if (WRITE) {
    const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};
    fs.writeFileSync(OUT, JSON.stringify({ ...existing, ...result }, null, 2));
    console.log(`\n→ ${OUT} (Gäste aus "Gäste:"-Block der fernsehserien.de-Meta)`);
  } else console.log(`\nDry-Run. Mit --write speichern.`);
})();
