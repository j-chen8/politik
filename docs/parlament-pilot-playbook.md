# Parlament-Pilot Playbook

> **Zweck:** Reproduzierbarer 8-Phasen-Prozess, um ein weiteres Parlament (Hamburg, Bayern, NRW, …) auf den Berlin-Pilot-Stand zu bringen. Decken alle Schritte vom Daten-Discovery bis zur Profilseite-Integration ab.
>
> **Referenz-Implementierung:** Berlin-Abgeordnetenhaus 19. WP, gelaufen Mai 2026. Alle Skripte/Memory-Verweise sind als konkrete Beispiele.
>
> **Geschätzter Gesamtaufwand:** 1-2 Wochen (mit LLM-Analyse), ~$40-60 API-Cost bei vergleichbarer Parlament-Größe (10k-15k Reden).

---

## 0. Pre-Conditions

Vor Start prüfen — wenn eine dieser Voraussetzungen nicht erfüllt ist, könnte der Pilot deutlich aufwendiger werden.

| Voraussetzung | Wie prüfen | Berlin-Beispiel |
|---|---|---|
| **PARDOK-äquivalente XML-Quelle** mit Dokument-Metadaten + Redner-Liste | Suche nach „Parlamentsspiegel" + Bundesland | `pardok.parlament-berlin.de` |
| **Plenarprotokolle als PDF** (idealer: Wortprotokoll-Variante) | Bibliothek/Dokumentenserver des Parlaments | parlament-berlin.de |
| **Wikipedia-Listenseite der MdL** | „Liste der Mitglieder des $PARLAMENT ($N. Wahlperiode)" | de.wikipedia.org/wiki/Liste_der_Mitglieder_des_Abgeordnetenhauses_von_Berlin_(19._Wahlperiode) |
| **Wikimedia-Commons-Fotos** der MdL (≥50 % Coverage) | spot-check via Wikipedia-Bilder | ~60 % Coverage für Berlin |
| **abgeordnetenwatch-Daten** (optional) | abgeordnetenwatch.de Parliament-API | bei Berlin nur ~159 MdL, sehr lückenhaft → Wikipedia-Listenseite wichtiger |
| **Berliner-MdL-Total** ist erreichbar via Wahlperiode-Übersicht | Bundes-/Landeswahlleiter | 159 MdL (Berlin WP19) |
| **Anthropic API-Key** mit ≥$50 Guthaben | console.anthropic.com/billing | $39,57 für 10.414 Berlin-Reden |
| **DB-Schema-Erweiterbarkeit** | Spalten/Tabellen sind nicht hardcoded auf Bund | ✓ — DB akzeptiert `parliament_id=N` |

---

## Phase 1 — Daten-Discovery (½ Tag)

**Ziel:** Verstehen welche Datenquellen für dieses Parlament tatsächlich verfügbar sind und wie reichhaltig sie sind.

### Schritte
1. **Wikipedia-Listenseite finden** — Format-Template prüfen (`{{PersonZelle|Vorname|Nachname}}` ist Standard)
2. **PARDOK-äquivalent prüfen** — XML-Export von Dokumenten + Redner-Liste
3. **PDF-Bibliothek scoutet** — gibt es „Wortprotokoll" (komplette Reden) vs „Beschlussprotokoll" (nur Verfahren)?
4. **abgeordnetenwatch-Coverage** prüfen — `/parliaments/N/politicians`
5. **Bekannte Edge-Cases recherchieren** — Wahlperiode-Wechsel, Wiederholungswahlen, Nachrücker

### Output
- Memory-Datei `project_landtag_$NAME_sources.md` (analog `project_landtag_berlin_sources`)
- Dokumentation in `docs/DATA-SOURCES.md` (§ pro Parlament)

### Decision-Points
- Wenn KEIN Wortprotokoll verfügbar → Phase 4 (Reden-Segmentierung) ist nicht möglich, Pilot endet nach Phase 3
- Wenn KEINE Wikipedia-Listenseite → andere Stammdaten-Quelle nötig (z.B. parlamentseigene Liste scrapen)

---

## Phase 2 — Stammdaten + Schema (1 Tag)

**Ziel:** MdL-Stammdaten in `politicians` + `mandates`, parliament_id, parliament_periods, Berlin-eigene Tabellen.

