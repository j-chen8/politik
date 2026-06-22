/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Energie" (45 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Kernenergie =====
  { aspekt: "Kernenergie", partei: "AfD",
    lang: [
      { text: "Wiedereinstieg in die Kernenergie und Wiederinbetriebnahme abgeschalteter Kraftwerke als günstige, grundlastfähige und CO₂-arme Energiequelle; Kritik am Atomausstieg als ideologischem Fehler", idx: r(0,1,2,4,5,6,7,8,9,11,12,13,14,18,19,20,22,23,24,25,26,27,28,30,31,32,33,35,36,37,38,39,40,41,42,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,82,83) },
      { text: "Small Modular Reactors und neue Reaktoren; Kritik an Subventionsdarstellung; Castor-Transport nach Ahaus; Sicherheitsfragen", idx: r(3,10,15,16,17,21,29,34,43,62,81,84) },
    ],
    kurz: [
      { text: "Wiedereinstieg in die Kernenergie und Wiederinbetriebnahme abgeschalteter Kraftwerke; Atomausstieg als Fehler", idx: r(0,1,2,4,5,6,7,8,9,11,12,13,14,18,19,20,22,23,24,25,26,27,28,30,31,32,33,35,36,37,38,39,40,41,42,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,82,83) },
      { text: "Small Modular Reactors und neue Reaktoren; Castor-Transport nach Ahaus", idx: r(3,10,15,16,17,21,29,34,43,62,81,84) },
    ] },
  { aspekt: "Kernenergie", partei: "CDU/CSU",
    lang: [
      { text: "Atomausstieg war ein Fehler, aber Reaktivierung alter Kraftwerke unwirtschaftlich; Offenheit für SMR und Kernfusion als Zukunftstechnologien", idx: r(0,2,7,8,9,15,16,17,18,19,21,22,24,29) },
      { text: "Ablehnung einer Rückkehr zur Atomkraft als Lösung (Akzeptanz, Endlager, Personal)", idx: r(3,4,5,6,11,13,23,26,27,28,30) },
      { text: "Castor-Transporte von Jülich nach Ahaus als sichere und kostengünstige Lösung", idx: r(1,10,12,14,20,25) },
    ],
    kurz: [
      { text: "Atomausstieg war ein Fehler, aber Reaktivierung alter Kraftwerke unwirtschaftlich; Offenheit für SMR und Kernfusion", idx: r(0,2,7,8,9,15,16,17,18,19,21,22,24,29,3,4,5,6,11,13,23,26,27,28,30) },
      { text: "Castor-Transporte von Jülich nach Ahaus als sichere Lösung", idx: r(1,10,12,14,20,25) },
    ] },
  { aspekt: "Kernenergie", partei: "GRÜNE",
    lang: [
      { text: "Ablehnung der Atomkraft als teuer, unsicher und überholt; der Atomausstieg ist richtig und irreversibel", idx: r(0,1,2,3,4,5,6,7,8,10,12,13,15) },
      { text: "Gegen Small Modular Reactors als Etikettenschwindel; Fokus auf Endlagerung", idx: r(9,11,14) },
    ],
    kurz: [
      { text: "Ablehnung der Atomkraft als teuer und unsicher; Atomausstieg richtig und irreversibel", idx: r(0,1,2,3,4,5,6,7,8,10,12,13,15) },
      { text: "Gegen Small Modular Reactors; Fokus auf Endlagerung", idx: r(9,11,14) },
    ] },
  { aspekt: "Kernenergie", partei: "LINKE",
    lang: [
      { text: "Ablehnung der Atomkraft als unwirtschaftlich, gefährlich und abhängigkeitserzeugend; Atomausstieg befürworten", idx: r(0,1,2,3,6,7,8,9,10,11,12,13,15,16,17,18,19) },
      { text: "Castor-Transporte nach Ahaus kritisch; sicheres Zwischenlager und Endlagersuche", idx: r(4,5,14) },
    ],
    kurz: [
      { text: "Ablehnung der Atomkraft als unwirtschaftlich und gefährlich; Atomausstieg befürworten", idx: r(0,1,2,3,6,7,8,9,10,11,12,13,15,16,17,18,19) },
      { text: "Castor-Transporte nach Ahaus kritisch; sicheres Zwischenlager", idx: r(4,5,14) },
    ] },
  { aspekt: "Kernenergie", partei: "SPD",
    lang: [
      { text: "Ablehnung einer Rückkehr zur Atomkraft als teuer und unsicher mit ungelöstem Endlager; gegen Reaktivierung; Kernfusion als Zukunftsperspektive", idx: r(0,2,3,4,5,6,8,9,10,11,12,13,14,16,17,18,19,20,21,22) },
      { text: "Castor-Transporte von Jülich nach Ahaus; gegen SMR als überholt", idx: r(1,7,15) },
    ],
    kurz: [
      { text: "Ablehnung einer Rückkehr zur Atomkraft (teuer, unsicher, Endlager ungelöst); gegen Reaktivierung", idx: r(0,2,3,4,5,6,8,9,10,11,12,13,14,16,17,18,19,20,21,22) },
      { text: "Castor-Transporte von Jülich nach Ahaus; gegen SMR", idx: r(1,7,15) },
    ] },

  // ===== Kohle =====
  { aspekt: "Kohle", partei: "AfD",
    lang: [
      { text: "Kohle als grundlastfähige Energiequelle erhalten; Kohleausstieg stoppen und das Kohleausstiegsgesetz aufheben", idx: r(0,1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18) },
      { text: "Kritik, dass Wärmepumpen-Strom primär aus Kohle stammt", idx: r(7) },
    ],
    kurz: [{ text: "Kohle als grundlastfähig erhalten; Kohleausstieg stoppen", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18) }] },
  { aspekt: "Kohle", partei: "CDU/CSU",
    lang: [{ text: "Weiterbetrieb der Kohlekraftwerke bis 2038 zur Stabilität, aber kohlebasierte Stahlproduktion auf Wasserstoff umstellen; Kohleverstromung durch Kernabschaltung und CO₂-Preise problematisch", idx: r(0,1,2,3) }],
    kurz: [{ text: "Weiterbetrieb bis 2038 zur Stabilität, Stahl auf Wasserstoff umstellen", idx: r(0,1,2,3) }] },
  { aspekt: "Kohle", partei: "GRÜNE",
    lang: [{ text: "Kohleausstieg befürworten; Kritik an Umweltschäden, Flächenverbrauch und externen Kosten des Kohleabbaus", idx: r(0,1,2,3,4,5,6,7,8,9) }],
    kurz: [{ text: "Kohleausstieg befürworten; Kritik an Umweltschäden und Flächenverbrauch", idx: r(0,1,2,3,4,5,6,7,8,9) }] },
  { aspekt: "Kohle", partei: "LINKE",
    lang: [{ text: "Ablehnung von Kohleabbau wegen massiver Umweltschäden und Flächenverbrauch", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Kohleabbau wegen Umweltschäden", idx: r(0) }] },
  { aspekt: "Kohle", partei: "SPD",
    lang: [
      { text: "Kohleausstieg; gegen AfD-Kohleverstromung wegen Landschaftszerstörung und Schadstoffen", idx: r(1,3,4) },
      { text: "Würdigung der ostdeutschen Kohlereviere; Milliardenhilfen nicht kürzen", idx: r(0,2) },
    ],
    kurz: [
      { text: "Kohleausstieg; gegen AfD-Kohleverstromung", idx: r(1,3,4) },
      { text: "Würdigung der ostdeutschen Kohlereviere; Hilfen nicht kürzen", idx: r(0,2) },
    ] },

  // ===== Erneuerbare Energien =====
  { aspekt: "Erneuerbare Energien", partei: "AfD",
    lang: [
      { text: "Ablehnung von Wind- und Solarenergie als unzuverlässig, ineffizient und teuer (Dunkelflaute, Systemkosten, negative Strompreise)", idx: r(1,3,6,7,8,16,19,22,26,34,37,41,42,43,44,45,46,47,49,50,51,52,53,54,58,59) },
      { text: "Kritik an Naturzerstörung, Flächenverbrauch und fehlender lokaler Mitsprache", idx: r(2,14,15,17,23,25,57,60,63,64,66) },
      { text: "EEG und Ausbauziele (2 %, 80 %, 100 %) abschaffen; Energiewende als gescheitert und ideologisch", idx: r(0,4,5,9,10,11,12,13,18,20,21,24,27,28,29,30,31,32,33,35,36,38,39,40,48,55,56,61,62,65) },
    ],
    kurz: [
      { text: "Ablehnung von Wind- und Solarenergie als unzuverlässig, ineffizient und teuer; Kritik an Naturzerstörung", idx: r(1,3,6,7,8,16,19,22,26,34,37,41,42,43,44,45,46,47,49,50,51,52,53,54,58,59,2,14,15,17,23,25,57,60,63,64,66) },
      { text: "EEG und Ausbauziele abschaffen; Energiewende als gescheitert", idx: r(0,4,5,9,10,11,12,13,18,20,21,24,27,28,29,30,31,32,33,35,36,38,39,40,48,55,56,61,62,65) },
    ] },
  { aspekt: "Erneuerbare Energien", partei: "CDU/CSU",
    lang: [
      { text: "Ausbau erneuerbarer Energien als zentrale Heimatenergien befürworten; gegen Forderungen nach Rückbau", idx: r(0,3,5,10,12,15,17,23,25,32,33,34,35,37,38,41,42,45,46,47,48,49,50,52,54,55,56) },
      { text: "Beschleunigung und Entbürokratisierung der Genehmigungsverfahren (Wind onshore/offshore)", idx: r(7,9,11,13,27,28,29,39) },
      { text: "Aber Systemkosten beachten: Netzausbau, Speicher und ein technologieoffener Mix statt alleiniger Erneuerbaren", idx: r(1,2,4,6,8,14,16,18,19,20,21,22,24,26,30,31,36,40,43,44,51,53) },
    ],
    kurz: [
      { text: "Ausbau erneuerbarer Energien als Heimatenergien befürworten; Genehmigungen beschleunigen", idx: r(0,3,5,10,12,15,17,23,25,32,33,34,35,37,38,41,42,45,46,47,48,49,50,52,54,55,56,7,9,11,13,27,28,29,39) },
      { text: "Systemkosten beachten: Netzausbau, Speicher und ein technologieoffener Mix", idx: r(1,2,4,6,8,14,16,18,19,20,21,22,24,26,30,31,36,40,43,44,51,53) },
    ] },
  { aspekt: "Erneuerbare Energien", partei: "GRÜNE",
    lang: [
      { text: "Ausbau erneuerbarer Energien als günstige, saubere Zukunftstechnologie für Unabhängigkeit und Klimaschutz", idx: r(1,2,3,4,5,6,7,8,9,13,14,15,16,17,20,21,28,30,31,34,37,38,39,40,42,46,48,49,50,52,53) },
      { text: "Kritik an Bremsmaßnahmen, Förderkürzungen für Solar und Verzögerungen beim Ausbau", idx: r(0,11,22,23,24,25,27,33,41,44,51) },
      { text: "65-Prozent-Regel, Geothermie, naturverträgliche Standortplanung, Speicher und bidirektionales Laden", idx: r(10,12,18,19,26,29,32,35,36,43,45,47) },
    ],
    kurz: [
      { text: "Ausbau erneuerbarer Energien als günstige, saubere Zukunftstechnologie; Kritik an Bremsmaßnahmen", idx: r(1,2,3,4,5,6,7,8,9,13,14,15,16,17,20,21,28,30,31,34,37,38,39,40,42,46,48,49,50,52,53,0,11,22,23,24,25,27,33,41,44,51) },
      { text: "65-Prozent-Regel, Geothermie, naturverträgliche Standortplanung und Speicher", idx: r(10,12,18,19,26,29,32,35,36,43,45,47) },
    ] },
  { aspekt: "Erneuerbare Energien", partei: "LINKE",
    lang: [
      { text: "Ausbau erneuerbarer Energien als günstig, arbeitsplatzschaffend und strompreissenkend; gegen AfD-Abschaffung des EEG", idx: r(0,1,5,6,7,8,11,13,14,15,16,17,18,21,22,24,25,26,27,28,29,30,34,36,37,38) },
      { text: "65-Prozent-Regel verteidigen; gegen Förderkürzungen für Solar; dezentral/genossenschaftlich; Geothermie und Wasserstoff", idx: r(2,3,4,9,10,12,19,20,23,31,32,33,35) },
    ],
    kurz: [
      { text: "Ausbau erneuerbarer Energien als günstig und strompreissenkend; gegen AfD-Abschaffung des EEG", idx: r(0,1,5,6,7,8,11,13,14,15,16,17,18,21,22,24,25,26,27,28,29,30,34,36,37,38) },
      { text: "65-Prozent-Regel verteidigen; dezentral/genossenschaftlich; Geothermie", idx: r(2,3,4,9,10,12,19,20,23,31,32,33,35) },
    ] },
  { aspekt: "Erneuerbare Energien", partei: "SPD",
    lang: [
      { text: "Massiver Ausbau erneuerbarer Energien (80 % bis 2030) als günstige, unabhängige Grundlage der Energieversorgung; gegen Rückbau", idx: r(0,1,3,5,6,8,9,10,11,13,16,18,19,20,21,23,26,27,28,29,30,32,33,34,35,41,43,44) },
      { text: "Offshore-Wind, beschleunigte Genehmigungen (RED III), Speicher, Energy Sharing und Biomasse", idx: r(2,4,7,12,14,15,17,22,24,25,31,36,37,38,39,40,42) },
    ],
    kurz: [
      { text: "Massiver Ausbau erneuerbarer Energien (80 % bis 2030) als günstige, unabhängige Grundlage", idx: r(0,1,3,5,6,8,9,10,11,13,16,18,19,20,21,23,26,27,28,29,30,32,33,34,35,41,43,44) },
      { text: "Offshore-Wind, beschleunigte Genehmigungen (RED III), Speicher und Energy Sharing", idx: r(2,4,7,12,14,15,17,22,24,25,31,36,37,38,39,40,42) },
    ] },

  // ===== Fossiles Gas =====
  { aspekt: "Fossiles Gas", partei: "AfD",
    lang: [
      { text: "Gas, Gaskraftwerke und Gasnetze als günstige, grundlastfähige Energie erhalten; gegen Rückbau der Gasinfrastruktur", idx: r(0,1,3,4,5,6,7,9,11,13,14,16,17,18,19,22,23,26,30,31,32,33) },
      { text: "Russisches Gas und Nord Stream befürworten; gegen Sanktionen und Verzicht auf billiges Gas", idx: r(2,8,10,12,15,20,21,24,25,27,28,29,34) },
    ],
    kurz: [
      { text: "Gas und Gasnetze als günstige, grundlastfähige Energie erhalten; gegen Rückbau", idx: r(0,1,3,4,5,6,7,9,11,13,14,16,17,18,19,22,23,26,30,31,32,33) },
      { text: "Russisches Gas und Nord Stream befürworten; gegen Sanktionen", idx: r(2,8,10,12,15,20,21,24,25,27,28,29,34) },
    ] },
  { aspekt: "Fossiles Gas", partei: "CDU/CSU",
    lang: [
      { text: "Gaskraftwerke als gesicherte Leistung für Versorgungssicherheit (Dunkelflaute); geordneter Übergang der Gasnetze statt pauschaler Stilllegung", idx: r(0,2,4,7,8,10,13,14,15,21,24,25) },
      { text: "Gasspeicherumlage abschaffen/senken; Biomethan und Biogasquote ab 2028", idx: r(1,5,6,9,11,12,19,20,23) },
      { text: "Gegen Nord Stream und russisches Gas; Unabhängigkeit von fossilen Importen", idx: r(3,16,17,18,22,26) },
    ],
    kurz: [
      { text: "Gaskraftwerke als gesicherte Leistung; geordneter Übergang der Gasnetze; Biomethan", idx: r(0,2,4,7,8,10,13,14,15,21,24,25,1,5,6,9,11,12,19,20,23) },
      { text: "Gegen Nord Stream und russisches Gas; Unabhängigkeit von fossilen Importen", idx: r(3,16,17,18,22,26) },
    ] },
  { aspekt: "Fossiles Gas", partei: "GRÜNE",
    lang: [
      { text: "Ausstieg aus fossilem Gas und Beendigung der Abhängigkeit durch Elektrifizierung und Erneuerbare", idx: r(1,2,3,5,6,8,9,10,12,15,16,18,19,20,24,25,27,28,29,32,33,34,35,38,40,41,43,45,46,47) },
      { text: "Gegen russisches Gas und Nord Stream 2", idx: r(11,17,22,44) },
      { text: "Gegen neue Gasheizungen und Grüngasquote als Etikettenschwindel; Übergewinnsteuer; LNG nur als Notmaßnahme", idx: r(0,4,7,13,14,21,23,26,30,31,36,37,39,42) },
    ],
    kurz: [
      { text: "Ausstieg aus fossilem Gas durch Elektrifizierung und Erneuerbare; gegen russisches Gas/Nord Stream 2", idx: r(1,2,3,5,6,8,9,10,12,15,16,18,19,20,24,25,27,28,29,32,33,34,35,38,40,41,43,45,46,47,11,17,22,44) },
      { text: "Gegen neue Gasheizungen und Grüngasquote; Übergewinnsteuer", idx: r(0,4,7,13,14,21,23,26,30,31,36,37,39,42) },
    ] },
  { aspekt: "Fossiles Gas", partei: "LINKE",
    lang: [
      { text: "Ausstieg aus Gas und Gaskraftwerken; gegen Abhängigkeit und Gaslobby (Erneuerbare statt Gaskraftwerken)", idx: r(1,2,3,5,6,7,10,11,13,14,15,16,17,20,21,23,24,25) },
      { text: "Übergewinnsteuer für fossile Konzerne; Kritik am Merit-Order-Prinzip und an Grüngas-Greenwashing", idx: r(0,4,8,9,12,18,19,22) },
    ],
    kurz: [
      { text: "Ausstieg aus Gas und Gaskraftwerken; gegen Abhängigkeit und Gaslobby", idx: r(1,2,3,5,6,7,10,11,13,14,15,16,17,20,21,23,24,25) },
      { text: "Übergewinnsteuer für fossile Konzerne; Kritik am Merit-Order-Prinzip", idx: r(0,4,8,9,12,18,19,22) },
    ] },
  { aspekt: "Fossiles Gas", partei: "SPD",
    lang: [
      { text: "Ausstieg/Reduktion durch Erneuerbare und grüne Moleküle; geordnete Transformation der Gasnetze (Umwidmung zu Wasserstoff)", idx: r(1,2,3,5,7,8,9,10,12,13) },
      { text: "Gasspeicherumlage abschaffen zur Preissenkung; Gaskraftwerke als Übergangslösung", idx: r(0,4,6,11) },
    ],
    kurz: [
      { text: "Ausstieg durch Erneuerbare und grüne Moleküle; geordnete Transformation der Gasnetze", idx: r(1,2,3,5,7,8,9,10,12,13) },
      { text: "Gasspeicherumlage abschaffen; Gaskraftwerke als Übergangslösung", idx: r(0,4,6,11) },
    ] },

  // ===== Strompreise / Netzentgelte =====
  { aspekt: "Strompreise / Netzentgelte", partei: "AfD",
    lang: [
      { text: "Kritik an hohen Strompreisen als Folge der Energiewende — wirtschaftsschädlich und Treiber der Deindustrialisierung", idx: r(0,1,3,5,6,7,8,9,10,11,12,13,15,18,19,20,21,22,24,25,26,27,30,32,33,34,35,36,38,39,41,43,44,45,48,49,50,51,53,54,55,56,57,59,61,62,63,66,67,68,69,71,73,74,75,76,77,78) },
      { text: "Stromsteuer und Energiesteuer auf das EU-Mindestmaß senken bzw. abschaffen", idx: r(2,4,14,16,17,28,29,31,37,40,42,46,47,52,58,60,64,65,70) },
      { text: "Kernkraft würde die Strompreise senken", idx: r(23,72) },
    ],
    kurz: [
      { text: "Kritik an hohen Strompreisen als Folge der Energiewende; Stromsteuer auf das EU-Mindestmaß senken", idx: r(0,1,3,5,6,7,8,9,10,11,12,13,15,18,19,20,21,22,24,25,26,27,30,32,33,34,35,36,38,39,41,43,44,45,48,49,50,51,53,54,55,56,57,59,61,62,63,66,67,68,69,71,73,74,75,76,77,78,2,4,14,16,17,28,29,31,37,40,42,46,47,52,58,60,64,65,70) },
      { text: "Kernkraft würde die Strompreise senken", idx: r(23,72) },
    ] },
  { aspekt: "Strompreise / Netzentgelte", partei: "CDU/CSU",
    lang: [
      { text: "Entlastung durch Senkung der Stromsteuer (EU-Mindestmaß) und der Netzentgelte; Industriestrompreis", idx: r(0,1,6,7,8,12,14,15,17,18,24,26,27,28,29,30,31,32,33,34,35,36,37,38,39) },
      { text: "Gegen pauschale Senkung ohne Gegenfinanzierung; marktwirtschaftliche Lösung; Erneuerbare senken Preise nicht automatisch", idx: r(2,3,4,5,9,10,11,13,16,19,21,25) },
      { text: "Kernkraft senkt Preise nicht dauerhaft; Netzentgelt-Probleme durch Flexibilität und Netzausbau lösen", idx: r(20,22,23) },
    ],
    kurz: [
      { text: "Entlastung durch Senkung der Stromsteuer (EU-Mindestmaß) und der Netzentgelte; Industriestrompreis", idx: r(0,1,6,7,8,12,14,15,17,18,24,26,27,28,29,30,31,32,33,34,35,36,37,38,39) },
      { text: "Gegen pauschale Senkung ohne Gegenfinanzierung; Netzentgelt-Probleme durch Netzausbau lösen", idx: r(2,3,4,5,9,10,11,13,16,19,21,25,20,22,23) },
    ] },
  { aspekt: "Strompreise / Netzentgelte", partei: "GRÜNE",
    lang: [
      { text: "Stromsteuer für alle (Haushalte und Unternehmen) senken statt Tankrabatt", idx: r(2,4,5,6,7,11,13,15,16,20,21,23,24,29) },
      { text: "Netzentgelt-Entlastung zu kurz und regional ungleich; langfristige Lösung gefordert", idx: r(1,3,8,10,12,14,19,22,26,27) },
      { text: "Erneuerbare stabilisieren die Preise; gegen Atomkraft als preistreibend", idx: r(0,9,17,18,25,28) },
    ],
    kurz: [
      { text: "Stromsteuer für alle senken statt Tankrabatt; langfristige Netzentgelt-Lösung", idx: r(2,4,5,6,7,11,13,15,16,20,21,23,24,29,1,3,8,10,12,14,19,22,26,27) },
      { text: "Erneuerbare stabilisieren die Preise; gegen Atomkraft als preistreibend", idx: r(0,9,17,18,25,28) },
    ] },
  { aspekt: "Strompreise / Netzentgelte", partei: "LINKE",
    lang: [
      { text: "Stromsteuersenkung für alle, Klimageld und Energiepreisbremse; Preisaufsicht und Übergewinnsteuer gegen Preistreiberei", idx: r(0,1,3,4,7,10,14,16,18,19,21) },
      { text: "Netze in öffentliche Hand gegen Monopolrenditen; Reform der Strombörse (Grenzpreisprinzip)", idx: r(2,6,8,9,12,15,22,23,24) },
      { text: "Erneuerbare senken und stabilisieren die Preise", idx: r(5,11,13,17,20) },
    ],
    kurz: [
      { text: "Stromsteuersenkung für alle, Klimageld und Energiepreisbremse; Preisaufsicht", idx: r(0,1,3,4,7,10,14,16,18,19,21) },
      { text: "Netze in öffentliche Hand; Reform der Strombörse; Erneuerbare senken die Preise", idx: r(2,6,8,9,12,15,22,23,24,5,11,13,17,20) },
    ] },
  { aspekt: "Strompreise / Netzentgelte", partei: "SPD",
    lang: [
      { text: "Entlastung durch Senkung der Stromsteuer (EU-Minimum), der Netzentgelte und einen Industriestrompreis", idx: r(0,1,5,7,8,11,13,19) },
      { text: "Erneuerbare und Speicher als Garantie für günstige, stabile Preise; gegen Atomkraft und nationale Autarkie", idx: r(2,3,6,10,12,15,17) },
      { text: "Netzentgeltbefreiung/Strompreiskompensation für Wasserstoff; Energy Sharing; Tankrabatt", idx: r(4,9,14,16,18) },
    ],
    kurz: [
      { text: "Entlastung durch Stromsteuer- und Netzentgeltsenkung sowie Industriestrompreis", idx: r(0,1,5,7,8,11,13,19) },
      { text: "Erneuerbare und Speicher als Garantie für günstige, stabile Preise; gegen Atomkraft", idx: r(2,3,6,10,12,15,17,4,9,14,16,18) },
    ] },

  // ===== Strom-/Gassperren =====
  { aspekt: "Strom-/Gassperren", partei: "AfD",
    lang: [{ text: "Warnung vor Smart Metern als Instrument zur Stromabschaltung bei Dunkelflaute", idx: r(0) }],
    kurz: [{ text: "Warnung vor Smart Metern als Abschaltinstrument", idx: r(0) }] },

  // ===== CO₂-Preis / Klimageld =====
  { aspekt: "CO₂-Preis / Klimageld", partei: "AfD",
    lang: [
      { text: "Abschaffung der CO₂-Steuer/-Bepreisung als wirtschaftsschädlich, unsozial und ineffektiv", idx: r(0,1,2,3,4,5,7,8,9,10,11,13,14,15,16,17,18,21,23,24,26,27,28,30,31,34,35,36,37,38,39,41,42,43,44,45,46,47,48,49,50,51,52,53,54) },
      { text: "Ablehnung des Emissionshandels/Zertifikatehandels und der CO₂-Speicherung (CCS) als versteckte Steuer und Planwirtschaft", idx: r(6,12,19,20,22,25,29,32,33,40) },
    ],
    kurz: [
      { text: "Abschaffung der CO₂-Steuer als wirtschaftsschädlich und unsozial", idx: r(0,1,2,3,4,5,7,8,9,10,11,13,14,15,16,17,18,21,23,24,26,27,28,30,31,34,35,36,37,38,39,41,42,43,44,45,46,47,48,49,50,51,52,53,54) },
      { text: "Ablehnung des Emissionshandels und der CO₂-Speicherung (CCS)", idx: r(6,12,19,20,22,25,29,32,33,40) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "CDU/CSU",
    lang: [
      { text: "CO₂-Preis/Emissionshandel (ETS) als zentrales marktwirtschaftliches Klimaschutzinstrument; gegen Abschaffung, mit sozialem Ausgleich und Rückgabe der Einnahmen", idx: r(4,5,7,8,9,11,12,13,15,16,17) },
      { text: "CCS-Technologien ermöglichen; Biogasquote; pragmatische Klimapolitik und Weiterbetrieb der Kernkraft", idx: r(0,1,2,3,6,10,14) },
    ],
    kurz: [
      { text: "CO₂-Preis/ETS als zentrales marktwirtschaftliches Instrument; gegen Abschaffung, mit sozialem Ausgleich", idx: r(4,5,7,8,9,11,12,13,15,16,17) },
      { text: "CCS-Technologien ermöglichen; Biogasquote; pragmatische Klimapolitik", idx: r(0,1,2,3,6,10,14) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "GRÜNE",
    lang: [
      { text: "CO₂-Preis und Emissionshandel als Lenkungsinstrument verteidigen; gegen Abschwächung und Streichung", idx: r(0,2,3,4,6,7,8,10) },
      { text: "Klimageld/Direktzahlung als sozialer Ausgleich; Verursacherprinzip und ambitioniertere Klimaziele", idx: r(9,11,12,13,1,5) },
    ],
    kurz: [
      { text: "CO₂-Preis und Emissionshandel als Lenkungsinstrument verteidigen", idx: r(0,2,3,4,6,7,8,10) },
      { text: "Klimageld als sozialer Ausgleich; Verursacherprinzip", idx: r(9,11,12,13,1,5) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "LINKE",
    lang: [
      { text: "CO₂-Bepreisung mit sozialer Kompensation durch Klimageld/Energiekrisengeld; Kritik an fehlender Umsetzung", idx: r(1,2,3,5,7,8,9,10,4) },
      { text: "Kritik an CCS als Scheinlösung und an CO₂-Lasten für Mieter; natürliche CO₂-Speicherung", idx: r(0,6,11) },
    ],
    kurz: [
      { text: "CO₂-Bepreisung mit sozialer Kompensation durch Klimageld; Kritik an fehlender Umsetzung", idx: r(1,2,3,5,7,8,9,10,4) },
      { text: "Kritik an CCS als Scheinlösung und an CO₂-Lasten für Mieter", idx: r(0,6,11) },
    ] },
  { aspekt: "CO₂-Preis / Klimageld", partei: "SPD",
    lang: [
      { text: "CO₂-Bepreisung und Emissionshandel verteidigen (gegen AfD-Abschaffung), mit sozial gestaffelter Rückzahlung/Klimageld", idx: r(1,2,4,5,7,8,9) },
      { text: "CCS für schwer dekarbonisierbare Industrien; Entkopplung von Wachstum und Emissionen; 65-Prozent-Regel", idx: r(0,3,6,10) },
    ],
    kurz: [
      { text: "CO₂-Bepreisung und Emissionshandel verteidigen, mit sozial gestaffeltem Ausgleich/Klimageld", idx: r(1,2,4,5,7,8,9) },
      { text: "CCS für schwer dekarbonisierbare Industrien; Entkopplung von Wachstum und Emissionen", idx: r(0,3,6,10) },
    ] },

  // ===== Heizen / Wärme =====
  { aspekt: "Heizen / Wärme", partei: "AfD",
    lang: [
      { text: "Heizungsgesetz/Gebäudeenergiegesetz ablehnen und abschaffen; Technologieoffenheit und Wahlfreiheit statt Heizungszwang", idx: r(3,4,6,7,10,11,14,15,16,17,20,21,22,24,25,28,30,31,32,33) },
      { text: "Kritik an hohen Heizkosten; Wärmepumpen und Geothermie als unwirtschaftlich/riskant; fossile Heizungen verteidigen", idx: r(0,1,2,5,8,9,12,13,18,19,23,26,27,29,34) },
    ],
    kurz: [
      { text: "Heizungsgesetz ablehnen und abschaffen; Wahlfreiheit statt Heizungszwang", idx: r(3,4,6,7,10,11,14,15,16,17,20,21,22,24,25,28,30,31,32,33) },
      { text: "Kritik an hohen Heizkosten; Wärmepumpen unwirtschaftlich; fossile Heizungen verteidigen", idx: r(0,1,2,5,8,9,12,13,18,19,23,26,27,29,34) },
    ] },
  { aspekt: "Heizen / Wärme", partei: "CDU/CSU",
    lang: [
      { text: "Heizungsgesetz der Ampel als ideologisch kritisieren und technologieoffen ersetzen; Wahlfreiheit ohne Zwang, mit Förderung", idx: r(1,2,3,4,5,6,7,10,14,15,16,19,20,22,23,24,26) },
      { text: "Wärmepumpe, Geothermie und kommunale Wärmeplanung fördern", idx: r(0,8,9,11,12,13,17,18,21,25,27) },
    ],
    kurz: [
      { text: "Heizungsgesetz technologieoffen ersetzen; Wahlfreiheit ohne Zwang, mit Förderung", idx: r(1,2,3,4,5,6,7,10,14,15,16,19,20,22,23,24,26) },
      { text: "Wärmepumpe, Geothermie und kommunale Wärmeplanung fördern", idx: r(0,8,9,11,12,13,17,18,21,25,27) },
    ] },
  { aspekt: "Heizen / Wärme", partei: "GRÜNE",
    lang: [
      { text: "Wärmepumpen und erneuerbares Heizen befürworten; gegen Gasheizungen und fossile Abhängigkeit", idx: r(0,1,2,5,7,8,9,12,14,18,19,25) },
      { text: "Gegen die Abschaffung des Heizungsgesetzes/der 65-Prozent-Regel; Kritik an Rückabwicklung der Wärmewende", idx: r(4,6,10,11,13,15,16,20,21,23,24) },
      { text: "Geothermie und Wärmenetze ausbauen (mit Wasserschutz)", idx: r(3,17,22) },
    ],
    kurz: [
      { text: "Wärmepumpen und erneuerbares Heizen befürworten; gegen die Abschaffung des Heizungsgesetzes", idx: r(0,1,2,5,7,8,9,12,14,18,19,25,4,6,10,11,13,15,16,20,21,23,24) },
      { text: "Geothermie und Wärmenetze ausbauen", idx: r(3,17,22) },
    ] },
  { aspekt: "Heizen / Wärme", partei: "LINKE",
    lang: [
      { text: "Wärmewende und Wärmepumpen befürworten, mit sozial gestaffelter Förderung und Mieterschutz", idx: r(0,1,4,5,6,7,11,12,13,18,19,20) },
      { text: "Gegen die Abschaffung des Heizungsgesetzes; Heizkostendeckel und Bekämpfung von Energiearmut", idx: r(2,3,8,9,10,14,15,16,17,21) },
    ],
    kurz: [
      { text: "Wärmewende und Wärmepumpen mit sozial gestaffelter Förderung und Mieterschutz", idx: r(0,1,4,5,6,7,11,12,13,18,19,20) },
      { text: "Gegen die Abschaffung des Heizungsgesetzes; Heizkostendeckel gegen Energiearmut", idx: r(2,3,8,9,10,14,15,16,17,21) },
    ] },
  { aspekt: "Heizen / Wärme", partei: "SPD",
    lang: [
      { text: "Wärmewende und Wärmepumpen befürworten, technologieoffen und sozial gestaffelt (Mieterschutz)", idx: r(1,2,3,4,5,6,9,10,12,13,15,17) },
      { text: "Geothermie, Wärmenetze und kommunale Wärmeplanung; Schutz vor überhöhten Nebenkosten", idx: r(0,7,8,11,14,16) },
    ],
    kurz: [
      { text: "Wärmewende und Wärmepumpen, technologieoffen und sozial gestaffelt", idx: r(1,2,3,4,5,6,9,10,12,13,15,17) },
      { text: "Geothermie, Wärmenetze und kommunale Wärmeplanung", idx: r(0,7,8,11,14,16) },
    ] },

  // ===== Wasserstoff =====
  { aspekt: "Wasserstoff", partei: "AfD",
    lang: [{ text: "Wasserstoff als unwirtschaftlich, nicht wettbewerbsfähig und planwirtschaftlich ablehnen; Subventionen beenden", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14) }],
    kurz: [{ text: "Wasserstoff als unwirtschaftlich ablehnen; Subventionen beenden", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14) }] },
  { aspekt: "Wasserstoff", partei: "CDU/CSU",
    lang: [
      { text: "Wasserstoff als zentrale Zukunftstechnologie für die Industrie; Beschleunigungsgesetz und technologieoffene Strategie (grün/blau)", idx: r(0,1,2,4,5,6,7,8,9,10,11,13,18,19,21,22,23,24,25) },
      { text: "Biomethan, Energiespeicher und Wasserstoffbeimischung in Gaskraftwerken", idx: r(3,12,14,15,16,17,20) },
    ],
    kurz: [
      { text: "Wasserstoff als zentrale Zukunftstechnologie; Beschleunigungsgesetz und technologieoffene Strategie", idx: r(0,1,2,4,5,6,7,8,9,10,11,13,18,19,21,22,23,24,25) },
      { text: "Biomethan, Energiespeicher und Wasserstoffbeimischung in Gaskraftwerken", idx: r(3,12,14,15,16,17,20) },
    ] },
  { aspekt: "Wasserstoff", partei: "GRÜNE",
    lang: [
      { text: "Grüner Wasserstoff für die energieintensive Industrie (Chemie, Stahl), nicht für Heizungen; rascher Hochlauf", idx: r(0,1,2,3,5,7,8,9,10,12,16) },
      { text: "Gegen Wasserstoff-Verteilnetze für Haushalte und gegen blauen Wasserstoff/CCS aus Erdgas", idx: r(4,6,11,13,14,15,17) },
    ],
    kurz: [
      { text: "Grüner Wasserstoff für die Industrie, nicht für Heizungen; rascher Hochlauf", idx: r(0,1,2,3,5,7,8,9,10,12,16) },
      { text: "Gegen Wasserstoff-Verteilnetze für Haushalte und gegen blauen Wasserstoff/CCS", idx: r(4,6,11,13,14,15,17) },
    ] },
  { aspekt: "Wasserstoff", partei: "LINKE",
    lang: [
      { text: "Grüner Wasserstoff für spezifische Industrieprozesse (Stahl, Chemie); schneller Umstieg, aber Strategie-Neustart und Anpassung des Kernnetzes", idx: r(1,3,4,5,6,7,8) },
      { text: "Skepsis gegenüber Wasserstoff als teurer Heizlösung", idx: r(0,2) },
    ],
    kurz: [
      { text: "Grüner Wasserstoff für die Industrie; Strategie-Neustart und Anpassung des Kernnetzes", idx: r(1,3,4,5,6,7,8) },
      { text: "Skepsis gegenüber Wasserstoff als Heizlösung", idx: r(0,2) },
    ] },
  { aspekt: "Wasserstoff", partei: "SPD",
    lang: [
      { text: "Wasserstoffkernnetz und grüner Wasserstoff für die Industrie als Baustein der Energiewende (Umwidmung von Gasnetzen, Strompreiskompensation)", idx: r(0,1,2,4,5,7,8,9,10) },
      { text: "Flexibilisierung statt Einzeltechnologie-Fokus; verzögerte Privilegierung von Wasserstoffspeichern", idx: r(3,6) },
    ],
    kurz: [
      { text: "Wasserstoffkernnetz und grüner Wasserstoff für die Industrie (Umwidmung von Gasnetzen)", idx: r(0,1,2,4,5,7,8,9,10) },
      { text: "Flexibilisierung statt Einzeltechnologie-Fokus", idx: r(3,6) },
    ] },

  // ===== Öffentliches Eigentum an Energie =====
  { aspekt: "Öffentliches Eigentum an Energie", partei: "AfD",
    lang: [{ text: "Kritische Energieinfrastruktur in öffentlicher/deutscher Hand halten (gegen Verschenken des Gaskraftwerks); aber gegen Dauersubventionen an Übertragungsnetzbetreiber", idx: r(0,1,2,3) }],
    kurz: [{ text: "Kritische Energieinfrastruktur in öffentlicher/deutscher Hand halten", idx: r(0,1,2,3) }] },
  { aspekt: "Öffentliches Eigentum an Energie", partei: "CDU/CSU",
    lang: [{ text: "Ablehnung von Staatsbeteiligung an Energienetzen; bessere Regulatorik statt mehr Staat", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Staatsbeteiligung an Energienetzen; bessere Regulatorik", idx: r(0) }] },
  { aspekt: "Öffentliches Eigentum an Energie", partei: "LINKE",
    lang: [{ text: "Verstaatlichung bzw. öffentliches Eigentum an Netzen und Energieversorgung (Daseinsvorsorge); Stärkung von Stadtwerken, Genossenschaften und Bürgerbeteiligung gegen Konzernrenditen", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12) }],
    kurz: [{ text: "Öffentliches Eigentum an Netzen und Energieversorgung; Stadtwerke und Genossenschaften stärken", idx: r(0,1,2,3,4,5,6,7,8,9,10,11,12) }] },
  { aspekt: "Öffentliches Eigentum an Energie", partei: "SPD",
    lang: [{ text: "Bürgerenergiegemeinschaften und kommunale Kleinstunternehmen durch Erleichterungen unterstützen", idx: r(0) }],
    kurz: [{ text: "Bürgerenergiegemeinschaften und kommunale Kleinstunternehmen unterstützen", idx: r(0) }] },
];

applySynthese("Energie", CELLS);
