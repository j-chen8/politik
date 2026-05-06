# Bias-Audit Manual Sample — 2026-05-05

**Zweck:** Validierung der wertende-Verben-Metrik aus Schicht 1.
**Sample:** 15 Reden, je 3 pro Partei, mit dem dominanten wertenden Verb der Partei.

## Bewertungs-Schema pro Rede

Für jede Rede: ist das wertende Verb in der Zusammenfassung **echter Bias** (LLM editorialisiert) oder **legitim** (Sprecher nutzt das Wort selbst)?

- ✅ **legitim**: Sprecher verwendet das Verb (oder klare Synonyme) selbst im Originaltext
- ⚠️ **Grenzfall**: Sprecher nutzt das Verb nicht, aber die Beschreibung ist sachlich-akkurat ohne politische Färbung
- ❌ **echter Bias**: Sprecher nutzt das Verb nicht, und das Verb färbt die Wiedergabe in eine Wertung (positiv/negativ)

## Heuristik-Vorab-Markierung

Pro Rede ist unter "Verb-Stamm im Original" markiert, ob der Wortstamm auch im Original-Text vorkommt.
- ✓ ja → Sprecher hat ähnliches gesagt → eher legitim
- ✗ nein → LLM hat das Verb hinzugefügt → eher Bias

Diese Heuristik ist nicht perfekt — Synonyme zählen mit, aber nicht alle. Bitte trotzdem den Original-Auszug lesen.

---

## 1. Robin Jünger (AfD) — Rede ID211007500

- **Tonalität:** polemisch_sachlich
- **Wertendes Verb in Summary:** `skandalisiert`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Robin Jünger (AfD) lobt formal die Prioritätsklausel und Zuständigkeitsverlagerung zum Digitalministerium, kritisiert aber die Novelle als substanzlos: „150 Seiten mit 230 Paragrafen, nur redaktionelle Änderungen und eine inhaltsleere Willensbekundung" — kein Budget, keine messbaren Kennzahlen, keine echte Beschleunigung des Netzausbaus. Mit historischem Vergleich zu Schwarz-Schilling (1981: Sonnenschein KG, Kupfer statt Glasfaser) und Anspielungen auf Augustus Intelligence skandalisiert er ein vermeintliches Muster von CDU-Gefälligkeitspolitik, schließt aber mit direktem Appell an Minister Wildberger: „Das können Sie doch besser!"

**Highlighted snippet:** "...enschein KG, Kupfer statt Glasfaser) und Anspielungen auf Augustus Intelligence skandalisiert er ein vermeintliches Muster von CDU-Gefälligkeitspolitik, schließt aber mit direktem Appell an Minister Wildberger: „D..."

### Originaltext (Auszug, 2887 Zeichen total)

```
g! Es schmerzt mich schon, zu wissen, was die Wähler später von Ihnen hören werden: In den ersten Tagen unserer Regierung haben wir die Beschleunigung des Netzausbaus auf den Weg gebracht. – Ich hoffe, Ihre Wähler verstehen, dass das Unsinn ist.
Die Wahrheit ist: Sie hängen an den § 1 ein Priority-Schildchen, und in den §§ 2 bis 230 wird die Zuständigkeit angepasst. Da ist nichts für sie drin – keine einzige messbare Kennzahl.
Es ist bemerkenswert, wie wenig Mühe Sie sich damit geben, dem Bürger zu erzählen, dass Sie hiermit irgendetwas bewegen, geschweige denn beschleunigen wollen.
Herr Minister Wildberger, ich bin sicher, Sie sind mit guten Absichten in dieses Haus eingezogen. Daher hoffe ich sehr, dass wir künftig bessere, umfänglichere Initiativen von Ihrem Ministerium vorgelegt bekommen werden. Ich möchte Sie daran erinnern, dass vor allem Sie die Chance haben, Deutschland positiv zu gestalten.
Ein früherer CDU-Minister, Christian Schwarz-Schilling, der 1981 ebenfalls frisch aus der Wirtschaft kam und sich zunächst dafür einsetzte, dass die Aufträge zum Netzausbau an die Privatwirtschaft vergeben werden konnten, erteilte diese sogleich an die Projektgesellschaft für Kabel-Kommunikation mit der berüchtigten Gesellschafterin Sonnenschein KG, der Firma seiner Frau. Im Hause Schilling rollte fortan der Rubel; denn sein Sonnenschein erhielt eine Vielzahl an Zuschlägen, das deutsche Kabelnetz mit Kupfer statt, wie von der vorherigen Regierung beschlossen, mit Glasfaser auszuba
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 2. Marc Bernhard (AfD) — Rede ID211315400

- **Tonalität:** polemisch
- **Wertendes Verb in Summary:** `skandalisiert`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Marc Bernhard (AfD) greift die Regierungspläne für 40 neue Gaskraftwerke an und skandalisiert die Energiepolitik als „weltdümmstes Desaster": Deutschland habe die höchsten Energiepreise der Welt, Unternehmen verlassen das Land, Bürger können Heizkosten nicht bezahlen — und die Regierung wolle trotzdem Nord Stream 2 schließen, während es auf teures US-Fracking-Gas ausweiche. Kernforderungen: Nord Stream 2 sofort wieder in Betrieb nehmen, Deindustrialisierung stoppen, massive Entlastung, und Aufklärung des Sprengstoff-Anschlags auf die Pipeline (den er als „Terroranschlag" rahmt und der Regierung/den Grünen Untätigkeit vorwirft). Schlusssatz ist direkter Wahlaufruf: AfD werde radikale Energiewende-Umkehr durchsetzen.</zusammenfassung_2_saetze> </invoke>

**Highlighted snippet:** "...Marc Bernhard (AfD) greift die Regierungspläne für 40 neue Gaskraftwerke an und skandalisiert die Energiepolitik als „weltdümmstes Desaster": Deutschland habe die höchsten Energiepreise der Welt, Unternehmen verla..."

### Originaltext (Auszug, 2718 Zeichen total)

```
on, in der Gas ohnehin knapp und für viele Menschen unbezahlbar ist, wollen Sie Nord Stream 2 für immer schließen.
Ernsthaft? Was für ein Wahnsinn!
Woher soll denn das ganze Gas kommen? Und vor allem: Wer soll dieses Gas denn noch bezahlen können? Das Einzige, was ich von Ihnen allen hier bisher gehört habe, ist dreckiges Fracking-Gas aus den USA,
das zigmal teurer ist als Pipelinegas und mit unzähligen schmutzigen Schweröltankern 7 000 Kilometer über den Atlantik transportiert werden muss. Das ist weder ökologisch noch wirtschaftlich sinnvoll.
Das Konzept Ihrer Energiewende war und ist, alle Kern- und Kohlekraftwerke durch Gaskraftwerke zu ersetzen
und im Übrigen Deutschland von Zufallsenergien wie Wind und Sonne abhängig zu machen.
In so einer Situation, in der Sie unser Land völlig abhängig gemacht haben von Gaslieferungen, völlig alternativlos, lassen Sie sich einen der wichtigsten Bausteine der deutschen Energieversorgung durch einen staatsterroristischen Anschlag einfach vor der Nase wegsprengen und haben in den drei Jahren – vor allem Sie von den Grünen – wirklich keine, keine einzige Anstrengung unternommen, um diesen Terroranschlag auch nur ansatzweise aufzuklären und die Schuldigen zu finden.
Der Treppenwitz dieses ganzen Desasters ist, dass nun womöglich ausgerechnet amerikanische Unternehmen Nord Stream 2 wieder in Betrieb nehmen wollen, während die Bundesregierung die Pipeline für immer unbrauchbar machen will. Damit gefährden Sie unsere Energiesicherheit und tre
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 3. Andreas Paul (AfD) — Rede ID212706700

