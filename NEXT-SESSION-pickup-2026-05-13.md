# Pickup 2026-05-13 (Session-Snapshot 2026-05-12)

> **Modus weiter:** Test-Seiten-Phase. UI-Spikes unter `/design/linear/...`,
> keine produktiven Pipelines. Track-isolierte Commits (anderes Fenster
> arbeitet parallel an db.ts-Refactor + Methodik + ~100 Ausschuss-JSONs).

---

## ✅ Was diese Session gebaut wurde

### Hauptergebnis: Synonym-Cluster-Layer (Phase 1) live

**Commit:** `77c9d5f Cmd+K-Suche: Synonym-Cluster-Layer (Phase 1) + Umlaut-Bug-Fix`

44 Cluster · 451 Terms · live unter http://localhost:3000/design/linear/suche

Statt blind LIKE-Match macht die Suche jetzt Cluster-Expansion:
- User tippt „Asyl" → matched Migration-Cluster → expandiert auf
  `migration, geflüchtete, flüchtling, einwanderung, abschiebung, migrant, ausländer, asylbewerber, einwanderer, duldung, integration, …`
- Chip-Strip oben in der Palette zeigt die Expansion transparent
- Cluster-Label bleibt sachlich-neutral, auch wenn Cluster-Terms Alltagssprache enthalten

**Recall-Sprünge (DB-Total-Treffer in 11.052 Reden):**

| Query | Vorher | Nachher | Faktor |
|---|---|---|---|
| Asyl | 265 | 1.204 | 4.5× |
| Klima | 1.155 | 1.680 | 1.5× |
| Ausländer | (kein Match) | 1.302 | neu |
| Messerangriff | (kein Match) | 1.467 | neu |
| Heizungsgesetz | (kein Match) | 2.219 | neu |
| Corona | (kein Match) | 823 | neu |
| Jobcenter | (kein Match) | 541 | neu |
| Tempolimit | (kein Match) | 2.792 | Cross-Cluster Klima + Verkehr |

### Lexikon-Doktrin (in Code + Memory dokumentiert)

**JA — Alltagssprache:** `ausländer`, `messerangriff`, `vergewaltigung`,
`corona`, `heizungsgesetz`, `jobcenter`, `bauernproteste`, `tempolimit`,
`wärmepumpe`, `mieterhöhung`, `altersarmut`, …

**NEIN — Frame-Begriffe:** `asylant`, `klimakleber`, `ausländerkriminalität`,
`clankriminalität`, `sozialschmarotzer`, `wirtschaftsflüchtling`,
`lebensschutz`, `letzte generation`, `klimahysterie`

