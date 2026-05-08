# Stage-5-Recall-Stichprobe — Pre-Verification Report

**Stand:** 2026-05-08
**Sample-Datei:** `sample-2026-05-08.jsonl`
**Findings-Datei:** `findings-2026-05-08.jsonl`

## Sample-Stats

- **Stichprobe (n):** 20 MdBs
- **Davon ausgeschlossen (`cv_homepage_json` leer):** 2 (Christian Wirth AfD, Matthias Mieves SPD)
- **Effektive Sample-Größe (n_eff):** 18

### Parteien-Verteilung (Sample)

| Partei | Anzahl | Anteil |
|---|---|---|
| SPD | 7 | 35% |
| CDU | 3 | 15% |
| CSU | 2 | 10% |
| Grüne | 3 | 15% |
| AfD | 3 | 15% |
| Linke | 2 | 10% |

## Findings-Übersicht

### Kein Konflikt (12/18)

Schmid, Piechotta, A. Hoffmann, I. Hahn, Detzer, van Aken, Connemann, Salihović, Blankenburg, Möller, Schieske, Stegner.

Davon **5 mit dünner Homepage** (van Aken, Blankenburg, Möller, Schmid, Schieske): nur Mini-Bios, eingeschränkter Vergleich möglich aber keine Widersprüche entdeckt.

### Konflikt-Kandidaten (6/18) — VERIFIKATION NÖTIG

| MdB | Stärke | Kern-Diskrepanz |
|---|---|---|
| **Claudia Moll (SPD)** | POTENTIAL_ECHT | AfA-Stellv.-Vorsitz: Wiki „seit 2013" vs Homepage „seit 2015". Plus Wiki schreibt „Arbeitsgemeinschaft für Arbeit" (statt „für Arbeitnehmerfragen"). |
| **Armand Zorn (SPD)** | POTENTIAL_ECHT | GIZ-Projektleiter: Wiki „**bis** 2021" vs Homepage „**seit** 2021" — direkter Zeit-Widerspruch bei identischer Beschreibung. |
| **Markus Reichel (CDU)** | POTENTIAL_ECHT | Geschäftsführer eigenes Unternehmen: Wiki „1999-2021" (beendet) vs Homepage „seit 1999" (laufend). |
| **Florian Hahn (CSU)** | WEAK_ECHT | Landesgeschäftsführer-Funktion: Wiki impliziert CSU, Homepage spezifiziert „der Jungen Union Bayern". Möglicherweise Wiki-Bündelung-Fehler. |
| **Claudia Roth (Grüne)** | WEAK_ECHT | Bundesvorsitz: Wiki „2001-2002" + „2004-2013" (mit Lücke) vs Homepage „2001-2013" (durchgängig). Bei strenger Lesart wäre Homepage falsch. |
| **Florian Oest (CDU)** | WEAK_ECHT | Ministeriums-Bezeichnung: Wiki „Landesentwicklung", Homepage „Regionalentwicklung". Sachsen hat offiziell „Regionalentwicklung" — Wiki möglicherweise falsch. |

## Recall-Berechnung (vor Verifikation)

Sei k = Anzahl bestätigter ECHT-Konflikte nach Verifikation.

- N_eff (geschätzt): 528 × (18/20) = ~475 unflagged MdBs mit vergleichbarem Homepage-Content
- True Positives Stage 5 = 5 (Memory `project_source_coherence`)
- FN_total = k × (N_eff / n_eff) = k × 26.4

| Szenario | k (verified ECHT) | FN_total | Recall |
|---|---|---|---|
| Best Case | 0 | 0 | **100%** |
| Optimistisch | 1 | ~26 | **~16%** |
| Realistisch | 2 | ~53 | **~9%** |
| Pessimistisch | 4 | ~106 | **~5%** |
| Worst Case | 6 | ~158 | **~3%** |

**Empirie aus Mensch-Final-Check der ursprünglichen 14 ECHT-Flags:** 64% wurden zu FALSE_POSITIVE revidiert. Bei symmetrischer Anwendung dieser Rate auf die 6 Kandidaten: ~2 würden bestätigt → Realistisches Szenario, **Recall ~9%**.

## Methodik-Caveats

1. **Empty-Homepage-Bias:** 2/20 (10%) hatten effektiv keine Homepage-Daten. Bei Hochrechnung müsste N_eff entsprechend angepasst werden.
2. **Thin-Homepage-Bias:** Weitere 5/18 hatten sehr dünne Homepage-Daten. „Kein Konflikt detektierbar" ≠ „kein Konflikt vorhanden". Ein gründlicherer Recall-Test bräuchte Homepage-Live-Check (Browser, nicht nur LLM-Extraktion).
3. **PRAEZ-vs-ECHT-Schwelle:** subjektiv. Die 6 Kandidaten sind absichtlich groß gefasst, um nichts zu übersehen. Verifikation wird einige zu PRAEZ oder FALSE_POSITIVE klassifizieren.
4. **Stichprobenfehler:** bei n=18 ist der 95%-CI auf den Recall-Schätzwert breit (Faktor ~2-3).

## Nächste Schritte

1. **User-Verifikation der 6 Kandidaten** (analog zur Mensch-Final-Check-Methode bei den ursprünglichen 14 ECHT-Flags):
   - Wikipedia + Homepage live prüfen
   - Klassifikation in ECHT / PRAEZ / FALSE_POSITIVE
   - Reasonable: ~30-60 Min
2. Recall berechnen mit verifizierten Zahlen.
3. Falls Recall <70%: Stage-5-Prompt-Schärfung erwägen (siehe `NEXT-SESSION-pickup-2026-05-06.md` Option 1).
4. Findings in Methodik-Doku einbauen für Förder-Pitch-Transparenz.

## Reproduzierbarkeit

Sampling-SQL:
```sql
SELECT id, first_name, last_name FROM politicians
WHERE source_coherence_checked_at IS NOT NULL
  AND (source_conflicts IS NULL OR source_conflicts = '[]')
  AND cv_json IS NOT NULL
  AND cv_homepage_json IS NOT NULL
ORDER BY (id * 2654435761) % 4294967296
LIMIT 20;
```
