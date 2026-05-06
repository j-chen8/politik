# Next Session — Bias-Korrektur Re-Batch (Stand 2026-05-05 ~18:35 UTC)

> **Anthropic-Batch läuft.** 400 Reden, ~$1.90 Cost, max 24h Wartezeit.
> `msgbatch_019gryE7wmvV9e9EaL65mFqg`

## ⚡ TL;DR — beim Zurückkommen

```bash
# 1. Status checken (kostet nichts)
npx tsx scripts/batch-retrieve-corrections.ts

# 2. Wenn alle "ended": apply
npx tsx scripts/batch-retrieve-corrections.ts --apply

# 3. Auswertung + Markdown-Review-File generieren
npx tsx scripts/analyze-corrections.ts

# 4. bias-corrections-review.md durchgehen — manueller Review
#    der niedrig-konfidenten + wortliste-flagged Reden
```

## Was passiert ist

### Bias-Audit-Pipeline durchgezogen
- **Schicht 1 statistisch:** 222 Reden mit wertenden Verben gefunden
- **Manueller Spot-Check 15 + 120 Reden:** ~62% echter Bias bestätigt
- **Broader Sample 60 Reden ohne wertende Verben:** Zusätzliche Patterns gefunden (Meta-Kommentare, Distanz-Markierungen, Frame-Annotation)
- **Llama 3.1 8B Auto-Klassifikation auf 425 Tier-A-Treffer:** 400 als LLM-Editorialisierung markiert (94%)

### v2.1 Methodology
- H10 hinzugefügt: explizite Selbst-Reflexion gegen wertende Wörter
- Schema-Feld `neutralitaets_self_check` mit Konfidenz + Liste eigener Wörter
- Backward-kompatibel mit v2 (alle anderen Felder unverändert)

### Re-Batch submitted
- 400 NEIN-Reden via Anthropic Batch API mit v2.1-Methodology
- Cost: $1.90 (geschätzt, real bei Retrieve)
- State: `.batch-state-corrections.json`

## Architektur

- Original-v2-Daten **bleiben unangetastet** in `speech_analyses_v2`
- Korrekturen landen in **neuer Tabelle** `speech_analyses_v2_corrections`
- Vorher/Nachher-Vergleich für Förder-Antrag-Material
- Kein Risiko verlorener Daten

## Nach Apply — Auswertungs-Logik

`scripts/analyze-corrections.ts` filtert nach 2 unabhängigen Kriterien für manuellen Review:

1. **Subjektiv:** Haikus Self-Check `konfidenz` ≠ "hoch"
2. **Objektiv:** Tier-A-Wort (skandalisier*, polemisier*, diffamier*, denunzier*, verdamm*, fabulier*, Heuchelei, Doppelmoral, Stimmungsmache, Abgesang) immer noch in v2.1-Summary

Reden mit **mindestens einem Treffer** landen im Review-Markdown. Erwartet: ~30-100 Reden.

## Was zu lesen ist

- `docs/reden-methodology.md` — Sektion 6 hat den Audit-Stand
- `docs/summarization-methodology.md` — v2.1 mit H10
- `bias-classify-tier-a-only.jsonl` — Llama-Klassifikation der 425
- `bias-audit-layer1-2026-05-05.log` — Schicht-1-Stats

## Wichtige Files

| Datei | Zweck |
|---|---|
| `.batch-state-corrections.json` | Batch-State, persistent |
| `scripts/batch-resubmit-bias-corrections.ts` | Submit (bereits gelaufen) |
| `scripts/batch-retrieve-corrections.ts` | Retrieve — DAS SKRIPT FÜR MORGEN |
| `scripts/analyze-corrections.ts` | Auswertung + Review-Markdown-Generator |
| `bias-audit-tier-a-only.jsonl` | Llama-Audit-Resultate (Source der 400) |

## Kein Hexenwerk

Wir haben den methodisch saubersten Pfad gewählt:
- Selber Generator (Haiku 4.5), aber neutralisierte Methodology
- Self-Check als zusätzliche Schicht
- Externe Wortliste als unabhängige Validierung
- Originale bleiben für Audit erhalten
- Manuellen Review nur dort wo eine der zwei Validierungen anschlägt
