# Next Session — Pickup-Kontext (Stand: 2026-05-13, später Abend)

> **Erste Anlaufstelle:** Diese Datei. Cross-Track-Landkarte → `docs/OPEN-TRACKS.md`.

---

## ✅ Heute fertig: Legal-Pages + Landing/Methodik-Polish (2 Commits)

```
46a3418 Landing + Methodik: Polish für externe Reviewer
bec9f07 Impressum + Datenschutz: c/o COCENTER + Proton statt Privatdaten
```

### Legal-Pages-Stack (`bec9f07`)
- **Impressum-Adresse:** [alte Privatadresse] → **c/o COCENTER, Koppoldstr. 1, 86551 Aichach** (Anschrift.net gebucht, ~6,70 €/Monat, scan-only, jederzeit kündbar). Geändert in §5 DDG, §18 MStV und in der Datenschutz-„Verantwortliche Stelle".
- **Email:** `[alte Privat-Email]` → **`hallo@jinsheng-chen.de`** (Proton Mail Free, 0 €). Geändert an 8 Stellen in Impressum + Datenschutz.
- **Default-Impressum gelöscht** (`src/app/impressum/`); `SiteChrome.tsx`-Footer-Link zeigt jetzt auf Linear-Impressum.

### Landing-Polish (`46a3418`, Teil 1)
- **Methodik als 6. Top-Nav-Eintrag** in Linear-Header (`BookOpen`-Icon, zwischen Protokolle und Suche). Vorher nur im Footer = praktisch unsichtbar.
- **Trust-Pitch live aus DB:** `641 CVs · 9.272 Reden · 5.183 Drucksachen` KI-aufbereitet, jede Zahl mit eigenem Mikro-„Methodik"-Link. Konsistent zu den Wirksamkeit-Stats auf der Methodik-Page selbst.
- **LatestActivityStrip** zwischen Hero und Pop-Hero — 3 Live-Karten (Plenarsitzung 75, Energiesteuer-Poll, Drucksache 21/5640) mit „Letzter Datenstand: 28. April 2026" oben rechts. Signalisiert dass die Seite lebt.

