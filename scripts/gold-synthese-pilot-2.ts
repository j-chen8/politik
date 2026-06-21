/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Aspekte „Unternehmenssteuern“ und
 * „Energiekosten für die Wirtschaft“ im Feld Wirtschaft, beide Varianten
 * (ausführlich → synthese_json, kompakt → synthese_kurz_json).
 *
 * Robustes Design: jeder Stichpunkt referenziert INDIZES in die gespeicherte
 * punkte_json der Zelle; das Skript löst daraus die rede_ids auf und prüft, dass
 * jeder Roh-Punkt-Index genau einmal verwendet wird (keine Quelle verloren/doppelt).
 *
 *   npx tsx scripts/gold-synthese-pilot-2.ts
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");
const cols = (db.prepare(`PRAGMA table_info(partei_aspekt_gold)`).all() as any[]).map((c) => c.name);
for (const c of ["synthese_json", "synthese_kurz_json"]) {
  if (!cols.includes(c)) { db.exec(`ALTER TABLE partei_aspekt_gold ADD COLUMN ${c} TEXT`); console.log(`+ Spalte ${c}`); }
}

type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";

const CELLS: Cell[] = [
  // ===================== UNTERNEHMENSSTEUERN =====================
  {
    aspekt: "Unternehmenssteuern", partei: "AfD",
    lang: [
      { text: "Körperschaftsteuer sofort und stärker senken — Kritik an Verzögerung (2028/2032) und Mini-Schritten; Forderung bis 10 %, plus Abschaffung des Soli für Unternehmen", idx: [4,5,6,7,8,11,15,34,36,51] },
      { text: "Einheitlicher Steuersatz/Flat Tax (25 %) für alle Einkommensarten; Steuersystem vereinfachen, Gewerbesteuer abschaffen bzw. zu einer Unternehmensteuer zusammenlegen", idx: [19,20,22,26,42] },
      { text: "Generell Steuern und Abgaben senken, Leistungsträger entlasten, gegen jede Steuererhöhung — hohe Steuern als Standortnachteil und Krisenursache", idx: [0,1,2,3,9,10,12,13,16,24,27,28,33,35,37,38,40,44,45,46,50,52] },
      { text: "Erbschaft- und Vermögensteuer auf Unternehmen ablehnen (Substanz-/Doppelbesteuerung, Schutz von Familienunternehmen)", idx: [14,29,30,31,32,39,41,43,48] },
      { text: "Kritik an der globalen Mindeststeuer (ungleiche Umsetzung, Bürokratie)", idx: [25] },
      { text: "Mehrwertsteuer in der Gastronomie senken (19 → 7 %)", idx: [47] },
      { text: "Luftverkehrsteuer abschaffen (Standortpolitik)", idx: [17,18] },
      { text: "Übergewinnsteuer ablehnen; niedrigere Umsatzsteuer auf Mineralöl", idx: [49] },
      { text: "Einkommensteuerfreiheit für kinderreiche Haushalte", idx: [23] },
      { text: "Kritik an ungleicher Steuerlast (Millionäre ~25 % vs. Facharbeiter Spitzensteuersatz)", idx: [21] },
    ],
    kurz: [
      { text: "Steuern radikal senken — Körperschaftsteuer sofort (bis 10 %), Soli abschaffen, einheitlicher Steuersatz/Flat Tax 25 %, Gewerbesteuer abschaffen; gegen jede Steuererhöhung, hohe Steuern als Standortnachteil", idx: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,19,20,22,24,26,27,28,33,34,35,36,37,38,40,42,44,45,46,50,51,52] },
      { text: "Erbschaft- und Vermögensteuer auf Unternehmen ablehnen (Schutz von Substanz und Familienunternehmen)", idx: [14,29,30,31,32,39,41,43,48] },
      { text: "Branchen-Entlastungen: Gastronomie-MwSt 19→7 %, Luftverkehrsteuer abschaffen, Umsatzsteuer Mineralöl senken, Übergewinnsteuer ablehnen", idx: [17,18,47,49] },
      { text: "Kritik an globaler Mindeststeuer und ungleicher Steuerlast; Steuerfreiheit für kinderreiche Haushalte", idx: [21,23,25] },
    ],
  },
  {
    aspekt: "Unternehmenssteuern", partei: "CDU/CSU",
    lang: [
      { text: "Körperschaftsteuer senken (Richtung 10 %, ab 2028/2032) als zentrale Standortmaßnahme — „größte Steuersenkung seit 20 Jahren“, Teil des Investitionsboosters", idx: [1,2,3,4,5,6,7,8,11,12,15,20,21,22,23,25,28,33,42] },
      { text: "AfD-Pläne (Gewerbesteuer-Abschaffung, Flat Tax) als unseriös/nicht gegenfinanziert ablehnen; für differenzierte, progressive Besteuerung", idx: [0,9,10,13] },
      { text: "Erbschaftsteuer: Betriebsvermögen verschonen, gegen Erhöhung, Arbeitsplätze sichern; Reformbedarf bei Immobilien/Regionalisierung", idx: [14,29,30,31,34] },
      { text: "Vermögensteuer ablehnen (verfassungswidrig, Doppelbesteuerung der Substanz)", idx: [35,36,37,40] },
      { text: "Solidaritätszuschlag abschaffen zur Mittelstandsentlastung (Kritik an Grünen)", idx: [32] },
      { text: "Digitalkonzerne gezielt und gerecht besteuern (zweckgebundene Abgabe statt pauschaler Erhöhung)", idx: [17,18,19] },
      { text: "Globale Mindeststeuer (15 %) befürworten für faire Wettbewerbsbedingungen", idx: [24] },
      { text: "Mehrwertsteuer in der Gastronomie auf 7 % senken (EU-Angleichung)", idx: [16,26,27] },
      { text: "Luftverkehrsteuer senken zur Entlastung der Branche", idx: [44,45] },
      { text: "Entlastungsprämien als abzugsfähige Betriebsausgaben", idx: [41] },
      { text: "Steuererleichterungen schaffen Arbeitsplätze (Koalitionskurs)", idx: [38,39] },
      { text: "Ablehnung zusätzlicher europäischer Abgaben", idx: [43] },
    ],
    kurz: [
      { text: "Körperschaftsteuer deutlich senken (Richtung 10 %) als zentrale Standortmaßnahme; Steuererleichterungen schaffen Arbeitsplätze", idx: [1,2,3,4,5,6,7,8,11,12,15,20,21,22,23,25,28,33,38,39,42] },
      { text: "AfD-Pläne (Gewerbesteuer-Abschaffung, Flat Tax) als unseriös ablehnen; für differenzierte, progressive Besteuerung", idx: [0,9,10,13] },
      { text: "Erbschaft- und Vermögensteuer auf Betriebsvermögen ablehnen/verschonen (Substanzschutz, verfassungsrechtliche Bedenken); Soli abschaffen", idx: [14,29,30,31,32,34,35,36,37,40] },
      { text: "Digitalkonzerne gezielt und gerecht besteuern; globale Mindeststeuer (15 %) befürworten", idx: [17,18,19,24] },
      { text: "Branchen-Entlastungen: Gastronomie-MwSt auf 7 %, Luftverkehrsteuer senken, Entlastungsprämien als Betriebsausgaben", idx: [16,26,27,41,44,45] },
      { text: "Ablehnung zusätzlicher europäischer Abgaben", idx: [43] },
    ],
  },
  {
    aspekt: "Unternehmenssteuern", partei: "GRÜNE",
    lang: [
      { text: "Körperschaftsteuer-Senkung ab 2028 als teures, ineffizientes „Steuergeschenk“ — begünstigt überwiegend Wohlhabende/oberstes 1 %, bringt kein Wachstum, belastet Kommunen, schuldenfinanziert, fließt in Dividenden; erreicht Personengesellschaften nicht", idx: [0,3,4,6,9,11,14] },
      { text: "Für progressive Besteuerung; Kapital höher besteuern als Arbeit, Millionäre/Milliardäre stärker — gegen Begünstigung Reicher", idx: [2,5,16] },
      { text: "Steuerlücken schließen (Immobilien, Erbschaft, Share Deals, Spekulationsfristen, Lizenzschranke gegen Gewinnverlagerung)", idx: [1,10,15] },
      { text: "Gastronomie-MwSt-Senkung als Lobbygeschenk kritisiert; Forderung nach grundlegender Mehrwertsteuerreform", idx: [7,12] },
      { text: "Erbschaftsteuer-Reform für Betriebsvermögen mit Stundungsregelungen (Arbeitsplätze erhalten)", idx: [13] },
      { text: "Fehlende Entlastung für kleine Unternehmen, Selbstständige und freie Berufe — pragmatische Lösungen", idx: [18] },
      { text: "Übergewinnsteuer auf Energiekonzerne befürworten", idx: [17] },
      { text: "Kritik an AfD-Plänen (Grundsteuer/Erbschaftsteuer streichen), die Großunternehmen entlasten", idx: [8] },
    ],
    kurz: [
      { text: "Körperschaftsteuer-Senkung als teures, ineffizientes „Steuergeschenk“ für Wohlhabende — kein Wachstum, belastet Kommunen, erreicht Personengesellschaften nicht", idx: [0,3,4,6,9,11,14] },
      { text: "Für progressive Besteuerung (Kapital höher als Arbeit, Millionäre stärker) und Schließen von Steuerlücken (Immobilien, Erbschaft, Share Deals, Lizenzschranke); Übergewinnsteuer auf Energiekonzerne", idx: [1,2,5,10,15,16,17] },
      { text: "Gastronomie-MwSt-Senkung als Lobbygeschenk; grundlegende MwSt-Reform statt Branchen-Ausnahmen", idx: [7,12] },
      { text: "Mittelstand gezielt entlasten: Erbschaftsteuer-Reform mit Stundung für Betriebsvermögen, Hilfe für kleine Unternehmen/Selbstständige; Kritik an AfD-Plänen zugunsten Großer", idx: [8,13,18] },
    ],
  },
  {
    aspekt: "Unternehmenssteuern", partei: "LINKE",
    lang: [
      { text: "Unternehmensteuersenkungen als ineffektiv und regressiv — Steuergeschenk fürs oberste 1 %, keine Investitionswirkung (auch historisch 2001/2008), Mindereinnahmen für Länder/Kommunen", idx: [0,1,3,10,11] },
      { text: "Vorwurf an SPD/Regierung: größte Unternehmensteuersenkung durchgesetzt, während Normalverbraucher nicht entlastet wird", idx: [8,9] },
      { text: "Für höhere Besteuerung von Kapital, Vermögen und Großeinkommen; progressive Besteuerung statt Flat Tax; gegen AfD-Abschaffung der Unternehmensteuer (100 Mrd. Ausfall)", idx: [2,4,6,7,13,17] },
      { text: "Digitalkonzerne und Streamingdienste höher besteuern, Steuervollzug verbessern", idx: [5,12] },
      { text: "Übergewinnsteuer (50 %) auf Krisen- und Energiekonzern-Gewinne", idx: [14,15] },
      { text: "Tonnagesteuer für Reedereien europaweit abschaffen", idx: [16] },
      { text: "Solidaritätszuschlag auf Unternehmensgewinne beibehalten (sozial gerecht, finanziert Infrastruktur)", idx: [18] },
    ],
    kurz: [
      { text: "Unternehmensteuersenkungen als ineffektiv/regressiv — Geschenk fürs oberste 1 %, keine Investitionen, Mindereinnahmen für Kommunen; Vorwurf an SPD/Regierung", idx: [0,1,3,8,9,10,11] },
      { text: "Höhere Besteuerung von Kapital, Vermögen und Großeinkommen; progressiv statt Flat Tax; gegen AfD-Steuerpläne", idx: [2,4,6,7,13,17] },
      { text: "Digitalkonzerne/Streaming höher besteuern; Übergewinnsteuer (50 %) auf Krisengewinne", idx: [5,12,14,15] },
      { text: "Tonnagesteuer abschaffen; Soli auf Unternehmensgewinne beibehalten", idx: [16,18] },
    ],
  },
  {
    aspekt: "Unternehmenssteuern", partei: "SPD",
    lang: [
      { text: "Körperschaftsteuer gesenkt, Superabschreibungen und Wachstumsbooster (12 Mrd.) als zielgerichtete Entlastung umgesetzt (Standortfördergesetz)", idx: [0,8,9,10,11] },
      { text: "Solidaritätszuschlag ist verfassungsgemäß und gerecht — gegen Abschaffung (13 Mrd. Ausfall)", idx: [1] },
      { text: "Gegen AfD: Flat Tax verfassungswidrig, Gewerbesteuer-Abschaffung als Angriff auf die Kommunen, Steuersenkungen ohne Gegenfinanzierung", idx: [3,5,6] },
      { text: "Für Besteuerung nach Leistungsfähigkeit und internationale Mindeststeuerregeln gegen ruinösen Steuerwettbewerb", idx: [2,4] },
      { text: "Erbschaftsteuer-Reform: höhere Freibeträge für Unternehmensnachfolgen (bis 5 Mio. €), höhere Vermögen stärker belasten", idx: [12] },
      { text: "Gegen Abschaffung der Wegzugsbesteuerung (steuerfluchtfördernd)", idx: [7] },
      { text: "Übergewinnsteuer zur Begrenzung von Krisengewinnen", idx: [13] },
      { text: "Gewerbesteuer-Mindesthebesatz 200 → 280 % gegen kommunales Preisdumping", idx: [14] },
      { text: "Steuerreform soll kleine/mittlere Einkommen und Handwerk berücksichtigen", idx: [15] },
    ],
    kurz: [
      { text: "Eigene Unternehmensentlastung umgesetzt: Körperschaftsteuer gesenkt, Superabschreibungen, Wachstumsbooster (12 Mrd.), Standortfördergesetz", idx: [0,8,9,10,11] },
      { text: "Gegen AfD-Steuerpläne: Flat Tax verfassungswidrig, Gewerbesteuer-Abschaffung trifft Kommunen, Soli bleibt (gerecht); für Besteuerung nach Leistungsfähigkeit und internationale Mindeststeuer", idx: [1,2,3,4,5,6] },
      { text: "Erbschaftsteuer-Reform: höhere Freibeträge für Unternehmensnachfolgen, höhere Vermögen stärker", idx: [12] },
      { text: "Gegen Steuerflucht: Wegzugsbesteuerung erhalten, Gewerbesteuer-Mindesthebesatz anheben; Übergewinnsteuer auf Krisengewinne", idx: [7,13,14] },
      { text: "Steuerreform soll kleine/mittlere Einkommen und Handwerk berücksichtigen", idx: [15] },
    ],
  },
  // ===================== ENERGIEKOSTEN FÜR DIE WIRTSCHAFT =====================
  {
    aspekt: "Energiekosten für die Wirtschaft", partei: "AfD",
    lang: [
      { text: "Hohe Energiepreise als zentrale Ursache für Deindustrialisierung, Standortnachteil und Abwanderung — größtes Wettbewerbshindernis", idx: [0,1,3,6,9,17,18,19,20,23,24,29,31,36,39,49,51,52,54,60,63,66,72,77,79,81,82,88] },
      { text: "CO₂-Bepreisung/CO₂-Steuer und Emissionshandel vollständig abschaffen — Haupttreiber der Kosten", idx: [12,14,21,22,27,30,33,41,42,53,58,61,71,87,89] },
      { text: "Strom- und Energiesteuer auf das EU-Minimum senken oder abschaffen, dauerhaft statt befristet", idx: [7,8,16,37,40,46,57,68,69,70,76,78] },
      { text: "Rückkehr zu Kernkraft, russischem Gas und grundlastfähigen Trägern als günstige, sichere Versorgung", idx: [4,5,25,34,38,48,50,56,64,84,85] },
      { text: "Energiewende als gescheitert, ideologisch und extrem teuer (genannt: 5 Billionen €); EEG-Umlagen und Netzentgelte treiben die Preise (~50 % des Strompreises)", idx: [2,10,11,13,26,28,32,35,44,45,47,59,80] },
      { text: "Einzelne Branchen besonders belastet: Gastronomie, Chemie, Werften, Gartenbau, Düngemittel, Transport/Logistik, Luftverkehr", idx: [15,43,62,65,67,73,74,75,86] },
      { text: "Wasserstoff zu teuer; Wettbewerber wie BASF profitieren von günstiger Energie im Ausland (China)", idx: [55,83] },
    ],
    kurz: [
      { text: "Hohe Energiepreise als Hauptursache für Deindustrialisierung und Standortverlust — alle Branchen betroffen", idx: [0,1,3,6,9,15,17,18,19,20,23,24,29,31,36,39,43,49,51,52,54,55,60,62,63,65,66,67,72,73,74,75,77,79,81,82,83,86,88] },
      { text: "CO₂-Bepreisung/-Steuer und Emissionshandel abschaffen; Strom- und Energiesteuer aufs EU-Minimum senken", idx: [7,8,12,14,16,21,22,27,30,33,37,40,41,42,46,53,57,58,61,68,69,70,71,76,78,87,89] },
      { text: "Rückkehr zu Kernkraft, Gas und grundlastfähigen Trägern als günstige, sichere Versorgung", idx: [4,5,25,34,38,48,50,56,64,84,85] },
      { text: "Energiewende als gescheitert, ideologisch und extrem teuer kritisiert (EEG, Netzentgelte)", idx: [2,10,11,13,26,28,32,35,44,45,47,59,80] },
    ],
  },
  {
    aspekt: "Energiekosten für die Wirtschaft", partei: "CDU/CSU",
    lang: [
      { text: "Stromsteuer für das produzierende Gewerbe/energieintensive Branchen auf das EU-Minimum gesenkt, Senkung für alle geplant", idx: [0,1,4,5,11,12,17,22,23,25,39,53] },
      { text: "Energiekosten gesenkt durch Netzentgelt-Reduktion und Streichung der Gasspeicherumlage", idx: [18,27,30,32,42] },
      { text: "Industriestrompreis einführen zur Entlastung energieintensiver Branchen", idx: [13,14,24,29,31,49] },
      { text: "Hohe Energiepreise als zentraler Standortnachteil — müssen für Wettbewerbsfähigkeit und Arbeitsplätze sinken", idx: [3,6,8,9,34,40,41,43,52] },
      { text: "Versorgungssicherheit, Technologieoffenheit und Balance aus Klimaschutz und Wirtschaftlichkeit; Klimaschutz bleibt wichtig, aber effizienter", idx: [2,7,20,21,44,47] },
      { text: "Energiesteuer auf Kraftstoffe um 17 Cent/Liter senken (Transport, Logistik, Landwirtschaft); Tankrabatt", idx: [45,46,50,51] },
      { text: "Luftverkehrsteuer und Flughafenentgelte senken (verantwortungsvoll mit Gegenfinanzierung)", idx: [15,16] },
      { text: "Wasserstoff als günstiger Energieträger nötig, aber Warnung vor zu teurer Technologie; Erneuerbare für Importunabhängigkeit", idx: [19,33,37] },
      { text: "Sonderlagen: Gastronomie entlasten, Gartenbau-Energieeffizienz, Redispatch-Kosten, externe Preistreiber (Irankonflikt), Pendlerpauschale", idx: [10,26,28,35,36,38,48] },
    ],
    kurz: [
      { text: "Bereits gehandelt: Stromsteuer aufs EU-Minimum gesenkt, Netzentgelte und Gasspeicherumlage reduziert, Industriestrompreis eingeführt", idx: [0,1,4,5,11,12,13,14,17,18,22,23,24,25,27,29,30,31,32,39,42,49,53] },
      { text: "Hohe Energiepreise als zentraler Standortnachteil — müssen für Wettbewerbsfähigkeit und Arbeitsplätze weiter sinken", idx: [3,6,8,9,34,40,41,43,52] },
      { text: "Versorgungssicherheit, Technologieoffenheit und Balance aus Klimaschutz und Wirtschaftlichkeit (Klimaschutz bleibt, aber effizienter)", idx: [2,7,20,21,44,47] },
      { text: "Energiesteuer auf Kraftstoffe um 17 Cent senken/Tankrabatt; Luftverkehrsteuer und Flughafenentgelte senken", idx: [15,16,45,46,50,51] },
      { text: "Wasserstoff/Erneuerbare für günstige, unabhängige Versorgung; gezielte Branchenentlastung (Gastronomie, Gartenbau) und externe Preistreiber", idx: [10,19,26,28,33,35,36,37,38,48] },
    ],
  },
  {
    aspekt: "Energiekosten für die Wirtschaft", partei: "GRÜNE",
    lang: [
      { text: "Stromsteuer für ALLE senken (Unternehmen, Handwerk, KMU und Haushalte) statt selektiver Industrie-Entlastung — Kritik an ausbleibender/abgespeckter Senkung", idx: [0,2,3,4,5,6,8,9,12,13,14,15,24,28,29] },
      { text: "Erneuerbare und Gasunabhängigkeit senken Kosten und sichern Planungssicherheit; Energiewende nicht torpedieren", idx: [1,18,19,22,25] },
      { text: "Tankrabatt als ineffektiv kritisiert; stattdessen Stromsteuersenkung, Übergewinnsteuer und Elektrifizierung fördern", idx: [23,26,27] },
      { text: "Industriestrompreis gestalten; Energiepreisentlastungspaket, Klimageld und ÖPNV-Entlastung", idx: [11,16,17] },
      { text: "Warnung vor Wirtschaftskrise durch hohe Energiepreise; Gesetzentwürfe unzureichend; Wasserstoff/Gas für Chemieindustrie sichern", idx: [20,21] },
      { text: "Automobilindustrie: gezielte Förderung der E-Mobilität statt Symbolpolitik; Kritik an degressiver AfA", idx: [7,10] },
    ],
    kurz: [
      { text: "Stromsteuer für ALLE senken (Unternehmen, Handwerk, KMU, Haushalte) statt selektiver Industrie-Entlastung; Kritik an ausbleibender Senkung", idx: [0,2,3,4,5,6,8,9,12,13,14,15,24,28,29] },
      { text: "Erneuerbare, Gasunabhängigkeit und Wasserstoff senken Kosten und sichern Planung; Energiewende nicht torpedieren; Industriestrompreis gestalten", idx: [1,11,18,19,20,21,22,25] },
      { text: "Tankrabatt ineffektiv — stattdessen Übergewinnsteuer, Elektrifizierung und gezielte Entlastung (Klimageld, ÖPNV, E-Mobilität); Kritik an degressiver AfA", idx: [7,10,16,17,23,26,27] },
    ],
  },
  {
    aspekt: "Energiekosten für die Wirtschaft", partei: "LINKE",
    lang: [
      { text: "Maßnahmen zur Senkung von Strompreisen und Netzentgelten unzureichend — einmalige Zuschüsse reichen nicht, spürbare und langfristige Entlastung nötig", idx: [0,2,4,5] },
      { text: "Energieintensive Industrien (Chemie, Stahl) drohen wegen Energiekosten abzuwandern; Jobverlust", idx: [3] },
      { text: "Gegen Spritpreis-Explosionen: staatliche Eingriffe und Preisaufsicht gegen Preistreiberei der Mineralölkonzerne", idx: [6,7,9] },
      { text: "Gasabhängigkeit verteuert Strom; Ausbau Erneuerbarer statt Bevorzugung von Gaskraftwerken; bezahlbare Energie für Transformation nötig", idx: [8,10] },
      { text: "Kritik am Ausschluss der Seehäfen trotz ihrer Logistik-Bedeutung", idx: [1] },
    ],
    kurz: [
      { text: "Maßnahmen zur Senkung von Strompreisen/Netzentgelten unzureichend — spürbare, langfristige Entlastung statt Einmalzuschüssen; energieintensive Industrien (Chemie, Stahl) drohen abzuwandern", idx: [0,2,3,4,5] },
      { text: "Gegen Spritpreis-Treiberei: staatliche Preisaufsicht und Eingriffe gegen Mineralölkonzerne", idx: [6,7,9] },
      { text: "Gasabhängigkeit verteuert Strom; Erneuerbare ausbauen, bezahlbare Energie für die Transformation; Kritik am Seehäfen-Ausschluss", idx: [1,8,10] },
    ],
  },
  {
    aspekt: "Energiekosten für die Wirtschaft", partei: "SPD",
    lang: [
      { text: "Stromsteuer für 600.000 produzierende Betriebe auf das EU-Minimum gesenkt (≈2 Cent/kWh Entlastung)", idx: [0,1,3,8,13,14,19,25] },
      { text: "Netzentgelte bezuschusst (6,5 Mrd. €) und Gasspeicherumlage abgeschafft", idx: [9,10] },
      { text: "Industriestrompreis (ab 2026) zur Sicherung energieintensiver Wertschöpfungsketten", idx: [4,5,7,22,24] },
      { text: "Energiepreise als zentraler Standortnachteil — Entlastungspaket für niedrige, wettbewerbsfähige Preise", idx: [12] },
      { text: "Erneuerbare, heimische Stromproduktion und Infrastruktur senken Kosten dauerhaft ohne Subventionen", idx: [2,11,15] },
      { text: "Energiesteuer auf Kraftstoffe befristet um 17 Cent/Liter senken (Pendler, Handwerk, Logistik, Speditionen)", idx: [21,23] },
      { text: "Gegen Spritpreis-Explosionen: Maßnahmen gegen Preistreiberei, Preisbindung/Transparenz, Preisdeckel; E-Auto-Förderung; Kritik an Atomkraft als unwirtschaftlich", idx: [6,16,17,18,20] },
    ],
    kurz: [
      { text: "Bereits entlastet: Stromsteuer für 600.000 Betriebe aufs EU-Minimum, Netzentgelt-Zuschüsse (6,5 Mrd.), Gasspeicherumlage abgeschafft", idx: [0,1,3,8,9,10,13,14,19,25] },
      { text: "Industriestrompreis (ab 2026) für energieintensive Wertschöpfung; Erneuerbare und heimische Produktion senken Kosten dauerhaft", idx: [2,4,5,7,11,15,22,24] },
      { text: "Energiepreise als zentraler Standortnachteil — Entlastungspaket; Energiesteuer auf Kraftstoffe befristet um 17 Cent senken", idx: [12,21,23] },
      { text: "Gegen Spritpreis-Treiberei (Preisbindung, Transparenz, Deckel); E-Auto-Förderung; Kritik an Atomkraft als unwirtschaftlich", idx: [6,16,17,18,20] },
    ],
  },
];

