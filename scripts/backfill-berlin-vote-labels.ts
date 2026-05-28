/**
 * Backfill `vote_label` Spalte in berlin_votes per Regex aus raw_snippet.
 *
 * Hintergrund: Auf der DS-Detail-Page (z.B. 19/1350) erscheinen bis zu 17 Votes
 * mit alle "annahme mehrheitlich", aber ohne sichtbaren Bezug zum jeweiligen
 * Einzelplan / Auflagen-Paket. Info steckt im raw_snippet vor dem Vote-Trigger.
 *
 * Pattern-Hierarchie (erste Treffer gewinnt):
 *   1. Einzelplan NN [– NAME]              "Einzelplan 06 – Justiz und Verbraucherschutz"
 *   2. Auflagen zum Haushalt YYYY/YYYY     "Auflagen-Paket Haushalt 2024/2025"
 *   3. Ermächtigungen + Ersuchen + ...     "Ermächtigungen / Ersuchen / Auflagen"
 *   4. Gesetzesvorlage Drucksache 19/NNNN  "Gesetzesvorlage 19/1851 (Fachausschuss-Empfehlung)"
 *   5. Gesetzesantrag der X-Fraktion       "Gesetzesantrag der AfD-Fraktion"
 *   6. Antrag der X-Fraktion               "Antrag der GRÜNE-Fraktion"
 *   7. Beschlussempfehlung des Hauptaussch "Beschlussempfehlung Hauptausschuss"
 *   8. Fallback                            erste sinnvolle Zeile vor Trigger
 *
 * Run:  npx tsx scripts/backfill-berlin-vote-labels.ts            (Pre-Flight)
 *       npx tsx scripts/backfill-berlin-vote-labels.ts --apply    (UPDATE)
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

// Trigger-Wörter: damit wir wissen, wo der Vote-Aufruf beginnt — Label kommt VOR diesem Punkt.
const TRIGGER_RE = /(?:bitte\s+ich(?:\s+um|\s+(?:Sie|alle))?|Stimmensammlung|wir\s+kommen\s+zur\s+Abstimmung)/i;

// Pattern 1: Einzelplan NN [– NAME] — NAME max 35 chars, endet vor Trigger-Wörtern
const EINZELPLAN_RE = /Einzelplan\s+(\d{1,2})(?:\s*[–-]\s*([A-ZÄÖÜ][^.,;]{2,35}?)\s*[–-]\s*(?=gemäß|zustimmen|empfiehlt|wird|für|ist|im|der|die|nach))?/i;

// Pattern 2: Auflagen zum Haushalt
const AUFLAGEN_RE = /Auflagen(?:\s+zum\s+Haushalt(?:\s+(\d{4}\/\d{4}))?)?/i;

// Pattern 3: Ermächtigungen, Ersuchen ...
const ERMAECHTIGUNGEN_RE = /Ermächtigungen,?\s+Ersuchen/i;

// Pattern 4: Gesetzesvorlage Drucksache 19/NNNN — akzeptiert "auf Drucksache" UND ", Drucksache"
const GESETZESVORLAGE_RE = /Gesetzes(?:antrag|vorlage)\s+(?:der\s+([A-ZÄÖÜa-zäöü]+)-?Fraktion\s+)?(?:auf|,)?\s*Drucksache\s+(\d+\/\d+)/i;

// Pattern 5+6: Antrag der X-Fraktion (oder mehrer Fraktionen)
// Variante A: "Antrag der AfD-Fraktion" / "Antrag der CDU-Fraktion"
const ANTRAG_FRAKTION_A_RE = /\b(Änderungs|Dringliche[rn]?\s+|Entschließungs)?[Aa]ntrag\s+der\s+([A-ZÄÖÜa-zäöü]+)-Fraktion/;
// Variante B: "Antrag der Fraktion Die Linke / Bündnis 90/Die Grünen"
const ANTRAG_FRAKTION_B_RE = /\b(Änderungs|Dringliche[rn]?\s+|Entschließungs)?[Aa]ntrag\s+der\s+Fraktion(?:en)?\s+([A-ZÄÖÜa-zäöü\/\s\d]+?)(?=[\s,]+(?:auf\s+)?Drucksache|\s+vom)/;
// Variante C: Koalitionsfraktionen / Mehr-Fraktionen-Anträge
const ANTRAG_KOALITION_RE = /\b(Änderungs|Dringliche[rn]?\s+|Entschließungs)?[Aa]ntrag\s+der\s+Koalitionsfraktionen/;

// Vermögensgeschäft (Berliner Spezialität) — akzeptiert "Nr. N/JJJJ", "Nummer N/JJJJ", "mit der Nummer N/JJJJ"
const VERMOEGEN_RE = /Vermögensgeschäft(?:s|en?)?\s+(?:mit\s+der\s+)?Nu?(?:mmer|r\.?)\s+(\d+\/\d+)/i;

// Dringlichkeits-Abstimmung (vorgeschaltete Vote über Tagesordnung-Eilbedürftigkeit)
const DRINGLICHKEIT_RE = /dringliche[rn]?\s+Behandlung\s+(?:des|dieses|der)\s+(?:[A-ZÄÖÜa-zäöü]+-)?(?:Antrags?|Beschlussempfehlung)(?:\s+(?:auf|,)?\s*Drucksache\s+(\d+\/\d+))?/i;

// Geschäftsordnung-Antrag (Sitzungsunterbrechung, Verbindung TOPs, Einspruch Ordnungsruf)
const GESCHAEFTSORDNUNG_RE = /(?:Geschäftsordnungsantrag|Sitzungsunterbrechung|Einberufung\s+des\s+Ältestenrats|Verbindung\s+des\s+Tagesordnungspunkt|Einspruch\s+(?:des\s+Abgeordneten[^,.]+\s+)?gegen\s+(?:den\s+)?(?:ersten\s+|zweiten\s+|dritten\s+)?Ordnungsruf)/i;

// Beschlussempfehlung-Antrag-Bezug: "Zu dem Antrag der X-Fraktion (auf|,) Drucksache 19/NNNN empfiehlt"
// Akzeptiert "auf Drucksache" UND "Drucksache" mit Komma davor
const ANTRAG_VIA_EMPFEHLUNG_RE = /(?:Zu\s+dem|Zum)\s+(?:Entschließungs|Änderungs)?[Aa]ntrag\s+der\s+(?:Fraktion(?:en)?\s+)?([A-ZÄÖÜa-zäöü\/\s\d]+?)(?:\s+und\s+der\s+Fraktion\s+[A-ZÄÖÜa-zäöü\/\s\d]+?)?[\s,]+(?:auf\s+)?Drucksache[\s,]+(\d+\/\d+)/i;

// Pattern 7: Beschlussempfehlung des [Ausschussname]
const EMPFEHLUNG_AUSSCHUSS_RE = /Beschlussempfehlung\s+(?:des|der)\s+([A-ZÄÖÜ][^,\n.]{3,60}?(?:ausschuss(?:es)?|Aussch))/i;

// Pattern 8: Personenwahl (Listen, Wahl)
const WAHL_RE = /(?:Wahl|Personenwahl|wählen Sie|Stimmenliste)/i;

// Pattern 9: Misstrauensantrag / Sonstiges Spezial
const MISSTRAUEN_RE = /(?:Misstrauensantrag|Vertrauensfrage|Wahl\s+der\s+Regierenden)/i;

function normalize(s: string): string {
  return s
    .replace(/-\s*\n\s*/g, "")  // PDF-Soft-Hyphen
    .replace(/\s+/g, " ")
    .trim();
}

