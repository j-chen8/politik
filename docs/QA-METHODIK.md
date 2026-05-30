# Q&A-Methodik — Fragen & Antworten im Bundestag (SoT)

**Single Source of Truth** für: wie wir parlamentarische Frage→Antwort-Daten extrahieren,
in welche Tabellen sie wandern, wie sie verlinkt/angezeigt werden und wie man sie aktualisiert.
Stand: 2026-05-30. Bei Änderungen diese Datei zuerst aktualisieren.

Verwandt: `docs/qa-extraction-bestandsaufnahme.md` (ursprüngliche Bestandsaufnahme/Begründung),
`docs/PIPELINE.md` (Gesamt-Pipeline), `docs/DATA-SOURCES.md` (Quellen + Update-Trigger).

---

## 1. Vier Instrument-Typen — unterschiedliche Struktur, unterschiedliche Methode

Parlamentarische Fragen kommen in vier Formen vor, die sich technisch grundverschieden verhalten.
**Die Wahl der Extraktionsmethode richtet sich nach der Struktur, nicht nach dem Wunsch.**

| Typ | Menge | Paarbar? | Methode |
|-----|-------|----------|---------|
| **Schriftliche Fragen** (Sammeldrucksachen) | 58 Docs → 7.503 Paare | ✅ deterministisch | Marker-Parsing |
| **Kleine/Große Anfragen** (KA/GA) | 2.029 KA + 12 GA, 1.383 Antwort-Docs | ⚠️ nur per LLM | LLM-Split + LLM-Index-Paarung |
| **Fragestunde / Mündliche Fragen** (Plenum) | 1.063 gepaart | ⚠️ heuristisch | Reihenfolge in (Sitzung, TOP) |
| **Berlin** (AGH) | 15.929 `anfrage_antwort` | ✅ bereits fertig | Blaupause, LLM-Split |

### 1a. Schriftliche Fragen — DETERMINISTISCH (kein LLM, gratis)
Eine Sammeldrucksache bündelt ~100 unabhängige Einzelfragen verschiedener Abgeordneter, jede mit
direkt darunter stehender Antwort. Eindeutige Marker erlauben verlustfreies Splitten:
- Frage-Start: `\n(\d{1,3})\.\s+Abgeordnete[r]?\s*\n` (z.B. „79. Abgeordneter")
- Antwort-Intro: `Antwort des/der <Rolle+Name> vom <Datum>`

→ **Ein Eintrag pro Frage-Antwort-Paar.** Skript: `scripts/extract-schriftliche-fragen-qa.ts`.

**Sammelantworten:** „Die Fragen 4 bis 7 werden zusammen beantwortet." hängt den Antworttext nur
an eine Frage (meist die letzte der Gruppe). `linkJointAnswers()` überträgt die Sammelantwort
(inkl. Steller/Datum) auf die leeren Geschwister-Fragen — sonst stünden die anderen Fragen der
Gruppe ohne Antwort da (war der Fall bis 2026-05-30: 140 leere Paare → 4 echte Edge-Cases).

### 1b. Kleine/Große Anfragen — LLM (deterministisch gescheitert)
KA/GA sind anders gebaut: die Fraktion stellt einen Katalog nummerierter Fragen in **einem** Dokument,
die Bundesregierung antwortet in einem **separaten** Antwort-Dokument, das auf das Frage-Dokument
verweist (`drucksache_texts.referenced_drucksache_nr`). Die Antworten referenzieren oft eine
„Vorbemerkung der Bundesregierung" und verweisen aufeinander („siehe Antwort zu Frage 3").
**Deterministische Einzelpaarung scheitert** (Vorbemerkungs-Prosa wird als Frage missdeutet,
Querverweise sind ohne Kontext sinnlos) — siehe Bestandsaufnahme, Abschnitt C+.

Zweistufig per Haiku-Batch:
- **Phase C** (`scripts/batch-bundestag-qa-split.ts`): pro Antwort-Doc je eine Bullet-Liste
  `kerninhalt_frage_json` + `kerninhalt_antwort_json` + `antwort_charakter` (Enum) extrahieren.
