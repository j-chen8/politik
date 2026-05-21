# Offene Tracks — Cross-Track-Landkarte

> **Zweck:** Single Source für alles was über alle Tracks offen ist. Wird beim Aufräumen am Ende einer Session gepflegt.
> Tagesfrische Pickup-Notizen für „morgen früh anfangen" → `NEXT-SESSION.md`. Pipeline-Inventar → `docs/PIPELINE.md`. Per-Track-Detail → `docs/<track>-*.md`.
>
> **Stand:** 2026-05-13 (nach Drucksachen-Cmd+K-Session). Spätere Punktupdates
> per `Update YYYY-MM-DD`-Block inline ergänzt — letzte: **2026-05-20**
> (Vote↔Drucksache-Pipeline auf Filterlist umgestellt).
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
- ~~5 ungematchte Polls~~ → **gelöst durch Vote-↔-Drucksache Cross-Source-Audit am 2026-05-13** (siehe unten).
- 13 Records mit `thema='Sonstiges'` (echte Long-Tail-Singletons).
**Per-Track-Doc:** `docs/drucksachen-pipeline.md`

---

## ✅ Parallel-Track 2026-05-13 (Pre-Launch-Tier-1-4-Sweep + Vote-DS-Cross-Audit)

> Wurde parallel zum Drucksachen-Track gefahren. Eigene Working-Tree-Edits, eigene Commit-Geschichte. Die meisten Änderungen sind in der Working-Tree, nicht committet.

### Vote-↔-Drucksache Cross-Source-Audit gegen Bundestag.de (Krone der Session)

> **Update 2026-05-20:** Diese Block-Modell-Pipeline wurde durch
> `scripts/map-vote-drucksache-bundestag.ts --apply` (Filterlist-basiert,
> autoritativ pro Roll-Call) abgelöst. `apply-vote-bundestag-audit.ts` und
> `audit-vote-drucksache-mapping.ts` sind gelöscht / tot, siehe
> `docs/DATA-SOURCES.md` §2.13 für die aktuelle SoT. Die History unten bleibt
> als Audit-Trail.

**Trigger:** User-Frage *„Macht das Bundestag.de nicht schon?"* + spezifisch: zu Vote-id=982 fehlte DS-Verknüpfung.

**Pipeline aufgebaut (historisch, 2026-05-13 — heute alle Alt-Skripte gelöscht/tot):**
- `scripts/audit-vote-drucksache-mapping.ts` — Crawler für Bundestag.de-Abstimmungs-Pages (IDs 900-1020), parst Datum + Topic + Drucksachen aus `<span class="a-link__label">…</span>` und `<span class="bt-date">…</span>`.  *(tot, gelöscht)*
- `audit_bundestag_polls` (neue DB-Tabelle) — Cache der 101 gescrapten Pages.
- `scripts/auto-classify-vote-mapping.ts` — Klassifizierung CONFIRMED/EXTENDED/DS_MISSING/AMBIGUOUS via LCS-Topic-Matching.
- `scripts/build-vote-mapping-review.ts` — Generiert manuellen Review-Bogen (`docs/vote-mapping-review.md`, kann archiviert werden).
- `scripts/apply-vote-bundestag-audit.ts` — Apply der 50 manuell verifizierten Poll → Bundestag-ID-Mappings.  *(am 2026-05-20 gelöscht, durch `map-vote-drucksache-bundestag.ts --apply` ersetzt)*

**Befund nach manueller 50-Poll-Verifikation:**
- 33 CONFIRMED (unsere DS in BT-Liste, BT hat zusätzliche)
- 1 PARTIAL (Poll 6286 Verbrenner — `21/1593` korrigiert zu `21/225`)
- 16 REPLACE (unsere Heuristik hatte falsche DS — z. B. spätere-WP-Nummern, ähnlich klingende Themen)

**Apply-Ergebnis:**
- `drucksache_polls` komplett neu geschrieben: **270 DS-Links über 50 Polls** (vorher 57 Links über 45). `matched_via='bundestag_de_audit'`, `match_score=1.0`.
- Alte 57 Mappings archiviert in `drucksache_polls_pre_bt_audit`.
- 3 DB-Snapshots erstellt (foto-license, drucksache-polls-backfill, bt-audit-apply).

