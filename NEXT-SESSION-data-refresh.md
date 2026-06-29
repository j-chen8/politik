# Next Session — Pickup: Daten-Refresh-Track (Stand: 2026-06-26)

> Dedizierte Track-Datei (Track-Isolation — `NEXT-SESSION.md` hat fremde Drift).
> SoT für das ganze Vorgehen: **`docs/DATA-SOURCES.md`** (inkl. §0 »update«-Runbook).

## Refresh 2026-06-26 (autonom, User-Trigger „update")

### Was geholt

| Quelle | Vorher | Nachher | Δ |
|---|---:|---:|---:|
| Plenar-XML / Reden-Rohtext | 83 Sitzungen | **86** | +3 (84: 2026-06-12, 85: 2026-06-24, 86: 2026-06-25) |
| Reden-LLM (`speech_analyses_v2`) | 12.821 | **13.264** | +443 (Batch-Cost $2,13); speech_summaries +378 nachgezogen |
| Activities (DIP) | 71.666 | **74.814** | +3.148 (bis 2026-06-26) |
| Drucksachen-PDF (`drucksache_texts`) | 6.379 | **6.563** | +184 |
| Drucksachen-LLM (`drucksache_analyses`) | 5.977 | **6.161** | +184 (Batch-Cost $3,19, 0 Fehler, 28 Topic-Drift im Audit) |
| Votes/Polls (abgeordnetenwatch) | 56 Polls | **58 Polls** (+6540/41/51/52/66/75) | neueste Sitzung 86 (2026-06-25); aw-Lag ~11 T |
| Bundestag-Handzeichen-Votes (`bundestag_votes`) | 686 | **760** | +74 (bis 2026-06-25, $0,23); landtag-Worktree |
| DIP-Vorgänge (`dip_vorgaenge`) | 354 | **357** | GE-Coverage 262/262 (100%) |
| DS-Titel (`dip_ds_titles`) | — | **7.756** | Voll-Sweep |
| ds_unterthemen | — | +184 DS klassifiziert | rede_unterthemen neu gebaut (20.162 Paare) |

### LLM-Kosten gesamt
≈ **$5,80** (Reden $2,13 + Drucksachen $3,19 + Handzeichen $0,23 + Unterthemen ~$0,02 + Vote-Kontext ~$0,08) — unter der ≤15€-Freigabe.

### Vote-Kontext
6566 + 6575 neu in `poll-bt-mapping.ts` (≥6000-Konvention). `map-vote-drucksache-bundestag.ts --apply`: 50 EXAKT · 7 DIFF · 1 UNMATCHED (6566 Vaterschaftsanerkennung — keine Subjekt-DS, ehrlicher Fallback-Kontext). Vote-Kontext regeneriert für 6251, 6351, 6540, 6541, 6551, 6552, 6566, 6575.

### Checks (alle grün)
Polls ohne vote_context = 0 · batch_class NULL = 0 · ds_unterthemen offen = 0 · offene Reden = 0 · Phantom-DS-Votes = 0. Neutralitäts-Spotcheck Reden+Drucksachen+vote_context bestanden (kanonische Tonalitäten, zugeschriebene Sprache).

### Caveat
abgeordnetenwatch lagt ~11 Tage → Rente-/Minijob-**Gesetzentwürfe** liegen als Drucksachen vor (z.B. Aktivrente 21/685, Rentenfinanzierung 21/686), aber etwaige **namentliche** Abstimmungen dazu sind upstream evtl. noch nicht publiziert. Datenlage-Decke, kein Aufwandsmangel.

---

## Refresh 2026-05-25 (autonom, User-Trigger „update")

### Was geholt

| Quelle | Vorher | Nachher | Δ |
|---|---:|---:|---:|
| Plenar-XML / Reden-Rohtext | 78 Sitzungen | **80** | +2 (79: 2026-05-20, 80: 2026-05-21) |
| Reden-LLM (`speech_analyses_v2`) | 11.610 | **11.953** | +343 |
| Activities (DIP) | 66.759 | **67.863** | +1.104 |
| Drucksachen-PDF (`drucksache_texts`) | 5.387 | **5.440** | +53 |
| Drucksachen-LLM (`drucksache_analyses`) | 5.387 | **5.440** | +53 |
| Votes (alle) | ~32.099 | **32.735** | +636 |
| Polls (distinkt) | 51 | **52** | +1 (6528, 2026-05-22) |
| Sidejobs | 3.969 | **4.008** | +39 |
| Committees | ~1.73k | **2.154** | aw-Snapshot (kein Δ-Counter) |
| Vote-Kontext re-generiert | — | 3 Polls | 6528 (neu) + 6251/6351 (DS-Liste geändert) |

