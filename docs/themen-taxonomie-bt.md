# BT-Themen-Taxonomie: Unterthemen-Listen aller Politikfelder (ENTWURF)

**Stand 2026-06-11 — Discovery-Lauf über alle 25 aw-Felder.** Methode: je Feld
~110 zufällige Drucksachen-Zusammenfassungen vollständig gelesen (10 parallele
Agenten, zusammen ~2.600 Dokumente), induktiv geclustert nach den am
Wirtschaft-Pilot validierten Regeln (5–9 Cluster + Sonstiges-Ventil, kein
Cluster >40 %, neutral benannt, multi-label-tauglich, Fremd-Kern-Items
ausgeschlossen). **Wirtschaft ist bereits klassifiziert** (Batch 2026-06-11,
`ds_unterthemen`); alle anderen Felder sind ENTWURF und warten auf User-Review.

**Ziel-Architektur (entschieden 2026-06-11):** EIN globaler Klassifikations-Lauf
über alle ~4.800 DS — jede Drucksache genau einmal, gegen die GESAMTE Taxonomie
(System-Prompt, gecacht), Output = 1–3 Feld→Unterthema-Paare + offene
spezifische Tags. Ersetzt den überzählenden Feld-Rollup (kern_im_feld entfällt).
Kosten ~$6 Batch. KEINE Feld-für-Feld-Batches mehr (Doppel-Analysen).

**Diagnose-Nebenprodukt — Fremd-Kern-Anteile der Rollups** (bestätigt und
präzisiert den Rollup-Bug): Recht ~55 % · Medien/IT ~50–55 % · Bau/Wohnen
~50–55 % · Umwelt ~50 % · Finanzen ~45 % · Soziale Sicherung ~45 % · Arbeit
~40 % · Energie ~38 % · Innere Sicherheit ~35 % · Bildung ~35 % · Verwaltung
~28 % · Außen/Verkehr/Gesundheit ~25 % · Gesellschaft/Migration/PolitLeben
~23 % · Europa ~22 % · Forschung ~20 % · Verteidigung ~18 % · Kultur ~15 % ·
Landwirtschaft ~13 % · Entwicklung ~8 % · Sport ~5 %.

---

## Wirtschaft (VALIDIERT, klassifiziert — 11 Cluster)

Industrie- & Standortpolitik · Außenhandel, Zölle & Rohstoffe · Digital- &
KI-Wirtschaft · Energiewirtschaft & Energiekosten · Lieferketten &
Unternehmensverantwortung · Wirtschaftsförderung & Subventionen · Mittelstand,
Handwerk & Gründung · Fachkräfte & Arbeitsmarkt-Wirtschaft · Verbraucherschutz ·
Konjunktur, Wachstum & Gesamtsteuerung · Wettbewerb & Kartellrecht

---

## Innere Sicherheit (Stichprobe n=110/1.289, Fremd ~35 %)
1. Extremismus & Verfassungsschutz — rechtsextreme Netzwerke/Finanzströme, PMK-Statistiken, Extremismus in Behörden — ~18 % — 21/1418, 21/5894
2. Kriminalitätslage & Kriminalstatistik — PKS/TVBZ, Delikt-Lagebilder — ~16 % — 21/5608, 21/884
3. Polizei, Befugnisse & Überwachung — Bundespolizei-Ausstattung, Staatstrojaner, IP-Speicherung, Grenzkontrollen, Europol — ~15 % — 21/1009, 21/1697
4. Cybersicherheit, Spionage & hybride Bedrohungen — NIS-2/KRITIS, Desinformation, Sabotage — ~14 % — 21/1501, 21/5957
5. Hasskriminalität & Schutz gefährdeter Gruppen — antisemitische/queerfeindliche Straftaten, Angriffe auf Politiker:innen — ~13 % — 21/5595, 21/2575
6. Terrorismus & Islamismus — IS-Rückkehrer, Terrorstrafrecht, Deradikalisierung — ~7 % — 21/1791, 21/3191
7. Gewaltschutz & Sexualdelikte — häusliche Gewalt, Kindesmissbrauch — ~7 % — 21/3068, 21/4776
8. Wirtschafts- & Finanzkriminalität — Geldwäsche, Förderbetrug, FKS — ~6 % — 21/1343, 21/4675
9. Bevölkerungsschutz, Waffenrecht & öffentliche Ordnung — THW, Veranstaltungssicherheit, Waffenrecht — ~5 % — 21/6093, 21/1174
- Grenzfälle: Migrations-DS = größter Fremd-Block; Hasskriminalität↔Extremismus multi-label; Sammel-DS (90–217 Schriftliche Fragen) un-clusterbar.

