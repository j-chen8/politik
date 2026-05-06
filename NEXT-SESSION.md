# Next Session — Pickup-Kontext (Stand: 2026-05-01 ~14:30)

> **Reden-Batch ist live bei Anthropic.** Asynchron, max 24h Laufzeit.
> Erste Aktion morgen: Status-Check, dann Retrieve.

## ⚡ TL;DR — was zuerst zu tun ist

```bash
# 1. Status checken (sicher, kostet nichts)
npx tsx scripts/batch-retrieve-reden.ts

# 2. Wenn alle Batches "ended": Resultate in DB schreiben
npx tsx scripts/batch-retrieve-reden.ts --apply

# 3. Wenn noch "in_progress": einfach später nochmal aufrufen
```

Wenn beim Status-Check unerwartete Errors stehen (z.B. `errored` > 0), zuerst die Fehlermeldungen ansehen bevor `--apply`. Bei Bedarf Retry-Pfad fahren statt blind anwenden.

---

## 🎯 Was heute (2026-05-01) gelaufen ist

### Smoke-Test Phase (Vormittag)

**Test 1 — Methodology-Validation auf 20 Reden:**
- Smart-Haiku-Cascade gegen 20 stratifizierte Reden (9 Reality-Check + 11 nach Partei)
- 17/20 erfolgreich, 91.3 % Quote-Validation
- Alle 4 PRIO-1-Erfolgskriterien erfüllt: Bloch H1 ✓, Kleinschmidt H2 ✓, Hardt H4 (9 Forderungen) ✓, Reden-Typ-Klassifikation ✓
- Cost: $0.19

**Test 2 — Stabilität invented Tonalitäten (Cluster-Analyse):**
- 10 zusätzliche Reden gezielt gewichtet auf „sachliche" Klassen
- Kernergebnis: invented Modifier sind NICHT stabil — 6 verschiedene `sachlich_X` / `konfrontativ_X` über 30 Reden, 3 erstmals im Extension-Run aufgetaucht
- → Enum-Erweiterung wäre Whack-a-Mole. Lösung: Tool-Use mit hartem Enum erzwingen.
- Cost: $0.09

**Test 3 — Engineering-Fix-Validation auf 10 Problem-Reden:**
- Tool-Use mit ASCII-Keys (`tonalitaet`, `woertliche_zitate`) + Mapping zurück auf deutsche Keys
- Tool-Use mit `tool_choice: {type: "tool", name: ...}` + JSON-Schema-Enum-Validierung
- 10/10 erfolgreich (vorher 7/10), 0 erfundene Tonalitäten, 0 JSON-Failures
- Cost: $0.11

**Smoke-Test-Total: $0.39 / 40 Reden, alle Kernfragen beantwortet.**

### Submit Phase (frühe Nachmittag)

**`scripts/batch-submit-reden.ts` gebaut + ausgeführt:**
- Filter: `original_text >= 200 Zeichen` → 9.913 von 10.053 Reden
- Identische Tool-Schema + Methodology-System-Prompt wie im Smoke-Test
- Anthropic-Limit: 256 MB pro Batch → automatisch in 2 Sub-Batches gesplittet:
  - `msgbatch_014Sgrh6ocBNF1VeEHS21ZGi` (5.916 Reden, 210 MB)
  - `msgbatch_01YSdWFdMs5gWvcKRLhfsM3A` (3.997 Reden, 139 MB)
- Beide submitted, Status `in_progress`
- batch_ids + Metadaten persistiert in `.batch-state.json`
- Cost-Estimate Batch-API: **~$42** (Live-Rate wäre $84)

### Retrieve Phase (heute Nachmittag — Skript fertig)

**`scripts/batch-retrieve-reden.ts` gebaut, noch nicht ausgeführt:**
- Liest `.batch-state.json`, zeigt Status pro Sub-Batch
- Mit `--apply`: holt alle Resultate, validiert Quotes per Substring, schreibt in neue Tabelle `speech_analyses_v2`
- UPSERT-Logik via `ON CONFLICT (rede_id, segment_index) DO UPDATE`, also re-applyable

