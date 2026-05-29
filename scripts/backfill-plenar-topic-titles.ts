/**
 * Backfillt `plenar_topics.title` für leere oder fragmentarische TOP-Titel.
 *
 * Hintergrund: Der ursprüngliche Parser (extract-all-speeches.ts) nahm nur die
 * erste `T_NaS`-Zeile (= Einbringer/Verfahren, OHNE das Thema aus `T_fett`) und
 * fiel sonst auf eine `J`-Zeile zurück → daher Fragmente wie "Wir kommen jetzt
 * zu Tagesordnungspunkt 2:" und leere Titel bei Standard-Punkten (Befragung,
 * Fragestunde, Aktuelle Stunde — deren Titel nur im Inhaltsverzeichnis steht).
 *
 * Titel-Quelle pro TOP (Priorität):
 *  1. `T_fett`-Absätze des <tagesordnungspunkt>-Blocks (das eigentliche Thema)
 *  2. `T_NaS`-Zeile (Einbringer/Verfahren) — besser als leer
 *  3. IVZ: erster Nicht-Redner-`ivz-eintrag-inhalt` nach dem passenden
 *     `ivz-block-titel` ("Tagesordnungspunkt N:" / "Zusatzpunkt N")
 *
 * Konservativ (Berlin-Prinzip): nur LEERE/FRAGMENTARISCHE Titel werden ersetzt,
 * brauchbare bleiben unangetastet. Dry-run by default.
 *
 * Run:
 *   npx tsx scripts/backfill-plenar-topic-titles.ts            (dry-run)
 *   npx tsx scripts/backfill-plenar-topic-titles.ts --write     (schreiben)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const WRITE = process.argv.includes("--write");
const db = new Database(path.join(process.cwd(), "politik.db"));
const XML_DIR = path.join(process.cwd(), "data", "plenarprotokolle_xml");

// Manuell verifizierte Titel für den irrecoverable Long-Tail (Haushalts-
// Sammel-TOPs / Schlussrunden / Einzelplan ohne saubere IVZ-Auflösung).
// Key = "<sitzung>|<topic_number>". Vorrang vor der Heuristik → reproduzierbar.
const KNOWN_TITLES: Record<string, string> = {
  "17|1": "Haushaltsgesetz 2025",
  "18|Einzelplan 06": "Einzelplan 06 – Bundesministerium des Innern",
  "26|Einzelplan 08": "Einzelplan 08 – Bundesministerium der Finanzen (allgemeine Finanzdebatte)",
  "29|1": "Haushaltsgesetz 2026 – Schlussrunde",
  "29|Einzelplan": "Einzelplan 09 – Bundesministerium für Wirtschaft und Energie",
  "44|I": "Haushaltsgesetz 2026",
};

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

/** Ein Titel gilt als unbrauchbar (→ ersetzen), wenn leer oder ein Parser-Fragment. */
function isBadTitle(t: string | null): boolean {
  if (!t || !t.trim()) return true;
  const s = t.trim();
  if (/^(Wir\b|Ich rufe|Damit\b|Interfraktionell|Wir kommen)/i.test(s)) return true;
  if (/^Tagesordnungspunkt\s+\S+\s*:?\s*$/i.test(s)) return true;
  if (/^Zusatzpunkt\s+\S+\s*:?\s*$/i.test(s)) return true;
  return false;
}

