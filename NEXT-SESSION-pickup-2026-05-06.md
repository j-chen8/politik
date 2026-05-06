# Next Session — Pickup 6. Mai 2026 (CV-Track)

> Stand: heute Nacht — alles synchronisiert (Git + R2). Kann morgen direkt loslegen.
>
> Andere `NEXT-SESSION*.md`-Dateien gehören zum Reden-Track (anderes Fenster).

## Direkt morgen (5 Min)

**Methodik-Seite im Browser anschauen** — ich habe heute Phase 7, 8, 9 + Executive Summary in `docs/methodology-evolution.md` geschrieben + auf `/methodik` (UI) Phase 7 als interaktiven Block ergänzt, aber nicht visuell verifiziert.

```bash
npm run dev
# → http://localhost:3000/methodik
# → http://localhost:3000/quellen-diskrepanzen
# → http://localhost:3000/politiker/32337  (Brandner — UI-Render-Bugs gefixt)
# → http://localhost:3000/politiker/175486 (Reem — Sonstiges-Cleanup)
# → http://localhost:3000/                 (Landing-Source-Coherence-Block)
```

Wenn was kaputt aussieht, fixen. Wenn nicht: weiter zu Optionen unten.

## Drei Optionen für was-danach

### Option 1 — Stage-5-Recall-Stichprobe (~2-3 h, Förder-Pitch-relevant)

**Problem:** Wir wissen, dass von 39 Stage-5-Konflikt-Flags 14 echt sind (Precision ~36 %). Wir wissen **nicht**, wie viele echte Diskrepanzen Stage 5 *übersieht*. Vor einem Förder-Pitch ist das der einzige methodische Soft-Spot — Reviewer fragt sonst „und wie viel verpasst eure Pipeline?".

**Workflow:**

1. 10-30 zufällige MdBs ziehen, die Stage-5 als „kein Konflikt" markiert hat:
   ```sql
   SELECT id, first_name||' '||last_name FROM politicians
   WHERE source_coherence_checked_at IS NOT NULL
     AND (source_conflicts IS NULL OR source_conflicts = '[]')
   ORDER BY RANDOM() LIMIT 20;
   ```
2. Pro MdB cv_json + cv_homepage_json manuell vergleichen (oder mit Opus-Hilfe inline) — gibt es echte Widersprüche, die Stage-5 übersehen hat?
3. Recall-Schätzung: `True Positives / (True Positives + False Negatives)`
4. Falls Recall <70 %: Stage-5-Prompt verschärfen + Re-Run

**Wert:** belastbarer Förder-Pitch-Satz „wir fangen X % der echten Diskrepanzen". Ohne diese Zahl bleibt eine Schwachstelle.

### Option 2 — PRAEZ-Konflikte als optionaler UI-Toggle (~1-2 h)

**Problem:** 14 Präzisierungs-Diskrepanzen sind aktuell unsichtbar (Filter zeigt nur ECHT). Beispiel: Stefan Nacke „Münster II vs. Münster Süd" — beide Quellen meinen denselben Wahlkreis, aber kontextualisierter Hinweis wäre wertvoll für Pitch („Wahlkreis-Reform 2022").

**Workflow:**

1. In `PoliticianCV.tsx`: Toggle-Button „Detail-Diskrepanzen anzeigen" (default off)
2. Wenn aktiv: Filter erweitert auf `final_verdict in ('ECHT', 'PRAEZISIERUNG')`
3. PRAEZ-Konflikte mit anderem visuellen Stil (subtiler, nicht amber-warning, sondern grau-info)
4. localStorage-Persistenz, damit Toggle-Wahl seitenübergreifend bleibt

**Wert:** zeigt Plattform-Tiefe. Risiko: Bürger-Verwirrung, daher Default off.

### Option 3 — Reden-Themen-Klassifikation als neuer Pipeline-Track (großes Vorhaben)

**Kontext:** `speech_analyses_v2` mit 9.913 Reden ist da (Tool-Use-Outputs), aber ohne Themen-Klassifikation kann das **Synopse-Aussage-vs-Vote-Killer-Feature** nicht gebaut werden.