**UI-Integration:**
- `getVoteDetail()` in `src/lib/db.ts` erweitert um `drucksachen`-Feld.
- `src/app/design/linear/abstimmungen/[poll_id]/page.tsx` rendert neue Sektion „Drucksachen zur Abstimmung" zwischen TOP und Verbundene-Debatte.
- ⚠️ **Dev-Server hat das `db.ts`-Update nicht hot-reloaded** — alle `/abstimmungen/<poll_id>` werfen aktuell 500. **Server-Restart fixt das** (in `NEXT-SESSION.md` markiert als Sofort-Task).

**Audit-Output:** `docs/vote-drucksache-cross-audit.md`

### Pre-Launch-Tier-1-4-Sweep (15 Red-Flag-Punkte adressiert)

**Tier 1 — Rechtlich:**
- ✅ URHG-Wording bei Roh-Texten entschärft (`/datenquellen` Zitatrecht-Framing)
- ✅ Pro-CV-Eintrag-Attribution mit § 51 UrhG-Hinweis (`PoliticianCV.tsx`)
- ✅ **Foto-Lizenz-Backfill** — 453/453 Fotos via Wikimedia-Commons-API (Author + Lizenz + URL). UI-Caption unter Foto + angereicherte `/datenquellen`-Liste. Skript: `scripts/backfill-photo-licenses.ts`.
- ✅ Pre-Launch Indexing-Schutz: `noindex/nofollow/nocache` in `layout.tsx` + `app/robots.ts` mit `Disallow: /`.
- ✅ Impressum komplett: § 5 DDG, § 18 MStV, Korrektur-SLA 14 Tage, § 36 VSBG.
- ✅ Datenschutzerklärung neu (`/datenschutz`): DSGVO-konform, Aufsichtsbehörde Berlin verlinkt.
- ✅ LICENSE-Datei (MIT für Code, Daten-Lizenz-Pointer-Block).

**Tier 2 — Methodisch:**
- ✅ Coverage-Bias-Analyse (`scripts/analyze-coverage-bias.ts` + `docs/coverage-bias.md`) — Befund: AfD 69,3 %, Linke 57,8 % Homepage-Coverage. 38 institutionelle URLs identifiziert (Open-Item siehe unten).
- ✅ Tonalitäts-Disclaimer + Verteilungs-Tabelle je Fraktion (`docs/tonalitaet-distribution.md`). 3 Caveats: Segment vs Rede, Topic-Confound, Speaker-Identity-Confound.
- ✅ Halluzinationsrate als **Lower Bound** präzisiert (Methodik-Section). Verifier-Recall ~69 % als Indikator.
- ✅ Manueller 20-Sample-Reden-Audit (`docs/rede-audit-findings.md`). Trefferquoten: Zitate 100 %, Forderungen 90 %, Summary 90 %, Tonalität 85 %, Framing-Marker 65 %.
- ✅ **Framing-Marker UI-Demotion** (`SpeechAnalysisDetails.tsx`) — Sektion auskommentiert, DB-Daten bleiben. Two-Pass-Verifier-Repair als Folgearbeit (siehe unten).
- ✅ Konsistenz-Sweep Summary ↔ konkrete_zahlen — 5 echte Mieves-Typ-Größenordnungs-Verwechslungen über 11.101 Segmente (~0,07 %).
- ✅ Anti-Gotcha-Block auf `/quellen-diskrepanzen` — 5 Ursachenklassen, „Datenqualitäts-Map, keine Skandalliste".

**Tier 3 — Resilienz + Reproduzierbarkeit:**
- ✅ RESEARCHER.md im Repo-Root (DB-Schema-Walkthrough, Stichproben-Queries, Cost-Schätzung).
- ✅ Daten-Aktualitäts-Anzeige live auf `/datenquellen` (5 Quellen).
- ✅ Hosting-Optionen dokumentiert: `docs/hosting-deployment.md` (Named Cloudflare Tunnel als kostenlose Pre-Launch-Lösung — wird durch Demo-Launch-Track via Fly.io ersetzt).
- ✅ CSV-Export für Wissenschaftler:innen (`scripts/export-tables-csv.ts`, 7 Tabellen, RFC-4180).
- ✅ Foto-UI vergrößert (`size="lg"` → `size="xl"`, klickbar zu Commons, dezentere Caption).

