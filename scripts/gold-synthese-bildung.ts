/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Bildung und Erziehung" (47 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Frühkindliche Bildung / Kita =====
  { aspekt: "Frühkindliche Bildung / Kita", partei: "AfD",
    lang: [
      { text: "Wahlfreiheit der Eltern und Förderung der Eigenbetreuung statt einseitiger Fremdbetreuung; Kritik am Rechtsanspruch auf Ganztagsbetreuung", idx: r(0,2,3,4,5) },
      { text: "Kita-Mahlzeiten auf Landesebene statt Bundeslösung; gegen sexualpädagogische Inhalte", idx: r(1,6) },
    ],
    kurz: [
      { text: "Wahlfreiheit der Eltern und Eigenbetreuung statt einseitiger Fremdbetreuung", idx: r(0,2,3,4,5) },
      { text: "Kita-Mahlzeiten Ländersache; gegen sexualpädagogische Inhalte", idx: r(1,6) },
    ] },
  { aspekt: "Frühkindliche Bildung / Kita", partei: "CDU/CSU",
    lang: [
      { text: "Ganztagsausbau mit Wahlfreiheit der Eltern und Bundesfinanzierung (verlängerte Abruffrist bis 2029)", idx: r(2,5,6,8) },
      { text: "Frühe Förderung, Sprachförderung und Fachkräftegewinnung gegen Bildungsungleichheit; gegen universale Kostenlosigkeit (Elternverantwortung)", idx: r(3,7,0,1,4) },
    ],
    kurz: [
      { text: "Ganztagsausbau mit Wahlfreiheit der Eltern und Bundesfinanzierung", idx: r(2,5,6,8) },
      { text: "Frühe Förderung und Sprachförderung gegen Bildungsungleichheit; gegen universale Kostenlosigkeit", idx: r(3,7,0,1,4) },
    ] },
  { aspekt: "Frühkindliche Bildung / Kita", partei: "GRÜNE",
    lang: [
      { text: "Kita-Qualität und Investitionen gegen Unterfinanzierung; gebührenfreies letztes Kitajahr und Startchancen-Programm auf Kitas ausweiten", idx: r(0,1,2,4,5) },
      { text: "Rechtsanspruch auf Ganztagsbetreuung ab 2026 mit Finanzierung; Wahlfreiheit der Eltern (gegen AfD)", idx: r(6,3) },
    ],
    kurz: [
      { text: "Kita-Qualität und Investitionen; gebührenfreies letztes Kitajahr und Startchancen auf Kitas", idx: r(0,1,2,4,5) },
      { text: "Rechtsanspruch auf Ganztagsbetreuung ab 2026; Wahlfreiheit der Eltern", idx: r(6,3) },
    ] },
  { aspekt: "Frühkindliche Bildung / Kita", partei: "LINKE",
    lang: [
      { text: "Gebührenfreie Kitas und kostenfreies gesundes Mittagessen gegen soziale Spaltung und Ernährungsarmut", idx: r(0,3,4) },
      { text: "Ganztagsbetreuung als pädagogischer Standard; Kritik an Fachkräftemangel und Qualitätssenkung", idx: r(1,2,5) },
    ],
    kurz: [
      { text: "Gebührenfreie Kitas und kostenfreies Mittagessen gegen soziale Spaltung", idx: r(0,3,4) },
      { text: "Ganztagsbetreuung als Standard; Kritik an Fachkräftemangel", idx: r(1,2,5) },
    ] },
  { aspekt: "Frühkindliche Bildung / Kita", partei: "SPD",
    lang: [
      { text: "Ausbau qualitativ hochwertiger Ganztags- und Ferienbetreuung für Chancengleichheit und Vereinbarkeit von Familie und Beruf", idx: r(2,3,4) },
      { text: "Kita-Verpflegung und Frühe Hilfen; Qualitätsentwicklungsgesetz", idx: r(0,1) },
    ],
    kurz: [
      { text: "Ausbau qualitativ hochwertiger Ganztags- und Ferienbetreuung", idx: r(2,3,4) },
      { text: "Kita-Verpflegung und Frühe Hilfen; Qualitätsentwicklungsgesetz", idx: r(0,1) },
    ] },

  // ===== Schulsystem =====
  { aspekt: "Schulsystem", partei: "AfD",
    lang: [
      { text: "Rückkehr zu Leistungsprinzip und Realienbildung; Kritik an sinkenden Standards und leistungsfeindlichem Ansatz", idx: r(6,11,13,15,16,5) },
      { text: "Gegen Ideologisierung, Fokus auf Kernfächer; Jugendoffiziere in Schulen", idx: r(0,3,8,14) },
      { text: "Gewalt, Sicherheit, Lehrermangel und marode Gebäude vor Ganztagsausbau priorisieren; Schulessen Ländersache", idx: r(2,4,9,10,12,7,1) },
    ],
    kurz: [
      { text: "Rückkehr zu Leistungsprinzip und Realienbildung; Kritik an sinkenden Standards", idx: r(6,11,13,15,16,5,0,3,8,14) },
      { text: "Gewalt, Lehrermangel und marode Gebäude vor Ganztagsausbau priorisieren", idx: r(2,4,9,10,12,7,1) },
    ] },
  { aspekt: "Schulsystem", partei: "CDU/CSU",
    lang: [
      { text: "Ganztagsausbau und Rechtsanspruch ab 2026 mit Bundesfinanzierung und Fristverlängerung (auch über Vereine/freie Träger)", idx: r(5,6,7,8,12,13,14) },
      { text: "Gewaltprävention durch Schulsozialarbeit; Reformroadmap mit Mindeststandards (PISA/IGLU); Lehrkräfte entlasten", idx: r(1,3,9,2,4,10) },
      { text: "Wertschätzung des Handwerks; gegen bundesweites kostenloses Schulessen (zielgerichtet über Teilhabepaket)", idx: r(0,11) },
    ],
    kurz: [
      { text: "Ganztagsausbau und Rechtsanspruch ab 2026 mit Bundesfinanzierung; Gewaltprävention durch Schulsozialarbeit", idx: r(5,6,7,8,12,13,14,1,3,9,2,4,10) },
      { text: "Wertschätzung des Handwerks; gegen bundesweites kostenloses Schulessen", idx: r(0,11) },
    ] },
  { aspekt: "Schulsystem", partei: "GRÜNE",
    lang: [
      { text: "Mehr Investitionen gegen Unterfinanzierung; Bildungsgerechtigkeit, damit Chancen nicht vom Elterneinkommen abhängen", idx: r(1,3,2,5,7,0) },
      { text: "Schulsozialarbeit und Gewaltprävention; Lehrkräfte vor Einschüchterung schützen; Qualitätsstandards für Jugendarbeit", idx: r(4,6,8,9) },
    ],
    kurz: [
      { text: "Mehr Investitionen gegen Unterfinanzierung; Bildungsgerechtigkeit unabhängig vom Elterneinkommen", idx: r(1,3,2,5,7,0) },
      { text: "Schulsozialarbeit und Gewaltprävention; Lehrkräfte vor Einschüchterung schützen", idx: r(4,6,8,9) },
    ] },
  { aspekt: "Schulsystem", partei: "LINKE",
    lang: [
      { text: "Massive Investitionen gegen Unterfinanzierung; Schulsozialarbeit und Schulpsychologie zur Gewaltprävention", idx: r(0,7,8,6) },
      { text: "Ganztag mit Qualitätsstandards, Fachkräften und Finanzierung; Ganztagsverpflegung gegen Kinderarmut", idx: r(4,5,11,12,3) },
      { text: "Gegen Jugendoffiziere/Militär in Schulen; Schule als demokratischer Ort und Schulpflicht", idx: r(1,2,9,10) },
    ],
    kurz: [
      { text: "Massive Investitionen gegen Unterfinanzierung; Schulsozialarbeit zur Gewaltprävention", idx: r(0,7,8,6) },
      { text: "Ganztag mit Qualität und Finanzierung; gegen Jugendoffiziere/Militär in Schulen", idx: r(4,5,11,12,3,1,2,9,10) },
    ] },
  { aspekt: "Schulsystem", partei: "SPD",
    lang: [
      { text: "Ganztagsausbau und Rechtsanspruch ab 2026 mit Bundesfinanzierung und Fristverlängerung (auch Ferienangebote)", idx: r(0,3,8,9,10,6,11) },
      { text: "Startchancen-Programm für benachteiligte Schulen; Gewaltprävention durch Schulsozialarbeit; Schulessen Ländersache; gegen Noten in der Grundschule", idx: r(5,12,4,7,1,2) },
    ],
    kurz: [
      { text: "Ganztagsausbau und Rechtsanspruch ab 2026 mit Bundesfinanzierung", idx: r(0,3,8,9,10,6,11) },
      { text: "Startchancen-Programm für benachteiligte Schulen; Gewaltprävention durch Schulsozialarbeit", idx: r(5,12,4,7,1,2) },
    ] },

  // ===== Inklusion / Förderschulen =====
  { aspekt: "Inklusion / Förderschulen", partei: "AfD",
    lang: [{ text: "Kritik am Inklusionsansatz als Folge sozialpädagogischer Ideologie", idx: r(0) }],
    kurz: [{ text: "Kritik am Inklusionsansatz als ideologisch", idx: r(0) }] },
  { aspekt: "Inklusion / Förderschulen", partei: "CDU/CSU",
    lang: [{ text: "Inklusion als Teil der Chancengerechtigkeit; gegen AfD-Forderung zur Abschaffung inklusiver Beschulung", idx: r(0) }],
    kurz: [{ text: "Inklusion als Chancengerechtigkeit; gegen AfD-Abschaffung", idx: r(0) }] },
  { aspekt: "Inklusion / Förderschulen", partei: "GRÜNE",
    lang: [{ text: "Ablehnung von AfD-Plänen zur Streichung von Inklusion", idx: r(0) }],
    kurz: [{ text: "Gegen AfD-Streichung von Inklusion", idx: r(0) }] },
  { aspekt: "Inklusion / Förderschulen", partei: "LINKE",
    lang: [{ text: "Kritik an mangelnder Umsetzung des Inklusionsanspruchs und Barrierefreiheit; gegen Kürzung der Schulassistenz", idx: r(0,1) }],
    kurz: [{ text: "Mangelnde Umsetzung der Inklusion; gegen Kürzung der Schulassistenz", idx: r(0,1) }] },

  // ===== Digitalisierung der Schulen =====
  { aspekt: "Digitalisierung der Schulen", partei: "AfD",
    lang: [{ text: "Smartboards allein lösen die Bildungsprobleme nicht; Ressourcen werden verschwendet", idx: r(0) }],
    kurz: [{ text: "Smartboards allein lösen die Bildungsprobleme nicht", idx: r(0) }] },
  { aspekt: "Digitalisierung der Schulen", partei: "CDU/CSU",
    lang: [{ text: "Digitalpakt 2.0 und durchgängige Digitalisierung (auch des BAföG-Verfahrens); Kritik an überfrachtetem Maßnahmenkatalog ohne Priorisierung", idx: r(0,2,1) }],
    kurz: [{ text: "Digitalpakt 2.0 und durchgängige Digitalisierung", idx: r(0,2,1) }] },
  { aspekt: "Digitalisierung der Schulen", partei: "GRÜNE",
    lang: [{ text: "Planungssicherheit beim Digitalpakt 2.0 statt Haushaltsspielchen; Digitalisierung von Gedenkstätten", idx: r(1,0) }],
    kurz: [{ text: "Planungssicherheit beim Digitalpakt 2.0", idx: r(1,0) }] },
  { aspekt: "Digitalisierung der Schulen", partei: "LINKE",
    lang: [{ text: "Kritik an unzureichender Ausstattung mit Internetanbindung", idx: r(0) }],
    kurz: [{ text: "Kritik an unzureichender Internetanbindung", idx: r(0) }] },

  // ===== Berufliche Bildung =====
  { aspekt: "Berufliche Bildung", partei: "AfD",
    lang: [{ text: "Stärkere Fokussierung auf berufliche Ausbildung und Fachkräftegewinnung statt zu vieler Akademiker", idx: r(0) }],
    kurz: [{ text: "Mehr berufliche Ausbildung statt zu vieler Akademiker", idx: r(0) }] },
  { aspekt: "Berufliche Bildung", partei: "CDU/CSU",
    lang: [{ text: "Attraktivität und Wertschätzung handwerklicher Ausbildungsberufe; bessere Übergänge von Ausbildung in Beruf", idx: r(0,2,1) }],
    kurz: [{ text: "Attraktivität und Wertschätzung handwerklicher Ausbildungsberufe", idx: r(0,2,1) }] },
  { aspekt: "Berufliche Bildung", partei: "GRÜNE",
    lang: [{ text: "Mehr Berufsorientierung und bessere Übergänge zwischen Schule und Beruf", idx: r(0) }],
    kurz: [{ text: "Mehr Berufsorientierung und bessere Übergänge Schule-Beruf", idx: r(0) }] },
  { aspekt: "Berufliche Bildung", partei: "LINKE",
    lang: [{ text: "Kritik an unzureichender Ausbildung von pädagogischem Fachpersonal", idx: r(0) }],
    kurz: [{ text: "Kritik an unzureichender Ausbildung von Fachpersonal", idx: r(0) }] },

  // ===== BAföG / Studienfinanzierung =====
  { aspekt: "BAföG / Studienfinanzierung", partei: "AfD",
    lang: [
      { text: "Anpassung der Bedarfssätze an die Inflation und Vereinfachung des Antrags, aber mit Leistungsorientierung und teilweiser Rückzahlung", idx: r(0,1) },
      { text: "Gegen Ausweitung des BAföG als unnötige Sozialleistung (Aufstiegsleiter, nicht Versorgung)", idx: r(2) },
    ],
    kurz: [
      { text: "Anpassung an die Inflation und Vereinfachung, aber mit Leistungsorientierung", idx: r(0,1) },
      { text: "Gegen Ausweitung als unnötige Sozialleistung", idx: r(2) },
    ] },
  { aspekt: "BAföG / Studienfinanzierung", partei: "CDU/CSU",
    lang: [{ text: "BAföG als bewährtes Erfolgsmodell; Reformen nur mit Gegenfinanzierung, Darlehensanteil und Eigenverantwortung zumutbar; Digitalisierung des Verfahrens", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "BAföG als Erfolgsmodell; Reformen nur mit Gegenfinanzierung, Darlehensanteil zumutbar", idx: r(0,1,2,3,4) }] },
  { aspekt: "BAföG / Studienfinanzierung", partei: "GRÜNE",
    lang: [{ text: "BAföG zu niedrig — erhöhen, automatisch an Lebenshaltungskosten anpassen und Bürokratie abbauen", idx: r(0,1,2) }],
    kurz: [{ text: "BAföG erhöhen, automatisch anpassen und Bürokratie abbauen", idx: r(0,1,2) }] },
  { aspekt: "BAföG / Studienfinanzierung", partei: "LINKE",
    lang: [{ text: "Existenzsichernder Vollzuschuss ohne Darlehensanteil, der echte Mietkosten abdeckt (auch für Doktoranden); gegen Armutsgefährdung Studierender", idx: r(2,1,0,3) }],
    kurz: [{ text: "Existenzsichernder Vollzuschuss ohne Darlehensanteil, der echte Mietkosten abdeckt", idx: r(2,1,0,3) }] },
  { aspekt: "BAföG / Studienfinanzierung", partei: "SPD",
    lang: [{ text: "Umfassende BAföG-Reform (höhere Sätze, Wohnkostenpauschale, Elternfreibetrag, Digitalisierung) für Chancengleichheit unabhängig vom Elternvermögen", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Umfassende BAföG-Reform für Chancengleichheit unabhängig vom Elternvermögen", idx: r(0,1,2,3,4) }] },

  // ===== Hochschulen =====
  { aspekt: "Hochschulen", partei: "AfD",
    lang: [{ text: "Gegen ideologische Ausrichtung der Hochschulen; Kritik an der Exzellenzstrategie als Etikettenvergabe statt echter Leistungsförderung", idx: r(0,1) }],
    kurz: [{ text: "Gegen ideologische Ausrichtung; Kritik an der Exzellenzstrategie", idx: r(0,1) }] },
  { aspekt: "Hochschulen", partei: "CDU/CSU",
    lang: [{ text: "Modernisierung und Sanierung mit Bundesmitteln (Schnellbauinitiative); gebührenfreie Studien; Forschungsexzellenz und gegen Bologna-Rückabwicklung", idx: r(0,2,3,1) }],
    kurz: [{ text: "Modernisierung mit Bundesmitteln; gebührenfreie Studien; Forschungsexzellenz", idx: r(0,2,3,1) }] },
  { aspekt: "Hochschulen", partei: "GRÜNE",
    lang: [{ text: "Massive Investitionen gegen den Sanierungsstau (90 Mrd. €) und gegen Kürzungen im Hochschulbereich", idx: r(0,1) }],
    kurz: [{ text: "Massive Investitionen gegen den Sanierungsstau und gegen Kürzungen", idx: r(0,1) }] },
  { aspekt: "Hochschulen", partei: "LINKE",
    lang: [{ text: "Kritik an Unterfinanzierung und mangelnder Infrastruktur", idx: r(0) }],
    kurz: [{ text: "Kritik an Unterfinanzierung und mangelnder Infrastruktur", idx: r(0) }] },
  { aspekt: "Hochschulen", partei: "SPD",
    lang: [{ text: "Wissenschaftsfreiheit gegen Politisierung verteidigen; Exzellenzstrategie für globale Konkurrenzfähigkeit; starkes Wissenschafts- und Forschungssystem", idx: r(0,1,2) }],
    kurz: [{ text: "Wissenschaftsfreiheit verteidigen; Exzellenzstrategie für Konkurrenzfähigkeit", idx: r(0,1,2) }] },

  // ===== Bund-Länder-Zuständigkeit =====
  { aspekt: "Bund-Länder-Zuständigkeit", partei: "AfD",
    lang: [{ text: "Föderalismus und Länderzuständigkeit für Schulen/Kitas respektieren, gegen Bundeszentralismus; nationaler Bildungsgipfel zur Koordination", idx: r(0,1,2,3,5,4) }],
    kurz: [{ text: "Föderalismus respektieren, gegen Bundeszentralismus; nationaler Bildungsgipfel", idx: r(0,1,2,3,5,4) }] },
  { aspekt: "Bund-Länder-Zuständigkeit", partei: "CDU/CSU",
    lang: [
      { text: "Bildung Ländersache, aber Bund finanziert Ganztagsausbau (3,5 Mrd. €) mit Fristverlängerung und Planungssicherheit", idx: r(0,3,4,6,7,8,10,11,1,2) },
      { text: "Hochschulbau als Gemeinschaftsaufgabe; gegen Bund-Länder-Pakt, der Verantwortung im Bund konzentriert", idx: r(5,9) },
    ],
    kurz: [
      { text: "Bildung Ländersache, aber Bund finanziert Ganztagsausbau (3,5 Mrd. €) mit Fristverlängerung", idx: r(0,3,4,6,7,8,10,11,1,2) },
      { text: "Hochschulbau als Gemeinschaftsaufgabe; gegen Verantwortungskonzentration im Bund", idx: r(5,9) },
    ] },
  { aspekt: "Bund-Länder-Zuständigkeit", partei: "GRÜNE",
    lang: [{ text: "Kooperationsverbot abschaffen, gemeinsame Verantwortung aller Ebenen (Bund-Länder-Pakt für Hochschulen); gegen Herauslösung der Bildungsverantwortung", idx: r(1,2,0) }],
    kurz: [{ text: "Kooperationsverbot abschaffen, gemeinsame Verantwortung aller Ebenen", idx: r(1,2,0) }] },
  { aspekt: "Bund-Länder-Zuständigkeit", partei: "LINKE",
    lang: [{ text: "Kooperationsverbot abschaffen (Kooperationsgebot); Bund überlastet Kommunen ohne ausreichende Mittel; ungleiche Standards zwischen Ost und West harmonisieren", idx: r(3,1,2,0) }],
    kurz: [{ text: "Kooperationsverbot abschaffen; Bund überlastet Kommunen ohne ausreichende Mittel", idx: r(3,1,2,0) }] },
  { aspekt: "Bund-Länder-Zuständigkeit", partei: "SPD",
    lang: [{ text: "Föderales System respektieren, aber Bund finanziert Schulinfrastruktur und Ganztag; Kommunen brauchen verlässliche langfristige Finanzierung statt Windhundverfahren", idx: r(2,1,0,3,4) }],
    kurz: [{ text: "Föderales System respektieren, aber Bund finanziert Schulinfrastruktur und Ganztag", idx: r(2,1,0,3,4) }] },

  // ===== Sprache / Migration in Schulen =====
  { aspekt: "Sprache / Migration in Schulen", partei: "AfD",
    lang: [
      { text: "Migration als Ursache für schlechten Sprachstand und Gewalt an Schulen", idx: r(0,1,3,4,2) },
      { text: "Sprachförderung vor dem Regelunterricht; gegen Regelbeschulung ohne hinreichende Deutschkenntnisse; gegen Islamunterricht und Integrationskurse für Geduldete", idx: r(7,10,11,5,6,8,9) },
    ],
    kurz: [
      { text: "Migration als Ursache für schlechten Sprachstand und Gewalt", idx: r(0,1,3,4,2) },
      { text: "Sprachförderung vor dem Regelunterricht; gegen Regelbeschulung ohne Deutschkenntnisse", idx: r(7,10,11,5,6,8,9) },
    ] },
  { aspekt: "Sprache / Migration in Schulen", partei: "CDU/CSU",
    lang: [{ text: "Sprachförderung als Gewaltprävention und für Chancengleichheit; verbindliche Erfassung und Förderung der Sprachfähigkeiten von Vierjährigen", idx: r(0,1,3,4,2) }],
    kurz: [{ text: "Sprachförderung für Chancengleichheit; verbindliche Erfassung bei Vierjährigen", idx: r(0,1,3,4,2) }] },
  { aspekt: "Sprache / Migration in Schulen", partei: "GRÜNE",
    lang: [{ text: "Mehr Sprachförderung für Chancengleichheit; wirksame Integration für Sicherheit an Schulen", idx: r(0,2,1) }],
    kurz: [{ text: "Mehr Sprachförderung für Chancengleichheit; wirksame Integration", idx: r(0,2,1) }] },
  { aspekt: "Sprache / Migration in Schulen", partei: "LINKE",
    lang: [{ text: "Kritik an Stigmatisierung muslimischer Kinder; Schutz vor Diskriminierung", idx: r(0) }],
    kurz: [{ text: "Gegen Stigmatisierung muslimischer Kinder", idx: r(0) }] },
  { aspekt: "Sprache / Migration in Schulen", partei: "SPD",
    lang: [{ text: "Migration nicht pauschal für Gewalt an Schulen verantwortlich machen; strukturelle Faktoren und Personalausstattung als eigentliche Ursachen", idx: r(0,1) }],
    kurz: [{ text: "Migration nicht pauschal für Gewalt verantwortlich machen; strukturelle Faktoren", idx: r(0,1) }] },

  // ===== Demokratiebildung / Wahlalter =====
  { aspekt: "Demokratiebildung / Wahlalter", partei: "AfD",
    lang: [
      { text: "Kritik an ideologischer Indoktrination und Aktivismus in Schulen; Forderung nach politischer Neutralität und Gleichbehandlung aller Parteien", idx: r(0,1,2,3,4,5,8,9) },
      { text: "Gegen bestimmte sexuelle Inhalte, für traditionelle Familienbilder; Jugendoffiziere als Teil politischer Bildung befürworten", idx: r(6,7) },
    ],
    kurz: [
      { text: "Gegen ideologische Indoktrination in Schulen; Forderung nach politischer Neutralität", idx: r(0,1,2,3,4,5,8,9) },
      { text: "Gegen bestimmte sexuelle Inhalte, für traditionelle Familienbilder; Jugendoffiziere befürworten", idx: r(6,7) },
    ] },
  { aspekt: "Demokratiebildung / Wahlalter", partei: "CDU/CSU",
    lang: [
      { text: "Pluralität und Neutralität in der politischen Bildung (Beutelsbacher Konsens); Schutz vor Mobbing und altersgerechte Themen", idx: r(0,2,4,1,6) },
      { text: "DDR-Geschichte und Erinnerungsorte; Jugendoffiziere zur Urteilsbildung; Kinderbeteiligung; Wissenschaftsfreiheit; gegen AfD-Erziehung", idx: r(5,7,9,3,10,8) },
    ],
    kurz: [
      { text: "Pluralität und Neutralität in der politischen Bildung (Beutelsbacher Konsens)", idx: r(0,2,4,1,6) },
      { text: "DDR-Geschichte und Erinnerungsorte; Jugendoffiziere; Kinderbeteiligung; gegen AfD-Erziehung", idx: r(5,7,9,3,10,8) },
    ] },
  { aspekt: "Demokratiebildung / Wahlalter", partei: "GRÜNE",
    lang: [{ text: "Politische Bildung gegen Radikalisierung stärken und Lehrkräfte schützen (Beutelsbacher Konsens); Bundeswehr-Information und Gedenkstätten als Bildungsorte; gegen AfD-Familienbild", idx: r(4,5,1,0,2,3) }],
    kurz: [{ text: "Politische Bildung gegen Radikalisierung stärken und Lehrkräfte schützen", idx: r(4,5,1,0,2,3) }] },
  { aspekt: "Demokratiebildung / Wahlalter", partei: "LINKE",
    lang: [
      { text: "Politische Bildung stärken; Lehrkräfte müssen für demokratische Werte eintreten dürfen (gegen Streichung der Förderung)", idx: r(0,2,4,7) },
      { text: "Gegen Jugendoffiziere und Militärrekrutierung in Schulen; Schulpflicht gegen Homeschooling; Jugendarbeit", idx: r(1,3,8,5,6) },
    ],
    kurz: [
      { text: "Politische Bildung stärken; Lehrkräfte müssen für demokratische Werte eintreten dürfen", idx: r(0,2,4,7) },
      { text: "Gegen Jugendoffiziere/Militärrekrutierung in Schulen; Schulpflicht gegen Homeschooling", idx: r(1,3,8,5,6) },
    ] },
  { aspekt: "Demokratiebildung / Wahlalter", partei: "SPD",
    lang: [{ text: "Demokratiebildung fächerübergreifend; Lehrkräfte sollen verfassungswidrige Aussagen kritisieren; Schule als Ort des Aushandelns und der Pluralität (gegen Ausschluss von Akteuren)", idx: r(1,2,3,0) }],
    kurz: [{ text: "Demokratiebildung fächerübergreifend; Schule als Ort der Pluralität, gegen Ausschluss von Akteuren", idx: r(1,2,3,0) }] },
];

applySynthese("Bildung und Erziehung", CELLS);
