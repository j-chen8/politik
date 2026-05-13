# Offene Tracks — Cross-Track-Landkarte

> **Zweck:** Single Source für alles was über alle Tracks offen ist. Wird beim Aufräumen am Ende einer Session gepflegt.
> Tagesfrische Pickup-Notizen für „morgen früh anfangen" → `NEXT-SESSION.md`. Pipeline-Inventar → `docs/PIPELINE.md`. Per-Track-Detail → `docs/<track>-*.md`.
>
> **Stand:** 2026-05-13 (nach Drucksachen-Cmd+K-Session)
> **Format:** 🟢 aktiv · 🟡 pausiert mit konkretem Pickup · 🔵 Phase-2-Backlog · 📐 methodische Schulden

---

## ✅ Drucksachen-Track: Heute vollendet (10 Commits)

**Was alles steht:**
- 5.183 LLM-Analysen sauber (0 XML-Leaks, 0 Errors, 99,7 % mit konkretem Thema)
- Letterboxd-Style Detail-Page `/design/linear/aktivitaeten/[ds-nr]` mit 8 Sections (Hero, Zusammenfassung, Kerninhalt, Details, Mitzeichner+Fraktionsverteilung, Plenum, Polls, Verfahren, Fraktions-DS, Ähnliche)
- Drei Navigations-Kreise geschlossen: Anfrage↔Antwort, DS↔Vote, DS↔Andere DS der Fraktion
- Politik-Glossar (25 Begriffe) + Wikipedia-Style Hover-Component
- Cmd+K-Suche mit FTS5 auf LLM-Output, Snippet + Klassen-Label, Link auf Detail-Page

**Verbleibender Rest (niedrige Priorität):**
- Politiker-Profilseite-Edit (Drucksachen-Section) ist in der Working-Tree, mit fremden Track-Edits verwoben — uncommittet. Cherry-pick wenn andere Tracks sortiert sind.
- 5 ungematchte Polls (Luxusflüge, CO2-Bepreisung-Abschaffung, Wahleinsprüche, Verbraucherrechte-Digital, Politikerbeleidigung-Streichung). Echte Edge-Cases.
- 13 Records mit `thema='Sonstiges'` (echte Long-Tail-Singletons).
**Per-Track-Doc:** `docs/drucksachen-pipeline.md`

---

## 🟢 Aktiv / als Nächstes

_(keiner momentan — Drucksachen-Track ist abgeschlossen, neuer Track als Pickup wählen)_

---

## 🟡 Pausiert mit konkretem Pickup-Punkt

### Reden-Pipeline (speech_analyses_v2)
**Status:** 9.913 Reden analysiert seit 2026-05-05, Cost $41.82, Quote-Validation 90.9%.
**Offen:**
- **Tonalitäts-Drift fixen** — ~33/9.913 Reden mit invented Tonalitäten (Tool-Use lockt Enum nicht 100%). One-time-Cleanup-Script analog zum Drucksachen-Pendant.
- **Bias-Korrektur-Re-Batch** — `msgbatch_019gryE7wmvV9e9EaL65mFqg` mit 400 v2.1-Korrekturen, Status prüfen.
**Per-Track-Doc:** `docs/reden-methodology.md`, `docs/rede-audit-findings.md`

### CV-Pipeline (Politiker-Lebensläufe)
**Status:** CV-Duplicate-Pipeline live (412 MdBs dedup'd, 2026-05-09). Source-Coherence Precision/Recall ~13%, 6% MdB mit Diskrepanzen.
**Offen:**
- **CV-Summary-Re-Batch** — `msgbatch_01JvDJt7F3u553fvRCQjiE9s` (631 cv_summary auf Haiku 4.5 seit 2026-05-08). Status prüfen.
- **Stage-5 Stale-Page-Bug** dokumentieren — Bareiß-Fall (Orphan-Page-Scraping). User-Entscheidung: kein Re-Scraping, transparent kommunizieren.
- **Multi-Page-Biography-Scraping** — Heiligenstadt-Fall (Hub + 3 Themen-Seiten, Scraper folgt Links nicht). Akzeptiert als Limitation oder nachscrapen.
**Per-Track-Doc:** `docs/cv-duplicate-detection-methodology.md`, `docs/source-coherence-echt-fehler.md`

### Foto- + Social-Track
**Status:** 392/631 Foto-Coverage. Neue Felder `facebook_handle` (562) + `tiktok_handle` (141). Lizenz-Caption-Strategie etabliert.
**Offen:**
- Restliche 239 MdBs ohne Foto (~38%). Quelle-Audit (Wikidata-Lücken vs. Wikipedia-Existenz).
- Lizenz-Backfill für ältere Fotos.

### Topic-Klassifikation (formell)
**Status:** Design-Phase, **noch kein Code**. 7 offene Fragen.
**Offen:**
- User-Antworten auf die 7 Design-Fragen.
- Erst dann Skripte schreiben.
**Per-Track-Doc:** `docs/topic-classification-design-questions.md`

### Vote-Topic-UI-Spike
**Status:** `vote_topic_links` 50/50 (88% HIGH) seit 2026-05-06, bereit für UI-Integration.
**Offen:**
- UI-Spike: Topic-Filter auf `/abstimmungen` + Topic-Detail-Page.
**Per-Track-Doc:** `docs/vote-topic-mapping-methodology.md`

### Search-Layer
**Status:** Synonym-Cluster (40, Recall 1.5×–3.7×) + FTS5 (2.0s→0.12s) live seit 2026-05-11.
**Offen:**
- Phase 2: Embedding-basierte Suche (deferred).
- Cloudflare-Frage (siehe `NEXT-SESSION.md` Stand 2026-05-13).

### Landing-Page-Redesign
**Status:** Phase 1 live (`86ac928`): Cleanup + Pop-Hero. Backlog mit 12 priorisierten Ideen.
**Offen:**
- Phase 2 — Story-Sections, neuere Features, Hero-Variationen.
**Per-Track-Doc:** `docs/landing-page-redesign.md`

### Role-Model-Strategie
**Status:** Aktive Strategie seit 2026-05-06 — Polish-One-First (Merz-Profil) + externe Validierung.
**Offen:**
- **Externe Validierung Outreach:** 10–20 Journalisten/Politikwissenschaftler raussuchen + Emails sammeln. Pending seit Wochen.
- **Merz-Profil polieren** — sobald Adress-Recherche-Block geräumt ist.
**Per-Track-Doc:** `docs/plan-role-model-validation.md`

---

## 🔵 Phase-2-Backlog (geparkt, kein konkretes Pickup-Datum)

### Drucksachen-Phase-2
- **Glossar auf anderen Pages integrieren** — Politiker / Abstimmungen / Plenarprotokolle nutzen `<GlossarTerm>` noch nicht.
- **„Andere DS der Fraktion"-Section** auf Detail-Page (z.B. „Weitere AfD-Anfragen zu Migration").
- **„Verwandte Plenarprotokoll-TOPs"-Section** — wenn DS in einer Sitzung diskutiert wurde.
- **Echte PDF-Erste-Seite als Cover-Preview** (statt stylisiertem Mono-Block). Würde `pdf-poppler` brauchen + Storage für ~5K Render.
- **Chunked Map-Reduce für die 117 narrative-massive DS** — falls 700-Wort-Tier doch zu kurz wirkt. Heute akzeptiert.

