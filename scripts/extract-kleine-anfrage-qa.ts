/**
 * Phase C+: Einzel-Frage→Antwort-Paare aus Kleine/Große-Anfrage-ANTWORT-Docs
 * deterministisch extrahieren (numerierte Unterfragen). Q/A-Split am LETZTEN "?"
 * der Sektion (robust gegen mehrteilige a)/b)/c)-Fragen). Schreibt in
 * drucksache_qa_paare (gleiche Tabelle wie Schriftliche Fragen), fragesteller
 * bleibt leer (KA wird von einer Fraktion gestellt, nicht pro Unterfrage).
 *
 * Aufruf:  npx tsx scripts/extract-kleine-anfrage-qa.ts [--ds 21/4171] [--write]
 */
import Database from "better-sqlite3";

const DB = "politik.db";
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ONE = args.includes("--ds") ? args[args.indexOf("--ds") + 1] : null;

const DG = "[–—-]";
function clean(s: string): string {
  let t = s.replace(/-\n/g, "").replace(/\s+/g, " ").trim();
  t = t
    .replace(new RegExp(`(Drucksache\\s*21\\/\\d+\\s*${DG}\\s*\\d+\\s*${DG}\\s*)?Deutscher Bundestag\\s*${DG}\\s*21\\.\\s*Wahlperiode(\\s*${DG}\\s*\\d+(\\s*${DG}\\s*Drucksache\\s*21\\/\\d+)?)?`, "g"), " ")
    .replace(/-{1,2}\s*\d+\s*of\s*\d+\s*-{1,2}/g, " ")
    .replace(/\s+/g, " ").trim();
  return t;
}

interface QA { idx: number; frage: string; antwort: string; }

function parse(text: string): QA[] {
  const re = /\n(\d{1,3})\.\s+(?=[A-ZÄÖÜ"„])/g;
  const marks: { n: number; pos: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) marks.push({ n: Number(m[1]), pos: m.index });
  // längster aufsteigend-sequenzieller Lauf (1,2,3,…) — verwirft "21. Wahlperiode" etc.
  let best: typeof marks = [];
  for (let i = 0; i < marks.length; i++) {
    const run = [marks[i]];
    for (let j = i + 1; j < marks.length; j++) if (marks[j].n === run[run.length - 1].n + 1) run.push(marks[j]);
    if (run.length > best.length) best = run;
  }
  const out: QA[] = [];
  for (let i = 0; i < best.length; i++) {
    const start = best[i].pos;
    const end = i + 1 < best.length ? best[i + 1].pos : text.length;
    const block = text.slice(start, end).replace(/^\n?\d{1,3}\.\s+/, "");
    // Q/A-Trenner: das LETZTE "?" der Sektion (mehrteilige Fragen a/b/c enden alle mit ?,
    // die Antwort ist danach deklarativ).
    const qEnd = block.lastIndexOf("?");
    if (qEnd >= 0 && qEnd < block.length - 1) {
      out.push({ idx: best[i].n, frage: clean(block.slice(0, qEnd + 1)), antwort: clean(block.slice(qEnd + 1)) });
    } else {
      out.push({ idx: best[i].n, frage: clean(block), antwort: "" });
    }
  }
  return out;
}

function main() {
  const db = new Database(DB, { readonly: !WRITE });
  const docs = db.prepare(`
    SELECT drucksache_nr, full_text FROM drucksache_texts
    WHERE batch_class='antwort' AND referenced_drucksache_nr IS NOT NULL
      AND drucksache_nr LIKE '21/%' AND full_text IS NOT NULL
    ${ONE ? "AND drucksache_nr = ?" : ""}
    ORDER BY drucksache_nr
  `).all(...(ONE ? [ONE] : [])) as { drucksache_nr: string; full_text: string }[];

  const ins = WRITE ? db.prepare(`
    INSERT INTO drucksache_qa_paare (drucksache_nr, paar_index, frage_text, antwort_text, extracted_at)
    VALUES (?,?,?,?, datetime('now'))
    ON CONFLICT(drucksache_nr, paar_index) DO UPDATE SET frage_text=excluded.frage_text, antwort_text=excluded.antwort_text
  `) : null;

  let totDocs = 0, totPairs = 0, withA = 0, noPairs = 0;
  for (const d of docs) {
    const qas = parse(d.full_text);
    if (qas.length === 0) { noPairs++; continue; }
    totDocs++;
    for (const qa of qas) {
      totPairs++; if (qa.antwort.length > 20) withA++;
      if (WRITE && ins) ins.run(d.drucksache_nr, qa.idx, qa.frage, qa.antwort);
    }
    if (ONE || docs.length <= 3) {
      console.log(`\n=== ${d.drucksache_nr}: ${qas.length} Paare ===`);
      for (const qa of qas.slice(0, 3)) {
        console.log(`  [${qa.idx}] F: ${qa.frage.slice(0, 100)}`);
        console.log(`      A: ${qa.antwort.slice(0, 100)}`);
      }
    }
  }
  db.close();
  console.log(`\n=== GESAMT === Docs mit Paaren: ${totDocs} | ohne Paare: ${noPairs} | Paare: ${totPairs} | mit Antwort: ${withA} (${(100*withA/totPairs||0).toFixed(1)}%)`);
  console.log(WRITE ? "GESCHRIEBEN." : "DRY-RUN.");
}
main();
