# Summarization-Methodologie für Berlin-Drucksachen

**Stand:** 2026-05-25 (v1.2 — Stage-1-Review: Header-Meta-Pre-Extract + Plenarprotokoll-Routing-Fix + Fraktions-Normalisierung)
**Erstellt von:** Claude Opus 4.7 + manuelle Kuration (analog zu `summarization-methodology-berlin.md` für Reden)
**Zweck:** Direkt einsetzbarer Methodology-System-Prompt für Haiku 4.5 zur partei-neutralen Analyse von Drucksachen des Berliner Abgeordnetenhauses (19. Wahlperiode).

> **Verhältnis zu anderen Methodology-Dateien:**
> - `docs/summarization-methodology.md` (Bundes-Reden) — Quelle für H1-H10 + Tonalitäts-Disziplin-Pattern
> - `docs/summarization-methodology-berlin.md` (Berlin-Reden) — Quelle für Berlin-Akteure-Vokabular
> - `src/lib/drucksachen-prompts.ts` (Bundes-Drucksachen) — Quelle für Klassen-Architektur (klein/mittel/gross/antwort/regierung)
>
> Wir kombinieren: Berlin-Akteure aus Reden-Methodology + Klassen-Architektur aus Bundes-DS-Pipeline + Vorfilter-Lehren aus Smoke-Tests (Cache-Optimierung, Schema-Disziplin, Topic-Discovery).

---

## 0. Grundprinzipien

1. **Treue vor Eleganz.** Lieber konkrete Zahlen, Bezirke, Beträge nennen als „der Senat plant Maßnahmen zur Verbesserung der Lage".
2. **Neutralität strikt.** Keine bewertenden Adjektive („gefährlich", „berechtigt", „skandalös", „fragwürdig"). Keine Empfehlungen, keine Spekulationen.
3. **Zugeschriebene Sprache.** „Die Fraktion fordert", „laut Senat", „die Antwort verweist auf" — niemals als eigene Stimme schreiben.
4. **Berlin-Akteure-Vokabular.**
   - „der Senat von Berlin" (nicht „die Bundesregierung")
   - „die Senatsverwaltung für X" (nicht „das Bundesministerium")
   - „das Bezirksamt Y" (Berlin hat 12 Bezirke als handelnde Verwaltungs-Ebene)
   - „die Regierende Bürgermeisterin / der Regierende Bürgermeister"
5. **Schema-Disziplin.** Tool-Use-Felder strikt einhalten — kerninhalt-Felder sind JSON-Arrays, keine XML-Strings, keine Newline-getrennten Texte.
6. **TOPIC-Tag-Disziplin.** Nur Tags aus dem geschlossenen Berlin-Glossar (47 empirisch validierte Tags). Erfundene Tags werden im Drift-Audit gespeichert für v2-Kuration, ABER der LLM soll sich an die Liste halten.

---

## 1. Drucksachen-Klassen (Berlin-spezifisch)

Berlin hat eine andere DS-Struktur als der Bundestag — vor allem **Schriftliche Anfrage + Antwort als EINHEIT** in derselben PDF (anders als Bundes, wo getrennt). Daher 4 LLM-Klassen + 1 Regex + Skip:

### Klasse 1: `anfrage_antwort` (15.919 DS, 90 % der DS-Korpus)
**Berlin-eigene Klasse** — die Schriftliche Anfrage einer Fraktion + die Senats-Antwort als EINE PDF.

**Erkennungsmerkmale:**
- `dok_typ_label = 'Schriftliche Anfrage'`
- Standard-Header: „Drucksache 19/XXX / Schriftliche Anfrage 19. Wahlperiode / des Abgeordneten Y (Partei) / zum Thema: TITEL / und Antwort vom DATUM"
- Inhalt: Frage 1 / Antwort zu 1 / Frage 2 / Antwort zu 2 ...

**Behandlungsregeln:**
- Beides analysieren in 1 Call (kein separates Antwort-DS — die `Antwort`-DS-Einträge sind 99,89 % byte-identische Duplikate)
- `kerninhalt_frage[]` und `kerninhalt_antwort[]` getrennt aufnehmen
- `antwort_charakter`-Enum: `substantiell` (konkrete Zahlen/Fakten) | `teilantwortend` (manche Fragen offen) | `ausweichend` (v.a. Verweise/Datenlücken)
- `senatsverwaltung` extrahieren (z.B. „Inneres", „Bildung Jugend Familie")
- `bezirk_bezug` falls Anfrage konkret einen Berliner Bezirk betrifft

