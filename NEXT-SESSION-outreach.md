# Next Session — Outreach-Track (Stand: 2026-05-21, Abend)

> Dedizierte Track-Datei für Cold-Mail-Outreach + Experten-Konversationen.
> Nicht `NEXT-SESSION.md` (fremde Track-Drift). Track-Isolation.

---

## Was heute passiert ist

### 1. Technisches Pre-Launch-Setup (alles deployed + live)

- **iCloud+ Custom Email Domain** eingerichtet: `hallo@jinsheng-chen.de`
  - DNS-Records bei Cloudflare: MX, SPF, DKIM, Apple-Verify, **DMARC** (`v=DMARC1; p=none`)
  - mail-tester.com Score: **10/10**
  - Versand läuft über iCloud-Webmail (icloud.com/mail)
- **Impressum + Datenschutz** auf `hallo@jinsheng-chen.de` umgestellt (8 Stellen, war `chenjinsheng@proton.me`)
- **Design-Polish:** Blau-Akzent (`#2563eb`) → zinc-950, CV-Sektionen einheitlich zinc-500, Page-Wash entblaut
- **URL-Cleanup:** `politik.jinsheng-chen.de/` zeigt jetzt direkt das Linear-Design (Rewrite in `next.config.ts` + `SiteChrome.tsx`), kein `/design/linear` mehr in der Einstiegs-URL
- **Methodik-Drift-Fix:** hartkodierte Zahlen (`11.101`/`9.272`/`563`) → dynamische `getMethodikCounts()`; historische Audit-Snapshots mit Datum attribuiert
- **DATA-SOURCES.md §0 Schritt 8** ergänzt: Methodik-Konsistenz-Check als Pflicht-Teil jedes Daten-Refresh

### 2. Cold-Mail-Erst-Welle: 12 Mails versendet

Alle am 2026-05-21, Absender `hallo@jinsheng-chen.de`. Siehe Outreach-Log unten.

### 3. Erste Antwort: Jeanette Hofmann (WZB) — am selben Tag

Zwei Antworten von ihr noch am 21.05. Konversation läuft. Status siehe unten.

---

## Outreach-Log — 12 Cold-Mails (Stand 2026-05-21)

