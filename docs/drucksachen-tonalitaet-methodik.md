# Drucksachen-Tonalität — Methodik

**Stand:** 2026-05-26
**Geltungsbereich:** alle Bundestags-Drucksachen der WP 21 (ab 31.03.2025), klassifiziert per LLM (Haiku 4.5) in `drucksache_analyses.tonalitaet`. Berlin-Pendants (`berlin_drucksachen_analyses`) folgen demselben Schema.

---

## Grundprinzip: Stil markieren, nicht Substanz bewerten

Die Tonalitäts-Klassifikation beschreibt den **rhetorischen Grundton** einer Drucksache — nicht die Wahrheit, Belastbarkeit oder politische Berechtigung der enthaltenen Aussagen. Beispiel: eine Anfrage kann formal `kritisch` gestellt sein, ohne dass die Kritik methodisch oder politisch trifft; eine Antwort kann formal `substantiell` ausfallen, ohne dass die genannten Zahlen die gestellte Frage tatsächlich beantworten.

Diese Trennung ist absichtlich: das Schema soll dem/der Leser:in einen **strukturierten Zugang** öffnen, nicht eine vorgefertigte Wertung anbieten. Wer aus dem Stil-Label inhaltliche Urteile ableitet, missbraucht das Etikett.

---

## Bewusster Verzicht auf normative Etiketten

Es gibt **keine** Kategorie wie „skandalisierend", „demagogisch", „desinformierend", „verschwörungstheoretisch" — und es wird auch keine eingeführt.

Begründung: Solche Etiketten setzen eine plattform-interne Operationalisierung von Wert-Urteilen voraus. Selbst sorgfältige Definitionen können in der Anwendung über Tausende Drucksachen nicht konsistent bleiben, und das Risiko, dass dieselbe Sprache je nach Fraktion unterschiedlich klassifiziert wird, ist real (siehe historischen v1-Bias in der Reden-Klassifikation, dokumentiert in [`docs/reden-methodology.md`](reden-methodology.md)).

Wer externe Operationalisierungen von „skandalisierend" oder verwandten Kategorien beiträgt, kann diese als zusätzlichen Layer mit Quellen-Attribution einbringen — als Forschungs-Beitrag, nicht als plattform-eigene Wertung.

---

## Klassen-spezifische Tonalitäts-Enums

Jede Drucksachen-Klasse (`batch_class`) verwendet ein eigenes Subset, weil die rhetorischen Möglichkeiten klassen-spezifisch sind: eine Bundesregierungs-Antwort kann nicht „fordernd" sein, ein Bericht nicht „ausweichend".

| `batch_class` | Drucksachen-Typen | Tonalitäts-Enum |
|---|---|---|
| `klein` | Kleine Anfragen, Schriftliche Fragen (~2.000 Stück in WP21) | `sachlich`, `fordernd`, `kritisch`, `informierend` |
| `mittel` | Berichte, Unterrichtungen | `sachlich`, `informierend`, `mahnend` |
| `gross` | Gesetzentwürfe, Große Anfragen | `sachlich`, `fordernd`, `kritisch` |
| `antwort` | Antworten der Bundesregierung auf Schriftliche Anfragen | `substantiell`, `teilantwortend`, `ausweichend` |
| `regierung` | Regierungs-Drucksachen, EU-Vorlagen | `sachlich`, `informierend` |

Insgesamt 8 distinct Tonalitäten über alle Klassen.

---

## Label-Definitionen (mit Anti-Definition)

### `sachlich`
- **Was es ist:** Neutraler Frage- oder Darstellungston ohne wertende Färbung; Fokus auf Beschaffen-von-Informationen oder Beschreibung. Vorbemerkung verzichtet auf rhetorische Aufladung.
- **Was es NICHT ist:** Keine Aussage über die Wichtigkeit, Tiefe oder Belastbarkeit des Anliegens. Eine `sachliche` Anfrage kann fachlich oberflächlich sein; eine „polemische" Anfrage kann faktisch korrekt sein.

### `fordernd`
- **Was es ist:** Erkennbar handlungs-orientiert: enthält explizite Forderungen, „muss"/„soll"-Konstruktionen, Aufforderung zur Stellungnahme oder Maßnahme.
- **Was es NICHT ist:** Kein Urteil darüber, ob die Forderung berechtigt, durchsetzbar oder verfassungsgemäß ist.

### `kritisch`
- **Was es ist:** Eine gegen die Regierung oder eine Institution gerichtete Stoßrichtung; bestreitet, hinterfragt, zieht in Zweifel. Häufig in der Vorbemerkung erkennbar.
- **Was es NICHT ist:** Keine Aussage darüber, ob die Kritik gerechtfertigt ist oder ob die Belege tragen. „Kritisch" markiert Tonfall, nicht Wahrheitsgehalt.