- **Phase C+** (`scripts/batch-ka-pair-bullets.ts`): die Bullets paaren — **Index-Mapping-Trick**:
  nur die Bullets gehen an den LLM, der gibt **nur Zuordnungen** (F→A[]) zurück, die Paare werden
  lokal **wörtlich** zusammengesetzt → kein Paraphrase-Risiko, ~$0,63 statt ~$12.
  Ergebnis: `kerninhalt_qa_paare_json` = `[{frage, antwort}]`.

### 1c. Fragestunde / Mündliche Fragen — HEURISTISCH
Im Plenarprotokoll wechseln sich Frage- und Antwort-Redebeiträge ab. Paarung über Reihenfolge:
eine Regierungs-Antwort wird der unmittelbar vorhergehenden Frage in derselben (Sitzung, TOP)
zugeordnet. Skript: `scripts/pair-fragestunde-qa.ts` → `plenar_speeches.antwort_auf_speech_id`.

### 1d. Berlin
`berlin_drucksachen_analyses` Klasse `anfrage_antwort` hat bereits `kerninhalt_frage_json` +
`kerninhalt_antwort_json` + `antwort_charakter`. War die Blaupause für den Bundestag.

---

## 2. Wo alles landet (Tabellen + Spalten)

| Tabelle / Spalte | Inhalt | Typ |
|------------------|--------|-----|
| `drucksache_qa_paare` | Schriftliche-Fragen-Einzelpaare (7.503) | 1a |
| ├ `frage_text`, `antwort_text` | Wortlaut Frage/Antwort | |
| ├ `fragesteller_name/_party/_politician_id` | Fragesteller (95,8 % MdB-Match) | |
| ├ `antwort_steller`, `antwort_datum` | Antwortgeber + dt. Datum („29. Juli 2025") | |
| └ `antwort_datum_iso` | **sortierbares** ISO-Datum (s. §4) | |
| `drucksache_analyses.kerninhalt_frage_json` | KA/GA Frage-Bullets (1.383) | 1b/C |
| `drucksache_analyses.kerninhalt_antwort_json` | KA/GA Antwort-Bullets | 1b/C |
| `drucksache_analyses.antwort_charakter` | Enum (antwortend/teilweise/ausweichend …) | 1b/C |
| `drucksache_analyses.kerninhalt_qa_paare_json` | gepaarte `[{frage,antwort}]` (1.383) | 1b/C+ |
| `plenar_speeches.antwort_auf_speech_id` | Fragestunde-Paarung (1.063) | 1c |
| `qa_fts` (FTS5) | Suchindex über drucksache_qa_paare | s. §3 |

---

## 3. Suche (FTS5)

- **`qa_fts`** (`src/lib/search-fts.ts`): FTS5 über `frage_text + antwort_text + fragesteller_name`,
  `pair_id` UNINDEXED (= `drucksache_qa_paare.id`). Tokenizer `unicode61 remove_diacritics 2`.
- **Auto-Sync via Trigger** `qa_paare_ai/au/ad` auf `drucksache_qa_paare` — bleibt nach jedem
  INSERT/UPDATE/DELETE aktuell, auch nach Server-Restart. Kein manuelles Rebuild bei Einzeländerungen.
- **Hauptsuche** (`src/lib/suche.ts`): Ergebnistyp `qa` (`QaHit`) in `search()` + `searchByType()`.
  Synonym-Layer + BM25 (Frage 2 / Antwort 1 / Fragesteller 3) greifen automatisch. Datum =
  `COALESCE(antwort_datum_iso, publication_date)`.
- KA/GA-Paare (`kerninhalt_qa_paare_json`) sind **nicht** in `qa_fts` — sie werden über
  `drucksachen_fts` (Doc-Ebene: Titel/Zusammenfassung/Kerninhalt) gefunden.

---

## 4. Datum (warum `antwort_datum_iso`)

Das Doc-Datum (`drucksache_texts.publication_date`) ist bei 4 von 58 Sammeldrucksachen NULL —
ausgerechnet den neuesten. Deshalb ist die **primäre Datumsquelle das pro-Paar erfasste
`antwort_datum`** („29. Juli 2025", 98 % Coverage), normalisiert nach `antwort_datum_iso`.
- Parser: `scripts/_lib/german-date.ts` → `parseGermanDate` / `parseAntwortDatumIso`. Toleriert
  OCR-Macken (fehlender Punkt/Leerzeichen). Verwirft fehlendes Jahr / OCR-Müll („202S").
- **Invariante:** Ein Antwortdatum kann nie NACH `publication_date` liegen → solche Quell-Typos
  (z.B. „17. Juni 2026" in einer 2025er-DS) fallen auf `publication_date` zurück.
- **Anzeige-/Sortier-Datum überall:** `COALESCE(antwort_datum_iso, publication_date)`. NULLs (15
  echte) werden via `ORDER BY datum IS NULL, …` in **beiden** Richtungen ans Ende sortiert.

---

## 5. UI / Verlinkung

| Ort | Was | Quelle |
|-----|-----|--------|
| **`/fragen`** | Durchsuchbare Liste aller Schriftliche-Fragen-Paare; Partei-Filter (Fraktionen ≥20) + Sortierung neu/alt | `getQaPaareList`, `getQaPaareParties` |
| **`/aktivitaeten/<nr>`** (Drucksachenseite) | Schriftliche Fragen: „Fragen & Antworten" (Paare). KA/GA: „Frage & Antwort" — gepaarte F→A-Liste (`kerninhaltQaPaare`), Fallback Zwei-Spalten | `getDrucksacheDetail`, `getDrucksacheQaPaare` |
| **`/politiker/<id>`** | „Schriftliche Fragen"-CollapsibleCard (Fragen dieser Person) | `getQaPaareForPolitician` |
| **Hauptsuche** (`/suche`, Palette, Detail) | Ergebnistyp „Fragen & Antworten" → verlinkt auf Drucksachenseite | `qa_fts` / `suche.ts` |
| **`/protokolle/sitzung/<nr>`** | Fragestunde: „↳ Antwort auf die Frage von <Name>" | `antwort_auf_speech_id` |
| **Nav** (SiteChrome) | „Fragen & Antworten" im Mehr-Dropdown → `/fragen` | |

Profil-Dopplung vermeiden: `getParlamentarischeArbeit` filtert Schriftliche Fragen raus (sonst
doppelt mit der „Schriftliche Fragen"-Card).

---

## 6. Datenhygiene

- **Footer/Wasserzeichen** werden in `clean()` (`extract-schriftliche-fragen-qa.ts`) gestrippt:
  Bundestag-Footer beider Layouts, Seitenmarker „– N of M –", und das PDF-Wasserzeichen
  **„Vorabfassung – wird durch die lektorierte Version ersetzt."** (Variante `Version|Fassung`).
  Echte Querverweise „Drucksache 21/X" bleiben erhalten (nur footer-anhängende werden entfernt).
- Nachträgliche Bereinigung bestehender Zeilen: `scripts/clean-qa-watermark.ts --apply` (idempotent).
- **Kein Re-Scraping** — der Rohtext liegt in `drucksache_texts.full_text` vor.

---

## 7. Update-Runbook

**Neue Schriftliche-Fragen-Drucksachen** (nach DS-Pipeline-Lauf):
```
npx tsx scripts/extract-schriftliche-fragen-qa.ts            # Dry-Run (Stats/Samples)
npx tsx scripts/extract-schriftliche-fragen-qa.ts --write    # schreibt Paare + antwort_datum_iso
```
- Idempotenter Upsert auf `(drucksache_nr, paar_index)`. `antwort_datum_iso` wird automatisch
  mitgeschrieben (ISO-Normalisierung + Invariante sind in die Extraktion integriert — **kein
  separater Backfill mehr nötig**).
- `qa_fts` aktualisiert sich via Trigger automatisch. Nur bei Schema-Reset:
  `rebuildSearchFTS(db)` aus `src/lib/search-fts.ts`.

**Neue KA/GA-Antwort-Docs:**
```
npx tsx scripts/batch-bundestag-qa-split.ts --submit / --poll <id>   # Phase C  (~$0,005/Doc)
npx tsx scripts/batch-ka-pair-bullets.ts   --submit / --poll <id>    # Phase C+ (~$0,63 / 1.383 Docs)
```
→ Kosten vor Submit immer mit `--dry-run` prüfen; **vor jedem kostenpflichtigen Lauf fragen.**

**Neue Fragestunden:** `npx tsx scripts/pair-fragestunde-qa.ts --write`.

**Code-Änderungen** (UI/Suche) brauchen Build+Deploy; reine Daten-Updates sind via `force-dynamic`
sofort live (gemeinsame `politik.db`). Prod-Deploy nur auf ausdrückliches „live".

---

## 8. Berlin (AGH) — Dokument-Korn statt Paar-Korn

Berlin folgt demselben **Ergebnistyp-Muster** wie der Bundestag (eigener `qa`-Typ, eigene `/fragen`-Seite),
aber bei **anderem Datenkorn** — und das ist Absicht, nicht Inkonsequenz (§1: „Methode richtet sich
nach der Struktur").

- **Struktur:** Eine Berliner `anfrage_antwort`-Drucksache ist **eine** zusammenhängende Anfrage **einer**
  MdA (mit Unterfragen), nicht ein Bündel unabhängiger Fragen wie eine Bundestags-Sammeldrucksache.
  → **Ein Q&A-Hit pro Dokument** (kein Paar-Split). Urheber = Fragesteller (`berlin_document_persons`
  role='urheber'), Frage = erste `kerninhalt_frage_json`-Bullet (Fallback Zusammenfassung).
- **Daten:** `berlin_drucksachen_analyses` Klasse `anfrage_antwort` (`kerninhalt_frage_json` +
  `kerninhalt_antwort_json` + `antwort_charakter`). 15.929 Stück = **82 %** aller Berlin-DS.
- **Suche:** kein eigener FTS — `berlin_drucksachen_fts WHERE klasse='anfrage_antwort'`, emittiert als
  `QaHit` (mit `detail_url` → Berlin-DS-Seite, `parliament: "berlin"`). `searchBerlin` /
  `searchBerlinByType` (`src/lib/suche.ts`, Helper `mapBerlinQaHits`). Die Berlin-**Drucksachen**-Sektion
  schließt `anfrage_antwort` explizit aus (`AND klasse != 'anfrage_antwort'`) → kein Erschlagen der
  legislativen DS, **ohne** Sortier-Hack. Datum: `bd.dok_datum`, NULLs via `dok_datum IS NULL` ans Ende.
- **UI:** `/parlamente/berlin/fragen` (Liste, Partei-Filter `getBerlinQaParties`, Sort neu/alt,
  `getBerlinQaList`); Berlin-DS-Detailseite zeigt Frage/Antwort; Detailsuche hat einen
  „Fragen & Antworten"-Typ-Tab (anfrage_antwort ist **nicht** mehr im Drucksachen-Klasse-Filter).
- **Datum-Sonderfall:** Split-Anfragen (`dok_typ='SchrAnfr'` + `'a'`, gleiche dok_nr) können dem
  Frage-Dokument das `dok_datum` fehlen → manueller Quell-Backfill aus PARDOK-PDF; **Re-Seed
  überschreibt wieder mit leer** → nach jedem `seed-berlin-pardok.ts` dateless `anfrage_antwort` prüfen.
- **Berlin-Update-Runbook:** `seed-berlin-pardok.ts` → Datums-Lücken prüfen → DS-LLM-Batch (kostenpfl.,
  vorher fragen) → `batch-berlin-ds-titles.ts` → `rebuild-berlin-drucksachen-fts.ts`.
