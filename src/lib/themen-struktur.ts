/**
 * BT-Themen-Struktur fürs UI: 14 Anzeige-Oberthemen (User+Gemini 2026-06-12)
 * über den 25 Klassifikations-Feldern mit ihren 202 Unterthemen.
 * Daten-Korn = ds_unterthemen (feld, unterthema) — die Gruppierung hier ist
 * reine ANZEIGE-Entscheidung (jederzeit änderbar, kein Re-Lauf nötig).
 * GENERIERT aus docs/themen-taxonomie-bt.md.
 */
export const TAXONOMIE: Record<string, readonly string[]> = {
  "Wirtschaft": [
    "Industrie- & Standortpolitik",
    "Außenhandel, Zölle & Rohstoffe",
    "Digital- & KI-Wirtschaft",
    "Energiewirtschaft & Energiekosten",
    "Lieferketten & Unternehmensverantwortung",
    "Wirtschaftsförderung & Subventionen",
    "Mittelstand, Handwerk & Gründung",
    "Fachkräfte & Arbeitsmarkt-Wirtschaft",
    "Verbraucherschutz",
    "Konjunktur, Wachstum & Gesamtsteuerung",
    "Wettbewerb & Kartellrecht",
  ],
  "Innere Sicherheit": [
    "Extremismus & Verfassungsschutz",
    "Kriminalitätslage & Kriminalstatistik",
    "Polizei, Befugnisse & Überwachung",
    "Cybersicherheit, Spionage & hybride Bedrohungen",
    "Hasskriminalität & Schutz gefährdeter Gruppen",
    "Terrorismus & Islamismus",
    "Gewaltschutz & Sexualdelikte",
    "Wirtschafts- & Finanzkriminalität",
    "Bevölkerungsschutz, Waffenrecht & öffentliche Ordnung",
  ],
  "Öffentliche Finanzen, Steuern und Abgaben": [
    "Steuerpolitik & Steuerrecht",
    "Bundeshaushalt, Schulden & Sondervermögen",
    "Steuervollzug, Zoll & Finanzkriminalität",
    "Finanzmarkt, Banken & Finanzaufsicht",
    "Öffentliche Ausgaben & Behördenkosten-Transparenz",
    "Förderprogramme, Zuwendungen & Bürgschaften",
    "Bund-Länder- & Kommunalfinanzen",
    "EU- & internationale Finanzpolitik",
  ],
  "Recht": [
    "Strafrecht & Strafverfahren",
    "Strafverfolgung, Kriminalstatistik & Wirtschaftskriminalität",
    "Strafvollzug & Strafvollstreckung",
    "Opferschutz & Gewaltschutz",
    "Zivil-, Familien- & Verbraucherrecht",
    "Justizsystem, Gerichte & Digitalisierung der Justiz",
    "Rechtsangelegenheiten & Rechtspolitik der Bundesbehörden",
  ],
  "Staat und Verwaltung": [
    "Transparenz, Informationsfreiheit & Aktenzugang",
    "Lobbyismus & Interessenkonflikte",
    "Externe Beratung, Gutachten & Regierungskommunikation",
    "Staatliche Förderungen & Zuwendungskontrolle",
    "Bürokratieabbau & Verwaltungsvereinfachung",
    "Digitale Verwaltung & Register",
    "Parlament, Wahlen & Geschäftsordnung",
    "Bundesbehörden, Personal & Ressortberichte",
  ],
  "Medien, Kommunikation und Informationstechnik": [
    "Digitale Verwaltung, Justiz & Staatsmodernisierung",
    "Cybersicherheit & kritische Infrastrukturen",
    "Plattformen, digitale Dienste & Online-Werbung",
    "Datenschutz, Überwachung & Bürgerrechte",
    "KI & digitale Infrastruktur",
    "Online-Kriminalität, Deepfakes & digitale Gewalt",
    "Krypto-Regulierung & digitale Finanzen",
  ],
  "Gesundheit": [
    "Corona-Aufarbeitung, Impfen & Pandemiefolgen",
    "Infektionsschutz & öffentlicher Gesundheitsdienst",
    "Krankenhäuser & Versorgungsstrukturen",
    "Notfall- & Rettungsversorgung, Krisenresilienz",
    "Prävention, Ernährung & Umweltgesundheit",
    "Psychische Gesundheit, Sucht & Cannabis",
    "Arzneimittel, Apotheken & Medizinprodukte",
    "Pflege",
    "Kranken- & Pflegeversicherung: Finanzierung & Beiträge",
  ],
  "Umwelt": [
    "Klimapolitik, Klimaziele & CO₂-Speicherung",
    "Klimaanpassung, Wasser & Extremwetter",
    "Naturschutz, Artenvielfalt & Wildtiere",
    "Meeres- & Gewässerschutz",
    "Kreislaufwirtschaft, Abfall & Recycling",
    "Chemikalien, Luftreinhaltung & Altlasten",
    "Atommüll, Endlager & nukleare Sicherheit",
    "Umweltrecht, Verbände & Genehmigungsverfahren",
  ],
  "Energie": [
    "Erneuerbarer Strom: Wind, Solar & EEG",
    "Stromnetze, Netzausbau & Systemstabilität",
    "Energiepreise, Energiesteuern & Entlastungen",
    "Gasversorgung, LNG & Import-Geopolitik",
    "Kernenergie & nukleare Brennstoffkette",
    "Wasserstoff, Bioenergie & erneuerbare Gase",
    "Versorgungssicherheit & kritische Infrastruktur",
    "Wärmewende & Gebäudeenergie",
    "Kraftwerke, Kohleausstieg & Staatsbeteiligungen",
  ],
  "Landwirtschaft und Ernährung": [
    "Agrarförderung, GAP & ländliche Entwicklung",
    "Pflanzenschutz, Düngung & Pflanzenbau",
    "Tierhaltung, Tierschutz & Stallumbau",
    "Tiergesundheit & Tierseuchen",
    "Wolf, Jagd & Wildtiermanagement",
    "Agrarmärkte, Erzeugerpreise & Lieferketten",
    "Ernährungspolitik, Lebensmittelsicherheit & Kennzeichnung",
    "Flächen, Boden & Ernährungssicherung",
    "Betriebe, Agrarsoziales, Steuern & Bürokratie",
  ],
  "Außenpolitik und internationale Beziehungen": [
    "Naher Osten (Israel/Gaza, Iran, Syrien)",
    "Ukraine, Russland & Sanktionen",
    "Außenwirtschaft, Handel & Rohstoffe",
    "Menschenrechte & bilaterale Länderbeziehungen",
    "Auswärtiger Dienst, Kultur- & Bildungsaußenpolitik",
    "UN, NATO & internationale Organisationen",
    "Bundeswehr-Auslandseinsätze & Missionsmandate",
    "Rüstungsexporte & Waffenexportkontrolle",
  ],
  "Europapolitik und Europäische Union": [
    "Deutsch-französische & Nachbarschafts-Kooperation",
    "Umsetzung von EU-Recht in deutsches Recht",
    "Laufende EU-Regulierung & deutsche Verhandlungsposition",
    "Euro, Bankenunion & Finanzstabilität",
    "EU-Dokumente & parlamentarische Europa-Befassung",
    "EU-Haushalt, Fonds & Förderprogramme",
    "Subsidiarität & Kompetenzverteilung",
    "EU-Asyl, Grenzen & Freizügigkeit",
  ],
  "Entwicklungspolitik": [
    "Projekt-Transparenz, Mittelkontrolle & Evaluierung",
    "Durchführungsorganisationen, Stiftungen & NGOs",
    "ODA-Finanzierung, Haushalt & Schulden",
    "Flucht, humanitäre Hilfe & Wiederaufbau",
    "Gender, Frauen & LGBTIQ in der EZ",
    "Bildung, Ausbildung & Freiwilligendienste",
    "Multilaterale EZ, Entwicklungsbanken & globale Gesundheit",
    "Handel, Wirtschaftspartnerschaften & Rohstoffe",
  ],
  "Arbeit und Beschäftigung": [
    "Mindestlohn & Schwarzarbeitskontrolle",
    "Tarifbindung, Gewerkschaften & Mitbestimmung",
    "Grundsicherung, Jobcenter & Arbeitsvermittlung",
    "Fachkräfte, Qualifizierung & Weiterbildung",
    "Arbeitsschutz & Arbeitsbedingungen",
    "Erwerbsbeteiligung, Arbeitszeit & Vereinbarkeit",
    "Arbeitsmarktintegration & Sprachförderung Geflüchteter",
  ],
  "Soziale Sicherung": [
    "Rente & Alterssicherung",
    "Grundsicherung & Bürgergeld (Leistungsseite)",
    "Kranken- & Pflegeversicherung",
    "Armut & Lebenshaltungskosten",
    "Sozialleistungen für Geflüchtete & AsylbLG",
    "Teilhabe & Behinderung",
    "Engagement, Freiwilligendienste & soziale Hilfesysteme",
    "Sozialversicherung: Beiträge, Status & Verwaltung",
  ],
  "Bildung und Erziehung": [
    "Frühkindliche Bildung, Kita & Ganztag",
    "Schule, Schulklima & Gewaltprävention",
    "Lehrkräfte, Unterricht & digitale Bildung",
    "Berufliche Aus- & Weiterbildung",
    "Studienfinanzierung & BAföG",
    "Hochschule, Wissenschaft & Forschungsnachwuchs",
    "Integrations- & Sprachkurse",
    "Politische Bildung, Demokratieförderung & Erinnerungskultur",
    "Kinder- & Jugendhilfe & Freiwilligendienste",
  ],
  "Migration und Aufenthaltsrecht": [
    "Abschiebung, Rückführung & Ausreisepflicht",
    "Asylverfahren & Schutzstatus",
    "Sozialleistungen, Gesundheit & Unterbringung",
    "Arbeits- & Bildungsmigration",
    "Integrationskurse & Integrationsförderung",
    "Humanitäre Aufnahme & Aufnahmeprogramme",
    "Einbürgerung & Staatsangehörigkeit",
    "Familiennachzug & Aufenthaltstitel",
    "Grenze & irreguläre Migration",
  ],
  "Verkehr": [
    "Schienennetz, Bahnprojekte & Sanierung",
    "Straßenbau, Autobahnen & Brücken",
    "Wasserstraßen, Schifffahrt & Häfen",
    "E-Mobilität, Antriebe & Ladeinfrastruktur",
    "ÖPNV, Fahrgäste & Bahnhofsservice",
    "Straßenverkehrsrecht, Führerschein & Verkehrssicherheit",
    "Güterverkehr, Logistik & Maut",
    "Rad- & Fußverkehr",
  ],
  "Raumordnung, Bau- und Wohnungswesen": [
    "Wohnkosten, Sozialer Wohnungsbau & Wohnraumversorgung",
    "Mietrecht & Mieterschutz",
    "Kommunalfinanzen & kommunale Investitionen",
    "Wohnungsbau, Baurecht & Planungsbeschleunigung",
    "Gebäudeenergie, Heizung & Sanierung",
    "Bundesliegenschaften, Konversion & öffentliches Bauen",
    "Immobilien- & Wohnungssteuern",
  ],
  "Verteidigung": [
    "Rüstungsexporte & Exportkontrolle",
    "Abrüstung, Rüstungskontrolle & Kampfmittelräumung",
    "Auslandseinsätze & Mandate",
    "Ukraine-Unterstützung & Militärhilfe",
    "Personal, Wehrdienst & Veteranen",
    "Verteidigungshaushalt, Beschaffung & Rüstungsindustrie",
    "NATO, Bündnis & Stationierung",
    "Zivilverteidigung, Übungen & hybride Bedrohungen",
  ],
  "Gesellschaftspolitik, soziale Gruppen": [
    "Gleichstellung & Frauen in Führung",
    "Gewaltschutz & geschlechtsspezifische Gewalt",
    "Antisemitismus, Rassismus & Hasskriminalität",
    "Demokratie- & Antidiskriminierungs-Förderung",
    "Familienleistungen & Demografie",
    "Familienrecht & reproduktive Selbstbestimmung",
    "Kinder- & Jugendschutz, Jugendhilfe & Betreuung",
    "Inklusion & Barrierefreiheit",
    "Engagement, Ehrenamt & Freiwilligendienste",
  ],
  "Politisches Leben, Parteien": [
    "NGO-, Zivilgesellschafts- & Demokratieförderung",
    "Parlament: Geschäftsordnung, Gremien & Abgeordnetenrecht",
    "Regierungstransparenz & parlamentarisches Fragerecht",
    "Wahlen, Wahlrecht & Wahlprüfung",
    "Parteien: Finanzierung, Organisationen & parteinahe Stiftungen",
    "Lobbyismus & Interessenkonflikte",
    "Demokratiegeschichte, Gedenken & DDR-Aufarbeitung",
    "Immunität & Verfahren gegen Abgeordnete",
  ],
  "Wissenschaft, Forschung und Technologie": [
    "Forschungsförderung, Innovationsstrategie & -agenturen",
    "Gesundheits- & Medizinforschung",
    "Energie-, Klima- & Umweltforschung",
    "KI, Digital- & Schlüsseltechnologien",
    "Internationale Wissenschaftskooperation & EU-Forschungsraum",
    "Wissenschaftsfreiheit, -integrität & Wissenschaftsrecht",
    "Sicherheits- & Verteidigungsforschung, Forschungssicherheit",
    "Raumfahrt & Weltraum",
    "Forschungsdaten & Dateninfrastruktur",
  ],
  "Kultur": [
    "Erinnerungskultur, Gedenkstätten & Kriegsgräber",
    "Medien- & Plattformpolitik",
    "Kulturförderung & Kulturpreise",
    "Kulturgutschutz, Restitution & Kolonialerbe",
    "Film, Musik & Kreativwirtschaft",
    "Kultureinrichtungen, Museen & Bibliotheken",
    "Auswärtige Kulturpolitik & internationaler Austausch",
  ],
  "Sport, Freizeit und Tourismus": [
    "Olympiabewerbungen & Sportgroßveranstaltungen",
    "Spitzensport: Förderung, Reform & Athlet:innen",
    "Sportstätten & Bäder",
    "Teilhabe, Fairness & Schutz im Sport",
  ],
};