/** Titel aus dem <tagesordnungspunkt>-Block: T_fett (Thema) → T_NaS (Verfahren). */
function titleFromTopBlock(content: string): string | null {
  const fetts = [...content.matchAll(/<p\s+klasse="T_fett"[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 0);
  if (fetts.length > 0) {
    // Mehrere T_fett = verbundene TOPs (4a/4b) → mit „ · " trennen, dedupen
    return [...new Set(fetts)].join(" · ");
  }
  const nasM = content.match(/<p\s+klasse="T_NaS"[^>]*>([\s\S]*?)<\/p>/);
  if (nasM) {
    const t = stripTags(nasM[1]).replace(/^[\s\d)a-z]+(–\s*)?/, "").trim();
    if (t.length >= 8) return t;
  }
  return null;
}

/** Titel aus dem Inhaltsverzeichnis (sequentiell, robust gegen verschachtelte
 *  ivz-blocks): finde den ivz-block-titel des TOP, nimm den ersten folgenden
 *  Nicht-Redner-ivz-eintrag-inhalt. */
function titleFromIvz(xml: string, topNumber: string): string | null {
  const zp = topNumber.match(/^ZP\s*(\S+)/i);
  // Label-Kandidaten: numerische TOPs → "Tagesordnungspunkt N"; nicht-numerische
  // (z.B. "Einzelplan 04", "Zur Geschäftsordnung") zusätzlich als Roh-Label,
  // weil die IVZ sie direkt als ivz-block-titel führt.
  const candidates = zp
    ? [`Zusatzpunkt ${zp[1]}`]
    : /^\d/.test(topNumber)
      ? [`Tagesordnungspunkt ${topNumber}`]
      : [`Tagesordnungspunkt ${topNumber}`, topNumber];
  for (const label of candidates) {
    const re = new RegExp(
      `<ivz-block-titel>\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:?\\s*</ivz-block-titel>`,
      "i",
    );
    const m = re.exec(xml);
    if (!m) continue;
    const after = xml.slice(m.index + m[0].length, m.index + m[0].length + 4000);
    const inhMatches = [...after.matchAll(/<ivz-eintrag-inhalt>([\s\S]*?)<\/ivz-eintrag-inhalt>/g)];
    for (const im of inhMatches) {
      if (/<redner/i.test(im[1])) continue; // Redner-Eintrag, kein Titel
      const t = stripTags(im[1]);
      if (t.length >= 6) return t;
    }
  }
  return null;
}

// ── TOPs mit schlechtem Titel sammeln ──────────────────────────
interface Row {
  id: number;
  topic_number: string;
  title: string | null;
  top_id_raw: string | null;
  xml_source: string | null;
  sitzung: number;
}
const rows = db
  .prepare(
    `SELECT pt.id, pt.topic_number, pt.title, pt.top_id_raw, pt.xml_source, s.sitzung
     FROM plenar_topics pt JOIN plenar_sessions s ON s.id = pt.session_id
     ORDER BY s.sitzung, pt.id`,
  )
  .all() as Row[];

const bad = rows.filter((r) => isBadTitle(r.title));
console.log(`\n=== ${bad.length} von ${rows.length} TOPs mit leerem/fragmentarischem Titel ===\n`);

// XML-Cache + tagesordnungspunkt-Block-Cache pro Datei
const xmlCache = new Map<string, string>();
const blockCache = new Map<string, Map<string, string>>();
function loadXml(src: string): string | null {
  if (xmlCache.has(src)) return xmlCache.get(src)!;
  const p = path.join(XML_DIR, src);
  if (!fs.existsSync(p)) return null;
  const x = fs.readFileSync(p, "utf-8");
  xmlCache.set(src, x);
  return x;
}
function topBlocks(src: string, xml: string): Map<string, string> {
  if (blockCache.has(src)) return blockCache.get(src)!;
  const map = new Map<string, string>();
  const re = /<tagesordnungspunkt\s+top-id="([^"]+)">([\s\S]*?)<\/tagesordnungspunkt>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) map.set(m[1], m[2]);
  blockCache.set(src, map);
  return map;
}

const upd = db.prepare(`UPDATE plenar_topics SET title = ? WHERE id = ?`);
let resolved = 0,
  unresolved = 0,
  written = 0;
const txn = db.transaction((items: { id: number; title: string }[]) => {
  for (const it of items) {
    upd.run(it.title, it.id);
    written++;
  }
});
const toWrite: { id: number; title: string }[] = [];

for (const r of bad) {
  if (!r.xml_source) {
    unresolved++;
    continue;
  }
  const xml = loadXml(r.xml_source);
  if (!xml) {
    unresolved++;
    continue;
  }
  let title: string | null = null;
  // 0: manuell verifizierter Titel (Vorrang). topic_number kann ein non-breaking
  // space enthalten (z.B. "Einzelplan 06") → für den Key normalisieren.
  title = KNOWN_TITLES[`${r.sitzung}|${r.topic_number.replace(/ /g, " ")}`] ?? null;
  // 1+2: aus dem TOP-Block (T_fett/T_NaS) — über top_id_raw matchen
  if (!title && r.top_id_raw) {
    const block = topBlocks(r.xml_source, xml).get(r.top_id_raw);
    if (block) title = titleFromTopBlock(block);
  }
  // 3: IVZ (Standard-Punkte + Einzelpläne). Einzelplan-Titel mit Nr-Präfix.
  if (!title) {
    const ivz = titleFromIvz(xml, r.topic_number);
    if (ivz) title = /^Einzelplan/i.test(r.topic_number) ? `${r.topic_number} – ${ivz}` : ivz;
  }

  if (title && !isBadTitle(title)) {
    resolved++;
    toWrite.push({ id: r.id, title });
    if (resolved <= 40)
      console.log(
        `  S${r.sitzung} TOP ${r.topic_number}: [${(r.title ?? "LEER").slice(0, 30)}] → ${title.slice(0, 90)}`,
      );
  } else {
    unresolved++;
    if (unresolved <= 25)
      console.log(`  ⚠ S${r.sitzung} TOP ${r.topic_number}: nicht auflösbar (alt: [${(r.title ?? "LEER").slice(0, 40)}])`);
  }
}

console.log(`\n=== ${resolved} auflösbar, ${unresolved} nicht auflösbar ===`);
if (WRITE) {
  txn(toWrite);
  console.log(`✓ ${written} Titel geschrieben.`);
} else {
  console.log(`DRY-RUN — mit --write schreiben.`);
}
db.close();
