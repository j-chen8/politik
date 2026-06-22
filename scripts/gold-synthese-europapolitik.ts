/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Europapolitik und Europäische Union" (37 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Grundhaltung zur EU =====
  { aspekt: "Grundhaltung zur EU", partei: "AfD",
    lang: [
      { text: "Kritik an EU-Überregulierung, Zentralismus und Planwirtschaft; für Subsidiarität, nationale Souveränität und ein Europa der Nationalstaaten", idx: r(0,2,3,6,7,8,10) },
      { text: "Kritik an der EU-Kommission (Massenüberwachung, missachteter Bürgerwille) und an EU-Recht als Instrument der Migrations- und Werbepolitik; neokoloniale Entwicklungspolitik", idx: r(4,5,11,9,1) },
    ],
    kurz: [
      { text: "Kritik an EU-Überregulierung und Zentralismus; für Subsidiarität und ein Europa der Nationalstaaten", idx: r(0,2,3,6,7,8,10) },
      { text: "Kritik an der EU-Kommission und an EU-Recht als Migrationsinstrument", idx: r(4,5,11,9,1) },
    ] },
  { aspekt: "Grundhaltung zur EU", partei: "CDU/CSU",
    lang: [
      { text: "Starkes, geeintes Europa als Stabilitätsanker und Garant für Wohlstand gegen Nationalismus und Zersplitterung", idx: r(2,3,4,5,9,10,12,14,15,6) },
      { text: "Aber Vereinfachung, weniger Bürokratie und bessere Durchsetzung europäischer Regeln; Brexit bedauern, UK-Tür offen halten", idx: r(7,8,11,0,13,1) },
    ],
    kurz: [
      { text: "Starkes, geeintes Europa als Stabilitätsanker gegen Nationalismus", idx: r(2,3,4,5,9,10,12,14,15,6) },
      { text: "Aber Vereinfachung und bessere Durchsetzung europäischer Regeln; UK-Tür offen halten", idx: r(7,8,11,0,13,1) },
    ] },
  { aspekt: "Grundhaltung zur EU", partei: "GRÜNE",
    lang: [{ text: "Starke EU-Befürwortung als Friedensgarant und Gegenpol zu Bedrohungen und Big Tech; gegen nationale Alleingänge und EU-Skeptizismus; digitale Souveränität", idx: r(0,2,3,5,6,7,8,9,10,11,12,1,4) }],
    kurz: [{ text: "Starke EU-Befürwortung als Friedensgarant; gegen nationale Alleingänge; digitale Souveränität", idx: r(0,2,3,5,6,7,8,9,10,11,12,1,4) }] },
  { aspekt: "Grundhaltung zur EU", partei: "LINKE",
    lang: [
      { text: "Ein solidarisches, soziales Europa befürworten (soziale Absicherung im Mittelpunkt)", idx: r(2,3) },
      { text: "Kritik an EU-Handelspolitik als kolonial und an gescheiterter EU-Politik in Bosnien; Rückkehr zur Rechtsstaatlichkeit", idx: r(0,1,4) },
    ],
    kurz: [
      { text: "Ein solidarisches, soziales Europa befürworten", idx: r(2,3) },
      { text: "Kritik an EU-Handelspolitik als kolonial; Rückkehr zur Rechtsstaatlichkeit", idx: r(0,1,4) },
    ] },
  { aspekt: "Grundhaltung zur EU", partei: "SPD",
    lang: [
      { text: "Europäische Integration als Friedens- und Wohlstandsprojekt mit sozialen und rechtsstaatlichen Leitplanken; gegen nationale Alleingänge und Austritt", idx: r(0,1,3,5,7,8,9,10,11) },
      { text: "Westbalkan-Stabilisierung und UK-Rückkehr; gegenseitige Sozialansprüche; einheitliche Lohn- und Arbeitsstandards", idx: r(4,6,2,12) },
    ],
    kurz: [
      { text: "Europäische Integration als Friedens- und Wohlstandsprojekt; gegen nationale Alleingänge und Austritt", idx: r(0,1,3,5,7,8,9,10,11) },
      { text: "Westbalkan-Stabilisierung und UK-Rückkehr; einheitliche Lohn- und Arbeitsstandards", idx: r(4,6,2,12) },
    ] },

  // ===== EU-Erweiterung =====
  { aspekt: "EU-Erweiterung", partei: "AfD",
    lang: [{ text: "Gegen die Euroeinführung Bulgariens; Kritik an der Truppenentsendung in Länder bis zu deren EU-Beitritt", idx: r(0,1) }],
    kurz: [{ text: "Gegen die Euroeinführung Bulgariens; Kritik an Truppenentsendung vor EU-Beitritt", idx: r(0,1) }] },
  { aspekt: "EU-Erweiterung", partei: "CDU/CSU",
    lang: [
      { text: "EU-Erweiterung (Ukraine, Westbalkan, Bosnien) als Stabilitäts- und Reforminstrument unter rechtsstaatlichen Bedingungen", idx: r(1,2,3,4,5,7,8,6) },
      { text: "UK-Rückkehr offen halten; Warnung vor EU-Austritt (Brexit-Beispiel)", idx: r(0,9) },
    ],
    kurz: [
      { text: "EU-Erweiterung (Ukraine, Westbalkan) als Stabilitätsinstrument unter rechtsstaatlichen Bedingungen", idx: r(1,2,3,4,5,7,8,6) },
      { text: "UK-Rückkehr offen halten; Warnung vor EU-Austritt", idx: r(0,9) },
    ] },
  { aspekt: "EU-Erweiterung", partei: "GRÜNE",
    lang: [{ text: "EU-Beitritt von Bosnien und dem Westbalkan befürworten als Stabilisierung der Region", idx: r(0,1) }],
    kurz: [{ text: "EU-Beitritt von Bosnien und dem Westbalkan befürworten", idx: r(0,1) }] },
  { aspekt: "EU-Erweiterung", partei: "SPD",
    lang: [{ text: "EU-Beitritt der Ukraine und Bosniens als Stabilisierung (rechtsstaatliche Standards); UK-Rückkehr", idx: r(0,1,2,3) }],
    kurz: [{ text: "EU-Beitritt der Ukraine und Bosniens als Stabilisierung; UK-Rückkehr", idx: r(0,1,2,3) }] },

  // ===== Binnenmarkt / Handel =====
  { aspekt: "Binnenmarkt / Handel", partei: "AfD",
    lang: [{ text: "Für Freihandel ohne Lieferkettenbürokratie und Agenda-2030-Verpflichtungen; gegen EU-Wettbewerbspolitik; EPA mit Afrika als neokolonial kritisiert", idx: r(0,1,2) }],
    kurz: [{ text: "Für Freihandel ohne Lieferkettenbürokratie; EPA mit Afrika als neokolonial kritisiert", idx: r(0,1,2) }] },
  { aspekt: "Binnenmarkt / Handel", partei: "CDU/CSU",
    lang: [{ text: "Binnenmarkt und Freihandel (Mercosur, Chile/Vietnam/Singapur) befürworten gegen Protektionismus und Renationalisierung; Deregulierung; EU-Emissionshandel statt nationaler Alleingänge", idx: r(0,3,4,2,5,6,1) }],
    kurz: [{ text: "Binnenmarkt und Freihandel befürworten gegen Protektionismus; Deregulierung", idx: r(0,3,4,2,5,6,1) }] },
  { aspekt: "Binnenmarkt / Handel", partei: "GRÜNE",
    lang: [{ text: "Binnenmarkt selbstbewusst gegen US-Handelsangriffe verteidigen; gegen Grenzkontrollen; EPA mit Afrika mit sozialen/ökologischen Standards modernisieren", idx: r(2,0,1) }],
    kurz: [{ text: "Binnenmarkt gegen US-Handelsangriffe verteidigen; Handelsabkommen mit Standards", idx: r(2,0,1) }] },
  { aspekt: "Binnenmarkt / Handel", partei: "LINKE",
    lang: [{ text: "EU-Handelsabkommen mit Afrika und Asien als unfair und ausbeuterisch ablehnen (gegen radikalen Zollabbau zulasten ärmerer Länder)", idx: r(0) }],
    kurz: [{ text: "EU-Handelsabkommen mit Afrika/Asien als ausbeuterisch ablehnen", idx: r(0) }] },
  { aspekt: "Binnenmarkt / Handel", partei: "SPD",
    lang: [{ text: "Offene Märkte und faire Handelsbeziehungen; einheitliche Produktsicherheit und Herkunftsschutz; offene Grenzen für Fachkräftemobilität", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Offene Märkte und faire Handelsbeziehungen; einheitliche Produktsicherheit", idx: r(0,1,2,3,4,5) }] },

  // ===== Rechtsstaatlichkeit / Menschenrechte =====
  { aspekt: "Rechtsstaatlichkeit / Menschenrechte", partei: "AfD",
    lang: [{ text: "Gegen die Absenkung von Datenschutz und rechtsstaatlichen Garantien durch EU-Regelungen (Massenüberwachung, Chatkontrolle, TTPA); nationale Grundrechte und Verfassungsidentität wahren", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Gegen Absenkung von Datenschutz durch EU-Regelungen; nationale Grundrechte wahren", idx: r(0,1,2,3,4) }] },
  { aspekt: "Rechtsstaatlichkeit / Menschenrechte", partei: "CDU/CSU",
    lang: [{ text: "Rechtsstaatliche Absicherung bei grenzüberschreitender Strafverfolgung (E-Evidence); Kinderschutz mit Grundrechtsschutz (gegen anlasslose Chatkontrolle); europäisches Asylrecht durchsetzen", idx: r(0,1,5,2,3,4) }],
    kurz: [{ text: "Rechtsstaatliche Strafverfolgung (E-Evidence); Kinderschutz ohne anlasslose Chatkontrolle; Asylrecht durchsetzen", idx: r(0,1,5,2,3,4) }] },
  { aspekt: "Rechtsstaatlichkeit / Menschenrechte", partei: "GRÜNE",
    lang: [
      { text: "Rechtsstaatliche, grundrechtskonforme Sicherheitsstrukturen (Europol mit Kontrolle); gegen Chatkontrolle; gegen europarechtswidrige Grenzrückweisungen", idx: r(0,1,6,3,2) },
      { text: "Konditionalität (Gelder bei Rechtsstaatsverstößen zurückhalten); Sanktionen gegen Dodik; EU-Digitalregulierung; Handelsabkommen mit verbindlichen Standards", idx: r(4,5,8,7) },
    ],
    kurz: [
      { text: "Rechtsstaatliche, grundrechtskonforme Sicherheitsstrukturen; gegen Chatkontrolle und europarechtswidrige Grenzrückweisungen", idx: r(0,1,6,3,2) },
      { text: "Konditionalität bei Rechtsstaatsverstößen; EU-Digitalregulierung; Handelsabkommen mit Standards", idx: r(4,5,8,7) },
    ] },
  { aspekt: "Rechtsstaatlichkeit / Menschenrechte", partei: "LINKE",
    lang: [{ text: "Gegen mangelnden Grundrechtsschutz bei Europol und Datenweitergabe an Rechtsstaatsdefizit-Länder (Ungarn); gegen europarechtswidrige Grenzkontrollen, den Hohen Repräsentanten in Bosnien und Schiedsgerichte in Handelsabkommen", idx: r(1,3,2,0,4) }],
    kurz: [{ text: "Gegen mangelnden Grundrechtsschutz bei Europol; gegen europarechtswidrige Grenzkontrollen", idx: r(1,3,2,0,4) }] },
  { aspekt: "Rechtsstaatlichkeit / Menschenrechte", partei: "SPD",
    lang: [{ text: "Einhaltung von Asyl- und Menschenrechten in der europäischen Rechtsordnung; Mahnung gegen die Leugnung des Srebrenica-Genozids", idx: r(1,0) }],
    kurz: [{ text: "Einhaltung von Asyl- und Menschenrechten in der EU; gegen Leugnung des Srebrenica-Genozids", idx: r(1,0) }] },

  // ===== EU-Finanzen / Eigenmittel =====
  { aspekt: "EU-Finanzen / Eigenmittel", partei: "AfD",
    lang: [{ text: "Gegen den Anwachs des EU-Haushalts (über 2 Bio. €) und neue Eigenmittel; Deutschland als Nettozahler; gegen ideologisch gebundene, bürokratische Fördermittel", idx: r(0,2,1) }],
    kurz: [{ text: "Gegen Anwachs des EU-Haushalts und neue Eigenmittel; Deutschland als Nettozahler", idx: r(0,2,1) }] },
  { aspekt: "EU-Finanzen / Eigenmittel", partei: "CDU/CSU",
    lang: [{ text: "Gegen neue Eigenmittel und Haushaltsanwachs (Konsolidierung); Vereinfachung der Haushaltsstruktur und weniger Förderbürokratie für Kommunen", idx: r(2,0,1) }],
    kurz: [{ text: "Gegen neue Eigenmittel und Haushaltsanwachs; Vereinfachung der Haushaltsstruktur", idx: r(2,0,1) }] },
  { aspekt: "EU-Finanzen / Eigenmittel", partei: "GRÜNE",
    lang: [{ text: "Gegen Sparmaßnahmen beim EU-Budget; neue Einnahmequellen (Digitalsteuer); Kohäsionspolitik für ländliche Räume verbessern", idx: r(1,0) }],
    kurz: [{ text: "Gegen Sparmaßnahmen beim EU-Budget; neue Einnahmequellen (Digitalsteuer)", idx: r(1,0) }] },
  { aspekt: "EU-Finanzen / Eigenmittel", partei: "LINKE",
    lang: [{ text: "Kritik am Stabilitäts- und Wachstumspakt als investitionsbremsend; Forderung nach stärker finanziertem Budget für Soziales und regionale Förderung statt Kürzungen", idx: r(0,1) }],
    kurz: [{ text: "Stabilitätspakt als investitionsbremsend; stärker finanziertes Sozial-Budget", idx: r(0,1) }] },
  { aspekt: "EU-Finanzen / Eigenmittel", partei: "SPD",
    lang: [{ text: "EU-Finanzpakete für die Ukraine verteidigen (Reparationsbindung); Kompromisse beim Mehrjährigen Finanzrahmen, Kritik an Mehrausgaben und neuen Einnahmen", idx: r(0,1) }],
    kurz: [{ text: "EU-Finanzpakete für die Ukraine verteidigen; Kompromisse beim Finanzrahmen", idx: r(0,1) }] },

  // ===== Entscheidungsregeln =====
  { aspekt: "Entscheidungsregeln", partei: "AfD",
    lang: [{ text: "Subsidiarität und Respekt vor lokalen Kompetenzen (nationale Regelungen vor EU); Kritik an fehlender Umsetzung von EP-Beschlüssen durch den Rat", idx: r(1,2,0) }],
    kurz: [{ text: "Subsidiarität (nationale Regelungen vor EU); Kritik an Umsetzungsdefiziten des Rates", idx: r(1,2,0) }] },
  { aspekt: "Entscheidungsregeln", partei: "CDU/CSU",
    lang: [{ text: "Einstimmigkeitsprinzip bei Sanktionsbeschlüssen abschaffen; Subsidiarität und klare Zuständigkeiten; Dublin-Verordnung durchsetzen; Kritik an EU-Uneinigkeit (Zeitumstellung)", idx: r(2,0,3,1,4) }],
    kurz: [{ text: "Einstimmigkeit bei Sanktionen abschaffen; Subsidiarität; Dublin-Verordnung durchsetzen", idx: r(2,0,3,1,4) }] },
  { aspekt: "Entscheidungsregeln", partei: "GRÜNE",
    lang: [{ text: "Forderung nach verbindlichen Entscheidungen des Rates (Zeitumstellung)", idx: r(0) }],
    kurz: [{ text: "Verbindliche Entscheidungen des Rates statt Entscheidungsunfähigkeit", idx: r(0) }] },
  { aspekt: "Entscheidungsregeln", partei: "LINKE",
    lang: [{ text: "Gegen Zentralisierung von Entscheidungen; mehr demokratische Kontrolle und Mitsprache der Bundesländer", idx: r(0) }],
    kurz: [{ text: "Gegen Zentralisierung; mehr demokratische Kontrolle und Länder-Mitsprache", idx: r(0) }] },

  // ===== Euro / Währung =====
  { aspekt: "Euro / Währung", partei: "AfD",
    lang: [{ text: "Kritik am Euro als Ursache wirtschaftlicher Probleme und Kaufkraftverlust; nationale Währungen mit freien Schwankungen besser", idx: r(0) }],
    kurz: [{ text: "Kritik am Euro; nationale Währungen besser", idx: r(0) }] },
  { aspekt: "Euro / Währung", partei: "CDU/CSU",
    lang: [{ text: "Euro-Beitritt Bulgariens befürworten als Zeichen von Stabilität (Konvergenzkriterien erfüllt)", idx: r(0,1) }],
    kurz: [{ text: "Euro-Beitritt Bulgariens befürworten als Stabilitätszeichen", idx: r(0,1) }] },
  { aspekt: "Euro / Währung", partei: "GRÜNE",
    lang: [{ text: "Eurobeitritt Bulgariens (2026) als stabilitätsfördernder Schritt und Stärkung des Euro befürworten", idx: r(0) }],
    kurz: [{ text: "Eurobeitritt Bulgariens befürworten", idx: r(0) }] },
  { aspekt: "Euro / Währung", partei: "LINKE",
    lang: [{ text: "Euro-Einführung Bulgariens als positives Signal für den EU-Zusammenhalt, aber Kritik an den damit verbundenen Stabilitätsregeln und deren sozialen Folgen", idx: r(0) }],
    kurz: [{ text: "Euro-Einführung Bulgariens positiv, aber Kritik an den Stabilitätsregeln", idx: r(0) }] },
  { aspekt: "Euro / Währung", partei: "SPD",
    lang: [{ text: "Eurobeitritt Bulgariens als Integrationssignal und wirtschaftlicher Vorteil befürworten; gegen Desinformationskampagnen", idx: r(0) }],
    kurz: [{ text: "Eurobeitritt Bulgariens als Integrationssignal befürworten", idx: r(0) }] },

  // ===== Militarisierung der EU =====
  { aspekt: "Militarisierung der EU", partei: "AfD",
    lang: [{ text: "Gegen die EU-Militärmission EUFOR-Althea in Bosnien; Forderung nach Ende der deutschen Truppenpräsenz", idx: r(0) }],
    kurz: [{ text: "Gegen die EU-Militärmission EUFOR-Althea und deutsche Truppenpräsenz", idx: r(0) }] },
  { aspekt: "Militarisierung der EU", partei: "CDU/CSU",
    lang: [{ text: "Militärische Aufrüstung Europas als notwendige Reaktion auf die russische Bedrohung; verstärkte Verteidigungskooperation (auch mit Großbritannien)", idx: r(0,1,2) }],
    kurz: [{ text: "Militärische Aufrüstung Europas gegen die russische Bedrohung; Verteidigungskooperation", idx: r(0,1,2) }] },
  { aspekt: "Militarisierung der EU", partei: "GRÜNE",
    lang: [{ text: "Europäische Säule der NATO stärken (gemeinsame Beschaffung, abgestimmte Fähigkeiten); europäische Koordination statt nationaler Alleingänge", idx: r(0,1) }],
    kurz: [{ text: "Europäische Säule der NATO stärken; europäische Koordination statt Alleingänge", idx: r(0,1) }] },
  { aspekt: "Militarisierung der EU", partei: "SPD",
    lang: [{ text: "EU-Sicherheitsmissionen als Ausdruck europäischen Engagements für Frieden und Stabilität befürworten", idx: r(0) }],
    kurz: [{ text: "EU-Sicherheitsmissionen für Frieden und Stabilität befürworten", idx: r(0) }] },
];

applySynthese("Europapolitik und Europäische Union", CELLS);
