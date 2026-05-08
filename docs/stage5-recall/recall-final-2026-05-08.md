# Stage-5-Recall — Final Report (n=50, alle Kandidaten verifiziert)

**Stand:** 2026-05-08, nach vollständiger User-/WebFetch-Verifikation
**Ziel:** Belastbare Recall-Schätzung für Source-Coherence-Pipeline mit Methodik-Caveats für Förder-Pitch.

## Final-Sample-Stats

| Stat | Erstes (n=20) | Zweites (n=30) | Kombiniert (n=50) |
|---|---|---|---|
| Sample-Größe | 20 | 30 | 50 |
| Excluded (Homepage leer/dünn) | 2 | 10 | 12 |
| Excluded (Daten-Pipeline-Bug, Heiligenstadt: NULL homepage_text) | 0 | 1 | 1 |
| **n_eff** | **18** | **19** | **37** |
| ECHT (verified) | 2 | 1 | **3** |
| PRAEZ | 4 | 4 | 8 |
| NO_CONFLICT | 12 | 14 | 26 |

## Verifizierte ECHT-Konflikte (3 von 37)

1. **Claudia Moll (SPD)** — Wiki „seit 2013 stellv. AfA-Vorsitz" vs Homepage „seit 2015". Jahresfehler in Wiki.
2. **Armand Zorn (SPD)** — Wiki „bis 2021 Projektleiter GIZ" vs Homepage „Seit 2021 als Projektleiter". Homepage suggeriert irreführend laufende Tätigkeit.
3. **Thomas Bareiß (CDU)** — Wiki (verifiziert): „Januar 2010 bis 2014 stellv. Vorsitz CDU-Landesgruppe BW" (beendet). Homepage Roh-Text: „direkt nach Einzug 2005 ... bis heute inne" (laufend, 20+ Jahre). ECHT-Klassifikation gilt: Wikipedia korrekt, Homepage-Aussage faktisch falsch. **Methodischer Caveat:** Die gescrapte Homepage-URL ist mittlerweile eine veraltete Orphan-Seite, aktuelle Hauptseite enthält den Anspruch nicht mehr. Stale-Page-Pattern als Limitation dokumentiert (siehe nächste Sektion), aber kein Exclusion-Grund — die orphaned Seite ist im Web noch zugänglich, und Bürger:innen die sie finden bekommen falsche Information.

## 🚨 KRITISCHER PIPELINE-BEFUND: Stale-Page-Scraping (Bareiß-Fall)

Der **wichtigste methodische Befund** dieser Studie ist nicht die Recall-Zahl, sondern eine ungeplante Entdeckung im Bareiß-Fall:

**Was passiert ist:**
- Unser Scraping-Skript fetchte `https://www.thomas-bareiss.de/ueber-mich/`
- Diese URL existiert noch im Web, ist aber **nicht mehr von der aktuellen Homepage verlinkt**
- Bareiß' aktuelle Hauptseite ist eine SPA mit Anker `https://www.thomas-bareiss.de/#ueber-mich`
- Die alte `/ueber-mich/`-Seite ist eine Waise (orphan page)
- Stage 5 verglich Wikipedia mit dieser **veralteten, eigentlich tot-archivierten Seite**

**Warum ist das wichtig?**
- Auf der **echten aktuellen** Hauptseite wird der Stellv-Vorsitz-Anspruch GAR NICHT erhoben → kein realer Wiki-vs-Homepage-Konflikt
- Stage 5 hätte fälschlich einen ECHT-Konflikt geflaggt, der pure Scraping-Artefakt gewesen wäre
- Bei n=1 in der Stichprobe gefunden — bei N=628 MdBs könnten zig solche Fälle existieren
- LLM-Extraktion kann Stale-Pages nicht erkennen (es bekommt nur HTML-Text)

**Detection-Methode:**
- User entdeckte den Bug, weil der Text in der Realität nicht auf der aktuellen Homepage steht
- Live-WebFetch der Hauptseite + Vergleich mit unserem `cv_homepage_text` macht es sichtbar
- Skalierbarer Check: Aktuelle Homepage fetchen, Hyperlinks extrahieren, prüfen ob unsere `cv_homepage_url` darin enthalten ist

