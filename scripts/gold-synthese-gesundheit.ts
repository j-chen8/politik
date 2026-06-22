/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Gesundheit" (59 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Arzneimittelversorgung =====
  { aspekt: "Arzneimittelversorgung", partei: "AfD",
    lang: [
      { text: "Medikamentenpreise senken (Mehrwertsteuer auf 7 %, Preisbegrenzung)", idx: r(2,3,7) },
      { text: "Vor-Ort-Apotheken sichern (höheres Fixum), besonders im ländlichen Raum; gegen Aufgabenverlagerung", idx: r(6,8) },
      { text: "Lieferengpässe beheben; gegen Preisregulierung als planwirtschaftlichen Innovationskiller; Orphan Drugs nur bei Nutzen", idx: r(0,5,4,1) },
    ],
    kurz: [
      { text: "Medikamentenpreise senken (MwSt auf 7 %); Vor-Ort-Apotheken sichern (Fixum)", idx: r(2,3,7,6,8) },
      { text: "Lieferengpässe beheben; gegen Preisregulierung als Innovationskiller", idx: r(0,5,4,1) },
    ] },
  { aspekt: "Arzneimittelversorgung", partei: "CDU/CSU",
    lang: [
      { text: "Vor-Ort-Apotheken stärken (Fixum, pharmazeutische Dienstleistungen) gegen Versandhandelskonkurrenz", idx: r(1,3,4,6,9,11,12) },
      { text: "Faire Preise für Innovation; gegen pauschale Herstellerrabatte/Preisobergrenzen (Versorgungssicherheit)", idx: r(2,5,7,13,14,15) },
      { text: "Monitoring nichtinvasiver Pränataltests (NIPT); Versorgung chronisch Kranker auch für Asylbewerber", idx: r(8,10,0) },
    ],
    kurz: [
      { text: "Vor-Ort-Apotheken stärken (Fixum, pharmazeutische Dienstleistungen) gegen Versandhandel", idx: r(1,3,4,6,9,11,12) },
      { text: "Faire Preise für Innovation, gegen pauschale Rabatte; NIPT-Monitoring", idx: r(2,5,7,13,14,15,8,10,0) },
    ] },
  { aspekt: "Arzneimittelversorgung", partei: "GRÜNE",
    lang: [
      { text: "Arzneimittelpreise an den Zusatznutzen koppeln und senken; höhere Herstellerrabatte", idx: r(1,2,4,6,8,9,11) },
      { text: "Gezielte statt pauschale Apothekenförderung (Fokus ländlicher Raum)", idx: r(5,7) },
      { text: "Antibiotika in der Tierhaltung; Infektionskrankheiten behandeln; Cannabis-Fernverschreibung", idx: r(3,0,10) },
    ],
    kurz: [
      { text: "Arzneimittelpreise an den Zusatznutzen koppeln und senken; gezielte Apothekenförderung", idx: r(1,2,4,6,8,9,11,5,7) },
      { text: "Antibiotika in der Tierhaltung; Cannabis-Fernverschreibung", idx: r(3,0,10) },
    ] },
  { aspekt: "Arzneimittelversorgung", partei: "LINKE",
    lang: [
      { text: "Staatliche Preisregulierung gegen Pharmaprofite (auch europäische Beschaffung, öffentliche Forschung)", idx: r(0,3,4,6,7) },
      { text: "Vor-Ort-Apotheken (Fixum) gegen Versandhandel und Privatisierung sichern", idx: r(2,8) },
      { text: "Fokus auf Cannabis statt gefährlichere Medikamente kritisiert; ergebnisoffene NIPT-Beratung", idx: r(1,5) },
    ],
    kurz: [
      { text: "Staatliche Preisregulierung gegen Pharmaprofite; Vor-Ort-Apotheken gegen Versandhandel sichern", idx: r(0,3,4,6,7,2,8) },
      { text: "Cannabis-Fokus statt gefährlicherer Medikamente kritisiert; ergebnisoffene NIPT-Beratung", idx: r(1,5) },
    ] },
  { aspekt: "Arzneimittelversorgung", partei: "SPD",
    lang: [
      { text: "Vor-Ort-Apotheken flächendeckend stärken (Fixum, pharmazeutische Dienstleistungen, ländlicher Raum)", idx: r(1,3,4,6) },
      { text: "Preisbildung in der Balance von Versorgungssicherheit und Bezahlbarkeit; evidenzbasierte Steuerung", idx: r(2,7) },
      { text: "Zugang zu pränatalen Gentests mit besserer Beratung und Erfassung der Auswirkungen", idx: r(0,5) },
    ],
    kurz: [
      { text: "Vor-Ort-Apotheken flächendeckend stärken; Preisbildung in der Balance von Versorgung und Bezahlbarkeit", idx: r(1,3,4,6,2,7) },
      { text: "Zugang zu pränatalen Gentests mit besserer Beratung", idx: r(0,5) },
    ] },

  // ===== Cannabis / Drogen =====
  { aspekt: "Cannabis / Drogen", partei: "AfD",
    lang: [
      { text: "Strikte Regulierung von medizinischem Cannabis (Arztkontakt, Versandverbot)", idx: r(0) },
      { text: "Besserer Vollzug bei neuen psychoaktiven Stoffen (Lachgas, K.-o.-Tropfen); Jugendaufklärung", idx: r(1,2) },
    ],
    kurz: [{ text: "Strikte Cannabis-Regulierung; besserer Vollzug bei Lachgas/K.-o.-Tropfen", idx: r(0,1,2) }] },
  { aspekt: "Cannabis / Drogen", partei: "CDU/CSU",
    lang: [{ text: "Regulierung von Lachgas und K.-o.-Tropfen zum Schutz Minderjähriger (ohne legale Verwendung zu verhindern)", idx: r(0,1) }],
    kurz: [{ text: "Regulierung von Lachgas und K.-o.-Tropfen zum Schutz Minderjähriger", idx: r(0,1) }] },
  { aspekt: "Cannabis / Drogen", partei: "GRÜNE",
    lang: [{ text: "Gegen einseitige Verschärfung der Regeln für medizinisches Cannabis; ganzheitliche Reform statt Stigmatisierung", idx: r(0) }],
    kurz: [{ text: "Gegen einseitige Verschärfung bei medizinischem Cannabis; ganzheitliche Reform", idx: r(0) }] },
  { aspekt: "Cannabis / Drogen", partei: "LINKE",
    lang: [
      { text: "Gegen Prohibition (NpSG ineffektiv); Prävention, Aufklärung und Gewaltschutz statt Verbote", idx: r(0,1) },
      { text: "Gegen Verschärfung der Cannabisregeln; legale Bezugswege statt Schwarzmarkt", idx: r(2) },
    ],
    kurz: [{ text: "Gegen Prohibition (Prävention statt Verbote); gegen Cannabis-Verschärfung, legale Bezugswege", idx: r(0,1,2) }] },
  { aspekt: "Cannabis / Drogen", partei: "SPD",
    lang: [
      { text: "Regulierung von Lachgas, GBL und BDO gegen Missbrauch, Schutz Minderjähriger", idx: r(0) },
      { text: "Medizinisches Cannabis als sicheres Arzneimittel (auch Telemedizin/Versand im ländlichen Raum)", idx: r(1) },
    ],
    kurz: [{ text: "Regulierung von Lachgas/GBL gegen Missbrauch; medizinisches Cannabis als sicheres Arzneimittel", idx: r(0,1) }] },

  // ===== Digitalisierung (ePA) =====
  { aspekt: "Digitalisierung (ePA)", partei: "AfD",
    lang: [
      { text: "Kritik an ineffektiver Umsetzung, die mehr statt weniger Bürokratie schafft; vollständige Gegenfinanzierung gefordert", idx: r(1,2,5) },
      { text: "Telemedizin und digitalen Abgleich/Ersteinschätzung befürworten", idx: r(0,3) },
      { text: "Warnung vor autonomer Steuerung ohne ärztliche Verantwortung; Ablehnung als Eingriff in Freiheitsrechte", idx: r(4,6) },
    ],
    kurz: [
      { text: "Kritik an ineffektiver Umsetzung (mehr Bürokratie); Telemedizin/digitalen Abgleich befürworten", idx: r(1,2,5,0,3) },
      { text: "Warnung vor autonomer Steuerung ohne Arzt; Ablehnung als Freiheitsrechtseingriff", idx: r(4,6) },
    ] },
  { aspekt: "Digitalisierung (ePA)", partei: "CDU/CSU",
    lang: [
      { text: "ePA und Digitalisierung befürworten; Notfall-Vernetzung (112/116117) und KI-Ersteinschätzung", idx: r(0,1,2,4,5,6,9) },
      { text: "Schrittweise, praktikable Umsetzung; Anerkennungsverfahren und Versorgungszentren digital", idx: r(7,3,8) },
    ],
    kurz: [
      { text: "ePA und Digitalisierung befürworten; Notfall-Vernetzung (112/116117) und KI-Ersteinschätzung", idx: r(0,1,2,4,5,6,9) },
      { text: "Schrittweise, praktikable Umsetzung", idx: r(7,3,8) },
    ] },
  { aspekt: "Digitalisierung (ePA)", partei: "GRÜNE",
    lang: [
      { text: "Telemedizin und digitale Kontaktaufnahme als Entlastung (digital vor ambulant vor stationär)", idx: r(0,1) },
      { text: "Kritik an Kürzung des Innovationsfonds und fehlender Unterstützung für Digitalisierung", idx: r(2) },
    ],
    kurz: [{ text: "Telemedizin/digitale Kontaktaufnahme als Entlastung; Kritik an Innovationsfonds-Kürzung", idx: r(0,1,2) }] },
  { aspekt: "Digitalisierung (ePA)", partei: "SPD",
    lang: [
      { text: "Digitalisierung und ePA für Bürokratieabbau und medienbruchfreie Vernetzung (auch Notfallversorgung)", idx: r(0,1,3,4) },
      { text: "Digitalisierung als Unterstützung, die menschliche Zuwendung nicht ersetzt", idx: r(2) },
    ],
    kurz: [{ text: "Digitalisierung/ePA für Bürokratieabbau und Vernetzung; ersetzt aber keine menschliche Zuwendung", idx: r(0,1,3,4,2) }] },

  // ===== Impfen =====
  { aspekt: "Impfen", partei: "AfD",
    lang: [
      { text: "Kritik an Impfzwang, an WHO-Empfehlungen und an Corona-Impfungen (Nebenwirkungen, Aufarbeitung)", idx: r(0,1,4,5) },
      { text: "Gegen Impfungen in Apotheken ohne ärztliche Betreuung", idx: r(2,3) },
    ],
    kurz: [
      { text: "Kritik an Impfzwang, WHO-Empfehlungen und Corona-Impfungen (Nebenwirkungen)", idx: r(0,1,4,5) },
      { text: "Gegen Impfungen in Apotheken ohne ärztliche Betreuung", idx: r(2,3) },
    ] },
  { aspekt: "Impfen", partei: "CDU/CSU",
    lang: [
      { text: "Impfkompetenzen auf Apotheken/pharmazeutisches Personal übertragen (ärztliche Schulung)", idx: r(0,1,2) },
      { text: "Verteidigung des Impfens gegen Verschwörungstheorien; Impfungen für Asylbewerber", idx: r(3,5,4) },
    ],
    kurz: [{ text: "Impfkompetenzen auf Apotheken übertragen; Verteidigung des Impfens gegen Verschwörungstheorien", idx: r(0,1,2,3,5,4) }] },
  { aspekt: "Impfen", partei: "GRÜNE",
    lang: [{ text: "Hohe Impfquote zur Vermeidung von Krankheitsausbrüchen", idx: r(0) }],
    kurz: [{ text: "Hohe Impfquote zur Vermeidung von Krankheitsausbrüchen", idx: r(0) }] },
  { aspekt: "Impfen", partei: "LINKE",
    lang: [{ text: "Gerechter globaler Zugang zu Impfstoffen unabhängig von wirtschaftlicher Leistungsfähigkeit", idx: r(0,1) }],
    kurz: [{ text: "Gerechter globaler Zugang zu Impfstoffen", idx: r(0,1) }] },
  { aspekt: "Impfen", partei: "SPD",
    lang: [
      { text: "Impfkompetenz von Apotheken ausweiten (ärztliche Schulung) zur Stärkung der Impfquoten", idx: r(0,1,3) },
      { text: "Kritik an Streichung von Impfungen für Geflüchtete als Gefahr für die öffentliche Gesundheit", idx: r(2) },
    ],
    kurz: [{ text: "Impfkompetenz von Apotheken ausweiten; gegen Streichung von Impfungen für Geflüchtete", idx: r(0,1,3,2) }] },

  // ===== Krankenhausfinanzierung (Fallpauschalen) =====
  { aspekt: "Krankenhausfinanzierung (Fallpauschalen)", partei: "AfD",
    lang: [
      { text: "Gegen Fallpauschalen/DRG als Ursache von Schließungen und Übertherapie; Systemwechsel zur Vorhaltefinanzierung", idx: r(1,5,6,7,8,10) },
      { text: "Auskömmliche, verlässliche Finanzierung statt Sparmaßnahmen (Inflationsausgleich, Planungssicherheit)", idx: r(0,3,4,9,11) },
      { text: "Warnung vor Klinikschließungen auf dem Land", idx: r(2,12) },
    ],
    kurz: [
      { text: "Gegen Fallpauschalen als Ursache von Schließungen und Übertherapie; auskömmliche Finanzierung statt Sparen", idx: r(1,5,6,7,8,10,0,3,4,9,11) },
      { text: "Warnung vor Klinikschließungen auf dem Land", idx: r(2,12) },
    ] },
  { aspekt: "Krankenhausfinanzierung (Fallpauschalen)", partei: "CDU/CSU",
    lang: [
      { text: "Krankenhausreform mit Ambulantisierung und Effizienzsteigerung statt Leistungskürzungen", idx: r(2,3,4,5,6,8) },
      { text: "Vermittlungsausschuss-Sparbeiträge; gegen Kürzungen bei Krankengeld/Psychotherapie", idx: r(7,1,0) },
    ],
    kurz: [
      { text: "Krankenhausreform mit Ambulantisierung und Effizienzsteigerung statt Leistungskürzungen", idx: r(2,3,4,5,6,8) },
      { text: "Vermittlungsausschuss-Sparbeiträge; gegen Kürzungen bei Krankengeld/Psychotherapie", idx: r(7,1,0) },
    ] },
  { aspekt: "Krankenhausfinanzierung (Fallpauschalen)", partei: "GRÜNE",
    lang: [
      { text: "Gegen Verzögerung/Rückabwicklung der Krankenhausreform; Qualitätskriterien und Spezialisierung sichern", idx: r(0,2,4,9,11,12) },
      { text: "Kritik an Spardruck und Unterfinanzierung (Insolvenzrisiko, Personalabbau)", idx: r(1,5,6,7,8) },
      { text: "Fehlanreize korrigieren, unnötige Operationen/Klinikaufenthalte reduzieren", idx: r(3,10) },
    ],
    kurz: [
      { text: "Gegen Verzögerung/Rückabwicklung der Reform; Qualität sichern; Kritik an Spardruck und Unterfinanzierung", idx: r(0,2,4,9,11,12,1,5,6,7,8) },
      { text: "Fehlanreize korrigieren, unnötige Klinikaufenthalte reduzieren", idx: r(3,10) },
    ] },
  { aspekt: "Krankenhausfinanzierung (Fallpauschalen)", partei: "LINKE",
    lang: [
      { text: "Gegen Fallpauschalen als Profitsystem auf Kosten der Versorgungsqualität (öffentliche Daseinsvorsorge)", idx: r(0,2,4,5,6) },
      { text: "Gegen Kürzungen und Unterfinanzierung der Krankenhäuser (auch im ländlichen Raum)", idx: r(1,3,7,8,9) },
    ],
    kurz: [
      { text: "Gegen Fallpauschalen als Profitsystem (öffentliche Daseinsvorsorge); gegen Kürzungen und Unterfinanzierung", idx: r(0,2,4,5,6,1,3,7,8,9) },
    ] },
  { aspekt: "Krankenhausfinanzierung (Fallpauschalen)", partei: "SPD",
    lang: [
      { text: "Reform von Fallpauschalen zur Vorhaltevergütung/Qualität, finanziert über einen Transformationsfonds", idx: r(0,1,7,9,10,11,13) },
      { text: "Beitragsstabilisierung durch begrenzte Vergütungsanstiege; bessere Steuerung und Vernetzung", idx: r(2,6,3,4,12) },
      { text: "Schwangerschaftsabbruch-Verbot durch Klinikträger ablehnen; Lehren aus der Pandemie", idx: r(5,8) },
    ],
    kurz: [
      { text: "Reform von Fallpauschalen zur Vorhaltevergütung/Qualität (Transformationsfonds); Beitragsstabilisierung", idx: r(0,1,7,9,10,11,13,2,6,3,4,12) },
      { text: "Kein Schwangerschaftsabbruch-Verbot durch Klinikträger; Lehren aus der Pandemie", idx: r(5,8) },
    ] },

  // ===== Krankenversicherung =====
  { aspekt: "Krankenversicherung", partei: "AfD",
    lang: [
      { text: "Gegen Bürgerversicherung; Verteidigung des dualen Systems aus GKV und PKV", idx: r(8,12) },
      { text: "Gegen Beitragserhöhungen und Leistungskürzungen; Bürokratieabbau und Effizienz; versicherungsfremde Leistungen aus dem Bundeshaushalt", idx: r(0,2,5,10,11,13) },
      { text: "Beitragsfreie Familienversicherung erhalten", idx: r(3,4,15) },
      { text: "Leistungen/Finanzierung für Ausländer und Bürgergeldempfänger kritisieren (höherer Bundeszuschuss); zu viele Kassen", idx: r(6,7,9,14,16,1) },
    ],
    kurz: [
      { text: "Gegen Bürgerversicherung, für das duale System; gegen Beitragserhöhungen/Leistungskürzungen; versicherungsfremde Leistungen aus Steuern", idx: r(8,12,0,2,5,10,11,13) },
      { text: "Familienversicherung erhalten; Kritik an Finanzierung für Ausländer/Bürgergeldempfänger", idx: r(3,4,15,6,7,9,14,16,1) },
    ] },
  { aspekt: "Krankenversicherung", partei: "CDU/CSU",
    lang: [
      { text: "Beitragsstabilität durch Strukturreformen und Einsparungen; gegen pauschale Beitragssenkung ohne Konzept", idx: r(2,3,5,6,8,9,10,14,15,17,18,20,21) },
      { text: "Verteidigung des dualen Systems und der PKV", idx: r(7,16,19) },
      { text: "Familienversicherung verteidigen; versicherungsfremde Leistungen/Finanzierungslücke; gegen höhere Beitragsbemessungsgrenze; Rettungsdienst nicht in die GKV; TSVG", idx: r(11,13,4,12,0,1) },
    ],
    kurz: [
      { text: "Beitragsstabilität durch Strukturreformen und Einsparungen; gegen pauschale Beitragssenkung", idx: r(2,3,5,6,8,9,10,14,15,17,18,20,21) },
      { text: "Verteidigung des dualen Systems/der PKV; Familienversicherung verteidigen; Finanzierungslücke", idx: r(7,16,19,11,13,4,12,0,1) },
    ] },
  { aspekt: "Krankenversicherung", partei: "GRÜNE",
    lang: [
      { text: "Beitragsstabilität gefordert; versicherungsfremde Leistungen und Bürgergeld-Beiträge aus Steuermitteln; Ausgabenabbau", idx: r(0,1,2,3,5,6,8,10,11) },
      { text: "Bürgerversicherung gegen Zweiklassenmedizin; gegen Umverteilung von unten nach oben; Familienversicherung reformieren", idx: r(9,7,4) },
    ],
    kurz: [
      { text: "Beitragsstabilität; versicherungsfremde Leistungen und Bürgergeld-Beiträge aus Steuern", idx: r(0,1,2,3,5,6,8,10,11) },
      { text: "Bürgerversicherung gegen Zweiklassenmedizin; gegen Umverteilung von unten nach oben", idx: r(9,7,4) },
    ] },
  { aspekt: "Krankenversicherung", partei: "LINKE",
    lang: [
      { text: "Bürgerversicherung für alle gegen Zweiklassenmedizin; Abschaffung der PKV", idx: r(0,5,7,10) },
      { text: "Beitragsbemessungsgrenze erhöhen, alle Einkommensarten einbeziehen (progressiv)", idx: r(1,2,11,6) },
      { text: "Gegen höhere Zuzahlungen und Leistungskürzungen; Kritik an Ausgabendeckel", idx: r(4,8,9,3) },
    ],
    kurz: [
      { text: "Bürgerversicherung für alle gegen Zweiklassenmedizin; Beitragsbemessungsgrenze erhöhen, alle Einkommen einbeziehen", idx: r(0,5,7,10,1,2,11,6) },
      { text: "Gegen höhere Zuzahlungen und Leistungskürzungen", idx: r(4,8,9,3) },
    ] },
  { aspekt: "Krankenversicherung", partei: "SPD",
    lang: [
      { text: "GKV als Solidarsystem verteidigen und stabilisieren (Strukturreformen, progressive Finanzierung)", idx: r(0,5,7,9,10,11) },
      { text: "Defizit ohne Beitragserhöhung schließen (Verwaltung, Innovationsfonds); Apothekenfixum/Transformationsfonds", idx: r(1,6,8) },
      { text: "Gegen AfD-Antrag und Migration als Sündenbock; Kritik an Grünen-Beitragssenkung", idx: r(2,3,4) },
    ],
    kurz: [
      { text: "GKV als Solidarsystem verteidigen und stabilisieren; Defizit ohne Beitragserhöhung schließen", idx: r(0,5,7,9,10,11,1,6,8) },
      { text: "Gegen AfD-Antrag und Migration als Sündenbock; Kritik an Grünen-Beitragssenkung", idx: r(2,3,4) },
    ] },

  // ===== Organspende =====
  { aspekt: "Organspende", partei: "AfD",
    lang: [{ text: "Überkreuz-Lebendnierenspende mit besserem Spenderschutz; Ablehnung der Widerspruchslösung", idx: r(0,1,2) }],
    kurz: [{ text: "Überkreuz-Lebendnierenspende mit Spenderschutz; gegen Widerspruchslösung", idx: r(0,1,2) }] },
  { aspekt: "Organspende", partei: "CDU/CSU",
    lang: [{ text: "Überkreuz-Lebendnierenspende mit Spenderschutz und Organhandelsverbot zur Erhöhung der Transplantationszahlen", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Überkreuz-Lebendnierenspende mit Spenderschutz zur Erhöhung der Transplantationszahlen", idx: r(0,1,2,3,4) }] },
  { aspekt: "Organspende", partei: "GRÜNE",
    lang: [{ text: "Lebendorganspende verbessern, mit kritischen Anmerkungen zum Schutz der Spender:innen", idx: r(0,1) }],
    kurz: [{ text: "Lebendorganspende verbessern, mit Fokus auf Spenderschutz", idx: r(0,1) }] },
  { aspekt: "Organspende", partei: "LINKE",
    lang: [{ text: "Kritik an unzureichender psychosozialer Begleitung; postmortale Spende zuerst ausschöpfen", idx: r(0,1) }],
    kurz: [{ text: "Kritik an psychosozialer Begleitung; postmortale Spende zuerst ausschöpfen", idx: r(0,1) }] },
  { aspekt: "Organspende", partei: "SPD",
    lang: [{ text: "Überkreuz-/anonyme Lebendnierenspende mit Spenderschutz; Widerspruchslösung für die postmortale Spende", idx: r(0,1) }],
    kurz: [{ text: "Überkreuz-/anonyme Lebendnierenspende mit Schutz; Widerspruchslösung für postmortale Spende", idx: r(0,1) }] },

  // ===== Pflegefinanzierung =====
  { aspekt: "Pflegefinanzierung", partei: "AfD",
    lang: [
      { text: "Sichere, langfristige Finanzierung statt Kürzungen; Eigenanteile deckeln; versicherungsfremde Leistungen aus dem Bundeshaushalt", idx: r(1,2,3,5,6) },
      { text: "Häusliche/Familienpflege fördern (Familienpflegegeld); einheitliche Vermögensabrechnung", idx: r(0,4) },
    ],
    kurz: [
      { text: "Sichere Finanzierung statt Kürzungen, Eigenanteile deckeln, versicherungsfremde Leistungen aus Steuern", idx: r(1,2,3,5,6) },
      { text: "Häusliche/Familienpflege fördern", idx: r(0,4) },
    ] },
  { aspekt: "Pflegefinanzierung", partei: "CDU/CSU",
    lang: [
      { text: "Beitragssätze stabilisieren und Pflege bedarfsgerecht ausfinanzieren (grundlegende Reform statt Ausgabendeckel)", idx: r(0,1,3,5,6) },
      { text: "Entbürokratisierung und Effizienz; Prävention und Modernisierung", idx: r(2,4,7) },
    ],
    kurz: [{ text: "Beitragssätze stabilisieren, Pflege bedarfsgerecht ausfinanzieren; Entbürokratisierung und Prävention", idx: r(0,1,3,5,6,2,4,7) }] },
  { aspekt: "Pflegefinanzierung", partei: "GRÜNE",
    lang: [
      { text: "Versicherungsfremde Leistungen und Coronakosten aus dem Bundeshaushalt; solidarische Finanzierung statt Kredite", idx: r(0,2,3) },
      { text: "Gegen Überwälzung von Ausbildungskosten auf Pflegebedürftige", idx: r(1) },
    ],
    kurz: [{ text: "Versicherungsfremde Leistungen aus dem Bundeshaushalt, solidarische Finanzierung statt Kredite; keine Ausbildungskosten auf Pflegebedürftige", idx: r(0,2,3,1) }] },
  { aspekt: "Pflegefinanzierung", partei: "LINKE",
    lang: [
      { text: "Gegen Kürzungen und Streichung von Pflegegraden", idx: r(0,1,2) },
      { text: "Solidarische Pflegeversicherung mit Vollfinanzierung aller Pflegekosten", idx: r(3) },
    ],
    kurz: [{ text: "Gegen Kürzungen/Pflegegrad-Streichung; solidarische Pflegeversicherung mit Vollfinanzierung", idx: r(0,1,2,3) }] },
  { aspekt: "Pflegefinanzierung", partei: "SPD",
    lang: [
      { text: "Weiterentwicklung ohne Leistungskürzungen: Eigenanteile begrenzen, Leistungen dynamisieren, solidarisch finanzieren", idx: r(2,3,5) },
      { text: "Häusliche Pflege/Familienversicherung schützen; Bund gleicht Coronamehrkosten aus; neue Versorgungsmodelle", idx: r(1,4,0) },
    ],
    kurz: [
      { text: "Weiterentwicklung ohne Kürzungen: Eigenanteile begrenzen, Leistungen dynamisieren, solidarisch finanzieren", idx: r(2,3,5) },
      { text: "Häusliche Pflege schützen; Bund gleicht Coronamehrkosten aus; neue Versorgungsmodelle", idx: r(1,4,0) },
    ] },

  // ===== Pflegepersonal =====
  { aspekt: "Pflegepersonal", partei: "AfD",
    lang: [
      { text: "Bessere Arbeitsbedingungen gegen Überlastung und Sparpolitik; mehr Personal, Schutz vor Übergriffen", idx: r(3,8,10,12,13,14,15,17,18) },
      { text: "Bürokratie/Dokumentation abbauen (Digitalisierung)", idx: r(2,5,16) },
      { text: "Strengere Sprach-/Anerkennungsprüfung bei ausländischem Personal; Pflegefachassistenz mit Vorbehalt; Aufgabenverteilung; Hebammen; Attraktivität", idx: r(1,9,0,4,7,6,11) },
    ],
    kurz: [
      { text: "Bessere Arbeitsbedingungen gegen Überlastung; mehr Personal; Bürokratie abbauen", idx: r(3,8,10,12,13,14,15,17,18,2,5,16) },
      { text: "Strengere Anerkennung ausländischen Personals; Pflegefachassistenz mit Vorbehalt; Aufgabenverteilung", idx: r(1,9,0,4,7,6,11) },
    ] },
  { aspekt: "Pflegepersonal", partei: "CDU/CSU",
    lang: [
      { text: "Befugniserweiterung und Kompetenzen für Pflegefachkräfte plus Bürokratieabbau (eigenständiger Heilberuf)", idx: r(6,7,10,11,12,15) },
      { text: "Bundeseinheitliche Pflegefachassistenz-Ausbildung und Karrierewege", idx: r(3,4,14) },
      { text: "Anerkennung ausländischer Fachkräfte beschleunigen; bedarfsgerechtes Personal; Belastung in Notaufnahmen; Anerkennung/Dank", idx: r(9,2,0,13,5,8,1) },
    ],
    kurz: [
      { text: "Befugniserweiterung und Kompetenzen für Pflegekräfte plus Bürokratieabbau; einheitliche Pflegefachassistenz-Ausbildung", idx: r(6,7,10,11,12,15,3,4,14) },
      { text: "Anerkennung ausländischer Fachkräfte beschleunigen; bedarfsgerechtes Personal; Belastung anerkennen", idx: r(9,2,0,13,5,8,1) },
    ] },
  { aspekt: "Pflegepersonal", partei: "GRÜNE",
    lang: [
      { text: "Bessere Bezahlung, Arbeitsbedingungen und Entlastung der Pflegekräfte", idx: r(3,4) },
      { text: "Eigenständige heilkundliche Kompetenzen (Community Health Nurses) statt nur ärztlicher Delegation", idx: r(1,5) },
      { text: "Gegen Entlassungen durch Spardruck; Pflegefachassistenz-Standards und faire Finanzierung", idx: r(0,2) },
    ],
    kurz: [
      { text: "Bessere Bezahlung/Arbeitsbedingungen; eigenständige heilkundliche Kompetenzen statt nur Delegation", idx: r(3,4,1,5) },
      { text: "Gegen Entlassungen durch Spardruck; Pflegefachassistenz-Standards", idx: r(0,2) },
    ] },
  { aspekt: "Pflegepersonal", partei: "LINKE",
    lang: [
      { text: "Vollständige Refinanzierung der Personalkosten und verbindliche Personalschlüssel gegen Unterbesetzung", idx: r(0,1,3,13) },
      { text: "Bessere Bezahlung und Arbeitsbedingungen gegen Fachkräfteflucht (Entlastungstarifverträge)", idx: r(4,6,8,10,12) },
      { text: "Eigenständige Pflegekompetenz; bessere Ausbildung; Versorgungssystem reformieren; Standards", idx: r(9,5,7,11,2) },
    ],
    kurz: [
      { text: "Vollständige Refinanzierung der Personalkosten, verbindliche Personalschlüssel; bessere Bezahlung gegen Fachkräfteflucht", idx: r(0,1,3,13,4,6,8,10,12) },
      { text: "Eigenständige Pflegekompetenz; bessere Ausbildung; Versorgungssystem reformieren", idx: r(9,5,7,11,2) },
    ] },
  { aspekt: "Pflegepersonal", partei: "SPD",
    lang: [
      { text: "Befugniserweiterung und heilkundliche Kompetenzen plus Entbürokratisierung (Community Health Nurses)", idx: r(3,4,7,11,13) },
      { text: "Bundeseinheitliche Pflegefachassistenz-Ausbildung mit Vergütung", idx: r(5,6) },
      { text: "Anerkennung und Würdigung (auch ausländischer Fachkräfte); Personaluntergrenzen", idx: r(0,1,2,9,10,8,12) },
    ],
    kurz: [
      { text: "Befugniserweiterung und Kompetenzen plus Entbürokratisierung; einheitliche Pflegefachassistenz-Ausbildung", idx: r(3,4,7,11,13,5,6) },
      { text: "Anerkennung/Würdigung (auch ausländischer Fachkräfte); Personaluntergrenzen", idx: r(0,1,2,9,10,8,12) },
    ] },

  // ===== Psychische Gesundheit =====
  { aspekt: "Psychische Gesundheit", partei: "AfD",
    lang: [
      { text: "Gegen Kürzung der Psychotherapie-Vergütung; bessere Finanzierung der Weiterbildung", idx: r(2,5) },
      { text: "Psychische Corona-Folgen bei Kindern; Lachgas/Energydrinks regulieren", idx: r(0,4,1,3) },
    ],
    kurz: [
      { text: "Gegen Kürzung der Psychotherapie-Vergütung; bessere Finanzierung der Weiterbildung", idx: r(2,5) },
      { text: "Psychische Corona-Folgen bei Kindern; Lachgas/Energydrinks regulieren", idx: r(0,4,1,3) },
    ] },
  { aspekt: "Psychische Gesundheit", partei: "CDU/CSU",
    lang: [
      { text: "Gegen Kürzung der Psychotherapie-Vergütung", idx: r(0,2) },
      { text: "Psychotherapeutische Versorgung für Asylbewerber", idx: r(1) },
    ],
    kurz: [{ text: "Gegen Kürzung der Psychotherapie-Vergütung; Versorgung für Asylbewerber", idx: r(0,2,1) }] },
  { aspekt: "Psychische Gesundheit", partei: "GRÜNE",
    lang: [
      { text: "Gegen Kürzungen in der Kinderpsychotherapie; mehr Therapieplätze", idx: r(0,2,3) },
      { text: "Gegen Ausgrenzung von Supervision und Theorievermittlung aus der Kassenabrechnung", idx: r(1) },
    ],
    kurz: [{ text: "Gegen Kürzungen in der Kinderpsychotherapie; mehr Therapieplätze", idx: r(0,2,3,1) }] },
  { aspekt: "Psychische Gesundheit", partei: "LINKE",
    lang: [{ text: "Kritik an langen Wartezeiten und Versorgungslage (v. a. Kinder/Jugendliche); Probleme der Psychotherapieausbildung", idx: r(0,2,1) }],
    kurz: [{ text: "Kritik an langen Wartezeiten und Versorgungslage; Probleme der Psychotherapieausbildung", idx: r(0,2,1) }] },
  { aspekt: "Psychische Gesundheit", partei: "SPD",
    lang: [
      { text: "Gegen Absenkung der Psychotherapeuten-Vergütung; ausreichende Weiterbildungsplätze", idx: r(0,2) },
      { text: "Gegen Verweigerung von Hilfe für psychisch Erkrankte", idx: r(1) },
    ],
    kurz: [{ text: "Gegen Vergütungsabsenkung; ausreichende Weiterbildungsplätze; Hilfe nicht verweigern", idx: r(0,2,1) }] },

  // ===== Versorgung ländlich / Notfall =====
  { aspekt: "Versorgung ländlich / Notfall", partei: "AfD",
    lang: [
      { text: "Warnung vor Krankenhausschließungen und gefährdeter Notfallversorgung im ländlichen Raum", idx: r(2,3,5,6,7,8,9,10,12,18,19,21) },
      { text: "Notfallversorgung reformieren (integrierte Zentren, kürzere Rettungszeiten); Rettungsdienst-Kollaps", idx: r(13,16,1,17) },
      { text: "Apotheken-/Hausarztversorgung im ländlichen Raum sichern; Telemedizin/aufsuchende Dienste; häusliche Pflege; Dienstzeiten; Versorgungsnotstand", idx: r(15,14,4,0,11,20) },
    ],
    kurz: [
      { text: "Warnung vor Krankenhausschließungen und gefährdeter Notfallversorgung im ländlichen Raum", idx: r(2,3,5,6,7,8,9,10,12,18,19,21) },
      { text: "Notfallversorgung reformieren; Apotheken-/Hausarztversorgung im ländlichen Raum sichern", idx: r(13,16,1,17,15,14,4,0,11,20) },
    ] },
  { aspekt: "Versorgung ländlich / Notfall", partei: "CDU/CSU",
    lang: [
      { text: "Notfallreform: Verzahnung von 112/116117, integrierte Notfallzentren, digitale Steuerung (regional differenziert)", idx: r(3,4,5,6,7,8,12,16) },
      { text: "Primärversorgungssystem mit Hausärzten als Lotsen zur besseren Patientensteuerung", idx: r(0,1,9,15) },
      { text: "Apotheken im ländlichen Raum stärken (höheres Fixum); MVZ und Anerkennung ausländischer Fachkräfte gegen Versorgungslücken", idx: r(2,11,13,14,17,19,10,18) },
    ],
    kurz: [
      { text: "Notfallreform (Verzahnung 112/116117, integrierte Zentren); Primärversorgungssystem mit Hausarzt-Lotsen", idx: r(3,4,5,6,7,8,12,16,0,1,9,15) },
      { text: "Apotheken im ländlichen Raum stärken (Fixum); MVZ und Anerkennung ausländischer Fachkräfte", idx: r(2,11,13,14,17,19,10,18) },
    ] },
  { aspekt: "Versorgung ländlich / Notfall", partei: "GRÜNE",
    lang: [
      { text: "Primärversorgungssystem mit Hausärzten als Erstanlaufstelle (v. a. ländlicher Raum, MVZ-Gründungen)", idx: r(5,7) },
      { text: "Notfallversorgung reformieren (Verzahnung, Leitstellen-Standards); gegen Verzögerung", idx: r(1,2,8,9) },
      { text: "Warnung vor Versorgungskollaps durch Kürzungen/Schließungen; ländliche Apotheken; spezialisierte Zentren", idx: r(3,4,6,0) },
    ],
    kurz: [
      { text: "Primärversorgungssystem mit Hausärzten; Notfallversorgung reformieren", idx: r(5,7,1,2,8,9) },
      { text: "Warnung vor Versorgungskollaps durch Kürzungen; ländliche Apotheken; spezialisierte Zentren", idx: r(3,4,6,0) },
    ] },
  { aspekt: "Versorgung ländlich / Notfall", partei: "LINKE",
    lang: [
      { text: "Gegen Klinikschließungen im ländlichen Raum, die im Notfall Leben kosten", idx: r(0,2,4) },
      { text: "Notaufnahmen und Rettungsdienste bedarfsgerecht ausfinanzieren; garantierte Facharzttermine", idx: r(5,7,1) },
      { text: "Apotheken-Notdienst im ländlichen Raum (Versandhandel keine Notfalllösung); Zugang für Geflüchtete", idx: r(3,8,6) },
    ],
    kurz: [
      { text: "Gegen Klinikschließungen im ländlichen Raum; Notaufnahmen/Rettungsdienste ausfinanzieren; garantierte Facharzttermine", idx: r(0,2,4,5,7,1) },
      { text: "Apotheken-Notdienst im ländlichen Raum; Zugang für Geflüchtete", idx: r(3,8,6) },
    ] },
  { aspekt: "Versorgung ländlich / Notfall", partei: "SPD",
    lang: [
      { text: "Apothekenversorgung im ländlichen Raum sichern (Telemedizin, Zweigapotheken, Notdienstvergütung)", idx: r(0,2,5,7) },
      { text: "Notfallversorgung reformieren (Vernetzung, integrierte Notfallzentren, digitale Steuerung)", idx: r(3,4,9) },
      { text: "Wohnortnahe Grundversorgung und kleinere Krankenhäuser sichern; regionale Schwangerschaftsabbruch-Versorgung; Anerkennung ausländischer Fachkräfte", idx: r(1,8,10,12,13,6,11) },
    ],
    kurz: [
      { text: "Apothekenversorgung im ländlichen Raum sichern; Notfallversorgung reformieren", idx: r(0,2,5,7,3,4,9) },
      { text: "Wohnortnahe Grundversorgung und kleinere Krankenhäuser sichern; Anerkennung ausländischer Fachkräfte", idx: r(1,8,10,12,13,6,11) },
    ] },

  // ===== WHO-/EU-Einfluss =====
  { aspekt: "WHO-/EU-Einfluss", partei: "AfD",
    lang: [{ text: "Ablehnung von WHO-Einfluss und der Internationalen Gesundheitsvorschriften als Eingriff in die nationale Souveränität", idx: r(0,1) }],
    kurz: [{ text: "Ablehnung von WHO-Einfluss und IGV als Eingriff in die nationale Souveränität", idx: r(0,1) }] },
  { aspekt: "WHO-/EU-Einfluss", partei: "CDU/CSU",
    lang: [{ text: "Befürwortung der WHO-Zusammenarbeit; IGV ermöglichen Koordination, bleiben aber nicht bindend", idx: r(0,1) }],
    kurz: [{ text: "WHO-Zusammenarbeit befürworten; IGV nicht bindend für nationale Entscheidungen", idx: r(0,1) }] },
  { aspekt: "WHO-/EU-Einfluss", partei: "GRÜNE",
    lang: [{ text: "Stärkung der WHO und der Internationalen Gesundheitsvorschriften zur besseren Pandemiebekämpfung", idx: r(0,1,2) }],
    kurz: [{ text: "WHO und IGV stärken zur besseren Pandemiebekämpfung", idx: r(0,1,2) }] },
  { aspekt: "WHO-/EU-Einfluss", partei: "LINKE",
    lang: [{ text: "Befürwortung und Weiterentwicklung der WHO-Gesundheitsvorschriften (Gerechtigkeit und Solidarität)", idx: r(0,1) }],
    kurz: [{ text: "WHO-Gesundheitsvorschriften befürworten und weiterentwickeln", idx: r(0,1) }] },
  { aspekt: "WHO-/EU-Einfluss", partei: "SPD",
    lang: [{ text: "Ablehnung des Antrags zum Austritt Deutschlands aus der WHO", idx: r(0) }],
    kurz: [{ text: "Gegen einen Austritt Deutschlands aus der WHO", idx: r(0) }] },
];

applySynthese("Gesundheit", CELLS);
