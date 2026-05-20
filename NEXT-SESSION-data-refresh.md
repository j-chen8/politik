# Next Session — Pickup: Daten-Refresh-Track (Stand: 2026-05-20, Abend)

> Dedizierte Track-Datei (Track-Isolation — `NEXT-SESSION.md` hat fremde Drift).
> SoT für das ganze Vorgehen: **`docs/DATA-SOURCES.md`** (inkl. §0 »update«-Runbook).

## Refresh 2026-05-20 (Demo-Launch-Tag)

Trigger: 404 auf `/aktivitaeten/21-5990` (User-Report). Diagnose: DS
über DIP-Aktivitäten bekannt, aber PDF erst heute 07:01 UTC auf
dserver hochgeladen → keine Pipeline-Verarbeitung seit 19.05.-Refresh.

Voller `update`-Lauf per §0:
- `--fetch`: +574 Activities, +33 Drucksachen-PDFs (21/6001 → 21/6034),
  alle klassifiziert
- Reden-LLM: 0 Pre-Flight-Requests (alle aktuell)
- Drucksachen-LLM: Batch `msgbatch_01RQC7WE4LHAY8zmXkwrGP2Z` mit 29
  Requests submitted, $3,03 (unter Cap). 29/29 erfolg, 0 errors, 5
  Topic-Drift (innerhalb Toleranz). Neutralitäts-Spotcheck: zugeschriebene
  Sprache durchgehend („Die AfD-Fraktion fragte..."), keine bewertenden
  Adjektive, Tonalität sachlich. **Bestanden.**
- Vote-Kontext: keine neuen Polls (51/51 abgedeckt seit 19.05.)
- Stand danach: Drucksachen-LLM 5.358 → **5.387**, Activities 66.185 →
  **66.759**, PDFs max 21/6034

Strukturelle Folge: Code-Fallback in `getDrucksacheDetail` für künftige
Pipeline-Lags. `getDrucksacheSkeleton` rendert „Analyse pending" statt
404, sobald eine DS in `activities` ist aber noch nicht analysiert
(Commit `458bb69`). Plus Title-Bug in 7 SELECTs (`activities.titel`
ist Politiker-Name, nicht Anfrage-Thema → `COALESCE(thema, titel)`,
Commit `562373b`).

---

## TL;DR Session 2026-05-19 (für schnelles Wiedereinsteigen)

**Ausgangslage:** User krank, fragte ob Daten aktualisiert werden sollten — DB
war auf Stand 28.04.2026 (Sitzung 75). Daraus wurden drei Phasen, alle sauber
abgeschlossen, **nichts offen das blockiert**:

1. **Voller Daten-Refresh** — Plenar 76/77/78 (bis 08.05.) + Activities → 66.185
   (bis 19.05.) + Drucksachen-PDF → 21/6001 + alle klassifiziert + Votes (Poll
   6511 LEADER, datiert via `backfill-vote-dates.ts` — Pflicht-Schritt war in
   `--fetch`-Kette übersehen, gefixt) + 2 LLM-Batches ($5,44 total, Reden 509 +
   Drucksachen 202, Neutralitäts-Spotcheck bestanden, 0 Tonalitäts-Drift).

2. **„update"-Mechanismus scharf** — `docs/DATA-SOURCES.md §0` Runbook + neues
   `scripts/check-data-freshness.ts` + Memory `feedback-update-trigger-runbook`.
   **Künftig reicht: „update" → ich ziehe autonom alles durch** (≤15 € LLM-
   Budget ohne Rückfrage, Neutralitäts-Disziplin, Pflicht-Caveats).

3. **Vote↔Drucksache-Cross-Check entkaputtet** — toter bundestag.de-HTML-SPA-
   Scraper ersetzt durch DIP-Hybrid (`map-vote-drucksache-dip.ts`); Poll 6511
   mit grounded `vote_context` ergänzt → **vote_context 51/51, 0 Fallback**.
   DIP-Audit (mit Backoff) gegen verifizierte 50: 0 stille Fehlmappings.

4. **bundestag.de-Filterlist-Excursion (geprüft & verworfen)** — User-Frage
   „haben wir mit bundestag.de gemappt?" führte tief: Open-Data-Filterlist
   `484422-484422` existiert, ich baute `map-vote-drucksache-bundestag.ts`
   (**read-only Diagnose, NIE `--apply`**). Read-only-Diff zeigte scheinbar
   31/51 Stimm-Vektor-Abweichung. **Investigation gegen autoritatives
   Plenarprotokoll 21/78 (lokal): unsere Zahlen sind korrekt** — 417/73/53
   für LEADER deckungsgleich mit aw und Protokoll. Die 449/136/0/45 kamen
   nur aus dem Filterlist-**Teaser** (Sekundär-Widget, Fehlpaarung wegen
   mehrerer LEADER-BE am selben Tag + flaky Parser). bundestag.de hat
   **keine falschen Daten; unsere auch nicht.** /methodik-Notiz korrigiert
   → positive Protokoll-Validierung statt falscher Divergenz-Behauptung.