**Beispiel-Output:**
```json
{
  "zusammenfassung": "Die LINKE-Fraktion fragt nach Planungsstand, Technologien und Kosten der Dekarbonisierung am Kraftwerk Klingenberg. Der Senat antwortet teilweise substanziell — Technologien (Wärmepumpe 50 MW, Biomasse-KWK 210 MW, Gaskessel 300 MW = 560 MW gesamt) sind benannt, aber Investitionskosten als „streng vertraulich" zurückgehalten, Genehmigungsverfahren bislang nicht eingeleitet.",
  "kerninhalt_frage": [
    "Planungsstand der Dekarbonisierung am Standort Klingenberg bis 2032",
    "Investitionskosten und Finanzierung für einzelne Bauabschnitte",
    "Genehmigungsstand der umwelt- und baurechtlichen Verfahren"
  ],
  "kerninhalt_antwort": [
    "Geplante Anlagen bis 2032: 560 MW Gesamtleistung",
    "Investitionskosten als Unternehmensgeheimnis nicht veröffentlicht",
    "Keine Baugenehmigungsverfahren eingeleitet"
  ],
  "thema": ["Klimaschutz", "Energie", "Stadtentwicklung"],
  "antwort_charakter": "teilantwortend",
  "fraktion": "LINKE",
  "senatsverwaltung": "Wirtschaft, Energie und Betriebe",
  "bezirk_bezug": "Lichtenberg"
}
```

### Klasse 2: `antrag` (1.299 DS)
**Politische Forderungen einer Fraktion.**

**Erkennungsmerkmale:**
- `dok_typ_label IN ('Antrag', 'Antrag (Gesetzentwurf)', 'Änderungsantrag')`
- Standard-Struktur: „Antrag der Fraktion X / Titel / Das Abgeordnetenhaus wolle beschließen: / [Forderungen]"
- Klar formuliert, wenig Boilerplate

**Behandlungsregeln:**
- `kerninhalt[]`: konkrete Forderungen als atomare Bullets
- `tonalitaet`-Enum: `sachlich` (neutral) | `fordernd` (klare Maßnahmen) | `kritisch` (Senat-Kritik) | `informierend` (Kenntnisnahme)
- `adressat`: Senat | Bezirksamt X | Bundesregierung (bei Bundesrats-Initiativen) | Abgeordnetenhaus
- `fraktion`: einbringende Fraktion(en)

### Klasse 3: `gesetzentwurf` (227 DS)
**Senats- oder Fraktions-Gesetzentwürfe.** Sehr lang (Ø 366k Z).

**Erkennungsmerkmale:**
- `dok_typ_label IN ('Vorlage zur Beschlussfassung', 'Vorlage zur Beschlussfassung (Gesetzentwurf)')`
- Mit Begründungsteil + Auswirkungs-Abschnitt

**Behandlungsregeln:**
- Cap auf 120k Zeichen (≈ 30k Tokens) — viele Gesetzentwürfe sind 100+ Seiten
- `regelung`: was konkret neu festgelegt wird (2-4 Sätze)
- `begruendung`: offizielle Begründung (2-4 Sätze)
- `auswirkung`: in der DS genannte Folgen/Kosten (leer wenn nicht genannt)
- `betroffene_gruppen`: konkrete Gruppen
- `einbringer`: „Senat" oder einbringende Fraktion(en)

### Klasse 4: `vorlage_senat` (1.066 DS)
**Senats-Vorlagen / Berichte / Verordnungen.**

**Erkennungsmerkmale:**
- `dok_typ_label IN ('Vorlage zur Kenntnisnahme', 'Verordnung', 'Mitteilung zur Kenntnisnahme', '... (Zwischenbericht)', '... (Schlussbericht)', 'Unterrichtung')`

**Behandlungsregeln:**
- Cap auf 120k Zeichen (Verordnungen können sehr lang sein, Ø 130k Z)
- `dokumenttyp`: kurze Bezeichnung
- `senatsverwaltung`: vorlegende Stelle
- `tonalitaet`-Enum: `sachlich` | `informierend` (keine politische Forderung, daher reduzierter Enum)

