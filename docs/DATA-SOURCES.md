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
> **Letzte methodische Änderung:** 2026-05-20 — Vote↔Drucksache jetzt via
> bundestag.de-Open-Data-Filterlist (`map-vote-drucksache-bundestag.ts --apply`)
> als Single Source of Truth, siehe §2.13.

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
4b. **Vote-Kontext für neue Polls (Filterlist + Generate, ~$0,01/Poll LLM):**
   Ohne diesen Schritt zeigen Abstimmungs-Detail-Seiten neuer Polls keinen
   „Worum geht es?"-Block. **Reihenfolge ist verbindlich** (Chicken-and-Egg
   beim `drucksache_analyses`-Filter im Map-Script, siehe Caveat unten):
   - **MUSS nach Schritt 4 laufen** (Drucksachen-Batch muss retrieved+applied
     sein, sonst werden neue DS in der Filterlist ausgesiebt — `map-vote-
     drucksache-bundestag.ts` filtert per `EXISTS (drucksache_analyses ...)`).
   - Identifizieren: `sqlite3 politik.db "SELECT v.poll_id FROM (SELECT DISTINCT poll_id FROM votes) v LEFT JOIN vote_context vc ON vc.poll_id=v.poll_id WHERE vc.poll_id IS NULL ORDER BY v.poll_id"`
   - Neue Poll-IDs nach 2026-05-25-Konvention zu `src/lib/poll-bt-mapping.ts`
     hinzufügen (bt_id == poll_id für ≥ 6000). Ohne diesen Eintrag findet
     `generate-vote-context.ts --poll <id>` den Poll nicht (`POLL_TO_BT_ID`-
     Filter), siehe §2.13.
   - Drucksachen-Mapping aus Filterlist holen:
     `npx tsx scripts/map-vote-drucksache-bundestag.ts --apply`
     (idempotent — neue Polls werden ergänzt, bestehende mit DIFF aktualisiert,
     siehe §2.13 für Matcher-Logik und Backup-Tabelle)
   - Kontext generieren: `npx tsx scripts/generate-vote-context.ts --poll <id> --write`
     pro neuem Poll
   - Neutralitäts-Spotcheck (siehe Schritt 5) gilt auch für `vote_context.block_hinweis`
4b2. **aw-Poll-Topics nachholen** (gratis, idempotent):
   `npx tsx scripts/fetch-poll-aw-topics.ts` — pro neuem Poll-ID die
   `field_topics` + `field_committees` aus der aw-API in `poll_aw_topics`-Tabelle
   schreiben. Script filtert auf Polls die noch nicht in `poll_aw_topics` stehen.
   Rate-Limit-Handling (429-Backoff) ist eingebaut. UI-Konsumenten:
   `listAllVotesForIndex()` (Topic-Chips neben Vote-Titel).
4b3. **DIP-Titel für fehlende Drucksachen** (gratis, idempotent):
   `npx tsx scripts/fetch-missing-ds-titles.ts` — Drucksachen die in
   `bundestag_votes` referenziert sind, aber weder in `drucksache_analyses`
   noch in `dip_ds_titles` stehen (typischerweise Petitions-Sammelübersichten,
   Wahlvorschläge, Verfahrens-Anträge). Holt für jede den Titel + Dokumenttyp
   aus der DIP-API. Beim ersten Run wegen Rate-Limit oft nur Teil-Coverage —
   Script ist idempotent, bei Re-Run werden nur fehlende geholt. UI-Konsument:
   Stub-Seite `/aktivitaeten/[ds-nr]`. Coverage-Watermark:
   `SELECT COUNT(*) FROM bundestag_votes WHERE error_type IS NULL AND outcome != 'kein_vote'
    AND NOT EXISTS (SELECT 1 FROM drucksache_analyses WHERE drucksache_nr = json_extract(drucksache_nrn_json,'$[0]'))
    AND NOT EXISTS (SELECT 1 FROM dip_ds_titles WHERE drucksache_nr = json_extract(drucksache_nrn_json,'$[0]'))`.
   Bei einstelligem Rest-Count: das sind LLM-Extraktions-Fehler (DS-Ref leer
   oder halluziniert) — separater Track.
