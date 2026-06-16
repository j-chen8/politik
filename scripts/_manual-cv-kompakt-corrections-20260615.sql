-- Manuelle, web-recherchierte Korrekturen cv_kompakt (2026-06-15)
-- Quelle: 4 Recherche-Agenten (Wikipedia/bundestag.de/abgeordnetenwatch/HP) + Gegen-Check.
-- Provenienz: prompt_version='manual-web-2026-06-15'; extract-cv-kompakt.ts schützt diese vor --force.
-- raw_llm_response bleibt erhalten (Audit). Nur geänderte Felder werden gesetzt.

ALTER TABLE cv_kompakt ADD COLUMN manuelle_quelle TEXT;

-- ===== A) Echte Beruf-Lücken (LLM hatte sie übersehen) → beruf + Status "vorhanden" =====

-- Kurt Kleinschmidt (178160): beide Felder waren leer
UPDATE cv_kompakt SET
  hoechster_abschluss='Ausbildung zum Beton- und Stahlbetonbauer',
  praegender_beruf='Berufssoldat (Bundeswehr)', beruf_status='vorhanden',
  beruf_kategorie='Öffentlicher Dienst & Verwaltung',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Kurt_Kleinschmidt_(Politiker); bundestag.de'
WHERE politician_id=178160;

-- Christoph de Vries (66002): Beruf war leer, ist aber Verwaltungsbeamter
UPDATE cv_kompakt SET
  praegender_beruf='Verwaltungsbeamter (Finanzbehörde Hamburg)', beruf_status='vorhanden',
  beruf_kategorie='Öffentlicher Dienst & Verwaltung',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Christoph_de_Vries; cducsu.de'
WHERE politician_id=66002;

-- Birgit Bessin (31218): Beruf war leer (Finanzbuchhaltung/Sachbearbeiterin)
UPDATE cv_kompakt SET
  praegender_beruf='Kaufmännische Sachbearbeiterin (Finanzbuchhaltung)', beruf_status='vorhanden',
  beruf_kategorie='Wirtschaft & Management',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Birgit_Bessin; bundestag.de'
WHERE politician_id=31218;

-- Violetta Bock (159437): Abschluss ergänzen + Arbeitgeber präzisieren
UPDATE cv_kompakt SET
  hoechster_abschluss='Master, Global Political Economy',
  praegender_beruf='Geschäftsführerin (Mieterbund Nordhessen e.V.)', beruf_status='vorhanden',
  beruf_kategorie='Soziales & Gemeinnützig',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Violetta_Bock; bundestag.de'
WHERE politician_id=159437;

-- ===== B) Abschluss ergänzen (war leer; Beruf bleibt unverändert) =====

UPDATE cv_kompakt SET hoechster_abschluss='Ausbildung zum Forstwirt',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Marcel_Bauer_(Politiker)'
WHERE politician_id=183247; -- Marcel Bauer

UPDATE cv_kompakt SET hoechster_abschluss='Ausbildung zum Schlosser',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://www.mirze-edis.de/ueber-mich/biographie/; bundestag.de'
WHERE politician_id=175308; -- Mirze Edis

UPDATE cv_kompakt SET hoechster_abschluss='Ausbildung zum Dachdecker',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://www.bundestag.de/abgeordnete/biografien/K/korell_thomas-1045546'
WHERE politician_id=175003; -- Thomas Korell

UPDATE cv_kompakt SET hoechster_abschluss='Ausbildung (Außenhandelskaufmann / Versicherungsfachmann)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://www.bundestag.de/abgeordnete/biografien/T/teich_tobias-1047684; de.wikipedia.org'
WHERE politician_id=158594; -- Tobias Teich

UPDATE cv_kompakt SET hoechster_abschluss='Verwaltungswirtin (FH)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Ulrike_Schielke-Ziesing; bundestag.de'
WHERE politician_id=123546; -- Ulrike Schielke-Ziesing

UPDATE cv_kompakt SET hoechster_abschluss='Studium Elektrotechnik',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Gerold_Otten'
WHERE politician_id=145808; -- Gerold Otten

UPDATE cv_kompakt SET hoechster_abschluss='Abitur',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://www.bundestag.de/abgeordnete/biografien/D/droessler_christopher-1044106'
WHERE politician_id=181945; -- Christopher Drößler

UPDATE cv_kompakt SET hoechster_abschluss='Abitur (zweiter Bildungsweg); Studium ohne Abschluss',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Christin_Willnat'
WHERE politician_id=182209; -- Christin Willnat

-- ===== C) Abschluss präzisieren: Studium OHNE Abschluss (Beruf bleibt) =====

UPDATE cv_kompakt SET hoechster_abschluss='Studium Politikwissenschaft (ohne Abschluss)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Agnieszka_Brugger'
WHERE politician_id=78878; -- Agnieszka Brugger (Beruf bleibt keiner)

UPDATE cv_kompakt SET hoechster_abschluss='Studium Theaterwissenschaft (abgebrochen)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Claudia_Roth'
WHERE politician_id=79041; -- Claudia Roth (Beruf Dramaturgin bleibt)

UPDATE cv_kompakt SET hoechster_abschluss='Studium Theologie (ohne Abschluss)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Katrin_Göring-Eckardt'
WHERE politician_id=78886; -- Katrin Göring-Eckardt

UPDATE cv_kompakt SET hoechster_abschluss='Studium Soziologie (ohne Abschluss)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Jamila_Schäfer'
WHERE politician_id=175580; -- Jamila Schäfer

UPDATE cv_kompakt SET hoechster_abschluss='Studium Sozialwissenschaften (laufend, ohne Abschluss)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://www.abgeordnetenwatch.de/profile/lisa-schubert'
WHERE politician_id=183275; -- Lisa Schubert

UPDATE cv_kompakt SET hoechster_abschluss='Studium (ohne Abschluss; Germanistik/Politikwissenschaft/Philosophie/Jura)',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://www.bundestag.de/webarchiv/abgeordnete/biografien19/N/nouripour_omid-522404'
WHERE politician_id=79103; -- Omid Nouripour (Beruf Berater bleibt)

UPDATE cv_kompakt SET hoechster_abschluss='Studium Jura (ohne Abschluss)', beruf_status='keiner',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Paul_Ziemiak'
WHERE politician_id=145878; -- Paul Ziemiak (beide waren leer; Beruf = keiner)

-- ===== D) Abschluss-Upgrade (abgeschlossen, war vage) =====

UPDATE cv_kompakt SET hoechster_abschluss='Diplom-Politologe',
  prompt_version='manual-web-2026-06-15', generated_at=datetime('now'),
  manuelle_quelle='https://de.wikipedia.org/wiki/Michael_Kellner_(Politiker)'
WHERE politician_id=175629; -- Michael Kellner
