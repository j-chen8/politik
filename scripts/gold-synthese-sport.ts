/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Sport, Freizeit und Tourismus" (33 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Spitzensport =====
  { aspekt: "Spitzensport", partei: "AfD",
    lang: [
      { text: "Kritik am Niedergang des Spitzensports und an unzureichender Finanzierung/Infrastruktur; das neue Sportfördergesetz als notwendiger Anfang mit Verbesserungsbedarf", idx: r(0,1,2,4,6,3) },
      { text: "Verbindliche Regelungen zu Schwangerschaft und Mutterschutz im Spitzensport", idx: r(5) },
    ],
    kurz: [{ text: "Kritik an Niedergang und unzureichender Finanzierung des Spitzensports; Sportfördergesetz als Anfang; Mutterschutz", idx: r(0,1,2,4,6,3,5) }] },
  { aspekt: "Spitzensport", partei: "CDU/CSU",
    lang: [{ text: "Leistungsorientierte Spitzensportförderung durch das neue Sportfördergesetz und eine unabhängige Spitzensport-Agentur; Sportmilliarde und Sportstätten", idx: r(0,1,2,3,5,6,4,7) }],
    kurz: [{ text: "Leistungsorientierte Spitzensportförderung durch Sportfördergesetz und unabhängige Agentur", idx: r(0,1,2,3,5,6,4,7) }] },
  { aspekt: "Spitzensport", partei: "GRÜNE",
    lang: [{ text: "Bessere Förderung und verbindliche Schutzstrukturen, stärkere Steuerung der Spitzensportagentur; gegen Privatisierung sozialer Risiken", idx: r(0,1,2,3) }],
    kurz: [{ text: "Bessere Förderung und Schutzstrukturen; stärkere Steuerung der Agentur", idx: r(0,1,2,3) }] },
  { aspekt: "Spitzensport", partei: "LINKE",
    lang: [{ text: "Existenzsichernde Mindestförderung von 1.800 € monatlich für Bundeskader und bessere soziale Absicherung", idx: r(0,1) }],
    kurz: [{ text: "Existenzsichernde Mindestförderung (1.800 €) und soziale Absicherung", idx: r(0,1) }] },
  { aspekt: "Spitzensport", partei: "SPD",
    lang: [{ text: "Sportfördergesetz für eine transparentere, gerechtere Förderung mit höherer Grundförderung und sozialer Absicherung; Spitzensportagentur zur besseren Steuerung", idx: r(2,4,0,1,3) }],
    kurz: [{ text: "Sportfördergesetz für gerechtere Förderung mit sozialer Absicherung; Spitzensportagentur", idx: r(2,4,0,1,3) }] },

  // ===== Sportstätten sanieren =====
  { aspekt: "Sportstätten sanieren", partei: "AfD",
    lang: [
      { text: "Massiver Sanierungsstau (40 Mrd. €); Sportmilliarde unzureichend, Forderung nach mehrjährigem Sanierungsprogramm und unbürokratischen Förderverfahren", idx: r(0,1,2,4,5,3) },
      { text: "Moderne, barrierefreie Sportstätten; Präferenz für Winterspiele wegen nutzbarem Bestand", idx: r(6,7) },
    ],
    kurz: [{ text: "Massiver Sanierungsstau (40 Mrd. €); Sportmilliarde unzureichend, mehrjähriges Sanierungsprogramm gefordert", idx: r(0,1,2,4,5,3,6,7) }] },
  { aspekt: "Sportstätten sanieren", partei: "CDU/CSU",
    lang: [{ text: "Sanierung und Modernisierung über die Sportmilliarde (etwa 40 % sanierungsbedürftig); kommunale Verantwortung anerkannt; gegen unrealistische Forderungen ohne Finanzierung", idx: r(0,1,2,3) }],
    kurz: [{ text: "Sanierung über die Sportmilliarde; kommunale Verantwortung; gegen unrealistische Forderungen", idx: r(0,1,2,3) }] },
  { aspekt: "Sportstätten sanieren", partei: "GRÜNE",
    lang: [{ text: "Dringende, bedarfsgerechte Investitionen in die Sportstättensanierung (Turnhallen, Schwimmbäder) verbunden mit Klimaschutz und Energieeffizienz", idx: r(1,0) }],
    kurz: [{ text: "Bedarfsgerechte Sportstättensanierung verbunden mit Klimaschutz", idx: r(1,0) }] },
  { aspekt: "Sportstätten sanieren", partei: "LINKE",
    lang: [{ text: "Investitionsstau (31 Mrd. €) beseitigen; Kritik an maroder Infrastruktur in den Städten", idx: r(0,1) }],
    kurz: [{ text: "Investitionsstau (31 Mrd. €) beseitigen; Kritik an maroder Infrastruktur", idx: r(0,1) }] },
  { aspekt: "Sportstätten sanieren", partei: "SPD",
    lang: [{ text: "Investitionen in Sportstätten über ein 1-Mrd.-€-Programm und das Sondervermögen; Sanierung primär in der Verantwortung von Ländern, Kommunen und Vereinen", idx: r(0,2,1) }],
    kurz: [{ text: "Investitionen in Sportstätten über 1-Mrd.-€-Programm und Sondervermögen", idx: r(0,2,1) }] },

  // ===== Olympia-Bewerbung =====
  { aspekt: "Olympia-Bewerbung", partei: "AfD",
    lang: [{ text: "Olympia-Bewerbung befürworten unter Bedingung solider Planung, Bürgerbeteiligung und vorheriger Stärkung der Infrastruktur; Kritik an ausufernden Kosten", idx: r(0,1,2) }],
    kurz: [{ text: "Olympia-Bewerbung unter Bedingung solider Planung; Kritik an ausufernden Kosten", idx: r(0,1,2) }] },
  { aspekt: "Olympia-Bewerbung", partei: "CDU/CSU",
    lang: [{ text: "Deutsche Olympia- und Paralympia-Bewerbung (2036/2040/2044) als Chance für Breiten- und Leistungssport befürworten", idx: r(0,1,2,3) }],
    kurz: [{ text: "Deutsche Olympia-/Paralympia-Bewerbung als Chance für Breiten- und Leistungssport", idx: r(0,1,2,3) }] },
  { aspekt: "Olympia-Bewerbung", partei: "GRÜNE",
    lang: [{ text: "Olympia-/Paralympia-Bewerbung als Chance für Sportinfrastruktur, Breitensport, Inklusion und Klimaneutralität", idx: r(0,1,2,3) }],
    kurz: [{ text: "Olympia-/Paralympia-Bewerbung als Chance für Infrastruktur, Inklusion und Klimaneutralität", idx: r(0,1,2,3) }] },
  { aspekt: "Olympia-Bewerbung", partei: "LINKE",
    lang: [{ text: "Olympia-Bewerbung als unrealistisch angesichts maroder Infrastruktur in den Städten kritisiert", idx: r(0) }],
    kurz: [{ text: "Olympia-Bewerbung als unrealistisch angesichts maroder Infrastruktur kritisiert", idx: r(0) }] },
  { aspekt: "Olympia-Bewerbung", partei: "SPD",
    lang: [{ text: "Olympia-/Paralympia-Bewerbung (2036/2040/2044) als Chance für Sport und Gesellschaft mit transparenter, bürgernaher Planung befürworten", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Olympia-/Paralympia-Bewerbung mit transparenter, bürgernaher Planung befürworten", idx: r(0,1,2,3,4) }] },

  // ===== Gewaltschutz im Sport =====
  { aspekt: "Gewaltschutz im Sport", partei: "CDU/CSU",
    lang: [{ text: "Gegen Gewalt im Stadion (Pyrotechnik, Angriffe auf Einsatzkräfte); konsequentere Durchsetzung von Regeln und Sicherheitsmaßnahmen", idx: r(0) }],
    kurz: [{ text: "Gegen Gewalt im Stadion; konsequentere Durchsetzung von Regeln", idx: r(0) }] },
  { aspekt: "Gewaltschutz im Sport", partei: "GRÜNE",
    lang: [
      { text: "Verbindliche Schutzstandards und Umsetzung des Safe Sport Code als Fördervoraussetzung (gegen freiwillige Regelungen)", idx: r(0,1) },
      { text: "Sport als Ort gegen Diskriminierung, Antisemitismus und Rassismus; Prävention und Dialog mit Fans statt Repression", idx: r(2,3,4) },
    ],
    kurz: [
      { text: "Verbindliche Schutzstandards und Safe Sport Code als Fördervoraussetzung", idx: r(0,1) },
      { text: "Sport gegen Diskriminierung; Prävention und Dialog statt Repression", idx: r(2,3,4) },
    ] },
  { aspekt: "Gewaltschutz im Sport", partei: "LINKE",
    lang: [{ text: "Gegen Gesichtsscanner, KI-Überwachung und kollektive Stadionverbote; Dialog und Fanprojekte statt Repression", idx: r(0) }],
    kurz: [{ text: "Gegen Überwachung und Stadionverbote; Dialog und Fanprojekte statt Repression", idx: r(0) }] },
  { aspekt: "Gewaltschutz im Sport", partei: "SPD",
    lang: [{ text: "Aufbau eines unabhängigen Zentrums für Safe Sport zum Schutz von Athleten vor Gewalt und Missbrauch", idx: r(0) }],
    kurz: [{ text: "Unabhängiges Zentrum für Safe Sport zum Schutz von Athleten", idx: r(0) }] },

  // ===== Förderung Mädchen / queer =====
  { aspekt: "Förderung Mädchen / queer", partei: "AfD",
    lang: [{ text: "Schutz und Gleichberechtigung von Spitzensportlerinnen in Schwangerschaft und Mutterschaft", idx: r(0) }],
    kurz: [{ text: "Schutz von Spitzensportlerinnen in Schwangerschaft und Mutterschaft", idx: r(0) }] },
  { aspekt: "Förderung Mädchen / queer", partei: "CDU/CSU",
    lang: [{ text: "Sport als Integrationsinstrument für Menschen mit Migrationshintergrund; inklusive Sportstrukturen in Vereinen", idx: r(0) }],
    kurz: [{ text: "Sport als Integrationsinstrument; inklusive Vereinsstrukturen", idx: r(0) }] },
  { aspekt: "Förderung Mädchen / queer", partei: "GRÜNE",
    lang: [{ text: "Gleichstellung von Frauen und Mutterschutz als explizites Ziel der Spitzensportförderung; Vielfalt und Inklusion bei einer Olympia-Bewerbung", idx: r(0,1) }],
    kurz: [{ text: "Gleichstellung von Frauen und Mutterschutz im Spitzensport; Vielfalt und Inklusion", idx: r(0,1) }] },
  { aspekt: "Förderung Mädchen / queer", partei: "LINKE",
    lang: [{ text: "Kritik an der Benachteiligung des Leistungssports für Menschen mit Behinderungen gegenüber dem olympischen Sport", idx: r(0) }],
    kurz: [{ text: "Gegen Benachteiligung des Behindertensports gegenüber dem olympischen Sport", idx: r(0) }] },
  { aspekt: "Förderung Mädchen / queer", partei: "SPD",
    lang: [{ text: "Begrüßung der Frauen-EM 2029 und Hervorhebung von Gleichberechtigung durch Sportereignisse", idx: r(0) }],
    kurz: [{ text: "Frauen-EM 2029 und Gleichberechtigung durch Sportereignisse", idx: r(0) }] },

  // ===== Gebührenfreie / inklusive Angebote =====
  { aspekt: "Gebührenfreie / inklusive Angebote", partei: "CDU/CSU",
    lang: [{ text: "Olympische Spiele möglichst vielen Menschen zugänglich machen als Fest der Inklusion", idx: r(0) }],
    kurz: [{ text: "Olympische Spiele als Fest der Inklusion zugänglich machen", idx: r(0) }] },
  { aspekt: "Gebührenfreie / inklusive Angebote", partei: "GRÜNE",
    lang: [{ text: "Sportstätten als Orte für Inklusion und Barrierefreiheit für Menschen mit und ohne Handicap", idx: r(0) }],
    kurz: [{ text: "Sportstätten als Orte für Inklusion und Barrierefreiheit", idx: r(0) }] },
  { aspekt: "Gebührenfreie / inklusive Angebote", partei: "SPD",
    lang: [{ text: "Barrierefreiheit bei Sanierung und Neubau von Sportstätten mitdenken für gleichberechtigten Sport", idx: r(0) }],
    kurz: [{ text: "Barrierefreiheit bei Sanierung und Neubau von Sportstätten", idx: r(0) }] },

  // ===== Sportverwaltung =====
  { aspekt: "Sportverwaltung", partei: "AfD",
    lang: [{ text: "Kritik am DOSB für die Ausgrenzung der AfD und Zweifel an dessen Fähigkeit zur Aufrechterhaltung der Vereinskultur", idx: r(0) }],
    kurz: [{ text: "Kritik am DOSB für die Ausgrenzung der AfD", idx: r(0) }] },
  { aspekt: "Sportverwaltung", partei: "CDU/CSU",
    lang: [{ text: "Sportministerium ins Bundeskanzleramt als Signal; unabhängige Sportagentur zur Reduktion von politischem und Verbandseinfluss", idx: r(0,1) }],
    kurz: [{ text: "Sportministerium ins Kanzleramt; unabhängige Sportagentur", idx: r(0,1) }] },
  { aspekt: "Sportverwaltung", partei: "GRÜNE",
    lang: [{ text: "Stimmberechtigte Mitentscheidung von Athleten im Stiftungsrat der Spitzensport-Agentur; klare Steuerungskompetenz der Agentur", idx: r(0,1) }],
    kurz: [{ text: "Stimmberechtigte Athleten-Mitentscheidung und klare Steuerungskompetenz der Agentur", idx: r(0,1) }] },

  // ===== Schwimmen lernen =====
  { aspekt: "Schwimmen lernen", partei: "AfD",
    lang: [{ text: "Kritik an der Schließung von Hallenbädern und am fehlenden Schwimmunterricht für Kinder", idx: r(0) }],
    kurz: [{ text: "Kritik an Hallenbad-Schließungen und fehlendem Schwimmunterricht", idx: r(0) }] },

  // ===== Sport als Staatsziel (GG) =====
  { aspekt: "Sport als Staatsziel (GG)", partei: "AfD",
    lang: [{ text: "Gesetzliche Verankerung der Spitzensportförderung als Umsetzung des Grundgesetzes", idx: r(0) }],
    kurz: [{ text: "Gesetzliche Verankerung der Spitzensportförderung", idx: r(0) }] },

  // ===== Tourismus =====
  { aspekt: "Tourismus", partei: "CDU/CSU",
    lang: [{ text: "Wirtschaftliche Stärkung von Tourismus, Hotellerie und Gastronomie durch Sportgroßveranstaltungen", idx: r(0) }],
    kurz: [{ text: "Stärkung von Tourismus und Gastronomie durch Sportgroßveranstaltungen", idx: r(0) }] },
];

applySynthese("Sport, Freizeit und Tourismus", CELLS);