4c. **Bundestag-Handzeichen-Votes-Backfill** (Pre-Flight + Submit + Retrieve, ~$0,01–0,10/Refresh):
   Plenum-Abstimmungen die NICHT namentlich (sondern per Handzeichen) durchgeführt
   wurden — Fraktions-Ebene, keine per-MdB-Daten. Pipeline lebt im **landtag-Worktree**.
   **Vorbedingung:** XMLs aus Schritt 2 müssen ins landtag-Worktree gespiegelt sein
   (`cp /home/jinsheng/politik/data/plenarprotokolle_xml/21*.xml /home/jinsheng/politik-landtag/data/plenarprotokolle_xml/`).
   - Pre-Flight: `cd /home/jinsheng/politik-landtag && npx tsx scripts/batch-submit-bundestag-votes.ts`
   - Submit (≤ 15 € Freigabe gilt): `... --confirm` → `batch_id` notieren
   - Retrieve: `npx tsx scripts/batch-retrieve-bundestag-votes.ts` (wartet auf Abschluss + apply)
   - Idempotenz: per `(xml_source, snippet_offset)` — neuer Run überspringt bereits Analysiertes
5. **Neutralitäts-Disziplin (NICHT verhandelbar):** NIE Prompt/Methodik/Modell
   ändern — nur die identische validierte Pipeline auf neuen Daten. Nach dem
   Apply **Neutralitäts-Spotcheck**: Sample neuer `speech_analyses_v2` +
   `drucksache_analyses` + `vote_context` auf bewertende Adjektive /
   Halluzination / Tonalitäts-Drift. Refresh gilt **erst nach bestandenem
   Spotcheck** als fertig.
6. **Ehrlich berichten — Pflicht-Caveats immer nennen:**
   - abgeordnetenwatch lagt ~11 Tage → „alle Votings" ist nie 100 % frisch.
     **Datenlage-Decke, kein Aufwandsmangel.** Nicht als unsere Lücke framen.
   - Filterlist-Apply (2026-05-20, 51 Polls): 13 EXAKT · 38 DIFF · 0 UNMATCHED.
     18 Stichproben: 16/18 sauber, 2 Grenzfälle ehrlich geflaggt (6170 Corona-U-
     Ausschuss BE-thematisch verschoben; 6451 Iran-Energiepreis hat angeklebte
     BE). Subjekt-DS pro Roll-Call jetzt aus autoritativer Open-Data-Filterlist.
7. **Abschluss:** §1-Snapshot-Tabelle aktualisieren, kurze Notiz in
   `NEXT-SESSION-data-refresh.md` (dedizierte Track-Datei — **nicht**
   `NEXT-SESSION.md`, die hat fremde Track-Drift; Track-Isolation),
   **Refresh-Datum schreiben** (`date +%Y-%m-%d > data/last-refresh.txt` —
   wird vom Landing-Strip „Letzter Datenstand" gelesen, damit Besucher die
   Frische sehen), ehrlicher Statusbericht (was geholt, Kosten, Caveats,
   Spotcheck-Ergebnis).

**Vom „update" ausgeschlossen (manuell/separat — nur melden, nicht auto-tun):**
Stammdaten-XML (manueller Download), Bundeskabinett (hardcoded), Ausschuss-
Reimport (destruktiver Full-Replace, an fremde Working-Tree-Drift gekoppelt →
nur Drift melden), CV/Wikipedia/Fotos (roster-getrieben, nur bei neuen MdBs).

**Definition of Done:** Gratis-Gaps geschlossen · LLM-Batches applied ·
**Vote-Kontext für alle neuen Polls geschrieben** (Schritt 4b) · Neutralitäts-
Spotcheck bestanden · §1 + NEXT-SESSION aktualisiert · ehrlicher Bericht inkl.
Caveats.

---

## 1. Gap-Status (Snapshot **nach Refresh 2026-05-25** — via Check-Skript regenerierbar)

