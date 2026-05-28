# Berlin Sitzungs-Pipeline — Methodik & Anti-Patterns

Source-of-Truth für die Pipeline „PDF-Plenarprotokoll → strukturierte Sitzungs-Detail-Seite". Alle Schritte mit Begründung, Quellen-Verweisen auf die echten LLM-Prompts und einer Liste der Fehler, die wir während des 27. Mai 2026 Aufbau-Sprints gemacht haben — als Anti-Pattern-Library für die Skalierung auf alle 80 Sitzungen.

## Pipeline-Übersicht

```
PDF (PARDOK)
   │
   ▼
1. Seed Speeches   ──── scripts/seed-berlin-speeches.ts
   │  Extrahiert Sprecher-Wechsel, schreibt berlin_speeches
   │
   ▼
2. Fix TOP-Marker  ──── scripts/fix-berlin-top-markers.ts
   │  Re-assigns top_marker per Body-Header (statt TOC)
   │  → SIEHE Anti-Pattern §1
   │
   ▼
3. LLM-Reden-Analyse ── scripts/batch-submit-berlin-reden.ts
   │  Haiku 4.5 → berlin_speech_analyses (zusammenfassung_2_saetze,
   │  tonalitaet, konkrete_zahlen, forderungen, woertliche_zitate)
   │  Prompt: src/lib/berlin-reden-prompts.ts
   │  Methodik-Doc: docs/summarization-methodology-berlin.md
   │
   ▼
4. Clean LLM-Drift   ── scripts/_clean-berlin-zusammenfassung-leaks.ts
   │  Strippt Tool-Output-Reste (</zusammenfassung_2_saetze> + JSON-Body)
   │  → SIEHE Anti-Pattern §3
   │
   ▼
5. Vote-Extraktion   ── scripts/rerun-berlin-votes.ts
   │  extractVoteEvents → Live-API Haiku → berlin_votes
   │  Prompt: src/lib/berlin-votes-prompts.ts (SYSTEM_PROMPT)
   │  → SIEHE Anti-Pattern §2, §4
   │
   ▼
6. Post-Process     ── scripts/_post-process-vote-outcomes.ts
   │  Heuristisches Outcome-Correction über Schluss-Formel-Regex
   │  → SIEHE Anti-Pattern §5
   │
   ▼
7. TOP-Synthesen     ── scripts/generate-berlin-top-summaries.ts (oder
   │  batch-berlin-top-summaries.ts für >5 TOPs)
   │  Haiku 4.5 v4-Prompt → key_facts mit Wikipedia-Refs
   │  Prompt: SYSTEM_PROMPT direkt im Skript (TODO: ausziehen)
   │  → SIEHE Anti-Pattern §6
   │
   ▼
8. UI                ── src/app/design/linear/parlamente/berlin/sitzung/[nr]/page.tsx
      Stories-Variant: TOC + Abstimmungen-Block + TOP-Detail-Cards
      Bidirektional verlinkt (Sitzung ↔ DS ↔ Vote)
```

## Validation-Layer

Ground-Truth-Files: `scripts/ground-truth/votes-sitzung-<N>.ts`
Compare-Skript: `scripts/_compare-votes-s85.ts`

**Reihenfolge**: Ground Truth schreiben **bevor** Pipeline läuft, nicht nachträglich. Aus Phase-1-Lehre: ohne Ground Truth tappt man im Dunkeln.

## Anti-Patterns aus dem Mai-2026-Sprint

Jeder Punkt: **Was war falsch · Was war die Ursache · Wie verhindern**.

### §1 TOP-Marker-Mapping aus TOC abgeleitet

**Falsch**: `seed-berlin-speeches.ts:topAtPage()` ordnete Reden ihren TOPs basierend auf der **TOC-Reihenfolge nach Marker-Nummer** zu. Bei Sitzung 85 endeten **alle 165 Reden ab TOP 21 unter „Bezahlbare-Mieten-Gesetz"** — obwohl die meisten Reden in Wahrheit zu TOPs 24, 25, 27, 28, 33, 35, 40, … gehörten.