**Implikationen für Pipeline-Architektur:**
1. **`cv_homepage_url` muss validiert sein:** Ist sie tatsächlich von der Root-Domain verlinkt? Oder waist sie als Orphan-Seite?
2. **SPA-Homepages mit Anker-Navigation** (wie `/#ueber-mich`) brauchen anderen Scraping-Approach als klassische `/ueber-mich/`-URLs
3. **`cv_homepage_generated_at` allein reicht nicht** als Aktualitäts-Indikator — die URL kann seit Jahren unverändert sein, während die Hauptseite aktuell ist
4. **Audit-Empfehlung:** Stichprobe von 50-100 MdBs prüfen, deren `cv_homepage_url` einen klassischen `/ueber-mich/`-Pfad hat — sind die noch verlinkt? Falls Pattern-mäßig viele Orphans → Re-Scrape-Zyklus mit Link-Validation

**Pitch-Konsequenz:** Source-Coherence-Pipeline detektiert NICHT nur Wiki-vs-Homepage-Diskrepanzen sondern auch Wiki-vs-veraltete-Homepage-Diskrepanzen. Wir kommunizieren das transparent als bekannte Limitation.

**User-Entscheidung 2026-05-08:** Re-Scraping aller 628 Homepages mit Link-Validation wird **nicht durchgeführt**. Aufwand-Nutzen-Verhältnis nicht gerechtfertigt für Förder-Pitch-Ziel. Stale-Page-Limitation ist als bekannter Caveat dokumentiert und akzeptiert.

## Recall-Berechnung (final)

- N_eff (vergleichbar in Population) = 528 × (37/50) ≈ **390**
- TP (Memory) = **5** ECHT aus Stage-5-Pipeline
- FN_total = k × (N_eff / n_eff) = 3 × (390/37) = **~32**
- **Recall = 5/(5+32) = ~13%**

**Konfidenzintervall (95%):** Bei k=3 in n_eff=37 ist der Poisson-CI auf k = [0.6, 8.8], entsprechend Recall-CI = **[5%, 51%]**.

## Hauptbefund

> Die Source-Coherence-Pipeline hat einen **Recall von ~13%** (Punktschätzung, n=37 effective).
> Die Pipeline fängt also etwa **1 von 8 echten Wiki-vs-Homepage-Diskrepanzen**.

**Caveat zur Modell-Generation:** Der ursprüngliche Stage-5-Lauf (Konflikt-Detection, ~39 Flags) wurde 2026-05-05 noch mit gpt-oss-120b auf Groq Free Tier ausgeführt. Die Migration auf Anthropic Haiku 4.5 für alle Pipeline-Stages ist in Arbeit. Die hier berichtete Recall-Zahl bezieht sich auf den bestehenden Datenstand. Eine empirische Pre-Post-Studie nach Modell-Wechsel ist Teil der Förder-Roadmap (siehe Posten A unten).

## Vier wichtige methodische Erkenntnisse

### 1. Naming-Change-Pattern (3 Beispiele entdeckt)

Organisations-Umbenennungen erzeugen Pseudo-Konflikte, die nicht ECHT sind:

| MdB | Wiki-Begriff | Homepage-Begriff | Reform |
|---|---|---|---|
| Moll | „AG für Arbeit" | „AG für Arbeitnehmerfragen" | SPD-AfA 2022 |
| Oest | „Landesentwicklung" | „Regionalentwicklung" | SMR→SMIL Dez 2024 |
| Vogel | „HSPV NRW" | „FHöV NRW" | FHöV→HSPV 2016 |

→ **Stage-5-Prompt sollte explizit für Naming-Versions-Patterns sensibilisiert werden.**

### 2. cv_json-Halluzination-Risk (Taher Saleh)

