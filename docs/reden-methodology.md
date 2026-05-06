# Reden-Pipeline — Methodik & Evolution

**Stand:** 2026-05-05
**Pendant zu:** `docs/methodology-evolution.md` (CV-Pipeline)
**Zweck:** Dokumentation der Methodik für die LLM-Analyse von Bundestags-Plenarreden — analog zur CV-Pipeline, aber mit grundsätzlich anderem Anforderungsprofil.

---

## 0. Warum Reden methodisch anders sind als CVs

Die CV-Pipeline und die Reden-Pipeline lösen ähnlich aussehende Aufgaben (LLM-Extraktion strukturierter Daten aus Text), aber die kritische Failure-Mode ist eine ganz andere:

| Aspekt | CV-Pipeline | Reden-Pipeline |
|---|---|---|
| **Quellmaterial** | Faktisch (Wikipedia, Homepages) | Politisch-rhetorisch |
| **Failure-Mode 1** | Halluzination — Daten/Stationen erfinden | Inhaltliche Verzerrung — Forderungen erfinden, weglassen, umdeuten |
| **Failure-Mode 2** | Quelle-Konflikt — Wikipedia vs. Homepage widersprüchlich | **Bias** — Wertung in eine politische Richtung durch Wortwahl, Quote-Auswahl, Tonalitäts-Klassifikation |
| **Wahrheits-Kriterium** | Schwarz/weiß: stimmt, stimmt nicht | Mehrdimensional: faktisch korrekt UND wertungsfrei |
| **Validierung** | Wiki-Substring-Match, Mistral-Verdict, Llama-Verifier | Quote-Substring-Match, **Cross-Model-Bias-Inspector** |

**Konsequenz:** Die CV-Pipeline kann mit „Faktentreue" als einzigem Quality-Maßstab leben. Bei Reden reicht Faktentreue NICHT — eine sachlich korrekte Zusammenfassung kann immer noch parteiisch gefärbt sein durch:

