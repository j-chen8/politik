/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Verteidigung" (54 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Abrüstung =====
  { aspekt: "Abrüstung", partei: "AfD",
    lang: [{ text: "Abrüstungsverträge und Verhandlungen befürworten, aber nur aus eigener Stärke; unverbindliche Appelle als wirkungslos kritisiert", idx: r(0,2,1,3) }],
    kurz: [{ text: "Abrüstungsverträge befürworten, aber nur aus eigener Stärke", idx: r(0,2,1,3) }] },
  { aspekt: "Abrüstung", partei: "CDU/CSU",
    lang: [{ text: "Abrüstung nur aus einer Position der Stärke (Abschreckung notwendig); gegen Abrüstung durch Nachgiebigkeit", idx: r(0,1,2) }],
    kurz: [{ text: "Abrüstung nur aus einer Position der Stärke; gegen Nachgiebigkeit", idx: r(0,1,2) }] },
  { aspekt: "Abrüstung", partei: "GRÜNE",
    lang: [{ text: "Rüstungskontrolle und internationale Abkommen für globale Sicherheit (auch bei neuen Technologien)", idx: r(0) }],
    kurz: [{ text: "Rüstungskontrolle und internationale Abkommen", idx: r(0) }] },
  { aspekt: "Abrüstung", partei: "LINKE",
    lang: [{ text: "Abrüstung und Rüstungskontrolle statt Aufrüstungsspirale; atomwaffenfreie Welt", idx: r(0,1) }],
    kurz: [{ text: "Abrüstung und Rüstungskontrolle statt Aufrüstung; atomwaffenfreie Welt", idx: r(0,1) }] },
  { aspekt: "Abrüstung", partei: "SPD",
    lang: [{ text: "Rüstungskontrolle und Verhandlungslösungen als Sicherheitspolitik, aber keine einseitige Abrüstung ohne glaubwürdige Abschreckung", idx: r(0,1,2,3) }],
    kurz: [{ text: "Rüstungskontrolle und Verhandlungen, aber keine einseitige Abrüstung ohne Abschreckung", idx: r(0,1,2,3) }] },

  // ===== Auslandseinsätze =====
  { aspekt: "Auslandseinsätze", partei: "AfD",
    lang: [
      { text: "Beendigung/Ablehnung von Mandaten ohne erkennbaren Erfolg oder Exitstrategie (UNIFIL, KFOR, Sea Guardian, EUFOR Althea, Irini)", idx: r(3,4,5,6,8,11,13,14,20,21,23,24,25,28,30,33,35,36,37,38,39,40,41,42,44,45,47,49,7,26) },
      { text: "Beschränkung auf Landes-/Bündnisverteidigung; gegen Waffenlieferungen und Soldaten für die Ukraine (Taurus)", idx: r(10,31,34,46,29,2,12,17,18,19,0) },
      { text: "Einzelne Missionen befürwortet (Rotes Meer/Aspides zum Schutz der Handelswege, UNMISS); Würdigung der Soldaten; Diplomatie statt Militär", idx: r(15,16,22,27,32,43,48,1,9) },
    ],
    kurz: [
      { text: "Beendigung/Ablehnung von Mandaten ohne Erfolg/Exitstrategie; Beschränkung auf Landesverteidigung", idx: r(3,4,5,6,8,11,13,14,20,21,23,24,25,28,30,33,35,36,37,38,39,40,41,42,44,45,47,49,7,26,10,31,34,46,29) },
      { text: "Gegen Waffenlieferungen für die Ukraine; einzelne Missionen (Rotes Meer/Aspides, UNMISS) befürwortet; Diplomatie statt Militär", idx: r(2,12,17,18,19,0,15,16,22,27,32,43,48,1,9) },
    ] },
  { aspekt: "Auslandseinsätze", partei: "CDU/CSU",
    lang: [
      { text: "Befürwortung der Balkan-Mandate (EUFOR Althea, KFOR) zur Stabilisierung und Konfliktprävention", idx: r(5,9,15,16,20,24,25,30,31,33,36,38,41,42,43,46) },
      { text: "Befürwortung maritimer und Naher-Osten-Mandate (Sea Guardian, Aspides, UNIFIL, Irak, Irini, UNMISS)", idx: r(3,4,6,7,8,10,11,12,14,18,19,21,26,27,29,32,35,37,45,47) },
      { text: "Ukraine-Unterstützung; Würdigung der Soldaten und Force Protection; Hafeninfrastruktur/Mobilität; präventive Wirkung", idx: r(1,2,34,40,13,44,22,0,17,23,28,39) },
    ],
    kurz: [
      { text: "Befürwortung der Auslandsmandate (EUFOR Althea, KFOR, Sea Guardian, Aspides, UNIFIL, Irak, Irini, UNMISS) zur Stabilisierung", idx: r(5,9,15,16,20,24,25,30,31,33,36,38,41,42,43,46,3,4,6,7,8,10,11,12,14,18,19,21,26,27,29,32,35,37,45,47) },
      { text: "Ukraine-Unterstützung; Würdigung der Soldaten und Force Protection", idx: r(1,2,34,40,13,44,22,0,17,23,28,39) },
    ] },
  { aspekt: "Auslandseinsätze", partei: "GRÜNE",
    lang: [
      { text: "Befürwortung der Mandate (EUFOR Althea, KFOR, Irak, UNMISS, UNIFIL, Irini, Sea Guardian) mit parlamentarischer Kontrolle", idx: r(1,2,3,4,5,7,8,10,11,15,16,17,18,19,24,25,26,27) },
      { text: "Unterstützung der Ukraine gegen die russische Aggression", idx: r(0,12,14,22,23) },
      { text: "Menschenrechte und Seenotrettung beachten (Kritik an libyscher Küstenwache); Aspides kritisch; eigenständige europäische Strategie", idx: r(13,20,6,9,21) },
    ],
    kurz: [
      { text: "Befürwortung der Mandate mit parlamentarischer Kontrolle; Unterstützung der Ukraine", idx: r(1,2,3,4,5,7,8,10,11,15,16,17,18,19,24,25,26,27,0,12,14,22,23) },
      { text: "Menschenrechte/Seenotrettung beachten; Aspides kritisch; eigenständige europäische Strategie", idx: r(13,20,6,9,21) },
    ] },
  { aspekt: "Auslandseinsätze", partei: "LINKE",
    lang: [
      { text: "Ablehnung und Forderung nach Beendigung von Mandaten (Sea Guardian, UNIFIL, KFOR, EUFOR Althea, Irini, Counter Daesh, Litauen)", idx: r(0,2,3,5,6,7,8,9,11,12,13,16,17,18,14) },
      { text: "Diplomatie und zivile Konfliktlösung statt Militär (fehlende Exitstrategien); Ukraine humanitär ja, aber Mittelkontrolle", idx: r(1,4,10,15) },
    ],
    kurz: [
      { text: "Ablehnung und Beendigung von Mandaten (Sea Guardian, UNIFIL, KFOR, EUFOR Althea, Counter Daesh, Litauen)", idx: r(0,2,3,5,6,7,8,9,11,12,13,16,17,18,14) },
      { text: "Diplomatie und zivile Konfliktlösung statt Militär; bei Ukraine Mittelkontrolle", idx: r(1,4,10,15) },
    ] },
  { aspekt: "Auslandseinsätze", partei: "SPD",
    lang: [
      { text: "Befürwortung der Balkan-/Litauen-Mandate (KFOR, EUFOR Althea, Brigade Litauen) zur Stabilisierung", idx: r(0,7,8,10,16,18,20,27,28,29,33) },
      { text: "Befürwortung maritimer und Naher-Osten-Mandate (Sea Guardian, Rotes Meer, UNIFIL, Irak, Irini, UNMISS)", idx: r(2,4,5,11,12,13,19,21,22,24,26) },
      { text: "Ukraine-Unterstützung; Würdigung und Fürsorge für die Soldaten; defensive, völkerrechtskonforme Einsätze; internationale Verantwortung", idx: r(1,25,30,3,15,23,32,6,17,31,9,14) },
    ],
    kurz: [
      { text: "Befürwortung der Auslandsmandate (KFOR, EUFOR Althea, Litauen, Sea Guardian, UNIFIL, Irak, UNMISS) zur Stabilisierung", idx: r(0,7,8,10,16,18,20,27,28,29,33,2,4,5,11,12,13,19,21,22,24,26) },
      { text: "Ukraine-Unterstützung; Würdigung der Soldaten; defensive, völkerrechtskonforme Einsätze", idx: r(1,25,30,3,15,23,32,6,17,31,9,14) },
    ] },

  // ===== Autonome Waffen / Cyber =====
  { aspekt: "Autonome Waffen / Cyber", partei: "AfD",
    lang: [{ text: "Cyberbedrohungen anerkennen, aber gegen Missbrauch erweiterter Befugnisse; für notwendige KI-Einsätze in der Militärtechnik", idx: r(0,1,2) }],
    kurz: [{ text: "Cyberbedrohungen anerkennen, gegen Missbrauch der Befugnisse; für KI-Einsätze in der Militärtechnik", idx: r(0,1,2) }] },
  { aspekt: "Autonome Waffen / Cyber", partei: "CDU/CSU",
    lang: [
      { text: "KI, Drohnen und unbemannte Systeme/Präzisionswaffen durch beschleunigte Beschaffung einsatzfähig machen", idx: r(0,1,3,4,6,7,8) },
      { text: "Cyberabwehr und Schutz vor hybriden Bedrohungen (NIS-2, Cyberdome, kritische Infrastruktur)", idx: r(2,5,9,10,11,12,13,14,15) },
    ],
    kurz: [
      { text: "KI, Drohnen und unbemannte Systeme durch beschleunigte Beschaffung einsatzfähig machen", idx: r(0,1,3,4,6,7,8) },
      { text: "Cyberabwehr und Schutz vor hybriden Bedrohungen (kritische Infrastruktur)", idx: r(2,5,9,10,11,12,13,14,15) },
    ] },
  { aspekt: "Autonome Waffen / Cyber", partei: "GRÜNE",
    lang: [
      { text: "Rüstungskontrolle und ethische Leitlinien für KI in Waffensystemen; klare Regeln für Drohnen/KI als hybride Bedrohungen", idx: r(1,3) },
      { text: "Cyberangriffe auf kritische Infrastruktur abwehren; elektronischer Kampf Russlands", idx: r(2,0) },
    ],
    kurz: [{ text: "Rüstungskontrolle und ethische KI-Leitlinien; Cyberangriffe auf kritische Infrastruktur abwehren", idx: r(1,3,2,0) }] },
  { aspekt: "Autonome Waffen / Cyber", partei: "LINKE",
    lang: [{ text: "Gegen die Militarisierung des Weltraums", idx: r(0) }],
    kurz: [{ text: "Gegen die Militarisierung des Weltraums", idx: r(0) }] },
  { aspekt: "Autonome Waffen / Cyber", partei: "SPD",
    lang: [
      { text: "Schutz vor Cyber- und hybriden Bedrohungen; verstärkte Investitionen in Cyber-Abwehr", idx: r(0,2) },
      { text: "Warnung vor der Überantwortung von Verantwortung an KI", idx: r(1) },
    ],
    kurz: [{ text: "Schutz vor Cyber-/hybriden Bedrohungen; Warnung vor der Überantwortung von Verantwortung an KI", idx: r(0,2,1) }] },

  // ===== NATO =====
  { aspekt: "NATO", partei: "AfD",
    lang: [
      { text: "NATO als reines Verteidigungsbündnis ohne interventionistische Einsätze; Kritik an Sea Guardian/Missionen als ineffektiv", idx: r(13,14,4,12,15,1) },
      { text: "Gegen NATO-Aufrüstungsziel (5 % BIP/2036) als Überbelastung; Diplomatie statt Konfrontation, gegen Raketenstationierung", idx: r(6,8,9,16,3,5,17) },
      { text: "Russische Bedrohung als Angstschürung; Kritik an Kosovo/Jugoslawien-Einsatz; Quadriga positiv", idx: r(7,0,2,10,11) },
    ],
    kurz: [
      { text: "NATO als reines Verteidigungsbündnis ohne Interventionen; gegen Aufrüstungsziel (5 % BIP)", idx: r(13,14,4,12,15,1,6,8,9,16) },
      { text: "Diplomatie statt Konfrontation, gegen Raketenstationierung; russische Bedrohung als Angstschürung", idx: r(3,5,17,7,0,2,10,11) },
    ] },
  { aspekt: "NATO", partei: "CDU/CSU",
    lang: [
      { text: "NATO als Fundament europäischer Sicherheit; Bündnistreue und Verlässlichkeit gegen russische Bedrohung", idx: r(0,1,2,4,12,14,17,21,25,26,27,28,29,30,31,32,33) },
      { text: "NATO-Missionen befürworten (Sea Guardian, Irak, KFOR, EUFOR Althea, Baltic Sentry an der Ostflanke)", idx: r(3,5,8,9,10,11,16,19,20,23,24,34,15) },
      { text: "Maritime Infrastruktur als NATO-relevant; Beschaffung an NATO-Standards anpassen", idx: r(6,7,18,22,13) },
    ],
    kurz: [
      { text: "NATO als Fundament europäischer Sicherheit; Bündnistreue gegen russische Bedrohung", idx: r(0,1,2,4,12,14,17,21,25,26,27,28,29,30,31,32,33) },
      { text: "NATO-Missionen befürworten (Sea Guardian, KFOR, EUFOR Althea, Baltic Sentry); maritime Infrastruktur als NATO-relevant", idx: r(3,5,8,9,10,11,16,19,20,23,24,34,15,6,7,18,22,13) },
    ] },
  { aspekt: "NATO", partei: "GRÜNE",
    lang: [
      { text: "NATO-Solidarität und Bündnispartner stärken; Ostflanke gegen Russland; gegen Schwächungssignale", idx: r(1,3,6,8,9,10,12,16,17) },
      { text: "Europäische Verteidigungsfähigkeit auch ohne die USA und Rüstungskoordination; gegen ein russisches Vetorecht", idx: r(2,7,14,5) },
      { text: "NATO-Missionen (KFOR, Balkan, Irak); NATO-Mitgliedschaft der Ukraine", idx: r(0,4,11,15,13) },
    ],
    kurz: [
      { text: "NATO-Solidarität und Ostflanke gegen Russland stärken; europäische Verteidigungsfähigkeit auch ohne die USA", idx: r(1,3,6,8,9,10,12,16,17,2,7,14,5) },
      { text: "NATO-Missionen (KFOR, Balkan, Irak); NATO-Mitgliedschaft der Ukraine", idx: r(0,4,11,15,13) },
    ] },
  { aspekt: "NATO", partei: "LINKE",
    lang: [
      { text: "Kritik an NATO-Missionen als ineffektiv und der Abschottung dienend; Jugoslawien-Bombardierung 1999 als völkerrechtswidrig", idx: r(0,1,6,5,11) },
      { text: "Gegen NATO-Aufrüstungsvorgaben und Trump-Abhängigkeit; gegen Raketenabschreckung und Beistandsklausel über Artikel 5", idx: r(3,9,8,7) },
      { text: "Transparenz zur NATO-Truppenpräsenz; Kritik an Türkei-Kooperation; Jugendoffiziere", idx: r(2,10,4) },
    ],
    kurz: [
      { text: "Kritik an NATO-Missionen als ineffektiv; Jugoslawien-Bombardierung als völkerrechtswidrig; gegen Aufrüstungsvorgaben", idx: r(0,1,6,5,11,3,9,8,7) },
      { text: "Transparenz zur NATO-Truppenpräsenz; Kritik an Türkei-Kooperation", idx: r(2,10,4) },
    ] },
  { aspekt: "NATO", partei: "SPD",
    lang: [
      { text: "NATO-Bündnisverpflichtungen erfüllen; Verlässlichkeit und Stärkung der Ostflanke", idx: r(0,6,8,9,10,12,18) },
      { text: "Transatlantische Partnerschaft mit europäischer Selbstbehauptung; NATO-Doppelbeschluss (Abschreckung plus Gespräche)", idx: r(1,2,3,13,16,5,7) },
      { text: "NATO-Missionen (Sea Guardian, KFOR) als internationale Verpflichtung", idx: r(4,11,14,15,17,19) },
    ],
    kurz: [
      { text: "NATO-Bündnisverpflichtungen erfüllen, Ostflanke stärken; transatlantische Partnerschaft mit europäischer Selbstbehauptung", idx: r(0,6,8,9,10,12,18,1,2,3,13,16,5,7) },
      { text: "NATO-Missionen (Sea Guardian, KFOR) als internationale Verpflichtung", idx: r(4,11,14,15,17,19) },
    ] },

  // ===== Nukleare Teilhabe =====
  { aspekt: "Nukleare Teilhabe", partei: "AfD",
    lang: [{ text: "Gegen Stationierung atomwaffenfähiger Mittelstreckenraketen ohne deutsche Kontrolle; nukleare Zusammenarbeit mit dem Vereinigten Königreich", idx: r(0,1) }],
    kurz: [{ text: "Gegen Stationierung ohne deutsche Kontrolle; nukleare Zusammenarbeit mit dem UK", idx: r(0,1) }] },
  { aspekt: "Nukleare Teilhabe", partei: "CDU/CSU",
    lang: [{ text: "Stationierung moderner Mittelstreckenwaffen zur glaubwürdigen Abschreckung und zum Schutz der Bündnispartner", idx: r(0,1) }],
    kurz: [{ text: "Stationierung von Mittelstreckenwaffen zur glaubwürdigen Abschreckung", idx: r(0,1) }] },
  { aspekt: "Nukleare Teilhabe", partei: "GRÜNE",
    lang: [{ text: "Skeptisch zum Atomwaffenverbotsvertrag, Unterstützung des Nichtverbreitungsvertrags; implizite Verteidigung der geplanten Stationierung", idx: r(0,1) }],
    kurz: [{ text: "Unterstützung des Nichtverbreitungsvertrags; implizite Verteidigung der geplanten Stationierung", idx: r(0,1) }] },
  { aspekt: "Nukleare Teilhabe", partei: "LINKE",
    lang: [{ text: "Gegen nukleare Teilhabe; Forderung nach deren Ende", idx: r(0) }],
    kurz: [{ text: "Gegen nukleare Teilhabe", idx: r(0) }] },
  { aspekt: "Nukleare Teilhabe", partei: "SPD",
    lang: [{ text: "Stationierung von Mittelstreckenraketen als notwendig (Verteidigungsfähigkeit) versus Ablehnung zugunsten von Rüstungskontrolle", idx: r(0,1) }],
    kurz: [{ text: "Stationierung als notwendig versus Ablehnung zugunsten von Rüstungskontrolle (uneinheitlich)", idx: r(0,1) }] },

  // ===== Rüstungsexporte =====
  { aspekt: "Rüstungsexporte", partei: "AfD",
    lang: [{ text: "Gegen Waffenlieferungen als Konfliktlösung (Diplomatie); Kritik an fehlender parlamentarischer Kontrolle bei Ukraine-Lieferungen", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen Waffenlieferungen (Diplomatie); fehlende parlamentarische Kontrolle bei Ukraine-Lieferungen", idx: r(0,1,2) }] },
  { aspekt: "Rüstungsexporte", partei: "CDU/CSU",
    lang: [{ text: "Britischer Beitritt zum europäischen Übereinkommen über Ausfuhrkontrollen begrüßt", idx: r(0) }],
    kurz: [{ text: "Britischer Beitritt zu europäischen Ausfuhrkontrollen begrüßt", idx: r(0) }] },
  { aspekt: "Rüstungsexporte", partei: "GRÜNE",
    lang: [{ text: "Waffenlieferungen an die Ukraine (Taurus) befürworten; gegen Ausstattung der libyschen Küstenwache", idx: r(1,0) }],
    kurz: [{ text: "Waffenlieferungen an die Ukraine befürworten; gegen Ausstattung der libyschen Küstenwache", idx: r(1,0) }] },
  { aspekt: "Rüstungsexporte", partei: "LINKE",
    lang: [{ text: "Gegen Rüstungsexporte (Israel, Saudi-Arabien, VAE, britische Firmen); gegen Rüstungsexporte als Instrument wirtschaftlichen Wachstums", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Gegen Rüstungsexporte (Israel, Saudi-Arabien, VAE) und gegen Rüstung als Wirtschaftsinstrument", idx: r(0,1,2,3,4) }] },
  { aspekt: "Rüstungsexporte", partei: "SPD",
    lang: [{ text: "Gegen Rüstungsexporte in Diktaturen und an Kriegsverbrecher (Menschenrechte vor Wirtschaftsinteressen); Waffenembargo durchsetzen", idx: r(0,1) }],
    kurz: [{ text: "Gegen Rüstungsexporte in Diktaturen (Menschenrechte vor Wirtschaft); Waffenembargo durchsetzen", idx: r(0,1) }] },

  // ===== Rüstungsindustrie / Beschaffung =====
  { aspekt: "Rüstungsindustrie / Beschaffung", partei: "AfD",
    lang: [
      { text: "Beschaffung beschleunigen und strukturell reformieren; deutsche wehrtechnische Industrie bevorzugen (strategische Autonomie)", idx: r(0,1,2,5,6,9,10) },
      { text: "Deutsch-britische Rüstungskooperation (gegen FCAS als ineffizient); Munition/Qualität", idx: r(4,8,3,7) },
    ],
    kurz: [
      { text: "Beschaffung beschleunigen und reformieren; deutsche Industrie bevorzugen", idx: r(0,1,2,5,6,9,10) },
      { text: "Deutsch-britische Kooperation (gegen FCAS); Munition/Qualität", idx: r(4,8,3,7) },
    ] },
  { aspekt: "Rüstungsindustrie / Beschaffung", partei: "CDU/CSU",
    lang: [
      { text: "Beschaffung beschleunigen (Vergaberecht-Ausnahmen, wettbewerbsorientiert, parallele Verfahren, Drohnenstrategie)", idx: r(0,3,5,6,7,8,10,12) },
      { text: "Investitionen und Planungssicherheit für die Industrie; deutsch-britische und europäische Rüstungskooperation; Start-ups einbeziehen", idx: r(1,2,9,11,13,4) },
    ],
    kurz: [
      { text: "Beschaffung beschleunigen (Vergaberecht-Ausnahmen, wettbewerbsorientiert); Planungssicherheit für die Industrie", idx: r(0,3,5,6,7,8,10,12,1,2,9) },
      { text: "Deutsch-britische und europäische Rüstungskooperation; Start-ups einbeziehen", idx: r(11,13,4) },
    ] },
  { aspekt: "Rüstungsindustrie / Beschaffung", partei: "GRÜNE",
    lang: [
      { text: "Beschaffungsreform und flexiblere Prozesse; Kritik an Mängeln und Fehlerkultur im Ministerium", idx: r(0,3,1,2,6,7) },
      { text: "Mehr parlamentarische Kontrolle; europäische statt regionale Logik bei Rüstungsinvestitionen", idx: r(4,8,5) },
    ],
    kurz: [
      { text: "Beschaffungsreform und flexiblere Prozesse; Kritik an Mängeln und Fehlerkultur", idx: r(0,3,1,2,6,7) },
      { text: "Mehr parlamentarische Kontrolle; europäische statt regionale Logik", idx: r(4,8,5) },
    ] },
  { aspekt: "Rüstungsindustrie / Beschaffung", partei: "LINKE",
    lang: [
      { text: "Kritik an mangelnder Transparenz, Effizienz und parlamentarischer Kontrolle (Kostenüberschreitungen)", idx: r(0,2,3) },
      { text: "Gegen Aufrüstung und neue Waffensysteme; gegen freihändige Vergabe ohne Ausschreibung (Rheinmetall, Korruptionsrisiko)", idx: r(1,4,5) },
    ],
    kurz: [
      { text: "Kritik an mangelnder Transparenz, Effizienz und Kontrolle bei Rüstungsbeschaffungen", idx: r(0,2,3) },
      { text: "Gegen Aufrüstung und freihändige Vergabe ohne Ausschreibung (Korruptionsrisiko)", idx: r(1,4,5) },
    ] },
  { aspekt: "Rüstungsindustrie / Beschaffung", partei: "SPD",
    lang: [
      { text: "Beschaffung beschleunigen und entbürokratisieren (Start-ups, Mittelstand, Großkonzerne); Planungssicherheit", idx: r(0,2,3,4,6) },
      { text: "Deutsch-britische Kooperation; massive Steigerung von Munitionsproduktion und Material", idx: r(1,5,7) },
    ],
    kurz: [
      { text: "Beschaffung beschleunigen und entbürokratisieren; Planungssicherheit für die Industrie", idx: r(0,2,3,4,6) },
      { text: "Deutsch-britische Kooperation; massive Steigerung von Munition und Material", idx: r(1,5,7) },
    ] },

  // ===== Truppenstärke / Ausstattung =====
  { aspekt: "Truppenstärke / Ausstattung", partei: "AfD",
    lang: [
      { text: "Bessere Ausstattung, modernes Gerät und Personalaufwuchs für eine schlagkräftige Bundeswehr", idx: r(6,8,13,14,21,24,25,26,30,33,12,3) },
      { text: "Kritik an Personaldefizit, Vakanzen, mangelnder Einsatzbereitschaft und Führung", idx: r(2,4,5,18,19,28,31) },
      { text: "Mittel von Auslandseinsätzen zur Landesverteidigung umverteilen (Truppenbegrenzung Rotes Meer)", idx: r(1,9,10,27,29,32,17,20) },
      { text: "Wehrpflicht als Rekrutierungsquelle; Beförderung/Besoldung; Jugendoffiziere; Soldatenrecht; Material an die Ukraine kritisiert", idx: r(16,22,11,23,0,7,15) },
    ],
    kurz: [
      { text: "Bessere Ausstattung und Personalaufwuchs; Kritik an Personaldefizit, Vakanzen und Einsatzbereitschaft", idx: r(6,8,13,14,21,24,25,26,30,33,12,3,2,4,5,18,19,28,31) },
      { text: "Mittel von Auslandseinsätzen zur Landesverteidigung umverteilen; Wehrpflicht als Rekrutierungsquelle", idx: r(1,9,10,27,29,32,17,20,16,22,11,23,0,7,15) },
    ] },
  { aspekt: "Truppenstärke / Ausstattung", partei: "CDU/CSU",
    lang: [
      { text: "Modernisierung und bessere Ausstattung der Bundeswehr (Material, Schutz, Munition); kriegstüchtig machen", idx: r(1,2,5,8,9,10,21,24,28,29,33,34,39,40,41,37) },
      { text: "Personalaufwuchs (Ziel 260.000), Reserve und langfristige Personalstrategie", idx: r(3,6,13,15,19,25,32,36,18,27) },
      { text: "Infrastruktur/maritim und Standorte; Würdigung der Bundeswehr; europäische Kooperation; Mandatsobergrenzen; Drohnen", idx: r(16,22,23,30,0,7,12,26,35,4,20,31,11,14,17,38) },
    ],
    kurz: [
      { text: "Modernisierung und bessere Ausstattung der Bundeswehr (kriegstüchtig); Personalaufwuchs (Ziel 260.000) und Reserve", idx: r(1,2,5,8,9,10,21,24,28,29,33,34,39,40,41,37,3,6,13,15,19,25,32,36,18,27) },
      { text: "Infrastruktur/maritim und Standorte; europäische Kooperation; Drohnen", idx: r(16,22,23,30,0,7,12,26,35,4,20,31,11,14,17,38) },
    ] },
  { aspekt: "Truppenstärke / Ausstattung", partei: "GRÜNE",
    lang: [
      { text: "Bessere Ausstattung (Drohnenabwehr, Flugabwehr, Funk); Kritik an Beschaffungsmängeln und Verzögerungen", idx: r(3,5,6,7,9,10,12,13,15,0) },
      { text: "Personal gewinnen (hohe Abbruchquoten); Sicherheit ist mehr als Truppenstärke (politische Lösungen); LOT-Häuser; Haushaltsverzögerung", idx: r(4,11,1,14,2,8) },
    ],
    kurz: [
      { text: "Bessere Ausstattung (Drohnen-/Flugabwehr, Funk); Kritik an Beschaffungsmängeln und Verzögerungen", idx: r(3,5,6,7,9,10,12,13,15,0) },
      { text: "Personal gewinnen (hohe Abbruchquoten); Sicherheit ist mehr als Truppenstärke", idx: r(4,11,1,14,2,8) },
    ] },
  { aspekt: "Truppenstärke / Ausstattung", partei: "LINKE",
    lang: [
      { text: "Gegen Aufrüstung und Erhöhung um 80.000 Soldaten / stärkste konventionelle Armee Europas", idx: r(1,3,7,8,4) },
      { text: "Mittel führen nicht zu besserer Lage; strukturelle Probleme (sexualisierte Gewalt); Kaserneninfrastruktur; gegen Zulagen für Spezialkräfte", idx: r(0,2,6,5) },
    ],
    kurz: [
      { text: "Gegen Aufrüstung und Erhöhung um 80.000 Soldaten / stärkste Armee Europas", idx: r(1,3,7,8,4) },
      { text: "Mittel führen nicht zu besserer Lage; strukturelle Probleme; Kaserneninfrastruktur", idx: r(0,2,6,5) },
    ] },
  { aspekt: "Truppenstärke / Ausstattung", partei: "SPD",
    lang: [
      { text: "Modernisierung, Ausstattung und Personalaufwuchs (Ziel 460.000 inkl. Reserve); Beschaffung beschleunigen", idx: r(1,2,4,5,8,9,10,13,15,19) },
      { text: "Reserve und neuer Wehrdienst zur Durchhaltefähigkeit; Mittelstreckenfähigkeiten; Fürsorge für Soldaten; gegen russische Aufrüstung", idx: r(6,17,21,3,16,20,0,12,14,7,11,18) },
    ],
    kurz: [
      { text: "Modernisierung, Ausstattung und Personalaufwuchs (Ziel 460.000); Beschaffung beschleunigen", idx: r(1,2,4,5,8,9,10,13,15,19) },
      { text: "Reserve und Durchhaltefähigkeit; Mittelstreckenfähigkeiten; Fürsorge für Soldaten; gegen russische Aufrüstung", idx: r(6,17,21,3,16,20,0,12,14,7,11,18) },
    ] },

  // ===== Verteidigungsausgaben (2 %) =====
  { aspekt: "Verteidigungsausgaben (2 %)", partei: "AfD",
    lang: [
      { text: "Kritik an hohen, schuldenfinanzierten Verteidigungsausgaben; Finanzierung aus dem Kernhaushalt unter Einhaltung der Schuldenbremse", idx: r(0,1,2,5) },
      { text: "Steigerung des Etats teils als notwendig anerkannt; immaterielle Faktoren (Patriotismus, Disziplin)", idx: r(4,3) },
    ],
    kurz: [
      { text: "Kritik an hohen, schuldenfinanzierten Verteidigungsausgaben; Finanzierung aus dem Kernhaushalt", idx: r(0,1,2,5) },
      { text: "Steigerung teils als notwendig anerkannt; immaterielle Faktoren", idx: r(4,3) },
    ] },
  { aspekt: "Verteidigungsausgaben (2 %)", partei: "CDU/CSU",
    lang: [{ text: "Erhebliche Steigerung der Verteidigungsausgaben (Richtung 3,5 % / 5 % BIP) über die Bereichsausnahme der Schuldenbremse als notwendig für Abschreckung und Verteidigungsfähigkeit", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15) }],
    kurz: [{ text: "Erhebliche Steigerung der Verteidigungsausgaben (3,5 %/5 % BIP) über die Bereichsausnahme der Schuldenbremse", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15) }] },
  { aspekt: "Verteidigungsausgaben (2 %)", partei: "GRÜNE",
    lang: [
      { text: "Investitionen in Verteidigung befürworten, aber gegen gleichzeitige Kürzungen bei zivilen Demokratieprogrammen; 2 % reicht künftig nicht", idx: r(0,1,2) },
      { text: "Mittelfristig Rückkehr zur Finanzierung aus dem Kernhaushalt statt über die Bereichsausnahme", idx: r(3) },
    ],
    kurz: [{ text: "Verteidigungsinvestitionen befürworten, aber nicht zulasten ziviler Programme; Rückkehr zur Kernhaushaltsfinanzierung", idx: r(0,1,2,3) }] },
  { aspekt: "Verteidigungsausgaben (2 %)", partei: "LINKE",
    lang: [{ text: "Kritik an massivem Rüstungsbudget (bis 5 % BIP) als unverhältnismäßig; Umverteilung zu sozialen Projekten und humanitärer Hilfe", idx: r(0,1,3,4,5,2) }],
    kurz: [{ text: "Kritik an massivem Rüstungsbudget (bis 5 % BIP); Umverteilung zu sozialen Projekten", idx: r(0,1,3,4,5,2) }] },
  { aspekt: "Verteidigungsausgaben (2 %)", partei: "SPD",
    lang: [
      { text: "Erhöhte Verteidigungsausgaben (86 Mrd. bis über 600 Mrd.) über die Ausnahme der Schuldenbremse zur Erfüllung der NATO-Verpflichtungen", idx: r(0,1,2,3,4,5,7,8) },
      { text: "Kritik an Ressourcenverschwendung durch Wettrüsten", idx: r(6) },
    ],
    kurz: [{ text: "Erhöhte Verteidigungsausgaben über die Ausnahme der Schuldenbremse (NATO-Verpflichtungen); Kritik am Wettrüsten", idx: r(0,1,2,3,4,5,7,8,6) }] },

  // ===== Wehrpflicht / Wehrdienst =====
  { aspekt: "Wehrpflicht / Wehrdienst", partei: "AfD",
    lang: [
      { text: "Wiedereinführung der allgemeinen Wehrpflicht / Verpflichtung statt reiner Freiwilligkeit", idx: r(0,3,4,6,7,8,10,11,12,14,17) },
      { text: "Kritik am Losverfahren und am Wehrdienst-Modernisierungsgesetz; Jugendoffiziere; sinkende Bereitschaft", idx: r(1,2,13,16,5,9,15) },
    ],
    kurz: [
      { text: "Wiedereinführung der allgemeinen Wehrpflicht / Verpflichtung statt Freiwilligkeit", idx: r(0,3,4,6,7,8,10,11,12,14,17) },
      { text: "Kritik am Losverfahren und am Modernisierungsgesetz; Jugendoffiziere", idx: r(1,2,13,16,5,9,15) },
    ] },
  { aspekt: "Wehrpflicht / Wehrdienst", partei: "CDU/CSU",
    lang: [
      { text: "Neuer (zunächst freiwilliger) Wehrdienst zur Personalgewinnung und Stärkung der Reserve", idx: r(0,1,2,7,8,10,12,13,14,16,19,20,21) },
      { text: "Wehrpflicht im Grundgesetz behalten; verbindliche Heranziehung als Plan B bei zu wenig Freiwilligen", idx: r(4,5,11,15,17,18,9) },
      { text: "Kritik an unklarer AfD-Position; Anerkennung der Grünen-Musterung", idx: r(3,6) },
    ],
    kurz: [
      { text: "Neuer (zunächst freiwilliger) Wehrdienst zur Personalgewinnung; Wehrpflicht im Grundgesetz behalten (Plan B)", idx: r(0,1,2,7,8,10,12,13,14,16,19,20,21,4,5,11,15,17,18,9) },
      { text: "Kritik an unklarer AfD-Position; Anerkennung der Grünen-Musterung", idx: r(3,6) },
    ] },
  { aspekt: "Wehrpflicht / Wehrdienst", partei: "GRÜNE",
    lang: [
      { text: "Wehrpflicht als notwendiges Instrument im Verteidigungsfall (gegen Abschaffung)", idx: r(0,5) },
      { text: "Kritik an Musterungspflicht nur für Männer; breitere gesamtgesellschaftliche Lösung mit fairen Bedingungen", idx: r(1,3,4,2) },
    ],
    kurz: [
      { text: "Wehrpflicht als notwendiges Instrument im Verteidigungsfall", idx: r(0,5) },
      { text: "Kritik an Musterungspflicht nur für Männer; breitere gesamtgesellschaftliche Lösung", idx: r(1,3,4,2) },
    ] },
  { aspekt: "Wehrpflicht / Wehrdienst", partei: "LINKE",
    lang: [
      { text: "Ablehnung der Wehrpflicht als Zwang; Freiwilligkeit und Selbstbestimmung; gegen Auslandseinsatz-Verpflichtung", idx: r(1,4,5,6,0) },
      { text: "Gegen Rekrutierung Minderjähriger und Bundeswehr-Präsenz in Schulen", idx: r(2,3) },
    ],
    kurz: [
      { text: "Ablehnung der Wehrpflicht als Zwang; Freiwilligkeit und Selbstbestimmung", idx: r(1,4,5,6,0) },
      { text: "Gegen Rekrutierung Minderjähriger und Bundeswehr-Präsenz in Schulen", idx: r(2,3) },
    ] },
  { aspekt: "Wehrpflicht / Wehrdienst", partei: "SPD",
    lang: [
      { text: "Neuer, zunächst freiwilliger Wehrdienst zur Stärkung von Personalbestand und Reserve (Wehrerfassung/Musterung)", idx: r(0,1,2,3,7,10) },
      { text: "Wehrpflicht im Grundgesetz als Sicherheitsnetz (Bedarfswehrpflicht); Freiwilligkeit und Selbstbestimmung; Jugendoffiziere/Information", idx: r(6,9,4,5,8) },
    ],
    kurz: [
      { text: "Neuer, zunächst freiwilliger Wehrdienst zur Stärkung von Personal und Reserve", idx: r(0,1,2,3,7,10) },
      { text: "Wehrpflicht im Grundgesetz als Sicherheitsnetz; Freiwilligkeit und Selbstbestimmung", idx: r(6,9,4,5,8) },
    ] },

  // ===== Zivilschutz =====
  { aspekt: "Zivilschutz", partei: "AfD",
    lang: [{ text: "Einzelne Maßnahmen zur zivilen Verteidigung (Übungstag, Warnsysteme, Ausstattung) ja, aber gegen zusätzliche Bürokratie und Unternehmensbelastung", idx: r(0) }],
    kurz: [{ text: "Einzelne Zivilschutz-Maßnahmen ja, aber gegen zusätzliche Bürokratie", idx: r(0) }] },
  { aspekt: "Zivilschutz", partei: "CDU/CSU",
    lang: [{ text: "Zivilschutz und Bevölkerungsschutz stärken (Budget, Warnsysteme, Verzahnung zivil-militärisch, Drohnenabwehr)", idx: r(0,1,2,3,4,5,6) }],
    kurz: [{ text: "Zivilschutz und Bevölkerungsschutz stärken (Budget, Warnsysteme, Verzahnung zivil-militärisch)", idx: r(0,1,2,3,4,5,6) }] },
  { aspekt: "Zivilschutz", partei: "GRÜNE",
    lang: [
      { text: "Zivile Verteidigung stärken (Strukturen, Mittel, Operationsplan, Übungstag); Kritik an Koordination und Lücken", idx: r(0,2,5,6) },
      { text: "THW/Feuerwehr/Freiwilligendienste anerkennen; Vorbereitung auf Bedrohungen", idx: r(1,3,4) },
    ],
    kurz: [
      { text: "Zivile Verteidigung stärken (Strukturen, Mittel, Operationsplan); Kritik an Koordination und Lücken", idx: r(0,2,5,6) },
      { text: "THW/Freiwilligendienste anerkennen; Vorbereitung auf Bedrohungen", idx: r(1,3,4) },
    ] },
  { aspekt: "Zivilschutz", partei: "SPD",
    lang: [{ text: "Bevölkerungsschutz finanzieren (THW), zivile Freiwilligendienste stärken; Eigenverantwortung in der Krisenvorsorge", idx: r(1,2,0) }],
    kurz: [{ text: "Bevölkerungsschutz und zivile Freiwilligendienste finanzieren; Eigenverantwortung in der Krisenvorsorge", idx: r(1,2,0) }] },
];

applySynthese("Verteidigung", CELLS);