**Tier 4 — Brand + Identity:**
- ✅ About-Seite gebaut (`/ueber`) — persönliche Ich-Form, Mission, Pragmatiker-Standpunkt, Beta-Status, Feedback-Bitte.
- ✅ GitHub Repo umbenannt: `opoi1` → `j-chen8`, 13 Source-Dateien per sed aktualisiert.
- ✅ GitHub Repo aufgeräumt: 4 alte/leere Public-Repos gelöscht.

**Email:** `hallo@jinsheng-chen.de` (Proton Mail Free). Migration **erledigt am 2026-05-13 abends** (siehe Polish-Session unten + Commit `bec9f07`).

---

## ✅ Polish-Session 2026-05-13 abends (Legal-Pages + Landing/Methodik)

Zwei Commits, ~2 h reine Arbeitszeit.

### `bec9f07` — Legal-Pages: Privatdaten raus

- **Adresse:** [alte Privatadresse] → `c/o COCENTER, Koppoldstr. 1, 86551 Aichach` (Anschrift.net Bayern, ~6,70 €/Mo, scan-only, jederzeit kündbar). Geändert in `linear/impressum/page.tsx` (§5 DDG + §18 MStV) und `linear/datenschutz/page.tsx` (Verantwortliche Stelle).
- **Email:** `[alte Privat-Email]` → `hallo@jinsheng-chen.de` (Proton Mail Free, 0 €/Mo). 8 Code-Stellen.
- **Default-Impressum gelöscht** (`src/app/impressum/`). `SiteChrome.tsx`-Default-Footer-Link auf Linear-Impressum umgebogen (Landing nutzt noch Default-Chrome).

### `46a3418` — Landing + Methodik-Polish für externe Reviewer

**Landing (`src/app/design/linear/page.tsx`):**
- Methodik in Top-Nav (6. Eintrag, `BookOpen`-Icon)
- Trust-Pitch zeigt jetzt `641 CVs · 9.272 Reden · 5.183 Drucksachen` live via `getLlmPipelineCounts()`, jede Zahl mit Mikro-„Methodik"-Link
- Neue `LatestActivityStrip` (Plenarsitzung 75 + Energiesteuer-Poll + Drucksache 21/5640) mit „Letzter Datenstand"

**Methodik (`src/app/design/linear/methodik/page.tsx`):** vorher 1.385 Zeilen, jetzt deutlich schlanker.
- Audit via delegierter Agent: **6 WRONG / 11 STALE / 4 DEAD / 5 BLOAT** identifiziert. Methodik in `feedback_audit_via_subagent.md`.
- **DEAD raus:** Stufe 3 / Stufe 4 / Stufe 5.5 / Halluzinations-Reparatur (Phase-0–6 historisch, durch Haiku-Single-Pass ersetzt). Tote Helper auch raus (`readVerdicts`, `readStage5_5Stats`, `VerdictTable`).
- **WRONG fixed:** Mandrella-Backfill-Notiz raus, Llama-3.1-8B-Fallback raus (existiert nicht), Plenarbeitrag-Typen-Tabelle live (war 10× off — fragestunde_antwort: 39 → tatsächlich 1.822), 14.347 → 13.722 CV-Aussagen, **Framing-Marker als „seit 2026-05-12 nicht im UI angezeigt — 35 % Halluzinations-Quote" markiert**, Bias-Korrektur ehrlich: 400 generiert / 51 angewendet.
- **STALE live:** Neuer `getMethodikCounts()`-Helper in `db.ts` (CV-Aussagen-Sum, Quote-Validation-Ratios, Poll-Counts, Plenarbeitrag-Typen).
- **BLOAT compressed:** „Warum Cascade"-Box 5→2 Bullets, „Warum Reden-Pipeline anders"-Box 5→2 Bullets, Halluzinations-Rate-Sektion ~60 → ~25 ehrliche Zeilen.
- **NEU:** „Bekannte Pipeline-Pathologien" in `#coverage-bias` — 5 dokumentierte Limitationen (Bareiß-stale-page, leere AfD-Profile, Multi-Page-Biographien, Source-Coherence-Recall ~13 %, Tonalitäts-Drift).

