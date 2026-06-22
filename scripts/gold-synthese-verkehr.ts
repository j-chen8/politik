/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Verkehr" (51 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Bahnstruktur / Eigentum =====
  { aspekt: "Bahnstruktur / Eigentum", partei: "AfD",
    lang: [
      { text: "Deutsche Bahn von der AG in eine GmbH umwandeln für bessere staatliche Steuerung durch den Bund", idx: r(3,5,6,8,13) },
      { text: "Gegen die AEG-Änderung 2023 (überragendes öffentliches Interesse), die Bahnflächen für Wohnungsbau blockiert", idx: r(1,2) },
      { text: "Kritik an Trassenpreisen/Eigenkapital-Trick zur Umgehung der Schuldenbremse; Stuttgart 21 und DB-Konzern; Sanierung mit Augenmaß; Mischverkehr/Wettbewerb", idx: r(7,11,9,12,15,0,4,14,10) },
    ],
    kurz: [
      { text: "Deutsche Bahn von der AG in eine GmbH umwandeln für bessere staatliche Steuerung; gegen die AEG-Änderung 2023", idx: r(3,5,6,8,13,1,2) },
      { text: "Kritik an Trassenpreisen/Eigenkapital-Trick; Stuttgart 21 und DB-Konzern; Sanierung mit Augenmaß", idx: r(7,11,9,12,15,0,4,14,10) },
    ] },
  { aspekt: "Bahnstruktur / Eigentum", partei: "CDU/CSU",
    lang: [
      { text: "Trassenpreise senken und Eigenkapitalverzinsung absenken (gegen die Ampel-Umstellung auf Eigenkapitalzuschüsse)", idx: r(0,7,13,14,15) },
      { text: "DB-Konzern umbauen/reformieren; neue Bahnstrategie und Konzernführung", idx: r(1,3,6,8,9,11,12) },
      { text: "Bahnflächen-Freistellung für Wohnungsbau (mit Reaktivierungsschutz); Finanzierungssicherung; föderale Struktur", idx: r(2,10,4,5) },
    ],
    kurz: [
      { text: "Trassenpreise senken (Eigenkapitalverzinsung absenken); DB-Konzern umbauen und reformieren", idx: r(0,7,13,14,15,1,3,6,8,9,11,12) },
      { text: "Bahnflächen-Freistellung für Wohnungsbau; Finanzierungssicherung; föderale Struktur", idx: r(2,10,4,5) },
    ] },
  { aspekt: "Bahnstruktur / Eigentum", partei: "GRÜNE",
    lang: [
      { text: "Trassenpreise senken/reformieren; verlässlicher Infrastrukturfonds statt kurzfristiger Maßnahmen", idx: r(1,3,4,8) },
      { text: "Schieneninfrastruktur ausbauen statt Rückbau; Bahnflächen schützen; EBA-Reform", idx: r(5,6,0) },
      { text: "Kritik an Pünktlichkeitszielen und Finanzdruck der DB", idx: r(2,7) },
    ],
    kurz: [
      { text: "Trassenpreise senken/reformieren; verlässlicher Infrastrukturfonds; Schieneninfrastruktur ausbauen statt Rückbau", idx: r(1,3,4,8,5,6,0) },
      { text: "Kritik an Pünktlichkeitszielen und Finanzdruck der DB", idx: r(2,7) },
    ] },
  { aspekt: "Bahnstruktur / Eigentum", partei: "LINKE",
    lang: [
      { text: "Öffentliches Eigentum und gemeinwohlorientierte Bürgerbahn statt Gewinnorientierung und Privatisierungslogik", idx: r(4,5,6) },
      { text: "Bahnflächen erhalten (gegen Umwandlung in Wohnbauflächen); Kritik an Sanierungsrückstand und Management", idx: r(1,3,0,2,7) },
    ],
    kurz: [
      { text: "Öffentliches Eigentum und Bürgerbahn statt Gewinnorientierung; Bahnflächen erhalten", idx: r(4,5,6,1,3) },
      { text: "Kritik an Sanierungsrückstand und Management der DB", idx: r(0,2,7) },
    ] },
  { aspekt: "Bahnstruktur / Eigentum", partei: "SPD",
    lang: [
      { text: "Bahn- und Trassenpreisreform, gemeinwohlorientierte Steuerung durch den Bund; Infrastrukturfonds nach Schweizer/österreichischem Vorbild", idx: r(4,7,6) },
      { text: "Leistungsfähigkeit des Netzes wiederherstellen; Finanzierungsvereinbarung; demokratische Kontrolle und Rechtsstaatlichkeit (EBA)", idx: r(0,1,3,2,5) },
    ],
    kurz: [
      { text: "Bahn- und Trassenpreisreform, gemeinwohlorientierte Steuerung; Infrastrukturfonds nach Schweizer Vorbild", idx: r(4,7,6) },
      { text: "Leistungsfähigkeit des Netzes wiederherstellen; demokratische Kontrolle (EBA)", idx: r(0,1,3,2,5) },
    ] },

  // ===== Deutschlandticket / ÖPNV-Preis =====
  { aspekt: "Deutschlandticket / ÖPNV-Preis", partei: "AfD",
    lang: [
      { text: "Gegen Subventionierung; ehrlicher, kostendeckender Preis mit Sozialtarif statt weiterer Verbilligung", idx: r(0,2,3,4,5,6,10,11,13) },
      { text: "Gegen kostenlosen ÖPNV (Leistung vor Preis); gegen Abschaffung der Papiertickets", idx: r(1,7,8,9,12) },
    ],
    kurz: [
      { text: "Gegen Subventionierung; ehrlicher, kostendeckender Preis mit Sozialtarif", idx: r(0,2,3,4,5,6,10,11,13) },
      { text: "Gegen kostenlosen ÖPNV (Leistung vor Preis); gegen Abschaffung der Papiertickets", idx: r(1,7,8,9,12) },
    ] },
  { aspekt: "Deutschlandticket / ÖPNV-Preis", partei: "CDU/CSU",
    lang: [
      { text: "Deutschlandticket fortführen und langfristig (bis 2030) finanzieren, mit Preisindex statt politischer Festsetzung", idx: r(1,2,3,7,8,9,10,11,14,15) },
      { text: "Gegen kostenlosen ÖPNV als unrealistisch; ländlicher Raum/Pendler und Folgelasten der Kommunen beachten; Familienticket", idx: r(4,13,0,5,6,12) },
    ],
    kurz: [
      { text: "Deutschlandticket fortführen und bis 2030 finanzieren (Preisindex); gegen kostenlosen ÖPNV", idx: r(1,2,3,7,8,9,10,11,14,15,4,13) },
      { text: "Ländlicher Raum/Pendler und Folgelasten der Kommunen beachten; Familienticket", idx: r(0,5,6,12) },
    ] },
  { aspekt: "Deutschlandticket / ÖPNV-Preis", partei: "GRÜNE",
    lang: [
      { text: "Deutschlandticket bei 49 € halten/günstiger machen (gegen Preiserhöhung); kostenlose Kindermitnahme, einheitliche Sozial-/Azubitickets", idx: r(0,1,2,6,10,11,12,13,7) },
      { text: "ÖPNV als Daseinsvorsorge ausreichend finanzieren; deutsch-polnisches Jugendticket; 9-Euro-Antrag", idx: r(3,4,5,9,8) },
    ],
    kurz: [
      { text: "Deutschlandticket bei 49 € halten/günstiger machen; kostenlose Kindermitnahme, Sozial-/Azubitickets", idx: r(0,1,2,6,10,11,12,13,7) },
      { text: "ÖPNV als Daseinsvorsorge ausreichend finanzieren", idx: r(3,4,5,9,8) },
    ] },
  { aspekt: "Deutschlandticket / ÖPNV-Preis", partei: "LINKE",
    lang: [
      { text: "Rückkehr zum 9-Euro-Ticket und perspektivisch kostenloser bzw. sehr günstiger ÖPNV (Nulltarif für Schüler/Azubis/Studierende)", idx: r(3,5,7,8,14,15,18) },
      { text: "Gegen Preiserhöhungen des Deutschlandtickets; bezahlbarer ÖPNV als Verkehrswende; Schwarzfahren entkriminalisieren; Qualität/Familien", idx: r(0,2,9,10,16,17,4,11,19,1,6,12,13) },
    ],
    kurz: [
      { text: "Rückkehr zum 9-Euro-Ticket, perspektivisch kostenloser/sehr günstiger ÖPNV", idx: r(3,5,7,8,14,15,18) },
      { text: "Gegen Preiserhöhungen; bezahlbarer ÖPNV als Verkehrswende; Schwarzfahren entkriminalisieren", idx: r(0,2,9,10,16,17,4,11,19,1,6,12,13) },
    ] },
  { aspekt: "Deutschlandticket / ÖPNV-Preis", partei: "SPD",
    lang: [
      { text: "Deutschlandticket dauerhaft sichern; Preisstabilität und Indexierung; 63 € als Kompromiss", idx: r(2,3,4,5,6,9,10,11,0,1) },
      { text: "Gegen kostenlosen ÖPNV als Universallösung (Infrastruktur vor Preis); Trassenentgelte senken; Deutschlandtakt", idx: r(7,8,12) },
    ],
    kurz: [
      { text: "Deutschlandticket dauerhaft sichern; Preisstabilität und Indexierung", idx: r(2,3,4,5,6,9,10,11,0,1) },
      { text: "Gegen kostenlosen ÖPNV als Universallösung; Trassenentgelte senken", idx: r(7,8,12) },
    ] },

  // ===== Dienstwagenprivileg =====
  { aspekt: "Dienstwagenprivileg", partei: "AfD",
    lang: [{ text: "Gegen Steuervergünstigungen für E-Autos; Steuergerechtigkeit für alle Nutzer", idx: r(0,1) }],
    kurz: [{ text: "Gegen Steuervergünstigungen für E-Autos; Steuergerechtigkeit für alle", idx: r(0,1) }] },
  { aspekt: "Dienstwagenprivileg", partei: "GRÜNE",
    lang: [{ text: "Dienstwagenprivileg streichen als Finanzierungsquelle für ÖPNV und Deutschlandticket (Bevorzugung von Topverdienern)", idx: r(0) }],
    kurz: [{ text: "Dienstwagenprivileg streichen als Finanzierungsquelle für ÖPNV", idx: r(0) }] },
  { aspekt: "Dienstwagenprivileg", partei: "LINKE",
    lang: [{ text: "Kritik an undifferenzierter E-Auto-Steuerbefreiung; sozialökologisch ausgerichtete Steuerung (z. B. Pflegedienst-Flotten)", idx: r(0) }],
    kurz: [{ text: "Undifferenzierte E-Auto-Steuerbefreiung kritisch; sozialökologische Steuerung", idx: r(0) }] },
  { aspekt: "Dienstwagenprivileg", partei: "SPD",
    lang: [{ text: "Befürwortung der Kfz-Steuerbefreiung für E-Autos und Verbesserungen für elektrische Dienstwagen", idx: r(0) }],
    kurz: [{ text: "Kfz-Steuerbefreiung für E-Autos und Verbesserungen für elektrische Dienstwagen", idx: r(0) }] },

  // ===== Güterverkehr auf die Schiene =====
  { aspekt: "Güterverkehr auf die Schiene", partei: "AfD",
    lang: [
      { text: "Schiene für Massentransport ja, aber die Straße bleibt Hauptträger; gegen Subventionierung als unwirtschaftlich", idx: r(0,1,5,7,8) },
      { text: "Kritik an Trassenentgelten, Fahrermangel/Bürokratie und mangelnder Kapazität; Verlagerung auf neue Strecken", idx: r(4,2,3,6) },
    ],
    kurz: [
      { text: "Schiene für Massentransport ja, Straße bleibt Hauptträger; gegen Subventionierung", idx: r(0,1,5,7,8) },
      { text: "Kritik an Trassenentgelten, Fahrermangel und mangelnder Kapazität", idx: r(4,2,3,6) },
    ] },
  { aspekt: "Güterverkehr auf die Schiene", partei: "CDU/CSU",
    lang: [
      { text: "Verlagerung auf die Schiene durch Senkung von Trassenpreisen/Schienenmaut", idx: r(4,6,10,11,12,14) },
      { text: "Multimodaler Ansatz (auch Binnenschiff/Wasserwege); kombinierter Verkehr und mehr Kapazität", idx: r(0,1,3,5,15,7,8) },
      { text: "Schiene als zweites Standbein (aktuell 75 % per Lkw); Lkw-Parkplätze", idx: r(2,13,9) },
    ],
    kurz: [
      { text: "Verlagerung auf die Schiene durch Senkung der Trassenpreise/Schienenmaut; multimodaler Ansatz (auch Binnenschiff)", idx: r(4,6,10,11,12,14,0,1,3,5,15,7,8) },
      { text: "Schiene als zweites Standbein (aktuell 75 % per Lkw); Lkw-Parkplätze", idx: r(2,13,9) },
    ] },
  { aspekt: "Güterverkehr auf die Schiene", partei: "GRÜNE",
    lang: [
      { text: "Verlagerung auf die Schiene durch niedrigere Trassenpreise; Lkw-Maut-Mittel für die Schiene statt Straße", idx: r(1,2,3,4,6,8,9,10) },
      { text: "Flächensicherung für Schiene; gegen Priorität von Lkw-Stellplätzen", idx: r(7,5,0) },
    ],
    kurz: [
      { text: "Verlagerung auf die Schiene durch niedrigere Trassenpreise; Lkw-Maut-Mittel für die Schiene", idx: r(1,2,3,4,6,8,9,10) },
      { text: "Flächensicherung für Schiene; gegen Priorität von Lkw-Stellplätzen", idx: r(7,5,0) },
    ] },
  { aspekt: "Güterverkehr auf die Schiene", partei: "LINKE",
    lang: [{ text: "Mehr Güter von der Straße auf die Schiene (ausgebaute Bürgerbahn); Kapazität/Infrastruktur sichern; aktuelle Bahnpolitik gefährdet den Güterverkehr (DB Cargo)", idx: r(2,3,0,1,4) }],
    kurz: [{ text: "Mehr Güter auf die Schiene (Bürgerbahn); Kapazität sichern; Bahnpolitik gefährdet Güterverkehr", idx: r(2,3,0,1,4) }] },
  { aspekt: "Güterverkehr auf die Schiene", partei: "SPD",
    lang: [
      { text: "Verlagerung auf die Schiene durch Senkung der Trassenpreise und Investitionen; Ausbau von Güterbahnstrecken", idx: r(3,4,5,6,9,10,7) },
      { text: "Wasserstraßen/Häfen nutzen; Straßenverschleiß zu über 90 % durch Lkw; maritimes Schlupfloch schließen", idx: r(0,8,2,1) },
    ],
    kurz: [
      { text: "Verlagerung auf die Schiene durch niedrigere Trassenpreise und Investitionen", idx: r(3,4,5,6,9,10,7) },
      { text: "Wasserstraßen/Häfen nutzen; Straßenverschleiß überwiegend durch Lkw", idx: r(0,8,2,1) },
    ] },

  // ===== Lkw-Maut =====
  { aspekt: "Lkw-Maut", partei: "AfD",
    lang: [
      { text: "Lkw-Maut senken und Einnahmen zweckgebunden für die Straße verwenden (gegen Umleitung zur Schiene)", idx: r(0,1,3,5,6,7,4) },
      { text: "Gegen das App-basierte Mautsystem (Datenschutz, Betrug)", idx: r(2) },
    ],
    kurz: [{ text: "Lkw-Maut senken und Einnahmen zweckgebunden für die Straße verwenden; gegen das App-Mautsystem", idx: r(0,1,3,5,6,7,4,2) }] },
  { aspekt: "Lkw-Maut", partei: "CDU/CSU",
    lang: [{ text: "Mautbefreiung für Elektro-Lkw; Maut-Einnahmen der Straße zugutekommen lassen; Transportkosten senken", idx: r(0,1,2) }],
    kurz: [{ text: "Mautbefreiung für Elektro-Lkw; Maut-Einnahmen der Straße zugutekommen lassen", idx: r(0,1,2) }] },
  { aspekt: "Lkw-Maut", partei: "GRÜNE",
    lang: [{ text: "Lkw-Maut-Einnahmen verlässlich in die Schiene statt in den Straßenbau lenken", idx: r(0,1,2,3) }],
    kurz: [{ text: "Lkw-Maut-Einnahmen in die Schiene statt in den Straßenbau lenken", idx: r(0,1,2,3) }] },

  // ===== Luftverkehr =====
  { aspekt: "Luftverkehr", partei: "AfD",
    lang: [
      { text: "Luftverkehrsteuer vollständig abschaffen als wirtschaftsschädlichen Standortnachteil (gegen CO₂-Bepreisung, Nachtflugverbote)", idx: r(0,2,3,4,5,6,8,9,10,11,12,13) },
      { text: "Gegen Klima-bedingten Verzicht aufs Fliegen; Drohnen-Sicherheit an Flughäfen", idx: r(7,1) },
    ],
    kurz: [
      { text: "Luftverkehrsteuer vollständig abschaffen als Standortnachteil", idx: r(0,2,3,4,5,6,8,9,10,11,12,13) },
      { text: "Gegen Klima-bedingten Verzicht aufs Fliegen; Drohnen-Sicherheit an Flughäfen", idx: r(7,1) },
    ] },
  { aspekt: "Luftverkehr", partei: "CDU/CSU",
    lang: [
      { text: "Luftverkehrsteuer senken zur Stärkung des Standorts und der Arbeitsplätze; gegen Luxusflugsteuer", idx: r(0,1,2,4,5,8,12,13,10) },
      { text: "Regionalflughäfen und Flugsicherungsgebühren stabilisieren; Luftraumüberwachung; Lufthansa-Stellenabbau; Gesamtstrategie", idx: r(6,11,9,3,7) },
    ],
    kurz: [
      { text: "Luftverkehrsteuer senken zur Stärkung des Standorts; gegen Luxusflugsteuer", idx: r(0,1,2,4,5,8,12,13,10) },
      { text: "Regionalflughäfen stabilisieren; Luftraumüberwachung; Gesamtstrategie statt Einzelmaßnahmen", idx: r(6,11,9,3,7) },
    ] },
  { aspekt: "Luftverkehr", partei: "GRÜNE",
    lang: [{ text: "Gegen pauschale Senkung der Luftverkehrsteuer; differenzierte, verursachergerechte Besteuerung nach Emissionen, Privatjets und Business/First Class stärker; Abgabe auf Luxusflüge für Klimaschutz", idx: r(0,2,3,4,5,6,7,1) }],
    kurz: [{ text: "Gegen pauschale Senkung der Luftverkehrsteuer; differenzierte Besteuerung nach Emissionen, Privatjets stärker", idx: r(0,2,3,4,5,6,7,1) }] },
  { aspekt: "Luftverkehr", partei: "LINKE",
    lang: [{ text: "Gegen Senkung der Luftverkehrsteuer; Kerosin- und Vielfliegerbesteuerung, Privatjet-Verbot und Reduktion von Kurzstreckenflügen", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Gegen Senkung der Luftverkehrsteuer; Kerosin-/Vielfliegerbesteuerung, Privatjet-Verbot, weniger Kurzstreckenflüge", idx: r(0,1,2,3,4,5,6) }] },
  { aspekt: "Luftverkehr", partei: "SPD",
    lang: [{ text: "Senkung der Luftverkehrsteuer zur Stärkung der Wettbewerbsfähigkeit und Sicherung von Arbeitsplätzen (Regionalflughäfen)", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Senkung der Luftverkehrsteuer zur Stärkung der Wettbewerbsfähigkeit und Arbeitsplätze", idx: r(0,1,2,3,4) }] },

  // ===== Rad- & Fußverkehr =====
  { aspekt: "Rad- & Fußverkehr", partei: "AfD",
    lang: [{ text: "Ablehnung von Radwegeprojekten im Ausland", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Radwegeprojekten im Ausland", idx: r(0) }] },
  { aspekt: "Rad- & Fußverkehr", partei: "GRÜNE",
    lang: [{ text: "Radverkehrsnetze und -sicherheit fördern; kostenlose Fahrradmitnahme im ÖPNV; mehr Mittel für klimafreundliche Mobilität", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Radverkehrsnetze und -sicherheit fördern; kostenlose Fahrradmitnahme im ÖPNV", idx: r(0,1,2,3,4) }] },
  { aspekt: "Rad- & Fußverkehr", partei: "LINKE",
    lang: [{ text: "Ausbau von Rad- und Fußwegen mit Barrierefreiheit und Flächengerechtigkeit als Teil der Mobilitätswende", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Ausbau von Rad- und Fußwegen mit Barrierefreiheit als Teil der Mobilitätswende", idx: r(0,1,2,3,4) }] },
  { aspekt: "Rad- & Fußverkehr", partei: "SPD",
    lang: [{ text: "Mobilitätsstationen, On-Demand-Lösungen und Barrierefreiheit für nahtloses Umsteigen vom Rad auf die Bahn", idx: r(0,1,2) }],
    kurz: [{ text: "Mobilitätsstationen, On-Demand-Lösungen und Barrierefreiheit", idx: r(0,1,2) }] },

  // ===== Schiene ausbauen =====
  { aspekt: "Schiene ausbauen", partei: "AfD",
    lang: [
      { text: "Gezielter, priorisierter Ausbau statt unrealistischer flächendeckender Pläne (Stärken der Bahn nutzen)", idx: r(0,1,5,7,10,16,25,26) },
      { text: "Investitionen in Gleise und moderne Züge statt in Billigtickets/Subventionen; gegen Eigenkapital-/Mautumlenkung", idx: r(2,3,17,22,6,9,13,19) },
      { text: "Magnetbahn/Transrapid/Hyperloop statt langsamer konventioneller Modernisierung; einzelne Strecken (Dresden–Prag, Augsburg–Ulm) befürwortet; Straße vor Schiene", idx: r(4,11,23,15,18,20,8,12,21,24,14) },
    ],
    kurz: [
      { text: "Gezielter, priorisierter Ausbau statt unrealistischer flächendeckender Pläne; Investitionen in Gleise/Züge statt Billigtickets", idx: r(0,1,5,7,10,16,25,26,2,3,17,22,6,9,13,19) },
      { text: "Magnetbahn/Transrapid statt konventioneller Modernisierung; einzelne Strecken befürwortet; Straße vor Schiene", idx: r(4,11,23,15,18,20,8,12,21,24,14) },
    ] },
  { aspekt: "Schiene ausbauen", partei: "CDU/CSU",
    lang: [
      { text: "Rekordinvestitionen in Sanierung und Ausbau des Schienennetzes (über 100 Mrd. €, Löwenanteil der Verkehrsinvestitionen)", idx: r(3,6,8,9,10,13,14,16,17,23,26,28) },
      { text: "Schnellere Planung und Genehmigung; Trassenpreisreform und Absenkung der Eigenkapitalverzinsung; Reaktivierung", idx: r(7,11,20,25,0,21,15) },
      { text: "Einzelne Strecken (Marschbahn, Augsburg–Ulm), Deutschlandtakt, Barrierefreiheit, Wasserstraßen; Schiene wichtig, aber nicht alleiniges Rückgrat (ausgewogen)", idx: r(4,19,22,2,27,5,24,29,1,12,18) },
    ],
    kurz: [
      { text: "Rekordinvestitionen in Sanierung und Ausbau des Schienennetzes; schnellere Planung und Trassenpreisreform", idx: r(3,6,8,9,10,13,14,16,17,23,26,28,7,11,20,25,0,21,15) },
      { text: "Einzelne Strecken, Deutschlandtakt, Wasserstraßen; Schiene wichtig, aber nicht alleiniges Rückgrat", idx: r(4,19,22,2,27,5,24,29,1,12,18) },
    ] },
  { aspekt: "Schiene ausbauen", partei: "GRÜNE",
    lang: [
      { text: "Mehr Investitionen in Aus- und Neubau (Sondervermögen nutzen); Neubaustrecken (Augsburg–Ulm, Dresden–Prag, Marschbahn); Priorität Schiene vor Straße", idx: r(2,5,7,13,16,0,8,12) },
      { text: "Verlässliche, langfristig planbare Finanzierung; Flächensicherung; ÖPNV-Infrastruktur und Bahnhöfe; Digitalisierung/Zulaufgleise", idx: r(1,3,9,10,15,4,11,17,6,14) },
    ],
    kurz: [
      { text: "Mehr Investitionen in Aus- und Neubau (Sondervermögen nutzen); Neubaustrecken; Priorität Schiene vor Straße", idx: r(2,5,7,13,16,0,8,12) },
      { text: "Verlässliche Finanzierung; Flächensicherung; ÖPNV-Infrastruktur und Bahnhöfe; Digitalisierung", idx: r(1,3,9,10,15,4,11,17,6,14) },
    ] },
  { aspekt: "Schiene ausbauen", partei: "LINKE",
    lang: [
      { text: "Stärkerer und schnellerer Ausbau gegen Unterfinanzierung; Priorität vor dem Straßenbau; fertig geplante Projekte umsetzen", idx: r(0,3,7,9,11,12,1,5) },
      { text: "Bahnflächen erhalten; Trassenpreise reformieren/Sanierungsfonds; Service; Luftverkehrsteuer-Kürzung trifft Schiene; Bahnhöfe", idx: r(2,8,10,6,4,13) },
    ],
    kurz: [
      { text: "Stärkerer/schnellerer Ausbau gegen Unterfinanzierung; Priorität vor dem Straßenbau", idx: r(0,3,7,9,11,12,1,5) },
      { text: "Bahnflächen erhalten; Trassenpreise reformieren/Sanierungsfonds; Service", idx: r(2,8,10,6,4,13) },
    ] },
  { aspekt: "Schiene ausbauen", partei: "SPD",
    lang: [
      { text: "Rekordinvestitionen in Sanierung und Ausbau (Erhalt vor Neubau); Digitalisierung; Finanzierungssystem vereinfachen", idx: r(1,2,4,5,9,10,14,17,18,19,6,7,0) },
      { text: "Neubaustrecken (Augsburg–Ulm, Marschbahn, Dresden–Prag); ländlicher Raum/Nebenstrecken; Priorität wie Straße; Beschleunigung; Korridore", idx: r(3,16,13,8,15,20,11,12) },
    ],
    kurz: [
      { text: "Rekordinvestitionen in Sanierung und Ausbau (Erhalt vor Neubau); Digitalisierung", idx: r(1,2,4,5,9,10,14,17,18,19,6,7,0) },
      { text: "Neubaustrecken; ländlicher Raum/Nebenstrecken; Beschleunigung der Planung", idx: r(3,16,13,8,15,20,11,12) },
    ] },

  // ===== Straßenbau / Sanierung =====
  { aspekt: "Straßenbau / Sanierung", partei: "AfD",
    lang: [{ text: "Massiv mehr Mittel für Straßen- und Brückensanierung; Straße als Priorität (Straßenverkehr bleibt dominant)", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14) }],
    kurz: [{ text: "Massiv mehr Mittel für Straßen- und Brückensanierung; Straße als Priorität", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14) }] },
  { aspekt: "Straßenbau / Sanierung", partei: "CDU/CSU",
    lang: [{ text: "Rekordinvestitionen in Straßensanierung und Brückenerneuerung, gleichberechtigt mit Schiene; schnellere Planung und Genehmigung", idx: r(0,1,2,3,4,5,6,7,8,9) }],
    kurz: [{ text: "Rekordinvestitionen in Straßensanierung und Brücken, gleichberechtigt mit Schiene", idx: r(0,1,2,3,4,5,6,7,8,9) }] },
  { aspekt: "Straßenbau / Sanierung", partei: "GRÜNE",
    lang: [{ text: "Sanierung und Erhalt von Brücken/Bundesstraßen vor Neubau; Kritik an einseitiger Fokussierung auf die Straße", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Sanierung und Erhalt vor Neubau; Kritik an einseitiger Straßen-Priorität", idx: r(0,1,2,3,4,5,6) }] },
  { aspekt: "Straßenbau / Sanierung", partei: "LINKE",
    lang: [{ text: "Erhalt und Sanierung statt Neubau; gegen Umgehung von Naturschutz durch Einstufung als sicherheitsrelevante Infrastruktur", idx: r(0,1,2,3) }],
    kurz: [{ text: "Erhalt und Sanierung statt Neubau; gegen Umgehung von Naturschutzvorschriften", idx: r(0,1,2,3) }] },
  { aspekt: "Straßenbau / Sanierung", partei: "SPD",
    lang: [{ text: "Rekordinvestitionen in die Sanierung von Brücken, Tunneln und Fahrbahnen bei allen Verkehrsträgern", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Rekordinvestitionen in die Sanierung von Brücken und Fahrbahnen", idx: r(0,1,2,3,4) }] },

  // ===== Tempolimit Autobahn =====
  { aspekt: "Tempolimit Autobahn", partei: "AfD",
    lang: [{ text: "Ablehnung eines Tempolimits (Wahlfreiheit; Verweis auf Sicherheitsstatistiken)", idx: r(0,1) }],
    kurz: [{ text: "Ablehnung eines Tempolimits (Wahlfreiheit, Sicherheitsstatistiken)", idx: r(0,1) }] },
  { aspekt: "Tempolimit Autobahn", partei: "CDU/CSU",
    lang: [{ text: "Ablehnung eines generellen Tempolimits (flexible Begrenzungen nur an Gefahrenstellen; minimale CO₂-Wirkung)", idx: r(0,1,2) }],
    kurz: [{ text: "Ablehnung eines generellen Tempolimits (nur an Gefahrenstellen)", idx: r(0,1,2) }] },
  { aspekt: "Tempolimit Autobahn", partei: "GRÜNE",
    lang: [{ text: "Tempolimit von 130 km/h als kostengünstige Maßnahme für Klimaschutz und Verkehrssicherheit", idx: r(0,1) }],
    kurz: [{ text: "Tempolimit 130 km/h für Klimaschutz und Verkehrssicherheit", idx: r(0,1) }] },
  { aspekt: "Tempolimit Autobahn", partei: "LINKE",
    lang: [{ text: "Befürwortung eines Tempolimits für Verkehrssicherheit, geringeren Spritverbrauch und als Teil der Verkehrswende", idx: r(0,1,2) }],
    kurz: [{ text: "Befürwortung eines Tempolimits (Sicherheit, Spritverbrauch, Verkehrswende)", idx: r(0,1,2) }] },
  { aspekt: "Tempolimit Autobahn", partei: "SPD",
    lang: [{ text: "Tempolimit grundsätzlich als Klimaschutz-/Sicherheitsmaßnahme befürwortet, aber nur befristet als Krisenmaßnahme (nicht im Koalitionsvertrag)", idx: r(0) }],
    kurz: [{ text: "Tempolimit grundsätzlich befürwortet, aber nur befristet als Krisenmaßnahme", idx: r(0) }] },

  // ===== Verbrenner / E-Mobilität =====
  { aspekt: "Verbrenner / E-Mobilität", partei: "AfD",
    lang: [
      { text: "Gegen das Verbrennerverbot 2035; für Technologieoffenheit und Wahlfreiheit; Verbrennungsmotor erhalten (Arbeitsplätze)", idx: r(0,1,2,3,6,8,9,11,12,15,16,19,21,23,24,4) },
      { text: "Gegen E-Auto-Zwang, Spritpreiserhöhung und CO₂-Bepreisung; bezahlbares Autofahren", idx: r(5,7,18) },
      { text: "Gegen E-Auto-Subventionen/Steuergerechtigkeit; Stromengpässe; Elektrobusse unwirtschaftlich; autonomes Fahren", idx: r(13,14,17,25,26,10,20,22) },
    ],
    kurz: [
      { text: "Gegen das Verbrennerverbot 2035; für Technologieoffenheit und Wahlfreiheit; gegen E-Auto-Zwang und CO₂-Bepreisung", idx: r(0,1,2,3,6,8,9,11,12,15,16,19,21,23,24,4,5,7,18) },
      { text: "Gegen E-Auto-Subventionen (Steuergerechtigkeit); Stromengpässe; Elektrobusse unwirtschaftlich", idx: r(13,14,17,25,26,10,20,22) },
    ] },
  { aspekt: "Verbrenner / E-Mobilität", partei: "CDU/CSU",
    lang: [
      { text: "Technologieoffenheit: Verbrenner mit E-Fuels/Wasserstoff neben E-Mobilität; gegen pauschales Verbrennerverbot 2035", idx: r(3,7,8,9,11,14) },
      { text: "E-Mobilität fördern (Kfz-Steuerbefreiung bis 2035, Ladeinfrastruktur, Elektro-Lkw-Mautbefreiung)", idx: r(0,4,5,12,13,2) },
      { text: "Höhere Ethanol-/E20-Beimischung; autonomes Fahren", idx: r(10,15,1,6) },
    ],
    kurz: [
      { text: "Technologieoffenheit (Verbrenner mit E-Fuels/Wasserstoff neben E-Mobilität), gegen pauschales Verbrennerverbot", idx: r(3,7,8,9,11,14) },
      { text: "E-Mobilität fördern (Kfz-Steuerbefreiung bis 2035, Ladeinfrastruktur); Ethanol-Beimischung; autonomes Fahren", idx: r(0,4,5,12,13,2,10,15,1,6) },
    ] },
  { aspekt: "Verbrenner / E-Mobilität", partei: "GRÜNE",
    lang: [
      { text: "Verbrenner-Ausstieg 2035 und Förderung der E-Mobilität (Ladeinfrastruktur, Steueranreize, Elektrobusse)", idx: r(0,1,2,5,6,7) },
      { text: "Kritik an unzureichender E-Mobilitätsförderung; Warnung vor E-Fuel-Spritpreisen", idx: r(3,4) },
    ],
    kurz: [
      { text: "Verbrenner-Ausstieg 2035 und Förderung der E-Mobilität (Ladeinfrastruktur, Steueranreize)", idx: r(0,1,2,5,6,7) },
      { text: "Kritik an unzureichender E-Mobilitätsförderung; Warnung vor E-Fuel-Spritpreisen", idx: r(3,4) },
    ] },
  { aspekt: "Verbrenner / E-Mobilität", partei: "LINKE",
    lang: [
      { text: "E-Mobilität und Technologiewende statt Verbrenner-Fixierung; sozialökologisch (gegen E-SUV-Bevorzugung)", idx: r(0,1,4,5) },
      { text: "Gegen THG-Quote als Greenwashing und Agrokraftstoff-Beimischung (echte Elektrifizierung)", idx: r(2,3) },
    ],
    kurz: [
      { text: "E-Mobilität statt Verbrenner-Fixierung, sozialökologisch ausgestaltet", idx: r(0,1,4,5) },
      { text: "Gegen THG-Quote als Greenwashing und Agrokraftstoff-Beimischung", idx: r(2,3) },
    ] },
  { aspekt: "Verbrenner / E-Mobilität", partei: "SPD",
    lang: [
      { text: "E-Mobilität fördern (Ladeinfrastruktur, Steuerbefreiung bis 2035) als Zukunft und Unabhängigkeit von Ölimporten", idx: r(0,1,2,3,4,5,6,8,9,10) },
      { text: "Verbrennerverbot 2035 relativieren (nur neue Fahrzeuge emissionsfrei); Technologieoffenheit, Hybride als Brücke", idx: r(7,11,12) },
    ],
    kurz: [
      { text: "E-Mobilität fördern (Ladeinfrastruktur, Steuerbefreiung bis 2035) als Zukunft und Unabhängigkeit", idx: r(0,1,2,3,4,5,6,8,9,10) },
      { text: "Verbrennerverbot 2035 relativieren (nur neue Fahrzeuge emissionsfrei); Technologieoffenheit", idx: r(7,11,12) },
    ] },
];

applySynthese("Verkehr", CELLS);
