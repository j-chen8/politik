/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Migration und Aufenthaltsrecht" (56 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Asylverfahren in Drittstaaten =====
  { aspekt: "Asylverfahren in Drittstaaten", partei: "AfD",
    lang: [
      { text: "Dublin-/Erststaat-Prinzip und sichere Drittstaaten durchsetzen (Artikel 16a GG)", idx: r(1,4,5,6,12) },
      { text: "Schutz in Herkunftsregionen/exterritoriale Verfahren statt Verschiebung nach Europa", idx: r(0,2,7,8,9,10) },
      { text: "Kritik an NGOs, an unbegrenzter Zielland-Wahl und an Analogleistungen", idx: r(3,11,13) },
    ],
    kurz: [
      { text: "Dublin-/Erststaat-Prinzip und sichere Drittstaaten durchsetzen; Schutz in Herkunftsregionen statt in Europa", idx: r(1,4,5,6,12,0,2,7,8,9,10) },
      { text: "Kritik an NGOs, an unbegrenzter Zielland-Wahl und an Analogleistungen", idx: r(3,11,13) },
    ] },
  { aspekt: "Asylverfahren in Drittstaaten", partei: "CDU/CSU",
    lang: [
      { text: "Rückkehrzentren/Return Hubs und Asylverfahren in sicheren Drittstaaten über EU-Kooperation", idx: r(0,3,4,9,11) },
      { text: "Sichere Herkunftsstaaten bestimmen, schnellere Asyl- und Rückführungsverfahren", idx: r(2,6,7) },
      { text: "Europäische Koordination und Erstaufnahmeprinzip; faire Lastenteilung mit Nachbarländern; Sicherheitsüberprüfung", idx: r(1,10,8,5) },
    ],
    kurz: [
      { text: "Rückkehrzentren/Return Hubs und Asylverfahren in sicheren Drittstaaten über EU; sichere Herkunftsstaaten", idx: r(0,3,4,9,11,2,6,7) },
      { text: "Europäische Koordination und Erstaufnahmeprinzip; faire Lastenteilung mit Nachbarländern", idx: r(1,10,8,5) },
    ] },
  { aspekt: "Asylverfahren in Drittstaaten", partei: "GRÜNE",
    lang: [
      { text: "Ablehnung der Auslagerung von Asylverfahren in Drittstaaten und von Dublin-/Sekundärmigrationszentren", idx: r(2,3,4) },
      { text: "Gegen Einstufung von Marokko/Tunesien als sichere Herkunftsländer; gegen Kürzung humanitärer Hilfe; meiste bleiben bereits in der Region", idx: r(1,0,5) },
    ],
    kurz: [
      { text: "Ablehnung der Auslagerung von Asylverfahren in Drittstaaten und von Dublin-Zentren", idx: r(2,3,4) },
      { text: "Gegen sichere Herkunftsländer (Marokko/Tunesien); gegen Kürzung humanitärer Hilfe", idx: r(1,0,5) },
    ] },
  { aspekt: "Asylverfahren in Drittstaaten", partei: "LINKE",
    lang: [
      { text: "Ablehnung beschleunigter Grenzverfahren und der Einstufung sicherer Herkunftsstaaten ohne ausreichenden Rechtsschutz", idx: r(0,1,2,3) },
      { text: "Ablehnung von Asylverfahren in Drittstaaten als unsicher; bessere Betreuung im laufenden Verfahren", idx: r(5,4) },
    ],
    kurz: [
      { text: "Ablehnung beschleunigter Grenzverfahren und sicherer Herkunftsstaaten ohne Rechtsschutz", idx: r(0,1,2,3) },
      { text: "Ablehnung von Asylverfahren in Drittstaaten als unsicher", idx: r(5,4) },
    ] },
  { aspekt: "Asylverfahren in Drittstaaten", partei: "SPD",
    lang: [
      { text: "Regionaler Schutz in Nachbarstaaten funktioniert bereits; Unterstützung der Aufnahmeländer statt Beschränkung auf sie", idx: r(0,1,3) },
      { text: "Grundrecht auf Asyl schützen; neues EU-Asylsystem mit sicheren Herkunftsstaaten per Rechtsverordnung", idx: r(2,4,5) },
    ],
    kurz: [
      { text: "Regionaler Schutz in Nachbarstaaten funktioniert bereits; Aufnahmeländer unterstützen", idx: r(0,1,3) },
      { text: "Grundrecht auf Asyl schützen; neues EU-Asylsystem mit sicheren Herkunftsstaaten", idx: r(2,4,5) },
    ] },

  // ===== EU-Verteilung (GEAS) =====
  { aspekt: "EU-Verteilung (GEAS)", partei: "AfD",
    lang: [
      { text: "GEAS als gescheitert/Scheinlösung kritisiert (Mogelpackung, löst Sekundärmigration nicht)", idx: r(1,5,9,10) },
      { text: "Nationale Lösungen und Souveränität statt EU-Vorgaben; Suspendierung des EU-Asylrechts", idx: r(2,3,4,7,8,13) },
      { text: "Gegen Zwangsquoten/Verteilungsmandat (Königsteiner Schlüssel, kommunales Vetorecht); mangelnde Rücknahme", idx: r(0,6,11,12) },
    ],
    kurz: [
      { text: "GEAS als gescheitert kritisiert; nationale Lösungen und Souveränität statt EU-Vorgaben", idx: r(1,5,9,10,2,3,4,7,8,13) },
      { text: "Gegen Zwangsquoten/Verteilungsmandat (kommunales Vetorecht)", idx: r(0,6,11,12) },
    ] },
  { aspekt: "EU-Verteilung (GEAS)", partei: "CDU/CSU",
    lang: [
      { text: "GEAS umsetzen für einheitliche Verfahren, schnellere Entscheidungen und effizientere Rückführungen", idx: r(0,2,7,9,11,12,13,15,16,17,20) },
      { text: "Dublin-Verordnung/Erstaufnahmeprinzip konsequent durchsetzen (nur Deutschland hält sie ein)", idx: r(1,3,18) },
      { text: "Nachschärfungen der GEAS-Regeln; faire Lastenteilung/Solidaritätsmechanismus", idx: r(5,8,10,19,6,14,4) },
    ],
    kurz: [
      { text: "GEAS umsetzen für einheitliche Verfahren und effizientere Rückführungen; Dublin/Erstaufnahme durchsetzen", idx: r(0,2,7,9,11,12,13,15,16,17,20,1,3,18) },
      { text: "Nachschärfungen der GEAS-Regeln; faire Lastenteilung/Solidaritätsmechanismus", idx: r(5,8,10,19,6,14,4) },
    ] },
  { aspekt: "EU-Verteilung (GEAS)", partei: "GRÜNE",
    lang: [
      { text: "Europäische Kompromisslösung, die alle Mitgliedstaaten solidarisch verpflichtet (gegen nationale Alleingänge)", idx: r(0) },
      { text: "Kritik an nationaler Übererfüllung der EU-Vorgaben und an Implementierungschaos", idx: r(1) },
    ],
    kurz: [{ text: "Europäische, solidarische Kompromisslösung statt nationaler Alleingänge; Kritik an Übererfüllung durch nationale Härte", idx: r(0,1) }] },
  { aspekt: "EU-Verteilung (GEAS)", partei: "LINKE",
    lang: [{ text: "Ablehnung der GEAS-Reform als Abschottungsregime und massivste Asylrechtsverschärfung mit unzureichendem Rechtsschutz", idx: r(0,1,2) }],
    kurz: [{ text: "Ablehnung der GEAS-Reform als Abschottungsregime mit unzureichendem Rechtsschutz", idx: r(0,1,2) }] },
  { aspekt: "EU-Verteilung (GEAS)", partei: "SPD",
    lang: [
      { text: "GEAS und Solidaritätsmechanismus befürworten für eine gerechtere Verteilung in Europa", idx: r(0,2,5,7,8,10,11,13,15) },
      { text: "Königsteiner Schlüssel zur Binnenverteilung; Grenzkontrollen nur bis GEAS funktioniert", idx: r(4,9,3,12,14) },
      { text: "Reform tritt 2026 in Kraft; Verteidigung gegen Kritik an Kinderinhaftierungsklauseln", idx: r(1,6) },
    ],
    kurz: [
      { text: "GEAS und Solidaritätsmechanismus befürworten für gerechtere Verteilung; Grenzkontrollen nur bis GEAS funktioniert", idx: r(0,2,5,7,8,10,11,13,15,4,9,3,12,14) },
      { text: "Reform tritt 2026 in Kraft", idx: r(1,6) },
    ] },

  // ===== Einbürgerung / Staatsangehörigkeit =====
  { aspekt: "Einbürgerung / Staatsangehörigkeit", partei: "AfD",
    lang: [
      { text: "Gegen Turbo-/Anspruchseinbürgerung: längere Fristen (8 Jahre), Ermessenseinbürgerung, Integrationsnachweis; gegen Doppelpass", idx: r(0,1,2,3,4,5,10) },
      { text: "Betrug bekämpfen (gefälschte Sprachzertifikate), Überprüfung und Entzug erschlichener Einbürgerungen", idx: r(6,9) },
      { text: "Stopp/Widerruf von Einbürgerungen für Syrer/Afghanen; gegen Grünen-Position", idx: r(7,8,11,12) },
    ],
    kurz: [
      { text: "Gegen Turbo-/Anspruchseinbürgerung: längere Fristen, Ermessen, Integrationsnachweis; gegen Doppelpass", idx: r(0,1,2,3,4,5,10) },
      { text: "Betrug bekämpfen, erschlichene Einbürgerungen entziehen; Stopp/Widerruf für Syrer/Afghanen", idx: r(6,9,7,8,11,12) },
    ] },
  { aspekt: "Einbürgerung / Staatsangehörigkeit", partei: "CDU/CSU",
    lang: [
      { text: "Gegen beschleunigte Einbürgerung (Turbo); Integration zuerst (5 Jahre, B1), Einbürgerung als Abschluss", idx: r(0,2,3,4,6,9,10,11,13,16) },
      { text: "Strengere Kontrollen und Sperrfristen gegen Betrug; klare Regeln", idx: r(5,8,12,14) },
      { text: "Einbürgerung als Zeichen gelungener Integration, gegen pauschale Moratorien", idx: r(1,7,15) },
    ],
    kurz: [
      { text: "Gegen beschleunigte Einbürgerung (Turbo); Integration zuerst (5 Jahre, B1), Einbürgerung als Abschluss", idx: r(0,2,3,4,6,9,10,11,13,16) },
      { text: "Strengere Kontrollen und Sperrfristen gegen Betrug; Einbürgerung als Zeichen gelungener Integration", idx: r(5,8,12,14,1,7,15) },
    ] },
  { aspekt: "Einbürgerung / Staatsangehörigkeit", partei: "GRÜNE",
    lang: [
      { text: "Liberalisierte Einbürgerung und doppelte Staatsangehörigkeit befürworten; gegen Erschwernisse", idx: r(0,1,2,4,6) },
      { text: "Gegen pauschale Ablehnung; Warnung vor Verschärfungen zulasten von Familien", idx: r(3,5) },
    ],
    kurz: [
      { text: "Liberalisierte Einbürgerung und doppelte Staatsangehörigkeit befürworten; gegen Erschwernisse", idx: r(0,1,2,4,6) },
      { text: "Gegen pauschale Ablehnung; Warnung vor Verschärfungen zulasten von Familien", idx: r(3,5) },
    ] },
  { aspekt: "Einbürgerung / Staatsangehörigkeit", partei: "LINKE",
    lang: [
      { text: "Erleichterte, schnellere Einbürgerung (nicht vom Geldbeutel abhängig); bessere Behördenausstattung", idx: r(0,1,2,3,4) },
      { text: "Gegen den Stopp der Einbürgerung von Syrern", idx: r(5) },
    ],
    kurz: [{ text: "Erleichterte, schnellere Einbürgerung (nicht vom Geldbeutel abhängig); gegen Stopp für Syrer", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Einbürgerung / Staatsangehörigkeit", partei: "SPD",
    lang: [
      { text: "Doppelte Staatsangehörigkeit und 5-Jahre-Frist befürworten; Einbürgerung als Anspruch mit vollem Wahlrecht", idx: r(0,2,4,5,7,8,9) },
      { text: "Gegen AfD-Remigration; Turbo-Einbürgerung-Abschaffung als Kompromiss; Integration als Sicherheit; Vaterschaftsmissbrauch", idx: r(1,10,11,3,6) },
    ],
    kurz: [
      { text: "Doppelte Staatsangehörigkeit und 5-Jahre-Frist; Einbürgerung als Anspruch mit vollem Wahlrecht", idx: r(0,2,4,5,7,8,9) },
      { text: "Gegen AfD-Remigration; Turbo-Abschaffung als Kompromiss; Integration als Sicherheit", idx: r(1,10,11,3,6) },
    ] },

  // ===== Fachkräfteeinwanderung =====
  { aspekt: "Fachkräfteeinwanderung", partei: "AfD",
    lang: [{ text: "Nur gezielte Hochqualifizierten-Zuwanderung/Rückgewinnung Deutscher; Fachkräfteeinwanderung als Lösung abgelehnt", idx: r(0,1,2) }],
    kurz: [{ text: "Nur gezielte Hochqualifizierten-Zuwanderung; Fachkräfteeinwanderung als Lösung abgelehnt", idx: r(0,1,2) }] },
  { aspekt: "Fachkräfteeinwanderung", partei: "CDU/CSU",
    lang: [{ text: "Gezielte Fachkräftezuwanderung als wirtschaftliche/demografische Notwendigkeit (Work-and-Stay-Agentur, Anerkennung)", idx: r(0,1,2,3,4,5,6,7) }],
    kurz: [{ text: "Gezielte Fachkräftezuwanderung als wirtschaftliche/demografische Notwendigkeit (Work-and-Stay)", idx: r(0,1,2,3,4,5,6,7) }] },
  { aspekt: "Fachkräfteeinwanderung", partei: "GRÜNE",
    lang: [{ text: "Fachkräftezuwanderung und Einbürgerung für Mangelberufe; syrische Fachkräfte; Integration/Sprache; gegen Arbeitsverbote", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Fachkräftezuwanderung für Mangelberufe (auch Einbürgerung als Bindung); gegen Arbeitsverbote", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Fachkräfteeinwanderung", partei: "LINKE",
    lang: [{ text: "Zuwanderung zur Deckung des Fachkräftemangels notwendig; gegen Verwehrung von Arbeitserlaubnissen für Geflüchtete", idx: r(0,1) }],
    kurz: [{ text: "Zuwanderung gegen Fachkräftemangel; gegen Arbeitsverbote für Geflüchtete", idx: r(0,1) }] },
  { aspekt: "Fachkräfteeinwanderung", partei: "SPD",
    lang: [
      { text: "Früherer Arbeitszugang für Asylbewerber/Geflüchtete zur Teilhabe", idx: r(0,2,4) },
      { text: "Anerkennung von Qualifikationen (Work-and-Stay); legale Zugangswege; Migrant:innen als Beitrag", idx: r(5,1,6,3) },
    ],
    kurz: [{ text: "Früherer Arbeitszugang für Geflüchtete; Anerkennung von Qualifikationen; legale Zugangswege", idx: r(0,2,4,5,1,6,3) }] },

  // ===== Familiennachzug (subsidiär) =====
  { aspekt: "Familiennachzug (subsidiär)", partei: "AfD",
    lang: [
      { text: "Familiennachzug beenden; Aussetzung als zu halbherzig kritisiert (nur subsidiär Schutzberechtigte)", idx: r(0,2,3,4,6,10) },
      { text: "Kritik an Ketteneinwanderung; Vaterschaftsmissbrauch (DNA-Tests)", idx: r(1,5,9) },
      { text: "Gegen subsidiären Schutz für Syrer; Revision der Aufenthaltstitel", idx: r(7,8,11) },
    ],
    kurz: [
      { text: "Familiennachzug beenden, Aussetzung als zu halbherzig; Kritik an Ketteneinwanderung und Vaterschaftsmissbrauch", idx: r(0,2,3,4,6,10,1,5,9) },
      { text: "Gegen subsidiären Schutz für Syrer", idx: r(7,8,11) },
    ] },
  { aspekt: "Familiennachzug (subsidiär)", partei: "CDU/CSU",
    lang: [
      { text: "Aussetzung des Familiennachzugs für subsidiär Schutzberechtigte (zwei Jahre) als Teil der Migrationswende und gegen Pullfaktoren", idx: r(0,2,3,4,5,6,7,8,9,10) },
      { text: "Betonung der Normalität grenzübergreifender Familien", idx: r(1) },
    ],
    kurz: [{ text: "Aussetzung des Familiennachzugs für subsidiär Schutzberechtigte (zwei Jahre) gegen Pullfaktoren", idx: r(0,2,3,4,5,6,7,8,9,10,1) }] },
  { aspekt: "Familiennachzug (subsidiär)", partei: "GRÜNE",
    lang: [{ text: "Ablehnung der Aussetzung des Familiennachzugs (legaler, grundrechtlich geschützter Weg; treibt auf gefährliche Routen)", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Ablehnung der Aussetzung des Familiennachzugs (grundrechtlich geschützt; treibt auf gefährliche Routen)", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Familiennachzug (subsidiär)", partei: "LINKE",
    lang: [
      { text: "Ablehnung der Aussetzung/Abschaffung des Familiennachzugs; Beschleunigung statt Aussetzung (Familie als Integrationsfaktor)", idx: r(0,1,2,3,4,5,7,9) },
      { text: "Gegen Vaterschafts-Generalverdacht; eheunabhängiges Aufenthaltsrecht als Schutz", idx: r(6,8) },
    ],
    kurz: [
      { text: "Ablehnung der Aussetzung/Abschaffung des Familiennachzugs; Beschleunigung statt Aussetzung", idx: r(0,1,2,3,4,5,7,9) },
      { text: "Gegen Vaterschafts-Generalverdacht; eheunabhängiges Aufenthaltsrecht", idx: r(6,8) },
    ] },
  { aspekt: "Familiennachzug (subsidiär)", partei: "SPD",
    lang: [
      { text: "Kritisch gegenüber der Aussetzung (wesentlich für Integration), akzeptiert als Kompromiss mit Härtefallregelung", idx: r(1,3,7,0,4,6) },
      { text: "Missbräuchliche Vaterschaftsanerkennungen verhindern (Schutz echter Familien)", idx: r(2,5) },
    ],
    kurz: [
      { text: "Kritisch gegenüber der Aussetzung, akzeptiert als Kompromiss mit Härtefallregelung", idx: r(1,3,7,0,4,6) },
      { text: "Missbräuchliche Vaterschaftsanerkennungen verhindern", idx: r(2,5) },
    ] },

  // ===== Grenzkontrollen =====
  { aspekt: "Grenzkontrollen", partei: "AfD",
    lang: [
      { text: "Wirksame Grenzkontrollen, Grenzsicherung und Zurückweisungen als Souveränitätsrecht", idx: r(0,1,2,3,5,6,8,9,10,11,13,14,15,17) },
      { text: "Kritik an aktuellen Kontrollen als ineffektiv/symbolisch; gegen EuGH-Rechtsprechung zu Zurückweisungen", idx: r(4,12,16,7) },
    ],
    kurz: [
      { text: "Wirksame Grenzkontrollen und Zurückweisungen als Souveränitätsrecht", idx: r(0,1,2,3,5,6,8,9,10,11,13,14,15,17) },
      { text: "Kritik an aktuellen Kontrollen als ineffektiv/symbolisch", idx: r(4,12,16,7) },
    ] },
  { aspekt: "Grenzkontrollen", partei: "CDU/CSU",
    lang: [
      { text: "Verstärkte Grenzkontrollen und Zurückweisungen als wirksames Instrument gegen irreguläre Migration", idx: r(0,2,3,4,6,8,9,11,12,13,14,15,16,18,19,22,23,24,25) },
      { text: "Kontrollen bis Außengrenzschutz und Dublin/GEAS funktionieren; Schutz der Außengrenzen", idx: r(1,7,20,21,17) },
      { text: "Zurückweisungen rechtmäßig; Grenzen für innere Sicherheit notwendig", idx: r(10,5) },
    ],
    kurz: [
      { text: "Verstärkte Grenzkontrollen und Zurückweisungen als wirksames Instrument gegen irreguläre Migration", idx: r(0,2,3,4,6,8,9,11,12,13,14,15,16,18,19,22,23,24,25,5) },
      { text: "Kontrollen bis Außengrenzschutz und Dublin/GEAS funktionieren; Zurückweisungen rechtmäßig", idx: r(1,7,20,21,17,10) },
    ] },
  { aspekt: "Grenzkontrollen", partei: "GRÜNE",
    lang: [{ text: "Kritik an Grenzkontrollen und Zurückweisungen als rechtswidrig/europarechtswidrig, ineffektiv und schädlich; für Freizügigkeit", idx: r(0,1,2,3,4,5,6,7) }],
    kurz: [{ text: "Kritik an Grenzkontrollen/Zurückweisungen als rechtswidrig, ineffektiv und schädlich", idx: r(0,1,2,3,4,5,6,7) }] },
  { aspekt: "Grenzkontrollen", partei: "LINKE",
    lang: [{ text: "Kritik an Pushbacks/Gewalt an Außengrenzen und an Binnengrenzkontrollen als EU-Rechtsverstoß", idx: r(0,1) }],
    kurz: [{ text: "Kritik an Pushbacks und an Binnengrenzkontrollen als EU-Rechtsverstoß", idx: r(0,1) }] },
  { aspekt: "Grenzkontrollen", partei: "SPD",
    lang: [
      { text: "Grenzkontrollen nur temporär/verhältnismäßig, kein Dauerzustand; Schengenraum erhalten", idx: r(0,2,3,7) },
      { text: "Kontrollen bei der EU-Kommission angemeldet/rechtmäßig; erfolgreich bei der Reduktion von Asylzuwanderung; verbindliche Außengrenzverfahren", idx: r(1,4,5) },
      { text: "Warnung vor Überlastung der Bundespolizei", idx: r(6,8) },
    ],
    kurz: [
      { text: "Grenzkontrollen nur temporär, kein Dauerzustand; Schengenraum erhalten; rechtmäßig und bei der Reduktion erfolgreich", idx: r(0,2,3,7,1,4,5) },
      { text: "Warnung vor Überlastung der Bundespolizei", idx: r(6,8) },
    ] },

  // ===== Grundhaltung =====
  { aspekt: "Grundhaltung", partei: "AfD",
    lang: [
      { text: "Restriktive Migrationspolitik: drastische Begrenzung bis Zuwanderungsstopp", idx: r(1,3,4,13,15,16,18,20,22,24,25,30,31,36,40,42,43,44,46,47,48,51,52,53) },
      { text: "Nationale Souveränität und Grenzschutz; das EU-Asylsystem als gescheitert kritisiert", idx: r(0,6,9,23,26,28,55,34) },
      { text: "Remigration, Abschiebungen und konsequente Durchsetzung der Ausreisepflicht", idx: r(14,21,32,35,37) },
      { text: "Asyl als temporärer Schutz; Rückkehr von Syrern/Afghanen, gegen Aufnahmeprogramme", idx: r(2,5,7,33,38,49,50,54) },
      { text: "Belastung der Sozialsysteme/Kommunen, Kriminalität/Sicherheit; Genfer Konvention revidieren; Integration vor Einbürgerung; Kriege als Wurzel", idx: r(10,11,12,17,19,27,29,39,41,45,56,57,8) },
    ],
    kurz: [
      { text: "Restriktive Migrationspolitik: drastische Begrenzung bis Stopp; nationale Souveränität und Grenzschutz", idx: r(1,3,4,13,15,16,18,20,22,24,25,30,31,36,40,42,43,44,46,47,48,51,52,53,0,6,9,23,26,28,55,34) },
      { text: "Remigration und Abschiebungen; Asyl als temporärer Schutz, Rückkehr von Syrern/Afghanen", idx: r(14,21,32,35,37,2,5,7,33,38,49,50,54) },
      { text: "Belastung der Sozialsysteme/Kommunen, Kriminalität; Genfer Konvention revidieren", idx: r(10,11,12,17,19,27,29,39,41,45,56,57,8) },
    ] },
  { aspekt: "Grundhaltung", partei: "CDU/CSU",
    lang: [
      { text: "Migration begrenzen (erfolgreiche Migrationswende, Reduktion der Asylzahlen)", idx: r(0,1,3,4,7,9,12,13,17,19,21,22,23,24,26,27,28,32,33,37,40,44,45) },
      { text: "Humanität und Ordnung verbinden", idx: r(14,18,29,31,46,47) },
      { text: "Genfer Flüchtlingskonvention und das individuelle Asylrecht verteidigen", idx: r(5,34,35,36,39,41) },
      { text: "Legale/Fachkräftemigration bejahen; Deutschland als Einwanderungsland mit Werten", idx: r(16,30,38) },
      { text: "Gegen AfD-Hetze und pauschale Remigration; Einbürgerung mit Augenmaß; Schutz für Ukrainer", idx: r(2,8,10,11,15,20,25,42,43,6) },
    ],
    kurz: [
      { text: "Migration begrenzen (Migrationswende), aber Humanität und Ordnung verbinden", idx: r(0,1,3,4,7,9,12,13,17,19,21,22,23,24,26,27,28,32,33,37,40,44,45,14,18,29,31,46,47) },
      { text: "Genfer Konvention und individuelles Asylrecht verteidigen; legale/Fachkräftemigration bejahen", idx: r(5,34,35,36,39,41,16,30,38) },
      { text: "Gegen AfD-Hetze und pauschale Remigration; Einbürgerung mit Augenmaß", idx: r(2,8,10,11,15,20,25,42,43,6) },
    ] },
  { aspekt: "Grundhaltung", partei: "GRÜNE",
    lang: [
      { text: "Gegen restriktive Abschottungspolitik; für eine offene, pluralistische Gesellschaft und europäische Lösungen", idx: r(0,1,4,5,16,20,21,23,25,7) },
      { text: "Migration als wirtschaftliche Notwendigkeit; Deutschland als Einwanderungsland", idx: r(3,13) },
      { text: "Humanitäre Verpflichtung, Genfer Konvention und individuelles Asylrecht", idx: r(8,9,10,17,24,19) },
      { text: "Gegen Einstufung sicherer Herkunftsstaaten; Schutz für Afghanistan/Jesiden, Syrer, Ukrainer; binationale Familien", idx: r(2,15,6,11,14,22,18,12) },
    ],
    kurz: [
      { text: "Gegen restriktive Abschottungspolitik; offene Gesellschaft, Migration als wirtschaftliche Notwendigkeit", idx: r(0,1,4,5,16,20,21,23,25,7,3,13) },
      { text: "Humanitäre Verpflichtung und Genfer Konvention; gegen sichere Herkunftsstaaten; Schutz für gefährdete Gruppen", idx: r(8,9,10,17,24,19,2,15,6,11,14,22,18,12) },
    ] },
  { aspekt: "Grundhaltung", partei: "LINKE",
    lang: [
      { text: "Gegen restriktive Migrationspolitik; für Menschenrechte, Würde und Solidarität mit Geflüchteten", idx: r(0,2,7,8,9,11,12,13,15,16,17,18,19,20,22,23) },
      { text: "Migration als Beitrag zu Wirtschaft und Arbeitsmarkt; Asylrecht mit individueller Prüfung verteidigen", idx: r(10,4) },
      { text: "Schutz spezifischer Gruppen (Jesiden, Iraner, afghanische Ortskräfte)", idx: r(1,3,14) },
      { text: "Willkommenskultur und gleiche Rechte; deutsche Mitverantwortung für Fluchtursachen", idx: r(5,6,21) },
    ],
    kurz: [
      { text: "Gegen restriktive Migrationspolitik; für Menschenrechte und Solidarität; Migration als Beitrag", idx: r(0,2,7,8,9,11,12,13,15,16,17,18,19,20,22,23,10,4) },
      { text: "Schutz spezifischer Gruppen; Willkommenskultur und gleiche Rechte; Mitverantwortung für Fluchtursachen", idx: r(1,3,14,5,6,21) },
    ] },
  { aspekt: "Grundhaltung", partei: "SPD",
    lang: [
      { text: "Asylrecht und Genfer Flüchtlingskonvention als Grundrecht/zivilisatorischen Fortschritt verteidigen", idx: r(0,1,2,5,19,24) },
      { text: "Migration als Stärke; Deutschland als Einwanderungsland", idx: r(4,9,14,20,21) },
      { text: "Balance aus Humanität, Ordnung und Rechtsstaatlichkeit; gegen Fluchtursachen", idx: r(11,17,18,28,31,10) },
      { text: "Gegen AfD-Remigration und völkisch-nationale Politik", idx: r(3,8,13,15,16,25,29) },
      { text: "Solidarität und Schutz Geflüchteter (auch Ukraine); Armutsmigration rechtsstaatlich/sozialintegrativ", idx: r(6,7,23,26,27,30,22,12) },
    ],
    kurz: [
      { text: "Asylrecht und Genfer Konvention verteidigen; Migration als Stärke und Einwanderungsland", idx: r(0,1,2,5,19,24,4,9,14,20,21) },
      { text: "Balance aus Humanität, Ordnung und Rechtsstaatlichkeit; gegen AfD-Remigration", idx: r(11,17,18,28,31,10,3,8,13,15,16,25,29) },
      { text: "Solidarität und Schutz Geflüchteter (auch Ukraine)", idx: r(6,7,23,26,27,30,22,12) },
    ] },

  // ===== Legale Fluchtwege =====
  { aspekt: "Legale Fluchtwege", partei: "AfD",
    lang: [{ text: "Gegen Transitrouten/Sozialtourismus, Schlepper und unkontrollierte Evakuierungen", idx: r(0,1,2,3) }],
    kurz: [{ text: "Gegen Transitrouten/Sozialtourismus, Schlepper und unkontrollierte Evakuierungen", idx: r(0,1,2,3) }] },
  { aspekt: "Legale Fluchtwege", partei: "CDU/CSU",
    lang: [
      { text: "Freiwillige Rückkehr und Arbeitsmigration fördern; Genfer Konvention gilt", idx: r(0,1) },
      { text: "Sicherheitsüberprüfung statt freiwilliger Afghanistan-Aufnahme", idx: r(2) },
    ],
    kurz: [{ text: "Freiwillige Rückkehr/Arbeitsmigration; Sicherheitsüberprüfung statt freiwilliger Afghanistan-Aufnahme", idx: r(0,1,2) }] },
  { aspekt: "Legale Fluchtwege", partei: "GRÜNE",
    lang: [
      { text: "Legale Wege und Familiennachzug erhalten (Beschneidung treibt auf gefährliche Routen)", idx: r(0,1,7) },
      { text: "Afghanistan-Aufnahmeprogramme und -zusagen für Ortskräfte umsetzen", idx: r(2,3,4,5,6) },
    ],
    kurz: [
      { text: "Legale Wege und Familiennachzug erhalten", idx: r(0,1,7) },
      { text: "Afghanistan-Aufnahmeprogramme und -zusagen umsetzen", idx: r(2,3,4,5,6) },
    ] },
  { aspekt: "Legale Fluchtwege", partei: "LINKE",
    lang: [
      { text: "Sichere, legale Fluchtwege schaffen statt gefährlicher Überfahrten; Chancen-Aufenthaltsrecht", idx: r(1,3,4,7,5) },
      { text: "Afghanistan-Aufnahmeprogramm umsetzen; Kontingentprogramme; Iran", idx: r(2,6,0,8) },
    ],
    kurz: [
      { text: "Sichere, legale Fluchtwege schaffen; Chancen-Aufenthaltsrecht", idx: r(1,3,4,7,5) },
      { text: "Afghanistan-Aufnahmeprogramm umsetzen; Kontingentprogramme", idx: r(2,6,0,8) },
    ] },
  { aspekt: "Legale Fluchtwege", partei: "SPD",
    lang: [{ text: "Legale Zugangswege und internationale Schutzinstrumente stärken (Bundesaufnahmeprogramm Afghanistan, Chancen-Aufenthaltsrecht)", idx: r(0,1,3,2) }],
    kurz: [{ text: "Legale Zugangswege und Schutzinstrumente stärken (Afghanistan-Programm, Chancen-Aufenthaltsrecht)", idx: r(0,1,3,2) }] },

  // ===== Rückführungen / Abschiebungen =====
  { aspekt: "Rückführungen / Abschiebungen", partei: "AfD",
    lang: [
      { text: "Konsequente Abschiebungen und deutlich höhere Rückführungsquoten", idx: r(5,6,7,9,10,11,12,14,16,17,18,22) },
      { text: "Rückkehr von Syrern und Afghanen in die Herkunftsländer", idx: r(3,8,13,15,19,23,25) },
      { text: "Gegen Hürden für Abschiebungen (Pflichtverteidigung); gegen Integrationskurse für Geduldete; Migrationswende", idx: r(1,2,24,21,4,20,26,0) },
    ],
    kurz: [
      { text: "Konsequente Abschiebungen und höhere Rückführungsquoten; Rückkehr von Syrern/Afghanen", idx: r(5,6,7,9,10,11,12,14,16,17,18,22,3,8,13,15,19,23,25) },
      { text: "Gegen Hürden für Abschiebungen; gegen Integrationskurse für Geduldete", idx: r(1,2,24,21,4,20,26,0) },
    ] },
  { aspekt: "Rückführungen / Abschiebungen", partei: "CDU/CSU",
    lang: [
      { text: "Abschiebung von Straftätern und Gefährdern, auch nach Syrien und Afghanistan", idx: r(0,3,9,11,17,18,19,24,28,8) },
      { text: "Verfahren beschleunigen: Pflichtanwalt in Abschiebehaft abschaffen, Ausreisegewahrsam", idx: r(7,10,20,33,2) },
      { text: "Rückführungsoffensive mit Rückführungszentren/Return Hubs", idx: r(6,12,14,15,26,4) },
      { text: "Europäische Koordination und Überstellungen; Abschiebung bei entfallenem Schutzgrund", idx: r(21,22,23,36,35) },
      { text: "Freiwillige Rückkehr plus Durchsetzung; Ende freiwilliger Aufnahmen; Sanktionen bei Behinderung; gegen pauschale Massenabschiebung; Jesiden-Schutz", idx: r(30,5,34,25,16,31,1,13,27,29,32) },
    ],
    kurz: [
      { text: "Abschiebung von Straftätern/Gefährdern (auch Syrien/Afghanistan); Verfahren beschleunigen (Pflichtanwalt abschaffen)", idx: r(0,3,9,11,17,18,19,24,28,8,7,10,20,33,2) },
      { text: "Rückführungsoffensive mit Zentren/Return Hubs; europäische Koordination; Abschiebung bei entfallenem Schutzgrund", idx: r(6,12,14,15,26,4,21,22,23,36,35) },
      { text: "Freiwillige Rückkehr plus Durchsetzung; Ende freiwilliger Aufnahmen; gegen pauschale Massenabschiebung", idx: r(30,5,34,25,16,31,1,13,27,29,32) },
    ] },
  { aspekt: "Rückführungen / Abschiebungen", partei: "GRÜNE",
    lang: [
      { text: "Gegen Abschiebungen (nach Afghanistan, Syrien, von Jesiden und von Arbeitenden)", idx: r(1,2,3,4,5,7,10,11,13) },
      { text: "Anwaltlichen Pflichtbeistand in Abschiebehaft erhalten; gegen Flughafenverfahren/Zurückweisungen; falscher Fokus auf Abschiebung", idx: r(0,6,8,9,12) },
    ],
    kurz: [
      { text: "Gegen Abschiebungen (Afghanistan, Syrien, Jesiden, Arbeitende)", idx: r(1,2,3,4,5,7,10,11,13) },
      { text: "Pflichtbeistand in Abschiebehaft erhalten; gegen Flughafenverfahren/Zurückweisungen", idx: r(0,6,8,9,12) },
    ] },
  { aspekt: "Rückführungen / Abschiebungen", partei: "LINKE",
    lang: [
      { text: "Gegen Abschiebungen in unsichere Länder (Iran, Afghanistan, Syrien, Libyen)", idx: r(0,1,4,9,11,12,14,15) },
      { text: "Gegen pauschale Abschiebungen ohne individuelle Prüfung; gegen Aufhebung von Aufnahmezusagen", idx: r(2,3,5,6,10) },
      { text: "Anwaltliche Pflichtverteidigung erhalten (hohe Quote rechtswidriger Abschiebehaft); gegen Abschiebehaft", idx: r(7,8,13) },
    ],
    kurz: [
      { text: "Gegen Abschiebungen in unsichere Länder; gegen pauschale Abschiebungen ohne individuelle Prüfung", idx: r(0,1,4,9,11,12,14,15,2,3,5,6,10) },
      { text: "Anwaltliche Pflichtverteidigung erhalten; gegen Abschiebehaft", idx: r(7,8,13) },
    ] },
  { aspekt: "Rückführungen / Abschiebungen", partei: "SPD",
    lang: [
      { text: "Rückführungen für Personen ohne Schutzanspruch; Rückführungsoffensive und neue Abkommen", idx: r(3,4,8,6) },
      { text: "Menschenwürde auch in der Abschiebehaft; gegen Syrien-Abschiebung unter aktuellen Bedingungen", idx: r(0,1,5,7) },
      { text: "Verfahren beschleunigen (Verzicht auf Pflichtbeistand); Kritik an vager AfD-Forderung", idx: r(9,2) },
    ],
    kurz: [
      { text: "Rückführungen für Personen ohne Schutzanspruch (Offensive, neue Abkommen); Menschenwürde in Abschiebehaft", idx: r(3,4,8,6,0,1,5,7) },
      { text: "Verfahren beschleunigen (Verzicht auf Pflichtbeistand); Kritik an vager AfD-Forderung", idx: r(9,2) },
    ] },

  // ===== Seenotrettung =====
  { aspekt: "Seenotrettung", partei: "AfD",
    lang: [{ text: "Kritik an EUNAVFOR MED Irini als kontraproduktiv (Migranten nach Europa statt nach Afrika)", idx: r(0) }],
    kurz: [{ text: "Kritik an der EU-Operation Irini als kontraproduktiv", idx: r(0) }] },
  { aspekt: "Seenotrettung", partei: "GRÜNE",
    lang: [{ text: "Seenotrettung als völkerrechtliche Pflicht; gegen Kürzung von Mitteln für zivile Rettung; Todesfälle als Folge der Abschottung", idx: r(0,1,2) }],
    kurz: [{ text: "Seenotrettung als Pflicht; gegen Kürzung der zivilen Seenotrettung", idx: r(0,1,2) }] },
  { aspekt: "Seenotrettung", partei: "LINKE",
    lang: [{ text: "Seenotrettung unterstützen statt behindern; Kritik an Irini-Kooperation mit libyscher Küstenwache; Sterben im Mittelmeer beenden", idx: r(0,1,2,3) }],
    kurz: [{ text: "Seenotrettung unterstützen; Kritik an Irini; Sterben im Mittelmeer beenden", idx: r(0,1,2,3) }] },
  { aspekt: "Seenotrettung", partei: "SPD",
    lang: [{ text: "Das Sterben im Mittelmeer beenden als Ziel europäischer Migrationspolitik", idx: r(0,1) }],
    kurz: [{ text: "Das Sterben im Mittelmeer beenden", idx: r(0,1) }] },

  // ===== Sozialleistungen für Asylbewerber =====
  { aspekt: "Sozialleistungen für Asylbewerber", partei: "AfD",
    lang: [
      { text: "Sozialleistungen kürzen, Sachleistungen statt Geld, Orientierung am dänischen Modell; Analogleistungen abschaffen", idx: r(2,3,5,14,15) },
      { text: "Sozialstandards als Anreiz für Sekundärmigration; hohe Kosten und Belastung der Kommunen", idx: r(10,11,0,1,6,7,16,19) },
      { text: "Leistungen für Ausländer/Bürgergeld ohne Beitrag kürzen; Vaterschaftsmissbrauch; Integrationskurse beschränken; Streichung für Kriminelle/Gesuchte; Ukrainer ins AsylbLG", idx: r(4,12,8,9,13,18,17) },
    ],
    kurz: [
      { text: "Sozialleistungen kürzen, Sachleistungen statt Geld; Sozialstandards als Migrationsanreiz, hohe Kosten/Kommunenbelastung", idx: r(2,3,5,14,15,10,11,0,1,6,7,16,19) },
      { text: "Leistungen für Ausländer/Bürgergeld ohne Beitrag kürzen; Streichung für Kriminelle; Ukrainer ins AsylbLG", idx: r(4,12,8,9,13,18,17) },
    ] },
  { aspekt: "Sozialleistungen für Asylbewerber", partei: "CDU/CSU",
    lang: [
      { text: "Asylbewerberleistungsgesetz als ausreichend/rechtsstaatlich verteidigen; Rechtskreiswechsel SGB → AsylbLG; Analogleistungen mit Bedingungen", idx: r(0,4,11,1,3,8) },
      { text: "Kürzung für abgelehnte und Dublin-Fälle; Missbrauch sanktionieren", idx: r(6,9,7) },
      { text: "Leistungen nicht beliebig kürzbar, menschenwürdiges Existenzminimum; Familiennachzug in die Sozialsysteme", idx: r(2,10,5) },
    ],
    kurz: [
      { text: "AsylbLG verteidigen; Rechtskreiswechsel SGB → AsylbLG; Kürzung für abgelehnte/Dublin-Fälle, Missbrauch sanktionieren", idx: r(0,4,11,1,3,8,6,9,7) },
      { text: "Leistungen nicht beliebig kürzbar (menschenwürdiges Existenzminimum)", idx: r(2,10,5) },
    ] },
  { aspekt: "Sozialleistungen für Asylbewerber", partei: "GRÜNE",
    lang: [
      { text: "Gegen die Behauptung, Migration belaste den Sozialstaat (wahre Kostentreiber sind Arbeitsverbote und lange Verfahren)", idx: r(0) },
      { text: "Gegen Kürzungen und Verschiebung von Ukrainern ins AsylbLG; kommunale Integration (Kita, Sprachkurse)", idx: r(2,3,4,1) },
    ],
    kurz: [
      { text: "Gegen die Behauptung, Migration belaste den Sozialstaat", idx: r(0) },
      { text: "Gegen Kürzungen und Verschiebung von Ukrainern ins AsylbLG; kommunale Integration", idx: r(2,3,4,1) },
    ] },
  { aspekt: "Sozialleistungen für Asylbewerber", partei: "LINKE",
    lang: [{ text: "Bürgergeld-Niveau für Geflüchtete und Abschaffung des Asylbewerberleistungsgesetzes (gegen Unterschreitung des Existenzminimums)", idx: r(0,1) }],
    kurz: [{ text: "Bürgergeld-Niveau für Geflüchtete; AsylbLG abschaffen", idx: r(0,1) }] },
  { aspekt: "Sozialleistungen für Asylbewerber", partei: "SPD",
    lang: [
      { text: "Gegen Kürzungen unter das Existenzminimum (auch für Langzeitaufenthalter); Gesundheitsversorgung für Kinder", idx: r(1,3,0) },
      { text: "Missbrauch bekämpfen, aber sozialintegrativ und an Beschäftigung gekoppelt; Ukrainer von Bürgergeld zurück ins AsylbLG", idx: r(2,4,5) },
    ],
    kurz: [
      { text: "Gegen Kürzungen unter das Existenzminimum; Gesundheitsversorgung für Kinder", idx: r(1,3,0) },
      { text: "Missbrauch bekämpfen, aber sozialintegrativ; Ukrainer zurück ins AsylbLG", idx: r(2,4,5) },
    ] },

  // ===== Wahlrecht / Klimaflucht =====
  { aspekt: "Wahlrecht / Klimaflucht", partei: "GRÜNE",
    lang: [{ text: "Wahlrecht für Menschen mit Migrationsgeschichte ohne deutsche Staatsbürgerschaft", idx: r(0) }],
    kurz: [{ text: "Wahlrecht für Menschen ohne deutsche Staatsbürgerschaft", idx: r(0) }] },
  { aspekt: "Wahlrecht / Klimaflucht", partei: "LINKE",
    lang: [{ text: "Wahlrecht für alle mit Lebensmittelpunkt in Deutschland (nach fünf Jahren) unabhängig von der Staatsangehörigkeit", idx: r(0,1,2) }],
    kurz: [{ text: "Wahlrecht nach fünf Jahren Aufenthalt unabhängig von der Staatsangehörigkeit", idx: r(0,1,2) }] },
];

applySynthese("Migration und Aufenthaltsrecht", CELLS);