---

## 🟡 Neue Open-Items aus 2026-05-13-Sweep

### A — Methodik-Seite-Section für Vote-↔-Drucksache-Cross-Source-Audit
**Status (2026-05-20):** Block-Modell-Apply ist Geschichte; neue SoT ist
Filterlist-Apply (`map-vote-drucksache-bundestag.ts`, siehe DATA-SOURCES §2.13).
Methodik-Seite zeigt das noch nicht.
**Aufwand:** ~20 Min — Section mit aktueller Bilanz (13 EXAKT · 38 DIFF · 0
UNMATCHED über 51 Polls), Methodik (Filterlist + 1:1-Optimal-Assignment +
Title-Token-Match), Link zu `docs/vote-drucksache-mapping-methodology.md`.

### B — Methodology-Doc für Vote-↔-Drucksache-Audit
**Status (2026-05-20):** `docs/vote-drucksache-mapping-methodology.md` existiert
(Block-Modell-Doku vom 2026-05-13). Soll um Filterlist-Apply-Abschnitt
ergänzt werden — alter Teil als Historie markieren.
**Aufwand:** ~30 Min.

### C — DB-Cleanup für 38 institutionelle Homepage-URLs (Task #12 aus Tier-2-Sweep)
**Status:** Coverage-Bias-Analyse hat 38 URLs als institutionelle Listings (statt persönliche Vitas) identifiziert: 28 AfD (`afdbundestag.de/person/`), 5 Linke (`linksfraktion.de/abgeordnete/profil/…`), 1 CDU, 4 weitere.
**Aufwand:** ~30-45 Min. Set `cv_homepage_url = NULL` für diese Fälle plus `cv_homepage_text` und `cv_homepage_json` (potenziell aus generischen Listing-Seiten extrahiert = Müll). Audit-Trail in `cv_repair_log`.
**Trigger:** Nach Modus-1-Outreach. Kein Blocker, aber Datenqualität.
**Detail:** `scripts/audit-homepage-urls.ts` listet alle Fälle.

