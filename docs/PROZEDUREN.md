# PROZEDUREN — Master-Index aller Vorgänge

**Zweck.** **Ein** Einstiegspunkt zu allen Prozeduren, Runbooks, Playbooks und Methodiken des Projekts —
damit wir (1) **neue Daten immer mit demselben Vorgang** verarbeiten, (2) **dieselben Fehler nicht
wiederholen**, (3) **gleiche Qualität** reproduzierbar bleibt.

**Regeln:** Dieser Index ist **additiv** ([[feedback_procedures_additive]]) — er ersetzt keine der
verlinkten Dateien, sondern zeigt nur, dass + wo sie existieren. Vor jeder Arbeit an einem Bereich:
**hier nachsehen, ob es schon eine Prozedur gibt**, und ihr folgen. Neue Prozedur → hier eine Zeile
ergänzen. `[[…]]` = Memory-Datei, `docs/…` = Doc.

---

## A) Standard-Vorgänge für NEUE Daten / neues Parlament

| Auslöser | Prozedur | Wo |
|---|---|---|
| Daten-Refresh (User schreibt nur »update«) | Update-Runbook — **Bundestag:** `docs/DATA-SOURCES.md §0` · **Berlin:** `docs/berlin-update-runbook.md` | [[feedback_update_trigger_runbook]] · [[reference_data_sources]] |
| Plattform von Null aufbauen / Modell-Slot upgraden / Sitzung nachziehen | Master-Pipeline-Runbook | `docs/PIPELINE.md` · [[reference_pipeline_runbook]] |
| **Neues Parlament** onboarden (Hamburg, Bayern, NRW…) | 8-Phasen-Playbook (Pre-Conditions → Discovery → Stammdaten → PDF → Reden → Backfill → UI → LLM) | `docs/parlament-pilot-playbook.md` · [[project_parallel_worktree_landtag]] |
| Themen-Unterthemen für ein Parlament | risk-first SoP (Discovery → Spike → Pilot → Global) | `docs/PROZEDUR-themen-unterthemen.md` · [[reference_prozedur_themen_unterthemen]] |

## B) Pipeline-Methodik je Datentyp (= direkt einsetzbarer SoT-System-Prompt)

