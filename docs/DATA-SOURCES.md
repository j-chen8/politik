# DATA-SOURCES.md — Datenquellen-Manifest (Single Source of Truth)

> **Zweck:** Schluss mit Raten. Pro Datenquelle: woher, wie man auf Neues prüft,
> was unser DB-Stand ist, welche Pipeline neue Daten ingestiert+analysiert, Kosten, Kadenz.
>
> **Operativ:** `npx tsx scripts/check-data-freshness.ts` prüft alle maschinell
> prüfbaren Quellen (DB-Watermark vs. Upstream) und gibt einen Gap-Report aus.
> `--fetch` zieht zusätzlich die **gratis/idempotenten** neuen Daten (NICHT die
> LLM-Schritte — die kosten Geld und werden bewusst manuell ausgelöst).
>
> **Verwandt:** `docs/PIPELINE.md` (Stage-Inventar + §14 Update-Prozeduren),
> `NEXT-SESSION.md` (tagesfrischer Pickup), `docs/OPEN-TRACKS.md` (Track-Landkarte).
>
> **Letzte verifizierte Inventur:** 2026-05-19 (alle Endpoints live geprüft).

---

## 0. »update«-Runbook (Trigger: der User schreibt nur „update")

> **Vertrag:** Der User schreibt **„update"** (oder „daten update" / „update data")
> und sonst nichts. Diese Sektion ist die vollständige Anweisung — **keine
> Rückfragen stellen**, außer der eine definierte Kosten-Anomalie-Fall (Schritt 3).
> Stehende Entscheidungen sind hier kodiert; nicht neu verhandeln.

**Ablauf, autonom:**

1. **Lage prüfen (read-only):** `npx tsx scripts/check-data-freshness.ts`
2. **Gratis-Gaps ziehen (autonom, $0, idempotent):**
   `npx tsx scripts/check-data-freshness.ts --fetch`
   Zieht Plenar-XML, Activities (DIP), Drucksachen-PDF→Text→**classify→label**,
   Votes (abgeordnetenwatch). Danach prüfen: `batch_class IS NULL` muss 0 sein.
   *Hintergrund-Läufe (aw-Seed ist langsam/rate-limited) sind ok — Orchestrator
   muss DB-Schreib-Kollisionen retry-fest behandeln (WAL + Retry-Loop).*
3. **LLM-Batches — Pre-Flight + stehende Kostenfreigabe:**
   - Pre-Flights ($0): `npx tsx scripts/batch-submit-reden.ts` (ohne `--confirm`)
     **und** `npx tsx scripts/run-drucksachen-batch.ts --dry-run`. Summe bilden.
   - **Stehende Freigabe:** Summe **≤ 15 €** → **ohne Rückfrage submitten**
     (deckt jeden normalen 1–2-Wochen-Refresh; reale Größenordnung ~$5).
     Kosten im Statusbericht nennen, nicht fragen.
   - **Nur Anomalie** (Summe **> 15 €**, z.B. großer Backlog) → einmal pausieren,
     Zahl + Empfehlung nennen, OK abwarten. Das ist die einzige erlaubte Rückfrage.
   - Vor Submit: Methodik-v2.1-Marker prüfen
     (`grep -cE "neutralitaets_self_check|H10" docs/summarization-methodology.md` > 0),
     `mv .batch-state.json .batch-state.json.alt-$(date +%Y%m%d)`.
4. **Retrieve unbeaufsichtigt:** Drucksachen `--poll <id>` blockiert+ingestiert
   selbst; Reden `batch-retrieve-reden.ts --apply` im Retry-Loop bis offene
   Reden < 60. Beides als ein Hintergrund-Orchestrator (retry-fest).