## Öffentliche Finanzen, Steuern und Abgaben (n=110/1.279, Fremd ~45 %)
1. Steuerpolitik & Steuerrecht — Steueränderungen, Freibeträge, steuerliche Förderung — ~20 % — 21/2673, 21/687
2. Bundeshaushalt, Schulden & Sondervermögen — Haushaltsgesetze, Fiskalregeln, Sondervermögen — ~15 % — 21/2832, 21/501
3. Steuervollzug, Zoll & Finanzkriminalität — Cum-Cum, Geldwäsche, FKS — ~15 % — 21/536, 21/2731
4. Finanzmarkt, Banken & Finanzaufsicht — Bankenregulierung, BaFin, Krypto, Bundesbeteiligungen — ~15 % — 21/3897, 21/2712
5. Öffentliche Ausgaben & Behördenkosten-Transparenz — Dienstwagen-/PR-/Berater-Anfragen, Vergaberecht — ~13 % — 21/4698, 21/1311
6. Förderprogramme, Zuwendungen & Bürgschaften — Mittelvergabe, Verwendungsnachweise — ~11 % — 21/1119, 21/1344
7. Bund-Länder- & Kommunalfinanzen — Konnexität, USt-Verteilung, Kommunalfinanzen — ~8 % — 21/2440, 21/1892
8. EU- & internationale Finanzpolitik — EU-Haushalt, eingefrorene Vermögen, Goldreserven — ~5 % — 21/5394, 21/4229
- Grenzfälle: „Finanzen" hängt als Kosten-Dimension an fast jedem Feld (45 % Fremd); FKS↔Arbeit, Aktivrente↔Rente, Sondervermögen↔Fachfelder.

## Recht (n=110/1.044, Fremd ~55 %)
1. Strafrecht & Strafverfahren — StGB/StPO-Änderungen, neue/gestrichene Tatbestände — ~19 % — 21/3901, 21/1390
2. Strafverfolgung, Kriminalstatistik & Wirtschaftskriminalität — Verurteilungsstatistiken, Cum-Ex, OK — ~17 % — 21/868, 21/310
3. Strafvollzug & Strafvollstreckung — Haftbedingungen, Maßregel — ~8 % — 21/800, 21/2244
4. Opferschutz & Gewaltschutz — Gewaltschutzgesetz, häusliche Gewalt — ~9 % — 21/3068, 21/4499
5. Zivil-, Familien- & Verbraucherrecht — Abstammungsrecht, Urheberrecht, Anti-SLAPP — ~10 % — 21/4324, 21/2788
6. Justizsystem, Gerichte & Digitalisierung der Justiz — Justiz-Personal, BVerfG, Online-Verfahren — ~14 % — 21/5403, 21/2780
7. Rechtsangelegenheiten & Rechtspolitik der Bundesbehörden — Prozesskosten-Serien, Disziplinarrecht, Rechtsbereinigung — ~19 % — 21/96, 21/249
- Grenzfälle: Fremd-Anteil über Justiz/Menschenrechte-Co-Tags (Asyl, Lieferketten, Extremismus); Meinungsfreiheits-Motiv als Facette; Cluster 7 = Serien-Anfragen.

## Staat und Verwaltung (n=110/811, Fremd ~28 %)
1. Transparenz, Informationsfreiheit & Aktenzugang — IFG, Aktenführung, Auskunftsgrenzen — ~18 % — 21/5929, 21/3201
2. Lobbyismus & Interessenkonflikte — externe Mitarbeiter, Seitenwechsel, Geschenke — ~15 % — 21/162, 21/2970
3. Externe Beratung, Gutachten & Regierungskommunikation — Beraterverträge, PR-Ausgaben — ~14 % — 21/3574, 21/3528
4. Staatliche Förderungen & Zuwendungskontrolle — Verwendungsnachweise, Rechnungshof-Kritik — ~11 % — 21/3457, 21/2379
5. Bürokratieabbau & Verwaltungsvereinfachung — Entlastungsgesetze, NKR, Vergabe-Vereinfachung — ~14 % — 21/4044, 21/4810
6. Digitale Verwaltung & Register — OZG, E-Akte, KI in Behörden, Registerzensus — ~8 % — 21/853, 21/3055
7. Parlament, Wahlen & Geschäftsordnung — GO-BT, Wahlprüfung, Verfassungsrichterwahl — ~9 % — 21/1557, 21/3100
8. Bundesbehörden, Personal & Ressortberichte — Tätigkeits-Serien, Personalstruktur, Gleichstellungspraxis — ~11 % — 21/306, 21/1844
- Grenzfälle: EZ-Transparenzportal-Serie (Kern strittig: Kontrolle vs. EZ); Berater↔Lobbyisten multi-label; Genehmigungsbeschleunigung → Fachfeld.

