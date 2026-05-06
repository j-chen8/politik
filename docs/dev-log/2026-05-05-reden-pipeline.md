# Session-Log 2026-05-05/06 — Reden-Pipeline-Track

Vollständige chronologische Dokumentation der Arbeit am Reden-Pipeline-Track:
Apply der Anthropic-Batch-Resultate, Tonalitäts-Drift-Fix, Methodology-
Refactor v1→v2→v2.1, Bias-Audit, Re-Batch, manuelle Korrektur, UI-Integration.
Plus: Bugs, Fixes, methodische Lehren.

**Parallel:** Anderes Fenster machte den CV-Pipeline-Track (Stage 4 Repair,
Source-Coherence). Siehe separate Logs.

---

## Phase 1 — Reden-Batch retrieve & apply

**Stand zu Beginn:** Anthropic-Batches `msgbatch_014Sgrh6ocBNF1VeEHS21ZGi`
(5.916 Reden) + `msgbatch_01YSdWFdMs5gWvcKRLhfsM3A` (3.997 Reden) seit
2026-05-01 13:25 UTC `in_progress`. Geschätzte Cost: $42.

```bash
npx tsx scripts/batch-retrieve-reden.ts --apply
```

**Resultat:**
- 9.913/9.913 OK, 0 Errors
- Quote-Validation: **90.90%** (57.598 / 63.366 Quotes valid)
- Cost real: $41.82 (Batch-Pricing)
- Cache-Hit-Rate: 88.88% (171K cache_write, 121M cache_read)
- Output in `speech_analyses_v2`-Tabelle (neu erstellt)

**Sanity-Checks:**
- Reden-Typ-Verteilung plausibel (D/I/E/H als Top-Klassen)
- Tonalität-Spotcheck: 5 zufällige Reden inhaltlich präzise (richtige Person, Partei, Sachverhalt)

---

## Phase 2 — Tonalitäts-Drift-Fix (33 Reden)

**Befund:** Trotz JSON-Schema-Enum im Tool-Use sind 33 von 9.913 Reden mit
invented Tonalitäten durchgerutscht (~0.33% Drift).

**Klassen:**
- **Typo-Drift (18 Reden):** `defensive_pragmatisch` (englisch statt deutsch),
  `social_anklagend`, `staatsmännisch` (mit Umlaut/Soft-Hyphen-Varianten),
  `sachl` (abgeschnitten)
- **Inventions (15 Reden):** `pointiert_*`-Familie (8 Varianten),
  `nachfragend*`, `konstruktiv_kritisch`, `persoenlich_mahnend`, 1× NULL

**Bug:** Anthropic Tool-Use mit `enum`-Constraint im JSON-Schema lockt das
Enum NICHT zu 100%. Bei `<0.4%` Drift.

**Fix:** `scripts/fix-tonalitaet-drift.ts`
- DB-Snapshot vor Lauf
- Spalte `tonalitaet_original` für Audit + Rollback
- JSONL-Audit `tonalitaet-drift-fix-2026-05-05.jsonl` mit Begründung pro Rede
- Mapping nach v2-Methodology (z.B. Paul/AfD `pointiert_nachhakend` →
  `konfrontativ_belegend` unter neutralisierter Definition)

**Resultat:** 31 Reden gemappt, 0 Drift-Werte übrig, 100% in den 11 Enum-Werten.

---

## Phase 3 — Methodology-Refactor v1 → v2 (Neutralitäts-Bias)

**Befund (User-Anstoß):** v1-Methodology hat strukturelle Partei-Anker:
- Typ A: „Polemische Opposition (klassisch AfD)"
- Typ D: „Anti-AfD-Konfrontations-Rede (klassisch SPD/Linke/Grüne)"
- Typ G: „Linke-Sozialgerechtigkeits-Rede"
- Typ K: „Pro-Regierung-Außenpolitik (Grüne / SPD)"
- Tonalitäts-Definitionen: `polemisch_sachlich` = „Fakten plus AfD-Frames",
  `konfrontativ_belegend` = „Belegte Anti-AfD-Konfrontation"
