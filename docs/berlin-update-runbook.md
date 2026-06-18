# Berlin »update«-Runbook (PARDOK) — Playbook für den Berlin-Datenrefresh

> **Was das ist:** Die parlament-eigene Update-Prozedur für Berlin (Abgeordnetenhaus, 19. WP),
> Pendant zum Bundestag-`docs/DATA-SOURCES.md §0`. Eigene Datei pro Parlament
> ([[feedback_procedures_additive]]) — Bundestag bleibt unberührt in DATA-SOURCES.md.
> Trigger: „update berlin" / Berlin-Refresh.
>
> **⚠️ Anders als BT-§0:** LLM-Schritte **IMMER mit Kosten-OK** — KEINE stehende Freigabe
> (User-Regel: kein Limit, immer fragen, [[feedback_kosten_ok_vor_api]]).
> Vollständig validiert + durchgelaufen **2026-06-17** (305 DS + 313 Reden + 728 Unterthemen).
> Quelle ist eine **statische OpenData-XML** (kein Live-API-Poll): voller Re-Ingest.
>
> **Verwandt:** `docs/berlin-sitzungs-pipeline.md` (Reden/Votes/TOP-Methodik + Anti-Patterns),
> `docs/themen-unterthemen-berlin.md` (Themen-Achse + bekannte ~1%-Recall-Lücke),
> `docs/summarization-methodology-berlin-drucksachen.md` (DS-Analyse-Methodik).

---