## Medien, Kommunikation und Informationstechnik (n=110/734, Fremd ~50–55 %)
1. Digitale Verwaltung, Justiz & Staatsmodernisierung — OZG, eID/EUDI-Wallet, BMDS, E-Rezept-Umsetzung — ~24 % — 21/4180, 21/1297
2. Cybersicherheit & kritische Infrastrukturen — NIS-2/BSI, KRITIS-Dach, Post-Quanten-Krypto — ~20 % — 21/1501, 21/2725
3. Plattformen, digitale Dienste & Online-Werbung — DSA/DSC, Plattformaufsicht, Jugendmedienschutz — ~18 % — 21/1050, 21/4089
4. Datenschutz, Überwachung & Bürgerrechte — BKA-Gesetz, Datenübermittlung, ePA-Sicherheit — ~11 % — 21/633, 21/1788
5. KI & digitale Infrastruktur — Gigafactories, Rechenzentren, AI-Act (Überlappung mit Digital- & KI-Wirtschaft GEWOLLT) — ~9 % — 21/4817, 21/4833
6. Online-Kriminalität, Deepfakes & digitale Gewalt — bildbasierte Gewalt, Deepfakes, Scamming — ~9 % — 21/4949, 21/5638
7. Krypto-Regulierung & digitale Finanzen — Kryptowerte-Besteuerung, DAC8 — ~8 % — 21/765, 21/1707
- Grenzfälle: Breitband marginal (~2 %, unter KI/Infrastruktur fassbar); klassische Medienpolitik fast abwesend (Länderkompetenz) — Feldname verspricht mehr „Medien" als da ist; Digital-Health quer (multi-label).

## Gesundheit (n=110/466, Fremd ~25 %)
1. Corona-Aufarbeitung, Impfen & Pandemiefolgen — STIKO, Maskenkosten, Long-COVID — ~19 % — 21/805, 21/3755
2. Infektionsschutz & öffentlicher Gesundheitsdienst — RKI-Surveillance, IGV, ÖGD — ~14 % — 21/1508, 21/4286
3. Krankenhäuser & Versorgungsstrukturen — KHVVG, MVZ, Geburtshilfe — ~13 % — 21/4535, 21/708
4. Notfall- & Rettungsversorgung, Krisenresilienz — Rettungsdienst, Notfallreform, Kriegsfall-Resilienz — ~12 % — 21/2214, 21/3269
5. Prävention, Ernährung & Umweltgesundheit — Zuckerabgabe, Präventionsgesetz, EMF — ~12 % — 21/2537, 21/5953
6. Psychische Gesundheit, Sucht & Cannabis — Jugend-Psyche, Suchthilfe, CanG-Evaluation — ~9 % — 21/1837, 21/3912
7. Arzneimittel, Apotheken & Medizinprodukte — Lieferengpässe, Preisbindung, MDR — ~8 % — 21/383, 21/2572
8. Pflege — Pflegekompetenzgesetz, Heimqualität, Abrechnungsbetrug — ~7 % — 21/2642, 21/1154
9. Kranken- & Pflegeversicherung: Finanzierung & Beiträge — GKV-Stabilisierung, PKV — ~7 % — 21/6130, 21/2625
- Grenzfälle: Migration×Gesundheit multi-label; Aufarbeitung (retro) vs. Infektionsschutz (laufend); Digital-Health zu klein für eigenen Cluster.

## Umwelt (n=110/707, Fremd ~50 %)
1. Klimapolitik, Klimaziele & CO₂-Speicherung — Programme, Emissionsbilanzen, CCS, internationale Klimafinanzierung — ~20 % — 21/1345, 21/3976
2. Klimaanpassung, Wasser & Extremwetter — Dürre, Waldbrände, Hitzeschutz, Trinkwasser — ~13 % — 21/351, 21/6033
3. Naturschutz, Artenvielfalt & Wildtiere — Wolf, invasive Arten, Artenschutz in Genehmigungen — ~13 % — 21/3546, 21/2952
4. Meeres- & Gewässerschutz — BBNJ, Wattenmeer, Offshore-Auflagen — ~9 % — 21/3943, 21/4328
5. Kreislaufwirtschaft, Abfall & Recycling — ElektroG, Batterien, Einwegkunststoff — ~9 % — 21/2070, 21/2637
6. Chemikalien, Luftreinhaltung & Altlasten — F-Gase, TA-Luft, Rüstungsaltlasten — ~13 % — 21/4993, 21/2740
7. Atommüll, Endlager & nukleare Sicherheit — Endlager, KKW-Rückbau — ~5 % — 21/2798, 21/6126
8. Umweltrecht, Verbände & Genehmigungsverfahren — Verbandsklage, Umwelt-NGO-Förderung — ~7 % — 21/935, 21/1081
- Grenzfälle/Trennlinie zu Energie: Klima-STEUERUNG (Ziele, Bilanzen, ETS-Rahmen) → Umwelt; technisch-wirtschaftliche UMSETZUNG (EE, Netze, Wärme) → Energie. Kernenergie: Erzeugung → Energie, Endlager/Strahlenschutz → Umwelt.

