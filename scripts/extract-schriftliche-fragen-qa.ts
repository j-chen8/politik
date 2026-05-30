/**
 * Extrahiert aus Bundestag-„Schriftliche Fragen"-Sammeldrucksachen die einzelnen
 * Frage→Antwort-Paare DETERMINISTISCH (kein LLM) in `drucksache_qa_paare`.
 *
 * Doc-Struktur (verifiziert an 21/2979):
 *   N. Abgeordnete[r]
 *   <Name (1-3 Zeilen)>
 *   (<Partei>)
 *   <Fragetext>
 *   Antwort des/der <Rolle> <Name>
 *   vom <Datum>
 *   <Antworttext>
 *   … bis zur nächsten „N. Abgeordnete[r]" oder Doc-Ende
 *
 * Aufruf:  npx tsx scripts/extract-schriftliche-fragen-qa.ts [--ds 21/2979] [--write]
 *          ohne --write = Dry-Run (Stats + Samples, kein DB-Schreiben)
 */
import Database from "better-sqlite3";
import { parseGermanName, normalizeName } from "../src/lib/german-name-parser";

const DB = "politik.db";
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ONE_DS = args.includes("--ds") ? args[args.indexOf("--ds") + 1] : null;

const QSTART = /\n(\d{1,3})\.\s+Abgeordnete[r]?\s*\n/g;
// Antwort-Intro: "Antwort des/der <Rolle+Name (ggf. umgebrochen)> vom <Datum>" —
// Steller + Datum sauber abgreifen, damit sie NICHT in den Antworttext leaken.
const ANSWER = /\nAntwort\s+(?:des|der|von)\s+([\s\S]{3,90}?)\s+vom\s+([^\n]{6,45}?)\s*\n/;
// Seiten-Footer / Kopfzeilen, die im Fließtext stören (Footer wandert bei
// Fragen, die über einen Seitenumbruch gehen, mitten in den Text).
function clean(s: string): string {
  let t = s.replace(/-\n/g, "").replace(/\s+/g, " ").trim();
  // Footer strippen — BEIDE Seiten-Layouts. "Drucksache 21/X" NUR entfernen,
  // wenn es direkt am Bundestag-Footer klebt (sonst sind es echte Querverweise!).
  const DG = "[–—-]"; // Gedankenstrich-Varianten
  t = t
    .replace(new RegExp(`(Drucksache\\s*21\\/\\d+\\s*${DG}\\s*\\d+\\s*${DG}\\s*)?Deutscher Bundestag\\s*${DG}\\s*21\\.\\s*Wahlperiode(\\s*${DG}\\s*\\d+(\\s*${DG}\\s*Drucksache\\s*21\\/\\d+)?)?`, "g"), " ")
    .replace(/-{1,2}\s*\d+\s*of\s*\d+\s*-{1,2}/g, " ")
    // PDF-Wasserzeichen vorläufiger Drucksachen (fixer String, nie echter Inhalt;
    // sitzt an Seitenumbrüchen, oft mehrfach, teils mitten im Wort)
    .replace(new RegExp(`Vorabfassung\\s*${DG}\\s*wird durch die lektorierte (?:Version|Fassung) ersetzt\\.?`, "g"), " ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

interface QA { idx: number; name: string; party: string | null; antwortSteller: string | null; antwortDatum: string | null; frage: string; antwort: string; }

function parseDoc(fullText: string): QA[] {
  const out: QA[] = [];
  const marks: { idx: number; pos: number }[] = [];
  let m: RegExpExecArray | null;
  QSTART.lastIndex = 0;
  while ((m = QSTART.exec(fullText))) marks.push({ idx: Number(m[1]), pos: m.index });
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].pos;
    const end = i + 1 < marks.length ? marks[i + 1].pos : fullText.length;
    const block = fullText.slice(start, end);
    // Kopf: Name + Partei vor dem Fragetext
    // Partei kann umgebrochen sein: "(BÜNDNIS 90/\nDIE GRÜNEN)" → Newline in Klammern erlauben.
    const headMatch = block.match(/^\n?\d{1,3}\.\s+Abgeordnete[r]?\s*\n([\s\S]*?)\(([^()]{2,60})\)\s*\n/);
    if (!headMatch) continue;
    const name = headMatch[1].replace(/\s+/g, " ").trim();
    const party = headMatch[2].replace(/\s+/g, " ").trim();
    const afterHead = block.slice(headMatch[0].length + start - start);
    const rest = block.slice(headMatch.index! + headMatch[0].length);
    const aMatch = rest.match(ANSWER);
    let frage: string, antwort: string, antwortSteller: string | null = null, antwortDatum: string | null = null;
    if (aMatch) {
      frage = clean(rest.slice(0, aMatch.index));
      antwortSteller = aMatch[1]?.replace(/\s+/g, " ").trim() ?? null;
      antwortDatum = aMatch[2]?.trim() ?? null;
      antwort = clean(rest.slice(aMatch.index! + aMatch[0].length));
    } else {
      frage = clean(rest);
      antwort = "";
    }
    out.push({ idx: marks[i].idx, name, party, antwortSteller, antwortDatum, frage, antwort });
    void afterHead;
  }
  return out;
}

