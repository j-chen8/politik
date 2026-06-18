/**
 * Manuelle Crosswalk: abgeordnetenwatch-Roh-Tags → BT-Themenfelder (25 Felder).
 *
 * KEIN LLM. Handgeschriebene, geordnete Regel-Liste (spezifisch → generisch, First-Match)
 * + Override-Tabelle für Tags, die die Regeln falsch routen würden. Jede Zuordnung trägt
 * eine `source` (override|rule|unmapped) zur Prüfung. Feld-Ebene (Primärachse); spezifische
 * Unterthemen sind additiv später nachschärfbar.
 *
 * Lauf:  npx tsx scripts/build-aw-tag-themenfeld.ts            # bauen + in DB schreiben
 *        npx tsx scripts/build-aw-tag-themenfeld.ts --dry      # nur Report, kein Write
 */
import Database from "better-sqlite3";
import path from "path";
import { FELDER } from "./_lib/themen-taxonomie";

const DRY = process.argv.includes("--dry");
const db = new Database(path.join(process.cwd(), "politik.db"));

// Feld-Kürzel → kanonischer Feldname (exakt aus der Taxonomie)
const F = {
  W: "Wirtschaft",
  IS: "Innere Sicherheit",
  FIN: "Öffentliche Finanzen, Steuern und Abgaben",
  R: "Recht",
  SV: "Staat und Verwaltung",
  MED: "Medien, Kommunikation und Informationstechnik",
  G: "Gesundheit",
  U: "Umwelt",
  EN: "Energie",
  LW: "Landwirtschaft und Ernährung",
  AP: "Außenpolitik und internationale Beziehungen",
  EU: "Europapolitik und Europäische Union",
  EZ: "Entwicklungspolitik",
  AB: "Arbeit und Beschäftigung",
  SOZ: "Soziale Sicherung",
  BIL: "Bildung und Erziehung",
  MIG: "Migration und Aufenthaltsrecht",
  VK: "Verkehr",
  BAU: "Raumordnung, Bau- und Wohnungswesen",
  VTG: "Verteidigung",
  GES: "Gesellschaftspolitik, soziale Gruppen",
  POL: "Politisches Leben, Parteien",
  WIS: "Wissenschaft, Forschung und Technologie",
  KUL: "Kultur",
  SPT: "Sport, Freizeit und Tourismus",
} as const;

// Sanity: alle Kürzel zeigen auf existierende Felder
for (const [k, v] of Object.entries(F)) {
  if (!FELDER.includes(v)) throw new Error(`Feld-Kürzel ${k} → unbekanntes Feld "${v}"`);
}