4b. **Vote-Kontext für neue Polls (DIP-Hybrid, ~$0,01/Poll):**
   Ohne diesen Schritt zeigen Abstimmungs-Detail-Seiten neuer Polls keinen
   „Worum geht es?"-Block. Reihenfolge:
   - Identifizieren: `sqlite3 politik.db "SELECT v.poll_id FROM (SELECT DISTINCT poll_id FROM votes) v LEFT JOIN vote_context vc ON vc.poll_id=v.poll_id WHERE vc.poll_id IS NULL ORDER BY v.poll_id"`
   - DIP-Mapping holen: `npx tsx scripts/map-vote-drucksache-dip.ts --new --write`
   - `src/lib/poll-bt-mapping.ts` ergänzen — pro neuem Poll eine Zeile in
     `POLL_TO_BT_ID` (vom Skript-Output ablesen, manuell ins TypeScript einfügen)
   - Kontext generieren: `npx tsx scripts/generate-vote-context.ts --poll <id> --write`
     pro neuem Poll
   - Neutralitäts-Spotcheck (siehe Schritt 5) gilt auch für `vote_context.block_hinweis`
   - Verifizierte Block-Modell-Polls (`bt_id ≤ 1020`, siehe §2.13) bleiben
     unangetastet — DIP-Pipeline nur für neue Polls (`bt_id == poll_id ≥ 6000`)
5. **Neutralitäts-Disziplin (NICHT verhandelbar):** NIE Prompt/Methodik/Modell
   ändern — nur die identische validierte Pipeline auf neuen Daten. Nach dem
   Apply **Neutralitäts-Spotcheck**: Sample neuer `speech_analyses_v2` +
   `drucksache_analyses` + `vote_context` auf bewertende Adjektive /
   Halluzination / Tonalitäts-Drift. Refresh gilt **erst nach bestandenem
   Spotcheck** als fertig.
6. **Ehrlich berichten — Pflicht-Caveats immer nennen:**
   - abgeordnetenwatch lagt ~11 Tage → „alle Votings" ist nie 100 % frisch.
     **Datenlage-Decke, kein Aufwandsmangel.** Nicht als unsere Lücke framen.
   - DIP-`--audit` (read-only, mit aw-Backoff) lief voll: 14 EXAKT · 18
     DIP⊆Block · 1 Edge (6324) · 10 LIMITATION ehrlich geflaggt · 8 transiente
     Fehler — **0 stille Fehlmappings**.
7. **Abschluss:** §1-Snapshot-Tabelle aktualisieren, kurze Notiz in
   `NEXT-SESSION-data-refresh.md` (dedizierte Track-Datei — **nicht**
   `NEXT-SESSION.md`, die hat fremde Track-Drift; Track-Isolation), ehrlicher
   Statusbericht (was geholt, Kosten, Caveats, Spotcheck-Ergebnis).

**Vom „update" ausgeschlossen (manuell/separat — nur melden, nicht auto-tun):**
Stammdaten-XML (manueller Download), Bundeskabinett (hardcoded), Ausschuss-
Reimport (destruktiver Full-Replace, an fremde Working-Tree-Drift gekoppelt →
nur Drift melden), CV/Wikipedia/Fotos (roster-getrieben, nur bei neuen MdBs).

**Definition of Done:** Gratis-Gaps geschlossen · LLM-Batches applied ·
**Vote-Kontext für alle neuen Polls geschrieben** (Schritt 4b) · Neutralitäts-
Spotcheck bestanden · §1 + NEXT-SESSION aktualisiert · ehrlicher Bericht inkl.
Caveats.

---

## 1. Gap-Status (Snapshot **nach Refresh 2026-05-19** — via Check-Skript regenerierbar)

