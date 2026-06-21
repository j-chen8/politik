/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Aspekt „Steuerliche Investitionsanreize"
 * (Matrix-Platz 3). Index-basiert; beide Varianten.
 *   npx tsx scripts/gold-synthese-pilot-6.ts
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
type B = { text: string; idx: number[] };
type Cell = { partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";
const ASP = "Steuerliche Investitionsanreize";

const CELLS: Cell[] = [
  { partei: "AfD",
    lang: [
      { text: "Kritik an degressiver Sonderabschreibung als ineffektiv (nur zeitliche Verschiebung statt echter Ersparnis)", idx: [0,1] },
      { text: "Ablehnung planwirtschaftlicher Investitionsprämien/Subventionen (teuer, bürokratisch) — lieber allgemeine Steuererleichterungen", idx: [2,5] },
      { text: "Höhere Freibeträge für Arbeitseinkommen und Familien", idx: [3] },
      { text: "Reduzierte Mehrwertsteuer auf reparierte/recyclingfreundliche Produkte als Anreiz", idx: [4] },
      { text: "Steueranreizmodell für die Filmwirtschaft (Vorteil an Investoren weitergeben)", idx: [6] },
      { text: "Kritik: zu wenig Investitionsanreize für den Wohnungsbau", idx: [7] },
      { text: "CO₂-Bepreisung als schädlich, Stromsteuer auf EU-Minimum senken", idx: [8] },
    ],
    kurz: [
      { text: "Kritik an degressiver Sonderabschreibung und planwirtschaftlichen Investitionsprämien als ineffektiv/bürokratisch — lieber allgemeine Steuererleichterungen und höhere Freibeträge", idx: [0,1,2,3,5] },
      { text: "Gezielte Anreize befürwortet: reduzierte MwSt auf Reparatur/Recycling, Steueranreizmodell Film, mehr für Wohnungsbau", idx: [4,6,7] },
      { text: "CO₂-Bepreisung schädlich, Stromsteuer auf EU-Minimum senken", idx: [8] },
    ] },
  { partei: "CDU/CSU",
    lang: [
      { text: "Abschreibungsbooster/degressive AfA und Investitionssofortprogramm als schnellster, effektivster Anreiz (sofortige Liquidität)", idx: [0,1,2,3,4,5,7,8,10,19,21,29,33,36] },
      { text: "Gezielte Investitionsförderung über das bestehende Steuersystem statt pauschaler Steuersenkung; Steuervergünstigungen mobilisieren privates Kapital", idx: [9,13,14,17,27,31,32] },
      { text: "Anreize für Forschung und Entwicklung", idx: [11,12] },
      { text: "Reinvestitionsschwelle/Roll-over-Freibetrag für PE/VC erhöhen; Rahmenbedingungen für private Investitionen in Start-ups, Infrastruktur und Erneuerbare", idx: [15,16,22,24] },
      { text: "Standortentlastung, um Investoren zu locken und Kapitalabwanderung zu verhindern; Anreize für Familienunternehmen", idx: [25,30] },
      { text: "Anreize statt Verbote (Heizung/Gebäudemodernisierung); Steuervorteile für Film und recyclingfreundliche Produktion", idx: [26,28,35] },
      { text: "Skepsis gegenüber Anreizen, die marktwirtschaftliche Prinzipien verlassen (Seltene-Erden-Lager); Warnung, dass Stundungsmodelle Investitionen gefährden; arbeitsbezogene Entlastungen (Überstunden, Pendlerpauschale, Weiterbeschäftigung)", idx: [6,18,20,23,34] },
    ],
    kurz: [
      { text: "Abschreibungsbooster/degressive AfA und Sofortprogramm als schnellster Anreiz (Liquidität); gezielte Förderung übers Steuersystem statt pauschaler Senkung, mobilisiert privates Kapital", idx: [0,1,2,3,4,5,7,8,9,10,13,14,17,19,21,27,29,31,32,33,36] },
      { text: "F&E-Anreize; PE/VC-Reinvestitionsschwelle/Roll-over erhöhen; Rahmenbedingungen für Start-ups, Infrastruktur, Erneuerbare; Standortentlastung gegen Kapitalabwanderung, Familienunternehmen", idx: [11,12,15,16,22,24,25,30] },
      { text: "Anreize statt Verbote (Heizung, Film, Recycling); Skepsis gegenüber marktfernen Anreizen (Seltene Erden, Stundung); arbeitsbezogene Entlastungen (Überstunden, Pendler, Weiterbeschäftigung)", idx: [6,18,20,23,26,28,34,35] },
    ] },
  { partei: "GRÜNE",
    lang: [
      { text: "Ablehnung von Steuersenkungen/degressiver AfA als Anreiz (kein Wirkungsmechanismus, Liquidität fließt an Aktionäre) — Tax Credits/Investitionsprämie besser, auch für Start-ups ohne Gewinn", idx: [0,1,2] },
      { text: "Öffentliche Bürgschaften und Klimaschutzverträge als Anreize für Großinvestitionen", idx: [4] },
      { text: "Kritik an falschen Anreizen für E-Mobilität; Planungssicherheit und bezahlbare E-Mobilität (Social Leasing)", idx: [3] },
      { text: "Kritik: Regierung reizt private Investitionen an, arbeitet aber durch Regulierung dagegen", idx: [5] },
    ],
    kurz: [
      { text: "Ablehnung von Steuersenkungen/degressiver AfA als Anreiz (Liquidität fließt an Aktionäre) — Tax Credits/Investitionsprämie besser; öffentliche Bürgschaften und Klimaschutzverträge für Großinvestitionen", idx: [0,1,2,4] },
      { text: "Kritik an falschen Anreizen für E-Mobilität (Planungssicherheit, Social Leasing) und an widersprüchlicher Regulierung", idx: [3,5] },
    ] },
  { partei: "LINKE",
    lang: [
      { text: "Skepsis gegenüber Abschreibungsboostern und Investitionsanreizen — empirisch keine Investitionssteigerung; Steuersenkungen führen historisch nicht zu mehr Investitionen", idx: [0,1] },
      { text: "Befürwortung steuerlicher Anreize für Film- und Fernsehproduktionen", idx: [2] },
    ],
    kurz: [
      { text: "Skepsis gegenüber Abschreibungsboostern und Investitionsanreizen — empirisch keine Investitionssteigerung", idx: [0,1] },
      { text: "Befürwortung steuerlicher Anreize für Film- und Fernsehproduktionen", idx: [2] },
    ] },
  { partei: "SPD",
    lang: [
      { text: "Superabschreibungen und befristete degressive Abschreibungen für Maschinen, Anlagen, Digitalisierung und Klimaschutz als gezielter Anreiz (Mittelstand)", idx: [0,3,5,9] },
      { text: "Steuererleichterungen und Investitionsbooster zur Mobilisierung privater Investitionen und Liquidität", idx: [1,2,7] },
      { text: "Reinvestition von Gewinnen in den eigenen Betrieb erleichtern", idx: [6] },
      { text: "Steuerrecht reformieren, damit Investmentfonds in Windkraft, Solar, Netze und VC investieren", idx: [8] },
      { text: "Steuerliche Anreize für den Filmstandort Deutschland", idx: [10] },
      { text: "Kritik an Ausgabenkürzungen/Streichung der Abschreibungsregelungen, die Investitionen gefährden", idx: [4] },
    ],
    kurz: [
      { text: "Superabschreibungen/degressive Abschreibungen (Maschinen, Digitalisierung, Klimaschutz, Mittelstand) und Investitionsbooster zur Mobilisierung privater Investitionen", idx: [0,1,2,3,5,7,9] },
      { text: "Reinvestition in eigene Betriebe erleichtern; Steuerrecht für Investmentfonds (Windkraft, Solar, Netze, VC); Filmstandort fördern", idx: [6,8,10] },
      { text: "Kritik an Ausgabenkürzungen/Streichung der Abschreibungsregelungen", idx: [4] },
    ] },
];

const upd = db.prepare(`UPDATE partei_aspekt_gold SET synthese_json=?, synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`);
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
let ok = 0;
for (const c of CELLS) {
  const row = db.prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`).get(FELD, ASP, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const lang = resolve(rede, c.lang, `${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, ASP, c.partei);
  ok++;
}
console.log(`${ok}/${CELLS.length} Zellen (Steuerliche Investitionsanreize) aktualisiert.`);
db.close();