export interface Oberthema { name: string; slug: string; felder: readonly string[] }

export const OBERTHEMEN: readonly Oberthema[] = [
  { name: "Innere Sicherheit & Recht", slug: "innere-sicherheit-recht", felder: ["Innere Sicherheit", "Recht"] },
  { name: "Staat, Verwaltung & Demokratie", slug: "staat-verwaltung-demokratie", felder: ["Staat und Verwaltung", "Politisches Leben, Parteien"] },
  { name: "Außen, Verteidigung & Europa", slug: "aussen-verteidigung-europa", felder: ["Außenpolitik und internationale Beziehungen", "Europapolitik und Europäische Union", "Entwicklungspolitik", "Verteidigung"] },
  { name: "Finanzen, Steuern & Haushalt", slug: "finanzen-steuern-haushalt", felder: ["Öffentliche Finanzen, Steuern und Abgaben"] },
  { name: "Umwelt, Klima & Energie", slug: "umwelt-klima-energie", felder: ["Umwelt", "Energie"] },
  { name: "Arbeit & Soziales", slug: "arbeit-soziales", felder: ["Arbeit und Beschäftigung", "Soziale Sicherung"] },
  { name: "Verkehr, Bauen & Wohnen", slug: "verkehr-bauen-wohnen", felder: ["Verkehr", "Raumordnung, Bau- und Wohnungswesen"] },
  { name: "Migration & Integration", slug: "migration-integration", felder: ["Migration und Aufenthaltsrecht"] },
  { name: "Wirtschaft, Handel & Industrie", slug: "wirtschaft-handel-industrie", felder: ["Wirtschaft"] },
  { name: "Bildung & Wissenschaft", slug: "bildung-wissenschaft", felder: ["Bildung und Erziehung", "Wissenschaft, Forschung und Technologie"] },
  { name: "Gesundheit & Pflege", slug: "gesundheit-pflege", felder: ["Gesundheit"] },
  { name: "Digitalisierung & Netzpolitik", slug: "digitalisierung-netzpolitik", felder: ["Medien, Kommunikation und Informationstechnik"] },
  { name: "Gesellschaft, Kultur & Sport", slug: "gesellschaft-kultur-sport", felder: ["Gesellschaftspolitik, soziale Gruppen", "Kultur", "Sport, Freizeit und Tourismus"] },
  { name: "Landwirtschaft & Ernährung", slug: "landwirtschaft-ernaehrung", felder: ["Landwirtschaft und Ernährung"] },
];