- **Tonalität:** polemisch_sachlich
- **Wertendes Verb in Summary:** `skandalisiert`
- **Verb-Stamm im Original:** ✓ JA — Excerpt: … Sie können die Rechnungen nicht bezahlen? Also ich halte das absolut für einen Skandal, Herr Minister.
Es gibt in der Behandlung und in der Betreuung eine große Versorgungslücke. Die wird teilweise durch Vereine abgefedert. Ich möchte zwei nennen: den Bund Deutscher EinsatzVeteranen un…

### Zusammenfassung (LLM-generiert)

> Andreas Paul (AfD) kritisiert die Verteidigungshaushalts-Planung strukturell und punktuell: Entgegen des „Sondervermögens"-Narrativs herrsche Stillstand (10 Jahre für einfache Bauten statt Bauturbo), weil die Landesbaubehörden-Konkurrenz nicht angegangen werde — dabei hätten Ministeriumsfachleute längst einen Lösungsvorschlag erarbeitet, der von der Führung verworfen wurde. Daneben skandalisiert Paul die schlechte Zahlungsmoral gegenüber Veteranen-Therapeuten (Versorgungslücke bei PTBS), fordert höhere Förderung für Veteranen-Organisationen, und kritisiert Direktaufträge ohne Ausschreibung (exemplarisch 390 Mio für Rheinmetall-Laser statt Wettbewerb mit EOS zum halben Preis) als Steuerverschwendung. Sein Fazit: nicht die Ausgabenhöhe, sondern die tatsächliche Einsatzbereitschaft der Bundeswehr zähle.

**Highlighted snippet:** "...einen Lösungsvorschlag erarbeitet, der von der Führung verworfen wurde. Daneben skandalisiert Paul die schlechte Zahlungsmoral gegenüber Veteranen-Therapeuten (Versorgungslücke bei PTBS), fordert höhere Förderung ..."

### Originaltext (Auszug, 5065 Zeichen total)