| Quelle | Status | Stand nach Refresh | Notiz |
|---|---|---|---|
| Plenar-XML / Reden-Rohtext | 🟢 aktuell | Sitzung 78 (2026-05-08) | 76/77/78 ingestiert |
| Reden-LLM (`speech_analyses_v2`) | 🟢 erledigt | 9.272 → **9.689** Reden | 509 analysiert ($2,22), Neutralitäts-Spotcheck bestanden |
| Activities (DIP) | 🟢 aktuell | 62.840 → **66.185** | bis 2026-05-19 |
| Drucksachen-PDF | 🟢 aktuell | max → **21/6001** | +167 Texte, alle klassifiziert |
| Drucksachen-LLM | 🟢 erledigt | 5.185 → **5.358** | 202 analysiert ($3,22), Spotcheck bestanden |
| Votes/Polls (abgeordnetenwatch) | 🟢 erledigt | 50 → **51 Polls** (6511, 630 Votes, datiert 2026-05-08) | aw-Seed durch (631/631); Datum via backfill-vote-dates nachgezogen. **Upstream-Lag ~11 T — Datenlage-Decke (kein neuerer Poll existiert)** |
| Sidejobs / Committee-Memberships | 🟢 erledigt | Sidejobs 3.901→**3.969**, Committees ~1.73k | mit aw-Run aktualisiert |
| Ausschuss-Protokolle | 🟡 Drift | 254 JSON vs 226 DB | nicht Teil von „update" (destruktiver Reimport) |
| Politiker-Stammdaten (abg.watch) | 🟢 idempotent | — | — |
| Politiker-Stammdaten (BT-XML) | ⚙️ manuell | XML vom 2026-04-30 | manueller Download |
| Vote↔DS-Cross-Check | 🟢 DIP-Hybrid | vote_context **51/51**, 0 Fallback | `map-vote-drucksache-dip.ts` (DIP-Vorgang); 50 verifizierte unangetastet; Voll-Audit 51/51: 32 konsistent · 1 Edge · 10 ehrlich geflaggt · 0 stille Fehler |
| Bundeskabinett | ⚙️ hardcoded | — | manuell bei Wechsel |
| CV / Wikipedia / Homepage / Fotos / Bios | 🟢 roster-getrieben | kein „latest" | nur bei neuen MdBs |

---

## 2. Detail pro Quelle

Legende Pipeline-Kosten: `$0` = gratis/idempotent · `$$` = LLM-Batch (Checkpoint-pflichtig)

### 2.1 Plenarprotokolle / Reden (Rohtext)
- **Domain:** bundestag.de Open Data (kein Key)
- **Upstream:** `https://www.bundestag.de/ajax/filterlist/de/services/opendata/1058442-1058442?limit=N&offset=O&noFilterSet=true` → HTML, Regex `21\d{3}\.xml`, max nehmen
- **DB-Watermark:** `SELECT MAX(sitzung), MAX(datum) FROM plenar_sessions;`
- **Pipeline ($0):** `fetch-plenar-xmls.ts` → `ingest-plenarprotokoll-xmls.ts` → `extract-all-speeches.ts` → `seed-non-mdb-speakers.ts` → `backfill-speaker-politician-links.ts`
- **Kadenz:** wöchentlich nach Sitzungswoche (XMLs ~Tage nach Sitzung)
- **Caveat:** Filterlist-ID `1058442-1058442` ändert sich bei neuer Wahlperiode → im Browser-Network-Tab auf bundestag.de/services/opendata neu ermitteln

### 2.2 Reden-LLM-Analyse (`speech_analyses_v2`)
- **Modell:** `claude-haiku-4-5`, Anthropic Batch API (`ANTHROPIC_API_KEY`)
- **DB-Watermark (offene Reden):**
  ```sql
  SELECT COUNT(*) FROM plenar_speeches ps
  WHERE ps.original_text IS NOT NULL AND LENGTH(ps.original_text) >= 200
    AND NOT EXISTS (SELECT 1 FROM speech_analyses_v2 v2
      WHERE v2.rede_id = ps.rede_id AND v2.segment_index = ps.segment_index);
  ```
  (Mapping = `rede_id` + `segment_index`, **nicht** `speech_id`)