| Quelle | Status | Stand nach Refresh | Notiz |
|---|---|---|---|
| Plenar-XML / Reden-Rohtext | 🟢 aktuell | Sitzung 80 (2026-05-21) | 79+80 neu ingestiert (+328 Reden) |
| Reden-LLM (`speech_analyses_v2`) | 🟢 erledigt | **11.953** Reden | +343 am 25.05. (Sitzung 79+80 + 15 Drift), Cost $1,54 Batch, Quote-Validation 86,0 % |
| Activities (DIP) | 🟢 aktuell | 66.759 → **67.863** | +1.104 am 25.05., bis 2026-05-22 |
| Drucksachen-PDF | 🟢 aktuell | 21/6034 → **21/6127** (53 neu) | +53 PDFs, alle klassifiziert |
| Drucksachen-LLM | 🟢 erledigt | 5.387 → **5.440** | 53 am 25.05. ($3,06), Spotcheck bestanden (zugeschriebene Sprache, sachlich), 5/53 Topic-Drift (1 davon Tippfehler) |
| Votes/Polls (abgeordnetenwatch) | 🟢 erledigt | 51 → **52 Polls** (6528, +636 Votes, datiert 2026-05-22) | aw-Seed durch (631/631); Datum via backfill-vote-dates nachgezogen. **Upstream-Lag ~3 T — neuester Poll 6528 vom 22.05.; spätere Sitzungs-Abstimmungen evtl. noch nicht da** |
| Sidejobs / Committee-Memberships | 🟢 erledigt | Sidejobs 3.969→**4.008**, Committees ~2.154 | mit aw-Run aktualisiert |
| Ausschuss-Protokolle | 🟡 Drift | 254 JSON vs 226 DB | nicht Teil von „update" (destruktiver Reimport) |
| Politiker-Stammdaten (abg.watch) | 🟢 idempotent | — | — |
| Politiker-Stammdaten (BT-XML) | ⚙️ manuell | XML vom 2026-04-30 | manueller Download (25 Tage alt) |
| Vote↔DS-Cross-Check | 🟢 erledigt | drucksache_polls 52/52 frisch; vote_context **52/52** befüllt, 0 stale | `map-vote-drucksache-bundestag.ts --apply`; Bilanz 25.05.: 49 EXAKT · 3 DIFF · 0 UNMATCHED. 3 DIFF (6528 neu + 6251/6351 mit geänderter DS-Liste) für vote_context re-generated |
| Bundestag-Handzeichen-Votes (`bundestag_votes`) | 🟢 erledigt | 307 → **393** Votes; XMLs 1–80 vollständig analysiert | Backfill 27.05. (msgbatch_01RczW9, 86 neue Events aus Sitzungen 65–80, Batch-Cost $0,34 real / $0,06 estimate). Pipeline lebt im **landtag-Worktree**, XML-Sync zu master ist Pre-Voraussetzung |
| aw-Poll-Topics (`poll_aw_topics`) | 🟢 erledigt | 52/52 Polls mit `field_topics` + `field_committees` | Gratis (aw-API), 27.05. initial geseedet. Re-Run nur für neue Polls (idempotent per `INSERT NOT IN`-Filter im Script) |
| DIP-Titel für DS-Stubs (`dip_ds_titles`) | 🟢 erledigt | 74 DS mit DIP-Titel | Gratis (DIP-API), 27.05. zweimal gelaufen (Rate-Limit-Recovery). Coverage 99,3% — 3 LLM-Extraktions-Edge-Cases verbleiben |
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
- **⚠️ Pflicht-Schritt danach (v2→speech_summaries-Kopie, $0):** Die UI liest `speech_summaries` — neue Reden bleiben dort LEER, bis die `zusammenfassung` aus `speech_analyses_v2` kopiert ist (segment-geordnet je `rede_id` joinen, `model='backfill-from-v2-<datum>'`). Am 2026-06-11 entdeckt: Sitzungen 76–80 waren analysiert, aber 737 Summaries leer → Reden fehlten still auf Themen-Blatt/Profilen. Einzeiler siehe Commit-Historie (tsx-Inline) — bei Bedarf als Skript ausgliedern.
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
- **Pipeline ($0):** `bash scripts/download-missing-drucksachen.sh` (DB-getrieben, korrekter Pfad) → `npx tsx scripts/extract-drucksache-texts.ts` (PDF→`drucksache_texts`) → **`npx tsx scripts/classify-drucksachen.ts`** (setzt `batch_class`, Regex/Activity-Vorrang) → **`npx tsx scripts/label-administrativ-drucksachen.ts`** (Regex-Labels für `administrativ`-Klasse) → **`npx tsx scripts/extract-drucksache-publication-date.ts`** (Datum aus PDF-Header → `publication_date`) — alle idempotent
- **⚠️ Pflicht-Schritt:** Ohne `classify-drucksachen.ts` bleiben neue Texte `batch_class=NULL` und gelangen **nie** in den LLM-Batch (`run-drucksachen-batch.ts` filtert `batch_class IN (...)`). Dieser Schritt wurde initial in Doku+Check übersehen — Lehre: Text-Extraktion ≠ analysebereit.
- **⚠️ Pflicht-Schritt:** Ohne `extract-drucksache-publication-date.ts` bleiben neue Texte `publication_date=NULL` → falsch/gar nicht datiert in der UI (Drucksachenseiten, /fragen-Sortierung, Q&A-Datum). Am 29.05. übersehen: 59 PDFs geladen+analysiert, aber undatiert; am 30.05. nachgezogen (783→468, Long-Tail ohne Header-Match bleibt). Gleiches Muster wie classify/vote-dates — Lehre: Seed ≠ vollständig.
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

