/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Aspekte „Bürokratie abbauen",
 * „Kartellrecht / Wettbewerbsaufsicht", „Subventionen für grüne Technik / E-Mobilität".
 * Index-basiert; beide Varianten.
 *   npx tsx scripts/gold-synthese-pilot-7.ts
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";

const CELLS: Cell[] = [
  // ============ BÜROKRATIE ABBAUEN ============
  { aspekt: "Bürokratie abbauen", partei: "AfD",
    lang: [
      { text: "Radikaler, umfassender Bürokratieabbau als zentraler Wachstums- und Standortfaktor (beziffert: 146 Mrd. € Kosten/Jahr, 325.000 Stellen, 32 Mrd. € Wachstumseffekt laut DIW)", idx: [3,5,7,8,9,10,13,17,18,19,23,25,27,29,30,31,32,35,39,42,43,45,46,47,48,59,60,69,71,73,74,75,76,80,83,84,88,89,90,91,92,97,98,100,107,118] },
      { text: "Lieferkettengesetz (LkSG/CSDDD), Nachhaltigkeitsberichte, ESG und Taxonomie abschaffen", idx: [1,2,4,12,21,61,66] },
      { text: "EU-Überregulierung kritisieren; nationale Umsetzung ohne Gold-Plating; gegen konkrete EU-Verordnungen (Batterie, Bauprodukte, Ladesäulen, CBAM, KI, Data Act, Ökodesign, digitaler Produktpass, CO₂-Bürokratie)", idx: [11,14,41,44,52,54,55,57,58,62,65,94,95,96,101,102,103,109,110,114,115,117,119,120] },
      { text: "Steuerrecht und Steuerbürokratie radikal vereinfachen (Formulare, Gewerbesteuer, Umsatzsteuer Gastronomie, Erbschaft-/Vermögensteuer-Aufwand)", idx: [0,20,36,37,38,51,53,64,82,99,108] },
      { text: "Regierungs- und EU-Maßnahmen als symbolisch/unzureichend/kontraproduktiv (mehr statt weniger Bürokratie); konkrete „Bürokratiemonster“ (Tariftreuegesetz, Digitalsteuer, Modernisierungsagenda, BRUBEG)", idx: [6,15,16,24,26,28,33,34,40,56,63,67,68,70,72,77,78,79,85,86,87,93,112,113,116] },
      { text: "Genehmigungs- und Vergabeverfahren beschleunigen und vereinfachen", idx: [22,49,50,81,104,105,106,111] },
    ],
    kurz: [
      { text: "Radikaler Bürokratieabbau als zentraler Wachstums- und Standortfaktor (beziffert: 146 Mrd. € Kosten, 325.000 Stellen); Genehmigungs- und Vergabeverfahren beschleunigen", idx: [3,5,7,8,9,10,13,17,18,19,22,23,25,27,29,30,31,32,35,39,42,43,45,46,47,48,49,50,59,60,69,71,73,74,75,76,80,81,83,84,88,89,90,91,92,97,98,100,104,105,106,107,111,118] },
      { text: "Lieferkettengesetz/Nachhaltigkeitsberichte/ESG abschaffen; Steuerrecht und Steuerbürokratie radikal vereinfachen", idx: [0,1,2,4,12,20,21,36,37,38,51,53,61,64,66,82,99,108] },
      { text: "EU-Überregulierung kritisieren — Umsetzung ohne Gold-Plating, gegen konkrete EU-Verordnungen (CBAM, KI, Data Act, Ökodesign, Produktpass, Batterie, Ladesäulen)", idx: [11,14,41,44,52,54,55,57,58,62,65,94,95,96,101,102,103,109,110,114,115,117,119,120] },
      { text: "Regierungsmaßnahmen als symbolisch/kontraproduktiv kritisiert — konkrete „Bürokratiemonster“ (Tariftreuegesetz, Digitalsteuer, BRUBEG)", idx: [6,15,16,24,26,28,33,34,40,56,63,67,68,70,72,77,78,79,85,86,87,93,112,113,116] },
    ] },
  { aspekt: "Bürokratie abbauen", partei: "CDU/CSU",
    lang: [
      { text: "Bürokratieabbau als zentrales Standortthema; Regierungs-/Unionsmaßnahmen (25 % weniger Bürokratiekosten, 16 Mrd. € Entlastung, Modernisierungsagenda, Entbürokratisierungsbeauftragte, 24-Stunden-Gründung)", idx: [1,5,8,9,10,13,18,19,20,21,22,26,27,28,30,34,36,39,48,49,51,54,55,57,58,59,60,61,63,66,70,73,74,75,76,82,83,85,87,89,90,91,92,94,95,96,103,104,107,109] },
      { text: "Lieferkettengesetz vereinfachen bzw. abschaffen zugunsten einer bürokratiearmen EU-Lösung", idx: [0,2,3,6,50,62,100] },
      { text: "Gold-Plating-Verbot — EU-Recht ohne Übererfüllung, einheitliche EU-Regelwerke statt 27 nationaler; schlanke Banken-/Digitalregulierung", idx: [11,25,31,35,45,52,53,68,69,80,81,88,102,105,106] },
      { text: "Steuerbürokratie, Vereine und Forschungszulage vereinfachen (Pauschalierung, Nachweispflichten streichen)", idx: [4,7,14,43,47,101] },
      { text: "Vergabe-, Planungs- und Genehmigungsverfahren beschleunigen (auch Wasserstoff-Beschleunigungsgesetz)", idx: [15,23,29,38,40,46,72,77,78,79,84,93,97,98,99,108] },
      { text: "Personalabbau in Bundesbehörden, keine neuen Behörden, schlanke KI-Aufsicht", idx: [12,33,44,86] },
      { text: "Energie- und E-Mobilitäts-Verfahren vereinfachen (Stromsteuerrecht, Ladesäulen, GEG, Wärmeplanung entkoppeln)", idx: [16,17,37,41,42,56] },
      { text: "Abbau mit Augenmaß: Schutzstandards erhalten, strukturiert statt pauschal, gegen pauschale Verbote", idx: [24,32,64,65,67,71] },
    ],
    kurz: [
      { text: "Bürokratieabbau als zentrales Standortthema; Regierungs-/Unionsmaßnahmen (25 % weniger Kosten, 16 Mrd. € Entlastung, Modernisierungsagenda, 24-Stunden-Gründung)", idx: [1,5,8,9,10,13,18,19,20,21,22,26,27,28,30,34,36,39,48,49,51,54,55,57,58,59,60,61,63,66,70,73,74,75,76,82,83,85,87,89,90,91,92,94,95,96,103,104,107,109] },
      { text: "Lieferkettengesetz vereinfachen/abschaffen (EU-Lösung); Gold-Plating-Verbot, einheitliche EU-Regeln; Steuerbürokratie vereinfachen", idx: [0,2,3,4,6,7,11,14,25,31,35,43,45,47,50,52,53,62,68,69,80,81,88,100,101,102,105,106] },
      { text: "Vergabe-, Planungs- und Genehmigungsverfahren beschleunigen (Wasserstoff); Personalabbau in Behörden; Energie-/E-Mobilitäts-Verfahren vereinfachen", idx: [12,15,16,17,23,29,33,37,38,40,41,42,44,46,56,72,77,78,79,84,86,93,97,98,99,108] },
      { text: "Abbau mit Augenmaß — Schutzstandards erhalten, strukturiert statt pauschal", idx: [24,32,64,65,67,71] },
    ] },
  { aspekt: "Bürokratie abbauen", partei: "GRÜNE",
    lang: [
      { text: "Bürokratieabbau ja, aber durch Vereinfachung, Digitalisierung und Verwaltungsumbau — nicht durch Deregulierung oder Absenkung von Schutzstandards", idx: [2,7,9,10,11,14] },
      { text: "Bürokratie als Standortnachteil anerkannt — konkrete Erleichterungen gefordert (Vergabe, Genehmigung, Start-ups, Reallabore)", idx: [1,4,8,13,15,18,19] },
      { text: "Lieferkettensorgfaltspflichten sind notwendige Regulierung, keine bloße Bürokratie", idx: [0] },
      { text: "Warnung: Bürokratieabbau nicht als Vorwand für Arbeitsschutz-Schwächung oder unterbesetzte Behörden", idx: [12,16] },
      { text: "Förderdschungel und Stabsstellen abbauen; einheitliche Stromsteuer statt differenzierter Regelungen; Hafenförderung entbürokratisieren", idx: [3,5,17] },
      { text: "Warnung, dass die Verordnungsumsetzung selbst unnötige Bürokratie bringen könnte", idx: [6] },
    ],
    kurz: [
      { text: "Bürokratieabbau durch Vereinfachung, Digitalisierung und Verwaltungsumbau — nicht durch Deregulierung/Absenkung von Schutzstandards", idx: [2,6,7,9,10,11,14] },
      { text: "Bürokratie als Standortnachteil anerkannt — konkrete Erleichterungen (Vergabe, Genehmigung, Start-ups/Reallabore, Förderdschungel, einheitliche Stromsteuer)", idx: [1,3,4,5,8,13,15,17,18,19] },
      { text: "Lieferkettensorgfaltspflichten als notwendige Regulierung; Abbau nicht als Vorwand für Arbeitsschutz-Schwächung/unterbesetzte Behörden", idx: [0,12,16] },
    ] },
  { aspekt: "Bürokratie abbauen", partei: "LINKE",
    lang: [
      { text: "„Bürokratieabbau“ als Vorwand zur Deregulierung von Schutz-, Verbraucher-, Arbeits- und Sozialstandards kritisiert; Lieferketten-Compliance ist Gerechtigkeit, keine bloße Bürokratie", idx: [0,1,3,5,6,7,11,12] },
      { text: "Sinnvolle Entlastung anerkannt: Bündelung, digitale Verwaltung, bessere Förderprogramme; Kritik an ungleicher Last (kleine Betriebe vs. Konzerne)", idx: [2,4,8,10] },
      { text: "Regierungsmaßnahmen unzureichend und Ziele verfehlt; zu viel Bürokratie und zu langsame Genehmigungen gefährden die Transformation", idx: [9,13] },
    ],
    kurz: [
      { text: "„Bürokratieabbau“ als Vorwand zur Deregulierung von Schutz-/Arbeits-/Sozialstandards kritisiert; Lieferketten-Compliance ist Gerechtigkeit", idx: [0,1,3,5,6,7,11,12] },
      { text: "Sinnvolle Entlastung anerkannt (Bündelung, digitale Verwaltung, Förderprogramme); Kritik an ungleicher Last (kleine Betriebe vs. Konzerne)", idx: [2,4,8,10] },
      { text: "Regierungsmaßnahmen unzureichend; zu viel Bürokratie/langsame Genehmigungen gefährden die Transformation", idx: [9,13] },
    ] },
  { aspekt: "Bürokratie abbauen", partei: "SPD",
    lang: [
      { text: "Bürokratieabbau als Toppriorität — 25 % / 16 Mrd. € Entlastung, Modernisierungsagenda — aber mit Augenmaß (Arbeitnehmer- und Verbraucherschutz erhalten)", idx: [0,1,4,10,15,16,17,18,20,21,22,25] },
      { text: "Vergabe- und Beschaffungsverfahren vereinfachen und beschleunigen (Digitalisierung, höhere Wertgrenzen)", idx: [3,5,30,31,32] },
      { text: "Finanzsektor/Banken entbürokratisieren (Meldewesen, BRUBEG, KMU-Kredite, Compliance)", idx: [7,8,12,14,23,24,29] },
      { text: "Energie- und E-Mobilitäts-Verfahren vereinfachen (Stromsteuer, Anlagenverklammerung, Standortfördergesetz)", idx: [6,9,13] },
      { text: "Digitalisierung, Online-Gründung und Reallabore zur Entlastung", idx: [26,28,35] },
      { text: "Branchenerleichterungen (Mehrwertsteuer kleine Betriebe, Handwerk mit Genehmigungsfiktionen/Schutzzonen, Beratungsstellen, LkSG-Berichtspflichten streichen)", idx: [2,11,19,27,33,34] },
    ],
    kurz: [
      { text: "Bürokratieabbau als Toppriorität (25 % / 16 Mrd. €, Modernisierungsagenda) — aber mit Augenmaß (Schutzstandards erhalten)", idx: [0,1,4,10,15,16,17,18,20,21,22,25] },
      { text: "Vergabe-, Finanzsektor- und Energie-/E-Mobilitäts-Verfahren vereinfachen und beschleunigen", idx: [3,5,6,7,8,9,12,13,14,23,24,29,30,31,32] },
      { text: "Digitalisierung/Online-Gründung/Reallabore; Branchenerleichterungen (Handwerk, kleine Betriebe, LkSG-Berichtspflichten)", idx: [2,11,19,26,27,28,33,34,35] },
    ] },

  // ============ KARTELLRECHT / WETTBEWERBSAUFSICHT ============
  { aspekt: "Kartellrecht / Wettbewerbsaufsicht", partei: "AfD",
    lang: [
      { text: "Für fairen Wettbewerb und gleiche Wettbewerbsbedingungen (national/international, gegen Unterlaufen von Standards durch China, gegen Subunternehmerketten)", idx: [0,2,4,7,14,23,25] },
      { text: "Wettbewerbsverzerrung durch staatliche Maßnahmen, Subventionen und Branchenbevorzugung kritisiert (z.B. Wärmepumpen, Großkonzerne)", idx: [3,10,22] },
      { text: "EU-Wettbewerbspolitik und -Regulierung als wettbewerbsfeindlich (Nachteil ggü. US-Banken)", idx: [6,9,12,17,24] },
      { text: "Marktkonzentration (Lebensmittelhandel, Energiemarkt) — Kartellbekämpfung gefordert", idx: [11,20] },
      { text: "Kartellverfahren als langsam/unwirksam kritisiert (Spritpreise, Ölkonzerne); Boykottverbote für steuerbegünstigte Organisationen", idx: [15,16,19,21] },
      { text: "Plattformbetreiber-Verantwortung (KMU vs. große Plattformen); bestehende Instrumente reichen, Marktlösungen statt Zwang", idx: [1,5,8,13,18] },
    ],
    kurz: [
      { text: "Für fairen Wettbewerb und gleiche Bedingungen (national/international); Wettbewerbsverzerrung durch Subventionen und Branchenbevorzugung kritisiert", idx: [0,2,3,4,7,10,14,22,23,25] },
      { text: "EU-Wettbewerbspolitik/Regulierung als wettbewerbsfeindlich; Plattform-Verantwortung, bestehende Instrumente reichen (Marktlösungen)", idx: [1,5,6,8,9,12,13,17,18,24] },
      { text: "Marktkonzentration (Lebensmittel, Energie) — Kartellbekämpfung gefordert, Kartellverfahren aber als langsam/unwirksam kritisiert", idx: [11,15,16,19,20,21] },
    ] },
  { aspekt: "Kartellrecht / Wettbewerbsaufsicht", partei: "CDU/CSU",
    lang: [
      { text: "Wettbewerbsfähigkeit des Standorts als zentrale Aufgabe (Grundlage für Arbeitsplätze)", idx: [0,1,20] },
      { text: "Faire Wettbewerbsbedingungen schaffen (gegen Greenwashing, Billigimporte, Dark Patterns, Drittstaaten-Banken; Online/Offline-Gleichbehandlung)", idx: [2,3,4,5,11,12,13,15,26] },
      { text: "Digitalkonzerne/Internetgiganten stärker in Verantwortung nehmen (Marktmacht, Werbeerlöse, Medienfinanzierung, fairer Datenzugang)", idx: [6,7,8,9,10,14] },
      { text: "Kartellrecht gegen Mineralölkonzerne verschärfen (Beweislastumkehr § 29a GWB, Missbrauchsaufsicht, hohe Bußgelder, Bundeskartellamt stärken)", idx: [16,17,18,19,21,22,24,25] },
      { text: "Emissionshandel als marktwirtschaftliches Instrument flexibler gestalten", idx: [23] },
    ],
    kurz: [
      { text: "Wettbewerbsfähigkeit des Standorts und faire Wettbewerbsbedingungen (gegen Greenwashing, Billigimporte, Dark Patterns, Online/Offline-Gleichbehandlung)", idx: [0,1,2,3,4,5,11,12,13,15,20,26] },
      { text: "Digitalkonzerne/Internetgiganten stärker in Verantwortung nehmen (Marktmacht, Werbeerlöse, Medienfinanzierung, fairer Datenzugang)", idx: [6,7,8,9,10,14] },
      { text: "Kartellrecht gegen Mineralölkonzerne verschärfen (Beweislastumkehr, Bußgelder, Bundeskartellamt stärken); Emissionshandel flexibler", idx: [16,17,18,19,21,22,23,24,25] },
    ] },
  { aspekt: "Kartellrecht / Wettbewerbsaufsicht", partei: "GRÜNE",
    lang: [
      { text: "Scharfes Wettbewerbsrecht und starkes Kartellamt gegen Marktmachtmissbrauch (Energie-/Mineralöl-Oligopole); da Kartellrecht bei Spritpreisen versagt hat → Übergewinnsteuer", idx: [5,6,7,9] },
      { text: "Regulierung von (US-)Techkonzernen und Onlineplattformen gegen Marktkonzentration (Interoperabilität, Data Act, europäische Digitalgesetze)", idx: [1,2,3,8] },
      { text: "Schutz vor verzerrtem internationalem Wettbewerb (chinesische Überkapazitäten, Drittstaaten-Anbieter) durch EU-Schutzzölle/Rechtsdurchsetzung", idx: [0,10] },
      { text: "Private Credit regulieren (Transparenz/Risiken); Preistransparenz und Sanktionen bei Ladesäulen", idx: [4,11] },
    ],
    kurz: [
      { text: "Starkes Kartellamt/scharfes Wettbewerbsrecht gegen Marktmacht (Energie/Mineralöl-Oligopole, Übergewinnsteuer) und gegen verzerrten internationalen Wettbewerb (China, Drittstaaten)", idx: [0,5,6,7,9,10] },
      { text: "Tech-/Onlineplattformen und Private Credit regulieren (Marktkonzentration, Interoperabilität, Transparenz/Sanktionen, Ladesäulen)", idx: [1,2,3,4,8,11] },
    ] },
  { aspekt: "Kartellrecht / Wettbewerbsaufsicht", partei: "LINKE",
    lang: [
      { text: "Echte Preisaufsicht und Transparenz gegen Abzocke (Tankstellen, Einzelhandel) — Kartellamt allein reicht nicht; Übergewinne der Ölkonzerne abschöpfen", idx: [0,6,7,8] },
      { text: "Techmonopole und marktbeherrschende Konzerne konsequent regulieren (auch das Machtproblem im Reparaturmarkt)", idx: [3,9] },
      { text: "Ungleiche Regulierungslast (kleine Betriebe/NGOs vs. Konzerne); gegen Investor-Schiedsgerichte", idx: [1,2] },
      { text: "Bankensektor: Kreditlenkung weg von Spekulation; Transparenz und Kontrolle bei Großaufträgen/Beschaffung", idx: [4,5] },
    ],
    kurz: [
      { text: "Echte Preisaufsicht gegen Abzocke (Tankstellen, Einzelhandel) und Übergewinnabschöpfung; Techmonopole/marktbeherrschende Konzerne (auch Reparaturmarkt) konsequent regulieren", idx: [0,3,6,7,8,9] },
      { text: "Ungleiche Regulierungslast (kleine vs. Konzerne), gegen Investor-Schiedsgerichte; Bankenkredite weg von Spekulation, Transparenz bei Großaufträgen", idx: [1,2,4,5] },
    ] },
  { aspekt: "Kartellrecht / Wettbewerbsaufsicht", partei: "SPD",
    lang: [
      { text: "Kartellrecht gegen Mineralölkonzerne verschärfen (Beweislastumkehr, Transparenzpflichten, Preiskontrolle, keine aufschiebende Wirkung von Rechtsbehelfen)", idx: [5,8,9,10,11,12,13] },
      { text: "Bundeskartellamt gegen marktbeherrschende Unternehmen und Preisabsprachen stärken, Verfahren vereinfachen", idx: [2,6,7] },
      { text: "Faire Wettbewerbsbedingungen durch verbindliche Regeln und EU-Harmonisierung (Sorgfaltspflichten, gegen Wettlauf nach unten); Schutz vor unfairer Auslandskonkurrenz; Digitalregulierung", idx: [0,1,3,4] },
    ],
    kurz: [
      { text: "Kartellrecht verschärfen und Bundeskartellamt stärken gegen Mineralölkonzerne und marktbeherrschende Unternehmen (Beweislastumkehr, Transparenz, Preiskontrolle)", idx: [2,5,6,7,8,9,10,11,12,13] },
      { text: "Faire Wettbewerbsbedingungen durch verbindliche Regeln/EU-Harmonisierung (Sorgfaltspflichten, gegen Wettlauf nach unten), Schutz vor unfairer Auslandskonkurrenz, Digitalregulierung", idx: [0,1,3,4] },
    ] },

  // ============ SUBVENTIONEN FÜR GRÜNE TECHNIK / E-MOBILITÄT ============
  { aspekt: "Subventionen für grüne Technik / E-Mobilität", partei: "AfD",
    lang: [
      { text: "Ablehnung von E-Auto-/Verbrenner-Subventionen als marktwidrig, technologieoffenheitsfeindlich und Steuerzahlerbelastung — einseitige Förderung zulasten des Verbrenners", idx: [1,2,3,4,12,14,20,29,30,31,32,34,40] },
      { text: "Ablehnung von Subventionen für Energiewende/Erneuerbare/Wind/PV/Wasserstoff/grünen Stahl als Geldverschwendung und ineffizient", idx: [5,6,7,8,10,11,16,17,18,22,26,27,28,35,36,37] },
      { text: "Generelle Kritik am Subventionssystem (Pleiten/Jobabbau, ideologische Umverteilung, Fördertöpfe statt Innovation, Wärmepumpen marktzerstörend) — Steueranreize statt Subventionen, Kürzungen", idx: [0,9,13,15,19,21,23,24,25,33,38,39] },
    ],
    kurz: [
      { text: "Ablehnung von Subventionen für E-Mobilität und grüne Energie (Erneuerbare, Wind/PV, Wasserstoff, grüner Stahl) als marktwidrig, ineffizient und Steuerzahlerbelastung", idx: [1,2,3,4,5,6,7,8,10,11,12,14,16,17,18,20,22,26,27,28,29,30,31,32,34,35,36,37,40] },
      { text: "Generelle Kritik am Subventionssystem (Pleiten, ideologische Umverteilung, Marktverzerrung) — Steueranreize statt Fördertöpfe, Kürzungen", idx: [0,9,13,15,19,21,23,24,25,33,38,39] },
    ] },
  { aspekt: "Subventionen für grüne Technik / E-Mobilität", partei: "CDU/CSU",
    lang: [
      { text: "E-Mobilität fördern über steuerliche Anreize (Abschreibungsbooster, höhere Dienstwagengrenze, Kfz-Steuerbefreiung), Ladeinfrastruktur, bidirektionales Laden, gestaffelte Prämie (auch Gebrauchtwagen)", idx: [0,1,2,6,8,9,15,18,21] },
      { text: "Technologieoffenheit statt Verbrennerverbot; ausgewogener Energiemix; Förderung von Zukunftstechnologien (Wind, Solar, Biomasse, Geothermie) gegen AfD-Kürzungen", idx: [3,7,19] },
      { text: "Kritik an ideologischer/einseitiger Ampel-Förderung (Wärmepumpen, E-Auto) — pragmatischer, gemäßigter Umbau mit Ausstiegsszenario statt Dauersubvention", idx: [4,5,10,11,12,13,14,16,20] },
      { text: "Mehrwertsteuersenkung in der Gastronomie", idx: [17] },
    ],
    kurz: [
      { text: "E-Mobilität fördern über steuerliche Anreize, Ladeinfrastruktur, gestaffelte Prämie (auch Gebrauchtwagen)", idx: [0,1,2,6,8,9,15,18,21] },
      { text: "Technologieoffenheit statt Verbrennerverbot; Zukunftstechnologien (Wind, Solar, Biomasse) fördern", idx: [3,7,19] },
      { text: "Kritik an ideologischer/einseitiger Ampel-Förderung (Wärmepumpen, E-Auto) — pragmatischer Umbau mit Ausstiegsszenario statt Dauersubvention; Gastronomie-MwSt-Senkung", idx: [4,5,10,11,12,13,14,16,17,20] },
    ] },
  { aspekt: "Subventionen für grüne Technik / E-Mobilität", partei: "GRÜNE",
    lang: [
      { text: "E-Auto-Förderung ja, aber sozial gestaffelt (für Geringverdiener, Preisdeckel) und nur für in Europa gebaute Autos — Kritik an Förderung für Besserverdienende, Plug-in-Hybride/Range Extender", idx: [0,15,16,17,22] },
      { text: "Klimaschutzverträge und gezielte Förderung für E-Mobilität, Batteriezellen, Erneuerbare, Cleantech, Wasserstoff/Biogas — Kritik an mangelnder/gekürzter Umsetzung", idx: [2,4,5,11,13,18,19] },
      { text: "Kritik an falscher Ausgestaltung: Subventionen ohne Stromkostensenkung unwirksam; Kürzungspläne; Energiewirtschaftsgesetz-Reform gefährdet Investitionen; fehlende Klarheit für Zukunftstechnologien", idx: [1,7,9,12,20] },
      { text: "Umweltschädliche Subventionen (Pendlerpauschale, Agrardiesel, Luftverkehr) kritisiert; E-Fuels im Luftverkehr und gezielte statt pauschale Förderung", idx: [3,6,8,21] },
      { text: "Deutsche Autoindustrie liefert keine günstigen E-Autos — Anpassung an Marktnachfrage nötig; Anreize für Elektrifizierung als Krisenschutz", idx: [10,14] },
    ],
    kurz: [
      { text: "E-Auto-Förderung sozial gestaffelt und nur für europäische Produktion — gegen Förderung für Besserverdienende und Plug-in-Hybride", idx: [0,15,16,17,22] },
      { text: "Gezielte Förderung für E-Mobilität, Batteriezellen, Erneuerbare, Cleantech, Klimaschutzverträge — Kritik an gekürzter Umsetzung; deutsche Autoindustrie muss günstige E-Autos liefern", idx: [2,4,5,10,11,13,14,18,19] },
      { text: "Kritik an falscher Ausgestaltung (Subvention ohne Stromkostensenkung unwirksam, fehlende Klarheit); umweltschädliche Subventionen (Pendlerpauschale, Agrardiesel, Luftverkehr) zielgenau ersetzen", idx: [1,3,6,7,8,9,12,20,21] },
    ] },
  { aspekt: "Subventionen für grüne Technik / E-Mobilität", partei: "LINKE",
    lang: [
      { text: "Massiver Ausbau erneuerbarer Energien, Ladeinfrastruktur und grüner Technologien als Zukunftsbranche und Jobmotor (Industriepolitik)", idx: [1,2,3,4] },
      { text: "Kritik an ungerechter Förderung (begünstigt Besserverdienende in Städten); Subventionen an Arbeitsplatzgarantien binden (gegen Luftverkehr-Steuersenkung)", idx: [0,5] },
    ],
    kurz: [
      { text: "Massiver Ausbau erneuerbarer Energien, Ladeinfrastruktur und grüner Technologien als Zukunftsbranche und Jobmotor", idx: [1,2,3,4] },
      { text: "Kritik an ungerechter Förderung (begünstigt Besserverdienende); Subventionen an Arbeitsplatzgarantien binden", idx: [0,5] },
    ] },
  { aspekt: "Subventionen für grüne Technik / E-Mobilität", partei: "SPD",
    lang: [
      { text: "E-Auto-Förderung sozial gestaffelt (3 Mrd. € für kleine/mittlere Einkommen) plus Ladeinfrastruktur-Ausbau (500 Mio. € Mehrparteienhäuser, Masterplan 2030)", idx: [0,1,8,14,20] },
      { text: "Steuerliche Förderung und Kaufanreize für E-Mobilität (Betriebswagen, Abschreibungen, Kfz-Steuerbefreiung, Stromsteuer) bei Technologieoffenheit", idx: [2,3,4,5,6,9,15,16,17] },
      { text: "Staatliche Unterstützung für grüne Technik, Batteriezellfertigung, Erneuerbare und Wärmepumpen (sozial gestaffelt) zur Wettbewerbsfähigkeit und Unabhängigkeit von Fossilen", idx: [10,11,12,13] },
      { text: "Grüne Leitmärkte über öffentliche Beschaffung (Klimakriterien) für klimaneutralen Stahl/Zement; Wasserstoff-Beschleunigungsgesetz", idx: [7,18,19] },
    ],
    kurz: [
      { text: "E-Auto-Förderung sozial gestaffelt plus Ladeinfrastruktur; steuerliche Kaufanreize (Abschreibungen, Kfz-Steuerbefreiung) und Technologieoffenheit", idx: [0,1,2,3,4,5,6,8,9,14,15,16,17,20] },
      { text: "Staatliche Unterstützung für grüne Technik, Batteriezellfertigung, Erneuerbare und Wärmepumpen zur Wettbewerbsfähigkeit und Unabhängigkeit von Fossilen", idx: [10,11,12,13] },
      { text: "Grüne Leitmärkte über öffentliche Beschaffung (Klimakriterien) für klimaneutralen Stahl/Zement; Wasserstoff-Beschleunigungsgesetz", idx: [7,18,19] },
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
  const row = db.prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`).get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const lang = resolve(rede, c.lang, `${c.aspekt}/${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.aspekt}/${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, c.aspekt, c.partei);
  ok++;
}
console.log(`${ok}/${CELLS.length} Zellen aktualisiert.`);
db.close();
