# Session 2026-05-25: Berlin-Drucksachen + Plenum-Votes (BT+Berlin) + UI

**Branch:** `landtag` · **Cost gesamt:** $98,98 · **Dauer:** ein Sitz · **13 Commits**

> Dieses Dokument ist die Prozess-Dokumentation, wie wir die drei Pipelines aufgebaut, validiert und in die UI integriert haben. Es ergänzt die Methodik-Doku `docs/summarization-methodology-berlin-drucksachen.md` (DS-Inhalt) und ist als Vorlage für künftige Parlament-Erweiterungen gedacht.

---

## 1. Was wir gebaut haben

### 1.1 Berlin-Drucksachen-LLM-Pipeline
**18.514 LLM-Analysen + 935 Regex-Labels = 19.449 Berlin-Drucksachen analysiert.**

| Stage | Ziel kumuliert | Neue DS | Cost | Cache | Laufzeit |
|---|---:|---:|---:|---:|---:|
| 1 v1.4 | 100 | 100 | $0,86 | 93 % | 7 Min |
| 2 | 1.000 | +900 | $6,80 | 99 % | 11 Min |
| 3 | 7.769 | +6.769 | $35,99 | 100 % | 12 Min |
| 4 | 18.514 | +10.745 | $49,80 | 99 % | 14 Min |
| v1.1-v1.3 Lehrgeld (verworfen) | – | – | $2,61 | – | – |
| **Σ Berlin-DS** | | | **$96,06** | | |

4 Klassen-spezifische Tool-Schemas:
- `anfrage_antwort` (Schriftliche Anfrage + Antwort): 15.929
- `antrag` (Fraktions-Anträge): 1.298
- `gesetzentwurf` (Senats- + Fraktions-Gesetzentwürfe): 224
- `vorlage_senat` (Senats-Vorlagen / Verordnungen): 1.063
- Plus 935 Beschlussempfehlungen via Regex (kein LLM, $0)

### 1.2 Berlin-Plenum-Votes (Handzeichen, Fraktions-Ebene)
**426 echte Vote-Events** verknüpft mit **279 DS**. Cost $1,72. Pattern „bitte ich … um das Handzeichen" über 124 Plenarprotokolle.

### 1.3 Bundestag-Plenum-Votes (Handzeichen, Fraktions-Ebene)
**304 Events** verknüpft mit **245 DS**. Cost $1,20. Pattern „Wer stimmt dafür?" über 64 XML-Plenarprotokolle der 21. WP.

### 1.4 UI-Integration
- `/design/linear/parlamente/berlin/drucksache/[dbid]` (Berlin-DS-Detail-Seite mit Vote-Pills)
- `/design/linear/aktivitaeten/[ds-nr]` (Bundes-DS-Page erweitert um Handzeichen-Vote-Section)
- `/design/linear/abstimmungen` (kombinierte Übersicht: 540 Default + 242 Petitionen/Personen-Wahlen via Filter)
- Profil-Seiten verlinken DS-Titel zur Detail-Page

---

## 2. Pipeline-Pattern: wie wir vorgegangen sind

### 2.1 Phasen pro Pipeline

```
1. Pre-Flight (kostenfrei)
   ├─ Smoke-Test mit ~10 Samples
   ├─ Korpus-Statistiken (n-Gramm, Topic-Discovery)
   └─ Schema-Design + Methodology-Doc
2. Stage 1 (kleines Geld, breite Sanity)
   ├─ ~100 DS stratifiziert über Klassen
   ├─ Quality-Gates definiert VORHER (HOCH ≤ 5 %, Cache ≥ 80 %, ...)
   └─ Stichproben-Audit (50 Samples) durch Subagent
3. Stage 2-4 (skalieren, wenn Gates grün)
   ├─ Kumulative Targets (1/e-Threshold-Strategie)
   ├─ Cost-Approval pro Stage explizit holen
   └─ Reprocess-from-Raw als kostenfreie Defense bei Code-Updates
4. UI-Integration
   ├─ DB-Funktion mit JSON-JOIN-Helpers
   ├─ Detail-Page mit klassen-spezifischen Sektionen
   └─ Browser-Test im Staging
```

### 2.2 Quality-Gates pro Stage

Bevor wir eine Stage als „grün" akzeptierten, mussten ALLE durch:
- Success-Rate ≥ 99 %
- Tonality-Drift ≤ 1 %
- Themen-Drift ≤ 15 %
- Array-Hard-Bugs = 0
- Cache-Hit-Rate ≥ 80 % (ab v1.4)
- HOCH-Fehler (Audit-Sample) ≤ 5 %

Wenn auch nur eines rot: **Stopp + gezielter Fix + Reprocess**. Wir haben die Schwellen **vorher schriftlich festgehalten** (Memory: keine Mid-Stage-Kalibrierung).

### 2.3 Iterations-Disziplin