// ── Anzeige-Merges (User 2026-06-12): Dubletten aus der Pro-Feld-Clusterung ──
// Die Unterthemen entstanden je Politikfeld; die Anzeige-Oberthemen bündeln mehrere
// Felder und stellten dadurch Doppelgänger nebeneinander (zweimal Auslandseinsätze,
// zweimal Rüstungsexporte, wortgleich Lobbyismus …). Merge = reine Anzeige-Schicht:
// die Quelle verschwindet aus dem Picker, ihre Drucksachen fließen dedupliziert ins
// Ziel, alte Quell-Slugs lösen aufs Ziel auf. ds_unterthemen bleibt unangetastet
// (kein LLM-Lauf). Sweep-Methodik: scripts/check-unterthemen-dupes.ts.
export const UNTERTHEMA_MERGES: ReadonlyArray<{
  von: { feld: string; unterthema: string };
  nach: { feld: string; unterthema: string };
}> = [
  { von: { feld: "Außenpolitik und internationale Beziehungen", unterthema: "Bundeswehr-Auslandseinsätze & Missionsmandate" }, nach: { feld: "Verteidigung", unterthema: "Auslandseinsätze & Mandate" } },
  { von: { feld: "Außenpolitik und internationale Beziehungen", unterthema: "Rüstungsexporte & Waffenexportkontrolle" }, nach: { feld: "Verteidigung", unterthema: "Rüstungsexporte & Exportkontrolle" } },
  { von: { feld: "Politisches Leben, Parteien", unterthema: "Lobbyismus & Interessenkonflikte" }, nach: { feld: "Staat und Verwaltung", unterthema: "Lobbyismus & Interessenkonflikte" } },
  { von: { feld: "Staat und Verwaltung", unterthema: "Parlament, Wahlen & Geschäftsordnung" }, nach: { feld: "Politisches Leben, Parteien", unterthema: "Parlament: Geschäftsordnung, Gremien & Abgeordnetenrecht" } },
  { von: { feld: "Innere Sicherheit", unterthema: "Gewaltschutz & Sexualdelikte" }, nach: { feld: "Recht", unterthema: "Opferschutz & Gewaltschutz" } },
  { von: { feld: "Entwicklungspolitik", unterthema: "Handel, Wirtschaftspartnerschaften & Rohstoffe" }, nach: { feld: "Außenpolitik und internationale Beziehungen", unterthema: "Außenwirtschaft, Handel & Rohstoffe" } },
  { von: { feld: "Arbeit und Beschäftigung", unterthema: "Grundsicherung, Jobcenter & Arbeitsvermittlung" }, nach: { feld: "Soziale Sicherung", unterthema: "Grundsicherung & Bürgergeld (Leistungsseite)" } },
  { von: { feld: "Verteidigung", unterthema: "Ukraine-Unterstützung & Militärhilfe" }, nach: { feld: "Außenpolitik und internationale Beziehungen", unterthema: "Ukraine, Russland & Sanktionen" } },
  { von: { feld: "Verteidigung", unterthema: "NATO, Bündnis & Stationierung" }, nach: { feld: "Außenpolitik und internationale Beziehungen", unterthema: "UN, NATO & internationale Organisationen" } },
  { von: { feld: "Umwelt", unterthema: "Atommüll, Endlager & nukleare Sicherheit" }, nach: { feld: "Energie", unterthema: "Kernenergie & nukleare Brennstoffkette" } },
  { von: { feld: "Recht", unterthema: "Strafverfolgung, Kriminalstatistik & Wirtschaftskriminalität" }, nach: { feld: "Innere Sicherheit", unterthema: "Kriminalitätslage & Kriminalstatistik" } },
];

