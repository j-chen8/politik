/**
 * SPIKE (Sample, read-only): Mediathek-Video-IDs für EINE Sitzung gegen
 * plenar_speeches matchen, um Match-Quote + Restfehler zu messen, BEVOR der
 * volle ~7.500-Request-Crawl gebaut wird.
 *
 * Quelle: Legacy-RSS webtv.bundestag.de/.../news.rss?lastName=X&meetingNumber=Y
 *   liefert pro (Redner × Sitzung) alle Beiträge mit fvid + "N. Sitzung, TOP: <X>: …".
 * Kostenlos, kein API-Key. NICHTS wird in die DB geschrieben.
 *
 * Aufruf: npx tsx scripts/spike-mediathek-match.ts [sitzung]   (default 77)
 */
import Database from "better-sqlite3";
import { parseGermanName, NAME_PARTICLES } from "../src/lib/german-name-parser";

const DB_PATH = "politik.db";
const SITZUNG = Number(process.argv[2] ?? 77);
const FEED = "https://webtv.bundestag.de/iptv/player/macros/bttv/news.rss";

/** Feed-Filter erwartet den reinen Nachnamen ohne führende Adelspartikel. */
function feedLastName(speaker: string): string {
  const { lastName } = parseGermanName(speaker);
  const parts = lastName.split(/\s+/).filter(Boolean);
  while (parts.length > 1 && NAME_PARTICLES.has(parts[0].toLowerCase())) parts.shift();
  return parts.join(" ");
}

