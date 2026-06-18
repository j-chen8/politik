/**
 * Ebene 3: Pro beantworteter Bürgerfrage ein kurzer, neutraler TL;DR der ANTWORT
 * (1 Satz, scanbar). Modell: Mistral Small (free), Multi-Key-Round-Robin → N× Speed.
 * KEINE Wertung, nur was gesagt wurde. Durchgängig 3. Person / verbinitial.
 *
 * Lauf:  npx tsx scripts/aw-qa-tldr.ts --limit 40     # Pilot (40 gemischte Q&A)
 *        npx tsx scripts/aw-qa-tldr.ts                 # Voll-Lauf (alle offenen)
 *        npx tsx scripts/aw-qa-tldr.ts --print 30      # gespeicherte zeigen
 *        --model <id>   Modell überschreiben (Default mistral-small-2506)
 *        --redo         vorhandene TL;DR überschreiben (z.B. nach Prompt-Fix)
 */
import Database from "better-sqlite3";
import path from "path";
import { MistralPool, runPool } from "./_lib/mistral";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("busy_timeout = 15000");

const argv = process.argv.slice(2);
const LIMIT = argv.includes("--limit") ? parseInt(argv[argv.indexOf("--limit") + 1], 10) : null;
const MODEL = argv.includes("--model") ? argv[argv.indexOf("--model") + 1] : "mistral-small-2506";
const REDO = argv.includes("--redo");

const pool = new MistralPool(280); // ~3,5 Calls/s pro Key → unter Small-Limit (5 RPS)
const CONCURRENCY = pool.size * 5; // genug in-flight, um das Spacing auszufüllen (Latenz ~1,4 s)

db.exec(`
  CREATE TABLE IF NOT EXISTS aw_qa_tldr (
    frage_url TEXT PRIMARY KEY,
    tldr TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const SYSTEM = `Du verdichtest für eine neutrale Politik-Transparenzplattform die Antwort einer/eines Abgeordneten auf eine Bürgerfrage zu einem kurzen, scanbaren TL;DR.

REGELN — strikt:
- Nur was in der Antwort steht. Nichts erfinden, kein Außenwissen, keine Wertung.
- Gib die Kern-Aussage(n) bzw. Position der Antwort wieder.
- STIMME: durchgängig 3. Person, VERBINITIAL — KEINE Ich-Form, kein Vorspann wie „Die Antwort…", „Der/Die Abgeordnete…", „Die SPD…". Beginne direkt mit dem Verb.
  Beispiele: „Befürwortet ein AfD-Verbotsverfahren, sobald die Voraussetzungen erfüllt sind." · „Lehnt das Großprojekt ab und stimmte im Bundestag dagegen."
- LÄNGE — passe sie an die Antwort an:
  • Kurze/einthemige Antwort → EIN Satz (~25 Wörter).
  • Behandelt die Antwort mehrere klar getrennte Punkte/Themen → bis zu DREI sehr kurze Aussagen, je als eigener Satz. Nur die zentralen Punkte, keine Vollständigkeit.
- FLOSKELN WEGLASSEN: keine Begrüßung, kein Dank, keine Entschuldigungen, kein Bezug auf den Fragesteller oder das Datum — nur inhaltliche Aussagen.
- Wenn die Antwort ausweichend ist, keine inhaltliche Position bezieht, nur verweist oder dankt: benenne das knapp — „Verweist auf das Wahlprogramm." · „Bezieht keine klare Position." · „Sagt Prüfung zu."
- Deutsch, sachlich, keine Aufzählungszeichen/Markdown — nur Sätze.`;

async function makeTldr(frage: string, antwort: string): Promise<string> {
  const user = `FRAGE: ${frage}\n\nANTWORT: ${antwort}\n\nTL;DR der Antwort (verbinitial, 3. Person; 1 Satz, bei mehreren klaren Punkten bis zu 3 kurze Sätze):`;
  return (await pool.chat({ model: MODEL, system: SYSTEM, user, maxTokens: 200, temperature: 0.1 })).replace(/\s+/g, " ");
}

const ins = db.prepare(`INSERT INTO aw_qa_tldr (frage_url, tldr, model) VALUES (?,?,?)
  ON CONFLICT(frage_url) DO UPDATE SET tldr=excluded.tldr, model=excluded.model, created_at=datetime('now')`);

async function main() {
  if (argv.includes("--print")) {
    const n = parseInt(argv[argv.indexOf("--print") + 1], 10) || 20;
    const rows = db.prepare(`SELECT q.frage_text, q.antwort_text, r.tldr FROM aw_qa_tldr r JOIN aw_questions q ON q.frage_url=r.frage_url LIMIT ?`).all(n) as any[];
    for (const r of rows) console.log(`\nFRAGE: ${(r.frage_text || "").slice(0, 110)}\nANTWORT: ${(r.antwort_text || "").slice(0, 170)}…\n→ TL;DR: ${r.tldr}`);
    return;
  }

  // Offene beantwortete Q&A (mit Antworttext). --redo: auch vorhandene; --limit: Längen-Mix.
  const where = REDO ? "" : "AND r.frage_url IS NULL";
  const rows = db.prepare(`
    SELECT q.frage_url, q.frage_text, q.antwort_text
    FROM aw_questions q
    LEFT JOIN aw_qa_tldr r ON r.frage_url=q.frage_url
    WHERE q.status='beantwortet' AND q.antwort_text IS NOT NULL AND q.antwort_text<>'' ${where}
    ORDER BY ${LIMIT ? "LENGTH(q.antwort_text) DESC" : "q.frage_url"}
    ${LIMIT ? `LIMIT ${LIMIT * 3}` : ""}
  `).all() as { frage_url: string; frage_text: string | null; antwort_text: string | null }[];

  const work = LIMIT ? rows.filter((_, i) => i % 3 === 0).slice(0, LIMIT) : rows;
  console.log(`TL;DR-${LIMIT ? "Pilot" : "Lauf"}: ${work.length} Q&A · Modell ${MODEL} · ${pool.size} Key(s), Concurrency ${CONCURRENCY}\n`);

  let done = 0, fail = 0;
  await runPool(work, CONCURRENCY, async (r) => {
    try {
      const t = await makeTldr((r.frage_text || "").slice(0, 300), (r.antwort_text || "").slice(0, 1500));
      ins.run(r.frage_url, t, MODEL);
      done++;
      if (LIMIT || done % 250 === 0) console.log(`[${done}/${work.length}] ${t}`);
    } catch (e: any) { fail++; console.log(`  ❌ ${e.message}`); }
  });
  console.log(`\n=== fertig: ${done} TL;DR, ${fail} Fehler (in aw_qa_tldr) ===`);
}
main();
