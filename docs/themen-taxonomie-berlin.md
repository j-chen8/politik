# Berlin-Themen-Taxonomie (2-stufig) — SoT

**Status:** DRAFT, Phase A (2026-06-15) · **Pendant zu** `docs/themen-taxonomie-bt.md`
**Generiert nach:** `scripts/_lib/themen-taxonomie-berlin.ts` (bei Doc-Änderung dort nachziehen)

## Zweck

Volle BT-Parität für Berlin: eine **zweite, feine Ebene** unter den 16 Feldern
aus `src/lib/berlin-themen-struktur.ts`. Die 47 kontrollierten Roh-Tags
(`thema_json`) sind die grobe Achse-A-Hülle; diese **Unterthemen** sind die
LLM-vergebene 2. Ebene darin. Klassifikation: jede DS bekommt 1–3
`{feld, unterthema}`-Paare + 1–4 spezifische Tags (Spiegel von
`batch-unterthemen-global.ts`).

## Berlin-Eigenheiten (warum nicht 1:1 vom Bund)

- **Stadtstaat:** Schule, Kita, Polizei, Justiz, Strafvollzug, Hochschulen sind
  Landeskompetenz → eigene, granulare Felder statt Bundes-Rahmen.
- **Bezirke/Senat:** Zwei-Ebenen-Verwaltung ist ein durchgängiger Quer-Faktor
  (eigenes Querschnitt-Feld + Unterthema „Senat–Bezirk").
- **Keine** Außenpolitik/Verteidigung/EU/Entwicklung/Bundessteuern (nicht
  Landesmaterie) — anders als die 25 BT-Felder.
- Berlin-Spezifika in den Unterthemen: Bürgerämter-Wartezeiten, City-Tax/
  Zweckentfremdung, Versammlungsrecht, Schulbauoffensive, Flughafen BER,
  Milieuschutz/soziale Erhaltungsgebiete, Energiearmut.

## Aggregations- & Kanonik-Regeln (wie Bund)

- Unterthema MUSS zeichengenau aus der Liste seines Feldes stammen, sonst
  `Sonstiges` für das Feld (ehrlicher Auffang, kein Zwang).
- Feld-Label = zeichengenau die `label`-Strings aus `berlin-themen-struktur.ts`
  → direkter Join auf die UI-Feldstruktur. Hier **nichts** umbenennen.
- Multi-Feld erlaubt (1–3 Paare), pro DS entdoppelt. Querschnitt additiv.
- 100 % neutral: Gegenstand beschreiben, nicht bewerten.

## Taxonomie (16 Felder · 104 Unterthemen)

### Achse A — Politikfelder (12)

**Stadtentwicklung, Bauen & Wohnen**
- Mietregulierung & Mieterschutz
- Sozialer & landeseigener Wohnungsbau
- Bauleitplanung & Bebauungspläne
- Landeseigene Liegenschaften & Grundstückspolitik
- Stadtteilentwicklung & Quartiersmanagement
- Wohnungslosigkeit & Obdachlosenhilfe
- Leerstand & Gebäudeverwahrlosung
- Denkmalschutz & Baukultur
- Große Stadtentwicklungsprojekte

**Verwaltung & Digitales**
- Bürgerämter & Bürgerdienste
- Personal & Beschäftigte im öffentlichen Dienst
- Verwaltungsmodernisierung & Bürokratieabbau
- E-Government & digitale Verwaltungsleistungen
- IT-Infrastruktur & digitale Souveränität
- Datenschutz & Informationssicherheit
- Verwaltungsorganisation & Zuständigkeiten

**Mobilität & Verkehr**
- ÖPNV & Nahverkehr
- Radverkehr & Radinfrastruktur
- Fuß- & Schulwegsicherheit
- Verkehrssicherheit & Verkehrsunfälle
- Straßen, Brücken & Verkehrsbauprojekte
- Parkraum & ruhender Verkehr
- Verkehrsplanung & Verkehrswende

**Soziales, Arbeit & Familie**
- Kinder- & Jugendhilfe, Kinderschutz
- Familienförderung & Kinderarmut
- Grundsicherung & soziale Leistungen
- Inklusion & Teilhabe von Menschen mit Behinderung
- Arbeitsmarkt, Ausbildung & Fachkräfte
- Senior:innen & Altenhilfe
- Soziale Träger & Förderung
- Soziale Daseinsvorsorge & Quartiersangebote

**Bildung & Wissenschaft**
- Schulplätze, Schulbau & Sanierung
- Lehrkräfte & Schulpersonal
- Unterricht, Qualität & Abschlüsse
- Schulische Inklusion & Förderschwerpunkte
- Kita & frühkindliche Bildung
- Berufliche Bildung & Ausbildung
- Hochschulen & Wissenschaft
- Politische Bildung & Demokratiebildung

**Innere Sicherheit & Justiz**
- Polizei: Ausstattung, Personal & Befugnisse
- Kriminalitätslage & Kriminalitätsbekämpfung
- Versammlungsrecht & Demonstrationen
- Justiz, Gerichte & Rechtspflege
- Strafvollzug & Justizvollzugsanstalten
- Extremismus & Verfassungsschutz
- Gewaltprävention & Opferschutz
- Feuerwehr, Rettungsdienst & Katastrophenschutz

**Finanzen & Haushalt**
- Landeshaushalt & Haushaltsführung
- Förderungen, Zuwendungen & Projektfinanzierung
- Steuern & Abgaben
- Landesbeteiligungen & landeseigene Unternehmen
- Vergabe, Beschaffung & Vergabekontrolle
- Bezirkshaushalte & kommunale Finanzen

**Umwelt, Klima & Energie**
- Klimaschutz & Klimaanpassung
- Stadtgrün, Bäume & Naturschutz
- Energieversorgung & Wärmewende
- Erneuerbare Energien & Solar
- Energiekosten & Energiearmut
- Wasser, Gewässer & Abwasser
- Abfall, Sauberkeit & Kreislaufwirtschaft
- Tierschutz
- Luftreinhaltung, Lärm & Umweltbelastung

**Gesundheit & Pflege**
- Krankenhäuser & stationäre Versorgung
- Öffentlicher Gesundheitsdienst & Prävention
- Pflege & Altenhilfe
- Sucht- & Drogenhilfe
- Psychische Gesundheit
- Gesundheitsversorgung vulnerabler Gruppen
- Infektionsschutz & Pandemie-Aufarbeitung

**Migration & Integration**
- Geflüchtetenunterbringung & Unterkünfte
- Asyl, Aufenthalt & Landesaufnahme
- Abschiebung & Rückführung
- Integrationsförderung & gesellschaftliche Teilhabe
- Sprachförderung & Bildungsintegration
- Migrationsstatistik & -kosten

**Kultur & Sport**
- Kulturförderung & Kultureinrichtungen
- Erinnerungskultur, Gedenken & Provenienz
- Freie Szene, Clubs & Kreativwirtschaft
- Sportförderung & Vereinssport
- Sportstätten & Bäder
- Sportgroßveranstaltungen & Olympia

**Wirtschaft & Tourismus**
- Wirtschaftsförderung & Standortpolitik
- Gewerbeflächen & Gewerberaum
- Tourismus & Beherbergung
- Flughafen BER & Luftverkehr
- Handwerk, Mittelstand & Gründung
- Nacht- & Veranstaltungswirtschaft

### Achse B — Querschnitt (4)

**Bezirksbezug**
- Senat–Bezirk: Zuständigkeit & Steuerung
- Bezirkliche Daseinsvorsorge & Infrastruktur
- Lokale Einzelvorhaben & Standortfragen

**Transparenz & Open Data**
- Informationsfreiheit & Aktenzugang
- Open Data & Open Source
- Vergabe-, Förder- & Verwaltungstransparenz
- Statistik- & Berichtspflichten

**Demokratie & Teilhabe**
- Wahlen & Wahlrecht
- Bürgerbeteiligung & Mitbestimmung
- Parlament & Abgeordnetenrechte
- Demokratieförderung & Zivilgesellschaft
- Jugend- & Seniorenbeteiligung

**Gleichstellung & Antidiskriminierung**
- Geschlechtergleichstellung & Frauenförderung
- LSBTIQ* & queere Lebensweisen
- Antirassismus & Antidiskriminierung
- Antisemitismus-Prävention
- Geschlechtsspezifische & häusliche Gewalt

## Offene Design-Fragen (vor Phase B zu klären)

1. **Kita-Verortung:** aktuell unter *Bildung & Wissenschaft* (wie Bund), nicht
   unter *Soziales/Familie* — Kita ist in Berlin bei SenBJF. Bewusste Wahl.
2. **Querschnitt dünner:** 3–5 Unterthemen statt 6–9, weil die 4 Querschnitt-
   Tags genuin schmaler sind. Ehrlich, kein Auffüllen.
3. **Granularität:** ⌀6,5 Unterthemen/Feld (Bund: ⌀8,1) — Berlin hat kürzere
   Inputs (v.a. Kleine Anfragen), feiner würde overfitten.
