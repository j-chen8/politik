# Next Session — Pickup-Kontext (Stand: 2026-04-30, ~03:50 nachts)

> User geht schlafen. Morgen direkt mit dem Plan unten loslegen.

## 🔥 WICHTIGER REALITY-CHECK (vor Schlafengehen, gegen Wikipedia getestet)

**10 zufällige MdBs gegen Wikipedia geprüft — Halluzinations-Rate ist real und höher als gedacht:**

```
Score: 6/9 prüfbar sauber  |  3/9 prüfbar mit Fehlern  |  1/10 nicht prüfbar (kein Wikipedia)
```

### Die 3 gefundenen Fehler-Cases:

**1. Micha Fehre (AfD, ID 183487) — Halluzination from scratch**
- cv_json sagt: *„vor 2021: beruflich tätig im niedersächsischen Landtag"*
- Wikipedia sagt: kein Berufs-/Studienabschluss, Selbstauskunft Unternehmer
- **Llama hat „Beisitzer im Landesvorstand" → „im Landtag tätig" verwechselt**

**2. Thomas Korell (AfD, ID 175003) — Date-Conflation**
- cv_json sagt: *„2016: Fraktionsvorsitzender Stadtrat Klötze"*
- Wikipedia sagt: AfD-Beitritt 2016, Stadtrat Klötze SEIT 2019
- **Llama hat AfD-Beitrittsjahr mit Stadtrats-Wahljahr zusammengezogen**

**3. Irene Mihalic (Grüne, ID 79129) — DREIFACH-FEHLER**
- Grünen-Endjahr halluziniert: cv_json *„2006-2013"* statt *„seit 2006"*
- Bundestag-Mandat falsch strukturiert: suggeriert Pause 2017 wo keine war
- Polizei-Köln-Daten gespiegelt: cv_json *„1993-2007 Köln"* statt *„ab 2007 Köln"*

### Pattern-Analyse:
**Llama 3.1 8B versagt systematisch bei:**
- zeitlichen Übergängen („ab 2007" vs. „bis 2007")
- Mandats-Strukturierung über mehrere Wahlperioden
- Date-Conflation bei mehreren parallelen Ereignissen im selben Jahr

**Stage 5.5 fängt diese Klasse NICHT** — weil cv_homepage_json bei den betroffenen MdBs oft leer/dünn → kein Inter-Source-Konflikt → durchgerutscht.

### Methodik-Schwachstelle gefunden:

**Bastian Ernst** (CDU, ID 182825) hat **keinen Wikipedia-Artikel**, aber `cv_json` ist gut gefüllt. Heißt: die „Wikipedia-Extraktion" greift heimlich auf andere Quellen zurück (Bundestag-Bio / Wikidata). Das ist eine versteckte Inkonsistenz im Audit-Trail — die Methodik-Seite suggeriert *„cv_json = aus Wikipedia"*, das stimmt aber nicht für alle MdBs.

→ **TODO:** Prüfen wie viele MdBs einen Wikipedia-Artikel haben. Spalte `cv_source: "wikipedia"|"bundestag"|"wikidata"` einführen, um Audit-Trail ehrlich zu machen.

### Empfehlung — REVIDIERT nach Diskussion: Prompt-Engineering vor Modell-Upgrade

**Wichtige Erkenntnis aus Reality-Check:** 4 von 5 Fehlern sind **Datum-Probleme**, nicht Inhalts-Halluzinationen. Llama weiß WAS und WO, scheitert beim WANN. Das ist primär ein **Prompt-Engineering-Problem**, nicht (nur) ein Modell-Größen-Problem.

#### Hebel 1 — Prompt-Engineering für Date-Precision (MACHEN ZUERST)

**`scripts/seed-cv.ts` Prompt erweitern** mit explizitem Daten-Regelblock + Few-Shot-Examples:

```
WICHTIG — REGELN FÜR ZEITANGABEN:
- Steht "seit YYYY" → schreibe exakt "seit YYYY" (offenes Ende)
- Steht "ab YYYY" → schreibe "ab YYYY"
- Steht "von YYYY bis YYYY" → schreibe "YYYY-YYYY"
- Wird NUR ein Anfangsjahr genannt → "seit YYYY", NIEMALS "YYYY-YYYY"
- Erfinde NIEMALS ein Endjahr aus dem Kontext
- Bei mehreren Daten in einem Satz: ordne jedes Datum dem RICHTIGEN Ereignis zu

BEISPIELE:
Quelltext: "Sie ist seit 2013 Mitglied des Bundestages."
✓ {"jahr": "seit 2013", "text": "Mitglied des Bundestages"}
✗ {"jahr": "2013-2017", ...} ← KEIN Endjahr im Quelltext genannt!

Quelltext: "Ab 2007 war sie beim Polizeipräsidium Köln tätig."
✓ {"jahr": "ab 2007", "text": "Polizeipräsidium Köln"}
✗ {"jahr": "1993-2007", ...} ← Reihenfolge umgekehrt!

Quelltext: "Sie trat 2016 der AfD bei. Seit 2019 ist sie Stadträtin."
✓ {"jahr": "2016", "text": "Eintritt in die AfD"}
  {"jahr": "seit 2019", "text": "Stadträtin"}
✗ {"jahr": "2016", "text": "Stadträtin"} ← Datum vom AfD-Eintritt fälschlich übertragen!
```

**Aufwand:** 30 Min Code-Edit + Re-Run. **Kosten:** $0. **Erwartung:** 50-70% der Date-Fehler weg.

#### Hebel 2 — Stage 2 als gezielter Daten-Verifier umbauen

Aktuell: Mistral macht Voll-Extraktion → Cross-Check via Konflikte. Problem: wenn beide LLMs dieselbe Date-Halluzination haben → kein Konflikt → durchgerutscht (bei Mihalic exakt das passiert).

**Besser:** Mistral als fokussierter Daten-Validator:

```
Pass 1 (Llama): Voll-Extraktion → cv_json
Pass 2 (Mistral): Für jeden Eintrag in cv_json:
   "Quelltext: [...]
    Eintrag: jahr=X, text=Y
    Frage: Steht jahr=X im Quelltext explizit für genau diese Aussage?
    Antworte: 'korrekt' / 'falsch (richtig wäre Z)' / 'unklar'"
```

→ Findet auch Fehler die Mistral selbst machen würde, weil es jetzt VERIFIKATION statt EXTRAKTION ist.

**Aufwand:** 1-2h (neues Skript). **Kosten:** $0 (Mistral Free Tier). **Erwartung:** weitere 20-30% Fehler gefangen.

#### Hebel 3 — Modell-Upgrade (nur wenn Hebel 1+2 nicht reichen)

- **Llama 4 Scout (Groq, $0):** schon im Stack als MODEL_LONG. MGSM 90.6% (multilingual, fast identisch zu 70B-91.1%). Halben MMLU-Sprung vom 8B.
- **Llama 3.3 70B via DeepInfra Turbo FP8 ($0.10/$0.32 = ~$9 pro Vollauf):** stärkstes Modell, aber paid.
- **NICHT Groq Paid für 70B** ($0.59/$0.79) — du zahlst für Speed (315 TPS) den du beim Bulk nicht brauchst.

#### Reihenfolge morgen:

1. **Prompt-Engineering Stage 1** (Daten-Regeln + Few-Shot) — 30 Min
2. **Test-Lauf nur für die 3 Problem-MdBs** (Mihalic 79129, Korell 175003, Fehre 183487) — sind die Fehler weg?
3. **Wenn ja:** voller Re-Run mit verbessertem Prompt. Stage 2-5.5 läuft normal drauf.
4. **Wenn nein:** Stage 2 zum Daten-Verifier umbauen ODER Modell hochziehen (Llama 4 Scout zuerst, dann ggf. 70B via DeepInfra).