**Ursache**: Berlin springt nicht-monoton durch die TOPs (Prioritäten unter TOP 3.X rufen TOPs 21/26/27/77/79 vor; Konsenslisten verschieben Wahlen). Die TOC-Marker-Reihenfolge ist NICHT die Behandlungs-Reihenfolge.

**Fix**: Body-Text nach `^lfd. Nr. N:` durchsuchen (kanonischer TOP-Aufruf), optionalen `^Tagesordnungspunkt M$` als echten Marker erkennen. Pro Rede den letzten Header vor `start_line` nehmen. Siehe `fix-berlin-top-markers.ts:parseBodyTopHeaders`.

**Verhindern**: Bei jedem PARDOK-Parser zuerst die **echte Reihenfolge im Body** nehmen, nicht die TOC-Sortierung.

### §2 Vote-Trigger-Regex zu eng (literal Space)

**Falsch**: `/bitte ich(?:[^.]{0,30})um das Handzeichen/g` — literal Space zwischen „um das" und „Handzeichen".

**Ursache**: Im PDF gibt's Worttrennungen über Zeilenumbrüche, z. B. „um das\nHandzeichen". Bei Sitzung 85 trafen **nur 4 von 17 echten Triggers** den Regex.

**Fix**: `\s+` statt literal Space: `/bitte\s+ich(?:[^.]{0,30})um\s+das\s+Handzeichen/g`

**Verhindern**: Bei PDF-Text-Regex-Matching IMMER `\s+` für Whitespace, **nie** literal Space. Auch `-\n` (Soft-Hyphen-Wort-Bruch) ist eine Falle — siehe Normalize-Helper im Post-Processing.

### §3 LLM-Tool-Output-Drift in Feld-Werten

**Falsch**: `zusammenfassung_2_saetze` in berlin_speech_analyses enthielt am Ende der Zusammenfassung den Tool-Output-Tag-Müll: `…beansprucht breite Zustimmung im Plenum.</zusammenfassung_2_saetze> <parameter name=\"neutralitaets_self_check\">{...}`. **2783 von 10414 Reden (~27 %) betroffen.**

**Ursache**: Haiku 4.5 schreibt manchmal Tool-Use-XML-Tags direkt in den Feldwert mit rein. Tritt nicht 100 % auf, aber regelmäßig genug (~1/4 der Outputs). Der raw_tool_input_json ist **genauso schmutzig** wie die DB-Spalte — das Drift kommt direkt vom Modell, nicht vom Parser.

**Fix**: Post-Processing-Skript `_clean-berlin-zusammenfassung-leaks.ts` — sucht Drift-Marker (`</zusammenfassung_2_saetze>`, `<parameter name=…>`, `neutralitaets_self_check`), schneidet ab vor dem ersten Treffer. 7 Marker-Varianten + Trailing-Trim für `"`/`,`.

**Verhindern**: Bei JEDEM LLM-Tool-Output-Feld **post-process strippen**. Außerdem dieselbe Pipeline-Validation auf Bundestag-Reden anwenden (vermutlich auch betroffen — separater Track).

### §4 Drucksachen-Zuordnung pro Vote unvollständig

**Falsch**: Bei einer Beschlussempfehlungs-Abstimmung (z. B. Vote über Antrag 19/0924 gemäß Beschlussempfehlung 19/3132) extrahierte das LLM nur **eine der beiden DS**. Auf der 19/3132-Detail-Page tauchte die Abstimmung dann nicht auf, weil 19/3132 nicht im `drucksache_dbids_json` stand.

**Ursache**: Der ursprüngliche Vote-Prompt fragte nach „dem Vote-Gegenstand", das LLM pickte die formal-abgestimmte DS (Antrag), ignorierte die referenzierte Beschlussempfehlung.

