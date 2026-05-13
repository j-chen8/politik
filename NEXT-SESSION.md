# Next Session — Pickup-Kontext (Stand: 2026-05-13)

> **Erste Anlaufstelle:** Diese Datei. Cross-Track-Landkarte → `docs/OPEN-TRACKS.md`.

---

## 🎯 Drucksachen-Track: HEUTE FERTIG (10 Commits)

```
e53eb50 OPEN-TRACKS.md: Drucksachen-Track vollendet
9976f6f Drucksachen-Detail: „Weitere Drucksachen der Fraktion" Section
c8e54f9 Drucksachen in Cmd+K-Suche: FTS5-Index + Detail-Page-Link
7e9140c OPEN-TRACKS.md: zentrale Cross-Track-Landkarte
5b2b857 Politik-Glossar (25 Begriffe) + Wikipedia-Style Hover-Component
6568ce7 Drucksachen-Detail-Page (Letterboxd-Style) + DB-Queries
8f65a32 Drucksachen-Verlinkung: Antwort↔Anfrage + Publication-Date + Poll-Match
85fb53f Drucksachen v1.1: Tiered-Rerun für 209 heavy-truncated (50→700 W)
7250e59 Drucksachen Topic-Drift-Mapping: 1.143→7 unaufgelöste Drift-Tags
bb0e81b Drucksachen-Pipeline-Polish: XML-Tool-Call-Leakage repariert
cdff8a5 Drucksachen-LLM-Pipeline Foundation: 6 batch_class + Tiered-Prompts
```

**Stand der Drucksachen-Schicht:**
- 5.183 LLM-Analysen sauber (0 XML-Leaks, 0 Errors, 99,7 % konkretes Thema)
- Detail-Page `/design/linear/aktivitaeten/[ds-nr]` mit 8 Sections (Hero, Zusammenfassung, Kerninhalt, Details, Mitzeichner+Fraktionsverteilung, Plenum, Polls, Verfahren, Fraktions-DS, Ähnliche)
- 3 Navigations-Kreise (Anfrage↔Antwort, DS↔Vote, Fraktions-DS)
- Politik-Glossar (`/glossar` + Hover-Component)
- Cmd+K-Suche mit FTS5 auf LLM-Output (Snippet + Klassen-Label, Link auf Detail-Page)

**Kosten heute:** ~$11 (Tiered-Rerun-Batch ~$10,50 + LLM-Matches + Smoke-Tests)

---

## ⚡ Sofort-Start morgen — Demo-Launch (Hosting + Domain)

Per `docs/OPEN-TRACKS.md` ist der **aktive Track** der Demo-Launch (Hosting + Domain für externe Validierung). Vorbereitung läuft, nächste Schritte:

### Reihenfolge (laut OPEN-TRACKS.md)

1. **Fly.io-Account anlegen** (fly.io, Email + Karten-Verify)
2. **`npm run build` lokal testen** — Prod-Mode ist 10-400× schneller als Dev (siehe Memory `feedback_dev_vs_prod_performance`)
3. **`Dockerfile` + `fly.toml` schreiben** — Volume für `politik.db` (1 GB Spielraum)
4. **`fly deploy`** → URL kommt zurück
5. **Pre-Versand-Polish-Check:** Landing-Page sauber? Methodik-Page erreichbar? Glossar-Hover auf Mobile? Cmd+K via Tunnel/Prod testen.
6. **Domain wählen + registrieren** (INWX/Porkbun ~10 €/Jahr) — 5 Kandidaten:
   - `politik-puls.de`
   - `plenarpuls.de`
   - `wer-stimmt-wie.de`
   - `politikradar.de`
   - `bundes.tag`
7. **Anschreiben an Journalisten** — verbunden mit Role-Model-Track

### Status zum Aufwachen

- **Cloudflare Quick-Tunnel war heute Abend live** auf `https://sub-gaps-tab-lat.trycloudflare.com` im Background-Task `bpwf867d5`. **Ephemeral** — wenn der Laptop schlief, ist die URL weg. Nur zum eigenen Vorab-Testen, NICHT an Journalisten verschicken.
- **`next.config.ts` wurde geändert**: `allowedDevOrigins` enthält jetzt `*.trycloudflare.com`. Dev-Server-Restart ist pending — `next dev` (PID 1190115) lief noch mit alter Config beim Schlafengehen.
- **Search-Bug via Tunnel** war kein Code-Bug — API liefert sauber, Frontend wurde nur vom HMR-Origin-Block lahmgelegt. Nach Restart sollte's funktionieren.

