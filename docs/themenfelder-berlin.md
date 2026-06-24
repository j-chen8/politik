# Themenfelder Berlin — Taxonomie & Methodik

**Stand:** 2026-06-02 · **Status:** Taxonomie festgezurrt, vor Pipeline-Bau
**SoT-Mapping:** [`themenfelder-berlin.mapping.json`](./themenfelder-berlin.mapping.json) (47 Roh-Tags → Feld, lückenlos validiert)

## Zweck

Berlin-Inhalte (Drucksachen, Reden, Anfragen) entlang **Themenfeldern** navigierbar machen — „Was passiert im Abgeordnetenhaus zum Thema X?". Diese Doku definiert die Felder, ihre Herleitung und die Neutralitäts-Leitplanken. Sie ist die Grundlage, bevor Klassifikations-/UI-Code entsteht.

## Datengrundlage

Die Felder sind **nicht erfunden, sondern aus den Daten abgeleitet**: `berlin_drucksachen_analyses.thema_json` enthält ein **kontrolliertes Vokabular von 47 Roh-Tags** über **19.409** analysierte Drucksachen (Multi-Label, Haiku-4.5-Pipeline, Vokabular definiert in [`summarization-methodology-berlin-drucksachen.md`](./summarization-methodology-berlin-drucksachen.md)). Eine Drucksache trägt typisch 2–3 Tags.

Wir bündeln diese 47 Tags zu **12 Politikfeldern** + **4 Querschnitt-Kategorien** + `Sonstiges`. Metrik = **DS-Abdeckung** (Anzahl Drucksachen mit ≥1 Tag des Feldes, pro DS entdoppelt; Nenner 19.409).

## Das 2-Achsen-Modell

- **Achse A — Politikfeld** (12): *worum es sachlich geht*. Datengetrieben, am Senatsressort-Zuschnitt orientiert. Eine DS kann in mehreren Feldern liegen (Multi-Label).
- **Achse B — Querschnitt** (4): orthogonale Dimensionen, die *durch alle* Felder laufen (z. B. „betrifft einen Bezirk", „Transparenz-Anliegen"). Werden zusätzlich vergeben, ersetzen kein Politikfeld.

Das deckt sich mit dem früheren Design-Gedanken „Politikfeld + Querschnitt" und mit „Themen vor Parteien / offizielle Signale zuerst".

## Achse A — Politikfelder (nach DS-Abdeckung)

| # | Feld | DS | Anteil | Enthaltene Tags |
|---|---|---|---|---|
| 1 | **Stadtentwicklung, Bauen & Wohnen** | 5.641 | 29,1 % | Wohnen, Stadtentwicklung, Liegenschaften, Bauplanung, Wohnungslosigkeit, Denkmalschutz |
| 2 | **Verwaltung & Digitales** | 4.507 | 23,2 % | Verwaltung, Digitalisierung, Datenschutz, Bürokratie |
| 3 | **Mobilität & Verkehr** | 3.871 | 19,9 % | Mobilität, ÖPNV, Verkehrssicherheit, Radverkehr |
| 4 | **Soziales, Arbeit & Familie** | 3.666 | 18,9 % | Soziale Infrastruktur, Arbeitsmarkt, Inklusion, Familie |
| 5 | **Bildung & Wissenschaft** | 3.531 | 18,2 % | Bildung, Hochschulen |
| 6 | **Innere Sicherheit & Justiz** | 2.628 | 13,5 % | Polizei, Justiz, Gewaltprävention, Extremismus |
| 7 | **Finanzen & Haushalt** | 2.581 | 13,3 % | Finanzen, Haushalt, Steuern |
| 8 | **Umwelt, Klima & Energie** | 2.270 | 11,7 % | Klimaschutz, Energie, Tierschutz |
| 9 | **Gesundheit & Pflege** | 1.499 | 7,7 % | Gesundheit, Pflege |
| 10 | **Migration & Integration** | 1.346 | 6,9 % | Geflüchtete, Integration, Migration |
| 11 | **Kultur & Sport** | 1.009 | 5,2 % | Kultur, Sport |
| 12 | **Wirtschaft & Tourismus** | 878 | 4,5 % | Wirtschaft, Tourismus |

## Achse B — Querschnitt

| Kategorie | DS | Anteil | Tags |
|---|---|---|---|
| **Bezirksbezug** | 3.313 | 17,1 % | Bezirke |
| **Transparenz & Open Data** | 1.583 | 8,2 % | Transparenz |
| **Demokratie & Teilhabe** | 1.255 | 6,5 % | Demokratie, Partizipation, Wahlrecht |
| **Gleichstellung & Antidiskriminierung** | 1.113 | 5,7 % | Antidiskriminierung, Geschlechtergerechtigkeit |

