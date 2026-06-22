/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Umwelt" (55 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Artenschutz / Biodiversität =====
  { aspekt: "Artenschutz / Biodiversität", partei: "AfD",
    lang: [
      { text: "Windkraft und Erneuerbare als Naturzerstörung/Vogelschlag; Artenschutz darf nicht der Energiewende geopfert werden", idx: r(0,1,4,7,8,10,11,12,14,15,16,19,23,22) },
      { text: "Wolf ins Bundesjagdgesetz aufnehmen und durch Management regulieren (Schutz der Weidetierhaltung)", idx: r(5,6,13,18) },
      { text: "Meeresschutz/Hochseeabkommen als ineffektive Bürokratie kritisiert; gegen NGO-Klagerechte; Biodiversität im Ackerbau realitätsfern; Regenwald für Biokraftstoffe", idx: r(3,9,21,2,20,17) },
    ],
    kurz: [
      { text: "Windkraft/Erneuerbare als Naturzerstörung; Artenschutz darf nicht der Energiewende geopfert werden", idx: r(0,1,4,7,8,10,11,12,14,15,16,19,23,22) },
      { text: "Wolf ins Jagdrecht/Management; Meeresschutz als Bürokratie kritisiert; gegen NGO-Klagerechte", idx: r(5,6,13,18,3,9,21,2,20,17) },
    ] },
  { aspekt: "Artenschutz / Biodiversität", partei: "CDU/CSU",
    lang: [
      { text: "Klimaschutz und Naturschutz komplementär; Emissionsreduktion schützt Arten", idx: r(0,2,5) },
      { text: "UN-Hochseeschutzabkommen und Meeresschutz befürworten; Regenwaldschutz", idx: r(1,6,8,4) },
      { text: "Wolf-Management/regulierte Bejagung bei günstigem Erhaltungszustand; Rolle der Land-/Forstwirtschaft", idx: r(7,9,10,11,3) },
    ],
    kurz: [
      { text: "Klimaschutz und Naturschutz komplementär; Hochseeschutzabkommen und Regenwaldschutz befürworten", idx: r(0,2,5,1,6,8,4) },
      { text: "Wolf-Management/regulierte Bejagung; Rolle der Land-/Forstwirtschaft", idx: r(7,9,10,11,3) },
    ] },
  { aspekt: "Artenschutz / Biodiversität", partei: "GRÜNE",
    lang: [
      { text: "Artenschutz stärken; gegen Einschränkung von Artenschutzprüfungen und Klagerechten", idx: r(0,1,9,14,15) },
      { text: "Artenschutz und Energiewende vereinbar (unter Schutzregeln); gegen instrumentalisierten Artenschutz", idx: r(2,5,19) },
      { text: "Wolf: Herdenschutz statt Abschuss; Weidehaltung und Naturwiederherstellung; gegen Pestizide/Agrokraftstoffe", idx: r(4,13,3,8,7,16,6,10,17) },
      { text: "Hochseeschutzabkommen; gegen Gasbohrung im Wattenmeer; Klima als Bedrohung der Artenvielfalt", idx: r(12,18,11) },
    ],
    kurz: [
      { text: "Artenschutz stärken; Artenschutz und Energiewende vereinbar unter Schutzregeln", idx: r(0,1,9,14,15,2,5,19) },
      { text: "Wolf-Herdenschutz statt Abschuss; gegen Pestizide/Agrokraftstoffe; Hochseeschutz; Gasbohrung im Wattenmeer ablehnen", idx: r(4,13,3,8,7,16,6,10,17,12,18,11) },
    ] },
  { aspekt: "Artenschutz / Biodiversität", partei: "LINKE",
    lang: [
      { text: "Klimawandel als größte Bedrohung für Arten; Klimaschutz ist Naturschutz", idx: r(2,11) },
      { text: "Wolfschutz und Artenschutzstandards wahren (gegen Abschuss); gegen Schwächung von Umweltprüfungen", idx: r(9,14,4,7) },
      { text: "Hochseeschutzabkommen (Kritik an Umsetzung); Pestizide/Insekten; Moor/Aufforstung; gegen Geoengineering, Agrokraftstoffe, Gasförderung, Tierindustrie", idx: r(10,15,8,12,1,3,0,6,13,5) },
    ],
    kurz: [
      { text: "Klimawandel als größte Bedrohung für Arten; Wolfschutz und Artenschutzstandards wahren", idx: r(2,11,9,14,4,7) },
      { text: "Hochseeschutzabkommen; Pestizide/Insekten; gegen Geoengineering, Agrokraftstoffe und Gasförderung", idx: r(10,15,8,12,1,3,0,6,13,5) },
    ] },
  { aspekt: "Artenschutz / Biodiversität", partei: "SPD",
    lang: [
      { text: "Klimawandel als Treiber des Artensterbens; Energiewende und Artenschutz Hand in Hand", idx: r(0,6,10,1) },
      { text: "Wolf-Management bei Wahrung des günstigen Erhaltungszustands (Erfolg des Naturschutzes)", idx: r(2,4,5) },
      { text: "30 %-Naturflächen (Montreal); Regenwaldfonds; Kreislaufwirtschaft schützt Habitate; Meeresschutzzone", idx: r(3,7,8,9) },
    ],
    kurz: [
      { text: "Klimawandel als Treiber des Artensterbens; Energiewende und Artenschutz Hand in Hand; Wolf-Management", idx: r(0,6,10,1,2,4,5) },
      { text: "30 %-Naturflächen (Montreal); Regenwaldfonds; Kreislaufwirtschaft; Meeresschutzzone", idx: r(3,7,8,9) },
    ] },

  // ===== CO₂-Preis / Klimageld =====
  { aspekt: "CO₂-Preis / Klimageld", partei: "AfD",
    lang: [
      { text: "Vollständige Abschaffung der CO₂-Steuer/-Bepreisung als wirtschaftsschädlich und sozial ungerecht", idx: r(0,1,2,3,4,5,6,7,8,11,12,15,16,19,20,22,23,24,26,29,30,31,34,35,37,38,40,41,42,43,45) },
      { text: "Klimageld/Rückverteilung als Umverteilungsmechanismus; versprochene Rückerstattung nicht ausgezahlt", idx: r(9,10,14,21,36,44) },
      { text: "Gegen Emissionshandel/Zertifikatehandel; deutsche Überlast (81 % der Abgaben); CO₂-Preis auf Vermieter ungerecht; fehlende Kosten-Nutzen-Abwägung", idx: r(18,27,28,39,25,33,13,17,32) },
    ],
    kurz: [
      { text: "Vollständige Abschaffung der CO₂-Steuer/-Bepreisung als wirtschaftsschädlich; gegen Emissionshandel", idx: r(0,1,2,3,4,5,6,7,8,11,12,15,16,19,20,22,23,24,26,29,30,31,34,35,37,38,40,41,42,43,45,18,27,28,39) },
      { text: "Klimageld als Umverteilung/nicht ausgezahlt; deutsche Überlast; CO₂-Preis auf Vermieter ungerecht", idx: r(9,10,14,21,36,44,25,33,13,17,32) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "CDU/CSU",
    lang: [
      { text: "CO₂-Bepreisung/ETS als marktwirtschaftliches Instrument befürworten (europäischer Emissionshandel ab 2028)", idx: r(0,2,3,4,6,9,10,12,14,15,17,18) },
      { text: "Rückgabe der Einnahmen an Bürger und sozialer Ausgleich/Deckelung; gegen pauschales Klimageld", idx: r(7,8,16,19,1) },
      { text: "CO₂-Preis bei Vermietern/Sanierung; Landwirtschaft", idx: r(5,13,11) },
    ],
    kurz: [
      { text: "CO₂-Bepreisung/ETS als marktwirtschaftliches Instrument befürworten; Rückgabe an Bürger und sozialer Ausgleich", idx: r(0,2,3,4,6,9,10,12,14,15,17,18,7,8,16,19) },
      { text: "Gegen pauschales Klimageld; CO₂-Preis bei Vermietern/Sanierung; Landwirtschaft", idx: r(1,5,13,11) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "GRÜNE",
    lang: [
      { text: "ETS/CO₂-Preis als marktwirtschaftliches Lenkungsinstrument befürworten; stabiler Preispfad und Klimageld", idx: r(0,1,4,6,7,3) },
      { text: "Kritik an Verzögerung des ETS II und an Belastung der Mieter", idx: r(2,5) },
    ],
    kurz: [
      { text: "ETS/CO₂-Preis als Lenkungsinstrument befürworten; stabiler Preispfad und Klimageld", idx: r(0,1,4,6,7,3) },
      { text: "Kritik an Verzögerung des ETS II und an Belastung der Mieter", idx: r(2,5) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "LINKE",
    lang: [
      { text: "CO₂-Preis nur mit Klimageld/sozialem Ausgleich; Rückverteilung der Einnahmen (320 € pro Kopf)", idx: r(0,3,4,5,7,9,10,11) },
      { text: "CO₂-Preis bewährtes Instrument; gegen Zertifikatehandel; Kostenbremse; CO₂-Preis-Weitergabe an Mieter", idx: r(8,2,1,6) },
    ],
    kurz: [
      { text: "CO₂-Preis nur mit Klimageld/sozialem Ausgleich; Rückverteilung an Haushalte (320 € pro Kopf)", idx: r(0,3,4,5,7,9,10,11) },
      { text: "CO₂-Preis bewährtes Instrument; gegen Zertifikatehandel; CO₂-Preis-Weitergabe an Mieter", idx: r(8,2,1,6) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "SPD",
    lang: [
      { text: "CO₂-Bepreisung/ETS befürworten, mit sozial gestaffelter Rückzahlung; gegen Abschaffung", idx: r(0,3,4,5,6,8,1) },
      { text: "Klimageld sozial gerecht/zielgerichtet; Verzögerung des EU-Emissionshandels als solidarischer Schritt", idx: r(2,7) },
    ],
    kurz: [
      { text: "CO₂-Bepreisung/ETS befürworten mit sozial gestaffelter Rückzahlung; gegen Abschaffung", idx: r(0,3,4,5,6,8,1) },
      { text: "Klimageld sozial gerecht; Verzögerung des EU-Emissionshandels als solidarischer Schritt", idx: r(2,7) },
    ] },

  // ===== CO₂-Speicherung (CCS/CCU) =====
  { aspekt: "CO₂-Speicherung (CCS/CCU)", partei: "AfD",
    lang: [
      { text: "CCS als ideologisch, teuer und unwirtschaftlich ablehnen (Irrweg); gegen Verpressung auf hoher See", idx: r(0,3,4,5) },
      { text: "Geothermie-Risiken; stattdessen natürliche CO₂-Aufnahme durch Pflanzen und Ozeane", idx: r(1,2) },
    ],
    kurz: [{ text: "CCS als ideologisch/teuer ablehnen (Irrweg); stattdessen natürliche CO₂-Aufnahme", idx: r(0,3,4,5,1,2) }] },
  { aspekt: "CO₂-Speicherung (CCS/CCU)", partei: "CDU/CSU",
    lang: [
      { text: "CCS/CCU befürworten für unvermeidbare Emissionen (Zement, Stahl), technologieoffen, auch Offshore und CO₂-Export", idx: r(0,1,2,3,4,5,6,7,8,10,12,14) },
      { text: "Negativemissionen/CO₂-Gutschriften aus Drittländern; Erhalt der CO₂-Speicherfähigkeit der Ozeane", idx: r(9,13,11) },
    ],
    kurz: [
      { text: "CCS/CCU befürworten für unvermeidbare Emissionen (Zement, Stahl), technologieoffen, auch Offshore/Export", idx: r(0,1,2,3,4,5,6,7,8,10,12,14) },
      { text: "Negativemissionen/CO₂-Gutschriften; Erhalt der Ozean-CO₂-Speicherfähigkeit", idx: r(9,13,11) },
    ] },
  { aspekt: "CO₂-Speicherung (CCS/CCU)", partei: "GRÜNE",
    lang: [
      { text: "CCS nur für unvermeidbare Restemissionen (Zement, Kalk), nicht für Gaskraftwerke; Vorrang der Emissionsvermeidung", idx: r(0,3,4,6) },
      { text: "Gegen CCS als Verlängerung fossiler Strukturen; natürliche Senken; Negativemissionen in der Chemie", idx: r(2,1,5) },
    ],
    kurz: [
      { text: "CCS nur für unvermeidbare Restemissionen (Zement, Kalk), nicht für Gaskraftwerke; Vorrang der Vermeidung", idx: r(0,3,4,6) },
      { text: "Gegen CCS als Verlängerung fossiler Strukturen; natürliche Senken", idx: r(2,1,5) },
    ] },
  { aspekt: "CO₂-Speicherung (CCS/CCU)", partei: "LINKE",
    lang: [{ text: "CCS als Scheinlösung und Profitmechanismus für die Fossilwirtschaft ablehnen; natürliche Methoden (Moore) bevorzugen; Sicherheitsrisiken der Meeresspeicherung", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "CCS als Scheinlösung/Profitmechanismus ablehnen; natürliche Methoden (Moore) bevorzugen", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "CO₂-Speicherung (CCS/CCU)", partei: "SPD",
    lang: [
      { text: "CO₂-Speicherung im Meeresuntergrund unter strengen Auflagen für schwer vermeidbare Emissionen", idx: r(1,2) },
      { text: "Ablehnung von SRM/Geoengineering als klimapolitisches Instrument", idx: r(0) },
    ],
    kurz: [{ text: "CO₂-Speicherung unter strengen Auflagen für schwer vermeidbare Emissionen; gegen SRM/Geoengineering", idx: r(1,2,0) }] },

  // ===== EU-Umweltregulierung =====
  { aspekt: "EU-Umweltregulierung", partei: "AfD",
    lang: [
      { text: "EU-Umweltregulierung als Bürokratiemonster/Planwirtschaft ablehnen (Fit for 55, Bauprodukte)", idx: r(0,1,2,3,5,6,7) },
      { text: "Nationale Eigenständigkeit; Vereinfachung auf EU-Ebene statt Weitergabe von Bürokratielasten", idx: r(4,8) },
    ],
    kurz: [{ text: "EU-Umweltregulierung als Bürokratiemonster/Planwirtschaft ablehnen; nationale Eigenständigkeit", idx: r(0,1,2,3,5,6,7,4,8) }] },
  { aspekt: "EU-Umweltregulierung", partei: "CDU/CSU",
    lang: [
      { text: "EU-Umweltregeln umsetzen, aber ohne nationale Übererfüllung/Gold-Plating und mit Bürokratieabbau", idx: r(0,3,4,5,8,9,11,13) },
      { text: "PFAS, F-Gas, Batterie- und Ökodesign-Regeln europäisch einheitlich; Emissionshandel und CBAM", idx: r(2,7,10,14,6,12) },
      { text: "Green Deal und Gebäudeenergiegesetz gegen AfD verteidigen", idx: r(1) },
    ],
    kurz: [
      { text: "EU-Umweltregeln umsetzen ohne Übererfüllung/Gold-Plating; einheitliche PFAS-/F-Gas-/Ökodesign-Regeln; Emissionshandel/CBAM", idx: r(0,3,4,5,8,9,11,13,2,7,10,14,6,12) },
      { text: "Green Deal und Gebäudeenergiegesetz gegen AfD verteidigen", idx: r(1) },
    ] },
  { aspekt: "EU-Umweltregulierung", partei: "GRÜNE",
    lang: [
      { text: "EU-Umweltregeln befürworten und konsequent umsetzen (F-Gas, Ökodesign, Kommunalabwasser); Umweltstandards/UVP erhalten", idx: r(0,1,3,5,6,2) },
      { text: "Gegen Abschwächung europäischer Klimaregeln; F-Gas-Lücke schließen; Erhaltungszustand sichern", idx: r(7,8,4) },
    ],
    kurz: [
      { text: "EU-Umweltregeln befürworten und konsequent umsetzen; Umweltstandards/UVP erhalten", idx: r(0,1,3,5,6,2) },
      { text: "Gegen Abschwächung europäischer Klimaregeln; F-Gas-Lücke schließen", idx: r(7,8,4) },
    ] },
  { aspekt: "EU-Umweltregulierung", partei: "LINKE",
    lang: [
      { text: "EU-Regeln befürworten, aber stärkere Umsetzung/Vorsorgeprinzip (Ökodesign, F-Gas)", idx: r(0,1,5,8,9,2) },
      { text: "Gegen Abbau von Umweltprüfungs- und Verbandsklagerechten; internationale Abkommen; Batterierecht unzureichend", idx: r(3,4,6,7) },
    ],
    kurz: [
      { text: "EU-Regeln befürworten, aber stärkere Umsetzung/Vorsorgeprinzip", idx: r(0,1,5,8,9,2) },
      { text: "Gegen Abbau von Umweltprüfungs- und Verbandsklagerechten; internationale Abkommen", idx: r(3,4,6,7) },
    ] },
  { aspekt: "EU-Umweltregulierung", partei: "SPD",
    lang: [
      { text: "EU-Klimaziele und Emissionshandel verteidigen; F-Gas, Ökodesign, PFAS und Industrieemissionsrichtlinie umsetzen", idx: r(0,4,1,2,6,7) },
      { text: "Umweltverträglichkeitsprüfungen verankern; internationale Verträge gegen nationale Alleingänge", idx: r(3,5) },
    ],
    kurz: [
      { text: "EU-Klimaziele und Emissionshandel verteidigen; F-Gas/Ökodesign/PFAS/IED umsetzen", idx: r(0,4,1,2,6,7) },
      { text: "UVP verankern; internationale Verträge gegen nationale Alleingänge", idx: r(3,5) },
    ] },

  // ===== Fossile Energie (aus Umweltsicht) =====
  { aspekt: "Fossile Energie (aus Umweltsicht)", partei: "AfD",
    lang: [
      { text: "Kernkraft als CO₂-arme Alternative; Wiedereinstieg in die Kernenergie statt Erneuerbare", idx: r(1,2,4,6,8,11,13,17,20,22,26,30,31,32,34,35,37) },
      { text: "Gegen das Verbrennerverbot; Verteidigung des Verbrennungsmotors", idx: r(3,10,12,15,33,36) },
      { text: "Fossile Energien und Grundlast verteidigen; bezahlbare Energie, Energiesteuer senken, russisches Gas", idx: r(0,16,18,21,24,27,28,29,14) },
      { text: "Kritik an Deindustrialisierung/Jobabbau und an EU-Regulierung fossiler Energie", idx: r(5,7,9,23,25,19) },
    ],
    kurz: [
      { text: "Kernkraft als CO₂-arme Alternative, Wiedereinstieg; gegen das Verbrennerverbot", idx: r(1,2,4,6,8,11,13,17,20,22,26,30,31,32,34,35,37,3,10,12,15,33,36) },
      { text: "Fossile Energien und Grundlast verteidigen (bezahlbare Energie, russisches Gas); Kritik an Deindustrialisierung", idx: r(0,16,18,21,24,27,28,29,14,5,7,9,23,25,19) },
    ] },
  { aspekt: "Fossile Energie (aus Umweltsicht)", partei: "CDU/CSU",
    lang: [
      { text: "Ausstieg aus fossilen Energien zugunsten von Erneuerbaren und Wasserstoff; gegen Rückkehr zu Kohle/Atom", idx: r(0,1,3,5,11,7,9,10,2) },
      { text: "Gas als Brücke und realistischer Energiemix für Versorgungssicherheit; heimische Erdgasförderung; technologieoffene Wärme (Biomethan)", idx: r(4,13,17,18,8,6,14,12) },
      { text: "CO₂-Reduktion bei Kraftstoffen; fortbestehende Abhängigkeit im Wärmebereich; protektionistische Energiepolitik vermeiden", idx: r(16,19,15) },
    ],
    kurz: [
      { text: "Ausstieg aus fossilen Energien zugunsten Erneuerbarer/Wasserstoff; gegen Rückkehr zu Kohle/Atom", idx: r(0,1,3,5,11,7,9,10,2) },
      { text: "Gas als Brücke und realistischer Energiemix; technologieoffene Wärme; CO₂-Reduktion bei Kraftstoffen", idx: r(4,13,17,18,8,6,14,12,16,19,15) },
    ] },
  { aspekt: "Fossile Energie (aus Umweltsicht)", partei: "GRÜNE",
    lang: [
      { text: "Ausstieg aus fossilen Energien und Ende der fossilen Abhängigkeit zugunsten Erneuerbarer", idx: r(0,1,7,8,9,10,16,17,19,22,26,27,30,31,32,34,35,36,37,39,41,42,43,44,45,47,49,51,52) },
      { text: "Gegen Subventionierung fossiler Energie und Tankrabatt; Übergewinnabschöpfung bei Öl-/Gaskonzernen", idx: r(3,15,21,24,28,29,38,40,46) },
      { text: "Gegen russisches Gas, neue Gasinfrastruktur und Gasförderung im Wattenmeer/vor Borkum; gegen Fracking", idx: r(2,4,5,11,12,18,33,48) },
      { text: "Gegen Atomkraft; gegen Verbrenner/Plug-in-Hybride; F-Gase regulieren; Tempolimit", idx: r(23,50,53,54,6,13,14,25,20) },
    ],
    kurz: [
      { text: "Ausstieg aus fossilen Energien und Ende der fossilen Abhängigkeit zugunsten Erneuerbarer", idx: r(0,1,7,8,9,10,16,17,19,22,26,27,30,31,32,34,35,36,37,39,41,42,43,44,45,47,49,51,52) },
      { text: "Gegen fossile Subventionen/Tankrabatt; gegen russisches Gas/neue Gasinfrastruktur und Gasförderung; gegen Atomkraft/Verbrenner", idx: r(3,15,21,24,28,29,38,40,46,2,4,5,11,12,18,33,48,23,50,53,54,6,13,14,25,20) },
    ] },
  { aspekt: "Fossile Energie (aus Umweltsicht)", partei: "LINKE",
    lang: [
      { text: "Ausstieg aus fossilen Energien und Ende der Abhängigkeit von Fossillobby zugunsten Erneuerbarer", idx: r(0,2,4,6,9,10,11,12,13,14,15,22,26,27,29,30,38) },
      { text: "Gegen Gasausbau, neue Gaskraftwerke und Gasheizungen", idx: r(7,8,18,24,28) },
      { text: "Gegen Gasförderung in Meeresschutzgebieten, Fracking und gegen Atomkraft", idx: r(23,33,34,1,5,37,20,25,31) },
      { text: "CCS und THG-Quote als Greenwashing/Profitmechanismus; Flugverkehr; F-Gas-Militärausnahmen", idx: r(17,36,16,19,3,32,21,35) },
    ],
    kurz: [
      { text: "Ausstieg aus fossilen Energien zugunsten Erneuerbarer; gegen Gasausbau, Gaskraftwerke und Gasheizungen", idx: r(0,2,4,6,9,10,11,12,13,14,15,22,26,27,29,30,38,7,8,18,24,28) },
      { text: "Gegen Gasförderung in Meeresschutzgebieten, Fracking und Atomkraft; CCS/THG-Quote als Greenwashing", idx: r(23,33,34,1,5,37,20,25,31,17,36,16,19,3,32,21,35) },
    ] },
  { aspekt: "Fossile Energie (aus Umweltsicht)", partei: "SPD",
    lang: [
      { text: "Ausstieg aus fossilen Energien; Abhängigkeit als wirtschaftliches und sicherheitspolitisches Risiko", idx: r(0,4,5,12,17,18,19,20,21) },
      { text: "Gas als Brücke verteidigen (Gasspeicherumlage, Borkum als Übergang)", idx: r(9,11) },
      { text: "Gegen Atomkraft; Benzin-/Diesel-Regulierung (THG); F-Gase; gegen Kohle; Elektromobilität; gerechter Ausstieg; Heizungsanforderungen", idx: r(1,8,7,10,6,13,15,3,16,2,14) },
    ],
    kurz: [
      { text: "Ausstieg aus fossilen Energien (Abhängigkeit als Risiko); Gas nur als Brücke", idx: r(0,4,5,12,17,18,19,20,21,9,11) },
      { text: "Gegen Atomkraft und Kohle; Benzin-/Diesel-Regulierung; F-Gase; Elektromobilität; gerechter Ausstieg", idx: r(1,8,7,10,6,13,15,3,16,2,14) },
    ] },

  // ===== Klimaanpassung / Hochwasser =====
  { aspekt: "Klimaanpassung / Hochwasser", partei: "AfD",
    lang: [{ text: "Pragmatische, dezentrale Anpassungsmaßnahmen (Regenwasserspeicherung) statt teurer Transformationsfonds", idx: r(0,1) }],
    kurz: [{ text: "Pragmatische, dezentrale Anpassung statt teurer Transformationsfonds", idx: r(0,1) }] },
  { aspekt: "Klimaanpassung / Hochwasser", partei: "CDU/CSU",
    lang: [
      { text: "Anpassungsmaßnahmen (Deichbau, Schwammstädte, Wassermanagement, Moor-Renaturierung)", idx: r(1,2,4,6) },
      { text: "Klimafolgen (Hochwasser, Dürre, Waldbrände) als Argument für Klimaschutz", idx: r(0,3,5,7,8,9) },
    ],
    kurz: [
      { text: "Anpassungsmaßnahmen (Deichbau, Schwammstädte, Wassermanagement)", idx: r(1,2,4,6) },
      { text: "Klimafolgen (Hochwasser, Dürre) als Argument für Klimaschutz", idx: r(0,3,5,7,8,9) },
    ] },
  { aspekt: "Klimaanpassung / Hochwasser", partei: "GRÜNE",
    lang: [
      { text: "Extremwetter als Beleg für notwendige Klimapolitik und Anpassung", idx: r(0,1,2,3,7,8) },
      { text: "Dürre/Hitze-Vorsorge und resiliente Strukturen; Mittel für Kommunen; Meere/Kipppunkte; Inselstaaten; Erneuerbare als Anpassung", idx: r(10,11,12,5,4,6,9) },
    ],
    kurz: [
      { text: "Extremwetter als Beleg für notwendige Klimapolitik und Anpassung", idx: r(0,1,2,3,7,8) },
      { text: "Dürre-/Hitze-Vorsorge und resiliente Strukturen; Mittel für Kommunen; Meere/Kipppunkte", idx: r(10,11,12,5,4,6,9) },
    ] },
  { aspekt: "Klimaanpassung / Hochwasser", partei: "LINKE",
    lang: [{ text: "Warnung vor Klimafolgen (Dürren, Fluten, Ernteausfälle, Globaler Süden); Kritik an mangelnder Vorsorge", idx: r(0,1,3,4,2,5) }],
    kurz: [{ text: "Warnung vor Klimafolgen (Dürren, Fluten); Kritik an mangelnder Vorsorge", idx: r(0,1,3,4,2,5) }] },
  { aspekt: "Klimaanpassung / Hochwasser", partei: "SPD",
    lang: [
      { text: "Klimafolgen (Dürre, Hochwasser) erfordern Anpassung; nationale Wasserstrategie", idx: r(0,1,4,5,6,8) },
      { text: "Hochwasserschutz und Wiederaufbau der Infrastruktur als Verantwortung", idx: r(2,3,7) },
    ],
    kurz: [
      { text: "Klimafolgen (Dürre, Hochwasser) erfordern Anpassung; nationale Wasserstrategie", idx: r(0,1,4,5,6,8) },
      { text: "Hochwasserschutz und Wiederaufbau als Verantwortung", idx: r(2,3,7) },
    ] },

  // ===== Klimaschutz-Grundhaltung =====
  { aspekt: "Klimaschutz-Grundhaltung", partei: "AfD",
    lang: [
      { text: "Ablehnung der Klimapolitik als ideologisch, unwirksam und wirtschaftsschädlich (Klimakult, Ökosozialismus)", idx: r(0,1,2,4,5,6,8,9,15,16,20,21,24,26,29,30,33,35,38,39,43,45,47,48,49,50,51,53,55) },
      { text: "Bestreiten des menschengemachten Klimawandels / IPCC-Skepsis", idx: r(14,27,28,34,40,44,46,52,56,57) },
      { text: "Kernkraft statt Erneuerbare als CO₂-Lösung; Energiewende als ineffektiv", idx: r(3,11,12,13,17,18,23,32,36,37,41,42,59,60) },
      { text: "Deutscher Alleingang/2 % der Emissionen mit marginalem globalen Effekt; CO₂ ins Ausland verlagert", idx: r(7,10,19,22,25,31,54,58) },
    ],
    kurz: [
      { text: "Ablehnung der Klimapolitik als ideologisch und wirtschaftsschädlich; Bestreiten des menschengemachten Klimawandels", idx: r(0,1,2,4,5,6,8,9,15,16,20,21,24,26,29,30,33,35,38,39,43,45,47,48,49,50,51,53,55,14,27,28,34,40,44,46,52,56,57) },
      { text: "Kernkraft statt Erneuerbare; deutscher Alleingang mit marginalem globalem Effekt", idx: r(3,11,12,13,17,18,23,32,36,37,41,42,59,60,7,10,19,22,25,31,54,58) },
    ] },
  { aspekt: "Klimaschutz-Grundhaltung", partei: "CDU/CSU",
    lang: [
      { text: "Klimaschutz notwendig und wissenschaftlich begründet (Verfassungsauftrag); gegen Klimawandelleugnung", idx: r(0,3,13,14,23,25,26,29,30,31,32,34,35,38,39,41,44,46,47,53,54,58) },
      { text: "Technologieoffener, marktwirtschaftlicher Klimaschutz durch Anreize statt Verbote", idx: r(2,7,11,18,19,20,22,27,33,36,37,49,55) },
      { text: "Klimaschutz und Wirtschaft/Industrie vereinbar; Klimaneutralität 2045", idx: r(6,9,12,17,24,43,45,51,52,1) },
      { text: "Instrumente: Emissionshandel, CCS, Wasserstoff, Erneuerbare, Wärmepumpe, E-Mobilität, F-Gas, Geothermie", idx: r(4,5,8,10,15,16,21,28,40,42,48,50,56,57) },
    ],
    kurz: [
      { text: "Klimaschutz notwendig und wissenschaftlich begründet, gegen Leugnung; technologieoffen und marktwirtschaftlich (Anreize statt Verbote)", idx: r(0,3,13,14,23,25,26,29,30,31,32,34,35,38,39,41,44,46,47,53,54,58,2,7,11,18,19,20,22,27,33,36,37,49,55) },
      { text: "Klimaschutz und Wirtschaft/Industrie vereinbar (Klimaneutralität 2045); Instrumente Emissionshandel, CCS, Wasserstoff, Erneuerbare", idx: r(6,9,12,17,24,43,45,51,52,1,4,5,8,10,15,16,21,28,40,42,48,50,56,57) },
    ] },
  { aspekt: "Klimaschutz-Grundhaltung", partei: "GRÜNE",
    lang: [
      { text: "Ambitionierten Klimaschutz fordern; Kritik an unzureichender und rückwärtsgewandter Regierungspolitik", idx: r(5,6,7,11,23,25,26,28,32,36,37,40,43,44,45,47,48,51,56,57,58,59,60) },
      { text: "Erneuerbare, Wärmewende, Wärmepumpe und Geothermie als Lösung", idx: r(2,3,10,14,16,22,24,27,29,31,33,34,41,53,54) },
      { text: "Gegen Klimawandelleugnung; wissenschaftlicher Konsens", idx: r(9,19,21,30,38,4) },
      { text: "Klimaschutz als Bezahlbarkeits- und Wirtschaftschance, sozial gerecht; Verkehr/Tempolimit; Meere; Kreislaufwirtschaft/Batterien; F-Gase", idx: r(0,12,15,49,18,52,55,1,8,42,46,50,13,35,17,39,20,61) },
    ],
    kurz: [
      { text: "Ambitionierten Klimaschutz fordern, Kritik an unzureichender Regierungspolitik; Erneuerbare und Wärmewende als Lösung", idx: r(5,6,7,11,23,25,26,28,32,36,37,40,43,44,45,47,48,51,56,57,58,59,60,2,3,10,14,16,22,24,27,29,31,33,34,41,53,54) },
      { text: "Gegen Klimawandelleugnung; Klimaschutz als Bezahlbarkeits-/Wirtschaftschance, sozial gerecht; Verkehr, Meere, Kreislaufwirtschaft", idx: r(9,19,21,30,38,4,0,12,15,49,18,52,55,1,8,42,46,50,13,35,17,39,20,61) },
    ] },
  { aspekt: "Klimaschutz-Grundhaltung", partei: "LINKE",
    lang: [
      { text: "Radikalen Klimaschutz fordern; Kritik an unzureichender, verfassungswidriger Regierungspolitik", idx: r(0,1,4,5,14,20,24,36,39,41) },
      { text: "Klimaschutz muss sozial gerecht sein und bei den Menschen ankommen", idx: r(7,8,11,21,27,32,35,38) },
      { text: "Erneuerbare, Wärmewende und Ausstieg aus fossilen Energien; gegen Gasausbau", idx: r(12,15,16,22,26,31,33,34,37,42,9) },
      { text: "Gegen AfD-Klimaleugnung; F-Gase; Verkehr/Fliegen; Greenwashing/CCS; IPCC unterschätzt die Krise", idx: r(6,10,18,30,13,25,29,3,23,28,2,19,40,17) },
    ],
    kurz: [
      { text: "Radikalen, sozial gerechten Klimaschutz fordern; Kritik an unzureichender Regierungspolitik", idx: r(0,1,4,5,14,20,24,36,39,41,7,8,11,21,27,32,35,38) },
      { text: "Erneuerbare, Wärmewende und Ausstieg aus fossilen Energien; gegen AfD-Leugnung und Greenwashing", idx: r(12,15,16,22,26,31,33,34,37,42,9,6,10,18,30,13,25,29,3,23,28,2,19,40,17) },
    ] },
  { aspekt: "Klimaschutz-Grundhaltung", partei: "SPD",
    lang: [
      { text: "Klimaschutz wissenschaftlich notwendig; gegen Klimawandelleugnung (AfD)", idx: r(3,4,6,8,11,13,15,26,30,32,34) },
      { text: "Klimaneutralität 2045/EU-Ziele; Deutschland trägt besondere Verantwortung", idx: r(5,19,41,14,33) },
      { text: "Erneuerbare, Wärmewende, Abkehr von Fossilen und E-Mobilität; natürliche Senken", idx: r(1,7,16,20,21,24,38,39,42,2,18) },
      { text: "Sozial gerechter Klimaschutz mit Bürgerbeteiligung; Emissionshandel/CO₂-Preis/THG-Quote; Klimaschutz und Wirtschaft; F-Gase; gegen Geoengineering", idx: r(27,31,35,37,9,12,17,22,28,29,36,10,23,25,0,40) },
    ],
    kurz: [
      { text: "Klimaschutz wissenschaftlich notwendig, gegen Leugnung; Klimaneutralität 2045 mit besonderer Verantwortung Deutschlands", idx: r(3,4,6,8,11,13,15,26,30,32,34,5,19,41,14,33) },
      { text: "Erneuerbare, Wärmewende und E-Mobilität; sozial gerechter Klimaschutz; Emissionshandel/CO₂-Preis; Klimaschutz und Wirtschaft", idx: r(1,7,16,20,21,24,38,39,42,2,18,27,31,35,37,9,12,17,22,28,29,36,10,23,25,0,40) },
    ] },

  // ===== Klimaschädliche Subventionen =====
  { aspekt: "Klimaschädliche Subventionen", partei: "AfD",
    lang: [{ text: "Kritik an Klimasubventionen (E-Auto, Energiewende-Kosten) als Marktverzerrung; stattdessen Energiesteuer senken", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Kritik an Klimasubventionen (E-Auto, Energiewende) als Marktverzerrung; Energiesteuer senken", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Klimaschädliche Subventionen", partei: "CDU/CSU",
    lang: [{ text: "Gegen Bezeichnung der Agrardieselrückgewähr als klimaschädlich; unfairer Wettbewerb durch fehlende Klimakosten bei Importen", idx: r(0,1) }],
    kurz: [{ text: "Gegen Einstufung der Agrardieselrückgewähr als klimaschädlich; unfairer Wettbewerb durch Importe", idx: r(0,1) }] },
  { aspekt: "Klimaschädliche Subventionen", partei: "GRÜNE",
    lang: [
      { text: "Abbau fossiler/klimaschädlicher Subventionen (Tankrabatt, Dienstwagenprivileg, Kerosin, Agrardiesel, Pendlerpauschale)", idx: r(0,2,3,6,7,9,10,11) },
      { text: "Fossile künstlich verbilligt; gegen versteckte Subventionen zulasten von Recycling und Erneuerbaren; Agrarsubventionen an Naturschutz koppeln", idx: r(4,1,8,5) },
    ],
    kurz: [
      { text: "Abbau fossiler/klimaschädlicher Subventionen (Tankrabatt, Dienstwagen, Kerosin, Agrardiesel)", idx: r(0,2,3,6,7,9,10,11) },
      { text: "Fossile künstlich verbilligt; gegen versteckte Subventionen; Agrarsubventionen an Naturschutz koppeln", idx: r(4,1,8,5) },
    ] },
  { aspekt: "Klimaschädliche Subventionen", partei: "LINKE",
    lang: [
      { text: "Abbau fossiler Subventionen (65 Mrd. €/Jahr; Tankrabatt, Flugverkehr, Kerosin)", idx: r(1,2,3,4,6,7) },
      { text: "F-Gas-Militärausnahmen; Klima- und Transformationsfonds als Subventionspool; Zertifikatehandel unzureichend", idx: r(0,5,8) },
    ],
    kurz: [
      { text: "Abbau fossiler Subventionen (65 Mrd. €/Jahr; Tankrabatt, Flugverkehr, Kerosin)", idx: r(1,2,3,4,6,7) },
      { text: "F-Gas-Militärausnahmen; KTF als Subventionspool; Zertifikatehandel unzureichend", idx: r(0,5,8) },
    ] },
  { aspekt: "Klimaschädliche Subventionen", partei: "SPD",
    lang: [{ text: "Ausschluss klimaschädlicher Rohstoffe/Biokraftstoff-Dumping; Neuwarenvernichtung beenden; Atomenergie implizit subventioniert", idx: r(0,1,2) }],
    kurz: [{ text: "Ausschluss klimaschädlicher Rohstoffe; Neuwarenvernichtung beenden", idx: r(0,1,2) }] },

  // ===== Kreislaufwirtschaft / Plastik =====
  { aspekt: "Kreislaufwirtschaft / Plastik", partei: "AfD",
    lang: [
      { text: "Kreislaufwirtschaft befürworten, aber gegen EU-Überregulierung/Bürokratie (Ökodesign, Verpackungsverordnung); Anreize statt Zwang", idx: r(0,2,3,4,5,8,9,10,11,12,13) },
      { text: "Windkraft als Quelle von Mikroplastik/PFAS (Rotorblatt-Abrieb)", idx: r(6,7,1) },
    ],
    kurz: [
      { text: "Kreislaufwirtschaft befürworten, aber gegen EU-Überregulierung; Anreize statt Zwang", idx: r(0,2,3,4,5,8,9,10,11,12,13) },
      { text: "Windkraft als Quelle von Mikroplastik/PFAS", idx: r(6,7,1) },
    ] },
  { aspekt: "Kreislaufwirtschaft / Plastik", partei: "CDU/CSU",
    lang: [
      { text: "Kreislaufwirtschaft, Ökodesign und Reparaturrecht befürworten, praxisnah ohne Gold-Plating", idx: r(0,1,2,3,4,5,9,12,14) },
      { text: "Batterierecycling und Ressourcenrückgewinnung", idx: r(6,8,10,13,7,11) },
    ],
    kurz: [
      { text: "Kreislaufwirtschaft, Ökodesign und Reparaturrecht befürworten, praxisnah ohne Gold-Plating", idx: r(0,1,2,3,4,5,9,12,14) },
      { text: "Batterierecycling und Ressourcenrückgewinnung", idx: r(6,8,10,13,7,11) },
    ] },
  { aspekt: "Kreislaufwirtschaft / Plastik", partei: "GRÜNE",
    lang: [
      { text: "Echte Kreislaufwirtschaft, Ökodesign und Reparaturrecht ambitioniert umsetzen; Mehrweg", idx: r(0,3,4,6,8,12,5) },
      { text: "Batterien: Herstellerverantwortung und Pfandsystem; Kreislaufwirtschaft in der Landwirtschaft; Plastik-Meeresverschmutzung nicht von Windkraft", idx: r(1,10,7,11,9,2) },
    ],
    kurz: [
      { text: "Echte Kreislaufwirtschaft, Ökodesign und Reparaturrecht ambitioniert umsetzen; Mehrweg", idx: r(0,3,4,6,8,12,5) },
      { text: "Batterien: Herstellerverantwortung und Pfand; Kreislaufwirtschaft in der Landwirtschaft", idx: r(1,10,7,11,9,2) },
    ] },
  { aspekt: "Kreislaufwirtschaft / Plastik", partei: "LINKE",
    lang: [
      { text: "Echte Kreislaufwirtschaft mit geschlossenen Stoffkreisläufen und höheren Recyclingquoten (statt Mindeststandards)", idx: r(0,2,3,4,7) },
      { text: "Batterie-Pfand/Recycling; PFAS aus Lebensmittelkontaktmaterialien; Elektroschrott; Kontrolle gefährlicher Stoffe", idx: r(5,9,6,8,1) },
    ],
    kurz: [
      { text: "Echte Kreislaufwirtschaft mit geschlossenen Stoffkreisläufen und höheren Recyclingquoten", idx: r(0,2,3,4,7) },
      { text: "Batterie-Pfand/Recycling; PFAS; Elektroschrott; Kontrolle gefährlicher Stoffe", idx: r(5,9,6,8,1) },
    ] },
  { aspekt: "Kreislaufwirtschaft / Plastik", partei: "SPD",
    lang: [{ text: "Kreislaufwirtschaft, Ökodesign und Reparaturrecht für langlebige, reparierbare Produkte (gegen Wegwerfkultur)", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Kreislaufwirtschaft, Ökodesign und Reparaturrecht (gegen Wegwerfkultur)", idx: r(0,1,2,3,4) }] },

  // ===== Wald =====
  { aspekt: "Wald", partei: "AfD",
    lang: [
      { text: "Windkraft als Waldvernichtung/Rodung und Flächenverbrauch; Waldschutz gegen die Energiewende", idx: r(2,3,4,5,7,8,9,10,11,12,14) },
      { text: "Waldbrandprävention vor Ort statt zentraler Löschflugzeuge; Wolf-Management; skeptisch ggü. wirtschaftlichen Folgen des Waldschutzes", idx: r(1,6,0,13) },
    ],
    kurz: [
      { text: "Windkraft als Waldvernichtung/Rodung; Waldschutz gegen die Energiewende", idx: r(2,3,4,5,7,8,9,10,11,12,14) },
      { text: "Waldbrandprävention vor Ort statt zentraler Löschflugzeuge", idx: r(1,6,0,13) },
    ] },
  { aspekt: "Wald", partei: "CDU/CSU",
    lang: [
      { text: "Wald als CO₂-Senke schützen; Klimawandel als größte Bedrohung für Wälder (Hitze, Dürre, Schädlinge)", idx: r(2,3,4,6,7) },
      { text: "Regenwald/Amazonas schützen (Regenwaldinvestitionsfonds); Naturschutz; Holznutzung/Bioenergie", idx: r(0,8,1,5) },
    ],
    kurz: [
      { text: "Wald als CO₂-Senke schützen; Klimawandel als größte Bedrohung für Wälder", idx: r(2,3,4,6,7) },
      { text: "Regenwald/Amazonas schützen; Holznutzung/Bioenergie", idx: r(0,8,1,5) },
    ] },
  { aspekt: "Wald", partei: "GRÜNE",
    lang: [{ text: "Wald als CO₂-Speicher und natürlicher Klimaschutz (Moor-Wiedervernässung); gegen Tagebau und Schwächung des Waldschutzes", idx: r(1,2,0,3) }],
    kurz: [{ text: "Wald als CO₂-Speicher und natürlicher Klimaschutz; gegen Tagebau und Schwächung des Waldschutzes", idx: r(1,2,0,3) }] },
  { aspekt: "Wald", partei: "LINKE",
    lang: [
      { text: "Aufforstung und Moor-Wiedervernässung als natürlicher Klimaschutz; Klimawandel als größte Waldbedrohung", idx: r(1,2,3,4) },
      { text: "Kritik an AfD-Doppelstandard (Wald bei Windrädern schützenswert, bei Tagebau nicht); Waldbrand-Kapazitäten; indigene Landrechte", idx: r(0,5,6) },
    ],
    kurz: [
      { text: "Aufforstung und Moor-Wiedervernässung als natürlicher Klimaschutz", idx: r(1,2,3,4) },
      { text: "Kritik an AfD-Doppelstandard (Windrad vs. Tagebau); Waldbrand-Kapazitäten; indigene Landrechte", idx: r(0,5,6) },
    ] },
  { aspekt: "Wald", partei: "SPD",
    lang: [{ text: "Regenwald und klimaresilienten Wald schützen (mit indigenen Gemeinschaften); Energiewende statt Windkraftkritik", idx: r(0,1,2) }],
    kurz: [{ text: "Regenwald und klimaresilienten Wald schützen; Energiewende statt Windkraftkritik", idx: r(0,1,2) }] },

  // ===== Wasser =====
  { aspekt: "Wasser", partei: "AfD",
    lang: [
      { text: "Sorge um Meeresschutz/Offshore-Wind; PFAS differenziert regulieren statt pauschalem Verbot", idx: r(0,5,10,6,7) },
      { text: "Gegen internationale Regulierung und Verbote (Bodenschätze); gegen Wassercent; Solar-Wasseraufnahme; Geoengineering-Risiken", idx: r(3,8,4,2,1,9) },
    ],
    kurz: [
      { text: "Sorge um Meeresschutz/Offshore-Wind; PFAS differenziert regulieren statt pauschalem Verbot", idx: r(0,5,10,6,7) },
      { text: "Gegen internationale Regulierung/Verbote und gegen Wassercent", idx: r(3,8,4,2,1,9) },
    ] },
  { aspekt: "Wasser", partei: "CDU/CSU",
    lang: [
      { text: "Trinkwasser sicher; PFAS differenziert/risikobasiert statt pauschalem Verbot (Verursacherprinzip)", idx: r(0,3) },
      { text: "Meeresschutz mit Wirtschaftsinteressen ausbalancieren; Floating-PV; nachhaltiger Wasserumgang; Batterien/Grundwasser", idx: r(1,2,4,5) },
    ],
    kurz: [
      { text: "Trinkwasser sicher; PFAS differenziert/risikobasiert statt pauschalem Verbot", idx: r(0,3) },
      { text: "Meeresschutz mit Wirtschaftsinteressen ausbalancieren; nachhaltiger Wasserumgang", idx: r(1,2,4,5) },
    ] },
  { aspekt: "Wasser", partei: "GRÜNE",
    lang: [
      { text: "Trinkwasserschutz (Geothermie, PFAS/TFA, Tagebau, Gasförderung); Wasser als Lebensgrundlage", idx: r(1,2,3,4,5,6,9,0,7) },
      { text: "Grundwasser darf nicht kostenloses Entsorgungsmedium der Chemieindustrie sein", idx: r(8) },
    ],
    kurz: [
      { text: "Trinkwasserschutz (Geothermie, PFAS/TFA, Gasförderung); Wasser als Lebensgrundlage", idx: r(1,2,3,4,5,6,9,0,7) },
      { text: "Grundwasser nicht als Entsorgungsmedium der Chemieindustrie", idx: r(8) },
    ] },
  { aspekt: "Wasser", partei: "LINKE",
    lang: [
      { text: "PFAS gruppenbasiert regulieren (Verursacherprinzip); Schutz der Trinkwasserqualität", idx: r(1,3) },
      { text: "Meeresschutz gegen Gasförderung, CO₂-Speicherung und Überfischung; Trinkwasserschutz bei Geothermie", idx: r(0,2,4,5) },
    ],
    kurz: [
      { text: "PFAS gruppenbasiert regulieren (Verursacherprinzip); Trinkwasserqualität schützen", idx: r(1,3) },
      { text: "Meeresschutz gegen Gasförderung/CO₂-Speicherung; Trinkwasserschutz bei Geothermie", idx: r(0,2,4,5) },
    ] },
  { aspekt: "Wasser", partei: "SPD",
    lang: [
      { text: "Wasserqualität und -schutz; Renaturierung, Speicher, Wasserwiederverwendung gegen Wasserknappheit", idx: r(0,6,2) },
      { text: "PFAS regulieren; Meeresschutz/Meeresspiegel; Kohle-Gewässerbelastung; Trinkwasserschutz bei Onshore-Speicherung", idx: r(4,1,5,3,7) },
    ],
    kurz: [
      { text: "Wasserqualität und -schutz; Renaturierung und Wasserwiederverwendung gegen Wasserknappheit", idx: r(0,6,2) },
      { text: "PFAS regulieren; Meeresschutz; Kohle-Gewässerbelastung; Trinkwasserschutz bei Speicherung", idx: r(4,1,5,3,7) },
    ] },
];

applySynthese("Umwelt", CELLS);