/** Liefert ALLE Pre-Trigger-Slices im Snippet — meist 1-3.
 *  Snippets enthalten oft Reste der vorherigen Vote am Anfang UND die echte
 *  Vote in der Mitte; deriveLabel pickt das spezifischste Label aus allen Slices. */
function getAllPreTriggers(snippet: string): string[] {
  const re = new RegExp(TRIGGER_RE.source, "gi");
  const slices: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(snippet)) !== null) {
    // Window auf 600 chars erhöht: Berlin-Trigger-Phrasen sind verbose,
    // Antrag-Kontext steht oft 400-500 chars vor dem "bitte ich"-Trigger.
    slices.push(snippet.slice(Math.max(0, m.index - 600), m.index));
  }
  if (slices.length === 0) slices.push(snippet);
  return slices;
}

/** Tier-Skala für Label-Spezifizität — höhere Werte = spezifischer. */
function labelTier(label: string): number {
  if (label.startsWith("Einzelplan") || label.startsWith("Auflagen") || label.startsWith("Ermächtigungen") || label.startsWith("Vermögensgeschäft")) return 4;
  if (label.startsWith("Änderungsantrag") || label.startsWith("Entschließungsantrag") || label.startsWith("Dringlicher")) return 3;
  if (label.startsWith("Antrag") || label.startsWith("Gesetzesvorlage")) return 2;
  if (label.startsWith("Empfehlung") || label.startsWith("Personenwahl")) return 1;
  // Verfahrens-Labels: niedrigster Tier — geben Bürger:innen wenig Info, sind aber besser als NULL
  if (label.startsWith("Geschäftsordnung") || label.startsWith("Dringlichkeit") || label.startsWith("Sitzungsunterbrechung") || label.startsWith("TOP-Verbindung") || label.startsWith("Einspruch")) return 1;
  return 0;
}