## Energie (n=110/528, Fremd ~38 %)
1. Erneuerbarer Strom: Wind, Solar & EEG — Ausbau, Vergütung, Akzeptanz — ~13 % — 21/3078, 21/4457
2. Stromnetze, Netzausbau & Systemstabilität — SuedLink, Smart Meter, Blackout — ~15 % — 21/6128, 21/2519
3. Energiepreise, Energiesteuern & Entlastungen — Stromsteuer, Entlastungspakete (Überlappung mit Energiewirtschaft & Energiekosten GEWOLLT) — ~13 % — 21/2753, 21/4750
4. Gasversorgung, LNG & Import-Geopolitik — Speicher, LNG, Nord Stream — ~10 % — 21/3452, 21/3514
5. Kernenergie & nukleare Brennstoffkette — SMR-Anträge, Urananreicherung — ~9 % — 21/3302, 21/4668
6. Wasserstoff, Bioenergie & erneuerbare Gase — H₂-Infrastruktur, Biogas, E-Fuels — ~11 % — 21/2506, 21/2451
7. Versorgungssicherheit & kritische Infrastruktur — Sabotage, KRITIS, Investitionsprüfung — ~8 % — 21/3596, 21/3803
8. Wärmewende & Gebäudeenergie — GEG, kommunale Wärmeplanung — ~7 % — 21/1115, 21/6005
9. Kraftwerke, Kohleausstieg & Staatsbeteiligungen — Kraftwerksstrategie, LEAG, Uniper — ~7 % — 21/2598, 21/1203
- Grenzfälle: GEG/CO₂-Preis = Multi-Label Umwelt↔Energie↔Wohnen.

## Landwirtschaft und Ernährung (n=110/227 ≈ 48 % des Feldes, Fremd ~13 %)
1. Agrarförderung, GAP & ländliche Entwicklung — ~11 % — 21/910, 21/4945
2. Pflanzenschutz, Düngung & Pflanzenbau — ~15 % — 21/2827, 21/2547
3. Tierhaltung, Tierschutz & Stallumbau — ~12 % — 21/1004, 21/856
4. Tiergesundheit & Tierseuchen — ASP, Vogelgrippe — ~6 % — 21/5708, 21/4426
5. Wolf, Jagd & Wildtiermanagement — ~12 % — 21/4371, 21/1617
6. Agrarmärkte, Erzeugerpreise & Lieferketten — Milchmarkt, UTP, Mercosur — ~13 % — 21/3683, 21/980
7. Ernährungspolitik, Lebensmittelsicherheit & Kennzeichnung — ~13 % — 21/5603, 21/3470
8. Flächen, Boden & Ernährungssicherung — Flächenverbrauch, Bodenpreise — ~7 % — 21/844, 21/6138
9. Betriebe, Agrarsoziales, Steuern & Bürokratie — Agrardiesel, Hofübergaben — ~10 % — 21/5817, 21/2548
- Grenzfälle: Wolf/Jagd multi-label LW↔Umwelt; Biogas/Flächen LW↔Energie.

## Außenpolitik und internationale Beziehungen (n=110/686, Fremd ~25 %)
1. Naher Osten (Israel/Gaza, Iran, Syrien) — ~17 % — 21/1674, 21/141
2. Ukraine, Russland & Sanktionen — ~13 % — 21/165, 21/4270
3. Außenwirtschaft, Handel & Rohstoffe — Zölle, Abkommen, AHK — ~12 % — 21/4112, 21/4072
4. Menschenrechte & bilaterale Länderbeziehungen — ~12 % — 21/1795, 21/4636
5. Auswärtiger Dienst, Kultur- & Bildungsaußenpolitik — AA, konsularisch, AKBP — ~11 % — 21/177, 21/5517
6. UN, NATO & internationale Organisationen — ~9 % — 21/979, 21/2675
7. Bundeswehr-Auslandseinsätze & Missionsmandate — ~8 % — 21/444, 21/3206
8. Rüstungsexporte & Waffenexportkontrolle — ~7 % — 21/3362, 21/5590
- Grenzfälle: Rüstungsexporte↔Naher Osten multi-label; Geo-Ökonomie zwischen 3 und 4.

## Europapolitik und Europäische Union (n=110/259, Fremd ~22 %)
1. Deutsch-französische & Nachbarschafts-Kooperation — ~15 % — 21/3677, 21/3861
2. Umsetzung von EU-Recht in deutsches Recht — ~14 % — 21/1847, 21/4999
3. Laufende EU-Regulierung & deutsche Verhandlungsposition — ~13 % — 21/2352, 21/749
4. Euro, Bankenunion & Finanzstabilität — ~12 % — 21/530, 21/4376
5. EU-Dokumente & parlamentarische Europa-Befassung — ~12 % — 21/1653, 21/860
6. EU-Haushalt, Fonds & Förderprogramme — MFR, ESF+ — ~10 % — 21/3298, 21/5394
7. Subsidiarität & Kompetenzverteilung — Rügen, Zuständigkeitsfragen — ~8 % — 21/1755, 21/4947
8. EU-Asyl, Grenzen & Freizügigkeit — Dublin, Binnengrenzen — ~6 % — 21/1668, 21/675
- Grenzfälle: 2 vs. 3 = prozessualer Schnitt (beschlossen vs. laufend); EU-Verteidigung → Feld Verteidigung.

