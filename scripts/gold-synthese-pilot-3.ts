/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Batch der kleinen Wirtschaft-Aspekte.
 * Index-basiert (refs werden aus punkte_json aufgelöst, Coverage geprüft). Beide
 * Varianten: ausführlich → synthese_json, kompakt → synthese_kurz_json.
 *
 *   npx tsx scripts/gold-synthese-pilot-3.ts
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");
const cols = (db.prepare(`PRAGMA table_info(partei_aspekt_gold)`).all() as any[]).map((c) => c.name);
for (const c of ["synthese_json", "synthese_kurz_json"]) {
  if (!cols.includes(c)) db.exec(`ALTER TABLE partei_aspekt_gold ADD COLUMN ${c} TEXT`);
}

type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";

const CELLS: Cell[] = [
  // ===================== EXPORT-FÖRDERUNG =====================
  { aspekt: "Export-Förderung", partei: "AfD",
    lang: [
      { text: "Technologische Stärken (Baumaschinen, Industrieanlagen, Medizintechnik) in wachsende Märkte exportieren", idx: [0] },
      { text: "„Waren statt moralischer Ideologie“ exportieren", idx: [1] },
    ],
    kurz: [
      { text: "Technologische Stärken (Baumaschinen, Industrieanlagen, Medizintechnik) in wachsende Märkte exportieren", idx: [0] },
      { text: "„Waren statt moralischer Ideologie“ exportieren", idx: [1] },
    ] },
  { aspekt: "Export-Förderung", partei: "CDU/CSU",
    lang: [
      { text: "Stellung Deutschlands als Exportnation bewahren", idx: [0] },
      { text: "Maritime Technologien als neue Exportschlager vermarkten (Indonesien, Singapur, USA)", idx: [1] },
    ],
    kurz: [
      { text: "Exportnation-Stellung bewahren; maritime Technologien als neue Exportschlager (Indonesien, Singapur, USA)", idx: [0,1] },
    ] },

  // ===================== GEISTIGES EIGENTUM / PRODUKTPIRATERIE =====================
  { aspekt: "Geistiges Eigentum / Produktpiraterie", partei: "AfD",
    lang: [
      { text: "Kritik an Raubkopien und illegalem Vertrieb deutscher Produkte", idx: [1] },
      { text: "Geografische Herkunftsangaben als echte Eigentumsrechte privatrechtlich statt behördlich schützen", idx: [2] },
      { text: "Kritik an Zwang zur Offenlegung von Geschäftsgeheimnissen und Datenbeständen", idx: [3] },
      { text: "Warnung vor Normenkollision (Lauterkeits-/Markenrecht); Übergangsfristen und Harmonisierung bei Nachhaltigkeitssiegeln", idx: [0] },
    ],
    kurz: [
      { text: "Schutz geistigen Eigentums: gegen Raubkopien, geografische Herkunftsangaben als Eigentumsrechte privatrechtlich schützen", idx: [1,2] },
      { text: "Kritik an erzwungener Offenlegung von Geschäftsgeheimnissen/Daten; Übergangsfristen/Harmonisierung bei Nachhaltigkeitssiegeln", idx: [0,3] },
    ] },
  { aspekt: "Geistiges Eigentum / Produktpiraterie", partei: "CDU/CSU",
    lang: [ { text: "Stärkerer Rechtsschutz gegen Nachahmungen; Reform des Geoschutzgesetzes auch im Onlinehandel", idx: [0] } ],
    kurz: [ { text: "Stärkerer Rechtsschutz gegen Nachahmungen; Reform des Geoschutzgesetzes auch im Onlinehandel", idx: [0] } ] },
  { aspekt: "Geistiges Eigentum / Produktpiraterie", partei: "GRÜNE",
    lang: [ { text: "Geografische Angaben schützen Qualität, Tradition und regionale Wertschöpfung; Geoschutz-Reform begrüßt, föderale Umsetzung kritisiert", idx: [0] } ],
    kurz: [ { text: "Geografische Angaben schützen Qualität und regionale Wertschöpfung; Geoschutz-Reform begrüßt, föderale Umsetzung kritisiert", idx: [0] } ] },
  { aspekt: "Geistiges Eigentum / Produktpiraterie", partei: "SPD",
    lang: [ { text: "Deutschland als Spitzenland bei Patentanmeldungen", idx: [0] } ],
    kurz: [ { text: "Deutschland als Spitzenland bei Patentanmeldungen", idx: [0] } ] },

  // ===================== MITBESTIMMUNG DER BESCHÄFTIGTEN =====================
  { aspekt: "Mitbestimmung der Beschäftigten", partei: "AfD",
    lang: [
      { text: "Ablehnung erzwungener Allgemeinverbindlichkeit von Tarifverträgen ohne Arbeitgeberbeteiligung", idx: [0] },
      { text: "Kerngeschäft bei Festangestellten; Fremdpersonal auf 15 % begrenzen", idx: [1] },
      { text: "Erweiterte Mitbestimmungsräte (Gewerkschaften/Betriebsräte) als Angriff auf freies Unternehmertum kritisiert", idx: [2] },
    ],
    kurz: [
      { text: "Erweiterte Mitbestimmung und erzwungene Tarifbindung als Eingriff ins freie Unternehmertum abgelehnt", idx: [0,2] },
      { text: "Kerngeschäft bei Festangestellten; Fremdpersonal auf 15 % begrenzen", idx: [1] },
    ] },
  { aspekt: "Mitbestimmung der Beschäftigten", partei: "CDU/CSU",
    lang: [ { text: "Tarifbindung und deren Privilegierung bei öffentlicher Auftragsvergabe zur Verhinderung von Lohndumping", idx: [0] } ],
    kurz: [ { text: "Tarifbindung und deren Privilegierung bei öffentlicher Auftragsvergabe gegen Lohndumping", idx: [0] } ] },
  { aspekt: "Mitbestimmung der Beschäftigten", partei: "LINKE",
    lang: [
      { text: "Mitbestimmung und Betriebsräte zentral für gerechte wirtschaftliche Transformation — stärken, nicht untergraben", idx: [0,3,4] },
      { text: "Mitbestimmung als Ziel bei Vergesellschaftung zur Arbeitsplatzsicherung", idx: [1] },
      { text: "Kritik an AfD, die sich zu Tarifbindung, Gewerkschaften und Mitbestimmung nicht äußert", idx: [2] },
    ],
    kurz: [
      { text: "Mitbestimmung und Betriebsräte stärken — zentral für gerechte Transformation und Arbeitsplatzsicherung (auch bei Vergesellschaftung)", idx: [0,1,3,4] },
      { text: "Kritik an AfD-Schweigen zu Tarifbindung und Mitbestimmung", idx: [2] },
    ] },
  { aspekt: "Mitbestimmung der Beschäftigten", partei: "SPD",
    lang: [
      { text: "Tarifbindung und Mitbestimmung als Leitprinzip bei öffentlichen Investitionen und Aufträgen (Bevorzugung gut mitbestimmter Unternehmen)", idx: [0,1,4] },
      { text: "Mitbestimmung stärkt Resilienz, Innovation und industrielle Stärke; betriebliches Miteinander", idx: [2,5,6] },
      { text: "Kritik an Shareholder-Value-Fokus statt Reinvestition (Aktienrückkäufe)", idx: [3] },
    ],
    kurz: [
      { text: "Tarifbindung und Mitbestimmung als Leitprinzip (auch bei öffentlichen Aufträgen); stärkt Resilienz, Innovation und industrielle Stärke", idx: [0,1,2,4,5,6] },
      { text: "Kritik an Shareholder-Value-Fokus statt Reinvestition (Aktienrückkäufe)", idx: [3] },
    ] },

  // ===================== SCHUTZ VOR AUSLÄNDISCHEN ÜBERNAHMEN =====================
  { aspekt: "Schutz vor ausländischen Übernahmen", partei: "AfD",
    lang: [
      { text: "Schlüsseltechnologien, kritische Rohstoffe und strategische Produktion vor ausländischen Übernahmen schützen, Übernahmen prüfen", idx: [1,3] },
      { text: "Kapitalabfluss/Abwanderung durch hohe Steuern; Deutschland attraktiver machen statt Wegzugsteuer (abschaffen)", idx: [0,2] },
    ],
    kurz: [
      { text: "Schlüsseltechnologien, kritische Rohstoffe und strategische Produktion vor ausländischen Übernahmen schützen", idx: [1,3] },
      { text: "Kapitalabfluss durch hohe Steuern; Deutschland attraktiver machen statt Wegzugsteuer", idx: [0,2] },
    ] },
  { aspekt: "Schutz vor ausländischen Übernahmen", partei: "CDU/CSU",
    lang: [
      { text: "Sicherheitsrelevante Wirtschaftsbeziehungen prüfen (v.a. China); Schutz vor chinesischen Beteiligungen und F&E-Zugriff", idx: [0] },
      { text: "Know-how im Anlagen- und Maschinenbau stärker schützen (auch vor Dumping)", idx: [1] },
      { text: "Digitale Souveränität — Unabhängigkeit von großen ausländischen Tech-Konzernen", idx: [2] },
    ],
    kurz: [
      { text: "Sicherheitsrelevante Wirtschaftsbeziehungen prüfen (v.a. China); Know-how im Maschinenbau schützen", idx: [0,1] },
      { text: "Digitale Souveränität gegenüber ausländischen Tech-Konzernen", idx: [2] },
    ] },
  { aspekt: "Schutz vor ausländischen Übernahmen", partei: "GRÜNE",
    lang: [
      { text: "Sorge um Abhängigkeit von außereuropäischen Konzernen; digitale Souveränität und Kontrolle europäischer Daten", idx: [0] },
      { text: "Chinesischer Druck (Spezialschiffbau, kritische Infrastruktur) erfordert Investitionsschutzgesetze und risikobasierte Sicherheitsprüfungen", idx: [1] },
    ],
    kurz: [
      { text: "Investitionsschutz und risikobasierte Sicherheitsprüfungen (China-Druck auf kritische Infrastruktur); digitale Souveränität und Datenkontrolle", idx: [0,1] },
    ] },
  { aspekt: "Schutz vor ausländischen Übernahmen", partei: "LINKE",
    lang: [
      { text: "Überprüfungsmechanismen für sicherheitsrelevante Beziehungen befürwortet, aber gegen länderspezifische Sonderkommission", idx: [0] },
      { text: "Fremdbesitzverbote gegen Private-Equity-Einkäufe über EU-Auslandsgesellschaften", idx: [1] },
    ],
    kurz: [
      { text: "Überprüfungsmechanismen ja, aber gegen länderspezifische Sonderkommission", idx: [0] },
      { text: "Fremdbesitzverbote gegen Private-Equity-Einkäufe über EU-Auslandsgesellschaften", idx: [1] },
    ] },
  { aspekt: "Schutz vor ausländischen Übernahmen", partei: "SPD",
    lang: [
      { text: "Warnung vor Übernahmen strategischer Industrien (Schienenbau) und problematischen chinesischen Investitionen; gesetzliche Instrumente nötig (Nexperia-Fall)", idx: [0,1,2] },
      { text: "Verlust heimischer Produktion und Verlagerung nach China (Solar als Negativbeispiel) — europäisches Gegenprogramm statt Abschottung", idx: [3,4] },
      { text: "Fremdbesitzverbot für Steuerkanzleien (gegen Private Equity)", idx: [5] },
    ],
    kurz: [
      { text: "Warnung vor Übernahmen/Verlagerung strategischer Industrien (Schienenbau, Solar, China-Risiken/Nexperia) — gesetzliche Instrumente und europäisches Gegenprogramm statt Abschottung", idx: [0,1,2,3,4] },
      { text: "Fremdbesitzverbot für Steuerkanzleien (gegen Private Equity)", idx: [5] },
    ] },

  // ===================== ÖFFENTLICHES EIGENTUM / VERGESELLSCHAFTUNG =====================
  { aspekt: "Öffentliches Eigentum / Vergesellschaftung", partei: "AfD",
    lang: [
      { text: "Verteidigung privaten Eigentums gegen Vergesellschaftung und Umverteilung; Vermögensteuer als „Enteignung/Sozialismus“", idx: [1,2,3,5,6] },
      { text: "Ablehnung von Verstaatlichung/Staatseinstieg (Autoindustrie, Meyer Werft)", idx: [7,8] },
      { text: "Kritik an planwirtschaftlichen Zielvorgaben (E-Mobilität)", idx: [0] },
      { text: "Kritik an Treuhand-Privatisierung als „Ausverkauf“ von Staatsbetrieben", idx: [4] },
    ],
    kurz: [
      { text: "Verteidigung privaten Eigentums gegen Vergesellschaftung, Umverteilung und Verstaatlichung (Autoindustrie, Meyer Werft); Vermögensteuer als „Enteignung“", idx: [1,2,3,5,6,7,8] },
      { text: "Kritik an planwirtschaftlichen Zielvorgaben (E-Mobilität) und an Treuhand-Privatisierung als „Ausverkauf“", idx: [0,4] },
    ] },
  { aspekt: "Öffentliches Eigentum / Vergesellschaftung", partei: "CDU/CSU",
    lang: [
      { text: "Ablehnung, Steuerlast durch Vermögensanteile zu begleichen — als versteckte Verstaatlichung/„Volkseigener Betrieb“", idx: [0,2,3] },
      { text: "Pflicht-Rückbau von Wind-/Solaranlagen als staatlich verordnete Enteignung kritisiert; Eigentumsschutz", idx: [1] },
    ],
    kurz: [
      { text: "Ablehnung, Steuerlast durch Vermögensanteile zu begleichen — als versteckte Verstaatlichung", idx: [0,2,3] },
      { text: "Pflicht-Rückbau von Wind-/Solaranlagen als staatlich verordnete Enteignung kritisiert", idx: [1] },
    ] },
  { aspekt: "Öffentliches Eigentum / Vergesellschaftung", partei: "GRÜNE",
    lang: [
      { text: "Warnung vor finanziellem Ausbluten des Staates und Gefährdung öffentlicher Infrastruktur durch Steuersenkungen/-ausfälle", idx: [0,1] },
      { text: "Kritik an Steuervergünstigungen für große Vermögen; gerechtere Besteuerung von Erbschaften und Betriebsvermögen", idx: [2] },
    ],
    kurz: [
      { text: "Öffentliche Finanzen und Infrastruktur schützen — gegen Ausbluten durch Steuersenkungen; gerechtere Besteuerung großer Vermögen/Erbschaften", idx: [0,1,2] },
    ] },
  { aspekt: "Öffentliches Eigentum / Vergesellschaftung", partei: "LINKE",
    lang: [
      { text: "Energie (Netze, Erzeuger) und Daseinsvorsorge in öffentliche Hand; öffentliches Eigenkapital statt privater Renditeinvestoren bei Netzbetreibern", idx: [1,2,3,5] },
      { text: "Demokratische Vergesellschaftung von Schlüsselindustrien (Stahl, Rüstung/Rheinmetall) mit öffentlicher Mitsprache", idx: [4,7] },
      { text: "Öffentlicher Sektor und Beteiligung für Infrastruktur und Standortsicherung; Seehäfen in öffentlichem Eigentum, Privatisierungen rückgängig machen", idx: [6,9,10] },
      { text: "Gewinne aus öffentlich finanzierter Innovation nicht privatisieren; öffentliche Investitionen", idx: [8] },
      { text: "Konzernprofite einhegen, Übergewinne abschöpfen", idx: [0] },
      { text: "Fremdbesitzverbot für Steuerkanzleien (gegen Private Equity)", idx: [11] },
    ],
    kurz: [
      { text: "Energie, Daseinsvorsorge und Schlüsselindustrien (Netze, Stahl, Rüstung, Seehäfen) in öffentliche Hand bzw. öffentliches Eigenkapital statt privater Renditeinvestoren", idx: [1,2,3,4,5,6,7,9,10] },
      { text: "Konzernprofite/Übergewinne abschöpfen; Gewinne aus öffentlicher Innovation nicht privatisieren; Fremdbesitzverbot für Steuerkanzleien", idx: [0,8,11] },
    ] },
  { aspekt: "Öffentliches Eigentum / Vergesellschaftung", partei: "SPD",
    lang: [ { text: "Ablehnung von Enteignung von Unternehmen", idx: [0] } ],
    kurz: [ { text: "Ablehnung von Enteignung von Unternehmen", idx: [0] } ] },
];

const upd = db.prepare(
  `UPDATE partei_aspekt_gold SET synthese_json=?, synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`,
);
function resolve(rede: string[], bullets: B[], label: string) {
  const used = bullets.flatMap((b) => b.idx);
  const dup = used.filter((i, k) => used.indexOf(i) !== k);
  const missing = rede.map((_, i) => i).filter((i) => !used.includes(i));
  const bad = used.filter((i) => i < 0 || i >= rede.length);
  if (dup.length) console.log(`    ⚠ ${label}: doppelte Indizes ${[...new Set(dup)].join(",")}`);
  if (missing.length) console.log(`    ⚠ ${label}: nicht zugeordnet ${missing.join(",")}`);
  if (bad.length) console.log(`    ⚠ ${label}: ungültig ${bad.join(",")}`);
  return bullets.map((b) => ({ text: b.text, refs: b.idx.map((i) => rede[i]) }));
}
let ok = 0;
for (const c of CELLS) {
  const row = db.prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`)
    .get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const lang = resolve(rede, c.lang, `${c.aspekt}/${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.aspekt}/${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, c.aspekt, c.partei);
  ok++;
}
console.log(`${ok}/${CELLS.length} Zellen aktualisiert.`);
db.close();