| # | Person | Adresse | Archetyp | Status |
|---|---|---|---|---|
| 1 | Marcel Pauly | marcel.pauly@spiegel.de | Daten-Journalismus (SPIEGEL) | Sent |
| 2 | Andreas Jungherr | andreas.jungherr@uni-bamberg.de | Akademie Politik+KI | Sent |
| 3 | Simon Munzert | munzert@hertie-school.org | Akademie Data Science | Sent |
| 4 | Arne Semsrott | arne.semsrott@okfn.de | Civic-Tech-Peer | Sent |
| 5 | Christoph Bieber | christoph.bieber@uni-due.de | Akademie Demokratie+Digital | Sent |
| 6 | Andrea Römmele | roemmele@hertie-school.org | Akademie Pol. Kommunikation | Sent (Hertie-Disclosure mit #3) |
| 7 | Lorena Jaume-Palasí | ljp@ethicaltech-society.org | Public Intellectual | Sent |
| 8 | Sascha Venohr | sascha.venohr@zeit.de | Daten-Journalismus (ZEIT) | Sent |
| 9 | Christina Elmer | christina.elmer@tu-dortmund.de | Akademie+Praxis-Bridge | Sent (Initial-Bounce → nach DMARC-Add Retry OK) |
| 10 | Lorenz Matzat | kontakt@lorenz-matzat.de | Civic-Tech-DJ (frei) | Sent — ⚠️ Adresse unverifiziert, Bounce möglich |
| 11 | Jeanette Hofmann | jeanette.hofmann@wzb.eu | Akademie Internet+Demokratie | **Sent → 2× geantwortet** |
| 12 | Marcel Lewandowsky | marcel.lewandowsky@uni-halle.de | Akademie Politik+Sprache | Sent |

**Bounce-Check morgen:** besonders #10 (Matzat) und #12 (Lewandowsky, Backup `marcel.lewandowsky@politik.uni-halle.de`).

---

## Hofmann-Thread — Status

**Verlauf:**
1. Hofmann fragte: „Wird es auch Daten zu kleinen Anfragen geben?" + Hinweis auf eingeschlafenes Vorgänger-Tool (kleineanfragen.de)
2. Antwort gesendet: ja, 24.421 Kleine Anfragen + 1.462 Antworten + Beispiel-Paar 21/161 ↔ 21/381
3. Hofmann fragte nach: lässt sich „Verschiebung von Sach- zu Skandalisierungsanfragen" belegen? Wie weit reicht die Datenreihe zurück?
4. **Antwort #2 entworfen** (Tonalitäts-Analyse WP21 + Neutralitäts-Disclosure + 4 Operationalisierungs-Achsen) — **noch nicht final gesendet?** → morgen prüfen/abschließen

**Wenn Hofmann auf die Operationalisierungs-Offerte einsteigt:** das wäre echte Forschungs-Arbeit (~10-20h, ~$50-100 LLM). Dann brauchst du von ihr eine konkrete Operationalisierung von „Skandalisierung". Vorbereitet sein.

**Daten-Befund aus heute (für spätere Konversation parat):**
- Kleine Anfragen Tonalität gesamt: fordernd 53,8 % · kritisch 21,9 % · sachlich 18,9 % · informierend 5,4 %
- AfD hat höchsten Sachlich-Anteil (24 %) unter Oppositionsfraktionen — methodisch interessant
- Datenreihe nur WP21 (seit 31.03.2025), kein Mehr-WP-Trend möglich

---

## Pipeline für morgen — priorisiert

### A. Inbox + Konversation (zuerst, ~15 Min)
1. **Inbox-Check** `hallo@jinsheng-chen.de`: Bounces? Neue Antworten?
2. **Hofmann-Antwort #2** final senden, falls heute Abend nicht raus
3. **Push-Notifications** auf Handy aktivieren (falls noch nicht)
4. Bei neuen Antworten: **nicht hektisch** antworten — Holding-Mail wenn nötig, sonst mit Ruhe

### B. Working-Tree committen (~20 Min)
Heute entstand uncommitteter Code. Track-isolierte Commits empfohlen:
1. „Methodik: dynamische Counts + DATA-SOURCES §0 Schritt 8" — `methodik/page.tsx`, `docs/DATA-SOURCES.md`
2. „Design: Blau-Akzent → zinc, einheitliche CV-Sektionen" — `globals.css`, `PoliticianCV.tsx`
3. „Routing: Linear-Design unter / (Rewrite)" — `next.config.ts`, `SiteChrome.tsx`
4. „Impressum/Datenschutz: Mail auf hallo@jinsheng-chen.de" — `impressum/page.tsx`, `datenschutz/page.tsx`
5. `docs/cold-email-targets.md` ist noch untracked — mit reinnehmen

### C. Methodik-Seite: bekannte Limitation ergänzen (~15 Min)
Hofmann hat die Lücke gefunden: **nur WP21-Daten, keine historische Tiefe**. Sollte transparent auf `/methodik` unter „Bekannte Pipeline-Pathologien" dokumentiert werden — bevor der nächste Reviewer dieselbe Frage stellt.

### D. Optional / nach Energie
- `outreach-log.md` als eigene Datei pflegen (diese Tabelle hier rausziehen)
- Bei Matzat/Lewandowsky-Bounce: Alternativ-Adressen recherchieren

---

## Mittelfristig im Blick (nicht morgen)

- **1 Landtag als Proof-of-Concept bauen** (Berlin oder NRW) — *vor* jedem Förder-Pitch. Roadmap-Ambition (16 Landtage) braucht einen echten Skalierungs-Beleg, nicht nur einen Plan.
- **Frage↔Antwort-Verlinkung in der UI** — in der Hofmann-Mail #1 zugesagt („nächster Pipeline-Schritt"). Soft commitment, einlösen.
- **Förder-Pfad:** Prototype Fund (BMBF+OKF, 47.500 €, 6 Monate) — realistischer Antrag erst Frühjahr 2027 mit Track-Record + 3-5 Endorsements + 1 Landtag-Proof. Litta (OKF, war im Cold-Mail-Pool) wäre interner Bezug.
- **Fraktions-Tonalitäts-Tabelle** auf `/methodik` ist noch statischer Snapshot (Stand 13.05.) — dynamisch machen via neuer DB-Funktion `getTonalitatByFraktion()`.

---

## Offene Entscheidungen

- Hofmann-Antwort #2: Neutralitäts-Block deklarativ umformulieren oder so lassen? (Geschmacksfrage, beides OK)
- Bei Hofmann-Einstieg auf Operationalisierungs-Offerte: bereit, die Forschungs-Arbeit zu übernehmen?
- Tier-2-Cold-Mail-Welle (Litta, Schroeder, Pausch, Schulz, Stier …) — nur falls Erst-Welle nach 7-10 Tagen dünn bleibt. Nicht voreilig.

---

## Erinnerung an dich selbst

Heute war ein Sprint-Tag mit massivem Output. **Morgen kein zweiter Sprint** — ruhiger, dokumentierter arbeiten. Eine positive Antwort (Hofmann) ist ein Datenpunkt, keine Markt-Bestätigung. Erst-Welle abwarten, dann bewerten.
