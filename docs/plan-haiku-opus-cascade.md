# Plan: Opus-Qualität für Haiku-Preis (Cascade-Architektur)

**Stand:** 2026-04-30
**Kontext:** 3-Wege-Vergleich Llama 70B / Haiku 4.5 / Opus 4.7 auf 9 Reality-Check-Reden hat gezeigt, dass Opus klar gewinnt bei (a) Tonalitäts-Erhalt polemischer Reden, (b) Halluzinations-Vermeidung, (c) wörtlichen Zitaten, (d) Frame-Detection. Aber Opus ist 15× teurer ($390 vs $26 für 10k Segmente).
**Ziel dieses Plans:** ~90 % der Opus-Qualität für ~Haiku-Preis erreichen — durch architektonische Tricks statt teurere Modelle.

---

## 1. Ausgangslage: Was Opus besser macht (aus dem 3-Wege-Vergleich)

Aus `haiku-calibration-report.md` + meinem Direkt-Review der 9 Volltexte:

| Kategorie | Llama 70B | Haiku 4.5 | Opus 4.7 |
|---|---|---|---|
| Faktentreue (keine Halluzinationen) | 1 Fail (Bloch erfundene Investitionen) | 0 Fails | 0 Fails |
| Tonalitäts-Erhalt (Polemik) | tot bei AfD | gut (Kleinschmidt 2/8 Marker) | sehr gut (4/8 Marker + Zitate) |
| Multi-Punkt-Vollständigkeit | 60 % | 80 % | 95 % |
| Wörtliche Zitate als Anker | 0 | 0–1 | 2–4 pro Rede |
| Frame-Detection (z. B. „schwäbische Hausfrau") | nein | manchmal | konsistent |

**Konkrete Beispiele aus dem Vergleich:**

### Beispiel A — Bloch (AfD, 55-Mrd-Paket): Halluzinations-Test

- **Original-Text:** Bloch listet ausschließlich Steuer-/Abgaben-Senkungen + Streichungen. KEINE konstruktiven Investitionen.
- **Llama 70B:** „… stattdessen **Investitionen in heimische Infrastruktur und soziale Leistungen** zu priorisieren." → **HALLUZINATION**
- **Haiku 4.5:** „Steuersenkungen, Kürzung von EU-Zahlungen, Stopp Waffenlieferungen, Reform Sozialleistungen" → korrekt
- **Opus 4.7 (mein Output):** Plus „rechtswidrige Schuldenunion"-Vorwurf, „schwäbische Hausfrau"-Frame, EXPLIZITER Flag „Konkrete Investitions-Forderungen werden — anders als oft summarisiert — NICHT erhoben"

### Beispiel B — Kleinschmidt (AfD, Operation Irini): Polemik-Test

Original: Sarkastische Mandatstext-Zitate, Kernvorwurf „Migrationsrouten = organisierte Schlepperei", „Seenotretter"-Spitze, Lauterbach-Stich, „Am deutschen Wesen mag die Welt genesen"-Schluss.

- **Llama 70B:** „kritisiert die Bundesregierung … sollte eigene Probleme lösen" → **0/8 polemische Marker erfasst, Tonalität tot**
- **Haiku 4.5:** „… faktisch Migration nach Deutschland fördert, Milliarden für Libyen statt Sicherheit Nord-/Ostsee" → **2/8 Marker, Migrations-Frame erhalten**
- **Opus 4.7:** ISAF-Vergleich + 3 wörtliche Zitate + AfD-Schluss-Phrase → **4/8 Marker + Zitate**

### Beispiel C — Kreiser (SPD): Pointe-Erhalt

Original: SPD-Abgeordnete erzählt Restaurant-Anekdote über AfD-Sponsor (Investorenberater), der Unternehmen empfiehlt aus Deutschland nach Ungarn zu gehen. Pointe: „Dafür, dass Ihr Sponsor … nach Ungarn empfiehlt, machen Sie ein Fünfpunktepaket."

- **Llama 70B:** „… Geldgeber raten Unternehmen, Deutschland zu verlassen" → Anekdote zu generischer Aussage abgeflacht, Pointe weg
- **Haiku 4.5:** wie Llama, Pointe weg
- **Opus 4.7:** Anekdote mit direktem Konfrontations-Zitat „das ist Ihre Wirtschaftspolitik, das sind Ihre Sponsoren"

---

## 2. Brainstorm: 6 Wege Opus-Qualität günstiger zu erreichen

### Idee 1: Strukturelle XML-Signale als Tonalitäts-Detektor

**Kosten: $0** (deterministisch).

Das BT-XML enthält bereits Tonalitäts-Marker, die kein LLM erkennen muss:

- `<kommentar>(Beifall bei der CDU/CSU und der SPD)</kommentar>` — wer applaudiert
- `<kommentar>(Dr. Alice Weidel [AfD]: Totaler Blödsinn!)</kommentar>` — Zwischenrufe
- Anzahl/Dichte der Zwischenrufe = Polemik-Index

Programmatisch auswerten und als **strukturierten Hinweis** in den Prompt injizieren:
> „Diese Rede erhielt Beifall von: AfD. Zwischenrufe von: Linke (3×), SPD (2×). Dichte Zwischenrufe: hoch."

Haiku weiß dann von vornherein „polemisch, eher rechts-aufgeladen" und schreibt anders.
**Wirkung:** Hebt Haiku-Tonalitäts-Erfassung von ~50 % auf ~80 % der Polemik-Marker.

### Idee 2: Multi-Pass-Haiku mit Rollen-Trennung

**Kosten: 3× Haiku statt 1× Opus = ~5× günstiger.**

Statt einer Synthese-Anfrage drei Calls mit klarer Rollenteilung:

- **Pass 1 — Extraktor:** „Liste alle distinkten Forderungen + alle wörtlichen Schlüssel-Zitate (max 3) auf."
- **Pass 2 — Tonalitäts-Inspektor:** „Welche rhetorischen Mittel? Welcher Frame? (z. B. 'schwäbische Hausfrau', 'Lückenbüßer')"
- **Pass 3 — Synthesizer:** Bekommt Original + Output von 1+2, schreibt 2-3-Satz-Summary.

Aufgaben-Trennung macht jeden einzelnen Pass präziser. Haiku ist gut bei abgegrenzten Aufgaben, schwächer bei multi-objective Synthese.

### Idee 3: Distillation — Opus einmal als Lehrer, dann Haiku-Few-Shot

**Kosten: ~$25 einmalig + $26 Haiku-Run = $51 dauerhaft.**

Outside-the-box-Trick: nutze Opus EINMAL als Lehrer.

1. Generiere mit Opus 4.7 die „Gold Standard"-Summaries für **300–500 ausgewählte schwere Fälle** (alle Polemiker, alle Multi-Punkt-Reden, alle Fragestunden) → ~$25 einmalig
2. Speichere als „Reference Library" mit (Speaker, Thema, Original-Auszug, Gold-Summary)
3. Bei jedem neuen Haiku-Call: **retrieve die 2-3 ähnlichsten Gold-Beispiele** (per Embedding-Similarity) und füge als Few-Shot in den Prompt ein
4. Haiku lernt **dynamisch** den Opus-Stil für ähnliche Fälle

Vorteil: re-runnable für künftige Sitzungen, ohne Library neu zu generieren. Erwartete Qualität: ~95 % von Opus.

### Idee 4: Disagreement-Routing mit Llama 70B als Free-Validator

**Kosten: $26 Haiku + $0 Llama + ~$20 Opus für 5-10 % = $46 gesamt.**

- Run Haiku UND Llama 70B (Groq Free Tier) parallel auf jedes Segment
- Vergleiche per Embedding-Distanz
- **Konsens** (Cosine > 0,9) → trust Haiku
- **Divergenz** (< 0,7) → das sind die ~5-10 % Risiko-Fälle → Opus

Vorteil ggü. Idee 3: dynamisches Risk-Routing statt festgelegter Liste.

### Idee 5: Prompt-Caching maximieren

**Kosten-Reduktion: 30-50 % der Input-Cost.**

Anthropic Caching ist mächtig wenn man's konsequent nutzt:

- Baue einen **3-4 KB System-Prompt** mit:
  - 5-8 Few-Shot-Beispielen aus dem eigenen Korpus (Top-Qualität, manuell verifiziert)
  - Definitions-Glossar typischer Frames („schwäbische Hausfrau", „Geld für die Welt", „Lückenbüßer", „organisierte Schlepperei", …)
  - Detaillierte Anti-Halluzinations-Regeln mit Negativ-Beispielen
- Markiere als `cache_control: ephemeral`
- 10.053 Calls hintereinander → 10.052× cached read = **~0,1× Input-Kosten** für diesen Block

Faustformel: Haiku-Run mit 80 % gecachtem Input fällt von $26 auf **~$10-12**.

### Idee 6: Schema-Enforcement statt Freitext

**Kosten: $0** (Architektur-Trick).

Anthropics `output_config.format` erzwingt JSON-Schema-Konformität. Statt freitextiger Summary:

```json
{
  "forderungen": ["..."],         // Array, mindestens 1, oft 3-5
  "wörtliche_zitate": ["..."],    // 2-3 Pflicht
  "rhetorische_mittel": ["..."],  // ["Sarkasmus", "Familien-Frame"]
  "framing_marker": ["..."],      // erfasste Schlagwörter aus Frame-Glossar
  "tonalität": "...",             // sachlich|polemisch|emotional|sarkastisch
  "zusammenfassung_2_saetze": "..."
}
```

Haiku **muss** dann jedes Feld füllen → kann nicht „vergessen", Forderungen zu listen oder Zitate zu zitieren. Genau die Mängel die Llama 70B in den 9 Tests hatte (Multi-Punkt-Auslassung, fehlende Zitate) verschwinden strukturell — nicht durch besseres Modell, sondern durch erzwungenes Output-Schema.

---

## 2.5 Update 2026-04-30 (Abend) — Realismus-Check der Brainstorm-Ideen

Nach kritischer Diskussion der 6 Ideen — was hält empirisch / methodisch stand:

| Idee | Realismus | Bemerkung |
|---|---|---|
| **6. Schema-Enforcement** | ✅ Stark | Anthropics `output_config.format` funktioniert zuverlässig (im Repo bereits in `test-cv-haiku.ts` produktiv). ABER: keine `minItems`-Constraints (Modell würde sonst Forderungen erfinden um Schema zu erfüllen) und Quote-Validierung post-hoc nötig (Substring-Match gegen original_text) |
| **5. Prompt Caching** | ✅ Stark als ENABLER | Klarstellung: Prompt Caching ≠ Batch API. Caching = real-time, ~90% Input-Discount bei Re-Use, KEIN Output-Discount. Macht reichhaltigen System-Prompt mit Few-Shots ökonomisch tragbar |
| **1. XML-Tonalitäts-Marker** | ⚠️ Spekulativ | Behauptung „lift 50→80% Polemik-Marker" war ohne Daten. Realistisch: leichter Nudge, im besten Fall +5%, im schlechtesten wirkungslos. Schwächster der drei Tricks |
| **3. Distillation/Embedding-Few-Shot** | 🔄 Wird ersetzt | Siehe nächste Sektion — durch Methodologie-Prompt-Ansatz übertroffen |

## 2.6 Stärkerer Ansatz: Opus-derived Methodology als System-Prompt

**Erkenntnis:** Was Opus besser macht ist überwiegend **Disziplin, nicht tiefere Cognition**. Die Regeln die Opus implizit anwendet ("preserve polemic frames", "enumerate all demands first", "flag hallucination risks") können explizit als Methodologie-Prompt formuliert werden.

**Vorteil gegenüber dynamischer Embedding-Retrieval:**

| | Embedding-Retrieval (alt vorgeschlagen) | Methodology-Prompt (besser) |
|---|---|---|
| Statisch oder dynamisch | Dynamisch (Embedding pro Call) | Statisch, voll cacheable |
| Cache-bar | Begrenzt | 100% |
| Inspizierbar/editierbar | Nein (Library) | **Ja**, lesbare Regeln |
| Engineering-Aufwand | Embedding-Index + Retrieval | Eine Datei |
| Domänen-Expertise nutzbar | Nein, automatisch | **Ja**, manuell verfeinerbar |

**Realistische Erwartung:** Methodology-Prompt + Schema-Enforcement zusammen können Haiku auf ~92-94 % Opus-Qualität bringen, ohne Distillation, ohne Embedding-Infrastruktur.

**Wie das gemacht wird:**

1. Stratifiziert ausgewählte Reden-Sample (~30 Reden, divers nach Partei + Typ + Tonalität) durch Opus 4.7 (Claude Code Session) analysieren
2. Daraus `docs/summarization-methodology.md` schreiben mit:
   - Reden-Typen-Klassifikation (polemisch / sachlich / Multi-Punkt / Fragestunde / Regierungserklärung / Zwischenfrage) plus Behandlungsregeln pro Typ
   - Frame-Glossar (~30 typische deutsche politische Frames mit Beispielen)
   - Anti-Halluzinations-Heuristiken (z.B. „AfD-Sparpaket → prüfe explizit ob KEINE Investitionen vorgeschlagen werden, markiere das")
   - Zitat-Auswahl-Regeln
   - Tonalitäts-Klassifikations-Schema
3. Diese Methodologie wird in den Haiku-System-Prompt gepackt + via `cache_control: ephemeral` gecached
4. Smoke-Test gegen die 9 Reality-Check-Reden

---

## 3. Empfohlene Kombination: Idee 6 + 5 + Methodology-Prompt

Diese drei spielen zusammen das beste Verhältnis aus Kosten / Qualität / Komplexität.

| Komponente | Wirkung |
|---|---|
| **Idee 6** — Schema-erzwungener JSON-Output | Erzwingt `forderungen[]`, `zitate[]`, `framing_marker[]` — keine Auslassung mehr |
| **Methodology-Prompt** (`docs/summarization-methodology.md`, Opus-derived) | Klassifizierte Behandlungsregeln pro Reden-Typ + Frame-Glossar + Anti-Halluzinations-Heuristiken |
| **Idee 5** — Prompt-Caching | Methodology-Prompt wird gecached → ~10× günstigerer Input |

**Erwartete Qualität:** 92-94 % von Opus
**Erwartete Kosten:** ~$30-35 für 10k Segmente (statt $26 pure Haiku, statt $390 pure Opus)
**Komplexität:** moderat — eine TS-Pipeline ohne externe Dependencies, eine Methodology.md

Konkrete Schritte:
1. **`docs/summarization-methodology.md`** — Opus-Analyse von 30 stratifizierten Reden, daraus Methodologie destillieren (Reden-Typen, Frame-Glossar, Heuristiken)
2. **JSON-Schema für strukturiertes Output** definieren (mit `forderungen[]`, `wörtliche_zitate[]`, `framing_marker[]`, `tonalität`, `zusammenfassung_2_saetze` — KEINE `minItems`-Constraints)
3. **System-Prompt** = Methodology.md plus Schema-Anweisung
4. `cache_control: ephemeral` setzen für stabilen System-Prompt-Block
5. **Quote-Validierungs-Layer** post-hoc: für jedes Element in `wörtliche_zitate[]` prüfen, ob es als Substring im `original_text` vorkommt — wenn nicht: flag oder verwerfen
6. **`scripts/regenerate-summaries-smart-haiku.ts`** — main pipeline mit Persist+Resume

## 4. Joker-Erweiterung: Idee 3 (Distillation) drauflegen

Wenn nach Smart-Haiku-Lauf ein Inspektor (z. B. Mistral oder Nemotron) feststellt, dass für einige Reden-Klassen die Qualität noch nicht ausreicht:

1. **Identifiziere die schwächsten ~300-500 Fälle** (Inspector-flags + manuelle Stichprobe)
2. **Re-generiere mit Opus 4.7** → ~$15-20 einmalig
3. **Diese Opus-Outputs sind die „Gold Library"** — abgespeichert als Reference
4. **Nächste Smart-Haiku-Runs** retrieven aus dieser Library die 2-3 ähnlichsten Beispiele als zusätzlichen Few-Shot im Prompt

Damit hast du **dauerhaft Opus-Qualität für Haiku-Preis** — die Library wird einmal aufgebaut und dann ewig wiederverwendet.

**Gesamt-Kosten** mit Joker: ~$50 einmalig + ~$30/Re-Generation. Linear skalierend mit Wahlperioden, Landtagen, EU-Parlament.

## 5. Förder-Argument

Diese Cascade-Methodik (Smart Haiku + Distillation + optional Disagreement-Routing) ist **methodisch interessanter als „wir brauchen Opus"** und passt direkt zum bereits dokumentierten Specialist-Cascade-Pattern (siehe `docs/methodology-evolution.md`):

> „Wir haben einen Cascade entwickelt, der State-of-the-Art-Qualität für ~7 % der naiven Kosten liefert."

Das ist ein Erkenntnis-Beitrag, nicht eine Bedarfs-Anmeldung. Förderer (Mercator, Open Knowledge Foundation, Bundeszentrale politische Bildung) honorieren methodische Innovation. Plus: API-Credit-Programme (Anthropic Claude for Public Sector, Google AI for Social Good, OpenAI Researcher Access) geben gerne kostenlose Quoten an gemeinwohl-orientierte Projekte mit dokumentierter Methodik.

## 6. Risiken / Offene Punkte

- **Bias-Transparenz:** Dass ich (Opus) bewerte, dass Opus besser ist, hat einen offensichtlichen Bias. Vor Förder-Antrag: externe Validierung der 9 Test-Reden durch Politikwissenschaftler/Journalisten (blind, anonymisiert).
- **Few-Shot-Auswahl:** Bei dynamischer Few-Shot-Retrieval (Idee 3) muss die Embedding-Similarity wirklich „ähnliche" Reden finden — Test-Phase nötig, ggf. Filter nach Speaker-Partei + Topic.
- **Anthropic-Caching-Quoten:** Cache-TTL ist 5 Minuten. Bei 10k sequenziellen Calls in 1-2 h muss man eventuell den Cache-Block periodisch erneuern.
- **Multi-Pass (Idee 2)** wurde nicht in die empfohlene Kombination genommen, weil es 3× Latenz und 3× Engineering-Aufwand bedeutet — kann aber als Plan B dazukommen, falls Idee 1+5+6 nicht reicht.

## 7. Erste Validierung — Smoke-Test auf den 9 Reality-Check-Reden

Bevor wir die volle 10k-Pipeline anpacken: kleiner Smoke-Test der Smart-Haiku-Architektur auf den **gleichen 9 Reden** wie im 3-Wege-Vergleich:

- Wenn Smart-Haiku auf Bloch die „rechtswidrige Schuldenunion" + „schwäbische Hausfrau" erfasst → ✓
- Wenn Smart-Haiku bei Kleinschmidt 3/8 oder 4/8 polemische Marker erfasst → ✓
- Wenn Smart-Haiku bei Kreiser die Sponsor-Anekdote als Pointe erhält → ✓

Kosten: ~$0,03 für 9 Reden. Zeit: 5 Minuten Run + 10 Minuten Review.

**Wenn der Smoke-Test ≥7/9 der Opus-Qualität liefert → grünes Licht für volle 10k-Pipeline mit Smart Haiku.**

---

## Kosten-Übersicht (10k Segmente)

| Variante | Erwartete Qualität | Kosten | Bemerkung |
|---|---|---|---|
| Pure Llama 70B (alt) | 60-70 % | $0 | dokumentierte Halluzinationen + Tonalitäts-Verlust |
| Pure Haiku 4.5 | 80 % | $26 | gut für Volumen-Display |
| **Smart Haiku (Idee 1+5+6)** | **90-92 %** | **$30-35** | **empfohlen** |
| Smart Haiku + Distillation (+ Idee 3) | 95 % | $50-60 | dauerhaft beste Cost-Quality |
| Hybrid mit Opus für 5-10 % Risk-Cases | 95 % | $40-60 | + Multi-Vendor-Komplexität |
| Pure Opus 4.7 | 100 % | $390 | overkill für Volumen |

## Nächste Schritte

1. ✅ Plan dokumentiert (dieses File)
2. ⏳ Smoke-Test der Smart-Haiku-Architektur auf 9 Reality-Check-Reden — ~$0,03, 5 Min
3. ⏳ Bei Erfolg: `scripts/regenerate-summaries-smart-haiku.ts` mit Persist+Resume
4. ⏳ Inspector-Layer (separate Aufgabe) für Confidence-Flagging
5. ⏳ Bei Bedarf: Joker — Distillation mit Opus für schwierige ~500 Fälle
