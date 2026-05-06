# Politik — Ideas & Roadmap

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
- `scripts/refix-hallucinated-cvs.ts` — refetcht und regeneriert Einträge mit bekannten LLM-Halluzinationen
- `scripts/refetch-cv-homepage-text.ts` — **NEU**: holt fehlenden Roh-Text aus bekannter `cv_homepage_url` nach (kein LLM)
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