### Schritte (Berlin-Beispiel: `scripts/seed-berlin-wikidata.ts` + `seed-berlin-pardok.ts`)
1. **Wikipedia-Listenseite parsen** → `members[]` mit first/last/articleTitle/imageFile/birthYear
2. **Wikipedia-Article-Title → Wikidata-QID** via MediaWiki pageprops API
3. **Wikimedia-Commons-Fotos downloaden** → `public/photos/$politician_id.jpg`
4. **PARDOK-XML parsen** → Dokumente + Redner-Person-Tabelle
5. **`politicians` + `mandates`** anlegen mit `parliament_period_id`
6. **Eigene Bundesland-Tabellen** (`berlin_documents`, `berlin_vorgaenge`, `berlin_document_persons`) anlegen — separat vom Bundes-Schema

### Skript-Templates
- `scripts/seed-berlin-wikidata.ts` (~340 Zeilen) — Wikipedia-Listenseite-Parser
- `scripts/seed-berlin-pardok.ts` (~290 Zeilen) — XML-Ingest mit Person-Match
- `scripts/seed-berlin-ausschuesse.ts` (~245 Zeilen) — Ausschuss-Mitgliedschaften

### Empfehlungen aus Berlin
- **Wikipedia-Foto-Coverage realistisch ~50-70 %** — die Lücke später als Limitation kommunizieren, nicht durch alternative Quellen ausgleichen wollen
- **Person-Matching strikt:** PARDOK-Names (`"Nachname, Vorname (Partei)"`) → eigene `parsePersonName`-Funktion, NICHT den Bundes-Parser. Berlin hatte ~84 % Match-Rate bei Rednern, ~37 % bei Urhebern (Senatoren/Beauftragte sind oft keine MdL)
- **Eigene Tabellen-Prefixes** (`berlin_*`, `hamburg_*`) — nicht in den Bundes-Tabellen mischen

