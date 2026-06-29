/**
 * CHECK (Claude Code, deterministisch, KEIN LLM) — Wächter für den Beschlussempfehlungs-Flip.
 *
 * Hintergrund: Stimmt der Bundestag über eine BESCHLUSSEMPFEHLUNG ab, die die ABLEHNUNG
 * eines Antrags empfiehlt, ist die rohe Stimmrichtung gegenläufig zur Sachposition zum
 * Antrag. Diese Fälle MÜSSEN in vote_beschluss_kontext stehen, sonst zeigt die UI fälsch-
 * lich „angenommen" statt „Antrag abgelehnt" (Bug-Klasse, gemeldet an /aktivitaeten/21-6695).
 *
 * Dieser Check liest den Protokoll-Rohtext (raw_snippet) JEDER Abstimmung deterministisch
 * und meldet Lücken — auch bei NEUEN Votes aus künftigen Daten-Refreshes. In den §0-Refresh-
 * Runbooks als Pflicht-Check nach dem Votes-Sync aufgeführt.
 *
 * Check A (FAIL): Snippet belegt eine Antrags-Ablehnungs-Empfehlung für eine im Vote
 *   verlinkte DS, aber der Vote fehlt in vote_beschluss_kontext.
 * Block-Voten (mehrere Antrags-DS in EINER Abstimmung) werden separat als WARN gemeldet,
 *   weil sie eine manuelle Entscheidung über die Mehrfach-Zuordnung brauchen.
 *
 * Bewusst KEIN outcome-Konsistenz-Check: Protokoll-Snippets bündeln mehrere Abstimmungen,
 * daher lässt sich „angenommen/abgelehnt" nicht verlässlich der eigenen Abstimmung zuordnen
 * (zu viele Fehlalarme). Auf geflippten Votes ist outcome zudem display-irrelevant — das
 * Label „Antrag abgelehnt" kommt aus der Flip-Logik, nicht aus dem outcome-Feld.
 *
 * Exit 1, wenn Check A etwas findet (Pipeline-Stopper).
 */
import Database from "better-sqlite3";

const db = new Database("politik.db", { readonly: true });

// DS-Nummer WP-Padding-normalisiert für den Textvergleich (21/0786 -> 21/786).
const norm = (nr: string) => nr.replace(/^(\d+)\/0*(\d+)$/, "$1/$2");

// Extrahiert die Antrags-DS, deren ABLEHNUNG die Beschlussempfehlung empfiehlt.
// Zwei amtliche Formulierungen im Plenarprotokoll:
//   1) „… die Ablehnung des Antrag(e)s/Änderungsantrags … auf Drucksache 21/NNNN …"
//   2) „… den Antrag … auf Drucksache 21/NNNN … abzulehnen"
// Bewusst NUR im Antrags-Kontext (nicht „Beschlussempfehlung … auf Drucksache X" = die BE-DS).
// Negative-Lookahead-Guard `(?:(?!Drucksache)[\s\S])` = „greife die DS, die dem Ablehnungs-
// Wort am NÄCHSTEN steht" — sonst wird fälschlich die voranstehende Beschlussempfehlungs-DS
// gefangen (z.B. „Beschlussempfehlung auf Drucksache 21/1593, den Antrag … 21/786 abzulehnen").
const RE_ABL = /Ablehnung\s+des\s+(?:Änderungs)?[Aa]ntrag(?:es|s|e)?\b(?:(?!Drucksache)[\s\S]){0,140}?Drucksachen?\s+(\d{1,2}\/\d+)/gi;
const RE_ABZ = /Drucksachen?\s+(\d{1,2}\/\d+)(?:(?!Drucksache)[\s\S]){0,120}?abzulehnen/gi;

function extractAblehnungsDs(snippet: string): Set<string> {
  const out = new Set<string>();
  for (const re of [RE_ABL, RE_ABZ]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(snippet)) !== null) out.add(norm(m[1]));
  }
  return out;
}

interface VoteRow {
  vote_id: number;
  drucksache_nrn_json: string | null;
  raw_snippet: string | null;
  outcome: string;
  sitzung_nr: number | null;
}

const votes = db.prepare(`
  SELECT vote_id, drucksache_nrn_json, raw_snippet, outcome, sitzung_nr
  FROM bundestag_votes
  WHERE error_type IS NULL AND outcome != 'kein_vote'
`).all() as VoteRow[];

const mapped = new Map<number, Set<string>>();
for (const r of db.prepare("SELECT vote_id, ds_nr FROM vote_beschluss_kontext WHERE empfiehlt='ablehnen'").all() as { vote_id: number; ds_nr: string }[]) {
  if (!mapped.has(r.vote_id)) mapped.set(r.vote_id, new Set());
  mapped.get(r.vote_id)!.add(norm(r.ds_nr));
}

const missing: { vote_id: number; ds: string[]; sitzung: number | null; snippet: string }[] = [];
const ambiguous: { vote_id: number; ds: string[]; sitzung: number | null }[] = [];

for (const v of votes) {
  const snip = v.raw_snippet || "";
  const jsonDs: string[] = (() => { try { return (JSON.parse(v.drucksache_nrn_json || "[]") as string[]).map(norm); } catch { return []; } })();

  // Antrags-Ablehnungs-Flip belegt, aber nicht gemappt?
  const belegt = extractAblehnungsDs(snip);
  // Nur DS, die (a) im Snippet als abzulehnender Antrag belegt UND (b) im Vote verlinkt sind.
  const flipDs = jsonDs.filter((d) => belegt.has(d));
  if (flipDs.length > 0) {
    const have = mapped.get(v.vote_id) ?? new Set<string>();
    const fehlen = flipDs.filter((d) => !have.has(d));
    if (fehlen.length > 0) {
      // Block-Vote mit mehreren Antrags-DS → manuelle Prüfung (gegenläufige Stimmen je Antrag möglich).
      if (flipDs.length > 1) {
        ambiguous.push({ vote_id: v.vote_id, ds: flipDs, sitzung: v.sitzung_nr });
      } else {
        missing.push({ vote_id: v.vote_id, ds: fehlen, sitzung: v.sitzung_nr, snippet: snip.slice(0, 260) });
      }
    }
  }
}

db.close();

console.log(`Geprüft: ${votes.length} Abstimmungen · vote_beschluss_kontext: ${mapped.size} Votes gemappt.\n`);

let fail = false;

if (missing.length) {
  fail = true;
  console.log(`❌ Check A — ${missing.length} FEHLENDE Beschlussempfehlungs-Flips (Antrag würde fälschlich als „angenommen" angezeigt):`);
  for (const m of missing) {
    console.log(`   vote ${m.vote_id} (Sitzung ${m.sitzung}) → Antrag ${m.ds.join(", ")}`);
    console.log(`     …${m.snippet.replace(/\s+/g, " ").trim()}…`);
  }
  console.log(`   → In scripts/build-vote-beschluss-kontext.ts (FLIP_ABLEHNEN) ergänzen + neu bauen.\n`);
} else {
  console.log("✅ Check A — keine fehlenden Flips (alle belegten Antrags-Ablehnungen sind gemappt).\n");
}

if (ambiguous.length) {
  console.log(`⚠ Block-Voten — ${ambiguous.length} Votes mit MEHREREN Antrags-DS, nicht gemappt (manuell prüfen):`);
  for (const a of ambiguous) console.log(`   vote ${a.vote_id} (Sitzung ${a.sitzung}) → ${a.ds.join(", ")}`);
  console.log("");
}

process.exit(fail ? 1 : 0);