**Quellen für Sprach-Linie:** BPB (Bundeszentrale für politische Bildung),
Mediendienst-Integration, BMZ, Wikipedia („Messerangriff"-Artikel),
taz („Gewaltbegriff-Diffuse-Lage") — alle in der Konversation zitiert.

### Umlaut-Bug entdeckt + gefixt

**Befund:** SQLite's eingebautes `LOWER()` ist ASCII-only.
`LIKE '%öpnv%'` matched `'ÖPNV-Reform'` NICHT. ~28 unserer Cluster-Terms
hatten Umlaute, mehrere wurden als „tot" im Audit angezeigt (Österreich
fand 7 statt 51 Treffer).

**Fix:** `db.function("lower_de", ...)` in `src/lib/suche.ts:82-94`
registriert eine Unicode-aware Lowercase-Funktion via better-sqlite3.
SQL nutzt jetzt `lower_de(col) LIKE ?` mit lowercase-Patterns.

### Page-Ersatz: alte Namens-Suche raus

- `/design/linear/suche` zeigt jetzt den Cmd+K-Launcher-Content (vorher
  spike-only).
- `/design/linear/suche-spike` gelöscht.
- `SearchBox`-Submissions von der Linear-Landing (`?q=Name`) funktionieren
  weiter: neue Page liest `?q=` und öffnet Palette mit Prefill.
- `CommandPalette` bekam `initialQuery`-Prop.

### Audit-Tooling

- `scripts/audit-synonym-terms.ts` — COUNT(*) pro Term in 4 Datenquellen,
  findet tote+schwache Terms
- `scripts/audit-synonym-coverage.ts` — häufigste kapitalisierte Begriffe
  in Reden, die keinen Cluster matchen, mit Stopword-Filter

Beide für künftige Lexikon-Pflege wiederverwendbar.

---

## 🧭 Wie wir vorgegangen sind (Methodik / Entscheidungs-Logbuch)

### 1. Strategie-Klärung vor Coden

User: „Wir arbeiten an B" (Topic-Klassifikation). Statt blind loszubauen,
zuerst die 7 offenen Design-Fragen aus `docs/topic-classification-design-questions.md`
durchgegangen. Frage 1 war: **„Hast du schon Speech-zu-Drucksache-Mapping?"**

Per DB-Inspektion festgestellt: `plenar_speeches.topic_id` ist 100% gefüllt,
`vote_topic_links` ist gefüllt → **Speech-zu-TOP-Join existiert**. Damit:
Topic-Klassifikation für Aussage-vs-Vote ist überflüssig.

User-Pivot auf Search-Synonym-Use-Case („Asyl findet Migration"). Drei
Wege diskutiert: Topic-Tags (Pipeline-Aufwand) / Embeddings (Black-Box,
$0.20) / Synonym-Lexikon (handgepflegt, $0).

**Entscheidung:** Synonym-Lexikon. Begründung: Spike-Modus, Neutralitäts-
Anker (Audit-Trail-erklärbar), 80% der Lücke wird mit 30 Min Arbeit
gelöst. Embeddings als Phase 2 deferred, Topic-Tags als eigenes Filter-
UI-Feature deferred.

### 2. Audit-driven Lexikon-Pflege

Nach Phase-1-Build mit 40 Clustern + 253 Terms:
1. **Audit A** (Term-Frequency): COUNT(*) pro Cluster-Term in DB → 8 tote
   + 14 schwache Terms identifiziert
2. **Audit C** (Coverage-Gap): Top-100 häufigste kapitalisierte Substantive
   ohne Cluster-Match → 4 echte fehlende Themen-Cluster gefunden (Kommunen,
   Infrastruktur, Bürokratie, Inflation)
3. **Plural-/Flexions-Konsistenz (B)** alongside Audit-Pass
4. **Web-Research für Migration + Innere Sicherheit** wegen Frame-Sensitivität
5. Alltagssprache-Erweiterung über alle Cluster mit expliziter Frame-Filter-
   Begründung

### 3. Track-Isolation eingehalten

Anderes Fenster hat parallel Pagination + Photo-Avatar + Totals-Display in
`suche.ts` + `CommandPalette.tsx` reingeschoben. Beim Schreiben mehrfach
Read+Write-Konflikte: das andere Fenster hatte Files unterm Editor verändert.

Strategie: **Files committen, wo unsere Synonym-Arbeit der Hauptinhalt ist**
(suche.ts, CommandPalette.tsx mit ihren Adds), **route.ts NICHT mit-committen**
weil das ist purely deren Paginations-Track.

Working Tree für nächste Session: weiterhin riesiger uncommitted db.ts-
Refactor + Methodik + ~100 Ausschuss-JSONs vom anderen Fenster.

### 4. Honest-Recommend statt Yes-Saying

Mehrere Punkte wo ich dem User aktiv widersprochen / ausgebremst habe:
- Topic-Klassifikation NICHT für Search-Synonym-Layer (falsches Werkzeug)
- Compound-Word-Matching NICHT in Phase 1 (Klimaanlage-Trap)
- `prozess` (in Justiz) NICHT aufgenommen (zu generisch)
- Frame-Begriffe NICHT aufgenommen (Neutralitäts-Erosion)

---

## 🚧 Pending / Pause-Status

### Cloudflare-Tunnel-Deployment (offen)

User wollte vor dem Schlafengehen die Seite per Cloudflare freigeben,
„solange PC an ist". Plan war diskutiert aber nicht ausgeführt:

1. **Richtige Tool-Wahl:** Cloudflare **Tunnel** (cloudflared), nicht Pages.
   - Pages würde D1/Postgres-Migration der ganzen `politik.db` erfordern + Workers-Refactor → zu groß für „kurz teilen"
   - Tunnel = lokaler Server, gequielt über `*.trycloudflare.com`-URL
2. **Schritte (für später):**
   ```bash
   # Production-Build statt Dev (schnellere First-Loads für Empfänger)
   npm run build && npm start
   
   # cloudflared installieren (nicht vorhanden)
   curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i /tmp/cloudflared.deb
   
   # Quick-Tunnel (kein CF-Account nötig)
   cloudflared tunnel --url http://localhost:3000
   ```
3. **Vor dem Loslegen klären:**
   - Hat die App DB-schreibende Endpoints? (CV-Dedup-UI, Forms, Admin-Buttons?)
     → Wenn ja: vor Tunnel auf Read-Only stellen oder hinter Auth packen
   - Sonst kann der Empfänger versehentlich DB-State ändern
4. **Caveats:** URL ändert sich bei jedem Tunnel-Start, PC-Sleep killt
   den Tunnel, App ist dev-grade ohne Auth/Rate-Limiting

### Lexikon-Improvements deferred

- **Compound-Word-Matching** (Stamm + Whitelist): höherer Recall („klimakrise"
  matched Klima-Cluster) aber Wartungslast
- **Cross-Cluster-„Verwandte Themen"-Vorschläge** (Architektur-Erweiterung)
- **Multi-Word-Flexion** („innerer sicherheit" matched nicht „innere sicherheit")
- **Synonym-Logging** für Empirie: welche Queries triggern keinen Cluster?

### Such-Roadmap weiter

- **Phase 2: Embeddings** für tiefere semantische Suche (`text-embedding-3-small`,
  ~$0.20 für 9.913 Reden, `sqlite-vec` als Vector-Store)
- **Phase 3: Topic-Tags** als separates Filter-UI-Feature (NICHT als
  Synonym-Erweiterung — eigener Spike, eigene 7 Design-Fragen)

---

## 📁 Files in unserem Commit `77c9d5f`

| Datei | Status | Zweck |
|---|---|---|
| `src/lib/synonyms.ts` | NEW | 44 Cluster, 451 Terms, `expandQuery()` |
| `src/lib/suche.ts` | M | `lower_de()`-Helper, WHERE mit Cluster-Expansion (+ ihre Totals) |
| `src/components/CommandPalette.tsx` | M | Synonym-Chip-Strip + `initialQuery` (+ ihre Avatar+Totals) |
| `src/app/design/linear/suche/page.tsx` | M | Alte Namens-Suche raus, Cmd+K-Launcher rein |
| `src/app/design/linear/suche-spike/page.tsx` | D | gelöscht |
| `scripts/audit-synonym-terms.ts` | NEW | Term-Frequency-Audit |
| `scripts/audit-synonym-coverage.ts` | NEW | Coverage-Gap-Audit |

**Nicht committed (anderes Fenster):**
- `src/app/api/suche/route.ts` (deren Paginations-Endpoint)
- `src/lib/db.ts` (Visibility-Refactor)
- `src/app/design/linear/methodik/page.tsx`
- ~100 `data/ausschuss_protokolle/*.json`

---

## ⚡ Quick-Commands für morgens

```bash
# Stand prüfen
git log --oneline -5
git status --short | grep -E "^[AM ]" | head -10

# Suche testen
curl -s "http://localhost:3000/api/suche?q=Asyl" | python3 -c "import json,sys; d=json.load(sys.stdin); print('total:', d['total'], '| speeches:', d['totals']['speeches'])"
curl -s "http://localhost:3000/api/suche?q=Tempolimit" | python3 -c "import json,sys; d=json.load(sys.stdin); print('clusters:', d['matchedClusters'])"

# Audit re-runnen
npx tsx scripts/audit-synonym-terms.ts | tail -20
npx tsx scripts/audit-synonym-coverage.ts --top 50 | head -60

# Memory check
cat /home/jinsheng/.claude/projects/-home-jinsheng-politik/memory/project_search_synonym_layer.md
```

---

## 🧠 Memory-Pointer relevant für Pickup

- `project_search_synonym_layer.md` — **erste Anlaufstelle**, Cluster-Inventar + Doktrin
- `project_test_seiten_phase_2026-05-10.md` — Spike-Modus weiter aktiv
- `project_search_fts5.md` — anderes Fenster hat FTS5-Migration laufen (Reden+Drucksachen, 2.0s→0.12s)
- `feedback_track_isolation_commits.md` — Begründung für unsere Commit-Trennung
- `feedback_neutralitaet.md` — gilt für Sprach-Linie im Lexikon
- `feedback_linear_only.md` — UI nur in `src/app/design/linear/...`

---

## 🪟 Working-Tree-Stand & Koordination zweites Fenster

**Committed seit unserer Session:**
- `77c9d5f` (unser Synonym-Layer-Commit, 2026-05-12 abends)

**Uncommitted im Working Tree (anderes Fenster):**
- `src/lib/db.ts` Visibility-Refactor (`IS_POLITICIAN_ACTIVE_SQL` etc.)
- `src/app/api/suche/route.ts` — Paginations-Dispatch über Type
- `src/lib/suche.ts` HAT auch deren Adds drin (`searchByType`, `SearchType`,
  Totals-Counts) — wir haben das mit-committed in `77c9d5f`, aber Branch
  noch nicht durch
- `src/app/design/linear/methodik/page.tsx`
- ~100 `data/ausschuss_protokolle/*.json` (parse-ausschuss-Re-Run)
- Mehrere `src/app/design/linear/*/*.tsx` Pages
- Diverse untracked `scripts/` + `docs/` Files vom CV-Dedup-Track

**Strategie morgens:** Vor `db.ts`-Edits `git status` prüfen ob das andere
Fenster zwischenzeitlich gepusht/gecommittet hat. Unsere Suche-Files sind
clean drin, kein Konflikt mehr.

---

**Schlaf gut. 💤**

Stand der DB-Snapshot-Frage offen — wenn morgens Cloudflare-Tunnel starten
soll, vorher API-Routes auf POST/PUT/DELETE checken.
