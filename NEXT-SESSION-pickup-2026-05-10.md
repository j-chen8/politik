# Pickup 2026-05-10 (Session-Snapshot 2026-05-08/09)

> **Hinweis:** Die Hauptarbeit dieser Session war am 2026-05-08; geendet ist sie am 2026-05-09 ~02:00 nachts.

## ✅ Was diese Session erreicht wurde

### 1. Stage-5-Recall-Studie (committed `1cd25af`)

**Geschlossen:** die methodische Recall-Lücke der Source-Coherence-Pipeline.

- **n=50 Stichprobe** unflagged MdBs, deterministisch via Knuth-Hash gesampelt
- **3 verifizierte ECHT-Konflikte:** Moll (Wiki-Fehler), Zorn (Homepage-Fehler), Bareiß (Homepage-Fehler auf Orphan-Seite)
- **Recall ≈ 13%**, 95%-CI [5%, 51%]
- **Population-Schätzung:** ~6% MdBs mit Quellen-Diskrepanzen
- **5 Pipeline-Pathologien identifiziert:**
  1. Naming-Change-Pattern (AfA, SMR/SMIL, FHöV/HSPV)
  2. cv_json-Halluzination (Stage 1 LLM)
  3. Empty-Homepage-Extraktion (12/50 Sample)
  4. Multi-Page-Biographies (Heiligenstadt 3-Seiten-Setup)
  5. Stale-Page-Scraping (Bareiß orphan URL)
- **Förder-Pitch-Logik:** drei gleichgewichtete Posten (LLM-Upgrade / Engineering / Skalierung) statt LLM-fokussiert
- **Final Report:** `docs/stage5-recall/recall-final-2026-05-08.md`

### 2. Pop-Hero MVP — Variant B (committed `a74a1e6`)

**Gebaut:** „Diese Woche knapp" Block auf Landing Page.

- 3-Card-Grid mit Top 3 knappsten Polls (Stromsteuer, Etat 2025, Etat 2026)
- Stacked-Bar visualisiert Ja/Nein-Verhältnis
- Klick → `/design/linear/abstimmungen/{poll_id}`
- Position: zwischen Hero und Stats Strip
- Anti-Boulevard-konform: Daten statt Wertung, Symmetrie inhärent, Tiefen-Pfad

**Live-Indicator entfernt** (User-Wunsch): „636 Politiker · live" Pill ist raus.

### 3. Memory-Updates

- `project_source_coherence.md` aktualisiert (Recall-Stand, 5 Pathologien)
- `project_stale_page_scraping_bug.md` (NEU)
- `project_multipage_biography_scraping.md` (NEU)
- MEMORY.md Index entsprechend updated

---

## ⚠️ Working-Tree-Stand (nicht committed!)

**Wichtig für nächste Session:** Pop-Hero-Integration ist im Working Tree, aber nicht committed weil zwei Files gemischte Änderungen vom anderen Fenster enthalten.

### Files mit mixed Changes (Working Tree):

#### `src/lib/db.ts`
- **Anderes Fenster:** `IS_POLITICIAN_VISIBLE_SQL` umgebaut + neuer `IS_POLITICIAN_ACTIVE_SQL` (Visibility-Logik-Refactor; Reiche/Prien/Stein etc.)
- **Unsere Pop-Hero-Änderung (am Ende der Datei):**
  ```typescript
  // ============================================================
  // Pop-Hero: knappste Polls für Landing-Page
  // ============================================================

  export interface ClosestPollRow {
    poll_id: number;
    poll_label: string;
    poll_date: string | null;
    yes: number;
    no: number;
    yes_ratio: number;
    distance_to_pari: number;
  }

  export function getClosestPolls(limit: number = 3): ClosestPollRow[] {
    // SQL-Query nach knappstem yes/no-Verhältnis
  }
  ```