**Geänderte/neue Dateien (uncommittet, koherenter Track):**
`docs/DATA-SOURCES.md`, `scripts/check-data-freshness.ts`,
`scripts/map-vote-drucksache-dip.ts`, `scripts/map-vote-drucksache-bundestag.ts`,
`src/lib/poll-bt-mapping.ts` (6511-Eintrag + Header), `src/app/design/linear/
methodik/page.tsx` (Stimm-Zahlen-Validierungs-Block), diese Pickup-Datei,
3 Memory-Dateien.

**Definitiv offen — alles read-only / niedrigster Wert, nichts blockierend:**
- 8 fetch-Fehler-Polls im DIP-`--audit` re-auditieren (verifizierte 50 ohnehin
  unangetastet).
- Track committen (track-isoliert), wenn gewünscht — saubere Commit-Trennung
  laut `feedback-track-isolation-commits`. **Nur nach User-OK** (steht aus).

**Wichtigste Lehre des Tages (3× selbst-korrigiert in der Filterlist-Excursion):**
**Goldstandard ist das Plenarprotokoll** (Stenografischer Bericht), nicht
Teaser/Filterlist/Aggregator. Read-only-Diff-zuerst-Disziplin hat durchgehend
verhindert, dass dieser Irrweg geprüfte Daten beschädigt — alle Writes
geschützt, 0 Datenverlust.

---

## Was diese Session gemacht hat

Trigger war die User-Frage „sollten wir Daten aktualisieren? Ist ja 19. Mai" →
daraus wurde ein systematischer Daten-Refresh + zwei dauerhafte Deliverables,
damit künftig **„update"** als einziges User-Wort reicht.

**Deliverables (neu, im Repo):**
- `docs/DATA-SOURCES.md` — SoT-Manifest aller Datenquellen + §0 »update«-Runbook
  (stehende Kostenfreigabe ≤15 €, Neutralitäts-Disziplin, Pflicht-Caveats, DoD)
- `scripts/check-data-freshness.ts` — read-only Gap-Report; `--fetch` zieht nur
  $0/idempotente Daten (Drucksachen-LLM-Query auf autoritative Batch-Idempotenz
  gespiegelt; Klassifikations-Schritt `classify-drucksachen`+`label-administrativ`
  in die `--fetch`-Kette aufgenommen — war initial übersehen)
- Memory: `feedback_update_trigger_runbook`, `reference_data_sources`

**Daten gezogen (Refresh 2026-05-19):**
- Plenar 76/77/78 (bis 2026-05-08) ingestiert+extrahiert
- Reden-LLM: 9.272 → **9.689** (509 analysiert, Batch `msgbatch_01HMkZzKV1W2UpGxSs34Zn4V`, $2,22)
- Activities (DIP): 62.840 → **66.185** (bis 2026-05-19)
- Drucksachen-PDF: bis **21/6001** (+167 Texte, alle klassifiziert)
- Drucksachen-LLM: 5.185 → **5.358** (202 analysiert, Batch `msgbatch_01MBvRBGtknCRev4R5VP7n66`, $3,22)
- **Neutralitäts-Spotcheck bestanden:** 0 Tonalitäts-Drift (509/509 valider Enum);
  bewertende Adjektive nur zugeschrieben/zitiert (H10-self-check feuert sichtbar);
  Drucksachen 0 Wertungs-Treffer; Grounding-Read sauber

## Votes-Track abgeschlossen (inkl. Pipeline-Fix)

- aw-Seed **fertig** (631/631): Votes 31.477→**32.107**, Sidejobs 3.901→**3.969**,
  Committees ~1.73k. Poll **6511** (LEADER-EU-Förderung, 630 Votes).
- **Pipeline-Fix:** Poll 6511 kam datumslos rein — `seed-abgeordnetenwatch.ts`
  zieht `/votes` pro Mandat, das liefert kein `field_poll_date`. Dedizierter
  Folgeschritt `scripts/backfill-vote-dates.ts` (Skript-Kommentar Z.149) war in
  `--fetch`-Kette + DATA-SOURCES.md übersehen → nachgezogen, jetzt 6511 =
  2026-05-08, `MAX(poll_date)`=2026-05-08. Kette+Doku korrigiert (2. Fund
  dieser Art nach Drucksachen-classify — beide via diszipliniertem Verify).