### 2.13 Vote↔Drucksache Cross-Check (Filterlist-Apply seit 2026-05-20)
- **Aktiv:** `scripts/map-vote-drucksache-bundestag.ts` (`--diff` | `--apply`)
- **Quelle (autoritativ):** bundestag.de Open-Data-Filterlist `484422-484422` —
  pro Roll-Call die explizite Subjekt-Drucksachen-Liste (typisch 2 DS: Antrag +
  Beschlussempfehlung). Ablöst sowohl das alte Block-Modell (DS-Liste vom
  ganzen Plenartag) als auch DIP-Hybrid (Vorgangsbezug aus DIP-API).
- **Matcher-Logik (substantial gefixt 2026-05-20):**
  1. Themengebiet-Prefix stripping (`"Finanzen Ablehnung…"` → `"Ablehnung…"`)
  2. Umlaut-Normalisierung im Title-Token-Vergleich
  3. **1:1-Optimal-Assignment per Permutation pro Tag** — verhindert
     kreuzweise Vertauschungen (6451↔6455, 6496↔6497)
  4. Title-Score dominant (Faktor 1000), Tally + DS-Overlap nur als Tiebreaker
  5. Multi-DS-Fallback (≥2 gemeinsame DS) rettet Edge-Cases wie 6511 (bt-Title
     sagt „MFR", aw-Label „LEADER", DS-Set identisch)
- **Bilanz nach Apply (2026-05-20, 51 Polls):** 13 EXAKT · 38 DIFF · 0 UNMATCHED.
  18 Stichproben quer geprüft: 16/18 sauber, 2 Grenzfälle (6170 Corona-U-
  Ausschuss BE-thematisch verschoben; 6451 Energiepreis Iran hat angeklebte BE).
- **Backup:** `drucksache_polls_pre_bt_filterlist` (vor dem 2026-05-20-Apply).
- **DB-Watermark:** `SELECT poll_id FROM (SELECT DISTINCT poll_id FROM votes) v LEFT JOIN vote_context vc ON vc.poll_id=v.poll_id WHERE vc.poll_id IS NULL` (leer = alle Polls haben Kontext)
- **Pipeline für neue Polls ($~0,01/Poll LLM):**
  `map-vote-drucksache-bundestag.ts --apply` (alle Polls, inkl. nachgezogene
  Roll-Calls) → `generate-vote-context.ts --poll <id> --write` für Polls mit
  geänderter DS-Liste (validierter Prompt `vote-context-v1`, dann
  Neutralitäts-Spotcheck).
- **Stale-Context-Watermark (offen, 2026-05-20):** 38 Polls haben durch
  Filterlist-Apply geänderte DS-Listen — `vote_context.block_hinweis` für diese
  Polls wurde aus alten DS-Listen generiert und ist teilweise outdated.
  Skript-Lauf für diese 38 Polls steht aus (ein paar € LLM-Cost).
- **Alt-Skripte tot:**
  - `audit-vote-drucksache-mapping.ts` (bundestag.de-HTML-SPA, Parser-bust)
  - `apply-vote-bundestag-audit.ts` (manuelle 50-Mappings + Block-Modell-Apply;
    am 2026-05-20 gelöscht, durch Filterlist-Apply ersetzt)
  - `map-vote-drucksache-dip.ts` bleibt verfügbar für DIP-Vorgangs-Lookup
    (`--audit`), wird aber nicht mehr produktiv zum Schreiben genutzt