```
…truktur, über Rüstung, über neue Soldaten – Stichwort „Wehrpflicht“ –; aber wir reden eigentlich viel zu wenig über die Soldaten, die schon lange für uns dienen.
Es gibt durchaus viele Soldaten, die bereit waren, auch ihr Leben in den Einsätzen einzusetzen. Und das ging nicht immer gut; ich nenne da nur das Stichwort „PTBS“. Die kriegen in der Truppe Hilfe durch Therapeuten oder durch externe Behandler. Doch das Angebot wird schlechter. Warum? Weil es aktuell zahlreiche externe Behandler gibt, die sagen: Nein, wir behandeln nicht. – Warum? Wenn man fragt, was der Grund ist, heißt es: eine schlechte Zahlungsmoral der Bundeswehr. Es ist so viel Geld im System, und Sie können die Rechnungen nicht bezahlen? Also ich halte das absolut für einen Skandal, Herr Minister.
Es gibt in der Behandlung und in der Betreuung eine große Versorgungslücke. Die wird teilweise durch Vereine abgefedert. Ich möchte zwei nennen: den Bund Deutscher EinsatzVeteranen und den Verein „Angriff auf die Seele“. Die zeigen ein tolles Engagement, viel Einsatz. Schauen wir dazu mal in den letzten Verteidigungshaushalt. Da waren Sie leider nicht bereit, mehr zu investieren; Ihre Grenze lag bei unter 1 Million Euro Förderung. Die Menschen, die diesen Veteranen helfen, leisten einen Dienst, den man kaum in Euro berechnen kann.
Ich fordere Sie auf: Bitte steuern Sie im nächsten Haushalt nach!
Ich lese von Artilleriemunition, von neuen Handwaffen, von Satellitenkommunikation, von Luftverteidigungssystemen und von e…
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 4. Thomas Erndl (CDU/CSU) — Rede ID211012400

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✓ JA — Excerpt: …ik im deutschen Interesse“ getarnt ist, lässt sich bei genauerem Hinsehen rasch entlarven. Was meinen Sie denn konkret, meine Damen und Herren von der AfD, wenn Sie von einer „ideologiefreien Strategie“, einem „national definierten Sicherheitsinteresse“ oder gar dem „Ende des Multilater…

### Zusammenfassung (LLM-generiert)

> Thomas Erndl (CDU/CSU) lehnt den AfD-Antrag zu außen- und sicherheitspolitischer Strategie ab und kontrastiert dessen Forderung nach „Realpolitik frei von Einflussnahme anderer Staaten" mit der AfD-Realität: Geheimdienste-Nähe einzelner Mitglieder, laufende Ermittlungen gegen aktuelle und ehemalige Abgeordnete wegen Geldwäsche im Zusammenhang mit russischen und chinesischen Zahlungen, sowie systematisches Auftreten als Sprachrohr autokratischer Regime. Erndl entlarvt den AfD-Code durch Sarkasmus: „ideologiefrei" bedeute in AfD-Sprache Isolation von NATO/EU, Ukraine-Unterstützungs-Stopp und Rückfall in nationalistisches Klein-Klein-Denken; daher sei die AfD „ein Sicherheitsrisiko für Deutschland".

**Highlighted snippet:** "...gen, sowie systematisches Auftreten als Sprachrohr autokratischer Regime. Erndl entlarvt den AfD-Code durch Sarkasmus: „ideologiefrei" bedeute in AfD-Sprache Isolation von NATO/EU, Ukraine-Unterstützungs-Stop..."

### Originaltext (Auszug, 2557 Zeichen total)

```
…te für eine Fraktion, gegen deren aktuelle und ehemalige Mitglieder wegen Geldwäsche und Bestechlichkeit im Zusammenhang mit Geldzahlungen aus Russland und China ermittelt wird.
Meine Damen und Herren, wir diskutieren hier über einen Antrag, der fast wortgleich bereits in der letzten Legislatur eingebracht wurde. Als Union haben wir den Antrag damals abgelehnt, und wir werden es auch heute wieder tun, nicht nur, weil die AfD keinerlei Glaubwürdigkeit beim Thema „nationale Sicherheit“ hat, sondern weil dieser Antrag erneut unter Beweis stellt, dass der sicherheitspolitische Kompass der AfD völlig falsch gepolt ist.
Was hier im Antrag als – Zitat – „eine Realpolitik im deutschen Interesse“ getarnt ist, lässt sich bei genauerem Hinsehen rasch entlarven. Was meinen Sie denn konkret, meine Damen und Herren von der AfD, wenn Sie von einer „ideologiefreien Strategie“, einem „national definierten Sicherheitsinteresse“ oder gar dem „Ende des Multilateralismus“ sprechen? Meine Damen und Herren, ich kann Ihnen sagen, was die AfD damit meint, nämlich eine Abkehr von der Unterstützung der Ukraine und das Heranrücken an Autokraten und Despoten, eine Abkehr von unseren demokratischen und freiheitlichen Werten und der europäischen Sicherheitsordnung, eine Abkehr von NATO und EU und ein Rückfall in nationalistische Klein-Klein-Denke.
Die AfD steht für eine Sicherheitspolitik, die Europa schwächen, unser Land isolieren und den Interessen unserer Feinde in die Hände spielen will.
Auch wenn die …
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 5. Kai Whittaker (CDU/CSU) — Rede ID211411300

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Kai Whittaker (CDU/CSU) führt eine scharfe konfrontative Rede gegen die AfD und ihr Remigrations-Programm: Er weist auf die Potsdamer Konferenz hin, wo die AfD offene Remigrations-Diskussionen führte, und entlarvt Springer durch dessen eigene Twitter-Aussage ('millionenfach abschieben') als Verfechter von Massenabschiebungen — auch gegen deutsche Staatsbürger mit Migrationshintergrund, was er durch die persönliche Anekdote seines eigenen Vaters (Brite, jetzt Deutscher, Steuerzahler) exemplifiziert. Whittaker's Schluss ist eine maximale Abgrenzungserklärung: „Wir werden alles dafür tun, dass Sie niemals einen Spaltbreit in dieses Land reinregieren."

**Highlighted snippet:** "...otsdamer Konferenz hin, wo die AfD offene Remigrations-Diskussionen führte, und entlarvt Springer durch dessen eigene Twitter-Aussage ('millionenfach abschieben') als Verfechter von Massenabschiebungen — auch..."

### Originaltext (Auszug, 1899 Zeichen total)

