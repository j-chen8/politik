/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Medien, Kommunikation und Informationstechnik" (45 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Überwachungsbefugnisse =====
  { aspekt: "Überwachungsbefugnisse", partei: "AfD",
    lang: [{ text: "Gegen anlasslose Massenüberwachung und Chatkontrolle (Kommunikationsgeheimnis); gegen Durchsuchungen ohne richterliche Anordnung, Kennzeichenerfassung und zentrale digitale Identität", idx: r(0,1,2,3,4,5,6,7,8) }],
    kurz: [{ text: "Gegen anlasslose Massenüberwachung und Chatkontrolle; gegen Durchsuchungen ohne richterliche Anordnung", idx: r(0,1,2,3,4,5,6,7,8) }] },
  { aspekt: "Überwachungsbefugnisse", partei: "CDU/CSU",
    lang: [{ text: "Erweiterte Überwachungsbefugnisse für Sicherheitsbehörden befürworten (verfassungsrechtliche Spielräume); Aufdeckung von Kindesmissbrauch ohne Schwächung der Verschlüsselung; IP-Speicherung zur Täterermittlung", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Erweiterte Überwachungsbefugnisse befürworten; Kindesmissbrauch-Aufdeckung ohne Schwächung der Verschlüsselung", idx: r(0,1,2,3,4,5,6) }] },
  { aspekt: "Überwachungsbefugnisse", partei: "GRÜNE",
    lang: [{ text: "Gegen anlasslose Chatkontrolle, Vorratsdatenspeicherung und Klarnamenpflicht als unverhältnismäßig; BVerfG-Urteile zum Schutz der Intimsphäre umsetzen", idx: r(0,1,2,3) }],
    kurz: [{ text: "Gegen anlasslose Chatkontrolle, Vorratsdatenspeicherung und Klarnamenpflicht", idx: r(0,1,2,3) }] },
  { aspekt: "Überwachungsbefugnisse", partei: "LINKE",
    lang: [{ text: "Gegen Chatkontrolle, Massenüberwachung, Staatstrojaner, Vorratsdatenspeicherung und biometrische Überwachung; gegen Geheimhaltung von IT-Schwachstellen; parlamentarische Kontrolle", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Gegen Chatkontrolle, Staatstrojaner, Vorratsdatenspeicherung und biometrische Überwachung", idx: r(0,1,2,3,4,5,6) }] },
  { aspekt: "Überwachungsbefugnisse", partei: "SPD",
    lang: [{ text: "BKA-Befugnisse verfassungskonform anpassen; gegen anlasslose Chatkontrolle (von der EU-Tagesordnung genommen), technische Lösungen statt anlassloser Überwachung", idx: r(0,1,2) }],
    kurz: [{ text: "BKA-Befugnisse verfassungskonform anpassen; gegen anlasslose Chatkontrolle", idx: r(0,1,2) }] },

  // ===== Öffentlich-rechtlicher Rundfunk =====
  { aspekt: "Öffentlich-rechtlicher Rundfunk", partei: "AfD",
    lang: [{ text: "Kritik am öffentlich-rechtlichen Rundfunk als tendenziös; Abschaffung bzw. Rückbau und Kostenersparnis; gegen staatliche Medienfinanzierung", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Kritik am ÖRR als tendenziös; Abschaffung/Rückbau und Kostenersparnis", idx: r(0,1,2,3,4) }] },
  { aspekt: "Öffentlich-rechtlicher Rundfunk", partei: "CDU/CSU",
    lang: [{ text: "Stärkung der Deutschen Welle als Investition in freie Medien und gesellschaftlichen Zusammenhalt", idx: r(0) }],
    kurz: [{ text: "Stärkung der Deutschen Welle als Investition in freie Medien", idx: r(0) }] },
  { aspekt: "Öffentlich-rechtlicher Rundfunk", partei: "SPD",
    lang: [{ text: "Unabhängige Medien und Qualitätsjournalismus als fundamental für die Demokratie schützen (auch über Plattformbesteuerung)", idx: r(0) }],
    kurz: [{ text: "Unabhängige Medien und Qualitätsjournalismus schützen", idx: r(0) }] },

  // ===== Desinformation / Hassrede =====
  { aspekt: "Desinformation / Hassrede", partei: "AfD",
    lang: [
      { text: "Gegen Inhaltskontrolle und Melde-/Denunziationssysteme als Eingriff in die Meinungsfreiheit", idx: r(0,1,2,3,4) },
      { text: "Vorwurf der Desinformation an Regierung/Gegner; gegen Hetze und Mordfantasien von linker Seite", idx: r(5,7,6) },
    ],
    kurz: [
      { text: "Gegen Inhaltskontrolle und Melde-/Denunziationssysteme als Eingriff in die Meinungsfreiheit", idx: r(0,1,2,3,4) },
      { text: "Vorwurf der Desinformation an Regierung/Gegner", idx: r(5,7,6) },
    ] },
  { aspekt: "Desinformation / Hassrede", partei: "CDU/CSU",
    lang: [
      { text: "Transparenz bei politischer Werbung; gegen Desinformation und ausländische Einflussnahme, mit Sorge um US-Konzern-Marktmacht und Pressefreiheit", idx: r(0,1,2,3,6) },
      { text: "Sexualisierte Deepfakes bekämpfen; gegen AfD-Falschdarstellung zur Chatkontrolle", idx: r(4,5) },
    ],
    kurz: [
      { text: "Transparenz bei politischer Werbung; gegen Desinformation und ausländische Einflussnahme", idx: r(0,1,2,3,6) },
      { text: "Sexualisierte Deepfakes bekämpfen", idx: r(4,5) },
    ] },
  { aspekt: "Desinformation / Hassrede", partei: "GRÜNE",
    lang: [
      { text: "Gegen Hassrede und digitale Gewalt (digitales Gewaltschutzgesetz, HateAid; besonders gegen Frauen)", idx: r(0,3,6) },
      { text: "Gegen Microtargeting und intransparente Algorithmen (Techoligarchen); gegen KI-Desinformation und Spaltungskampagnen", idx: r(2,4,7,1,5) },
    ],
    kurz: [
      { text: "Gegen Hassrede und digitale Gewalt (digitales Gewaltschutzgesetz, HateAid)", idx: r(0,3,6) },
      { text: "Gegen Microtargeting, intransparente Algorithmen und KI-Desinformation", idx: r(2,4,7,1,5) },
    ] },
  { aspekt: "Desinformation / Hassrede", partei: "LINKE",
    lang: [{ text: "Gegen Manipulation durch Digitalkonzerne und intransparente Algorithmen; gegen Deepfakes, Hatespeech und KI-generierte Desinformation", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Gegen Manipulation durch Digitalkonzerne und intransparente Algorithmen; gegen Deepfakes und Hatespeech", idx: r(0,1,2,3,4) }] },
  { aspekt: "Desinformation / Hassrede", partei: "SPD",
    lang: [
      { text: "Transparenzregeln gegen Desinformation und Manipulation, auch gegen ausländische (russische) Kampagnen und AfD-Propaganda", idx: r(0,1,3,4,8) },
      { text: "Gegen Hate Speech, Doxing und sexualisierte Gewalt; stärkere Plattformverantwortung (DSA, HateAid als Trusted Flagger)", idx: r(2,5,6,7) },
    ],
    kurz: [
      { text: "Transparenzregeln gegen Desinformation, auch gegen russische Kampagnen", idx: r(0,1,3,4,8) },
      { text: "Gegen Hate Speech und Doxing; stärkere Plattformverantwortung (DSA, HateAid)", idx: r(2,5,6,7) },
    ] },

  // ===== Datenschutz (DSGVO) =====
  { aspekt: "Datenschutz (DSGVO)", partei: "AfD",
    lang: [
      { text: "Gegen Chatkontrolle, Massenüberwachung und staatliche Datensammlung (Zensus, EU-Wallet, Registerzusammenführung)", idx: r(1,2,4,6,7,8,10,9) },
      { text: "Kritik am Data Act und Data Governance Act als regulatorisches Chaos und Bürokratie", idx: r(3,5,0) },
    ],
    kurz: [
      { text: "Gegen Chatkontrolle, Massenüberwachung und staatliche Datensammlung", idx: r(1,2,4,6,7,8,10,9) },
      { text: "Kritik am Data Act als regulatorisches Chaos und Bürokratie", idx: r(3,5,0) },
    ] },
  { aspekt: "Datenschutz (DSGVO)", partei: "CDU/CSU",
    lang: [{ text: "Starke Datenschutz-Garantien und End-to-End-Verschlüsselung erhalten; Transparenz bei politischer Werbung; BfDI als Backoffice beim Data Act", idx: r(0,1,2,3) }],
    kurz: [{ text: "Datenschutz-Garantien und Verschlüsselung erhalten; Transparenz bei politischer Werbung", idx: r(0,1,2,3) }] },
  { aspekt: "Datenschutz (DSGVO)", partei: "GRÜNE",
    lang: [
      { text: "Grundrechtskonformer Datenschutz und informationelle Selbstbestimmung; gegen anlasslose Überwachung", idx: r(0,1,4) },
      { text: "Dezentrale Zuständigkeit der Landesdatenschutzbehörden (auch beim Data Act) statt zentraler Bündelung; Datenschutzkonferenz verbindlich verankern", idx: r(2,3,5,6) },
    ],
    kurz: [
      { text: "Grundrechtskonformer Datenschutz; gegen anlasslose Überwachung", idx: r(0,1,4) },
      { text: "Dezentrale Zuständigkeit der Landesdatenschutzbehörden statt zentraler Bündelung", idx: r(2,3,5,6) },
    ] },
  { aspekt: "Datenschutz (DSGVO)", partei: "LINKE",
    lang: [
      { text: "Schutz persönlicher Daten vor Digitalkonzernen, Tracking und KI-Training (gegen Lockerungen im digitalen Omnibus)", idx: r(0,1,6,11,10) },
      { text: "Bürgerrechte auf Auskunft und automatische Löschfristen; Kritik an unzureichendem Data Act und Once-Only-Datenschutz; gegen Chatkontrolle", idx: r(2,5,3,8,9,7,4) },
    ],
    kurz: [
      { text: "Schutz persönlicher Daten vor Digitalkonzernen und KI-Training", idx: r(0,1,6,11,10) },
      { text: "Bürgerrechte auf Auskunft und Löschfristen; gegen Chatkontrolle", idx: r(2,5,3,8,9,7,4) },
    ] },
  { aspekt: "Datenschutz (DSGVO)", partei: "SPD",
    lang: [{ text: "Digitale Souveränität und Datenschutz als Wert (auch bei KI und algorithmischen Entscheidungen); einheitliche DSGVO-Anwendung in der EU; gegen Targeting mit privaten Daten", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Digitale Souveränität und Datenschutz (auch bei KI); einheitliche DSGVO in der EU", idx: r(0,1,2,3,4,5,6) }] },

  // ===== Plattformregulierung (DSA/DMA) =====
  { aspekt: "Plattformregulierung (DSA/DMA)", partei: "AfD",
    lang: [{ text: "Digital Services Act und TTPA-Verordnung als Zensur ablehnen; gegen Messenger-Überwachung und Digitalsteuer", idx: r(0,1,2,3,5,6,7,4) }],
    kurz: [{ text: "DSA und TTPA-Verordnung als Zensur ablehnen; gegen Digitalsteuer", idx: r(0,1,2,3,5,6,7,4) }] },
  { aspekt: "Plattformregulierung (DSA/DMA)", partei: "CDU/CSU",
    lang: [{ text: "Transparenz bei politischer Werbung und Regulierungsziele befürworten, aber Umsetzung überbürokratisch — praxisnäher gestalten; gegen Digitalsteuer", idx: r(0,1,2,4,3) }],
    kurz: [{ text: "Transparenz bei politischer Werbung befürworten, aber praxisnäher gestalten; gegen Digitalsteuer", idx: r(0,1,2,4,3) }] },
  { aspekt: "Plattformregulierung (DSA/DMA)", partei: "GRÜNE",
    lang: [{ text: "DSA und DMA gegen Tech-Monopole und illegale Inhalte durchsetzen; europäische Alternativen statt US-Plattformen", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "DSA und DMA gegen Tech-Monopole durchsetzen; europäische Alternativen", idx: r(0,1,2,3,4) }] },
  { aspekt: "Plattformregulierung (DSA/DMA)", partei: "LINKE",
    lang: [{ text: "DSA befürworten, aber unzureichend umgesetzt — Ressourcen der Bundesnetzagentur fehlen; gegen Deregulierung, stärkere Plattformpflichten gegen Big Tech", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "DSA befürworten, aber konsequenter umsetzen; stärkere Plattformpflichten gegen Big Tech", idx: r(0,1,2,3,4,5,6) }] },
  { aspekt: "Plattformregulierung (DSA/DMA)", partei: "SPD",
    lang: [
      { text: "DSA als Pfeiler digitaler Souveränität; Transparenz politischer Werbung gegen Microtargeting", idx: r(0,1,3,10,12,13) },
      { text: "Plattformverantwortung für illegale Inhalte und sexualisierte Gewalt (HateAid als Trusted Flagger)", idx: r(2,6,7) },
      { text: "Gegen Big-Tech-Marktmacht; faire Besteuerung großer Plattformen; Regelwerk praktikabler machen", idx: r(5,8,9,11,4) },
    ],
    kurz: [
      { text: "DSA als Pfeiler digitaler Souveränität; Transparenz politischer Werbung gegen Microtargeting", idx: r(0,1,3,10,12,13,2,6,7) },
      { text: "Gegen Big-Tech-Marktmacht; faire Besteuerung großer Plattformen", idx: r(5,8,9,11,4) },
    ] },

  // ===== Breitband- / Netzausbau =====
  { aspekt: "Breitband- / Netzausbau", partei: "AfD",
    lang: [
      { text: "Ausbau von Glasfaser, Mobilfunk und nationalem Roaming gefordert; Kritik an unzureichender Umsetzung und fehlenden Kennzahlen", idx: r(0,1,2,4,5,6,7,8,9,10) },
      { text: "Kritik an 5G-Ausbau mit Huawei-Komponenten aus China", idx: r(3) },
    ],
    kurz: [{ text: "Ausbau von Glasfaser, Mobilfunk und Roaming gefordert; Kritik an unzureichender Umsetzung", idx: r(0,1,2,4,5,6,7,8,9,10,3) }] },
  { aspekt: "Breitband- / Netzausbau", partei: "CDU/CSU",
    lang: [{ text: "Beschleunigung des Glasfaser- und Mobilfunkausbaus als überragendes öffentliches Interesse; Transparenz über Versorgungslücken (Gigabit-Grundbuch)", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Beschleunigung des Glasfaser- und Mobilfunkausbaus als überragendes öffentliches Interesse", idx: r(0,1,2,3,4) }] },
  { aspekt: "Breitband- / Netzausbau", partei: "GRÜNE",
    lang: [{ text: "Kritik an unzureichender Glasfaserversorgung; konkrete Beschleunigung (Gigabit-Grundbuch, automatisierte Genehmigungen) und Verbraucherschutz statt Symbolik", idx: r(1,0) }],
    kurz: [{ text: "Kritik an unzureichender Glasfaserversorgung; konkrete Beschleunigung statt Symbolik", idx: r(1,0) }] },
  { aspekt: "Breitband- / Netzausbau", partei: "LINKE",
    lang: [{ text: "Netzausbau in öffentlicher Hand gegen Profitorientierung; soziale Standards, faire Arbeitsbedingungen und verbindliche Mindestversorgung", idx: r(0,1,2) }],
    kurz: [{ text: "Netzausbau in öffentlicher Hand; soziale Standards und verbindliche Mindestversorgung", idx: r(0,1,2) }] },
  { aspekt: "Breitband- / Netzausbau", partei: "SPD",
    lang: [
      { text: "Massive Investitionen (3 Mrd. €) in Glasfaser- und Mobilfunkausbau als staatliche Pflichtversorgung; Beschleunigung der Verfahren", idx: r(0,1,2,3,5,6,7) },
      { text: "Gegen verpflichtendes nationales Roaming; stattdessen verbindliche Ausbauverpflichtungen", idx: r(4) },
    ],
    kurz: [
      { text: "Massive Investitionen in Glasfaser/Mobilfunk als Pflichtversorgung; Beschleunigung der Verfahren", idx: r(0,1,2,3,5,6,7) },
      { text: "Gegen verpflichtendes nationales Roaming; verbindliche Ausbauverpflichtungen", idx: r(4) },
    ] },

  // ===== Cybersicherheit (BSI) =====
  { aspekt: "Cybersicherheit (BSI)", partei: "AfD",
    lang: [{ text: "NIS-2-Richtlinie und gesetzliche Mindeststandards befürworten (mit Bürokratie-Augenmaß); Skepsis gegenüber neuen BSI-Aufgaben ohne Kapazitäten", idx: r(0,1,2,3,5,4) }],
    kurz: [{ text: "NIS-2 und Mindeststandards befürworten (mit Bürokratie-Augenmaß); Skepsis gegenüber neuen BSI-Aufgaben", idx: r(0,1,2,3,5,4) }] },
  { aspekt: "Cybersicherheit (BSI)", partei: "CDU/CSU",
    lang: [{ text: "NIS-2 umsetzen und das BSI stärken (CISO Bund, kritische Komponenten); Bundesverwaltung als Vorbild mit verbindlichen Standards", idx: r(0,1,2,3,4,5,6,7) }],
    kurz: [{ text: "NIS-2 umsetzen und das BSI stärken (CISO Bund); Bundesverwaltung als Vorbild", idx: r(0,1,2,3,4,5,6,7) }] },
  { aspekt: "Cybersicherheit (BSI)", partei: "GRÜNE",
    lang: [{ text: "Strengere IT-Sicherheit und umfassende NIS-2-Umsetzung; BSI-Unabhängigkeit und transparentes Schwachstellenmanagement; gegen Auslagerung kritischer Infrastruktur an Google/Palantir", idx: r(0,1,2,3) }],
    kurz: [{ text: "Umfassende NIS-2-Umsetzung; BSI-Unabhängigkeit; gegen Auslagerung an ausländische Anbieter", idx: r(0,1,2,3) }] },
  { aspekt: "Cybersicherheit (BSI)", partei: "LINKE",
    lang: [{ text: "Sicherheitsstandards und Ressourcen für Länder und Kommunen; gegen Instrumentalisierung des BSI durch Geheimdienste", idx: r(0,1) }],
    kurz: [{ text: "Standards und Ressourcen für Länder/Kommunen; gegen Instrumentalisierung des BSI", idx: r(0,1) }] },
  { aspekt: "Cybersicherheit (BSI)", partei: "SPD",
    lang: [
      { text: "BSI als zentrale Stelle ausbauen und NIS-2/CER umsetzen; Investitionen gegen russische Cyberangriffe und zum Schutz kritischer Infrastruktur", idx: r(0,1,2,3,4,6,7,10) },
      { text: "Kritische Komponenten durch europäische Unternehmen sichern (Souveränität); Cyberangriffe als geopolitische Bedrohung", idx: r(8,5,9) },
    ],
    kurz: [
      { text: "BSI als zentrale Stelle ausbauen und NIS-2/CER umsetzen; Investitionen gegen Cyberangriffe", idx: r(0,1,2,3,4,6,7,10) },
      { text: "Kritische Komponenten durch europäische Unternehmen sichern (Souveränität)", idx: r(8,5,9) },
    ] },

  // ===== KI-Inhalte / Urheberrecht =====
  { aspekt: "KI-Inhalte / Urheberrecht", partei: "AfD",
    lang: [{ text: "Gegen übermäßige EU-KI-Regulierung; AI Act als bürokratische Innovationsbremse ablehnen", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Gegen übermäßige EU-KI-Regulierung; AI Act als Innovationsbremse ablehnen", idx: r(0,1,2,3,4) }] },
  { aspekt: "KI-Inhalte / Urheberrecht", partei: "CDU/CSU",
    lang: [{ text: "KI als Chance; Regulierung mit Augenmaß und Entbürokratisierung der EU-KI-Verordnung", idx: r(0,1,2) }],
    kurz: [{ text: "KI als Chance; Regulierung mit Augenmaß, AI Act entbürokratisieren", idx: r(0,1,2) }] },
  { aspekt: "KI-Inhalte / Urheberrecht", partei: "GRÜNE",
    lang: [{ text: "AI Act umsetzen mit Transparenzregister; gegen unrechtmäßiges KI-Training und Blackbox-Systeme in der Verwaltung", idx: r(0,1,2,3) }],
    kurz: [{ text: "AI Act umsetzen mit Transparenzregister; gegen unrechtmäßiges KI-Training", idx: r(0,1,2,3) }] },
  { aspekt: "KI-Inhalte / Urheberrecht", partei: "LINKE",
    lang: [{ text: "KI-Verordnung vollständig umsetzen (gegen Abschwächung); Haftungsregeln für KI-Anbieter und Vergütung von Urhebern beim KI-Training", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "KI-Verordnung vollständig umsetzen; Haftung für KI-Anbieter und Urhebervergütung", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "KI-Inhalte / Urheberrecht", partei: "SPD",
    lang: [{ text: "AI Act als ausgewogenes Regelwerk; Verbot nicht-konsensualer Deepfakes durch Strafrecht und EU-Verordnungen", idx: r(0,1,2,3) }],
    kurz: [{ text: "AI Act als ausgewogenes Regelwerk; Verbot nicht-konsensualer Deepfakes", idx: r(0,1,2,3) }] },

  // ===== Open Source / Open Data =====
  { aspekt: "Open Source / Open Data", partei: "AfD",
    lang: [{ text: "Kritik am Open-Data-Gesetz als wirkungslos und bürokratisch", idx: r(0) }],
    kurz: [{ text: "Kritik am Open-Data-Gesetz als wirkungslos und bürokratisch", idx: r(0) }] },
  { aspekt: "Open Source / Open Data", partei: "CDU/CSU",
    lang: [{ text: "Open-Source-Lösungen und europäische Alternativen fördern (Kritik am niedrigen Anteil)", idx: r(0) }],
    kurz: [{ text: "Open-Source-Lösungen und europäische Alternativen fördern", idx: r(0) }] },
  { aspekt: "Open Source / Open Data", partei: "GRÜNE",
    lang: [{ text: "Open Source als Standard in der Verwaltung (Public Money, Public Code) für digitale Souveränität; Open Access als offene Infrastruktur", idx: r(0,1,2,3) }],
    kurz: [{ text: "Open Source als Standard (Public Money, Public Code); Open Access", idx: r(0,1,2,3) }] },
  { aspekt: "Open Source / Open Data", partei: "LINKE",
    lang: [{ text: "Open Source stärker fördern und Anteil erheben; einklagbarer Rechtsanspruch auf Open-Data-Bereitstellung und echtes Transparenzgesetz", idx: r(0,1,2,3) }],
    kurz: [{ text: "Open Source stärker fördern; einklagbarer Open-Data-Anspruch und Transparenzgesetz", idx: r(0,1,2,3) }] },
  { aspekt: "Open Source / Open Data", partei: "SPD",
    lang: [{ text: "Investition in souveräne Open-Source-Lösungen (openDesk, openCode) als Microsoft-Alternative; messbare Ziele und bürokratiearme Umsetzung", idx: r(0,1,2,3) }],
    kurz: [{ text: "Souveräne Open-Source-Lösungen (openDesk) als Microsoft-Alternative", idx: r(0,1,2,3) }] },

  // ===== NGO-Finanzierung offenlegen =====
  { aspekt: "NGO-Finanzierung offenlegen", partei: "AfD",
    lang: [{ text: "Kritik an staatlich finanzierten NGOs als ideologisch; Forderung nach Transparenz der Finanzierung", idx: r(0,1,2) }],
    kurz: [{ text: "Kritik an staatlich finanzierten NGOs; Transparenz der Finanzierung fordern", idx: r(0,1,2) }] },
  { aspekt: "NGO-Finanzierung offenlegen", partei: "CDU/CSU",
    lang: [{ text: "Transparenzanforderungen auch für NGOs und Zivilgesellschaft bei politisch motivierten Kampagnen", idx: r(0) }],
    kurz: [{ text: "Transparenzanforderungen auch für NGOs bei politischen Kampagnen", idx: r(0) }] },
];

applySynthese("Medien, Kommunikation und Informationstechnik", CELLS);
