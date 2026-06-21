/**
 * Lesbarkeits-Pass über die KOMPAKT-Variante (synthese_kurz_json): die längsten,
 * überladenen Klammer-Bullets entschärfen. Zwei Operationen:
 *   (A) SPLIT  — ein Bullet, der zwei eigenständige Themen mit „und/;" verbindet,
 *                wird in zwei Bullets geteilt (idx-basiert, Coverage geprüft).
 *   (B) SHORTEN — reine Textkürzung eines Bullets (Klammer-Aufzählung gekürzt),
 *                 Refs/Coverage bleiben unverändert.
 *   npx tsx scripts/gold-synthese-readability.ts
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
const FELD = "Wirtschaft";
type B = { text: string; idx: number[] };

// ---------- (A) SPLITS: vollständige neue kurz-Arrays (idx-basiert) ----------
const SPLITS: { aspekt: string; partei: string; kurz: B[] }[] = [
  { aspekt: "Mittelstand & Handwerk", partei: "CDU/CSU", kurz: [
    { text: "Lieferkettengesetz und sonstige Bürokratie/Regulierung (Tariftreuegesetz) mittelstandsfreundlich ausgestalten — KMU und Handwerk nicht überfordern (praxistauglich, Schwellen)", idx: [0,1,2,3,4,13,20,21,24,40,41,43,46,47,51,52,59,74] },
    { text: "Mittelstand, Handwerk und Familienunternehmen als Rückgrat der Wirtschaft (Beschäftigung, Export, Ausbildung) stärken statt belasten", idx: [6,14,18,19,30,31,32,34,37,42,48,56,58,60,63,66,77,78,79] },
    { text: "Erbschaft-/Vermögensteuer gefährdet Familienunternehmen — Verschonung/steuerfreie Weitergabe, gegen Vermögensteuer; Schutz von KMU/Handwerk bei öffentlicher Vergabe (Teil-/Fachlose)", idx: [9,10,12,16,22,23,35,36,49,50,54,55,68,69,70,71,72] },
    { text: "Gezielte Entlastung: Forschungszulage, Stromkosten, Energiesteuer, Gastronomie-MwSt, Kreditvergabe", idx: [5,11,25,28,29,33,44,45,73,75] },
    { text: "Branchenförderung: Stahl, Bürgerenergie, Automobilzulieferer, Gastronomie, Binnenschiff, Wasserstoff, KI", idx: [7,8,15,17,26,27,38,39,53,57,61,62,64,65,67,76] },
  ] },
  { aspekt: "Forschung & Innovation", partei: "SPD", kurz: [
    { text: "Forschungszulage erhöhen (Mittelstand, ZIM)", idx: [1,2,19,37] },
    { text: "Gezielte staatliche Investitionen in Schlüsseltechnologien (18 Mrd. €, KI, Mikroelektronik, Quanten, Halbleiter u.a.)", idx: [0,4,8,9,21,26,27,28,32,33,36] },
    { text: "Forschungsstärke (Weltspitze Patente) in marktfertige Produkte überführen (Reallabore, Transfer); Finanzierung forschungsintensiver Unternehmen, Hochschulforschung; Daten/KI im Mittelstand", idx: [3,11,15,16,17,18,20,22,23,24,25,29,30,31,34,38,39] },
    { text: "Erneuerbare, Klimaneutralität, grüner Stahl und Kreislaufwirtschaft als Innovationsfeld; Forschung zu Frauengesundheit", idx: [5,6,7,10,12,13,14,35] },
  ] },
  { aspekt: "Forschung & Innovation", partei: "CDU/CSU", kurz: [
    { text: "Forschungszulage unbürokratisch ausbauen (Mittelstand); steuerliche/marktwirtschaftliche Anreize statt direkter Förderung, Bürokratieabbau schafft Freiräume (Vermögensteuer gefährdet Innovation)", idx: [0,1,2,3,4,7,8,11,25,47,49] },
    { text: "Entschlossene Investitionen in Schlüsseltechnologien (KI, Quanten, Mikroelektronik, Fusion, Biotech)", idx: [13,14,15,16,20,21,22,24,29,33,36] },
    { text: "Anwendungsfelder: Rohstoff-/Batterierecycling, maritime Technik, Reallabore, Technologie im Land halten", idx: [18,30,31,44,45,46,48,50,51] },
    { text: "Technologieoffenheit und Forschungsfreiheit statt ideologischer Vorgaben (CRISPR, Wasserstoff u.a.)", idx: [5,6,9,10,12,19,23,28,32,34,35,39,40] },
    { text: "Innovationskraft von Unternehmen, Fachkräften und Start-ups; Klimaschutz als Technologievorsprung", idx: [17,41,42,43] },
    { text: "Datenzugang und Forschungsdatengesetze für Innovation; weniger restriktive Auflagen", idx: [26,27,37,38] },
  ] },
];

// ---------- (B) SHORTENS: Text an Position [i] ersetzen, Refs unverändert ----------
const SHORTEN: { aspekt: string; partei: string; i: number; text: string }[] = [
  { aspekt: "Start-up-Förderung", partei: "CDU/CSU", i: 0,
    text: "Kapitalzugang und Wagniskapital für Start-ups/Scale-ups verbessern (Venture Capital, Börsengänge u.a.); Standortfördergesetz mit Steuerentlastungen und schlanken Verfahren" },
  { aspekt: "Rolle des Staates / Wirtschaftsordnung", partei: "SPD", i: 0,
    text: "Handlungsfähiger, aktiver Staat als Partner mit investierender Finanzpolitik (Sondervermögen) und aktiver Industriepolitik (EU-Strategie, Stahl, Rohstoffe u.a.); Eingriff bei Marktversagen" },
  { aspekt: "Unternehmenssteuern", partei: "GRÜNE", i: 1,
    text: "Für progressive Besteuerung (Kapital höher als Arbeit, Millionäre stärker) und Schließen von Steuerlücken (Immobilien, Erbschaft, Share Deals u.a.); Übergewinnsteuer auf Energiekonzerne" },
  { aspekt: "Lieferketten & Rohstoffsicherheit", partei: "SPD", i: 1,
    text: "Rohstoffsicherung als strategische Priorität (Diversifizierung, heimische Industrie, Deutschlandfonds, De-Risking); Kreislaufwirtschaft/Recycling und erneuerbare Ressourcen" },
  { aspekt: "Subventionen für grüne Technik / E-Mobilität", partei: "GRÜNE", i: 2,
    text: "Kritik an falscher Ausgestaltung (Subvention ohne Stromkostensenkung unwirksam); umweltschädliche Subventionen (Pendlerpauschale, Agrardiesel, Luftverkehr) zielgenau ersetzen" },
  { aspekt: "Rolle des Staates / Wirtschaftsordnung", partei: "GRÜNE", i: 2,
    text: "Marktwirtschaftliche Instrumente (ETS) statt Verbote; Klima-/Umweltrisiken und private Märkte regulieren (Herstellerverantwortung); Kritik an kriterienloser Förderung" },
  { aspekt: "Unternehmenssteuern", partei: "AfD", i: 0,
    text: "Steuern radikal senken — Körperschaftsteuer sofort (bis 10 %), Soli abschaffen, einheitlicher Steuersatz/Flat Tax, Gewerbesteuer abschaffen; gegen jede Steuererhöhung" },
  { aspekt: "Staatliche Investitionsfonds", partei: "AfD", i: 0,
    text: "Ablehnung schuldenfinanzierter Staatsinvestitionen/Sondervermögen als verschleierte Neuverschuldung — private statt staatliche Investitionen; Kritik an Staatsfonds als ineffizient" },
  { aspekt: "Steuerliche Investitionsanreize", partei: "GRÜNE", i: 0,
    text: "Ablehnung von Steuersenkungen/degressiver AfA als Anreiz (Liquidität fließt an Aktionäre) — Tax Credits besser; öffentliche Bürgschaften und Klimaschutzverträge für Großinvestitionen" },
];

function resolve(rede: string[], bullets: B[], label: string) {
  const used = bullets.flatMap((b) => b.idx);
  const dup = used.filter((i, k) => used.indexOf(i) !== k);
  const missing = rede.map((_, i) => i).filter((i) => !used.includes(i));
  const bad = used.filter((i) => i < 0 || i >= rede.length);
  if (dup.length) console.log(`    ⚠ ${label}: doppelt ${[...new Set(dup)].join(",")}`);
  if (missing.length) console.log(`    ⚠ ${label}: nicht zugeordnet ${missing.join(",")}`);
  if (bad.length) console.log(`    ⚠ ${label}: ungültig ${bad.join(",")}`);
  return bullets.map((b) => ({ text: b.text, refs: b.idx.map((i) => rede[i]) }));
}

const updKurz = db.prepare(`UPDATE partei_aspekt_gold SET synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`);

// (A) Splits
for (const s of SPLITS) {
  const row = db.prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`).get(FELD, s.aspekt, s.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! fehlt: ${s.aspekt}/${s.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const kurz = resolve(rede, s.kurz, `${s.aspekt}/${s.partei}`);
  updKurz.run(JSON.stringify(kurz), FELD, s.aspekt, s.partei);
  console.log(`  ✓ SPLIT ${s.aspekt}/${s.partei}: ${kurz.length} Bullets`);
}

// (B) Shortens (Text an Index ersetzen, refs behalten)
for (const sh of SHORTEN) {
  const row = db.prepare(`SELECT synthese_kurz_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`).get(FELD, sh.aspekt, sh.partei) as { synthese_kurz_json: string } | undefined;
  if (!row?.synthese_kurz_json) { console.log(`! fehlt: ${sh.aspekt}/${sh.partei}`); continue; }
  const arr = JSON.parse(row.synthese_kurz_json) as { text: string; refs: string[] }[];
  if (sh.i >= arr.length) { console.log(`  ⚠ ${sh.aspekt}/${sh.partei}: Index ${sh.i} > ${arr.length}`); continue; }
  const old = arr[sh.i].text;
  arr[sh.i].text = sh.text;
  updKurz.run(JSON.stringify(arr), FELD, sh.aspekt, sh.partei);
  console.log(`  ✓ SHORTEN ${sh.aspekt}/${sh.partei}[${sh.i}]: ${old.length}c → ${sh.text.length}c`);
}
db.close();