- **Stimm-Zahlen-Validierung (unverändert valide):** Stichprobe gegen das
  offizielle Plenarprotokoll bestätigt unsere aw-gespiegelten Zahlen (LEADER
  21/78 TOP 7d: 417/73/53 deckungsgleich). Frühere Annahme „aw weicht von
  bundestag.de ab" war ein Teaser-/Join-Artefakt, **widerlegt**. Maßgeblich
  ist stets das im Plenarprotokoll verkündete Ergebnis der konkreten
  Abstimmung.

### 2.14 Bundestag-Handzeichen-Votes (`bundestag_votes`)

LLM-Extraktion aller Abstimmungs-Events aus den Plenar-XMLs — sowohl namentliche
als auch die deutlich häufigeren **per Handzeichen** durchgeführten Voten.
Letztere liefern nur Fraktions-Ebene (ja/nein/enthaltung je Fraktion), keine
per-MdB-Stimmen. Zusätzlich `vote_subtype` (gesetz | petition | personenwahl) für
UI-Filter.

- **Pipeline-Heimat:** **`/home/jinsheng/politik-landtag/scripts/`** (historisch
  dort als Bundestag-+-Berlin-Parallelspur entwickelt). Skripte:
  - `batch-submit-bundestag-votes.ts` (Pre-Flight ohne, Submit mit `--confirm`)
  - `batch-retrieve-bundestag-votes.ts` (wartet auf Batch-Ende + apply)
  - Prompts in `src/lib/bundestag-votes-prompts.ts` (`PROMPT_VERSION=bundestag-votes-v1`)
- **Modell:** Claude Haiku 4.5 mit Tool-Use (`VOTE_TOOL`) + System-Prompt-Cache.
- **Idempotenz:** `(xml_source, snippet_offset)`-Key, schon analysierte Events
  überspringen.
- **XML-Sync (kritisch):** Worktree-`data/plenarprotokolle_xml/` sind NICHT
  symlinkt. Vor Pipeline-Lauf neue Master-XMLs ins landtag-Worktree spiegeln:
  `cp /home/jinsheng/politik/data/plenarprotokolle_xml/21*.xml /home/jinsheng/politik-landtag/data/plenarprotokolle_xml/`
- **Kosten:** Pro Refresh typisch < $0,10 (Batch). 86 neue Events vom 27.05.
  haben $0,06 gekostet.
- **DB-Watermark:** `SELECT MAX(datum) FROM bundestag_votes WHERE error_type IS NULL`
  vs. `SELECT MAX(datum) FROM plenar_sessions`. Bei Drift → Pipeline-Lauf fällig.
- **UI-Konsumenten** (Master-Worktree): `listAllVotesForIndex()` (Abstimmungs-
  Index) + `getBundestagDsHandzeichenVotes(dsNr)` (Drucksachen-Detail-Seite).

### 2.15 TV-Talk-Transkripte + Medien-Auftritte (`data/media-transcripts/`, `data/media-appearances.json`)

Archiv der TV-Polittalks (Lanz, Illner, maischberger, Caren Miosga, hart aber fair)
+ KI-Themen-Analyse der Auftritte einzelner Politiker:innen (Medien-Strip auf der
Profilseite). Drei Stufen, die ersten beiden **kostenlos**:

1. **Transkript-Refresh (gratis, kein LLM):** `scripts/update-talkshows.ts`
   - 3-stufig: Discovery (yt-dlp enumeriert verfügbare Folgen — ZDF Hub-Playlist /
     ARD Sendungs-Collection `/sendung/x/<show.id>`) → Diff gegen
     `data/media-transcripts/<folder>/_manifest.tsv` → Fetch der deutschen
     Redaktions-UT (`--write-subs --skip-download`) als `<folder>-<YYYY-MM-DD>.deu.vtt`.
   - `npx tsx scripts/update-talkshows.ts` = Dry-Run (zeigt neue Folgen);
     `--fetch` lädt UT; `--show <key>` / `--limit N` zum Eingrenzen.
   - **Empirie 2026-06-03:** ARD page-gateway-Widget-API ist tot/404 → yt-dlp-
     Collection ist der robuste Weg für ZDF **und** ARD. Folgen ohne UT-Spur werden
     als Lücke geloggt (nur per Whisper holbar).
   - **DB-/Manifest-Watermark:** `MAX`-Datum je `_manifest.tsv` vs. Discovery-Liste.
