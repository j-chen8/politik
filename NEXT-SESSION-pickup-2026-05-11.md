# Pickup 2026-05-11 (Session-Snapshot 2026-05-09 / 2026-05-10)

> **Aktueller Modus:** Test-Seiten-Phase. Wir bauen potentielle Seiten als Spikes,
> keine produktiven Pipelines, keine Landing-Integration. Existierende Pages nicht überschreiben.

---

## ✅ Was diese Session gebaut wurde

### 1. Mission-Statement geschärft (in `TODO.md` + Memory)

User-O-Ton: **„Wenn du wissen willst, was in der Politik abgeht, gehst du auf unsere Seite.
DIE Seite für Politik. Maximale Transparenz."** — bewusst breiter als „MdB-Transparenz".

Dazu in `TODO.md` Vision-Sektion oben:
- 10-Posten-Lücken-Audit (Aktualität, Bundesregierung, Drucksachen, Bundesrat, Länder, EU,
  Wahlen, News-Kontext, Wahlkreis-Anker, Themen-Sicht)
- 3 strategische Wege A/B/C (Aktualitäts-Anker / Drucksachen-Browser / Topic-Klassifikation)
- Anti-Konvention-Prinzip dokumentiert (nicht wie Bundestag DIP / abgeordnetenwatch / NGO-Sites)

### 2. Spike A — Aktualitäts-Anker (`/design/linear/plenar-aktuell`)

**Live:** http://192.168.178.170:3000/design/linear/plenar-aktuell

