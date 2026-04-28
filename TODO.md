# Politik — Ideas & Roadmap

## Now (Stand 2026-04-28, Laptop)

### CV-Pipeline: 628/629 Bundestag-MdBs haben einen CV (99.8%) ✅

**Quellen (Stand DB):**
- `cv_json` (Wikipedia via Groq): ~455 MdBs
- `cv_homepage_json` (Homepage-Scraping via Groq): ~454 MdBs
- `cv_homepage_text` (Roh-Text der Homepage, NEU seit 2026-04-28): 436 MdBs
- Überlappung: viele haben beide Quellen

**Nur noch 1 Sonderfall:**

| Name | Grund | Status |
|------|-------|--------|
| Carsten Träger | **Verstorben** — Homepage zeigt nur Trauerbekundung | Übersprungen |

**Scripts:**
- `scripts/seed-cv.ts` — Wikipedia → Groq → `cv_json` (Batch)
- `scripts/seed-cv-homepage.ts` — Homepage scrapen → Groq → `cv_homepage_json` (Batch, mit Link-Scan), speichert auch Roh-Text
- `scripts/seed-cv-manual.ts` — Gezielter Scraper für manuell gefundene Bio-URLs
- `scripts/seed-cv-from-paste.ts` — **NEU**: nimmt manuell gepasteten Bio-Text aus Stdin
- `scripts/refix-hallucinated-cvs.ts` — **NEU**: refetcht und regeneriert Einträge mit bekannten LLM-Halluzinationen

### Wichtige Lessons (2026-04-28)

**LLM-Halluzinationen aus Beispiel-Inhalten im Prompt:** Der ursprüngliche System-Prompt enthielt konkrete Beispiele wie `"sonstiges": [{"jahr": "2019", "text": "Buchautor: 'Titel des Buches' (Suhrkamp)"}]` und `"Universität Köln, Diplom-Jurist"`. Das Llama-8b-Modell hat diese Beispiele bei ~17% der Einträge als FAKTEN übernommen, obwohl sie im Quelltext nicht vorkamen. Fix: Beispiele durch Schema-Platzhalter (`<string>`) ersetzt + explizites Verbot von Beispiel-Übernahme im Prompt. Alle 86 betroffenen Einträge wurden refixed.

**Roh-Text-Speicherung:** Vor 2026-04-28 wurde nur das LLM-JSON gespeichert, nicht der Quelltext → keine nachträgliche Korrektur ohne Re-Scraping möglich. Jetzt: `cv_homepage_text` Spalte speichert den Roh-Text → erlaubt späteres Re-Processing mit besseren LLMs / Multi-LLM-Konsens-System (siehe Idee #4).

### Was als nächstes zu tun ist
- [ ] CV-Zusammenfassungen generieren (aus cv_json/cv_homepage_json eine lesbare Bio für die UI)
- [ ] CV-Daten in der Politiker-Detailseite anzeigen (PoliticianCV Komponente existiert bereits)
- [ ] Homepage-URLs korrigieren: Hülya Düber → `huelyadueber.de`, Katja Mast → `katja-mast.de`
- [ ] Roh-Text auch für die ~190 MdBs nachholen, die nur cv_homepage_json haben aber kein cv_homepage_text (Discovery hat About-Page nicht mehr gefunden — bekannte URL aus cv_homepage_url direkt re-fetchen)
- [ ] Multi-LLM-Konsens-System auf den 436 vorhandenen Roh-Texten testen (siehe Idee #4)

## Next Up
<!-- Prioritized ideas ready to build -->


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
