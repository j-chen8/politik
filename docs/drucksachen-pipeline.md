# Drucksachen-Analyse-Pipeline

> Stand 2026-05-12. End-to-End-Doku der Drucksachen-Pipeline von DIP-Seed bis LLM-Analyse.

## Datenfluss-Übersicht

```
DIP API ──► activities (62.840 Rows, 100 % MdB-matched)
                  │
                  ├──► drucksache_nr-Liste (2.857 unique)
                  │
                  ▼
bundestag.de PDFs ──► data/drucksachen/*.pdf (5.184 Files, 1,8 GB)
                  │
                  ▼ (pdf-parse / PDFParse class API)
drucksache_texts ──► full_text + tokens_estimate + batch_class
                  │
                  ▼ (typ-spezifische Caps + Prompts + Caching)
Anthropic Batch API ──► drucksache_analyses
                          (zusammenfassung, kerninhalt, thema, tonalitaet, ...)
```

## Tabellen

### `activities` (DIP-Seed-Output)

- 62.840 Rows, 100 % politician_id-matched (nach allen Bug-Fixes)
- Eine Row je Person × Drucksache (Mitzeichner-Liste vollständig)
- Felder: aktivitaetsart, dokumentart, drucksache_nr, vorgangstyp, pdf_url, urheber, herausgeber

### `drucksache_texts`

| Spalte | Zweck |
|---|---|
| `drucksache_nr` (PK) | z.B. "21/40" |
| `pdf_filename` | z.B. "2100040.pdf" |
| `pdf_bytes`, `pages` | Datei-Metadaten |
| `chars`, `tokens_estimate` | Volltext-Größe (3,5 chars/token Heuristik) |
| `full_text` | Vollständiger Plaintext aus PDF (für Re-Runs gecached) |
| `parser` | "pdf-parse" |
| `parse_error` | NULL bei Erfolg, sonst Fehlertext |
| `batch_class` | klein/mittel/gross/antwort/regierung/administrativ/skip |
| `parsed_at` | ISO-Timestamp |

5.184 / 5.184 Rows, 0 parse_error.

### `drucksache_analyses`

| Spalte | Zweck |
|---|---|
| `drucksache_nr` (PK, FK) | Verknüpfung mit drucksache_texts |
| `batch_class` | Kopie für Filterung |
| `zusammenfassung` | 2–5 Sätze, ≤80 Wörter |
| `kerninhalt` | JSON-Array von Bullet-Punkten |
| `thema` | Komma-getrennte Topic-Tags aus TOPIC_TAGS |
| `tonalitaet` | Enum je Klasse |
| `betroffene_gruppen`, `fraktion` | Optional |
| `regelung`, `begruendung`, `auswirkung` | Nur für `gross` (Gesetze) |
| `dokumenttyp` | Nur für `regierung` |
| `label` | Nur für `administrativ` (Regex-Output) |
| `topic_drift_audit` | JSON-Array von LLM-Tags außerhalb Enum |
| `analyze_error` | NULL bei Erfolg |
| `model`, `prompt_version`, `generated_at`, `raw_llm_response` | Audit-Trail |

### `drucksache_batch_runs`

Bookkeeping von Anthropic-Batch-Submits: batch_id / submitted_at / request_count / classes / status / completed_at.

## Batch-Klassen-Mapping

| Klasse | aktivitaetsart-Quellen | Cap | Prompt-Fokus | Σ Tokens |
|---|---|---|---|---|
| **klein** | Kleine Anfrage, Antrag, Entschließungs-/Änderungsantrag | 6K | „Was wird gefordert/gefragt?" | 6,40 M |
| **mittel** | Berichterstattung, Bericht, Unterrichtung | 16K | „Zentrale Befunde/Empfehlungen" | 4,02 M |
| **gross** | Gesetzentwurf, Große Anfrage | 32K | „Regelung + Begründung + Auswirkung" | 5,34 M |
| **antwort** | Frage / Antwort BReg | 32K | „Was gefragt + wie geantwortet (substantiell/ausweichend)" | 11,89 M |
| **regierung** | Sonstige Reg-DS ohne MdB-Activity | 16K | Generisch + `dokumenttyp`-Output | 0,20 M |
| **administrativ** | Wahlvorschläge, Sammelübersichten, Beschlussempfehlungen | – | Regex-Label (kein LLM) | 0,26 M |
| **skip** | Reden (schon in `speech_analyses_v2`) | – | überspringen | – |