### Pitfalls (gelernt)
- ⚠ Wahlperiode-Wechsel mit Nachrückern: Stammdaten-Backfill in Phase 5 nötig (Berlin hatte 30 fehlende MdL aus „alter WP19 vor Wiederholungswahl")
- ⚠ Frühe Wahlperioden haben oft schlechtere Wikipedia-Coverage

---

## Phase 3 — PDF-Volltext-Extraktion (½ Tag)

**Ziel:** Alle PDF-Plenarprotokolle in eine `$bundesland_pdf_texts`-Tabelle, gekeyed auf URL.

### Schritte
1. **PDF-Download-Skript** (analog `scripts/download-berlin-pdfs.ts`, 183 Zeilen)
   - Filter `dok_art='Plenarprotokoll'` aus PARDOK
   - Idempotent: skip wenn URL schon in `pdf_texts`
2. **pdf-parse für Volltext** → `full_text`, `pages`, `chars`, `tokens_estimate`-Spalten
3. **Verifikation:** Sample-PDF prüfen (Spalten-Scrambling? Bindestrich-Trennung? Header-Footer?)

### Output
- `$bundesland_pdf_texts` Tabelle mit Volltext
- Berlin-Final: 19.680 PDFs, 124 davon Plenarprotokolle (8.186 Seiten)

### Pitfalls (gelernt)
- ⚠ **Spalten-aware Parsing nötig** für Ausschussprotokolle mit Tabellen (Berlin-Ausschuss-Parser hat das, Plenarprotokolle nicht so kritisch)
- ⚠ **PDF-Bindestriche** (`Wort-\nWort`) bleiben im Volltext → in späteren Phasen normalisieren

---

## Phase 4 — Reden-Segmentierung (1-2 Tage)

**Ziel:** Aus PDF-Volltexten einzelne Reden extrahieren in `$bundesland_speeches`. Dies ist die kritischste Phase weil PDF kein strukturiertes XML ist.

### Empirisch validierter Ansatz: **3-Quellen-Cross-Check** (siehe `project_berlin_speeches_pipeline.md`)
1. **TOC im PDF-Anfang** = Sprecher-Set (Ground-Truth)
2. **Body-Volltext** = chronologische Reden mit Sprecher-Markern (`Name (Fraktion):`)
3. **PARDOK-XML `<Redner>`** = Set-Validierung pro Sitzung

### Spike-First-Methodik
1. **`extract-speeches-spike.ts`** für 1 Test-Sitzung → 3-Quellen-Cross-Check, Drift-Identifikation
2. **`extract-speeches-stresstest.ts`** auf alle Sitzungen → Macro-Stats, Edge-Case-Reden identifizieren (1-Seiten-Wahlprotokolle, Sondersitzungen)
3. **`seed-$bundesland_speeches.ts`** Production-Skript (~600 Zeilen) mit:
   - Multi-Line-Marker-Join für „Senator NN (Senatsverwaltung für X):"-2-Zeilen-Format
   - TOC-basierte TOP-Erkennung (Body-Erkennung war fehleranfällig — Fließtext mit Zahlen-Präfix matchte)
   - Interruptions ([Beifall|Zwischenruf|...]) strukturiert als JSON
   - Text-Säuberung (Footer + Continuation-Marker raus)
   - Idempotent via deterministisches `speech_id = "$WP-$SITZUNG-r$ORDER"` + INSERT OR REPLACE

### Bundes-Bug-Lehren strikt anwenden (5 Stück)
1. **Kein --clean / auto-increment** — deterministischer Primary Key, INSERT OR REPLACE
2. **Coverage pro Rolle** im Bilanz-Report (MdL/Senat/Bürgermeister) — Lücken sofort sichtbar
3. **Kein `typ='debatte'`-Default** — speech_type via TOP-Kontext ableiten oder NULL
4. **Kein MIN_CHAR_LEN-Filter im Extract** — auch 35-Zeichen-Wortmeldungen rein, Filter erst beim LLM-Pass
5. **`extractor_version`-Audit-Trail** pro Eintrag

### Output
- `$bundesland_speeches` Tabelle (Berlin: 23.206 Einträge, 11.711 echte + 11.495 Präsidium)
- Coverage-Bilanz: PARDOK-Sprecher-Set vs Body-Marker-Set ≥98 % Match

### Pitfalls (gelernt)
- ⚠ **TOC ist nicht zwingend chronologisch** (oft nach Tagesordnung sortiert) — Order-Match-Metrik kann täuschen, Set-Match ist relevanter
- ⚠ **Edge-Case-Speaker-Marker:** Alterspräsident (konstituierende Sitzung), 2-zeilige Senatoren-Marker, Zwischenrufe in `[X: ...]` die wie Sprecher aussehen — Regex-Filter `^(?!Zuruf|Beifall|Heiterkeit)` einbauen

---

## Phase 5 — Stammdaten-Backfill (½-1 Tag)

**Ziel:** Fehlende MdL die nicht in `politicians` sind aber Reden gehalten haben (Pre-existing Daten-Lücke aus Phase 2).

### Schritte (analog `scripts/backfill-berlin-mdl-stammdaten.ts`)
1. **Unmatched MdL-Sprecher identifizieren** aus `$bundesland_speeches WHERE is_praesidium=0 AND speaker_role IS NULL AND politician_id IS NULL`
2. **Filter** für Edge-Cases (Alterspräsident, „Zuruf von X", PDF-Defekte mit fehlendem Nachnamen)
3. **Stammdaten-Politicians anlegen** mit `id ≥ 900000` (analog Bundes-Doppel-Pipeline-Pattern)
4. **Mandate-Eintrag** in `parliament_period_id=N` mit `end_date` für ausgeschiedene MdL (z.B. Wiederholungswahl-Stichtag)
5. **Re-run `seed-$bundesland_speeches.ts`** für PID-Match-Update

### Berlin-Beispiel
- 30 fehlende MdL nachgepflegt (vor allem alte FDP-Fraktion + Nachrücker SPD/LINKE)
- MdL-PID-Match von 92 % → 99,97 % nach Backfill

### Pitfalls
- ⚠ abgeordnetenwatch-Snapshot deckt oft nur aktuelle Zusammensetzung ab, nicht historische Nachrücker

---

## Phase 6 — UI Profilseite Reden-Karte (~1h)

**Ziel:** Reden auf Berliner-Politiker-Profilseite sichtbar machen — vor LLM-Analyse.

### Schritte
1. **DB-Funktion** `get$BundeslandSpeechesByPolitician(politicianId)` analog `getBerlinSpeechesByPolitician`
   - Liefert Items + Stats + total_chars
   - Felder: speech_id, datum, sitzung_nr, top_titel, drucksache_nrn, text_preview (Grußformel-strip), interruption_count, speech_type
2. **UI-Section auf `/politiker/[id]`** — neue `CollapsibleCard` „Reden im $Parlament"
3. **Transparenz-Hinweis:** „Volltexte direkt aus den PDF-Plenarprotokollen — noch keine KI-Zusammenfassung"
4. **PARDOK-Karte umbenennen** zu „Anfragen & Anträge im $Parlament" + Reden-Bucket entfernen (Doppel-Listing vermeiden)

### Berlin-Beispiel
- Commit `a8e12bd` — 145 Zeilen UI-Erweiterung
- Pattern: speech_type-Badge, top_titel, Volltext-Preview (200 Z), Metadaten-Zeile (Sitzung, Z-Count, Reaktions-Count, max 3 Drucksachen + Restzahl, PDF-Link)

### Warum dieser Schritt vor LLM-Analyse?
- Sofortiger Visual-Test: stimmen die Daten? sind die Texte sauber? sehen die Drucksachen-Verknüpfungen plausibel aus?
- User-Visual-Check identifiziert Edge-Cases die im SQL nicht auffallen

---

## Phase 7 — LLM-Analyse-Pipeline (2-3 Tage, $40-60)

**Ziel:** Strukturierte Analyse aller Reden via Claude Haiku 4.5 mit eigener `methodology-$bundesland.md`.

### Schritte

#### 7.1 — Methodology-Datei (½ Tag)
1. **Eigene Datei** `docs/summarization-methodology-$bundesland.md` (NICHT Bundes-File patchen!)
   - Warum eigene Datei: kein SHA-Drift bei Bundes-Re-Runs (siehe `feedback_methodik_copy_drift`)
2. **Übernehmen aus Bundes-v2.1:** Grundprinzipien (Sektion 0), Reden-Typen A-K (Sektion 1), Heuristiken H1-H10 (Sektion 3), Tonalitäts-Enum (Sektion 5), JSON-Schema (Sektion 6) — **referenzieren, nicht duplizieren**
3. **Bundesland-spezifisch:**
   - Sektion 1b: Akteure-Anpassung (Bürgermeister statt Kanzler, Senatoren statt Minister, Bezirke statt Bundesländer)
   - Sektion 1.L: **Neuer Reden-Typ L** wenn das Parlament eigene Frage-Formate hat (Berlin: Fragestunde-Frage = ~17 % aller Reden, in Bundes-Methodology nicht abgedeckt)
   - Sektion 2: **Bundesland-Frame-Glossar** (siehe 7.2)
   - Sektion 7: **Beispiel-Outputs aus Bundesland-Reden** (3 Stück, verschiedene Typen)

#### 7.2 — Frame-Discovery via Hybrid C (1 Tag)
**Niemals subjektives Glossar aus 40 gelesenen Reden!** Das ist Pointen-Bias. Stattdessen:
1. **N-Gramm-Skript** `scripts/analyze-$bundesland-frames.ts` über alle Reden-Texte
   - 2-4-Gramme mit Stop-Words + Floskel-Filter + PDF-Header-Strip
   - Output: Top 200-300 Phrasen mit Frequenz + Top-Partei
2. **Manuelle Kuration** der Top-200 → ~30 politisch geladene Frames
   - Bucket-Heuristik (LAGER/BEZIRK/THEMA-Cluster/AKTEUR/FLOSKEL/...)
   - User-Review von `docs/$bundesland-frame-discovery.md`
3. **Glossar-Größe:** ~30 Frames sind Sweet Spot (Bundes hat 31, Berlin 30)
   - >40 Frames: kognitive Last für LLM zu hoch
   - <20 Frames: zu viele Pattern werden Ad-Hoc erfunden

#### 7.3 — Smoke-Test (10 Min, ~$0,04)
1. **`scripts/smoketest-$bundesland-reden.ts`** mit 10 stratifizierten Reden via Batch-API
2. **Quality-Checks:**
   - Tonality-Drift = 0 %?
   - Quote-Validation mit normalisiertem Text (Newline + Bindestrich-Fix für PDFs!) ≥85 %?
   - Frame-Glossar-Match ≥80 % (mit Umlaut-Normalisierung ae/oe/ue ↔ ä/ö/ü!)?
   - Typ L (wenn definiert) wird erkannt?

#### 7.4 — Vollauf mit 4 progressiven Batches (1-2h, $40-60)
**Optimal-Stopping-Strategie (1/e ≈ 37 %):**
- Batch 1: 100 Reden (Skalierungs-Test, ~$0,50)
- Batch 2: 1.000 Reden (Coverage-Test, ~$4)
- Batch 3: 3.700 Reden (37 %-Threshold, ~$11)
- Batch 4: alle restlichen (Production Run, ~$25)

**Vorteile gegenüber 1 Batch:**
- Quality-Gates zwischen Batches — bei Drift früh stoppen
- Methodology v2-Iteration zwischen Batches möglich
- Risiko-Begrenzung: Stop nach Batch 1 = $0,50 verloren statt $50

**Vorteile gegenüber 10 Batches:**
- Cache-TTL 5 Min — viele kleine Batches verlieren Cache
- Zeit-Penalty: 10 Batches sequenziell = 3-4h vs 4 Batches = 1-2h

#### 7.5 — Skript-Templates
- `scripts/batch-submit-berlin-reden.ts` (~270 Zeilen) mit `--batch=N`-Flag
- `scripts/batch-retrieve-berlin-reden.ts` (~190 Zeilen) mit Polling + INSERT + Quality-Report

### Schema
`$bundesland_speech_analyses` analog `speech_analyses_v2`:
- `speech_id` FK + UNIQUE (idempotent via INSERT OR REPLACE)
- Tool-Use-JSON-Felder: `reden_typ`, `tonalitaet`, `forderungen_json`, `woertliche_zitate_json`, `framing_marker_json`, `rhetorische_mittel_json`, `konkrete_zahlen_json`, `anti_hallucination_flags_json`, `zusammenfassung_2_saetze`, `neutralitaets_self_check_json`
- Quality-Metadaten: `quote_valid_count`, `quote_total_count`
- Audit-Trail: `methodology_sha`, `batch_id`, `batch_stage`, Token-Usage

### Quality-Erwartungen (Berlin-Benchmark)
- Success-Rate: 100 %
- Tonality-Drift: ≤0,3 %
- Quote-Validation (normalisiert): ≥90 %
- Frame-Glossar-Match: 75-82 %
- Verarbeitungs-Zeit: ~1,5h für 10.000 Reden
- Cost pro Rede: $0,003-0,004 via Batch

### Pitfalls (gelernt)
- ⚠ **Umlaut-Drift bei Frame-Names:** LLM nutzt oft `mobilitaetsgesetz` statt `mobilitätsgesetz`. Match-Validierung MUSS umlaut-normalisieren (ae/oe/ue), sonst künstlich niedrige Glossar-Hit-Rate
- ⚠ **Quote-Validation braucht Newline+Bindestrich-Normalisierung** für PDF-Quellen (Bundes-XML hatte das nicht)
- ⚠ **Methodology-SHA tracken** pro Eintrag — bei künftigem Methodology-Bugfix kann gezielt re-batched werden
- ⚠ **Vor jedem Batch User-Cost-Freigabe einholen** (Memory `feedback_ask_before_spending`)

---

## Phase 8 — UI Profilseite mit LLM-Output (~1h)

**Ziel:** Tonality-Badge + KI-Zusammenfassung pro Rede auf der Profilseite.

### Schritte
1. **DB-Funktion erweitern** — `get$BundeslandSpeechesByPolitician` um LEFT JOIN auf `$bundesland_speech_analyses`
2. **`BerlinSpeechItem.analysis`-Objekt** mit `reden_typ`, `tonalitaet`, `zusammenfassung`, `forderungen_count`, `framing_marker[]`, `quote_valid/total`, `self_check_konfidenz`
3. **UI-Pattern** (identisch Bundes — `TONALITAET_CONFIG` Farbschema wiederverwenden):
   - KI-Zusammenfassung (3 Zeilen) statt Volltext-Preview wenn analyse vorhanden
   - Tonality-Badge mit Farbe + Tooltip „Methodology v1, Stand YYYY-MM-DD"
   - Forderungs-Count
   - Self-Check-Konfidenz-Marker wenn != hoch
4. **Transparenz-Hinweis** updaten: „KI-Zusammenfassung + Tonalität via Haiku 4.5 (Methodologie $bundesland-v1)"

### Berlin-Beispiel
- Commit `e0ad232` — 58 Zeilen UI-Diff + 78 Zeilen DB-Diff

---

## 8 Optionale Anschluss-Tracks (alle eigene Arbeit, nicht Pflicht für Pilot-Abschluss)

| Track | Aufwand | Cost | Mehrwert |
|---|---|---|---|
| Bundesland-Redner-Detail-Page | 45-60 Min | 0 | volle SpeechAnalysisDetails-Komponente |
| Tonality-Verteilung auf Übersichtsseite | 30 Min | 0 | Fraktions-Tonalitäts-Tabelle |
| Methodik-Seite-Block für Bundesland | 30 Min | 0 | journalistische Belastbarkeit |
| Frame-Filter-UI auf Reden-Liste | 1h | 0 | UI-User-Feature |
| Drucksachen-LLM-Analyse | 1-2 Tage | $20-40 | analog Bundes-`drucksache_analyses` |
| Reden-FTS5-Suche | 2-3h | 0 | Volltext-Suche analog Bundes |
| Senatsmitglieder-Stammdaten anlegen | 1h | 0 | Senator-Match von 33-54 % auf ~90 % |
| Sub-Senatsverwaltung-Erkennung in Speaker_Ressort | 30 Min | 0 | Profilseite zeigt „die Innensenatorin" |

---

## Cost-Übersicht Berlin-Pilot (Referenz)

| Phase | Cost |
|---|---:|
| Phase 1-6 (Daten + Extraktion + UI) | $0 |
| Phase 7 LLM-Analyse (10.414 Reden) | $39,57 |
| Phase 8 UI mit LLM | $0 |
| **Gesamt** | **$39,57** |

Plus laufende Kosten:
- Demo-Hosting: Mini-PC + Cloudflare Tunnel = $0/Monat
- Anschrift.net: ~$7/Monat (juristisch nötig wenn Demo-Live)

---

## Berlin-Empirie (kalibrierende Referenzwerte)

| Metrik | Berlin (Pilot) | Erwartung für ähnliches Bundesland |
|---|---:|---|
| MdL gesamt | 159 (+30 Backfill = 189) | ~80-200 je nach Größe |
| Plenarprotokolle WP | 80 Wortprotokolle | ~30-100 je nach Sitzungs-Frequenz |
| Echte Reden gesamt | 11.711 (10.414 ≥200 Z.) | 5.000-20.000 je nach Sitzungen × Größe |
| Foto-Coverage Commons | ~60 % | 50-70 % |
| PARDOK-Redner-Match | 84 % | 80-90 % |
| MdL-PID-Match nach Backfill | 99,97 % | 95-100 % |
| Quote-Validation LLM | 90,5 % | 88-92 % |
| Tonality-Drift LLM | 0,27 % | 0,2-0,5 % |
| Cost LLM-Vollauf pro 10k Reden | $40 | $30-60 |

---

## Methodische Prinzipien (übernommen aus Berlin-Pilot)

1. **Eigene Methodology-Datei pro Parlament** — niemals Bundes-Datei patchen
2. **Hybrid C Frame-Discovery** — N-Gramm-Skript + manuelle Kuration, niemals subjektive Stichprobe-Frames
3. **4-Batch-Strategie mit 1/e-Threshold** — nicht 1 großer Batch, nicht 10 kleine
4. **Vor jedem API-Call Cost-Freigabe** — auch bei Kleinbeträgen
5. **Quote-Validation umlaut+newline-tolerant** für PDF-Quellen
6. **Audit-Trail in jeder Tabelle** — methodology_sha, batch_id, extractor_version
7. **Deterministisches speech_id + INSERT OR REPLACE** — niemals --clean / auto-increment
8. **Coverage pro Rolle ausweisen** — Lücken sichtbar machen

---

## Referenzen

- **Konkrete Skripte:** `scripts/seed-berlin-*.ts`, `scripts/extract-berlin-speeches-*.ts`, `scripts/analyze-berlin-frames.ts`, `scripts/batch-{submit,retrieve}-berlin-reden.ts`, `scripts/smoketest-berlin-reden.ts`
- **Methodology:** `docs/summarization-methodology-berlin.md`, `docs/summarization-methodology.md` (Bundes als Basis)
- **Frame-Discovery-Trail:** `docs/berlin-frame-discovery.md`
- **Memory-Files:**
  - `project_berlin_speeches_pipeline` (Phasen 1-5)
  - `project_berlin_speech_analyses` (Phasen 7-8)
  - `project_landtag_berlin_sources` (Phase 1)
  - `project_specialist_cascade` (Pipeline-Architektur)
  - `feedback_methodik_copy_drift` (Methodology-Datei-Strategie)
  - `feedback_ask_before_spending` (Cost-Hygiene)
  - `feedback_user_patterns_and_questions` (Validierungs-Patterns)

---

**Pflege-Hinweis:** Diese Datei nach jedem weiteren Parlament-Pilot updaten. Wenn ein Schritt anders lief als hier dokumentiert → Lehre hinzufügen.
