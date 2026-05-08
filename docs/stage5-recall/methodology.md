# Stage-5-Recall-Stichprobe — Methodik

**Stand:** 2026-05-08
**Ziel:** Schätzung des Recalls der Source-Coherence-Pipeline (Stage 5: `gpt-oss-120b` auf Groq).
**Förder-Pitch-Lücke:** Wir kennen Precision (~36% auf ECHT-Klasse), aber nicht Recall (wie viele echte Konflikte werden übersehen).

## Sampling

- **Population:** 528 MdBs, die Stage 5 als „kein Konflikt" markiert hat (`source_coherence_checked_at IS NOT NULL` AND `source_conflicts IS NULL OR '[]'`) UND die sowohl `cv_json` (Wikipedia) als auch `cv_homepage_json` (Homepage) haben.
- **Stichprobengröße:** n = 20.
- **Sampling-Methode:** deterministisch via Knuth-Multiplikativ-Hash:
  ```sql
  ORDER BY (id * 2654435761) % 4294967296
  LIMIT 20;
  ```
  Reproduzierbar, kein Seed-Drift. Keine Abhängigkeit von SQLite-RANDOM.

## Klassifikations-Schema (analog zu 39 geflaggten Konflikten)

| Verdict | Bedeutung |
|---------|-----------|
| **ECHT** | Substantieller Widerspruch zwischen Wikipedia und Homepage, der vom Faktencheck bestätigt wird. |
| **PRAEZISIERUNG** | Beide Quellen meinen dasselbe, eine ist genauer/aktueller (z.B. „Münster II" vs „Münster Süd"). |
| **FALSE_POSITIVE** | Keine echte Diskrepanz oder durch Lese-Artefakt der LLMs. |

## Recall-Berechnung

Sei n = 20 (Stichprobe), N = 528 (Population unflagged).
Sei k = Anzahl echter Konflikte in der Stichprobe.

- **Geschätzte False Negatives** (FN_total) = `k × N / n`
- **True Positives** (TP) = 5 ECHT-Konflikte (nach Mensch-Final-Check, Stand Memory `project_source_coherence`)
- **Recall** = `TP / (TP + FN_total)`

Beispiel: Wenn k=2 echte Konflikte in 20 Sample → FN_total ≈ 53 → Recall ≈ 5/(5+53) ≈ **8.6%** (sehr schlecht).
Wenn k=0 → FN_total = 0 → Recall = 100% (sehr gut, Pipeline fängt alles).

## Ablauf

1. Pro MdB: `cv_json` + `cv_homepage_json` strukturiert vergleichen.
2. Sektionen zum Prüfen:
   - **Bildung:** Schule, Studium, Abschlüsse, Jahre
   - **Beruf:** Stationen, Firmen, Funktionen, Zeiträume
   - **Politik:** Mandate, Ämter, Partei-Eintritt, Wahlkreis
   - **Sonstiges:** Mitgliedschaften, Auszeichnungen
3. Verdacht? → Faktencheck (Wikipedia, Homepage live).
4. Klassifikation in `findings.jsonl` mit `final_verdict` + `final_reason`.

## Validity-Check

- Stichprobe mag SPD-lastig wirken (7/20). Erwartete SPD-Quote in 528 = ~30%, gemessen 35% → leichter Drift, aber innerhalb 1σ bei n=20.
- Falls Recall <70%: Stage-5-Prompt verschärfen + Re-Run.