**Schema `speech_analyses_v2`** (wird beim ersten `--apply` erstellt):
- Identifikation: `rede_id`, `segment_index`, `speech_id` (FK)
- Inhalt: `reden_typ`, `tonalitaet`, `zusammenfassung_2_saetze`
- Strukturiert als JSON: `forderungen_json`, `woertliche_zitate_json`, `framing_marker_json`, `rhetorische_mittel_json`, `konkrete_zahlen_json`, `anti_hallucination_flags_json`
- Validation: `quote_valid_count`, `quote_total_count`
- Audit: `raw_tool_input_json`, `model`, `methodology_sha`, `batch_id`, Token-Counts (input/cache_read/cache_write/output), `stop_reason`, `error_type`/`error_message`
- UNIQUE (rede_id, segment_index)

---

## 📋 Tomorrow Workflow

### Phase 1: Retrieve (5–15 Min)

```bash
npx tsx scripts/batch-retrieve-reden.ts
# erwartete Ausgabe wenn fertig:
#   [1/2] msgbatch_014Sgrh6ocBNF1VeEHS21ZGi · ended · 0/5916/0/0/0
#   [2/2] msgbatch_01YSdWFdMs5gWvcKRLhfsM3A · ended · 0/3997/0/0/0
#   Alle Batches ended.

npx tsx scripts/batch-retrieve-reden.ts --apply
# erwartete Ausgabe: 9.700+ ok / wenige errors / tatsächliche Cost ausgegeben
```

### Phase 2: Sanity-Check (15 Min)

```bash
# Tonalität-Verteilung — sollten nur die 11 Enum-Werte sein
sqlite3 politik.db "SELECT tonalitaet, COUNT(*) FROM speech_analyses_v2 GROUP BY tonalitaet ORDER BY 2 DESC;"

# Reden-Typ-Verteilung
sqlite3 politik.db "SELECT reden_typ, COUNT(*) FROM speech_analyses_v2 GROUP BY reden_typ ORDER BY 2 DESC LIMIT 20;"

# Quote-Validation-Stats global
sqlite3 politik.db "SELECT SUM(quote_valid_count), SUM(quote_total_count), 1.0*SUM(quote_valid_count)/SUM(quote_total_count) AS pct_valid FROM speech_analyses_v2;"

# Errors (bei 9913 erwarten wir ~10–50 als Worst Case)
sqlite3 politik.db "SELECT error_type, COUNT(*) FROM speech_analyses_v2 WHERE error_type IS NOT NULL GROUP BY error_type;"

# Spot-Check 5 zufällige Reden gegen Original
sqlite3 politik.db "SELECT rede_id, reden_typ, tonalitaet, zusammenfassung_2_saetze FROM speech_analyses_v2 ORDER BY RANDOM() LIMIT 5;"
```

### Phase 3: Inspector / Cascade-Layer (offen)

Nach erfolgreichem Apply ist die Frage: brauchen wir einen Halluzinations-Inspektor (Mistral / Nemotron-Nano) auf die Outputs? Smoke-Test zeigte 91 % Quote-Validation — wenn das im Vollauf hält, ist der Inspector erstmal optional. Erst Stats anschauen, dann entscheiden.

---

## 🔧 Open Architecture Decisions (für nach Retrieve)

1. **Inspector-Pass nötig?** Bei <85 % Quote-Validation oder >5 % Errors: Mistral / Nemotron-Nano über die Resultate jagen für Confidence-Flags. Bei guten Stats: skippen, direkt zum Killer-Feature.
2. **Sonnet-Fallback für Errors?** Wenn die ~30–100 Errors einer Klasse zuordenbar sind (z.B. besonders lange Reden): gezielter Sonnet-Lauf nur für diese (geschätzt $5–15).
3. **Topic-Klassifikation als nächste Layer:** Multi-Label (Innen/Außen/Wirtschaft/Soziales/Umwelt/etc.) — separater Llama-4-Scout-Pass ODER in nächster Methodology-Iteration mit Haiku.
4. **Synopse Aussage-vs-Vote (das Killer-Feature):** sobald `speech_analyses_v2` + Vote-Daten beide vorliegen, neutral-darstellbarer Vergleich pro MdB.