**Fix**: Prompt um Pflicht-Regel 4a erweitert: „**BEIDE** Nummern (Antrag + Beschlussempfehlung) ins `drucksache_nrn`-Array". Siehe `src/lib/berlin-votes-prompts.ts:140-155`.

**Verhindern**: LLM-Output-Schemata aus Sicht der **Reverse-Lookups** denken: jede DS, die in einem Vote-Kontext auftaucht und über die der Nutzer später auf die Detail-Page klicken könnte, muss in den Vote-Refs sein.

### §5 Outcome-Drift bei dicht-gepackten Votes

**Falsch**: Vote 8 (Sitzung 85, Pflegenotfall-Telefon Koalitions-Antrag) wurde von Haiku als `annahme_geaendert` markiert, obwohl Schluss-Formel im PDF eindeutig „Damit ist der Antrag angenommen" sagt.

**Ursache**: Vote 7 davor (Änderungsantrag 19/3008-1) und Vote 8 sind im 2000-Z. Kontext-Snippet beide enthalten. „Änderungsantrag abgelehnt" steht direkt vor Vote 8 → kontaminiert das LLM-Kontext-Fenster → Haiku assoziiert „Änderungen" mit Vote 8.

**Fix**: Heuristisches Post-Processing in `_post-process-vote-outcomes.ts`:
- Trigger-Position erkennen (Pos ~500 im Snippet)
- Erste Schluss-Formel **nach** Trigger als Outcome-Anker
- „mit Änderungen"-Wording im Pre-Trigger-Bereich (Antrag-Einleitung)
- Korrektur nur bei klarem Mismatch (z. B. `annahme_geaendert` ohne Änderungs-Wording → `annahme`)

**Verhindern**: Bei Cluster-Votes IMMER mit Heuristik-Layer absichern. LLM ist eine Quelle, nicht die Wahrheit. **Quality-Score gegen Ground-Truth** als Regression-Gate vor Skalierung.

### §6 Greedy-Regex frisst zu viel

**Falsch**: `replace(/^Priorität der Fraktion [^:]+ /, "")` im TOC sollte den Prefix entfernen — fraß aber bis zum letzten Space. Bei TOP 27 blieb nur „und" übrig.

**Ursache**: `[^:]+ ` ist greedy. Wenn der Titel kein `:` enthält, matched es bis zum letzten Whitespace.

**Verhindern**: `[^X]+` Patterns sind in PDFs problematisch. Lieber **bekannte Token-Liste** matchen (Fraktion-Namen explizit), oder gar nicht prefix-strippen und stattdessen mit `line-clamp` visuell verkürzen.

### §7 TOP-Title-Extractor zu engzeilig

**Falsch**: `parseBodyTopHeaders` limitierte Titel auf 3 Body-Zeilen. TOP 27 hat 4 Title-Zeilen → letzte Zeile „weiterer Rechtsvorschriften" abgeschnitten.

**Fix**: Auf 4 Zeilen erhöhen + STOP-Pattern erweitert (`Ich rufe`, `Für die Besprechung`, `Nun können`, `Beginn:`, `Wir kommen`).

**Verhindern**: STOP-Pattern-Liste bewusst pflegen statt Zeilen-Limit drücken.

### §8 LLM-Array-Drift (`key_facts` als String)

**Falsch**: TOP 40 in Sitzung 85 hatte `key_facts` als JSON-stringifizierten String im Tool-Output, nicht als Array. Result: leere key_facts.

**Ursache**: Bekannter Haiku-4.5-Drift (~3 %, siehe Memory `feedback-llm-array-drift`). Manchmal sendet Haiku ein Array-Feld als Text.

**Fix**: Retrieve-Code: wenn `typeof kfRaw === "string"` → `JSON.parse` versuchen. Bei Quote-Drift im inneren JSON (typografische Anführungszeichen `„unseriös\"`) zusätzlich Prompt-Anweisung „KEINE typografischen Anführungszeichen im text-Feld".

