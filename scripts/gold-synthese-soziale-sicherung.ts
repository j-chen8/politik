/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Soziale Sicherung" (49 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Bürgergeld / Grundsicherung =====
  { aspekt: "Bürgergeld / Grundsicherung", partei: "AfD",
    lang: [
      { text: "Kritik an steigenden Kosten und Missbrauch; unzureichende Einsparungen der Reform; aktivierende Grundsicherung mit Arbeitspflicht und Sanktionen", idx: r(0,5,9,18,20,24,7,23) },
      { text: "Leistungen für Ausländer und ukrainische Flüchtlinge kürzen / ins Asylbewerberleistungssystem zurückführen", idx: r(10,11,13,14,16,22,25) },
      { text: "Renten-Anrechnung auf Grundsicherung mit Freibetrag; Sperrung für per Haftbefehl Gesuchte; Gesundheitskosten; weitere Einzelpunkte", idx: r(4,21,27,28,15,3,17,1,6,2,8,12,26,19) },
    ],
    kurz: [
      { text: "Kritik an Kosten und Missbrauch; aktivierende Grundsicherung mit Arbeitspflicht und Sanktionen", idx: r(0,5,9,18,20,24,7,23) },
      { text: "Leistungen für Ausländer/Ukrainer kürzen oder ins Asylsystem zurückführen; Renten-Freibetrag; Sperrung für Gesuchte", idx: r(10,11,13,14,16,22,25,4,21,27,28,15,3,17,1,6,2,8,12,26,19) },
    ] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "CDU/CSU",
    lang: [
      { text: "Bürgergeld abschaffen und durch eine neue Grundsicherung nach Fordern-und-Fördern mit Sanktionen ersetzen", idx: r(1,2,3,6,7,10,11,14,15,16,17,18,21) },
      { text: "Ukrainer pragmatisch im Bürgergeld, künftig im AsylbLG mit Arbeitsmarktzugang; Missbrauch/Schwarzarbeit und Datenaustausch bekämpfen", idx: r(4,8,12,9,13,19,20) },
      { text: "Bürgergeld an Preisentwicklung und Nettolöhne gekoppelt", idx: r(0,5) },
    ],
    kurz: [
      { text: "Bürgergeld abschaffen und durch neue Grundsicherung nach Fordern-und-Fördern mit Sanktionen ersetzen", idx: r(1,2,3,6,7,10,11,14,15,16,17,18,21) },
      { text: "Ukrainer im Bürgergeld/AsylbLG mit Arbeitsmarktzugang; Missbrauch bekämpfen", idx: r(4,8,12,9,13,19,20,0,5) },
    ] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "GRÜNE",
    lang: [
      { text: "Gegen Sanktionen bis zum Existenzminimum als verfassungswidrig; gegen geplante Verschärfungen und Kürzungen", idx: r(0,4,11,12,2,14,3) },
      { text: "Bürgergeld als richtiger Schritt (Weiterbildung, Beratung); gegen Stigmatisierung; Ukrainer im Bürgergeld belassen", idx: r(1,8,7,13,5,6,9,10) },
    ],
    kurz: [
      { text: "Gegen Sanktionen bis zum Existenzminimum (verfassungswidrig); gegen Verschärfungen und Kürzungen", idx: r(0,4,11,12,2,14,3) },
      { text: "Bürgergeld als richtiger Schritt; gegen Stigmatisierung; Ukrainer im Bürgergeld belassen", idx: r(1,8,7,13,5,6,9,10) },
    ] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "LINKE",
    lang: [
      { text: "Bürgergeld als Grundrecht statt Verdachtsfall; gegen Sanktionen unter dem Existenzminimum; menschenwürdige Vermittlung", idx: r(0,1,3,5,8,9,11,4) },
      { text: "Bürgergeld zu niedrig (Existenzminimum nicht erreicht); Ukrainer als Mindestleistung absichern", idx: r(2,6,10,7) },
    ],
    kurz: [
      { text: "Bürgergeld als Grundrecht; gegen Sanktionen unter dem Existenzminimum", idx: r(0,1,3,5,8,9,11,4) },
      { text: "Bürgergeld zu niedrig (Existenzminimum); Ukrainer absichern", idx: r(2,6,10,7) },
    ] },
  { aspekt: "Bürgergeld / Grundsicherung", partei: "SPD",
    lang: [
      { text: "Bürgergeld verteidigen und weiterentwickeln statt abschaffen; Sanktionen nur für wenige (unter 3 %), Kooperationsplan", idx: r(0,2,3,5,8) },
      { text: "Reform mit Balance (Schutz von Kindern, Aufstockenden, Erkrankten); Ukrainer im Bürgergeld; gegen AfD-Rentenanrechnung", idx: r(4,9,7,10,6,1) },
    ],
    kurz: [
      { text: "Bürgergeld verteidigen und weiterentwickeln statt abschaffen; Sanktionen nur für wenige (unter 3 %)", idx: r(0,2,3,5,8) },
      { text: "Reform mit Balance (Schutz von Kindern); Ukrainer im Bürgergeld", idx: r(4,9,7,10,6,1) },
    ] },

  // ===== Erwerbsminderungsrente =====
  { aspekt: "Erwerbsminderungsrente", partei: "AfD",
    lang: [{ text: "Kritik an hohen Ablehnungsquoten und bürokratischen Hürden; würdevolle Antragstellung und schnellere Verfahren", idx: r(1,0) }],
    kurz: [{ text: "Kritik an hohen Ablehnungsquoten und Hürden; würdevolle, schnellere Verfahren", idx: r(1,0) }] },
  { aspekt: "Erwerbsminderungsrente", partei: "CDU/CSU",
    lang: [{ text: "Fallmanagement, Reha und Prävention zur Wiedereingliederung und Vermeidung von Erwerbsminderung; Reform mit Gesamtkonzept", idx: r(0,1,5,2,3,4,6) }],
    kurz: [{ text: "Fallmanagement, Reha und Prävention zur Wiedereingliederung; Reform mit Gesamtkonzept", idx: r(0,1,5,2,3,4,6) }] },
  { aspekt: "Erwerbsminderungsrente", partei: "GRÜNE",
    lang: [{ text: "Hohe Ablehnungsquote senken, Abschläge reduzieren, Überlastungsschutzrente; viele können aus gesundheitlichen Gründen nicht länger arbeiten", idx: r(0,1,2) }],
    kurz: [{ text: "Hohe Ablehnungsquote senken, Abschläge reduzieren, Überlastungsschutzrente", idx: r(0,1,2) }] },
  { aspekt: "Erwerbsminderungsrente", partei: "LINKE",
    lang: [{ text: "Zu hohe Zugangshürden; würdiger Zugang für alle, die nicht mehr arbeiten können; Kritik an Fondsprodukten ohne Absicherung", idx: r(0,1) }],
    kurz: [{ text: "Zu hohe Zugangshürden; würdiger Zugang; Fondsprodukte sichern nicht ab", idx: r(0,1) }] },
  { aspekt: "Erwerbsminderungsrente", partei: "SPD",
    lang: [{ text: "Starke Erwerbsminderungsrente; Reha und Fallmanagement zur Vermeidung von Erwerbsminderung", idx: r(0,2,3,1) }],
    kurz: [{ text: "Starke Erwerbsminderungsrente; Reha und Fallmanagement zur Vermeidung", idx: r(0,2,3,1) }] },

  // ===== Hinterbliebenenrente =====
  { aspekt: "Hinterbliebenenrente", partei: "CDU/CSU",
    lang: [{ text: "Hinterbliebenenrenten als wichtige Aufgabe der Rentenversicherung", idx: r(0) }],
    kurz: [{ text: "Hinterbliebenenrenten als wichtige Aufgabe der Rentenversicherung", idx: r(0) }] },
  { aspekt: "Hinterbliebenenrente", partei: "GRÜNE",
    lang: [{ text: "Hinterbliebenenrente als wichtige Leistung der gesetzlichen Rentenversicherung", idx: r(0) }],
    kurz: [{ text: "Hinterbliebenenrente als wichtige Leistung der gesetzlichen Rentenversicherung", idx: r(0) }] },
  { aspekt: "Hinterbliebenenrente", partei: "LINKE",
    lang: [{ text: "Mütterrente vollenden; Kritik an Abhängigkeit von der Witwenrente und an Fondsprodukten ohne Todesfallabsicherung", idx: r(0,2,1) }],
    kurz: [{ text: "Mütterrente vollenden; Kritik an Abhängigkeit von der Witwenrente", idx: r(0,2,1) }] },

  // ===== Kapitalgedeckte Vorsorge =====
  { aspekt: "Kapitalgedeckte Vorsorge", partei: "AfD",
    lang: [
      { text: "Kostengünstige ETF-Sparpläne und Junior-Spardepot mit Kapitaldeckung statt der gescheiterten Riester-Rente", idx: r(2,3,5,9,11,0,7,10,14) },
      { text: "Wahlfreiheit für Selbstständige; Kritik an staatlicher Fondsverwaltung und ideologischen Anlagekriterien; Umlageverfahren teils verteidigt; gegen Besteuerung der privaten Vorsorge", idx: r(1,6,12,8,15,4,13) },
    ],
    kurz: [
      { text: "Kostengünstige ETF-Sparpläne und Junior-Spardepot statt der gescheiterten Riester-Rente", idx: r(2,3,5,9,11,0,7,10,14) },
      { text: "Wahlfreiheit; Kritik an staatlicher Fondsverwaltung; gegen Besteuerung der privaten Vorsorge", idx: r(1,6,12,8,15,4,13) },
    ] },
  { aspekt: "Kapitalgedeckte Vorsorge", partei: "CDU/CSU",
    lang: [
      { text: "Kapitalgedecktes Altersvorsorgedepot/Frühstartrente (ETF, Kostendeckel) statt Riester-Rente als Ergänzung zur gesetzlichen Rente", idx: r(1,2,4,5,6,7,9,10,11,12,13) },
      { text: "Wahlfreiheit bei den Produkten; Drei-Säulen-Modell; gegen Systemwechsel zur Umlage; gegen Beiträge auf Vermögenserträge", idx: r(0,8,15,16,3,14) },
    ],
    kurz: [
      { text: "Kapitalgedecktes Altersvorsorgedepot/Frühstartrente (ETF) statt Riester als Ergänzung zur gesetzlichen Rente", idx: r(1,2,4,5,6,7,9,10,11,12,13) },
      { text: "Wahlfreiheit; Drei-Säulen-Modell; gegen Systemwechsel zur Umlage", idx: r(0,8,15,16,3,14) },
    ] },
  { aspekt: "Kapitalgedeckte Vorsorge", partei: "GRÜNE",
    lang: [{ text: "Öffentlich verwalteter Bürgerfonds (Opt-out-Modell) als kostengünstige Alternative zur gescheiterten Riester-Rente, ergänzend zur starken gesetzlichen Rente", idx: r(1,3,4,5,6,7,0,2) }],
    kurz: [{ text: "Öffentlich verwalteter Bürgerfonds (Opt-out) statt Riester-Rente, ergänzend zur gesetzlichen Rente", idx: r(1,3,4,5,6,7,0,2) }] },
  { aspekt: "Kapitalgedeckte Vorsorge", partei: "LINKE",
    lang: [{ text: "Ablehnung der kapitalmarktgestützten Vorsorge als risikobehaftet und ungleichheitsverschärfend; stattdessen starkes öffentliches Rentensystem", idx: r(0,1,2,3) }],
    kurz: [{ text: "Ablehnung der kapitalmarktgestützten Vorsorge; stattdessen starkes öffentliches Rentensystem", idx: r(0,1,2,3) }] },
  { aspekt: "Kapitalgedeckte Vorsorge", partei: "SPD",
    lang: [
      { text: "Private und betriebliche Vorsorge verbessern (ETF-Sparplan, Kostendeckel, Frühstartrente), besonders für Geringverdiener; Staatsfonds nach skandinavischem Vorbild", idx: r(0,2,3,5,6,4) },
      { text: "Kritik an mehr Eigenvorsorge als Lösung für Menschen mit niedrigen Einkommen", idx: r(1) },
    ],
    kurz: [
      { text: "Private/betriebliche Vorsorge verbessern (ETF, Kostendeckel, Staatsfonds), besonders für Geringverdiener", idx: r(0,2,3,5,6,4) },
      { text: "Kritik an mehr Eigenvorsorge als Lösung für niedrige Einkommen", idx: r(1) },
    ] },

  // ===== Kindergrundsicherung =====
  { aspekt: "Kindergrundsicherung", partei: "LINKE",
    lang: [{ text: "Echte Kindergrundsicherung gegen Kinderarmut; Erhöhung des Elterngeld-Mindestbetrags mit Inflationsanpassung", idx: r(0,1,2) }],
    kurz: [{ text: "Echte Kindergrundsicherung gegen Kinderarmut; höherer Elterngeld-Mindestbetrag", idx: r(0,1,2) }] },

  // ===== Mindest- / Grundrente =====
  { aspekt: "Mindest- / Grundrente", partei: "AfD",
    lang: [{ text: "Kritik am Grundrentenzuschlag als teuer und am Bedarf vorbei; Kritik an Altersarmut und zu niedriger Grundsicherung im Alter", idx: r(0,1,2,3) }],
    kurz: [{ text: "Kritik am Grundrentenzuschlag als teuer und am Bedarf vorbei; Altersarmut", idx: r(0,1,2,3) }] },
  { aspekt: "Mindest- / Grundrente", partei: "CDU/CSU",
    lang: [{ text: "Grundrente als zielgenaue Regelung für Rentner mit langer Erwerbstätigkeit befürworten", idx: r(0,1) }],
    kurz: [{ text: "Grundrente als zielgenaue Regelung befürworten", idx: r(0,1) }] },
  { aspekt: "Mindest- / Grundrente", partei: "GRÜNE",
    lang: [{ text: "Garantierente als Maßnahme gegen Altersarmut; Kritik an Anrechnung der Mütterrente", idx: r(0,1) }],
    kurz: [{ text: "Garantierente gegen Altersarmut; Kritik an Anrechnung der Mütterrente", idx: r(0,1) }] },
  { aspekt: "Mindest- / Grundrente", partei: "LINKE",
    lang: [{ text: "Solidarische Mindestrente als Instrument gegen Altersarmut (unbürokratisch statt Riester)", idx: r(0,1,2,3) }],
    kurz: [{ text: "Solidarische Mindestrente gegen Altersarmut", idx: r(0,1,2,3) }] },
  { aspekt: "Mindest- / Grundrente", partei: "SPD",
    lang: [{ text: "Grundrente als Unterstützung für lebenslang Arbeitende mit niedriger Rente", idx: r(0) }],
    kurz: [{ text: "Grundrente für lebenslang Arbeitende mit niedriger Rente", idx: r(0) }] },

  // ===== Minijobs =====
  { aspekt: "Minijobs", partei: "AfD",
    lang: [{ text: "Sozialversicherungsfreie Saisonarbeit ausweiten (auf 115 Tage); ältere Minijobber bis zur Steuerfreigrenze aufstocken", idx: r(0,2,1) }],
    kurz: [{ text: "SV-freie Saisonarbeit ausweiten; ältere Minijobber aufstocken", idx: r(0,2,1) }] },
  { aspekt: "Minijobs", partei: "CDU/CSU",
    lang: [{ text: "Steuerliche Rahmenbedingungen für Rentner-Minijobs reformieren zur höheren Erwerbsbeteiligung", idx: r(0) }],
    kurz: [{ text: "Rentner-Minijobs steuerlich reformieren für höhere Erwerbsbeteiligung", idx: r(0) }] },
  { aspekt: "Minijobs", partei: "GRÜNE",
    lang: [{ text: "Gegen Ausweitung sozialversicherungsfreier Beschäftigung in der Landwirtschaft; Krankenversicherungsschutz ab dem ersten Tag", idx: r(0) }],
    kurz: [{ text: "Gegen SV-freie Ausweitung; Krankenversicherungsschutz ab dem ersten Tag", idx: r(0) }] },
  { aspekt: "Minijobs", partei: "LINKE",
    lang: [{ text: "Minijobs in sozialversicherungspflichtige Beschäftigung überführen", idx: r(0) }],
    kurz: [{ text: "Minijobs in sozialversicherungspflichtige Beschäftigung überführen", idx: r(0) }] },
  { aspekt: "Minijobs", partei: "SPD",
    lang: [{ text: "Befreiung von der Rentenversicherungspflicht beim Minijob widerrufbar machen", idx: r(0) }],
    kurz: [{ text: "RV-Pflicht-Befreiung beim Minijob widerrufbar machen", idx: r(0) }] },

  // ===== Renteneintrittsalter =====
  { aspekt: "Renteneintrittsalter", partei: "AfD",
    lang: [
      { text: "Gegen Erhöhung des Renteneintrittsalters (Rente mit 70); Rente mit 63 erhalten (45 Jahre sind genug)", idx: r(2,6,7,9,12,8,10,5,4) },
      { text: "Freiwillig länger arbeiten über Steuerfreibeträge/Aktivrente (auch für Selbstständige), nicht per Gesetz", idx: r(0,1,3,11) },
    ],
    kurz: [
      { text: "Gegen Erhöhung des Renteneintrittsalters; Rente mit 63 erhalten", idx: r(2,6,7,9,12,8,10,5,4) },
      { text: "Freiwillig länger arbeiten über Steuerfreibeträge/Aktivrente, nicht per Gesetz", idx: r(0,1,3,11) },
    ] },
  { aspekt: "Renteneintrittsalter", partei: "CDU/CSU",
    lang: [
      { text: "Freiwilliges längeres Arbeiten über die Aktivrente steuerlich fördern (ohne Zwang)", idx: r(1,2,3,4,7,10) },
      { text: "Gegen Frühverrentung (Rente mit 63); tatsächliches Renteneintrittsalter zu niedrig; Reformbedarf angesichts der Demografie (67 als Referenz)", idx: r(8,9,11,6,0,5) },
    ],
    kurz: [
      { text: "Freiwilliges längeres Arbeiten über die Aktivrente steuerlich fördern (ohne Zwang)", idx: r(1,2,3,4,7,10) },
      { text: "Gegen Frühverrentung; tatsächliches Renteneintrittsalter zu niedrig; Reformbedarf (67 als Referenz)", idx: r(8,9,11,6,0,5) },
    ] },
  { aspekt: "Renteneintrittsalter", partei: "GRÜNE",
    lang: [{ text: "Gegen weitere Erhöhung des Renteneintrittsalters; längeres Arbeiten freiwillig und über Prävention/Reha ermöglichen; Rente mit 63 auf Bedürftige fokussieren", idx: r(0,1,3,4,2) }],
    kurz: [{ text: "Gegen weitere Erhöhung; längeres Arbeiten freiwillig über Prävention/Reha ermöglichen", idx: r(0,1,3,4,2) }] },
  { aspekt: "Renteneintrittsalter", partei: "LINKE",
    lang: [{ text: "Gegen Erhöhung des Renteneintrittsalters und gegen Zwang zur Weiterbeschäftigung; abschlagsfreie Rente ab 60 nach 40 Beitragsjahren", idx: r(0,1,4,3,2) }],
    kurz: [{ text: "Gegen Erhöhung des Renteneintrittsalters; abschlagsfreie Rente ab 60 nach 40 Beitragsjahren", idx: r(0,1,4,3,2) }] },
  { aspekt: "Renteneintrittsalter", partei: "SPD",
    lang: [
      { text: "Gegen Verlängerung der Regelaltersgrenze; freiwilliges längeres Arbeiten über Anreize (Aktivrente, Steuerbonus)", idx: r(0,1,4,5) },
      { text: "Gesunde Arbeitsbedingungen, um das Renteneintrittsalter gesund zu erreichen; Kritik an Abgeordnetenpensionen", idx: r(3,2) },
    ],
    kurz: [
      { text: "Gegen Verlängerung der Regelaltersgrenze; freiwilliges längeres Arbeiten über Anreize (Aktivrente)", idx: r(0,1,4,5) },
      { text: "Gesunde Arbeitsbedingungen, um das Renteneintrittsalter gesund zu erreichen", idx: r(3,2) },
    ] },

  // ===== Rentenniveau =====
  { aspekt: "Rentenniveau", partei: "AfD",
    lang: [
      { text: "Rentenniveau zu niedrig (48 %, europäischer Vergleich); Anhebung auf 53–70 % gefordert", idx: r(2,3,7,9,14,17,18,20,22,23,25) },
      { text: "Kritik an der willkürlichen Haltelinie und an versteckten Kosten; Reform statt Steuerzuschüssen angesichts der Demografie", idx: r(0,5,6,1,10,15,16,19) },
      { text: "Private/kapitalgedeckte Vorsorge und Junior-Spardepot; widersprüchliche Anreize; Riester-Absenkung; Abgeordnetenpensionen", idx: r(13,12,24,4,8,11,21) },
    ],
    kurz: [
      { text: "Rentenniveau zu niedrig (48 %); Anhebung auf 53–70 % gefordert; Kritik an der willkürlichen Haltelinie", idx: r(2,3,7,9,14,17,18,20,22,23,25,0,5,6,1,10,15,16,19) },
      { text: "Private/kapitalgedeckte Vorsorge; Riester-Absenkung; Abgeordnetenpensionen", idx: r(13,12,24,4,8,11,21) },
    ] },
  { aspekt: "Rentenniveau", partei: "CDU/CSU",
    lang: [
      { text: "Haltelinie bei 48 % bis 2031 als Verlässlichkeit, aber Rentenpaket zu teuer; umfassende Reform und Rentenkommission nötig", idx: r(2,5,10,27,1,6,11,13,14,20,24) },
      { text: "Drei-Säulen-Modell, kapitalgedeckte Vorsorge und Frühstartrente zur Ergänzung; gegen AfD-70-%-Forderung", idx: r(3,12,15,22,0,19) },
      { text: "Nachhaltigkeitsfaktor und Generationengerechtigkeit (Demografie, Bundeszuschuss); Lebensstandard sichern", idx: r(8,16,17,26,18,23,4,7,9,21,25) },
    ],
    kurz: [
      { text: "Haltelinie bei 48 % bis 2031 als Verlässlichkeit, aber Rentenpaket zu teuer; Reform und Rentenkommission nötig", idx: r(2,5,10,27,1,6,11,13,14,20,24) },
      { text: "Drei-Säulen-Modell und kapitalgedeckte Vorsorge zur Ergänzung; Generationengerechtigkeit (Demografie)", idx: r(3,12,15,22,0,19,8,16,17,26,18,23,4,7,9,21,25) },
    ] },
  { aspekt: "Rentenniveau", partei: "GRÜNE",
    lang: [
      { text: "Gegen Absenkung des Rentenniveaus; Stärkung der gesetzlichen Rente und Stabilisierung bei 48 % (Befristung kritisch)", idx: r(1,4,5,6,9,11,3) },
      { text: "Höhere Erwerbsbeteiligung und Erweiterung des Versichertenkreises zur Finanzierung; gegen Aktivrente als ineffizient", idx: r(0,2,7,8,10) },
    ],
    kurz: [
      { text: "Gegen Absenkung des Rentenniveaus; Stärkung der gesetzlichen Rente und Stabilisierung bei 48 %", idx: r(1,4,5,6,9,11,3) },
      { text: "Höhere Erwerbsbeteiligung zur Finanzierung; gegen Aktivrente als ineffizient", idx: r(0,2,7,8,10) },
    ] },
  { aspekt: "Rentenniveau", partei: "LINKE",
    lang: [
      { text: "Rentenniveau auf 53 % erhöhen und gesetzliche Rente stärken gegen Altersarmut (Stabilisierung bei 48 % zu kurzsichtig)", idx: r(1,4,5,8,10,14,2,11,12,13,16) },
      { text: "Altersarmut benennen (Durchschnittsrente, Pfandflaschen); solidarische Mindestrente; Abflachung sehr hoher Ansprüche", idx: r(0,6,7,15,17,18,3,9) },
    ],
    kurz: [
      { text: "Rentenniveau auf 53 % erhöhen und gesetzliche Rente stärken gegen Altersarmut", idx: r(1,4,5,8,10,14,2,11,12,13,16) },
      { text: "Altersarmut benennen; solidarische Mindestrente; Abflachung sehr hoher Ansprüche", idx: r(0,6,7,15,17,18,3,9) },
    ] },
  { aspekt: "Rentenniveau", partei: "SPD",
    lang: [
      { text: "Haltelinie bei 48 % bis 2031 (und darüber hinaus) als Schutzschild gegen Altersarmut; gegen Senkung", idx: r(0,1,2,3,8,9,11,12,13,15,14,10) },
      { text: "Stärkung der gesetzlichen Rente; gegen Deckelung von Ansprüchen; Kritik an Abgeordnetenrenten; Altersarmut bei Selbstständigen verhindern", idx: r(7,5,4,6) },
    ],
    kurz: [
      { text: "Haltelinie bei 48 % bis 2031 als Schutzschild gegen Altersarmut; gegen Senkung", idx: r(0,1,2,3,8,9,11,12,13,15,14,10) },
      { text: "Stärkung der gesetzlichen Rente; Kritik an Abgeordnetenrenten", idx: r(7,5,4,6) },
    ] },

  // ===== Ukraine-Flüchtlinge =====
  { aspekt: "Ukraine-Flüchtlinge", partei: "AfD",
    lang: [
      { text: "Ukrainer ins Asylbewerberleistungssystem zurückstufen; Bürgergeld zu hoch, niedrige Erwerbsbeteiligung", idx: r(0,1,2,3,4,5,8) },
      { text: "Kritik an hohem Ausländeranteil im Bürgergeld; Datenabgleich bei per Haftbefehl Gesuchten; Pullfaktor", idx: r(6,7,9,10) },
    ],
    kurz: [
      { text: "Ukrainer ins Asylbewerberleistungssystem zurückstufen; Bürgergeld zu hoch", idx: r(0,1,2,3,4,5,8) },
      { text: "Kritik am hohen Ausländeranteil im Bürgergeld; Pullfaktor", idx: r(6,7,9,10) },
    ] },
  { aspekt: "Ukraine-Flüchtlinge", partei: "CDU/CSU",
    lang: [{ text: "Aufnahme von Kriegsflüchtlingen verteidigen; Rechtskreiswechsel SGB → AsylbLG für Neueinreisende mit Arbeitsmarktzugang und Integrationspflicht", idx: r(0,1,2,3) }],
    kurz: [{ text: "Aufnahme verteidigen; Rechtskreiswechsel ins AsylbLG für Neueinreisende mit Arbeitsmarktzugang", idx: r(0,1,2,3) }] },
  { aspekt: "Ukraine-Flüchtlinge", partei: "GRÜNE",
    lang: [{ text: "Gegen den Rechtskreiswechsel ins Asylbewerberleistungsgesetz (schädlich für Integration, Gesundheit, Spracherwerb); Jobcenter-Förderung statt Kürzung", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen den Rechtskreiswechsel ins AsylbLG (schädlich für Integration); Jobcenter-Förderung", idx: r(0,1,2) }] },
  { aspekt: "Ukraine-Flüchtlinge", partei: "LINKE",
    lang: [{ text: "Asylbewerberleistungsgesetz abschaffen, Bürgergeld als Mindestleistung; Solidarität mit ukrainischen Geflüchteten", idx: r(0,1) }],
    kurz: [{ text: "AsylbLG abschaffen, Bürgergeld als Mindestleistung; Solidarität mit Geflüchteten", idx: r(0,1) }] },
  { aspekt: "Ukraine-Flüchtlinge", partei: "SPD",
    lang: [{ text: "Bürgergeld für Ukrainer rechtfertigen; Rechtskreiswechsel mit Bundesfinanzierung ab April 2025; gegen Ausschluss unter dem Existenzminimum", idx: r(0,1,2,3) }],
    kurz: [{ text: "Bürgergeld für Ukrainer; Rechtskreiswechsel mit Bundesfinanzierung; gegen Ausschluss unter Existenzminimum", idx: r(0,1,2,3) }] },

  // ===== Wer zahlt ein =====
  { aspekt: "Wer zahlt ein", partei: "AfD",
    lang: [
      { text: "Bundestagsabgeordnete und Selbstständige in die gesetzliche Rentenversicherung einbeziehen; Wahlfreiheit gegen Zwangsversicherung", idx: r(5,10,16,0,1,15) },
      { text: "Kritik an Belastung der Beitragszahler durch Migranten/Ausländer im System und durch versicherungsfremde Leistungen; klarere Unterscheidung Beitragszahler/Empfänger", idx: r(6,7,11,12,4,9,13) },
      { text: "Demografie/Familienpolitik gefährdet das Umlageprinzip; Beitragsbemessungsgrenze; Haftbefehl-Gesuchte", idx: r(8,2,14,3) },
    ],
    kurz: [
      { text: "Abgeordnete und Selbstständige einbeziehen; Wahlfreiheit gegen Zwangsversicherung", idx: r(5,10,16,0,1,15) },
      { text: "Kritik an Belastung durch Migranten/Ausländer und versicherungsfremde Leistungen; Demografie gefährdet das Umlageprinzip", idx: r(6,7,11,12,4,9,13,8,2,14,3) },
    ] },
  { aspekt: "Wer zahlt ein", partei: "CDU/CSU",
    lang: [
      { text: "Demografischer Wandel (weniger Beitragszahler) erfordert Reform; gegen Ausweitung auf Beamte (löst die Finanzierung nicht)", idx: r(1,2,7,9,11,15,3,4,14) },
      { text: "Frauenerwerbstätigkeit und Migration als Lösung zur Verbreiterung der Beitragsbasis; Selbstständige/Freiberufler einbeziehen; Erziehungsleistung anerkennen", idx: r(13,0,5,17) },
      { text: "Steuerzahler-Gerechtigkeit und Missbrauchsbekämpfung; hohe Steuerfinanzierung; Drei-Säulen für alle; gegen höhere Beitragsbemessungsgrenze; gegen AfD-Darstellung", idx: r(6,16,21,10,20,18,12,8,19) },
    ],
    kurz: [
      { text: "Demografie erfordert Reform; gegen Ausweitung auf Beamte; Frauenerwerbstätigkeit/Migration und Selbstständige zur Verbreiterung der Basis", idx: r(1,2,7,9,11,15,3,4,14,13,0,5,17) },
      { text: "Steuerzahler-Gerechtigkeit und Missbrauchsbekämpfung; Drei-Säulen für alle; gegen höhere Beitragsbemessungsgrenze", idx: r(6,16,21,10,20,18,12,8,19) },
    ] },
  { aspekt: "Wer zahlt ein", partei: "GRÜNE",
    lang: [
      { text: "Erwerbstätigenversicherung für alle (Abgeordnete, Beamte, Selbstständige); Beitragsbemessungsgrenze erhöhen/abschaffen", idx: r(0,1,2,4,6) },
      { text: "Vermögen und Kapitaleinkünfte einbeziehen; gerechtere Arbeitgeberbeteiligung; SV-pflichtige Arbeitsplätze erhalten; freiwillige Beitragszahlung", idx: r(3,8,5,7,9) },
    ],
    kurz: [
      { text: "Erwerbstätigenversicherung für alle (Abgeordnete, Beamte, Selbstständige); Beitragsbemessungsgrenze erhöhen", idx: r(0,1,2,4,6) },
      { text: "Vermögen und Kapitaleinkünfte einbeziehen; gerechtere Arbeitgeberbeteiligung", idx: r(3,8,5,7,9) },
    ] },
  { aspekt: "Wer zahlt ein", partei: "LINKE",
    lang: [
      { text: "Erwerbstätigenversicherung für alle (auch Abgeordnete, Beamte, Selbstständige; Rente von allen für alle)", idx: r(1,3,4,6,7,9,11) },
      { text: "Progressivere Finanzierung über Reichere; Kritik an Einnahmeverlusten durch Lohndumping und ungeschützter Saisonarbeit", idx: r(8,10,2,0,5) },
    ],
    kurz: [
      { text: "Erwerbstätigenversicherung für alle (auch Abgeordnete, Beamte, Selbstständige)", idx: r(1,3,4,6,7,9,11) },
      { text: "Progressivere Finanzierung über Reichere; gegen Lohndumping und ungeschützte Saisonarbeit", idx: r(8,10,2,0,5) },
    ] },
  { aspekt: "Wer zahlt ein", partei: "SPD",
    lang: [
      { text: "Rentenversicherung für alle Erwerbstätigen (auch Abgeordnete, Beamte, Selbstständige); gegen Privilegien", idx: r(2,3,5,6,7,11,13) },
      { text: "Solidarisches Umlagesystem und Steuerfinanzierung; höhere Beiträge von Höherverdienenden; gegen Scheinselbstständigkeit; mehr SV-Beschäftigung", idx: r(0,1,4,10,8,9,12) },
    ],
    kurz: [
      { text: "Rentenversicherung für alle Erwerbstätigen (auch Abgeordnete, Beamte, Selbstständige)", idx: r(2,3,5,6,7,11,13) },
      { text: "Solidarisches Umlagesystem und Steuerfinanzierung; gegen Scheinselbstständigkeit", idx: r(0,1,4,10,8,9,12) },
    ] },
];

applySynthese("Soziale Sicherung", CELLS);