- **Pre-Flight ($0, read-only):** `npx tsx scripts/batch-submit-reden.ts` (ohne `--confirm`)
- **Pipeline ($$):** State sichern (`mv .batch-state.json .batch-state.json.alt-$(date +%Y%m%d)`) → `batch-submit-reden.ts --confirm` → warten → `batch-retrieve-reden.ts --apply`
- **Caveat:** liest `docs/summarization-methodology.md` — muss **v2.1** sein (H10 + `neutralitaets_self_check`); bekannte Tonalitäts-Drift ~0,3 %

### 2.3 Activities (DIP-API)
- **Domain:** `search.dip.bundestag.de` (`DIP_API_KEY` aus `.env`)
- **Upstream:** `https://search.dip.bundestag.de/search-api/v1/default/search?apikey=<KEY>&f.typ=Aktivität&f.wahlperiode=21&rows=N&start=S&sort=basisdatum_ab`
  - **PFLICHT-Header:** `Origin: https://dip.bundestag.de` **und** `Referer: https://dip.bundestag.de/` — sonst HTTP 401 trotz gültigem Key
  - Neueste-Check: `&f.datum.start=YYYY-MM-DD` → Feld `numFound`
- **DB-Watermark:** `SELECT MAX(datum), COUNT(*) FROM activities;`
- **Pipeline ($0):** `npx tsx scripts/seed-activities.ts` — idempotent (`INSERT OR IGNORE` per activity-id), splittet nach Monat (umgeht 10k-offset-Limit der API)
- **Kadenz:** DIP ist täglich aktuell → wöchentlich reicht; speist Drucksachen-Referenzen
- **Caveat:** `numFound` ist obere Schranke (`datum` ≠ `basisdatum`); echtes Netto-Delta erst nach Lauf

### 2.4 Drucksachen-PDF (Volltext-Quelle)
- **Domain:** `https://dserver.bundestag.de/btd/21/<3-stellig>/21<5-stellig>.pdf`
- **Upstream-Check:** HTTP `HEAD` auf fortlaufende Nummern; 200 = existiert, 404 = noch nicht; >10 MB werden geskippt
- **DB-Watermark:** `SELECT COUNT(*), MAX(drucksache_nr) FROM drucksache_texts;`
- **Pipeline ($0):** `bash scripts/download-missing-drucksachen.sh` (DB-getrieben, korrekter Pfad) → `npx tsx scripts/extract-drucksache-texts.ts` (PDF→`drucksache_texts`) → **`npx tsx scripts/classify-drucksachen.ts`** (setzt `batch_class`, Regex/Activity-Vorrang) → **`npx tsx scripts/label-administrativ-drucksachen.ts`** (Regex-Labels für `administrativ`-Klasse) — alle idempotent
- **⚠️ Pflicht-Schritt:** Ohne `classify-drucksachen.ts` bleiben neue Texte `batch_class=NULL` und gelangen **nie** in den LLM-Batch (`run-drucksachen-batch.ts` filtert `batch_class IN (...)`). Dieser Schritt wurde initial in Doku+Check übersehen — Lehre: Text-Extraktion ≠ analysebereit.
- **⚠️ NICHT** `scripts/download-drucksachen.sh` nutzen — hartkodierter toter Pfad `/home/jk/...` + veralteter Cookie

### 2.5 Drucksachen-LLM-Analyse
- **Modell:** `claude-haiku-4-5-20251001`, Anthropic Batch (ephemeral Caching)
- **Quelle:** `drucksache_texts.full_text` (nicht direkt Web)
- **Voraussetzung:** `classify-drucksachen.ts` muss gelaufen sein (§2.4) — nur `batch_class IN ('klein','mittel','gross','antwort','regierung')` ist LLM-eligible. Der echte Watermark ist die `selectTodos()`-Query von `run-drucksachen-batch.ts` (gültige Analyse = `raw_llm_response IS NOT NULL AND analyze_error IS NULL`, versionsunabhängig) — **nicht** naives `raw_llm_response IS NULL` (zählt Regex-Labels mit → falsch zu hoch)
- **Pre-Flight ($0):** `npx tsx scripts/run-drucksachen-batch.ts --dry-run`
- **Pipeline ($$):** `run-drucksachen-batch.ts --submit` → `--poll <id>`. Idempotent (gültige Analyse v1/v1.1 zählt als erledigt; `--force` für Re-Run)