**Verhindern**: Bei ALLEN LLM-Array-Feldern im Retrieve immer `if string, parse else use as is` Fallback. Plus Prompt-Anti-Quote-Anweisung.

### §9 Vote-Outcome-Enum zu granular für UI

**Falsch**: `annahme_geaendert` als eigener Outcome in der UI angezeigt → User-Verwirrung, weil dasselbe wie `annahme` aus Bürger-Sicht („wurde angenommen").

**Fix**: Display-Layer kollabiert `annahme` + `annahme_geaendert` → „Angenommen". Detail-Information „in geänderter Fassung" bleibt nur auf DS-Detail-Page.

**Verhindern**: **Datenmodell-Enum ≠ UI-Label-Granularität**. Im Doc explizit angeben, welche Outcome-Werte zur selben UI-Kategorie kollabieren.

### §10 extractSitzungNr-Funktion auf falschen Input

**Falsch**: `extractSitzungNr(pdf.pdf_filename)` aufgerufen, obwohl die Funktion auf `full_text` ausgelegt war. Result: null, alle Vote-Rows hatten `sitzung_nr=NULL` und mussten manuell per SQL gefixt werden.

**Fix**: Funktion robuster gemacht — prüft erst Filename-Pattern (`p19-NNN`), dann Body-Text. Akzeptiert beide Eingaben.

**Verhindern**: Helper-Funktionen explizit dokumentieren, was sie als Input erwarten — oder polymorph machen.

## LLM-Prompts: Source-of-Truth-Verweise

| Stage | Prompt-Datei | Aktuelle Prompt-Version |
|---|---|---|
| Reden-Analyse | `src/lib/berlin-reden-prompts.ts` | v2.x |
| Vote-Extraktion | `src/lib/berlin-votes-prompts.ts` | siehe `PROMPT_VERSION` |
| TOP-Summary | `scripts/generate-berlin-top-summaries.ts` | `berlin-top-summary-v4-keyfacts` |

**Bei Prompt-Änderung**: PROMPT_VERSION-String inkrementieren, Skalierungs-Run starten der neue + alte Rows parallel hält, vergleichen, dann alte löschen.

## Skalierungs-Checkliste

Bevor `scripts/fix-berlin-top-markers.ts --all --write` und `scripts/rerun-berlin-votes.ts --all` losgeschickt werden:

- [ ] Ground-Truth-Files für mindestens 2 weitere Sitzungen (z. B. eine mittel-alte 2024er und eine 2025er) zusätzlich zu Sitzung 85
- [ ] Quality-Score-Skript anwendbar auf alle GT-Files (nicht hardcoded auf Sitzung 85)
- [ ] DB-Backup (politik.db kopieren) — der Fix-Run modifiziert >25k Reden
- [ ] Test-Run nur auf 1 Sitzung anderer Wahlperiode (falls vorhanden) zur Format-Sanity
- [ ] LLM-Cost-Estimate vorab — bei live API ~$3, bei Batch ~$1.50
- [ ] Nach Skalierung: Quality-Score über die 3+ GT-Sitzungen, Vergleich mit Baseline

## Tooling-Status

- `seed-berlin-speeches.ts` — STABIL, Kanonisch
- `fix-berlin-top-markers.ts` — NEU 2026-05-27, ersetzt das ad-hoc `_fix-sitzung-85-tops.ts`
- `rerun-berlin-votes.ts` — NEU 2026-05-27, ersetzt `_rerun-votes-s85.ts`
- `_post-process-vote-outcomes.ts` — Heuristik, generisch (alle Sitzungen)
- `_clean-berlin-zusammenfassung-leaks.ts` — Cleanup, generisch
- `generate-berlin-top-summaries.ts` — Live, `--sitzung` Flag
- `batch-berlin-top-summaries.ts` — Batch-Variante für Skalierung
- `_compare-votes-s85.ts` — TODO: Generalisieren auf jede GT-Sitzung