- Frame-Glossar asymmetrisch (AfD: 11 Frames, CDU: 5, SPD: 4)
- Anti-Halluzinations-Heuristiken H1/H2/H3/H7 nach AfD-Politikern benannt
- Beide Beispiel-Outputs in Sektion 7 sind AfD-Reden

**Empirische Verbindung zum Drift:** Reden, die nicht in die AfD-Anker-
Prototypen passten (z.B. Demuth/CDU gegen AfD, Piechotta/Grüne gegen CDU),
bekamen vom Modell keine passende Klasse → invented `pointiert_*`.

**Refactor:**
- Reden-Typen-Namen partei-neutralisiert
- Tonalitäten neutralisiert (`polemisch_sachlich`: AfD-Anker entfernt)
- Empirische Beispiel-Sprecher pro Tonalität auf cross-party-Verteilung erweitert
- Frame-Glossar mit Hinweis: deskriptiv-empirisch, nicht erschöpfend
- Anti-Halluzinations-Heuristiken H1-H7 mit symmetrischer Anwendungs-Anmerkung
- Neue Heuristik **H9: keine eigene Bewertung in der Summary**
- Grundprinzip 6 + 7 hinzugefügt
- Beispiel-Outputs von 2 AfD auf 4 erweitert (+ Hostert/SPD, + Vollath/Linke)
- Tonalitäts-Hinweise in Reden-Typen-Beschreibungen auf die exakten 11 Enum-
  Werte gemappt (vorher freie Texte wie „pointiert-süffisant" — Quelle der
  `pointiert_*`-Drift)

**Backup:** `docs/summarization-methodology.v1-2026-04-30.md.bak`

---

## Phase 4 — Bias-Audit (Schicht 1 + manuell)

### Schicht 1 — strukturell

`scripts/bias-audit-layer1.ts` auf alle 9.864 Reden.

