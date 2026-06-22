/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Feld „Öffentliche Finanzen, Steuern
 * und Abgaben", alle 13 Aspekte × 5 Fraktionen (62 Zellen, 1.178 Per-Rede-Punkte).
 *
 * Gleiche Mechanik wie scripts/gold-synthese-pilot-2.ts: jeder Stichpunkt referenziert
 * INDIZES in die gespeicherte punkte_json der Zelle; das Skript löst rede_ids auf und
 * prüft, dass jeder Roh-Punkt-Index genau einmal verwendet wird (Coverage-invariant).
 * Zwei Granularitäten: lang → synthese_json, kurz → synthese_kurz_json.
 *
 *   npx tsx scripts/gold-synthese-oeffentliche-finanzen.ts
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");
const cols = (db.prepare(`PRAGMA table_info(partei_aspekt_gold)`).all() as any[]).map((c) => c.name);
for (const c of ["synthese_json", "synthese_kurz_json"]) {
  if (!cols.includes(c)) { db.exec(`ALTER TABLE partei_aspekt_gold ADD COLUMN ${c} TEXT`); console.log(`+ Spalte ${c}`); }
}

type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Öffentliche Finanzen, Steuern und Abgaben";
const r = (...xs: number[]) => xs;

const CELLS: Cell[] = [
  // ============================ CO₂-Einnahmen / Klimageld ============================
  {
    aspekt: "CO₂-Einnahmen / Klimageld", partei: "AfD",
    lang: [
      { text: "Vollständige Abschaffung der CO₂-Bepreisung/-Steuer als zentrale Forderung", idx: r(0,1,4,5,6,9,10,11,13,14,15,18,19,24,27,29,31,32,33,36,47,50,51,52,53,54,55,56,59,60,63) },
      { text: "CO₂-Preis als wirtschafts- und arbeitsplatzschädlich, treibt Industrieverlagerung", idx: r(16,22,26,37,41,57,62) },
      { text: "Klimageld/Rückverteilung als ungerecht und Umverteilung; versprochene Auszahlung nie erfolgt", idx: r(17,28,38,39,43,44,49) },
      { text: "Stattdessen Senkung von Energie- und Stromsteuer", idx: r(12,34,35,40) },
      { text: "Abschaffung der Luftverkehr-/Flugsteuer; Kritik an Steuern auf Inlandsflüge", idx: r(7,8,21,30,61) },
      { text: "Streichung von Klima- und Transformationsfonds und Klimaausgaben als Verschwendung", idx: r(2,3,42,58) },
      { text: "Kfz-Steuer für E-Autos und Entfernungspauschale", idx: r(20,23) },
      { text: "Weitere Kritik (Inflationstreiber, bürokratische Rückgabe)", idx: r(25,45,46,48) },
    ],
    kurz: [
      { text: "Vollständige Abschaffung der CO₂-Bepreisung; stattdessen Energie-/Stromsteuer senken und Klimafonds streichen", idx: r(0,1,4,5,6,9,10,11,12,13,14,15,18,19,24,27,29,31,32,33,34,35,36,40,2,3,42,58,47,50,51,52,53,54,55,56,59,60,63) },
      { text: "CO₂-Preis als wirtschafts- und arbeitsplatzschädlich (Industrieverlagerung)", idx: r(16,22,26,37,41,57,62) },
      { text: "Klimageld/Rückverteilung ungerecht und nie ausgezahlt", idx: r(17,28,38,39,43,44,49,25,45,46,48) },
      { text: "Luftverkehr-/Flugsteuer abschaffen; Kfz-Steuer und Entfernungspauschale", idx: r(7,8,21,30,61,20,23) },
    ],
  },
  {
    aspekt: "CO₂-Einnahmen / Klimageld", partei: "CDU/CSU",
    lang: [
      { text: "Befürwortung der CO₂-Bepreisung/des ETS als marktwirtschaftliches Instrument, mit Deckelung und sozialem Ausgleich", idx: r(2,5,9,12,13) },
      { text: "Einnahmen nicht als pauschales Klimageld, sondern Instrumentenmix / zweckgebunden im Klima- und Transformationsfonds", idx: r(10,11) },
      { text: "Kritik an unfinanzierten Entlastungsforderungen von Grünen und AfD", idx: r(0,3,4,8) },
      { text: "Energie-/Stromsteuersenkung und Abschreibung für E-Fahrzeuge als Entlastung", idx: r(1,6,7) },
    ],
    kurz: [
      { text: "Befürwortung der CO₂-Bepreisung/des ETS als marktwirtschaftliches Instrument, mit Deckelung und sozialem Ausgleich", idx: r(2,5,9,12,13) },
      { text: "Einnahmen nicht pauschal als Klimageld, sondern Instrumentenmix / zweckgebunden im Klimafonds", idx: r(10,11) },
      { text: "Kritik an unfinanzierten Entlastungsforderungen; Energie-/Stromsteuersenkung als Entlastung", idx: r(0,3,4,8,1,6,7) },
    ],
  },
  {
    aspekt: "CO₂-Einnahmen / Klimageld", partei: "GRÜNE",
    lang: [
      { text: "Klimageld als direkte Pro-Kopf-Auszahlung zur Abfederung des CO₂-Preises", idx: r(2,6,11,13,14) },
      { text: "Stromsteuer senken statt fossiler Subventionen", idx: r(0,1,4,5,10) },
      { text: "Klimagerechte Luftverkehrsteuer/Privatjets, Kfz-Steuer mit Lenkungswirkung; Pendlerpauschale klimaschädlich", idx: r(3,7,12) },
      { text: "Kritik an Zweckentfremdung der CO₂-Einnahmen (Gasverbilligung) und Abschwächung des CO₂-Preises", idx: r(8,9,15) },
    ],
    kurz: [
      { text: "Klimageld als direkte Pro-Kopf-Auszahlung zur Abfederung des CO₂-Preises", idx: r(2,6,11,13,14) },
      { text: "Stromsteuer senken statt fossiler Subventionen", idx: r(0,1,4,5,10) },
      { text: "Klimagerechte Luftverkehrsteuer/Kfz-Steuer (Lenkung); Kritik an Zweckentfremdung der CO₂-Einnahmen", idx: r(3,7,12,8,9,15) },
    ],
  },
  {
    aspekt: "CO₂-Einnahmen / Klimageld", partei: "LINKE",
    lang: [
      { text: "Klimageld/Energiekrisengeld als soziale Direktauszahlung; Kritik an bisheriger Nichtauszahlung", idx: r(5,7,8,10,11) },
      { text: "Stromsteuer senken als Entlastung", idx: r(1,9) },
      { text: "Kerosin/Luftverkehr und große Verbrenner stärker besteuern (Lenkungswirkung)", idx: r(0,2,3,4) },
      { text: "Warnung vor CO₂-Preis ohne sozialen Ausgleich (Landbevölkerung, Mieter)", idx: r(6) },
    ],
    kurz: [
      { text: "Klimageld/Energiekrisengeld als soziale Direktauszahlung; Warnung vor CO₂-Preis ohne sozialen Ausgleich", idx: r(5,7,8,10,11,6) },
      { text: "Stromsteuer senken als Entlastung", idx: r(1,9) },
      { text: "Kerosin/Luftverkehr und große Verbrenner stärker besteuern", idx: r(0,2,3,4) },
    ],
  },
  {
    aspekt: "CO₂-Einnahmen / Klimageld", partei: "SPD",
    lang: [
      { text: "Verteidigung der CO₂-Bepreisung und des Klima- und Transformationsfonds gegen AfD-Abschaffung", idx: r(0,1,2,3) },
      { text: "CO₂-Preise mit sozialer Ausgestaltung (Klimasozialplan), Entlastung kleiner Einkommen", idx: r(4,5) },
    ],
    kurz: [
      { text: "Verteidigung der CO₂-Bepreisung und des Klimafonds gegen AfD-Abschaffung", idx: r(0,1,2,3) },
      { text: "CO₂-Preise mit sozialer Ausgestaltung (Klimasozialplan)", idx: r(4,5) },
    ],
  },

  // ============================ EU-Finanzen ============================
  {
    aspekt: "EU-Finanzen", partei: "AfD",
    lang: [
      { text: "EU-Beiträge und Nettozahlungen kürzen (Forderung nach „Deutschenrabatt“)", idx: r(4,5,6,7,8,11,12,15,16) },
      { text: "Ablehnung von EU-Gemeinschaftsschulden, neuen Eigenmitteln und EU-Steuern", idx: r(1,9,10,14,17) },
      { text: "Kürzung von Entwicklungshilfe, internationaler Klimafinanzierung und globalen Fonds", idx: r(0,2,3,13) },
    ],
    kurz: [
      { text: "EU-Beiträge/Nettozahlungen kürzen („Deutschenrabatt“)", idx: r(4,5,6,7,8,11,12,15,16) },
      { text: "Ablehnung von EU-Gemeinschaftsschulden, Eigenmitteln und EU-Steuern", idx: r(1,9,10,14,17) },
      { text: "Kürzung von Entwicklungshilfe und internationaler Klimafinanzierung", idx: r(0,2,3,13) },
    ],
  },
  {
    aspekt: "EU-Finanzen", partei: "CDU/CSU",
    lang: [
      { text: "Ablehnung von Haushaltsanstieg, neuen EU-Eigenmitteln und gemeinsamen Schulden; wirkungsorientierte Mittelverwendung", idx: r(0,2) },
      { text: "Unterstützung des CO₂-Grenzausgleichs; globale Mindestbesteuerung bevorzugt, national notwendig", idx: r(1,3) },
    ],
    kurz: [
      { text: "Ablehnung von Haushaltsanstieg, neuen EU-Eigenmitteln und gemeinsamen Schulden", idx: r(0,2) },
      { text: "Unterstützung des CO₂-Grenzausgleichs; globale Mindestbesteuerung bevorzugt", idx: r(1,3) },
    ],
  },
  {
    aspekt: "EU-Finanzen", partei: "GRÜNE",
    lang: [
      { text: "Kritik an Kürzung von Entwicklungs-/humanitärer Hilfe; internationale Finanzierung für Entwicklungsländer", idx: r(0) },
      { text: "Forderung nach Kommunalfinanzierung durch den Bund (auch für Klima-/Katastrophenschutz)", idx: r(1,2) },
    ],
    kurz: [
      { text: "Kritik an Kürzung von Entwicklungs-/humanitärer Hilfe; Kommunalfinanzierung durch den Bund", idx: r(0,1,2) },
    ],
  },
  {
    aspekt: "EU-Finanzen", partei: "LINKE",
    lang: [
      { text: "Reform der EU-Schuldenregeln/des Stabilitätspakts zugunsten von Investitionen", idx: r(0,2) },
      { text: "Faire Steuer-/Finanzverteilung zwischen Bund, Ländern und Kommunen", idx: r(1,4) },
      { text: "EU-weite Kerosinbesteuerung; Warnung vor Entmachtung der Bundesländer durch EU-Zentralisierung", idx: r(3,5) },
    ],
    kurz: [
      { text: "Reform der EU-Schuldenregeln zugunsten von Investitionen", idx: r(0,2) },
      { text: "Faire Finanzverteilung Bund/Länder/Kommunen", idx: r(1,4) },
      { text: "EU-weite Kerosinbesteuerung; gegen EU-Zentralisierung zulasten der Länder", idx: r(3,5) },
    ],
  },
  {
    aspekt: "EU-Finanzen", partei: "SPD",
    lang: [
      { text: "500-Milliarden-Euro-Sondervermögen für Kommunen und Infrastruktur", idx: r(0,1) },
      { text: "Kritik an AfD-Forderung nach EU-Mittelkürzung (Folgen für Agrarsubventionen)", idx: r(2) },
    ],
    kurz: [
      { text: "500-Mrd.-Sondervermögen für Kommunen/Infrastruktur; Kritik an AfD-Kürzung von EU-Mitteln", idx: r(0,1,2) },
    ],
  },

  // ============================ Einkommensteuer ============================
  {
    aspekt: "Einkommensteuer", partei: "AfD",
    lang: [
      { text: "Senkung der Einkommen-/Lohnsteuer und der allgemeinen Steuerlast (mehr Netto), gegen Steuererhöhungen", idx: r(2,4,5,6,9,11,13,14,15,20,27,28,31,35,36,37,39,41,45,48,49,54,55,56,57) },
      { text: "Hohe Freibeträge, Grundfreibetrag an Inflation anpassen, Mittelstandsbauch abbauen", idx: r(0,1,7,8,10,22,26,40) },
      { text: "Flat Tax / einheitlicher Steuersatz von 25 % auf alle Einkommensarten", idx: r(12,16,19,38,42) },
      { text: "Abschaffung des Solidaritätszuschlags", idx: r(29,33) },
      { text: "Erhöhung der Pendlerpauschale", idx: r(46,51) },
      { text: "Steuerentlastung für Familien, Kinder und Rentner", idx: r(43,47,50,52,53) },
      { text: "Rundfunkbeitrag steuerlich absetzbar machen", idx: r(18,23) },
      { text: "Gegen Wegzugsteuer; für Spekulationsfrist bei Immobilien", idx: r(3,21,34) },
      { text: "Kommunale Besteuerung erweitern; Kritik an der Grundsteuer", idx: r(24,25) },
      { text: "Kritik an ungleicher Steuerlast (Facharbeiter Spitzensatz vs. Reiche); Spitzensteuer-Schwelle erhöhen", idx: r(17,30,32,44) },
    ],
    kurz: [
      { text: "Einkommen-/Lohnsteuer und Steuerlast senken, hohe Freibeträge, Mittelstandsbauch abbauen; gegen Steuererhöhungen", idx: r(2,4,5,6,9,11,13,14,15,20,27,28,31,35,36,37,39,41,45,48,49,54,55,56,57,0,1,7,8,10,22,26,40) },
      { text: "Flat Tax / einheitlicher Steuersatz 25 % und Abschaffung des Solidaritätszuschlags", idx: r(12,16,19,38,42,29,33) },
      { text: "Entlastung für Familien, Kinder, Rentner und Pendler", idx: r(43,47,50,52,53,46,51) },
      { text: "Kritik an ungleicher Steuerlast; Einzelforderungen (Rundfunkbeitrag, Spekulationsfrist, Kommunalsteuer)", idx: r(17,30,32,44,18,23,3,21,34,24,25) },
    ],
  },
  {
    aspekt: "Einkommensteuer", partei: "CDU/CSU",
    lang: [
      { text: "Reform/Senkung der Einkommensteuer für kleine und mittlere Einkommen (zur Mitte der Legislatur)", idx: r(0,4,9,10,12,13,14,15,28,34,40) },
      { text: "Erhöhung der Pendler-/Entfernungspauschale (38 Cent ab dem ersten Kilometer)", idx: r(1,3,8,17,18,19,22,23) },
      { text: "Steuerfreie Überstundenzuschläge als Arbeitsanreiz", idx: r(5,20,35) },
      { text: "Steuerliche Begünstigung von Weiterarbeit im Rentenalter (Aktivrente, steuerfreier Hinzuverdienst)", idx: r(11,16,26,30,32,33) },
      { text: "Verteidigung des progressiven Tarifs/Leistungsfähigkeitsprinzips gegen Flat Tax; Kritik am Spitzensteuersatz in der Mitte", idx: r(7,24,31,38,39) },
      { text: "Steuersenkung als Investitions-/Wachstumsanreiz statt höherer Steuern", idx: r(6,25) },
      { text: "Familienbezogene Entlastung (Kinderfreibetrag, Alleinerziehende)", idx: r(21,27) },
      { text: "Einzelfragen: Krypto-Haltefrist, Umsatzsteuersenkung, Erbschaft als Ergänzung, Verfahrensrecht", idx: r(2,29,36,37) },
    ],
    kurz: [
      { text: "Reform/Senkung der Einkommensteuer für kleine und mittlere Einkommen", idx: r(0,4,9,10,12,13,14,15,28,34,40) },
      { text: "Pendlerpauschale erhöhen und Überstundenzuschläge steuerfrei stellen", idx: r(1,3,8,17,18,19,22,23,5,20,35) },
      { text: "Steuerliche Begünstigung von Weiterarbeit im Rentenalter (Aktivrente)", idx: r(11,16,26,30,32,33) },
      { text: "Verteidigung des progressiven Tarifs gegen Flat Tax; Wachstumsanreize, Familien- und Einzelfragen", idx: r(7,24,31,38,39,6,25,21,27,2,29,36,37) },
    ],
  },
  {
    aspekt: "Einkommensteuer", partei: "GRÜNE",
    lang: [
      { text: "Kritik an Steuersenkungen, die Reiche / das oberste 1 % begünstigen", idx: r(0,1,2,3,9,11,12) },
      { text: "Pendler-/Entfernungspauschale begünstigt Besserverdienende", idx: r(5,6) },
      { text: "Verteidigung der Progression, Soli in den Tarif integrieren, neue Spitzensätze", idx: r(7,8) },
      { text: "Kritik an Ungleichbehandlung der Einkommensarten und nach Alter", idx: r(4,10) },
    ],
    kurz: [
      { text: "Kritik an Steuersenkungen, die Reiche / das oberste 1 % begünstigen; Pendlerpauschale begünstigt Besserverdienende", idx: r(0,1,2,3,9,11,12,5,6) },
      { text: "Verteidigung der Progression, Soli in den Tarif integrieren; Kritik an Ungleichbehandlung der Einkommensarten", idx: r(7,8,4,10) },
    ],
  },
  {
    aspekt: "Einkommensteuer", partei: "LINKE",
    lang: [
      { text: "Progressivere Besteuerung: Entlastung bis ~7.000 €, höhere Spitzensteuer; Kritik an AfD-Flat-Tax", idx: r(1,2,5,11,13,14,4) },
      { text: "Entlastung kleiner und mittlerer Einkommen (bislang verschoben/unzureichend)", idx: r(0,7,9,10,12) },
      { text: "Pendlerpauschale regressiv → einheitliches Mobilitätsgeld; Kinderfreibetrag vs. Kindergeld", idx: r(6,8,3) },
    ],
    kurz: [
      { text: "Progressivere Besteuerung: Entlastung bis ~7.000 €, höhere Spitzensteuer; Kritik an AfD-Flat-Tax", idx: r(1,2,5,11,13,14,4) },
      { text: "Entlastung kleiner und mittlerer Einkommen (bislang verschoben)", idx: r(0,7,9,10,12) },
      { text: "Pendlerpauschale regressiv → Mobilitätsgeld; Kinderfreibetrag vs. Kindergeld", idx: r(6,8,3) },
    ],
  },
  {
    aspekt: "Einkommensteuer", partei: "SPD",
    lang: [
      { text: "Verteidigung der progressiven Besteuerung nach Leistungsfähigkeit gegen Flat Tax", idx: r(1,5,6,8,10,18) },
      { text: "Gezielte Entlastung kleiner und mittlerer Einkommen statt pauschaler Senkungen", idx: r(4,9,11,13,14,15,21,22) },
      { text: "Solidaritätszuschlag für hohe Einkommen behalten", idx: r(12,16,17) },
      { text: "Einzelpunkte: Pendlerpauschale/Gewerkschaftsbeiträge, Kinderfreibetrag, Grundsteuer, Sportlerprämien, Beitrag von Migrant:innen", idx: r(20,2,0,3,7,19) },
    ],
    kurz: [
      { text: "Verteidigung der progressiven Besteuerung nach Leistungsfähigkeit gegen Flat Tax", idx: r(1,5,6,8,10,18) },
      { text: "Gezielte Entlastung kleiner und mittlerer Einkommen statt pauschaler Senkungen", idx: r(4,9,11,13,14,15,21,22) },
      { text: "Solidaritätszuschlag für hohe Einkommen behalten; Einzelpunkte (Pendlerpauschale, Kinderfreibetrag, Grundsteuer)", idx: r(12,16,17,20,2,0,3,7,19) },
    ],
  },

  // ============================ Erbschaftsteuer ============================
  {
    aspekt: "Erbschaftsteuer", partei: "AfD",
    lang: [
      { text: "Vollständige Abschaffung der Erbschaft-/Schenkungsteuer", idx: r(3,5,10,11,12) },
      { text: "Argument der Doppelbesteuerung bereits versteuerten Vermögens", idx: r(1,2) },
      { text: "Schutz von Betriebsvermögen und Generationenwechsel", idx: r(7,8) },
      { text: "Ablehnung geplanter Erhöhungen", idx: r(6,9,13) },
      { text: "Verweis auf Länder ohne Erbschaftsteuer als Vorbild", idx: r(0) },
      { text: "Ablehnung von Einschränkungen der Erbfreiheit; Kritik an Kapitalbesteuerung", idx: r(4,14) },
    ],
    kurz: [
      { text: "Vollständige Abschaffung der Erbschaft-/Schenkungsteuer (Doppelbesteuerung, Schutz von Betriebsvermögen)", idx: r(3,5,10,11,12,1,2,7,8,0) },
      { text: "Ablehnung geplanter Erhöhungen und Einschränkungen der Erbfreiheit", idx: r(6,9,13,4,14) },
    ],
  },
  {
    aspekt: "Erbschaftsteuer", partei: "CDU/CSU",
    lang: [
      { text: "Verteidigung der geltenden Regelung mit Verschonung von Betriebsvermögen zum Schutz von Arbeitsplätzen", idx: r(3,5,6,7,9) },
      { text: "Kritik an AfD-Abschaffung ohne Gegenfinanzierung", idx: r(1,4) },
      { text: "BVerfG-Urteil abwarten; Freibeträge anpassen; Ablehnung von Vermögensanteil-Tilgung", idx: r(2,8,0) },
      { text: "Moderate Erbschaftsteuer als Teil der sozialen Marktwirtschaft (Balance)", idx: r(10) },
    ],
    kurz: [
      { text: "Verteidigung der geltenden Regelung mit Verschonung von Betriebsvermögen (Balance, soziale Marktwirtschaft)", idx: r(3,5,6,7,9,10) },
      { text: "Kritik an AfD-Abschaffung ohne Gegenfinanzierung; BVerfG-Urteil abwarten, Freibeträge anpassen", idx: r(1,4,2,8,0) },
    ],
  },
  {
    aspekt: "Erbschaftsteuer", partei: "GRÜNE",
    lang: [
      { text: "Schließung von Ausnahmen und Steuerlücken bei sehr großen Vermögen (26-Mio-/300-Wohnungen-Regel)", idx: r(0,1,2,4,6,8,13,16,17,18) },
      { text: "Reform statt Abschaffung gegen Vermögenskonzentration", idx: r(3,5,12,19) },
      { text: "Kritik an geplanter Abschaffung/Streichung der Erbschaftsteuer", idx: r(11,14,15) },
      { text: "Allgemeine Forderung nach mehr Gerechtigkeit bei der Erbschaftsteuer; laufende Reformdebatte", idx: r(7,10,20,9) },
    ],
    kurz: [
      { text: "Schließung von Ausnahmen und Steuerlücken bei sehr großen Vermögen (26-Mio-/300-Wohnungen-Regel)", idx: r(0,1,2,4,6,8,13,16,17,18) },
      { text: "Reform statt Abschaffung gegen Vermögenskonzentration; Kritik an geplanter Streichung", idx: r(3,5,12,19,11,14,15,9) },
      { text: "Allgemeine Forderung nach mehr Gerechtigkeit bei der Erbschaftsteuer", idx: r(7,10,20) },
    ],
  },
  {
    aspekt: "Erbschaftsteuer", partei: "LINKE",
    lang: [
      { text: "Höhere Besteuerung großer Erbschaften; Abschaffung von Privilegien und Verschonungsregeln", idx: r(0,2,3,5,8,9,10,11,13,14,17) },
      { text: "Gegen die AfD-Forderung zur Abschaffung", idx: r(1,6,12,16) },
      { text: "Für Einführung einer ordentlichen, gerechten Erbschaftsteuer", idx: r(4,7,15) },
    ],
    kurz: [
      { text: "Höhere Besteuerung großer Erbschaften; Abschaffung von Privilegien und Verschonungsregeln", idx: r(0,2,3,5,8,9,10,11,13,14,17) },
      { text: "Gegen die AfD-Abschaffung; für eine ordentliche, gerechte Erbschaftsteuer", idx: r(1,6,12,16,4,7,15) },
    ],
  },
  {
    aspekt: "Erbschaftsteuer", partei: "SPD",
    lang: [
      { text: "Reform statt Abschaffung: Gerechtigkeitslücken schließen, sehr große Vermögen besteuern, Betriebe und Mittelstand schützen", idx: r(1,2,4,7,8,9,10,11,12,17,18) },
      { text: "Gegen die AfD-Forderung zur Abschaffung", idx: r(0,5,13,14,15,16) },
      { text: "BVerfG-Urteil könnte Mehreinnahmen bringen (für Bildung/Kinder)", idx: r(3,6) },
    ],
    kurz: [
      { text: "Reform statt Abschaffung: Gerechtigkeitslücken schließen, große Vermögen besteuern, Betriebe schützen", idx: r(1,2,4,7,8,9,10,11,12,17,18) },
      { text: "Gegen die AfD-Abschaffung; BVerfG-Urteil könnte Mehreinnahmen bringen", idx: r(0,5,13,14,15,16,3,6) },
    ],
  },

  // ============================ Familiensplitting ============================
  {
    aspekt: "Familiensplitting", partei: "AfD",
    lang: [
      { text: "Familiensplitting und hohe Kinderfreibeträge zur Entlastung von Familien; Ehe und Kinder steuerlich belohnen", idx: r(0,1,2,3,5,6,7) },
      { text: "Gegen die Abschaffung des Ehegattensplittings", idx: r(4) },
    ],
    kurz: [
      { text: "Familiensplitting und hohe Kinderfreibeträge; gegen Abschaffung des Ehegattensplittings", idx: r(0,1,2,3,5,6,7,4) },
    ],
  },
  {
    aspekt: "Familiensplitting", partei: "CDU/CSU",
    lang: [
      { text: "Kritik am AfD-Familienkonzept als unwirksam und unfinanziert", idx: r(0,2) },
      { text: "Kritik an geplanter Abschaffung des Ehegattensplittings", idx: r(1) },
    ],
    kurz: [
      { text: "Kritik am AfD-Familienkonzept als unfinanziert; gegen Abschaffung des Ehegattensplittings", idx: r(0,2,1) },
    ],
  },
  {
    aspekt: "Familiensplitting", partei: "GRÜNE",
    lang: [
      { text: "Ablehnung des Familiensplittings: teuer, begünstigt vor allem Reiche, zementiert Ungleichheit", idx: r(0,1) },
    ],
    kurz: [
      { text: "Ablehnung des Familiensplittings: teuer, begünstigt vor allem Reiche", idx: r(0,1) },
    ],
  },
  {
    aspekt: "Familiensplitting", partei: "LINKE",
    lang: [
      { text: "Ablehnung des Familiensplittings als ungerecht (begünstigt Hochverdienende); Kindergrundsicherung statt Freibetrag", idx: r(0,1) },
    ],
    kurz: [
      { text: "Ablehnung des Familiensplittings; Kindergrundsicherung statt Freibetrag", idx: r(0,1) },
    ],
  },
  {
    aspekt: "Familiensplitting", partei: "SPD",
    lang: [
      { text: "Ablehnung von Freibeträgen für Familien mit drei Kindern bis 85.000 € als regressiv", idx: r(0) },
    ],
    kurz: [
      { text: "Ablehnung von Freibeträgen für kinderreiche Familien bis 85.000 € als regressiv", idx: r(0) },
    ],
  },

  // ============================ Finanztransaktionssteuer ============================
  {
    aspekt: "Finanztransaktionssteuer", partei: "AfD",
    lang: [
      { text: "Ablehnung der Finanztransaktionssteuer (Teil der abgelehnten Steuererhöhungen)", idx: r(0,1,2) },
    ],
    kurz: [
      { text: "Ablehnung der Finanztransaktionssteuer", idx: r(0,1,2) },
    ],
  },
  {
    aspekt: "Finanztransaktionssteuer", partei: "GRÜNE",
    lang: [
      { text: "Befürwortung einer Digitalabgabe auf Werbeumsätze zur Finanzierung von Medien und Kultur", idx: r(0) },
    ],
    kurz: [
      { text: "Befürwortung einer Digitalabgabe auf Werbeumsätze (Medien-/Kulturfinanzierung)", idx: r(0) },
    ],
  },

  // ============================ Kapital- / Unternehmenssteuern ============================
  {
    aspekt: "Kapital- / Unternehmenssteuern", partei: "AfD",
    lang: [
      { text: "Körperschaftsteuer sofort und stärker senken (Richtung 10 %); Kritik an Verzögerung und Mini-Schritten", idx: r(7,8,10,12,17,18,25,26,29,35,38,40) },
      { text: "Einheitlicher 25-%-Satz, Zusammenlegung der Unternehmensteuern, Gewerbesteuer abschaffen", idx: r(1,14,21) },
      { text: "Solidaritätszuschlag als verkappte Unternehmensteuer abschaffen", idx: r(19,20) },
      { text: "Steuersenkung als Standortvorteil; gegen zusätzliche Belastung von Unternehmen und Investoren", idx: r(0,6,11,22,34,37,41) },
      { text: "Abschaffung der Luftverkehrsteuer", idx: r(16,28) },
      { text: "Ablehnung von Digital-/Sondersteuern auf Tech-Konzerne", idx: r(5,23,27,31) },
      { text: "Ablehnung von Reichen-/Milliardärssteuer und globaler Mindeststeuer", idx: r(4,30,33,39) },
      { text: "Kritik an Gewerbesteuer-Hebesatz und Grundsteuer", idx: r(9,15,24) },
      { text: "Spekulationsfrist/Bitcoin-Haltefrist; Kritik an niedriger Kapitalbesteuerung", idx: r(2,13,32) },
      { text: "Einzelpunkte: Umsatzsteuer auf Mineralöl senken; Kritik an Folgen für Kommunen", idx: r(3,36) },
    ],
    kurz: [
      { text: "Körperschaftsteuer sofort und stärker senken (Richtung 10 %), einheitlicher 25-%-Satz, Gewerbesteuer abschaffen, Soli weg", idx: r(7,8,10,12,17,18,25,26,29,35,38,40,1,14,21,19,20) },
      { text: "Steuersenkung als Standortvorteil; Abschaffung der Luftverkehrsteuer", idx: r(0,6,11,22,34,37,41,16,28) },
      { text: "Ablehnung von Digital-/Sondersteuern, Reichen-/Milliardärssteuer und globaler Mindeststeuer", idx: r(5,23,27,31,4,30,33,39) },
      { text: "Kritik an Gewerbesteuer-Hebesatz/Grundsteuer; Spekulationsfrist/Bitcoin; Einzelpunkte", idx: r(9,15,24,2,13,32,3,36) },
    ],
  },
  {
    aspekt: "Kapital- / Unternehmenssteuern", partei: "CDU/CSU",
    lang: [
      { text: "Körperschaftsteuer senken (15→10 %, ab 2028) als größte Unternehmensteuerreform seit ~20 Jahren", idx: r(6,7,13,14,16,18,20,23,24,25,26,31,32,37,38,39,43,45,51) },
      { text: "Investitionsbooster mit degressiver Abschreibung und Investitionssofortprogramm", idx: r(2,4,8,10,11,12,15,17,21,22,29,30,35,42,44) },
      { text: "Stromsteuersenkung für Industrie und energieintensive Betriebe", idx: r(0,1,3,40) },
      { text: "Senkung der Luftverkehrsteuer", idx: r(19,27,48,50,53) },
      { text: "Ablehnung von Reichen-/Bestandsbesteuerung (Warnung vor Kapitalflucht)", idx: r(9,34,41,47) },
      { text: "Kritik an AfD-Plänen (Gewerbesteuer-Abschaffung, Flat Tax)", idx: r(5,28) },
      { text: "Digitalsteuer/Plattformabgabe gegen Gewinnverlagerung großer Konzerne", idx: r(46,49,52) },
      { text: "Einzelpunkte (Unternehmensgewinne als Staatseinnahmen, falsche EU-Signale)", idx: r(33,36) },
    ],
    kurz: [
      { text: "Körperschaftsteuer senken (15→10 %, ab 2028) als größte Unternehmensteuerreform seit ~20 Jahren", idx: r(6,7,13,14,16,18,20,23,24,25,26,31,32,37,38,39,43,45,51) },
      { text: "Investitionsbooster mit degressiver Abschreibung; Stromsteuersenkung für Industrie", idx: r(2,4,10,11,12,15,17,21,22,29,30,35,42,44,0,1,3,40) },
      { text: "Senkung der Luftverkehrsteuer; Ablehnung von Reichen-/Bestandsbesteuerung (Kapitalflucht)", idx: r(19,27,48,50,53,9,34,41,47) },
      { text: "Digitalsteuer gegen Gewinnverlagerung; Kritik an AfD-Plänen; Einzelpunkte", idx: r(46,49,52,5,28,8,33,36) },
    ],
  },
  {
    aspekt: "Kapital- / Unternehmenssteuern", partei: "GRÜNE",
    lang: [
      { text: "Kritik an Körperschaftsteuersenkung/Investitionsbooster als ineffektiv und regressiv", idx: r(0,2,4,6,9,13,14,15) },
      { text: "Höhere Besteuerung großer Unternehmen, Reicher und US-Konzerne; Steuersparmodelle schließen", idx: r(3,5,7,11,12,16) },
      { text: "Digitalsteuer/Digitalabgabe auf Tech-Konzerne", idx: r(1,18) },
      { text: "Luftverkehr/Privatjets stärker besteuern; Gewerbesteuer-Hebesatz; Stundung für Betriebe", idx: r(17,10,8) },
    ],
    kurz: [
      { text: "Kritik an Körperschaftsteuersenkung/Investitionsbooster als ineffektiv und regressiv", idx: r(0,2,4,6,9,13,14,15) },
      { text: "Höhere Besteuerung großer Unternehmen, Reicher und US-Konzerne; Steuersparmodelle schließen", idx: r(3,5,7,11,12,16) },
      { text: "Digitalsteuer; Luftverkehr/Privatjets stärker besteuern; Gewerbesteuer; Stundung für Betriebe", idx: r(1,18,17,10,8) },
    ],
  },
  {
    aspekt: "Kapital- / Unternehmenssteuern", partei: "LINKE",
    lang: [
      { text: "Ablehnung der Unternehmensteuersenkung (massive Mindereinnahmen, kein Investitionseffekt)", idx: r(1,4,5,8,9,10,11,13,14,15,16,18) },
      { text: "Höhere Besteuerung von Reichen, Vermögenden und Konzernen", idx: r(0,2,17,20) },
      { text: "Digitalsteuer gegen Steuervermeidung der Digitalkonzerne", idx: r(6,7,19) },
      { text: "Kapital/Börsenspekulation wie Arbeitseinkommen besteuern", idx: r(3,12) },
    ],
    kurz: [
      { text: "Ablehnung der Unternehmensteuersenkung (massive Mindereinnahmen, kein Investitionseffekt)", idx: r(1,4,5,8,9,10,11,13,14,15,16,18) },
      { text: "Höhere Besteuerung von Reichen, Vermögenden und Konzernen", idx: r(0,2,17,20) },
      { text: "Digitalsteuer gegen Steuervermeidung; Kapital wie Arbeitseinkommen besteuern", idx: r(6,7,19,3,12) },
    ],
  },
  {
    aspekt: "Kapital- / Unternehmenssteuern", partei: "SPD",
    lang: [
      { text: "Befürwortung der Unternehmensteuer-/Körperschaftsteuersenkung (Wachstum, Investitionen)", idx: r(0,2,3,5,6,7) },
      { text: "Stromsteuersenkung für die Industrie auf EU-Mindestmaß", idx: r(1,4) },
      { text: "Digitalsteuer und globale Mindeststeuer gegen Gewinnverlagerung", idx: r(8,10,11) },
      { text: "Senkung der Luftverkehrsteuer; Kritik an AfD-Abschaffung von Körper-/Gewerbesteuer", idx: r(12,9) },
    ],
    kurz: [
      { text: "Befürwortung der Unternehmensteuersenkung (Wachstum) und Stromsteuersenkung für die Industrie", idx: r(0,2,3,5,6,7,1,4) },
      { text: "Digitalsteuer und globale Mindeststeuer gegen Gewinnverlagerung", idx: r(8,10,11) },
      { text: "Senkung der Luftverkehrsteuer; Kritik an AfD-Abschaffung von Körper-/Gewerbesteuer", idx: r(12,9) },
    ],
  },

  // ============================ Schuldenbremse ============================
  {
    aspekt: "Schuldenbremse", partei: "AfD",
    lang: [
      { text: "Strikte Einhaltung der Schuldenbremse; Kritik an Rekord-Neuverschuldung und deren Aufweichung", idx: r(0,1,3,4,7,8,10,11,13,14,15,17,18,20,22,23,25,26,27,28,31,34,35,37,38,39,41,42,43,45,46,47,49,51,52,54,55,56,58,59,60,61,63,64,65) },
      { text: "Sondervermögen als verdeckte Verschuldung und Schattenhaushalt / Umgehung", idx: r(2,9,21,29,30,33,36,40,44,50,53,57,62) },
      { text: "Kritik an schuldenfinanzierten Ausgaben (Ukraine, Klima- und Transformationsfonds, Schuldenerlass Kommunen)", idx: r(5,6,12,19,48) },
      { text: "Warnung vor Zinslast, ungedeckten Pensionen und Belastung künftiger Generationen", idx: r(16,24,32) },
    ],
    kurz: [
      { text: "Strikte Einhaltung der Schuldenbremse; Kritik an Rekord-Neuverschuldung und deren Aufweichung", idx: r(0,1,3,4,7,8,10,11,13,14,15,17,18,20,22,23,25,26,27,28,31,34,35,37,38,39,41,42,43,45,46,47,49,51,52,54,55,56,58,59,60,61,63,64,65) },
      { text: "Sondervermögen als verdeckte Verschuldung/Schattenhaushalt", idx: r(2,9,21,29,30,33,36,40,44,50,53,57,62) },
      { text: "Kritik an schuldenfinanzierten Ausgaben (Ukraine, Klimafonds) sowie an Zinslast und Generationenbelastung", idx: r(5,6,12,19,48,16,24,32) },
    ],
  },
  {
    aspekt: "Schuldenbremse", partei: "CDU/CSU",
    lang: [
      { text: "Schuldenaufnahme/Sondervermögen für Investitionen und Verteidigungsfähigkeit gerechtfertigt", idx: r(0,4,7,10,17,18,19,22,23) },
      { text: "Gleichzeitig Konsolidierung, Strukturreformen und Ausgabenbegrenzung trotz Kreditaufnahme", idx: r(1,2,8,9,11,12,13,15,16,20) },
      { text: "Schuldenbremse grundsätzlich beibehalten, ohne weitere Aufweichung", idx: r(14,21) },
      { text: "Warnung vor Zinslast und mit Blick auf Generationengerechtigkeit; kommunale Altschulden", idx: r(3,6,5) },
    ],
    kurz: [
      { text: "Schuldenaufnahme/Sondervermögen für Investitionen und Verteidigung gerechtfertigt", idx: r(0,4,7,10,17,18,19,22,23) },
      { text: "Gleichzeitig Konsolidierung, Strukturreformen und Ausgabenbegrenzung", idx: r(1,2,8,9,11,12,13,15,16,20) },
      { text: "Schuldenbremse grundsätzlich beibehalten; Warnung vor Zinslast/Generationenlast, kommunale Altschulden", idx: r(14,21,3,6,5) },
    ],
  },
  {
    aspekt: "Schuldenbremse", partei: "GRÜNE",
    lang: [
      { text: "Kritik an neuen Schulden statt echter Reformen/Subventionsabbau; Kreditfinanzierung von Steuersenkungen für Reiche", idx: r(0,1,2,15) },
      { text: "Schuldenbremsenreform befürwortet — aber für Investitionen, nicht für Konsum oder Steuersenkungen", idx: r(3,9,11,16) },
      { text: "Kritik an Sondervermögen als Verschiebung statt zusätzlicher Investitionen; Buchungstricks/Intransparenz", idx: r(4,5,8,12,18) },
      { text: "Kritik an Union-Wortbruch (180-Grad-Wende); Warnung vor Rekordverschuldung und EU-Regeln", idx: r(7,10,14,17) },
      { text: "Altschuldenlösung für Kommunen; Spielräume nicht für Entwicklungszusammenarbeit genutzt", idx: r(6,19,13) },
    ],
    kurz: [
      { text: "Kritik an neuen Schulden statt echter Reformen; Schuldenbremsenreform nur für Investitionen, nicht für Konsum/Steuersenkungen", idx: r(0,1,2,15,3,9,11,16) },
      { text: "Sondervermögen als Verschiebung statt zusätzlicher Investitionen (Buchungstricks); Kritik an Union-Wortbruch", idx: r(4,5,8,12,18,7,10,14,17) },
      { text: "Altschuldenlösung für Kommunen; Spielräume nicht für Entwicklungszusammenarbeit genutzt", idx: r(6,19,13) },
    ],
  },
  {
    aspekt: "Schuldenbremse", partei: "LINKE",
    lang: [
      { text: "Abschaffung/Reform der Schuldenbremse als Investitionshemmnis (Schiene, Digitalisierung, Daseinsvorsorge)", idx: r(1,4,5,6,7,8,9,10) },
      { text: "Kritik an selektiver Lockerung für Rüstung statt für ÖPNV, Schulen und Kitas", idx: r(0,11) },
      { text: "Reform der EU-Schuldenregeln; Altschuldenlösung für Kommunen", idx: r(2,3) },
    ],
    kurz: [
      { text: "Abschaffung/Reform der Schuldenbremse als Investitionshemmnis", idx: r(1,4,5,6,7,8,9,10) },
      { text: "Kritik an selektiver Lockerung für Rüstung statt ÖPNV/Schulen/Kitas; EU-Regeln und Kommunen", idx: r(0,11,2,3) },
    ],
  },
  {
    aspekt: "Schuldenbremse", partei: "SPD",
    lang: [
      { text: "Bereichsausnahmen der Schuldenbremse für Verteidigung, Sicherheit und Cyber", idx: r(2,5,6,7,13,15) },
      { text: "Sondervermögen für zusätzliche Investitionen ohne Verletzung der Schuldenbremse (Zusätzlichkeit, Investitionsquote)", idx: r(0,4,11) },
      { text: "Reform für langfristige Investitionsspielräume bei soliden Finanzen", idx: r(8,9,12,14) },
      { text: "Kritik an fehlender Gegenfinanzierung (AfD) und an Soli-Abschaffung als Haushaltsloch", idx: r(1,3,10) },
    ],
    kurz: [
      { text: "Bereichsausnahmen für Verteidigung/Sicherheit; Sondervermögen für zusätzliche Investitionen", idx: r(2,5,6,7,13,15,0,4,11) },
      { text: "Reform für langfristige Investitionsspielräume bei soliden Finanzen", idx: r(8,9,12,14) },
      { text: "Kritik an fehlender Gegenfinanzierung und an Soli-Abschaffung als Haushaltsloch", idx: r(1,3,10) },
    ],
  },

  // ============================ Sozialbeiträge ============================
  {
    aspekt: "Sozialbeiträge", partei: "AfD",
    lang: [
      { text: "Senkung der Sozialabgaben und Lohnnebenkosten zur Entlastung von Arbeitnehmern und Betrieben", idx: r(1,2,6,7,11,12,14,15,19,24,28,31) },
      { text: "Abschaffung des Solidaritätszuschlags; Kritik an dessen Fortbestand bei Kapitalerträgen", idx: r(0,16) },
      { text: "Versicherungsfremde Leistungen aus Steuermitteln statt aus Sozialversicherungen finanzieren", idx: r(5) },
      { text: "Kritik an steigenden Kranken- und Rentenversicherungsbeiträgen", idx: r(9,10,22,25,27,29,30) },
      { text: "Kritik an Bürgergeld-Empfängern ohne Beitragszahlung; Verbeamtung schwächt Rentenkasse", idx: r(13,17) },
      { text: "Private Altersvorsorge stärken (Junior-Spardepot); Ablehnung von Beiträgen auf Kapital-/Mieterträge", idx: r(3,4,20,23) },
      { text: "Einzelpunkte: Pendlerpauschale, Kraftstoffabgaben, Gewerkschaftsbeitrag-Subvention, USt auf Grundnahrung/ÖPNV", idx: r(8,21,26,18) },
    ],
    kurz: [
      { text: "Senkung der Sozialabgaben/Lohnnebenkosten; Abschaffung des Solidaritätszuschlags", idx: r(1,2,6,7,11,12,14,15,19,24,28,31,0,16) },
      { text: "Kritik an steigenden Kranken-/Rentenbeiträgen; versicherungsfremde Leistungen aus Steuern finanzieren", idx: r(9,10,22,25,27,29,30,5,13,17) },
      { text: "Private Altersvorsorge stärken, keine Beiträge auf Kapital-/Mieterträge; Einzelpunkte", idx: r(3,4,20,23,8,21,26,18) },
    ],
  },
  {
    aspekt: "Sozialbeiträge", partei: "CDU/CSU",
    lang: [
      { text: "Stabilisierung der Beitragssätze (Kranken-/Pflege-/Rentenversicherung) als prioritäres Ziel", idx: r(2,5,7,14,17,20,22) },
      { text: "Senkung der Lohnnebenkosten/Sozialabgaben zur Stärkung der Wettbewerbsfähigkeit", idx: r(10,12,13,16) },
      { text: "Anhebung der Ehrenamts-/Übungsleiterpauschalen", idx: r(1,11,18) },
      { text: "Aktivrente: Beitragsentlastung für weiterarbeitende Rentner", idx: r(4,6,23) },
      { text: "Bekämpfung von Schwarzarbeit zum Schutz der Solidargemeinschaft", idx: r(9,19) },
      { text: "Soli-Abschaffung begrüßenswert, aber nicht prioritär; Kritik an Erhöhung der Beitragsbemessungsgrenze; Entlastungsprämie; Agrardiesel", idx: r(0,15,24,3,8,21) },
    ],
    kurz: [
      { text: "Stabilisierung der Beitragssätze und Senkung der Lohnnebenkosten als prioritäres Ziel", idx: r(2,5,7,14,17,20,22,10,12,13,16) },
      { text: "Ehrenamtspauschalen anheben; Aktivrente; Schwarzarbeit bekämpfen", idx: r(1,11,18,4,6,23,9,19) },
      { text: "Soli-Abschaffung nicht prioritär; Kritik an höherer Beitragsbemessungsgrenze; Entlastungsprämie, Agrardiesel", idx: r(0,15,24,3,8,21) },
    ],
  },
  {
    aspekt: "Sozialbeiträge", partei: "GRÜNE",
    lang: [
      { text: "Beitragsbemessungsgrenze anheben und Versichertenkreis erweitern (Beamte, Selbstständige, Abgeordnete)", idx: r(3,4) },
      { text: "Kritik an zu geringen Steuerzuschüssen → Beitragssteigerungen; versicherungsfremde Leistungen in den Bundeshaushalt", idx: r(5,6,8,11) },
      { text: "GKV-Beiträge durch Reformen senken; gegen Darlehen an die GKV mit Rückzahlung", idx: r(9,10) },
      { text: "Gewerkschaftsbeiträge absetzbar; Kommunen-Kompensation; Krypto-Einnahmen für Beitragssenkung; Elterngeld/Kita", idx: r(0,1,7,2) },
    ],
    kurz: [
      { text: "Beitragsbemessungsgrenze anheben, Versichertenkreis erweitern; versicherungsfremde Leistungen in den Bundeshaushalt", idx: r(3,4,5,6,8,11) },
      { text: "GKV-Beiträge senken; Gewerkschaftsbeiträge absetzbar; Kommunen-Kompensation; Elterngeld/Kita", idx: r(9,10,0,1,7,2) },
    ],
  },
  {
    aspekt: "Sozialbeiträge", partei: "LINKE",
    lang: [
      { text: "Beitragsbemessungsgrenzen erhöhen/verdoppeln und Versichertenkreis ausweiten (Beamte, Selbstständige)", idx: r(0,3,6) },
      { text: "Solidaritätszuschlag beibehalten und ins progressive Steuersystem integrieren", idx: r(2,5) },
      { text: "Höheres Rentenniveau; versicherungsfremde Leistungen aus progressiver Steuer statt Kürzungen; Gewerkschaftsbeitrag", idx: r(1,4,7) },
    ],
    kurz: [
      { text: "Beitragsbemessungsgrenzen erhöhen, Versichertenkreis ausweiten; höheres Rentenniveau", idx: r(0,3,6,4) },
      { text: "Solidaritätszuschlag beibehalten; versicherungsfremde Leistungen aus progressiver Steuer; Gewerkschaftsbeitrag", idx: r(2,5,7,1) },
    ],
  },
  {
    aspekt: "Sozialbeiträge", partei: "SPD",
    lang: [
      { text: "Bekämpfung von Sozialbetrug und Schwarzarbeit zum Schutz der Beitragseinnahmen", idx: r(1,3) },
      { text: "Solidaritätszuschlag für sehr hohe Einkommen behalten (gegen AfD-Abschaffung)", idx: r(2) },
      { text: "Aktivrente mit fortlaufenden Beiträgen; Entlastungsprämie; Beitrag von Migrant:innen", idx: r(4,6,8) },
      { text: "Agrardieselrückerstattung; Gewerkschaftsbeiträge absetzbar; Entlastung der Beitragszahler beim GKV-Defizit; Pendlerpauschale", idx: r(0,9,7,5) },
    ],
    kurz: [
      { text: "Sozialbetrug/Schwarzarbeit bekämpfen; Soli für hohe Einkommen behalten", idx: r(1,3,2) },
      { text: "Aktivrente, Entlastungsprämie, Gewerkschaftsbeiträge absetzbar; Agrardiesel; Entlastung der Beitragszahler", idx: r(4,6,8,0,9,7,5) },
    ],
  },

  // ============================ Steuerhinterziehung bekämpfen ============================
  {
    aspekt: "Steuerhinterziehung bekämpfen", partei: "AfD",
    lang: [
      { text: "Konsequente Verfolgung von Cum-Ex/Cum-Cum; gegen Verkürzung der Aufbewahrungs-/Verjährungsfristen", idx: r(2,5,6,8,9,10,14) },
      { text: "Vereinfachtes Steuersystem senkt Anreize zur Hinterziehung", idx: r(0,13) },
      { text: "Schließung von Steuerlücken bei multinationalen Konzernen", idx: r(3) },
      { text: "Bekämpfung von Schwarzarbeit/Finanzkriminalität (Personal, Behörden)", idx: r(1,4,12) },
      { text: "Ablehnung von Krypto-Meldepflichten als Überwachung; Kritik an Steuerausfällen durch Fehlentwicklungen", idx: r(7,11) },
    ],
    kurz: [
      { text: "Konsequente Verfolgung von Cum-Ex/Cum-Cum; gegen Verkürzung der Fristen; vereinfachtes System senkt Hinterziehung", idx: r(2,5,6,8,9,10,14,0,13,3) },
      { text: "Schwarzarbeit/Finanzkriminalität bekämpfen; Ablehnung von Krypto-Meldepflichten als Überwachung", idx: r(1,4,12,7,11) },
    ],
  },
  {
    aspekt: "Steuerhinterziehung bekämpfen", partei: "CDU/CSU",
    lang: [
      { text: "Bekämpfung von Schwarzarbeit (risikobasiert) und Finanzkriminalität durch Zoll/Finanzkontrolle", idx: r(1,2,3,6) },
      { text: "Verfolgung von Cum-Ex/Cum-Cum und Steuerflucht als nachhaltige Steuerpolitik", idx: r(5,7,8) },
      { text: "Internationale Maßnahmen (OECD-Mindestbesteuerung, EU-Richtlinie); DAC-8 für Krypto-Transparenz", idx: r(0,4) },
    ],
    kurz: [
      { text: "Bekämpfung von Schwarzarbeit und Finanzkriminalität durch Zoll/Finanzkontrolle", idx: r(1,2,3,6) },
      { text: "Verfolgung von Cum-Ex/Cum-Cum und Steuerflucht; internationale Maßnahmen und DAC-8 für Krypto", idx: r(5,7,8,0,4) },
    ],
  },
  {
    aspekt: "Steuerhinterziehung bekämpfen", partei: "GRÜNE",
    lang: [
      { text: "Effektivere Verfolgung von Cum-Ex/Cum-Cum; gegen Verkürzung der Aufbewahrungsfristen; Behörden besser ausstatten", idx: r(2,7,8,10,14,15,12) },
      { text: "Kryptolücke schließen (Besteuerung nach 366 Tagen); Steuerprivilegien für Krypto beenden", idx: r(5,6) },
      { text: "Internationale Regeln gegen Gewinnverlagerung; Besteuerung von US-Konzernen; Mindesthebesatz Gewerbesteuer", idx: r(3,9,4) },
      { text: "Schwere Steuerhinterziehung wieder als Verbrechen; Banken an Krisenkosten beteiligen; legale Steuertricks/Kerosin", idx: r(11,0,1,13,16) },
    ],
    kurz: [
      { text: "Verfolgung von Cum-Ex/Cum-Cum, längere Fristen, bessere Behördenausstattung; Kryptolücke schließen", idx: r(2,7,8,10,14,15,12,5,6) },
      { text: "Internationale Regeln gegen Gewinnverlagerung; schwere Steuerhinterziehung als Verbrechen; legale Tricks/Kerosin", idx: r(3,9,4,11,0,1,13,16) },
    ],
  },
  {
    aspekt: "Steuerhinterziehung bekämpfen", partei: "LINKE",
    lang: [
      { text: "Personalausbau und rechtliche Verschärfung gegen Cum-Ex/Cum-Cum; gegen verkürzte Fristen", idx: r(0,3,4,8,9) },
      { text: "Bekämpfung der Steuervermeidung von Digitalkonzernen (Gewinnverlagerung in Steueroasen)", idx: r(2,11) },
      { text: "Besteuerung von Superreichen; Schließung von Schlupflöchern (Verschonungsbedarfsprüfung, Familienstiftungen)", idx: r(5,6,10,12) },
      { text: "Krypto-Gewinne besteuern (Haltefristen abschaffen); Kritik an Ungleichbehandlung gegenüber Bürgern", idx: r(1,7,13) },
    ],
    kurz: [
      { text: "Personalausbau und Verschärfung gegen Cum-Ex/Cum-Cum; Digitalkonzerne und Steueroasen ins Visier", idx: r(0,3,4,8,9,2,11) },
      { text: "Superreiche besteuern, Schlupflöcher schließen; Krypto-Gewinne besteuern", idx: r(5,6,10,12,1,7,13) },
    ],
  },
  {
    aspekt: "Steuerhinterziehung bekämpfen", partei: "SPD",
    lang: [
      { text: "Bekämpfung von Steuerbetrug, Schwarzarbeit und Finanzkriminalität durch mehr Stellen bei Zoll/Finanzkontrolle", idx: r(2,4,5,6,11,12,17,18) },
      { text: "Maßnahmen gegen Cum-Cum wirken; wachsames Monitoring neuer Missbrauchsmodelle", idx: r(3,7,19) },
      { text: "Internationale Koordination und automatischer Informationsaustausch (auch bei Krypto)", idx: r(0,13,16) },
      { text: "Geldwäsche/organisierte Steuerhinterziehung; Kartellverfolgung; Maßstab gesellschaftlicher Zusammenhalt", idx: r(15,1,8,9,10,14) },
    ],
    kurz: [
      { text: "Bekämpfung von Steuerbetrug, Schwarzarbeit und Finanzkriminalität durch mehr Stellen bei Zoll/Finanzkontrolle", idx: r(2,4,5,6,11,12,17,18) },
      { text: "Cum-Cum-Maßnahmen wirken; internationale Koordination/Informationsaustausch (auch Krypto); Geldwäsche/OK bekämpfen", idx: r(3,7,19,0,13,16,15,1,8,9,10,14) },
    ],
  },

  // ============================ Steuervereinfachung / Bürokratie ============================
  {
    aspekt: "Steuervereinfachung / Bürokratie", partei: "AfD",
    lang: [
      { text: "Bürokratieabbau für KMU und Wirtschaft (Berichtspflichten streichen, Halbierung der Bürokratielast)", idx: r(0,4,7,13,18,24,27,28,42,44,45,46,48,50,53,67,70,74) },
      { text: "Radikale Vereinfachung des Steuersystems (einheitlicher Satz, Abbau von Ausnahmen)", idx: r(9,20,21,30,32,56,59,61,63,64,66,68) },
      { text: "Abschaffung der Luftverkehrsteuer; Senkung der Stromsteuer", idx: r(12,14,16,34,35,57,69) },
      { text: "Abschaffung/Kritik der Grundsteuerreform", idx: r(25,41,55) },
      { text: "Kritik an Verschwendung, Intransparenz und aufgeblähtem Verwaltungsapparat", idx: r(1,2,8,10,33,75,76) },
      { text: "Gastronomie-Umsatzsteuer einheitlich 7 %; Kfz-Steuer nach Gewicht/Leistung; MwSt-Differenzierung/Preisaufsicht ablehnen", idx: r(29,26,6,47,40) },
      { text: "Steuersenkungen statt Neuverschuldung; Ablehnung von Steuererhöhungen und Digitalsteuer", idx: r(17,23,31,38,43,58,62) },
      { text: "Bürokratieabbau für Bitcoin/Krypto; Kritik an Klima-/EU-Bürokratie und Doppelbesteuerung; Riester-Kritik", idx: r(65,71,72,73,5,15,49,3,11,19,22,36,37,39,51,52,54,60,77) },
    ],
    kurz: [
      { text: "Umfassender Bürokratieabbau und radikale Vereinfachung des Steuersystems (einheitlicher Satz, weniger Ausnahmen)", idx: r(0,4,7,13,18,24,27,28,42,44,45,46,48,50,53,67,70,74,9,20,21,30,32,56,59,61,63,64,66,68,39,51,52,54,60,77,36,37) },
      { text: "Abschaffung der Luftverkehrsteuer und Senkung der Stromsteuer; Abschaffung/Kritik der Grundsteuerreform", idx: r(12,14,16,34,35,57,69,25,41,55,3,11,19,22) },
      { text: "Steuersenkungen statt Neuverschuldung; Ablehnung von Steuererhöhungen, Digitalsteuer, MwSt-Differenzierung und Preisaufsicht", idx: r(17,23,31,38,43,58,62,29,26,6,47,40) },
      { text: "Kritik an Verschwendung und aufgeblähtem Verwaltungsapparat; Bürokratieabbau auch für Krypto", idx: r(1,2,8,10,33,75,76,65,71,72,73,5,15,49) },
    ],
  },
  {
    aspekt: "Steuervereinfachung / Bürokratie", partei: "CDU/CSU",
    lang: [
      { text: "Bürokratieabbau als Modernisierungsagenda (Ziel −25 % Bürokratiekosten), schnellere Verfahren", idx: r(0,10,14,18,24,25,27,30,31,39,43,47,53,56,59,62) },
      { text: "Stromsteuer-/Energiesteuersenkung vereinfacht das Recht (weniger Ausnahmen, Planbarkeit)", idx: r(2,4,8,28,49,50,54,57,63,65) },
      { text: "Senkung der Luftverkehrsteuer als Entlastung und Wettbewerbsvorteil", idx: r(1,7,19,60) },
      { text: "Forschungszulage unbürokratisch (Pauschalierung); Vereinfachung für Vereine/Ehrenamt", idx: r(15,34,35,40,22,23,38,52) },
      { text: "Maßvolle Vereinfachung statt radikaler Umwälzung; Komplexität aus Gerechtigkeitsanspruch", idx: r(9,12,13,36,64) },
      { text: "Gegen Preisaufsicht/Preiskontrollen als Bürokratiemonster; Umsatzsteuer-Systematik überarbeiten", idx: r(5,17,44,45,46) },
      { text: "Vorausgefüllte Steuererklärung/Digitalisierung; Vergabe-/Genehmigungsverfahren beschleunigen", idx: r(58,3,6,21,32,55) },
      { text: "Gegenfinanzierung einfordern; Tankrabatt bürokratiearm; Rundfunkbeitrag nicht absetzbar; Föderalismus bei Grundsteuer; Transparenz", idx: r(41,61,29,33,66,11,16,20,26,37,42,48,51) },
    ],
    kurz: [
      { text: "Bürokratieabbau (Ziel −25 %), schnellere Verfahren, Digitalisierung und vorausgefüllte Steuererklärung", idx: r(0,10,14,18,24,25,27,30,31,39,43,47,53,55,56,59,62,58,3,6,21,32) },
      { text: "Stromsteuer-/Energiesteuersenkung vereinfacht das Recht; Senkung der Luftverkehrsteuer", idx: r(2,4,8,28,49,50,54,57,63,65,1,7,19,60) },
      { text: "Forschungszulage und Vereins-/Ehrenamt entbürokratisieren; maßvolle statt radikaler Vereinfachung", idx: r(15,34,35,40,22,23,38,52,9,12,13,36,64) },
      { text: "Gegen Preisaufsicht; Umsatzsteuer-Systematik überarbeiten; Gegenfinanzierung einfordern; Einzelpunkte", idx: r(5,17,44,45,46,41,61,29,33,66,11,16,20,26,37,42,48,51) },
    ],
  },
  {
    aspekt: "Steuervereinfachung / Bürokratie", partei: "GRÜNE",
    lang: [
      { text: "Schließung von Gerechtigkeitslücken und Privilegien im Steuersystem", idx: r(1,2,3,7,18,27) },
      { text: "Strukturelle Reform der Umsatzsteuer statt punktueller Maßnahmen (Flickenteppich)", idx: r(11,19,23,9) },
      { text: "Luftverkehr/Privatjets stärker besteuern; Kerosin besteuern; Kfz-Steuer als Bonus-Malus; gegen Plug-in-Hybrid-Subvention", idx: r(0,21,22,8) },
      { text: "Vereinfachung durch höheren Arbeitnehmerpauschbetrag/Grundfreibetrag; Ehrenamtspauschale; Tax Law Clinics", idx: r(13,16,12,20) },
      { text: "Einheitliche Stromsteuer statt „Bürokratieirrsinn“; Tankrabatt vs. Stromsteuer; Direktauszahlung statt MwSt-Senkung", idx: r(24,25,28) },
      { text: "Längere Aufbewahrungsfristen; Streichung veralteter Gewerbesteuer-Regelungen; Bankenabgaben-Mittel; widersprüchliche Sätze; AfD-Antrag ideenlos", idx: r(15,4,10,14,5,6,17,26) },
    ],
    kurz: [
      { text: "Schließung von Gerechtigkeitslücken/Privilegien; strukturelle Umsatzsteuerreform statt Flickenteppich", idx: r(1,2,3,7,18,27,11,19,23,9) },
      { text: "Luftverkehr/Privatjets/Kerosin besteuern; Kfz-Bonus-Malus; einheitliche Stromsteuer; Direktauszahlung statt MwSt-Senkung", idx: r(0,21,22,8,24,25,28) },
      { text: "Vereinfachung durch höheren Pauschbetrag/Grundfreibetrag; längere Aufbewahrungsfristen; Einzelpunkte", idx: r(13,16,12,20,15,4,10,14,5,6,17,26) },
    ],
  },
  {
    aspekt: "Steuervereinfachung / Bürokratie", partei: "LINKE",
    lang: [
      { text: "Mehrwertsteuer auf Grundnahrungsmittel streichen; Kritik an unlogischen Satzdifferenzierungen", idx: r(0,11,13) },
      { text: "Strukturelle Neuordnung der Steuerverteilung Bund/Länder/Kommunen; Vermögensteuer für Superreiche", idx: r(1,4) },
      { text: "Kritik an AfD-Vereinfachung als Begünstigung Reicher; Bürokratieabbau-Rhetorik ohne echte Reform", idx: r(9,12,21,3,6) },
      { text: "Krypto-Haltefrist abschaffen; gegen verkürzte Aufbewahrungsfristen; Fremdbesitzverbot Steuerberatung verschärfen", idx: r(7,14,20) },
      { text: "Gerechtere Steuerstrukturen im Verkehr; Schlupflöcher schließen; Kritik an Stromsteuer-Umsetzung; antragsloses Kindergeld; Gewerkschaftsbeitrag; Einmalzahlung", idx: r(17,18,16,19,8,5,10,15,2) },
    ],
    kurz: [
      { text: "MwSt auf Grundnahrungsmittel streichen; Neuordnung der Steuerverteilung; Vermögensteuer für Superreiche", idx: r(0,11,13,1,4) },
      { text: "Kritik an AfD-Vereinfachung als Begünstigung Reicher; Bürokratie-Rhetorik ohne echte Reform", idx: r(9,12,21,3,6) },
      { text: "Krypto-Haltefrist abschaffen, lange Aufbewahrungsfristen; gerechtere Verkehrssteuern, Schlupflöcher schließen; Einzelpunkte", idx: r(7,14,20,17,18,16,19,8,5,10,15,2) },
    ],
  },
  {
    aspekt: "Steuervereinfachung / Bürokratie", partei: "SPD",
    lang: [
      { text: "Bürokratieabbau als Entlastungspolitik (Modernisierung, −25 % Kosten, weniger Anträge)", idx: r(0,4,8,22,24) },
      { text: "Strukturelle Umsatzsteuerreform statt punktueller Maßnahmen/Preiskontrollen; Mehrwertsteuersenkung auf Speisen vereinfacht", idx: r(5,16,18) },
      { text: "Gegen pauschale „Rasenmäher“-Streichung von Sonderregelungen; gegen unfinanzierte AfD-Vorschläge", idx: r(2,6,9,14,19) },
      { text: "Vereinfachung im Stromsteuerrecht für erneuerbare Energien und E-Mobilität", idx: r(3,7,17) },
      { text: "Senkung der Luftverkehrsteuer als strukturelle Maßnahme (vollständige Abschaffung nicht leistbar)", idx: r(1,21) },
      { text: "Digitalsteuer klar definieren; Lohnsteuerhilfe-Zugang erweitern; Aufbewahrungsfristen; Gewerkschaftsbeiträge; Erbschaftsteuer vereinfachen; Ehrenamt", idx: r(13,20,11,12,15,23,10) },
    ],
    kurz: [
      { text: "Bürokratieabbau als Entlastung (−25 % Kosten); Vereinfachung im Stromsteuerrecht für Erneuerbare/E-Mobilität", idx: r(0,4,8,22,24,3,7,17) },
      { text: "Strukturelle Umsatzsteuerreform statt punktueller Maßnahmen; gegen „Rasenmäher“-Streichung und unfinanzierte AfD-Vorschläge", idx: r(5,16,18,2,6,9,14,19) },
      { text: "Senkung der Luftverkehrsteuer; Digitalsteuer definieren; Lohnsteuerhilfe-Zugang; Einzelpunkte", idx: r(1,21,13,20,11,12,15,23,10) },
    ],
  },

  // ============================ Vermögensteuer ============================
  {
    aspekt: "Vermögensteuer", partei: "AfD",
    lang: [
      { text: "Ablehnung der Vermögensteuer (Doppel-/Substanzbesteuerung, Kapitalflucht, Verfassungs- und Verwaltungsprobleme)", idx: r(0,1,2,3,4,6,7,8,9,10,11,12,13,14) },
      { text: "Stattdessen privater Vermögensaufbau (Junior-Spardepot)", idx: r(5) },
    ],
    kurz: [
      { text: "Ablehnung der Vermögensteuer (Substanzbesteuerung, Kapitalflucht, Verfassungsprobleme)", idx: r(0,1,2,3,4,6,7,8,9,10,11,12,13,14) },
      { text: "Stattdessen privater Vermögensaufbau (Junior-Spardepot)", idx: r(5) },
    ],
  },
  {
    aspekt: "Vermögensteuer", partei: "CDU/CSU",
    lang: [
      { text: "Ablehnung der Wiedereinführung (Verfassungswidrigkeit, Kapitalflucht, Verwaltungsaufwand, Investitionshemmnis)", idx: r(0,1,2,3,4,5,6,7) },
    ],
    kurz: [
      { text: "Ablehnung der Wiedereinführung der Vermögensteuer (Verfassung, Kapitalflucht, Verwaltungsaufwand)", idx: r(0,1,2,3,4,5,6,7) },
    ],
  },
  {
    aspekt: "Vermögensteuer", partei: "GRÜNE",
    lang: [
      { text: "Befürwortung der Besteuerung großer Vermögen/Milliardäre als Gerechtigkeitsfrage", idx: r(0,1,4,5,6,9) },
      { text: "Vermögenskonzentration und ungerechte Steuerbelastung als Kernproblem; Vermögensaufbau für die Mitte", idx: r(2,3,7,8) },
    ],
    kurz: [
      { text: "Befürwortung der Besteuerung großer Vermögen/Milliardäre als Gerechtigkeitsfrage", idx: r(0,1,4,5,6,9) },
      { text: "Vermögenskonzentration als Kernproblem; Vermögensaufbau für die Mitte", idx: r(2,3,7,8) },
    ],
  },
  {
    aspekt: "Vermögensteuer", partei: "LINKE",
    lang: [
      { text: "Wiedereinführung/Reaktivierung der Vermögensteuer (ausgesetzt seit 1997)", idx: r(1,2,4,17,22,25) },
      { text: "Höhe und Aufkommen: 1 % für Millionäre/Milliardäre, bis zu ~100–147 Mrd. Euro jährlich", idx: r(0,3,20) },
      { text: "Finanzierungszweck: Länder/Kommunen, Infrastruktur und Soziales statt Kürzungen", idx: r(8,9,16,23) },
      { text: "Gegen Vermögenskonzentration/Ungleichheit; Besteuerung von Superreichen; globale Vermögensteuer", idx: r(5,6,7,10,11,12,13,14,15,18,19,21,24) },
    ],
    kurz: [
      { text: "Wiedereinführung der Vermögensteuer (1 % für Millionäre/Milliardäre, bis zu ~147 Mrd. €/Jahr)", idx: r(1,2,4,17,22,25,0,3,20) },
      { text: "Für Länder/Kommunen, Infrastruktur und Soziales statt Kürzungen; gegen Vermögenskonzentration; globale Vermögensteuer", idx: r(8,9,16,23,5,6,7,10,11,12,13,14,15,18,19,21,24) },
    ],
  },
  {
    aspekt: "Vermögensteuer", partei: "SPD",
    lang: [
      { text: "Befürwortung einer modernen Vermögensbesteuerung gegen extreme Vermögenskonzentration", idx: r(0,6,9,10) },
      { text: "Vermögensungleichheit als demokratisches/soziales Problem; Kritik an Privilegien", idx: r(1,2,3,5) },
      { text: "Doppelbesteuerungs-Kritik zurückweisen; gerechte Besteuerung von Vermögen, auch global; hohe Freibeträge/Stundung für Betriebe", idx: r(4,7,8,11) },
    ],
    kurz: [
      { text: "Befürwortung einer modernen Vermögensbesteuerung gegen extreme Vermögenskonzentration", idx: r(0,6,9,10,1,2,3,5) },
      { text: "Gerechte Besteuerung von Vermögen (auch global), hohe Freibeträge/Stundung für Betriebe; Doppelbesteuerungs-Kritik zurückgewiesen", idx: r(4,7,8,11) },
    ],
  },

  // ============================ Übergewinnsteuer ============================
  {
    aspekt: "Übergewinnsteuer", partei: "AfD",
    lang: [
      { text: "Ablehnung der Übergewinn- und Milliardärssteuer (unwirksam, verfassungsrechtlich problematisch)", idx: r(0,1,2,3) },
    ],
    kurz: [
      { text: "Ablehnung der Übergewinn-/Milliardärssteuer als unwirksam und verfassungsrechtlich problematisch", idx: r(0,1,2,3) },
    ],
  },
  {
    aspekt: "Übergewinnsteuer", partei: "CDU/CSU",
    lang: [
      { text: "Skepsis/Ablehnung der Übergewinnsteuer (Begriffskritik, Weiterwälzung auf Verbraucher)", idx: r(0,3) },
      { text: "Ablehnung einer Sondersteuer auf Luxusflüge als ineffektiv; Luftverkehrsteuer senken", idx: r(1,2) },
    ],
    kurz: [
      { text: "Skepsis/Ablehnung der Übergewinnsteuer (Weiterwälzung); Ablehnung einer Luxusflugsteuer", idx: r(0,3,1,2) },
    ],
  },
  {
    aspekt: "Übergewinnsteuer", partei: "GRÜNE",
    lang: [
      { text: "Befürwortung der Abschöpfung von Übergewinnen der Öl-/Gaskonzerne (preisdämpfend, Krisengewinne)", idx: r(1,2,3,4,5,7,8) },
      { text: "Luftverkehr nach Verursacherprinzip/Klimawirkung differenziert besteuern", idx: r(0) },
      { text: "Erwähnung als Teil eines Maßnahmenbündels", idx: r(6) },
    ],
    kurz: [
      { text: "Befürwortung der Übergewinnabschöpfung bei Öl-/Gaskonzernen (preisdämpfend)", idx: r(1,2,3,4,5,7,8) },
      { text: "Luftverkehr nach Verursacherprinzip differenziert besteuern", idx: r(0,6) },
    ],
  },
  {
    aspekt: "Übergewinnsteuer", partei: "LINKE",
    lang: [
      { text: "Übergewinnsteuer auf fossile Energiekonzerne zur Finanzierung von Krisengeld/9-Euro-Ticket", idx: r(0,2,3,4,6,7,8,9,10,11) },
      { text: "Übergewinnsteuer auch im Agrarsektor; Vielfliegersteuer statt Senkung der Luftverkehrsteuer", idx: r(1,5) },
    ],
    kurz: [
      { text: "Übergewinnsteuer auf fossile Energiekonzerne (Krisengeld/9-Euro-Ticket); auch Agrarsektor", idx: r(0,2,3,4,6,7,8,9,10,11,1) },
      { text: "Vielfliegersteuer statt Senkung der Luftverkehrsteuer", idx: r(5) },
    ],
  },
  {
    aspekt: "Übergewinnsteuer", partei: "SPD",
    lang: [
      { text: "Befürwortung einer Übergewinnsteuer auf Mineralölkonzerne zur Entlastung in Krisenzeiten (auch auf EU-Ebene)", idx: r(1,2,3,4,5,7) },
      { text: "Besteuerung von Luxusflügen; Offenheit abhängig von der Lageentwicklung", idx: r(0,6) },
    ],
    kurz: [
      { text: "Befürwortung einer Übergewinnsteuer auf Mineralölkonzerne (auch EU-Ebene); Besteuerung von Luxusflügen", idx: r(1,2,3,4,5,7,0,6) },
    ],
  },
];