### 2.6 Votes / namentliche Abstimmungen + 2.7 Sidejobs + 2.8 Committee-Memberships
- **Domain:** `abgeordnetenwatch.de/api/v2`
- **Skript:** `scripts/seed-abgeordnetenwatch.ts` — fetcht **pro Mandat** (`/votes?mandate=<id>`, `/sidejobs?mandates=<id>`, `/committee-memberships?candidacy_mandate=<id>`), zieht alle drei in einem Lauf
- **Upstream-Neueste-Check:** `https://www.abgeordnetenwatch.de/api/v2/polls?field_legislature=161&sort_by=field_poll_date&sort_direction=desc`
- **DB-Watermark:** `SELECT MAX(poll_date), COUNT(DISTINCT poll_id) FROM votes;` (Sidejobs/Committees: **kein** Datums-Watermark — nur Vollauf aktualisiert)
- **Pipeline ($0):** `npx tsx scripts/seed-abgeordnetenwatch.ts` (`INSERT OR IGNORE`) → **`npx tsx scripts/backfill-vote-dates.ts`** (Pflicht-Folgeschritt)
- **⚠️ Pflicht-Schritt:** `/votes` (pro Mandat) liefert das Poll **ohne** `field_poll_date` → seed schreibt `poll_date=NULL`. `backfill-vote-dates.ts` holt das Datum pro `poll_id` via `/polls/<id>` nach. Ohne diesen Schritt sind neue Polls undatiert (falsch sortiert/unsichtbar in datums-basierter UISicht). Wie der Drucksachen-classify-Schritt initial übersehen — Lehre: Seed ≠ vollständig.
- **⚠️ Upstream-Lag ~11 Tage:** abgeordnetenwatch publiziert namentliche Abstimmungen verzögert. Belegt 2026-05-19: neuester Poll = 6511 / 2026-05-08; nichts danach trotz Plenar bis 08.05. → Votes für spätere Sitzungen sind upstream noch nicht da. **Keine halbe Lösung möglich — Datenlage-Grenze, nicht Aufwand.**

### 2.9 Ausschuss-Protokolle
- **Domain:** bundestag.de Ausschuss-Filterlists
- **Pipeline:** `scrape-ausschuesse.sh` (⚠️ toter `/home/jk/`-Pfad) → `parse-ausschuss.ts --batch` (PDF→JSON in `data/ausschuss_protokolle/`) → `reimport-ausschuss.ts` (JSON→DB, **destruktiver Full-Replace**, $0)
- **DB-Watermark:** `SELECT COUNT(*), MAX(datum) FROM ausschuss_sessions;`
- **Caveat:** 253 JSON-Files vs. 226 DB-Sessions Drift; viele JSONs im git-Working-Tree modifiziert (anderer Track). `reimport-ausschuss.ts` gleicht an, ist aber nicht inkrementell

### 2.10 Politiker-Stammdaten + Mandate
- **abg.watch (id<900000):** `scripts/seed.ts` — `abgeordnetenwatch.de/api/v2`, parliamentId 5 / periodId 161. Idempotent ($0)
- **BT-Stammdaten-XML (id≥900000):** `scripts/seed-politicians-bt.ts` — Quelle `data/stammdaten/MDB_STAMMDATEN.XML`, **manueller Download** von `bundestag.de/MdB-Stammdaten.zip`
- **Caveat:** XML wird **nicht** automatisch gefetcht; bei Nachrückern manuell neu ziehen