```
undsätzlich des Landes zu verweisen.
Wenn das so wäre, dann frage ich mich, warum zum Beispiel die Kollegin aus dem Sozialausschuss, Frau Huy, bei der sogenannten Potsdamer Konferenz anwesend war,
wo Sie das Konzept der Remigration öffentlich diskutiert haben.
Herr Springer, wenn Sie auf Twitter schreiben, Sie wollen millionenfach abschieben und Leute rausschmeißen, dann frage ich mich, von welchen Leuten Sie da eigentlich sprechen. Es können ja nur die Ausländer sein, Herr Springer.
Und dass es nicht nur um Flüchtlinge geht, habe ich selbst im Wahlkampf gegen meinen AfD-Gegenkandidaten in meinem eigenen Wahlkreis erleben dürfen,
den ich angesprochen habe, ob er es ernst damit meint, selbst dann einen Ausländer aus Deutschland abzuschieben, wenn er einen deutschen Pass hat wie mein Vater, der als Brite nach Deutschland gekommen ist, hier gearbeitet, Steuern gezahlt und gelebt hat, der mittlerweile Deutscher ist, ob ein Ausländer, wenn er auch nur ein einziges Mal über die rote Ampel fährt, dann eine Straftat begangen hat und deshalb aus Deutschland rausmuss. – Er hat es bejaht.
Das ist die Politik, die Sie fahren. Und wir werden alles dafür tun, dass Sie niemals einen Spaltbreit in dieses Land reinregieren und hier auf dieser Regierungsbank sitzen!
Es gibt keine Kurzintervention auf eine Kurzintervention. Damit wäre das Thema Kurzintervention
hiermit erledigt.
– Wenn Sie persönlich angesprochen worden sind, was man hier vorne nicht alles exakt entnehmen kann, dann haben Sie j
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 6. Lars Ehm (CDU/CSU) — Rede ID211411800

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✓ JA — Excerpt: … als Flüchtlinge eines brutalen Angriffskrieges mitten in Europa zu uns kommen, entlarvt die wahre Intention Ihres Antrages.
Zudem ist das grob falsch. Die meisten geflüchteten Ukrainer sind Frauen und Kinder.
Sie schreiben im Übrigen kein Wort darüber, warum diese Menschen eigentlich z…

### Zusammenfassung (LLM-generiert)

> Lars Ehm (CDU/CSU) lehnt den wiederholten AfD-Antrag zur Rückkehr ukrainischer Geflüchteter zu Asylbewerberleistungen ab und entlarvt die „wahre Intention" als Spalten statt Integration: Der Antrag ignoriere, dass die meisten Geflüchteten Frauen und Kinder sind, und stelle – mit Zitat – bloß Fragen zu Wehrdienst-Verweigerung. Ehm kontrastiert dies mit der Koalitions-Position (SGB II/XII mit Arbeitsmarkt-Instrumenten seit 2022 fortführen, schrittweiser Wechsel zu AsylbLG mit Arbeitserlaubnis und Berufsanerkennung) und kritisiert den AfD-Antrag als „populistischer Schnellschuss für das Schaufenster" ohne echtes Integrations-Interesse.</zusammenfassung_2_saetze> </invoke>

**Highlighted snippet:** "...-Antrag zur Rückkehr ukrainischer Geflüchteter zu Asylbewerberleistungen ab und entlarvt die „wahre Intention" als Spalten statt Integration: Der Antrag ignoriere, dass die meisten Geflüchteten Frauen und Kin..."

### Originaltext (Auszug, 3849 Zeichen total)

```
…te Kolleginnen und Kollegen! Der Antrag der AfD, den wir gerade beraten, kommt dem einen oder anderen sicher bekannt vor. Kein Wunder; denn die AfD hat diesen Antrag in nahezu identischer Form bereits im Oktober 2024 eingebracht. Heute also der zweite Versuch. Gleicher Inhalt, gleiche Stoßrichtung, gleiche Absicht: Spalten statt sinnvoll gestalten.
Umso wichtiger ist es, diesen Antrag nicht nur formal zurückzuweisen, sondern politisch einzuordnen. Da hilft bereits ein Blick in den zweiten Absatz des Antrages der AfD – ich zitiere –: „[…] viele wünschen sich ein besseres Leben oder wollen nicht zum Wehrdienst eingezogen werden.“ Dieser Blick auf die Menschen, die als Flüchtlinge eines brutalen Angriffskrieges mitten in Europa zu uns kommen, entlarvt die wahre Intention Ihres Antrages.
Zudem ist das grob falsch. Die meisten geflüchteten Ukrainer sind Frauen und Kinder.
Sie schreiben im Übrigen kein Wort darüber, warum diese Menschen eigentlich zu uns kommen und warum seinerzeit das Parlament die außergewöhnliche Regelung des Rechtskreiswechsels für ukrainische Kriegsflüchtlinge beschlossen hat.
Worum geht es konkret? Seit Juni 2022 erhalten hilfebedürftige Geflüchtete aus der Ukraine Leistungen nach SGB II oder SGB XII, also Bürgergeld oder Sozialhilfe. Diese Entscheidung wurde damals von der Ampel getroffen, aber von der CDU/CSU grundsätzlich mitgetragen. Warum? Weil es um schnelle Hilfe ging, um Integration von Anfang an und weil das SGB II – bei allen Schwächen – etablierte …
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 7. Dr. Till Steffen (BÜNDNIS 90/DIE GRÜNEN) — Rede ID211404300

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Dr. Till Steffen (Bündnis 90/Die Grünen) nutzt die schnelle Debattenabfolge als „Brennglas" für die Parteienkonstellationen: Er entlarvt die AfD-Migrationssündenbockstrategie (tatsächlich steigt Wohnraumnutzung pro Kopf schneller als Zuwanderung), kritisiert die CDU/CSU scharf für die Logik garantierter Investor-Gewinne (nicht Staatsaufgabe) und wirft der Koalition Zerfall vor — SPD fordert mehr, Union setzt sich durch, selbst die 2014er Grenze-Verschiebung für Neubau-Ausnahmen findet sich nicht im verabschiedeten Entwurf wieder. Er stimmt dem CDU/CSU-SPD-Gesetzentwurf zu (besser als keine Verlängerung), sieht aber nur im grünen Faire-Mieten-Gesetz wirksamen Schutz: Mietpreisbremse ohne Ausnahmen, Kontrolle des willkürlich genutzten Eigenbedarfs als Kündigungswaffe, Bestätigung durch den Mieterbund in der Anhörung.

**Highlighted snippet:** "...ie schnelle Debattenabfolge als „Brennglas" für die Parteienkonstellationen: Er entlarvt die AfD-Migrationssündenbockstrategie (tatsächlich steigt Wohnraumnutzung pro Kopf schneller als Zuwanderung), kritisie..."

### Originaltext (Auszug, 4409 Zeichen total)