---

## 📂 Wichtige Dateien (für Pickup)

| Datei | Zweck |
|---|---|
| **`.batch-state.json`** | Persistente batch_ids + Methodology-SHA + Cost-Estimate |
| `scripts/batch-submit-reden.ts` | Submit-Skript (bereits ausgeführt, NICHT erneut ausführen ohne State-Reset) |
| **`scripts/batch-retrieve-reden.ts`** | Retrieve-Skript — DAS Skript für morgen |
| `scripts/smoketest-smart-haiku.ts` | Smoke-Test (3 Modi via `SMOKETEST_MODE`: leer/`extension`/`problem`) |
| **`docs/summarization-methodology.md`** | Der eigentliche Prompt-Asset, gecached pro Batch-Request |
| `docs/plan-haiku-opus-cascade.md` | Architektur-Plan |
| `smoketest-haiku-report.md` | 20-Reden Hauptlauf-Output |
| `smoketest-extension-report.md` | 10-Reden Extension-Output (Cluster-Analyse) |
| `smoketest-problem-report.md` | 10-Reden Fix-Validation |
| `haiku-calibration-report.md` | Original-Kalibrierung Llama-vs-Haiku 30.04. |
| `reden-reality-check-report.md` | Phase-1 Reality-Check (Bollmann-Bug-Detection) |

---

## 💡 Hinweise / Caveats

- **Anthropic Push-Notification gibt's nicht** — Batch-Fertigstellung kommt nicht aktiv rein, du musst proaktiv `retrieve` aufrufen.
- **Cache-TTL Standard 5m** — sollte bei Anthropics Batch-Verarbeitung in Bursts trotzdem hohe Cache-Hit-Rate ergeben. Falls Cache-Read deutlich unter 90 % liegt, beim nächsten Batch `ttl: "1h"` mit beta-header `extended-cache-ttl-2025-04-11` setzen.
- **Tatsächliche Cost** wird im Retrieve-Output ausgegeben (basiert auf realen Token-Counts statt Schätzung). Wenn deutlich anders als $42 → in `.batch-state.json` notieren für Förderer-Transparenz.
- **Externe Validierung** vor Förder-Antrag: 5–10 schwierige Reden blind durch Politikwissenschaftler / Journalisten bewerten — Opus-Bias-Risiko ist real.
- **Nächste BT-Sitzung:** Sitzung 76 am 06.05.2026 — danach `fetch-plenar-xmls.ts` + `extract-all-speeches.ts` re-runnen, neue Reden via Retrieve-Skript-Logik in dasselbe Schema schreiben.

---

## 🔄 Falls Batch fehlschlägt

Wenn der Status `expired` oder viele `errored` enthält:
1. **Nicht panik** — `.batch-state.json` ist da, Resultate (auch teilweise) können gezogen werden
2. `npx tsx scripts/batch-retrieve-reden.ts --apply` schreibt erfolgreiche Reden trotzdem in DB, fehlerhafte als `error_type`-Zeilen
3. Fehlerhafte gezielt re-submitten via separat anzupassendem Skript (Pattern: nur die error-rede_ids als TEST_REDE_IDS in smoketest-Modus)

---

## 🔗 Memory-Pointer

- `~/.claude/projects/-home-jk-politik/memory/project_reden_pipeline_status.md` — Reden-Pipeline Stand 2026-05-01 mit voller Cluster-Analyse
- `~/.claude/projects/-home-jk-politik/memory/project_specialist_cascade_methodik.md` — Specialist-Cascade-Pattern, Modell-Wahl-Richtlinien
- `NEXT-SESSION-cv-pipeline.md` — CV-Pipeline-Reste (167 Repair-Aktionen warten auf `--apply`, separater Track)

---

Schlaf gut. Morgen einfach diese Datei lesen + Retrieve-Skript starten.
