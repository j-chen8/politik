/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Staat und Verwaltung" (47 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Verwaltungsdigitalisierung =====
  { aspekt: "Verwaltungsdigitalisierung", partei: "AfD",
    lang: [
      { text: "Digitalisierung (NOOTS, Registermodernisierung) befürworten, aber mit striktem Datenschutz, Kontrolle und Papieralternative", idx: r(2,7,11,12,15,18,19) },
      { text: "Kritik an planlosem Ansatz und verfehlten Zielen; Maßnahmen nicht radikal genug", idx: r(0,1,4,13,16) },
      { text: "Grundrecht auf analoges Leben und Zugangsbarrieren für Ältere/ländliche Gebiete; Kritik an EU-Datengesetzen und ELSTER-Medienbrüchen", idx: r(9,10,17,8,3,5,6,14) },
    ],
    kurz: [
      { text: "Digitalisierung (NOOTS) befürworten, aber mit Datenschutz und Papieralternative", idx: r(2,7,11,12,15,18,19) },
      { text: "Kritik an planlosem Ansatz; Grundrecht auf analoges Leben und Zugangsbarrieren beachten", idx: r(0,1,4,13,16,9,10,17,8,3,5,6,14) },
    ] },
  { aspekt: "Verwaltungsdigitalisierung", partei: "CDU/CSU",
    lang: [
      { text: "Digitalisierung als Kernziel der Staatsmodernisierung (digitaler Staat, Deutschland-Stack, NOOTS-Staatsvertrag)", idx: r(0,1,2,5,6,15,19,20,21,29,31,32) },
      { text: "Konkrete Verfahren digitalisieren (Führerschein, Zensus, Führungszeugnis, Notariat, Kindergeld, Petition, Immobilien)", idx: r(3,4,8,9,10,12,13,14,22,23,25,26,30) },
      { text: "Effizienz und Medienbruchabbau durch Once-Only und Prozessoptimierung statt bloßer Digitalisierung bestehender Abläufe", idx: r(7,11,16,17,18,24,27,28) },
    ],
    kurz: [
      { text: "Digitalisierung als Kernziel der Staatsmodernisierung (Deutschland-Stack, NOOTS)", idx: r(0,1,2,5,6,15,19,20,21,29,31,32) },
      { text: "Konkrete Verfahren digitalisieren; Effizienz durch Once-Only und Prozessoptimierung", idx: r(3,4,8,9,10,12,13,14,22,23,25,26,30,7,11,16,17,18,24,27,28) },
    ] },
  { aspekt: "Verwaltungsdigitalisierung", partei: "GRÜNE",
    lang: [
      { text: "Umfassende, koordinierte Digitalisierung mit einheitlichen Standards, Deutschland-App und konsequentem Once-Only-Prinzip", idx: r(0,3,5,9,10,14,7,13) },
      { text: "Kritik an unzureichender Umsetzung und Nutzerbarrieren (BundID, E-Akte-Zersplitterung); Ausstattung der Behörden", idx: r(1,2,12,11,6,8,4) },
    ],
    kurz: [
      { text: "Umfassende, koordinierte Digitalisierung mit einheitlichen Standards und Once-Only-Prinzip", idx: r(0,3,5,9,10,14,7,13) },
      { text: "Kritik an unzureichender Umsetzung und Nutzerbarrieren (BundID, E-Akte)", idx: r(1,2,12,11,6,8,4) },
    ] },
  { aspekt: "Verwaltungsdigitalisierung", partei: "LINKE",
    lang: [
      { text: "Digitalisierung ja, aber mit Datenschutz und demokratischer Kontrolle (NOOTS, Register, Notarverfahren); Kontrollstelle für den Bundestag", idx: r(0,1,6,2) },
      { text: "Durchgängige, barrierefreie Abwicklung; Skepsis gegenüber digitalem Wandel ohne echte Modernisierung", idx: r(5,3,4) },
    ],
    kurz: [
      { text: "Digitalisierung mit Datenschutz und demokratischer Kontrolle", idx: r(0,1,6,2) },
      { text: "Durchgängige, barrierefreie Abwicklung statt Scheinmodernisierung", idx: r(5,3,4) },
    ] },
  { aspekt: "Verwaltungsdigitalisierung", partei: "SPD",
    lang: [
      { text: "Verwaltungsdigitalisierung als zentrales Koalitionsziel (Once-Only/NOOTS); echte Prozessverbesserung statt bloßer Digitalisierung analoger Abläufe", idx: r(0,1,3,5,6,14,18,19) },
      { text: "Konkrete Verfahren digitalisieren (Vergabe, Kindergeld, Notariat, Justiz, Immobilien, Beihilfe)", idx: r(2,4,7,9,12,13,15,16,17) },
      { text: "Souveräne Open-Source-IT (ZenDiS); Digitalisierung zur Planungsbeschleunigung", idx: r(11,8,10) },
    ],
    kurz: [
      { text: "Verwaltungsdigitalisierung als zentrales Koalitionsziel (Once-Only/NOOTS), echte Prozessverbesserung", idx: r(0,1,3,5,6,14,18,19) },
      { text: "Konkrete Verfahren digitalisieren; souveräne Open-Source-IT (ZenDiS)", idx: r(2,4,7,9,12,13,15,16,17,11,8,10) },
    ] },

  // ===== Schuldenbremse =====
  { aspekt: "Schuldenbremse", partei: "AfD",
    lang: [{ text: "Schuldenbremse einhalten und wiedereinführen; gegen Neuverschuldung und gegen Lockerung der Schuldenregeln für Länder; Warnung vor Zinslasten", idx: r(0,1,2,3,4,5,6,7,9,10,8) }],
    kurz: [{ text: "Schuldenbremse einhalten und wiedereinführen; gegen Neuverschuldung und Lockerung für Länder", idx: r(0,1,2,3,4,5,6,7,9,10,8) }] },
  { aspekt: "Schuldenbremse", partei: "CDU/CSU",
    lang: [{ text: "Strukturelle Verschuldung für Länder in gleicher Größenordnung wie der Bund ermöglichen, aber Zinslasten und Generationengerechtigkeit beachten", idx: r(0,2,1) }],
    kurz: [{ text: "Strukturelle Verschuldung für Länder ermöglichen, aber Generationengerechtigkeit beachten", idx: r(0,2,1) }] },
  { aspekt: "Schuldenbremse", partei: "GRÜNE",
    lang: [{ text: "Kritik an der Umgehung der Schuldenbremse durch buchhalterische Tricks und Sondervermögen; anhaltende Haushaltsdefizite", idx: r(2,3,0,1) }],
    kurz: [{ text: "Kritik an der Umgehung der Schuldenbremse durch Tricks und Sondervermögen", idx: r(2,3,0,1) }] },
  { aspekt: "Schuldenbremse", partei: "LINKE",
    lang: [{ text: "Kritik an der Schuldenbremse als Ursache für Unterfinanzierung und mangelnde Investitionsfähigkeit des Staates", idx: r(0,1) }],
    kurz: [{ text: "Schuldenbremse als Ursache für Unterfinanzierung kritisieren", idx: r(0,1) }] },
  { aspekt: "Schuldenbremse", partei: "SPD",
    lang: [{ text: "Reform der Schuldenbremse für ein hohes Investitionsniveau und Verteidigung, aber bei soliden Finanzen und Zusätzlichkeitsregelung", idx: r(0,1,2) }],
    kurz: [{ text: "Reform der Schuldenbremse für Investitionen, aber bei soliden Finanzen", idx: r(0,1,2) }] },

  // ===== Kommunen / Altschulden =====
  { aspekt: "Kommunen / Altschulden", partei: "AfD",
    lang: [
      { text: "Kommunen sind unterfinanziert; Konnexitätsprinzip einhalten — der Bund soll übertragene Aufgaben finanzieren statt Schulden", idx: r(0,3,6,7,8,9,11) },
      { text: "Gegen Erleichterung der Schuldenaufnahme und EU-gebundene Fördermittel; Kritik am LuKIFG; Enquete-Kommission", idx: r(5,4,10,1,2) },
    ],
    kurz: [
      { text: "Kommunen unterfinanziert; Konnexitätsprinzip einhalten statt Schulden", idx: r(0,3,6,7,8,9,11) },
      { text: "Gegen Erleichterung der Schuldenaufnahme und EU-gebundene Fördermittel", idx: r(5,4,10,1,2) },
    ] },
  { aspekt: "Kommunen / Altschulden", partei: "CDU/CSU",
    lang: [
      { text: "Kommunen finanziell stärken (100 Mrd. € Infrastruktur, Zukunftspakt) und Veranlassungskonnexität umsetzen", idx: r(0,1,2,4,5,6,9,10,11,12,13) },
      { text: "Prekäre Finanzlage anerkennen, konkretes Handeln statt weiterer Analysen; Digitalisierung entlastet", idx: r(3,8,14,7) },
    ],
    kurz: [
      { text: "Kommunen finanziell stärken (100 Mrd. €, Zukunftspakt) und Veranlassungskonnexität umsetzen", idx: r(0,1,2,4,5,6,9,10,11,12,13) },
      { text: "Prekäre Finanzlage anerkennen, konkretes Handeln statt Analysen", idx: r(3,8,14,7) },
    ] },
  { aspekt: "Kommunen / Altschulden", partei: "GRÜNE",
    lang: [
      { text: "Versprochene Altschuldenlösung umsetzen (250 Mio. € unzureichend bei 25 Mrd. € Defizit); sofortige Unterstützung statt weiterer Arbeitsgruppen", idx: r(0,6,7,2,3,4) },
      { text: "Sondervermögen nur für zusätzliche Investitionen; Gewerbesteuerreform; Mindestanteil für Kommunen; Schrottimmobilien", idx: r(1,5,8,9) },
    ],
    kurz: [
      { text: "Versprochene Altschuldenlösung umsetzen; sofortige Unterstützung statt Arbeitsgruppen", idx: r(0,6,7,2,3,4) },
      { text: "Sondervermögen nur für zusätzliche Investitionen; Mindestanteil für Kommunen", idx: r(1,5,8,9) },
    ] },
  { aspekt: "Kommunen / Altschulden", partei: "LINKE",
    lang: [
      { text: "Bundesweites Entschuldungspaket/Altschuldenregelung; Konnexitätsprinzip und Stärkung der kommunalen Selbstverwaltung", idx: r(0,7,1,4) },
      { text: "Kritik an unzureichender Finanzierung und ungerechter Steuerverteilung; strukturelle Reformen; Leerstand", idx: r(2,5,6,3) },
    ],
    kurz: [
      { text: "Bundesweites Entschuldungspaket; Konnexitätsprinzip und kommunale Selbstverwaltung stärken", idx: r(0,7,1,4) },
      { text: "Kritik an unzureichender Finanzierung; strukturelle Reformen", idx: r(2,5,6,3) },
    ] },
  { aspekt: "Kommunen / Altschulden", partei: "SPD",
    lang: [
      { text: "100 Mrd. € für Kommunen zur Behebung von Infrastrukturdefiziten (Schulen, Straßen, Einrichtungen)", idx: r(0,1,5,6,2) },
      { text: "Länder sollen Mittel angemessen an Kommunen weitergeben; Altschuldenhilfe", idx: r(3,4) },
    ],
    kurz: [
      { text: "100 Mrd. € für Kommunen zur Behebung von Infrastrukturdefiziten", idx: r(0,1,5,6,2) },
      { text: "Länder sollen Mittel an Kommunen weitergeben; Altschuldenhilfe", idx: r(3,4) },
    ] },

  // ===== Investitionsfonds =====
  { aspekt: "Investitionsfonds", partei: "AfD",
    lang: [{ text: "Kritik am Sondervermögen als versteckte Neuverschuldung und Trickserei ohne echte Investitionen; Staatsfonds nach Singapur-Modell", idx: r(0,2,3,1) }],
    kurz: [{ text: "Sondervermögen als versteckte Neuverschuldung ohne echte Investitionen", idx: r(0,2,3,1) }] },
  { aspekt: "Investitionsfonds", partei: "CDU/CSU",
    lang: [{ text: "Sondervermögen Infrastruktur (bis 500 Mrd. €, 100 Mrd. € für Länder/Kommunen) gegen den Investitionsstau, mit pragmatischer Umsetzung vor Ort", idx: r(0,1,2,3,4,5,6,7,8,9) }],
    kurz: [{ text: "Sondervermögen Infrastruktur gegen den Investitionsstau, pragmatische Umsetzung vor Ort", idx: r(0,1,2,3,4,5,6,7,8,9) }] },
  { aspekt: "Investitionsfonds", partei: "GRÜNE",
    lang: [{ text: "Sondervermögen ja, aber mit Zusätzlichkeit und Zweckbindung (gestrichene Zusätzlichkeit kritisiert); gegen Mittelverschiebung statt neuer Investitionen", idx: r(0,1,3,4,2) }],
    kurz: [{ text: "Sondervermögen mit Zusätzlichkeit und Zweckbindung; gegen Mittelverschiebung", idx: r(0,1,3,4,2) }] },
  { aspekt: "Investitionsfonds", partei: "LINKE",
    lang: [{ text: "Sondervermögen unzureichend; Kommunen erhalten zu wenig, Laufzeit zu lang; höhere jährliche Investitionsraten gefordert", idx: r(0,1,2,3) }],
    kurz: [{ text: "Sondervermögen unzureichend; höhere jährliche Investitionsraten gefordert", idx: r(0,1,2,3) }] },
  { aspekt: "Investitionsfonds", partei: "SPD",
    lang: [{ text: "500-Mrd.-€-Sondervermögen als Gamechanger und 100 Mrd. € für Kommunen, mit Zusätzlichkeitsregelung", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "500-Mrd.-€-Sondervermögen und 100 Mrd. € für Kommunen, mit Zusätzlichkeit", idx: r(0,1,2,3,4,5) }] },

  // ===== Bürokratieabbau =====
  { aspekt: "Bürokratieabbau", partei: "AfD",
    lang: [
      { text: "Forderung nach echtem, umfassendem Bürokratieabbau (Gesetze streichen, Staat verschlanken) statt symbolischer Maßnahmen", idx: r(0,2,5,7,8,9,10,12,13,15,16,21,22,25,26,27,28,31,33,34,35,36,37) },
      { text: "Konkrete Entlastungen (Assistenzhunde, Notare, Gastronomie, Förderbürokratie, Batterierecycling, Agrarstatistik, Polizei); Digitalisierung als Mittel", idx: r(4,14,19,20,24,32,18,17) },
      { text: "Gegen EU-Bürokratie und Klimapolitik-Bürokratie; Bürokratieabbau statt Schulden; gegen automatisiertes Kindergeld; Verschwendung bei Regierungsbauten", idx: r(11,3,30,29,1,23,6) },
    ],
    kurz: [
      { text: "Forderung nach echtem, umfassendem Bürokratieabbau statt symbolischer Maßnahmen", idx: r(0,2,5,7,8,9,10,12,13,15,16,21,22,25,26,27,28,31,33,34,35,36,37) },
      { text: "Konkrete Entlastungen; gegen EU- und Klimapolitik-Bürokratie", idx: r(4,14,19,20,24,32,18,17,11,3,30,29,1,23,6) },
    ] },
  { aspekt: "Bürokratieabbau", partei: "CDU/CSU",
    lang: [
      { text: "Bürokratieabbau als Standortfaktor und Modernisierungsagenda (25-%-Ziel, 16 Mrd. €, über 300 Maßnahmen)", idx: r(0,1,5,6,18,23,27,29,30,37,46) },
      { text: "Abbau durch Digitalisierung, Once-Only-Prinzip und Vermeidung redundanter Datenerhebung", idx: r(7,8,11,12,13,16,17,24,28,31,34,35,40,45) },
      { text: "Vergabe- und Planungsverfahren vereinfachen; konkrete Bereiche (Agrarstatistik, Kindergeld, Wasserstoff, EU-Förderung); pragmatisch ohne Schutzstandardabbau", idx: r(9,41,47,2,3,10,19,21,26,33,14,22,39,44,32,36,4,15,20,25,38,42,43) },
    ],
    kurz: [
      { text: "Bürokratieabbau als Standortfaktor und Modernisierungsagenda (25-%-Ziel, 300 Maßnahmen); durch Digitalisierung und Once-Only", idx: r(0,1,5,6,18,23,27,29,30,37,46,7,8,11,12,13,16,17,24,28,31,34,35,40,45) },
      { text: "Vergabe- und Planungsverfahren vereinfachen; pragmatisch ohne Schutzstandardabbau", idx: r(9,41,47,2,3,10,19,21,26,33,14,22,39,44,32,36,4,15,20,25,38,42,43) },
    ] },
  { aspekt: "Bürokratieabbau", partei: "GRÜNE",
    lang: [
      { text: "Bürokratieabbau ja, aber ohne Abbau von Schutzstandards und rechtsstaatlichen Garantien; struktureller Umbau (Sunset-Klauseln, Verwaltung als Möglichmacher)", idx: r(2,8,10,11,0,1) },
      { text: "Once-Only und Vermeidung redundanter Daten; Kommunen brauchen zuerst Finanzkraft; Kritik an mangelhafter Umsetzung", idx: r(5,6,7,13,14,9,3,4,12) },
    ],
    kurz: [
      { text: "Bürokratieabbau ohne Abbau von Schutzstandards; struktureller Umbau (Sunset-Klauseln)", idx: r(2,8,10,11,0,1) },
      { text: "Once-Only-Prinzip; Kommunen brauchen zuerst Finanzkraft", idx: r(5,6,7,13,14,9,3,4,12) },
    ] },
  { aspekt: "Bürokratieabbau", partei: "LINKE",
    lang: [
      { text: "Bürokratieabbau nur dort, wo er Menschen hilft — nicht zum Abbau von Schutzstandards, Sozialstaat und Arbeitsrechten oder zugunsten von Konzernen", idx: r(2,5,7,0,3) },
      { text: "Antragslose Kindergeldauszahlung sinnvoll; Vereinfachung des Informationszugangs und rechtssichere Leitfäden für Kommunen", idx: r(6,1,4) },
    ],
    kurz: [
      { text: "Bürokratieabbau nur dort, wo er Menschen hilft — nicht zum Abbau von Schutzstandards", idx: r(2,5,7,0,3) },
      { text: "Antragsloses Kindergeld sinnvoll; Informationszugang vereinfachen", idx: r(6,1,4) },
    ] },
  { aspekt: "Bürokratieabbau", partei: "SPD",
    lang: [
      { text: "Ambitionierter Bürokratieabbau (25 %, 16 Mrd. €) als Kernaufgabe (Bürokratiemelder, Estland-Vorbild)", idx: r(0,5,6,7,16,18,19,20) },
      { text: "Abbau durch Digitalisierung, Once-Only und automatisches Kindergeld", idx: r(1,3,13,14,17) },
      { text: "Vergabe- und Planungsverfahren vereinfachen, aber modernisierend statt radikal (Bürokratie hat Schutzwert)", idx: r(2,4,9,10,11,15,12,8) },
    ],
    kurz: [
      { text: "Ambitionierter Bürokratieabbau (25 %) als Kernaufgabe; durch Digitalisierung und Once-Only", idx: r(0,5,6,7,16,18,19,20,1,3,13,14,17) },
      { text: "Vergabe- und Planungsverfahren vereinfachen, aber modernisierend statt radikal", idx: r(2,4,9,10,11,15,12,8) },
    ] },

  // ===== Bargeld / digitaler Euro (keine Reden in den Daten) =====

  // ===== Unabhängigkeit der Staatsanwaltschaft =====
  { aspekt: "Unabhängigkeit der Staatsanwaltschaft", partei: "AfD",
    lang: [{ text: "Unabhängigkeit von Staatsanwaltschaft und Bundesrechnungshof gegen politische Instrumentalisierung; BRH-Unabhängigkeitsgesetz mit Karenzzeiten", idx: r(0,1) }],
    kurz: [{ text: "Unabhängigkeit von Staatsanwaltschaft und Bundesrechnungshof; Karenzzeiten", idx: r(0,1) }] },
  { aspekt: "Unabhängigkeit der Staatsanwaltschaft", partei: "CDU/CSU",
    lang: [{ text: "Die Unabhängigkeit des Bundesrechnungshofs ist bereits umfassend gesichert und weisungsfrei — keine zusätzlichen Regelungen nötig", idx: r(0,1) }],
    kurz: [{ text: "Unabhängigkeit des Bundesrechnungshofs bereits gesichert — keine Zusatzregelung nötig", idx: r(0,1) }] },
  { aspekt: "Unabhängigkeit der Staatsanwaltschaft", partei: "GRÜNE",
    lang: [{ text: "Solide Rechtsgrundlage für die Bundestagspolizei und deren Handlungsfähigkeit gegen verfassungsfeindliche Aktivitäten", idx: r(0) }],
    kurz: [{ text: "Solide Rechtsgrundlage für die Bundestagspolizei", idx: r(0) }] },
  { aspekt: "Unabhängigkeit der Staatsanwaltschaft", partei: "LINKE",
    lang: [{ text: "Der Bundesrechnungshof muss unabhängig und weisungsfrei bleiben", idx: r(0) }],
    kurz: [{ text: "Bundesrechnungshof muss unabhängig und weisungsfrei bleiben", idx: r(0) }] },
  { aspekt: "Unabhängigkeit der Staatsanwaltschaft", partei: "SPD",
    lang: [{ text: "Schaffung unabhängiger Kontrollstellen (Polizeibeauftragter) zur Überprüfung von Missständen und Vertrauensbildung", idx: r(0) }],
    kurz: [{ text: "Unabhängige Kontrollstellen (Polizeibeauftragter) zur Vertrauensbildung", idx: r(0) }] },

  // ===== Privatisierung / Daseinsvorsorge =====
  { aspekt: "Privatisierung / Daseinsvorsorge", partei: "AfD",
    lang: [{ text: "Kritik an Politik, die die Daseinsvorsorge zerstört; Finanzierungsmöglichkeiten für kommunale Daseinsvorsorge prüfen", idx: r(0,1) }],
    kurz: [{ text: "Kritik an Zerstörung der Daseinsvorsorge; Finanzierung prüfen", idx: r(0,1) }] },
  { aspekt: "Privatisierung / Daseinsvorsorge", partei: "LINKE",
    lang: [{ text: "Rekommunalisierung der Daseinsvorsorge; Privatisierung als gescheiterter Kostentreiber und Ursache für Infrastrukturverfall abgelehnt", idx: r(0,1,2) }],
    kurz: [{ text: "Rekommunalisierung statt gescheiterter Privatisierung der Daseinsvorsorge", idx: r(0,1,2) }] },
  { aspekt: "Privatisierung / Daseinsvorsorge", partei: "SPD",
    lang: [{ text: "Daseinsvorsorge als staatliche Aufgabe zur sozialen Teilhabe; Kritik an widersprüchlicher AfD-Position", idx: r(0,1) }],
    kurz: [{ text: "Daseinsvorsorge als staatliche Aufgabe zur sozialen Teilhabe", idx: r(0,1) }] },

  // ===== Öffentlicher Dienst =====
  { aspekt: "Öffentlicher Dienst", partei: "AfD",
    lang: [
      { text: "Verwaltung verschlanken, gegen Aufblähung und neue Ministerien; Kritik an Ineffizienz, Forderung nach Leistungsprinzip", idx: r(1,3,6,2,4,7) },
      { text: "Neuverbeamtungen begrenzen (Pensionsfonds PENFO); ÖRR-Einsparungen; gegen BKA-Vertrauensprüfung; Geschäftsordnung und Oppositionsrechte", idx: r(8,5,0,10,9) },
    ],
    kurz: [
      { text: "Verwaltung verschlanken, gegen Aufblähung und neue Ministerien; Leistungsprinzip", idx: r(1,3,6,2,4,7) },
      { text: "Neuverbeamtungen begrenzen (PENFO); ÖRR-Einsparungen; gegen BKA-Vertrauensprüfung", idx: r(8,5,0,10,9) },
    ] },
  { aspekt: "Öffentlicher Dienst", partei: "CDU/CSU",
    lang: [
      { text: "Leistungsfähiger, moderner öffentlicher Dienst mit klugen Umbauten statt Kahlschlag; Reformen des Berufsbeamtentums", idx: r(1,4,8,5,0) },
      { text: "Entlastung von Verwaltungsaufgaben (Polizei, Vergabe) durch digitale Prozesse; Kommunalpersonal in Länderhoheit", idx: r(2,3,6,7,9) },
    ],
    kurz: [
      { text: "Leistungsfähiger, moderner öffentlicher Dienst mit klugen Umbauten statt Kahlschlag", idx: r(1,4,8,5,0) },
      { text: "Entlastung von Verwaltungsaufgaben (Polizei, Vergabe) durch digitale Prozesse", idx: r(2,3,6,7,9) },
    ] },
  { aspekt: "Öffentlicher Dienst", partei: "GRÜNE",
    lang: [
      { text: "Dienstrecht und Führungskultur modernisieren (Leistungsorientierung statt Senioritätsprinzip), Verwaltung als Partner", idx: r(0,3,5) },
      { text: "Gegen pauschale Stellenkürzungen (Bundesrechnungshof) ohne Prozessoptimierung; bedarfsgerechte Personalausstattung", idx: r(1,2,4) },
    ],
    kurz: [
      { text: "Dienstrecht und Führungskultur modernisieren; Verwaltung als Partner", idx: r(0,3,5) },
      { text: "Gegen pauschale Stellenkürzungen ohne Prozessoptimierung", idx: r(1,2,4) },
    ] },
  { aspekt: "Öffentlicher Dienst", partei: "LINKE",
    lang: [
      { text: "Beamte in die Sozialversicherung integrieren statt Sonderstatus; gegen kapitalgedeckten Pensionsfonds", idx: r(0) },
      { text: "Gegen Kürzungen; struktureller Personalaufbau, dauerhafte Ausstattung und bessere Bezahlung", idx: r(1,2,3) },
    ],
    kurz: [
      { text: "Beamte in die Sozialversicherung integrieren; gegen kapitalgedeckten Pensionsfonds", idx: r(0) },
      { text: "Gegen Kürzungen; struktureller Personalaufbau und bessere Bezahlung", idx: r(1,2,3) },
    ] },
  { aspekt: "Öffentlicher Dienst", partei: "SPD",
    lang: [
      { text: "Entlastung der Verwaltung durch Digitalisierung und Vereinfachung angesichts des demografischen Wandels", idx: r(0,1,2) },
      { text: "Ausreichende Personalausstattung (besonders Sicherheitsbehörden), gegen Personalabbau; Modernisierung der Arbeitsbedingungen", idx: r(3,5,4,6) },
    ],
    kurz: [
      { text: "Entlastung der Verwaltung durch Digitalisierung und Vereinfachung", idx: r(0,1,2) },
      { text: "Ausreichende Personalausstattung (Sicherheitsbehörden), gegen Personalabbau", idx: r(3,5,4,6) },
    ] },

  // ===== Gewerbesteuer =====
  { aspekt: "Gewerbesteuer", partei: "AfD",
    lang: [{ text: "Gewerbesteuer abschaffen und durch eine Gemeindewirtschaftsteuer ersetzen; gegen die Erhöhung des Mindesthebesatzes", idx: r(0) }],
    kurz: [{ text: "Gewerbesteuer abschaffen, Gemeindewirtschaftsteuer; gegen höheren Mindesthebesatz", idx: r(0) }] },
  { aspekt: "Gewerbesteuer", partei: "CDU/CSU",
    lang: [{ text: "Grundsteuer als originäre kommunale Einnahmequelle erhalten, um die kommunale Finanzautonomie und Selbstverwaltung zu sichern", idx: r(0,1) }],
    kurz: [{ text: "Grundsteuer als kommunale Einnahmequelle erhalten (Finanzautonomie)", idx: r(0,1) }] },
  { aspekt: "Gewerbesteuer", partei: "GRÜNE",
    lang: [{ text: "Gewerbesteueroasen bekämpfen und erweiterte Grundstückskürzung streichen, um Kommunen finanziell zu entlasten", idx: r(0,1,2) }],
    kurz: [{ text: "Gewerbesteueroasen bekämpfen und Kommunen finanziell entlasten", idx: r(0,1,2) }] },
  { aspekt: "Gewerbesteuer", partei: "LINKE",
    lang: [{ text: "Gegen die AfD-Forderung, die Gewerbesteuer abzuschaffen, da die Kommunen finanziell bereits am Boden liegen", idx: r(0) }],
    kurz: [{ text: "Gegen die AfD-Forderung zur Abschaffung der Gewerbesteuer", idx: r(0) }] },

  // ===== Gleichwertige Lebensverhältnisse =====
  { aspekt: "Gleichwertige Lebensverhältnisse", partei: "AfD",
    lang: [{ text: "Kritik daran, dass Mittel für Klimaneutralität und Migration bereitgestellt werden, während Infrastruktur (Bildung, Verkehr) vernachlässigt wird", idx: r(0) }],
    kurz: [{ text: "Infrastruktur statt Klima/Migration priorisieren", idx: r(0) }] },
  { aspekt: "Gleichwertige Lebensverhältnisse", partei: "CDU/CSU",
    lang: [{ text: "Infrastrukturinvestitionen vor Ort als Wachstumsgrundlage; Kritik an Förderprogrammen, die strukturschwache Kommunen nicht erreichen", idx: r(0,1) }],
    kurz: [{ text: "Infrastrukturinvestitionen vor Ort; Förderprogramme erreichen strukturschwache Kommunen nicht", idx: r(0,1) }] },
  { aspekt: "Gleichwertige Lebensverhältnisse", partei: "GRÜNE",
    lang: [{ text: "Verlässliche Finanzierung für Klima- und Katastrophenschutz in Kommunen; Wohnungsnot untergräbt das Vertrauen in den Staat", idx: r(0,1) }],
    kurz: [{ text: "Verlässliche Finanzierung für Klima-/Katastrophenschutz; Wohnungsnot untergräbt Vertrauen", idx: r(0,1) }] },
  { aspekt: "Gleichwertige Lebensverhältnisse", partei: "LINKE",
    lang: [{ text: "Kritik an regionalen Steuereinnahmeausfällen durch die Körperschaftsteuersenkung, die Länder und Kommunen ungleich belastet", idx: r(0) }],
    kurz: [{ text: "Regionale Steuerausfälle durch Körperschaftsteuersenkung", idx: r(0) }] },
  { aspekt: "Gleichwertige Lebensverhältnisse", partei: "SPD",
    lang: [{ text: "Infrastrukturinvestitionen gegen kommunale Defizite (Bildung, Kitas); ÖPNV-Stärkung für gleichwertige Lebensverhältnisse im ländlichen Raum", idx: r(0,1) }],
    kurz: [{ text: "Infrastrukturinvestitionen gegen kommunale Defizite; ÖPNV im ländlichen Raum", idx: r(0,1) }] },
];

applySynthese("Staat und Verwaltung", CELLS);
