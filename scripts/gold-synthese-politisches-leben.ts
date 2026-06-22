/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Politisches Leben, Parteien" (37 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Umgang mit der AfD =====
  { aspekt: "Umgang mit der AfD", partei: "AfD",
    lang: [
      { text: "Kritik an der Brandmauer und Ausgrenzung (verweigerte Ausschussvorsitze, Vizepräsidentenwahl) als undemokratische Diskriminierung von Wählern", idx: r(0,1,2,3,4,10,13,17) },
      { text: "Selbstdarstellung als demokratische Partei; gegen Nazi-Vergleiche und Vorwürfe der Demokratiefeindlichkeit", idx: r(8,9,11,12,15,16) },
      { text: "Vorwurf von Doppelstandards und Komplizenschaft anderer Fraktionen; Forderung nach Parteiausschlussverfahren bei Extremisten", idx: r(5,6,7,14) },
    ],
    kurz: [
      { text: "Kritik an Brandmauer und Ausgrenzung (verweigerte Ausschussvorsitze) als undemokratisch", idx: r(0,1,2,3,4,10,13,17) },
      { text: "Selbstdarstellung als demokratische Partei; gegen Nazi-Vergleiche und Doppelstandards", idx: r(8,9,11,12,15,16,5,6,7,14) },
    ] },
  { aspekt: "Umgang mit der AfD", partei: "CDU/CSU",
    lang: [
      { text: "AfD als rechtsextreme, vom Verfassungsschutz eingestufte Gefahr für Rechtsstaat und Minderheiten ablehnen", idx: r(2,6,9,11,18,14) },
      { text: "Kritik an Populismus, Manipulation und Skandalisierung der AfD; Schädigung der politischen Kultur", idx: r(0,1,4,5,8,13,16) },
      { text: "Gegen AfD-Anträge (NGO-Verbot, Tribunalisierung des Parlaments); Verfassungstreue als Voraussetzung für Teilhabe", idx: r(3,7,10,12,15,17) },
    ],
    kurz: [
      { text: "AfD als rechtsextreme Gefahr für Rechtsstaat und Minderheiten ablehnen; Kritik an Populismus und Skandalisierung", idx: r(2,6,9,11,18,14,0,1,4,5,8,13,16) },
      { text: "Gegen AfD-Anträge (NGO-Verbot, Tribunalisierung); Verfassungstreue als Voraussetzung für Teilhabe", idx: r(3,7,10,12,15,17) },
    ] },
  { aspekt: "Umgang mit der AfD", partei: "GRÜNE",
    lang: [
      { text: "AfD als verfassungsfeindlich und rechtsextrem; Forderung nach Parteiverbotsverfahren und stärkeren parlamentarischen Regeln", idx: r(1,3,4,9,12,14) },
      { text: "Gegen AfD-Anträge (Selbstbestimmungsgesetz, NGO-Einschränkung, § 188, Flaggennutzung)", idx: r(2,6,7,8,15) },
      { text: "Schutz von Zivilgesellschaft, Lehrkräften und der Gen Z vor der AfD; Kritik an CDU-AfD-Zusammenarbeit", idx: r(0,5,10,11,13) },
    ],
    kurz: [
      { text: "AfD als verfassungsfeindlich und rechtsextrem; Forderung nach Parteiverbotsverfahren", idx: r(1,3,4,9,12,14) },
      { text: "Gegen AfD-Anträge; Schutz von Zivilgesellschaft und Lehrkräften; Kritik an CDU-AfD-Zusammenarbeit", idx: r(2,6,7,8,15,0,5,10,11,13) },
    ] },
  { aspekt: "Umgang mit der AfD", partei: "LINKE",
    lang: [
      { text: "AfD als faschistisch, autoritär und menschenverachtend ablehnen; Sanktionsmechanismen gegen solche Inhalte", idx: r(2,5,9,11) },
      { text: "Gegen AfD-Anträge (Gemeinnützigkeit, Beleidigungsstrafrecht) und gegen Einschüchterung und Desinformation/Pressefeindlichkeit", idx: r(0,1,3,4,10) },
      { text: "AfD macht Politik für Reiche und ist von russischen Oligarchen beeinflusst; Immunitätsentzug; Kritik an CDU-Zusammenarbeit", idx: r(7,6,8,12) },
    ],
    kurz: [
      { text: "AfD als faschistisch und autoritär ablehnen; gegen AfD-Anträge, Einschüchterung und Desinformation", idx: r(2,5,9,11,0,1,3,4,10) },
      { text: "AfD macht Politik für Reiche, russisch beeinflusst; Kritik an CDU-Zusammenarbeit", idx: r(7,6,8,12) },
    ] },
  { aspekt: "Umgang mit der AfD", partei: "SPD",
    lang: [
      { text: "Verfassungsmäßigkeit der AfD durch das Bundesverfassungsgericht prüfen (Parteiverbot); wehrhafte Demokratie", idx: r(1,7,9,10,13,22,26,27) },
      { text: "Gegen AfD-Anträge (§ 188 streichen, NGO-Finanzierungsverbot, Transparenzabbau) als Angriff auf die Demokratie", idx: r(2,4,6,8,11,14,18,24,28) },
      { text: "AfD als Vertreterin von Hass, Rassismus und Nationalismus; Kritik an Provokation, Skandalisierung und russischer Einflussnahme; parlamentarische Normen", idx: r(0,3,5,12,15,16,17,19,20,21,23,25,29,30) },
    ],
    kurz: [
      { text: "Verfassungsmäßigkeit der AfD durch das BVerfG prüfen (Parteiverbot); gegen AfD-Anträge (§ 188, NGO-Verbot)", idx: r(1,7,9,10,13,22,26,27,2,4,6,8,11,14,18,24,28) },
      { text: "AfD als Vertreterin von Hass und Nationalismus; Kritik an Provokation und russischer Einflussnahme", idx: r(0,3,5,12,15,16,17,19,20,21,23,25,29,30) },
    ] },

  // ===== Demokratieförderung =====
  { aspekt: "Demokratieförderung", partei: "AfD",
    lang: [
      { text: "Kritik an staatlicher NGO- und Demokratie-leben!-Finanzierung als ideologischer Steuergeldmissbrauch", idx: r(0,3,4,9,12,13) },
      { text: "Gegen Einschränkung der Meinungsfreiheit und Strafrecht als Herrschaftsinstrument; Kritik am Vertrauensverlust und am Wählerwillen", idx: r(1,8,2,14,10,7) },
      { text: "Stärkung des Petitionsrechts und der Bürgerbeteiligung; Oppositions- und Minderheitenrechte sowie Gewaltenteilung", idx: r(5,15,17,11,16,6) },
    ],
    kurz: [
      { text: "Kritik an staatlicher NGO- und Demokratie-leben!-Finanzierung als ideologisch; gegen Einschränkung der Meinungsfreiheit", idx: r(0,3,4,9,12,13,1,8,2,14,10,7) },
      { text: "Stärkung des Petitionsrechts und der Oppositions-/Minderheitenrechte", idx: r(5,15,17,11,16,6) },
    ] },
  { aspekt: "Demokratieförderung", partei: "CDU/CSU",
    lang: [
      { text: "Petitionsrecht als gelebte Demokratie stärken; Debattenkultur und Geschäftsordnung; faktenbasiert gegen Populismus", idx: r(0,1,2,14,15,4,7,16,9,18) },
      { text: "Demokratie und Zivilgesellschaft fördern, aber unter Neutralität, Verfassungstreue und Erfolgskontrolle; gegen ein Demokratiefördergesetz als übergriffige Dauerförderung", idx: r(3,5,13,17,19,20,21,10) },
      { text: "Erinnerungskultur und Demokratiegeschichte; Kunstfreiheit und Meinungspluralismus", idx: r(8,12,6,11) },
    ],
    kurz: [
      { text: "Petitionsrecht als gelebte Demokratie stärken; Debattenkultur; faktenbasiert gegen Populismus", idx: r(0,1,2,14,15,4,7,16,9,18) },
      { text: "Zivilgesellschaft fördern unter Neutralität und Verfassungstreue; gegen ein übergriffiges Demokratiefördergesetz", idx: r(3,5,13,17,19,20,21,10,8,12,6,11) },
    ] },
  { aspekt: "Demokratieförderung", partei: "GRÜNE",
    lang: [
      { text: "Verlässliche Förderung der Zivilgesellschaft gegen Rechtsextremismus (gegen Generalverdacht und Umstrukturierung)", idx: r(1,4,9,11,10) },
      { text: "Schutz von Kommunalpolitikern und Ehrenamtlichen; demokratische Schulen und Schutz von Lehrkräften", idx: r(0,8,13) },
      { text: "Petitionswesen, Debattenkultur und Minderheitenschutz stärken; Bürgerbeteiligung und Selbstbestimmung", idx: r(5,12,14,2,3,6,7) },
    ],
    kurz: [
      { text: "Verlässliche Förderung der Zivilgesellschaft gegen Rechtsextremismus; Schutz von Kommunalpolitikern und Lehrkräften", idx: r(1,4,9,11,10,0,8,13) },
      { text: "Petitionswesen, Debattenkultur und Minderheitenschutz stärken", idx: r(5,12,14,2,3,6,7) },
    ] },
  { aspekt: "Demokratieförderung", partei: "LINKE",
    lang: [
      { text: "Demokratiefördergesetz und stabile Finanzierung der Zivilgesellschaft als Daueraufgabe (gegen Generalverdacht und Geheimdienst-Prüfung)", idx: r(2,4,6) },
      { text: "Mehr Transparenz im Bundestag, Oppositionsrechte und Fragerecht; Petitionswesen stärken; demokratische Schulen; Pressefreiheit gegen AfD", idx: r(0,5,9,8,7,3,1) },
    ],
    kurz: [
      { text: "Demokratiefördergesetz und stabile Finanzierung der Zivilgesellschaft als Daueraufgabe", idx: r(2,4,6) },
      { text: "Mehr Transparenz und Oppositionsrechte im Bundestag; Petitionswesen stärken", idx: r(0,5,9,8,7,3,1) },
    ] },
  { aspekt: "Demokratieförderung", partei: "SPD",
    lang: [
      { text: "Demokratiefördergesetz und Förderung der Zivilgesellschaft/NGOs als Ausdruck wehrhafter Demokratie", idx: r(2,6,8,12,15) },
      { text: "Schutz von Kommunalpolitikern und Ehrenamtlichen vor Hass; Erinnerungskultur und politische Bildung", idx: r(4,7,10,0) },
      { text: "Debattenkultur und Geschäftsordnung modernisieren (Sanktionen gegen Hass); Petitionswesen; Pressefreiheit und Transparenz", idx: r(1,14,16,5,13,3,9,11) },
    ],
    kurz: [
      { text: "Demokratiefördergesetz und Förderung der Zivilgesellschaft als wehrhafte Demokratie; Schutz von Kommunalpolitikern", idx: r(2,6,8,12,15,4,7,10,0) },
      { text: "Debattenkultur und Geschäftsordnung modernisieren; Petitionswesen; Pressefreiheit", idx: r(1,14,16,5,13,3,9,11) },
    ] },

  // ===== Verfassungsschutz =====
  { aspekt: "Verfassungsschutz", partei: "AfD",
    lang: [{ text: "Vorwurf, Verfassungsschutz und Geheimdienste würden gegen die AfD eingesetzt und von der Regierung missbraucht; Kritik an parteiischer BVerfG-Besetzung und unzureichender Linksextremismus-Überwachung", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Vorwurf, Verfassungsschutz werde gegen die AfD missbraucht; Kritik an parteiischer BVerfG-Besetzung", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Verfassungsschutz", partei: "CDU/CSU",
    lang: [{ text: "Gleichgewicht zwischen Bekämpfung von Rechts- und Linksextremismus; Kritik an Linke-Zusammenarbeit mit beobachteten Organisationen", idx: r(0,1) }],
    kurz: [{ text: "Gleichgewicht zwischen Rechts- und Linksextremismus-Bekämpfung", idx: r(0,1) }] },
  { aspekt: "Verfassungsschutz", partei: "GRÜNE",
    lang: [{ text: "Verfassungsfeinde aus dem öffentlichen Dienst entfernen; Parteiverbotsverfahren gegen die AfD ernsthaft prüfen (Verfassungsschutz-Erkenntnisse); freiheitliche Grundordnung schützen", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Verfassungsfeinde aus dem öffentlichen Dienst entfernen; Parteiverbotsverfahren gegen die AfD prüfen", idx: r(0,1,2,3,4) }] },
  { aspekt: "Verfassungsschutz", partei: "SPD",
    lang: [{ text: "Verfassungsschutz als Instrument der wehrhaften Demokratie verteidigen; Verfassungsmäßigkeit der AfD durch das Bundesverfassungsgericht prüfen; gegen die Wahl von Verfassungsfeinden in wichtige Ämter", idx: r(0,1,2,3,4,5,6,7,8) }],
    kurz: [{ text: "Verfassungsschutz als wehrhafte Demokratie verteidigen; AfD-Verfassungsmäßigkeit durch das BVerfG prüfen", idx: r(0,1,2,3,4,5,6,7,8) }] },

  // ===== Direkte Demokratie / Bürgerräte =====
  { aspekt: "Direkte Demokratie / Bürgerräte", partei: "AfD",
    lang: [{ text: "Bundesweite Volksabstimmungen nach Schweizer Vorbild und Direktwahl hoher Ämter; Stärkung des Petitionsrechts als direktdemokratisches Element", idx: r(0,2,4,1,3,5) }],
    kurz: [{ text: "Volksabstimmungen nach Schweizer Vorbild; Stärkung des Petitionsrechts", idx: r(0,2,4,1,3,5) }] },
  { aspekt: "Direkte Demokratie / Bürgerräte", partei: "CDU/CSU",
    lang: [{ text: "Petitionsrecht als wichtiges Instrument der direkten Bürgerbeteiligung stärken (Quorum senken, verpflichtende Reaktion der Regierung)", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Petitionsrecht als direkte Bürgerbeteiligung stärken (Quorum senken)", idx: r(0,1,2,3,4) }] },
  { aspekt: "Direkte Demokratie / Bürgerräte", partei: "GRÜNE",
    lang: [{ text: "Bürgerbeteiligung und Petitionswesen als demokratisches Partizipationsinstrument stärken (angesichts von Vertrauensverlust)", idx: r(0,1) }],
    kurz: [{ text: "Bürgerbeteiligung und Petitionswesen stärken", idx: r(0,1) }] },
  { aspekt: "Direkte Demokratie / Bürgerräte", partei: "LINKE",
    lang: [{ text: "Stärkere parlamentarische Behandlung von Petitionen mit hohen Quoren und echte Kontrolle des Petitionsrechts", idx: r(0) }],
    kurz: [{ text: "Stärkere parlamentarische Behandlung von Petitionen mit hohen Quoren", idx: r(0) }] },
  { aspekt: "Direkte Demokratie / Bürgerräte", partei: "SPD",
    lang: [{ text: "Petitionsrecht als wirksames Beteiligungsinstrument stärken und reformieren (Quorumssenkung), das politische Themen setzt", idx: r(0,1,2,3) }],
    kurz: [{ text: "Petitionsrecht als wirksames Beteiligungsinstrument stärken und reformieren", idx: r(0,1,2,3) }] },

  // ===== Wahlrecht / Bundestagsgröße =====
  { aspekt: "Wahlrecht / Bundestagsgröße", partei: "AfD",
    lang: [
      { text: "Kritik am Wahlprüfungsverfahren als Machterhaltungsinstrument; Forderung nach Präzisierung und gründlicher Wahlprüfung/Nachzählung", idx: r(1,5,7) },
      { text: "Gegen die 5-%-Sperrklausel und gegen Geschäftsordnungsreformen, die die Opposition einschränken; mehr Plenarwochen; gegen Paritätsregelungen", idx: r(4,3,6,2,0) },
    ],
    kurz: [
      { text: "Kritik am Wahlprüfungsverfahren als Machterhalt; gegen die 5-%-Sperrklausel", idx: r(1,5,7,4) },
      { text: "Gegen Geschäftsordnungsreformen gegen die Opposition und gegen Paritätsregelungen", idx: r(3,6,2,0) },
    ] },
  { aspekt: "Wahlrecht / Bundestagsgröße", partei: "CDU/CSU",
    lang: [{ text: "Bundestag verkleinern; Wahlrechtsreform 2023 ändern, damit jeder Wahlkreissieger ein Mandat erhält; BSW-Einsprüche und Neuauszählung ablehnen", idx: r(0,1,3,2,4) }],
    kurz: [{ text: "Bundestag verkleinern; Wahlkreissieger sollen ein Mandat erhalten; Einsprüche ablehnen", idx: r(0,1,3,2,4) }] },
  { aspekt: "Wahlrecht / Bundestagsgröße", partei: "GRÜNE",
    lang: [{ text: "Freie, gleiche und geheime Wahlen verteidigen; das geltende Wahlrecht ist verfassungskonform; die 5-%-Hürde ist legitim", idx: r(0,1,2) }],
    kurz: [{ text: "Freie und gleiche Wahlen verteidigen; geltendes Wahlrecht verfassungskonform, 5-%-Hürde legitim", idx: r(0,1,2) }] },
  { aspekt: "Wahlrecht / Bundestagsgröße", partei: "LINKE",
    lang: [{ text: "BSW-Einsprüche unbegründet; Forderung nach Senkung der 5-%-Sperrklausel auf 3 %", idx: r(0,1) }],
    kurz: [{ text: "BSW-Einsprüche unbegründet; Senkung der 5-%-Sperrklausel auf 3 %", idx: r(0,1) }] },
  { aspekt: "Wahlrecht / Bundestagsgröße", partei: "SPD",
    lang: [{ text: "Reduzierung der Sitzanzahl (von über 730 auf 630) als Erfolg; Einsprüche und automatische Neuauszählungen ablehnen; 5-%-Hürde und Spiegelbildprinzip verteidigen", idx: r(2,0,1,3,4) }],
    kurz: [{ text: "Sitzreduzierung auf 630 als Erfolg; 5-%-Hürde verteidigen; Einsprüche ablehnen", idx: r(2,0,1,3,4) }] },

  // ===== Lobbytransparenz / Parteispenden =====
  { aspekt: "Lobbytransparenz / Parteispenden", partei: "AfD",
    lang: [{ text: "Verbot der Staatsfinanzierung für Partei-Vorfeldorganisationen; gegen die TTPA-Verordnung als Einschüchterungsinstrument; transparente Debatte über Interessenkonflikte", idx: r(0,1,2) }],
    kurz: [{ text: "Verbot der Staatsfinanzierung für Partei-Vorfeldorganisationen; gegen die TTPA-Verordnung", idx: r(0,1,2) }] },
  { aspekt: "Lobbytransparenz / Parteispenden", partei: "CDU/CSU",
    lang: [{ text: "Transparenz bei NGO- und Stiftungsfinanzierung und bei politischer Werbung, aber Kritik an Überregulierung der EU-Verordnung", idx: r(0,2,1) }],
    kurz: [{ text: "Transparenz bei NGO-/Stiftungsfinanzierung und politischer Werbung, gegen Überregulierung", idx: r(0,2,1) }] },
  { aspekt: "Lobbytransparenz / Parteispenden", partei: "GRÜNE",
    lang: [{ text: "Legislativer Fußabdruck und Transparenz bei Parteispenden und politischer Werbung; Kritik an AfD-Finanzierung aus dubiosen Quellen; gegen Microtargeting", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Legislativer Fußabdruck und Transparenz bei Spenden und Werbung; gegen Microtargeting", idx: r(0,1,2,3,4) }] },
  { aspekt: "Lobbytransparenz / Parteispenden", partei: "LINKE",
    lang: [{ text: "Gegen den Einfluss von Lobbyisten und Superreichen auf die Politik; Ende des Unternehmenseinflusses", idx: r(0) }],
    kurz: [{ text: "Gegen den Einfluss von Lobbyisten und Superreichen auf die Politik", idx: r(0) }] },
  { aspekt: "Lobbytransparenz / Parteispenden", partei: "SPD",
    lang: [{ text: "Transparenzregeln für politische Werbung und Finanzierung gegen anonyme Kampagnen; Kritik an intransparenten AfD-Geldflüssen", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Transparenzregeln für politische Werbung und Finanzierung; Kritik an AfD-Geldflüssen", idx: r(0,1,2,3,4) }] },

  // ===== Paritätsgesetz =====
  { aspekt: "Paritätsgesetz", partei: "AfD",
    lang: [{ text: "Ablehnung geschlechtlicher Parität bei der Kandidatenaufstellung als verfassungs- und gesetzwidrig", idx: r(0) }],
    kurz: [{ text: "Ablehnung geschlechtlicher Parität als verfassungswidrig", idx: r(0) }] },
  { aspekt: "Paritätsgesetz", partei: "CDU/CSU",
    lang: [{ text: "Geschlechterregelungen auf Kandidatenlisten als verfassungsgemäß im Rahmen der Parteifreiheit", idx: r(0) }],
    kurz: [{ text: "Geschlechterregelungen auf Listen als verfassungsgemäß im Rahmen der Parteifreiheit", idx: r(0) }] },
  { aspekt: "Paritätsgesetz", partei: "GRÜNE",
    lang: [{ text: "Maßnahmen zur Steigerung des Frauenanteils in Parlamenten, einschließlich Koppelung der Parteienfinanzierung an den Frauenanteil", idx: r(0) }],
    kurz: [{ text: "Frauenanteil steigern, auch über Koppelung der Parteienfinanzierung", idx: r(0) }] },
  { aspekt: "Paritätsgesetz", partei: "SPD",
    lang: [{ text: "Erhöhung des Frauenanteils im Bundestag als wichtiges Ziel", idx: r(0) }],
    kurz: [{ text: "Erhöhung des Frauenanteils im Bundestag", idx: r(0) }] },

  // ===== Parteistiftungs-Finanzierung =====
  { aspekt: "Parteistiftungs-Finanzierung", partei: "CDU/CSU",
    lang: [{ text: "Kritik an AfD-Kritik gegen NGO-Finanzierung unter Hinweis auf die eigene Desiderius-Erasmus-Stiftung und deren BVerfG-Verfahren", idx: r(0) }],
    kurz: [{ text: "Kritik an AfD-NGO-Kritik unter Hinweis auf die eigene Parteistiftung", idx: r(0) }] },
  { aspekt: "Parteistiftungs-Finanzierung", partei: "GRÜNE",
    lang: [{ text: "Koppelung der Parteienfinanzierung an den Frauenanteil in Fraktionen als Anreiz für mehr Parität", idx: r(0) }],
    kurz: [{ text: "Parteienfinanzierung an den Frauenanteil koppeln", idx: r(0) }] },

  // ===== Wahlrecht für Nicht-Staatsbürger =====
  { aspekt: "Wahlrecht für Nicht-Staatsbürger", partei: "AfD",
    lang: [{ text: "Ablehnung von Wahlrecht für Migranten und der Ausweitung des kommunalen Wahlrechts auf Nicht-EU-Bürger", idx: r(0,1) }],
    kurz: [{ text: "Ablehnung von Wahlrecht für Migranten und Nicht-EU-Bürger", idx: r(0,1) }] },

  // ===== Amtszeitbegrenzung / Briefwahl =====
  { aspekt: "Amtszeitbegrenzung / Briefwahl", partei: "SPD",
    lang: [{ text: "Erwähnung von Briefwahlunterlagen im Kontext der Wahlabwicklung und -überprüfung", idx: r(0) }],
    kurz: [{ text: "Briefwahlunterlagen im Kontext der Wahlabwicklung", idx: r(0) }] },
];

applySynthese("Politisches Leben, Parteien", CELLS);
