# Politik — Ideas & Roadmap

## 🌟 Vision / Nordstern (Stand 2026-05-09)

**Ziel:** Wenn du wissen willst, was in der Politik abgeht, gehst du auf unsere Seite.
**DIE Seite für Politik. Maximale Transparenz.**

Das ist deutlich breiter als „MdB-Transparenz im Bundestag" — der aktuelle Code-Stand
ist nur ein Teil davon. Das Mission-Statement bestimmt zukünftig die Roadmap-Priorisierung.

### Stand heute relativ zur Mission

**Stark abgedeckt:**
- MdB-Transparenz im Bundestag (CVs, Reden, Votes, Sidejobs, Ausschüsse)
- Source-Coherence + Methodik-Audit (Wikipedia ↔ Homepage, 39 Konflikte)
- Pop-Hero V1 mit knappsten Abstimmungen
- KI-Pipelines für Reden-Analyse, CV-Strukturierung, Vote-Topic-Mapping

### Lücken-Audit für „DIE Seite" (10 Posten)

1. **Aktualitäts-Anker** — kein Live-Feed, kein „Was ist heute/diese Woche das Top-Thema?".
   Pop-Hero zeigt Polls, aber keinen laufenden Debatten-Puls. Wer reinschaut, sieht keinen
   tagesaktuellen Stand.
2. **Bundesregierung / Kabinett** — Minister:innen-Stammdaten sind drin, aber keine Agenda
   („Was hat die Regierung diese Woche beschlossen?"). Kabinettssitzungen, Pressekonferenzen,
   Bundeskanzler-Aktivität.
3. **Drucksachen-Browser** — alle aktuellen Anträge/Gesetzentwürfe mit Verfahrens-Stand.
   Aktuell nur als Aktivitäts-Feed pro MdB sichtbar, keine vorgangs-zentrierte Sicht.
4. **Bundesrat** — komplett unsichtbar. Zweite Kammer fehlt.
5. **Bundesländer / Landtage** — Stammdaten der 16 Landtage da, aber keine Aktivitäten,
   Votes, Sidejobs.
6. **EU-Ebene** — gar nicht. ~96 deutsche MEPs + relevante EU-Gesetzgebung fehlt.
7. **Wahlen / Umfragen / Wahltermine** — Wahlergebnisse pro Wahlkreis, aktuelle Umfragen,
   anstehende Wahltermine — alles nicht abgedeckt.
8. **News-Kontext** — die Plattform existiert isoliert. Bürger:in liest morgens „Streit um
   Stromsteuer" in Zeitung → findet das Vote, aber keinen redaktionellen Kontext (welche
   Medien berichten was, wie ordnen Kommentator:innen ein).
9. **Bürger-Anker „Mein Wahlkreis / Meine MdBs"** — Wahlkreis-Karte mit MdB-Hover,
   „was tut deine Abgeordnete für dich"-Sicht. Aktuell muss man Namen suchen.
10. **Themen-Sicht** — heute alles personen- und vote-zentriert. Eine Topic-Sicht
    „Was läuft gerade zu Klima/Migration/Wirtschaft?" fehlt (Topic-Klassifikation hängt
    darüber, siehe `docs/topic-classification-design-questions.md`).

### Drei strategische Wege Richtung Mission

**A) Aktualitäts-Anker bauen.** News-Feed-Aggregation und/oder „Diese Woche im Plenum" aus
DIP-API. Adressiert Lücke #1 und #3 direkt. Ist in Idea #7 unten schon durchdacht
inklusive Anti-Boulevard-Regeln. Großer Schritt Richtung Mission.

**B) Drucksachen-Browser MVP.** Eigene `/drucksachen`-Seite, alle aktuellen Vorgänge
listbar/filterbar. Aus bestehender DB direkt, kein neuer Daten-Track. ~3–5 h. Ergänzt
MdB-Sicht um Vorgangs-Sicht. Adressiert Lücke #3.

