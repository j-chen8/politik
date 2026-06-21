/**
 * MANUELLE Synthese (Claude Code, kein LLM) — letzter Batch: Lieferketten &
 * Rohstoffsicherheit, Forschung & Innovation, Mittelstand & Handwerk.
 * Index-basiert; beide Varianten.
 *   npx tsx scripts/gold-synthese-pilot-8.ts
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";

const CELLS: Cell[] = [
  // ============ LIEFERKETTEN & ROHSTOFFSICHERHEIT ============
  { aspekt: "Lieferketten & Rohstoffsicherheit", partei: "AfD",
    lang: [
      { text: "Lieferkettengesetz (LkSG/CSDDD) abschaffen — bürokratisch, ineffektiv und wettbewerbsschädlich für deutsche Unternehmen und KMU", idx: [1,2,3,4,8,18,20,21,22] },
      { text: "Rohstoffsouveränität zurückgewinnen — Importabhängigkeiten reduzieren durch Rohstoffabkommen, dezentrale Lager, Rohstoffdiplomatie im Kanzleramt und eigene Förderung; gegen EU-Zentralvorgaben", idx: [7,12,14,15,16,23,24,25,27,29] },
      { text: "Abhängigkeit von China/Ausland bei kritischen Rohstoffen, Batterien, Energie und Lebensmitteln als strategisches Risiko; Versorgungssicherheit und Resilienz", idx: [5,6,9,10,13,26,28,30,31,32,33] },
      { text: "Heimische Energie-Infrastruktur und strategische Güter im Land halten; direkte Gasimporte aus Russland", idx: [0,19] },
      { text: "Innovation, digitale Rückverfolgung und Industriepartnerschaften für Rohstoffe; Abkommen sichern Lieferketten", idx: [11,17] },
    ],
    kurz: [
      { text: "Lieferkettengesetz (LkSG/CSDDD) abschaffen — bürokratisch, ineffektiv, wettbewerbsschädlich", idx: [1,2,3,4,8,18,20,21,22] },
      { text: "Rohstoffsouveränität zurückgewinnen — Rohstoffabkommen, dezentrale Lager, Rohstoffdiplomatie, eigene Förderung; gegen EU-Zentralvorgaben", idx: [7,11,12,14,15,16,17,23,24,25,27,29] },
      { text: "Abhängigkeit von China/Ausland (Rohstoffe, Batterien, Energie, Lebensmittel) als strategisches Risiko; heimische Infrastruktur im Land halten, direkte Gasimporte aus Russland", idx: [0,5,6,9,10,13,19,26,28,30,31,32,33] },
    ] },
  { aspekt: "Lieferketten & Rohstoffsicherheit", partei: "CDU/CSU",
    lang: [
      { text: "Lieferkettengesetz vereinfachen und entschlacken statt abschaffen — bürokratiearme europäische Lösung, Menschenrechtsverantwortung beibehalten", idx: [1,2,3,4,5,11,19,20,21,22,23,24] },
      { text: "Lieferketten diversifizieren und Abhängigkeiten (v.a. China) abbauen — strategische Partnerschaften (Japan, Afrika); Rohstoffsicherheit als Kernaufgabe", idx: [8,9,10,12,15,16,17,25,26,28] },
      { text: "Staatliche Resilienz-Strategie: Kommission identifiziert Abhängigkeiten, Rohstofffonds/Deutschlandfonds, eigene Förderung", idx: [13,14,27,31] },
      { text: "Batterie- und Rohstoff-Recycling/Verarbeitung in Europa; Batterieentsorgung als Ressourcenschonung", idx: [7,18,30] },
      { text: "Kritische Infrastruktur für Lieferketten: Binnenschifffahrt, Mosel-Wasserstraße, Energiestandort, grenzüberschreitende Netze", idx: [0,6,29,32] },
    ],
    kurz: [
      { text: "Lieferkettengesetz vereinfachen/entschlacken (EU-Lösung) statt abschaffen, Menschenrechtsverantwortung beibehalten", idx: [1,2,3,4,5,11,19,20,21,22,23,24] },
      { text: "Lieferketten diversifizieren und China-Abhängigkeit abbauen (strategische Partnerschaften, Rohstofffonds, eigene Förderung/Recycling, Reserven)", idx: [7,8,9,10,12,13,14,15,16,17,18,25,26,27,28,30,31] },
      { text: "Kritische Infrastruktur für Lieferketten sichern (Binnenschifffahrt, Mosel, Energiestandort, Netze)", idx: [0,6,29,32] },
    ] },
  { aspekt: "Lieferketten & Rohstoffsicherheit", partei: "GRÜNE",
    lang: [
      { text: "Lieferkettentransparenz und Sorgfaltspflichten für Menschenrechte/Umwelt befürworten (einheitliche EU-Standards); gegen Abschwächung des Lieferkettengesetzes", idx: [0,1,4,9,10,12] },
      { text: "Strategische Rohstoffpolitik und Resilienz: Abhängigkeiten (v.a. China, Mikroelektronik) reduzieren, Risikomanagement, staatliche Unterstützung (DERA/Agenturen)", idx: [5,6,7,8,11,15,17] },
      { text: "Kreislaufwirtschaft/Recycling und europäische Verarbeitungskapazitäten zur Rohstoffunabhängigkeit; nachhaltige Batterielieferketten", idx: [2,3] },
      { text: "Chemieindustrie auf Gas als Rohstoff angewiesen — Abhängigkeit von Fossilen durch nachhaltige Alternativen reduzieren", idx: [13,14] },
      { text: "Fehlende Unterstützung für die Stahlindustrie unter Druck globaler Überkapazitäten", idx: [16] },
    ],
    kurz: [
      { text: "Lieferkettentransparenz und Sorgfaltspflichten (Menschenrechte/Umwelt, EU-Standards) verteidigen; Kreislaufwirtschaft und europäische Verarbeitung für Rohstoffunabhängigkeit", idx: [0,1,2,3,4,9,10,12] },
      { text: "Strategische Rohstoffpolitik und Resilienz — Abhängigkeiten (China, Mikroelektronik, fossile) reduzieren, Risikomanagement und staatliche Unterstützung (auch Stahlindustrie)", idx: [5,6,7,8,11,13,14,15,16,17] },
    ] },
  { aspekt: "Lieferketten & Rohstoffsicherheit", partei: "LINKE",
    lang: [
      { text: "Lieferkettengesetz als Menschenrechts-/Arbeitsschutz-Mindeststandard verteidigen — gegen Abschaffung/Abschwächung, für strengere Kontrollen und zivilrechtliche Haftung", idx: [0,1,3,6,7,8,10] },
      { text: "Rohstoffabhängigkeit reduzieren über öffentliche Planung, Recycling und internationale Kooperation statt marktbasierter Spekulation/privater Hortung; gegen Gasabhängigkeit", idx: [4,5,9] },
      { text: "Kritik an Abkommen, die Rohstoffe/Märkte auf Kosten ärmerer Länder sichern; an Geschäftsmodellen, die durch geringe Stückzahlen Lieferketten gefährden", idx: [2,11] },
    ],
    kurz: [
      { text: "Lieferkettengesetz als Menschenrechts-/Arbeitsschutz-Mindeststandard verteidigen — gegen Abschaffung, für strengere Kontrollen und Haftung", idx: [0,1,3,6,7,8,10] },
      { text: "Rohstoffabhängigkeit über öffentliche Planung, Recycling und internationale Kooperation reduzieren statt marktbasierter Spekulation; gegen Gasabhängigkeit", idx: [4,5,9] },
      { text: "Kritik an Abkommen zu Lasten ärmerer Länder und an Geschäftsmodellen, die Lieferketten gefährden", idx: [2,11] },
    ] },
  { aspekt: "Lieferketten & Rohstoffsicherheit", partei: "SPD",
    lang: [
      { text: "Lieferkettengesetz reformieren statt abschaffen — verbindliche, praktikable Standards für Menschenrechte/Umwelt und fairen Wettbewerb (EU-Richtlinie, empfindliche Bußgelder)", idx: [1,2,3,11,13] },
      { text: "Rohstoffsicherung als strategische Priorität: Diversifizierung, eigene Rohstoffindustrie/heimische Grundstoffe, Deutschlandfonds, Explorationsförderung, De-Risking statt De-Coupling", idx: [6,7,8,9,10,14,15,17,19,20] },
      { text: "Kreislaufwirtschaft/Recycling/Ökodesign zur Rohstoffsicherheit (Batterien, Schiffsrecycling); Umstieg auf erneuerbare Ressourcen statt fossiler Abhängigkeit", idx: [0,16,18,24] },
      { text: "Europäische/heimische Grundstoffe (Stahl, Zement) bevorzugen (Bonussysteme/Beschaffung); kritische Infrastruktur (Seehäfen, Logistik-Resilienz)", idx: [4,21,22,23] },
      { text: "Geopolitische Risiken und Fragmentierung; Lieferkettenprobleme der Automobilbranche seit Corona/Ukraine", idx: [5,12] },
    ],
    kurz: [
      { text: "Lieferkettengesetz reformieren statt abschaffen — verbindliche, praktikable Standards für Menschenrechte/Umwelt (EU-Richtlinie)", idx: [1,2,3,11,13] },
      { text: "Rohstoffsicherung als strategische Priorität (Diversifizierung, heimische Industrie, Deutschlandfonds, De-Risking statt De-Coupling); Kreislaufwirtschaft/Recycling und erneuerbare Ressourcen", idx: [0,6,7,8,9,10,14,15,16,17,18,19,20,24] },
      { text: "Europäische/heimische Grundstoffe bevorzugen (Stahl, Zement, Beschaffung), kritische Infrastruktur (Seehäfen, Logistik); geopolitische Risiken (Automobil seit Corona/Ukraine)", idx: [4,5,12,21,22,23] },
    ] },

  // ============ FORSCHUNG & INNOVATION ============
  { aspekt: "Forschung & Innovation", partei: "AfD",
    lang: [
      { text: "Innovation, Ingenieurskunst und Unternehmergeist statt staatlicher Vorgaben, Ideologie und Subventionswirtschaft; Technologieoffenheit und ergebnisoffene (nicht klimagesteuerte) Forschung", idx: [1,3,4,5,6,9,11,12,13,28,31] },
      { text: "EU-/Bundesregulierung (v.a. KI/AI Act) behindert Forschung und Wettbewerbsfähigkeit — Deregulierung im Wettbewerb mit USA/China", idx: [7,16,17,18,19,23,24,25,26,27,30] },
      { text: "Deutsche Forschung exzellent, aber Transferlücke (Patente → Produktion am Standort); Hochschulsystem benachteiligt riskante Projekte", idx: [10,21,22] },
      { text: "Innovation bei Recycling, Substitution und Rohstoffgewinnung (KI-Demontage, Düngertechnologie, Reallabore)", idx: [0,2,8,14,15,29] },
      { text: "Verteidigung von Unternehmenseigentum und Investitionen als innovationsnotwendig", idx: [20] },
    ],
    kurz: [
      { text: "Innovation, Ingenieurskunst und Unternehmergeist statt Ideologie und Subventionswirtschaft; Technologieoffenheit, ergebnisoffene Forschung, Eigentum/Investitionen als innovationsnotwendig", idx: [1,3,4,5,6,9,11,12,13,20,28,31] },
      { text: "EU-/KI-Regulierung behindert Forschung — Deregulierung im Wettbewerb mit USA/China", idx: [7,16,17,18,19,23,24,25,26,27,30] },
      { text: "Exzellenz mit Transferlücke (Patente→Produktion, Hochschulreform); Innovation bei Recycling/Substitution/Rohstoffen (Reallabore)", idx: [0,2,8,10,14,15,21,22,29] },
    ] },
  { aspekt: "Forschung & Innovation", partei: "CDU/CSU",
    lang: [
      { text: "Forschungszulage als unbürokratisches Instrument ausbauen (12 Mio. € Bemessungsgrenze, ohne Nachweispflicht) für Mittelstands-Innovation", idx: [0,1,2,3,4] },
      { text: "Entschlossene Investitionen in Schlüsseltechnologien (KI, Quanten, Mikroelektronik, Fusion 2 Mrd., Biotech, Hightech Agenda, sechs Schlüsselbereiche)", idx: [13,14,15,16,20,21,22,24,29,33,36] },
      { text: "Technologieoffenheit und Forschungsfreiheit statt ideologischer Vorgaben (CRISPR, kohlenstoffarme Moleküle, Wasserstoff, multiple Lösungen)", idx: [5,6,9,10,12,19,23,28,32,34,35,39,40] },
      { text: "Steuerliche/marktwirtschaftliche Anreize und Rahmenbedingungen statt direkter Förderung; Bürokratieabbau schafft Freiräume; Vermögensteuer gefährdet Innovation", idx: [7,8,11,25,47,49] },
      { text: "Datenzugang und Forschungsdatengesetze für Innovation; weniger restriktive Auflagen", idx: [26,27,37,38] },
      { text: "Innovationskraft von Unternehmen, Fachkräften und Start-ups als Schlüssel; Klimaschutz schafft Technologievorsprung", idx: [17,41,42,43] },
      { text: "Anwendungsfelder: Rohstoff-/Batterierecycling, Verarbeitungskapazitäten, Gartenbau, maritime Technik, Reallabore, Technologie im Land halten", idx: [18,30,31,44,45,46,48,50,51] },
    ],
    kurz: [
      { text: "Forschungszulage unbürokratisch ausbauen (Mittelstand); steuerliche/marktwirtschaftliche Anreize statt direkter Förderung, Bürokratieabbau schafft Freiräume (Vermögensteuer gefährdet Innovation)", idx: [0,1,2,3,4,7,8,11,25,47,49] },
      { text: "Entschlossene Investitionen in Schlüsseltechnologien (KI, Quanten, Mikroelektronik, Fusion, Biotech, Hightech Agenda) und Anwendungsfelder (Rohstoff-/Batterierecycling, maritime Technik, Reallabore)", idx: [13,14,15,16,18,20,21,22,24,29,30,31,33,36,44,45,46,48,50,51] },
      { text: "Technologieoffenheit und Forschungsfreiheit statt ideologischer Vorgaben (CRISPR, Wasserstoff, multiple Lösungen); Innovationskraft von Unternehmen/Fachkräften/Start-ups, Klimaschutz als Technologievorsprung", idx: [5,6,9,10,12,17,19,23,28,32,34,35,39,40,41,42,43] },
      { text: "Datenzugang und Forschungsdatengesetze für Innovation; weniger restriktive Auflagen", idx: [26,27,37,38] },
    ] },
  { aspekt: "Forschung & Innovation", partei: "GRÜNE",
    lang: [
      { text: "Gezielte, fokussierte Investitionen in Zukunftstechnologien für technologische Souveränität (statt breiter Verteilung); Kritik an unzureichender Hightech-Agenda-Umsetzung", idx: [6,7,8,9,12,27] },
      { text: "Schlüsseltechnologien in Europa sichern: Halbleiter, Batteriezellfertigung, KI, digitale Souveränität/Software, Wasserstoff/E-Fuels/Elektrolyseure", idx: [4,10,15,16,20,22,25,28] },
      { text: "Forschungszulage/Tax Credits ausgeweitet (Kritik an Union, die das ablehnte); Hochschulfinanzierung und Ausgründungen besser unterstützen", idx: [0,5,17,19] },
      { text: "Klare rechtliche Rahmen nötig (weniger Regeln allein reichen nicht); Datenzugang/europäische Datenräume für gemeinwohlorientierte Innovation; Reallabore", idx: [13,14,21,30] },
      { text: "Grüne Transformation als Innovationsmotor (Erneuerbare als günstigste Stromquelle, Flottengrenzwerte, grüner Stahl, Kreislaufwirtschaft, Elektrifizierung) — gegen Behinderung der Technologieführerschaft", idx: [3,11,18,23,24,26,29] },
      { text: "Kritik an Energiepolitik (Gaslobby statt neue Technologien) und an Zuständigkeitskonflikten", idx: [1,2] },
    ],
    kurz: [
      { text: "Gezielte, fokussierte Investitionen in Zukunfts-/Schlüsseltechnologien für technologische Souveränität (Halbleiter, Batteriezellen, KI, Wasserstoff, digitale Souveränität)", idx: [4,6,7,8,9,10,12,15,16,20,22,25,27,28] },
      { text: "Forschungszulage/Tax Credits, Hochschulfinanzierung und Ausgründungen stärken; klare Rechtsrahmen, Datenzugang und Reallabore für Innovation", idx: [0,5,13,14,17,19,21,30] },
      { text: "Grüne Transformation als Innovationsmotor (Erneuerbare, grüner Stahl, Kreislaufwirtschaft, Flottengrenzwerte) — Kritik an Behinderung der Technologieführerschaft und an Gaslobby", idx: [1,2,3,11,18,23,24,26,29] },
    ] },
  { aspekt: "Forschung & Innovation", partei: "LINKE",
    lang: [
      { text: "Investitionen in neue/klimafreundliche Technologien notwendig — Technologieverweigerung schadet der Industrie", idx: [0,1,4] },
      { text: "Rückstand bei Zukunftstechnologien (Beendigung des Verbrenner-Aus adressiert ihn nicht); Deutschland führend bei Patenten für Erneuerbare, Zusammenarbeit mit der Wissenschaft", idx: [2,3] },
    ],
    kurz: [
      { text: "Investitionen in neue/klimafreundliche Technologien notwendig — Technologieverweigerung schadet der Industrie", idx: [0,1,4] },
      { text: "Rückstand bei Zukunftstechnologien; Deutschland führend bei Patenten für Erneuerbare, Zusammenarbeit mit der Wissenschaft", idx: [2,3] },
    ] },
  { aspekt: "Forschung & Innovation", partei: "SPD",
    lang: [
      { text: "Forschungszulage erhöhen und erweitern (Gemeinkosten, ZIM, Zentrales Innovationsprogramm Mittelstand)", idx: [1,2,19,37] },
      { text: "Gezielte staatliche Investitionen in Schlüsseltechnologien (18 Mrd. €, Hightech Agenda, KI, Mikroelektronik, Quanten, Halbleiter, Wasserstoff, Batteriezellen, autonomes Fahren) für technologische Souveränität", idx: [0,4,8,9,21,26,27,28,32,33,36] },
      { text: "Forschungsstärke (Weltspitze Patente) als Wachstumsschlüssel; Transfer in marktfertige Produkte erleichtern (Reallabore, Grundlagenforschung → Umsetzung)", idx: [3,11,17,22,23,24,38,39] },
      { text: "Erneuerbare, Klimaneutralität, Alternativkraftstoffe, grüner Stahl und Kreislaufwirtschaft als Innovationsfeld mit Patentwachstum", idx: [5,6,7,10,12,13,35] },
      { text: "Privates Kapital/Finanzierungsbedingungen für forschungsintensive Unternehmen lenken; öffentliche Hochschulforschung; Cluster/Netzwerke", idx: [15,16,20,25,31] },
      { text: "Datenbasierte Geschäftsmodelle/Datenzugang als Innovationstreiber; KI/Digitalisierung im Mittelstand für Produktivität", idx: [18,29,30,34] },
      { text: "Forschung zu Frauengesundheit und postinfektiösen Erkrankungen", idx: [14] },
    ],
    kurz: [
      { text: "Forschungszulage erhöhen (Mittelstand, ZIM) und gezielte staatliche Investitionen in Schlüsseltechnologien (18 Mrd. €, Hightech Agenda, KI, Mikroelektronik, Quanten, Halbleiter, Wasserstoff, Batteriezellen)", idx: [0,1,2,4,8,9,19,21,26,27,28,32,33,36,37] },
      { text: "Forschungsstärke (Weltspitze Patente) in marktfertige Produkte überführen (Reallabore, Transfer); Finanzierung forschungsintensiver Unternehmen, Hochschulforschung, Cluster; Datenzugang/KI im Mittelstand", idx: [3,11,15,16,17,18,20,22,23,24,25,29,30,31,34,38,39] },
      { text: "Erneuerbare, Klimaneutralität, Alternativkraftstoffe, grüner Stahl und Kreislaufwirtschaft als Innovationsfeld; Forschung zu Frauengesundheit", idx: [5,6,7,10,12,13,14,35] },
    ] },

  // ============ MITTELSTAND & HANDWERK ============
  { aspekt: "Mittelstand & Handwerk", partei: "AfD",
    lang: [
      { text: "Mittelstand und Handwerk durch Steuern, Soli sowie Substanz-/Erbschaftsteuer belastet — Entlastung und Steuerreform, Erbschaftsteuer abschaffen", idx: [0,1,4,15,19,26,27,35,40,60] },
      { text: "Bürokratie, Auflagen und Regulierung (LkSG, Produktsicherheit, EU-Standards, Tariftreuegesetz, Nachunternehmerhaftung) belasten KMU und Handwerk überproportional gegenüber Großkonzernen", idx: [3,6,7,10,12,13,14,20,21,22,23,24,28,31,33,37,38,39,41,42,43,45,50,51,52,56,57,61,62,63] },
      { text: "Energiekosten, Klimapolitik, Mindestlohn und Sozialabgaben als Belastung — Pleiten, Insolvenzen und Betriebsschließungen", idx: [2,5,8,9,17,30,32,34,44,46,48,55,58,59,64] },
      { text: "Grüne Wirtschaftspolitik als mittelstandsfeindlich; unzureichende Unterstützung Ostdeutschlands nach Treuhand", idx: [16,25,29,36] },
      { text: "Mittelstand als Rückgrat (Freihandel/Marktzugang, lokale Kaufkraft, Werften/Häfen); 1.000-€-Entlastungsprämie als unzureichend/ungerecht abgelehnt", idx: [11,18,47,49,53,54] },
    ],
    kurz: [
      { text: "Bürokratie, Auflagen und Regulierung (LkSG, Produktsicherheit, EU-Standards, Tariftreuegesetz, Nachunternehmerhaftung) belasten KMU und Handwerk überproportional gegenüber Großkonzernen", idx: [3,6,7,10,12,13,14,20,21,22,23,24,28,31,33,37,38,39,41,42,43,45,50,51,52,56,57,61,62,63] },
      { text: "Steuern (Soli, Substanz-/Erbschaftsteuer), Energiekosten, Mindestlohn und Sozialabgaben belasten den Mittelstand — Entlastung gefordert; sonst Pleiten und Insolvenzen", idx: [0,1,2,4,5,8,9,15,17,19,26,27,30,32,34,35,40,44,46,48,55,58,59,60,64] },
      { text: "Grüne Wirtschaftspolitik als mittelstandsfeindlich kritisiert; Mittelstand als Rückgrat (Freihandel, Kaufkraft, Werften) — 1.000-€-Prämie als unzureichend abgelehnt", idx: [11,16,18,25,29,36,47,49,53,54] },
    ] },
  { aspekt: "Mittelstand & Handwerk", partei: "CDU/CSU",
    lang: [
      { text: "Lieferkettengesetz belastet den Mittelstand überproportional — mittelstandsfreundlich ausgestalten/entschlacken", idx: [0,1,2,3,4,41] },
      { text: "Mittelstand, Handwerk und Familienunternehmen als Rückgrat der Wirtschaft (Beschäftigung, Export, ländliche Räume, Ausbildung) — stärken statt belasten", idx: [6,14,18,19,30,31,32,34,37,42,48,56,58,60,63,66,77] },
      { text: "Erbschaft-/Vermögen-/Substanzsteuer gefährdet Familienunternehmen und Handwerk — Verschonung/steuerfreie Weitergabe, gegen Vermögensteuer", idx: [9,10,22,23,35,36,49,50,54,55,72] },
      { text: "Schutz und Berücksichtigung von KMU und Handwerk bei öffentlicher Vergabe (Teil-/Fachlose, Losbündelung)", idx: [12,16,68,69,70,71] },
      { text: "Bürokratie, Regulierung und Tariftreue nicht überfordern — praxistauglich, Schwellen, mittelstandsfreundlich", idx: [13,20,21,24,40,43,46,47,51,52,59,74] },
      { text: "Gezielte Entlastung: Forschungszulage, Stromkosten, Energiesteuer, MwSt Gastronomie, Kreditvergabe (Sparkassen/Genossenschaften), Reinvestitionsschwellen", idx: [5,11,25,28,29,33,44,45,73,75] },
      { text: "Branchen: Stahl, Bürgerenergie (Wind/Solar), Automobilzulieferer, Gastronomie/Hotellerie, Binnenschifffahrt, Wasserstoff, KI/Data Act, Mosel", idx: [7,8,15,17,26,27,38,39,53,57,61,62,64,65,67,76] },
      { text: "Handwerk konkret: Flexibilisierung der Arbeitszeit, Ausbildung als gleichwertiger Karriereweg, Erbschaftsteuerreform, Infrastrukturaufträge", idx: [78,79] },
    ],
    kurz: [
      { text: "Lieferkettengesetz und sonstige Bürokratie/Regulierung (Tariftreuegesetz) mittelstandsfreundlich ausgestalten — KMU und Handwerk nicht überfordern (praxistauglich, Schwellen)", idx: [0,1,2,3,4,13,20,21,24,40,41,43,46,47,51,52,59,74] },
      { text: "Mittelstand, Handwerk und Familienunternehmen als Rückgrat der Wirtschaft (Beschäftigung, Export, Ausbildung) stärken statt belasten", idx: [6,14,18,19,30,31,32,34,37,42,48,56,58,60,63,66,77,78,79] },
      { text: "Erbschaft-/Vermögensteuer gefährdet Familienunternehmen — Verschonung/steuerfreie Weitergabe, gegen Vermögensteuer; Schutz von KMU/Handwerk bei öffentlicher Vergabe (Teil-/Fachlose)", idx: [9,10,12,16,22,23,35,36,49,50,54,55,68,69,70,71,72] },
      { text: "Gezielte Entlastung (Forschungszulage, Stromkosten, Energiesteuer, Gastronomie-MwSt, Kreditvergabe) und Branchenförderung (Stahl, Bürgerenergie, Automobilzulieferer, Gastronomie, Binnenschiff, Wasserstoff, KI)", idx: [5,7,8,11,15,17,25,26,27,28,29,33,38,39,44,45,53,57,61,62,64,65,67,73,75,76] },
    ] },
  { aspekt: "Mittelstand & Handwerk", partei: "GRÜNE",
    lang: [
      { text: "Mittelstand und Handwerk durch Stromsteuersenkung für alle entlasten (statt nur Industrie); Energiekostenentlastung für kleine Betriebe", idx: [1,2,3,4] },
      { text: "Unzureichende Mittelstandsunterstützung der Regierung kritisiert — verlässliche Rahmenbedingungen und konkrete Initiativen für KMU gefordert", idx: [5,6] },
      { text: "Bürokratie als Hemmnis für Unternehmensnachfolge; KMU brauchen Rechtssicherheit/Ansprechpartner bei Datengesetzen; Integrationskurse für Fachkräfte", idx: [7,8,9] },
      { text: "Handwerk als zentraler Anker der Wirtschaft (5,6 Mio. Beschäftigte) — mehr Wertschätzung; Mittelständler leben Nachhaltigkeit; Anfälligkeit für Versorgungsengpässe", idx: [0,10,11] },
    ],
    kurz: [
      { text: "Mittelstand und Handwerk durch Stromsteuersenkung für alle entlasten; verlässliche Rahmenbedingungen und konkrete Initiativen für KMU gefordert", idx: [1,2,3,4,5,6] },
      { text: "Bürokratie/Nachfolge erleichtern, Rechtssicherheit bei Datengesetzen, Fachkräfte-Integration; Handwerk als zentraler Anker (Wertschätzung), Mittelstand lebt Nachhaltigkeit", idx: [0,7,8,9,10,11] },
    ] },
  { aspekt: "Mittelstand & Handwerk", partei: "LINKE",
    lang: [
      { text: "Handwerk zentral für Klimaneutralität und Transformation — systematische Aufwertung über gute Arbeitsbedingungen, Tarifbindung, Ausbildungsinvestitionen und ökologische Modernisierung statt Deregulierung", idx: [1,2] },
      { text: "Kleine Betriebe können Krisenbonus-Maßnahmen nicht stemmen; gegen übermäßige Regulierungslast bei der Nachhaltigkeitskennzeichnung", idx: [0,3] },
      { text: "Handwerk durch faire Bedingungen und Zugang zu Ersatzteilen/Reparaturdaten stärken (regionale Wertschöpfung, Ausbildung)", idx: [4] },
    ],
    kurz: [
      { text: "Handwerk zentral für die Transformation — Aufwertung über gute Arbeitsbedingungen, Tarifbindung und Ausbildungsinvestitionen statt Deregulierung", idx: [1,2] },
      { text: "Kleine Betriebe können Krisenbonus-Maßnahmen nicht stemmen; gegen übermäßige Regulierungslast", idx: [0,3] },
      { text: "Handwerk durch faire Bedingungen und Zugang zu Ersatzteilen/Reparaturdaten stärken", idx: [4] },
    ] },
  { aspekt: "Mittelstand & Handwerk", partei: "SPD",
    lang: [
      { text: "Mittelstand und Handwerk als Rückgrat (99 % der Firmen) — Regierung unterstützt durch Entlastungsagenda, Forschungszulage und Modernisierungsagenda", idx: [3,8,12,14,15,16] },
      { text: "Gezielte Entlastung: Forschungszulage, Stromsteuer, Gastronomie-Steuervergünstigung, Kreditvergabe regionaler Banken, Investitionsspielräume", idx: [1,5,9,10,11,17] },
      { text: "Schutz bei öffentlicher Vergabe — faire Zugänge, Losvergabe, kleine Betriebe stärker berücksichtigen", idx: [4,23,24,25] },
      { text: "Schutz vor belastenden Steuerreformen; großzügige Freibeträge bei Betriebsübergaben; Soli-Argument der AfD als irreführend", idx: [2,6,19] },
      { text: "Wärmewende/Wärmepumpen als mittelständische Leitbranche mit Planungssicherheit; Strukturwandel; Recht auf Reparatur stärkt das Handwerk", idx: [0,7,13] },
      { text: "Datenpotenziale/KI im industriellen Mittelstand für Produktivität; innovative KMU mit Forschung verbinden; Energiemarktregulierung", idx: [18,20,21,22] },
      { text: "Handwerk-Wertschätzung (über 130 Berufe, Ausbildung, gesellschaftlicher Zusammenhalt) — gezielte Maßnahmen", idx: [26] },
    ],
    kurz: [
      { text: "Mittelstand und Handwerk als Rückgrat (99 % der Firmen) — Regierung unterstützt durch Entlastungsagenda (Forschungszulage, Stromsteuer, Gastronomie, Kreditvergabe, Modernisierungsagenda)", idx: [1,3,5,8,9,10,11,12,14,15,16,17] },
      { text: "Schutz bei öffentlicher Vergabe (Losvergabe, kleine Betriebe berücksichtigen); Schutz vor belastenden Steuerreformen, großzügige Freibeträge bei Betriebsübergaben", idx: [2,4,6,19,23,24,25] },
      { text: "Wärmewende/Wärmepumpen als mittelständische Leitbranche; Recht auf Reparatur, Daten/KI-Potenziale und Forschung im Mittelstand; Handwerk-Wertschätzung (Ausbildung)", idx: [0,7,13,18,20,21,22,26] },
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
