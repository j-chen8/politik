/**
 * Gründlicher Audit der Berliner Sitzungs-Detailseiten: ruft die ECHTE
 * getBerlinSitzungDetail-Logik auf (keine Query-Nachbauten → keine Drift) und
 * listet alle verbleibenden Anzeige-Probleme:
 *   1. Vote-Karten mit generischem/leerem Titel ("Drucksache 19/X", "zu Drucksache…")
 *   2. TOPs mit leerem Titel
 *   3. Anzeigbare TOPs (mit analysierten Reden) OHNE Summary
 */
import Database from "better-sqlite3";
import path from "path";
import { getBerlinSitzungDetail } from "../src/lib/db";

const db = new Database(path.join(process.cwd(), "politik.db"));
const sitzungen = (db.prepare(
  `SELECT DISTINCT sitzung_nr AS nr FROM berlin_speeches WHERE sitzung_nr IS NOT NULL ORDER BY sitzung_nr`,
).all() as { nr: number }[]).map((r) => r.nr);

// Spiegelt die enrichTitle/GENERIC_TITLES-Logik der Page: was würde der User sehen?
const GENERIC = /^(Beschlussempfehlung|Mitteilung|Vorlage|Antrag|Drucksache|Gesetzentwurf)(\s|$)/i;
function badVoteTitle(primaryTitel: string | null): "leer" | "querverweis" | "generisch" | null {
  if (!primaryTitel || !primaryTitel.trim()) return "leer";
  const t = primaryTitel.trim();
  if (/^zu[rm]?\s+Drucksache/i.test(t)) return "querverweis";
  if (/^Drucksache(\s|$)/i.test(t)) return "generisch";
  // „Antrag der Fraktion…" ohne Sachbetreff bleibt generisch; lange „Antrag auf…"-Titel sind ok
  if (GENERIC.test(t) && t.length <= 32) return "generisch";
  return null;
}

const badVotes: string[] = [];
const emptyTops: string[] = [];
const noSummaryTops: string[] = [];

for (const nr of sitzungen) {
  let d;
  try { d = getBerlinSitzungDetail(nr); } catch (e) { console.log(`S${nr}: FEHLER ${(e as Error).message}`); continue; }
  if (!d) continue;

  // 1. Votes (wie die Page: kein_vote raus, primaryDbid != null)
  for (const v of d.votes) {
    if (v.outcome === "kein_vote" || !v.primaryDbid) continue;
    const bad = badVoteTitle(v.primaryTitel);
    if (bad) badVotes.push(`  S${nr} vote ${v.voteId} [${bad}] · label=${v.voteLabel ?? "∅"} · titel=${JSON.stringify(v.primaryTitel)} · nrn=${v.drucksacheNrn.join(",")}`);
  }

  // 2./3. TOPs
  for (const t of d.tops) {
    const hasReden = t.speeches.some((s) => s.zusammenfassung || s.textChars > 50);
    if (!t.titel || !t.titel.trim()) {
      emptyTops.push(`  S${nr} TOP${t.marker} · ${t.redenCount} Reden · DS=${t.drucksachen.map((x) => x.nr).join(",") || "∅"}`);
    }
    const hasSummary = (t.summaryKeyFacts && t.summaryKeyFacts.length > 0) || !!t.summaryLead;
    if (!hasSummary && hasReden && t.titel && t.titel.trim()) {
      noSummaryTops.push(`  S${nr} TOP${t.marker} · ${t.redenCount} Reden · ${t.titel.slice(0, 45)}`);
    }
  }
}

console.log(`\n===== 1. VOTE-KARTEN mit generischem/leerem Titel: ${badVotes.length} =====`);
console.log(badVotes.join("\n") || "  ✓ keine");
console.log(`\n===== 2. TOPs mit LEEREM Titel: ${emptyTops.length} =====`);
console.log(emptyTops.join("\n") || "  ✓ keine");
console.log(`\n===== 3. Anzeigbare TOPs OHNE Summary: ${noSummaryTops.length} =====`);
console.log(noSummaryTops.join("\n") || "  ✓ keine");
db.close();