- **Upstream-Lag ~11 Tage = Datenlage-Decke, kein Bug:** kein Poll nach
  2026-05-08 existiert bei aw, Mai-Sitzungs-Abstimmungen noch nicht publiziert.

## Vote↔Drucksache-Cross-Check — GELÖST via DIP-Hybrid (2026-05-19)

- Toter bundestag.de-SPA-Scraper ersetzt durch `scripts/map-vote-drucksache-dip.ts`
  (aw-intro → DIP `/drucksache` → `vorgangsbezug` → `/vorgangsposition`).
- **Hybrid (User-Entscheidung):** verifizierte 50 (Block-Modell, `POLL_TO_BT_ID`
  bt_id ≤ 1020) unangetastet; neue Polls DIP-prozedural (bt_id == poll_id).
- **6511 fertig:** `audit_bundestag_polls[6511]` + `drucksache_polls`
  (21/4762, 21/5649) + `poll-bt-mapping.ts`-Eintrag + `vote_context`
  (`vote-context-v1`, Neutralitäts-Spotcheck bestanden). **vote_context 51/51,
  0 Fallback.** Methodik-Befund „nackte Poll 6511" damit geschlossen.
- **Validierung abgeschlossen:** Voller DIP-`--audit` 51/51 (mit aw-Backoff):
  **14 EXAKT · 18 DIP⊆Block (erwartet) · 1 Edge (6324) · 10 LIMITATION ehrlich
  geflaggt · 8 transiente fetch-Fehler · 0 stille Fehlmappings.** Diagnose der
  3 Ur-Abweichungen: 6250/6251 = strukturelle DIP-Grenze (Haushalt: 1 Vorgang
  bündelt alle Einzelpläne) → Heuristik flaggt jetzt `LIMITATION:haushalt`
  statt falsch zu mappen; 6324 = Vorgang-Picker zu grob → gehärtet (Multi-DS-
  Kandidaten + Titel-Match), jetzt korrekter Vorgang/5-von-6-Match.
- **Trivial-Rest (read-only, niedrigster Wert):** 8 fetch-Fehler-Polls
  re-auditieren. Verifizierte 50 ohnehin unangetastet — kein Blocker.

### bundestag.de-Filterlist-Rebuild (2026-05-19) — geprüft & VERWORFEN
- Ausgelöst von User-Frage „haben wir mit bundestag.de gemappt?". Autoritative
  Open-Data-Filterlist `484422-484422` existiert (`scripts/map-vote-drucksache-
  bundestag.ts`, read-only Diff).
- **Read-only-Diff (Sicherheitsnetz, 0 Writes):** 31/51 Stimm-Vektor-Abweichung.
- **Ursache aufgeklärt — KEIN Quell-Konflikt:** aw-API `/votes?poll=6511` = unsere
  DB exakt (417/73/53/87) → Seed korrekt. Das **autoritative Primär-Original**
  (Stenografischer Bericht, **Plenarprotokoll 21/78 TOP 7d**, lokal in
  `data/plenarprotokolle_xml/21078.xml`) verkündet **417/73/53 (543 abgegeben)**
  = aw = unsere DB **exakt**. Die 449/136/0/45 kamen nur aus dem bundestag.de-
  **Filterlist-Teaser** (Sekundär-Widget) — Fehlpaarung, da am 08.05. mehrere
  LEADER-Beschlussempfehlungen (TOP 7d+7e) liefen, plus mein fehleranfälliger
  Filterlist-Parser. **bundestag.de hat KEINE falschen Daten; unsere stimmen.**
- **Entscheidung:** Rebuild NICHT durchgeführt. `map-vote-drucksache-bundestag.ts`
  bleibt read-only Diagnose, **nie `--apply`**. Stand bleibt DIP-Hybrid +
  verifizierte 50. /methodik-Notiz korrigiert → jetzt positive Validierung
  („Protokoll bestätigt unsere Zahlen"), nicht falsche Divergenz-Behauptung.
- **Lehre:** read-only-erst-Diff war goldrichtig; ich hatte 3× zu früh
  geschlussfolgert (449≠417 „Bug", dann „echte Divergenz", beide falsch).
  Goldstandard ist das **Plenarprotokoll**, nicht Teaser/Filterlist/Aggregator.

## Working-Tree-Hinweis

Neu/geändert in diesem Track: `docs/DATA-SOURCES.md`,
`scripts/check-data-freshness.ts`, `NEXT-SESSION-data-refresh.md`, DB-Daten
(politik.db), `data/plenarprotokolle_xml/2107{6,7,8}.xml`,
`data/drucksachen/*` (gitignored), `.batch-state.json` + `.alt-20260519`.
Andere Track-Drift unangetastet.