## Entwicklungspolitik (n=110/247 ≈ 45 % des Feldes, Fremd ~8 %)
1. Projekt-Transparenz, Mittelkontrolle & Evaluierung — Transparenzportal-Serie — ~28 % — 21/3486, 21/3768
2. Durchführungsorganisationen, Stiftungen & NGOs — GIZ/KfW, politische Stiftungen — ~13 % — 21/4401, 21/2513
3. ODA-Finanzierung, Haushalt & Schulden — 0,7 %, Kürzungen, Schuldenerlasse — ~11 % — 21/4580, 21/451
4. Flucht, humanitäre Hilfe & Wiederaufbau — ~12 % — 21/3467, 21/4245
5. Gender, Frauen & LGBTIQ in der EZ — ~10 % — 21/273, 21/3987
6. Bildung, Ausbildung & Freiwilligendienste — ~8 % — 21/1575, 21/3415
7. Multilaterale EZ, Entwicklungsbanken & globale Gesundheit — ~6 % — 21/4229, 21/2667
8. Handel, Wirtschaftspartnerschaften & Rohstoffe — WPA, Pestizidexporte — ~5 % — 21/2257, 21/2035
- Grenzfälle: Cluster 1 = AfD-Serien-Welle (fragesteller-getrieben, könnte abebben).

## Arbeit und Beschäftigung (n=110/585, Fremd ~40 %)
1. Mindestlohn & Schwarzarbeitskontrolle — Kommission, FKS-Serien — ~18 % — 21/1428, 21/4416
2. Tarifbindung, Gewerkschaften & Mitbestimmung — AVE, Tariftreue — ~13 % — 21/5393, 21/4344
3. Grundsicherung, Jobcenter & Arbeitsvermittlung — Aktivierungsseite, §16i, BA — ~18 % — 21/4523, 21/3604
4. Fachkräfte, Qualifizierung & Weiterbildung — Beschäftigten-Sicht (komplementär zu Fachkräfte & Arbeitsmarkt-Wirtschaft) — ~14 % — 21/3480, 21/5518
5. Arbeitsschutz & Arbeitsbedingungen — Unfälle, Hitze, Plattformarbeit, ILO — ~14 % — 21/2626, 21/6077
6. Erwerbsbeteiligung, Arbeitszeit & Vereinbarkeit — ~8 % — 21/1048, 21/2241
7. Arbeitsmarktintegration & Sprachförderung Geflüchteter — ~9 % — 21/3135, 21/1094
- Grenzfälle/Trennlinie zu Soziale Sicherung: Erwerbsbezug → Arbeit; Leistungshöhe/Existenzsicherung → Soziales (Bürgergeld = klassisches Multi-Label).

## Soziale Sicherung (n=110/514, Fremd ~45 %)
1. Rente & Alterssicherung — gesetzliche/private/Betriebsrente, Aktivrente — ~24 % — 21/965, 21/3040
2. Grundsicherung & Bürgergeld (Leistungsseite) — Regelsätze, Sanktionen — ~16 % — 21/2814, 21/4288
3. Kranken- & Pflegeversicherung — Beiträge, Beihilfe, Leistungsseite — ~11 % — 21/497, 21/3799
4. Armut & Lebenshaltungskosten — Armutsbericht, Wohnungslosigkeit, Klimageld — ~12 % — 21/3250, 21/3852
5. Sozialleistungen für Geflüchtete & AsylbLG — ~9 % — 21/4086, 21/3571
6. Teilhabe & Behinderung — BTHG, Werkstätten — ~6 % — 21/1545, 21/2311
7. Engagement, Freiwilligendienste & soziale Hilfesysteme — ~9 % — 21/3979, 21/758
8. Sozialversicherung: Beiträge, Status & Verwaltung — ~5 % — 21/6121, 21/1812
- Grenzfälle: Rente komplett hier; nur Aktivrente trägt beide Labels (↔Arbeit/Steuern).

