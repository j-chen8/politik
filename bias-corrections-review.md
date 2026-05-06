# Bias-Korrektur Review — 2026-05-05

## Übersicht

- v1-Audit identifizierte: **400 Reden** mit Tier-A-Wort als LLM-Editorialisierung
- v2.1-Re-Batch: **400 Resultate**
- Self-Check Konfidenz: 225 hoch / 71 mittel / 0 niedrig
- Trotz v2.1 noch Tier-A-Wort in Summary: **142** (35.5%)
- Manueller Review nötig: **249** (Konfidenz nicht "hoch" ODER Wortliste-Treffer)

## Methodik

Reden werden manuell geprüft, falls eine der zwei unabhängigen Indikatoren anschlägt:
1. **Haiku-Self-Check** (subjektiv, durch v2.1-H10): konfidenz = "mittel" oder "niedrig"
2. **Externe Wortliste** (objektiv, gleiche Liste wie v1-Audit): Tier-A-Wort in v2.1-Summary

---

## Konfidenz: mittel (71 Reden)

### 1. Dr. Alexander Gauland (AfD) — ID211101500

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Krokodilstränen (ist Gauland-Zitat)`, `bestialische (ist Gauland-Zitat zu 7. Oktober)`
  - Begründung: Die Charakterisierungen der Linken als 'Krokodilstränen-Lügen' und des Hamas-Anschlags als 'bestialisch' sind wörtliche Gauland-Zitate — gehören mit Distanz-Markierung in die Summary. Mögliches Risiko: ob die Tragödien-Philosophie im letzten Absatz als 'staatsmaennische Tiefe' richtig gelesen ist oder ob sie teilweise als Rhetorik-Figur zur Rechtfertigung wirken könnte — aber die Lesart als 'staatsmaennisch statt polemisch' wird von Gaulands eigenem Ton (feierlich, philosophisch, nicht agitatorisch) gestützt.

**v1-Summary (alt):**
> Dr. Alexander Gauland (AfD) lehnt den Linke-Antrag zur Israel-Kritik ab und raht die Linke als Fortsetzerin der DDR-Antisemitismus-Tradition ein — während „es nie bessere Zeiten für Judenfeinde gab als derzeit" und linke wie islamische Radikale sich „besser denn je verstünden". Er historisiert seinen Standpunkt durch Helmut Schmidts 1977er RAF-Entscheidung (Prinzip: mit Terroristen nicht verhandeln) und argumentiert quantitativ: Deutschland habe 1 Mrd Euro (2023-24) an Palästinenser überwiesen, die Hamas habe aber statt Schulen und Fabriken Tunnel und Raketen gebaut — Israel könne nicht mit Gaza-Terroristen verhandeln. Sein Kern: „Es steht uns als Deutschen nicht zu, Israel zu verurteilen, wenn es sich gegen einen Angreifer wehrt"; humanitäre Hilfe unterstütze die AfD, aber Verurteilungen Israels seien „wohlfeile" Heuchelei angesichts des unvermeidbaren tragischen Dilemmas.

**v2.1-Summary (neu):**
> Dr. Alexander Gauland (AfD) rahmt die Israel-Palästina-Frage als unauflösbare Tragik im Sinne Helmut Schmidts (1977 RAF-Entführung): Israel verteide sich gegen Hamas-Angriffe, die explizit zur Staatsvernichtung führen sollen, und könne nicht verhandeln oder eine Hamas-Beteiligung an einer Zweistaatenlösung akzeptieren — Deutschland habe daher keine Legitimation zu Verurteilungen Israels, sondern solle (bei grundsätzlicher Unterstützung humanitärer Hilfe) „wohlfeiler Verurteilungen" enthalten. Historische Anker: über 40 Mrd Dollar internationale Palästinenser-Hilfe seit 1994, aber Hamas-Tunnel statt -Schulen; Allierte-Bombenanschläge als Vergleich für die moralische Aporie von Kriegen.

**Original-Auszug (Mitte, ~600 chars):**
```
…is leben, ungefähr 20 Prozent der Gesamtbevölkerung? Gaza aber war judenfrei, und von Gaza aus haben diejenigen angegriffen, die ganz Israel gern judenfrei hätten.
Ich kann hier nur wiederholen, was ich an dieser Stelle bereits öfters gesagt habe: Es steht uns nach meiner Meinung als Deutschen nicht zu, Israel zu verurteilen, wenn es sich gegen einen Angreifer wehrt, der Juden ermordet und von der Auslöschung des Judenstaates träumt.
Deutschland hat den Palästinensern allein in den Jahren 2023 und 2024 fast 1 Milliarde Euro überwiesen, wie eine Anfrage der FDP an die Bundesregierung ergab. Aus…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 2. Simone Borchardt (CDU/CSU) — ID211312700

- **v1-flagged Wort:** `Skandalisierung`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `populistisches Getöse (vom Sprecher selbst genutzt, also OK)`, `stumpfen Populismus (vom Sprecher selbst genutzt, also OK)`, `parteipolitisches Zerrbild (vom Sprecher selbst genutzt, also OK)`
  - Begründung: Die Zusammenfassung reproduziert die polemische Argumentation der Sprecherin akkurat (Konfrontation mit Belegen); es ist korrekt, dass die Polemik-Wörter VOM Sprecher stammen — aber durch die dichte Verdichtung könnte der Eindruck entstehen, die Summary selbst sei editoriale Parteinahme statt Wiedergabe. Deshalb mittel statt hoch; aber die Polemik bleibt berechtigt erfasst.

**v1-Summary (alt):**
> Simone Borchardt (CDU/CSU) verteidigt die Corona-Beschaffungspolitik gegen Linke-Vorwürfe als "populistisches Manöver": Sie kritisiert das zugrundegelegte Gutachten als "ohne klare Methodik, ohne nachvollziehbare Quellen, ohne rechtliche Substanz" und argumentiert mit konkreten Zahlen (Maskenpreis 6 Euro festgelegt, tatsächlich 4,50 Euro gezahlt = "Marktrealität"), ihrer eigenen Erfahrung als Geschäftsführerin einer Pflegeeinrichtung, und einem Zitat aus einem Grünen-Papier von 2020, das zeigt, dass auch die Grünen damals die Pandemie-Dauer nicht vorhersehen konnten. Sie stellt eine Enquete-Kommission zur "wissenschaftlich und fachlich" Aufarbeitung der Pandemie als "absolut richtigen Weg" dar, lehnt aber "Hexenjagd" und "Skandalisierung im Nachhinein" ab und warnt: Ein Staat, der aus Angst vor Rückblick-Kritik nicht handelt, ist "eine leere Hülle" — das "gefährlichste Signal".

**v2.1-Summary (neu):**
> Simone Borchardt (CDU/CSU) verteidigt die Coronapandemie-Maskenbeschaffung als fachlich und rechtlich korrekt, stützt sich dabei auf ihre Erfahrung als Pflegeeinrichtungs-Geschäftsführerin und belegt: das Zollbeschaffungsamt setzte 6 Euro fest, gezahlt wurden 4,50 Euro (Marktrealität), nicht Verschwendung. Sie greift das Linken-Gutachten konfrontativ an ('ohne klare Methodik, ohne nachvollziehbare Quellen, ohne rechtliche Substanz'), wirft der Linken vor, das sei 'populistisches Manöver' und 'Fingerzeigen auf Politiker, die mutige Entscheidungen treffen', und kontrastiert damit die Grünen mit deren eigenem Papier (31.03.2020), das selbst Ungewissheit über Pandemiedauer und Maskenmenge zeigt. Lösung: Enquete-Kommission zur wissenschaftlichen Aufarbeitung, nicht 'Hexenjagd' — mit expliziter Warnung, dass staatliche Handlungslähmung ('ein leere Hülle') das gefährlichste Signal ist.

**Original-Auszug (Mitte, ~600 chars):**
```
…eine Verschwendung; das war Marktrealität. Und dass mangelhafte Ware nicht angenommen wird, ist kein Skandal, sondern Ausdruck gesunden Menschenverstands.
Ja, es gab Fehler, und wer das Gegenteil behauptet, verkennt die Dimension dieser Krise. Alle wussten, dass diese Pandemie eine ganz neue Dimension hatte, und alle waren involviert,
auch Sie, liebe Kollegen der Linken, aber auch Sie, liebe Kollegen der Grünen; am kommenden Freitag werden wir das gleiche Thema noch einmal im Rahmen einer Aktuellen Stunde behandeln. Ich möchte Sie von den Grünen zitieren. Es gab ein Autorenpapier von Ihnen vom…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 3. Dr. Ralf Stegner (SPD) — ID211315100

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `unerträgliche Doppelmoral`
  - Begründung: Das Wort 'unerträglich' wird vom Sprecher selbst genutzt ('Es ist doch eine unerträgliche Doppelmoral'), daher ist es kein Hinzufügen, sondern treue Wiedergabe. Die Konfidenz ist 'mittel' nur, weil die Zusammenfassung insgesamt sehr nahe am Original bleibt und mehrere wertend-kritische Paraphrasen ('Gegensatz zwischen...') enthält — diese sind aber vom Sprecher selbst so framing, nicht von mir erfunden.

**v1-Summary (alt):**
> Dr. Ralf Stegner (SPD) befürwortet den Grünen-Antrag zur Beschlagnahme der 210 Mrd Euro eingefrorener russischer Staatsvermögen für den Ukraine-Wiederaufbau (Weltbank schätzt Schäden auf über 500 Mrd Euro) und verankert die Position in persönlichen Augenzeugen-Besuchen (bombardierte Kinderklinik Kyjiw, Aug. 2024, verwundete Soldaten) sowie der Forderung nach moralischer und rechtlicher Haftung des Aggressors Russland. Er kritisiert die „hasenfüßige Politik" der Finanzvorsicht, warnt vor Doppelmoral (Rüstungsausgaben vs. humanitärer Mangel) und bittet Bundeskanzler und AA-Minister, das Signal nach Brüssel/Washington zu tragen — „Russland muss für seine Verbrechen haften. Das ist moralisch geboten."

**v2.1-Summary (neu):**
> Dr. Ralf Stegner (SPD) unterstützt den Grünen-Antrag zur Beschlagnahme eingefrorener russischer Staatsvermögen für den Ukraine-Wiederaufbau: Er berichtet von seinem Besuch 2024 (bombardierte Kliniken in Kyjiw und Lwiw, verwundete Soldaten) und argumentiert, dass Russland als Aggressor mit Kriegsverbrechen finanziell für Schäden haften muss. Mit Verweis auf die Weltbank-Schätzung von über 500 Mrd Euro Wiederaufbaubedarf fordert er, dass Kanzler und Außenminister diesen Policy-Kurs nach Brüssel und Washington tragen — als «moralisch geboten» und «rechtlich vertretbar», nicht nur als defensiv-pragmatisches Einfrieren. Seine Kritik an der «hasenfüßigen Politik» und den Bedenkenträgern rahmt er als Gegensatz zwischen «Sicherheit durch kluge Diplomatie + Rüstungskontrolle» versus blocker Konservatismus.

**Original-Auszug (Mitte, ~600 chars):**
```
…cht für die Bankbilanzen.“
Liebe Kolleginnen und Kollegen, Sicherheit in Europa erreichen wir langfristig durch die kluge Verbindung von Verteidigungs- und Bündnisfähigkeit, von Rüstungskontrolle und diplomatischen Anstrengungen. Wir müssen und werden die Ukraine weiter unterstützen. Gleichzeitig aber müssen wir alle Wege nutzen, um das Sterben zu beenden. Dazu gehört für mich auch, dass der Aggressor unmittelbar finanziell für das haftet, was er anrichtet. Vielleicht fehlen dann ein paar zahlungskräftige Gäste in München, Baden-Baden oder Saint-Tropez. Aber das trifft doch die reichen Unterst…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 4. Schahina Gambir (BÜNDNIS 90/DIE GRÜNEN) — ID211501100

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `glaubwürdigkeit`
  - Begründung: Das Wort 'glaubwürdigkeit' ist vom Sprecher gewählt (exaktes Zitat: 'gegen jede glaubwürdige Integrationspolitik'), aber der Zusammenhang in der Summary könnte implizit eine Bewertung 'SPD/CDU haben keine Glaubwürdigkeit' transportieren — das ist Sprecherposition, aber etwas schwächer als zitiert.

**v1-Summary (alt):**
> Schahina Gambir (Grüne) lehnt die Aussetzung des Familiennachzugs zu subsidiär Schutzberechtigten ab und belegt ihre Position durch konkrete Fallzahlen (12.000/Jahr, 80% Frauen/Kinder), Sachverständigenposition (Härtefall+Stichtag gefordert von Opposition und SPD) und die persönliche Anekdote des Tribünen-Gastes Herr Abdo, dessen Familie durch das Eilverfahren-Gesetz auf 6-7 Jahre Trennung verdammt wird — statt der aktuellen 4-5 Jahre. Sie framет die Union-SPD-Position als „Kapitulation vor den Rechten" und „Armutszeugnis", da sie die Koalitionsvertrag-Zusage der Familien-Fokussierung negiert und Integration durch Familientrennung unmöglich macht.

**v2.1-Summary (neu):**
> Schahina Gambir (Grüne) lehnt die geplante Aussetzung des Familiennachzugs zu subsidiär Schutzberechtigten ab und attackiert die CDU/CSU-SPD-Koalition als „Kapitulation vor den Rechten": Das Gesetz sei im Eilverfahren ohne eine einzige Anpassung trotz einstimmiger Sachverständigen-Forderungen nach Härtefall- und Stichtagsregelung verabschiedet worden. Sie adressiert direkt den Betroffenen Herr Abdo auf der Tribüne, dessen älteste Tochter bei Inkrafttreten 18 wird und damit aus der Regelung fällt — die Gesetzesänderung verlängere die Trennung von 4-5 auf 6-7 Jahre und gefährde damit die Integration. Ihr Frame: Ein stabiles Familienleben ist Basis für erfolgreiche Integration; die Koalition verstoße damit gegen ihren eigenen Koalitionsvertrag und gegen „jede glaubwürdigkeit und jede Menschlichkeit".

**Original-Auszug (Mitte, ~600 chars):**
```
…eser Gesetzesänderung betroffen. Er ist vor Jahren aus Syrien vor Krieg und Gewalt geflohen. Er ist subsidiär schutzberechtigt. Schon lange befindet er sich im Verfahren, um seine Frau und seine minderjährigen Kinder nach Deutschland zu holen. Seine älteste Tochter ist schwer krank, und sie wird während der geplanten Aussetzung 18 Jahre alt sein.
Das bedeutet: Die Bundesregierung trennt Familie Abdo auf unbestimmte Zeit.
In ihrem Koalitionsvertrag sagen Union und SPD, dass sie Familien in den Mittelpunkt stellen wollen. Das gilt anscheinend nicht für die Familie von Herrn Abdo und schon gar ni…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 5. Christopher Drößler (AfD) — ID211802000

- **v1-flagged Wort:** `polemisiert`
- **v2.1 enthält noch:** `denunziert`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `denunziert`
  - Begründung: Das Verb 'denunziert' stammt aus der Tier-A-Liste und wurde in der Summary eingefügt — der Sprecher nutzt es nicht selbst, charakterisiert die CDU aber deutlich kritisch ('heiße Luft', 'dem Volk völlig egal'). Besser: 'charakterisiert die CDU als halbherzig' oder 'kritisiert als unaufrichtig'.

**v1-Summary (alt):**
> Christopher Drößler (AfD) eröffnet die Haushaltsdebatte des Innenministeriums mit massiver Kritik an der Migrationspolitik der Union und positioniert Masseneinwanderung und Migrantenkriminalität als größte Sicherheitsgefahren. Er fordert die Befähigung der Bundespolizei zur 'Abschiebepolizei' und 'Remigrationspolizei' mit entsprechender rechtlicher Ausstattung, rigoros gegen nichteuropäische Migration vorzugehen, und polemisiert gegen die Union — „die CDU spielt den starken Mann; doch am Ende bleibt nur heiße Luft" — während er mit Wahlaufruf endet: „Dafür sind wir als Alternative für Deutschland da."

**v2.1-Summary (neu):**
> Christopher Drößler (AfD) rahmt die Migrationspolitik als existenzielle Sicherheitsfrage und fordert die Beendigung der Masseneinwanderung, Ausweisung aller ausreisepflichtigen Ausländer und \"Remigration\" als zentrale Ziele; konkret verlangt er die Befähigung der Bundespolizei zur \"Abschiebepolizei\" mit rechtlicher und materieller Ausstattung zur Grenzsicherung. Er wirft der CDU/Union-geführten Regierung vor, beim Grenzschutz (Polish-deutsche Grenze: nur Stichproben statt rigoroser Abweisung) halbherzig zu agieren und denunziert das mit dem Satz \"heiße Luft\"; seinen Schlusssatz prägt ein Wahlaufruf: \"dafür sind wir als Alternative für Deutschland da\".

**Original-Auszug (Mitte, ~600 chars):**
```
…fgebracht, gegen die Symptome des Problems zu kämpfen, anstatt die Ursachen zu beheben. Natürlich kann die Bundespolizei bei der ursächlichen Problemlösung nur behilflich sein, wenn die Politik es erlaubt.
Wie das unter der Union aussieht, kann man ja momentan an der polnisch-deutschen Grenze sehen. Hauptsächlich finden Stichproben statt, und Migranten werden trotzdem über die polnische Grenze gebracht. Das alles ist nichts Halbes und nichts Ganzes, weil die politische Führung dieser Regierung nichts Halbes und nichts Ganzes ist. Die CDU spielt den starken Mann; doch am Ende bleibt nur heiße L…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 6. Christian Zaum (AfD) — ID211813400

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `umerziehung`
  - Begründung: 'Umerziehung' ist ein wertendes Wort mit ideologischem Lade­wert (DDR/totalitär-Konnotation); der Sprecher nutzt es wörtlich ('linke Umerziehung'), daher ist es korrekt in der Summary, aber die Konfidenz ist mittel, weil die Summary damit selbst in das AfD-Frame einsteigt — neutralere Formulierung wäre 'Kritik an ideologiegeprägter Förderung', aber das würde die Tonalität abflachen.

**v1-Summary (alt):**
> Christian Zaum (AfD) kritisiert eine angebliche deutsche Bildungskrise mit polemischen Beispielen (100.000 Schüler ohne Deutschkenntnisse, Prozentrechnung- und Zeichensetzungs-Defizite) und attackiert die Koalition für die Umleitung von 280 Millionen Euro (200 Mio Vielfalt/Toleranzförderung + 80 Mio gesellschaftliche Studien zu Rechtsextremismus/Migration) statt in klassische Schulinfrastruktur — dabei rahmt er das als „jede Menge Kohle für die Blase gegen rechts". Mit persönlicher Berufserfahrung (27 Jahre Unterricht) weist er auf die Lehrerkrise hin (40.000 fehlende Lehrer, 20% Unterrichtsausfälle, schlechte Disziplin), verdammt die „linke Umerziehung" des CDU-Bildungsministeriums und endet mit direktem Wahlaufruf „schlauer wird Deutschland nur mit der AfD".

**v2.1-Summary (neu):**
> Christian Zaum (AfD) kritisiert die deutsche Bildungspolitik als Krise: Abiturienten könnten weder Prozentrechnung noch Zeichensetzung, 100.000 NRW-Schüler hätten mangelhaftes Deutsch — während die Regierung 280 Millionen Euro (200 Mio. Vielfalt-/Toleranzförderung + 80 Mio. Rechtsextremismus-/Migrationsforschung) in die 'Blase gegen rechts' stecke statt in Schultoiletten und Sporthallen. Er rahmt das Lehrer-Defizit (40.000 fehlende Lehrer, jede fünfte Stunde fällt aus) als Folge fehlender Disziplin durch unkontrollierte Migration (30 Kinder aus 10 Kulturen, null Disziplin) und als 'linke Umerziehung' unter CDU-Bildungsministerium; sein Schlusssatz ist ein direkter Wahlaufruf: 'schlauer wird Deutschland nur mit der AfD'.

**Original-Auszug (Mitte, ~600 chars):**
```
…tiere – geistes- und sozialwissenschaftliche Studien
– ich zitiere doch nur; bleiben Sie ruhig! –
„zu gesellschaftlichen Herausforderungen […], Radikalisierung, Rechtsextremismus […], Migration und Fluchtursachen“ – auch kein Problem.
Ich übersetze: jede Menge Kohle für die Blase gegen rechts, gegen die AfD.
So geht es nicht.
Wissen kann man sich zwar nicht kaufen; aber Geld könnte natürlich schon helfen, es zu erwerben. Und für die 280 Millionen Euro könnte man auch 280 Sporthallen bauen, 500 Physiksäle errichten oder 28 000 Schultoiletten sanieren. Dann würde es nicht mehr so stinken.
Aber d…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 7. Tamara Mazzi (Die Linke) — ID211814200

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Inkompetenz (Synonym für Sprechakt der Rednerin 'politische Inkompetenz' — ist zulässig)`, `Trick (Sprechakt der Rednerin 'Haushaltstrick' — ist zulässig)`
  - Begründung: Die Begriffe 'Inkompetenz' und 'Trick' werden von der Rednerin selbst verwendet (direkte Zitate). Potenzielle wertende Wörter wie 'skandalisiert', 'diffamiert' oder 'Heuchelei' werden in meiner Summary NICHT verwendet — ich verwende nur deskriptive Verben wie 'attackiert', 'kritisiert', 'fordert'. Die Tonalität ‚sozial_anklagend' ist berechtigt, da die Rednerin selbst die Anklagsform verwendet ('Liebe Regierung, ihr spart uns kaputt'). Konfidenz mittel nur wegen potentieller marginaler Grauzone bei 'Trick' (könnte auch neutral ‚Mechanism' sein), aber im Kontext der Rednerin ist ‚Trick' ihr Sprechakt.

**v1-Summary (alt):**
> Tamara Mazzi (Die Linke) verdammt den Gesundheits-Haushalt 2025 als „Haushaltstrick": Die Darlehen an Kranken- und Pflegeversicherung (2,3 + 0,5 Mrd Euro) seien keine Lösungen, sondern Schuldenverschiebung in die nächste Wahlperiode; stattdessen brauche es Beitragsbemessungsgrenzanpassung und echte Investitionen in Prävention. Sie führt die Absurdität vor: während Konzerne wie Helios und Asklepios Milliardengewinne machen, fehlen Therapieplätze für Kinder, und das Maskendebakel (Milliarden verschwendet, 7 Euro pro Stück statt 1 Euro Marktpreis, über die Hälfte vernichtet) zeuge von „politischer Inkompetenz von ganz oben" — Spahn, Linnemann und Merz hätten mit Schwärzungen Verantwortung statt Aufklärung gewählt. Forderung: Schluss mit Profitmacherei auf Kosten der Patienten, echte Gesundheitsversorgung für alle.

**v2.1-Summary (neu):**
> Tamara Mazzi (Die Linke) attackiert den Gesundheitshaushalt (Einzelplan 15) als „Haushaltstrick": Darlehen von 2,3 Mrd Euro an GKV und 500 Mio Euro an Pflegeversicherung seien keine nachhaltigen Lösungen, sondern kurzfristige Beitragssenkungs-Versprechen, die in der nächsten Wahlperiode wieder erhöht würden. Sie fordert stattdessen die Anhebung der Beitragsbemessungsgrenze und kritisiert parallel Kürzungen bei Prävention/Digitalisierung, das Maskendebakel (2,3 Mrd Euro Schaden: bis zu 7 Euro pro Maske bei Marktpreis unter 1 Euro, weniger als 1/3 verteilt, über 1/2 vernichtet), die Dominanz privatwirtschaftlicher Klinikkonzerne auf Kosten der Versicherten und mangelnde Therapieplätze im Alltag — mit persönlicher Anekdote aus ihrer Lehrertätigkeit. Sie attackiert Spahn, Linnemann und Merz („politische Inkompetenz von ganz oben"), und fordert eine Gesundheitsversorgung „für alle" statt Profitorientierung.

**Original-Auszug (Mitte, ~600 chars):**
```
…schafft hätte.
Das ist einfach nicht richtig.
Weniger als ein Drittel der Masken wurde überhaupt verteilt, noch weniger davon tatsächlich benutzt. Mehr als die Hälfte der Masken wurde vernichtet, und ein großer Teil war nicht einmal brauchbar. Das war kein kleiner Fehler in der Krise. Das war politische Inkompetenz, und zwar von ganz oben im Ministerium.
Und der rote Faden zieht sich weiter: Das CDU-geführte Ministerium deckt Herrn Spahn durch Schwärzungen, die mal so, mal so begründet werden. Herrn Linnemann und Herrn Merz gefällt die Kritik an Herrn Spahn nicht; sie diskreditieren deshalb de…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 8. Janine Wissler (Die Linke) — ID212016200

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `grausam`
  - Begründung: Das Adjektiv 'grausam' erscheint in der Summary, wird aber als wörtliches Abschluss-Zitat des Sprechers verwendet ('keine Grausamkeiten gegen Arme') — nicht als eigene Bewertung. Dennoch könnte die wiederholte Präsenz in der Synthese als Editorialisiering interpretiert werden. Alternativversion würde sagen: '...der Schluss kritisiert die Maßnahmen als 'Grausamkeiten gegen Arme'...' — aber das ist länger und wirkt auch wertend. Hier bleibe ich bei 'mittel' mit Transparenz.

**v1-Summary (alt):**
> Janine Wissler (Die Linke) verreißt die Reformpläne der Merz-Koalition als klassenkämpferischen Angriff auf Erwerbslose und Beschäftigte: während eine winzige Gruppe (0,5%) der Bürgergeldbeziehenden den Vorwand für Sanktionsverschärfungen liefert, arbeiten über 800.000 Menschen trotz Erwerbstätigkeit im Bürgergeld-System, die Regierung kürze die Arbeitsmarktintegration, und eine Nullrunde bedeute reale Kaufkraftverluste. Sie kontrastiert das mit der Elite: „ein paar Hundert Familien" besäßen mehr als „Millionen Beschäftigte zusammen", während Unternehmen durch Körperschaftsteuer-Senkungen „Milliarden" erhalten. Ihre zentrale Anklage: die Union spiele Beschäftigte gegen Erwerbslose aus, lehne aber Mindestlohn-Erhöhungen ab — ein Widerspruch, der die „Solidarität mit hart arbeitenden Menschen" entlarve als Heuchelei.

**v2.1-Summary (neu):**
> Janine Wissler (Linke) attackiert die geplanten Sozialkürzungen der Koalition als 'beispiellose Stimmungsmache' und 'Bullshit' — eine Nullrunde beim Bürgergeld bedeute für Menschen in existenziellem Mangel inflationsbedingte Verschärfung, während 800.000 arbeiten und dennoch Bürgergeld beziehen. Sie kontrastiert dies mit der Realität: der Paketbote und die Reinigungskraft arbeiten, machen 1,3 Mrd unbezahlte Überstunden pro Jahr; dagegen erben 'ein paar Hundert Familien' mehr als Millionen Beschäftigte zusammen. Ihre Forderungen: Stopp der Bürgergeld-Kürzungen und der geplanten Renteneintrittsalter-Erhöhung, Erhöhung des Mindestlohns, Beibehaltung des Achtstundentags (nicht 'Flexibilisierung' sondern 'Ausbeutung'), gerechte Besteuerung von Vermögen statt Körperschaftsteuer-Senkungen — der Schluss prägt dies als Kampf gegen 'Grausamkeiten gegen Arme' und für einen 'starken Sozialstaat'.

**Original-Auszug (Mitte, ~600 chars):**
```
…lle, nicht nur auf die Erwerbslosen, auf den Sozialstaat, auf die Beschäftigten. Denn: Wenn Erwerbslose gezwungen werden, jede Arbeit anzunehmen, weil sie sonst sanktioniert werden, warum soll dann ein Arbeitgeber noch Tariflohn zahlen? Es geht um die Rechte der Beschäftigten, die hier angegriffen werden. Es geht darum, dass der Achtstundentag abgeschafft werden soll. Das ist keine Flexibilisierung, das ist Ausbeutung, meine Damen und Herren.
Der Kanzler sagt, wir müssen mehr arbeiten und wir hätten über unsere Verhältnisse gelebt. Wer ist denn dieses ominöse „Wir“? Wer hat denn in diesem Land…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 9. Dr. Rainer Kraft (AfD) — ID212107800

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Barbarei`
  - Begründung: Das Wort 'Barbarei' wird vom Sprecher selbst in der Phrase 'energiepolitischer Barbarei' verwendet — es gehört also rechtmäßig in die Summary. Ich habe es jedoch in `zusammenfassung_2_saetze` als direktes Zitat gekennzeichnet. Die Einstufung auf 'mittel' erfolgt wegen der Frage, ob der Einsatz intensiver Wertsprache ('Irrsinn', 'Wahnsinn') in der Summary selbst (nicht nur als Zitat) angemessen ist — die Antwort ist ja, weil sie vom Sprecher stammen, aber es erhöht die Komplexität der Neutralitäts-Bewertung marginal. Alle anderen verwendeten bewertenden Ausdrücke ('verdammt', 'führe zu') sind entweder Sprecher-Zitate oder prägnante, neutrale Verben.

**v1-Summary (alt):**
> Dr. Rainer Kraft (AfD) verdammt die deutsche Energiewende als „energiepolitischen Irrsinn historischen Ausmaßes" und fordert ein sofortiges Moratorium des Kernkraftwerk-Rückbaus — statt funktionierender, sicherer Atomkraft setze die Regierung auf ein „gigantisches Experiment" aus Wind- und Solaranlagen, das „Natur zerstörend und zutiefst bürgerfeindlich" sei und dabei unzuverlässig (H1 2025: 20% weniger Windstrom) und teuer ausfalle. Als Beweis nutzt er die Anekdote der verschwindenden Dampfwolken des Kernkraftwerks Gundremmingen seit 2016, rahmt den Windkraft-Ausbau als „Ludditen"-Mentalität (während die Welt Kernkraft baut), und fordert stattdessen Wiederinbetriebnahme mit Verweis auf weltweite Kernkraft-Expansion und CO₂-Einsparungen.

**v2.1-Summary (neu):**
> Dr. Rainer Kraft (AfD) verdammt die deutsche Energiewende als „energiepolitischen Irrsinn historischen Ausmaßes": der Ausstieg aus der Kernkraft (Gundremmingen-Rückblick seit 2016) führe zu Stromverteuerung, Versorgungsunsicherheit und dem Zwang zu 70+ Gaskraftwerken, während Windkraft und Solar im H1 2025 bereits 20% weniger Strom liefern als im Vorjahr. Er fordert ein sofortiges Moratorium des Rückbaus und die Wiederinbetriebnahme stillgelegter Kernkraftwerke als einzige rationale Alternative, die ohne Naturzerstörung auskomme (konkret: Schutz des Naturparks Augsburg vor Windradzubau). Seine zentrale Pointe: „Die Sprengung unserer Kernkraftwerke ist […] ein Akt energiepolitischer Barbarei" — während Regierungen weltweit Kernkraft als „preiswert, planbar und zuverlässig" neu bewerten, verstelle sich Deutschland als „Luddite des 19. Jahrhunderts".

**Original-Auszug (Mitte, ~600 chars):**
```
…ialen Sicherheit, eine Destabilisierung der Gesellschaft. Und mit jedem Windrad wird es schlimmer.
Statt 20, 25 oder 30 Gaskraftwerke brauchen wir nun über 70, sagt der grüne Chef der Bundesnetzagentur Müller. Robert Habeck hat sich davongemacht. Sein Stromproblem hat er uns hinterlassen.
Die Antwort der neuen Regierung darauf ist jetzt, die Rezepte der alten zu wiederholen. Mehr Wind und Photovoltaik sollen das richten, bei dem Wind und Photovoltaik bereits versagt haben. Die Kernenergie hingegen liefert genau das, was eine Industrienation braucht:
preiswerten, planbaren und, wenn Sie so woll…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 10. Dr. Jonas Geissler (CDU/CSU) — ID212113700

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `unehrlich`, `schändlich`
  - Begründung: Die Wörter 'unehrlich' und 'schändlich' sind vom Sprecher selbst genutzt — daher korrekt in der Summary. Unsicherheit nur bezüglich 'wirft vor' vs. direkter Aussage in der Summary; Sprecher macht es direkt, nicht als indirekten Vorwurf, daher hoch-akzeptabel.

**v1-Summary (alt):**
> Dr. Jonas Geissler (CDU/CSU) verteidigt die Regierungs-Verkehrspolitik (Deutschlandticket, Deutschlandtakt) gegen Grünen-Anträge zur Rückkehr zu 49-Euro-Ticketpreisen und wirft den Grünen Heuchelei vor: Sie hätten das Ticket während ihrer Regierungszeit selbst teurer gemacht (Regierungsende vor 128 Tagen), konnten aber in 3,5 Jahren Regierungsbeteiligung ihre jetzigen Forderungen nicht umsetzen. Geissler kontrastiert die CDU/CSU-Mittenpolitik (sachlich, verantwortungsvoll, bewährt) gegen Kritik von „ganz rechts und ganz links" und betont: „Wir machen verantwortungsvolle Politik für die Menschen beim Deutschlandticket und auch beim Deutschlandtakt, und das wird die nächsten vier Jahre auch so bleiben" — kein Raum für „Wünsch dir was"-Politik.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dr. Jonas Geissler (CDU/CSU) verteidigt die Koalitions-Politik gegen Vorwürfe von Linke und AfD, dass die Mitte des Hauses nicht für die Menschen Politik macht — das sei „unser aller gemeinsamer Anspruch". Gegen die Grünen wirft er vor, ihre aktuellen Anträge zum Deutschlandticket (49-Euro-Forderung) seien unehrlich: die Grünen hätten selbst während ihrer Regierungszeit den Preis erhöht und hätten in dreieinhalb Jahren Regierung alle ihre heutigen Forderungen (Deutschlandtakt, Deutschlandticket, Fahrradförderung) nicht umgesetzt. Er bekräftigt: „Der Deutschlandtakt kommt, und das Deutschlandticket bleibt" — es gebe keine Mehrheit für „Wolkenkuckucksheim" oder „Wünsch dir was", sondern nur für verantwortungsvolle Politik für die Menschen.

**Original-Auszug (Mitte, ~600 chars):**
```
…d Ihrer Regierungszeit teurer geworden.
Während Ihrer!
Das Deutschlandticket ist auch unter Ihnen eingeführt worden;
das steht überhaupt nicht in Abrede. Aber Sie waren diejenigen, die es teurer gemacht haben.
Jetzt kann man vielleicht sagen: Wir haben irgendwie unsere Meinung geändert, weil wir jetzt seit 128 Tagen nicht mehr regieren, und wir haben in den 128 Tagen irgendwelche neuen Ideen entwickelt. – Aber wenn man sich heute hierhinstellt und sagt: „Wir wollen wieder 49 Euro“, obwohl man selber dafür verantwortlich ist, dass der Preis nicht mehr der gleiche ist, dann ist das unehrlich und…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 11. Ina Latendorf (Die Linke) — ID212203600

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `herrschaftliche Arroganz`
  - Begründung: Der Ausdruck 'herrschaftliche Arroganz' ist eine direkte Charakterisierung der Union durch die Sprecherin und wird von ihr selbst als Bewertung vorgetragen (nicht als objektive Beschreibung), daher zulässig — aber die Konfidenz bleibt 'mittel', weil die Summary-Syntax ('attestiert X') das als zusammengefasste Fremdposition kennzeichnet, während im Original die Sprecherin die Bewertung direkt als ihre Position ausspricht.

**v1-Summary (alt):**
> Ina Latendorf (Die Linke) lehnt den Geschäftsordnungs-Antrag von CDU/CSU und SPD als unzureichend ab und attackiert die Union wegen „Heuchelei" — als Opposition hätte sie Löwe gespielt, Oppositionsrechte zu stärken, als Regierungsfraktion sei sie Papiertiger und streiche diese zusammen. Sie fordert Stärkung der Opposition durch Kleine-Anfragen-Recht, Petitionsrecht, öffentliche Ausschüsse, stärkere Redezeit in Ausschüssen, und kritisiert besonders die zeitliche Verschiebung der Regierungsbefragung; außerdem verlangt sie Sanktionsmechanismen gegen „verächtliche und würdelose" AfD-Redebeiträge in der neuen Geschäftsordnung (§ 33 Absatz 3).

**v2.1-Summary (neu):**
> Ina Latendorf (Linke) lehnt den Antrag der CDU/CSU und SPD zur Geschäftsordnungs-Anpassung ab und attestiert der Union „Heuchelei": als Opposition habe die Union „als Löwe" Parlamentsrechte fordern wollen, als Regierung würden Oppositionsrechte wieder zusammengestrichen (insbesondere Kleine Anfragen bei Nicht-Fristerfüllung, Petitionsrechte, Redezeiten in Ausschüssen). Sie fordert stattdessen mehr Transparenz (öffentliche Ausschusssitzungen, Redezeiten-Stärkung für Opposition, Verzicht auf die zeitliche Verschiebung der Regierungsbefragung in den Nachmittag) und betont, dass Demokratie Widerspruch aushalten müsse — dabei kritisiert sie explizit die „verächtlichen und würdelosen Vorträge der AfD-Fraktion" und fordert Sanktionsmittel gegen „menschenverachtende und undemokratische" Inhalte und Töne.

**Original-Auszug (Mitte, ~600 chars):**
```
…zialdemokratischer Schlendrian. Nichts mehr ist zu hören und zu lesen von den Rechten Abgeordneter nationalen Minderheiten. Wir fordern – und nicht erst jetzt – größtmögliche Transparenz in der Geschäftsordnung selbst und natürlich hier in der parlamentarischen Praxis. Die Rechte der demokratischen Opposition sind zu stärken, zum Beispiel bei der Redezeit in den Ausschüssen. Das Gegenteil schlagen Sie vor. Wir brauchen im Bundestag mehr statt weniger Transparenz. Die Kuppel dieses Hohen Hauses ist nicht ohne Grund aus Glas. Und wir als Linke sind dafür, dass Ausschüsse grundsätzlich öffentlich…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 12. Helge Lindh (SPD) — ID212205900

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `bigotterie`, `scheinheiligkeit`
  - Begründung: Die Wörter 'Bigotterie' und 'Scheinheiligkeit' werden vom Sprecher selbst direkt verwendet ('Ihre Bigotterie', 'Das nenne ich Scheinheiligkeit'). Allerdings liegt eine Grauzone vor: sind das Tier-A-Kategorien oder legitime politische Charakterisierungen, die der Sprecher selbst vornimmt? Ich habe sie als vom-Sprecher-direkt-getroffene Bewertungen einstuft und behalte sie daher in der Summary — aber mit reduzierter Konfidenz, weil die Grenze zwischen (legitimer) feindlicher Anklagelexik und (illegitimer) LLM-Editorialisierung hier dünner ist als bei z.B. 'skandalisiert' oder 'fabuliert'.

**v1-Summary (alt):**
> Helge Lindh (SPD) lehnt den AfD-Gesetzentwurf zur Abschaffung des § 188 StGB scharf ab und bezeichnete ihn als 'großen Zaubertrick', 'perfides Täuschungs- und Vexierspiel' und 'perfektionierte Täter-Opfer-Umkehr'. Er dokumentiert durch Hassposts (Tötungsaufrufe, Homophobie, Sexismus, Rassismus), die er und migrantisch identifizierte Kollegen tagtäglich erhielten, warum dieser Schutzparagraf unverzichtbar ist, und wirft der AfD Doppelmoral vor: Sie nutze selbst den § 188 StGB zur Klage, während sie dessen Abschaffung fordere; ihre Charakterisierung von Politikern als 'mimosenhaft' sei Projektion der eigenen 'Feigheit'. Als Schlusspunkt attackiert Lindh die AfD als die wahren Verfechter eines Obrigkeitsstaates, der Gewaltenteilung gefährden würde.

**v2.1-Summary (neu):**
> Helge Lindh (SPD) wehrt sich gegen den AfD-Antragstext zur Abschaffung von § 188 StGB mit einer konfrontativen Beweisführung: er liest konkrete Hasskommentare vor, die gegen ihn und andere Politiker mit Migrationsgeschichte gerichtet sind (Androhungen von Gewalt, rassistische und sexistische Beschimpfungen), und bezeichnet die AfD-Position als „perfide Täter-Opfer-Umkehr" — § 188 sei notwendiger Schutz, nicht Unterdrückung von Meinungsfreiheit. Kern seiner Kritik: die AfD selbst nutze § 188 StGB, was er als Doppelmoral und Scheinheiligkeit charakterisiert; zugleich warnt er vor autoritären Tendenzen der AfD, die bei Machtantritt „Gerichte schleifen" würde.

**Original-Auszug (Mitte, ~600 chars):**
```
…n streichen, es würden Gehirnbrocken weitläufig im Raum verteilt werden und die Tatortreiniger hätten eine Menge Arbeit“ usw. usf. Und das ist nicht mal das Schlimmste.
Viele Kolleginnen und Kollegen, insbesondere solche, die als migrantisch identifiziert werden, erleben jeden Tag noch viel Schlimmeres, digital und leider auch, was Sexismus und Rassismus betrifft, in Zwischenrufen und Kommentaren hier im Deutschen Bundestag. Darüber reden wir. Das ist aus Ihrer Sicht also Meinungsfreiheit. Ich sehe, wir haben Unterschiede.
Und jetzt kommen wir mal zu Ihrem Täuschungsspiel. Das hat bei Ihnen Pr…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 13. Dirk Wiese (SPD) — ID212401500

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `Diffamierung`, `Hass`, `Hetze`
  - Begründung: Diese Wörter sind zwar vom Sprecher Wiese selbst genutzt und wörtlich in der Summary erhalten, sind aber dennoch bewertend — sie sind Wieses eigene Vorwürfe gegen die AfD, nicht neutrale Deskription. Deshalb Konfidenz nicht 'hoch', aber auch nicht 'niedrig', weil die Reproduktion dieser Vorwürfe akkurat und notwendig ist: die Rede besteht aus diesen Vorwürfen als Belege. Alternativ-Formulierung (z.B. 'kritisiert das Ausbleiben...') würde die Schärfe der Konfrontation verlieren.

**v1-Summary (alt):**
> Dirk Wiese (SPD) führt eine konfrontative Debatte mit dem AfD-Vertreter König und wirft der AfD-Fraktion vor, Sportler mit Migrations- oder Minderheitenhintergrund (Gerald Asamoah, Jérôme Boateng, Amanal Petros, deutsche Basketballnationalmannschaft) bewusst nicht zu würdigen, obwohl diese Leistungsträger das Land repräsentieren — statt Glückwünsche höre er von der AfD nur „Diffamierung, Hass und Hetze" gegen Menschen mit deutschem Pass. Mit Sarkasmus (König sitze im „FC Bundestag häufig auf der Bank") und rhetorischen Fragen konfrontiert Wiese König direkt mit dieser Heuchelei bei gleichzeitiger Behauptung von „Leistungs"-Prinzipien.

**v2.1-Summary (neu):**
> Dirk Wiese (SPD) konfrontiert den AfD-Abgeordneten König direkt mit einer Selektivitäts-Anklage: Während die AfD Leistungsprinzipien betone (Wiese eröffnet sarkastisch mit „FC Bundestag — Sie sitzen häufig auf der Bank"), fehlten öffentliche Glückwünsche der AfD-Fraktion und der Vorsitzenden Alice Weidel an international erfolgreiche deutsche Sportler mit Migrations- oder Flüchtlingshintergrund wie Gerald Asamoah, Jérôme Boateng, Amanal Petros (Silber bei der Weltmeisterschaft) und die europäische Basketballnationalmannschaft. Wiese dokumentiert stattdessen nur „Diffamierung, Hass und Hetze gegen Menschen mit deutschem Pass, die Sporterfolge für die Bundesrepublik Deutschland erzielt haben".

**Original-Auszug (Mitte, ~600 chars):**
```
…ckwünsche der AfD-Fraktion gewesen für Sportler, die unser Land und unsere Sportnation großgemacht haben? Wo sind in den vergangenen Jahren eigentlich die Glückwünsche an einen Gerald Asamoah gewesen? Wo sind eigentlich die Glückwünsche an einen Jérôme Boateng gewesen? Diese Sportler haben dieses Land mit großgemacht. Ich habe in diesen Bereichen von Ihnen nur Diffamierung, Hass und Hetze gegen Menschen mit deutschem Pass erlebt,
die Sporterfolge für die Bundesrepublik Deutschland erzielt haben, die Pokale nach Deutschland geholt haben. Ich habe dazu nichts Positives gehört.
Wo waren eigentlic…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 14. Adam Balten (AfD) — ID212410400

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Attentat`
  - Begründung: Das Wort 'Attentat' stammt wörtlich vom Sprecher; 'links-grünes ideologisches Attentat' ist sein zentraler Sarkasmus. Es bleibt ein stark wertend gefärbter Begriff, den der Sprecher bewusst nutzt, daher keine Editorialisierung — aber die Konfidenz-Reduktion auf 'mittel' reflektiert, dass auch die 'neutrale' Wiedergabe dieser Polemik nicht ohne Geschmack ist.

**v1-Summary (alt):**
> Adam Balten (AfD) verdammt den Forschungshaushalt als „links-grünes ideologisches Attentat" und illustriert dies mit der Plastikdeckel-Anekdote: ein Beamter sammelt am Strand Müll, fordert ein Gesetz, worauf Unternehmen Produktionslinien umbauen und paradoxerweise mehr Material verbrauchen — ein Beleg für gescheiterte „Kommandoforschung". Seine Forderungen: Ablehnung und Überarbeitung des Haushalts, Stopp von „Genderquatsch und Klimawahn", Fokus stattdessen auf KI und Quantencomputer, weniger Schulden bei gezielten Forschungsinvestitionen. Der Schlusspunkt: sogar seine achtjährigen Kinder verstünden, dass der Markt das nicht will — eine Satire auf die Realitätsferne der Koalition.

**v2.1-Summary (neu):**
> Adam Balten (AfD) attackiert den Forschungshaushalt als „links-grünes ideologisches Attentat" und nutzt eine extended Metapher des Plastikdeckels: ein ehemals genialer marktwirtschaftlicher Innovation, die durch ideologiegetriebene Regulierung zu mehr Material, höheren Kosten und Innovationshemmung führe — sein achtjähriges Kind lehne das Produkt ab, der Markt wolle das nicht. Er fordert einen AfD-Alternativhaushalt mit Fokus auf KI und Quantencomputer statt „Genderquatsch und Klimawahn", mit weniger Schulden und technologiegetriebener Forschung ohne „Global Goals"-Dirigismus.

**Original-Auszug (Mitte, ~600 chars):**
```
… ich Müllgebühren. Das müssen Sie mir erst mal erklären. Also, der Mittelständler muss nun Engineering betreiben. Es folgen ewige Besprechungen, ganze Produktionslinien werden umgebaut. Stellen Sie sich vor, liebe Brandmaueristen und Klimahysteriker: Es wird jetzt sogar mehr Material für die Deckel verwendet. Auf Klimadeutsch: Mehr CO2 wird verbraucht.
Die Folge ist: Höhere Kosten für alle. Die Gelder werden in der Folge sogar von Forschung und Entwicklung abgezogen. Die Innovationskraft wird im ideologischen, bürokratischen Unsinn gebunden. Unsere globale Wettbewerbsfähigkeit sinkt, die Infla…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 15. Beatrix von Storch (AfD) — ID212703600

- **v1-flagged Wort:** `verdammen`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `gottlos`
  - Begründung: Das Wort 'gottlos' stammt wörtlich vom Sprecher ('diese Ideen sind nicht links und woke und grün und gottlos'), ist aber eine Wertzuschreibung, die ich in der Summary aufgenommen habe. Es ist vom Sprecher selbst getroffen und als solche reproduziert (Distanz-Markierung wäre redundant), gehört daher in die wertende_woerter_eigene-Liste zur Transparenz.

**v1-Summary (alt):**
> Beatrix von Storch (AfD) nutzt eine apokalyptisch-heilsverkündigende Rhetorik, um die deutsche Außenpolitik als gescheitert zu verdammen: 'Regenbogenfahnen', Gender, Klimapolitik und vermeintliche Widerstände gegen Trump seien Zeichen des „woken Festung"-Denkens, während eine „spirituelle Revolution" in den USA und ein bevorstehender Zusammenbruch des westlichen Liberalismus die neue Weltordnung vorbereiteten. Die mythologisierte Figur Charlie Kirks (behauptet von Storch, dieser sei ermordet worden und werde zur spirituellen Leitfigur einer MAGA-Bewegung, die nun „größer als Trump" sei) dient als Chiffre für einen kommenden europäischen Umschwung zu „Freiheit, Familie, Vaterland" und christlicher Wertebindung — Deutschland solle sich dieser Kraft unterwerfen statt widerstehen.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Beatrix von Storch (AfD) lehnt die bisherige deutsche Außenpolitik (Fischer/Baerbock-Ära) als linke, woke, genderorientierte Ideologie ab und proklamiert, dass eine spirituelle Revolution in den USA den Westen transformiert: die MAGA-Bewegung, angeführt durch Charlie Kirk, repräsentiere den Zusammenbruch 60 Jahre linker westlicher Hegemonie und werde Europa im Geiste von Freiheit, Familie, Vaterland und Jesus Christus reformieren. Mit Gorbatschow-Zitat und apokalyptischem Frame ('Die Geschichte geht über Sie hinweg', 'Staatskrise Frankreich', 'Aufstand Großbritannien') wirbt sie für eine Neuausrichtung der Außenpolitik jenseits bisheriger progressiver Leitideen.

**Original-Auszug (Mitte, ~600 chars):**
```
…chtung des Westens bestimmt, und das kommt jetzt an sein Ende. Die SPD mag hier im Haus den Kampf um die Fraktionssitzungssäle gewinnen, den Kampf um die Köpfe und die Herzen haben Sie verloren.
Charlie Kirk war eine Gefahr für die Linke, weil er nicht nur wie Trump die konservative Basis mobilisieren konnte, sondern er konnte junge Menschen überzeugen, die nie konservativ waren. Darum musste er sterben. Aber seine Ideen werden nach seinem Tod jetzt noch mächtiger werden, als sie zu seinen Lebzeiten je waren, viel mächtiger.
Wenn Sie glauben, dass Sie sich in Westeuropa in einer woken Festung …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 16. Steffen Kotré (AfD) — ID212903200

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Sabotage`
  - Begründung: Das Wort 'Sabotage' wird vom Sprecher selbst genutzt ('andere sehen darin eine Sabotage des eigenen Landes'), aber mit Distanzmarkierung ('andere sehen') — die Summary übernimmt es mit Anführungszeichen und bleibt akkurat zum Original, aber die indirekte Attribution könnte als leichte Editorialisierung gelesen werden. Alle anderen polemischen Wörter ('verrückt', 'schizophren', 'Ausplünderung') sind direkt vom Sprecher und werden daher mit hoch-Konfidenz belegt.

**v1-Summary (alt):**
> Steffen Kotré (AfD) verdammt die Energiewende als planwirtschaftliche Sabotage und irrational verantwortungslose Regierungspolitik: Mit Gedankenexperiment des „irrationalen Unternehmens" illustriert er, dass ca. ein Drittel der PV-Stromproduktion subventioniert werden muss, Bürger also doppelt zahlen (Produktion + Abnahmeprämie), während Minister Reiche (Grüne) die Energiewende als „Erfolg" verkauft, obwohl keine Kostenberechnung je stattfand (25 Jahre). Seine Bilanz: 5 Billionen Euro Gesamtkosten = 70.000 Euro pro Bürger, „Ausplünderung durch links-grüne Konzerne". Schlussforderung: Abwahl der Bundesregierung und Ende der Energiewende; Frame: CDU/CSU sind nur „verlängerter Arm der Grünen, halt nur in Maskerade".

**v2.1-Summary (neu):**
> Steffen Kotré (AfD) kritisiert die Energiewende als wirtschaftlichen Wahnsinn: Ein Drittel der PV-Stromproduktion benötige Subventionen für den Absatz; die Bundesregierung handle irrational, indem sie trotz erkannter Stromlücken, Teuer-Werdung und fehlender Kostenberechnung (25 Jahre ohne volkswirtschaftliche Gesamtkostenanalyse) die Energiewende weitertreibe. Dies sei entweder 'Schizophrenie' oder bewusste 'Sabotage des eigenen Landes'. Er wirft Wirtschaftsministerin Reiche vor, ihre eigenen Erkenntnisse zu Versorgungslücken zu ignorieren, attackiert die CDU als 'verlängerten Arm der Grünen' und fordert mit direktem Wahlaufruf: „Es ist Zeit, diese Bundesregierung abzuwählen und die Ausplünderung der Menschen zu beenden."

**Original-Auszug (Mitte, ~600 chars):**
```
…andelt, aber genauso weitermacht? Richtig, es wäre schizophren oder nimmt den Schaden bewusst in Kauf. Doch genau so handelt das Bundeswirtschaftsministerium. Frau Ministerin Reiche, Sie sagen, dass die Energiewende zu Stromlücken führt und zu teuer für Unternehmen und Haushalte ist.
Aber Sie wollen trotzdem die Energiewende weitertreiben.
Sie sagen, dass die Versorgungssicherheit abnimmt. Gleichzeitig sagen Sie, dass die Energiewende ein Erfolg sei.
Manche würden diese Politik als schizophren bezeichnen, andere sehen darin eine Sabotage des eigenen Landes, meine Damen und Herren.
Und als ob d…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 17. Peter Boehringer (AfD) — ID212904800

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamierungs`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `deindustrialisierung`, `planwirtschaft`
  - Begründung: ‚Deindustrialisierung' und ‚Planwirtschaft' stammen wörtlich vom Sprecher (vorsätzliche Deindustrialisierung, CO2-Planwirtschaft, Plansozialismus), sind also korrekt. Alle anderen polemischen Wörter (Etikettenschwindel, ideologisches Gedöns, Renditefreie Kosten, Desinvestitionen) werden vom Sprecher selbst verwendet — Polemik-Erhalt ist sachgerecht. Konfidenz ‚mittel' nur weil die Syntheserhetorik selbst stark polemisch ist; diese Stärke ist aber vom Sprecher intendiert und sprachlich akkurat widergegeben.

**v1-Summary (alt):**
> Peter Böhringer (AfD) führt eine scharfe polemische Haushalts-Kritik auf mehreren Ebenen: (1) Struktur-Etikettenschwindel durch Sonderschuldentöpfe, 29 % Schuldenfinanzierung (Kriegszeiten-Niveau), Waffenausgaben als fiktive Investitionen; (2) ideologische CO2-Planwirtschaft (Deutschland-2040-Ziel trotz US-Ausstieg), die er als „alten Sowjetsystem ganz ohne Moskau" rahmt; (3) EU-Versagen bei Migration, geplante Verdopplung deutscher Zahlungen von 47 Mrd Euro, supranationale Strukturen unter ungewählter Kommission. Seine Kernforderungen: Rückkehr zu ausgeglichenen Haushalten (nach preußischem Vorbild), Reduktion EU-Zahlungen, strikte nationale Souveränität („es kann nur eine geben: eine deutsche Souveränität!"), Stopp von CO2-Planwirtschaft und Überwachungsinstrumenten. Charakteristisch ist der Angriff auf die CDU (Spahn-Diffamierung), die unter Merkel „ganze Kolonnen von Verfassungsfeinden ins Land gelassen" habe — das sei dasselbe wie das sowjetische Plansystem.

**v2.1-Summary (neu):**
> Peter Boehringer (AfD) kritisiert scharf die Haushaltspolitik 2026 als einen beispiellos schuldenfinanzierten Haushalt (fast 30% schuldenfinanziert, Deutschland bei knapp 5% BIP-Verschuldung) mit Etikettenschwindel bei Investitionen und ideologischen Ausgaben für CO2-Planwirtschaft und Waffenrüstung statt echter Wohlstandsinvestitionen; parallel fordert er Senkung der deutschen EU-Zahlungen (47 Mrd Euro), Stopp von Chatkontrolle und Digital Euro, Verschärfung der Migrationskontrolle und Bewahrung der deutschen Souveränität gegen EU-Zentralisierung — attackiert die Koalition (CDU-Spahn explizit wegen „Diffamierungs-Vorwurf Moskau-Kolonne") und deutet den Rahmen als Rückkehr zum Sowjetsystem. Der Präsidium-Ordnungsruf erfolgt bei der Schlusspointe.

**Original-Auszug (Mitte, ~600 chars):**
```
…tern ganz trotzig. Sie bejubelten die vorsätzliche Deindustrialisierung Deutschlands.
Und auch Brüssel hilft bei der Zerstörung Deutschlands kräftig mit. Im Finanzplan der EU werden Waffenprogramme und CO2-Planwirtschaft ebenfalls immer teurer. Über die EU und die EZB werden Ukrainekredite und grüne Anleihen mit faktischer Gemeinschaftshaftung zur Regel, was ja bei Corona noch die illegale Ausnahme war. Der Ausnahmezustand wird zum neuen Normal bei Ihnen – alles zulasten der deutschen Steuerbürgen.
Die Bundesregierung – wir haben es ja eben schon gehört – verhandelt aktuell mit Brüssel ernstha…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 18. Maximilian Kneller (AfD) — ID213016700

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Hypocrisy (implizit in 'Krokodilstränen'-Vorwurf, aber der Sprecher nutzt diesen Begriff explizit)`, `gerechter/ungerechtigkeit (Sprecher nutzt 'gerecht' selbst — 'zigmal gerechter' — daher OK)`
  - Begründung: Das Wort 'Hypocrisy' habe ich als Kurzform für 'inconsistency in preaching values but failing to live them' eingebaut — der Sprecher formuliert es rhetorisch ('Krokodilstränen', 'vor eigener Tür kehren'), nutzt das Wort 'Heuchelei' selbst aber nicht. Da die Zusammenfassung sehr nah an der Sprecher-Intention bleibt und 'gerecht/ungerecht' direkt vom Sprecher kommt, halte ich den Self-Check auf 'mittel' (eines könnte neutraler sein).

**v1-Summary (alt):**
> Maximilian Kneller (AfD) eröffnet polemisch mit einer Richtigstellung gegen die vermeintliche Behauptung, Alicia Weidel lebe in der Schweiz, und fordert öffentliche Entschuldigung. Im Kernargument führt er ein numerisches Gedankenexperiment auf: Wer bei 4.200 Euro brutto über 40 Jahre in MSCI World oder Aktienfonds statt in die gesetzliche Rente einzahlt, hinterlässt seinen Kindern ein Millionenvermögen (monatlich ~4.000 Euro unter 10%-Entnahmeregelumlage) statt einer mageren Nettorentenleistung von ~1.500 Euro — und wirft der Gegenseite vor, dies als „sozial ungerecht" zu rechtfertigen, während sie gleichzeitig Familienvorsorge verdammt.

**v2.1-Summary (neu):**
> Maximilian Kneller (AfD) konfrontiert einen Grünen-Sprecher mit zwei Angriffen: erstens wirft er ihm vor, über 'Fake News' zu lügen (Alice Weidel lebe in der Schweiz — sie sei in Deutschland gemeldet), und stellt die Hypocrisy-Frage, ob die Grünen selbst zu ihrer Rhetorik von Glaubwürdigkeit stehen ('Krokodilstränen', 'vor Ihrer eigenen Tür kehren'). Zweitens greift er das gesetzliche Rentensystem mathematisch an: Ein Arbeitnehmer mit 4.200 EUR brutto, 40 Jahre Beitrag, erhalte nur 1.500 EUR Rente, könne aber mit MSCI-World-ETF ein Millionenvermögen für die Familie aufbauen — sein Schlussverdikt: 'Das wäre zigmal gerechter ... statt es in einen großen, anonymen Topf einzubezahlen'.

**Original-Auszug (Mitte, ~600 chars):**
```
…d hoc abfragen.
Und ansonsten kann ich Ihnen noch sagen: Das Problem bei diesen Modellen, die Sie da fahren, besteht darin, dass sie so unattraktiv sind, weil Sie sie falsch betreiben. Frau Kollegin Schielke-Ziesing hat es eben schon gesagt.
Nehmen Sie mal das Beispiel der Rente und das Geld, das Sie da über 40 Jahre einzahlen, wenn Sie beispielsweise 4 200 Euro brutto verdienen. Rechnen Sie mal hoch, was Sie da an Nettorentenleistung einzahlen und später erhalten! Würden Sie das Geld, sagen wir mal beispielhaft, in den MSCI World stecken, dann könnten Sie nachher Ihren Kindern – ich weiß, das…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 19. Stephan Brandner (AfD) — ID213017200

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `erbärmlich`
  - Begründung: Das Wort 'erbärmlich' nutzt der Sprecher selbst wörtlich ('Also, was Sie hier präsentieren, ist wirklich erbärmlich') — gehört also in die Summary. Alle anderen polemischen Wörter ('hysterisch', 'Hass, Hetze') sind vom Sprecher selbst gegenüber der Gegenseite gesagt, daher korrekt. Konfidenz mittel nur wegen der Grenzfälle: 'sanitisierung' in der Tonalitäts-Wahl (bin aber bei polemisch_sachlich, was korrekt ist).

**v1-Summary (alt):**
> Stephan Brandner (AfD) greift die Bundestagsmehrheit in polemischer Tonalität an: Sie rechtfertigten ein Privilegien-Rentensystem für Abgeordnete — durchschnittlich 3.500 Euro monatlich nach nur 10 Jahren Bundestag, während normale Bürger für 1.200 Euro monatliche Rente 45 Jahre einzahlen müssen; 0,0004 % der Rentner erreichen die Höchstrente, Abgeordnete fast alle. Er fordert die Umsetzung der eigenen Regierungs-Kommission von 2013 und ein Ende der „Rentenmauer zwischen Bürgern und Abgeordneten" durch Angleichung der Abgeordnetenrente an die gesetzliche Rentenversicherung — ein klassisches AfD-Frame der Privilegien-Doppelmoral des Establishments.

**v2.1-Summary (neu):**
> Stephan Brandner (AfD) attackiert die Parlamentsmehrheit für ihre Abwehrhaltung zum AfD-Antrag auf Angleichung der Abgeordnetenrente an die gesetzliche Rentenversicherung und wirft ihr vor, bei dieser Debatte 'mit Hass, Hetze und Fake News' zu reagieren. Mit konkreten Zahlen belegt er die 'absolute Schieflage': während durchschnittliche gesetzliche Renten nach 45 Einzahlungsjahren bei ~1.200 Euro liegen und nur 0,0004% der Rentner 3.500 Euro erreichen, bekommen Abgeordnete diese Summe im Durchschnitt nach nur zehn Jahren; seine Forderung lautet, diese 'Rentenmauer' zu durchbrechen, und er beruft sich auf Vorschläge aus einer 2011 eingesetzten Regierungskommission, die seit drei Wahlperioden ignoriert würden.

**Original-Auszug (Mitte, ~600 chars):**
```
…nd Rentner hervor, die sich nichts mehr leisten können:
zu viel zum Sterben und zu wenig zum Leben. Natürlich wollen Sie sich da rausnehmen. Deswegen gaukeln Sie den Leuten draußen irgendwas vor.
Vielleicht mal zu den Zahlen. Die gesetzliche monatliche Durchschnittsrente – es gibt ja verschiedene Berechnungen – liegt ungefähr bei 1 200 Euro, nachdem man 45 Jahre eingezahlt hat; 1 200 Euro! Die monatliche Durchschnittsrente bei Abgeordneten liegt bei ungefähr 3 500 Euro – nach durchschnittlich zehn Jahren Anwesenheit hier im Deutschen Bundestag. 3 500 Euro könnten Versicherte theoretisch auch a…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 20. Diana Zimmer (AfD) — ID213108000

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Doppelmoral`
  - Begründung: Das Wort 'Doppelmoral' ist Zimmer-sprachlich präsent (strukturiert ihr Pelm-Argument), aber keine direkte Redens-Phrase — sie nutzt 'Doppelmoral' nicht wörtlich als Term, sondern argumentiert das Konzept. Neutrale Alternative möglich: 'kritisiert Inkonsistenz' statt 'wirft Doppelmoral vor' — aber die Polemik-Tonalität bleibt akkurat.

**v1-Summary (alt):**
> Diana Zimmer (AfD) lehnt den Linke-Antrag zu gleichwertigen Lebensverhältnissen scharf ab und attackiert ihn als Bevormundung und Gleichmacherei: Sie zitiert sarkastisch aus Pellmanns Pressemitteilung, wonach „der Staat entscheiden soll, wem wie viel zusteht", und wirft der Linken Doppelmoral vor — 64 Linke-Abgeordnete verdienen ~12.000€ monatlich, aber beim Einkommensverzicht auf Facharbeiter-Niveau würde es nicht geschehen. Ihr Frame: Deutschlands Einheit lebt von „Vertrauen, Freiheit und Verantwortung, nicht von Kontrolle und Bevormundung", und die AfD sei die einzige Kraft, die den Willen der Ostdeutschen wirklich respektiere.

**v2.1-Summary (neu):**
> Diana Zimmer (AfD) lehnt den Linke-Antrag zu gleichwertigen Lebensverhältnissen ab und attackiert die Forderung nach staatlichen Eingriffen in Vermögensverteilung und Vergesellschaftung als „Gleichmacherei" und Bevormundung: Der Staat solle nicht entscheiden, wem wie viel zusteht, sondern Menschen sollten ihr Leben selbst in die Hand nehmen. Sie wirft der Linken Doppelmoral vor (64 Abgeordnete mit je 12.000 Euro monatlich, weit über dem Facharbeiter-Einkommen im Osten) und behauptet, eine Mehrheit im Osten wünsche sich „mehr Freiheit, weniger Bevormundung und mehr AfD". Zentraler Frame: Vertrauen in Freiheit und Eigenverantwortung statt staatlicher Kontrolle; der Schluss ist ein direkter Wahlaufruf.</zusammenfassung_2_saetze

**Original-Auszug (Mitte, ~600 chars):**
```
…t identischem Titel: „35 Jahre deutsche Einheit: Wer gleichwertige Lebensverhältnisse will, muss umverteilen“.
Auch er hat den Antrag mitunterzeichnet. In der Pressemitteilung heißt es wörtlich:
„Echte, gleichwertige Lebensverhältnisse können nur durch staatliche Eingriffe in die Vermögensverteilung erreicht werden.“
Was für ein Satz! Dieser Satz bedeutet: Der Staat soll entscheiden, wem wie viel zusteht, nicht mehr die Menschen selbst.
So zerstört man Verantwortung und am Ende auch Freiheit.
Denn das ist keine Anerkennung unterschiedlicher Lebensrealitäten, sondern eine Abwertung derjenigen, …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 21. Dr. Michael Espendiller (AfD) — ID213112000

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `sabotieren`, `diskreditieren`
  - Begründung: Die Wörter 'sabotieren' und 'diskreditieren' sind vom Sprecher selbst genutzt ('wollen den Bundesrechnungshof von innen heraus sabotieren', 'dazu verabredet, den BRH zu diskreditieren'); allerdings sind sie in der Summary auch Editorial-nah formuliert ('Versuch, ihn sabotieren zu wollen'). Für volle Neutralität hätte es sein sollen: 'will die ehem. SPD-Bauministerin Klara Geywitz in Führungsposition beim BRH platzieren' — ohne die Vorwurf-Interpretation. Entscheidung: 'mittel' Konfidenz, da die Interpretation des Sprechers selbst vorgenommen wird, aber nicht mit neuen wertendem Vokabular.

**v1-Summary (alt):**
> Dr. Michael Espendiller (AfD) verdammt zwei Gesetze der Merz/Klingbeil-Regierung als „undurchdachte Rekordschuldenprogramme": das Strukturkomponente-für-Länder-Gesetz (das Ländern 0,35% BIP jährliche Neuverschuldung erlaubt) sei „Insolvenzverschleppung" ohne Reformdruck, und das LuKIFG (100 Mrd Euro Schuldenfinanzierung) sei nicht verfassungsgemäß, weil die schwarz-rote Koalition alle Kontrollmechanismen gestrichen hat — statt echter Infrastruktur-Zweckbindung gebe es nur „allgemeine Budgethilfe". Mit sarkastischem Tucholsky-Zitat greift er SPD/Grüne/Linke an, die den Bundesrechnungshof nun diskreditieren wollten und die geplante Einsetzung Klara Geywitz in die BRH-Führungsposition als geplante interne Sabotage des unabhängigen Instituts darstellt.

**v2.1-Summary (neu):**
> Dr. Michael Espendiller (AfD) lehnt zwei Gesetze der Merz/Klingbeil-Regierung als „undurchdachte Rekordschuldenprogramme" ab: das Strukturkomponente-für-Länder-Gesetz ermöglicht Ländern 0,35% BIP-Verschuldung jährlich (was er als „Insolvenzverschleppung" statt Reformdruck kritisiert), und das Länder-und-Kommunal-Infrastrukturfinanzierungsgesetz (LuKIFG) mit 100 Mrd Euro aus 100% Schulden wird seiner Ansicht nach zu bloßer „allgemeiner Budgethilfe", da die Koalition dem Gesetz „sämtliche Zähne gezogen" habe (Rückforderungsmöglichkeiten gestrichen). Er behauptet, das LuKIFG sei verfassungswidrig, attackiert SPD/Grüne/Linke als „linke Parteien", die den Bundesrechnungshof diskreditieren wollen, und kritisiert die Absicht, die „Ex-SPD-Bauministerin Klara Geywitz in Führungsposition" beim BRH zu platzieren als Versuch, ihn „von innen heraus zu sabotieren".

**Original-Auszug (Mitte, ~600 chars):**
```
…Bund auch die Rückforderungsmöglichkeiten gegenüber den Ländern gehabt, die sich nicht an die Spielregeln der Grundgesetzänderung vom März gehalten hatten. Aber genau das wurde jetzt gestrichen.
Damit stellt sich insgesamt die Frage, ob das LuKIFG überhaupt verfassungsgemäß ist. Wir sind der Auffassung: Nein, das Gesetz ist nicht verfassungsgemäß. Aber da uns als AfD-Bundestagsfraktion leider sechs Stimmen in diesem Haus fehlen, können wir das Gesetz auch nicht vor dem Bundesverfassungsgericht überprüfen lassen.
Der Bundesrechnungshof jedenfalls hat mit seinem Bericht vom 8. September dieses J…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 22. Ates Gürpinar (Die Linke) — ID213114700

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `dreiste Arbeit`, `peinlich`
  - Begründung: Die Wörter 'dreiste Arbeit' und 'peinlich' sind vom Sprecher selbst genutzt (direkte Zitate: 'Das ist dreiste Arbeit' / 'Das ist so peinlich') — rechtmäßig in der Summary. Die Formulierung 'braunen Boden fruchtbar hält' ist Sprecher-Metapher (nicht aus Tier-A-Liste), aber stark wertend — ich habe sie in `zusammenfassung_2_saetze` als wörtliches Zitat gekennzeichnet, nicht als eigene Bewertung. Tier-A-Wörter wie 'skandalisiert', 'diffamiert', 'denunziert' wurden vermieden. 'Hetze' ist Sprecher-Wort (Original: 'die für Sie notwendige Portion Hetze'). Konfidenz = mittel, weil die Rede selbst so polemisch ist, dass strikte Neutralisierung die Genauigkeit gefährdet hätte — aber keine LLM-eigenen Wertungen eingefügt.

**v1-Summary (alt):**
> Ates Gürpinar (Die Linke) demontiert den AfD-Antrag zur Herausnahme versicherungsfremder Leistungen in dreischrittiger Anklage: die Grundlage sei von der Linken kopiert, die AfD füge lediglich „Hetze gegen Migrantisierte" hinzu; die mathematik sei Heuchelei (10 Mrd aus Versicherungen → Bundeshaushalt, finanzierbar nur wenn Steuern für Vermögende sinken). Sein schärferer Vorwurf gilt aber der Regierungskoalition selbst: Union und SPD hätten versicherungsfremde Leistungen im Wahlkampf versprochen, setzten sie nun nicht um und drangsalierten stattdessen Bürgergeldempfänger — „den braunen Boden fruchtbar" machend. Seine Gegenforderung: Finanzierung des Gesundheitssystems durch progressive Besteuerung, nicht durch Treten nach unten.

**v2.1-Summary (neu):**
> Ates Gürpinar (Die Linke) lehnt den AfD-Antrag zur Herausnahme versicherungsfremder Leistungen ab und attackiert ihn als „Paradebeispiel rechter Arbeit: Grundlage kopiert, Hetze addiert und die Wahrheit subtrahiert" — die AfD habe einen kürzlich diskutierten Linke-Antrag abgeschrieben, ergänzt um „zusammenhanglose" Hetze gegen Migranten, und ignoriere die fiskalische Realität (knapp 10 Mrd Euro Umfinanzierungsbedarf, unmöglich bei geplanten Steuersenkungen für Vermögende). Darüber hinaus kritisiert er Union und SPD scharf, weil sie ihr Wahlkampfversprechen nicht umsetzten und stattdessen selbst die Drangsalierung von Bürgergeldempfängern intensivieren — sein Frame: „den braunen Boden fruchtbar halten" durch mangelnde Alternative; stattdessen sollte das Gesundheitssystem durch progressive Umverteilung finanziert werden, nicht durch „nach unten treten".

**Original-Auszug (Mitte, ~600 chars):**
```
…durch die AfD-Pforte.
Drittens. Wenn Sie Leistungen für Bürgergeldempfänger aus den Versicherungen rausnehmen, müssen Sie die in den Bundeshaushalt einfügen: knapp 10 Milliarden Euro. Sie schreiben es selbst. Aber Sie wollen die Steuern für Vermögende ja sogar absenken. Das Geld fehlt dann im Haushalt. Einfache Rechnung, bei Ihnen aber nicht möglich.
Das ist dreiste Arbeit, auf die viele leider hereinfallen. Das funktioniert aber nicht wegen denen rechts außen. Das funktioniert, weil die Regierung, weil die sogenannte Mitte den braunen Boden fruchtbar hält, und zwar hier gleich doppelt: Sowohl…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 23. Kurt Kleinschmidt (AfD) — ID213115100

- **v1-flagged Wort:** `skandalisiert`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Missbrauch`, `Übergriffe`
  - Begründung: Die Worte 'Missbrauch' und 'Übergriffe' werden vom Redner selbst wörtlich verwendet ('driftet dieses Gesetz unaufhaltsam in Missbrauch und staatliche Übergriffe ab'); eine neutral-deskriptive Alternative würde die Polemik der Rede verfälschen — Konfidenz bleibt 'mittel' weil die Grenzlinie zwischen Polemik-Treue und eigener Editorialisierung hier dünn ist, aber die Zitate sind exakt vom Sprecher.

**v1-Summary (alt):**
> Kurt Kleinschmidt (AfD) begrüßt die geplante Rückkehr zur Wehrpflicht und befürwortet grundsätzlich die Ausweitung der MAD-Befugnisse gegen steigende Spionage-, Cyber- und Hybridbedrohungen; lehnt aber den vorliegenden Gesetzentwurf in dieser Fassung ab, weil er — so seine Erfahrung als 35-jähriger EloKa-Soldat — zur willkürlichen Unterdrückung abweichender politischer Meinungen missbraucht werden könne. Er skandalisiert dies durch die Fallbeispiele Anke Rehlinger (Neutralitätspflicht-Bruch) und der Linken als „Mauerschützenpartei", und endet mit direktem Wahlaufruf gegen Deutsche Ukraine-Beteiligung: „Wir werden uns mit aller Kraft dafür einsetzen, dass Sie in keinen Stellvertreterkrieg geschickt werden, schon gar nicht in die Ukraine."

**v2.1-Summary (neu):**
> Kurt Kleinschmidt (AfD) begrüßt die Rückkehr zur allgemeinen Wehrpflicht und lehnt dann den Gesetzentwurf zur Stärkung der militärischen Sicherheit der Bundeswehr in dieser Fassung ab — er behauptet, dass die erweiterten Befugnisse des Militärischen Abschirmdienstes zur Unterdrückung abweichender politischer Meinungen und willkürlicher Steuerung / Entlassungen missbraucht werden können. Als Fachautorität (35 Jahre EloKa-Soldat mit regelmäßigen Sicherheitsüberprüfungen) richtet er polemische Vorwürfe gegen die Linke und Grüne (SED-Nachfolgepartei, Mauerschützenpartei) und gegen Bundesratspräsidentin Rehlinger und den Verfassungsschutzpräsidenten (behauptete Neutralitätsverletzung), bevor er mit einem Appell an Soldaten endet: die AfD werde verhindern, dass sie in Stellvertreterkriege, besonders in die Ukraine, entsandt werden.

**Original-Auszug (Mitte, ~600 chars):**
```
… theoretisch debattieren.
Eine Gesetzesänderung ist notwendig; denn die Bedrohungen – der Minister hat es schon gesagt – durch Spionagetätigkeiten, Cyberattacken und hybride Angriffe gegen unsere Bundeswehr nehmen zu
– ich verstehe, dass Sie von den Linken gelangweilt sind –, und das nicht nur durch die üblichen Protagonisten Russland oder China.
– Lassen Sie mich doch ausreden! Ich weiß, dass Sie nervös sind, wenn Fakten auf den Tisch kommen, Herr von Notz.
Mit dem geplanten Gesetz zur Stärkung der militärischen Sicherheit wird im Hinblick auf die Drohnenvorfälle und das Unmittelbarer-Zwang-G…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 24. Markus Frohnmaier (AfD) — ID21311800

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=4
  - Wörter (laut Haiku selbst): `ruiniert (vom Sprecher selbst genutzt ✓)`, `maximal wirkungslos (vom Sprecher selbst genutzt ✓)`, `unwürdig (vom Sprecher selbst genutzt ✓)`, `peinlich (vom Sprecher selbst genutzt: 'peinliche Doppelmoral' ✓)`
  - Begründung: Die polemischen Wertungen ('ruiniert', 'unwürdig', 'maximal wirkungslos') stammen wörtlich vom Sprecher — es gibt hier keine Editorialisierung durch die Summary. Allerdings: Die Zusammenfassung fasst drei komplexe Anklage-Blöcke (Baerbock, Wadephul-Kriterien, Doppelmoral-Vorwurf) kompakt zusammen, dabei bleibt unklar, wie viel subjektive Priorisierung in die Reihenfolge / Betonung fliesst — nicht aber wörtliche Wertungs-Erfindung.

**v1-Summary (alt):**
> Markus Frohnmaier (AfD) empfängt Außenminister Wadephul mit sarkastischer Herabsetzung gegenüber Vorgängerin Baerbock und drei polemischen Messstäben: deutsche Interessen statt bedingungsloser Ukraine-Solidarität, Frieden/Stabilität in Europa statt Involviertheit in fremde Kriege, und Beendigung der „wertebasierten" Außenpolitik — ebenso Verfolgung der AfD durch Inlandsgeheimdienst. Mit de-Gaulle-Zitat, Trump-Anerkennungund Rubio-Zitat (AfD sei nicht „extremistisch", sondern „Zweiter Platz bei Wahlen") rahmt er die AfD-Position in Realpolitik statt „altem Denken"; Doppelmoral-Vorwurf: Deutschland kritisiere Thailand-Oppositionsverbote, während Dobrindt gleichzeitig deren „Modell nach Deutschland exportieren könnte – mit der AfD als Ziel".

**v2.1-Summary (neu):**
> Markus Frohnmaier (AfD) eröffnet mit persönlichen Angriffen auf Baerbock ('Ansehen ruiniert', Kosmetika-Spitze) und adressiert dann Wadephul mit drei Kriterien zur Messung seiner Außenministerschaft: (1) deutsche statt ukrainische Interessen vertreten, (2) Frieden und Stabilität in Europa durch Anerkennung territorialer Realitäten (Krim/Ostukraine bleiben faktisch verloren) statt weitere Waffenlieferungen, (3) Beendigung der 'wertebasierten' Außenpolitik und der 'Doppelmoral' (kritisiert Thailand-Oppositionsverbot, während Dobrindt AfD-Verbot prüft). Er zitiert Charles de Gaulle ('Staaten haben Interessen, keine Freunde'), Trump als Vorbild, und Marco Rubio gegen 'verdeckte Tyrannei' — und verlangt am Schluss Stopp der 'unwürdigen Verfolgung der stärksten Partei'.

**Original-Auszug (Mitte, ~600 chars):**
```
…ann verlassen Sie dieses alte Denken, und wagen Sie eine echte Zeitenwende, eine Zeitenwende hin zur Realität!
Zweitens werden wir Sie daran messen, ob Sie Deutschlands höchstes Interesse konsequent verfolgen: Frieden und Stabilität in Europa. Täuschen Sie sich nicht: Weder ich noch meine Fraktion sind naive Pazifisten. „Wer Frieden will, bereitet sich auf den Krieg vor“ – das ist nicht nur ein Sprichwort seit der Antike, sondern Realismus. Wir stehen für eine starke und kampffähige Bundeswehr zur Verteidigung unseres Landes.
Aber zugleich müssen Sie als Außenminister dafür sorgen, dass Deutsc…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 25. Birgit Bessin (AfD) — ID213403300

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Solidaritätsveranstaltung für Linksterroristen — die Bessin nutzt die Formulierung selbst ('das Bundesfamilienministerium eine Solidaritätsveranstaltung für Linksterroristen mit Steuergeld gefördert hat'), daher ist das NICHT ein eingeführtes wertendes Wort, sondern direkte Rede-Inhalts-Wiedergabe`
  - Begründung: Die Wertung 'Linksterroristen' und 'Terroristen' stammt direkt vom Sprecher; allerdings ist die Behauptung, dass das Familienministerium bewusst 'Linksterroristen' gefördert habe, eine ernsthafte Unterstellung ohne evidenzielle Belege in diesem Text — ich habe diese aber nicht 'editorialisiert' sondern als Bessin-Position mit Distanz wiedergegeben.

**v1-Summary (alt):**
> Birgit Bessin (AfD) wirft dem Bundesfamilienministerium vor, mit Steuergeldern eine Solidaritätsveranstaltung für Linksterroristen gefördert zu haben — konkret die „Alternative Orientierungstage Jena" mit Lesung „Liebe Grüße in den Knast", wo sich vermeintliche Hammerbande-Mitglieder treffen konnten. Sie fordert sarkastisch: nachdem der Kanzler erklärt habe, „links wäre vorbei", müsse das Programm „Demokratie leben!" transparenter werden oder abgeschafft werden; mindestens sollten alle Programme überprüft und Terroristen-Finanzierung unterbunden werden — Frame einer Regierungs-Doppelmoral.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Birgit Bessin (AfD) attackiert das Bundesfamilienministerium: Dieses habe mit Steuergeld eine 'Solidaritätsveranstaltung für Linksterroristen' der 'Hammerbande' gefördert ('Alternative Orientierungstage Jena' mit Lesung 'Liebe Grüße in den Knast'), bei der sich Personen trafen, denen bis zu 24 Jahren Knast droht. Sie wirft der Regierungskoalition Widerspruch vor (der Kanzler habe erklärt, 'links wäre vorbei') und fordert: Transparenzmachung des Programms 'Demokratie leben!', Überprüfung aller Programme und sofortige Streichung von Steuergeld-Zuwendungen an 'Terroristen und Radikale'.

**Original-Auszug (Mitte, ~600 chars):**
```
…ten mit Steuergeld gefördert hat, und zwar unter dem Titel „Alternative Orientierungstage Jena“ mit einer Lesung mit dem Titel „Liebe Grüße in den Knast“, bei der sich vermeintliche Linksterroristen der Hammerbande getroffen haben und bei der es darum ging, dass man mit Personen sympathisiert, denen bis zu 24 Jahren Knast droht.
Nun stellt sich die Frage: Meinen Sie nicht, es wäre an der Zeit, nachdem Ihr Kanzler erzählt hat, links wäre vorbei, dass das Programm „Demokratie leben!“ Ihrer Familienministerin endlich transparent gemacht wird, wenn Sie schon nicht bereit sind, es abzuschaffen? Wär…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 26. Manfred Schiller (AfD) — ID213409300

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `links-grüne Ideologie — der Sprecher nutzt diese Phrase wörtlich`, `Klimaapokalyptiker und -fanatiker — wörtlich vom Sprecher`, `abgehobene Politikerkaste — wörtlich vom Sprecher`
  - Begründung: Die Rede ist durchgehend polemisch und verwendet parteiische Bewertungen. Die aufgelisteten Wörter sind exakt vom Sprecher selbst verwendet, nicht von mir eingefügt — ich habe sie daher in der Summary als Sprecher-Frames behalten (Tonalität: polemisch). Potenzielle Unsicherheit: 'Politikversagen' und 'getäuschte/enttäuschte Petenten' sind vom Sprecher genutzter Frames, nicht von mir erfunden. Konfidenz bleibt hoch für die Kern-Inhalte, aber mittelhoch für die wertende Rahmen, da die gesamte Polemik vom Sprecher kommt und korrekt als solche abgebildet werden muss — nicht neutralisierbar ohne Gehalt-Verlust.

**v1-Summary (alt):**
> Manfred Schiller (AfD) analysiert den Jahresbericht des Petitionsausschusses und kritisiert mit konkreten Zahlen (19% Petitions-Rückgang, nur 4 von 9.000 Petitionen öffentlich erörtert) die Erosion des Vertrauens in das Beteiligungsinstrument. Zentral ist sein polemisches Kernbeispiel: Die Union habe 2024 als Opposition eine Kernkraft-Weiterbetriebspetition (58.000 Unterstützer) mit höchstem Votum unterstützt, blockiere dieselbe Forderung nun an der Macht wegen „links-grüner Ideologie" — ein Vorwurf der Heuchelei. Seine Abschlussforderung: bundesweite Volksabstimmungen nach Schweizer Vorbild statt „abgehobener Politikerkaste", da „die Bürger klüger und ehrlicher sind als manch ein Kabinettsmitglied" und direkte Demokratie die „Antwort auf das Politikversagen der linken Parteien wie CDU und CSU" sei.

**v2.1-Summary (neu):**
> Manfred Schiller (AfD) analysiert den Rückgang der beim Bundestag eingereichten Petitionen (−19% gegenüber Vorjahr, Mitzeichnungen −50%) als Ausdruck erodierenden Vertrauens in die Wirksamkeit des Instruments und kritisiert die Regierungskoalition für mangelnde Transparenz (nur 4 öffentliche Sitzungen bei über 9.000 Petitionen). Zentrale Anklage: die 2024 eingereichte Kernkraft-Petition mit 58.000 Unterstützern — die CDU/CSU habe sie damals in der Opposition befürwortet, setze sich in der Koalition aber „in keinster Weise mehr" dafür ein, was „getäuschte und enttäuschte Petenten" hinterlasse. Er kontrastiert dies mit dem Schweizer Referendum in Zürich (Ablehnung des Energiegesetzes) und fordert bundesweite Volksabstimmungen nach Schweizer Vorbild als „Antwort auf das Politikversagen der linken Parteien wie CDU und CSU" — die AfD stelle sich als einzige Partei für direkte Demokratie gegen Politikmüdigkeit und Resignation.

**Original-Auszug (Mitte, ~600 chars):**
```
…en Votum versehen: zur Berücksichtigung an die Bundesregierung. Und das war’s dann auch. Dann kam die CDU/CSU wieder an die Regierung; die über 58 000 Petenten schöpften Hoffnung. Und was folgte? Nichts.
In der neuen Koalition setzt sich die Union in keinster Weise mehr für die Kernkraft ein. Im Gegenteil: 58 000 getäuschte und enttäuschte Petenten bleiben. Aber diese Spielchen sind wir von der Union ja inzwischen gewohnt.
Entgegen dieser starken Willensäußerung unserer Bürger lässt sich die CDU/CSU am Gängelband einer links-grünen Ideologie führen und vorführen. Aus rein ideologischen Gründen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 27. Jeanne Dillschneider (BÜNDNIS 90/DIE GRÜNEN) — ID213506600

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `rechtsextremistischen`
  - Begründung: Der Sprecher nutzt 'gesichert rechtsextremistischen Partei' wörtlich am Schluss — diese Charakterisierung ist vom Sprecher, nicht von mir. In der Summary nutze ich 'rechtsextremistischen' im Kontext des direkten Zitats, daher Konfidenz mittel, nicht hoch, da 'rechtsextrem' als Wertung gelesen werden könnte, obwohl sie hier direkt vom Sprecher kommt.

**v1-Summary (alt):**
> Jeanne Dillschneider (Bündnis 90/Die Grünen) lehnt den AfD-Antrag zur Chatkontrolle als substanzlose „schlechte Kopie" ab und wirft der AfD massive Heuchelei vor: Sie predige Bürgerrechte, negiere diese aber faktisch für Migranten, queere Menschen und Frauen; während sie „totalitäre Strukturen" kritisiere, unterhalte sie enge Verbindungen zu Putin/China. Sie warnt die CDU/CSU vor Brandmauer-Aufweichung und argumentiert, schlechte Umfragewerte bekämpfe man durch gute Politik, nicht durch Zusammenarbeit mit einer „gesichert rechtsextremistischen Partei".

**v2.1-Summary (neu):**
> Jeanne Dillschneider (Grüne) kontert den AfD-Antrag zur Chatkontrolle als inhaltlose Kopie des Grünen-/Linken-Antrags und attackiert die AfD systematisch: Sie wirft ihr vor, bei Grundrechten doppelzüchsig zu sein ('nur für Menschen, die Ihren Vorstellungen entsprechen'), Queere zu hetzen, Geflüchtete zu diskriminieren und über ihre Büro-Mitarbeiter mit Russland/China verbunden zu sein. Ihr abschließender Appell an die CDU/CSU warnt explizit: Schlechte Umfragewerte bekämpft man mit guter Politik, nicht durch Brandmauer-Abbau und Zusammenarbeit mit einer 'gesichert rechtsextremistischen Partei'.

**Original-Auszug (Mitte, ~600 chars):**
```
…üssen.
Ihre Reden gliedern sich in drei Kategorien: Hetze gegen Migrantinnen und Migranten, völlig am Thema vorbei oder der Versuch, das lästige Image als rechtsextremistische Partei abzulegen. Sie wollen angeblich so dringend Bürgerrechte und Freiheit schützen.
Aber Grundrechte haben bei Ihnen nur die Menschen, die Ihren Vorstellungen entsprechen.
Erst gestern haben Sie bei der Debatte über die Bundeswehrmandate gegen queere Soldatinnen und Soldaten gehetzt. Warum wollen Sie Gleichstellungspolitik beenden? Warum wollen Sie Frauen in ihre traditionelle Rolle zurückdrängen?
Warum schützen Sie n…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 28. Tobias Ebenberger (AfD) — ID213602300

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `autoritäre Kontrollmechanismen`
  - Begründung: Das Wort 'autoritär' ist eine bewertende Charakterisierung, die der Sprecher nicht wörtlich nutzt (er sagt 'Sozialkreditsystem' und 'Zwang', aber nicht 'autoritär'). Die Summary könnte statt 'Kontinuität bei autoritären Kontrollmechanismen' neutral sagen: 'Kontinuität einer staatlichen Kontrolllogik' oder 'Parallelen zwischen Corona-Impfpflicht und EUDI-Wallet-Zwang'. Da die Rede aber von erheblicher polemischer Kraft ist und der Sprecher selbst das Framing mit Sozialkreditsystem sehr scharf einrahmt, liegt die Konfidenz-Grenze hier bei 'mittel' — nicht zu niedrig, weil die Essenz der Polemik richtig erfasst ist.

**v1-Summary (alt):**
> Tobias Ebenberger (AfD) konfrontiert Dr. Wildberger mit einer polemischen Frage zur EUDI-Wallet: Er vergleicht die geplante digitale Identität als potenzielle Grundlage für ein Sozialkreditsystem und wirft der CDU Heuchelei vor — noch vor vier Jahren habe Ministerpräsident Tobias Hans Ungeimpfte aus dem „gesellschaftlichen Leben" ausgesperrt, was zunächst als „freiwillig" dargestellt, dann zur Impfpflicht wurde. Nach diesem Muster könnte die heute angeblich freiwillige EUDI-Wallet morgen zu indirektem oder direktem Zwang (Rabatte, Behördengänge, Arbeitsplatz) führen; Ebenberger fordert eine bindende Garantie gegen solche Zwangsmaßnahmen — auch nach Wildbergers Amtszeit.

**v2.1-Summary (neu):**
> Tobias Ebenberger (AfD) zitiert in einer Zwischenfrage den ehemaligen CDU-Ministerpräsidenten Tobias Hans ('Ihr seid jetzt raus aus dem gesellschaftlichen Leben') und parallelisiert die Corona-Impfpflicht mit der geplanten EUDI-Wallet: Beide seien als 'freiwillig' dargestellt worden, faktisch aber mit staatlichem Zwang verknüpft. Er fordert vom angesprochenen Minister bindende Garantien, dass die digitale Brieftasche nicht indirekt erzwungen wird — weder durch Supermarkt-Rabatte noch Behördenwege noch am Arbeitsplatz — und wirft damit der CDU Kontinuität bei autoritären Kontrollmechanismen vor.

**Original-Auszug (Mitte, ~600 chars):**
```
…ident des Saarlands, sagte – Zitat –: „Es ist wichtig, den Ungeimpften eine klare Botschaft zu senden: Ihr seid jetzt raus aus dem gesellschaftlichen Leben.“
Und nun sollen mit Ihrer Modernisierungsagenda Bürger digitale Identitäten und Brieftaschen erhalten, die EUDI-Wallet, eine Technologie, die Grundlage für ein späteres Sozialkreditsystem sein könnte – laut Ihnen natürlich alles freiwillig. Weil auch die Coronaimpfung trotz eindeutiger und offensichtlicher Nötigung als freiwillig galt, bevor es schließlich sogar eine gesetzliche Impfpflicht geben sollte, frage ich Sie: Wie können Sie, Herr…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 29. Martin Reichardt (AfD) — ID213612800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Wandehalserei`
  - Begründung: Das Konzept der 'Heuchelei' / ideologischen Wendehalserei wird vom Sprecher zwar mehrfach aufgeworfen ('Wandel', 'geändert'), aber nicht mit dem Wort 'Heuchelei' selbst belegt — 'Wandehalserei' ist eine schärfer gefärbte Zusammenfassung dessen, was Reichardt meint, könnte aber als LLM-Editorialisierung kritisiert werden. Ich habe sie gelöst, indem ich die direkten Reichardt-Formeln ('kriegstreiberische Russlandhasserpartei', ideologische Wendung) verwende statt ein eigenes Wort einzubauen.

**v1-Summary (alt):**
> Martin Reichardt (AfD) wirft den Grünen in polemischem Ton vor, die letzte Rede erinnere ihn an „McCarthy-Zeiten von der Hetze her" und konfrontiert die Grünen mit dem Vorwurf der Heuchelei: Sie hätten als Pazifisten-Partei früher Russland unterstützt (Kommunismus-Ära), seien aber nach dem Zusammenbruch zur „kriegstreiberischen Russlandhasserpartei" mutiert. Reichardt fordert implizit „friedliche Bemühungen um Gespräche mit Russland" statt Konfrontation; die Rede wird mehrfach durch Zwischenfragen (Haßelmann, Präsidium) unterbrochen und endet als Gegenfrage an Mihalic.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Martin Reichardt (AfD) attackiert die vorherige Rede (vermutlich von Grünen/SPD) als 'McCarthy-artig' und wirft den Grünen Heuchelei vor: Sie hätten als Russland noch kommunistisch war 'Himmel und Hölle in Bewegung gesetzt' für Russland, seien aber nach dem Zusammenbruch der KP zur 'kriegstreiberischen Russlandhasserpartei' geworden und hetzen nun gegen AfD-Bemühungen um 'friedliche Gespräche mit Russland'. Die Rede ist stark konfrontativ und wird mehrfach vom Präsidium unterbrochen; Reichardt fordert die Grünen direkt heraus, ihre ideologische Kehrtwendung zu rechtfertigen.</zusammenfassung_2_saetze

**Original-Auszug (Mitte, ~600 chars):**
```
…mich bei der Rede und von der ganzen Diktion her an solche Zeiten erinnert gefühlt.
Das Zweite ist: Als Russland noch eine kommunistische Diktatur war, war es Ihre Partei, die Himmel und Hölle in Bewegung gesetzt hat und sich für Russland eingesetzt hat.
Seitdem das vorbei ist, seitdem Ihre kommunistischen Freunde dort vom Volk abgewählt und in die Wüste geschickt worden sind, seitdem haben Sie sich geändert!
Und jetzt stelle ich Ihnen folgende Frage: Sie tun hier so – –
– Frau Haßelmann, würden Sie mal aufhören, ständig dazwischenzuquatschen! Das ist furchtbar.
Ich möchte – –
– Darf ich noch …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 30. Ronald Gläser (AfD) — ID213618400

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Heuchelei`
  - Begründung: Das Wort 'Heuchelei' wird wörtlich vom Sprecher (Gläser) verwendet: 'dann ist das halt einfach Heuchelei und ein Lippenbekenntnis' — dies ist korrekt zitiert und markiert als Behauptung des Sprechers, nicht als Editorialposition der Summary. Ebenso 'Terrororganisation' und charakterisierung der Antifa stammen vom Sprecher. Alle anderen Werturteile ('attackiert', 'bezichtigt') sind neutrale deskriptive Verben. Konfidenz 'mittel' nur weil 'attackiert' eine leicht intensivere Färbung als 'kritisiert' hat, aber dies ist sachlich korrekt für polemisches Rede-Register.

**v1-Summary (alt):**
> Ronald Gläser (AfD) attackiert die Buchpreis-Subvention für als extremistisch eingestufte Verlage als Beweis für staatliche Unterstützung der Antifa — belegt durch Lenin-Poster, Antifa-Taschenkalender und Leitfäden zum Verfassen von Bekennerschreiben im Katalog. Er fordert Stopp der Förderung, Rückzahlung der Mittel durch die Vereine und ein Verbot der Antifa als Terrororganisation, während er konkurrierenden SPD/Grünen-Lippenbekenntnissen zur Pressefreiheit Heuchelei vorwirft. Seine Pointe: eine persönliche Anekdote über die deutsche Influencerin Naomi Seibt, die in den USA um Asyl bittet — als Zeugnis für Staatsverfolgung von Meinungsfreiheit in Deutschland.

**v2.1-Summary (neu):**
> Ronald Gläser (AfD) attackiert die Medienförderung des Deutschen Verlagspreis und bezichtigt SPD/Linke der Heuchelei bei der Verteidigung von Pressefreiheit: während sie Pluralismus fordern, würde der Staat über das Buchsubventionsprojekt die Antifa unterstützen (Lenin-Poster, Antifa-Kalender, Leitfäden zu Bekennerschreiben). Er nutzt die Anekdote der Influencerin Naomi Seibt, die in die USA um Asyl geflohen sei, wegen angeblicher Verfolgung durch deutsche Behörden. Seine Forderungen: Stopp der Förderung, Rückzahlung durch unrechtmäßig begünstigte Verlage, Verbot der Antifa als 'Terrororganisation' — charakterisiert als Arbeitsbeschaffung für 'Leute mit abgebrochenem Soziologiestudium und marxistischem Hochschulhintergrund'.

**Original-Auszug (Mitte, ~600 chars):**
```
…ken sie, und Morddrohungen der Antifa sind von den Sicherheitsbehörden nicht angemessen geahndet worden.
Damit bin ich beim Verlagspreis. Wann immer jemand aus unseren Reihen in der Vergangenheit gesagt hat: „Die Antifa wird vom Staat finanziert, sie ist in dessen Auftrag unterwegs“, dann haben Sie gesagt – je weiter links Sie stehen, mit umso mehr Leidenschaft –: Das ist doch eine rechtspopulistische Verschwörungstheorie, Desinformation. – Ich wollte, es wäre so. Aber leider haben wir es jetzt schwarz auf weiß: Die Antifa wird von diesem Staat mit diesem Buchsubventionsprojekt unterstützt. Wi…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 31. Luise Amtsberg (BÜNDNIS 90/DIE GRÜNEN) — ID213702800

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Verlogenheit`
  - Begründung: ‚Verlogenheit' wird vom Sprecher wörtlich genutzt (‚Diese Verlogenheit und diese Menschenverachtung gehören hier auch erwähnt'), ist aber ein starkes wertendes Wort. Neutral akzeptabel, da direkt vom Sprecher getroffen; bleibt aber an der Grenze zwischen fair-konfrontativ und editorialisierend.

**v1-Summary (alt):**
> Luise Amtsberg (Grüne, Präsidiumsmitglied) interviert scharf gegen die AfD-Fraktion wegen „großer Ahnungslosigkeit" in Außenpolitik: Sie verteidigt die „Women-only"-Bataillone als feministische Außenpolitik zur Unterstützung von Frauen, die sexualisierte Gewalt in Kriegskontexten erleiden, und deckt auf, dass die AfD-Behauptung, Baerbock habe Al-Sharaa 300 Mio Euro gegeben, eine „blanke Lüge" ist — das Geld ging an UN-Organisationen. Sie attackiert die Heuchelei der AfD: Sie fordere jetzt Abschiebungen nach Syrien, während ihre „frühere Fraktion mit dem alten Regime paktiert hat bis zum Gehtnichtmehr".

**v2.1-Summary (neu):**
> Luise Amtsberg (Grüne, als Vertreterin der früheren Bundesregierung) interveniert direkt gegen die AfD-Rede zur Syrien-Politik: Sie widerlegt die Behauptung, Annalena Baerbock habe Al-Sharaa 300 Millionen Euro gegeben, als „blanke Lüge" (es seien Gelder an UN und internationale Organisationen gewesen) und kritisiert die AfD scharf für Ahnungslosigkeit über sexualisierte Kriegsgewalt gegen Frauen und Hohn über „Women-only"-Bataillone. Sie prangert die Inkonsistenz an, dass die AfD jetzt Abschiebungen nach Syrien fordert, während ihre frühere Fraktion mit dem Assad-Regime kooperiert habe — „Diese Verlogenheit und Menschenverachtung" gehöre erwähnt. Ihr Frame: feministische Außenpolitik, die international geschulte Frauen zur Vertrauensbildung einsetzt.

**Original-Auszug (Mitte, ~600 chars):**
```
…eschulten Frauen, um Vertrauen aufzubauen. Das ist feministische Außenpolitik.
Das geht an alle, die sie hier infrage gestellt haben.
Dass es eine Lüge ist, Annalena Baerbock habe Al-Sharaa 300 Millionen Euro gegeben, muss man hier aufdecken. Das ist eine blanke Lüge.
Das sind Gelder, die an die Vereinten Nationen gegangen sind, an internationale Organisationen zum Wiederaufbau dieses Landes.
Wie passt eigentlich Ihr Bild vom jetzigen Syrien – Sie wollen ja jetzt alles und jeden nach Syrien abschieben, und das in der aktuellen Situation – zu dem Umstand,
dass Ihre frühere Fraktion mit dem alte…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 32. Pascal Meiser (Die Linke) — ID213709500

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Show`
  - Begründung: Das Wort 'Show' wird vom Sprecher selbst im hypothetischen 'wenn dem so ist'-Satz verwendet ('einfach nur ein bisschen Show im Wahlkampf machen'), daher ist es nicht als Editorialisierung zu klassifizieren — der Sprecher trifft die Bewertung. Zur Vorsicht mittel-klassifiziert.

**v1-Summary (alt):**
> Pascal Meiser (Linke) wirft der Union in einer Zwischenfrage zur Mietwucher-Debatte Heuchelei vor: während SPD Verschärfungen befürworte und CSU-Ministerpräsidenten (Söder, Wüst) sowie der Berliner Regierungsbürgermeister Wegner (CDU) Verbesserungen für Mieter forderten, lehne die Unions-Fraktion im Bundestag Verschärfungen ab. Er konfrontiert die Union mit der Frage, ob dies reiner Wahlkampf-Theater sei oder ob sie wirklich auf der Seite der Mieter stehe — oder doch der Immobilienlobby.

**v2.1-Summary (neu):**
> Pascal Meiser (Die Linke) führt in einer Zwischenfrage eine konfrontativ-belegende Auseinandersetzung mit der Union: er fasst deren Position zur Mietwucher-Regulation zusammen, zitiert deren Aussage, dass der Linke-Gesetzentwurf „total Sinnlos" sei, und weist dann auf die Inkonsistenz hin — CSU-Ministerpräsidenten (Söder, Wüst) und Berlins CDU-Bürgermeister Wegner fordern im Wahlkampf Mietwucher-Regulierungen, während die Union-Fraktion im Bundestag Verbesserungen blockt. Mit einer disjunktiven Endpointe („aufseiten der Mieterinnen und Mieter oder aufseiten der Immobilienlobby?") unterstellt er, die Union mache „Show im Wahlkampf" und unterwerfe sich der Immobilienlobby.

**Original-Auszug (Mitte, ~600 chars):**
```
…ion es empfiehlt. Sie als Union – so habe ich Sie jetzt gerade wieder verstanden – wollen keine Verschärfung der entsprechenden Regelungen zum Mietwucher. Können Sie noch mal klarstellen, ob das stimmt? Sie haben gerade argumentiert, wir als Linke würden hier etwas total Sinnloses fordern. Wenn dem so ist, dann frage ich Sie: Gilt das aus Ihrer Sicht auch für Herrn Söder, für Herrn Wüst und übrigens auch für Herrn Wegner in Berlin, wo ich herkomme?
Wenn Sie sagen, der Bundestag prüfe das alles jetzt anhand eigener Kriterien: Würden Sie mir dann zustimmen, dass Herr Söder, Herr Wüst, Herr Wegne…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 33. Kay Gottschalk (AfD) — ID213711800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `intransparent`
  - Begründung: Das Wort 'intransparent' steht im Original-Text ('es ist eben intransparent'), wird vom Sprecher selbst verwendet, jedoch könnte die Wiederholung im Kontext der Summary als zusätzliche eigene Bewertung wahrgenommen werden — tatsächlich ist es aber direktes Zitat des Sprechers, daher korrekt.

**v1-Summary (alt):**
> Kay Gottschalk (AfD) attackiert die SPD-geführte Regierung für die Abschaffung der Agrardieselrückerstattung — eine Mehrbelastung von 500 Millionen Euro für Landwirte — und kritisiert die CDU für ihre Heuchelei (lehnte 2022 den AfD-Gesetzentwurf ab, unterstützt jetzt Regierungs-Abschaffung). Mit konkreten Steuer-Vergleichen argumentiert er, dass die Rückerstattung kein „Märchen einer Subvention" sei, sondern notwendig für deutsche Wettbewerbsfähigkeit gegenüber Belgien (0%), Luxemburg (0%) und Frankreich (3–5 Cent) — und rahmt Landwirtschaft als deutsche Identitäts- und Heimatpflege, nicht nur Lebensmittelerzeugung.

**v2.1-Summary (neu):**
> Kay Gottschalk (AfD) attackiert die Agrardieselrückerstattungs-Abschaffung als 'Possenspiel der SPD'-Heuchelei (die auch CDU 2022 gegen AfD-Entwurf stimmte) und fordert Wiedereinführung zur Entlastung von 500 Mio Euro pro Jahr und zum Schutz von 600.000 direkten Jobs; die Rückerstattung sei Korrektur von Überbesteuerung (47 Cent in Deutschland vs. 0-5 Cent in Nachbarländern), keine Subvention, nötig für 'Level Playing Field' gegen französische/belgische Konkurrenz. Er kritisiert die Versteckung der Regelung im Cuxhaven-Omnibusgesetz als 'intransparent' und unterbreitet Alternative: 100.000 Bürgergeldbezieher in Arbeit bringen würde 3 Mrd Euro Mehreinnahmen generieren, sowie persönliches Lob für die 'Heimatpflege' der Bauern als Identitäts-Stiftung.

**Original-Auszug (Mitte, ~600 chars):**
```
…en Sie auf mit dem Märchen, dass es eine Subvention sei! Wir können über eine direkte Subvention sprechen, aber eine Rückerstattung von bereits zu viel geleisteten Steuern, meine Damen und Herren, ist aus meiner Sicht keine Subvention. Hören Sie also mit diesen merkwürdigen Etikettierungen auf!
Ohne diese Rückerstattung läge Deutschland bei der Steuer auf den Dieselpreis – wie bei allen Abgaben für fleißige Menschen – an der Spitze. Wir sind bei einer Steuer- und Abgabenbelastung von 50 Prozent hier in Deutschland. Die Bürger sind also eigentlich moderne Sklaven: Die Hälfte des Jahres arbeiten…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 34. Bastian Treuheit (AfD) — ID213806300

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Klimaschutzwahnsinn`
  - Begründung: 'Wahnsinn' ist wörtlich vom Sprecher (Klimaschutzwahnsinn), gehört also in die Summary — aber ist knapp oberhalb der streng-neutralen Grenze, deshalb mittel statt hoch.

**v1-Summary (alt):**
> Bastian Treuheit (AfD) greift Grünen-Antrag zur Kommunenstärkung als Heuchelei an: die Grünen hätten Kommunen durch Heizungsgesetz, Verbrennerverbot und Klimavorgaben (150 Mrd Euro bis 2045 für Klimaneutralität) systematisch geschwächt, und die neue Merz-Regierung setze dies mit Schuldenaufbau und Massenmigration fort. Er belegt dies mit konkreten Zahlen (Kommunen-Rekorddefizit 2024: 25 Mrd Euro, Sozialausgaben +85 Mrd Euro/Jahr, ein Drittel der Kommunen kannt Infrastruktur nicht unterhalten) und stellt drei konkrete Forderungen: Übernahme aller Kosten durch den Bund, Migrationsstopp und Wiederherstellung der kommunalen Selbstverwaltung statt grüner Zwangsverpflichtungen.

**v2.1-Summary (neu):**
> Bastian Treuheit (AfD) attackiert einen Grünen-Antrag zu Kommunalfinanzen und rahmt ihn als ideologische 'Zwangsverpflichtung' zum klimaneutralen Umbau, nicht als Entlastung. Er belastet die aktuelle Union-Regierung, die „genau da weitermacht, wo die Ampel aufgehört hat", und kontrastiert zwei Zahlen: Kommunen-Rekorddefizit 2024 von fast 25 Mrd Euro (Dreifaches des Vorjahres) mit geplanten Klimaneutralitäts-Investitionen von 150 Mrd Euro bis 2045 (5,8 Mrd jährlich), während die eigene Infrastruktur verfällt. Seine drei zentralen Forderungen: Bundeskosten-Übernahme bei Aufgabenübertragung, Migrations-Kostenbremse und Wiederherstellung kommunaler Selbstverwaltung — Leitmotiv: „Geben wir den Kommunen endlich wieder Luft zum Atmen!"

**Original-Auszug (Mitte, ~600 chars):**
```
…hrradfreundlichen Kommune – ein Projekt, das allein in meinem Wahlkreis,
dem Landkreis Fürth, Kosten von rund 100 Millionen Euro verursachen würde. Als AfD sagen wir deshalb: Es reicht!
Wir brauchen eine echte finanzielle Entlastung. Das fordern nicht nur wir. Das fordern auch die Oberbürgermeister von 13 Landeshauptstädten in einem Brandbrief an Kanzler Merz.
Die Zahlen sprechen eine klare Sprache. 2024 verzeichneten die Kommunen ein Rekorddefizit von fast 25 Milliarden Euro – das höchste seit der Wiedervereinigung, mehr als das Dreifache des Vorjahres. Die Ursachen sind klar: hohe Sozialausg…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 35. Holger Mann (SPD) — ID213913800

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamieren`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `verdammung`
  - Begründung: Mann nutzt das Wort 'gefährlich' selbst, nicht 'verdammung' — letzteres ist meine Paraphrase und enthält eine zusätzliche moralische Schärfe, die ich durch 'lehnt ab' o.ä. hätte ersetzen sollen.

**v1-Summary (alt):**
> Holger Mann (SPD) widerlegt in dieser konfrontativ-belegenden Rede detailliert die AfD-Vorwürfe gegen die Weimer Media Group und „The European": er zeigt auf, dass die AfD weniger an ordnungsgemäßer Quellenauszeichnung interessiert ist, sondern an der politischen Kontrolle kritischer Berichterstattung, und decouvert die Strategie als „Mit Dreck werfen, irgendwas wird schon hängen bleiben". Er verteidigt Pressefreiheit und öffentliche Diskurse gegen AfD-typische Anschuldigungen und Zersetzungsversuche (Diffamierung als „Feinde des Volkes", Parteitagsausschlüsse, Forderung nach Zerschlagung der ÖRR) und schließt mit der Unterscheidung: „Kritik an Medien ist legitim, Verachtung der Presse aber ist gefährlich."

**v2.1-Summary (neu):**
> Holger Mann (SPD) widerlegt in einer konfrontativen Gegenrede die AfD-Vorwürfe gegen Weimer Media Group: Während die sachliche Kritik zur fehlerhaften Quellenangabe berechtigt sei, verweist Mann auf die Urheberrechtslage (zivilrechtliche Optionen für Urheber), stellt fest, dass die Kritik sich gegen Reden und Mitteilungen richtet, die „The European" bereits seit Jahren dokumentiere — und suggeriert sarkastisch, dass nicht die Veröffentlichungsform, sondern der Inhalt der AfD-Reden störe. Er attackiert dann die AfD-Strategie direkt: »Mit der Methode ‚Mit Dreck werfen, irgendwas wird schon hängen bleiben' haben Sie Erfahrung« und verallgemeinert zu einer Verteidigung der Pressefreiheit gegen AfD-Praktiken wie das Diffamieren von Journalisten als »Feinde des Volkes«, das Zerschlagen öffentlich-rechtlicher Medien und die Verbreitung »alternativer Wahrheiten«. Sein Fazit: »Ja, Kritik an Medien ist legitim, Verachtung der Presse aber ist gefährlich.«

**Original-Auszug (Mitte, ~600 chars):**
```
…atsächlich ist er als Herausgeber nicht der Verantwortliche für die redaktionellen Beiträge. Auch da war Ihr Bild falsch. Das ist nun mal die Redaktion, und damit vor allen Dingen der Chefredakteur.
Es verstärkt sich deshalb bei uns der Eindruck: Sie suchen nach irgendeinem Hebel. Das „Mögliche“ – und da sind Worte auch manchmal verräterisch – im Titel Ihrer Aktuellen Stunde vor „Urheberrechtsverletzungen“ zeigt aus meiner Sicht, dass Sie die Debatte auf Sand bauen. Aber mit der Methode „Mit Dreck werfen, irgendwas wird schon hängen bleiben“ haben Sie Erfahrung. Das haben Sie schon letzte Woch…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 36. Ellen Demuth (CDU/CSU) — ID213914000

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `schäbige`
  - Begründung: Das Wort 'schäbige' verwendet Demuth selbst wörtlich im Text ('Herr Weimer arbeitet für die Kultur des Landes, die AfD betreibt schäbige Inszenierung') — daher ist die Aufnahme akkurat. 'Doppelmoral' wird ebenfalls wörtlich verwendet. Konfidenz = mittel, weil die Rede insgesamt sehr wertungsvoll ist, aber alle eingefügten Werturteile haben ihren Anker im Original-Wortlaut Demuths.

**v1-Summary (alt):**
> Ellen Demuth (CDU/CSU) verteidigt Staatsminister Weimer gegen den AfD-Antrag zu Urheberrechten und wirft der AfD-Fraktion Heuchelei vor: während AfD-Kreisverbände selbst wegen illegaler Bildnutzung verurteilt worden seien und ein AfD-Abgeordneter eine Unterlassungserklärung wegen manipulierter Fotos abgeben musste, erhebe die AfD jetzt „Anklage" gegen Weimer — das sei „schlicht und ergreifend Doppelmoral". Demuth würdigt Weimers KI-Avatar „Weimatar" als klare Botschaft gegen digitalen Kolonialismus durch Algorithmen und rahmt die Debatte vom Personalien-Skandal zu grundsätzlicher Kulturpolitik: „Kulturpolitik ist kein Empörungszirkus, sie ist das Fundament unserer Demokratie."

**v2.1-Summary (neu):**
> Ellen Demuth (CDU/CSU) verteidigt Staatsminister Weimer in einer konfrontativ-belegenden Gegenrede auf den AfD-Antrag: Sie wirft der AfD Hypokrisie vor — während die Partei Weimer wegen Urheberrechtsverletzungen anklagt, hätten AfD-Kreisverbände selbst Bilder ohne Zustimmung genutzt, und ein AfD-Abgeordneter habe manipulierte Fotos verbreitet. Weimers kulturpolitischer Ansatz (KI-Gestaltung statt bloße Regulierung, Schutz kreativer Arbeit vor unkontrollierter Datennutzung) stelle sich gegen die 'schäbige Inszenierung' der AfD; Kulturpolitik sei 'Fundament unserer Demokratie', kein 'Empörungszirkus'.

**Original-Auszug (Mitte, ~600 chars):**
```
…n zur Nähe zu ausländischen Netzwerken.
– Herr Frömming, wer so agiert wie Sie, der sollte beim Thema Integrität lieber schweigen.
Meine sehr geehrten Damen und Herren, Herr Weimer zeigt hingegen: Die Kulturpolitik braucht Klarheit in der digitalen Welt. Er warnt vor digitalem Kolonialismus und geistigem Vampirismus durch KI-Konzerne. Er stellt mit dem „Weimatar“ den ersten offiziellen KI-Avatar eines Ministers vor – mit der Botschaft: Wir müssen KI nicht regulieren, sondern wir müssen sie gestalten.
Kreative Arbeit darf – genau richtig – nicht zur Datenquelle für unkontrollierte Algorithmen w…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 37. Ronald Gläser (AfD) — ID213914300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `wokes`, `Stillhalteabkommen`, `schmutziger Deal`
  - Begründung: Die Worte 'wokes' und 'Stillhalteabkommen' / 'schmutziger Deal' stammen aus Gläsers eigenem Originaltext ('grüne, woke Kulturschickeria', 'Stillhalteabkommen, einen schmutzigen Deal') — sie sind nicht eingefügt, sondern zitiert/paraphrasiert. Konfidenz mittel, weil die Paraphrase leicht von der exakten Phrase abweicht, aber semantisch identisch bleibt.

**v1-Summary (alt):**
> Ronald Gläser (AfD) kritisiert in konfrontativ-polemischem Stil die Debatte über das 'Gastautorengate' bei Nius als systematische Suchmaschinen-Optimierung zur Unsichtbarmachung von Inhalten — und wirft den Grünen Heuchelei vor (Pressefreiheits-Vorwürfe, während sie selbst Journalisten ausschlossen). Sein Kernvorwurf gegen Staatsminister Weimer (CDU): Ein „schmutziger Deal" zwischen grüner „Kulturschickeria" und Regierung, bei dem Weimer anstelle der versprochenen Wende die grüne Politik der Vorgängerin Roth fortsetzt und zudem „Amigo-Politik im Endstadium" verkörpert — Wähler hätten einen Regierungswechsel gewählt, bekämen aber Kontinuität.

**v2.1-Summary (neu):**
> Ronald Gläser (AfD) attackiert die vorangehenden Redner wegen vermeintlichen 'Whataboutism' und 'billiger' Argumente gegen die AfD, kontert mit dem Vorwurf der Pressefreiheits-Heuchelei an die Grünen (B.Z.-Artikel über schlecht Pressearbeitsbedingungen bei deren Parteitag). Sein Kernthema ist eine vermeintliche SEO-Manipulation bei den Nius-Gastautorenseiten, die er als 'System' rahmt, das 'aufgeklärt' werden müsse — dabei zitiert er Vorwürfe von Rabanus, Stegner und LobbyControl. Gegen Staatsminister Weimer erhebt er den Vorwurf eines 'Stillhalteabkommens' zwischen der 'grün-woker Kulturschickeria' und der Regierung ('Ihr finanziert Antifa-Verlage und Lenin-Poster, dafür keine Rücktrittsforderungen'), wirft ihm vor, 'Totengräber der Partei' zu werden, und kritisiert scharf, dass Wähler einen Politikwechsel erwartet hätten, stattdessen bekämen sie 'Fortsetzung der Politik von Claudia Roth' und 'Amigo-Politik im Endstadium'.

**Original-Auszug (Mitte, ~600 chars):**
```
…gt: Es wäre ein Verlust, wenn Sie nicht in dieser Regierung wären. – Ich weiß nicht, ob ich mich da nicht getäuscht habe. Es gab so viele Vorschusslorbeeren, gerade aus unseren Reihen: Endlich mal ein Minister, der seinen Mitarbeitern das Gendern untersagt! Herrlich! Endlich mal ein Minister, der sich nicht von grünen Denk- und Sprechverboten beeindrucken lässt, der ausspricht, was ist:
Zwangsabgabe statt Demokratieabgabe. Auch eine herrliche Sache! Endlich mal ein Minister, der kein Parteiapparatschik ist, sondern der als Feuilletonist und später als Selfmadeverleger was auf die Beine gestell…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 38. Stephan Brandner (AfD) — ID214103400

- **v1-flagged Wort:** `skandalisiert`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `peinlicher`
  - Begründung: Das Adjektiv 'peinlich' ist eine Bewertung des Redners selbst (Zitat), aber die Verwendung in der Summary ohne explizite Distanz-Markierung könnte als eigene redaktionelle Wertung lesbar sein — daher Konfidenz auf mittel gesetzt. Neutrale Alternative wäre 'Rede vor fünf Wochen kritisiert', aber dann geht die Pointe verloren.

**v1-Summary (alt):**
> Stephan Brandner (AfD) skandalisiert die Ablehnung eines eigenen, fünf Wochen zurückliegenden AfD-Antrags zur Rentenversicherungspflicht von Abgeordneten als „peinlich" und behauptet, dass einzelne Redner (Grau, Dieren) inhaltlich mittlerweile zustimmen, die Fraktionen aber aus Privilegienschutz blockieren. Mit scharfem Sarkasmus wirft Brandner der „Einheitsfront der Altparteien" vor, ihre parlamentarischen Sonderrechte in der Altersversorgung zu schützen, und präsentiert die AfD als die Partei, die diese Forderung seit langem konsequent verficht.

**v2.1-Summary (neu):**
> Stephan Brandner (AfD) verteidigt einen AfD-Antrag zur Rentenversicherungspflicht von Abgeordneten gegen die Ablehnung durch die „geballte Einheitsfront der Altparteien" und wirft der CDU vor, „Abgeordnete seien gleicher als die anderen" und wollen ihre „Privilegien weiter genießen". Er reklamiert für die AfD inhaltliche Vorreiterschaft: zitiert zustimmende Aussagen von Grünen (Grau) und SPD (Dieren) und behauptet, die Linken folgten nun einem Weg, den die AfD schon lange gehe — die übrigen Parteien seien „davon noch ganz weit entfernt".

**Original-Auszug (Mitte, ~600 chars):**
```
…Ganze müsse doch gar nicht sein. Die CDU versteift sich auch heute wieder auf den Gedanken, Abgeordnete seien gleicher als die anderen; da müsse man schon besondere Privilegien haben. Also: Es war ein peinlicher Auftritt von Ihnen vor etwa fünf Wochen.
Im Kern haben Sie uns allerdings recht gegeben. Wenn ich mir die Debatte anschaue: Ein Herr Grau von den Grünen hat uns inhaltlich zugestimmt, ein Herr Dieren von der SPD hat gesagt, es wäre erforderlich, dass die Abgeordneten in die Rentenversicherung einzahlen. Was will ich damit sagen? Ich will damit sagen: Da, wo Sie von den Linken hinwollen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 39. Ines Schwerdtner (Die Linke) — ID214202600

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `verabschiedet (in Phrase 'hat sich verabschiedet') — Sprecher nutzt es, aber es ist grenzwertig zwischen Aussage und Wertung`, `politisch ausplündert — direkt vom Sprecher genutzt, legitim als Zitat-Integration`
  - Begründung: Die Rede ist inhärent polemisch und anklagend; die meisten Werturteile stammen vom Sprecher selbst ('Lobbyministerium', 'zutiefst respektlos', 'Wahnsinn', 'Zumutung'). Grenzbereiche: 'verabschiedet' könnte als emotionaler als faktisch gelesen werden, aber die Gesamtrede ist so empörend-anklagend, dass eine neutral-beschreibende Zusammenfassung dem Original nicht entspräche. Summary behält Tonalität durch wörtliche Zitate und Anekdotische Ankerpunkte.

**v1-Summary (alt):**
> Ines Schwerdtner (Die Linke) verdammt den Wirtschaftshaushalt als unzureichend gegen die schleichende Deindustrialisierung und attackiert Wirtschaftsministerin Katherina Reiche persönlich: Das Ministerium sei ein „Lobbyministerium" (31 Vollzeitkräfte nötig um alle Wirtschaftsgespräche aufzuzählen), Reiche habe kein echtes Krisen-Rettungskonzept, und sie agiere als Lobbyistin für Superreiche (Seefeld-Geheimtreffen mit Guttenberg/Kurz/Orbán-Politikern, Steuererleichterungen für Milliardäre). Sie rahmt den Rentenkonflikt als künstlich konstruiert — „nicht Alt gegen Jung, sondern Reich gegen Arm" — und fordert echte Industrierettung, günstige Strompreise für alle, Unterstützung für abgehängte Regionen, sowie Fahrten der Ministerin zu Bauarbeitern, Pflegekräften und Logistikern statt zu Lobbyisten.

**v2.1-Summary (neu):**
> Ines Schwerdtner (Linke) klagt die Wirtschaftspolitik von Bundesministerin Katherina Reiche als Lobbyismus ohne echten Industrierettungs-Plan an: einen Rekordhaushalt ohne Antworten auf Deindustrialisierung, zu teuer für Strompreise breiter Bevölkerung, zu wenig Dialog mit Arbeitern (stattdessen 31-Vollzeitäquivalente für Lobbyisten-Gesprächszählungen); die angebliche Seefeld-Luxusresort-Teilnahme mit Netanjahu und Orbán-Netzwerk beweise Verflochtenheit mit Milliardären. Sie kritisiert die Rente-mit-70-Debatte als künstliches 'Alt-gegen-Jung'-Framing, das von Klassenkonflikt 'Reich gegen Arm' ablenke – und fordert: Ministerium endlich in Stahlwerke/Pflege statt zu Chefetagen, Abgeordnete selbst Rentenversicherung zahlen, Merz-Fraktion Rentenpolitik-Kohärenz herstellen.

**Original-Auszug (Mitte, ~600 chars):**
```
…ie Milliardärslobby Steuererleichterungen erhalten könnte, damit Superreiche geschont werden. Vielen Dank, das ist nicht Ihr Job.
Auf eine schriftliche Frage aus meinem Büro, wie viele Gespräche Sie mit Unternehmen oder Wirtschaftsverbänden geführt haben, antwortete Ihr Ministerium, dass für die Aufzählung aller Gespräche 31 Vollzeitkräfte benötigt würden.
Was ist das für ein Wahnsinn!
Deshalb sage ich Ihnen: Ihr Ministerium sollte ein Wirtschaftsministerium sein, kein Lobbyministerium! Wer wirklich die Krise bewältigen will, der spricht nicht nur mit den Chefetagen. Fahren Sie endlich raus in…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 40. Steffen Kotré (AfD) — ID214203700

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `heucheln`
  - Begründung: Das Wort 'heucheln' kommt wörtlich vom Sprecher ('Hypermoral zu heucheln'), ist aber eine wertende Charakterisierung der Regierungs-Position — wurde mit Distanz-Markierung in der Summary aufgenommen. Alle anderen Bewertungen ('zu Recht unpopulär', 'mutwillig', 'falsch', 'dumm') werden vom Sprecher explizit getroffen. Keine hinzugefügten wertenden Wörter der Tier-A-Liste (skandalisiert, polemisiert, diffamiert, denunziert, verdammt, fabuliert, Doppelmoral [als Wort], Stimmungsmache, Abgesang) — die Rede ist authentisch polemisch, keine eigene Editorialisierung.

**v1-Summary (alt):**
> Steffen Kotré (AfD) attackiert die deutsche Klimapolitik als „falschen Sonderweg" und fordert die ersatzlose Streichung des Klima- und Transformationsfonds sowie der CO2-Steuer, da diese dem Wohlstand schaden und global isoliert sind (USA-Ausstieg aus Pariser Abkommen, China/Indien-Boykott). Zentral ist sein Plädoyer für diplomatische Neuausrichtung: Sanktionen gegen Russland hätten „hunderte Milliarden Euro" gekostet, führten in „Deindustrialisierung" und bewirkten keine Kriegsbeendigung — „nur die USA reden Diplomatie", Deutschland dagegen „sitze am Katzentisch". Die Kernpointe lautet: „Willkommen in der Realität!" als Absage an vermeintliche Heuchelei und Realitätsferne der Bundesregierung.

**v2.1-Summary (neu):**
> Steffen Kotré (AfD) lehnt den Klimahaushalt 2026 als „falschen deutschen Sonderweg" ab: Niemand auf der Welt werfe so viel Geld „zum Fenster hinaus" oder schädige seine Industrie so „mutwillig" wie die Bundesregierung; die Klimakonferenz habe gezeigt, dass CO2-Null-Ziele „zu Recht unpopulär" sind (kein Kohle-/Gas-Ausstieg bei USA, China, Indien, Inselstaaten). Er fordert die Streichung des Klima- und Transformationsfonds und der CO2-Steuer (deren Rückerstattungsversprechen nie eingelöst wurden) sowie die Aufhebung der Sanktionen gegen Russland — diese führten zu Deindustrialisierung („Hunderte Milliarden Euro verloren") und hätten zur Kriegsbeendigung beigetragen. Sein Kernframe: Statt „Hypermoral zu heucheln" braucht Deutschland Diplomatie wie die USA („Die reden mit Russland"), sonst „geht die Geschichte hinweg".

**Original-Auszug (Mitte, ~600 chars):**
```
…e nur eines bewirken, nämlich unseren Wohlstand zu verbrennen.
Das ist im Endeffekt so, wie wenn Sie das ganze Geld auf einen Haufen legen und anzünden. Daran kann man sich kurz die Hände wärmen. Das ist genau der gleiche Effekt – leider. Aber Sie tun das: Sie verbrennen unser Geld.
Wir werden auch die CO2-Steuer ersatzlos streichen. Erinnern Sie sich noch? Die damalige Ampel hat uns versprochen, dass die Bürger die Gelder aus der CO2-Steuer wieder zurückbekommen. Weder sie noch die jetzige Bundesregierung haben das umgesetzt. Das heißt: Hier werden wieder einmal Versprechen gebrochen. Aber we…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 41. Robin Jünger (AfD) — ID214208300

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `unredlich`
  - Begründung: Das Wort 'unredlich' wird vom Sprecher selbst genutzt ('Das ist unredlich, das ist vorsätzlicher Betrug am Wähler'), daher ist es korrekt in der Summary. Allerdings ist die gesamte Rede so polemisch-wertendes Sprechen (stupide, Betrug, Täuschung, Augenwischerei), dass die Grenzziehung zwischen 'vom Redner selbst genutzter Wertung' und 'zusätzliche LLM-Wertung' fließend ist. Konfidenz = mittel, weil die polemische Tonalität die Akkuratheit der Niedergabe sichert, aber das Gesamtregister mit Absicht sehr scharf ist.

**v1-Summary (alt):**
> Robin Jünger (AfD) attackiert den Haushalt für digitale Staatsmodernisierung als bloßen Platzhalter einer in Täuschung geübten Regierung: Der zentrale Vorwurf ist eine grundlegende Heuchelei — Merz vermarkte Hightech-Visionen (KI-Cluster, Digitales), ignoriere aber die Energiepolitik als zerstörerischen Engpass. Jünger zitiert dabei Nvidia-CEO Jensen Huang, der nicht von Merz, sondern vom Telekom-Chef empfangen wurde (Diagnose von fehlender politischer Autorität), und argumentiert mit internationalem Vergleich (USA und Asien hätten längst erkannt, dass Energiepolitik Hightech ermöglicht). Seine Forderung: Umkehrung der Energiewende, Rückkehr zu Kernkraft, oder zumindest ehrliche Kommunikation statt „Betrug am Wähler" — und am Schluss eine Kritik an Oppositions-Sprechverboten, die es ihm verbieten würden, das zu sagen.

**v2.1-Summary (neu):**
> Robin Jünger (AfD) kritisiert Einzelplan 24 als bloße Platzhalter-Haushaltspolitik, die keine substanziellen Digitalinvestitionen enthält: Die Kernbotschaft seines Redebeitrags ist ein polemischer Vorwurf der „Täuschungspolitik" — Bundesregierung und Vorgänger-Kabinette verheißen Hightech-Führerschaft und KI-Cluster ('Made for Germany'-Initiative als international unbedeutend), während die Energiepolitik keine Stromgrundlage dafür schafft ('der Elefant im Raum: Sie wollen Hightech, aber haben keinen Strom'). Die Jensen Huang-Anekdote (Nvidia-Chef wird von Telekom-CEO empfangen, Minister erscheinen als 'Nebendarsteller') verdichtet für Jünger das Versagen der digitalpolitischen Verantwortung; er fordert Kehrtwende in der Kernkraft-Politik und deutet die KI-Versprechen als Luftschlösser ohne Deckung — insgesamt charakterisiert er die Politik als 'vorsätzlicher Betrug am Wähler' mit Forderung zur Regelwerk-Änderung.

**Original-Auszug (Mitte, ~600 chars):**
```
…as große Versprechen formuliert, aber nicht einmal die Grundlage dafür schafft, dass diese Versprechen überhaupt erfüllbar wären. Meine Damen und Herren, der Elefant steht im Raum: Sie wollen Hightech, aber haben keinen Strom.
Damit kommen wir zur Wahrheit hinter Ihrem Haushalt: Sie feiern sich für Zukunftsvisionen, aber Sie ignorieren die Grundvoraussetzung dafür, nämlich Strom. Während in Asien und in den USA längst klar ist, dass Hightech nur dann funktioniert, wenn zuerst die Energiepolitik funktioniert – weshalb die großen Investoren ihr Kapital aus den KI-Fonds ziehen und in den Energies…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 42. Gökay Akbulut (Die Linke) — ID214305300

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `beschämend`, `beschämend`
  - Begründung: Das Wort 'beschämend' wird vom Sprecher zweimal selbst verwendet ('beschämende Doppelmoral', 'beschämend, dass deutsche Waffenexporte'); die Wiederholung in meiner Summary ist akkurat, aber ich habe geprüft, ob die Tonalität insgesamt neutral-deskriptiv bleibt — das tue ich durch Distanz-Markierungen ('behauptet', 'kritisiert') wo nötig. Die Struktur bleibt analytisch.

**v1-Summary (alt):**
> Gökay Akbulut (Die Linke) kritisiert die Außenpolitik der Bundesregierung als geprägt von „beschämender Doppelmoral" und Glaubwürdigkeitsverlust: Während Russlands Kriegsverbrechen konsequent benannt werden, schweige die Regierung zu israelischen Kriegsverbrechen in Gaza (über 100.000 Tote nach Max-Planck-Institut), türkischen Unterdrückungen und syrischen Verfolgungen — Friedrich Merz lade demonstrativ Netanjahu ein trotz ICC-Haftbefehl, und nur ein israelisches Kriegsverbrechen-Verfahren sei der Bundesregierung seit Kriegsbeginn bekannt. Sie fordert ein Ende des „Kuschelkurses mit autoritären Regimen" und kritisiert die 50%-Kürzung humanitärer Hilfe 2026 bei gleichzeitig Rekordumsätzen bei Waffenexporten; die Kürzungen beim Globalen Fonds (450 Mio Euro) würden laut Prognosen zu 12 Mio Neuerkrankungen und 650.000 Todesfällen führen.

**v2.1-Summary (neu):**
> Gökay Akbulut (Linke) kritisiert die Außenpolitik der Bundesregierung als geprägt von „beschämender Doppelmoral": während russische Kriegsverbrechen konsequent benannt würden, schweige die Regierung zu israelischen, syrischen und türkischen Kriegsverbrechen (nach Max-Planck-Institut über 100.000 Palästinenser getötet); Bundeskanzler Merz lade Netanjahu demonstrativ ein trotz ICC-Haftbefehl, feiere Erdoğan als Partner und stärke die islamistische Syrien-Regierung. Sie fordert eine Umkehr der Haushaltspriorisierung — weniger Waffenexporte (Rekordumsätze), mehr humanitäre Hilfe (aktuell 50% gekürzt) und Wiederherstellung der 450-Mio-Kürzung beim Globalen Fonds, um laut Prognose 12 Mio Neuerkrankungen und 650.000 Todesfälle zu verhindern — sowie eine neue Außenpolitik, die Völkerrecht, zivile Konfliktlösung und humanitäre Verantwortung stärkt.

**Original-Auszug (Mitte, ~600 chars):**
```
…nternationale Strafgerichtshof in Den Haag erlässt einen Haftbefehl gegen Netanjahu. Doch Friedrich Merz lädt Netanjahu demonstrativ nach Deutschland ein. Die Bundesregierung verweist auf die gute Funktionsfähigkeit der israelischen Justiz. Meine parlamentarische Anfrage hat aber ergeben, dass der Bundesregierung seit Beginn des Krieges nur ein einziger Fall bekannt ist, in dem in Israel ein Verfahren wegen Kriegsverbrechen geführt wird.
In der Türkei wird unter dem Erdoğan-Regime die gesamte Opposition unterdrückt und zerschlagen; aber Friedrich Merz feiert Erdoğan als großartigen Partner. In…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 43. Ronald Gläser (AfD) — ID214616500

- **v1-flagged Wort:** `skandalisiert`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `albernen`
  - Begründung: Das Wort 'albernen' (für die Tafeln mit Propaganda) ist eine Sprecher-Charakterisierung im Original und gehört zur Polemik; in der Summary erhalten bleiben. Andere Begriffe wie 'missbrauchen', 'aufmunitionieren' sind ebenfalls direkt vom Sprecher verwendet. Jedoch: 'Sündenstolz' ist ein AfD-Framing-Begriff, der vom Sprecher kommt, aber in die Summary nur als sein Framing aufgenommen wird, nicht als objektive Aussage — daher neutral-beschreibend behandelt.

**v1-Summary (alt):**
> Ronald Gläser (AfD) kritisiert das Gedenkstättenkonzept der Bundesregierung als konzeptionell dünn („kaum einen neuen Gedanken") und wirft ihr vor, Gedenkstätten zur Instrumentalisierung im „Kampf gegen rechts" zu missbrauchen (Beispiele: Anti-AfD-Veranstaltungen in der Topographie des Terrors, Propagandatafeln im Haus der Wannsee-Konferenz). Er skandalisiert Passagen wie „Historische Fakten dürfen keiner Umdeutung ausgesetzt werden" als „Denk- und Sprechverbote" und fordert stattdessen eine ausgewogene deutsche Geschichtsdarstellung, die positive Leistungen (Gründerjahre, technische Erfindungen, Hambacher Fest, Widerstandsbewegungen) stärker verankert — nicht nur „Sündenstolz" wie die Grünen. Die persönliche Eröffnungsanekdote (Stadtrundgang Prenzlauer Berg vor 20 Jahren, vergessene NKWD-Folterkeller) rahmt den Appell zu bewusster Geschichtserhaltung.

**v2.1-Summary (neu):**
> Ronald Gläser (AfD) kritisiert das Gedenkstättenkonzept der Bundesregierung als inhaltlich unbewegend und wirft vor, dass Gedenkstätten als Instrument im „Kampf gegen rechts" missbraucht und „aufmunitioniert" werden — Beispiele sind Anti-AfD-Veranstaltungen in der Topographie des Terrors und Propaganda-Tafeln im Haus der Wannsee-Konferenz; besonders kritisiert er den Satz über historische Fakten als „Denk- und Sprechverbote". Er fordert eine ausgewogenere Geschichtsdarstellung, die positive Aspekte des Kaiserreichs (technologische Innovationen, Hambacher Fest, Paulskirche) stärker einbezieht, statt sich auf „Sündenstolz" zu konzentrieren — ein Gegenpol zur Kritik am grünen Antrag, der nur Negatives in der deutschen Geschichte sehe.

**Original-Auszug (Mitte, ~600 chars):**
```
…nzept auch Dinge wie dieses – ich zitiere mit Ihrer geschätzten Erlaubnis, Herr Präsident –:
„Parteien oder Organisationen, welche die demokratische Orientierung in Frage stellen, […] stellen die Fundamente unserer demokratischen Rechts- und Werteordnung zur Disposition.“
Dieser Satz ist so banal und inhaltlich wie grammatikalisch so drittklassig! Vor allem hat er nichts in so einem Konzept zu suchen.
Und er nährt in mir den Verdacht, dass Sie die Gedenkstätten für Ihren Kampf gegen rechts missbrauchen und aufmunitionieren wollen.
Wir haben es bei der Topographie des Terrors gesehen; da habe i…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 44. Lamya Kaddor (BÜNDNIS 90/DIE GRÜNEN) — ID214617500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `diffamierung`
  - Begründung: Das Wort 'diffamierung' ist meine Synthese-Interpretation der Kaddor-Kritik ('bläst auf, um abzuwerten') — Kaddor nutzt das Wort nicht wörtlich, sondern beschreibt das Verhalten. Neutraler wäre 'Pauschalisierung' oder 'Generalisierung' gewesen. Belasse ich aber, da der Vorwurf-Kontext (völkisches Bild, Remigrations-Hetze) einen prägnanten Begriff rechtfertigt.

**v1-Summary (alt):**
> Lamya Kaddor (Grüne) pariert den AfD-Antrag zu Einbürgerungsbetrug durch Frame-Dekonstruktion: Sie legt die völkische Zwei-Klassen-Logik der AfD (Abstammung vs. „Passdeutsche") und die Remigrations-Forderung ihrer Jugendorganisation offen, illustriert dann mit Sarkasmus die Folgen einer 3-Millionen-Entvölkerung (Infrastruktur-Zusammenbruch, kollabierte Sozialversicherungen) und erklärt die mehrjährige, strenge Einbürgerungsprozedur. Im Gegenschlag konfrontiert sie die AfD mit ihren eigenen Korruptionsfällen (2,35-Mio-Euro-Spende, Weidel-Strohgelder, Esser-Lebenslauf-Fälschung, Krah, Bystron) und fragt: „Wie normal Betrügereien in den Reihen der AfD sind" — deutlich machend, dass die AfD ihre Heuchelei erst intern aufarbeiten solle, bevor sie pauschal gegen Einwanderer hetzt.

**v2.1-Summary (neu):**
> Lamya Kaddor (BÜNDNIS 90/DIE GRÜNEN) widerlegt den AfD-Antrag gegen Einbürgerungs-Betrugsfälle als pauschale Diffamierung von Migranten: Sie entlarvt die zugrundeliegende Ideologie (Chrupalla-Zitat zu 'Abstammung' vs. 'Passdeutschen'), skizziert die destruktiven Folgen der AfD-Remigrationsforderung durch ein reductio-ad-absurdum-Szenario (3 Millionen Menschen entvölkert = Infrastruktur-Kollaps, höhere Rentenbeiträge, ländliche Entsiedlung) und erklärt, dass das Einbürgerungsverfahren bereits ein striktes, jahrelanges Verfahren ist (5 Jahre Aufenthalt, Deutschtest, 6-18 Monate Wartezeit). Sie kontert mit dokumentierten Betrugsfällen IN der AfD selbst (2,35-Millionen-Euro-Spende, Weidel-Strohgelder, Klaus Esser: gefälschter Lebenslauf, Krah, Bystron) — ihr Frame: Deutschland ist auf Zuwanderung angewiesen, wer das Land trägt, verdient Perspektive und Gleichberechtigung, statt pauschal gegen Migranten zu hetzen sollte die AfD ihre eigenen Reihen überprüfen.

**Original-Auszug (Mitte, ~600 chars):**
```
…affen. Nach dem Nachweis der Identität, des Aufenthalts, der Deutschkenntnisse, des Lebensunterhalts und nach einem Einbürgerungstest wartet man 6, 12, manchmal sogar 18 Monate auf einen Termin bei der Einbürgerungsbehörde. Das bewältigt man übrigens nicht ohne langen Atem.
Ich sage Ihnen: Wir alle sollten ein Interesse daran haben, Menschen, die hier längerfristig bleiben, auch auf dem Papier als vollständigen Teil unseres Gemeinwesens anzuerkennen.
Deutschland ist auf Einwanderung angewiesen: vom Kindergarten über die Pflege bis hin zum Nahverkehr. Ohne Zuwanderung stünde dieses Land still. …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 45. Karsten Hilse (AfD) — ID214701900

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `widerwärtig`
  - Begründung: Das Wort 'widerwärtig' steht im Original-Text vom Redner selbst ('Was für eine widerwärtige Heuchelei!' — Seite Originaltext), daher ist seine Verwendung in der Summary korrekt und kann ohne Distanz-Markierung stehen. Die Summary selbst vermeidet darüber hinaus eigene Werturteile — Ausdrücke wie 'radikale, menschenfeindliche' sind direktes Zitat des Redners, ebenso 'Heuchelei pur', 'Klimasekte', 'Klimawahn'. Die Tonalität 'polemisch' ist akkurat, da der Sprecher selbst durchgehend polemisch argumentiert (Norbert-Bolz-Zitat zu 'Dumme' und 'Bösartige', Nazi-/DDR-Vergleiche, Terrroristen-Referenz). Mittlere Konfidenz nur deshalb, weil die Zusammenfassung notwendigerweise durch synthetisierende Paraphrase arbeitet — aber alle Kernpolemiken bleiben sichtbar.

**v1-Summary (alt):**
> Karsten Hilse (AfD) lehnt die drei Grünen-Anträge zur Klimagerechtigkeit/CO2-Bepreisung als „Heuchelei pur" und „radikale, menschenfeindliche, linke Ideologie" ab und attackiert die Koalition mit dem Fremdzitat Norbert Bolz („Linke setzen sich aus Dummen und Bösartigen zusammen"). Sein Kern-Argument: CO2-Steuer macht das Leben teuer, nicht bezahlbar; die grüne Klimapolitik sei der „Weg in den real existierenden Sozialismus" und ein Versuch, den Menschen Freiheit zu rauben (Heizungs-, Auto-, Fleisch-, Flugreisen-Verbote). Als Beleg für „widerwärtige Heuchelei" zitiert er die COP-Konferenz in Brasilien: 50.000 Anreisende und gecharterte Luxuskreuzfahrtschiffe hätten 200.000 Tonnen CO2 emittiert, so viel wie eine 30.000-Einwohner-Stadt im ganzen Jahr. Gegenposition: die AfD setze auf Freiheit des Menschen und Abschaffung der CO2-Steuer.

**v2.1-Summary (neu):**
> Karsten Hilse (AfD) lehnt die drei Grünen-Anträge zur CO2-Bepreisung und Klimagerechtigkeit ab und charakterisiert sie als „Heuchelei pur" und „radikale, menschenfeindliche, linke Ideologie": Er argumentiert, dass eine CO2-Steuer das Leben verteuere (nicht verbillige) und die Grünen damit entweder „dumm" oder „böse" seien (Zitat Norbert Bolz). Die AfD werde die CO2-Steuer abschaffen. Hilse kritisiert die „Klimasekte" und ihre vermeintliche „notorische Realitätsverweigerung", exemplifiziert durch die COP in Brasilien (50.000 Teilnehmer, 200.000 Tonnen CO2 durch gecharterte Kreuzfahrtschiffe). Den Kern seiner Polemik bildet die Gleichsetzung von Grüner Klimapolitik mit „real existierendem Sozialismus" und die Anklage, dass die Grünen den Menschen „Freiheit rauben" — ein Kernframe der AfD-Position gegen vermeintliche ideologische Bevormundung.

**Original-Auszug (Mitte, ~600 chars):**
```
…st. Klimakirchentage wie in Brasilien sind Beispiele für die Heuchelei der Klimasekte.
50 000 Teilnehmer reisen mit dem von Klimaapokalyptikern dämonisierten Flugzeug an. Da nicht genügend Hotelplätze zur Verfügung stehen, werden Luxuskreuzfahrtschiffe gechartert, die laut einer Studie für die COP inklusive Transport nach Belém circa 200 000 Tonnen CO2 emittierten
– wohlgemerkt: nur die Kreuzfahrtschiffe –, so viel wie eine Kleinstadt mit circa 30 000 Einwohnern im ganzen Jahr. Was für eine widerwärtige Heuchelei!
Uns sind diese CO2-Emissionen herzlich egal, weil sie am seit Hunderten Millione…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 46. Beatrix von Storch (AfD) — ID214710300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Heuchelei`
  - Begründung: Das Wort 'Heuchelei' ist wörtliches Sprecherin-Zitat aus dem Text ('Es ist Heuchelei.') und gehört zur direkten Anklage — nicht LLM-Einschub. Die übrigen Charakterisierungen ('linke woke Gutmenschen', 'neomarxistisch-postkolonialistisches Weltbild') werden aus dem Originaltext widergegeben, sind aber Sprecherin-Fremdzuschreibung (nicht ihre Selbstcharakterisierung), daher mit Distanz-Interpretation in der Summary eingebettet.

**v1-Summary (alt):**
> Beatrix von Storch (AfD) attackiert mit Statistik-Kontrasten die vermeintliche Doppelmoral von Linken, Medien und Aktivisten: während der Sudan-Konflikt 150.000 Tote und 20 Millionen Hungernde mit sich bringe, aber nur 18 Spiegel-Überschriften 2024 erhalte, bekäme Gaza 670 Überschriften — die Linke ignoriere das Leiden, weil es nicht in ihr „neomarxistisch-postkolonialistisches Weltbild" passe und die Täter „die falsche Religion und falsche Hautfarbe" hätten. Sie endet mit direkter Anklage: „Nein, ihr seid keine Humanisten. Es ist Heuchelei."

**v2.1-Summary (neu):**
> Beatrix von Storch (AfD) attackiert die politische Linke für selektive humanitäre Aufmerksamkeit: Während der Sudan 150.000 Tote und 20+ Millionen Hungernde habe, zeige sich der Westen medial und aktivistisch (Spiegel: 18 vs. 670 Artikel) und in Protestkultur komplett asymmetrisch — namentlich vermisst sie Aktivität von Greta Thunberg oder Ferat Koçak. Sie wirft der Linken vor, Leid nur als westliches Schuldthema zu politisieren; weil die Täter im Sudan Muslime seien und nicht „weiße Männer oder Juden", werde das Elend ignoriert. Schluss-Anklage: „Ihr seid keine Humanisten. Es ist Heuchelei."

**Original-Auszug (Mitte, ~600 chars):**
```
…an Aken bezeichnete die Israelis im Juli als „Hungermörder“. Dass gleichzeitig im Sudan 3,5 Millionen Kinder tatsächlich am Verhungern waren – mehr, als Gaza Einwohner hat – und 21 Millionen Menschen vom Hunger bedroht sind: dazu keine Silbe.
Die Wahrheit ist: Auch zigmillionenfaches Elend und Tod, Vergewaltigungen, Verhungern, Vertreibung, kurz: die größte humanitäre Katastrophe der Welt ist den linken, woken Gutmenschen
jenseits dieser Alibidebatte völlig egal,
wenn der Konflikt nicht in ihr neomarxistisch-postkolonialistisches Weltbild passt.
Die Täter im Sudan haben aus linker Sicht die fa…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 47. Markus Matzerath (AfD) — ID215000400

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Heuchelei`
  - Begründung: Der Sprecher nutzt das Wort 'Heuchelei' nicht wörtlich — die implizite Anklage ('Bevor ich kritisiere, an die Nase packen' + Edathy-Verweis) ist sarkatisch gemeint, aber 'Heuchelei' als Beschreibung ist eine LLM-Editorialisierung. Besser: 'wirft der Partei Doppelmoral vor' oder 'kritisiert SPD-Inkonsistenz'.

**v1-Summary (alt):**
> Markus Matzerath (AfD) nutzt eine kurze Zwischenbemerkung zum Polizeigesetz nicht zur Sachfrage, sondern als Anlass für einen Ad-hominem-Angriff gegen die SPD: Er wirft ihr Doppelmoral vor, da sie den früheren Bundestagsabgeordneten Sebastian Edathy trotz Strafverfolgung wegen Kinderpornographie noch immer als Parteimitglied führe. Die Redefigur („an die eigene Nase packen", „in den Spiegel schauen") rahmt dies als moralische Kritik; sachliche Positionen zum Bundespolizeigesetz werden nicht erhoben.

**v2.1-Summary (neu):**
> Markus Matzerath (AfD) nutzt die Debatte zum Bundespolizeigesetz für eine persönliche Attacke auf die SPD: Er wirft der Partei Heuchelei vor, indem er auf das Edathy-Skandal hinweist („Was machen Sie eigentlich mit Ihrem Kollegen Edathy, der immer noch Mitglied Ihrer Partei ist?") und rahmt dies als Aufforderung zur Selbstkritik („Immer erst mal in den Spiegel schauen"). Fachliche Positionen zum Polizeigesetz selbst trägt er nicht vor.

**Original-Auszug (Mitte, ~600 chars):**
```
Danke schön. – Schauen Sie mal! Meine Eltern sagten immer: Bevor ich jemanden kritisiere, sollte ich mir an die eigene Nase packen.
Ich habe gestern hier gesessen wegen der Chatkontrollen und mir die Frage gestellt: Was machen Sie eigentlich mit Ihrem Kollegen Edathy, der immer noch Mitglied Ihrer Partei ist? – Ja, Sie zucken nur mit der Schulter. Aber was machen Sie mit dem? Das stelle ich mal in den Raum.
Also von daher: Immer erst mal in den Spiegel schauen und selber an die Nase packen.
Danke schön.
Für die SPD-Fraktion darf ich Sonja Eichwede das Wort erteilen.
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 48. Helge Limburg (BÜNDNIS 90/DIE GRÜNEN) — ID215002000

- **v1-flagged Wort:** `diffamiere`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `verfassungsfeindlich`
  - Begründung: Das Wort 'verfassungsfeindlich' wird vom Redner explizit verwendet ('noch verfassungsfeindlicher als der Vorgänger'), ist aber eine Charakterisierung der AfD-Jugendorganisation, nicht des Redners eigenes Urteil als journalistischer Distanz — es wird von ihm als Beobachter-Aussage ('von allen Beobachtern durchgängig ... beschrieben') attributiert. In einer neutraleren Fassung würde man schreiben 'die Redner charakterisiert als verfassungsfeindlich' oder 'benennt als verfassungsfeindlich', was aber länglicher ist. Die Summary nutzt das Wort so, wie der Redner es nutzt (als Charakterisierung in indirekter Rede). Konfidenz bleibt 'mittel', weil die Grenze zwischen Redner-Verwendung und Summary-Übernahme hier dünn ist.

**v1-Summary (alt):**
> Helge Limburg (Bündnis 90/Die Grünen) konfrontiert die AfD scharf: deren Antrag diffamiere Nichtregierungsorganisationen, die zentral für Demokratie und Zivilgesellschaft seien — von Umweltschutz über Gedenkstättenarbeit bis Jugendbegegnungen. Gegen die Verächtlichmachung durch Anführungszeichen argumentiert Limburg mit Böckenförde-Diktum und Erfolgsbeispielen kritischer Klagen (Umwelthilfe): staatliche NGO-Förderung sei rechtsstaatlich geboten. Sein Schluss ist eine direkte Konfrontation: Die AfD selbst — mit verfassungsfeindlichen Vorfeldorganisationen und Moskauer Geldgebern — bekämpfe die Demokratie und müsse verboten werden (Artikel 21-Verfahren). Sein Leitmotiv: „Wer die Demokratie stützt, der muss unterstützt werden. Wer die Demokratie bekämpft, der muss verboten werden."

**v2.1-Summary (neu):**
> Helge Limburg (Grüne) konfrontiert die AfD direkt mit deren NGO-kritischem Antrag und verteidigt Nichtregierungsorganisationen als unverzichtbare Säule der Demokratie: Sie leisten einen unschätzbaren Beitrag in nahezu allen Gesellschaftsbereichen (Umwelt, Erinnerungskultur, Bildung, Denkmalschutz, Sport etc.) und dienen als wichtiger Kontrollmechanismus durch kritische Prüfung von staatlichem Handeln — auch durch Klagen, die nur bei tatsächlichen Rechtsbrüchen Erfolg haben. Limburg argumentiert mit dem Böckenförde-Diktum für staatliche NGO-Förderung als Ausdruck der Staatsverantwortung und schließt mit einem scharfen Politisierungsaufruf: Die Bundesregierung sollte ein Parteiverbotsverfahren gegen die AfD (gemäß Art. 21 GG) ernsthaft prüfen, da die AfD selbst und ihre Vorfeldorganisationen, insbesondere die neue Jugendorganisation, verfassungsfeindlich seien und mit ausländischen (Moskauer) Geldgebern zusammenarbeiteten. Sein Schlusssatz: „Wer die Demokratie stützt, muss unterstützt werden. Wer die Demokratie bekämpft, muss verboten werden."

**Original-Auszug (Mitte, ~600 chars):**
```
…eitere Kontrollinstanz im demokratischen Diskurs.
Damit sich diese Nichtregierungsorganisationen unabhängig entwickeln können und nicht etwa von Geldgebern und Sponsoren oder, wie offenbar Teile der AfD, ausländischen Geldgebern aus Moskau abhängig sind,
ist es gerade richtig, dass es im Rahmen eng begrenzter Förderrichtlinien und Fördermaßnahmen auch staatliche finanzielle Förderung für Projekte gibt.
Das mag zu komplex sein für Ihre simple Denkweise, ist aber Ausfluss der Selbsterkenntnis, dass der Staat eben nicht alles gewährleisten kann und gewährleisten soll, was wir in unserer Gesellsch…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 49. Clara Bünger (Die Linke) — ID215002200

- **v1-flagged Wort:** `diffamiere`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Heuchelei`
  - Begründung: Das Wort 'Heuchelei' wird von der Sprecherin nicht direkt verwendet; sie spricht von 'sich als Aufklärer inszenieren' und dem Kontrast zwischen Vorwürfen und eigenem Verhalten. 'Heuchelei' ist eine Interpretation des Sprecher-Vorwurfs, nicht die Sprecher-Sprache selbst — ersetzt durch 'Widerspruch zwischen Vorwürfen und eigenem Verhalten' oder 'Doppelmoral' — aber 'Doppelmoral' ist ebenfalls in der Tier-A-Liste. Neuformulierung: 'während die AfD Organisationen für kleine Zuwendungen diffamiert, gibt sie selbst Zehntausende Euro für Reisen aus' ist neutral beschreibend.

**v1-Summary (alt):**
> Clara Bünger (Die Linke) verweigert dem AfD-Antrag zu NGO-Untersuchungen jede Legitimation und entlarvt ihn als „Angriff auf den Rechtsstaat" statt Transparenz-Initiative: Die AfD diffamiere NGOs wie „Omas gegen Rechts" mit „bewussten Desinformationen", während sie selbst massiv Steuergelder vergeudet (NYC-Trips mit Zehntausenden Euro), und die Union verstärke diese Strategie mit ihrer Februar-2025-Kleine-Anfrage (551 Fragen als „Generalverdacht"). Büngers Fazit ist eine Struktur-Analyse: AfD und Union verfolgten eine „unheilvolle Arbeitsteilung" — die einen diffamieren NGOs, die anderen entziehen ihnen Mittel — mit dem Ziel, die „Zivilgesellschaft ihre Widerstandskraft gegen den autoritären Umbau" verlieren zu lassen; Bünger kontert mit Wahlaufruf zur Verteidigung dieser demokratischen Institutionen.

**v2.1-Summary (neu):**
> Clara Bünger (Die Linke) lehnt den AfD-Antrag für einen Untersuchungsausschuss gegen NGOs als «Angriff und gezielte Kampagne aus Desinformation und Diffamierung» ab und verweist auf die Heuchelei: während AfD-Funktionäre Zehntausende Euro für Reisen nach New York ausgeben, diffamieren sie Organisationen wie «Omas gegen Rechts» für 5.000-Euro-Zuwendungen über drei Jahre. Sie kritisiert scharf die Union für eine Kleine Anfrage mit 551 Fragen (Februar 2025), die NGOs unter «Generalverdacht» stellt, und prangert eine «unheilvolle Arbeitsteilung» an: AfD diffamiert NGOs, Union und Regierung entziehen ihnen finanzielle Mittel — Ziel sei eine Gesellschaft ohne «Widerstandskraft gegen den autoritären Umbau». NGOs seien kein Luxus, sondern verhindern «Hunger, Flucht oder Tod».

**Original-Auszug (Mitte, ~600 chars):**
```
…verteidigen.
Und: Dieser Angriff der AfD auf Nichtregierungsorganisationen ist kein Zufall.
Was dahintersteht, würden Sie von der AfD niemals offen zugeben; denn es entspringt vor allem einem Gefühl: Angst. Sie haben Angst vor einer selbstbewussten, kritischen und solidarischen Zivilgesellschaft.
Sie haben Angst vor Menschen, die sich organisieren, die Ihnen widersprechen, die sich einmischen und Ihrer Politik etwas entgegensetzen.
Denn Sie wissen genau: Diese Menschen sind das Bollwerk zwischen Ihnen und dem ungehinderten Zugriff auf die Macht.
Wenn wir hier von Nichtregierungsorganisationen …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 50. Stephan Brandner (AfD) — ID215002600

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `hypocrisy_framebusting (impliziert moralische Bewertung, aber Brandner benutzt diese exakte Wortung nicht — er sagt 'Heuchelei' durch sarkastische Konstruktion)`
  - Begründung: Die Wallstein-Konfrontation zur X-Nutzung ist direkte Ad-hominem-Rhetorik, nicht Sachkritik; die Polemik zur Reisetätigkeit ist klar vom Sprecher gemeint, nicht von mir eingefügt — daher Konfidenz 'mittel' (eine Grenze zwischen wörtlicher Polemik und meiner Wertungs-Einfügung liegt bei der Phrase 'Heuchelei', die ich synthetisierend zufügte)

**v1-Summary (alt):**
> Stephan Brandner (AfD) antwortet in einer pointierten Zwischenfrage auf Oppositions-Redebeiträge und wirft der Koalition Heuchelei vor: Sie würden sich „mit Händen und Füßen" gegen einen Untersuchungsausschuss wehren, obwohl die AfD seit Jahren eine Einschränkung des Reisekontingents fordere. Mit Sarkasmus attackiert Brandner, dass die Koalition ihr „schlechtes Gewissen" durch „komische Abgaben an zentralafrikanische Staaten" kompensiere — statt Dienstreisen wirklich zu reduzieren. Zuspitz ist die persönliche Attacke auf Wallstein (@Krawallstein), der er einen Doppelstandard vorwirft: Sie kritisiere Elon Musk und die Plattform X, nutze sie aber selbst intensiv.

**v2.1-Summary (neu):**
> Stephan Brandner (AfD) interveniert in einer Zwischenfrage zu einem Untersuchungsausschuss-Antrag und attackiert die Opposition (besonders Abgeordnete Wallstein) für Heuchelei: Sie wehre sich „mit Händen und Füßen" gegen den Ausschuss, obwohl die AfD seit Jahren eine „massive Einschränkung des Reisekontingents" fordere; zugleich kritisiert er sarkastisch, dass Abgeordnete ihre Reisetätigkeit durch „komische Abgaben an zentralafrikanische Staaten, die dafür Kochtöpfe kaufen" kompensierten. Abschließend konfrontiert er Wallstein direkt: Sie trete unter „@Krawallstein" auf X (Elon Musk) auf — einer Plattform, die sie offenbar „gar nicht leiden" könne.

**Original-Auszug (Mitte, ~600 chars):**
```
…und sich das schlechte Gewissen für die – –
– Das kann ich Ihnen leider nicht zeigen, weil das ja vertraulich ist; aber wir können da gerne gemeinsam schauen.
Ja, und dass wir natürlich auch den Unsinn abstellen wollen, dass Sie das schlechte Gewissen, das Sie alle durch massive Reisetätigkeiten haben
– Herr Wiese! –, das schlechte Gewissen, das Sie alle durch Ihre Reisetätigkeit offenbar selbst haben, dann kompensieren durch irgendwelche komischen Abgaben an zentralafrikanische Staaten, die dafür Kochtöpfe kaufen.
Und Sie haben gerade angedeutet irgendeinen düsteren – –
– Bitte, Frau Bünger? …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 51. Annika Klose (SPD) — ID215300600

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `spaltet`, `zerstört`
  - Begründung: Die Verben 'spaltet' und 'zerstört' sind vom Sprecher selbst verwendet ('Sie spaltet unsere Gesellschaft, zerstört Vertrauen'), daher ist ihre Aufnahme in die Summary korrekt — aber die Konfidenz wird auf 'mittel' gesetzt, da die evaluative Färbung dieser Verben im Kontext der Gesamtrede eng mit der Sprecher-Perspektive verflochten ist und eine vollständig neutrale Paraphrase schwer möglich ist ohne Sinnverlust.

**v1-Summary (alt):**
> Annika Klose (SPD) verteidigt das Bürgergeld-Gesetz gegen faktenferne Kritik und stilisiert die Debatte als „bewusste politische Stimmungsmache", die Gesellschaft spalte und Vertrauen zerstöre. Sie untermauert mit Studien und Zahlen (60% mit Gesundheitsproblemen, 500.000 Alleinerziehende, fast 2 Millionen Kinder betroffen), dass Missbrauchsfälle „absolute Einzelfälle" sind und stattdessen Steuerhinterziehung „deutlich größeren Schaden" verursache; ihr Kern-Argument: nicht populistische Härte, sondern „passgenaue Lösungen", Weiterbildung und „echte Chancen auf Entwicklung und Teilhabe" führten zu mehr Beschäftigung — die geplanten Vollsanktionen und Leistungseinstellungen bezeichnet sie als „ziemlich populistischen Bullshit und potenziell verfassungswidrig".

**v2.1-Summary (neu):**
> Annika Klose (SPD) verteidigt das Bürgergeld emotional und fakten-basiert gegen populistische Kritik: Sie lehnt die 'faktenfreie Erzählung von angeblichem Betrug' scharf ab, zitiert Studien (über 60 % der Bürgergeldbeziehenden haben Gesundheitsprobleme, zwei Drittel keinen Abschluss, 500.000+ Alleinerziehende, fast 2 Mio. Kinder) und charakterisiert die Debatte als 'bewusste politische Stimmungsmache', die Gesellschaft spaltet. Zu den geplanten Reformen kritisiert sie die Vollsanktionen als 'populistischer Bullshit und potenziell verfassungswidrig', verteidigt aber die Kernelemente des Gesetzes (Coaching, Weiterbildung, sozialer Arbeitsmarkt) und fordert eine Weiterentwicklung durch passgenaue Chancen statt 'Vorurteile und Härte'.

**Original-Auszug (Mitte, ~600 chars):**
```
…rtschaft und in einer schwierigen außenpolitischen Lage, die uns alle besorgt, ist Zusammenhalt doch wichtiger denn je.
Ich möchte, dass wir den Menschen in unserem Land mit unserer Politik Mut machen, dass wir Hilfe und Unterstützung organisieren, wenn sie gebraucht wird. Ich glaube, es geht niemandem besser, wenn wir Menschen, die wenig haben, noch mehr wegnehmen.
Ich glaube, dass es uns allen besser geht, wenn Menschen in eine Arbeit kommen, die zu ihnen und ihren Fähigkeiten passt. Das ist schwerer, als populistische Härte um sich zu werfen, aber genau deswegen war das Bürgergeld-Gesetz ei…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 52. Marcel Emmerich (BÜNDNIS 90/DIE GRÜNEN) — ID215314900

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Stimmungsmache`
  - Begründung: ‚Stimmungsmache' ist ein bewertender Begriff, den Emmerich selbst nutzt (‚es bei der AfD vor allem Stimmungsmache gibt'), daher legitim — aber im Grenzbereich. ‚Naivität' wird von mir eingefügt und ist NICHT vom Sprecher selbst gesagt (er sagt ‚keine Ahnung', was stärker ist).

**v1-Summary (alt):**
> Marcel Emmerich (GRÜNE) befürwortet die EU-Richtlinie zum Informationsaustausch zwischen Strafverfolgungsbehörden als notwendige europäische Antwort auf organisierte Kriminalität, Terrorismus und externe Sicherheitsbedrohungen (unter Trump-Administration). Er attackiert die AfD-Position scharf als »Kleinstaaterei« und »Stimmungsmache ohne Substanz«, da Kriminelle sich nicht an Grenzen halten — und plädiert für eine europäische Sicherheitsstruktur auf Basis von Rechtsstaatlichkeit, Souveränität und gegenseitigem Vertrauen, die »grundrechtskonformen« Datenaustausch ermöglicht.

**v2.1-Summary (neu):**
> Marcel Emmerich (Grüne) plädiert für die EU-Richtlinie zum grenzüberschreitenden Informationsaustausch der Strafverfolgungsbehörden und rahmt das als Notwendigkeit: Organisierte Kriminalität sei transnational organisiert und nutze nationale Grenzen als Chancen, nicht Hindernisse; europäische Kooperation sei daher unumgänglich. Er konfrontiert direkt die AfD-Position (‚nationale Souveränität werde ausgehöhlt') und attestiert ihr Sicherheits-Naivität und ‚Stimmungsmache statt Substanz'. Die EU-Richtlinie stärke die Kooperation, sichere Verfahren und wahrte zugleich rechtsstaatliche Standards — ein richtiger Kurs in einer Zeit, in der die USA unter Trump ‚kein verlässlicher Sicherheitsverbündeter' mehr seien und europäische Souveränität gefordert sei."

**Original-Auszug (Mitte, ~600 chars):**
```
…tzen, auf einer Sanktionsliste der USA. Und das zeigt doch sehr deutlich: Wir brauchen ein starkes und handlungsfähiges Europa, das auch dem etwas entgegensetzt.
Dazu gehört eine europäische Sicherheitsstruktur, die auf Rechtsstaatlichkeit, Souveränität und Vertrauen beruht. Eine Zusammenarbeit gehört dazu, die dann auch Informationen teilt, statt sie in nationalen Silos verschwinden zu lassen.
Deswegen muss man auch noch mal darauf eingehen, was die AfD unter anderem im Ausschuss dazu sehr präzise gesagt hat. Die Vertreter der AfD haben da nämlich gesagt – man kann es in der Beschlussempfehlu…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 53. Harald Ebner (BÜNDNIS 90/DIE GRÜNEN) — ID215402300

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `rechtsextreme`
  - Begründung: Das Adjektiv 'rechtsextrem' wird von Ebner selbst direkt verwendet ('rechtsextreme Abstiegspartei'), daher ist es legitim in der Summary; allerdings liegt hier eine Fremd-Charakterisierung vor (vom Redner, nicht objektiv überprüfbar). Die Summary bleibt auf der faktischen Ebene des vom Sprecher geäußerten Urteils, nicht einer eigenen Bewertung. Andere polemische Wörter wie 'grotesk', 'schlechte Realsatire', 'Faktenignoranz', 'Doppelmoral' stammen direkt vom Redner und gehören zur wörtlichen Charakterisierung seiner Konfrontation.

**v1-Summary (alt):**
> Harald Ebner (BÜNDNIS 90/DIE GRÜNEN) widerlegt den AfD-Antrag zur Windkraft-Regulierung als Faktenignoranz und Doppelmoral: Die AfD lehne konsequent echte Naturschutzmaßnahmen ab (Neonicotinoide, Glyphosat, Rettet-die-Bienen-Gesetz), fordere nur beim Wolf „Schießen" und ignoriere beim Verkehr (1,8 Mio Hektar) und Braunkohle (3× mehr Flächenverbrauch) deutliche größere Naturzerstörung; die angeführte Zahl von 1.200 Tonnen Windkraft-Vogelschäden stehe in keinem Verhältnis zu 400.000 Tonnen Insekten-Konsum durch Waldvögel. Ebner attackiert mit Sarkasmus („Wenn der Naturschutz solche Freunde hat, dann braucht er keine Feinde mehr") und bescheinigt der AfD, als „rechtsextreme Abstiegspartei" keine Lösungen für Klimakrise und Artenschutz zu haben.

**v2.1-Summary (neu):**
> Harald Ebner (Grüne) weist in scharfer Konfrontation den AfD-Antrag zum Windkraft-Naturschutz als strategische Doppelmoral ab: Die AfD lehne Neonicotinoide- und Glyphosat-Verbote ab, klage gegen Naturschutz-Gesetze, instrumentalisiere aber Vogelschutz gegen Windkraft. Mit Zahlenkontrasten zerlegt er die zentrale Behauptung (1.200 Tonnen Insekten durch Windräder vs. 400.000 Tonnen durch Wildvögel), kritisiert die Ignoranz der AfD gegenüber größeren Flächenfressern wie Braunkohleabbau (3× mehr Fläche) und Verkehr (1,8 Mio. Hektar), und interpretiert die Rede als „schlechte Realsatire" und Hetze ohne Lösungsangebote. Schlusswort: Die AfD sei eine „rechtsextreme Abstiegspartei", die spalte statt zu lösen.

**Original-Auszug (Mitte, ~600 chars):**
```
…jenigen, die sich wirklich um den Schutz von Umwelt und Natur kümmern, werden von Ihnen noch beschimpft und bekämpft.
Die Umweltverbände leisten einen unverzichtbaren Beitrag zur Artenvielfalt. Aber Sie vergleichen ja die Unterstützung von Umweltverbänden mit Schutzgelderpressung und all diesen Dingen. Wenn der Naturschutz solche Freunde wie Sie hat, dann braucht er keine Feinde mehr.
Herr Abgeordneter, lassen Sie eine Zwischenfrage aus der Fraktion der AfD zu?
Nein, danke. – Von Doppelmoral und Faktenfreiheit zeugt ja auch, dass Sie die Erneuerbaren als Flächenfresser darstellen. Zur Kohle is…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 54. Stefan Keuter (AfD) — ID215408100

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `gescheiterte`
  - Begründung: Das Wort 'gescheiterte politische Klasse' stammt wörtlich aus dem Original-Text — der Sprecher nutzt es selbst. Die Zusammenfassung gibt es daher korrekt wieder, aber mit Distanz-Markierung ('beschreibt als') zur Klarheit, dass es eine Sprecher-Bewertung ist, nicht eine Summary-Bewertung; da ich die Phrase im Zitat-Kontext belasse, stufe ich die Konfidenz auf 'hoch'. Rückstufung auf 'mittel' erfolgt, weil die wiederholte raue Charakterisierung ('links-grüne Politik systematisch zerstört', 'Haltungsrituale') eine summarische Deutungsleistung ist — das Wort 'systematisch' ist vom Sprecher, die Verallgemeinerung auf Jahrzehnte auch, aber die Urteilskraft der Summary könnte an dieser Stelle stärker neutral-beschreibend sein ('wird kritisiert als systematisch zerstört' vs. Sprecher-direkt 'wurde ... zerstört').

**v1-Summary (alt):**
> Stefan Keuter (AfD) verdammt die 'wertegeleitete Außenpolitik' als Wunschdenken ohne strategischen Gehalt und attackiert die Vorgängerregierung mit der Anschuldigung, Deutschland durch 'links-grüne' Ideologie wirtschaftlich und strategisch zerstört zu haben — als Beweis zitiert er die abgesagte Chinareise von BAAußenminister Wadephul im Oktober 2025, der Peking nur ein Außenminister-Treffen zugestanden habe, was er als 'Machtproblem' deutet. Seine Forderung: Rückkehr zu Realpolitik, wirtschaftlicher Stärke, technologischer Unabhängigkeit und klarer Interessensdefinition — ein Wechsel, der 'nur mit der AfD' möglich sei, was dem Klassiker des Rednerendes entspricht.

**v2.1-Summary (neu):**
> Stefan Keuter (AfD) greift die wertegeleitete Außenpolitik als 'politisches Wunschdenken' an und kontrastiert sie mit Realpolitik nach dem Satz 'Staaten haben Interessen' — er führt an, dass Deutschland durch 'links-grüne Politik' der Jahrzehnte seine wirtschaftliche Grundlage, technologische Unabhängigkeit und strategische Souveränität eingebüßt habe und nun außenpolitisch 'bedeutungslos' sei (Fallstudie: Wadephul-Reise nach China Oktober 2025 kurzfristig abgesagt, da Peking nur formale Termine bestätigte). Er schließt mit der Behauptung, die AfD habe 'hervorragende Kontakte in die USA' und US-Partner bestätigten Interesse an 'einem starken Deutschland' und 'einem Partner auf Augenhöhe', den sie 'im Moment nur in der AfD' sähen — als Wahlaufruf: 'Realpolitischer Wechsel' gebe es 'nur mit uns, mit der AfD'.

**Original-Auszug (Mitte, ~600 chars):**
```
… Außenminister reiste gerade aus den USA zurück. Die Kontakte in den USA mit Rubio und Kongressvertretern sind formal nicht unwichtig, aber sie gehören zum formalen diplomatischen Protokoll und repräsentieren nicht die allerhöchste Entscheidungsebene der US-Politik wie Gespräche mit Schlüsselministerien oder dem National Security Advisor. Das ist kein diplomatisches Missverständnis. Das, meine Damen und Herren, ist ein Machtproblem.
Wer wirtschaftlich schwach ist, wird außenpolitisch ignoriert. Wer seine Industrie zerstört, verliert Verhandlungsmacht. Und wer Moral über Interessen stellt, erse…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 55. Marcel Emmerich (BÜNDNIS 90/DIE GRÜNEN) — ID215601900

- **v1-flagged Wort:** `Stimmungsmache`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `rassistische_stimmungsmache`, `hetze`
  - Begründung: Sprecher verwendet 'rassistische Stimmungsmache' und 'Hetze' selbst wörtlich als Charakterisierung AfD-Anträge; diese gehören aber in Distanz-Markierung in Summary. Das Wort 'konfrontativ_belegend' als Tonalität ist neutral, aber die Verwendung von 'attackiert' statt 'kritisiert' könnte eine eigene Intensität-Einfärbung sein — jedoch ist 'attackiert' akkurat, da Emmerich direkt zur AfD sagt 'statt hier immer nur über die sogenannte Clankriminalität zu reden und dabei rassistische Stimmungsmache zu betreiben'.

**v1-Summary (alt):**
> Marcel Emmerich (Grüne) konfrontiert die AfD mit ihrer rassistischen „Clankriminalität"-Rhetorik und fordert sie auf, statt Stimmungsmache auch ihre eigenen Verbindungen zu Rockergruppen (Hells Angels) zu adressieren. Er rahmt Organisierte Kriminalität als multi-faktorielles Sicherheitsrisiko (2,6 Mrd Euro Schaden 2024, 100 Mrd Euro Geldwäsche-Dunkelfeld, 108 OK-Verfahren mit Korruption), warnt vor russischem Missbrauch von OK-Gruppen als Proxy für Destabilisierung und fordert eine bundesweite Struktur zur Finanzkriminalitäts-Bekämpfung mit Vermögensabschöpfung.

**v2.1-Summary (neu):**
> Marcel Emmerich (Grüne) attackiert die AfD direkt für ihre rassistische Fokussierung auf „Clankriminalität" als Sicherheitsrisiko-Verengung und setzt dagegen: AfD-Stadträte hätten selbst Verbindungen zu Rockergruppen (Hells Angels), weshalb sie „vor der eigenen Haustür aufräumen" sollten, statt Hetze zu betreiben. Er legt ein faktisches Dossier vor (282 Gewaltstraftaten, 2,6 Mrd Euro Schaden 2024, ~100 Mrd Euro Geldwäsche im Dunkelfeld) und rahmt OK als geopolitisches Destabilisierungs-Werkzeug — besonders durch Russland als AfD-„Verbündete", die OK-Gruppen als Proxy nutzen. Seine Forderung: verzahnte OK-Bekämpfung mit Fokus auf Finanzkriminalität und Vermögenseinzug statt „Clankriminalität-Karikaturen".

**Original-Auszug (Mitte, ~600 chars):**
```
…Justiz und Polizei. Konkret reden wir über 108 OK-Verfahren genau in diesem Zusammenhang mit Einflussnahme bzw. Insiderhandlungen. Das zeigt: OK-Gruppen sind brutal, und sie versuchen, mächtig zu sein; denn sie machen Milliardenumsätze mit Drogen, Waffen und Menschen. All das zeigt: Organisierte Kriminalität beeinflusst unseren Lebensalltag, greift den sozialen Zusammenhalt und die öffentliche Sicherheit an. Dagegen müssen wir uns wehrhaft aufstellen.
Organisierte Kriminalität wird aber auch immer häufiger zu Infrastruktur und in Teilen auch zu einem Werkzeug, gerade in der geopolitischen Ause…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 56. Carsten Müller (CDU/CSU) — ID215612200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `widerlich`, `diskreditiert`, `Bigotterie`
  - Begründung: Müller nutzt diese Wörter selbst wörtlich im Originaltext; die Summary gibt seine eigene Wertung wieder. Jedoch könnte argumentiert werden, dass 'widerlich' und 'Bigotterie' Editorialisierung nahe kommen — sie sind aber direct quotes und gehören zur konfrontativen Rede-Integrität.

**v1-Summary (alt):**
> Carsten Müller (CDU/CSU) wendet sich in einer scharfen Konfrontations-Rede gegen den AfD-Gesetzentwurf zur Abschaffung von § 188 StGB und wirft der AfD Heuchelei vor: Während die AfD behaupte, der Qualifikationstatbestand werde von Politikern zur Einschüchterung missbraucht, sei die eigene Fraktionsvorsitzende Weidel eine der Top-Anzeigestellerinnen nach genau dieser Norm — ein Fakum, das die AfD verschweige. Seine zentrale Anklage: „vertuschen, verdrehen, verschweigen, belügen" sei das AfD-Geschäftsmodell; wer eine Regelung für falsch halte, aber selbst nutze, zeige damit „widerliche Bigotterie".

**v2.1-Summary (neu):**
> Carsten Müller (CDU/CSU) attackiert die AfD mit konfrontativer Beweisführung: Die AfD fordert die Abschaffung von § 188 StGB und kritisiert ihn als Instrument zur Einschüchterung von Kritikern — der Nachweis aber zeigt, dass AfD-Fraktionsvorsitzende Weidel selbst zu den Topanzeigestellern unter § 188 gehört. Er nennt dies „Bigotterie" und wirft der AfD vor, dass „vertuschen, verdrehen, verschweigen, belügen" ihr „Geschäftsmodell" sind; wenn die Fraktion die Regelung für falsch hält, solle sie sie einfach nicht selbst anwenden, statt das Gesetz zu ändern.

**Original-Auszug (Mitte, ~600 chars):**
```
…ik an ihrer Arbeit zu bestrafen und Kritiker einzuschüchtern, was den demokratischen Diskurs beschädigt.“
Meine Damen und Herren, mein Vorredner hat einige Namen genannt. Durch Zwischenrufe ist er darauf aufmerksam gemacht worden, dass er ganz wesentliche Namen vergessen hat; das haben wir im September letzten Jahres diskutiert. Warum verheimlichen Sie der Öffentlichkeit, dass Ihre Fraktionsvorsitzende Weidel zu den Topanzeigestellern bezogen auf § 188 gehört?
Sie verschweigen das,
weil vertuschen, verdrehen, verschweigen, belügen Ihr Geschäftsmodell ist.
Meine Damen und Herren, Sie haben es d…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 57. Carsten Müller (CDU/CSU) — ID215612200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Verkommenheit`, `Bigotterie`
  - Begründung: Diese Wörter sind wörtlich vom Sprecher Müller selbst eingeführt (exakte Zitate aus original_text); ich habe sie in der Summary bewahrt, da sie seine Charakterisierung widerspiegeln — jedoch bin ich mir bewusst, dass die Häufung dieser starken Werturteile in meiner Zusammenfassung (2 im 2-Sätze-Bereich) den Eindruck eigener Editorialisierung erwecken kann, obwohl sie vom Sprecher stammen. Die Konfidenz sinkt auf 'mittel' aus Vorsicht vor unbewusstem Emphasis-Bias bei der Synthesis.

**v1-Summary (alt):**
> Carsten Müller (CDU/CSU) lehnt den AfD-Gesetzentwurf zur Abschaffung von § 188 ab und wirft der AfD Heuchelei vor: Während Brandner & Co. argumentieren, § 188 „schüchterne Kritiker ein", praktizieren sie selbst systematisch Verächtlichmachung und Herabwürdigung als „Geschäftsmodell" — ja, ihre Fraktionsvorsitzende Weidel stellt selbst Anzeigen, obwohl sie von der Öffentlichkeit die Anzahl ihrer Anzeigen „verheimlicht" hat (offenbart von ihren Anwälten). Müllers konkreter Gegenschlag: § 188 war eine notwendige Reaktion auf den Mord an Walter Lübcke, und CDU/CSU erwägt sogar eine AUSWEITUNG des Strafrahmens, nicht dessen Abschaffung, da die Verächtlichmachung die breite Öffentlichkeit trifft — ein direkter Vorwurf der „Verkommenheit" und „Krönung der Bigotterie" gegen die AfD.

**v2.1-Summary (neu):**
> Carsten Müller (CDU/CSU) widerlegt den AfD-Gesetzentwurf zur Abschaffung von § 188 StGB durch Spiegelung der AfD-Argumentation: Die AfD kritisiert § 188 als Einschüchterungsinstrument für Kritiker, nutzt es aber selbst — Alice Weidel stelle Anzeigen und unterschlage die Anzahl, was nach der AfD-eigenen Logik 'den demokratischen Diskurs beschädigt'. Müller betont, § 188 sei Reaktion auf den Mord an Walter Lübcke, und deutet an, dass die Union eher eine AUSWEITUNG des Paragrafen überdenkt, weil die AfD 'Verächtlichmachung und Herabwürdigung zum Geschäftsmodell' macht. Mehrfach wirft er der AfD 'Verkommenheit' und 'Bigotterie' vor — Doppelstandards zwischen öffentlicher Rhetorik und eigenem Handeln.

**Original-Auszug (Mitte, ~600 chars):**
```
…en – Vergehen müssten nicht verfolgt werden. Sie machen also nichts anderes, gemessen an Ihren eigenen Maßstäben, wenn Ihre Fraktionsvorsitzende Anzeigen stellt, als Kritiker einzuschüchtern und damit den demokratischen Diskurs zu beschädigen. Das sind Ihre Maßstäbe!
Meine Antwort auf die letzte Frage: Es ist ja auch besonders bemerkenswert, dass Sie der Öffentlichkeit die Anzahl der Anzeigen verheimlicht haben. Wie ist diese Zahl überhaupt in die Öffentlichkeit gekommen? Die von Ihnen beschäftigten Rechtsanwälte haben diese Zahl offenbart. Bemerkenswert! Und das zeigt eben – darf ich Verkomme…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 58. Dr. Alexander Wolf (AfD) — ID215704500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Heuchelei`
  - Begründung: Das Wort 'Heuchelei' wird vom Sprecher selbst als direkter Vorwurf verwendet ('Heute müssen wir über Heuchelei sprechen, einmal wieder über grüne Heuchelei' und 'Der vorliegende Antrag der Grünen ist Heuchelei'), es ist also nicht vom LLM eingefügt. Allerdings: In der zusammenfassung_2_saetze nutze ich das Verb 'beschuldigt', was korrekt distanzierend ist. 'Heuchelei' als Substantiv bleibt wörtliche Reproduktion der Sprecher-Klassifikation und ist daher ok.

**v1-Summary (alt):**
> Dr. Alexander Wolf (AfD) verreißt den Grünen-Antrag zur Solidarität mit iranischen Demonstranten als „grüne Heuchelei": die Grünen hätten jahrelang Islamisten toleriert, Claudia Roth habe sich mit dem iranischen Botschafter fotografieren lassen und Hidschab getragen, während iranische Frauen bestraft wurden — das sei „Verrat an den Frauen im Iran". Er attackiert besonders Omid Nouripour (Antragsteller, ehemaliger Grünen-Vorsitzender) für seinen „Appeasement"-Kurs und dessen Blockierung von Exil-Aktivisten wie Nila Behzadi; erleichterte Visa und humanitäre Aufnahmen seien unwirksam, stattdessen brauche es „Kultur der unmissverständlichen Härte gegenüber islamistischen Mordbrennern" — die AfD rühmt sich, die Schließung des Islamischen Zentrums Hamburg 2024 durchgesetzt zu haben.

**v2.1-Summary (neu):**
> Dr. Alexander Wolf (AfD) beschuldigt die Grünen der Heuchelei im Umgang mit dem Iran: Sie hätten jahrelang Islamisten hofiert, während sie sich selbst als Verfechter von Feminismus und Toleranz darstellen; er zitiert das 'High Five' von Claudia Roth mit dem iranischen Botschafter und Nouripours 'Appeasement'-Kurs als Belege. Sein Fazit: Der vorliegende Antrag sei Realitätsverweigerung; statt erleichterte Visaverfahren brauche es eine 'Kultur der unmissverständlichen Härte gegenüber islamistischen Mordbrennern' und eine Konsequenzen-Haltung wie die 2024-Schließung des Islamischen Zentrums Hamburg, die die AfD jahrelang gefordert habe.

**Original-Auszug (Mitte, ~600 chars):**
```
… ohnehin einen derart hohen Bildungsstand und sind derart integriert, dass sie diese grünen trojanischen Pferde überhaupt nicht nötig haben.
Wir als AfD haben schon bei den Protesten von 2017 und dem Aufstand von 2019 Konsequenzen gefordert. Die Grünen hingegen haben sich nicht nur dagegen gesträubt, Handlangern des Mullah-Regimes die Einreise nach Deutschland zu verweigern, sie haben sich auch jahrelang dagegen gewandt, das IZH in Hamburg, Propagandazentrale der Mullahs, endlich dichtzumachen.
Wir von der AfD mussten das viele Jahre fordern, bis das endlich 2024 umgesetzt wurde.
Es war der vo…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 59. Enrico Komning (AfD) — ID215906800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Doppelmoral`, `Scheinheiligkeit`
  - Begründung: Beide Wörter ('Doppelmoral', 'Scheinheiligkeit') sind wörtliche Zitate des Sprechers — gehören also zur Rede. Aber das Ausmaß der Polemik (sarkastische Eröffnung, Ad-hominem-Attacks, diffamierende Charakterisierungen) ist so dicht, dass eine vollständig 'neutrale' Summary den Sprecher verfälschen würde. Konfidenz auf 'mittel' wegen der notwendigen Polemie-Treue contra vollständiger Neutralität — aber die erfassten Zitate und Frames sind alle vom Sprecher selbst.

**v1-Summary (alt):**
> Enrico Komning (AfD) attackiert das CDU/CSU- und SPD-Verlangen nach Transparenz bei AfD-Mitarbeiterverhältnissen als zynische Heuchelei und Nebelkerzen-Taktik vor Wahlen. Er kontrastiert sarkastisch mehrfach: der Vater des AfD-Spitzenkandidaten Siegmund verdiene 5.400 Euro als Diplom-Ingenieur (am unteren Ende zulässig), während Spahns Maskendeals 3,5 Milliarden Euro kosteten (54.000 Jahresgehälter Siegmunds) — und dabei nennt er systematisch CDU-/SPD-Versorgungsposten (Günther, Heil, Müntefering, Schwesig, Habeck), um seine Frame zu etablieren: „Das Glashaus, in dem Sie sitzen, zerbricht schon, ohne dass Sie Steine werfen müssen". Sein Fazit ist ein indirekter Wahlaufruf: die Regierungsfraktionen würden die Wahlen verlieren und sollten sich bereits nach freien Versorgungsposten umsehen.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Enrico Komning (AfD) attackiert die Koalitions- und Regierungsfraktionen als „Chaoskoalition" und wirft ihnen Doppelmoral vor: Sie kritisierten Mitarbeiterverhältnisse bei AfD-Funktionären (Ulrich Siegmunds Vater als Büroleiter für 5.400 Euro, Beschäftigung einer Frau mit Behinderung durch den Fraktionsvorsitzenden), während ihre eigenen Reihen voll seien von ungerechtfertigten Versorgungsposten und Nepotismus (CDU: Günther stellt Vater eines Patenkindes an, Heil stellt Trauzeuge an; SPD: Michelle Müntefering, Manuela Schwesig; Grüne: Robert Habeck-Ministerium). Die Maskendeals von Spahn hätten 3,5 Milliarden Euro gekostet — etwa 54.000-mal das Jahresgehalt von Siegmunds Vater; sein Fazit: „Der Gipfel aller Doppelmoral", die Koalition werfe aus Verzweiflung vor den Wahlen „Nebelkerzen" und jage eine „Sau durchs Dorf", während sie selbst in einem „Glashaus" säße. Wahlaufruf und Ankündigung, dass die Regierung „die Wahlen dieses Jahr verlieren" werde.

**Original-Auszug (Mitte, ~600 chars):**
```
…er Doppelmoral! Sie sollten beim Thema Steuergeld lieber schweigen.
Daniel Günther, Ihr Ministerpräsident und im Übrigen bekennender Gegner der Pressefreiheit, stellt den Vater seines Patenkindes an – ohne Ausschreibung. Hubertus Heils Trauzeuge wurde Abteilungsleiter in seinem damaligen Ministerium.
Soll ich weitermachen? Ich habe hier auf einem Zettel Informationen zur Vetternwirtschaft in anderen Parteien und Fraktionen.
Da stehen über 20 Fälle drauf, die alle Versorgungsposten betreffen.
Oder Manuela Schwesig, Ministerpräsidentin in meinem Heimatland Mecklenburg-Vorpommern, die auch für de…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 60. Dr. Konstantin von Notz (BÜNDNIS 90/DIE GRÜNEN) — ID215907300

- **v1-flagged Wort:** `Skandalisierung`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `selbstmitleidig`
  - Begründung: Das Wort 'selbstmitleidig' wird vom Sprecher selbst (von Notz) direkt im Text genutzt ('selbstmitleidiges Nebelkerzenstakkato') — es ist keine Eigeneinfügung der Summary, sondern Wiedergabe seiner Charakterisierung.

**v1-Summary (alt):**
> Dr. Konstantin von Notz (Grüne) konfrontiert CDU/CSU-Kollege König scharf mit Vorwürfen der Nepotismus-Skandalisierung (Fälle Uhr, Keuter) und wirft ihm vor, sein „selbstmitleidiges Nebelkerzenstakkato" zu betreiben, statt sich zur Selbstkritik zu bekennen. Der Schluss ist eine polarisierende Zuspitzung: König sei „vollkommen bei Trump angekommen" und unfähig zu Demut — eine Aufforderung an den Opponent, sich kritisch zu äußern statt historische Gegenfälle zu sammeln.

**v2.1-Summary (neu):**
> Dr. Konstantin von Notz (Grüne) kontert die AfD-Vorwürfe des Kollegen König (Nepotismus in Fällen Uhr und Keuter) als „selbstmitleidiges Nebelkerzenstakkato" und wirft König vor, zu historischen Fällen (Herbert Wehner 1950er) zurückgreifen zu müssen — eine Selektivität, die politische Auseinandersetzung verfälsche. Seine zentrale Forderung: ein demokratisches Minimum sei es, nicht nur andere anzuklagen, sondern auch die eigene Seite selbstkritisch zu hinterfragen — eine Fähigkeit, die er König und der AfD mit dem Trump-Vergleich abspricht.</zusammenfassung_2_saetze

**Original-Auszug (Mitte, ~600 chars):**
```
…Ihr selbstmitleidiges Nebelkerzenstakkato einmal kurz unterbricht!
Sie müssen ja in die 50er-Jahre des letzten Jahrtausends zurückgehen,
zu Herbert Wehner,
um irgendwie Fälle zu finden, die Sie nachträglich skandalisieren wollen.
Aber jetzt mal Hand aufs Herz, Herr Kollege König, als Mitglied des Deutschen Bundestages: Ist diese Geschichte um Frau Uhr, um Herrn Keuter – die Beschäftigung der eigenen Verwandtschaft – falsch oder richtig?
Sind Sie in der Lage – das ist ein interessantes Prinzip –, ein Wort der Selbstkritik zu äußern, ein Wort der Demut?
Oder sind Sie vollkommen bei Trump angekom…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 61. Nicole Höchst (AfD) — ID215908800

- **v1-flagged Wort:** `denunziere`
- **Self-Check:** konfidenz=`mittel`, count_eigene=4
  - Wörter (laut Haiku selbst): `Märchenerzählung`, `institutionelle Denunziation`, `Lüge in Dauerschleife`, `Indoktrination`
  - Begründung: Diese vier Wörter sind wörtliche oder direkte Paraphrasen aus der Sprecherin-Rhetorik; allerdings sind sie von ihr selbst gewählt und in Höchsts Redeinhalt zentral. Sie sind keine LLM-eigenen Editorialisierungen. Konfidenz ‚mittel', weil die Gesamtrhetorik hochgradig polemisch ist und eine zu neutrale Zusammenfassung die Sprecherin missrepräsentieren würde — aber die vier Wörter sind Kern ihrer Argumentation, nicht meine Interpretation.

**v1-Summary (alt):**
> Nicole Höchst (AfD) attackiert den Antrag der Linken zur schulischen Prävention von Rechtsextremismus als „gefährliche politische Märchenerzählung" und „Nebelkerzenantrag", die die AfD institutionell denunziere und die staatliche Neutralitätspflicht verletzten — ein Köln-Gerichtsurteil habe gerade bestätigt, dass die AfD nicht rechtsextrem sei. Sie kontrastiert dies mit konkreten Schulproblemen: Ludwigshafen (86,5 % Migrationshintergrund), tägliche Gewalt, Sprachdefizite, Mobbing, Lehrer unter Druck, und fordert stattdessen Sicherheit, Deutsch vor Regelunterricht, Sprachförderung und personelle Verstärkung — nicht „ideologische Umerziehungsprogramme" von oben.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Nicole Höchst (AfD) verwirft den Linke-Antrag zur Abwehr „rechter Angriffe" in Schulen als „gefährliche politische Märchenerzählung" und institutionelle Denunziation: Parteien, die nicht verboten sind, müssten als Teil des politischen Wettbewerbs behandelt werden, und Meldestrukturen gegen eine bestimmte Partei verletzten die Chancengleichheit nach Artikel 21 GG — „Politische Bildung darf nicht zur politischen Erziehung gegen einen demokratischen Mitbewerber instrumentalisiert werden". Sie stellt diesem Frame die realen Schulprobleme gegenüber: Ludwigshafen (86,5 % Migrationshintergrund, Gewalt, Sprachdefizite, Lehrermangel), Bad Kreuznach (Drogen, Amokdrohungen, Gangs), und fordert statt Ideologie-Programme Deutsch vor Regelunterricht, Sprachförderung und Sicherheit. Ihr Abschluss verweist auf ein gerade ergangenes Kölner Verwaltungsgericht-Urteil, das der AfD verbietet, als „rechtsextrem" klassifiziert zu werden.

**Original-Auszug (Mitte, ~600 chars):**
```
…er Kritik.
Und nun zu den realen Problemen vor Ort. In Ludwigshafen hat die Karolina-Burger-Realschule plus einen Migrationshintergrundanteil von 86,5 Prozent.
Die „Bild“ spricht von Deutschlands gefährlichster Schule. Zitate aus dem Schulalltag: „Halt die Fresse!“ zu Lehrern, oder: „Wenn Sie mir nicht die bessere Note geben, steche ich Ihre Autoreifen auf!“
Böller, Reizgas, Vandalismus, Kot und Urin im Keller. Eine Lehrerin sagte dem SWR: Ich sehe weinende Kollegen und Kolleginnen. Die Kräfte schwinden eklatant. Gewalt ist Alltag. Wir versuchen, die Kinder und uns zu schützen, aber es geht un…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 62. Beatrix von Storch (AfD) — ID215915100

- **v1-flagged Wort:** `skandalisiert`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `antiwestlicher_komplex`, `heuchelei`
  - Begründung: Die Begriffe 'antiwestlich' und 'Heuchelei' stammen vom Sprecher (direktes Zitat bzw. Konzept: 'Das ist alles gelogen'), aber die Zusammenfassung rahmt diese als Sprecher-Behauptung, nicht als objektive Tatsache — Distanz-Markierung durch Vorstellung der Aussage ('behauptet', 'wirft vor') erfolgt durch Kontext ausreichend, aber könnte expliziter sein. Konfidenz auf 'mittel' wegen Asymmetrie zwischen Sprecher-Polemik und Summary-Neutralität.

**v1-Summary (alt):**
> Beatrix von Storch (AfD) stellt einen Antrag zum Verbot der iranischen Revolutionsgarden und deren Anhänger mit dem Vorwurf, dass die Bundesregierung diese seit anderthalb Jahrzehnten gewähren lässt, obwohl ihre Spionage-, Proliferations- und Mord-Aktivitäten gegen Juden, Israelis und Oppositionelle dokumentiert sind (Drucksache 20/5595). Sie attackiert eine vermeintliche Kollusion von Linken, Grünen und islamistischen Akteuren als „antiwestlicher Komplex" und skandalisiert konkrete Treffen deutscher Politiker mit iranischen Vertretern (Roth-High-Five mit Botschafter Scheikh Attar, Moujani im Jüdischen Museum), um die etablierten Parteien der Heuchelei zu bezichtigen: Diese würden Bürger wegen Beleidigungen verfolgen, aber Terrororganisationen dulden — nach dem Muster Hisbollah und Blaue Moschee sagt sie voraus, der Antrag werde heute abgelehnt, in Kürze aber von der Koalition umgesetzt.

**v2.1-Summary (neu):**
> Beatrix von Storch (AfD) fordert das Verbot der iranischen Revolutionsgarden in Deutschland und die rechtsstaatliche Abschiebung ihrer Anhänger — laut Bundesregierung seien diese seit anderthalb Jahrzehnten in Ausspähung, Massenvernichtungswaffen-Beschaffung und Verfolgung Oppositioneller tätig, trotz zweifacher Behandlung im Terrorabwehrzentrum (2015–2022). Sie attackiert die Regierungen Merkel und Ampel für Untätigkeit, Annalena Baerbock für Ausreden ('wegen der EU') und zeigt ein Muster auf (Hisbollah, Blaue Moschee), wonach AfD-Anträge zuerst abgelehnt, dann doch umgesetzt werden. Kern ihrer Anklage: ein 'sehr mächtiger antiwestlicher Komplex aus Islamisten und Linken' von Teheran bis Neukölln, gegen den die etablierten Parteien angeblich 'bloß nicht' vorgehen wollen — namentliche Kritik an Koçak, Roth, Grütters, Steinmeier.

**Original-Auszug (Mitte, ~600 chars):**
```
… Terrorliste der EU. Ich sage Ihnen voraus: Sie lehnen – mutmaßlich unter Absingen schmutziger Lieder –
unseren Antrag heute trotzdem ab und werden ihn dann in Kürze doch umsetzen. Das Muster kennen wir ja.
Hisbollah: Das Verbot ging angeblich gar nicht – wegen der EU, des Libanon usw. Dann hat die AfD den Verbotsantrag gestellt.
Und Sie haben ihn alle abgelehnt. Kurze Zeit später ging es dann doch mit dem Verbot.
Oder die Blaue Moschee: Das Verbot ging natürlich gar nicht – wegen Religionsfreiheit, Respekt vor den Schiiten, unklarer Rechtslage. Dann hat die AfD den Verbotsantrag eingebracht i…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 63. Birgit Bessin (AfD) — ID216008400

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `perverser`, `miese`
  - Begründung: Bessin nutzt 'pervers' explizit selbst ('perverse ideologische Experimente'), 'miese' erscheint als ihre Charakterisierung ('miese Politik'). Frage: sind diese Wörter Wiedergabe ihrer Polemik oder meine editoriale Übernahme? Die Tonalität ist so konsistent polemisch, dass neutrale Paraphrase das Original verfälschen würde — aber zur Sicherheit konfidenz=mittel statt hoch, und beide Wörter aufgelistet.

**v1-Summary (alt):**
> Birgit Bessin (AfD) führt eine polemische Anklage gegen BÜNDNIS 90/DIE GRÜNEN: Sie werfen ihnen vor, bei der Bekämpfung von Sexualstraftaten, Kindswohlgefährdung und pädophilen Netzwerken wegzusehen, während sie gleichzeitig durch ihre Migrationspolitik, das Selbstbestimmungsgesetz und Drag-Queen-Events (Jurassica Parka, 40.000 Euro Senatsmittel) selbst Kinder gefährden würden. Bessin dokumentiert historisches Versagen der Grünen (5 Beschlüsse zur Straffreiheit, Cohn-Bendit-Fantasien), wirft ihnen Doppelmoral bei den Kentler-Netzwerken vor und fordert eine Sonderkommission zu Epstein-Files-Bezügen sowie härtere Maßnahmen gegen Zwangsverheiratung und „muslimische Patriarchatsvorstellungen" (496 Berliner Fälle 2022, 26 Ehrenmorde 2022/2023). Ihr Subtext: Grüne reden, AfD handelt.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Birgit Bessin (AfD) attackiert die Grünen in einer Debatte zu Sexualstraftaten und Kinderschutz: Sie wirft ihnen vor, die Wahrheit zu scheuen und in drei Punkten aktiv zur Gefährdung beizutragen — durch Migrationspolitik, das Selbstbestimmungsgesetz und Frühsexualisierung. Sie belegt ihre Anklage mit Beispielen (40.000 Euro Senat-Finanzierung für Drag-Queen Jurassica Parka mit Vorstrafen, 496 Zwangsverheiratungs-Fälle in Berlin 2022, historische Grünen-Beschlüsse zur Strafrecht-Abschwächung, Cohn-Bendit-Zitate), fordert eine Sonderkommission zu Epstein-Bezügen und benennt das Problem als „muslimische Patriarchatsvorstellungen". Der Ton ist massiv anklagend; das Präsidium mahnt sie mehrfach zur Redezeit und Lautstärke.

**Original-Auszug (Mitte, ~600 chars):**
```
… Damen und Herren von den Grünen, auch in Ihrer eigenen Parteigeschichte haben Sie weggesehen. Zitat:
„Es gab fünf Beschlüsse der Grünen zu Bundes- und Landtagswahlen, in denen sie eine Abschaffung der entsprechenden Strafrechtsparagrafen bezüglich sexuellen Missbrauchs forderten.“
Zitat Ende. – Dies sagte der Sozialforscher Stephan Klecha vom Göttinger Institut für Demokratieforschung.
Grünenpolitiker wie Daniel Cohn-Bendit fantasierten öffentlich über das Ausziehen durch eine Fünfjährige und bezeichneten dies in einer Talkshow als – ich zitiere – „erotisch-manisches Spiel“. Das erinnert mich…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 64. Leon Eckert (BÜNDNIS 90/DIE GRÜNEN) — ID216115600

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `Heuchelei`
  - Begründung: Das Wort 'Heuchelei' wird vom Sprecher selbst wörtlich genutzt ('Das ist Heuchelei auf dem höchsten Level'), daher ist es korrekt in der Summary. Alle anderen polemischen Formulierungen (Familienclans, Steuergeldwirtschaft) stammen auch vom Sprecher direkt.

**v1-Summary (alt):**
> Leon Eckert (Grüne) lehnt den AfD-Antrag zur Erhöhung der Unabhängigkeit des Bundesrechnungshofs als „Heuchelei" ab und enthüllt eine faktische Schwächung des BRH durch die schwarz-rote Koalition: pauschale Stellenkürzungen im Haushalt 2026, beschlossen in einer Nachtsitzung kurz vor Mitternacht. Er kritisiert die „Rasenmähermethode", die den effizienzstärksten Behörden der letzten Jahre — gerade dem BRH — Stellen streicht und damit falsche Anreize setzt, und fordert stattdessen, den Rechnungshof mit notwendigen Mitteln auszustatten.

**v2.1-Summary (neu):**
> Leon Eckert (Grüne) lehnt den AfD-Antrag zur BRH-Änderung ab und beschuldigt die AfD der Heuchelei: Sie kritisiert den Rechnungshof nur wegen der Person der aktuellen Kandidatin, nicht aus grundsätzlichen Gründen — dabei loben auch die Grünen die Arbeit des BRH, der vier Jahrzehnte lang von CDU-Präsidenten geführt wurde. Die eigentliche Kritik richtet Eckert gegen die schwarz-rote Koalition, die kurz vor Mitternacht in der Bereinigungssitzung pauschale Stellenkürzungen auch für den BRH beschloss — obwohl dieser bereits der größten Effizienzsteigerung unterlag. Er warnt vor dem fatalen Signal dieser „Rasenmähermethode": Behörden, die sich optimieren, werden bestraft; wer überflüssige Strukturen hält, kann später noch sparen. Die Grünen fordern stattdessen differenzierte Budgetierung und eine echte Stärkung des Rechnungshofs zur Kontrolle der Regierung.

**Original-Auszug (Mitte, ~600 chars):**
```
…ass die AfD-Fraktion im Bundestag eine Familienclanstruktur betreibt, um Steuergelder in eigene Taschen zu wirtschaften.
Der wirkliche Problempunkt steckt ganz woanders. Die schwarz-rote Koalition schwächt den Bundesrechnungshof an einer anderen Stelle, und zwar mit der pauschalen Stellenkürzung in der Bereinigungssitzung. In dieser langen Nachtsitzung für den Haushalt 2026 wurde kurz vor Mitternacht ein schwarz-roter Koalitionsantrag verteilt. Darin pauschale Stellenkürzungen auch für den Rechnungshof.
Geschickt gemacht; denn damit konnte im Vorfeld eben nicht öffentlich über diese Änderung d…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 65. Harald Ebner (BÜNDNIS 90/DIE GRÜNEN) — ID216208600

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `ökologischer Offenbarungseid`, `beispielloser Feldzug`, `Heuchelei`
  - Begründung: 'Offenbarungseid' und 'Feldzug' sind Ebners direkte Charakterisierung (wörtlich im Text); 'Heuchelei' wird von Ebner selbst verwendet ('stinkt zum Himmel'). Aber die Anwendung auf 'diese Koalition aus Union und SPD' ist Ebners Bewertung, nicht Faktenbehauptung — markiert korrekt als seine Position. Mittlere Konfidenz weil die Summary zwar die Polemik bewahrt (korrekt), aber deren Wucht auf Kopfebene durch Paraphrase-Verben ('kritisiert') etwas gedämpft wird — 'scharf' und 'attackiert' sind aber selbst beschreibende Tonalitäts-Marker, nicht wertig.

**v1-Summary (alt):**
> Harald Ebner (Grüne) verdammt den CDU/CSU-SPD-Jagdgesetzentwurf als „ökologischen Offenbarungseid" und „beispiellosen Feldzug gegen Lebensgrundlagen" — nicht weil Wölfe keine Probleme brächten, sondern weil die breite Jagd das Rissproblem verschärft statt löst. Stattdessen fordert er wissenschaftlich fundierte Schadwolf-Entnahmen, systematischen Herdenschutz mit Förderung und Interventionsteams, sowie Erhalt der GAK-Mittel (gegen die geplante 150-Mio-Streichung durch BMin Rainer) — und kritisiert die Regierung scharf, Leitlinien nur im Entschließungsantrag, nicht im Gesetz selbst zu verankern („Das ist wirklich putzig").

**v2.1-Summary (neu):**
> Harald Ebner (Grüne) attackiert den Jagdgesetz-Entwurf scharf als 'ökologischen Offenbarungseid' und 'beispiellosen Feldzug gegen natürliche Lebensgrundlagen' — die breite Wolfsbejagung sei wissenschaftlich unfundiert (Wolfspopulation stagniert bereits), verschärfe das Rissproblem statt zu lösen und untermine parallele Herdenschutzbemühungen. Ebner fordert stattdessen zielgerichtete Entnahme von Schadwölfen + systematische Herdenschutz-Stärkung durch Förderung, Beratung, Interventionsteams und kritisiert Minister Rainers heimliche Streichung von 150 Mio. Euro GAK-Mitteln als 'Heuchelei', die Koalitions-Forderung nach besserer GAK-Nutzung unterminiert. Schluss mit Märchen-Rhetorik ('archaische Reflexe') statt 'echte Lösungen' für Wolf-Koexistenz.

**Original-Auszug (Mitte, ~600 chars):**
```
…populationen wachsen nicht unendlich weiter.
Die deutsche Wolfspopulation stagniert, erst recht in den Gegenden, in denen die Territorien schon besetzt sind.
Ihre einzige Antwort ist die breite Bejagung des Wolfs an sich. Genau das löst das Rissproblem eben nicht, sondern verschärft es sogar. Das haben auch die Schäfer in der Anhörung letzte Woche sehr, sehr deutlich gemacht.
In unserem Entschließungsantrag schlagen wir konkrete Schritte und Maßnahmen vor, die wirklich helfen. Wir müssen die notwendige und zielgerichtete Entnahme von Schadwölfen, die Herdenschutzmaßnahmen überwinden, tatsächli…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 66. Martin Reichardt (AfD) — ID216211100

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `getarntes Hetzpapier — Sprecher nutzt dies wörtlich (O-Ton)`, `inkompetenter Obergefreiter — Sprecher nutzt dies wörtlich (O-Ton)`
  - Begründung: Die wörtlichen Angriffe ('Doppelmoral', 'getarntes Hetzpapier', 'inkompetenter Obergefreiter') sind vom Sprecher selbst formuliert und müssen als Tonalitäts-Anker erhalten bleiben; die Summary ist damit akkurat, aber die Wortwahl ist per definitionem polemisch, weil der Redner polemisch spricht. Konfidenz = mittel, weil die Summary die Polemik bewahren MUSS, um akkurat zu sein, aber ein neutraler Leser könnte dies als ‚wertend von der Summary' missverstehen — die Wertung kommt vom Sprecher, NICHT vom Summarizer.

**v1-Summary (alt):**
> Martin Reichardt (AfD) attackiert polemisch den Linken-Antrag gegen Schulbesuche von Militäroffizieren als „getarntes Hetzpapier" und wirft den Linken Doppelmoral vor: Sie hätten Heere sozialistischer Diktaturen toleriert, kritisierten aber deutsche Demokratie-Soldaten. Mit scharfer Analogie (Reinigungskraft statt Unternehmens-Direktor) attackiert er implizit Verteidigungsminister Pistorius und fordert das Verteidigungsministerium auf, Patriotismus nicht zu diskreditieren und den Traditionen der Wiedervereinigung — inklusive NVA-Offizieren — zu vertrauen.

**v2.1-Summary (neu):**
> Martin Reichardt (AfD) lehnt den Linke-Antrag gegen Jugendoffizier-Besuche an Schulen scharf ab und charakterisiert ihn als „getarntes Hetzpapier" gegen die Bundeswehr; er wirft der Linken „Doppelmoral" vor, weil sie Uniformträger aus Schulen verbannen wolle, aber „Dragqueens mit sexualisierten Darstellungen" dulde. Zentral ist sein Ad-hominem gegen den Verteidigungsminister als „inkompetenten Obergefreiten der Reserve" und seine Empfehlung an das Ministerium, Patriotismus zu rehabilitieren und die Traditionsrichtlinien der Wiedervereinigung wiederaufzugreifen, einschließlich der Anerkennung von NVA-Veteranen.

**Original-Auszug (Mitte, ~600 chars):**
```
…ie wollen unserer Jugend vorgeblich ein selbstbestimmtes Leben ermöglichen. Warum versuchen Sie dann krampfhaft, unter dem Täuschwort der sogenannten Gleichstellung junge Frauen in Berufe zu drängen, zu denen sie von allein keine Lust haben? Stichwort: zu wenige Ingenieurinnen und zu viele Frauen in Sozialberufen, meine Damen und Herren.
Warum lassen Sie seelenruhig Dragqueens mit sexualisierten Darstellungen
auf unsere Kinder los, aber geraten in Wallung, wenn ein ordentlich auftretender Uniformträger in der Schule als Offizier informiert?
In Ihrem Antrag geht es nicht um den Schutz der Jugen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 67. Lars Haise (AfD) — ID216214900

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=3
  - Wörter (laut Haiku selbst): `Luftschlösser`, `verlogene Doppelmoral`, `stillos`
  - Begründung: Diese Wörter sind polemische Charakterisierungen — der Sprecher nutzt sie wörtlich. Aber 'verlogene Doppelmoral' und 'stillos/respektlos' sind wertende Kommentare des Sprechers, nicht neutrale Deskription. Summary behält sie, weil sie authentisch vom Sprecher stammen und der Bürger die Polemik sehen soll; aber Konfidenz wird auf 'mittel' gesetzt, weil die Polemik-Intensität auch in der Wiedergabe erhalten bleiben MUSS — vollständige Neutralisierung würde die Rede verflachen.

**v1-Summary (alt):**
> Lars Haise (AfD) lehnt den Grünen-Antrag zum Deutschlandtakt ab und attackiert die Grünen mit scharfer Polemik: Sie seien über NGOs wie NABU, Greenpeace und Deutsche Umwelthilfe Infrastruktur-Verhinderer, die Bahnbetriebswerke (Nürnberg, Berlin) blockieren und durch das Verbandsklagerecht Straßen-, Brücken- und Bahnprojekte verzögern — das sei „verlogene Doppelmoral". Der Deutschlandtakt sei ein „irrationales Luftschloss" mit unrealistischer 50-Jahre-Frist, das nur „grünen Planungsbüros" nutze, nicht dem Steuerzahler. Sein Schluss-Frame: die grüne Agenda sei zusammen mit der Unions-Migrationspolitik „die größte Verantwortungslosigkeit seit Bestehen der Bundesrepublik" — während die Grünen dem Eisenbahn-Bundesamt Bedenkenträgertum vorwerfen, seien sie selbst verantwortungslos.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Lars Haise (AfD) lehnt den Grünen-Antrag zum Deutschlandtakt ab und attackiert Grüne Politik als 'Verhinderungspolitik': durch Verbandsklagerecht, Umweltverbände (NABU, Greenpeace, Deutsche Umwelthilfe) und 'unsägliche' Umweltschutzgesetze würde der Infrastrukturausbau blockiert (Beispiele Bahnbetriebswerke Nürnberg/Berlin). Der Deutschlandtakt selbst sei ein 'irrationales Luftschloss' mit unrealistischen 50+-Jahr-Zielen, das nur 'grünen Planungsbüros' nütze — statt dessen plädiert Haise für Mischverkehr, Wettbewerb und autonomes Fahren. Im Schluss rahmt er grüne Agenda und Migrations-Koalitionspolitik als 'größte Verantwortungslosigkeit seit Bestehen der Bundesrepublik'.

**Original-Auszug (Mitte, ~600 chars):**
```
…ie an irrationalen Luftschlössern wie dem Deutschlandtakt fest. Für Sie, Herr Gastel, ist er quasi eine politische Lebensversicherung, ein Projekt, dessen Umsetzung bestenfalls noch 50 Jahre dauern würde, wahrscheinlich aber nie umgesetzt werden kann. Da fällt das Fordern leicht.
Wir haben Mischverkehr auf der Schiene, ein polyzentrisches Netz. Wir wollen mehr Wettbewerb und Angebot für Kunden schaffen, und das autonome Fahren schreitet voran. All diese Entwicklungen sprechen gegen Ihr Leuchtturmprojekt. Damit ist der Deutschlandtakt lediglich gut für grüne Planungsbüros und grüne Verkehrspoli…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 68. Andreas Bleck (AfD) — ID216507000

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=4
  - Wörter (laut Haiku selbst): `heuchlerisch`, `absurd`, `arroganz`, `ignoranz`
  - Begründung: Diese Wörter stammen direkt vom Redner ('Das ist heuchlerisch und absurd', 'ihre Arroganz und Ignoranz'). Sie sind nicht Editorialisierung, sondern Blecks wörtliche Bewertung — in der Summary mit Distanz-Markierung integriert ('nennt das', 'attackiert...als arrogant'). Konfidenz: mittel, weil die Grenzlinie zwischen wiedergegebener Redner-Bewertung und Editorial-Urteils-Färbung subtil ist, aber die Phrase 'Das ist heuchlerisch und absurd' ist ein exaktes Original-Zitat.

**v1-Summary (alt):**
> Andreas Bleck (AfD) fordert den sofortigen Wiedereinstieg Deutschlands in die Kernenergie durch Atomgesetz-Änderung (mit Union-Mehrheit) und attackiert Bundeskanzler Merz als Wendehals und Ideologen: Merz habe 2023 versprochen „sofort alle stillgelegten Kernkraftwerke wieder ans Netz zu nehmen", setze diesen Wahlversprechen aber entgegen um der SPD-Koalition willen nicht um — während die EU (200 Mio Euro), Frankreich und Polen auf Kernkraft setzen. Blecks Kern-Frame ist „Heuchelei und Absurdität": Deutschland importiere französischen Atomstrom wegen Dunkelflauten, verbiete ihn aber im Inland; die Regierung „halte Deutschland in Geiselhaft" durch ihre „katastrophale" Energiepolitik. Schlussforderung: Regierungsrücktritt mit Machtwort „Treten Sie endlich ab! Wir regeln das."

**v2.1-Summary (neu):**
> Andreas Bleck (AfD) fordert den Wiedereinstieg in die Kernenergie durch Änderung des Atomgesetzes und kritisiert Bundeskanzler Merz scharf: während von der Leyen (EU-Kommissionspräsidentin, 200 Mio Euro für kleine Kernkraftwerke) die 'weltweite Renaissance der Kernenergie' unterstütze, widerspreche Merz dem Wiedereinstieg, obwohl er 2023 noch sagte, Deutschland würde 'sofort alle stillgelegten Kernkraftwerke ans Netz nehmen' — Bleck nennt das 'Schizophrenie' und 'energiepolitischen Offenbarungseid'. Die AfD argumentiert mit Energiemix, Importabhängigkeit (französische Kernkraft, polnische Kohle), Kostensicherheit und Diversifizierung; attackiert die 'Arroganz und Ignoranz' der Regierungspolitik (Schneider-Marie-Antoinette-Anspielung auf E-Auto-Antwort bei Spritpreis-Entlastung) und endet mit direktem Wahlaufruf: 'Treten Sie endlich ab! Wir regeln das.'"

**Original-Auszug (Mitte, ~600 chars):**
```
…energie nicht irreversibel ist. Merz redet wider besseres Wissen. Irreversibel sind seine Brandmauer-Bunker-Mentalität und die 1 Billion Euro Sonderschulden, die er unseren Kindern und Enkelkindern hinterlassen hat. Durch eine Änderung des Atomgesetzes könnte der Bundestag mit Mehrheiten von Union und AfD den Wiedereinstieg in die Kernenergie ermöglichen.
Mit der Kernenergie könnten wir eine bezahlbare, sichere und zuverlässige Energieversorgung gewährleisten, wie alle anderen Länder mit Kernenergie um uns herum.
Es ist nicht verwunderlich, dass der größte Wendehals der Bundesrepublik Deutschl…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 69. Sven Wendorf (AfD) — ID216607500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `fragwürdigen Aktivismus`
  - Begründung: Das Wort 'fragwürdig' wird vom Redner selbst verwendet ('fragwürdigen Aktivismus', 'fragwürdige Einschätzungen' des Verfassungsschutzes), ist also nicht nachträglich eingeführt, aber grenzwertig in einer Summary, die sonst neutral beschreibend arbeitet — hier unvermeidbar, da die Charakterisierung vom Sprecher kommt.

**v1-Summary (alt):**
> Sven Wendorf (AfD) verteidigt die Ausschließung dreier vermeintlich linksradikaler Buchhandlungen vom Deutschen Buchhandlungspreis (1 Mio Euro Staatsmittel) als legitim und rahmt dies als Notwehr gegen linke Cancel-Culture-Praktiken. Dabei kritisiert er scharf die Heuchelei der Linken, die selbst Ausladungen und Presseverbote betreiben, jetzt aber „das Geschrei" über Ausschluss erheben; zugleich greift er die Verwendung von Verfassungsschutz-Erkenntnissen unter Geheimhaltung an und fordert die komplette Abschaffung des Preises zugunsten privat finanzierter, unabhängiger Kulturpreise — sein Leitmotiv: „Weniger Staat, mehr Freiheit!"

**v2.1-Summary (neu):**
> Sven Wendorf (AfD) verteidigt den Ausschluss von drei mutmaßlich linksradikalen Buchhandlungen vom Deutschen Buchhandelspreis und rahmt dies als „gesunder Menschenverstand" gegen die Finanzierung von „einseitigem politischen Aktivismus" mit Steuergeld (1 Mio Euro). Er kontert den Vorwurf des „rechten Kulturkampfs" mit einer Spiegelungs-Rhetorik: die Linke praktiziere selbst Cancel-Culture, und es sei Heuchelei, jetzt gegen Ausschluss zu protestieren. Jedoch warnt er vor dem Verfassungsschutz als opake Entscheidungsinstanz (Geheimhaltung, „Verdachtslogiken") und fordert daher nicht nur die Abschaffung des staatlich finanzierten Preises, sondern grundsätzlich den Rückzug des Staates aus der Kulturpolitik zugunsten privatisierter, spendenfinanzierter Preise — Schluss: „Weniger Staat, mehr Freiheit!"

**Original-Auszug (Mitte, ~600 chars):**
```
…os“.
Und eigentlich ist es ja noch schlimmer. Rechte fordern ja nur Gleichbehandlung,
die ihnen von linker Seite allzu oft verweigert wird. Hier beschweren sich aber nun zwielichtige linke Akteure darüber, dass sie nicht ausgezeichnet werden, dass sie keinen Preis erhalten, dass sie nicht herausgehoben werden aus der Masse, dass sie nicht vom Staat als Vorbild geehrt und finanziert werden.
Das ist an Dreistigkeit nun wirklich nicht zu überbieten.
Dass der Staat da nicht mitspielt, ist gerechtfertigt. Kurzum: Der Zweck ist legitim. Aber heiligt der Zweck auch die Mittel?
Wenn eine umstrittene B…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 70. Christoph Schmid (SPD) — ID216805400

- **v1-flagged Wort:** `skandalisierende`
- **v2.1 enthält noch:** `skandalisierende`
- **Self-Check:** konfidenz=`mittel`, count_eigene=1
  - Wörter (laut Haiku selbst): `skandalisierend`
  - Begründung: Das Wort 'skandalisierende' ist eine wörtliche Formulierung des Redners ('skandalisierende Oppositionspolitik'), wird aber in der Summary als direktes Zitat des Redners wiedergegeben — dies ist korrekt per H7, aber die Markierung im ersten Satz könnte klarer sein, dass es sich um eine Redner-Vorwurf handelt, nicht um eine Faktum-Bewertung der Summary selbst.

**v1-Summary (alt):**
> Christoph Schmid (SPD) würdigt die Wehrbeauftragte-Amt und dessen Bericht als parlamentarisches Kontrollorgan, fordert aber vor allem eine deutliche Erhöhung des Frauenanteils in der Bundeswehr — aktuell nur 13,71 Prozent, Ziel 20 Prozent — und warnt: „An allen Stellen beweisen Frauen in der Bundeswehr, dass sie die Truppe besser machen", weshalb „Vielfalt und Buntheit" zur modernen Identität gehören (explizite Kritik an AfD-Positionen). Er attackiert die Grünen für „skandalisierende Oppositionspolitik" und die Linken (Pellmann) für Forderungen, Deutschland solle sich vom Baltikum zurückziehen — in der aktuellen Sicherheitslage sei Abschreckungsfähigkeit essentiell und das steigende Eingabe-Volumen völlig erwartbar, nicht skandalös.

**v2.1-Summary (neu):**
> Christoph Schmid (SPD) würdigt den Wehrbeauftragten Henning Otte und dessen Bearbeitung von 4.000 Vorgängen 2025 als wichtige Arbeitsgrundlage, legt inhaltlich den Schwerpunkt auf Kapitel 7 des Berichts (Frauenanteil in der Bundeswehr): dieser sei mit 13,71 Prozent minimal gestiegen, verfehle aber das selbstgesetzte Ziel von 20 Prozent deutlich — Bekämpfung von Diskriminierung sei Voraussetzung für Erfolg in Kampfverbänden und Führungsverwendungen. Er attackiert Grüne und Linke direkt: die Grünen würden den Bericht für „skandalisierende Oppositionspolitik missbrauchen", die Linke Pellmann mit Namen adressierend verteidigt er Abschreckungsfähigkeiten im Baltikum als sicherheitspolitisch notwendig gegen deren angenommene Rückzugs-Forderung.

**Original-Auszug (Mitte, ~600 chars):**
```
…Ziel von 20 Prozent außerhalb der Sanität erreichen wir damit bei Weitem nicht. Deshalb besteht natürlich dringender Handlungsbedarf. An allen Stellen beweisen Frauen in der Bundeswehr, dass sie die Truppe besser machen.
Deshalb bedeutet ein höherer Anteil von Frauen in allen Verwendungen – und ja, vor allem auch in Führungsverwendungen – auch eine Verbesserung der Qualität unserer Bundeswehr.
Ich danke dem Wehrbeauftragten für die klare Feststellung, dass die Bemühungen um mehr Frauen in den Kampfverbänden nur dann Erfolg haben werden, wenn die Bundeswehr jeglicher Form von Diskriminierung en…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 71. Martin Sichert (AfD) — ID217409500

- **v1-flagged Wort:** `skandalisiert`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`mittel`, count_eigene=2
  - Wörter (laut Haiku selbst): `Schande`, `Katastrophe`
  - Begründung: Die Wörter 'Schande' und 'Katastrophe' sind vom Sprecher selbst genutzt (wörtliche Zitate), nicht von der Summary erfunden — gehören aber zur Tier-A-Liste emotional-wertender Begriffe. Ich habe sie als Zitate erhalten (nicht editorialisiert), aber der Konfidenz-Level ist 'mittel', weil die Summary tonale Charakter-Färbung durch wörtliche Zitate reproduziert. Dies ist sachlich korrekt und pflicht-dokumentiert via wertende_woerter_eigene-Feld.

**v1-Summary (alt):**
> Martin Sichert (AfD) greift den Linke-Antrag zur Abschaffung der kostenlosen Mitversicherung von Ehepartnern an und skandalisiert das deutsch-türkische Sozialversicherungsabkommen als 'absolute Schande': während Deutschland 2,4 Millionen Ehepaare (4,8 Millionen Menschen) um über 2.000 Euro jährlich entlasten soll, bleibe die asymmetrische Regelung bestehen, dass Eltern und Ehepartner in der Türkei weiter kostenlos versichert sind — ein 'Geld für die Welt'-Framing mit direktem Vorwurf der Doppelmoral an die Koalition.

**v2.1-Summary (neu):**
> Martin Sichert (AfD) lehnt die geplante Abschaffung der kostenlosen Mitversicherung von Ehepartnern ab und prangert eine Doppelmoral an: während Deutschland 2,4 Millionen Ehepaare (4,8 Millionen Menschen) entlasten soll und diese über 2.000 Euro pro Jahr mehr zahlen, bleiben Eltern und Ehepartner in der Türkei gemäß deutsch-türkischem Sozialversicherungsabkommen kostenfrei mitversichert. Er charakterisiert diese Asymmetrie als „absolute Schande" und „Katastrophe für dieses Land".

**Original-Auszug (Mitte, ~600 chars):**
```
…utsch-türkischen Sozialversicherungsabkommen können Kinder, Ehefrauen und sogar die Eltern kostenfrei auf Kosten der deutschen Beitragszahler in der Türkei mitversichert sein.
Es ist eine absolute Schande, dass Sie jetzt versuchen, hier in Deutschland die kostenlose Mitversicherung von Ehepartnern abzuschaffen,
während in der Türkei weiter die Eltern und die Ehepartner versichert sind.
Sie wollten wissen, wie viele das betrifft. Das betrifft circa 2,4 Millionen deutsche Ehepaare, 4,8 Millionen Menschen, die künftig weit über 2 000 Euro im Jahr mehr zahlen sollen und denen Sie netto tief in die…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

---

## Konfidenz: hoch + Wortliste-Flag (74 Reden)

### 1. Sanae Abdi (SPD) — ID211002200

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Sanae Abdi (SPD) verteidigt das Lieferkettengesetz gegen den AfD-Abschaffungsantrag und kennzeichnet diesen als 'Stimmungsmache' mit 'falschen Behauptungen': Das Gesetz sei kein Schikanewerkzeug, sondern Schutzinstrument für faire Wettbewerbs- und Menschenrechtsstandards, belegt durch Gewerkschafts-Berichte aus Kenia und Indien. Die Bundesregierung plant nicht die Abschaffung, sondern die Ersetzung durch ein europäisches Nachfolgegesetz mit Klimaplanerstellung, gestufter Verantwortung und Bußgeldern — einen 'gelungenen Kompromiss' zwischen CDU/CSU und SPD, der Unternehmen 'Planungssicherheit, Verlässlichkeit und faire Rahmenbedingungen' bietet statt einer 'ideologischen Abrissbirne'.

**v2.1-Summary (neu):**
> Sanae Abdi (SPD) widerlegt den AfD-Antrag zur ersatzlosen Abschaffung des Lieferkettengesetzes methodisch: sie kennzeichnet ihn als 'Stimmungsmache statt Argumentation' und widerspricht der Darstellung als 'Bürokratiemonster'. Mit Belegen von Gewerkschaften aus Kenia und Indien zeigt sie konkrete Wirkung (Durchsetzung von Arbeitnehmerrechten, weniger Pestizide/Giftstoffe) und argumentiert, dass verbindliche Regeln den 'Wettlauf nach unten' stoppen — anständige Unternehmen würden andernfalls unter Druck geraten. Im konstruktiven Teil verteidigt sie den Koalitionsplan: Ersetzung durch ein europäisch-rahmtes Gesetz mit Klimaplanerstellung, gestufter Verantwortung und Bußgeldern — ein 'gelungener Kompromiss zwischen CDU/CSU und SPD'.

**Original-Auszug (Mitte, ~600 chars):**
```
… die AfD dafür hergibt, überrascht nicht. Wir als Bundesregierung tun das nicht, und wir werden es auch nicht tun.
Wir wollen und müssen Bürokratie abbauen,
aber nicht blind mit der Kettensäge. Wir wollen durchdachte, praktikable Regeln.
Denn Unternehmen brauchen keine ideologische Abrissbirne. Das, was sie wirklich brauchen, sind Planungssicherheit, Verlässlichkeit und faire Rahmenbedingungen.
Und genau deshalb war und ist das Lieferkettensorgfaltspflichtengesetz ein wichtiger Schritt. Es zwingt Unternehmen nicht in die Knie. Es hebt sie auf ein gemeinsames ethisches Fundament.
Vielmehr noch:…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 2. Beatrix von Storch (AfD) — ID211006300

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Beatrix von Storch (AfD) verteidigt Israels Selbstverteidigungsrecht gegen die Hamas durch eine historisch fundierte Kontextualisierung: Sie referenziert Israels 2005er Gazarückzug, die darauffolgende Hamas-Wahlsieg 2006 (68% der Wahlbezirke), und den Umbau Gazas zu einer Terrorfestung mit Hunderten Kilometer Tunnelsystem, finanziert durch zweistellige Milliarden-Hilfen. Sie rahmt den Konflikt als asymmetrisches Kriegs-Dilemma, in dem die Hamas Zivilbevölkerung als Schutzschilde missbraucht und zivile Einrichtungen militärisch nutzt — und lehnt die Genozid-Vorwürfe als „schlimme Diffamierung" ab. Ihre Position: Kein Land könne terroristische Bedrohung dauerhaft erdulden; gleichzeitig äußert sie Mitgefühl für Leid der Gazaer-Bevölkerung und eine persönliche, an Gott adressierte Bitte um Frieden.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Beatrix von Storch (AfD) verteidigt Israels Selbstverteidigungsrecht gegen Hamas-Terror durch historische und aktuelle Faktendarstellung: 1.200 Tote am 7. Oktober 2023, 4.375 Raketen 2021, Israel zog 2005 aus Gaza ab mit „Land gegen Frieden"-Angebot, Palästinenser wählten aber Hamas (68% der Wahlbezirke, absolute Parlamentsmehrheit). Sie charakterisiert Gaza unter Hamas als Terrorstaat und Terrorfestung (Tunnelsystem länger als Berlins U-Bahn) und argumentiert, dass internationale Hilfen (zweistellige Milliarden) nicht der Bevölkerung zugute kamen, sondern der Rüstung — dies schaffe ein „furchtbares moralisches Dilemma" für Israel: Verzicht auf Gegenwehr ermöglicht Hamas-Stärkung, Gegenwehr trifft Zivilisten, die als „menschliche Schutzschilde" missbraucht werden. Sie lehnt die Bezeichnung „Genozid" als „Diffamierung" ab und plädiert dafür, dass kein Land „dauerhaft" Terror gegen Bürger dulden kann — Israels Reaktionen müssen humanitäres Völkerrecht und ethische Maßstäbe beachten, doch das Schuldproblem liegt bei der Hamas, die Zivilinfrastruktur für Terror nutzt. Schluss: Unterstützung für Israels Selbstverteidigung geht einher mit Mitgefühl für Gazas Bevölkerung.

**Original-Auszug (Mitte, ~600 chars):**
```
… auch durch Blockaden, trifft immer auch die Zivilbevölkerung. Jeder Verzicht, gegen die Hamas vorzugehen, gibt dieser die Möglichkeit, noch stärker zu werden. Was wir nun sehen, sind die grauenhaften Schrecken eines asymmetrischen Krieges gegen Terroristen, die ihre eigene Zivilbevölkerung als menschliche Schutzschilde missbrauchen. Das ist kein Genozid – das ist eine schlimme Diffamierung –, aber es schafft sehr viel Leid.
Gegen eine Terrororganisation zu operieren, die sich in einem so dicht besiedelten Gebiet verschanzt, ist ein Albtraum für jede Armee. Was tun, wenn die Raketen aus Wohnge…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 3. Stephan Brandner (AfD) — ID211014600

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Stephan Brandner (AfD) verteidigt seinen Gesetzentwurf zur Ministerial-Haftung mit einer rhetorischen Provokation: Was in Bayern von der CSU problemlos umgesetzt werde, werde auf Bundesebene von derselben Partei zerredet. Der Redner rahmt dies als Heuchelei und Doppelstandard der Koalition gegen die AfD-Forderung nach rechtsstaatlicher Kontrolle der Exekutive.

**v2.1-Summary (neu):**
> Stephan Brandner (AfD) verteidigt den Gesetzentwurf zur Haftung von Bundesministern bei Amtspflichtverletzungen mit einem Konsistenz-Argument: Bayern setze ein analoges Gesetz von der CDU/CSU bereits problemlos um, weshalb die Opposition eine Doppelmoral betreibe — der Vorschlag werde auf Bundesebene „zerlegt", während die gleiche Regelung auf Landesebene funktioniere. Die Rhetorik nutzt diese Inkohärenz als Beleg gegen die Kritik an der AfD-Initiative.

**Original-Auszug (Mitte, ~600 chars):**
```
Sie werfen uns hier alles Mögliche vor. Was unterscheidet denn, ich sage mal, die tägliche Wirklichkeit dieses Gesetzes in Bayern von unserem Gesetzentwurf für den Bund? Unseren Vorschlag zerlegen Sie, in Bayern aber wird das Gesetz von Ihrer Partei problemlos umgesetzt.
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 4. Rasha Nasr (SPD) — ID211411600

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Rasha Nasr (SPD) wendet sich in scharfer Konfrontation gegen den AfD-Antrag zur totalen Streichung des Bürgergeldanspruchs für ukrainische Geflüchtete und entlarvt ihn als populistische Stimmungsmache, die Schutzsuchende gegen sozial Schwache ausspielen soll. Sie setzt dagegen ein Bekenntnis zu gelebter Menschlichkeit, zu verfassungsrechtlich verantwortbarer Gesetzgebung (gezielter Rechtskreiswechsel ab 1. April 2025) und zu fairer Integration ukrainischer Kriegsflüchtlinge durch klare Verfahren statt Ausgrenzung — und kritisiert die AfD scharf: „Der AfD geht es nicht um Lösungen, es geht ihr um Stimmungsmache."

**v2.1-Summary (neu):**
> Rasha Nasr (SPD) lehnt den AfD-Antrag für einen kompletten Ausschluss von Ukrainern vom Bürgergeld ab und kritisiert ihn als „Versuch, Schutzsuchende und Menschen mit kleinem Einkommen gegeneinander auszuspielen". Sie verteidigt die Koalitions-Linie (Rechtskreiswechsel ab 1. April 2025) gegen die „Radikalität" des AfD-Antrags und argumentiert mit Verfassungsrecht, Integrationspolitik und Fairness: Ukraine-Flüchtlinge hätten Anspruch auf „Schutz, Würde und faire Chancen" sowie Sozialleistungen als „Übergänge zu überbrücken"; die AfD betreibe „Stimmungsmache" statt Lösungen.

**Original-Auszug (Mitte, ~600 chars):**
```
…haben dazu beigetragen, dass Deutschland ein sicherer Zufluchtsort für Menschen in Not ist.
Diese gelebte Menschlichkeit, dieses Verantwortungsbewusstsein: Das macht unser Land aus!
Politik hat die Aufgabe, diesen Zusammenhalt gegen Zynismus, Ausgrenzung und das Gift der Verächtlichmachung zu schützen. Wir haben im Koalitionsvertrag vereinbart, den sogenannten Rechtskreiswechsel für neueinreisende ukrainische Kriegsflüchtlinge mit Stichtag 1. April 2025 zu beenden. Aber, meine Damen und Herren, zwischen einer gezielten Anpassung in einem verantwortungsvoll ausgehandelten Koalitionsvertrag und …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 5. Jorrit Bosch (Die Linke) — ID211607000

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Jorrit Bosch (Die Linke) attackiert die Koalitions-Verkehrspolitik als soziale Ausgrenzung und fordert kostenlosen Nahverkehr mit massivem Ausbau (finanzierbar aus ~15 Mrd Euro jährlich durch Umverteilung klimaschädlicher Subventionen) statt regelmäßiger Preiserhöhungen des Deutschlandtickets, das seit der Erhöhung von 49 auf 58 Euro eine Million Nutzer verloren hat. Er rahmt Mobilität als Grundrecht und Voraussetzung für Teilhabe, politische Stabilität und Würde — nicht als Privileg — und wirft Union und SPD vor, ihre christlich-sozialen Grundsätze aufgegeben zu haben, während sie beim Deutschlandticket „Lobbypolitik und Inkompetenz" betreiben und gleichzeitig beim Bürgergeld „Stimmungsmache gegen die Ärmsten" fahren.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Jorrit Bosch (Die Linke) kritisiert die Verkehrspolitik der Regierungskoalition als Versagen gegenüber der Bevölkerung: Der aktuelle Haushalt bringe keine echten Investitionen für Nahverkehr, besonders im ländlichen Raum, wo Menschen ohne zuverlässige Busse und Bahnen sozial ausgeschlossen würden. Er rahmt die Preiserhöhung des Deutschlandtickets von 49 auf 58 Euro als strategisches Scheitern (1 Million Nutzer verloren) und fordert stattdessen kostenlosen Nahverkehr mit massivem Ausbau, finanzierbar durch 15 Milliarden Euro jährlich — weniger als ein Viertel der klimaschädlichen Subventionen. Abschließend wirft er Union und SPD vor, ihre Prinzipien („christlich" und „sozial") in der Mobilität zu verraten und praktiziert dabei «Stimmungsmache gegen die Ärmsten» durch Bürgergeld-Debatten, während Lobby-Politik Milliarden verschwinden lässt.

**Original-Auszug (Mitte, ~600 chars):**
```
… echtes Rätsel eigentlich, wie ein höherer Preis weniger Nachfrage erzeugen kann!
Liebe Union, liebe SPD, ist das die Strategie: das erfolgreichste Ticket der Geschichte so lange verteuern, bis es sich niemand mehr leisten kann, um es dann sang- und klanglos einzustampfen? Ich halte das für eine nicht so grandiose Idee.
Und ich sehe, wie das Spiel weitergeht. Nächstes Jahr heißt es dann wieder: Das Deutschlandticket wird teurer. – Dabei brauchen wir genau das Gegenteil: einen kostenlosen Nahverkehr, verbunden mit massivem Ausbau des Angebots. Das wäre kein Luxus, das wäre ein Gewinn für alle. …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 6. Dr. Wolfram Weimer ((Reg)) — ID211701800

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Wolfram Weimer (Staatsminister beim Bundeskanzler) hält eine Jubiläums-Kulturrede, die deutsche Erinnerungskultur, Medienpolitik und Kulturerbe in einer Kette historischer Epochen rahmt (80, 90, 100, 200, 500, 1200 Jahre) und konkrete Haushaltsmittel-Vorhaben ankündigt: Stärkung des Jüdischen Museums Berlin, Deutschlandfunk/Welle-Europäisierung und Ausbau als globale Freiheitsstimme, Stiftung Preußischer Kulturbesitz, Filmförderung und KI-Regulierung gegen US/China-Monopole, Lutherhaus-Sanierung und Kulturbautenoffensive. Der Schluss kontert implizit die AfD (über das Motiv der „Herzlosen" und „vergessenen Gewissen") mit einer Rehabilitierung des Bauhauses als deutsches Kulturerbe gegen NS-Verfolgung und gegenwärtige rechte Diffamierung — Bauhaus ist nicht Irrweg der Moderne, sondern Weltmarke und Bestandteil legitimen deutschen Stolzes.

**v2.1-Summary (neu):**
> Dr. Wolfram Weimer (Staatsminister beim Bundeskanzler) eröffnet die Haushaltsdebatte des Bundeskanzleramtes mit einer Kulturpolitik-Bilanz, die historische Jahrestage als Strukturprinzip nutzt: 80 Jahre Befreiung vom Nationalsozialismus, 90 Jahre Nürnberger Gesetze, 100 Jahre Locarno-Verträge und Bauhaus-Gründung, 200 Jahre Museumsinsel, 500 Jahre Luther, 1200 Jahre europäische Schrift. Er kündigt Haushaltsmittel für Gedenkstätten, das Jüdische Museum Berlin, Deutscher Welle und Arte, die Stiftung Preußischer Kulturbesitz, Filmförderung, Kulturbautenoffensive (Lutherhaus Wittenberg, Museumsinsel), und insbesondere die Pflege des Bauhaus-Erbes an — letzteres mit impliziter Abgrenzung gegen AfD-Diffamierung: „Wer mithin aus dem Milieu der Herzlosen so gerne vom deutschen Stolz redet, dem sage ich: Was deutschen Stolz auch ausmacht, ist, stolz auf unser Bauhaus zu sein."

**Original-Auszug (Mitte, ~600 chars):**
```
… Die Stiftung Preußischer Kulturbesitz bildet mit dem Louvre und dem British Museum das glorreiche Triumvirat europäischer Kulturmuseen. Wir stärken es mit unseren aufgestockten Mitteln so, dass Glanz und Gloria strahlen, aber auch die Fackeln der Aufklärung, der Weltoffenheit, dieser deutschen Leidenschaft ums Wissen und Können, darin leuchten und uns wunderbare Wege weisen.
Es ist genau 1 200 Jahre her, da Karl der Große mit den karolingischen Minuskeln die europäische Schrift eingeführt hat, die bis heute global dominiert. Seither war Deutschland über Jahrhunderte eine Hochburg der globalen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 7. Bärbel Bas ((Reg)) — ID211902200

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `skandalisierende`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Bärbel Bas (SPD, BMin für Arbeit und Soziales) verteidigt den Sozialstaat gegen Skandalisierung und Polarisierung und skizziert ein ambitioniertes Modernisierungs- und Leistungsprogramm: digitale Infrastruktur (500 Mio Euro), Jobcenter-Stärkung (400 Mio/1 Mrd Euro jährlich), Tarifbindung für öffentliche Aufträge, höherer Mindestlohn (6 Mio Beschäftigte, +300 Euro/Monat beispielhaft), Rentenniveau 48 Prozent bis 2031, Mütterrente-Vollendung (10 Mio Eltern, +20 Euro/Monat) und Inklusions-Fortschritt. Ihr Frame: pragmatische, gerechte Modernisierung, nicht Sparpolitik — „Wer von seiner Arbeit leben kann und hart gearbeitet hat, muss auch im Alter abgesichert sein."

**v2.1-Summary (neu):**
> Bundesministerin Bärbel Bas (SPD) verteidigt den Sozialstaat gegen eine aus ihrer Sicht 'schrille', skandalisierende Debatte und präsentiert ein pragmatisch-reformorientiertes Paket: 500 Mio Euro für digitale Infrastruktur, ~400 Mio Euro (later ~1 Mrd jährlich) für Jobcenter-Eingliederungsarbeit, Kommission zur Systemeinfachung, Bundestariftreuegesetz, Mindestlohnerhöhung für 6 Millionen Beschäftigte, Rentenniveau 48% bis 2031, Mütterrenten-Vollendung für 10 Millionen Eltern, und Behindertengleichstellungsgesetz-Weiterentwicklung. Ihr Frame: Sozialstaat ist 'historische Errungenschaft' für 'sozialen Frieden', braucht aber 'Effizienz' und 'Pragmatismus'; Tarifbindung bei öffentlichen Aufträgen sei 'gerecht'.

**Original-Auszug (Mitte, ~600 chars):**
```
… zu sparen. Klar ist: Ohne eine gute Konjunktur werden wir auf dem Arbeitsmarkt keine Wunder vollbringen. Und deshalb brauchen wir den Schwung, den die Bundesregierung jetzt aufnimmt, um die Wirtschaft zu stärken. Dafür arbeitet diese Bundesregierung.
Die Grundsicherung muss darüber hinaus zielgenauer und besser darin werden, Menschen in Arbeit zu bringen. Und wir werden auch bei Sozialleistungsbetrug und Schwarzarbeit nicht wegschauen, sondern Maßnahmen ergreifen, die diese unseriösen Geschäftsmodelle beenden.
Das sind wir übrigens auch den Menschen schuldig, die diesen Sozialstaat mit ihrer …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 8. Rüdiger Lucassen (AfD) — ID212000500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Rüdiger Lucassen (AfD) attackiert den Wehrdienst-Gesetzentwurf als verfassungswidrig ungleich: während die Regierung bei der „Verschuldungsorgie" problemlos das Grundgesetz änderte und sogar die Linken „ins Boot holte", weigere sich SPD und Regierung, Frauen und Männer bei der Wehrdienstverpflichtung gleichzustellen. Seine wiederholte Frage zielt auf Inkonsistenz und vermeintliche Heuchelei ab.

**v2.1-Summary (neu):**
> Rüdiger Lucassen (AfD) attackiert die SPD-geführte Regierung und wirft ihr Doppelmoral vor: Sie habe das Grundgesetz problemlos geändert für die „Verschuldungsorgie" und Linke „ins Boot geholt", aber schweige völlig zu Geschlechterparität beim Wehrdienst. Er fragt direkt und wiederholend: „Warum sind Frauen und Männer in Ihrem Gesetzentwurf nicht gleichgestellt?" — der Kern der Intervention ist die Anklage einer Inkonsistenz bei Verfassungs-Ambitionen der Regierung.

**Original-Auszug (Mitte, ~600 chars):**
```
Danke, Frau Präsidentin. – Der Stand des Grundgesetzes ist mir natürlich bekannt, Herr Minister.
Aber Sie hatten bei der Verschuldungsorgie kein Problem, das Grundgesetz zu ändern und sogar die Linken mit ins Boot zu holen. Das geht also. Warum kommt von Ihnen wie aus der gesamten SPD kein Ton zur Gleichberechtigung von Frauen und Männern, wenn es um den Wehrdienst geht? Also noch mal: Warum sind Frauen und Männer in Ihrem Gesetzentwurf nicht gleichgestellt?
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 9. Axel Müller (CDU/CSU) — ID212205700

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `diffamiert`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Axel Müller (CDU/CSU) lehnt den AfD-Antrag zur Abschaffung des § 188 StGB ab und verteidigt das 2020er Gesetzespaket zum Schutz von Politikern vor Hass und Hetze mit zwei historischen Belegen: Matthias Erzberger, 1921 von Rechtsextremisten erschossen, und Walter Lübcke, 2019 ermordet nach Internet-Hetze — beide zeigen die Kausalität Hass→Gewalt. Er argumentiert, dass Meinungsfreiheit Grenzen hat, wo Menschenwürde angetastet wird, und dass der demokratische Rechtsstaat diese schützen darf. Abschließend attackiert er die AfD-Heuchelei: Alice Weidel habe selbst dreistellige Anzeigen nach § 188 StGB erstattet — Stichwort Glashaus und Steine werfen.

**v2.1-Summary (neu):**
> Axel Müller (CDU/CSU) verteidigt den § 188 StGB gegen den AfD-Antrag zu dessen Abschaffung mit zwei historischen Parallelen: Matthias Erzberger, 1921 von rechten Freikorps-Angehörigen erschossen, nachdem Hugenbergs Propagandapresse ihn diffamiert hatte; Walter Lübcke, 2019 erschossen, nachdem Hass und Hetze gegen ihn im Internet eskaliert waren. Müller argumentiert, dass die 2020er Gesetzespaket-Reform (mit erhöhter Strafdrohung für diffamierende Äußerungen gegen Politiker) notwendig war, um den Diskurs vor Verengerung durch Gewalt- und Morddrohungen zu bewahren — Grenzen der Meinungsfreiheit bei Menschenwürdeverletzung sind Sache des Rechtsstaats. Abschließend wirft er der AfD „scheinheilige Doppelmoral" vor: Alice Weidel habe selbst in dreistelliger Zahl Anzeigen nach § 188 erstattet; sein Schlusswort: „Wer im Glashaus sitzt, sollte nicht mit Steinen werfen."

**Original-Auszug (Mitte, ~600 chars):**
```
…e erstreckt wurde; denn Demokratie findet gerade dort, auf kommunaler Ebene, hautnah, erlebbar statt. Es war ebenso wichtig, den Staatsanwaltschaften die Möglichkeit zur Strafverfolgung zu geben, wenn sich der eingeschüchterte Geschädigte nicht traut, diese durch einen entsprechenden Strafantrag in Gang zu setzen.
Im Rahmen des Gesetzgebungsverfahrens waren sich alle Sachverständigen in einer Anhörung des Rechtsausschusses einig, dass ein entsprechender gesetzgeberischer Handlungsbedarf bestand, um zu unterbinden, dass es den Feinden der demokratischen und pluralistischen Gesellschaft durch di…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 10. Michael Kellner (BÜNDNIS 90/DIE GRÜNEN) — ID212302700

- **v1-flagged Wort:** `Abgesang`
- **v2.1 enthält noch:** `Abgesang`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Michael Kellner (Bündnis 90/Die Grünen) konfrontiert die Merz-Regierung (besonders Wirtschaftsministerin) mit einem dreifachen Vorwurf: (1) Widerspruch zwischen Union-Wahlversprechen und realen Arbeitslosenzahlen (3 Mio = Höchststand seit 2015) sowie Insolvenzen; (2) Mutlosigkeit bei der Energiewende — besonders die Orientierung an der UNTEREN Bandbreite der Strommengen-Prognosen für 2030 sei ein „Abgesang auf ein starkes Industrieland", da energieintensive Sektoren (Stahl, Zement, Rechenzentren, KI) und Wärmepumpen-/E-Mobilitäts-Boom ausfallen; (3) Preisgabe europäischer Klimaziele 2040 durch Verhandlungen mit Orbáns Ungarn zum Verbrenner-Verbot statt Wettbewerbsgleichheit. Sein Appell an die Regierung: „Zukunft wird aus Mut gemacht" — ein defensiv-pragmatisches Regierungshandeln verspielet Deutsche Industrie-Vorteile.

**v2.1-Summary (neu):**
> Michael Kellner (Grüne) attackiert die neue Merz-Koalition mit Belegen: 3 Millionen Arbeitslose (Höchststand seit 2015) widersprechen der Union-Rhetorik von 'Alles wird gut' — Regieren sei nicht so einfach. Kernkritik: Wirtschaftsministerin zeige 'Mutlosigkeit' und sei 'größte Zweiflerin der Energiewende' — sie orientiere sich bei Strommengen-Planung 2030 an der 'unteren Bandbreite' (Kellner nennt das 'Wahnsinn' und 'Abgesang auf starkes Industrieland'), obwohl Stahlindustrie, Rechenzentren, KI, E-Mobilität und Wärmepumpen steigende Nachfrage schaffen werden. Zweites Beispiel: Im Verkehrsbereich keine CO2-Fortschritte seit 1990, nun verschiebe die Regierung das Verbrenner-Aus und liefere europäische Klimaziele 2040 'an Viktor Orbán aus' — dabei brauche Europa Wettbewerbsgleichheit mit Klimazielen, nicht Orbán-Verhandlungen. Schlussappell: 'Zukunft wird aus Mut gemacht' — nicht aus der derzeitigen Energiewende-Mutlosigkeit.

**Original-Auszug (Mitte, ~600 chars):**
```
… in diesem Land Geld in die Hand nehmen und in die Energiewende, in den Klimaschutz investieren.
Als wir angefangen haben mit dem EEG im Jahr 2000, lag die Einspeisevergütung für eine Kilowattstunde Solarstrom noch bei über 50 Cent. Heute sind wir bei 6 Cent. Was für ein Erfolg, den wir da erreicht haben! Das muss so weitergehen.
Natürlich ist es schwer, vorherzusagen, wie hoch die Strommengen in 2030 sein werden. Aber besonders mutlos fand ich, dass die Ministerin bei der Vorstellung gestern sagte: Ich orientiere mich an der unteren Bandbreite der Strommengen. – Das ist doch Wahnsinn. Das ist…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 11. Helge Limburg (BÜNDNIS 90/DIE GRÜNEN) — ID212502600

- **v1-flagged Wort:** `Diffamierungen`
- **v2.1 enthält noch:** `diffamierenden`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Helge Limburg (BÜNDNIS 90/DIE GRÜNEN) kritisiert die Regierungskoalition konfrontativ für einen systematischen Anschlag auf Rechtsstaatlichkeit und Grundrechte: von Verachtung gegenüber Verwaltungsgerichtsentscheidungen (Grenzkontrollen), über die Beschämung der Verfassungsrichterwahl durch rechtsextreme Kampagnen, bis hin zu einem massiven Ausbau von Überwachungs-Befugnissen (IP-Speicherung, Telefonüberwachung, Kennzeichen- und Videoerfassung, Biometrie), die er als „Katalog des Grauens" und „Frontalangriff auf Freiheitsrechte" brandmarkt. Parallel kritisiert er die Union, die bei Kinderschutz nur Überwachung ausbaue, aber dem Reform des Abstammungsrechts verweigere, und mahnt die Justizministerin an, endlich gegen rechtsextreme Diffamierungen Stellung zu beziehen statt zu schweigen — während die Strafrechtsverschärfung gegen Agententätigkeit viel zu langsam vorankommt.

**v2.1-Summary (neu):**
> Helge Limburg (Bündnis 90/Die Grünen) führt eine konfrontativ-belegende Auseinandersetzung mit der Regierungskoalition zu deren Verhältnis zum Rechtsstaat: Er kritisiert konkret die Weigerung zur Umsetzung von Afghanistan-Visa-Urteilen, bekannte Rechtswidrigkeit pauschaler Grenzkontrollen (Verwaltungsgericht Berlin), die mangelnde Konsequenz gegen den CDU-Justizstaatssekretär wegen eines diffamierenden Videos gegen das Verwaltungsgericht, und die blockierte Verfassungsrichterwahl durch rechtsextreme Online-Kampagnen. Im Zentrum seiner Kritik steht die einseitige Ausweitung von Überwachungsmaßnahmen (IP-Vorrat, Telefon, Kennzeichen, Video, biometrische Daten, Palantir-Software) als „Überwachungskatalog des Grauens" und Frontalangriff auf Grundrechte — während echte Kinderrechte wie das Abstammungsrecht für Kinder von zwei Müttern verweigert werden. Er fordert schnellere Umsetzung der Strafrechtsverschärfung § 99 StGB gegen geheimdienstliche Agententätigkeit.

**Original-Auszug (Mitte, ~600 chars):**
```
…otz eines eindeutigen Votums des zuständigen Richterwahlausschusses haben Sie für ein negatives Novum gesorgt: Erstmals musste die Wahl von Verfassungsrichtern wieder von der Tagesordnung genommen werden.
Und das nicht etwa, weil es berechtigte Zweifel an Qualifikation oder Eignung gab, sondern weil es eine rechtsextreme Diffamierungskampagne im Internet gab.
Dieser Tag hat negative Wirkung weit über den Tag hinaus, liebe Kolleginnen und Kollegen.
Meine Damen und Herren, der letzte Koalitionsvertrag hat – ganz wie es das Bundesverfassungsgericht angemahnt hat – eine Überwachungsgesamtrechnung …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 12. Dr. Reinhard Brandl (CDU/CSU) — ID212600100

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Reinhard Brandl (CDU/CSU) verteidigt in einer Geschäftsordnungs-Debatte die geplante Richterwahl-Abstimmung am Donnerstag gegen AfD-Obstruktion und beschuldigt die AfD, den Bundestag als handlungsunfähig darstellen zu wollen — er kontert mit der Anaphora: „Dieser Bundestag funktioniert. Unsere Demokratie funktioniert. Und diese Koalition funktioniert." Die Geschäftsordnung sei eingehalten, der Richterwahlausschuss habe sich mit notwendiger Mehrheit verständigt, es gebe „überhaupt keinen Grund" zu verzögern. Abschließend rahmt er die AfD-Strategie als erfolglose Skandalisierung eines bereits gelösten Themas — „Das ist keine gute Nachricht für die AfD; aber das ist eine gute Nachricht für Deutschland."

**v2.1-Summary (neu):**
> Dr. Reinhard Brandl (CDU/CSU) konfrontiert die AfD direkt mit der Feststellung, dass ihre Geschäftsordnungs-Obstruction kein echtes Verfahrens-Anliegen, sondern Stimmungsmache gegen das Bundesverfassungsgericht sei; er widerlegt die Vorwürfe durch Verweis auf die korrekte Einhaltung aller Fristen und die Beschlussfassung des Richterwahlausschusses mit notwendiger Mehrheit. Sein Frame: Der Bundestag sei handlungsfähig, die Demokratie funktioniere, und die vernünftige Zusammenarbeit der Koalition sei das beste Gegenmittel gegen AfD-Blockade-Versuche — ein Erfolg für Deutschland, keine gute Nachricht für die AfD.

**Original-Auszug (Mitte, ~600 chars):**
```
…wir werden das in dieser Woche bei jedem einzelnen Tagesordnungspunkt unter Beweis stellen.
Und wir werden in dieser Woche auch über Richterkandidaten abstimmen. Ehrlich gesagt gibt es überhaupt keinen Grund, das nicht zu tun. Gestern tagte der Richterwahlausschuss. Er hat sich mit der notwendigen Mehrheit auf eine Kandidatin verständigt. Am Donnerstag findet im Plenum die Abstimmung statt. Alle Fristen werden eingehalten, genauso wie in der Geschäftsordnung vorgesehen.
Genauso machen wir es.
Was würden Sie denn hier veranstalten, wenn wir es nicht so machen würden? Das zeigt doch die Absurdit…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 13. Dr. Irene Mihalic (BÜNDNIS 90/DIE GRÜNEN) — ID212600400

- **v1-flagged Wort:** `Diffamierungskampagne`
- **v2.1 enthält noch:** `Diffamierungskampagne`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Irene Mihalic (Grüne) verteidigt die Durchführung der Bundesverfassungsgericht-Wahl in dieser Woche gegen AfD-Geschäftsordnungsdebatte und benennt klare Motiv-Dekonstruktion: Baumann (AfD) nutze die GO-Debatte nicht zur substantiellen Prozessgestalting, sondern um „demokratische und rechtsstaatliche Institutionen verächtlich zu machen und parlamentarische Prozesse zu sabotieren" — wie 2024 schon durch eine „rechtsextremistische Diffamierungskampagne" geschehen, die eine Kandidatin zu Fall brachte. Mit Anaphora „Nie wieder" rahmt sie die Position als Verteidigung der Rechtsstaatlichkeit gegen antidemokratische Sabotage; die Grünen unterstützen die Wahl ohne Verzögerung.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dr. Irene Mihalic (Grüne) interveniert in einer GO-Debatte des AfD-Abgeordneten Baumann und wirft diesem vor, die Geschäftsordnungs-Diskussion zur Sabotage des geplanten Wahlverfahrens für Bundesverfassungsrichter zu missbrauchen. Sie attackiert die AfD direkt: „Sie machen es sich zur Aufgabe, demokratische und rechtsstaatliche Institutionen verächtlich zu machen und parlamentarische Prozesse zu sabotieren" und erinnert an die gescheiterte Wahl vor der Sommerpause, die durch eine „rechtsextremistische Diffamierungskampagne" gegen eine Kandidatin verhindert wurde. Mihalic fordert, die Wahl in dieser Woche durchzuführen (alle drei vom Richterwahlausschuss mit Zweidrittelmehrheit bestätigten Kandidaten), und lehnt ab, demokratische Verfahren durch extremistische Störkampagnen blockieren zu lassen.

**Original-Auszug (Mitte, ~600 chars):**
```
…schäftsordnung. Ihnen geht es auch nicht darum, wie wir hier die Tagesordnung miteinander gestalten.
– Nein, es geht Ihnen ganz sicher nicht um Deutschland, und es geht Ihnen auch nicht ums Bundesverfassungsgericht.
Was Sie vom Bundesverfassungsgericht halten, Herr Baumann, können wir in regelmäßigen Äußerungen gerade aus Ihrer Fraktion hören, nämlich gar nichts. Sie machen es sich zur Aufgabe, demokratische und rechtsstaatliche Institutionen verächtlich zu machen und parlamentarische Prozesse zu sabotieren. Aus keinem anderen Grund machen Sie hier diese GO-Debatte.
Herr Baumann, diesen einen …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 14. Ayse Asar (BÜNDNIS 90/DIE GRÜNEN) — ID212810500

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `diffamiert`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Ayse Asar (Grüne) verteidigt die Wissenschaftsfreiheit gegen Angriffe von rechts und von der Bundesregierung: Sie dokumentiert die Einschüchterung von Forschenden (Gewaltandrohungen, „Merkels Vasallen"-Hetze gegen Corona-Forscher, „Ökofaschisten"-Diffamierung von Klimaforschern) und zeigt das Versagen der Wissenschaftsministerin Bär, die statt Schutz für die attackierte Juraprofessorin Brosius-Gersdorf „ein bisschen Resilienz" forderte. Sie kontrastiert dies mit dem US-Beispiel (J.D. Vance: „Professoren sind der Feind") und fordert: 3,5 % BIP für F&E (statt Budgetkürzung um 1 Mrd), kein BAföG-Sparpaket, europäische Forschungsfinanzierung — nicht nur „Sonntagsreden".

**v2.1-Summary (neu):**
> Ayse Asar (BÜNDNIS 90/DIE GRÜNEN) argumentiert konfrontativ-belegend für Wissenschaftsfreiheit gegen innenpolitische und internationale Angriffe auf Forschende: Sie zitiert J.D. Vance ('Die Professoren sind der Feind'), nennt konkrete deutsche Fälle (Brosius-Gersdorf als Ziel von Hetzkampagnen, Klimaforscher als 'Ökofaschisten' diffamiert, Coronaforscher als 'Merkels Vasallen' beschimpft) und kritisiert Ministerin Bär, die der Juraprofessorin statt Schutz nur 'ein bisschen Resilienz' empfohlen habe — das widerspreche der Pflicht zur aktiven Schützung von Forschenden. Ihre zentralen Forderungen: Erhöhung des F&E-Anteils auf 3,5 Prozent des BIP statt der aktuellen Kürzung des Forschungsetats um knapp 1 Milliarde Euro, Stopp der BAföG-Kürzung um 250 Millionen Euro, dauerhafte Grundfinanzierung und adequate Ausstattung des Europäischen Forschungsraums; Frame: 'Wissenschaftsfreiheit rettet Leben – jeden Tag'.

**Original-Auszug (Mitte, ~600 chars):**
```
…achter aufzutreten.
Und was tut die Bundesregierung? Statt die Juraprofessorin zu schützen, forderte Frau Ministerin Bär bei „Maischberger“ von Frau Brosius-Gersdorf „ein bisschen Resilienz“. Es ist grundfalsch, als Wissenschaftsministerin Forschende dazu anzumahnen, Hetze zu ertragen.
Das, was in den USA passiert, ist auch deshalb möglich, weil dort ein großer Teil der Bevölkerung der Wissenschaft misstraut. Dabei sichert Wissenschaft unser Überleben.
Ich sage das auch ganz persönlich: Meine Tochter lebt mit Typ-1-Diabetes. Noch vor 100 Jahren wäre das ein Todesurteil gewesen. Die Entdeckung …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 15. Ulrike Schielke-Ziesing (AfD) — ID213016300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Ulrike Schielke-Ziesing (AfD) bringt den Antrag zur Aufnahme von Bundestagsabgeordneten in die gesetzliche Rentenversicherung ein und wirft der Koalition Heuchelei vor: während Machalet und Linnemann 2023 Zustimmung zum Plan signalisiert hätten, sei nichts umgesetzt worden — weil das aktuelle System Abgeordneten (nach nur 4 Jahren = 1.100 Euro Pension) großzügigere Versorgung garantiere als Durchschnittsarbeitnehmer nach 28 Jahren Beitrag erhalten. Sie attackiert die Rentenpolitik als „heruntergewirtschaftet durch Ignoranz" derjenigen, die selbst nicht von den Folgen betroffen sind, kritisiert versicherungsfremde Leistungen und internationale Klimahilfen (11,8 Mrd €) als Verschwendung, und rahmt Rentenerhöhungs-Pläne und Boomer-Soli als „sozialistische Umverteilung" statt echte Rentenpolitik — der Schluss ist ein direkter Druck-Appell an die Koalition mit Merz-Angriff (120 Mrd € Rentenloch im Juni 'nicht bekannt').

**v2.1-Summary (neu):**
> Ulrike Schielke-Ziesing (AfD) bringt einen Antrag zur Aufnahme von Bundestagsabgeordneten in die gesetzliche Rentenversicherung ein und rahmt ihn als Gerechtigkeits-Forderung: Abgeordnete erhalten nach nur vier Jahren über 1.100 Euro Pension, während Durchschnittsarbeitnehmer dafür 28 Jahre arbeiten müssen — das zeige die „Wurschtigkeit" und Heuchelei der etablierten Politiker, die das Rentensystem „heruntergewirtschaften". Sie greift die geplante Rentenpolitik der Regierung an (Arbeit mit 70, Boomer-Soli, Pflegegrad-1-Streichung) und attackiert Merz scharf als Bundeskanzler, der bei Maischberger die 120-Milliarden-Euro-Kosten für Rentenvorhaben nicht kannte — die fehlende Rente werde durch „sozialistische Umverteilung" finanziert, während 11,8 Milliarden für internationale Klimahilfe ausgegeben würden.

**Original-Auszug (Mitte, ~600 chars):**
```
… Heute leidet die Rentenkasse unter milliardenschweren versicherungsfremden Leistungen zulasten der Beitragszahler. Diese sollen sich mit einem mickrigen Rentenniveau von 48 Prozent zufriedengeben, und das dicke Ende kommt erst noch. Kaum ein Bürger weiß: Bis Ende 2027 werden die Rücklagen der Rentenversicherung bis aufs Minimum geleert, damit die Beiträge erst dann explodieren, wenn
Sie Ihre Sessel schon geräumt haben – natürlich nicht, ohne Ihre üppigen Pensionsansprüche mitzunehmen.
Die Rente hängt zu fast 30 Prozent am Tropf des Bundeshaushaltes. Umso schlimmer, wenn Zuschüsse erst gesetzl…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 16. Helge Lindh (SPD) — ID213104800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Helge Lindh (SPD) antwortet auf den AfD-Antrag zu Migration mit konfrontativer Kritik der Heuchelei und Doppelmoral: Er kontrastiert arbeitsintegrierten geflüchteten Syrerinnen und Syrern (Logistik, frühkindliche Bildung) mit dem AfD-Funktionär Philipp R., der trotz Schreckschuss-Bedrohung syrischer Jugendlicher (2022), Trunkenheit, illegalen Gegenständen und fehlender Sicherheits-Zertifizierung weiter in AfD-Kreisvorstand tätig ist — und wirft der AfD Sprachdehumanisierung ('Asylsyrer'), Opportunismus zu Syrien ('sicher' unter Assad, 'sicher' nach Sturz) und Doppelstandards zu Islamismus vor. Sein Schluss-Kontrastargument: Verlassen alle geflüchteten Arbeiter das Land, müsste Deutschland schließen; verlassen alle AfD-Funktionäre, wäre es besser bestellt.

**v2.1-Summary (neu):**
> Helge Lindh (SPD) konfrontiert die AfD-Fraktion mit konkreten Beispielen ihrer angegeblichen Sicherheits-Prioritäten und wirft Doppelmoral vor: einerseits würdigt er syrische Migranten (syrische Familie seit 2016, Arbeits-Beiträge in Bildung und Logistik), andererseits deckt er auf, dass die AfD den Mitarbeiter Philipp R. trotz Bedrohung syrischer Jugendlicher mit Schreckschusswaffe (2022), Trunkenheits-Verurteilung und aktueller AfD-Funktionsämter beschäftigte — ein „personifiziertes Sicherheitsrisiko". Er kritisiert die stigmatisierende Bezeichnung „Asylsyrer" als Verstoß gegen Menschenwürde und Grundgesetz; stellt die faktische Unmöglichkeit dar, Asyl ohne irregulären Grenzübertritt zu beantragen; und wirft der AfD vor, bei Syrien-Stabilität unter Assad das gleiche gesagt zu haben wie nach dessen Fall — „Opportunismus, doppelte Standards". Kontrastiv warnt er: Abzug aller Geflüchteter würde Systeme kollabieren lassen, Abzug aller AfD-Funktionäre hingegen das Land „sicherer, wohlhabender" machen.

**Original-Auszug (Mitte, ~600 chars):**
```
…un Sie doch nicht so, als wäre es eine Charaktereigenschaft von Menschen, Flüchtling zu sein. Lesen Sie das Grundgesetz! Dann wissen Sie: Alle sind Menschen.
Dann zur Illegalität. Da schaffen Sie wirklich Paradoxie höchster Ordnung. Erstens. Es stimmt nicht, dass in der Ära Merkel alle Illegalen Aufnahme gefunden haben. Das ist faktisch unwahr. Zweitens wissen Sie genau, dass es praktisch nicht anders möglich ist, Asyl zu beantragen als durch einen irregulären Grenzübertritt; auch das verschweigen Sie. Angenommen, Personen wären illegal eingereist, dann ist das illegale Einreise; aber die Mens…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 17. Johannes Rothenberger (CDU/CSU) — ID213105400

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Johannes Rothenberger (CDU/CSU) verteidigt gegen die AfD-Aktuelle Stunde die EU-Chatkontrolle als ausgewogenen Schutz von Kindern vor sexualisierter Gewalt: er lehnt anlasslose generelle Scans ab, unterstützt aber die Linie des Europäischen Parlaments (Scannen nur in eng definierten Fällen, als letztes Mittel, bei konkretem Verdacht, mit richterlicher Anordnung). Die Bundesregierung bewahrt die Vertraulichkeit privater Kommunikation laut Koalitionsvertrag und verfolgt einen europäischen Ansatz. Rothenberger attackiert die AfD-Kampagne als Stimmungsmache — „deutsches Nein zur EU" sei möglicherweise „ein Versuch, die europäische Gemeinschaft zu destabilisieren" — und kritisiert die 2.000+ Massenmails als nicht hilfreich, während die EU als „Garant der Freiheit" dargestellt wird.

**v2.1-Summary (neu):**
> Johannes Rothenberger (CDU/CSU) verteidigt den EU-Chatkontroll-Proposal des Europäischen Parlaments gegen die AfD-initiierte Aktuelle Stunde: Die EU sei kein Gegner der Freiheit, sondern ihr Garant; ein ausgewogener Kompromiss schütze Kinder vor sexualisierter Gewalt durch eng begrenzte, richterlich angeordnete Scans bei konkretem Verdacht — ohne anlasslose Massenüberwachung. Rothenberger kritisiert die AfD-Kampagne (2.000+ standardisierte Massenmails) als Stimmungsmache, die Sorgen ausnutzt, statt konstruktive Kinderschutz-Vorschläge zu machen.</zusammenfassung_2_saetze

**Original-Auszug (Mitte, ~600 chars):**
```
… vorgegeben: kein generelles Scannen von Nachrichten, nur in einzelnen eng definierten Fällen, nur als letztes Mittel bei konkretem Verdacht, nur zeitlich begrenzt und nur mit richterlicher Anordnung. Damit kann es gelingen, Kinder vor sexueller Gewalt zu schützen und die Verbreitung dieser Taten zu verhindern.
Gleichzeitig ist der Eingriff in die freie Kommunikation beschränkt auf ein Minimum. Das ist ein ausgewogener Vorschlag des Europäischen Parlaments.
Und nun ringen die einzelnen Länder innerhalb der EU um eine gemeinsame Position. Sie machen es sich dabei auch nicht leicht. Wir brauchen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 18. Donata Vogtschmidt (Die Linke) — ID213105700

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Donata Vogtschmidt (Die Linke) wendet sich mit harsch ironischem, jugendsprachlichem Stil gegen die geplante EU-Chatkontrolle und prangert die Doppelmoral der Bundesregierung an: während massenhafte Überwachung aller Bürger unter dem Vorwand des Kinderschutzes geplant sei, schließe die Regierung Sicherheitsbehörden und Militär von derselben Kontrolle aus — das Kabinett habe nur auf öffentlichen Druck reagiert und die Debatten intransparent im Digitalausschuss geführt. Statt Chatkontrolle fordert sie echten Kinderschutz durch ausreichende Finanzierung von Jugendhilfe, digitaler Bildung und Bekämpfung sozialer Ungleichheit; ihr Abschlusswortspiel ('C wie Chatkontrolle') kontrastiert die konservative Fixierung auf absurde Symbolfragen (vegetarische Wurst-Namen) mit der Feigheit gegenüber Grundrechten.

**v2.1-Summary (neu):**
> Donata Vogtschmidt (Linke) lehnt die EU-weite Chatkontrolle ab und kritisiert die Bundesregierung scharf für Geheimpolitik und Doppelmoral: während private Chats massenhaft gescannt werden sollen (mit hohem Fehlerpotenzial), seien Sicherheitsbehörden und Militär ausgenommen — echten Kinderschutz könne man nur durch Investitionen in Jugendämter, digitale Bildung und Bekämpfung der sozialen Ungleichheit erreichen, nicht durch Überwachung. Sie attackiert mit Sarkasmus (Dickpics-Spitze, Wortspiel auf CDU als „Chatkontrolle-Union") und kündigt an, den Linke-Antrag gegen Chatkontrolle in den kommenden Wochen ins Plenum zu bringen statt sofort abstimmen zu lassen.

**Original-Auszug (Mitte, ~600 chars):**
```
…behörden. Was für eine Farce!
Der Innenminister spuckt große Töne. Aber sucht das BKA wenigstens nach Darstellungen sexualisierter Gewalt bei Kindern und veranlasst auch das Löschen? Nö. Nur eine zweistellige Zahl von Leuten beim BKA ist mit der Strafverfolgung in diesem Bereich befasst. Ist das die versprochene höchste Priorität, lieber Herr Wildberger, lieber Herr Dobrindt?
Ursula von der Leyen von der CDU ist übrigens verantwortlich dafür, dass die Chatkontrolle überhaupt erst ins Rollen kam, während sie selbst keine Kontrolle über eigene Chats hat und es anscheinend auch regelmäßig proakti…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 19. Luke Hoß (Die Linke) — ID213201900

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Luke Hoß (Die Linke) lehnt den AfD-Gesetzentwurf zur Einschränkung von Hausdurchsuchungen ab und deckt eine zentrale Heuchelei auf: während Brandner und Weidel selbst Hunderte Politikerbeleidigungsanzeigen erhoben (mit dem Folgeeffekt bewaffneter Polizisten vor der Haustür), will die AfD jetzt Hausdurchsuchungen abschaffen — nicht aus Gerechtigkeitsmotiven, sondern um Ermittlungen gegen Hate Speech und Rassismus zu erschweren und die „rechte Hetzbande" vor Konsequenzen zu bewahren. Gegen die AfD-Doppelmoral setzt Hoß ein soziallinkisches Gerechtigkeitsargument: echte Strafrechtsreformen müssten Ersatzfreiheitsstrafen für Arme abschaffen (Beispiel: Mutter muss Kind im Frauenhaus zurücklassen, weil sie sich ÖPNV-Ticket nicht leisten konnte), Unternehmensstrafrecht einführen, und nicht — wie AfD mit höheren Kinderstrafen und Verzicht auf Resozialisierung — menschenfeindlicher werden. Der Ordnungsruf des Präsidiums dokumentiert die Schärfe: Hoß wird gerügt, wirft der Affaire persönliche Betroffenheit vor und kontert polemisch.

**v2.1-Summary (neu):**
> Luke Hoß (Die Linke) lehnt den AfD-Gesetzentwurf zur Einschränkung von Hausdurchsuchungen bei Ehrverletzungsdelikten ab und wirft der AfD fundamentale Heuchelei vor: Während Brandner und Weidel selbst hunderte Anzeigen wegen Politikerbeleidigung (§ 188 StGB) gestellt haben, möchte die AfD eben diesen Paragraf jetzt abschaffen — echter Grund sei nicht der Schutz vor Staatsübergriffen, sondern die Ausweitung des Spielraums für Hetze gegen Queers, Menschen mit Migrationsgeschichte und Frauen. Er kontrastiert dies mit echten Strafrechtsgerechtigkeitsproblemen: Armut führe zu Kriminalität (z.B. Frauen im Frauenhaus, die sich Busticket nicht leisten können und dann ins Gefängnis müssen), AfD-Politiker würden Kindermisshandlung begehen oder Mietwucher ermöglichen, ohne Konsequenzen zu fürchten — doch davon interessiere die AfD die 'Bohne'. Sein Schlussframe: AfD sei nicht Anwalt der kleinen Leute, sondern der reichen, die 'sich die Taschen vollmachen'.

**Original-Auszug (Mitte, ~600 chars):**
```
…lität von denen, die sich krummbuckeln und trotzdem nicht genug haben. Das ist die Folge von menschenfeindlichem Strafrecht.
Und Sie? Sie sind nur hier, weil Sie sich wie alle anderen einfach nur die Taschen vollmachen wollen.
Sie würden sich genauso wie Merz und Co erst mal eine fette Gehaltserhöhung gönnen. Von der Realität der Menschen, für die Sie vorgeben zu sprechen, haben Sie keine Ahnung.
Und – das ist noch schlimmer – es interessiert Sie auch nicht. Ganz grundsätzlich: Wie auch in diesem Gesetzentwurf, den wir hier heute diskutieren müssen, statt uns um die vielen in diesem Land zu kü…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 20. Dr. Stefanie Hubig ((Reg)) — ID213312700

- **v1-flagged Wort:** `diffamiert`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Stefanie Hubig (BMin Justiz) verteidigt das Bundesverfassungsgericht als Institution und widerspricht explizit dem Vorwurf mangelnden Respekts: sie unterstreicht die Unabhängigkeit des Gerichts und bekräftigt ihre Juli-Aussage als richtig, mahnt zur Verfahrenstreue und kritisiert die Politisierung des Besetzungsprozesses, bei der „eine anerkannte Wissenschaftlerin auf eine Art und Weise diffamiert und angegangen worden" sei, „wie es nicht akzeptabel ist in einem Rechtsstaat". Positiv hebt sie hervor, dass der Bundestag im zweiten Durchgang drei hervorragende Richterinnen und Richter gewählt habe, sodass das Gericht wieder vollständig arbeitsfähig sei.

**v2.1-Summary (neu):**
> Dr. Stefanie Hubig (Bundesministerin der Justiz) verteidigt das Bundesverfassungsgericht gegen Kritik und widerspricht dem Vorwurf der mangelnden Vorsicht: Das Gericht werde von der Bundesregierung respektiert und habe „hervorragende Richterinnen und Richter". Sie kritisiert die Politisierung des Nominierungsverfahrens, insbesondere die Diffamierung „einer anerkannten Wissenschaftlerin auf eine Art und Weise, wie es nicht akzeptabel ist in einem Rechtsstaat". Abschließend würdigt sie die erfolgreiche Neuwahl dreier Kandidaten im zweiten Durchgang und betont die Notwendigkeit, das Verfahren und das Gericht zu respektieren.</zusammenfassung_2_saetze</zusammenfassung_2_saetze> <parameter name="rhetorische_mittel">[   "direkte Widerspruchsmarkierung ('Da muss ich Ihnen deutlich widersprechen')",   "Wiederholung persönlichen Positionalverlöbnisses ('hinter meinem Zitat stehe ich heute noch genauso')",   "Lob der Institution und ihrer Akteure",   "Mahnung zur Prozessintegritätserhaltung" ]

**Original-Auszug (Mitte, ~600 chars):**
```
…mand macht es sich zur Beute. Da muss ich Ihnen deutlich widersprechen.
Es gibt ein etabliertes Verfahren. Hinter meinem Zitat stehe ich heute noch genauso wie im Juli. Mein Zitat ist richtig. Dieses Gericht verfügt über hervorragende Richterinnen und Richter. Es geht darum, dass dieses Verfahren nicht politisiert wird. Das ist jedoch geschehen. Es ist hier eine anerkannte Wissenschaftlerin auf eine Art und Weise diffamiert und angegangen worden, wie es nicht akzeptabel ist in einem Rechtsstaat.
Es ist gut, dass der Bundestag in einem zweiten Durchgang drei hervorragende Kandidaten – zwei Kand…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 21. Stefan Keuter (AfD) — ID213314000

- **v1-flagged Wort:** `diffamiert`
- **v2.1 enthält noch:** `diffamiert`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Stefan Keuter (AfD) attackiert die Bundesregierung in scharfem Ton als sicherheitspolitischen «Zaungast mit moralischem Megafon und sicherheitspolitischem Kleinwagen» und wirft ihr «ideologisches Schönfärben» (Gendersternchen statt Flugabwehrsysteme), Zögern und mangelnde Wehrwilligkeit vor — während Russland Krieg führe, China rüste auf und Drohnen über Deutschland flögen (spekulativ). Konkret fordert er materielle, personelle und rechtliche Reformen, klare Prioritäten ohne «rhetorische Nebelkerze», und Bildung/Wertevermittlung als Basis für Wehrwilligkeit; implizit appelliert er an die CDU/CSU, mit der AfD zusammenzuarbeiten «ohne Brandmauer im Kopf», und diffamiert die SPD als Bremserin einer «feministischen Außenpolitik».

**v2.1-Summary (neu):**
> Stefan Keuter (AfD) attackiert die Bundesregierung und das Establishment in einer polemischen Sicherheitspolitik-Rede: Nach Jahren des Wegsehens und des Kleinredens reagiere die Regierung nur mit „sicherheitspolitischen Kaffeekränzchen" auf konkrete Bedrohungen (Russland-Krieg, China-Rüstung, Nahost-Krise), nicht als stabiler Pfeiler sondern als „sicherheitspolitischer Zwerg". Die Wehrpflicht-Debatte sei absurd (Losverfahren, SMS-Voting), die Regierung manipulieren Medien-Narrativ statt klare Linien zu ziehen und Wehrwilligkeit durch Bildung und Nationalstolz zu stärken; ungeklärte Drohnen über deutschen Städten würden reflexhaft Russland zugeschoben. Keuter rahmte die AfD als Früherkenner dieser Bedrohungslage, beschuldigt die Medien der Desinformation (Sicherheitspolitiker als „Hardliner", „Populisten", „gefährlich" diffamiert) und fordert die Union auf: entweder mit der SPD enden oder ohne „Brandmauer" mit der AfD einen echten Kurswechsel einleiten." 

**Original-Auszug (Mitte, ~600 chars):**
```
…t an der Bundeswehr; das liegt an der politischen Führung, die lieber in Talkshows glänzt, als in Lagezentren zu handeln.
Wir brauchen entschlossene materielle, personelle und rechtliche Reaktionen.
Und die dafür nötigen Mehrheiten in diesem Hause wären jenseits der, um es mit Franz Josef Strauß zu sagen, „vaterlandslosen Gesellen“ da.
Wenn Sie diese aber nicht nutzen, zeigt das nur, wie wenig ernst sie es mit dieser Aktuellen Stunde und mit der Sicherheit unserer Heimat nehmen.
Die Regierung verweist nur auf ihre halbherzigen Reaktionen.
– Ich habe einen gebrochenen Zeh, vielen Dank. Schön, d…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 22. Maximilian Kneller (AfD) — ID213402100

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Maximilian Kneller (AfD) attackiert Ferat Koçak polemisch, indem er ein TikTok-Video mit einem Liedtext zitiert, in dem explizit «Molotows als Antwort auf Tränengase» und «Jedes Bullenschwein ist 'ne Missgeburt» vorkommen — und wirft Koçak Heuchelei vor, weil dieser behauptet habe, niemand verharmlosen Linksextremismus, während er selbst Polizeigewalt verherrliche. Knellers Schlussfrage ist ein faktischer Rücktrittsaufruf: «Sollten Sie nicht Ihr Mandat zurückgeben?» — rahmt als Abweichung von der Anständigkeit, die der Inschrift «Dem deutschen Volke» entspreche.

**v2.1-Summary (neu):**
> Maximilian Kneller (AfD) attackiert Ferat Koçak (Grüne) mit Sarkasmus ('Danke für die Show') und zitiert vollständig ein TikTok-Video, in dem Koçak ein Lied mit expliziten Gewaltaufrufen gegen Polizei singt: 'Molotows als Antwort auf Tränengase', 'Steine fliegen, Helme krachen, Barrikaden, Straßenschlachten'. Kneller wirft Koçak Heuchelei vor — dieser habe eben behauptet, niemand würde Linksextremismus verharmlosen, singt aber selbst ein Lied mit Revolutionsaufruf. Finale Attacke: als 'deutscher Volksvertreter' sei ein Mandat-Rücktritt angebracht.

**Original-Auszug (Mitte, ~600 chars):**
```
…rscht Anarchie, spuck’ auf eure Regeln.
Schirme hoch gegen Tränengase. Riechst du den Dampf der Pyrotechnik? Nieder mit euren Führungsketten. Dahabflex kommt wie Mao und Stalin.
Chill’ im schwarzen Block, nicht in Sansibar. Jedes Bullenschwein ist ’ne Missgeburt. Hau ’nem Rechten aufs Maul, auf die linke Tour.
Molotows als Antwort auf Tränengase. Fick die USA, fick die Emirate. Bullenwagen versperr’n wieder jede Straße. Steine fliegen, Helme krachen, Barrikaden, Straßenschlachten. Wir tanzen im Nebel der Repression. One Solution:“
– jetzt genau zuhören –
„revolution.“
Finden Sie es angemessen,…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 23. Stephan Mayer (CDU/CSU) — ID213413000

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Stephan Mayer (CDU/CSU) wirbt für die Verlängerung des UNMISS-Einsatzes um ein Jahr (Kosten: 1 Million Euro) und die Fortsetzung der deutschen humanitären Hilfe im Südsudan (32 Millionen Euro 2025) als ethische Verantwortung angesichts einer humanitären Katastrophe: 69 Prozent der 9,3 Millionen Südsudanesen sind täglich auf Hilfe angewiesen; 1,8 Millionen sind Binnenvertriebene, 2,3 Millionen Flüchtlinge im Ausland, 1,1 Millionen aus dem Sudan dazugekommen. Er attackiert Doppelmoral-Vorwürfe gegen die Rede (Kritik an deutschen Soldaten bei gleichzeitiger Hilfsförderung) und rahmt die Mission als effektiven Beitrag zur Sicherung humanitärer Logistik durch die UNMISS-Koalition (17.000 Soldaten).

**v2.1-Summary (neu):**
> Stephan Mayer (CDU/CSU) argumentiert für die Verlängerung des UNMISS-Einsatzes im Südsudan: Das jüngste und ärmste Land der Weltgemeinschaft ist durch Bürgerkrieg (2013–2015, 2016–2018), Naturkatastrophen, Cholera-Epidemie (49.000 Erkrankte, 900 Tote), Korruption und sexualisierte Gewalt schwer gebeutelt; eine humanitäre Katastrophe mit 1,8 Mio Binnenvertriebenen, 2,3 Mio Geflüchteten und 1,1 Mio Sudanesen im Land, von denen 69 % (9,3 Mio) tagtäglich auf Hilfe angewiesen sind. Deutschland investiert 32 Mio Euro Entwicklungsgelder jährlich und trägt mit 1 Mio Euro zur UNMISS-Verlängerung bei — die 17.000 Soldaten und 2.100 Polizisten der Mission seien unverzichtbar, um humanitäre Hilfe zu sichern; eine direkte Kontra an Kritiker, die deutschen Einsatz ablehnen, aber humanitäre Hilfe fordern ('hanebüchene Doppelmoral')."

**Original-Auszug (Mitte, ~600 chars):**
```
…n, und andererseits weiterhin humanitäre Hilfe fordern. Das eine bedingt das andere.
Deutschland ist – und darauf können wir schon ein Stück weit stolz sein – nach wie vor einer der größten humanitären Unterstützer des Südsudans.
Allein in diesem Jahr investieren wir 32 Millionen Euro. Die Verlängerung des UNMISS-Einsatzes um ein Jahr – das ist heute interessanterweise noch gar nicht genannt worden – kostet gerade einmal 1 Million Euro. Ich glaube, es ist gut angelegtes Geld, wenn wir mit unseren Soldatinnen und Soldaten – insgesamt umfasst die UNMISS-Mission immerhin 17 000 Soldaten und über …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 24. Manuel Krauthausen (AfD) — ID213614900

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Manuel Krauthausen (AfD) attackiert die bevorstehende COP29 in Belém als hyperkorpulentes Klimatheater: 70.000 Delegierte flögen CO2-intensiv nach Brasilien (COP25: 51kt, COP26: 131,5kt, COP27: 62,6kt CO2; kumulativ 2-3 Mio Tonnen über 29 COPs), während die Bundesregierung deutsche Bürger mit Heizungsverboten und CO2-Steuern drangsaliere — „Doppelmoral der grünen Ökosozialisten". Sein Schlussmandal: Natur und Umwelt lokal schützen, aber „Quatsch mit dem Klima" lassen; AfD-Positionierung als Anti-Klimapolitik-Partei mit Wahlaufruf.

**v2.1-Summary (neu):**
> Manuel Krauthausen (AfD) lehnt die Teilnahme Deutschlands an Weltklimakonferenzen ab und kritisiert sie als gigantische CO2-Verursacher: Die COP25 in Madrid (51.000t CO2), COP26 in Glasgow (131.500t) und COP27 in Ägypten (62.600t) hätten zusammen 2–3 Millionen Tonnen CO2 erzeugt, während 70.000 Delegierte Regenwald abholzen ließen für Hotels und Straßen — ein „Klimatheater" und „Champions League der grünen Doppelmoral". Seine Forderung: Deutschland solle Heizungsverbote und CO2-Steuern stoppen, seine Industrie schützen und statt globaler Klimapolitik lokalen Natur- und Umweltschutz betreiben; sein Schlusswort lautet: „Schützen Sie die Natur und die Umwelt, aber lassen Sie den Quatsch mit dem Klima!"

**Original-Auszug (Mitte, ~600 chars):**
```
…ktionäre und Lobbyisten über die Rettung des Klimas diskutieren können. Das ist fast so, als würde einer von der freiwilligen Feuerwehr jedes Jahr einen Großbrand legen, damit er im Dorf überhaupt Arbeit hat.
Während also Zehntausende Delegierte, von denen mit Sicherheit keiner mit dem Fahrrädchen, zu Fuß oder mit dem Segelbötchen anreist, während 70 000 Mann nach Brasilien fliegen und dafür Hunderte Hektar des Regenwaldes abgeholzt wurden, damit dort Straßen und Hotels entstehen, wird gleichzeitig überlegt, wie man den grünen Ökosozialismus nutzen kann, um den Menschen in den Industriestaaten…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 25. Pascal Reddig (CDU/CSU) — ID213615500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Pascal Reddig (CDU/CSU) lehnt den Grünen-Antrag als „Wischiwaschi-Antrag" und bloße „Schaufensterpolitik" ab und kontrastiert die Grünen-Ungeduld (dreieinhalb Jahre als Kulturstaatsminister untätig, jetzt plötzlich vehement) mit der Koalitions-Kontinuität: im Koalitionsvertrag sei vereinbart worden, eine Digitalabgabe zu prüfen — die zielgerichtet mit Zweckbindung für Kultur- und Medienschaffende ausgestaltet werden solle, nicht als allgemeine Steuererhöhung. Als Beleg für Grünen-Heuchelei nennt er eine Recherche, derzufolge die Grünen selbst 1,2 Millionen Euro in Meta-Werbung steckten (über 6.000 Anzeigen), während sie die Plattformen nun kritisieren — ein Glaubwürdigkeitsproblem, das er als „mindestens unglaubwürdig" charakterisiert; sein Frame ist Verlässlichkeit und Rechtssicherheit statt Symbolpolitik.

**v2.1-Summary (neu):**
> Pascal Reddig (CDU/CSU) attackiert den Grünen-Antrag zu Digitalkonzernen-Besteuerung als konkretionslose 'Schaufensterpolitik' und wirft den Grünen Heuchelei vor: Nach 3,5 Jahren als Kulturstaatsministerin ohne Digitalabgabe-Initiative, gaben sie selbst 1,2 Millionen Euro an Meta-Plattformen für Wahlwerbung aus — das ist laut Recherche des 'Magazins für Kommunikation' Spitzenreiter. Inhaltlich befürwortet er eine zweckgebundene Digitalabgabe (nicht allgemeine Steuererhöhung) für Kultur- und Medienschaffende, lehnt aber die sachfremde Vermischung von Steuerlast mit Meinungsbildungs-Kritik im Grünen-Antrag ab und plädiert für rechtssichere, europarechts-konforme Lösung statt Symbolismus.

**Original-Auszug (Mitte, ~600 chars):**
```
…r, ehrlich gesagt, sachfremde Erwägungen für den Antrag, weil es da um die Frage geht: Steuerlast, ja oder nein?
In dem Zusammenhang ist ein Aspekt übrigens sehr bemerkenswert: Frau Dr. Lührmann, Sie haben in Ihrer Rede gesagt, es könne nicht angehen, dass man die Taschen der Konzerne, die Taschen von Meta und Zuckerberg weiter vollmacht. Laut einer interessanten Recherche des „Magazins für Kommunikation“, das analysiert hat, wer eigentlich im letzten Bundestagswahlkampf am meisten Geld auf diesen Plattformen ausgegeben hat,
flossen 1,2 Millionen Euro von den Grünen allein an die Meta-Plattfor…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 26. Enrico Komning (AfD) — ID213708600

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Jörg Cezanne (AfD) verdammt den Energiewirtschafts-Gesetzentwurf als „bürokratisches Monstrum" aus Ideologie und Planlosigkeit, das nichts mit echter Entlastung zu tun habe — die Gasspeicherumlage-Finanzierung aus dem Klima- und Transformationsfonds sei nur ein „Taschenspielertrick auf Kosten der Steuerzahler", und die Kohleausstieg-Entschädigungen bewiesen, dass es der Regierung allein um „ideologische Zwangstransformation" gehe, nicht um Arbeitsplätze. Mit konkreten Zahlen (36% aller Unternehmen, 41% der Industriebetriebe planen Stellenabbau) rahmt er das als „Deindustrialisierung" und fordert eine radikale 180-Grad-Wende in Energie- und Wirtschaftspolitik, um wieder „Vertrauen, Arbeit und Wohlstand" zu schaffen — andernfalls folge Massenarbeitslosigkeit und wirtschaftlicher Zusammenbruch.

**v2.1-Summary (neu):**
> Jörg Cezanne (AfD) verdammt den Gesetzentwurf zum Energiewirtschaftsrecht als „bürokratisches Monstrum aus Ideologie, Planlosigkeit und Selbsttäuschung" und lehnt ihn als nicht zustimmungsfähig ab: Die Gasspeicherumlage-Entlastung sei ein „Taschenspielertrick" (Umlagetasche in Steuertasche über den Klima- und Transformationsfonds ohne Kontrolle), die Kohleausstiegs-Entschädigungsregelungen bewiesen, dass es der Regierung allein um „ideologische Zwangstransformation" gehe, nicht um Arbeitsplätze oder Wirtschaft. Er führt Deindustrialisierungs-Statistiken an (36% aller Unternehmen planen Stellenabbau, 41% in Industrie), verknüpft das mit kommender Massenarbeitslosigkeit und zerbrechenden Kommunal-Finanzen, und schließt mit einem Ultimatum: entweder eine „180-Grad-Wende" oder Regierungsrücktritt — „treten Sie beiseite, damit Deutschland wieder aufstehen kann".

**Original-Auszug (Mitte, ~600 chars):**
```
…allein um Ihre ideologische Zwangstransformation dieses Landes. Und deshalb sagen wir ganz klar: Das Gesetz ist nicht zustimmungsfähig.
Meine Damen und Herren von der Bundesregierung, über Ihre Energiepolitik lacht doch mittlerweile die halbe Welt, und der Rest profitiert vom Niedergang Deutschlands. Während in anderen Ländern die Industrie boomt, schließen in Deutschland die Werkstore. 36 Prozent aller Unternehmen wollen im nächsten Jahr Stellen abbauen. Bei den Industriebetrieben sind es sogar 41 Prozent. Nur noch jedes siebte Unternehmen wagt es, neue Arbeitsplätze zu schaffen. Das, meine D…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 27. Ates Gürpinar (Die Linke) — ID213710900

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Ates Gürpinar (Die Linke) attackiert den AfD-Antrag zur Gesundheitsversorgung von Menschen mit Migrationshintergrund als „offensichtlich rassistisch" und zeigt auf, dass die Gesundheitsversorgung aller durch Abbau gefährdet ist (30 Wochen Wartezeit auf Therapieplätze), nicht durch Geflüchtete — entgegen der falschen Behauptung des Kanzlers Merz. Im Kern wirft Gürpinar Sichert und Baum Doppelmoral vor: beide seien selbst Migranten aus wirtschaftlichen Gründen (Sichert Bayern→Friesland, Baum Baden-Württemberg→Sachsen-Anhalt nach Ablehnung durch Weidels Landesverband), wollten aber anderen Menschen verbieten, vor Krieg und Hunger zu fliehen. Die Linke fordert dagegen universalen Zugang zur Gesundheitsversorgung als UN-Menschenrecht mit Sprachmittlung und medizinischen (statt administrativen) Entscheidungen.

**v2.1-Summary (neu):**
> Ates Gürpinar (Die Linke) lehnt den AfD-Antrag zur Beschränkung der Gesundheitsversorgung für Menschen mit Migrationshintergrund als „offensichtlich rassistisch" ab und behauptet strukturelle Heuchelei: Die AfD-Antragsteller Sichert und Baum selbst migriert (Bayern→Friesland, BaWü→Sachsen-Anhalt), würden aber Geflüchteten der Flucht vor Krieg und Hunger verbieten wollen. Gürpinar kontrastiert dies mit UN-Menschenrecht auf Gesundheit, weist auf 30-Wochen-Wartezeiten für Kinderpsychologie-Plätze hin und fordert ärztliche statt administrative Kontrolle, Sprachmittlung und dass „die vermeintliche Mitte nicht den Rassismus" produzieren dürfe, den die AfD „ausspuckt". Ein Ordnungsruf ergeht für das Wort „braunes Zeug".

**Original-Auszug (Mitte, ~600 chars):**
```
…on keinen richtigen Zugang zur gesundheitlichen Versorgung im Land haben.
Den Geflüchteten wird schon jetzt ein richtiger Zugang verwehrt. In Sozialämtern entscheiden Nichtmediziner/-innen darüber, ob Geflüchtete gesundheitliche Versorgung erhalten oder nicht. Die Linke fordert das Gegenteil. Wir fordern einen guten Zugang für alle – mit Unterstützung vor allem für die Schwächsten im Land,
zum Beispiel mit Sprachmittlung. Denn die Ärmsten im Land sterben schon jetzt zehn Jahre früher als die Reichsten.
An dem Antrag verwundert eigentlich nur wenig. Aber ehrlicherweise bleibt mir dann doch imme…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 28. Dirk Brandes (AfD) — ID213802700

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `diffamiert`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dirk Brandes (AfD) verdammt die deutsche Energiepolitik als die „dümmste der Welt" (mit Verweis auf Analyst Mark P. Mills) und rahmt sie als „Ersatzreligion" mit dem Pariser Klimaschutzabkommen als „Bibel" und dem Bundestag als Opferaltar. Seine Forderungen sind: Rückkehr zu Kernkraft, Marktwirtschaft statt Subventionskaschierung, Abbau der staatlichen Umlagen und Steuern (die laut Brandes ~50% des Strompreises ausmachen), Ende der Redispatch-Millionenverschwendung und technologieoffene statt ideologische Energiepolitik — sein Schlussversprechen: „Sie haben ruiniert, wir werden reparieren."

**v2.1-Summary (neu):**
> Dirk Brandes (AfD) attackiert die Energiepolitik der Koalition (CDU/CSU, SPD, Grüne, Linke) als „die dümmste Energiepolitik der Welt" (Zitat des US-Analysten Mark P. Mills), die ein „politisch erzeugter Dauernotbetrieb" sei — Kernkraftwerke seien abgeschaltet, Kohle und Gas „systematisch diffamiert" und Deutschland in eine Rekord-Strompreis-Krise geführt worden (Vierfach-Haushalte zahlen doppelt so viel wie vor zehn Jahren, davon 50% durch staatliche Abgaben wie EEG-Umlage, Stromsteuer, CO2-Bepreisung). Die Energiewende rahmt Brandes als „Ersatzreligion" mit NGOs und öffentlich-rechtlichen Medien als „Priester"; als Schluss-Slogan: „Sie haben ruiniert, wir werden hier reparieren" — mit der AfD komme technologieoffene, marktwirtschaftliche Energiepolitik.

**Original-Auszug (Mitte, ~600 chars):**
```
…ugter Dauernotbetrieb, den wir abschalten werden.
Kommen wir doch mal zu den Verbrauchern, die das alles zahlen müssen. Eine vierköpfige Familie zahlt heute den doppelten Strompreis wie vor zehn Jahren.
– Doch, das stimmt absolut.
Und der Grund dafür ist nicht der Markt.
– Der Grund dafür sind nicht der Markt und nicht Wladimir Putin. Es ist das politisch erzeugte Preisgepäck: Es sind EEG-Umlagen,
es sind Nutzentgelte, Stromsteuer, Mehrwertsteuer, Offshore-Umlagen, CO2-Bepreisung und wie Sie die ganzen Dinge noch nennen.
Das macht circa 50 Prozent des Preises aus.
Das Schlimmste an der ganzen …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 29. Dr. Anna Rathert (AfD) — ID213914400

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Anna Rathert (AfD) greift den Adressaten Volkmann personal und psychologisch an: Sie unterstellt ihm mittels Großvater-Vergleich, 'das wahre Gesicht' zu zeigen, diagnostiziert 'Projektion' als Mechanismus seiner Kritik und behauptet, dass alle seine Vorwürfe gegen die AfD selbst aus der Luft gegriffen seien — während die AfD seinerseits 'Diffamierung, Isolierung, Verleumden' erfahre (Fallbeispiel: Weimer-Unterlassungserklärung). Das Präsidium erteilt einen Ordnungsruf wegen persönlicher Lügenbeschuldigung; Rathert setzt trotzdem fort und rahmt ihre Frage als psychologische Hilfsangebot mit unterschwelligem Sarkasmus.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dr. Anna Rathert (AfD) konfrontiert einen anderen Abgeordneten (Volkmann) in einer Fragestunde-ähnlichen Intervention direkt mit dem Vorwurf der Lügen und Diffamierung. Sie beschuldigt ihn, während eines Gesprächs mit amerikanischen Gästen „Lügen" über die AfD-Fraktion „auszukippen", wirft dem Kollegen Heuchelei vor (Anspielung auf dessen Großvater), und deutet auf eine Unterlassungserklärung des SPD-Politikers Weimer hin, die sie als Beleg für die Schwere der Vorwürfe interpretiert. Dann dreht sie die Anklage um: das, was Volkmann der AfD vorwerfe (Diffamierung, Isolation, Verleumdung), sei genau sein eigenes Verhalten. Nach einer Ordnungsruf-Unterbrechung durch das Präsidium wiederholt sie ihre Frage, ob Volkmann mit einem Psychologen über das Phänomen der Projektion gesprochen habe — als subtile Suggestion, dass seine Vorwürfe Projektionen seien.

**Original-Auszug (Mitte, ~600 chars):**
```
…wollte gerne wissen: War das ein Arbeits- und Organisationspsychologe oder ein psychologischer Psychotherapeut?
Und hatten Sie Gelegenheit, mit ihm auch mal über das psychologische Phänomen der Projektion zu sprechen? Denn alles, was Sie uns immer vorwerfen, ist genau das, was Sie selbst tun:
Sie diffamieren, Sie isolieren, Sie verleumden. Wir dürfen nicht vergessen, dass Herr Weimer eine Unterlassungserklärung unterzeichnet hat. Das macht man nicht, wenn die Vorwürfe aus der Luft gegriffen sind.
Aber was Sie hier immer gegenüber uns sagen, das sind Vorwürfe, die Sie aus der Luft greifen und s…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 30. Johannes Volkmann (CDU/CSU) — ID213914400

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `Skandalisierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Johannes Volkmann (CDU/CSU) konfrontiert die AfD mit drei Belegen ihrer 'hinter der bürgerlichen Maske' verborgen faschistischen Rhetorik: (1) Einsatz faschistischer Begriffe wie 'Sippenhaft' durch Renner/Gläser plus Lächerlich-Machung der Shoah-Opfer, (2) von Storchs Markus-Lanz-Eingeständnis, Namenslisten politischer Gegner an den US-Vizepräsidenten übergeben zu haben ('sehr viel über den Charakter Ihrer Partei'), (3) Skandalisierung des Weimer-Verlangen als Rache, weil Weimer als Staatsminister nicht mehr 'im politischen Sinne der AfD gehandelt' hat. Volkmann warnt deutsche Unternehmer: Die AfD misst ihr Handeln nicht nach Recht und Gesetz, sondern nach 'weltanschaulicher Loyalität'.

**v2.1-Summary (neu):**
> Johannes Volkmann (CDU/CSU) interveniert konfrontativ gegen ein AfD-Verlangen und benennt konkrete Beispiele: faschistische Vokabeln wie „Sippenhaft", Verhöhnung der Shoah-Opfer durch Renner, NS-Vergleich (antifaschistischer Schutzwall) durch Gläser, sowie die public Admission von Storch bei Markus Lanz, dass Namenslisten politischer AfD-Gegner an den US-Vizepräsidenten übergeben wurden. Er charakterisiert die AfD als getrieben von „weltanschaulicher Loyalität statt Recht und Gesetz" und betont: solange die politische Mitte die Mehrheit hält, wird die AfD „niemals Zugriff auf Machtressourcen" haben. Der Schluss benennt die Skandalisierung als Reaktion auf Weimers Enttäuschung der AfD-Hoffnungen.

**Original-Auszug (Mitte, ~600 chars):**
```
… die Parteien der politischen Mitte hier die Mehrheit bilden, Sie niemals Zugriff auf Machtressourcen in diesem Land haben werden.
Und weil Sie die Vereinigten Staaten angesprochen haben: Ich finde es schon bemerkenswert, dass sich die Kollegin von Storch bei „Markus Lanz“ in die Talkshow setzt und dort freigiebig zugibt, dass man dem Vizepräsidenten der Vereinigten Staaten Namenslisten mit politischen Gegnern der AfD übergeben hat.
Ich glaube, dass das sehr viel über den Charakter Ihrer Partei und den Zweck dieser Debatten in diesem Haus zeigt.
Jeder unternehmerisch tätige Deutsche sollte wis…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 31. Helge Lindh (SPD) — ID213915200

- **v1-flagged Wort:** `Diffamierungs`
- **v2.1 enthält noch:** `Diffamierungskampagne`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Helge Lindh (SPD) widerleget in einer konfrontativen Gegenrede den AfD-Antrag gegen die Amadeu Antonio Stiftung: Er nutzt das Chrupalla-Zitat »Mir hat Putin nichts getan« als Anker für die These, dass die AfD eine antidemokratische »Wunschvorstellung« von Zivil­gesellschaft-Ausschaltung (wie in Putins Russland) verfolge und mit Diffamierungs­kampagnen Hassmobilisierung in digitalen Räumen betreibe. Die Pointe: Die Amadeu Antonio Stiftung sei nicht »parteiisch im Wettbewerb«, sondern »parteiisch gegen antidemokratische, verfassungswidrige Haltung« — ein fundamentaler Unterschied. Lindh schließt mit direktem Appell an die Zivilgesellschaft, »ihr seid nicht allein«, trotz zweimaliger Ordnungsrufe.

**v2.1-Summary (neu):**
> Helge Lindh (SPD) verteidigt die Amadeu Antonio Stiftung gegen den AfD-Antrag und wirft der AfD vor, eine Diskreditierungs- und Diffamierungskampagne gegen sie zu führen — um letztlich die gesamte demokratiefördernde Zivilgesellschaft „plattmachen" zu wollen. Er argumentiert mit dem Chrupalla-Zitat („Mir hat Putin nichts getan") als Beleg für die AfD-Affinität zu autoritären Strukturen und konkretisiert: Zivilgesellschaft sei nicht parteiisch im Parteienwettbewerb, sondern „parteiisch gegen antidemokratische, verfassungswidrige Haltung"; daher sei „Chancengleichheit im Parteienwettbewerb" nicht dasselbe wie „Chancengleichheit für Hass, Rassismus und Verfassungswidrigkeit". Schluss: Solidarität mit der Amadeu Antonio Stiftung gegen die Benennung von Antisemitismus und Rassismus, die der Staat trotz dreistelliger Millionenzuwendungen an die AfD nicht adäquat bekämpfe.

**Original-Auszug (Mitte, ~600 chars):**
```
…wortet und Russland verharmlost, wenn ich mir anschaue, wie Sie tagtäglich in Ihren Portalen, Ihren Gruppen, Ihren Chatgruppen Menschen zum Hass freigeben, können wir doch dankbar sein für die Arbeit, die die Zivilgesellschaft leistet.
Die Zivilgesellschaft ist eben nicht gegen die AfD und für andere Parteien parteiisch im politischen Wettbewerb, nein, sie ist im Wettbewerb demokratischer Haltung parteiisch gegen antidemokratische, verfassungswidrige Haltung.
Denn Chancengleichheit im Parteienwettbewerb heißt eben nicht Chancengleichheit für Hass, Rassismus und Verfassungswidrigkeit.
Und es is…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 32. Enrico Komning (AfD) — ID214203300

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Enrico Komning (AfD) verdammt den Bundeshaushalt 2026 als „finanzpolitischen Offenbarungseid" der Merz-Koalition: 180 Mrd Euro neue Schulden, nur 5,9 Mrd im Wirtschaftsetat (statt 8), der er eine „grüne Kommandozentrale" nennt, die Subventionen „wie Lose auf dem Jahrmarkt" verteilt. Sein Gegenmodell: AfD-Haushalt mit 10 Mrd für Wirtschaft, 55 Mrd Steuersenkungen, marktwirtschaftliche Rohstoff- und Infrastruktur-Schwerpunkte, Deregulierung und Stopp aller „Klimafiktionen" und GAIA-X. Frame: „Planwirtschaft in Reinform" vs. „konservativ-liberale Wirtschaftspolitik"; Seitenhieb auf Außenpolitik (Kriegswirtschaft rechtfertige nur Rüstungs-Wachstum).

**v2.1-Summary (neu):**
> Enrico Komning (AfD) verdammt den Wirtschaftshaushalt 2026 als 'finanzpolitischen Offenbarungseid' der Merz-Koalition (180 Mrd Euro neue Schulden, 630 Mrd Gesamt-Ausgaben, 5,9 Mrd Wirtschaftsetat), kritisiert das Ministerium unter Reiche als 'grüne Kommandozentrale', die 'Subventionen wie Lose auf dem Jahrmarkt' verteile, und geißelt die Rüstungsindustrie-Abhängigkeit als 'Quasikriegswirtschaft'. Demgegenüber fordert die AfD einen 10-Milliarden-Euro-Wirtschaftsetat ohne 'Klimafiktionen', 55 Milliarden Euro Steuersenkungen, Rohstoffsicherung und Infrastruktur statt Regulierung — sein Frame: 'Planwirtschaft in Reinform' statt 'konservativ-liberaler Wirtschaftspolitik'.

**Original-Auszug (Mitte, ~600 chars):**
```
…A-X. Ich sage Ihnen, wie es ist: Das ist Planwirtschaft in Reinform, ein zentral gesteuertes Förderregime, das nicht einmal vorgibt, marktwirtschaftlich zu sein.
Die einzige Branche, die unter der Merz-Regierung wächst, ist die Rüstungsindustrie, und das auch nur wegen der ausgerufenen Quasikriegswirtschaft. Was machen Sie eigentlich, wenn der Krieg vorbei ist? -Genau deshalb ist es der Regierung ein Dorn im Auge, wenn andere Frieden machen; denn dann bleibt nichts mehr von dieser schwarz-roten Politik, nicht einmal mehr Rechtfertigungen.
Als AfD wollen wir Verantwortung für unser Land und die…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 33. Maximilian Kneller (AfD) — ID214210000

- **v1-flagged Wort:** `diffamieren`
- **v2.1 enthält noch:** `diffamieren`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Maximilian Kneller (AfD) verlässt den Sachbereich Digitales/Staatsmodernisierung vollständig und nutzt die Redezeit stattdessen zu einer persönlichen Charakterverteidigung von Alice Weidel: er katalogisiert ihre Qualifikationen (Jahrgangsbeste 2004, Promotion mit magna cum laude über China-Rentensystem, Erfahrung bei Goldman Sachs) und wirft Kolleginnen vor, Fake News über Steuervermeidung zu verbreiten und Weidel selektiv zu diffamieren — während männliche Kollegen dieselbe Zweitwohnsitz-Praxis ohne Kritik betrieben. Seine Pointe: eine geschlechtsspezifische Doppelmoral der Gegenseite zu entlarven.

**v2.1-Summary (neu):**
> Maximilian Kneller (AfD) kontert eine Kritik der SPD-Kollegin an geschlechter-diskriminierendem Verhalten mit einer detaillierten Biografie von Alice Weidel (Jahrgangsbeste 2004, Promotion 2011 mit magna cum laude, langjährige Tätigkeit bei Goldman Sachs und anderen renommierten Investmenthäusern) und wirft der SPD-Fraktion vor, über Weidels Steuerzahler-Status „Fake News" zu verbreiten und sie dadurch zu diffamieren. Er charakterisiert dies als „Unverschämtheit" und fordert implizit auf, solche Kritik zu unterlassen.

**Original-Auszug (Mitte, ~600 chars):**
```
…ersität Bayreuth als Jahrgangsbeste abgeschlossen, hat 2011 mit magna cum laude über das chinesische Rentensystem promoviert, war jahrelang unternehmerisch tätig, unter anderem im Finanz- und Investmentbereich, bei renommierten Häusern wie Goldman Sachs.
– Danke, dass Sie es sagen! Dazu wollte ich gerade kommen. – Dennoch kommen Ihre Kollegen nicht umhin, Fake News zu verbreiten, sie würde in Deutschland keine Steuern zahlen, sondern in der Schweiz, weil sie sich – wie viele Männer in Ihren Reihen auch – einen Zweitwohnsitz im Ausland zugelegt hat, auch auf der Basis einer vorherigen unternehm…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 34. Felix Döring (SPD) — ID214604700

- **v1-flagged Wort:** `diffamiert`
- **v2.1 enthält noch:** `diffamiert`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Felix Döring (SPD) adressiert in der Fragestunde Bundesminister Frei zur Demokratie-Sicherung: Die Demokratie stehe unter enormem Druck durch KI-Technologie, intransparente Algorithmen und die laut Mitte-Studie (Friedrich-Ebert-Stiftung) wachsende „Ideologie der Ungleichwertigkeit" — parallel würden Vertreter der Zivilgesellschaft zu Unrecht als „linke Aktivisten" diffamiert. Döring stellt klar, dass Demokratie-Engagement politisch nicht zwangsläufig links ist, und fragt explizit nach der Bundesregierungs-Strategie gegen gruppenbezogene Menschenfeindlichkeit und deren Botschaft an die Zivilgesellschaft.

**v2.1-Summary (neu):**
> Felix Döring (SPD) wendet sich mit einer Zwischenfrage an Bundesminister Frei und adressiert mehrschichtige Bedrohungen für die Demokratie: KI-Technologien und intransparente Algorithmen in sozialen Netzwerken, gruppenbezogene Menschenfeindlichkeit in der Gesellschaftsmitte (gestützt auf die Mitte-Studie der Friedrich-Ebert-Stiftung) und die Ideologie der Ungleichwertigkeit. Döring kritisiert außerdem, dass Vertreter der demokratischen Zivilgesellschaft pauschal als 'linke Aktivisten diffamiert werden', und betont: demokratisches Engagement sei nicht automatisch Linkspolitik. Er fragt, welche politische Perspektive die Bundesregierung zur Gegenwehr hat und welche Botschaft sie an die Zivilgesellschaft richten will.

**Original-Auszug (Mitte, ~600 chars):**
```
…chen intransparente Algorithmen bei sozialen Netzwerken erleben, sondern auch – und das hat ja die Mitte-Studie der Friedrich-Ebert-Stiftung vor einigen Wochen herausgestellt –, weil gruppenbezogene Menschenfeindlichkeit sich in der Mitte unserer Gesellschaft immer weiter verankert und die Ideologie der Ungleichwertigkeit weiter vorhanden ist, wenn nicht sogar sich ausweitet. Auf der anderen Seite haben wir aber auch eine Situation, in der Vertreter unserer demokratischen Zivilgesellschaft oftmals als linke Aktivisten diffamiert werden.
Da lege ich immer Wert darauf, dass Menschen, die sich fü…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 35. Dr. Ingo Hahn (AfD) — ID214702300

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Ingo Hahn (AfD) lehnt die Grünen-Klimaschutz-Anträge fundamental ab: Es gebe keinen anthropogenen Klimawandel, die CO2-Bepreisung sei ein „Geschäftsmodell" zum Geldumverteilen an eine „grüne Klientel" (Beispiel Al Gore als Multimillionär), und die Energiewende habe das Leben unbezahlbar gemacht. Er wirft den Grünen „Doppelmoral" vor — 130.000 Tonnen CO2 durch die Klimakonferenz in Belém, während sie Bürgern „Luxusflüge nach Mallorca" verbieten — und behauptet aus eigener Pazifik-Forschung, keine Inseln seien durch Klimawandel untergegangen. Dagegen positioniert die AfD als „wahre Naturschutz-Partei": Schutz von Wiesen vor Solaranlagen, Wäldern vor Windkraftanlagen, und die Rückkehr zu günstigen deutschen Energieträgern; Schlusslicht: „Das neue Grün ist blau."

**v2.1-Summary (neu):**
> Dr. Ingo Hahn (AfD) lehnt die drei Klima-Anträge der Grünen fundamental ab und behauptet, es gebe keinen menschengemachten Klimaschutz — stattdessen prangert er ein 'Angstmache-Geschäftsmodell' der Grünen an ('CO2-Religion', Umverteilung zu 'grüner Klientel', Selbstbereicherung wie Al Gore). Er kritisiert die CO2-Bepreisung als 'Selbstgerechtigkeit', die das Leben unbezahlbar gemacht habe, fordert günstige Energie ohne 'Flatterstrom' und Stopp der 'Naturzerstörung' durch Solarplatten und Windkraftanlagen. Seine zentrale Polemik: Die Grünen zeigen 'Doppelmoral' — sie jetteten 50.000 Delegierte zur Weltklimakonferenz in Belém unter Ausstoß von 130.000 Tonnen CO2. Mit der persönlichen Behauptung, 20 Jahre zu Pazifik-Ökosystemen geforscht zu haben und dass 'noch keine Insel durch Klimawandel untergegangen' sei, positioniert er die AfD als 'einzige Partei für echten Naturschutz' — der Schlusssatz 'Das neue Grün ist blau' fungiert als Wahlaufruf.

**Original-Auszug (Mitte, ~600 chars):**
```
…tun. Im Gegenteil: Die CO2-Religion und mit ihr im Schlepptau die teure Energiewende haben das Leben für viele Menschen in diesem Land erst unbezahlbar gemacht.
Daher fordern wir: günstige Energie für alle, keinen Flatterstrom und Schluss mit der Naturzerstörung dadurch.
Seit Neuestem wollen Sie, werte Grüne, auch Luxusflüge besteuern. Das hört sich ja richtig populistisch an. Die Frage ist nur: Was sind Luxusflüge für Sie? Gehört auch schon der Urlaubsflug nach Mallorca dazu? Den können sich nämlich aufgrund Ihrer eingeführten Steuern heute schon immer weniger Bürger leisten.
Nun, ich sage Ih…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 36. Violetta Bock (Die Linke) — ID214702800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Violetta Bock (Die Linke) attackiert die 'wahnsinnige Heuchelei' der EU-Klimapolitik: während die Regierung von Ambition spricht, wächst die soziale Ungerechtigkeit und die reale Finanzierung bleibt aus — die Verursacher des Klimawandels sollen zahlen, nicht die Arbeiter. Sie fordert strukturelle Wirtschaftsreformen (Rohstoffausbeutungs-Verbote, Pestizid-Export-Kontrollen, Abschaffung des Zertifikathandels) und eine grundsätzliche Wohnungsmarkt-Regulierung statt 'Flickschusterei', um Freiheit im Sinne von Gemeinwohl (Heizbarkeit, Wohnraum für alle) zu ermöglichen — nur 'mit linker Politik' komme der Wirtschaftsaufschwung, den die Regierung verspreche.

**v2.1-Summary (neu):**
> Violetta Bock (Die Linke) kritisiert die Kluft zwischen dem Rhetorik sozialer Gerechtigkeit und Klimapolitik in der Debatte: während Regierungsparteien von „pragmatisch" und „sozial gerecht" sprächen, verschärfe sich die soziale Ungerechtigkeit; die Klimadebatte werde von „wahnsinniger Heuchelei" getrieben, weil unklar bleibe, wer zahlt und wer verantwortlich ist. Sie fordert strukturelle Lösungen: Regulierung von Konzernen (Pestizid-Exporte nach Brasilien verbieten), Ablehnung des Zertifikatehandels, Umgestaltung der Wirtschaft zu nachhaltiger Produktion, und im Wohnungsbereich: strukturelle Bekämpfung der Krise statt Flickschusterei — finanziert durch sozial gestaffelte Programme. Sie distanziert sich vom AfD-Freiheitsbegriff als bloße Hetze und Isolierung.

**Original-Auszug (Mitte, ~600 chars):**
```
…em gucken, dass der Wirtschaftsaufschwung wiederkommt. – Wann kommt er denn?
– Ich glaube, mit linker Politik kommt der sehr viel schneller.
Ihre Politik macht die Wirtschaft kaputt und gefährdet Arbeitsplätze. Sehen Sie sich die materiellen Bedingungen an, unter denen wir leben.
Die Klimakatastrophe ist inzwischen eine materielle Bedingung geworden.
Das heißt, wenn wir darüber nachdenken, wie wir unsere Wirtschaft aufstellen, müssen wir auch über die Frage reden: Was hat den Klimawandel mitverursacht?
Eine Ursache ist, dass Konzerne einzeln entscheiden können, wo sie Rohstoffe ausbeuten.
Das …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 37. Michael Hose (CDU/CSU) — ID214706000

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Michael Hose (CDU/CSU) verteidigt Wolfram Weimer gegen den AfD-Antrag durch Anklageart-Zurückweisung: Der Bundestag dürfe nicht zu einer 'Tribunalisierungs-Bühne für Vorverurteilung' missbraucht werden, sondern müsse Gerichtsbarkeit und Gewaltenteilung respektieren. Mit drei beleg-belasteten AfD-Beispielen aus Thüringen (Höcke, Muhsal, Czuppon — alle rechtskräftig verurteilt, aber im Gerichtssaal, nicht im Plenarsaal) demonstriert Hose die funktionierende Rechtstaatlichkeit und rahmt Weimer als legitime konservative Stimme, die die AfD durch Diffamierung zum Schweigen bringen will.

**v2.1-Summary (neu):**
> Michael Hose (CDU/CSU) kritisiert den AfD-Antrag scharf als Versuch, den Bundestag „für die Zwecke der AfD zu missbrauchen" und zu einem „Tribunal" statt eines Ortes freier Debatte umzufunktionieren. Mit drei konkreten Belegen aus Thüringen (Björn Höcke, Wiebke Muhsal, Torsten Czuppon — alle AfD-Mitglieder, alle rechtskräftig verurteilt durch unabhängige Gerichte, nicht durch politische Mehrheiten) verteidigt er das Rechtsstaatsprinzip gegen die seiner Ansicht nach substanzlose „Stimmungsmache" des Antrags und lehnt ihn ab.

**Original-Auszug (Mitte, ~600 chars):**
```
…dass konservativ nicht „extrem“ bedeutet, dass konservativ nicht „spaltend“ bedeutet und dass konservativ nicht „antidemokratisch“ bedeutet.
Ihr Ziel ist es ganz offensichtlich, diese konservativen Stimmen zum Schweigen zu bringen, und das werden wir nicht zulassen.
Deswegen befasst sich Ihr Antrag auch nicht mit der Kulturpolitik von Wolfram Weimer, sondern Ihr Ziel besteht darin, Wolfram Weimer persönlich zu diffamieren.
Und deswegen sage ich ganz ausdrücklich: Der Deutsche Bundestag ist kein Tribunal!
Wissen Sie, ich komme aus Thüringen. Und gerade in meinem Heimatland gibt es Beispiele daf…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 38. Jürgen Hardt (CDU/CSU) — ID214708100

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Jürgen Hardt (CDU/CSU) weist die AfD-Diffamierung Polens mit Nachdruck zurück und argumentiert, dass Russlands völkerrechtswidriger Krieg (mit nächtlichen Drohnenangriffen) letztlich gegen ganz Europa gerichtet ist — die Ukraine-Niederlage würde den europäischen Frieden gefährden. Er fordert geschlossenes westliches Handeln (intensivierte Ukraine-Hilfe, Sanktionen-Kohärenz, Schattenflotten-Bekämpfung, Frozen Assets) als Mittel, um Putin zu Friedensverhandlungen zu zwingen, und würdigt die Grünen für die Unterstützung des Frozen-Assets-Antrags.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Jürgen Hardt (CDU/CSU) weist die AfD-Position Keuters — dass Russland und Polen die Ukraine unter sich aufteilen könnten — als Diffamierung Polens mit aller Schärfe zurück und bekräftigt, dass Putins Angriffskrieg völkerrechtswidrig ist (einschließlich nächtlicher Drohnenangriffe auf Zivilbevölkerung), Putin dafür zur Verantwortung gezogen werden muss, und der Krieg der Ukraine wenig erfolgreich verläuft (geringe Geländegewinne, massive Verluste, wirtschaftliche Probleme). Hardt argumentiert: Nur wenn der Westen seine Ukraine-Hilfe intensiviert, Sanktionen geschlossen durchsetzt und die Frozen Assets zur Reparation einsetzt, entstehe die Chance auf Frieden aus Position der Stärke — wenn die Ukraine unterliegt, ist Europas Frieden selbst gefährdet.

**Original-Auszug (Mitte, ~600 chars):**
```
…en, die Inflationsrate kritisch. Und in dieser Situation wird die NATO erweitert, gestärkt mit einem erfolgreichen Gipfel in Den Haag. Wir rüsten weiter auf, weil wir uns stärker bedroht fühlen als früher.
Dieser Krieg gegen die Ukraine – das wird angesichts der Diskussion dieser Wochen auch für die Menschen in unserem Lande immer deutlicher – richtet sich eben nicht allein gegen die Ukraine, sondern er richtet sich auch gegen uns. Wenn man die täglichen Sabotageakte – die Drohnenüberflüge mutmaßlich russischer Drohnen oder russisch gesteuerte Angriffe auf die Cyberinfrastruktur – beobachtet u…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 39. Friedrich Merz ((Reg)) — ID214906200

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Friedrich Merz (CDU/CSU, Bundeskanzler) wendet sich gegen die Stimmungsmache einer nicht namentlich genannten Opposition zu Migrationszahlen und differenziert: von 1 Million Menschen ohne gültigen Aufenthaltstitel seien nur wenige vollziehbar ausreisepflichtig, die übrigen hätten Duldungsstatus aufgrund von Verfolgung in der Heimat und könnten rechtlich nicht abgeschoben werden — Rücksichtnahme auf diese Gruppe sei Ausweis eines „sozialen Rechtsstaats", auch wenn die Opposition dies anders sehe. Sein Rahmen: pragmatische Rechtsstaatlichkeit statt vereinfachender politischer Stimmungsmache.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Friedrich Merz (Bundeskanzler, CDU/CSU) kritisiert einen Redner-Vorgänger (implizit grüne oder linke Fraktion) für selektive Kommunikation zur Migrationspolitik: Er differenziert zwischen der 1 Million Menschen ohne gültigen Aufenthaltstitel und dem kleineren Teil der vollziehbar Ausreisepflichtigen; die übrigen hätten Duldungsstatus aufgrund von Vorkommnissen in ihrer Heimat und könnten nicht abgeschoben werden. Merz rahmt Rücksichtnahme gegenüber Geduldeten als Aufgabe eines „sozialen Rechtsstaats" und attackiert die Opposition für „Stimmungsmache" durch bewusste Weglassung dieser Differenzierung.

**Original-Auszug (Mitte, ~600 chars):**
```
…s ist Ihr gutes Recht –, sondern auch Stimmung in Deutschland machen.
Von diesen 1 Million Menschen, die in Deutschland keinen gültigen Aufenthaltstitel haben, ist nur ein kleinerer Teil vollziehbar ausreisepflichtig; denn die anderen haben einen Duldungsstatus.
Und die werden von Ihnen regelmäßig eben nicht mitgenannt. Sie haben einen Duldungsstatus aufgrund bestimmter Vorkommnisse in ihrer Heimat und können nicht abgeschoben werden.
Auf diese Menschen Rücksicht zu nehmen, ist jedenfalls nach unserem Verständnis die richtige Entscheidung eines sozialen Rechtsstaats, der Bundesrepublik Deutsch…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 40. Dr. Hendrik Hoppenstedt (CDU/CSU) — ID215002200

- **v1-flagged Wort:** `diffamiere`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Hendrik Hoppenstedt (CDU/CSU) weist den Vorwurf zurück, die Union diffamiere Nichtregierungsorganisationen, und etabliert eine Differenzierung: zwischen Diffamierung einerseits und der Verweigerung staatlicher Förderung andererseits. Als Beleg schildert er eine persönliche Anekdote, dass „Omas gegen Rechts" ihn mehrfach von Demonstrationen ausgeladen habe mit der Begründung, er gehöre einer „antidemokratischen" Partei an — eine Implizierung, die er durch die Gegenfrage „Teilen Sie das?" als Denkfehler exponiert.

**v2.1-Summary (neu):**
> Dr. Hendrik Hoppenstedt (CDU/CSU) wehrt sich gegen den Vorwurf der Diffamierung von Nichtregierungsorganisationen und argumentiert mit einem Beleg: er sei mehrfach von 'Omas gegen Rechts' von Demonstrationen ausgeladen worden mit der Begründung, die CDU/CSU sei antidemokratisch — er unterscheidet zwischen persönlicher Diffamierung und kritischer staatlicher Förderentscheidung und wirft der kritisierten NGO damit implizit selektive Maßstäbe vor. Die rhetorical Abschlussfrage an die Gegenseite ('Teilen Sie das?') rahmt dies als Punkt der ideologischen Doppelmoral.

**Original-Auszug (Mitte, ~600 chars):**
```
Frau Kollegin, ganz herzlichen Dank. – Ich verwehre mich erst mal gegen den Vorwurf, wir würden hier irgendwelche Nichtregierungsorganisationen diffamieren. Es ist ein Unterschied, ob ich jemanden diffamiere oder ob ich ihm eine staatliche Förderung zukommen lasse.
Ich will Ihnen aus meiner persönlichen Erfahrung sagen, dass die „Omas gegen Rechts“, die hier heute schon so oft vorgekommen sind, mich zum Beispiel mehrfach von Demonstrationen ausgeladen haben mit der Argumentation, ich sei Angehöriger einer Partei und Fraktion, die antidemokratisch sei. Teilen Sie das?
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 41. Jörg Cezanne (Die Linke) — ID215311700

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Jörg Cezanne (Linke) befürwortet das EU-Sanktions-Umsetzungsgesetz prinzipiell, geißelt aber die „dramatische Auseinanderkluft zwischen Rechtslage und Lebenswirklichkeit": Ermittlungs- und Justizbehörden fehle es überall an technischen und personellen Kapazitäten — Steuerfahnder, spezialisierte Staatsanwälte und Richter mit Wirtschaftskriminal-Expertise seien unterbesetzt, während Wirtschaftsstraftäter sich leicht Steuerberater, IT-Experten und Anwälte zur Verschleierung einstellen könnten. Das Gesetz ist für Cezanne ein „Papiertiger" und „bittere Heuchelei", da die Bundesregierung (nicht nur die aktuelle) ihre Verantwortung für die tatsächliche Durchsetzung von Wirtschafts- und Sanktionsrecht systematisch vernachlässigt und „Kriminelle in Nadelstreifen" selten belangt werden.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Jörg Cezanne (Linke) erklärt sich trotz Kritik für die Harmonisierung und Verschärfung der EU-Sanktionsdurchsetzung grundsätzlich für verantwortlich, aber diagnostiziert ein fundamentales Implementierungs-Defizit: nicht der Gesetzeswortlaut, sondern die Praxis sei mangelhaft. Die Bundesregierung habe über Jahre die Personalausstattung von Behörden für Wirtschafts- und Sanktionskriminalität vernachlässigt — es fehlten Steuerfahnder, spezialisierte Staatsanwälte und Richter, während Wirtschaftsstraftäter sich leicht Experten zur Spur-Verschleierung einstellen könnten. Cezannes Schluss: Das Gesetz sei „ein Papiertiger ... eine bittere Heuchelei", solange die Verfolgungskapazität nicht aufgebaut werde.

**Original-Auszug (Mitte, ~600 chars):**
```
…rfolgung von Finanz- und Wirtschaftskriminalität braucht: Steuerdelikte, Organisierte Kriminalität, Geldwäsche und Korruption. In all diesen Bereichen fehlt es seit Jahren an einer ausreichenden Personalausstattung der Behörden, eben weil dieses Personal von politischer Seite nicht bereitgestellt wird.
Steuerfahnderinnen und Steuerfahnder, hochprofessionalisierte Schwerpunktstaatsanwaltschaften für Wirtschaftskriminalität und viele zusätzliche Richterinnen und Richter mit Expertise in diesem Bereich: Das ist, woran es fehlt.
Wenn Wirtschaftsstraftäter oder Sanktionsumgeher Millionen illegal ve…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 42. Marcel Queckemeyer (AfD) — ID215402600

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Marcel Queckemeyer (AfD) greift die Energiewende als heuchlerisch an: Während Bundesregierung und Koalitionsparteien von Biodiversität reden, würden Windkraftanlagen an Land (Milliarden Insekten, 100.000 Fledermäuse jährlich, tausendfach geschützte Vogelarten) und auf See (ohne unabhängiges Monitoring, mit Eigenkontrollen durch Betreiber) die Natur „zermahlen". Er kritisiert besonders die Grünen-Doppelmoral (Verbot von F-Gasen, aber Windkraftanlagen mit eben diesen Stoffen) und fordert echten Naturschutz statt „Artenvernichtung mit Genehmigungsstempel" — sowie eine Energiewende, die nicht Natur, Versorgung und Strompreise opfert. Sein Frame: „Naturschutz ist Heimatschutz".</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Marcel Queckemeyer (AfD) attackiert die Energiewende als ökologisch katastrophal: während die Bundesregierung Biodiversität beschwöre, würde sie in der Realität „zermahlen" durch rücksichtslosen Windkraft-Ausbau — jährlich Milliarden Insekten, 100.000 Fledermäuse und tausendfach geschützte Vogelarten getötet, Meere und Wälder zerstört. Er wirft Grünen, SPD und CDU/CSU „Heuchelei" vor (F-Gase-Verbot vs. Windkraftförderung), fordert unabhängiges Monitoring, transparente Kontrollen statt Betreiber-Selbstüberwachung, und rahmt die AfD-Position als „Naturschutz ohne Ideologie" gegen eine gescheiterte, keine Akzeptanz mehr habende „Energiewende".

**Original-Auszug (Mitte, ~600 chars):**
```
…sgebaut ohne unabhängiges Umwelt-Monitoring, ohne transparente Meldesysteme, ohne vollständige Erfassung von Öl, Hydraulik und Metalleinträgen. Die Kontrolle überlassen Sie weitgehend den Betreibern selbst. Das ist, als würde man den Wolf zum Hüter einer Schafsherde machen.
Wir sagen klar: Naturschutz endet dort, wo das EEG beginnt. Wir stehen für Naturschutz ohne Doppelmoral – anders als die Grünen, die hier gestern mit Herrn Dr. Gesenhues das Ende der F-Gase verkündeten, die aber gleichzeitig die Windkraftanlagen feiern, die ohne diese Stoffe so nackt dastünden wie ein Mast ohne Rotorblätter…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 43. Desiree Becker (Die Linke) — ID215505300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Desiree Becker (Die Linke) wirft dem Außenminister und seiner CDU/CSU-Fraktion Heuchelei vor: Sie beriefen sich gerne auf rechtliche Vorgaben, würden aber gleichzeitig einen demokratischen Prozess und eine Gerichtsprüfung unterwandern wollen. Mit konkretem Beleg konfrontiert sie die Fraktion: Im Europaparlament hätten CDU/CSU und die extreme Rechte beim EU-Lieferkettengesetz 30 Änderungsanträge gemeinsam gestellt — „Das ist im Übrigen Zusammenarbeit!"

**v2.1-Summary (neu):**
> Desiree Becker (Linke) richtet eine Zwischenfrage an den Außenminister und wirft der CDU/CSU-Fraktion Doppelmoral vor: Sie beriefen sich ständig auf rechtliche Vorgänge, lehnten aber einen demokratischen Parlamentsprozess und eine gerichtliche Prüfung ab. Mit nur sieben Sekunden verbleibend fügt sie eine Belegfrage an: Im EU-Lieferkettengesetz habe die CDU/CSU-Fraktion im Europaparlament 30 Änderungsanträge gemeinsam mit der extremen Rechten gestellt — „Das ist im Übrigen Zusammenarbeit!"

**Original-Auszug (Mitte, ~600 chars):**
```
…n. – Sehr geehrter Herr Außenminister, ich bin doch ein bisschen verwundert; denn es war ein demokratischer Prozess in einem demokratischen Parlament, und es geht da um eine rechtliche Prüfung vor einem Gericht. Ihre Fraktion beruft sich doch so gerne auf rechtliche Vorgänge. Deshalb meine Frage: Warum stehen Sie dem so entgegen und sagen auch hier, dass Sie das gerne unterwandern wollen würden?
Ich habe noch sieben Sekunden, und ich erinnere gerne an das EU-Lieferkettengesetz, bei dem Ihre Fraktion im Europaparlament 30 Änderungsanträge gemeinsam mit der extremen Rechten gestellt hat. Das ist…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 44. Beatrix von Storch (AfD) — ID215605200

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Beatrix von Storch (AfD) greift den Grünen-Antrag gegen Trumps Venezuela-Politik als reine Heuchelei an und stellt vier historische Fälle gegenüber (Kosovo 1999, Irak 2003, Drohnenkrieg 2008–2016 mit 3.800 Toten in Pakistan, Libyen 2011 ohne UN-Mandate), in denen Grüne, SPD und Union völkerrechtliche Standards ignorierten — während Maduro in den USA einen Prozess erhält, wurde Gaddafi „barbarisch ermordet". Storchs Kernposition: Trump ist ehrlich in seiner Interessenpolitik, nicht heuchlerisch wie die Altparteien; die USA suchen in Europa „zivilisatorische Verbündete" gegen Woke und Linkgrünheit, und die AfD positioniert sich dabei als Verteidigerin einer „christlich geprägten Zivilisation" gegen „Massenmigration, Klimahysterie und Genderideologie".

**v2.1-Summary (neu):**
> Beatrix von Storch (AfD) wirft den Grünen Heuchelei vor: Sie kritisierten Trumps angebliche Abkehr von der regelbasierten Ordnung, während die gleiche Ordnung unter Clinton (Kosovokrieg 1999, Unterstützung durch Joschka Fischer), Bush (Irak 2003, mit Merkel/Merz) und Obama (Drohnenkrieg 2008-2016, Libyen 2011 mit grüner Zustimmung) durch zahlreiche Völkerrechtsverletzungen gekennzeichnet war — Maduro bekommt einen Prozess, während Gaddafi ermordet wurde. Sie kritisiert die grüne „Weltinnenpolitik"-Rhetorik als Märchen gegen Interessenpolitik und lehnt die EU als „antidemokratisches Bürokratiemonster, haltungsstark, Moralweltmeister, aber wirtschaftlich schwindsüchtig und woke" ab; stattdessen begrüßt sie Trumps „Civilizational Allies"-Strategie als Basis für eine neue westliche Partnerschaft auf christlicher Zivilisation ohne Massenmigration, Klimahysterie und Genderideologie.

**Original-Auszug (Mitte, ~600 chars):**
```
… Venezuela ist pure Heuchelei.
Darum haben die Grünen auch ein Problem mit Donald Trump: Man kann ihm sicher vieles vorwerfen, aber Heuchelei ganz sicher nicht.
Deswegen verstehen Sie den nicht.
Trumps Offenheit nimmt Ihnen vielmehr die Möglichkeit, uns Ihr Märchen von der Weltinnenpolitik zu erzählen, mit dem Sie den Deutschen versuchen weiszumachen, dass man eigene Interessen nicht durchsetzen und Interessenpolitik nicht betreiben kann.
Dass die USA und Deutschland unterschiedliche Interessen haben, ist doch klar – wir haben auch mit Frankreich und Italien nicht identische Interessen –,
und …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 45. Tilman Kuban (CDU/CSU) — ID215606900

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Tilman Kuban (CDU/CSU) attackiert die Grünen scharf wegen ihrer Blockade des Mercosur-Handelsabkommens und beschuldigt sie der Doppelmoral: Sie hätten vor einem Jahr Großdemonstrationen gegen CDU/CSU-Anträge angeführt, heute weinten sie „Krokodilstränen" und hätten bewusst „mit Faschisten und Linksradikalen" im EU-Parlament paktiert — ein „geplantes grünes Manöver" gegen Freihandel. Kuban argumentiert geopolitisch: Nach 26 Jahren Verhandlungen braucht Europa den südamerikanischen Zukunftsmarkt gerade in Zeiten von Putins Angriffskrieg, chinesischer Konkurrenz und US-Spannungen; eine EuGH-Anrufung durch die Grünen würde Südamerika und andere Partner verunsichern. Im Inland lobt er die Regierungsbilanz: Agrardieselrückvergütung wiederhergestellt, Stoffstrombilanzierung abgeschafft — sein Frame: „Weniger Auflagen für Landwirte, mehr Freihandel für unser Land".

**v2.1-Summary (neu):**
> Tilman Kuban (CDU/CSU) attackiert die Grünen scharf als Heuchler im Merkosur-Streit: Sie hätten ein Jahr zuvor das Handelsabkommen als „schwarzen Tag für die Demokratie" verdammt, während CDU/CSU dafür angegriffen wurden — jetzt als Opposition würden sie via EuGH-Anrufung faktisch erneut „Nein" sagen, mit „Faschisten und Linksradikalen paktierend". Kuban verteidigt Merkosur als notwendig für deutsche Wirtschaft (gegen russische Aggression, China-Konkurrenz, US-Spannungen) und wirft den Grünen „geplantes Manöver gegen Freihandel" vor; abschließend bilanziert er Agrardiesel-Rückeinführung und Stoffstrombilanzierung-Abschaffung als Erfolge der Merz-Regierung.

**Original-Auszug (Mitte, ~600 chars):**
```
…e Lastenfahrradkorsos von Ihren grünen Freunden.
Sie wissen ganz genau, dass die wirtschaftliche Chance des freien Handels da ist, vor allem für unsere europäischen und unsere deutschen Firmen. Sie wissen ganz genau, dass wir gerade in Zeiten des russischen Angriffskrieges, in Zeiten wachsender Konkurrenz aus China, in Zeiten zunehmender Spannungen auf dem US-Markt diesen südamerikanischen Zukunftsmarkt brauchen und nicht zweijährige Verzögerungen durch Überprüfung beim Europäischen Gerichtshof. Sie wissen ganz genau, dass diese Anrufung des EuGH ein einmaliger Vorgang ist, ein Akt, der Misstr…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 46. Stephan Protschka (AfD) — ID215607000

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Stephan Protschka (AfD) verteidigt die AfD gegen Vorwürfe der Handelsfeindlichkeit (Verweis auf Programm S. 92) und fordert eine Neuverhandlung des Mercosur-Abkommens: sensible Agrargüter wie Fleisch, Zucker, Ethanol müssten ausdrücklich ausgeklammert werden — analog zum Freihandelsabkommen mit Indien — um deutsche Bauern vor unfairem Preisdruck und globaler Abhängigkeit zu schützen. Mit scharfer Rhetorik kritisiert er die Union für „linke Politik" und „Doppelmoral" (hohe Standards für Bauern, keine für Importe) und adressiert Bauern direkt: „Sie brauchen keine Sonntagsreden, sie brauchen politische Verlässlichkeit" — nur die AfD könne das bieten.

**v2.1-Summary (neu):**
> Stephan Protschka (AfD) verteidigt die AfD gegen den Vorwurf der Freihandels-Feindschaft (Verweis auf S. 92 des Programms) und positioniert sich zur Mercosur-Debatte: Die AfD begrüße Freihandel, nicht aber auf dem Rücken deutscher Bauernfamilien. Das Abkommen sei nur zustimmungsfähig, wenn Fleisch, Zucker, Ethanol ausdrücklich ausgeklammert werden — das sei möglich, wie das Freihandelsabkommen mit Indien zeige. Er rahmt die gegenwärtige Politik als „Doppelmoral" (hohe Standards für Deutsche, niedrige für Importe) und strategisch kurzsichtig; den Schluss bildet eine Kritik an der Union, die durch ihre „Zufallsmehrheiten"-Rhetorik „linker handelt als die Linken", während die AfD „politische Verlässlichkeit" für Landwirte bringe.

**Original-Auszug (Mitte, ~600 chars):**
```
…ngen an unsere Landwirte zu stellen, diese bei Billigimporten aber nicht einzufordern, ist politische Doppelmoral. Es ist auch strategisch kurzsichtig; denn wer die heimische Produktion schwächt, macht sich abhängig von Importen, von globalen Lieferketten und von Standards, die wir selbst nicht kontrollieren können.
Wir sind nicht gegen Handel mit Südamerika. Ganz im Gegenteil. Aber Freihandel auf dem Rücken deutscher Bauernfamilien lehnen wir klar ab. Das Mercosur-Abkommen ist nur dann zustimmungsfähig, wenn sensible Agrargüter wie Fleisch, Zucker, Ethanol ausdrücklich ausgeklammert werden; d…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 47. Tijen Ataoğlu (CDU/CSU) — ID215612700

- **v1-flagged Wort:** `Diffamierungen`
- **v2.1 enthält noch:** `Diffamierungen`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Tijen Ataoğlu (CDU/CSU) lehnt die AfD-Forderung zur Abschaffung des § 188 StGB ab und differenziert präzise: Meinungsfreiheit (auch scharfe, unsachliche Machtkritik gegenüber der Obrigkeit) ist ein Grundrecht, das das Bundesverfassungsgericht 1958 als „eines der vornehmsten Menschenrechte" bezeichnet hat — aber Herabwürdigungen, Diffamierungen und Hetze „sind keine Meinungen, das sind Straftaten". Sie behält den § 188 StGB als notwendiges Instrument zur Eindämmung von Hass bei, zeigt sich aber für kluge Alternativen offen und erklärt die Abschaffung für keine davon.

**v2.1-Summary (neu):**
> Tijen Ataoğlu (CDU/CSU) widerlegt den AfD-Antrag zur Abschaffung von § 188 StGB durch eine Gesetzessystematik-Erklärung: § 185 StGB würde bestehen bleiben und Anträge wie die des Bundeskanzlers Merz weiterhin zulassen — daher sei die Forderung ziellos. Sie zitiert das Bundesverfassungsgericht (1958) zur Betonung, dass Meinungsfreiheit ein 'vornehmnes Menschenrecht' ist, und unterscheidet präzise: Machtkritik, 'auch zugespitzt und auch unsachlich', muss zulässig sein; aber 'Herabwürdigungen, Diffamierungen und Hetze' seien 'keine Meinungen, sondern Straftaten'. Sie bleibt bei § 188 StGB und signalisiert Pragmatismus durch die Offerte: 'Für kluge Alternativen sind wir jederzeit offen.'

**Original-Auszug (Mitte, ~600 chars):**
```
…ese Anträge stellen, nämlich über § 185 StGB.
Deshalb ist Ihre Frage einfach obsolet.
Frau Präsidentin, ich fahre fort. – Es darf keinen Zweifel daran geben, sehr geehrte Kolleginnen und Kollegen, dass das Grundrecht der Meinungsfreiheit – und so hat es das Bundesverfassungsgericht bereits im Jahre 1958 festgestellt – eines der vornehmsten Menschenrechte ist. Insbesondere im Verhältnis Bürger zu Obrigkeit muss Machtkritik möglich sein, auch zugespitzt und auch unsachlich.
Kritik, auch scharfe Kritik, ist und muss von der Meinungsfreiheit gedeckt sein. Herabwürdigungen, Diffamierungen und Hetze…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 48. Dr. Konrad Körner (CDU/CSU) — ID215816300

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Konrad Körner (CDU/CSU) lobt oberflächlich den Grünen-Antrag zu Zukunftsinvestitionen und Forschung, enttarnt ihn dann aber als Doppelmoral: während die Grünen Entlastung für Wissenschaft versprechen, schreiben sie gleichzeitig stärkere Vorgaben zu CO2-Neutralität, Klimastandards und Diversitäts-Audits vor — was echter Bürokratieabbau nicht ist. Seine Kernposition: die Merz-Koalition setzt 200+ konkrete Maßnahmen zur Bürokratiereduzierung um, bekämpft Überregulierung, und stellt Forschungsfreiheit, Privatinvestitionen und den Standort Deutschland vor grüne Ideologie-Audits.

**v2.1-Summary (neu):**
> Dr. Konrad Körner (CDU/CSU) lobt die grüne Abkehr von Degrowth in deren Antrag, kritisiert aber eine „Doppelmoral": während die Grünen Entlastungen für die Wissenschaft fordern, verlangen sie gleichzeitig strengere CO2-Neutralitäts- und Diversitäts-Audits — was einer Ideologisierung der Forschung gleichkomme und nicht zu echter Bürokratieabbau passe. Sein Rahmen: Die CDU/CSU setzt statt Regulierung auf Wissenschaftsfreiheit, Erkenntnisinteresse und Investitions-Motivation; die Regierungskoalition müsse zunächst die Altlasten (Data Act, Data Governance Act) abarbeiten und danach mit über 200 Modernisierungsmaßnahmen vorantreiben.

**Original-Auszug (Mitte, ~600 chars):**
```
…bbau. Aber echter Bürokratieabbau heißt: weniger Berichtspflichten, weniger Doppelprüfungen und mehr Vertrauen.
Aber wenn man dann genau hinschaut – ich war schon ein bisschen begeistert, aber dann habe ich Ihren Antrag genau gelesen –, zeigt sich wieder die Doppelmoral. Sie sprechen von Entlastungen in der Wissenschaft, aber dann wollen Sie natürlich strengere Vorgaben zu Nachhaltigkeit, Klimaneutralität und Diversität. Merken Sie das eigentlich noch? Freiheit ist bei Ihnen nur ein Begriff, der innerhalb Ihrer eigenen Ideologie existiert, aber nicht links und nicht rechts davon.
Dabei lebt Fo…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 49. Marcel Emmerich (BÜNDNIS 90/DIE GRÜNEN) — ID215905200

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Marcel Emmerich (Grüne) attackiert Innenminister Alexander Dobrindt konfrontativ-belegt für die Verlängerung der rechtswidrigen Grenzkontrollen und deren Blockade der Integrationskurse als „Willkür" und „politische Heuchelei": Der Widerspruch zwischen Kanzler Merz' Bekenntnis zum europäischen Zusammenhalt auf der Münchner Sicherheitskonferenz und Dobrindts „nationalem Alleingang" bei Grenzen zeigt Unglaubwürdigkeit; die Grenzkontrollen sind kostspieliger Symbolpolitik statt echter Sicherheit (Bundespolizei unterbesetzt an Bahnhöfen), mehrfach von Gerichten verurteilt. Die Blockade der Integrationskurse (trotz über 200 Unternehmen fordernde Kritik von taz bis FAZ) macht Dobrindt zum „größten Integrationsverweigerer Deutschlands" — Einhaltung des Rechtsstaats und Vollumfang-Wiederaufnahme der Kurse sind gefordert.

**v2.1-Summary (neu):**
> Marcel Emmerich (Grüne) konfrontiert Bundesinnenminister Dobrindt mit einer zweispurigen Kritik: Die Grenzkontrollen seien rechtswidrig (belegt durch Verwaltungsgerichtsurteile Berlin und Bayern), verschwenden Bundespolizei-Ressourcen, die an Bahnhöfen und Flughäfen fehlten, und untergrüben das Schengen-Recht — „eine essenzielle Errungenschaft, die Sie mit Füßen treten"; parallel kritisiert er die Blockade von Integrationskursen als „politische Heuchelei", da der Minister Integration fordere, aber nicht als Investition behandle. Er stützt sich auf Gerichtsentscheidungen, Presseecho (taz bis FAZ), und über 200 Unternehmen, die eine Wiederaufnahme der Kurse fordern, und endet mit einer Charakterisierung Dobrindts als „größter Integrationsverweigerer Deutschlands".

**Original-Auszug (Mitte, ~600 chars):**
```
…en Sie auch – ja, Herr Dobrindt, das ist bekannt – ein gespaltenes Verhältnis. Das Verwaltungsgericht Berlin hat die Praxis verurteilt. Der Bayerische Verwaltungsgerichtshof hat Personenkontrollen an der deutsch-österreichischen Grenze als europarechtswidrig beanstandet. Das, was Sie machen, ist rechtswidrig, ist Willkür. Aber das interessiert Sie nicht die Bohne; vielmehr tragen Sie es mit Stolz vor sich her. Wenn Gerichte diese Regierung immer wieder an geltendes Recht erinnern müssen, nagt das am Rechtsstaat. Eine Regierung muss sich an Recht und Ordnung, an Recht und Gesetz halten, und das…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 50. Clara Bünger (Die Linke) — ID215905400

- **v1-flagged Wort:** `denunziere`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Clara Bünger (Die Linke) attackiert den AfD-Antrag als Versuch, die Sprache des Rechtsstaats zu missbrauchen, um ihn abzuschaffen — die AfD konstruiere einen fiktiven Ausnahmezustand und denunziere Gerichte als „asylfreundlich", um eine autoritäre Gesinnungsjustiz durchzusetzen. Bünger warnt in einer Stufenlogik vor dem autoritären Umbau (Ausnahmezustand → Gerichte-Denunziation → Machtkonzentration → Menschenrechtsverletzungen) und verteidigt die verfassungsrechtliche Architektur Deutschlands: Gerichte seien frei und unabhängig, Asylrecht basiere auf individueller Prüfung nicht auf Massenkategorien wie „Völkerwanderung" oder „kulturfremde Einflüsse" — ihr Urteil: Der Antrag sei ein „Misstrauensantrag gegen die Institutionen der Demokratie" und ein Fall für die Staatsanwaltschaft.

**v2.1-Summary (neu):**
> Clara Bünger (Linke) zerlegt den AfD-Antrag zur EU-Asylrecht-Suspendierung als verfassungsrechtlich unhaltbar und als Angriff auf die Gewaltenteilung: Mit Sarkasmus entlarvt sie die Framing-Strategie (Geflüchtete als 'Strom', 'Massenzustrom', 'Völkerwanderung'), kritisiert die Diffamierung der Justiz als 'asylfreundlich' als Forderung nach 'Gesinnungsjustiz' und weist auf die mangelhaften Rechtsquellen (neurechte Plattformen, X-Posts, Identitäre Bewegung) hin. Ihre zentrale These: Der Antrag beginnt die Logik des autoritären Umbaus — Ausnahmezustand → Gerichtsdiffamierung → Machtkonzentration → Menschenverschwindenlassen; daher sei er ein Misstrauensantrag gegen die Demokratie und ein Fall für die Staatsanwaltschaft, nicht für das Parlament.

**Original-Auszug (Mitte, ~600 chars):**
```
… zurückgeführt werden. Was Sie eigentlich wollen, ist eine Gesinnungsjustiz – eine Justiz, die Ihren politischen Werten entspricht. Aber Gerichte müssen frei und unabhängig sein. Und sie legen Gesetze aus sehr guten Gründen nicht mehr nach dem „gesunden Volksempfinden“ aus.
Vielleicht noch mal zum Mitschreiben für Sie – ich sage das gerne noch mal laut und langsam, damit Sie das auch gut verstehen –:
In einem Rechtsstaat kontrolliert die Justiz die Exekutive – nicht die AfD, nicht Sie! Die AfD schützt nicht das Recht. Das machen die unabhängigen Gerichte in diesem Land immer noch selber.
Und g…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 51. Sebastian Fiedler (SPD) — ID216000800

- **v1-flagged Wort:** `diffamiere`
- **v2.1 enthält noch:** `Diffamierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Sebastian Fiedler (SPD) verteidigt die GEAS-Reform gegen doppelte populistische Kritik — AfD wirft Souveränitätsverlust vor, Linke/Grüne Entrechtung Schutzsuchender; Fiedler rahmt diese als falsche Dichotomie und wendet sich an die Öffentlichkeit: „Fallen Sie auf beides nicht herein!" Die Reform vereine „Ordnung und Humanität" durch verbindliche Außengrenzen-Verfahren, schnellere Entscheidungen, faire europäische Verantwortungsverteilung und Rechtsstaatlichkeit — das sei das Gegenmodell zur US-Abschreckungspraxis (ICE). An die AfD gerichtet: deren „Grenzschutz" sei Abschottung, deren „Souveränität" Isolation; an Linke/Grüne: wer jede Steuerung als Verrat diffamiere, überlasse das Feld den Radikalen. Schluss: „Ordnung ohne Humanität ist kalt und hässlich; Humanität ohne Ordnung ist naiv."

**v2.1-Summary (neu):**
> Sebastian Fiedler (SPD) verteidigt die GEAS-Umsetzung gegen Kritik von rechts und links: gegen die AfD argumentiert er, dass Europa mit effektiver Steuerung plus rechtsstaatlichen Garantien dem US-Abschreckungsmodell (ICE-Razzien) überlegen ist, und gegen Linke/Grüne betont er, dass strukturierte Verfahren und Begrenzung irregulärer Migration kein moralischer Verrat sind. Seine Kernformel: 'Ordnung und Humanität müssen zusammengehören' — wer schutzbedürftig ist, erhält Schutz; wer keinen Anspruch hat, muss gehen. Er charakterisiert AfD-Positionen als 'Nordkorea-Modell' und Abschottung, und wirft Linke/Grünen vor, durch Diffamierung jeglicher Steuerung das Feld den Radikalen zu überlassen.

**Original-Auszug (Mitte, ~600 chars):**
```
…t nett, dass ich Zurufe bekomme. Ich habe gesagt: Es sind weitere Arme hochgegangen. – Und ich gehe davon aus, dass Sie keine Zwischenfragen mehr zulassen.
Ich würde gerne im Zusammenhang ausführen. – Vielen Dank.
Das haben wir jetzt so wahrgenommen. Und ich bitte, jetzt vom Melden auch abzusehen.
Danke. – Also, was wir machen: Wir schaffen verbindliche Verfahren an den Außengrenzen. Wir sorgen für schnellere Entscheidungen. Wir verteilen Verantwortung in Europa gerechter. Und wir stellen klar: Schutz erhält, wer schutzbedürftig ist. – Wer keinen Anspruch hat, muss unser Land wieder verlassen.…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 52. Anne-Mieke Bremer (Die Linke) — ID216207100

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Anne-Mieke Bremer (Linke) lehnt Social-Media-Verbote als Symbolpolitik ab und attackiert die dahinterliegende Doppelmoral: während Jugendliche digital ausgeschlossen werden sollen, wirbt die Bundeswehr gleichzeitig aktiv 16-Jährige für Kriegsdienste an — das Ziel ist nicht Fürsorge, sondern Kontrolle. Statt Nutzer/-innen auszuschließen, fordert sie Investitionen in Medienpädagogik und strikte Plattformregulierung (Algorithmen-Entschärfung, DSA-Durchsetzung, Datenschutz als Standard) — ein „Internet für alle" mit Recht auf Informationsfreiheit, Teilhabe und Vernetzung, besonders für marginalisierte Gruppen.

**v2.1-Summary (neu):**
> Anne-Mieke Bremer (Die Linke) lehnt pauschale Social-Media-Verbote als „reine Symbolpolitik" ab und prangert eine „Doppelmoral" an: Während der Staat Jugendliche per Gesetz aus digitalen Räumen ausschließen möchte, wirbt die Bundeswehr aktiv in Schulen Minderjährige ab 16 Jahren an. Sie fordert statt Ausschluss aktive Begleitung durch sozialpädagogisches Personal und Investitionen in Jugendarbeit (die derzeit kontinuierlich gekürzt wird), sowie — zentral — konsequente Regulierung der Plattformen selbst: Entschärfung manipulativer Algorithmen für alle Nutzer, Datenschutz by default, Durchsetzung des DSA. Sie lehnt Altersverifikation als massiven Anonymitätsabbau und Überwachungsrisiko ab und rahmt echten Schutz als „Freiheit und Befähigung statt Überwachung und Ausschluss" — mit Recht auf digitale Teilhabe besonders für marginalisierte Gruppen.

**Original-Auszug (Mitte, ~600 chars):**
```
…hzeitig haben Sie kein Problem damit, dass die Bundeswehr aktiv in unseren Schulen bei Minderjährigen für den Dienst an der Waffe wirbt. Wenn es um die Rekrutierung für den Kriegsdienst geht, sind 16-Jährige für Sie plötzlich reif genug;
aber wenn sie sich digital vernetzen wollen, erklären Sie sie für unmündig.
Diese Doppelmoral entlarvt das eigentliche Ziel. Es geht um Kontrolle, nicht um Fürsorge.
Wir als Linke fordern, nicht die Nutzer/-innen einzuschränken, sondern die Konzerne, und zwar alle. Der Vorschlag, Social Media nur für Jugendliche zu regulieren, ist doch völlig absurd; als ob di…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 53. Ronja Kemmer (CDU/CSU) — ID216207200

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `verdammen`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Ronja Kemmer (CDU/CSU) kontert die AfD-Kritik an Internetregulierung durch detaillierte Belegung ihrer Doppelmoral: Sie seien Freunde des iranischen Mullah-Regimes und Putins, die beide das Internet zu Kontrollzwecken einsetzten, statt „Hüter der Freiheit" zu sein. Kemmer setzt dagegen ein klares Modell: Freiheit ist nicht Anarchie, weshalb Jugendschutz vor Schädigungen (Blackout Challenge, Bikinifilter) Staatschutz erfordert — konkret ein stufengerechtes Altersmodell ab ca. 14 Jahren und die EUDI-Wallet als sichere digitale Identität für das „Deutschland auf der Höhe der Zeit".

**v2.1-Summary (neu):**
> Ronja Kemmer (CDU/CSU) konfrontiert die AfD mit ihrer Hypokriesie: Sie inszeniere sich als Verteidigerin der Internetfreiheit, während ihre internationalen Verbündeten (Mullah-Regime Iran, Wladimir Putin) das Internet unterdrückten und intern Kritiker repressiert würden — genau wie die AfD-Fraktion, die Whistleblower ausschließe. Ihr eigentliches Anliegen ist jedoch konstruktiv: Jugendschutz durch wirksame Leitplanken (Stufenmodell ab ca. 14 Jahren), Plattform-Regulierung statt nur Verbote, Umgehungsvermeidung nach australischem Vorbild und Unterstützung der EUDI-Wallet als sichere digitale Identitätslösung; sie kritisiert die AfD schließlich noch des inneren Widerspruchs, digitale Verwaltung zu fordern und zugleich digitale Identitäten zu verdammen.

**Original-Auszug (Mitte, ~600 chars):**
```
… hört eben dort auf, wo die Freiheit eines anderen eingeschränkt wird oder wo die Sicherheit, gerade von Schutzbedürftigen, von Kindern und Jugendlichen gefährdet ist. Und da frage ich Sie mal ganz konkret: Zählt denn zum Beispiel eine Blackout Challenge auf Tiktok bei Ihnen zur Meinungsfreiheit? Zählt ein Bikinifilter, der selbst vor Kindern nicht haltmacht, auf X – Elon Musk ist ja auch so ein internationaler Freund von Ihnen – auch zur Meinungsfreiheit?
Unsere Meinung ist da sehr klar: Minderjährige brauchen auch den Schutz des Staates. Deswegen braucht es Leitplanken und einen wirksamen Ju…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 54. Frauke Heiligenstadt (SPD) — ID216417100

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Frauke Heiligenstadt (SPD) lehnt den AfD-Antrag zur Rückholung von Goldreserven als Krisenrhetorik und Panikmache ab — die aktuelle Verteilung (gut die Hälfte in Deutschland, weitere Bestände in New York und London) sei finanzpolitisch sinnvoll und die Bundesbank sehe keinen Grund für Alarmismus. Sie wirft der AfD Doppelmoral vor: während sie Donald Trump regelmäßig verteile, misstraue sie den USA beim Gold; parallel attackiert sie die AfD mit dem Vorwurf, selbst 107 kg Gold nach Liechtenstein gebracht zu haben und so ihre eigenen Standards (Transparenz, nationale Verantwortung) zu verletzten — „Wer das predigt, sollte zuerst in seinem eigenen Laden aufräumen."

**v2.1-Summary (neu):**
> Frauke Heiligenstadt (SPD) lehnt den AfD-Antrag zur Heimholung der Goldreserven als „Stimmungsmache" und „Krisenschürung" ab und verteidigt die dezentrale Lagerung (Hälfte Deutschland, weitere Bestände New York/London) sowie das Vertrauen in die Bundesbank als Expertin. Sie konfrontiert die AfD mit der Inkonsequenz ihrer Position: während sie Trump regelmäßig verteide, stellen sie die USA bei Goldreserven plötzlich in Frage — und kritisiert die „Doppelmoral" scharf mit der Pointe, dass die AfD selbst 107 kg Gold nach Liechtenstein gebracht haben soll und daher erst „im eigenen Laden aufräumen" sollte.

**Original-Auszug (Mitte, ~600 chars):**
```
… Expertise für diese Fragestellung und übrigens auch mit der Zuständigkeit für die Entscheidung über diese Fragestellung, sieht keine akute Gefahr. Und was macht die AfD? Sie stellt sich mal wieder gegen die Expertinnen und Experten, weil ihr das politisch besser in den Kram passt.
Sachverstand stört Sie offenbar nur beim Empörungsgeschäft.
– Sie machen das ja gerade, Herr König. Empören Sie sich mal weiter! Die Spirale ist noch nicht hoch genug.
Besonders absurd ist dabei die widersprüchliche Haltung der AfD auch zu Donald Trump. Sonst feiern Sie den Präsidenten der USA regelmäßig: Sie feiern…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 55. Heiko Hain (CDU/CSU) — ID216509800

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `Skandalisierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Heiko Hain (CDU/CSU) lehnt den Linke-Antrag zur InRa-Studie ab und kritisiert ihn als Skandalisierung statt sachlicher Analyse: Die Studie selbst differenziere klar, dass offener Rassismus nicht die Regel sei, sondern Herausforderungen in strukturellen Abläufen und Arbeitsbelastung lägen — keinen Beleg für ein „flächendeckendes rassistisches System" liefernd. Hains Frame ist Pragmatismus (bereits bestehende Sensibilisierungsmaßnahmen im BAMF, Vertrauensstellen, Wertebeauftragte) und Verteidigung der Integrität staatlicher Beschäftigten gegen pauschale Verdächtigungen; er lehnt Verbandsklagrechte, AGG-Ausweitung und Eingriffe in Polizeibefugnisse als über die Studienergebnisse hinausgehend ab.

**v2.1-Summary (neu):**
> Heiko Hain (CDU/CSU) widerlegt den Linke-Antrag zur InRa-Studie punkt für Punkt: Er betont, dass das BMI nichts vertuscht hat und die Studie öffentlich zugänglich ist; die Studie selbst differenziere klar, dass 'offener, vorsätzlicher Rassismus nicht die Regel' ist, sondern strukturelle und prozessuale Herausforderungen bestehen — nicht ein flächendeckendes rassistisches System. Er kontert mit einer Aufzählung bestehender Maßnahmen in Bundes-Behörden (Antidiskriminierung, Schulungen beim BAMF, Vertrauensstellen, Wertebeauftragte) und kritisiert die Linke dafür, dass ihre Forderungen (Verbandsklage, AGG-Ausweitung, Befugniseingriffe) 'weit über die Ergebnisse der Studie hinausgreifen' — sein Schlussvotum: Der Antrag setze auf 'Skandalisierung statt sachliche Auswertung, auf Generalverdacht statt differenzierte Analyse'.

**Original-Auszug (Mitte, ~600 chars):**
```
…n des Bundes sind Antidiskriminierung, Sensibilisierung und Beschwerdestrukturen längst fest verankert und werden kontinuierlich weiterentwickelt.
Beim Bundesamt für Migration und Flüchtlinge werden Schulungen ausgebaut und interne Beschwerdestellen gestärkt. Die Bundespolizei verfügt über unabhängige Vertrauensstellen. Und im Bundeskriminalamt gibt es eigene Wertebeauftragte, die sich gezielt mit Fragen von Haltung und Verantwortung beschäftigen.
Der Antrag der Linken fordert darüber hinaus weitreichende Eingriffe, etwa ein Recht auf Verbandsklage gegen staatliches Handeln,
die Ausweitung des…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 56. Dr. Irene Mihalic (BÜNDNIS 90/DIE GRÜNEN) — ID216511500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Irene Mihalic (Grüne) konfrontiert die AfD mit einer zentrale Heuchelei: Martin Reichardt und seine Fraktion gebärden sich als Frauenschützer gegen migrantisierte Gewalt, organisieren aber gleichzeitig Remigrations-Veranstaltungen, auf denen die Opfer eben dieser Gewalt abgeschoben werden sollen. Sie fordert, dass Femizide als strukturelles gesamtgesellschaftliches Problem anerkannt werden — nicht als „importiertes Problem" — und dass die AfD die Verantwortung für Frauenhass nicht ignorieren kann, indem sie selektiv nur Täter verurteilt, die in ihr Weltbild passen.

**v2.1-Summary (neu):**
> Dr. Irene Mihalic (Grüne) wirft der AfD-Fraktion eine Doppelmoral vor: Sie positionieren sich als Beschützer von Frauen vor Fremdgewalt, während sie gleichzeitig auf Remigrationsveranstaltungen die Abschiebung derselben Frauen beraten — „das ist schon ein starkes Stück". Sie kritisiert die AfD-Selektivität, wonach Täter nur anerkannt werden, die ins 'eigene Weltbild passen', und fordert, dass Femizide als strukturelles gesamtgesellschaftliches Problem mit strukturellem Frauenhass als Ursache anerkannt werden — nicht als 'importiertes Problem', sondern als gemeinsame Verantwortung aller. Schluss: Frauen verdienen den Schutz, den die Gesellschaft ihnen geben muss.

**Original-Auszug (Mitte, ~600 chars):**
```
…tellung; das ist einfach nur ungeheuerlich.
Wenn man hier Ihren Reden zuhört – das konnten wir heute bei der Vereinbarten Debatte zum Internationalen Frauentag, das konnten wir eben bei der Eröffnung der Debatte hier auch erleben –, merkt man: Sie sind nur bereit, die Täter anzuerkennen, die ins eigene Weltbild passen. Sie reden keine einzige Sekunde darüber, anzuerkennen, dass Femizide, dass Morde an Frauen ein gesamtgesellschaftliches Problem sind.
Das geht uns alle etwas an. Da können Sie sich nicht rausziehen. Da können Sie sich schon gar nicht aus der Verantwortung nehmen. Da können Sie n…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 57. Dr. Götz Frömming (AfD) — ID216606900

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Götz Frömming (AfD) verreißt die Proteste gegen die Ausschlüsse linksradikaler Buchläden vom Deutschen Buchhandlungspreis als „Festival der Doppelmoral" und wirft dem Kulturbereich vor, Zensur und Boykotte zu predigen, wenn es gegen rechts geht, aber zugleich Staatliche Kulturförderung für eben diese linken Buchläden zu verteidigen — während die AfD-Bezugs-Dresdner Buchhändlerin Susanne Dagen ohne Steuergeld auskomme. Seine Forderung: entweder Streichung aller Subventionen für Buchhandlungen oder konsequente Anwendung derselben Maßstäbe auf links wie auf rechts.

**v2.1-Summary (neu):**
> Dr. Götz Frömming (AfD) attackiert die Proteste gegen den Ausschluss von drei linksradikalen Buchläden vom Buchhandlungspreis als „Festival der Doppelmoral": das Kulturmilieu, das mit Zensur- und Verbotsforderungen gegen rechts auftritt, beklagt nun staatliche Eingriffe unter Berufung auf Kunstfreiheit — während gleichzeitig die Dresdner Buchhändlerin Susanne Dagen (rechtskonservativ) nie staatliche Förderung erhält. Er fordert entweder symmetrische Kulturpolitik (keine Unterschiede zwischen links und rechts) oder den kompletten Verzicht auf staatliche Kulturpreise und -subventionen. Eine Kleine-Anfrage-Antwort des Innenministeriums deutet laut Frömming darauf hin, dass weitere linke Buchhandlungen verfassungsschutzrelevant sind.

**Original-Auszug (Mitte, ~600 chars):**
```
…lichen Wert darauf.
Das Gute an dieser Debatte ist, dass sie das Hauptproblem der deutschen Kulturszene offenlegt, und das ist die Linkslastigkeit und der damit einhergehende Subventionshunger. Daraus entstehen dann so groteske Vorwürfe wie dieser: Herr Weimer nimmt staatliche Eingriffe in die Kulturförderung vor. – Ein Staatsminister für Kultur greift in die staatliche Kulturförderung ein: Stellen Sie sich das einmal vor!
Ich gestatte mir die Frage, warum Buchhandlungen überhaupt mit Steuermitteln gefördert werden sollen.
Bekommen denn der Metzger, der Wurst verkauft, der Kfz-Mechaniker oder …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 58. Michael Frieser (CDU/CSU) — ID216607200

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Michael Frieser (CDU/CSU) verteidigt die staatliche Kulturförderungskontrolle gegen den Vorwurf der Zensur mit einer scharfen Konfrontation: Die gegnerische Debatte sei „pure Heuchelei", da sie das Wort „Extremismus" nicht erwähne — dabei gehe es um die legitime Unterscheidung zwischen verfassungsgeschützter Meinungsfreiheit und diskretionärer staatlicher Förderfähigkeit. Kernposition: „Kein Preis, keine Förderung für Extremisten" — bei Steuergeldern müsse der Staat aufpassen, wem er Geld in die Hand drücke. Er fordert außerdem eine gleichbehandelnde Linie gegen alle Extremismus-Formen (rechts/links/Islamismus/Antisemitismus) und verteidigt das Haber-Verfahren als externe Kontrolle, nicht als Ministerialzensur.

**v2.1-Summary (neu):**
> Michael Frieser (CDU/CSU) verteidigt in einer Konfrontations-Rede den Kulturstaatsminister gegen den Vorwurf der Zensur und nennt die Gesamtdebatte „pure Heuchelei" — ihr Vorredner habe den Begriff „Extremismus" nicht erwähnt, obwohl es genau darum gehe. Frieser unterscheidet scharf zwischen verfassungsgeschützter Meinungs- und Kunstfreiheit und staatlicher Förderfähigkeit: Steuergelder dürften nicht an Institutionen fließen, gegen die Verfassungsschutz-Verdacht auf Extremismus bestehe. Er kritisiert asymmetrische Extremismusbekämpfung („Kampf gegen rechts" intensiv, gegen Linksextremismus/Islamismus weniger) und verteidigt das externe Haber-Verfahren als bewährte Kontrollinstanz aller bisherigen Bundesregierungen.

**Original-Auszug (Mitte, ~600 chars):**
```
… über die Frage institutioneller Kontrolle in diesem Bereich sofort Meinungszensur.
Es besteht ein grundsätzlicher Unterschied zwischen der Frage der Meinungsfreiheit und Kunstfreiheit, so wie die Verfassung sie schützt, und der Frage der Förderfähigkeit, der Förderung durch den Staat. Es handelt sich um Steuergelder, und wer diese Grenze verwischt, der tut das aus ideologischen Gründen.
Das eine ist Meinungsfreiheit, das andere ist Förderung.
Bei diesem Preis geht es um eine besondere Auszeichnung vom Staat für eine Tätigkeit. Damit ist klar, dass wir aufpassen müssen, an welcher Stelle wir w…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 59. Janine Wissler (Die Linke) — ID216703800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Janine Wissler (Die Linke) klagt an, dass die Bundesregierung nichts gegen die Kriegs- und Krisengewinne der Mineralölkonzerne (21 Millionen Euro täglich) unternimmt und Verbraucher, Pendler damit zur Kasse gezogen werden. Sie stellt dem Bundeskanzler eine direkte Frage, ob er den Bundesfinanzminister bei der Einführung einer Übergewinnsteuer unterstützt, und kontrastiert dabei die Regierungs-Ablehnung von Unternehmenssteuererhöhungen mit ihrer faktischen Mehrwertsteuer-Erhöhung — ein Frame der sozialen Ungerechtigkeit und Regierungs-Heuchelei.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Janine Wissler (Die Linke) klagt die Bundesregierung an, angesichts von Lebenshaltungskosten-Krisen (Supermarktpreise, Mieten, Benzinpreise) nicht tätig zu werden und Mineralölkonzerne ihre täglichen Krisengewinne von 21 Millionen Euro abzuschöpfen. Mit sarkastischem Zitaten-Kontrast ('die Zitrone sei ausgepresst' — 'die Zitrone der Mineralölkonzerne ja relativ viel Saft zu enthalten') wirft sie der Koalition Doppelmoral vor und fordert explizit vom Kanzler Unterstützung für die Übergewinnsteuer seines Finanzministers.

**Original-Auszug (Mitte, ~600 chars):**
```
…riegs- und Krisengewinne der Mineralölkonzerne in diesem Land abzuschöpfen. Ich will das noch mal deutlich sagen: Es handelt sich um zusätzliche Gewinne in Höhe von 21 Millionen Euro – pro Tag! –, und das auf Kosten der Verbraucherinnen und Verbraucher, der Pendlerinnen und Pendler. Denen wird das Geld aus der Tasche gezogen.
Bisher haben Sie sich ja immer gegen Steuererhöhungen für Unternehmen ausgesprochen – bei der Mehrwertsteuer sehen Sie es offensichtlich anders – und haben gesagt, die Zitrone sei ausgepresst. Nun scheint die Zitrone der Mineralölkonzerne ja relativ viel Saft zu enthalten…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 60. Gereon Bollmann (AfD) — ID216707600

- **v1-flagged Wort:** `skandalisierte`
- **v2.1 enthält noch:** `Skandalisierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Gereon Bollmann (AfD) bestreitet die von Regierung und Medien skandalisierte Deepfake-Strafbarkeitslücke als juristisches Phantom: Nach § 33 KunstUrhG und § 187 StGB (Verleumdung) seien solche Montagen bereits strafbar, das Deepfake-Verfahren gegen Schauspielerin Fernandes sei nur wegen mangelnder Beweise eingestellt worden — nicht wegen gesetzlicher Lücke. Er attackiert die geplante Klarnamenpflicht als „Wunsch Regierender, zu kontrollieren, was die Menschen denken und sagen dürfen" (Überwachungsstaat-Frame) und wendet sich gegen die „linksaktivistische Lügenplattform Correctiv". Sein Schluss-Kontrast: Statt Internetüberwachung solle sich die Regierung realen Vergewaltigungen zuwenden — 788 Gruppenvergewaltigungen 2025 seien die echte Aufgabe von Politik.

**v2.1-Summary (neu):**
> Gereon Bollmann (AfD) kritisiert die mediale und staatliche Skandalisierung des Deepfake-Falls Fernandes und argumentiert rechtsanalytisch: Es gebe keine Strafbarkeitslücke, da § 33 Kunsturhebergesetz und § 187 StGB (Verleumdung) bereits Deepfake-Verbreitung abdeckten; die Staatsanwaltschaft Itzehoe habe das Verfahren nur mangels Nachweismaterial eingestellt. Er charakterisiert die Klarnamenpflicht-Forderung von Regierung und NGOs als verdeckte Überwachung und wendet sich scharf gegen die „linksaktivistische Lügenplattform Correctiv", die einen Bericht nach Gerichtsfeststellung „erlogen" habe und dennoch weiterverbreitet werde. Sein Kontrastargument: Statt Deepfake-Panik sollte sich die Regierung den realen 788 Gruppenvergewaltigungen des Vorjahrs zuwenden.

**Original-Auszug (Mitte, ~600 chars):**
```
… oder öffentlich zur Schau stellt. Es bedarf wohl keiner Diskussion, dass die Montage des Gesichts einer Person auf eine Darstellung unter diese Norm fällt.
Aber mehr noch: Es gibt den bekannten Straftatbestand der Verleumdung nach § 187 StGB, ganz nah an der Lieblingsnorm vieler dünnhäutiger, meist grüner Politiker, Frau Schauws. Danach wird bestraft, wer wider besseres Wissen in Bezug auf einen anderen eine unwahre Tatsache behauptet oder verbreitet, welche denselben verächtlich zu machen geeignet ist. Diese Voraussetzungen sind ohne Weiteres durch die öffentliche Verbreitung einer Montage g…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 61. Martin Rabanus (SPD) — ID216802600

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `Skandalisierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Martin Rabanus (SPD) lehnt die beiden AfD-Anträge zu Schulgewalt ab und zerlegt deren Argumentationsweise: Die AfD instrumentalisiere ein ernstes Problem (Gewalt an Schulen), indem sie Daten selektiv darstelle und Quellen (Robert Bosch Stiftung) ignoriere, die deren eigene Vergleichbarkeit anzweifeln. Statt echter Lösungen (Schulsozialarbeit, psychologische Unterstützung, alternative Finanzierung) fokussiere die AfD auf Migrationsnarrative; die SPD lehne die Anträge ab, weil sie „Skandalisierung statt kühlen Kopf" betreibe und „um Narrative, nicht um Kinder- und Jugendschutz" gehe.

**v2.1-Summary (neu):**
> Martin Rabanus (SPD) lehnt die beiden AfD-Anträge zur Gewalt an Schulen ab, nicht weil die SPD das Thema unterschätze, sondern weil die AfD es instrumentalisiere: Die AfD mische Messerattacken (von einem Ausländer), Gewaltdelikte, subjektive Lehrkräfte-Einschätzungen und Unfälle zusammen, ohne diese Daten zu validieren, und verschweige dabei ihre eigenen Quellen (Robert Bosch Stiftung), die zur Vorsicht bei Vergleichbarkeit rieten. Rabanus fordert stattdessen 'einen kühlen Kopf statt Skandalisierung' und betont, dass es der AfD nicht um Kinder- und Jugendschutz gehe, sondern um ihre Narrative — echte Lösungen lägen in Schulsozialarbeit, psychologischer Unterstützung und neuen Finanzierungsmodellen, nicht in Herkunfts-Fokussierung.

**Original-Auszug (Mitte, ~600 chars):**
```
…cht.
Ich sage es noch mal: Gewalt an Schulen ist ein enormes Problem. Aber wir wollen einen kühlen Kopf statt Skandalisierung. Wir wollen verstehen, was passiert, und wirksame Maßnahmen – nicht nur Überschriften – generieren oder Tiktoks produzieren.
Dazu ist schon viel Richtiges gesagt worden, auch vom Kollegen Heveling vorhin, der, nicht um sich wegzuducken, sondern weil es verfassungsrechtliche Realität in unserem Land ist,
darauf hingewiesen hat, wo die Zuständigkeiten liegen. Und er hat auch darauf hingewiesen – das will ich noch mal unterstreichen –: Natürlich handelt diese Koalition. – …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 62. Isabelle Vandre (Die Linke) — ID216804000

- **v1-flagged Wort:** `Verdammt`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Isabelle Vandre (Die Linke) richtet eine Zwischenfrage an Körner (AfD) und greift dessen Argument auf, dass Gewalttäter häufig aus patriarchalen Strukturen stammten — stimmt zu, wirft ihm aber einen Doppelstandard vor: Deutschland habe patriarchale Strukturen selbst NICHT überwunden (Gender Pay Gap, Frauengewalt). Ihre Pointe: „Verdammt viel zu tun" und Selbstkritik vor Kritik an anderen Gesellschaften.

**v2.1-Summary (neu):**
> Isabelle Vandre (Die Linke) interveniert in einer Zwischenfrage und widerspricht der impliziten Framierung des vorherigen Redners (Körner): Sie konzediert, dass patriarchale Strukturen tatsächlich ein Gewalttäter-Kontext sind, kritisiert aber die Darstellung als ausschließlich ein Zuwanderungs-Problem. Mit Verweis auf Deutschlands eigenes Gender Pay Gap und Frauengewalt fordert sie Selbstkritik: „Wir haben verdammt viel zu tun und sollten uns selbst an die eigene Nase fassen" — patriarchale Strukturen seien in Deutschland keineswegs „überwunden".

**Original-Auszug (Mitte, ~600 chars):**
```
…. – Sie haben zu Beginn Ihrer Rede ausgeführt, dass diejenigen, die Gewalt anwenden, häufig aus patriarchalen Strukturen kommen. In dem Punkt gebe ich Ihnen recht. Aber Sie haben das so formuliert, als sei es ein Problem, dass Menschen aus patriarchalen Strukturen hierherkommen.
Deswegen frage ich: Sind Sie tatsächlich der Auffassung, dass wir hier in Deutschland, wo wir immer noch ein Gender Pay Gap haben, wo viele Frauen Gewalt erfahren, die patriarchalen Strukturen in der Gesellschaft tatsächlich überwunden haben?
Oder zeigt die Debatte in dieser Woche nicht gerade, dass wir verdammt viel z…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 63. Niklas Wagener (BÜNDNIS 90/DIE GRÜNEN) — ID216805400

- **v1-flagged Wort:** `skandalisierende`
- **v2.1 enthält noch:** `skandalisierenden`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Niklas Wagener (Grüne) nutzt die Zwischenfrage zu einer konfrontativen Gegenrede gegen Schmid (Verteidigungspolitik): Die Grünen-Opposition hätte beim Großprojekt D-LBO (Digitalisierung Landbasierte Operationen) massive Verzögerungen aufgedeckt, obwohl der Minister das im Herbst bestritten habe — das sei legitime parlamentarische Kontrolle, nicht «skandalisierende Oppositionsarbeit». Mit scharfer Pointe attackiert er Schmids bedingungsloses «Schutzwerfen» vor dem Minister und fordert: Der Abgeordnete solle «selbstbewusst» die vom Verteidigungsministerium vorenthaltenen Berichte auf den Tisch einfordern, damit Klarheit über die Digitalisierung der Streitkräfte hergestellt werden kann — um «unsere Soldatinnen und Soldaten im Einsatz» mit modernen, abhörsicheren Funkgeräten auszustatten.

**v2.1-Summary (neu):**
> Niklas Wagener (Grüne) wehrt sich in einer Zwischenfrage gegen den Vorwurf der „skandalisierenden Oppositionsarbeit" und belegt dies mit dem D-LBO-Projekt: Die Regierung habe Verzögerungen im Herbst verneint, die Grünen hätten daraufhin massive Probleme aufdeckt — das sei legitime Oppositions-Nachfordern. Mit rhetorischen Gegenfragen wendet er sich an den Kollegen: Soll es skandalisierend sein, wenn Grüne für abhörsichere Funkgeräte unserer Soldaten kämpfen? Er fordert den CDU-Abgeordneten zu mehr Selbstbewusstsein auf und verlangt, dass vom Ministerium vorenthaltene Berichte auf den Tisch kommen, um die Digitalisierung der Streitkräfte endlich voranzubringen.

**Original-Auszug (Mitte, ~600 chars):**
```
…zu Verzögerungen beim Großprojekt D-LBO – Digitalisierung Landbasierte Operationen – kommt; er hat das verneint. Wir haben in den kommenden Wochen aufdecken können, dass es massive Probleme gibt. Das war unsere Arbeit in der Opposition.
Halten Sie es tatsächlich für skandalisierende Oppositionsarbeit, wenn wir uns durch unser Nachbohren und Nachfragen dafür einsetzen wollen, dass unsere Soldatinnen und Soldaten im Einsatz moderne, einsatzbereite und abhörsichere Funkgeräte haben? Und: Machen Sie es sich hier nicht vielleicht ein bisschen zu leicht, indem Sie sich einfach immer schützend vor Ih…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 64. Dr. Maria-Lena Weiss (CDU/CSU) — ID216808600

- **v1-flagged Wort:** `skandalisieren`
- **v2.1 enthält noch:** `skandalisiere`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Maria-Lena Weiss (CDU/CSU) konfrontiert die AfD direkt mit dem Vorwurf, ihre GKV-Debatte nicht der Lösungssuche, sondern der Spaltung zu nutzen und dabei „einfache Lösungen zu suggerieren, wo es keine gibt" — während die FinanzKommission erst Montag ihre Grundlagen vorlege, dramatisiere die AfD bereits populistisch. Sie verteidigt die Familienversicherung (35 Jahre Erfolgsmodell, 74,5 Mio versichert, 58,6 Mio Beitragszahler) als zentrales Sozialstaats-Versprechen und setzt dagegen die CDU/CSU-Arbeitsweise: sachlich analysieren, dann entscheiden — und Komplexität (Defizit 12 Mrd bis 2027, Gesamtbelastung bis 2035 über 50%) verantwortungsvoll adressieren statt zu skandalisieren.

**v2.1-Summary (neu):**
> Dr. Maria-Lena Weiss (CDU/CSU) wirft der AfD vor, mit ihrer Debatte zum Krankenversicherungssystem nicht um echte Lösungen zu ringen, sondern zu spalten: Sie skandalisiere einzelne Aspekte und suggeriere einfache Lösungen (Familienversicherung abschaffen), während der Debatte faktisch die Grundlage fehle (FinanzKommission legt erst nächste Woche vor). Weiss hingegen setzt konkrete Zahlen (74,5 Mio versichert, 58,6 Mio Beitragszahler, 17,5% Beitragssatz, 12 Mrd Euro Defizit bis 2027, drohende Gesamtbelastung >50% bis 2035) gegen AfD-Populismus und verteidigt die Familienversicherung als bewährtes Erfolgsmodell (seit 35 Jahren, CDU-eingeführt), das die Union mit sachlichem Prozess, not with lauten Lösungen, langfristig tragfähig sichern werde.

**Original-Auszug (Mitte, ~600 chars):**
```
…Erwachsenen deutlich kritischer gesehen. Denn die Menschen sehen halt auch die andere Seite der Realität: Der Beitragssatz liegt bereits bei 17,5 Prozent. Das IGES erwartet ein Defizit von 12 Milliarden Euro bis 2027, und wenn wir nichts ändern, dann droht die Gesamtbelastung der Sozialversicherungen bis 2035 auf über 50 Prozent zu steigen.
Genau das zeigt doch: Wir müssen handeln. Die Debatte um die Stabilisierung dieses Systems, das Millionen Menschen trägt, muss deshalb viel, viel tiefer gehen, als Sie sie heute überhaupt führen wollen.
Es geht um Gerechtigkeit, es geht um Tragfähigkeit, un…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 65. Nyke Slawik (BÜNDNIS 90/DIE GRÜNEN) — ID216810000

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Nyke Slawik (Grüne) charakterisiert den AfD-Antrag zur Streichung internationaler Geschlechtergerechtigkeit-Programme und zum Verbot von Regenbogenflaggen als „einzigen Altherrenwitz" und konfrontiert die AfD mit ihrer Heuchelei: 11 Prozent Frauen in der eigenen Fraktion, aber Vorschriften zu internationaler Frauen- und Geschlechterpolitik; lokale Kritik an „gefährlichen ausländischen Kulturen", aber Streichung von Gewalt-gegen-Frauen-Programmen im Ausland. Sie belegt konkret, wohin solche Politik führt — Polen (Schwangerschaftsabbruch-Todesfälle durch Rechtsunsicherheit), USA (Passentzug, über 1.000 Transpersonen-Flucht aus Kansas) — und ruft Frauen und queere Personen zum Widerstand auf: „Bildet Banden, wehrt euch, und spielt dieses Spiel nicht mit!"

**v2.1-Summary (neu):**
> Nyke Slawik (Grüne) widerlegt die AfD-Anfrage zur internationalen Genderpolitik punkt für punkt und wechselt durch Gegenbeispiele (11% Frauen in der AfD, Epstein-Files, Fälle Pelicot/Fernandes, Polen-Abtreibungsverbot, US-Transpersonen-Verfolgung) die Deutungshoheit: nicht Progressive, sondern die AfD selbst betreibe „Stimmungsmache" ohne echtes Interesse an betroffenen Frauen. Mit dem Appell „Bildet Banden, wehrt euch, spielt dieses Spiel nicht mit!" rahmt sie dies als „Erosion von Bürgerrechten" und strukturelle Bedrohung durch den AfD-Kurs.

**Original-Auszug (Mitte, ~600 chars):**
```
…Homosexualität von der Liste psychischer Erkrankungen durch die Weltgesundheitsorganisation am 17. Mai 1990.
Dass Sie diesen Gedenktag abschaffen wollen, sagt sehr viel über Ihr Weltbild aus.
Sie wollen zudem, dass die Bundesrepublik Deutschland an öffentlichen Stellen nirgendswo mehr eine Regenbogenflagge hisst.
Das ist doch lächerlich. Da sind selbst Markus Söder und Ilse Aigner von der CSU mittlerweile weiter als Sie, die die Flaggen selbstbewusst beispielsweise zum CSD in München hissen.
Sie wollen internationale Programme zur Geschlechtergerechtigkeit einstellen. Wir alle wissen: Gewalt g…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 66. Derya Türk-Nachbaur (SPD) — ID216810600

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Derya Türk-Nachbaur (SPD) kritisiert zwei AfD-Anträge durch präzise Widerspruchs-Aufdeckung: Der UNFPA-Antrag nennt die Organisation gleichzeitig Menschenrechtsverbrecher und lobenswert (Genitalverstümmelung-Bekämpfung, Kinderheirat-Stopp), und der Frame der „Gender-Ideologie" soll die UNFPA-Arbeit in Afghanistan, Somalia und der Ukraine delegitimieren — doch das Antrag-Pair ist ein „Denkfehler mit Briefkopf". Der zweite Antrag offenbart die zentrale AfD-Logik-Falle: Im Wahlprogramm wird Bevölkerungswachstum in Afrika als destabilisierend für Europa verdammt, heute wird Bevölkerungsreduktion als Menschenrechtsverletzung angeprangert — und im Schluss der sarkastische Hammer: Eine Partei, die vor einem Regenbogen mehr Angst hat als vor Putins Raketen, Klimawandel und Kinderarmut, hat ihre Prioritäten verfehlt.

**v2.1-Summary (neu):**
> Derya Türk-Nachbaur (SPD) führt eine Widerlegung gegen zwei AfD-Anträge, die sie auf ihre inneren Widersprüche hin analysiert: Der erste Antrag wirft dem UN-Bevölkerungsfonds gleichzeitig Menschenrechtsverletzungen vor und lobt ihn für die Bekämpfung von Genitalverstümmelung — im selben Dokument. Zusätzlich steht in den AfD-Wahlprogrammen, zu viele afrikanische Geburten destabilisierten Europa, während die aktuelle Forderung Bevölkerungsreduktion als Menschenrechtsverbrechen verdammt (ein 'Denkfehler mit Briefkopf'). Der zweite Antrag fordert deutsche Souveränität durch Kopieren der USA und Verteidigung des 'Abendlands' gegen Regenbogenflaggen. Ihr Schluss-Frame: eine Partei mit Angst vor Regenbogen statt vor Putins Raketen, Klimawandel und Kinderarmut habe ihre Prioritäten verfehlt.

**Original-Auszug (Mitte, ~600 chars):**
```
…dort passiert, zählt nicht, ist weniger wichtig?
Was der UNFPA dort wirklich tut: Er sorgt dafür, dass in Afghanistan nicht alle zwei Stunden Frauen bei der Geburt sterben. Er ist bei Mädchen in Somalia, die mit 13 verheiratet wurden und deren Körper das nicht überlebt hätte.
Er ist auch in der Ukraine. Aber das überfordert Sie alles. Wenn das Ihr abendländisches Menschenbild bedroht, dann liegt das Problem sicherlich nicht beim UNFPA, sondern woanders. Denken Sie mal darüber nach!
Aber der schönste Widerspruch kommt noch. Denn ich habe ja nicht nur den Antrag gelesen; ich weiß auch, was in Ih…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 67. Dr. Konrad Körner (CDU/CSU) — ID216908300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Konrad Körner (CDU/CSU) verteidigt die Neuausrichtung des Programms „Demokratie leben!" durch die Bundesministerin als legitime Verwaltungsentscheidung und grenzt sie sowohl gegen AfD-Vorwürfe als auch gegen linke Populismus-Kritik ab. Seine zwei Eckpunkte sind: (1) Transparente Kontrolle der Mittelvergabe nach Bundeshaushaltsordnung — „Wer zahlt, schafft an" — und (2) Ausschluss von Verfassungsfeinden als „Selbstschutz des Staates"; Antisemitismusförderung bleibt erhalten, und die CDU rühmt sich, sensibler mit Umbruch-Ankündigungen umzugehen als die Grünen. Implizite Heuchelei-Vorwurf gegen die Linke (Eißing / Niedersachsen-Antisemitismus).

**v2.1-Summary (neu):**
> Dr. Konrad Körner (CDU/CSU) verteidigt die Neuausrichtung des Förderprogramms 'Demokratie leben!' gegen Kritik von AfD ('abstruse Träume') und Linke ('populistische Angstmacherei'). Er grenzt Meinungsäußerungsfreiheit von staatlicher Förderung scharf ab und begründet zwei Kernprinzipien der Ministerin: (1) 'Wer zahlt, schafft an' — der Staat muss Letztempfänger kontrollieren und darf sich nicht 'auf beiden Augen blind' verteilen; (2) 'Kein Geld für Verfassungsfeinde' — wer Verfassungsschutz-Erkenntnisse hat, wird nicht finanziert. Er würdigt die Beibehaltung der Antisemitismus-Förderung, wirft Linker 'Heuchelei' vor (Anspielung auf Parteifreunde in Niedersachsen), und kontrastiert das CDU-Vorgehen ('Monats-Vorlauf') mit Grünen ('über Nacht E-Auto-Förderungen kappen') — Kernrahmen: konservatives Bewährungsprinzip ('Gute Systeme halten am Bewährten fest und stellen das Nichtbewährte ein').

**Original-Auszug (Mitte, ~600 chars):**
```
…edem klar. Es ist vorhersehbar, es ist transparent, und es ist fair. Im Übrigen hat das Bundesministerium ausdrücklich schon mit Monaten Vorlauf darauf hingewiesen.
Das muss ich schon sagen, Frau Khan: Wir regieren da ein bisschen sensibler als die Grünen, die über Nacht E-Auto-Förderungen kappen. Wir kündigen das mit Monaten Vorlauf an, sodass sich jeder darauf einstellen kann.
Und wenn Frau Eißing heute ernsthaft behauptet, dass Antisemitismusförderung, die niemand – niemand! – jemals infrage gestellt hat, gekappt wird, dann ist es in Anbetracht Ihrer Parteifreunde in Niedersachsen heuchleri…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 68. Birgit Bessin (AfD) — ID217110100

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Birgit Bessin (AfD) attackiert die Bundesregierung als „schwach und ängstlich" gegenüber dem politischen Islam und fordert ein Verbot des Kinderkopftuchs in Schulen, Sport und Schwimmen — es bedeute Diskriminierung und Freiheitseinschränkung. Sie zitiert BKA-Daten (28.280 islamistische Personen, 9.540 Gewaltbereite, >50% der unter-40-jährigen Muslime „islamismusaffin") und Terre-des-Femmes-Studien über Peer-Druck und Ausgrenzung und wirft der Koalition Heuchelei vor: Das Selbstbestimmungsgesetz werde zelebriert, während Kinderkopftücher toleriert werden — Esken verkörpere diese „Untätigkeit und Ängstlichkeit".

**v2.1-Summary (neu):**
> Birgit Bessin (AfD) attackiert die Bundesregierung als „schwach, ängstlich" gegenüber dem politischen Islam und behauptet, dass 28.280 Islamisten in Deutschland leben, davon 9.540 gewaltbereit, sowie dass fast jeder zweite Muslim unter 40 nach BKA-Daten „islamismusaffin" ist. Sie lehnt das Kinderkopftuch als geschlechterspezifische Diskriminierung ab und zitiert aus der Studie „Terre des Femmes", dass Kopftuch-Mädchen andere ausschließen und überwachen; persönlich attackiert sie Bundesministerin Esken als „schlichtweg einfach dumm" für ihre Haltung und wirft der Regierung vor, seit Jahren untätig zu reden, während sie gleichzeitig das Selbstbestimmungsgesetz hochhält — eine Doppelmoral, die auch muslimische Mädchen ohne Kopftuch treffe.

**Original-Auszug (Mitte, ~600 chars):**
```
…mmer nur das Gleiche.
Ein Kinderkopftuch, meine Damen und Herren, steht aber für geschlechterspezifische Diskriminierung. Es steht für Einschränkung der Freiheit der Kinder in den Schulen, beim Sport, beim Spielen, beim Schwimmen. Es steht für fehlende Selbstbestimmung, während Sie doch alle das Selbstbestimmungsgesetz hier so hofiert haben, meine Damen und Herren.
Ich möchte ganz kurz aus der vorhin schon angesprochenen Studie von Terre des Femmes von vor zwei Jahren zum Kinderkopftuch zitieren:
„Westlich gekleidete Mädchen gelten oft als ‚unrein‘ oder ‚haram‘. Die Bezeichnung Kuffar ist häuf…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 69. Cansu Özdemir (Die Linke) — ID217205000

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `verdammt`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Cansu Özdemir (Die Linke) analysiert die April-2026-Eskalation als sich aufschaukelnde Gewaltspirale, für die sie sowohl die Hisbollah (völkerrechtswidriger Raketenbeschuss) als auch Israel (Bombardierung von Wohngebieten ohne Vorwarnung, geplante Pufferzone im Südlibanon) verantwortlich macht — und verurteilt Deutschland für die Doppelmoral: Berufung auf Völkerrecht bei gleichzeitiger Genehmigung von Rüstungsexporten in die Region. Ihre Forderung ist ein Kurswechsel weg von militärischer Logik hin zu Waffenstillstand, Diplomatie und Unterstützung libanesischer Zivilgesellschaft (CRTD.A, KAFA, ABAAD), denn „Wer Frieden will, darf nicht gleichzeitig Waffen liefern."

**v2.1-Summary (neu):**
> Cansu Özdemir (Die Linke) verdammt die April-2026-Eskalation im Nahen Osten als Gewaltspirale mit über 2.000 Toten und 1 Million Vertriebenen: Sie kritisiert sowohl die Hisbollah-Raketenangriffe als auch — und besonders — die israelischen Bombardierungen dichtsiedler Beirut-Wohnviertel und die geplante Pufferzone als völkerrechtswidrig und unverhältnismäßig. Ihr Kernargument: Stabilität und Frieden entstehen nicht durch militärische Eskalation (die die Hisbollah stärkt), sondern durch Unterstützung der libanesischen Zivilgesellschaft, feministischen Bewegungen (CRTD.A, KAFA, ABAAD) und Entwicklungsarbeit; deshalb fordert sie Stopp deutscher Waffenexporte und wirft der Bundesregierung vor, mit „zweierlei Maß" zu messen: Deeskalations-Rhetorik bei gleichzeitiger Waffengenehmigung.

**Original-Auszug (Mitte, ~600 chars):**
```
…lagen schaffen keine Sicherheit. Sie schaffen neues Unrecht und eine weiter eskalierende Gewaltspirale. Wer glaubt, dass militärische Kontrolle Sicherheit bringt, ignoriert die Erfahrungen dieser Region der letzten Jahrzehnte.
Netanjahu argumentiert mit dem Recht auf Selbstverteidigung. Ich widerspreche der Vorstellung, dass das Recht auf Selbstverteidigung grenzenlos wäre. Selbstverteidigung ist im Völkerrecht klar definiert. Sie ist gebunden an Verhältnismäßigkeit und an den Schutz der Zivilbevölkerung. Wenn aber militärische Maßnahmen dazu führen, dass massiv Zivilisten betroffen sind, dann…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 70. Dr. Konstantin von Notz (BÜNDNIS 90/DIE GRÜNEN) — ID217303300

- **v1-flagged Wort:** `Diffamierungen`
- **v2.1 enthält noch:** `diffamieren`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Konstantin von Notz (Grüne) wendet sich in der Fragestunde an Innenminister Frei und fordert klare Gegenmaßnahmen gegen russische Desinformationskampagnen: Russland befinde sich „längst in einem Schattenkrieg" mit Deutschland und Europa, aktuelle Kampagnen richteten sich mit „Diffamierungen und schlimmsten falschen Geschichten" gegen Bundeskanzler Merz. Im Kontrast zu „anderen Ecken dieses Plenums" (AfD-Anspielung) mahnt er entschlossenen Schutz der Demokratie vor „illegitimer Beeinflussung" an und fragt, welche Maßnahmen die Bundesregierung einleitet.

**v2.1-Summary (neu):**
> Dr. Konstantin von Notz (Grüne) positioniert sich deutlich gegen Relativierungen in der Sicherheitsdebatte und benennt klar: „Russland befindet sich längst mit Europa und Deutschland in einem Schattenkrieg." Er kritisiert Desinformationskampagnen, die gezielt den Bundeskanzler diffamieren und „mit Diffamierungen und schlimmsten falschen Geschichten" digital zirkulieren, und fragt Minister Frei, welche Maßnahmen die Bundesregierung gegen diese „illegitime Beeinflussung unserer Demokratie" ergreift.

**Original-Auszug (Mitte, ~600 chars):**
```
…st angeklungen – der Kollege Baldy hat es gesagt –: Es gibt zahlreiche große Herausforderungen in dieser veränderten geopolitischen Lage, in der wir uns beklagenswerterweise befinden. Russland befindet sich längst mit Europa und Deutschland in einem Schattenkrieg.
Anders als es aus anderen Ecken dieses Plenums hier kommt, muss man das meiner Ansicht nach klar benennen.
Teil dieser Kampagnen gegen Deutschland sind Desinformationskampagnen, die sich gerade aktuell auch gegen den Bundeskanzler richten: mit Diffamierungen und schlimmsten falschen Geschichten, die sich digital ihren Weg suchen. Das…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 71. Dr. Götz Frömming (AfD) — ID217406000

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Götz Frömming (AfD) attackiert die Schulpolitik als Teil eines linken Programms zur Zerstörung der Familie: Der Fund eines Sexratgebers für queere Jugendliche in einer ostsächsischen Schule sei kein Einzelfall, sondern ein Extrembeispiel einer „gezielten Desorientierung" durch Frühsexualisierung und LGBTQ-Propaganda (Dragqueen-Lesungen im Humboldt Forum mit Bundesmitteln, Berliner Falken als Träger mit Skandal-Geschichte). Er wirft der SPD Heuchelei vor — während Klingbeil ein Social-Media-Verbot mit Pornografie-Schutz begründe, bringen sozialistische Organisationen Pornohefte in gedruckter Form in Schulen. Frömming fordert Schulen als „Schutzräume" ohne „sozialistische Experimente", distanziert sich aber abschließend von Anti-Homosexualität-Vorwürfen.

**v2.1-Summary (neu):**
> Dr. Götz Frömming (AfD) verknüpft einen konkreten Schulfall (Pornoheft in einer ostsächsischen Schule) systematisch mit einer ideologiekritischen These: Seit Marx gehöre die Zerstörung der bürgerlichen Familie zum Programm der Linken; einzelne Phänomene wie Dragqueen-Lesungen, Gender-Unterricht, Frühsexualisierung und das Projekt „Original Play" seien Teile eines kohärenten 'Programms zur Zerstörung der Gesellschaft'. Als Gegenbeispiel kritisiert er SPD-Chef Klingbeil wegen Doppelmoral (Netzsicherheit predigen, aber Pornohefte in Schulen dulden). Forderung: Schulen müssen 'Schutzraum' sein; kein Platz für 'sozialistischen Experimente'; Streichung von Bundesmitteln für solche Projekte. Closure mit Abschwächung: 'Wir haben nichts gegen Homosexualität', aber 'dann hört der Spaß auf'.

**Original-Auszug (Mitte, ~600 chars):**
```
…im ostsächsischen Schleife ein Extrembeispiel sein.
Doch er fügt sich so sehr in ein Gesamtbild, sodass man hier nicht mehr von einem Ausnahmefall sprechen kann: Erstklässler in einem Grundschulhort in Berlin-Treptow sollten Dragqueen-Bilder ausmalen.
Im Berliner Humboldt Forum, auch mit Bundesmitteln gefördert, gab es ebenfalls Bilderbuchlesungen von Dragqueens für Kinder.
Unter dem Decknamen „Original Play“ wurde versucht, intensives Kuscheln zwischen Kindern und fremden Erwachsenen als pädagogisches Konzept zu implementieren.
Die Reihe ließe sich beliebig fortsetzen. Die Berliner Falken, di…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 72. Wolfgang Dahler (CDU/CSU) — ID217506100

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `Skandalisierung`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Wolfgang Dahler (CDU/CSU) verteidigt die interne Beratung der Bundesregierung zu Aufgaben- und Standardkritik gegen den Vorwurf der Skandalisierung durch die Grünen-Anfrage: die geleakte Liste sei nur Arbeitsebene gewesen, echte Reformen müssten transparent im Parlament entschieden werden — aber Demokratie brauche auch geschützte Räume des Nachdenkens ohne Vorverurteilung. Sein Frame: ein handlungsfähiger Staat beginnt mit handlungsfähigen Kommunen, die unter wachsenden Aufgaben und knapper Haushalte leiden; der Sozialstaat müsse zukunftsfest, nicht abgebaut werden.

**v2.1-Summary (neu):**
> Wolfgang Dahler (CDU/CSU) verteidigt die vertraulichen Gespräche zwischen Bund, Ländern und Kommunen zur Reformprüfung von Staatstätigkeiten gegen den Vorwurf einer 'Skandalisierung' durch die Grünen-Fraktion; er zitiert Steffen Jäger (Gemeindetag Baden-Württemberg) zur Notwendigkeit ehrlicher Priorisierung und betont, dass Demokratie sowohl Öffentlichkeit als auch 'geschützte Räume des Nachdenkens' brauche. Seine zentrale Verteidigung: die geleakte 'Arbeitsebenen-Liste' sei Reformdiskussion, nicht Entscheidung — letztere würden transparent im Parlament getroffen; dennoch müsse Vertraulichkeit in vorgelagerten Reflexionsprozessen gewahrt bleiben ('Keine Hinterzimmerpolitik, aber auch keine Schnappatmung bei Vorschlägen').

**Original-Auszug (Mitte, ~600 chars):**
```
… sei schon das gemeinsame Nachdenken verschiedener staatlicher Ebenen etwas Anstößiges. Aber das, sehr geehrte Kolleginnen und Kollegen, kann nicht unser Maßstab für ernsthafte Politik sein.
Die jetzt geleakte Liste war eine Sammlung auf Arbeitsebene. Das eigentliche Problem ist nicht, dass solche Gespräche stattfinden, sondern, dass Vertraulichkeit gebrochen wurde und dann verkürzt – ohne nähere Einordnung – geleakt wurde. Das widerspricht dem, was in einer Demokratie möglich sein muss: intern zu beraten, Optionen zu prüfen und Positionen abzuwägen. Das ist keine Hinterzimmerpolitik. Die Skan…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 73. Vinzenz Glaser (Die Linke) — ID21800500

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Vinzenz Glaser (Die Linke) würdigt in einer Gedenkrede zum 75. Jahrestag der deutschen Europarat-Mitgliedschaft die Ursprungsmission als Schutzwall gegen Faschismus, warnt aber vor deren heutigen Versagen: Ungarn unterdrückt Journalisten und Minderheiten, die Türkei verfolgt Gegner, Frontex toleriert illegale Pushbacks und Mittelmeer-Todesfälle, Deutschland erlebe täglich rechte und antisemitische Gewalt, die Pressefreiheit sinke, Femizide bleiben ungeahndet — und Maja T., Antifaschistin aus Jena, wurde rechtswidrig nach Ungarn ausgeliefert. Glaser fordert echte Sanktionen statt Mahnbriefe, den EU-Beitritt zur Menschenrechtskonvention und eine Ende der „Doppelmoral", da „Menschenrechte unteilbar" sind — oder für niemanden gelten.

**v2.1-Summary (neu):**
> Vinzenz Glaser (Die Linke) kritisiert die Doppelmoral des Europarats und warnt, dass Menschenrechte und Demokratie zunehmend unter Druck geraten — trotz der Institution als Hüter dieser Werte nach 1945. Er benennt konkrete Menschenrechtsverstöße in Mitgliedstaaten (Ungarn: Pressefreiheit und Minderheiten; Türkei: Meinungsfreiheit; EU-Außengrenzen: illegale Pushbacks und Mittelmeer-Todesfälle) und wirft dem Europarat vor, sich auf 'Mahnbriefe' zu beschränken, statt echte Konsequenzen durchzusetzen. Zentrale Forderung: die Freilassung von Maja T., einer Antifaschistin, die rechtswidrig nach Ungarn ausgeliefert wurde; sein Schluss-Aphorismus: 'Menschenrechte sind unteilbar. Sie gelten für alle, oder sie gelten für niemanden.'

**Original-Auszug (Mitte, ~600 chars):**
```
…en täglich Menschen im Mittelmeer ertrinken.
Wo, sehr geehrte Damen und Herren, bleibt hier die Antwort des Europarats? Wo ist der politische und rechtliche Druck? Es reicht nicht aus, nur Mahnbriefe zu versenden oder sich besorgt zu zeigen. Die Urteile des Europäischen Gerichtshofs für Menschenrechte dürfen nicht mehr folgenlos bleiben, sondern es braucht endlich echte Konsequenzen.
Sich mit einer Mitgliedschaft im Europarat zu schmücken, schützt nicht vor Menschenrechtsverstößen. Das zeigt sich auch in Deutschland: Im Ranking der Pressefreiheit rutscht Deutschland weiter ab, täglich erleben …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 74. Dr. Wolfram Weimer ((Reg)) — ID21912900

- **v1-flagged Wort:** `diffamieren`
- **v2.1 enthält noch:** `diffamieren`
- **Self-Check:** konfidenz=`hoch`, count_eigene=0

**v1-Summary (alt):**
> Dr. Wolfram Weimer (Staatsminister beim Bundeskanzler) würdigt zum 17. Juni die Freiheitskämpfer der DDR-Rebellion von 1953 und zieht eine direkte Analogie zur ukrainischen Revolution auf dem Maidan und ihrer heutigen Verteidigung gegen Putins Invasion: „die Ukrainer haben seit drei Jahren jeden Tag 17. Juni" und verteidigen damit nicht nur geografisch, sondern existenziell das Ideal der Freiheit und Demokratie. Er kritisiert scharf Extremisten am rechten und linken Rand, die mit Putins Autoritarismus liebäugeln, dem Westen Mitschuld am Krieg geben oder den Rechtsstaat als „DDR 2.0" diffamieren — und bindet diese moralische Grenzziehung in sein Verständnis der politischen Mitte ein: Kohäsion und Koalitionsfähigkeit seien nur mit jenen möglich, die auf Integrität statt Ressentiment bauen.

**v2.1-Summary (neu):**
> Dr. Wolfram Weimer (Staatsminister beim Bundeskanzler) würdigt anlässlich des 17. Juni 1953 den Mut der DDR-Freiheitskämpfer und zieht eine historische Parallele zur Ukraine: beide seien Freiheitskämpfe gegen Diktaturen, und die Ukrainer verdienen volle deutsche Unterstützung nicht erst im Rückblick, sondern jetzt, da sie täglich aufs Neue kämpfen. Er kritisiert Extremisten am rechten und linken Rand scharf — diejenigen, die Putin liebäugeln, die dem Westen Mitschuld am Krieg geben, oder die den deutschen Rechtsstaat diffamieren — und warnt: Politik auf Ressentiment gebaut stelle sich hinter moralische Brandmauern, während die breite politische Mitte auf Integrität und Würde-Respekt baue.

**Original-Auszug (Mitte, ~600 chars):**
```
…meint, dass sie die Freiheit an sich und das Ideal verteidigen. Weil sie bereit sind, für diese Freiheit sogar zu sterben.
Ich fürchte, dass manchen am rechten und linken Rand dieser hohe Sinn für die Würde der Freiheit abgeht. Ich meine damit diejenigen, die mit Putins Panzerstaat insgeheim liebäugeln, weil ihnen in Wahrheit der Autoritarismus gefällt.
Ich meine diejenigen, die behaupten, wir – der Westen, die Amerikaner, die NATO – hätten irgendwie Mitschuld an diesem Krieg. Ich meine die, die unseren demokratischen Rechtsstaat gerne als „DDR 2.0“ diffamieren.
Wenn wir uns also fragen, was w…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

---

## Konfidenz: null/error (104 Reden)

### 1. Otto Strauß (AfD) — ID211001200

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Otto Strauß (AfD) verdammt die Mietpreisbremse als „Paradebeispiel für gescheiterte sozialistische Planwirtschaft" und behauptet, sie habe trotz 10 Jahren die Mieten nicht gesenkt (+ 50% im Schnitt, verdoppelt in vielen Gegenden), sondern nur Wohnungsangebot verknappt — die eigentlichen Ursachen seien stattdessen energetische Bauvorschriften, Energiepreisexplosion, unkontrollierte Zuwanderung. Er fordert Abschaffung der Mietpreisbremse, Deregulierung der Bauvorschriften, Energiesteuersenkung, Zuwanderungsbegrenzung mit konsequenter Abschiebung (sein Satz: „Abschiebung schafft Wohnraum") und Stopp des Heizungsgesetzes als „Enteignung von Kleinvermietern". Die Schluss-Polemik richtet sich scharf gegen die Linke („Fehlt euch die DDR?", Stasi-/SA-Antifa-Vergleiche), dafür erhält Strauß einen Ordnungsruf vom Präsidium — er schließt mit autobiografischer Dachschaden-Metapher (50 Jahre Dachdeckermeister): „Nicht jeder Dachschaden ist reparabel."

**v2.1-Summary (neu):**
> Otto Strauß (AfD) lehnt die Mietpreisbremse als „Paradebeispiel für gescheiterte sozialistische Planwirtschaft" ab und macht nicht Vermieter-Willkür, sondern Energie-Bauvorschriften, die Energiepreisexplosion und „unkontrollierte Einwanderung" für steigende Mieten verantwortlich; er fordert Abschaffung der Mietpreisbremse, Stopp des Heizungsgesetzes (als „Enteignung von Kleinvermietern"), Energiesteuer-Senkungen und Zuwanderungs-Begrenzung mit konsequenten Abschiebungen („Abschiebung schafft Wohnraum"). Mit Berufsautorität als Dachdeckermeister argumentiert er, dass die Linke-Politik zur Wohnungsknappheit führe, richtet sarkastische Fragen an die Linke („Fehlt euch die DDR?") und nennt deren Antrag ein nicht „reparierbares" Problem — vom Präsidium erhielt Strauß darauf einen Ordnungsruf für die SA-Antifa-Charakterisierung.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…verschlechtern, da die Vermieter Investitionen scheuen, wenn diese nicht über eine wirtschaftliche Miete abgedeckt sind.
Statt die Mietpreisbremse weiter zu verschärfen, fordert die AfD eine Politik, die den Wohnungsbau fördert. Dazu gehören die Abschaffung von utopischen energetischen Bauvorschriften, die Senkung aller Energiesteuern und eine Begrenzung der Zuwanderung, gepaart mit der konsequenten Abschiebung aller Ausreisepflichtigen. Abschiebung schafft Wohnraum.
Zudem muss das Heizungsgesetz gestoppt werden, da es zur Enteignung von Kleinvermietern führt und bezahlbaren Wohnraum vernichte…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 2. Christian Görke (Die Linke) — ID21100500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Christian Görke (Die Linke) konfrontiert die AfD mit ihrer eigenen Heuchelei: Sie attackiert die Wahl Gregor Gysis als Alterspräsident, hatte aber 2021 selbst mit der Begründung argumentiert, dass Ostdeutsche durch Seniorität benachteiligt werden – genau Gysis Position. Görke würdigt Gysi über Parteigrenzen hinaus als rhetorisch gewandt, biografisch beachtenswert und Verfechter der deutschen Einheit und ostdeutscher Interessen; er fordert die AfD auf, ihre „Agitation und Trickserei" gegen Gysi im Bundestag einzustellen und nennt das „dem Hause unwürdig".

**v2.1-Summary (neu):**
> Christian Görke (Die Linke) kontert eine AfD-Beschwerde über Ausgrenzung und kritisiert scharf die Doppelmoral: Die AfD habe 2021 selbst mit Dienstjahren-Regeln gegen Ostdeutsche argumentiert (Görke zitiert den damaligen AfD-Antrag wörtlich), nun beschwere sie sich über legitime Parlamentstraditionen-Änderungen. Er attackiert die persönlichen Angriffe auf den gewählten Alterspräsidenten Gregor Gysi und wirft der AfD vor, sich als Opfer zu inszenieren — deren eigentliches „Geschäftsmodell" sei „Diskriminierung und Ausgrenzung vieler Gruppen". Abschluss: Würdigung Gysis als über Parteigrenzen respektierter Parlamentarier.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…rstellung Deutscher, die erst seit dem Beitritt der Länder Sachsen, Brandenburg, Thüringen, Sachsen-Anhalt und Mecklenburg-Vorpommern sowie dem Beitrittsgebiet im Ostteil Berlins dem Deutschen Bundestag angehören können […].“
Meine Damen und Herren, liebe Zuschauerinnen und Zuschauer, merken Sie was? Jetzt haben wir einen waschechten Ossi,
Herrn Dr. Gregor Gysi, der seit 1990 mit kurzer Unterbrechung diesem Hohen Haus angehört.
Und Ihnen, Herr Brandner, fällt nichts Besseres ein, als ihn öffentlich mit diesen Zwischenrufen und dieser Rede zu diskreditieren.
Meine Damen und Herren, hören Sie mi…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 3. Martin Sichert (AfD) — ID211009800

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Martin Sichert (AfD) greift die Union in einer Polemik-sachlich-Mischung auf: er wirft ihr Heuchelei vor, indem er Kanzler Merz mit einem eigenen Zitat von vor zwei Jahren (Mai 2023) konfrontiert — Merz habe damals die Absurdität der Vollversorgung für 300.000 abgelehnte Asylbewerber beklagt, während deutsche Bürger keine Zahnarzt-Termine bekämen. Sicherts konkrete Forderung: Die Union soll gemäß Merz' eigenem Standard arbeitslose Ausländer vom „Rundum-sorglos-Paket" abkoppeln und auf EU-Standard begrenzen (eigenfinanzierte Standardleistungen), wobei die jetzigen 2,5 Mio Ausländer-Bürgeldempfänger die Krankenversicherung jährlich 9 Mrd Euro kosten und durch längere Wartezeiten die Versorgung Berufstätiger und Deutscher beeinträchtigen.

**v2.1-Summary (neu):**
> Martin Sichert (AfD) kritisiert die kostenlose Gesundheitsversorgung für arbeitslose Ausländer als finanzielle Last (2,5 Mio Ausländer auf Bürgergeld kosten jährlich ~9 Mrd Euro in der GKV) und verursacher längerer Wartezeiten für Deutsche; er fragt die Union konkret, ob sie diesem „Rundum-sorglos-Paket" entgegenwirkt, und zitiert dazu Bundeskanzler Merz von vor zwei Jahren: „300.000 abgelehnte Asylbewerber bekommen volle Leistungen, sitzen beim Arzt und lassen sich die Zähne neu machen, und deutsche Bürger kriegen keine Termine." Sein Forderungs-Rahmen: Beschränkung auf Selbstbezahler-Leistungen wie in anderen EU-Ländern.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…en Ausländer in der gesetzlichen Krankenversicherung kosten uns jedes Jahr ungefähr 9 Milliarden Euro. Andererseits führt das aber auch zu deutlich längeren Wartezeiten, weil jede Minute, jede Stunde, die für arbeitslose Ausländer aufgewandt wird, für berufstätige Ausländer und Einheimische fehlt.
Der jetzige Kanzler Merz hat das vor zwei Jahren gut beschrieben, als er sagte – Zitat –:
„Die werden doch wahnsinnig, die Leute, wenn die sehen, dass 300 000 Asylbewerber abgelehnt sind, nicht ausreisen, die vollen Leistungen bekommen, die volle Heilfürsorge bekommen. Die sitzen beim Arzt und lassen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 4. Dr. Johannes Fechner (SPD) — ID211012800

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Johannes Fechner (SPD) verteidigt den automatischen Diäten-Anpassungsmechanismus (an Lohnentwicklung der Bürger, orientiert an Besoldungsgruppe R 6) gegen den AfD-Antrag: das Modell sei transparent, folge unabhängigen Experten seit 2013, senke sich selbsttätig, wenn Bürgerlöhne sinken (wie in Corona-Zeiten) — und die SPD-Fraktion spare zudem durch die Reduktion um 103 Bundestagsmitglieder (500 Mio Euro Ersparnis). Mit Faktizität schlägt Fechner die AfD-Doppelmoral: während AfD-kommunale Anträge 20-70% Erhöhungen forderten (Böhlen, Jerichower Land), kritisiere die AfD jetzt eine 5%-ige Bundestagsanpassung als „Pfründewirtschaft" — „das geht auf keinen Fall".

**v2.1-Summary (neu):**
> Dr. Johannes Fechner (SPD) verteidigt den Automatismus-Mechanismus für Diätenerhöhungen gegen den AfD-Antrag und belegt seine Konfrontation konkret: während die AfD in Kommunalparlamenten Diäten um 70% erhöht habe (Jerichower Land) oder um 20% erhöht habe (Böhlen), kritisiere sie jetzt eine 5%ige Erhöhung im Bundestag — „Pfründewirtschaft vorzuwerfen, das geht auf keinen Fall". Seine zentrale Position: Diäten sollen automatisch an die Lohnentwicklung der Bürger gekoppelt bleiben (Orientierungswert: Besoldungsgruppe R 6), steigen wenn Bürgerlöhne steigen, sinken wenn sie sinken — eine transparente Regel, die 2013 eine unabhängige Expertenkommission entworfen hat. Zusätzlich betont Fechner die Sparleistung des Bundestags: 103 Mitglieder weniger, ~500 Mio Euro Einsparung.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…e sicherten, ist natürlich verlogen. Schauen wir uns doch mal an, was die AfD etwa in Kommunalparlamenten macht. In einer Stadt namens Böhlen haben Sie beantragt, die Diäten um 20 Prozent zu erhöhen.
Im Landkreis Jerichower Land sind Sie sogar für eine Erhöhung von 70 Prozent gewesen, und Sie haben leider eine Mehrheit bekommen.
Und hier kritisieren Sie eine Erhöhung um 5 Prozent!
Zugegeben, die Erhöhung ist in der Summe sehr hoch. Aber Erhöhungen um 70 Prozent zu beantragen und uns dann hier Pfründewirtschaft vorzuwerfen, das geht auf keinen Fall, Kolleginnen und Kollegen von der AfD.
Ich wil…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 5. Stephan Protschka (AfD) — ID211103100

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Stephan Protschka (AfD) lehnt das Tierhaltungskennzeichnungsgesetz als unnötige Bürokratie ab und prangert die Ungleichbehandlung an: nur inländisches Schweinefleisch werde gekennzeichnet, während Importware unter niedrigeren Standards produziert bleiben könne — das verzerrte den Wettbewerb und schädige heimische Landwirte zusätzlich. Als Kernpointe nutzt er sarkastische Absurdität: Ein deutschen Ökoschwein stehe gesetzlich mehr Platz zu (2,3 m²) als einem AfD-Abgeordneten im Fraktionssaal (1,66 m²), was die Heuchelei der Union dokumentiere — die vor zwei Jahren noch von „Tierwohlkiller" und „Rohrkrepierer" gesprochen habe und heute stillschweigend zustimme. Protschka schließt mit Koalitions-Verweigerung: „Mit der AfD könnten Sie es machen, mit der SPD wird nichts dabei rauskommen."

**v2.1-Summary (neu):**
> Stephan Protschka (AfD) lehnt das Tierhaltungskennzeichnungsgesetz ab und kritisiert mehrere Punkte: privatwirtschaftliche Tierwohlprogramme seien bereits funktionsfähig und staatliche Bürokratie überlastet die Betriebe unnötig; die Kennzeichnungspflicht gelte nur für inländisches Schweinefleisch, während Importware aus Ländern mit niedrigeren Tierschutzstandards nicht erfasst werde und damit den Wettbewerb verzerrt. Besonders attackiert Protschka den Positionswechsel der Union (»zwei Jahre ago von ‚Tierwohlkiller' und ‚Rohrkrepierer' gewarnt«, nun stillschweigend mitgetragen) als unglaubwürdig. Seine zentrale Spitze: Ein Ökoschwein habe gesetzlich 2,3 Quadratmeter Platz (1,3 + 1 Auslauf), ein AfD-Abgeordneter im zugewiesenen Fraktionssaal nur 1,66 Quadratmeter — »Das zeigt auf sehr eindrückliche Weise, wie widersprüchlich manche Diskussionen sind«. Abschluss: direkter Wahlaufruf »Mit der AfD könnten Sie es machen, mit der SPD wird nichts dabei rauskommen«.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…e recht.
Und heute? Heute tragen Sie das Gesetz einfach mal stillschweigend mit. Diese Kehrtwende ist nicht nur widersprüchlich; sie wirkt schlicht unglaubwürdig, sehr geehrte Damen und Herren von der Union.
Apropos Haltung: Wir sprechen hier über gesetzliche Mindeststandards für den Platz, den ein Schwein im Stall mindestens haben muss. Doch wenn ich mir die aktuelle Diskussion über unseren Fraktionssaal ansehe, dann muss ich feststellen: Einem deutschen Ökoschwein steht gesetzlich mehr Platz zu als einem AfD-Abgeordneten in diesem Parlament.
Das klingt absurd, meine Damen und Herren, aber es…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 6. Manuel Krauthausen (AfD) — ID211106400

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Manuel Krauthausen (AfD) lehnt die grüne Klimakrise-Narrative als Ideologie ab und präsentiert sich als Emissionsschutz-Fachmann: CO2-Anteil in der Luft (440 ppm, 0,04 %) sei historisch niedrig (Trias: 1.500 ppm), Temperaturschwankungen natürlich und ohne anthropogenes CO2 erfolgt; Vulkane stießen 25 Mrd Tonnen CO2/Jahr aus — 44× Deutschlands Emission (572 Mio t). Mit sarkastischem Ton attackiert er Baerbock und die Grünen (vergleicht sie mit seiner Naivität als Kind), verdammt Windkraftanlagen als Naturzerstörer (SF6 24.000× schädlicher als CO2) und endet mit pointierter Pointe: „Pflanzen Sie neue Bäume, dann klappt das auch mit dem Klimaschutz!" — sein Kern-Frame: CO2 ist für Pflanzenwachstum notwendig, nicht der Feind.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…nnten die Briten bei sich Wein anbauen, und Grönland wurde „Grünes Land“ genannt, weil es eisfrei war, und nicht, weil es von ein paar Grünen erobert wurde.
Sie sehen also: Die Temperaturen schwankten schon immer auf unserer Erde. Es gab Kaltzeiten, es gab Warmzeiten, immer im gleichen Rhythmus.
Die sind auch ohne anthropogenes CO2 gekommen.
Kaiser Karl, die Franken, Heinrich IV. sind in die Schlacht mit Pferden geritten und nicht mit Fahrzeugen mit Verbrennungsmotoren.
Die hatten übrigens auch keine Langstreckenraketen oder Taurus-Marschflugkörper, liebe CDU,
was bestimmt konträr zu der Verpf…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 7. Stephan Protschka (AfD) — ID211307900

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Stephan Protschka (AfD) wirft der CDU/CSU in einer Zwischenfrage Heuchelei vor: Die AfD habe die 80-Prozent-Mindestlohn-Regel für Saisonarbeitskräfte bereits 2021 gefordert, sei damals von der CDU/CSU als 'menschenverachtend' gescholten worden, und nun unterstütze die Regierung dieselbe Forderung. Seine Pointe: Ist die Regelung jetzt nicht mehr menschenverachtend, oder ist nur der rechtliche Rahmen anders — und wenn ja, warum? — eine klassenische Konsistenz-Nachfrage mit Frame der Opportunismus-Vorwurf."

**v2.1-Summary (neu):**
> Stephan Protschka (AfD) stellt dem zuständigen Minister eine Nachfrage zur Saisonarbeitskräfte-Regelung (80 % Mindestlohn): Die AfD habe dies in der letzten Legislatur bereits gefordert, sei damals aber mit dem Vorwurf der 'Menschenverachtung' abgelehnt worden; jetzt unterstütze die Regierung die gleiche Position. Mit subtiler Polemik fragt er nach dem Grund für diesen 'Sinneswandel' — ob die Position nicht mehr menschenverachtend sei oder sich die rechtliche Bewertung geändert habe.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…r geehrter Herr Minister, es geht um die 80 Prozent des gesetzlichen Mindestlohns für Saisonarbeitskräfte, was Sie unterstützen. Ich würde es begrüßen und meine Fraktion natürlich auch, wenn Sie das umsetzen könnten. Meine Frage dazu: In der letzten Legislatur hatten wir als AfD-Fraktion das bereits gefordert. Da hat es Ihre Fraktion leider noch abgelehnt aus rechtlichen Gründen. Es hieß, menschenverachtend wären wir als AfD. Woher kommt der Sinneswandel? Ist das jetzt nicht mehr menschenverachtend, oder ist es jetzt rechtlich etwas anderes, wenn Sie das fordern? Könnten Sie mir das bitte schö…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 8. Dirk Brandes (AfD) — ID211312000

- **v1-flagged Wort:** `fabuliere`
- **v2.1 enthält noch:** `fabuliere`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dirk Brandes (AfD) wirft der Bundesregierung vor, dass „hier ein Riss durchs Haus" gehe: während die Regierung von der „grünen Energiewende fabuliere", möchte die AfD eine saubere und sichere Stahlproduktion in Deutschland sicherstellen. Er zuspitzt die Wahl rhetorisch zu einer FALSE DILEMMA: Kernkraft-Reaktivierung oder Arbeitsplätze — und drängt die Ministerin, sich zu offenbaren, welchem der beiden Ziele (Kernenergie vs. Tausende Arbeitsplätze) sie den Vorzug gibt. Frame: Regierungs-Energiewende als ideologisch vs. AfD-Position als industrie- und arbeitsplatz-realistisch.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dirk Brandes (AfD) kontrastiert in seiner Zwischenfrage an die Ministerin zwei Positionen: während die Regierung von der grünen Energiewende fabuliere, wolle die AfD eine saubere und sichere Stahlproduktion in Deutschland bewahren. Er zuspitzt die Frage: Entscheide sich die Ministerin für Kernenergie-Reaktivierung oder für Tausende von Arbeitsplätzen — als implizite Kritik, dass beides (nach seiner Lesart) nicht gleichzeitig zu haben sei.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
Vielen Dank, Frau Präsidentin. – Frau Ministerin, Sie sehen, hier geht ein Riss durchs Haus. Die einen fabulieren von der grünen Energiewende, wir möchten gerne eine saubere und sichere Stahlproduktion in Deutschland weiter sicherstellen. Es ist ja so: Sie haben sich eben noch mal gegen die Reaktivierung der Kernkraft ausgesprochen.
Wenn Sie abwägen müssten, ob Sie sich für Tausende von Arbeitsplätzen aussprechen oder die Kernenergie noch mal neu aufrollen wollen: Für was entscheiden Sie sich, für die Kernenergie oder für Arbeitsplätze?
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 9. Marc Bernhard (AfD) — ID211315400

- **v1-flagged Wort:** `skandalisiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Marc Bernhard (AfD) greift die Regierungspläne für 40 neue Gaskraftwerke an und skandalisiert die Energiepolitik als „weltdümmstes Desaster": Deutschland habe die höchsten Energiepreise der Welt, Unternehmen verlassen das Land, Bürger können Heizkosten nicht bezahlen — und die Regierung wolle trotzdem Nord Stream 2 schließen, während es auf teures US-Fracking-Gas ausweiche. Kernforderungen: Nord Stream 2 sofort wieder in Betrieb nehmen, Deindustrialisierung stoppen, massive Entlastung, und Aufklärung des Sprengstoff-Anschlags auf die Pipeline (den er als „Terroranschlag" rahmt und der Regierung/den Grünen Untätigkeit vorwirft). Schlusssatz ist direkter Wahlaufruf: AfD werde radikale Energiewende-Umkehr durchsetzen.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Marc Bernhard (AfD) attackiert die Energiepolitik der Bundesregierung als „weltdümmsten Wahnsinn": Gaskraftwerke (20 GW) ohne Gasherkunftsplan, Unternehmensabwanderung durch Rekord-Energiepreise, Bürger können Heizkosten nicht mehr tragen, gleichzeitig Schließung von Nord Stream 2 statt Nutzung. Er kritisiert die geplante US-Flüssiggas-Abhängigkeit (7.000 km Transportweg, höhere Kosten), wirft der Bundesregierung/Grünen vor, die Sabotage der Pipeline nicht aufgeklärt zu haben, und endet mit Wahlaufruf: eine AfD-Regierung werde Nord Stream 2 sofort wieder in Betrieb nehmen, Deindustrialisierung stoppen und Bürger „massiv entlasten".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
… über den Atlantik transportiert werden muss. Das ist weder ökologisch noch wirtschaftlich sinnvoll.
Das Konzept Ihrer Energiewende war und ist, alle Kern- und Kohlekraftwerke durch Gaskraftwerke zu ersetzen
und im Übrigen Deutschland von Zufallsenergien wie Wind und Sonne abhängig zu machen.
In so einer Situation, in der Sie unser Land völlig abhängig gemacht haben von Gaslieferungen, völlig alternativlos, lassen Sie sich einen der wichtigsten Bausteine der deutschen Energieversorgung durch einen staatsterroristischen Anschlag einfach vor der Nase wegsprengen und haben in den drei Jahren – vo…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 10. Dr. Philipp Rottwilm (SPD) — ID211316900

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Philipp Rottwilm (SPD) greift den AfD-Antrag zur Streichung planungsrechtlicher Ausnahmen für Flüchtlingsunterkünfte als „reinen Populismus" an: Als ehemaliger Bürgermeister zeigt er faktisch auf, dass die Streichung nicht Flüchtlinge trifft, sondern Kommunen zwingt, Turnhallen, Jugendherbergen und Wohnungen zu blockieren, die anderen bürgern fehlten — „das ist nicht sozial, das ist zynisch". Er entlarvt die AfD-Heuchelei (gleichzeitig Bürokratieabbau fordern, aber hier mehr Bürokratie wollen) und belegt mit Daten: Asylanträge sind auf 8.000/Monat (Mai 2025) gesunken, auf Vorkrisenniveau von 2013 — „unsere Politik wirkt". Der Antrag sei überdies überflüssig, da die Ausnahmeregelung 2027 automatisch ausläuft.

**v2.1-Summary (neu):**
> Dr. Philipp Rottwilm (SPD) lehnt den AfD-Antrag zur Streichung planungsrechtlicher Ausnahmen für Flüchtlingsunterkünfte als reinen Populismus ab und widerlegt ihn mit praktischen Konsequenzen: Als ehemaliger Bürgermeister zeigt er, dass Geflüchtete auch ohne Sonderregeln den Kommunen zugewiesen werden, dann aber in Turnhallen, Jugendherbergen und teuer angemieteten Wohnungen untergebracht werden müssen — was nicht den Geflüchteten, sondern auch Schulkindern und jungen Familien schadet. Er entlarvt den AfD-Doppelstandard (Bürokratieabbau fordern, aber mehr Hürden schaffen), betont, dass die Asylzahlen dramatisch gefallen sind (Mai 2025: 8.000 Erstanträge, Stand von 2013), und dass die Sonderregeln 2027 ohnehin auslaufen. Sein Schlussframe: Der AfD-Antrag sei 'billige Hetze', nicht nur gegen Flüchtlinge, sondern gegen alle, die verstanden haben, dass Zusammenleben nur miteinander funktioniert.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…geht, sondern sie leiden unter Ihren Vorschlägen. Das ist nicht sozial, das ist zynisch, meine Damen und Herren!
Eines finde ich bei Ihrem Antrag wieder besonders absurd. Gerade Sie von der AfD rufen ja bei jeder Gelegenheit nach Bürokratieabbau. Aber hier wollen Sie plötzlich mehr Vorschriften, mehr Hürden, mehr Formalismus. Es kann Ihnen gar nicht bürokratisch genug sein. Ein Schelm, wer Böses dabei denkt!
Da zeigt sich wieder Ihr wahres Gesicht: Sie wollen unseren Staat nicht verbessern, Sie wollen ihn spalten.
Wir dagegen bringen gerade den Bauturbo auf den Weg und schaffen damit Planungse…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 11. Katharina Beck (BÜNDNIS 90/DIE GRÜNEN) — ID211400900

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Katharina Beck (BÜNDNIS 90/DIE GRÜNEN) kritisiert mit scharfem Konfrontations-Tonfall das CDU/CSU-SPD-Steuersenkungspaket als Union-Heuchelei: Genau das, wofür die Union die Ampel „am Nasenring durch die Manege gezogen" hat — Steuersenkungen quersubventioniert durch Schulden — führe die Union nun selber durch. Ihre Alternative: Schließung von Steuerlücken in Erbschaft und Immobilien (28,5 Mrd Euro aus Cum-Cum-Aufdeckung), statt der irreführenden degressiven Abschreibung als falscher „Investitionsbooster" (kein Investitions-Garantie, da Ausschüttung an Aktionäre möglich); gleichzeitig kritisiert sie die AfD-Heuchelei: deren geplante Verkürzung der Aufbewahrungsfristen auf 5 Jahre hätte Cum-Cum-Aufklärung bereits verunmöglicht.

**v2.1-Summary (neu):**
> Katharina Beck (BÜNDNIS 90/DIE GRÜNEN) kritisiert das CDU/CSU-SPD-Steuersenkungspaket als Heuchelei: genau das, was die Union vier Jahre lang den Grünen vorwarf ('am Nasenring durch die Manege'), werde nun durch Schuldenaufnahme finanziert — dabei hätten die Grünen Schulden für strukturelle Investitionen eingesetzt. Sie desmaskiert das CDU-Narrative eines 'Investitionsboosters' als 'degressive Abschreibung', die nur mehr Liquidität für Unternehmen — und potenziell Aktionärs-Ausschüttungen — bringe, keine Investitionsgarantie. Ihr Antrag: Finanzierung stattdessen über Schließung von Steuerlücken in der Erbschafts- und Immobilienbesteuerung (wo Millionenerben oft null Steuern zahlen) und Aufklärung der 28,5 Milliarden Euro aus Cum-Cum. Gegen die AfD argumentiert sie kontrafaktisch: deren Forderung nach Verkürzung der Aufbewahrungsfristen hätte Aufklärung verunmöglicht.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…st doppelt irreführend: Man hat zwar mehr Geld. In der Anhörung haben wir aber gehört, dass das auch an die Aktionärinnen und Aktionäre ausgeschüttet werden kann.
Das ist keine Investitionsgarantie.
Es kann Investitionen bewirken, aber es ist eben keine Investitionsgarantie. Die zweite Irreführung ist, das als absolut neu und innovativ zu bezeichnen. Als Ampel haben wir das auch schon zweimal gemacht. Also, meine Damen und Herren, lassen Sie sich bitte nicht vom Selbstlob der Union irritieren!
Jetzt zu unserem Antrag. Wir möchten gerne, dass das Geld da eingenommen wird, wo es heute noch irref…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 12. Mirze Edis (Die Linke) — ID211405800

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Mirze Edis (Die Linke) verdammt den AfD-Gesetzentwurf zur Klimaschutzfolgenbereinigung als ideologische Zeitverschwendung und „Deregulierungswahnsinn", der Klimaschutzgesetz, Erneuerbare-Energien-Gesetz, Wärmeschutz und Ladeinfrastruktur abschaffen würde — während 2024 schon 60 % des deutschen Stroms aus erneuerbaren Energien stammte. Aus seiner 37-jährigen Erfahrung als Betriebsrat im Stahlwerk Duisburg heraus klagt er an, dass die Altparteien (CDU, CSU, SPD, Grüne, FDP) durch unzureichenden Arbeitsplatzschutz und mangelnde Industriestrategie den Nährboden für AfD-Populismus geschaffen haben — und fordert stattdessen eine staatlich gelenkte Energiewende mit Arbeitsplatzsicherung, Gewinnabgaben und Allgemeinwohlorientierung: „Nur die Ewiggestrigen und die Hassprediger von der AfD haben das noch nicht begriffen."

**v2.1-Summary (neu):**
> Mirze Edis (Die Linke) lehnt den AfD-Gesetzentwurf zur Grundgesetzänderung (Artikel 143h) ab und kritisiert ihn als „geradezu irrsinniges Produkt" einer „Orgie der Deregulierung": Streichung aller Klimagesetze, Rückkehr zur Atomkraft mit Entschädigungen für Betreiber, während 60 Prozent des 2024 produzierten Stroms bereits aus erneuerbaren Energien stammte. Als langjähriger Betriebsrat (37 Jahre Duisburg Stahlwerk) verknüpft er die Energiewende mit Arbeitsplatzschutz und fordert eine staatlich gelenkte Wirtschaft mit strategischen Partnerschaften: Investitionen nur unter Bedingungen von Arbeitsschutz, Standortsicherung und echten Klimainvestitionen — nicht die „neoliberalen Scheinlösungen" der bisherigen Regierungen. Sein Abschluss ist ein Solidaritäts-Aufruf an die Betriebsräte als „Spezialistinnen und Experten des Wandels".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…e eigentlich nicht, dass Sie die Mutter aller Probleme in Deutschland geworden sind?
Eine Zahl reicht, um den Wahnsinn hinter diesem Vorschlag zu verstehen: 2024 wurden fast 60 Prozent des hier in unserem Land produzierten und eingespeisten Stroms aus erneuerbaren Energien hergestellt. Die AfD will uns schlicht und einfach aus ideologischen Gründen den Strom abdrehen. Auch das steht im sogenannten Gesetzentwurf. Die Betreiber der Atommeiler in Deutschland sollen für den entstandenen Gewinnausfall entschädigt werden. Ich finde, diese Rolle rückwärts hin zu teurer und gefährlicher Atomenergie un…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 13. Marc Bernhard (AfD) — ID211406500

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Marc Bernhard (AfD) attackiert die deutsche Klimapolitik als gescheiterte und selbstschädigende Heuchelei: unter Berufung auf Mercator-Institut und Wissenschaftliche Dienst kalkuliert er konkret, dass die CO2-Steuer bis 2027 auf 200–300 Euro steigen werde (von aktuell 55 Euro), was vierköpfigen Familien 8.000 Euro jährlich koste, während China und Indien per Pariser Abkommen unbegrenzt ihre Emissionen erhöhen dürften — Deutschland „verbietet, zahlt, verzichtet" vergebens. Seine Forderungen: Abschaffung der CO2-Steuer, massive Energiesteuersenkungen, Stopp des Windenergieausbaus und Wiederinbetriebnahme von Kernkraftwerken als AfD-Programm einer „Fackel der Hoffnung" gegen die gescheiterte Energiewende.

**v2.1-Summary (neu):**
> Marc Bernhard (AfD) argumentiert mit konkreten Zahlen gegen die deutsche Klimapolitik: Der CO2-Preis steige von aktuell 55 Euro auf 200-300 Euro (2027), was 8.000 Euro Kosten pro Familie bedeute; die Mercator-Studie bestätige dies. Er kritisiert das Pariser Klimaabkommen als Doppelmoral, die China, Indien und Schwellenländer (70% des CO2) unbegrenzte Emissionen erlaubt, während Deutschland sich selbst „stranguliert" — ein „Irrsinn" nationale Alleingänge. Seine Forderung: AfD-Regierung würde Energiewende sofort rückabwickeln, CO2-Steuer abschaffen, Windkraft stoppen und Kernkraft reaktivieren, um Energie „bezahlbar" zu machen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…hre Politik unterstützt, sagt ganz klar: 200 bis 300 Euro.
Das bedeutet umgerechnet direkte und indirekte Kosten für jede vierköpfige Familie von 8 000 Euro.
Ich habe gerade gesagt: Deutschland verbietet, Deutschland zahlt, Deutschland verzichtet. Und der globale CO2-Ausstoß steigt immer weiter und weiter. Denn Ihr eigenes Pariser Klimaabkommen erlaubt China, Indien und allen Schwellen- und Entwicklungsländern, also den Ländern, die 70 Prozent des menschengemachten CO2 erzeugen, ihren CO2-Ausstoß unbegrenzt, ohne Limit, immer weiter zu erhöhen – das ist Ihre Regelung –, während Sie die Mensche…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 14. Dr. Bernd Baumann (AfD) — ID211500200

- **v1-flagged Wort:** `diffamiert`
- **v2.1 enthält noch:** `denunziert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Bernd Baumann (AfD) konfrontiert den Bundesminister direkt mit der Schuldfrage: die Merkel-Regierung (CDU/CSU) habe die „weltgeschichtlich einmalige" Migrationskrise heraufbeschworen, der Minister selbst trage persönliche Verantwortung als Teil eben dieser Regierung und müsse das eingestehen. Baumann instrumentalisiert dann die Übernahme von AfD-Argumenten durch die Koalition als Beweis dafür, dass die AfD seit Jahren die „Einzigen" mit richtigen und „höchst bürgerlichen" Migrationskritik-Positionen seien — die Regierung habe diese jahrelang als „ausländerfeindlich" diffamiert und mit einer „Brandmauer" isoliert. Der Präsidium unterbricht ihn mehrfach wegen Regelverstoß; der Minister wird zur Gegenäußerung aufgefordert.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dr. Bernd Baumann (AfD) attackiert den Innenminister während der Debatte zum Familiennachzugs-Gesetz: Er wirft der Merkel-Regierung und dem Minister persönlich vor, die „weltgeschichtlich einmalige Situation" der Millionenwanderung herbeigeführt zu haben, während der Minister diese Konsequenzen jetzt beklagt. Hauptvorwurf ist die „Heuchelei": Die CDU/CSU habe jahrelang AfD-Migrationsargumente als „ausländerfeindlich" und „menschenfeindlich" denunziert und eine „Brandmauer" errichtet, übernehme diese Argumente nun aber faktisch — Baumann fordert ein explizites Eingeständnis, dass die AfD-Kritik „richtig" und „höchst bürgerlich, höchst vernünftig" war.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "Heuchelei"   ],   "begruendung_falls_unsicher": "Das Wort 'Heuchelei' wird nicht wörtlich vom Sprecher genutzt; er verwendet 'Brandmauer' und spricht von 'übernommen haben' + impliziter Inkonsistenz, aber nicht explizit 'Heuchelei'. Korrekt wäre: 'Inkonsistenz' oder 'Widerspruch' statt Heuchelei in der Summary." }

**Original-Auszug (Mitte, ~600 chars):**
```
…Regierung war, die diese weltgeschichtlich einmalige Situation heraufbeschworen hat.
Und Sie haben auch mit keinem Wort erwähnt, dass Sie persönlich als Minister in der Regierung Merkel dafür Verantwortung tragen; Sie sind sozusagen höchstpersönlich Regierung Merkel.
Dazu hätten Sie hier gerne was sagen können. Vielleicht können Sie es im Nachgang noch mal machen.
Zum Zweiten. Die Einzigen, die diese Argumente der Kritik über lange Jahre vorgetragen haben, waren wir von der AfD. Sie haben sämtliche Punkte von uns übernommen,
die Sie jahrelang nach draußen hin als ausländerfeindlich, als mensch…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 15. Dr. Christian Wirth (AfD) — ID211500400

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Christian Wirth (AfD) stimmt dem Familiennachzugs-Aussetzungsgesetz zu, charakterisiert es aber als „viel zu klein" – nur 12.000 Nachzügler bei 250.000 Asylanträgen/Jahr sind ein „Tropfen auf den heißen Stein" angesichts von 8,7 Mio Nettozuwanderung seit 2005. Seine Kernforderung: radikaler Paradigmenwechsel mit Dublin-Verordnungs-Korrektionen, Suspendierung des EU-Asylrechts bis zur Außengrenzenkontrolle, nationale Souveränität über Einreise/Nachzug, und scharf polemisch gegen Die Linke („Ersatzproletariat", Kuba-Sarkasmus), deren Gegenantrag zur Nachzugserleichterung er als „Absurdität" verdammt.

**v2.1-Summary (neu):**
> Dr. Christian Wirth (AfD) kritisiert scharf den Gesetzentwurf der Union zur Aussetzung des Familiennachzugs für subsidiär Schutzberechtigte als symbolische 'Kleinstigkeit': 12.000 Personen pro Jahr bei 250.000 jährlichen Asylanträgen und 8,7 Millionen Netto-Zuwanderung seit 2005 — nur ein „Tropfen auf den heißen Stein". Er stimmt dem Gesetz zu, erklärt aber unmissverständlich, dass es die AfD nicht für hinreichend hält, sondern für einen „allerersten, viel zu kleinen Schritt" in die richtige Richtung. Seine Kernforderung: grundlegender Paradigmenwechsel durch Reinterpretation der Dublin-Verordnung, Suspendierung des EU-Asylrechts bis zur Außengrenz-Sicherung und Steuerung von Migration als Souveränitätsrecht — nicht als verfassungsrechtliche Verpflichtung. Den Gegenanträgen der Linken wirft er vor, noch mehr Menschen ins Land zu holen und von «Ersatzproletariat»-Intentionen getrieben zu sein; die Regierung beschuldigt er der «Realitätsverweigerung» bei unterlassenem Migrationskontrollwillen.

**Original-Auszug (Mitte, ~600 chars):**
```
…r 12 000 Menschen durch. Meine Damen und Herren, das ist nicht verantwortungsvolle Politik, das ist Realitätsverweigerung.
Die AfD steht für eine grundlegend andere Asylpolitik. Wir brauchen einen Paradigmenwechsel.
Ich habe es hier mehrfach gesagt, und ich werde es wieder sagen: Das europäische Asylrecht ist gescheitert. Aber selbst wenn man die Dublin-Verordnung ordnungsgemäß historisch-theologisch auslegt, ist nach Artikel 3 nur ein Staat in Europa für die Prüfung zuständig. Es gibt eine Ausnahmeregelung in Artikel 20 Absatz 4. Dort steht: Wenn der Flüchtling in ein weiteres Land geht – was…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 16. Martin Erwin Renner (AfD) — ID211701400

- **v1-flagged Wort:** `Diffamierung`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Martin Erwin Renner (AfD) attackiert die Merz-Regierung wegen Weitergabe von Millionen/Milliarden in linksideologische Kulturförderung, Medienprogramme und NGO-Subventionierung — obwohl Merz vor der Wahl „Links ist vorbei" sagte. Er charakterisiert den Kulturbetrieb als „Schattenregierung" eines „linken Syndikats" (Medien, Kultur, NGOs), das durch Subventionen gekauft und als Instrument der Diffamierung und Neutralisierung von Oppositionellen genutzt wird. Sein zentrales Frame: „woken Zeitgeist" und systematische Bestrafung der ideologischen Nonkonformität; sein Stilmittel: Kampfvokabular wie „ballaballa", „genderesk", „vielfaltstrunken" und die Metapher des Falschfahrens ('rechts blinken, links abbiegen').

**v2.1-Summary (neu):**
> Martin Erwin Renner (AfD) kritisiert scharf die Kulturförderung und die Medienlandschaft als Orte einer „linken Ideologieagenda" und bezeichnet das Zusammenspiel von Kulturszene, NGOs und Medien als „Schattenregierung ohne demokratische Legitimation". Sein Vorwurf: Der Bundeskanzler sage „Links ist vorbei", fördere aber weiterhin Projekte zu „Nachhaltigkeit", „Vielfalt" und „Geflüchteten" — ein „rechts-Blinken, eisern links-Abbiegen" — während nur wer sich „unterwirft", Förderung erhält; Medien seien „politische Aktivisten" statt neutrale Instanzen. Ein Ordnungsruf unterbricht die Rede.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…t unabhängiger Verlage, Förderung für geflüchtete Kultur- und Medienschaffende. „Nachhaltigkeit“, „Vielfalt“, „Geflüchtete“: All das sind Signalwörter, die die linken Herzen höherschlagen lassen.
Also wie immer: Tüchtig rechts blinken, aber dann eisern links abbiegen,
immer in Richtung der neuen politischen Mitte, die den meisten Menschen in unserem Land heutzutage jedoch immer linksradikaler erscheint. Alles betrieben durch ein linkes Syndikat aus Medien, Kulturbetrieb und NGOs, einer Struktur, die mit immer neuen Schuldnarrativen, mit immer neuen Moralappellen die Bürger unserer Gesellschaft…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 17. Adam Balten (AfD) — ID212203300

- **v1-flagged Wort:** `Diffamierung`
- **v2.1 enthält noch:** `diffamieren`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Adam Balten (AfD) nutzt eine Kurzintervention zur sarkastischen Attacke auf die angebliche Diffamierung der AfD durch Mainstream-Akteure (CDU, Antifa, Jusos) und wirft der Bundesregierung mangelnde Rechtssicherheit vor: Welche Ausdrücke im Migrationskontext seien noch „konform"? Mit der ironischen Forderung nach einem „Wortministerium" dramatisiert er den Vorwurf der Sprachkontrolle; zentral ist die Frage nach einer verbindlichen Definition von „Hass und Hetze", die ihm als AfD-Politiker fehle.

**v2.1-Summary (neu):**
> Adam Balten (AfD) nutzt eine Kurzintervention, um eine Frage an den Präsidium gestellt zu haben (zur Fragestunde) zu pointieren: Er kritisiert den Begriff „Hass und Hetze" als unzureichend definiert und beklagt eine mangelnde „Rechtssicherheit", was WortWahl betreffe. Sarkastisch fordert er eine „Wortministerium", die festlegt, welche Migrations-Begriffe ('Flüchtlinge', 'Migranten', 'Ausländer', 'Neubürger', 'Ankommende') erlaubt sind. Im Vorspann wirft er der CDU vor, mit der Antifa gegen die AfD zu demonstrieren und diese „als Nazis zu diffamieren".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "diffamiert"   ],   "begruendung_falls_unsicher": "Das Wort 'diffamiert' ist vom Sprecher selbst genutzt, aber mit evaluativer Kraft — es ist eine Anklage, nicht eine bloße Beschreibung. Ich habe es als Zitat markiert mit Distanz-Kennzeichnung ('wirft vor'), was die neutralitäts-Standards erfüllen sollte. Alternativ: 'kritisiert als' oder 'beschuldigt'." }

**Original-Auszug (Mitte, ~600 chars):**
```
…ren Verbänden gegen uns demonstriert und uns als Nazis diffamiert, uns beleidigt usw. usf. Mich würde sehr interessieren: Was genau ist denn dieses „Hass und Hetze“? Ich habe mittlerweile keine Rechtssicherheit mehr. Ich bin mir nicht mehr sicher, was ich überhaupt sagen darf und was ich nicht sagen darf.
Ich würde mich sehr darüber freuen, wenn es eine zentrale Stelle geben würde, –
Das Wort zur Kurzintervention hat jetzt der Abgeordnete. Danach gibt es die Chance, zu antworten.
– vielleicht schaffen Sie demnächst noch eine – eine Art Wortministerium, wo ich nachfragen kann, welche Wörter noc…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 18. Karsten Hilse (AfD) — ID212207900

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Karsten Hilse (AfD) führt eine aggressive Polemik gegen die Grünen als ‚kommunistische Partei mit kranken Pädophilen und Nationalsozialisten', die Umweltzerstörung betreiben und Kriegstreiber sind, während sie ihre eigenen Kinder vor dem Fronteinsatz bewahren — eine ‚widerwärtige Heuchelei'. Er verknüpft die grüne Klimapolitik kausal mit linksextremistischen Gewaltakten (Hochspannungsmast-Brandstiftung in Berlin, 50.000 Haushalte), kritisiert das ‚Altparteienkartell' als feige und opportunistisch und kündigt an, dass die AfD ‚sobald wir in Regierungsverantwortung sind' eine Politik ohne ‚Ideologie' durchsetzen werde — ein impliziter Wahlaufruf.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Karsten Hilse (AfD) führt eine durchgehend polemische Rede gegen die Grünen und das gesamte Altparteienkartell: Er rahmt Grüne als von Kommunisten kapertes, ideologisch naturwissenschaftlich unterbildetes System, das Umweltzerstörung betreibt, Krieg treibt und über Gewalt und Einschüchterung ihre Ziele durchsetzt — mit direktem Zitat des Kommunikationswissenschaftlers Bolz, Grüne seien „dumm oder böse". Zentraler Vorwurf der Heuchelei: grüne Führung würde deutsche Kinder an die Front opfern, während eigene Kinder geschützt werden. Sein Frame: AfD als einzige nicht-linke Partei gegen eine ideologische Machtergreifung durch Gewalt und Terror; bei Regierungsübernahme werde die AfD „Politik des gesunden Menschenverstands" ohne Ideologie durchsetzen — impliziter Wahlaufruf am Schluss.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…itiativen der Abgeordneten, flankiert von Terroranschlägen der faschistischen Hilfsgruppen, um die Menschen in Angst und Schrecken zu versetzen
und die Regierung zu zwingen, den wahnwitzigen Forderungen zu folgen. Das ist es, was Sozialisten und Kommunisten immer machen: Wenn die Menschen ihnen nicht freiwillig folgen, greifen sie zu Gewalt und Terror, um sie auf Linie zu bringen.
Aber glücklicherweise erkennen immer mehr Menschen gerade im Osten, aber auch im ländlichen Bereich im Westen, dass die Grünen eine Ansammlung von naturwissenschaftlich unterdurchschnittlich gebildeten und bösartigen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 19. Lars Schieske (AfD) — ID212402100

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lars Schieske (AfD) attackiert in seiner Jungfernrede die Haushaltspriorisierung der Regierung scharf: während Milliarden für Migration, linke Ideologie-Projekte (Demokratiefördergesetz, Stiftung Mitarbeit) und Klimapolitik flössen, erhielten THW (1.200 Gebäude, 1/3 sanierungsbedürftig, Fuhrpark unterausgestattet), Feuerwehren und Sportvereine nur „Almosen". Er kontrastiert dies mit Regierungs-Klimarhetorik („Höllensommer, Klimakollaps") und wirft der Koalition Doppelmoral vor: während „gegen rechts mit voller Wucht" vorgegangen werde, würde „importierter Extremismus" im Sport (Beispiel Union Cottbus) ignoriert — andere Vereine, die sich wehrten, würden bestraft. Seine Frame-Synthese: Ehrenamt und Sport seien das „Rückgrat der Gesellschaft", würden aber systematisch zugunsten „ideologischer Strukturen" vernachlässigt; Forderung: Senkung Migrations- und Ideologie-Ausgaben, massive Erhöhung für THW/Feuerwehren/Sport.

**v2.1-Summary (neu):**
> Lars Schieske (AfD) kritisiert im Haushalt 2025 die Unterfinanzierung von Katastrophenschutz (Technisches Hilfswerk mit ~1.200 Gebäuden, ca. ein Drittel sanierungsbedürftig; über 50% Fuhrpark-Defizit), Freiwilligen Feuerwehren (teilweise noch mit DDR-Technik) und Sportstätten, während die Regierung „Milliarden für Migranten, linke Projekte und Klimaideologie" ausgebe. Er wirft der Koalition eine „Doppelmoral" vor: Sie alarmierten ständig vor Klimakollaps und Katastrophen, verweigerten aber den Rettern finanzielle Hilfe; gegen rechts fahre sie „mit voller Wucht auf", gegen „importierten Extremismus und Gewalt auf unseren Sportplätzen" aber „kneifen Sie alle" (Anekdote Union Cottbus). Kernforderung: Kürzung von Migration und ideologischen Förderprogrammen (Demokratiefördergesetz, Stiftung Mitarbeit), Umleitung in THW, Feuerwehren und Sportvereine.

**Original-Auszug (Mitte, ~600 chars):**
```
…attdessen pumpen Sie Millionen in angebliche ehrenamtliche Projekte, die in Wahrheit ideologische Spielwiesen sind. Die Förderung von Ankommens- und Teilhabeprozessen, die Stiftung Mitarbeit, die Deutsche Stiftung für Engagement und Ehrenamt – das sind typisch linke Projekte. Herr Merz, Sie sagten neulich: „Links ist vorbei“. Ihr Haushaltsplan beweist das Gegenteil. Sie machen weiter linke Politik – gegen das Ehrenamt, gegen die Basis, gegen die Menschen, die dieses Land im Ernstfall wirklich retten würden.
Jetzt komme ich zum Sport. Auf dem Papier steigen auch hier die Mittel leicht an, doch …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 20. Cansu Özdemir (Die Linke) — ID212404400

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Cansu Özdemir (Die Linke) zerlegt die Bundesregierung in ihrer Außenpolitik-Bilanz als fundamentale Heuchelei und Doppelmoral: Sie kooperiere mit Taliban-Regime, unterstütze Al-Sharaa in Syrien trodessen Verantwortung für Massaker an Minderheiten, mache Öl- und Rüstungsdeals mit Saudi-Arabien — alles unter der Etikette „wertegeleiteter Außenpolitik" — während sie das Völkerrecht selektiv anwende (streng gegen Russland in der Ukraine, duldsam gegen Israels Verstöße in Gaza). Sie fordert Ende der Abschiebungen in Terrorregime, Stopp der Rüstungsdeals, konsequente Kritik unabhängig von Allianzpartnerschaften, und Deutschlands Wandlung zu einem konstruktiven Friedensakteur statt Konflikt-Befeuerer.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Cansu Özdemir (Die Linke) attackiert die Bundesregierung für eine „Doppelmoral" in ihrer Außenpolitik: während sie eine „wertegeleitete" Politik proklamiert, kooperiert sie mit den Taliban, unterstützt Al-Sharaas Regime in Syrien (wegen Massakern an Minderheiten), schließt Öldeals mit Saudi-Arabien und normalisiert autoritäre islamistische Regime, um Abschiebungen zu rechtfertigen — „knallharte Interessenpolitik" statt Werteorientierung. Sie kritisiert zudem die selective application des Völkerrechts: während Russlands Ukraine-Invasion zu Recht verurteilt wird, wird die israelische Besatzungspolitik in Gaza (Zehntausende Tote) in Berlin „beschönigt und relativiert". Ihre Forderung: Deutschland als konstruktiver Friedensakteur mit nachhaltiger Konfliktlösung, statt Friedens- und Entwicklungspolitik zu kürzen und Konflikte zu befeuern.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "Heuchelei"   ],   "begruendung_falls_unsicher": "Das Wort 'Heuchelei' wird von der Sprecherin in Anführungszeichen genutzt ('Das ist Heuchelei'), aber es ist ein stark wertendes Konzept aus der Tier-A-Liste. In der Summary würde 'Heuchelei' als direktes Sprecher-Zitat verstanden (neutral für die Sprecherin), aber die Methodologie könnte es als 'editorial language' interpretieren. Die anderen wertenden Wörter ('Doppelmoral', 'zynisch', 'knallharte Interessenpolitik') werden vom Sprecher wörtlich oder sinngemäß vertreten; 'Heuchelei' ist ein bewertender Begriff, den der Sprecher nutzt, um ihre Position auszudrücken — er ist im Original-Text vorhanden." }

**Original-Auszug (Mitte, ~600 chars):**
```
… Sie das unter wertegeleiteter Außenpolitik verstehen, dann muss ich ganz klar sagen: Das ist knallharte Interessenpolitik.
Herr Wadephul, Fluchtbewegungen verhindert man nicht, indem man die Menschen wieder in diese Terrorregime abschiebt. Sie stellen sich dann hierhin und sagen, Sie versuchen, die Lebenssituation dort zu verbessern. Es ist einfach nur zynisch, wenn Sie gleichzeitig aber diese autoritären islamistischen Regime vor Ort stärken, und zwar wirtschaftlich. Diese Regime werden von Ihnen auch noch relativiert und normalisiert.
Dann skandalisieren Sie innenpolitisch den Umstand, dass…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 21. Katrin Fey (Die Linke) — ID212404900

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Katrin Fey (Die Linke) verdammt den Außenwirtschaftshaushalt als „Krieg und Kahlschlag" und ankert ihre Kritik in der Mittelmeer-Flucht-Katastrophe: Während Frontex (1 Mrd Euro) Boote abdrängt, kürzt die Bundesregierung NGO-Seenotrettung und humanitäre Hilfe um 53 Prozent — verantwortlich für Millionen Tote nach UN-Angaben (nur 114 von 305 Millionen Menschen versorgt). Sie fordert eine zivile EU-Seenotrettungsmission nach dem Mare-Nostrum-Modell (240 Mio Euro) und sichere legale Fluchtwege statt militärischer Dominanz im Etat.

**v2.1-Summary (neu):**
> Katrin Fey (Linke) kritisiert den AA-Haushalt 2025 in sozialklägerischer Tonalität scharf: Während Frontex 1 Milliarde Euro kostet, um Flüchtlingsboote abzudrängen, streicht die Bundesregierung Unterstützung für NGOs in der Mittelmeer-Seenotrettung — „Das ist zynisch!" Sie fordert eine zivile EU-Seenotrettungsmission nach dem Vorbild der Operation Mare Nostrum (240 Millionen Euro), sichere legale Fluchtwege und kritisiert die 53-prozentige Kürzung humanitärer Hilfe angesichts von 305 Millionen Menschen in Not (nur 114 Millionen versorgt): „Haushalt? Krieg und Kahlschlag!"</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…t zynisch!
Eine zivile EU-Seenotrettungsmission muss her, mit Schiffen, die wirklich Menschen retten. Von NGOs dafür entwickelte Konzepte gibt es schon längst. Sie orientieren sich an der früheren Operation Mare Nostrum – Kosten: 240 Millionen Euro, ein Bruchteil des Etats von Frontex. Dafür müssen Haushaltsmittel zur Verfügung gestellt werden. Klar ist auch: Seenotrettung alleine ist keine Lösung. Menschen brauchen sichere, legale Fluchtwege, damit Familien nicht auf Boote steigen müssen und damit Schlepper nicht profitieren.
Die Wahrheit ist: Ihr Haushalt ist ein Desaster. In einer Zeit der …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 22. Sergej Minich (AfD) — ID212409000

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Sergej Minich (AfD) verdammt den Einzelplan 30 (Forschungsministerium) als „einfallslosen linken Gesinnungshaushalt" — ein „Steuerzahlerbuffet für Ideologen, Parteistiftungen und Prestigeprojekte". Er attackiert systematisch die 340-Mio-Stiftungsförderung (nur parteinahe Stiftungen), den DigitalPakt Schule (1,6 Mrd Euro 2025, aber keine Leistungsverbesserung), die Nachhaltigkeitsforschung (über 700 Mio für „Workshops für Weltverbesserer"), die Kerntechnik-Verwaltung als „bestbezahltes Endlager", die Villa Vigoni am Comer See, die DATI (463 Mio für Beamten-Entscheidungen über Markttauglichkeit — Sarkasmus: „Wenn jemand den Markt versteht, dann ja wohl die Verwaltung"), und das Scicomm-Portal („Heulsusenprojekt"). Im Schlusspunkt attackiert er direkt die CSU-Ministerin Bär, indem er deren Deutschlandfunk-Zitat („Die Grünen können es einfach nicht") gegen sie selbst wendet: „Sie können es auch nicht".</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…ie Vermehrung von Politikerphrasen.
Während man Milliarden Euro in die Ideologie steckt, wird bei der Kerntechnik nur eins gemacht: Entsorgung. Karlsruhe, Jülich – Hunderte Millionen Euro für das Verschieben alter Fässer und die Bezahlung von Sitzungen. Forschungsergebnisse: null. Aber immerhin haben wir hochbezahlte Arbeitsplätze geschaffen: das wahrscheinlich bestbezahlte Endlager der Welt.
Hier werden nicht Probleme gelöst, hier wird Verwaltung in Beton gegossen.
Dann, meine Damen und Herren, haben wir noch die Villa Vigoni, Italien, Comer See, die Gegend, in der sonst Hollywoodstars und Ol…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 23. Christian Görke (Die Linke) — ID212701500

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Christian Görke (Die Linke) attackiert die Sportförderungspolitik als dramatisches Versagen: Deutschland investiere nur ein Drittel dessen, was Großbritannien, Frankreich oder Australien bereitstellten; Kaderathleten erhielten 800 Euro monatlich zur Existenzsicherung, während Bundestrainer bei 60-Stunden-Wochen nur Facharbeiterlöhne bekämen. Er beschuldigt die Staatsministerin der Heuchelei (die beschworene „Sportmilliarde" seien faktisch nur 330 Mio bis 2028, bei 40 Milliarden Euro Investitionsstau in Sportstätten) und fordert: existenzsichernde 1.800-Euro-Mindestförderung, Beendigung von Personalkürzungen, und — als Kernforderung — erst finanzielle Strukturreformen, DANN Bewerbungen für Olympische Spiele.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Christian Görke (Die Linke) kritisiert die deutsche Spitzensportförderung als strukturell unterfinanziert und realitätsfern: während Großbritannien, Frankreich und Australien je 400-500 Mio Euro jährlich ausgeben (eine US-Universität allein 330 Mio), stehen im deutschen Haushalt 2024-2028 insgesamt nur 330 Mio bereit. Die Hälfte der Kaderathleten erhält 800 Euro monatlich von der Sporthilfe, während Bundestrainer mit Befristung 60 Stunden arbeiten; dazu kämen 4 Trainingswissenschaftler für 4.000 Sportler in Brandenburg. Görke fordert eine existenzsichernde Mindestförderung von 1.800 Euro monatlich für Kaderathleten, tatsächliche Umsetzung der 'Sportmilliarde' (nicht 330 Mio bis 2028), und: nur wer strukturelle Probleme im Spitzen- und Breitensport LÖST, dürfe Olympia-Bewerbungen einreichen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…, nein, mehr: Das ist skandalös!
Deshalb fordern wir als Linke gemeinsam mit den Athleten in Deutschland eine existenzsichernde Mindestförderung unserer Kaderathleten von 1 800 Euro pro Monat. Mal ehrlich: Wer seine besten Athleten zwischen Training und Existenzkampf wählen lässt, hat jedes Recht verwirkt, von „Spitzensportförderung auf hohem Niveau“ in der Bundesrepublik zu sprechen.
Meine Damen und Herren, ein kleiner Lichtblick: Zumindest für die 17 Olympiastützpunkte in Deutschland gibt es etwas mehr. Aber diese Erhöhung deckt nicht mal den Inflationsausgleich der letzten Jahre ab.
Gleichz…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 24. Sergej Minich (AfD) — ID212809600

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Sergej Minich (AfD) verdammt den Haushalt des Forschungsministeriums als „Verschwendungspolitik" im Gewand eines „Zukunftsplans": 18,5 Mrd Euro würden mit der Gießkanne verteilt (263 Mio Studentenaustausch, 80 Mio Schuldigitalisierung, garantierte 3%-Aufwüchse für Forschungsorganisationen), während deutsche Schulen verwarlosen und das DLR 1,6 Mrd Euro zusätzlich ab 2026 bekommt ohne erkennbare Ziele. Er fordert Steuersenkungen, Bürokratieabbau, Leistungskonditionalisierung statt Flatrate-Finanzierung und Beendigung „ideologischer" Förderprogramme (Critical Whiteness Theory, CSD-Propaganda), kritisiert zudem 6,3 Mrd neue Verpflichtungsermächtigungen bis 2033 als Schuldenpolitik — sein Frame: nicht Forschungsförderung, sondern PR-Maschine ohne Fokus und Effizienz.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…arf weiter in maroden Hörsälen dozieren. Exzellenz nach der Bundesregierung: ein bisschen Glitzer obendrauf, damit man das Bröckeln darunter nicht sieht.
Richtig absurd wird es mit der Raumfahrt. Ab 2026 fließen 1,6 Milliarden Euro zusätzlich in diesen Bereich, dazu 644 Millionen Euro allein für das DLR. Aber was sind die Ziele des DLR: forschen, koordinieren, nur die Ergebnisse umsetzen? Das ist nicht ersichtlich.
Hauptsache, das Geld fließt.
Wie hatte die Forschungsministerin letzte Woche auf meine Rede zum Haushalt 2025 noch mal sinngemäß erwidert: Es sei auch absurd, einer CSU-Ministerin l…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 25. Ulrike Schielke-Ziesing (AfD) — ID212900200

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Ulrike Schielke-Ziesing (AfD) attackiert den Bundeshaushalt 2026 für Arbeit und Soziales als reine Verschleierungsstrategie: Die versprochene Bürgergeldreform sei faktisch ein Nullsummenspiel mit Hoffnungen statt Maßnahmen (1,5 Mrd Euro Einsparungen nur auf dem Papier), die Rentenkasse werde durch Abbau der 43-Mrd-Nachhaltigkeitsrücklage „ausgeplündert", und die großen Sozialkassen (Gesundheit, Pflege, BA) schreiben tiefrote Zahlen — 6 Mrd 2025, 11,6 Mrd 2026 als reine Kredite statt Lösungen. Sie verdammt die Sondervermögen-Kaschierung („Verschiebebahnhof für parteipolitische Spielchen"), kritisiert die neue Work-and-Stay-Agentur (25 Mio Euro, Duplikat neben drei anderen Agenturen) und warnt vor 2027+ mit Rentenbeiträgen über 22 Prozent und sinkendem Rentenniveau auf 45 Prozent — ein „direkter Weg in die Altersarmut". Ihr Leitmotiv: „Hoffen ist keine Regierungsarbeit" / „Machen, nicht hoffen" — die Regierung hinterlasse zukünftigen Generationen nur „verbrannte Erde".

**v2.1-Summary (neu):**
> Ulrike Schielke-Ziesing (AfD) kritisiert den Haushalt 2026 für das Bundesministerium für Arbeit und Soziales als „dürftig" und voller „Verschleierung": Die versprochene Bürgergeldreform spare nur 1,5 Mrd Euro durch nicht-existente Maßnahmen (gestiegenes Kindergeld, Jobturbo, vage „Belebung der Wirtschaft"), bei der Rente werde die 43-Mrd-Nachhaltigkeitsrücklage ausgeplündert statt aus Steuermitteln zu finanzieren — ab 2029 sollen Beitragssätze über 20% Richtung 22% steigen bei sinkendem Rentenniveau (45%), ein direkter Weg in Altersarmut. Sie attestiert der Koalition „Hoffen statt Regierungsarbeit", Kostenverschiebung auf Kommunen (Ukraine-Regel), sinnlose Neugründungen (Work-and-Stay-Agentur für 25 Mio Euro neben Weiterbildungsagentur und Jugendberufsagenturen) und prangert die Sondervermögen als „Verschiebebahnhof für parteipolitische Spielchen" an — bestätigt durch den Bundesrechnungshof. Ihr Frame: Mit Krediten könnten die Probleme nicht gelöst werden, das hinterlasse „verbrannte Erde" für zukünftige Generationen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…d da bin ich gar nicht mal überrascht – auf die Rentner und die Beitragszahler zurück. Für die nächsten drei Jahre werden Sie sich an diesen Reserven bedienen, um sich politische Zeit zu kaufen, und nach Ihnen dann die Sintflut. Da fehlen einem nur noch die Worte.
Darüber werden wir bestimmt in den Beratungen sprechen, sprechen müssen. Und vor allem müssen Sie sich dann gegenüber den Rentnern und den Beitragszahlern erklären.
Und wo wir über die Zukunft sprechen: Die Deutsche Rentenversicherung hat die Zahlen für die Zukunft schon mal vorgelegt. Ab 2029 sollen die Beitragssätze jenseits von 20…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 26. René Springer (AfD) — ID212900700

- **v1-flagged Wort:** `polemisiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> René Springer (AfD) polemisiert in dieser Sozialbudget-Rede gegen die Bürgergeld-Gewährung an ukrainische Flüchtlinge und Migranten: die „Regierung" trage die Verantwortung dafür, dass „Ukrainer einfach so nach Deutschland kommen können" und „vom ersten Tag an hier eine Wohnung" erhalten, während deutsche Arbeitende „am Ende des Monats keinen Cent mehr in der Tasche haben" — eine „alleinerziehende Kassiererin" zahle für den „Verrat an den eigenen Leuten". Springer fordert einen sofortigen „Stopp der Einwanderung in die Sozialsysteme", Bürgergeld nur für Deutsche, Sachleistungen für Asylbewerber mit Arbeitspflicht, Stopp der Auslands-Bewerbung von Sozialleistungen und sofortige Abschiebung bei Betrügerei. Der Schluss rahmt die AfD-Stärke als Ausdruck des Volkswillens gegen das „hinterlassene" Erbe der Vorgänger-Regierungen; eine Zeitüberschreitung führt zu Ordnungsruf.

**v2.1-Summary (neu):**
> René Springer (AfD) kritisiert die Sozialpolitik der Regierung gegenüber Ukrainern scharf: Bürgergeld, unbegrenzte Mietübernahme und der Zugang zum deutschen Sozialstaat vom ersten Tag an seien 'Beute für Fremde', während deutsche Arbeiter und besonders alleinerziehende Kassiererinnen kaum über die Runden kämen. Er fordert einen 'wehrhaften Sozialstaat' mit sofortigem Einwanderungsstopp ins Bürgergeld, zehnjähriger Wartefrist für Ausländer, Sachleistungen statt Geldleistungen für Asylbewerber, Arbeitspflicht und sofortige Abschiebung von Betrügern; die Regierung trage die 'Verantwortung' für diesen Kurs, der die Gesellschaft 'spaltet' und 'ruiniert'. Springer überschreitet die Redezeit und wird vom Präsidium unterbrochen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…setzen. Und genau das ist der Grund, warum Sie den deutschen Pass verramschen, als gäbe es kein Morgen mehr.
Ich kann Ihnen eins sagen: Für all das, was Sie hier angestiftet haben, zahlen die Fleißigen, die Anständigen, die, die jeden Tag arbeiten, Steuern zahlen und am Ende selbst kaum über die Runden kommen.
Für das, was Sie hier hinterlassen haben, zahlt die alleinerziehende Kassiererin, die sich ab Monatsmitte nur noch die reduzierte Ware leisten kann. Und genau dieser Verrat an den eigenen Leuten spaltet unsere Gesellschaft und ruiniert unseren Sozialstaat. Sie ruinieren unseren Sozialsta…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 27. Sarah Vollath (Die Linke) — ID213016900

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Sarah Vollath (Die Linke) lehnt den AfD-Antrag zur Abgeordnetenrente scharf ab, den sie als Plagiat des Linken-Antrags von Matthias Birkwald mit sarkastischem Ton („auf Wish bestellt", „Optiker könnte nicht schaden") als Heuchelei entlarvt: Die AfD fordere zwar Gleichbehandlung, klammere aber die Abgeordneten selbst aus (Grenze 9.900€ bei Diät über 11.800€), und nur 10 von 151 AfD-Abgeordneten unterstützten ihren eigenen Antrag. Vollaths Gegenforderung: Bundestagsabgeordnete sollen auf ihr GESAMTES Einkommen Rentenbeiträge zahlen ohne Schlupflöcher; sie kündigt einen eigenen Linken-Antrag für echte Rentengerechtigkeit an und rahmt den AfD-Antrag als „Symbolpolitik" zur Verdummung von Arbeitern.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Sarah Vollath (Linke) attackiert den AfD-Antrag zur Abgeordnetenrente als unsaubere Kopie des Linke-Antrags, die als „auf Wish bestellt" alle Details falsch macht: Die AfD fordere zwar Gleichstellung, setze die Beitragsbemessungsgrenze aber nur auf 9.900 Euro, während die Abgeordnetendiät seit Juni über 11.800 Euro liegt — „scheinheilig" und „absolut unanständig", weil nur 10 von 151 AfD-Abgeordneten ihren eigenen Antrag unterstützen. Sie kontrastiert dies mit der Linke-Position: Abgeordnete sollen wie alle Arbeitnehmer/-innen auf ihr gesamtes Einkommen ohne Schlupflöcher Rentenbeiträge zahlen, und kündigt einen eigenen Antrag zu echter Rentengerechtigkeit an.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…0 Euro Beiträge zahlen. Und da wundert es mich herzlich wenig, dass die ach so bürgernahen AfD-Politiker/-innen Folgendes tun: Sie setzen diese Grenze auf gegebenenfalls 9 900 Euro. Was „gegebenenfalls“ bedeutet, sagen die natürlich nicht. Die Abgeordnetendiät liegt aber seit Juni bei monatlich über 11 800 Euro und damit deutlich über der Obergrenze, die sie fordern. Das ist scheinheilig!
Liebe Bürger/-innen, die tun so, als ob sie eine Gleichbehandlung von Abgeordneten und allen anderen Menschen wollen, die ins Rentensystem einzahlen. Und dann sind sie nicht mal dazu bereit, in ihren Antrag z…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 28. Lars Klingbeil ((Reg)) — ID21302600

- **v1-flagged Wort:** `denunzieren`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lars Klingbeil (SPD, Bundesfinanzminister) konfrontiert direkt den AfD-Abgeordneten Brandner: Während die Regierung Einsparpotenziale definiert habe (mehr Druck auf Bürgergeldempfänger mit Schwarzarbeit-Verdacht, Sanktionen für Nicht-Kooperateure), verteidigt Klingbeil zugleich den Sozialstaat als funktionierendes Gemeinschaftswerk, das sich um Bedürftige, Menschen mit Behinderung und Alleinerziehende kümmert — ein 'riesiger Skandal' bleibe die Lohnarmut. Mit persönlicher Schärfe wirft er Brandner vor, mit seinem 'Kumpel Wladimir Putin' die Ukraineflüchtlinge zu denunzieren; solange der Krieg andauere, sei Deutschland 'eine unterstützende Kraft' für die Geflüchteten.

**v2.1-Summary (neu):**
> Lars Klingbeil (SPD, Finanzminister) interveniert konfrontativ in der Debatte: gegen einen AfD-Abgeordneten (Brandner) verteidigt er den deutschen Sozialstaat ('froh und stolz') und kritisiert dessen Haltung gegenüber ukrainischen Kriegsflüchtlingen scharf ('wie Sie auf Menschen gucken' — implizite Anklage von Xenophobie). Gleichzeitig nennt er konkrete Einsparpotenziale (Druck auf Nicht-Kooperatoren, Schwarzarbeits-Kontrollen im Bürgergeld), betont aber die Unabdingbarkeit von Unterstützung für Alleinerziehende und Menschen mit Behinderung, und bekräftigt das deutsche Engagement für Ukraine-Flüchtlinge solange der Krieg andauert. Die Rede wird von Präsidium-Ermahnung unterbrochen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "riesiger Skandal"   ],   "begruendung_falls_unsicher": "Der Ausdruck 'riesiger Skandal' wird vom Sprecher selbst verwendet (wörtliches Zitat: 'das ist ein riesiger Skandal'), daher ist er legitim in der Summary. Konfidenz 'mittel' statt 'hoch', weil die Wortwahl 'Skandal' eine ethische Bewertung ist, die zwar vom Sprecher kommt, aber knapp an der Grenze zu eigener Editorialisierung liegt — wird durch wörtliches Zitat jedoch gerechtfertigt." }

**Original-Auszug (Mitte, ~600 chars):**
```
…d sind und bei der Schwarzarbeit erwischt werden.
Aber ich will Ihnen auch sehr klar sagen: Wir können froh und stolz sein, dass wir einen Sozialstaat haben, der funktioniert,
der sich um Menschen kümmert, die gestolpert sind, die hingefallen sind, der sich kümmert um Menschen mit Behinderung, der sich beispielsweise um Alleinerziehende kümmert, die arbeiten und trotzdem nicht genug Geld haben; das ist ein riesiger Skandal.
Herr Brandner, Sie haben gerade offenbart auch, wie Sie auf Menschen gucken, die wegen des Krieges in den letzten Jahren aus der Ukraine geflohen sind. Ich hätte mir gewüns…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 29. Ulrich von Zons (AfD) — ID213102100

- **v1-flagged Wort:** `Skandalisierung`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Ulrich von Zons (AfD) lehnt den Gesetzentwurf zur Aufnahme sexueller Identität ins Antidiskriminierungsrecht grundsätzlich ab und attackiert die Grünen durch systematische Skandalisierung: Homosexualität sei nicht Identität sondern Orientierung, die geplante Definition könne nicht Furries, Zoophilie, Pädophilie ausschließen, und mündet in die Pointe, die Grünen wollten „unsere Verfassung ändern, um in Deutschland 72 Geschlechter zu erhalten" — parallel zu Terroristen und 72 Jungfrauen. Mit direktem Wahlaufruf fordert er SPD/FDP auf, das Gesetz mit der AfD gemeinsam abzulehnen und schließt: „Gehen Sie in Würde".

**v2.1-Summary (neu):**
> Ulrich von Zons (AfD) lehnt den Gesetzentwurf zur Einfügung von 'sexuelle Identität' in das Grundgesetz ab und argumentiert, dass die Grünen Homosexualität / Bisexualität / Heterosexualität (sexuelle Orientierung) mit Identität verwechselten und damit implizit auch Nekrophilie, Zoophilie und Pädophilie schützen würden; in sarkastischem Ton vergleicht er das Anliegen mit dem Schutz von '72 Geschlechtern'. Er wirbt für eine gemeinsame Ablehnung des Gesetzentwurfs durch SPD und CDU/CSU und ruft dazu auf, die Regierungskoalition abzuwählen — ihr sei 'ideologisch verblendete Politik' nachzuweisen, die 'enormen Schaden' an Heimat, Staat, Industrie angerichtet habe.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check"> {   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" } 

**Original-Auszug (Mitte, ~600 chars):**
```
… treiben: Es gibt Menschen, die sich heute als Mann, morgen dann als Frau fühlen. Es gibt Menschen, die sich als Hunde, bekannt als Furry-Fetisch, oder sonstige Tiere definieren.
– Jetzt hören Sie doch mal auf, zu schreien!
Auch das kann sexuelle Komponenten enthalten. Ist dies dann Teil der sexuellen Identität? Was ist mit Erwachsenen, die sich als Kind definieren wollen? Wäre deren Ehepartner dann pädophil?
Und – der Kollege Brandner hat es eben schon angesprochen – was ist mit Nekrophilie, Zoophilie oder Pädophilie?
Nach Ihrer Definition wären auch dies streng genommen Ausprägungen der sexu…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 30. Dr. Götz Frömming (AfD) — ID21310900

- **v1-flagged Wort:** `polemisiert`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Götz Frömming (AfD) polemisiert gegen die Kulturpolitik Claudia Roths als „ideologisch", „antideutsch", „antichristlich" und antisemitisch durchdrungen — insbesondere bei documenta und Berlinale — und interpretiert die Ernennung Wolfram Weimers als willkommene Chance zur Deideologisierung. Er fordert, dass Steuergelder nicht mehr in „linksextreme Propaganda" fließen, sondern ein „unabhängiges Theater" entstehe, und kommentiert Faeser-Spekulationen sarkastisch: mit gutem Wind könne auch eine liberal-grüne Kulturszene „vorankommen".

**v2.1-Summary (neu):**
> Dr. Götz Frömming (AfD) würdigt die Ernennung des konservativen Kulturstaatsministers Weimer als Gegenpol zur früheren Kulturpolitik unter Claudia Roth, rahmt diese als „pure Heuchelei" der Gegner-Kritik ein und bezichtigt Roths Ära der Ideologie: „antideutsch, antichristlich" und de facto israelfeindlich (Bezug: documenta, Berlinale, Entlassung eines Vertrauten mit „szenebekannter israelfeindlicher Haltung"). Seine Hauptforderung ist nicht Abolition von Kultursubventionen, sondern Beendigung ihrer „einseitigen politischen Indienstnahme" — er postuliert: „Wer aber das Eigene nicht liebt, der kann auch das Fremde nicht achten" als Kritik an der angeblichen Deutschfeindlichkeit der Grünen. Schluss mit Segelmetapher an Weimer: „Machen Sie ordentlich Wind! Auf uns können Sie dabei zählen."</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…us ist tiefer in die Kulturszene eingedrungen, als viele es wahrhaben wollen.
Wäre es ein von rechts kommender Antisemitismus, meine Damen und Herren, ich bin mir sicher, man hätte längst Himmel und Hölle dagegen in Bewegung gesetzt.
Wir begrüßen es deshalb, dass der neue Staatsminister sich als erste Amtshandlung vom obersten Beamten und Vertrauten seiner Vorgängerin – ich lasse den Namen jetzt weg – getrennt hat. Dessen israelfeindliche Haltung war „szenebekannt“, wie die „Jüdische Allgemeine“ kürzlich schrieb.
Um noch einen weiteren positiven Punkt zu nennen: Auch die Einigung mit dem Haus …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 31. Aydan Özoğuz (SPD) — ID213110200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Aydan Özoğuz (SPD) bilanziert die Einigung von SPD und CDU/CSU auf eine Sportmilliarde: 1 Milliarde Euro für Sanierung und Ausbau kommunaler Sportstätten für diese Legislaturperiode, unbürokratisch, mit niedrigen Eigenanteilen, gezielt für Breitensport und strukturschwache Regionen, ergänzt durch Länderanteil aus dem Sondervermögen. Sie konfrontiert die AfD direkt mit Heuchelei — zwei Wochen zuvor hätten diese massive Schuldenbedenken vorgebracht, nun forderten sie 40 Mrd für Sport, während sie gleichzeitig beim Ehrenamt und Rentnern kürzen: „Ich finde es unredlich, was Sie machen, und es ist unehrlich." Schluss: Appell an eine Olympia-Bewerbung als „großes Ereignis" für Deutschland.

**v2.1-Summary (neu):**
> Aydan Özoğuz (SPD) verteidigt das Koalitions-Ergebnis der „Sportmilliarde": 1 Milliarde Euro in dieser Legislatur unbürokratisch für kommunale Sportstätten, mit Länderanteil-Option, niedrigen Eigenanteilen für strukturschwache Regionen und vereinfachten Antragsprozessen für Vereine und kleinere Projekte. Sie attackiert direkt die AfD-Fraktion (Jörn König) wegen Glaubwürdigkeits-Bruchs — „unredlich" und „unehrlich" — mit dem Vorwurf, nach Sparsam-Rhetorik bei Haushaltsdebatten jetzt selbst 40 Mrd Euro für Sport zu fordern und gleichzeitig beim Ehrenamt zu kürzen. Sie schließt mit der Vision, Deutschland solle „eigene Olympische und Paralympische Spiele" ausrichten.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "unredlich",     "unehrlich"   ],   "begruendung_falls_unsicher": "Die Wörter 'unredlich' und 'unehrlich' stammen wörtlich vom Sprecher (Özoğuz): 'Ich finde es unredlich, was Sie machen, und es ist unehrlich.' — daher sind sie korrekt in der Summary. Mittel statt hoch, weil die Summary selbst noch zwei polemische Bewertungs-Verben nutzt ('attackiert direkt'), die die Sprecher-Tonalität gut treffen, aber Distanz-Markierung hätten durch 'kritisiert scharf' ersetzt werden können — die aktuelle Formulierung ist aber sachlich korrekt, da Özoğuz tatsächlich direkt und persönlich attackiert." }

**Original-Auszug (Mitte, ~600 chars):**
```
…Fraktion genutzt hat, als hier der Haushalt verhandelt wurde – das ist ja gerade mal zwei Wochen her –, als Sie gesagt haben, nein, man könne all diese Investitionen nicht machen, man würde das Land furchtbar verschulden, kommen Sie um die Ecke und sagen: Aber 40 Milliarden Euro können wir schon noch irgendwie für den Sport einbringen.
Und gestern haben Sie 17-mal gesagt: Alles erhöhen, immer erhöhen!
Aber natürlich kürzen Sie gleichzeitig beim Ehrenamt, bei Rentnern, bei allem. Ich kann das gar nicht alles wiederholen, was Thorsten Rudolph gesagt hat. Ich finde es unredlich, was Sie machen, u…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 32. Peter Bohnhof (AfD) — ID213206900

- **v1-flagged Wort:** `verdammt`
- **v2.1 enthält noch:** `polemisieren`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Peter Bohnhof (AfD) attackiert die Linke-Forderungen nach sozialökologischer Transformation und verdammt diese als Fortsetzung der DDR-Planwirtschaft im Lenin-Geist, die Jobs in Ruhrgebiet-Industrien zerstöre und Energiepreise explodierten lasse. Er fordert Austritt aus dem Pariser Klimaabkommen, CO2-Steuer-Abschaffung, Rückkehr zur Kernenergie, Deregulierung und Technologieoffenheit statt Gewerkschaftsmacht und staatliche Diktate — und delegitimiert die Transformationspolitik von Linken und Grünen als „Irrsinn" gegen die „Kleinen", die am Ende die Zeche zahlen.

**v2.1-Summary (neu):**
> Peter Bohnhof (AfD) nutzt die Anekdote einer Fabrik-Schließung im Ruhrgebiet, um gegen die 'sozialökologische Transformation' und Die Linke zu polemisieren: er charakterisiert Letztere als SED-Nachfolgepartei, die 'linke Planwirtschaft' mit 'Tarifzwang statt Freiheit' und 'sozialistischer Umverteilung' betreiben würde, und kritisiert Grüne Energiepolitik als 'irren staatlichen Eingriff', der energieintensive Branchen nach Asien treibe. Seine sechs Forderungen — Ausstieg aus dem Pariser Klimaabkommen, CO2-Steuer-Abschaffung, Rückkehr zu Kernkraft/Kohle/Gas, Deregulierung, Steuersenkung und Technologieoffenheit — sollen 'Arbeitsplätze, Wettbewerbsfähigkeit und Freiheit' sichern; der Schluss ist ein direkter Wahlaufruf.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…die Höhe getrieben, indem sie auf unzuverlässige Wind- und Solarenergie setzt statt auf bewährte Energiequellen wie Kohle, Gas und Kernkraft.
Energieintensive Branchen wie Stahl und Chemie wandern ab nach Asien, nach Amerika, wo es keine solch irren staatlichen Eingriffe gibt, meine Damen und Herren.
Statt Innovation zu fördern, diktiert der Staat, was gebaut werden darf. Das Ergebnis: immer mehr Arbeitslosigkeit in Regionen, wo Tausende gut bezahlter Jobs an diesen Branchen hängen. Und wer zahlt die Zeche? Der kleine Mann! Und Sie verdrehen das. Das bedeutet höhere Steuern für die Umverteilun…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 33. Stephan Brandner (AfD) — ID213312800

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Stephan Brandner (AfD) wirft der Bundesregierung Heuchelei vor: Sie beteuere, das Bundesverfassungsgericht nicht zu politisieren, praktiziere aber genau das Gegenteil durch das monopolisierte Vorschlagsrecht von SPD, CDU/CSU, Grüne und FDP mit garantierter Richter-Wahl. Seine Forderung lautet, dieses Kartell-System aufzubrechen, um die Depolitisierung des Gerichts nicht nur zu behaupten, sondern umzusetzen.

**v2.1-Summary (neu):**
> Stephan Brandner (AfD) konfrontiert den Vorgänger-Redner direkt mit einer Inkonsistenz: dieser habe behauptet, es komme darauf an, das Bundesverfassungsgericht nicht zu politisieren, praktiziere aber genau das Gegenteil, indem die vier Koalitionsparteien (SPD, CDU/CSU, Grüne, FDP) sich das alleinige Nominierungsrecht für Bundesverfassungsrichter mit garantiertem Wahlrecht sichern. Brandner fordert eine substanzielle Antwort auf die rhetorische Schlussfrage: Wie kann das keine Politisierung sein?</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…ch wollte jetzt von Ihnen keine Elogen auf das Bundesverfassungsgericht hören,
sondern eine Stellungnahme zu dem Verfahren. Sie haben gerade selber gesagt, Ihnen liegt daran, das Bundesverfassungsgericht nicht zu politisieren. Aber Sie machen doch genau das Gegenteil, wenn die Parteien SPD, CDU/CSU, Grüne und FDP das alleinige Vorschlagsrecht für Richter am Bundesverfassungsgericht haben, verbunden mit der Garantie, dass dann der Richter immer auch gewählt wird. Also warum hat das nichts mit einer Politisierung des Bundesverfassungsgerichts zu tun, wenn Sie genau das machen, was ich kritisiere…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 34. Kurt Kleinschmidt (AfD) — ID213315900

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Kurt Kleinschmidt (AfD, Einsatzveteran) lehnt die Verlängerung des Irini-Einsatzes ab und bezeichnet ihn als „Gammeldienst" — die Operation könne das UN-Waffenembargo gegen Libyen mangels Kontrolldurchsetzungskompetenz nicht effektiv umsetzen, wie sein Hausdetektiv-Vergleich zeigt. Die AfD fordert stattdessen den Einsatz-Stopp, Rückholung der Soldaten und Konzentration auf Landesverteidigung; im Schlussteil attackiert Kleinschmidt den Grünen-Politiker von Notz mit einem Boulevard-Zitat über einen Extremismus-Verdacht gegen einen Grünen-Kandidaten in Kiel und wirft der Gegenseite Heuchelei vor.

**v2.1-Summary (neu):**
> Kurt Kleinschmidt (AfD) lehnt die Verlängerung der Operation Irini ab und vergleicht den Einsatz mit dem historischen ‚Gammeldienst': mangelnde Kontrollkompetenz führe zu Frust in der Truppe, ähnlich wie das Afghanistan-Desaster zwei Jahrzehnte vorher. Er fordert den Abzug der Bundeswehr und Neuausrichtung auf Landesverteidigung — mit abschließender Attacke auf die Grünen: Er zitiert aus einem Boulevardblatt Vorwürfe gegen einen grünen Kandidaten in Kiel (‚Extremismus-Verdacht') und adressiert damit indirekt von Notz mit der Aufforderung, ‚vor der eigenen Tür zu kehren'.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…ten und immer wieder verlängern, könnte sinnloser nicht sein.
Zur Durchsetzung des Waffenembargos der Vereinten Nationen gegen Libyen haben unsere Soldaten keine ausreichende Kompetenz; und das wissen Sie genau. Schiffe, deren Kapitäne die Kontrollen nicht anerkennen, können nicht überprüft werden. Das ist, als ob Sie einem Hausdetektiv, der einen Dieb erwischt,
versagen, den Dieb zu durchsuchen, weil der Dieb es ablehnt.
Es gibt keine Handhabe, den Streitkräften fehlt sozusagen der Durchsuchungsbefehl. So entsteht Frust innerhalb der Truppe, wie übrigens bei vielen Einsätzen in den vergangene…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 35. Agnes Conrad (Die Linke) — ID213411800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Agnes Conrad (Die Linke) lehnt den AfD-Antrag zur Aufhebung des Verbrenner-Verbots als Populismus ab, der Deindustrialisierung selbst befördert: Sie konterkariert das AfD-Narrativ mit sarkastischen Bildern („Wenn Populismus ein Kraftstoff wäre, wäre die AfD klimaneutral"), würdigt die tatsächliche Transformationsleistung in Betrieben und Zulieferbetrieben und entlarvt die AfD-Heuchelei — die für Arbeitsplätze spricht, aber gegen Tarifbindung und Mitbestimmung abstimmt. Im Gegensatz zum AfD-Populismus fordert Conrad Planungssicherheit, öffentliche Investitionen, einen 20-Milliarden-Euro-Transformationsfonds, Weiterbildung statt Entlassungen und eine gerechte, mit den Beschäftigten geplante Transformation.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Agnes Conrad (Linke) lehnt den AfD-Antrag zur Aufhebung des Verbrennermotorverbots ab und attackiert ihn als „Tragikomödie" und „beste Vorlage für Deindustrialisierung". Sie betont, dass Betriebe in der Zulieferindustrie seit Jahren an der Transformation arbeiten (Umstellung, Weiterbildung, Mitbestimmung), und kritisiert die AfD-Heuchelei: Sie verteidigte den Verbrenner, stimme aber gegen faire Löhne und Tarifbindung — „Logik à la AfD". Ihre Gegenforderung lautet: statt Verbrenner-Rückkehr brauche die Automobilindustrie öffentliche Investitionen, Planungssicherheit, Weiterbildung statt Entlassungen und einen jährlichen staatlichen Transformationsfonds von 20 Milliarden Euro, um den Wandel gerecht und sicher zu gestalten.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…hen in den Betrieben, meine Kolleginnen und Kollegen in der Zulieferindustrie,
die seit Jahren alles daransetzen, ihre Werke umzustellen, neue Produktionslinien aufzubauen, Beschäftigte weiterzubilden,
die mit viel Engagement und Beteiligung der Betriebsräte die Transformation selbst in die Hand genommen haben.
Und dann kommen Sie mit einem solchen Antrag und tun so, als wäre all diese Arbeit sinnlos gewesen, als hätte es keinen Mut, keine Investitionen, keine Zukunftspläne gegeben. Sie sagen, Sie kämpfen für Arbeitsplätze. Aber wenn es um faire Löhne, um Tarifbindung oder Mitbestimmung geht, …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 36. Sebastian Steineke (CDU/CSU) — ID213506200

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Sebastian Steineke (CDU/CSU) wirbt für die Umsetzung der EU-EmpCo-Richtlinie ins deutsche UWG und verdammt Greenwashing als Wettbewerbsverzerrung: Künftig werden Umweltangaben („klimaneutral", „CO2-kompensiert", „umweltfreundlich") verboten ohne belastbare Nachweise, und die Finanzdienstleistungs-Bereiche unterliegen neuen Transparenzregeln. Sein Frame ist eine „Win-win-Situation" — Rechtssicherheit für ehrliche Unternehmen, Verbraucherschutz vor falschen Versprechungen, fairer Wettbewerb statt grüner Täuschung.

**v2.1-Summary (neu):**
> Sebastian Steineke (CDU/CSU) bewirbt die Umsetzung der EU-EmpCo-Richtlinie ins deutsche Wettbewerbsgesetz (UWG) als wichtigen Transparenz- und Verbraucherschutzschritt: Die Regelung verbietet künftig Werbung mit unbelegten Umweltangaben ('klimaneutral', 'CO2-kompensiert', 'umweltfreundlich') und verhindert damit Greenwashing. Sein Frame fasst dies als Win-win-Situation: ehrliche Unternehmen gewinnen Rechtssicherheit, Verbraucher Schutz vor Täuschung, und fairer Wettbewerb wird gestärkt. Details zu digitaler Transparenz und Finanzdienstleistungen sollen in der Sachverständigenanhörung am 10. November geklärt werden.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…Richtlinie will die Kommission genau das sicherstellen, nämlich dass Verbraucherinnen und Verbraucher diese verlässlichen Informationen auch sicher erhalten, besonders im Onlinehandel.
Wir setzen diese Vorgaben nun mit der Änderung des UWG um. Künftig wird es ausdrücklich verboten sein, mit Umweltangaben zu werben, die nicht durch belastbare, überprüfbare Nachweise gestützt sind. Das betrifft bekannte Begriffe wie „klimaneutral“, „CO2-kompensiert“ oder „umweltfreundlich“. Das ist überfällig; denn zu lange konnte man mit schwammigen Nachhaltigkeitsversprechen das gute Gewissen der Verbraucherin…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 37. Caren Lay (Die Linke) — ID213906300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Caren Lay (Linke) konfrontiert Wohnungsministerin Hubertz mit Widerspruch: die SPD-Ministerin habe pressewirksam Mietwucher-Bekämpfung angekündigt, stimme aber bei entsprechenden Abstimmungen gegen ihre eigenen Ankündigungen ab. Lay wirft der Regierung Heuchelei vor und beendet mit einer rhetorischen Frage zur Aufrichtigkeit des Handelns.

**v2.1-Summary (neu):**
> Caren Lay (Linke) konfrontiert Bundesministerin Hubertz (SPD/Grüne) direkt mit einer Doppelmoral-Vorwurf: Die Ministerin habe kurz zuvor in der Presse mit „großem Pressewirksamkeitsaufwand" Maßnahmen zur Mietwucher-Bekämpfung angekündigt, die Lay selbst seit Jahren unterstützt — doch bei der unmittelbar vorangegangenen Abstimmung zu einer solchen Vorlage habe Hubertz und die gesamte SPD/Grüne-Fraktion dagegen gestimmt. Sie fragt pointiert: „Wenn Sie in der Presse etwas fordern, aber in der Praxis das Gegenteil tun, finden Sie das aufrichtig?"</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
Herzlichen Dank. – Meine Frage richtet sich an Frau Ministerin Hubertz. Sie haben ja vorgestern im Interview diverse Maßnahmen, die ich begrüße, sehr pressewirksam angekündigt, darunter auch die Bekämpfung von Mietwucher. Wir als Linke und auch ich persönlich kämpfen seit vielen, vielen Jahren dafür. Nun hatten wir aber vor wenigen Tagen eine Abstimmung dazu, wo Ihre gesamte Fraktion, auch Sie persönlich, dagegengestimmt hat. Da muss ich Sie einfach fragen: Wenn Sie in der Presse etwas fordern, aber in der Praxis das Gegenteil tun, finden Sie das aufrichtig? Passt das für Sie zusammen?
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 38. Carolin Bachmann (AfD) — ID213911400

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Carolin Bachmann (AfD) attackiert Ministerin Hubertz mit Sarkasmus auf deren Behauptung von Bürger-Wahlfreiheit bei der Heizungswahl: Während eine Gasheizung 6.000-8.000 Euro kostet, erfordert eine Wärmepumpe in Altbauten eine 120.000-Euro-Kompletten-Sanierung — dies sei bei gleichzeitig politisch erhöhtem CO2-Preis keine echte Wahl, sondern Heuchelei und indirekte Zwangsmaßnahme. Ihre Schlussfrage «Was sollen die Bürger jetzt machen?» ist der Kern der AfD-Heizungsgesetz-Kritik: Mittelschicht in die finanzielle Unmöglichkeit treiben.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Carolin Bachmann (AfD) interveniert zu den Heizungskosten und attackiert das regierungspolitische Heizungs-/Energie-Konzept: Der CO2-Preis-Anstieg sei „politisch induziert", die Forderung nach Wärmepumpen verschärfe das Problem durch enorme Kosten (120.000 Euro inklusive Sanierung vs. 6.000-8.000 Euro für Gasheizung). Sie konfrontiert die Ministerin mit einem sozialen Widerspruch: Wahlfreiheit bei technischem Unvermögen, und endet mit der anklagenden Frage „Was sollen die Bürger jetzt machen?"</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…d frei davon berichtet, dass der CO2-Preis steigen wird. Das ist politisch induziert. Und Sie sagen, jeder Bürger könne frei entscheiden, welche Heizung er einbaut. Er kann eine Gasheizung einbauen; aber Sie fänden es toll, wenn er was anderes einbaut, eine Wärmepumpe zum Beispiel.
Wissen Sie, eine Gasheizung können Sie vielleicht für 6 000 bis 8 000 Euro kaufen; aber eine Wärmepumpe kriegen Sie, wenn Sie ein altes Haus haben, nicht für 6 000, 8 000 oder 10 000 Euro.
Kommen Sie bitte zu Ihrer Frage.
Dann müssen Sie 120 000 Euro in die Hand nehmen, um das Haus energetisch fitzumachen.
Frau Koll…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 39. Johannes Volkmann (CDU/CSU) — ID213914400

- **v1-flagged Wort:** `Skandalisierungsversuch`
- **v2.1 enthält noch:** `Skandalisierungs`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Johannes Volkmann (CDU/CSU) kontert einen AfD-Skandalisierungsversuch gegen den Kulturstaatsminister mit strukturierter Gegendarstellung: öffentliche Reden-Dokumentation sei demokratische Standardpraxis (wie in »Das Parlament«), der Minister trage keine redaktionelle Verantwortung, und die AfD selbst habe »The European« acht Jahre lang aktiv in sozialen Medien geteilt, ohne zu murren — das selektive Timing und die Diffamierungslogik («Sie diffamieren, um zu isolieren») offenbarten ein autoritäres Muster statt sachlicher Politikgestaltung. Seine zentrale Forderung: Statt Kulturminister zu beschimpfen, sachlich über Digitalsteuer, KI und Plattformregulierung debattieren.

**v2.1-Summary (neu):**
> Johannes Volkmann (CDU/CSU) widerlegt den AfD-Skandalisierungs-Antrag gegen Kulturstaatsminister Weimer mit drei Argumenten: (1) Dokumentation von Reden ist legale demokratische Praxis, (2) Weimer war redaktionell nicht verantwortlich, (3) — entscheidend — die AfD hat 8 Jahre lang bereitwillig 'The European'-Beiträge mit Reden von Alice Weidel in sozialen Medien geteilt, ohne Einwände, und nur jetzt, politisch günstig, die Empörung inszeniert. Volkmann analysiert das Timing als strategisch: Es lenke Aufmerksamkeit von sachlichen Politikfeldern (Digitalsteuer, KI, Plattformregulierung) ab und diene allein der Diffamierung statt zum Sachbeitrag im Kultur- und Medienbereich.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…aus „The European“ bereitwillig von Ihren Kreisverbänden und von Funktionsträger-Accounts Ihrer Landtags- und Bundestagsabgeordneten in den sozialen Netzwerken geteilt wurden.
Das heißt, acht Jahre lang hätten Sie Zeit gehabt, sich darüber zu beschweren.
Und das Timing – Frau Dr. Lührmann hat bereits erwähnt, dass das erstaunlich ist – verrät mehr über Sie als über den Vorgang, den Sie heute versuchen zu skandalisieren.
Denn Sie schreien plötzlich: Textdiebstahl und Skandal. – Ich habe mich gefragt: Woher kommt diese Vehemenz? Selbst bei der Vorgängerregierung, bei der Ampel, haben Sie keine n…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 40. Maja Wallstein (SPD) — ID213915100

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Maja Wallstein (SPD) konfrontiert einen AfD-Redner direkt mit einer Frage zur Doppelmoral: Während die AfD andere Parteien auf Twitter-Posts kritisiere, werde die Partei selbst bei widerwärtigen Nachrichten ihrer eigenen Funktionäre untätig. Sie belegt dies mit einem konkreten Fall — ein AfD-Stadtverordneter aus Cottbus habe einer Schülerin einen Vergewaltigungswunsch geschrieben — und fordert eine konsistente Kritik-Standards unabhängig von Partei-Zugehörigkeit ein.

**v2.1-Summary (neu):**
> Maja Wallstein (SPD) wendet sich direkter Konfrontation an den vorherigen AfD-Redner: Sie stellt die Selektivität seiner Kritik an Posts auf Social Media in Frage und entgegnet mit einem dokumentierten extremen Fall — ein AfD-Stadtverordneter aus Cottbus habe einer Schülerin einen Vergewaltigungswunsch geschrieben ('ordentlich durchgenommen', damit sie 'wieder klar im Hirn werde'). Sie fordert den AfD-Redner auf, solche und weitere widerwärtige Posts eigener Parteimitglieder mit gleicher Schärfe zu kritisieren, und identifiziert damit eine Doppelmoral in der AfD-Debattenkultur.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": ["widerwärtige"],   "begruendung_falls_unsicher": "Das Adjektiv 'widerwärtige' für Posts stammt wörtlich aus Wallsteins Rede und ist ihre Charakterisierung, nicht eine editoriale Einfügung — aber die Kontaminationsgrenze ist fließend (sie nutzt es als Kritik-Marker). Die Summary bleibt akkurat, da Wallstein selbst 'widerwärtig' nutzt." }

**Original-Auszug (Mitte, ~600 chars):**
```
… Frage an den Redner der AfD, der hier gerade Posts auf Twitter oder anderen Plattformen kritisiert hat.
Ich frage mich, ob Sie, Herr Kollege, in der gleichen Form auch widerwärtige Posts oder Nachrichten Ihrer AfD-Mitglieder und -Funktionäre kritisieren.
Zum Beispiel hat ein AfD-Stadtverordneter aus Cottbus einer Schülerin geschrieben, dass er hoffe, dass sie mal von einem Schwarzen ordentlich durchgenommen werde, ohne dass sie das wolle, weil sie dann hoffentlich wieder klar im Hirn werde. Das ist ein Vergewaltigungswunsch eines AfD-Stadtverordneten. Kritisieren Sie solche und andere Posts v…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 41. Ates Gürpinar (Die Linke) — ID213915700

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Ates Gürpinar (Linke) verdammt die Krankenhausreform als Klinikschließungsprogramm: Lauterbach habe 2019 angekündigt, dass die Hälfte bis zwei Drittel der Kliniken „verzichtbar" seien, und die Ampel habe das Gesetz zur Umsetzung genutzt; die Union tue im Wesentlichen das Gleiche und sei vom Oppositions-„Löwe" zum „Bettvorleger" geworden. Das Kernproblem sei die Finanzierungslogik: Fallpauschalen schafften Sparanreize bei Personal, Private Konzerne wie die Schön-Kliniken generierten Gewinne mit Gesundheit und spendeten zeitgesteuert an die Union — eine „Zweckentfremdung von Versichertengeldern". Die Linke fordert Herausnahme aller Personalkosten aus Fallpauschalen, volle Refinanzierung durch Krankenkassen, wissenschaftliche Personalbemessung und Verbot solcher Konzern-Spenden: „Krankenhäuser sind keine Unternehmen — die Profitlogik muss raus aus der Gesundheit."

**v2.1-Summary (neu):**
> Ates Gürpinar (Die Linke) kritisiert die Lauterbach-Krankenhausreform als faktisches Klinikschließungsprogramm, das Lauterbach selbst 2019 ankündigte ('die Hälfte bis zwei Drittel verzichtbar'), und wirft der Union vor, diese Logik nach einem halben Regierungsbeteiligung fortzusetzen ('von Bettvorleger'). Das zentrale Problem sei nicht die Reform selbst, sondern die Finanzierungsstruktur: Fallpauschalen und 'Pseudovorhaltevergütung' schaffen Anreize, Personal zu sparen und damit 'Gewinne mit der Gesundheit' zu generieren — besonders wirft er dem privaten Konzern Schön-Kliniken vor, die Herzchirurgie und die deutschlandweit einzigartige JERWA-Abteilung zu schließen, während er jährlich Spenden an die Union tätigt, 'ausgerechnet rund um das Krankenhausgesetz ein wenig höher'. Er fordert im Linke-Antrag: vollständige Refinanzierung aller Personalkosten durch Krankenkassen, wissenschaftliche Personalbemessungs-Instrumente, und ein Verbot solcher Spenden.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "faktisches Klinikschließungsprogramm — ist das eine Interpretation oder wörtlicher Speaker-Frame? Speaker sagt wörtlich 'was [...] als Krankenhausreform verkauften, war in Wirklichkeit ein Klinikschließungsprogramm' — diese Charakterisierung ist vom Speaker, also OK",     "Unsicherheit: 'besonders wirft er vor' — das ist deskriptiv, nicht wertend, also OK",     "Unsicherheit: 'Spenden-Affäre' in rhetorische_mittel nicht eingefügt (gut), aber worauf beziehe ich mich? Der Speaker sagt: 'Der Konzern spendet jedes Jahr [...] Ausgerechnet rund um das Krankenhausgesetz war der Betrag dann doch ein wenig höher. Ich finde, das sollte verboten werden.' — Das ist Anklage, nicht meine Bewertung. Summary ist neutral."   ],   "begruendung_falls_unsicher": "Die Charakterisierungen ('Klinikschließungsprogramm', 'Profitlogik generiert Gewinne mit der Gesundheit', 'Spenden-Korrelation') sind alle direkte Sprecher-Frames; kein LLM-Zusatz. Konfidenz: mittel nur weil die Spenden-Andeutung ('ein wenig höher') interpretativ ist und ich nicht sicher, ob 'Affäre' das wiedergibt." }

**Original-Auszug (Mitte, ~600 chars):**
```
…onzerne Gewinne mit der Gesundheit.
Aber dieser Profit ist letztlich das, was jährlich Hunderte Millionen Euro Versichertenbeiträge kostet.
Eine besonders dreiste Zweckentfremdung von Versichertengeldern will ich am Beispiel meines Wahlkreises mal kurz erläutern: die Schön-Kliniken. Über den privaten Klinikkonzern ärgere ich mich gerade besonders, weil er jetzt unter anderem die Herzchirurgie schließen will und die sogenannte JERWA, eine deutschlandweit einzigartige Abteilung für junge Erwachsene mit Behinderung. Aber der Konzern spendet jedes Jahr Geld an die Union. Ausgerechnet rund um das K…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 42. Helge Lindh (SPD) — ID213916500

- **v1-flagged Wort:** `denunziere`
- **v2.1 enthält noch:** `denunzieren`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Helge Lindh (SPD) antwortet konfrontativ auf eine AfD-Rede gegen CSDs und wirft der Fraktion Propaganda und Queerfeindlichkeit vor: Eine AfD-Landtagsabgeordnete habe CSDs als 'abartige Perversion' charakterisiert, während die Partei systematisch CSDs denunziere und damit selbst die Hypersexualisierung betreibe. Lindh fordert ein verpflichtendes Schulungsseminar der AfD-Fraktion in Sexismus und Queerfeindlichkeit und macht deutlich, dass die AfD selbst durch ihre Propaganda für die Bedrohung von 2/3 der CSDs in Ostdeutschland und 1/3 im Westen verantwortlich ist — ein Ausdruck von Leben im Grundgesetz zu schützen, nicht von Ideologie.

**v2.1-Summary (neu):**
> Helge Lindh (SPD) konfrontiert die AfD-Fraktion scharf mit ihrer Queerfeindlichkeit im CSD-Debatten-Kontext: Er zitiert eine niedersächsische AfD-Abgeordnete, die den CSD als 'abartige Perversion' charakterisiert, und wirft der AfD vor, alle CSDs systematisch als 'hypersexualisiert' zu denunzieren — während sie selbst die 'Hypersexualisierung betreiben'. Via rhetorische Gegenfrage (Gisèlle Pelicot, heteronormative Gewalt) deckt er die Selektivität auf. Mit Statistiken (zwei Drittel CSDs im Osten, ein Drittel im Westen unter rechtsextremer Bedrohung) belegt er, dass nicht Migrantinnen oder Flüchtlinge, sondern 'Ihre Propaganda, Ihr Hass' für die Bedrohungslage sorgen; er fordert ein Schulungsprogramm der AfD-Fraktion gegen Sexismus und Queerfeindlichkeit.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…icht hinweisen!
Sie treten hier CSD-denunzierend, belehrend auf. Wenn ich an Ihre Zwischenrufe denke, an Ihren Habitus, an das, was Kolleginnen und Kollegen berichten, an das, was Menschen mit ihrer eigenen geschlechtlichen Identität und sexuellen Orientierung hier auf den Fluren erleben, an das Auftreten Ihrerseits, dann sage ich nur:
Es tut dringend not, dass die AfD-Fraktion ein Schulungsseminar in Sexismus, Antifeminismus und gegen Queerfeindlichkeit besucht.
Die Amadeu Antonio Stiftung und andere werden Kapazitäten schaffen und mit ihrem Know-how dafür sorgen, dass Sie diese Schulung als …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 43. Janine Wissler (Die Linke) — ID214002000

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Janine Wissler (Die Linke) bekämpft den AfD-Gesetzentwurf zur Streichung des Klimaneutralitätsziels aus dem Grundgesetz durch systematische Mythos-Dekonstruktion: Sie kontert mit konkreten Zahlen (900 Mrd Euro Klimaschäden bis 2050, 1 Mrd Euro AKW-Rückbau pro Block) und zeigt auf, dass Erneuerbare die billigste Energieform sind, während die AfD Naturschutz-Heuchelei betreibe (selektive Kritik an Windrädern, während Kohleabbau geduldet wird). Sie kritisiert scharf die Bundesregierung und Wirtschaftsministerin Reiche für den Ausbau von Gaskraftwerken statt echter Energiewende und fordert Demokratisierung der Energiewirtschaft durch Überführung in öffentliche Hand.

**v2.1-Summary (neu):**
> Janine Wissler (Die Linke) lehnt den AfD-Gesetzentwurf zur Streichung des Klimaneutralitätsziels aus dem Grundgesetz vehement ab und demontiert vier Kernmythen der Gegner der Energiewende: (1) Klimaschutz sei teuer — falsch, kein Klimaschutz kostet bis 2050 allein in Deutschland 900 Mrd Euro, (2) Windräder bedrohten Natur — heuchlerisch angesichts von Kohleabbau/Autobahnen/Flughäfen, denen Naturschutz sonst egal ist; 0,5–1 Hektar pro Windrad vs. 4.800 Hektar Garzweiler II, (3) Erneuerbare seien unzuverlässig — es gibt europäische Ausgleichsnetze und Speichertechnologien, AKWs sind störanfällig, (4) Windräder seien gesundheitsschädlich — Infraschall im Auto bei 130 km/h ist höher. Sie kritisiert die Bundesregierung (Wirtschaftsministerin Reiche plant Gaskraftwerke statt Wärmepumpen) und fordert langfristig: Energie in öffentliche Hand, Demokratisierung der Energiewirtschaft.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…on Windrädern geht, dann werden Lobbyisten plötzlich zu Tierschützern, entdecken seltene Käferarten und den Rotmilan für sich und werden zu begeisterten Ornithologen.
Die meisten Vögel sterben in diesem Land übrigens durch Glasscheiben, Verkehr und Katzen und nicht durch Windräder.
Bei Windrädern ist auch der Wald auf einmal heilig; sonst darf er fröhlich abgeholzt werden. Gerade wurde in meiner Geburtsstadt Langen ein Protestcamp geräumt – Grüße an die Aktiven! Für den Kiesabbau soll wertvoller Bannwald gerodet werden. Da hört man nichts von der AfD. Aber wenn ein Windrad aufgestellt wird, da…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 44. Mirze Edis (Die Linke) — ID214008200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Mirze Edis (Die Linke) greift die AfD-Wirtschaftspolitik mit scharfsinniger Sarkasmus an: Die Partei fordere morgens Hightech-Agenda, nachmittags deren Gegenteil — eine Heuchelei, die auf Kohle-, Atom- und Gas-Nostalgie plus bloßer Profit-Logik für Reiche hinauslaufe statt echte Arbeitnehmerpolitik. Sie zerpflückt konkret die AfD-Forderung zur Abschaffung des Lieferkettensgesetzes (was Kinderarbeit billiger macht) und kritisiert das völlige Fehlen von Tarifbindung, Mitbestimmung, Arbeitsplatzgarantien und Innovation im AfD-Antrag — stattdessen fordert sie Planungssicherheit, Hochtech-Transformation und Energiewende als echte Standortpolitik für Deutschland. Schluss: Aufruf an Arbeiter, sich nicht von „Populisten und Hetzern" täuschen zu lassen.

**v2.1-Summary (neu):**
> Mirze Edis (Die Linke) wendet sich polemisch gegen den AfD-Antrag zur Industrie-Abwanderung und wirft der AfD Widerspruch vor: morgens habe die AfD Hightech gefordert, nachmittags das Gegenteil. Die AfD-Wirtschaftspolitik beschreibt er als „Wirtschaftspessimismus, Nostalgie und wirre Fantasie" — „Industriepolitik aus dem Kohlenkeller" mit Rückkehr zu Kohle, Atomkraft und Gasabhängigkeit statt grüner Transformation; das Lieferkettengesetz-Verbot ziele nur auf Profit und Kinderarbeit ab. Kritisch nennt er die fehlenden AfD-Positionen zu Tarifbindung, Gewerkschaften, Mitbestimmung und Innovation. Er schließt mit dem Aufruf an Industriearbeiter, den „Populisten und Hetzern" nicht zu glauben, und fordert stattdessen Technologie und Innovation für die deutsche Zukunft. Die Rede wird zweimalig vom Präsidium unterbrochen (Zeitüberschreitung).</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "herzlos",     "Populisten und Hetzer"   ],   "begruendung_falls_unsicher": "Die Wörter 'herzlos', 'Populisten und Hetzer' stammen wörtlich vom Sprecher (Distanz-Markierung erforderlich), aber ihre Aufnahme in die Summary macht diese selbst wertend — Neutral-Reformulierung würde 'kritisiert als herzlos' / 'nennt AfD Populisten und Hetzer' erfordern, was die Polemik reduziert und H2 verletzt." }

**Original-Auszug (Mitte, ~600 chars):**
```
…en Gashahn aufdrehen bis zum Gehtnichtmehr. Fehlt eigentlich nur noch die Forderung, die Schreibmaschine als Mittelstandsinvestition zu fordern!
Sie wollen die grüne Transformation stoppen. Wissen Sie, das ist ungefähr so, als würde man im Jahr 2025 fordern, das Farbfernsehen wieder abzuschaffen, weil man die Wahrheit lieber braun sehen möchte.
Aber, meine Damen und Herren, das ist keine Standortpolitik, das ist energiepolitische Zeitreise mit Nordkorea-Romantik.
Dann schlagen Sie vor, das Lieferkettengesetz abzuschaffen, weil es angeblich die Wettbewerbsfähigkeit gefährdet. Ja, natürlich, Kin…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 45. Christian Görke (Die Linke) — ID21400900

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Christian Görke (Die Linke) nutzt eine Zwischenfrage zur Steuerbetrugs-Aufklärung (28 Mrd Euro Schaden), um der Rednerin einen Doppelmoral-Vorwurf zu unterbreiten: ihre eigene Fraktion habe in der letzten Legislaturperiode das „Schreddergesetz" ermöglicht, das ab 01.01.2026 Dokumentenvernichtung zulässt — und jetzt klage dieselbe Fraktion über „enge Fristen" bei der Aufklärung. Die Pointe zielt auf die SPD als ehemaligen Koalitionspartner, dessen Finanzminister (impliziert: Lindner-Nachfolger) nun kritisiert würde.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Christian Górke (Die Linke) interveniert in einer Zwischenfrage und greift die Kritik an zu engen Fristen bei der Steuerbetrug-Aufklärung (28 Milliarden Euro Schaden) auf: Er weist nach, dass die kritisierende Fraktion selbst in der letzten Legislaturperiode das sogenannte Schreddergesetz verabschiedete, das ab 01.01.2026 die Dokumentvernichtung erlaubt — und fragt ironisch, ob es angezeigt sei, sich dann über den ehemaligen Koalitionspartner (jetziger SPD-Finanzminister) kritisch auszulassen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…Sie die Zwischenfrage zulassen. – Sie wissen, dass wir als Linke diesen Steuerbetrug in einer Größenordnung von 28 Milliarden Euro Steuerschaden lückenlos aufklären wollen. Mich hat eben nur verwundert, dass Sie jetzt diese engen Fristen beklagen. Gerade Sie – Ihre Fraktion – hat doch erst in der letzten Legislaturperiode das sogenannte Schreddergesetz ermöglicht, sodass jetzt die Dokumente ab dem 01.01.2026 geschreddert werden können. Deshalb meine Frage, ob Sie sich daran erinnern,
und vor allen Dingen, ob es angezeigt ist, sich über Ihren ehemaligen Koalitionspartner, den jetzigen Finanzmin…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 46. Annika Klose (SPD) — ID214103400

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Annika Klose (SPD) nutzt eine Zwischenfrage zur Debatte über die Linke-geforderte Erwerbstätigenversicherung, um die SPD-Position zu unterstützen: Abgeordnete und Selbstständige sollten in die gesetzliche Rentenversicherung einzahlen, was bereits freiwillig möglich ist. Sie konfrontiert dann den AfD-Redner Brandner direkt mit der Frage, ob er selbst diese Möglichkeit nutzt und ob er es seiner Fraktion empfohlen hat — eine Nachhakung mit impliziter Heuchelei-Unterstellung.

**v2.1-Summary (neu):**
> Annika Klose (SPD) nutzt eine Zwischenfrage zur direkten Konfrontation mit Brandner (AfD-Redner davor): Sie signalisiert SPD-Unterstützung für die Erwerbstätigenversicherung und die Forderung, dass „grundsätzlich alle in die gesetzliche Rente einzahlen sollten", fragt dann aber pointiert nach, ob Brandner selbst freiwillig einzahlt und dies seiner Fraktion empfohlen hat — ein klassischer Vorbild-Appell, der die Lücke zwischen gefordert und gelebt herausstellt.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…– Herr Brandner, ich höre Ihnen hier ja aufmerksam zu und möchte vorwegschicken, dass wir als SPD die Erwerbstätigenversicherung natürlich sehr unterstützen. Dass auch Abgeordnete und Selbstständige, dass grundsätzlich alle in die gesetzliche Rente einzahlen sollten, finden wir richtig. Nun ist das aktuell nicht verpflichtend, aber es ist durchaus freiwillig möglich. Als Abgeordneter hätten Sie das Recht und die Möglichkeit, in die Deutsche Rentenversicherung einzuzahlen. Da möchte ich Sie einmal persönlich fragen, ob Sie da als gutes Vorbild vorangehen und selber in die gesetzliche Rentenvers…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 47. Robin Jünger (AfD) — ID214105100

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Robin Jünger (AfD) lehnt den Grünen-Antrag zur digitalen Souveränität ab und greift dabei die Grünen massiv an: Sie würden moralisierend statt sachlich argumentieren, hätten selbst durch Deindustrialiserung (Energiewende) die Voraussetzungen für KI/Forschung zerstört, und legten nun mit noch mehr europäischer KI-Regulierung und „NGO-Sumpf"-Einbindung nach. Kern-Vorwurf ist Heuchelei: Die Grünen hätten 2019–2021 AfD-Bedenken zu Huawei/5G diskreditiert und beschwerten sich nun über dieselbe Abhängigkeit; der Schluss ist eine Wahlabstrafungs-Botschaft („deshalb sind Sie abgewählt worden").

**v2.1-Summary (neu):**
> Robin Jünger (AfD) lehnt den Grünen-Antrag zur digitalen Souveränität ab und attackiert die Grünen als heuchlerisch: Sie hätten 2021/2022 AfD-Bedenken zu Huawei-5G-Abhängigkeit abgelehnt und beklagten sich jetzt selbst über dieselbe China-Abhängigkeit. Jünger kritisiert KI-Entwicklungs-Forderungen als teuer und ineffizient wegen Grüner-Deindustrialisierung, wirft den Grünen Moral-statt-Recht-Politik vor, attackiert ihre Definition von 'Zivilgesellschaft' als NGO/Gleichstellungsbündnisse statt Wirtschaft/Handwerk/Landwirtschaft, und nennt staatlich finanzierte Gruppen „Terroristen" — Schlussbotschaft: Grüne seien wegen ihres „ideologischen Irrwegs" abgewählt worden.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "heuchlerisch",     "attackiert"   ],   "begruendung_falls_unsicher": "Die Rede ist durchgängig polemisch — aber Begriffe wie 'heuchlerisch' / 'attackiert' sind meine Synthese-Verben, nicht direkte Sprecher-Wörter; Jünger sagt 'Sie beschweren sich über Problem, an dem Sie mit schuld sind' und 'Arroganz' + 'Deindustrialisierungsminister' — eine neutral-deskriptive Summary müsste präziser sein: 'wirft den Grünen vor, heuchlerisch zu sein' ist bereits Vorwurf-Metasprache. Ich habe versucht, die Polemik zu bewahren (Tonalität korrekt als 'polemisch'), aber in der Zwei-Satz-Synthese sind 'heuchlerisch' und 'attackiert' meine Interpretations-Layer, nicht direkte Sprecher-Lexeme. Bei hoch würde ich nicht ehrlich sein — die Rede IST polemisch vom Sprecher, aber meine Summary-Verben sind Verdichtung." }

**Original-Auszug (Mitte, ~600 chars):**
```
…r es war doch Ihr Deindustrialisierungsminister, der Deutschlands Energieversorgung mit Vorsatz an die Wand gefahren hat!
Alles, was Sie hier fordern, ist teuer und ineffizient, weil Ihre Fraktion gemeinsam mit den roten Genossen unser schönes Deutschland nicht energetisch saniert, sondern exekutiert hat.
Und anstatt von Ihrem ideologisch angetriebenen Irrweg jetzt mal abzukommen,
fordern Sie in Ihrem Antrag die Umsetzung der europäischen KI-Verordnung, noch mehr Regulierung, noch mehr Gängel- und Meldestellen, noch mehr Täterschutz und noch mehr teure Aufsichtsstellen.
Allen voran soll dann i…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 48. Dr. Michael Espendiller (AfD) — ID214200100

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Michael Espendiller (AfD) verdammt den Bundeshaushalt 2026 als verfassungswidrig, da Friedrich Merz die Schuldenbremse faktisch abschafft — die Regierung macht 181,5 Milliarden Euro neue Schulden (fast jeder dritte Euro der Ausgaben), während die Zinszahlungen bis 2029 auf 66,5 Milliarden Euro jährlich galoppieren. Im Gegenprogramm präsentiert Espendiller einen AfD-Haushalt mit nur 505,8 Milliarden (125 Milliarden Einsparungen), der die Schuldenbremse einhält, 55 Milliarden Steuern senkt, die EU-Zahlungen (47,7 Mrd) und Ukraine-Hilfen (11,5 Mrd) drastisch kürzt, und die 654 Millionen für parteinahe Stiftungen sowie Bürokratie-Bloat streicht — sein Frame ist Klassenkampf (Fleißige vs. NGO-Profiteure und Lebenskünstler), kombiniert mit Schuldenbremsen-Konstitutionalismus.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…ben übrigens durch eine leicht verbesserte Steuerprognose, die immerhin 10 Milliarden Euro Mehreinnahmen im kommenden Jahr verspricht. Wer jetzt auf den Gedanken kommt: „Hey, die Regierung könnte damit ja endlich mal die Steuern senken“, der denkt zwar richtig, der denkt aber nicht wie diese Regierung.
Statt das Geld den Bürgern zurückzugeben oder weniger Schulden zu machen, gibt es also direkt mehr Geld für die parteinahen Stiftungen, für Klimagedöns und natürlich für die Ukraine: Noch mal 3 Milliarden Euro gab es dafür obendrauf. Insgesamt 11,5 Milliarden Euro sollen kommendes Jahr für einen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 49. Isabelle Vandre (Die Linke) — ID214201000

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Isabelle Vandre (Die Linke) verdammt den Haushalt 2025 als «zutiefst unsoziale und brandgefährliche Politik» der Spaltung: Die Koalition lege die Axt an den Sozialstaat, zwinge Kommunen zur Kürzung von Jugendkultur/Sport/Antidiskriminierungsstellen und stelle diesen Kahlschlag fälschlich als «Sachzwang» dar, während die zwei reichsten Familien so viel besäßen wie die ärmere Hälfte der Bevölkerung. Sie fordert Vermögensbesteuerung, Erbschafts- und Immobiliensteuer, Schließung von Steuerschlupflöchern (konkret: Share-Deal-Loophole bei Vonovia/Deutsche Wohnen, 1 Mrd Euro Berlin-Schaden) und Taskforce-Ermittlungen gegen Cum-Cum-Geschäfte (28,5 Mrd Euro Diebstahl) und Steuerhinterziehung (100 Mrd Euro) statt nur «Ankündigungen» — nicht Sparmaßnahmen, sondern Umverteilung nach oben.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Isabelle Vandre (Die Linke) lehnt den Haushalt des Bundesministeriums der Finanzen als Fortsetzung der Arm-Reich-Spaltung ab: Während Kommunen Sozialleistungen, Jugendkultur und Sport streichen müssen (Ankerbeispiel: Antidiskriminierungsstelle Opferperspektive in ihrem Wahlkreis vor dem Aus), werde die Bevorteilung von 'obszönem Reichtum' zementiert (zwei reichste Familien besitzen so viel wie die ärmere Bevölkerungshälfte). Sie fordert Vermögensbesteuerung, Erbschaftsbesteuerung, Schließung von Steuerschlupflöchern (Vonovia-Share-Deal-Beispiel: 1 Mrd Euro Berliner Steuerverlust) und konsequente Bekämpfung von Finanzkriminalität statt 'Ankündigungen' (Cum-Cum: 28,5 Mrd Euro Schaden; Steuerhinterziehung: 100 Mrd Euro jährlich) — eine 'zutiefst unsoziale und brandgefährliche Politik', gegen die umgesteuert werden muss.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…nem Reichtum beenden würden?
Nur um es Ihnen noch einmal deutlich zu sagen und es Sie nicht vergessen zu lassen: Die zwei reichsten Familien in diesem Land besitzen so viel wie die gesamte ärmere Hälfte der Bevölkerung. Das ist der obszöne Reichtum, den wir meinen, und das ist der obszöne Reichtum, den wir nicht akzeptieren können.
Denn dieser obszöne Reichtum wird eben zum Großteil leistungslos vererbt oder verschenkt. Deswegen lautet die Devise: Wir brauchen eine Vermögensbesteuerung, die ihren Namen auch verdient. Wir brauchen eine Besteuerung von Erbschaften und von Immobilien.
Wir müssen …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 50. Britta Haßelmann (BÜNDNIS 90/DIE GRÜNEN) — ID214300500

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Britta Haßelmann (Grüne) verbindet in ihrer Haushaltrede außenpolitische Warnung vor der AfD mit massiver Kritik an der Merz-Koalition. Außenpolitisch fordert sie geschlossene europäische Solidarität mit der Ukraine, die Aktivierung der Frozen Assets und warnt vor gefährlich-stabilitätsfeindlichen Signalen der AfD; innenpolitisch attackiert sie die Union als chaotisch-unberechenbar (widersprüchliche Positionen zu Rente und Wehrdienst), beklagt die Verschobenung von 9 Mrd für Bahninfrastruktur in Sondervermögen, kritisiert Steuergeschenke an die Gastrobranche statt Kommunalförderung (216 Mrd Investitionsstau), und verdammt schließlich die 50-Prozent-Kürzung der humanitären Hilfe als unverantwortlich angesichts globaler Krisen wie dem Sudan.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…as Recht, ohne Angst, in Sicherheit und mit Schutz zu leben. Auch das gehört zur Sicherheitsdebatte in unserem Land.
Denn das ist eine reale Bedrohung für viele, viele Frauen in unserem Land. Damit dürfen wir uns nicht abfinden.
Meine Damen und Herren, weniger als ein Viertel der Menschen in unserem Land hat Vertrauen in diese Regierung.
Und, Herr Merz, das hat auch etwas mit Ihnen zu tun,
mit dem Chaos in dieser Regierung, mit der Führungslosigkeit der Fraktion. Man weiß ja am Dienstagmorgen nicht, wie die Unionsfraktion am Dienstagnachmittag aus der Sitzung rauskommt,
ob die Rente oder ob de…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 51. Markus Frohnmaier (AfD) — ID214303700

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Markus Frohnmaier (AfD) verdammt den Haushalt des Auswärtigen Amts als „Lehrstück über ideologische Selbstüberhöhung" und charakterisiert das Ministerium als „woken Weltverbesseragentur": feministische Foren (425.000 Euro), urbane Jugendkultur in Asien (900.000 Euro), Klimajournalismus für Aktivisten (140.000 Euro) seien „Klubkultur-Aktivismus mit Diplomatenpass", nicht Diplomatie. Er fordert Streichung aller parteinahen Stiftungen und NGO-Zuwendungen, massive Kürzungen bei IPCC/OSZE/Europarat, Stopp der UNRWA-Finanzierung, Beendigung der Ukrainehilfe (76 Mrd Euro insgesamt, 11,5 Mrd geplant) sowie Aufklärung von Korruptionsfällen; statt „Moraltheater" fordert er Eigeninteresse nach amerikanischem Modell, kritisiert Merz-Entscheidung zu Nord Stream und attackiert den „NGO-Filz" (Patenschaftsnetzwerk Afghanische Ortskräfte mit 8,4 Mio Euro für „Luxuseinbauküchen") und angebliche Selbstbedienung durch Staatsminister Weimer. Die Rede endet mit direktem Wahlaufruf zur AfD.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…an den Nationalstaat. Souveräne Politik wird hier in Berlin und nicht in New York oder Brüssel gemacht.
Kommen wir zur Ukrainehilfe. Die muss in der derzeitigen Form beendet werden. Im vorliegenden Haushalt plant diese Bundesregierung 11,5 Milliarden Euro neue Hilfsmittel ein. Deutschland zahlt damit insgesamt rund 76 Milliarden Euro an die Ukraine. Das ist eine irrwitzige Belastung für unser Land, völlig unverhältnismäßig und zu 100 Prozent schuldenfinanziert.
Herr Wadephul, ich erwarte von Ihnen, das Ausmaß der Korruptionsaffäre in der Ukraine vollständig aufzuklären. Fehlverwendete Mittel m…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 52. Beatrix von Storch (AfD) — ID214305000

- **v1-flagged Wort:** `diffamiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Beatrix von Storch (AfD) kritisiert scharf die außenpolitische Linie Merz' als 'Kiesewetter-Kurs' und präsentiert dazu eine Retrospektive-Waffe: Die AfD habe bereits Februar 2023 realistische Friedensvorschläge (Rückzug, Volksabstimmung, Krim-Verhandlungen) gemacht, die Merz heute als seine Basis nutze — damals als 'fünfte Kolonne' diffamiert. Sie kontrastiert dies mit historischer Kontinuität (Adenauer-Kohl: Brückenbau Ost-West) und stellt eine wahlpolitische These auf: Le Pen, Bardella, Farage in ihren Ländern vorne in Umfragen, daher müsse Deutschland seine 'Vermittler'-Tradition zurück gewinnen statt 'Hardliner'-Einsamkeit zu riskieren. Ihr Schlussbild: Das Land solle innenpolitische Probleme (pünktliche Züge, Rente) lösen statt militärischen 'Größenwahn' (Pistorius' Losverfahren, stärkste konventionelle Armee) zu treiben.

**v2.1-Summary (neu):**
> Beatrix von Storch (AfD) wirft der CDU/CSU vor, die Außenpolitik zur innenpolitischen Waffe gegen die AfD zu missbrauchen und dabei den Ukraine-Krieg zu instrumentalisieren. Sie rehabilitiert die AfD-Friedensinitiative von Februar 2023 (Rückzug russischer Truppen, Volksabstimmung Ostukraine, Verhandlungen zur Krim) als faktisch überlegen gegenüber dem aktuellen Merz-Kurs und kritisiert die geplante Rüstungseskalation und Isolation-Rhetorik als 'Größenwahn' angesichts innenpolitischer Versäumnisse; ihre Botschaft: Vermittler-Rolle statt Scharfmacher-Kurs, Realismus statt Adenauer-Kohl-Kontinuität falsch verstanden, und Warnung vor kommender Isolation nach 2027 europäischer Wahlverschiebungen (Le Pen, Farage).

**Original-Auszug (Mitte, ~600 chars):**
```
…Bundesrepublik von Adenauer bis Kohl. Kohl hat 2014, das Jahr der Besetzung der Krim, in seinem Buch „Aus Sorge um Europa“ die Isolation Russlands tief bedauert. Wenn Alexander Gauland Ihnen hier immer wieder und historisch fundiert die internationalen Beziehungen erklärt hat, dann war er es, der in der Tradition der klugen, besonnenen Politik der alten Bundesrepublik stand und nicht Roderich Kiesewetter.
Der politische Gegensatz zwischen AfD und Friedrich Merz besteht nicht in der Frage, ob wir Teil des Westens sind oder nicht, sondern darin, welche Rolle wir im Westen übernehmen wollen: die …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 53. Tamara Mazzi (Die Linke) — ID214404300

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Tamara Mazzi (Die Linke) greift zur Gesundheitsbudget-Debatte auf und prangert die Zwei-Klassen-Medizin an: Während 10% privat versichert schnell Termine, Chefarzt-Behandlung und frühen Zugang zu teuren Medikamenten erhalten, warten 90% der gesetzlich Versicherten Wochen bis Monate auf Facharzt-Termine — ihr medizinisches Fallbeispiel zeigt, dass eine Brustkrebs-Diagnose bei GKV-Versicherung 3 Jahre später kommt als bei Privaten (MRT-Wartezeit). Sie verdammt die Schuldenbremse (seit 2009 von Regierungsparteien eingeführt) als Spardiktat, fordert eine Bürgerversicherung für alle nach Leistungsfähigkeit, Investitionen in öffentliche Kliniken statt Einsparungen und attackiert die Ministerin: „Sie müssen nicht sparen, Sie wollen sparen" — der Frame ist nicht Sachkritik sondern Anklage von struktureller Ungerechtigkeit.

**v2.1-Summary (neu):**
> Tamara Mazzi (Linke) kritisiert die Zweiklassenmedizin in Deutschland scharf: 10% privat Versicherte erhalten schnellere Termine und bessere Leistungen, während 90% gesetzlich Versicherte Monate auf Facharzttermine warten und durch Leistungslücken (z.B. verspätete MRT-Übernahme bei Brustkrebsverdacht) gesundheitlich benachteiligt sind — zitiert die GKV-Chefin Stoff-Ahnis auf „Diskriminierung". Sie wirft der Regierung vor, nicht sparen zu müssen, sondern zu wollen: Die Schuldenbremse (seit 2009) führe zu Sparmaßnahmen auf dem Rücken von Millionen Menschen und Krankenhäusern, statt die Vermögenden stärker in die Solidarfinanzierung einzubeziehen. Ihre Lösung: Bürgerversicherung für alle mit einkommensabhängigen Beiträgen und Investitionen in öffentliche Kliniken statt Spardiktate.

**Original-Auszug (Mitte, ~600 chars):**
```
…icherte, also Beamte, Selbstständige und auch viele Abgeordnete und Spitzenverdiener, dort nicht einzahlen.
Das erlaubt, dass reiche Menschen sich aus der gesellschaftlichen Verantwortung stehlen. Da kann man nicht von einem solidarischen Gesundheitssystem sprechen. Das ist ein System der Zweiklassenmedizin.
Wenn im Haushalt über Gesundheit geredet wird, dann kommt von der Regierung immer eins ganz schnell: Wo können wir sparen? Wo können wir Menschen Leistungen kürzen, wie bei der Diskussion zum Pflegegrad 1? Wo finden wir noch einen armen Sündenbock, dem wir unser Versagen in die Schuhe schi…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 54. Marcel Queckemeyer (AfD) — ID214703000

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Marcel Queckemeyer (AfD) attackiert die Grünen-Klimapolitik als „Bürgerfernsehen mit moralischem Zeigefinger" und Doppelmoral: Der Polizeieinsatz zum Demos-Schutz (8.000 Beamte, massive CO2-Emissionen durch Fahrzeugkolonnen) zeige den Widerspruch zwischen grünen Bürgerbefragungen und eigenen Verhaltensstandards. Er lehnt weitere Inlandsflug-Steuern ab (Kosten bereits 50% Steuern), prangert die jährlichen CO2-Abgaben-Erhöhungen als gezielte Belastung von Landfamilien an und fordert Innovationen statt Verbote sowie den Erhalt regionaler Flugverbindungen (Münster/Osnabrück – München); sein Schluss ist ein impliziter AfD-Wahlaufruf gegen Grünen-Wohlstandszerstörung.

**v2.1-Summary (neu):**
> Marcel Queckemeyer (AfD) attackiert die Grünen-Klimapolitik als Doppelmoral: 8.000 Polizisten wurden für eine von grünen Politikern befürwortete Demonstration mobilisiert, deren Einsatz massiv CO2 ausstoße, während die Grünen Bürgern 'moralischen Zeigefinger' haltend Verzicht predigen. Er kritisiert die CO2-Bepreisung und Flugsteuern (die bereits 50% der Kosten ausmachen) als eiskalt kalkulierte Belastung für Familien auf dem Land, während die Bahn unreliabel bleibe — die Grünen-Politik zerstöre Wohlstand und soziale Gerechtigkeit; die AfD fordert Innovationen statt grüner Verbote und eine Politik, die nach ihren eigenen Maßstäben lebt.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…und Herren, die Kosten für Inlandsflüge bestehen heute schon zur Hälfte aus Steuern, und Sie wollen an die nächsten Flüge heran, während die Bahn auf der anderen Seite unzuverlässiger, überfüllter und teurer wird. Das ist keine Klimapolitik, das ist Bürgerfernsehen mit moralischem Zeigefinger. Durch Ihre Politik verliert der Wirtschaftsstandort Deutschland stetig an Bedeutsamkeit.
Das zeigt allein schon ein Blick auf meine Region Osnabrück: Dieser Standort wird stetig uninteressanter für Unternehmen, erst recht, wenn die letzte Inlandsverbindung vom Flughafen Münster/Osnabrück nach München auc…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 55. Matthias Helferich (AfD) — ID214705600

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `skandalisieren`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Matthias Helferich (AfD) verlangt den Rücktritt von Kulturstaatsminister Weimer wegen ethischen Verfalls und Heuchelei: Er bewaffnet sich mit Weimers eigenen Worten zur Demokratie-Erosion gegen ihn, dokumentiert die Gießen-Krawalle (50 verletzte Polizisten, linker Mob), die Kulturpreise für Verlage mit linksextremistischem Katalog, und die Tegernsee-Veranstaltung als „Geschäftsmodell" zum Verkauf von Einfluss auf Minister. Der zentrale Vorwurf: Die Weimer Media Group weigert sich, über 7.000 Euro Schadensersatz an den Plagiats-Geschädigten Dr. Stefan Weber zu zahlen — Helferich rahmt dies mit antiker Plagiarius-Rhetorik als „Seelenraub" und stellt die Zahlungsaufforderung „stellvertretend für Ihr Opfer" – mit Hoffnung auf baldige „Entlassungspapiere des Bundeskanzlers".

**v2.1-Summary (neu):**
> Matthias Helferich (AfD) greift Kulturstaatsminister Weimer frontal an und fordert seinen Rücktritt wegen Vertrauenserosion in der Demokratie: Weimer würdige Verlage, die Gewalt und Linksextremismus verlegten, betreibe ein korruptes Geschäftsmodell (Ludwig-Erhard-Gipfel mit Weimer Media Group), und plündere das Urheberrecht (Plagiatsfälle gegen Dr. Stefan Weber, 7.000+ Euro ausstehend). Helferich nutzt historische Parallelen (Rom, 'Seelenraub') und konkrete Opfer-Details, um die Heuchelei des Kulturstaatsministers zu skandalisieren; der Schlusssatz impliziert eine Forderung nach Kanzler-Entlassung.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "skandalisieren"   ],   "begruendung_falls_unsicher": "Das Wort 'skandalisieren' in der zusammenfassung_2_saetze ist eine Paraphrase eigener Deutung — der Sprecher nutzt diese prägnante Zusammenfassung nicht selbst, sondern beschreibt eher die Fakten und lässt die Skandalisierung implizit entstehen. Besser: 'die Heuchelei des Kulturstaatsministers aufzudecken' oder 'anzuprangern'." }

**Original-Auszug (Mitte, ~600 chars):**
```
…Generation Deutschland. Gießen brannte. Der linke Mob machte die Universitätsstadt zum Austragungsort eines Bürgerkriegs, der die literarischen Grundlagen in Ihren Verlagspreisträgern fand. Das war dann wohl diese „Zärtlichkeit des Zweifels“, die Herr Weimer meinte.
Mit dem Ludwig-Erhard-Gipfel betreiben Sie, Herr Kulturstaatsminister, am Tegernsee ein ganz besonderes Geschäftsmodell. Die Weimer Media Group verkauft Abendessen und intime Unterredungen mit Bundesministern an wohlhabende Kunden.
Man nennt das Ganze schamlos einen Einfluss auf Entscheidungsträger, wovon Sie als Staatsminister wie…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 56. Lukas Krieger (CDU/CSU) — ID214706600

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lukas Krieger (CDU/CSU), selbst ehemals Steueranwalt, verteidigt Abgeordnete mit Unternehmenshintergrund gegen die Kritik, dass diese ihre „berufliche und wirtschaftliche Existenz vernichten" müssen, wenn sie sich der Dienstbarkeit für den Staat widmen. Er wirft der Kritik (implizit der AfD) eine Doppelmoral vor: erst wird beklagt, dass Politiker im normalen Leben nichts hinbekommen, dann wird Fachkompetenz und wirtschaftlicher Erfolg wieder kritisiert — „Es kann doch nicht sein" sei dieser Zustand. Sein Frame: Respekt vor Unternehmern, die ihre Karriere für Deutschland opfern.

**v2.1-Summary (neu):**
> Lukas Krieger (CDU/CSU) wehrt sich gegen den AfD-Antrag und verteidigt mit Fachkompetenz (Steuerjurist) die Legitimität von erfolgreichen Unternehmern in der Politik: Es sei widersinnig, dass Politiker ohne Erfahrung kritisiert werden, aber Unternehmer, die sich „zum Wohle Deutschlands" engagieren wollen, ihre „berufliche und wirtschaftliche Existenz vernichten" müssen — genau das versuche die AfD, weshalb er sich „dagegen wehrt". Die Rede zielt auf die Heuchelei-Vorwurf-Struktur (Standards gegen AfD) und die Treuhand-Forderung als übergriffig.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "Heuchelei"   ],   "begruendung_falls_unsicher": "Das Wort 'Heuchelei' wurde von mir (nicht vom Sprecher Krieger) in die Synthese eingebaut — Krieger nutzt die Vokabel nicht wörtlich. Die Rede spricht von 'Doppelstandards' (implizit durch Paradox-Rhetorik), aber nicht von Heuchelei. Korrektur in final version: statt 'Heuchelei-Vorwurf-Struktur' lieber 'Doppelstandard-Aufdeckung' oder 'Paradoxon-Struktur'." }

**Original-Auszug (Mitte, ~600 chars):**
```
…nd ist. Vielen Dank für die Erklärung.
Trotzdem muss ich mal eine Sache sagen. Wir lästern immer über Politiker – besonders auch die AfD –, die hätten im normalen Leben nichts hingekriegt, würden hier nur sitzen und die Diäten einstreichen. Dann hat jemand Fachkompetenz und ist als Unternehmer vorher erfolgreich gewesen,
und dann ist es auch wieder nicht richtig. Es kann doch nicht sein, dass jemand, der sich hier aufmacht, den Staat zu unterstützen, zum Wohle Deutschlands beizutragen, dann seine berufliche und wirtschaftliche Existenz vernichten muss. Das ist das, was Sie hier versuchen. Wir …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 57. Matthias Helferich (AfD) — ID214706800

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Matthias Helferich (AfD) beginnt mit einer Gegenattacke gegen den SPD-Redner Reddig und erklärt dessen Vorwurf einer Nazi-Selbstbeschreibung für „langweilig"; er relativiert den Generationenabstand (gemeinsame Schüler-Union-Vergangenheit mit Krieger). Mit umgekehrtem moralischem Zeigefinger wertet er dann Reddigs Fraktionskollegen auf: dieser sei 2005 in einem Video mit NSDAP-Nadel und Aussagen zu „jüdischem Bolschewismus" und Ausländer-„Katalogisierung" aufgetreten und habe deshalb zurücktreten müssen — dies sei die eigentliche Heuchelei der SPD, nicht AfD-Positionen. Die Rede ist reine Defensive-mit-Gegenattacke ohne eigenständige Forderungen.

**v2.1-Summary (neu):**
> Matthias Helferich (AfD) weist den Vorwurf ab, sich als „freundliches Gesicht des Nationalsozialismus" bezeichnet zu haben, und nennt diesen Vorwurf „wirklich langweilig". Stattdessen attackiert er den Gesprächspartner mit einer Gegenattacke: ein Fraktionskollege des Gegenübers habe 2005 in einem Video „dem jüdischen Bolschewismus den Kampf angesagt", eine NSDAP-Nadel getragen und die Aussage gemacht „Wir wollen Ausländer nicht abschieben, wir wollen sie katalogisieren" — dieser sei zurückgetreten; Helferich stellt dies gegen die moralische Kritik des Gegenübers in den Raum.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…cht des Nationalsozialismus bezeichnet, ist wirklich langweilig.
Ich kenne Herrn Krieger noch aus der Schüler Union. Wir, Lukas und ich, sind ja eine Generation und waren früher in der Schüler Union organisiert. Und wenn Sie immer den moralischen Zeigefinger schwenken,
dann sollten Sie sich mal mit der Geschichte Ihres Fraktionskollegen beschäftigen, der zurücktreten musste, weil er in einem Video 2005 dem „jüdischen Bolschewismus“ den Kampf ansagte,
eine NSDAP-Nadel trug, sich damit filmen ließ und sagte: Wir wollen Ausländer nicht abschieben, wir wollen sie katalogisieren.
Damit sollten Sie …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 58. Pascal Reddig (CDU/CSU) — ID214706900

- **v1-flagged Wort:** `diffamierende`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Pascal Reddig (CDU/CSU) antwortet scharf auf den AfD-Redner Helferich und zitiert Volkmann, der diesem vorhielt, er sei nur das „freundliche Gesicht des Nationalsozialismus". Reddig wirft Helferich vor, dass dieser sich nicht um Antisemitismus-Bekämpfung kümmere, sondern „an jeder Stelle verharmlosen", und kritisiert die fehlende Entschuldigung für diffamierende E-Mails mit dem Schlusssatz „wes Geistes Kind Sie sind" — eine pointierte Frame-Aufdeckung des AfD-Antrags als Nationalsozialismusapologetik.

**v2.1-Summary (neu):**
> Pascal Reddig (CDU/CSU) interveniert konfrontativ gegen den AfD-Abgeordneten Helferich, indem er einen früheren Kollegenzitat einsetzt: Volkmann habe Helferich als „freundliches Gesicht des Nationalsozialismus" charakterisiert und geraten, an der Freundlichkeit zu arbeiten — die Charakterisierung sei prägnant. Reddig wirft Helferich vor, es gehe ihm nicht um echten Antisemitismus-Kampf, sondern um Verharmlosung, und kritisiert, dass dieser sich weder für problematische E-Mails noch für seine Wortbeiträge entschuldigt habe.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…err Kollege Helferich, ich will an der Stelle einfach den Herrn Kollegen Volkmann zitieren, der in einer der letzten Debatten in Ihre Richtung gesagt hat: Sie bezeichnen sich selbst „als ‚freundliches Gesicht des Nationalsozialismus‘ […]: „Am ‚freundlich‘ müssen Sie noch arbeiten, […].“
Ich finde, dass Ihr Wortbeitrag wieder eines zeigt: Ihnen geht es nicht um den Kampf gegen Antisemitismus, Sie verharmlosen an jeder Stelle.
Und dass Sie sich heute nicht mal entschuldigt haben für Ihre Worte, für die E-Mails, die Sie wohl immer wieder verschickt haben, zeigt jedenfalls, wes Geistes Kind Sie si…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 59. Heinrich Koch (AfD) — ID214710500

- **v1-flagged Wort:** `polemisiert`
- **v2.1 enthält noch:** `skandalisiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Heinrich Koch (AfD) polemisiert gegen die Linke und Grüne für ihre Sudan-Anträge als 'selektiven Blick' von 'SED-Nachfolger und Hamassympathisanten', die nach Trumps Gazafrieden ein neues 'moralisches Spielfeld' brauchten. Er unterstützt Trumps Friedensinitiative mit Saudi-Arabien, VAE und Ägypten vom September 2025, lehnt beide Linke-Anträge als 'linke Einheitsfront' ab und kritisiert die deutsche Außenpolitik scharf als nicht wahrgenommen und gegen 'den mächtigsten Politiker der Welt' gerichtet — inklusive Spitze gegen CDU-Transatlantiker ('Pinocchio sitzt am Katzentisch'). Sein Frame: echter Stabilität braucht 'Diplomatie, Realismus und klare Prioritäten', nicht moralische Selbstdarstellung.

**v2.1-Summary (neu):**
> Heinrich Koch (AfD) lehnt die Anträge der Linken zum Sudan scharf ab und rahmt sie als Versuch des „moralischen Machtspiels" nach Trumps Gaza-Friedensplan. Er unterstützt stattdessen die US-Friedensinitiative vom September 2025 mit Saudi-Arabien, VAE und Ägypten, attackiert die „links-grünen Hamassympathisanten" und die „Transatlantiker der CDU" für ihre Kritik an Trump, und behauptet, die Bundesregierung betreibe eine Außenpolitik, die sich „gegen den mächtigsten Politiker der Welt richtet" — statt Diplomatie und Realismus sehe man hier nur „moralische Selbstdarstellung". Sein Schluss ist ein direkter Appell an Trump, „das Morden in Gaza, Ukraine und Sudan zu beenden".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "moralisches Machspiel (v1 könnte hier „skandalisiert" eingefügt haben — ist aber eigentlich Paraphrase des Redner-Frames „moralische Selbstdarstellung")"   ],   "begruendung_falls_unsicher": "Der Redner selbst nutzt in der polemischen Situation Unterstellungen ('Hamassympathisanten') als Charakterisierung — ich habe diese als Zitate mit Ad-hominem-Kontext wiedergegeben, nicht als objektive Fakten, aber nicht explizit mit Verben wie 'behauptet' oder 'unterstellt' distanziert, weil der Redner das selbst nicht tut." }

**Original-Auszug (Mitte, ~600 chars):**
```
…zutiefst in regionale Machtspiele verwickelt. Was aber viele nicht erwähnen: Die Saudis haben Präsident Trump gebeten, seine Autorität einzusetzen, um dieses Morden zu beenden.
Ausgerechnet derjenige Präsident, welcher auch von hier Sitzenden beleidigt und verhöhnt wurde. Dämlicherweise waren auch selbsternannte Transatlantiker der CDU mit dabei. Deshalb gibt es keine Hintergrundinformationen, keine Termine, und Pinocchio muss am Katzentisch sitzen. Diese Regierung braucht sich darüber nicht zu wundern. Sie betreibt eine Außenpolitik, die nicht wahrgenommen wird und sich gegen den mächtigsten …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 60. Jan Feser (AfD) — ID214711500

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Jan Feser (AfD) eröffnet eine polemische Rede zur Gewaltbekämpfung in Jobcentern mit einer Aufzählung von 12 Einzelfällen tödlicher und schwerer Angriffe (2012–2023), um zu zeigen, dass Jobcentermitarbeiter systematischen Übergriffen ausgesetzt sind — davon 31,5% durch ausländische Staatsangehörige. Er kritisiert mit Sarkasmus die Unterfassung dieser Übergriffe durch Behörden (79 Fälle Rostock vs. 324 bundesweit) und die symbolische Reaktion der Regierung (ein Gewalt-Präventionspakt ohne substanzielle Maßnahmen), während 72% der betroffenen Mitarbeiter Frauen sind — und schließt mit einem Appell an die Opposition, die AfD-Position ernst zu nehmen oder ihre Doppelmoral zu widersprechen. Die Forderung: Maßnahmen zur Sicherung der Jobcenter-Funktionsfähigkeit als verfassungsrechtliches Sozialstaatsziel.

**v2.1-Summary (neu):**
> Jan Feser (AfD) eröffnet mit einer akribischen Aufzählung von 12 dokumentierten Gewaltvorfällen gegen Jobcenter-Mitarbeiter zwischen 2012 und 2023 (Messerangriffen, Hammerschlägen, Schnittwunden), zwei davon tödlich, und ergänzt mit Statistiken: jeder vierte Jobcenter-Beschäftigte wurde gewaltsam angegriffen, 31,5 Prozent der Täter sind ausländische Staatsangehörige; er kritisiert Untererfassung (offizielle 324 Übergriffe 2024 vs. 79 aus Rostock allein) sowie Hessens „Possenspielchen"-Pakt als bloße Symbolik. Der Antrag fordert Verbesserungen bei Sicherheit, Erfassung und Strafverfolgung; Feser attackiert Gegner mit Sarkasmus („Danke für die kulturelle Bereicherung", „Wer es glaubt, wird selig") und endet mit direkter Adressierung: Die Gegner würden inkonsistent argumentieren, während 72 Prozent der Jobcenter-Beschäftigten Frauen seien — und wirft den Parlamentariern vor, ihre eigenen Positionen zu verraten.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
… am Arbeitsplatz bedroht fühlen, die Hälfte von ihnen über einen Jobwechsel nachdenkt,
während die Anzahl ihrer Krankheitstage sieben Tage über dem Bundesdurchschnitt liegt.
Die betreffenden Übergriffe werden zudem weitgehend nicht erfasst, geschweige denn bekannt gemacht oder zur Anzeige gebracht – sei es, weil Vorgesetzte die Vorkommnisse lieber unter den Teppich kehren, anstatt den ach so guten Ruf der eigenen Behörde zu riskieren, oder weil die Opfer aus Scham, aus begründeter Angst vor der Rache der Täter oder gar auf Anweisung des Dienstherrn keine Anzeige erstatten, insbesondere wenn di…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 61. Peter Aumer (CDU/CSU) — ID214712000

- **v1-flagged Wort:** `Stimmungsmache`
- **v2.1 enthält noch:** `Stimmungsmache`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Peter Aumer (CDU/CSU) widerlegt den AfD-Antrag zu Jobcenter-Sicherheit als „populistische Stimmungsmache" und kontrastiert ihn mit der Koalitions-Position „Sicherheit ja, Abschottung nein": flächenhafte Flughafen-ähnliche Kontrollen in allen Behörden seien unangemessen, statt dessen sollen vor Ort bewährte Sicherheitskonzepte (Beispiel: Würzburgs Sozialreferentin Hülya Düber) umgesetzt werden. Belegt wird die CDU/CSU-Regierungsverantwortung durch die Budgeterhöhung von 600.000 Euro und deren Verstetigung, während er der AfD fehlende Umsetzungserfahrung attestiert.

**v2.1-Summary (neu):**
> Peter Aumer (CDU/CSU) befürwortet die Anerkennung der Jobcenter-Mitarbeiter und verteidigt differenzierte Sicherheitsmaßnahmen gegen den AfD-Antrag: Er kritisiert diesen als 'populistische Stimmungsmache', da er zu bundesgesetzlich regulierten, flughafen-ähnlichen Kontrollen in allen Behörden führen würde — stattdessen müssen operative Sicherheitskonzepte vor Ort umgesetzt werden. Die Koalition habe das Jobcenter-Budget um 600.000 Euro erhöht und verstetigt es mehrjährig ('Verantwortung statt Populismus'); seine Kritik an AfD und Feser: Es fehle die Vor-Ort-Erfahrung in Behörden.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…ehr geehrten Damen und Herren, das kann nicht sein. Das ist eine gesellschaftliche Herausforderung. Wir alle tragen Verantwortung, dass es darauf Antworten und Lösungen gibt.
Sicherheit ja, Abschottung nein. Der Antrag der AfD ist kein Beitrag zur Lösung. Er greift operative Details auf und will das bundesgesetzlich regeln. Das, meine Damen und Herren der AfD, gehört nicht in ein Gesetz, sondern vor Ort umgesetzt.
Aber mit dem Umsetzen haben Sie keine Erfahrung. Deswegen ist das schwierig.
Ich nenne ein Beispiel. Unsere Kollegin Hülya Düber war Sozialreferentin der Stadt Würzburg und hat in ih…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 62. René Springer (AfD) — ID214906100

- **v1-flagged Wort:** `skandalisiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> René Springer (AfD) erinnert die Koalition an ihr eigenes Wahlprogramm-Versprechen, Sozialleistungen für Ausreisepflichtige auf 'Bett, Brot und Seife' zu beschränken, und skandalisiert die aktuelle Situation: 934.000 rechtskräftig abgelehnte Asylbewerber hielten sich derzeit illegal in Deutschland auf — eine 'unglaubliche Zahl' von knapp 1 Million Menschen — ohne dass sie auch nur die versprochenen Minimalleistungen erhielten. Springer schließt mit einer direkten Anklage-Frage: 'Wann ist damit zu rechnen, dass Sie Ihre Versprechen umsetzen?'

**v2.1-Summary (neu):**
> René Springer (AfD) hält die Koalition an ihr Wahlprogramm-Versprechen: Sozialleistungen für Ausreisepflichtige nach dem Grundsatz „Bett, Brot und Seife". Er zitiert die konkrete Zahl 934.000 rechtskräftig abgelehnte Asylbewerber und wirft der Regierung vor, diesen Menschen nicht einmal die versprochene Grundversorgung zu gewährleisten — und fordert eine Zeitangabe für die Umsetzung. Die Rede wird durch mehrfache Präsidiums-Interventionen unterbrochen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…Ihrem Wahlprogramm hieß es: „Wir richten Sozialleistungen für Ausreisepflichtige an dem […] Grundsatz ‚Bett, Brot und Seife‘ aus.“ Wir als AfD-Fraktion unterstützen das ausdrücklich; das war ja auch mal unser Antrag.
Jetzt wissen wir, dass sich derzeit 934 000 rechtskräftig abgelehnte Asylbewerber in Deutschland aufhalten – eine unglaubliche Zahl. Wir sind hier bei knapp 1 Million Menschen, die sich illegal in Deutschland aufhalten.
Ihre Zeit ist abgelaufen; das waren 30 Sekunden.
Wir wissen, dass keiner von denen Brot, Bett und Seife bekommt.
Nein, Ihre Zeit ist abgelaufen!
Wann ist damit zu …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 63. Ines Schwerdtner (Die Linke) — ID214909400

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Ines Schwerdtner (Die Linke) attackiert den Armuts- und Reichtumsbericht der Bundesregierung als politisch unwirksam und einseitig: während ihre Genossen in Lichtenberg armen Menschen heißen Tee verteilen, verstoße der Bericht gegen Grundtatsachen — die 1.381-Euro-Armutsschwelle ignoriere konkrete Lebenserfahrungen, die Reichtums-Erfassung beginne willkürlich bei 5.000/500.000 Euro (womit ein Oberstudienrat mit Dieter Schwarz gleichgestellt werde), und der Bericht verschweige bewusst den Kausalzusammenhang: die fünf reichsten Familien besäßen 250 Mrd Euro — soviel wie die ärmere Hälfte der 40-Millionen-Bevölkerung. Sie fordert eine Vermögensteuer (108 Mrd Euro Ertrag jährlich), Erbschaftsteuer-Reform und kritisiert die SPD-Heuchelei — das immer wieder vor Wahlen versprochen, aber bei Koalitionsverhandlungen fallen gelassen zu haben, sei politisches Versagen beim Schutz von Milliardären.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…will, wie viele Superreiche wir in Deutschland haben, dann schaue ich lieber in das „Manager Magazin“ als in Ihren Bericht, und das ist wirklich absurd.
Drittens. Der Bericht schweigt zum Zusammenhang von Reichtum und Armut. Die fünf reichsten Familien verfügen in Deutschland über ein Privatvermögen von 250 Milliarden Euro. Das ist so viel wie die ärmere Hälfte der gesamten Bevölkerung: 40 Millionen Menschen.
Schon Bert Brecht wies auf den Zusammenhang hin, als er sagte: „Reicher Mann und armer Mann standen da und sahn sich an. Und der Arme sagte bleich: Wärʼ ich nicht arm, wärst du nicht reic…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 64. Dunja Kreiser (SPD) — ID215013200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dunja Kreiser (SPD) verteidigt die Energiewende und widerlegt zentrale AfD-Behauptungen zur Kernenergie direkt: Atomkraft sei nicht günstig (wird überall subventioniert), nicht sicher (keine Endlagerlösung, radioaktiv), und nicht CO₂-einsparend (Betonherstellung). Mit Verweis auf lokale Endlagerstandorte in ihrem Wahlkreis (Asse II, Schacht Konrad) unterstreicht sie die Komplexität dieser Fragen und attackiert die AfD-Heuchelei: eine Partei, die sonst gegen Staatssubventionen ankämpft, preist plötzlich Atom-Subventionen und EU-Bindung an — „das ist schon sensationell". Schlusswort: „Sie sind der Super-GAU. Wir lehnen Ihren Antrag ab."

**v2.1-Summary (neu):**
> Dunja Kreiser (SPD) widerlegt in konfrontativer Form die vorherige AfD-Rede zu Atomenergie punkt für punkt: Atomkraft sei nicht günstig (wird überall subventioniert), nicht sicher (keine Endlagerung, radioaktives Material), und CO2-intensiv bereits bei der Betonherstellung. Sie verweist auf die Endlager-Standorte in ihrem Wahlkreis (Asse II, Schacht Konrad) und betont die Notwendigkeit fachlichen Austauschs; abschließend attackiert sie die AfD für ihren Widerspruch: Sie kritisiere sonst Subventionen, zeige aber eine „neue Verliebtheit in die EU" und Subventionen bei der Atomkraft — „Sie sind der Super-GAU." Die SPD lehnt den Antrag ab.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…gen verdienen mehr als einfache Antworten. Deshalb suche ich stetig den fachlichen und zivilgesellschaftlichen Austausch über die Situation in der Schachtanlage Asse, in Vahlberg, in Remlingen und über die diesbezüglich sichere Begleitung der notwendigen Rückholung der Abfälle.
Dasselbe gilt für mich aber auch für die komplexen Fragen und Prozesse zum Schacht Konrad in Salzgitter, deren Klärung langwierig und schwierig ist. Der Austausch ist kontrovers und kompliziert, aber auch wichtig und richtig. Allein daran sieht man, wie komplex die Prozesse sind. Wir befinden uns noch in der schwierigen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 65. Kay Gottschalk (AfD) — ID215100700

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Kay Gottschalk (AfD) verdammt das Standortfördergesetz als 'Fehlallokationskapitalvernichtungsgesetz' und rahmt es als 'sozialistische Lenkung und Staatskapitalismus der ganz schlechten Art' — die Klassenkampfrhetorik von Arbeitsministerin Bas (IHK-Schätzung: 5–10 Mrd Euro Wirtschaftsschaden) verschrecke Investoren, statt sie willkommen zu heißen. Konkrete Forderungen: Abschaffung der Wegzugsbesteuerung ('Reichsfluchtsteuer' / Mauer-Metapher), kanadisches Flow-Through-Aktien-Modell zur Verlustverrechnung, Reduktion der Grüne-Gewichtung, Steuerwettbewerb erlauben; Gottschalk kontrastiert deutsche Belastungen (23.900 Unternehmenspleiten, 57 Mrd Forderungsausfälle, 285.000 weggefallene Arbeitsplätze über 20 Jahre) mit Kanton Zugs Erfolgsmodell (12% Körperschaftsteuer, keine Gewerbesteuer, kein Kapitalertragssteuer).

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
… weiß ich nicht, wie das an dieser Stelle möglich sein soll. Ich komme nämlich gleich zur Wegzugsbesteuerung und anderen grauenhaften Dingen, die Sie im Gesetz weiter nicht angegangen haben.
Und egal was Sie hier reinschreiben – meine Damen und Herren, das muss man Ihnen noch mal sagen: das ist Sozialismus der besten Art, das ist Lenkungspolitik, die hier betrieben wird –: Alles steht völlig sinnentleert unter dem Vorbehalt „Transformation, Nachhaltigkeit und Infrastruktur“. Infrastruktur in einem Fördergesetz ist auch eine Bankrotterklärung Ihrer Politik der letzten 20 Jahre, meine Damen und …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 66. Lisa Schubert (Die Linke) — ID215101200

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lisa Schubert (Die Linke) verdammt das Standortfördergesetz (StoFöG) und das Bankenderegulierungsgesetz (BRUBEG) als Deregulierungspakete, die unter dem Deckmantel von Wettbewerbsfähigkeit Sonderrechte für Finanzinvestoren und die 'Finanzlobby' schaffen, während der deutsche Bankensektor laut Bundesfinanzministerium bereits eine 'komfortable Eigenmittelausstattung' besitze. Sie kritisiert die neoliberale Erzählung, dass private Märkte klimaneutrale Wirtschaft finanzieren könnten, mit historischem Rückblick auf 50 Jahre gescheiterte Privatisierung von Infrastruktur (Brücken, Pflegheime, Wohnungen) und fordert einen Kurswechsel zu öffentlicher Steuerung und 'Politik für die Menschen' statt für Superreiche — untermauert durch den Welt-Ungleichheitsbericht 2026 (weniger als 0,001% besitzen mehr als die ärmere Hälfte).

**v2.1-Summary (neu):**
> Lisa Schubert (Die Linke) lehnt beide Gesetze (StoFöG und BRUBEG) als Deregulierung zugunsten der Finanzlobby ab: die Erzählung, nur starke Finanzmärkte könnten Klimawandel und Wirtschaft finanzieren, sei „nicht nur falsch; sie ist brandgefährlich" — Private Investoren suchten nur kurzfristige Renditen, während öffentliche Finanzierung langfristig strategisch investieren könne. Sie kritisiert konkret steuerliche Vorteile für Finanzinvestoren, Verbraucherschutz-Abbau (Melde-/Beschwerderegister), Sonderregelungen für vier Immobilienfonds und die Dominanz der Finanzlobby (zehn Lobbyisten pro Finanzausschuss-Abgeordneter); infrastrukturelle Privatisierung (Brücken, Wasser, Pflegeheime, Wohnungen, Agrarflächen) führe zu Hyperprofitlogik statt demokratischer Handlung. Abschlussforderung: Kurswechsel zu „Politik für die Menschen" statt für Superreiche.</zusammenfassung_2_saetze</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…ng, wofür dieses Geld eingesetzt wird.
Und hier versagt die Bundesregierung. Im Bankenpaket bleibt jeder Spielraum ungenutzt, der helfen würde, Kredite gezielt weg von Spekulation und fossilen Geschäftsmodellen und hin zu Realwirtschaft, Klimaschutz und guter Arbeit zu lenken.
Und weil heute endgültig darüber abgestimmt wird, noch mal kurz zum Standortfördergesetz: Auch wenn die Bundesregierung behauptet, dieses Gesetz nütze allen, muss ich sagen: Das stimmt nicht. Es ist und bleibt ein Gesetz für die Finanzlobby, und es hilft vor allem den Reichsten in diesem Land. Es richtet sich vor allem a…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 67. Rebecca Lenhard (BÜNDNIS 90/DIE GRÜNEN) — ID215109000

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Rebecca Lenhard (Grüne) verteidigt den Digital Services Act und attackiert die AfD-Delegation für ihren Besuch bei der MAGA-Bewegung: Sie zeigt die Heuchelei auf, dass die AfD „angeblich patriotisch" sei, aber in Wahrheit bei Big Tech und der US-Regierung stehe, während sie gleichzeitig Russland besuche. Sie belegt ihre Anklage konkret mit Beatrix von Storchs Aussage bei Markus Lanz, Informationen an die US-Regierung weiterzugeben, und kontrastiert AfD-Reden von Meinungsfreiheit mit der Realität russischer Repressionen und US-amerikanischer Überwachungs-Praktiken (5-Jahres-Social-Media-Prüfung, Sanktionen gegen ICC-Richter/-innen). Kernbotschaft: Europa reguliert den digitalen Raum aus Verantwortung für Demokratie und Sicherheit, nicht zur Machtdemonstration — und wird sich davon nicht einschüchtern lassen.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Rebecca Lenhard (Grüne) verteidigt den Digital Services Act gegen AfD-Kritik und führt mit Belegen auf, dass die AfD durch ihre USA-Delegation zur MAGA-Bewegung und Big Tech eine Heuchelei bei der Meinungsfreiheit offenbare: Sie kritisiere nicht russische Repressionen, lobe die US-Regierung (die Social-Media-Profile von Reisenden 5 Jahre lang auswertet und ICC-Richter/-innen sanktioniert), und Beatrix von Storch habe bei Markus Lanz erklärt, Informationen gerne der US-Regierung zur Verfügung zu stellen — während sie als Abgeordnete hier für die Menschen Deutschlands gewählt seien, nicht für Autokraten, Big Tech oder die USA. Sie betont: „Wir lassen uns nicht einschüchtern, weder von der US-Regierung noch von Ihnen" und bekräftigt Bündnis 90/Die Grünen als Verteidiger einer souveränen, sicheren digitalen Zukunft Europas gegen externe Einflussnahme.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": ["brandgefährlich", "hochgefährlich"],   "begruendung_falls_unsicher": "Die Wörter 'brandgefährlich' und 'hochgefährlich' stammen wörtlich aus dem Original-Text der Sprecherin (Lenhard), sind also nicht eingefügt — aber das Zitieren dieser wertenden Worte macht die Summary nicht neutral. Ich habe sie aufgenommen, weil sie strukturelle Bestandteile der Anklag-Rhetorik sind; eine Entfernung würde die Polemik verfälschen (H2-Verletzung). Konfidenz = mittel, weil die Grenzlinie zwischen 'Polemik bewahren' und 'Neutralität' hier eng ist." }

**Original-Auszug (Mitte, ~600 chars):**
```
…ands, sondern auf der Seite von Big Tech, von der US-Regierung, und das ist brandgefährlich.
Was besonders spannend ist, ist die Begründung, dass es hier um Meinungsfreiheit ginge.
Gerade die AfD, die mit Delegationen nach Russland fährt, um sich dort mit der Regierung auszutauschen, die ihre Bürger/-innen in die russische Botschaft führt,
die kein kritisches Wort zu russischen Repressionen verliert, gerade diese AfD spricht von Meinungsfreiheit. Ich frage: Haben Sie sich eigentlich schon mal mit russischen Oppositionellen unterhalten, mit Menschen, die dort Russland kritisieren? Ist das die M…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 68. Henri Schmidt (CDU/CSU) — ID215109400

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Henri Schmidt (CDU/CSU) verteidigt den Digital Services Act gegen den AfD-Abschaffungs-Antrag und beschuldigt die AfD der Heuchelei: Sie inszeniere sich als „Law-and-Order-Partei", lehne aber genau dann ab, wenn konkrete Rechtsdurchsetzung gefordert ist. Der DSA stärke die Meinungsfreiheit und Nutzerrechte durch rechtsstaatliche Verfahren, nicht durch staatliche Inhalts-Kontrolle; die Ablehnung des Gesetzes schwäche nicht Brüssel, sondern die Freiheit der eigenen Bürger. Schluss mit Weihnachts-Kontrast: „Des Geistes des Christkinds sind sie auf jeden Fall nicht."

**v2.1-Summary (neu):**
> Henri Schmidt (CDU/CSU) verteidigt den Digital Services Act gegen die AfD-Forderung nach dessen Abschaffung und argumentiert mit Rechtsstaat-Logik: der DSA stärke Meinungsfreiheit durch rechtsstaatliche Verfahren (begründete Löschungen, Widerspruchsrechte), nicht durch Verzicht auf Regeln; das Internet sei kein rechtsfreier Raum, Gesetze gälten dort wie überall. Seine zentrale Konfrontations-Pointe: die AfD inszeniere sich als Law-and-Order-Partei, „ruder[e] aber zurück", wenn es um konkreten Rechtsdurchsetzung gehe — wer den DSA abschaffe, schwäche nicht Brüssel, sondern die Freiheit der Bürger. Schlusswitz: Des Christkinds Geist seien solche Positionen auf jeden Fall nicht.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…en Widerspruchsrechte, und willkürliche Entscheidungen von Plattformbetreibern werden begrenzt. Noch nie hatten Bürgerinnen und Bürger im digitalen Raum so viel Rechtsschutz wie heute.
Die AfD inszeniert sich im Deutschen Bundestag sehr gerne als Law-and-Order-Partei. Doch immer, wenn es konkret wird und um Rechtsdurchsetzung geht, dann zeigt sich leider ein anderes Bild.
Wenn es nämlich wie hier um den Schutz von Bürgerinnen und Bürgern geht, um den Schutz von Kindern, um den Schutz unserer Demokratie, dann rudern Sie zurück.
Sie wollen ausgerechnet das Gesetz beseitigen, das effektiv vor Bed…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 69. Martin Hess (AfD) — ID215213100

- **v1-flagged Wort:** `denunziert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Martin Hess (AfD) attackiert die Regierungsverantwortlichen für Versagen in der Krisenbewältigung nach Terroranschlägen auf Berlins kritische Infrastruktur: Der CDU-Bürgermeister habe sich nach vier Stunden Pausiert und der Bundeskanzler erst nach fünf Tagen gemeldet, was er als unwürdiges Krisenmanagement denunziert. Er fordert konsequenten KRITIS-Schutz, Bekämpfung des Linksextremismus in gleichem Maße wie des Rechtsextremismus, und rahmte seine Position im Wahlaufruf: „Und genau dafür steht heute nur noch eine Partei — und das ist die AfD" — typische Polemik-Klassifikation mit persönlichen Vorwürfen und Partei-Zustimmungsappell.

**v2.1-Summary (neu):**
> Martin Hess (AfD) nutzt eine Krisensituation in Berlin zur Anklage der Regierungs-Koalition: Der CDU-Bürgermeister sei nach vier Stunden Kriseneinsatz eine Pause schuldig — „ein Schlag ins Gesicht" Berlins; der Kanzler habe sich erst nach fünf Tagen gemeldet und könne nicht zwischen Krisenmanagement und Tennis unterscheiden. Hess fordert Verbesserungen beim KRITIS-Schutz, Bekämpfung des Linksextremismus mit gleicher Intensität wie des Rechtsextremismus, und endet mit direktem Wahlaufruf: nur die AfD stehe für echte Führung — die Anklage wird mehrfach durch Ordnungsrufe des Präsidiums unterbrochen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…on zu Hause aus abarbeitet und nach der man dann zum Sport übergeht. Im Gegenteil: Es verlangt klare Kommunikation und vor allem unbedingte Präsenz vor Ort. Das Verhalten des CDU-Bürgermeisters ist ein Schlag ins Gesicht aller Berlinerinnen und Berliner, die in diesen Stunden Führung erwartet haben. Und ich sage Ihnen eines noch ganz direkt: Wer nach vier Stunden Krisenmanagement schon eine Pause braucht, um den Kopf freizukriegen, der hat in einer politischen Führungsposition nichts, aber auch gar nichts zu suchen.
Auch der Bundeskanzler hat in der Krise unserer Hauptstadt versagt. Er hat sic…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 70. Alexander Arpaschi (AfD) — ID215303900

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Alexander Arpaschi (AfD) verdammt den Entlastungsbericht der Bundesregierung (DS 21/2730) als „Armutszeugnis" und „Bankrotterklärung" mit sarkastisch-kalkulierter Kritik: Die größte Einsparung (2,541 Mrd Euro) stamme aus dem unrealistischen Bauturbo; die übrigen Maßnahmen seien „Placebos, Seifenblasen" mit absurd kleinen Pro-Kopf/Pro-Unternehmen-Entlastungen (16 Cent für Geothermie, 1,65 Euro pro Firma für Schwarzarbeit). Im Teil II werfe die Regierung mit 51 Maßnahmen um sich, ohne zu wissen, was sie brächten — ein Vorwurf an Bauministerin Hubertz und Wildberger, die „keine Ahnung" hätten; konkrete Fallbeispiele (Klinikum Mittelbaden: 22 Mio Defizit 2026) zeigen die Realität der Kommunalen. Schluss: Nur die AfD könne echten Bürokratieabbau bringen — direkter Wahlaufruf und Kampfrede gegen Merz-Koalition.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
… nichts?
Das Krankenhausreformanpassungsgesetz soll 3 Millionen Euro an Entlastungen bringen. Das Statistische Bundesamt nennt die Zahl von 1 841 Krankenhäusern in Deutschland. Jedes wird also um durchschnittlich 1 630 Euro entlastet; Sie merken, die Zahlen werden größer. Also werde ich diese 1 630 Euro pro Krankenhaus einmal einordnen. Das Klinikum Mittelbaden – Anteilseigner sind der Landkreis Rastatt und der Stadtkreis Baden-Baden – wird aufgrund der völlig verkorksten Gesundheitspolitik dieser Regierung und ihrer Ampelvorgänger in 2026 ein Defizit von 22 Millionen Euro erwirtschaften, zu t…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 71. Ruben Rupp (AfD) — ID215304800

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Ruben Rupp (AfD) attackiert die TTPA und das geplante nationale Transparenzgesetz als gezielt gegen Opposition gerichtete Zensur-Instrumente: Die Verordnung habe seit Oktober 2025 politische Bezahlwerbung auf Meta und Google faktisch unmöglich gemacht, während etablierte Medien und Regierungsparteien profitieren — ein 'Angriff auf die Opposition unter dem Vorwand angeblicher Transparenz'. Konkret fordert er den Rückzug des Kabinettsentwurfs (der Hausdurchsuchungen und Beschlagnahmungen ohne richterliche Anordnung ermöglicht) und die Stärkung des BND statt EU-Verordnungen; zugleich wirft er der CDU Doppelmoral vor: hätte ein AfD-Ministerpräsident wie Günther ähnliches gesagt, würde sofort ein Parteiverbotsverfahren folgen. Seine Selbstpositionierung: 'Die AfD bleibt Anwalt für die Freiheit'.

**v2.1-Summary (neu):**
> Ruben Rupp (AfD) attackiert die EU-Verordnung TTPA und das deutsche Kabinettsentwurfgesetz als Zensur-Instrumente gegen Opposition und Pressefreiheit: Die TTPA führe de facto zum Rückzug aller großen Plattformen von politischer Bezahlwerbung (seit Oktober 2025), was nur neue Parteien, oppositionelle Kräfte und besonders die AfD schade (nicht den Regierungsparteien und etablierten Medienhäusern); der nationale Kabinettsentwurf (§ 6, § 7) ermögliche Hausdurchsuchungen gegen Parteien/Kandidaten/Vereine wegen Transparenzverstößen, teilweise sogar ohne richterlichen Beschluss bei „Gefahr im Verzug" — das sei ein Einschüchterungseffekt gegen regierungskritische Aktivitäten. Er fordert Aufhebung der TTPA und Rücknahme des Kabinettsentwurfs; statt „Transparenz-Theater" solle der Bundesnachrichtendienst gegen ausländische Einflussnahme gestärkt werden. Polemische Rahmung: Günther habe sich wie ein Autokrat verhalten, und die Union beklatscht das, während Ähnliches von der AfD zu Parteiverbots-Forderungen führte — „Weg mit dieser undemokratischen Mistverordnung".

**Original-Auszug (Mitte, ~600 chars):**
```
…, nicht den etablierten Medienhäusern,
nicht ARD und ZDF. Geschädigt werden neue Parteien, oppositionelle Kräfte, kritische Vereine, Kandidaten und Thinktanks. Und ja, ganz besonders die stärkste Partei Deutschlands, die AfD, wird geschädigt.
Denn wir sind auf digitale Reichweite angewiesen, weil wir keine wohlwollende Dauerberichterstattung durch große Verlagshäuser oder durch die öffentlich-rechtlichen Medien genießen, wie Sie hier alle.
Was hier also tatsächlich passiert, ist die gezielte Ausschaltung politischer Wettbewerber unter dem Vorwand angeblicher Transparenz. Ich sage: Weg mit dies…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 72. Julian Schmidt (AfD) — ID215311000

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Julian Schmidt (AfD) diagnostiziert die deutsche Landwirtschaft als Opfer eines Handelsmonopols: vier große Konzerne diktieren Preise und Bedingungen, während Bauern zu höheren Standards gezwungen und gleichzeitig Billigimporte aus Südamerika (Mercosur) zugelassen werden — ein „Frontalangriff" und „scheinheilig". Seine vier Kernforderungen sind gesetzliche Handelspraktiken-Standards, Vorgehen gegen Preisdumping, Entlastung von Erzeugergemeinschaften und verpflichtende Herkunftskennzeichnung; sein Appell: „Nein zu Mercosur, Ja zur Stärkung der Landwirte", alles andere sei „Heuchelei".

**v2.1-Summary (neu):**
> Julian Schmidt (AfD) kritisiert die Situation der deutschen Landwirte als wirtschaftliche Krise durch Marktmacht-Konzentration: Vier Handelskonzerne diktierten Bedingungen und erzeugten Preise unter Produktionskosten; die Union und die Bundesregierung hätten dieses „Machtkartell" über Jahrzehnte geduldet und verschärften die Lage durch das Mercosur-Abkommen, das Billigimporte mit niedrigeren Standards gegen streng regulierte heimische Produktion setze. Seine Forderungen: verbindliche Gesetze gegen unlautere Handelspraktiken, Preisdumping-Verfolgung, Entlastung von Erzeugergemeinschaften, Herkunftskennzeichnung und Mercosur-Ablehnung — alles andere sei „Heuchelei".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…teuern, setzt diese Bundesregierung sogar noch einen drauf. Die Unterstützung des Mercosur-Abkommens in dieser Form ist nichts anderes als ein Frontalangriff auf die heimische Landwirtschaft. Da können Sie hier noch so oft etwas anderes behaupten, sehr geehrte Kollegen der Union.
Während deutsche Bauern zu immer höheren Tierwohl-, Umwelt- und Dokumentationsstandards gezwungen werden, öffnen Sie gleichzeitig die Tore für Billigimporte aus Südamerika, produziert mit Hormonen, Pestiziden und Methoden, die bei uns zu Recht längst verboten sind. Herr Büdenbender, Herr Auernhammer, bei allem Respekt…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 73. Thomas Rachel (CDU/CSU) — ID215607100

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Thomas Rachel (CDU/CSU) wertet für die Koalition das Mercosur-Freihandelsabkommen als zentral für Deutschland: 12.500 deutsche Unternehmen (70% KMU) würden jährlich um 4 Milliarden Euro durch den Wegfall von 90% der Zölle (35% Autos, 20% Maschinen, 18% Chemie) entlastet, und eine 700-Millionen-Menschen-Zone (20% der Weltwirtschaft) entstünde. Er attackiert Grüne, AfD und Linke als blockierendes Bündnis in Brüssel, das nur „Doppelmoral" zeige, und rahmt die sofortige Anwendung als europäische Handlungsfähigkeit gegen China-Dominanz und US-Willkür; die abschließende Devise lautet: „Nicht Blockieren und Verzögern, sondern Handeln — das ist europäische Verantwortung."

**v2.1-Summary (neu):**
> Thomas Rachel (CDU/CSU) wirbt für die sofortige Anwendung des Mercosur-Abkommens: Das Abkommen würde eine Freihandelszone mit 700 Millionen Verbrauchern (20% der Weltwirtschaft) schaffen, 90% der Zölle abbauen und deutsche Unternehmen um 4 Mrd Euro entlasten — entscheidend für KMU in diesen geostrategisch herausfordernden Zeiten. Er kritisiert die Blockade durch Grüne, AfD und Linkspartei als „grüne Doppelmoral in Reinform" und „Schande", da Europa damit gegenüber China (seit 2017 wichtigster Handelspartner Mercosurs) an Einfluss verliere — nur durch regelbasierten Freihandel und Partnerschaft könne Europa Arbeitsplätze sichern und Resilienz stärken.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…en Abgeordneten im Europaparlament im Schulterschluss mit der AfD und den linksextremen Parteien aber das Inkrafttreten des Mercosur-Vertrages. Das ist keine verantwortungsvolle Europapolitik, das ist eine verhängnisvolle Blockade für unser Land und für Europa.
Und dann muss man sich den Zeitpunkt vorstellen! In einer Zeit, wo sich die weltpolitische Lage gerade grundlegend verändert, wäre es doch darauf angekommen, dass die Handlungsfähigkeit Europas bewiesen wird. Diese haben Sie aber blockiert. AfD, Grüne und Linkspartei schaden der Wirtschaft, den Betrieben und den Arbeitsplätzen in Deutsc…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 74. Kay Gottschalk (AfD) — ID215613900

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Kay Gottschalk (AfD) lehnt den Grünen-Antrag zu Geldwäschebekämpfung ab und attackiert die bisherige Koalitionspolitik sowie die Union mit dem Vorwurf der politischen Heuchelei: Statt neuer Behörden und Quoten solle Deutschland eine militärisch organisierte Finanzpolizei nach italienischem Vorbild (Guardia di Finanza) aufbauen, die Finanzämter von Routineaufgaben entlasten und die Flat-Tax-Reform '25 Prozent auf alles' einführen, um Steuerhinterziehung unattraktiv zu machen. Konkret prangert er an, dass bei Cum-Ex nur 3 von 10 Mrd Euro zurückgeholt, bei Cum-Cum nur 1 Prozent von 28 Mrd Euro und bei Umsatzsteuerkartellen Personalrotation und Justizverfolgung scheitern — dabei hätte die AfD seit Jahren Verbesserungsvorschläge vorgebracht, während alle anderen Parteien säumig blieben; Schluss ist ein direkter Wahlaufruf: 'Die AfD wird spätestens 2029 mit dem Aufräumen beginnen'.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…owie Schmuggel, Geldwäsche und organisiertes Verbrechen. Und eine Ausschussreise dorthin hat gezeigt: Da sind die Italiener uns Jahre, Lichtjahre voraus. Orientieren Sie sich da an den Besten.
Zweitens: eine Entlastung der Finanzämter von Routineaufgaben. Dieser Vorschlag kam sogar von Kollegen der Deutschen Steuergewerkschaft. Weg von der 08/15-Veranlagungsprüfung, hin zu einer risikoorientierten Außenprüfung und Steuerfahndung. Das könnten wir hinbekommen, und zwar mit einem Vorschlag von uns, nämlich das Steuersystem mit der AfD-Steuerreform 25 endlich zu revolutionieren. 25 Prozent auf all…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 75. Dr. Konrad Körner (CDU/CSU) — ID215909100

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Konrad Körner (CDU/CSU) lehnt den Linke-Antrag zu Lehrkräfte-Neutralität ab, da der Bund für Bildungspolitik nicht zuständig ist und notwendige Materialien (Bundeszentrale für politische Bildung, Kultusministerien-Handreichungen, Gewerkschafts-Orientierung) bereits existieren — er nennt exemplarisch Sachsens Handreichung zur Schulneutralität und Bayerns Verfassungsviertelstunde. Körner wirft der Linken Heuchelei vor: Sie fordere Neutralität, sabotiere aber Bundeswehr-Schulbesuche und stachele zu Schulstreiken gegen den neuen Wehrdienst auf; zugleich kritisiert er sarkastisch die AfD-Position zur NS-Zeit (Björn Höckes angebliche Ablehnung von NS-Unterricht als „Schande") und warnt vor Bundeseinmischung in Länder-Bildung.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…s. Da muss man schon aufpassen.
Aber nun zu den Forderungen, die in dem Antrag gestellt werden: Werbekampagnen, Lehrerbildung, Social-Media-Kampagnen. Das hört sich ja immer alles gut an. Auch wenn man bei der Linkspartei natürlich so ein bisschen das Gefühl hat, dass es am Ende gar nicht so sehr um die Neutralität geht oder um die politische Bildung, sondern eher um die Bildung in die eigene Richtung.
Darum geht es, um ehrlich zu sein, bei dem Antrag gar nicht. Denn für fast alle Ihre Forderungen ist der Bund gar nicht zuständig. Ich hätte mir gewünscht, dass Sie zu diesem Thema vielleicht au…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 76. Ulrich von Zons (AfD) — ID215913200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Ulrich von Zons (AfD) lehnt den Gesetzentwurf zur EU-Richtlinie 2024/1069 kategorisch ab und attackiert ihn als polemische 'Heuchelei': Die SPD beschwöre Pressefreiheit auf dem Papier, setze aber den Presslufthammer gegen Redaktionen ein (Compact-Magazin-Verbot), während Die Linke einen 'Bauplan für politisch gelenkte Justiz' mit NGO-Sonderrechten vorlege — das sei 'kodifizierter Klassenkampf im Zivilrecht', nicht echter Minderheitenschutz. Sein Rahmen: Deutschland habe kein echtes Problem mit missbräuchlichen Klagen, aber 'Brüssel pfeift und Berlin springt' — die AfD hingegen stehe ohne Wenn und Aber zur universellen Meinungsfreiheit, ohne Selektivität, und gehe diesen 'Irrweg' nicht mit.

**v2.1-Summary (neu):**
> Ulrich von Zons (AfD) lehnt den Regierungs-Gesetzentwurf zur Umsetzung der EU-Richtlinie 2024/1069 ab und attackiert Bundesregierung und Linke als heuchlerisch: Während die SPD Pressefreiheit beschwöre, habe sie beim Compact-Verbot »mit dem Presslufthammer vor der Redaktionstür« gestanden; der Linke-Antrag mit Sonderrechten für NGOs sei »kodifizierter Klassenkampf«. Seine Kernkritik: Das Gesetz löse kein reales Problem (missbräuchliche Klagen seien in Deutschland »so gut wie unbekannt«), offenbare aber die Abhängigkeit Berlins von Brüsseler Direktiven — »alles nur, weil Brüssel pfeift und Berlin springt«. Sein Verständnis von Pressefreiheit gelte für alle ohne Ausnahmeregelungen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
… besonders unglaubwürdig beim Fall des Magazins „Compact“. Dort wurde selbst zugelangt: Hausdurchsuchungen durchgewunken, ein Magazin verboten und dann vor Gericht Schiffbruch erlitten. – Und jetzt wollen Sie plötzlich Journalisten schützen. Deutlicher kann politische Heuchelei kaum werden. Die SPD gibt sich als Hüterin der Pressefreiheit und steht gleichzeitig mit dem Presslufthammer vor der Redaktionstür.
Und Die Linke setzt noch einen drauf! Ihr Antrag liest sich wie ein Bauplan für politisch gelenkte Justiz: mehr Gebühren, Sonderrechte für NGOs und Verbände. Und Klagen sollen sogar dann mi…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 77. Cansu Özdemir (Die Linke) — ID215915500

- **v1-flagged Wort:** `diffamiere`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Cansu Özdemir (Die Linke) würdigt den iranischen Widerstand gegen die Revolutionsgarden (Terrororganisation: Tausende Tote, Zehntausende Inhaftierte, systematische Folter) und fordert von der Bundesregierung ein nationales Betätigungsverbot sowie Schutz für Exiloppositionelle in Deutschland. Sie attackiert die AfD als Heuchlerin: obwohl sie sich als Freiheitskämpferin darstelle, teile sie mit den Revolutionsgarden „extrem hässliche Gemeinsamkeiten" (Autoritarismus, Menschenrechtsverachtung, Feindbilder), diffamiere Exiliraner und fordere deren Abschiebung in „den sicheren Tod" — daher fordert Özdemir auch ein Verbot der AfD in Deutschland.

**v2.1-Summary (neu):**
> Cansu Özdemir (Die Linke) befürwortet die Listung der Revolutionsgarden als Terrororganisation und fordert ein nationales deutsches Betätigungsverbot sowie Schutz für Exiloppositionelle vor Bedrohung und Ausspionage. Sie stellt eine direkte Gegenüberstellung zwischen den Revolutionsgarden und der AfD her — beide verknüpft durch „autoritäres Denken, antidemokratische Bestrebungen, Verachtung von Menschenrechten und Frauenrechten" — und kritisiert die AfD dafür, dass sie (trotz eines Antrags gegen die Revolutionsgarden) selbst iranische Geflüchtete „zum Sicherheitsrisiko erklärt" und deren Abschiebung fordert. Ihr Fazit: ein Verbot sowohl der Revolutionsgarden als auch der AfD in Deutschland.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "rechtsextrem"   ],   "begruendung_falls_unsicher": "Das Wort 'rechtsextrem' wird vom Sprecher selbst genutzt ('rechtsextremen AfD'), aber es ist eine politische Klassifikation, keine wörtliche Charakterisierung aus dem Sprecher-Text — gehört technisch zur Gesamtthese, nicht zu wörtlicher Stilistik. Im Kontext aber sachlich begründet durch die angeführten Parallelen (Autorita­rismus, Antidemokratie, Menschenrechtsverachtung). Konfidenz auf 'mittel' gesetzt, weil die Summary diese Klassifikation vom Sprecher übernimmt — das ist akkurat, aber könnte als 'wir als Summary-Verfasser stigmatisieren die AfD' missverstanden werden, obwohl der Sprecher das selbst tut." }

**Original-Auszug (Mitte, ~600 chars):**
```
…tigungsverbot nicht weiter verschleppen. Meine Damen und Herren, handeln Sie endlich, und schützen Sie die Exiloppositionellen hier bei uns in Deutschland!
Aber jetzt zur rechtsextremen AfD. Sie geben sich ja hier als Gegner der Revolutionsgarden, als Kämpfer für Freiheit. Doch wer hinschaut, erkennt ganz schnell: Zwischen der AfD und den Revolutionsgarden gibt es extrem hässliche Gemeinsamkeiten: autoritäres Denken, antidemokratische Bestrebungen, Verachtung von Menschenrechten und von Frauenrechten, Feindbilder statt Freiheit.
Während Exiloppositionelle in Deutschland bedroht, ausspioniert u…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 78. Dr. Rainer Kraft (AfD) — ID216002900

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Rainer Kraft (AfD) nutzt eine Zwischenfrage als polemischen Konter-Angriff gegen einen Vorredner (offenbar Stegner, SPD), der Russlandkontakte kritisiert hat. Mit sarkastisch-vorwurfsvoll Ton behauptet Kraft, der Kritiker selbst hätte „subversiv bzw. geheim" mit FSB-Leuten in Baku getroffen und wirft ihm damit Heuchelei vor — ein klassisches AfD-Whataboutismus-Manöver, das den Frame der Stasi-/Sicherheitsheuchelei aktiviert.

**v2.1-Summary (neu):**
> Dr. Rainer Kraft (AfD) wirft dem SPD-Politiker Stegner in einer Zwischenfrage Heuchelei vor: während Stegner Russlandkontakte anderer „so maßgeblich kritisiert" habe, wolle die AfD wissen, „was Sie mit den FSB-Leuten in Baku besprochen haben, als Sie sich mit ihnen dort subversiv bzw. geheim getroffen haben." Die Gegenfrage rahmt Stegners Position als doppelmoralisch ein — Kritik an Russland-Kontakten bei gleichzeitigen eigenen geheimen Treffen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
Vielen Dank, Herr Stegner, dass Sie die Zwischenfrage zulassen. Auch vielen Dank dem Präsidium. – Nachdem Sie ja die Russlandkontakte so maßgeblich kritisiert haben, können Sie uns hier vielleicht erläutern, was Sie mit den FSB-Leuten in Baku besprochen haben, als Sie sich mit ihnen dort subversiv bzw. geheim getroffen haben. Das würde, glaube ich, uns alle in Deutschland sehr stark interessieren, da Sie ja diese Kontakte so stark kritisiert haben.
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 79. Dr. Lina Seitzl (SPD) — ID216006200

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Lina Seitzl (SPD) begrüßt die grüne Initiative zur Versorgung bei Schwangerschaftsabbrüchen und fordert klare Bundesregelungen (Ausbildungsverpflichtung, Klarheit zum Gewissensrecht von Einzelnen vs. Trägerentscheidungen), attackiert aber die Grünen für Heuchelei: In Baden-Württemberg, wo sie den Gesundheitsminister stellen, sind 20 Prozent der Landkreise nicht versorgt — „Minister Lucha versagt auf ganzer Linie". Sie insistiert auf föderaler Verantwortungsverteilung: Der Bund kann Standards setzen, aber Länder müssen ihren Versorgungsauftrag erfüllen; Föderalismus bedeute nicht, dass der Bund Landeslücken ausgleicht.

**v2.1-Summary (neu):**
> Dr. Lina Seitzl (SPD) würdigt den Grünen-Antrag zur Verbesserung der Schwangerschaftsabbruch-Versorgung, teilt aber die SPD-Position, dass dieser zu Recht eine Bundesebenen-Lösung fordert, wo Regelungsbedarf besteht (Rechtssicherheit für Ärzte gegen pauschale Klinikleitungs-Weigerungen, Verankerung in Ausbildung), ABER kritisiert konfrontativ: Baden-Württemberg mit grünem Minister Lucha „versagt auf ganzer Linie" — 20 Prozent der Landkreise erfüllen Erreichbarkeitsvorgaben nicht — und solle zuerst seine Länderverantwortung gemäß Schwangerschaftskonfliktgesetz erfüllen, statt der Bund deren Versäumnisse ausbügelt. Ihr Frame: föderale Verantwortung bedeutet, jede Ebene muss ihren Auftrag ernst nehmen; gleichzeitig klar: Zugang darf nicht von Wohnort, Träger oder Geldbeutel abhängen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
… durchzuführen,
während sie gleichzeitig öffentliche Mittel erhalten. Die Gewissensfreiheit ist ein individuelles Recht. Sie schützt die einzelne Ärztin, den einzelnen Arzt. Sie schützt nicht die unternehmerische Entscheidung eines Trägers, ganze Versorgungsbereiche auszuschließen.
Hier brauchen wir eine klare Anpassung des Schwangerschaftskonfliktgesetzes, um Rechtssicherheit für die behandelnden Ärztinnen und Ärzte zu schaffen und um ihnen die Möglichkeit zu geben, sich gegen einzelne Klinikleitungen zur Wehr zu setzen.
Wer einen öffentlichen Versorgungsauftrag übernimmt, muss ihn vollständi…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 80. Donata Vogtschmidt (Die Linke) — ID216115000

- **v1-flagged Wort:** `Diffamierungen`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Donata Vogtschmidt (Die Linke) begrüßt die Modernisierung des Produkthaftungsrechts als Stärkung von Bürgerrechten gegenüber KI-Anbietern (z.B. Haftung für fehlerhafte intelligente Geräte, Marketplace-Plattformen wie Amazon/Temu/Shein), warnt aber vor Euphorie: Das Gesetz sei nur ein „Update, kein Neustart" und lasse tiefe Regelungslücken offen (KI-generierte Diffamierungen, Deepfakes, Fake News, Diskriminierungsinhalte, Urheberrechts-Verletzungen). Sie attestiert der EU einen Kniefall vor Trump und Big-Tech-Oligarchen, nachdem die EU-Kommission am 11. Februar 2025 überraschend eine KI-Haftungsrichtlinie von der Agenda strich — unmittelbar nach J.D. Vances Warnung in Paris vor zu großer Verantwortung für US-Konzerne — und fordert die Bundesregierung auf, in der EU endlich „Rückgrat gegen Eigeninteressen von Big Tech zu zeigen".

**v2.1-Summary (neu):**
> Donata Vogtschmidt (Die Linke) begrüßt den Gesetzentwurf zur Modernisierung des Produkthaftungsrechts als Stärkung der Menschenrechte gegenüber KI-Anbietern — konkret die Haftung des Herstellers bei Fehlfunktionen intelligenter Geräte und die Ausweitung auf Online-Marktplätze wie Amazon, Temu, Shein. Sie warnt aber vor verbleibenden 'Schlupflöchern': Das Gesetz sei ein 'Update, kein Neustart' und regele nicht KI-Haftung bei Persönlichkeitsrechts-Verletzungen, Fake News, digitaler Gewalt oder Diskriminierung. Sie kritisiert scharf, dass die EU-Kommission am 11. Februar 2025 überraschend eine geplante KI-Haftungsrichtlinie von der Agenda strich — und vermutet einen 'Kniefall der EU vor Trump und den Big-Tech-Oligarchen' (mit Verweis auf J.D. Vance' Warnung in Paris). Sie fordert die Bundesregierung auf, in der EU 'Rückgrat gegen Big Tech' zu zeigen; präventiv zitiert sie den CDU-Politiker Axel Voss, der die Streichung ebenfalls kritisierte.

**Original-Auszug (Mitte, ~600 chars):**
```
… auch billige Schlupflöcher bestehen. Zudem betrifft die Modernisierung weder bestehende Machtverhältnisse noch die Logik des kapitalistischen Systems und auch nicht die Eigentumsstruktur, sondern vor allem die Verwaltung des digitalen Kapitalismus.
So bleibt auch haftungsrechtlich vieles offen. Verbreitet beispielsweise eine KI über Personen rufschädigende Aussagen, die von der KI halluziniert oder auch gezielt erfunden wurden, gibt die EU weiterhin keine Handhabe dagegen, ebenso wenig, wenn KI offensichtlich Fake News generiert, digitale Gewalt ausübt, diskriminierende Inhalte zur Schädigung…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 81. Christian Zaum (AfD) — ID216211900

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Christian Zaum (AfD) verteidigt den Einsatz von Jugendoffizieren an Schulen anhand persönlicher Anekdoten aus seinem Gymnasium (POL&IS-Planspiel, Panzergrenadierbataillon-Besuch) und argumentiert, Jugendoffiziere seien legitime außerschulische Akteure, die informieren statt indoktrinieren — im Rahmen des Beutelsbacher Konsens und der verfassungsmäßigen Ordnung. Er rahmt die Linken-Opposition als SED-artige Angst vor Pluralismus und kontert die Sexualberater-Doppelmoral ('Holzpenisse und Kondomen'), während er für die Ausweitung von Jugendoffizier-Planstellen auch an Universitäten wirbt und mit Wahlaufruf-Anspielung schließt ('Deutschlands Jugend wird schlauer nur mit der AfD').

**v2.1-Summary (neu):**
> Christian Zaum (AfD) verteidigt den Zugang von Jugendoffizieren zu Schulen und fordert dessen Ausweitung: Jugendoffiziere seien Vertreter eines Verfassungsorgans, informierten ohne Indoktrinierung, und als solche im Pluralismus-Sinne des Beutelsbacher Konsens unproblematisch — im Gegensatz zu außerschulischen Akteuren mit ideologischen Agenden. Er kritisiert die Linke scharf: Sie wollen ‚nur Ihre antifaschistischen Parolen' verbreitet sehen, während ‚ein ordentlicher Mann in Uniform' ausgegrenzt werde; dies sei Angst vor echter Meinungsvielfalt, nicht Schutz vor Militarisierung. Sein Schluss kombiniert sachliche Argumentation (‚bekommen Sie mit Sicherheit keine friedlichere Welt') mit polemischem Wahlaufruf.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "ideologischen Agenden" — könnte als wertend wahrgenommen werden, der Sprecher nutzt aber äquivalente Kritik („antifaschistische Parolen", „Indoktrinierung" von der anderen Seite), sodass die Symmetrisierung berechtigt ist; alternativ: „außerschulischen Akteuren mit dezidierter weltanschaulicher Ausrichtung"   ],   "begruendung_falls_unsicher": "Die Rede ist selbst durchgehend polemisch und kontrastierend; neutrale Wiedergabe ohne Polemik würde die Tonalität verfälschen. ‚ideologischen Agenden' ist das mildeste Wort für das, was Zaum kritisiert (‚Parolen', ‚Antifa-Button'); die Konfidenz ist ‚mittel', weil das Wort selbst evaluativ ist, aber es entspricht dem Redner-Framing." }

**Original-Auszug (Mitte, ~600 chars):**
```
…os. Sie informieren, sie indoktrinieren nicht, und auch wir von der Alternative für Deutschland wünschen uns natürlich keine durchmilitarisierte Gesellschaft wie im „Hauptmann von Köpenick“.
Offiziere vertreten ein Verfassungsorgan. Schulen sind auch Teil der verfassungsmäßigen Ordnung. Insofern ist der Zugang von Offizieren zu Schulen aus unserer Sicht völlig unproblematisch. Und auch aus Ihrer Sicht ist das ja oft so: Wenn außerschulische Akteure in die Schulen kommen, die Sexualberater/-innen von der Diakonie, mit Holzpenissen und Kondomen bewaffnet, dann ist das für Sie überhaupt kein Prob…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 82. Sepp Müller (CDU/CSU) — ID216302600

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Sepp Müller (CDU/CSU) konfrontiert Christian Görke (Linke) in einer Debatte über Vermögensteuer-Positionen mit dessen SED-Vergangenheit und seiner Rolle als Finanzminister Brandenburgs, der von der 1,2-Milliarden-Euro-Restitution des SED-Vermögens profitierte. Er unterstellt Heuchelei: Görke wirft der Union vor, nicht zur Vermögensteuer zu stehen, während Das SED-Vermögen selbst — mindestens in gleicher Höhe — im Ausland „unterwegs" sei; Müller fordert abschließend, dass Die Linke als SED-Nachfolger dieses verschwundene Vermögen zurückführen müsse — eine rhetorische Provokation am Rande der Anschuldigung.

**v2.1-Summary (neu):**
> Sepp Müller (CDU/CSU) führt in einer Direktfrage an Christian Görke (Die Linke) eine Konfrontation über das SED-Vermögen: während Brandenburg 1,2 Mrd Euro zurückerhielt (das Görke als Finanzminister nutzte), seien mindestens gleich hohe Beträge des SED-Vermögens im Ausland ungeklärt. Müller rahmt Die Linke als SED-Nachfolger und fordert rhetorisch ein, wann die Partei „sich endlich ehrlich machen" und das Vermögen „an das deutsche Volk zurückführen" wird — ein klassischer Konfrontations-Angriff mit historischen Belegen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…en Finanzminister im Land Brandenburg. Herr Görke, ich habe eine Frage. Sie werfen der Union vor, nicht zur Vermögensteuer zu stehen. Als Finanzminister des Landes Brandenburg haben Sie davon profitiert, dass 1,2 Milliarden Euro des SED-Vermögens zurückgeführt wurden. Wir wissen aber, dass das SED-Vermögen in mindestens gleicher Höhe im Ausland unterwegs ist
und Herr Bartsch, der das damals hier verteilt hat,
weiterhin dem Deutschen Bundestag angehört. Wo ist dieses Geld? Wann bekommt Deutschland, Ostdeutschland, dieses Geld wieder zurück,
und wann wird Die Linke als Nachfolger der SED sich en…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 83. Lars Haise (AfD) — ID216306600

- **v1-flagged Wort:** `verdammt`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lars Haise (AfD) verdammt Stuttgart 21 als „politisches Denkmal des systematischen, jahrelangen, gewollten Wegsehens" der etablierten Parteien und prangert die Kostenexplosion von 2,4 auf 11,5 Milliarden Euro, die Reduktion von 16 auf 8 Gleise (technisch unmöglich ohne ETCS-System) und die unbewiesene Behauptung der Regierung an, es sei ein eigenwirtschaftliches Projekt. Mit scharfer Konfrontations-Rhetorik kritisiert er die Union für das brutale Vorgehen gegen friedliche Demonstranten 2010 („Wasserwerfer gegen Bürger, Samthandschuhe gegenüber Milliardenverschwendung") und fordert einen Untersuchungsausschuss zur Aufklärung ungeklärter Fragen (Terminkenntnisse Bahnvorstand, Kontrollversagen von Aufsichtsrat/Ministerien, Verbleib der 459 Millionen Euro aus Gleisflächenverkäufen) sowie die Einsetzung von Konsequenzen gegen zukünftige Bauruinen.

**v2.1-Summary (neu):**
> Lars Haise (AfD) bezeichnet Stuttgart 21 als 'politisches Denkmal des systematischen, jahrelangen, gewollten Wegsehens' und fordert einen Untersuchungsausschuss zur Aufklärung der Kostenexplosion (2,4 auf 11,5 Mrd Euro), der Verantwortung von Bahnvorstand, Aufsichtsrat und Ministerien sowie des Verbleibs von 459 Mio Euro aus Gleisflächenverkäufen. Er attackiert die Union heftig für das Vorgehen gegen Demonstranten 2010 ('Wasserwerfer gegen Bürger, Schlagstöcke gegen Protest, aber Samthandschuhe gegenüber Milliardenverschwendung') und richtet einen Appell an Linke und Grüne, als Opposition gemeinsam Konsequenzen zu fordern.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…t Mathematik auf Lehramt studiert haben wie Boris Palmer, um zu erkennen, dass eine Reduktion von 16 auf 8 Gleise zu Kapazitätsengpässen führt. Man hat ein Nadelöhr geplant, jetzt wundert man sich über den drohenden Kollaps.
Doch der eigentliche Skandal ist der Umgang mit Kritik. Wer 2010 in Stuttgart auf die Straße ging und Zweifel anmeldete, wurde nicht gehört, sondern von der Staatsgewalt brutal von der Straße geknüppelt.
Im Jahr 2010 sind Sie, liebe Union, gegen friedliche Demonstranten dieses Projekts härter vorgegangen, als Sie je gegen illegale Einwanderer an unseren Grenzen vorgehen we…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 84. Jens Spahn (CDU/CSU) — ID216400500

- **v1-flagged Wort:** `diffamiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Jens Spahn (CDU/CSU) verteidigt die Regierungsbilanz und verankert sie in zwei Schwerpunkten: Außenpolitik und Wirtschaftsreformen. Beim Iran betont er, dass enge Bündnispartnerschaft nicht „blinde Gefolgschaft" bedeutet und das Regime aus dem Krieg „deutlich geschwächt" hervorgehen muss; parallel fordert er europäische Reformagenda (Energieunion 2030, Binnenmarkt-Vollendung, Bürokratie-Notbremse, Handelsabkommen) und scharfe Strukturreformen in Deutschland, um das Triple-A-Rating und die wirtschaftliche Führungsposition zu bewahren. Den Kern der Rede bildet aber eine konfrontativ-aggressive Doppel-Attacke: Die AfD wird als „Putin-Partei" und Unterstützer des „Terrorregimes" Teheran diffamiert mit konkreten Vorwürfen von Parteien-Selbstbedienung („zwei Schwestern beschäftigen, Vater einstellen") und „Betrug am Steuerzahler"; Die Linke wird für Antisemitismus und Israel-Delegitimierung als „Hama-Sympathisanten" attackiert — beide Extreme „waten gemeinsam im Morast des Antisemitismus".

**v2.1-Summary (neu):**
> Jens Spahn (CDU/CSU) würdigt die Außenpolitik des Bundeskanzlers als Erfolgsmodell (Diplomatie mit USA, China, europäischen Führungen) und begründet im Iran-Konflikt die Balance: Keine 'blinde Gefolgschaft' gegenüber USA/Israel, aber klare Forderung nach Schwächung des Mullah-Regimes als Kriegsziel. Im Zentrum steht ein europäisches Reformpaket (Binnenmarkt, Energieunion, Kapitalmarktunion, Bürokratieabbau, flexiblere EU-Entscheidungsfindung gegen das Ungarn-Modell) sowie eine deutsche Aufholagenda gegen den wirtschaftlichen Rückstand (USA 50× stärker gewachsen). Spahn attackiert die AfD mit konkreten Belegen für Nepotismus ('Schwestern', '80-jähriger Vater', 'Halbbruder') und nennt das 'Betrug am Steuerzahler'; außerdem wirft er der AfD 'Putin-Nähe' und Unterstützung 'islamistischer Terroristen in Teheran' vor. Parallel kritisiert er die Linke für Antisemitismus und Hamas-Sympathie in der Partei und erwartet von Heidi Reichinnek klare Positionierung.

**Original-Auszug (Mitte, ~600 chars):**
```
… wir unsere Entscheidungsmechanismen ändern. Wenn einer politisch ausfällt, müssen wir in anderem Format vorangehen können, als Koalition der Willigen,
als ein Europa der Pioniere.
Die USA sind in den letzten sechs Jahren wirtschaftlich 50-mal so stark gewachsen wie Deutschland – 50-mal so stark! Das zeigt: Wir brauchen wirtschaftlich eine echte Aufholagenda. Der Europäische Rat setzt hier die richtigen Prioritäten. Die Vollendung des Binnenmarktes gehört ebenso dazu wie die Energieunion 2030, die lang diskutierte Kapitalmarktunion, eine Notbremse für Bürokratie und der schnelle Abschluss von …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 85. Dr. Paul Schmidt (AfD) — ID216505800

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Paul Schmidt (AfD) wirft der CDU/CSU Wahlkampf-Heuchelei vor: Sie habe in Bayern und Baden-Württemberg gerade noch Kernkraftwerks-Reaktivierung und Small Modular Reactors beworden, ein Jahr zuvor Überprüfung der Abschaltungsbeschlüsse gefordert — jetzt argumentiere sie dagegen. Er belegt die Realisierbarkeit mit China-Vergleich: 4-5 Jahre Bauzeit, 2-2,8 Mrd Euro pro Block, und fragt sarkastisch, wo die CDU/CSU-Position verblieben ist.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dr. Paul Schmidt (AfD) nutzt China-Daten (4-5 Jahre Bauzeit, 2-2,8 Mrd Euro Kosten pro Kernkraftwerksblock) als Beleg für Kernkraft-Machbarkeit und konfrontiert die CDU/CSU direkt: Sie hätten im Wahlkampf Bayern/Baden-Württemberg mit Small Modular Reactors geworben und vor einem Jahr die Überprüfung der Kernkraftwerk-Abschaltung gefordert — warum jetzt Zweifel? Die Rede rahmt sich im Pro-Kernkraft-Frame und beschuldigt die Union der Positionswechsel-Heuchelei durch mehrfache rhetorische Fragen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…nkraftwerksblocks zwischen vier und fünf Jahre
und kostet zwischen 2 und 2,8 Milliarden Euro.
So, jetzt, Frau Aeikens: Ich bin ein wenig verwirrt
– ja, ich erkläre Ihnen auch, warum –, hat doch die CDU/CSU gerade erst Wahlkampf mit den Small Modular Reactors gemacht. In Bayern und in Baden-Württemberg wurde genau das gefordert, und jetzt haben Sie hier lauter Zweifel? Außerdem haben Sie vor der Bundestagswahl vor einem Jahr auch damit Wahlkampf gemacht, dass Sie die Abschaltung der Kernkraftwerksblöcke überprüfen wollen. Jetzt muss ich doch mal fragen – wenn Sie hier so dagegen argumentieren –…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 86. Sonja Lemke (Die Linke) — ID216600500

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Sonja Lemke (Die Linke) kritisiert die KI-Verordnung als unzureichend und wirft der Bundesregierung Doppelmoral vor: sie halte die Hochrisiko-KI-Regulierung auf EU-Ebene auf, während sie ungehindert Systeme wie Palantir einführe — eine „Enteignungsmaschine", die Künstler/-innen, Creator und Data-Labeler/-innen in Kenia ausbeutet, ohne sie zu vergüten oder ihre Privatsphäre zu schützen. Sie fordert echte Transparenz über Algorithmen, Vergütung aller am KI-Training beteiligten Menschen, Verbot von biometrischer Überwachung und persönlichem Daten-Training ohne Einwilligung, sowie ernsthafte Auseinandersetzung mit ökologischen Folgekosten — nicht „blind jedem Hype" nachzulaufen.

**v2.1-Summary (neu):**
> (fehlt)

**Original-Auszug (Mitte, ~600 chars):**
```
…in sehr grundsätzliches Problem. KI-Systeme sind statistische Verfahren. Es ist nicht möglich, zu sagen, was der Grund ist, wieso sie einmal so entscheiden und einmal so. Aber wenn das die Handlungen des Staates leitet, dann geht das gegen unsere Demokratie. Denn wir haben einen Anspruch darauf, dass der Staat uns gegenüber nicht willkürlich handelt. Vor diesen Problemen können wir doch nicht einfach die Augen verschließen. Da müssen wir jetzt wirklich eingreifen!
Transparenz brauchen wir auch, damit endlich sichtbar wird, wie viel Arbeit sich durch KI-Systeme angeeignet wird. Wenn wir über di…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 87. Lorenz Gösta Beutin (Die Linke) — ID216605900

- **v1-flagged Wort:** `diffamieren`
- **v2.1 enthält noch:** `diffamiere`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lorenz Beutin (Die Linke) unterstützt den Grünen-Antrag zu Natur-, Klima- und Zivilgesellschaftsschutz und attackiert die AfD als 'Feinde des Lebens', die gegen Lebensgrundlagen, erneuerbare Energien und demokratische Protestrechte 'Krieg' führe — Demonstrationen seien keine 'Ökoterroristen', sondern Demokratierechte. Parallel wirft er der CDU/CSU vor, Umweltverbände zu diffamieren und mit der AfD gemeinsame Sache zu machen, und kritisiert die geplante Verbandsklagerecht-Einschränkung durch die Bundesregierung als Angriff auf einen 'Grundpfeiler des Rechtsstaates'. Der Schluss ist eine historische Warnung: die 'bürgerliche Mitte' habe 1933 Hitler ermächtigt — CDU/CSU sollten diesen Irrweg nicht wiederholen.

**v2.1-Summary (neu):**
> Lorenz Gösta Beutin (Die Linke) würdigt den Grünen-Antrag zu Klima- und Naturschutz und signalisiert Linke-Unterstützung, beginnt aber dann eine mehrschichtige Konfrontations-Rede: Die AfD führe „Krieg gegen unsere Lebensgrundlagen" und bezeichne Klimaschutz als „woke"; Demonstrationen und ziviler Ungehorsam seien demokratische Rechte, KEINE Ökoterror — „Sie von der AfD sind die Feinde des Lebens hier im Hohen Haus." Die CDU/CSU diffamiere Umweltverbände, fördere rechte Stiftungen mit Steuergeld und koaliere faktisch mit der AfD; sie oppositioniere gegen jeden „sozial gerechten Klimaschutz", obwohl Bürger diesen forderten. Mit schärfster Warnung erinnert Beutin an das Ermächtigungsgesetz vom 24. März 1933 — die „bürgerliche Mitte" habe damals Hitler ermöglicht; zum Abschluss würdigt er das Verbandsklagerecht als „Grundpfeiler unseres Rechtsstaates" und dankt Umweltverbänden für ihre Klagen gegen fossile Lobbys.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…ter, wenn Sie, liebe Kolleginnen und Kollegen der CDU/CSU, klatschen, wenn es darum geht, Umweltverbände zu diffamieren. Auf der einen Seite fördern Sie mit Steuergeld rechte Stiftungen, auf der anderen Seite machen Sie gemeinsame Sache mit der AfD, wenn es darum geht, Demokratierechte in Kommunen einzuschränken. Das geht nicht!
Aber was vor allem nicht geht, ist, wenn Sie hier Opposition machen gegen alles, was nach sozial gerechtem Klimaschutz riecht. Das ist unseres Erachtens falsch, und das hat auch nichts mit bürgerlicher Mitte zu tun, weil die Bürgerinnen und Bürger das fordern würden. D…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 88. Mandy Eißing (Die Linke) — ID216706200

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `skandalisierung`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Mandy Eißing (Die Linke) greift den Bundeskanzler und Ministerin Prien wegen des Umbaus von „Demokratie leben!" an: hunderte Projekte stünden vor dem Aus, engagierte Ehrenamtliche würden eingeschüchtert („Wer klar Haltung zeigt, dem wird die Existenzgrundlage entzogen"), und der Generalverdacht gegen Initiativen wie die „Radikalen Töchter" entspreche exakt dem, was die rechte AfD fordert. Sie kritisiert die Evaluations-Heuchelei: Die Entscheidung sei bereits gefallen, obwohl die Überprüfung noch laufe — eine starke Demokratie sollte Kritik aushalten können.

**v2.1-Summary (neu):**
> Mandy Eißing (Die Linke) attackiert den Bundeskanzler und Ministerin Prien für den geplanten radikalen Umbau von „Demokratie leben!" und kritisiert dies als Umsetzung rechter Forderungen: Hunderte antiextremistische Projekte stünden vor dem Aus, engagierte Menschen würden „leiser" und „vorsichtiger", weil ihnen bei klarer Haltung „die Existenzgrundlage entzogen" werde. Sie verweist auf die Inkonsistenz, dass die Evaluierung des Programms noch laufe, die politische Entscheidung aber bereits gefallen sei, und fragt rhetorisch, ob eine „starke Demokratie die Kritik nicht aushalten" könne — damit einen Generalverdacht gegen zivilgesellschaftliches Engagement anprangernd.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "skandalisierung"   ],   "begruendung_falls_unsicher": "Das Wort 'Skandalisierung' in `rhetorische_mittel` ist eine deskriptive Analyse des Stils, nicht vom Redner selbst genutzt; die Summary selbst nutzt keine unautorisierten wertenden Wörter aus der Tier-A-Liste, aber die polemische Lesart ('brav geliefert', 'Generalverdacht' als Angriff auf die Regierung) wurde vom Redner selbst etabliert und ist korrekt widergegeben." }

**Original-Auszug (Mitte, ~600 chars):**
```
…n!“, dem großen Antiextremismusprogramm. Man bekommt das Gefühl, das Wort „Demokratie“ selbst ist irgendwie schon gefährlich geworden. Ich erlebe tolle, engagierte Menschen, die jetzt leiser werden, vorsichtiger, weil sie spüren: Wer klar Haltung zeigt, dem wird die Existenzgrundlage entzogen. Hunderte Projekte vor dem Aus! Das passiert auf allen Ebenen. Angriffe auf Buchläden, Förderstopp für die „Radikalen Töchter“, Kahlschlag bei „Demokratie leben!“! Was die Rechte seit Jahren fordert, wird hier brav von Ihnen geliefert.
Die angekündigte Überprüfung des Programms läuft ja noch. Trotzdem ist…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 89. Kerstin Przygodda (AfD) — ID216707100

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Kerstin Przygodda (AfD) wendet sich polemisch gegen die Aktuelle Stunde zum Schutz vor Gewalt gegen Frauen und beschuldigt die CDU, durch ihre 'Politik der offenen Grenzen' für den Anstieg dieser Gewalt verantwortlich zu sein — sie kontrastiert scharf die mediale Aufmerksamkeit für den Fall Collien Fernandes (digitale Gewalt) mit dem Schweigen gegenüber über 1 000 Familien, deren Angehörige (Ece, 14; Liana, 16) durch migrantische Gewalttäter ermordet wurden. Als selbst Vergewaltigungs-Opfer spricht sie der Regierung ihre 'tiefe Verachtung' aus, lehnt die geplante Klarnamenpflicht als 'autoritäres Manöver' ab und fordert statt Symbolen die Abschiebung der Täter — die AfD werde sich dem 'links-grünen Männerhass' und der Heuchelei des Establishments nicht anschließen.

**v2.1-Summary (neu):**
> Kerstin Przygodda (AfD) attackiert die CDU/SPD-initiierte Aktuelle Stunde zu Gewalt gegen Frauen als heuchlerisch, weil sie das Framing auf den Fall 'Collien Fernandes' konzentriere, während die Fälle von Opfern wie Ece (14, von Eritreer erstochen) und Liana (16, von Iraker vor Zug gestoßen) ignoriert würden — mit über 1.000 betroffenen Familien. Sie führt die Forderung nach Klarnamenpflicht auf 'Blankenhain Männerhass' und staatliche Zensur-Absichten zurück. Mit Bezug auf ihre eigene Vergewaltigungserfahrung ('im Gegensatz zu Frau Genossin Gebel von den Linken') fordert sie scharf Abschiebung — nicht Hinrichtung — von migrantischen Tätern und beschuldigt CDU/SPD des Bluts dieser Opfer ('An Ihren Händen klebt Blut — das Blut der Frauen, die wegen Ihrer tödlichen Toleranz nicht mehr leben').

**Original-Auszug (Mitte, ~600 chars):**
```
…det werden, dass Frauen eben nicht geschützt werden.
Das ist eine Schande, und Millionen von Bürgern in Deutschland haben genug von Ihrer scheinheiligen Heuchelei.
In der links-grünen Blase gibt es inzwischen kein Halten mehr. Blanker Männerhass; der Ruf nach Folter und Hinrichtung macht sich breit.
Die von den öffentlich-rechtlichen Medien hofierte Influencerin Leonie Löwenherz forderte – ich zitiere –:
„Ich will, dass er“
– Christian Ulmen –
„und alle anderen Täter an ihren großen Zehen auf den Marktplätzen dieser Nation aufgehangen und öffentlich kastriert werden.“
Nein, Frau Löwenherz, wir…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 90. Mathias Weiser (AfD) — ID216801600

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Mathias Weiser (AfD) lehnt das Kraftstoffmaßnahmenpaket ab und attackiert die Koalition scharf: Die Regierung Merz liefere keinen Entlastung sondern „Offenbarungseid" und „Bankrotterklärung" — bei über 1 Billion Euro Steuereinnahmen sei die Ausrede „kein Spielraum" Heuchelei. Sein Programm: Steuersenkungen auf Kraftstoffe, Schluss mit „grün-linker Politik", Kernkraft-Reaktivierung und Kohle-Weiterbetrieb, Import von russischem Erdgas und Erdöl — ein energiepolitisches Gegenprogramm zur Merz-Regierung.

**v2.1-Summary (neu):**
> Mathias Weiser (AfD) attackiert das Kraftstoffmaßnahmenpaket der Merz-Koalition als 'Bankrotterklärung und Offenbarungseid' und nennt die Regierung gescheitert: mit über 1 Billion Euro Steuereinnahmen seien echte Entlastungen möglich ('erfolgreiches Land ruiniert'), doch die CDU/SPD-Maßnahmen böten keine echte Entlastung. Sein Gegenprogramm: Schluss mit 'grün-linker Politik' durch Kernkraft- und Kohlereaktivierung sowie Import russischen Gases und Öls — 'das ist der Weg für die Erholung der deutschen Wirtschaft'. Der Redner wird zweimal vom Präsidium unterbrochen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…eit. Stehen Sie bitte zu dem, was Sie angerichtet haben!
Was Sie heute abliefern, ist keine Entlastung der Bürger,
sondern eine Bankrotterklärung und der Offenbarungseid der Regierung Friedrich Merz. Es ist ein Offenbarungseid, was Sie heute abliefern. Herr Müller, Sie sind das beste Beispiel.
Meine sehr geehrten Damen und Herren, die Energiekrise kann gelöst werden. Dies geht jedoch nur durch eine politische Wende, die Schluss macht mit grün-linker Politik. Eine Politik, die Energie verknappt und die Bürger maximal besteuert, ist gescheitert und muss in Deutschland ein Ende haben.
Deswegen wo…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 91. Christoph Schmid (SPD) — ID216805400

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `skandalisierende`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Christoph Schmid (SPD) wehrt sich gegen den Vorwurf der Oppositions-Skandalisierung beim Wehrbeauftragten-Bericht ab und betont: Beim Digitalisierungsprojekt gebe es zwar Verzögerungen, diese seien aber nicht auf mangelnden Nachdruck des Ministeriums zurückzuführen. Er definiert das Parlament als alleinigen Ort echter politischer Verantwortung für die Bundeswehr und ihre Soldatinnen/Soldaten und appelliert mit Anaphor-Rhetorik an die Koalition, diese Verantwortung „gemeinsam" wahrzunehmen — gegen den Vorwurf, man könne diese Aufgabe an Wehrbeauftragten oder kritische Abgeordnete abgeben.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Christoph Schmid (SPD) verteidigt die Regierungspolitik in der Wehrbeauftragten-Debatte gegen die Opposition: Er wirft der Oppositionspartei vor, den Bericht des Wehrbeauftragten für „skandalisierende Oppositionspolitik" zu missbrauchen, räumt aber ein, dass beim Projekt Digitalisierung Landbasierte Operationen Verzögerungen vorhanden seien — diese lägen aber nicht an fehlendem Ministeriums-Nachdruck, sondern möglicherweise an durchgestochenen Berichten. Er betont, dass der Bundestag als Ort gemeinsamer Verantwortung fungieren müsse — für Sicherheit, Freiheit und Bundeswehr —, und schließt mit einem Appell an die koalitionäre Konzentriertheit: „Werden wir dieser Verantwortung gemeinsam gerecht!"</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…gen und Wochen vernommen, dass man im Ministerium wirklich einen klaren Plan hat,
wie wir unsere Truppe bestmöglich ausstatten können, und dass wir alle gemeinsam daran arbeiten.
Schön, dass Sie mich nicht als selbstbewussten Abgeordneten empfinden. Ich glaube, die Zusammenarbeit war in der letzten Zeit immer sehr gut. Und auch an diesem Projekt arbeiten wir als Regierungskoalition sehr konzentriert mit.
Diese Aufgabe, die richtigen Schlüsse für unsere Arbeit im Parlament zu ziehen, kann uns niemand abnehmen. Das können nicht diejenigen tun, die eine Eingabe an den Wehrbeauftragten schreiben; …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 92. Dr. Thomas Pauls (CDU/CSU) — ID216808000

- **v1-flagged Wort:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Thomas Pauls (CDU/CSU) lehnt die isolierte Abschaffung der Familienversicherung für Ehepartner ab und beharrt darauf, dass die Gesundheitsreform ein ausgewogenes Gesamtpaket sein muss (FinanzKommission zeigt Ergebnisse am Montag), nicht einzelne Einnahme-Maßnahmen. Er wirft der Opposition (Linke, Grüne, SPD) Doppelmoral vor: beim Ehegattensplitting hätten sie kein Problem, Familien zu belasten, doch hier kritisierten sie plötzlich denselben Effekt; gegenüber der AfD wird die Kritik scharf: Sie betreibe mit dieser Aktuellen Stunde nur Polarisierung und Angstmacherei statt produktive Reformvorschläge zu machen.

**v2.1-Summary (neu):**
> Dr. Thomas Pauls (CDU/CSU) interveniert konfrontativ gegen die AfD-Aktuelle Stunde: Die medial kursierend isolierte Idee der Abschaffung der Familienversicherung sei zur Polemik missbraucht; tatsächlich würde ein Gesamtpaket der FinanzKommission Gesundheit (Ergebnisse am Montag) vorliegen, und die eigentliche Systemkrise sei nicht Einnahmen- sondern Ausgabenseite (12 Mrd Euro strukturelles Defizit). Mit konkretem Zahlenbeispiel (Paar 60.000 Euro brutto: 40% Mehrbelastung unter neuer Regelung) wirft er der Linken, Grünen und SPD Doppelstandards vor — sie kritisierten denselben Familiengriff, förderten aber die Ehegattensplitting-Abschaffung mit identischen Effekten. Gegen die AfD wirft er Angstmacherei und fehlende konstruktive Vorschläge vor; ironisch fordert er von ihr Lösungs-Vorschläge ohne die Wörter „Asylsuchende", „Zuwanderung" und „Bürgergeldempfänger".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…versicherung.
Jetzt nehmen wir mal ein Beispiel – wir haben ja gerade schon anderes gehört –: Ein verheiratetes Paar verdient 60 000 Euro brutto; es zahlt 6 500 Euro pro Jahr für die Kranken- und Pflegeversicherung. Dabei spielt es keine Rolle, wie dieses Paar das Geld verdient, ob einer 60 000 Euro, der andere Partner 0 Euro oder beide jeweils 30 000 Euro verdienen. In beiden Fällen zahlen sie dasselbe für ihre Versicherung – so weit, so fair. Würde diese Maßnahme nun isoliert kommen – wie gesagt, es wird ein Paket geben, und wir wissen nicht, ob diese Maßnahme überhaupt darin sein wird –, da…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 93. Lars Haise (AfD) — ID217104200

- **v1-flagged Wort:** `polemisiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Lars Haise (AfD) polemisiert gegen die Energiewende und EU-Regulierung als Bremsklötze für Deutschlands digitale Zukunft: während USA und China Rechenzentren im Gigawattmaßstab hochfähren, zerstöre die Koalition mit Klimaschutzvorgaben die industrielle Konkurrenzfähigkeit; die EU-Energieeffizienz-Direktive widerspreche dem wachsenden KI-Energiehunger, und rot-grüne Stadträte (Groß-Gerau, 2,5 Mrd Euro) blockierten Rechenzentren aus 'Bedenkenträgertum'. Seine Forderung: Abkehr von 'Klimaballast' und 'grünen Altlasten', Rückkehr zu Kern- und Kohlekraft, und — direkter Wahlaufruf am Schluss — nur eine Union ohne SPD plus AfD könne echte 'Entfesselung der Wirtschaft' bringen.

**v2.1-Summary (neu):**
> Lars Haise (AfD) attackiert die deutsche Digitalpolitik und Energiewende als Bremsklötze für KI-Rechenzentren: Während USA und China im Gigawattmaßstab hochfahren, würde Deutschland mit 'höchsten Strompreisen Europas' und Kernkraft-Abschaltungen die Zukunft rauben; die EU-Energieeffizienz-Direktive widerspreche dem prognostizierten Datenzentrum-Strombedarf, Digital- und Energieministerium seien intern uneinig ('Die rechte Hand weiß nicht, was die linke tut'), und das 2,5-Milliarden-Euro-Projekt Groß-Gerau werde durch 'rot-grüne Bedenkenträgerei' blockiert. Sein Schluss ist ein Wahlaufruf an die Union: nur die AfD könne 'echte Entfesselung der Wirtschaft' gegen die 'grünen Altlasten von gestern' ermöglichen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check"> {   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" } 

**Original-Auszug (Mitte, ~600 chars):**
```
…rzsichtig und naiv. Ich zitiere den Staatssekretär aus dem Haus von CDU-Ministerin Reiche:
„Die Bundesregierung sieht keinen Widerspruch zwischen den Verbrauchszielen der Energy Efficiency Directive und dem prognostizierten Energiebedarf von Künstlicher Intelligenz […].“
Dass Sie sich in der Koalition nicht einig sind, haben Sie bei Ihrer Krisenklausur am Wochenende allen Bürgern leidvoll vor Augen geführt. Neu ist aber, dass man sich selbst innerhalb der Union wohl nicht einig ist und die rechte Hand nicht weiß, was die linke tut; denn aus dem Digitalministerium heißt es auf Seite 12 des Stra…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 94. Markus Frohnmaier (AfD) — ID217107700

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Markus Frohnmaier (AfD) stellt als Zwischenfrage eine sarkastische Konfrontation: Er unterstellt dem Vorredner Doppelstandards bei der Bewertung von Demokratie — während dieser Ungarns angebliche 'Rückkehr zur Demokratie' begrüße, finde gerade in Rheinland-Pfalz eine vergleichbare Maßnahme statt (ein abgewähltes Parlament setzt das Quorum für Untersuchungsausschüsse erhöht). Die Pointe zielt auf Heuchelei ab.

**v2.1-Summary (neu):**
> Markus Frohnmaier (AfD) wirft dem Antwort-Redner in einer Zwischenfrage sarkastisch vor, die Rückkehr zur Demokratie in Ungarn zu loben — während parallel ähnliche Maßnahmen (Quorum-Erhöhung für Untersuchungsausschüsse mit abgewähltem Parlament) in Rheinland-Pfalz stattfinden. Seine Pointe: eine Kritik an vermeintlicher Doppelmoral beim Standard der Rechtsstaatlichkeit zwischen internationaler Orbán-Kritik und inländischer Toleranz demokratie-unterhöhlender Verfahren.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
Lieber Herr Kollege, erst mal vielen Dank, dass Sie die Zwischenfrage zulassen. Das ist guter Stil, passiert nicht ganz so oft.
Ich möchte Sie fragen: Sie freuen sich ja darüber, dass in Ungarn, wie Sie finden, eine Rückkehr zur Demokratie stattfindet und Ähnliches. Wie würden Sie es bewerten, wenn beispielsweise in Ungarn Viktor Orbán mit einem abgewählten Parlament das Quorum für die Einsetzung von Untersuchungsausschüssen nach oben setzen würde, also mit einem alten Parlament? Genau das findet ja, wie Sie wissen, beispielsweise jetzt im Moment in Rheinland-Pfalz statt.
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 95. Dr. Hans Theiss (CDU/CSU) — ID217111800

- **v1-flagged Wort:** `Diffamierungen`
- **v2.1 enthält noch:** `Diffamierungen`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Hans Theiss (CDU/CSU) lehnt den Grünen-Antrag zur Verschärfung der Tiermodell-Regulierung ab und argumentiert sachlich mit medizinhistorischen Beispielen (Insulin, Antibiotika, Impfstoffe, Herztransplantationen, HIV-Medikamente, moderne Gen- und Zelltherapien), dass Tierexperimente weiterhin unverzichtbar für medizinischen Fortschritt und Patientensicherheit sind; zugleich plädiert er aus Rechtssicherheitsgründen für die eigenständige Gesetzesregelung des Tiermodell-Bereichs und kritisiert eine unsachliche Debattenkultur mit „Diffamierungen der Wissenschaftsszene" und „Generalverdacht gegen Forscher".

**v2.1-Summary (neu):**
> Dr. Hans Theiss (CDU/CSU) verteidigt Tierversuche als unverzichtbare Grundlage des medizinischen Fortschritts und lehnt den Grünen-Antrag ab. Er betont aus jahrzehntelanger persönlicher Erfahrung die historischen Erfolge — Insulin, Antibiotika, Impfstoffe, Transplantationen, HIV- und Krebsmedikamente, Gen- und Zelltherapien — alle hätten Tiermodelle vorausgesetzt; zukünftige Medikamente müssten zunächst an Tieren getestet werden, bevor sie verantwortungsvoll am Menschen angewendet werden können. Gleichzeitig kritisiert er die gegnerische Debattenkul: »Diffamierungen der Wissenschaftsszene, Forscher unter Generalverdacht und politische Selbstdarstellung sind klar falsche Mittel« — die Debatte solle sachlich geführt werden, ohne »Schaum vor dem Mund«. Abschließend betont er, dass Patientensicherheit höchste Priorität habe und Rechtssicherheit für Forscherinnen und Forscher notwendig sei, um die besten Köpfe nach Deutschland zu holen.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…enschaftsszene, Forscher unter Generalverdacht und politische Selbstdarstellung sind klar falsche Mittel. Neue medizinische Erkenntnisse können leider oft nur im Tiermodell gewonnen werden. Viele neue Medikamente und neue Operationstechniken können nur am Tiermodell getestet werden, bevor sie dann auch verantwortungsvoll am Menschen angewendet werden können.
Deshalb sind diese Experimente eine wesentliche Grundlage für medizinischen Fortschritt. Da spreche ich auch aus langjähriger, ja, jahrzehntelanger persönlicher Erfahrung. Ohne sie hätten wir keine Insulintherapie für Diabeteskranke. Ohne …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 96. Christoph Frauenpreiß (CDU/CSU) — ID217202800

- **v1-flagged Wort:** `Stimmungsmache`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Christoph Frauenpreiß (CDU/CSU) lehnt die Agrar-Anträge der AfD-Fraktion als „Musterbeispiel verantwortungsloser Agrarpolitik" ab: Sie seien keine konstruktive Analyse, sondern „eine Aneinanderreihung populistischer Schlagworte" ohne echten Gestaltungswillen — hinzu kommt der verdächtige Wechsel von stiller Ausschuss-Beratung zu öffentlicher Debatte „hier, wo die Kameras an sind", was den Verdacht auf bloße Stimmungsmache statt echte Lösungen lenkt. Sein zentraler Vorwurf: „Überschriften allein lösen die Probleme unserer heimischen Landwirtschaft nicht — wollen Sie Tiktok-Videos produzieren oder wirklich Lösungen?"

**v2.1-Summary (neu):**
> Christoph Frauenpreiß (CDU/CSU) lehnt die AfD-Anträge zur Landwirtschaft ab und attackiert sie als „Aneinanderreihung populistischer Schlagworte" ohne konstruktive Lösungen. Er wirft der AfD vor, die Anträge in den Ausschüssen ohne Debatte beraten zu lassen, aber nun vor laufenden Kameras zu inszenieren — mit der rhetorischen Frage: „Wollen Sie hier Tiktok-Videos produzieren, oder wollen Sie wirklich Lösungen erzielen?" Seine Pointe: echte Agrarpolitik braucht nicht Überschriften, sondern Gestaltungswillen für die heimischen Landwirtschaft.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…dafür, wie man keine verantwortungsvolle Agrarpolitik betreibt. Sie sind eben nicht Ausdruck von agrarpolitischem Gestaltungswillen, sondern nur ein weiterer Versuch der AfD, mit zugespitzten Schlagworten Stimmung zu machen. Überschriften allein lösen die Probleme unserer heimischen Landwirtschaft nicht.
Eine Frage sei erlaubt: Geht es Ihnen bei diesen Anträgen wirklich um die Landwirtschaft? Denn die Anträge wurden in den Ausschüssen ohne Debatte beraten, aber hier, wo die Kameras an sind, ist natürlich eine Debatte gewünscht. Deswegen stellt sich die Frage: Wollen Sie hier Tiktok-Videos prod…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 97. Markus Frohnmaier (AfD) — ID217204700

- **v1-flagged Wort:** `verdamme`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Markus Frohnmaier (AfD) greift in einer Zwischenfrage die SPD-Außenpolitik an und behauptet einen Widerspruch: während die SPD Regierungskooperation mit Regimen verdamme, zahle dieselbe SPD 200 Millionen Euro an den syrischen Führer Al-Julani, behauptet Frohnmaier einen ehemaligen Dschihadistenführer, der in Syrien Drusen und Alawiten verfolge. Er zielt damit auf die Glaubwürdigkeit des „wertebasierten" Außenpolitik-Anspruchs und fragt sarkastisch, ob es aus SPD-Sicht „gute" und „böse" Diktatoren gebe. Die Frage ist konfrontativ konstruiert als Enthüllung vermuteter außenpolitischer Doppelmoral.

**v2.1-Summary (neu):**
> Markus Frohnmaier (AfD) wirft der SPD Doppelmoral in der Außenpolitik vor: Während die SPD Regime-Kooperationen öffentlich kritisiere, zahle sie dem ehemaligen Dschihadistenführer Baschar al-Julani 200 Millionen Euro aus Steuermitteln und dulde damit (so Frohnmaiers Behauptung) die Verfolgung von Drusen und Alawiten in Syrien. Er setzt der SPD mit der rhetorischen Frage entgegen: „Wie funktioniert dieser SPD-Kompass in der Außenpolitik, der ja angeblich wertebasiert ist? Gibt es gute Diktatoren oder Autokraten und böse?" — eine konfrontative Aufdeckung von angeblicher Inkonsistenz.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "Doppelmoral"   ],   "begruendung_falls_unsicher": "Das Wort 'Doppelmoral' ist eine Deutung meinerseits; Frohnmaier nutzt es nicht wörtlich. Er sagt 'verwerflich' (zu Regime-Kooperation allgemein) und wendet das als Kontrast an. 'Heuchelei' war ursprüngliche Überlegung, ist aber noch stärker wertendes Wort — 'Doppelmoral' ist näher an Frohnmaiers impliziter Vorwurf, aber ich bin unsicher, ob es ohne das Wort besser wäre ('Widerspruch' oder 'Inkonsistenz' wären neutral). Bleibe bei 'mittel' Konfidenz." }

**Original-Auszug (Mitte, ~600 chars):**
```
…ngemerkt, dass Sie es verwerflich finden, wenn in der Außenpolitik Regierungen mit Regimen kooperieren. Ich würde Sie jetzt gerne fragen – die SPD war ja auch Teil der Ampelkoalition und ist Teil der jetzigen Regierung –: Sie kooperieren beispielsweise mit Herrn Al-Julani. Der bekommt jetzt 200 Millionen Euro quasi als Geschenk aus unserem Steuergeld dafür, dass er beispielsweise in Syrien Drusen verfolgt, Alawiten verfolgt usw.; Sie kennen die Geschichten. Es handelt sich um einen ehemaligen Dschihadistenführer.
Können Sie mir bitte mal erklären, wie eigentlich dieser SPD-Kompass in der Außen…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 98. Clara Bünger (Die Linke) — ID217402300

- **v1-flagged Wort:** `Heuchelei`
- **v2.1 enthält noch:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Clara Bünger (Die Linke) verteidigt eine progressive Wohnungspolitik gegen die AfD und entlarvt deren Migrations-Scapegoating als Ablenkung von echten Ursachen: Finanzspekulation seit 2008, Immobilienkonzern-Macht und die Heuchelei der AfD selbst (420.000 Euro Immobilien-Spenden; AfD-Abgeordneter Maack verdient 400.000 Euro jährlich mit Mieteinnahmen in Ostdeutschland). Ihre Forderungen: Regulierung von Spekulation, Wiederherstellung von Mietpreisbremse/Mietendeckel/sozialem Wohnungsbau sowie eine Reform des Königsteiner Schlüssels durch besseres Matching-System — kein „rassistischer Müll", sondern echte Lösungen.

**v2.1-Summary (neu):**
> Clara Bünger (Die Linke) greift die AfD in der Mietkrise-Debatte an: Die AfD schulde nicht den realen Ursachen (Finanzkrise 2008/09, Immobilien-Spekulation, Profite der Immobilienkonzerne) an, sondern führe ein „rassistisches Spaltungsprogramm" durch Migrantisierung; konkret stimme die AfD konsequent gegen Mietpreisbremse, Mietendeckel und sozialen Wohnungsbau ab und habe 420.000 Euro von der Immobilienwirtschaft erhalten. Sie attackiert persönlich den AfD-Abgeordneten Maack, der neben Bundestagsdiäten 400.000 Euro jährlich von Mietern verdient und damit „vom Ausverkauf Ostdeutschlands" profitiert — ein Fall von „Heuchelei", da er gleichzeitig den Geflüchteten Wohnungen als Preistreiber unterstelle. Zum Schluss fordert sie eine Reform des Königsteiner Schlüssels, kritisiert aber noch einmal das „rassistische" AfD-Framing.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check"> {   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" } 

**Original-Auszug (Mitte, ~600 chars):**
```
…hts gegen diese Fehlentwicklungen getan.
Wer die Wohnungskrise bekämpfen will, muss an ihre Ursachen ran:
an Spekulation und die Macht der Immobilienkonzerne. Genau das will die AfD aber nicht.
Stattdessen setzt sie auf ein rassistisches Spaltungsprogramm. Das ist die Lösung der AfD.
Zur Wahrheit gehört auch: Die AfD stimmt im Bundestag konsequent gegen die Interessen der Mieterinnen und Mieter. Sie ist gegen die Mietpreisbremse, den Mietendeckel und den sozialen Wohnungsbau. Die Partei steht fest an der Seite des Kapitals. Zum Dank hat sie über 420 000 Euro von der Immobilienwirtschaft bekomm…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 99. Martin Reichardt (AfD) — ID217405500

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Martin Reichardt (AfD) wehrt sich in einer Zwischenfrage gegen den Vorwurf mangelnden Kinderschutzes durch die AfD und wirft der SPD-Landesregierung Sachsen-Anhalt Heuchelei vor: deren Bildungsminister habe Migrantenattacken auf ein neunjähriges Kind in einer Grundschule „herabgewürdigt und verharmlost". Mit der rhetorischen Schlussfrage „Warum werfen Sie uns so etwas vor, wenn gleichzeitig Ihre Landesregierungen solche Zustände an unseren Schulen zulassen?" dreht Reichardt den Kinderschutz-Vorwurf gegen die Regierungsparteien zurück.

**v2.1-Summary (neu):**
> Martin Reichardt (AfD) interveniert als Zwischenfrage mit direktem Gegenvorwurf: Der Sachsen-Anhalt-Landesregierung wird zur Last gelegt, Angriffe von Migranten auf ein neunjähriges Kind in einer Grundschule durch ihren Bildungsminister 'herabgewürdigt und verharmlost' zu haben. Reichardt wirft der Bundesregierung vor, die AfD unberechtigt zu beschuldigen, nichts für Kinderschutz zu tun, während gleichzeitig Landesregierungen 'solche Zustände an unseren Schulen' duldeten — die Frage endet mit Präsidium-Unterbrechung.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
… Tätigkeiten gegen unsere Kinder vorgehen wollen, wir würden nichts für unsere Kinder tun, will ich Ihnen Folgendes sagen: Es war Ihr Bildungsminister in Sachsen-Anhalt, der die Angriffe von Migranten auf ein neunjähriges Kind in der Grundschule herabgewürdigt und letzten Endes auch verharmlost hat, zusammen mit seinem Pressesprecher. Das ist ganz klar.
Wir haben es nicht nötig, uns von Ihnen sagen zu lassen, dass wir nichts für den Kinderschutz tun wollen.
Und meine Frage ist: Warum – –
– Entschuldigung.
Beenden Sie Ihre Frage.
Genau. – Ich stelle Ihnen jetzt folgende Frage:
Ja, genau.
Warum …
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 100. Dr. Konrad Körner (CDU/CSU) — ID217406500

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `Skandalisierung`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Konrad Körner (CDU/CSU) kritisiert den AfD-Antrag scharf als selektive Skandalisierung: Er anerkennt, dass das Pornoheft-Vorkommen bei einem Stiftungs-Workshop inakzeptabel war und die Schule richtig reagierte, lehnt aber ab, dass aus dieser 2.500-Euro-Förderung einer linken Stiftung (nicht aus dem Bundeshaushalt) ein Riesenskandal gemacht werden darf, der zu Morddrohungen gegen Schulleiter führt. Er wirft der AfD mangelndes bürgerliches Maß vor — Storch spreche dreimal von „Freakshow" und viermal von „pervers", Frömming verbreite sich explizit über Kinderpornografie —, während deren Europaparlament-Abgeordnete gegen Regelungen zur Aufdeckung von Kinderpornografie und gegen die Bekämpfung von Extremismus abstimmten. Forderung: bessere Qualitätskriterien für Schulförderung, Neuausrichtung von „Demokratie leben!", und ein Ende der Heuchelei.

**v2.1-Summary (neu):**
> Dr. Konrad Körner (CDU/CSU) verteidigt die Amadeu Antonio Stiftung gegen die AfD-Skandalisierung eines Einzelfalls: Der schulische Pornoheft-Vorfall sei zwar inakzeptabel und habe richtige Konsequenzen (Förderung gestoppt), aber die AfD habe diesen Einzelfall zu einem bundesweiten Skandal aufgeblasen, der zu Morddrohungen gegen Schulleiter führte — Körner wirft der AfD »Mitschuld an den geäußerten Morddrohungen« vor und kritisiert konkret Storch (»dreimal Freakshow, viermal pervers«) und Frömming für maßlose Rhetorik. Statt Skandalisierung fordert er bessere Qualitätskriterien für Förderprogramme und greift die AfD-Position im Europaparlament zu Kinderpornografie-Aufdeckung an.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…en.
Was wir aber genauso verurteilen müssen, ist das, was jetzt daraus folgt. Wenn wegen 2 500 Euro missglückter Förderung einer linken Stiftung und eines sozialistischen Verbands – nicht aus dem Bundeshaushalt – und einem Pornoheft Morddrohungen ausgesprochen werden und dieses Hohe Haus eine Stunde darüber diskutieren muss, dann müssen sich Parteien, die diese Schweinerei zu einem bundesweiten Skandal aufblasen, schon fragen lassen, ob sie nicht Mitschuld an den geäußerten Morddrohungen haben
und ob sie nicht in einem legitimen Meinungskampf jede Form von Maß und Mitte verlieren.
Und, Herr Dr…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 101. Dr. Konrad Körner (CDU/CSU) — ID217406700

- **v1-flagged Wort:** `Skandalisierung`
- **v2.1 enthält noch:** `skandalisieren`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Dr. Konrad Körner (CDU/CSU) kontert einen AfD-Angriff auf die Bundesdemokratieförderung durch Bundesministerin Prien: Er verteidigt die Arbeit der Regierung gegen Demokratieförderung und konzediert notwendige Abstellung von Einzelfehlern, attackiert aber die AfD-Taktik, einen Wahlkreis-Skandal (Chrupalla) zu Skandalisierung zu missbrauchen statt konstruktive Anträge einzubringen. Sein Gegenbeweis: Ein AfD-Kandidat in Bayern habe sein eigenes Auto angezündet, um falsche Anschläge-Narrative vor Wahlen zu schaffen — Körners Botschaft lautet, dass solche Methoden-Unterschiede die „Vernünftigen" (CDU/CSU) von den Taktikern der AfD trennen.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Dr. Konrad Körner (CDU/CSU) verteidigt die Demokratieförderung der Bundesregierung unter BMin Prien als zielgerichtet und notwendig; echte Einzelfehler müssten abgestellt werden, aber die AfD versuche, einen Skandal aus Chrupallas Wahlkreis zum bundesweiten Muster hochzustilisieren — dabei müsse man sachlich über die Polizeiliche Kriminalstatistik reden, nicht skandalisieren. Als Gegenbeispiel nennt er einen AfD-Kandidaten aus Bayern, der sein eigenes Auto angezündet habe, um einen linksradikalen Angriff vorzutäuschen; Körner erklärt, mit solchen Methoden nicht zu handeln, weil „wir die Bürgerlichen und Vernünftigen in diesem Land sind".</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": [     "Bürgerlichen",     "Vernünftigen"   ],   "begruendung_falls_unsicher": "Körner nutzt diese Begriffe selbst als Selbst-Charakterisierung ('wir sind die Bürgerlichen und Vernünftigen'), daher sind sie wörtliche Zitate des Sprechers — aber sie sind per se wertend. In der Summary erscheinen sie als Körners eigene Aussage (indirekte Rede) und bewahren dadurch ihre Distanz-Markierung. Konfidenz nicht 'hoch', da die Inhalts-Summary die Selbstcharakterisierung reproduziert, auch wenn sie vom Sprecher kommt." }

**Original-Auszug (Mitte, ~600 chars):**
```
…ehlern und auch Vorfällen kam – ich habe selber Schweinereien genannt –, dann müssen diese abgestellt werden.
Aber die Frage ist doch, was wir mit Einzelfällen vor Ort machen.
Sie haben es nicht geschafft, irgendeine Struktur aufzubauen. Wo sind denn Ihre Anträge?
– Nein, darum ging es nicht. – Sie wollten heute einen Einzelskandal aus dem Wahlkreis von Herrn Chrupalla zu einem bundesweiten Skandal aufblasen.
Wissen Sie, in meiner Heimat fanden gerade Kommunalwahlen statt. Da hat ein AfD-Kandidat sein eigenes Auto angezündet, um daraus einen linksradikalen Angriff vor der Kommunalwahl zu mache…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 102. Martin Sichert (AfD) — ID217409700

- **v1-flagged Wort:** `Heuchelei`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Martin Sichert (AfD) attackiert die Linke-Abgeordnete Machalet direkt auf ihren Widerspruch: Sie behaupte gleichmäßige Lastverteilung, wolle aber die Familienversicherung abschaffen und belaste damit 2,4 Millionen Familien mit 2.700 Euro jährlicher Zusatzbeitrag. Seine Frage-Pointe: „Wie kommen Sie dann dazu?" — eine klassische AfD-Konfrontations-Rhetorik, die die Koalition der Heuchelei bezichtigt.

**v2.1-Summary (neu):**
> Martin Sichert (AfD) interveniert mit einer direkten Widerlegung gegen Frau Machalet (vermutlich Linke-Sprecherin): Ihre Forderung nach „gleichmäßiger Lastverteilung" steht im Widerspruch zur geplanten Abschaffung der Familienversicherung, die 2,4 Millionen Familien mit einer jährlichen Beitragserhöhung von 2.700 Euro belaste. Sichert rahmt dies als „alles andere als gleichmäßige Lastverteilung" und fragt pointiert nach der Konsistenz der Position.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check"> {   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" } 

**Original-Auszug (Mitte, ~600 chars):**
```
Vielen Dank, Herr Präsident. – Frau Machalet, Sie haben ja gerade gesagt, Sie wollen eine gleichmäßige Verteilung der Lasten. Wie kann es dann sein, dass Sie die Familienversicherung abschaffen wollen? Das bedeutet nämlich, dass bei 2,4 Millionen Familien eine Beitragserhöhung um 2 700 Euro jährlich stattfindet. Das ist eine riesige Beitragserhöhung. Das ist alles andere als eine gleichmäßige Verteilung der Lasten. Wie kommen Sie dann dazu?
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 103. Helge Lindh (SPD) — ID217414300

- **v1-flagged Wort:** `Doppelmoral`
- **v2.1 enthält noch:** `Doppelmoral`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Helge Lindh (SPD) lehnt das BRH-Unabhängigkeitsgesetz der AfD scharf ab und entlarvt es in satirischem Ton als bloßes Instrument der Ad-personam-Gesetzgebung (erst gegen Geywitz, nun gegen Heveling). Die verfassungsrechtlich garantierte Unabhängigkeit der Rechnungshofmitglieder sei durch bestehende Befangenheitsregeln und das Kollegialprinzip robust gesichert; die von der AfD geforderten Karenzzeiten für ehemalige Regierungsmitglieder würden nicht die Unabhängigkeit, sondern die Multiperspektivität und Fachkompetenz gefährden. Mit einem Orbán-Vergleich schließt Lindh: Wer wie die AfD gleichzeitig Orbáns politisch abhängigen Rechnungshof bewundere und hier künstliche Unabhängigkeitszweifel säe, argumentiere in „Selbstwidersprüchlichkeit" oder „Doppelmoral".

**v2.1-Summary (neu):**
> Helge Lindh (SPD) lehnt den AfD-Gesetzentwurf zur Änderung des Bundesrechnungshofgesetzes als „Ad-personam-Gesetzespraxis" ab — zunächst als „Klara-Geywitz-Vizepräsidentin-Verhinderungs-Gesetzentwurf", nun als „Ansgar-Heveling-Präsidenten-Verhinderungs-Gesetzentwurf" (wobei er Heveling als „herausragend geeignet" würdigt). Inhaltlich argumentiert Lindh, dass richterliche Unabhängigkeit durch die Verfassung bereits garantiert sei, dass Befangenheitsregeln und Kollegialprinzip funktionierten, und dass die Vermischung von Karenzzeit-Regeln (legitim für wirtschaftliche Interessen) mit der BRH-Unabhängigkeit bewusste Verwirrung sei; er kritisiert die AfD abschließend der Doppelmoral: während sie den BRH anfeinde, preise sie gleichzeitig Orbáns Model eines politisch abhängigen Rechnungshofs. Die Redezeit wird überschritten.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "mittel",   "wertende_woerter_eigene": ["doppelmoralisch"],   "begruendung_falls_unsicher": "Das Wort 'doppelmoralisch' wird vom Sprecher wörtlich genutzt ('entweder ... oder alles ist zutiefst doppelmoralisch'), daher mit Distanz-Markierung legitim — allerdings wird es in der Summary ohne explizite Distanzierer ('Lindh wirft vor' / 'behauptet') direkt zugeordnet. Die neutrale Version könnte 'Lindh kritisiert eine Inkonsistenz' sein, aber das würde die pointierte Anklage abschwächen. Konfidenz mittel, da die Grenze zwischen wörtlicher Redewiedergabe und eigenständiger Wertung hier eng ist." }

**Original-Auszug (Mitte, ~600 chars):**
```
…ne Institution, die mustergültig demokratisch funktioniert und Kontrolle ausübt. Dafür danken wir. Diese Institution ist ein Beispiel dafür, wie notwendig solche Institutionen sind und wie wichtig die Resilienz solcher Institutionen gegen Anfeindungen durch Feinde der Demokratie ist.
Darüber hinaus – und das ist, glaube ich, auch noch mal wichtig – vermischen Sie ganz bewusst Tatbestände. Der Aspekt der Karenzzeit ist ja ernst zu nehmen – er ist aber ernst zu nehmen in Bezug auf wirtschaftliche Interessen und Bereicherung und doch nicht in Bezug auf den Bundesrechnungshof und das öffentliche I…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten

### 104. Hans-Jürgen Goßner (AfD) — ID21915200

- **v1-flagged Wort:** `diffamiert`
- **Self-Check:** konfidenz=`null`, count_eigene=0

**v1-Summary (alt):**
> Hans-Jürgen Goßner (AfD) lehnt den Linke-Antrag zur Senkung der Höchstarbeitszeit von 48 auf 40 Stunden ab und diffamiert ihn als „klassischen Sozialismus durch die Hintertür" und „Wunschkonzert für ideologiegetriebene Wohlstandssimulationen" — die geplante Totalerfassung der Arbeitszeiten bezeichnet er polemisch als „Zeiterfassungs-Stasi". Sein Gegenprogramm beschränkt sich auf abstrakte Appelle an „Leistungsgedanken" und „ehrliche Arbeitsgesellschaft"; konkrete AfD-Alternativvorschläge bleiben aus. Das Zitat „Freitag um eins macht jeder seins" dient als kulturelle Verankerung der Lächerlichkeit, die Wiederholung „Finger weg von unserem Wirtschaftsstandort" und historische DDR-Delegitimierung prägen die konfrontative Rhetorik.</zusammenfassung_2_saetze> </invoke>

**v2.1-Summary (neu):**
> Hans-Jürgen Goßner (AfD) lehnt den Linke-Antrag zur Senkung der Höchstarbeitszeit auf 40 Stunden vehement ab und wirft der Linken vor, ein 'Wunschkonzert für ideologiegetriebene Wohlstandssimulationen' statt eines Arbeitsschutzgesetzes zu schreiben — ein Rezept 'Weniger arbeiten, mehr kassieren', das in der DDR bereits gescheitert sei. Er attackiert die geforderte Zeiterfassung als 'Zeiterfassungs-Stasi' und warnt vor Standortflucht und Produktivitätskrise; statt ideologischer 'Arbeitszeitverweigerung' fordert die AfD Leistungsanreize, Eigenverantwortung und Unternehmertum als Fundament einer 'ehrlichen, leistungsorientierten Arbeitsgesellschaft'.</zusammenfassung_2_saetze> <parameter name="neutralitaets_self_check">{   "konfidenz": "hoch",   "wertende_woerter_eigene": [],   "begruendung_falls_unsicher": "" }

**Original-Auszug (Mitte, ~600 chars):**
```
…ühren die Vereinbarkeit von Familie und Beruf ins Feld. In Wahrheit betreiben Sie das, was Sie am besten können: klassischen Sozialismus durch die Hintertür.
Damit sind Sie aber schon einmal gescheitert, und deshalb ist die DDR, in der Ihre Partei gut 40 Jahre lang ihr Unwesen getrieben hat, Geschichte. Weniger arbeiten, mehr kassieren, das ist Ihr Rezept.
Bezahlen sollen es natürlich wieder die hart arbeitende Mittelschicht und die Unternehmen, die ohnehin schon unter Bürokratie, Energiepreisen und Fachkräftemangel ächzen. Und dann wundern Sie sich über Standortflucht und Produktivitätskrise.…
```

**Bewertung:** ☐ v2.1 ok    ☐ v2.1 noch biased — manuell rewriten    ☐ v2.1 schlechter als v1 — v1 behalten
