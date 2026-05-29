# Bestandsaufnahme & Plan: Frage→Antwort-Extraktion

> **Stand:** 2026-05-29 · **Auslöser:** Schriftliche-Fragen-Sammeldrucksache 21/2979
> wurde als *ein* Block analysiert (1× Zusammenfassung, 1× Tonalität „teilantwortend")
> — 103 unzusammenhängende Frage+Antwort-Paare gingen verloren. Ohne die einzelnen
> Antworten hat das Dokument für Nutzer kaum Bedeutung.
> **Ziel dieser Doku:** vollständige Bestandsaufnahme aller parlamentarischen
> Q&A-Instrumente (Bundestag + Berlin), was wir extrahiert haben und was nicht,
> plus priorisierter Plan. **Kein Code, keine Kosten — nur Planung.**

## 0. Drei Ebenen von „Q&A-Extraktion"

Wichtig zu unterscheiden, sonst reden wir aneinander vorbei:

1. **Paarung** — welche Antwort-Drucksache beantwortet welche Anfrage-Drucksache (Frage-Doc ↔ Antwort-Doc).
2. **Inhaltstrennung** — pro Dokument getrennte `kerninhalt_frage` / `kerninhalt_antwort` (+ Antwort-Charakter), statt eines vermischten Blobs.
3. **Pro-Paar-Split** — ein Sammeldokument mit *vielen unabhängigen* Q&A (z.B. 100 schriftliche Einzelfragen verschiedener MdB) in einzelne `{Fragesteller, Thema, Frage, Antwort}`-Datensätze zerlegen.

## 1. Bestandsaufnahme

### Bundestag (WP21) — Rohtext liegt überall vor (keine Neu-Scrapes nötig)

| Instrument | Dokumente | Paarung (1) | Inhaltstrennung (2) | Pro-Paar-Split (3) | Bewertung |
|---|---:|:---:|:---:|:---:|---|
| **Kleine Anfrage** (Frage) + Antwort-Doc | 2.029 + ~1.393 Antw. | ✅ `referenced_drucksache_nr` | ❌ nur 1× `kerninhalt` | n/a (1 Thema) | OK-ish: gepaart + je analysiert, aber gröber als Berlin |
| **Große Anfrage** + Antwort | 12 + Antw. | ✅ | ❌ | n/a | wie Kleine Anfrage |
| **Schriftliche Fragen** (Sammeldrucksache) | **58** | ❌ (Q&A *inline*) | ❌ | ❌ **fehlt ganz** | **Hauptlücke** — ~100 Q&A/Doc (≈5.800 Paare), Blob-Analyse bedeutungslos |
| **„Fragen"** | 13 | ❌ | ❌ | ❌ | wie Schriftliche Fragen, klein |
| **Mündliche Fragen / Fragestunde / Regierungsbefragung** (im Plenarprotokoll) | ~2.082 Redebeiträge (`reden_typ` I) | ❌ | ❌ | ❌ | Q&A im Plenum, nicht gepaart (Frage-Turn ↔ Antwort-Turn) |

**Gesamt-Paarungs-Coverage Bundestag:** 1.393 / 5.499 Drucksachen-Texte haben `referenced_drucksache_nr`.

### Berlin (Abgeordnetenhaus) — Q&A-Daten FERTIG, aber UI fehlt

| Instrument | Dokumente | Paarung | Inhaltstrennung | Status |
|---|---:|:---:|:---:|---|
| **Schriftliche Anfrage** (`klasse=anfrage_antwort`) | **15.929** | n/a (Q&A in 1 Doc) | ✅ `kerninhalt_frage_json` + `kerninhalt_antwort_json` + `antwort_charakter` | **Daten ✅, UI ❌** |

- Berlin extrahiert echten Inhalt: z.B. Frage „Wie viele Lehrkräfte … stellten Verbeamtungsanträge?" → Antwort „Stichtag 10.2.2023: 3.346 befristete … rund 12.000 Anträge".
- Antwort-Qualität als Tonalität: teilantwortend 8.591 / substantiell 5.321 / ausweichend 1.984.
- **Aber:** kein UI-Component liest `kerninhalt_frage_json`/`kerninhalt_antwort_json` → für Nutzer unsichtbar.
- Berlin hat das „Sammel"-Problem nicht: jede Schriftliche Anfrage ist ein eigenes Doc (1 Thema, 1 MdL, 1 Senatsantwort).

## 2. Die Blaupause: Berlins Pipeline

Berlins `berlin_drucksachen_analyses` ist die fertige Vorlage. Relevante Felder:
`kerninhalt_frage_json`, `kerninhalt_antwort_json`, `antwort_charakter`, Tonalität-Skala
(substantiell / teilantwortend / ausweichend). Der Bundestag sollte dasselbe Schema
+ Prompt-Muster adaptieren.

## 3. Priorisierter Plan (Reihenfolge-Vorschlag, jede Phase einzeln freizugeben)

### Phase A — Berlin-Q&A im UI sichtbar machen `[klein · gratis]`
Die Daten existieren (15.929 Docs). Nur die Drucksachen-Detailseite (Berlin) muss
`kerninhalt_frage_json` / `kerninhalt_antwort_json` / `antwort_charakter` rendern
(Frage-Block → Antwort-Block). Sofortiger Nutzer-Mehrwert, keine Kosten.

### Phase B — Bundestag Schriftliche-Fragen Pro-Paar-Pipeline `[mittel · LLM-Kosten]`
Die explizite Hauptlücke. 58 Sammeldrucksachen, Text vorhanden. Neue Extraktion:
1 LLM-Call/Doc → Array von `{fragesteller, thema, frage, antwort, antwort_charakter}`.
Neue Tabelle (z.B. `drucksache_qa_paare`) statt der vermischten Blob-Analyse.
~5.800 Paare. Kosten erst per Pre-Flight (Haiku-Batch); Reihenfolge ggf. „Fragen" (13) gleich mit.
**Bis dahin Interim** (bereits live-fähig): Sektion ehrlich als „Enthaltene Fragen" +
Hinweis „Antworten im Original-PDF" (siehe Commit-Stand 2026-05-29, noch nicht deployed).

### Phase C — Bundestag Inhaltstrennung für Kleine/Große Anfrage `[mittel · LLM-Kosten]`
Berlins `kerninhalt_frage`/`kerninhalt_antwort`-Schema auf `drucksache_analyses`
portieren, ~1.393 Antwort-Docs neu analysieren. Hebt Bundestag auf Berlin-Niveau.

### Phase D — Mündliche Fragen / Fragestunde paaren `[größer · später]`
~2.082 Plenum-Q&A-Turns: Frage-Turn ↔ Antwort-Turn paaren (über Reihenfolge/Redner/Rolle
im Plenarprotokoll). Schwieriger, geringerer Hebel → zuletzt.

## 4. Kosten/Aufwand
Alle LLM-Schritte: Haiku-Batch, Text liegt vor → **keine Neu-Scrapes**. Konkrete Beträge
**immer per Pre-Flight** vor Submit (Größenordnung Phase B+C grob ~$5–20 zusammen, B allein
gering). **Nichts ausgeben ohne ausdrückliche Freigabe** ([[ask-before-spending]]).

## 5. Offene Fragen
- Reihenfolge: A (Quick-Win) → B (Hauptlücke) → C → D? Oder B zuerst, weil inhaltlich wichtigster Schmerz?
- Pro-Paar-Daten: eigene Tabelle `drucksache_qa_paare` (1 Row/Paar) — ja?
- Für Schriftliche Fragen: bestehende Blob-Analyse (drucksache_analyses-Row) behalten als Übersicht, Paare zusätzlich? (empfohlen: ja)
- Sollen die einzelnen Q&A durchsuchbar werden (FTS) + auf Politiker-Profilen je Fragesteller verlinkt?
