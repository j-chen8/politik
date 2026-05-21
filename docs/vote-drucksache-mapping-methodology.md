# Vote-↔-Drucksache-Mapping — Methodik

**Stand:** 2026-05-13 (Block-Modell) — **abgelöst 2026-05-20 durch Filterlist-Apply, siehe Abschnitt unten**
**Status:** historisch — aktuelle SoT ist `docs/DATA-SOURCES.md` §2.13
**Aktive Skripte:** `scripts/map-vote-drucksache-bundestag.ts --apply`
**Tote Skripte:** ~~`audit-vote-drucksache-mapping.ts`~~ · ~~`auto-classify-vote-mapping.ts`~~ · ~~`apply-vote-bundestag-audit.ts`~~ (am 2026-05-20 gelöscht / nicht mehr nutzen)
**DB-Tabellen aktuell:** `drucksache_polls` (Filterlist-basiert, 51/51) · `drucksache_polls_pre_bt_filterlist` (Backup vor 2026-05-20-Apply) · *(historisch: `drucksache_polls_pre_bt_audit`, `audit_bundestag_polls`)*

---

## 2026-05-20: Filterlist-Apply löst manuelles POLL_TO_BT_ID + Block-Modell ab

**Trigger:** Block-Modell (`apply-vote-bundestag-audit.ts`) zog DS aus dem
Plenartags-Block pro Poll — 2026-04-24-Polls hatten dadurch je 15-17 identische
DS (alle 4 Polls vom Tag), 6511 hatte 8 DS. Über-aggregiert.

**Neue SoT:** bundestag.de Open-Data-Filterlist `484422-484422`. Pro Roll-Call
liefert sie die explizite Subjekt-Drucksachen-Liste (typisch 2 DS: Antrag +
Beschlussempfehlung).

**Matcher-Logik in `scripts/map-vote-drucksache-bundestag.ts`:**
1. Themengebiet-Prefix stripping (`"Finanzen Ablehnung…"` → `"Ablehnung…"`)
2. Umlaut-Normalisierung im Title-Token-Vergleich
3. **1:1-Optimal-Assignment per Permutation pro Tag** — verhindert
   kreuzweise Vertauschungen (6451↔6455, 6496↔6497)
4. Title-Score dominant (Faktor 1000), Tally + DS-Overlap nur als Tiebreaker
5. Multi-DS-Fallback (≥2 gemeinsame DS) rettet Edge-Cases wie 6511 (bt-Title
   sagt „MFR", aw-Label „LEADER", DS-Set identisch)

**Bilanz nach Apply (51 Polls):** 13 EXAKT · 38 DIFF · 0 UNMATCHED.
18 Stichproben quer geprüft: 16/18 sauber, 2 Grenzfälle:
- 6170 Corona-U-Ausschuss BE-thematisch verschoben
- 6451 Energiepreis Iran hat 2 DS — 21/4750 (AfD-Antrag, klar passend)
  + 21/4984 (Tankstellen-Gesetzentwurf, wirkt angeklebt). Bundestag.de-
  Filterlist hat das so geliefert; bleibt im aktuellen Apply unverändert.

**Backup:** `drucksache_polls_pre_bt_filterlist` (vor dem 2026-05-20-Apply).

**Offener Follow-up:** 38 Polls haben durch den Apply geänderte DS-Listen.
`vote_context.block_hinweis` für diese Polls ist teilweise outdated — neu
generieren via `generate-vote-context.ts --poll <id> --write` (paar € LLM-Cost).

---

## Historische Methodik (Block-Modell, 2026-05-13 — nicht mehr aktiv)

> Alles unten beschreibt die abgelöste Cross-Source-Audit-Pipeline. Bleibt
> als Audit-Trail erhalten. Für die aktuelle Methodik siehe oben + DATA-SOURCES §2.13.

## Zweck

Pro namentlicher Abstimmung im Bundestag die zugehörigen Drucksachen verlinken — den ursprünglichen Antrag, die Beschlussempfehlung des Ausschusses, ggf. Berichte, Änderungs- und Entschließungsanträge. Damit ist auf der Vote-Detail-Seite sichtbar: *Welcher Antrag wurde wie angenommen oder abgelehnt, und welche begleitenden Drucksachen gehören dazu?*

## Datenquellen

| Quelle | Rolle | Lizenz |
|---|---|---|
| abgeordnetenwatch.de API | Stamm-Quelle für Polls (poll_id, poll_label, poll_date) | CC0 |
| Bundestag.de Abstimmungs-Seiten (`/parlament/plenum/abstimmung/abstimmung?id=…`) | **Autoritative Quelle für Vote → Drucksachen-Mapping** | Open Data |

Bundestag.de listet auf jeder Abstimmungs-Seite die direkt zugehörigen Drucksachen vollständig — typisch 1–17 pro Page, je nach Komplexität der Beratung. Diese Information ist offiziell und vollständiger als jede heuristische Ableitung.

## Pipeline-Architektur

