/**
 * Zweistufige BERLIN-Themen-Taxonomie (Politikfeld → Unterthemen) — das Pendant
 * zur Bund-Taxonomie (scripts/_lib/themen-taxonomie.ts).
 *
 * GENERIERT aus docs/themen-taxonomie-berlin.md (SoT für Review/Änderungen) —
 * nach Doc-Änderungen hier nachziehen.
 *
 * Schlüssel = die 16 Feld-LABELS aus src/lib/berlin-themen-struktur.ts
 * (12 Politikfelder + 4 Querschnitt), zeichengenau identisch, damit der
 * Klassifikations-Output direkt auf die UI-Feldstruktur joint. Die 47 Roh-Tags
 * (thema_json) bleiben als grobe Achse-A-Hülle bestehen; diese Unterthemen sind
 * die feine, LLM-vergebene 2. Ebene DARIN.
 *
 * Stand 2026-06-16 (DRAFT, Phase B): Wohnen-Feld nach Discovery-Tiefenlauf von 9
 * auf 12 Unterthemen erweitert (+ Vergesellschaftung/Enteignung, Wohneigentum,
 * Kleingärten) — siehe docs/themen-unterthemen-berlin.md Befund B3.
 * Stand 2026-06-15 (DRAFT, Phase A): 16 Felder, 104 Unterthemen (+ "Sonstiges"
 * je Feld). Berlin-spezifisch geerdet an 19.449 berlin_drucksachen_analyses
 * (Stadtstaat: Bezirke/Senatsverwaltungen, Schule+Kita+Polizei+Justiz =
 * Landeskompetenz; keine Außen-/Verteidigungs-/Bundessteuer-Felder).
 */