// ── OVERRIDE: exakter Tag-Name → Feld. Hat Vorrang vor Regeln. ──────────────
// Nur für Tags, die die Regeln falsch/mehrdeutig treffen würden.
const OVERRIDE: Record<string, string> = {
  // Politiker-/Parlament-Meta (Bürger fragt MdB über dessen Rolle)
  "Abstimmungsverhalten": F.POL, "Antwortverhalten": F.POL, "abgeordnetenwatch": F.POL,
  "Mandat": F.POL, "Abgeordnete": F.POL, "Transparenz": F.POL, "Transparenzversprechen": F.POL,
  "Nebeneinkünfte": F.POL, "Nebentätigkeiten": F.POL, "Nebenverdienst": F.POL, "Diäten": F.POL,
  "Diätenerhöhung": F.POL, "Lobbyismus": F.POL, "Lobbyregister": F.POL, "#Lobbytransparenz": F.POL,
  "Korruption": F.POL, "Bundestag-Verkleinerung": F.POL, "Wahlrecht": F.POL, "Wahlalter": F.POL,
  "Kandidierendencheck": F.POL, "Kandidatur": F.POL, "Wahlkreis": F.POL, "Wahlkampf": F.POL,
  "Wahlprogramm": F.POL, "Wahlversprechen": F.POL, "Wahlplakat": F.POL, "Direktkandidatur": F.POL,
  "beruflicher Hintergrund": F.POL, "persönliche Ziele": F.POL, "persönliche Bilanz": F.POL,
  "persönliche Ziele ": F.POL, "Lebenslauf": F.POL, "politische Erfahrung": F.POL, "Berufsbild": F.POL,
  "Bürgerdialog": F.POL, "Bürgerbeteiligung": F.POL, "Bürgerräte": F.POL, "Bürgernähe": F.POL,
  "legislativer Fußabdruck": F.POL, "Exekutiver Fußabdruck": F.POL, "LobbyismusExperiment": F.POL,
  "Demokratie": F.POL, "Direkte Demokratie": F.POL, "Demokratiedefizit": F.POL,
  "Postenvergabe": F.POL, "Vetternwirtschaft": F.POL, "Interessenskonflikt": F.POL,
  "Interessenvertretung": F.POL, "Parteispenden": F.POL, "Gemeinnützigkeit": F.SV,
  "Brandmauer": F.POL, "Koalitionsbildung": F.POL, "Regierungsbildung": F.POL, "Regierung": F.POL,
  "Bundeskanzleramt": F.SV, "Verwaltung": F.SV, "Bürokratie": F.SV, "Informationsfreiheitsgesetz": F.SV,
  "Open Data": F.SV, "Open Source": F.MED, "Digitalisierung": F.MED, "Digitales": F.MED,
  // Recht/Justiz vor "Verfassung"→POL
  "Bundesverfassungsgericht": F.R, "Europäischer Gerichtshof": F.R, "Internationaler Strafgerichtshof": F.AP,
  "Justiz": F.R, "Justizvollzug": F.R, "Recht": F.R, "Rechtsstaat": F.POL, "Rechtsstaatlichkeit": F.POL,
  // Sicherheit
  "Verfassungsschutz": F.IS, "Innere Sicherheit": F.IS, "Inneres": F.IS, "Sicherheit": F.IS,
  "Innenpolitik": F.IS, "Geheimdienste": F.IS, "Nachrichtendienst": F.IS, "BND": F.IS,
  "Bundesnachrichtendienst": F.IS, "NSA": F.IS, "Spionage": F.IS,
  // Gesundheit
  "Cannabis": F.G, "Drogenpolitik": F.G, "Drogen": F.G, "Legalisierung": F.G, "ME/CFS": F.G,
  "Long Covid": F.G, "Post-Vac-Syndrom": F.G, "Psychotherapie": F.G, "Homöopathie": F.G,
  "Bürgerversicherung": F.G, "Krankenkasse": F.G, "Krankenversicherung": F.G,
  "gesetzliche Krankenversicherung": F.G, "private Krankenversicherung": F.G, "Pflege": F.G,
  "Pflegeversicherung": F.G, "Organspende": F.G, "Sterbehilfe": F.G, "Triage": F.G,
  // Soziale Sicherung
  "Bürgergeld": F.SOZ, "Hartz IV": F.SOZ, "Grundsicherung": F.SOZ, "Sozialversicherung": F.SOZ,
  "Sozialleistungen": F.SOZ, "Soziales Sicherungssystem": F.SOZ, "Soziales": F.SOZ, "Sozialpolitik": F.SOZ,
  "Soziale Politik": F.SOZ, "soziale Gerechtigkeit": F.SOZ, "Soziale Ungleichheit": F.SOZ,
  "Soziale Marktwirtschaft": F.W, "Sozialabgaben": F.SOZ, "Armut": F.SOZ, "Altersarmut": F.SOZ,
  // Außenpolitik (Länder/Konflikte)
  "Israel": F.AP, "Gaza": F.AP, "Palästina": F.AP, "Iran": F.AP, "Ukraine": F.AP, "Russland": F.AP,
  "USA": F.AP, "China": F.AP, "Krieg": F.AP, "Frieden": F.AP, "Friedenspolitik": F.AP, "Sanktionen": F.AP,
  "Völkerrecht": F.AP, "Menschenrechte": F.AP, "humanitäre Hilfe": F.AP, "Diplomatie": F.AP,
  "Nordstream 2": F.AP, "Nordstream-Pipeline": F.AP, "Assange": F.MED,
  // Verteidigung
  "Bundeswehr": F.VTG, "Waffenexporte": F.VTG, "Rüstungspolitik": F.VTG, "Wehrpflicht": F.VTG,
  "Wehrdienst": F.VTG, "Verteidigungspolitik": F.VTG, "Militär": F.VTG, "NATO": F.VTG,
  "Atomwaffen": F.VTG, "Drohnen": F.VTG, "Waffen": F.VTG,
  // Energie vs Umwelt
  "Energie": F.EN, "Energiekosten": F.EN, "Erneuerbare Energie": F.EN, "Solarenergie": F.EN,
  "Atomkraft": F.EN, "Kernkraft": F.EN, "Kohleausstieg": F.EN, "Braunkohle": F.EN, "Energiewende": F.EN,
  "Klimaschutz": F.U, "Umweltschutz": F.U, "Naturschutz": F.U, "Klimawandel": F.U, "Klima": F.U,
  "Tierschutz": F.LW, "Tierhaltung": F.LW, "Landwirtschaft": F.LW,
  // Migration
  "Migration": F.MIG, "Staatsangehörigkeit": F.MIG, "Staatsbürgerschaft": F.MIG,
  "Doppelte Staatsbürgerschaft": F.MIG, "Einbürgerung": F.MIG, "Flüchtlingspolitik": F.MIG,
  "Asylpolitik": F.MIG, "Asyl": F.MIG, "Geflüchtete": F.MIG, "Abschiebung": F.MIG, "Integration": F.MIG,
  // Verkehr
  "Verkehr": F.VK, "ÖPNV": F.VK, "Bahnverkehr": F.VK, "Autoverkehr": F.VK, "Tempolimit": F.VK,
  "E-Mobilität": F.VK, "Mobilität": F.VK, "Deutschlandticket": F.VK,
  // Bau/Wohnen
  "Wohnen": F.BAU, "Miete": F.BAU, "Wohnraum": F.BAU, "Wohnungsbau": F.BAU, "Mietpreisbremse": F.BAU,
  "Bauplanung": F.BAU, "Infrastruktur": F.BAU,
  // Finanzen/Steuern
  "Finanzen": F.FIN, "Steuern": F.FIN, "Vermögenssteuer": F.FIN, "Schuldenbremse": F.FIN,
  "Cum-Ex-Skandal": F.FIN, "Sondervermögen": F.FIN, "Haushalt": F.FIN, "Staatshaushalt": F.FIN,
  "Inflation": F.FIN, "Klimageld": F.FIN, "Energiepauschale": F.FIN, "Entlastungspaket": F.FIN,
  "Mobilitätsprämie": F.FIN, "#Mobilitätsprämie": F.FIN, "Fördermittel": F.FIN, "Subventionen": F.FIN,
  // Wirtschaft
  "Wirtschaft": F.W, "Verbraucherschutz": F.W, "Verbraucher": F.W, "Automobilindustrie": F.W,
  "Unternehmen": F.W, "Versicherungen": F.W,
  // Arbeit
  "Arbeit": F.AB, "Mindestlohn": F.AB, "Arbeitsmarkt": F.AB, "Arbeitslosigkeit": F.AB,
  "Fachkräftemangel": F.AB, "Arbeitsrecht": F.AB, "Arbeitsbedingungen": F.AB,
  // Bildung/Wissenschaft
  "Bildung": F.BIL, "Schulen": F.BIL, "Bildungspolitik": F.BIL, "Studium": F.BIL,
  "Wissenschaft": F.WIS, "Forschung": F.WIS, "Künstliche Intelligenz": F.WIS,
  // Gesellschaft
  "Familienpolitik": F.GES, "Familien": F.GES, "Frauen": F.GES, "Kinder": F.GES, "Jugend": F.GES,
  "Senioren:innen": F.SOZ, "Menschen mit Behinderung": F.GES, "LGBTQIA+": F.GES,
  "Selbstbestimmungsgesetz": F.GES, "Abtreibung": F.GES, "Schwangerschaftsabbruch": F.GES,
  "Antisemitismus": F.GES, "Rassismus": F.GES, "Rechtsextremismus": F.IS, "Rechtspopulismus": F.POL,
  "Gewalt": F.IS, "Kriminalität": F.IS, "Polizei": F.IS, "Terrorismus": F.IS,
  // Kultur / Medien
  "Kultur": F.KUL, "Medien": F.MED, "Journalismus": F.MED, "Öffentlich-rechtlicher Rundfunk": F.MED,
  "Soziale Medien": F.MED, "Datenschutz": F.MED, "Chatkontrolle": F.MED, "Internet": F.MED,
  "Erinnerungspolitik": F.KUL, "Gedenktage": F.KUL,
  // Sport
  "Sport": F.SPT, "Fußball": F.SPT, "Tourismus": F.SPT, "Olympia": F.SPT,
  // EU
  "Europäische Union": F.EU, "EU": F.EU, "Europäische Flüchtlingspolitik": F.EU,
  // Entwicklung
  "Entwicklungspolitik": F.EZ,
  // Regional → ohne Sachbezug: Staat/Verwaltung (Regional/Lokal/Bundesländer)
  "Regionales": F.SV, "Lokales": F.SV, "Berlin": F.SV, "Deutschland": F.SV, "Internationales": F.AP,
  "Internationale Beziehungen": F.AP, "Zusammenarbeit": F.AP,
};