```
ent ändern. Es ist auch absolut legitim, dass der Gesetzgeber natürlich darauf reagiert, wenn sich etwas ändert. Wenn der Schutz von Mieterinnen und Mietern nicht ausreicht und wir zu stark steigende Mieten haben, dann ist es die Aufgabe des Staates, zu reagieren. Und dann kann man nicht sagen: Oh, da können wir auf keinen Fall irgendeine Gewinnerwartung gefährden.
Und dann sehen wir, dass die Koalition nicht zusammensteht, weil Sie entgegenstehende Reden halten. Die SPD macht deutlich, dass man an ganz vielen Punkten mehr machen müsste, und stellt noch einiges in Aussicht. Aber die Bilanz ist leider frustrierend. Die Mietpreisbremse, die 2014 eingeführt wurde, sollte nur Ausnahmen vorsehen für Gebäude, die direkt danach gebaut worden sind. 2014 war also die Grenze. Und letzte Woche hat die Ministerin gesagt, es wäre vielleicht einmal Zeit, diese Grenze zu verschieben. Nicht einmal das findet sich jetzt in dem heute zu verabschiedenden Gesetzentwurf wieder. Man vollzieht nicht einmal nach, dass seitdem ein paar Jahre vergangen sind. Das lässt Schlechtes ahnen für das, was Sie in der Kommission vorhaben. Wir wünschen Ihnen viel Erfolg, aber die Sorge ist, dass sich die Union hier massiv durchsetzt. Es wurde gerade auch deutlich gemacht, weiter geht es in Wahrheit nicht in dieser Koalition.
Dann haben wir Die Linke. Die ist wortreich bei dem Thema unterwegs, fordert den Mietenstopp, hat aber dazu nicht einmal einen Gesetzentwurf vorgelegt. Das wäre ja wichtig, weil sich ein paa
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 8. Michael Kellner (BÜNDNIS 90/DIE GRÜNEN) — Rede ID212208100

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Michael Kellner (Grüne) verteidigt die Energiewende gegen die Merz-Regierung und richtet einen direkten Appell an Kanzler und Energieministerin Reiche: 3,5 Millionen Solaranlagen-Besitzer und über 1 Million Balkonkraftwerk-Nutzer hätten private Mittel in Klimaschutz und Unabhängigkeit von fossilen Importen investiert – die Regierung sollte dafür danken statt zu bremsen. Er entlarvt die geplante Energiewende-Verzögerung als falsche Interpretation ('gesicherte Leistung' heißt nicht allein Gas) und fordert: Stromsteuer senken, Netze digitalisieren, Monitoring-Bericht unzensiert vorlegen, Technologieoffenheit (Batterien, Wasserstoff, Biomasse) statt Gas-Fokus, und die von Habeck vorbereitete Kraftwerksstrategie schnell umsetzen — um billigen sauberen Strom für E-Mobilität, KI-Rechenzentren und Grundstoffindustrie zu sichern.</zusammenfassung_2_saetze> </invoke>

**Highlighted snippet:** "...en Importen investiert – die Regierung sollte dafür danken statt zu bremsen. Er entlarvt die geplante Energiewende-Verzögerung als falsche Interpretation ('gesicherte Leistung' heißt nicht allein Gas) und for..."

### Originaltext (Auszug, 5848 Zeichen total)

```
er Kanzler sagt, er komme nächste Woche. Ministerin Reiche sagt, er liege ihr noch gar nicht vor. Ich vermute, er wird gerade umgeschrieben. Legen Sie uns den Bericht doch im Bundestag vor, unzensiert! Lassen Sie uns diskutieren! Ich würde mich darüber freuen. Doch ich fürchte, Sie wollen den Bericht als Vorwand zur Rückkehr zu teurem Gas nutzen.
Sie sagen, der Strombedarf in unserem Land würde bis 2035 vielleicht weniger schnell steigen als angenommen. Ich frage Sie: Geben Sie den Hochlauf der E-Mobilität auf? Geben Sie auf, dass energieintensive Rechenzentren, KI-Rechenzentren, keinen Bogen um Deutschland machen? Geben Sie auf, dass wir eine dekarbonisierte Grundstoffindustrie hier in Deutschland haben? Rechnen Sie einfach mit einer dauerhaft schwachen Konjunktur, nach dem Motto: „Wenn die Wirtschaft schwächelt, können wir ja direkt das Licht ausmachen“? Das ist doch Wahnsinn! Deswegen setzen wir auf eine Elektrifizierung in unserer Gesellschaft.
Dass günstiger Strom da ist, ist doch gerade eine Voraussetzung dafür, dass Deutschland ein modernes Industrieland bleibt. Und wenn der Strombedarf 2035 geringer wäre, dann ist es doch besser, wenn wir mehr sauberen und weniger dreckigen fossilen Strom anwenden. Studien zeigen uns: Der Ausbau der Erneuerbaren senkt den Strompreis.
Robert Habeck hat die Altmaier-Delle ausgebügelt.
Jetzt droht die Reiche-Lücke. Es ist dann Ihre Verantwortung, wenn Deutschland in einigen Jahren zu wenig sauberen Strom hat.
Sie sagen, Sie wollen Kosten
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 9. Dr. Zoe Mayer (BÜNDNIS 90/DIE GRÜNEN) — Rede ID212310600

- **Tonalität:** polemisch
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Dr. Zoe Mayer (Grüne) greift den BMEL-Haushalt als Museum-würdig an und entlarvt die Verbotsanträge zu veganen Bezeichnungen (Veggieburger, Tofuwurst) als systematische Fleisch-Protektionismus durch Doppelstandards: während bei veganen Produkten künftig maximum Transparenz gefordert wird, plant die Koalition (CDU/CSU) die Abschaffung der verbindlichen Tierhaltungs-Kennzeichnung beim Fleisch — „Das ist Fleischideologie". Sie fordert stattdessen echte Investitionen in den Umbau der Tierhaltung (Programm soll gestrichen werden) und die versprochene Finanzierung der Tierheime (0 Euro bisher), da niemand eine Industrie mit dieser Untätigkeit verteidigen könne.

**Highlighted snippet:** "...Dr. Zoe Mayer (Grüne) greift den BMEL-Haushalt als Museum-würdig an und entlarvt die Verbotsanträge zu veganen Bezeichnungen (Veggieburger, Tofuwurst) als systematische Fleisch-Protektionismus durch D..."

### Originaltext (Auszug, 3384 Zeichen total)

