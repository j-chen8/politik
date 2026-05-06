# Source-Coherence: 16 echte Konflikte — Reaktions-Plan

**Stand:** 2026-05-05 nach Stage-5-Vollauf + Verifier-Cascade (Llama 70B / Haiku 4.5 / Opus 4.7 manual)

563 Bundestag-MdBs mit Wikipedia-CV + Homepage-CV gegeneinander geprüft. 39 Konflikt-Kandidaten von Stage-5 (`gpt-oss-120b`), nach Verifier-Cascade als final klassifiziert: **16 ECHT, 12 PRAEZISIERUNG, 11 FALSE_POSITIVE**.

Hier die 16 ECHTen mit empfohlener Reaktion.

## Klassifizierung nach Reaktions-Typ

### A. Korrigierbar nach Faktenrecherche (5)

Eine Quelle ist eindeutig falsch und kann nach kurzem Lookup korrigiert werden.

| Politiker | Konflikt | Empfohlene Aktion |
|---|---|---|
| Jürgen Hardt | Abitur-Schule Königstein vs. Hofheim | Wikipedia bestätigt Königstein → Homepage-CV korrigieren |
| Stefan Nacke | NRW-Wahlkreis Münster II vs. Münster Süd | Landtags-Archiv NRW konsultieren, falsche Quelle korrigieren |
| Friedrich Merz | Mayer Brown 2005 Partner vs. Senior Counsel | Mayer Brown Pressearchiv prüfen → korrigieren |
| Christos Pantazis | SPD-Bezirksvorstand beratend vs. geschäftsführend | SPD-Braunschweig-Satzung prüfen |
| Jens Behrens | Stadtrat Lippstadt Vorsitz vs. stellv. | Stadtrat-Protokolle prüfen |

### B. Datums-/Quellenstand-Drift (5)

Eine Quelle ist zeitlich veraltet, die andere aktuell. Strategie: aktuelle Quelle gewinnt; veraltete bleibt erhalten als historischer Kontext.

| Politiker | Konflikt | Empfohlene Aktion |
|---|---|---|
| Jan Metzler | Ausbildung-Endjahr 2001 doppelt | Eine Quelle hat das Jahr falsch — Zeugnisdatum recherchieren |
| Martin Rabanus | Schülervertretung-Job 1994 mit 25 J. | Quellen-Date-Drift, Wikipedia mit ~1988 plausibler |
| Frank Junge | KJS-Schulabschluss 1993 mit Diplom | Eine Quelle hat falsches Jahr — KJS war ~1986/87 |
| Jonas Geissler | Referent + MdB seit 2021 | Homepage veraltet → Eintrag als "vor 2021" markieren |
| Christian Moser | Regierungsrat + MdB seit 2022 | Wikipedia oder Homepage hat Datums-Drift, MdB ist erst seit 2/2025 |

### C. Wechsel-Reihenfolge falsch dokumentiert (4)

Eine Quelle hat den Studien-/Berufs-Wechsel in falscher Reihenfolge — beide Stationen existieren, nur die Chronologie ist verkehrt.

| Politiker | Konflikt | Empfohlene Aktion |
|---|---|---|
| Silke Launert | 2005 + 2005-07: Amts- vs. Landgericht Hof | Lebenslauf-Original vom Bundestag oder GmS-Bayern prüfen |
| Aaron Valent | 2017 #1 + #2: Lehramt vs. BA Phil/DH | Studierenden-Verzeichnis JMU oder Eigen-CV prüfen |

### D. Komplexer Fall — Aufschlüsselung fehlt (2)

| Politiker | Konflikt | Empfohlene Aktion |
|---|---|---|
| Hendrik Hoppenstedt | Wahlprüfungsausschuss: Obmann vs. stellv. Mitglied | Aktueller Stand bundestag.de — Wikipedia oder Homepage hat alte Funktion |
| Lukas Rehm | 2015-2025: MediaMarktSaturn vs. Binderholz | Beide Quellen zusammen ergeben wahrscheinlich vollständiges Bild — eine Quelle fasst Phasen zusammen |

## Empfohlene Reaktions-Strategie

### Stufe 1 — Transparenz-Anzeige (sofort, ohne Daten zu verändern)

Auf der Politiker-Detailseite ein Badge **"Quellen-Diskrepanz erkannt"** mit ausklappbarem Detail anzeigen:

- Liste der finalen ECHT-Konflikte aus `politicians.source_conflicts` (filter: `final_verdict = ECHT`)
- Pro Konflikt: Wikipedia-Aussage, Homepage-Aussage, Stage-5-Begründung
- **Förder-Pitch-Wert:** wir machen Datenqualitäts-Lücken transparent statt zu verschleiern

Zeitschätzung: 1-2 Stunden (PoliticianPage.tsx Komponente erweitern, da `source_conflicts` schon in DB liegt).

### Stufe 2 — Selektive Korrektur (nach Recherche, opt-in)

Die 5 Kategorie-A-Fälle haben eine eindeutig falsche Quelle. Manuelle Recherche pro Fall (~5-10 Min), dann Korrektur via gezieltem Patch in `cv_json` oder `cv_homepage_json` mit Audit-Trail (`cv_repair_log` analog zu Stage 4).

Zeitschätzung: 1 Stunde für alle 5 Fälle.

### Stufe 3 — Roadmap (Source-Coherence als Cron)

Source-Coherence-Pipeline alle 3 Monate re-runnen (analog zu `fetch-plenar-xmls`-Cron). Neue Wikipedia-Edits oder Homepage-Updates werden so automatisch erfasst. Kosten: $0 (Free Tier) + ~$2/Quartal Haiku-Verifier.

## Was NICHT empfohlen wird

- **Automatisch alle Konflikte fixen** — bei Wechsel-Reihenfolge / komplexen Fällen kann ein Auto-Repair Daten zerstören
- **Force-Wahl pro Quelle** (z.B. "Wikipedia gewinnt immer") — Wikipedia ist nicht systematisch genauer; Homepage hat aktuelleren Stand
- **Konflikte als Bugs in der Pipeline-Doku tracken** — diese Konflikte sind das **Feature** der Source-Coherence-Pipeline, kein Pipeline-Defekt

## Files

- `final-verdicts-source-coherence.jsonl` — alle 39 Verdicts, von Opus 4.7 manual
- `politicians.source_conflicts` (DB) — pro Konflikt erweitert um `final_verdict` + `final_reason` + `verdict_method`
- `source-coherence-report.md` — auto-generierter Stage-5-Report
- `docs/methodology-evolution.md` Phase 7 — Verifier-Auswahl-Empirie