v1.1 → v1.4 in einer Session, aber kontrolliert:
- Jede v-Iteration brauchte $0,60-$1,00 Re-Run von Stage 1 (akzeptabel)
- Nach v1.4 verboten wir uns weitere Stage-1-Iterations → linear durch Stage 2-4
- Postprocessor-Updates (`applyTagDriftFix` etc.) wurden via `reprocess-from-raw` auf Bestandsdaten angewendet — **null neuer API-Cost**

---

## 3. Lehren / wichtige Pattern

### 3.1 LLM-Output-Postprocessor als Defense-Layer

Beobachtetes Pattern bei Haiku 4.5: in ~10 % der antrag/gesetzentwurf/vorlage_senat-Outputs streamt der LLM das nächste Tool-Use-Argument als XML-Tag in den Vorgänger-String. Beispiel:
```
auswirkung: "...echter Inhalt...</auswirkung>\n<parameter name=\"thema\">[\"Bildung\"]"
```

Lösung: zweistufiger Postprocessor `applyTagDriftFix`
- Pass 1: rekonstruiert verlorene Folge-Felder aus dem Suffix via `extractDriftedField`
- Pass 2: schneidet den Suffix ab via `cleanTagDrift` (frühester Closing-Tag)

Drei weitere Drift-Varianten entdeckt + gefixt:
- `</field>` (Standard)
- `</field">` (LLM-Quote vor `>`)
- `</field:` (YAML-Mix nach abgebrochenem Tag)
- `</antwort:` (LLM-Kurzform-Halluzination)

### 3.2 Cache-Hit nur bei System-Prompt ≥ 2048 Tokens (Haiku 4.5)

Empirie: bei 526 Token Prompt 0 % Hit, bei 1.413 Token immer noch 0 % (Threshold liegt offenbar bei 2048, nicht 1024 wie für Sonnet). Bei 2.114+ Token: 99 %.

Strategie: **System-Prompt mit inhaltlich relevanten Blöcken strecken** (Topic-Glossar, Anti-Halluzinations-Heuristiken, Few-Shot-Beispiele), nicht mit Filler. Spart bei Stage 4 ~$30.

### 3.3 Strict-Whitelist gegen LLM-Halluzination

Stage-1-v1.2-Empirie: bei fraktionslosen Abgeordneten ohne Klammer im Header hat der LLM ein **Datum** als Fraktion geschrieben (`"Eingang beim Abgeordnetenhaus am 22. Februar 2024"`).

Lösung: `normalizeFraktion` mit strict whitelist (`CDU|SPD|GRÜNE|LINKE|AfD|FDP|fraktionslos|parteilos` + Multi-Combos via `" + "`/`","`/`und`-Split). Alles andere → `null`.

Cross-Validate-Skript `scripts/cross-validate-berlin-fraktion.ts`: wenn `extractHeaderMeta.abgeordnete` vorhanden aber `fraktion=null` UND DB-fraktion gesetzt ist → DB-Wert war LLM-Spekulation → override auf `null`.

### 3.4 Politicians-DB ist NICHT Ground-Truth für AGH-Fraktion

Versuch 1: `politicians.party_id` als Override für LLM-fraktion → fand „Mismatches" bei Schlüsselburg (politicians sagt SPD-tag, war aber LINKE-AGH-Mitglied), Lederer (parteilos in DB, LINKE-AGH-Fraktion).

Lehre: **der LLM liest den DS-Header zuverlässiger als unsere DB.** politicians.party_label ist Wikipedia-Mitgliedschaft, nicht aktuelle AGH-Fraktions-Zugehörigkeit. Daher kein blindes Override.

Stattdessen: `rescueFraktion` mit Header-Regex als Fallback nur wenn LLM nichts liefert.

### 3.5 Audit-by-Subagent statt selbst durchlesen

