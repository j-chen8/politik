# Tonality-Slug-Cleanup in LLM-Prose (2026-05-26)

Nach dem globalen Rename `konfrontativ_belegend` → `konfrontativ_faktenrhetorisch` (Phase 1, Commit `a2cd8c1`) blieben **268 Rows** in zwei DBs übrig, deren LLM-generierte Freitext-Felder (Summaries + 2 rhetorische-Mittel-Arrays) noch den alten Slug als Prose enthielten. Die UI rendert diese Felder direkt → Inkonsistenz „Badge sagt _faktenrhetorisch_, Summary sagt _belegend_".

Da die Substitution rein **lexikalisch und synonymerhaltend** ist (gleiche Definition, nur Wortwahl), ist die retroaktive Umbenennung methodisch unkritisch — anders als eine inhaltliche Klassen-Umlabelung.

## Backup vor Lauf

```
cp politik.db politik.db.backup-2026-05-26-prerename-prose  # 1,29 GB
```

## Vier Varianten-Gruppen, getrennt repariert

| Variante | Pattern | Replace |
|---|---|---|
| 1. Kleinschrift mit Bindestrich | `konfrontativ-belegend*` (alle Endungen) | `konfrontativ-faktenrhetorisch*` |
| 2. Großschrift mit Bindestrich | `Konfrontativ-belegend*` | `Konfrontativ-faktenrhetorisch*` |
| 3. Großschrift Bindestrich + Großschrift Stamm | `Konfrontativ-Belegend*` | `Konfrontativ-Faktenrhetorisch*` |
| 4. Unterstrich-Form (LLM-Enum-Zitat) | `konfrontativ_belegend` / `Konfrontativ_belegend` | `konfrontativ_faktenrhetorisch` / `Konfrontativ_faktenrhetorisch` |

Alle als `REPLACE(col, pattern, ersatz)` in einer Transaktion pro Variante. Endungen (`-e`, `-er`, `-en`, `-em`, `-es`) bleiben automatisch erhalten, weil REPLACE nur den gemeinsamen Stamm trifft.

## Pre/Post-Counts

| Spalte | vorher | nachher |
|---|---:|---:|
| `speech_analyses_v2.zusammenfassung_2_saetze` | 64 | 0 |
| `speech_analyses_v2.rhetorische_mittel_json` | 1 | 0 |
| `speech_analyses_v2.framing_marker_json` | 0 | 0 |
| `berlin_speech_analyses.zusammenfassung_2_saetze` | 277 | 0 |
| `berlin_speech_analyses.rhetorische_mittel_json` | 1 | 0 |
| `berlin_speech_analyses.framing_marker_json` | 0 | 0 |
| **Summe** | **343** | **0** |

(Pre-counts erfassen alle 4 Varianten; die ursprünglichen Audit-Zahlen 62 + 1 für Bundestag und 101 + 1 für Berlin betrafen nur die Bindestrich-Variante.)

## FTS5-Status nach dem Lauf

- `speeches_fts` (Bundestag): synchron — der `_au`-Trigger `AFTER UPDATE OF zusammenfassung_2_saetze` hat die Index-Snippets korrekt refresht.
- `berlin_speeches_fts`: stale (268 Snippets enthalten noch alten Slug). Pre-existing Schema-Bug — der `berlin_speech_analyses_au`-Trigger watcht `OF zusammenfassung` statt `zusammenfassung_2_saetze` und feuert deshalb nie. **Aus diesem Lauf bewusst ausgeklammert** — Trigger-Fix gehört in die Landtag-Pipeline.

## Bewusst nicht angefasst

- `raw_tool_input_json` (LLM-Originaltool-Antworten) — Debug-Daten, nicht UI-sichtbar
- `scripts/fix-tonalitaet-drift.ts` (historischer Migrations-Skript)
- `docs/dev-log/2026-05-05-reden-pipeline.md` (historischer Dev-Log)

Diese referenzieren den alten Slug als historische Tatsache und dürfen das.

## Rollback

```
cp politik.db.backup-2026-05-26-prerename-prose politik.db
```

(Beide Server vorher stoppen, sonst DB-Lock-Bug.)