## Bildung und Erziehung (n=110/245, Fremd ~35 %)
1. Frühkindliche Bildung, Kita & Ganztag — ~12 % — 21/5904, 21/630
2. Schule, Schulklima & Gewaltprävention — ~13 % — 21/766, 21/4940
3. Lehrkräfte, Unterricht & digitale Bildung — ~8 % — 21/4109, 21/1966
4. Berufliche Aus- & Weiterbildung — ~15 % — 21/2750, 21/6082
5. Studienfinanzierung & BAföG — ~12 % — 21/2234, 21/140
6. Hochschule, Wissenschaft & Forschungsnachwuchs — ~10 % — 21/4784, 21/1480
7. Integrations- & Sprachkurse — ~10 % — 21/4664, 21/4280
8. Politische Bildung, Demokratieförderung & Erinnerungskultur — ~9 % — 21/5471, 21/4230
9. Kinder- & Jugendhilfe & Freiwilligendienste — SGB VIII — ~7 % — 21/4094, 21/2532
- Grenzfälle: Weiterbildung/Integrationskurse in 3 Feldern (Sicht entscheidet: System→Bildung, SGB-Instrument→Arbeit, Aufenthalt→Migration).

## Migration und Aufenthaltsrecht (n=110/578, Fremd ~23 %)
1. Abschiebung, Rückführung & Ausreisepflicht — ~16 % — 21/936, 21/1532
2. Asylverfahren & Schutzstatus — BAMF, GEAS, Zurückweisungen — ~14 % — 21/876, 21/3079
3. Sozialleistungen, Gesundheit & Unterbringung — AsylbLG, Bezahlkarte — ~15 % — 21/1676, 21/2194
4. Arbeits- & Bildungsmigration — FEG, Westbalkan, Anerkennung — ~13 % — 21/1191, 21/3132
5. Integrationskurse & Integrationsförderung — ~11 % — 21/152, 21/4280
6. Humanitäre Aufnahme & Aufnahmeprogramme — Afghanistan, Seenotrettung — ~9 % — 21/3031, 21/92
7. Einbürgerung & Staatsangehörigkeit — ~7 % — 21/4317, 21/1373
8. Familiennachzug & Aufenthaltstitel — ~7 % — 21/321, 21/56
9. Grenze & irreguläre Migration — Aufgriffe, Schleusung, Frontex — ~7 % — 21/424, 21/4536
- Grenzfälle: Kriminalstatistik-nach-Nationalität als Fremd (Innere Sicherheit) gewertet — Neutralitäts-sensibel, bewusst KEIN eigener Cluster.

## Verkehr (n=110/484, Fremd ~25 %)
1. Schienennetz, Bahnprojekte & Sanierung — InfraGO, Generalsanierung, Deutschlandtakt — ~30 % — 21/684, 21/5997
2. Straßenbau, Autobahnen & Brücken — ~16 % — 21/6080, 21/5679
3. Wasserstraßen, Schifffahrt & Häfen — NOK, Hafenstrategie — ~11 % — 21/4650, 21/3381
4. E-Mobilität, Antriebe & Ladeinfrastruktur — ~10 % — 21/3109, 21/5492
5. ÖPNV, Fahrgäste & Bahnhofsservice — Deutschlandticket, Pünktlichkeit — ~9 % — 21/1495, 21/1801
6. Straßenverkehrsrecht, Führerschein & Verkehrssicherheit — ~11 % — 21/4982, 21/1386
7. Güterverkehr, Logistik & Maut — ~6 % — 21/2454, 21/3082
8. Rad- & Fußverkehr — ~4 % — 21/798, 21/5857
- Grenzfälle: Cluster 1 bei 30 % beobachten; Bahnhofs-Kriminalität → Innere Sicherheit; Pendlerpauschale → Steuern; Luftverkehr zu klein (Sonstiges).

