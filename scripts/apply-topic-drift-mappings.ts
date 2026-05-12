/**
 * Wendet Drift-Tag-Mappings auf die 1.143 Records mit topic_drift_audit an.
 *
 * - 5 Drift-Tags wurden in die TOPIC_TAGS-Enum aufgenommen (Transparenz,
 *   Infrastruktur, Bürokratie, Lobbyismus, Föderalismus) — diese fließen
 *   direkt in `thema`.
 * - ~30 weitere Drift-Tags werden via explizitem Mapping in bestehende
 *   Enum-Tags überführt.
 * - Long-Tail-Drift-Tags (≤3 Vorkommen, kein Mapping) bleiben in
 *   `topic_drift_audit` für späteres Audit.
 *
 * Constraint: thema-Schema erlaubt max. 3 Tags. Dedup + Truncate.
 *
 *   --dry-run    Vorschau ohne DB-Write
 */
import Database from "better-sqlite3";
import path from "path";
import { TOPIC_TAGS } from "../src/lib/drucksachen-prompts";

const DRY_RUN = process.argv.includes("--dry-run");
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const ENUM = new Set<string>([...TOPIC_TAGS]);

// Mapping: drift-tag → ziel-tag (muss in ENUM sein)
const MAPPING: Record<string, string> = {
  // Direkt in Enum aufgenommen — Identitäts-Mapping (für Cleanup-Logik)
  "Transparenz": "Transparenz",
  "Infrastruktur": "Infrastruktur",
  "Bürokratie": "Bürokratie",
  "Bürokratieabbau": "Bürokratie",
  "Lobbyismus": "Lobbyismus",
  "Lobbyarbeit": "Lobbyismus",
  "Lobbying": "Lobbyismus",
  "Föderalismus": "Föderalismus",

  // Konsolidierung
  "Bürgerbeteiligung": "Demokratie",
  "Zivilgesellschaft": "Demokratie",
  "Bundestag": "Demokratie",
  "Pressefreiheit": "Demokratie",
  "Tourismus": "Wirtschaft",
  "Mindestlohn": "Arbeitsmarkt",
  "Arbeit": "Arbeitsmarkt",
  "Arbeitmarkt": "Arbeitsmarkt",
  "Finanzierung": "Finanzen",
  "Statistik": "Verwaltung",
  "Medien": "Kultur",
  "Geschichte": "Kultur",
  "Cybersicherheit": "Innere Sicherheit",
  "Sicherheit": "Innere Sicherheit",
  "Gewalt": "Innere Sicherheit",
  "Gewaltschutz": "Innere Sicherheit",
  "Waffenrecht": "Innere Sicherheit",
  "Katastrophenschutz": "Innere Sicherheit",
  "Meinungsfreiheit": "Bürgerrechte",
  "Religionsfreiheit": "Bürgerrechte",
  "Asylrecht": "Migration",
  "Integration": "Migration",
  "Antisemitismus": "Antidiskriminierung",
  "Humanitäre Hilfe": "Entwicklungszusammenarbeit",
  "Ehrenamt": "Soziales",
  "Wissenschaft": "Forschung",
  "Wissenschaftsfreiheit": "Forschung",
  "Raumfahrt": "Forschung",
  "Wasser": "Umweltschutz",
  "Naturschutz": "Umweltschutz",
  "Biodiversität": "Umweltschutz",
  "Nachhaltigkeit": "Umweltschutz",
  "Regulierung": "Wirtschaft",
  "Strukturwandel": "Wirtschaft",
  "Versorgungssicherheit": "Wirtschaft",
  "Prävention": "Gesundheit",
  "Ernährung": "Landwirtschaft",
  "Fischerei": "Landwirtschaft",
  "Rüstung": "Bundeswehr",
  "Rüstungsexporte": "Bundeswehr",
  "Kommunen": "Verwaltung",
  "Kommunale Selbstverwaltung": "Verwaltung",
  "Qualitätssicherung": "Verwaltung",
  "Kinderrechte": "Familie",
  "Kinder": "Familie",
  "Jugend": "Familie",
  "Jugendschutz": "Familie",
  "Diplomatie": "Außenpolitik",
  "Ukraine": "Außenpolitik",
  "Compliance": "Justiz",
  "Verfassungsrecht": "Justiz",
  "Stadtentwicklung": "Wohnen",

  // 2. Pass — Tippfehler + Close-Matches im Long-Tail
  "Bügerrechte": "Bürgerrechte",
  "Bürgrechte": "Bürgerrechte",
  "Klima­schutz": "Klimaschutz",
  "Klimaschutz ": "Klimaschutz",
  "Asylpolitik": "Migration",
  "Kritische Infrastrukturen": "Infrastruktur",
  "Barrierefreiheit": "Antidiskriminierung",
  "Behindertenrechte": "Antidiskriminierung",
  "Armut": "Soziales",
  "Wahlrecht": "Demokratie",
  "Partizipation": "Demokratie",
  "Erinnerungskultur": "Kultur",
  "Abfallwirtschaft": "Umweltschutz",
  "Raumordnung": "Wohnen",

  // 3. Pass — Long-Tail Cluster-Mapping
  // Bürgerrechte (Tippfehler + Synonyme)
  "Büergerrechte": "Bürgerrechte", "Bürgerbrechte": "Bürgerrechte",
  "Bürgerbürgerrechte": "Bürgerrechte", "Bürgerre chte": "Bürgerrechte",
  "Bürgerre​chte": "Bürgerrechte", "Bürgeerrechte": "Bürgerrechte",
  "Bürgehrrechte": "Bürgerrechte", "Bürgererechte": "Bürgerrechte",
  "Bürgererrechte": "Bürgerrechte", "Bürgerfrechte": "Bürgerrechte",
  "Bürgergrechte": "Bürgerrechte", "Bürgerkrechte": "Bürgerrechte",
  "Bürgerre  chte": "Bürgerrechte", "Bürgeurrechte": "Bürgerrechte",
  "Bürgferrechte": "Bürgerrechte", "Bürggerrechte": "Bürgerrechte",
  "Bürgherrechte": "Bürgerrechte", "Bürgr echte": "Bürgerrechte",
  "Bürgérrechte": "Bürgerrechte", "Bürgeerrrechte": "Bürgerrechte",
  "Grundrechte": "Bürgerrechte", "Informationsfreiheit": "Bürgerrechte",
  "Religion": "Bürgerrechte",

  // Bürokratie
  "Büokratie": "Bürokratie", "Entbürokratisierung": "Bürokratie",
  "Bürokrati­eabbau/Verwaltung": "Bürokratie", "Bürokrratieabbau": "Bürokratie",

  // Klimaschutz
  "Klim aschutz": "Klimaschutz",

  // Europa
  "Eu­ropa": "Europa",

  // Finanzen (inkl. Haushalt, Banken, Steuern-ähnliches, Kommunalfinanzen)
  "Haushalt": "Finanzen", "Investitionen": "Finanzen",
  "Finanzien": "Finanzen", "Finanzkontrolle": "Finanzen",
  "Föderale Finanzbeziehungen": "Finanzen", "Finanzaufsicht": "Finanzen",
  "Finanzielle Kontrolle": "Finanzen", "Finanzpolitik": "Finanzen",
  "Finanzstabilität": "Finanzen", "Finanzwirtschaft": "Finanzen",
  "Stabilität des Finanzmarktes": "Finanzen", "Banken": "Finanzen",
  "Bankensektor": "Finanzen", "Währung": "Finanzen",
  "Kommunalfinanzen": "Finanzen", "Kommunale Haushalte": "Finanzen",
  "Kommunale Altschulden": "Finanzen", "Kommunale Altschuldenproblematik": "Finanzen",
  "Kommunale Finanzierung": "Finanzen",
  "Haushalts- und Finanzwirtschaft": "Finanzen",
  "Haushalts- und Kontrollrechte": "Finanzen",
  "Umverteilung": "Finanzen", "Vermögensungleichheit": "Finanzen",
  "Vermögensverteilung": "Finanzen",

  // Steuern / Zoll
  "Zoll": "Steuern", "Zollrecht": "Steuern", "Zollverwaltung": "Steuern",

  // Innere Sicherheit
  "Terrorismus": "Innere Sicherheit", "Bevölkerungsschutz": "Innere Sicherheit",
  "Polizei": "Innere Sicherheit", "Kriminalität": "Innere Sicherheit",
  "Verfassungsschutz": "Innere Sicherheit", "Grenzschutz": "Innere Sicherheit",
  "Korruptionsprävention": "Innere Sicherheit", "Korruptionsbekämpfung": "Innere Sicherheit",
  "Cybercrime": "Innere Sicherheit", "Cyberkriminalität": "Innere Sicherheit",
  "Organisierte Kriminalität": "Innere Sicherheit",
  "Organiz. Kriminalität": "Innere Sicherheit",
  "Strafverfolgung": "Innere Sicherheit",
  "Gewalt gegen Einsatzkräfte": "Innere Sicherheit",
  "Notfallmanagement": "Innere Sicherheit", "Bürgersicherheit": "Innere Sicherheit",
  "Spionage": "Innere Sicherheit", "Schwarzarbeit": "Innere Sicherheit",
  "Schwarzarbeitsbekämpfung": "Innere Sicherheit",
  "Krisenmanagement": "Innere Sicherheit", "Bestechlichkeit": "Innere Sicherheit",
  "Menschenhandel": "Innere Sicherheit", "Waffen": "Innere Sicherheit",
  "Waffengesetze": "Innere Sicherheit", "Zivilschutz": "Innere Sicherheit",
  "Maritime Sicherheit": "Innere Sicherheit", "Opferschutz": "Innere Sicherheit",
  "nationale Sicherheit": "Innere Sicherheit", "Notfallrettung": "Innere Sicherheit",

  // Familie
  "Kinder- und Jugendhilfe": "Familie", "Kinder- und Jugendschutz": "Familie",
  "Kinderschutz": "Familie", "Frauen": "Geschlechtergerechtigkeit",
  "Jugendliche": "Familie", "Jugendarbeit": "Familie",
  "Familienrecht": "Familie", "Kinderarmut": "Familie",
  "Kinderbetreuung": "Familie", "Kinderrechte und Datenschutz": "Familie",
  "Kinder und Jugendliche im Kontext der Pandemieerfahrung": "Familie",
  "Kinder- und Jugendmedienschutz": "Familie",
  "Kinder- und Jugendschutz im digitalen Raum": "Familie",
  "Qualität der Kinderbetreuung": "Familie",
  "Geburt": "Familie", "Jugendpolitik": "Familie",
  "Jugendliche/Radikalisierung": "Familie",

  // Gesundheit
  "Arzneimittel": "Gesundheit", "Pflege": "Gesundheit",
  "Suchtpolitik": "Gesundheit", "Primärversorgung": "Gesundheit",
  "Patientenrechte": "Gesundheit", "Arzneimittel-Regulierung": "Gesundheit",
  "Arzneimittel/Impfstoffe": "Gesundheit", "Arzneimittel/Zulassung": "Gesundheit",
  "Drogen- und Suchtpolitik": "Gesundheit", "Suchtbehandlung": "Gesundheit",
  "Suchtbekämpfung": "Gesundheit", "Patientenschutz": "Gesundheit",
  "Psychiatrie und psychische Versorgung": "Gesundheit",
  "Psychische Gesundheit": "Gesundheit", "Hebammen": "Gesundheit",
  "Infektionsschutz": "Gesundheit", "Epidemiologie": "Gesundheit",
  "Corona": "Gesundheit", "Bewegungsförderung": "Gesundheit",
  "Cannabislegalisierung": "Gesundheit",

  // Außenpolitik
  "Auswärtiges Amt": "Außenpolitik", "Auswärtenpolitik": "Außenpolitik",
  "Auswärtiger Kultur- und Bildungspolitik": "Außenpolitik",
  "Auswärtiges Kulturamt": "Außenpolitik",
  "Bulgarien": "Außenpolitik", "Ukrainekrieg": "Außenpolitik",
  "Syrien": "Außenpolitik", "Südsudan": "Außenpolitik",
  "Geopolitik": "Außenpolitik", "Internationale Kooperation": "Außenpolitik",
  "Internationale Organisationen": "Außenpolitik",
  "Internationalisierung": "Außenpolitik",
  "Frieden": "Außenpolitik", "Friedenspolitik": "Außenpolitik",
  "Souveränität": "Außenpolitik", "Arktis-Politik": "Außenpolitik",
  "Konfliktprävention": "Außenpolitik", "Völkerrecht": "Außenpolitik",

  // Bundeswehr
  "Abrüstung": "Bundeswehr", "Rüstungskontrolle": "Bundeswehr",
  "Waffen-/Rüstungsexporte": "Bundeswehr", "Militär": "Bundeswehr",
  "Kriegsfolgelasten": "Bundeswehr",

  // Umweltschutz
  "Meeresschutz": "Umweltschutz", "Gewässerschutz": "Umweltschutz",
  "Hochwasserschutz": "Umweltschutz", "Artenerhalt": "Umweltschutz",
  "Atommüll/Endlagerung": "Umweltschutz", "Atommüll/Entsorgung": "Umweltschutz",
  "Chemikalien": "Umweltschutz", "Grundwasserschutz": "Umweltschutz",
  "Lebensmittelverschwendung": "Umweltschutz", "Wasserschutz": "Umweltschutz",
  "Lärmbelastung": "Umweltschutz", "Pflanzenschutz": "Umweltschutz",
  "Ressourcenschonung": "Umweltschutz", "Strahlenschutz": "Umweltschutz",
  "Meer": "Umweltschutz", "Meere": "Umweltschutz",
  "Meeresverschmutzung": "Umweltschutz", "Waldschutz": "Umweltschutz",
  "Natura 2000/FFH-Richtlinie": "Umweltschutz", "Wasserwirtschaft": "Umweltschutz",
  "Kreislaufwirtschaft": "Umweltschutz",
  "Kreislaufwirtschaft/Abfallwirtschaft": "Umweltschutz",
  "Nachhaltig": "Umweltschutz", "Nachhaltige Entwicklung": "Umweltschutz",
  "Düngeverordnung": "Umweltschutz",

  // Tierschutz
  "Wildtiermanagement": "Tierschutz",

  // Landwirtschaft
  "Pflanzenschutzmittel": "Landwirtschaft", "Waldwirtschaft": "Landwirtschaft",
  "Lebensmittel": "Landwirtschaft", "Ernährungssicherheit": "Landwirtschaft",
  "Jagd": "Landwirtschaft", "Jagdrecht": "Landwirtschaft",
  "Jagdwesen": "Landwirtschaft", "Qualitätsweizen": "Landwirtschaft",

  // Energie
  "Wasserstoff": "Energie", "Energiewende": "Energie",
  "Energiewirtschaft": "Energie", "Energiewutz": "Energie",
  "Kernenergie": "Energie", "Kernbrennstoffproduktion": "Energie",
  "Netzstabilität": "Energie", "Netzstabilität/Stromnetz": "Energie",
  "Stromversorgung": "Energie", "Gaswirtschaft": "Energie",
  "Rohstoffe": "Energie", "Rohstoffe und Energie": "Energie",
  "Rohstoffe/Energie": "Energie", "Rohstoffversorgung": "Energie",
  "Rohstoffpolitik": "Energie", "Rohstoffpolitik und Energie": "Energie",
  "Rohstoffwirtschaft": "Energie",

  // Wirtschaft
  "Wettbewerb": "Wirtschaft", "Regionalentwicklung": "Wirtschaft",
  "Innovation": "Wirtschaft", "Industrie": "Wirtschaft",
  "Mittelstand": "Wirtschaft", "Marktentwicklung": "Wirtschaft",
  "Marktkonzentration": "Wirtschaft", "Binnenmarkt": "Wirtschaft",
  "Wettbewerbsfähigkeit": "Wirtschaft", "Regionalpolitik": "Wirtschaft",
  "Regionale Entwicklung": "Wirtschaft",
  "Strukturwandel Kohleregionen": "Wirtschaft",
  "Technologie": "Wirtschaft", "Gastgewerbe/Tourismus": "Wirtschaft",
  "Gastronomie": "Wirtschaft", "Kommunalwirtschaft": "Wirtschaft",
  "Finanzierungsbedingungen für Startups und Scaleups": "Wirtschaft",
  "Kartellrecht": "Wirtschaft", "Postgesetznovelle": "Wirtschaft",

  // Digitalisierung
  "Künstliche Intelligenz": "Digitalisierung", "Digitalismus": "Digitalisierung",
  "Digitalwirtschaft": "Digitalisierung",

  // Verkehr
  "Schiene": "Verkehr", "Schienengüterverkehr": "Verkehr",
  "Schieneninfrastruktur": "Infrastruktur", "Schienennetz": "Infrastruktur",
  "Luftfahrt": "Verkehr", "Verkehrssicherheit": "Verkehr",
  "Binnenschifffahrt": "Verkehr", "Nahverkehr": "Verkehr",

  // Wohnen
  "Wohnungsbau": "Wohnen", "Baurecht": "Wohnen",
  "Stadtentwicklung/Stadtplanung": "Wohnen",
  "Städtebauliche Entwicklung": "Wohnen", "Urbane Entwicklung": "Wohnen",
  "Bauen": "Wohnen",

  // Verwaltung
  "Kommunalverwaltung": "Verwaltung", "Öffentliche Verwaltung": "Verwaltung",
  "Kommunale Governance": "Verwaltung", "Kommunale Handlungsfähigkeit": "Verwaltung",
  "Kommunales": "Verwaltung", "Daseinsvorsorge": "Verwaltung",
  "Beamte": "Verwaltung", "Beschaffung": "Verwaltung",
  "Beschaffungswesen": "Verwaltung", "Bundesarchiv": "Verwaltung",
  "Geschäftsführung": "Verwaltung", "Geschäftsordnung": "Verwaltung",
  "Organisation": "Verwaltung", "Regelung": "Verwaltung",
  "Kontrolle": "Verwaltung", "Kontrolle und Compliance": "Verwaltung",
  "Statistik/Datenerfassung": "Verwaltung",
  "Öffentlichkeitsarbeit": "Verwaltung",
  "Öffentlichkeitsarbeit / Verwaltung": "Verwaltung",

  // Demokratie
  "Gewaltenteilung": "Demokratie", "Abgeordnetenrecht": "Demokratie",
  "Parlament": "Demokratie", "Parlamentarische Kontrolle": "Demokratie",
  "Wahlen": "Demokratie", "Gesetzgebung": "Demokratie",
  "Öffentlichkeit": "Demokratie", "Kontrolle der Bundesregierung": "Demokratie",
  "Medienfreiheit": "Demokratie", "Meinungs- und Pressefreiheit": "Demokratie",
  "Desinformation": "Demokratie", "Kommunikation": "Demokratie",

  // Justiz
  "Vergaberecht": "Justiz", "Rechtssicherheit": "Justiz",
  "Rechtsstaat": "Justiz", "Rechtsstaatlichkeit": "Justiz",
  "Bundesverfassungsgericht": "Justiz", "Recht": "Justiz",
  "Rechtswesen": "Justiz", "Urheberrecht": "Justiz",
  "Verfassung": "Justiz", "Unionsrecht und Völkerrecht": "Justiz",

  // Migration
  "Asylverfahren": "Migration", "Asyl": "Migration",
  "Asyl und Migration": "Migration", "Asylentscheidungen": "Migration",
  "Asylgesetz": "Migration", "Aufenthaltsrecht": "Migration",
  "Staatsangehörigkeit": "Migration", "Migrationspolitik": "Migration",

  // Arbeitsmarkt
  "Arbeitssicherheit": "Arbeitsmarkt", "Arbeitsschutz": "Arbeitsmarkt",
  "Arbeitschutz": "Arbeitsmarkt", "Arbeitszeitgesetz": "Arbeitsmarkt",
  "Arbeitszeitrecht": "Arbeitsmarkt", "Arbeit und Arbeitsmarkt": "Arbeitsmarkt",
  "Arbeit und faire Vergütung": "Arbeitsmarkt", "Arbeitsmtr": "Arbeitsmarkt",
  "Arbeitsmärkte": "Arbeitsmarkt", "Fachkräftesicherung": "Arbeitsmarkt",
  "Fachkräftemangel": "Arbeitsmarkt", "Qualifikation von Fachkräften": "Arbeitsmarkt",
  "Personalgewinnung": "Arbeitsmarkt", "Personalpolitik": "Arbeitsmarkt",
  "Arbeitnehmerrechte": "Arbeitsmarkt", "Arbeitsrecht": "Arbeitsmarkt",
  "Tarifvertrag": "Arbeitsmarkt", "Tarifverträge": "Arbeitsmarkt",
  "Mindestlohngesetz": "Arbeitsmarkt", "Mindestlohn/Lohnpolitik": "Arbeitsmarkt",
  "Mindestlohn und Arbeitnehmerschutz": "Arbeitsmarkt", "Löhne": "Arbeitsmarkt",

  // Bildung
  "Qualifizierung": "Bildung", "Qualifizierung und Weiterbildung": "Bildung",
  "Ausbildung": "Bildung", "Hochschulwesen": "Bildung",
  "Medienkompetenz": "Bildung",

  // Forschung
  "Wissenschaft und Forschung": "Forschung", "Wissenschaftsintegrität": "Forschung",
  "Raumfahrt/Weltraum": "Forschung", "Weltraum": "Forschung",

  // Antidiskriminierung
  "Behindertengleichstellung": "Antidiskriminierung",
  "Behinderte": "Antidiskriminierung",
  "Behindertengerechtigkeit": "Antidiskriminierung",
  "Behindertenrechte/Antidiskriminierung": "Antidiskriminierung",
  "Behinderung": "Antidiskriminierung", "Behinderungen": "Antidiskriminierung",
  "Menschen mit Behinderungen": "Antidiskriminierung",
  "Minderheitenschutz": "Antidiskriminierung",
  "Chancengerechtigkeit": "Antidiskriminierung",
  "Chancengleichheit": "Antidiskriminierung",
  "Gesellschaftsgerechtigkeit": "Antidiskriminierung",
  "Altersgerechtigkeit": "Antidiskriminierung",
  "LSBTIQ-Rechte": "Antidiskriminierung",

  // Geschlechtergerechtigkeit
  "Frauenrechte": "Geschlechtergerechtigkeit",
  "Gleichberechtigungsgerechtigkeit": "Geschlechtergerechtigkeit",
  "Gleichstellung": "Geschlechtergerechtigkeit",
  "Gleichstellungsrecht": "Geschlechtergerechtigkeit",

  // Kultur
  "Gedenken": "Kultur", "Gedenkkultur": "Kultur",
  "Gedenkstättenwesen": "Kultur", "Sprache": "Kultur",
  "Sprache/Deutsch": "Kultur", "Kulturerbe": "Kultur",
  "Kulturpolitik": "Kultur", "Kulturschutz": "Kultur",
  "Medien und Kultur": "Kultur", "Medienstandort": "Kultur",
  "Aufarbeitung": "Kultur", "Aufarbeitung kolonialer Vergangenheit": "Kultur",
  "NS-Aufarbeitung": "Kultur",

  // Soziales
  "Engagement": "Soziales", "Gemeinnützigkeit": "Soziales",
  "Stiftungen": "Soziales", "Altersarmut": "Soziales",
  "Armut und Reichtum": "Soziales", "Armut/Kinderarmut": "Soziales",
  "Bürgergeld/Soziales": "Soziales", "Demografie": "Soziales",

  // Rente
  "Altersvorsorge": "Rente", "Alter": "Rente",

  // Sport
  "Spitzensport": "Sport",

  // Transparenz
  "Transparency": "Transparenz", "Transparenz und Gemeinwohlorientierung": "Transparenz",
  "Transparenz und Kontrolle": "Transparenz",
  "Transparenz/Bürgerbeteiligung": "Transparenz",

  // Lobbyismus
  "Interessenkonflikt / Compliance": "Lobbyismus",
  "Interessenkonflikte": "Lobbyismus", "Interessenskonflikte": "Lobbyismus",
  "Ethik": "Lobbyismus", "Ethik/Integrität": "Lobbyismus",

  // Föderalismus
  "Bund-Länder-Zusammenarbeit": "Föderalismus",

  // Infrastruktur
  "Kritische Infrastruktur": "Infrastruktur",
  "Weltraumsicherheit und kritische Infrastruktur": "Infrastruktur",
  "Infrastruktur/Verkehr": "Infrastruktur",

  // 4. Pass — Letzte Aufräum-Runde
  "Bürgerschutz": "Bürgerrechte",
  "Bürgerre]\nchte": "Bürgerrechte",
  "Bürgergerechtigung": "Bürgerrechte",
  "Bürgerra": "Bürgerrechte",
  "Bürgersymbolschutz": "Bürgerrechte",
  "Gesellschaft": "Soziales",
  "Ernährung und Verbraucherschutz": "Verbraucherschutz",
  "Rechtliche Rahmenbedingungen für Modellprojekte": "Justiz",
};

