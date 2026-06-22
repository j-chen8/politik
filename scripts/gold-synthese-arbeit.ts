/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld „Arbeit und Beschäftigung" (60 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Arbeitslosengeld =====
  { aspekt: "Arbeitslosengeld", partei: "AfD",
    lang: [
      { text: "Kritik an hoher Arbeitslosigkeit als Folge der Regierungspolitik; Versprechen, sie zu senken", idx: r(0,2) },
      { text: "Dauerhaft Arbeitsunfähige durch Sozialämter statt Jobcenter betreuen", idx: r(1) },
    ],
    kurz: [{ text: "Kritik an hoher Arbeitslosigkeit als Regierungsversagen; Arbeitsunfähige zu Sozialämtern statt Jobcenter", idx: r(0,2,1) }] },
  { aspekt: "Arbeitslosengeld", partei: "CDU/CSU",
    lang: [
      { text: "Vermittlungsvorrang, Verbindlichkeit der Jobcenter und stärkere Arbeitsanreize", idx: r(0,3,4) },
      { text: "Kritik an hoher Arbeitslosigkeit/Industrieabbau; Kritik an AfD-Vorschlägen", idx: r(1,2) },
    ],
    kurz: [{ text: "Vermittlungsvorrang, Verbindlichkeit und Anreize; Kritik an hoher Arbeitslosigkeit/Industrieabbau", idx: r(0,3,4,1,2) }] },
  { aspekt: "Arbeitslosengeld", partei: "GRÜNE",
    lang: [
      { text: "Kritik am Abrutschen von Facharbeitern in die Grundsicherung; Warnung vor Lasten der Sozialkassen", idx: r(0,2) },
      { text: "Gegen repressive Jobcenter-Maßnahmen und überharte Sanktionen", idx: r(1,3) },
    ],
    kurz: [{ text: "Kritik am Abrutschen in die Grundsicherung; gegen repressive Maßnahmen und überharte Sanktionen", idx: r(0,2,1,3) }] },
  { aspekt: "Arbeitslosengeld", partei: "LINKE",
    lang: [
      { text: "Arbeitgeber-Verantwortung gegen Arbeitslosigkeit; gegen Sanktionen, bessere Jobcenter-Ausstattung", idx: r(0,1) },
      { text: "Kritik an Saisonarbeit ohne vollen Kranken-/Rentenschutz", idx: r(2) },
    ],
    kurz: [{ text: "Gegen Sanktionen, bessere Jobcenter-Ausstattung; Arbeitgeber-Verantwortung; Kritik an ungeschützter Saisonarbeit", idx: r(0,1,2) }] },
  { aspekt: "Arbeitslosengeld", partei: "SPD",
    lang: [{ text: "Über 3 Mio. Arbeitslose als kritische Lage; soziale Sicherung im Kontext von EU-Mobilität/Lohnprellerei", idx: r(0,1) }],
    kurz: [{ text: "Über 3 Mio. Arbeitslose als kritische Lage; soziale Sicherung bei EU-Mobilität", idx: r(0,1) }] },

  // ===== Arbeitszeit =====
  { aspekt: "Arbeitszeit", partei: "AfD",
    lang: [
      { text: "Verteidigung des Achtstundentags/Arbeitszeitgesetzes; gegen EU-Vorgaben und pauschale Flexibilisierung", idx: r(3,4,5,6,9,10,13,14) },
      { text: "Flexible Modelle für Ältere; Überstunden in bestimmten Branchen (z. B. Bau)", idx: r(1,2,7) },
      { text: "Kritik an Belastung (Schichtdienst, Ärzte); Arbeitszeitbetrug bestrafen; gegen starre 20-kg-Grenze", idx: r(0,8,11,12) },
    ],
    kurz: [
      { text: "Verteidigung des Achtstundentags; gegen EU-Vorgaben und pauschale Flexibilisierung; flexible Modelle für Ältere", idx: r(3,4,5,6,9,10,13,14,1,2,7) },
      { text: "Kritik an Belastung; Arbeitszeitbetrug bestrafen; gegen starre 20-kg-Grenze", idx: r(0,8,11,12) },
    ] },
  { aspekt: "Arbeitszeit", partei: "CDU/CSU",
    lang: [
      { text: "Flexibilisierung: wöchentliche statt tägliche Höchstarbeitszeit, Achtstundentag aufbrechen (Arbeitsschutz erhalten)", idx: r(0,1,6,7,8,10,11,13,14,15,16,20,21,24) },
      { text: "Steuerliche Anreize für Weiterarbeit im Alter (Aktivrente)", idx: r(2,3,5,12,22,23) },
      { text: "Anerkennung von Belastung; Pendlerpauschale; Eigenverantwortung; gegen 20-kg-Regel", idx: r(17,19,18,9,4) },
    ],
    kurz: [
      { text: "Flexibilisierung: wöchentliche statt tägliche Höchstarbeitszeit, Achtstundentag aufbrechen (Arbeitsschutz erhalten)", idx: r(0,1,6,7,8,10,11,13,14,15,16,20,21,24) },
      { text: "Steuerliche Anreize für Weiterarbeit im Alter (Aktivrente); Pendlerpauschale; Einzelpunkte", idx: r(2,3,5,12,22,23,17,19,18,9,4) },
    ] },
  { aspekt: "Arbeitszeit", partei: "GRÜNE",
    lang: [
      { text: "Verteidigung des Achtstundentags gegen Abschaffung und steuerfreie Überstunden", idx: r(4,5,9,10) },
      { text: "Längeres Arbeiten nur freiwillig/altersgerecht; mehr Zeitsouveränität, Recht auf Rückkehr in Vollzeit", idx: r(0,2,3,8) },
      { text: "Kritik an Belastung/entgrenzter Arbeit; Gewichtsgrenzen; Tarifgeltung; Fachkräfteverfahren", idx: r(1,11,6,7,12) },
    ],
    kurz: [
      { text: "Verteidigung des Achtstundentags; längeres Arbeiten nur freiwillig; mehr Zeitsouveränität", idx: r(4,5,9,10,0,2,3,8) },
      { text: "Kritik an Belastung/entgrenzter Arbeit; Gewichtsgrenzen; Einzelpunkte", idx: r(1,11,6,7,12) },
    ] },
  { aspekt: "Arbeitszeit", partei: "LINKE",
    lang: [
      { text: "Verteidigung des Achtstundentags/der 40-Std-Woche gegen Ausweitung auf 13 Stunden; Arbeitszeiterfassung und Überstundenausgleich", idx: r(0,1,3,5,6,10,11,14,15,16,19) },
      { text: "Mehr Zeitsouveränität und Mitbestimmung statt Arbeitgeber-Flexibilität; bezahlte Elternzeit", idx: r(8,2) },
      { text: "Kritik an Belastung (Paket, Schicht); Tariftreue bei Arbeitszeit; Doktoranden", idx: r(4,9,13,18,20,7,17,12) },
    ],
    kurz: [
      { text: "Verteidigung des Achtstundentags gegen Ausweitung; Arbeitszeiterfassung; Zeitsouveränität und Mitbestimmung", idx: r(0,1,3,5,6,10,11,14,15,16,19,8,2) },
      { text: "Kritik an Belastung (Paket, Schicht); Tariftreue bei Arbeitszeit; Doktoranden", idx: r(4,9,13,18,20,7,17,12) },
    ] },
  { aspekt: "Arbeitszeit", partei: "SPD",
    lang: [
      { text: "Verteidigung des Achtstundentags und der Selbstbestimmung; Arbeitszeiterfassung und Bezahlung aller Überstunden", idx: r(2,9,10,11,18) },
      { text: "Kritik an Verdichtung, Belastung und unbezahlten Überstunden", idx: r(0,3,7,12,14,16) },
      { text: "Flexibler Übergang in den Ruhestand (Aktivrente); Tarif = bessere Arbeitszeiten; Einzelpunkte", idx: r(4,13,6,8,1,5,15,17) },
    ],
    kurz: [
      { text: "Verteidigung des Achtstundentags und der Selbstbestimmung; Arbeitszeiterfassung und Bezahlung aller Überstunden", idx: r(2,9,10,11,18) },
      { text: "Kritik an Verdichtung/Belastung und unbezahlten Überstunden; Aktivrente; Tarif = bessere Arbeitszeiten", idx: r(0,3,7,12,14,16,4,13,6,8,1,5,15,17) },
    ] },

  // ===== Befristung & prekäre Arbeit =====
  { aspekt: "Befristung & prekäre Arbeit", partei: "AfD",
    lang: [{ text: "Kritik an Subunternehmerketten/Leiharbeit in der Paketbranche; 15-%-Deckelung von Fremdpersonal statt Totalverbot", idx: r(0,1,2) }],
    kurz: [{ text: "Subunternehmerketten/Leiharbeit kritisch; 15-%-Deckelung statt Totalverbot", idx: r(0,1,2) }] },
  { aspekt: "Befristung & prekäre Arbeit", partei: "CDU/CSU",
    lang: [
      { text: "Flexible Beschäftigungsformen für KMU wirtschaftlich notwendig; gegen Direktanstellungsgebot/Leiharbeitsverbot", idx: r(0,4) },
      { text: "Entfristung des Paketboten-Schutz-Gesetzes; EU-Plattformrichtlinie mit Arbeitsverhältnis-Vermutung", idx: r(1,2,5,3) },
    ],
    kurz: [{ text: "Flexible Beschäftigung für KMU nötig; Entfristung des Paketboten-Schutz-Gesetzes; EU-Plattformrichtlinie", idx: r(0,4,1,2,5,3) }] },
  { aspekt: "Befristung & prekäre Arbeit", partei: "GRÜNE",
    lang: [
      { text: "Kritik an prekären Bedingungen in Paket-/Plattformbranche; bessere Regulierung und Kontrolle", idx: r(0,1,4,5) },
      { text: "Soziale Absicherung für Erntehelfer; Kritik an kurzsichtiger Vermittlung in befristete Jobs", idx: r(2,3) },
    ],
    kurz: [{ text: "Kritik an prekären Bedingungen (Paket/Plattform); bessere Regulierung; Absicherung für Erntehelfer", idx: r(0,1,4,5,2,3) }] },
  { aspekt: "Befristung & prekäre Arbeit", partei: "LINKE",
    lang: [
      { text: "Direktanstellungsgebot gegen Subunternehmerketten; Verbot dieser Strukturen", idx: r(1,3,4,8) },
      { text: "Kritik an prekärer Beschäftigung, Lohnklau und Ausbeutung; erweiterte Mitbestimmung", idx: r(0,5,10,6) },
      { text: "Saisonarbeit ohne vollen Sozialschutz; befristete Verträge (Schwangerschaft, Doktoranden)", idx: r(7,2,9) },
    ],
    kurz: [
      { text: "Direktanstellungsgebot gegen Subunternehmerketten; Kritik an prekärer Beschäftigung und Lohnklau", idx: r(1,3,4,8,0,5,10,6) },
      { text: "Saisonarbeit ohne vollen Sozialschutz; befristete Verträge", idx: r(7,2,9) },
    ] },
  { aspekt: "Befristung & prekäre Arbeit", partei: "SPD",
    lang: [
      { text: "Entfristung der Nachunternehmerhaftung in der Paketbranche", idx: r(0,4,6) },
      { text: "Bekämpfung von Scheinselbstständigkeit; Reform des Statusfeststellungsverfahrens", idx: r(2,3) },
      { text: "Plattformarbeit regulieren (EU-Richtlinie); Tarifverträge gegen Kündigungen", idx: r(5,7,1) },
    ],
    kurz: [
      { text: "Entfristung der Nachunternehmerhaftung; Bekämpfung von Scheinselbstständigkeit (Statusfeststellung)", idx: r(0,4,6,2,3) },
      { text: "Plattformarbeit regulieren (EU-Richtlinie); Tarifverträge gegen Kündigungen", idx: r(5,7,1) },
    ] },

  // ===== Betriebliche Mitbestimmung =====
  { aspekt: "Betriebliche Mitbestimmung", partei: "AfD",
    lang: [
      { text: "Ablehnung der Ausweitung von Mitbestimmung/Betriebsratsrechten als Überregulierung; Verteidigung des Betriebsverfassungsgesetzes", idx: r(1,2,5,6) },
      { text: "Pluralismus statt Einheitsgewerkschaft; Kritik an Gewerkschaften; Stammarbeit-Vorrang; Mitbestimmung als Errungenschaft", idx: r(0,3,4,7) },
    ],
    kurz: [{ text: "Ablehnung der Ausweitung der Mitbestimmung als Überregulierung; Kritik an Gewerkschaften; Stammarbeit-Vorrang", idx: r(1,2,5,6,0,3,4,7) }] },
  { aspekt: "Betriebliche Mitbestimmung", partei: "CDU/CSU",
    lang: [
      { text: "Ablehnung des Ausbaus; Verteidigung des ausgewogenen Betriebsverfassungsgesetzes", idx: r(0) },
      { text: "Stärkung der Mitbestimmung in der Branche zur Verbesserung der Arbeitsbedingungen", idx: r(1) },
    ],
    kurz: [{ text: "Ablehnung des Ausbaus, Verteidigung des Betriebsverfassungsgesetzes; punktuell Stärkung in der Branche", idx: r(0,1) }] },
  { aspekt: "Betriebliche Mitbestimmung", partei: "GRÜNE",
    lang: [
      { text: "Stärkung der Betriebsräte und Mitbestimmungsrechte (Arbeitszeit, Transformation)", idx: r(2,3,4,5) },
      { text: "Union Busting als Offizialdelikt verfolgen; Direktanstellungsgebot", idx: r(1,0) },
    ],
    kurz: [{ text: "Stärkung der Betriebsräte und Mitbestimmung; Union Busting verfolgen; Direktanstellungsgebot", idx: r(2,3,4,5,1,0) }] },
  { aspekt: "Betriebliche Mitbestimmung", partei: "LINKE",
    lang: [
      { text: "Stärkung der Mitbestimmung und Betriebsräte (universelle Vertretung, Arbeits-/Gesundheitsschutz)", idx: r(2,3,4,5,6,7,8,9,11,13,14) },
      { text: "Frühe Einbeziehung bei Standort-/Transformationsentscheidungen; Mitbestimmung als Förderbedingung; Jugendvertretung", idx: r(12,16,15) },
      { text: "Scheinselbstständige Lehrkräfte absichern; Kritik an AfD und an Plattformen (Uber)", idx: r(1,0,10) },
    ],
    kurz: [
      { text: "Stärkung der Mitbestimmung und Betriebsräte; frühe Einbeziehung bei Transformation; Mitbestimmung als Förderbedingung", idx: r(2,3,4,5,6,7,8,9,11,13,14,12,16,15) },
      { text: "Scheinselbstständige Lehrkräfte absichern; Kritik an AfD und Plattformen", idx: r(1,0,10) },
    ] },
  { aspekt: "Betriebliche Mitbestimmung", partei: "SPD",
    lang: [
      { text: "Stärkung der Betriebsräte und Mitbestimmung als Demokratiefunktion (Digitalisierung, KI, Gesundheitsschutz)", idx: r(1,2,5,6,7,8,11) },
      { text: "Kritik an Behinderung von Betriebsratsgründungen; Tarif + Mitbestimmung; steuerliche Förderung von Gewerkschaften", idx: r(4,0,9,3) },
      { text: "Kritik an AfD-Position (nur Mitwirkung statt Mitbestimmung)", idx: r(10) },
    ],
    kurz: [
      { text: "Stärkung der Betriebsräte und Mitbestimmung als Demokratiefunktion; Kritik an Behinderung von Betriebsratsgründungen", idx: r(1,2,5,6,7,8,11,4,0,9,3) },
      { text: "Kritik an AfD-Position (nur Mitwirkung statt Mitbestimmung)", idx: r(10) },
    ] },

  // ===== Bürgergeld / Grundsicherung =====
  { aspekt: "Bürgergeld / Grundsicherung", partei: "AfD",
    lang: [
      { text: "Bürgergeld als zu großzügig → aktivierende Grundsicherung mit Arbeitspflicht und verschärften Sanktionen", idx: r(0,1,3,5,6) },
      { text: "Kritik an steigenden Kosten und Sozialmissbrauch; Leistungen für Ausländer/Ukraine begrenzen; Anrechnung auf Löhne", idx: r(2,7,4) },
    ],
    kurz: [{ text: "Bürgergeld als zu großzügig → aktivierende Grundsicherung mit Arbeitspflicht/Sanktionen; Kritik an Kosten und Missbrauch", idx: r(0,1,3,5,6,2,7,4) }] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "CDU/CSU",
    lang: [
      { text: "Umbau zur neuen Grundsicherung nach „Fordern und Fördern“ mit Sanktionen und verpflichtender Mitwirkung", idx: r(1,3,4,6,7,8,9,10,11) },
      { text: "Effizienz, Bekämpfung von Missbrauch, Eigenverantwortung; Bezug zur Migrationssteuerung", idx: r(0,2,5) },
    ],
    kurz: [{ text: "Umbau zur Grundsicherung („Fordern und Fördern“) mit Sanktionen und Mitwirkung; Effizienz/Missbrauch/Eigenverantwortung", idx: r(1,3,4,6,7,8,9,10,11,0,2,5) }] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "GRÜNE",
    lang: [
      { text: "Gegen Verschärfungen und Sanktionen bis zum Existenzminimum; armutsfeste Regelsätze, Schutz von Kindern", idx: r(1,2,3,4,6) },
      { text: "Verteidigung des Systems gegen Stigmatisierung; Weiterbildung und Beratung statt Druck", idx: r(0,5) },
    ],
    kurz: [{ text: "Gegen Verschärfungen/Sanktionen; armutsfeste Regelsätze, Schutz von Kindern; Weiterbildung statt Druck", idx: r(1,2,3,4,6,0,5) }] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "LINKE",
    lang: [
      { text: "Gegen Sanktionsverschärfungen als unverhältnismäßiger Angriff auf den Sozialstaat", idx: r(0,1,2,3,5,6) },
      { text: "Kritik an zu niedriger Bürgergeldausstattung (Armut trotz Bezug)", idx: r(4) },
    ],
    kurz: [{ text: "Gegen Sanktionsverschärfungen; Kritik an zu niedriger Ausstattung; Grundsicherung als echtes Sicherheitsnetz", idx: r(0,1,2,3,5,6,4) }] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "SPD",
    lang: [
      { text: "Reform mit Kooperationsplan und Balance: Förderung der Rückkehr in Arbeit, Sanktionen nur als letztes Mittel, Schutz von Kindern", idx: r(0,2,3,4) },
      { text: "Verteidigung des Bürgergelds gegen AfD; Weiterentwicklung statt Abschaffung", idx: r(1,5) },
    ],
    kurz: [{ text: "Reform mit Kooperationsplan und Balance (Sanktionen nur als letztes Mittel, Kinder schützen); Weiterentwicklung statt Abschaffung", idx: r(0,2,3,4,1,5) }] },

  // ===== Entgeltgleichheit =====
  { aspekt: "Entgeltgleichheit", partei: "AfD",
    lang: [{ text: "Gleiche Bezahlung von festen Beschäftigten und Leiharbeitnehmern", idx: r(0) }],
    kurz: [{ text: "Gleiche Bezahlung von festen Beschäftigten und Leiharbeitnehmern", idx: r(0) }] },
  { aspekt: "Entgeltgleichheit", partei: "CDU/CSU",
    lang: [{ text: "Kritik an unterschiedlichen Arbeitsbedingungen für dieselbe Tätigkeit im selben Betrieb", idx: r(0) }],
    kurz: [{ text: "Kritik an unterschiedlichen Bedingungen für dieselbe Tätigkeit im Betrieb", idx: r(0) }] },
  { aspekt: "Entgeltgleichheit", partei: "GRÜNE",
    lang: [{ text: "Mindestlohnerhöhung gegen den Gender-Pay-Gap; Steuerklassenreform zur Entlastung von Zweitverdienenden", idx: r(0,1) }],
    kurz: [{ text: "Mindestlohnerhöhung gegen Gender-Pay-Gap; Steuerklassenreform", idx: r(0,1) }] },

  // ===== Fachkräfte =====
  { aspekt: "Fachkräfte", partei: "AfD",
    lang: [
      { text: "Fachkräftemangel durch eigene Ausbildung/Qualifizierung lösen, nicht durch Zuwanderung", idx: r(0,3,6,9,11,16) },
      { text: "Kritik an Arbeitsplatzabbau in Industrie/Automobil durch grüne Politik und Regulierung", idx: r(5,7,12,13) },
      { text: "Ältere halten (Steuerfreibetrag); Standortbedingungen statt Arbeitszeit-Flexibilisierung", idx: r(1,4,17,18,14) },
      { text: "Mangel als Belastung anerkannt; Pflege; Ingenieursgeist statt Staat; ÖPNV-Umschulung", idx: r(8,10,19,15,2) },
    ],
    kurz: [
      { text: "Fachkräftemangel durch eigene Ausbildung/Qualifizierung lösen, nicht durch Zuwanderung; Ältere halten", idx: r(0,3,6,9,11,16,1,4,17,18,14) },
      { text: "Kritik an Arbeitsplatzabbau in Industrie/Auto durch grüne Politik; Pflege; weitere Punkte", idx: r(5,7,12,13,8,10,19,15,2) },
    ] },
  { aspekt: "Fachkräfte", partei: "CDU/CSU",
    lang: [
      { text: "Gesteuerte Fachkräftezuwanderung notwendig (Work-and-Stay-Agentur, getrennt von Asylmigration)", idx: r(4,6,7,8,9) },
      { text: "Ältere im Arbeitsmarkt halten (Aktivrente, Wissenstransfer); flexible Modelle zur Bindung", idx: r(12,14,18,21,22,10,11,13) },
      { text: "Pflege-/Handwerks-Fachkräfte; Arbeitsplätze sichern (Auto); Tarif als Fachkräftesicherung", idx: r(2,15,16,17,19,0,20,3) },
      { text: "Ukraine-Arbeitsmarktzugang; Demografie; 1,1 Mio. offene Stellen", idx: r(1,5,23) },
    ],
    kurz: [
      { text: "Gesteuerte Fachkräftezuwanderung (Work-and-Stay, getrennt von Asyl); Ältere halten (Aktivrente)", idx: r(4,6,7,8,9,12,14,18,21,22,10,11,13) },
      { text: "Pflege-/Handwerks-Fachkräfte; Arbeitsplätze sichern; Tarif; Ukraine-Zugang; Demografie", idx: r(2,15,16,17,19,0,20,3,1,5,23) },
    ] },
  { aspekt: "Fachkräfte", partei: "GRÜNE",
    lang: [
      { text: "Strukturelle Lösungen (Anerkennung von Abschlüssen, Kita, Pflegeinfrastruktur) statt Abbau von Gesundheitsschutz", idx: r(5,6,7) },
      { text: "Migration und Geflüchtete als Chance; Verfahren vereinfachen", idx: r(1,8) },
      { text: "Aktivrente unzureichend; Kritik an Helferjob-Vermittlung; Saisonarbeiter; Handwerk", idx: r(2,4,3,0,9) },
    ],
    kurz: [
      { text: "Strukturelle Lösungen (Anerkennung, Kita, Pflegeinfrastruktur) statt Gesundheitsschutzabbau; Migration als Chance", idx: r(5,6,7,1,8) },
      { text: "Aktivrente unzureichend; gegen Helferjob-Vermittlung; Saisonarbeiter; Handwerk", idx: r(2,4,3,0,9) },
    ] },
  { aspekt: "Fachkräfte", partei: "LINKE",
    lang: [
      { text: "Fachkräftemangel durch schlechte Arbeitsbedingungen → bessere Bedingungen und Ausbildung", idx: r(4,8,1,6,9) },
      { text: "Industriearbeitsplätze sichern (Auto, Bosch, Stahl) statt Standortschließungen", idx: r(0,2,5) },
      { text: "Zuwanderung plus inländische Potenziale; Kritik an Abschiebung von Beschäftigten", idx: r(3,7) },
    ],
    kurz: [
      { text: "Fachkräftemangel durch schlechte Bedingungen → bessere Bedingungen und Ausbildung; Industriearbeitsplätze sichern", idx: r(4,8,1,6,9,0,2,5) },
      { text: "Zuwanderung plus inländische Potenziale; Kritik an Abschiebung von Beschäftigten", idx: r(3,7) },
    ] },
  { aspekt: "Fachkräfte", partei: "SPD",
    lang: [
      { text: "Erwerbsbeteiligung erhöhen (Frauen, Migrant:innen) und ausländische Abschlüsse besser anerkennen", idx: r(1,4,5,7) },
      { text: "Pflegeausbildung mit Aufstiegsperspektiven; Qualifizierung bei Transformation; Wissenschaft", idx: r(0,8,2,3) },
      { text: "Arbeitslosigkeit auch unter Fachkräften (Auto/Zulieferer)", idx: r(6) },
    ],
    kurz: [
      { text: "Erwerbsbeteiligung erhöhen (Frauen, Migrant:innen), Abschlüsse anerkennen; Pflegeausbildung; Qualifizierung", idx: r(1,4,5,7,0,8,2,3) },
      { text: "Arbeitslosigkeit auch unter Fachkräften (Auto/Zulieferer)", idx: r(6) },
    ] },

  // ===== Langzeitarbeitslose / sozialer Arbeitsmarkt =====
  { aspekt: "Langzeitarbeitslose / sozialer Arbeitsmarkt", partei: "AfD",
    lang: [
      { text: "Dauerhaft Arbeitsunfähige ins SGB XII/zu Sozialämtern; bessere Erwerbsfähigkeitsprüfung", idx: r(0,3) },
      { text: "Verpflichtende gemeinnützige Arbeit nach sechs Monaten; Kritik an nicht umgesetzter Integration", idx: r(1,2,4) },
    ],
    kurz: [{ text: "Arbeitsunfähige zu Sozialämtern; verpflichtende gemeinnützige Arbeit nach sechs Monaten", idx: r(0,3,1,2,4) }] },
  { aspekt: "Langzeitarbeitslose / sozialer Arbeitsmarkt", partei: "CDU/CSU",
    lang: [{ text: "Vermittlungsvorrang und Eigenverantwortung; Integration in reguläre Arbeit durch stärkere Jobcenter", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Vermittlungsvorrang und Eigenverantwortung; Integration in reguläre Arbeit", idx: r(0,1,2,3,4) }] },
  { aspekt: "Langzeitarbeitslose / sozialer Arbeitsmarkt", partei: "GRÜNE",
    lang: [
      { text: "Sanktionen als ineffektiv/kontraproduktiv; individuelle Unterstützung", idx: r(0,2) },
      { text: "Sozialer Arbeitsmarkt mit ausreichenden Mitteln", idx: r(1) },
    ],
    kurz: [{ text: "Sanktionen kontraproduktiv, individuelle Unterstützung; sozialer Arbeitsmarkt mit Mitteln", idx: r(0,2,1) }] },
  { aspekt: "Langzeitarbeitslose / sozialer Arbeitsmarkt", partei: "LINKE",
    lang: [{ text: "Stärkenorientierte Vermittlung statt Sanktionen; Unterstützung in benachteiligten Bezirken", idx: r(0,1) }],
    kurz: [{ text: "Stärkenorientierte Vermittlung statt Sanktionen; Unterstützung benachteiligter Bezirke", idx: r(0,1) }] },
  { aspekt: "Langzeitarbeitslose / sozialer Arbeitsmarkt", partei: "SPD",
    lang: [{ text: "Stärkung und Ausweitung des sozialen Arbeitsmarkts mit echten Chancen statt Abstellgleis", idx: r(0,1) }],
    kurz: [{ text: "Sozialen Arbeitsmarkt stärken und ausweiten (echte Chancen)", idx: r(0,1) }] },

  // ===== Mindestlohn =====
  { aspekt: "Mindestlohn", partei: "AfD",
    lang: [
      { text: "Mindestlohnhöhe durch unabhängige Kommission statt politischer Festsetzung; gegen Erhöhung auf 15 €", idx: r(2,4,5) },
      { text: "Warnung vor Schäden für kleine Betriebe; Entlastung über Steuern statt Mindestlohn; Mindestlohnbetrug bestrafen", idx: r(1,6,0,3) },
    ],
    kurz: [{ text: "Mindestlohnhöhe durch Kommission statt Politik; gegen Erhöhung auf 15 €; Entlastung über Steuern", idx: r(2,4,5,1,6,0,3) }] },
  { aspekt: "Mindestlohn", partei: "CDU/CSU",
    lang: [
      { text: "Bekenntnis zum gesetzlichen Mindestlohn über die unabhängige Kommission; gegen politische Eingriffe", idx: r(0,3,4) },
      { text: "Bestehende Regeln konsequenter durchsetzen; Tariftreuegesetz für faire Löhne", idx: r(1,2) },
    ],
    kurz: [{ text: "Gesetzlicher Mindestlohn über die unabhängige Kommission, gegen politische Eingriffe; Durchsetzung statt neuer Verbote", idx: r(0,3,4,1,2) }] },
  { aspekt: "Mindestlohn", partei: "GRÜNE",
    lang: [
      { text: "Erhöhung auf 15 € / 60 % des Medianlohns als Untergrenze; bessere Mindestlohnkommission", idx: r(5,0) },
      { text: "Durchsetzungs-/Kontrollprobleme (v. a. Subunternehmer, Plattformen); Kritik an Billiglöhnen", idx: r(1,3,4,6,2) },
    ],
    kurz: [{ text: "Erhöhung auf 15 € / 60 % des Medianlohns; Durchsetzung und Kontrolle (Subunternehmer, Plattformen)", idx: r(5,0,1,3,4,6,2) }] },
  { aspekt: "Mindestlohn", partei: "LINKE",
    lang: [
      { text: "Armutsfester Mindestlohn von 15 €, gesetzlich festgelegt statt durch die Kommission", idx: r(0,1,2,3,4,11) },
      { text: "Kontrolle und Durchsetzung gegen Unterlaufung (Paketbranche, Mietabzüge); Verbandsklagerecht", idx: r(6,10,12) },
      { text: "Kritik an Niedriglöhnen (Handwerk, Saisonarbeit); Lohndruck nicht durch Migration", idx: r(5,7,9,8) },
    ],
    kurz: [
      { text: "Armutsfester Mindestlohn 15 €, gesetzlich festgelegt; Kontrolle und Durchsetzung gegen Unterlaufung", idx: r(0,1,2,3,4,11,6,10,12) },
      { text: "Kritik an Niedriglöhnen; Lohndruck nicht durch Migration", idx: r(5,7,9,8) },
    ] },
  { aspekt: "Mindestlohn", partei: "SPD",
    lang: [
      { text: "Mindestlohn auf 15 € erhöhen", idx: r(5,6) },
      { text: "Faire Löhne durch Tarifbindung, gegen Lohndumping; EU-weite Standards", idx: r(0,1,2,3,4) },
    ],
    kurz: [{ text: "Mindestlohn auf 15 € erhöhen; faire Löhne durch Tarifbindung, gegen Lohndumping; EU-Standards", idx: r(5,6,0,1,2,3,4) }] },

  // ===== Minijobs =====
  { aspekt: "Minijobs", partei: "AfD",
    lang: [{ text: "Ältere Minijobber sollen Stunden bis zur angehobenen Steuerfreigrenze aufstocken", idx: r(0) }],
    kurz: [{ text: "Ältere Minijobber bis zur Steuerfreigrenze aufstocken", idx: r(0) }] },
  { aspekt: "Minijobs", partei: "CDU/CSU",
    lang: [{ text: "Rentner in Minijobs wollen wegen Steuervorgaben nicht ausweiten", idx: r(0) }],
    kurz: [{ text: "Rentner-Minijobs: Ausweitung an Steuervorgaben gehemmt", idx: r(0) }] },
  { aspekt: "Minijobs", partei: "GRÜNE",
    lang: [{ text: "Kritik an sozialversicherungsfreier Saisonarbeit (70→90 Tage); Minijobs als Teilzeitfalle", idx: r(0,1) }],
    kurz: [{ text: "Kritik an SV-freier Saisonarbeit; Minijobs als Teilzeitfalle", idx: r(0,1) }] },
  { aspekt: "Minijobs", partei: "LINKE",
    lang: [{ text: "Kritik an Ausweitung der SV-freien Saisonarbeit von 70 auf 90 Tage", idx: r(0) }],
    kurz: [{ text: "Kritik an SV-freier Saisonarbeit (70→90 Tage)", idx: r(0) }] },
  { aspekt: "Minijobs", partei: "SPD",
    lang: [{ text: "Befreiung von der Rentenversicherungspflicht bei Minijobs widerrufbar machen", idx: r(0) }],
    kurz: [{ text: "RV-Pflicht-Befreiung bei Minijobs widerrufbar machen", idx: r(0) }] },

  // ===== Tarifbindung =====
  { aspekt: "Tarifbindung", partei: "AfD",
    lang: [
      { text: "Ablehnung des Tariftreuegesetzes als staatliches Lohndiktat/Bürokratie und Verletzung der Tarifautonomie", idx: r(0,2,3,4,5,6,8) },
      { text: "Marktkräfte regeln Löhne; Tarifautonomie als Errungenschaft, für freiwillige Tarifbindung", idx: r(1,7) },
    ],
    kurz: [{ text: "Ablehnung des Tariftreuegesetzes als Zwang/Bürokratie; für freiwillige Tarifbindung und Tarifautonomie", idx: r(0,2,3,4,5,6,8,1,7) }] },
  { aspekt: "Tarifbindung", partei: "CDU/CSU",
    lang: [
      { text: "Befürwortung des Tariftreuegesetzes, aber mit Bedenken (Bürokratie, Mittelstand, negative Koalitionsfreiheit)", idx: r(0,2,3,4,5,8,11) },
      { text: "Tarifbindung über Anreize statt Zwang stärken; sinkende Tarifbindung strukturell stabilisieren", idx: r(1,7,9,10,6) },
    ],
    kurz: [{ text: "Befürwortung des Tariftreuegesetzes mit Bedenken (Bürokratie/Mittelstand); Tarifbindung über Anreize statt Zwang stärken", idx: r(0,2,3,4,5,8,11,1,7,9,10,6) }] },
  { aspekt: "Tarifbindung", partei: "GRÜNE",
    lang: [
      { text: "Erhöhung der Tarifbindung als Priorität (leichtere Allgemeinverbindlichkeit, niedrigere Schwellen im Tariftreuegesetz)", idx: r(0,5,6,7) },
      { text: "Kritik an Plattform-/Subunternehmer-Modellen ohne Tarif; Direktanstellungsgebot", idx: r(1,2,4,8) },
      { text: "Flexiblere Ausnahmen für Start-ups in der Gründungsphase", idx: r(3) },
    ],
    kurz: [
      { text: "Erhöhung der Tarifbindung als Priorität (Allgemeinverbindlichkeit, niedrigere Schwellen)", idx: r(0,5,6,7) },
      { text: "Kritik an Plattform-/Subunternehmer-Modellen ohne Tarif; Direktanstellung; Start-up-Ausnahme", idx: r(1,2,4,8,3) },
    ] },
  { aspekt: "Tarifbindung", partei: "LINKE",
    lang: [
      { text: "Stärkung der Tarifbindung gegen Tarifflucht (Tariftreuegesetz, Allgemeinverbindlichkeit, Subunternehmerketten)", idx: r(1,3,4,6,7,8,9,14) },
      { text: "Tarif als Bedingung für öffentliche Aufträge/Förderung; Branchen (Auto, Stahl, Handwerk); Doktoranden", idx: r(10,15,2,5,12,11) },
      { text: "Kritik an Sanktionsdruck und am AfD-Antrag", idx: r(13,0) },
    ],
    kurz: [
      { text: "Stärkung der Tarifbindung gegen Tarifflucht (Tariftreuegesetz, Allgemeinverbindlichkeit); Tarif als Förderbedingung", idx: r(1,3,4,6,7,8,9,14,10,15,2,5,12,11) },
      { text: "Kritik an Sanktionsdruck und am AfD-Antrag", idx: r(13,0) },
    ] },
  { aspekt: "Tarifbindung", partei: "SPD",
    lang: [
      { text: "Befürwortung des Bundestariftreuegesetzes (öffentliche Aufträge, gegen Lohndumping)", idx: r(1,4,6,7,10,13,16) },
      { text: "Stärkung der Tarifbindung gegen den Rückgang; steuerliche Förderung von Gewerkschaftsmitgliedschaft", idx: r(2,3,11,14,15,17,5) },
      { text: "Vorteile der Tarifbindung; Forschung; wöchentliche Höchstarbeitszeit", idx: r(0,9,8,12) },
    ],
    kurz: [
      { text: "Befürwortung des Bundestariftreuegesetzes (öffentliche Aufträge, gegen Dumping); Stärkung gegen den Rückgang", idx: r(1,4,6,7,10,13,16,2,3,11,14,15,17,5) },
      { text: "Vorteile der Tarifbindung; Forschung; wöchentliche Höchstarbeitszeit", idx: r(0,9,8,12) },
    ] },

  // ===== Ukraine-Flüchtlinge im Bürgergeld =====
  { aspekt: "Ukraine-Flüchtlinge im Bürgergeld", partei: "AfD",
    lang: [{ text: "Rückstufung in Asylbewerberleistungen zur Kostensenkung; Kritik an Bürgergeld für ukrainische Flüchtlinge", idx: r(0,1,2,3) }],
    kurz: [{ text: "Rückstufung in Asylbewerberleistungen; Kritik an Bürgergeld für ukrainische Flüchtlinge", idx: r(0,1,2,3) }] },
  { aspekt: "Ukraine-Flüchtlinge im Bürgergeld", partei: "CDU/CSU",
    lang: [{ text: "Mitwirkung und Integration ab dem ersten Tag (Arbeitsbemühungen, Integrationskurse)", idx: r(0) }],
    kurz: [{ text: "Mitwirkung und Integration ab dem ersten Tag", idx: r(0) }] },

  // ===== Weiterbildung & Ausbildung =====
  { aspekt: "Weiterbildung & Ausbildung", partei: "AfD",
    lang: [
      { text: "Ausbildung der eigenen Jugend, MINT-Förderung, starke duale Ausbildung und kostenfreie Meisterausbildung", idx: r(0,5) },
      { text: "Pflegefachassistenz-Ausbildung mit Vorbehalten; Fortbildung bei Automatisierung; Präsenz vor Fernunterricht", idx: r(2,7,6,3) },
      { text: "Kritik an unrealistischem Umschulungs-Zeitrahmen und an fehlenden Perspektiven in der Krise", idx: r(1,4) },
    ],
    kurz: [
      { text: "Ausbildung der eigenen Jugend, MINT, duale Ausbildung und kostenfreie Meisterausbildung; Fortbildung bei Automatisierung", idx: r(0,5,2,7,6,3) },
      { text: "Kritik an unrealistischem Umschulungs-Zeitrahmen und fehlenden Perspektiven", idx: r(1,4) },
    ] },
  { aspekt: "Weiterbildung & Ausbildung", partei: "CDU/CSU",
    lang: [
      { text: "Duale Ausbildung und Handwerk aufwerten gegen einseitige Akademisierung", idx: r(2,7,8) },
      { text: "Pflegefachassistenz-Ausbildung mit Vergütung und durchlässigen Karrierewegen", idx: r(4,5) },
      { text: "Qualifizierung in Beratungsgesprächen; Aktivrente/Wissenstransfer; Fahrer-Fortbildung; Ergonomie-Schulung", idx: r(1,3,9,6,0) },
    ],
    kurz: [
      { text: "Duale Ausbildung/Handwerk aufwerten; Pflegefachassistenz mit Vergütung und Karrierewegen", idx: r(2,7,8,4,5) },
      { text: "Qualifizierung in Beratung; Aktivrente/Wissenstransfer; Fahrer-Fortbildung; Ergonomie", idx: r(1,3,9,6,0) },
    ] },
  { aspekt: "Weiterbildung & Ausbildung", partei: "GRÜNE",
    lang: [
      { text: "Qualifizierung, Abschlussförderung und Umschulung statt Helferjobs und Sanktionen", idx: r(0,2,3) },
      { text: "Berufliche Bildung gleichwertig zur akademischen stärken (Handwerk, Mittelstand); längeres Arbeiten via Weiterbildung", idx: r(4,5,1) },
    ],
    kurz: [{ text: "Qualifizierung/Umschulung statt Helferjobs und Sanktionen; berufliche Bildung gleichwertig stärken", idx: r(0,2,3,4,5,1) }] },
  { aspekt: "Weiterbildung & Ausbildung", partei: "LINKE",
    lang: [
      { text: "Investitionen in Berufsschulen, überbetriebliche Ausbildung und kostenfreie Meisterbriefe", idx: r(0,7,9) },
      { text: "Weiterbildung statt Sanktionen und Entlassungen (auch im industriellen Wandel)", idx: r(1,3,5,6) },
      { text: "Duale Ausbildung reformieren (Vergütung, Sprachförderung); Umschulungen; pädagogisches Fachpersonal", idx: r(8,4,2) },
    ],
    kurz: [
      { text: "Investitionen in Berufsschulen/überbetriebliche Ausbildung und kostenfreie Meisterbriefe; Weiterbildung statt Sanktionen", idx: r(0,7,9,1,3,5,6) },
      { text: "Duale Ausbildung reformieren; Umschulungen; pädagogisches Fachpersonal", idx: r(8,4,2) },
    ] },
  { aspekt: "Weiterbildung & Ausbildung", partei: "SPD",
    lang: [
      { text: "Bundeseinheitliche Pflegefachassistenz-Ausbildung mit Vergütung und Durchlässigkeit", idx: r(0,7) },
      { text: "Investitionen in Weiterbildung und Berufsabschlüsse (Transformation, junge Menschen, Bürgergeldbeziehende)", idx: r(1,4,5,6) },
      { text: "Anerkennung ausländischer Qualifikationen; Reha-Rückkehr in den Beruf", idx: r(3,2) },
    ],
    kurz: [
      { text: "Bundeseinheitliche Pflegefachassistenz-Ausbildung; Investitionen in Weiterbildung und Berufsabschlüsse", idx: r(0,7,1,4,5,6) },
      { text: "Anerkennung ausländischer Qualifikationen; Reha-Rückkehr in den Beruf", idx: r(3,2) },
    ] },
];

applySynthese("Arbeit und Beschäftigung", CELLS);
