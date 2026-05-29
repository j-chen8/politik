/**
 * Produktions-Matcher: ordnet jeder Bundestag-Plenarrede (plenar_speeches,
 * je rede_id) die Mediathek-Video-ID (fvid) zu und schreibt sie + Confidence
 * in die Spalten `mediathek_fvid` / `mediathek_confidence`.
 *
 * Quelle: webtv.bundestag.de/.../news.rss?lastName=X&meetingNumber=Y  (kostenlos,
 *   kein Key). Liefert pro (Redner × Sitzung) alle Beiträge mit fvid + Titel
 *   ("…Merz,  Friedrich (CDU/CSU)…") + "N. Sitzung, TOP: <X>: …".
 *
 * Drei Normalisierungs-Hebel (aus Spike scripts/spike-mediathek-match.ts):
 *   1. TOP-Kanonisierung + Hierarchie ("2" ↔ "2.13" Haushalts-Einzelpläne)
 *   2. Namens-Encoding: Original-Nachname, dann ASCII-gefaltet (Özoğuz→Ozoguz)
 *   3. Vorname-Disambiguierung über den Feed-Titel (gleiche Nachnamen trennen)
 *
 * Confidence: HIGH = 1 Rede ↔ 1 fvid; MEDIUM = N↔N (Zip nach Reihenfolge);
 *   keine Zuordnung wenn Anzahl ≠ oder kein Treffer (fvid bleibt NULL).
 *
 * Aufruf:  npx tsx scripts/match-mediathek-videos.ts [--session N] [--dry]
 */
import Database from "better-sqlite3";
import { parseGermanName, NAME_PARTICLES } from "../src/lib/german-name-parser";

const DB_PATH = "politik.db";
const FEED = "https://webtv.bundestag.de/iptv/player/macros/bttv/news.rss";
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const ONLY = args.includes("--session") ? Number(args[args.indexOf("--session") + 1]) : null;
const THROTTLE_MS = 90;
const CONC = args.includes("--conc") ? Number(args[args.indexOf("--conc") + 1]) : 4;

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toUpperCase();
const asciiFold = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss").replace(/ğ/gi, "g").replace(/ı/g, "i").replace(/ł/gi, "l");

function bareLastName(speaker: string): string {
  const { lastName } = parseGermanName(speaker);
  const parts = lastName.split(/\s+/).filter(Boolean);
  while (parts.length > 1 && NAME_PARTICLES.has(parts[0].toLowerCase())) parts.shift();
  return parts.join(" ");
}
/** Kanonisiert TOP über beide Formate: "Tagesordnungspunkt 9"→"9", "Zusatzpunkt 3"/"ZP 3"→"ZP 3". */
function canonTop(s: string): string {
  return norm(s).replace(/TAGESORDNUNGSPUNKT/g, "").replace(/ZUSATZPUNKT/g, "ZP").replace(/\s+/g, " ").trim();
}
/** Hierarchisch: "2" ↔ "2.13" (Haushaltswoche Einzelpläne). */
function topMatch(db: string, fd: string): boolean {
  return db === fd || fd.startsWith(db + ".") || db.startsWith(fd + ".");
}

interface FeedItem { fvid: string; top: string | null; first: string; last: string; }