### `informierend`
- **Was es ist:** Anliegen, Bericht oder Anfrage primär zur Bestandsaufnahme — Daten beschaffen, Stand erfragen, Sachverhalt darlegen. Weniger als Konfrontation, mehr als Recherche.
- **Was es NICHT ist:** Keine Wertung über die Tiefe oder Vollständigkeit der erbetenen Information.

### `mahnend`
- **Was es ist:** Verbindet Bericht oder Darstellung mit ausdrücklichem Apell — Warnung, Erinnerung, Aufforderung zur Verhaltensänderung. Häufig bei Berichten zu strukturellen oder gesellschaftlichen Problemen.
- **Was es NICHT ist:** Keine Aussage über die Berechtigung oder Dringlichkeit der Mahnung.

### `substantiell` (nur in `antwort`)
- **Was es ist:** Konkrete Zahlen, Daten, Sachverhalte werden geliefert; Antwort geht auf die gestellten Fragen ein.
- **Was es NICHT ist:** Keine Aussage, ob die Zahlen oder Sachverhalte die Frage *vollständig* oder *zutreffend* beantworten. Auch eine substantielle Antwort kann selektiv informieren.

### `teilantwortend` (nur in `antwort`)
- **Was es ist:** Antwort beantwortet einen Teil der Fragen, lässt andere offen — oft mit Verweis auf laufende Verfahren oder fehlende Datengrundlagen.
- **Was es NICHT ist:** Kein Vorwurf, dass die Antwort verweigert wurde — manche Datenlagen sind tatsächlich nicht abrufbar.

### `ausweichend` (nur in `antwort`)
- **Was es ist:** Antwort weicht der konkreten Frage strukturell aus: vorwiegend Verweise, generische Bezugnahmen, Hinweise auf Zuständigkeiten anderer Stellen, oder explizite Datenlücken.
- **Was es NICHT ist:** Keine moralische Wertung; manche Ausweichungen sind verfahrenstechnisch oder verfassungsrechtlich (z.B. laufende Ermittlungsverfahren) begründet.

---

## Methodische Grenzen

1. **Klassen-Subset-Trennung:** Eine Drucksache kann nur das Subset ihrer `batch_class` bekommen. Cross-Klassen-Vergleiche („AfD-Anfragen vs. BReg-Antworten") sind nur eingeschränkt aussagefähig.

2. **Trennschärfe:** `fordernd` und `kritisch` überlappen sprachlich oft — eine Anfrage, die Maßnahmen einklagt, kann beides sein. Im Zweifel klassifiziert das Modell nach dem dominanten Ton.

3. **Drift-Risiko:** Tools-Use-Schema-Locks halten ~99,5 % der LLM-Ausgaben innerhalb des Enums. Drift-Werte sind in `drucksache_analyses.tonalitaet_drift` (separat) und im Audit-Trail dokumentiert.

4. **Datenreihen-Limit:** Aktuell **nur WP21** (Stand 2026-05-26, 14 Monate). Trend-Aussagen über mehrere Wahlperioden hinweg sind mit der aktuellen Datenlage nicht belastbar. Historische DIP-Erweiterung (WP18-20) als Folge-Projekt notiert.

---

## Bezug zur Validierungs-Diskussion (2026-05-26)

Eine externe Rückmeldung von Prof. Dr. Jeanette Hofmann (WZB) hat die methodische Frage aufgeworfen, ob sich „die Intention Kleiner Anfragen weg von Sachfragen hin zu Skandalisierungsanfragen verschiebt". Die Antwort der Plattform:

- **Empirisch in WP21:** über alle Oppositionsfraktionen ~30 % `sachlich`+`informierend`, ~70 % `fordernd`+`kritisch`. AfD liegt mit 24 % `sachlich` sogar an der **Spitze** der Oppositionsfraktionen — der Unterschied liegt im Volumen, nicht im Stil.
- **Trend nicht abbildbar:** Datenreihe zu kurz; siehe „Methodische Grenzen" Punkt 4.
- **Skandalisierung als Stilmerkmal:** wird in diesem Schema nicht eigens klassifiziert — siehe „Bewusster Verzicht auf normative Etiketten" oben. Externe Operationalisierungen (Loaded Language, Unterstellungs-Fragen, Themen-Bezug, Vorbemerkung-vs-Fragen-Diskrepanz) sind als Forschungsbeiträge integrierbar.