export const TAXONOMIE_BERLIN: Record<string, readonly string[]> = {
  // ── Achse A: 12 Politikfelder ──
  "Stadtentwicklung, Bauen & Wohnen": [
    "Mietregulierung & Mieterschutz",
    "Sozialer & landeseigener Wohnungsbau",
    "Vergesellschaftung & Enteignung", // Phase B (2026-06-16): Volksentscheid DW&Co, 30+ DS, Berlin-Spezifikum
    "Wohneigentum & Eigentumsförderung", // Phase B: Selbstnutzer/Einfamilienhaus/Grunderwerbsteuer, 15+ DS
    "Bauleitplanung & Bebauungspläne",
    "Landeseigene Liegenschaften & Grundstückspolitik",
    "Stadtteilentwicklung & Quartiersmanagement",
    "Kleingärten & Laubenkolonien", // Phase B: Sicherungsgesetz/Moratorium, 52+ DS (Schnittmenge Umwelt/Grün)
    "Wohnungslosigkeit & Obdachlosenhilfe",
    "Leerstand & Gebäudeverwahrlosung",
    "Denkmalschutz & Baukultur",
    "Große Stadtentwicklungsprojekte",
  ],
  "Verwaltung & Digitales": [
    "Bürgerämter & Bürgerdienste",
    "Personal & Beschäftigte im öffentlichen Dienst",
    "Verwaltungsmodernisierung & Bürokratieabbau",
    "E-Government & digitale Verwaltungsleistungen",
    "IT-Infrastruktur & digitale Souveränität",
    "Datenschutz & Informationssicherheit",
    "Verwaltungsorganisation & Zuständigkeiten",
  ],
  "Mobilität & Verkehr": [
    "ÖPNV & Nahverkehr",
    "Radverkehr & Radinfrastruktur",
    "Fuß- & Schulwegsicherheit",
    "Verkehrssicherheit & Verkehrsunfälle",
    "Straßen, Brücken & Verkehrsbauprojekte",
    "Parkraum & ruhender Verkehr",
    "Verkehrsplanung & Verkehrswende",
  ],
  "Soziales, Arbeit & Familie": [
    "Kinder- & Jugendhilfe, Kinderschutz",
    "Familienförderung & Kinderarmut",
    "Grundsicherung & soziale Leistungen",
    "Inklusion & Teilhabe von Menschen mit Behinderung",
    "Arbeitsmarkt, Ausbildung & Fachkräfte",
    "Senior:innen & Altenhilfe",
    "Soziale Träger & Förderung",
    "Soziale Daseinsvorsorge & Quartiersangebote",
  ],
  "Bildung & Wissenschaft": [
    "Schulplätze, Schulbau & Sanierung",
    "Lehrkräfte & Schulpersonal",
    "Unterricht, Qualität & Abschlüsse",
    "Schulische Inklusion & Förderschwerpunkte",
    "Kita & frühkindliche Bildung",
    "Berufliche Bildung & Ausbildung",
    "Hochschulen & Wissenschaft",
    "Politische Bildung & Demokratiebildung",
  ],
  "Innere Sicherheit & Justiz": [
    "Polizei: Ausstattung, Personal & Befugnisse",
    "Kriminalitätslage & Kriminalitätsbekämpfung",
    "Versammlungsrecht & Demonstrationen",
    "Justiz, Gerichte & Rechtspflege",
    "Strafvollzug & Justizvollzugsanstalten",
    "Extremismus & Verfassungsschutz",
    "Gewaltprävention & Opferschutz",
    "Feuerwehr, Rettungsdienst & Katastrophenschutz",
  ],
  "Finanzen & Haushalt": [
    "Landeshaushalt & Haushaltsführung",
    "Förderungen, Zuwendungen & Projektfinanzierung",
    "Steuern & Abgaben",
    "Landesbeteiligungen & landeseigene Unternehmen",
    "Vergabe, Beschaffung & Vergabekontrolle",
    "Bezirkshaushalte & kommunale Finanzen",
  ],
  "Umwelt, Klima & Energie": [
    "Klimaschutz & Klimaanpassung",
    "Stadtgrün, Bäume & Naturschutz",
    "Energieversorgung & Wärmewende",
    "Erneuerbare Energien & Solar",
    "Energiekosten & Energiearmut",
    "Wasser, Gewässer & Abwasser",
    "Abfall, Sauberkeit & Kreislaufwirtschaft",
    "Tierschutz",
    "Luftreinhaltung, Lärm & Umweltbelastung",
  ],
  "Gesundheit & Pflege": [
    "Krankenhäuser & stationäre Versorgung",
    "Öffentlicher Gesundheitsdienst & Prävention",
    "Pflege & Altenhilfe",
    "Sucht- & Drogenhilfe",
    "Psychische Gesundheit",
    "Gesundheitsversorgung vulnerabler Gruppen",
    "Infektionsschutz & Pandemie-Aufarbeitung",
  ],
  "Migration & Integration": [
    "Geflüchtetenunterbringung & Unterkünfte",
    "Asyl, Aufenthalt & Landesaufnahme",
    "Abschiebung & Rückführung",
    "Integrationsförderung & gesellschaftliche Teilhabe",
    "Sprachförderung & Bildungsintegration",
    "Migrationsstatistik & -kosten",
  ],
  "Kultur & Sport": [
    "Kulturförderung & Kultureinrichtungen",
    "Erinnerungskultur, Gedenken & Provenienz",
    "Freie Szene, Clubs & Kreativwirtschaft",
    "Sportförderung & Vereinssport",
    "Sportstätten & Bäder",
    "Sportgroßveranstaltungen & Olympia",
  ],
  "Wirtschaft & Tourismus": [
    "Wirtschaftsförderung & Standortpolitik",
    "Gewerbeflächen & Gewerberaum",
    "Tourismus & Beherbergung",
    "Flughafen BER & Luftverkehr",
    "Handwerk, Mittelstand & Gründung",
    "Nacht- & Veranstaltungswirtschaft",
  ],
  // ── Achse B: 4 Querschnitt-Kategorien ──
  "Bezirksbezug": [
    "Senat–Bezirk: Zuständigkeit & Steuerung",
    "Bezirkliche Daseinsvorsorge & Infrastruktur",
    "Lokale Einzelvorhaben & Standortfragen",
  ],
  "Transparenz & Open Data": [
    "Informationsfreiheit & Aktenzugang",
    "Open Data & Open Source",
    "Vergabe-, Förder- & Verwaltungstransparenz",
    "Statistik- & Berichtspflichten",
  ],
  "Demokratie & Teilhabe": [
    "Wahlen & Wahlrecht",
    "Bürgerbeteiligung & Mitbestimmung",
    "Parlament & Abgeordnetenrechte",
    "Demokratieförderung & Zivilgesellschaft",
    "Jugend- & Seniorenbeteiligung",
  ],
  "Gleichstellung & Antidiskriminierung": [
    "Geschlechtergleichstellung & Frauenförderung",
    "LSBTIQ* & queere Lebensweisen",
    "Antirassismus & Antidiskriminierung",
    "Antisemitismus-Prävention",
    "Geschlechtsspezifische & häusliche Gewalt",
  ],
};

export const FELDER_BERLIN = Object.keys(TAXONOMIE_BERLIN);

// Taxonomie-Block für den System-Prompt (gecacht)
export function taxonomieTextBerlin(): string {
  return Object.entries(TAXONOMIE_BERLIN)
    .map(([feld, cl]) => `[${feld}]\n${cl.map((c) => `- ${c}`).join("\n")}`)
    .join("\n\n");
}

// Enum-Drift-Normalisierung (&amp; etc.) + Paar-Validierung
export function normalizePaarBerlin(feld: string, unterthema: string): { feld: string; unterthema: string } | null {
  const f = feld.replace(/&amp;/g, "&").trim();
  const u = unterthema.replace(/&amp;/g, "&").trim();
  const liste = TAXONOMIE_BERLIN[f];
  if (!liste) return null;
  if (u === "Sonstiges" || liste.includes(u)) return { feld: f, unterthema: u };
  return null;
}