`Sonstiges` (267 DS, 1,4 %) bleibt expliziter Auffang — wird **nicht** zwangszugeordnet, damit die Feld-Statistik ehrlich bleibt.

## Methodik-Leitplanken

1. **Nach Sach-Inhalt klassifizieren, nicht nach Sprecher-Framing.** „Asyl-Missbrauch" (ein Frame) und „Geflüchtetenschutz" (anderer Frame) sind dasselbe Politikfeld *Migration & Integration*, nicht zwei. Sonst entstehen partei-typische Verzerrungen, die der Bias-Audit nicht fängt (Topic ist kein Bias-Wort). Gilt besonders bei Migration, Wohnen, Sicherheit. → [[feedback_neutralitaet]]
2. **Landeskompetenz-Ehrlichkeit.** Wir zeigen Themen dort, wo das Land sie real verhandelt — wir erfinden keine Felder für Bundes-/Außenpolitik. Beispiel **Gaza/Nahost**: bundesweit hochsalient, aber keine Landeskompetenz → erscheint im Abgeordnetenhaus nur *indirekt* (Antisemitismus → *Sicherheit*/*Antidiskriminierung*, Demonstrationsrecht → *Sicherheit*, Schulen → *Bildung*). Kein „Gaza"-Feld. „Zeigen statt etikettieren." → [[feedback_distribution_form_not_value_function]]
3. **Multi-Label & Aggregationsregel.** Eine DS kann mehreren Feldern angehören. „Größe eines Feldes" = **DS mit ≥1 Tag im Feld**, pro DS entdoppelt (nicht Summe der Tag-Nennungen — die zählt Mehrfach-Tags doppelt). Querschnitt-Tags werden additiv vergeben.
4. **Felder sind am Ressort-Zuschnitt orientiert**, nicht an Tagespolitik — stabil über Wahlperioden, neutral, nachvollziehbar.

## Öffentliche Salienz vs. Parlaments-Volumen (Kontext)

Themenfelder-Größe ≠ „was die Leute bewegt". Beides nebeneinander ist die eigentliche Stärke:

- **Deckungsgleich:** **Wohnen/Mieten** ist #1 in den Daten (29 %) *und* #1 bei den Berliner:innen (47 % nennen es wahlentscheidend); dazu Mobilität (35 % öffentlich) und Bildung (18 %). → Pflicht-Felder.
- **Viel Parlament, wenig öffentliche Leidenschaft:** *Verwaltung & Digitales* (23 %) ist groß, weil 15.929 der DS Schriftliche Anfragen sind (das „Betriebssystem" des Parlaments) — kein „was-bewegt-mich"-Thema.
- **Viel Salienz, wenig Landes-Parlament:** Inflation/Wirtschaft, Migration, Gaza/Nahost (bundesweit Top) sind im Abgeordnetenhaus klein/indirekt (siehe Leitplanke 2).

Quellen: rbb-BerlinTrend (Wohnen/Mobilität/Bildung); Tagesspiegel (Mieten wahlentscheidend); Ipsos Sorgenbarometer/Meinungslage 2026 (Inflation/Wirtschaft/Migration/Armut).

## Bau-Reihenfolge

Anker = **Stadtentwicklung, Bauen & Wohnen** (höchstes Volumen × höchste Salienz → bester erster Showcase). Danach Mobilität → Bildung → Sicherheit → Klima → Soziales → Rest.

## Verhältnis zu bestehenden Dokus & gelöste Design-Fragen

Beantwortet aus diesen Daten mehrere offene Punkte aus `topic-classification-design-questions.md`:
- **Single vs. Multi-Label** → Multi-Label (das Vokabular ist bereits multi-label vergeben).
- **Frame-Capture** → Leitplanke 1.
- **Prozedurale Inhalte** → über `klasse` (z. B. `beschlussempfehlung`) und `Sonstiges` trennbar, nicht in Sachfelder gemischt.

## Offen

- Mapping auf **Reden** (`berlin_speech_analyses`) und **Anfragen** übertragen — diese haben (noch) kein `thema_json`; Optionen: aus verknüpfter DS ableiten (TOP/DS-Link) oder eigener Klassifikations-Layer.
- Entscheidung: Themenfeld als **Filter/Navigations-Layer** (UI über vorhandene Tags) vs. eigener LLM-Klassifikations-Pass. Erst-Empfehlung: UI-Layer auf den vorhandenen DS-Tags (kein neuer LLM-Lauf nötig), Reden später.
- Inter-Rater-Check (Stichprobe) für die Feld-Bündelung, falls die Felder öffentlich als Statistik ausgewiesen werden.