---

## ⚠️ Working-Tree-Drift (302 uncommitted files)

Was NICHT von Drucksachen-Track ist und in der Working-Tree liegt:

- `src/app/design/linear/politiker/[id]/page.tsx` — Drucksachen-Section drin, mit fremden Refactor-Edits verwoben (`getActivityLabel` entfernt, `computeFactionLoyalty` weg, neue Funktions-Tier-Logik)
- `src/lib/db.ts` — `getDataFreshness`-Function + PoliticianRow photo-Spalten von anderem Track
- `next.config.ts` — `allowedDevOrigins` für LAN-Zugriff + heute neu `*.trycloudflare.com` für Tunnel
- `data/ausschuss_protokolle/*.json`, `data/cv-*.json`, `data/photos/*` — Pipeline-Output anderer Tracks
- ~5184 `data/drucksachen/*.pdf` — in .gitignore aufgenommen, werden nicht committet
- diverse weitere `scripts/*.ts`, `src/app/*` aus anderen Tracks

**Backup-Reset-Routine empfohlen** wenn andere Tracks weiterbearbeitet werden.

---

## 📋 Quick-Commands

**Dev-Server starten (mit Tunnel-Config):**
```bash
npm run dev
# → http://192.168.178.170:3000/
```

**Prod-Build testen (Vorbereitung Demo-Deploy):**
```bash
npm run build && npm start
# Prod ist 10-400× schneller als Dev — Pages-Performance erst hier ehrlich messbar
```

**Status-Checks:**
```bash
# DS-Pipeline OK?
sqlite3 politik.db "SELECT COUNT(*) FROM drucksache_analyses WHERE analyze_error IS NULL"
# → soll 5.183 zeigen

# FTS-Index aktuell?
sqlite3 politik.db "SELECT COUNT(*) FROM drucksachen_fts"
# → soll 5.183 zeigen
```

**Wichtige Routen zum Vorab-Test (auch via Tunnel):**
- `/` — Landing-Page (sauber für Versand?)
- `/design/linear` — Übersicht
- `/design/linear/aktivitaeten/21-3250` — Demo-DS Armutsbericht (massive-Tier, 600+ Wörter Summary mit Zahlen)
- `/design/linear/aktivitaeten/21-477` — Demo-DS mit Verfahrens-Link auf Antwort 21/726
- `/design/linear/aktivitaeten/21-1827` — Demo-DS Haushaltsgesetz mit namentlicher Abstimmung
- `/design/linear/glossar` — 25 Begriffe, GitHub-Style-TOC
- `/design/linear/methodik` — Trust-Anker für Externe

---

## 🗺️ Cross-Track-Übersicht

Für die komplette Landkarte aller offenen Tracks: **`docs/OPEN-TRACKS.md`**

Dort dokumentiert nach Status:
- 🟢 Aktiv: Demo-Launch (oben)
- 🟡 Pausiert: Reden-Pipeline, CV-Pipeline, Foto-Track, Topic-Klassifikation, Vote-Topic-UI, Search-Phase-2, Landing-Page-Phase-2, Role-Model
- 🔵 Phase-2-Backlog: PDF-Cover, Glossar breit, AI-Assist, Bundesrats-DS, etc.
- 📐 Methodische Schulden: Quote-Validation 9 % Lücke, Source-Coherence 13 % Recall
- 🚫 NICHT auf Agenda: PDF-Embedding, AI-Erklärer, volle Verfahrens-Pipeline

---

## 🎯 Empfehlung erste Aktion morgen früh

**Dev-Server-Restart**, damit `*.trycloudflare.com`-Config greift und Tunnel-Tests funktionieren:
```bash
# Alte Instanz killen
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs -r kill
# Cache + neu starten
rm -rf .next && npm run dev
```

**Dann:** Fly.io-Account anlegen + `npm run build` Prod-Test. Wenn alles grün, Dockerfile schreiben.

Falls du erstmal ankommen willst: **5 Min Status-Check** der Demo-Routen oben — schauen ob alles funktioniert wie gestern Abend.