/** TOP-Token aus "77. Sitzung, TOP: 1: Befragung …" → "1" / "ZP 1" / "Epl 04". */
function parseTop(desc: string): string | null {
  const m = desc.match(/TOP:\s*([^:]+?):/i);
  return m ? canonTop(m[1]) : null;
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();
/** Kanonisiert TOP-Bezeichner über beide Formate: "Tagesordnungspunkt 9"→"9",
 *  "Zusatzpunkt 3"/"ZP 3"→"ZP 3", "9"→"9". */
function canonTop(s: string): string {
  return norm(s)
    .replace(/TAGESORDNUNGSPUNKT/g, "")
    .replace(/ZUSATZPUNKT/g, "ZP")
    .replace(/\s+/g, " ")
    .trim();
}

interface FeedItem { fvid: string; top: string | null; descRaw: string; }

async function fetchFeed(lastName: string): Promise<FeedItem[]> {
  const url = `${FEED}?lastName=${encodeURIComponent(lastName)}&meetingNumber=${SITZUNG}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (politik-spike)" } });
  if (!res.ok) return [];
  const xml = await res.text();
  const items: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let mi: RegExpExecArray | null;
  while ((mi = itemRe.exec(xml))) {
    const block = mi[1];
    const link = block.match(/fvid\/(\d+)/);
    const desc = block.match(/<description>([\s\S]*?)<\/description>/);
    if (!link) continue;
    const descRaw = (desc?.[1] ?? "").replace(/\s+/g, " ").trim();
    items.push({ fvid: link[1], top: parseTop(descRaw), descRaw });
  }
  return items;
}

async function main() {
  const db = new Database(DB_PATH, { readonly: true });
  // Nur ECHTE Reden (distinct rede_id) — Zeilen ohne rede_id sind Zwischenrufe/
  // Kommentare, keine eigenständigen Redebeiträge mit Video.
  const speeches = db.prepare(`
    SELECT MIN(sp.id) AS id, sp.speaker, sp.topic_number, sp.rede_id
    FROM plenar_speeches sp JOIN plenar_sessions ps ON ps.id = sp.session_id
    WHERE ps.sitzung = ? AND sp.rede_id IS NOT NULL AND sp.rede_id != ''
    GROUP BY sp.rede_id
    ORDER BY id
  `).all(SITZUNG) as { id: number; speaker: string; topic_number: string | null; rede_id: string }[];
  db.close();

  // distinct Redner → Feed-Nachname
  const speakers = [...new Set(speeches.map((s) => s.speaker))];
  const lastBySpeaker = new Map<string, string>();
  for (const sp of speakers) lastBySpeaker.set(sp, feedLastName(sp));

  // Feed pro distinct Feed-Nachname holen (mehrere Redner können denselben teilen)
  const distinctLast = [...new Set([...lastBySpeaker.values()])].filter(Boolean);
  console.log(`Sitzung ${SITZUNG}: ${speeches.length} Reden, ${speakers.length} Redner, ${distinctLast.length} Feed-Abfragen`);

  const feedByLast = new Map<string, FeedItem[]>();
  let req = 0;
  for (const last of distinctLast) {
    feedByLast.set(last, await fetchFeed(last));
    if (++req % 25 === 0) process.stdout.write(`  ${req}/${distinctLast.length}\n`);
    await new Promise((r) => setTimeout(r, 120)); // höflich gedrosselt
  }

  // Match auf (Redner-Nachname + TOP)
  let matched = 0, noFeedForSpeaker = 0, feedButNoTop = 0, clean = 0;
  const ambiguous: { speaker: string; top: string; speeches: number; fvids: number }[] = [];
  const grpKey = (s: { speaker: string; topic_number: string | null }) =>
    `${lastBySpeaker.get(s.speaker)}|${canonTop(s.topic_number ?? "")}`;

  // Gruppen aus DB: (Feed-Nachname, TOP) → Reden
  const dbGroups = new Map<string, typeof speeches>();
  for (const s of speeches) {
    const k = grpKey(s);
    (dbGroups.get(k) ?? dbGroups.set(k, []).get(k)!).push(s);
  }

  for (const [k, group] of dbGroups) {
    const [last, top] = k.split("|");
    const feed = feedByLast.get(last) ?? [];
    if (feed.length === 0) { noFeedForSpeaker += group.length; continue; }
    // Hierarchisches TOP-Matching: "2" (DB, Haushaltswoche) ↔ "2.13" (Feed-Einzelplan).
    const topMatch = (db: string, fd: string) =>
      db === fd || fd.startsWith(db + ".") || db.startsWith(fd + ".");
    const fvids = feed.filter((f) => f.top && topMatch(top, f.top)).map((f) => f.fvid);
    if (fvids.length === 0) { feedButNoTop += group.length; continue; }
    matched += group.length;
    // Sauber zuordenbar, wenn #Reden == #fvids (Zip nach Reihenfolge); sonst flaggen.
    if (group.length === fvids.length) clean += group.length;
    else ambiguous.push({ speaker: last, top, speeches: group.length, fvids: fvids.length });
  }

  const total = speeches.length;
  console.log(`\n=== ERGEBNIS Sitzung ${SITZUNG} ===`);
  console.log(`Reden gesamt:                 ${total}`);
  console.log(`Reden mit fvid-Match (TOP):   ${matched} (${(100 * matched / total).toFixed(1)}%)`);
  console.log(`  davon sauber 1:1 (Zip):      ${clean} (${(100 * clean / total).toFixed(1)}%)`);
  console.log(`  davon zu flaggen (#≠#fvids): ${ambiguous.reduce((a, g) => a + g.speeches, 0)} Reden in ${ambiguous.length} (Redner,TOP)-Gruppen`);
  console.log(`Kein Feed für Redner:         ${noFeedForSpeaker}`);
  console.log(`Feed da, aber TOP kein Match: ${feedButNoTop}`);
  console.log(`\nMehrdeutige Top-5 (fvid→Einzelrede nicht eindeutig):`);
  ambiguous.sort((a, b) => b.speeches - a.speeches).slice(0, 5)
    .forEach((g) => console.log(`  ${g.speaker} / TOP ${g.top}: ${g.speeches} Reden, ${g.fvids} fvids`));
}

main().catch((e) => { console.error(e); process.exit(1); });
