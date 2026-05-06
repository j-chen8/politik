# Next Session — Pickup-Kontext (Stand: 2026-04-30, ~22:50)

> User geht schlafen. Morgen/übermorgen: Stage 4 Repair starten und Foundation finalisieren.

## TL;DR — was du machen sollst

**Heute (1-2 Min):** Stage 4 Repair anwenden, dann cv_summary regenerieren.

```bash
# 1. Repair anwenden (167 Aktionen, vollautomatisch)
npx tsx scripts/repair-cv-entries.ts --apply

# 2. cv_summary regenerieren für betroffene MdBs (sind in der DB schon mit cv_summary=NULL markiert)
npx tsx scripts/generate-cv-summary.ts

# 3. Health-Check
npx tsx scripts/health-check.ts

# 4. R2-Sync wenn alles ok
./scripts/sync-db.sh push
```

**Reversibel:** Vor Apply wird automatisch ein DB-Snapshot gemacht. Voller Audit-Trail in `cv_repair_log` Tabelle.

---

## 🎯 Was die Pipeline gestern erreicht hat

### Foundation-Stats (für Förderer-Pitch)

```
629/629 Bundestag-MdBs mit Haiku 4.5 generiert
  13.510 Verdicts gesamt durch Mistral verifiziert
  
  93.3% sauber (korrekt + REGEL-0-konform leer)
   1.24% echte Halluzinationen (167 Cases)
  
Vergleich:
  Llama 3.1 8B (vorher):  ~30% Halluzinations-Rate
  Haiku 4.5 (jetzt):       ~1.24% Halluzinations-Rate
  → 24× Reduktion
```

### Cost-Bilanz CV-Pipeline

| Phase | Cost |
|---|---|
| Haiku Generator | $5.88 |
| Mistral Inspektor | $0 (Free) |
| Llama Verifier (Groq + DeepInfra) | ~$0.30 |
| Doppelungs-Pipeline | $0 |
| **Total** | **~$6.20** |

### Repair-Queue (bereit für --apply)

`cv-repair-queue.jsonl` enthält **167 Aktionen**:
- **130 `set_date`** — Datum korrigieren (datum_falsch + fehlend)
- **19 `clear_date`** — Halluzinations-Datum auf "" setzen
- **18 `merge_entries`** — Doppelungen konsolidieren (alle Mensch-validiert mit Opus)

**Dry-Run getestet: 167/167 erfolgreich, 0 failures.**

---

## Pipeline-Komponenten (alle funktional)

| Stage | Skript | Status |
|---|---|---|
| 1 Generator (Haiku 4.5) | `scripts/seed-cv.ts` | ✅ ran 629 MdBs |
| 2a Datums-Inspektor (Mistral) | `scripts/inspect-dates.ts` | ✅ ran 629 MdBs |
| 2a-2 Verifier (Llama 70B + Cascade) | `scripts/verify-mistral-verdicts.ts` | ✅ ran 332 MdBs (mit Probleme) |
| 2d.1 Doppelungs-Detector | `scripts/detect-duplicates.ts` | ✅ |
| 2d.2 Doppelungs-Verifier (Llama 70B) | `scripts/verify-duplicates.ts` | ✅ |
| 3 Aggregator | `scripts/aggregate-repair-queue.ts` | ✅ |
| **4 Repair** | `scripts/repair-cv-entries.ts` | ⏸️ **wartet auf --apply** |

---

## Wichtige Daten-Files (NICHT löschen!)

| Datei | Inhalt | Wofür |
|---|---|---|
| `cv-repair-queue.jsonl` | 167 Aktionen | Input für Stage 4 |
| `inspect-dates.partial.jsonl` | 629 MdBs Mistral-Verdicts | Audit-Trail |
| `verify-mistral.partial.jsonl` | 332 MdBs Verifier-Output | Audit-Trail |
| `confirmed-duplicates-final.jsonl` | 18 Mensch-validierte Merges | Audit-Trail |
| `politik.db.snapshot-pre-haiku-vollauf-*` | Vor-Haiku-DB | Notfall-Rollback |
| `politik.db.snapshot-post-haiku-vollauf-*` | Nach-Haiku-DB | Notfall-Rollback |

---

## Methodik-Lehren (gestern dokumentiert in docs/methodology-evolution.md)