function derivLabelFromText(preNorm: string): string | null {
  if (!preNorm) return null;

  // 1. Einzelplan
  const ep = EINZELPLAN_RE.exec(preNorm);
  if (ep) {
    const nr = ep[1].padStart(2, "0");
    const name = ep[2] ? normalize(ep[2]).replace(/\s+gemäß.*$/, "") : "";
    return name ? `Einzelplan ${nr} – ${name}` : `Einzelplan ${nr}`;
  }

  // 2. Auflagen
  const auf = AUFLAGEN_RE.exec(preNorm);
  if (auf) {
    const jahr = auf[1] ? ` (Haushalt ${auf[1]})` : "";
    return `Auflagen-Paket${jahr}`;
  }

  // 3. Ermächtigungen
  if (ERMAECHTIGUNGEN_RE.test(preNorm)) {
    return "Ermächtigungen / Ersuchen / Auflagen";
  }

  // 9. Misstrauen / Wahl Regierende
  if (MISSTRAUEN_RE.test(preNorm)) {
    const m = MISSTRAUEN_RE.exec(preNorm)!;
    return m[0];
  }

  // 4. Gesetzesvorlage
  const gv = GESETZESVORLAGE_RE.exec(preNorm);
  if (gv) {
    const frak = gv[1] ? ` (${gv[1]})` : "";
    return `Gesetzesvorlage ${gv[2]}${frak}`;
  }

  // Vermögensgeschäft
  const vg = VERMOEGEN_RE.exec(preNorm);
  if (vg) {
    return `Vermögensgeschäft Nr. ${vg[1]}`;
  }

  // Dringlichkeit-Abstimmung (oft VOR der inhaltlichen Abstimmung)
  const dr = DRINGLICHKEIT_RE.exec(preNorm);
  if (dr) {
    return dr[1] ? `Dringlichkeit Antrag ${dr[1]}` : "Dringlichkeit-Abstimmung";
  }

  // Geschäftsordnung-Antrag (Verfahren)
  const go = GESCHAEFTSORDNUNG_RE.exec(preNorm);
  if (go) {
    if (/Einspruch.*Ordnungsruf/i.test(go[0])) return "Einspruch gegen Ordnungsruf";
    if (/Sitzungsunterbrechung|Ältestenrats/i.test(go[0])) return "Sitzungsunterbrechung / Ältestenrat";
    if (/Verbindung.*Tagesordnungspunkt/i.test(go[0])) return "TOP-Verbindung (Geschäftsordnung)";
    return "Geschäftsordnungsantrag";
  }

  // Antrag-via-Beschlussempfehlung: "Zu dem Antrag der X-Fraktion auf Drucksache Y empfiehlt der Fachausschuss..."
  const ave = ANTRAG_VIA_EMPFEHLUNG_RE.exec(preNorm);
  if (ave) {
    const rawFrak = normalize(ave[1]);
    // "Koalitionsfraktionen" → "Koalition (CDU+SPD)"; sonst Fraktionsname + " (DS ...)"
    const frakLabel = /^Koalitionsfraktion/i.test(rawFrak)
      ? "Koalition (CDU+SPD)"
      : `${rawFrak.replace(/-?Fraktion(en)?$/i, "")}-Fraktion`;
    return `Antrag ${frakLabel} (DS ${ave[2]})`;
  }

  // 5+6. Antrag der X-Fraktion (Variante A — kurze Form)
  const antA = ANTRAG_FRAKTION_A_RE.exec(preNorm);
  if (antA) {
    const prefix = antA[1] ? (antA[1].startsWith("Änderungs") ? "Änderungsantrag" : antA[1].startsWith("Entschließungs") ? "Entschließungsantrag" : "Dringlicher Antrag") : "Antrag";
    return `${prefix} ${antA[2]}-Fraktion`;
  }

  // 5+6. Variante B — lange Form
  const antB = ANTRAG_FRAKTION_B_RE.exec(preNorm);
  if (antB) {
    const prefix = antB[1] ? (antB[1].startsWith("Änderungs") ? "Änderungsantrag" : antB[1].startsWith("Entschließungs") ? "Entschließungsantrag" : "Dringlicher Antrag") : "Antrag";
    return `${prefix} ${normalize(antB[2])}`;
  }

  // Variante C: Koalitionsantrag
  const antK = ANTRAG_KOALITION_RE.exec(preNorm);
  if (antK) {
    const prefix = antK[1] ? (antK[1].startsWith("Änderungs") ? "Änderungsantrag" : antK[1].startsWith("Entschließungs") ? "Entschließungsantrag" : "Dringlicher Antrag") : "Antrag";
    return `${prefix} Koalition (CDU+SPD)`;
  }

  // 7. Beschlussempfehlung Ausschuss
  const emp = EMPFEHLUNG_AUSSCHUSS_RE.exec(preNorm);
  if (emp) {
    return `Empfehlung ${normalize(emp[1])}`;
  }

  // 8. Personenwahl
  if (WAHL_RE.test(preNorm)) {
    return "Personenwahl / Stimmensammlung";
  }

  return null; // Fallback wird in UI gemacht
}