const upd = db.prepare(
  `UPDATE partei_aspekt_gold SET synthese_json=?, synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`,
);

function resolve(rede: string[], bullets: B[], label: string): { text: string; refs: string[] }[] {
  const out = bullets.map((b) => ({ text: b.text, refs: b.idx.map((i) => rede[i]) }));
  const used = bullets.flatMap((b) => b.idx);
  const dup = used.filter((i, k) => used.indexOf(i) !== k);
  const missing = rede.map((_, i) => i).filter((i) => !used.includes(i));
  const bad = used.filter((i) => i < 0 || i >= rede.length);
  if (dup.length) console.log(`    ⚠ ${label}: doppelte Indizes ${[...new Set(dup)].join(",")}`);
  if (missing.length) console.log(`    ⚠ ${label}: nicht zugeordnete Reden-Indizes ${missing.join(",")}`);
  if (bad.length) console.log(`    ⚠ ${label}: ungültige Indizes ${bad.join(",")}`);
  return out;
}

let ok = 0;
for (const c of CELLS) {
  const row = db
    .prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`)
    .get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const lang = resolve(rede, c.lang, `${c.aspekt}/${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.aspekt}/${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, c.aspekt, c.partei);
  ok++;
  console.log(`  ✓ ${c.aspekt} / ${c.partei}: ${rede.length} Reden → ${lang.length} lang / ${kurz.length} kompakt`);
}
console.log(`\n${ok}/${CELLS.length} Zellen aktualisiert.`);
db.close();