Zeigt aktuellste Plenarsitzung (75. Sitzung, 24.04.2026):
- Header mit Sitzungs-Nr + Datum
- Daten-Summary („6 TOPs · 87 Reden · 4 Abstimmungen")
- TOP-Liste mit verkürzten Titeln + Anzahl Reden + Mini-Bar Fraktions-Anteile
- Block „Abstimmungen am selben Tag" mit verlinkten Polls

**Files:**
- `src/lib/plenar-aktuell.ts` (~110 Zeilen, separat von db.ts wegen Track-Isolation)
- `src/app/design/linear/plenar-aktuell/page.tsx` (~190 Zeilen)

**Was deferred wurde:** LLM-Sitzungs-Summary (inhaltliche „worum ging's politisch"-Zusammenfassung).
Daten-Summary jetzt OK; LLM-Variante in `TODO.md` mit 5 Design-Fragen festgehalten unter
„🤖 LLM-Sitzungs-Summary (deferred, Stand 2026-05-09)".

### 3. Spike B — Cmd+K Universal-Suche (`/design/linear/suche-spike`)

**Live:** http://192.168.178.170:3000/design/linear/suche-spike

Cmd+K (oder Ctrl+K) öffnet Modal-Palette. Cross-Entity-Suche über fünf Datenquellen:
- **Personen** — `searchPoliticiansDb` (existierend, mit Visibility)
- **Tagesordnungspunkte** — `plenar_topics.title`
- **Reden** — `speech_analyses_v2.zusammenfassung_2_saetze`
- **Abstimmungen** — `votes.poll_label`
- **Drucksachen** — `activities.titel`

Pro Typ max 6 Treffer, sortiert nach Datum. Tastatur-Navigation (↑↓ / ↵ / Esc), Hover-Selection,
Beispiel-Chips als Quick-Start.

**Files:**
- `src/lib/suche.ts` (~175 Zeilen)
- `src/app/api/suche/route.ts` (Route Handler GET, 8 Zeilen)
- `src/components/CommandPalette.tsx` (~360 Zeilen, selbst gebaut ohne `cmdk`-Dep)
- `src/app/design/linear/suche-spike/page.tsx` (~115 Zeilen)

**Limitation MVP, transparent:** Reines LIKE-Match. „Asyl" findet noch nicht „Migration"/
„Geflüchtete". Synonym-Lücke ist real, aber lebbar bis Phase 2.

**Test-Beispiele die funktionieren:**
- „Stromsteuer" → 9 Treffer (1 Topic + 6 Reden + 2 Votes)
- „Klima" → 20 Treffer über alle Typen
- „Merz" → 13 (1 Person + 6 Reden + 6 Drucksachen)
- „Asyl" → Speeches gefunden (z.B. Reichardt-Rede)
- „Bürgergeld" → 7 Treffer

---

## 🎯 Was als nächstes ansteht (für 2026-05-11)

User wollte „weiter dran arbeiten". Drei mögliche Pfade — aufsteigend nach Aufwand:

### A) Cmd+K iterieren (klein, ~1-2 h)

Was an `suche-spike` noch nicht stimmt oder fehlen könnte:
- **Tonalität-Badge** auf Reden-Treffern (haben wir in `speech_analyses_v2.tonalitaet`)
- **Foto** statt User-Icon bei Personen-Treffern (`politicians.photo_url` ist da)
- **Recent Searches** im Empty-State statt nur Beispiel-Chips
- **Mobile-UX** — auf Touch ist ⌘K nicht intuitiv, „Suchen"-Button-Position prüfen
- **Drucksachen-Detail-Page** existiert nicht → Treffer aktuell nur informativ ohne Link-Ziel

### B) Phase 2 der Such-Pipeline angehen (~1 Session, Cost ~$5-20)

LLM-Topic-Tagging mit Haiku 4.5 gegen eigenes Schema (~50-80 Topics, an Eurovoc angelehnt).
Macht Synonym-Suche möglich („Asyl" findet auch „Migration"). Ist die in der Mission-Recherche
identifizierte Phase 2 nach Volltextsuche.

**Pre-Pflicht:** Topic-Schema definieren — ist verwandt mit den 7 offenen Design-Fragen aus
`docs/topic-classification-design-questions.md`. Diese erst durchgehen.

### C) Nächster Spike aus Mission-Lücken-Liste

Aus den 10 Posten in `TODO.md` Vision-Sektion — naheliegend wären:

- **Drucksachen-Browser** (Lücke #3) — `/design/linear/drucksachen` als Test-Seite,
  filterbare Liste aus `activities`-Tabelle. ~3-5 h. Ergänzt MdB-Sicht um Vorgangs-Sicht.
- **Wahlkreis-Anker** (Lücke #9) — „Mein Wahlkreis"-Sicht. Liste oder Karte.
  Karte braucht Geo-Daten vom Bundeswahlleiter, ~1-2 Tage.
- **Themen-Sicht** (Lücke #10) — hängt mit (B) zusammen, weil Topic-Klassifikation Voraussetzung.

### Meine Empfehlung wenn du nicht entscheiden willst

**(A) Cmd+K iterieren mit Foto + Tonalität.** Niedrigste Komplexität, größter visueller Impact —
verstärkt das „nicht wie die anderen"-Statement der Spike-Phase. Danach (C) Drucksachen-Browser
oder direkt (B) Topic-Tagging je nach Energie.

---

## 🪟 Working-Tree-Stand & Koordination zweites Fenster

**Zweites Fenster** hat parallel großen Visibility-/CV-Refactor in `db.ts` + diversen Linear-Pages
laufen (siehe `NEXT-SESSION-pickup-2026-05-10.md`). Davon ist seit gestern committed:
- `f8429af CV-Dedup-Pipeline live` (412 MdBs dedup'd)

**Was im Working Tree steht (uncommitted, vom anderen Fenster):**
- Großer Visibility-Refactor in `src/lib/db.ts` (`IS_POLITICIAN_ACTIVE_SQL` etc.)
- Methodik-Page-Update, Protokolle-Pages, Stats-Output-Refactor
- ~100 ausschuss_protokolle JSON-Modifikationen aus `parse-ausschuss.ts`-Re-Run
- Default-Design-Pages (werden eh bald gelöscht, siehe Memory `feedback_linear_only`)

**Strategie für die nächste Session:** vor jedem db.ts-Edit `git status` prüfen ob das andere
Fenster zwischenzeitlich committed hat. Unsere Spikes sind track-isoliert (separate Helper-Files,
neue Pages) — keine Konflikt-Gefahr solange wir nichts in db.ts oder linear/page.tsx ändern.

---

## 📁 Wichtige Files für die nächste Session

| Datei | Zweck |
|---|---|
| `TODO.md` | Vision-Sektion oben (Mission + 10 Lücken + 3 strategische Wege + LLM-Summary deferred) |
| `src/lib/plenar-aktuell.ts` | Aktualitäts-Anker DB-Helper |
| `src/app/design/linear/plenar-aktuell/page.tsx` | Test-Seite Plenar-Aktuell |
| `src/lib/suche.ts` | Cross-Entity-Suche-Helper |
| `src/app/api/suche/route.ts` | Such-API (Route Handler) |
| `src/components/CommandPalette.tsx` | Cmd+K Modal-Component |
| `src/app/design/linear/suche-spike/page.tsx` | Test-Seite Cmd+K-Spike |
| `docs/topic-classification-design-questions.md` | Voraussetzung für Phase-2-Suche |

---

## 🧠 Memory-Pointer (für nächste Session relevant)

- `project_overview.md` — UPDATED mit Mission „DIE Seite für Politik"
- `project_test_seiten_phase_2026-05-10.md` — NEU, Spike-Phase + heutiger Track
- `feedback_track_isolation_commits.md` — wichtig wegen anderem Fenster
- `feedback_linear_only.md` — UI nur in `src/app/design/linear/...`
- `feedback_no_gotcha_framing.md` — Anti-Boulevard-Anker für UX-Entscheidungen
- `feedback_neutralitaet.md` — bei LLM-Summary-Diskussionen relevant
- `project_topic_classification.md` — wenn Phase 2 angegangen wird

---

## ⚡ Quick-Commands für morgens

```bash
# Stand prüfen
git log --oneline -10
git status --short | head -10

# Spikes testen
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/design/linear/plenar-aktuell
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/design/linear/suche-spike
curl -s "http://localhost:3000/api/suche?q=Klima" | jq '{total, politicians, topics: (.topics | length), speeches: (.speeches | length)}'

# Vision/Roadmap re-lesen
head -100 TODO.md
```

---

**Schlaf gut. 💤**
