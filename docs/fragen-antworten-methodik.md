# Fragen & Antworten (Schriftliche Anfragen) — Methodik & Datenfluss

**Single Source of Truth** für: wie wir Schriftliche Anfragen (Frage→Senatsantwort) behandeln —
was extrahiert wird, wohin es kommt, wie es verlinkt ist, wie die Suche damit umgeht.

Stand: 2026-05-30. Gilt **für Berlin** (Abgeordnetenhaus). Der Bundestag hat eine eigene,
separate `/fragen`-Seite (master-Branch); diese Doc beschreibt **nur den Berlin-Pfad**.

---

## 1. Was ist eine „Frage & Antwort"?

Eine **Schriftliche Anfrage** eines/r Abgeordneten an den Senat plus dessen Antwort. In unserer DB
ist das eine Berlin-Drucksache mit `klasse = 'anfrage_antwort'`. Anders als beim Bundestag braucht
es **keine separate Q&A-Extraktion** — jede anfrage_antwort-Drucksache **ist** bereits ein
Frage→Antwort-Dokument (Frage-Bullets + Senatsantwort-Bullets + Urheber:in).

**Mengengerüst:** 15.929 von 19.449 Berlin-Drucksachen sind anfrage_antwort — **82 %**. Das ist die
mit Abstand dominanteste Klasse. Diese Dominanz ist der rote Faden hinter mehreren Design-Entscheidungen
unten (Such-Ranking, eigene `/fragen`-Seite).

---

## 2. Datenquelle & Dokument-Struktur

- **Quelle:** PARDOK (`pardok.parlament-berlin.de`), geseedet via `scripts/seed-berlin-pardok.ts`
  → Tabelle `berlin_documents` (`dok_typ = 'SchrAnfr'`, `dok_art_label = 'Drucksache'`).
- **Normalfall (15.915 dok_nr):** Frage **und** Antwort stecken in **einem** Dokument
  (`dok_typ = 'SchrAnfr'`). `dok_datum` = das „vom"-Datum der Anfrage (PARDOK-Feld `DokDat`).
- **Sonderfall (Split, sehr selten):** Frage und Antwort sind **zwei** Dokumente —
  Frage = `dok_typ='SchrAnfr'`, Antwort = `dok_typ='a'`, gleiche `dok_nr`. Die Analyse/Q&A-Seite hängt
  am **Frage-Dokument**. Beim Split kann dem Frage-Dokument das `dok_datum` fehlen (s. §8).
