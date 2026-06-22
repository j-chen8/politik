/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Entwicklungspolitik" (30 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Grundausrichtung =====
  { aspekt: "Grundausrichtung", partei: "AfD",
    lang: [
      { text: "Gegen das hohe Volumen und die Umverteilungslogik; nationale Prioritäten zuerst, gegen Erhöhung der ODA-Quote (verfestigt Abhängigkeit statt Armut zu bekämpfen)", idx: r(0,2,4,8,9,3) },
      { text: "Gegen ideologische Ausrichtung (Agrarökologie, Gender, LGBTIQ, Abtreibung); pragmatische Langzeitpolitik", idx: r(1,5,7,6) },
    ],
    kurz: [
      { text: "Gegen das hohe Volumen und die Umverteilungslogik; nationale Prioritäten zuerst", idx: r(0,2,4,8,9,3) },
      { text: "Gegen ideologische Ausrichtung (Gender, LGBTIQ); pragmatische Langzeitpolitik", idx: r(1,5,7,6) },
    ] },
  { aspekt: "Grundausrichtung", partei: "CDU/CSU",
    lang: [
      { text: "Pragmatischer Fokus auf Hungerbekämpfung und Effektivität statt Nebenziele; Technologieoffenheit", idx: r(0,1) },
      { text: "Entwicklungszusammenarbeit im deutschen und EU-Sicherheits- und Wirtschaftsinteresse, marktwirtschaftlich-liberal; Verantwortung aus christlichen Werten statt Abschottung", idx: r(2,4,5,6,3) },
    ],
    kurz: [
      { text: "Pragmatischer Fokus auf Hungerbekämpfung und Effektivität statt Nebenziele", idx: r(0,1) },
      { text: "Entwicklungszusammenarbeit im Sicherheits- und Wirtschaftsinteresse, marktwirtschaftlich; gegen Abschottung", idx: r(2,4,5,6,3) },
    ] },
  { aspekt: "Grundausrichtung", partei: "GRÜNE",
    lang: [
      { text: "Internationale Verantwortung und humanitäre Versprechen einhalten; soziale Entwicklung mit ökologischer Nachhaltigkeit und globaler Gerechtigkeit verbinden", idx: r(1,5,2) },
      { text: "Hungerbekämpfung und Ernährungssouveränität durch kleinbäuerliche Strukturen; faire Handelspolitik mit Afrika statt Abschottung", idx: r(0,4,3) },
    ],
    kurz: [
      { text: "Internationale Verantwortung einhalten; soziale und ökologische Nachhaltigkeit und globale Gerechtigkeit", idx: r(1,5,2) },
      { text: "Ernährungssouveränität durch kleinbäuerliche Strukturen; faire Handelspolitik mit Afrika", idx: r(0,4,3) },
    ] },
  { aspekt: "Grundausrichtung", partei: "LINKE",
    lang: [{ text: "Neuausrichtung auf Agrarökologie, lokale Strukturen und Ernährungssouveränität statt exportabhängiger Systeme", idx: r(0) }],
    kurz: [{ text: "Agrarökologie, lokale Strukturen und Ernährungssouveränität statt Exportabhängigkeit", idx: r(0) }] },
  { aspekt: "Grundausrichtung", partei: "SPD",
    lang: [{ text: "Frauen- und Identitätsrechte global verteidigen; Entwicklungszusammenarbeit und humanitäre Hilfe als Instrumente für Gerechtigkeit und Sicherheit", idx: r(0,1) }],
    kurz: [{ text: "Frauenrechte global verteidigen; Entwicklungszusammenarbeit für Gerechtigkeit und Sicherheit", idx: r(0,1) }] },

  // ===== Mittelhöhe / Finanzierung =====
  { aspekt: "Mittelhöhe / Finanzierung", partei: "AfD",
    lang: [
      { text: "Ablehnung von Erhöhungen des BMZ-Haushalts; Reduktion gefordert, inländische Investitionen vorziehen", idx: r(0,1,2,4,5,7,8,9) },
      { text: "Gegen die Finanzierung von Abtreibungsorganisationen; Kritik an Kürzung der humanitären Hilfe durch die Grünen", idx: r(6,3) },
    ],
    kurz: [
      { text: "Ablehnung von Erhöhungen des BMZ-Haushalts; Reduktion und inländische Investitionen", idx: r(0,1,2,4,5,7,8,9) },
      { text: "Gegen die Finanzierung von Abtreibungsorganisationen", idx: r(6,3) },
    ] },
  { aspekt: "Mittelhöhe / Finanzierung", partei: "CDU/CSU",
    lang: [{ text: "Aktuelles Budget (2 Mrd. €) verteidigen und Effizienz statt mehr Geld; Deutschland als größter Geber; gegen Anwachs des EU-Haushaltsrahmens", idx: r(0,1,2,3) }],
    kurz: [{ text: "Aktuelles Budget verteidigen, Effizienz statt mehr Geld; Deutschland als größter Geber", idx: r(0,1,2,3) }] },
  { aspekt: "Mittelhöhe / Finanzierung", partei: "GRÜNE",
    lang: [{ text: "Gegen Kürzungen bei Entwicklungs- und humanitärer Hilfe (Welternährungsprogramm); ODA-Quote auf 0,7 % erhöhen", idx: r(0,1,2,3) }],
    kurz: [{ text: "Gegen Kürzungen bei Entwicklungs- und humanitärer Hilfe; ODA-Quote auf 0,7 % erhöhen", idx: r(0,1,2,3) }] },
  { aspekt: "Mittelhöhe / Finanzierung", partei: "LINKE",
    lang: [{ text: "Einhaltung der 0,7-Prozent-ODA-Quote; Kritik an Kürzungen bei Entwicklungszusammenarbeit und humanitärer Hilfe", idx: r(0,1,2) }],
    kurz: [{ text: "0,7-Prozent-ODA-Quote einhalten; gegen Kürzungen", idx: r(0,1,2) }] },
  { aspekt: "Mittelhöhe / Finanzierung", partei: "SPD",
    lang: [{ text: "Hinweis auf fehlende Mittel für UN-Entwicklungsziele; Kritik an der Haushaltspolitik", idx: r(0) }],
    kurz: [{ text: "Fehlende Mittel für UN-Entwicklungsziele; Kritik an der Haushaltspolitik", idx: r(0) }] },

  // ===== Humanitäre Hilfe / Struktur =====
  { aspekt: "Humanitäre Hilfe / Struktur", partei: "AfD",
    lang: [
      { text: "Schnelle, unbürokratische Nothilfe über verlässliche Partner (Rotes Kreuz, UN) in stabilen Nachbarstaaten statt symbolischer Alleingänge", idx: r(0,4) },
      { text: "Kritik an Kürzungen bei gleichbleibenden Waffenlieferungen, an ungleicher Aufmerksamkeit (Sudan/Gaza) und an Hilfe für bestimmte Länder/Organisationen", idx: r(2,1,3) },
    ],
    kurz: [
      { text: "Schnelle, unbürokratische Nothilfe über verlässliche Partner statt Alleingänge", idx: r(0,4) },
      { text: "Kritik an Kürzungen bei gleichbleibenden Waffenlieferungen und ungleicher Aufmerksamkeit", idx: r(2,1,3) },
    ] },
  { aspekt: "Humanitäre Hilfe / Struktur", partei: "CDU/CSU",
    lang: [{ text: "Humanitäre Hilfe (1 Mrd. € jährlich) als Ausdruck des Menschenbildes mit Prävention und direkter Mittelvergabe; multilaterale Institutionen; UNFPA und Sudan-Hilfe", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Humanitäre Hilfe (1 Mrd. €) mit Prävention und direkter Mittelvergabe; multilaterale Institutionen", idx: r(0,1,2,3,4) }] },
  { aspekt: "Humanitäre Hilfe / Struktur", partei: "GRÜNE",
    lang: [{ text: "Globaler Fonds für soziale Sicherung; gegen Kürzungen (UN-Reformprozess, WFP-Transportprobleme); Verantwortung als drittgrößte Volkswirtschaft", idx: r(0,1,2) }],
    kurz: [{ text: "Globaler Fonds für soziale Sicherung; gegen Kürzungen; Verantwortung als große Volkswirtschaft", idx: r(0,1,2) }] },
  { aspekt: "Humanitäre Hilfe / Struktur", partei: "LINKE",
    lang: [{ text: "Bedingungslose humanitäre Hilfe mit ausreichendem Budget, orientiert allein an Bedürftigkeit", idx: r(0) }],
    kurz: [{ text: "Bedingungslose humanitäre Hilfe orientiert an Bedürftigkeit", idx: r(0) }] },
  { aspekt: "Humanitäre Hilfe / Struktur", partei: "SPD",
    lang: [{ text: "UN-koordinierte, transparente und rechenschaftspflichtige humanitäre Hilfe ohne Sicherheits- oder Wirtschaftslogik; gegen Sparmaßnahmen, deutliche Erhöhung gefordert", idx: r(0,1,2) }],
    kurz: [{ text: "UN-koordinierte, transparente humanitäre Hilfe; gegen Sparmaßnahmen", idx: r(0,1,2) }] },

  // ===== Konditionierung der Hilfe =====
  { aspekt: "Konditionierung der Hilfe", partei: "AfD",
    lang: [{ text: "Gegen die Kopplung von Hilfe und Handelsabkommen an UN-Agenda, Standards und Lieferketten als paternalistisch; gegen ideologische Bindung (Gender, Abtreibung); Souveränität ohne Vorschriften, aber Kontrolle und Transparenz", idx: r(0,2,3,5,4,6,1) }],
    kurz: [{ text: "Gegen Kopplung an UN-Agenda und Standards als paternalistisch; gegen ideologische Bindung; mehr Kontrolle", idx: r(0,2,3,5,4,6,1) }] },
  { aspekt: "Konditionierung der Hilfe", partei: "CDU/CSU",
    lang: [{ text: "Abgestimmtes EU-Vorgehen statt nationaler Alleingänge; Mittel müssen direkt bei den Menschen ankommen; migrationspolitische Konditionalitäten im Global-Europe-Instrument", idx: r(0,1,2) }],
    kurz: [{ text: "Abgestimmtes EU-Vorgehen; Mittel müssen direkt ankommen; migrationspolitische Konditionalitäten", idx: r(0,1,2) }] },
  { aspekt: "Konditionierung der Hilfe", partei: "LINKE",
    lang: [{ text: "Gegen erzwungene Marktöffnung und radikalen Zollabbau als neokolonialistisch", idx: r(0) }],
    kurz: [{ text: "Gegen erzwungene Marktöffnung und Zollabbau als neokolonialistisch", idx: r(0) }] },

  // ===== Fokus Frauen / Gleichstellung =====
  { aspekt: "Fokus Frauen / Gleichstellung", partei: "AfD",
    lang: [{ text: "Gegen gendersensible Entwicklungszusammenarbeit als ineffektiv und Verschwendung; gegen den Aufbau einer globalen Care- und Genderökonomie", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen gendersensible Entwicklungszusammenarbeit als Verschwendung", idx: r(0,1,2) }] },
  { aspekt: "Fokus Frauen / Gleichstellung", partei: "CDU/CSU",
    lang: [{ text: "Feministische Entwicklungszusammenarbeit als ein Ziel unter mehreren (Kritik an Einzelzielorientierung); Schutz von Frauen und Mädchen vor Gewalt, Kinderehen und Genitalverstümmelung", idx: r(0,1,2) }],
    kurz: [{ text: "Feministische EZ als ein Ziel unter mehreren; Schutz von Frauen vor Gewalt und FGM", idx: r(0,1,2) }] },
  { aspekt: "Fokus Frauen / Gleichstellung", partei: "GRÜNE",
    lang: [{ text: "Feministische Entwicklungspolitik wegen besonderer Betroffenheit von Frauen durch Armut und Hunger", idx: r(0,1) }],
    kurz: [{ text: "Feministische Entwicklungspolitik wegen besonderer Betroffenheit von Frauen", idx: r(0,1) }] },
  { aspekt: "Fokus Frauen / Gleichstellung", partei: "SPD",
    lang: [{ text: "Reproduktive Rechte als Menschenrecht verteidigen; Thematisierung sexueller Gewalt gegen Frauen als Kriegsstrategie (Sudan)", idx: r(0,1) }],
    kurz: [{ text: "Reproduktive Rechte als Menschenrecht; gegen sexuelle Gewalt als Kriegsstrategie", idx: r(0,1) }] },

  // ===== Handel / Lieferketten =====
  { aspekt: "Handel / Lieferketten", partei: "AfD",
    lang: [{ text: "Gegen die Konditionierung von Handelsabkommen durch westliche Standards als neokolonial; gegen Lieferkettenbedingungen", idx: r(0,1) }],
    kurz: [{ text: "Gegen Konditionierung von Handelsabkommen durch westliche Standards; gegen Lieferkettenbedingungen", idx: r(0,1) }] },
  { aspekt: "Handel / Lieferketten", partei: "CDU/CSU",
    lang: [{ text: "Privatsektor und Investitionen stärken (Global Gateway); liberale Handelsordnung gegen Protektionismus, offene und faire Märkte", idx: r(0,1) }],
    kurz: [{ text: "Privatsektor stärken (Global Gateway); liberale Handelsordnung gegen Protektionismus", idx: r(0,1) }] },
  { aspekt: "Handel / Lieferketten", partei: "GRÜNE",
    lang: [{ text: "Wirtschaftspartnerschaftsabkommen mit verbindlichen sozialen, ökologischen und menschenrechtlichen Standards sowie Lieferkettenvorgaben modernisieren", idx: r(0) }],
    kurz: [{ text: "Wirtschaftspartnerschaften mit verbindlichen Standards und Lieferkettenvorgaben", idx: r(0) }] },
  { aspekt: "Handel / Lieferketten", partei: "LINKE",
    lang: [{ text: "Gegen Billigimporte und unfairen Handel/Konzernkontrolle der Lieferketten; Lieferkettengesetz verschärfen und lokale Strukturen stärken", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen Billigimporte und unfairen Handel; Lieferkettengesetz verschärfen, lokale Strukturen stärken", idx: r(0,1,2) }] },

  // ===== Schuldenerlass / globale Steuer =====
  { aspekt: "Schuldenerlass / globale Steuer", partei: "AfD",
    lang: [{ text: "Ablehnung von Schuldenerlassen und einer globalen Superreichen-/Milliardärssteuer; Warnung vor Kapitalflucht und Investitionsrückgang", idx: r(0,1) }],
    kurz: [{ text: "Ablehnung von Schuldenerlassen und globaler Superreichensteuer; Warnung vor Kapitalflucht", idx: r(0,1) }] },
  { aspekt: "Schuldenerlass / globale Steuer", partei: "GRÜNE",
    lang: [{ text: "Schuldenerlass, faire Kreditbedingungen und globale Steuergerechtigkeit (Vermögen- und Transaktionssteuern)", idx: r(0,1) }],
    kurz: [{ text: "Schuldenerlass, faire Kreditbedingungen und globale Steuergerechtigkeit", idx: r(0,1) }] },
  { aspekt: "Schuldenerlass / globale Steuer", partei: "LINKE",
    lang: [{ text: "Schuldenschnitt für hoch verschuldete Länder und Einführung einer globalen Superreichensteuer", idx: r(0) }],
    kurz: [{ text: "Schuldenschnitt und globale Superreichensteuer", idx: r(0) }] },
  { aspekt: "Schuldenerlass / globale Steuer", partei: "SPD",
    lang: [{ text: "Globale Steuermechanismen gegen Steuervermeidung und eine globale Steuer auf das Vermögen der Reichsten für mehr Gerechtigkeit (multilateral)", idx: r(0,1) }],
    kurz: [{ text: "Globale Steuermechanismen und eine Vermögenssteuer der Reichsten für mehr Gerechtigkeit", idx: r(0,1) }] },
];

applySynthese("Entwicklungspolitik", CELLS);