**C) Topic-Klassifikation für Reden.** Die 7 offenen Design-Fragen in
`docs/topic-classification-design-questions.md` durchgehen. Voraussetzung für
Themen-Sicht (Lücke #10) und für „Synopse Aussage-vs-Vote"-Killer-Feature. Mehrere
Sessions, aber öffnet viele Folge-Features.

### Kalender im Mission-Licht

Reines Sitzungs-Termin-Widget (manuelles JSON) wäre Pseudo-Mission — bundestag.de hat
das, jede Tageszeitung hat das, kein einzigartiger Datenpunkt. **Sinnvoll wird Kalender
nur als Teil von (A)/(B):** automatische DIP-API-Anbindung mit Sitzungswochen +
Drucksachen-Lesungen + verlinkten Vorgängen. Statisches Termin-Widget bewusst nicht.

### 🤖 LLM-Sitzungs-Summary (deferred, Stand 2026-05-09)

**Hintergrund:** Test-Seite `/design/linear/plenar-aktuell` zeigt aktuell eine
Daten-Summary („6 TOPs · 87 Reden · 4 Abstimmungen"). Inhaltliche Verstehbarkeit
(„worum ging's politisch") fehlt — würde aber zur Mission „DIE Seite für Politik"
besser passen.

**Methodischer Rückenwind:**
- 87 validierte `zusammenfassung_2_saetze` pro Rede in `speech_analyses_v2` als Input
  → niedrigeres Halluzinationsrisiko als Generierung aus Roh-Reden
- Specialist-Cascade-Pattern (Memory `project_specialist_cascade.md`) ist etabliert
- Cost: ~$0,01/Sitzung × 75 WP21-Sessions = <$1 einmalig

**Vor dem Bau zu klären — 5 Design-Fragen:**
1. **Länge:** 3 Sätze oder Block mit Schwerpunkt-Liste?
2. **Schwerpunkt-Auswahl:** Heuristik (TOPs ≥10 Reden ∪ Vote-Polls) oder LLM-Wahl (riskant)?
3. **Tonalität-Erwähnung:** „Debatte war polemisch/sachlich" rein? Daten dafür sind in `speech_analyses_v2.tonalitaet`.
4. **Audit-Trail:** neue Spalten `plenar_sessions.summary`, `summary_model`,
   `summary_methodology_sha`, `summary_generated_at` — analog zu speech_analyses_v2.
5. **Re-Generation:** manuell oder automatisch via methodology_sha-Vergleich?

**Risiken:**
- Halluzinations-Restrisiko bei kontroversen Themen (Llama hatte in CV-Pipeline 5%, Haiku besser aber nie 0)
- Neutralitäts-Falle bei „was ist Schwerpunkt"
- Verstärkt das „Plattform-erzählt-uns-was-wichtig-war"-Pattern (vgl. Memory `feedback_no_gotcha_framing`)

**Vorgehen wenn aktiviert:**
1. Proof-Sitzung (z.B. Sitzung 75) — manuell gegen Realität validieren
2. Wenn ok: Batch über alle WP21-Sessions, einmalig
3. DB-Migration + UI-Integration in Plenar-Aktuell-Seite + ggf. Detail-Seiten

**Status:** Idee dokumentiert, nicht gebaut. Aktivieren erst wenn Test-Seiten-Phase
abgeschlossen ist und entschieden wurde, dass Plenar-Aktuell wirklich produktiv wird.

### Mission-Spannungsfelder (vorab benannt, damit nicht später überraschen)

- **Neutralitäts-Pflicht vs News-Aggregation** — sobald News dazukommen, ist die
  Quellenauswahl politisch (welche Medien? in welcher Reihenfolge? wie gewichtet?).
  Anti-Boulevard-Regeln aus Idea #7 sind hierfür der Anker.
- **Scope-Kontrolle** — „DIE Seite" verlockt zur Featuritis. Förder-Pitch hängt
  weiterhin an Tiefe der einzelnen Linie (Source-Coherence-Methodik), nicht an Breite.
  Roadmap muss beide Achsen tragen.
- **Aktualität kostet Pflege** — Live-Daten brauchen Sync-Skripte + Monitoring + Cron.
  Kein „set and forget".

---

## Now (Stand 2026-04-28, Laptop)

### CV-Pipeline: 628/629 Bundestag-MdBs haben einen CV + lesbare Bio (99.8%) ✅

**Quellen (Stand DB):**
- `cv_json` (Wikipedia via Groq): ~455 MdBs
- `cv_homepage_json` (Homepage-Scraping via Groq): ~454 MdBs
- `cv_homepage_text` (Roh-Text der Homepage): 458 MdBs (22 nachgeholt 2026-04-28)
- `cv_summary` (lesbare 2–3-Satz-Bio aus den JSON-Daten, NEU 2026-04-28): 628 MdBs ✅
- Überlappung: viele haben beide Quellen

**Nur noch 1 Sonderfall:**

| Name | Grund | Status |
|------|-------|--------|
| Carsten Träger | **Verstorben** — Homepage zeigt nur Trauerbekundung | Übersprungen |

**Refetch-Fails (Server down):** Frauke Heiligenstadt, Matthias Moosdorf — haben aber `cv_homepage_json`, also nicht kritisch.

**Scripts:**
- `scripts/seed-cv.ts` — Wikipedia → Groq → `cv_json` (Batch)
- `scripts/seed-cv-homepage.ts` — Homepage scrapen → Groq → `cv_homepage_json` (Batch, mit Link-Scan), speichert auch Roh-Text
- `scripts/seed-cv-manual.ts` — Gezielter Scraper für manuell gefundene Bio-URLs
- `scripts/seed-cv-from-paste.ts` — nimmt manuell gepasteten Bio-Text aus Stdin
- `scripts/refetch-cv-homepage-text.ts` — holt fehlenden Roh-Text aus bekannter `cv_homepage_url` nach (kein LLM)
- `scripts/generate-cv-summary.ts` — **NEU**: erzeugt aus `cv_json`+`cv_homepage_json` eine 2–3-Satz-Bio in `cv_summary`. Concurrency=2 wegen Groq RPM-Limit (8b-instant)

### Wichtige Lessons (2026-04-28)

**LLM-Halluzinationen aus Beispiel-Inhalten im Prompt:** Der ursprüngliche System-Prompt enthielt konkrete Beispiele wie `"sonstiges": [{"jahr": "2019", "text": "Buchautor: 'Titel des Buches' (Suhrkamp)"}]` und `"Universität Köln, Diplom-Jurist"`. Das Llama-8b-Modell hat diese Beispiele bei ~17% der Einträge als FAKTEN übernommen, obwohl sie im Quelltext nicht vorkamen. Fix: Beispiele durch Schema-Platzhalter (`<string>`) ersetzt + explizites Verbot von Beispiel-Übernahme im Prompt. Alle 86 betroffenen Einträge wurden refixed.

**Roh-Text-Speicherung:** Vor 2026-04-28 wurde nur das LLM-JSON gespeichert, nicht der Quelltext → keine nachträgliche Korrektur ohne Re-Scraping möglich. Jetzt: `cv_homepage_text` Spalte speichert den Roh-Text → erlaubt späteres Re-Processing mit besseren LLMs / Multi-LLM-Konsens-System (siehe Idee #4).

### Was als nächstes zu tun ist (Stand 2026-04-29)

**MORGEN ZUERST** (Datenqualitäts-Endspurt — siehe `NEXT-SESSION.md`):
- [ ] `npx tsx scripts/tiebreak-conflicts.ts` für 463 Konflikte (~20 Min, NVIDIA NIM Phi-4-mini)
- [ ] `tiebreak-report.md` durchsehen, Llama-Halluzinationen extrahieren
- [ ] `apply-tiebreak-patches.ts` mit den ~30 echten Korrekturen erweitern + ausführen
- [ ] Final Health-Check + Snapshot

**Source-Coherence-Reaktion (Stand 2026-05-05):**
- [ ] **Stufe 1 — Transparenz-Anzeige:** Badge "Quellen-Diskrepanz erkannt" auf Politiker-Detailseite (Filter: `source_conflicts.final_verdict = ECHT`). Siehe `docs/source-coherence-echt-fehler.md`. ~1-2 h
- [ ] **Stufe 2 — Selektive Korrekturen:** 5 eindeutig korrigierbare Fälle (Hardt, Nacke, Merz, Pantazis, Behrens) nach Faktenrecherche fixen, Audit-Trail in `cv_repair_log`. ~1 h
- [ ] **Stufe 3 — Cron:** Source-Coherence quartalsweise via `/schedule` oder externer Cron — fängt neue Wikipedia-/Homepage-Drifts auf

**Danach offen:**
- [ ] `cv_summary` in der Politiker-Detailseite anzeigen (PoliticianCV Komponente existiert bereits)
- [ ] Homepage-URLs korrigieren: Hülya Düber → `huelyadueber.de`, Katja Mast → `katja-mast.de`
- [ ] **2 noch fehlende Refetch-Fails** (Heiligenstadt + Moosdorf — Server damals down): nochmal versuchen
- [ ] Sync-Skript `scripts/sync-all.sh` für regelmäßige Aktualisierungen
- [ ] **Auto-Fetcher für Plenar-XMLs automatisieren:** `scripts/fetch-plenar-xmls.ts` ist gebaut und idempotent (nutzt bundestag.de-Filterlist `1058442-1058442` für WP21). Wöchentlich am Wochenende laufen lassen (`/schedule` oder cron), damit nach jeder Sitzungswoche die neuen XMLs automatisch landen. Nach jedem Lauf muss anschließend der Reden-Rebuild (Block 2 = `extract-all-speeches.ts`) durchlaufen, um die neuen Reden zu integrieren.
- [ ] LLM-Routing-Modul (`src/lib/llm.ts`) in `seed-cv*.ts` integrieren (DRY)
- [ ] Phase 3: Ausschuss-Quellenpointer (analog zu Reden)
- [ ] **Mini-Modus / Profi-Modus Umschalter pro Profil:**
  - **Mini (Default für Bürger):** nur die wichtigen Eckpunkte — höchster Bildungsabschluss, letzte/aktuelle Arbeitsstelle, Eintritt in Partei, aktuelles Amt + 1-2 vorherige
  - **Profi (alles):** Schullaufbahn, jede Studienstation, jede Berufsstation, jede politische Position, Aufsichtsräte, Hobbys, Mitgliedschaften
  - UI: Toggle oben im Lebenslauf-Block, Default = Mini, User kann auf "Alle Daten anzeigen" klicken
  - Heuristik für Mini: jüngster Eintrag pro Sektion + alle Einträge mit "Abschluss"/"Examen"/"Diplom"/"Bundeskanzler"/"Minister"/"Vorsitz" Keywords; Schule wird komplett ausgeblendet
  - Persistenz: in localStorage, sodass Auswahl seitenübergreifend bleibt
  - **Implementierungs-Hinweis:** Filter-Logik in `PoliticianCV.tsx` lokalisieren — die Komponente hat bereits die merged-Section-Struktur (Wikipedia + Homepage), der Filter ist nur ein zusätzlicher Pre-Render-Schritt. Toggle als kleine Client-Component daneben (`'use client'` für localStorage-Read/Write).

## Next Up
<!-- Prioritized ideas ready to build -->

### 🎯 Reden-Re-Generation mit Smart-Haiku-Cascade (Stand 2026-04-30)

**Voller Plan:** [`docs/plan-haiku-opus-cascade.md`](docs/plan-haiku-opus-cascade.md)

**Kontext:** 3-Wege-Vergleich Llama 70B / Haiku 4.5 / Opus 4.7 auf 9 Reality-Check-Reden zeigte, dass Opus klar gewinnt bei Tonalitäts-Erhalt (Kleinschmidt AfD-Polemik), Halluzinations-Vermeidung (Bloch erfundene Investitions-Forderungen), wörtlichen Zitaten und Frame-Detection. Aber Opus ist 15× teurer als Haiku ($390 vs $26 für 10k Segmente).

**Idee — Smart Haiku Cascade:** ~90 % der Opus-Qualität für ~Haiku-Preis durch architektonische Tricks statt teurere Modelle:
1. **XML-Tonalitäts-Marker** programmatisch aus `<kommentar>`-Tags extrahieren (Beifall/Zwischenrufe nach Partei) und in den Prompt injizieren — kostet $0
2. **Schema-erzwungener JSON-Output** mit Pflichtfeldern `forderungen[]`, `wörtliche_zitate[]`, `framing_marker[]`, `tonalität` — strukturell verhindert Auslassungen
3. **Prompt Caching** für langen System-Block mit Few-Shots + Frame-Glossar — drückt Input-Cost um ~80 %

**Erwartete Kosten:** $30-35 für 10k Segmente (vs. $26 pure Haiku, vs. $390 pure Opus)
**Erwartete Qualität:** 90-92 % von Opus

**Optionaler Joker — Distillation:** ~$25 einmalig mit Opus „Gold Library" (300-500 schwere Fälle) generieren, dann Smart Haiku zieht via Embedding-Similarity passende Beispiele als Few-Shot → dauerhaft Opus-Qualität für Haiku-Preis.

**Hängt zusammen mit Idea #4 (Multi-LLM-Konsens-System) weiter unten** — dies ist eine konkrete, kostenoptimierte Realisierung des Cascade-Patterns.

**Erste Schritte (Smoke-Test):**
- [ ] Smart-Haiku-Architektur auf den GLEICHEN 9 Reality-Check-Reden testen (Bloch, Kleinschmidt, Kreiser etc.) — ~$0,03, 5 Min
- [ ] Wenn ≥7/9 der Opus-Qualität: grünes Licht für volle 10k-Pipeline
- [ ] `scripts/regenerate-summaries-smart-haiku.ts` mit Persist+Resume bauen
- [ ] **Vor Förder-Antrag:** externe Validierung der 9 Vergleichs-Reden durch Politikwissenschaftler/Journalisten (blind, anonymisiert) — gegen Bias-Vorwurf „die AI sagt selbst, sie sei besser"


## Auswertungs-Ideen (Stand 2026-04-25)

Analyse: viel Rohdaten in der DB, vergleichsweise wenig davon in der UI. Sortiert nach Aufwand/Impact.

### 🔥 Quick Wins (großer Impact, kleiner Aufwand)

- **Echte Faction Loyalty berechnen** — `politiker/[id]/page.tsx` zeigt aktuell hardcoded 88%. Aus `votes` + `fraction_label` lässt sich pro Vote die Fraktionsmehrheit ermitteln und "Rebellen" pro MdB zählen. Liste "Größte Abweichler" wäre clickbait-tauglich.
- **Top-Verdiener-Ranking aus `sidejobs`** — Total income pro Person, Top 50 mit Quellen, nach Partei sortierbar.
- **Größte Sidejob-Auftraggeber** — Aggregat über `organization` → Top 30 Lobby-Quellen, "wieviel Geld floss von Firma X an wen?"
- **Schweige-Liste / Nicht-Arbeiter** — MdBs mit 0 Reden, 0 Anfragen, 0 Anträgen automatisch erkennen (analog zu Knodel-Sonderfall).
- **Anwesenheits-Ranking gesamt** — sortierbare Liste "Faulste/Fleißigste 50".

### 💪 Mittlerer Aufwand (richtig wertvoll)

- **Conflict-of-Interest Matrix** — Cross-join `committee_memberships` × `sidejobs` → "Mitglieder im Wirtschaftsausschuss mit Nebenjob bei Banken/Energiekonzernen". Investigative Killer-Story.
- **Vote-Browser** (`/abstimmungen`) — Alle 100+ Abstimmungen einzeln, Mehrheits-Verhältnis, Partei-Aufschlüsselung, knappste Polls. Pro Vote drilldown: wer wie gestimmt hat (Daten sind alle da, nur unsichtbar).
- **Drucksachen-Browser** (`/drucksachen`) — aus `activities`: alle `drucksache_nr` mit Titel, Vorgangstyp, suchbar, filterbar.
- **Themen-Wolke aus `speech_summaries.kontext`** — "Wer redet wieviel zum Thema X". Die LLM-Summaries sind Gold im Boden, aktuell nur 1:1 angezeigt.
- **Partei-Vergleichs-Dashboard** (`/parteien`) — Pro Partei: ⌀ Anwesenheit, # Reden, # Anfragen, # Gesetzentwürfe, ⌀ Nebeneinkünfte, # Ausschuss-Vorsitze, Gender-Verteilung, ⌀ Alter. Side-by-side Bar Charts.
- **Ausschuss-Detailseiten** (`/ausschuesse/[name]`) — `ausschuss_sessions` + `attendees` + `topics` sind komplett unsichtbar auf Ausschuss-Ebene; nur in Top-Listen aggregiert.

### 🎯 Anspruchsvoller (Killer-Features)

- **Wahlkreis-Karte** — `constituency` → Deutschland-SVG/Leaflet mit MdB-Hover. Wahlkreis-Geometrien frei beim Bundeswahlleiter.
- **Aktivitäten-Heatmap pro MdB** — Aktivität pro Monat → wer fängt stark an und schläft ein?
- **Sidejob-Trend** — `data_change_date` → wann meldet wer was an? Vor/nach Wahlen?
- **Plenar-Live-Feed** — Letzte 20 Reden quer über alle MdBs aus `speech_summaries`, zeitstrahl-mäßig.
- **Vergleich zwei Politiker** — `/vergleich?a=123&b=456` → side-by-side Stats, Reden-Anzahl, Themen-Überlap, Vote-Übereinstimmung.

### 📊 Trivialer SQL-Output, aber noch nicht angezeigt

- Gender-Verteilung pro Partei (Spalte `politicians.sex` ist da)
- Alters-Verteilung pro Partei (`year_of_birth`)
- Beruf-Cloud (`occupation`)
- Bildungs-Verteilung (`education`)

### 🌍 Datenlücken die noch geschlossen werden könnten

- **Landtag-Aktivitäten** — Stammdaten aller 16 Landtage da, aber keine Aktivitäten/Votes/Sidejobs. Quellen: jeder Landtag eigenes OpenData-Portal (ungleichmäßig).
- **EU-Parlament Voting Records** — analog für die ~96 deutschen MEPs.
- **Wahlergebnisse** — Erst-/Zweitstimmen pro Wahlkreis.
- **Reden-Volltext** — aktuell nur Preview + Summary, nicht der ganze Text. Wäre durchsuchbar wertvoll.
- **MdB-Homepage-URLs** — können aus abgeordnetenwatch übernommen + verlinkt werden (sicher), evtl. og:image scrapen für noch fehlende Fotos. Rechtliche Lage ist freundlich solange nur Linking + leichtes Meta-Scraping, keine Volltexte/Fotos rehosten.
- **Frühere Wahlperioden / komplette Mandats-Historie** — Aktuell zeigen wir pro MdB nur das aktuelle Mandat (21. Wahlperiode 2025-2029). Viele Abgeordnete waren auch in früheren Bundestagen Mitglied (z.B. Friedrich Merz: 1994-2009 + seit 2021). Brauchen wir, um auf der Profilseite eine vollständige Mandats-Timeline zu zeigen ("Mitglied 14.+15.+16. WP, 20.+21. WP"). Quellen: Bundestag DIP API hat historische Wahlperioden (`wahlperiode_id` 14 ff.), abgeordnetenwatch hat alle alten Mandate. Auch interessant: Vergleich von Reden-Volumen / Anwesenheit über mehrere Perioden hinweg, frühere Ausschuss-Mitgliedschaften, alte Sidejobs.

### Photo-Coverage erweitern

- 18 fehlgeschlagene Wikidata-Downloads erneut versuchen
- abgeordnetenwatch-Foto-URLs als Fallback für die 238 ohne Wikidata-Match
- Photo-Attribution irgendwo in UI (Tooltip/Footer auf Profil)
- Gleiches Script für Landtage + EU mit anderem `BUNDESTAG_TERM_QID`

---

## Ideas

### 1. Ausschuss-Detektiv (Gamechanger)
Die wahre Arbeit passiert in den Fach-Ausschüssen — dort das Licht anknipsen.
- **Anwesenheit prüfen** — Aus Kurzprotokollen extrahieren, wer wirklich im Raum saß (oder hybrid)
- **Aktivität messen** — Wer stellt Fragen? Wer bringt Anträge ein? (Unterscheidung „Stimmvieh" vs. „Fachpolitiker")
- **Transparenz-Lücke anzeigen** — Geheim tagende Ausschüsse aktiv als „Informations-Vakuum" markieren, um Druck aufzubauen
- _Komplexität: Hoch — Protokoll-Parsing, evtl. PDF-Scraping, eigene Datenstruktur_
- _Datenquellen: Bundestag Kurzprotokolle, DIP API_

### 2. KI-Dolmetscher
Politik-Sprache in Bürger-Sprache übersetzen.
- **Automatische Zusammenfassungen** — Transkripte, Reden, komplexe Anträge → 3–5 verständliche Sätze für normale Menschen (via Claude/Gemini)
- **Kontext liefern** — Nicht nur WAS beschlossen wurde, sondern WARUM es für den Bürger wichtig ist
- _Komplexität: Mittel — LLM-API-Anbindung, Prompt-Engineering, Caching für Kosten_
- _Abhängigkeit: Funktioniert standalone, wird aber noch besser mit Ausschuss-Daten_

#### Strategie für Bundestagsprotokolle
Bundestagsreden haben eine spezielle Struktur (Zwischenrufe, Protokollnotizen, förmliche Anreden). Damit die Zusammenfassung gelingt:

| Schritt | Fokus |
|---------|-------|
| **Filterung** | Modell anweisen, Zwischenrufe in Klammern entweder zu ignorieren oder gezielt die "Stimmung im Saal" daraus abzuleiten |
| **Struktur** | Nach Thesen, Forderungen und Gegenargumenten sortieren — nicht nur den chronologischen Ablauf wiedergeben |
| **Kontext** | Da wir uns 2026 befinden: Reden im Kontext der aktuellen Regierungspolitik unter Bundeskanzler Merz bewerten |

### 3. Finanz-Radar (Follow the Money)
Geldflüsse sichtbar machen.
- **Stiftungs-Check** — Welche Politiker werden durch Stiftungen finanziert? Welche Stiftungen erhalten Steuergeld? (Lobby-Verstrickungen)
- **Steuerverschwendung** — Ineffiziente Ausgaben und „Tax Waste" den handelnden Personen zuordnen
- _Komplexität: Hoch — Datenquellen unklar, evtl. manuelle Recherche + Scraping nötig_
- _Datenquellen: Nebeneinkünfte (abgeordnetenwatch), Lobbyregister, Bundesrechnungshof_

#### Lobbypedia/LobbyControl als Quelle prüfen (Stand 2026-05-08)

Lobbypedia (lobbypedia.de, betrieben von LobbyControl) dokumentiert Lobby-Verflechtungen, Drehtür-Fälle, Aufsichtsratsmandate und Karenzzeit-Debatten gut belegt mit Fußnoten. **Anlassfall**: Katherina Reiche (Bundestag 1998–2015 → VKU/BvöD → Westenergie → Wirtschaftsministerin 2025) ist klassischer Drehtür-Fall — diese Daten stehen in Wikipedia nur teilweise.

**Symmetrie-Auflage** (Memory `feedback_neutralitaet.md` + `feedback_no_gotcha_framing.md`): Lobbypedia ist als Quelle **nur akzeptabel, wenn symmetrisch angewendet** — also für alle ~640 Politiker:innen wo verfügbar, nicht für Einzelfälle. Sonst entsteht Selektions-Bias.

**Wenn implementiert, dann so:**
- **NICHT** in `cv_summary` einfließen lassen — würde Bias in die kompakte Bio bringen
- Sondern: eigene UI-Sektion „Drehtür / Aufsichtsräte / Lobby-Bezüge" auf Profilseiten
- Idealerweise **als parallele Source-Coherence-Quelle** (analog zur bestehenden Wiki↔Homepage-Pipeline mit 39 Konflikten): Lobbypedia ↔ Wikipedia, Konflikte werden mensch-validiert markiert
- Datenkategorie: `lobbypedia_url`, `lobbypedia_extracted_json`, `lobbypedia_text` (analog zu cv_homepage_*)
- Auto-Discovery: für jeden Politiker `https://lobbypedia.de/wiki/{Vorname_Nachname}` probieren (HTTP 200 vs 404 als Existenz-Check)

**Komplexität:** mittel-hoch. Pflicht: rechtliche Prüfung (Lobbypedia steht unter Creative-Commons CC BY-SA 4.0 — nutzbar mit Attribution). Plus: Lobbypedia-Inhalte sind oft länger als Wikipedia → eigene Extraktions-Pipeline mit Haiku 4.5.

### 4. Multi-LLM Konsens-System (Neutralitäts-Garantie)
Schutz gegen den Vorwurf "ein einzelnes LLM analysiert parteiisch".

**Konzept:** Jede Textpassage (Reden, Anträge, CV-Bios, Ausschuss-Protokolle) wird parallel von mehreren **unabhängigen** LLMs unterschiedlicher Anbieter analysiert. Ergebnisse werden auf semantische Übereinstimmung verglichen — bei Divergenz wird ein Diskussions-/Reconciliation-Schritt angestoßen, bis Konsens erreicht ist (oder die Divergenz selbst transparent dokumentiert wird).

**Warum:**
- Einzel-LLM-Bias (Trainingsdaten-Schlagseite, RLHF-Tendenzen) ist ein angreifbarer Punkt der Plattform
- Bei politisch sensiblen Texten muss die Analyse auch dann verteidigbar sein, wenn jemand "warum hat eure KI das so formuliert?" fragt
- Cross-Vendor-Konsens (z. B. Anthropic + OpenAI + Google + Open-Source) ist methodisch weit stärker als Single-Provider

**Architektur-Skizze:**
- Pro Text: N parallele LLM-Calls (z. B. Claude, GPT, Gemini, Llama via Groq)
- Strukturierter Output (JSON) — Themen, Tonalität, Forderungen, Fakten
- Vergleichs-Layer: semantische Diff über die Outputs (Embedding-Distanz / strukturierter Compare)
- Bei Divergenz > Threshold: Moderator-LLM bekommt alle N Antworten + Originaltext, erzeugt Synthese ODER markiert "uneinig" mit Begründung
- Konsens + Disagreement-Score wird gespeichert und in der UI ausgewiesen ("3/4 LLMs einig, 1 abweichend — siehe Begründung")

**Anwendungen im Projekt:**
- `speech_summaries` (aktuell single Groq) → Konsens-Pipeline
- CV-Bio-Zusammenfassungen
- Themen-Klassifikation von Anträgen/Drucksachen
- Tonalität/Sentiment von Reden
- Conflict-of-Interest-Bewertung von Sidejobs

**Komplexität: Hoch** — Multi-Vendor-Keys, Kosten-Management, Caching kritisch, Diff-Heuristik nicht-trivial.

**Datenquellen:** Anthropic API, OpenAI API, Google Gemini, Groq (Llama/Mixtral). Mindestens 3 unabhängige Anbieter für aussagekräftigen Konsens.

### 5. Mitarbeiter-Transparenz
Keine zentrale API — kreative Datenquellen nötig.

**Datenlage:**
- Keine offizielle Mitarbeiterliste (Datenschutz). Nur das Budget ist bekannt (~26.650 €/Monat pro MdB)
- Viele MdBs listen ihr Team freiwillig auf ihrer Homepage (Name, Foto, Zuständigkeit)
- Soziale Medien (Impressum, Bios) enthalten oft Mitarbeiter-Kürzel/Namen

**Features:**
- **Transparenz-Ranking: Personal**
  - Level 1: Keine Info
  - Level 2: Namen auf der Webseite
  - Level 3: Vollständige Veröffentlichung inkl. Gehälter (freiwillig)
- **Impressum-Scanner** — Abgeordneten-Webseiten automatisiert nach Team-Infos scannen (Scraping)
- **Familien-Check** — Nachnamen-Abgleich Team vs. MdB (Verwandte 1. Grades dürfen nicht über Staatsbudget angestellt werden)
- **Drehtür-Detektor** — Lobbyregister nach Ex-Mitarbeitern durchsuchen, die zu Lobby-Verbänden gewechselt sind

**Datenquellen:**
- Persönliche Webseiten der MdBs (Scraping)
- Lobbyregister (Drehtüreffekt-Check, seit 2022 verschärft)
- Hausausweis-Register (per IFG erstritten, statische PDFs via FragDenStaat)
- Crowdsourcing als Ergänzung

- _Komplexität: Hoch — Web-Scraping, NLP für Name-Extraction, rechtliche Prüfung (Datenschutz)_

### 6. Personen-Dossier-Bot („Crawl-Agent")
Eingabe: Name. Ausgabe: ein strukturiertes, quellenbelegtes Dossier zur Person.

**Konzept:** Multi-Source-Crawler, der pro Person aus offenen Quellen ein Dossier zusammenstellt — Werdegang, Reden/Interviews, Mandate/Jobs, öffentlich dokumentierte Kontroversen, formale Beziehungen (Aufsichtsräte, Co-Autoren, Stiftungs-Verbindungen). **Kein Boulevard-Scraper** — jede Aussage mit Quellen-Pointer + Confidence-Score.

**Sektionen (parametrisierbar):**
- **Person/Werdegang** — Geburtsdatum, Bildung, Karriere (Wikipedia/Wikidata/Homepage)
- **Reden & Interviews** — Bundestag-DIP-Reden + Top-N Interviews aus etablierten Medien
- **Jobs & Mandate** — Sidejobs (abgeordnetenwatch), Aufsichtsräte (CV), Lobbyregister-Einträge
- **Öffentlich dokumentierte Kontroversen** — *nur* aus Whitelist-Quellen (FAZ/SZ/Spiegel/Zeit/taz/dpa/Tagesschau/Welt/Handelsblatt) mit klarem Sachverhalt-Zitat. Keine Boulevard-/Aktivisten-/Verschwörungs-Quellen.
- **Formale Verbindungen** — gemeinsame Vorstände, Co-Antragstellung im Bundestag, Stiftungs-Boards, gemeinsame Auftritte mit Beleg
- **Reine Vermutungen explizit weglassen** — „Freundschaften" ohne öffentlichen Beleg gehen nicht rein

**Architektur:**
1. Quellen-Pull pro Sektion (parallel): Brave Search Top-30 + strukturierte APIs (DIP, abgeordnetenwatch, Lobbyregister, Wikidata)
2. Whitelist-Filter pro Sektion (nur Domains aus erlaubter Liste für „Kontroversen")
3. Pro Quelle: LLM extrahiert strukturierte Claims (Was, Wann, Quelle, wörtliches Zitat) — **immer mit Original-URL + Snippet**
4. **Multi-LLM-Verifikation** (siehe Idee 4) für jeden Claim — nur Claims mit Konsens kommen ins Dossier
5. Persistierung mit Source-Pointer pro Fact → später jederzeit rückprüfbar
6. UI: Dossier mit ausklappbaren Quellen pro Aussage, Confidence-Badge, Datum des Crawls

**Machbarkeit:**
- ✅ Infrastruktur fast komplett vorhanden: Brave Search, DIP, Wikipedia, Multi-LLM-Pipeline (siehe Idee 4 + aktueller Tiebreak-Lauf), Lobbyregister-API
- ⚠️ „Skandale/Verstrickungen" technisch machbar, aber **rechtlich der heikelste Teil** — Persönlichkeitsrecht, Verleumdungs-Risiko. Lösung: harte Whitelist-Quellen, immer wörtliches Zitat aus Originalartikel, nie LLM-Paraphrase als Behauptung
- ⚠️ Nicht-MdBs (Privatpersonen) haben deutlich engere rechtliche Grenzen als Personen des öffentlichen Lebens → Scope vorerst auf Politiker:innen + öffentlich erkennbare Personen (CEOs, Funktionäre) beschränken
- ⚠️ Hallu-Risiko: Selbst mit Whitelist-Quellen hat Llama im aktuellen Lauf ~5% falsch zugeordnet — Multi-LLM-Konsens ist *Pflicht*, nicht Kür
- ⚠️ Kosten/Latenz: Pro Person ~50-100 LLM-Calls bei sauberem Setup — Caching kritisch

**Komplexität: Sehr hoch** — Hauptaufwand sind Whitelist/Source-Scoring + rechtliche Guardrails, weniger das Crawlen selbst.

**Datenquellen:** Brave Search, Wikipedia/Wikidata, Bundestag DIP, abgeordnetenwatch, Lobbyregister, Whitelist-Medien-RSS/Search, eigene DB.

**Realistischer Einstieg:** MVP nur für die 629 MdBs, da für die alle Quellen bereits angebunden sind. „Beliebige Person" als V2.

### 7. Echtzeit-Puls + Homepage-Catcher (Stand 2026-05-08)

Die Plattform hat starke Daten, aber die Hauptseite catcht niemanden. Wer reinkommt soll **sofort sehen, was die Menschen bewegt** — nicht nur trockene Stats wie „630 Politiker · 18 Parlamente". Idee: ein **Echtzeit-Puls** der die kontroversesten Themen, Reden und Abstimmungen prominent zeigt, gespeist aus eigenen Daten + Social-Media-/News-Trend-Signalen.

**Hauptseiten-Hero (statt Stats):**
- **„Diese Woche kontrovers"-Block** — die 3-5 polarisierendsten Themen mit konkreten Pollen/Reden:
  - Polls mit eng aufeinanderliegendem Ja/Nein-Verhältnis (≤55:45)
  - Reden mit hoher polemischer Tonalität in heiß-debattierten Topics
  - Abweichler-Rate: MdBs die gegen die eigene Fraktion stimmen
- **„Aktuell diskutiert"-Block** — Trend-Topics aus externen Quellen:
  - Was wird auf Twitter/Bluesky in der politischen Bubble diskutiert? (Hashtag-Frequenz)
  - Was schreiben Datenjournalist:innen + Multiplikatoren?
  - News-Aggregatoren (Tagesschau-Mail, RND, Zeit, etc.) für aktuelle Themen-Headlines
- **„Versprochen vs. Abgestimmt"-Block** — wo redet jemand A und stimmt B?
  - Die stärksten Aussage-vs-Vote-Diskrepanzen aus unserer Pipeline
  - Rolle: Aha-Effekt-Trigger für die ersten 30 Sekunden des Besuchs

**Datenquellen extern (neu zu integrieren):**
- **Twitter/X-API v2** — Listen-basiert (politische Bubble: MdBs + Journalist:innen) statt firehose, Token-Cost niedrig
- **Bluesky AT-Protocol** — kostenlos, gut für linke/grüne Bubble, AT-protocol kostenlos
- **News-RSS-Feeds** — Tagesschau, Spiegel-Politik, Zeit-Politik, taz, FAZ — RSS aggregieren + Topic-Tagging
- **Google-Trends-API** für Politik-Suchbegriffe (legitime Bürger-Sicht)

**Datenquellen intern (haben wir schon):**
- 50 Vote-Polls mit Topic-Mapping (88% HIGH-Confidence)
- 8.245 KI-analysierte Reden mit Tonalität + Forderungen + Zitaten
- Source-Coherence-Konflikte (Wikipedia↔Homepage)
- Voting-Statistiken pro MdB

**Realistische Stufen:**
- **MVP (1 Woche)**: nur interne Daten — „Kontroverse Polls" + „Polarisierte Reden" + „Versprochen vs. Abgestimmt". Keine externe API. Trifft schon den 80%-Punkt.
- **V2 (2-4 Wochen)**: News-RSS + Bluesky + Twitter-Listen. Trend-Begriffe extrahieren + auf eigene Topic-Klassifikation mappen.
- **V3**: KI-Stimmungs-Analyse der Social-Media-Posts → „Was empfindet die Online-Politik-Bubble bei diesem Thema?"

**UI-Prinzip:** drei klare Karten auf der Hauptseite, jede mit 1 Kontext-Satz und 3-5 konkreten Beispielen + Klick-Tiefe. KEINE Statistik-Walls. Mensch-orientiert, nicht Daten-orientiert.

**Risiken:**
- Twitter/X-API ist teuer → Bluesky + News-RSS reichen vermutlich für 90% Signal
- „Kontrovers" muss neutral definiert sein — sonst Filterblase. Symmetrie-Test: zeigen wir AfD-Polemik genauso wie Linke-Polemik?
- Echtzeit-Updates kosten Server-Last → 1× pro Stunde reicht völlig

_Komplexität: Hoch — neue Datenquellen, neue UI, neue Topic-Klassifikation_
_Abhängigkeit: profitiert massiv von der Topic-Klassifikation aus den 7 offenen Design-Fragen (`docs/topic-classification-design-questions.md`)_

#### Konkretisierung: 3-Schichten-Modell + Anti-Boulevard-Regeln (Stand 2026-05-08)

Hintergrund: User-Diagnose ist richtig — die Hauptseite ist zu steril für TikTok/Reels-Generation. Aber „krasser Inhalt" hat eine Boulevard-Falle: wenn die Plattform anfängt nach „Skandal" zu suchen statt nach „Daten", verbrennt sie genau die Glaubwürdigkeit, die der Datenjournalismus-Schwerpunkt aufbauen soll. Lösung: **Pop muss aus echten Daten kommen, nicht aus emotionaler Sprache.**

**3-Schichten-Aufbau (nicht ersetzen, addieren):**

| Schicht | Zielgruppe | Aufenthalt | Inhalt |
|---|---|---|---|
| **1. Pop-Hero** (oben) | TikTok-Hirne, Casual-Visitors | 5 Sek | „Diese Woche bewegt" — 3 kontroverse Polls als Mini-Stacked-Bars, 1 polemischste Rede mit Zitat, 1 Aussage-vs-Vote-Mismatch |
| **2. Such- & Profil-Layer** (Mitte) | Interessierte | 30 Sek | Bestehender Content: SearchBox, „Wie arbeitet Ihr Abgeordneter?", Profile, Voting-Stats |
| **3. Methodik-Layer** (Tiefe) | Datenjournalist:innen, Förder-Reviewer | 5 Min | Bestehende Methodik-Seite, Datenquellen, Audit-Trail |

**Drei Anti-Boulevard-Regeln (kritisch — sonst Glaubwürdigkeits-Tod):**

1. **Daten zeigen, nicht werten.** „51:49" — nicht „skandalös knapp". „Diese Rede enthält 7 Wertungs-Wörter laut KI-Analyse" — nicht „polemischer Auftritt". Die Daten sprechen für sich, wenn man sie gut visualisiert.

2. **Symmetrie-Test pflicht.** Jede Pop-Karte muss in alle politische Richtungen funktionieren. Wenn diese Woche nur Linke + Grüne im Pop-Hero auftauchen → fehlerhafte Auswahl. Wenn nur AfD → genauso. **Auswahlkriterium muss neutral-strukturell sein** (z.B. „polemischster Tonalitäts-Score der Woche" — fällt auf wen es fällt), nicht inhaltlich.

3. **Tiefen-Pfad immer da.** Jeder Pop-Block hat einen „→ Methodik dahinter"-Link. Wer wissen will WIE wir „kontrovers" definieren, kann das nachlesen. Pop-Karte = Tür, nicht Endprodukt.

**Beispiel-Test (gut vs. schlecht):**
- ✅ „Hauchdünne Mehrheit: Stromsteuer 51:49 verabschiedet" + Klick zum Vote-Detail
- ❌ „Skandal: Stromsteuer-Beschluss durchgepresst!" — wertend, parteiisch
- ✅ „Merz' Tonalitäts-Score: 0.71 sachlich (KI-Analyse, 12 Reden)" + Klick zur Methodik
- ❌ „Merz redet wie ein Buchhalter" — Wertung, Personalisierung
- ✅ „Diese 5 MdBs stimmten gegen die eigene Fraktion" + Bar-Chart Abweichungen
- ❌ „Geheim-Aufstand! 5 Abweichler gegen Merz!" — Boulevard-Frame

**Abgrenzung — woran erkennen wir, ob's gut wird?**
- Vergleich gegen **Correctiv / ZDFmagazin Royale** = Daten + Verständlichkeit + journalistische Sorgfalt → richtig
- Vergleich gegen **BILD / Picdumb / Outrage-Kanal** = Schlagzeile vor Substanz → falsch
- Selbst-Test: würde ein Politikwissenschaftler:in beim Anschauen denken „interessant"? Oder „peinlich vereinfacht"? Wenn zweiteres → Pivot.

**Implementations-Hinweise:**
- Auswahl-Algorithmus für Pop-Karten muss **deterministisch + auditierbar** sein (z.B. „top-3 Polls dieser Woche nach |0.5 - vote_ratio|"), nicht eine handgepickte Liste
- Updates **1× pro Tag** reichen — keine Echtzeit-Komplexität nötig
- Empfehlung: **MVP-Pop-Hero zuerst NUR aus internen Daten** (interne Kontroversen-Auswahl). Externe News-/Social-Media-Quellen sind V2 — sonst zu viele Variablen gleichzeitig

## Someday / Maybe
<!-- Cool but not urgent -->


## Done
<!-- Completed items for reference -->
- Basic politician database with abgeordnetenwatch.de data
- Landing page with search and stats
- Politician list with parliament/party filters
- Individual politician detail pages
- Activities feed (Anfragen, Anträge, etc.)
- Search page
- Seed scripts for DB population
- Plenarprotokoll-Pipeline (XML-Extraktion, LLM-Summaries via Groq/Gemini)
- Ausschussprotokoll-Pipeline (Sessions, Attendees, Topics)
- Sonderfälle / politician_notes (Knodel, Trabert, Foullong)
- Lokale Spiegelung von Votes/Sidejobs/Committees aus Abgeordnetenwatch
- Politiker-Fotos: Stufe 1 — Wikidata-Seed mit Initialen-Fallback (PoliticianAvatar)
- DB-Sync zwischen Rechnern via Cloudflare R2 (sync-db.sh + Git-Hooks)
- CV-Pipeline Bundestag: 622/629 MdBs haben strukturierten CV (Wikipedia + Homepage-Scraping, 2026-04-27)