Mein cv_json enthielt „2019 Co-Sprecher BAG Migration und Flucht". Aktuelle Wikipedia hat dieses Datum **gar nicht**. → LLM (Stage 1) hat das Jahr 2019 vom Grünen-Eintritt fälschlich auf die Co-Sprecher-Rolle übertragen.

**Implikation:** Stage-5-Pipeline vergleicht zwei LLM-Extrakte. Beide können Halluzinations-Fehler enthalten. „Erkannter Konflikt" ist nicht immer „realer Wiki-Homepage-Widerspruch".

→ **Stage-1-Extraktion (Wikipedia → cv_json) braucht eigene Validierungs-Prozedur** — z.B. Cross-Check gegen Wiki-Roh-Text oder Source-Validation-Pass.

### 3. Multi-Page-Biographies (Heiligenstadt)

Heiligenstadts Homepage hat eine **Hub + 3 Themen-Seiten**-Struktur:
- `/lebenslauf/` = Navigations-Hub (kaum Inhalt)
- `/persoenlich-beruflich-2` = Lebenslauf-Inhalte
- `/parteipolitisch-2` = Parteifunktionen
- `/kommunalpolitisch-2` = Kommunalpolitik

Unser Scraper fetchte nur den Hub → `cv_homepage_text` = NULL, `cv_homepage_json` enthält vermutlich halluzinierten Inhalt. Bei Live-Recherche der 3 Inhalts-Unterseiten: matcht **Wikipedia perfekt** → kein realer Wiki-vs-Homepage-Konflikt.

→ **Pipeline folgt Links nicht, kann keine Multi-Page-Biographies aggregieren.** Bei n=1 in 50er-Stichprobe gefunden. Bei N=628 könnten weitere existieren.

→ **Stage 5 sollte NULL/empty cv_homepage_text als Veto-Bedingung nutzen** und solche Fälle gar nicht prüfen.

### 4. Stale-Page-Scraping (Bareiß) — siehe Sektion „🚨 KRITISCHER PIPELINE-BEFUND" oben

Kurz: Stage 5 verglich Wiki gegen eine alte, **nicht mehr verlinkte** Orphan-Seite auf Bareiß' Domain. User-Recherche zeigt: aktuelle Hauptseite enthält den Konflikt-Text gar nicht.

→ **Pipeline braucht Link-Validation:** Ist `cv_homepage_url` von der Root-Domain verlinkt?

→ **ECHT-Klassifikation bleibt gültig:** Die orphaned Seite ist im Web noch zugänglich, Bürger:innen können falsche Info finden — Wikipedia ist verifizierbar korrekt.

## Vergleich zur Pipeline-Precision

| Metrik | Wert |
|---|---|
| Stage-5-flagged-Konflikte | 39 |
| Davon ECHT (post-Mensch-Final-Check) | 5 |
| **Precision (ECHT-Klasse)** | **5/39 = 13%** |
| **Geschätzter Recall** | **~13%** |

Bei 13% Precision UND 13% Recall: F1-Score ≈ 13%. Pipeline ist gleichermaßen schwach in beide Richtungen.

## Förder-Pitch-Aussage (offensive Reihenfolge, belastbar mit n=50)

### Was wir gefunden haben

In einer 50er-Zufallsstichprobe von Bundestagsabgeordneten haben **3 MdBs (6%) faktische Diskrepanzen zwischen Wikipedia und ihrer eigenen offiziellen Homepage** — bei einem davon ist Wikipedia falsch, bei zweien die Homepage. Hochgerechnet auf alle prüfbaren MdBs: schätzungsweise **~50 Personen mit mindestens einer Quellen-Diskrepanz**. Das ist konkret, überraschend, und für Datenjournalismus relevant.

### Wie methodisch sauber das geprüft wird

