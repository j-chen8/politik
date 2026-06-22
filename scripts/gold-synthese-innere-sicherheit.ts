/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Innere Sicherheit" (55 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Ausländische Straftäter =====
  { aspekt: "Ausländische Straftäter", partei: "AfD",
    lang: [
      { text: "Konsequente Abschiebung krimineller und ausreisepflichtiger Ausländer als Kernansatz", idx: r(5,6,8,9,10,13,14,16,18,19) },
      { text: "Migration als Hauptursache von Kriminalität (Remigration)", idx: r(0,1,2,3,4,15) },
      { text: "Migrationshintergrund/Mehrstaatigkeit transparent in der Kriminalstatistik ausweisen", idx: r(7,11,12,17) },
    ],
    kurz: [
      { text: "Konsequente Abschiebung krimineller Ausländer; Migration als Hauptursache von Kriminalität", idx: r(5,6,8,9,10,13,14,16,18,19,0,1,2,3,4,15) },
      { text: "Migrationshintergrund transparent in der Kriminalstatistik ausweisen", idx: r(7,11,12,17) },
    ] },
  { aspekt: "Ausländische Straftäter", partei: "CDU/CSU",
    lang: [{ text: "Überrepräsentation datenbasiert anerkennen; Abschiebung straffällig gewordener Migranten", idx: r(0,1,2) }],
    kurz: [{ text: "Überrepräsentation datenbasiert anerkennen; Abschiebung straffälliger Migranten", idx: r(0,1,2) }] },
  { aspekt: "Ausländische Straftäter", partei: "GRÜNE",
    lang: [
      { text: "Gegen Instrumentalisierung der Kriminalstatistik und völkisches Denken", idx: r(0,1) },
      { text: "Bedenken gegen Abschiebehaft-Regelungen (rechtswidrige Haftanordnungen)", idx: r(2) },
    ],
    kurz: [{ text: "Gegen Instrumentalisierung der Kriminalstatistik; Bedenken gegen Abschiebehaft-Regelungen", idx: r(0,1,2) }] },
  { aspekt: "Ausländische Straftäter", partei: "LINKE",
    lang: [{ text: "Gegen Stereotypisierung von Migranten als Kriminelle und gegen Deportationsrhetorik (Lebensumstände als Ursache)", idx: r(0,1) }],
    kurz: [{ text: "Gegen Stereotypisierung von Migranten als Kriminelle und Deportationsrhetorik", idx: r(0,1) }] },
  { aspekt: "Ausländische Straftäter", partei: "SPD",
    lang: [{ text: "Gegen AfD-Framing von Migration als Kriminalisierung; sachliche, nicht rassifizierende Beurteilung (Lebensumstände)", idx: r(0,1) }],
    kurz: [{ text: "Gegen AfD-Framing; sachliche, nicht rassifizierende Beurteilung (Lebensumstände)", idx: r(0,1) }] },

  // ===== Extremismusbekämpfung =====
  { aspekt: "Extremismusbekämpfung", partei: "AfD",
    lang: [
      { text: "Fokus auf Linksextremismus; Verbot der Antifa als terroristische Vereinigung", idx: r(0,1,8,12,13) },
      { text: "Gegen Ausweitung des Extremismus-Begriffs und Gesinnungsstrafrecht (Missbrauch gegen Regierungskritik)", idx: r(2,4,6,14,3) },
      { text: "Islamistische Gefährder und importierter Extremismus; Unterstützung starker BKA-Befugnisse", idx: r(5,9,7,10,15,11) },
    ],
    kurz: [
      { text: "Fokus auf Linksextremismus, Verbot der Antifa; gegen Ausweitung des Extremismus-Begriffs", idx: r(0,1,8,12,13,2,4,6,14,3) },
      { text: "Islamistische Gefährder und importierter Extremismus; starke BKA-Befugnisse", idx: r(5,9,7,10,15,11) },
    ] },
  { aspekt: "Extremismusbekämpfung", partei: "CDU/CSU",
    lang: [
      { text: "Bekämpfung aller Extremismusformen (rechts, links, islamistisch) mit Wachsamkeit und Härte", idx: r(1,2,3,9,11,14,16,18,0,8) },
      { text: "Terrorismus-Vorbereitung verschärfen, Strafbarkeit ins Vorbereitungsstadium vorverlagern", idx: r(4,6,12,13,17,19) },
      { text: "Zuverlässigkeitsprüfungen im Sicherheitsbereich; Hass/Hetze ohne Privilegierung; gegen Überdehnung des Strafrechts", idx: r(10,5,7,15) },
    ],
    kurz: [
      { text: "Bekämpfung aller Extremismusformen (rechts, links, islamistisch); Terrorismus-Vorbereitung verschärfen", idx: r(1,2,3,9,11,14,16,18,0,8,4,6,12,13,17,19) },
      { text: "Zuverlässigkeitsprüfungen; Hass/Hetze ohne Privilegierung; gegen Überdehnung des Strafrechts", idx: r(10,5,7,15) },
    ] },
  { aspekt: "Extremismusbekämpfung", partei: "GRÜNE",
    lang: [
      { text: "Fokus auf Bekämpfung des Rechtsextremismus (Verfassungsfeinde aus dem öD, Razzien, Reichsbürger, CSD-Schutz)", idx: r(0,1,2,3,7,9,12,6) },
      { text: "Gegen Antifa-Verbot/einseitige Linksextremismus-Bekämpfung; ganzheitlicher Präventionsansatz", idx: r(5,8) },
      { text: "Hasskriminalität gegen LSBTIQ benennen; hybride Bedrohungen und OK durch staatliche Akteure (Russland)", idx: r(10,4,11) },
    ],
    kurz: [
      { text: "Fokus auf Bekämpfung des Rechtsextremismus; gegen Antifa-Verbot; ganzheitliche Prävention", idx: r(0,1,2,3,7,9,12,6,5,8) },
      { text: "Hasskriminalität gegen LSBTIQ benennen; hybride Bedrohungen durch staatliche Akteure", idx: r(10,4,11) },
    ] },
  { aspekt: "Extremismusbekämpfung", partei: "LINKE",
    lang: [
      { text: "Kritik an Strafverschärfungen/Vorbereitungsstrafbarkeit als unwirksam und Missbrauchsinstrument", idx: r(0,1,4) },
      { text: "AfD als extremistische Bedrohung; Fokus auf Rechtsextremismus und queerfeindliche Gewalt; Beobachtungsstelle", idx: r(2,5,3) },
    ],
    kurz: [
      { text: "Kritik an Strafverschärfungen/Vorbereitungsstrafbarkeit als Missbrauchsinstrument", idx: r(0,1,4) },
      { text: "AfD als extremistische Bedrohung; Fokus auf Rechtsextremismus und queerfeindliche Gewalt", idx: r(2,5,3) },
    ] },
  { aspekt: "Extremismusbekämpfung", partei: "SPD",
    lang: [
      { text: "AfD als Sicherheitsrisiko; Warnung vor Normalisierung des Rechtsextremismus", idx: r(0,4,5,11) },
      { text: "Terrorismus-Strafrecht verschärfen; erweiterte Ermittlungsbefugnisse", idx: r(1,6,7,9,12) },
      { text: "Prävention und Zivilgesellschaft stärken; Hasskriminalität gegen queere Menschen; gegen illegitime Extremismusvorwürfe", idx: r(3,8,10,2) },
    ],
    kurz: [
      { text: "AfD als Sicherheitsrisiko; Terrorismus-Strafrecht verschärfen und erweiterte Befugnisse", idx: r(0,4,5,11,1,6,7,9,12) },
      { text: "Prävention und Zivilgesellschaft stärken; Hasskriminalität gegen queere Menschen", idx: r(3,8,10,2) },
    ] },

  // ===== Kennzeichnungspflicht Polizei =====
  { aspekt: "Kennzeichnungspflicht Polizei", partei: "CDU/CSU",
    lang: [{ text: "Ablehnung einer Kennzeichnungspflicht für die Polizei (Vertrauen statt Kontrolle)", idx: r(0,1) }],
    kurz: [{ text: "Ablehnung einer Kennzeichnungspflicht für die Polizei", idx: r(0,1) }] },
  { aspekt: "Kennzeichnungspflicht Polizei", partei: "GRÜNE",
    lang: [{ text: "Befürwortung einer Kennzeichnungspflicht bei der Bundespolizei zur Vertrauensstärkung", idx: r(0) }],
    kurz: [{ text: "Befürwortung einer Kennzeichnungspflicht bei der Bundespolizei", idx: r(0) }] },
  { aspekt: "Kennzeichnungspflicht Polizei", partei: "LINKE",
    lang: [{ text: "Ausnahmslose Kennzeichnungspflicht, Bodycams bei Zwang und unabhängige Polizeikontrolle", idx: r(0,1,2) }],
    kurz: [{ text: "Ausnahmslose Kennzeichnungspflicht, Bodycams und unabhängige Polizeikontrolle", idx: r(0,1,2) }] },

  // ===== Organisierte / Clankriminalität =====
  { aspekt: "Organisierte / Clankriminalität", partei: "AfD",
    lang: [
      { text: "Clankriminalität benennen; bundesweites Lagebild zu Paralleljustiz", idx: r(3,4,5,10,12) },
      { text: "Bekämpfung durch Abschiebung, Vermögensabschöpfung und Ausweisung; rechtsstaatlich", idx: r(6,8,11,2) },
      { text: "Antifa als OK; mobile Täterstrukturen, Sozialleistungsbetrug; starkes BKA", idx: r(0,1,9,7) },
    ],
    kurz: [
      { text: "Clankriminalität benennen, bundesweites Lagebild; Bekämpfung durch Abschiebung und Vermögensabschöpfung", idx: r(3,4,5,10,12,6,8,11,2) },
      { text: "Antifa als OK; mobile Täterstrukturen und Sozialleistungsbetrug; starkes BKA", idx: r(0,1,9,7) },
    ] },
  { aspekt: "Organisierte / Clankriminalität", partei: "CDU/CSU",
    lang: [
      { text: "Bekämpfung durch Bundeslagebild, Vermögensabschöpfung, Beweislastumkehr und Follow-the-money", idx: r(0,1,2,4,5,7,10) },
      { text: "Bessere Behördenzusammenarbeit und europäische Kooperation; Geldautomatenkriminalität", idx: r(3,6,8,11,12) },
      { text: "Gegen pauschale Verbote; AfD-Paralleljustiz als milieuspezifisch/regional begrenzt", idx: r(9,13) },
    ],
    kurz: [
      { text: "Bekämpfung durch Bundeslagebild, Vermögensabschöpfung, Beweislastumkehr; Behördenzusammenarbeit", idx: r(0,1,2,4,5,7,10,3,6,8,11,12) },
      { text: "Gegen pauschale Verbote; AfD-Paralleljustiz als milieuspezifisch/regional begrenzt", idx: r(9,13) },
    ] },
  { aspekt: "Organisierte / Clankriminalität", partei: "GRÜNE",
    lang: [
      { text: "Vermögensabschöpfung und Verfolgung von Finanzkriminalität mit ausreichend Ressourcen", idx: r(1,2,3,4) },
      { text: "Gegen rassistische/ethnische Reduktion von Clankriminalität; AfD-Loyalitätsstrukturen", idx: r(5,6,0) },
    ],
    kurz: [
      { text: "Vermögensabschöpfung und Verfolgung von Finanzkriminalität mit Ressourcen", idx: r(1,2,3,4) },
      { text: "Gegen rassistische/ethnische Reduktion von Clankriminalität", idx: r(5,6,0) },
    ] },
  { aspekt: "Organisierte / Clankriminalität", partei: "LINKE",
    lang: [{ text: "Kritik am AfD-Clan-Narrativ und an dessen Instrumentalisierung; Maßnahmen unvollständig (Bargeldobergrenzen)", idx: r(0,1) }],
    kurz: [{ text: "Kritik am AfD-Clan-Narrativ und dessen Instrumentalisierung", idx: r(0,1) }] },
  { aspekt: "Organisierte / Clankriminalität", partei: "SPD",
    lang: [
      { text: "Bekämpfung durch spezialisierte Einheiten, Befugnisse, Vermögensabschöpfung und Aktionsplan", idx: r(0,2,3,4,6,7,8,11,12,13) },
      { text: "Geldautomatenkriminalität per TKÜ; Polizei-Unterwanderung verhindern; gegen AfD-Paralleljustiz-Framing", idx: r(1,9,5,10) },
    ],
    kurz: [
      { text: "Bekämpfung durch spezialisierte Einheiten, Vermögensabschöpfung und Aktionsplan", idx: r(0,2,3,4,6,7,8,11,12,13,1) },
      { text: "Polizei-Unterwanderung verhindern; gegen AfD-Paralleljustiz-Framing", idx: r(9,5,10) },
    ] },

  // ===== Polizei (Ausstattung/Ausrichtung) =====
  { aspekt: "Polizei (Ausstattung/Ausrichtung)", partei: "AfD",
    lang: [
      { text: "Bessere Ausstattung, mehr Personal und erweiterte Befugnisse (auch Taser) für die Polizei", idx: r(3,5,6,8,9,11,12,13,15,16,17,19,21,23,25,26,1,24) },
      { text: "Gegen den Polizeibeauftragten als Misstrauensinstrument; Polizisten in der AfD verteidigen", idx: r(0,2,4,18) },
      { text: "Rechtsstaatliche Grenzen/Verhältnismäßigkeit; differenzierte PKS-Daten; gegen Bürokratie-Datenpflege", idx: r(10,20,14,7,22) },
    ],
    kurz: [
      { text: "Bessere Ausstattung, mehr Personal und erweiterte Befugnisse (auch Taser); gegen den Polizeibeauftragten", idx: r(3,5,6,8,9,11,12,13,15,16,17,19,21,23,25,26,1,24,0,2,4,18) },
      { text: "Rechtsstaatliche Grenzen; differenzierte PKS-Daten; gegen Bürokratie-Datenpflege", idx: r(10,20,14,7,22) },
    ] },
  { aspekt: "Polizei (Ausstattung/Ausrichtung)", partei: "CDU/CSU",
    lang: [
      { text: "Bessere Ausstattung, mehr Personal und erweiterte Befugnisse für die (Bundes-)Polizei", idx: r(1,2,4,6,7,8,13,15,17,20,10) },
      { text: "Würdigung und Verteidigung der Polizei gegen pauschale Vorwürfe; gegen den Polizeibeauftragten", idx: r(3,11,12,14,16,18,19,22,21) },
      { text: "Drohnenabwehr (auch mit Bundeswehr); Grenzkontrollen", idx: r(5,9,0) },
    ],
    kurz: [
      { text: "Bessere Ausstattung und erweiterte Befugnisse für die Bundespolizei; Würdigung gegen pauschale Vorwürfe", idx: r(1,2,4,6,7,8,13,15,17,20,10,3,11,12,14,16,18,19,22,21) },
      { text: "Drohnenabwehr (auch mit Bundeswehr); Grenzkontrollen", idx: r(5,9,0) },
    ] },
  { aspekt: "Polizei (Ausstattung/Ausrichtung)", partei: "GRÜNE",
    lang: [
      { text: "Bessere Ausstattung und effizientere Verfahren; CSD-Schutz", idx: r(0,1) },
      { text: "Bodycams bei Zwang; Taser nur mit transparenter Rechtfertigung; gegen Kompetenzverlagerung bei Abschiebehaft", idx: r(2,3,4) },
    ],
    kurz: [
      { text: "Bessere Ausstattung und effizientere Verfahren; CSD-Schutz; Bodycams bei Zwang", idx: r(0,1,2) },
      { text: "Taser nur mit transparenter Rechtfertigung; gegen Kompetenzverlagerung bei Abschiebehaft", idx: r(3,4) },
    ] },
  { aspekt: "Polizei (Ausstattung/Ausrichtung)", partei: "LINKE",
    lang: [
      { text: "Gegen Befugniserweiterung und Aufrüstung ohne Kontrolle; menschenrechtsorientiertes Leitbild", idx: r(0,1,5,7,8) },
      { text: "Rassismus bei der Polizei bekämpfen; gegen Polizisten in rechtsextremen Parteien", idx: r(2,3,10) },
      { text: "Gegen Taser ohne Regelung; differenzierterer Ansatz (Fußballfans); Sicherheit queerer Menschen", idx: r(4,6,9) },
    ],
    kurz: [
      { text: "Gegen Befugniserweiterung/Aufrüstung ohne Kontrolle; Rassismus bei der Polizei bekämpfen", idx: r(0,1,5,7,8,2,3,10) },
      { text: "Gegen Taser ohne Regelung; differenzierterer Ansatz; Sicherheit queerer Menschen", idx: r(4,6,9) },
    ] },
  { aspekt: "Polizei (Ausstattung/Ausrichtung)", partei: "SPD",
    lang: [
      { text: "Modernisierung des Bundespolizeigesetzes; bessere Ausstattung, Personal, Befugnisse und Taser", idx: r(0,1,3,4,6,12,13,14,15,10) },
      { text: "Polizeibeauftragter als Kontrollinstrument und Fehlerkultur; Rassismus aufarbeiten", idx: r(8,9,2) },
      { text: "Europol stärken; Würdigung der Polizeiarbeit; gegen AfD-Instrumentalisierung", idx: r(5,7,11) },
    ],
    kurz: [
      { text: "Modernisierung des Bundespolizeigesetzes, bessere Ausstattung und Befugnisse; Polizeibeauftragter als Kontrolle", idx: r(0,1,3,4,6,12,13,14,15,10,8,9,2) },
      { text: "Europol stärken; Würdigung der Polizeiarbeit; gegen AfD-Instrumentalisierung", idx: r(5,7,11) },
    ] },

  // ===== Racial Profiling =====
  { aspekt: "Racial Profiling", partei: "AfD",
    lang: [{ text: "Institutionellen Rassismus leugnen; statistikbasierte Verdachtsmomente als legitim", idx: r(0,1,2) }],
    kurz: [{ text: "Institutionellen Rassismus leugnen; statistikbasierte Verdachtsmomente als legitim", idx: r(0,1,2) }] },
  { aspekt: "Racial Profiling", partei: "CDU/CSU",
    lang: [{ text: "Kein strukturelles Problem (Einzelfallprüfung); Erfassung von Nationalität/Herkunft in Statistiken legitim", idx: r(0,1,2,3) }],
    kurz: [{ text: "Kein strukturelles Problem; Statistik-Erfassung von Nationalität/Herkunft legitim", idx: r(0,1,2,3) }] },
  { aspekt: "Racial Profiling", partei: "GRÜNE",
    lang: [{ text: "Strukturelle Diskriminierung in Behörden bekämpfen; Kontrollquittungen zur Transparenz", idx: r(0,1) }],
    kurz: [{ text: "Strukturelle Diskriminierung in Behörden bekämpfen; Kontrollquittungen", idx: r(0,1) }] },
  { aspekt: "Racial Profiling", partei: "LINKE",
    lang: [
      { text: "Racial Profiling als rassistische Praxis konsequent bekämpfen (anlasslose Kontrollen)", idx: r(0,2,3,4,5) },
      { text: "Kritik an überproportionaler Taser-Anwendung gegen vulnerable Gruppen", idx: r(1) },
    ],
    kurz: [{ text: "Racial Profiling als rassistische Praxis bekämpfen; gegen überproportionale Taser-Anwendung", idx: r(0,2,3,4,5,1) }] },
  { aspekt: "Racial Profiling", partei: "SPD",
    lang: [
      { text: "Strukturellen Rassismus aufarbeiten; unabhängige Stellen zur Prüfung", idx: r(0,2,3) },
      { text: "Gegen Nennung des Migrationshintergrunds in Pressemitteilungen als Stimmungsmache", idx: r(1) },
    ],
    kurz: [{ text: "Strukturellen Rassismus aufarbeiten, unabhängige Stellen; gegen Migrationshintergrund in Pressemitteilungen", idx: r(0,2,3,1) }] },

  // ===== Strafen verschärfen =====
  { aspekt: "Strafen verschärfen", partei: "AfD",
    lang: [
      { text: "Härtere Strafen und Mindeststrafen (Geldautomaten, Sexual- und Gewaltdelikte)", idx: r(0,2,3,4,6) },
      { text: "Straftatbestand für organisierten Sozialleistungsbetrug; gegen oberflächliche Verschärfungen ohne echte Maßnahmen; Schulgewalt", idx: r(5,7,1) },
    ],
    kurz: [
      { text: "Härtere Strafen und Mindeststrafen (Geldautomaten, Sexual-/Gewaltdelikte)", idx: r(0,2,3,4,6) },
      { text: "Straftatbestand für Sozialleistungsbetrug; gegen oberflächliche Verschärfungen", idx: r(5,7,1) },
    ] },
  { aspekt: "Strafen verschärfen", partei: "CDU/CSU",
    lang: [
      { text: "Strafverschärfung bei Terrorismus, Spionage und Vorbereitung staatsgefährdender Taten", idx: r(0,1,2,12) },
      { text: "Härtere Strafen bei Gewalt gegen Frauen und Ehrenmorden; Geldautomatensprengungen", idx: r(5,7,9,10) },
      { text: "Konsequente Strafverfolgung (volle Härte); Drohnen-/Klima-Störungen des Luftverkehrs", idx: r(6,8,11,3,4) },
    ],
    kurz: [
      { text: "Strafverschärfung bei Terrorismus/Spionage; härtere Strafen bei Gewalt gegen Frauen und Ehrenmorden", idx: r(0,1,2,12,5,7,9,10) },
      { text: "Konsequente Strafverfolgung; gegen Störungen des Luftverkehrs (Drohnen, Klima-Kleben)", idx: r(6,8,11,3,4) },
    ] },
  { aspekt: "Strafen verschärfen", partei: "GRÜNE",
    lang: [
      { text: "Homo-/transfeindliche Angriffe strafrechtlich benennen", idx: r(0) },
      { text: "Strafverschärfung als ineffektiv; gegen Vorverlagerung der Strafbarkeit (Prävention wirksamer)", idx: r(1,2) },
    ],
    kurz: [{ text: "Homo-/transfeindliche Angriffe benennen; Strafverschärfung als ineffektiv, Prävention wirksamer", idx: r(0,1,2) }] },
  { aspekt: "Strafen verschärfen", partei: "LINKE",
    lang: [{ text: "Strafverschärfungen als symbolisch/unwirksam; stattdessen Ursachen über die Kinder- und Jugendhilfe bekämpfen", idx: r(0,1) }],
    kurz: [{ text: "Strafverschärfungen als symbolisch/unwirksam; Ursachen bekämpfen", idx: r(0,1) }] },
  { aspekt: "Strafen verschärfen", partei: "SPD",
    lang: [
      { text: "Schärfere Strafen für Geldautomaten-/Sprengstoffkriminalität", idx: r(0,1) },
      { text: "Strafverschärfung gegen Terrorismus und Vorverlagerung zur präventiven Terrorabwehr", idx: r(2,3) },
    ],
    kurz: [{ text: "Schärfere Strafen für Geldautomaten-/Sprengstoffkriminalität; gegen Terrorismus (Vorverlagerung)", idx: r(0,1,2,3) }] },

  // ===== Strafmündigkeit / Jugendstrafrecht =====
  { aspekt: "Strafmündigkeit / Jugendstrafrecht", partei: "AfD",
    lang: [{ text: "Absenkung der Strafmündigkeit von 14 auf 12 Jahre", idx: r(0,1) }],
    kurz: [{ text: "Absenkung der Strafmündigkeit von 14 auf 12 Jahre", idx: r(0,1) }] },
  { aspekt: "Strafmündigkeit / Jugendstrafrecht", partei: "CDU/CSU",
    lang: [{ text: "Gegen Absenkung der Strafmündigkeit ohne wissenschaftliche Grundlage; Jugendstrafrecht zur Resozialisierung erhalten", idx: r(0) }],
    kurz: [{ text: "Gegen Absenkung der Strafmündigkeit ohne Evidenz; Jugendstrafrecht erhalten", idx: r(0) }] },
  { aspekt: "Strafmündigkeit / Jugendstrafrecht", partei: "GRÜNE",
    lang: [{ text: "Gegen Absenkung der Strafmündigkeit; präventive statt punitive Maßnahmen", idx: r(0) }],
    kurz: [{ text: "Gegen Absenkung der Strafmündigkeit; Prävention statt härterer Strafen", idx: r(0) }] },
  { aspekt: "Strafmündigkeit / Jugendstrafrecht", partei: "LINKE",
    lang: [{ text: "Gegen Absenkung der Strafmündigkeit auf 12; Prävention über die Kinder- und Jugendhilfe wirksamer", idx: r(0) }],
    kurz: [{ text: "Gegen Absenkung der Strafmündigkeit auf 12; Prävention wirksamer", idx: r(0) }] },

  // ===== Verfassungsschutz =====
  { aspekt: "Verfassungsschutz", partei: "AfD",
    lang: [{ text: "Kritik am Verfassungsschutz als Regierungsschutz/Missbrauch; gegen Ausweitung der Befugnisse und Meldestellen", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Verfassungsschutz als Regierungsschutz/Missbrauch kritisiert; gegen Ausweitung der Befugnisse", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Verfassungsschutz", partei: "CDU/CSU",
    lang: [
      { text: "Verfassungsschutz stärken (erweiterte digitale Befugnisse); Beobachtung von Bedrohungen aller Seiten", idx: r(2,3,1) },
      { text: "Gegen Ausbau von Clankriminalitäts-Sammlungen durch Verfassungsschutzämter", idx: r(0) },
    ],
    kurz: [{ text: "Verfassungsschutz stärken (digitale Befugnisse), Beobachtung aller Seiten; gegen Clan-Sammlungen", idx: r(2,3,1,0) }] },
  { aspekt: "Verfassungsschutz", partei: "GRÜNE",
    lang: [{ text: "AfD-Einstufung als gesichert rechtsextrem; Verteidigung des Verfassungsschutzes; Reform der Nachrichtendienste gegen hybride Bedrohungen", idx: r(0,2,1) }],
    kurz: [{ text: "AfD-Einstufung als rechtsextrem; Verteidigung des Verfassungsschutzes; Reform der Nachrichtendienste", idx: r(0,2,1) }] },
  { aspekt: "Verfassungsschutz", partei: "LINKE",
    lang: [{ text: "Gegen Ausbau zum Überwachungsstaat und gegen Beseitigung von Schutzmechanismen bei der Datenverarbeitung", idx: r(0,1) }],
    kurz: [{ text: "Gegen Ausbau zum Überwachungsstaat und Beseitigung von Datenschutzmechanismen", idx: r(0,1) }] },
  { aspekt: "Verfassungsschutz", partei: "SPD",
    lang: [
      { text: "AfD-Einstufung als rechtsextrem; Überprüfung der Verfassungsmäßigkeit durch das BVerfG", idx: r(0,1,2) },
      { text: "Gegen Instrumentalisierung von Verfassungsschutz-Einstufungen und AfD-Forderungen", idx: r(3,4) },
    ],
    kurz: [{ text: "AfD-Einstufung als rechtsextrem, Verfassungsmäßigkeit prüfen; gegen Instrumentalisierung", idx: r(0,1,2,3,4) }] },

  // ===== Verschleierung (Burka/Kopftuch) =====
  { aspekt: "Verschleierung (Burka/Kopftuch)", partei: "AfD",
    lang: [{ text: "Verbot von Kinderkopftüchern in schulischen Einrichtungen", idx: r(0) }],
    kurz: [{ text: "Verbot von Kinderkopftüchern in schulischen Einrichtungen", idx: r(0) }] },

  // ===== Videoüberwachung / Gesichtserkennung =====
  { aspekt: "Videoüberwachung / Gesichtserkennung", partei: "AfD",
    lang: [{ text: "Ablehnung flächendeckender Videoüberwachung ohne individuelle Anlässe", idx: r(0) }],
    kurz: [{ text: "Ablehnung flächendeckender Videoüberwachung ohne Anlass", idx: r(0) }] },
  { aspekt: "Videoüberwachung / Gesichtserkennung", partei: "CDU/CSU",
    lang: [{ text: "Befürwortung von Videoüberwachung und Gesichtserkennung (Bahnhöfe, kritische Infrastruktur, Terrorverfolgung)", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Befürwortung von Videoüberwachung und Gesichtserkennung (Bahnhöfe, kritische Infrastruktur)", idx: r(0,1,2,3,4,5,6) }] },

  // ===== Waffenrecht =====
  { aspekt: "Waffenrecht", partei: "AfD",
    lang: [{ text: "Waffenverbotszonen pragmatisch akzeptiert; gegen Entwaffnung von AfD-Mitgliedern (stattdessen von Migranten); gegen Druckluftwaffen-Verschärfung", idx: r(0,1,2,3) }],
    kurz: [{ text: "Waffenverbotszonen akzeptiert; gegen Entwaffnung von AfD-Mitgliedern; gegen Druckluftwaffen-Verschärfung", idx: r(0,1,2,3) }] },
  { aspekt: "Waffenrecht", partei: "CDU/CSU",
    lang: [{ text: "Konsequente Durchsetzung von Waffenverboten im öffentlichen Raum (verdachtsunabhängige Kontrollen)", idx: r(0) }],
    kurz: [{ text: "Konsequente Durchsetzung von Waffenverboten im öffentlichen Raum", idx: r(0) }] },
  { aspekt: "Waffenrecht", partei: "GRÜNE",
    lang: [{ text: "Verschärfung des Waffenrechts, insbesondere zur Kontrolle von Verfassungsfeinden und Sprengstoffzugang", idx: r(0,1) }],
    kurz: [{ text: "Verschärfung des Waffenrechts (Verfassungsfeinde, Sprengstoffzugang)", idx: r(0,1) }] },
  { aspekt: "Waffenrecht", partei: "LINKE",
    lang: [{ text: "Verschärfung des Waffenrechts (Zuverlässigkeitsprüfungen, Verbot halbautomatischer Waffen für Private)", idx: r(0) }],
    kurz: [{ text: "Verschärfung des Waffenrechts (auch Verbot halbautomatischer Waffen für Private)", idx: r(0) }] },
  { aspekt: "Waffenrecht", partei: "SPD",
    lang: [{ text: "Verschärfung der Waffenregulierung für Druckluftwaffen zur Schließung von Regelungslücken", idx: r(0) }],
    kurz: [{ text: "Verschärfung der Waffenregulierung für Druckluftwaffen", idx: r(0) }] },

  // ===== Überwachungsbefugnisse / Vorratsdaten =====
  { aspekt: "Überwachungsbefugnisse / Vorratsdaten", partei: "AfD",
    lang: [
      { text: "Ablehnung von Massenüberwachung, Chatkontrolle und anlassloser Datenerfassung; gegen Weitergabe an Private", idx: r(0,4,5,6,8,11,14,15,17,7) },
      { text: "Befürwortung gezielter, anlassbezogener TKÜ/Datenspeicherung und BKA-Befugnisse (auch elektronische Fußfessel)", idx: r(1,2,3,9,12,13,10,16) },
    ],
    kurz: [
      { text: "Ablehnung von Massenüberwachung, Chatkontrolle und anlassloser Datenerfassung", idx: r(0,4,5,6,8,11,14,15,17,7) },
      { text: "Befürwortung gezielter, anlassbezogener TKÜ/Datenspeicherung und BKA-Befugnisse", idx: r(1,2,3,9,12,13,10,16) },
    ] },
  { aspekt: "Überwachungsbefugnisse / Vorratsdaten", partei: "CDU/CSU",
    lang: [
      { text: "Befürwortung von IP-Adressen-Speicherung, (Quellen-)TKÜ und erweiterten digitalen Ermittlungsbefugnissen", idx: r(0,1,7,8,11,13,15,16,17,18,20,2) },
      { text: "Erweiterte Befugnisse mit Richtervorbehalt; Datenaustausch und EU-Beweismittel; Geldwäsche", idx: r(3,10,12,14,4,5,21,9) },
      { text: "Elektronische Fußfessel bei häuslicher Gewalt; Chatkontrolle nur im Einzelfall, Verschlüsselung nicht schwächen", idx: r(6,19,22) },
    ],
    kurz: [
      { text: "IP-Adressen-Speicherung, (Quellen-)TKÜ und erweiterte digitale Ermittlungsbefugnisse (mit Richtervorbehalt)", idx: r(0,1,7,8,11,13,15,16,17,18,20,2,3,10,12,14,4,5,21,9) },
      { text: "Elektronische Fußfessel bei häuslicher Gewalt; Chatkontrolle nur im Einzelfall", idx: r(6,19,22) },
    ] },
  { aspekt: "Überwachungsbefugnisse / Vorratsdaten", partei: "GRÜNE",
    lang: [
      { text: "Kritik an unzureichender Differenzierung zwischen Beschuldigten- und Tatverdächtigendaten; Kürzung des TKÜ-Straftatenkatalogs (BVerfG)", idx: r(0,5,1) },
      { text: "Gegen anlasslose Fluggastdaten; Transparenz und Berichtspflicht; Harmonisierung bei elektronischen Beweismitteln", idx: r(2,4,3) },
    ],
    kurz: [
      { text: "Kritik an unzureichender Differenzierung Beschuldigte/Tatverdächtige; Kürzung des TKÜ-Straftatenkatalogs", idx: r(0,5,1) },
      { text: "Gegen anlasslose Fluggastdaten; Transparenz und Berichtspflicht", idx: r(2,4,3) },
    ] },
  { aspekt: "Überwachungsbefugnisse / Vorratsdaten", partei: "LINKE",
    lang: [
      { text: "Ablehnung des Überwachungsausbaus (Überwachungsstaat); gegen Lockerung richterlicher Kontrolle", idx: r(0,5,6,7,12,1) },
      { text: "Gegen Chatkontrolle, Biometrie-Datenbanken und Vorratsdatenspeicherung", idx: r(3,4,10) },
      { text: "Gegen Datenweitergabe an autoritäre Regime/Europol; Verhältnismäßigkeit (Kinderdaten), Schutzrechte; gegen AfD-Widerspruch", idx: r(2,8,9,11,13) },
    ],
    kurz: [
      { text: "Ablehnung des Überwachungsausbaus; gegen Chatkontrolle, Biometrie und Vorratsdatenspeicherung", idx: r(0,5,6,7,12,1,3,4,10) },
      { text: "Gegen Datenweitergabe an autoritäre Regime/Europol; Verhältnismäßigkeit und Schutzrechte", idx: r(2,8,9,11,13) },
    ] },
  { aspekt: "Überwachungsbefugnisse / Vorratsdaten", partei: "SPD",
    lang: [
      { text: "Befürwortung von TKÜ, BKA-Befugnissen und IP-Speicherung mit Richtervorbehalt und verfassungskonform", idx: r(0,1,2,3,4,6,8,9,10) },
      { text: "Überwachung gegen Schleuserbanden; Onlinedurchsuchung/Wohnraumüberwachung bei Agententätigkeit", idx: r(5,7) },
    ],
    kurz: [
      { text: "Befürwortung von TKÜ, BKA-Befugnissen und IP-Speicherung mit Richtervorbehalt (verfassungskonform)", idx: r(0,1,2,3,4,6,8,9,10) },
      { text: "Überwachung gegen Schleuserbanden; Onlinedurchsuchung bei Agententätigkeit", idx: r(5,7) },
    ] },
];

applySynthese("Innere Sicherheit", CELLS);
