// Synonym-Cluster für Cmd+K Query-Expansion.
//
// Jedes Cluster = Menge austauschbarer Suchbegriffe zur gleichen Politikdomäne.
// Match-Logik: Wortgrenze (Whitespace-Boundary), case-insensitive, keine Substring-Trap
// → "klima" matched Cluster "Klima & Energie", aber NICHT "klimaanlage".
//
// Neutralitätsregel: nur sach-deskriptive Begriffe pro Cluster, keine Partei-Frames
// (z.B. kein "asylant", "klimakleber", "ausländerkriminalität", "sozialschmarotzer",
// "lebensschutz"). Alltagssprache ist OK (z.B. "ausländer", "messerangriff", "bürgergeld") —
// das sind reale Suchbegriffe von Bürger:innen, kein Statement der Plattform.
// Cluster gruppieren das Themenfeld, nicht die Bewertung.

export interface SynonymCluster {
  /** Anzeigename in UI ("auch gesucht über: Migration") */
  label: string;
  /** Alle austauschbaren Lowercase-Suchbegriffe (Einzelwörter oder Phrasen) */
  terms: string[];
}

export const SYNONYM_CLUSTERS: SynonymCluster[] = [
  {
    label: "Migration",
    terms: [
      "migration",
      "asyl",
      "asylpolitik",
      "geflüchtete",
      "flüchtling",
      "flüchtlinge",
      "einwanderung",
      "zuwanderung",
      "abschiebung",
      "abschiebungen",
      "migrationspolitik",
      "integration",
      "migrant",
      "migranten",
      "migrantin",
      "migrantinnen",
      "ausländer",
      "ausländerin",
      "ausländerinnen",
      "asylbewerber",
      "asylsuchende",
      "einwanderer",
      "zuwanderer",
      "duldung",
      "duldungen",
    ],
  },
  {
    label: "Klima & Energie",
    terms: [
      "klima",
      "klimaschutz",
      "klimawandel",
      "klimapolitik",
      "energie",
      "energiewende",
      "erneuerbare",
      "erneuerbaren",
      "kohleausstieg",
      "atomkraft",
      "kernkraft",
      "co2",
      "emissionen",
      "treibhausgas",
      "treibhausgase",
      "heizungsgesetz",
      "wärmepumpe",
      "verbrennerverbot",
      "tempolimit",
      "solar",
      "solaranlage",
      "windrad",
      "windräder",
    ],
  },
  {
    label: "Wirtschaft & Industrie",
    terms: [
      "wirtschaft",
      "wirtschaftspolitik",
      "konjunktur",
      "industriepolitik",
      "industrie",
      "standort",
      "deindustrialisierung",
      "mittelstand",
      "unternehmen",
      "unternehmer",
      "unternehmerin",
      "firma",
      "firmen",
      "subvention",
      "subventionen",
      "lieferkette",
      "lieferketten",
    ],
  },
  {
    label: "Finanzen & Steuern",
    terms: [
      "finanzen",
      "haushalt",
      "haushaltspolitik",
      "steuer",
      "steuern",
      "steuerpolitik",
      "schuldenbremse",
      "neuverschuldung",
      "verschuldung",
      "mehrwertsteuer",
      "umsatzsteuer",
      "einkommensteuer",
      "erbschaftsteuer",
      "vermögensteuer",
    ],
  },
  {
    label: "Inflation & Preise",
    terms: [
      "inflation",
      "teuerung",
      "preissteigerung",
      "preisanstieg",
      "lebenshaltungskosten",
      "kaufkraft",
    ],
  },
  {
    label: "Bürgergeld & Sozialleistungen",
    terms: [
      "bürgergeld",
      "hartz iv",
      "sozialleistungen",
      "sozialstaat",
      "sozialhilfe",
      "grundsicherung",
      "transferleistungen",
      "arbeitslosengeld",
      "alg",
      "alg2",
      "jobcenter",
      "aufstocker",
      "arbeitslose",
      "arbeitslosigkeit",
    ],
  },
  {
    label: "Mindestlohn",
    terms: ["mindestlohn", "mindestlöhne"],
  },
  {
    label: "Rente",
    terms: [
      "rente",
      "renten",
      "rentenpolitik",
      "rentensystem",
      "altersvorsorge",
      "rentenversicherung",
      "rentner",
      "rentnerin",
      "pension",
      "pensionäre",
      "altersarmut",
    ],
  },
  {
    label: "Gesundheit",
    terms: [
      "gesundheit",
      "gesundheitspolitik",
      "krankenversicherung",
      "krankenkasse",
      "krankenkassen",
      "krankenhaus",
      "krankenhäuser",
      "krankenhausreform",
      "arzt",
      "ärzte",
      "ärztin",
      "corona",
      "pandemie",
      "covid",
      "impfung",
      "impfpflicht",
      "apotheke",
      "apotheken",
      "medikament",
      "medikamente",
    ],
  },
  {
    label: "Pflege",
    terms: ["pflege", "pflegekräfte", "pflegeversicherung", "pflegenotstand", "pflegereform"],
  },
  {
    label: "Wohnen & Mieten",
    terms: [
      "wohnen",
      "wohnungsbau",
      "wohnungspolitik",
      "mieten",
      "mietrecht",
      "mietendeckel",
      "mietpreisbremse",
      "wohnungsnot",
      "mieterhöhung",
      "nebenkosten",
      "kaltmiete",
      "warmmiete",
      "wohnungsknappheit",
      "wohnungsmangel",
      "vermieter",
      "mieter",
    ],
  },
  {
    label: "Verkehr & Mobilität",
    terms: [
      "verkehr",
      "verkehrspolitik",
      "mobilität",
      "deutschlandticket",
      "bahn",
      "deutsche bahn",
      "schiene",
      "öpnv",
      "autobahn",
      "autobahnen",
      "tempolimit",
      "e-auto",
      "elektroauto",
      "dieselauto",
      "radweg",
      "fahrradweg",
    ],
  },
  {
    label: "Infrastruktur",
    terms: [
      "infrastruktur",
      "infrastrukturpolitik",
      "infrastrukturinvestitionen",
      "infrastrukturausbau",
      "brücke",
      "brücken",
      "brückensanierung",
      "sanierungsstau",
      "stau",
      "staus",
      "baustelle",
      "baustellen",
    ],
  },
  {
    label: "Digitalisierung",
    terms: [
      "digitalisierung",
      "digitalpolitik",
      "digital",
      "breitband",
      "glasfaser",
      "cybersicherheit",
      "internet",
      "datenschutz",
      "dsgvo",
      "vorratsdatenspeicherung",
    ],
  },
  {
    label: "Künstliche Intelligenz",
    terms: [
      "ki",
      "künstliche intelligenz",
      "ai",
      "algorithmen",
      "chatgpt",
      "chatbot",
      "deepfake",
      "deepfakes",
    ],
  },
  {
    label: "Außenpolitik & EU",
    terms: ["außenpolitik", "eu", "europäische union", "europapolitik", "brüssel", "nato"],
  },
  {
    label: "Bundeswehr & Verteidigung",
    terms: [
      "bundeswehr",
      "verteidigung",
      "verteidigungspolitik",
      "militär",
      "rüstung",
      "wehrdienst",
      "wehrpflicht",
      "sondervermögen",
      "soldat",
      "soldaten",
      "soldatin",
      "soldatinnen",
      "waffen",
      "waffenlieferung",
      "waffenlieferungen",
      "panzer",
      "armee",
    ],
  },
  {
    label: "Ukraine & Russland",
    terms: ["ukraine", "ukrainekrieg", "russland", "putin", "sanktionen"],
  },
  {
    label: "Israel & Nahost",
    terms: ["israel", "gaza", "palästina", "hamas", "nahost", "libanon"],
  },
  {
    label: "China",
    terms: ["china", "taiwan", "peking"],
  },
  {
    label: "USA & Transatlantik",
    terms: ["usa", "washington", "trump", "biden", "amerika"],
  },
  {
    label: "Innere Sicherheit",
    terms: [
      "innere sicherheit",
      "polizei",
      "kriminalität",
      "terror",
      "terrorismus",
      "extremismus",
      "verfassungsschutz",
      "gewalt",
      "gewalttat",
      "gewalttaten",
      "messerangriff",
      "messerangriffe",
      "vergewaltigung",
      "sexualdelikt",
      "sexualstraftat",
      "sexualstraftaten",
      "mord",
      "morde",
      "totschlag",
      "tötung",
      "tötungsdelikt",
      "raub",
      "einbruch",
      "diebstahl",
      "übergriff",
      "übergriffe",
      "gewaltverbrechen",
      "gewaltkriminalität",
      "verbrechen",
    ],
  },
  {
    label: "Justiz & Strafrecht",
    terms: [
      "justiz",
      "justizpolitik",
      "strafrecht",
      "strafgesetz",
      "gericht",
      "gerichte",
      "richter",
      "richterin",
      "verfassungsgericht",
      "urteil",
      "urteile",
      "strafe",
      "gefängnis",
      "haft",
      "haftstrafe",
      "anklage",
    ],
  },
  {
    label: "Bildung & Schule",
    terms: [
      "bildung",
      "bildungspolitik",
      "schule",
      "schulen",
      "lehrer",
      "lehrkräfte",
      "ganztag",
      "ganztagsbetreuung",
      "schüler",
      "schülerin",
      "schülerinnen",
      "lehrermangel",
      "digitalpakt",
      "pisa",
      "pisa-studie",
      "klassengröße",
    ],
  },
  {
    label: "Hochschule & Forschung",
    terms: [
      "hochschule",
      "hochschulen",
      "universität",
      "universitäten",
      "forschung",
      "wissenschaft",
      "innovation",
    ],
  },
  {
    label: "Ausbildung",
    terms: ["ausbildung", "berufsausbildung", "azubi", "auszubildende", "duale ausbildung"],
  },
  {
    label: "Familie & Kinder",
    terms: [
      "familie",
      "familien",
      "familienpolitik",
      "elterngeld",
      "eltern",
      "kindergeld",
      "kindergrundsicherung",
      "kinderbetreuung",
      "kita",
      "kind",
      "kinder",
      "kindertagesstätte",
      "senioren",
    ],
  },
  {
    label: "Landwirtschaft",
    terms: [
      "landwirtschaft",
      "agrar",
      "agrarpolitik",
      "bauern",
      "agrardiesel",
      "ernährung",
      "bauernproteste",
      "landwirt",
      "landwirtin",
      "landwirte",
      "traktor",
      "lebensmittel",
      "nahrungsmittel",
    ],
  },
  {
    label: "Umwelt & Naturschutz",
    terms: [
      "umwelt",
      "umweltschutz",
      "naturschutz",
      "artenschutz",
      "biodiversität",
      "tierschutz",
      "wald",
      "wälder",
      "wolf",
      "wölfe",
      "dürre",
      "hochwasser",
      "plastik",
      "plastikmüll",
      "mikroplastik",
    ],
  },
  {
    label: "Arbeit & Arbeitsmarkt",
    terms: [
      "arbeit",
      "arbeitsmarkt",
      "arbeitnehmer",
      "arbeitgeber",
      "arbeitszeit",
      "tarif",
      "tarifvertrag",
      "gewerkschaft",
      "gewerkschaften",
      "homeoffice",
      "viertagewoche",
      "4-tage-woche",
      "streik",
      "streiks",
      "tarifrunde",
    ],
  },
  {
    label: "Fachkräftemangel",
    terms: ["fachkräftemangel", "fachkräfte", "demografie", "demografischer wandel"],
  },
  {
    label: "Wahlen & Wahlrecht",
    terms: ["wahl", "wahlen", "wahlrecht", "wahlkreis", "wahlkreise", "briefwahl"],
  },
  {
    label: "Demokratie & Verfassung",
    terms: ["demokratie", "grundgesetz", "verfassung", "parlamentarismus", "rechtsstaat"],
  },
  {
    label: "Kommunen & Länder",
    terms: [
      "kommune",
      "kommunen",
      "kommunal",
      "kommunalpolitik",
      "kommunalfinanzen",
      "gemeinde",
      "gemeinden",
      "landkreis",
      "landkreise",
      "bundesländer",
      "föderalismus",
      "bürgermeister",
      "bürgermeisterin",
      "oberbürgermeister",
      "gemeinderat",
      "stadtrat",
    ],
  },
  {
    label: "Bürokratie & Verwaltung",
    terms: [
      "bürokratie",
      "bürokratieabbau",
      "verwaltung",
      "verwaltungsmodernisierung",
      "verwaltungsdigitalisierung",
      "behörde",
      "behörden",
      "formular",
      "formulare",
      "genehmigung",
      "antrag",
      "anträge",
    ],
  },
  {
    label: "Medien",
    terms: ["medien", "presse", "rundfunk", "öffentlich-rechtlich"],
  },
  {
    label: "Cannabis & Drogen",
    terms: ["cannabis", "drogen", "legalisierung"],
  },
  {
    label: "Antisemitismus",
    terms: ["antisemitismus", "judenhass", "antisemitisch"],
  },
  {
    label: "Rassismus & Diskriminierung",
    terms: ["rassismus", "diskriminierung", "fremdenfeindlichkeit", "rassistisch"],
  },
  {
    label: "LSBTIQ & Queer",
    terms: ["queer", "lgbt", "lgbtq", "lsbtiq", "regenbogen"],
  },
  {
    label: "Gleichstellung",
    terms: [
      "gleichstellung",
      "gleichberechtigung",
      "geschlechtergerechtigkeit",
      "frauen",
      "frauenrechte",
      "feminismus",
    ],
  },
  {
    label: "Schwangerschaftsabbruch",
    terms: ["schwangerschaftsabbruch", "abtreibung", "§218"],
  },
  {
    label: "Sport",
    terms: ["sport", "sportpolitik", "olympia", "fußball"],
  },
  {
    label: "Kultur",
    terms: ["kultur", "kulturpolitik", "kunst", "museum", "museen", "theater"],
  },
];