### 2.11 CV / Wikipedia / Homepage / Fotos / Bios (roster-getrieben)
Kein Upstream-„latest" — Skripte laufen nur für **neue/leere** Politiker-Rows (default skip befüllt; `--refresh`/`--all` erzwingt Voll-Refresh). Frische = Funktion des Politiker-Rosters (→ §2.10 zuerst).

| Sub | Skript | Endpoint |
|---|---|---|
| Wikipedia-Bio | `seed-bios.ts` | `de.wikipedia.org/api/rest_v1` + `wikidata.org/w/api.php` |
| Wikipedia-Volltext | `fetch-wikipedia-fulltext.ts` | `de.wikipedia.org/w/api.php` (extracts) |
| Homepages | `seed-homepages.ts` | `query.wikidata.org/sparql` |
| Fotos | `seed-photos-wikidata.ts` | `query.wikidata.org/sparql` (P18) |
| BT-Bios | `fetch-bundestag-bios.ts` | `bundestag.de/ajax/filterlist/.../1040594-1040594` |
| CV-LLM | `seed-cv.ts` (Haiku $2-3), `seed-cv-homepage.ts`, `generate-cv-summary.ts` | — (default idempotent) |

### 2.12 Bundeskabinett
- **Skript:** `scripts/seed-bundeskabinett.ts` — **hardcoded `KABINETT[]`** (Merz-Kabinett 2025/2026), kein Upstream, kein Frische-Check. Bei Kabinettswechsel manuell editieren.

### 2.13 Vote↔Drucksache Cross-Check (DIP-Hybrid seit 2026-05-19)
- **Aktiv:** `scripts/map-vote-drucksache-dip.ts` (`--poll <id>` | `--new` | `--audit` | `--write`)
- **Quelle:** abgeordnetenwatch `/polls/<id>.field_intro` (dserver-Link → Subjekt-DS) + DIP-API `/drucksache` → `vorgangsbezug` → `/vorgangsposition?f.vorgang=<id>` (offiziell, `search.dip.bundestag.de`, Header `Origin/Referer` Pflicht)
- **Hybrid-Methodik (User-Entscheidung):** Manuell gegen bundestag.de verifizierte Polls (`POLL_TO_BT_ID`, bt_id ≤ 1020, **Block-Modell**) bleiben unangetastet. Neue Polls (bt_id == poll_id ≥ 6000) → **DIP-prozedural** (Vorgang = Antrag + Beschlussempfehlung). `--audit` = read-only DIP-vs-bestehend (Transparenz).
- **DB-Watermark:** `SELECT poll_id FROM (SELECT DISTINCT poll_id FROM votes) v LEFT JOIN vote_context vc ON vc.poll_id=v.poll_id WHERE vc.poll_id IS NULL` (leer = alle Polls haben Kontext)
- **Pipeline ($~0,01/Poll LLM):** `map-vote-drucksache-dip.ts --new --write` → `poll-bt-mapping.ts` ergänzen (Ausgabe-Zeile) → `generate-vote-context.ts --poll <id> --write` (validierter Prompt `vote-context-v1`, dann Neutralitäts-Spotcheck)
- **Alt-Skript tot:** `audit-vote-drucksache-mapping.ts` (bundestag.de-HTML-SPA → Regex zog nur leere Rows). Durch obiges ersetzt; nicht mehr nutzen.
- **bundestag.de-Filterlist-Rebuild (2026-05-19) geprüft & VERWORFEN:** Open-Data-Filterlist `484422-484422` (Titel+DS+Ergebnis-Teaser pro Roll-Call); `scripts/map-vote-drucksache-bundestag.ts` baut read-only Diff. Befund: 31/51 Stimm-Vektor-Abweichung — **Ursache aufgeklärt, KEIN echter Quell-Konflikt:** Der **Filterlist-Teaser** (Sekundär-Widget) zeigte für den LEADER-Eintrag 449/136/0/45; das **autoritative Primär-Original (Stenografischer Bericht, Plenarprotokoll 21/78, TOP 7d)** verkündet aber **417 Ja / 73 Nein / 53 Enth (543 abgegeben)** = abgeordnetenwatch = unsere DB **exakt**. Am selben Tag mehrere LEADER-Beschlussempfehlungen (TOP 7d+7e) → Teaser-Fehlpaarung, zusätzlich verschärft durch den fehleranfälligen Filterlist-Parser. Datum+DS-Join damit unzuverlässig (Teaser-Rauschen, nicht Quell-Divergenz). **Rebuild nicht durchgeführt, 0 Writes.** `map-vote-drucksache-bundestag.ts` bleibt read-only Diagnose, **nie `--apply`**. Stand bleibt DIP-Hybrid + verifizierte 50.
- **Stimm-Zahlen-Validierung:** Stichprobe gegen das offizielle Plenarprotokoll bestätigt unsere aw-gespiegelten Zahlen (LEADER 21/78 TOP 7d: 417/73/53 deckungsgleich). Frühere Annahme „aw weicht von bundestag.de ab" war ein Teaser-/Join-Artefakt, **widerlegt**. Maßgeblich ist stets das im Plenarprotokoll verkündete Ergebnis der konkreten Abstimmung.

