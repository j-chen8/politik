# Politik-Plattform — Pipeline-Runbook

**Stand:** 2026-05-06 · **Schema-Version:** Specialist-Cascade (Phase 7+)

> Master-Doc für **Reproduzierbarkeit, Onboarding und Modell-Upgrades**.
> Wer dieses Dokument bis zum Ende liest, kann die Plattform **von Null** neu aufbauen,
> einzelne Modell-Slots upgraden (z.B. Llama 8B → Sonnet/Opus), oder eine inkrementelle
> Sitzung nachziehen, ohne Skripte raten zu müssen.

---

## Inhaltsverzeichnis

1. [Zweck dieses Dokuments](#1-zweck-dieses-dokuments)
2. [Architektur in einer Minute](#2-architektur-in-einer-minute)
3. [System-Voraussetzungen](#3-system-voraussetzungen)
4. [Datenfluss-Diagramm](#4-datenfluss-diagramm)
5. [Block S — Stammdaten-Layer](#5-block-s--stammdaten-layer)
6. [Block A — CV-Qualitäts-Pipeline (pro CV)](#6-block-a--cv-qualitäts-pipeline-pro-cv)
7. [Block B — Source-Coherence-Pipeline (Wikipedia ↔ Homepage)](#7-block-b--source-coherence-pipeline-wikipedia--homepage)
8. [Block R — Reden-Pipeline](#8-block-r--reden-pipeline)
9. [Block X — Bias-Audit (einmaliger Lauf 2026-05-05)](#9-block-x--bias-audit-einmaliger-lauf-2026-05-05)
10. [Block V — Voting + Topic-Mapping](#10-block-v--voting--topic-mapping)
11. [Block M — Medien-Auftritte (Podcasts + Talkshows)](#11-block-m--medien-auftritte-podcasts--talkshows)
12. [Block W — Wartung & Hygiene](#12-block-w--wartung--hygiene)
13. [Block T — Tests & Smoketests](#13-block-t--tests--smoketests)
14. [Phase 0-6 — historische Validierungs-Pipeline](#14-phase-0-6--historische-validierungs-pipeline)
15. [Operations-Modi](#15-operations-modi)
16. [Modell-Slots & Upgrade-Pfade](#16-modell-slots--upgrade-pfade)
17. [Architektur-Changelog](#17-architektur-changelog)
18. [Bekannte Schwächen & offene Migrations-Punkte](#18-bekannte-schwächen--offene-migrations-punkte)
19. [Audit-Trail-Übersicht](#19-audit-trail-übersicht)
20. [Skript-Inventar (alphabetisch)](#20-skript-inventar-alphabetisch)

---

## 1. Zweck dieses Dokuments

Die Plattform `politik.db` enthält strukturierte Politik-Daten — Politiker-Stammdaten,
strukturierte Lebensläufe (CV), Reden mit KI-Zusammenfassung, Voting-Records,
Drucksachen, Quellen-Diskrepanzen. Aufgebaut über mehrere Wochen und etwa 90 Skripte.

Dieses Doc beantwortet drei Fragen:

1. **Wie reproduziere ich den aktuellen DB-Stand?** → Abschnitt 14.1 (Vollauf)
2. **Wie integriere ich neue Daten?** → Abschnitt 14.2 (Inkrementell)
3. **Wie tausche ich ein Modell aus?** → Abschnitt 15 (Modell-Slots)

Die Pipeline ist **Specialist-Cascade**: ein starker Generator extrahiert breit, kleine
spezialisierte Inspectors prüfen je eine Fehler-Klasse. Modell-Familien-Diversität
(Anthropic, Mistral, Meta, OpenAI) ist Bias-Schutz — nicht Marketing.

---

## 2. Architektur in einer Minute

### Pattern: Specialist-Cascade

```
[Roh-Quelle (Wikipedia, Homepage, XML-Plenarprotokoll)]
              ↓
[Generator] — starkes LLM extrahiert breit (Haiku 4.5)
              ↓
[Inspector A] — kleines spezialisiertes LLM prüft EINE Fehler-Klasse (z.B. Datum: Mistral Small)
[Inspector B] — anderes spezialisiertes LLM prüft eine ANDERE Fehler-Klasse (Doubletten: Llama 70B)
              ↓
[Repair] — deterministisch (Datum) oder fokussiertes LLM (Halluzination: Llama 70B)
              ↓
[Cross-Source-Verifier] — vergleicht zwei unabhängige Quellen (Wikipedia ↔ Homepage)
              ↓
[Mensch-Final-Check] — bei Konflikt-Verdacht: Mensch + Opus 4.7
```

### Drei zentrale Methodik-Prinzipien

1. **Eng fokussiert schlägt vielseitig überfordert.** Kleine Modelle sind günstig, aber
   chancenlos bei vielen Aufgaben gleichzeitig — auf eine eng-definierte Frage fokussiert
   sind sie zuverlässig.

2. **Modell-Familien-Diversität als Bias-Schutz.** Inspector aus anderer Familie als der
   Generator detektiert Halluzinations-Klassen, die der Generator selbst systematisch
   nicht sieht.

3. **Deterministische Schritte, wo immer möglich.** Wenn ein Inspektor das korrekte Datum
   bereits liefert, braucht das Repair kein zweites LLM — fester Regelsatz reicht und ist
   100 % auditierbar.

---

## 3. System-Voraussetzungen

### Tooling

| Tool | Zweck | Installations-Pfad |
|---|---|---|
| `node` ≥ 20 | Runtime für `npx tsx` | system-package |
| `tsx` | TypeScript ohne Build | `npx tsx <skript>` |
| `sqlite3` CLI | DB-Inspektion | `apt install sqlite3` |
| `better-sqlite3` (npm) | DB-Library für Skripte | `package.json` |
| `rclone` | R2/S3-Backup für `politik.db` | `~/bin/rclone` |
| `cloudflared` | Public Tunnel für Browser-Tests | `~/bin/cloudflared` |
| `gh` CLI | GitHub-Operationen | `~/.local/bin/gh` |

### Environment-Variablen (`.env`)

| Variable | Provider | Genutzt von |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic | Haiku (Generator + Verifier + Sonstiges-Cleanup), Reden-Batch-API |
| `GROQ_API_KEY_*` (mehrere für Round-Robin) | Groq | Llama 8B/70B, gpt-oss-120b, alle Free-Tier-Modelle |
| `MISTRAL_API_KEY` (mehrere mit Suffix möglich) | Mistral AI | Datums-Inspektor |
| `DEEPINFRA_API_KEY` | DeepInfra | Llama 70B Paid-Fallback (wenn Groq Free-Tier-Quota erschöpft) |
| `NVIDIA_API_KEY` | NVIDIA NIM | Nemotron-Nano (nur für historische Phase 0-6) |
| `GITHUB_MODELS_TOKEN` | GitHub Models | GPT-4o-mini (nur für historische Phase 0-6) |
| `BRAVE_API_KEY` | Brave Search | Homepage-Suche (Fallback wenn Wikidata leer) |
| `DIP_API_KEY` | Bundestag DIP | Drucksachen, Anfragen, Aktivitäten |

> Nicht jeder Lauf braucht alle Keys. Stammdaten-Layer (Block S) braucht keine LLM-Keys,
> nur DIP + Brave. CV-Block A braucht Anthropic + Groq + Mistral. Reden-Block braucht
> primär Anthropic (Batch-API).

### Datenpfade

| Pfad | Inhalt | Quelle |
|---|---|---|
| `data/plenarprotokolle_xml/` | Bundestag-XML-Plenarprotokolle (WP21) | `bundestag.de/services/opendata` (über `fetch-plenar-xmls.ts`) |
| `data/stammdaten/MDB_STAMMDATEN.XML` | offizielle MdB-Stammdaten | `bundestag.de` (manuell heruntergeladen, selten erneuern) |
| `data/source-coherence-corrections.jsonl` | manuelle Quellen-Korrekturen (Mensch-Final-Check) | gepflegt durch User-Recherche |
| `politik.db` | SQLite-Hauptdatenbank | wird durch Pipeline aufgebaut |

### State-Files (im Repo-Root)

| Datei | Zweck |
|---|---|
| `.batch-state.json` | Anthropic-Batch-State für Reden-Generator |
| `.batch-state-corrections.json` | Anthropic-Batch-State für Bias-Korrektur-Resubmit |
| `cv-repair-queue.jsonl` | Zwischen-Format: Datums-Inspektor → Datums-Repair |
| `*.partial.jsonl` | Resume-fähige Outputs der Inspector-Stages |

### Snapshot-Konvention

Vor jeder destruktiven DB-Operation: `politik.db.snapshot-pre-<aktion>-YYYYMMDD-HHMMSS`.
Skripte mit DB-Writes machen das automatisch (`repair-cv-entries.ts`, `cleanup-sonstiges.ts`,
`apply-source-coherence-resolutions.ts`). Manuelle Edits: `cp politik.db politik.db.snapshot-pre-...`.

---

## 4. Datenfluss-Diagramm

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Block S — Stammdaten-Layer                                              │
│   abgeordnetenwatch + Wikidata + Bundestag-XML + DIP-API                │
│   → politicians, mandates, votes, sidejobs, committees, activities,     │
│     bio_summary, qid_wikidata, homepage_url, photos                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
       ┌────────▼─────────┐         ┌─────────▼────────┐
       │ Block A           │         │ Block R          │
       │ CV-Qualitäts-     │         │ Reden-Pipeline    │
       │ Pipeline          │         │                   │
       │ (pro CV-Quelle)   │         │ XML→DB→Haiku     │
       │                   │         │                   │
       │ ① Generator       │         │ Generator         │
       │   Wikipedia/      │         │   Haiku 4.5       │
       │   Homepage        │         │   Batch-API       │
       │   ↓               │         │   ↓               │
       │ ② Stammdaten-     │         │ → speech_         │
       │   Konsistenz-     │         │   analyses_v2     │
       │   Check           │         │                   │
       │   ↓               │         └───────────────────┘
       │ ③ Datums-          │
       │   Inspector +     │              [historisch]
       │   Repair          │         ┌──────────────────┐
       │   ↓               │         │ Block X          │
       │ ④ Doubletten-     │         │ Bias-Audit       │
       │   Inspector       │         │ (einmal 2026-05) │
       └────────┬──────────┘         └──────────────────┘
                │
       ┌────────▼─────────┐
       │ Block B          │
       │ Source-Coherence │
       │ (Wiki ↔ Homepage)│
       │                  │
       │ ⑤ Detection      │
       │   gpt-oss-120b   │
       │   ↓              │
       │ ⑥ Verifier       │
       │   Haiku 4.5      │
       │   ↓              │
       │ ⑦ Repair         │
       │   Llama 70B      │
       │   (LLM-Pfad)     │
       │   ↓              │
       │ ⊕ Mensch-Final   │
       │   Opus 4.7       │
       └──────────────────┘
                │
                ▼
       ┌──────────────────┐
       │ Block W          │
       │ Wartung +        │
       │ Hygiene          │
       │ (Sonstiges-      │
       │  Cleanup,        │
       │  refetch-*)      │
       └──────────────────┘
```

---

## 5. Block S — Stammdaten-Layer

Roh-Daten ohne LLM-Aufbereitung. Quellen: abgeordnetenwatch.de · Wikidata · Wikipedia ·
bundestag.de · DIP-API · bundesregierung.de.

### S.1 — Politiker-Initial-Seed

**Skript:** `scripts/seed.ts`
**Modell:** kein
**Voraussetzung:** abgeordnetenwatch.de erreichbar
**Output:** `politicians`-Tabelle (alle aktuellen Mandate aus Bundestag, 16 Landtagen, EU-Parlament)
**Idempotenz:** überschreibt nicht, neue Mandate werden ergänzt
**Run:** `npx tsx scripts/seed.ts`

### S.2 — Bundestag-MdB-Stammdaten

**Skript:** `scripts/seed-politicians-bt.ts`
**Modell:** kein
**Voraussetzung:** `data/stammdaten/MDB_STAMMDATEN.XML` (manuell von bundestag.de geholt)
**Output:** `politicians` mit offiziellen Stammdaten ergänzt; Match-Strategie: STRENG (Vor+Nachname+Geburtsjahr → 1 Treffer); fail-loud bei Mehrdeutigkeit
**Run:** `npx tsx scripts/seed-politicians-bt.ts`

### S.3 — Bundeskabinett

**Skript:** `scripts/seed-bundeskabinett.ts`
**Modell:** kein
**Voraussetzung:** Hardcoded-Liste im Skript (Merz-Kabinett, Stand 2025/2026 — bei Kabinettswechsel manuell aktualisieren)
**Output:** `politicians.amt`, `politicians.rolle` für Kabinettsmitglieder
**Run:** `npx tsx scripts/seed-bundeskabinett.ts`

### S.4 — Nicht-MdB-Speaker

**Skript:** `scripts/seed-non-mdb-speakers.ts`
**Modell:** kein
**Voraussetzung:** Plenar-XMLs ingestiert (Block R.1+R.2), `999...`-redner-IDs aus den XMLs
**Output:** `politicians`-Einträge für Bundesrats-Speaker, Wehrbeauftragte, externe Kabinettsmitglieder
**Run:** `npx tsx scripts/seed-non-mdb-speakers.ts`

### S.5 — Politiker, die nur in Reden auftauchen

**Skript:** `scripts/seed-missing-politicians.ts`
**Modell:** kein (Wikipedia + Wikidata REST-API)
**Voraussetzung:** Hardcoded Liste mit `{name, note, expectedSearchHint?}` im Skript
**Output:** `politicians` + `politician_notes` (id ≥ 900000 für künstliche IDs)
**Run:** `npx tsx scripts/seed-missing-politicians.ts`

### S.6 — Wikipedia-Bio-Extracts

**Skript:** `scripts/seed-bios.ts`
**Modell:** kein (Wikipedia-REST `summary` Endpoint)
**Voraussetzung:** `politicians.qid_wikidata`
**Output:** `politicians.bio_summary`, `bio_url`, `bio_source`
**Idempotenz:** `--refresh` für alle, default nur leere
**Run:** `npx tsx scripts/seed-bios.ts [--all] [--refresh]`

### S.7 — Wikipedia-Volltexte

**Skript:** `scripts/fetch-wikipedia-fulltext.ts`
**Modell:** kein
**Voraussetzung:** `politicians.bio_url` oder `qid_wikidata`
**Output:** `politicians.bio_full_text` (Plain Text, Volltext für CV-Generator)
**Run:** `npx tsx scripts/fetch-wikipedia-fulltext.ts`

### S.8 — Wikidata-Homepages + Social-Handles

**Skript:** `scripts/seed-homepages.ts`
**Modell:** kein (Wikidata SPARQL VALUES-Query)
**Voraussetzung:** `politicians.qid_wikidata`
**Output:** `politicians.homepage_url`, `twitter_handle`, `instagram_handle`
**Run:** `npx tsx scripts/seed-homepages.ts [--all]`

### S.9 — Homepage-Suche-Fallback

**Skript:** `scripts/find-missing-homepages.ts`
**Modell:** kein (DuckDuckGo HTML-Search)
**Voraussetzung:** MdBs ohne `homepage_url` aus S.8
**Output:** `politicians.homepage_url` mit `homepage_source='search'`
**Run:** `npx tsx scripts/find-missing-homepages.ts [--dry-run] [--limit N]`

### S.10 — Politiker-Fotos

**Skript:** `scripts/seed-photos-wikidata.ts`
**Modell:** kein (Wikimedia Commons API)
**Voraussetzung:** `politicians.qid_wikidata`, Bundestag (Q124661964) gefiltert
**Output:** `public/photos/<id>.jpg` + `politicians.photo_path` + Lizenz-Attribution
**Run:** `npx tsx scripts/seed-photos-wikidata.ts [--dry-run]`

### S.11 — abgeordnetenwatch-Sub-Daten

**Skript:** `scripts/seed-abgeordnetenwatch.ts`
**Modell:** kein (abgeordnetenwatch v2-API)
**Voraussetzung:** `politicians` aus S.1, `politicians.mandate_id` (von abgeordnetenwatch)
**Output:** `votes`, `sidejobs`, `committee_memberships`
**Run:** `npx tsx scripts/seed-abgeordnetenwatch.ts [--all]`

### S.12 — DIP-Aktivitäten (Drucksachen, Anfragen)

**Skript:** `scripts/seed-activities.ts`
**Modell:** kein (DIP-API)
**Voraussetzung:** `DIP_API_KEY` in `.env`
**Output:** `activities`, `activity_politician_links`
**Run:** `npx tsx scripts/seed-activities.ts`

### S.13 — Bundestag-Bios

**Skript:** `scripts/fetch-bundestag-bios.ts`
**Modell:** kein (bundestag.de Scraping)
**Output:** `politicians.bundestag_bio_text` (Bio-Text aus dem MdB-Profil)
**Run:** `npx tsx scripts/fetch-bundestag-bios.ts`

### S.14 — Patch fehlende Bundestag-Bios

**Skript:** `scripts/patch-missing-bundestag-bios.ts`
**Modell:** kein
**Voraussetzung:** Hardcoded URL-Mapping im Skript für MdBs, die nicht im AJAX-Listen-Endpoint waren
**Output:** `politicians.bundestag_bio_text` für nachgepflegte URLs
**Run:** `npx tsx scripts/patch-missing-bundestag-bios.ts`

### S.15 — Bundesregierung-Bios

**Skript:** `scripts/fetch-bundesregierung-bios.ts`
**Modell:** kein (bundesregierung.de Scraping)
**Voraussetzung:** Kabinett aus S.3
**Output:** `politicians.bundesregierung_bio_text` für Kabinettsmitglieder
**Run:** `npx tsx scripts/fetch-bundesregierung-bios.ts`

---

## 6. Block A — CV-Qualitäts-Pipeline (pro CV)

Zweck: aus Wikipedia-Volltext + Homepage-Vita strukturierte JSON-CVs erzeugen, die
Halluzinationen identifizieren und reparieren. Geprüft wird **gegen die Quelle** —
nicht zwei Quellen gegeneinander (das ist Block B).

### A.1 — CV-Generator (Wikipedia, Hauptquelle) ⭐ Generator-Slot

**Skript:** `scripts/seed-cv.ts`
**Modell:** `claude-haiku-4-5` (Anthropic)
**Modell-Slot:** **Generator-Slot Wikipedia** — Upgrade-Pfad: Haiku 4.5 → Sonnet 4.5/4.6 → Opus 4.7
**Voraussetzung:** `politicians.bio_full_text` (aus S.7)
**Output:** `cv_json`, `cv_model`, `cv_prompt_version`, `cv_raw_llm_response`
**Idempotenz:** default skipt befüllte Reihen, `--refresh` für alle
**Cost:** ~$2-3 für 640 MdBs (Vollauf)
**Run:** `npx tsx scripts/seed-cv.ts [--refresh] [--limit N]`

### A.2 — CV-Generator (Homepage-Fallback) ⚠️ Migration ausstehend

**Skript:** `scripts/seed-cv-homepage.ts`
**Modell:** `llama-3.1-8b-instant` (Groq Free Tier) — **Migration auf Haiku 4.5 vorgesehen**
**Modell-Slot:** **Generator-Slot Homepage** — heutige Wahl historisch (Free-Tier-Generator),
methodisch ist Haiku 4.5 die richtige Wahl (Block A.1 nutzt das auch). Bei Förder-Geld
zuerst diesen Slot upgraden.
**Voraussetzung:** `politicians.homepage_url` (aus S.8 oder S.9)
**Output:** `cv_homepage_json`, `cv_homepage_url` (genauer Pfad zur Vita-Seite, oft Subpfad),
`cv_homepage_text` (Roh-Text), `cv_homepage_model`, `cv_homepage_prompt_version`,
`cv_homepage_generated_at`
**Strategie:** Findet automatisch den richtigen Vita-Subpfad (Standard-Pfade probieren,
Link-Scan, Sitemap-Suche, One-Pager-Fallback)
**Idempotenz:** default skipt befüllte, `--refresh` für alle, `--all` für alle Politiker
(default nur Bundestag)
**Cost:** $0 (Free Tier) — bei Migration auf Haiku ~$3-5 für 561 MdBs
**Run:** `npx tsx scripts/seed-cv-homepage.ts [--all] [--refresh] [--limit N]`

### A.3 — CV-Generator (manueller Paste) — ad-hoc

**Skript:** `scripts/seed-cv-from-paste.ts`
**Modell:** `llama-3.1-8b-instant`
**Zweck:** für MdBs, deren Bio nur als Text-Snippet vorliegt (Notfall-Pfad)
**Voraussetzung:** Stdin-Input mit Bio-Text + politician_id als Argument
**Output:** wie A.2
**Run:** `cat bio.txt | npx tsx scripts/seed-cv-from-paste.ts <politician_id>`

### A.4 — CV-Generator (manueller Eingabe) — ad-hoc

**Skript:** `scripts/seed-cv-manual.ts`
**Modell:** `llama-3.1-8b-instant`
**Zweck:** gezielter Scraper für manuell gefundene Bio-URLs (für die 46 MdBs, die beim
automatischen Scraping in A.2 durchgefallen sind)
**Voraussetzung:** Hardcoded URL-Liste im Skript
**Run:** `npx tsx scripts/seed-cv-manual.ts`

### A.5 — Stammdaten-Konsistenz-Check (deterministisch) ⭐ Methodisches Goldstandard-Argument

**Skript:** `scripts/check-cv-consistency.ts`
**Modell:** **deterministisch — kein LLM**
**Methodischer Wert:** vergleicht LLM-Outputs gegen **harte unabhängige Wahrheits-Quellen**
in der DB. Wo das LLM widerspricht, ist das fast sicher Halluzination. Reproduzierbar,
kein Modell-Bias möglich, kostet nichts laufend.
**Voraussetzung:** `cv_json` (A.1) + `politicians.year_of_birth` (Wikidata via S.1) +
`politicians.party_id` (abgeordnetenwatch via S.1) + `mandates`
**Output:** `cv-consistency-report.md` (Markdown-Report mit allen Auffälligkeiten)
**Run:** `npx tsx scripts/check-cv-consistency.ts`

### A.6 — Stammdaten-Fixes anwenden (deterministisch)

**Skript:** `scripts/apply-consistency-fixes.ts`
**Modell:** **deterministisch — kein LLM**
**Voraussetzung:** `cv-consistency-report.md` aus A.5
**Output:** angepasstes `cv_json` (z.B. CV-Einträge mit Jahr < `year_of_birth` werden gelöscht)
**Run:** `npx tsx scripts/apply-consistency-fixes.ts`

### A.7 — Datums-Inspektor ⭐ Specialist-Pattern-Beleg

**Skript:** `scripts/inspect-dates.ts`
**Modell:** `mistral-small-latest` (Mistral AI)
**Modell-Slot:** **Datums-Inspector-Slot** — Upgrade-Pfad: Mistral Small → Mistral Medium/Large
(bleibt fokussiert auf Datums-Klasse). Nicht auf Haiku/Llama upgraden — Familien-Diversität
zum Generator (Anthropic) wäre weg.
**Voraussetzung:** `cv_json` (A.1), `politicians.bio_full_text` (S.7)
**Eingabe pro Aussage:** strukturierter CV-Eintrag + Roh-Quelltext
**Frage pro Aussage:** "Steht das Datum wörtlich im Text? Erfunden? Übersehen?"
**Status-Enum:** `korrekt | korrekt_leer | datum_falsch | halluziniert | fehlend | unklar`
**Output:** `inspect-dates.partial.jsonl` (resume-fähig, ein Eintrag pro Politiker mit
Liste aller Datums-Verdicts)
**Inspector-Version:** `inspect-dates-v2-mistral`
**Cost:** sehr niedrig (Mistral Free-Tier)
**Run:** `npx tsx scripts/inspect-dates.ts`

### A.8 — Datums-Inspector-Cascade-Verifier (Llama 70B)

**Skript:** `scripts/verify-mistral-verdicts.ts`
**Modell:** `llama-3.3-70b-versatile` (Groq)
**Zweck:** Reality-Check zeigte ~60% FP für `halluziniert` und ~80% FP für `fehlend` bei
Mistral. Llama 70B als zweite, andere Familie filtert die FPs.
**Voraussetzung:** `inspect-dates.partial.jsonl` (A.7), `politicians.bio_full_text`
**Output:** `verify-mistral.partial.jsonl`
**Run:** `npx tsx scripts/verify-mistral-verdicts.ts`

### A.9 — Datums-Repair-Queue aggregieren

**Skript:** `scripts/aggregate-repair-queue.ts`
**Modell:** **deterministisch — kein LLM**
**Voraussetzung:** `inspect-dates.partial.jsonl` (A.7) + `verify-mistral.partial.jsonl` (A.8)
**Output:** `cv-repair-queue.jsonl` mit Aktionen: `clear_date | set_date | merge_entries`
**Run:** `npx tsx scripts/aggregate-repair-queue.ts`

### A.10 — Datums-Repair anwenden (deterministisch) ⭐ kein LLM nötig

**Skript:** `scripts/repair-cv-entries.ts`
**Modell:** **deterministisch — kein LLM**
**Methodischer Wert:** der Inspektor liefert das korrekte Datum bereits. Anwendung nach
festen Regeln → 100 % auditierbar. Vor jedem `--apply` automatischer DB-Snapshot.
**Voraussetzung:** `cv-repair-queue.jsonl` (A.9)
**Output:** angepasstes `cv_json` + `cv_repair_log` (Tabelle mit Originaltext, neuem Text,
Begründung, Audit pro Patch); `repair_version='repair-v1'`
**Idempotenz:** `--dry-run` default (zeigt Plan), `--apply` schreibt; `--ids=...` für selektiv
**Run:** `npx tsx scripts/repair-cv-entries.ts [--apply] [--ids=79129,175003]`

### A.11 — Doubletten-Vorfilter (deterministisch)

**Skript:** `scripts/detect-duplicates.ts`
**Modell:** **deterministisch — kein LLM**
**Logik:** Jaccard-Similarity auf normalisierten Wörtern + Jahres-Overlap; flag wenn
(jahr_overlap UND text-sim > 0.5) ODER text-sim > 0.85
**Voraussetzung:** `cv_json` (A.1) und/oder `cv_homepage_json` (A.2)
**Output:** `detect-duplicates.partial.jsonl` (Verdachts-Pärchen)
**Run:** `npx tsx scripts/detect-duplicates.ts`

### A.12 — Doubletten-Verifier (Llama 70B)

**Skript:** `scripts/verify-duplicates.ts`
**Modell:** `llama-3.3-70b-versatile` (Groq)
**Modell-Slot:** **Doubletten-Verifier-Slot** — Upgrade-Pfad: Llama 70B → Sonnet (wenn
Cost akzeptabel), aber Familien-Diversität zum Generator (Anthropic) muss erhalten bleiben
**Frage pro Pärchen:** "Beziehen sich beide Einträge auf denselben Sachverhalt? Wenn ja,
wie konsolidieren?"
**Voraussetzung:** `detect-duplicates.partial.jsonl` (A.11)
**Output:** `confirm-duplicates.partial.jsonl` mit `merge: true/false` + `merged_entry`
**Run:** `npx tsx scripts/verify-duplicates.ts`

### A.13 — CV-Summary (Llama 8B) ⚠️ Migration ausstehend

**Skript:** `scripts/generate-cv-summary.ts`
**Modell:** `llama-3.1-8b-instant` — **Migration auf Haiku 4.5 vorgesehen** (gleiche Begründung wie A.2)
**Voraussetzung:** `cv_json` (A.1) + `cv_homepage_json` (A.2)
**Output:** `politicians.cv_summary` (2-3-Satz-Bio für UI), `cv_summary_model`,
`cv_summary_generated_at`
**Concurrency:** 2 (Groq RPM-Limit für 8B-instant)
**Cost:** $0 Free Tier; bei Migration auf Haiku ~$2-3 für 640 MdBs
**Run:** `npx tsx scripts/generate-cv-summary.ts`

### Optional: Sonstiges-Cleanup (Hygiene-Pass)

→ siehe Abschnitt 11 (Block W — Wartung)

---

## 7. Block B — Source-Coherence-Pipeline (Wikipedia ↔ Homepage)

Zweck: zwei unabhängige Quellen gegeneinander prüfen. Beantwortet eine **andere Frage**
als Block A: "Sagen zwei Quellen dasselbe?", nicht "Stimmt der CV mit seiner Quelle überein?".

### B.1 — Source-Coherence-Detection ⭐ andere Frage als Block A

**Skript:** `scripts/source-coherence-check.ts`
**Modell:** `openai/gpt-oss-120b` (Groq)
**Modell-Slot:** **Cross-Source-Detection-Slot** — Upgrade-Pfad: gpt-oss-120b →
Haiku 4.5 (kürzere Latenz) oder Sonnet/Opus (höhere Recall). Familien-Diversität:
OpenAI ≠ Anthropic-Generator ≠ Mistral-Datums-Inspektor.
**Frage:** "Wo unterscheiden sich Wikipedia-CV und Homepage-CV bei demselben Sachverhalt?"
**Voraussetzung:** `cv_json` (A.1) + `cv_homepage_json` (A.2) für denselben Politiker
**Output:** `source-coherence.partial.jsonl` mit Konflikt-Kandidaten pro MdB +
`politicians.source_conflicts` (JSON-Array) + `politicians.source_coherence_checked_at`
**Cost:** sehr niedrig (Groq Free Tier)
**Run:** `npx tsx scripts/source-coherence-check.ts`

### B.2 — Source-Coherence-Verifier ⭐ Empirisch validiert in Phase 7

**Skript:** `scripts/verify-source-coherence-haiku.ts`
**Modell:** `claude-haiku-4-5` (Anthropic)
**Modell-Slot:** **Cross-Source-Verifier-Slot** — Empirie aus Phase 7: Llama 70B 37 % ECHT-Recall,
Haiku 4.5 69 % ECHT-Recall. Upgrade-Pfad: Haiku → Sonnet → Opus für höheren Recall.
**Frage pro Konflikt-Kandidat:** "Echte Quellen-Diskrepanz? Präzisierung (gleicher Sachverhalt,
anders formuliert)? False-Positive (Detection hat falsch geflaggt)?"
**Voraussetzung:** `politicians.source_conflicts` (B.1) + `bio_full_text` + `cv_homepage_text`
**Output:** `haiku-verdicts-source-coherence.jsonl` mit `haiku_verdict` und `haiku_reason`
**Run:** `npx tsx scripts/verify-source-coherence-haiku.ts`

### B.3 — Verdicts persistieren

**Skript:** `scripts/persist-source-coherence-verdicts.ts`
**Modell:** kein
**Voraussetzung:** `haiku-verdicts-source-coherence.jsonl` (B.2)
**Output:** ergänzt jeden Konflikt-Eintrag in `politicians.source_conflicts` um
`final_verdict`, `final_reason`, `verdict_method`
**Run:** `npx tsx scripts/persist-source-coherence-verdicts.ts`

### B.4 — Halluzinations-Reparatur (LLM-Pfad)

**Skript:** `scripts/fix-hallucinated-cv-entries.ts`
**Modell:** `llama-3.3-70b-versatile` (Groq) — größeres Schwester-Modell des Llama-8B-Generators
**Modell-Slot:** **Halluzinations-Repair-Slot** — Aufgabe ist Schema-Match (nicht Reasoning),
dafür reicht Llama 70B. Familien-Diversität zum Generator (Anthropic) wichtig.
**Voraussetzung:** Stage-5.5-Verdicts mit `wikipedia_extraktion_falsch | homepage_extraktion_falsch | beide_falsch`
**Output:** angepasstes `cv_json` / `cv_homepage_json` + `fix-hallucinated-cv-report.md`
**Run:** `npx tsx scripts/fix-hallucinated-cv-entries.ts [--dry-run]`

### B.5 — Mensch-Final-Check (Opus 4.7 + User-Recherche) ⭐ Pflicht-Schritt

**Methodischer Wert:** Verifier-Cascade übersieht Einzelfälle (siehe Phase-7-Empirie). Mensch
zieht jede Klassifikation gegen die Quellen, mit Opus 4.7 als Reasoning-Hilfe. Final-Verdict
landet öffentlich auf der Profilseite und auf `/quellen-diskrepanzen`.

**Workflow:**
1. Lade `politicians.source_conflicts` mit `final_verdict='ECHT'` aus DB
2. Pro Konflikt: User recherchiert in den Roh-Quellen (oft Wikidata, Bundestag-Profil, Homepage-Archiv)
3. Manuelle Korrektur via SQL UPDATE oder über `apply-source-coherence-resolutions.ts`
4. Update `verdict_method='opus-4.7-manual-post-haiku-user-research'`, `revised: true`

**Empirie-Befund (Session 2026-05-06):** 9 von 14 ursprünglichen ECHT-Verdicts hielten
der manuellen Recherche nicht stand (~64% False-Positive-Rate). Häufigstes Fehler-Muster:
Stage-⑤-Zeitraum-Verschmelzung (zwei separate Einträge zu einem fiktiven Konflikt verschmolzen).

### B.6 — Source-Coherence-Korrekturen anwenden

**Skript:** `scripts/apply-source-coherence-corrections.ts`
**Modell:** kein
**Voraussetzung:** `data/source-coherence-corrections.jsonl` mit manuell gepflegten
Auto-Korrekturen (z.B. Hardt: Königstein/Hofheim-Fix)
**Output:** angepasstes `cv_json` / `cv_homepage_json` + `cv_repair_log` mit
`repair_version='source-coherence-corrections-v1'`
**Run:** `npx tsx scripts/apply-source-coherence-corrections.ts`

### B.7 — Source-Coherence-Resolutions anwenden

**Skript:** `scripts/apply-source-coherence-resolutions.ts`
**Modell:** kein
**Voraussetzung:** Mensch-Final-Verdicts (siehe B.5)
**Output:** `final_verdict`-Revisionen ECHT → PRAEZISIERUNG | FALSE_POSITIVE im
`source_conflicts`-JSON; Text-Patches (Auto-Korrekturen) in `cv_homepage_json`;
`cv_repair_log` mit `repair_version='source-coherence-resolutions-v1'`
**Run:** `npx tsx scripts/apply-source-coherence-resolutions.ts`

---

## 8. Block R — Reden-Pipeline

Zweck: Plenarprotokolle als XML laden, Reden extrahieren, mit Haiku 4.5 zusammenfassen
(strukturiert mit Tool-Use-Schema).

### R.1 — Plenar-XMLs holen

**Skript:** `scripts/fetch-plenar-xmls.ts`
**Modell:** kein (Bundestag.de Open Data AJAX)
**Voraussetzung:** `data/plenarprotokolle_xml/` Verzeichnis
**Output:** neue WP21-XML-Dateien in `data/plenarprotokolle_xml/`
**Idempotenz:** lädt nur fehlende
**Run:** `npx tsx scripts/fetch-plenar-xmls.ts`

### R.2 — XMLs in DB einlesen

**Skript:** `scripts/ingest-plenarprotokoll-xmls.ts`
**Modell:** kein
**Voraussetzung:** XMLs aus R.1
**Output:** `plenar_sessions`, `plenar_speeches` (mit `rede_id`, `redner_id`, `page`,
`original_text`, `xml_source`); `speech_summaries.zusammenfassung` bleibt NULL
**Run:** `npx tsx scripts/ingest-plenarprotokoll-xmls.ts`

### R.3 — Reden vollständig extrahieren

**Skript:** `scripts/extract-all-speeches.ts`
**Modell:** kein
**Voraussetzung:** `plenar_speeches` aus R.2
**Logik:** XML als Single Source of Truth; pro `<rede>` mit mehreren Sprechern (z.B.
Zwischenfragen) wird pro Sprecher ein eigener Eintrag (`segment_index`) erzeugt
**Output:** vollständig befüllte `plenar_speeches` mit kanonischer `redner_id`
**Run:** `npx tsx scripts/extract-all-speeches.ts`

### R.4 — Speaker → Politician Mapping persistieren

**Skript:** `scripts/backfill-speaker-politician-links.ts`
**Modell:** kein (Fuzzy-Match-Logik)
**Voraussetzung:** `plenar_speeches.redner_id` (R.3) + `politicians`
**Output:** `speech_summaries.politician_id`
**Match-Strategie:** redner_id (zuverlässigste); Fuzzy-Match-Fallback mit Sonderzeichen-
Normalisierung, Multi-Word-Last-Names (Adelspräfixe), Doppelvornamen, Substring-Last-Names,
Title-Strip, Stadt-Suffix-Strip
**Run:** `npx tsx scripts/backfill-speaker-politician-links.ts`

### R.5 — Reden-Generator (Anthropic Batch API) ⭐ Generator-Slot

**Skript:** `scripts/batch-submit-reden.ts`
**Modell:** `claude-haiku-4-5` (Anthropic Batch API mit Prompt-Caching)
**Modell-Slot:** **Reden-Generator-Slot** — Upgrade-Pfad: Haiku 4.5 → Sonnet/Opus
**Voraussetzung:** `plenar_speeches.original_text` ≥ 200 Zeichen, `docs/summarization-methodology.md`
(v2.1 mit H10 + neutralitaets_self_check)
**Output:** Batch-ID in `.batch-state.json`; nach Retrieve: `speech_analyses_v2`-Tabelle
**Tool-Use-Schema:** strukturierter JSON-Output (zusammenfassung_2_saetze, hauptthemen,
tonalitaet, wertende_ausdruecke, neutralitaets_self_check, etc.)
**Cost:** ~$41.82 für 9.913 Reden im Vollauf 2026-05-01
**Run:** `npx tsx scripts/batch-submit-reden.ts [--confirm]`

### R.6 — Reden-Batch-Retrieve

**Skript:** `scripts/batch-retrieve-reden.ts`
**Modell:** kein (Anthropic Batch-API-Polling)
**Voraussetzung:** `.batch-state.json` aus R.5
**Output:** `speech_analyses_v2` mit allen Feldern + Audit-Spalten (`model`, `prompt_version`,
`batch_id`)
**Run:** `npx tsx scripts/batch-retrieve-reden.ts            # Status zeigen`
        `npx tsx scripts/batch-retrieve-reden.ts --apply    # Resultate in DB`

### R.7 — Tonalitäts-Drift-Fix (einmalig 2026-05-05)

**Skript:** `scripts/fix-tonalitaet-drift.ts`
**Modell:** kein (Mapping-Tabelle deterministisch)
**Zweck:** Tool-Use-Schema-Lock hat trotz Enum nicht 100% gegriffen; ~33 Reden mit
"erfundenen" Tonalitäten außerhalb des 11-Werte-Enums
**Voraussetzung:** `speech_analyses_v2`
**Output:** `speech_analyses_v2.tonalitaet` korrigiert; neue Spalte `tonalitaet_original`
mit dem Original-Wert (NULL für unveränderte); JSONL-Audit aller Änderungen
**Status:** ✅ einmalig durchgeführt; bei zukünftigen Vollauf-Batches Schema noch strikter
machen oder erneut durchziehen
**Run:** `npx tsx scripts/fix-tonalitaet-drift.ts`

### R.8 — Reden-Roh-Text-Refresh

**Skript:** `scripts/refresh-original-text.ts`
**Modell:** kein
**Zweck:** zieht für alle `speech_summaries` mit `rede_id` den Volltext neu aus der XML —
diesmal ohne den `klasse="redner"`-Header (Cleanup nach gefundener XML-Parsing-Lücke)
**Run:** `npx tsx scripts/refresh-original-text.ts`

---

## 9. Block X — Bias-Audit (einmaliger Lauf 2026-05-05)

Zweck: nachträgliche Bias-Audit der 9.913 Reden-Zusammenfassungen aus R.5/R.6.
Hat zu Methodology v2.1 geführt (`docs/summarization-methodology.md` mit H10 +
`neutralitaets_self_check`-Feld). Skripte sind primär **einmalige Audit-Stages**,
keine kanonische Pipeline — sie dokumentieren den methodischen Audit-Prozess.

### X.1 — Tier-A-Wortliste-Filter (deterministisch)

**Skript:** `scripts/bias-audit-tier-a-only.ts`
**Modell:** kein (mechanischer Filter mit Bias-Wortliste)
**Wortliste:** `skandalisier*`, `polemisier*`, `diffamier*`, `denunzier*`, `verdamm*`,
`fabulier*`, `Heuchelei`, `Doppelmoral`, `Stimmungsmache`, `Abgesang` (kaum von Sprechern
selbst genutzt — hohe Bias-Konfidenz)
**Output:** `bias-audit-tier-a-only.jsonl` mit allen Reden, deren v2.1-Summary ein Tier-A-Wort enthält
**Run:** `npx tsx scripts/bias-audit-tier-a-only.ts`

### X.2 — Bias-Klassifikation (Llama 8B, mechanischer Filter + LLM)

**Skript:** `scripts/bias-classify-llama.ts`
**Modell:** `llama-3.1-8b-instant` (Groq, 4 Keys round-robin)
**Logik:** Phase 1 mechanischer Filter (Tier A + B + Pattern-B-Heuristik); Phase 2 Llama
prüft pro Treffer: "Verwendet der Sprecher dieses Wort (oder klares Synonym) selbst?" → JA/NEIN/UNKLAR
**Voraussetzung:** `speech_analyses_v2`
**Output:** `bias-classification.jsonl` (resume-fähig)
**Run:** `npx tsx scripts/bias-classify-llama.ts`

### X.3 — Layer-1-Audit

**Skript:** `scripts/bias-audit-layer1.ts`
**Modell:** kein
**Methodische Klarstellung:** aggregierte Tonalitäts-Verteilungen pro Partei sind
**KEIN Bias-Indikator** — empirische Asymmetrie spiegelt sich legitim in Klassifikations-
Verteilungen.
**Output:** Layer-1-Audit-Report
**Run:** `npx tsx scripts/bias-audit-layer1.ts`

### X.4 — Manuelle Stichprobe (15 stratifizierte Reden)

**Skript:** `scripts/bias-audit-manual-sample.ts`
**Modell:** kein
**Strategie:** 3 Reden pro Partei × 5 Parteien, mit jeweils einem typischen wertenden Verb;
Hinweis ob das Verb auch im Originaltext vorkommt
**Output:** `bias-audit-manual-sample-2026-05-05.md`
**Run:** `npx tsx scripts/bias-audit-manual-sample.ts`

### X.5 — Broader Sample (200 Reden)

**Skript:** `scripts/bias-audit-broad-sample.ts`
**Output:** `bias-audit-broad-200.jsonl`

### X.6 — Alle 222 extrahieren

**Skript:** `scripts/bias-audit-extract-all-222.ts`
**Output:** `bias-audit-all-222.jsonl`

### X.7 — Klasse-A+B Export für Review

**Skript:** `scripts/export-class-ab-for-review.ts`
**Output:** `bias-class-ab.jsonl` (142 Klasse-A+B-Reden)

### X.8 — Bias-Korrektur-Resubmit (Anthropic Batch API)

**Skript:** `scripts/batch-resubmit-bias-corrections.ts`
**Modell:** `claude-haiku-4-5`
**Voraussetzung:** Liste der 400 als NEIN-klassifizierten Reden + Methodology v2.1
**Tool-Schema-Erweiterung:** `neutralitaets_self_check` als Pflicht-Feld
**Output:** Batch-ID in `.batch-state-corrections.json`
**Run:** `npx tsx scripts/batch-resubmit-bias-corrections.ts`

### X.9 — Bias-Korrektur-Retrieve

**Skript:** `scripts/batch-retrieve-corrections.ts`
**Modell:** kein
**Output:** Tabelle `speech_analyses_v2_corrections` (Original v2 bleibt unangetastet,
vollständiger Vorher/Nachher-Audit-Trail); enthält das neue `neutralitaets_self_check_json`
**Run:** `npx tsx scripts/batch-retrieve-corrections.ts`

### X.10 — Auswertung Bias-Korrektur

**Skript:** `scripts/analyze-corrections.ts`
**Modell:** kein
**Output:** Markdown-Report mit Konfidenz-Verteilung, Wortliste-Filter auf neue Summaries
(Doppel-Validierung), Vorher/Nachher-Vergleich
**Run:** `npx tsx scripts/analyze-corrections.ts`

### X.11 — Finale Bias-Fixes bauen

**Skript:** `scripts/build-final-bias-fixes.ts`
**Modell:** kein (Tool-Tag-Strip + Whitelist-Logik)
**Output:** Liste der 51 finalen Bias-Fixes für DB-Anwendung
**Run:** `npx tsx scripts/build-final-bias-fixes.ts`

### X.12 — Bias-Fixes anwenden

**Skript:** `scripts/apply-bias-fixes.ts`
**Modell:** kein (Filter-Logik: Tier-A-Wort enthalten das NICHT im Original-Text steht → klare Bias-Korrektur)
**Output:** angewendete Fixes
**Run:** `npx tsx scripts/apply-bias-fixes.ts`

### X.13 — Final-DB-Update (51 Fixes)

**Skript:** `scripts/apply-final-fixes-to-db.ts`
**Modell:** kein
**Strategie:** neue Spalte `zusammenfassung_2_saetze_final` in `speech_analyses_v2_corrections`
(originaler v2.1-Output bleibt in `zusammenfassung_2_saetze`); UI nutzt
`COALESCE(final, v2.1, v1)` für Anzeige
**Run:** `npx tsx scripts/apply-final-fixes-to-db.ts`

---

## 10. Block V — Voting + Topic-Mapping

### V.1 — Vote-Daten nachfüllen

**Skript:** `scripts/backfill-vote-dates.ts`
**Modell:** kein
**Zweck:** Bug-Fix für `seed-abgeordnetenwatch.ts` (`/votes`-API liefert nur reduziertes
Poll-Objekt ohne `field_poll_date` — pro distinct `poll_id` einmal `/polls/{id}` fetchen)
**Output:** `votes.poll_date` für alle Votes
**Status:** ✅ einmalig durchgeführt (Bug behoben)
**Run:** `npx tsx scripts/backfill-vote-dates.ts`

### V.2 — Vote → Plenar-Topic Mapping

**Skript:** `scripts/map-votes-to-topics.ts`
**Modell:** `claude-haiku-4-5`
**Modell-Slot:** **Vote-Topic-Mapping-Slot** — Upgrade auf Sonnet/Opus möglich, aber
Aufgabe ist Schema-Match (kein offenes Reasoning)
**Voraussetzung:** `votes` (V.1) + `plenar_topics` (aus R.2)
**Output:** `vote_topic_links(poll_id, topic_id, is_primary, confidence, reasoning)`
**Methodik:** dokumentiert in `docs/vote-topic-mapping-methodology.md`
**Run:** `npx tsx scripts/map-votes-to-topics.ts`

---

## 11. Block M — Medien-Auftritte (Podcasts + Talkshows)

**Neu seit:** 2026-05-23 · **Stand:** 2026-05-24 · **Status:** Aktiver Bau, MVP live, viel offen

> Ergänzung zu Reden/Voting: erfasst Podcast- und Talkshow-Auftritte von MdBs
> mit KI-Themen-/Aussagen-/Frage-Antwort-Analyse. Datenfluss ist file-basiert,
> NICHT in `politik.db` (Index in `data/media-appearances.json`, Detail-Analysen
> in `data/media-analyses/*.json`). Bewusst getrennt: Pipeline ist noch jung,
> Schema entwickelt sich, kein Risiko für die DB.

### M.1 — Discovery (Suggestion-Queue)

**Skripte:** `scripts/discover/discover-lanz.ts`, `scripts/discover/_lib/politician-matcher.ts`
**Quellen:** fernsehserien.de Episoden-Guide (Markus Lanz live), Wikipedia (Jung & Naiv geplant)
**Match:** Name → MdB-Filter via `parliament_periods` (nur Bundestag 2025–2029)
**Output:** `data/discovery-suggestions.json` (Pool für Batch-Submit)
**Status:** ✅ Lanz fertig (60+ Vorschläge gequeued), Wikipedia-J&N + Anne Will + Maischberger offen

### M.2 — Transkription (Captions)

**Tools:** `yt-dlp` + `curl-cffi` (Impersonation gegen YouTube-429), ZDF-Mediathek direkt
**VTT-Parser:** `scripts/_lib/media-analysis-shared.ts` (`parseVTT` mit Speaker-Marker-Support)
**Multi-Speaker:** ZDF-redaktionelle Marker (`FB:`, `ML:`, `SM:`, `EQ:`) werden erkannt
**Block-Größe:** 30s (60s für ZDF-Speaker-tagged) — kleiner = präzisere Timestamps
**Caveat:** Auto-Captions enthalten Wort-Fehler (Quote-Validation per Substring-Match)

### M.3 — LLM-Analyse

**Skript (Live):** `scripts/analyze-media-appearance.ts` — single-run mit Streaming
**Skript (Batch):** `scripts/batch-media-analyses.ts` — Anthropic Batches API (50% Discount)
**Modell:** `claude-haiku-4-5` mit Tool-Use-Schema
**Modell-Slot:** **Medien-Analyse-Slot** — Sonnet/Opus möglich, aber Cost-Tradeoff
**max_tokens:** 32000 (24k war Limit, hat Cademartori-Output abgeschnitten)
**Schema-Pflichtfelder pro Thema:** `question_asked`, `question_intent`, `answer_match`
(`voll_adressiert` / `teil_adressiert` / `verschoben` / `umgeleitet_gegenpunkt` / `verweigert` /
`kein_direkter_anlass`), `match_reasoning` — keine optionalen Felder
**Methodologie-Doc:** `methodology.md` (Bundestag) + `methodology-berlin.md` für Landtag
**Bekannte Schwächen:** Tool-Use-JSON-String-Bug (`themes` als string statt array → Repair im Batch-Apply),
deutsche Quotes terminieren JSON-Strings (Repair: konsistent „…")

### M.4 — Batch-Apply

**Submit:** `npx tsx scripts/batch-media-analyses.ts --submit`
**Status:** `npx tsx scripts/batch-media-analyses.ts --status`
**Apply:** `npx tsx scripts/batch-media-analyses.ts --apply`
**Filter:** `--include id1,id2` für Subset-Re-Runs
**Quote-Validation:** Exact-Match + Fuzzy (80% Token-Overlap) — Prozent in `_meta.quote_validation.valid_pct`
**Cost-Tracking:** `_meta.cost_usd` pro Analyse, Total: $0.42 für 14 Analysen (Schnitt $0.03)

### M.5 — UI

**Profil-Karte:** `src/components/MediaAppearancesProfilSection.tsx` (im Politiker-Profil)
**Detail-Seite:** `src/app/design/linear/politiker/[id]/medien/[appearance-id]/page.tsx`
**Übersichts-Seite:** `src/app/design/linear/medien/page.tsx` (alle analysierten Auftritte chronologisch)
**Landing-Strip:** `src/components/RecentMediaAnalysesStrip.tsx` (3 neueste auf Linear-Startseite)
**Card-Komponente:** `src/components/MediaAppearanceCard.tsx` (geteilt zwischen Strip + Übersicht)
**ToC + UX-Polish:** Sticky Side-Nav (Desktop), Mobile Drawer mit hide-on-scroll, Reading-Progress, Back-to-Top, YouTube-Embed Click-to-Load (DSGVO via youtube-nocookie.com)
**Methodik-Disclaimer:** kompakter Hinweis oben + Vollblock am Footer (#methodik) auf jeder Detail-Seite

### Stand (2026-05-24)

| Metric | Wert |
|---|---|
| Analysierte Auftritte | 14 |
| MdBs abgedeckt | 12 |
| Sendungen | 2 (Jung & Naiv, Markus Lanz) |
| Discovery-Queue | 60+ Lanz-Vorschläge gequeued |
| Total-Cost | ~$0.42 |
| Quote-Valid-Median | >90% |

### Offene Arbeit (Nächste Sessions)

- **Discovery Phase D:** Acceptance-Workflow / 1-Click-Batch aus `data/discovery-suggestions.json` (Task #37)
- **Mehr Discovery-Quellen:** Wikipedia-J&N-Scraper, Anne Will, Maischberger, Lage der Nation
- **Symmetry-Audit:** ≥20 MdBs über alle Fraktionen vor Publishing der Klassifikation (Bias-Schutz)
- **Vote-Cross-Reference:** Was MdB im Podcast sagte vs. wie sie im Bundestag abgestimmt hat
- **AfD-Sample erweitern:** aktuell zu wenig für robusten Inter-Party-Vergleich
- **Mehr Politiker-Coverage:** breiter, nicht nur Top-Köpfe
- **Filters auf /medien:** Sendung, Partei, Zeitraum (sobald >30 Auftritte)
- **Tilo-Jung-Outreach:** Goodwill / Methodik-Validierung

---

## 12. Block W — Wartung & Hygiene

### W.1 — Sonstiges-Cleanup-Cascade ⭐ 3-Stufen-Pattern

**Skript:** `scripts/cleanup-sonstiges.ts`
**Modell:** `claude-haiku-4-5` (3-Stufen-Cascade: HTML-Strip → Whitelist-Filter → Haiku-Klassifikator)
**Modell-Slot:** **Hygiene-Klassifikator-Slot** — Upgrade-Pfad: Haiku → Sonnet
**Logik:**
- Stage 1: HTML-Decode + Whitelist-Heuristik (KEEP_AUTO bei "e.V.", "Mitglied", "Vorsitz",
  "Stiftung", "Kuratorium", "Ausschuss" etc.)
- Stage 2: deterministischer Strukturplausibilitäts-Check
- Stage 3: Haiku 4.5 entscheidet Grenzfälle (Cookie-Banner-Text? Werbeblock? echte Bio-Aussage?)
**Voraussetzung:** `cv_homepage_json.sonstiges` mit Items
**Output:** angepasstes `cv_homepage_json` + `cv_repair_log` mit
`repair_version='homepage-sonstiges-cleanup-v1'`
**Cost:** $0.94 für 1.421 Items (Lauf vom 5. Mai 2026: 300 Drops + 7 HTML-Fixes auf 108 MdBs)
**Idempotenz:** sicher wiederholbar; Snapshot vor Lauf
**Run:** `npx tsx scripts/cleanup-sonstiges.ts`

### W.2 — Refetch CV-Homepage-Text (für Bestand vor 28.04.)

**Skript:** `scripts/refetch-cv-homepage-text.ts`
**Modell:** kein
**Zweck:** holt `cv_homepage_text` für MdBs nach, die `cv_homepage_json` + `cv_homepage_url`
haben, aber keinen Roh-Text gespeichert haben
**Run:** `npx tsx scripts/refetch-cv-homepage-text.ts [--limit N]`

### W.3 — Refetch kaputter Homepage-Texte

**Skript:** `scripts/refetch-broken-homepage-text.ts`
**Modell:** kein
**Voraussetzung:** Liste aus `check-rohtext-quality.ts` (`rohtext-quality-report.md`);
nutzt verbesserten Cleaner aus `scripts/_lib/html-clean.ts`
**Run:** `npx tsx scripts/refetch-broken-homepage-text.ts`

### W.4 — Rohtext-Qualitäts-Check

**Skript:** `scripts/check-rohtext-quality.ts`
**Modell:** kein (Heuristik)
**Output:** `rohtext-quality-report.md` (flagt verdächtige Texte als kaputt/falsch gescraped)
**Run:** `npx tsx scripts/check-rohtext-quality.ts`

### W.5 — Refetch fehlende Mandate-Daten

**Skript:** `scripts/refetch-missing-mandate-data.ts`
**Modell:** kein (abgeordnetenwatch v2)
**Voraussetzung:** Mandate, deren Votes/Sidejobs/Committees im `seed-abgeordnetenwatch.ts`-Lauf
leer geblieben sind
**Strategie:** sequentielle Calls (kein Promise.all), längerer Delay
**Run:** `npx tsx scripts/refetch-missing-mandate-data.ts`

### W.6 — Refresh Wikidata-Daten für seeded missing politicians

**Skript:** `scripts/refresh-missing-politician-data.ts`
**Modell:** kein
**Voraussetzung:** Politiker mit id ≥ 900000 (aus S.5)
**Output:** Wohnort, Beruf, Bildung, Geburtsort + Partei-Label-Normalisierung
("Christlich Demokratische Union" → "CDU")
**Run:** `npx tsx scripts/refresh-missing-politician-data.ts`

### W.7 — Health-Check

**Skript:** `scripts/health-check.ts`
**Modell:** kein
**Output:** Bestand-Übersicht (Zeilen pro Tabelle), Coverage pro MdB, Daten-Probleme
(defekte JSONs, doppelte Parteien, NULL-Werte)
**Run:** `npx tsx scripts/health-check.ts`

---

## 13. Block T — Tests & Smoketests

Alle nicht produktiv, aber wichtig für Modell-Wechsel + Regression-Checks.

### T.1 — CV-Reality-Check Sample

**Skript:** `scripts/cv-reality-check-sample.ts`
**Modell:** kein
**Zweck:** zieht 10 deterministisch-zufällige Bundestag-MdBs für manuelle Review
(`cv_json` + `bio_full_text` als JSON-Output)
**Run:** `npx tsx scripts/cv-reality-check-sample.ts > cv-reality-check-sample.json`

### T.2 — CV-Date-Precision-Test

**Skript:** `scripts/test-cv-date-precision.ts`
**Modell:** kein (deterministisch + Vergleich)
**Zweck:** Test auf bekannten problematischen MdBs (Mihalic 79129, Korell 175003, Fehre 183487)

### T.3 — CV-Test mit Haiku

**Skript:** `scripts/test-cv-haiku.ts`
**Modell:** `claude-haiku-4-5`
**Zweck:** Test Stage-1-Generator mit Haiku statt Llama; v4-Date-Precision-Regeln auf
problematischen MdBs (Mihalic, Korell, Hoffmann)

### T.4 — Haiku-Kalibrierung

**Skript:** `scripts/test-haiku-calibration.ts`
**Modell:** `claude-haiku-4-5`
**Zweck:** Mini-Kalibrierung: Haiku generiert Reden-Zusammenfassungen für 10 sorgfältig
gewählte Reality-Check-Fälle; Output Markdown zum direkten Vergleich Llama-70B-alt vs. Haiku-4.5-neu
**Output:** `haiku-calibration-report.md`

### T.5 — Smart-Haiku-Cascade Smoke-Test

**Skript:** `scripts/smoketest-smart-haiku.ts`
**Modell:** `claude-haiku-4-5`
**Zweck:** lädt `docs/summarization-methodology.md` als gecachten System-Prompt; lässt
Haiku 20 stratifizierte Reden zusammenfassen (9 Reality-Check-IDs + 11 stratifiziert über
Parteien); validiert post-hoc per Substring-Check, dass jedes wörtliche_zitate-Element
tatsächlich im `original_text` vorkommt

### T.6 — Source-Coherence-Verdicts-Vergleich

**Skript:** `scripts/compare-source-coherence-verdicts.ts`
**Modell:** kein
**Zweck:** Phase-7-Empirie-Tool — vergleicht Llama / Haiku / Opus / Final-Verdicts
**Run:** `npx tsx scripts/compare-source-coherence-verdicts.ts`

---

## 14. Phase 0-6 — historische Validierungs-Pipeline

📚 **Status: archiviert.** Letzter Lauf 29.-30. April. Daten leben als Validierungs-Empirie
auf der Methodik-Seite (Phase-7-Block). Skripte bleiben im Repo, weil sie das empirische
Fundament der heutigen Specialist-Cascade-Architektur dokumentieren.

### Phase 0-2: Initial-Generator + Cross-Check
- **Initial-Generator:** Llama 3.1 8B (jetzt durch Haiku 4.5 in `seed-cv.ts` ersetzt)
- `scripts/cross-check-mistral.ts` (Mistral Small) — paralleler Zweit-CV aus derselben Quelle

### Phase 3: Tiebreaker v1 (Inter-LLM-Konflikt)
- `scripts/tiebreak-conflicts.ts` — Tiebreaker zwischen Llama und Mistral
- Modell-Historie: GitHub Models GPT-4o-mini (Header-Doc), später Nemotron-Nano-12b (NVIDIA NIM)
- Output: `tiebreak.partial.jsonl` (459 Tiebreak-Entscheidungen)

### Phase 4: Tiebreaker v2 (4 Quellen)
- `scripts/tiebreak-v2-uncertain.ts` (Haiku 4.5)
- nimmt unscharfe v1-Fälle ("keiner" oder "unklar") und prüft mit allen 4 Roh-Quelltexten
- Output: `tiebreak-v2.partial.jsonl`

### Phase 5: Source-Coherence-Detection
- `scripts/source-coherence-check.ts` (gpt-oss-120b) — **wandert in Block B als ⑤** (heute Live-Stage)

### Phase 5.5: Inter-Source-Tiebreaker (alt, Llama 70B)
- `scripts/verify-source-conflicts.ts` (Llama 70B) — alte Stage-5.5-Implementation
- Output: `verify-source-conflicts.partial.jsonl`

### Phase 6: Halluzinations-Reparatur
- `scripts/fix-hallucinated-cv-entries.ts` (Llama 70B) — **wandert in Block B als B.4** (heute Live-Stage)

### Tiebreak-Patches anwenden (historisch)
- `scripts/apply-tiebreak-patches.ts` — manuell, einmalig
- `scripts/apply-tiebreak-patches-auto.ts` — auto-apply für "mistral"-Verdicts aus v1+v2

### Phase 7: Verifier-Cascade-Auswahl (5. Mai 2026)
- **Empirie:** Llama 70B 37 % ECHT-Recall vs. Haiku 4.5 69 % ECHT-Recall auf 39 Stage-5-Konflikten
- **Skripte:**
  - `scripts/verify-source-coherence.ts` (Llama 70B) — Vergleichs-Lauf
  - `scripts/verify-source-coherence-haiku.ts` (Haiku) — Live-Implementation (heute Block B als ⑥)
- **Methodische Lehre:** semantisches Reasoning mit Welt-Wissens-Anteil ≠ Schema-Match-Tasks;
  Haiku 4.5 ist für Reasoning-Layer angemessen, Llama 70B reicht für Schema-Match
- **Outputs:** `llama-verdicts-source-coherence.jsonl`, `haiku-verdicts-source-coherence.jsonl`,
  `final-verdicts-source-coherence.jsonl`, `opus-verdicts-source-coherence.jsonl`

---

## 15. Operations-Modi

### 14.1 Vollauf von Null

Wenn `politik.db` neu aufgebaut werden muss (oder DB nach Migration neu seeded werden soll).

**Reihenfolge:**

```bash
# === Phase 1: Stammdaten ===
npx tsx scripts/seed.ts                          # S.1: alle Politiker aus abgeordnetenwatch
npx tsx scripts/seed-politicians-bt.ts           # S.2: BT-MdB mit offizieller XML
npx tsx scripts/seed-bundeskabinett.ts           # S.3: Kabinett-Update
npx tsx scripts/seed-abgeordnetenwatch.ts --all  # S.11: Votes/Sidejobs/Committees
npx tsx scripts/seed-bios.ts --all               # S.6: Wikipedia-Bios
npx tsx scripts/fetch-wikipedia-fulltext.ts      # S.7: Wikipedia-Volltexte
npx tsx scripts/seed-homepages.ts --all          # S.8: Wikidata-Homepages
npx tsx scripts/find-missing-homepages.ts        # S.9: Homepage-Suche-Fallback
npx tsx scripts/seed-photos-wikidata.ts          # S.10: Fotos
npx tsx scripts/seed-activities.ts               # S.12: DIP-Aktivitäten
npx tsx scripts/fetch-bundestag-bios.ts          # S.13: BT-Bios
npx tsx scripts/patch-missing-bundestag-bios.ts  # S.14: BT-Bios-Patches
npx tsx scripts/fetch-bundesregierung-bios.ts    # S.15: Bundesregierung-Bios

# === Phase 2: Reden-XMLs (parallel zu CV möglich) ===
npx tsx scripts/fetch-plenar-xmls.ts             # R.1: XMLs holen
npx tsx scripts/ingest-plenarprotokoll-xmls.ts   # R.2: XMLs in DB
npx tsx scripts/extract-all-speeches.ts          # R.3: Reden extrahieren
npx tsx scripts/seed-non-mdb-speakers.ts         # S.4: 999...-Speaker
npx tsx scripts/backfill-speaker-politician-links.ts  # R.4: Speaker-Mapping
npx tsx scripts/seed-missing-politicians.ts      # S.5: nur-in-Reden-Politiker
npx tsx scripts/refresh-missing-politician-data.ts  # W.6

# === Phase 3: CV-Block A ===
npx tsx scripts/seed-cv.ts                       # A.1: Wikipedia-Generator (Haiku)
npx tsx scripts/seed-cv-homepage.ts --all        # A.2: Homepage-Generator (Llama 8B → Migration)
npx tsx scripts/check-cv-consistency.ts          # A.5: Stammdaten-Konsistenz-Check
npx tsx scripts/apply-consistency-fixes.ts       # A.6: Konsistenz-Fixes
npx tsx scripts/inspect-dates.ts                 # A.7: Datums-Inspektor (Mistral)
npx tsx scripts/verify-mistral-verdicts.ts       # A.8: Cascade-Verifier
npx tsx scripts/aggregate-repair-queue.ts        # A.9: Queue
npx tsx scripts/repair-cv-entries.ts --apply     # A.10: Repair (deterministisch)
npx tsx scripts/detect-duplicates.ts             # A.11: Doubletten-Vorfilter
npx tsx scripts/verify-duplicates.ts             # A.12: Doubletten-Verifier (Llama 70B)
npx tsx scripts/cleanup-sonstiges.ts             # W.1: Sonstiges-Cleanup
npx tsx scripts/generate-cv-summary.ts           # A.13: CV-Summary (Llama 8B → Migration)

# === Phase 4: CV-Block B (Source-Coherence) ===
npx tsx scripts/source-coherence-check.ts        # B.1: Detection (gpt-oss-120b)
npx tsx scripts/verify-source-coherence-haiku.ts # B.2: Verifier (Haiku)
npx tsx scripts/persist-source-coherence-verdicts.ts  # B.3: persist
npx tsx scripts/fix-hallucinated-cv-entries.ts   # B.4: Repair (Llama 70B)
# B.5 — Mensch-Final-Check (manuell, dauert mehrere Stunden)
npx tsx scripts/apply-source-coherence-corrections.ts  # B.6
npx tsx scripts/apply-source-coherence-resolutions.ts  # B.7

# === Phase 5: Reden-Generator ===
mv .batch-state.json .batch-state.json.bak       # ggf. State sichern
npx tsx scripts/batch-submit-reden.ts            # R.5: Pre-Flight (gratis)
npx tsx scripts/batch-submit-reden.ts --confirm  # R.5: Submit (~$42 für 9.913 Reden)
# 1-24h warten
npx tsx scripts/batch-retrieve-reden.ts          # R.6: Status
npx tsx scripts/batch-retrieve-reden.ts --apply  # R.6: Resultate persistieren
npx tsx scripts/refresh-original-text.ts         # R.8: Volltext-Refresh
npx tsx scripts/fix-tonalitaet-drift.ts          # R.7: Tonalitäts-Drift-Fix

# === Phase 6: Voting + Topics ===
npx tsx scripts/backfill-vote-dates.ts           # V.1: Vote-Daten
npx tsx scripts/map-votes-to-topics.ts           # V.2: Topic-Mapping (Haiku)

# === Phase 7: Health-Check ===
npx tsx scripts/health-check.ts                  # W.7
```

**Cost-Schätzung Vollauf:** ~$50 (Reden-Batch dominant), CV-Pipeline ~$5 wenn Migration auf
Haiku gemacht (sonst Free Tier).

**Dauer:** 2-3 Tage netto (großteils Wartezeit auf Anthropic Batch-API für Reden-Generator).

### 14.2 Inkrementell — neue Sitzung

Wenn neue Plenarprotokoll-XML erschienen ist (alle 1-2 Wochen):

```bash
npx tsx scripts/fetch-plenar-xmls.ts             # nur neue
npx tsx scripts/ingest-plenarprotokoll-xmls.ts   # nur ingestiert noch nicht
npx tsx scripts/extract-all-speeches.ts          # idempotent
npx tsx scripts/seed-non-mdb-speakers.ts         # ggf. neue Bundesrats-Speaker
npx tsx scripts/backfill-speaker-politician-links.ts

# State sichern + neuen Reden-Batch
mv .batch-state.json .batch-state.json.alt-$(date +%Y%m%d)
npx tsx scripts/batch-submit-reden.ts            # Pre-Flight
npx tsx scripts/batch-submit-reden.ts --confirm  # ~$0.50 für ~150 neue Reden
# warten
npx tsx scripts/batch-retrieve-reden.ts --apply
```

**Wichtig:** `batch-submit-reden.ts` liest `docs/summarization-methodology.md` ein —
sicherstellen dass das die **v2.1**-Datei ist (mit H10 + `neutralitaets_self_check`).

### 14.3 Inkrementell — neue MdBs

Wenn ein MdB nachrückt (Mandatswechsel, etc.):

```bash
# 1. Stammdaten ergänzen
npx tsx scripts/seed.ts                          # idempotent — neue Mandate ergänzt
npx tsx scripts/seed-politicians-bt.ts           # ergänzt aus offizieller XML
npx tsx scripts/seed-abgeordnetenwatch.ts --all  # Sub-Daten
npx tsx scripts/seed-bios.ts                     # Wikipedia-Bios
npx tsx scripts/fetch-wikipedia-fulltext.ts      # Volltexte
npx tsx scripts/seed-homepages.ts                # Wikidata-Homepages
npx tsx scripts/seed-photos-wikidata.ts          # Fotos
npx tsx scripts/fetch-bundestag-bios.ts          # BT-Bios

# 2. CV-Block A für nur die neuen
npx tsx scripts/seed-cv.ts                       # default: nur leere Reihen
npx tsx scripts/seed-cv-homepage.ts              # default: nur leere Reihen
npx tsx scripts/inspect-dates.ts                 # idempotent
npx tsx scripts/aggregate-repair-queue.ts
npx tsx scripts/repair-cv-entries.ts --apply
npx tsx scripts/cleanup-sonstiges.ts             # idempotent
npx tsx scripts/generate-cv-summary.ts           # default: nur leere Reihen

# 3. Block B nur wenn beide Quellen vorhanden
npx tsx scripts/source-coherence-check.ts        # idempotent
npx tsx scripts/verify-source-coherence-haiku.ts
# Mensch-Final-Check für etwaige neue ECHT-Konflikte

npx tsx scripts/health-check.ts                  # final-check
```

### 14.4 Hygiene-Pässe (regelmäßig oder ad-hoc)

```bash
# Sonstiges-Cleanup (z.B. monatlich oder nach neuen Homepage-Refreshes)
npx tsx scripts/cleanup-sonstiges.ts

# Rohtext-Qualität prüfen + reparieren
npx tsx scripts/check-rohtext-quality.ts
npx tsx scripts/refetch-broken-homepage-text.ts

# Stammdaten-Konsistenz nochmal
npx tsx scripts/check-cv-consistency.ts

# Vollständigkeits-Check
npx tsx scripts/health-check.ts
```

---

## 16. Modell-Slots & Upgrade-Pfade

Die Pipeline definiert **Slots**, nicht hardcoded Modelle. Ein Upgrade ist Variable-Tausch
+ ggf. Re-Run der Stage. Reihenfolge der Slots nach Förder-Priorität (höchster Hebel zuerst):

| # | Slot | Heutiges Modell | Empfohlenes Upgrade | Begründung |
|---|---|---|---|---|
| 1 | **Generator-Slot Homepage** (A.2) | Llama 3.1 8B (Groq Free) | **Haiku 4.5** (Anthropic) | Llama 8B ist methodisch fehl am Platz für breite Multi-Feld-Extraktion. Cost: ~$3-5 für Re-Extract der 561 Homepage-CVs. **Höchste Priorität.** |
| 2 | **CV-Summary-Slot** (A.13) | Llama 3.1 8B | **Haiku 4.5** | Synthese-Aufgabe (breit), Llama 8B zu klein. Cost: ~$2-3 für 640 MdBs. |
| 3 | **Cross-Source-Verifier-Slot** (B.2) | Haiku 4.5 | **Sonnet 4.6** oder **Opus 4.7** | Phase-7-Empirie zeigte: Reasoning-Stärke wirkt direkt auf ECHT-Recall (37 % vs. 69 %). Sonnet/Opus könnte 80-90 % erreichen — würde False-Positive-Rate weiter senken. |
| 4 | **Generator-Slot Wikipedia** (A.1) | Haiku 4.5 | **Sonnet 4.6** | Schon gut, aber Sonnet würde Schema-Strikt­heit + Date-Precision noch verbessern. |
| 5 | **Reden-Generator-Slot** (R.5) | Haiku 4.5 (Batch) | **Sonnet 4.6** (Batch) | Reden-Zusammenfassung mit Tool-Use ist breite Aufgabe, Sonnet würde "Bias-Drift" stärker selbst fangen. |
| 6 | **Halluzinations-Repair-Slot** (B.4) | Llama 3.3 70B | bleiben | Schema-Match-Aufgabe (fokussierte Re-Extraktion); Llama 70B reicht. Familien-Diversität zum Generator (Anthropic) wichtig. |
| 7 | **Cross-Source-Detection-Slot** (B.1) | gpt-oss-120b | bleiben oder Haiku | OSS-Modell für Massen-Pass; Cost und Familien-Diversität sprechen für Bleiben. |
| 8 | **Datums-Inspektor-Slot** (A.7) | Mistral Small | bleiben | Specialist-Pattern: kleines Modell auf eng-definierte Klasse. Familien-Diversität (Mistral ≠ Generator) wichtig. |
| 9 | **Doubletten-Verifier-Slot** (A.12) | Llama 3.3 70B | bleiben | Wie 6: Schema-Match, andere Familie zum Generator. |
| 10 | **Vote-Topic-Mapping-Slot** (V.2) | Haiku 4.5 | Sonnet bei Bedarf | Schema-Match, Haiku reicht. |
| 11 | **Sonstiges-Cleanup-Slot** (W.1) | Haiku 4.5 (3-Stufen-Cascade) | bleiben | Cascade-Pattern reduziert LLM-Calls auf Grenzfälle. |

**Wichtig — Familien-Diversität nicht zerstören:**
Wenn alle Slots auf Anthropic gehen, geht der Bias-Schutz verloren. Faustregel: Generator
und seine Inspectors sollen aus *verschiedenen* Modell-Familien kommen.

**Empfehlenswerte Familien-Verteilung nach Förder-Upgrades:**
- Generator (Wikipedia + Homepage + Reden): Anthropic (Sonnet/Opus)
- Inspectors: Mistral (Datum) + Meta/Llama (Doubletten + Repair) + OpenAI (Cross-Source-Detection)
- Cross-Source-Verifier: Anthropic (Reasoning-Layer)
- Mensch-Final: Opus 4.7 + Mensch-Recherche

---

## 17. Architektur-Changelog

### v1 — Multi-LLM-Konsens-Pipeline (April 2026)

Phase 0-6: Llama 8B als Initial-Generator → Mistral als Cross-Check (paralleler Zweit-CV) →
Tiebreaker zwischen den beiden Verdicts (Nemotron / GPT-4o-mini → Haiku als v2-Tiebreaker
mit 4 Quellen).

**Methodik-Pitch damals:** "5 unabhängige Modell-Familien im Konsens".
**Empirie:** Halluzinations-Rate von ~30 % (Single-Shot Llama 8B) auf 1.24 % (5-Stufen-Konsens).
**Anzahl geprüfter Aussagen:** 14.347.
**Kostentreiber:** parallele Doppel-Extraktion + viele Tiebreaker-Calls.

### v2 — Specialist-Cascade (Mai 2026, aktuell)

Aufbauend auf v1-Empirie umstrukturiert:
- Generator wechselt von Llama 8B auf **Haiku 4.5** (Wikipedia und Reden); Homepage-Generator
  bleibt vorerst Llama 8B (Migration ausstehend)
- Cross-Check-Pattern entfällt — kein paralleler Zweit-CV
- Stattdessen: spezialisierte Inspectors auf konkrete Fehler-Klassen (Datum, Doubletten,
  Stammdaten, Sonstiges)
- Source-Coherence (Wikipedia ↔ Homepage) als separate Pipeline-Schicht (Block B)

**Methodik-Pitch heute:** "Specialist-Cascade mit Modell-Familien-Diversität".

### Phase 7 — Verifier-Cascade-Auswahl (5. Mai 2026)

Empirisch validiert: Llama 70B 37 % ECHT-Recall vs. Haiku 4.5 69 % ECHT-Recall auf 39
Stage-5-Konflikten. **Live-Verifier ist seit 5. Mai Haiku 4.5** (vorher Llama 70B).
Phase-7-Daten sind dokumentiert in `final-/llama-/haiku-verdicts-source-coherence.jsonl`
und auf der Methodik-Seite.

### Phase 8 — Sonstiges-Cleanup-Cascade (5. Mai 2026)

Spot-Check bei Reem (175486) zeigte: `cv_homepage_json.sonstiges` enthielt News-Posts,
Lieblings-X-Items, HTML-Bugs. Gelöst durch 3-Stufen-Cascade in `cleanup-sonstiges.ts`.
Lauf-Statistik: 1.421 Items inspiziert, 189 Drops, 7 HTML-Fixes, 108 MdBs touched, $0.94.

### Phase 9 — UI-Render-Hygiene (5./6. Mai 2026)

Spot-Check bei Brandner (32337) zeigte 4 systematische Render-Bugs in `PoliticianCV.tsx`.
**Code-Änderung, keine Daten-Manipulation** — wirkt durch geänderte Render-Logik auf
bestehende Daten. Nicht Teil der Pipeline-Methodik (siehe Methodik-Seite-Diskussion).

### Mensch-Final-Check-Empirie (6. Mai 2026)

Manuelle Recherche bei den 14 ECHT-Verdicts ergab 9 False-Positives (~64% FP-Rate).
Stage-⑤-Zeitraum-Verschmelzung dominiert das Fehler-Muster. Korrigierte Verdicts:
**5 ECHT · 14 PRAEZ · 20 FALSE_POSITIVE = 39**.

---

## 18. Bekannte Schwächen & offene Migrations-Punkte

### Modell-Schwächen

1. **Generator-Slot Homepage = Llama 8B.** Methodisch falsch (siehe Slot-Tabelle 15.1).
   Migration auf Haiku 4.5 ist offen — Tasks #4/#5 (Code-Switch geplant, kein Re-Extract der
   563 bestehenden Daten — Block B fängt Halluzinationen).

2. **CV-Summary-Slot = Llama 8B.** Gleiche Begründung wie 1.

3. **Stage-⑤-Zeitraum-Verschmelzung.** gpt-oss-120b verschmilzt regelmäßig zwei separate
   Einträge mit überlappenden Schlüsselwörtern zu einem fiktiven Konflikt. Hauptursache der
   64%-FP-Rate. Fix-Optionen: schärferer Detection-Prompt, oder Verifier-Stufe um eine
   "ist-das-überhaupt-derselbe-Sachverhalt?"-Vorfrage erweitern.

### Methodik-Schwächen

4. **Stage-5-Recall unbekannt.** Wir wissen nicht, wie viele *echte* Konflikte Stage 5
   übersieht. Stichprobe von 10-30 Stage-5-non-flagged-MdBs nötig (Recall-Schätzung
   `True Positives / (TP + FN)`).

5. **Begriffs-Verwechslungen.** Beispiel Rabanus (Landesgeschäftsführer ↔ Schülersprecher).
   Verifier-Cascade fängt das nicht zuverlässig — braucht Welt-Wissen, das Haiku 4.5 noch
   nicht stark genug hat. Sonnet/Opus-Upgrade würde helfen.

### Daten-Schwächen

6. **Methodology v2.1 nur in Reden-Pipeline.** Tool-Schema bei `batch-submit-reden.ts`
   nutzt aktuell nicht `neutralitaets_self_check` als Pflichtfeld (das ist nur in
   `batch-resubmit-bias-corrections.ts` für die Bias-Korrektur enthalten). Bei nächstem
   Vollauf einbauen.

7. **Tonalitäts-Drift.** Tool-Use-Schema-Lock greift nicht 100 % — ~33/9913 Reden hatten
   "erfundene" Tonalitäten. Schema-Verschärfung im Generator-Prompt offen.

### Roadmap-Punkte

8. **Topic-Klassifikation für Reden** (Multi-Label, partei-neutral) — Voraussetzung für
   Synopse-Aussage-vs-Vote als Killer-Feature. Design-Phase, siehe
   `docs/topic-classification-design-questions.md`.

9. **Bundestag.de als 3. Quelle für Source-Coherence.** Aktuell nur Wikipedia ↔ Homepage.
   Bundestag.de-Bio als dritte unabhängige Quelle würde False-Positive-Rate weiter senken.

10. **PRAEZ-Konflikte als optionaler UI-Toggle.** Aktuell zeigt UI nur ECHT-Konflikte.
    14 PRAEZ-Konflikte sind unsichtbar (z.B. Nacke "Münster II vs Münster Süd"). Wertvoll
    für Pitch ("Wahlkreis-Reform 2022"), Risiko: Bürger-Verwirrung.

---

## 19. Audit-Trail-Übersicht

Pro Pipeline-Stage ist die Entscheidung dokumentiert. Übersicht aller Audit-Files:

### DB-Audit-Spalten (pro Politiker)

| Spalte | Quelle |
|---|---|
| `cv_model`, `cv_prompt_version`, `cv_raw_llm_response` | A.1 (Wikipedia-Generator) |
| `cv_homepage_model`, `cv_homepage_prompt_version`, `cv_homepage_raw_llm_response` | A.2 (Homepage-Generator) |
| `cv_summary_model`, `cv_summary_generated_at` | A.13 (CV-Summary) |
| `source_conflicts`, `source_coherence_checked_at` | B.1-B.7 |

### DB-Audit-Tabellen

| Tabelle | Was wird geloggt? |
|---|---|
| `cv_repair_log` | jeder angewendete Patch (Datum, Sonstiges-Cleanup, Source-Coherence-Resolutions) mit Originaltext, neuem Text, Modell-Audit, Anwendungs-Zeitstempel |
| `speech_analyses_v2` | model, prompt_version, batch_id pro Rede |
| `speech_analyses_v2_corrections` | Vorher/Nachher-Audit-Trail für Bias-Korrektur |

### JSONL-Files (Pipeline-Outputs, im Repo-Root)

**Block A:**
- `inspect-dates.partial.jsonl` (A.7 — Mistral-Verdicts, 13.510 Aussagen)
- `verify-mistral.partial.jsonl` (A.8 — Llama-Cascade-Verdicts)
- `cv-repair-queue.jsonl` (A.9 — deterministische Patches)
- `detect-duplicates.partial.jsonl` (A.11 — Verdachts-Pärchen)
- `confirm-duplicates.partial.jsonl` (A.12 — Llama-70B-Merge-Empfehlungen)

**Block B:**
- `source-coherence.partial.jsonl` (B.1 — Detection-Verdacht)
- `haiku-verdicts-source-coherence.jsonl` (B.2 — Haiku-Verifier-Verdicts)
- `final-verdicts-source-coherence.jsonl` (B.5 — Mensch-Final + Opus-Verdicts) — **Single Source of Truth**
- `llama-verdicts-source-coherence.jsonl` (Phase 7 — Vergleichs-Lauf)
- `opus-verdicts-source-coherence.jsonl` (Phase 7 — Opus-Ground-Truth)
- `verify-source-conflicts.partial.jsonl` (alt, Phase 5.5)

**Reden + Bias:**
- `bias-audit-tier-a-only.jsonl` (X.1)
- `bias-audit-broad-200.jsonl` (X.5)
- `bias-audit-all-222.jsonl` (X.6)
- `bias-class-ab.jsonl` (X.7)

**Phase 0-6 (historisch):**
- `tiebreak.partial.jsonl` (Phase 3)
- `tiebreak-v2.partial.jsonl` (Phase 4)

### Reports (Markdown)

- `cv-consistency-report.md` (A.5)
- `rohtext-quality-report.md` (W.4)
- `fix-hallucinated-cv-report.md` (B.4)
- `bias-audit-manual-sample-2026-05-05.md` (X.4)
- `cross-check-report.md` (Phase 0-2)
- `tiebreak-report.md` (Phase 3)
- `tiebreak-v2-report.md` (Phase 4)
- `tiebreak-effectiveness-stats.md` (Phase 0-6)
- `haiku-calibration-report.md` (T.4)
- `reden-reality-check-report.md` (T.x)

### Roh-Texte in der DB

`politicians.bio_full_text` (Wikipedia), `cv_homepage_text` (Homepage), `bundestag_bio_text`,
`bundesregierung_bio_text` — auch das Quellmaterial ist auditierbar, nicht nur die
extrahierten Outputs.

---

## 20. Skript-Inventar (alphabetisch)

77 aktive Skripte. Status: ✅ aktiv (Pipeline-Stage) · 📚 historisch (Phase 0-6) ·
🧪 einmalig (Audit-Lauf, Test, Migration).

| Skript | Status | Block | Modell | Kurz |
|---|---|---|---|---|
| `aggregate-repair-queue.ts` | ✅ | A.9 | — | Datums-Repair-Queue aus Inspector-Verdicts |
| `analyze-corrections.ts` | 🧪 | X.10 | — | Auswertung Bias-Korrektur-Re-Batch |
| `apply-bias-fixes.ts` | 🧪 | X.12 | — | Bias-Fixes anwenden (Wortliste-Filter) |
| `apply-consistency-fixes.ts` | ✅ | A.6 | — | Stammdaten-Fixes anwenden |
| `apply-final-fixes-to-db.ts` | 🧪 | X.13 | — | 51 finale Bias-Fixes in DB |
| `apply-source-coherence-corrections.ts` | ✅ | B.6 | — | Auto-Korrekturen aus JSONL anwenden |
| `apply-source-coherence-resolutions.ts` | ✅ | B.7 | — | Mensch-Final-Verdicts in DB |
| `apply-tiebreak-patches-auto.ts` | 📚 | Phase 3-4 | — | Tiebreak-Patches auto-apply |
| `apply-tiebreak-patches.ts` | 📚 | Phase 3-4 | — | Tiebreak-Patches manuell |
| `backfill-speaker-politician-links.ts` | ✅ | R.4 | — | Speaker → Politician Mapping |
| `backfill-vote-dates.ts` | ✅ | V.1 | — | Vote-Daten nachfüllen |
| `batch-resubmit-bias-corrections.ts` | 🧪 | X.8 | Haiku 4.5 | Bias-Korrektur-Batch (400 Reden) |
| `batch-retrieve-corrections.ts` | 🧪 | X.9 | — | Bias-Korrektur-Resultate |
| `batch-retrieve-reden.ts` | ✅ | R.6 | — | Reden-Batch-Resultate |
| `batch-submit-reden.ts` | ✅ | R.5 | Haiku 4.5 | Reden-Generator (Batch) |
| `bias-audit-broad-sample.ts` | 🧪 | X.5 | — | Broader Bias-Sample |
| `bias-audit-extract-all-222.ts` | 🧪 | X.6 | — | 222-Reden Extraktion |
| `bias-audit-layer1.ts` | 🧪 | X.3 | — | Layer-1-Audit |
| `bias-audit-manual-sample.ts` | 🧪 | X.4 | — | 15 stratifizierte Reden |
| `bias-audit-tier-a-only.ts` | 🧪 | X.1 | — | Tier-A-Wortliste-Filter |
| `bias-classify-llama.ts` | 🧪 | X.2 | Llama 8B | Bias-Klassifikation |
| `build-final-bias-fixes.ts` | 🧪 | X.11 | — | Finale Bias-Fixes bauen |
| `check-cv-consistency.ts` | ✅ | A.5 | — | Stammdaten-Konsistenz-Check |
| `check-rohtext-quality.ts` | ✅ | W.4 | — | Rohtext-Qualität |
| `cleanup-sonstiges.ts` | ✅ | W.1 | Haiku 4.5 | Sonstiges-Cleanup-Cascade |
| `compare-source-coherence-verdicts.ts` | ✅ | T.6 | — | Phase-7-Vergleichs-Tool |
| `cross-check-mistral.ts` | 📚 | Phase 0-2 | Mistral Small | Paralleler Zweit-CV |
| `cv-reality-check-sample.ts` | ✅ | T.1 | — | 10-MdB-Reality-Check |
| `detect-duplicates.ts` | ✅ | A.11 | — | Doubletten-Vorfilter |
| `export-class-ab-for-review.ts` | 🧪 | X.7 | — | Klasse-A+B Export |
| `extract-all-speeches.ts` | ✅ | R.3 | — | Reden-Extraktion aus XML |
| `fetch-bundesregierung-bios.ts` | ✅ | S.15 | — | bundesregierung.de Bios |
| `fetch-bundestag-bios.ts` | ✅ | S.13 | — | bundestag.de Bios |
| `fetch-plenar-xmls.ts` | ✅ | R.1 | — | Plenar-XMLs holen |
| `fetch-wikipedia-fulltext.ts` | ✅ | S.7 | — | Wikipedia-Volltexte |
| `find-missing-homepages.ts` | ✅ | S.9 | — | DuckDuckGo-Homepage-Suche |
| `fix-hallucinated-cv-entries.ts` | ✅ | B.4 | Llama 70B | Halluzinations-Repair |
| `fix-tonalitaet-drift.ts` | 🧪 | R.7 | — | ~33 Reden-Drift-Fix |
| `generate-cv-summary.ts` | ✅ ⚠️ | A.13 | Llama 8B → Haiku | CV-Summary (Migration ausstehend) |
| `health-check.ts` | ✅ | W.7 | — | DB-Health-Übersicht |
| `ingest-plenarprotokoll-xmls.ts` | ✅ | R.2 | — | XMLs in DB |
| `inspect-dates.ts` | ✅ | A.7 | Mistral Small | Datums-Inspektor |
| `map-votes-to-topics.ts` | ✅ | V.2 | Haiku 4.5 | Vote → Plenar-Topic |
| `patch-missing-bundestag-bios.ts` | ✅ | S.14 | — | BT-Bios-Patches |
| `persist-source-coherence-verdicts.ts` | ✅ | B.3 | — | Verdicts persistieren |
| `refetch-broken-homepage-text.ts` | ✅ | W.3 | — | Kaputte Homepage-Texts |
| `refetch-cv-homepage-text.ts` | ✅ | W.2 | — | Refetch Roh-Text vor 28.04. |
| `refetch-missing-mandate-data.ts` | ✅ | W.5 | — | Fehlende Mandate-Daten |
| `refresh-missing-politician-data.ts` | ✅ | W.6 | — | Wikidata-Daten für seeded missing |
| `refresh-original-text.ts` | ✅ | R.8 | — | XML-Volltext-Refresh |
| `repair-cv-entries.ts` | ✅ | A.10 | — | Datums-Repair (deterministisch) |
| `seed-abgeordnetenwatch.ts` | ✅ | S.11 | — | Votes/Sidejobs/Committees |
| `seed-activities.ts` | ✅ | S.12 | — | DIP-Aktivitäten |
| `seed-bios.ts` | ✅ | S.6 | — | Wikipedia-Bio-Extracts |
| `seed-bundeskabinett.ts` | ✅ | S.3 | — | Kabinett-Update |
| `seed-cv-from-paste.ts` | ✅ | A.3 | Llama 8B | CV aus Stdin (ad-hoc) |
| `seed-cv-homepage.ts` | ✅ ⚠️ | A.2 | Llama 8B → Haiku | Homepage-Generator (Migration ausstehend) |
| `seed-cv-manual.ts` | ✅ | A.4 | Llama 8B | Manuelle URL-Liste (ad-hoc) |
| `seed-cv.ts` | ✅ | A.1 | Haiku 4.5 | Wikipedia-Generator |
| `seed-homepages.ts` | ✅ | S.8 | — | Wikidata-Homepages |
| `seed-missing-politicians.ts` | ✅ | S.5 | — | Politiker nur in Reden |
| `seed-non-mdb-speakers.ts` | ✅ | S.4 | — | Nicht-MdB-Speaker (Bundesrat etc.) |
| `seed-photos-wikidata.ts` | ✅ | S.10 | — | Politiker-Fotos |
| `seed-politicians-bt.ts` | ✅ | S.2 | — | BT-MdB-Stammdaten (offizielle XML) |
| `seed.ts` | ✅ | S.1 | — | Politiker-Initial-Seed (abgeordnetenwatch) |
| `smoketest-smart-haiku.ts` | ✅ | T.5 | Haiku 4.5 | Smart-Cascade Smoke-Test |
| `source-coherence-check.ts` | ✅ | B.1 | gpt-oss-120b | Source-Coherence-Detection |
| `test-cv-date-precision.ts` | 🧪 | T.2 | — | Date-Precision-Test |
| `test-cv-haiku.ts` | 🧪 | T.3 | Haiku 4.5 | CV-Test mit Haiku |
| `test-haiku-calibration.ts` | 🧪 | T.4 | Haiku 4.5 | Haiku-Mini-Kalibrierung |
| `tiebreak-conflicts.ts` | 📚 | Phase 3 | (Nemotron / GPT-4o-mini) | Phase-3-Tiebreaker |
| `tiebreak-v2-uncertain.ts` | 📚 | Phase 4 | Haiku 4.5 | Phase-4-Tiebreaker |
| `verify-duplicates.ts` | ✅ | A.12 | Llama 70B | Doubletten-Verifier |
| `verify-mistral-verdicts.ts` | ✅ | A.8 | Llama 70B | Datums-Inspector-Cascade-Verifier |
| `verify-source-coherence-haiku.ts` | ✅ | B.2 | Haiku 4.5 | Source-Coherence-Verifier (live) |
| `verify-source-coherence.ts` | 📚 | Phase 7 | Llama 70B | Vergleichs-Lauf für Phase 7 |
| `verify-source-conflicts.ts` | 📚 | Phase 5.5 | Llama 70B | Alte Stage-5.5-Implementation |

---

## Pflege-Regel

**Bei jeder Pipeline-Architektur-Änderung MUSS dieses Dokument aktualisiert werden.**
Sonst entsteht der gleiche Drift wie zwischen Methodik-Seite und Code, den wir am
6. Mai 2026 gefunden und behoben haben.

Beim Ändern eines Modell-Slots (z.B. Llama 8B → Haiku in A.2/A.13):
1. Skript-Modell-Variable ändern
2. Dieses Dokument: Slot-Tabelle (Abschnitt 15) und Stage-Beschreibung (Abschnitt 6) updaten
3. Methodik-Seite (`src/app/design/linear/methodik/page.tsx`) prüfen, ob Modell-Pitch noch stimmt
4. Memory `project_specialist_cascade.md` updaten
5. CHANGELOG-Eintrag in Abschnitt 16 hinzufügen