function parseFeed(xml: string): FeedItem[] {
  const out: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const fvid = block.match(/fvid\/(\d+)/)?.[1];
    if (!fvid) continue;
    const desc = (block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const top = desc.match(/TOP:\s*([^:]+?):/i)?.[1];
    // Titel: "Redebeitrag von  <Last>,  <First> (<Party>), <Role>"
    const title = (block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const nm = title.match(/von\s+(.+?),\s+([^(,]+?)\s*[(,]/i);
    out.push({ fvid, top: top ? canonTop(top) : null, last: (nm?.[1] ?? "").trim(), first: (nm?.[2] ?? "").trim() });
  }
  return out;
}

async function fetchFeed(lastName: string, sitzung: number): Promise<FeedItem[]> {
  const get = async (ln: string) => {
    const url = `${FEED}?lastName=${encodeURIComponent(ln)}&meetingNumber=${sitzung}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (politik-mediathek-match)" } });
    return res.ok ? parseFeed(await res.text()) : [];
  };
  let items = await get(lastName);
  const folded = asciiFold(lastName);
  if (items.length === 0 && folded !== lastName) { await sleep(THROTTLE_MS); items = await get(folded); }
  return items;
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Rede { redeId: string; speaker: string; first: string; topCanon: string; minId: number; segIds: number[]; }

async function main() {
  const db = new Database(DB_PATH);
  const sessions = (ONLY
    ? db.prepare(`SELECT DISTINCT sitzung FROM plenar_sessions WHERE sitzung = ?`).all(ONLY)
    : db.prepare(`SELECT DISTINCT ps.sitzung FROM plenar_sessions ps
                  JOIN plenar_speeches s ON s.session_id = ps.id ORDER BY ps.sitzung`).all()
  ) as { sitzung: number }[];

  const update = db.prepare(`UPDATE plenar_speeches SET mediathek_fvid = ?, mediathek_confidence = ? WHERE id = ?`);
  let totReden = 0, totHigh = 0, totMed = 0, totLow = 0, totMiss = 0, totReq = 0;

  for (const { sitzung } of sessions) {
    // Echte Reden (distinct rede_id) dieser Sitzung + alle Segment-IDs je rede_id.
    const rows = db.prepare(`
      SELECT s.id, s.rede_id, s.speaker, s.topic_number
      FROM plenar_speeches s JOIN plenar_sessions ps ON ps.id = s.session_id
      WHERE ps.sitzung = ? AND s.rede_id IS NOT NULL AND s.rede_id != ''
      ORDER BY s.speech_index, s.segment_index
    `).all(sitzung) as { id: number; rede_id: string; speaker: string; topic_number: string | null }[];
    if (rows.length === 0) continue;

    const redenMap = new Map<string, Rede>();
    for (const r of rows) {
      let rd = redenMap.get(r.rede_id);
      if (!rd) {
        const { firstName } = parseGermanName(r.speaker);
        rd = { redeId: r.rede_id, speaker: r.speaker, first: firstName, topCanon: canonTop(r.topic_number ?? ""), minId: r.id, segIds: [] };
        redenMap.set(r.rede_id, rd);
      }
      rd.segIds.push(r.id);
      rd.minId = Math.min(rd.minId, r.id);
    }
    const reden = [...redenMap.values()];

    // Feed je distinct bare-lastName ziehen (mehrere Redner teilen ggf. einen).
    const lastByReden = new Map<string, string>();
    for (const rd of reden) lastByReden.set(rd.redeId, bareLastName(rd.speaker));
    const distinctLast = [...new Set([...lastByReden.values()])].filter(Boolean);
    // Parallel mit Concurrency-Cap (Server-TTFB ~2,5s ist der Flaschenhals, nicht
    // Rate-Limit → Nebenläufigkeit hilft enorm; CONC konservativ klein halten).
    const feedByLast = new Map<string, FeedItem[]>();
    for (let i = 0; i < distinctLast.length; i += CONC) {
      const chunk = distinctLast.slice(i, i + CONC);
      const results = await Promise.all(chunk.map((ln) => fetchFeed(ln, sitzung)));
      chunk.forEach((ln, j) => feedByLast.set(ln, results[j]));
      totReq += chunk.length;
    }

    // Pro Redner-IDENTITÄT (Nachname + Vorname) gruppieren — TOP ist nur noch
    // Confidence-Signal, nicht Match-Schlüssel (DB- vs Feed-TOP-Nummern divergieren
    // bei frühen Sitzungen, z.B. DB "4" vs Feed "3").
    const firstUpFold = (s: string) => asciiFold(norm(s));
    const bySpeaker = new Map<string, Rede[]>();
    for (const rd of reden) {
      const k = `${lastByReden.get(rd.redeId)}|${firstUpFold(rd.first)}`;
      (bySpeaker.get(k) ?? bySpeaker.set(k, []).get(k)!).push(rd);
    }

    let sHigh = 0, sMed = 0, sLow = 0, sMiss = 0;
    const assign = (rd: Rede, fvid: string, conf: string) => {
      for (const id of rd.segIds) if (!DRY) update.run(fvid, conf, id);
    };

    for (const [k, grp] of bySpeaker) {
      const [last, me] = k.split("|");
      let feed = feedByLast.get(last) ?? [];
      // Vorname NUR zur Disambiguierung echter Namensvettern (mehrere Vornamen im Feed).
      const feedFirsts = new Set(feed.map((f) => firstUpFold(f.first)).filter(Boolean));
      if (me && feedFirsts.size > 1) {
        const byFirst = feed.filter((f) => { const ff = firstUpFold(f.first); return ff && (ff === me || ff.startsWith(me.slice(0, 3)) || me.startsWith(ff.slice(0, 3))); });
        if (byFirst.length > 0) feed = byFirst;
      }
      grp.sort((a, b) => a.minId - b.minId);
      const usedFvid = new Set<string>();
      const matchedRede = new Set<string>();

      // Pass 1 — TOP-bestätigt (HIGH/MEDIUM): pro DB-TOP gleich viele Reden wie TOP-Treffer.
      const byTop = new Map<string, Rede[]>();
      for (const rd of grp) (byTop.get(rd.topCanon) ?? byTop.set(rd.topCanon, []).get(rd.topCanon)!).push(rd);
      for (const [top, tgrp] of byTop) {
        const fv = feed.filter((f) => f.top && topMatch(top, f.top) && !usedFvid.has(f.fvid))
          .map((f) => Number(f.fvid)).sort((a, b) => a - b).map(String);
        if (fv.length === tgrp.length && fv.length > 0) {
          const conf = tgrp.length === 1 ? "HIGH" : "MEDIUM";
          tgrp.forEach((rd, i) => { assign(rd, fv[i], conf); usedFvid.add(fv[i]); matchedRede.add(rd.redeId); });
          if (conf === "HIGH") sHigh += tgrp.length; else sMed += tgrp.length;
        }
      }

      // Pass 2 — Fallback (LOW): übrige Reden ↔ übrige fvids des Redners, nach
      // Reihenfolge zippen, wenn die Anzahlen übereinstimmen (TOP unbestätigt).
      const restRede = grp.filter((rd) => !matchedRede.has(rd.redeId));
      const restFv = feed.filter((f) => !usedFvid.has(f.fvid)).map((f) => Number(f.fvid)).sort((a, b) => a - b).map(String);
      if (restRede.length > 0 && restRede.length === restFv.length) {
        restRede.forEach((rd, i) => assign(rd, restFv[i], "LOW"));
        sLow += restRede.length;
      } else {
        sMiss += restRede.length;
      }
    }
    totReden += reden.length; totHigh += sHigh; totMed += sMed; totLow += sLow; totMiss += sMiss;
    console.log(`Sitzung ${String(sitzung).padStart(3)}: ${reden.length} Reden | HIGH ${sHigh} MED ${sMed} LOW ${sLow} ohne ${sMiss} | ${distinctLast.length} Abfragen`);
  }
  db.close();

  const matched = totHigh + totMed + totLow;
  console.log(`\n=== GESAMT ===`);
  console.log(`Reden:            ${totReden}`);
  console.log(`Mit Video:        ${matched} (${(100 * matched / totReden).toFixed(1)}%)  [HIGH ${totHigh} / MEDIUM ${totMed} / LOW ${totLow}]`);
  console.log(`Ohne Video:       ${totMiss} (${(100 * totMiss / totReden).toFixed(1)}%)`);
  console.log(`Feed-Abfragen:    ${totReq}${DRY ? "  (DRY-RUN, nichts geschrieben)" : ""}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
