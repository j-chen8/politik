/**
 * match-talkshow-guests.ts — ordnet ARD-Talkshow-Folgen ihre Politiker:innen-Gäste zu.
 *
 * Quelle: Episoden-Synopsis der ARD-Mediathek (page-gateway item-Endpoint) — listet die
 * Gäste im Klartext mit Rolle/Partei. Match: Voll-Namen ALLER Politiker:innen aus der DB
 * (alle 18 Parlamente: Bundestag + EU + 16 Landtage) als Substring in die Synopsis →
 * hohe Präzision, kein Fuzzy-Parsing. Ein Gast wird also auch erkannt, wenn er kein
 * aktueller MdB ist (Landtag, Ex-MdB, Minister:in ohne Mandat → Stammdaten-Profil).
 *
 * NUR ARD: ZDF (Lanz/Illner) hat im Beschreibungstext KEINE Gästeliste (nur Themen-Teaser)
 * → dort wären Treffer Falsch-Positive (besprochen ≠ Gast). Lanz nutzt fernsehserien.de.
 *
 * Run: npx tsx scripts/match-talkshow-guests.ts [--show maischberger] [--write]
 *   ohne --write = Dry-Run (Report, kein File).
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = "politik.db";
const ROOT = "data/media-transcripts";
const OUT = "data/talkshow-guests-appearances.json";
const UA = "Mozilla/5.0";

// marker = Beginn der Gästeliste in der Synopsis. NUR danach wird gematcht (davor
// steht das Thema — dort genannte Politiker sind NICHT Gäste → Falsch-Positive).
// hart aber fair hat KEINEN Gäste-Marker (Synopsis = reiner Themen-Text) → 0 Treffer,
// ehrlich: HaF-Gäste sind aus der ARD-Synopsis nicht extrahierbar (bräuchte fernsehserien.de).
const ARD_SHOWS: { key: string; folder: string; label: string; marker: RegExp | null }[] = [
  { key: "maischberger", folder: "maischberger", label: "maischberger", marker: /bei\s+[„"»]?\s*maischberger/i },
  { key: "miosga", folder: "caren_miosga", label: "Caren Miosga", marker: /zu gast/i },
  { key: "hart_aber_fair", folder: "hart_aber_fair", label: "hart aber fair", marker: null },
];

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const showFilter = args.includes("--show") ? args[args.indexOf("--show") + 1] : null;

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ß/g, "ss");
}
// Wortgrenzen-Match statt nackter Substring: "Thomas Reich" darf NICHT in "Thomas Reichart"
// treffen. norm() liefert [a-z0-9 ]; Grenze = Nicht-Alphanumerik oder String-Rand.
function wholeWord(hay: string, needle: string): boolean {
  return new RegExp(`(?:^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9]|$)`).test(hay);
}
function partnerOf(episodeId: string): string {
  // base64(crid://<partner>.de/...) → partner
  try {
    const crid = Buffer.from(episodeId.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    const m = crid.match(/crid:\/\/([a-z0-9]+)\./i);
    return m ? m[1] : "daserste";
  } catch { return "daserste"; }
}

async function fetchSynopsis(partner: string, id: string): Promise<string> {
  const url = `https://api.ardmediathek.de/page-gateway/pages/${partner}/item/${id}?devicetype=pc`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return "";
    const j: any = await r.json();
    return j.widgets?.[0]?.synopsis ?? ""; // NUR synopsis (nicht title → Titel nennt oft das Thema)
  } catch { return ""; }
}

interface Pol { id: number; first: string; last: string; full: string; party: string; parliaments: string }

function loadPoliticians(db: Database.Database): Pol[] {
  const rows = db.prepare(`
    SELECT p.id, p.first_name AS first, p.last_name AS last,
           (SELECT m.fraction FROM mandates m WHERE m.politician_id=p.id
              AND m.fraction IS NOT NULL AND m.fraction!='' ORDER BY m.id DESC LIMIT 1) AS party,
           (SELECT GROUP_CONCAT(DISTINCT pl.label) FROM mandates m
              JOIN parliament_periods pp ON m.parliament_period_id=pp.id
              JOIN parliaments pl ON pp.parliament_id=pl.id
             WHERE m.politician_id=p.id) AS parliaments
      FROM politicians p
     WHERE p.first_name IS NOT NULL AND p.last_name IS NOT NULL AND LENGTH(p.last_name) >= 4
  `).all() as any[];
  return rows.map((r) => ({ ...r, full: norm(`${r.first} ${r.last}`) }));
}

const manifestEpisodes = (folder: string): { iso: string; id: string }[] => {
  const mf = path.join(ROOT, folder, "_manifest.tsv");
  if (!fs.existsSync(mf)) return [];
  const out: { iso: string; id: string }[] = [];
  for (const line of fs.readFileSync(mf, "utf-8").split("\n")) {
    const [date, id] = line.split("\t");
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && id) out.push({ iso: date, id: id.trim() });
  }
  return out;
};

(async () => {
  const db = new Database(DB_PATH, { readonly: true });
  const pols = loadPoliticians(db);
  const nameCount = new Map<string, number>();
  for (const p of pols) nameCount.set(p.full, (nameCount.get(p.full) ?? 0) + 1);
  const ambiguous = new Set([...nameCount].filter(([, n]) => n > 1).map(([k]) => k)); // gleichnamige → nicht raten
  console.log(`Match-Pool: ${pols.length} Politiker:innen (18 Parlamente) · ${ambiguous.size} ambige Voll-Namen ausgeschlossen\n`);

  const shows = ARD_SHOWS.filter((s) => !showFilter || s.key === showFilter);
  const result: any = {};
  let totalEp = 0, totalWithGuest = 0, totalMatches = 0;

  for (const show of shows) {
    const eps = manifestEpisodes(show.folder);
    const episodes: Record<string, any> = {};
    console.log(`=== ${show.label} (${eps.length} Folgen) ===`);
    for (const ep of eps) {
      const syn = await fetchSynopsis(partnerOf(ep.id), ep.id);
      totalEp++;
      if (!syn) { console.log(`  ${ep.iso}  (keine Synopsis)`); continue; }
      // NUR im Gäste-Teil (ab Marker) matchen — davor steht das Thema (Politiker dort ≠ Gast)
      let guestText = "";
      if (show.marker) { const m = syn.match(show.marker); if (m) guestText = syn.slice(m.index); }
      const synN = norm(guestText);
      const guests = pols
        .filter((p) => !ambiguous.has(p.full) && wholeWord(synN, p.full))
        .map((p) => ({ politician_id: p.id, name: `${p.first} ${p.last}`, party: p.party || null, parliaments: p.parliaments || null }));
      // Dedupe gleiche politician_id
      const uniq = [...new Map(guests.map((g) => [g.politician_id, g])).values()];
      episodes[ep.iso] = { id: ep.id, synopsis: syn.slice(0, 500), guests: uniq };
      if (uniq.length) { totalWithGuest++; totalMatches += uniq.length; }
      console.log(`  ${ep.iso}  ${uniq.length ? uniq.map((g) => `${g.name}${g.party ? `/${g.party}` : ""}`).join(", ") : "—"}`);
    }
    result[show.key] = { label: show.label, episodes };
  }
  db.close();

  console.log(`\n── ${totalEp} Folgen · ${totalWithGuest} mit Politiker-Gast · ${totalMatches} Gast-Treffer ──`);
  if (WRITE) {
    const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf-8")) : {};
    fs.writeFileSync(OUT, JSON.stringify({ ...existing, ...result }, null, 2));
    console.log(`→ ${OUT} geschrieben`);
  } else {
    console.log(`Dry-Run. Mit --write speichern.`);
  }
})();