- wertende Verben (`skandalisiert`, `polarisiert`, `entlarvt` statt `fordert`, `kritisiert`)
- Quote-Auswahl (nur die polemischsten Stellen einer Partei zitieren)
- Tonalitäts-Klassifikations-Bias (Mit-derselben-Logik klassifizieren? Oder „AfD = polemisch prior"?)
- LLM-eigene Frame-Bewertung statt Wiedergabe der Sprecher-Frames

Das Projekt-Prinzip ist explizit: **100% Fakten, partei-neutral**. Schieflage in irgendeine Richtung ist Anti-Ziel.

---

## 1. Pipeline-Architektur — Smart Haiku Cascade

Architektur-Plan: `docs/plan-haiku-opus-cascade.md`. Kurz-Beschreibung:

**Wahl Generator-Modell: Haiku 4.5 (statt Opus 4.7)**
- Begründung: 3-Wege-Vergleich auf 9 Reality-Check-Reden zeigte Opus klar besser bei Tonalität-Erhalt + Halluzinations-Vermeidung, aber 15× teurer ($390 vs $26 für 10k Segmente). Smart Haiku Cascade liefert ~90% der Opus-Qualität durch architektonische Tricks statt teurere Modelle.

**Architektonische Tricks:**
1. **XML-Tonalitäts-Marker** programmatisch aus `<kommentar>`-Tags extrahieren (Beifall/Zwischenrufe nach Partei) — kostet $0
2. **Tool-Use mit JSON-Schema-Enum-Lock** — Pflichtfelder `forderungen[]`, `wörtliche_zitate[]`, `framing_marker[]`, `tonalität` mit harter Enum-Validierung
3. **Prompt Caching** für langen System-Block (Methodologie-Datei) — drückt Input-Cost um ~80% / Cache-Hit-Rate empirisch 88.88%
4. **ASCII-Keys im Tool-Schema** (`tonalitaet`, `woertliche_zitate`) statt deutscher Umlaute → keine Encoding-Probleme im Tool-Use
5. **Methodology-Asset** als gecachter System-Prompt: `docs/summarization-methodology.md`

**Validierung post-hoc:**
- Quote-Validierung: jedes wörtliche Zitat MUSS Substring im Original sein (Substring-Match nach Schreibung-Normalisierung)
- Anti-Hallucination-Flags: das Modell muss selbst H1-H9 dokumentieren wo sie ausgelöst wurden

**Output-Schema** (Tabelle `speech_analyses_v2`):
- `reden_typ` (A-K, ggf. Mischung)
- `tonalitaet` (eines von 11 Enum-Werten)
- `forderungen_json`, `woertliche_zitate_json`, `framing_marker_json`, `rhetorische_mittel_json`, `konkrete_zahlen_json`, `anti_hallucination_flags_json`
- `zusammenfassung_2_saetze`
- Audit-Felder: `methodology_sha`, `batch_id`, Token-Counts, `tonalitaet_original` (für Drift-Fixes)

---

## 2. Methodologie-Evolution v1 → v2

### v1 (2026-04-30, biased)

**Erstellt von Opus 4.7** nach Analyse von 30 stratifizierten Reden + Reality-Check gegen Llama 8B. Stellt sich im Audit heraus: hat **strukturelle Partei-Anker** (siehe Sektion 3 unten).

**Prozess:**
- 9.913 Reden in 2 Anthropic-Batches submitted (2026-05-01)
- Batch-Cost: $41.82 (vs. ~$84 Live-Rate, Cache-Hit 88.88%)
- 9.913/9.913 ok, 0 Errors
- Quote-Validation: 90.90% (57.598 / 63.366 Quotes valid)

### v2 (2026-05-05, neutralisiert)

Nach Audit (siehe Sektion 3) komplett neutralisiert. Unter v2 wurden noch keine Reden re-batched (User-Entscheidung: $42 nicht erneut ausgeben). v2 wird ab Sitzung 76 (06.05.2026 ff.) für neue Batches aktiv.

**Konkret geändert (v1 → v2):**
- Reden-Typen-Namen: `Anti-AfD-Konfrontations-Rede` → `Konfrontativ-belegende Auseinandersetzung`; `Linke-Sozialgerechtigkeits-Rede` → `Sozialgerechtigkeits-/Anklage-Rede`; etc.
- Tonalitäten: `polemisch_sachlich` (war „Fakten plus AfD-Frames") → „Fakten plus deutliche ideologische Frames jeglicher Richtung"; `konfrontativ_belegend` (war „Anti-AfD-Konfrontation") → „Belegte Konfrontation mit der Position eines anderen, partei-unabhängig"
- Beispiel-Sprecher in Tonalitäts-Tabelle auf cross-party-Verteilung erweitert
- Neue Heuristik H9: keine eigene Bewertung in der Summary
- Grundprinzip 6 + 7 hinzugefügt (Partei-neutrale Klassifikation; Beschreiben, nicht bewerten)
- Tonalitäts-Hinweise in Reden-Typen-Beschreibungen auf die exakten 11 Enum-Werte gemappt — vorher freie Texte wie „pointiert-süffisant", was Quelle der `pointiert_*`-Drift im v1-Batch war

**Backup v1:** `docs/summarization-methodology.v1-2026-04-30.md.bak`

---

## 3. Drift-Fix 2026-05-05

Im Vollauf-Batch (v1-Methodology) sind 33 Reden mit invented Tonalitäten durchgerutscht — Modell-Drift trotz Tool-Use-Schema-Lock.

**Klassen:**
- 18 Typo/Schreibvarianten (`defensive_pragmatisch`, `social_anklagend`, `staatsmännisch` etc.) — deterministisch korrigierbar
- 13 invented Modifier (`pointiert_*`-Familie, `nachfragend`, `konstruktiv_kritisch` etc.) — pro Rede manuell auf Inhalt geprüft

**Erklärung:** Methodology-v1 hatte Partei-Anker in `polemisch_sachlich` (AfD-spezifisch) und `konfrontativ_belegend` (Anti-AfD). Reden, die nicht in diese Prototypen passten (z.B. Demuth/CDU gegen AfD, Piechotta/Grüne gegen CDU), bekamen vom Modell keine passende Klasse — der Drift in `pointiert_*` ist die direkte Konsequenz dieses Bias.

**Fix:** Skript `scripts/fix-tonalitaet-drift.ts` mit:
- DB-Snapshot vor Lauf
- Spalte `tonalitaet_original` für Rollback (NULL für unveränderte 9.880 Reden)
- JSONL-Audit (`tonalitaet-drift-fix-2026-05-05.jsonl`) mit Begründung pro Rede
- Mapping-Logik nach v2-Methodology (Paul/AfD bekommt `konfrontativ_belegend`, da neutrale Definition der Klasse das zulässt)

**Resultat:** 31 Reden gemappt, 0 Drift-Werte übrig, 100% in den 11 Enum-Werten.

**Lessons learned:**
- JSON-Schema-Enum im Tool-Use ist nicht vollständig dicht — bei <0.4% Drift kann das Modell trotzdem aussteigen
- Methodology-Bias produziert Klassifikations-Drift (Partei-Anker im Prompt → Modell findet keine passende Klasse für Cross-Party-Konstellationen)
- Audit-Spalte (`tonalitaet_original`) ist billiger und robuster als JSONL-only-Audit, weil SQL-Queries möglich sind

---

## 4. Bias-Audit (in Arbeit, 2026-05-05)

### Methodische Frage

Naiver Audit-Ansatz wäre: „messe Tonalitäts-Verteilung pro Partei, prüfe auf Asymmetrien". Das ist **falsch**, weil empirische Realitäten (z.B. AfD- und Linke-Reden tendieren tatsächlich zu mehr Polemik als CDU/SPD-Standardbeiträge) als Bias geflaggt würden. Asymmetrische Verteilung ist NICHT automatisch Bias — sie kann akkurate Klassifikation einer empirisch asymmetrischen Realität sein.

**Bias entsteht spezifisch durch:**
1. **Wording-Bias in Zusammenfassungen** — wertende Verben (sollten in JEDER Summary 0 sein)
2. **Per-Case-Klassifikations-Fehler** — Modell wendet Partei-Prior an statt Inhalt zu prüfen (z.B. sachliche AfD-Rede falsch als `polemisch`)
3. **Quote-Selection-Bias** — systematisch andere Register-Auswahl je nach Partei
4. **Frame-Detection-Asymmetrie** — Frame-Glossar fängt CDU/SPD-Muster nicht so rigoros wie AfD-Muster

Aggregat-Statistik kann nur Typ 1 und 4 messen — Typ 2 und 3 brauchen per-case Vergleich Original ↔ Summary.

### 3-Schicht-Audit-Design

**Schicht 1 — Strukturelle Indikatoren** (in Arbeit, $0)
- Wertende-Verben-Frequenz in `zusammenfassung_2_saetze` pro Partei (Wort-Liste: `skandalisiert`, `polarisiert`, `entlarvt`, `instrumentalisiert`, `demaskiert`, `polemisiert`, `verharmlost`, `relativiert`, `fabuliert`)
- Deskriptiv-aggressive Verben (`attackiert`, `wirft vor`, `behauptet`, `unterstellt`) — kontextabhängig, nur Asymmetrie-Auffälligkeit beobachten
- Quote-Längen-Verteilung pro Partei — unausgewogen-kurze Quotes können Schlagwort-Picking sein
- H-Flag-Rate pro Partei (welche Anti-Halluzinations-Heuristiken werden wo ausgelöst)

**Schicht 2 — Per-Case-Inspector mit Cross-Model-Konsens** (geplant)
- Stratifiziertes Sample (300 Reden, ~50 pro Major-Partei)
- Inspector A: Llama 3.3 70B (DeepInfra paid, ~$2)
- Inspector B: Mistral Small oder GPT-OSS 120B (Groq Free)
- Andere Modell-Familien als Generator (Haiku 4.5) → Bias-Confirmation vermeiden
- Strukturierte Bewertung pro Rede:
  1. Klassifikations-Akkuratheit gegeben den Inhalt (0=akkurat, 3=falsch)
  2. Wortwahl fügt Polemik hinzu, die im Original nicht da ist (0=nein, 3=stark)
  3. Wortwahl sanitisiert Polemik, die im Original deutlich da war
  4. LLM bewertet den Sprecher (positiv/negativ) durch eigene Wertung
- Konsens: high-confidence-Bias = beide Inspectors flaggen ≥2

**Schicht 3 — Manueller Spot-Check** (geplant)
- Top 15-20 high-confidence flagged Reden gegen Original lesen
- Validiert Inspector-Konsens — wenn nur 30% der flagged Reden tatsächlich biased, Inspector über-sensibel

### Restrisiken (ehrlich angegeben)

- **LLM-Inspector kann eigene RLHF-Biases haben** — Cross-Model-Konsens hilft, eliminiert es nicht
- **Echte Sicherheit** gibt nur externe Validierung durch Politikwissenschaftler/Journalisten (im NEXT-SESSION als Förder-Antrag-Vorbereitung empfohlen)
- **Subtile Wording-Bias** kann auch von 3 LLM-Inspectors übersehen werden — manuelle Stichprobe ist unverzichtbar

### Was nicht gemessen wird (und warum)

- **Aggregat-Verteilung der Tonalitäten pro Partei** — sagt nichts über Bias aus, wenn die Realität asymmetrisch ist
- **Frame-Glossar-Symmetrie erzwingen** — würde falsche Symmetrie schaffen; das Glossar ist deskriptiv
- **„Sentiment" pro Partei** — generic German sentiment-Tools sind politisch ungeeicht und liefern keine belastbaren Resultate

---

## 5. Cost-Ledger

| Phase | Cost | Datum |
|---|---:|---|
| Smoke-Test (40 Reden, 3 Test-Modi) | $0.39 | 2026-05-01 |
| Vollauf-Batch (9.913 Reden, Haiku 4.5) | $41.82 | 2026-05-01 |
| Drift-Fix | $0 | 2026-05-05 |
| Methodology-Refactor v1→v2 | $0 | 2026-05-05 |
| Bias-Audit Schicht 1 | $0 | 2026-05-05 (in Arbeit) |
| Bias-Audit Schicht 2 (Plan) | $0-3 | 2026-05-05 (in Arbeit) |
| **Total bisher** | **~$42** | — |

Vergleich: pure Opus-Pipeline für 9.913 Reden hätte ~$390 gekostet (laut 9-Reden-Vergleich-Hochrechnung, Smart Haiku Cascade liefert ~90% davon für ~10%).

---

## 6. Bias-Audit-Pipeline (Stand 2026-05-05, abgeschlossen)

Vollständige Pipeline und Endergebnisse:

### Phasen

1. **Schicht 1 — Strukturell** (`scripts/bias-audit-layer1.ts`): mechanische Wort-Frequenz-Analyse auf alle 9.864 Reden. Befund: 222 Reden enthalten wertende Verben aus einer Liste von 16 Begriffen.
2. **Manueller Audit Stichprobe 15** (`scripts/bias-audit-manual-sample.ts`): 47% echte Bias-Rate.
3. **Manuelle Klassifikation 120 Reden**: ~62% Bias-Rate über alle Parteien hinweg.
4. **Broad Sample 200 Reden ohne wertende Verben** (`scripts/bias-audit-broad-sample.ts`): findet zusätzliche Patterns (Frame-Annotation, Meta-Kommentare zur Rhetorik, Distanz-Markierungen) bei ~25%.
5. **Llama-3.1-8B-Inspector auf Tier-A-Wortliste** (`scripts/bias-audit-tier-a-only.ts`): 425 Treffer, 400 als LLM-Editorialisierung klassifiziert (94%).
6. **Methodology v2.1** (`docs/summarization-methodology.md`): Heuristik H10 (Selbst-Reflexion) + Pflichtfeld `neutralitaets_self_check` im Tool-Schema (Konfidenz + Liste eigener wertender Wörter).
7. **Re-Batch der 400 mit v2.1** (`scripts/batch-resubmit-bias-corrections.ts`): submitted 2026-05-05 18:33 UTC, ended 18:56 UTC, 400/400 ok, Cost $3.78 (Cache war kalt, höher als geschätzt $1.90). In neue Tabelle `speech_analyses_v2_corrections`.
8. **Klassen-Aufschlüsselung** der 400 v2.1-Outputs nach Konfidenz × externer Wortliste-Validierung:
   - **A** (Wortliste-Hit + Haiku-Konfidenz mittel/niedrig/null): 68 Reden
   - **B** (Wortliste-Hit + Haiku-Konfidenz hoch — Self-Bias-Confirmation): 74 Reden
   - **C** (kein Wortliste-Hit + Haiku unsicher): 39 Reden
   - **D** (kein Wortliste-Hit + Self-Check fehlte): 68 Reden
   - **E** (Wortliste-clean + Haiku hoch): 151 Reden — vermutlich sauber
9. **Manueller Review Klasse A+B** (Opus 4.7): von 142 Reden waren 91 Sprecher-Worte (legitim) und 51 echte LLM-Editorialisierung. 47 wurden mechanisch via Mapping korrigiert (`scripts/build-final-bias-fixes.ts`), 4 mit manuellem Override für Grammatik-Brüche. Resultat in DB-Spalte `speech_analyses_v2_corrections.zusammenfassung_2_saetze_final`.
10. **Stichproben Klasse C+D** (8+8 Reden): ~13% Restrisiko — Synonyme die nicht in Tier-A-Liste sind (z.B. „Hypocrisy") und Pattern B (Meta-Kommentare wie „implizite Anklage von Xenophobie").

### Endergebnis

| Phase | Reden | Bias-Reduktion |
|---|---:|---:|
| v1-Vollauf-Bias (Tier-A-Wörter) | 400 | — |
| v2.1-Re-Batch reduziert auf | 142 | 64% |
| Davon Sprecher-Worte (legitim) | 91 | — |
| Mechanisch / manuell gefixt | 51 | — |
| **Restrisiko (C+D + Sprecher-Worte) — dokumentiert** | **~14** | **87% Gesamt-Reduktion** |

### DB-Architektur (Audit-Trail)

- `speech_analyses_v2.zusammenfassung_2_saetze` — v1 Original (unangetastet)
- `speech_analyses_v2_corrections.zusammenfassung_2_saetze` — v2.1 Re-Batch
- `speech_analyses_v2_corrections.zusammenfassung_2_saetze_final` — v2.1 + manuelle Korrektur
- `speech_analyses_v2_corrections.fix_source` — `mapping` | `manual_override`
- UI/Konsumenten: `COALESCE(c.zusammenfassung_2_saetze_final, c.zusammenfassung_2_saetze, v2.zusammenfassung_2_saetze)`

### Erweiterte Wortliste für zukünftige Sitzungen

Aus dem Stichproben-Befund Klasse C/D — sollten dem Filter hinzugefügt werden für nächsten Audit:

**Synonyme zu Tier-A:**
- `Hypocrisy`, `Hypokrisie`, `Hypocrite`, `hypokritisch`
- `Scheinheiligkeit`
- `Pharisäertum`

**Pattern-B-Phrasen (Meta-Kommentare):**
- `implizite Anklage von`, `implizite Kritik`
- `rahmt als`, `Sein Frame ist`, `Frame: ...`
- `Botschaft ist`, `Pointe ist`, `Strategie ...`

Diese Liste in den nächsten Bias-Audit-Pass aufnehmen (Sitzung 76+).

## 7. Bekannte Restrisiken (transparent)

1. **Pattern B (Meta-Kommentare)** — strukturelle LLM-Limitierung: alle untersuchten Modelle (Haiku 4.5 als Generator, Llama 3.1 8B als Inspector) erkennen Meta-Kommentare zur Rhetorik nicht zuverlässig. Restrisiko ~3-5% der Gesamtmenge. **Lösung:** externe menschliche Validierung im Förder-Antrag-Setup.
2. **Synonyme außerhalb Tier-A-Liste** — die Wortliste fängt nicht alle Bias-Indikatoren. Erweiterung in jedem neuen Audit-Pass nötig.
3. **Self-Check unzuverlässig** — Haikus `neutralitaets_self_check`-Feld wurde in 26% der Fälle (104/400) trotz Schema-Required nicht gesetzt; Konfidenz „hoch" garantiert keine Sauberkeit (74/400 hatten trotzdem Wortliste-Hit). Self-Check ist nützliches Signal, aber nicht autonom verlässlich.

## 8. Offene Punkte

- [ ] Sitzung 76 nachziehen (06.05.2026 ff.) — neue Reden mit v2.1-Methodology batchen, erweiterte Wortliste anwenden
- [ ] UI-Integration: `speech_analyses_v2_corrections` mit COALESCE-Fallback in `politiker/[id]` anzeigen
- [ ] Topic-Klassifikation als zweite Analyse-Layer (Multi-Label, partei-neutral)
- [ ] Externe Validierung durch Politikwissenschaftler/Journalisten vor Förder-Antrag (10-20 Reden blind, gegen Selbst-Validierungs-Vorwurf)
- [ ] Killer-Feature: Synopse Aussage-vs-Vote pro MdB

---

## 7. Versionsgeschichte

- **2026-05-05** Initial: Reden-Pipeline-Methodik dokumentiert; v1→v2 Evolution; Drift-Fix; Bias-Audit-Plan