// Sanity: alle Mapping-Ziele müssen in ENUM sein
for (const [from, to] of Object.entries(MAPPING)) {
  if (!ENUM.has(to)) throw new Error(`Mapping-Ziel "${to}" (für "${from}") nicht in ENUM`);
}

interface Row {
  drucksache_nr: string;
  thema: string | null;
  topic_drift_audit: string | null;
}

const rows = db.prepare(`
  SELECT drucksache_nr, thema, topic_drift_audit
  FROM drucksache_analyses
  WHERE prompt_version IN ('v1','v1.1') AND analyze_error IS NULL
    AND topic_drift_audit IS NOT NULL
`).all() as Row[];

console.log(`📋 ${rows.length} Records mit Drift zu verarbeiten`);

let updated = 0, unchanged = 0, longTailOnly = 0;
let removedSonstiges = 0;
const newTagCounts = new Map<string, number>();
const remainingDriftCounts = new Map<string, number>();

const upd = db.prepare(`
  UPDATE drucksache_analyses
  SET thema=?, topic_drift_audit=?
  WHERE drucksache_nr=?
`);

for (const r of rows) {
  // thema parsen (comma-string)
  const themaSet = new Set(
    (r.thema ?? "").split(",").map(t => t.trim()).filter(t => t.length > 0 && ENUM.has(t))
  );
  // Sonstiges wird durch konkrete Tags ersetzt, wenn Mapping greift
  const hadSonstiges = themaSet.has("Sonstiges");

  // Drift parsen
  let driftTags: string[];
  try { driftTags = JSON.parse(r.topic_drift_audit!); if (!Array.isArray(driftTags)) driftTags = []; }
  catch { driftTags = []; }

  const remainingDrift: string[] = [];
  let anyMapped = false;
  for (const tag of driftTags) {
    const mapTo = MAPPING[tag];
    if (mapTo) {
      if (!themaSet.has(mapTo)) themaSet.add(mapTo);
      newTagCounts.set(mapTo, (newTagCounts.get(mapTo) ?? 0) + 1);
      anyMapped = true;
    } else {
      remainingDrift.push(tag);
      remainingDriftCounts.set(tag, (remainingDriftCounts.get(tag) ?? 0) + 1);
    }
  }

  // Sonstiges entfernen wenn konkrete Tags da sind
  if (themaSet.has("Sonstiges") && themaSet.size > 1) {
    themaSet.delete("Sonstiges");
    if (hadSonstiges) removedSonstiges++;
  }

  // Max 3 Tags. Wir behalten: bestehende Enum-Treffer aus thema zuerst, dann gemappte (Reihenfolge ist Map-Insertion).
  const finalThema = Array.from(themaSet).slice(0, 3);

  // Wenn nichts geändert → skip
  const oldNorm = (r.thema ?? "").split(",").map(t => t.trim()).filter(t => t.length > 0).sort().join("|");
  const newNorm = [...finalThema].sort().join("|");
  const oldDrift = JSON.stringify(driftTags.sort());
  const newDrift = remainingDrift.length > 0 ? JSON.stringify([...remainingDrift].sort()) : null;
  const driftChanged = (newDrift ?? "") !== (oldDrift === "[]" ? "" : oldDrift);

  if (oldNorm === newNorm && !driftChanged) {
    if (!anyMapped) longTailOnly++;
    unchanged++;
    continue;
  }

  if (!DRY_RUN) {
    upd.run(
      finalThema.join(", "),
      remainingDrift.length > 0 ? JSON.stringify(remainingDrift) : null,
      r.drucksache_nr,
    );
  }
  updated++;
}

console.log(`\n=== ${DRY_RUN ? "DRY-RUN" : "Applied"} ===`);
console.log(`  Records updated:           ${updated}`);
console.log(`  Records unchanged:         ${unchanged}`);
console.log(`  Records longTail-only:     ${longTailOnly}`);
console.log(`  „Sonstiges" entfernt:      ${removedSonstiges}`);

console.log(`\nTop neue Tag-Hinzugewinne (per Mapping):`);
const topNew = Array.from(newTagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [tag, n] of topNew) console.log(`  ${tag.padEnd(28)} +${n}`);

console.log(`\nVerbleibender Long-Tail-Drift (Top 15):`);
const topRem = Array.from(remainingDriftCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [tag, n] of topRem) console.log(`  ${tag.padEnd(28)} ${n}`);