### Kosten (Anthropic Batch-API, Haiku 4.5)

| Schritt | Geschätzt | Tatsächlich |
|---|---:|---:|
| Reden-Batch (343 Reden) | $1,51 | **$1,54** |
| Drucksachen-Batch (53 DS) | $3,06 | ~$3,06 |
| Vote-Kontext (3 Polls, Live-API) | $0,03 | ~$0,03 |
| **Summe** | **~$4,60** | **~$4,63** |

Unter 15 €-Schwelle → ohne Rückfrage submitted (per `feedback_update_trigger_runbook`).

### Neutralitäts-Spotcheck (Schritt 5)

- **3 zufällige Reden-Samples (79+80):** alle zugeschriebene Sprache („verteidigt", „betont", „nutzt Sarkasmus"). Keine bewertenden Adjektive.
- **Tonalitäts-Drift (gegen 11er-Enum):** **0/343**. Memory `project_tonalitaet_drift` bleibt gültig (<0,4 %).
- **Quote-Validation Reden:** 86,0 % (988/1149). Baseline war 90,9 % — leicht unter, aber im Rahmen der LLM-Schwankung bei kleinem Sample.
- **3 zufällige Drucksachen-Samples (5440-Range):** neutral, akteurs-zugeschrieben („GRÜNE lehnen ab", „AfD-Fraktion erkundigt sich", „Haushaltsausschuss empfiehlt").
- **Drucksachen Topic-Drift:** 5/53 (~9 %), 1 Tippfehler („Bürokatie"), 4 erfundene Themen außerhalb Enum. Memory `feedback_llm_array_drift` erwartet ~3 %, hier leicht drüber.
- **Vote-Kontext 6528 / 6251 / 6351:** sachlich, zahlen-basiert, keine Wertung.

→ **Spotcheck bestanden.**

### Gemachte Fixes (Pipeline-Hygiene)

1. **`scripts/batch-submit-reden.ts` — Watermark-Filter ergänzt** (Bug-Fix):
   `NOT EXISTS (speech_analyses_v2 v2 WHERE v2.rede_id=ps.rede_id AND v2.segment_index=ps.segment_index)`
   in die SELECT-Query. Vorher: Script hätte alle 11.812 Reden re-submittet
   (Kosten $52 statt $1,51) und beim `JSON.stringify` aller Requests mit
   `Invalid string length` (V8 ~512 MB-Limit) gecrasht. Watermark stimmt jetzt
   mit `DATA-SOURCES.md §2.2` überein.
2. **`src/lib/poll-bt-mapping.ts` — `6528: 6528` ergänzt** (Daten-Pflege):
   Neuer Poll vom 22.05.; bt_id == poll_id-Konvention für DIP-prozedural
   gemappte ≥ 6000.

### Caveats

- **aw-Lag:** abgeordnetenwatch publiziert namentliche Abstimmungen verzögert. 25.05. → neuester Poll 6528 vom 22.05. (~3 Tage Lag, geringer als die übliche ~11 Tage). Spätere Sitzungs-Abstimmungen evtl. noch nicht da.
- **Quote-Validation 86 % statt 90,9 %:** kein Methodik-Wechsel — vermutlich Modell-Schwankung beim kleinen Sample (343 Reden). Bei nächstem Refresh beobachten.
- **9,4 % Topic-Drift Drucksachen** vs. ~3 % Memory-Baseline: ebenfalls Sample-Größen-Effekt (5 von 53). Im `topic_drift_audit`-Spaltenwert dokumentiert.
- **`drucksache_polls` Chicken-and-Egg:** `map-vote-drucksache-bundestag.ts --apply` filtert DS, die noch keine `drucksache_analyses`-Zeile haben (Sicherheits-Gate). 21/6076 musste deshalb in 2 Pässen verlinkt werden (vor + nach Drucksachen-Batch). Idempotenz hilft, aber für künftige `update`-Läufe Reihenfolge beachten: **Drucksachen-Batch retrieven BEVOR `map-vote-drucksache-bundestag.ts --apply` erneut laufen lassen**.

### Definition of Done — ✅

- Gratis-Gaps geschlossen ✓
- LLM-Batches applied ✓
- Vote-Kontext für alle Polls (52/52) ✓
- Neutralitäts-Spotcheck bestanden ✓
- `DATA-SOURCES.md §1`-Snapshot aktualisiert ✓
- Diese Track-Datei geschrieben ✓

---

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