---

## 3. Periodischer Workflow

```bash
# 1. Was ist neu? (read-only, alle prüfbaren Quellen)
npx tsx scripts/check-data-freshness.ts

# 2. Gratis/idempotente neue Daten ziehen (KEINE LLM-Schritte)
npx tsx scripts/check-data-freshness.ts --fetch

# 3. LLM-Schritte bewusst + einzeln (Kosten!) — siehe Report-Ausgabe:
#    Reden:       siehe §2.2   (~$ je nach Delta, Pre-Flight zeigt exakt)
#    Drucksachen: siehe §2.5   (~$ je nach Delta, --dry-run zeigt exakt)
```

**Empfohlene Kadenz:** 1× pro Woche nach einer Sitzungswoche. Plenar-XML + DIP
sind binnen Tagen aktuell; abgeordnetenwatch lagt ~1–2 Wochen (Votes kommen
verspätet, das ist normal und keine Lücke unsererseits).

## 4. Bekannte kaputte / manuelle Quellen (Backlog)

1. **~~`audit-vote-drucksache-mapping.ts` Parser~~** — ✅ **gelöst 2026-05-19** durch DIP-Hybrid (`map-vote-drucksache-dip.ts`, §2.13). Alt-Skript tot, nicht mehr nutzen. Voll-Audit 51/51 (mit aw-Backoff) abgeschlossen: 14 EXAKT · 18 DIP⊆Block · 1 Edge (6324: prozedural-vs-Block, 5/6 Match, verifizierte Daten unangetastet) · 10 LIMITATION ehrlich geflaggt (4 Haushalt: DIP-Granularität ≠ Einzelplan; 6 unsichere Vorgang-Wahl) · 8 transiente fetch-Fehler. **0 stille Fehlmappings.** Heuristik gehärtet (Haushalt-Guard, Multi-DS-Vorgang-Pick, Backoff). Rest-Trivial-Follow-up: die 8 fetch-Fehler-Polls re-auditieren (read-only, niedrigster Wert, verifizierte 50 ohnehin unangetastet).
2. **`download-drucksachen.sh` + `scrape-ausschuesse.sh`** — hartkodierte tote `/home/jk/`-Pfade. Funktionierende Alternativen: `download-missing-drucksachen.sh` (DS) / `parse-ausschuss.ts` (Ausschuss). Skripte fixen oder löschen.
3. **MDB_STAMMDATEN.XML** — manueller Download, kein Auto-Fetch. Bei Nachrückern leicht zu vergessen.
4. **Bundeskabinett** — hardcoded Liste, kein Frische-Check. Bei Kabinettswechsel still veraltend.
5. **Doku-Drift** — PIPELINE.md S.10 nennt `politicians.photo_path` + `public/photos/`, real existiert nur Spalte `photo_url`.