## Lage prüfen (read-only, $0)
- **Upstream-Frische:** `curl -sI -A "politik-radar/1.0" https://www.parlament-berlin.de/opendata/pardok-wp19.xml` → `last-modified` vs. lokale `ls -la data/berlin/pardok-wp19.xml`.
- **Letzte Sitzung:** `SELECT MAX(sitzung_nr) FROM berlin_speeches` vs. höchstes `p19-NNN-wp.pdf` (HEAD-Test). ⚠️ **Künftige Sitzungen erscheinen in PARDOK als Agenda** (dok_typ „Behandlung im Plenum", `lok_url=NULL`) BEVOR das Wortprotokoll existiert (PDF→404) — das ist die Datenlage-Decke, **keine Lücke**.

## Phase 0 — Scrape + Rohdaten ($0, idempotent)
0. **DB-Snapshot vor jeder Mutation:** `sqlite3 politik.db ".backup '/home/jinsheng/politik/politik.db.preberlin-<datum>'"` (politik.db = Symlink auf geteilte Master-DB; WAL-sicher).
1. **XML ziehen:** `curl -A "politik-radar/1.0" https://www.parlament-berlin.de/opendata/pardok-wp19.xml -o data/berlin/pardok-wp19.xml`
2. **Re-Seed:** `npx tsx scripts/seed-berlin-pardok.ts` — UPSERT-Rebuild von berlin_documents/vorgaenge/persons. dbid ist stabil aus PARDOK-`DBID`. ⚠️ **FK-sicher:** kein `DELETE FROM berlin_documents` (FK von berlin_drucksachen_analyses; UPSERT statt Wipe). Danach: `SELECT COUNT(*) FROM berlin_drucksachen_analyses a LEFT JOIN berlin_documents d ON d.dbid=a.dbid WHERE d.dbid IS NULL` = 0.
3. **PDFs+Text:** `download-berlin-pdfs.ts --art=Drucksache --limit=400` (neue DS) **und** `download-berlin-pdfs.ts` (neue Plenarprotokolle). Idempotent, 800ms höflich.
4. **Reden extrahieren:** `npx tsx scripts/seed-berlin-speeches.ts` — ⚠️ verarbeitet per Skip-Guard **nur Sitzungen ohne bestehende Reden** (sonst FK-Bruch über berlin_speech_analyses.speech_id; `--force` erzwingt Re-Extraktion).

## Welle A — LLM-Stränge Drucksachen + Reden + Votes (unabhängig, parallel, 💰 Kosten-OK)
- **Pre-Flights ($0):** `batch-submit-berlin-drucksachen.ts --rest` + `batch-submit-berlin-reden.ts --rest`. ⚠️ **`--rest` = inkrementell** (alle noch nicht Analysierten). `--batch=N` liefert **0**, weil die kumulativen Initial-Rollout-Targets (10414/19294) längst überschritten sind. Summe bilden, vorlegen, **OK abwarten**.
- **Submit (nach OK):** `… --rest --confirm` → batch_id (State in `batch-rest.json`).
- **Votes (live, pro neuer Sitzung):** `rerun-berlin-votes.ts --sitzung N`.
- **Retrieve:** `batch-retrieve-berlin-{drucksachen,reden}.ts --rest`. Beschlussempfehlungen sind im Drucksachen-`--rest` enthalten (Klasse `beschlussempfehlung`) — separates BE-Skript NICHT nötig (idempotent, würde überspringen).
- ⚠️ **Reden-Leak-Cleaner Pflicht danach:** `clean-berlin-zusammenfassung-leaks.ts --apply` — Haiku schreibt bei ~30 % der Reden Tool-Output-Müll in `zusammenfassung_2_saetze` (§3 berlin-sitzungs-pipeline.md).
- **TOP-Summaries (NACH Reden-Retrieve — brauchen Reden-Analysen):** `batch-berlin-top-summaries.ts --sitzung N --confirm` → `--retrieve <batch_id>` je neuer Sitzung.

## Welle B — Themen-Synthese (NACH Welle-A-Drucksachen, 💰 ¢, Kosten-OK)
- ⚠️ **`batch-unterthemen-global-berlin.ts --submit --incremental`** → `--status` → `--apply --incremental`. **`--incremental` = NUR neue DS, append.** OHNE Flag = Voll-Reset (`DELETE FROM berlin_ds_unterthemen`, ~$17, **wirft den Prune weg**). Liest `thema_json` aus Welle A → muss danach laufen.
- ⚠️ **Prune Pflicht danach:** `prune-unterthemen-querschnitt.ts --apply --alle` — neue DS bekommen sonst ungeprunte Querschnitt-Felder (Transparenz/Verwaltung/Finanzen-Lärm).
- **Reden-Erben (NACH Prune):** `seed-berlin-rede-unterthemen.ts --apply` (DROP+Rebuild, $0).

## Abschluss ($0)
- **Backfills:** `backfill-berlin-vote-labels.ts --apply`, `rebuild-berlin-speech-fts.ts`.
- **Checks:** 0 verwaiste Analysen (beide FK), 0 Phantom-Vote-DS (`drucksache_dbids_json` → existiert dbid?), Analyse-Watermark 0, Neutralitäts-Spotcheck (faktisch + zugeschrieben, keine Eigen-Wertung).
- **Datenstand:** Berlin-Landing liest DB-mtime (`getDatenstand`) → **auto-aktuell, kein `last-refresh.txt` nötig** (anders als BT-Landing).

## ⚠️ Vermerke (Stolpersteine)
- **Kosten-Realität:** Pre-Flight-Schätzungen laufen **~1,7× zu niedrig** (Cache-Write-Tokens unterschätzt). 2026-06-17: Schätzung $3 → real ~$5. Bei der Vorlage einkalkulieren.
- **Verlorene `_`-Skripte:** `_post-process-vote-outcomes.ts` (Vote-Outcome-Heuristik) ist bei einem Track-Reset verloren (wie früher `check-data-freshness.ts`). Display kollabiert `annahme_geaendert`→„Angenommen", daher unkritisch; bei Bedarf neu bauen. Der Leak-Cleaner wurde 2026-06-17 rekonstruiert (jetzt ohne `_`-Präfix → committet).

## Definition of Done (Berlin)
Gratis-Gaps geschlossen · alle Batches applied · Leak-Cleaner + Prune + Reden-Erben gelaufen · 0 FK-Orphans/Phantom-Votes · Neutralitäts-Spotcheck bestanden · ehrlicher Bericht inkl. Echt-Kosten + Caveats (z.B. künftige Sitzung ohne Protokoll).
