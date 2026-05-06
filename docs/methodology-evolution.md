# Methodik-Evolution: Politik-Datenextraktion

**Stand:** 2026-04-30
**Status:** lebendes Dokument, wird mit jeder Phase ergänzt

Dieses Dokument beschreibt die Evolution der Datenextraktions-Methodik für das Projekt — von einem naiven Single-LLM-Setup hin zu einer Specialist-Cascade-Architektur. Es ist eine ehrliche Chronik mit empirischen Befunden, Fehlentscheidungen und Lerneffekten.

Zweck:
- **Audit-Trail** für jede Architektur-Entscheidung mit Begründung
- **Förder-Transparenz** — wie wurde die aktuelle Methodik begründet?
- **Wiederverwendbare Lehren** für künftige Pipelines (Reden, Sidejobs, Drucksachen)
- **Schutz gegen Second-Guessing** — „warum nicht Modell X?" hat dokumentierte Antworten

---

## Phase 0 — Projekt-Initialisierung (März 2026)

**Setup:**
- Bundestag politik platform initial — Politiker-Stammdaten, Mandate, Abgeordnetenwatch-Integration
- Datenquellen: Bundestag-API (DIP), Abgeordnetenwatch
- Noch keine LLM-Pipeline, nur strukturierte API-Daten

**Gelernt:** Bundestag-API liefert solide Stammdaten (Name, Mandat, Wahlperiode), aber keine substanzielle Biografie-Information. Für CVs braucht es freie Text-Extraktion.

---

## Phase 1 — Naiver LLM-Start (April 2026)

**Setup:**
- Wikipedia-Volltext via API gefetched, in `bio_full_text` gecacht
- **Generator: Llama 3.1 8B (Groq, Free Tier)**
- Single-Pass-Extraktion: Wikipedia → Llama → cv_json
- 4 Sektionen: ausbildung, beruflicher_werdegang, politische_stationen, sonstiges

**Modell-Wahl-Begründung damals:**
- Groq Free Tier verfügbar
- Llama 3.1 8B schnell und günstig ($0)
- JSON-Mode für strukturierten Output

**Bewusste Kosten-Strategie:**
Der Anspruch war zu Beginn, mit möglichst geringem Budget maximalen Ertrag zu erzielen — ein Antasten an die Materie, wie weit man mit kostenfreien Ressourcen kommt. Diese Disziplin war wichtig, um die fundamentalen Architektur-Entscheidungen ohne Geld-Druck treffen zu können und um eine ehrliche Antwort auf die Frage zu bekommen: „Was ist ohne Investitionen möglich, was nicht?"

**Empirisch gemessen:**
- Coverage: 629/629 Bundestag-MdBs durchgelaufen
- Aber: keine systematische Qualitäts-Messung in Phase 1

**Erstes Bauchgefühl:** „funktioniert irgendwie", aber bei manuellem Spot-Checking offensichtliche Halluzinationen sichtbar.

---

## Phase 2 — Multi-LLM-Konsens-Pipeline (Mitte April 2026)

**Setup (5 Stufen):**

| Stufe | Modell | Aufgabe |
|---|---|---|
| 1 | Llama 3.1 8B | Generator (Wikipedia → cv_json) |
| 2 | Mistral Small | Cross-Check (parallele Extraktion + Konflikt-Detection) |
| 3 | NVIDIA Nemotron-Nano 12B | Tiebreaker bei Llama-vs-Mistral-Konflikten |
| 4 | Anthropic Haiku 4.5 | V2-Tiebreaker mit allen 4 Quellen (Wikipedia, Bundestag, Homepage, Bundesregierung) |
| 5 | gpt-oss-120b (Groq) | Source-Coherence (cv_json vs cv_homepage_json vs Bundestag-Bio) |

**Begründung der Architektur:**
- **4 Modell-Familien-Diversität** (Meta, Mistral AI, NVIDIA, OpenAI/Anthropic) → unterschiedliche Bias-Patterns
- **Konsens-Annahme:** wenn 2+ unabhängige Modelle dasselbe sagen, höhere Konfidenz
- **Bewusst keine chinesischen Modelle** (DeepSeek, Qwen, Kimi, GLM) aus politischen Reputations-Gründen — wir bauen Transparenz für deutsche Politik, da wäre China-KI inkonsistent

**Empirisch gemessen:**
- 14.347 Aussagen über alle MdBs extrahiert
- **175 Halluzinationen** durch Multi-LLM-Konsens identifiziert (~1.2% der Aussagen)
- 676 Diskrepanzen zwischen Llama und Mistral, davon 99 unscharfe Fälle die zu Stufe 4 (Haiku) gingen

**Was funktioniert hat:**
- Inter-LLM-Konflikte fangen einen Teil der Halluzinationen
- Methodik-Story für Förderer war stark
- Multi-Source-Vergleich (Stufe 5) findet Inter-Source-Diskrepanzen

**Was NICHT funktioniert hat (Erkenntnis aus Phase 3):**
- Wenn beide LLMs **dieselbe plausible Halluzination** machen, entdeckt der Cross-Check sie nicht
- Speziell: Date-Format-Halluzinationen (z.B. „2006-2013" statt „seit 2006") sind ein Pattern, das mehrere Llama-ähnliche Modelle gemeinsam haben

---

## Phase 3 — Reality Check gegen Wikipedia (29. April 2026)

**Was passiert ist:**
Manuelle Stichprobe von 10 zufälligen MdBs gegen Wikipedia-Original geprüft.

**Befund:**
- **3 von 9 prüfbaren MdBs hatten Datums-Halluzinationen**
- 1 MdB nicht prüfbar (kein Wikipedia-Artikel)

**Konkrete Beispiele:**

1. **Irene Mihalic (Grüne, ID 79129)** — Dreifach-Fehler:
   - cv_json: „2006-2013 Mitglied von Bündnis 90/Die Grünen"
   - Wikipedia: „seit 2006 Mitglied" — **Endjahr halluziniert**
   - cv_json: „1993-2007 Polizistin, Polizeipräsidium Köln"
   - Wikipedia: „Ab 1993 als Polizistin tätig, ab 2007 beim Polizeipräsidium Köln" — **Reihenfolge umgedreht und zwei Phasen vermischt**