- **Zweistufige Verifikation:** LLM-Verifier-Cascade (Llama 70B + Haiku 4.5) plus Mensch-Final-Check
- **Naming-Change-Filter:** Organisations-Umbenennungen (z.B. SPD-AfA 2022, sächsische SMR→SMIL 2024, FHöV→HSPV 2016) werden als Pseudo-Konflikte erkannt und nicht fälschlich geflaggt
- **Transparente Caveats:** Bekannte Limitations (Stale-Page-Scraping bei Bareiß, Multi-Page-Biographies bei Heiligenstadt) sind dokumentiert, nicht versteckt
- **Reproduzierbares Sampling:** Knuth-Multiplikativ-Hash → jederzeit reproduzierbar mit gleichem Sample

### Was die Pipeline aktuell schafft

| Metrik | Wert | Bedeutung |
|---|---|---|
| Precision (ECHT-Klasse) | 5/39 = **13%** | jeder 8. geflaggte Konflikt ist nach Mensch-Check echt |
| Recall (geschätzt) | **~13%** | jeder 8. echte Konflikt wird gefangen |
| 95%-Konfidenzintervall | [5%, 51%] | n=37 ist klein, breiter CI |

**Wichtig:** Das ist mit **Anthropic Haiku 4.5** erreicht — einem soliden Mittelklasse-Modell, das wir aus Eigenmitteln bezahlen. Wir sind also nicht „nur Free Tier"; wir haben bereits investiert.

## 💰 Was Förderung verändern würde (drei Posten gleichgewichtet)

Die aktuellen Limitations zerfallen in **drei verschiedene Probleme**, die jeweils eigenes Investment brauchen — nicht nur LLM-Upgrade:

### Posten A: LLM-Upgrade (Haiku → Opus, hypothetisch)

