/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Recht" (40 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Justiz & Rechtsstaat =====
  { aspekt: "Justiz & Rechtsstaat", partei: "AfD",
    lang: [
      { text: "Verhältnismäßigkeit und Grundrechtsschutz: gegen unverhältnismäßige Durchsuchungen, Gesinnungsstrafrecht und Beweislastumkehr; richterlicher Vorbehalt und Bestimmtheitsgrundsatz", idx: r(4,5,8,9,15,25,28,30,33,35,38,43,44,45,46,49,50,58,59,60,62,63) },
      { text: "Unabhängigkeit der Justiz und Gewaltenteilung (gegen Weisungsrecht über Staatsanwälte); Unabhängigkeit des Bundesrechnungshofs; Ministerhaftung; BVerfG-Urteile umsetzen", idx: r(1,3,7,11,16,21,22,24,27,32,42,48,56,57) },
      { text: "Durchsetzung des Rechtsstaats gegen Clankriminalität (Vermögensabschöpfung); Digitalisierung der Justiz; Paralleljustiz erfassen; Vaterschaftsmissbrauch", idx: r(0,2,6,10,12,13,14,17,18,19,20,23,26,29,31,34,36,37,39,40,41,47,51,52,53,54,55,61) },
    ],
    kurz: [
      { text: "Verhältnismäßigkeit und Grundrechtsschutz (gegen unverhältnismäßige Durchsuchungen, Gesinnungsstrafrecht); Unabhängigkeit der Justiz und des Bundesrechnungshofs", idx: r(4,5,8,9,15,25,28,30,33,35,38,43,44,45,46,49,50,58,59,60,62,63,1,3,7,11,16,21,22,24,27,32,42,48,56,57) },
      { text: "Durchsetzung gegen Clankriminalität; Digitalisierung der Justiz; gegen Vaterschaftsmissbrauch", idx: r(0,2,6,10,12,13,14,17,18,19,20,23,26,29,31,34,36,37,39,40,41,47,51,52,53,54,55,61) },
    ] },
  { aspekt: "Justiz & Rechtsstaat", partei: "CDU/CSU",
    lang: [
      { text: "Justizunabhängigkeit und Rechtsstaat verteidigen (gegen AfD-Angriffe); Unabhängigkeit des Bundesrechnungshofs; gegen persönliche Ministerhaftung", idx: r(1,7,19,20,21,23,24,25,26,27,30,34,36,42,49,53,56) },
      { text: "Digitalisierung und bessere Ausstattung der Justiz (E-Akte, Onlineverfahren, Amtsgerichte stärken)", idx: r(4,5,6,10,15,17,22,33,39,40,44,59,62) },
      { text: "Durchsetzung gegen Clankriminalität und organisierte Kriminalität (Vermögensabschöpfung); SLAPP-Schutz; Gewaltschutz; Terrorismusbekämpfung; Vaterschaftsmissbrauch", idx: r(0,2,3,8,9,11,12,13,14,16,18,28,29,31,32,35,37,38,41,43,45,46,47,48,50,51,52,54,55,57,58,60,61) },
    ],
    kurz: [
      { text: "Justizunabhängigkeit und Rechtsstaat verteidigen; Digitalisierung und bessere Ausstattung der Justiz", idx: r(1,7,19,20,21,23,24,25,26,27,30,34,36,42,49,53,56,4,5,6,10,15,17,22,33,39,40,44,59,62) },
      { text: "Durchsetzung gegen Clankriminalität (Vermögensabschöpfung); SLAPP-Schutz; Gewaltschutz", idx: r(0,2,3,8,9,11,12,13,14,16,18,28,29,31,32,35,37,38,41,43,45,46,47,48,50,51,52,54,55,57,58,60,61) },
    ] },
  { aspekt: "Justiz & Rechtsstaat", partei: "GRÜNE",
    lang: [
      { text: "Justizunabhängigkeit und Rechtsstaat verteidigen (gegen AfD-Kontrolle); die Regierung muss Gerichte und Recht einhalten; Verhältnismäßigkeit", idx: r(0,1,6,7,8,10,11,12,16,17,19,20,21,25,26,29,30,31,33) },
      { text: "Digitalisierung und bessere Ausstattung der Justiz", idx: r(15,24,27,32) },
      { text: "Organisierte Kriminalität/Vermögenseinzug; Zeugnisverweigerungsrecht; SLAPP-Schutz; Vaterschaftsrecht; Schutz queerer Menschen", idx: r(2,3,4,5,9,13,14,18,22,23,28) },
    ],
    kurz: [
      { text: "Justizunabhängigkeit verteidigen; die Regierung muss Gerichte und Recht einhalten", idx: r(0,1,6,7,8,10,11,12,16,17,19,20,21,25,26,29,30,31,33) },
      { text: "Digitalisierung der Justiz; OK-Bekämpfung/Vermögenseinzug; SLAPP-Schutz", idx: r(15,24,27,32,2,3,4,5,9,13,14,18,22,23,28) },
    ] },
  { aspekt: "Justiz & Rechtsstaat", partei: "LINKE",
    lang: [
      { text: "Grundrechte und Verhältnismäßigkeit gegen Sicherheitsgesetze und Überwachung; die Regierung muss Gerichtsbeschlüsse und Recht einhalten", idx: r(1,3,5,12,19,24,25,26,27,30,31) },
      { text: "Soziale Gerechtigkeit: gegen Armutskriminalisierung und Ungleichheit vor Gericht; Schutz vor Inkasso", idx: r(0,2,20,21) },
      { text: "Sozial und rechtsstaatlich korrekte Digitalisierung; Gewaltschutz und spezialisierte Gerichte; gegen Taser; Schutz queerer Menschen; Bundesrechnungshof", idx: r(4,6,7,8,9,10,11,13,14,15,16,17,18,22,23,28,29) },
    ],
    kurz: [
      { text: "Grundrechte und Verhältnismäßigkeit gegen Sicherheitsgesetze; gegen Armutskriminalisierung und Ungleichheit vor Gericht", idx: r(1,3,5,12,19,24,25,26,27,30,31,0,2,20,21) },
      { text: "Sozial korrekte Digitalisierung; Gewaltschutz und spezialisierte Gerichte; Schutz queerer Menschen", idx: r(4,6,7,8,9,10,11,13,14,15,16,17,18,22,23,28,29) },
    ] },
  { aspekt: "Justiz & Rechtsstaat", partei: "SPD",
    lang: [
      { text: "Justizunabhängigkeit und Rechtsstaat gegen AfD-Diskreditierung verteidigen; § 188 StGB beibehalten; Gewaltenteilung und Wahlprüfung", idx: r(1,6,8,10,11,13,15,18,31,33) },
      { text: "Digitalisierung, bessere Ausstattung und ein zweiter Pakt für den Rechtsstaat; Amtsgerichte stärken", idx: r(4,12,14,17,24,29,30) },
      { text: "Organisierte Kriminalität/Clan (Vermögensabschöpfung); SLAPP-Schutz; Gewaltschutz; rechtsstaatliche Grenzkontrollen; queere NS-Opfer rehabilitieren; Bundesrechnungshof", idx: r(0,2,3,5,7,9,16,19,20,21,22,23,25,26,27,28,32) },
    ],
    kurz: [
      { text: "Justizunabhängigkeit verteidigen; § 188 StGB beibehalten; Digitalisierung und ein zweiter Pakt für den Rechtsstaat", idx: r(1,6,8,10,11,13,15,18,31,33,4,12,14,17,24,29,30) },
      { text: "OK-Bekämpfung (Vermögensabschöpfung); SLAPP-Schutz; Gewaltschutz; rechtsstaatliche Grenzkontrollen", idx: r(0,2,3,5,7,9,16,19,20,21,22,23,25,26,27,28,32) },
    ] },

  // ===== Diskriminierungsschutz (Art. 3 GG) =====
  { aspekt: "Diskriminierungsschutz (Art. 3 GG)", partei: "AfD",
    lang: [
      { text: "Gegen Erweiterung des AGG und des Art. 3 GG um sexuelle Identität als ideologisch und Sonderrechte (Schutz bereits ausreichend)", idx: r(1,3,5,6,7,8,10,11,13,14) },
      { text: "Schutz von Frauen vor häuslicher Gewalt; gegen Pränataltest-Diskriminierungs-Framing; gegen Diskriminierung von AfD-Mitgliedern", idx: r(0,2,9,4,12,15) },
    ],
    kurz: [
      { text: "Gegen Erweiterung des AGG und Art. 3 GG um sexuelle Identität als ideologisch", idx: r(1,3,5,6,7,8,10,11,13,14) },
      { text: "Schutz von Frauen vor häuslicher Gewalt; gegen Diskriminierung von AfD-Mitgliedern", idx: r(0,2,9,4,12,15) },
    ] },
  { aspekt: "Diskriminierungsschutz (Art. 3 GG)", partei: "CDU/CSU",
    lang: [
      { text: "Schutz besteht bereits in Art. 3 GG; gegen eine Grundgesetzänderung als bloße Symbolpolitik", idx: r(0,4,5,9,10,11,13,14) },
      { text: "Diskriminierungsschutz wichtig (AGG maßvoll verbessern); gegen die Annahme strukturellen Rassismus in Behörden; Schutz von LGBTQ+ und von Politikern", idx: r(1,2,3,6,7,8,12) },
    ],
    kurz: [
      { text: "Schutz besteht bereits in Art. 3 GG; gegen eine Grundgesetzänderung als Symbolpolitik", idx: r(0,4,5,9,10,11,13,14) },
      { text: "AGG maßvoll verbessern; gegen die Annahme strukturellen Rassismus in Behörden", idx: r(1,2,3,6,7,8,12) },
    ] },
  { aspekt: "Diskriminierungsschutz (Art. 3 GG)", partei: "GRÜNE",
    lang: [
      { text: "Art. 3 GG um sexuelle/geschlechtliche Identität ergänzen und das AGG stärken für queere Menschen (gegen Union-Blockade)", idx: r(0,2,5,15,16,17,18,20) },
      { text: "Regenbogenfamilien im Abstammungsrecht gleichstellen; Verbandsklagerecht, Ausweitung auf staatliche Stellen und algorithmische Diskriminierung", idx: r(3,4,6,8,11) },
      { text: "Struktureller Rassismus und Racial Profiling in Behörden bekämpfen; gegen AfD-Diskriminierung; queere Unterrichtsinhalte", idx: r(1,7,9,10,12,13,14,19) },
    ],
    kurz: [
      { text: "Art. 3 GG um sexuelle Identität ergänzen und das AGG stärken für queere Menschen", idx: r(0,2,5,15,16,17,18,20,3,4,6,8,11) },
      { text: "Struktureller Rassismus und Racial Profiling in Behörden bekämpfen; gegen AfD-Diskriminierung", idx: r(1,7,9,10,12,13,14,19) },
    ] },
  { aspekt: "Diskriminierungsschutz (Art. 3 GG)", partei: "LINKE",
    lang: [
      { text: "Art. 3 GG um sexuelle/geschlechtliche Identität ergänzen und das AGG erweitern (Antidiskriminierungsstelle als unabhängige Behörde mit Verbandsklagerecht); queere Menschen schützen", idx: r(8,13,1,3,9) },
      { text: "Racial Profiling und strukturellen Rassismus in Behörden bekämpfen", idx: r(0,4,6,11,15) },
      { text: "Schutz von Menschen mit Behinderung und Gehörlosen; gegen Vaterschafts-Generalverdacht und Taser; Schutz von Frauen vor Gewalt", idx: r(5,7,10,2,12,14) },
    ],
    kurz: [
      { text: "Art. 3 GG um sexuelle Identität ergänzen und das AGG erweitern; queere Menschen schützen", idx: r(8,13,1,3,9) },
      { text: "Racial Profiling und strukturellen Rassismus bekämpfen; Schutz von Behinderten und Frauen", idx: r(0,4,6,11,15,5,7,10,2,12,14) },
    ] },
  { aspekt: "Diskriminierungsschutz (Art. 3 GG)", partei: "SPD",
    lang: [
      { text: "Art. 3 GG um sexuelle Identität ergänzen und das AGG novellieren; queere Menschen schützen und NS-verfolgte Soldaten rehabilitieren", idx: r(0,2,3,6,8,9,11,12,14,15,16,17) },
      { text: "Gegen AfD-Generalverdacht gegen Muslime und gegen rassifizierende Statistik; strukturellen Rassismus ohne Generalverdacht aufarbeiten", idx: r(4,5,10,13) },
      { text: "Schutz von Frauen vor Gewalt und bei Mutterschaft; Schutz von Politikern vor Hass", idx: r(1,18,19,7) },
    ],
    kurz: [
      { text: "Art. 3 GG um sexuelle Identität ergänzen und das AGG novellieren; queere Menschen schützen", idx: r(0,2,3,6,8,9,11,12,14,15,16,17) },
      { text: "Gegen AfD-Generalverdacht gegen Muslime; Schutz von Frauen vor Gewalt", idx: r(4,5,10,13,1,18,19,7) },
    ] },

  // ===== Strafrecht (Verschärfen vs. Entlasten) =====
  { aspekt: "Strafrecht (Verschärfen vs. Entlasten)", partei: "AfD",
    lang: [
      { text: "Strafverschärfungen befürworten: Gewalt-/Sexualdelikte, Geldautomatensprengungen, Terrorismus, Vermögenseinziehung; Strafmündigkeit auf 12 senken", idx: r(2,7,9,10,12,15,17,20,21) },
      { text: "Schwarzfahren und Leistungserschleichung nicht entkriminalisieren", idx: r(1,6) },
      { text: "§ 188 StGB (Politikerbeleidigung) abschaffen; gegen einzelne Verschärfungen als unverhältnismäßig; härter gegen straffällige Migranten", idx: r(0,3,4,5,8,11,13,14,16,18,19) },
    ],
    kurz: [
      { text: "Strafverschärfungen bei Gewalt-/Sexualdelikten und OK; Schwarzfahren nicht entkriminalisieren", idx: r(2,7,9,10,12,15,17,20,21,1,6) },
      { text: "§ 188 StGB abschaffen; härter gegen straffällige Migranten", idx: r(0,3,4,5,8,11,13,14,16,18,19) },
    ] },
  { aspekt: "Strafrecht (Verschärfen vs. Entlasten)", partei: "CDU/CSU",
    lang: [
      { text: "Strafverschärfungen gegen organisierte Kriminalität, Clan, Geldautomatensprengungen, Terrorismus und Cybercrime (Vermögensabschöpfung)", idx: r(0,3,5,7,8,18,19,25,28) },
      { text: "Härtere Strafen gegen Gewalt an Frauen (Fußfessel, Sexualstrafrecht, Deepfakes, K.-o.-Tropfen)", idx: r(6,9,10,14,16,20,21,22) },
      { text: "§ 188 StGB verteidigen/verschärfen; Schwarzfahren strafbar behalten; Jugendstrafrecht erhalten; Extremismus verfolgen", idx: r(1,2,4,11,12,13,15,17,23,24,26,27,29) },
    ],
    kurz: [
      { text: "Strafverschärfungen gegen OK, Clan, Terrorismus; härtere Strafen gegen Gewalt an Frauen", idx: r(0,3,5,7,8,18,19,25,28,6,9,10,14,16,20,21,22) },
      { text: "§ 188 StGB verteidigen/verschärfen; Schwarzfahren strafbar behalten", idx: r(1,2,4,11,12,13,15,17,23,24,26,27,29) },
    ] },
  { aspekt: "Strafrecht (Verschärfen vs. Entlasten)", partei: "GRÜNE",
    lang: [
      { text: "Gezielte Verschärfungen: OK/Vermögensabschöpfung, Sprengstoff, schwere Steuerhinterziehung, Wirtschaftsstrafrecht, sexualisierte Übergriffe", idx: r(1,2,3,4,5,8,13) },
      { text: "Schwarzfahren entkriminalisieren; gegen Senkung der Strafmündigkeit und gegen Vorverlagerung im Antiterrorrecht", idx: r(10,16,14,7,12) },
      { text: "§ 188 StGB beibehalten (gegen Abschaffung); gegen AfD-Verschärfungen; Lachgas beschränken; Beamtenhaftung", idx: r(0,6,11,17,9,15) },
    ],
    kurz: [
      { text: "Gezielte Verschärfungen (OK, Steuerhinterziehung); Schwarzfahren entkriminalisieren", idx: r(1,2,3,4,5,8,13,10,16,14,7,12) },
      { text: "§ 188 StGB beibehalten; gegen AfD-Verschärfungen", idx: r(0,6,11,17,9,15) },
    ] },
  { aspekt: "Strafrecht (Verschärfen vs. Entlasten)", partei: "LINKE",
    lang: [
      { text: "Gegen Armutskriminalisierung; Schwarzfahren entkriminalisieren; Reform des Strafvollzugs", idx: r(0,3,8) },
      { text: "Gegen die Anwendung von § 188 StGB gegen Bürger, aber gegen dessen Abschaffung als AfD-Agenda", idx: r(2,4,5) },
      { text: "Strafverschärfung als unwirksame Symbolpolitik; Prävention statt höherer Strafrahmen; gegen Vorbereitungsstrafbarkeit und Jugend-Verschärfungen", idx: r(1,6,7,9,10,11,12,13) },
    ],
    kurz: [
      { text: "Gegen Armutskriminalisierung; Schwarzfahren entkriminalisieren; § 188 gegen Bürger ablehnen", idx: r(0,3,8,2,4,5) },
      { text: "Strafverschärfung als Symbolpolitik; Prävention statt höherer Strafrahmen", idx: r(1,6,7,9,10,11,12,13) },
    ] },
  { aspekt: "Strafrecht (Verschärfen vs. Entlasten)", partei: "SPD",
    lang: [
      { text: "Strafverschärfungen gegen digitale und sexualisierte Gewalt gegen Frauen", idx: r(0,1,3,10,14) },
      { text: "Strafverschärfungen gegen OK/Clan, Geldautomatensprengungen, Sprengstoff, Spionage, Terrorismus und Mietwucher", idx: r(2,4,6,7,8,9,11,13) },
      { text: "Schwarzfahren (§ 265a) entkriminalisieren; § 188 StGB für Kommunalpolitiker verteidigen", idx: r(5,15,12) },
    ],
    kurz: [
      { text: "Strafverschärfungen gegen Gewalt an Frauen und gegen OK/Clan, Terrorismus", idx: r(0,1,3,10,14,2,4,6,7,8,9,11,13) },
      { text: "Schwarzfahren entkriminalisieren; § 188 StGB für Kommunalpolitiker verteidigen", idx: r(5,15,12) },
    ] },

  // ===== Überwachung ablehnen =====
  { aspekt: "Überwachung ablehnen", partei: "AfD",
    lang: [
      { text: "Ablehnung von Massenüberwachung, Chatkontrolle und Staatstrojanern als grundrechtswidrig (verdachtsbezogene Ermittlungen mit richterlicher Kontrolle)", idx: r(0,1,3,4,5,6,7,9,10,12,13,14,16) },
      { text: "Gegen Europol-Datenverarbeitung und EU-Sicherheitsdatenraum, aber Datenspeicherung von Tatverdächtigen teils befürwortet (ambivalent)", idx: r(11,2,8,15) },
    ],
    kurz: [
      { text: "Ablehnung von Massenüberwachung, Chatkontrolle und Staatstrojanern als grundrechtswidrig", idx: r(0,1,3,4,5,6,7,9,10,12,13,14,16) },
      { text: "Gegen Europol-Datenverarbeitung; Datenspeicherung von Tatverdächtigen teils befürwortet", idx: r(11,2,8,15) },
    ] },
  { aspekt: "Überwachung ablehnen", partei: "CDU/CSU",
    lang: [
      { text: "Überwachungsmaßnahmen befürworten (IP-Speicherung, Fußfessel, Terrorbekämpfung) zur Sicherheitsgewährleistung", idx: r(0,2,4,5,6) },
      { text: "Hashwert-Kontrolle gegen Kindesmissbrauch, aber keine Massenüberwachung und Verschlüsselung erhalten", idx: r(1,3) },
    ],
    kurz: [
      { text: "Überwachungsmaßnahmen befürworten (IP-Speicherung, Fußfessel, Terrorbekämpfung)", idx: r(0,2,4,5,6) },
      { text: "Hashwert-Kontrolle gegen Kindesmissbrauch, aber keine Massenüberwachung", idx: r(1,3) },
    ] },
  { aspekt: "Überwachung ablehnen", partei: "GRÜNE",
    lang: [{ text: "Ablehnung von Vorratsdatenspeicherung, Chatkontrolle, KI-Videoüberwachung und anlassloser Fluggastdatenübermittlung als unverhältnismäßig", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Ablehnung von Vorratsdatenspeicherung, Chatkontrolle und KI-Videoüberwachung", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Überwachung ablehnen", partei: "LINKE",
    lang: [{ text: "Ablehnung von Massenüberwachung, Vorratsdatenspeicherung, Chatkontrolle und Befugnis-Erweiterungen (Europol, Bundespolizeigesetz) als grundrechtswidrig; rechtsstaatliche Kontrolle gefordert", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12) }],
    kurz: [{ text: "Ablehnung von Massenüberwachung, Vorratsdatenspeicherung und Chatkontrolle als grundrechtswidrig", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12) }] },
  { aspekt: "Überwachung ablehnen", partei: "SPD",
    lang: [{ text: "Gegen anlasslose Chatkontrolle und IP-Speicherung, aber Telekommunikationsüberwachung und Kontaktpersonen-Überwachung mit rechtsstaatlichen Safeguards befürworten", idx: r(0,1,2,3) }],
    kurz: [{ text: "Gegen anlasslose Chatkontrolle, aber TKÜ mit rechtsstaatlichen Safeguards befürworten", idx: r(0,1,2,3) }] },

  // ===== Schwangerschaftsabbruch =====
  { aspekt: "Schwangerschaftsabbruch", partei: "AfD",
    lang: [
      { text: "Gegen Legalisierung/Entkriminalisierung; Schutz ungeborenen Lebens, Beibehaltung von Wartefristen; gegen staatliche Auslandsfinanzierung von Abtreibungsorganisationen", idx: r(2,5,6,1) },
      { text: "Informationsfreiheit und elterliche Selbstbestimmung bei Pränataltests; gegen selektive Abtreibung", idx: r(0,3,4) },
    ],
    kurz: [
      { text: "Gegen Legalisierung/Entkriminalisierung; Schutz ungeborenen Lebens und Wartefristen", idx: r(2,5,6,1) },
      { text: "Informationsfreiheit bei Pränataltests; gegen selektive Abtreibung", idx: r(0,3,4) },
    ] },
  { aspekt: "Schwangerschaftsabbruch", partei: "CDU/CSU",
    lang: [{ text: "Bewährten Kompromiss und Schwangerschaftskonfliktberatung beibehalten; Entscheidungsautonomie der Frau als gefestigte Praxis anerkannt", idx: r(0,1) }],
    kurz: [{ text: "Bewährten Kompromiss und Beratung beibehalten; Entscheidungsautonomie der Frau anerkannt", idx: r(0,1) }] },
  { aspekt: "Schwangerschaftsabbruch", partei: "GRÜNE",
    lang: [{ text: "Entkriminalisierung und Selbstbestimmung der Frau; staatliche Sicherstellung der Versorgung gegen restriktiveren Zugang", idx: r(0,1,2,3) }],
    kurz: [{ text: "Entkriminalisierung und Selbstbestimmung; Versorgung sicherstellen", idx: r(0,1,2,3) }] },
  { aspekt: "Schwangerschaftsabbruch", partei: "LINKE",
    lang: [{ text: "Entkriminalisierung (§ 218 StGB streichen), Kassenleistung und flächendeckende Versorgung; reproduktive Selbstbestimmung", idx: r(1,0) }],
    kurz: [{ text: "Entkriminalisierung (§ 218 streichen), Kassenleistung und flächendeckende Versorgung", idx: r(1,0) }] },
  { aspekt: "Schwangerschaftsabbruch", partei: "SPD",
    lang: [{ text: "Reproduktive Selbstbestimmung; Zugang darf nicht vom Wohnort, Träger oder Finanzlage abhängen; ethische Debatte bei Pränataldiagnostik", idx: r(0,1,2) }],
    kurz: [{ text: "Reproduktive Selbstbestimmung; Zugang darf nicht vom Wohnort abhängen", idx: r(0,1,2) }] },

  // ===== Sexualstrafrecht („Nur Ja heißt Ja") =====
  { aspekt: "Sexualstrafrecht („Nur Ja heißt Ja“)", partei: "AfD",
    lang: [{ text: "Gegen ein aktives, konsensbasiertes Zustimmungsmodell (Beweislastumkehr-Sorge), aber Forderung nach stärkeren Regelungen gegen Sexualdelikte", idx: r(0,1) }],
    kurz: [{ text: "Gegen ein konsensbasiertes Zustimmungsmodell, aber stärkere Regelungen gegen Sexualdelikte", idx: r(0,1) }] },
  { aspekt: "Sexualstrafrecht („Nur Ja heißt Ja“)", partei: "CDU/CSU",
    lang: [{ text: "Schutz vor Sexualstraftaten durch Beschränkung des Zugangs zu K.-o.-Tropfen", idx: r(0) }],
    kurz: [{ text: "Schutz vor Sexualstraftaten durch Beschränkung von K.-o.-Tropfen", idx: r(0) }] },

  // ===== Wahlalter 16 / Wahlrecht =====
  { aspekt: "Wahlalter 16 / Wahlrecht", partei: "AfD",
    lang: [{ text: "Kritik am Wahlprüfungsverfahren als Machterhaltungsinstrument; Forderung nach Präzisierung der Maßstäbe; Widerspruch zwischen Wahlrecht und Jugendstrafrecht", idx: r(0,1,2) }],
    kurz: [{ text: "Kritik am Wahlprüfungsverfahren als Machterhalt; Präzisierung der Maßstäbe gefordert", idx: r(0,1,2) }] },
  { aspekt: "Wahlalter 16 / Wahlrecht", partei: "CDU/CSU",
    lang: [{ text: "Integrität der Bundestagswahl verteidigen; Reform der Wahlrechtsreform 2023, damit Wahlkreissieger ihr Mandat erhalten", idx: r(0,1,2) }],
    kurz: [{ text: "Integrität der Bundestagswahl verteidigen; Wahlkreissieger sollen ihr Mandat erhalten", idx: r(0,1,2) }] },
  { aspekt: "Wahlalter 16 / Wahlrecht", partei: "GRÜNE",
    lang: [{ text: "Integrität der Wahlprüfungsverfahren verteidigen; Ablehnung unbegründeter Vorwürfe von Wahlfehlern", idx: r(0) }],
    kurz: [{ text: "Integrität der Wahlprüfungsverfahren verteidigen", idx: r(0) }] },
  { aspekt: "Wahlalter 16 / Wahlrecht", partei: "LINKE",
    lang: [{ text: "Wahlrecht für alle, die fünf Jahre in Deutschland leben, unabhängig vom deutschen Pass", idx: r(0) }],
    kurz: [{ text: "Wahlrecht für alle nach fünf Jahren Aufenthalt, unabhängig vom Pass", idx: r(0) }] },
  { aspekt: "Wahlalter 16 / Wahlrecht", partei: "SPD",
    lang: [{ text: "Wahlrechtsreform zur Reduzierung der Sitzanzahl bei Repräsentation aller Wahlkreise; Erhöhung des Frauenanteils", idx: r(0) }],
    kurz: [{ text: "Wahlrechtsreform zur Sitzreduzierung; Erhöhung des Frauenanteils", idx: r(0) }] },

  // ===== Antisemitismus-Strafrecht =====
  { aspekt: "Antisemitismus-Strafrecht", partei: "CDU/CSU",
    lang: [{ text: "Anstieg antisemitischer Straftaten bekämpfen und jüdisches Leben schützen; Kritik an der Aufgabe der Antisemitismusdefinition durch die Linke; Wertungswiderspruch bei Durchsuchungen", idx: r(1,2,3,0) }],
    kurz: [{ text: "Antisemitische Straftaten bekämpfen und jüdisches Leben schützen", idx: r(1,2,3,0) }] },
  { aspekt: "Antisemitismus-Strafrecht", partei: "LINKE",
    lang: [{ text: "Strafverfolgung von Antisemitismus (auch AfD-Volksverhetzung), zugleich gegen antipalästinensischen Rassismus und Islamfeindlichkeit", idx: r(0,1) }],
    kurz: [{ text: "Strafverfolgung von Antisemitismus; zugleich gegen antipalästinensischen Rassismus", idx: r(0,1) }] },

  // ===== Geschlechterquoten =====
  { aspekt: "Geschlechterquoten", partei: "AfD",
    lang: [{ text: "Ablehnung von Diversitätsquoten als Verstoß gegen das Leistungsprinzip des Grundgesetzes", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Diversitätsquoten als Verstoß gegen das Leistungsprinzip", idx: r(0) }] },
  { aspekt: "Geschlechterquoten", partei: "GRÜNE",
    lang: [{ text: "Gleichstellung weiblicher Bundestagspräsidentinnen in der Geschäftsordnung", idx: r(0) }],
    kurz: [{ text: "Gleichstellung weiblicher Bundestagspräsidentinnen in der Geschäftsordnung", idx: r(0) }] },
  { aspekt: "Geschlechterquoten", partei: "SPD",
    lang: [{ text: "Erhöhung des Frauenanteils im Bundestag als wichtiges Anliegen", idx: r(0) }],
    kurz: [{ text: "Erhöhung des Frauenanteils im Bundestag", idx: r(0) }] },

  // ===== Direkte Demokratie =====
  { aspekt: "Direkte Demokratie", partei: "GRÜNE",
    lang: [{ text: "Gegen die Aushöhlung parlamentarischer Kontrolle und der Checks and Balances durch Ermächtigung des Innenministers", idx: r(0) }],
    kurz: [{ text: "Gegen die Aushöhlung parlamentarischer Kontrolle und Checks and Balances", idx: r(0) }] },

  // ===== Polygamie / Zwangsehen =====
  { aspekt: "Polygamie / Zwangsehen", partei: "AfD",
    lang: [{ text: "Gegen Zwangsverheiratungen und Kinderehen; Skepsis gegenüber der Wirksamkeit von Täterkursen", idx: r(0,1) }],
    kurz: [{ text: "Gegen Zwangsverheiratungen und Kinderehen", idx: r(0,1) }] },

  // ===== Streikrecht =====
  { aspekt: "Streikrecht", partei: "CDU/CSU",
    lang: [{ text: "Verteidigung der negativen Koalitionsfreiheit; kritische Sicht auf das Tariftreuegesetz als Eingriff in die Unternehmensfreiheit", idx: r(0) }],
    kurz: [{ text: "Verteidigung der negativen Koalitionsfreiheit; kritisch zum Tariftreuegesetz", idx: r(0) }] },
];

applySynthese("Recht", CELLS);