```
che Produkte von Fleisch zu unterscheiden: annähernd unmöglich.
Dafür gibt es genau zwei mögliche Begründungen, nämlich entweder, dass die Konservativen glauben, dass Menschen, die Fleisch kaufen, so dumm sind, dass sie es nicht mal hinkriegen, ein „Vegan“-Label, ein „Vegetarisch“-Label, den Namen des Produkts oder eben auch das Kleingedruckte zu lesen, oder – und das ist viel wahrscheinlicher – es geht darum, pflanzliche Produkte auf dem Markt systematisch zu diskriminieren, um die Fleischwirtschaft zu schützen.
Und die Fleischwirtschaft hat ein riesiges Imageproblem. Man muss sagen: zu Recht; denn Tiere in Deutschland werden zum großen Teil nicht gut gehalten, und das wissen die Verbraucherinnen und Verbraucher und wünschen sich das anders.
Konsequent wäre es doch, jetzt mal richtig Geld für den Umbau der Tierhaltung bereitzustellen. Aber das Gegenteil ist der Fall: Der Minister kündigt an, es gibt künftig gar kein Geld mehr für den Umbau der Tierhaltung; das Programm soll gestrichen werden.
Was für eine Ironie!
Dann gibt es auch noch die Lösung: einfach weniger Transparenz beim Fleisch. Die Länder planen jetzt ja auch noch – über CDU und CSU –, die verbindliche Tierhaltungskennzeichnung abzuschaffen.
Lassen Sie sich das auf der Zunge zergehen: mehr Transparenz bei den veganen Produkten, weniger beim Fleisch. Wen wollen Sie für dumm verkaufen? Das ist Fleischideologie.
Wenn künftig dann wieder der beleidigte Herr Söder mit seiner Wurst im Mund vor einem Instagram-Video sitz
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 10. Luke Hoß (Die Linke) — Rede ID211105100

- **Tonalität:** sozial_anklagend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Luke Hoß (Die Linke) attackiert den AfD-Gesetzentwurf mit scharfem Sarkasmus: statt Zwölfjährige „in den Knast zu stecken" braucht es Stärkung der Kinder- und Jugendhilfe, pädagogische Angebote und Familienunterstützung — wissenschaftlich belegt durch niedrigere Rückfallquoten. Er entlarvt die AfD-Position als „sinnlose Demonstration von Stärke und Macht" und wirft ihr Zyanismus vor, das Kindeswohl als Begründung zu missbrauchen (Grenzschutz mit Schusswaffen gegen Kinder, Spezialanstalten, erzwungene Geschlechtswahl), beendet mit einem impliziten NS-Vergleich: „Wer hat denn in der Geschichte dieses Landes zuletzt die Strafmündigkeit auf zwölf Jahre gesenkt?"

**Highlighted snippet:** "...lienunterstützung — wissenschaftlich belegt durch niedrigere Rückfallquoten. Er entlarvt die AfD-Position als „sinnlose Demonstration von Stärke und Macht" und wirft ihr Zyanismus vor, das Kindeswohl als Begr..."

### Originaltext (Auszug, 2332 Zeichen total)

```
Jugendlichen geschehen nicht mit Überlegung oder Strategie, sie geschehen spontan und unüberlegt.
Sie wollen nicht die Ursachen bekämpfen. Sie wollen nicht, dass sich etwas zum Besseren verändert. Seien Sie doch ehrlich: Sie wollen immer nur Strafe, Strafe, Strafe – ist das primitiv; meine Güte!
Wer solche Taten wirklich verhindern will, muss die Kinder- und Jugendhilfe stärken,
mit pädagogischen Angeboten Hilfe leisten, die Eltern und Kinder benötigen. Das führt zu einer geringeren Rückfallquote als Inhaftierungen.
Schon jetzt können Jugendämter und Familiengerichte auch auf Straftaten von Strafunmündigen reagieren. Hierbei steht im Mittelpunkt, wie den Betroffenen künftig ein straffreies Leben ermöglicht werden kann. Was die AfD hier vorhat, ist die sinnlose Demonstration von Stärke und Macht auf Kosten junger Menschen. Die Wahrheit ist: Es geht Ihnen nie um junge Menschen.
Dem Ganzen setzt die Zielsetzung des Entwurfs noch einen drauf. Ein Meister des Zynismus muss da am Werk gewesen sein. Dem Kindeswohl solle es dienen, Kinder schon mit zwölf Jahren in den Knast zu stecken. Sie wollen an deutschen Grenzen auch gegen Kinder – ich zitiere – „von der Schusswaffe Gebrauch machen“. Sie wollen Kinder und Jugendliche ohne ihre Eltern in Kriegsgebieten verkümmern lassen – übrigens etwas, was die Koalition diese Woche umsetzt. Schämen sollten Sie sich, und zwar alle!
Sie wollen auffällige Schüler/-innen in sogenannten Spezialanstalten unterbringen. Sie wollen Jugendliche zwingen, 
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 11. Sascha Wagner (Die Linke) — Rede ID212201000

- **Tonalität:** sozial_anklagend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Sascha Wagner (Die Linke) charakterisiert das 100-Milliarden-Infrastrukturgesetz als „Befreiungsschlag" in der Rhetorik, entlarvt ihn aber als Feigenblatt: ohne bindende Mindestquote für Kommunen (die gestrichene 60-Prozent-Quote) kämen viele Gemeinden nicht zu Mitteln; für NRW bedeute das nur 875 Millionen pro Jahr bei einem Investitionsstau von 50 Mrd Euro. Die zentrale Anklage: Kommunen schultern ein Viertel aller Staatsausgaben, erhalten aber nur ein Siebtel der Steuereinnahmen — eine strukturelle Ungerechtigkeit, die durch Ad-hoc-Pakete nicht zu lösen ist. Wagner fordert eine faire Neuordnung der Steuerverteilung, einen umfassenden Investitionspakt und Verlässlichkeit statt jährlicher Unsicherheiten; zum Schluss eine Wahlaufruf-Spitze gegen die eigene NRW-Landtagsfraktion und die Grünen.

**Highlighted snippet:** "... das 100-Milliarden-Infrastrukturgesetz als „Befreiungsschlag" in der Rhetorik, entlarvt ihn aber als Feigenblatt: ohne bindende Mindestquote für Kommunen (die gestrichene 60-Prozent-Quote) kämen viele Gemein..."

### Originaltext (Auszug, 3162 Zeichen total)