**Wichtig:** Methodik-Seite kommunizieren wenn die Pipeline stark verändert wird — Audit-Trail bleibt sonst inkonsistent zwischen alter und neuer Version.

### Geschätzte Halluzinations-Rate aktuell:
- **Pro MdB:** ~30-35% haben mindestens einen falschen Eintrag
- **Pro Aussage:** ~5-15% (weil pro MdB mehrere Aussagen, nicht alle falsch)

Bei 14.347 Aussagen wären das **700-2000 falsche Fakten** unter Politiker-Namen veröffentlicht. Das ist nicht trivial.

---

## ⚡ ZUERST MORGEN: Stage 5 fertig laufen lassen

**Status:** 519/563 MdBs durch (92%). Verbleibend: **44 MdBs** (Task #14 sagt 62 — das war eine ältere Schätzung, der echte Wert ist 44).

**Warum es nicht heute fertig wurde:** `gpt-oss-120b` auf Groq hat ein **Tokens-per-Day-Limit von 200.000**, das erreicht haben. Reset ~12 Uhr Mittag.

```bash
# Nach dem TPD-Reset (etwa 12:00 Uhr):
npx tsx scripts/source-coherence-check.ts
```

Resume-fähig — macht die letzten 44 MdBs, sollte in ~10 Min durch sein.

**Danach:** wenn neue Diskrepanz-Kandidaten gefunden werden, Stage 5.5 nochmal:

```bash
npx tsx scripts/verify-source-conflicts.ts
```

Auch resume-fähig (Llama 3.3 70B hat eigenes Quota, freier).

**Falls Halluzinationen identifiziert:** Reparatur:

```bash
npx tsx scripts/fix-hallucinated-cv-entries.ts
```

Anschließend ggf. cv_summary für die neu reparierten regenerieren (siehe „cv_summary regenerieren" weiter unten).

## Was heute gelaufen ist

### Pipeline-Ausbau

- **Stage 4 Modell-Wechsel:** GPT-4o-mini (war rate-limited auf GitHub Models) → **Claude Haiku 4.5 via Anthropic SDK** mit JSON-Schema-Validation. Setup in `scripts/tiebreak-v2-uncertain.ts`. `ANTHROPIC_API_KEY` ist in `.env`. Restguthaben Anthropic ~$3.50.
- **V2-Lauf abgeschlossen:** 64/64 unscharfe Konflikte aufgelöst, 0 Fehler dank Schema-Validation. Kosten ~$0.50.
- **56 Patches angewendet** (`scripts/apply-tiebreak-patches-auto.ts --apply --include-shaky`) → 27 in cv_json + 29 in cv_homepage_json.
- **cv_summary regeneriert** für 98 betroffene MdBs (`generate-cv-summary.ts` nach NULL-set per SQL).

### Stage 5 + Stage 5.5 + Reparatur (NEU heute komplett gebaut)

- **Stage 5 Source-Coherence:** läuft mit `gpt-oss-120b` auf Groq, Pipeline `scripts/source-coherence-check.ts`. Status: **519 von 563 MdBs durch (92%)**, dann Groq-TPD-Limit erreicht. Reset ~12 Uhr Mittag.
- **Stage 5.5 NEU gebaut:** `scripts/verify-source-conflicts.ts` mit Llama 3.3 70B auf Groq. Klassifiziert Stage-5-Findings in echte Diskrepanz vs. Extraktions-Fehler.
- **Stage-5.5-Ergebnis:** 38 Konflikte verifiziert, **alle 38 = Llama-Halluzinationen** (0 echte Diskrepanzen). Methodisch wichtigstes Ergebnis des Tages — fängt Halluzinations-Klasse die Stage 2-4 systematisch verpasst.
- **Halluzinations-Reparatur NEU gebaut:** `scripts/fix-hallucinated-cv-entries.ts` mit Llama 3.3 70B → 33 Einträge ersetzt, 1 gelöscht (alle 34 fehlerhaften Einträge bereinigt). 7 waren schon nicht mehr im cv_json (vermutlich aus früheren Patches).

### Methodik-Seite komplett umgestaltet

- **Per-Datenart-Strukturierung:** Drei einklappbare Top-Level-Blöcke
  - 📋 *„Verfahren für Lebensläufe"* — abgeschlossen, default geöffnet, enthält Quick-Stats + alle 5+ Stufen + Detail-Statistiken + Audit-Trail
  - 🎤 *„Verfahren für Reden (Plenarprotokolle)"* — in Vorbereitung, mit Beschreibung was kommt
  - 📄 *„Verfahren für Drucksachen, Anfragen, Sidejobs"* — geplant, Platzhalter
- **Stage 5.5 in Pipeline-Übersicht** integriert mit Click-to-Scroll-Anchors
- **Beispiele pro Verdict-Klasse** (klick-und-aufklappbar) in allen Detail-Tabellen — 15+ Beispiele dynamisch aus Audit-Files geladen
- **Tiebreaker-Naming komplett konsistent:**
  - Stufe 3 = *„Tiebreaker — Inter-LLM-Konflikt"* (Llama vs. Mistral)
  - Stufe 4 = *„Tiebreaker v2 — Inter-LLM (4 Quellen)"* (Haiku 4.5 mit allen Quellen)
  - Stufe 5.5 = *„Tiebreaker — Inter-Source-Konflikt"* (Wikipedia vs. Homepage)
- **Audit-Trail jetzt pro Datenart** statt global

### UI Source-Conflicts in Profil

- **`PoliticianCV.tsx`** zeigt Quellen-Diskrepanzen mit Filter: nur `verification.classification === "echte_diskrepanz"` werden angezeigt, alles andere (Extraktions-Fehler) ausgeblendet. Aktuell: 0 echte Diskrepanzen → Banner erscheint nirgends.

### Cloudflare Tunnel

- **Aktive URL beim Schlafengehen:** https://giant-bali-ecological-dense.trycloudflare.com (instabil, neue URL bei jedem Tunnel-Restart)
- Tunnel-Prozess läuft im Hintergrund

## Zustand wichtiger Files

- `politik.db` — 94 MB, post-Reparatur, **NICHT zu R2 gesynct** (warten auf Stage-5-Restlauf morgen)
- `politik.db.snapshot-post-haiku-tiebreak-20260429-234443` — Backup vor Patches
- `tiebreak.partial.jsonl` — 676 v1-Verdikte
- `tiebreak-v2.partial.jsonl` — 64 v2-Verdikte (Haiku, schema-validiert)
- `source-coherence.partial.jsonl` — **519 MdBs durch** (44 fehlen)
- `verify-source-conflicts.partial.jsonl` — 38 Stage-5.5-Verifikationen
- `fix-hallucinated-cv-report.md` — alle 34 Reparatur-Schritte protokolliert

## Audit-Trail-Vollständigkeit

- DB-Spalten: `cv_model`, `cv_prompt_version`, `cv_raw_llm_response`, `source_conflicts`, `source_coherence_checked_at` — alle befüllt
- Skripte: alle in `scripts/`, alle reproduzierbar
- Methodik-Seite listet ALLE Audit-Files pro Datenart auf

## Nach dem Stage-5-Restlauf morgen

### R2-Sync (Production-Update)

```bash
# Dev-Server stoppen
pkill -f "next dev"
sleep 2

# DB pushen
./scripts/sync-db.sh push

# Dev-Server neu starten (im Hintergrund)
npm run dev &

# Tunnel URL prüfen — sollte gleich bleiben falls cloudflared lief
curl -sI https://giant-bali-ecological-dense.trycloudflare.com
```

### cv_summary für neu reparierte MdBs (falls Reparatur gelaufen ist)

```bash
# IDs aus tiebreak/v2 Partials extrahieren wo verdict = mistral
# Siehe Skript-Pattern aus heute (extract-patched-ids in /tmp)
# NULL die cv_summary für die betroffenen IDs
# Dann generate-cv-summary.ts laufen lassen
```

## Offene Tech-Schulden / Optionen

### Pipeline-Methodik
- **Llama-fixt-Llama** im Reparatur-Schritt ist methodisch suboptimal aber pragmatisch ok (Kostenargument). Eventuell für eine V2 mit Mistral oder Anthropic gegen-validieren.
- **Stage 5 könnte langfristig in 5.5 aufgehen** wenn 0/X-Pattern sich hält.

### Frontend / UX
- **Linear-Methodik-Seite** hat Stage 5.5 noch nicht (nur Stage 3-5). Aktuell nur klassische Methodik-Seite vollständig. Kann nachgezogen werden wenn Linear-Design weiterhin parallel gepflegt wird.
- **Beispiele in den Tabellen zeigen das chronologisch ERSTE Vorkommen** — nicht handgewählt. Für Förder-Demo wäre kuratiertes Vorzeige-Beispiel pro Klasse besser.
- **Bodo Ramelow als Vorzeige-Beispiel** für die Halluzinations-Detection: Wikipedia-Volltext sagt „PDS", Llama hat „Linken" extrahiert, Stage 5.5 hat's gefangen, Reparatur hat's gefixt. Perfektes Demo-Narrativ.

### Was Gemini noch vorgeschlagen hat (siehe heutige Diskussion)
- **Konfidenz-Levels pro Aussage** als UX-Element auf Profilseiten — wäre Phase-2-Ergänzung, nicht jetzt nötig

### Förderfähigkeit (aus heutigen Diskussionen)
- Solo-Dev bleibt strukturelle Schwäche
- DSGVO-Memo (2 Seiten) wäre prä-emptive Stärkung
- GitHub-Repo öffentlich machen + Lizenz wählen (MIT/AGPL)
- Akademischer Co-Autor (WZB / GESIS / Hertie School) würde 10× Glaubwürdigkeit bringen
- Erste journalistische Story (Correctiv / netzpolitik / Übermedien) wäre Game-Changer
- **Aber:** Förderung ist nicht Priorität jetzt — Bauen ist Priorität (eigener Workflow-Lernpfad)

## Längerfristige Roadmap

1. **Reden-Pipeline aufbauen** (das eigentliche Make-or-Break-Feature):
   - Reden-Summaries durchs Konsens-Verfahren validieren
   - Themen-Klassifikation
   - Tonalitäts-Analyse
   - „Synopse Aussage vs. Vote" als neutrale Cross-Check-Sicht
2. **Conflict-of-Interest-Matrix** (Sidejobs × Ausschuss-Memberships) als Killer-Feature
3. **Echte Faction Loyalty** (statt hardcoded 88%)
4. **Mini/Profi-Modus-Toggle** im CV (TODO.md hat detaillierte Implementierungs-Anleitung)

## Worauf der User gerade Wert legt (aus Diskussion heute)

- **Daten-Provider-Position** (nicht investigative Journalist) — neutrale Aggregation mit Quell-Verlinkung, kein Editorial. Sprache: *„Synopse"* statt *„Widerspruch"*, *„Kontext-Ansicht"* statt *„Interessenkonflikt"*.
- **Methodik-Seite ist für techies/Reviewer**, Profilseiten für Bürger — bewusste Audience-Trennung. „Inter-Source-Konflikt"-Jargon ist daher OK auf der Methodik-Seite.
- **Workflow-Lernen** ist gerade wichtiger als Production-Polish — Komplexität in Kauf nehmen
- **Reden-Pipeline ist Make-or-Break** — wenn die nicht klappt, klappt das ganze Projekt nicht (User-Aussage). Daher als nächste Priorität nach den Pipeline-Resten.

## Aktive Background-Prozesse beim Schlafengehen

- `cloudflared tunnel --url http://localhost:3000` — falls noch lebt, gleiche URL nutzbar
- `npm run dev` (next dev auf Port 3000)
- KEINE Pipeline-Skripte aktiv (Stage 5 wegen TPD-Limit gestoppt, Rest fertig)