// ── REGELN: geordnet, First-Match. Spezifisch vor generisch. ────────────────
type Rule = [field: string, re: RegExp];
const RULES: Rule[] = [
  // ── PATCH: Eigennamen + Stämme (höchste Präzedenz) ──
  // Parteien & Politik-Kürzel
  [F.POL, /^(afd|cdu|csu|spd|fdp|union|groko|ampel|jamaika|bsw|npd|dkp|mlpd|ödp|ssw|die partei|freie wähler|junge union|junge afd|werteunion|bündnisdeutschland|fpö|volksparteien|kleinparteien|linksbündnis|oppositionsparteien|mitgliedervereinigung|parteilinie|fraktion|sondierung|sperrminorität|unvereinbarkeitsbeschluss|bürgerrechte|politiker:in|politik|politisches engagement|politischer diskurs|meinungsbildung|umfragen|spenden|dialog|solidarität)$/i],
  [F.POL, /bündnis ?90|die grünen|die linke|grüne$|sahra wagenknecht|zentrum für politische schönheit/i],
  // Bundesländer / Städte / Regionen → Staat & Verwaltung
  [F.SV, /^(thüringen|sachsen|sachsen-anhalt|bayern|hessen|hamburg|bremen|berlin|brandenburg|niedersachsen|nordrhein-westfalen|nrw|rheinland-pfalz|saarland|schleswig-holstein|mecklenburg-vorpommern|baden-württemberg|ostdeutschland|westdeutschland|neue bundesländer|bundesländer|landespolitik|landtag|landtag sachsen|abgeordnetenhaus|bürgerschaft|kommune|kommunalpolitik|kommunale selbstverwaltung|köln|münchen|stuttgart|dresden|leipzig|düsseldorf|dortmund|essen|bonn|kiel|chemnitz|münster|neukölln|oberhausen|staat|bevölkerung|gerechtigkeit|investition|geld|einkommen|stadtbild|regionalplanung|nachbarschaft|großprojekte)$/i],
  // Weitere Länder (Europa + global) → Außenpolitik
  [F.AP, /^(griechenland|ungarn|polen|frankreich|italien|spanien|österreich|schweiz|niederlande|belgien|schweden|dänemark|norwegen|finnland|portugal|großbritannien|tschechien|rumänien|bulgarien|kroatien|slowakei|slowenien|litauen|lettland|estland|luxemburg|malta|zypern|irland|island|albanien|kanada|neuseeland|australien|japan|südkorea|thailand|indonesien|katalonien|schottland|handel|handelsembargo|flucht|europa)$/i],
  // Stämme, die die Hauptregeln knapp verfehlen
  [F.G, /krankenhäus|pauschale beihilfe/i],
  [F.SOZ, /rentn|^löhne?$|^lohnzahlung$|^lohnerhöhung$/i],
  [F.AB, /^löhne$/i],
  [F.VTG, /auslandseins/i],
  [F.LW, /^tiere?$|^hund|^haustier|forstwirt|holzwirt|bergbau/i],
  [F.U, /lärm|^thg$|thg-?quote/i],
  [F.R, /^eigentum$|wohnungseigentum/i],
  [F.GES, /^gesellschaft$|^sprache$|^sprachen$|sprachförder|^familienversicherung$|generationengerecht/i],
  [F.LW, /ländliche region/i],
  // PATCH 2: weitere klar zuordenbare Long-Tail-Tags
  [F.BIL, /^schüler|^jura$|handyverbot|^abschluss$|hochschulabschluss/i],
  [F.SOZ, /verteilungsgerecht|niedriglöhne|^mindestsicherung$/i],
  [F.R, /^beleidigung$|^bundesrecht$|^bußgelder$|^anzeige$|volksverhetz|berufsbetreuer/i],
  [F.POL, /^nazis$|^plagiat$|5\s*%|fünf-?prozent|^rechtsruck$|^wähler|^freiheit$|^staatsleistung|antifaschis|burschenschaft|^nationalsozialismus$/i],
  [F.IS, /^schwarzmarkt$|^is$|clans?$/i],
  [F.U, /fridays for future|^baumfäll|hambacher|^biodiversität$/i],
  [F.W, /^post$|^konsumgesellschaft$|^kapital$|privatanleger|kleinunternehmer/i],
  [F.FIN, /sparmaßnahmen|^erben$|staatliche beihilfe|^ölpreis$|krisenbonus|finanztransaktion/i],
  [F.BAU, /straßenausbaubeitr|öffentlicher raum|^ber$|flughafen ber/i],
  [F.MED, /informationstechnik|^echo$/i],
  [F.SV, /^zeitumstellung$|^sommerzeit$|föderalismus|förderalismus|^modernisierung$|^krisenpolitik$/i],
  [F.AP, /^grönland$|balkan|epstein/i],
  [F.GES, /^scharia$|scharia polizei|^care-?arbeit$|säkular/i],
  [F.G, /rehabilitation|^endometriose$/i],


  // ── Gesundheit ──
  [F.G, /corona|covid|pandemie|infektion|impf|masken?|2g|3g|lockdown|quarantäne|omikron|inzidenz|rki|übersterblichkeit|genesen|totimpf|testpflicht|nebenwirkung|long ?covid|post-?vac|querdenk/i],
  [F.G, /gesundheit|krankenhaus|krankenkasse|krankenversicher|pflege|psych|therapie|arznei|medikament|medizin|apotheke|ärzt|arzt|heilprakt|hebamme|homöo|patient|krebs|krankheit|sucht|cannabis|drogen|alkohol|tabak|zigaret|rauch|nikotin|e-?zigaret|cbd|thc|organspende|sterbehilfe|suizid|selbsttötung|impfpflicht|gesundheitsfach|pflegegeld|rettungsdienst|rettungskräfte|intensivstation|triage|ärztemangel|endometriose|demenz|übergewicht|vitamin|blutspend|e-?rezept|telemedizin|widerspruchlösung|elektronische patientenakte|chronische krankheit|multiresistent|keime|palliativ|pallativ|psychatrie/i],
  // ── Soziale Sicherung ──
  [F.SOZ, /rente|altersvorsorge|altersarmut|alterssicher|altersversorg|grundeinkommen|bürgergeld|hartz|grundsicher|sozialleistung|sozialhilfe|sozialversicher|sozialabgab|wohngeld|kindergrundsicher|kindergeld|elterngeld|mütterrente|witwenrente|opferrente|betriebsrente|aktivrente|aktienrente|generationenkapital|erwerbsminderung|erwerbsunfähigk|altersgeld|grundrente|mindestsicher|existenzminimum|armut|altersdiskrimin|alleinerziehend|obdachlos|wohnungslos|tafeln|krankengeld|pflegegeld|beitragsbemessung|vorruhestand|übergangsgeld|aufstockung/i],
  // ── Verteidigung ──
  [F.VTG, /bundeswehr|wehrpflicht|wehrdienst|soldat|veteran|rüstung|waffenexport|verteidigung|militär|nato|abrüst|aufrüst|atomwaffe|drohne|kampf|panzer|marine|munition|abwehrsystem|kriegsmittel|kriegsmittelbeseit|hybride krieg|zwangsrekrut|2%-rüstung|2 %|dienstpflicht|gesellschaftsjahr|soziales pflichtjahr|sozialer pflichtdienst|zivildienst|bundesfreiwillig|freiwilliges soziales/i],
  // ── Außenpolitik (Länder + Konflikte + intl. Orgs) ──
  [F.AP, /\b(israel|gaza|palästin|iran|irak|syrien|afghanistan|ukraine|russ|putin|china|usa|nordkorea|taiwan|hongkong|hong kong|türkei|erdogan|aserbaidschan|armenien|bergkarabach|venezuela|kuba|libyen|libanon|jemen|sudan|somalia|ägypten|saudi|katar|vereinigte arabische|afrika|asien|südamerika|lateinamerika|brasilien|argentinien|chile|kolumbien|peru|mexiko|nicaragua|indien|pakistan|nigeria|uganda|kenia|äthiopien|myanmar|vietnam|moldau|belarus|georgien|kosovo|serbien|bosnien|kurden|kurdistan|pkk|uiguren|jesid|herero|graue wölfe)\b/i],
  [F.AP, /außenpolitik|außenwirtschaft|völkerrecht|völkermord|menschenrecht|humanitär|diplomat|sanktion|krieg|frieden|nahost|naher osten|westjordanland|zwei-?staaten|imperialismus|kolonial|auswärtig|nordstream|netanjahu|trump|macron|oligarch|hamas|taliban|swift|reparation|auslieferung|geopolit|weltordnung|staatsräson|unrwa|unhcr|\bun\b|\buno\b|vereinte nationen|who\b|internationaler strafgerichts/i],
  // ── Entwicklungspolitik ──
  [F.EZ, /entwicklungspolitik|entwicklungshilfe|entwicklungszusammen|fluchtursach|oda\b/i],
  // ── Energie ──
  [F.EN, /energie|strom|solar|photovoltaik|windkraft|windenerg|erneuerbar|eeg|netzausbau|netzentgelt|atomkraft|atommüll|atom\b|kernkraft|kernfusion|kohle|braunkohle|gas\b|erdgas|lng|flüssiggas|wasserstoff|biogas|bioenergie|fracking|fossil|öl\b|erdöl|heizöl|kraftwerk|stromnetz|stromsteuer|strompreis|spritpreis|benzinpreis|tankrabatt|gaspreis|ökostrom|balkonkraftwerk|batteriespeicher|energiespeicher|geothermie|fernwärme|wärmepumpe|wärmewende|nachtspeicher|blackout|versorgungssicher|energiesicher|energieimport|energieunion|kohlekraftwerk|emissionshandel|emissionszert|netznutz/i],
  // ── Umwelt ──
  [F.U, /klima|umwelt|naturschutz|artenschutz|artenviel|biodivers|insekt|wald|forst|wolf|wölfe|gewässer|wasser|meer|ostsee|elbe|grundwasser|trinkwasser|abwasser|hochwasser|flut|ahrtal|müll|abfall|recycling|plastik|mikroplastik|pfand|pfas|glyphosat|pestizid|pflanzenschutzmittel|chemikalien|schadstoff|feinstaub|luftverschmutz|luftreinhalt|nitrat|altlast|bodenschutz|co2|co₂|emission|treibhaus|nachhaltig|kreislaufwirt|dekarbon|geo-?engineering|regenwald|amazonas|hambacher|lützerath|tempelhofer feld|grünfläche|flächenversieg|umweltzone|fischerei|tierversuch|gentechnik|genfood|gen-?technik|gentech|radioaktiv|strahlung|hitze|klimaanpass|1.5|paris/i],
  // ── Landwirtschaft & Ernährung ──
  [F.LW, /landwirt|agrar|bauer|bäuer|tierhaltung|tierschutz|tiertransport|tierwohl|tierhandel|nutztier|massentierhaltung|fleisch|schwein|schweinepest|tierseuche|tiergesund|jagd|jäger|wildtier|düngung|pflanzenbau|ernährung|lebensmittel|bio-?produkt|ökolog|gastronom|haustier|hund\b|veganis|zucker|bauernverband/i],
  // ── Migration & Aufenthalt ──
  [F.MIG, /migration|asyl|flücht|geflücht|abschieb|rückführung|ausreise|einbürger|staatsangehörig|staatsbürger|mehrstaat|doppelpass|aufenthalt|einwander|zuwander|immigr|integrationskurs|sprachkurs|sprachnachweis|familiennachzug|ehegattennachzug|seenotrettung|moria|lesbos|herkunftsländer|drittstaat|dublin|schengen|grenzkontrolle|grenze\b|grenzen\b|obergrenze|bezahlkarte|chancenkarte|niederlassungserlaubnis|visa\b|visum|ausweisdokument|ausländerrecht|deportation|fremdenfeind|migrationshintergrund|ortskräfte|staatenlos|verfolgte|einreiseverbot/i],
  // ── Verkehr ──
  [F.VK, /verkehr|öpnv|nahverkehr|bahn\b|bahntick|schiene|deutsche bahn|\bdb\b|zug\b|nachtzug|deutschlandtakt|stuttgart 21|auto\b|autobahn|straßenbau|straßen\b|bundesstraße|pkw|lkw|maut|tempo|tempolimit|fahrrad|radverkehr|radtour|fußgäng|fußverkehr|e-?scooter|e-?mobil|elektromobil|elektrofahrzeug|hybridauto|verbrennungsmotor|e-?fuel|synthetische kraftstoff|automobil|motorrad|motorsport|taxi|flugverkehr|flugbetrieb|flughafen|fluglärm|nachtflug|luftfahrt|flugtaxi|schifffahrt|schiffsverkehr|hafen|binnenwasserstraß|wasserstraße|güterverkehr|logistik|spedition|führerschein|mpu|verkehrssicher|fahrverbot|parkplatz|parkplätze|ladeinfra|ladestrom|deutschlandticket|49-?euro|9-?euro|autonomes fahren|abwrackprämie|umweltprämie|zoll\b|trasse|elbvertiefung|ortsumgehung|stvo|straßenverkehr|abgasaffäre|dieselgate|kfz-?steuer|kfz\b|diesel|benzin|kerosin|pendlerpauschale|verkehrswende/i],
  // ── Bau, Wohnen, Raumordnung ──
  [F.BAU, /wohn|miete|mietrecht|mietpreis|mietendeckel|indexmiete|immobil|baurecht|bauplan|bauordnung|baukinder|bauen|sozialwohnung|sozialer wohnungsbau|wohnraum|wohnungsmarkt|wohnungsnot|leerstand|gentrifizier|stadtentwicklung|stadtplanung|städtebau|denkmalschutz|denkmal|baumschutz|grunderwerb|grundsteuer|nebenkosten|sanierung|heizung|gasheizung|heizkosten|heizofen|nachtspeicher|gebäudeenergie|\bgeg\b|kleingärten|enteignung|kommunale daseinsvorsorge|infrastruktur|breitband|glasfaser|mobilfunk|5g\b|netz\b|wlan|telekommunikation/i],
  // ── Öffentliche Finanzen & Steuern ──
  [F.FIN, /steuer|abgabe|haushalt|schulden|schuldenbremse|sondervermögen|inflation|finanz(?!gericht)|bank|aktie|börse|kapitalert|zins|geldpolitik|geldwäsche|bargeld|euro\b|währung|finanzmark|finanzkrim|finanzkrise|spareinlage|sparer|fördermittel|fördergeld|subvention|zuwendung|bürgschaft|cum-?ex|wirecard|steueroas|steuervermeid|steuerhinterzieh|geldwäsch|übergewinn|vermögensregister|soli\b|solidaritätszuschlag|grundfreibetrag|kindergeld|klimageld|energiepauschale|mobilitätsprämie|entlastungspaket|tankrabatt|krisenbonus|soforthilfe|härtefallfonds|öffentliche ausgabe|staatsgeld|steuergeld|steuerverschwend|dienstwagen|reisekosten|bruttoinlandsprod|länderfinanzausgleich|finanztransakt|digitalsteuer|kapitalismus|reichtum|wohlstand|vergütung|bezahlung|lohnsteuer|einkommenssteuer|einkommensteuer|mehrwertsteuer|umsatzsteuer|erbschaft|grunderwerbssteuer|spitzensteuer|doppelbesteuer|ehegattensplitting|kirchensteuer|tamponsteuer|zuckersteuer|verlustverrechn|termingeschäft|sparerpausch|bundesbank|zentralbank|ezb|staatsanleihe|euro-?bond|transferunion|währungsunion|rettungsschirm|finanzaufsicht|schufa|kredite|insolvenz|inflations|edelmetall|gold\b|bitcoin|krypto|digitales geld/i],
  // ── Wirtschaft ──
  [F.W, /wirtschaft|industrie|mittelstand|handwerk|unternehmen|gründ|start-?up|selbständ|selbstständ|solo-?selbst|kleinunternehm|gewerbe|einzelhandel|online-?handel|handelskammer|verbraucher|wettbewerb|kartell|marktwirtschaft|liberalis|privatisier|verstaatlich|rekommunal|globalis|außenhandel|freihandel|handelsabkommen|handelspolitik|export|import|zoll|ceta|ttip|tisa|jefta|mercosur|lieferkette|rohstoff|standort|wettbewerbsfähig|konjunktur|wachstum|patent|aufsichtsrat|genossenschaft|pharmaind|big tech|google|amazon|tik ?tok|telegram|twitter|elon musk|vw\b|wirtschaftsförder|wirtschaftsmin/i],
  // ── Arbeit & Beschäftigung ──
  [F.AB, /arbeit(?!geber.*kammer)|mindestlohn|lohn|gehalt|tarif|gewerkschaft|streik|mitbestimm|betriebsrat|kurzarbeit|minijob|leiharbeit|teilzeit|home-?office|befristung|fachkräft|qualifizier|weiterbildung|arbeitslos|jobcenter|arbeitsvermittl|arbeitsschutz|arbeitsbeding|arbeitszeit|vereinbarkeit|equal pay|lohngleich|niedriglohn|lohndumping|karenzzeit|arbeitsmin|bundesagentur für arbeit|beschäftig|erwerbsbeteilig|24h|25h|vier-?tage|sozialpartner|mutterschutz|vaterschaft/i],
  // ── Bildung & Erziehung ──
  [F.BIL, /bildung|schule|schul|lehr|unterricht|kita|kindergarten|kindertagespflege|kinderbetreuung|frühkindlich|ganztag|gymnasium|grundschul|förderschul|gemeinschaftsschul|abitur|bafög|studium|student|hochschul|universit|akademisier|berufsschul|berufschul|berufsbild|ausbildung|duale|erzieh|jugendhilfe|jugendamt|kinder- und jugend|jugendarbeit|mint|lehramt|lehrplan|studiengebühr|schulgebühr|schulpflicht|präsenzpflicht|politische bildung/i],
  // ── Wissenschaft, Forschung, Technologie ──
  [F.WIS, /wissenschaft|forschung|innovation|raumfahrt|weltraum|kernfusion|künstliche intelligen|\bki\b|technologie|patente|schlüsseltechno/i],
  // ── Medien, Kommunikation, IT ──
  [F.MED, /medien|presse|journalis|rundfunk|gez\b|öffentlich-?recht|fake-?news|desinformation|propaganda|verschwörung|soziale medien|social media|soziale netzwerk|netzwerkdurch|plattform|datenschutz|datensicher|chatkontrolle|vorratsdaten|überwachung|videoüberwach|gesichtserkenn|staatstrojaner|uploadfilter|urheberrecht|internet|digital|netzneutral|it-?sicher|cyber|hackerangr|verschlüssel|impressums|hatespeech|hassnachricht|hasskriminal|digitale gewalt|social scoring|palantir|snowden|big tech|meinungsfreiheit|pressefreiheit|zensur|lügenpresse|trollfarm|bots|correctiv|werbung|werbeverbot|videospiel|e-?sport|echo\b|anonymität|digital id|e-?partizip/i],
  // ── Innere Sicherheit ──
  [F.IS, /\bpolizei|kriminal|straftat|verbrechen|terror|islamism|extremism|reichsbürger|rechtsextrem|linksextrem|nsu\b|npd|clan|mafia|bandenkriminal|gewalt(?!enteil)|messer|waffenrecht|waffenverbot|katastrophenschutz|bevölkerungsschutz|feuerwehr|\bthw\b|brandschutz|razzia|gefährder|stalking|einbruch|betrug|bestechung|bestechlich|schmuggel|menschenhandel|zwangsarbeit|verfassungsschutz|geheimdienst|spionage|sabotage|inneres|innenmin|sicherheitspol|polizeigew|polizeiaufgab|versammlungs|demonstration|proteste|aktivismus|ziviler ungehorsam|letzte generation|kindesmiss|kinderporno|kinderschutz|jugendschutz|jugendkriminal|strafmündig|gefängnis|haftstraf|haftung|justizvollzug|staatsanwalt|polizeigesetz/i],
  // ── Recht / Justiz ──
  [F.R, /\brecht\b|justiz|gericht|richter|anwalt|notar|strafrecht|strafverfahren|strafvollzug|zivilrecht|familienrecht|erbrecht|verbraucherrecht|gesetzgeb|gesetzentwurf|gesetz\b|rechtspolitik|verfassungsger|grundgesetz|todesstrafe|sammelklage|klage|gerichtsverfahren|schiedsgericht|sorgerecht|unterhalt|abstammungsrecht|namensänderung|adoption|leihmutter|judikative|legislative|exekutive|gewaltenteil|verträge|auslieferung/i],
  // ── Europapolitik ──
  [F.EU, /\beu\b|europäische union|europapolitik|europawahl|eu-?parlament|eu-?kommission|europäische kommission|eu-?rat|eu-?recht|eu-?richtlinie|eu-?außengrenz|eu-?erweiter|eu-?skepsis|eu-?mercosur|europäische integration|europäische zentralbank|brexit|euro-?krise|griechenlandkrise|bankenunion|subsidiar|freizügigk|schengen|frontex|europäische verteidig|deutsch-?französisch|föderalismus europa/i],
  // ── Verteidigung-Reste fällt schon oben ──
  // ── Gesellschaftspolitik / soziale Gruppen ──
  [F.GES, /familie|eltern|kind(?!ergart)|jugend|frauen|gleichstell|gleichberechtig|geschlecht|feminis|männerrecht|gender|queer|lgbt|lsbt|homosex|transgender|transsex|nicht-?binär|neurodivers|intersex|selbstbestimmung|schwangerschaft|abtreibung|schwangerschaftsabbruch|reproduktiv|ehe\b|ehe für alle|gleichgeschlecht|lebenspartner|care-?arbeit|hausfrau|haushaltshilf|senior|alter\b|behind|inklusion|barrierefrei|teilhabe|eingliederungshilfe|werkstätten|antisemit|rassism|diskriminier|antidiskrimin|chancengleich|diversität|sexism|sexuali|sexarbeit|prostitution|nordisches modell|häusliche gewalt|sexualisierte gewalt|sexuelle belästig|femizid|feminizid|genitalverstüm|beschneidung|frauenhaus|frauenquote|kopftuch|burka|verschleier|religion|islam|christentum|judentum|kirche|katholisch|evangelisch|säkular|scientology|sekten|glaube|religionsfrei|religionsunterricht|ehrenamt|engagement|vereine\b|gemeinwohl|generationengerecht|demografie|demographie|einsamkeit|obdachlos|pflegende angehörige|sorgerecht|pflegekind|betreuung|betreuungsgeld|adoption|leihmutter|eizellspende|kinderschutz|kindeswohl|jugendschutz|mobbing|toleranz|menschenwürde|minderheiten|stigma|altersdiskrimin/i],
  // ── Kultur ──
  [F.KUL, /kultur|kunst|museum|musik|film|kreativwirt|theater|denkmal|gedenk|erinnerung|holocaust|nationalsozialismus|nsdap|ddr|stasi|sed|deutsche einheit|kolonial|restitution|kulturgut|bibliothek|berlinale|oktoberfest|panoramafrei|satire|architektur/i],
  // ── Sport, Freizeit, Tourismus ──
  [F.SPT, /sport|fußball|olympia|spitzensport|sportstätt|schwimmbad|bäder|stadion|tourismus|reisen|freizeit|festival|großveranstalt|sportwett|glücksspiel|feuerwerk|böller|silvester|zirkus|feiertag|ferien|oktoberfest/i],
  // ── Politisches Leben, Parteien (Auffang für Politik-Meta) ──
  [F.POL, /partei|wahl|fraktion|koalition|abgeordnet|mandat|bundestag|parlament|diäten|nebeneink|nebentätig|nebenverdienst|lobby|abstimmungsverhalt|antwortverhalt|kandidat|opposition|regierungsbild|sondierung|misstrauensvotum|vertrauensfrage|neuwahl|amtszeit|immunität|legislaturperiode|geschäftsordnung|untersuchungsausschuss|ausschüsse|gewaltenteil|bundesrat|bundeswahl|sperrklausel|prozent-?hürde|wahlbeteilig|politikverdross|volksabstimm|volksentscheid|referendum|bürgerentscheid|bürgerräte|bürgerbeteilig|direkte demokratie|basisdemokratie|petition|change.org|campact|attac|greenpeace|grundgesetz|verfassung|grundrecht|freiheitsrecht|rechtsstaat|demokratie|postenvergabe|parteispend|parteifinanz|parteivorsitz|kanzlerkandidat|bundeskanzler|bundespräsident|ministerpräsident|minister|bundesregierung|nationalismus|patriotismus|populismus|faschismus|antifa|kommunismus|sozialismus|liberalismus|anarchismus|marxismus|neoliberalismus|werte\b|werteunion|burschenschaft|identitäre|monarchie|adel\b|reichsbürger|souveränität|neutralität|staatsstreich|revolution|rosa luxemburg|steinmeier|merkel|scholz|merz|lauterbach|höcke|aiwanger|maaßen|kemmerich|wagenknecht/i],
  // ── Staat & Verwaltung (Auffang) ──
  [F.SV, /verwaltung|behörd|bürokratie|transparenz|informationsfrei|aktenzugang|register|e-?government|digitale verwaltung|öffentlicher dienst|beamt|pension|besoldung|kommun|landkreis|bundesland|bundesländer|föderalismus|landespolitik|landtag|kommunalpolitik|gemeinde|stadt\b|bezirk|zensus|statistik|bundesverdienstkreuz|ehrensold|bundeswahlleiter|rechenschaft|kontrolle|regulierung|reform|gemeinnützig|stiftung|ngo|zivilgesellschaft|whistleblow|legitimation|partizipation/i],
];

