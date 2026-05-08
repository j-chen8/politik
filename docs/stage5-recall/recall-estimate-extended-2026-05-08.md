# Stage-5-Recall — Erweitertes Sample (n=50)

**Stand:** 2026-05-08, nach Sample-Erweiterung
**Ziel:** Belastbarere Recall-Schätzung für Source-Coherence-Pipeline

## Kombiniertes Sample

| Stat | Erstes (n=20) | Zweites (n=30) | Kombiniert (n=50) |
|---|---|---|---|
| Sample-Größe | 20 | 30 | 50 |
| Excluded (Homepage leer/sehr dünn) | 2 (10%) | 10 (33%) | 12 (24%) |
| n_eff | 18 | 20 | 38 |
| ECHT (verified) | 2 | 0 (pending) | 2 |
| POTENTIAL_ECHT (pending) | 0 | 4 | 4 |
| PRAEZ | 4 | 1 | 5 |
| NO_CONFLICT | 12 | 15 | 27 |

## Verifizierte ECHT-Konflikte (Erstes Sample, post-User-Recherche)

1. **Claudia Moll (SPD, id 146801)** — Wiki sagt „seit 2013 stellv. AfA-Vorsitz", Homepage „seit 2015". Jahresfehler.
2. **Armand Zorn (SPD, id 175403)** — Wiki „bis 2021 Projektleiter GIZ", Homepage „Seit 2021 Projektleiter ... Entwicklungszusammenarbeit". Homepage suggeriert irreführend laufende Tätigkeit.

## Neue ECHT-Kandidaten (Zweites Sample, pending User-Recherche)

3. **Daniel Baldy (SPD, id 175416)** — Homepage sagt „seit September 2021 Mitglied im **Verteidigungsausschuss**". Wiki sagt Verteidigungsausschuss erst seit 2025 (21. WP); 2021-2025 war er in Familien+Innen-Ausschuss. Falsche Datums-Anwendung Homepage.
4. **Kassem Taher Saleh (Grüne, id 175594)** — Wiki „2019 Co-Sprecher BAG Migration und Flucht", Homepage „02/2021 bis 11/2021". 2-Jahres-Differenz auf konkreter Position. Analog Moll-Pattern.
5. **Thomas Bareiß (CDU, id 79465)** — Wiki „2010-2014 Stellv. Vorsitz baden-württembergische CDU-Landesgruppe (beendet)", Homepage „seit 2005 Stellv. Vorsitz". 5-Jahres-Differenz beim Beginn + Status-Konflikt (beendet vs aktiv).
6. **Frauke Heiligenstadt (SPD, id 136025)** — 🚨 STÄRKSTER KANDIDAT: Wiki und Homepage beschreiben praktisch UNTERSCHIEDLICHE LEBENSLÄUFE. Stadt, Fachrichtung, Beruf, SPD-Jahr, Landtagsperiode — alles differiert. Möglich: LLM-Extraktion auf falschem Quelltext oder Homepage-Content-Mismatch (Memory: Heiligenstadt hatte Refetch-Fails 2026-04-28).

## Identifizierte Naming-Change-Patterns

Nicht-Konflikte, die wie ECHT aussehen aber durch Organisations-Umbenennungen erklärt werden:

| MdB | Begriff Wiki | Begriff Homepage | Erklärung |
|---|---|---|---|
| Moll | „AG für Arbeit" | „AG für Arbeitnehmerfragen" | SPD-AfA umbenannt 2022 |
| Oest | „Min. für Landesentwicklung" | „Min. für Regionalentwicklung" | SMR→SMIL Reform Dez 2024 |
| Vogel | „HSPV NRW" | „FHöV NRW" | FHöV→HSPV Umbenennung 2016 |

→ **Stage-5-Prompt sollte explizit für diese Patterns sensibilisiert werden.**

## Recall-Schätzung (kombiniertes Sample)

