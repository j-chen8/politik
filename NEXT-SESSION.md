# Next Session — Pickup-Kontext (Stand: 2026-05-06)

> Sitzung 76 (06.05.2026) sollte stattgefunden haben — XMLs holen, Reden extrahieren, mit v2.1-Methodology batchen.
>
> **Letzter Stand:** Reden-Pipeline live (9.913 Reden), Bias-Audit komplett, UI-Integration in beiden Designs (Standard + Linear). Tag-Log: `docs/dev-log/2026-05-05-reden-pipeline.md`.
>
> 🪟 **Zweites Fenster (CV-/Source-Coherence-Track):** wenn du parallel das zweite Fenster aufmachst, dort `NEXT-SESSION-pickup-2026-05-06.md` lesen. Dort steht der CV-Pickup-Plan (Methodik-Seite verifizieren, Stage-5-Recall-Stichprobe, PRAEZ-Toggle, …). Beide Tracks teilen sich `politik.db` — Koordinations-Regeln bei DB-Writes (Bescheid geben, dann erst schreiben) wie gestern.

## ⚡ TL;DR — Sitzung 76 nachziehen

```bash
# 1. Plenar-XMLs holen (idempotent, holt nur neue)
npx tsx scripts/fetch-plenar-xmls.ts

# 2. Reden aus den neuen XMLs extrahieren
npx tsx scripts/extract-all-speeches.ts

# 3. Cost-Schätzung + Pre-Flight (kostet nichts)
npx tsx scripts/batch-submit-reden.ts

# 4. Wenn alles plausibel: submitten (kostet ~$0.50 für ~150 neue Reden)
#    Wichtig: vorher .batch-state.json sichern oder löschen, sonst Abbruch
mv .batch-state.json .batch-state.json.alt-vollauf
npx tsx scripts/batch-submit-reden.ts --confirm

# 5. Status checken (1-24h Wartezeit)
npx tsx scripts/batch-retrieve-reden.ts

# 6. Wenn ended: apply
npx tsx scripts/batch-retrieve-reden.ts --apply
```

## Wichtig vor dem Submit

**Methodology-Version-Check:** Das `batch-submit-reden.ts`-Skript liest `docs/summarization-methodology.md` ein. Stelle sicher, dass das die **v2.1-Datei** ist (mit H10 + `neutralitaets_self_check`). Falls aus Versehen v2 noch aktiv: `git log docs/summarization-methodology.md` prüfen.

**Tool-Schema-Check:** `batch-submit-reden.ts` hat das `REDEN_SUMMARY_TOOL` mit Schema. Aktuell hat das Schema **nicht** das `neutralitaets_self_check`-Feld als Pflicht (das war nur in `batch-resubmit-bias-corrections.ts` für die Bias-Korrektur). Für Sitzung 76 entweder:
- (a) altes Schema lassen (kein Self-Check, aber funktional v2.1 wenn Methodology eingelesen wird)
- (b) Schema um `neutralitaets_self_check` erweitern (sauberer, konsistent mit Bias-Korrektur)

→ Empfehlung: **(b)** — kopiere die Schema-Erweiterung aus `batch-resubmit-bias-corrections.ts` in `batch-submit-reden.ts`. Plus: ergänze `methodology_version: "v2.1"` im State-File.

## Erweiterte Wortliste (für nächsten Bias-Audit)

Wenn Sitzung 76 einlangt, für den nächsten Audit-Pass die Wortliste in `scripts/bias-audit-tier-a-only.ts` erweitern um:

```typescript
// Synonyme zu Tier-A (aus C+D-Stichprobe 2026-05-05)
'Hypocrisy', 'Hypokrisie', 'Hypocrite', 'hypokritisch',
'Scheinheiligkeit', 'Pharisäertum',

// Pattern B (Meta-Kommentare — heuristisch)
'implizite Anklage von', 'rahmt als', 'Sein Frame ist',
'Botschaft ist', 'Pointe ist', 'Strategie ...',
```

## Längerfristig offen

**Reden-Track:**
- [ ] Topic-Klassifikation als zweite Layer (Multi-Label, partei-neutral)
- [ ] Killer-Feature: Synopse Aussage-vs-Vote pro MdB
- [ ] Externe Validierung durch Politikwissenschaftler/Journalist (10-20 Reden blind)

**CV-Track:**
- [ ] 2 cv_summary failures vom 05.05. nachziehen (sehr klein)
- [ ] 1 Stage 4 Edge-Case (Index out of bounds) reparieren

**Source-Coherence:**
- [ ] Resume falls noch nicht durch (Quota-Reset war 02.05.)

**UI:**
- [ ] Optional: Politiker-Profil-Seite Bio-V2 (siehe TODO.md, abhängig von Topic-Klassifikation)

## Wichtige Dateien

| Datei | Zweck |
|---|---|
| `docs/dev-log/2026-05-05-reden-pipeline.md` | Vollständiges Session-Log (9 Phasen + Bugs + Lessons) |
| `docs/reden-methodology.md` | Reden-Pipeline-Methodik + Audit-Pipeline + Restrisiken |
| `docs/summarization-methodology.md` | Prompt-Asset v2.1 (mit H10 + Self-Check) |
| `.batch-state.json` | State des LIVE-Batches (vom 01.05., abgeschlossen) — vor neuem Submit umbenennen |
| `.batch-state-corrections.json` | State des Bias-Korrektur-Batches (vom 05.05., abgeschlossen) |

## Memory-Pointer

- `project_reden_pipeline` — Reden-Pipeline-Stand
- `project_bias_correction_re_batch` — Bias-Audit-Endbilanz mit Restrisiken
- `feedback_neutralitaet` — Neutralitäts-Kernprinzip
- `project_specialist_cascade` — Pipeline-Architektur-Pattern (mit Verifier-Modell-Wahl-Lehren)

## Was nicht mehr aktiv

- `NEXT-SESSION-bias-corrections.md` — alle Schritte erledigt, kann ignoriert/gelöscht werden
- `NEXT-SESSION-cv-pipeline.md` — Stage 4 Repair durch (166/167 ok)
- `NEXT-SESSION-source-coherence.md` — abhängig vom anderen Fenster