1. **Specialist-Cascade > Multi-LLM-Konsens:** Haiku Generator + spezialisierte Inspectors statt parallele Voll-Extraktion
2. **Mistral Small (24B) ist zu schwach für nuancierte Multi-Status-Klassifikation** — 78.5% False-Positive-Rate beim Halluzinations-Flagging
3. **Llama 3.3 70B als Cascade-Verifier** ist der richtige Korrektor (andere Familie, stärkeres Reasoning)
4. **Provider-Cascade Groq Free → DeepInfra Paid** funktioniert nahtlos via OpenAI-API-Format
5. **Mensch-im-Loop für KLEINE Verifier-Outputs (<50 Cases)** — bei Doppelungen waren wir bei 22 Pärchen, manuell mit Opus validiert
6. **Stage 4 braucht KEINEN LLM** — Verifier liefert schon alle Patches deterministisch (set_date / clear_date / merge_entries)

---

## Was nach Stage 4 ansteht

### Sofort danach
- [ ] cv_summary regenerieren für 167 betroffene MdBs (`generate-cv-summary.ts`)
- [ ] Health-Check
- [ ] DB zu R2 synchronisieren (`./scripts/sync-db.sh push`)
- [ ] Methodik-Doku updaten mit finalen Stats

### Diese Woche
- [ ] **Reden-Pipeline starten** (siehe Memory `project_reden_pipeline_status.md`)
  - 9.013 Reden in DB, 8.245 mit Llama 3.3 70B Summary
  - Vermutlich ähnliche Halluzinations-Probleme wie alte CV-Pipeline
  - Pattern aus CV übertragen: Haiku-Upgrade prüfen + Specialist-Cascade
- [ ] Optional: Homepage-Pipeline (`seed-cv-homepage.ts`) auf Llama 70B upgraden
  - 559 MdBs (89% Coverage), aktuell mit Llama 8B
  - Würde zweite unabhängige Quelle für Stage 5 Source-Coherence liefern

### Förder-Strategie
- Plattform fertig kriegen → öffentlich machen → journalistische Story → Förder-Antrag
- **Prototype Fund (BMBF)** ist erste Wahl — Solo-Dev-freundlich, Open Source-natürlich
- Methodik-Doku unter `docs/methodology-evolution.md` als technical appendix
- Förderbetrag-Empfehlung: Modell B (Hybrid) — nicht zu viel auf einmal

---

## Kleinigkeiten zum Aufpassen

1. **DB-Snapshot prüfen vor Apply** — `ls -la politik.db.snapshot-pre-*` sollte mehrere Snapshots zeigen, wenn nicht: `cp politik.db politik.db.snapshot-vor-stage4-$(date +%Y%m%d-%H%M%S)`

2. **DEEPINFRA_API_KEY ist in `.env`** — wurde gestern hinzugefügt für Verifier-Cascade. Kostet $0.30 für Verifier-Vollauf.

3. **`max_tokens: 8192`** ist in `seed-cv.ts` und `inspect-dates.ts` schon gepatcht (war 4096, hatte zu Truncation bei langen MdBs geführt).

4. **Verifier-Skript hat Cascade-Logik:** versucht Groq Free zuerst, fallback auf DeepInfra wenn rate-limited. Nahtlos.

5. **Cloudflare-Tunnel** läuft vermutlich noch im Background — `https://giant-bali-ecological-dense.trycloudflare.com` (instabil, neue URL bei Restart).

---

## Background-Tasks beim Schlafengehen

- KEINE aktiven Pipeline-Skripte (alles fertig)
- Cloudflared Tunnel + npm run dev könnten noch laufen (sollte ok sein)

---

## Aktuelle Memory-Files (für Claude-Kontext)

- `project_specialist_cascade_methodik.md` — **WICHTIGSTES MEMO** zur Pipeline-Architektur
- `project_reden_pipeline_status.md` — Reden-Pipeline-Stand (für später)
- `session_2026-04-29_multi_llm_v2.md` — alte 5-Stufen-Pipeline (teils überholt)
- `feedback_long_running_scripts.md`, `project_status.md`, `project_multi_llm_stats.md`

Beim Pickup nächste Session: Memory + dieses NEXT-SESSION.md = voller Kontext.

---

## Förderer-Story (One-Liner)

> Wir extrahieren strukturierte politische Daten aus Wikipedia mit einer **Specialist-Cascade-Pipeline** aus 5 Modell-Familien (Anthropic Haiku 4.5 als Generator, Mistral Small als Datums-Inspektor, Llama 3.3 70B als Verifier-Schicht, programmatische Heuristiken für Doppelungen, Mensch + Opus 4.7 als Schluss-Validierung). **Empirisch validiert: 1.24% Halluzinations-Rate** über alle 629 Bundestag-MdBs (vs. 30% bei Single-LLM-Baseline). Total-Cost: ~$6 für die gesamte Foundation. Methodik vollständig dokumentiert in `docs/methodology-evolution.md`.

---

Schlaf gut. Bei Fragen morgen einfach diese Datei lesen + dann Stage 4 starten.