### Daten-Erweiterungen
- **Bundesrats-Drucksachen** (12 referenziert in `activities` 1053-1064, nicht in Scope unserer Pipeline). Eigener Track.
- **Ältere Wahlperioden-DS** für die 5 ungematchten Polls (Edge-Cases die referenzieren auf 20.WP).

### UI-Polish
- **Mobile-Verhalten der GlossarTerm-Popover** — Tap funktioniert, aber Layout könnte refined werden.
- **Suche: Drucksachen aufnehmen** — Cmd+K kennt Drucksachen noch nicht (nur Reden + Politiker).

### Methodik-Tools
- **„Show Your Work"-Sheet auf Detail-Page** — aktuell als Link zur Methodik-Page. Ein Side-Drawer mit Prompt-Hash + Tier-Reasoning + Trunkierungs-Flag wäre die nächste Stufe.
- **„Letzte N LLM-Generierungen"-Live-Log** auf Methodik-Page als Build-Pipeline-Status.

---

## 📐 Methodische Schulden

### Drucksachen
- **`mixed`-Klasse-Tail-Klassifikation (85 DS)** — sind weder pure narrative noch pure data_dump. Eventuell ein 2. LLM-Klassifikations-Pass für die wo's relevant ist.
- **Heavy-Truncated bei `regierung`-Klasse (4 DS)** mit fragestunden-Format — Markdown-Headers im Output verlangen UI-Rendering.

### Reden
- **Quote-Validation 90.9 %** — die 9.1 % ohne Quelle (geschätzt 900 Reden) sind eine systematische Schuld. Audit nötig.

### CV / Source-Coherence
- **Precision/Recall ~13 %** — die Pipeline ist noch nicht produktionsreif. Förder-Pitch-Logik in 3 Posten ist eine Limitation.

### Search
- **„Sonstiges" als Topic-Default** — wenn LLM kein Match findet, landet DS in Sonstiges-Eimer. UI-Filter für Sonstiges fehlt.

### Pipeline-Architektur
- **Specialist-Cascade-Methodik** — Pattern dokumentiert in `project_specialist_cascade.md`. Anwendung auf weitere Pipelines noch offen (z.B. Source-Coherence könnte profitieren).

---

## 🚫 Bewusst NICHT auf der Agenda

- **PDF-Embedding direkt auf Detail-Page** — User-Erfahrung mit Browser-PDFs ist fragil. Original-PDF-Link reicht.
- **AI-Assist-Erklärer für Glossar-Terms** — Overkill, Inference-Latency.
- **Volle Verfahrens-Pipeline** (Erste Lesung → Ausschuss → Schlussabstimmung) — Daten haben wir nicht in dieser Granularität, Aufwand vs. Mehrwert kippt.

---

## Pflege-Hinweis

Diese Datei wird **am Ende jeder Session** aktualisiert (~5 Min):
- Was ist neu in 🟢 oder von 🟢 nach 🟡 gewandert?
- Was wurde aus 🟡 oder 🔵 fertig (Eintrag löschen oder ins git-log-Vermerk)?
- Neue 🔵-Backlog-Ideen die in der Session aufkamen?

`NEXT-SESSION.md` ist tagesfrisch (Pickup für morgen früh). `OPEN-TRACKS.md` ist die Cross-Track-Landkarte.
