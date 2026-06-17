/**
 * Stichwort-bestätigter Prune der Querschnitt-ZUSATZfelder — KEIN LLM, gratis.
 * Ein Querschnitt-Unterthema (Transparenz/Verwaltung/Finanzen) überlebt als
 * SEKUNDÄRES Feld nur, wenn ein charakteristisches Stichwort wirklich im Text steht.
 * Bezirksbezug bleibt unangetastet (0 % falsch in Ground Truth). Sachfelder unberührt.
 * Einziges-Feld-DS werden nie geprunt (dann ist es das Kernthema).
 *
 *   (default) Dry-Run: Validierung gegen Ground-Truth + DB-weite Drop-Zahlen
 *   --apply   schreibt (mit Backup-Tabelle)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const APPLY = process.argv.includes("--apply");
// Default: nur der validiert-saubere Teil (Transparenz). --alle für Verwaltung+Finanzen dazu (Lexikon noch zu dünn).
const PRUNE_FELDER = process.argv.includes("--alle")
  ? new Set(["Transparenz & Open Data", "Verwaltung & Digitales", "Finanzen & Haushalt"])
  : new Set(["Transparenz & Open Data"]);

// Stichwort-Lexikon: Unterthema -> Regex, das den Kern belegt
const LEX: Record<string, RegExp> = {
  "Informationsfreiheit & Aktenzugang": /informationsfreiheit|\bIFG\b|akteneinsicht|aktenzugang|auskunftsanspruch|herausgabe von (akten|dokument)|veröffentlichungspflicht/i,
  "Open Data & Open Source": /open data|open source|offene daten|datenportal|quelloffen|freie software/i,
  "Vergabe-, Förder- & Verwaltungstransparenz": /transparenzregister|transparenzgesetz|offenleg|lobbyregister|offenlegung der (verträge|vergabe|zuwendung)|auftragsvergabe|vergaberechtlich|korruption/i,
  "Statistik- & Berichtspflichten": /berichtspflicht|statistikpflicht|monitoringbericht|regelmäßige berichterstattung|berichtswesen/i,
  "Bürgerämter & Bürgerdienste": /bürgeräm|bürgeramt|bürgerdienst|terminvergabe|personalausweis|meldebescheinigung|standesamt|bürgerservice/i,
  "Personal & Beschäftigte im öffentlichen Dienst": /personal|beschäftigt|mitarbeiter|stellen(plan|besetzung|aufwuchs)|tarif|besoldung|prämie|dienstkräfte|stellenabbau/i,
  "Verwaltungsmodernisierung & Bürokratieabbau": /verwaltungsmodernisierung|bürokratieabbau|digitalisierungsstrategie|prozessoptimierung|entbürokratisierung|verwaltungsreform/i,
  "E-Government & digitale Verwaltungsleistungen": /e-?government|onlinezugangsgesetz|\bOZG\b|digitale verwaltungsleistung|online-(antrag|dienst|portal|verfahren)|verwaltungsportal/i,
  "IT-Infrastruktur & digitale Souveränität": /it-(infrastruktur|sicherheit|system)|rechenzentrum|\bserver\b|software|digitale souveränität|\bITDZ\b|fachverfahren/i,
  "Datenschutz & Informationssicherheit": /datenschutz|\bDSGVO\b|datensicherheit|informationssicherheit|personenbezogene daten|datenpanne|datenleck|cyber/i,
  "Verwaltungsorganisation & Zuständigkeiten": /zuständigkeit|verwaltungsorganisation|geschäftsverteilung|behördenstruktur|aufgabenübertragung|ressortzuschnitt|verwaltungsverfahren/i,
  "Landeshaushalt & Haushaltsführung": /haushalt|\betat\b|haushaltsmittel|haushaltsplan|nachtragshaushalt|mittelabfluss|haushaltsführung/i,
  "Förderungen, Zuwendungen & Projektfinanzierung": /förder|zuwendung|projektfinanzierung|zuschuss|zuschüsse|fördermittel/i,
  "Steuern & Abgaben": /steuer|\babgabe|grundsteuer|gewerbesteuer/i,
  "Landesbeteiligungen & landeseigene Unternehmen": /landeseigene|landesbeteiligung|beteiligung des landes|\bGmbH\b|\bAG\b|öffentliches unternehmen|kommunale(s)? unternehmen/i,
  "Vergabe, Beschaffung & Vergabekontrolle": /vergabe|beschaffung|ausschreibung|auftragsvergabe|vergabekontrolle/i,
  "Bezirkshaushalte & kommunale Finanzen": /bezirkshaushalt|kommunale finanzen|globalsumme|bezirkliche(s)? budget/i,
};

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: !APPLY });

function arr(j: string | null): string[] { if (!j) return []; try { const v = JSON.parse(j); return Array.isArray(v) ? v : []; } catch { return []; } }

const haystackCache = new Map<string, string>();
function haystack(dbid: string): string {
  if (haystackCache.has(dbid)) return haystackCache.get(dbid)!;
  const a = db.prepare(`SELECT derived_titel, zusammenfassung, kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json FROM berlin_drucksachen_analyses WHERE dbid=?`).get(dbid) as any;
  const parts = [a?.derived_titel ?? "", a?.zusammenfassung ?? "", ...arr(a?.kerninhalt_json), ...arr(a?.kerninhalt_frage_json), ...arr(a?.kerninhalt_antwort_json)];
  const h = parts.join(" \n ");
  haystackCache.set(dbid, h);
  return h;
}

// Felder pro DS
const nFelder = new Map<string, number>();
for (const r of db.prepare(`SELECT dbid, COUNT(*) n FROM berlin_ds_unterthemen GROUP BY dbid`).all() as { dbid: string; n: number }[]) nFelder.set(r.dbid, r.n);

// Entscheidung pro (dbid,feld,unterthema): keep/drop. drop nur wenn Querschnitt-Zusatzfeld + kein Stichwort.
function decideUT(dbid: string, feld: string, ut: string, spezTags: string[]): "keep" | "drop" {
  if (!PRUNE_FELDER.has(feld)) return "keep";
  if ((nFelder.get(dbid) ?? 1) < 2) return "keep"; // einziges Feld = Kernthema
  const rx = LEX[ut];
  if (!rx) return "keep"; // unbekanntes UT nicht anfassen
  const hay = haystack(dbid) + " \n " + spezTags.join(" ");
  return rx.test(hay) ? "keep" : "drop";
}

// ── Validierung gegen Ground Truth ──────────────────────────────────
const gt = fs.readFileSync(path.join(process.cwd(), "scripts/_data/unterthemen-groundtruth.tsv"), "utf-8")
  .split("\n").filter(Boolean).map((l) => { const [dbid, feld, ut, verdict] = l.split("\t"); return { dbid, feld, ut, verdict }; });

const spezByKey = new Map<string, string[]>();
for (const r of db.prepare(`SELECT dbid, feld, spezifische_tags_json FROM berlin_ds_unterthemen`).all() as any[])
  spezByKey.set(`${r.dbid}|${r.feld}`, arr(r.spezifische_tags_json));

let goodDrop = 0, badDrop = 0, keptKorrekt = 0, keptFalsch = 0, keptGrenz = 0, droppedGrenz = 0;
const badDropList: string[] = [], goodDropList: string[] = [];
for (const g of gt) {
  if (!PRUNE_FELDER.has(g.feld)) continue;
  const dec = decideUT(g.dbid, g.feld, g.ut, spezByKey.get(`${g.dbid}|${g.feld}`) ?? []);
  if (dec === "drop") {
    if (g.verdict === "falsch") { goodDrop++; goodDropList.push(`${g.dbid} ${g.feld}⟫${g.ut} [falsch]`); }
    else if (g.verdict === "grenzfall") { droppedGrenz++; goodDropList.push(`${g.dbid} ${g.feld}⟫${g.ut} [grenzfall]`); }
    else { badDrop++; badDropList.push(`${g.dbid} ${g.feld}⟫${g.ut} [KORREKT—fälschlich gedroppt]`); }
  } else {
    if (g.verdict === "korrekt") keptKorrekt++;
    else if (g.verdict === "falsch") keptFalsch++;
    else keptGrenz++;
  }
}

console.log("═".repeat(74));
console.log("VALIDIERUNG gegen Ground Truth (nur Transparenz/Verwaltung/Finanzen als Zusatz)");
console.log("─".repeat(74));
console.log(`GEDROPPT — falsch entfernt:   ${goodDrop}  ✓ (Ziel)`);
console.log(`GEDROPPT — grenzfall entfernt: ${droppedGrenz}  ✓ (ok)`);
console.log(`GEDROPPT — KORREKT entfernt:   ${badDrop}  ✗ (Schaden, minimieren!)`);
console.log(`BEHALTEN — korrekt:           ${keptKorrekt}  ✓`);
console.log(`BEHALTEN — falsch (verpasst): ${keptFalsch}`);
console.log(`BEHALTEN — grenzfall:         ${keptGrenz}`);
if (badDropList.length) { console.log("\n✗ Fälschlich gedroppte KORREKTE:"); for (const b of badDropList) console.log("   " + b); }
console.log("\n✓ Korrekt gedroppte (Beispiele):"); for (const b of goodDropList.slice(0, 12)) console.log("   " + b);

// ── DB-weite Wirkung ────────────────────────────────────────────────
let dropUT = 0, dropRows = 0, totalCrossSekUT = 0;
const allRows = db.prepare(`SELECT dbid, feld, unterthemen_json, spezifische_tags_json FROM berlin_ds_unterthemen WHERE feld IN ('Transparenz & Open Data','Verwaltung & Digitales','Finanzen & Haushalt')`).all() as any[];
const newRows: { dbid: string; feld: string; survivors: string[] }[] = [];
for (const r of allRows) {
  if ((nFelder.get(r.dbid) ?? 1) < 2) continue;
  const uts = arr(r.unterthemen_json); totalCrossSekUT += uts.length;
  const spez = arr(r.spezifische_tags_json);
  const survivors = uts.filter((ut) => decideUT(r.dbid, r.feld, ut, spez) === "keep");
  dropUT += uts.length - survivors.length;
  if (survivors.length === 0) dropRows++;
  if (survivors.length < uts.length) newRows.push({ dbid: r.dbid, feld: r.feld, survivors });
}
console.log("\n" + "═".repeat(74));
console.log("DB-WEITE WIRKUNG");
console.log("─".repeat(74));
console.log(`Querschnitt-Zusatz-Unterthemen gesamt: ${totalCrossSekUT}`);
console.log(`davon gedroppt: ${dropUT} (${(100 * dropUT / totalCrossSekUT).toFixed(0)} %)`);
console.log(`komplett wegfallende (dbid,feld)-Zeilen: ${dropRows}`);
console.log("═".repeat(74));

const SHOW = process.argv.indexOf("--show-dropped");
if (SHOW >= 0) {
  const n = parseInt(process.argv[SHOW + 1], 10) || 25;
  const seed = parseInt(process.argv[SHOW + 2], 10) || 0;
  // gedroppte Zuordnungen, deterministisch gestreut
  const dropped: { dbid: string; feld: string; ut: string }[] = [];
  for (const r of allRows) {
    if ((nFelder.get(r.dbid) ?? 1) < 2) continue;
    const spez = arr(r.spezifische_tags_json);
    for (const ut of arr(r.unterthemen_json)) if (decideUT(r.dbid, r.feld, ut, spez) === "drop") dropped.push({ dbid: r.dbid, feld: r.feld, ut });
  }
  dropped.sort((a, b) => (a.dbid.slice(-2) + a.feld).localeCompare(b.dbid.slice(-2) + b.feld));
  const step = Math.max(1, Math.floor(dropped.length / n));
  console.log(`\n${"▼".repeat(37)}\nGEDROPPTE Zuordnungen — Stichprobe ${n} von ${dropped.length} (Schritt ${step}, seed ${seed}):\n`);
  for (let i = seed; i < dropped.length && (i - seed) / step < n; i += step) {
    const d = dropped[i];
    const a = db.prepare(`SELECT klasse, derived_titel, zusammenfassung FROM berlin_drucksachen_analyses WHERE dbid=?`).get(d.dbid) as any;
    const felder = (db.prepare(`SELECT feld FROM berlin_ds_unterthemen WHERE dbid=?`).all(d.dbid) as any[]).map((x) => x.feld);
    console.log(`✗ DROP ${d.dbid} [${a?.klasse}]  ${d.feld} ⟫ ${d.ut}`);
    console.log(`   alle Felder: ${felder.join(" | ")}`);
    console.log(`   ${(a?.zusammenfassung ?? "").slice(0, 240)}\n`);
  }
  process.exit(0);
}

if (APPLY) {
  console.log("\n--apply: schreibe …");
  db.exec(`DROP TABLE IF EXISTS berlin_ds_unterthemen_prebackup`);
  db.exec(`CREATE TABLE berlin_ds_unterthemen_prebackup AS SELECT * FROM berlin_ds_unterthemen`);
  const upd = db.prepare(`UPDATE berlin_ds_unterthemen SET unterthemen_json=? WHERE dbid=? AND feld=?`);
  const del = db.prepare(`DELETE FROM berlin_ds_unterthemen WHERE dbid=? AND feld=?`);
  const tx = db.transaction(() => {
    for (const r of newRows) {
      if (r.survivors.length === 0) del.run(r.dbid, r.feld);
      else upd.run(JSON.stringify(r.survivors), r.dbid, r.feld);
    }
  });
  tx();
  console.log(`Backup: berlin_ds_unterthemen_prebackup · ${newRows.length} Zeilen geändert/gelöscht.`);
} else {
  console.log("\nDry-Run. Mit --apply schreiben (legt Backup-Tabelle an).");
}