// Anzeige-Umbenennungen (User 2026-06-12): kurze, griffige Labels statt der
// LLM-Cluster-Aufzählungen („Kriminalitätslage & Kriminalstatistik" → „Kriminali-
// tätslage"). Regel: EIN starkes Wort, zweites nur wenn es wirklich ein zweites
// Ding ist; Kurzname muss innerhalb seines Oberthemas eindeutig bleiben. Der
// Taxonomie-Name bleibt der kanonische Schlüssel (DB, Merges, VOTE_THEMA) —
// das hier ist reine Anzeige; alte Slugs lösen weiter auf (resolveUnter).
const ANZEIGE_NAME: Record<string, string> = {
  // Innere Sicherheit & Recht
  "Kriminalitätslage & Kriminalstatistik": "Kriminalitätslage",
  "Polizei, Befugnisse & Überwachung": "Polizei & Überwachung",
  "Strafrecht & Strafverfahren": "Strafrecht",
  "Hasskriminalität & Schutz gefährdeter Gruppen": "Hasskriminalität",
  "Rechtsangelegenheiten & Rechtspolitik der Bundesbehörden": "Rechtspolitik der Bundesbehörden",
  "Justizsystem, Gerichte & Digitalisierung der Justiz": "Justiz & Gerichte",
  "Bevölkerungsschutz, Waffenrecht & öffentliche Ordnung": "Bevölkerungsschutz & Waffenrecht",
  "Cybersicherheit, Spionage & hybride Bedrohungen": "Cybersicherheit & Spionage",
  "Opferschutz & Gewaltschutz": "Opferschutz",
  "Terrorismus & Islamismus": "Terrorismus",
  "Strafvollzug & Strafvollstreckung": "Strafvollzug",
  // Staat, Verwaltung & Demokratie
  "Parlament: Geschäftsordnung, Gremien & Abgeordnetenrecht": "Parlament & Abgeordnetenrecht",
  "Transparenz, Informationsfreiheit & Aktenzugang": "Transparenz & Informationsfreiheit",
  "Bundesbehörden, Personal & Ressortberichte": "Bundesbehörden & Personal",
  "Bürokratieabbau & Verwaltungsvereinfachung": "Bürokratieabbau",
  "Regierungstransparenz & parlamentarisches Fragerecht": "Regierungstransparenz & Fragerecht",
  "Lobbyismus & Interessenkonflikte": "Lobbyismus",
  "Externe Beratung, Gutachten & Regierungskommunikation": "Externe Beratung & Gutachten",
  "NGO-, Zivilgesellschafts- & Demokratieförderung": "Zivilgesellschaft & Demokratieförderung",
  "Staatliche Förderungen & Zuwendungskontrolle": "Staatliche Förderungen",
  "Parteien: Finanzierung, Organisationen & parteinahe Stiftungen": "Parteienfinanzierung & Stiftungen",
  "Wahlen, Wahlrecht & Wahlprüfung": "Wahlen & Wahlrecht",
  "Immunität & Verfahren gegen Abgeordnete": "Immunität",
  "Demokratiegeschichte, Gedenken & DDR-Aufarbeitung": "Demokratiegeschichte & Gedenken",
  // Außen, Verteidigung & Europa
  "Menschenrechte & bilaterale Länderbeziehungen": "Menschenrechte & Länderbeziehungen",
  "Projekt-Transparenz, Mittelkontrolle & Evaluierung": "Entwicklungsprojekte & Mittelkontrolle",
  "Ukraine, Russland & Sanktionen": "Ukraine & Russland",
  "Laufende EU-Regulierung & deutsche Verhandlungsposition": "EU-Regulierung",
  "UN, NATO & internationale Organisationen": "UN & NATO",
  "Außenwirtschaft, Handel & Rohstoffe": "Außenwirtschaft & Handel",
  "Verteidigungshaushalt, Beschaffung & Rüstungsindustrie": "Verteidigungshaushalt & Beschaffung",
  "Umsetzung von EU-Recht in deutsches Recht": "Umsetzung von EU-Recht",
  "Naher Osten (Israel/Gaza, Iran, Syrien)": "Naher Osten",
  "Personal, Wehrdienst & Veteranen": "Wehrdienst & Veteranen",
  "Auswärtiger Dienst, Kultur- & Bildungsaußenpolitik": "Auswärtiger Dienst",
  "Rüstungsexporte & Exportkontrolle": "Rüstungsexporte",
  "Auslandseinsätze & Mandate": "Auslandseinsätze",
  "Zivilverteidigung, Übungen & hybride Bedrohungen": "Zivilverteidigung",
  "Flucht, humanitäre Hilfe & Wiederaufbau": "Humanitäre Hilfe",
  "Durchführungsorganisationen, Stiftungen & NGOs": "Entwicklungsorganisationen & NGOs",
  "EU-Haushalt, Fonds & Förderprogramme": "EU-Haushalt & Förderprogramme",
  "EU-Asyl, Grenzen & Freizügigkeit": "EU-Asyl & Grenzen",
  "Deutsch-französische & Nachbarschafts-Kooperation": "Deutsch-französische Kooperation",
  "EU-Dokumente & parlamentarische Europa-Befassung": "EU-Dokumente & Europa-Befassung",
  "ODA-Finanzierung, Haushalt & Schulden": "ODA-Finanzierung",
  "Gender, Frauen & LGBTIQ in der EZ": "Gender & Frauen in der EZ",
  "Euro, Bankenunion & Finanzstabilität": "Euro & Bankenunion",
  "Multilaterale EZ, Entwicklungsbanken & globale Gesundheit": "Multilaterale Entwicklungszusammenarbeit",
  "Abrüstung, Rüstungskontrolle & Kampfmittelräumung": "Abrüstung & Rüstungskontrolle",
  "Subsidiarität & Kompetenzverteilung": "Subsidiarität",
  "Bildung, Ausbildung & Freiwilligendienste": "Bildung & Ausbildung in der EZ",
  // Finanzen, Steuern & Haushalt
  "Steuerpolitik & Steuerrecht": "Steuerpolitik",
  "Förderprogramme, Zuwendungen & Bürgschaften": "Förderprogramme & Zuwendungen",
  "Bundeshaushalt, Schulden & Sondervermögen": "Bundeshaushalt & Schulden",
  "Öffentliche Ausgaben & Behördenkosten-Transparenz": "Öffentliche Ausgaben",
  "Steuervollzug, Zoll & Finanzkriminalität": "Steuervollzug & Zoll",
  "Finanzmarkt, Banken & Finanzaufsicht": "Finanzmarkt & Banken",
  "EU- & internationale Finanzpolitik": "Internationale Finanzpolitik",
  // Umwelt, Klima & Energie
  "Klimapolitik, Klimaziele & CO₂-Speicherung": "Klimapolitik & Klimaziele",
  "Versorgungssicherheit & kritische Infrastruktur": "Versorgungssicherheit",
  "Erneuerbarer Strom: Wind, Solar & EEG": "Erneuerbarer Strom",
  "Energiepreise, Energiesteuern & Entlastungen": "Energiepreise & Entlastungen",
  "Naturschutz, Artenvielfalt & Wildtiere": "Naturschutz & Artenvielfalt",
  "Kernenergie & nukleare Brennstoffkette": "Kernenergie & Atommüll",
  "Wasserstoff, Bioenergie & erneuerbare Gase": "Wasserstoff & Bioenergie",
  "Stromnetze, Netzausbau & Systemstabilität": "Stromnetze & Netzausbau",
  "Gasversorgung, LNG & Import-Geopolitik": "Gasversorgung & LNG",
  "Umweltrecht, Verbände & Genehmigungsverfahren": "Umweltrecht & Genehmigungen",
  "Chemikalien, Luftreinhaltung & Altlasten": "Chemikalien & Luftreinhaltung",
  "Klimaanpassung, Wasser & Extremwetter": "Klimaanpassung & Extremwetter",
  "Kreislaufwirtschaft, Abfall & Recycling": "Kreislaufwirtschaft & Recycling",
  "Kraftwerke, Kohleausstieg & Staatsbeteiligungen": "Kraftwerke & Kohleausstieg",
  // Arbeit & Soziales
  "Fachkräfte, Qualifizierung & Weiterbildung": "Fachkräfte & Weiterbildung",
  "Grundsicherung & Bürgergeld (Leistungsseite)": "Grundsicherung & Bürgergeld",
  "Arbeitsschutz & Arbeitsbedingungen": "Arbeitsschutz",
  "Mindestlohn & Schwarzarbeitskontrolle": "Mindestlohn & Schwarzarbeit",
  "Rente & Alterssicherung": "Rente",
  "Arbeitsmarktintegration & Sprachförderung Geflüchteter": "Arbeitsmarktintegration Geflüchteter",
  "Tarifbindung, Gewerkschaften & Mitbestimmung": "Tarifbindung & Mitbestimmung",
  "Sozialleistungen für Geflüchtete & AsylbLG": "Sozialleistungen für Geflüchtete",
  "Erwerbsbeteiligung, Arbeitszeit & Vereinbarkeit": "Arbeitszeit & Vereinbarkeit",
  "Sozialversicherung: Beiträge, Status & Verwaltung": "Sozialversicherung",
  "Engagement, Freiwilligendienste & soziale Hilfesysteme": "Engagement & Freiwilligendienste",
  // Verkehr, Bauen & Wohnen
  "Schienennetz, Bahnprojekte & Sanierung": "Bahn & Schienennetz",
  "Straßenverkehrsrecht, Führerschein & Verkehrssicherheit": "Verkehrsrecht & Verkehrssicherheit",
  "Wohnkosten, Sozialer Wohnungsbau & Wohnraumversorgung": "Wohnkosten & Sozialer Wohnungsbau",
  "Straßenbau, Autobahnen & Brücken": "Straßenbau & Autobahnen",
  "Wohnungsbau, Baurecht & Planungsbeschleunigung": "Wohnungsbau & Baurecht",
  "ÖPNV, Fahrgäste & Bahnhofsservice": "ÖPNV",
  "Wasserstraßen, Schifffahrt & Häfen": "Schifffahrt & Häfen",
  "E-Mobilität, Antriebe & Ladeinfrastruktur": "E-Mobilität & Ladeinfrastruktur",
  "Kommunalfinanzen & kommunale Investitionen": "Kommunale Investitionen",
  "Mietrecht & Mieterschutz": "Mietrecht",
  "Bundesliegenschaften, Konversion & öffentliches Bauen": "Bundesliegenschaften & öffentliches Bauen",
  "Güterverkehr, Logistik & Maut": "Güterverkehr & Maut",
  "Gebäudeenergie, Heizung & Sanierung": "Heizung & Gebäudeenergie",
  // Migration & Integration
  "Asylverfahren & Schutzstatus": "Asylverfahren",
  "Abschiebung, Rückführung & Ausreisepflicht": "Abschiebung & Rückführung",
  "Sozialleistungen, Gesundheit & Unterbringung": "Sozialleistungen & Unterbringung",
  "Humanitäre Aufnahme & Aufnahmeprogramme": "Humanitäre Aufnahme",
  "Integrationskurse & Integrationsförderung": "Integrationskurse",
  "Familiennachzug & Aufenthaltstitel": "Familiennachzug",
  "Einbürgerung & Staatsangehörigkeit": "Einbürgerung",
  // Wirtschaft, Handel & Industrie
  "Wirtschaftsförderung & Subventionen": "Wirtschaftsförderung",
  "Außenhandel, Zölle & Rohstoffe": "Außenhandel & Zölle",
  "Konjunktur, Wachstum & Gesamtsteuerung": "Konjunktur & Wachstum",
  "Mittelstand, Handwerk & Gründung": "Mittelstand & Handwerk",
  "Lieferketten & Unternehmensverantwortung": "Lieferketten",
  "Fachkräfte & Arbeitsmarkt-Wirtschaft": "Fachkräfte",
  "Energiewirtschaft & Energiekosten": "Energiewirtschaft",
  // Bildung & Wissenschaft
  "Forschungsförderung, Innovationsstrategie & -agenturen": "Forschungsförderung & Innovation",
  "KI, Digital- & Schlüsseltechnologien": "KI & Schlüsseltechnologien",
  "Politische Bildung, Demokratieförderung & Erinnerungskultur": "Politische Bildung",
  "Kinder- & Jugendhilfe & Freiwilligendienste": "Kinder- & Jugendhilfe",
  "Frühkindliche Bildung, Kita & Ganztag": "Kita & frühkindliche Bildung",
  "Hochschule, Wissenschaft & Forschungsnachwuchs": "Hochschule & Wissenschaft",
  "Schule, Schulklima & Gewaltprävention": "Schule",
  "Energie-, Klima- & Umweltforschung": "Klima- & Umweltforschung",
  "Studienfinanzierung & BAföG": "BAföG & Studienfinanzierung",
  "Wissenschaftsfreiheit, -integrität & Wissenschaftsrecht": "Wissenschaftsfreiheit",
  "Raumfahrt & Weltraum": "Raumfahrt",
  "Lehrkräfte, Unterricht & digitale Bildung": "Lehrkräfte & digitale Bildung",
  "Sicherheits- & Verteidigungsforschung, Forschungssicherheit": "Verteidigungsforschung",
  "Internationale Wissenschaftskooperation & EU-Forschungsraum": "Internationale Wissenschaftskooperation",
  "Forschungsdaten & Dateninfrastruktur": "Forschungsdaten",
  // Gesundheit & Pflege
  "Arzneimittel, Apotheken & Medizinprodukte": "Arzneimittel & Apotheken",
  "Prävention, Ernährung & Umweltgesundheit": "Prävention & Ernährung",
  "Psychische Gesundheit, Sucht & Cannabis": "Psychische Gesundheit & Sucht",
  "Krankenhäuser & Versorgungsstrukturen": "Krankenhäuser & Versorgung",
  "Infektionsschutz & öffentlicher Gesundheitsdienst": "Infektionsschutz",
  "Corona-Aufarbeitung, Impfen & Pandemiefolgen": "Corona-Aufarbeitung & Impfen",
  "Kranken- & Pflegeversicherung: Finanzierung & Beiträge": "Krankenkassen & Beiträge",
  "Notfall- & Rettungsversorgung, Krisenresilienz": "Notfall- & Rettungsversorgung",
  // Digitalisierung & Netzpolitik
  "Datenschutz, Überwachung & Bürgerrechte": "Datenschutz & Bürgerrechte",
  "Cybersicherheit & kritische Infrastrukturen": "Cybersicherheit",
  "Digitale Verwaltung, Justiz & Staatsmodernisierung": "Digitale Verwaltung & Justiz",
  "Plattformen, digitale Dienste & Online-Werbung": "Plattformen & digitale Dienste",
  "Online-Kriminalität, Deepfakes & digitale Gewalt": "Online-Kriminalität & Deepfakes",
  "Krypto-Regulierung & digitale Finanzen": "Krypto & digitale Finanzen",
  // Gesellschaft, Kultur & Sport
  "Gleichstellung & Frauen in Führung": "Gleichstellung",
  "Antisemitismus, Rassismus & Hasskriminalität": "Antisemitismus & Rassismus",
  "Demokratie- & Antidiskriminierungs-Förderung": "Demokratieförderung",
  "Gewaltschutz & geschlechtsspezifische Gewalt": "Geschlechtsspezifische Gewalt",
  "Erinnerungskultur, Gedenkstätten & Kriegsgräber": "Erinnerungskultur & Gedenkstätten",
  "Engagement, Ehrenamt & Freiwilligendienste": "Engagement & Ehrenamt",
  "Kulturförderung & Kulturpreise": "Kulturförderung",
  "Familienrecht & reproduktive Selbstbestimmung": "Familienrecht & Selbstbestimmung",
  "Kinder- & Jugendschutz, Jugendhilfe & Betreuung": "Kinder- & Jugendschutz",
  "Spitzensport: Förderung, Reform & Athlet:innen": "Spitzensport",
  "Kulturgutschutz, Restitution & Kolonialerbe": "Kulturgutschutz & Restitution",
  "Olympiabewerbungen & Sportgroßveranstaltungen": "Olympia & Sportgroßveranstaltungen",
  "Teilhabe, Fairness & Schutz im Sport": "Teilhabe & Schutz im Sport",
  "Auswärtige Kulturpolitik & internationaler Austausch": "Auswärtige Kulturpolitik",
  "Kultureinrichtungen, Museen & Bibliotheken": "Museen & Bibliotheken",
  // Landwirtschaft & Ernährung
  "Agrarmärkte, Erzeugerpreise & Lieferketten": "Agrarmärkte & Erzeugerpreise",
  "Pflanzenschutz, Düngung & Pflanzenbau": "Pflanzenschutz & Düngung",
  "Ernährungspolitik, Lebensmittelsicherheit & Kennzeichnung": "Ernährung & Lebensmittelsicherheit",
  "Tierhaltung, Tierschutz & Stallumbau": "Tierhaltung & Tierschutz",
  "Betriebe, Agrarsoziales, Steuern & Bürokratie": "Agrarbetriebe & Bürokratie",
  "Wolf, Jagd & Wildtiermanagement": "Wolf & Jagd",
  "Flächen, Boden & Ernährungssicherung": "Flächen & Boden",
  "Agrarförderung, GAP & ländliche Entwicklung": "Agrarförderung & GAP",
  "Tiergesundheit & Tierseuchen": "Tiergesundheit",
};
export const anzeigeName = (u: string): string => ANZEIGE_NAME[u] ?? u;