| Datentyp | Bund | Berlin |
|---|---|---|
| Plenar-Reden | `docs/reden-methodology.md` + `docs/summarization-methodology.md` · [[project_reden_pipeline]] | `docs/summarization-methodology-berlin.md` + `docs/berlin-sitzungs-pipeline.md` + `docs/berlin-frame-discovery.md` (Frame-Glossar) · [[project_berlin_speeches_pipeline]] [[project_berlin_speech_analyses]] |
| Drucksachen | `docs/drucksachen-pipeline.md` + `docs/drucksachen-tonalitaet-methodik.md` · [[project_drucksachen_pipeline]] · DIP-Vorgänge [[project_dip_vorgaenge]] · Latenz-Timeline [[project_drucksachen_latenz_pipeline]] | `docs/summarization-methodology-berlin-drucksachen.md` · [[project_berlin_drucksachen_pipeline]] |
| Votes / Abstimmungen | `docs/vote-drucksache-mapping-methodology.md` · [[project_votes_pipelines]] [[project_vote_topic_mapping]] [[project_vote_context]] | [[project_votes_pipelines]] |
| Q&A (Fragen→Antworten) | `docs/QA-METHODIK.md` · [[project_qa_extraction]] | (gleiche Methodik) |
| CV / Biografie | [[feedback_cv_generator_haiku_not_llama]] · [[project_multisource_cv_workflow]] · [[project_cv_duplicate_pipeline]] | [[project_berlin_cv_cascade_progress_2026-05-30]] |
| Foto + Social-Handles | [[project_photo_social_track]] (Commons-Fotos, facebook/tiktok-Handles, Lizenz-Caption) | (analog, ~60 % Foto-Coverage) |
| Themenfelder + Klassifikation | `docs/themen-taxonomie-bt.md` + `docs/themen-unterthemen-design.md` · Research-Basis `docs/themen-granularitaet-research.md` [[reference_themen_granularitaet_research]] | `docs/themenfelder-berlin.md` + `docs/themen-taxonomie-berlin.md` + `docs/themen-unterthemen-berlin.md` · [[project_berlin_themenfelder]] |
| Themenfeld-Profil (wer „besitzt" ein Feld) | `scripts/analyse-themenfeld.ts` · [[project_themenfeld_profil_tool]] | [[project_regierungsbilanz_track]] (getBerlinThemenAktivitaet) |
| Volltext-Suche (FTS5 + Synonyme) | [[project_search_fts5]] · [[project_search_synonym_layer]] · [[project_search_overhaul_2026-05-28]] | [[project_berlin_search_fts5]] |
| Mediathek-Video-Verlinkung | [[project_mediathek_video_linking]] | — |
| Kommissionsbericht → Analyse-Schicht | `docs/PROZEDUR-kommissionsbericht.md` · [[project_kommissions_tracker]] (Beschaffung getrennt: Scraper + Tages-Timer) | — |

> **Methodik-Evolution** (Historie, wie sich die Ansätze entwickelt haben): `docs/methodology-evolution.md`.

## C) LLM-Lauf-Disziplin (Kosten + risk-first)

- **Vor JEDER bezahlten API zuerst fragen** — Aufgaben-Freigabe ≠ Kosten-Freigabe: [[feedback_ask_before_spending]]
- **Nie direkt in den Vollbatch** — erst Discovery von Hand, dann Spike (Cents), dann 1-Feld-Pilot, dann global: `docs/PROZEDUR-themen-unterthemen.md`
- Batch-API ab ~5 Cent (50 % off + Cache), live nur < 3 Cent: [[feedback_batch_api_threshold]]
- ≤10 transiente Fehler → live + Retry-Loop, nicht neu submitten: [[feedback_retry_small_batches]]
- Groq Free-Tier voll ausschöpfen, dann paid Fallback: [[reference_groq_free_tier_strategy]] [[reference_groq_limits]]
- Modell-Wahl CV/Cascade: [[feedback_cv_generator_haiku_not_llama]] · [[project_specialist_cascade]]

## D) Qualität & Prüfungen (vor/nach jedem Lauf)

- **Bidirektionale Coverage-Checks** (A∖B UND B∖A, Kernbegriffe aus amtlicher Quelle): [[feedback_bidirectional_coverage_check]]
- **8 Failure-Modes nach jedem Vote-Pipeline-Re-Run** (Coverage, Dupes, 21/XXXX-Halluz, sitzung=NULL, DS-lose…): [[feedback_pipeline_run_checks_2026-05-28]]
- Pipeline-Fehler-Katalog (was beim Bund schiefging): [[feedback_pipeline_mistakes_2026-05-28]]
- **Grundzahlen müssen 100 % stimmen** (MdB-Total, Fraktionsgrößen): [[feedback_grundzahlen_100_prozent]]
- Doku-/Methodik-Audit > 500 Zeilen → an Subagent delegieren mit Severity-Schema + DB-Cross-Check: [[feedback_audit_via_subagent]]
- Vote↔Drucksache-Konsistenz-Check als Runbook-Schritt: `scripts/check-vote-drucksache-consistency.ts` · [[project_vote_phantom_ds_fix]]
- Beschlussempfehlungs-Flip-Wächter nach jedem Votes-Backfill (deterministisch, Exit 1 = fehlender Flip → UI zeigt fälschlich „angenommen"): `scripts/check-vote-beschluss-kontext.ts` · [[project_ueberweisung_display_fix]]
- Parität gegen Bund-Bugs prüfen (für jedes neue Parlament): [[project_berlin_parity_audit]]
- Quellen-Kohärenz (Wiki/Homepage/Bundestag-Konflikte) — Reaktions-Plan, kein Gotcha-Frame: `docs/source-coherence-echt-fehler.md` · [[project_source_coherence]] [[feedback_no_gotcha_framing]]

## E) Deploy & Betrieb

- **Staging-first ist Pflicht** — immer `build:staging` + LAN-Port zuerst, nie direkt Prod: [[feedback_staging_workflow]]
- **Kein Live-Deploy ohne ausdrückliches »live«** (»committen« ≠ »live«): [[feedback_no_live_deploy_without_ok]]
- Prod-Deploy-Runbook + aktueller Deploy-Zustand: [[reference_prod_deploy_runbook]] · [[project_deploy_state_2026-06-05]]
- Server-Neustart **port-spezifisch** (`lsof -ti:PORT`), nie next-server-Pattern: [[feedback_server_restart_port_specific]]
- `force-dynamic`: Daten-Updates live ohne Rebuild: [[feedback_force_dynamic_no_rebuild]]
- LAN-Dev: `allowedDevOrigins` setzen, sonst keine Hydration: [[feedback_nextjs_lan_dev]]
- Perf erst im Prod-Build messen (Dev 10–400× langsamer): [[feedback_dev_vs_prod_performance]]
- Hosting: Mini-PC + CF-Tunnel: [[project_demo_launch_hosting]]

## F) Arbeitsprinzipien (Meta — gelten überall)

- **Prozeduren sind additiv**, neue überschreiben nie alte: [[feedback_procedures_additive]]
- **Neutralität**: 100 % Fakten, zeigen statt etikettieren: [[feedback_neutralitaet]] · [[feedback_no_gotcha_framing]]
- **Hinterfragen statt zustimmen** (Prämisse vor dem Wie): [[feedback_challenge_dont_agree]]
- Track-isolierte, saubere Commits: [[feedback_track_isolation_commits]]
- Session-Workflow: ehrliche Bestandsaufnahme + lineares Durchziehen: [[feedback_session_workflow]]
- Consumer-UI: scan-first, Label:Wert+Chips, Tiefe hinter progressive disclosure: [[feedback_consumer_scan_first]]

## G) Bekannte Fehler — NICHT wiederholen

Jeder Eintrag: **Symptom → Wurzel → Fix**. Bei neuer Pipeline-Arbeit gegen diese Liste prüfen.

| Symptom | Wurzel | Fix / Prozedur |
|---|---|---|
| Regierungs-Gesetzentwürfe fehlten (z.B. 21/5922) | Ingestion war **activities-getrieben** | DIP-**Voll-Enumeration** (`f.zuordnung=BT`) · [[project_drucksachen_discovery_fix]] |
| Stale/vorläufige Plenar-Protokoll-Fassungen eingefroren, Reden fehlten | Re-Fetch lud nur fehlende **Dateinamen** | **Blob-ID-Vergleich** + Re-Fetch; `speech_summaries`-INSERT-Falle beachten · [[project_plenar_refetch_fix]] |
| Votes zeigen unsinnige Drucksache (Phantom-Links) | falsche DS-Zuordnung im retrieve | Konsistenz-Check-Skript + gehärteter retrieve · [[project_vote_phantom_ds_fix]] |
| ~67 Votes joinen nicht auf DS | **zero-padded** DS (`21/0623` statt `21/623`) | führende Null strippen · [[project_bundestag_votes_ds_zeropad]] |
| 696 Anträge als „Kleine Anfrage" angezeigt | `batch_class` = Längen-Tier ≠ Dokumenttyp | `dokumenttyp` aus DIP backfillen, UI typ-getrieben · [[project_drucksache_dokumenttyp_fix]] |
| Themenfeld-Rollup überzählt (Fremd-Items) | generische Tags in falschem Feld | Override-Schicht + Multizähl-Hinweis · [[project_themenfelder_rollup_bug]] |
| TOP-Titel beim Seed überschrieben | Seed ohne COALESCE/Guard | Guard gegen Überschreiben · [[feedback_seed_overwrites_top_fix]] |
| Halluzinierte CV aus fremder Seite | Scraper folgt Links nicht / Orphan-Page | transparent als Limitation, kein Re-Scrape · [[project_stale_page_scraping_bug]] [[project_multipage_biography_scraping]] |
| LLM sendet stringifizierte Arrays / Tippfehler-Enums (~3 %) | Tool-Use lockt nicht 100 % | `safeParseArray` + `TONALITY_ALIASES` im retrieve · [[feedback_llm_array_drift]] [[project_tonalitaet_drift]] |
| Freshness-Check überzählt (1202 vs real 0) | naives NOT-EXISTS | Batch-Pre-Flights statt naivem Diff · [[project_freshness_script_missing]] |

---

## Offene Tracks (kein Prozedur-Index, aber verwandt)

Was über alle Tracks gerade offen ist: `docs/OPEN-TRACKS.md` (am Session-Ende gepflegt).