2. **Gäste-Matching (gratis, kein LLM):** Voll-Namen-Match aller DB-Politiker:innen
   (18 Parlamente) gegen die Gäste-Teile der Episoden-Metadaten → `data/talkshow-guests-appearances.json`.
   - `scripts/match-talkshow-guests.ts` (ARD-Synopsis-Pfad: maischberger, miosga)
     + `scripts/match-fernsehserien-guests.ts` (fernsehserien.de-„Gäste:"-Block: HaF,
     illner). Beide `--write` zum Speichern, sonst Dry-Run. Lanz separat
     (`data/lanz-mdb-appearances.json`, ZDF-Synopsis hat keine Gästeliste).
   - Erkennt auch Landtags-/EU-/Ex-Mandats-Gäste (nicht nur aktuelle MdB).
3. **LLM-Analyse (kostenpflichtig, bewusst getrennt):** `scripts/build-talkshow-batch-appearances.ts`
   (`--show <key>`) materialisiert Gäste → `data/talkshow-batch-appearances.json`
   (1 Record je Gast×Folge, skip-if-analysiert), dann
   `scripts/batch-media-analyses.ts --submit --from <datei>` → `--status` → `--apply`
   (Haiku 4.5 Batch, Multi-Speaker-Prompt; schreibt `data/media-analyses/<id>.json`
   + Index `data/media-appearances.json`). Pendant für Lanz:
   `build-lanz-batch-appearances.ts`.
   - **Kosten:** ~$0,015/Auftritt (75-Min-Transkript, Batch). Richtwert: 70
     maischberger-Auftritte ≈ $1.
   - **Gate:** wie alle LLM-Schritte NUR auf bewusste Freigabe ([[feedback_ask_before_spending]]).
- **UI-Konsumenten** (Master-Worktree): Medien-Strip auf der Profilseite liest
  `data/media-appearances.json` (Einträge mit `analysis_file` → Detail-Analyse).

---

## 3. Periodischer Workflow

```bash
# 1. Was ist neu? (read-only, alle prüfbaren Quellen)
npx tsx scripts/check-data-freshness.ts

# 2. Gratis/idempotente neue Daten ziehen (KEINE LLM-Schritte)
npx tsx scripts/check-data-freshness.ts --fetch
npx tsx scripts/update-talkshows.ts --fetch   # TV-Talk-Transkripte (§2.15), separat

# 3. LLM-Schritte bewusst + einzeln (Kosten!) — siehe Report-Ausgabe:
#    Reden:       siehe §2.2   (~$ je nach Delta, Pre-Flight zeigt exakt)
#    Drucksachen: siehe §2.5   (~$ je nach Delta, --dry-run zeigt exakt)
```

**Empfohlene Kadenz:** 1× pro Woche nach einer Sitzungswoche. Plenar-XML + DIP
sind binnen Tagen aktuell; abgeordnetenwatch lagt ~1–2 Wochen (Votes kommen
verspätet, das ist normal und keine Lücke unsererseits).

## 4. Bekannte kaputte / manuelle Quellen (Backlog)

1. **~~`audit-vote-drucksache-mapping.ts` / `apply-vote-bundestag-audit.ts`~~** —
   ✅ **gelöst 2026-05-20** durch Filterlist-Apply (`map-vote-drucksache-bundestag.ts`,
   §2.13). Beide Alt-Skripte tot. Bilanz: 13 EXAKT · 38 DIFF · 0 UNMATCHED über
   51 Polls. Backup `drucksache_polls_pre_bt_filterlist`. **Follow-up offen:**
   `vote_context.block_hinweis` für die 38 DIFF-Polls neu generieren
   (`generate-vote-context.ts --poll <id> --write`, paar € LLM-Cost).
2. **`download-drucksachen.sh` + `scrape-ausschuesse.sh`** — hartkodierte tote `/home/jk/`-Pfade. Funktionierende Alternativen: `download-missing-drucksachen.sh` (DS) / `parse-ausschuss.ts` (Ausschuss). Skripte fixen oder löschen.
3. **MDB_STAMMDATEN.XML** — manueller Download, kein Auto-Fetch. Bei Nachrückern leicht zu vergessen.
4. **Bundeskabinett** — hardcoded Liste, kein Frische-Check. Bei Kabinettswechsel still veraltend.
5. **Doku-Drift** — PIPELINE.md S.10 nennt `politicians.photo_path` + `public/photos/`, real existiert nur Spalte `photo_url`.