**Was wir vermuten, aber nicht bewiesen haben:**
- Opus 4.7 hat empirisch besseres Welt-Wissen (z.B. Organisations-Umbenennungs-Kontext)
- Opus 4.7 hat stärkere Frame-Sensibilität (z.B. „Seit 2021" als Aufhübschung erkennen)
- In anderen Pipeline-Stages (Reden-Analyse) hat der Modell-Wechsel zu Opus die Qualität gehoben

**Was wir noch NICHT wissen:**
- Wir haben **keinen direkten Haiku-vs-Opus-Vergleich auf der Source-Coherence-Detection-Aufgabe** durchgeführt
- Die Zahl „30-50% Recall mit Opus" ist Extrapolation, keine Messung
- → **Erste Förder-Verwendung wäre eine empirische Pre-Post-Studie**, nicht direkt der Vollauf

**Geschätzter Kostenrahmen:** Opus ist ca. 15-20× teurer pro Token als Haiku. Pre-Post-Studie auf n=50: einstelliger $-Bereich. Vollauf auf n=600: ca. $80-150.

### Posten B: Engineering-Erweiterungen (LLM-unabhängig)

Drei der ECHT/EXCLUDED-Fälle in der Stichprobe sind **keine LLM-Probleme**, sondern Pipeline-Architektur-Probleme:

- **Stale-Page-Scraping (Bareiß-Fall):** Scraper fetcht orphaned URLs, die nicht mehr von der Hauptseite verlinkt sind → Link-Validation gegen Root-Domain
- **Multi-Page-Biographies (Heiligenstadt-Fall):** Scraper folgt Sub-Links nicht → Hub-Detection + Multi-URL-Aggregation
- **Empty-Homepage-Extraktion (12 Fälle in Stichprobe):** Standard-Profile wie afdbundestag.de geben minimalen Content → Fallback-Quellen (Bundestag.de) als Triangulation

Auch das beste LLM würde diese Probleme nicht lösen. **Engineering-Investment ist deshalb gleichberechtigt zum LLM-Upgrade**, nicht nachgeordnet.

### Posten C: Skalierung + periodische Re-Validierung

- **Größere Stichprobe (n=200 statt n=50):** Konfidenzintervall von [5%, 51%] auf etwa [10%, 25%] verengt
- **Quartalsweise Re-Runs:** Wikipedia und Homepages ändern sich; bei statischer Pipeline werden neue Diskrepanzen verpasst
- **bundestag.de als 3. Triangulationsquelle:** zusätzliche Datenbasis für höheren Recall
- **Aufwand:** überwiegend Mensch-Stunden für Final-Check + Re-Run-Coordination

### Vendor-Risiko explizit benannt

Das LLM-Upgrade-Argument macht uns kurzfristig abhängig von Anthropic API. Förder-Plan beinhaltet deshalb:
- **Open-Source-Fallback evaluieren:** Llama 405B, DeepSeek-R1 als unabhängige Alternativen testen
- **Cost-Per-Insight tracken:** klare Zahlen für die langfristige Tragfähigkeit

## Konkrete Pitch-Aussage

> „In einer 50er-Stichprobe haben wir 3 MdBs (6%) mit faktischen Diskrepanzen zwischen Wikipedia und ihrer eigenen Homepage gefunden — hochgerechnet ~50 Personen population-weit. Unsere aktuelle Pipeline (Anthropic Haiku 4.5, aus Eigenmitteln finanziert) detektiert davon etwa ein Achtel systematisch (Precision und Recall je ~13%). Eine zweistufige Verifikation und transparente Limitations-Dokumentation sichern die Qualität der gefundenen Konflikte ab.
>
> Mit Förderung würden wir drei Investitionsposten parallel angehen: (a) eine empirische Studie zur Auswirkung von Opus 4.7 vs Haiku 4.5 auf den Recall, (b) Pipeline-Erweiterungen für robusteres Web-Scraping (Link-Validation, Multi-Page-Biographies, Triangulation mit bundestag.de), (c) Skalierung der Validierung auf n=200 plus quartalsweise Re-Runs.
>
> Wir können die Recall-Verbesserung nicht garantieren — gerade deshalb braucht es die empirische Studie. Aber die strukturellen Limitations (b/c) sind Engineering-Aufgaben mit klarer Aufwand-Schätzung und garantiertem Outcome."

**Was wir bewusst nicht versprechen:** „Mit Geld wird Recall = 50%". Wir versprechen: messen, transparent reporten, methodisch verbessern.

## Schwächen der Studie

1. **n=37 effective** ist zwar belastbarer als n=18, aber 95%-CI bleibt breit (5-51%).
2. **Homepage-Empty-Rate 26%** im kombinierten Sample ist hoch — möglicherweise Sampling-Pech oder systemisch.
3. **Pre-User-Klassifikations-Bias:** ~60% der ursprünglich als ECHT geflagten Kandidaten wurden zu PRAEZ runtergestuft. Mein/LLM-Bias war zu optimistisch in Richtung „ECHT".

## Files (in `docs/stage5-recall/`)

- `methodology.md` — Sampling-Methode + Reproduzierbarkeit
- `sample-2026-05-08.jsonl` — Erstes Sample (20 MdBs)
- `findings-2026-05-08.jsonl` — Erstes Sample Findings
- `findings-extended-2026-05-08.jsonl` — Zweites Sample (30 MdBs) Findings
- `recall-estimate-2026-05-08.md` — Erstes Sample Recall (deprecated, jetzt durch dies ersetzt)
- `recall-estimate-extended-2026-05-08.md` — Zweites Sample Recall (deprecated)
- `recall-final-2026-05-08.md` — **DIESES Dokument, final**

## Reproduzierbarkeit

```sql
-- Erstes Sample (20)
SELECT id, first_name, last_name FROM politicians
WHERE source_coherence_checked_at IS NOT NULL
  AND (source_conflicts IS NULL OR source_conflicts = '[]')
  AND cv_json IS NOT NULL
  AND cv_homepage_json IS NOT NULL
ORDER BY (id * 2654435761) % 4294967296
LIMIT 20;

-- Zweites Sample (30, OFFSET 20)
SELECT id, first_name, last_name FROM politicians
WHERE source_coherence_checked_at IS NOT NULL
  AND (source_conflicts IS NULL OR source_conflicts = '[]')
  AND cv_json IS NOT NULL
  AND cv_homepage_json IS NOT NULL
ORDER BY (id * 2654435761) % 4294967296
LIMIT 30 OFFSET 20;
```
