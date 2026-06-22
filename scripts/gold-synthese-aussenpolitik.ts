/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Außenpolitik und internationale Beziehungen" (48 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Ukraine-Unterstützung =====
  { aspekt: "Ukraine-Unterstützung", partei: "AfD",
    lang: [
      { text: "Ablehnung bzw. Reduktion der Ukraine-Hilfe (Finanzhilfen, Waffenlieferungen); Diplomatie und Deeskalation statt Kriegsrhetorik", idx: r(0,3,4,5,6,9,10,12) },
      { text: "Gegen Konfiskation russischer Vermögen als Diebstahl; Korruptionsbekämpfung und Reformen als Bedingung; Sabotage-Aufklärung", idx: r(2,8,11,13,1,7) },
    ],
    kurz: [
      { text: "Ablehnung/Reduktion der Ukraine-Hilfe; Diplomatie statt Kriegsrhetorik", idx: r(0,3,4,5,6,9,10,12) },
      { text: "Gegen Konfiskation russischer Vermögen; Korruptionsbekämpfung als Bedingung", idx: r(2,8,11,13,1,7) },
    ] },
  { aspekt: "Ukraine-Unterstützung", partei: "CDU/CSU",
    lang: [
      { text: "Entschlossene militärische und finanzielle Unterstützung als notwendig (die Ukraine verteidigt die europäische Freiheit)", idx: r(2,3,9,10,11,13,15,17,19,20,22) },
      { text: "Finanzierung über eingefrorene russische Vermögen / EU-Reparationsdarlehen statt Schuldenschnitt", idx: r(4,6,12,16) },
      { text: "Gegen AfD-Abkehr; Sanktionen/Schattenflotte; bewährte Waffensysteme; deutsch-britische Kooperation", idx: r(0,14,5,18,7,1,21,8) },
    ],
    kurz: [
      { text: "Entschlossene militärische und finanzielle Unterstützung (die Ukraine verteidigt die europäische Freiheit)", idx: r(2,3,9,10,11,13,15,17,19,20,22) },
      { text: "Finanzierung über eingefrorene russische Vermögen statt Schuldenschnitt; gegen AfD-Abkehr", idx: r(4,6,12,16,0,14,5,18,7,1,21,8) },
    ] },
  { aspekt: "Ukraine-Unterstützung", partei: "GRÜNE",
    lang: [
      { text: "Entschlossenere, umfassendere Unterstützung (weitreichende Waffen wie Taurus, eingefrorene Vermögen mobilisieren)", idx: r(2,4,5,6,11) },
      { text: "Gegen AfD-Antrag zur Beendigung; Korruptionsbekämpfung der Ukraine anerkennen; Energieabhängigkeit von Russland beenden", idx: r(10,1,13,9,3,7,12,8,14,0) },
    ],
    kurz: [
      { text: "Entschlossenere Unterstützung (weitreichende Waffen, eingefrorene Vermögen mobilisieren)", idx: r(2,4,5,6,11) },
      { text: "Gegen AfD-Beendigung; Energieabhängigkeit von Russland beenden", idx: r(10,1,13,9,3,7,12,8,14,0) },
    ] },
  { aspekt: "Ukraine-Unterstützung", partei: "LINKE",
    lang: [
      { text: "Unterstützung mit Fokus auf Zivilschutz, völkerrechtsbasierten Frieden und gerechten Wiederaufbau ohne neue Abhängigkeiten (demokratische Kontrolle)", idx: r(0,4) },
      { text: "Reparationen und Schuldenschnitt aus eingefrorenen russischen Vermögen; gegen AfD-Gleichsetzung mit Migration", idx: r(1,3,2) },
    ],
    kurz: [
      { text: "Unterstützung mit Fokus auf Zivilschutz und gerechten Wiederaufbau ohne neue Abhängigkeiten", idx: r(0,4) },
      { text: "Reparationen/Schuldenschnitt aus russischen Vermögen", idx: r(1,3,2) },
    ] },
  { aspekt: "Ukraine-Unterstützung", partei: "SPD",
    lang: [
      { text: "Deutschland als größter europäischer Unterstützer; ungebrochene militärische, finanzielle und humanitäre Hilfe", idx: r(0,2,4,12,15) },
      { text: "Eingefrorene russische Vermögen für Wiederaufbau/Reparationen; völkerrechtliche Verantwortung Russlands", idx: r(10,14,9,13,16,17) },
      { text: "Russische Angriffe auf Atomanlagen/Infrastruktur; Solidarität mit Frauen; Iran-Unterstützung Russlands; Diplomatie", idx: r(1,8,3,6,7,5,11) },
    ],
    kurz: [
      { text: "Deutschland als größter Unterstützer; ungebrochene militärische, finanzielle und humanitäre Hilfe", idx: r(0,2,4,12,15) },
      { text: "Eingefrorene russische Vermögen für Wiederaufbau; völkerrechtliche Verantwortung Russlands", idx: r(10,14,9,13,16,17,1,8,3,6,7,5,11) },
    ] },

  // ===== Russland-Sanktionen =====
  { aspekt: "Russland-Sanktionen", partei: "AfD",
    lang: [
      { text: "Ablehnung der Sanktionen als ineffektiv und wirtschaftsschädlich für Deutschland; gegen Vermögenskonfiskation/Enteignung", idx: r(4,7,10,12,1,3,8) },
      { text: "Diplomatie und Gespräche statt Konfrontation; gegen Energieblockade und Waffenstationierung", idx: r(2,6,11,5,9,0) },
    ],
    kurz: [
      { text: "Ablehnung der Sanktionen als ineffektiv und wirtschaftsschädlich; gegen Vermögenskonfiskation", idx: r(4,7,10,12,1,3,8) },
      { text: "Diplomatie statt Konfrontation; gegen Energieblockade", idx: r(2,6,11,5,9,0) },
    ] },
  { aspekt: "Russland-Sanktionen", partei: "CDU/CSU",
    lang: [
      { text: "Sanktionen verschärfen und konsequent durchsetzen (Schattenflotte, Öl); eingefrorene Vermögen für die Ukraine, Haftung Russlands", idx: r(3,6,14,15,17,23,2,4,7,16,21) },
      { text: "Russland als zentrale Bedrohung (Westbalkan-Destabilisierung, Mittelmeer, Rüstung)", idx: r(0,1,8,9,10,11,12,13,19,20,24,25) },
      { text: "Glaubwürdige Abschreckung; Aggression darf sich nicht lohnen; gegen AfD-Putin-Nähe; Iran-Sanktionen", idx: r(22,27,28,5,18,26) },
    ],
    kurz: [
      { text: "Sanktionen verschärfen und durchsetzen (Schattenflotte); eingefrorene Vermögen für die Ukraine", idx: r(3,6,14,15,17,23,2,4,7,16,21) },
      { text: "Russland als zentrale Bedrohung; glaubwürdige Abschreckung; gegen AfD-Putin-Nähe", idx: r(0,1,8,9,10,11,12,13,19,20,24,25,22,27,28,5,18,26) },
    ] },
  { aspekt: "Russland-Sanktionen", partei: "GRÜNE",
    lang: [
      { text: "Sanktionen verschärfen und durchsetzen (Schattenflotte, weltweiter Ölhandel); eingefrorene Vermögen für die Ukraine konfiszieren", idx: r(6,7,9,13,18,8,15) },
      { text: "Russland als Aggressor und Kriegsverbrecher; Nord Stream 2 beenden und Energieabhängigkeit lösen", idx: r(4,11,14,16,17,19,2) },
      { text: "Russische Bedrohung in deutschen Gewässern/Kaliningrad; US-Sanktionen gegen Rosneft; Balkan/Iran", idx: r(0,1,3,5,10,12) },
    ],
    kurz: [
      { text: "Sanktionen verschärfen und durchsetzen (Schattenflotte); eingefrorene Vermögen konfiszieren", idx: r(6,7,9,13,18,8,15) },
      { text: "Russland als Aggressor; Nord Stream 2 beenden und Energieabhängigkeit lösen", idx: r(4,11,14,16,17,19,2,0,1,3,5,10,12) },
    ] },
  { aspekt: "Russland-Sanktionen", partei: "LINKE",
    lang: [
      { text: "Umfassende Sanktionen gegen Oligarchen und konsequente Durchsetzung, aber gegen Sanktionen, die die Zivilbevölkerung treffen, ohne UN-Beschluss", idx: r(3,4,1) },
      { text: "Russland trägt Verantwortung und ist zu Wiedergutmachung verpflichtet; Diplomatie und Rückzug der Iskander-Raketen", idx: r(2,0) },
    ],
    kurz: [
      { text: "Sanktionen gegen Oligarchen durchsetzen, aber nicht zulasten der Zivilbevölkerung ohne UN-Beschluss", idx: r(3,4,1) },
      { text: "Russland zu Wiedergutmachung verpflichtet; Diplomatie", idx: r(2,0) },
    ] },
  { aspekt: "Russland-Sanktionen", partei: "SPD",
    lang: [
      { text: "Sanktionen als zentrales Druckmittel, EU-weit einheitlich durchsetzen (Schattenflotte)", idx: r(1,5,8) },
      { text: "Eingefrorene russische Vermögen für Reparationen/Wiederaufbau der Ukraine nutzen", idx: r(2,9,16,17) },
      { text: "Russland als Aggressor und Bedrohung; Energieabhängigkeit lösen; Schutz kritischer Infrastruktur; gegen AfD-Russland-Nähe", idx: r(0,3,4,6,7,10,11,12,13,14,15,18) },
    ],
    kurz: [
      { text: "Sanktionen EU-weit durchsetzen (Schattenflotte); eingefrorene Vermögen für Reparationen nutzen", idx: r(1,5,8,2,9,16,17) },
      { text: "Russland als Aggressor; Energieabhängigkeit lösen; gegen AfD-Russland-Nähe", idx: r(0,3,4,6,7,10,11,12,13,14,15,18) },
    ] },

  // ===== NATO =====
  { aspekt: "NATO", partei: "AfD",
    lang: [
      { text: "Kritik an NATO-Missionen (Sea Guardian, KFOR) als zwecklos und Dauereinsätze; Forderung nach Abzug/Exitstrategie", idx: r(4,6,7,8,11,13) },
      { text: "Kritik am 5-%-BIP-Ziel und an Mittelstreckenraketen; Verhandlungen statt Eskalation", idx: r(5,9,0,2,3,12) },
      { text: "NATO grundsätzlich notwendig für die Sicherheit; Kritik am Kosovokrieg ohne UN-Mandat", idx: r(14,15,10,1) },
    ],
    kurz: [
      { text: "Kritik an NATO-Missionen als zwecklos (Sea Guardian, KFOR); gegen 5-%-Ziel und Mittelstreckenraketen", idx: r(4,6,7,8,11,13,5,9,0,2,3,12) },
      { text: "NATO grundsätzlich notwendig; Kritik am Kosovokrieg ohne UN-Mandat", idx: r(14,15,10,1) },
    ] },
  { aspekt: "NATO", partei: "CDU/CSU",
    lang: [
      { text: "NATO als unverzichtbarer Sicherheitsgarant und transatlantische Partnerschaft; Bündnisverpflichtungen erfüllen", idx: r(2,6,7,18,19,20,24,27,30,34) },
      { text: "NATO-Missionen (KFOR, Sea Guardian, Baltic Sentry, Anti-IS) befürworten zum Schutz von Stabilität und Infrastruktur", idx: r(9,11,12,13,17,23,31,32,33,36,37,1,3,10,16) },
      { text: "Europäischen Pfeiler/Unabhängigkeit stärken (mit USA); Mittelstreckenraketen als Abschreckung gegen Russland; deutsch-britisch", idx: r(4,5,21,25,26,28,8,22,35,0,14,29,15) },
    ],
    kurz: [
      { text: "NATO als unverzichtbarer Sicherheitsgarant und transatlantische Partnerschaft; NATO-Missionen befürworten", idx: r(2,6,7,18,19,20,24,27,30,34,9,11,12,13,17,23,31,32,33,36,37,1,3,10,16) },
      { text: "Europäischen Pfeiler stärken (mit USA); Mittelstreckenraketen als Abschreckung gegen Russland", idx: r(4,5,21,25,26,28,8,22,35,0,14,29,15) },
    ] },
  { aspekt: "NATO", partei: "GRÜNE",
    lang: [
      { text: "NATO als wichtiger Sicherheitspartner mit gestärktem europäischem Pfeiler (Update, verlässliche Finanzierung)", idx: r(8,11,0,10,5) },
      { text: "NATO-Missionen (KFOR, Sea Guardian) befürworten; NATO-Beitritt der Ukraine als Sicherheitsziel", idx: r(1,2,3,6,7,9,4) },
    ],
    kurz: [
      { text: "NATO als Sicherheitspartner mit gestärktem europäischem Pfeiler", idx: r(8,11,0,10,5) },
      { text: "NATO-Missionen befürworten; NATO-Beitritt der Ukraine als Ziel", idx: r(1,2,3,6,7,9,4) },
    ] },
  { aspekt: "NATO", partei: "LINKE",
    lang: [
      { text: "Kritik an NATO-Missionen (KFOR, Sea Guardian) als zwecklos bzw. Migrationskontrolle; Forderung nach Abzug und ziviler Konfliktlösung", idx: r(0,2,3,4,7,8,9) },
      { text: "Gegen Mittelstreckenraketen, nukleare Teilhabe und Abschreckungslogik; gegen einseitige Bündnisfixierung und Datenweitergabe an die Türkei", idx: r(1,10,6,11,5) },
    ],
    kurz: [
      { text: "Kritik an NATO-Missionen (KFOR, Sea Guardian); Forderung nach Abzug und ziviler Konfliktlösung", idx: r(0,2,3,4,7,8,9) },
      { text: "Gegen Mittelstreckenraketen, nukleare Teilhabe und Abschreckungslogik", idx: r(1,10,6,11,5) },
    ] },
  { aspekt: "NATO", partei: "SPD",
    lang: [
      { text: "NATO als zentrale Sicherheitsinstitution und transatlantisches Bündnis; europäischen Pfeiler stärken und investieren", idx: r(0,3,6,8,13,15) },
      { text: "NATO-Missionen (Sea Guardian, KFOR) zur Stabilisierung und zum Schutz kritischer Infrastruktur befürworten", idx: r(1,2,4,5,10,16) },
      { text: "Mittelstreckenraketen als Abschreckung (Doppelbeschluss) mit Rüstungskontrolle; deutsch-britisch; US-Truppen, aber keine Kriegspartei", idx: r(9,11,12,14,7,17) },
    ],
    kurz: [
      { text: "NATO als zentrale Sicherheitsinstitution; europäischen Pfeiler stärken; NATO-Missionen befürworten", idx: r(0,3,6,8,13,15,1,2,4,5,10,16) },
      { text: "Mittelstreckenraketen als Abschreckung mit Rüstungskontrolle; deutsch-britisch", idx: r(9,11,12,14,7,17) },
    ] },

  // ===== China =====
  { aspekt: "China", partei: "AfD",
    lang: [
      { text: "Rohstoffabhängigkeit (seltene Erden) reduzieren; tragfähige Handelsbeziehungen unter Wahrung der Souveränität und Reziprozität", idx: r(0,4,6) },
      { text: "Spionage und Sicherheitsrisiken klar benennen; Kritik am Bedeutungsverlust Deutschlands", idx: r(2,3,5,1) },
    ],
    kurz: [
      { text: "Rohstoffabhängigkeit reduzieren; Handelsbeziehungen unter Souveränität und Reziprozität", idx: r(0,4,6) },
      { text: "Spionage und Sicherheitsrisiken klar benennen", idx: r(2,3,5,1) },
    ] },
  { aspekt: "China", partei: "CDU/CSU",
    lang: [
      { text: "China als strategische Bedrohung (Unterseekabel-Sabotage, Nukleararsenal)", idx: r(0,3,8) },
      { text: "Abhängigkeiten reduzieren (China-Check, seltene Erden); Reziprozität und Souveränität durch eigene Stärke", idx: r(5,6,7,4) },
      { text: "Kritik an AfD-Nähe zum chinesischen Regime", idx: r(1,2) },
    ],
    kurz: [
      { text: "China als strategische Bedrohung; Abhängigkeiten reduzieren (China-Check); Reziprozität durch eigene Stärke", idx: r(0,3,8,5,6,7,4) },
      { text: "Kritik an AfD-Nähe zum chinesischen Regime", idx: r(1,2) },
    ] },
  { aspekt: "China", partei: "GRÜNE",
    lang: [{ text: "Warnung vor zu enger Zusammenarbeit mit China und vor dessen strategischem Einfluss (Afrika)", idx: r(0,1) }],
    kurz: [{ text: "Warnung vor zu enger Zusammenarbeit und Chinas strategischem Einfluss", idx: r(0,1) }] },
  { aspekt: "China", partei: "LINKE",
    lang: [{ text: "Entspannung, vertrauensbildende Mechanismen und Kooperation statt Konfrontation und Systemkonkurrenz", idx: r(0) }],
    kurz: [{ text: "Entspannung und Kooperation statt Konfrontation", idx: r(0) }] },
  { aspekt: "China", partei: "SPD",
    lang: [
      { text: "China als aggressiver geoökonomischer Akteur; De-Risking statt De-Coupling und Diversifizierung der Handelsbeziehungen", idx: r(1,2,3,4,5) },
      { text: "China als Akteur in sicherheitspolitischen Lücken (Bosnien)", idx: r(0) },
    ],
    kurz: [
      { text: "China als aggressiver geoökonomischer Akteur; De-Risking statt De-Coupling", idx: r(1,2,3,4,5) },
      { text: "China dringt in sicherheitspolitische Lücken ein", idx: r(0) },
    ] },

  // ===== Israel & Nahost =====
  { aspekt: "Israel & Nahost", partei: "AfD",
    lang: [
      { text: "Harte Haltung gegenüber dem Iran-Regime; Verbot der Revolutionsgarden und der Hisbollah", idx: r(0,4,5,8,17) },
      { text: "Israel gegen Antisemitismus und Genozid-Vorwürfe verteidigen", idx: r(16,19,24) },
      { text: "Gegen das UNIFIL-Mandat (Gefahr für deutsche Soldaten); Syrien-Kritik (islamistische Akteure); Huthi-Schutzmission; uneinheitlich zu Waffenlieferungen an Israel", idx: r(6,13,14,18,22,1,2,3,21,23,7,9,10,11,12,15,20) },
    ],
    kurz: [
      { text: "Harte Haltung gegenüber dem Iran-Regime (Verbot der Revolutionsgarden); Israel gegen Antisemitismus verteidigen", idx: r(0,4,5,8,17,16,19,24) },
      { text: "Gegen das UNIFIL-Mandat; Syrien-Kritik; Huthi-Schutzmission", idx: r(6,13,14,18,22,1,2,3,21,23,7,9,10,11,12,15,20) },
    ] },
  { aspekt: "Israel & Nahost", partei: "CDU/CSU",
    lang: [
      { text: "Iran-Regime und Revolutionsgarden auf die Terrorliste; gezielte Sanktionen, Unterstützung der Opposition; Atomwaffen verhindern", idx: r(3,5,10,13,14,16,18,19,21,17) },
      { text: "Israel-Solidarität und Existenzrecht (7. Oktober), gegen einseitige Kritik; humanitäre Hilfe in Gaza; gegen Annexion", idx: r(6,9,22,24,4,11) },
      { text: "UNIFIL zur Stabilisierung des Libanon; Syrien-Stabilisierung und Minderheitenschutz; Jesiden-Völkermord; Anti-IS im Irak", idx: r(0,12,20,7,15,1,2,23,8) },
    ],
    kurz: [
      { text: "Iran-Regime und Revolutionsgarden auf die Terrorliste; Israel-Solidarität und Existenzrecht", idx: r(3,5,10,13,14,16,18,19,21,17,6,9,22,24,4,11) },
      { text: "UNIFIL zur Stabilisierung des Libanon; Syrien-Stabilisierung und Minderheitenschutz; Anti-IS im Irak", idx: r(0,12,20,7,15,1,2,23,8) },
    ] },
  { aspekt: "Israel & Nahost", partei: "GRÜNE",
    lang: [
      { text: "Iran-Regime kritisieren, Revolutionsgarden auf die Terrorliste; Solidarität mit der iranischen Bevölkerung und Zivilgesellschaft", idx: r(0,1,3,5,10,12) },
      { text: "UNIFIL und territoriale Integrität des Libanon; Anti-IS und Minderheitenschutz im Irak; gegen israelischen Siedlungsbau; Syrien-Wiederaufbau", idx: r(2,11,4,7,8,6,9) },
    ],
    kurz: [
      { text: "Iran-Regime kritisieren, Revolutionsgarden auf die Terrorliste; Solidarität mit der Bevölkerung", idx: r(0,1,3,5,10,12) },
      { text: "UNIFIL/Libanon; Anti-IS im Irak; gegen israelischen Siedlungsbau", idx: r(2,11,4,7,8,6,9) },
    ] },
  { aspekt: "Israel & Nahost", partei: "LINKE",
    lang: [
      { text: "Israelische Militäroperation in Gaza als Kriegsverbrechen; Stopp von Waffenexporten und Anerkennung Palästinas als Staat", idx: r(0,2,6,11) },
      { text: "Gegen UNIFIL und Anti-IS-Einsätze; Kritik an Jemen-Krieg und an Saudi-Arabien", idx: r(3,4,7,8) },
      { text: "Iran-Revolutionsgarden auf die Terrorliste bei universeller Menschenrechtspolitik; HTS-Syrien/Rojava; Frauen in Friedensverhandlungen; gegen Kriminalisierung von Protesten", idx: r(12,13,1,5,9,10,14) },
    ],
    kurz: [
      { text: "Israelische Gaza-Operation als Kriegsverbrechen; Waffenexportstopp und Anerkennung Palästinas", idx: r(0,2,6,11) },
      { text: "Gegen UNIFIL und Anti-IS-Einsätze; Iran-Menschenrechte universell; Jemen/Saudi-Arabien-Kritik", idx: r(3,4,7,8,12,13,1,5,9,10,14) },
    ] },
  { aspekt: "Israel & Nahost", partei: "SPD",
    lang: [
      { text: "Waffenstillstand, Zweistaatenlösung und humanitäre Hilfe in Gaza; israelisches Vorgehen als völkerrechtswidrig kritisiert, 7. Oktober anerkannt", idx: r(2,3,5,6,10,12) },
      { text: "UNIFIL zur Stabilisierung des Libanon und Überwachung des Waffenstillstands", idx: r(0,1,13) },
      { text: "Iran-Regime: Sanktionen, Revolutionsgarden auf die Terrorliste, Unterstützung der Freiheitsbewegung; gegen US-Israel-Krieg ohne UN-Mandat; Syrien-Aufarbeitung", idx: r(4,7,8,9,11,14) },
    ],
    kurz: [
      { text: "Waffenstillstand, Zweistaatenlösung und humanitäre Hilfe in Gaza; UNIFIL/Libanon", idx: r(2,3,5,6,10,12,0,1,13) },
      { text: "Iran-Sanktionen, Revolutionsgarden auf die Terrorliste; gegen US-Israel-Krieg ohne UN-Mandat", idx: r(4,7,8,9,11,14) },
    ] },

  // ===== EU-Außenpolitik & Souveränität =====
  { aspekt: "EU-Außenpolitik & Souveränität", partei: "AfD",
    lang: [
      { text: "Nationale Souveränität und Interessen statt EU-Bindung und supranationaler Vorgaben", idx: r(1,3,8,9,10,17,20,26,30,33,34,35,36) },
      { text: "Interessen- statt wertebasierte Außenpolitik; gegen feministische Außenpolitik als ideologische Pose", idx: r(11,19,21,22,29,12) },
      { text: "Kritik an EU-Missionen (Irini, EUFOR Althea, Balkan) als zwecklos; EU als Bürokratiemonster; Grenzschutz/Migration; Rohstoffdiplomatie", idx: r(0,14,15,18,23,25,31,37,38,24,28,4,27,2,16,32,13,7,5,6) },
    ],
    kurz: [
      { text: "Nationale Souveränität und Interessen statt EU-Bindung; interessen- statt wertebasiert; gegen feministische Außenpolitik", idx: r(1,3,8,9,10,17,20,26,30,33,34,35,36,11,19,21,22,29,12) },
      { text: "Kritik an EU-Missionen als zwecklos; EU als Bürokratiemonster; Grenzschutz/Migration", idx: r(0,14,15,18,23,25,31,37,38,24,28,4,27,2,16,32,13,7,5,6) },
    ] },
  { aspekt: "EU-Außenpolitik & Souveränität", partei: "CDU/CSU",
    lang: [
      { text: "EU-Missionen (EUFOR Althea/Bosnien, KFOR, Irini, Aspides) als europäische Verantwortung zur Stabilisierung befürworten", idx: r(0,3,6,10,11,12,13,18,22,24,26,30,31,34,36,40,45,48,50,55) },
      { text: "Europäische Souveränität und strategische Autonomie (Verteidigungsunion, Rohstoffe, Mikrochips) bei transatlantischer Partnerschaft", idx: r(27,28,37,41,42,44,46,53,4,7,19,21,29,32,39,54,1,2,5) },
      { text: "EU-Integration des Westbalkans/Kosovo; Iran-Terrorliste; deutsch-britisches E3-Format; Syrien-Engagement; substanzorientiert statt symbolisch", idx: r(9,15,23,25,52,20,35,17,47,51,43,49,14,38,16,8,33) },
    ],
    kurz: [
      { text: "EU-Missionen als europäische Verantwortung befürworten; europäische Souveränität und strategische Autonomie bei transatlantischer Partnerschaft", idx: r(0,3,6,10,11,12,13,18,22,24,26,30,31,34,36,40,45,48,50,55,27,28,37,41,42,44,46,53,4,7,19,21,29,32,39,54,1,2,5) },
      { text: "EU-Integration des Westbalkans/Kosovo; Iran-Terrorliste; deutsch-britisches E3-Format", idx: r(9,15,23,25,52,20,35,17,47,51,43,49,14,38,16,8,33) },
    ] },
  { aspekt: "EU-Außenpolitik & Souveränität", partei: "GRÜNE",
    lang: [
      { text: "Europäische Souveränität und Unabhängigkeit (Energie, Sicherheit, Technologie) als gleichberechtigter Partner", idx: r(0,10,19,20,21,22) },
      { text: "Mehr Diplomatie und gestärkte EU-Handlungsfähigkeit zur Verteidigung des Völkerrechts; EU-Integration des Westbalkans/Kosovo", idx: r(1,4,6,14,16,3,5,8,12,13,15) },
      { text: "Gegen Zusammenarbeit mit der libyschen Küstenwache; EU-Mandate der Bundeswehr; feministische Außenpolitik; parlamentarische Kontrolle", idx: r(7,17,11,23,9,18,2) },
    ],
    kurz: [
      { text: "Europäische Souveränität und Unabhängigkeit (Energie, Sicherheit, Technologie); mehr Diplomatie und EU-Handlungsfähigkeit", idx: r(0,10,19,20,21,22,1,4,6,14,16,3,5,8,12,13,15) },
      { text: "Gegen Zusammenarbeit mit der libyschen Küstenwache; feministische Außenpolitik", idx: r(7,17,11,23,9,18,2) },
    ] },
  { aspekt: "EU-Außenpolitik & Souveränität", partei: "LINKE",
    lang: [
      { text: "Kritik an militärischer EU-Außenpolitik (EUFOR Althea, Irini, Aspides) als undemokratische Fremdbestimmung; zivile Lösungen statt Militärmandate", idx: r(2,3,4,8,13,16,5,12) },
      { text: "Revolutionsgarden auf die EU-Terrorliste; Kritik an EU-Grenzschutz/Frontex und an ausbeuterischen Handelsabkommen", idx: r(0,7,17,1,6) },
      { text: "Eigenständige EU-Diplomatie und Entspannung; gegen Rüstungsexporte und US-Basen; Syrien; gemeinsame Vermögensstrategie", idx: r(14,15,10,9,11) },
    ],
    kurz: [
      { text: "Kritik an militärischer EU-Außenpolitik (EUFOR Althea, Irini); zivile Lösungen statt Militärmandate", idx: r(2,3,4,8,13,16,5,12) },
      { text: "Revolutionsgarden auf die EU-Terrorliste; gegen EU-Grenzschutz und ausbeuterische Handelsabkommen; eigenständige EU-Diplomatie", idx: r(0,7,17,1,6,14,15,10,9,11) },
    ] },
  { aspekt: "EU-Außenpolitik & Souveränität", partei: "SPD",
    lang: [
      { text: "EU-Missionen (EUFOR Althea, Irini, KFOR) als europäische Verantwortung und Sicherheitspolitik befürworten", idx: r(2,7,8,9,10,12,16,23,26,29,36,34) },
      { text: "Europäische Souveränität und Autonomie (Sicherheit, Wirtschaft, Technologie) bei transatlantischer Partnerschaft; deutsch-britische Partnerschaft", idx: r(3,5,6,11,13,19,25,27,28,30,14,17,18) },
      { text: "Iran-Koordination und Sanktionen; Unterseekabel; geschlechtergerechte Außenpolitik; Nahost-EU-Aktion; Syrien; gegen Taliban-Anerkennung; Ukraine-Beitritt", idx: r(21,24,0,32,20,4,35,22,31,33,1,15) },
    ],
    kurz: [
      { text: "EU-Missionen als europäische Verantwortung befürworten; europäische Souveränität und Autonomie bei transatlantischer Partnerschaft", idx: r(2,7,8,9,10,12,16,23,26,29,36,34,3,5,6,11,13,19,25,27,28,30,14,17,18) },
      { text: "Iran-Koordination; geschlechtergerechte Außenpolitik; Nahost-EU-Aktion; gegen Taliban-Anerkennung", idx: r(21,24,0,32,20,4,35,22,31,33,1,15) },
    ] },

  // ===== Abrüstung & Atomwaffen =====
  { aspekt: "Abrüstung & Atomwaffen", partei: "AfD",
    lang: [
      { text: "Verhandlungen, Abrüstungsverträge und Rüstungskontrolle statt Aufrüstung; gegen Mittelstreckenraketen und Erstschlagssysteme in Deutschland", idx: r(0,2,5,6) },
      { text: "Rüstungskontrolle braucht Vertrauen, das in der multipolaren Ordnung fehlt; Kritik am iranischen Atomprogramm", idx: r(4,1,3) },
    ],
    kurz: [
      { text: "Verhandlungen und Rüstungskontrolle statt Aufrüstung; gegen Mittelstreckenraketen in Deutschland", idx: r(0,2,5,6) },
      { text: "Vertrauen fehlt in der multipolaren Ordnung; Kritik am iranischen Atomprogramm", idx: r(4,1,3) },
    ] },
  { aspekt: "Abrüstung & Atomwaffen", partei: "CDU/CSU",
    lang: [
      { text: "Rüstungskontrolle erwünscht, aber gegen einseitige Abrüstung und Appeasement (Russland muss sich an Regeln halten)", idx: r(1,2,3,4) },
      { text: "Iranischen Atomwaffenbesitz verhindern; Verschärfung der Iranpolitik (Terrorlistung der Revolutionsgarden)", idx: r(0) },
    ],
    kurz: [
      { text: "Rüstungskontrolle erwünscht, aber gegen einseitige Abrüstung und Appeasement", idx: r(1,2,3,4) },
      { text: "Iranischen Atomwaffenbesitz verhindern", idx: r(0) },
    ] },
  { aspekt: "Abrüstung & Atomwaffen", partei: "GRÜNE",
    lang: [{ text: "Rüstungskontrolle und internationale Abkommen, ethische Leitlinien für neue Waffensysteme; Kritik am Linke-Antrag gegen Mittelstreckenraketen", idx: r(0,1) }],
    kurz: [{ text: "Rüstungskontrolle und internationale Abkommen; ethische Leitlinien für neue Waffensysteme", idx: r(0,1) }] },
  { aspekt: "Abrüstung & Atomwaffen", partei: "LINKE",
    lang: [{ text: "Abrüstung und atomwaffenfreie Welt statt Aufrüstungsspirale; Investitionen in Diplomatie statt Waffensysteme (mittelstreckenwaffenfreies Europa)", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Abrüstung und atomwaffenfreie Welt statt Aufrüstung; Diplomatie statt Waffen", idx: r(0,1,2,3,4) }] },
  { aspekt: "Abrüstung & Atomwaffen", partei: "SPD",
    lang: [
      { text: "Gegen einseitige Abrüstung; Abschreckung und Rüstungskontrolle/Diplomatie kombinieren", idx: r(0,1,5,6) },
      { text: "Iran-Snapback und IAEA-Überwachung; gegen deutsche Atomwaffen-Debatte; Schutz von Atomanlagen; gegen Rüstungsexporte in Diktaturen", idx: r(4,3,2,7) },
    ],
    kurz: [
      { text: "Gegen einseitige Abrüstung; Abschreckung und Rüstungskontrolle kombinieren", idx: r(0,1,5,6) },
      { text: "Iran-Snapback/IAEA; gegen deutsche Atomwaffen-Debatte; gegen Rüstungsexporte in Diktaturen", idx: r(4,3,2,7) },
    ] },

  // ===== UN & Multilateralismus =====
  { aspekt: "UN & Multilateralismus", partei: "AfD",
    lang: [
      { text: "Kritik an UN-Missionen (UNIFIL, KFOR, Irini, Aspides) als ineffektiv und ohne Exitstrategie", idx: r(5,6,11,12,14,15,18,22,23,25,26,27) },
      { text: "UN-Mandat als Legitimationsvoraussetzung gefordert, zugleich aber gegen Bindung an internationale Organisationen (nationale Unabhängigkeit)", idx: r(3,4,13,16,21,28,1,17) },
      { text: "WHO/IGV und Pandemievertrag ablehnen; selektives Völkerrecht; Iran; gescheiterte UN-Sicherheitsrats-Kandidatur", idx: r(9,20,0,2,10,8,24,7,19) },
    ],
    kurz: [
      { text: "Kritik an UN-Missionen als ineffektiv; gegen Bindung an internationale Organisationen (nationale Unabhängigkeit)", idx: r(5,6,11,12,14,15,18,22,23,25,26,27,3,4,13,16,21,28,1,17) },
      { text: "WHO/IGV und Pandemievertrag ablehnen; selektives Völkerrecht", idx: r(9,20,0,2,10,8,24,7,19) },
    ] },
  { aspekt: "UN & Multilateralismus", partei: "CDU/CSU",
    lang: [
      { text: "Regelbasierte Weltordnung und Völkerrecht verteidigen; UN-mandatiertes Handeln; internationale Rechtsregeln (Hochseeschutz)", idx: r(0,1,2,3,4,5,6,8,11,14,38,42,44,47) },
      { text: "UN-Friedensmissionen (UNIFIL, UNMISS, KFOR, Irini) als Beitrag zu Stabilität und Friedenssicherung unterstützen", idx: r(9,10,12,13,16,17,18,19,21,23,24,27,29,30,31,34,36,37,39,41,45,46) },
      { text: "UN-Resolution 1325 (Frauen); IGV als nicht verbindlich; Dayton/Srebrenica; humanitäre Hilfe in Gaza; gegen AfD-Ende-Multilateralismus", idx: r(7,15,25,33,40,43,20,48,22,26,28,32,35) },
    ],
    kurz: [
      { text: "Regelbasierte Weltordnung und Völkerrecht verteidigen; UN-Friedensmissionen (UNIFIL, UNMISS, KFOR, Irini) unterstützen", idx: r(0,1,2,3,4,5,6,8,11,14,38,42,44,47,9,10,12,13,16,17,18,19,21,23,24,27,29,30,31,34,36,37,39,41,45,46) },
      { text: "UN-Resolution 1325 (Frauen); Dayton/Srebrenica; gegen AfD-Ende-Multilateralismus", idx: r(7,15,25,33,40,43,20,48,22,26,28,32,35) },
    ] },
  { aspekt: "UN & Multilateralismus", partei: "GRÜNE",
    lang: [
      { text: "Regelbasierte internationale Ordnung, Völkerrecht und multilaterale Institutionen verteidigen und ausreichend finanzieren", idx: r(7,10,13,16,18,24,26,5) },
      { text: "UN-Missionen (UNMISS, KFOR, UNIFIL, Irini) und UN-basierte Friedensmissionen unterstützen", idx: r(0,8,11,14,17,21,23,25,3) },
      { text: "WHO/IGV unterstützen; völkerrechtliche Seenotrettung; mehr Diplomatie; Srebrenica-Geschlossenheit; Wahlbeobachtung", idx: r(9,2,4,15,22,6,1,12,19,20) },
    ],
    kurz: [
      { text: "Regelbasierte Ordnung, Völkerrecht und multilaterale Institutionen verteidigen; UN-Missionen unterstützen", idx: r(7,10,13,16,18,24,26,5,0,8,11,14,17,21,23,25,3) },
      { text: "WHO/IGV unterstützen; völkerrechtliche Seenotrettung; mehr Diplomatie", idx: r(9,2,4,15,22,6,1,12,19,20) },
    ] },
  { aspekt: "UN & Multilateralismus", partei: "LINKE",
    lang: [
      { text: "Völkerrecht und UN-Charta konsequent und ohne Doppelstandards einhalten (auch durch NATO/USA/Russland)", idx: r(1,5,7,9,14,16,22,23,26,29) },
      { text: "Gegen militärische UN-/NATO-Missionen; zivile Konfliktbearbeitung statt Truppeneinsätze", idx: r(0,2,8,10,12,13,19,21,24,25) },
      { text: "Gegen den undemokratischen Hohen Repräsentanten in Bosnien; WHO/IGV und Resolution 1325; Diplomatie statt Bündnispolitik; Sudan/Strafgerichtshof", idx: r(3,28,4,6,15,27,11,18,20,17) },
    ],
    kurz: [
      { text: "Völkerrecht und UN-Charta konsequent ohne Doppelstandards; gegen militärische UN-/NATO-Missionen, zivile Konfliktbearbeitung", idx: r(1,5,7,9,14,16,22,23,26,29,0,2,8,10,12,13,19,21,24,25) },
      { text: "Gegen den Hohen Repräsentanten in Bosnien; WHO/IGV; Diplomatie statt Bündnispolitik", idx: r(3,28,4,6,15,27,11,18,20,17) },
    ] },
  { aspekt: "UN & Multilateralismus", partei: "SPD",
    lang: [
      { text: "Völkerrecht universell anwenden und die regelbasierte Ordnung verteidigen (keine Anwendung à la carte)", idx: r(2,9,10,11,13,16,17,23,30,35) },
      { text: "UN-Missionen (UNIFIL, UNMISS, KFOR, Irini) und multilaterale Kooperation unterstützen", idx: r(3,6,7,12,18,19,28,29,32,33) },
      { text: "UN-Resolution 1325 (Frauen); WHO/IGV; Strafverfolgung von Kriegsverbrechen; Taliban nicht anerkennen; UN-koordinierte humanitäre Hilfe", idx: r(8,14,4,0,1,20,21,34,15,25,26,27,31,24,22,5) },
    ],
    kurz: [
      { text: "Völkerrecht universell anwenden und die regelbasierte Ordnung verteidigen; UN-Missionen unterstützen", idx: r(2,9,10,11,13,16,17,23,30,35,3,6,7,12,18,19,28,29,32,33) },
      { text: "Resolution 1325; WHO/IGV; Strafverfolgung von Kriegsverbrechen; Taliban nicht anerkennen", idx: r(8,14,4,0,1,20,21,34,15,25,26,27,31,24,22,5) },
    ] },

  // ===== Globaler Süden =====
  { aspekt: "Globaler Süden", partei: "AfD",
    lang: [
      { text: "Kritik an Entwicklungshilfe für Regime (Afghanistan, Syrien) und an Gender-Budgeting/LGBTIQ-Projekten als unwirksam", idx: r(1,2,4,6,8) },
      { text: "Hilfe an Reformbedingungen und Rückführungen koppeln; Rohstoffpartnerschaften; Kritik an EU-Wirtschaftspartnerschaften als neokolonial", idx: r(11,0,3,5,7,9,10) },
    ],
    kurz: [
      { text: "Kritik an Entwicklungshilfe für Regime und an Gender-Budgeting/LGBTIQ-Projekten", idx: r(1,2,4,6,8) },
      { text: "Hilfe an Reformbedingungen koppeln; EU-Wirtschaftspartnerschaften neokolonial", idx: r(11,0,3,5,7,9,10) },
    ] },
  { aspekt: "Globaler Süden", partei: "CDU/CSU",
    lang: [
      { text: "Humanitäre Hilfe und Verantwortung im Südsudan; Stabilität in Afrika als europäisches Interesse", idx: r(1,3,4) },
      { text: "Lokale Partnerschaften und Lokalisierung von Hilfe statt Bevormundung; Quad-Prozess im Sudan", idx: r(2,0) },
    ],
    kurz: [
      { text: "Humanitäre Hilfe im Südsudan; Stabilität in Afrika als europäisches Interesse", idx: r(1,3,4) },
      { text: "Lokale Partnerschaften statt Bevormundung", idx: r(2,0) },
    ] },
  { aspekt: "Globaler Süden", partei: "GRÜNE",
    lang: [
      { text: "Humanitäre Hilfe und Stabilisierung in Konfliktregionen (Südsudan, Sudan)", idx: r(0,1,2) },
      { text: "Faire Wirtschaftspartnerschaften mit sozialen, ökologischen und menschenrechtlichen Standards", idx: r(3) },
    ],
    kurz: [
      { text: "Humanitäre Hilfe und Stabilisierung in Konfliktregionen", idx: r(0,1,2) },
      { text: "Faire Wirtschaftspartnerschaften mit Standards", idx: r(3) },
    ] },
  { aspekt: "Globaler Süden", partei: "LINKE",
    lang: [
      { text: "Gegen Rohstoffausbeutung und neokoloniale Strukturen; faire Partnerschaft und Bekämpfung von Fluchtursachen statt Handelsabkommen/Waffenlieferungen", idx: r(2,6,11,4,8) },
      { text: "Humanitäre Hilfe statt Militärpräsenz; gerechte Verteilung von Impfstoffen und Medikamenten", idx: r(0,3,5,7,10) },
      { text: "Feministische Solidarität; Verurteilung des US-Angriffs auf Venezuela", idx: r(1,9) },
    ],
    kurz: [
      { text: "Gegen Rohstoffausbeutung und neokoloniale Strukturen; humanitäre Hilfe statt Militärpräsenz", idx: r(2,6,11,4,8,0,3,5,7,10) },
      { text: "Feministische Solidarität; gegen US-Angriff auf Venezuela", idx: r(1,9) },
    ] },
  { aspekt: "Globaler Süden", partei: "SPD",
    lang: [
      { text: "Humanitäre Hilfe und Solidarität mit der Zivilbevölkerung (Sudan)", idx: r(0,1,2) },
      { text: "Gegen Instrumentalisierung von Entwicklungshilfe in Migrationsfragen und gegen externe Einmischung in Konflikte", idx: r(3,4) },
    ],
    kurz: [
      { text: "Humanitäre Hilfe und Solidarität mit der Zivilbevölkerung (Sudan)", idx: r(0,1,2) },
      { text: "Gegen Instrumentalisierung von Entwicklungshilfe und externe Einmischung", idx: r(3,4) },
    ] },

  // ===== UN-Migrationspakt / WHO-Vertrag =====
  { aspekt: "UN-Migrationspakt / WHO-Vertrag", partei: "AfD",
    lang: [{ text: "Ablehnung der Internationalen Gesundheitsvorschriften und völkerrechtlicher Bindungen an WHO-Beschlüsse", idx: r(0) }],
    kurz: [{ text: "Ablehnung der IGV und völkerrechtlicher Bindung an WHO-Beschlüsse", idx: r(0) }] },
  { aspekt: "UN-Migrationspakt / WHO-Vertrag", partei: "GRÜNE",
    lang: [{ text: "Unterstützung der Änderungen an den Internationalen Gesundheitsvorschriften", idx: r(0) }],
    kurz: [{ text: "Unterstützung der IGV-Änderungen", idx: r(0) }] },
  { aspekt: "UN-Migrationspakt / WHO-Vertrag", partei: "LINKE",
    lang: [{ text: "Befürwortung der WHO-Gesundheitsvorschriften und des Pandemievertrags; Kritik an nationalen Egoismen beim Zugang zu Impfstoffen", idx: r(0) }],
    kurz: [{ text: "Befürwortung der WHO-Vorschriften und des Pandemievertrags", idx: r(0) }] },
];

applySynthese("Außenpolitik und internationale Beziehungen", CELLS);