2. **Thomas Korell (AfD, ID 175003)** — Date-Conflation:
   - cv_json: „2016: Fraktionsvorsitzender Stadtrat Klötze"
   - Wikipedia: „2016 AfD-Beitritt, seit 2019 Fraktionsvorsitzender Stadtrat Klötze"
   - **Llama hat AfD-Beitrittsjahr mit Stadtrats-Wahljahr zusammengezogen**

3. **Micha Fehre (AfD, ID 183487)** — Klassifikations-Fehler (kein Datum)

**Pattern-Analyse:**
Llama 3.1 8B versagt systematisch bei:
- Zeitlichen Übergängen („ab 2007" vs. „bis 2007")
- Mandats-Strukturierung über mehrere Wahlperioden
- Date-Conflation bei mehreren parallelen Ereignissen im selben Jahr
- Erfindung von Endjahren wenn nur Anfangsjahr genannt

**Hochrechnung:** Bei 14.347 Aussagen × ~5-15% Halluzinations-Rate pro MdB = **700-2.000 falsche Fakten** unter Politiker-Namen veröffentlicht.

**Methodik-Schwachstelle entdeckt:** „Bastian Ernst" (CDU, ID 182825) hat keinen Wikipedia-Artikel, aber `cv_json` ist gefüllt → versteckte Quellen-Vermischung. Audit-Trail-Inkonsistenz.

**Erkenntnis:** Multi-LLM-Konsens fängt nicht Halluzinationen, die ähnliche Trainings-Bias-Patterns produzieren. Generator-Qualität muss verbessert werden, nicht (nur) Inspector-Anzahl.

---

## Phase 4 — Generator-Wechsel: Llama → Haiku (30. April 2026)

**Hypothese:** Stärkeres Generator-Modell sollte Halluzinations-Rate massiv reduzieren.

**Test-Setup:**
A/B-Test an 5 MdBs mit unterschiedlicher Komplexität:
- Mihalic, Korell, Hoffmann (bekannte Problem-Fälle aus Phase 3)
- Verlinden, Nouripour, Merz (Zufallsstichprobe)

**Vier Modell-Optionen evaluiert:**

| Modell | Familie | Cost / 629 MdBs | Qualität (Test) |
|---|---|---|---|
| Llama 3.1 8B-instant | Meta (Free) | $0 | ~30% Halluzinations-Rate |
| Llama 4 Scout 17B | Meta (Free) | $0 | ~10-15%, aber Klassifikations-Fehler |
| Llama 3.3 70B (Free oder DeepInfra) | Meta | $0 / ~$9 | Geschätzt ~5-10% |
| **Claude Haiku 4.5** | **Anthropic** (paid) | **~$5-8** | **0/6 Halluzinationen in Stichprobe** |