```
r Bevölkerung. Der Investitionsstau beträgt allein in NRW 50 Milliarden Euro.
Man muss kein Rechenkünstler sein, um einzusehen, dass sich mit 875 Millionen Euro im Jahr nicht viel reißen lässt.
Insgesamt belastet ein riesiger Investitionsstau von über 200 Milliarden Euro unsere Städte und Gemeinden – eine Hypothek, die jeden Spielraum im Alltag einschränkt. Zudem bleibt das Grundproblem der Kommunen trotz Sondervermögen bestehen: Allein im Jahr 2024 verbuchten sie ein Minus von fast 25 Milliarden Euro, Tendenz steigend, und das, obwohl die Kommunen ein Viertel aller Staatsausgaben schultern. Im Gegenzug erhalten sie aber nur ein Siebtel der Steuereinnahmen. Das ist eine Schieflage, die nicht länger tragbar ist und die Kommunen immer weiter in den Abgrund reißt.
Es sind aber die Kommunen, die die Feuerwehren und Rettungsdienste finanzieren müssen. Es sind die Kommunen, die dafür Sorge tragen, dass das Schulklo nicht leckt. Es sind die Kommunen, die für die Wasser- und Energieversorgung zuständig sind. Es sind die kommunalen Verwaltungen, die ganz konkret für die Bürgerinnen und Bürger Verantwortung übernehmen. Und gerade dort vor Ort entscheidet sich, ob Politik Vertrauen gewinnt oder verliert, meine Damen und Herren.
Und was bekommen die Kommunen nun im Gegenzug? Feigenblätter statt Reformen, Zwischenlösungen statt Verlässlichkeit. Das ist kurzsichtig und gefährlich für unsere Städte und für die soziale Infrastruktur. Die Kommunalfinanzen müssen endlich neu und verlässlich au
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 12. Christian Görke (Die Linke) — Rede ID212202900

- **Tonalität:** ironisch_jugendlich
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Christian Görke (Die Linke) nutzt in einer Zwischenfrage sarkastisch ein FAZ-Zitat vom 19.07.2023, in dem Söder das Ende der Mehrwertsteuer auf Grundnahrungsmittel fordert, um den CDU/CSU-Redner Dorn auf einen programmatischen Selbstwiderspruch hinzuweisen. Mit ironischer Schärfe fragt er, ob die Union nun ihre Argumente überdenke — „oder irrt Herr Söder wie in vielen anderen Fällen auch?" — und entlarvt damit eine mögliche Inkonsistenz zwischen CSU-Positionen 2023 und aktuellem CDU/CSU-Verhalten in der Koalition.

**Highlighted snippet:** "...nte überdenke — „oder irrt Herr Söder wie in vielen anderen Fällen auch?" — und entlarvt damit eine mögliche Inkonsistenz zwischen CSU-Positionen 2023 und aktuellem CDU/CSU-Verhalten in der Koalition...."

### Originaltext (Auszug, 654 Zeichen total)

```
Vielen Dank, Frau Präsidentin. – Sehr geehrter Herr Dorn, vielen Dank, dass Sie die Zwischenfrage zulassen. Es wird Sie nicht verwundern, was ich jetzt frage. Ich bin ja nun auch schon ein paar Monate in diesem Bundestag. Ich möchte einfach mal aus der „Frankfurter Allgemeinen“ vom 19.07.2023 zitieren,
also noch nicht so lange her: „Söder fordert Ende der Mehrwertsteuer auf Grundnahrungsmittel“. Wenn ich das richtig verstanden habe, ist das ja nach wie vor Ihre Programmatik.
Deshalb würde ich einfach fragen wollen, ob Sie jetzt alle Ihre Argumente vielleicht noch mal überdenken. Oder irrt Herr Söder wie in vielen anderen Fällen auch?
Vielen Dank.
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 13. Dr. Philipp Rottwilm (SPD) — Rede ID211008500

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Dr. Philipp Rottwilm (SPD) lehnt den dritten AfD-Antrag zur Soli-Abschaffung ab und entlarvt ihn durch drei Belege: das Bundesverfassungsgericht habe den Soli im März bestätigt ('heiße Luft'), die SPD entlaste die Wirtschaft mit 12 Mrd Euro gezielter als die AfD mit 7 Mrd, und 90 Prozent der Steuerzahler zahlten seit 2019 gar keinen Soli mehr — nur Spitzenverdiener ab 89.000 Euro brutto/Jahr. Er adressiert direkt arbeitende Bürger und wirft der AfD vor, sich als 'Partei des kleinen Mannes' darzustellen, während sie faktisch 'eine radikale Lobbypartei für Spitzenverdiener' sei, die auch Erbschaftsteuer streichen und Mindestlohn nicht erhöhen wolle.</zusammenfassung_2_saetze> </invoke>

**Highlighted snippet:** "...Philipp Rottwilm (SPD) lehnt den dritten AfD-Antrag zur Soli-Abschaffung ab und entlarvt ihn durch drei Belege: das Bundesverfassungsgericht habe den Soli im März bestätigt ('heiße Luft'), die SPD entlaste di..."

### Originaltext (Auszug, 2795 Zeichen total)

```
sen. Wieder mal alles heiße Luft!
Zweitens. Sie behaupten, Sie wollten mit der Abschaffung des Solis die Wirtschaft um 7 Milliarden Euro entlasten. Wir entlasten die Wirtschaft mit unserem Wachstumsbooster, über den heute Morgen hier im Haus debattiert wurde, um 12 Milliarden Euro. Unsere Entlastungen sind also deutlich höher, und sie sind auch zielgerichteter.
So, meine sehr verehrten Damen und Herren, bringen wir unsere Wirtschaft wieder nach vorne.
Drittens. Sie sprechen von Entlastung der Bürger. Aber 90 Prozent der Steuerzahler zahlen längst keinen Soli mehr.
Das haben wir schon 2019 geändert. Nur die 10 Prozent Spitzenverdiener, also wer mehr als 89 000 Euro brutto im Jahr verdient, sind noch betroffen. Obwohl durch Ihren Antrag also wieder nur die höchsten Einkommen im Land entlastet würden, ist er Ihnen so wichtig, dass Sie damit nun schon zum dritten Mal hier stehen.
Ich finde das bemerkenswert, liebe Kolleginnen und Kollegen. Deswegen möchte ich mich einmal direkt an die Menschen, die diese Debatte verfolgen, wenden. Sie, die morgens früh aufstehen, die Schicht übernehmen, den ganzen Laden hier am Laufen halten, sich abrackern, fragen Sie sich einmal: Haben Sie mehr als 7 400 Euro im Monat? Haben Sie mit Ihrem Partner oder Ihrer Partnerin zusammen mehr als knapp 15 000 Euro im Monat? Wenn nicht – und das sind 90 Prozent der Menschen in diesem Land –, dann muss Ihnen eines klar sein: Für Sie arbeitet diese AfD nicht!
Der großen Mehrheit der arbeitenden Bevölkerung hi
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 14. Dr. Philipp Rottwilm (SPD) — Rede ID211316900

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Dr. Philipp Rottwilm (SPD) greift den AfD-Antrag zur Streichung planungsrechtlicher Ausnahmen für Flüchtlingsunterkünfte als „reinen Populismus" an: Als ehemaliger Bürgermeister zeigt er faktisch auf, dass die Streichung nicht Flüchtlinge trifft, sondern Kommunen zwingt, Turnhallen, Jugendherbergen und Wohnungen zu blockieren, die anderen bürgern fehlten — „das ist nicht sozial, das ist zynisch". Er entlarvt die AfD-Heuchelei (gleichzeitig Bürokratieabbau fordern, aber hier mehr Bürokratie wollen) und belegt mit Daten: Asylanträge sind auf 8.000/Monat (Mai 2025) gesunken, auf Vorkrisenniveau von 2013 — „unsere Politik wirkt". Der Antrag sei überdies überflüssig, da die Ausnahmeregelung 2027 automatisch ausläuft.

**Highlighted snippet:** "...eren, die anderen bürgern fehlten — „das ist nicht sozial, das ist zynisch". Er entlarvt die AfD-Heuchelei (gleichzeitig Bürokratieabbau fordern, aber hier mehr Bürokratie wollen) und belegt mit Daten: Asylan..."

### Originaltext (Auszug, 4856 Zeichen total)

```
nd. Das ist nicht nur teuer. Genau diese Einrichtungen fehlen dann den Menschen in unseren Städten und Gemeinden: die Turnhalle für den Schulsport – Sie haben es eben selbst gesagt –, die Jugendherberge für die Klassenfahrt und die Wohnung für die junge Familie. Was Sie fordern, trifft also nicht nur die Geflüchteten – das ist eben ausgeführt worden –, sondern belastet auch die Menschen vor Ort. Dies führt nicht dazu, dass es den Menschen besser geht, sondern sie leiden unter Ihren Vorschlägen. Das ist nicht sozial, das ist zynisch, meine Damen und Herren!
Eines finde ich bei Ihrem Antrag wieder besonders absurd. Gerade Sie von der AfD rufen ja bei jeder Gelegenheit nach Bürokratieabbau. Aber hier wollen Sie plötzlich mehr Vorschriften, mehr Hürden, mehr Formalismus. Es kann Ihnen gar nicht bürokratisch genug sein. Ein Schelm, wer Böses dabei denkt!
Da zeigt sich wieder Ihr wahres Gesicht: Sie wollen unseren Staat nicht verbessern, Sie wollen ihn spalten.
Wir dagegen bringen gerade den Bauturbo auf den Weg und schaffen damit Planungserleichterungen auch für den allgemeinen Wohnungsbau. Die AfD will mehr Bürokratie für unsere Gemeinden und Bauämter. Wir dagegen entlasten sie, damit schneller, einfacher und im großen Stil neuer Wohnraum entstehen kann. Und die aktuell geltenden Sonderregeln im Baugesetzbuch sind keine Einladung zur Massenzuwanderung, wie Sie sagen, sondern ein pragmatisches Werkzeug für unsere Kommunalpolitik – wir haben das eben gehört –, ein Werkzeug, das uns
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## 15. Rasha Nasr (SPD) — Rede ID211411600