### D — Two-Pass-Verifier für Framing-Marker (Task #19)
**Status:** UI-Demotion ist durch. Pipeline-Reparatur als mittelfristige Folgearbeit.
**Aufwand:** ~4-5 h + ~$30 LLM-Cost.
- Pass 1 (Generator, bestehend) — Marker vorschlagen
- Pass 2 (Verifier, NEU) — zweiter LLM aus anderer Modell-Familie prüft pro Marker „Beleg im Text vorhanden?"
- Filter: nur Marker mit Beleg behalten
- Test auf 20-Sample-Audit-Polls, dann Voll-Run für 11.101 Segmente
- Bei Trefferquote > 90 % → UI-Sektion reaktivieren
**Detail-Plan:** `docs/rede-audit-findings.md` (Abschnitt „Priorisierte Folgearbeit")

### ~~E — Email-Migration (Privat → Custom)~~ ✅ **Erledigt 2026-05-13 abends** (Commit `bec9f07`)
**Stand:** B-Pfad gefahren — `hallo@jinsheng-chen.de` an 8 Stellen ersetzt (Impressum 4×, Datenschutz 4×). Adresse parallel auf c/o COCENTER Aichach via Anschrift.net (~6,70 €/Mo, scan-only) umgestellt. Default-Impressum gelöscht; SiteChrome-Footer auf Linear-Impressum umgebogen.
**Optionaler C-Pfad:** wenn Domain steht, `kontakt@<domain>.de` via Cloudflare-Email-Routing kostenlos an Proton weiterleiten (kein Proton-Plus-Upgrade nötig).

### F — IAA-Studie für Tonalität
**Status:** Methodik-Seite hat den expliziten Caveat „IAA fehlt". Methodisch nicht blockierend für Modus 1.
**Aufwand:** Mehrere Wochen — braucht 2+ unabhängige menschliche Codierer:innen + Codebook + Cohen's Kappa. Ggf. erst nach Förderung-Antrag.

---

## ⚠️ Working-Tree-Drift 2026-05-13 (Parallel-Track-Anteil)

Diese Dateien wurden im heutigen Parallel-Track modifiziert/erstellt und sind aktuell uncommittet — der Drucksachen-Track-Working-Tree hat zusätzlich seine eigenen Edits, die getrennt werden müssen.

**Neue Files:**
```
LICENSE                                       (MIT + Daten-Lizenz-Pointer)
RESEARCHER.md                                 (Forscher-Walkthrough)

docs/coverage-bias.md
docs/hosting-deployment.md
docs/rede-audit-findings.md
docs/rede-audit-samples.md
docs/tonalitaet-distribution.md
docs/vote-drucksache-cross-audit.md
docs/vote-mapping-review.md

scripts/analyze-coverage-bias.ts
scripts/analyze-tonalitaet-distribution.ts
scripts/apply-vote-bundestag-audit.ts          (am 2026-05-20 gelöscht — abgelöst durch map-vote-drucksache-bundestag.ts)
scripts/audit-homepage-urls.ts
scripts/audit-vote-drucksache-mapping.ts       (tot per DATA-SOURCES §2.13 — Alt-Skript, nicht mehr nutzen)
scripts/audit-zahl-konsistenz.ts
scripts/auto-classify-vote-mapping.ts
scripts/backfill-drucksache-polls-bundestag.ts
scripts/backfill-photo-licenses.ts
scripts/build-vote-mapping-review.ts
scripts/dump-rede-audit-samples.ts
scripts/export-tables-csv.ts

src/app/design/linear/ueber/page.tsx
src/app/design/linear/datenschutz/page.tsx
src/app/robots.ts
```

**Modifizierte Files:**
```
.gitignore                                        (data/exports, data/drucksachen)
src/app/design/linear/datenquellen/page.tsx       (Wording-Entschärfung, Daten-Stand, Foto-Credits)
src/app/design/linear/impressum/page.tsx          (komplett neu)
src/app/design/linear/methodik/page.tsx           (5 neue Sections)
src/app/design/linear/abstimmungen/[poll_id]/page.tsx  (Drucksachen-Sektion)
src/app/design/linear/politiker/[id]/page.tsx     (Foto-Caption + xl-Avatar)
src/app/design/linear/quellen-diskrepanzen/page.tsx  (Anti-Gotcha-Block)
src/app/layout.tsx                                 (noindex/robots)
src/lib/db.ts                                      (getDataFreshness, photo_*, VoteDetail.drucksachen, VoteDrucksacheRow)
src/components/SiteChrome.tsx                      (Über + Datenschutz im Footer)
src/components/PoliticianAvatar.tsx                (xl-Größe)
src/components/PoliticianCV.tsx                    (§ 51 UrhG-Hinweis)
src/components/SpeechAnalysisDetails.tsx           (Framing-Marker auskommentiert)
```

**DB-Änderungen:**
- Neue Spalten: `politicians.photo_author`, `photo_license`, `photo_license_url`, `photo_license_backfilled_at`
- Neue Tabellen: `audit_bundestag_polls`, `drucksache_polls_pre_bt_audit`
- 453 Fotos mit Author + Lizenz angereichert
- `drucksache_polls` komplett ersetzt: 57 → 270 Links

**Empfohlener Commit-Split (für später):**
1. Foto-Lizenz-Track (`backfill-photo-licenses.ts`, photo_*-Spalten, PoliticianAvatar xl, photo-credit-line, datenquellen-Liste)
2. Pre-Launch-Schutz (noindex, robots, LICENSE, RESEARCHER.md)
3. Impressum + Datenschutz + About
4. Methodik-Audits (coverage-bias, tonalität-disclaimer, halluzinations-bound, rede-audit, konsistenz-sweep)
5. Anti-Gotcha-Frame (`/quellen-diskrepanzen`)
6. Daten-Aktualität + CSV-Export
7. Vote-↔-Drucksache Cross-Source-Audit (audit-Skripte, DB-Tabellen, apply, UI-Sektion)
8. GitHub-Rename in 13 Files

---

## 🟢 Aktiv / als Nächstes

### Demo-Launch (Mini-PC + Cloudflare Tunnel)
**Ziel:** Öffentlicher, erinnerbarer Link zum Versand an 10–20 Journalisten/Politikwissenschaftler. 1–2 Wochen Demo-Fenster, danach Re-Evaluierung.

**Entscheidungen Stand 2026-05-13 (Nachtmodus, Session 2):**
- **Pivot von Fly.io → Mini-PC + Cloudflare Tunnel.** Gründe: 0 €/Monat statt 3 €, keine Karten-Verify, keine C/O-Hürde für Hosting, DSGVO-Plus (Daten bleiben physisch zuhause), kein IP-Exposure (Tunnel outbound-only).
- **Mini-PC-Specs:** Ubuntu 26.04 LTS, Node 20.20.2, 8 GB RAM (4.9 GB frei), 51 Mbit Up / 105 Mbit Down / 16 ms zu CF-Frankfurt. Always-on.
- **Domain:** `jinsheng-chen.de` bei INWX bestellt — Personal-Reuse-Domain statt Wegwerf-Placeholder. Demo-URL: `https://politik.jinsheng-chen.de`. Wenn das Projekt später eigenen Brand bekommt, bleibt die Personal-Domain für Blog/Portfolio/Experimente. (3 h Acronym-Wanderlust heute: PARAT, AKTA, FAKT, PERFA, PROFI, PALFA, AURA — alle verworfen. AURA scheiterte an PwC-Audit-Tool gleichen Namens.)
- **systemd user-mode** (kein root für Services, Linger=yes), beide Service-Files unter `~/.config/systemd/user/`.

**Erledigt heute (Session 2):**
- Domain `jinsheng-chen.de` bei INWX bestellt (STID 06878bb8-aa69-4863-bb64-b8a87b6589af)
- Cloudflare-Zone hinzugefügt, INWX-Parking-A-Records gelöscht
- Nameserver bei INWX umgestellt auf `evangeline.ns.cloudflare.com` + `sterling.ns.cloudflare.com`
- `~/.config/systemd/user/politik-web.service` angelegt, Syntax-validiert, getestet (90 MB RAM, statische Pages 7–11 ms, dynamische 300–1700 ms cold)
- `~/.config/systemd/user/cloudflared-politik.service` Template angelegt
- `loginctl enable-linger jinsheng` aktiviert
- 2 TS-Build-Blocker gefixt (`page.tsx:70` toter party-Fallback + `CommandPalette.tsx:32` fehlendes `totalsOriginal`)
- `npm run build` durchgelaufen, sauberer .next-Output

**Wartet auf:**
- DENIC-Propagation der Nameserver-Änderung → CF-Dashboard zeigt „Active"
- Realistisch 30–60 Min, max 24 h. Check mit `dig +short jinsheng-chen.de NS`.

**Pickup-Schritte morgen früh:**
1. `dig +short jinsheng-chen.de NS` — wenn CF-NS zurückkommt → weiter
2. `cloudflared tunnel login` (Browser-URL in Laptop autorisieren)
3. `cloudflared tunnel create politik` → UUID notieren
4. `cloudflared tunnel route dns politik politik.jinsheng-chen.de`
5. `~/.cloudflared/config.yml` schreiben (Routing-Regel zu localhost:3000)
6. `pkill -f "next dev"` + `systemctl --user enable --now politik-web cloudflared-politik`
7. Smoke-Test: `curl -I https://politik.jinsheng-chen.de` + Handy-Test
8. Erste Cold-Email an eine Person aus `docs/cold-email-targets.md`

**Per-Track-Doc:** _(noch keiner — bei Bedarf `docs/demo-launch.md` anlegen)_

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