### Methodik-Cleanup (`46a3418`, Teil 2)
Agent-Audit hatte ergeben: 6 WRONG / 11 STALE / 4 DEAD / 5 BLOAT. Alles adressiert:
- **DEAD:** Stufe 3 / Stufe 4 / Stufe 5.5 / Halluzinations-Reparatur **komplett gelöscht** — das war historische Phase-0–6-Llama-vs-Mistral-Cascade, längst durch Haiku-4.5-Single-Pass ersetzt. Plus tote Helper (readVerdicts, VerdictTable etc.).
- **WRONG:** Mandrella-Backfill-Notiz raus (war längst gefüllt). Llama-3.1-8B-Fallback raus (gibt's nicht). Plenarbeitrag-Typen-Tabelle live (war 10× falsch — z.B. fragestunde_antwort 39 → tatsächlich 1.822). 14.347 → 13.722 CV-Aussagen. Framing-Marker als „seit 2026-05-12 nicht im UI" markiert (35 % Halluzinations-Quote). Bias-Korrektur ehrlich: 400 generiert, nur 51 ans Frontend gemerged.
- **STALE:** 11 Zahlen jetzt live aus DB via neuem `getMethodikCounts()`-Helper.
- **BLOAT:** „Warum Cascade"-Box 5→2 Bullets, „Warum Reden-Pipeline anders"-Box 5→2 Bullets, Halluzinations-Rate von ~60 auf ~25 ehrliche Zeilen umgeschrieben („wir haben keine veröffentlichungsreife Lower-Bound für die aktuelle Pipeline").
- **NEU:** „Bekannte Pipeline-Pathologien" in `#coverage-bias` — 5 dokumentierte Limitationen (Bareiß-stale-page, leere AfD-Profile, Multi-Page-Biographien nicht traversiert, Source-Coherence-Recall ~13 %, Tonalitäts-Drift).

---

## ⚠️ Beim Aufwachen — Lage prüfen

Dev-Server lief beim Schlafengehen im Hintergrund **auf Port 3000** (im LAN als `http://192.168.178.170:3000`). Wenn er noch lebt: kurze Smoke-Tests reichen, kein Neustart nötig. Sonst:

```bash
ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | xargs -r kill
rm -rf .next && npm run dev
```

**Was die Smoke-Tests zeigen sollten:**
- `/design/linear` → Methodik im Top-Nav, Trust-Pitch zeigt 641/9.272/5.183, LatestActivityStrip mit 3 Karten
- `/design/linear/methodik` → Wirksamkeit-Stats live, kein „Stufe 3/4/5.5" mehr in der Seitenleiste, neuer Block „Bekannte Pipeline-Pathologien" am Ende der Coverage-Bias-Sektion
- `/design/linear/impressum` → c/o COCENTER Aichach + hallo@jinsheng-chen.de
- `/design/linear/datenschutz` → dito

---

## 🎯 Sofort-Start morgen — Demo-Launch (Hosting + Domain)

> Per `docs/OPEN-TRACKS.md` ist der aktive Track unverändert **Demo-Launch**. Impressum + Datenschutz + Polish sind jetzt aber **erledigt**, nicht mehr blocker. Direkt zur Hosting-Schicht.

### Reihenfolge

1. **Fly.io-Account anlegen** (fly.io, Email + Karten-Verify)
2. **`npm run build` lokal testen** — Prod ist 10–400× schneller als Dev. Erst hier ehrlich messen, wo's hakt.
3. **`Dockerfile` + `fly.toml` schreiben** — Volume für `politik.db` (1 GB Spielraum)
4. **`fly deploy`** → URL kommt zurück
5. **Pre-Versand-Polish-Check** via Prod-URL:
   - Landing sauber?
   - Methodik-Page-Anker funktionieren (`#cascade`, `#reden-pipeline`, `#coverage-bias`)?
   - Glossar-Hover auf Mobile?
   - Cmd+K-Suche?
6. **Domain wählen + registrieren** (INWX/Porkbun ~10 €/Jahr) — 5 Kandidaten unverändert:
   - `politik-puls.de`
   - `plenarpuls.de`
   - `wer-stimmt-wie.de`
   - `politikradar.de`
   - `bundes.tag`

   **Hinweis:** Wenn Domain steht, Proton-Mail-Setup updaten — `kontakt@<domain>.de` kostet bei Proton allerdings Mail-Plus (~4 €/Mo). Alternative: Cloudflare-Email-Routing direkt vom Domain-Registrar an die bestehende `hallo@jinsheng-chen.de` weiterleiten (kostenlos).

7. **Anschreiben** an erste:n Journalist:in aus `docs/cold-email-targets.md`.

### 🎯 Die eine wichtige Sache (Erinnerung — unverändert)

> *„Ich schreib die Email, wenn mein Impressum fertig ist."*

Impressum **mit echter c/o-Adresse + non-private Mail** ist jetzt fertig. Methodik-Page sieht journalistisch belastbar aus. Die nächste Aktion ist: **eine Email schreiben.** Vier Sätze. Eine Person. Modus 1 muss nicht wow sein, muss informativ sein.

---

## ⚠️ Working-Tree-Drift (unverändert ~300 Files)

Andere Tracks (Reden-Pipeline-Skripte, Foto-Track, CV-Cleanup-Outputs, Drucksachen-PDFs in `.gitignore`) liegen weiter in der Working-Tree, nicht committet. Wenn du an einem dieser Tracks weiterarbeiten willst, Backup-Reset-Routine wie immer.

---

## 📋 Quick-Commands

**Dev-Server starten:**
```bash
npm run dev
# → http://localhost:3000 (oder LAN: http://192.168.178.170:3000)
```

**Prod-Build testen (Vorbereitung Fly.io):**
```bash
npm run build && npm start
# Prod ist 10-400× schneller als Dev — Pages-Performance hier ehrlich
```

**Methodik-Live-Counts gegenchecken:**
```bash
sqlite3 politik.db "SELECT COUNT(*) FROM politicians WHERE cv_summary IS NOT NULL"  # → 641
sqlite3 politik.db "SELECT COUNT(DISTINCT rede_id) FROM speech_analyses_v2"          # → 9.272
sqlite3 politik.db "SELECT COUNT(*) FROM drucksache_analyses WHERE analyze_error IS NULL"  # → 5.183
```

---

## 🗺️ Cross-Track-Übersicht

Für die komplette Landkarte aller offenen Tracks: **`docs/OPEN-TRACKS.md`**

Status:
- 🟢 Aktiv: **Demo-Launch** (Fly.io + Domain + erste Cold-Email)
- 🟡 Pausiert: Reden-Pipeline, CV-Pipeline, Foto-Track, Topic-Klassifikation, Vote-Topic-UI, Search-Phase-2, Role-Model
- 🔵 Phase-2-Backlog: PDF-Cover, Glossar breit, AI-Assist, Bundesrats-DS
- 📐 Methodische Schulden: Two-Pass-Verifier für Framing-Marker, IAA-Studie für Tonalität, Ground-Truth-Sampling CV
- 🚫 NICHT auf Agenda: PDF-Embedding, AI-Erklärer, volle Verfahrens-Pipeline