- **Tonalität:** konfrontativ_belegend
- **Wertendes Verb in Summary:** `entlarvt`
- **Verb-Stamm im Original:** ✗ NEIN — Sprecher nutzt diesen Wortstamm nicht

### Zusammenfassung (LLM-generiert)

> Rasha Nasr (SPD) wendet sich in scharfer Konfrontation gegen den AfD-Antrag zur totalen Streichung des Bürgergeldanspruchs für ukrainische Geflüchtete und entlarvt ihn als populistische Stimmungsmache, die Schutzsuchende gegen sozial Schwache ausspielen soll. Sie setzt dagegen ein Bekenntnis zu gelebter Menschlichkeit, zu verfassungsrechtlich verantwortbarer Gesetzgebung (gezielter Rechtskreiswechsel ab 1. April 2025) und zu fairer Integration ukrainischer Kriegsflüchtlinge durch klare Verfahren statt Ausgrenzung — und kritisiert die AfD scharf: „Der AfD geht es nicht um Lösungen, es geht ihr um Stimmungsmache."

**Highlighted snippet:** "... zur totalen Streichung des Bürgergeldanspruchs für ukrainische Geflüchtete und entlarvt ihn als populistische Stimmungsmache, die Schutzsuchende gegen sozial Schwache ausspielen soll. Sie setzt dagegen ein B..."

### Originaltext (Auszug, 3239 Zeichen total)

```
pielen. Die Aufnahme der Menschen aus der Ukraine seit dem Angriff Russlands stellt unser Land vor Herausforderungen; das wissen wir.
Deshalb ist mir das Folgende sehr wichtig: Ich möchte mich bei den vielen Menschen in unserem Land für ihre Solidarität, ihre Hilfsbereitschaft und ihre Offenheit gegenüber den Geflüchteten aus der Ukraine bedanken. Ob als ehrenamtliche Helferin, als Nachbarn, als Arbeitgeber oder einfach als Mitbürgerin: Sie alle haben dazu beigetragen, dass Deutschland ein sicherer Zufluchtsort für Menschen in Not ist.
Diese gelebte Menschlichkeit, dieses Verantwortungsbewusstsein: Das macht unser Land aus!
Politik hat die Aufgabe, diesen Zusammenhalt gegen Zynismus, Ausgrenzung und das Gift der Verächtlichmachung zu schützen. Wir haben im Koalitionsvertrag vereinbart, den sogenannten Rechtskreiswechsel für neueinreisende ukrainische Kriegsflüchtlinge mit Stichtag 1. April 2025 zu beenden. Aber, meine Damen und Herren, zwischen einer gezielten Anpassung in einem verantwortungsvoll ausgehandelten Koalitionsvertrag und der Radikalität dieses AfD-Antrags liegen Welten.
Die AfD fordert einen kompletten Ausschluss vom Bürgergeldbezug für alle Ukrainer, eine rückwirkende Umstellung laufender Leistungen und sogar eine dauerhafte Sperre für den Zugang zum Bürgergeld für sämtliche Geflüchtete, egal aus welchem Land, egal unter welchen Umständen.
– Da kommt Applaus aus der AfD-Fraktion. Sie sind so peinlich. – Das ist nicht nur sozialpolitisch kalt, es ist integrations
```

### Bewertung

☐ legitim    ☐ Grenzfall    ☐ echter Bias

Begründung:

---

## Auswertung

| Rate | Anzahl von 15 |
|---|---:|
| ✅ legitim | _ |
| ⚠️ Grenzfall | _ |
| ❌ echter Bias | _ |

**Direction-Pattern:**
- AfD-`skandalisiert`: _ legitim / _ Grenzfall / _ Bias
- SPD/Linke/Grüne/CDU-`entlarvt`: _ legitim / _ Grenzfall / _ Bias

**Schluss:**