## Raumordnung, Bau- und Wohnungswesen (n=110/362, Fremd ~50–55 %!)
1. Wohnkosten, Sozialer Wohnungsbau & Wohnraumversorgung — ~18 % — 21/754, 21/3513
2. Mietrecht & Mieterschutz — Mietpreisbremse, Eigenbedarf — ~16 % — 21/222, 21/3509
3. Kommunalfinanzen & kommunale Investitionen — Altschulden, Investitionsrückstand — ~14 % — 21/909, 21/4471
4. Wohnungsbau, Baurecht & Planungsbeschleunigung — BauGB-Turbo — ~12 % — 21/2109, 21/326
5. Gebäudeenergie, Heizung & Sanierung — GEG, CO₂-Kostenteilung — ~12 % — 21/6006, 21/6019
6. Bundesliegenschaften, Konversion & öffentliches Bauen — ~10 % — 21/4046, 21/6119
7. Immobilien- & Wohnungssteuern — ~6 % — 21/4456, 21/5199
- Grenzfälle: Rollup massiv von Verkehrs-Infrastruktur geflutet („Infrastruktur"-Tag → Wohnen-Mapping, bekannter Bug-Treiber); KdU↔Soziales, Flüchtlingsunterbringung↔Migration multi-label.

## Verteidigung (n=110/362, Fremd ~18 %)
1. Rüstungsexporte & Exportkontrolle — ~13 % — 21/3991, 21/843
2. Abrüstung, Rüstungskontrolle & Kampfmittelräumung — ~6 % — 21/115, 21/5724
3. Auslandseinsätze & Mandate — ~8 % — 21/2069, 21/6054
4. Ukraine-Unterstützung & Militärhilfe — ~11 % — 21/408, 21/3430
5. Personal, Wehrdienst & Veteranen — Wehrpflicht, Soldatenrecht, Veteranen — ~21 % — 21/906, 21/898
6. Verteidigungshaushalt, Beschaffung & Rüstungsindustrie — EP 14, Sondervermögen — ~17 % — 21/3636, 21/2014
7. NATO, Bündnis & Stationierung — Brigade Litauen, GSVP — ~11 % — 21/1101, 21/2963
8. Zivilverteidigung, Übungen & hybride Bedrohungen — Übungen, Resilienz, Ostsee-Sabotage — ~8 % — 21/3611, 21/1521
- Grenzfälle: Israel-Anfragen multi-label (1/6/Außen); THW → Innere Sicherheit.

## Gesellschaftspolitik, soziale Gruppen (n=110/369, Fremd ~23 %)
1. Gleichstellung & Frauen in Führung — BGleiG, Quoten — ~14 % — 21/3900, 21/3450
2. Gewaltschutz & geschlechtsspezifische Gewalt — ~9 % — 21/3068, 21/3918
3. Antisemitismus, Rassismus & Hasskriminalität — ~15 % — 21/4063, 21/2705
4. Demokratie- & Antidiskriminierungs-Förderung — Bundesprogramme, ADS — ~12 % — 21/3156, 21/308
5. Familienleistungen & Demografie — Kindergeld, Elterngeld — ~12 % — 21/3852, 21/4062
6. Familienrecht & reproduktive Selbstbestimmung — ~7 % — 21/3473, 21/4324
7. Kinder- & Jugendschutz, Jugendhilfe & Betreuung — ~15 % — 21/3920, 21/4491
8. Inklusion & Barrierefreiheit — ~7 % — 21/2311, 21/2481
9. Engagement, Ehrenamt & Freiwilligendienste — ~6 % — 21/1526, 21/3979
- Grenzfälle: Familiennachzug → Migration; EZ-Gender → Entwicklung; Gleichstellung↔Arbeitsmarkt multi-label.

## Politisches Leben, Parteien (n=110/413, Fremd ~23 %)
1. NGO-, Zivilgesellschafts- & Demokratieförderung — „Demokratie leben!", Neutralitätsfragen — ~25 % — 21/1635, 21/3301
2. Parlament: Geschäftsordnung, Gremien & Abgeordnetenrecht — ~15 % — 21/2197, 21/150
3. Regierungstransparenz & parlamentarisches Fragerecht — ~12 % — 21/4435, 21/1735
4. Wahlen, Wahlrecht & Wahlprüfung — ~11 % — 21/3300, 21/4210
5. Parteien: Finanzierung, Organisationen & parteinahe Stiftungen — ~11 % — 21/3536, 21/160
6. Lobbyismus & Interessenkonflikte — ~8 % — 21/73, 21/3824
7. Demokratiegeschichte, Gedenken & DDR-Aufarbeitung — ~8 % — 21/4743, 21/2026
8. Immunität & Verfahren gegen Abgeordnete — ~7 % — 21/1590, 21/645
- Grenzfälle: Cluster 1 stark AfD-Serien-getrieben; Amtsträgerschutz zwischen Feldern.

## Wissenschaft, Forschung und Technologie (n=110/188, Fremd ~20 %)
1. Forschungsförderung, Innovationsstrategie & -agenturen — SPRIND/DATI, Transfer — ~19 % — 21/1100, 21/533
2. Gesundheits- & Medizinforschung — Long-COVID, Reproduktionsmedizin — ~18 % — 21/3224, 21/2685
3. Energie-, Klima- & Umweltforschung — Fusion, Geoengineering — ~13 % — 21/3750, 21/86
4. KI, Digital- & Schlüsseltechnologien — AI-Factories, Halbleiter — ~11 % — 21/3063, 21/48
5. Internationale Wissenschaftskooperation & EU-Forschungsraum — ~9 % — 21/3689, 21/2016
6. Wissenschaftsfreiheit, -integrität & Wissenschaftsrecht — ~9 % — 21/4784, 21/5318
7. Sicherheits- & Verteidigungsforschung, Forschungssicherheit — Dual-Use — ~6 % — 21/3729, 21/2448
8. Raumfahrt & Weltraum — ESA, Raumfahrtgesetz — ~6 % — 21/941, 21/2796
9. Forschungsdaten & Dateninfrastruktur — NFDI, US-Datenbestände — ~5 % — 21/2044, 21/369
- Grenzfälle: Gesundheits-Anträge mit Forschungs-Anteil (±5 Pp.); KI ↔ Medien/IT; Weltraumsicherheit ↔ Verteidigung.

## Kultur (n=95 Vollerhebung, Fremd ~15 %)
1. Erinnerungskultur, Gedenkstätten & Aufarbeitung — ~27 % — 21/2910, 21/3032
2. Medien- & Plattformpolitik — Rundfunkbeitrag, Medienförderung & Staatsferne — ~16 % — 21/953, 21/6027
3. Kulturförderung & Kulturpreise — ~15 % — 21/2539, 21/5090
4. Kulturgutschutz, Restitution & Kolonialerbe — ~13 % — 21/219, 21/1290
5. Film, Musik & Kreativwirtschaft — Filmförderung, Streaming — ~10 % — 21/2808, 21/3608
6. Kultureinrichtungen, Museen & Bibliotheken — ~9 % — 21/1412, 21/5151
7. Kriegsgräber & Gedenken an Kriegstote — Volksbund — ~7 % — 21/569, 21/560
8. Auswärtige Kulturpolitik & internationaler Austausch — AKBP — ~6 % — 21/3230, 21/5517
- Grenzfälle: 7 evtl. in 1 mergen (dann ~34 %); Medienpolitik-Anfragen oft Demokratie-motiviert.

## Sport, Freizeit und Tourismus (n=34 Vollerhebung, Fremd ~5 %)
1. Olympiabewerbungen & Sportgroßveranstaltungen — ~22 % — 21/3029, 21/4917
2. Soziale Absicherung von Athlet:innen & Trainer:innen — ~22 % — 21/3616, 21/6009
3. Spitzensportförderung & Reform — NADA, Strukturreform — ~18 % — 21/2306, 21/4292
4. Sportstätten & Bäder — Sanierungsstau — ~16 % — 21/5065, 21/4831
5. Gleichstellung, Inklusion & Teilhabe im Sport — ~12 % — 21/790, 21/607
6. Gewalt, Diskriminierung & Fankultur — ~12 % — 21/4218, 21/4213
- ⚠️ Befund: Tourismus/Freizeit kommen praktisch nicht vor — Feld ist de facto „Sport"; kein Tourismus-Cluster erfinden.

---

## Harmonisierungs-Entscheidungen für den User (VOR dem globalen Lauf)

1. **Doppelt benannte Cluster über Felder hinweg** — gleiche Konzepte, ggf. Namen
   vereinheitlichen oder einem Feld den Vorzug geben:
   - „Lobbyismus & Interessenkonflikte": Staat/Verwaltung C2 ↔ PolitLeben C6
   - Demokratie-/NGO-Förderung: PolitLeben C1 ↔ Verwaltung C4 ↔ Gesellschaft C4 ↔ Bildung C8
   - Gewaltschutz: Innere Sicherheit C7 ↔ Recht C4 ↔ Gesellschaft C2
   - Rüstungsexporte: Außen C8 ↔ Verteidigung C1
   - Cybersicherheit: Innere Sicherheit C4 ↔ Medien/IT C2 ↔ Energie C7
   - Integrationskurse: Migration C5 ↔ Bildung C7 ↔ Arbeit C7
   (Multi-Label macht Dopplung TECHNISCH unproblematisch — die Frage ist nur, ob
   ein Konzept auf zwei Blättern unter gleichem Namen erscheinen soll. Empfehlung:
   ja, gleicher Name = gleiches Konzept, bewusst gespiegelt.)
2. **Feld-Zuschnitte:** Sport-Feld faktisch ohne Tourismus (Label?); Medien/IT
   faktisch Netzpolitik ohne Medienpolitik (Kultur C2 trägt Medien) — Anzeige-
   Namen der Felder ggf. anpassen (wie „Digital & KI").
3. **Serien-getriebene Cluster beobachten:** Entwicklung C1 (~28 %, AfD-Transparenz-
   Serie), Recht C7, Verwaltung C8 — formal homogen, könnten mit Frageverhalten
   abebben.
4. **Oberthemen-Merge fürs UI** (separat vom Klassifikations-Korn): 25 Felder sind
   zu viele für den Picker — Anzeige-Gruppierung à la Dummy („Innere Sicherheit &
   Recht", „Umwelt & Energie") ist eine reine Display-Entscheidung und kann nach
   dem Lauf fallen.

## Nächste Schritte
1. User-Review dieses Entwurfs (Cluster streichen/mergen/umbenennen).
2. Globaler Klassifikations-Lauf: alle ~4.800 DS × Gesamt-Taxonomie, Batch ~$6
   (Skript-Anpassung von batch-wirtschaft-unterthemen.ts: Feld→Unterthema-Paare
   statt Ein-Feld-Liste; ersetzt Rollup + kern_im_feld).
3. Reden erben am Reden↔DS-Paar (nicht Debatte); Sitzungs-/Köpfe-Ableitungen folgen.