Sei k = bestätigte ECHT-Konflikte. N_eff (unflagged + vergleichbar) ≈ 528 × 0.76 = **~400**.
FN_total = k × (N_eff / n_eff) = **k × 10.5**.

Vergangene Confirmation-Rate von POTENTIAL_ECHT: 50% (2 von 4 in erstem Sample).

| Szenario | k (verified) | FN_total | **Recall** |
|---|---|---|---|
| Best Case (nur erstes Sample) | 2 | ~21 | **19%** |
| 1 von 4 neuen bestätigt | 3 | ~32 | **14%** |
| **Realistisch (50% Rate, 2/4 neu)** | **4** | **~42** | **~11%** |
| 3 von 4 neuen bestätigt | 5 | ~53 | **9%** |
| Worst Case (alle 4 neu bestätigt) | 6 | ~63 | **7%** |

**Hauptbefund (mit größerem Sample):** Recall liegt voraussichtlich im Bereich **9-14%**, mit realistischem Mittelwert **~11%**. Stage 5 (gpt-oss-120b) fängt also etwa **1 von 9 echten Wiki-vs-Homepage-Diskrepanzen**.

**Konfidenzintervall:** Bei k=4 in n_eff=38 ist der 95%-Poisson-CI auf k = [1.1, 10.2], entsprechend Recall-CI = **[4%, 31%]**. Engerer CI bräuchte n=100+.

## Methodische Caveats (verstärkt durch n=50)

1. **Empty-Homepage-Rate ist hoch (24%):** Ein Viertel der MdBs hat keine vergleichbaren Homepage-Daten. Das verschiebt die Recall-Berechnung von „echte Homepage-vs-Wiki-Diskrepanzen" zu „detektierbare Diskrepanzen". Tatsächlicher Recall auf der „echten Population" könnte niedriger sein.

2. **Empty-Cluster-Effekt im 2. Sample (33%):** Mehrere MdBs nutzen AfD-Bundestag-Standardprofile (Braga, Zaum) oder haben minimalistische Eigen-Homepages. Beim ersten Sample war diese Rate nur 10% — das deutet auf Sampling-Varianz hin.

3. **PRAEZ-Pattern dominant:** Mehrere ursprünglich als ECHT klassifizierte Kandidaten sind PRAEZ-Artefakte (Naming-Changes, zwei Berufungen, Detailgrad-Diffs). Real-ECHT-Rate aus User-Recherche bisher: ~50% der Kandidaten.

4. **Heiligenstadt als möglicher Outlier:** Wenn ihre Homepage tatsächlich falschen Content zeigt (oder LLM hat falschen Quelltext extrahiert), ist das eher ein Daten-Pipeline-Problem als ein Wiki-vs-Homepage-Konflikt. Klassifikation evtl. separat.

## Vergleich der zwei Samples

| Metrik | Sample 1 | Sample 2 | Kombiniert |
|---|---|---|---|
| Empty-Rate | 10% | 33% | 24% |
| Pre-User-Candidates | 4 (22%) | 5 (25%) | 9 (24%) |
| Post-User-Confirmed-ECHT | 2 (50%) | TBD | 2-6 |

Die Pre-User-Candidate-Rate ist stabil bei ~24% — relativ konsistent zwischen Samples.

## Verifikations-Aufgabe (User)

4 neue Kandidaten zur Klassifikation analog zu Moll/Zorn-Methode:

1. **Baldy** — Verteidigungsausschuss seit Sept 2021 oder seit 2025?
2. **Taher Saleh** — Co-Sprecher BAG Migration: 2019 oder 2021?
3. **Bareiß** — Stellv. Vorsitz Landesgruppe BW: 2010-2014 oder seit 2005?
4. **Heiligenstadt** — Welcher Lebenslauf stimmt? (möglicher Daten-Pipeline-Bug)

**Empfehlung:** Heiligenstadt zuerst untersuchen — wenn das ein Extraktions-Fehler statt echter Konflikt ist, sollte sie aus dem Recall-Sample entfernt werden (analog zu Empty-Homepage-Excludes).