function deriveLabel(snippet: string | null): string | null {
  if (!snippet) return null;
  const slices = getAllPreTriggers(snippet);
  let best: string | null = null;
  let bestTier = -1;
  for (const slice of slices) {
    const label = derivLabelFromText(normalize(slice));
    if (!label) continue;
    const tier = labelTier(label);
    if (tier > bestTier) {
      bestTier = tier;
      best = label;
    }
  }
  return best;
}

function main() {
  const apply = process.argv.includes("--apply");
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // Migration: Spalte hinzufügen wenn nicht vorhanden
  const cols = (db.prepare("PRAGMA table_info(berlin_votes)").all() as { name: string }[])
    .map((c) => c.name);
  if (!cols.includes("vote_label")) {
    if (apply) {
      console.log("Migration: ALTER TABLE berlin_votes ADD COLUMN vote_label TEXT;");
      db.exec("ALTER TABLE berlin_votes ADD COLUMN vote_label TEXT;");
    } else {
      console.log("⚠ Spalte vote_label fehlt — Migration mit --apply ausführen.");
    }
  }

  const rows = db.prepare(`SELECT vote_id, raw_snippet FROM berlin_votes`).all() as
    Array<{ vote_id: number; raw_snippet: string | null }>;

  console.log(`\n${rows.length} Votes gesamt\n`);

  let n_labeled = 0, n_fallback = 0;
  const patternTally = new Map<string, number>();
  const samples: Array<{ vote_id: number; label: string | null; snippet: string }> = [];

  function patternKey(label: string): string {
    return label.startsWith("Einzelplan") ? "Einzelplan"
      : label.startsWith("Auflagen") ? "Auflagen"
      : label.startsWith("Ermächtigungen") ? "Ermächtigungen"
      : label.startsWith("Gesetzesvorlage") ? "Gesetzesvorlage"
      : label.startsWith("Vermögensgeschäft") ? "Vermögensgeschäft"
      : (label.startsWith("Antrag") || label.startsWith("Änderungsantrag") || label.startsWith("Dringlicher Antrag") || label.startsWith("Entschließungsantrag")) ? "Antrag-Fraktion"
      : label.startsWith("Empfehlung") ? "Empfehlung-Ausschuss"
      : label.startsWith("Personenwahl") ? "Personenwahl"
      : label.startsWith("Dringlichkeit") ? "Dringlichkeit"
      : (label.startsWith("Geschäftsordnung") || label.startsWith("Sitzungsunterbrechung") || label.startsWith("TOP-Verbindung") || label.startsWith("Einspruch")) ? "Geschäftsordnung"
      : "Sonstiges";
  }

  // Erst durch alle Rows iterieren für Stats (gilt für Pre-Flight UND --apply)
  for (const r of rows) {
    const label = deriveLabel(r.raw_snippet);
    if (label) {
      n_labeled++;
      patternTally.set(patternKey(label), (patternTally.get(patternKey(label)) ?? 0) + 1);
    } else {
      n_fallback++;
    }
    if (samples.length < 25 && r.raw_snippet) {
      samples.push({ vote_id: r.vote_id, label, snippet: r.raw_snippet.slice(0, 200) });
    }
  }

  // Apply-Phase: UPDATE in Transaktion (Spalte existiert jetzt nach Migration oben)
  if (apply) {
    const colsNow = (db.prepare("PRAGMA table_info(berlin_votes)").all() as { name: string }[])
      .map((c) => c.name);
    if (colsNow.includes("vote_label")) {
      const update = db.prepare(`UPDATE berlin_votes SET vote_label = ? WHERE vote_id = ?`);
      const tx = db.transaction((rs: typeof rows) => {
        for (const r of rs) {
          update.run(deriveLabel(r.raw_snippet), r.vote_id);
        }
      });
      tx(rows);
      console.log("✓ UPDATE durchgeführt");
    }
  }

  console.log(`Pattern-Match:  ${n_labeled} / ${rows.length} (${((n_labeled/rows.length)*100).toFixed(1)}%)`);
  console.log(`Fallback:       ${n_fallback}`);
  console.log(`\nPattern-Verteilung:`);
  for (const [k, c] of [...patternTally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(22)} ${c.toString().padStart(5)}`);
  }

  console.log(`\n--- 10 Sample-Labels ---`);
  for (const s of samples.slice(0, 10)) {
    console.log(`  v${s.vote_id}: ${s.label ?? "[NULL]"}`);
    console.log(`         > ${s.snippet.replace(/\s+/g, " ").slice(0, 120)}...`);
  }

  console.log(`\n--- Beispiel 19/1350 Votes (derive on-the-fly) ---`);
  const dsRows = db.prepare(`
    SELECT bv.vote_id, bv.outcome, bv.modus, bv.raw_snippet
    FROM berlin_votes bv, json_each(bv.drucksache_nrn_json) j
    WHERE j.value = '19/1350'
    ORDER BY bv.vote_id
  `).all() as { vote_id: number; outcome: string; modus: string | null; raw_snippet: string }[];
  for (const v of dsRows) {
    const label = deriveLabel(v.raw_snippet);
    console.log(`  v${v.vote_id} [${v.outcome}/${v.modus ?? "—"}]: ${label ?? "—"}`);
  }

  db.close();
  console.log(apply ? "\n✓ Done" : "\n  Pre-Flight only. --apply für UPDATE.");
}

main();