// ── Anwenden ────────────────────────────────────────────────────────────────
const tags = db.prepare(
  `SELECT label, COUNT(*) c FROM aw_question_topics GROUP BY label`
).all() as { label: string; c: number }[];

type Out = { label: string; feld: string | null; source: string; c: number };
const results: Out[] = tags.map((t) => {
  const lbl = t.label;
  if (OVERRIDE[lbl]) return { label: lbl, feld: OVERRIDE[lbl], source: "override", c: t.c };
  for (const [feld, re] of RULES) if (re.test(lbl)) return { label: lbl, feld, source: "rule", c: t.c };
  return { label: lbl, feld: null, source: "unmapped", c: t.c };
});

// ── Report ───────────────────────────────────────────────────────────────────
const totalInst = tags.reduce((s, t) => s + t.c, 0);
const mappedInst = results.filter((r) => r.feld).reduce((s, r) => s + r.c, 0);
const unmapped = results.filter((r) => !r.feld).sort((a, b) => b.c - a.c);
console.log(`Tags: ${tags.length} · davon zugeordnet: ${results.filter((r) => r.feld).length} · unmapped: ${unmapped.length}`);
console.log(`Tag-Instanzen: ${totalInst} · abgedeckt: ${mappedInst} (${(100 * mappedInst / totalInst).toFixed(1)}%)`);
console.log(`Quellen: override ${results.filter((r) => r.source === "override").length} · rule ${results.filter((r) => r.source === "rule").length}`);
console.log(`\nVerteilung über Felder (Tag-Instanzen):`);
const perFeld = new Map<string, number>();
for (const r of results) if (r.feld) perFeld.set(r.feld, (perFeld.get(r.feld) ?? 0) + r.c);
[...perFeld.entries()].sort((a, b) => b[1] - a[1]).forEach(([f, c]) =>
  console.log(`  ${String(c).padStart(7)}  ${f}`));
console.log(`\nTop unmapped (freq → tag), die noch eine Regel/Override brauchen:`);
unmapped.slice(0, 60).forEach((r) => console.log(`  ${String(r.c).padStart(5)}  ${r.label}`));

// ── Schreiben ────────────────────────────────────────────────────────────────
if (!DRY) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS aw_tag_themenfeld (
      label TEXT PRIMARY KEY,
      feld TEXT,                -- NULL = unmapped (kein Feld zugeordnet)
      source TEXT NOT NULL,     -- override | rule | unmapped
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  const ins = db.prepare(
    `INSERT INTO aw_tag_themenfeld (label, feld, source) VALUES (@label, @feld, @source)
     ON CONFLICT(label) DO UPDATE SET feld=@feld, source=@source, created_at=datetime('now')`
  );
  const tx = db.transaction(() => { for (const r of results) ins.run({ label: r.label, feld: r.feld, source: r.source }); });
  tx();
  console.log(`\n✅ ${results.length} Zeilen in aw_tag_themenfeld geschrieben.`);
} else {
  console.log(`\n(--dry: nichts geschrieben)`);
}