#### `src/app/design/linear/page.tsx`
- **Anderes Fenster:** `getSourceCoherenceStats` import entfernt, `Vote` icon hinzugefügt, Quellen-Diskrepanzen-Section refactored
- **Unsere Pop-Hero-Änderungen:**
  - Import: `import { PopHeroPolls } from "@/components/PopHeroPolls";`
  - Live-Indicator-Block (mit „636 Politiker · live") **entfernt**
  - Neuer Section-Block:
    ```jsx
    {/* Pop-Hero: Knappste Abstimmungen */}
    <div className="fade-in-up fade-in-up-2">
      <PopHeroPolls />
    </div>
    ```
  - fade-in-up-Indizes verschoben (Stats: -2 → -3, Feature Cards: -3 → -4, KI-Block: -4 → -5)

### Lösung für nächste Session

**Wenn anderes Fenster seine Änderungen committed hat** → unsere Working-Tree-Änderungen einfach mit-committen (sind orthogonal additiv).

**Falls Konflikte:** unsere Pop-Hero-Codes sind in den committed Files:
- `src/components/PopHeroPolls.tsx` (das Component, vollständig)
- `public/pop-hero-mockups.html` (Mockup-Vergleich, kann als Referenz dienen)

→ Pop-Hero-Funktion in `getClosestPolls` ist neu im File, kann ans Ende der db.ts angehängt werden ohne Konflikte.

---

## 🎯 Nächste Schritte

### Priority 1: Kalender-Widget MVP (~1-2h, von dieser Session deferred)

**Ziel:** Komplement zum Pop-Hero — zeigt was kommt (Pop-Hero zeigt was war).

**Idee:** „Nächste politisch wichtige Termine" Block.

**Was anzeigen:**
- Nächste Plenarsitzung
- Nächste Wahl (Kommunal-/Landtags-/Bundestags-)
- Nächste wichtige Sitzungswoche
- Eventuell: Bundesversammlung, Tag der deutschen Einheit, etc.

**Datenquellen-Optionen:**
1. **Manuell gepflegte JSON-Datei** (~10 Termine) — schnellster MVP, ~30 Min
2. **bundestag.de Sitzungskalender ICS-Feed** — auto-aktualisierend, aber Parser nötig (~2-3h)
3. **Hybrid:** ICS-Feed automatisch + manuell ergänzte „besondere Termine"

**Empfehlung:** Mit Option 1 starten (manuelles JSON-File `data/calendar-events.json`) — wenn das Pattern sich bewährt, später auf ICS upgraden.

**UI-Vorschlag:** Schmales Strip-Layout (analog Variante D im Mockup) ODER eine 4. Card neben den 3 Pop-Hero-Cards. Final-Layout sollte nicht überladen wirken (User: „darf nicht überladen sein").

### Priority 2: Cold-Call-Outreach (User-Aufgabe, läuft)

User arbeitet bereits selber daran. 10-20 Journalist:innen + Politikwissenschaftler:innen, Targets in `docs/cold-email-targets.md`.

### Priority 3: Anderes Fenster-Track (cv_summary-Regeneration)

Per `NEXT-SESSION-pickup-2026-05-09.md` (vom anderen Fenster):
- cv_summary regenerieren auf Llama-3.3-70b
- 641 Einträge
- Audit-Sanity-Check für Merz/Poschmann/Strauss-Köster

→ Gehört dem anderen Fenster, nicht unsere Aufgabe.

### Priority 4 (später): Methodik-Doku-Integration

Recall-Studie-Findings in `docs/methodology-evolution.md` einbauen. Niedrige Priorität, kein Blocker.

---

## 📁 Wichtige Files für nächste Session

| Datei | Zweck |
|---|---|
| `docs/stage5-recall/recall-final-2026-05-08.md` | Förder-Pitch-tauglicher Recall-Final-Report |
| `docs/stage5-recall/findings*.jsonl` | Pro-MdB-Verdicts (50er Sample) |
| `src/components/PopHeroPolls.tsx` | Pop-Hero-Component (committed) |
| `public/pop-hero-mockups.html` | 4-Varianten-Vergleich (committed) |
| **`src/app/design/linear/page.tsx`** | **Working Tree mit Pop-Hero-Integration + anderes Fenster** |
| **`src/lib/db.ts`** | **Working Tree mit getClosestPolls + anderes Fenster** |

---

## 🧠 Memory-Pointer (für nächste Session relevant)

- `reference_pipeline_runbook.md` — erste Anlaufstelle
- `project_source_coherence.md` — UPDATED mit Recall-Studie
- `project_stale_page_scraping_bug.md` — NEU
- `project_multipage_biography_scraping.md` — NEU
- `feedback_track_isolation_commits.md` — wichtig für mixed-Working-Tree
- `feedback_session_workflow.md` — User-Workflow-Präferenzen
- `feedback_no_gotcha_framing.md` — Anti-Boulevard-Prinzip für Pop-Hero

---

## 🪟 Koordination zweites Fenster

Beide Fenster waren heute aktiv:
- **Unser Fenster:** Recall-Studie + Pop-Hero MVP
- **Anderes Fenster:** Stufe-A/B Datums-Inspector, Heiligenstadt+Moosdorf Legacy-Marking, Methodik-Seite-Update, Visibility-SQL-Refactor (page.tsx + db.ts)

Working Tree hat Drift in 2 Files. Nächste Session: erst `git status` + `git log` prüfen ob das andere Fenster committed hat. Dann ggf. eigene Working-Tree-Changes mit-committen.

---

## ⚡ Quick-Commands

```bash
# Stand prüfen
git log --oneline -10
git status --short | wc -l

# Pop-Hero testen
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/design/linear

# Recall-Studie aufrufen
cat docs/stage5-recall/recall-final-2026-05-08.md
```

## 🎁 Bonus für die nächste Session

**Förder-Pitch-Aussage** (final formuliert in `recall-final-2026-05-08.md`):

> „In einer 50er-Stichprobe haben wir 3 MdBs mit faktischen Diskrepanzen zwischen Wikipedia und ihrer eigenen Homepage gefunden — hochgerechnet ~50 Personen population-weit. Unsere aktuelle Pipeline (Anthropic Haiku 4.5, aus Eigenmitteln finanziert) detektiert davon etwa ein Achtel systematisch."

Das ist eine konkrete Story für den Förder-Antrag.

---

**Gute Nacht. 💤**