**Prompt-Engineering iteriert (v3 → v4 → v5):**
- v3: Klassifikations-Regeln pro Sektion ergänzt
- v4: harte „kein Jahr im Text → leerer String"-Regel + „seit YYYY wörtlich erhalten"
- v5: zusätzlich Datums-Konsolidierung (gegen 5× „seit März 2025"-Redundanz) + Privates strenger limitiert

**Kritische Erkenntnis aus den Tests:**
- Llama 4 Scout mit v4-Prompt: Date-Format-Halluzinationen weg, aber NEUE Halluzinationen (z.B. „[2025] Ehe mit Charlotte Merz" — komplett erfunden)
- Selbst mit hartem „kein Jahr → leer"-Prompt erfanden kleinere Modelle weiter Daten
- **Haiku 4.5 mit v5-Prompt: 23/23 = 100% korrekte Verdicts bei Hoffmann-Test, 0 Halluzinationen**

**Trade-off-Diskussion:**
- Free Tier vs. Paid: $5-8 für eine kritische Foundation-Datei ist akzeptabel
- Argument: „Wenn ich nicht mal CVs richtig hinkriege, wie soll ich Reden perfekt analysieren?"
- Foundation-First-Strategie: lieber paid für Qualität, dann kostenlose Inspectors als Validierung

**Wendepunkt: vom Kostenoptimum zum Qualitätsoptimum**

Phasen 1-3 waren konsequent als Sparübung gestaltet — alles über kostenlose APIs, keine bezahlten Modelle. Die Logik dahinter war pragmatisch: erst herausfinden, ob das Projekt überhaupt funktioniert, bevor Geld ausgegeben wird.

Mit zunehmender Tiefe in der Materie wurde aber sichtbar, dass diese Strategie eine harte Grenze hat. Free-Tier-Modelle (selbst die größeren wie Llama 70B oder Scout 17B) haben eine systematische Halluzinations-Tendenz, die mit Prompt-Engineering nur teilweise korrigierbar ist. Für ein **Informations-Projekt mit Anspruch auf Korrektheit** — das Bürger:innen verlässliche Daten über Politiker:innen liefern soll — ist das nicht akzeptabel.

Die Entscheidung für Claude Haiku 4.5 als Generator ist daher **kein Komfort-Upgrade, sondern eine Notwendigkeit**: ab einem bestimmten Qualitäts-Anspruch führt kein Weg an bezahlten Premium-Modellen für die Foundation-Daten vorbei. Die kostenlosen Modelle bleiben in den Validierungs- und Reparatur-Stages aktiv, wo ihre Stärken (fokussierte Aufgaben, Verifikation) optimal genutzt werden.

**Bezug zu Fördergeldern:**
Genau dieser Punkt ist einer der Hauptgründe, warum Fördergelder für das Projekt sinnvoll sind. Die laufenden API-Kosten für hochwertige Modell-Aufrufe (auch wenn sie pro Lauf gering sind: ~$8 für 629 MdBs Wikipedia-CVs) werden mit jeder neuen Datenart und jeder Wahlperiode skalieren. Ohne finanziellen Puffer entsteht ein ständiger Druck, an Qualität zu sparen, der genau das Gegenteil von dem ist, was das Projekt erreichen will. Förderung bedeutet hier nicht „Luxus", sondern die strukturelle Möglichkeit, Qualität nicht ständig gegen Budget abwägen zu müssen.

**Entscheidung:** **Claude Haiku 4.5 als Generator** für Wikipedia-CV-Pipeline.

**Vollauf gestartet 30.04.2026 ~14:30:** 627 MdBs neu generiert mit Haiku + v5-Prompt.

---

## Phase 5 — Architektur-Pivot: Multi-LLM-Konsens → Specialist-Cascade (30. April 2026)

**Erkenntnis:** Mit Haiku als hochwertigem Generator wird die alte Multi-LLM-Konsens-Architektur (Stage 1-4) overkill und ineffizient.

**Warum:**
- Wenn Haiku 0-2% Halluzinations-Rate hat, ist parallele Voll-Extraktion mit schwächerem Llama suboptimal — produziert mehr Konflikte die geprüft werden müssen
- Specialist-Inspectors mit fokussierten Aufgaben sind effizienter als Generalisten mit „prüfe alles"
- Kleine Modelle sind besser bei einer Aufgabe als bei vielen (Working-Memory-Limit)

**Neue Architektur — Specialist-Cascade:**

```
[Stage 1 Generator]    Wikipedia → Haiku 4.5 → cv_json
        ↓
[Stage 2d.1]           Programmatischer Doppelungs-Vorfilter (regex + Heuristiken)
        ↓
[Stage 2a, 2b, 2c]     Parallele Specialist-Inspectors
        ↓
[Stage 2d.2]           Llama 70B Doppelungs-Verifier (für Vorfilter-Kandidaten)
        ↓
[Stage 3]              Verdict-Aggregator → Repair-Queue
        ↓
[Stage 4]              Llama 4 Maverick Repair (Cascade: Maverick → Haiku Fallback)
        ↓
[Stage 5+5.5]          bestehende Multi-Source-Coherence (bleibt)
```

**Modell-Rollen mit Begründung:**

| Stage | Modell | Familie | Warum genau dieses |
|---|---|---|---|
| 1 Generator | Claude Haiku 4.5 | Anthropic | Bestes Schema-Compliance + Anweisungs-Befolgung |
| 2a Datums-Inspektor | Mistral Small | Mistral (FR) | Function-Calling-Training → strukturierte Verdicts |
| 2b Halluzinations-Inspektor | Nemotron-Nano (Mamba) | NVIDIA | **Mamba-Architektur** — nicht-Transformer, fängt Patterns die alle Transformer übersehen |
| 2c Klassifikations-Inspektor | Llama 4 Scout MoE | Meta | 2M TPD Headroom, MoE für Multi-Class-Reasoning |
| 2d.1 Doppelungs-Vorfilter | regex + Heuristiken | Code | $0, deterministisch, schnell |
| 2d.2 Doppelungs-Verifier | Llama 3.3 70B | Meta Dense | Stärkstes Reasoning + deutsche Domain-Kunde |
| 4 Repair | Llama 4 Maverick | Meta MoE-128 | 128 Experten = domain-spezifisch |
| 5 Source-Coherence | gpt-oss-120b | OpenAI | bestehend, gut bei 3+ Quellen-Synthese |

**Warum Architektur-Diversität wichtig ist:**
- Generator (Anthropic) hat eigene Bias-Patterns
- Mistral (FR) und NVIDIA Mamba sehen anders auf Text
- Llama-Familie als drittes unabhängiges Reasoning
- Nicht-LLM-Stages (Doppelungs-Vorfilter) als „bias-free reality check"

---

## Phase 6 — Empirische Validierung der Specialist-Cascade (30. April 2026)

### 6.1 Datums-Inspektor (Mistral Small) validiert

**Test 1 — Hoffmann mit ALTEM Llama-Output (bekannte Halluzinationen):**
- 7 echte Halluzinationen vorhanden (alle aus Phase 3 Reality-Check)
- Mistral: alle 7 korrekt als `datum_falsch` oder `nicht_im_text` erkannt ✓
- Konkrete Korrektur-Vorschläge geliefert (z.B. „seit 2017" statt „2017-2022")

**Test 2 — Hoffmann mit NEUEM Haiku-Output:**
- 23 Einträge, 11 mit Datum + 12 mit leerem Datum (REGEL 0 befolgt)
- Mistral v2: 11 `korrekt` + 12 `korrekt_leer`, 0 False Positives ✓
- **Wahre Korrektheit: 100%**

**Lehre:** Mistral als Function-Calling-Specialist liefert exakte, schema-strikte Verdicts. Andere Familie als Generator → keine geteilten Halluzinations-Patterns.

### 6.2 Doppelungs-Detector (programmatisch) — Iteration

**Erste Version (zu lax):**
- Threshold: text-sim > 0.5 + Year-Overlap
- Resultat: **55% MdBs flagged** — zu viele False Positives

**Beispiele für False Positives:**
- Knut Abraham: 3× „Erfolglose Kandidatur Europawahl Listenplatz 3" in 2009/2014/2019 — drei verschiedene Wahlen, NICHT Doppelung
- Bodo Ramelow: Thüringer Landtag in zwei verschiedenen Phasen mit Pause — legitim getrennt

**Verfeinerung 1 — Year-Containment statt Year-Overlap:**
- Echte Doppelung erfordert dass eine Year-Range die andere vollständig enthält
- „2013-2017" und „2017-2021" überlappen, aber keiner enthält den anderen → KEIN Match
- Resultat: **8.4% MdBs flagged**

**Verfeinerung 2 — Rank-Asymmetrie als Anti-Match:**
- Wörter wie „stellvertretend", „Erste/Zweite", „Vize" als Anti-Doppelungs-Signal
- Filtert Aufstiegs-Patterns (Stellv. → Voll-Position)
- Resultat: **5.7% MdBs flagged** mit 21 Pärchen total

### 6.3 Doppelungs-Verifier (Llama 3.3 70B) validiert

**Test:** alle 21 Pärchen vom programmatischen Detector durch Llama-Verifier:
- 11 confirmed merges (echte Doppelungen)
- 9 rejected (False Positives korrekt erkannt)
- 1 HTTP-Error (retry-fähig)

**False-Positive-Rate des programmatischen Detectors: 45%** — vom LLM-Verifier abgefangen.

**Konkrete Beispiele wo Llama 70B besser war als programmatischer Detector UND als manuelle Code-Assistant-Analyse:**

1. **Matthias Miersch — verschiedene SPD-Unterbezirke:**
   - A: „SPD-Unterbezirk Hannover-Land"
   - B: „SPD-Unterbezirk Region Hannover"
   - Programmatisch: ❌ flagged (hohe Text-Similarity)
   - Code-Assistant: 🟡 als Marginal eingeordnet
   - **Llama 70B**: ✅ erkannt dass „Land" und „Region" zwei verschiedene SPD-Bezirks-Strukturen sind

2. **Hans Koller — Hierarchie-Stufen:**
   - A: „Bezirksvorsitzender vlf"
   - B: „Landesvorsitzender vlf"
   - Programmatisch: ❌ flagged (gleicher Verband)
   - **Llama 70B**: ✅ „Bezirks- und Landes- sind verschiedene hierarchische Ebenen"

3. **Martin Gerster (6×) — Oberbegriff vs. Unterbegriff:**
   - A: „seit 2005 Mitglied des Deutschen Bundestages"
   - B: „2005-2007 Mitglied im Innenausschuss" (und 5 weitere Ausschuss-Pärchen)
   - **Llama 70B**: konsistent abgelehnt mit identischer Begründung „MdB allgemein vs. Ausschuss spezifisch"

**Lehre:** Semantisch-nuancierte Klassifikation („sind A und B dasselbe?") braucht 70B+ Reasoning. Mistral Small (24B), Nemotron (12B), Scout (17B MoE) wären zu schwach für deutsche Bezirks-/Hierarchie-Kunde.

### 6.4 Cascade-Pattern bewährt

**Erkenntnis:** Die Aufteilung „programmatisch billig + LLM teuer für Subtilität" funktioniert wie geplant:
- Programmatischer Detector reduziert Kandidaten von 14.000 Einträgen auf 21 Pärchen
- LLM-Verifier prüft nur diese 21 Pärchen (~30 Sekunden, $0)
- 45% Schaden vermieden gegenüber „programmatisch alleine merged"

**Wiederverwendbar für ALLE zukünftigen Pipelines** (Reden, Sidejobs, Drucksachen).

### 6.5 Vollauf an 629 MdBs — auch der Verifier braucht Validierung

Beim Vollauf der Doppelungs-Pipeline an allen 629 MdBs (statt der 251 Test-MdBs) tauchten Edge Cases auf, die die kleinere Stichprobe nicht zeigte. Wichtige Erkenntnis: **auch der LLM-Verifier (Llama 70B) produziert Fehler, die wir vorher nicht gesehen hatten.**

**Vollauf-Statistik:**
- 35 Doppelungs-Kandidaten vom programmatischen Detector
- Llama 70B confirmed: 22 Merges, rejected: 12, 1 HTTP-Error
- **Manuelle Schluss-Validierung durch Claude Opus 4.7 (höheres Reasoning-Modell als Verifier):** 16 sauber durchgewunken, 2 mit Datums-Korrektur, 4 abgelehnt
- Final: 18 confirmed Merges in `confirmed-duplicates-final.jsonl`

**4 Klassen von Llama-Fehlern, die erst Opus-Review entdeckte:**

1. **Erfundene Daten im Merge** (Peter Felser):
   - A: `[ ] Stellv. Mitglied Verteidigungsausschuss`
   - B: `[seit 2025] Stellv. Mitglied Verteidigungsausschuss`
   - Llama merged: `[seit 2017]` — **2017 stand in keinem der Original-Einträge!** Llama hat aus Wikipedia gefolgert dass er seit 2017 MdB ist und das ungerechtfertigt übertragen.

2. **Aufstiegs-Pattern als Doppelung interpretiert** (Claudia Moll):
   - A: `[seit 2005] Engagement in der AsF`
   - B: `[seit 2013] Vorsitzende der AsF`
   - Llama merged → zerstört Karriere-Information (Mitglied → Vorsitzende ist ein Aufstieg, KEINE Doppelung)
   - Anti-Match-Filter hatte das nicht gefangen weil „Engagement" / „Vorsitzende" nicht in der RANK_MODIFIERS-Liste sind

3. **Position-Wechsel als Doppelung** (Andrea Lübcke):
   - A: `[15. März 2025] Co-Landesvorsitzende`
   - B: `[März-November 2025] Landesvorsitzende`
   - Co-Vorsitz → Allein-Vorsitz ist ein Position-Wechsel, kein Duplikat

4. **Falsche geschlossene Range statt offener** (Mayer-Lay, Huy):
   - A: `[seit 2021] MdB (20. BT)`
   - B: `[seit 2025] MdB (21. BT)`
   - Llama merged: `[2021-2025]` — suggeriert NICHT MEHR MdB, obwohl er noch im 21. BT ist
   - Korrekt wäre: `[seit 2021] (20. und 21. WP)`

**Validierung der Llama-Rejections (12 Pärchen):**
Auch die 12 von Llama abgelehnten Kandidaten wurden von Opus reviewt — **alle 12 zurecht abgelehnt**. Llama hat keine echte Doppelung übersehen.

**Llama 70B Akkuratesse (Vollauf):**
- False-Negative-Rate (echte Doppelung übersehen): **0%**
- False-Positive-Rate (zurecht rejected): **100% korrekt**
- False-True-Rate (fälschlich confirmed): **~18%** (4/22), durch Opus-Review gefangen

**Wichtigste Erkenntnis:** Llama 70B ist als Verifier konservativ in die richtige Richtung — lieber zu wenig mergen als zu viel. False Negatives (verpasste Doppelung) sind harmloser als False Positives (zerstörte Daten).

### 6.6 Einführung der Mensch-im-Loop-Validierungs-Schicht

Daraus folgt eine wichtige Architektur-Erweiterung: **bei kleinen Verifier-Output-Mengen (<50 Pärchen) ist eine manuelle Schluss-Validierung durch ein höheres Reasoning-Modell (Opus 4.7) günstiger als eine zweite automatische Verifier-Schicht.**

**Workflow:**
1. Programmatischer Detector → ~5% MdBs flagged (deterministisch, $0)
2. Llama 70B Verifier → ~50-60% confirmed (semantische Filter, $0)
3. **Mensch + Opus 4.7 Schluss-Review** → ~80% der Confirmed final akzeptiert (10-15 Min Aufwand für 22 Pärchen)
4. Finale `confirmed-duplicates-final.jsonl` mit Audit-Trail-Markierung (`human_approved` / `human_corrected` / `human_reviewer: opus-4.7`)

**Trade-off:**
- Vorteile: 100% Datenqualität, kein blindes Vertrauen in einen einzelnen Verifier
- Nachteile: skaliert nicht für Tausende von Kandidaten — bei größeren Pipelines (z.B. Reden) muss eine zweite automatische Verifier-Schicht (z.B. Haiku oder Opus als zweite Meinung) das Mensch-im-Loop ersetzen
- Aktueller Sweet-Spot: für CV-Pipeline mit ~20-50 Kandidaten ist manuelle Validierung ideal

**Audit-Trail-Erweiterung:** Jeder finale Merge-Eintrag trägt jetzt drei Validierungs-Stufen-Marker:
1. `detector_version` (programmatisch)
2. `verifier_version` (LLM, hier Llama 70B)
3. `human_reviewer` + `human_approved` oder `human_corrected` (Mensch + Opus)

→ Volle Nachvollziehbarkeit jeder Datenmodifikation.

---

## Phase 7 — Source-Coherence Verifier-Auswahl: Llama vs. Haiku (5. Mai 2026)

**Kontext:**
Stage 5 (`source-coherence-check.ts` mit `gpt-oss-120b` auf Groq) hat zwischen Wikipedia-CV und Homepage-CV von 563 Bundestag-MdBs **39 vermeintliche Quellen-Widersprüche** in 35 Politiker-Profilen identifiziert. Die Frage: welches Modell taugt als Verifier-Layer, der aus diesen Stage-5-Flags die echten Widersprüche von Falsch-Positiven trennt?

**Setup:**
Identischer Prompt, identische Eingabe-Format für beide Modelle. 4-Klassen-Klassifikation:

- `ECHT` — echter Quellen-Widerspruch (eine Quelle ist falsch oder veraltet)
- `PRAEZISIERUNG` — eine Quelle ist nur ungenauer (kein echter Daten-Defekt)
- `FALSE_POSITIVE` — Stage 5 hat falsch geflaggt (kompatible Aussagen)
- `UNKLAR` — manuelle Recherche nötig

**Ground Truth:**
Manuelle Klassifikation durch Opus 4.7 (zwei Iterationen — initial + Revision nach Sichtung der Verifier-Outputs). 16 ECHT, 12 PRAEZ, 11 FP, 0 UNKLAR.

**Empirisch gemessen:**

| Verifier | Agreement | ECHT-Recall | ECHT-Precision | ECHT-F1 | Cost (39 Cases) |
|---|---:|---:|---:|---:|---:|
| Llama 3.3 70B (Groq Free) | 48.7 % | 37.5 % | 85.7 % | 52.2 % | $0 |
| **Haiku 4.5 (Anthropic)** | **61.5 %** | **68.8 %** | 68.8 % | **68.8 %** | **$0.06** |

**Bias-Pattern bei Llama 70B:**
Llama hat eine starke Konflikt-Vermeidungs-Tendenz — bei jedem zeitgleichen-Sachverhalt-Konflikt automatisch zu „verschiedene Rollen können parallel sein" greifen, auch wenn das logisch ausgeschlossen ist. Beispiele:

- **FSJ + Jurastudium parallel** — übersieht: FSJ ist Vollzeit, formal ausgeschlossen
- **Karrierebeginn + etablierter Verkaufsleiter im selben Jahr** — übersieht: schließen sich aus
- **Vollzeit-Referent + MdB parallel** — übersieht: verfassungsrechtlich ausgeschlossen
- **stellv. Büroleiter ist Sub-Position des Büroleiters** — verwechselt Hierarchie-Stufe mit Präzisierung

Aus 16 Opus-ECHTen würde Llama-only 10 als FP/PRAEZ wegfiltern — **62 % der echten Widersprüche durchgewunken**.

**Bias-Pattern bei Haiku 4.5:**
Haiku hat denselben Konflikt-Vermeidungs-Bias *deutlich abgeschwächt* — fängt 11 von 16 Opus-ECHTen (vs. Llamas 6 von 16). Verbleibende Misses sind bei langen Zeiträumen (2008-09, 2019-22), wo Haiku zu schnell „sequentiell möglich" annimmt.

**Domain-Wissen-Lücken bei beiden:**
Drei Fälle, in denen Opus mit Welt-Wissen entscheidet, das den Verifiern fehlt:

- **Gysi 1966 BmA-Programm** (Facharbeiter + Abitur in einem DDR-Bildungsweg) → Opus FP, Haiku/Llama ECHT
- **Hoppenstedt Obmann-Definition** (Obmann ist immer auch ordentliches Mitglied) → Opus PRAEZ, Haiku ECHT
- **Listen-MdBs-Wahlkreis-Sprache** (jeder Listen-MdB nennt seinen Wahlkreis als Vertretungsgebiet) → Opus FP, beide Verifier teilweise FP

**Architektur-Lehre:**
Source-Coherence-Verifikation ist eine **semantische Reasoning-Aufgabe mit Welt-Wissens-Anteil** — und damit grundverschieden von Schema-Match-Tasks (z.B. Stage 4 Datums-Verifier: „steht Datum X im Quelltext?"). Llama 3.3 70B reicht für Schema-Match, ist aber für Reasoning-Tasks über kompatible-vs-widersprüchliche Aussagen zu mild. **Haiku 4.5 ist hier der angemessene Verifier-Layer** bei Cost ~$1.50/1000 Cases.

**Konsequenz für die Pipeline:**

```
Stage 5 (gpt-oss-120b, Free Tier)
   ↓ raw conflict candidates
Verifier (Haiku 4.5, ~$0.06/40 Cases)
   ↓ ECHT / PRAEZ / FP / UNKLAR
Manueller Last-Check (Opus 4.7 + Mensch)
   ↓ final_verdict in DB
UI / Korrektur / Förder-Pitch
```

**Empirische Belastbarkeit für Förder-Pitch:**
Die Llama-vs-Haiku-Confusion-Matrix zeigt empirisch, dass die Modell-Wahl bei Verifier-Layern *nicht beliebig* ist und dass „wir nehmen das Free-Tier-Modell" methodisch **nicht ausreicht**, wenn die Aufgabe semantisches Reasoning verlangt. Das ist ein konkretes Argument gegen Single-LLM-Plattformen: nicht alle Probleme lassen sich mit Free-Tier-Modellen lösen, und transparente Modell-Auswahl-Begründungen sind Teil des Methodik-Vorsprungs.

**Output-Files:**
- `final-verdicts-source-coherence.jsonl` — Opus-Ground-Truth (39 Cases mit Begründung)
- `llama-verdicts-source-coherence.jsonl` — Llama 70B Verifier-Output
- `haiku-verdicts-source-coherence.jsonl` — Haiku 4.5 Verifier-Output
- `politicians.source_conflicts` (DB, JSON-Array) — pro Konflikt erweitert um `final_verdict` + `final_reason`

---

## Lehren — was wir explizit als Anti-Pattern markieren

**❌ Nicht mehr machen:**

1. **Inspectors blind bauen** ohne empirische Halluzinations-Rate-Messung — verschwendete Mühe wenn Generator schon gut ist
2. **Programmatische Detectors mit immer mehr Heuristik-Regeln verbessern** — Grenze erreicht; LLM-Verifier ist die Lösung
3. **Cross-Check via parallele Voll-Extraktion** — Specialist-Inspectors sind effizienter
4. **Schwächere LLMs für Reasoning-Tasks nutzen** — Doppelungs-Verifikation MUSS 70B+ sein
5. **Einen LLM mit langem Multi-Aspect-Prompt belasten** — Working-Memory-Limit; lieber mehrere fokussierte Specialists
6. **Generator und Verifier aus selber Modell-Familie** — geteilte Bias-Patterns, blinde Flecken

**✅ Bewährte Patterns:**

1. **Foundation first:** Generator-Qualität ist primärer Hebel; Inspectors sind Sekundär-Validierung
2. **Specialist > Generalist** bei kleinen Modellen
3. **Cascade-Architektur:** billig zuerst, teuer nur für Schwierige Fälle
4. **Modell-Familien-Diversität:** mind. 3-4 verschiedene Familien in der Pipeline
5. **Architektur-Diversität:** mind. ein Nicht-Transformer-Modell (Mamba) für unabhängige Halluzinations-Detection
6. **Empirisch entscheiden:** Stichproben-Tests bevor Vollauf
7. **Mensch + höheres Reasoning-Modell als Schluss-Validierung** bei kleinen Verifier-Output-Mengen (<50) — fängt die Edge Cases die der LLM-Verifier selbst übersieht
8. **Audit-Trail über alle Validierungs-Schichten** (`detector_version`, `verifier_version`, `human_reviewer`) — volle Nachvollziehbarkeit jeder Datenmodifikation
9. **Konservative Verifier sind besser als aggressive** — False Negatives (verpasste Doppelung) harmloser als False Positives (zerstörte Daten)

---

## Modell-Wahl-Richtlinien (extrahiert aus Empirie)

| Aufgaben-Typ | Empfohlenes Modell | Cost-Tier |
|---|---|---|
| Schema-strikte Faktenextraktion (Generator) | Claude Haiku 4.5 | paid (~$8 / 629 Datensätze) |
| Strukturierte Daten-Verifikation („ist X im Text?") | Mistral Small | Free Tier |
| Semantisch-nuancierte Klassifikation („sind A und B dasselbe?") | Llama 3.3 70B | Free Tier (begrenzte TPD) |
| Multi-Source-Vergleich (3+ Quellen synthetisieren) | gpt-oss-120b (Groq) | Free Tier |
| Reparatur (gegebener Fehler → korrekte Version) | Llama 4 Maverick (128-MoE) | Free Tier |
| Architektur-Diversität (Halluzinations-Detection) | Nemotron-Nano (Mamba) | Free Tier (NVIDIA NIM) |

---

## Phase 8 — Sonstiges-Cleanup-Pipeline (6. Mai 2026)

**Kontext:**
Spot-Check eines Bundesministerinnen-Profils (Reem Alabali Radovan) zeigte, dass die Sektion `sonstiges` der Homepage-CVs systematisch verschmutzt war: 12 Einträge, davon nur 4 echte Mitgliedschaften — der Rest waren Blog-Post-Titel des „Aktuelles"-Blocks ihrer Webseite („Stadtbild-Debatte", „75 Jahre THW", „Meine Reise in den Nahen Osten"). Diagnose über alle 392 MdBs mit `cv_homepage_json.sonstiges`-Einträgen ergab **1.421 Items insgesamt, 86 % ohne Jahresangabe** — verdächtig CV-untypisch.

**Stichproben-Inspektion (50 MdBs mit den meisten Sonstiges-Items):**
Sechs Verschmutzungs-Klassen identifiziert:

1. **Hobbies / Sport-Aktivitäten** — „Wandern", „Tanzen", „Skifahren", „Yoga"
2. **Lieblings-X** — „Sonnenblume", „Henning Mankell", „Whoopy Goldberg", „Mineralwasser (mit Sprudel!)" (Schmidt: 8 davon)
3. **News-/Blog-Posts** — Veranstaltungs-Notizen, Pressemitteilungen, Statement-Slogans
4. **Header-Pseudo-Items** — „Mitgliedschaft in Ausschüssen und Gremien" als alleiniger Eintrag
5. **Persönliche Lebensgeschichten** — „Verheiratet, zwei Kinder", „am 15. Mai geboren", „Pizza-Ausfahrer in der Goldenen Taverne"
6. **HTML-Encoding-Bugs** — „B&uuml;rgerdialoge" (nicht entkodiert)

Nicht alle Hobbies sollten raus — formal sind Hobbies CV-relevant. Aber **Lieblings-X (Steckbrief-Schnickschnack), News-Posts, Header-Items und HTML-Bugs eindeutig nicht**.

**3-Stufen-Pipeline (`scripts/cleanup-sonstiges.ts`):**

```
Stufe 1: HTML-Entity-Decode (deterministisch)
  → fixt &uuml; → ü, &auml; → ä, &szlig; → ß etc.
  → 7 Items im Vollauf gefixt

Stufe 2: Whitelist-Heuristik (deterministisch, KEEP_AUTO ohne LLM)
  Items mit "e.V.", "Mitglied", "Vorsitz", "Stiftung", "Kuratorium",
  "Ausschuss", "Beirat", "Parlamentariergruppe", "Stipendiat",
  "Freiwillige Feuerwehr", "Förderverein", "ver.di", "DLRG", "AWO" etc.
  → 781 von 1.421 Items (55 %) erkannt
  → spart ~55 % LLM-Calls

Stufe 3: Haiku-4.5-Klassifikator für die übrigen 640 Items (7 Klassen)
  KEEP-Klassen: KEEP_MITGLIEDSCHAFT, KEEP_HOBBY, KEEP_PUBLIKATION, KEEP_AUSZEICHNUNG
  DROP-Klassen: DROP_LIEBLINGS_X, DROP_NEWS_BLOG, DROP_HEADER
  Konservativer Default: bei Unsicherheit KEEP
  → 451 KEEP, 189 DROP
```

**Empirische Resultate (Vollauf 6. Mai 2026):**

| Metrik | Wert |
|---|---:|
| Items inspiziert | 1.421 |
| KEPT | 1.232 (87 %) |
| **DROPPED** | **189 (13 %)** |
| HTML-fixed | 7 |
| MdBs mit Veränderung | 108 |
| Audit-Einträge in `cv_repair_log` | 300 |
| LLM-Calls | 640 |
| Cost | **$0.94** |

**Drop-Klassen-Verteilung:**
- DROP_NEWS_BLOG: 109 (z.B. Reem 11×, Faeser 4×, Limbacher 4×)
- DROP_HEADER: 71 (Pseudo-Sektions-Header, leere Strings, Familienstand-Notizen)
- DROP_LIEBLINGS_X: 9

**Prompt-Anpassungs-Iteration:**
Erster Dry-Run auf 50 MdBs zeigte 4 Falsch-Drops (Mega-Listen, politische Funktionen, Promotion-Eintrag, „Urlaub im Wohnwagen"). Prompt um explizite KEEP-Regeln erweitert:
- „Mitgliedschaften: X, Y, Z" mit echten Vereinen → KEEP_MITGLIEDSCHAFT (Mega-Liste, nicht splitten/droppen)
- „Direktkandidat", „MdB", „Stadtrat" → KEEP_MITGLIEDSCHAFT
- „Promotion", „Diplom", „Habilitation" allein → KEEP_MITGLIEDSCHAFT (auch wenn besser in `ausbildung`-Sektion)
- „Urlaub im Wohnwagen" / „Reisen mit Familie" → KEEP_HOBBY

Zweiter Dry-Run: 15 Drops (statt 19), alle defensible.

**Audit-Trail:** Jeder Drop in `cv_repair_log` mit `repair_version='homepage-sonstiges-cleanup-v1'`, action `drop_text` oder `set_text` (für HTML-Fixes), `original_entry` als JSON-Kopie. Vollständig reversibel über Snapshot `politik.db.snapshot-pre-cleanup-sonstiges-20260505-231913`.

**Folge-Schritt:** `cv_summary` (2-3-Satz-Bio) für 157 betroffene MdBs regeneriert (Groq Free Tier, $0). Verhindert UI-Self-Contradict, dass Summary noch alte News-Posts referenziert.

**Architektur-Lehre:**
- **Hybride Pipelines (Heuristik + LLM) sparen Kosten ohne Qualitätsverlust:** Whitelist greift bei klaren Mustern (Vereinsmitgliedschaften), LLM nur für Edge-Cases. ~55 % weniger LLM-Calls bei gleicher Genauigkeit.
- **Prompt-Iteration über Stichproben:** erst kleines Dry-Run, dann Falsch-Drops klassifizieren, dann Prompt verschärfen. Vermeidet teure False-Drops im Vollauf.
- **Konservativer Default ist Hygiene:** „bei Unsicherheit KEEP" macht False-Drop schwerer als False-Keep — bei Daten-Cleanup ist das die richtige Asymmetrie.

---

## Phase 9 — UI-Render-Hygiene (6. Mai 2026)

**Kontext:**
Während Spot-Checks der korrigierten MdBs (Brandner als Beispiel) traten drei UI-Render-Bugs in `PoliticianCV.tsx` auf, die den Eindruck von Datenqualitäts-Problemen verursachten — obwohl die DB-Daten selbst sauber waren.

**Bug 1: Dedup zwischen Wikipedia-mit-Jahr und Homepage-ohne-Jahr**
Brandner-Beispiel:
- Wikipedia: `1987 / Abitur am Städtischen Gymnasium Herten`
- Homepage: `(leer) / Abitur am Städtischen Gymnasium Herten`

Beide wurden in der UI doppelt angezeigt, weil die Dedup-Schlüssel (`normalize(jahr+text)`) unterschiedlich waren. Der bestehende Fallback-Pfad (Year-Match + Substring-Check) griff nur, wenn beide Einträge ein Jahr hatten.

**Fix:** Dedup-Heuristik erweitert um Text-Ähnlichkeits-Pass über alle bestehenden Einträge:
- Jahre kompatibel (gleiches Jahr oder eines fehlt) UND
- Text-Substring-Match auf normalisierten ersten 25 Zeichen
→ Wikipedia-Eintrag mit Jahr gewinnt, Homepage-Eintrag ohne Jahr wird gemergt (mit Source-Badge)

**Bug 2: Items ohne Jahr nicht visuell von datierten Items getrennt**
Bei Brandner enthielt `politische_stationen`:
```
2021 / Gewinn des Direktmandats...
(leer) / Jugendlicher: Mitglied der Jungen Union (JU)
(leer) / Während Studium und Ausbildung in Bayern: Mitglied der CSU
(leer) / Austritt aus der CDU
```

User-Beobachtung: „macht keinen sinn, wie jugendlicher im jahre 2021" — die jahrlose Items wurden visuell als zum vorherigen Jahr (2021) gehörig gelesen.

**Fix:** Jahres-Spalte zeigt jetzt `—` (gedimmt + Tooltip „Kein Datum in den Quellen angegeben") für Items ohne Jahr — klar als „undatiert" erkennbar.

**Bug 3: Sortier-Tiebreaker bei gleichem Startjahr unintuitive**
Brandner-Beispiel:
- `1990-1994 / Studium der Rechtswissenschaft an der Universität Regensburg`
- `1990 / Ausbildung zum Industriekaufmann ... abgeschlossen`

Standard-Sort produzierte `1990-1994` vor `1990` (gleicher Start, alphabetische Reihenfolge im Tiebreak). User-Logik: ein Punkt-Datum (1990) ist *innerhalb* des Jahres 1990, ein Zeitraum (1990-1994) erstreckt sich darüber hinaus → Punkt zuerst.

**Fix:** Sortier-Tiebreaker: bei gleichem Startjahr Punkt-Daten vor Zeitraum-Daten. Hilfsfunktion `isYearRange()` erkennt mehrere 4-stellige Jahre, „seit", „bis", „ab".

**Bug 4: Jahrlose Items am Ende statt am Anfang der Sektion**
Original-Sortier-Verhalten: Items ohne Jahr werden ans Ende sortiert. User-Wunsch: am Anfang — oft frühe Lebens-Phasen („Jugendlicher: Mitglied JU") oder andauernde Mitgliedschaften ohne klares Startdatum.

**Fix:** Sort-Direction für `null`-Jahre umgedreht — undatierte Items zuerst, dann chronologisch.

**Wirkung:**
Alle vier Fixes wirken auf jeden Politiker auf beiden UI-Designs (`/` und `/design/linear`), weil `PoliticianCV.tsx` die geteilte Komponente ist. Stichprobe nach Fix:

| MdB | jahrlose Items mit „—" |
|---|---:|
| Anja Weisgerber | 1 |
| Silke Launert | 9 |
| Reem Alabali Radovan | 17 (vor Sonstiges-Cleanup; nach Cleanup: 4) |
| Karl Lauterbach | 0 |
| Stephan Brandner | 7 |

**Architektur-Lehre:**
- **UI-Render-Bugs können wie Daten-Bugs aussehen:** Brandner-Beobachtung war ursprünglich „Daten doppelt-gemoppelt", war aber Render-Verhalten. Vor Daten-Cleanup immer UI-Layer prüfen.
- **„—" als expliziter Marker statt leerer Spalte:** kostet 5 Code-Zeilen, eliminiert eine ganze Klasse von Lese-Fallen.
- **Tiebreaker-Sortierung muss menschlicher Lese-Logik folgen:** bei gleichem Startjahr ist Punkt-vor-Zeitraum intuitiv, alphabetisch nicht.

---

## Kosten-Bilanz

| Phase | Generator-Cost | Annotation |
|---|---|---|
| 1 Naiv (Llama 8B) | $0 | aber ~30% Halluzinations-Rate = unbrauchbar für Bürger-Information |
| 2 Multi-LLM-Konsens | $0 (alles Free Tier) | + ~$0.50 für Stage 4 V2-Tiebreaker (Haiku) |
| 4-6 Specialist-Cascade | ~$8 (Generator) + $0 (alles andere) | für Production-reife Datenqualität |
| 7 Source-Coherence Verifier-Cascade | $0 Stage 5 (Groq Free) + $0.06 Haiku-Verifier (39 Cases) | + Opus 4.7 manuelle Review als Ground Truth |
| 8 Sonstiges-Cleanup-Pipeline | $0.94 Haiku-Klassifikator (640 Calls) | 189 Drops aus 1.421 Items, 108 MdBs |

**Gesamt für 629 Bundestag-MdBs CVs: ~$9** — extrem günstig für 7 unabhängige Validierungs-Schichten + Source-Coherence-Verifikation + Sonstiges-Cleanup.

---

## Was noch kommt (Roadmap)

**Kurzfristig (April-Mai 2026):**
- Wikipedia-Vollauf mit Haiku abschließen (gerade laufend)
- Inspector-Vollauf an alle 629 MdBs → echte Halluzinations-Rate von Haiku messen
- Cascade-Repair (Maverick → Haiku Fallback) implementieren
- Homepage-Pipeline auf Llama 70B umstellen (zweite unabhängige Quelle)

**Mittelfristig:**
- **Reden-Pipeline** mit demselben Specialist-Cascade-Pattern (Make-or-Break-Feature)
- Themen-Klassifikation, Tonalitäts-Analyse, Synopse Aussage-vs-Vote
- Sidejobs-Pipeline (Conflict-of-Interest-Matrix)

**Langfristig:**
- Mandats-Historie über mehrere Wahlperioden (Friedrich Merz war auch 1994-2009 MdB)
- Frühere Wahlperioden via DIP API + abgeordnetenwatch backfillen

---

## Methodik-Story für Förderer

> Wir extrahieren strukturierte politische Daten (Lebensläufe, Reden, Sidejobs) aus offenen Quellen mit einer **Specialist-Cascade-LLM-Pipeline**:
>
> - **Anthropic Claude Haiku 4.5** generiert mit JSON-Schema-Validation aus Wikipedia
> - **Programmatische Heuristiken** filtern offensichtliche Probleme (Doppelungen, Format-Fehler)
> - **Mistral Small + Llama 3.3 70B** (zwei unabhängige Modell-Familien) verifizieren semantisch
> - **NVIDIA Nemotron-Nano** (Mamba-Architektur, nicht-Transformer) als architektonisch-diverser Halluzinations-Detector
> - **Llama 4 Maverick** (128-Expert MoE) repariert nur confirmed Fehler
> - **gpt-oss-120b** vergleicht 3 unabhängige Quellen (Wikipedia, Bundestag-Bio, Homepage) auf Coherence
>
> Die Architektur ist **methodisch transparent**: jede Aussage hat einen dokumentierten Audit-Trail mit der Modell-Verkettung, die sie validiert hat. Das System ist **empirisch validiert**: in unseren Tests fängt der Llama-70B-Verifier 45% der False Positives, die programmatische Methoden produzieren — Subtilität wie „SPD-Unterbezirk Hannover-Land vs. Region Hannover" oder „Bezirks- vs. Landesvorsitzender" wird erfasst, die regelbasierte Methoden übersehen.
>
> Kosten für 629 Bundestag-MdBs: ~$8 (einmalig). Skaliert linear für künftige Datenarten.

---

*Lebendes Dokument. Letzte Aktualisierung: 2026-04-30 nach Phase-6-Validierung.*