Klassifikations-Logik in `scripts/classify-drucksachen.ts`:
1. Vorrang `activities.aktivitaetsart` bei `dokumentart='Drucksache'`
2. Konflikt-Regel: `gross > mittel > antwort > klein > administrativ > regierung > skip`
3. Fallback PDF-Header-Regex bei reinen Reg-DS

## Prompt-Architektur

`src/lib/drucksachen-prompts.ts` exportiert pro Klasse:

```ts
{
  instruction: string,  // klassenspezifische User-Anweisung
  tool: ToolDefinition, // Anthropic Tool-Schema mit Enum-Constraints
  cap: number,          // Token-Cap für truncate
}
```

Gemeinsam: `SYSTEM_PROMPT_HEADER` (Neutralitäts-Regeln, Längen-Limits) und `TOPIC_TAGS` (40 Tags inkl. Verbraucherschutz, Datenschutz, Extremismus, Forschung — erweitert nach Test-Drift).

Beide werden mit `cache_control: ephemeral` markiert → Caching im Batch.

## Operations-Modi

### Standard-Run (idempotent)

```bash
npx tsx scripts/run-drucksachen-batch.ts          # Vorschau (n_todos, Kosten)
npx tsx scripts/run-drucksachen-batch.ts --submit # Echter Submit
npx tsx scripts/run-drucksachen-batch.ts --poll <batch_id>  # Status + Ingest
```

Idempotenz: DS mit `prompt_version='v1' AND raw_llm_response IS NOT NULL` werden übersprungen.

### Resume

```bash
npx tsx scripts/run-drucksachen-batch.ts --resume  # nimmt jüngsten offenen Batch
```

### Klassen-Filter

```bash
npx tsx scripts/run-drucksachen-batch.ts --submit --classes gross,antwort
```

### Re-Run bei Prompt-Änderung

1. Prompt-Version in `drucksachen-prompts.ts` hochzählen (z.B. `v1` → `v2`)
2. Skript neu starten — alle DS landen wieder in todos (weil `prompt_version='v2'` noch nirgends in DB)
3. Alternativ: gezielte Re-Runs für Klassen mit schlechter Qualität

## Bekannte Limitationen

1. **Topic-Drift** — Tool-Use Enum ist nicht 100 % strikt. Drift wird in `topic_drift_audit` festgehalten, Tags in „Sonstiges" gemappt. Periodisch reviewen, ggf. häufige Drift-Tags in Enum aufnehmen.
2. **Truncate-Verluste bei 83 PDFs > 100K Tokens** — Anlagen-Daten in Berichten werden gekappt. Zusammenfassung okay, „Anlage 3 sagt X" nicht aufdeckbar.
3. **`regierung`-Klasse heterogen** — Fragestunde, BReg-Verordnung, EU-Vorlage in derselben Klasse. `dokumenttyp`-Output differenziert sie nachträglich.
4. **`thema` ≠ formelle Topic-Klassifikation** — die LLM-Tags hier sind ad-hoc, separates Track „Topic-Klassifikation" laut Memo noch in Design-Phase (`docs/topic-classification-design-questions.md`).

## Kosten-Tracking

| Run | Datum | Klassen | n | Modell | Geschätzt | Tatsächlich |
|---|---|---|---|---|---|---|
| Test | 2026-05-12 | alle (2 je Klasse) | 10 | Haiku 4.5 (Live) | – | ~$0,02 |
| Voll | 2026-05-12 | alle ohne admin/skip | 4.813 | Haiku 4.5 (Batch + Caching) | ~$11,35 | nach Ingest in `drucksache_batch_runs` |