**Befund — wertende Verben in Zusammenfassungen** (sollten 0 sein):
- 222 Reden (~2.25%) mit wertenden Verben
- **Bidirektionaler Bias:**
  - AfD: `skandalisiert`/`polemisiert`/`instrumentalisiert`/`diffamiert` (negativ)
  - SPD/Linke/Grüne/CDU: `entlarvt`/`demaskiert` (positiv — „deckt auf")
- Top-Wort: `entlarvt` (78 Reden)

**Wichtige methodische Lehre:** Aggregate Tonalitäts-Verteilung pro Partei
ist KEIN Bias-Indikator (empirische Asymmetrie ist legitim). Bias-relevant
sind nur:
1. Wertende Verben in Zusammenfassungen (sollten 0 sein, partei-unabhängig)
2. Per-Case-Klassifikations-Fehler
3. Quote-Selection-Bias

### Manueller Audit (15 + 120 Reden)

`scripts/bias-audit-manual-sample.ts` (15 stratifiziert) + erweitert auf 120.

**Resultat:**
- 47% echte Bias-Rate (15er-Sample, mit Bundesregierung-Reden)
- ~62% echte Bias-Rate (120er-Sample, alle Parteien)
- Pattern: AfD-Negativ + Mitte-Links/CDU-Positiv parallel

### Broad Sample (210 Reden ohne wertende Verben)

`scripts/bias-audit-broad-sample.ts` — Reden die KEIN bekanntes wertendes
Verb haben.

**Befund — neue Bias-Patterns:**
- **Pattern A: Frame-Annotation am Schluss** — z.B. „insbesondere gegen
  populistische Rechte" (LLM-Anhang, nicht im Original)
- **Pattern B: Meta-Kommentare zur Rhetorik** — z.B. „rahmt als populistisch",
  „nutzt chronologische Konfrontation" (häufigster Pattern, schwer fangbar)
- **Pattern C: Wertende Adjektive** — „starres Festhalten", LLM-eigen
- **Pattern D: Distanz-Markierungen** — „angeblich", „vermeintlich"
- **Pattern E: LLM-Bildsprache** statt Sprecher-Worte

Schätzung: ~75% neutral, ~17-20% Grenzfall, ~5-8% echter Bias.

### Tier-A-Filter via Llama 3.1 8B

`scripts/bias-audit-tier-a-only.ts` — engerer Filter auf Wörter mit hoher
Bias-Konfidenz: `skandalisier*`, `polemisier*`, `diffamier*`, `denunzier*`,
`verdamm*`, `fabulier*`, `Heuchelei`, `Doppelmoral`, `Stimmungsmache`,
`Abgesang`.

Llama 3.1 8B Instant via Groq (4 Keys round-robin) klassifiziert pro Treffer:
"Verwendet der Sprecher dieses Wort selbst?" → JA/NEIN/UNKLAR.

**Resultat:** 425 Treffer total, **400 als LLM-Editorialisierung** (94%
Bias-Rate). Konsistent über alle Parteien (90-96%).

**Bug:** Llama hat ~10% Fehlerrate (manuell validiert auf Stichprobe). Plus
Llama hat selbst RLHF-Bias und kann subtile Editorialisierungen nicht
unterscheiden.

---

## Phase 5 — v2.1-Methodology + Re-Batch der 400

### v2.1 (`docs/summarization-methodology.md`)

Neue **Heuristik H10** (Selbst-Reflexion gegen Editorialisierung) + neues
**Pflichtfeld `neutralitaets_self_check`** im JSON-Schema:

```json
{
  "konfidenz": "hoch" | "mittel" | "niedrig",
  "wertende_woerter_eigene": ["..."],
  "begruendung_falls_unsicher": "..."
}
```

### Re-Batch (`scripts/batch-resubmit-bias-corrections.ts`)

400 als-Bias-erkannte Reden via Anthropic Batch API mit v2.1-Methodology.

**Submitted:** 2026-05-05 18:33 UTC (Batch `msgbatch_019gryE7wmvV9e9EaL65mFqg`)
**Ended:** 2026-05-05 18:56 UTC
**Resultat:** 400/400 OK, 0 Errors

**Cost real: $3.78** (vs. geschätzte $1.90 — Cache war kalt durch neuen
Methodology-SHA, höher als erwartet).

### Apply (`scripts/batch-retrieve-corrections.ts`)

Schreibt in **neue Tabelle** `speech_analyses_v2_corrections` (v2 in
`speech_analyses_v2` bleibt unangetastet → vollständiger Audit-Trail).

Schema-Erweiterung: `neutralitaets_self_check_json`, `konfidenz`,
`wertende_woerter_eigene_count`.

### Auswertung (`scripts/analyze-corrections.ts`)

**Konfidenz-Verteilung:**
- `hoch`: 225 (56%)
- `mittel`: 71 (18%)
- `null`: 104 (26%) — **Bug: Self-Check-Feld trotz `required` weggelassen**
- `niedrig`: 0

**Wortliste-Validierung auf v2.1-Output:**
- 142/400 Reden haben TROTZ v2.1 noch ein Tier-A-Wort (35.5%)
- → 64% mechanische Reduktion

**Klassen-Aufschlüsselung:**
- A (Wortliste + Haiku unsicher): 68 — beide Filter flaggen
- B (Wortliste + Haiku „hoch"): 74 — Self-Bias-Confirmation
- C (kein Wortliste-Hit + Haiku unsicher): 39
- D (kein Wortliste-Hit + Self-Check fehlte): 68
- E (Wortliste-clean + Haiku „hoch"): 151 — vermutlich sauber

---

## Phase 6 — Manueller Review Klasse A+B (51 Fixes)

**142 Reden mit Wortliste-Hit in v2.1 — manuelle Klassifikation:**
- 91 Reden: Sprecher nutzt das Wort selbst (legitim, kein Fix nötig)
- **51 Reden: echte LLM-Editorialisierung**

**Fix-Strategie:**
- 47 Reden: deterministisches Mapping (`scripts/build-final-bias-fixes.ts`)
  - `Heuchelei` → `Inkonsistenz`
  - `Doppelmoral` → `Inkonsistenz`
  - `Stimmungsmache` → `Polemik`
  - `Abgesang` → `Pessimismus`
  - `verdammt` → `kritisiert scharf` (siehe Bug-Fix unten)
  - `skandalisiert` → `kritisiert scharf`
  - `polemisiert` → `kritisiert scharf`
  - `diffamiert` → `kritisiert`
  - `denunziert` → `wirft vor`
  - `fabuliert` → `behauptet`
- 4 Reden: manueller Override für Grammatik-Brüche

### Bug-Fix: Wortstellung bei „lehnt scharf ab"

**Erstes Mapping war:** `verdammt` → `lehnt scharf ab`
**Problem:** „verdammt die deutsche Energiewende" → „lehnt scharf ab die
deutsche Energiewende" — bricht deutsche Verb-Zweit-Stellung. Gleicher Bug
bei „polemisieren" → „scharf kritisieren" mit Infinitiv-Konstruktionen
(„um... zu scharf kritisieren").

**Fix:** Verb-Mappings auf `kritisiert scharf` (Akkusativ direkt nach Verb,
flexibel) statt `lehnt scharf ab` (Trennverb mit Klammer).

### Manuelle Overrides (4 Reden)

```typescript
'ID211500200_0': // Baumann — Verb-Replace-Bruch
'ID211802000_0': // Drößler — denunziert kontextuell anders
'ID213206900_0': // Bohnhof — Infinitiv-Konstruktion
'ID214705600_0': // Helferich — kombiniert Heuchelei + skandalisieren
```

### Apply (`scripts/apply-final-fixes-to-db.ts`)

**Neue Spalten in `speech_analyses_v2_corrections`:**
- `zusammenfassung_2_saetze_final` — finale Version
- `fix_source` — `mapping` | `manual_override`
- `fix_applied_at` — Timestamp

**UI-Konsum-Pattern:** `COALESCE(c.zusammenfassung_2_saetze_final,
c.zusammenfassung_2_saetze, v2.zusammenfassung_2_saetze)` — final hat
Vorrang, dann v2.1, dann v1.

---

## Phase 7 — Klasse C+D Stichprobe + Restrisiko

`scripts/analyze-corrections.ts` Stichprobe 8 + 8 Reden:

- Klasse C (Haiku unsicher, kein Wortliste-Hit): 7/8 akkurat (Sprecher-Worte),
  1/8 Bias durch **Synonym außerhalb Tier-A** (`Hypocrisy` als Anglizismus —
  semantisch = Heuchelei, aber nicht in Wortliste)
- Klasse D (kein Self-Check, kein Wortliste-Hit): 7/8 neutral, 1/8 Pattern B
  („implizite Anklage von Xenophobie")

**Hochrechnung Restrisiko:** ~14 zusätzliche Bias-Fälle in C+D (~13% × 107).

**Kumulierte Endbilanz:**

| | Anzahl | % |
|---|---:|---:|
| v1 als Bias identifiziert (Tier A) | 400 | 100% |
| Sprecher-Worte (legitim, v2.1 ok) | 91 | 23% |
| Mechanisch + manuell gefixt | 51 | 13% |
| Restrisiko (C+D + nicht erfasste Synonyme) | ~14 | ~3% |
| **Bias-Reduktion gesamt** | **~87%** | |

---

## Phase 8 — UI-Integration (Standard + Linear Design)

### Neue DB-Funktion: `getSpeechAnalysesBySpeaker(speakerName)`

In `src/lib/db.ts`. Joint `speech_analyses_v2` + `speech_analyses_v2_corrections`
+ `plenar_speeches` mit COALESCE-Pattern. Liefert `Map<rede_id_segIdx,
SpeechAnalysisV2>` mit:
- `zusammenfassung_neutral` (mit COALESCE)
- `tonalitaet`, `reden_typ`
- `forderungen`, `woertliche_zitate`, `framing_marker`,
  `rhetorische_mittel`, `konkrete_zahlen`
- `quote_valid_count`, `quote_total_count`
- `fix_source`, `has_correction`

### Bug-Fix: NULL-Filter in `getSpeechSummaries`

**Befund (User-Report):** Auf Redner-Pages ab Sitzung 65 nur „1 Redebeitrag"
ohne Inhalt sichtbar.

**Ursache:** `speech_summaries.zusammenfassung` ist für Sitzungen 65-75 NULL
(alte Llama-3.3-70B-Pipeline lief nicht weiter — letzte Sitzung 64). Der
SQL-Filter `zusammenfassung NOT LIKE '%lediglich%' AND ...` evaluiert für
NULL zu NULL → Row wird gefiltert. Gleichzeitig zählt `getSpeakerDetail`
ungefiltert → Sitzung wird angezeigt mit count, aber kein Inhalt-Block.

**Fix:** `WHERE speaker = ? AND (zusammenfassung IS NULL OR (...filter...))`
— NULL-rows durchlassen, Filter nur auf gefüllte Strings anwenden.

**Effekt:** ~1.500 Reden ab Sitzung 65 jetzt erstmals angezeigt — mit den
neuen Haiku-4.5-Daten als einziger Quelle (alte Pipeline-Lücke).

### Bug-Fix: Tag-Lecks in v2.1-Output

**Befund:** Manche v2.1-Summaries enden mit Tool-Use-Format-Lecks:
`</zusammenfassung_2_saetze>`, `<parameter name="...">`, etc.

**Fix:** `stripTagLeak()` in `src/lib/db.ts` — regex-basiert, in `getSpeech-
AnalysesBySpeaker` post-hoc angewendet:
```typescript
r = r.replace(/<\/zusammenfassung_2_saetze>[\s\S]*$/, "");
r = r.replace(/<parameter\s+name=[\s\S]*$/, "");
r = r.replace(/<\/invoke>[\s\S]*$/, "");
r = r.replace(/<\/answer>[\s\S]*$/, "");
```

Anmerkung: TypeScript ES-Target ist <2018 → kein `s`-Flag, deshalb
`[\s\S]*` als Workaround.

### Bug-Fix: JSON-Double-Encoding bei 90 Reden

**Befund:** `woertliche_zitate_json` ist bei 90/9.913 Reden als
JSON-encoded-String gespeichert statt als Array. Iteration über String gibt
einzelne Zeichen → Median-Quote-Length von 1 in Stats.

**Fix:** `safeJsonArray()` in `src/lib/db.ts` versucht doppeltes Parsen wenn
erstes Parsing String zurückgibt:
```typescript
if (typeof parsed === "string") {
  try {
    const inner = JSON.parse(parsed);
    if (Array.isArray(inner)) return inner.filter(...);
  } catch {}
}
```

### Komponente: `SpeechAnalysisDetails.tsx`

`src/components/SpeechAnalysisDetails.tsx` — zeigt:
- Tonalitäts-Badge (farbig, 11 Klassen-spezifische Farben)
- Reden-Typ-Label (A-K mit Klartext-Mapping)
- v2.1-Marker bei korrigierten Reden (mit Tooltip)
- Strukturierte Analyse einklappbar:
  - Forderungen / Positionen (Liste)
  - Wörtliche Zitate (mit Validation-Counter)
  - Konkrete Zahlen
  - Framing-Marker (Glossar-Keys)
  - Rhetorische Mittel

### Erweiterte Pages

**Standard-Design:**
- `src/app/protokolle/redner/[name]/page.tsx` — pro Rede `SpeechAnalysisDetails`
- `src/app/politiker/[id]/page.tsx` — Tonalitäts-Badge in Parlamentarische
  Arbeit

**Linear-Design:**
- `src/app/design/linear/protokolle/redner/[name]/page.tsx`
- `src/app/design/linear/politiker/[id]/page.tsx`

### Erweiterung `getParlamentarischeArbeit`

Joint v2.1-Analysen ein. `ParlamentarischeArbeit`-Interface erweitert um
`tonalitaet`, `reden_typ`, `has_correction`. v2.1-`zusammenfassung_neutral`
als Fallback bei NULL aus `speech_summaries`.

---

## Phase 9 — Methodology-Doku final + Memory

- `docs/reden-methodology.md` Sektion 6-8 — Bias-Audit-Pipeline + Restrisiken
- `docs/summarization-methodology.md` Sektion 10 — Versionsgeschichte
  v1 → v2 → v2.1
- Memory `project_bias_correction_re_batch.md` — Endbilanz mit Restrisiken
- NEXT-SESSION-bias-corrections.md — Pickup für andere Sessions

---

## Bekannte Restrisiken (transparent dokumentiert)

1. **Pattern B (Meta-Kommentare)** — strukturelle LLM-Limitierung: alle
   getesteten Modelle (Haiku 4.5, Llama 3.1 8B) erkennen Meta-Kommentare
   nicht zuverlässig.
2. **Synonyme außerhalb Tier-A-Liste** — `Hypocrisy`, `Hypokrisie`,
   `Scheinheiligkeit`, `Pharisäertum`. In Doku als erweiterte Wortliste
   für nächsten Audit-Pass eingetragen.
3. **Self-Check-Feld nicht 100% zuverlässig** — Anthropic Tool-Use lockt
   `required`-Felder nicht 100% (26% NULL trotz `required`); Konfidenz
   „hoch" garantiert keine Sauberkeit (74/400 hatten trotzdem Wortlisten-Hit).

---

## Lessons Learned (für künftige Pipelines)

1. **Methodology-Anker erzeugen Klassifikations-Drift.** v1 hatte AfD-Anker
   in Tonalitäten → Modell konnte non-AfD-Konfrontationen nicht klassifizieren
   → invented `pointiert_*`. Anti-Pattern: Klassen-Definitionen mit
   Partei-Beispielen koppeln.

2. **JSON-Schema-Enum lockt nicht 100%.** Anthropic Tool-Use mit `enum`-
   Constraint hatte 0.33% Drift bei 9.913 Reden. Bei sicherheitskritischen
   Klassifikationen: post-hoc Validierung Pflicht.

3. **JSON-Schema-Required lockt nicht 100%.** Trotz `required: ["...,
   neutralitaets_self_check"]` hat Haiku in 26% das Feld weggelassen.

4. **Cache-Cost-Schätzung ist Best-Case.** Bei neuem Methodology-SHA ist
   der Cache kalt → tatsächliche Cost kann ~2× Schätzung sein. Geplant
   $1.90, real $3.78.

5. **Aggregat-Bias-Indikatoren sind methodisch heikel.** Asymmetrische
   Tonalitäts-Verteilung pro Partei ist KEIN Bias (kann legitime Empirie
   sein). Echte Bias-Indikatoren müssen partei-unabhängig sein
   (z.B. wertende Verben in der Summary, die in 0% jeder Partei stehen
   sollten).

6. **Cross-Family-LLM-Inspektoren haben Bias-Confirmation-Risiko.** Llama
   und Haiku haben ähnliche RLHF-Tendenzen. Bei Pattern B (Meta-Kommentare)
   versagen beide. Goldstandard bleibt menschliche Validierung — kein
   autonomes LLM-Setup.

7. **Deterministisches Mapping > LLM-Rewrite bei klar definierten
   Wortersetzungen.** Risiko des LLM-Rewrites: neue Bias-Vektoren werden
   eingeführt. Deterministisches Mapping ist reproduzierbar und audit-
   freundlich.

8. **Deutsche Verb-Zweit-Stellung beachten bei Mappings.** „verdammt" →
   „lehnt scharf ab" bricht Wortstellung. „kritisiert scharf" passt besser.

9. **Filter-Logik braucht NULL-Handling.** SQL `NOT LIKE` evaluiert für
   NULL zu NULL → Row gefiltert. Wenn NULL legitim sein kann (wie hier
   für Sitzungen ohne alte Pipeline-Daten): explizit `IS NULL OR (...)`.

10. **Audit-Trail über separate Tabelle, nicht UPDATE in-place.** v1 in
    `speech_analyses_v2`, v2.1 in `speech_analyses_v2_corrections`. UI
    nutzt COALESCE. Vorteil: vollständiger Vorher/Nachher-Vergleich für
    Förder-Antrag, kein Datenverlust.

---

## Cost-Bilanz Reden-Track (kumuliert)

| Phase | Cost | Datum |
|---|---:|---|
| Smoke-Test (40 Reden, 3 Modi) | $0.39 | 2026-05-01 |
| Vollauf-Batch (9.913 Reden) | $41.82 | 2026-05-01 |
| Bias-Audit (Llama 8B Free Tier) | $0 | 2026-05-05 |
| Re-Batch der 400 (v2.1) | $3.78 | 2026-05-05 |
| Drift-Fix + Manuelle Korrektur + UI | $0 | 2026-05-05 |
| **Total Reden-Track** | **~$46** | |

---

## Artefakte (alle committet in `4afe8bb`)

**Methodology:**
- `docs/summarization-methodology.md` (v2.1)
- `docs/summarization-methodology.v1-2026-04-30.md.bak` (NICHT committed —
  als Audit-Trail vorhanden, im Versions-Eintrag referenziert)
- `docs/reden-methodology.md` (Audit-Pipeline + Restrisiken)

**Skripte (15 neue):**
- `scripts/batch-submit-reden.ts`, `batch-retrieve-reden.ts`
- `scripts/fix-tonalitaet-drift.ts`
- `scripts/bias-audit-layer1.ts`, `bias-audit-manual-sample.ts`,
  `bias-audit-broad-sample.ts`, `bias-audit-tier-a-only.ts`,
  `bias-audit-extract-all-222.ts`
- `scripts/bias-classify-llama.ts`
- `scripts/batch-resubmit-bias-corrections.ts`,
  `batch-retrieve-corrections.ts`, `analyze-corrections.ts`
- `scripts/apply-bias-fixes.ts`, `build-final-bias-fixes.ts`,
  `apply-final-fixes-to-db.ts`, `export-class-ab-for-review.ts`

**UI:**
- `src/components/SpeechAnalysisDetails.tsx` (neu)
- `src/lib/db.ts` (`getSpeechAnalysesBySpeaker`, `safeJsonArray`,
  `stripTagLeak`, erweitertes `getParlamentarischeArbeit`)
- 4 Page-Updates (Standard + Linear, jeweils Politiker + Redner)

**JSONL-Audit-Trail:**
- `bias-audit-tier-a-only.jsonl` (425 Llama-Klassifikationen)
- `bias-class-ab.jsonl`, `bias-class-ab-with-orig-check.jsonl`,
  `bias-fix-51.jsonl`
- `bias-fixes-final.jsonl`, `bias-fixes-final.md`,
  `bias-fixes-review.md`, `bias-corrections-review.md`
- `tonalitaet-drift-fix-2026-05-05.jsonl`

**DB-Snapshots (vor jedem destruktiven Schritt):**
- `politik.db.snapshot-pre-tonalitaet-fix-2026-05-05-1638`
- `politik.db.snapshot-pre-cv-stage4-20260505-222250` (CV-Track)

---

## Offene Punkte (für nächste Sessions)

- [ ] Sitzung 76 nachziehen (06.05.2026 ff.) — neue Reden mit v2.1-
      Methodology batchen, erweiterte Wortliste anwenden (`Hypocrisy` etc.)
- [ ] Topic-Klassifikation als zweite Analyse-Layer (Multi-Label)
- [ ] Killer-Feature: Synopse Aussage-vs-Vote pro MdB
- [ ] Externe Validierung durch Politikwissenschaftler/Journalist (10-20
      Reden blind, gegen Selbst-Validierungs-Vorwurf)
- [ ] CV-Pipeline: 2 cv_summary failures + 1 Stage4-Edge-Case nachziehen
      (sehr klein)