const upd = db.prepare(
  `UPDATE partei_aspekt_gold SET synthese_json=?, synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`,
);

function resolve(rede: string[], bullets: B[], label: string): { text: string; refs: string[] }[] {
  const out = bullets.map((b) => ({ text: b.text, refs: b.idx.map((i) => rede[i]) }));
  const used = bullets.flatMap((b) => b.idx);
  const dup = used.filter((i, k) => used.indexOf(i) !== k);
  const missing = rede.map((_, i) => i).filter((i) => !used.includes(i));
  const bad = used.filter((i) => i < 0 || i >= rede.length);
  if (dup.length) console.log(`    ⚠ ${label}: doppelte Indizes ${[...new Set(dup)].join(",")}`);
  if (missing.length) console.log(`    ⚠ ${label}: nicht zugeordnete Reden-Indizes ${missing.join(",")}`);
  if (bad.length) console.log(`    ⚠ ${label}: ungültige Indizes ${bad.join(",")}`);
  return out;
}

let ok = 0;
for (const c of CELLS) {
  const row = db
    .prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`)
    .get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const lang = resolve(rede, c.lang, `${c.aspekt}/${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.aspekt}/${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, c.aspekt, c.partei);
  ok++;
  console.log(`  ✓ ${c.aspekt} / ${c.partei}: ${rede.length} Reden → ${lang.length} lang / ${kurz.length} kompakt`);
}
console.log(`\n${ok}/${CELLS.length} Zellen aktualisiert.`);
db.close();
