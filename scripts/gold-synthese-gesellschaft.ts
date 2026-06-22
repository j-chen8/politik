/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Gesellschaftspolitik, soziale Gruppen" (57 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Alleinerziehende =====
  { aspekt: "Alleinerziehende", partei: "AfD",
    lang: [
      { text: "Anerkennung als legitime Familienform; Entlastung gegen Armutsrisiko", idx: r(1,3,4) },
      { text: "Kritik an universeller Ausweitung des Unterhaltsvorschusses (Anrechnung, Status)", idx: r(0,2) },
    ],
    kurz: [{ text: "Anerkennung und Entlastung; aber Kritik an universeller Ausweitung des Unterhaltsvorschusses", idx: r(1,3,4,0,2) }] },
  { aspekt: "Alleinerziehende", partei: "CDU/CSU",
    lang: [
      { text: "Unterstützung durch Unterhaltsvorschuss, aber mit Eigenverantwortung und Rückforderung der Unterhaltspflichtigen", idx: r(1,2,3,4) },
      { text: "Anerkennung als legitime Familienform", idx: r(0) },
    ],
    kurz: [{ text: "Unterstützung durch Unterhaltsvorschuss mit Eigenverantwortung/Rückforderung; Anerkennung als Familienform", idx: r(1,2,3,4,0) }] },
  { aspekt: "Alleinerziehende", partei: "GRÜNE",
    lang: [
      { text: "Finanzielle Entlastung: Unterhaltsvorschuss erhöhen, Kindergeld entkoppeln, gegen Kürzungen", idx: r(0,4,6,5) },
      { text: "Besondere Unterstützung und Einbezug der Perspektive Alleinerziehender", idx: r(1,2,3) },
    ],
    kurz: [{ text: "Finanzielle Entlastung (Unterhaltsvorschuss erhöhen, Kindergeld entkoppeln); gegen Kürzungen", idx: r(0,4,6,5,1,2,3) }] },
  { aspekt: "Alleinerziehende", partei: "LINKE",
    lang: [
      { text: "Gegen Kürzungen beim Unterhaltsvorschuss; Reform (Kindergeld nur hälftig anrechnen, Ausweitung bis 25)", idx: r(0,2,4,5) },
      { text: "Bessere Absicherung gegen Armut; gegen rechtsextreme Delegitimierung", idx: r(1,6,7,3) },
    ],
    kurz: [{ text: "Gegen Kürzungen beim Unterhaltsvorschuss, Reform; bessere Absicherung gegen Armut", idx: r(0,2,4,5,1,6,7,3) }] },
  { aspekt: "Alleinerziehende", partei: "SPD",
    lang: [
      { text: "Unterhaltsvorschuss reformieren (Kindergeldabzug); Anerkennung verschiedener Familienformen", idx: r(2,6,0) },
      { text: "Belastung anerkennen; Ganztags-/Ferienbetreuung; hoher Bürgergeld-Bezug", idx: r(3,4,7,1,5) },
    ],
    kurz: [{ text: "Unterhaltsvorschuss reformieren; Anerkennung der Familienformen; Ganztags-/Ferienbetreuung", idx: r(2,6,0,3,4,7,1,5) }] },

  // ===== Antisemitismus / jüdisches Leben =====
  { aspekt: "Antisemitismus / jüdisches Leben", partei: "AfD",
    lang: [{ text: "Hinweis auf Gefährdung jüdischen Lebens (z. B. keine Kippa in bestimmten Stadtteilen)", idx: r(0,1) }],
    kurz: [{ text: "Hinweis auf Gefährdung jüdischen Lebens", idx: r(0,1) }] },
  { aspekt: "Antisemitismus / jüdisches Leben", partei: "CDU/CSU",
    lang: [{ text: "Gegen Hass und Hetze; antisemitische Straftaten benennen; Holocaustgedenken; muslimische Bildung gegen Antisemitismus", idx: r(0,1,2,3) }],
    kurz: [{ text: "Gegen Hass und Hetze; antisemitische Straftaten benennen; Holocaustgedenken", idx: r(0,1,2,3) }] },
  { aspekt: "Antisemitismus / jüdisches Leben", partei: "GRÜNE",
    lang: [{ text: "Antisemitismus an Schulen durch politische Bildung und Prävention bekämpfen", idx: r(0) }],
    kurz: [{ text: "Antisemitismus an Schulen durch Bildung und Prävention bekämpfen", idx: r(0) }] },
  { aspekt: "Antisemitismus / jüdisches Leben", partei: "LINKE",
    lang: [{ text: "Mahnung vor Hass und Gewalt gegen jüdisches Leben", idx: r(0) }],
    kurz: [{ text: "Mahnung vor Hass und Gewalt gegen jüdisches Leben", idx: r(0) }] },
  { aspekt: "Antisemitismus / jüdisches Leben", partei: "SPD",
    lang: [{ text: "AGG-Schutz auf Diskriminierung wegen Staatsbürgerschaft erweitern; intersektionale Verfolgung benennen", idx: r(0,1) }],
    kurz: [{ text: "AGG-Schutz auf Staatsbürgerschaft erweitern; intersektionale Verfolgung benennen", idx: r(0,1) }] },

  // ===== Ehegattensplitting =====
  { aspekt: "Ehegattensplitting", partei: "AfD",
    lang: [{ text: "Gegen die Abschaffung; Umbau zu einer umfassenden Familienförderung", idx: r(0,1) }],
    kurz: [{ text: "Gegen die Abschaffung; Umbau zu umfassender Familienförderung", idx: r(0,1) }] },
  { aspekt: "Ehegattensplitting", partei: "LINKE",
    lang: [{ text: "Abschaffung gefordert, da es alte Rollenbilder zementiert", idx: r(0) }],
    kurz: [{ text: "Abschaffung gefordert (zementiert alte Rollenbilder)", idx: r(0) }] },

  // ===== Familienförderung =====
  { aspekt: "Familienförderung", partei: "AfD",
    lang: [
      { text: "Wahlfreiheit bei der Betreuung; gegen staatliche Ganztagsbetreuung, Eigenbetreuung gleich fördern", idx: r(0,1,6,16,17,23,25,29) },
      { text: "Traditionelle Familie/Zwei-Eltern-Modell, Geburtenrate als demografische Antwort", idx: r(5,10,18,21,30) },
      { text: "Elterngeld auf drei Jahre ausweiten; steuerliche Entlastung von Familien (Ehegattensplitting-Umbau, Freibeträge)", idx: r(7,24,12,19,20,28) },
      { text: "Kindergeld antraglos kritisch gesehen / Indexierung für Auslandskinder; Mutterschutz für Selbstständige", idx: r(11,26,31,9,14,22) },
      { text: "Vaterschaftsmissbrauch (DNA-Tests); gegen Frauen-an-den-Herd-Vorwurf; Geburtskliniken; Mittelallokation; allgemeine Förderung", idx: r(3,4,2,8,27,13,15) },
    ],
    kurz: [
      { text: "Wahlfreiheit bei der Betreuung gegen staatliche Ganztagsbetreuung; traditionelles Familienmodell, Geburtenrate", idx: r(0,1,6,16,17,23,25,29,5,10,18,21,30) },
      { text: "Elterngeld auf drei Jahre ausweiten; steuerliche Entlastung; Mutterschutz für Selbstständige", idx: r(7,24,12,19,20,28,9,14,22) },
      { text: "Kindergeld antraglos kritisch/Indexierung; Vaterschaftsmissbrauch; Einzelpunkte", idx: r(11,26,31,3,4,2,8,27,13,15) },
    ] },
  { aspekt: "Familienförderung", partei: "CDU/CSU",
    lang: [
      { text: "Elterngeld weiterentwickeln und Wahlfreiheit der Familien stärken", idx: r(2,7,8,10,11,20,23) },
      { text: "Antragsloses Kindergeld als Vereinfachung (Mutter als Regelempfängerin); Kindergelderhöhung", idx: r(3,6,14,26) },
      { text: "Ganztagsbetreuung/Rechtsanspruch zur Vereinbarkeit von Familie und Beruf; frühe Hilfen", idx: r(4,5,9,13,17,22,25) },
      { text: "Mütterrente; Mutterschutz für Selbstständige; Abstammungsrecht; Lebensschutz; elterliche Verantwortung nicht ersetzen; Kritik an AfD-Vorschlägen", idx: r(12,18,1,0,15,21,16,19,24) },
    ],
    kurz: [
      { text: "Elterngeld weiterentwickeln, Wahlfreiheit stärken; antragsloses Kindergeld; Kindergelderhöhung", idx: r(2,7,8,10,11,20,23,3,6,14,26) },
      { text: "Ganztagsbetreuung/Rechtsanspruch zur Vereinbarkeit; frühe Hilfen", idx: r(4,5,9,13,17,22,25) },
      { text: "Mütterrente; Mutterschutz für Selbstständige; Lebensschutz; Kritik an AfD-Vorschlägen", idx: r(12,18,1,0,15,21,16,19,24) },
    ] },
  { aspekt: "Familienförderung", partei: "GRÜNE",
    lang: [
      { text: "Alle Familienformen fördern (gegen Beschränkung auf bestimmte Modelle)", idx: r(2,5) },
      { text: "Ganztagsbetreuung und strukturelle Lösungen (Mieten, Kita, Steuersystem); antragsloses Kindergeld", idx: r(4,7,0,6,1,10) },
      { text: "Gegen Kinderarmut (erhöhtes Kindergeld, Mittagessen); Familienstartzeit; Mutterschutz für Selbstständige; Elterngeld", idx: r(8,3,9,11) },
    ],
    kurz: [
      { text: "Alle Familienformen fördern; Ganztagsbetreuung und strukturelle Lösungen; antragsloses Kindergeld", idx: r(2,5,4,7,0,6,1,10) },
      { text: "Gegen Kinderarmut; Familienstartzeit; Mutterschutz für Selbstständige", idx: r(8,3,9,11) },
    ] },
  { aspekt: "Familienförderung", partei: "LINKE",
    lang: [
      { text: "Gegen Kürzungen bei Elterngeld/Kindergeld; Kindergrundsicherung statt Freibetrag", idx: r(3,9,12,13) },
      { text: "Ganztagsausbau; Familienstartzeit (28 Tage); Unterhaltsvorschuss ausbauen", idx: r(1,5,2,6) },
      { text: "Materielle Unterstützung (Wohnen, Betreuung, Löhne) statt Bevölkerungspolitik; Familiennachzug; Mutterschutz Selbstständige; Bahn-Familienreservierung; Gewaltschutz vor Familiengericht", idx: r(8,10,0,4,7,11) },
    ],
    kurz: [
      { text: "Gegen Kürzungen bei Elterngeld/Kindergeld, Kindergrundsicherung; Ganztagsausbau; Familienstartzeit", idx: r(3,9,12,13,1,5,2,6) },
      { text: "Materielle Unterstützung statt Bevölkerungspolitik; Familiennachzug; weitere Punkte", idx: r(8,10,0,4,7,11) },
    ] },
  { aspekt: "Familienförderung", partei: "SPD",
    lang: [
      { text: "Ganztagsbetreuung/Rechtsanspruch zur Vereinbarkeit von Familie und Beruf", idx: r(0,6,9,13,14,16,21) },
      { text: "Antragsloses Kindergeld erhöhen; Familienstartzeit und Väterbeteiligung (Elterngeldreform)", idx: r(2,7,8,5,18,19) },
      { text: "Vielfalt der Familienformen statt traditionellem Bild; Kritik an AfD; Familienzusammenführung; Mutterschutz Selbstständige; umfassende Förderung", idx: r(3,11,1,15,20,4,10,12,17) },
    ],
    kurz: [
      { text: "Ganztagsbetreuung/Rechtsanspruch; antragsloses Kindergeld erhöhen; Familienstartzeit und Väterbeteiligung", idx: r(0,6,9,13,14,16,21,2,7,8,5,18,19) },
      { text: "Vielfalt der Familienformen statt traditionellem Bild; Kritik an AfD; weitere Punkte", idx: r(3,11,1,15,20,4,10,12,17) },
    ] },

  // ===== Islam / Religionsgemeinschaften =====
  { aspekt: "Islam / Religionsgemeinschaften", partei: "AfD",
    lang: [
      { text: "Gegen Kopftuch im öffentlichen Dienst und an Schulen; Kritik am islamischen Frauenbild", idx: r(0,1) },
      { text: "Verknüpfung des Islam mit Gewalt, Ehrenmorden und Queerfeindlichkeit", idx: r(2,3,4) },
    ],
    kurz: [{ text: "Gegen Kopftuch und islamisches Frauenbild; Verknüpfung des Islam mit Gewalt/Ehrenmorden", idx: r(0,1,2,3,4) }] },
  { aspekt: "Islam / Religionsgemeinschaften", partei: "CDU/CSU",
    lang: [
      { text: "Säkularer Staat; gegen staatliche Förderung des Islam (Staat schützt Religionsausübung, fördert nicht)", idx: r(1,2,4) },
      { text: "Schutz vor Hass; muslimische Bildung gegen Antisemitismus; kritische, respektvolle Auseinandersetzung mit dem Islam", idx: r(0,3) },
    ],
    kurz: [{ text: "Säkularer Staat, gegen staatliche Islamförderung; Schutz vor Hass und kritische Auseinandersetzung", idx: r(1,2,4,0,3) }] },
  { aspekt: "Islam / Religionsgemeinschaften", partei: "GRÜNE",
    lang: [{ text: "Gegen Muslimfeindlichkeit/antimuslimischen Rassismus; Anerkennung islamischer Religionsgemeinschaften; Bildung", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen Muslimfeindlichkeit; Anerkennung islamischer Religionsgemeinschaften", idx: r(0,1,2) }] },
  { aspekt: "Islam / Religionsgemeinschaften", partei: "LINKE",
    lang: [{ text: "Gegen antimuslimischen Rassismus; gegen kirchliches Sonderarbeitsrecht", idx: r(0,1) }],
    kurz: [{ text: "Gegen antimuslimischen Rassismus; gegen kirchliches Sonderarbeitsrecht", idx: r(0,1) }] },
  { aspekt: "Islam / Religionsgemeinschaften", partei: "SPD",
    lang: [{ text: "Gegen Muslimfeindlichkeit; Teilhabe und interreligiöser Dialog ohne Vermischung mit Sicherheitsfragen", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen Muslimfeindlichkeit; Teilhabe und interreligiöser Dialog", idx: r(0,1,2) }] },

  // ===== Kinderrechte ins Grundgesetz =====
  { aspekt: "Kinderrechte ins Grundgesetz", partei: "AfD",
    lang: [
      { text: "Kinder vor Ideologisierung und Geschlechtsidentitäts-Thematik schützen", idx: r(1,3) },
      { text: "Vaterschaftsmissbrauch; Schutz ungeborenen Lebens neben Selbstbestimmung", idx: r(0,2) },
    ],
    kurz: [{ text: "Kinder vor Ideologisierung schützen; Schutz ungeborenen Lebens; Vaterschaftsmissbrauch", idx: r(1,3,0,2) }] },
  { aspekt: "Kinderrechte ins Grundgesetz", partei: "CDU/CSU",
    lang: [
      { text: "Kindeswohl und Schutz vor Gewalt (häusliche Gewalt im Sorge-/Umgangsrecht, Kinderehen, Missbrauch)", idx: r(0,1,2,4,6,7) },
      { text: "Abstammungsrecht: Rechte leiblicher Väter und Recht auf Kenntnis der Abstammung", idx: r(5,9) },
      { text: "Schutz ungeborenen Lebens, Abwägung mit dem Selbstbestimmungsrecht der Frau", idx: r(3,8) },
    ],
    kurz: [
      { text: "Kindeswohl und Schutz vor Gewalt; Abstammungsrecht (leibliche Väter, Kenntnis)", idx: r(0,1,2,4,6,7,5,9) },
      { text: "Schutz ungeborenen Lebens, Abwägung mit Selbstbestimmung", idx: r(3,8) },
    ] },
  { aspekt: "Kinderrechte ins Grundgesetz", partei: "GRÜNE",
    lang: [
      { text: "Kindeswohl ins Zentrum stellen; gegen Kinderarmut, Chancengleichheit für alle Kinder", idx: r(0,1,2,3) },
      { text: "Vaterschaftsanfechtung am Kindeswohl orientieren (BVerfG-Urteil umsetzen)", idx: r(4) },
    ],
    kurz: [{ text: "Kindeswohl ins Zentrum, gegen Kinderarmut, Chancengleichheit; Vaterschaftsanfechtung am Kindeswohl orientieren", idx: r(0,1,2,3,4) }] },
  { aspekt: "Kinderrechte ins Grundgesetz", partei: "LINKE",
    lang: [
      { text: "Bessere Unterstützung von Kindern (Schulassistenz, psychologische Versorgung, binationale Familien)", idx: r(0,1,2) },
      { text: "Gegen Geschlechtswahl-Zwang; Kritik, dass der Entwurf das Kindeswohl hinter Vaterinteressen stellt", idx: r(3,4) },
    ],
    kurz: [{ text: "Bessere Unterstützung von Kindern (Schulassistenz, Versorgung); Kritik am Vorrang von Vaterinteressen vor Kindeswohl", idx: r(0,1,2,3,4) }] },
  { aspekt: "Kinderrechte ins Grundgesetz", partei: "SPD",
    lang: [
      { text: "Kinderrechte im Grundgesetz verankern; Ja-heißt-Ja-Prinzip auch für Jugendliche", idx: r(2,0) },
      { text: "Hochwertige Ganztagsbetreuung als Rahmenbedingung für gutes Aufwachsen", idx: r(1) },
    ],
    kurz: [{ text: "Kinderrechte im Grundgesetz verankern; Ja-heißt-Ja auch für Jugendliche; Ganztagsbetreuung", idx: r(2,0,1) }] },

  // ===== Menschen mit Behinderung =====
  { aspekt: "Menschen mit Behinderung", partei: "AfD",
    lang: [{ text: "Kritik an BGG-/Teilhabe-Entwürfen als vage und unpraktisch (Assistenzhunde, ausgehöhlte Barrierefreiheit); Bürokratieabbau", idx: r(0,1,2) }],
    kurz: [{ text: "Kritik an BGG-/Teilhabe-Entwürfen als vage und unpraktisch; Bürokratieabbau", idx: r(0,1,2) }] },
  { aspekt: "Menschen mit Behinderung", partei: "CDU/CSU",
    lang: [
      { text: "Barrierefreiheit/BGG-Reform pragmatisch und wirtschaftlich machbar (flexible, zumutbare Lösungen)", idx: r(5,6,8,9) },
      { text: "Bundesteilhabegesetz als Paradigmenwechsel; Effizienzsteigerung statt Leistungsabbau", idx: r(3,7) },
      { text: "Digitale Teilhabe; Schutz vor Hass; Pooling-Modell; NS-Opfer", idx: r(0,1,2,4) },
    ],
    kurz: [
      { text: "Barrierefreiheit/BGG-Reform pragmatisch und wirtschaftlich machbar; BTHG-Paradigmenwechsel, Effizienz statt Abbau", idx: r(5,6,8,9,3,7) },
      { text: "Digitale Teilhabe; Schutz vor Hass; Pooling-Modell", idx: r(0,1,2,4) },
    ] },
  { aspekt: "Menschen mit Behinderung", partei: "GRÜNE",
    lang: [
      { text: "Verbindliche Barrierefreiheit mit Fristen, auch in der Privatwirtschaft", idx: r(3,5) },
      { text: "Bundesteilhabegesetz personenzentriert weiterentwickeln (Teilhabe statt Heimunterbringung)", idx: r(6) },
      { text: "Frauen mit Behinderung im Gewaltschutz; Antidiskriminierung im Gesundheitssystem; Demokratiebildung", idx: r(1,2,4,0) },
    ],
    kurz: [
      { text: "Verbindliche Barrierefreiheit (auch privat); BTHG personenzentriert weiterentwickeln", idx: r(3,5,6) },
      { text: "Frauen mit Behinderung im Gewaltschutz; Antidiskriminierung im Gesundheitssystem", idx: r(1,2,4,0) },
    ] },
  { aspekt: "Menschen mit Behinderung", partei: "LINKE",
    lang: [
      { text: "Gegen Streichung der Schulassistenz; inklusive Kinder- und Jugendhilfe", idx: r(0,2) },
      { text: "BGG/BTHG unzureichend; vollumfängliche Barrierefreiheit als Menschenrecht, Ende der Vermögensanrechnung", idx: r(1,3,4) },
    ],
    kurz: [{ text: "Gegen Streichung der Schulassistenz; vollumfängliche Barrierefreiheit als Menschenrecht", idx: r(0,2,1,3,4) }] },
  { aspekt: "Menschen mit Behinderung", partei: "SPD",
    lang: [{ text: "Barrierefreiheit verbindlich auch im privaten Sektor; BTHG weiterentwickeln (Vermögensprüfung abschaffen, Personenzentrierung)", idx: r(0,1,2,3) }],
    kurz: [{ text: "Barrierefreiheit verbindlich (auch privat); BTHG weiterentwickeln, Vermögensprüfung abschaffen", idx: r(0,1,2,3) }] },

  // ===== Parität / Frauenrechte =====
  { aspekt: "Parität / Frauenrechte", partei: "AfD",
    lang: [
      { text: "Gewalt gegen Frauen v. a. mit Migration und Ehrenmorden verknüpft; statistische Erfassung gefordert", idx: r(0,2,5,6,10,12,13) },
      { text: "Verteidigung der eigenen Frauenpolitik gegen Vorwürfe der Rückwärtsgewandtheit", idx: r(4,8,14,15) },
      { text: "Selbstständige Frauen im Steuersystem/Mutterschutz; Betonung der biologischen Realität", idx: r(1,9) },
      { text: "Wahlfreiheit gegen wirtschaftlichen Arbeitszwang; gegen Deepfake-Gesetz als Überregulierung", idx: r(3,11,7) },
    ],
    kurz: [
      { text: "Gewalt gegen Frauen v. a. mit Migration/Ehrenmorden verknüpft; Verteidigung der eigenen Frauenpolitik", idx: r(0,2,5,6,10,12,13,4,8,14,15) },
      { text: "Selbstständige Frauen (Mutterschutz); Wahlfreiheit gegen Arbeitszwang; gegen Deepfake-Gesetz", idx: r(1,9,3,11,7) },
    ] },
  { aspekt: "Parität / Frauenrechte", partei: "CDU/CSU",
    lang: [
      { text: "Schutz von Frauen vor Gewalt (Gewaltschutzgesetz, Fußfessel, Frauenhäuser, Istanbul-Konvention, Sexkaufverbot)", idx: r(3,5,6,8,14,15,17,24,25) },
      { text: "Deepfakes/digitale Gewalt strafrechtlich verfolgen", idx: r(4,11,19) },
      { text: "Modernes Frauenbild mit Wahlfreiheit; Partnerschaftlichkeit und Vätereinbeziehung", idx: r(7,16,0,10) },
      { text: "Frauen in Führung/Selbstständigkeit; Selbstbestimmung beim Abbruch; Geschlechterquote auf Listen; gegen AfD-Rückwärtsgewandtheit und Ehrenmord-Sonderstatistik; Müttersterblichkeit", idx: r(9,12,18,20,21,2,22,23,13,1) },
    ],
    kurz: [
      { text: "Schutz von Frauen vor Gewalt (Gewaltschutzgesetz, Fußfessel, Frauenhäuser, Istanbul, Sexkaufverbot); Deepfakes verfolgen", idx: r(3,5,6,8,14,15,17,24,25,4,11,19) },
      { text: "Modernes Frauenbild mit Wahlfreiheit, Partnerschaftlichkeit; Frauen in Führung; Selbstbestimmung beim Abbruch; gegen AfD", idx: r(7,16,0,10,9,12,18,20,21,2,22,23,13,1) },
    ] },
  { aspekt: "Parität / Frauenrechte", partei: "GRÜNE",
    lang: [
      { text: "Gewalt gegen Frauen als strukturelles Problem; Femizide bekämpfen, Istanbul-Konvention umsetzen; gegen Migrations-Framing", idx: r(3,4,5,16,21,22,12,17) },
      { text: "Deepfakes/konsensbasiertes Sexualstrafrecht (Nur Ja heißt Ja); Schwangerschaftsabbruch als Frauenrecht", idx: r(9,13,15) },
      { text: "Frauenquote im Parlament (Parteienfinanzierung); Kritik am AfD-Frauenbild; feministische Außenpolitik", idx: r(11,23,6,7,2) },
      { text: "Care-Arbeit/Gleichstellung (Familienstartzeit, Elterngeld, Mutterschutz Selbstständige); Rollenbilder; strukturelle Barrieren; Alleinerziehende", idx: r(8,19,20,18,1,10,0,14) },
    ],
    kurz: [
      { text: "Gewalt gegen Frauen strukturell bekämpfen (Femizide, Istanbul); gegen Migrations-Framing; konsensbasiertes Sexualstrafrecht und Deepfakes", idx: r(3,4,5,16,21,22,12,17,9,13,15) },
      { text: "Frauenquote im Parlament; Care-Arbeit/Gleichstellung; Kritik am AfD-Frauenbild", idx: r(11,23,6,7,2,8,19,20,18,1,10,0,14) },
    ] },
  { aspekt: "Parität / Frauenrechte", partei: "LINKE",
    lang: [
      { text: "Umfassender Gewaltschutz für Frauen (Istanbul-Konvention, Frauenhäuser, Täterarbeit); gegen Instrumentalisierung für die Migrationsdebatte", idx: r(1,4,7,8,9,14,15,16,18,20) },
      { text: "Konsensbasiertes Sexualstrafrecht (Ja heißt Ja); Selbstbestimmung über den Körper und beim Schwangerschaftsabbruch", idx: r(2,12,3,10,11,21) },
      { text: "Faire Verteilung der Sorgearbeit, gegen Rollenbilder; Lohngleichheit; Selbstständige; Elterngeld; geflüchtete Frauen", idx: r(0,6,19,13,5,17,22) },
    ],
    kurz: [
      { text: "Umfassender Gewaltschutz für Frauen (Istanbul); gegen Instrumentalisierung für die Migrationsdebatte; konsensbasiertes Sexualstrafrecht", idx: r(1,4,7,8,9,14,15,16,18,20,2,12) },
      { text: "Selbstbestimmung über den Körper (Abbruch); faire Sorgearbeit, Lohngleichheit; geflüchtete Frauen", idx: r(3,10,11,21,0,6,19,13,5,17,22) },
    ] },
  { aspekt: "Parität / Frauenrechte", partei: "SPD",
    lang: [
      { text: "Schutz von Frauen vor Gewalt (Fußfessel, Frauenhäuser, Istanbul-Konvention, Täterarbeit); gegen Instrumentalisierung für Migration", idx: r(4,5,17,20,28,29,19) },
      { text: "Konsensbasiertes Sexualstrafrecht (Ja heißt Ja); Deepfakes/digitale Gewalt verfolgen", idx: r(6,10,11,22) },
      { text: "Selbstbestimmung gegen konservative Modelle und AfD; Wahlfreiheit für Mütter", idx: r(1,2,3,12,14,27) },
      { text: "Gleichstellung und faire Sorgearbeit (Väterbeteiligung, Rollenbilder); Mutterschutz Selbstständige; AGG-Erweiterung; Repräsentation; Frauenrechte als Menschenrechte; Wahlfreiheit", idx: r(8,15,16,24,25,26,30,13,18,23,21,0,9,7) },
    ],
    kurz: [
      { text: "Schutz von Frauen vor Gewalt (Fußfessel, Frauenhäuser, Istanbul); konsensbasiertes Sexualstrafrecht und Deepfakes", idx: r(4,5,17,20,28,29,19,6,10,11,22) },
      { text: "Selbstbestimmung gegen konservative Modelle; Gleichstellung und faire Sorgearbeit; Mutterschutz Selbstständige", idx: r(1,2,3,12,14,27,8,15,16,24,25,26,30,13,18,23,21,0,9,7) },
    ] },

  // ===== Queere Gleichstellung =====
  { aspekt: "Queere Gleichstellung", partei: "AfD",
    lang: [
      { text: "Ablehnung der Förderung queerer Gleichstellung (Aktionsplan, Regenbogenflagge, Organisationen)", idx: r(0,3,8,9,10) },
      { text: "Gegen queere Pädagogik an Schulen; gegen Verankerung sexueller Identität im Grundgesetz", idx: r(1,5,4,7) },
      { text: "Gegen NS-Entschuldigung und Maßnahmen gegen queerfeindliche Hasskriminalität; Gewalt gegen Queere als Migrations-/Links-Problem", idx: r(2,6,11) },
    ],
    kurz: [
      { text: "Ablehnung der Förderung queerer Gleichstellung; gegen queere Pädagogik und GG-Verankerung", idx: r(0,3,8,9,10,1,5,4,7) },
      { text: "Gegen Maßnahmen gegen queerfeindliche Hasskriminalität; Gewalt gegen Queere als Migrationsproblem", idx: r(2,6,11) },
    ] },
  { aspekt: "Queere Gleichstellung", partei: "CDU/CSU",
    lang: [
      { text: "Schutz vor Diskriminierung, aber GG-Änderung als unnötig (verfassungsrechtlicher Schutz besteht)", idx: r(0,2,3,5,12,14) },
      { text: "Schutz und Anerkennung queeren Lebens; Justiz besser ausstatten statt reiner Symbolpolitik; CSD-Schutz", idx: r(7,13,1,4) },
      { text: "NS-Verfolgung anerkennen; gegen wiederholte Anträge; Vielfalt jenseits der Ehe; gegen Offenlegung von Schutzprojekten", idx: r(8,6,10,11,9) },
    ],
    kurz: [
      { text: "Schutz vor Diskriminierung, aber GG-Änderung unnötig; Justiz besser ausstatten statt Symbolpolitik", idx: r(0,2,3,5,12,14,7,13,1,4) },
      { text: "NS-Verfolgung anerkennen; Vielfalt jenseits der Ehe; gegen Offenlegung von Schutzprojekten", idx: r(8,6,10,11,9) },
    ] },
  { aspekt: "Queere Gleichstellung", partei: "GRÜNE",
    lang: [
      { text: "Diskriminierungsschutz für sexuelle Identität in Artikel 3 Grundgesetz verankern", idx: r(3,14,15,17) },
      { text: "Abstammungsrecht reformieren: Regenbogenfamilien und lesbische Paare gleichstellen", idx: r(5,9,10,12,13,19) },
      { text: "Schutz vor Gewalt und Diskriminierung; Selbstbestimmungsgesetz; gegen Antitrans-Narrative; Demokratiebildung; Kritik an AfD", idx: r(7,8,11,4,0,16,18,2,6,1) },
    ],
    kurz: [
      { text: "Sexuelle Identität in Artikel 3 GG verankern; Abstammungsrecht für Regenbogenfamilien reformieren", idx: r(3,14,15,17,5,9,10,12,13,19) },
      { text: "Schutz vor Gewalt/Diskriminierung; Selbstbestimmungsgesetz; gegen Antitrans-Narrative; Kritik an AfD", idx: r(7,8,11,4,0,16,18,2,6,1) },
    ] },
  { aspekt: "Queere Gleichstellung", partei: "LINKE",
    lang: [
      { text: "Geschlechtliche Identität im Grundgesetz verankern; umfassende Gleichstellung", idx: r(0,10,11) },
      { text: "Schutz vor Gewalt und Diskriminierung (Aktionsplan Queer leben); queere Familien und Kinderwunsch anerkennen", idx: r(2,4,6,3,8) },
      { text: "Verteidigung gegen AfD-Angriffe; NS-Gedenken; gegen Rückzug von Flaggen/CSDs; Kritik an traditioneller Kernfamilie", idx: r(5,9,1,7,12) },
    ],
    kurz: [
      { text: "Geschlechtliche Identität im GG verankern; Schutz vor Gewalt/Diskriminierung; queere Familien anerkennen", idx: r(0,10,11,2,4,6,3,8) },
      { text: "Verteidigung gegen AfD-Angriffe; NS-Gedenken; gegen Rückzug von Flaggen/CSDs", idx: r(5,9,1,7,12) },
    ] },
  { aspekt: "Queere Gleichstellung", partei: "SPD",
    lang: [
      { text: "Verteidigung queeren Lebens gegen AfD-Anfeindungen; Schutz von CSDs", idx: r(1,2,3,5,8) },
      { text: "Diskriminierungsschutz im AGG/Grundgesetz; Reform des Abstammungsrechts", idx: r(0,7,10) },
      { text: "Gegen Hasskriminalität, staatliche Unterstützung und Sichtbarkeit; NS-Opfer; Vielfalt der Familienformen", idx: r(4,11,12,6,9) },
    ],
    kurz: [
      { text: "Verteidigung queeren Lebens gegen AfD; CSD-Schutz; Diskriminierungsschutz im AGG/GG; Abstammungsrecht", idx: r(1,2,3,5,8,0,7,10) },
      { text: "Gegen Hasskriminalität, staatliche Unterstützung und Sichtbarkeit; NS-Opfer", idx: r(4,11,12,6,9) },
    ] },

  // ===== Selbstbestimmungsgesetz (trans/inter) =====
  { aspekt: "Selbstbestimmungsgesetz (trans/inter)", partei: "AfD",
    lang: [
      { text: "Fundamentale Ablehnung des Selbstbestimmungsgesetzes als Ideologie und Bedrohung des Frauenschutzes", idx: r(0,2,4,5,6) },
      { text: "Gegen eine Grundgesetzänderung zur geschlechtlichen Identität", idx: r(1,3) },
    ],
    kurz: [{ text: "Fundamentale Ablehnung des Selbstbestimmungsgesetzes; gegen GG-Verankerung geschlechtlicher Identität", idx: r(0,2,4,5,6,1,3) }] },
  { aspekt: "Selbstbestimmungsgesetz (trans/inter)", partei: "CDU/CSU",
    lang: [
      { text: "Evaluation und Nachbesserung (Geschlechtseintrag, Schutz vulnerabler Gruppen); Selbstbestimmung mit Sicherheit", idx: r(0) },
      { text: "Verfassungsrechtlicher Schutz bereits ausreichend, GG-Änderung nicht erforderlich", idx: r(1) },
    ],
    kurz: [{ text: "Evaluation und Nachbesserung des Gesetzes; GG-Änderung nicht erforderlich", idx: r(0,1) }] },
  { aspekt: "Selbstbestimmungsgesetz (trans/inter)", partei: "GRÜNE",
    lang: [
      { text: "Verteidigung des Selbstbestimmungsgesetzes gegen Überprüfung/Abschaffung", idx: r(0,1,2,4) },
      { text: "Entschädigung der Opfer des Transsexuellengesetzes; gegen Antitrans-Maßnahmen", idx: r(3,5) },
    ],
    kurz: [{ text: "Verteidigung des Selbstbestimmungsgesetzes gegen Abschaffung; Entschädigung der TSG-Opfer", idx: r(0,1,2,4,3,5) }] },
  { aspekt: "Selbstbestimmungsgesetz (trans/inter)", partei: "LINKE",
    lang: [{ text: "Verteidigung des Selbstbestimmungsgesetzes gegen konservative/AfD-Angriffe; Kostenübernahme für geschlechtsangleichende Maßnahmen", idx: r(0,2,1,3) }],
    kurz: [{ text: "Verteidigung des Selbstbestimmungsgesetzes; Kostenübernahme für geschlechtsangleichende Maßnahmen", idx: r(0,2,1,3) }] },
  { aspekt: "Selbstbestimmungsgesetz (trans/inter)", partei: "SPD",
    lang: [
      { text: "Befürwortung und Verteidigung des Selbstbestimmungsgesetzes als Ersatz für das verfassungswidrige Transsexuellengesetz", idx: r(0,1,2,3) },
      { text: "Kritik am Missbrauchspotenzial in Einzelfällen", idx: r(4) },
    ],
    kurz: [{ text: "Befürwortung und Verteidigung des Selbstbestimmungsgesetzes; Kritik am Missbrauchspotenzial in Einzelfällen", idx: r(0,1,2,3,4) }] },

  // ===== Teilhabe von Migrant:innen =====
  { aspekt: "Teilhabe von Migrant:innen", partei: "AfD",
    lang: [
      { text: "Ablehnung von Zuwanderung; Forderung nach Integration/Spracherwerb; Migration mit Kriminalität und Gewalt verknüpft", idx: r(0,2,3,5,7,8) },
      { text: "Institutionellen Rassismus leugnen; Vaterschaftsmissbrauch; Abschiebung Krimineller (gegen pauschale Remigration)", idx: r(1,6,4) },
    ],
    kurz: [
      { text: "Ablehnung von Zuwanderung, Migration mit Kriminalität/Gewalt verknüpft; Integration/Spracherwerb gefordert", idx: r(0,2,3,5,7,8) },
      { text: "Institutionellen Rassismus leugnen; Vaterschaftsmissbrauch; Abschiebung Krimineller", idx: r(1,6,4) },
    ] },
  { aspekt: "Teilhabe von Migrant:innen", partei: "CDU/CSU",
    lang: [{ text: "Berufliche Integration von Frauen mit Migrationshintergrund; Schutz vor Hass; inklusive Familienpolitik unabhängig von der Staatsangehörigkeit", idx: r(0,1,2) }],
    kurz: [{ text: "Berufliche Integration; Schutz vor Hass; Familienpolitik unabhängig von der Staatsangehörigkeit", idx: r(0,1,2) }] },
  { aspekt: "Teilhabe von Migrant:innen", partei: "GRÜNE",
    lang: [
      { text: "Gegen Diskriminierung und Rassismus in Behörden und im öffentlichen Raum", idx: r(1,3) },
      { text: "Staatsbürgerschaft als Teilhabe und Chancengleichheit; muslimische Teilhabe; gegen Remigration", idx: r(2,4,0) },
    ],
    kurz: [{ text: "Gegen Diskriminierung/Rassismus in Behörden; Staatsbürgerschaft als Teilhabe; gegen Remigration", idx: r(1,3,2,4,0) }] },
  { aspekt: "Teilhabe von Migrant:innen", partei: "LINKE",
    lang: [
      { text: "Gegen Diskriminierung und Rassismus (Behörden, Job-, Wohnungsmarkt); für gleichberechtigte Teilhabe", idx: r(2,3,5,6) },
      { text: "Gegen AfD-Reduktion von Gewalt auf Herkunft; gegen Vaterschafts-Generalverdacht; geflüchtete Frauen im Gewaltschutz; Wahlrecht/Einbürgerung", idx: r(0,1,4,7) },
    ],
    kurz: [
      { text: "Gegen Diskriminierung/Rassismus (Behörden, Wohnungsmarkt); gleichberechtigte Teilhabe", idx: r(2,3,5,6) },
      { text: "Gegen Herkunfts-Reduktion von Gewalt; geflüchtete Frauen im Gewaltschutz; Wahlrecht/Einbürgerung", idx: r(0,1,4,7) },
    ] },
  { aspekt: "Teilhabe von Migrant:innen", partei: "SPD",
    lang: [
      { text: "Teilhabe von Menschen mit Migrationsgeschichte; gegen Remigration und Herkunfts-Framing von Gewalt", idx: r(0,3,7,9) },
      { text: "Erleichterter Familiennachzug; muslimische Teilhabe; Migrant:innen als Beitragszahler", idx: r(2,1,6,4) },
      { text: "Gegen Diskriminierung bei Familienleistungen; AGG-Lücke bei Staatsbürgerschaft", idx: r(5,8) },
    ],
    kurz: [
      { text: "Teilhabe von Menschen mit Migrationsgeschichte, gegen Remigration; Familiennachzug; muslimische Teilhabe", idx: r(0,3,7,9,2,1,6,4) },
      { text: "Gegen Diskriminierung bei Familienleistungen; AGG-Lücke bei Staatsbürgerschaft", idx: r(5,8) },
    ] },

  // ===== Verantwortungsgemeinschaft (jenseits Ehe) =====
  { aspekt: "Verantwortungsgemeinschaft (jenseits Ehe)", partei: "AfD",
    lang: [{ text: "Ablehnung von Mehrelternschaft; Festhalten am Zwei-Eltern-Prinzip als Norm", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Mehrelternschaft; Zwei-Eltern-Prinzip als Norm", idx: r(0) }] },
  { aspekt: "Verantwortungsgemeinschaft (jenseits Ehe)", partei: "CDU/CSU",
    lang: [{ text: "Rechtlicher Schutz für Verantwortungsgemeinschaften jenseits biologischer Verwandtschaft, mit Missbrauchsbekämpfung", idx: r(0) }],
    kurz: [{ text: "Rechtlicher Schutz für Verantwortungsgemeinschaften, mit Missbrauchsbekämpfung", idx: r(0) }] },
  { aspekt: "Verantwortungsgemeinschaft (jenseits Ehe)", partei: "GRÜNE",
    lang: [{ text: "Alternative Familienkonstellationen mit mehr als zwei Elternteilen; Sorgearbeit unabhängig vom Ehestatus", idx: r(0,1) }],
    kurz: [{ text: "Mehrelternschaft und Sorgearbeit unabhängig vom Ehestatus", idx: r(0,1) }] },
  { aspekt: "Verantwortungsgemeinschaft (jenseits Ehe)", partei: "LINKE",
    lang: [{ text: "Anerkennung vielfältiger Familienformen und Mehrelternschaft jenseits von Ehe und Biologie", idx: r(0,1,2) }],
    kurz: [{ text: "Anerkennung vielfältiger Familienformen und Mehrelternschaft jenseits der Ehe", idx: r(0,1,2) }] },
  { aspekt: "Verantwortungsgemeinschaft (jenseits Ehe)", partei: "SPD",
    lang: [{ text: "Gleichbehandlung gleichgeschlechtlicher Ehepartner bei der Elternschaft; gegen das enge AfD-Familienbild", idx: r(0,1) }],
    kurz: [{ text: "Gleichbehandlung gleichgeschlechtlicher Ehepartner; gegen das enge AfD-Familienbild", idx: r(0,1) }] },
];

applySynthese("Gesellschaftspolitik, soziale Gruppen", CELLS);