Nach Stage 1 + 2: 50- und 100-Sample-Audits an General-Purpose-Subagent delegiert mit:
- Klarer Severity-Skala (HOCH/MITTEL/NIEDRIG)
- Kontext aus Methodologie-Doc
- Bekannten Edge-Cases vorab markiert (z. B. „D-445691 ist Data-Anomaly, nicht als Fehler werten")

Spart 30-60 Min Lesen + ist konsistenter als manuelles Spot-Checking. Stage 1: 2 % HOCH 10 % MITTEL → Stage 2: 0 % HOCH 7 % MITTEL.

### 3.6 Subtype-Filter vs. Subset-Pipeline

Bei den Plenum-Votes haben wir entdeckt, dass 75 % der BT-Handzeichen-Events Petitions-Sammelübersichten oder Personen-Wahlen sind. Statt das im LLM-Schema zu trennen: Post-Processing via Regex-Heuristik auf `raw_snippet` + UI-Filter „Auch zeigen: …".

Vorteil: alle Daten in DB, kein Re-Run nötig, User entscheidet selbst.

---

## 4. Tech-Stack

- **LLM:** Anthropic Haiku 4.5 via Messages.Batches API
- **Format:** Tool-Use mit strict JSON-Schema
- **DB:** SQLite (better-sqlite3), gemeinsamer Symlink zum master-Worktree
- **Code:** TypeScript via tsx, Next.js 16 (Webpack-Build wegen symlinked node_modules)
- **Pipelines:** `scripts/batch-submit-*.ts` + `scripts/batch-retrieve-*.ts` Pattern für alle drei

---

## 5. DB-Tabellen-Übersicht (was neu ist seit Session-Start)

| Tabelle | Rows | Funktion |
|---|---:|---|
| `berlin_drucksachen_analyses` | 19.449 | LLM-Output pro Berlin-DS |
| `berlin_votes` | 561 | Berlin-Plenum-Handzeichen-Events |
| `bundestag_votes` | 307 | Bundestag-Plenum-Handzeichen-Events |
| `politicians` (existing) | – | + Cross-Validate für Berlin-Fraktion |

---

## 6. Status für morgen (2026-05-26)

**Aktuelle Lage:**
- Alle Pipelines durch, alle Quality-Gates grün
- Staging läuft auf Port 3002 (LAN: 192.168.178.170:3002)
- 13 Commits auf `landtag`-Branch, working tree clean

**Geplant:**
1. **UI-Polish im Browser** (heute Abend nur smoke-getestet, nicht visuell durchgegangen)
2. **Merge auf `master`-Branch** ([[project_parallel_worktree_landtag]])
3. **Live-Deploy** via Mini-PC + CF Tunnel ([[demo-launch-hosting]])
4. **Optionale Erweiterungen:**
   - FTS5-Index auf `zusammenfassung`/`kerninhalt_*` für Berlin-Suche
   - Hofmann-Analyse Phase A-E (Skandalisierungs-Frage)
   - Methodology-Copy in `/methodik` aktualisieren mit Berlin-Pipeline

**Risiken:**
- `master`-Worktree hat seit 2026-05-22 evtl. Drift — Merge braucht Konflikt-Check
- Live-Page muss `berlin_votes` / `bundestag_votes` Tabellen mitkriegen (sind in symlinkter DB, sollte automatisch da sein)

---

## 7. Datei-Index für diese Session

**Berlin-Drucksachen-Pipeline:**
- `src/lib/berlin-drucksachen-prompts.ts` (PROMPT_VERSION berlin-v1.4)
- `scripts/init-berlin-drucksachen-analyses-schema.ts`
- `scripts/batch-{submit,retrieve}-berlin-drucksachen.ts`
- `scripts/reprocess-berlin-ds-from-raw.ts`
- `scripts/cross-validate-berlin-fraktion.ts`
- `docs/summarization-methodology-berlin-drucksachen.md`

**Berlin-Votes-Pipeline:**
- `src/lib/berlin-votes-prompts.ts`
- `scripts/init-berlin-votes-schema.ts`
- `scripts/batch-{submit,retrieve}-berlin-votes.ts`

**Bundestag-Votes-Pipeline:**
- `src/lib/bundestag-votes-prompts.ts`
- `scripts/init-bundestag-votes-schema.ts`
- `scripts/batch-{submit,retrieve}-bundestag-votes.ts`

**UI:**
- `src/app/design/linear/parlamente/berlin/drucksache/[dbid]/page.tsx` (Berlin-DS-Detail)
- `src/app/design/linear/aktivitaeten/[ds-nr]/page.tsx` (Bundes-DS, erweitert)
- `src/app/design/linear/abstimmungen/page.tsx` (kombinierte Übersicht)
- `src/lib/db.ts` (neue Funktionen: `getBerlinDrucksacheDetail`, `getBerlinDsVotes`, `getBerlinDsMitzeichner`, `getBundestagDsHandzeichenVotes`, `listAllVotesForIndex`)

---

## Nachtrag 2026-05-26 (Nacht): Berlin-Suche scope-getrennt

User-Anliegen am Ende des Tages: „Suche wird überladen" wenn man Berlin-Daten in die Bundes-Suche reinmischt. Lösung gebaut während er schlief:

**Architektur-Entscheidung:** eigene FTS5-Tabellen pro Parlament + separate Suche-Page statt globalem Scope-Filter.

- `berlin_speeches_fts` (23.206 Reden) + `berlin_drucksachen_fts` (19.449 DS) parallel zu den Bundes-FTS-Tabellen
- Auto-Sync via Triggers, Initial-Build via `scripts/build-berlin-fts.ts`
- Neue Page `/design/linear/parlamente/berlin/suche` mit Tab-Bar + Synonym-Layer + Highlight-Snippets
- Berlin-Übersicht: Link „Drucksachen + Reden durchsuchen" prominent
- Bundes-Suche bleibt unverändert (Track-Isolation)

**Vorteile dieses Patterns für künftige Landtage:**
- Jedes Parlament bekommt eigene FTS5-Tabellen + Such-Page
- Keine Refactoring von bestehender Bundes-Suche nötig
- Performance: kleinere Indices = schnellere Queries
- UX: User wechselt explizit per Switcher, sieht nur scope-relevante Treffer

**Empirie:** Klima → 2.788 DS + 1.441 Reden in Berlin (Synonym-Cluster greift). Mieten/Wohnen liefern identische 2.812 DS — Synonym-Layer funktioniert auf Berlin-Daten wie auf Bundes-Daten.
