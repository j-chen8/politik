/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Batch 2a: Fachkräftesicherung,
 * Förderung an Bedingungen knüpfen, Staatliche Investitionsfonds, Start-up-Förderung.
 * Index-basiert; beide Varianten (synthese_json + synthese_kurz_json).
 *   npx tsx scripts/gold-synthese-pilot-4.ts
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";

const CELLS: Cell[] = [
  // ===== FACHKRÄFTESICHERUNG =====
  { aspekt: "Fachkräftesicherung", partei: "AfD",
    lang: [
      { text: "Inländische Fachkräfte halten und zurückholen — vor Anwerbung ausländischer; Kritik an Abwanderung und Zuwanderungsprogrammen", idx: [5,6,13] },
      { text: "Ausbildung im eigenen Land als Kernaufgabe; Bildung und MINT-Leistungen stärken statt „Zukauf“", idx: [11,15] },
      { text: "Hohe Steuern, Abgaben und Überregulierung verschärfen den Mangel und treiben Fachkräfte ins Ausland", idx: [4,10,12,14] },
      { text: "„Arbeit muss sich lohnen“, damit mehr gearbeitet wird; Bürokratieabbau setzt Arbeitskräfte frei", idx: [0,9] },
      { text: "Mindestlohnerhöhung gefährdet Arbeitsplätze", idx: [1] },
      { text: "Mangel als Investitionshindernis und Folge der demografischen Krise; Vereinbarkeit von Familie und Selbstständigkeit (Frauen)", idx: [3,8] },
      { text: "Branchenspezifischer Mangel (Fahrer, Handwerk)", idx: [2,7] },
    ],
    kurz: [
      { text: "Inländische Fachkräfte halten/zurückholen statt Zuwanderung; Ausbildung und Bildung/MINT im eigenen Land stärken", idx: [5,6,11,13,15] },
      { text: "Hohe Steuern, Abgaben und Überregulierung verschärfen den Mangel und treiben Fachkräfte ins Ausland", idx: [4,10,12,14] },
      { text: "„Arbeit muss sich lohnen“ und Bürokratieabbau; Mindestlohnerhöhung gefährdet Arbeitsplätze", idx: [0,1,9] },
      { text: "Mangel als Investitionshindernis/demografische Krise; Vereinbarkeit Familie/Selbstständigkeit; branchenspezifisch (Fahrer, Handwerk)", idx: [2,3,7,8] },
    ] },
  { aspekt: "Fachkräftesicherung", partei: "CDU/CSU",
    lang: [
      { text: "Erleichterte Fachkräfteeinwanderung mit Willkommenskultur, gegen Abschottung; Standort attraktiv und planbar machen (Instabilität schreckt ab)", idx: [0,2,3,4,8] },
      { text: "Inländisches Erwerbspotenzial aktivieren statt Alimentierung; Aktivrente und ältere Arbeitnehmer", idx: [1,5,6] },
      { text: "Kritik an Abwanderung von 400.000 Qualifizierten aus der Privatwirtschaft in die Verwaltung", idx: [7] },
      { text: "KI als Chance zur Kompensation fehlender Fachkräfte im Mittelstand", idx: [10] },
      { text: "Gute Bezahlung und Behandlung der Arbeitnehmer gegen den Mangel", idx: [13] },
      { text: "Fachkräfte und Ingenieure als Basis der Wirtschaftsstrategie; Mangel als Wettbewerbsbelastung", idx: [9,12] },
      { text: "Branchenspezifisch: Gastgewerbe, Flughäfen", idx: [11,14] },
    ],
    kurz: [
      { text: "Erleichterte Fachkräfteeinwanderung mit Willkommenskultur (gegen Abschottung); Standort attraktiv/planbar machen", idx: [0,2,3,4,8] },
      { text: "Inländisches Erwerbspotenzial aktivieren (statt Alimentierung); Aktivrente, ältere Arbeitnehmer; KI im Mittelstand", idx: [1,5,6,10] },
      { text: "Fachkräfte/Ingenieure als Basis der Wirtschaftsstrategie; gute Bezahlung; Mangel als Wettbewerbsbelastung", idx: [9,12,13] },
      { text: "Kritik an Abwanderung Qualifizierter in die Verwaltung; branchenspezifisch (Gastgewerbe, Flughäfen)", idx: [7,11,14] },
    ] },
  { aspekt: "Fachkräftesicherung", partei: "GRÜNE",
    lang: [
      { text: "Fachkräfteeinwanderung und Geflüchtete als Chance — Kritik an komplizierten Verfahren, Abschreckungssignalen und negativer Standortdarstellung", idx: [0,1,2,3] },
      { text: "Bessere Ausbildungsbedingungen, v.a. im Handwerk (Wohnheimplätze, Mobilitätsbudget, moderne Stätten)", idx: [5] },
      { text: "Mangel in maritimen Berufen und Steuerkanzleien benannt — Planungssicherheit nötig", idx: [4,6] },
    ],
    kurz: [
      { text: "Fachkräfteeinwanderung und Geflüchtete als Chance — Kritik an Verfahren und Abschreckungssignalen", idx: [0,1,2,3] },
      { text: "Bessere Ausbildungsbedingungen (Handwerk); Mangel maritim und in Steuerkanzleien benannt", idx: [4,5,6] },
    ] },
  { aspekt: "Fachkräftesicherung", partei: "LINKE",
    lang: [
      { text: "Mangel als Folge politischer Vernachlässigung — Investitionen in Berufsschulen, überbetriebliche Ausbildung, kostenfreie Meisterabschlüsse", idx: [0] },
      { text: "Höhere Löhne, Tarifbindung und verlässliche Arbeitszeiten (statt Bürokratieabbau) gegen den Mangel", idx: [1] },
    ],
    kurz: [
      { text: "Mangel als Folge politischer Vernachlässigung — Investitionen in Berufsschulen, überbetriebliche Ausbildung, kostenfreie Meisterabschlüsse", idx: [0] },
      { text: "Höhere Löhne, Tarifbindung und verlässliche Arbeitszeiten (statt Bürokratieabbau)", idx: [1] },
    ] },
  { aspekt: "Fachkräftesicherung", partei: "SPD",
    lang: [
      { text: "Qualifizierung, Weiterbildung und Transformationsnetzwerke (z.B. Elektromobilität); Digitalisierung zur Fachkräftegewinnung", idx: [0,2,8] },
      { text: "Migration nötig (Kritik an Remigration); Europa als Magnet für Top-Talente durch vereinfachte Zuwanderung", idx: [1,5,6] },
      { text: "Gute Arbeitsbedingungen, Sozialstandards und Ausbildung als entscheidend; Handwerk und überbetriebliche Lehrlingsunterweisung", idx: [9,10,11] },
      { text: "Vollzeit ermöglichen — Betreuungs-/Pflegeinfrastruktur und familienfreundliche Arbeitszeiten", idx: [4] },
      { text: "Qualifizierte Fachkräfte als Produktivitätsfaktor", idx: [3] },
      { text: "Fachkräfteausstattung der Bundesnetzagentur prüfen", idx: [7] },
    ],
    kurz: [
      { text: "Qualifizierung, Weiterbildung und Transformationsnetzwerke; Digitalisierung; gute Arbeitsbedingungen und Ausbildung (Handwerk)", idx: [0,2,3,8,9,10,11] },
      { text: "Migration nötig (Kritik an Remigration); Europa als Magnet für Top-Talente, vereinfachte Zuwanderung", idx: [1,5,6] },
      { text: "Vollzeit ermöglichen (Betreuung/Pflege, familienfreundlich); Fachkräfteausstattung der Bundesnetzagentur prüfen", idx: [4,7] },
    ] },

  // ===== FÖRDERUNG AN BEDINGUNGEN KNÜPFEN =====
  { aspekt: "Förderung an Bedingungen knüpfen", partei: "AfD",
    lang: [
      { text: "Gegen Koppelung öffentlicher Aufträge und Förderung an Tarifbindung, ideologische oder ESG-Kriterien", idx: [0,1,5] },
      { text: "Gegen Verknüpfung von Handelsabkommen mit Standards (paternalistisch) und gegen Investitionsverpflichtungen für Marktzugang", idx: [2,4] },
      { text: "Für verbindliche Standards gegen unlautere Handelspraktiken und für Herkunftskennzeichnung", idx: [3] },
      { text: "Kritik an schwammigen, schlecht kontrollierbaren KMU-Anforderungen an Auftragnehmer", idx: [6] },
    ],
    kurz: [
      { text: "Gegen Koppelung von Aufträgen/Förderung an Tarif-, ideologische, ESG- oder Standard-Kriterien (auch bei Handelsabkommen, Marktzugang)", idx: [0,1,2,4,5,6] },
      { text: "Für verbindliche Standards gegen unlautere Handelspraktiken und Herkunftskennzeichnung", idx: [3] },
    ] },
  { aspekt: "Förderung an Bedingungen knüpfen", partei: "CDU/CSU",
    lang: [
      { text: "Skepsis gegenüber staatlicher Konditionierung/Bevormundung (Klima-/Transformationsfonds, zu enge ESG-Regeln, Mittelstandsförderung der Grünen)", idx: [2,4,5] },
      { text: "Öffentlich-private Partnerschaften nur mit klaren Vorteilen für Staat und Gesellschaft (Wirtschaftlichkeit inkl. gesellschaftlicher Kosten)", idx: [0] },
      { text: "Verschonungsregeln für Familienunternehmen an Bedingungen knüpfen (Verwaltungsvermögen, Betriebsfortführung, Lohnhöhe)", idx: [1] },
      { text: "Filmförderung an Mittelverwendung in Deutschland; freiwillige Selbstverpflichtung der Streaminganbieter", idx: [3] },
      { text: "Entwicklungspolitik: geopolitische, wirtschafts- und migrationspolitische Konditionalitäten strategisch verankern", idx: [6] },
    ],
    kurz: [
      { text: "Skepsis gegenüber staatlicher Konditionierung/Bevormundung (Transformationsfonds, zu enge ESG-Regeln); ÖPP nur mit klaren Vorteilen für Staat/Gesellschaft", idx: [0,2,4,5] },
      { text: "Bedingte Verschonung für Familienunternehmen (Fortführung, Lohn); Filmförderung an Mittelverwendung in Deutschland", idx: [1,3] },
      { text: "Entwicklungspolitik: geopolitische/migrationspolitische Konditionalitäten strategisch verankern", idx: [6] },
    ] },
  { aspekt: "Förderung an Bedingungen knüpfen", partei: "GRÜNE",
    lang: [
      { text: "Handelsabkommen und Förderung an soziale, ökologische und menschenrechtliche Standards binden; Sorgfaltspflichten bei Rohstoffbeschaffung", idx: [1,5] },
      { text: "Förderung an europäische Produktion knüpfen (statt chinesische Autos zu subventionieren); CRMA-Quoten für Rohstoffunabhängigkeit", idx: [3,7] },
      { text: "Staatliche Nachfrage und Aufträge als Anreiz für Zukunftsprodukte und Start-ups (Ankerkunde)", idx: [2,4] },
      { text: "Verursacherprinzip: umweltschädliches Design sanktionieren, Reparaturbonus-Fonds der Hersteller, differenzierte Luftverkehrsteuer", idx: [0,8,9] },
      { text: "Übergewinnsteuer zur Abschöpfung bei Energiekrisen", idx: [6] },
    ],
    kurz: [
      { text: "Handelsabkommen und Förderung an soziale/ökologische/menschenrechtliche Standards und europäische Produktion binden (Sorgfaltspflichten, CRMA-Quoten)", idx: [1,3,5,7] },
      { text: "Staatliche Nachfrage als Anreiz für Zukunftsprodukte/Start-ups; Verursacherprinzip (Sanktion umweltschädlichen Designs, Reparaturbonus, differenzierte Luftverkehrsteuer)", idx: [0,2,4,8,9] },
      { text: "Übergewinnsteuer bei Energiekrisen", idx: [6] },
    ] },
  { aspekt: "Förderung an Bedingungen knüpfen", partei: "LINKE",
    lang: [
      { text: "Öffentliche Aufträge und Fördergelder nur an tarifgebundene Betriebe mit Ausbildung, Mitbestimmung und Umweltstandards — keine Dumpinglöhne", idx: [4,8] },
      { text: "Subventionen an Bedingungen: Arbeitsplatzsicherung, klimagerechte Investitionen, Standorterhalt, Klimagerechtigkeit", idx: [0,2,7,11] },
      { text: "Kritik an Subventionen ohne Auflagen (McDonald's; Gastro-MwSt ohne Weitergabe) — gezielte, gerechte Verteilung", idx: [1,3] },
      { text: "Investitionsverpflichtung für Streamingdienste zugunsten lokaler Filmproduktion", idx: [6] },
      { text: "Reederei-Vorteile an deutsche Flagge und Ausbildung binden", idx: [9] },
      { text: "Reparaturbonus über Hersteller-Fonds nach Reparaturfreundlichkeit", idx: [10] },
      { text: "Übergewinne der Rüstungsindustrie abschöpfen oder verstaatlichen", idx: [5] },
    ],
    kurz: [
      { text: "Öffentliche Aufträge/Subventionen nur an tarifgebundene Betriebe mit Ausbildung, Mitbestimmung, Umwelt- und Klimastandards, Arbeitsplatz-/Standortgarantien — keine Dumpinglöhne", idx: [0,2,4,7,8,11] },
      { text: "Kritik an bedingungslosen Subventionen (McDonald's, Gastro-MwSt); Auflagen für Streaming (Filmproduktion) und Reedereien (Flagge/Ausbildung); Reparaturbonus über Hersteller-Fonds", idx: [1,3,6,9,10] },
      { text: "Übergewinne der Rüstungsindustrie abschöpfen oder verstaatlichen", idx: [5] },
    ] },
  { aspekt: "Förderung an Bedingungen knüpfen", partei: "SPD",
    lang: [
      { text: "Öffentliche Aufträge/Beschaffung an Tariftreue, faire Löhne, Klimakriterien und Wertschöpfung binden", idx: [0,5,6] },
      { text: "Staatliche Investitionen an Vergabe an deutsche/europäische Unternehmen knüpfen", idx: [1] },
      { text: "Förderkulissen sozial staffeln, Mitnahmeeffekte für Wohlhabende ausschließen, Mittelstand einschließen", idx: [2] },
      { text: "Investitionspflichten für Streamingdienste (Produktion in Deutschland)", idx: [3] },
      { text: "Sanktionen bei schweren Menschenrechtsverstößen in Lieferketten", idx: [4] },
      { text: "Verpackungs-Lizenzgebühren ökologisch modulieren (recycelbar günstiger)", idx: [7] },
    ],
    kurz: [
      { text: "Öffentliche Aufträge/Beschaffung an Tariftreue, Löhne, Klima und Wertschöpfung binden; Vergabe an deutsche/europäische Unternehmen", idx: [0,1,5,6] },
      { text: "Förderkulissen sozial staffeln (gegen Mitnahmeeffekte); Investitionspflichten für Streaming; Sanktion bei Menschenrechtsverstößen in Lieferketten", idx: [2,3,4] },
      { text: "Verpackungs-Lizenzgebühren ökologisch modulieren", idx: [7] },
    ] },

  // ===== STAATLICHE INVESTITIONSFONDS =====
  { aspekt: "Staatliche Investitionsfonds", partei: "AfD",
    lang: [
      { text: "Ablehnung schuldenfinanzierter Staatsinvestitionen und Sondervermögen als verschleierte Neuverschuldung — echte private Investitionen statt Staatsprogramme", idx: [1,4,6,7] },
      { text: "Kritik an Staatsfonds als Umleitung von Steuergeldern/Stromkosten für Rendite ohne echte Effizienz", idx: [8] },
      { text: "Kritik an Spezialfonds (erneuerbare/Infrastruktur) als falsch gewichtet; Sondervermögen maritim unzureichend genutzt", idx: [5,9] },
      { text: "Befürwortung eines Staatsfonds nach Singapur-Modell zur Ertragserwirtschaftung", idx: [3] },
      { text: "Dezentrale Rohstofflager und staatliche Rohstoffsicherung in Kooperation mit der Wirtschaft", idx: [2] },
      { text: "Kritik an komplexer steuerlicher Neubewertung von Fonds als Investitionshemmnis", idx: [0] },
    ],
    kurz: [
      { text: "Ablehnung schuldenfinanzierter Staatsinvestitionen/Sondervermögen als verschleierte Neuverschuldung — private statt staatliche Investitionen; Kritik an Staatsfonds als ineffiziente Steuergeld-Umleitung", idx: [0,1,4,5,6,7,8,9] },
      { text: "Ausnahme pro: Staatsfonds nach Singapur-Modell zur Ertragserwirtschaftung", idx: [3] },
      { text: "Dezentrale Rohstofflager und staatliche Rohstoffsicherung mit der Wirtschaft", idx: [2] },
    ] },
  { aspekt: "Staatliche Investitionsfonds", partei: "CDU/CSU",
    lang: [
      { text: "500-Mrd-Infrastruktur-Sondervermögen und Investitionssofortprogramm als Wachstumsimpuls (auch direkt für Kommunen und Länder)", idx: [0,1,2,6,7,10] },
      { text: "Private Mittel hebeln über Fonds (Deutschlandfonds, Mittelstandsfonds mit zehnfacher Hebelwirkung, strukturierte Investmentfonds, Risikobegrenzung)", idx: [4,8,12] },
      { text: "Rohstofffonds (1 Mrd. €, KfW) stärken und aufstocken", idx: [5,11] },
      { text: "Start-up-Förderung über Kapitalsammelstellen und Fonds", idx: [3] },
      { text: "Investitionen gestiegen (115 Mrd. € 2025; ausländische Investitionskredite verdoppelt)", idx: [9] },
      { text: "Staatliche Unterstützung für KI-Infrastruktur (Bund/EU)", idx: [13] },
      { text: "400-Mio-Programm für Häfen/Schifffahrt; Rekordinvestitionen in Schiene und Autobahn", idx: [14] },
    ],
    kurz: [
      { text: "500-Mrd-Infrastruktur-Sondervermögen und Sofortprogramm als Wachstumsimpuls (Kommunen, Länder, Häfen, Schiene); Investitionen 2025 gestiegen", idx: [0,1,2,6,7,9,10,14] },
      { text: "Private Mittel hebeln über Fonds (Deutschlandfonds, Mittelstandsfonds, Rohstofffonds, Start-up-Kapital)", idx: [3,4,5,8,11,12] },
      { text: "Staatliche Unterstützung für KI-Infrastruktur (Bund/EU)", idx: [13] },
    ] },
  { aspekt: "Staatliche Investitionsfonds", partei: "GRÜNE",
    lang: [
      { text: "500-Mrd-Sondervermögen gezielt für Transformation und Infrastruktur nutzen (nicht in den regulären Haushalt)", idx: [0] },
      { text: "Deutschlandfonds als erster Schritt, aber Mittel zu niedrig für First-of-a-kind-Technologien", idx: [2] },
      { text: "Rohstofffonds aufstocken und stärkere staatliche Risikoübernahme", idx: [1,4] },
      { text: "Staatlicher Investitionsfonds nach schwedischem Modell für Wachstumsunternehmen; Bürgerfonds für Start-ups einführen", idx: [3,6] },
      { text: "Öffentlich verwalteter Standardfonds für die private Altersvorsorge (Opt-out)", idx: [5] },
    ],
    kurz: [
      { text: "Sondervermögen und Deutschlandfonds gezielt für Transformation/Infrastruktur — aber Mittel zu niedrig (First-of-a-kind)", idx: [0,2] },
      { text: "Rohstofffonds aufstocken; staatlicher Investitionsfonds nach schwedischem Modell; Bürgerfonds für Start-ups", idx: [1,3,4,6] },
      { text: "Öffentlich verwalteter Standardfonds für die Altersvorsorge (Opt-out)", idx: [5] },
    ] },
  { aspekt: "Staatliche Investitionsfonds", partei: "LINKE",
    lang: [
      { text: "Echtes Konjunkturprogramm und staatlicher Transformationsfonds statt Steuersenkungen; öffentliche Investitionen statt Setzen auf private Mobilisierung; öffentliche Förderbanken ausbauen", idx: [0,2,3,4] },
      { text: "Kritik an unzureichender Ausgestaltung des 100-Mrd-Investitionstopfes (zu wenig für Länder/Kommunen, zu lange Laufzeit)", idx: [1] },
    ],
    kurz: [
      { text: "Echtes Konjunkturprogramm und staatlicher Transformationsfonds statt Steuersenkungen; öffentliche Investitionen und Förderbanken statt privater Mobilisierung", idx: [0,2,3,4] },
      { text: "Kritik an unzureichender Ausgestaltung des 100-Mrd-Investitionstopfes", idx: [1] },
    ] },
  { aspekt: "Staatliche Investitionsfonds", partei: "SPD",
    lang: [
      { text: "500-/100-Mrd-Sondervermögen für Infrastruktur (Kommunen, Länder, Bau, Mittelstand) als Wachstumstreiber", idx: [0,1,2,3,10] },
      { text: "Privates Kapital über Deutschlandfonds/Dachfonds hebeln (skandinavisches Vorbild)", idx: [4,7,8,9,12] },
      { text: "Rohstofffonds aufstocken und flexibilisieren (auch kleinere Projekte)", idx: [6,11] },
      { text: "EU-Mittel an Betriebe in der Umstellung; Reform der Förderung für strukturschwache Regionen", idx: [5] },
      { text: "Öffentliche Investitionen in grüne Stahl-, Batterie- und Mobilitätsinfrastruktur", idx: [13] },
    ],
    kurz: [
      { text: "500-/100-Mrd-Sondervermögen für Infrastruktur (Kommunen, Länder, Bau, Mittelstand) als Wachstumstreiber; öffentliche Investitionen in grüne Stahl-/Batterie-/Mobilitätsinfrastruktur", idx: [0,1,2,3,10,13] },
      { text: "Privates Kapital über Deutschlandfonds/Dachfonds hebeln; Rohstofffonds aufstocken/flexibilisieren", idx: [4,6,7,8,9,11,12] },
      { text: "EU-Mittel an Betriebe in der Umstellung; Reform der Förderung für strukturschwache Regionen", idx: [5] },
    ] },

  // ===== START-UP-FÖRDERUNG =====
  { aspekt: "Start-up-Förderung", partei: "AfD",
    lang: [
      { text: "EU-Regulierung behindert Start-ups — stattdessen nationale Anreize durch niedrigere Steuern und weniger Regulierung", idx: [2,4] },
      { text: "Deutsche Haftungsregeln bei Börsengängen unzureichend angepasst (EU Listing Act)", idx: [0] },
      { text: "Skepsis, dass Start-ups in Deutschland gehalten werden — Tests im Ausland, gescheiterte Investitionen (Northvolt)", idx: [1,3] },
    ],
    kurz: [
      { text: "EU-Regulierung behindert Start-ups — nationale Anreize (niedrigere Steuern, weniger Regulierung); Haftungsregeln bei Börsengängen unzureichend", idx: [0,2,4] },
      { text: "Skepsis, dass Start-ups gehalten werden — Tests im Ausland, gescheiterte Investitionen (Northvolt)", idx: [1,3] },
    ] },
  { aspekt: "Start-up-Förderung", partei: "CDU/CSU",
    lang: [
      { text: "Kapitalzugang und Wagniskapital für Start-ups und Scale-ups verbessern (Venture Capital, Investmentfonds, Roll-over-Freibetrag, niedrigere Mindestkapitalanforderungen, erleichterte Börsengänge)", idx: [1,2,3,8,10] },
      { text: "Standortfördergesetz: bessere Rahmenbedingungen, Steuerentlastungen, Vergabemodernisierung, niedrige Kosten und transparente Verfahren", idx: [9,14,15] },
      { text: "Steuervergünstigungen (Verrechnung von Anlaufverlusten)", idx: [0] },
      { text: "Gründer unterstützen und private Investitionen hebeln; Ausgründungen aus Hochschulen", idx: [5,6] },
      { text: "Wachstumsfinanzierung sichern, um Übernahmen durch ausländische Konzerne zu vermeiden", idx: [4] },
      { text: "Attraktive Finanzierungsbedingungen in DE/EU; Kritik an zu restriktiven Förderregeln", idx: [13] },
      { text: "Rekordzahl an Unternehmensgründungen; Vergleich mit Israel", idx: [11,12] },
      { text: "Kernfusion-Start-ups (Bayern); Klimaschutz als Gründungschance", idx: [7,16] },
    ],
    kurz: [
      { text: "Kapitalzugang und Wagniskapital für Start-ups/Scale-ups verbessern (Venture Capital, Fonds, erleichterte Börsengänge, Roll-over-Freibetrag); Standortfördergesetz mit Steuerentlastungen und schlanken Verfahren", idx: [0,1,2,3,8,9,10,14,15] },
      { text: "Gründer/Ausgründungen unterstützen und private Investitionen hebeln; Wachstumsfinanzierung gegen ausländische Übernahmen; Kritik an zu restriktiven Förderregeln", idx: [4,5,6,13] },
      { text: "Rekord-Gründungen (Vergleich Israel); Kernfusion-Start-ups, Klimaschutz als Gründungschance", idx: [7,11,12,16] },
    ] },
  { aspekt: "Start-up-Förderung", partei: "GRÜNE",
    lang: [
      { text: "Finanzierung und Kapitalmarkt/Venture Capital stärken (zu niedrig im Vergleich zu China/Israel); bessere Börsengang-Bedingungen", idx: [2,3,6] },
      { text: "Bessere Förderinstrumente: Tax Credits/Investitionsprämie statt degressiver AfA (Start-ups ohne Gewinn)", idx: [0] },
      { text: "Fokussierte statt verzettelte Förderung; Hightech-Agenda/Innovationsprogramme mit enger Verzahnung zum Ministerium", idx: [4,5] },
      { text: "Bürokratieabbau, Fast-Track für IT-Ausgründungen, Reallabore; Zuständigkeiten klären", idx: [1,8,11] },
      { text: "Datenzugang zur Befähigung von Start-up-Innovation", idx: [7] },
      { text: "Bürgerfonds zur Kapitalsammlung (Start-ups verlassen Land wegen US-Finanzierung)", idx: [10] },
      { text: "Flexible Tarifbindungs-Ausnahmen für Start-ups in der Gründungsphase (Zugang zu Staatsaufträgen)", idx: [9] },
    ],
    kurz: [
      { text: "Finanzierung/Venture Capital stärken (zu niedrig vs. China/Israel), bessere Börsengänge; Tax Credits statt degressiver AfA; Bürgerfonds zur Kapitalsammlung", idx: [0,2,3,6,10] },
      { text: "Fokussierte Förderung (Hightech-Agenda), Bürokratieabbau, Fast-Track/Reallabore, Datenzugang", idx: [1,4,5,7,8,11] },
      { text: "Flexible Tarifbindungs-Ausnahmen für junge Start-ups (Zugang zu Staatsaufträgen)", idx: [9] },
    ] },
  { aspekt: "Start-up-Förderung", partei: "LINKE",
    lang: [ { text: "Kritik an marktbasierter Förderung (Wagniskapital/private Finanzierung); stärkere öffentliche Hand und gezielte öffentliche Investitionen in nachhaltige und soziale Start-ups", idx: [0] } ],
    kurz: [ { text: "Kritik an marktbasierter Förderung; stärkere öffentliche Hand und gezielte öffentliche Investitionen in nachhaltige/soziale Start-ups", idx: [0] } ] },
  { aspekt: "Start-up-Förderung", partei: "SPD",
    lang: [
      { text: "Rahmenbedingungen und Finanzierung für Start-ups/Scale-ups verbessern (Standortfördergesetz, Kapitalmarktreform, VC-Fonds, Abbau steuerlicher Barrieren für Investoren)", idx: [0,4,5,12,13] },
      { text: "Privates Kapital hebeln; Private Equity in Scale-ups statt in sichere Steuerkanzleien lenken", idx: [1,16] },
      { text: "Staat als Ankerkunde für Start-ups", idx: [2] },
      { text: "Gründungen beschleunigen (24-Stunden-Ziel, Vorbild Estland); Gründerschutzzonen, EXIST-Stipendien, Netzwerke, Unterstützung in der Gründungsphase", idx: [7,8,11] },
      { text: "Start-up-Boom 2025 (über 3.500 Neugründungen) als Erfolg; Start-ups und industrieller Mittelstand gemeinsam", idx: [9,10] },
      { text: "Gründungen durch Selbstständige und Frauen fördern; Start-ups im Bereich Erneuerbare als Vorteil", idx: [3,6] },
      { text: "Reduzierte Gebühren beim Datenzugang; unbürokratische Berücksichtigung innovativer Unternehmen bei der Vergabe", idx: [14,15] },
    ],
    kurz: [
      { text: "Rahmenbedingungen und Finanzierung verbessern (Standortfördergesetz, Kapitalmarktreform, VC-Fonds); privates Kapital und Private Equity in Scale-ups hebeln; Staat als Ankerkunde", idx: [0,1,2,4,5,12,13,16] },
      { text: "Gründungen beschleunigen (24h-Ziel, Estland); Gründerschutzzonen, EXIST, Netzwerke; Boom 2025; Start-ups + Mittelstand gemeinsam", idx: [7,8,9,10,11] },
      { text: "Gründungen durch Selbstständige/Frauen, Erneuerbare-Start-ups; Datenzugang günstiger, unbürokratische Vergabe", idx: [3,6,14,15] },
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
let ok = 0, warn = 0;
for (const c of CELLS) {
  const row = db.prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`).get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const before = console.log;
  const lang = resolve(rede, c.lang, `${c.aspekt}/${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.aspekt}/${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, c.aspekt, c.partei);
  ok++;
}
console.log(`${ok}/${CELLS.length} Zellen aktualisiert.`);
db.close();