### Klasse 5: `beschlussempfehlung_regex` (935 DS, KEIN LLM)
**Sehr kurze prozedurale DS (Ø 2.466 Z).**

**Behandlungsregeln:**
- KEIN LLM — Regex-Label statt $0,005/DS LLM-Cost
- Pattern-Erkennung:
  - „Antrag annehmen" / „Beschluss zur Annahme" → `annahme`
  - „Antrag ablehnen" → `ablehnung`
  - „Antrag vertagen" / „Vertagung" → `vertagung`
  - „Antrag für erledigt erklären" → `erledigt`
  - Sonst → `unbekannt`
- Output nur in `regex_label`-Spalte, keine `zusammenfassung` etc.

### Skip-Klasse: `skip`
**KEINE Analyse:**
- `Antwort`-DS-Einträge (99,89 % Duplikate zu Schriftliche-Anfrage-DS — Cost-Halbierung)
- `Wahlvorschlag` (83 DS, administrativ)

---

## 2. Berlin-Topic-Tag-Glossar (v1.1, 47 Tags)

**Methodik:** N-Gramm-Analyse über 18.194 DS-Titel + 11.713 Reden-Frames. Schwelle: Tag-Token kommt in ≥30 Titeln vor. Plus Kuration nach Smoke-Test (Wahlrecht, Partizipation als Kandidaten ergänzt).

**Vollständige Liste:**

| Kategorie | Tags |
|---|---|
| Wohnen / Stadtentwicklung | Wohnen, Stadtentwicklung, Liegenschaften, Bauplanung, Denkmalschutz |
| Mobilität / Verkehr | Mobilität, ÖPNV, Radverkehr, Verkehrssicherheit |
| Bildung / Wissenschaft | Bildung, Hochschulen, Familie |
| Polizei / Justiz / Sicherheit | Polizei, Justiz, Gewaltprävention |
| Sozial / Gesundheit | Soziale Infrastruktur, Gesundheit, Pflege, Wohnungslosigkeit, Inklusion |
| Wirtschaft / Arbeit | Wirtschaft, Arbeitsmarkt, Tourismus |
| Klima / Umwelt | Klimaschutz, Energie, Tierschutz |
| Verwaltung / Bezirke / Bürgernähe | Verwaltung, Bezirke, Digitalisierung, Bürokratie, Transparenz |
| Demokratie / Bürgerrechte | Demokratie, Wahlrecht, Partizipation, Datenschutz, Antidiskriminierung, Geschlechtergerechtigkeit, Extremismus |
| Finanzen / Haushalt | Finanzen, Haushalt, Steuern |
| Kultur / Sport | Kultur, Sport |
| Migration / Integration | Migration, Integration, Geflüchtete |
| Catch-All | Sonstiges |

**Disziplin:** Strict-Enum im Tool-Schema. Drift-Tags (vom LLM erfunden) werden in `topic_drift_json` gespeichert für v2-Kuration, aber strikt in `thema_json` nur Glossar-Tags akzeptieren.

---

## 3. Anti-Halluzinations-Heuristiken (übernommen aus Bundes-Reden v2.1)

Heuristiken H1-H10 sind parlament-/dokument-typ-unabhängig und gelten genauso für Drucksachen-Analyse. Anwendung auf DS-Kontext:

