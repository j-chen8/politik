/**
 * Krass gekürzte Stichpunkt-Labels für Abstimmungen (vote_id -> kurz), manuell
 * (Claude Code, kein LLM) aus den Betreffs destilliert. Reusable Tabelle vote_kurz;
 * die Matrix-Zellen zeigen „✓/✗ + Kurzlabel" statt nur ja/nein. Idempotent.
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
db.exec(`CREATE TABLE IF NOT EXISTS vote_kurz (vote_id INTEGER PRIMARY KEY, kurz TEXT)`);

const K: [number, string][] = [
  [78, "Jahreswirtschaftsbericht 2026"],
  [132, "Nachtzugnetz / Raumfahrtgesetz"],
  [195, "Nachtzugnetz / Raumfahrtgesetz"],
  [280, "Tariftreuegesetz"],
  [330, "Luftverkehrsteuer-Änderung"],
  [365, "Griechenland-Kredite"],
  [394, "Verbrenner-Aus 2035 beibehalten"],
  [396, "Mittelstand stärken"],
  [403, "Landwirtschaft entbürokratisieren"],
  [417, "Wasserstoff-Hochlauf"],
  [422, "Digitale Souveränität"],
  [446, "Bundeshaushalt 2026"],
  [449, "Investitionssofortprogramm / Steuergerechtigkeit"],
  [469, "Aktionsplan Rohstoffe"],
  [472, "China-Wirtschaft: Prüfkommission"],
  [483, "Wettbewerbsrecht (UWG-Novelle)"],
  [492, "Batterierecht EU-Anpassung"],
  [498, "Standortförderung / Wegzugsteuer"],
  [501, "Ertragsteuerreform"],
  [517, "Pflanzenschutz / Landwirtschaft"],
  [522, "Treibstoffpreise entlasten"],
  [528, "Landwirtschaft entbürokratisieren"],
  [538, "MwSt. Grundnahrung & ÖPNV senken"],
  [553, "Investitionssofortprogramm"],
  [570, "Marktstellung der Landwirte"],
  [577, "Hormus-Blockade / Düngertransport"],
  [597, "Energiesteuer Kraftstoffe senken"],
  [599, "Kraftstoffpreis-Maßnahmenpaket"],
  [611, "Wirtschaftspartnerschaft Afrika"],
  [617, "Steuergerechtigkeit (Erbschaft/Cum-Cum)"],
  [634, "EU-Gentechnik (NGT-Pflanzen)"],
  [636, "Energiepreise: Soforthilfe"],
  [638, "Kurzzeitvermietung: Datenaustausch"],
  [660, "Außenwirtschaftsverordnung"],
  [692, "EU-Lieferkettenrichtlinie abschaffen"],
  [698, "Stromsteuer senken"],
  [714, "Wirtschaft 2045 (Innovationen)"],
  [776, "Gaskraftwerk Lubmin erhalten"],
  [267, "Restrukturierungsfonds-Übertragung"],
  [745, "Restrukturierungsfonds-Übertragung"],
  [402, "Städtebauförderung 2026"],
  [625, "Maritime Wirtschaft stärken"],
  [99, "Haushaltsgesetz (Entschließung)"],
  [421, "Haushaltsgesetz (Entschließung)"],
  [447, "Ackerstatus landw. Flächen"],
  [544, "Vergabe öffentl. Aufträge beschleunigen"],
  [640, "Bundeshaushalt 2026"],
  [425, "EU-Verordnung ändern"],
  [427, "Nationale Umsetzung EU-Regelungen"],
  [468, "Steuerberatungsgesetz-Änderung"],
  [564, "Vergabe öffentl. Aufträge beschleunigen"],
  [669, "Energiepreise: Soforthilfe"],
  [694, "Kernkraft-Wiederinbetriebnahme prüfen"],
  [759, "Haushaltsgesetz (Entschließung)"],
  [784, "Luftverkehrsteuer-Änderung"],
  [785, "Apotheken stärken"],
  [354, "EU-Verbraucherkredit-Richtlinie"],
];

const ins = db.prepare(`INSERT OR REPLACE INTO vote_kurz (vote_id, kurz) VALUES (?, ?)`);
const tx = db.transaction(() => K.forEach(([id, kurz]) => ins.run(id, kurz)));
tx();
console.log(`vote_kurz: ${K.length} Labels geschrieben.`);
db.close();