```
[abgeordnetenwatch-Polls] ──┐
                            ├─→ [drucksache_polls] (alt: Heuristik) ──┐
[bisherige Heuristiken    ──┘                                          │
 — Keyword-Overlap,                                                    ▼
   LLM-Match, manuell]                                          [Cross-Audit]
                                                                       │
[Bundestag.de Abstimmungs-Seiten] ──→ [audit_bundestag_polls] ─────────┤
                                                                       ▼
                                                       [drucksache_polls] (neu: autoritativ)
                                                              │
                                                              ▼
                                                       [UI: Vote-Detail-Seite]
```

### Phase 1 — Crawl

`scripts/audit-vote-drucksache-mapping.ts crawl --start=900 --end=1020`

- 121 Bundestag-Abstimmungs-Pages (Bundestag.de-Sequential-IDs) gescraped, ~3 Requests/Sekunde mit eigenem User-Agent.
- HTML-Parser extrahiert pro Page:
  - **Datum** aus `<span class="bt-date">…</span>` mit deutschem Monatsnamen-Parsing (z.B. „4. Dezember 2025" → `2025-12-04`).
  - **Topic** aus `<h1 class="bt-artikel__title">…</h1>`.
  - **Drucksachen** aus `<span class="a-link__label">21/XXXX</span>` — robust gegen URL-Pfad-Reste wie `21/030` (das sind Plenarprotokoll-Ordner-IDs, keine Drucksachen). Beide Quote-Stile (`"…"` und `'…'`) werden erfasst.
- Resume-fähig: bereits gecachte IDs werden übersprungen.
- Cache-Tabelle: `audit_bundestag_polls(bundestag_id, abstimmung_date, topic, drucksachen_json, http_status, fetched_at)`.

### Phase 2 — Auto-Klassifikation

`scripts/auto-classify-vote-mapping.ts`

Pro Poll werden alle Bundestag-Pages am gleichen Datum als Kandidaten betrachtet. Match-Score-Heuristik:

- **Topic-Score** via Longest-Common-Substring (LCS, ≥ 5 Zeichen) zwischen Poll-Label-Tokens und Bundestag-Topic-Tokens. LCS ist robust gegen deutsche Komposita (z.B. „Pendlerpauschale" ↔ „Pendler").
- Stop-Wörter (z.B. „Antrag", „Gesetz", „Ablehnung", „Beschlussempfehlung") aus der Score-Berechnung entfernt — sonst dominieren formale Worte über inhaltliche.
- Tokens unter 5 Zeichen oder mit Stop-Wörtern werden verworfen.

Klassifizierung in 4 Status-Klassen:

| Status | Bedeutung |
|---|---|
| `CONFIRMED` | Eindeutiger Topic-Match, wir hatten keine DS in unserer alten Tabelle. BT-DS übernehmen. |
| `EXTENDED` | Eindeutiger Topic-Match, unsere DS ist in BT-Liste enthalten. BT-DS ist Obermenge — übernehmen. |
| `DS_MISSING` | Eindeutiger Topic-Match, aber unsere DS ist *nicht* in BT-Liste. Manuelle Prüfung nötig. |
| `AMBIGUOUS` | Mehrere BT-Pages mit ähnlichem Topic, kein klarer Sieger. Manuelle Prüfung nötig. |

### Phase 3 — Manuelle Verifikation

Für die `DS_MISSING`- und `AMBIGUOUS`-Fälle wurde jeder Poll einzeln gegen die Bundestag.de-Page geprüft (Topic-Lesung + Plausibilitäts-Check). Die finale Poll → Bundestag-ID-Zuordnung wurde im Apply-Skript explizit kodiert (`scripts/apply-vote-bundestag-audit.ts`).

Die Bundestag.de-Topic-Beschreibungen sind eindeutig genug, dass selbst bei Bündel-Abstimmungen (mehrere Polls am gleichen Tag, gleiche Drucksachen-Liste auf jeder Page) der individuelle Vote-Kontext erkennbar ist. Beispiel 2026-04-24:

- id=999 = „Gesetzentwurf zur temporären Absenkung der Energiesteuer für Kraftstoffe"
- id=1000 = „Gesetzentwurf der Grünen zur Änderung der Stromsteuer"
- id=1001 = „Ablehnung eines Antrags zur Entlastung berufstätiger Pendler"
- id=1002 = „Ablehnung eines Antrags zur Übergewinnsteuer"

Trotz identischer Drucksachen-Listen über alle vier Pages ist die Zuordnung über den Topic-Titel trivial.

### Phase 4 — Apply

`scripts/apply-vote-bundestag-audit.ts`

- DB-Snapshot vorab (`politik.db.snapshot-pre-bt-audit-apply-*`).
- Alte 57 `drucksache_polls`-Einträge archiviert in `drucksache_polls_pre_bt_audit` mit Zeitstempel.
- `drucksache_polls` komplett geleert.
- Pro Poll: alle Drucksachen aus der bestätigten Bundestag-Page eingefügt mit `matched_via='bundestag_de_audit'`, `match_score=1.0`.
- Drucksachen ohne LLM-Analyse (`drucksache_analyses` leer) werden übersprungen — sie können später nachgezogen werden, der Eintrag würde sonst auf ein leeres Detail-Seiten-Render zeigen.

## Ergebnis

| Metrik | Vor Audit | Nach Audit |
|---|---:|---:|
| Polls mit Drucksachen-Link | 45 / 50 | **50 / 50 (100 %)** |
| Total Drucksachen-Links | 57 | **270** |
| `matched_via`-Typen | 6 verschiedene Heuristiken | **1 autoritative Quelle** |
| Drucksachen pro Vote (Ø) | 1,1 | 5,4 |

**Befund-Aufschlüsselung der 50 Polls:**

| Status | Anzahl | Bedeutung |
|---|---:|---|
| ✅ Confirmed | 33 | Unsere alte DS in BT-Liste enthalten |
| ⚠️ Partial | 1 | Eine DS in beiden, eine in BT korrigiert (Poll 6286 Verbrenner: `21/1593` → `21/225`) |
| ❌ Replace | 16 | Unsere alte DS *nicht* in BT-Liste — Heuristik hatte falsche DS gewählt |

## Pattern-Erkennung: Wann die alte Heuristik versagte

Die 16 REPLACE-Fälle teilen ein Muster:

- **Späteres-WP-Nummern-Picking:** Unsere Heuristik (Keyword-Overlap auf Drucksachen-Titel) tendiert dazu, höher-nummerierte Drucksachen (21/4xxx, 21/5xxx) zu wählen, weil diese eher mit aktuellen Voting-Kontexten korrelieren. Die *tatsächlich* zur Abstimmung stehende Drucksache ist oft eine ältere, niedriger-nummerierte (das ursprüngliche Antrags-Dokument).
- **Beschlussempfehlung-Verwirrung:** Bei Polls mit „(Beschlussempfehlung)" im Label finden Keyword-Overlap-Heuristiken oft die thematisch ähnlichste DS — die aber eine *andere* sein kann als die offizielle Beschlussempfehlung. Bundestag.de listet das Paar (Antrag + Beschlussempfehlung) korrekt.
- **Bündel-Abstimmungen:** Wenn 4 Polls am gleichen Tag stattfinden (z.B. Steuer-Bündel 2026-04-24), und alle 4 thematisch verwandt sind, kollidieren die Heuristiken — Bundestag.de macht die korrekte 1:1-Zuordnung über die TOP-Titel.

## Reproduzierbarkeit

Ein Komplett-Re-Run der Pipeline:

```bash
# Falls audit_bundestag_polls leer ist
npx tsx scripts/audit-vote-drucksache-mapping.ts crawl --start=900 --end=1020

# Auto-Klassifikation (rein lesend)
npx tsx scripts/audit-vote-drucksache-mapping.ts audit

# Optional: Review-Bogen generieren
npx tsx scripts/build-vote-mapping-review.ts

# Apply mit aktuell hartkodiertem Mapping in apply-Skript
npx tsx scripts/apply-vote-bundestag-audit.ts --dry-run
npx tsx scripts/apply-vote-bundestag-audit.ts
```

Das Mapping `poll_id → bundestag_id` in `apply-vote-bundestag-audit.ts` ist manuell gepflegt (50 Einträge, Stand 2026-05-13). Bei neuen Polls muss das Mapping erweitert werden — `audit`-Phase zeigt unmatched-Cases an.

## Bekannte Grenzen

1. **Drucksachen ohne LLM-Analyse** in `drucksache_analyses` werden beim Apply übersprungen — ihre Detail-Seiten würden leer rendern. Beim heutigen Lauf wurden 13 Drucksachen-Links übersprungen (meist Berichte mit niedrigen Nummern, die nicht zur LLM-Pipeline gehörten).
2. **Bundestag.de-IDs sind nicht stabil dokumentiert** — die Range 900-1020 wurde empirisch bestimmt und deckt den Zeitraum 2025-06-25 bis 2026-04-24 (21. WP, bisheriger Verlauf). Für künftige Wahlperioden muss die Range erweitert werden.
3. **Topic-Match-LCS-Heuristik** könnte bei sehr kurzen oder generischen Topics schwächeln. Aktuell für alle 50 Polls erfolgreich, aber bei deutlich größerem Korpus müsste die Heuristik validiert werden.
4. **Datums-basierte Kandidaten-Auswahl** geht davon aus, dass jede namentliche Abstimmung an genau einem Tag stattfindet. Mehrtägige Polls würden die Heuristik brechen — aktuell nicht im Korpus vorhanden.

## Ehrlicher Hinweis zur Sichtbarkeit dieser Validierung

Diese Methodik macht eine wichtige Aussage in der UI: *„Drucksachen-Verknüpfung autoritativ aus Bundestag.de bezogen (Cross-Source-Audit 2026-05-13)"* steht unter jeder Drucksachen-Sektion auf `/abstimmungen/[poll_id]`. Das ist nicht Marketing, sondern transparente Methodik — der:die Leser:in kann zu Bundestag.de selbst gehen und die Verlinkung dort nachprüfen.

Die Plattform versteht sich als *Analyse- und Aufbereitungs-Schicht* über offiziellen Quellen, nicht als alternative Datenquelle. Die Cross-Source-Validation ist die Brücke zwischen beiden.
