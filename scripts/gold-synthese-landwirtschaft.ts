/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Landwirtschaft und Ernährung" (48 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== EU-Agrarpolitik (GAP) =====
  { aspekt: "EU-Agrarpolitik (GAP)", partei: "AfD",
    lang: [
      { text: "GAP zu komplex, bürokratisch und ideologisch — Kernproblem statt Lösung; Paradigmenwechsel und Entlastung der Bauern", idx: r(0,1,3,5,7,6,8) },
      { text: "Mercosur-Abkommen ablehnen wegen unfairer Wettbewerbsbedingungen für deutsche Bauern", idx: r(2,4,9) },
    ],
    kurz: [
      { text: "GAP zu komplex und bürokratisch; Paradigmenwechsel und Entlastung der Bauern", idx: r(0,1,3,5,7,6,8) },
      { text: "Mercosur-Abkommen ablehnen wegen unfairen Wettbewerbs", idx: r(2,4,9) },
    ] },
  { aspekt: "EU-Agrarpolitik (GAP)", partei: "CDU/CSU",
    lang: [
      { text: "GAP fortführen und weiterentwickeln (planbar, unbürokratisch, einkommenswirksam); Binnenmarkt erhalten, gegen Renationalisierung", idx: r(2,3,4,8,6) },
      { text: "Gegen überhastete grüne Ökoregelungen — Verschiebung und Neubewertung; Düngemittel-Entlastung; EUDR überarbeiten", idx: r(0,5,9,1,7) },
    ],
    kurz: [
      { text: "GAP fortführen und weiterentwickeln (planbar, einkommenswirksam); Binnenmarkt erhalten", idx: r(2,3,4,8,6) },
      { text: "Gegen überhastete grüne Ökoregelungen — Verschiebung; Düngemittel-Entlastung", idx: r(0,5,9,1,7) },
    ] },
  { aspekt: "EU-Agrarpolitik (GAP)", partei: "GRÜNE",
    lang: [
      { text: "Öffentliches Geld für öffentliche Leistungen statt pauschaler Flächenprämien; Tierwohl, Klima- und Naturschutz honorieren", idx: r(1,2,6) },
      { text: "Mindeststandards und Ambitionsniveau erhalten; gegen Agrardiesel-Subvention und Abschwächung der Pestizidverordnung", idx: r(3,5,0,4) },
    ],
    kurz: [
      { text: "Öffentliches Geld für öffentliche Leistungen statt pauschaler Flächenprämien", idx: r(1,2,6) },
      { text: "Mindeststandards erhalten; gegen Agrardiesel-Subvention und Pestizid-Abschwächung", idx: r(3,5,0,4) },
    ] },
  { aspekt: "EU-Agrarpolitik (GAP)", partei: "LINKE",
    lang: [{ text: "Agrarwende mit ökologischer und sozialer Ausrichtung statt pauschaler Flächenprämien; Umverteilung zugunsten kleiner und mittlerer Betriebe", idx: r(2,3,4,1,0) }],
    kurz: [{ text: "Agrarwende mit ökologischer und sozialer Ausrichtung; Umverteilung zugunsten kleiner Betriebe", idx: r(2,3,4,1,0) }] },
  { aspekt: "EU-Agrarpolitik (GAP)", partei: "SPD",
    lang: [
      { text: "GAP-Umbau hin zu öffentliches Geld für öffentliche Leistungen mit Öko-Regelungen als Grundpfeiler", idx: r(0,3,4) },
      { text: "Gegen Renationalisierung der Agrarförderung; Binnenmarkt erhalten; GAK-Finanzierung des Stallumbaus", idx: r(2,5,1) },
    ],
    kurz: [
      { text: "GAP-Umbau hin zu öffentliches Geld für öffentliche Leistungen (Öko-Regelungen)", idx: r(0,3,4) },
      { text: "Gegen Renationalisierung der Agrarförderung", idx: r(2,5,1) },
    ] },

  // ===== Pestizide / Pflanzenschutz =====
  { aspekt: "Pestizide / Pflanzenschutz", partei: "AfD",
    lang: [{ text: "Überregulierung abbauen, vereinfachte Zulassung bewährter Pflanzenschutzmittel; Kritik an Düngeverordnung und ungleichen Mercosur-Standards", idx: r(0,2,1,3) }],
    kurz: [{ text: "Überregulierung abbauen, vereinfachte Zulassung; Kritik an Düngeverordnung", idx: r(0,2,1,3) }] },
  { aspekt: "Pestizide / Pflanzenschutz", partei: "CDU/CSU",
    lang: [{ text: "Regulatorische Lasten reduzieren und Zulassung beschleunigen (genomische Techniken); gegen Pestizidabgaben", idx: r(0,1,3,2) }],
    kurz: [{ text: "Regulatorische Lasten reduzieren und Zulassung beschleunigen; gegen Pestizidabgaben", idx: r(0,1,3,2) }] },
  { aspekt: "Pestizide / Pflanzenschutz", partei: "GRÜNE",
    lang: [{ text: "Pestizide reduzieren nach Vorsorgeprinzip, schnellere Verbote gefährlicher Stoffe; gegen Streichung des Zukunftsprogramms Pflanzenschutz", idx: r(1,2,0) }],
    kurz: [{ text: "Pestizide reduzieren (Vorsorgeprinzip); gegen Streichung des Zukunftsprogramms", idx: r(1,2,0) }] },
  { aspekt: "Pestizide / Pflanzenschutz", partei: "SPD",
    lang: [{ text: "Reduktion von Pflanzenschutzmitteln über Öko-Regelungen, zugleich Digitalisierung und beschleunigte Zulassungsverfahren", idx: r(0,2,4,1,3) }],
    kurz: [{ text: "Reduktion über Öko-Regelungen, zugleich beschleunigte Zulassungsverfahren", idx: r(0,2,4,1,3) }] },

  // ===== Tierhaltung & Tierwohl =====
  { aspekt: "Tierhaltung & Tierwohl", partei: "AfD",
    lang: [
      { text: "Tierhaltungskennzeichnungsgesetz als Bürokratie und Symbolpolitik ablehnen / ersatzlos streichen; gegen Tierwohl-Zwang bei gleichzeitigen Billigimporten", idx: r(2,4,5,9,11,13,14,8,10) },
      { text: "Schutz der Weidetiere vor Wölfen; gegen Weideprämie/Ökoregeln als wirtschaftlich nachteilig; mangelnde Investitionsbedingungen", idx: r(3,6,12,1,7,0) },
    ],
    kurz: [
      { text: "Tierhaltungskennzeichnungsgesetz als Bürokratie ablehnen; gegen Tierwohl-Zwang bei Billigimporten", idx: r(2,4,5,9,11,13,14,8,10) },
      { text: "Schutz der Weidetiere vor Wölfen; gegen Weideprämie als nachteilig", idx: r(3,6,12,1,7,0) },
    ] },
  { aspekt: "Tierhaltung & Tierwohl", partei: "CDU/CSU",
    lang: [
      { text: "Tierhaltungskennzeichnung praktikabel und bürokratiearm; Tierwohl ja, aber gegen Verbote und staatliche Eingriffe", idx: r(1,3,10,2,7) },
      { text: "Weidetierhaltung und Herdenschutz vor Wölfen; Verschiebung der Weide-Ökoregel; Seuchen-Entschädigung erhöhen", idx: r(0,4,5,9,8,11,6) },
    ],
    kurz: [
      { text: "Tierhaltungskennzeichnung praktikabel und bürokratiearm; Tierwohl ohne Verbote", idx: r(1,3,10,2,7) },
      { text: "Weidetierhaltung und Herdenschutz vor Wölfen; Seuchen-Entschädigung erhöhen", idx: r(0,4,5,9,8,11,6) },
    ] },
  { aspekt: "Tierhaltung & Tierwohl", partei: "GRÜNE",
    lang: [
      { text: "Verpflichtende Tierhaltungskennzeichnung und Transparenz; Umbau der Tierhaltung verlässlich finanzieren (gegen Kürzungen)", idx: r(0,3,6,2,5,10) },
      { text: "Herdenschutz und Weideprämie für Weidetiere fördern; gegen massenhaften Antibiotika-Einsatz", idx: r(1,4,7,8,9) },
    ],
    kurz: [
      { text: "Verpflichtende Tierhaltungskennzeichnung; Umbau der Tierhaltung verlässlich finanzieren", idx: r(0,3,6,2,5,10) },
      { text: "Herdenschutz und Weideprämie fördern; gegen massenhaften Antibiotika-Einsatz", idx: r(1,4,7,8,9) },
    ] },
  { aspekt: "Tierhaltung & Tierwohl", partei: "LINKE",
    lang: [
      { text: "Tiergerechte Landwirtschaft mit verbindlichen Standards und Verboten statt nur Kennzeichnung", idx: r(0,1,2,3) },
      { text: "Weidetierprämie auf Bundesebene und vollständiger Schadensersatz; bessere Arbeitsbedingungen in der Schlachtung", idx: r(5,4) },
    ],
    kurz: [
      { text: "Tiergerechte Landwirtschaft mit verbindlichen Standards statt nur Kennzeichnung", idx: r(0,1,2,3) },
      { text: "Weidetierprämie und vollständiger Schadensersatz", idx: r(5,4) },
    ] },
  { aspekt: "Tierhaltung & Tierwohl", partei: "SPD",
    lang: [
      { text: "Verpflichtende, staatliche Tierhaltungskennzeichnung mit gestuften Haltungsformen; Stallumbau finanzieren (Borchert-Kommission)", idx: r(1,2,6,7,0,5) },
      { text: "Weidetierhaltung und Herdenschutz vor Wölfen; Öko-Regelungen für Weide und GAP-Honorierung; alternative Proteine", idx: r(3,4,11,8,9,10) },
    ],
    kurz: [
      { text: "Verpflichtende staatliche Tierhaltungskennzeichnung; Stallumbau finanzieren", idx: r(1,2,6,7,0,5) },
      { text: "Weidetierhaltung und Herdenschutz vor Wölfen; GAP-Honorierung von Tierwohl", idx: r(3,4,11,8,9,10) },
    ] },

  // ===== Tiertransporte =====
  { aspekt: "Tiertransporte", partei: "GRÜNE",
    lang: [{ text: "Videoüberwachung in Schlachthöfen mit öffentlicher Zugänglichkeit zur Kontrolle der Betäubungsqualität", idx: r(0) }],
    kurz: [{ text: "Videoüberwachung in Schlachthöfen zur Kontrolle der Betäubungsqualität", idx: r(0) }] },

  // ===== Gentechnik / Züchtung =====
  { aspekt: "Gentechnik / Züchtung", partei: "CDU/CSU",
    lang: [{ text: "Genomische Techniken in der Pflanzenzucht befürworten zur Bewältigung von Klima- und Schädlingsproblemen", idx: r(0) }],
    kurz: [{ text: "Genomische Techniken in der Pflanzenzucht befürworten", idx: r(0) }] },
  { aspekt: "Gentechnik / Züchtung", partei: "GRÜNE",
    lang: [{ text: "Kritik an geplanten Lockerungen für ungeprüfte genmanipulierte Lebensmittel", idx: r(0) }],
    kurz: [{ text: "Gegen Lockerungen für ungeprüfte genmanipulierte Lebensmittel", idx: r(0) }] },

  // ===== Ökolandbau =====
  { aspekt: "Ökolandbau", partei: "AfD",
    lang: [{ text: "Öko-Regelungen (Weideprämie, Biodiversität) als realitätsfern und unrentabel sofort zurücknehmen", idx: r(0) }],
    kurz: [{ text: "Öko-Regelungen als realitätsfern und unrentabel zurücknehmen", idx: r(0) }] },
  { aspekt: "Ökolandbau", partei: "CDU/CSU",
    lang: [{ text: "Bioförderung sinnvoll, aber gleichberechtigte Behandlung von konventioneller und ökologischer Landwirtschaft; gegen ideologische Öko-Spielwiesen; Forschungsmittel für Bio", idx: r(1,3,4,2,0) }],
    kurz: [{ text: "Bioförderung sinnvoll, aber gleichberechtigt mit konventioneller Landwirtschaft", idx: r(1,3,4,2,0) }] },
  { aspekt: "Ökolandbau", partei: "GRÜNE",
    lang: [{ text: "Ökolandbau und Biodiversität fördern (gegen Kürzungen); Kreislaufwirtschaft und Unabhängigkeit von Kunstdünger", idx: r(0,2,4,3,1) }],
    kurz: [{ text: "Ökolandbau und Biodiversität fördern; Kreislaufwirtschaft statt Kunstdünger", idx: r(0,2,4,3,1) }] },
  { aspekt: "Ökolandbau", partei: "LINKE",
    lang: [{ text: "Ökologische Landwirtschaft, Biodiversität und pestizidfreie Anbaumethoden fördern (gegen Abbau ökologischer Standards)", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Ökologische Landwirtschaft und Biodiversität fördern, gegen Standardabbau", idx: r(0,1,2,3,4) }] },
  { aspekt: "Ökolandbau", partei: "SPD",
    lang: [{ text: "Ökologischen Landbau stärken ohne Kürzungen; Öko-Regelungen und Bundesprogramm Ökologischer Landbau (BÖL)", idx: r(0,1,2) }],
    kurz: [{ text: "Ökologischen Landbau stärken; Öko-Regelungen und BÖL", idx: r(0,1,2) }] },

  // ===== Bodenmarkt / Spekulation =====
  { aspekt: "Bodenmarkt / Spekulation", partei: "AfD",
    lang: [{ text: "Bauernland in Bauernhand statt Konzernen; gegen staatliche Kontrolle der Bodennutzung; Flächenverlust durch Bebauung und Erneuerbare", idx: r(2,0,1) }],
    kurz: [{ text: "Bauernland in Bauernhand; gegen staatliche Kontrolle der Bodennutzung", idx: r(2,0,1) }] },
  { aspekt: "Bodenmarkt / Spekulation", partei: "CDU/CSU",
    lang: [{ text: "Bodenschutz durch bestehende landwirtschaftliche Praxis statt neuer Gesetze; Boden als endliche Ressource anerkennen", idx: r(0,1) }],
    kurz: [{ text: "Bodenschutz durch Praxis statt neuer Gesetze", idx: r(0,1) }] },
  { aspekt: "Bodenmarkt / Spekulation", partei: "LINKE",
    lang: [{ text: "Gegen Bodenspekulation und Landgrabbing durch Konzerne; Obergrenzen für Flächenbesitz/Pachtpreise und Vorrang für ortsansässige Betriebe", idx: r(0,2,1) }],
    kurz: [{ text: "Gegen Bodenspekulation und Landgrabbing; Obergrenzen und Vorrang für ortsansässige Betriebe", idx: r(0,2,1) }] },

  // ===== Lebensmittelpreise / -steuer =====
  { aspekt: "Lebensmittelpreise / -steuer", partei: "AfD",
    lang: [
      { text: "Gegen Billigimporte und Preisdumping; Herkunftskennzeichnung für alle Lebensmittel", idx: r(0,4) },
      { text: "Energie-, Dünger- und CO2-Kosten sowie Bürokratie treiben die Lebensmittelpreise", idx: r(1,3,2) },
    ],
    kurz: [
      { text: "Gegen Billigimporte und Preisdumping; Herkunftskennzeichnung", idx: r(0,4) },
      { text: "Energie-, Dünger- und CO2-Kosten treiben die Preise", idx: r(1,3,2) },
    ] },
  { aspekt: "Lebensmittelpreise / -steuer", partei: "CDU/CSU",
    lang: [{ text: "Kurzfristig keine erheblichen Preisauswirkungen erwartet; Downgrading-Regelung gegen Lebensmittelverschwendung", idx: r(0,1) }],
    kurz: [{ text: "Kurzfristig keine erheblichen Preisauswirkungen; Downgrading gegen Verschwendung", idx: r(0,1) }] },
  { aspekt: "Lebensmittelpreise / -steuer", partei: "GRÜNE",
    lang: [{ text: "Mehrwertsteuersenkung für pflanzliche Lebensmittel statt Subventionierung von Fleisch; gesundes Essen darf kein Luxus sein", idx: r(0,1,2) }],
    kurz: [{ text: "Mehrwertsteuersenkung für pflanzliche Lebensmittel; gesundes Essen kein Luxus", idx: r(0,1,2) }] },
  { aspekt: "Lebensmittelpreise / -steuer", partei: "LINKE",
    lang: [{ text: "Bezahlbare und gesunde Lebensmittel für alle; kostenloses Mittagessen an Schulen/Kitas; transparente Herkunftskennzeichnung", idx: r(0,1,2,4,3) }],
    kurz: [{ text: "Bezahlbare gesunde Lebensmittel für alle; kostenloses Schulessen", idx: r(0,1,2,4,3) }] },
  { aspekt: "Lebensmittelpreise / -steuer", partei: "SPD",
    lang: [{ text: "Stabile, faire Preise statt billigster Preise; Vorschlag eines Deutschland-Korbs", idx: r(0) }],
    kurz: [{ text: "Stabile, faire Preise statt billigster Preise (Deutschland-Korb)", idx: r(0) }] },

  // ===== Erzeugerpreise / Marktmacht =====
  { aspekt: "Erzeugerpreise / Marktmacht", partei: "AfD",
    lang: [
      { text: "Fairer Wettbewerb gegen Billigimporte mit niedrigeren Standards; faire Erzeugerpreise durch Herkunftskennzeichnung und Ombudsperson gegen die Handelsmacht", idx: r(2,4,9,12,17,3,7,14,15) },
      { text: "Agrardiesel, Energie- und Düngerkosten belasten die Betriebe; ukrainische Getreideimporte drücken die Preise; Bürokratieabbau", idx: r(1,5,8,11,6,16,10,13,0) },
    ],
    kurz: [
      { text: "Fairer Wettbewerb gegen Billigimporte; faire Erzeugerpreise und Ombudsperson gegen die Handelsmacht", idx: r(2,4,9,12,17,3,7,14,15) },
      { text: "Agrardiesel/Energie/Dünger belasten Betriebe; ukrainische Importe drücken Preise", idx: r(1,5,8,11,6,16,10,13,0) },
    ] },
  { aspekt: "Erzeugerpreise / Marktmacht", partei: "CDU/CSU",
    lang: [
      { text: "Agrardiesel-Rückgewähr und Entlastung im EU-Wettbewerb (Eins-zu-eins ohne Gold-Plating); Düngerkosten ausgleichen", idx: r(1,2,0) },
      { text: "Gegen Wettbewerbsverzerrung durch ungleiche Kennzeichnung/Importe; Mercosur und Export als Chance; angemessene Entlohnung", idx: r(3,4,5,6) },
    ],
    kurz: [
      { text: "Agrardiesel und Entlastung im EU-Wettbewerb (ohne Gold-Plating)", idx: r(1,2,0) },
      { text: "Gegen Wettbewerbsverzerrung durch Importe; angemessene Entlohnung", idx: r(3,4,5,6) },
    ] },
  { aspekt: "Erzeugerpreise / Marktmacht", partei: "GRÜNE",
    lang: [
      { text: "Faire Preise und faire Lieferketten mit Planungssicherheit, damit Höfe von ihrer Arbeit leben können", idx: r(2,3,0) },
      { text: "Tierwohl-Mehrwert über Kennzeichnung bezahlen; Sicherheit bei erneuerbaren Energien für Betriebe", idx: r(1,4) },
    ],
    kurz: [
      { text: "Faire Preise und faire Lieferketten mit Planungssicherheit", idx: r(2,3,0) },
      { text: "Tierwohl-Mehrwert bezahlen; Sicherheit bei erneuerbaren Energien", idx: r(1,4) },
    ] },
  { aspekt: "Erzeugerpreise / Marktmacht", partei: "LINKE",
    lang: [{ text: "Gegen die Marktmacht großer Konzerne und Handelsketten, die Preise diktieren; faire Erzeugerpreise und Schutz kleiner Betriebe (Wolf ist nicht die Hauptursache)", idx: r(0,1,2,3,5,6,7,9,4,8) }],
    kurz: [{ text: "Gegen die Marktmacht von Konzernen und Handelsketten; faire Erzeugerpreise, Schutz kleiner Betriebe", idx: r(0,1,2,3,5,6,7,9,4,8) }] },
  { aspekt: "Erzeugerpreise / Marktmacht", partei: "SPD",
    lang: [
      { text: "Ombudsperson und stärkere Missbrauchsaufsicht gegen die Marktkonzentration im Lebensmittelhandel; faire Preise", idx: r(0,3,5) },
      { text: "Staatliche Einkommensanreize für Gemeinwohlleistungen; Agrardiesel-Rückerstattung ab 2026; neue Proteinquellen; Schutzgemeinschaften", idx: r(1,4,2,6) },
    ],
    kurz: [
      { text: "Ombudsperson und Missbrauchsaufsicht gegen die Marktkonzentration; faire Preise", idx: r(0,3,5) },
      { text: "Staatliche Einkommensanreize; Agrardiesel-Rückerstattung ab 2026", idx: r(1,4,2,6) },
    ] },

  // ===== Ernährungssicherung als Staatsziel =====
  { aspekt: "Ernährungssicherung als Staatsziel", partei: "AfD",
    lang: [
      { text: "Heimische Produktion stärken gegen Importabhängigkeit als Frage der Versorgungssicherheit (auch in Krisenzeiten)", idx: r(0,1,2,3) },
      { text: "Produktive Flächennutzung statt Stilllegung; Höchstertrag statt Artenromantik; Landwirte als Rückgrat", idx: r(4,5,6) },
    ],
    kurz: [
      { text: "Heimische Produktion stärken gegen Importabhängigkeit (Versorgungssicherheit)", idx: r(0,1,2,3) },
      { text: "Produktive Flächennutzung statt Stilllegung", idx: r(4,5,6) },
    ] },
  { aspekt: "Ernährungssicherung als Staatsziel", partei: "CDU/CSU",
    lang: [{ text: "Ernährungssicherheit als zentrales Ziel und Teil der nationalen Sicherheitsstrategie; Unabhängigkeit, eigene Kapazitäten und Erhalt der Produktionsflächen", idx: r(0,1,2,3) }],
    kurz: [{ text: "Ernährungssicherheit als zentrales Ziel und Teil der nationalen Sicherheitsstrategie", idx: r(0,1,2,3) }] },
  { aspekt: "Ernährungssicherung als Staatsziel", partei: "GRÜNE",
    lang: [{ text: "Resiliente Strukturen und ökologische Stabilität als Grundlage; Unabhängigkeit von fossilen Energieträgern und Kunstdünger; selbstbestimmte Ernährung", idx: r(1,2,0) }],
    kurz: [{ text: "Resiliente Strukturen und ökologische Stabilität; Unabhängigkeit von fossil und Kunstdünger", idx: r(1,2,0) }] },
  { aspekt: "Ernährungssicherung als Staatsziel", partei: "LINKE",
    lang: [{ text: "Ernährungssicherung als öffentliche Aufgabe über regionale Kreisläufe und lokale bäuerliche Kontrolle (Schutz vor Konzernen)", idx: r(0,1,2,3) }],
    kurz: [{ text: "Ernährungssicherung als öffentliche Aufgabe; regional und bäuerlich, Schutz vor Konzernen", idx: r(0,1,2,3) }] },
  { aspekt: "Ernährungssicherung als Staatsziel", partei: "SPD",
    lang: [{ text: "Ernährungssicherung als staatliches Anliegen mit zentraler Rolle der Landwirtschaft; Importunabhängigkeit durch heimischen Anbau (auch alternative Proteine, Wein)", idx: r(0,2,3,1) }],
    kurz: [{ text: "Ernährungssicherung als staatliches Anliegen; Importunabhängigkeit durch heimischen Anbau", idx: r(0,2,3,1) }] },

  // ===== Wolf / Jagd =====
  { aspekt: "Wolf / Jagd", partei: "AfD",
    lang: [{ text: "Wolf ins Bundesjagdgesetz aufnehmen und Entnahme schadenstiftender Tiere zum Schutz der Weidetierhaltung; einheitliches Management", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Wolf ins Bundesjagdgesetz und Entnahme zum Schutz der Weidetierhaltung", idx: r(0,1,2,3,4) }] },
  { aspekt: "Wolf / Jagd", partei: "CDU/CSU",
    lang: [{ text: "Wolf ins Bundesjagdgesetz und regulierte Bejagung zum Schutz der Weidetiere, bei fortbestehendem Herdenschutz und Artenschutz", idx: r(0,1,2,3,4,5) }],
    kurz: [{ text: "Wolf ins Bundesjagdgesetz und regulierte Bejagung, bei fortbestehendem Herdenschutz", idx: r(0,1,2,3,4,5) }] },
  { aspekt: "Wolf / Jagd", partei: "GRÜNE",
    lang: [{ text: "Gegen breite Wolfsbejagung; Herdenschutz als wirksame Alternative, nur gezielte Entnahme von Schadwölfen", idx: r(0,1) }],
    kurz: [{ text: "Gegen breite Bejagung; Herdenschutz und nur gezielte Entnahme von Schadwölfen", idx: r(0,1) }] },
  { aspekt: "Wolf / Jagd", partei: "LINKE",
    lang: [{ text: "Herdenschutz und vollständige Entschädigung statt Abschüsse; Artenschutz bewahren", idx: r(0,1) }],
    kurz: [{ text: "Herdenschutz und Entschädigung statt Abschüsse", idx: r(0,1) }] },
  { aspekt: "Wolf / Jagd", partei: "SPD",
    lang: [{ text: "Wolf ins Jagdrecht für Rechtssicherheit, aber Herdenschutz bleibt Priorität; Entnahme von Problemwölfen unter Beibehaltung des Artenschutzes", idx: r(0,1,2) }],
    kurz: [{ text: "Wolf ins Jagdrecht für Rechtssicherheit, aber Herdenschutz bleibt Priorität", idx: r(0,1,2) }] },

  // ===== Werbeverbot / Verschwendung =====
  { aspekt: "Werbeverbot / Verschwendung", partei: "CDU/CSU",
    lang: [{ text: "Arbeit der Tafeln durch erhöhte Mittel unterstützen", idx: r(0) }],
    kurz: [{ text: "Arbeit der Tafeln durch erhöhte Mittel unterstützen", idx: r(0) }] },
  { aspekt: "Werbeverbot / Verschwendung", partei: "GRÜNE",
    lang: [{ text: "Kritik an irreführender Verpackungswerbung mit Bildern glücklicher Tiere bei abweichenden Haltungsbedingungen", idx: r(0) }],
    kurz: [{ text: "Gegen irreführende Verpackungswerbung", idx: r(0) }] },
  { aspekt: "Werbeverbot / Verschwendung", partei: "LINKE",
    lang: [{ text: "Warnung vor irreführender Verbraucherkommunikation durch unvollständige Kennzeichnung und euphemistische Begriffe", idx: r(0) }],
    kurz: [{ text: "Gegen irreführende Verbraucherkommunikation und unvollständige Kennzeichnung", idx: r(0) }] },
];

applySynthese("Landwirtschaft und Ernährung", CELLS);