function main() {
  const db = new Database(DB, { readonly: !WRITE });
  const docs = db.prepare(`
    SELECT DISTINCT dt.drucksache_nr, dt.full_text
    FROM drucksache_texts dt JOIN activities a ON a.drucksache_nr = dt.drucksache_nr
    WHERE a.drucksache_typ = 'Schriftliche Fragen' AND dt.full_text IS NOT NULL
    ${ONE_DS ? "AND dt.drucksache_nr = ?" : ""}
    ORDER BY dt.drucksache_nr
  `).all(...(ONE_DS ? [ONE_DS] : [])) as { drucksache_nr: string; full_text: string }[];

  // Politician-Match-Index (Nachname → Kandidaten)
  const pols = db.prepare(`SELECT id, first_name, last_name FROM politicians`).all() as { id: number; first_name: string; last_name: string }[];
  const byLast = new Map<string, { id: number; first: string }[]>();
  for (const p of pols) {
    const k = normalizeName(p.last_name);
    (byLast.get(k) ?? byLast.set(k, []).get(k)!).push({ id: p.id, first: normalizeName(p.first_name) });
  }
  const matchPol = (name: string): number | null => {
    const { firstName, lastName } = parseGermanName(name);
    const cand = byLast.get(normalizeName(lastName)) ?? [];
    if (cand.length === 1) return cand[0].id;
    const fn = normalizeName(firstName);
    const exact = cand.filter((c) => c.first === fn);
    return exact.length === 1 ? exact[0].id : null;
  };

  let totalPairs = 0, withAnswer = 0, matched = 0, docsDone = 0;
  const ins = WRITE ? db.prepare(`
    INSERT INTO drucksache_qa_paare
      (drucksache_nr, paar_index, fragesteller_name, fragesteller_party, fragesteller_politician_id, antwort_steller, antwort_datum, frage_text, antwort_text, extracted_at)
    VALUES (?,?,?,?,?,?,?,?,?, datetime('now'))
    ON CONFLICT(drucksache_nr, paar_index) DO UPDATE SET
      fragesteller_name=excluded.fragesteller_name, fragesteller_party=excluded.fragesteller_party,
      fragesteller_politician_id=excluded.fragesteller_politician_id, antwort_steller=excluded.antwort_steller,
      antwort_datum=excluded.antwort_datum, frage_text=excluded.frage_text, antwort_text=excluded.antwort_text
  `) : null;

  for (const d of docs) {
    const qas = parseDoc(d.full_text);
    for (const qa of qas) {
      const pid = matchPol(qa.name);
      totalPairs++; if (qa.antwort.length > 20) withAnswer++; if (pid) matched++;
      if (WRITE && ins) ins.run(d.drucksache_nr, qa.idx, qa.name, qa.party, pid, qa.antwortSteller, qa.antwortDatum, qa.frage, qa.antwort);
    }
    docsDone++;
    if (ONE_DS || docs.length <= 3) {
      console.log(`\n=== ${d.drucksache_nr}: ${qas.length} Paare ===`);
      for (const qa of qas.slice(0, 2)) {
        console.log(`  [${qa.idx}] ${qa.name} (${qa.party}) → pid=${matchPol(qa.name) ?? "—"}`);
        console.log(`      FRAGE:   ${qa.frage.slice(0, 120)}`);
        console.log(`      ANTWORT: ${qa.antwort.slice(0, 120)}`);
      }
    }
  }
  db.close();
  console.log(`\n=== GESAMT ===`);
  console.log(`Docs: ${docsDone} | Paare: ${totalPairs} | mit Antwort(>20 Zeichen): ${withAnswer} (${(100*withAnswer/totalPairs||0).toFixed(1)}%) | Fragesteller gematcht: ${matched} (${(100*matched/totalPairs||0).toFixed(1)}%)`);
  console.log(WRITE ? "GESCHRIEBEN." : "DRY-RUN (kein Schreiben).");
}

main();