/**
 * Match-Helper: prüft, ob `term` im `query` als Wort/Phrase an Wortgrenzen vorkommt.
 * Beide Strings werden lowercase verglichen. Whitespace-Boundary, kein Regex \b
 * (damit Umlaute sauber funktionieren).
 */
function termOccursInQuery(query: string, term: string): boolean {
  const paddedQuery = ` ${query.toLowerCase().trim()} `;
  return paddedQuery.includes(` ${term.toLowerCase()} `);
}

export interface ExpandedQuery {
  /** Original-Eingabe, getrimmt */
  original: string;
  /** Zusätzliche Terms aus gematchten Clustern (ohne Duplikate, ohne Original-Tokens) */
  expansions: string[];
  /** Labels der gematchten Cluster — für UI-Anzeige */
  matchedClusters: string[];
}

/**
 * Erweitert Query um Cluster-Synonyme. Match wenn ein beliebiger Cluster-Term
 * im Query als ganzes Wort/Phrase vorkommt.
 */
export function expandQuery(rawQuery: string): ExpandedQuery {
  const original = rawQuery.trim();
  const queryLower = original.toLowerCase();
  if (original.length < 2) {
    return { original, expansions: [], matchedClusters: [] };
  }

  const expansions = new Set<string>();
  const matchedClusters: string[] = [];

  for (const cluster of SYNONYM_CLUSTERS) {
    const matched = cluster.terms.some((term) => termOccursInQuery(queryLower, term));
    if (!matched) continue;
    matchedClusters.push(cluster.label);
    for (const term of cluster.terms) {
      if (!termOccursInQuery(queryLower, term)) expansions.add(term);
    }
  }

  return {
    original,
    expansions: [...expansions],
    matchedClusters,
  };
}