- **Urheber:innen:** `berlin_document_persons` mit `role = 'urheber'` → `politicians` → `parties`.
  Ein Dokument kann mehrere Urheber:innen haben (→ „+N" in der UI).

---

## 3. Extraktion (LLM)

Q&A werden **im Zuge der Berlin-Drucksachen-Pipeline** analysiert (Haiku 4.5, Batch API) —
**kein eigener Lauf**. Details der Pipeline: **`docs/summarization-methodology-berlin-drucksachen.md`**.

Pro anfrage_antwort-Dokument extrahiert die Pipeline nach `berlin_drucksachen_analyses`:

| Feld | Inhalt |
|---|---|
| `klasse` | `'anfrage_antwort'` (Klassifikator `classifyBerlinDoc`) |
| `zusammenfassung` | Fließtext-Zusammenfassung der Anfrage |
| `kerninhalt_frage_json` | **JSON-Array** der Frage-Stichpunkte |
| `kerninhalt_antwort_json` | **JSON-Array** der Senatsantwort-Stichpunkte |
| `antwort_charakter` | Enum: `substantiell` / `teilantwortend` / `ausweichend` (Hofmann-Frage) |
| `thema_json` | Themen-Tags (Array) |
| `tonalitaet` | Tonalität (Frame-Glossar Berlin) |
| `fraktion` | Urheber-Fraktion (Strict-Whitelist) |
| `derived_titel` | KI-Titel, **nur falls** das PARDOK-`titel`/`abstract` leer ist (s. §8) |
| `error_type` / `error_message` | gesetzt bei Analyse-Fehlern → solche Zeilen werden überall gefiltert |

**Array-Robustheit:** Haiku liefert ~3 % stringifizierte Arrays + Tippfehler-Enums. Beim Auslesen
in der App immer über `safeJsonArray()` (db.ts) parsen — nicht `JSON.parse` direkt. (Vgl. Memory
`llm-array-drift`.)

---

## 4. Indexierung (Volltextsuche, FTS5)

Tabelle `berlin_drucksachen_fts` (definiert in `src/lib/search-fts.ts`, `ensureSearchFTS`):

```
dbid UNINDEXED, klasse UNINDEXED, dok_nr, titel, zusammenfassung, kerninhalt, thema_tags
tokenize = 'unicode61 remove_diacritics 2'
```

- **`kerninhalt`** = `kerninhalt_json ‖ kerninhalt_frage_json ‖ kerninhalt_antwort_json`
  (zusammengeführt, Klammern/Quotes ersetzt durch ` · `). → **Frage UND Antwort sind durchsuchbar.**
- **`titel`** fällt auf `derived_titel` zurück (KI-Titel suchbar).
- **`dok_nr`** ist indexiert (Drs.-Nummer suchbar).
- **`klasse`** ist `UNINDEXED` → **kann NICHT per `MATCH` gefiltert werden** (nur via SQL-`WHERE fts.klasse=…`).
- **Sync:** Trigger `…_ai`/`…_au`/`…_ad` auf `berlin_drucksachen_analyses` halten den Index live.
  `dok_datum` ist **nicht** im Index → Datums-Backfills brauchen **keinen** FTS-Rebuild.

Rebuild bei Schema-Änderung: `scripts/rebuild-berlin-drucksachen-fts.ts`.

---

## 5. UI-Surfaces & Verlinkung (die Landkarte)

Drei Stellen zeigen Q&A — jede mit eigenem Zweck:

### a) `/parlamente/berlin/fragen` — die dedizierte Q&A-Liste (Browse)
Datei: `src/app/parlamente/berlin/fragen/page.tsx` (Server-Component, GET-Form).
- Daten: `getBerlinQaList(q, page, perPage=30, partei, sort)` (db.ts).
- **Filter Partei:** Dropdown aus `getBerlinQaParties()` (Parteien mit Count, häufigste zuerst).
  SQL-Filter via `EXISTS` auf Urheber-Partei.
- **Sortierung:** `sort='neu'` (dok_datum DESC, Default) / `'alt'` (ASC).
- **Suche:** LIKE über zusammenfassung / frage / antwort / dok_nr / derived_titel / titel.
- Pagination erhält `q` + `partei` + `sort`. „Zurücksetzen"-Link bei aktivem Filter.
- **Verlinkung pro Karte:**
  - Urheber:in → `/politiker/[politician_id]` (+ Partei-Label + „+N" Mitzeichner)
  - Drs.-Nummer → `/parlamente/berlin/drucksache/[dbid]`
  - Antwort des Senats → ausklappbares `<details>` (Bullets)
- Nav-Eintrag: `MORE_NAV_BERLIN` in `src/components/SiteChrome.tsx` (`MessageSquareQuote`).

### b) `/parlamente/berlin/drucksache/[dbid]` — die Einzel-Detailseite
Datei: `src/app/parlamente/berlin/drucksache/[dbid]/page.tsx` (Hero + Karten, Bundestag-Layout).
- Daten: `getBerlinDrucksacheDetail(dbid)`. Zeigt Frage- + Antwort-Karten, Datum, Urheber, Thema.
- **Das ist das Link-Ziel** aller Q&A-Treffer (aus /fragen UND aus der Suche). `/fragen` ist eine
  Browse-Liste — niemals ein einzelner Treffer dorthin verlinken.

### c) Smarte Suche (Schnell + Detail) — Q&A als Drucksachen-Treffer
- `searchBerlin()` (Schnellsuche/CommandPalette) und `searchBerlinByType()` (Volltextliste) in
  `src/lib/suche.ts`. Q&A erscheinen als `type='drucksache'` mit `batch_class='anfrage_antwort'`.
- Pro Treffer zeigt die UI ein **Klassen-Badge** („Schriftliche Anfrage") — `CommandPalette.tsx` /
  `SearchFullList.tsx` (`dsKlasseShort`).
- Detailsuche (`/parlamente/berlin/suche/detail`) hat einen **Klasse-Filter** inkl. „Schriftliche Anfrage".
- Link-Ziel: `detail_url = /parlamente/berlin/drucksache/[dbid]` (= Surface b).

---

## 6. Such-Ranking: Q&A nach unten

**Entscheidung (2026-05-30):** Weil Q&A 82 % aller DS sind, würden sie sonst die legislativen
Drucksachen (Antrag/Gesetzentwurf/Senatsvorlage/Beschlussempfehlung) bei jeder Themensuche erdrücken.
Darum ist `klasse='anfrage_antwort'` der **führende Sortier-Key ans Ende**:

- `searchBerlin` (suche.ts ~Z.960): `ORDER BY (CASE WHEN fts.klasse='anfrage_antwort' THEN 1 ELSE 0 END), <Original-Treffer>, dok_datum DESC`
- `searchBerlinByType` (suche.ts ~Z.844, `klassePrio`): derselbe Prio-Key vor dem gewählten Sort
  (Datum/Relevanz). Bei aktivem Klasse-Filter ist der Key konstant → wirkungslos (kein Nebeneffekt).

Effekt: legislative DS zuerst, Q&A darunter. Innerhalb jeder Gruppe bleibt die bisherige
Reihenfolge erhalten.

---

## 7. Neutralität

Q&A sind Fakten-Wiedergabe, keine Wertung. `antwort_charakter` (substantiell/teilantwortend/ausweichend)
ist eine **deskriptive** Einordnung der Antwort-Vollständigkeit, kein Skandal-Frame
(vgl. Memory `no-gotcha-framing`). Keine Wertung der Anfrage selbst, keine Partei-Gewichtung außer
der faktischen Urheber-Zuordnung.

---

## 8. Sonderfälle & Datenqualität

- **Dateless Frage-Dokument (Split-Fall):** Bei Split-Anfragen kann dem Frage-Dokument das `dok_datum`
  fehlen. Stand 2026-05-30 war das **1 Fall** (D-437479 / 19/23418). Fix = **manueller Quell-Backfill**
  aus dem PARDOK-PDF (das „vom …"-Datum der Anfrage). Beispiel: `dok_datum='2025-07-21'`.
  ⚠️ **Re-Seed überschreibt das wieder mit leer** (Quelle hat es nicht) → nach jedem
  `seed-berlin-pardok.ts` neu prüfen: `… WHERE klasse='anfrage_antwort' AND (dok_datum IS NULL OR TRIM(dok_datum)='')`.
- **Titellose DS:** ~1.320 DS hatten keinen PARDOK-Titel → KI-Titel in `derived_titel`
  (`scripts/batch-berlin-ds-titles.ts`). Auflösung überall via `COALESCE(titel, abstract, derived_titel)`.
- **Fraktionslose:** `fraktion`/Partei kann NULL sein (z. B. Dr. King, Brousek) → UI muss das tolerieren.

---

## 9. Update-Runbook (was nach einem Daten-Update neu laufen muss)

Nach einem Berlin-Drucksachen-Update **in dieser Reihenfolge**:

1. `scripts/seed-berlin-pardok.ts` — neue/aktualisierte Dokumente (kostenlos).
2. **Datums-Lücken prüfen** (s. §8) — dateless anfrage_antwort manuell backfillen, falls vorhanden.
3. Berlin-Drucksachen-LLM-Pipeline für neue DS (Batch, kostenpflichtig → **vorher fragen**).
   Siehe `docs/summarization-methodology-berlin-drucksachen.md` + Memory `berlin-drucksachen-pipeline`.
4. `scripts/batch-berlin-ds-titles.ts` — KI-Titel für neue titellose DS (kostenpflichtig → fragen).
5. `scripts/rebuild-berlin-drucksachen-fts.ts` — FTS-Index neu (kostenlos). **Nur** nötig bei neuen
   DS oder FTS-Schema-Änderung; **nicht** für reine `dok_datum`-Backfills.

Kein Schritt schreibt parallel aus zwei Worktrees in `politik.db` (vgl. Memory
`parallel-worktree-landtag`).

---

## 10. Code-Anker (Stand 2026-05-30, Zeilen ungefähr)

| Was | Pfad |
|---|---|
| `BerlinQaItem` / `getBerlinQaList` / `getBerlinQaParties` | `src/lib/db.ts` (~5865 / ~5884 / ~5959) |
| `getBerlinDrucksacheDetail` | `src/lib/db.ts` |
| Q&A-Listenseite | `src/app/parlamente/berlin/fragen/page.tsx` |
| DS-Detailseite | `src/app/parlamente/berlin/drucksache/[dbid]/page.tsx` |
| Such-Ranking (Q&A ans Ende) | `src/lib/suche.ts` (`searchBerlin` ~960, `searchBerlinByType` `klassePrio` ~844) |
| FTS-Schema + Trigger | `src/lib/search-fts.ts` (`ensureSearchFTS`, `berlin_drucksachen_fts`) |
| FTS-Rebuild | `scripts/rebuild-berlin-drucksachen-fts.ts` |
| KI-Titel | `scripts/batch-berlin-ds-titles.ts` |
| PARDOK-Seed | `scripts/seed-berlin-pardok.ts` |
| Nav-Eintrag | `src/components/SiteChrome.tsx` (`MORE_NAV_BERLIN`) |

**Verwandte Docs:** `docs/summarization-methodology-berlin-drucksachen.md` (LLM-Extraktion),
`docs/PIPELINE.md` (Master-Runbook), `docs/DATA-SOURCES.md` (Quellen-Manifest).