export const mergeKey = (feld: string, unterthema: string) => `${feld} ${unterthema}`;
const MERGE_VON = new Map(UNTERTHEMA_MERGES.map((m) => [mergeKey(m.von.feld, m.von.unterthema), m.nach]));
/** Ist (feld, unterthema) eine gemergte Quelle (= nicht mehr eigenständig anzeigen)? */
export const istGemergt = (feld: string, unterthema: string): boolean => MERGE_VON.has(mergeKey(feld, unterthema));
/** Merge-Ziel einer Quelle (oder null). */
export const mergeZiel = (feld: string, unterthema: string) => MERGE_VON.get(mergeKey(feld, unterthema)) ?? null;
/** Alle Quellen, die in dieses Ziel gemergt wurden. */
export function mergeQuellen(feld: string, unterthema: string): { feld: string; unterthema: string }[] {
  return UNTERTHEMA_MERGES.filter((m) => m.nach.feld === feld && m.nach.unterthema === unterthema).map((m) => m.von);
}

// Unterthema-Slug (URL) — deterministisch aus dem Cluster-Namen
export function unterSlug(s: string): string {
  return s.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Slug → (feld, unterthema) auflösen (über alle Felder eines Oberthemas).
// Akzeptiert Taxonomie- UND Anzeige-Namen-Slugs; gemergte Quellen lösen aufs
// Ziel auf (alte/geteilte URLs bleiben gültig — die Page leitet kanonisch um).
export function resolveUnter(oberSlug: string, slug: string): { feld: string; unterthema: string } | null {
  const ot = OBERTHEMEN.find((o) => o.slug === oberSlug);
  if (!ot) return null;
  for (const feld of ot.felder) {
    for (const u of TAXONOMIE[feld] ?? []) {
      if (unterSlug(u) === slug || unterSlug(anzeigeName(u)) === slug) {
        return mergeZiel(feld, u) ?? { feld, unterthema: u };
      }
    }
  }
  return null;
}