- **H1**: Erfundene konstruktive Forderungen → bei DS: keine Forderungen erfinden die nicht im Antrag stehen
- **H2**: Sanitierte Polemik → bei DS-Anträgen: kritischer Ton der Fraktion erhalten („Abzocke", „Skandal" wörtlich, nicht „Bedenken")
- **H4**: Multi-Punkt-Vollständigkeit → bei Anträgen mit 8 Forderungen alle 8 in `kerninhalt[]` aufnehmen
- **H5**: Ausweichende Antworten nicht zur Position machen → bei `anfrage_antwort`: `antwort_charakter='ausweichend'` setzen, nicht zu klarer Position erfinden
- **H6**: „Wir werden tun"-Rhetorik als Vorhaben kennzeichnen
- **H7**: Ad-hominem mit Distanz-Markierung
- **H8**: Konkrete Zahlen sind Anker → bei DS mit Statistik-Tabellen: aussagekräftige Zahlen in `zusammenfassung`
- **H9**: Keine eigene Bewertung
- **H10**: Selbst-Reflexion gegen Editorialisierung (bei DS niedrigeres Risiko als bei Reden, aber bei Anträgen mit politisch-aufgeladener Sprache relevant)

Details: siehe `docs/summarization-methodology.md` Sektion 3.

---

## 4. Vorfilter-Pipeline (vor LLM-Call)

**1. Boilerplate-Strip** (`stripBoilerplate` in `berlin-drucksachen-prompts.ts`):
- Anker: „Im Namen des Senats von Berlin beantworte ich" (99,8 % aller Anfragen)
- Strippe Header bis nach dem Anker
- Strippe Page-Marker-Boilerplate „-- N of M --" + Seite-Header
- **Reduktion:** 12-30 % je nach DS-Größe (32 % bei kurzen <5k DS, 8 % bei sehr langen >50k)

**2. Truncation-Cap** (`capText`):
- `anfrage_antwort`: 60.000 Z (≈ 15k Tokens)
- `antrag`: 24.000 Z (≈ 6k Tokens)
- `gesetzentwurf`: 120.000 Z (≈ 30k Tokens)
- `vorlage_senat`: 120.000 Z (≈ 30k Tokens)
- Truncation-Flag wird im User-Message dokumentiert („gekürzt auf X Z.")

**3. Antwort-Duplikat-Skip:**
- 99,89 % der `Antwort`-DS sind byte-identisch zur zugehörigen `Schriftliche Anfrage`-DS
- Edge-Case: 4 von 17 Mismatches haben Antwort LÄNGER als Anfrage — für diese die längere Variante wählen
- Spart 50 % LLM-Calls (15.886 Duplikate skipped)

---

## 5. JSON-Output-Schema (siehe `src/lib/berlin-drucksachen-prompts.ts`)

Pro Klasse ein eigenes Tool-Schema mit klassen-spezifischen Pflichtfeldern. Common-Felder über alle LLM-Klassen:
- `zusammenfassung` (3-5 Sätze, 80-150 Wörter)
- `thema` (JSON-Array, 1-3 Tags aus 47-er-Glossar)
- klassen-spezifische `tonalitaet`-Enums

**Anti-Drift-Disziplin im System-Prompt:**
```
OUTPUT-DISZIPLIN — SEHR WICHTIG:
- Die kerninhalt-Felder sind JSON-Arrays von Strings, KEIN XML, KEIN Newline-getrennter Text.
- Korrekt:   "kerninhalt": ["Erste Forderung", "Zweite Forderung"]
- Falsch:    "kerninhalt": "<item>Erste</item><item>Zweite</item>"
```

---

## 6. Cost-Effizienz (Cache-Optimierung)

**Cache-TTL: 5 Min ephemeral.**
- 1 System-Prompt pro Klasse (statt Tier-Varianten) → bei 15.000 sequentiellen `anfrage_antwort` Cache-Hit ≈ 99 %
- System-Prompt ist 0,5k Tokens → Cache-Einsparung gering (Methodology kompakt im Code, nicht im Prompt)
- Real-Cost pro DS via Batch: $0,005-0,006 (Smoke-Test-validiert)

---

## 7. Bundes-DS-Pipeline-Lehren erfolgreich übertragen

| Bundes-Lehre | Berlin-Anwendung |
|---|---|
| 6 Batch-Klassen mit typ-spez. Prompts | ✅ 4 LLM-Klassen + 1 Regex + 1 Skip |
| TOPIC_TAGS als geschlossenes Enum | ✅ 47 Berlin-Tags empirisch validiert |
| `topic_drift_audit`-Sammlung | ✅ `topic_drift_json` pro Eintrag |
| Idempotenz via PK + INSERT OR REPLACE | ✅ dbid als PK |
| `prompt_version` für Re-Run-Tracking | ✅ `berlin-v1.1` |
| Token-Usage pro Eintrag | ✅ input/cache_read/cache_create/output |
| Klassen-spezifische Tonality-Enums | ✅ 4 verschiedene Enums je Klasse |

---

## 8. Reden-Pipeline-Lehren erfolgreich übertragen

| Reden-Lehre | Berlin-DS-Anwendung |
|---|---|
| Eigene Methodology-Datei (kein SHA-Drift) | ✅ diese Datei + `src/lib/berlin-drucksachen-prompts.ts` |
| Cache-Optimierung (1 Prompt pro Klasse) | ✅ Tier-System bewusst weggelassen |
| Schema-Disziplin gegen Array-Drift | ✅ Beispiele in description |
| Umlaut-Tolerante Validation | Tag-Match Validation (ae/oe/ue ↔ ä/ö/ü) im Retrieve |
| 4-Batch-Strategie mit 1/e-Threshold | ✅ analog Reden (200 → 2.000 → 7.000 → 9.311) |
| Quality-Gates zwischen Batches | ✅ Cache-Hit / Array-Bugs / Glossar-Match / Success-Rate |

---

## 9. Versionsgeschichte

**v1 — 2026-05-23 (Erst-Erstellung):**
- 4 LLM-Klassen + 1 Regex-Klasse + 1 Skip-Klasse
- 45 Topic-Tags (kombiniert aus Bundes-DS + Berlin-Reden-Frames)
- Tier-System (standard/long/massive) übernommen aus Bundes-DS
- Schema mit array+object-Output-Feldern

**v1.1 — 2026-05-23 (nach Smoke-Test-Iteration):**
- Topic-Tags v2: 47 statt 45, empirisch validiert über 18.194 DS-Titel (Schwelle ≥30 Reden Coverage)
  - Gestrichen (zu selten): Mietrecht, Innere Sicherheit, Versammlungsrecht, Mittelstand, Umweltschutz, Kinderbetreuung
  - Hinzugefügt: Transparenz, Wahlrecht, Partizipation, Familie, Bauplanung, Denkmalschutz
- Tier-System entfernt (1 System-Prompt pro Klasse für Cache-Hit)
- Schema-Disziplin-Block im System-Prompt (Anti-XML-Drift)
- Array-Beispiele in Tool-Schema-`description`
- `minItems: 1` für kerninhalt-Arrays (verhindert leere Arrays)

**v1.2 — 2026-05-25 (nach Stage-1-Stichproben-Review, 100 DS):**
- **Header-Meta-Pre-Extract** (`extractHeaderMeta`): Vor Boilerplate-Strip Fraktion, Abgeordnete:r, Senatsverwaltung und DS-Datum aus dem ersten 2,5k-Block per Regex ziehen und dem LLM als `STRUKTURIERTE METADATEN`-Block in der User-Message mitgeben.
  - **Grund**: Stage-1-Empirie 52 % Fraktion-Miss bei Schriftlichen Anfragen — der Strip-Anker `Im Namen des Senats…` schneidet bei Pos ~700 alles davor weg, inklusive Fraktion-Header (`des Abgeordneten X (PARTEI)`). LLM bekam Info also nie zu sehen.
  - Projektion Stage 4: rettet ~8.300 Fraktion-Werte (für Aggregation Fraktion × Topic × Zeit notwendig).
- **Fraktions-Normalisierung** (`normalizeFraktion`): Long-Form (`Bündnis 90/Die Grünen`) → Short-Enum (`GRÜNE`), Multi-Fraktion via `+` join. Konsistenz zwischen Anträgen (Long-Form-Tendenz) und Anfragen (Short-Form).
- **Plenarprotokoll-Routing-Fix** in `classifyBerlinDoc`: `dok_art_label !== 'Drucksache'` → `skip`. 767 'Antwort'+'Plenarprotokoll'-DS sind Mündliche-Anfragen-Antworten und gehören in die Reden-Pipeline, nicht hierhin.

---

## 10. Datenquellen + Audit-Trail

- **Korpus:** 35.482 Berlin-Drucksachen (PARDOK-XML, Stand 19. WP)
- **Volltexte:** `berlin_pdf_texts` (PDFs aus parlament-berlin.de)
- **LLM-Output:** `berlin_drucksachen_analyses` (Schema in `scripts/init-berlin-drucksachen-analyses-schema.ts`)
- **Topic-Discovery:** `scripts/analyze-berlin-ds-topics.ts` (N-Gramm + Glossar-Validation)
- **Smoke-Tests:** `scripts/smoketest-berlin-drucksachen.ts` (10 DS, ~$0,06)
- **Submit/Retrieve:** `scripts/batch-{submit,retrieve}-berlin-drucksachen.ts` (4-Batch-Strategie)
- **Methodology-SHA:** wird pro Eintrag in `prompt_version` gespeichert