**Pattern:** Multi-Label-Klassifikation mit kontrolliertem Vokabular (Innen/Außen/Wirtschaft/Soziales/Umwelt/Verteidigung/Bildung/Gesundheit/Digitales/Klima/Migration). Llama 4 Scout (Groq Free) oder Haiku-Cascade.

**Geschätzter Aufwand:** mehrere Sessions — Schema entwerfen, Pipeline-Skript bauen, Stichprobe testen, Vollauf, UI-Integration.

## Reden-Track (anderes Fenster, hier nur Hinweis)

Laut Memory:
- **Bias-Korrektur Re-Batch** (msgbatch_019gryE7wmvV9e9EaL65mFqg) — falls über Nacht zurück: Status-Check + Retrieve
- **Tonalität-Drift-Fix** (~33 invented Tonalitäten) — `fix-tonalitaet-drift.ts` ist gepusht, evtl. schon angewandt

Falls beide Fenster wieder parallel laufen: DB-Write-Koordination wie heute (anderes Fenster Bescheid geben bei Schreib-Skripten).

## Heute erledigt (Rückblick als Kontext)

- ✅ Source-Coherence-Vollauf (563 MdBs, 39 Konflikte → Verifier-Cascade-Empirie Llama vs. Haiku → 14 ECHT/14 PRAEZ/11 FP nach Opus-Manual + User-Recherche)
- ✅ 3 cv_homepage_json Auto-Korrekturen (Hardt, Merz, Behrens) + 2 Verdict-Revisionen (Nacke, Pantazis → PRAEZ)
- ✅ UI: Politiker-Detail-Banner + `/quellen-diskrepanzen` Drill-Down (beide Designs) + Landing-Block + Phase-7-Methodik-Seite
- ✅ Sonstiges-Cleanup-Pipeline: 1.421 Items inspiziert, 189 Drops (~13 %), 7 HTML-Fixes, 108 MdBs touched, $0.94 Cost
- ✅ cv_summary für 157 betroffene MdBs regeneriert
- ✅ 4 PoliticianCV Render-Bugs gefixt (Dedup, „—" für jahrlose, Punkt-vor-Zeitraum, jahrlose-zuerst)
- ✅ Methodik-Doku: Phase 7, 8, 9 + Executive Summary in `docs/methodology-evolution.md`
- ✅ Memory: `project_source_coherence.md`, `project_cv_hygiene_2026-05-06.md`, `feedback_session_workflow.md`, `project_specialist_cascade.md` extended
- ✅ Git: 7 Commits gepusht auf `master`
- ✅ R2: politik.db gepusht (198 MiB inkl. Reden-Pipeline-Daten aus anderem Fenster)
- ✅ Tooling installiert: rclone, gh CLI, gitleaks, cloudflared (alles in `~/bin` / `~/.local/bin`, kein sudo)

## Wichtige Files

| Datei | Zweck |
|---|---|
| `docs/methodology-evolution.md` | Hauptmethodik-Doku (Phase 0-9 + Executive Summary) |
| `docs/source-coherence-echt-fehler.md` | Reaktions-Plan für 14 echte Diskrepanzen |
| `final-verdicts-source-coherence.jsonl` | Ground Truth aller 39 Konflikte (Opus-Manual) |
| `llama-/haiku-verdicts-source-coherence.jsonl` | Vergleichs-Empirie für Methodik-Seite |
| `scripts/cleanup-sonstiges.ts` | 3-Stufen-Pipeline (HTML/Whitelist/Haiku) |
| `politik.db.snapshot-pre-cleanup-sonstiges-20260505-231913` | Rollback vor Sonstiges-Cleanup (lokal, nicht in R2) |
| `politik.db.snapshot-pre-resolutions-20260505-231911` | Rollback vor Source-Coherence-Resolutions |

## Mein Take

Wenn du Förder-Pitch-Mode willst: **Option 1 (Recall-Stichprobe)** schließt den letzten methodischen Soft-Spot.
Wenn du erstmal locker reinkommen willst: **erst Methodik-Seite prüfen + TODO durchgehen**, dann entscheidest du in der Stunde.

Schlaf gut.
